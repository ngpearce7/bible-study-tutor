import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { assertProfileCanWrite, enforceRecentLimit, logSecurityEvent } from "./security";
import { v } from "convex/values";

const feedbackCategory = v.union(v.literal("bug"), v.literal("confusing"), v.literal("suggestion"), v.literal("encouragement"), v.literal("other"));
const USERNAME_AUTH_DOMAIN = "username.biblestudytutor.local";

function usernameFromCredential(value?: string) {
  const email = (value || "").trim().toLowerCase();
  if (!email.endsWith(`@${USERNAME_AUTH_DOMAIN}`)) return "";
  return email.slice(0, -1 * (`@${USERNAME_AUTH_DOMAIN}`).length);
}

function visibleAuthEmail(value?: string) {
  const email = (value || "").trim().toLowerCase();
  return usernameFromCredential(email) ? undefined : email || undefined;
}

export const submitFeedback = mutation({
  args: {
    profileId: v.id("profiles"),
    category: feedbackCategory,
    message: v.string(),
    tab: v.optional(v.string()),
    device: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);

    const message = args.message.trim();
    if (message.length < 8) throw new Error("Feedback is too short.");
    if (message.length > 2000) throw new Error("Feedback is too long.");

    const recent = await ctx.db
      .query("feedback")
      .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(20);
    if (recent.some((item) => Date.now() - item.createdAt < 15000)) {
      throw new Error("Please wait a moment before sending more feedback.");
    }
    await enforceRecentLimit(ctx, args.profileId, recent, "createdAt", { max: 20, windowMs: 24 * 60 * 60 * 1000, label: "Feedback" });

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
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    assertProfileCanWrite(profile);
    const recentEvents = await ctx.db
      .query("usageEvents")
      .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(100);
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (recentEvents.filter((event) => event.createdAt >= fiveMinutesAgo).length >= 100) {
      const recentSecurityEvents = await ctx.db
        .query("securityEvents")
        .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
        .order("desc")
        .take(1);
      if (!recentSecurityEvents.some((event) => event.eventType === "usage_rate_limited" && event.createdAt >= fiveMinutesAgo)) {
        await logSecurityEvent(ctx, {
          profileId: args.profileId,
          eventType: "usage_rate_limited",
          details: "Skipped usage event after 100 events in five minutes."
        });
      }
      return null;
    }

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
      email: clampOptionalText(visibleAuthEmail(authUser?.email), 254),
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

    const [events, feedback, profiles, sessions, deletionRequests, securityEvents] = await Promise.all([
      ctx.db.query("usageEvents").withIndex("by_created").order("desc").take(500),
      ctx.db.query("feedback").withIndex("by_created").order("desc").take(50),
      ctx.db.query("profiles").collect(),
      ctx.db.query("sessions").collect(),
      ctx.db.query("accountDeletionRequests").withIndex("by_status_requested", (q) => q.eq("status", "pending")).order("asc").take(25),
      ctx.db.query("securityEvents").withIndex("by_created").order("desc").take(20)
    ]);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const activeProfileIds = new Set(events.filter((item) => item.createdAt >= sevenDaysAgo).map((item) => item.profileId));
    const studyProfileIds = new Set(sessions.map((item) => item.profileId));
    const shareEvents = events.filter((item) => item.eventType === "app_shared");
    const recentSecurityEvents = securityEvents.filter((item) => item.createdAt >= sevenDaysAgo);
    const profileLookup = new Map(profiles.map((profile) => [profile._id, profile]));
    const securityEventRows = [];
    for (const item of securityEvents.slice(0, 12)) {
      const profile = profileLookup.get(item.profileId);
      const user = profile?.authUserId ? await ctx.db.get(profile.authUserId) : null;
      securityEventRows.push({
        _id: item._id,
        eventType: item.eventType,
        profileId: item.profileId,
        profileName: profile?.displayName || "Unknown profile",
        profileEmail: user?.email,
        suspendedAt: profile?.suspendedAt,
        securityReviewedAt: profile?.securityReviewedAt,
        securityReviewNote: profile?.securityReviewNote,
        details: item.details,
        createdAt: item.createdAt
      });
    }

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
        appShares: shareEvents.length,
        pendingDeletionRequests: deletionRequests.length,
        securityEvents24h: securityEvents.filter((item) => item.createdAt >= oneDayAgo).length,
        securityEvents7d: recentSecurityEvents.length,
        suspendedProfiles: profiles.filter((profile) => !!profile.suspendedAt).length
      },
      topBookmarked: topCounts(events.filter((item) => item.eventType === "bookmark_saved").map((item) => item.reference).filter(isString), 8),
      topMemory: topCounts(events.filter((item) => item.eventType === "memory_saved").map((item) => item.reference).filter(isString), 8),
      topMethods: topCounts(events.filter((item) => item.eventType === "study_completed").map((item) => item.methodName).filter(isString), 8),
      topSearches: topCounts(events.filter((item) => item.eventType === "bible_search").map((item) => item.reference).filter(isString), 8),
      shareSources: topCounts(shareEvents.map((item) => item.reference).filter(isString), 8),
      eventBreakdown: topCounts(events.map((item) => item.eventType).filter(isString), 10),
      feedbackByCategory: topCounts(feedback.map((item) => item.category).filter(isString), 8),
      feedbackByStatus: topCounts(feedback.map((item) => item.status).filter(isString), 8),
      securityByType: topCounts(recentSecurityEvents.map((item) => securityEventGroup(item.eventType, item.details)).filter(isString), 8),
      securityEvents: securityEventRows,
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

export const adminUsers = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) return null;

    const [profiles, sessions, drafts, checkins, memoryVerses, feedback, usageEvents, deletionRequests] = await Promise.all([
      ctx.db.query("profiles").collect(),
      ctx.db.query("sessions").collect(),
      ctx.db.query("drafts").collect(),
      ctx.db.query("checkins").collect(),
      ctx.db.query("memoryVerses").collect(),
      ctx.db.query("feedback").collect(),
      ctx.db.query("usageEvents").collect(),
      ctx.db.query("accountDeletionRequests").collect()
    ]);
    const profileStats = new Map<string, { studies: number; drafts: number; checkins: number; memoryVerses: number; feedback: number; events: number; lastActiveAt: number }>();

    for (const profile of profiles) {
      profileStats.set(profile._id, {
        studies: 0,
        drafts: 0,
        checkins: 0,
        memoryVerses: 0,
        feedback: 0,
        events: 0,
        lastActiveAt: profile.updatedAt || profile.createdAt
      });
    }

    incrementProfileStats(profileStats, sessions, "studies", "completedAt");
    incrementProfileStats(profileStats, drafts, "drafts", "updatedAt");
    incrementProfileStats(profileStats, checkins, "checkins", "createdAt");
    incrementProfileStats(profileStats, memoryVerses, "memoryVerses", "updatedAt");
    incrementProfileStats(profileStats, feedback, "feedback", "createdAt");
    incrementProfileStats(profileStats, usageEvents, "events", "createdAt");

    const rows = [];
    for (const profile of profiles) {
      const user = profile.authUserId ? await ctx.db.get(profile.authUserId) : null;
      const pendingDeletion = deletionRequests.find((item) => item.profileId === profile._id && item.status === "pending");
      const stats = profileStats.get(profile._id);
      rows.push({
        profileId: profile._id,
        authUserId: profile.authUserId,
        displayName: profile.displayName,
        email: visibleAuthEmail(user?.email),
        signedIn: !!profile.authUserId,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        lastActiveAt: stats?.lastActiveAt || profile.updatedAt || profile.createdAt,
        studies: stats?.studies || 0,
        drafts: stats?.drafts || 0,
        checkins: stats?.checkins || 0,
        memoryVerses: stats?.memoryVerses || 0,
        feedback: stats?.feedback || 0,
        events: stats?.events || 0,
        deletionStatus: pendingDeletion ? "pending" : "",
        suspendedAt: profile.suspendedAt,
        suspensionReason: profile.suspensionReason,
        securityReviewedAt: profile.securityReviewedAt,
        securityReviewNote: profile.securityReviewNote
      });
    }

    return rows.sort((a, b) => b.lastActiveAt - a.lastActiveAt).slice(0, 100);
  }
});

