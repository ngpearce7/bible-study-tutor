import { BIBLE_CHAPTER_COUNTS } from "@/data/bibleLibrary";
import { bibleReadingPlans, readerBookFromReferenceBook, type BibleReadingPlan, type BibleReadingPlanDay } from "@/data/bibleReadingPlans";

export const MAX_FOLLOWED_BIBLE_READING_PLANS = 3;
export const MAX_STORED_BIBLE_READING_PLAN_IDS = 60;
export const MAX_CUSTOM_BIBLE_READING_PLANS = 30;
export const MAX_CUSTOM_BIBLE_READING_PLAN_DAYS = 400;
export const MAX_COMPLETED_BIBLE_READING_PLAN_DAYS = 5000;

export type StoredBibleReadingPlanProgress = {
  activePlanId: string;
  followedPlanIds?: string[];
  completedDays: string[];
  customPlans: BibleReadingPlan[];
  startDates?: Record<string, string>;
  completedPlanDates?: Record<string, string>;
  updatedAt?: number;
};

export function bibleReadingPlanDayKey(planId: string, day: number) {
  return `${planId}:${day}`;
}

export function emptyBibleReadingPlanProgress(): StoredBibleReadingPlanProgress {
  return { activePlanId: "", followedPlanIds: [], completedDays: [], customPlans: [], startDates: {}, completedPlanDates: {} };
}

export function normalizeBibleReadingPlanId(planId: string) {
  if (planId === "bible-1-year") return "bible-365";
  return planId;
}

export function normalizeBibleReadingPlanProgressKeys(keys: string[]) {
  return keys.map((key) => key.startsWith("bible-1-year:") ? key.replace("bible-1-year:", "bible-365:") : key);
}

export function normalizeBibleReadingPlanProgress(value: unknown): StoredBibleReadingPlanProgress | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, any>;
  const customPlans = Array.isArray(source.customPlans)
    ? source.customPlans
        .map(normalizeCustomBibleReadingPlan)
        .filter((plan): plan is BibleReadingPlan => !!plan)
        .slice(0, MAX_CUSTOM_BIBLE_READING_PLANS)
    : [];
  const validPlans = [...bibleReadingPlans, ...customPlans];
  const validPlanIds = new Set(validPlans.map((plan) => plan.id));
  const activePlanId = normalizeBibleReadingPlanId(typeof source.activePlanId === "string" ? source.activePlanId : "");
  const followedPlanIds = Array.from(new Set(
    Array.isArray(source.followedPlanIds)
      ? source.followedPlanIds
          .map((planId) => normalizeBibleReadingPlanId(String(planId).slice(0, 80)))
          .filter((planId) => planId && validPlanIds.has(planId))
      : []
  ));
  const normalizedActivePlanId = activePlanId && validPlanIds.has(activePlanId) ? activePlanId : followedPlanIds[0] || "";
  const normalizedFollowedPlanIds = Array.from(new Set([
    normalizedActivePlanId,
    ...(followedPlanIds.length ? followedPlanIds : normalizedActivePlanId ? [normalizedActivePlanId] : [])
  ].filter(Boolean))).slice(0, MAX_STORED_BIBLE_READING_PLAN_IDS);
  const completedDays = normalizeBibleReadingPlanProgressKeys(
    Array.isArray(source.completedDays)
      ? source.completedDays.map((key) => String(key).slice(0, 100)).filter(Boolean)
      : []
  )
    .filter((key) => {
      const [planId, dayValue] = key.split(":");
      if (!validPlanIds.has(planId)) return false;
      const plan = validPlans.find((item) => item.id === planId);
      const day = Math.round(Number(dayValue) || 0);
      return !!plan && plan.days.some((item) => item.day === day);
    })
    .slice(0, MAX_COMPLETED_BIBLE_READING_PLAN_DAYS);
  const startDates = source.startDates && typeof source.startDates === "object" && !Array.isArray(source.startDates)
    ? Object.entries(source.startDates).slice(0, 60).reduce<Record<string, string>>((map, [planId, date]) => {
        const normalizedPlanId = normalizeBibleReadingPlanId(String(planId).slice(0, 80));
        const dateKey = String(date).slice(0, 10);
        if (normalizedPlanId && validPlanIds.has(normalizedPlanId) && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)) map[normalizedPlanId] = dateKey;
        return map;
      }, {})
    : {};
  const completedPlanDates = source.completedPlanDates && typeof source.completedPlanDates === "object" && !Array.isArray(source.completedPlanDates)
    ? Object.entries(source.completedPlanDates).slice(0, 60).reduce<Record<string, string>>((map, [planId, date]) => {
        const normalizedPlanId = normalizeBibleReadingPlanId(String(planId).slice(0, 80));
        const dateKey = String(date).slice(0, 10);
        if (normalizedPlanId && validPlanIds.has(normalizedPlanId) && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)) map[normalizedPlanId] = dateKey;
        return map;
      }, {})
    : {};
  const normalized: StoredBibleReadingPlanProgress = {
    activePlanId: normalizedActivePlanId,
    followedPlanIds: normalizedFollowedPlanIds,
    completedDays: Array.from(new Set(completedDays)),
    customPlans,
    startDates,
    completedPlanDates,
    updatedAt: Number.isFinite(Number(source.updatedAt)) ? Number(source.updatedAt) : Date.now()
  };
  return hasBibleReadingPlanProgress(normalized) ? normalized : null;
}

