import { bibleReadingPlans, type BibleReadingPlan } from "@/data/bibleReadingPlans";
import { MAX_FOLLOWED_BIBLE_READING_PLANS, bibleReadingPlanDayKey } from "@/data/bibleReadingPlanProgress";

export type BibleReadingPlanGroup = {
  id: "custom" | "short" | "medium" | "long";
  title: string;
  description: string;
  plans: BibleReadingPlan[];
};

export type OtherFollowedBibleReadingPlanSummary = {
  id: string;
  title: string;
  reference: string;
  label: string;
  completedCount: number;
  dayCount: number;
  remainingCount: number;
  progressPercent: number;
  complete: boolean;
};

export function buildBibleReadingPlanView({
  customPlans,
  followedPlanIds,
  activePlanId,
  completedDayKeys,
  startDates,
  selectedPlanId,
  selectedDay,
  todayDateKey,
  addDaysToDateKey
}: {
  customPlans: BibleReadingPlan[];
  followedPlanIds: string[];
  activePlanId: string;
  completedDayKeys: string[];
  startDates: Record<string, string>;
  selectedPlanId: string;
  selectedDay: number;
  todayDateKey: string;
  addDaysToDateKey: (dateKey: string, days: number) => string;
}) {
  const allPlans = [...bibleReadingPlans, ...customPlans];
  const followedPlans = followedPlanIds
    .map((planId) => allPlans.find((plan) => plan.id === planId))
    .filter((plan): plan is BibleReadingPlan => !!plan)
    .slice(0, MAX_FOLLOWED_BIBLE_READING_PLANS);
  const followedPlanIdSet = new Set(followedPlans.map((plan) => plan.id));
  const selectedActivePlanId = activePlanId && followedPlanIdSet.has(activePlanId)
    ? activePlanId
    : followedPlans[0]?.id || "";
  const otherFollowedPlans = followedPlans.filter((plan) => plan.id !== selectedActivePlanId);
  const unfollowedPlans = allPlans.filter((plan) => !followedPlanIdSet.has(plan.id));
  const unfollowedCustomPlans = unfollowedPlans.filter((plan) => plan.source === "custom");
  const unfollowedBuiltInPlans = unfollowedPlans.filter((plan) => plan.source !== "custom");
  const candidateGroups: BibleReadingPlanGroup[] = [
    {
      id: "custom",
      title: "Your custom plans",
      description: "Plans you created for your own reading rhythm.",
      plans: unfollowedCustomPlans
    },
    {
      id: "short",
      title: "Short plans",
      description: "Quick starts and focused 1-14 day paths.",
      plans: unfollowedBuiltInPlans.filter((plan) => plan.days.length <= 14)
    },
    {
      id: "medium",
      title: "Medium plans",
      description: "Steady 15-60 day plans for books, themes, and overviews.",
      plans: unfollowedBuiltInPlans.filter((plan) => plan.days.length > 14 && plan.days.length <= 60)
    },
    {
      id: "long",
      title: "Long plans",
      description: "Longer rhythms for New Testament, whole Bible, and yearly reading.",
      plans: unfollowedBuiltInPlans.filter((plan) => plan.days.length > 60)
    }
  ];
  const groups = candidateGroups.filter((group) => group.plans.length > 0);
  const completedDaySet = new Set(completedDayKeys);
  const activePlan = allPlans.find((plan) => plan.id === selectedActivePlanId);
  const activeCompletedCount = activePlan
    ? activePlan.days.filter((day) => completedDaySet.has(bibleReadingPlanDayKey(activePlan.id, day.day))).length
    : 0;
  const activeToday = activePlan
    ? activePlan.days.find((day) => !completedDaySet.has(bibleReadingPlanDayKey(activePlan.id, day.day))) || activePlan.days[0]
    : null;
  const activeComplete = !!activePlan && activeCompletedCount === activePlan.days.length;
  const activeStartDate = activePlan ? startDates[activePlan.id] || "" : "";
  const activeSelectedDay =
    activePlan && selectedPlanId === activePlan.id && selectedDay
      ? activePlan.days.find((day) => day.day === selectedDay) || activeToday || activePlan.days[0]
      : activeToday || activePlan?.days[0] || null;
  const activeSelectedDateKey =
    activeStartDate && activeSelectedDay
      ? addDaysToDateKey(activeStartDate, activeSelectedDay.day - 1)
      : "";
  const activeTodayDateKey =
    activeStartDate && activeToday
      ? addDaysToDateKey(activeStartDate, activeToday.day - 1)
      : "";
  const otherSummaries: OtherFollowedBibleReadingPlanSummary[] = otherFollowedPlans.map((plan) => {
    const completedCount = plan.days.filter((day) => completedDaySet.has(bibleReadingPlanDayKey(plan.id, day.day))).length;
    const nextDay = plan.days.find((day) => !completedDaySet.has(bibleReadingPlanDayKey(plan.id, day.day))) || plan.days[0];
    const remainingCount = Math.max(0, plan.days.length - completedCount);
    const progressPercent = plan.days.length ? Math.round((completedCount / plan.days.length) * 100) : 0;
    return {
      id: plan.id,
      title: plan.title,
      reference: nextDay?.reference || "",
      label: nextDay ? `Day ${nextDay.day}` : "Plan",
      completedCount,
      dayCount: plan.days.length,
      remainingCount,
      progressPercent,
      complete: plan.days.length > 0 && completedCount >= plan.days.length
    };
  });

  return {
    allPlans,
    followedPlans,
    followedPlanIdSet,
    selectedActivePlanId,
    otherFollowedPlans,
    unfollowedPlans,
    unfollowedCustomPlans,
    unfollowedBuiltInPlans,
    groups,
    completedDaySet,
    activePlan,
    activeCompletedCount,
    activeToday,
    activeComplete,
    activeStartDate,
    activeSelectedDay,
    activeSelectedDateKey,
    activeTodayDateKey,
    activeMissedFullDay: !!activeTodayDateKey && !activeComplete && activeTodayDateKey < todayDateKey,
    activeSelectedDone: !!activePlan && !!activeSelectedDay && completedDaySet.has(bibleReadingPlanDayKey(activePlan.id, activeSelectedDay.day)),
    otherSummaries
  };
}
