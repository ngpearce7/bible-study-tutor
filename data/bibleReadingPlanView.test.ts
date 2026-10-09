import { describe, expect, it } from "vitest";
import { buildBibleReadingPlanView } from "./bibleReadingPlanView";
import type { BibleReadingPlan } from "./bibleReadingPlanTypes";

const plan: BibleReadingPlan = {
  id: "john", title: "John", description: "", source: "built-in",
  days: [1, 2, 3].map(day => ({ day, title: `Day ${day}`, reference: `John ${day}`, readerBook: "John", readerChapter: day, studyReference: `John ${day}` }))
};
function view(completed: number[], startDate = "2026-09-19", todayDateKey = "2026-09-20") {
  return buildBibleReadingPlanView({
    builtInPlans: [plan], customPlans: [], followedPlanIds: [plan.id], activePlanId: plan.id,
    completedDayKeys: completed.map(day => `${plan.id}:${day}`), startDates: startDate ? { [plan.id]: startDate } : {},
    selectedPlanId: plan.id, selectedDay: 3, todayDateKey,
    addDaysToDateKey: (key, days) => {
      const date = new Date(`${key}T12:00:00Z`);
      date.setUTCDate(date.getUTCDate() + days);
      return date.toISOString().slice(0, 10);
    }
  });
}
describe("home reading plan reminder eligibility", () => {
  it("hides tomorrow's reading after today's reading is finished", () => {
    expect(view([1, 2]).activeToday?.day).toBe(3);
    expect(view([1, 2]).activeReadingDue).toBe(false);
  });
  it("shows unfinished readings due today or overdue, regardless of selected preview day", () => {
    expect(view([1]).activeReadingDue).toBe(true);
    expect(view([]).activeReadingDue).toBe(true);
    expect(view([2]).activeReadingDue).toBe(true);
  });
  it("hides future, unscheduled and completed plans", () => {
    expect(view([], "2026-09-21").activeReadingDue).toBe(false);
    expect(view([], "").activeReadingDue).toBe(false);
    expect(view([1, 2, 3]).activeReadingDue).toBe(false);
  });
  it("makes the next reading eligible on its scheduled local date", () => {
    expect(view([1, 2], "2026-09-19", "2026-09-21").activeReadingDue).toBe(true);
  });
});

it("identifies today's completed passage and dates the next reading", () => {
  const result = view([1, 2]);
  expect(result.activeDoneToday).toBe(true);
  expect(result.activeDoneTodayLabel).toBe("Today’s reading complete — Day 2 · John 2");
  expect(result.activeNextReadingLabel).toBe("Tomorrow: Day 3 · John 3");
});
it("keeps overdue and unscheduled next readings distinct from tomorrow", () => {
  expect(view([2]).activeNextReadingLabel).toBe("Still to read: Day 1 · John 1 · Yesterday");
  expect(view([1], "").activeNextReadingLabel).toBe("Next reading: Day 2 · John 2");
  expect(view([1]).activeNextReadingLabel).toBe("Today: Day 2 · John 2");
});

describe("saved reading-plan progress", () => {
  const plans: BibleReadingPlan[] = [
    { ...plan, id: "peace", title: "7 Days of Peace", browseGroup: "life" },
    { ...plan, id: "wisdom", title: "Wisdom", browseGroup: "life" },
    { ...plan, id: "fresh", title: "Fresh", browseGroup: "start" }
  ];
  const build = (followedPlanIds: string[], completedDayKeys: string[]) =>
    buildBibleReadingPlanView({
      builtInPlans: plans, customPlans: [], followedPlanIds, activePlanId: followedPlanIds[0] || "",
      completedDayKeys, startDates: {}, completedPlanDates: { peace: "2026-09-20" },
      selectedPlanId: "", selectedDay: 0, todayDateKey: "2026-09-21",
      addDaysToDateKey: (key) => key
    });

  it("keeps a fully read plan in Completed after it is no longer followed", () => {
    const result = build([], ["peace:1", "peace:2", "peace:3"]);
    expect(result.completedFollowedPlans.map((item) => item.id)).toEqual(["peace"]);
    expect(result.groups.flatMap((group) => group.plans).some((item) => item.id === "peace")).toBe(false);
    expect(result.activeFollowedPlans).toHaveLength(0);
  });

  it("separates a stopped, partly read plan from active and new plans", () => {
    const result = build([], ["wisdom:1", "wisdom:2"]);
    expect(result.activeFollowedPlans).toHaveLength(0);
    expect(result.groups.find((group) => group.id === "paused")?.plans.map((item) => item.id)).toEqual(["wisdom"]);
    expect(result.groups.find((group) => group.id === "life")?.plans.map((item) => item.id)).toEqual(["peace"]);
    expect(result.groups.find((group) => group.id === "start")?.plans.map((item) => item.id)).toEqual(["fresh"]);
  });

  it("returns a resumed plan to Active without clearing its progress", () => {
    const result = build(["wisdom"], ["wisdom:1", "wisdom:2"]);
    expect(result.activeFollowedPlans.map((item) => item.id)).toEqual(["wisdom"]);
    expect(result.activeCompletedCount).toBe(2);
    expect(result.activeToday?.day).toBe(3);
    expect(result.groups.find((group) => group.id === "paused")).toBeUndefined();
  });
});
