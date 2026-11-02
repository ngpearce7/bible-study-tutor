import { expect, test } from "vitest";
import { buildMemoryBrowseSections, buildMemoryQueueSections, isMemoryVerseDue } from "./memory";

test("archived verses stay browseable but never enter review queues", () => {
  const active = { _id: "active", reference: "James 1:22", verseText: "Be doers", status: "memorized", reviewCount: 3, nextReviewAt: undefined, updatedAt: 1 };
  const archived = { _id: "archived", reference: "Matthew 4:4", verseText: "Every word", status: "memorized", reviewCount: 3, archivedAt: Date.now(), updatedAt: 2 };
  expect(isMemoryVerseDue(active)).toBe(true);
  expect(isMemoryVerseDue(archived)).toBe(false);
  expect(buildMemoryQueueSections([active, archived]).flatMap((section) => section.verses)).toEqual([active]);
  expect(buildMemoryBrowseSections([active, archived], "", "all", "all", "archived").flatMap((section) => section.verses)).toEqual([archived]);
  expect(buildMemoryBrowseSections([active, archived], "", "all", "all", "memorized").flatMap((section) => section.verses)).toEqual([active]);
});
