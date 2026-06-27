import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { assertCollectionLimit, assertProfileCanWrite, enforceRecentLimit } from "./security";
import { v } from "convex/values";

const memoryStatus = v.union(v.literal("new"), v.literal("learning"), v.literal("review"), v.literal("memorized"));
const reviewPreset = v.union(
  v.literal("later-today"),
  v.literal("daily"),
  v.literal("tomorrow"),
  v.literal("two-days"),
  v.literal("three-days"),
  v.literal("four-days"),
  v.literal("five-days"),
  v.literal("six-days"),
  v.literal("next-week"),
  v.literal("fortnightly"),
  v.literal("three-weeks"),
  v.literal("next-month"),
  v.literal("three-months"),
  v.literal("six-months"),
  v.literal("annually")
);
const memoryHistoryEvent = v.union(
  v.literal("added"),
  v.literal("updated"),
  v.literal("reviewed"),
  v.literal("repeated"),
  v.literal("scheduled"),
  v.literal("meditated"),
  v.literal("removed")
);

export const saveVerse = mutation({
  args: {
    profileId: v.id("profiles"),
    reference: v.string(),
    verseText: v.string(),
    translationName: v.string(),
    note: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);
    const cleaned = {
      profileId: args.profileId,
      reference: clampText(args.reference, 160),
      verseText: clampText(args.verseText, 5000),
      translationName: clampText(args.translationName, 120),
      note: clampOptionalText(args.note, 2000)
    };

    const now = Date.now();
    const existing = await ctx.db
      .query("memoryVerses")
      .withIndex("by_profile_reference", (q) => q.eq("profileId", args.profileId).eq("reference", cleaned.reference))
      .first();

    if (existing) {
      const recentUpdates = await ctx.db
        .query("memoryVerses")
        .withIndex("by_profile_updated", (q) => q.eq("profileId", args.profileId))
        .order("desc")
        .take(80);
      await enforceRecentLimit(ctx, args.profileId, recentUpdates, "updatedAt", { max: 80, windowMs: 60 * 60 * 1000, label: "Memory verse update" });
      await ctx.db.patch(existing._id, {
        verseText: cleaned.verseText,
        translationName: cleaned.translationName,
        note: cleaned.note,
        updatedAt: now
      });
      await insertMemoryHistory(ctx, {
        profileId: args.profileId,
        memoryVerseId: existing._id,
        reference: cleaned.reference,
        event: "updated",
        practiceLevel: existing.practiceLevel,
        reviewCount: existing.reviewCount,
        nextReviewAt: existing.nextReviewAt,
        createdAt: now
      });
      return existing._id;
    }

    const savedVerses = await ctx.db
      .query("memoryVerses")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .take(501);
    assertCollectionLimit(savedVerses.length, 500, "Saved memory verse");
    const recentNewVerses = await ctx.db
      .query("memoryVerses")
      .withIndex("by_profile_updated", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(40);
    await enforceRecentLimit(ctx, args.profileId, recentNewVerses, "updatedAt", { max: 40, windowMs: 60 * 60 * 1000, label: "New memory verse" });

    const memoryVerseId = await ctx.db.insert("memoryVerses", {
      ...cleaned,
      status: "new",
      practiceLevel: 1,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now
    });
    await insertMemoryHistory(ctx, {
      profileId: args.profileId,
      memoryVerseId,
      reference: cleaned.reference,
      event: "added",
      practiceLevel: 1,
      reviewCount: 0,
      createdAt: now
    });
    return memoryVerseId;
  }
});

