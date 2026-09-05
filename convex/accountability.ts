import { getAuthUserId, modifyAccountCredentials, retrieveAccount } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import { action, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { assertProfileCanWrite, enforceRecentLimit } from "./security";
import { recordStudyActivity } from "./statisticsModel";
import { v } from "convex/values";

const memoryMilestoneGoalIds = new Set([
  "reviewsToday",
  "reviewsThisWeek",
  "reviewDaysThisWeek",
  "totalReviews",
  "versesMemorized",
  "versesSaved",
  "booksCovered",
  "longestReviewRhythm",
  "currentReviewRhythm",
  "averagePracticePerDay",
  "practiceDaysThisMonth",
  "mostReviewedVerse",
  "dueVersesCleared",
  "firstTimeReviews"
]);
const USERNAME_AUTH_DOMAIN = "username.biblestudytutor.local";
const bibleTranslation = v.union(v.literal("bsb"), v.literal("web"), v.literal("kjv"));
const bibleReaderHistoryItem = v.object({
  book: v.string(),
  chapter: v.number(),
  reference: v.string(),
  translation: bibleTranslation,
  updatedAt: v.string()
});
const bibleBookmark = v.object({
  id: v.string(),
  book: v.string(),
  chapter: v.number(),
  startVerse: v.optional(v.number()),
  endVerse: v.optional(v.number()),
  reference: v.string(),
  bookmarked: v.optional(v.boolean()),
  note: v.optional(v.string()),
  createdAt: v.string()
});
const customBibleReadingPlanDay = v.object({
  day: v.number(),
  title: v.string(),
  reference: v.string(),
  readerBook: v.string(),
  readerChapter: v.number(),
  studyReference: v.string()
});
const customBibleReadingPlan = v.object({
  id: v.string(),
  title: v.string(),
  description: v.string(),
  source: v.literal("custom"),
  category: v.optional(v.string()),
  days: v.array(customBibleReadingPlanDay)
});
const bibleReadingPlanProgress = v.object({
  activePlanId: v.string(),
  followedPlanIds: v.optional(v.array(v.string())),
  completedDays: v.array(v.string()),
  customPlans: v.array(customBibleReadingPlan),
  startDates: v.optional(v.record(v.string(), v.string())),
  completedPlanDates: v.optional(v.record(v.string(), v.string())),
  completionCounts: v.optional(v.record(v.string(), v.number())),
  acknowledgedCareNotes: v.optional(v.array(v.string())),
  updatedAt: v.optional(v.number())
});
const syncedBibleReaderState = v.object({
  translation: v.optional(bibleTranslation),
  position: v.optional(v.object({ book: v.string(), chapter: v.number() })),
  history: v.optional(v.array(bibleReaderHistoryItem)),
  readChapters: v.optional(v.record(v.string(), v.array(v.number()))),
  bookmarks: v.optional(v.array(bibleBookmark)),
  readingPlanProgress: v.optional(bibleReadingPlanProgress)
});

function usernameFromCredential(value?: string) {
  const email = (value || "").trim().toLowerCase();
  if (!email.endsWith(`@${USERNAME_AUTH_DOMAIN}`)) return "";
  return email.slice(0, -1 * (`@${USERNAME_AUTH_DOMAIN}`).length);
}

function visibleAuthEmail(value?: string) {
  const email = (value || "").trim().toLowerCase();
  return usernameFromCredential(email) ? undefined : email || undefined;
}

export const savePlan = mutation({
  args: {
    profileId: v.id("profiles"),
    weeklyGoal: v.string(),
    accountabilityPartner: v.string(),
    preferredMethodId: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);

    await ctx.db.patch(args.profileId, {
      weeklyGoal: clampText(args.weeklyGoal, 300),
      accountabilityPartner: clampText(args.accountabilityPartner, 200),
      preferredMethodId: clampOptionalText(args.preferredMethodId, 80),
      updatedAt: Date.now()
    });
  }
});

