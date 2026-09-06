import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { assertProfileCanWrite, enforceRecentLimit } from "./security";
import { adjustStudyTotals, recordStudyActivity } from "./statisticsModel";
import { v } from "convex/values";

const passageMarkup = v.object({
  key: v.string(),
  kind: v.union(v.literal("notice"), v.literal("question"), v.literal("truth"), v.literal("apply")),
  label: v.string(),
  note: v.optional(v.string()),
  reference: v.string(),
  verse: v.number()
});
const studyMethodState = v.object({
  focusText: v.optional(v.string()),
  focusVerseKeys: v.optional(v.array(v.string())),
  evidenceVerseKeys: v.optional(v.array(v.string())),
  reviewReadActionTomorrow: v.optional(v.boolean())
});
const reviewPreset = v.union(v.literal("tomorrow"), v.literal("three-days"), v.literal("next-week"), v.literal("next-month"));
const USERNAME_AUTH_DOMAIN = "username.biblestudytutor.local";

function usernameFromCredential(value?: string) {
  const email = (value || "").trim().toLowerCase();
  if (!email.endsWith(`@${USERNAME_AUTH_DOMAIN}`)) return "";
  return email.slice(0, -1 * (`@${USERNAME_AUTH_DOMAIN}`).length);
}

function isUsernameCredential(value?: string) {
  return !!usernameFromCredential(value);
}

export const ensureProfile = mutation({
  args: {
    clientKey: v.optional(v.string()),
    displayName: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    const now = Date.now();

    const authUser = authUserId ? await ctx.db.get(authUserId) : null;
    const authAccounts = authUserId
      ? await ctx.db
          .query("authAccounts")
          .withIndex("userIdAndProvider", (q) => q.eq("userId", authUserId).eq("provider", "password"))
          .collect()
      : [];
    const passwordCredential = authAccounts[0]?.providerAccountId;
    const authUsername = usernameFromCredential(passwordCredential || authUser?.email);
    const authLoginKind = authUsername ? "username" : authUserId ? (authAccounts[0] ? "email" : "oauth") : undefined;
    const authProfileName = clampText(authUser?.name || authUser?.email || "", 80);
    const profileName = clampText(args.displayName || authProfileName, 80) || "Bible student";

    if (authUserId) {
      const authenticatedProfile = await ctx.db
        .query("profiles")
        .withIndex("by_auth_user_id", (q) => q.eq("authUserId", authUserId))
        .first();

      if (authenticatedProfile) {
        const profilePatch: {
          displayName?: string;
          username?: string;
          normalizedUsername?: string;
          accountLoginKind?: "email" | "username" | "oauth";
          updatedAt?: number;
        } = {};
        if (profileName && profileName !== "Bible student" && authenticatedProfile.displayName === "Bible student") {
          profilePatch.displayName = profileName;
        }
        if (authUsername && !authenticatedProfile.normalizedUsername) {
          profilePatch.username = authUsername;
          profilePatch.normalizedUsername = authUsername;
        }
        if (authLoginKind && !authenticatedProfile.accountLoginKind) profilePatch.accountLoginKind = authLoginKind;
        if (Object.keys(profilePatch).length > 0) {
          profilePatch.updatedAt = now;
          await ctx.db.patch(authenticatedProfile._id, profilePatch);
        }

        return authenticatedProfile._id;
      }
    }

    const clientKey = clampText(args.clientKey || "", 200);
    const localClientKey = clientKey ? `local:${clientKey}` : "";
    const existingLocalProfile = !authUserId && localClientKey
      ? await ctx.db
          .query("profiles")
          .withIndex("by_client_key", (q) => q.eq("clientKey", localClientKey))
          .first()
      : null;
    if (existingLocalProfile) return existingLocalProfile._id;

    const existingDeviceProfile = clientKey
      ? await ctx.db
          .query("profiles")
          .withIndex("by_client_key", (q) => q.eq("clientKey", clientKey))
          .first()
      : null;

    if (existingDeviceProfile) {
      if (authUserId) {
        if (!existingDeviceProfile.authUserId) {
          const profilePatch: {
            authUserId: Id<"users">;
            updatedAt: number;
            displayName?: string;
            username?: string;
            normalizedUsername?: string;
            accountLoginKind?: "email" | "username" | "oauth";
          } = {
            authUserId,
            updatedAt: now
          };
          if (authProfileName && existingDeviceProfile.displayName === "Bible student") {
            profilePatch.displayName = authProfileName;
          }
          if (authUsername) {
            profilePatch.username = authUsername;
            profilePatch.normalizedUsername = authUsername;
          }
          if (authLoginKind) profilePatch.accountLoginKind = authLoginKind;
          await ctx.db.patch(existingDeviceProfile._id, profilePatch);
          await maybeNotifyFirstNonAdminRegistration(ctx, {
            profileId: existingDeviceProfile._id,
            email: authUser?.email,
            name: profilePatch.displayName || existingDeviceProfile.displayName,
            now
          });
          return existingDeviceProfile._id;
        }

        if (existingDeviceProfile.authUserId === authUserId) return existingDeviceProfile._id;
      } else {
        if (!existingDeviceProfile.authUserId) return existingDeviceProfile._id;
      }
    }

    const profileId = await ctx.db.insert("profiles", {
      authUserId: authUserId || undefined,
      clientKey: authUserId ? `auth:${authUserId}` : localClientKey || clientKey || `guest:${now}`,
      displayName: profileName,
      username: authUsername || undefined,
      normalizedUsername: authUsername || undefined,
      accountLoginKind: authLoginKind,
      createdAt: now,
      updatedAt: now
    });
    await maybeNotifyFirstNonAdminRegistration(ctx, {
      profileId,
      email: authUser?.email,
      name: profileName,
      now
    });
    return profileId;
  }
});

