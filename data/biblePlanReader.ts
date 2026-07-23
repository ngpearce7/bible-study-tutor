import type { BibleReadingPlan, BibleReadingPlanDay } from "@/data/bibleReadingPlans";
import { expandPlanReadingReferences } from "@/data/biblePassage";

export type ReaderPlanReading = {
  planId: string;
  day: number;
  reference: string;
  book: string;
  chapter: number;
  chunks: ReaderPlanReadingChunk[];
  currentChunkIndex: number;
};

export type ReaderPlanReadingChunk = {
  reference: string;
  book: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
};

function readerBookFromReferenceBook(book: string) {
  return book === "Psalm" ? "Psalms" : book;
}

export type ReaderLoadRequest = {
  mode: "chapter" | "plan";
  reference: string;
};

export function buildReaderPlanReading(planDay: BibleReadingPlanDay, planId: string): ReaderPlanReading | null {
  const reference = (planDay.reference || planDay.studyReference || "").trim();
  const parsedChunks = expandPlanReadingReferences(reference)
    .filter((chunk) => chunk.book && Number.isFinite(chunk.chapter))
    .map((chunk) => ({
      reference: chunk.reference,
      book: readerBookFromReferenceBook(chunk.book),
      chapter: Math.max(1, Math.round(Number(chunk.chapter) || 1)),
      startVerse: chunk.startVerse,
      endVerse: chunk.endVerse
    }));
  const fallbackChapter = Math.max(1, Math.round(Number(planDay.readerChapter) || 1));
  const chunks = parsedChunks.length
    ? parsedChunks
    : [{ reference, book: planDay.readerBook, chapter: fallbackChapter }];
  const firstChunk = chunks[0];
  if (!planId || !reference || !firstChunk?.book || !Number.isFinite(firstChunk.chapter)) return null;

  return {
    planId,
    day: planDay.day,
    reference,
    book: firstChunk.book,
    chapter: firstChunk.chapter,
    chunks,
    currentChunkIndex: 0
  };
}

export function getReaderPlanReadingChunk(readerPlanReading: ReaderPlanReading | null | undefined) {
  if (!readerPlanReading?.chunks?.length) return null;
  return readerPlanReading.chunks[Math.min(Math.max(readerPlanReading.currentChunkIndex || 0, 0), readerPlanReading.chunks.length - 1)] || null;
}

export function isReaderPlanReadingActive(
  activePlan: BibleReadingPlan | null | undefined,
  readerPlanReading: ReaderPlanReading | null | undefined,
  readerBook: string,
  readerChapter: number
) {
  return (
    !!activePlan &&
    !!readerPlanReading &&
    !!readerPlanReading.reference.trim() &&
    readerPlanReading.planId === activePlan.id &&
    !!getReaderPlanReadingChunk(readerPlanReading) &&
    getReaderPlanReadingChunk(readerPlanReading)?.book === readerBook &&
    getReaderPlanReadingChunk(readerPlanReading)?.chapter === readerChapter
  );
}

export function getReaderPlanDayForChapter(
  activePlan: BibleReadingPlan | null | undefined,
  readerBook: string,
  readerChapter: number
) {
  return activePlan?.days.find((day) => day.readerBook === readerBook && day.readerChapter === readerChapter) || null;
}

export function buildReaderLoadRequest(
  readerPlanReadingActive: boolean,
  readerPlanReading: ReaderPlanReading | null | undefined,
  chapterReference: string
): ReaderLoadRequest {
  const chunk = getReaderPlanReadingChunk(readerPlanReading);
  return {
    mode: readerPlanReadingActive ? "plan" : "chapter",
    reference: readerPlanReadingActive ? chunk?.reference || readerPlanReading?.reference.trim() || chapterReference : chapterReference
  };
}