export const saveAccountSettings = mutation({
  args: {
    profileId: v.id("profiles"),
    displayName: v.string(),
    email: v.optional(v.string()),
    weeklyGoal: v.optional(v.string()),
    accountabilityPartner: v.optional(v.string()),
    preferredMethodId: v.optional(v.string()),
    appearanceMode: v.optional(v.union(v.literal("light"), v.literal("dark")))
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);
    const authUserId = await getAuthUserId(ctx);
    const nextName = clampText(args.displayName, 80) || "Bible student";
    const nextEmail = clampText(args.email, 254).toLowerCase();

    await ctx.db.patch(args.profileId, {
      displayName: nextName,
      weeklyGoal: clampOptionalText(args.weeklyGoal, 300),
      accountabilityPartner: clampOptionalText(args.accountabilityPartner, 200),
      preferredMethodId: clampOptionalText(args.preferredMethodId, 80),
      appearanceMode: args.appearanceMode,
      updatedAt: Date.now()
    });

    if (!authUserId) return;

    const authUser = await ctx.db.get(authUserId);
    const passwordAccount = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", authUserId).eq("provider", "password"))
      .unique();
    const isUsernameAccount = !!usernameFromCredential(passwordAccount?.providerAccountId || authUser?.email);
    const userPatch: { name: string; email?: string } = { name: nextName };

    if (nextEmail && nextEmail !== authUser?.email?.toLowerCase()) {
      if (!passwordAccount) throw new Error("Email changes are only available for email and password accounts.");

      const existingUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", nextEmail))
        .unique();
      if (existingUser && existingUser._id !== authUserId) throw new Error("That email is already used by another account.");

      if (!isUsernameAccount) {
        const existingAccount = await ctx.db
          .query("authAccounts")
          .withIndex("providerAndAccountId", (q) => q.eq("provider", "password").eq("providerAccountId", nextEmail))
          .unique();
        if (existingAccount && existingAccount.userId !== authUserId) throw new Error("That email is already used by another account.");

        await ctx.db.patch(passwordAccount._id, {
          providerAccountId: nextEmail,
          emailVerified: undefined
        });
      }
      userPatch.email = nextEmail;
    }

    await ctx.db.patch(authUserId, userPatch);
  }
});

export const saveScriptureInsertSettings = mutation({
  args: {
    profileId: v.id("profiles"),
    settings: v.object({
      disabled: v.boolean(),
      bold: v.boolean(),
      italic: v.boolean(),
      color: v.string(),
      highlightColor: v.string(),
      referencePosition: v.union(v.literal("front"), v.literal("end"))
    })
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);

    await ctx.db.patch(args.profileId, {
      scriptureInsertSettings: {
        disabled: args.settings.disabled,
        bold: args.settings.bold,
        italic: args.settings.italic,
        color: clampText(args.settings.color, 40),
        highlightColor: clampText(args.settings.highlightColor, 40),
        referencePosition: args.settings.referencePosition
      },
      updatedAt: Date.now()
    });
  }
});

export const saveUiPreference = mutation({
  args: {
    profileId: v.id("profiles"),
    key: v.string(),
    value: v.union(v.boolean(), v.string(), v.array(v.string()))
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);
    const key = clampText(args.key, 80);
    if (!key || key.startsWith("$") || key.startsWith("_")) throw new Error("Invalid preference key.");
    const value =
      typeof args.value === "string"
        ? clampText(args.value, 120)
        : Array.isArray(args.value)
          ? Array.from(new Set(args.value.map((item) => clampText(item, 120)).filter(Boolean))).slice(0, 80)
          : args.value;

    await ctx.db.patch(args.profileId, {
      uiPreferences: {
        ...(((profile as any).uiPreferences as Record<string, boolean | string | string[]> | undefined) || {}),
        [key]: value
      },
      updatedAt: Date.now()
    });
  }
});

export const saveMemoryMilestoneGoals = mutation({
  args: {
    profileId: v.id("profiles"),
    goalIds: v.array(v.string())
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);

    await ctx.db.patch(args.profileId, {
      memoryMilestoneGoalIds: args.goalIds
        .map((goalId) => clampText(goalId, 80))
        .filter((goalId) => memoryMilestoneGoalIds.has(goalId))
        .slice(0, 5),
      updatedAt: Date.now()
    });
  }
});

