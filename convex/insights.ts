import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { assertProfileCanWrite, enforceRecentLimit, logSecurityEvent } from "./security";
import { countsTowardStudyRhythm, recordStudyActivity, usageEventIncrements } from "./statisticsModel";
import { v } from "convex/values";
import { paginationOptsValidator, paginationResultValidator } from "convex/server";

const feedbackCategory = v.union(v.literal("bug"), v.literal("confusing"), v.literal("suggestion"), v.literal("encouragement"), v.literal("other"));
const publicAnalyticsEventType = v.union(
  v.literal("public_page_view"),
  v.literal("seo_cta_clicked"),
  v.literal("start_study_clicked"),
  v.literal("bible_reader_opened"),
  v.literal("plans_opened"),
  v.literal("memory_opened"),
  v.literal("method_selected"),
  v.literal("method_page_cta_clicked"),
  v.literal("worksheet_cta_clicked"),
  v.literal("account_creation_started"),
  v.literal("study_completed"),
  v.literal("app_shared")
);
const USERNAME_AUTH_DOMAIN = "username.biblestudytutor.local";
const adminUserRowValidator = v.object({
  profileId: v.id("profiles"),
  authUserId: v.optional(v.id("users")),
  displayName: v.string(),
  email: v.optional(v.string()),
  signedIn: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
  lastActiveAt: v.number(),
  studies: v.number(),
  drafts: v.number(),
  checkins: v.number(),
  memoryVerses: v.number(),
  feedback: v.number(),
  events: v.number(),
  deletionStatus: v.string(),
  suspendedAt: v.optional(v.number()),
  suspensionReason: v.optional(v.string()),
  securityReviewedAt: v.optional(v.number()),
  securityReviewNote: v.optional(v.string())
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

export const submitFeedback = mutation({
  args: {
    profileId: v.id("profiles"),
    category: feedbackCategory,
    message: v.string(),
    tab: v.optional(v.string()),
    device: v.optional(v.string())
  },
  returns: v.any(),
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
    chapter: v.optional(v.number()),
    localDayKey: v.optional(v.string())
  },
  returns: v.any(),
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

    const createdAt = Date.now();
    const eventType = clampText(args.eventType, 80);
    const eventId = await ctx.db.insert("usageEvents", {
      profileId: args.profileId,
      eventType,
      reference: clampOptionalText(args.reference, 160),
      methodId: clampOptionalText(args.methodId, 80),
      methodName: clampOptionalText(args.methodName, 120),
      translation: clampOptionalText(args.translation, 120),
      tab: clampOptionalText(args.tab, 80),
      book: clampOptionalText(args.book, 80),
      chapter: clampNumber(args.chapter, 0, 200),
      createdAt
    });
    if (countsTowardStudyRhythm(eventType)) {
      await recordStudyActivity(ctx, {
        profileId: args.profileId,
        timestamp: createdAt,
        localDayKey: args.localDayKey,
        increments: usageEventIncrements(eventType)
      });
    }
    return eventId;
  }
});

export const recordPublicAnalytics = internalMutation({
  args: {
    eventType: publicAnalyticsEventType,
    pagePath: v.optional(v.string()),
    source: v.optional(v.string()),
    ctaTarget: v.optional(v.string()),
    methodId: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const recentPublicEvents = await ctx.db.query("publicAnalyticsEvents").withIndex("by_created").order("desc").take(600);
    if (recentPublicEvents.length >= 600 && recentPublicEvents[recentPublicEvents.length - 1]?.createdAt >= oneMinuteAgo) {
      return null;
    }

    return await ctx.db.insert("publicAnalyticsEvents", {
      eventType: args.eventType,
      pagePath: sanitizePublicPath(args.pagePath),
      source: clampOptionalText(args.source, 80),
      ctaTarget: clampOptionalText(args.ctaTarget, 120),
      methodId: clampOptionalText(args.methodId, 80),
      createdAt: Date.now()
    });
  }
});