export const saveSession = mutation({
  args: {
    profileId: v.id("profiles"),
    passage: v.string(),
    methodId: v.string(),
    methodName: v.string(),
    shareNote: v.optional(v.string()),
    skippedStepTitles: v.optional(v.array(v.string())),
    skippedStepIds: v.optional(v.array(v.string())),
    methodState: v.optional(studyMethodState),
    passageMarkups: v.optional(v.array(passageMarkup)),
    minutes: v.number(),
    localDayKey: v.optional(v.string()),
    coachingMoments: v.optional(
      v.array(
        v.object({
          stepTitle: v.string(),
          encouragement: v.string(),
          textGrounding: v.string(),
          nextRevision: v.string()
        })
      )
    ),
    answers: v.array(
      v.object({
        stepId: v.optional(v.string()),
        stepTitle: v.string(),
        answer: v.string()
      })
    )
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);
    const recentSessions = await ctx.db
      .query("sessions")
      .withIndex("by_profile_completed", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(30);
    await enforceRecentLimit(ctx, args.profileId, recentSessions, "completedAt", { max: 30, windowMs: 60 * 60 * 1000, label: "Completed study" });
    const cleaned = {
      profileId: args.profileId,
      passage: clampText(args.passage, 160),
      methodId: clampText(args.methodId, 80),
      methodName: clampText(args.methodName, 120),
      shareNote: clampOptionalText(args.shareNote, 1200),
      skippedStepTitles: cleanStepTitles(args.skippedStepTitles),
      skippedStepIds: cleanStepIds(args.skippedStepIds),
      methodState: cleanStudyMethodState(args.methodState),
      passageMarkups: cleanPassageMarkups(args.passageMarkups),
      minutes: clampNumber(args.minutes, 0, 600),
      coachingMoments: cleanCoachingMoments(args.coachingMoments),
      answers: cleanAnswers(args.answers)
    };
    if (!cleaned.answers.some((item) => item.answer.length > 0)) {
      throw new Error("Complete at least one written response before saving this study.");
    }

    const completedAt = Date.now();
    const sessionId = await ctx.db.insert("sessions", {
      ...cleaned,
      completedAt
    });
    await recordStudyActivity(ctx, {
      profileId: args.profileId,
      timestamp: completedAt,
      localDayKey: args.localDayKey,
      increments: { studiesCompleted: 1 },
      sessionDelta: 1,
      minuteDelta: cleaned.minutes
    });

    const draft = await ctx.db
      .query("drafts")
      .withIndex("by_profile_passage_method", (q) =>
        q.eq("profileId", args.profileId).eq("passage", cleaned.passage).eq("methodId", cleaned.methodId)
      )
      .first();

    if (draft) await ctx.db.delete(draft._id);

    return sessionId;
  }
});