export const saveBibleReaderState = mutation({
  args: {
    profileId: v.id("profiles"),
    state: syncedBibleReaderState,
    revision: v.optional(v.number())
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);

    const cleanedState = cleanBibleReaderState(args.state);
    const existing = await ctx.db
      .query("bibleReaderStates")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .unique();
    const requestedRevision = Math.max(0, Math.round(args.revision ?? 0));
    const revision = Math.max((existing?.revision ?? 0) + 1, requestedRevision);
    const now = Date.now();
    const has = (key: keyof typeof args.state) => Object.prototype.hasOwnProperty.call(args.state, key);
    const includesBookmarks = has("bookmarks");
    const includesPlans = has("readingPlanProgress");

    const corePatch = {
      translation: has("translation") ? cleanedState.translation : existing?.translation,
      position: has("position") ? cleanedState.position : existing?.position,
      history: has("history") ? cleanedState.history : existing?.history,
      readChapters: has("readChapters") ? cleanedState.readChapters : existing?.readChapters,
      activePlanId: includesPlans ? cleanedState.readingPlanProgress?.activePlanId : existing?.activePlanId,
      followedPlanIds: includesPlans ? cleanedState.readingPlanProgress?.followedPlanIds : existing?.followedPlanIds,
      startDates: includesPlans ? cleanedState.readingPlanProgress?.startDates : existing?.startDates,
      completedPlanDates: includesPlans ? cleanedState.readingPlanProgress?.completedPlanDates : existing?.completedPlanDates,
      completionCounts: includesPlans ? cleanedState.readingPlanProgress?.completionCounts : existing?.completionCounts,
      acknowledgedCareNotes: includesPlans ? cleanedState.readingPlanProgress?.acknowledgedCareNotes : existing?.acknowledgedCareNotes,
      bookmarksMigrated: includesBookmarks ? true : existing?.bookmarksMigrated,
      plansMigrated: includesPlans ? true : existing?.plansMigrated,
      revision,
      updatedAt: now
    };
    if (existing) await ctx.db.patch(existing._id, corePatch);
    else await ctx.db.insert("bibleReaderStates", { profileId: args.profileId, ...corePatch });

    if (includesBookmarks) {
      await syncBibleBookmarks(ctx, args.profileId, cleanedState.bookmarks, now);
    }
    if (includesPlans && cleanedState.readingPlanProgress) {
      await syncCustomPlans(ctx, args.profileId, cleanedState.readingPlanProgress.customPlans, now);
      await syncPlanCompletions(ctx, args.profileId, cleanedState.readingPlanProgress.completedDays, now);
    }
    if ((includesBookmarks || existing?.bookmarksMigrated) && (includesPlans || existing?.plansMigrated)) {
      await ctx.db.patch(args.profileId, { bibleReaderState: undefined, updatedAt: now });
    }
    return true;
  }
});

export const bibleReaderState = query({
  args: { profileId: v.id("profiles") },
  returns: v.union(v.null(), syncedBibleReaderState),
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    const normalized = await ctx.db
      .query("bibleReaderStates")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .unique();
    if (!normalized) return profile.bibleReaderState ?? null;

    const legacy = profile.bibleReaderState;
    const [bookmarkRows, planRows, completionRows] = await Promise.all([
      normalized.bookmarksMigrated
        ? ctx.db.query("bibleBookmarks").withIndex("by_profile", (q) => q.eq("profileId", args.profileId)).take(30)
        : Promise.resolve([]),
      normalized.plansMigrated
        ? ctx.db.query("customBibleReadingPlans").withIndex("by_profile", (q) => q.eq("profileId", args.profileId)).take(30)
        : Promise.resolve([]),
      normalized.plansMigrated
        ? ctx.db.query("bibleReadingPlanCompletions").withIndex("by_profile", (q) => q.eq("profileId", args.profileId)).take(60)
        : Promise.resolve([])
    ]);
    const completedDays = completionRows.flatMap((row) => row.completedDays.map((day) => `${row.planId}:${day}`));
    return {
      translation: normalized.translation ?? legacy?.translation,
      position: normalized.position ?? legacy?.position,
      history: normalized.history ?? legacy?.history,
      readChapters: normalized.readChapters ?? legacy?.readChapters,
      bookmarks: normalized.bookmarksMigrated
        ? bookmarkRows.map((row) => ({
            id: row.bookmarkId,
            book: row.book,
            chapter: row.chapter,
            startVerse: row.startVerse,
            endVerse: row.endVerse,
            reference: row.reference,
            bookmarked: row.bookmarked,
            note: row.note,
            createdAt: row.createdAt
          }))
        : legacy?.bookmarks,
      readingPlanProgress: normalized.plansMigrated
        ? {
            activePlanId: normalized.activePlanId || "",
            followedPlanIds: normalized.followedPlanIds || [],
            completedDays,
            customPlans: planRows.map((row) => ({
              id: row.planId,
              title: row.title,
              description: row.description,
              source: "custom" as const,
              category: row.category,
              days: row.days
            })),
            startDates: normalized.startDates || {},
            completedPlanDates: normalized.completedPlanDates || {},
            completionCounts: normalized.completionCounts || {},
            acknowledgedCareNotes: normalized.acknowledgedCareNotes || [],
            updatedAt: normalized.updatedAt
          }
        : legacy?.readingPlanProgress
    };
  }
});

