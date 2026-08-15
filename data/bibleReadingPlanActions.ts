import type { BibleReadingPlan, BibleReadingPlanDay } from "@/data/bibleReadingPlans";
import { MAX_CUSTOM_BIBLE_READING_PLANS, MAX_FOLLOWED_BIBLE_READING_PLANS, MAX_STORED_BIBLE_READING_PLAN_IDS, bibleReadingPlanDayKey } from "@/data/bibleReadingPlanProgress";

function countActiveFollowedPlans(allPlans: BibleReadingPlan[], followedPlanIds: string[], completedDayKeys: string[]) {
  const completedDaySet = new Set(completedDayKeys);
  return followedPlanIds.filter((planId) => {
    const plan = allPlans.find((item) => item.id === planId);
    if (!plan) return false;
    return !plan.days.every((day) => completedDaySet.has(bibleReadingPlanDayKey(plan.id, day.day)));
  }).length;
}

export function followBibleReadingPlanState({
  planId,
  allPlans,
  followedPlanIds,
  activePlanId,
  startDates,
  completedDayKeys,
  todayKey
}: {
  planId: string;
  allPlans: BibleReadingPlan[];
  followedPlanIds: string[];
  activePlanId: string;
  startDates: Record<string, string>;
  completedDayKeys: string[];
  todayKey: string;
}) {
  const nextPlanId = allPlans.some((plan) => plan.id === planId) ? planId : "";
  if (!nextPlanId) return null;
  const alreadyFollowed = followedPlanIds.includes(nextPlanId);
  if (!alreadyFollowed && countActiveFollowedPlans(allPlans, followedPlanIds, completedDayKeys) >= MAX_FOLLOWED_BIBLE_READING_PLANS) {
    return { blocked: true as const, planId: nextPlanId };
  }
  const nextFollowedPlanIds = Array.from(new Set([nextPlanId, ...followedPlanIds])).slice(0, MAX_STORED_BIBLE_READING_PLAN_IDS);
  const nextStartDates = startDates[nextPlanId] ? startDates : { ...startDates, [nextPlanId]: todayKey };
  return {
    blocked: false as const,
    activePlanId: nextPlanId,
    followedPlanIds: nextFollowedPlanIds,
    startDates: nextStartDates
  };
}

export function catchUpBibleReadingPlanDatesState({
  plan,
  completedDayKeys,
  startDates,
  todayKey,
  addDaysToDateKey,
  startDateForDay
}: {
  plan?: BibleReadingPlan;
  completedDayKeys: string[];
  startDates: Record<string, string>;
  todayKey: string;
  addDaysToDateKey: (dateKey: string, days: number) => string;
  startDateForDay: (day: number) => string;
}) {
  if (!plan) return null;
  const completedSet = new Set(completedDayKeys);
  const nextDay = plan.days.find((day) => !completedSet.has(bibleReadingPlanDayKey(plan.id, day.day))) || plan.days[0];
  const completedCount = plan.days.filter((day) => completedSet.has(bibleReadingPlanDayKey(plan.id, day.day))).length;
  const startDate = startDates[plan.id] || "";
  const nextDayDateKey = startDate && nextDay ? addDaysToDateKey(startDate, nextDay.day - 1) : "";
  if (!nextDay || completedCount >= plan.days.length || !nextDayDateKey || nextDayDateKey >= todayKey) return null;
  return {
    startDates: {
      ...startDates,
      [plan.id]: startDateForDay(nextDay.day)
    }
  };
}

export function stopFollowingBibleReadingPlanState({
  planId,
  allPlans,
  followedPlanIds,
  activePlanId
}: {
  planId: string;
  allPlans: BibleReadingPlan[];
  followedPlanIds: string[];
  activePlanId: string;
}) {
  const stoppedPlan = allPlans.find((plan) => plan.id === planId);
  if (!stoppedPlan) return null;
  const nextFollowedPlanIds = followedPlanIds.filter((id) => id !== stoppedPlan.id);
  const nextActivePlanId = activePlanId === stoppedPlan.id ? nextFollowedPlanIds[0] || "" : activePlanId;
  return { stoppedPlan, activePlanId: nextActivePlanId, followedPlanIds: nextFollowedPlanIds };
}

