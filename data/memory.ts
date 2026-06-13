export type MemoryBrowseStatusFilter = "all" | "due" | "learning" | "memorized";
export type MemoryReviewPreset = "later-today" | "tomorrow" | "three-days" | "next-week" | "next-month";

export type MemoryBibleVerse = {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
};

export const MEMORY_REVIEW_OPTIONS: { id: MemoryReviewPreset; label: string }[] = [
  { id: "later-today", label: "Later today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "three-days", label: "In 3 days" },
  { id: "next-week", label: "Next week" },
  { id: "next-month", label: "Next month" }
];

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
  return !verse.nextReviewAt || verse.nextReviewAt <= Date.now() || isTodayLocal(verse.nextReviewAt);
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
  if (!nextReviewAt || nextReviewAt <= Date.now()) return "Review: due now";
  if (isTodayLocal(nextReviewAt)) return "Review: today";
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(nextReviewAt);
  const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const daysUntilReview = Math.max(0, Math.ceil((targetStart - todayStart) / (1000 * 60 * 60 * 24)));
  if (daysUntilReview <= 0) return "Review in: today";
  if (daysUntilReview === 1) return "Review in: 1 day";
  return `Review in: ${daysUntilReview} days`;
}

export function reviewPresetForDate(nextReviewAt?: number): MemoryReviewPreset {
  if (!nextReviewAt || nextReviewAt <= Date.now()) return "later-today";

  const hoursUntilReview = (nextReviewAt - Date.now()) / (1000 * 60 * 60);
  if (hoursUntilReview <= 8) return "later-today";
  if (hoursUntilReview <= 36) return "tomorrow";
  if (hoursUntilReview <= 24 * 5) return "three-days";
  if (hoursUntilReview <= 24 * 14) return "next-week";
  return "next-month";
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
