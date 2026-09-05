import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

export type DailyStudyStatKey =
  | "studiesCompleted"
  | "planReadingsCompleted"
  | "planReadingsOpened"
  | "chaptersRead"
  | "bibleSearches"
  | "memoryReviews"
  | "memoryMeditations"
  | "memorySaved"
  | "worksheetsPrinted"
  | "memoryCardsPrinted"
  | "encouragementsShared"
  | "bookmarksSaved";

export type DailyStudyStatIncrements = Partial<Record<DailyStudyStatKey, number>>;

const emptyDailyStats = {
  studiesCompleted: 0,
  planReadingsCompleted: 0,
  planReadingsOpened: 0,
  chaptersRead: 0,
  bibleSearches: 0,
  memoryReviews: 0,
  memoryMeditations: 0,
  memorySaved: 0,
  worksheetsPrinted: 0,
  memoryCardsPrinted: 0,
  encouragementsShared: 0,
  bookmarksSaved: 0
};

export async function recordStudyActivity(
  ctx: MutationCtx,
  args: {
    profileId: Id<"profiles">;
    timestamp: number;
    localDayKey?: string;
    increments?: DailyStudyStatIncrements;
    sessionDelta?: number;
    minuteDelta?: number;
  }
) {
  const dayKey = validDayKey(args.localDayKey) || utcDayKey(args.timestamp);
  const now = Date.now();
  let aggregate = await ctx.db
    .query("studyStats")
    .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
    .unique();

  if (!aggregate) {
    const aggregateId = await ctx.db.insert("studyStats", {
      profileId: args.profileId,
      sessionCount: 0,
      minutes: 0,
      currentStreak: 0,
      bestStreak: 0,
      migrationStatus: "pending",
      updatedAt: now
    });
    aggregate = await ctx.db.get(aggregateId);
  }
  if (!aggregate) throw new Error("Could not initialize study statistics");

  // A pending aggregate belongs to a profile whose historical rows have not
  // been backfilled yet. The source event has already been written, so adding
  // it here would count it again when the backfill reaches that row.
  if (aggregate.migrationStatus === "pending") return;

  const daily = await ctx.db
    .query("studyDailyStats")
    .withIndex("by_profile_and_day_key", (q) => q.eq("profileId", args.profileId).eq("dayKey", dayKey))
    .unique();

  if (daily) {
    const patch: Partial<typeof emptyDailyStats> & { updatedAt: number } = { updatedAt: now };
    for (const [key, value] of Object.entries(args.increments || {}) as [DailyStudyStatKey, number][]) {
      patch[key] = Math.max(0, daily[key] + Math.round(value || 0));
    }
    await ctx.db.patch(daily._id, patch);
  } else {
    const nextDaily = { ...emptyDailyStats };
    for (const [key, value] of Object.entries(args.increments || {}) as [DailyStudyStatKey, number][]) {
      nextDaily[key] = Math.max(0, Math.round(value || 0));
    }
    await ctx.db.insert("studyDailyStats", {
      profileId: args.profileId,
      dayKey,
      ...nextDaily,
      updatedAt: now
    });
  }

  const isNewLatestDay = !aggregate.lastActiveDayKey || dayKey > aggregate.lastActiveDayKey;
  const nextCurrentStreak = isNewLatestDay
    ? aggregate.lastActiveDayKey && daysBetween(aggregate.lastActiveDayKey, dayKey) === 1
      ? aggregate.currentStreak + 1
      : 1
    : aggregate.currentStreak;

  await ctx.db.patch(aggregate._id, {
    sessionCount: Math.max(0, aggregate.sessionCount + Math.round(args.sessionDelta || 0)),
    minutes: Math.max(0, aggregate.minutes + Math.round(args.minuteDelta || 0)),
    currentStreak: nextCurrentStreak,
    bestStreak: Math.max(aggregate.bestStreak, nextCurrentStreak),
    lastActiveDayKey: isNewLatestDay ? dayKey : aggregate.lastActiveDayKey,
    updatedAt: now
  });
}

export async function adjustStudyTotals(
  ctx: MutationCtx,
  profileId: Id<"profiles">,
  deltas: { sessionDelta?: number; minuteDelta?: number }
) {
  const aggregate = await ctx.db
    .query("studyStats")
    .withIndex("by_profile", (q) => q.eq("profileId", profileId))
    .unique();
  if (!aggregate) return;
  await ctx.db.patch(aggregate._id, {
    sessionCount: Math.max(0, aggregate.sessionCount + Math.round(deltas.sessionDelta || 0)),
    minutes: Math.max(0, aggregate.minutes + Math.round(deltas.minuteDelta || 0)),
    updatedAt: Date.now()
  });
}

export function usageEventIncrements(eventType: string): DailyStudyStatIncrements {
  switch (eventType) {
    case "bible_reading_plan_day_completed":
      return { planReadingsCompleted: 1 };
    case "bible_reading_plan_opened":
      return { planReadingsOpened: 1 };
    case "chapter_read":
      return { chaptersRead: 1 };
    case "bible_search":
      return { bibleSearches: 1 };
    case "worksheet_printed":
      return { worksheetsPrinted: 1 };
    case "memory_cards_printed":
    case "memory_cards_doc_downloaded":
      return { memoryCardsPrinted: 1 };
    case "study_insight_posted":
      return { encouragementsShared: 1 };
    case "bookmark_saved":
      return { bookmarksSaved: 1 };
    default:
      return {};
  }
}

export function countsTowardStudyRhythm(eventType: string) {
  return Object.keys(usageEventIncrements(eventType)).length > 0 || eventType === "study_completed" || eventType === "checkin_saved";
}

function validDayKey(value?: string) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function utcDayKey(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function daysBetween(startDayKey: string, endDayKey: string) {
  return Math.round((Date.parse(`${endDayKey}T00:00:00.000Z`) - Date.parse(`${startDayKey}T00:00:00.000Z`)) / 86_400_000);
}