export const adminUserDetail = query({
  args: {
    profileId: v.id("profiles")
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) return null;

    const profile = await ctx.db.get(args.profileId);
    if (!profile) return null;

    const [user, sessions, drafts, checkins, memoryVerses, feedback, usageEvents, securityEvents, deletionRequests, authSessions] = await Promise.all([
      profile.authUserId ? ctx.db.get(profile.authUserId) : Promise.resolve(null),
      ctx.db.query("sessions").withIndex("by_profile", (q) => q.eq("profileId", args.profileId)).collect(),
      ctx.db.query("drafts").withIndex("by_profile", (q) => q.eq("profileId", args.profileId)).collect(),
      ctx.db.query("checkins").withIndex("by_profile", (q) => q.eq("profileId", args.profileId)).collect(),
      ctx.db.query("memoryVerses").withIndex("by_profile", (q) => q.eq("profileId", args.profileId)).collect(),
      ctx.db.query("feedback").withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId)).collect(),
      ctx.db.query("usageEvents").withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId)).collect(),
      ctx.db.query("securityEvents").withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId)).order("desc").take(50),
      ctx.db.query("accountDeletionRequests").withIndex("by_profile_status", (q) => q.eq("profileId", args.profileId).eq("status", "pending")).collect(),
      profile.authUserId ? ctx.db.query("authSessions").withIndex("userId", (q) => q.eq("userId", profile.authUserId!)).collect() : Promise.resolve([])
    ]);
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const writeTimestamps = [
      ...sessions.map((item) => item.completedAt),
      ...drafts.map((item) => item.updatedAt),
      ...checkins.map((item) => item.createdAt),
      ...memoryVerses.map((item) => item.updatedAt),
      ...feedback.map((item) => item.createdAt),
      ...usageEvents.map((item) => item.createdAt)
    ].filter((timestamp) => typeof timestamp === "number" && Number.isFinite(timestamp));
    const lastActiveAt = Math.max(
      profile.updatedAt || profile.createdAt,
      ...sessions.map((item) => item.completedAt),
      ...drafts.map((item) => item.updatedAt),
      ...checkins.map((item) => item.createdAt),
      ...memoryVerses.map((item) => item.updatedAt),
      ...feedback.map((item) => item.createdAt),
      ...usageEvents.map((item) => item.createdAt)
    );

    return {
      profileId: profile._id,
      displayName: profile.displayName,
      email: visibleAuthEmail(user?.email),
      signedIn: !!profile.authUserId,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      lastActiveAt,
      activeSessions: authSessions.length,
      deletionStatus: deletionRequests[0]?.status || "",
      suspendedAt: profile.suspendedAt,
      suspensionReason: profile.suspensionReason,
      securityReviewedAt: profile.securityReviewedAt,
      securityReviewNote: profile.securityReviewNote,
      writeVolume: {
        lastHour: writeTimestamps.filter((timestamp) => timestamp >= oneHourAgo).length,
        lastDay: writeTimestamps.filter((timestamp) => timestamp >= oneDayAgo).length,
        blockedEvents: securityEvents.length,
        latestBlockedAt: securityEvents[0]?.createdAt
      },
      counts: {
        studies: sessions.length,
        drafts: drafts.length,
        checkins: checkins.length,
        memoryVerses: memoryVerses.length,
        feedback: feedback.length,
        events: usageEvents.length
      },
      latestFeedback: feedback
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5)
        .map((item) => ({
          _id: item._id,
          category: item.category,
          status: item.status,
          tab: item.tab,
          createdAt: item.createdAt
        })),
      recentActivity: usageEvents
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 8)
        .map((item) => ({
          _id: item._id,
          eventType: item.eventType,
          reference: item.reference,
          tab: item.tab,
          createdAt: item.createdAt
        })),
      recentSecurityEvents: securityEvents
        .slice(0, 8)
        .map((item) => ({
          _id: item._id,
          eventType: item.eventType,
          details: item.details,
          createdAt: item.createdAt
        }))
    };
  }
});