export function hasBibleReadingPlanProgress(progress?: StoredBibleReadingPlanProgress | null) {
  return !!(
    progress?.activePlanId ||
    progress?.followedPlanIds?.length ||
    progress?.completedDays.length ||
    progress?.customPlans.length ||
    Object.keys(progress?.startDates || {}).length ||
    Object.keys(progress?.completedPlanDates || {}).length
  );
}

function normalizeCustomBibleReadingPlan(plan: any): BibleReadingPlan | null {
  if (!plan || typeof plan.id !== "string" || typeof plan.title !== "string" || !Array.isArray(plan.days)) return null;
  const days = plan.days
    .slice(0, MAX_CUSTOM_BIBLE_READING_PLAN_DAYS)
    .map(normalizeCustomBibleReadingPlanDay)
    .filter((day: BibleReadingPlanDay | null): day is BibleReadingPlanDay => !!day);
  if (!days.length) return null;
  return {
    id: plan.id.slice(0, 80),
    title: plan.title.slice(0, 80),
    description: typeof plan.description === "string" ? plan.description.slice(0, 240) : "",
    source: "custom",
    category: typeof plan.category === "string" ? plan.category.slice(0, 40) : "Custom",
    days
  };
}

function normalizeCustomBibleReadingPlanDay(day: any): BibleReadingPlanDay | null {
  if (!day || typeof day.reference !== "string" || typeof day.readerBook !== "string") return null;
  const readerBook = readerBookFromReferenceBook(String(day.readerBook).slice(0, 80));
  const chapterCount = BIBLE_CHAPTER_COUNTS[readerBook] || 200;
  const devotional = day.devotional && typeof day.devotional === "object"
    ? {
        title: String(day.devotional.title || "").slice(0, 120),
        body: String(day.devotional.body || "").slice(0, 1200),
        source: typeof day.devotional.source === "string" ? day.devotional.source.slice(0, 80) : undefined
      }
    : undefined;
  return {
    day: Math.max(1, Math.min(MAX_CUSTOM_BIBLE_READING_PLAN_DAYS, Math.round(Number(day.day) || 1))),
    title: String(day.title || `Day ${day.day || 1}`).slice(0, 80),
    reference: String(day.reference).slice(0, 120),
    readerBook,
    readerChapter: Math.max(1, Math.min(chapterCount, Math.round(Number(day.readerChapter) || 1))),
    studyReference: String(day.studyReference || day.reference).slice(0, 120),
    context: typeof day.context === "string" ? day.context.slice(0, 700) : undefined,
    devotional: devotional?.title && devotional.body ? devotional : undefined,
    observationQuestion: typeof day.observationQuestion === "string" ? day.observationQuestion.slice(0, 240) : undefined,
    reflectionQuestion: typeof day.reflectionQuestion === "string" ? day.reflectionQuestion.slice(0, 240) : undefined,
    reflectionPrompt: typeof day.reflectionPrompt === "string" ? day.reflectionPrompt.slice(0, 240) : undefined,
    prayer: typeof day.prayer === "string" ? day.prayer.slice(0, 500) : undefined,
    prayerPrompt: typeof day.prayerPrompt === "string" ? day.prayerPrompt.slice(0, 500) : undefined,
    gentleAction: typeof day.gentleAction === "string" ? day.gentleAction.slice(0, 260) : undefined,
    studyMethod: typeof day.studyMethod === "string" ? day.studyMethod.slice(0, 80) : undefined,
    careNote: typeof day.careNote === "string" ? day.careNote.slice(0, 600) : undefined
  };
}