export function completeBibleReadingPlanDayState({
  plan,
  planDay,
  planId,
  completedDayKeys
}: {
  plan?: BibleReadingPlan;
  planDay: BibleReadingPlanDay;
  planId: string;
  completedDayKeys: string[];
}) {
  if (!planId) return null;
  const key = bibleReadingPlanDayKey(planId, planDay.day);
  const nextCompletedDays = completedDayKeys.includes(key) ? completedDayKeys : [...completedDayKeys, key];
  const nextCompletedDaySet = new Set(nextCompletedDays);
  const nextIncomplete = plan?.days.find((day) => !nextCompletedDaySet.has(bibleReadingPlanDayKey(planId, day.day)));
  return { completedDays: nextCompletedDays, nextIncomplete };
}

export function uncompleteBibleReadingPlanDayState({
  planDay,
  planId,
  completedDayKeys
}: {
  planDay: BibleReadingPlanDay;
  planId: string;
  completedDayKeys: string[];
}) {
  if (!planId) return null;
  const key = bibleReadingPlanDayKey(planId, planDay.day);
  return completedDayKeys.includes(key)
    ? { completedDays: completedDayKeys.filter((item) => item !== key) }
    : null;
}

export function createCustomBibleReadingPlanState({
  plan,
  allPlans,
  customPlans,
  followedPlanIds,
  activePlanId,
  startDates,
  completedDayKeys,
  todayKey
}: {
  plan: BibleReadingPlan;
  allPlans: BibleReadingPlan[];
  customPlans: BibleReadingPlan[];
  followedPlanIds: string[];
  activePlanId: string;
  startDates: Record<string, string>;
  completedDayKeys: string[];
  todayKey: string;
}) {
  const customPlansNext = [plan, ...customPlans].slice(0, MAX_CUSTOM_BIBLE_READING_PLANS);
  const canFollow = countActiveFollowedPlans([...allPlans, plan], followedPlanIds, completedDayKeys) < MAX_FOLLOWED_BIBLE_READING_PLANS;
  const nextFollowedPlanIds = canFollow ? Array.from(new Set([plan.id, ...followedPlanIds])).slice(0, MAX_STORED_BIBLE_READING_PLAN_IDS) : followedPlanIds;
  const nextActivePlanId = canFollow ? plan.id : activePlanId;
  return {
    canFollow,
    customPlans: customPlansNext,
    followedPlanIds: nextFollowedPlanIds,
    activePlanId: nextActivePlanId,
    startDates: { ...startDates, [plan.id]: todayKey }
  };
}

export function deleteCustomBibleReadingPlanState({
  planId,
  customPlans,
  completedDayKeys,
  followedPlanIds,
  activePlanId,
  startDates
}: {
  planId: string;
  customPlans: BibleReadingPlan[];
  completedDayKeys: string[];
  followedPlanIds: string[];
  activePlanId: string;
  startDates: Record<string, string>;
}) {
  const nextCustomPlans = customPlans.filter((plan) => plan.id !== planId);
  const nextCompletedDays = completedDayKeys.filter((key) => !key.startsWith(`${planId}:`));
  const nextFollowedPlanIds = followedPlanIds.filter((id) => id !== planId);
  const nextActivePlanId = activePlanId === planId ? nextFollowedPlanIds[0] || "" : activePlanId;
  const nextStartDates = { ...startDates };
  delete nextStartDates[planId];
  return {
    customPlans: nextCustomPlans,
    completedDays: nextCompletedDays,
    followedPlanIds: nextFollowedPlanIds,
    activePlanId: nextActivePlanId,
    startDates: nextStartDates
  };
}