export const list = query({
  args: {
    profileId: v.id("profiles"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    return await ctx.db
      .query("memoryVerses")
      .withIndex("by_profile_updated", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(args.limit ?? 50);
  }
});

export const recordPractice = mutation({
  args: {
    profileId: v.id("profiles"),
    memoryVerseId: v.id("memoryVerses"),
    result: v.union(v.literal("again"), v.literal("got-it")),
    practiceLevel: v.number()
  },
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);
    const recentHistory = await ctx.db
      .query("memoryHistory")
      .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(240);
    await enforceRecentLimit(ctx, args.profileId, recentHistory, "createdAt", { max: 240, windowMs: 60 * 60 * 1000, label: "Memory practice" });

    const verse = await ctx.db.get(args.memoryVerseId);
    if (!verse || verse.profileId !== args.profileId) return false;

    const now = Date.now();
    const currentPracticeLevel = Math.max(1, Math.min(3, Math.round(args.practiceLevel || 1)));
    const nextPracticeLevel = args.result === "got-it" ? Math.min(3, currentPracticeLevel + 1) : Math.max(1, currentPracticeLevel - 1);
    const status = currentPracticeLevel >= 3 && args.result === "got-it" ? "memorized" : nextPracticeLevel >= 2 ? "review" : "learning";
    const savedReviewDelay = typeof verse.reviewIntervalDays === "number" && verse.reviewIntervalDays > 0
      ? 1000 * 60 * 60 * 24 * verse.reviewIntervalDays
      : null;
    const nextReviewDelay = args.result === "got-it"
      ? savedReviewDelay ?? 1000 * 60 * 60 * 24 * nextPracticeLevel
      : 1000 * 60 * 60 * 4;

    await ctx.db.patch(args.memoryVerseId, {
      status,
      practiceLevel: nextPracticeLevel,
      reviewCount: verse.reviewCount + 1,
      lastReviewedAt: now,
      nextReviewAt: now + nextReviewDelay,
      updatedAt: now
    });
    await insertMemoryHistory(ctx, {
      profileId: args.profileId,
      memoryVerseId: args.memoryVerseId,
      reference: verse.reference,
      event: args.result === "got-it" ? "reviewed" : "repeated",
      practiceLevel: currentPracticeLevel,
      reviewCount: verse.reviewCount + 1,
      nextReviewAt: now + nextReviewDelay,
      createdAt: now
    });
    return true;
  }
});

export const remove = mutation({
  args: {
    profileId: v.id("profiles"),
    memoryVerseId: v.id("memoryVerses")
  },
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);

    const verse = await ctx.db.get(args.memoryVerseId);
    if (!verse || verse.profileId !== args.profileId) return false;

    await insertMemoryHistory(ctx, {
      profileId: args.profileId,
      memoryVerseId: args.memoryVerseId,
      reference: verse.reference,
      event: "removed",
      practiceLevel: verse.practiceLevel,
      reviewCount: verse.reviewCount,
      nextReviewAt: verse.nextReviewAt,
      createdAt: Date.now()
    });
    await ctx.db.delete(args.memoryVerseId);
    return true;
  }
});

export const scheduleReview = mutation({
  args: {
    profileId: v.id("profiles"),
    memoryVerseId: v.id("memoryVerses"),
    preset: reviewPreset
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    const verse = await ctx.db.get(args.memoryVerseId);
    if (!verse || verse.profileId !== args.profileId) return false;

    const now = Date.now();
    const reviewIntervalDays = reviewPresetDays(args.preset);
    const nextReviewAt = now + reviewPresetDelay(args.preset);
    await ctx.db.patch(args.memoryVerseId, {
      status: verse.status === "memorized" ? verse.status : "review",
      nextReviewAt,
      ...(reviewIntervalDays > 0 ? { reviewIntervalDays } : {}),
      updatedAt: now
    });
    await insertMemoryHistory(ctx, {
      profileId: args.profileId,
      memoryVerseId: args.memoryVerseId,
      reference: verse.reference,
      event: "scheduled",
      practiceLevel: verse.practiceLevel,
      reviewCount: verse.reviewCount,
      nextReviewAt,
      createdAt: now
    });
    return true;
  }
});

export const updateCollections = mutation({
  args: {
    profileId: v.id("profiles"),
    memoryVerseId: v.id("memoryVerses"),
    collections: v.array(v.string())
  },
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);

    const verse = await ctx.db.get(args.memoryVerseId);
    if (!verse || verse.profileId !== args.profileId) return false;

    const collections = cleanCollections(args.collections);
    const recentUpdates = await ctx.db
      .query("memoryVerses")
      .withIndex("by_profile_updated", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(80);
    await enforceRecentLimit(ctx, args.profileId, recentUpdates, "updatedAt", { max: 80, windowMs: 60 * 60 * 1000, label: "Memory collection update" });

    await ctx.db.patch(args.memoryVerseId, {
      collections,
      updatedAt: Date.now()
    });
    return true;
  }
});