export const saveDraft = mutation({
  args: {
    profileId: v.id("profiles"),
    passage: v.string(),
    passageReference: v.optional(v.string()),
    passageText: v.optional(v.string()),
    translationName: v.optional(v.string()),
    passageMarkups: v.optional(v.array(passageMarkup)),
    methodId: v.string(),
    methodName: v.string(),
    shareNote: v.optional(v.string()),
    skippedStepTitles: v.optional(v.array(v.string())),
    skippedStepIds: v.optional(v.array(v.string())),
    methodState: v.optional(studyMethodState),
    stepIndex: v.number(),
    answers: v.array(
      v.object({
        stepId: v.optional(v.string()),
        stepTitle: v.string(),
        answer: v.string()
      })
    )
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);
    const recentDrafts = await ctx.db
      .query("drafts")
      .withIndex("by_profile_updated", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(180);
    await enforceRecentLimit(ctx, args.profileId, recentDrafts, "updatedAt", { max: 180, windowMs: 60 * 60 * 1000, label: "Draft save" });
    const cleaned = {
      profileId: args.profileId,
      passage: clampText(args.passage, 160),
      passageReference: clampOptionalText(args.passageReference, 160),
      passageText: clampOptionalText(args.passageText, 30000),
      translationName: clampOptionalText(args.translationName, 120),
      passageMarkups: cleanPassageMarkups(args.passageMarkups),
      methodId: clampText(args.methodId, 80),
      methodName: clampText(args.methodName, 120),
      shareNote: clampOptionalText(args.shareNote, 1200),
      skippedStepTitles: cleanStepTitles(args.skippedStepTitles),
      skippedStepIds: cleanStepIds(args.skippedStepIds),
      methodState: cleanStudyMethodState(args.methodState),
      stepIndex: clampNumber(args.stepIndex, 0, 20),
      answers: cleanAnswers(args.answers)
    };

    const existing = await ctx.db
      .query("drafts")
      .withIndex("by_profile_passage_method", (q) =>
        q.eq("profileId", args.profileId).eq("passage", cleaned.passage).eq("methodId", cleaned.methodId)
      )
      .first();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        passageReference: cleaned.passageReference,
        passageText: cleaned.passageText,
        translationName: cleaned.translationName,
        passageMarkups: cleaned.passageMarkups,
        methodName: cleaned.methodName,
        shareNote: cleaned.shareNote,
        skippedStepTitles: cleaned.skippedStepTitles,
        skippedStepIds: cleaned.skippedStepIds,
        methodState: cleaned.methodState,
        stepIndex: cleaned.stepIndex,
        answers: cleaned.answers,
        updatedAt: now
      });
      return existing._id;
    }

    return await ctx.db.insert("drafts", {
      ...cleaned,
      createdAt: now,
      updatedAt: now
    });
  }
});

export const draftForPassage = query({
  args: {
    profileId: v.id("profiles"),
    passage: v.string(),
    methodId: v.string()
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    return await ctx.db
      .query("drafts")
      .withIndex("by_profile_passage_method", (q) =>
        q.eq("profileId", args.profileId).eq("passage", args.passage).eq("methodId", args.methodId)
      )
      .first();
  }
});

