import { expect, test } from "vitest";
import { buildMemoryBrowseSections, buildMemoryCollectionCards, buildMemoryQueueSections, isMemoryVerseDue } from "./memory";

test("archived verses stay browseable but never enter review queues", () => {
  const active = { _id: "active", reference: "James 1:22", verseText: "Be doers", status: "memorized", reviewCount: 3, nextReviewAt: undefined, updatedAt: 1 };
  const archived = { _id: "archived", reference: "Matthew 4:4", verseText: "Every word", status: "memorized", reviewCount: 3, archivedAt: Date.now(), updatedAt: 2 };
  expect(isMemoryVerseDue(active)).toBe(true);
  expect(isMemoryVerseDue(archived)).toBe(false);
  expect(buildMemoryQueueSections([active, archived]).flatMap((section) => section.verses)).toEqual([active]);
  expect(buildMemoryBrowseSections([active, archived], "", "all", "all", "archived").flatMap((section) => section.verses)).toEqual([archived]);
  expect(buildMemoryBrowseSections([active, archived], "", "all", "all", "memorized").flatMap((section) => section.verses)).toEqual([active]);
});

test("automatic collection cards lead with due verses, then all saved verses", () => {
  const due = { reference: "Romans 5:8", collections: ["Promises"], nextReviewAt: Date.now() - 1000 };
  const later = { reference: "James 1:22", collections: ["Trust"], nextReviewAt: Date.now() + 3 * 86_400_000 };
  const archived = { reference: "Matthew 4:4", collections: ["Old"], archivedAt: Date.now(), nextReviewAt: Date.now() - 1000 };
  const cards = buildMemoryCollectionCards([due, later, archived]);

  expect(cards.map((card) => card.name)).toEqual(["Due for Review", "All Verses", "Promises", "Trust"]);
  expect(cards.map((card) => card.count)).toEqual([1, 3, 1, 1]);
  expect(cards.find((card) => card.name === "Promises")?.dueCount).toBe(1);
  expect(buildMemoryCollectionCards([later, archived]).map((card) => card.name)).toEqual(["All Verses", "Trust"]);
});