export const adminAuditLog = query({
  args: {
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) return null;

    return await ctx.db
      .query("adminAuditLog")
      .withIndex("by_created")
      .order("desc")
      .take(Math.min(Math.max(Math.round(args.limit || 20), 1), 50));
  }
});

export const markFeedbackStatus = mutation({
  args: {
    feedbackId: v.id("feedback"),
    status: v.union(v.literal("new"), v.literal("reviewed"), v.literal("actioned"), v.literal("ignored"))
  },
  handler: async (ctx, args) => {
    const adminUserId = await requireAdminUserId(ctx);
    const feedback = await ctx.db.get(args.feedbackId);
    await ctx.db.patch(args.feedbackId, { status: args.status });
    await logAdminAction(ctx, {
      adminUserId,
      action: "feedback_status_changed",
      targetProfileId: feedback?.profileId,
      details: `Marked feedback ${args.status}`
    });
    return true;
  }
});

export const setProfileSuspensionAsAdmin = mutation({
  args: {
    profileId: v.id("profiles"),
    suspended: v.boolean(),
    reason: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const adminUserId = await requireAdminUserId(ctx);
    const profile = await ctx.db.get(args.profileId);
    if (!profile) throw new Error("Profile not found.");

    if (args.suspended && profile.authUserId) {
      const user = await ctx.db.get(profile.authUserId);
      if (user?.email && isAdminEmail(user.email)) throw new Error("Admin accounts cannot be suspended from this panel.");
    }

    const now = Date.now();
    await ctx.db.patch(args.profileId, args.suspended
      ? {
          suspendedAt: now,
          suspendedBy: adminUserId,
          suspensionReason: clampOptionalText(args.reason, 500) || "Manual admin pause",
          updatedAt: now
        }
      : {
          suspendedAt: undefined,
          suspendedBy: undefined,
          suspensionReason: undefined,
          updatedAt: now
        });
    await logAdminAction(ctx, {
      adminUserId,
      action: args.suspended ? "profile_suspended" : "profile_restored",
      targetProfileId: profile._id,
      targetUserId: profile.authUserId,
      details: args.suspended ? `Suspended profile: ${clampOptionalText(args.reason, 300) || "Manual admin pause"}` : "Restored profile"
    });
    return true;
  }
});

