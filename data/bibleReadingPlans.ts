import { BIBLE_CHAPTER_COUNTS, NEW_TESTAMENT_BOOKS, OLD_TESTAMENT_BOOKS } from "@/data/bibleLibrary";

export type BibleReadingPlanDay = {
  day: number;
  title: string;
  reference: string;
  readerBook: string;
  readerChapter: number;
  studyReference: string;
};

export type BibleReadingPlan = {
  id: string;
  title: string;
  description: string;
  days: BibleReadingPlanDay[];
};

function referenceBook(book: string) {
  return book === "Psalms" ? "Psalm" : book;
}

function chapterReference(book: string, chapter: number) {
  return `${referenceBook(book)} ${chapter}`;
}

function compactReference(group: { book: string; chapter: number }[]) {
  if (!group.length) return "";
  if (group.length === 1) return chapterReference(group[0].book, group[0].chapter);

  const segments: string[] = [];
  let start = group[0];
  let previous = group[0];

  for (const current of group.slice(1)) {
    const consecutive = current.book === previous.book && current.chapter === previous.chapter + 1;
    if (consecutive) {
      previous = current;
      continue;
    }

    segments.push(formatSegment(start, previous));
    start = current;
    previous = current;
  }

  segments.push(formatSegment(start, previous));
  return segments.join("; ");
}

function formatSegment(start: { book: string; chapter: number }, end: { book: string; chapter: number }) {
  if (start.book === end.book && start.chapter !== end.chapter) {
    return `${referenceBook(start.book)} ${start.chapter}-${end.chapter}`;
  }
  return chapterReference(start.book, start.chapter);
}

function chaptersForBooks(books: string[]) {
  return books.flatMap((book) =>
    Array.from({ length: BIBLE_CHAPTER_COUNTS[book] || 1 }, (_, index) => ({
      book,
      chapter: index + 1
    }))
  );
}

function buildChapterPlan(id: string, title: string, description: string, books: string[], dayCount: number): BibleReadingPlan {
  const chapters = chaptersForBooks(books);
  const days: BibleReadingPlanDay[] = [];
  let cursor = 0;

  for (let day = 1; day <= dayCount; day += 1) {
    const remainingChapters = chapters.length - cursor;
    const remainingDays = dayCount - day + 1;
    const take = Math.max(1, Math.ceil(remainingChapters / remainingDays));
    const group = chapters.slice(cursor, cursor + take);
    const first = group[0] || chapters[chapters.length - 1];
    cursor += take;

    days.push({
      day,
      title: `Day ${day}`,
      reference: compactReference(group),
      readerBook: first.book,
      readerChapter: first.chapter,
      studyReference: chapterReference(first.book, first.chapter)
    });
  }

  return { id, title, description, days };
}

const johnDays = Array.from({ length: 21 }, (_, index) => ({
  day: index + 1,
  title: `John ${index + 1}`,
  reference: `John ${index + 1}`,
  readerBook: "John",
  readerChapter: index + 1,
  studyReference: `John ${index + 1}`
}));

const romansDays = Array.from({ length: 16 }, (_, index) => ({
  day: index + 1,
  title: `Romans ${index + 1}`,
  reference: `Romans ${index + 1}`,
  readerBook: "Romans",
  readerChapter: index + 1,
  studyReference: `Romans ${index + 1}`
}));

const prayerPsalmChapters = [1, 4, 8, 13, 16, 19, 23, 27, 32, 34, 42, 46, 51, 63, 84, 91, 95, 100, 103, 121, 139];

export const bibleReadingPlans: BibleReadingPlan[] = [
  {
    id: "john-21",
    title: "21 Days in John",
    description: "Read one chapter a day through John's Gospel.",
    days: johnDays
  },
  {
    id: "romans-16",
    title: "Romans in 16 Days",
    description: "Move slowly through Paul's letter one chapter at a time.",
    days: romansDays
  },
  {
    id: "psalms-prayer",
    title: "Psalms for Prayer",
    description: "Twenty-one Psalms chosen to shape prayer, trust, confession, and worship.",
    days: prayerPsalmChapters.map((chapter, index) => ({
      day: index + 1,
      title: `Psalm ${chapter}`,
      reference: `Psalm ${chapter}`,
      readerBook: "Psalms",
      readerChapter: chapter,
      studyReference: `Psalm ${chapter}`
    }))
  },
  buildChapterPlan("new-testament-90", "New Testament in 90 Days", "Read through the New Testament in steady daily portions.", NEW_TESTAMENT_BOOKS, 90),
  buildChapterPlan("bible-365", "Bible in 365 Days", "A simple chapter-by-chapter path through the whole Bible.", [...OLD_TESTAMENT_BOOKS, ...NEW_TESTAMENT_BOOKS], 365)
];

export const defaultBibleReadingPlanId = bibleReadingPlans[0].id;