export const recentDrafts = query({
  args: {
    profileId: v.id("profiles"),
    limit: v.optional(v.number())
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);
    const limit = clampNumber(args.limit ?? 12, 1, 50);

    return await ctx.db
      .query("drafts")
      .withIndex("by_profile_updated", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(limit);
  }
});

export const deleteDraft = mutation({
  args: {
    profileId: v.id("profiles"),
    draftId: v.id("drafts")
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.profileId !== args.profileId) return false;

    await ctx.db.delete(args.draftId);
    return true;
  }
});

export const deleteSession = mutation({
  args: {
    profileId: v.id("profiles"),
    sessionId: v.id("sessions")
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.profileId !== args.profileId) return false;

    await ctx.db.delete(args.sessionId);
    await adjustStudyTotals(ctx, args.profileId, { sessionDelta: -1, minuteDelta: -session.minutes });
    return true;
  }
});

export const scheduleStudyReview = mutation({
  args: {
    profileId: v.id("profiles"),
    sessionId: v.id("sessions"),
    preset: v.optional(reviewPreset),
    customDays: v.optional(v.number())
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.profileId !== args.profileId) throw new Error("Study not found");

    const reviewAt = args.customDays ? customReviewTimestamp(args.customDays) : reviewTimestamp(args.preset || "next-week");
    await ctx.db.patch(args.sessionId, {
      reviewStatus: "scheduled",
      reviewAt,
      reviewedAt: undefined,
      reviewNote: undefined
    });
    return reviewAt;
  }
});

export const completeStudyReview = mutation({
  args: {
    profileId: v.id("profiles"),
    sessionId: v.id("sessions"),
    reviewNote: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.profileId !== args.profileId) throw new Error("Study not found");

    await ctx.db.patch(args.sessionId, {
      reviewStatus: "reviewed",
      reviewedAt: Date.now(),
      reviewNote: clampOptionalText(args.reviewNote, 2000)
    });
    return true;
  }
});

export const recentSessions = query({
  args: {
    profileId: v.id("profiles"),
    limit: v.optional(v.number())
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);
    const limit = clampNumber(args.limit ?? 20, 1, 50);

    return await ctx.db
      .query("sessions")
      .withIndex("by_profile_completed", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(limit);
  }
});

export const dueStudyReviews = query({
  args: {
    profileId: v.id("profiles"),
    now: v.optional(v.number()),
    limit: v.optional(v.number())
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);
    const limit = clampNumber(args.limit ?? 10, 1, 50);

    return await ctx.db
      .query("sessions")
      .withIndex("by_profile_review_status_and_review_at", (q) =>
        q.eq("profileId", args.profileId).eq("reviewStatus", "scheduled").lte("reviewAt", args.now ?? 0)
      )
      .order("asc")
      .take(limit);
  }
});

export const stats = query({
  args: {
    profileId: v.id("profiles"),
    timezoneOffsetMinutes: v.optional(v.number())
  },
  returns: v.object({
    sessionCount: v.number(),
    minutes: v.number(),
    currentStreak: v.number(),
    bestStreak: v.number(),
    migrationStatus: v.union(v.literal("pending"), v.literal("backfilling"), v.literal("ready")),
    weeklyRhythm: v.object({
      activeDays: v.number(),
      planReadingsCompleted: v.number(),
      chaptersRead: v.number(),
      studiesCompleted: v.number(),
      memoryReviews: v.number(),
      memoryMeditations: v.number(),
      memorySaved: v.number(),
      worksheetsPrinted: v.number(),
      memoryCardsPrinted: v.number(),
      encouragementsShared: v.number(),
      bookmarksSaved: v.number(),
      strongestArea: v.string()
    }),
    rhythmGrace: v.union(v.null(), v.object({ missedDate: v.string(), latestActivityDate: v.string() }))
  }),
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);
    const [aggregate, dailyRows] = await Promise.all([
      ctx.db.query("studyStats").withIndex("by_profile", (q) => q.eq("profileId", args.profileId)).unique(),
      ctx.db.query("studyDailyStats").withIndex("by_profile_and_day_key", (q) => q.eq("profileId", args.profileId)).order("desc").take(400)
    ]);
    const dates = dailyRows.map((row) => row.dayKey).sort();
    const rhythm = currentStreak(dates, args.timezoneOffsetMinutes ?? 0);
    const weeklyRhythm = buildIncrementalWeeklyRhythmSummary(dailyRows, args.timezoneOffsetMinutes ?? 0);

    return {
      sessionCount: aggregate?.sessionCount ?? 0,
      minutes: aggregate?.minutes ?? 0,
      currentStreak: rhythm.current,
      bestStreak: Math.max(aggregate?.bestStreak ?? 0, bestStreak(dates), rhythm.current),
      migrationStatus: aggregate?.migrationStatus ?? "pending",
      weeklyRhythm,
      rhythmGrace: rhythm.graceUsed
        ? {
            missedDate: rhythm.missedDate,
            latestActivityDate: rhythm.latestActivityDate
          }
        : null
    };
  }
});

