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
      tab: clampOptionalText(args.tab, 80),
      device: clampOptionalText(args.device, 160),
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
      profileId: args.profileId,
      eventType: clampText(args.eventType, 80),
      reference: clampOptionalText(args.reference, 160),
      methodId: clampOptionalText(args.methodId, 80),
      methodName: clampOptionalText(args.methodName, 120),
      translation: clampOptionalText(args.translation, 120),
      tab: clampOptionalText(args.tab, 80),
      book: clampOptionalText(args.book, 80),
      chapter: clampNumber(args.chapter, 0, 200),
      createdAt: Date.now()
    });
  }
});

export const requestAccountDeletion = mutation({
  args: {
    profileId: v.id("profiles"),
    note: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    const now = Date.now();
    const authUser = profile.authUserId ? await ctx.db.get(profile.authUserId) : null;

    const existing = await ctx.db
      .query("accountDeletionRequests")
      .withIndex("by_profile_status", (q) => q.eq("profileId", args.profileId).eq("status", "pending"))
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert("accountDeletionRequests", {
      profileId: args.profileId,
      authUserId: profile.authUserId,
      displayName: clampText(profile.displayName, 120) || "Bible student",
      email: clampOptionalText(authUser?.email, 254),
      note: clampOptionalText(args.note, 1000),
      status: "pending",
      requestedAt: now
    });
  }
});

export const cancelAccountDeletionRequest = mutation({
  args: {
    profileId: v.id("profiles")
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    const existing = await ctx.db
      .query("accountDeletionRequests")
      .withIndex("by_profile_status", (q) => q.eq("profileId", args.profileId).eq("status", "pending"))
      .first();
    if (!existing) return false;

    await ctx.db.patch(existing._id, {
      status: "cancelled",
      reviewedAt: Date.now()
    });
    return true;
  }
});

export const deletionRequestForProfile = query({
  args: {
    profileId: v.id("profiles")
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    return await ctx.db
      .query("accountDeletionRequests")
      .withIndex("by_profile_status", (q) => q.eq("profileId", args.profileId).eq("status", "pending"))
      .first();
  }
});

