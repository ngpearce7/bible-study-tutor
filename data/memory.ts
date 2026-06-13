export type MemoryBrowseStatusFilter = "all" | "due" | "learning" | "memorized";
export type MemoryReviewPreset = "later-today" | "tomorrow" | "three-days" | "next-week" | "next-month";
export type MemoryHistoryEventKind = "added" | "updated" | "reviewed" | "repeated" | "scheduled" | "removed";

export type MemoryBibleVerse = {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
};

export const MEMORY_REVIEW_OPTIONS: { id: MemoryReviewPreset; label: string }[] = [
  { id: "later-today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "three-days", label: "In 3 days" },
  { id: "next-week", label: "Next week" },
  { id: "next-month", label: "Next month" }
];

export const MEMORY_HISTORY_EVENT_META: Record<MemoryHistoryEventKind, { label: string; icon: string }> = {
  added: { label: "Added to Memory", icon: "add-circle-outline" },
  updated: { label: "Updated verse", icon: "create-outline" },
  reviewed: { label: "Reviewed", icon: "checkmark-circle-outline" },
  repeated: { label: "Repeated practice", icon: "refresh-outline" },
  scheduled: { label: "Review scheduled", icon: "calendar-outline" },
  removed: { label: "Removed", icon: "trash-outline" }
};

function normalizeBibleBookName(bookName: string) {
  return bookName === "Psalms" ? "Psalm" : bookName;
}

export function buildMemoryReference(verses: MemoryBibleVerse[]) {
  if (verses.length === 0) return "Selected verse";

  const first = verses[0];
  const last = verses[verses.length - 1];
  const book = normalizeBibleBookName(first.book_name);
  if (verses.length === 1 || first.verse === last.verse) return `${book} ${first.chapter}:${first.verse}`;
  return `${book} ${first.chapter}:${first.verse}-${last.verse}`;
}

export function buildMemoryVerseKeySet(verses: MemoryBibleVerse[], memoryVerses: { reference?: string; verseText?: string }[]) {
  const keys = new Set<string>();

  verses.forEach((verse) => {
    const key = verseMarkupKey(verse);
    if (memoryVerses.some((memoryVerse) => memoryVerseMatchesVerse(memoryVerse, verse))) keys.add(key);
  });

  return keys;
}

function verseMarkupKey(verse: MemoryBibleVerse) {
  return `${verse.book_name}:${verse.chapter}:${verse.verse}`;
}

function memoryVerseMatchesVerse(memoryVerse: { reference?: string; verseText?: string }, verse: MemoryBibleVerse) {
  if (memoryReferenceIncludesVerse(memoryVerse.reference || "", verse)) return true;

  const savedText = normalizeMemoryText(memoryVerse.verseText || "");
  const verseText = normalizeMemoryText(verse.text);
  return !!verseText && savedText.includes(verseText);
}

function memoryReferenceIncludesVerse(reference: string, verse: MemoryBibleVerse) {
  const match = reference.trim().match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return false;

  const [, bookName, chapterText, startVerseText, endVerseText] = match;
  const bookMatches = normalizeBibleBookName(bookName).toLowerCase() === normalizeBibleBookName(verse.book_name).toLowerCase();
  const chapterMatches = Number(chapterText) === verse.chapter;
  const startVerse = Number(startVerseText);
  const endVerse = Number(endVerseText || startVerseText);

  return bookMatches && chapterMatches && verse.verse >= startVerse && verse.verse <= endVerse;
}

function normalizeMemoryText(text: string) {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

export function memoryStatusLabel(verse: { status: string; practiceLevel?: number; reviewCount?: number }) {
  if (isMemoryVerseMemorized(verse)) return "Reviewed";
  if (verse.status === "review" || verse.status === "memorized") return "Review soon";
  if (verse.status === "learning") return "Reviewed";
  return "New";
}

export function memoryPracticeLabel(level: number) {
  if (level >= 3) return "fill every word";
  if (level === 2) return "fill every second word";
  return "read the full verse";
}

export function memoryProgressLabel(verse: { status: string; practiceLevel?: number; reviewCount?: number }) {
  if (isMemoryVerseMemorized(verse)) return "Reviewed";
  return `Step ${clampMemoryPracticeLevel(verse.practiceLevel || 1)}`;
}

export function isMemoryVerseMemorized(verse: { status: string; reviewCount?: number }) {
  return verse.status === "memorized" && (verse.reviewCount || 0) >= 2;
}

export function isMemoryVerseDue(verse: { nextReviewAt?: number }) {
  if (!verse.nextReviewAt) return true;
  return startOfLocalDay(verse.nextReviewAt) <= startOfLocalDay(Date.now());
}

export function isTodayLocal(timestamp?: number) {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

export function reviewPresetLabel(preset: MemoryReviewPreset) {
  return MEMORY_REVIEW_OPTIONS.find((option) => option.id === preset)?.label || "Review";
}

export function memoryReviewDateLabel(nextReviewAt?: number) {
  if (!nextReviewAt) return "Review: due now";
  const todayStart = startOfLocalDay(Date.now());
  const targetStart = startOfLocalDay(nextReviewAt);
  if (targetStart < todayStart) return "Review: due now";
  if (targetStart === todayStart) return "Review: today";
  const daysUntilReview = Math.max(0, Math.ceil((targetStart - todayStart) / (1000 * 60 * 60 * 24)));
  if (daysUntilReview === 1) return "Review in: 1 day";
  return `Review in: ${daysUntilReview} days`;
}

export function memoryHistoryEventLabel(event: MemoryHistoryEventKind, practiceLevel?: number) {
  if (event === "reviewed" && practiceLevel) return `Reviewed Step ${Math.max(1, Math.min(3, Math.round(practiceLevel)))}`;
  if (event === "repeated" && practiceLevel) return `Repeated Step ${Math.max(1, Math.min(3, Math.round(practiceLevel)))}`;
  return MEMORY_HISTORY_EVENT_META[event]?.label || "Memory activity";
}

export function memoryHistoryEventIcon(event: MemoryHistoryEventKind) {
  return MEMORY_HISTORY_EVENT_META[event]?.icon || "time-outline";
}

export function formatMemoryHistoryDate(value?: number) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();
  const sameDay = isTodayLocal(value);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
  const yesterdayEnd = yesterday + 1000 * 60 * 60 * 24;
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today, ${time}`;
  if (value >= yesterday && value < yesterdayEnd) return `Yesterday, ${time}`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" })
  });
}

type MemoryVerseForHistory = {
  reference: string;
  createdAt?: number;
  reviewCount?: number;
  lastReviewedAt?: number;
};

export function buildMemoryHistorySummary(
  history: { event: MemoryHistoryEventKind; createdAt: number; reference: string }[],
  verses: MemoryVerseForHistory[] = []
) {
  const reviewedEvents = history.filter((event) => event.event === "reviewed");
  const repeatedEvents = history.filter((event) => event.event === "repeated");
  const addedEvents = history.filter((event) => event.event === "added");
  const reviewedTodayEvents = reviewedEvents.filter((event) => isTodayLocal(event.createdAt));
  const reviewedThisWeekEvents = reviewedEvents.filter((event) => daysAgo(event.createdAt) < 7);
  const reviewedVerses = verses.filter((verse) => (verse.reviewCount || 0) > 0);
  const reviewedToday = verses.length
    ? verses.filter((verse) => isTodayLocal(verse.lastReviewedAt)).length
    : uniqueReferenceCount(reviewedTodayEvents);
  const reviewedThisWeek = verses.length
    ? verses.filter((verse) => Boolean(verse.lastReviewedAt) && daysAgo(verse.lastReviewedAt || 0) < 7).length
    : uniqueReferenceCount(reviewedThisWeekEvents);
  const reviewDaysThisWeek = uniqueReviewDays(reviewedThisWeekEvents).length;
  const mostReviewed = verses.length ? mostReviewedVerse(reviewedVerses) : mostFrequentReference(reviewedEvents);

  return {
    reviewedToday,
    reviewedThisWeek,
    reviewDaysThisWeek,
    addedCount: verses.length || addedEvents.length,
    repeatedCount: repeatedEvents.length,
    mostReviewed
  };
}

export function buildMemoryHistoryEncouragement(
  summary: { reviewedToday: number; reviewedThisWeek: number; reviewDaysThisWeek: number; addedCount: number },
  name?: string
) {
  const greeting = name ? `${name}, ` : "";
  if (summary.reviewedToday >= 3) return `${greeting}you have reviewed ${summary.reviewedToday} verses today. That is a strong rhythm with Scripture.`;
  if (summary.reviewedToday === 1) return `${greeting}you reviewed Scripture today. Small faithful steps are still real progress.`;
  if (summary.reviewedToday > 1) return `${greeting}you reviewed ${summary.reviewedToday} verses today. Keep carrying those words with you.`;
  if (summary.reviewDaysThisWeek >= 3) return `${greeting}you have returned to memory practice ${summary.reviewDaysThisWeek} days this week. Keep going.`;
  if (summary.reviewedThisWeek > 0) return `${greeting}you have reviewed ${summary.reviewedThisWeek} verse${summary.reviewedThisWeek === 1 ? "" : "s"} this week. Come back to one today when you are ready.`;
  if (summary.addedCount > 0) return `${greeting}you have started building a memory list. Choose one verse and review it slowly today.`;
  return `${greeting}your memory history will grow as you add and review verses. Start with one verse and let it settle in.`;
}

export function memoryVerseProgressMessage(verse: {
  status: string;
  reviewCount?: number;
  lastReviewedAt?: number;
  createdAt?: number;
}) {
  const reviewCount = verse.reviewCount || 0;
  if (reviewCount === 0) return "Newly added";
  if (isTodayLocal(verse.lastReviewedAt)) return "Reviewed today";
  if (reviewCount >= 8) return "Strong memory rhythm";
  if (reviewCount >= 4) return "Reviewed several times";
  if (reviewCount >= 2) return "Building confidence";
  return "First review complete";
}

export function memoryVerseProgressDetail(verse: {
  status: string;
  reviewCount?: number;
  lastReviewedAt?: number;
  createdAt?: number;
}) {
  const reviewCount = verse.reviewCount || 0;
  if (reviewCount === 0) return "This verse is ready for its first slow review.";
  if (isTodayLocal(verse.lastReviewedAt)) return "You have already returned to this verse today.";
  if (reviewCount >= 8) return "This verse has a steady review pattern behind it.";
  if (reviewCount >= 4) return "This verse is becoming familiar through repeated review.";
  if (reviewCount >= 2) return "You are starting to build confidence with this verse.";
  return "You have begun reviewing this verse.";
}

export function buildNeglectedMemoryVerses(
  verses: { reference: string; lastReviewedAt?: number; createdAt?: number; reviewCount?: number }[],
  limit = 3
) {
  const now = Date.now();
  const day = 1000 * 60 * 60 * 24;

  return verses
    .map((verse) => {
      const lastTouchedAt = verse.lastReviewedAt || verse.createdAt || 0;
      const daysSinceReview = lastTouchedAt ? Math.floor((now - lastTouchedAt) / day) : 0;
      const threshold = (verse.reviewCount || 0) > 0 ? 7 : 3;
      return { ...verse, daysSinceReview, neglected: daysSinceReview >= threshold };
    })
    .filter((verse) => verse.neglected)
    .sort((a, b) => b.daysSinceReview - a.daysSinceReview || a.reference.localeCompare(b.reference))
    .slice(0, limit);
}

export function neglectedMemoryVerseLabel(daysSinceReview: number, reviewCount?: number) {
  if (!reviewCount) return daysSinceReview <= 1 ? "Added recently, not reviewed yet" : `Added ${daysSinceReview} days ago, not reviewed yet`;
  if (daysSinceReview <= 1) return "Reviewed recently";
  return `Not reviewed for ${daysSinceReview} days`;
}

export function buildMemoryWeeklySummary(
  history: { event: MemoryHistoryEventKind; createdAt: number; reference: string }[],
  verses: MemoryVerseForHistory[] = []
) {
  const weeklyReviewed = history.filter((event) => event.event === "reviewed" && daysAgo(event.createdAt) < 7);
  const weeklyAdded = history.filter((event) => event.event === "added" && daysAgo(event.createdAt) < 7);
  const weeklyReviewedVerses = verses.filter((verse) => Boolean(verse.lastReviewedAt) && daysAgo(verse.lastReviewedAt || 0) < 7);
  const weeklyAddedVerses = verses.filter((verse) => Boolean(verse.createdAt) && daysAgo(verse.createdAt || 0) < 7);
  const weeklyReviewedCount = verses.length ? weeklyReviewedVerses.length : uniqueReferenceCount(weeklyReviewed);
  const weeklyAddedCount = verses.length ? weeklyAddedVerses.length : uniqueReferenceCount(weeklyAdded);
  const weeklyReferences = verses.length
    ? [...weeklyReviewedVerses, ...weeklyAddedVerses].map((verse) => verse.reference)
    : [...weeklyReviewed, ...weeklyAdded].map((event) => event.reference);
  const books = uniqueBooksFromReferences(weeklyReferences);

  if (weeklyReviewedCount === 0 && weeklyAddedCount === 0) {
    return "No memory activity recorded this week yet. One slow review would be a good place to begin.";
  }

  const reviewedText = weeklyReviewedCount
    ? `reviewed ${weeklyReviewedCount} verse${weeklyReviewedCount === 1 ? "" : "s"}`
    : "";
  const addedText = weeklyAddedCount
    ? `added ${weeklyAddedCount} verse${weeklyAddedCount === 1 ? "" : "s"}`
    : "";
  const actionText = [reviewedText, addedText].filter(Boolean).join(" and ");
  const bookText = books.length ? ` across ${formatShortList(books)}` : "";
  return `This week you ${actionText}${bookText}.`;
}

export function buildMemoryMilestones(
  history: { event: MemoryHistoryEventKind; createdAt: number; reference: string }[],
  verses: MemoryVerseForHistory[] = []
) {
  const addedEvents = history.filter((event) => event.event === "added");
  const reviewedEvents = history.filter((event) => event.event === "reviewed");
  const reviewDaysThisWeek = uniqueReviewDays(reviewedEvents.filter((event) => daysAgo(event.createdAt) < 7)).length;
  const reviewedVerses = verses.filter((verse) => (verse.reviewCount || 0) > 0);
  const uniqueAddedCount = verses.length || uniqueReferenceCount(addedEvents);
  const uniqueReviewedCount = verses.length ? reviewedVerses.length : uniqueReferenceCount(reviewedEvents);
  const totalCompletedReviews = verses.length
    ? reviewedVerses.reduce((total, verse) => total + (verse.reviewCount || 0), 0)
    : reviewedEvents.length;
  const reviewedBooks = uniqueBooksFromReferences(
    verses.length ? reviewedVerses.map((verse) => verse.reference) : reviewedEvents.map((event) => event.reference)
  );
  const firstAdded = oldestEvent(addedEvents);
  const firstReviewed = oldestEvent(reviewedEvents);
  const sortedReviews = reviewedEvents.slice().sort((a, b) => a.createdAt - b.createdAt);
  const fifthReview = sortedReviews[4] || null;
  const tenthReview = sortedReviews[9] || null;
  const starterMilestones: { title: string; description: string; achieved: boolean }[] = [
    {
      title: "First verse added",
      description: firstAdded
        ? `${firstAdded.reference} was the first verse added to Memory on ${formatMemoryHistoryDate(firstAdded.createdAt)}.`
        : "Your first saved memory verse will appear here.",
      achieved: addedEvents.length > 0
    },
    {
      title: "First full review",
      description: firstReviewed
        ? `${firstReviewed.reference} was the first verse you reviewed from memory on ${formatMemoryHistoryDate(firstReviewed.createdAt)}.`
        : "Your first completed memory review will appear here.",
      achieved: reviewedEvents.length > 0
    },
  ];
  const ongoingMilestones: { title: string; description: string; achieved: boolean }[] = [
    {
      title: "Five reviews",
      description: totalCompletedReviews >= 5 && fifthReview
        ? `You reached five completed reviews with ${fifthReview.reference} on ${formatMemoryHistoryDate(fifthReview.createdAt)}.`
        : totalCompletedReviews >= 5
          ? `You have completed ${totalCompletedReviews} memory reviews.`
        : `${Math.max(0, 5 - totalCompletedReviews)} more completed review${5 - totalCompletedReviews === 1 ? "" : "s"} to reach five.`,
      achieved: totalCompletedReviews >= 5
    },
    {
      title: "Ten reviews",
      description: totalCompletedReviews >= 10 && tenthReview
        ? `You reached ten completed reviews with ${tenthReview.reference} on ${formatMemoryHistoryDate(tenthReview.createdAt)}.`
        : totalCompletedReviews >= 10
          ? `You have completed ${totalCompletedReviews} memory reviews.`
        : `${Math.max(0, 10 - totalCompletedReviews)} more completed review${10 - totalCompletedReviews === 1 ? "" : "s"} to reach ten.`,
      achieved: totalCompletedReviews >= 10
    },
    {
      title: "Three verses reviewed",
      description: uniqueReviewedCount >= 3
        ? `You have reviewed ${uniqueReviewedCount} different verses from memory.`
        : `${Math.max(0, 3 - uniqueReviewedCount)} more verse${3 - uniqueReviewedCount === 1 ? "" : "s"} to review from memory.`,
      achieved: uniqueReviewedCount >= 3
    },
    {
      title: "Three review days",
      description: reviewDaysThisWeek >= 3
        ? "You reviewed Scripture on three different days this week."
        : `${Math.max(0, 3 - reviewDaysThisWeek)} more review day${3 - reviewDaysThisWeek === 1 ? "" : "s"} to reach three days this week.`,
      achieved: reviewDaysThisWeek >= 3
    },
    {
      title: "Seven-day rhythm",
      description: reviewDaysThisWeek >= 7
        ? "You reviewed Scripture on seven different days this week."
        : `${Math.max(0, 7 - reviewDaysThisWeek)} more review day${7 - reviewDaysThisWeek === 1 ? "" : "s"} to reach a seven-day rhythm this week.`,
      achieved: reviewDaysThisWeek >= 7
    },
    {
      title: "Three books touched",
      description: reviewedBooks.length >= 3
        ? `Your memory reviews now reach ${formatShortList(reviewedBooks)}.`
        : `${Math.max(0, 3 - reviewedBooks.length)} more Bible book${3 - reviewedBooks.length === 1 ? "" : "s"} to review across three books.`,
      achieved: reviewedBooks.length >= 3
    },
    {
      title: "Five verses saved",
      description: uniqueAddedCount >= 5
        ? `You have saved ${uniqueAddedCount} different verses for memory.`
        : `${Math.max(0, 5 - uniqueAddedCount)} more saved verse${5 - uniqueAddedCount === 1 ? "" : "s"} to reach five.`,
      achieved: uniqueAddedCount >= 5
    }
  ];

  const achievedOngoing = ongoingMilestones.filter((milestone) => milestone.achieved);
  const nextOngoing = ongoingMilestones.find((milestone) => !milestone.achieved);
  const achievedStarter = starterMilestones.filter((milestone) => milestone.achieved);
  const nextStarter = starterMilestones.find((milestone) => !milestone.achieved);
  return [
    ...achievedOngoing,
    ...(nextOngoing ? [nextOngoing] : []),
    ...achievedStarter,
    ...(nextStarter ? [nextStarter] : [])
  ].slice(0, 4);
}

function oldestEvent<T extends { createdAt: number }>(events: T[]) {
  return events.slice().sort((a, b) => a.createdAt - b.createdAt)[0] || null;
}

function daysAgo(timestamp: number) {
  return (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
}

function uniqueReviewDays(events: { createdAt: number }[]) {
  const keys = new Set<string>();
  events.forEach((event) => {
    const date = new Date(event.createdAt);
    keys.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
  });
  return Array.from(keys);
}

function uniqueReferenceCount(events: { reference: string }[]) {
  return new Set(events.map((event) => normalizeMemoryText(event.reference))).size;
}

function uniqueBooksFromReferences(references: string[]) {
  return Array.from(new Set(references.map((reference) => parseMemoryReference(reference).book).filter(Boolean))).slice(0, 3);
}

function formatShortList(items: string[]) {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function mostFrequentReference(events: { reference: string }[]) {
  const counts = new Map<string, number>();
  events.forEach((event) => counts.set(event.reference, (counts.get(event.reference) || 0) + 1));
  return Array.from(counts.entries())
    .map(([reference, count]) => ({ reference, count }))
    .sort((a, b) => b.count - a.count || a.reference.localeCompare(b.reference))[0] || null;
}

function mostReviewedVerse(verses: MemoryVerseForHistory[]) {
  return verses
    .map((verse) => ({ reference: verse.reference, count: verse.reviewCount || 0 }))
    .filter((verse) => verse.count > 0)
    .sort((a, b) => b.count - a.count || a.reference.localeCompare(b.reference))[0] || null;
}

export function reviewPresetForDate(nextReviewAt?: number): MemoryReviewPreset {
  if (!nextReviewAt) return "later-today";

  const daysUntilReview = Math.round((startOfLocalDay(nextReviewAt) - startOfLocalDay(Date.now())) / (1000 * 60 * 60 * 24));
  if (daysUntilReview <= 0) return "later-today";
  if (daysUntilReview <= 1) return "tomorrow";
  if (daysUntilReview <= 5) return "three-days";
  if (daysUntilReview <= 14) return "next-week";
  return "next-month";
}

function startOfLocalDay(timestamp: number) {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function buildMemoryQueueSections(verses: any[]) {
  const byReviewTime = (a: any, b: any) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0) || (b.updatedAt || 0) - (a.updatedAt || 0);
  const byRecent = (a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0);
  const due = verses.filter(isMemoryVerseDue).sort(byReviewTime);
  const reviewed = verses.filter((verse) => !isMemoryVerseDue(verse)).sort(byRecent);

  return [
    { title: "Due for Review", description: "Start here. These verses are ready for today’s review.", verses: due },
    { title: "Reviewed", description: "Verses already reviewed or resting until their next review.", verses: reviewed }
  ].filter((section) => section.verses.length > 0);
}

export function buildMemoryBrowseSections(verses: any[], searchTerm: string, bookFilter: string, chapterFilter: string, statusFilter: MemoryBrowseStatusFilter) {
  const filtered = verses
    .filter((verse) => matchesMemorySearch(verse, searchTerm))
    .filter((verse) => bookFilter === "all" || parseMemoryReference(verse.reference).book === bookFilter)
    .filter((verse) => chapterFilter === "all" || memoryChapterKey(parseMemoryReference(verse.reference)) === chapterFilter)
    .filter((verse) => matchesMemoryStatusFilter(verse, statusFilter))
    .sort((a, b) => {
      const aReference = parseMemoryReference(a.reference);
      const bReference = parseMemoryReference(b.reference);
      return (
        aReference.book.localeCompare(bReference.book) ||
        aReference.chapter - bReference.chapter ||
        aReference.verse - bReference.verse ||
        (b.updatedAt || 0) - (a.updatedAt || 0)
      );
    });
  const groups = new Map<string, any[]>();

  filtered.forEach((verse) => {
    const parsed = parseMemoryReference(verse.reference);
    const key = parsed.chapter ? `${parsed.book} ${parsed.chapter}` : parsed.book;
    groups.set(key, [...(groups.get(key) || []), verse]);
  });

  return Array.from(groups.entries()).map(([title, groupedVerses]) => ({
    title,
    description: `${groupedVerses.length} saved ${groupedVerses.length === 1 ? "verse" : "verses"}`,
    verses: groupedVerses
  }));
}

export function buildMemoryBookOptions(verses: any[]) {
  const counts = new Map<string, number>();
  verses.forEach((verse) => {
    const book = parseMemoryReference(verse.reference).book;
    counts.set(book, (counts.get(book) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([book, count]) => ({ book, count }))
    .sort((a, b) => a.book.localeCompare(b.book));
}

export function buildMemoryChapterOptions(verses: any[], bookFilter: string) {
  const counts = new Map<string, { label: string; count: number; chapter: number; book: string }>();
  verses.forEach((verse) => {
    const parsed = parseMemoryReference(verse.reference);
    if (bookFilter !== "all" && parsed.book !== bookFilter) return;

    const key = memoryChapterKey(parsed);
    const current = counts.get(key);
    counts.set(key, {
      label: parsed.chapter ? `${parsed.book} ${parsed.chapter}` : parsed.book,
      count: (current?.count || 0) + 1,
      chapter: parsed.chapter,
      book: parsed.book
    });
  });

  return Array.from(counts.entries())
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => a.book.localeCompare(b.book) || a.chapter - b.chapter);
}

function matchesMemorySearch(verse: any, searchTerm: string) {
  if (!searchTerm) return true;

  return [verse.reference, verse.verseText, verse.translationName, memoryStatusLabel(verse)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(searchTerm);
}

function matchesMemoryStatusFilter(verse: any, statusFilter: MemoryBrowseStatusFilter) {
  if (statusFilter === "all") return true;
  if (statusFilter === "memorized") return isMemoryVerseMemorized(verse);
  if (statusFilter === "due") return isMemoryVerseDue(verse);
  return !isMemoryVerseDue(verse);
}

export function parseMemoryReference(reference: string) {
  const match = reference.trim().match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?/);
  return {
    book: match ? match[1] : "Other",
    chapter: match ? Number(match[2]) : 0,
    verse: match ? Number(match[3]) : 0,
    endVerse: match?.[4] ? Number(match[4]) : 0
  };
}

function memoryChapterKey(reference: { book: string; chapter: number }) {
  return `${reference.book}:${reference.chapter || 0}`;
}

export function clampMemoryPracticeLevel(level: number) {
  return Math.max(1, Math.min(3, Math.round(level || 1)));
}

export function buildMemoryPracticeText(verse: { reference?: string; verseText?: string }) {
  const verseText = (verse.verseText || "").trim();
  const reference = memoryReferenceSuffix(verse.reference || "");
  return reference ? `${verseText} ${reference}`.trim() : verseText;
}

function memoryReferenceSuffix(reference: string) {
  const parsed = parseMemoryReference(reference);
  if (!parsed.chapter || !parsed.verse) return "";
  if (parsed.endVerse && parsed.endVerse !== parsed.verse) return `${parsed.book} ${parsed.chapter}:${parsed.verse}-${parsed.endVerse}`;
  return `${parsed.book} ${parsed.chapter}:${parsed.verse}`;
}

export function buildMemoryPracticeTokens(text: string, level: number, stepTwoOffset: number) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => ({
      index,
      text: word,
      answer: word,
      blank: level >= 3 || (level === 2 && index % 2 === stepTwoOffset)
    }));
}

export function memoryAnswerIsReference(answer: string) {
  return /^\d+:\d+(?:-\d+)?$/.test(answer.trim());
}

export function formatMemoryBlankValue(answer: string, value: string) {
  const referenceMatch = answer.trim().match(/^(\d+):(\d+)(?:-(\d+))?$/);
  if (!referenceMatch) return value;

  const digits = value.replace(/\D/g, "");
  const chapter = referenceMatch[1];
  const verse = referenceMatch[2];
  const endVerse = referenceMatch[3] || "";
  const chapterLength = chapter.length;
  const verseLength = verse.length;

  if (digits.length <= chapterLength) return digits;
  const typedChapter = digits.slice(0, chapterLength);
  const typedVerse = digits.slice(chapterLength, chapterLength + verseLength);
  const typedEndVerse = endVerse ? digits.slice(chapterLength + verseLength, chapterLength + verseLength + endVerse.length) : "";

  return `${typedChapter}:${typedVerse}${typedEndVerse ? `-${typedEndVerse}` : ""}`;
}

export function normalizeMemoryAnswer(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function memoryBlankWidth(answer: string, compact = false) {
  const letters = answer.replace(/[^a-z0-9]/gi, "").length;
  return Math.max(compact ? 44 : 48, Math.min(compact ? 142 : 170, letters * (compact ? 11 : 12) + 26));
}

export function memoryHintText(answer: string, hintLevel = 1) {
  const cleaned = answer.replace(/[^a-z0-9]/gi, "");
  if (!cleaned) return "";
  const revealCount = memoryHintRevealCount(answer, hintLevel);
  if (revealCount >= cleaned.length) return cleaned;
  return `${cleaned.slice(0, revealCount)}${"_".repeat(Math.max(1, Math.min(8, cleaned.length - revealCount)))}`;
}

export function memoryHintRevealCount(answer: string, hintLevel: number) {
  const length = answer.replace(/[^a-z0-9]/gi, "").length;
  return Math.max(1, Math.min(length, Math.round(hintLevel || 1)));
}
