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
  overdue: boolean;
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
  completedPlanDates,
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
  completedPlanDates?: Record<string, string>;
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
  const completedDaySet = new Set(completedDayKeys);
  const planIsComplete = (plan: BibleReadingPlan) =>
    plan.days.length > 0 &&
    plan.days.every((day) => completedDaySet.has(bibleReadingPlanDayKey(plan.id, day.day)));
  const activeFollowedPlans = followedPlans.filter((plan) => !planIsComplete(plan));
  const completedFollowedPlans = followedPlans
    .filter(planIsComplete)
    .sort((a, b) => {
      const aDate = completedPlanDates?.[a.id] || "";
      const bDate = completedPlanDates?.[b.id] || "";
      if (aDate !== bDate) return bDate.localeCompare(aDate);
      return a.title.localeCompare(b.title);
    });
  const followedPlanIdSet = new Set(followedPlans.map((plan) => plan.id));
  const activeFollowedPlanIdSet = new Set(activeFollowedPlans.map((plan) => plan.id));
  const selectedActivePlanId = activePlanId && activeFollowedPlanIdSet.has(activePlanId)
    ? activePlanId
    : activeFollowedPlans[0]?.id || "";
  const otherFollowedPlans = activeFollowedPlans.filter((plan) => plan.id !== selectedActivePlanId);
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
    const complete = plan.days.length > 0 && completedCount >= plan.days.length;
    const nextDateKey = startDates[plan.id] && nextDay ? addDaysToDateKey(startDates[plan.id], nextDay.day - 1) : "";
    const overdue = !!nextDateKey && !complete && nextDateKey < todayDateKey;
    const relativeDate = formatPlanDayRelativeDate(nextDateKey, todayDateKey, addDaysToDateKey);
    const dayLabel = nextDay
      ? `${overdue ? "Overdue: " : ""}Day ${nextDay.day}${relativeDate ? ` · ${relativeDate}` : ""}`
      : "Plan";
    return {
      id: plan.id,
      title: plan.title,
      reference: nextDay?.reference || "",
      label: dayLabel,
      overdue,
      completedCount,
      dayCount: plan.days.length,
      remainingCount,
      progressPercent,
      complete
    };
  });

  return {
    allPlans,
    followedPlans,
    activeFollowedPlans,
    completedFollowedPlans,
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

function formatPlanDayRelativeDate(
  dateKey: string,
  todayDateKey: string,
  addDaysToDateKey: (dateKey: string, days: number) => string
) {
  if (!dateKey || !todayDateKey) return "";
  if (dateKey === todayDateKey) return "Today";
  if (dateKey === addDaysToDateKey(todayDateKey, 1)) return "Tomorrow";
  if (dateKey === addDaysToDateKey(todayDateKey, -1)) return "Yesterday";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return "";
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "long" }).format(new Date(year, month - 1, day));
}
