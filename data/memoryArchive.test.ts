import { expect, test } from "vitest";
import { buildMemoryBookOptions, buildMemoryBrowseSections, buildMemoryCollectionCards, buildMemoryQueueSections, dueMemoryVersesForCollection, isMemoryVerseDue, memoryVersesForCollectionFilters } from "./memory";

test("archived verses stay browseable but never enter review queues", () => {
  const active = { _id: "active", reference: "James 1:22", verseText: "Be doers", status: "memorized", reviewCount: 3, nextReviewAt: undefined, updatedAt: 1 };
  const archived = { _id: "archived", reference: "Matthew 4:4", verseText: "Every word", status: "memorized", reviewCount: 3, archivedAt: Date.now(), updatedAt: 2 };
  expect(isMemoryVerseDue(active)).toBe(true);
  expect(isMemoryVerseDue(archived)).toBe(false);
  expect(buildMemoryQueueSections([active, archived]).flatMap((section) => section.verses)).toEqual([active]);
  expect(buildMemoryBrowseSections([active, archived], "", "all", "all", "archived").flatMap((section) => section.verses)).toEqual([archived]);
  expect(buildMemoryBrowseSections([active, archived], "", "all", "all", "memorized").flatMap((section) => section.verses)).toEqual([active]);
});

test("collection cards lead with all saved verses and omit archived custom collections", () => {
  const due = { reference: "Romans 5:8", collections: ["Promises"], nextReviewAt: Date.now() - 1000 };
  const later = { reference: "James 1:22", collections: ["Trust"], nextReviewAt: Date.now() + 3 * 86_400_000 };
  const archived = { reference: "Matthew 4:4", collections: ["Old"], archivedAt: Date.now(), nextReviewAt: Date.now() - 1000 };
  const cards = buildMemoryCollectionCards([due, later, archived]);

  expect(cards.map((card) => card.name)).toEqual(["All Verses", "Promises", "Trust"]);
  expect(cards.map((card) => card.count)).toEqual([3, 1, 1]);
  expect(cards.find((card) => card.name === "Promises")?.dueCount).toBe(1);
  expect(buildMemoryCollectionCards([later, archived]).map((card) => card.name)).toEqual(["All Verses", "Trust"]);
});

test("custom collection order keeps automatic collections fixed", () => {
  const due = { reference: "Romans 5:8", collections: ["Promises"], nextReviewAt: Date.now() - 1000 };
  const later = { reference: "James 1:22", collections: ["Trust"], nextReviewAt: Date.now() + 3 * 86_400_000 };
  expect(buildMemoryCollectionCards([due, later], ["Trust", "Promises"]).map((card) => card.name))
    .toEqual(["All Verses", "Trust", "Promises"]);
});

test("review queue includes only due verses from the opened collection", () => {
  const shared = { _id: "shared", collections: ["Promises", "Trust"], nextReviewAt: Date.now() - 1000 };
  const other = { _id: "other", collections: ["Trust"], nextReviewAt: Date.now() - 1000 };
  const later = { _id: "later", collections: ["Promises"], nextReviewAt: Date.now() + 3 * 86_400_000 };
  const archived = { _id: "archived", collections: ["Promises"], archivedAt: Date.now(), nextReviewAt: Date.now() - 1000 };
  expect(dueMemoryVersesForCollection([shared, other, later, archived], "Promises")).toEqual([shared]);
  expect(dueMemoryVersesForCollection([shared, other, later, archived], "Trust")).toEqual([shared, other]);
  expect(dueMemoryVersesForCollection([shared, other, later, archived], "all")).toEqual([shared, other]);
});

test("book filters only offer books within the open collection", () => {
  const mind = { reference: "Romans 12:2", collections: ["Mind"], nextReviewAt: Date.now() + 86_400_000 };
  const promises = { reference: "Exodus 34:6", collections: ["Promises"], nextReviewAt: Date.now() - 1000 };
  expect(buildMemoryBookOptions(memoryVersesForCollectionFilters([mind, promises], "Mind", "all")).map((option) => option.book)).toEqual(["Romans"]);
  expect(buildMemoryBookOptions(memoryVersesForCollectionFilters([mind, promises], "all", "due")).map((option) => option.book)).toEqual(["Exodus"]);
});
