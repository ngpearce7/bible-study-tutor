import { expect, test } from "vitest";
import { buildMemoryBrowseSections, buildMemoryQueueSections, includeActiveMemoryPracticeVerse } from "@/data/memory";

test("the active practice verse stays visible if its due status changes during a review set", () => {
  const verse = { _id: "verse-1", reference: "Psalm 28:7", verseText: "The LORD is my strength", nextReviewAt: 0 };
  const dueVerses = buildMemoryBrowseSections([verse], "", "all", "all", "due").flatMap((section) => section.verses);
  expect(dueVerses).toHaveLength(1);

  const rescheduledVerse = { ...verse, nextReviewAt: Date.now() + 3 * 24 * 60 * 60 * 1000 };
  const filteredVerses = buildMemoryBrowseSections([rescheduledVerse], "", "all", "all", "due").flatMap((section) => section.verses);
  expect(filteredVerses).toHaveLength(0);

  const visible = includeActiveMemoryPracticeVerse(buildMemoryQueueSections(filteredVerses), rescheduledVerse);
  expect(visible.flatMap((section) => section.verses)).toEqual([rescheduledVerse]);
  expect(includeActiveMemoryPracticeVerse(visible, rescheduledVerse)).toEqual(visible);
});