export const requestAccountDeletion = mutation({
  args: {
    profileId: v.id("profiles"),
    note: v.optional(v.string())
  },
  returns: v.any(),
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
  returns: v.any(),
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
  returns: v.any(),
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
  returns: v.any(),
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) return null;

    const [events, publicEvents, feedback, profiles, studyStats, deletionRequests, securityEvents] = await Promise.all([
      ctx.db.query("usageEvents").withIndex("by_created").order("desc").take(500),
      ctx.db.query("publicAnalyticsEvents").withIndex("by_created").order("desc").take(500),
      ctx.db.query("feedback").withIndex("by_created").order("desc").take(50),
      ctx.db.query("profiles").withIndex("by_updated_at").order("desc").take(2000),
      ctx.db.query("studyStats").take(2000),
      ctx.db.query("accountDeletionRequests").withIndex("by_status_requested", (q) => q.eq("status", "pending")).order("asc").take(25),
      ctx.db.query("securityEvents").withIndex("by_created").order("desc").take(20)
    ]);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const activeProfileIds = new Set(events.filter((item) => item.createdAt >= sevenDaysAgo).map((item) => item.profileId));
    const studyProfileIds = new Set(studyStats.filter((item) => item.sessionCount > 0).map((item) => item.profileId));
    const shareEvents = events.filter((item) => item.eventType === "app_shared");
    const recentPublicEvents = publicEvents.filter((item) => item.createdAt >= sevenDaysAgo);
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
        publicEvents: publicEvents.length,
        publicPageViews7d: recentPublicEvents.filter((item) => item.eventType === "public_page_view").length,
        publicConversions7d: recentPublicEvents.filter((item) => item.eventType !== "public_page_view").length,
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
      publicEventBreakdown: topCounts(publicEvents.map((item) => item.eventType).filter(isString), 10),
      topPublicPages: topCounts(publicEvents.filter((item) => item.eventType === "public_page_view").map((item) => item.pagePath).filter(isString), 8),
      topPublicCtas: topCounts(publicEvents.filter((item) => item.eventType !== "public_page_view").map((item) => item.ctaTarget || item.source || item.eventType).filter(isString), 8),
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
      recentPublicEvents: publicEvents.slice(0, 12).map((item) => ({
        _id: item._id,
        eventType: item.eventType,
        pagePath: item.pagePath,
        source: item.source,
        ctaTarget: item.ctaTarget,
        methodId: item.methodId,
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

export const adminUsersPage = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(adminUserRowValidator),
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) return { page: [], isDone: true, continueCursor: "" };

    const profilesPage = await ctx.db
      .query("profiles")
      .withIndex("by_updated_at")
      .order("desc")
      .paginate(args.paginationOpts);
    const page = await Promise.all(profilesPage.page.map((profile) => buildAdminUserRow(ctx, profile)));
    return { ...profilesPage, page };
  }
});