export const adminOverview = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) return null;

    const [events, feedback, profiles, sessions, deletionRequests] = await Promise.all([
      ctx.db.query("usageEvents").withIndex("by_created").order("desc").take(500),
      ctx.db.query("feedback").withIndex("by_created").order("desc").take(50),
      ctx.db.query("profiles").collect(),
      ctx.db.query("sessions").collect(),
      ctx.db.query("accountDeletionRequests").withIndex("by_status_requested", (q) => q.eq("status", "pending")).order("asc").take(25)
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
        newFeedback: feedback.filter((item) => item.status === "new").length,
        pendingDeletionRequests: deletionRequests.length
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
      recentFeedback: feedback.slice(0, 12),
      deletionRequests: deletionRequests.map((item) => ({
        _id: item._id,
        profileId: item.profileId,
        displayName: item.displayName,
        email: item.email,
        note: item.note,
        requestedAt: item.requestedAt
      }))
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

export const cancelDeletionRequestAsAdmin = mutation({
  args: {
    requestId: v.id("accountDeletionRequests")
  },
  handler: async (ctx, args) => {
    const adminUserId = await requireAdminUserId(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request || request.status !== "pending") return false;

    await ctx.db.patch(args.requestId, {
      status: "cancelled",
      reviewedAt: Date.now(),
      reviewedBy: adminUserId
    });
    return true;
  }
});

export const approveDeletionRequestAsAdmin = mutation({
  args: {
    requestId: v.id("accountDeletionRequests")
  },
  handler: async (ctx, args) => {
    const adminUserId = await requireAdminUserId(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request || request.status !== "pending") return false;

    const profile = await ctx.db.get(request.profileId);
    if (profile?.authUserId) {
      const user = await ctx.db.get(profile.authUserId);
      if (user?.email && isAdminEmail(user.email)) throw new Error("Admin accounts cannot be deleted from this panel.");
    }

    const now = Date.now();
    await deleteProfileData(ctx, request.profileId, profile?.authUserId || request.authUserId);
    await ctx.db.patch(args.requestId, {
      status: "approved",
      reviewedAt: now,
      reviewedBy: adminUserId,
      completedAt: now
    });
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

async function requireAdminUserId(ctx: QueryCtx | MutationCtx) {
  const authUserId = await getAuthUserId(ctx);
  if (!authUserId) throw new Error("Unauthorized");

  const user = await ctx.db.get(authUserId);
  if (!user?.email || !isAdminEmail(user.email)) throw new Error("Unauthorized");

  return authUserId;
}

async function isAdmin(ctx: QueryCtx | MutationCtx) {
  const authUserId = await getAuthUserId(ctx);
  if (!authUserId) return false;

  const user = await ctx.db.get(authUserId);
  const email = user?.email?.trim().toLowerCase();
  if (!email) return false;

  return isAdminEmail(email);
}

function isAdminEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  const allowlist = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return allowlist.includes(normalized);
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

function clampText(value: string | undefined, maxLength: number) {
  return (value || "").trim().slice(0, maxLength);
}

function clampOptionalText(value: string | undefined, maxLength: number) {
  const cleaned = clampText(value, maxLength);
  return cleaned || undefined;
}

function clampNumber(value: number | undefined, min: number, max: number) {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value)) return undefined;
  return Math.max(min, Math.min(max, Math.round(value)));
}

async function deleteProfileData(ctx: MutationCtx, profileId: Id<"profiles">, authUserId: Id<"users"> | undefined) {
  const [sessions, drafts, checkins, memoryVerses, feedback, usageEvents] = await Promise.all([
    ctx.db.query("sessions").withIndex("by_profile", (q) => q.eq("profileId", profileId)).collect(),
    ctx.db.query("drafts").withIndex("by_profile", (q) => q.eq("profileId", profileId)).collect(),
    ctx.db.query("checkins").withIndex("by_profile", (q) => q.eq("profileId", profileId)).collect(),
    ctx.db.query("memoryVerses").withIndex("by_profile", (q) => q.eq("profileId", profileId)).collect(),
    ctx.db.query("feedback").withIndex("by_profile_created", (q) => q.eq("profileId", profileId)).collect(),
    ctx.db.query("usageEvents").withIndex("by_profile_created", (q) => q.eq("profileId", profileId)).collect()
  ]);

  for (const item of [...sessions, ...drafts, ...checkins, ...memoryVerses, ...feedback, ...usageEvents]) {
    await ctx.db.delete(item._id);
  }

  const profile = await ctx.db.get(profileId);
  if (profile) await ctx.db.delete(profileId);

  if (!authUserId) return;

  const [accounts, sessionsForUser] = await Promise.all([
    ctx.db.query("authAccounts").withIndex("userIdAndProvider", (q) => q.eq("userId", authUserId)).collect(),
    ctx.db.query("authSessions").withIndex("userId", (q) => q.eq("userId", authUserId)).collect()
  ]);

  for (const account of accounts) {
    const codes = await ctx.db.query("authVerificationCodes").withIndex("accountId", (q) => q.eq("accountId", account._id)).collect();
    for (const code of codes) await ctx.db.delete(code._id);
    await ctx.db.delete(account._id);
  }

  for (const session of sessionsForUser) {
    const [refreshTokens, verifiers] = await Promise.all([
      ctx.db.query("authRefreshTokens").withIndex("sessionId", (q) => q.eq("sessionId", session._id)).collect(),
      ctx.db.query("authVerifiers").filter((q) => q.eq(q.field("sessionId"), session._id)).collect()
    ]);
    for (const token of refreshTokens) await ctx.db.delete(token._id);
    for (const verifier of verifiers) await ctx.db.delete(verifier._id);
    await ctx.db.delete(session._id);
  }

  const user = await ctx.db.get(authUserId);
  if (user) await ctx.db.delete(authUserId);
}