export const markProfileSecurityReviewedAsAdmin = mutation({
  args: {
    profileId: v.id("profiles"),
    note: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const adminUserId = await requireAdminUserId(ctx);
    const profile = await ctx.db.get(args.profileId);
    if (!profile) throw new Error("Profile not found.");

    const now = Date.now();
    const note = clampOptionalText(args.note, 500);
    await ctx.db.patch(args.profileId, {
      securityReviewedAt: now,
      securityReviewedBy: adminUserId,
      securityReviewNote: note || undefined,
      updatedAt: now
    });
    await logAdminAction(ctx, {
      adminUserId,
      action: "profile_security_reviewed",
      targetProfileId: profile._id,
      targetUserId: profile.authUserId,
      details: note ? `Marked security activity reviewed: ${note}` : "Marked security activity reviewed"
    });
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
    await logAdminAction(ctx, {
      adminUserId,
      action: "deletion_request_cancelled",
      targetProfileId: request.profileId,
      targetUserId: request.authUserId,
      targetEmail: request.email,
      details: "Admin cancelled account deletion request"
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
    await logAdminAction(ctx, {
      adminUserId,
      action: "account_deleted",
      targetProfileId: request.profileId,
      targetUserId: profile?.authUserId || request.authUserId,
      targetEmail: request.email,
      details: "Admin approved account deletion request"
    });
    return true;
  }
});

export const cleanupEmptyLocalProfilesAsAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const adminUserId = await requireAdminUserId(ctx);
    const profiles = await ctx.db.query("profiles").collect();
    let removed = 0;
    let kept = 0;

    for (const profile of profiles) {
      if (profile.authUserId) continue;

      const hasContent = await localProfileHasSavedContent(ctx, profile._id);
      if (hasContent) {
        kept += 1;
        continue;
      }

      await deleteProfileData(ctx, profile._id, undefined);
      removed += 1;
    }

    await logAdminAction(ctx, {
      adminUserId,
      action: "local_profiles_cleaned",
      details: `Removed ${removed} empty local/test profile${removed === 1 ? "" : "s"}; kept ${kept} local profile${kept === 1 ? "" : "s"} with saved content`
    });

    return { removed, kept };
  }
});