export const changePassword = action({
  args: {
    accountId: v.string(),
    currentPassword: v.string(),
    newPassword: v.string()
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Sign in before changing your password.");

    const accountId = args.accountId.trim().toLowerCase();
    if (!accountId || !args.currentPassword) throw new Error("Add your current password.");
    if (!args.newPassword || args.newPassword.length < 8) throw new Error("New password needs at least 8 characters.");
    if (accountId.length > 254 || args.currentPassword.length > 200 || args.newPassword.length > 200) throw new Error("Those details are too long.");

    const retrieved = await retrieveAccount(ctx, {
      provider: "password",
      account: { id: accountId, secret: args.currentPassword }
    });
    if (retrieved.user._id !== authUserId) throw new Error("Current password was not accepted.");

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: accountId, secret: args.newPassword }
    });

    return true;
  }
});

export const saveCheckin = mutation({
  args: {
    profileId: v.id("profiles"),
    mood: v.string(),
    note: v.string(),
    sentAt: v.optional(v.number()),
    localDayKey: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);
    const recentCheckins = await ctx.db
      .query("checkins")
      .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(30);
    await enforceRecentLimit(ctx, args.profileId, recentCheckins, "createdAt", { max: 30, windowMs: 24 * 60 * 60 * 1000, label: "Encouragement" });

    const createdAt = Date.now();
    const checkinId = await ctx.db.insert("checkins", {
      profileId: args.profileId,
      mood: clampText(args.mood, 80),
      note: clampText(args.note, 4000),
      sentAt: args.sentAt,
      createdAt
    });
    await recordStudyActivity(ctx, {
      profileId: args.profileId,
      timestamp: createdAt,
      localDayKey: args.localDayKey,
      increments: { encouragementsShared: 1 }
    });
    return checkinId;
  }
});

export const profile = query({
  args: {
    profileId: v.id("profiles")
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    const authUserId = await getAuthUserId(ctx);
    const authUser = authUserId ? await ctx.db.get(authUserId) : null;
    const authAccounts = authUserId
      ? await ctx.db
          .query("authAccounts")
          .withIndex("userIdAndProvider", (q) => q.eq("userId", authUserId))
          .collect()
      : [];
    const preferredAuthAccount =
      authAccounts.find((account) => account.provider === "google") ||
      authAccounts.find((account) => account.provider === "apple") ||
      authAccounts[0];
    const passwordAccount = authAccounts.find((account) => account.provider === "password");
    const username = usernameFromCredential(passwordAccount?.providerAccountId || authUser?.email);
    const { bibleReaderState: _legacyBibleReaderState, ...profileSummary } = profile;

    return {
      ...profileSummary,
      authEmail: visibleAuthEmail(authUser?.email),
      authName: authUser?.name,
      authProvider: preferredAuthAccount?.provider,
      authUsername: profile.normalizedUsername || username || undefined,
      authLoginKind: username ? "username" : preferredAuthAccount?.provider === "password" ? "email" : preferredAuthAccount?.provider,
      authPasswordAccountId: passwordAccount?.providerAccountId
    };
  }
});

