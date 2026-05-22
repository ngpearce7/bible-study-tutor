import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

const passageMarkup = v.object({
  key: v.string(),
  kind: v.union(v.literal("notice"), v.literal("question"), v.literal("truth"), v.literal("apply")),
  label: v.string(),
  note: v.optional(v.string()),
  reference: v.string(),
  verse: v.number()
});
const reviewPreset = v.union(v.literal("tomorrow"), v.literal("three-days"), v.literal("next-week"), v.literal("next-month"));

export const ensureProfile = mutation({
  args: {
    clientKey: v.optional(v.string()),
    displayName: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    const now = Date.now();

    const authUser = authUserId ? await ctx.db.get(authUserId) : null;
    const authProfileName = clampText(authUser?.name || authUser?.email || "", 80);
    const profileName = clampText(args.displayName || authProfileName, 80) || "Bible student";

    if (authUserId) {
      const authenticatedProfile = await ctx.db
        .query("profiles")
        .withIndex("by_auth_user_id", (q) => q.eq("authUserId", authUserId))
        .first();

      if (authenticatedProfile) {
        if (profileName && profileName !== "Bible student" && authenticatedProfile.displayName === "Bible student") {
          await ctx.db.patch(authenticatedProfile._id, {
            displayName: profileName,
            updatedAt: now
          });
        }

        return authenticatedProfile._id;
      }
    }

    const clientKey = clampText(args.clientKey || "", 200);
    const existingDeviceProfile = clientKey
      ? await ctx.db
          .query("profiles")
          .withIndex("by_client_key", (q) => q.eq("clientKey", clientKey))
          .first()
      : null;

    if (existingDeviceProfile) {
      if (authUserId) {
        if (!existingDeviceProfile.authUserId) {
          const profilePatch: { authUserId: Id<"users">; updatedAt: number; displayName?: string } = {
            authUserId,
            updatedAt: now
          };
          if (authProfileName && existingDeviceProfile.displayName === "Bible student") {
            profilePatch.displayName = authProfileName;
          }
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
        return existingDeviceProfile._id;
      }
    }

    const profileId = await ctx.db.insert("profiles", {
      authUserId: authUserId || undefined,
      clientKey: authUserId ? `auth:${authUserId}` : clientKey || `guest:${now}`,
      displayName: profileName,
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
    passageMarkups: v.optional(v.array(passageMarkup)),
    minutes: v.number(),
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
        stepTitle: v.string(),
        answer: v.string()
      })
    )
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);
    const cleaned = {
      profileId: args.profileId,
      passage: clampText(args.passage, 160),
      methodId: clampText(args.methodId, 80),
      methodName: clampText(args.methodName, 120),
      shareNote: clampOptionalText(args.shareNote, 1200),
      passageMarkups: cleanPassageMarkups(args.passageMarkups),
      minutes: clampNumber(args.minutes, 0, 600),
      coachingMoments: cleanCoachingMoments(args.coachingMoments),
      answers: cleanAnswers(args.answers)
    };

    const sessionId = await ctx.db.insert("sessions", {
      ...cleaned,
      completedAt: Date.now()
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

export const getDeeperFeedback = action({
  args: {
    passageReference: v.string(),
    passageText: v.optional(v.string()),
    methodName: v.string(),
    stepTitle: v.string(),
    stepPrompt: v.string(),
    answer: v.string(),
    localFeedback: v.array(v.string())
  },
  handler: async (_ctx, args) => {
    const localFeedback = args.localFeedback.slice(0, 5).map((item) => clampText(item, 500));
    const fallback = {
      encouragement: localFeedback[0] || "You are engaging the passage thoughtfully.",
      textGrounding: "Look for one word, action, image, or claim in the passage that supports your answer.",
      nextRevision: localFeedback[1] || "Revise this by adding one concrete detail from the selected passage.",
      source: "local" as const
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return fallback;

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.OPENAI_TUTOR_MODEL || "gpt-5.4-mini",
          reasoning: { effort: "low" },
          input: [
            {
              role: "system",
              content:
                "You are a gentle Bible study tutor. Give concise, non-guilt-based coaching. Keep feedback tied to the selected passage and method. Do not invent historical background. Do not write the student's answer for them."
            },
            {
              role: "user",
              content: JSON.stringify({
                passageReference: clampText(args.passageReference, 160),
                passageText: clampOptionalText(args.passageText, 3000),
                methodName: clampText(args.methodName, 120),
                stepTitle: clampText(args.stepTitle, 120),
                stepPrompt: clampText(args.stepPrompt, 1000),
                studentAnswer: clampText(args.answer, 8000),
                localFeedback
              })
            }
          ],
          text: {
            format: {
              type: "json_schema",
              name: "bible_tutor_feedback",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                required: ["encouragement", "textGrounding", "nextRevision"],
                properties: {
                  encouragement: {
                    type: "string",
                    description: "One warm sentence naming what is working in the student's answer."
                  },
                  textGrounding: {
                    type: "string",
                    description: "One concise suggestion for tying the answer more closely to the passage."
                  },
                  nextRevision: {
                    type: "string",
                    description: "One concrete revision prompt the student can act on."
                  }
                }
              }
            }
          },
          max_output_tokens: 500
        })
      });

      if (!response.ok) return fallback;

      const data = await response.json();
      const outputText = extractOutputText(data);
      if (!outputText) return fallback;

      const parsed = JSON.parse(outputText);
      return {
        encouragement: clampText(String(parsed.encouragement || fallback.encouragement), 500),
        textGrounding: clampText(String(parsed.textGrounding || fallback.textGrounding), 500),
        nextRevision: clampText(String(parsed.nextRevision || fallback.nextRevision), 500),
        source: "openai" as const
      };
    } catch {
      return fallback;
    }
  }
});

