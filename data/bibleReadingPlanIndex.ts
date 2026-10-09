import type { BibleReadingPlan } from "@/data/bibleReadingPlanTypes";

type CompactDay = [title: string, reference: string, readerBook: string, readerChapter: number, studyReference: string];
type CompactPlan = Omit<BibleReadingPlan, "days"> & { days: CompactDay[] };
type CompactIndex = { version: number; plans: CompactPlan[] };

export function parseBibleReadingPlanIndex(value: unknown): BibleReadingPlan[] {
  const index = value as CompactIndex;
  if (index?.version !== 1 || !Array.isArray(index.plans)) throw new Error("Reading-plan index is invalid");
  return index.plans.map(({ days, ...metadata }) => {
    if (!metadata.id || !Array.isArray(days)) throw new Error("Reading-plan index is incomplete");
    return {
      ...metadata,
      days: days.map((entry, index) => {
        if (!Array.isArray(entry) || entry.length !== 5 || typeof entry[1] !== "string" || typeof entry[3] !== "number") {
          throw new Error("Reading-plan day is invalid");
        }
        return {
          day: index + 1,
          title: entry[0],
          reference: entry[1],
          readerBook: entry[2],
          readerChapter: entry[3],
          studyReference: entry[4]
        };
      })
    };
  });
}

let indexPromise: Promise<BibleReadingPlan[]> | null = null;
export function loadBibleReadingPlanIndex() {
  if (!indexPromise) {
    indexPromise = fetch("/bible-reading-plan-index.json", { cache: "no-cache" })
      .then((response) => {
        if (!response.ok) throw new Error("Reading-plan index could not be loaded");
        return response.json();
      })
      .then(parseBibleReadingPlanIndex)
      .catch((error) => {
        indexPromise = null;
        throw error;
      });
  }
  return indexPromise;
}
