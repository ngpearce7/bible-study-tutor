import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

const feedbackCategory = v.union(v.literal("bug"), v.literal("confusing"), v.literal("suggestion"), v.literal("encouragement"), v.literal("other"));

export const submitFeedback = mutation({
  args: {
    profileId: v.id("profiles"),
    category: feedbackCategory,
    message: v.string(),
    tab: v.optional(v.string()),
    device: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    const message = args.message.trim();
    if (message.length < 8) throw new Error("Feedback is too short.");
    if (message.length > 2000) throw new Error("Feedback is too long.");

    const recent = await ctx.db
      .query("feedback")
      .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(3);
    if (recent.some((item) => Date.now() - item.createdAt < 15000)) {
      throw new Error("Please wait a moment before sending more feedback.");
    }

    return await ctx.db.insert("feedback", {
      profileId: args.profileId,
      category: args.category,
      message,
      tab: args.tab,
      device: args.device,
      status: "new",
      createdAt: Date.now()
    });
  }
});

export const recordUsage = mutation({
  args: {
    profileId: v.id("profiles"),
    eventType: v.string(),
    reference: v.optional(v.string()),
    methodId: v.optional(v.string()),
    methodName: v.optional(v.string()),
    translation: v.optional(v.string()),
    tab: v.optional(v.string()),
    book: v.optional(v.string()),
    chapter: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    return await ctx.db.insert("usageEvents", {
      ...args,
      eventType: args.eventType.slice(0, 80),
      createdAt: Date.now()
    });
  }
});

export const adminOverview = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) return null;

    const [events, feedback, profiles, sessions] = await Promise.all([
      ctx.db.query("usageEvents").withIndex("by_created").order("desc").take(500),
      ctx.db.query("feedback").withIndex("by_created").order("desc").take(50),
      ctx.db.query("profiles").collect(),
      ctx.db.query("sessions").collect()
    ]);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeProfileIds = new Set(events.filter((item) => item.createdAt >= sevenDaysAgo).map((item) => item.profileId));
    const studyProfileIds = new Set(sessions.map((item) => item.profileId));

    return {
      totals: {
        profiles: profiles.length,
        signedInProfiles: profiles.filter((profile) => !!profile.authUserId).length,
        localProfiles: profiles.filter((profile) => !profile.authUserId).length,
        activeProfiles7d: activeProfileIds.size,
        profilesWithStudies: studyProfileIds.size,
        events: events.length,
        feedback: feedback.length,
        newFeedback: feedback.filter((item) => item.status === "new").length
      },
      topBookmarked: topCounts(events.filter((item) => item.eventType === "bookmark_saved").map((item) => item.reference).filter(isString), 8),
      topMemory: topCounts(events.filter((item) => item.eventType === "memory_saved").map((item) => item.reference).filter(isString), 8),
      topMethods: topCounts(events.filter((item) => item.eventType === "study_completed").map((item) => item.methodName).filter(isString), 8),
      topSearches: topCounts(events.filter((item) => item.eventType === "bible_search").map((item) => item.reference).filter(isString), 8),
      eventBreakdown: topCounts(events.map((item) => item.eventType).filter(isString), 10),
      feedbackByCategory: topCounts(feedback.map((item) => item.category).filter(isString), 8),
      feedbackByStatus: topCounts(feedback.map((item) => item.status).filter(isString), 8),
      recentEvents: events.slice(0, 12).map((item) => ({
        _id: item._id,
        eventType: item.eventType,
        reference: item.reference,
        methodName: item.methodName,
        tab: item.tab,
        createdAt: item.createdAt
      })),
      recentFeedback: feedback.slice(0, 12)
    };
  }
});

export const markFeedbackStatus = mutation({
  args: {
    feedbackId: v.id("feedback"),
    status: v.union(v.literal("new"), v.literal("reviewed"), v.literal("actioned"), v.literal("ignored"))
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) throw new Error("Unauthorized");
    await ctx.db.patch(args.feedbackId, { status: args.status });
    return true;
  }
});

async function authorizeProfileAccess(ctx: QueryCtx | MutationCtx, profileId: Id<"profiles">) {
  const profile = await ctx.db.get(profileId);
  if (!profile) throw new Error("Profile not found");

  const authUserId = await getAuthUserId(ctx);
  if (authUserId && profile.authUserId !== authUserId) throw new Error("Unauthorized");

  return profile;
}

async function isAdmin(ctx: QueryCtx | MutationCtx) {
  const authUserId = await getAuthUserId(ctx);
  if (!authUserId) return false;

  const user = await ctx.db.get(authUserId);
  const email = user?.email?.trim().toLowerCase();
  if (!email) return false;

  const allowlist = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return allowlist.includes(email);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function topCounts(values: string[], limit: number) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}
