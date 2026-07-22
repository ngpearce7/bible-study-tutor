import type { BibleReadingPlan, BibleReadingPlanDay } from "@/data/bibleReadingPlans";

export type ReaderPlanReading = {
  planId: string;
  day: number;
  reference: string;
  book: string;
  chapter: number;
};

export type ReaderLoadRequest = {
  mode: "chapter" | "plan";
  reference: string;
};

export function buildReaderPlanReading(planDay: BibleReadingPlanDay, planId: string): ReaderPlanReading | null {
  const reference = (planDay.reference || planDay.studyReference || "").trim();
  const chapter = Math.max(1, Math.round(Number(planDay.readerChapter) || 1));
  if (!planId || !reference || !planDay.readerBook || !Number.isFinite(chapter)) return null;

  return {
    planId,
    day: planDay.day,
    reference,
    book: planDay.readerBook,
    chapter
  };
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
    readerPlanReading.book === readerBook &&
    readerPlanReading.chapter === readerChapter
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
  return {
    mode: readerPlanReadingActive ? "plan" : "chapter",
    reference: readerPlanReadingActive ? readerPlanReading?.reference.trim() || chapterReference : chapterReference
  };
}