async function buildAdminUserRow(ctx: QueryCtx, profile: Doc<"profiles">) {
  const [user, aggregate, sessions, drafts, checkins, memoryVerses, feedback, usageEvents, pendingDeletion] = await Promise.all([
    profile.authUserId ? ctx.db.get(profile.authUserId) : Promise.resolve(null),
    ctx.db.query("studyStats").withIndex("by_profile", (q) => q.eq("profileId", profile._id)).unique(),
    ctx.db.query("sessions").withIndex("by_profile_completed", (q) => q.eq("profileId", profile._id)).order("desc").take(501),
    ctx.db.query("drafts").withIndex("by_profile_updated", (q) => q.eq("profileId", profile._id)).order("desc").take(501),
    ctx.db.query("checkins").withIndex("by_profile_created", (q) => q.eq("profileId", profile._id)).order("desc").take(501),
    ctx.db.query("memoryVerses").withIndex("by_profile_updated", (q) => q.eq("profileId", profile._id)).order("desc").take(501),
    ctx.db.query("feedback").withIndex("by_profile_created", (q) => q.eq("profileId", profile._id)).order("desc").take(501),
    ctx.db.query("usageEvents").withIndex("by_profile_created", (q) => q.eq("profileId", profile._id)).order("desc").take(501),
    ctx.db.query("accountDeletionRequests").withIndex("by_profile_status", (q) => q.eq("profileId", profile._id).eq("status", "pending")).first()
  ]);
  const lastActiveAt = Math.max(
    profile.updatedAt || profile.createdAt,
    sessions[0]?.completedAt || 0,
    drafts[0]?.updatedAt || 0,
    checkins[0]?.createdAt || 0,
    memoryVerses[0]?.updatedAt || 0,
    feedback[0]?.createdAt || 0,
    usageEvents[0]?.createdAt || 0
  );
  return {
    profileId: profile._id,
    authUserId: profile.authUserId,
    displayName: profile.displayName,
    email: visibleAuthEmail(user?.email),
    signedIn: !!profile.authUserId,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    lastActiveAt,
    studies: aggregate?.sessionCount ?? Math.min(sessions.length, 500),
    drafts: Math.min(drafts.length, 500),
    checkins: Math.min(checkins.length, 500),
    memoryVerses: Math.min(memoryVerses.length, 500),
    feedback: Math.min(feedback.length, 500),
    events: Math.min(usageEvents.length, 500),
    deletionStatus: pendingDeletion ? "pending" : "",
    suspendedAt: profile.suspendedAt,
    suspensionReason: profile.suspensionReason,
    securityReviewedAt: profile.securityReviewedAt,
    securityReviewNote: profile.securityReviewNote
  };
}

export const adminUserDetail = query({
  args: {
    profileId: v.id("profiles")
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) return null;

    const profile = await ctx.db.get(args.profileId);
    if (!profile) return null;

    const [user, sessions, drafts, checkins, memoryVerses, feedback, usageEvents, securityEvents, deletionRequests, authSessions] = await Promise.all([
      profile.authUserId ? ctx.db.get(profile.authUserId) : Promise.resolve(null),
      ctx.db.query("sessions").withIndex("by_profile", (q) => q.eq("profileId", args.profileId)).take(500),
      ctx.db.query("drafts").withIndex("by_profile", (q) => q.eq("profileId", args.profileId)).take(500),
      ctx.db.query("checkins").withIndex("by_profile", (q) => q.eq("profileId", args.profileId)).take(500),
      ctx.db.query("memoryVerses").withIndex("by_profile", (q) => q.eq("profileId", args.profileId)).take(500),
      ctx.db.query("feedback").withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId)).take(500),
      ctx.db.query("usageEvents").withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId)).take(500),
      ctx.db.query("securityEvents").withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId)).order("desc").take(50),
      ctx.db.query("accountDeletionRequests").withIndex("by_profile_status", (q) => q.eq("profileId", args.profileId).eq("status", "pending")).take(1),
      profile.authUserId ? ctx.db.query("authSessions").withIndex("userId", (q) => q.eq("userId", profile.authUserId!)).take(100) : Promise.resolve([])
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
  returns: v.any(),
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
  returns: v.any(),
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
  returns: v.any(),
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
  returns: v.any(),
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
  returns: v.any(),
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
  returns: v.boolean(),
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
    await enqueueProfileCleanupJob(ctx, {
      profileId: request.profileId,
      authUserId: profile?.authUserId || request.authUserId,
      deletionRequestId: request._id,
      requestedBy: adminUserId
    });
    await ctx.db.patch(args.requestId, {
      status: "approved",
      reviewedAt: now,
      reviewedBy: adminUserId
    });
    await logAdminAction(ctx, {
      adminUserId,
      action: "account_deletion_queued",
      targetProfileId: request.profileId,
      targetUserId: profile?.authUserId || request.authUserId,
      targetEmail: request.email,
      details: "Admin approved account deletion; bounded cleanup job queued"
    });
    return true;
  }
});

