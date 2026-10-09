import { createHash } from "node:crypto";
import { expect, test, vi } from "vitest";
import { bibleReadingPlans } from "./bibleReadingPlans";
import { parseBibleReadingPlanIndex } from "./bibleReadingPlanIndex";
import compactPlanIndex from "../public/bible-reading-plan-index.json";
import { BIBLE_CHAPTER_COUNTS, NEW_TESTAMENT_BOOKS, OLD_TESTAMENT_BOOKS } from "./bibleLibrary";
import { expandPlanReadingReferences } from "./biblePassage";
import { buildBibleReadingPlanView } from "./bibleReadingPlanView";
import legacyHashes from "./readingPlanLegacyHashes.json";
import savedDayIdentityHashes from "./readingPlanDayIdentityHashes.json";

vi.mock("./network", () => ({ fetchWithTimeout: vi.fn() }));

const plan = (id: string) => bibleReadingPlans.find(p => p.id === id)!;
const chapters = (id: string) => plan(id).days.flatMap(d => expandPlanReadingReferences(d.reference).map(c => `${c.book}:${c.chapter}`));

test("the compact Home schedule matches every built-in plan and reading day", () => {
  const expected = bibleReadingPlans.map(({ days, ...metadata }) => ({
    ...metadata,
    days: days.map(({ day, title, reference, readerBook, readerChapter, studyReference }) =>
      ({ day, title, reference, readerBook, readerChapter, studyReference }))
  }));
  expect(parseBibleReadingPlanIndex(compactPlanIndex)).toEqual(expected);
});

test("content snapshots and saved day identities remain stable", () => {
  for (const [id, hash] of Object.entries(legacyHashes)) {
    expect(createHash("sha256").update(JSON.stringify(plan(id).days)).digest("hex"), id).toBe(hash);
  }
  expect(Object.keys(savedDayIdentityHashes)).toHaveLength(bibleReadingPlans.length);
  for (const [id, hash] of Object.entries(savedDayIdentityHashes)) {
    const identities = plan(id).days.map(day => [day.day, day.reference, day.readerBook, day.readerChapter, day.studyReference]);
    expect(createHash("sha256").update(JSON.stringify(identities)).digest("hex"), id).toBe(hash);
  }
  expect(new Set(bibleReadingPlans.map(p => p.id)).size).toBe(bibleReadingPlans.length);
});

test("book guidance appears when a reading first crosses into the book", () => {
  const year = plan("bible-365");
  expect(year.days[12].reference).toContain("Exodus 1-2");
  expect(year.days[12].devotional?.title).toBe("Beginning Exodus");
  expect(year.days[13].devotional?.title).not.toBe("Beginning Exodus");
  expect(year.days[357].devotional?.title).toContain("3 John, Jude, Revelation");

  const sixMonths = plan("bible-6-months");
  expect(sixMonths.days[7].devotional?.title).toBe("Beginning Exodus");
  expect(sixMonths.days[170].devotional?.title).toContain("Titus, Philemon, Hebrews");

  const selected = plan("bible-story-30");
  expect(selected.days[8].devotional?.title).toBe("Love the Lord and remember");
  expect(selected.days[8].context).toContain("Moses addresses Israel");
  expect(selected.days.every((day) => !!day.devotional?.body && !!day.observationQuestion)).toBe(true);

  const prayerPsalms = plan("psalms-prayer-21-v2");
  expect(prayerPsalms.days.every((day) => !!day.devotional?.body && !!day.observationQuestion)).toBe(true);
  expect(prayerPsalms.days.find((day) => day.reference === "Psalm 139")?.devotional?.body).toContain("verses 19-22");
});

test("selected story plans give sensitive readings passage-specific context", () => {
  const story = plan("bible-story-60");
  const oldTestament = plan("old-testament-story-60");
  for (const selectedPlan of [story, oldTestament]) {
    expect(selectedPlan.days.every((day) =>
      !!day.context && !!day.devotional?.body && !!day.observationQuestion &&
      !!day.reflectionQuestion && !!day.prayer &&
      !/^(Beginning |First stop in )/.test(day.devotional.title)
    ), selectedPlan.id).toBe(true);
  }
  const storyDay = (reference: string) => story.days.find((day) => day.reference === reference)!;
  const oldTestamentDay = (reference: string) => oldTestament.days.find((day) => day.reference === reference)!;

  expect(storyDay("Exodus 20").devotional?.title).toBe("A covenant people learn to live");
  expect(storyDay("Deuteronomy 30").context).toContain("Moses speaks to Israel");
  expect(storyDay("Psalm 51").devotional?.body).toContain("Bathsheba");
  expect(storyDay("Lamentations 3").devotional?.body).toContain("do not cancel the poem's pain");
  expect(oldTestamentDay("Leviticus 19").observationQuestion).toContain("verses 9-18");
  expect(oldTestamentDay("2 Samuel 12").devotional?.body).toContain("victims");
  expect(oldTestamentDay("Job 38").context).toContain("wrongly insist");
  expect(oldTestamentDay("Amos 5").devotional?.body).toContain("exploitation");
  expect(oldTestamentDay("Daniel 7").devotional?.body).toContain("apocalyptic");
  expect(storyDay("Acts 15").devotional?.body).toContain("grace");
  expect(storyDay("John 11").devotional?.body).toContain("sorrow");
  expect(oldTestamentDay("Genesis 6").devotional?.body).toContain("violence");
  expect(oldTestamentDay("Ecclesiastes 3").devotional?.body).toContain("not approval");
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
