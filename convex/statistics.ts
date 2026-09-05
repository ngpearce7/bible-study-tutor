import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { countsTowardStudyRhythm, recordStudyActivity, usageEventIncrements } from "./statisticsModel";
import { v } from "convex/values";

const migrationPhase = v.union(v.literal("sessions"), v.literal("checkins"), v.literal("memoryHistory"), v.literal("usageEvents"));
type MigrationPhase = "sessions" | "checkins" | "memoryHistory" | "usageEvents";

export const ensureStats = mutation({
  args: { profileId: v.id("profiles") },
  returns: v.union(v.literal("ready"), v.literal("backfilling")),
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);
    const existing = await ctx.db
      .query("studyStats")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .unique();
    if (existing?.migrationStatus === "ready" || existing?.migrationStatus === "backfilling") {
      return existing.migrationStatus;
    }

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        migrationStatus: "backfilling",
        migrationPhase: "sessions",
        migrationCursor: undefined,
        migrationThroughAt: now,
        updatedAt: now
      });
    } else {
      await ctx.db.insert("studyStats", {
        profileId: args.profileId,
        sessionCount: 0,
        minutes: 0,
        currentStreak: 0,
        bestStreak: 0,
        migrationStatus: "backfilling",
        migrationPhase: "sessions",
        migrationThroughAt: now,
        updatedAt: now
      });
    }

    await ctx.scheduler.runAfter(0, internal.statistics.backfillStatsBatch, {
      profileId: args.profileId,
      phase: "sessions"
    });
    return "backfilling";
  }
});

export const backfillStatsBatch = internalMutation({
  args: {
    profileId: v.id("profiles"),
    phase: migrationPhase,
    cursor: v.optional(v.string())
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const aggregate = await ctx.db
      .query("studyStats")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .unique();
    if (!aggregate || aggregate.migrationStatus !== "backfilling" || aggregate.migrationPhase !== args.phase) return null;

    const throughAt = aggregate.migrationThroughAt ?? Date.now();
    const page = await loadMigrationPage(ctx, args.profileId, args.phase, throughAt, args.cursor ?? null);
    for (const item of page.page) {
      if (args.phase === "sessions" && "completedAt" in item && "minutes" in item) {
        await recordStudyActivity(ctx, {
          profileId: args.profileId,
          timestamp: item.completedAt,
          increments: { studiesCompleted: 1 },
          sessionDelta: 1,
          minuteDelta: item.minutes
        });
      } else if (args.phase === "checkins" && "createdAt" in item && "mood" in item) {
        await recordStudyActivity(ctx, {
          profileId: args.profileId,
          timestamp: item.createdAt,
          increments: { encouragementsShared: 1 }
        });
      } else if (args.phase === "memoryHistory" && "createdAt" in item && "event" in item) {
        const increments = item.event === "added"
          ? { memorySaved: 1 }
          : item.event === "reviewed"
            ? { memoryReviews: 1 }
            : item.event === "meditated"
              ? { memoryMeditations: 1 }
              : null;
        if (increments) await recordStudyActivity(ctx, { profileId: args.profileId, timestamp: item.createdAt, increments });
      } else if (args.phase === "usageEvents" && "createdAt" in item && "eventType" in item && countsTowardStudyRhythm(item.eventType)) {
        await recordStudyActivity(ctx, {
          profileId: args.profileId,
          timestamp: item.createdAt,
          increments: usageEventIncrements(item.eventType)
        });
      }
    }

    if (!page.isDone) {
      await ctx.db.patch(aggregate._id, { migrationCursor: page.continueCursor, updatedAt: Date.now() });
      await ctx.scheduler.runAfter(0, internal.statistics.backfillStatsBatch, {
        profileId: args.profileId,
        phase: args.phase,
        cursor: page.continueCursor
      });
      return null;
    }

    const nextPhase = nextMigrationPhase(args.phase);
    if (nextPhase) {
      await ctx.db.patch(aggregate._id, {
        migrationPhase: nextPhase,
        migrationCursor: undefined,
        updatedAt: Date.now()
      });
      await ctx.scheduler.runAfter(0, internal.statistics.backfillStatsBatch, {
        profileId: args.profileId,
        phase: nextPhase
      });
    } else {
      await ctx.db.patch(aggregate._id, {
        migrationStatus: "ready",
        migrationPhase: undefined,
        migrationCursor: undefined,
        migrationThroughAt: undefined,
        updatedAt: Date.now()
      });
    }
    return null;
  }
});

async function loadMigrationPage(
  ctx: MutationCtx,
  profileId: Id<"profiles">,
  phase: MigrationPhase,
  throughAt: number,
  cursor: string | null
) {
  const paginationOpts = { numItems: 64, cursor };
  if (phase === "sessions") {
    return await ctx.db.query("sessions")
      .withIndex("by_profile_completed", (q) => q.eq("profileId", profileId).lte("completedAt", throughAt))
      .order("asc")
      .paginate(paginationOpts);
  }
  if (phase === "checkins") {
    return await ctx.db.query("checkins")
      .withIndex("by_profile_created", (q) => q.eq("profileId", profileId).lte("createdAt", throughAt))
      .order("asc")
      .paginate(paginationOpts);
  }
  if (phase === "memoryHistory") {
    return await ctx.db.query("memoryHistory")
      .withIndex("by_profile_created", (q) => q.eq("profileId", profileId).lte("createdAt", throughAt))
      .order("asc")
      .paginate(paginationOpts);
  }
  return await ctx.db.query("usageEvents")
    .withIndex("by_profile_created", (q) => q.eq("profileId", profileId).lte("createdAt", throughAt))
    .order("asc")
    .paginate(paginationOpts);
}

function nextMigrationPhase(phase: MigrationPhase): MigrationPhase | null {
  if (phase === "sessions") return "checkins";
  if (phase === "checkins") return "memoryHistory";
  if (phase === "memoryHistory") return "usageEvents";
  return null;
}

async function authorizeProfileAccess(ctx: MutationCtx, profileId: Id<"profiles">) {
  const profile = await ctx.db.get(profileId);
  if (!profile) throw new Error("Profile not found");
  const authUserId = await getAuthUserId(ctx);
  if (profile.authUserId && !authUserId) throw new Error("Unauthorized");
  if (authUserId && profile.authUserId !== authUserId) throw new Error("Unauthorized");
}
