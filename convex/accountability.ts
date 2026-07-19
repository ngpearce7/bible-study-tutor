import { getAuthUserId, modifyAccountCredentials, retrieveAccount } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import { action, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { assertProfileCanWrite, enforceRecentLimit } from "./security";
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
    value: v.boolean()
  },
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);
    const key = clampText(args.key, 80);
    if (!key || key.startsWith("$") || key.startsWith("_")) throw new Error("Invalid preference key.");

    await ctx.db.patch(args.profileId, {
      uiPreferences: {
        ...(((profile as any).uiPreferences as Record<string, boolean> | undefined) || {}),
        [key]: args.value
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
    state: v.object({
      translation: v.optional(bibleTranslation),
      position: v.optional(v.object({ book: v.string(), chapter: v.number() })),
      history: v.optional(v.array(bibleReaderHistoryItem)),
      readChapters: v.optional(v.record(v.string(), v.array(v.number()))),
      bookmarks: v.optional(v.array(bibleBookmark)),
      readingPlanProgress: v.optional(v.object({
        activePlanId: v.string(),
        completedDays: v.array(v.string()),
        customPlans: v.array(v.object({
          id: v.string(),
          title: v.string(),
          description: v.string(),
          source: v.literal("custom"),
          category: v.optional(v.string()),
          days: v.array(v.object({
            day: v.number(),
            title: v.string(),
            reference: v.string(),
            readerBook: v.string(),
            readerChapter: v.number(),
            studyReference: v.string()
          }))
        })),
        startDates: v.optional(v.record(v.string(), v.string())),
        updatedAt: v.optional(v.number())
      }))
    })
  },
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);

    await ctx.db.patch(args.profileId, {
      bibleReaderState: cleanBibleReaderState(args.state),
      updatedAt: Date.now()
    });
  }
});

export const changePassword = action({
  args: {
    accountId: v.string(),
    currentPassword: v.string(),
    newPassword: v.string()
  },
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
    sentAt: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);
    const recentCheckins = await ctx.db
      .query("checkins")
      .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(30);
    await enforceRecentLimit(ctx, args.profileId, recentCheckins, "createdAt", { max: 30, windowMs: 24 * 60 * 60 * 1000, label: "Encouragement" });

    return await ctx.db.insert("checkins", {
      profileId: args.profileId,
      mood: clampText(args.mood, 80),
      note: clampText(args.note, 4000),
      sentAt: args.sentAt,
      createdAt: Date.now()
    });
  }
});

export const profile = query({
  args: {
    profileId: v.id("profiles")
  },
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

    return {
      ...profile,
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
      const sharedPosts = profilePosts.filter((post) => post.checkinId === checkin._id);
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
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);

    const checkin = await ctx.db.get(args.checkinId);
    if (!checkin || checkin.profileId !== args.profileId) return false;

    const sharedPosts = (await ctx.db
      .query("communityPosts")
      .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(200)).filter((post) => post.checkinId === args.checkinId);
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
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    const checkin = await ctx.db.get(args.checkinId);
    if (!checkin || checkin.profileId !== args.profileId) return false;

    const nextNote = clampText(args.note, 4000);
    await ctx.db.patch(args.checkinId, {
      note: nextNote
    });

    const sharedPosts = (await ctx.db
      .query("communityPosts")
      .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(200)).filter((post) => post.checkinId === args.checkinId);
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
      }>;
    }>;
    startDates?: Record<string, string>;
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
        .map((day) => ({
          day: Math.max(1, Math.min(400, Math.round(day.day))),
          title: clampText(day.title, 80),
          reference: clampText(day.reference, 120),
          readerBook: clampText(day.readerBook, 80),
          readerChapter: Math.max(1, Math.min(200, Math.round(day.readerChapter))),
          studyReference: clampText(day.studyReference, 120)
        }))
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
  const completedDays = Array.from(new Set((progress.completedDays || []).map((key) => clampText(key, 100)).filter(Boolean))).slice(0, 5000);
  const startDates = Object.entries(progress.startDates || {})
    .slice(0, 60)
    .reduce<Record<string, string>>((map, [planId, date]) => {
      const cleanPlanId = clampText(planId, 80);
      const cleanDate = clampText(date, 10);
      if (cleanPlanId && /^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) map[cleanPlanId] = cleanDate;
      return map;
    }, {});

  return {
    activePlanId: activePlanId && (activePlanId.startsWith("custom-") ? customPlanIds.has(activePlanId) : true) ? activePlanId : "",
    completedDays,
    customPlans,
    startDates,
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
