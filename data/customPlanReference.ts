import { parseBsbPassageReference } from "@/data/biblePassage";
import { BIBLE_CHAPTER_COUNTS, displayBibleBookName } from "@/data/bibleLibrary";

export function normalizeCustomPlanReference(input: string): string | null {
  const parsed = parseBsbPassageReference(input);
  if (!parsed) return null;
  const chapterCount = BIBLE_CHAPTER_COUNTS[displayBibleBookName(parsed.bookName)];
  if (!chapterCount || parsed.chapter < 1 || parsed.chapter > chapterCount) return null;
  if (parsed.startVerse !== undefined && (parsed.startVerse < 1 || (parsed.endVerse !== undefined && parsed.endVerse < parsed.startVerse))) return null;
  return `${parsed.bookName} ${parsed.chapter}${parsed.startVerse === undefined ? "" : `:${parsed.startVerse}${parsed.endVerse === undefined ? "" : `-${parsed.endVerse}`}`}`;
}