function buildIncrementalWeeklyRhythmSummary(
  rows: Array<{
    dayKey: string;
    studiesCompleted: number;
    planReadingsCompleted: number;
    planReadingsOpened: number;
    chaptersRead: number;
    bibleSearches: number;
    memoryReviews: number;
    memoryMeditations: number;
    memorySaved: number;
    worksheetsPrinted: number;
    memoryCardsPrinted: number;
    encouragementsShared: number;
    bookmarksSaved: number;
  }>,
  timezoneOffsetMinutes: number
) {
  const today = dayKey(Date.now(), timezoneOffsetMinutes);
  const weekStart = addDaysToDateKey(today, -6);
  const week = rows.filter((row) => row.dayKey >= weekStart && row.dayKey <= today);
  const total = (key: Exclude<keyof (typeof rows)[number], "dayKey">) => week.reduce((sum, row) => sum + row[key], 0);
  const planReadingsCompleted = total("planReadingsCompleted");
  const chaptersRead = total("chaptersRead");
  const studiesCompleted = total("studiesCompleted");
  const memoryReviews = total("memoryReviews");
  const memoryMeditations = total("memoryMeditations");
  const memorySaved = total("memorySaved");
  const worksheetsPrinted = total("worksheetsPrinted");
  const memoryCardsPrinted = total("memoryCardsPrinted");
  const encouragementsShared = total("encouragementsShared");
  const bookmarksSaved = total("bookmarksSaved");
  const areaScores = [
    { area: "Bible reading", score: planReadingsCompleted + total("planReadingsOpened") + chaptersRead + total("bibleSearches") },
    { area: "Memory", score: memoryReviews + memoryMeditations + memorySaved + memoryCardsPrinted },
    { area: "Guided study", score: studiesCompleted + worksheetsPrinted },
    { area: "Encouragement", score: encouragementsShared + bookmarksSaved }
  ].sort((left, right) => right.score - left.score);
  return {
    activeDays: week.length,
    planReadingsCompleted,
    chaptersRead,
    studiesCompleted,
    memoryReviews,
    memoryMeditations,
    memorySaved,
    worksheetsPrinted,
    memoryCardsPrinted,
    encouragementsShared,
    bookmarksSaved,
    strongestArea: areaScores[0]?.score ? areaScores[0].area : ""
  };
}

async function authorizeProfileAccess(ctx: QueryCtx | MutationCtx, profileId: Id<"profiles">) {
  const profile = await ctx.db.get(profileId);
  if (!profile) throw new Error("Profile not found");

  const authUserId = await getAuthUserId(ctx);
  if (profile.authUserId && !authUserId) throw new Error("Unauthorized");
  if (authUserId && profile.authUserId !== authUserId) throw new Error("Unauthorized");

  return profile;
}

