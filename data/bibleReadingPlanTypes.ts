export type BibleReadingPlanSource = "built-in" | "custom";

export type BibleReadingPlanDay = {
  day: number;
  title: string;
  reference: string;
  readerBook: string;
  readerChapter: number;
  studyReference: string;
  context?: string;
  devotional?: {
    title: string;
    body: string;
    source?: string;
  };
  observationQuestion?: string;
  reflectionQuestion?: string;
  reflectionPrompt?: string;
  prayer?: string;
  prayerPrompt?: string;
  gentleAction?: string;
  studyMethod?: string;
  careNote?: string;
  guidanceKind?: "guided-devotional" | "reading-guidance";
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
  careNote?: string;
  sampleDayNumbers?: number[];
  previewDayNumber?: number;
  days: BibleReadingPlanDay[];
};

export function readerBookFromReferenceBook(book: string) {
  return book === "Psalm" ? "Psalms" : book;
}