function extractOutputText(data: any) {
  if (typeof data.output_text === "string") return data.output_text;

  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }

  return "";
}

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
    stepIndex: v.number(),
    answers: v.array(
      v.object({
        stepTitle: v.string(),
        answer: v.string()
      })
    )
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);
    const cleaned = {
      profileId: args.profileId,
      passage: clampText(args.passage, 160),
      passageReference: clampOptionalText(args.passageReference, 160),
      passageText: clampOptionalText(args.passageText, 30000),
      translationName: clampOptionalText(args.translationName, 120),
      passageMarkups: cleanPassageMarkups(args.passageMarkups),
      methodId: clampText(args.methodId, 80),
      methodName: clampText(args.methodName, 120),
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
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    return await ctx.db
      .query("drafts")
      .withIndex("by_profile_updated", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(args.limit ?? 12);
  }
});

export const deleteDraft = mutation({
  args: {
    profileId: v.id("profiles"),
    draftId: v.id("drafts")
  },
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
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.profileId !== args.profileId) return false;

    await ctx.db.delete(args.sessionId);
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
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    return await ctx.db
      .query("sessions")
      .withIndex("by_profile_completed", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(args.limit ?? 20);
  }
});

export const dueStudyReviews = query({
  args: {
    profileId: v.id("profiles"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    return await ctx.db
      .query("sessions")
      .withIndex("by_profile_review_status_and_review_at", (q) =>
        q.eq("profileId", args.profileId).eq("reviewStatus", "scheduled").lte("reviewAt", Date.now())
      )
      .order("asc")
      .take(args.limit ?? 10);
  }
});

export const stats = query({
  args: {
    profileId: v.id("profiles"),
    timezoneOffsetMinutes: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    const [sessions, checkins, memoryVerses, usageEvents] = await Promise.all([
      ctx.db
      .query("sessions")
      .withIndex("by_profile_completed", (q) => q.eq("profileId", args.profileId))
        .collect(),
      ctx.db
        .query("checkins")
        .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
        .collect(),
      ctx.db
        .query("memoryVerses")
        .withIndex("by_profile_updated", (q) => q.eq("profileId", args.profileId))
        .collect(),
      ctx.db
        .query("usageEvents")
        .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
        .collect()
    ]);

    const timezoneOffsetMinutes = args.timezoneOffsetMinutes ?? 0;
    const activityTimestamps = [
      ...sessions.map((session) => session.completedAt),
      ...checkins.map((checkin) => checkin.createdAt),
      ...memoryVerses.flatMap((verse) => [verse.createdAt, verse.lastReviewedAt].filter(isNumber)),
      ...usageEvents.filter((event) => countsTowardScriptureRhythm(event.eventType)).map((event) => event.createdAt)
    ];

    const dates = Array.from(new Set(activityTimestamps.map((timestamp) => dayKey(timestamp, timezoneOffsetMinutes)))).sort();

    return {
      sessionCount: sessions.length,
      minutes: sessions.reduce((total, session) => total + session.minutes, 0),
      currentStreak: currentStreak(dates, timezoneOffsetMinutes),
      bestStreak: bestStreak(dates)
    };
  }
});

async function authorizeProfileAccess(ctx: QueryCtx | MutationCtx, profileId: Id<"profiles">) {
  const profile = await ctx.db.get(profileId);
  if (!profile) throw new Error("Profile not found");

  const authUserId = await getAuthUserId(ctx);
  if (authUserId && profile.authUserId !== authUserId) throw new Error("Unauthorized");

  return profile;
}

async function maybeNotifyFirstNonAdminRegistration(
  ctx: MutationCtx,
  args: { profileId: Id<"profiles">; email?: string; name?: string; now: number }
) {
  if (!args.email || isAdminEmail(args.email)) return;

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
    if (user?.email && !isAdminEmail(user.email)) nonAdminSignedInCount += 1;
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

function cleanAnswers(answers: { stepTitle: string; answer: string }[]) {
  return answers.slice(0, 20).map((item) => ({
    stepTitle: clampText(item.stepTitle, 120),
    answer: clampText(item.answer, 12000)
  }));
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
  let count = 0;
  const today = dayKey(Date.now(), timezoneOffsetMinutes);
  const cursor = new Date(today);

  if (!dates.includes(today)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!dates.includes(dayKey(cursor.getTime()))) return 0;
  }

  while (dates.includes(dayKey(cursor.getTime()))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return count;
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
    "bible_search",
    "bookmark_saved",
    "chapter_read",
    "checkin_saved",
    "memory_saved",
    "study_completed",
    "worksheet_printed"
  ].includes(eventType);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