async function authorizeProfileAccess(ctx: QueryCtx | MutationCtx, profileId: Id<"profiles">) {
  const profile = await ctx.db.get(profileId);
  if (!profile) throw new Error("Profile not found");

  const authUserId = await getAuthUserId(ctx);
  if (profile.authUserId && !authUserId) throw new Error("Unauthorized");
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

function securityEventGroup(eventType: string | undefined, details: string | undefined) {
  const type = String(eventType || "").toLowerCase();
  const note = String(details || "").toLowerCase();
  if (type === "usage_rate_limited") return "Usage bursts";
  if (note.includes("feedback")) return "Feedback bursts";
  if (note.includes("memory")) return "Memory writes";
  if (note.includes("encouragement") || note.includes("shared")) return "Community writes";
  if (note.includes("friend")) return "Friend invites";
  if (note.includes("reaction")) return "Reactions";
  if (note.includes("draft")) return "Draft saves";
  if (note.includes("study")) return "Study saves";
  return "Other blocked writes";
}

function topCounts(values: string[], limit: number) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function incrementProfileStats(
  profileStats: Map<string, { studies: number; drafts: number; checkins: number; memoryVerses: number; feedback: number; events: number; lastActiveAt: number }>,
  items: { profileId: Id<"profiles">; [key: string]: unknown }[],
  countKey: "studies" | "drafts" | "checkins" | "memoryVerses" | "feedback" | "events",
  timestampKey: string
) {
  for (const item of items) {
    const stats = profileStats.get(item.profileId);
    if (!stats) continue;

    stats[countKey] += 1;
    const timestamp = item[timestampKey];
    if (typeof timestamp === "number" && Number.isFinite(timestamp)) {
      stats.lastActiveAt = Math.max(stats.lastActiveAt, timestamp);
    }
  }
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

async function localProfileHasSavedContent(ctx: MutationCtx, profileId: Id<"profiles">) {
  const [sessions, drafts, checkins, memoryVerses, memoryHistory, feedback, circles, members, requestedFriends, receivedFriends, posts, reactions, deletionRequests] = await Promise.all([
    ctx.db.query("sessions").withIndex("by_profile", (q) => q.eq("profileId", profileId)).take(1),
    ctx.db.query("drafts").withIndex("by_profile", (q) => q.eq("profileId", profileId)).take(1),
    ctx.db.query("checkins").withIndex("by_profile", (q) => q.eq("profileId", profileId)).take(1),
    ctx.db.query("memoryVerses").withIndex("by_profile", (q) => q.eq("profileId", profileId)).take(1),
    ctx.db.query("memoryHistory").withIndex("by_profile_created", (q) => q.eq("profileId", profileId)).take(1),
    ctx.db.query("feedback").withIndex("by_profile_created", (q) => q.eq("profileId", profileId)).take(1),
    ctx.db.query("communityCircles").withIndex("by_owner_profile", (q) => q.eq("ownerProfileId", profileId)).take(1),
    ctx.db.query("communityMembers").withIndex("by_profile", (q) => q.eq("profileId", profileId)).take(1),
    ctx.db.query("communityFriends").withIndex("by_requester", (q) => q.eq("requesterProfileId", profileId)).take(1),
    ctx.db.query("communityFriends").withIndex("by_recipient", (q) => q.eq("recipientProfileId", profileId)).take(1),
    ctx.db.query("communityPosts").withIndex("by_profile_created", (q) => q.eq("profileId", profileId)).take(1),
    ctx.db.query("communityReactions").withIndex("by_profile", (q) => q.eq("profileId", profileId)).take(1),
    ctx.db.query("accountDeletionRequests").withIndex("by_profile_status", (q) => q.eq("profileId", profileId)).take(1)
  ]);

  return [sessions, drafts, checkins, memoryVerses, memoryHistory, feedback, circles, members, requestedFriends, receivedFriends, posts, reactions, deletionRequests].some((items) => items.length > 0);
}

async function deleteProfileData(ctx: MutationCtx, profileId: Id<"profiles">, authUserId: Id<"users"> | undefined) {
  const [sessions, drafts, checkins, memoryVerses, memoryHistory, feedback, usageEvents, communityPosts, communityReactions] = await Promise.all([
    ctx.db.query("sessions").withIndex("by_profile", (q) => q.eq("profileId", profileId)).collect(),
    ctx.db.query("drafts").withIndex("by_profile", (q) => q.eq("profileId", profileId)).collect(),
    ctx.db.query("checkins").withIndex("by_profile", (q) => q.eq("profileId", profileId)).collect(),
    ctx.db.query("memoryVerses").withIndex("by_profile", (q) => q.eq("profileId", profileId)).collect(),
    ctx.db.query("memoryHistory").withIndex("by_profile_created", (q) => q.eq("profileId", profileId)).collect(),
    ctx.db.query("feedback").withIndex("by_profile_created", (q) => q.eq("profileId", profileId)).collect(),
    ctx.db.query("usageEvents").withIndex("by_profile_created", (q) => q.eq("profileId", profileId)).collect(),
    ctx.db.query("communityPosts").withIndex("by_profile_created", (q) => q.eq("profileId", profileId)).collect(),
    ctx.db.query("communityReactions").withIndex("by_profile", (q) => q.eq("profileId", profileId)).collect()
  ]);

  for (const item of [...sessions, ...drafts, ...checkins, ...memoryVerses, ...memoryHistory, ...feedback, ...usageEvents, ...communityPosts, ...communityReactions]) {
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

async function logAdminAction(
  ctx: MutationCtx,
  args: {
    adminUserId: Id<"users">;
    action: string;
    targetProfileId?: Id<"profiles">;
    targetUserId?: Id<"users">;
    targetEmail?: string;
    details?: string;
  }
) {
  await ctx.db.insert("adminAuditLog", {
    adminUserId: args.adminUserId,
    action: clampText(args.action, 80),
    targetProfileId: args.targetProfileId,
    targetUserId: args.targetUserId,
    targetEmail: clampOptionalText(args.targetEmail, 254),
    details: clampOptionalText(args.details, 500),
    createdAt: Date.now()
  });
}