export const recentCheckins = query({
  args: {
    profileId: v.id("profiles"),
    limit: v.optional(v.number())
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);

    const checkins = await ctx.db
      .query("checkins")
      .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(args.limit ?? 12);

    const profilePosts = await ctx.db
      .query("communityPosts")
      .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(200);

    const enriched = [];
    for (const checkin of checkins) {
      const sharedPosts = await ctx.db
        .query("communityPosts")
        .withIndex("by_checkin_id", (q) => q.eq("checkinId", checkin._id))
        .take(20);
      const sharedTo = [];
      const allReactions = [];
      for (const post of sharedPosts) {
        const reactions = await ctx.db
          .query("communityReactions")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .take(200);
        allReactions.push(...reactions);
        if (post.circleId) {
          const circle = await ctx.db.get(post.circleId);
          if (!circle) continue;
          sharedTo.push({
            postId: post._id,
            circleId: circle._id,
            circleName: circle.name,
            destinationType: "circle",
            createdAt: post.createdAt
          });
        } else if (post.recipientProfileId) {
          const friendProfile = await ctx.db.get(post.recipientProfileId);
          sharedTo.push({
            postId: post._id,
            friendProfileId: post.recipientProfileId,
            friendName: friendProfile?.displayName || "Friend",
            destinationType: "friend",
            createdAt: post.createdAt
          });
        }
      }
      enriched.push({
        ...checkin,
        itemType: "checkin",
        authorLabel: "Posted by me",
        canEdit: true,
        sharedPostId: sharedPosts.length === 1 ? sharedPosts[0]._id : undefined,
        reactions: reactionSummary(allReactions),
        myReactions: allReactions.filter((reaction) => reaction.profileId === args.profileId).map((reaction) => reaction.reaction),
        sharedTo
      });
    }

    const standalonePosts = profilePosts.filter((post) => !post.checkinId);
    for (const post of standalonePosts) {
      const reactions = await ctx.db
        .query("communityReactions")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .take(200);
      const sharedTo = [];
      if (post.circleId) {
        const circle = await ctx.db.get(post.circleId);
        if (circle) {
          sharedTo.push({
            postId: post._id,
            circleId: circle._id,
            circleName: circle.name,
            destinationType: "circle",
            createdAt: post.createdAt
          });
        }
      } else if (post.recipientProfileId) {
        const friendProfile = await ctx.db.get(post.recipientProfileId);
        sharedTo.push({
          postId: post._id,
          friendProfileId: post.recipientProfileId,
          friendName: friendProfile?.displayName || "Friend",
          destinationType: "friend",
          createdAt: post.createdAt
        });
      }
      enriched.push({
        _id: post._id,
        itemType: "communityPost",
        mood: post.source === "studyInsight" ? "study insight" : "shared post",
        note: post.note,
        authorName: post.authorName,
        authorLabel: post.profileId === args.profileId ? "Posted by me" : `Posted by ${post.authorName || "Bible student"}`,
        canEdit: post.profileId === args.profileId,
        passageReference: post.passageReference,
        createdAt: post.createdAt,
        sentAt: post.createdAt,
        sharedPostId: post._id,
        reactions: reactionSummary(reactions),
        myReactions: reactions.filter((reaction) => reaction.profileId === args.profileId).map((reaction) => reaction.reaction),
        sharedTo
      });
    }

    return enriched.sort((a, b) => b.createdAt - a.createdAt).slice(0, args.limit ?? 12);
  }
});

export const deleteCheckin = mutation({
  args: {
    profileId: v.id("profiles"),
    checkinId: v.id("checkins")
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);

    const checkin = await ctx.db.get(args.checkinId);
    if (!checkin || checkin.profileId !== args.profileId) return false;

    const sharedPosts = await ctx.db
      .query("communityPosts")
      .withIndex("by_checkin_id", (q) => q.eq("checkinId", args.checkinId))
      .take(200);
    for (const post of sharedPosts) {
      const reactions = await ctx.db
        .query("communityReactions")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .take(200);
      for (const reaction of reactions) {
        await ctx.db.delete(reaction._id);
      }
      await ctx.db.delete(post._id);
    }
    await ctx.db.delete(args.checkinId);
    return true;
  }
});

export const updateCheckin = mutation({
  args: {
    profileId: v.id("profiles"),
    checkinId: v.id("checkins"),
    note: v.string()
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    const checkin = await ctx.db.get(args.checkinId);
    if (!checkin || checkin.profileId !== args.profileId) return false;

    const nextNote = clampText(args.note, 4000);
    await ctx.db.patch(args.checkinId, {
      note: nextNote
    });

    const sharedPosts = await ctx.db
      .query("communityPosts")
      .withIndex("by_checkin_id", (q) => q.eq("checkinId", args.checkinId))
      .take(200);
    for (const post of sharedPosts) {
      await ctx.db.patch(post._id, {
        note: clampText(nextNote, 1200)
      });
    }
    return true;
  }
});

