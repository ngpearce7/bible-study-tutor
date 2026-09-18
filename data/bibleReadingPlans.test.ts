import { createHash } from "node:crypto";
import { expect, test, vi } from "vitest";
import { bibleReadingPlans } from "./bibleReadingPlans";
import { BIBLE_CHAPTER_COUNTS, NEW_TESTAMENT_BOOKS, OLD_TESTAMENT_BOOKS } from "./bibleLibrary";
import { expandPlanReadingReferences } from "./biblePassage";
import { buildBibleReadingPlanView } from "./bibleReadingPlanView";
import legacyHashes from "./readingPlanLegacyHashes.json";

vi.mock("./network", () => ({ fetchWithTimeout: vi.fn() }));

const plan = (id: string) => bibleReadingPlans.find(p => p.id === id)!;
const chapters = (id: string) => plan(id).days.flatMap(d => expandPlanReadingReferences(d.reference).map(c => `${c.book}:${c.chapter}`));

test("every original plan retains its ID and exact day content for saved progress", () => {
  for (const [id, hash] of Object.entries(legacyHashes)) {
    expect(createHash("sha256").update(JSON.stringify(plan(id).days)).digest("hex"), id).toBe(hash);
  }
  expect(new Set(bibleReadingPlans.map(p => p.id)).size).toBe(bibleReadingPlans.length);
});

test("reflection years cover every chapter with reflection spread throughout the year", () => {
  for (const [id, count] of [["new-testament-365-v2", 260], ["psalms-proverbs-365-v2", 181]] as const) {
    const days = plan(id).days;
    expect(days).toHaveLength(365);
    expect(new Set(chapters(id)).size).toBe(count);
    expect(days.filter(d => d.title.startsWith("Reflect on"))).toHaveLength(365 - count);
    for (let start = 0; start < 360; start += 30) {
      const month = days.slice(start, start + 30);
      expect(month.some(d => d.title.startsWith("Reflect on"))).toBe(true);
      expect(new Set(month.map(d => d.reference)).size).toBeGreaterThan(10);
    }
  }
});

test("paired year includes both testaments every day and covers all chapters", () => {
  const p = plan("bible-old-new-365-v2");
  expect(p.days).toHaveLength(365);
  for (const day of p.days) {
    const books = expandPlanReadingReferences(day.reference).map(c => c.book === "Psalm" ? "Psalms" : c.book);
    expect(books.some(b => OLD_TESTAMENT_BOOKS.includes(b))).toBe(true);
    expect(books.some(b => NEW_TESTAMENT_BOOKS.includes(b))).toBe(true);
  }
  expect(new Set(chapters(p.id)).size).toBe(Object.values(BIBLE_CHAPTER_COUNTS).reduce((a, b) => a + b, 0));
});

test("selected overviews and prayer plan contain one distinct chapter per day", () => {
  for (const [id, count] of [["bible-story-30", 30], ["bible-story-60", 60], ["old-testament-story-60", 60], ["psalms-prayer-21-v2", 21]] as const) {
    expect(plan(id).days).toHaveLength(count);
    expect(chapters(id)).toHaveLength(count);
    expect(new Set(chapters(id)).size).toBe(count);
  }
});

test("retired plans remain followable in saved history but are absent from discovery", () => {
  const view = buildBibleReadingPlanView({ builtInPlans: bibleReadingPlans, customPlans: [], followedPlanIds: ["bible-30"], activePlanId: "bible-30", completedDayKeys: ["bible-30:1"], startDates: {}, selectedPlanId: "bible-30", selectedDay: 2, todayDateKey: "2026-09-18", addDaysToDateKey: (day) => day });
  expect(view.activePlan?.id).toBe("bible-30");
  expect(view.activeCompletedCount).toBe(1);
  const visible = view.groups.flatMap(g => g.plans);
  expect(visible.every(p => !p.retired)).toBe(true);
  expect(new Set(visible.map(p => p.id)).size).toBe(visible.length);
  expect(visible.length).toBe(bibleReadingPlans.filter(p => !p.retired).length);
  expect(view.groups.find(g => g.id === "start")?.plans).toHaveLength(3);
  expect(view.groups.find(g => g.id === "intensive")?.plans.some(p => p.id === "bible-90")).toBe(true);
});
