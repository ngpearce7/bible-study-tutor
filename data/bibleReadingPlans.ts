import { BIBLE_CHAPTER_COUNTS, NEW_TESTAMENT_BOOKS, OLD_TESTAMENT_BOOKS } from "@/data/bibleLibrary";

export type BibleReadingPlanSource = "built-in" | "custom";

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
  source: BibleReadingPlanSource;
  category?: string;
  purpose?: string;
  bestFor?: string;
  pace?: string;
  estimatedTime?: string;
  coverage?: string;
  rhythm?: string;
  sampleDayNumbers?: number[];
  days: BibleReadingPlanDay[];
};

type ChapterRef = { book: string; chapter: number };

function referenceBook(book: string) {
  return book === "Psalms" ? "Psalm" : book;
}

export function readerBookFromReferenceBook(book: string) {
  return book === "Psalm" ? "Psalms" : book;
}

export function chapterReference(book: string, chapter: number) {
  return `${referenceBook(book)} ${chapter}`;
}

function compactReference(group: ChapterRef[]) {
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

function formatSegment(start: ChapterRef, end: ChapterRef) {
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

function buildDay(day: number, reference: string, readerBook: string, readerChapter: number, title = `Day ${day}`, studyReference = chapterReference(readerBook, readerChapter)): BibleReadingPlanDay {
  return {
    day,
    title,
    reference,
    readerBook,
    readerChapter,
    studyReference
  };
}

function planFromReferences(id: string, title: string, description: string, references: Array<[string, string, number, string?]>, category = "Topical"): BibleReadingPlan {
  return enrichPlanMetadata({
    id,
    title,
    description,
    source: "built-in",
    category,
    days: references.map(([reference, book, chapter, dayTitle], index) =>
      buildDay(index + 1, reference, readerBookFromReferenceBook(book), chapter, dayTitle || reference, reference)
    )
  });
}

function buildChapterPlan(id: string, title: string, description: string, books: string[], dayCount: number, category = "Whole Bible"): BibleReadingPlan {
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
    days.push(buildDay(day, compactReference(group), first.book, first.chapter));
  }

  return enrichPlanMetadata({ id, title, description, source: "built-in", category, days });
}

function oneChapterPerDayPlan(id: string, title: string, description: string, book: string, days: number, category = "Book study"): BibleReadingPlan {
  return enrichPlanMetadata({
    id,
    title,
    description,
    source: "built-in",
    category,
    days: Array.from({ length: days }, (_, index) => buildDay(index + 1, chapterReference(book, index + 1), book, index + 1, chapterReference(book, index + 1), chapterReference(book, index + 1)))
  });
}

function sampleDayNumbersFor(dayCount: number) {
  if (dayCount <= 3) return Array.from({ length: dayCount }, (_, index) => index + 1);
  const middle = Math.max(2, Math.ceil(dayCount / 2));
  return Array.from(new Set([1, middle, dayCount]));
}

function estimateTimeFor(dayCount: number, referenceCount = dayCount) {
  if (dayCount <= 10 && referenceCount <= 12) return "5-10 minutes";
  if (dayCount <= 40) return "10-15 minutes";
  if (dayCount <= 90) return "15-25 minutes";
  return "15-30 minutes";
}

function paceFor(dayCount: number, category = "") {
  if (dayCount <= 10) return "Short and flexible";
  if (dayCount <= 31) return category === "Whole Bible" ? "Intensive daily readings" : "Short daily readings";
  if (dayCount <= 90) return "Steady daily readings";
  return "Gentle long-term rhythm";
}

function bestForFor(category = "", dayCount = 0) {
  const lower = category.toLowerCase();
  if (lower.includes("beginner")) return "Beginners and anyone wanting a friendly first path";
  if (lower.includes("prayer")) return "Prayer, devotional reading, and reflection";
  if (lower.includes("care")) return "Comfort, peace, grief, and pastoral care";
  if (lower.includes("wisdom")) return "Decision-making, discernment, and daily wisdom";
  if (lower.includes("overview")) return "Seeing the big picture before deeper study";
  if (lower.includes("gospel") || lower.includes("gospels")) return "Learning Jesus' life, teaching, death, and resurrection";
  if (lower.includes("new testament")) return "Understanding Jesus, the early church, and Christian living";
  if (lower.includes("book")) return "Slow book-by-book reading";
  if (dayCount >= 300) return "Long-term whole Bible reading";
  return "Regular Bible reading and steady Scripture engagement";
}

function coverageFor(plan: Pick<BibleReadingPlan, "title" | "category" | "days">) {
  const first = plan.days[0]?.reference || "the opening reading";
  const last = plan.days[plan.days.length - 1]?.reference || "the final reading";
  if ((plan.category || "").toLowerCase().includes("whole bible")) return `A path from ${first} through ${last}, covering the whole Bible in arranged daily portions.`;
  if (plan.days.length <= 12) return `A focused set of ${plan.days.length} readings from ${first} to ${last}.`;
  return `${plan.days.length} readings beginning with ${first} and ending with ${last}.`;
}

function purposeFor(plan: Pick<BibleReadingPlan, "title" | "description" | "category" | "days">) {
  const category = (plan.category || "").toLowerCase();
  if (category.includes("prayer")) return "To help you turn Scripture into prayer, trust, worship, and honest dependence on God.";
  if (category.includes("care")) return "To give gentle Scripture readings for seasons of worry, grief, comfort, and hope.";
  if (category.includes("wisdom")) return "To help you read slowly for wisdom, discernment, and faithful decisions.";
  if (category.includes("overview")) return "To give a manageable overview before choosing where to study more deeply.";
  if (category.includes("gospel")) return "To keep your attention on Jesus and the good news of grace, faith, and new life.";
  if (category.includes("new testament")) return "To move steadily through Jesus' life, the early church, and the letters.";
  if (category.includes("book")) return "To help you stay with one Bible book long enough to notice its flow and message.";
  return plan.description || "To provide a steady, practical rhythm for reading Scripture.";
}

function enrichPlanMetadata(plan: BibleReadingPlan): BibleReadingPlan {
  return {
    ...plan,
    purpose: plan.purpose || purposeFor(plan),
    bestFor: plan.bestFor || bestForFor(plan.category, plan.days.length),
    pace: plan.pace || paceFor(plan.days.length, plan.category),
    estimatedTime: plan.estimatedTime || estimateTimeFor(plan.days.length),
    coverage: plan.coverage || coverageFor(plan),
    rhythm: plan.rhythm || "Read the passage, notice one thing, pray briefly, then mark the day complete when you finish.",
    sampleDayNumbers: plan.sampleDayNumbers || sampleDayNumbersFor(plan.days.length)
  };
}

export function getBibleReadingPlanDetails(plan: BibleReadingPlan) {
  const enriched = enrichPlanMetadata(plan);
  const sampleNumbers = enriched.sampleDayNumbers || sampleDayNumbersFor(enriched.days.length);
  const sampleReadings = sampleNumbers
    .map((dayNumber) => enriched.days.find((day) => day.day === dayNumber))
    .filter((day): day is BibleReadingPlanDay => !!day);

  return {
    purpose: enriched.purpose || "",
    bestFor: enriched.bestFor || "",
    pace: enriched.pace || "",
    estimatedTime: enriched.estimatedTime || "",
    coverage: enriched.coverage || "",
    rhythm: enriched.rhythm || "",
    sampleReadings
  };
}

const gospelBooks = ["Matthew", "Mark", "Luke", "John"];
const wholeBibleBooks = [...OLD_TESTAMENT_BOOKS, ...NEW_TESTAMENT_BOOKS];

export const builtInBibleReadingPlans: BibleReadingPlan[] = [
  oneChapterPerDayPlan("john-21", "21 Days in John", "Read one chapter a day through John's Gospel.", "John", 21),
  oneChapterPerDayPlan("romans-16", "Romans in 16 Days", "Move slowly through Paul's letter one chapter at a time.", "Romans", 16),
  buildChapterPlan("psalms-prayer", "Psalms for Prayer", "Twenty-one Psalms chosen to shape prayer, trust, confession, and worship.", ["Psalms"], 21, "Prayer"),
  buildChapterPlan("new-testament-90", "New Testament in 90 Days", "Read through the New Testament in steady daily portions.", NEW_TESTAMENT_BOOKS, 90, "New Testament"),
  buildChapterPlan("bible-365", "Bible in 365 Days", "A simple chapter-by-chapter path through the whole Bible.", wholeBibleBooks, 365),
  buildChapterPlan("bible-30", "Bible in 30 Days", "A fast overview pace through the whole Bible.", wholeBibleBooks, 30),
  buildChapterPlan("bible-90", "Bible in 90 Days", "A strong three-month path through the whole Bible.", wholeBibleBooks, 90),
  buildChapterPlan("new-testament-30", "New Testament in 30 Days", "Read the New Testament in one month.", NEW_TESTAMENT_BOOKS, 30, "New Testament"),
  buildChapterPlan("psalms-30", "Psalms in 30 Days", "Pray and reflect through the Psalms in a month.", ["Psalms"], 30, "Prayer"),
  oneChapterPerDayPlan("proverbs-31", "Proverbs in 31 Days", "Read one chapter of Proverbs each day.", "Proverbs", 31, "Wisdom"),
  buildChapterPlan("gospels-40", "Gospels in 40 Days", "Read Matthew, Mark, Luke, and John in forty days.", gospelBooks, 40, "Gospels"),
  planFromReferences("life-of-jesus", "Life of Jesus", "Key readings from the birth, ministry, death, and resurrection of Jesus.", [
    ["Luke 2", "Luke", 2, "Birth of Jesus"],
    ["Matthew 3", "Matthew", 3, "Baptism of Jesus"],
    ["Matthew 4", "Matthew", 4, "Temptation"],
    ["Matthew 5", "Matthew", 5, "Kingdom teaching"],
    ["Mark 2", "Mark", 2, "Authority and mercy"],
    ["Luke 15", "Luke", 15, "Lost and found"],
    ["John 11", "John", 11, "Resurrection and life"],
    ["John 13", "John", 13, "Servant love"],
    ["John 17", "John", 17, "Jesus prays"],
    ["Matthew 26", "Matthew", 26, "Gethsemane"],
    ["John 19", "John", 19, "The cross"],
    ["John 20", "John", 20, "The resurrection"]
  ], "Gospels"),
  planFromReferences("romans-road", "Romans Road", "A short path through Romans for sin, grace, faith, and new life.", [
    ["Romans 1", "Romans", 1],
    ["Romans 3", "Romans", 3],
    ["Romans 5", "Romans", 5],
    ["Romans 6", "Romans", 6],
    ["Romans 8", "Romans", 8],
    ["Romans 10", "Romans", 10],
    ["Romans 12", "Romans", 12]
  ], "Gospel"),
  planFromReferences("prayer-dependence", "Prayer and Dependence", "Readings that invite trust, prayer, and daily dependence on God.", [
    ["Matthew 6", "Matthew", 6],
    ["Luke 11", "Luke", 11],
    ["Psalm 23", "Psalms", 23],
    ["Psalm 46", "Psalms", 46],
    ["Philippians 4", "Philippians", 4],
    ["James 1", "James", 1],
    ["1 Peter 5", "1 Peter", 5]
  ], "Prayer"),
  planFromReferences("anxiety-peace", "Anxiety and Peace", "Scripture readings for worry, fear, peace, and trust.", [
    ["Psalm 23", "Psalms", 23],
    ["Psalm 46", "Psalms", 46],
    ["Isaiah 26", "Isaiah", 26],
    ["Matthew 6", "Matthew", 6],
    ["Matthew 11", "Matthew", 11],
    ["John 14", "John", 14],
    ["Philippians 4", "Philippians", 4],
    ["1 Peter 5", "1 Peter", 5]
  ], "Care"),
  planFromReferences("wisdom-decisions", "Wisdom for Decisions", "Readings for wisdom, discernment, and faithful choices.", [
    ["Proverbs 1", "Proverbs", 1],
    ["Proverbs 2", "Proverbs", 2],
    ["Proverbs 3", "Proverbs", 3],
    ["Proverbs 16", "Proverbs", 16],
    ["James 1", "James", 1],
    ["Colossians 3", "Colossians", 3],
    ["Psalm 25", "Psalms", 25]
  ], "Wisdom"),
  planFromReferences("grief-comfort", "Grief and Comfort", "Gentle passages for sorrow, comfort, hope, and God's nearness.", [
    ["Psalm 13", "Psalms", 13],
    ["Psalm 34", "Psalms", 34],
    ["Psalm 42", "Psalms", 42],
    ["Isaiah 40", "Isaiah", 40],
    ["John 11", "John", 11],
    ["2 Corinthians 1", "2 Corinthians", 1],
    ["Revelation 21", "Revelation", 21]
  ], "Care"),
  planFromReferences("beginner-bible", "Beginner Bible Reading Plan", "A friendly first path through major Bible themes and stories.", [
    ["Genesis 1", "Genesis", 1],
    ["Genesis 12", "Genesis", 12],
    ["Exodus 3", "Exodus", 3],
    ["Psalm 23", "Psalms", 23],
    ["Isaiah 53", "Isaiah", 53],
    ["Luke 2", "Luke", 2],
    ["John 3", "John", 3],
    ["Romans 8", "Romans", 8],
    ["Ephesians 2", "Ephesians", 2],
    ["Revelation 21", "Revelation", 21]
  ], "Beginner"),
  planFromReferences("chronological-overview", "Chronological Bible Overview", "A broad overview of the Bible story in historical flow.", [
    ["Genesis 1", "Genesis", 1],
    ["Genesis 12", "Genesis", 12],
    ["Exodus 12", "Exodus", 12],
    ["Joshua 1", "Joshua", 1],
    ["1 Samuel 16", "1 Samuel", 16],
    ["2 Samuel 7", "2 Samuel", 7],
    ["Isaiah 53", "Isaiah", 53],
    ["Luke 2", "Luke", 2],
    ["John 19", "John", 19],
    ["Acts 2", "Acts", 2],
    ["Romans 8", "Romans", 8],
    ["Revelation 21", "Revelation", 21]
  ], "Overview"),
  buildChapterPlan("old-testament-overview", "Old Testament Overview", "A broad chapter-by-chapter overview of the Old Testament.", OLD_TESTAMENT_BOOKS, 60, "Overview"),
  buildChapterPlan("new-testament-overview", "New Testament Overview", "A broad chapter-by-chapter overview of the New Testament.", NEW_TESTAMENT_BOOKS, 30, "Overview")
];

export const bibleReadingPlans = builtInBibleReadingPlans;