function clampText(value: string | undefined, maxLength: number) {
  return (value || "").trim().slice(0, maxLength);
}

function clampOptionalText(value: string | undefined, maxLength: number) {
  const cleaned = clampText(value, maxLength);
  return cleaned || undefined;
}

function reactionSummary(reactions: Doc<"communityReactions">[]) {
  return {
    amen: reactions.filter((reaction) => reaction.reaction === "amen").length,
    praying: reactions.filter((reaction) => reaction.reaction === "praying").length,
    encouraged: reactions.filter((reaction) => reaction.reaction === "encouraged").length
  };
}

async function syncBibleBookmarks(
  ctx: MutationCtx,
  profileId: Id<"profiles">,
  bookmarks: ReturnType<typeof cleanBibleReaderState>["bookmarks"],
  now: number
) {
  const existing = await ctx.db.query("bibleBookmarks").withIndex("by_profile", (q) => q.eq("profileId", profileId)).take(31);
  const desiredIds = new Set(bookmarks.map((bookmark) => bookmark.id));
  for (const row of existing) {
    if (!desiredIds.has(row.bookmarkId)) await ctx.db.delete(row._id);
  }
  for (const bookmark of bookmarks) {
    const row = existing.find((item) => item.bookmarkId === bookmark.id);
    const value = {
      book: bookmark.book,
      chapter: bookmark.chapter,
      startVerse: bookmark.startVerse,
      endVerse: bookmark.endVerse,
      reference: bookmark.reference,
      bookmarked: bookmark.bookmarked,
      note: bookmark.note,
      createdAt: bookmark.createdAt,
      updatedAt: now
    };
    if (row) await ctx.db.patch(row._id, value);
    else await ctx.db.insert("bibleBookmarks", { profileId, bookmarkId: bookmark.id, ...value });
  }
}

async function syncCustomPlans(
  ctx: MutationCtx,
  profileId: Id<"profiles">,
  plans: NonNullable<ReturnType<typeof cleanBibleReaderState>["readingPlanProgress"]>["customPlans"],
  now: number
) {
  const existing = await ctx.db.query("customBibleReadingPlans").withIndex("by_profile", (q) => q.eq("profileId", profileId)).take(31);
  const desiredIds = new Set(plans.map((plan) => plan.id));
  for (const row of existing) {
    if (!desiredIds.has(row.planId)) await ctx.db.delete(row._id);
  }
  for (const plan of plans) {
    const row = existing.find((item) => item.planId === plan.id);
    const value = {
      title: plan.title,
      description: plan.description,
      source: "custom" as const,
      category: plan.category,
      days: plan.days,
      updatedAt: now
    };
    if (row) await ctx.db.patch(row._id, value);
    else await ctx.db.insert("customBibleReadingPlans", { profileId, planId: plan.id, ...value });
  }
}

async function syncPlanCompletions(ctx: MutationCtx, profileId: Id<"profiles">, completionKeys: string[], now: number) {
  const byPlan = new Map<string, number[]>();
  for (const completionKey of completionKeys) {
    const separator = completionKey.lastIndexOf(":");
    if (separator <= 0) continue;
    const planId = completionKey.slice(0, separator);
    const day = Math.round(Number(completionKey.slice(separator + 1)) || 0);
    if (!planId || day < 1 || day > 400) continue;
    byPlan.set(planId, [...(byPlan.get(planId) || []), day]);
  }
  const existing = await ctx.db.query("bibleReadingPlanCompletions").withIndex("by_profile", (q) => q.eq("profileId", profileId)).take(61);
  for (const row of existing) {
    if (!byPlan.has(row.planId)) await ctx.db.delete(row._id);
  }
  for (const [planId, days] of byPlan) {
    const completedDays = Array.from(new Set(days)).sort((left, right) => left - right);
    const row = existing.find((item) => item.planId === planId);
    if (row) {
      if (JSON.stringify(row.completedDays) !== JSON.stringify(completedDays)) {
        await ctx.db.patch(row._id, { completedDays, updatedAt: now });
      }
    } else {
      await ctx.db.insert("bibleReadingPlanCompletions", { profileId, planId, completedDays, updatedAt: now });
    }
  }
}