async function maybeNotifyFirstNonAdminRegistration(
  ctx: MutationCtx,
  args: { profileId: Id<"profiles">; email?: string; name?: string; now: number }
) {
  if (!args.email || isUsernameCredential(args.email) || isAdminEmail(args.email)) return;

  const notificationKey = "first-non-admin-registration";
  const existingNotification = await ctx.db
    .query("adminNotificationState")
    .withIndex("by_key", (q) => q.eq("key", notificationKey))
    .first();
  if (existingNotification) return;

  const profiles = await ctx.db.query("profiles").collect();
  let nonAdminSignedInCount = 0;

  for (const profile of profiles) {
    if (!profile.authUserId) continue;
    const user = await ctx.db.get(profile.authUserId);
    if (user?.email && !isUsernameCredential(user.email) && !isAdminEmail(user.email)) nonAdminSignedInCount += 1;
  }

  if (nonAdminSignedInCount !== 1) return;

  await ctx.db.insert("adminNotificationState", {
    key: notificationKey,
    profileId: args.profileId,
    email: args.email,
    name: args.name,
    triggeredAt: args.now
  });

  await ctx.scheduler.runAfter(0, internal.adminNotifications.sendFirstUserRegisteredEmail, {
    email: args.email,
    name: args.name,
    profileId: args.profileId,
    registeredAt: args.now
  });
}

function isAdminEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
}

function clampText(value: string | undefined, maxLength: number) {
  return (value || "").trim().slice(0, maxLength);
}