export const listHistory = query({
  args: {
    profileId: v.id("profiles"),
    memoryVerseId: v.optional(v.id("memoryVerses")),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);
    const limit = Math.max(1, Math.min(args.limit ?? 80, 150));

    if (args.memoryVerseId) {
      return await ctx.db
        .query("memoryHistory")
        .withIndex("by_profile_memoryVerse_created", (q) =>
          q.eq("profileId", args.profileId).eq("memoryVerseId", args.memoryVerseId)
        )
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("memoryHistory")
      .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(limit);
  }
});

export const recordHistoryEvent = mutation({
  args: {
    profileId: v.id("profiles"),
    memoryVerseId: v.id("memoryVerses"),
    event: memoryHistoryEvent,
    practiceLevel: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);
    const verse = await ctx.db.get(args.memoryVerseId);
    if (!verse || verse.profileId !== args.profileId) return false;

    await insertMemoryHistory(ctx, {
      profileId: args.profileId,
      memoryVerseId: args.memoryVerseId,
      reference: verse.reference,
      event: args.event,
      practiceLevel: args.practiceLevel ?? verse.practiceLevel,
      reviewCount: verse.reviewCount,
      nextReviewAt: verse.nextReviewAt,
      createdAt: Date.now()
    });
    return true;
  }
});

async function insertMemoryHistory(
  ctx: MutationCtx,
  event: {
    profileId: Id<"profiles">;
    memoryVerseId?: Id<"memoryVerses">;
    reference: string;
    event: "added" | "updated" | "reviewed" | "repeated" | "scheduled" | "meditated" | "removed";
    practiceLevel?: number;
    reviewCount?: number;
    nextReviewAt?: number;
    createdAt: number;
  }
) {
  await ctx.db.insert("memoryHistory", {
    profileId: event.profileId,
    memoryVerseId: event.memoryVerseId,
    reference: clampText(event.reference, 160),
    event: event.event,
    practiceLevel: event.practiceLevel,
    reviewCount: event.reviewCount,
    nextReviewAt: event.nextReviewAt,
    createdAt: event.createdAt
  });
}

function reviewPresetDelay(preset: ReviewPreset) {
  const hour = 1000 * 60 * 60;
  const day = hour * 24;

  if (preset === "later-today") return hour * 4;
  return day * reviewPresetDays(preset);
}

function reviewPresetDays(preset: ReviewPreset) {
  if (preset === "daily" || preset === "tomorrow") return 1;
  if (preset === "two-days") return 2;
  if (preset === "three-days") return 3;
  if (preset === "four-days") return 4;
  if (preset === "five-days") return 5;
  if (preset === "six-days") return 6;
  if (preset === "next-week") return 7;
  if (preset === "fortnightly") return 14;
  if (preset === "three-weeks") return 21;
  if (preset === "three-months") return 90;
  if (preset === "six-months") return 180;
  if (preset === "annually") return 365;
  if (preset === "later-today") return 0;
  return 30;
}

type ReviewPreset =
  | "later-today"
  | "daily"
  | "tomorrow"
  | "two-days"
  | "three-days"
  | "four-days"
  | "five-days"
  | "six-days"
  | "next-week"
  | "fortnightly"
  | "three-weeks"
  | "next-month"
  | "three-months"
  | "six-months"
  | "annually";

function clampText(value: string | undefined, maxLength: number) {
  return (value || "").trim().slice(0, maxLength);
}

function clampOptionalText(value: string | undefined, maxLength: number) {
  const cleaned = clampText(value, maxLength);
  return cleaned || undefined;
}

function cleanCollections(collections: string[]) {
  return Array.from(
    new Set(
      collections
        .map((collection) => clampText(collection, 40).replace(/\s+/g, " "))
        .filter(Boolean)
    )
  ).slice(0, 8);
}

async function authorizeProfileAccess(ctx: QueryCtx | MutationCtx, profileId: Id<"profiles">) {
  const profile = await ctx.db.get(profileId);
  if (!profile) throw new Error("Profile not found");

  const authUserId = await getAuthUserId(ctx);
  if (profile.authUserId && !authUserId) throw new Error("Unauthorized");
  if (authUserId && profile.authUserId !== authUserId) throw new Error("Unauthorized");

  return profile;
}