function cleanBibleReaderState(state: {
  translation?: "bsb" | "web" | "kjv";
  position?: { book: string; chapter: number };
  history?: Array<{ book: string; chapter: number; reference: string; translation: "bsb" | "web" | "kjv"; updatedAt: string }>;
  readChapters?: Record<string, number[]>;
  bookmarks?: Array<{
    id: string;
    book: string;
    chapter: number;
    startVerse?: number;
    endVerse?: number;
    reference: string;
    bookmarked?: boolean;
    note?: string;
    createdAt: string;
  }>;
  readingPlanProgress?: {
    activePlanId: string;
    followedPlanIds?: string[];
    completedDays: string[];
    customPlans: Array<{
      id: string;
      title: string;
      description: string;
      source: "custom";
      category?: string;
      days: Array<{
        day: number;
        title: string;
        reference: string;
        readerBook: string;
        readerChapter: number;
        studyReference: string;
        context?: string;
        devotional?: {
          title: string;
          body: string;
          source?: string;
        };
        observationQuestion?: string;
        reflectionQuestion?: string;
        reflectionPrompt?: string;
        prayer?: string;
        prayerPrompt?: string;
        gentleAction?: string;
        studyMethod?: string;
        careNote?: string;
      }>;
    }>;
    startDates?: Record<string, string>;
    completedPlanDates?: Record<string, string>;
    completionCounts?: Record<string, number>;
    acknowledgedCareNotes?: string[];
    updatedAt?: number;
  };
}) {
  const readChapters = Object.entries(state.readChapters || {}).reduce<Record<string, number[]>>((map, [book, chapters]) => {
    const cleanedBook = clampText(book, 80);
    if (!cleanedBook || !Array.isArray(chapters)) return map;
    const normalized = Array.from(new Set(chapters.map((chapter) => Math.round(chapter)).filter((chapter) => chapter > 0 && chapter <= 200)))
      .sort((a, b) => a - b)
      .slice(0, 200);
    if (normalized.length) map[cleanedBook] = normalized;
    return map;
  }, {});

  const readingPlanProgress = cleanBibleReadingPlanProgress(state.readingPlanProgress);

  return {
    translation: state.translation,
    position: state.position
      ? {
          book: clampText(state.position.book, 80),
          chapter: Math.max(1, Math.min(200, Math.round(state.position.chapter)))
        }
      : undefined,
    history: (state.history || []).slice(0, 12).map((item) => ({
      book: clampText(item.book, 80),
      chapter: Math.max(1, Math.min(200, Math.round(item.chapter))),
      reference: clampText(item.reference, 120),
      translation: item.translation,
      updatedAt: clampText(item.updatedAt, 40)
    })),
    readChapters,
    bookmarks: (state.bookmarks || []).slice(0, 30).map((bookmark) => ({
      id: clampText(bookmark.id, 160),
      book: clampText(bookmark.book, 80),
      chapter: Math.max(1, Math.min(200, Math.round(bookmark.chapter))),
      startVerse: bookmark.startVerse ? Math.max(1, Math.min(300, Math.round(bookmark.startVerse))) : undefined,
      endVerse: bookmark.endVerse ? Math.max(1, Math.min(300, Math.round(bookmark.endVerse))) : undefined,
      reference: clampText(bookmark.reference, 120),
      bookmarked: bookmark.bookmarked,
      note: clampOptionalText(bookmark.note, 1200),
      createdAt: clampText(bookmark.createdAt, 40)
    })),
    readingPlanProgress
  };
}