function clampOptionalText(value: string | undefined, maxLength: number) {
  const cleaned = clampText(value, maxLength);
  return cleaned || undefined;
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function cleanAnswers(answers: { stepId?: string; stepTitle: string; answer: string }[]) {
  return answers.slice(0, 20).map((item) => ({
    stepId: clampOptionalText(item.stepId, 80),
    stepTitle: clampText(item.stepTitle, 120),
    answer: clampText(item.answer, 12000)
  }));
}

function cleanStepIds(stepIds: string[] | undefined) {
  if (!stepIds?.length) return undefined;
  const cleaned = Array.from(new Set(stepIds.map((id) => clampText(id, 80)).filter(Boolean))).slice(0, 20);
  return cleaned.length ? cleaned : undefined;
}

function cleanStepTitles(stepTitles: string[] | undefined) {
  if (!stepTitles?.length) return undefined;
  const cleaned = Array.from(new Set(stepTitles.map((title) => clampText(title, 120)).filter(Boolean))).slice(0, 20);
  return cleaned.length ? cleaned : undefined;
}

function cleanStudyMethodState(state: {
  focusText?: string;
  focusVerseKeys?: string[];
  evidenceVerseKeys?: string[];
  reviewReadActionTomorrow?: boolean;
} | undefined) {
  if (!state) return undefined;
  const focusText = clampOptionalText(state.focusText, 1200);
  const cleanVerseKeys = (keys: string[] | undefined) => {
    const cleaned = Array.from(new Set((keys || []).map((key) => clampText(key, 120)).filter(Boolean))).slice(0, 40);
    return cleaned.length ? cleaned : undefined;
  };
  const focusVerseKeys = cleanVerseKeys(state.focusVerseKeys);
  const evidenceVerseKeys = cleanVerseKeys(state.evidenceVerseKeys);
  const reviewReadActionTomorrow = state.reviewReadActionTomorrow || undefined;
  if (!focusText && !focusVerseKeys && !evidenceVerseKeys && !reviewReadActionTomorrow) return undefined;
  return { focusText, focusVerseKeys, evidenceVerseKeys, reviewReadActionTomorrow };
}

function cleanCoachingMoments(
  moments: { stepTitle: string; encouragement: string; textGrounding: string; nextRevision: string }[] | undefined
) {
  return moments?.slice(0, 20).map((item) => ({
    stepTitle: clampText(item.stepTitle, 120),
    encouragement: clampText(item.encouragement, 500),
    textGrounding: clampText(item.textGrounding, 500),
    nextRevision: clampText(item.nextRevision, 500)
  }));
}

function cleanPassageMarkups(markups: { key: string; kind: "notice" | "question" | "truth" | "apply"; label: string; note?: string; reference: string; verse: number }[] | undefined) {
  return markups?.slice(0, 300).map((item) => ({
    key: clampText(item.key, 120),
    kind: item.kind,
    label: clampText(item.label, 80),
    note: clampOptionalText(item.note, 1000),
    reference: clampText(item.reference, 160),
    verse: clampNumber(item.verse, 0, 200)
  }));
}

function dayKey(value: number, timezoneOffsetMinutes = 0) {
  return new Date(value - timezoneOffsetMinutes * 60 * 1000).toISOString().slice(0, 10);
}

function reviewTimestamp(preset: "tomorrow" | "three-days" | "next-week" | "next-month") {
  const days =
    preset === "tomorrow"
      ? 1
      : preset === "three-days"
        ? 3
        : preset === "next-week"
          ? 7
          : 30;
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

function customReviewTimestamp(daysFromNow: number) {
  const days = Math.floor(daysFromNow);
  if (!Number.isFinite(days) || days < 1 || days > 365) throw new Error("Choose 1 to 365 days");
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

function currentStreak(dates: string[], timezoneOffsetMinutes = 0) {
  const today = dayKey(Date.now(), timezoneOffsetMinutes);
  const activeDays = new Set(dates);
  const latestActiveDay = [...activeDays].reverse().find((date) => date <= today);
  if (!latestActiveDay) return { current: 0, graceUsed: false, missedDate: "", latestActivityDate: "" };

  const daysSinceLatestActivity = daysBetweenDateKeys(latestActiveDay, today);
  if (daysSinceLatestActivity > 2) return { current: 0, graceUsed: false, missedDate: "", latestActivityDate: latestActiveDay };

  let count = 0;
  let graceDaysUsed = Math.max(0, daysSinceLatestActivity - 1);
  const initialGraceUsed = graceDaysUsed > 0;
  let missedDate = initialGraceUsed ? addDaysToDateKey(latestActiveDay, 1) : "";
  let cursor = latestActiveDay;

  while (activeDays.has(cursor)) {
    count += 1;
    const previousDay = addDaysToDateKey(cursor, -1);
    if (activeDays.has(previousDay)) {
      cursor = previousDay;
      continue;
    }

    const dayBeforePrevious = addDaysToDateKey(previousDay, -1);
    if (graceDaysUsed < 1 && activeDays.has(dayBeforePrevious)) {
      graceDaysUsed += 1;
      missedDate = previousDay;
      cursor = dayBeforePrevious;
      continue;
    }

    break;
  }

  return {
    current: count,
    graceUsed: graceDaysUsed > 0,
    missedDate,
    latestActivityDate: latestActiveDay
  };
}

function addDaysToDateKey(dateKeyValue: string, days: number) {
  const date = new Date(`${dateKeyValue}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetweenDateKeys(startDateKey: string, endDateKey: string) {
  const start = Date.parse(`${startDateKey}T00:00:00.000Z`);
  const end = Date.parse(`${endDateKey}T00:00:00.000Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return Number.POSITIVE_INFINITY;
  return Math.round((end - start) / 86400000);
}

function bestStreak(dates: string[]) {
  if (dates.length === 0) return 0;
  let best = 1;
  let active = 1;

  for (let index = 1; index < dates.length; index += 1) {
    const previous = new Date(dates[index - 1]);
    previous.setDate(previous.getDate() + 1);

    if (dayKey(previous.getTime()) === dates[index]) {
      active += 1;
      best = Math.max(best, active);
    } else {
      active = 1;
    }
  }

  return best;
}

function countsTowardScriptureRhythm(eventType: string) {
  return [
    "bible_reading_plan_day_completed",
    "bible_reading_plan_opened",
    "bible_reading_plan_studied",
    "bible_search",
    "bookmark_saved",
    "chapter_read",
    "checkin_saved",
    "memory_cards_doc_downloaded",
    "memory_cards_printed",
    "memory_saved",
    "study_completed",
    "study_insight_posted",
    "worksheet_printed"
  ].includes(eventType);
}

type RhythmSession = { completedAt: number };
type RhythmCheckin = { createdAt: number };
type RhythmMemoryVerse = { createdAt: number; lastReviewedAt?: number };
type RhythmMemoryHistoryEvent = { event: string; createdAt: number };
type RhythmUsageEvent = { eventType: string; createdAt: number };

function buildWeeklyRhythmSummary(args: {
  sessions: RhythmSession[];
  checkins: RhythmCheckin[];
  memoryVerses: RhythmMemoryVerse[];
  memoryHistory: RhythmMemoryHistoryEvent[];
  usageEvents: RhythmUsageEvent[];
  activeDates: string[];
  timezoneOffsetMinutes: number;
}) {
  const today = dayKey(Date.now(), args.timezoneOffsetMinutes);
  const weekStart = addDaysToDateKey(today, -6);
  const inCurrentWeek = (timestamp: number) => {
    const date = dayKey(timestamp, args.timezoneOffsetMinutes);
    return date >= weekStart && date <= today;
  };
  const activeDays = args.activeDates.filter((date) => date >= weekStart && date <= today).length;
  const eventCount = (...eventTypes: string[]) =>
    args.usageEvents.filter((event) => eventTypes.includes(event.eventType) && inCurrentWeek(event.createdAt)).length;
  const memoryReviewsFromHistory = args.memoryHistory.filter((event) => event.event === "reviewed" && inCurrentWeek(event.createdAt)).length;
  const memoryReviews =
    memoryReviewsFromHistory ||
    args.memoryVerses.filter((verse) => isNumber(verse.lastReviewedAt) && inCurrentWeek(verse.lastReviewedAt)).length;
  const memoryMeditations = args.memoryHistory.filter((event) => event.event === "meditated" && inCurrentWeek(event.createdAt)).length;
  const memorySavedFromHistory = args.memoryHistory.filter((event) => event.event === "added" && inCurrentWeek(event.createdAt)).length;
  const memorySaved = memorySavedFromHistory || eventCount("memory_saved");
  const planReadingsCompleted = eventCount("bible_reading_plan_day_completed");
  const planReadingsOpened = eventCount("bible_reading_plan_opened");
  const chaptersRead = eventCount("chapter_read");
  const bibleSearches = eventCount("bible_search");
  const studiesCompleted = args.sessions.filter((session) => inCurrentWeek(session.completedAt)).length;
  const worksheetsPrinted = eventCount("worksheet_printed");
  const memoryCardsPrinted = eventCount("memory_cards_printed", "memory_cards_doc_downloaded");
  const encouragementsShared = args.checkins.filter((checkin) => inCurrentWeek(checkin.createdAt)).length + eventCount("study_insight_posted");
  const bookmarksSaved = eventCount("bookmark_saved");
  const areaScores = [
    { area: "Bible reading", score: planReadingsCompleted + planReadingsOpened + chaptersRead + bibleSearches },
    { area: "Memory", score: memoryReviews + memoryMeditations + memorySaved + memoryCardsPrinted },
    { area: "Guided study", score: studiesCompleted + worksheetsPrinted },
    { area: "Encouragement", score: encouragementsShared + bookmarksSaved }
  ].sort((left, right) => right.score - left.score);
  const strongestArea = areaScores[0]?.score ? areaScores[0].area : "";

  return {
    activeDays,
    planReadingsCompleted,
    chaptersRead,
    studiesCompleted,
    memoryReviews,
    memoryMeditations,
    memorySaved,
    worksheetsPrinted,
    memoryCardsPrinted,
    encouragementsShared,
    bookmarksSaved,
    strongestArea
  };
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