export const cleanupEmptyLocalProfilesAsAdmin = mutation({
  args: {},
  returns: v.object({ queued: v.number(), kept: v.number() }),
  handler: async (ctx) => {
    const adminUserId = await requireAdminUserId(ctx);
    const profiles = await ctx.db
      .query("profiles")
      .withIndex("by_auth_user_and_updated_at", (q) => q.eq("authUserId", undefined))
      .order("asc")
      .take(100);
    let queued = 0;
    let kept = 0;

    for (const profile of profiles) {
      const hasContent = await localProfileHasSavedContent(ctx, profile._id);
      if (hasContent) {
        kept += 1;
        continue;
      }

      const job = await enqueueProfileCleanupJob(ctx, { profileId: profile._id, requestedBy: adminUserId });
      if (job.created) queued += 1;
      if (queued >= 20) break;
    }

    await logAdminAction(ctx, {
      adminUserId,
      action: "local_profiles_cleaned",
      details: `Queued ${queued} empty local/test profile${queued === 1 ? "" : "s"} for cleanup; kept ${kept} local profile${kept === 1 ? "" : "s"} with saved content`
    });

    return { queued, kept };
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

function sanitizePublicPath(value: string | undefined) {
  const cleaned = clampText(value, 160);
  if (!cleaned?.startsWith("/")) return undefined;
  try {
    const url = new URL(cleaned, "https://biblestudytutor.org");
    if (/^\/(?:account|admin|journal|accountability|community)(?:\/|$)/i.test(url.pathname)) return undefined;

    const safeParams = new URLSearchParams();
    const tab = url.searchParams.get("tab");
    if (tab && ["home", "study", "bible", "plans", "methods", "memory", "help"].includes(tab)) {
      safeParams.set("tab", tab);
    }
    const method = url.searchParams.get("method");
    if (method && /^[a-z0-9-]{1,40}$/i.test(method)) {
      safeParams.set("method", method);
    }
    const query = safeParams.toString();
    return `${url.pathname || "/"}${query ? `?${query}` : ""}`.slice(0, 160);
  } catch {
    return undefined;
  }
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

const CLEANUP_BATCH_SIZE = 40;

type ProfileCleanupPhase =
  | "ownedCircles"
  | "authoredPosts"
  | "receivedPosts"
  | "reactions"
  | "memberships"
  | "requestedFriends"
  | "receivedFriends"
  | "sessions"
  | "drafts"
  | "checkins"
  | "memoryVerses"
  | "memoryHistory"
  | "feedback"
  | "usageEvents"
  | "securityEvents"
  | "bookmarks"
  | "customPlans"
  | "planCompletions"
  | "dailyStats"
  | "notifications"
  | "deletionRequests"
  | "singletonData"
  | "authAccounts"
  | "authSessions"
  | "profile";

const PROFILE_CLEANUP_PHASES: ProfileCleanupPhase[] = [
  "ownedCircles",
  "authoredPosts",
  "receivedPosts",
  "reactions",
  "memberships",
  "requestedFriends",
  "receivedFriends",
  "sessions",
  "drafts",
  "checkins",
  "memoryVerses",
  "memoryHistory",
  "feedback",
  "usageEvents",
  "securityEvents",
  "bookmarks",
  "customPlans",
  "planCompletions",
  "dailyStats",
  "notifications",
  "deletionRequests",
  "singletonData",
  "authAccounts",
  "authSessions",
  "profile"
];

async function enqueueProfileCleanupJob(
  ctx: MutationCtx,
  args: {
    profileId: Id<"profiles">;
    authUserId?: Id<"users">;
    deletionRequestId?: Id<"accountDeletionRequests">;
    requestedBy?: Id<"users">;
  }
) {
  const pending = await ctx.db
    .query("cleanupJobs")
    .withIndex("by_profile_and_status", (q) => q.eq("profileId", args.profileId).eq("status", "pending"))
    .first();
  const running = pending
    ? null
    : await ctx.db
        .query("cleanupJobs")
        .withIndex("by_profile_and_status", (q) => q.eq("profileId", args.profileId).eq("status", "running"))
        .first();
  const existing = pending || running;
  if (existing) {
    if (args.authUserId || args.deletionRequestId || args.requestedBy) {
      await ctx.db.patch(existing._id, {
        authUserId: args.authUserId ?? existing.authUserId,
        deletionRequestId: args.deletionRequestId ?? existing.deletionRequestId,
        requestedBy: args.requestedBy ?? existing.requestedBy,
        updatedAt: Date.now()
      });
    }
    return { jobId: existing._id, created: false };
  }

  const now = Date.now();
  const jobId = await ctx.db.insert("cleanupJobs", {
    kind: "profile",
    profileId: args.profileId,
    authUserId: args.authUserId,
    deletionRequestId: args.deletionRequestId,
    requestedBy: args.requestedBy,
    phase: PROFILE_CLEANUP_PHASES[0],
    status: "pending",
    createdAt: now,
    updatedAt: now
  });
  await ctx.scheduler.runAfter(0, internal.insights.runCleanupJob, { jobId });
  return { jobId, created: true };
}

export const runCleanupJob = internalMutation({
  args: { jobId: v.id("cleanupJobs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job || job.status === "complete") return null;

    await ctx.db.patch(job._id, { status: "running", lastError: undefined, updatedAt: Date.now() });
    try {
      const complete =
        job.kind === "post"
          ? await cleanupPost(ctx, job.postId)
          : job.kind === "circle"
            ? await cleanupCircle(ctx, job.circleId)
            : await cleanupProfilePhase(ctx, job);

      if (complete) {
        await ctx.db.patch(job._id, { status: "complete", updatedAt: Date.now() });
      } else {
        await ctx.db.patch(job._id, { status: "pending", updatedAt: Date.now() });
        await ctx.scheduler.runAfter(0, internal.insights.runCleanupJob, { jobId: job._id });
      }
    } catch (error) {
      const attempts = (job.attempts ?? 0) + 1;
      const shouldRetry = attempts < 3;
      await ctx.db.patch(job._id, {
        status: shouldRetry ? "pending" : "failed",
        attempts,
        lastError: error instanceof Error ? error.message.slice(0, 500) : "Cleanup failed",
        updatedAt: Date.now()
      });
      if (shouldRetry) {
        await ctx.scheduler.runAfter(1000 * attempts, internal.insights.runCleanupJob, { jobId: job._id });
      }
    }
    return null;
  }
});

async function cleanupPost(ctx: MutationCtx, postId: Id<"communityPosts"> | undefined) {
  if (!postId || !(await ctx.db.get(postId))) return true;
  const reactions = await ctx.db
    .query("communityReactions")
    .withIndex("by_post", (q) => q.eq("postId", postId))
    .take(CLEANUP_BATCH_SIZE);
  if (reactions.length > 0) {
    await deleteDocuments(ctx, reactions);
    return false;
  }
  await ctx.db.delete(postId);
  return true;
}

async function cleanupCircle(ctx: MutationCtx, circleId: Id<"communityCircles"> | undefined) {
  if (!circleId || !(await ctx.db.get(circleId))) return true;
  const post = await ctx.db
    .query("communityPosts")
    .withIndex("by_circle_created", (q) => q.eq("circleId", circleId))
    .first();
  if (post) {
    await cleanupPost(ctx, post._id);
    return false;
  }
  const members = await ctx.db
    .query("communityMembers")
    .withIndex("by_circle", (q) => q.eq("circleId", circleId))
    .take(CLEANUP_BATCH_SIZE);
  if (members.length > 0) {
    await deleteDocuments(ctx, members);
    return false;
  }
  await ctx.db.delete(circleId);
  return true;
}

async function cleanupProfilePhase(ctx: MutationCtx, job: Doc<"cleanupJobs">) {
  const profileId = job.profileId;
  if (!profileId) return true;
  const phase = PROFILE_CLEANUP_PHASES.includes(job.phase as ProfileCleanupPhase)
    ? (job.phase as ProfileCleanupPhase)
    : PROFILE_CLEANUP_PHASES[0];

  if (phase === "ownedCircles") {
    const circle = await ctx.db.query("communityCircles").withIndex("by_owner_profile", (q) => q.eq("ownerProfileId", profileId)).first();
    if (circle) {
      await cleanupCircle(ctx, circle._id);
      return false;
    }
  } else if (phase === "authoredPosts") {
    const post = await ctx.db.query("communityPosts").withIndex("by_profile_created", (q) => q.eq("profileId", profileId)).first();
    if (post) {
      await cleanupPost(ctx, post._id);
      return false;
    }
  } else if (phase === "receivedPosts") {
    const post = await ctx.db.query("communityPosts").withIndex("by_recipient_profile_created", (q) => q.eq("recipientProfileId", profileId)).first();
    if (post) {
      await cleanupPost(ctx, post._id);
      return false;
    }
  } else if (phase === "reactions") {
    if (await deleteProfileBatch(ctx, "communityReactions", "by_profile", profileId)) return false;
  } else if (phase === "memberships") {
    if (await deleteProfileBatch(ctx, "communityMembers", "by_profile", profileId)) return false;
  } else if (phase === "requestedFriends") {
    const rows = await ctx.db.query("communityFriends").withIndex("by_requester", (q) => q.eq("requesterProfileId", profileId)).take(CLEANUP_BATCH_SIZE);
    if (rows.length) { await deleteDocuments(ctx, rows); return false; }
  } else if (phase === "receivedFriends") {
    const rows = await ctx.db.query("communityFriends").withIndex("by_recipient", (q) => q.eq("recipientProfileId", profileId)).take(CLEANUP_BATCH_SIZE);
    if (rows.length) { await deleteDocuments(ctx, rows); return false; }
  } else if (phase === "sessions") {
    if (await deleteProfileBatch(ctx, "sessions", "by_profile", profileId)) return false;
  } else if (phase === "drafts") {
    if (await deleteProfileBatch(ctx, "drafts", "by_profile", profileId)) return false;
  } else if (phase === "checkins") {
    if (await deleteProfileBatch(ctx, "checkins", "by_profile", profileId)) return false;
  } else if (phase === "memoryVerses") {
    if (await deleteProfileBatch(ctx, "memoryVerses", "by_profile", profileId)) return false;
  } else if (phase === "memoryHistory") {
    if (await deleteProfileBatch(ctx, "memoryHistory", "by_profile_created", profileId)) return false;
  } else if (phase === "feedback") {
    if (await deleteProfileBatch(ctx, "feedback", "by_profile_created", profileId)) return false;
  } else if (phase === "usageEvents") {
    if (await deleteProfileBatch(ctx, "usageEvents", "by_profile_created", profileId)) return false;
  } else if (phase === "securityEvents") {
    if (await deleteProfileBatch(ctx, "securityEvents", "by_profile_created", profileId)) return false;
  } else if (phase === "bookmarks") {
    if (await deleteProfileBatch(ctx, "bibleBookmarks", "by_profile", profileId)) return false;
  } else if (phase === "customPlans") {
    if (await deleteProfileBatch(ctx, "customBibleReadingPlans", "by_profile", profileId)) return false;
  } else if (phase === "planCompletions") {
    if (await deleteProfileBatch(ctx, "bibleReadingPlanCompletions", "by_profile", profileId)) return false;
  } else if (phase === "dailyStats") {
    if (await deleteProfileBatch(ctx, "studyDailyStats", "by_profile_and_day_key", profileId)) return false;
  } else if (phase === "notifications") {
    if (await deleteProfileBatch(ctx, "adminNotificationState", "by_profile", profileId)) return false;
  } else if (phase === "deletionRequests") {
    const requests = await ctx.db
      .query("accountDeletionRequests")
      .withIndex("by_profile_status", (q) => q.eq("profileId", profileId))
      .take(CLEANUP_BATCH_SIZE + 1);
    const removable = requests.filter((request) => request._id !== job.deletionRequestId).slice(0, CLEANUP_BATCH_SIZE);
    if (removable.length) { await deleteDocuments(ctx, removable); return false; }
  } else if (phase === "singletonData") {
    const [memoryStats, studyStats, readerState] = await Promise.all([
      ctx.db.query("memoryStats").withIndex("by_profile", (q) => q.eq("profileId", profileId)).unique(),
      ctx.db.query("studyStats").withIndex("by_profile", (q) => q.eq("profileId", profileId)).unique(),
      ctx.db.query("bibleReaderStates").withIndex("by_profile", (q) => q.eq("profileId", profileId)).unique()
    ]);
    await deleteDocuments(ctx, [memoryStats, studyStats, readerState].filter(Boolean));
  } else if (phase === "authAccounts") {
    if (job.authUserId && (await cleanupAuthAccount(ctx, job.authUserId))) return false;
  } else if (phase === "authSessions") {
    if (job.authUserId && (await cleanupAuthSession(ctx, job.authUserId))) return false;
  } else if (phase === "profile") {
    const profile = await ctx.db.get(profileId);
    if (profile) await ctx.db.delete(profileId);
    if (job.authUserId) {
      const user = await ctx.db.get(job.authUserId);
      if (user) await ctx.db.delete(job.authUserId);
    }
    if (job.deletionRequestId) {
      const request = await ctx.db.get(job.deletionRequestId);
      if (request) await ctx.db.patch(request._id, { completedAt: Date.now() });
    }
    return true;
  }

  const phaseIndex = PROFILE_CLEANUP_PHASES.indexOf(phase);
  await ctx.db.patch(job._id, { phase: PROFILE_CLEANUP_PHASES[phaseIndex + 1], updatedAt: Date.now() });
  return false;
}

async function deleteProfileBatch(
  ctx: MutationCtx,
  table: "communityReactions" | "communityMembers" | "sessions" | "drafts" | "checkins" | "memoryVerses" | "memoryHistory" | "feedback" | "usageEvents" | "securityEvents" | "bibleBookmarks" | "customBibleReadingPlans" | "bibleReadingPlanCompletions" | "studyDailyStats" | "adminNotificationState",
  index: string,
  profileId: Id<"profiles">
) {
  const rows = await (ctx.db.query(table) as any)
    .withIndex(index, (q: any) => q.eq("profileId", profileId))
    .take(CLEANUP_BATCH_SIZE);
  await deleteDocuments(ctx, rows);
  return rows.length > 0;
}

async function cleanupAuthAccount(ctx: MutationCtx, authUserId: Id<"users">) {
  const account = await ctx.db.query("authAccounts").withIndex("userIdAndProvider", (q) => q.eq("userId", authUserId)).first();
  if (!account) return false;
  const codes = await ctx.db.query("authVerificationCodes").withIndex("accountId", (q) => q.eq("accountId", account._id)).take(CLEANUP_BATCH_SIZE);
  if (codes.length) { await deleteDocuments(ctx, codes); return true; }
  await ctx.db.delete(account._id);
  return true;
}

async function cleanupAuthSession(ctx: MutationCtx, authUserId: Id<"users">) {
  const session = await ctx.db.query("authSessions").withIndex("userId", (q) => q.eq("userId", authUserId)).first();
  if (!session) return false;
  const tokens = await ctx.db.query("authRefreshTokens").withIndex("sessionId", (q) => q.eq("sessionId", session._id)).take(CLEANUP_BATCH_SIZE);
  if (tokens.length) { await deleteDocuments(ctx, tokens); return true; }
  const verifiers = await ctx.db.query("authVerifiers").filter((q) => q.eq(q.field("sessionId"), session._id)).take(CLEANUP_BATCH_SIZE);
  if (verifiers.length) { await deleteDocuments(ctx, verifiers); return true; }
  await ctx.db.delete(session._id);
  return true;
}

async function deleteDocuments(ctx: MutationCtx, rows: Array<{ _id: any } | null>) {
  for (const row of rows) if (row) await ctx.db.delete(row._id);
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
