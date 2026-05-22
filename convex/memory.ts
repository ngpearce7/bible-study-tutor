import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

const memoryStatus = v.union(v.literal("new"), v.literal("learning"), v.literal("review"), v.literal("memorized"));
const reviewPreset = v.union(v.literal("later-today"), v.literal("tomorrow"), v.literal("three-days"), v.literal("next-week"), v.literal("next-month"));

export const saveVerse = mutation({
  args: {
    profileId: v.id("profiles"),
    reference: v.string(),
    verseText: v.string(),
    translationName: v.string(),
    note: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);
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
      await ctx.db.patch(existing._id, {
        verseText: cleaned.verseText,
        translationName: cleaned.translationName,
        note: cleaned.note,
        updatedAt: now
      });
      return existing._id;
    }

    return await ctx.db.insert("memoryVerses", {
      ...cleaned,
      status: "new",
      practiceLevel: 1,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now
    });
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
    await authorizeProfileAccess(ctx, args.profileId);

    const verse = await ctx.db.get(args.memoryVerseId);
    if (!verse || verse.profileId !== args.profileId) return false;

    const now = Date.now();
    const currentPracticeLevel = Math.max(1, Math.min(3, Math.round(args.practiceLevel || 1)));
    const nextPracticeLevel = args.result === "got-it" ? Math.min(3, currentPracticeLevel + 1) : Math.max(1, currentPracticeLevel - 1);
    const status = currentPracticeLevel >= 3 && args.result === "got-it" ? "memorized" : nextPracticeLevel >= 2 ? "review" : "learning";
    const nextReviewDelay = args.result === "got-it" ? 1000 * 60 * 60 * 24 * nextPracticeLevel : 1000 * 60 * 60 * 4;

    await ctx.db.patch(args.memoryVerseId, {
      status,
      practiceLevel: nextPracticeLevel,
      reviewCount: verse.reviewCount + 1,
      lastReviewedAt: now,
      nextReviewAt: now + nextReviewDelay,
      updatedAt: now
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
    await authorizeProfileAccess(ctx, args.profileId);

    const verse = await ctx.db.get(args.memoryVerseId);
    if (!verse || verse.profileId !== args.profileId) return false;

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
    await ctx.db.patch(args.memoryVerseId, {
      status: verse.status === "memorized" ? verse.status : "review",
      nextReviewAt: now + reviewPresetDelay(args.preset),
      updatedAt: now
    });
    return true;
  }
});

function reviewPresetDelay(preset: "later-today" | "tomorrow" | "three-days" | "next-week" | "next-month") {
  const hour = 1000 * 60 * 60;
  const day = hour * 24;

  if (preset === "later-today") return hour * 4;
  if (preset === "tomorrow") return day;
  if (preset === "three-days") return day * 3;
  if (preset === "next-week") return day * 7;
  return day * 30;
}

function clampText(value: string | undefined, maxLength: number) {
  return (value || "").trim().slice(0, maxLength);
}

function clampOptionalText(value: string | undefined, maxLength: number) {
  const cleaned = clampText(value, maxLength);
  return cleaned || undefined;
}

async function authorizeProfileAccess(ctx: QueryCtx | MutationCtx, profileId: Id<"profiles">) {
  const profile = await ctx.db.get(profileId);
  if (!profile) throw new Error("Profile not found");

  const authUserId = await getAuthUserId(ctx);
  if (authUserId && profile.authUserId !== authUserId) throw new Error("Unauthorized");

  return profile;
}