function cleanBibleReadingPlanProgress(progress: Parameters<typeof cleanBibleReaderState>[0]["readingPlanProgress"]) {
  if (!progress) return undefined;
  const customPlans = (progress.customPlans || [])
    .slice(0, 30)
    .map((plan) => {
      const days = (plan.days || [])
        .slice(0, 400)
        .map((day) => {
          const devotional = day.devotional
            ? {
                title: clampText(day.devotional.title, 120),
                body: clampText(day.devotional.body, 1200),
                source: clampOptionalText(day.devotional.source, 80)
              }
            : undefined;
          return {
            day: Math.max(1, Math.min(400, Math.round(day.day))),
            title: clampText(day.title, 80),
            reference: clampText(day.reference, 120),
            readerBook: clampText(day.readerBook, 80),
            readerChapter: Math.max(1, Math.min(200, Math.round(day.readerChapter))),
            studyReference: clampText(day.studyReference, 120),
            context: clampOptionalText(day.context, 700),
            devotional: devotional?.title && devotional.body ? devotional : undefined,
            observationQuestion: clampOptionalText(day.observationQuestion, 240),
            reflectionQuestion: clampOptionalText(day.reflectionQuestion, 240),
            reflectionPrompt: clampOptionalText(day.reflectionPrompt, 240),
            prayer: clampOptionalText(day.prayer, 500),
            prayerPrompt: clampOptionalText(day.prayerPrompt, 500),
            gentleAction: clampOptionalText(day.gentleAction, 260),
            studyMethod: clampOptionalText(day.studyMethod, 80),
            careNote: clampOptionalText(day.careNote, 600)
          };
        })
        .filter((day) => day.reference && day.readerBook);
      if (!days.length) return null;
      return {
        id: clampText(plan.id, 80),
        title: clampText(plan.title, 80),
        description: clampText(plan.description, 240),
        source: "custom" as const,
        category: clampOptionalText(plan.category, 40) || "Custom",
        days
      };
    })
    .filter((plan): plan is NonNullable<typeof plan> => !!plan);
  const customPlanIds = new Set(customPlans.map((plan) => plan.id));
  const activePlanId = clampText(progress.activePlanId, 80);
  const followedPlanIds = Array.from(new Set((progress.followedPlanIds || []).map((planId) => clampText(planId, 80)).filter(Boolean)))
    .filter((planId) => (planId.startsWith("custom-") ? customPlanIds.has(planId) : true))
    .slice(0, 60);
  const normalizedActivePlanId = activePlanId && (activePlanId.startsWith("custom-") ? customPlanIds.has(activePlanId) : true) ? activePlanId : followedPlanIds[0] || "";
  const normalizedFollowedPlanIds = Array.from(new Set([normalizedActivePlanId, ...followedPlanIds].filter(Boolean))).slice(0, 60);
  const completedDays = Array.from(new Set((progress.completedDays || []).map((key) => clampText(key, 100)).filter(Boolean))).slice(0, 5000);
  const startDates = Object.entries(progress.startDates || {})
    .slice(0, 60)
    .reduce<Record<string, string>>((map, [planId, date]) => {
      const cleanPlanId = clampText(planId, 80);
      const cleanDate = clampText(date, 10);
      if (cleanPlanId && /^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) map[cleanPlanId] = cleanDate;
      return map;
    }, {});
  const completedPlanDates = Object.entries(progress.completedPlanDates || {})
    .slice(0, 60)
    .reduce<Record<string, string>>((map, [planId, date]) => {
      const cleanPlanId = clampText(planId, 80);
      const cleanDate = clampText(date, 10);
      if (cleanPlanId && /^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) map[cleanPlanId] = cleanDate;
      return map;
    }, {});
  const completionCounts = Object.entries(progress.completionCounts || {})
    .slice(0, 60)
    .reduce<Record<string, number>>((map, [planId, count]) => {
      const cleanPlanId = clampText(planId, 80);
      const cleanCount = Math.max(0, Math.min(999, Math.round(Number(count) || 0)));
      if (cleanPlanId && cleanCount > 0) map[cleanPlanId] = cleanCount;
      return map;
    }, {});
  Object.keys(completedPlanDates).forEach((planId) => {
    if (!completionCounts[planId]) completionCounts[planId] = 1;
  });
  const acknowledgedCareNotes = Array.from(new Set((progress.acknowledgedCareNotes || [])
    .map((key) => clampText(key, 220).trim().toLowerCase())
    .filter(Boolean)))
    .slice(0, 20);

  return {
    activePlanId: normalizedActivePlanId,
    followedPlanIds: normalizedFollowedPlanIds,
    completedDays,
    customPlans,
    startDates,
    completedPlanDates,
    completionCounts,
    acknowledgedCareNotes,
    updatedAt: Number.isFinite(Number(progress.updatedAt)) ? Math.max(0, Number(progress.updatedAt)) : Date.now()
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
