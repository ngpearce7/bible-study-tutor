import {
  BIBLE_BOOK_ALIASES,
  BSB_BOOK_IDS,
  bibleBooks,
  flattenBsbVerseContent,
  normalizeBibleBookName
} from "@/data/bibleLibrary";

export type BibleVerse = {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
};

export type BiblePassage = {
  reference: string;
  text: string;
  verses?: BibleVerse[];
  translation_id: string;
  translation_name: string;
  translation_note: string;
};

export type BibleApiTranslationId = "web" | "kjv";

export type BiblePlanReadingChunk = {
  reference: string;
  book: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
};

export async function fetchBibleApiPassage(reference: string, translation: BibleApiTranslationId, signal: AbortSignal): Promise<BiblePassage> {
  const response = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}?translation=${translation}`, { signal });
  if (!response.ok) throw new Error("Passage not found");
  const data = (await response.json()) as BiblePassage;
  const verses = data.verses?.map((verse) => ({
    ...verse,
    text: normalizeBibleApiText(verse.text)
  }));

  return {
    ...data,
    text: verses?.map((verse) => verse.text).join("\n") || normalizeBibleApiText(data.text),
    verses
  };
}

export async function fetchBsbPassage(reference: string, signal: AbortSignal): Promise<BiblePassage> {
  const parsed = parseBsbPassageReference(reference);
  if (!parsed) throw new Error("BSB needs a chapter reference");

  const response = await fetch(`https://bible.helloao.org/api/BSB/${parsed.bookId}/${parsed.chapter}.json`, { signal });
  if (!response.ok) throw new Error("BSB passage not found");

  const data = await response.json();
  const allVerses = (data.chapter?.content || []).filter((item: any) => item.type === "verse" && typeof item.number === "number");
  const selectedVerses = allVerses.filter((item: any) => {
    if (!parsed.startVerse) return true;
    return item.number >= parsed.startVerse && item.number <= (parsed.endVerse || parsed.startVerse);
  });

  if (!selectedVerses.length) throw new Error("No BSB verses found");

  const verses = selectedVerses.map((item: any) => ({
    book_name: data.book?.commonName || parsed.bookName,
    chapter: parsed.chapter,
    verse: item.number,
    text: flattenBsbVerseContent(item.content)
  }));

  return {
    reference: formatBsbReference(parsed),
    text: verses.map((verse: BibleVerse) => verse.text).join("\n"),
    verses,
    translation_id: "BSB",
    translation_name: "Berean Standard Bible",
    translation_note: "Public Domain"
  };
}

export async function fetchBiblePlanReadingPassage(reference: string, translation: "bsb" | BibleApiTranslationId, signal: AbortSignal): Promise<BiblePassage> {
  const references = expandPlanReadingReferences(reference);
  const passages = await Promise.all(
    references.map((item) =>
      fetchBiblePlanReadingChunkPassage(item, translation, signal)
    )
  );
  const first = passages[0];
  if (!first) throw new Error("Plan reading not found");

  return {
    reference,
    text: passages.map((passage) => passage.text).join("\n\n"),
    verses: passages.flatMap((passage) => passage.verses || []),
    translation_id: first.translation_id,
    translation_name: first.translation_name,
    translation_note: first.translation_note
  };
}

async function fetchBiblePlanReadingChunkPassage(chunk: BiblePlanReadingChunk, translation: "bsb" | BibleApiTranslationId, signal: AbortSignal): Promise<BiblePassage> {
  const chapterReference = `${chunk.book} ${chunk.chapter}`;
  const chapterPassage =
    translation === "bsb"
      ? await fetchBsbPassage(chapterReference, signal)
      : await fetchBibleApiPassage(chapterReference, translation, signal);
  const verses = (chapterPassage.verses || []).filter((verse) => {
    if (chunk.startVerse && verse.verse < chunk.startVerse) return false;
    if (chunk.endVerse && verse.verse > chunk.endVerse) return false;
    return true;
  });
  if (!verses.length) throw new Error("Plan reading chunk not found");

  return {
    ...chapterPassage,
    reference: chunk.reference,
    text: verses.map((verse) => verse.text).join("\n"),
    verses
  };
}

export function parsePassageQuery(query: string) {
  const compact = query.trim().replace(/\s+/g, " ");
  if (!compact) return { reference: "" };

  const normalized = compact.replace(/\s*:\s*/g, ":").replace(/\s*-\s*/g, "-");
  const resolved = resolveBibleBookReference(normalized);
  if (!resolved) return { reference: normalized };

  const rest = resolved.rest;
  const parts = rest.match(/^(\d+)?(?:\s+|:)?(\d+)?(?:-(\d+))?$/);
  const chapter = parts?.[1] || "";
  const startVerse = parts?.[2] || "";
  const endVerse = parts?.[3] || "";
  const verse = startVerse ? `:${startVerse}${endVerse ? `-${endVerse}` : ""}` : "";

  return {
    reference: `${normalizeBibleBookName(resolved.book)}${chapter ? ` ${chapter}` : ""}${verse}`.trim()
  };
}

export function expandPlanReadingReferences(reference: string) {
  const segments = reference
    .split(/\s*;\s*/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  const expanded = segments.flatMap(expandPlanReadingSegment);
  return expanded;
}

function expandPlanReadingSegment(segment: string): BiblePlanReadingChunk[] {
  const compact = segment.trim().replace(/\s+/g, " ").replace(/\s*-\s*/g, "-");
  const resolved = resolveBibleBookReference(compact);
  if (!resolved) return [];

  const bookName = normalizeBibleBookName(resolved.book);
  const crossChapterVerseRange = resolved.rest.match(/^(\d+):(\d+)-(\d+):(\d+)$/);
  if (crossChapterVerseRange) {
    const startChapter = Number(crossChapterVerseRange[1]);
    const startVerse = Number(crossChapterVerseRange[2]);
    const endChapter = Number(crossChapterVerseRange[3]);
    const endVerse = Number(crossChapterVerseRange[4]);
    if (![startChapter, startVerse, endChapter, endVerse].every(Number.isFinite)) return [];
    const firstChapter = Math.min(startChapter, endChapter);
    const lastChapter = Math.max(startChapter, endChapter);
    return Array.from({ length: lastChapter - firstChapter + 1 }, (_, index) => {
      const chapter = firstChapter + index;
      return {
        reference:
          chapter === startChapter
            ? `${bookName} ${chapter}:${startVerse}-end`
            : chapter === endChapter
              ? `${bookName} ${chapter}:1-${endVerse}`
              : `${bookName} ${chapter}`,
        book: bookName,
        chapter,
        startVerse: chapter === startChapter ? startVerse : undefined,
        endVerse: chapter === endChapter ? endVerse : undefined
      };
    });
  }

  const sameChapterVerseRange = resolved.rest.match(/^(\d+):(\d+)-(\d+)$/);
  if (sameChapterVerseRange) {
    const chapter = Number(sameChapterVerseRange[1]);
    const startVerse = Number(sameChapterVerseRange[2]);
    const endVerse = Number(sameChapterVerseRange[3]);
    if (![chapter, startVerse, endVerse].every(Number.isFinite)) return [];
    return [{
      reference: `${bookName} ${chapter}:${Math.min(startVerse, endVerse)}-${Math.max(startVerse, endVerse)}`,
      book: bookName,
      chapter,
      startVerse: Math.min(startVerse, endVerse),
      endVerse: Math.max(startVerse, endVerse)
    }];
  }

  const verseToChapterEnd = resolved.rest.match(/^(\d+):(\d+)-end$/);
  if (verseToChapterEnd) {
    const chapter = Number(verseToChapterEnd[1]);
    const startVerse = Number(verseToChapterEnd[2]);
    if (![chapter, startVerse].every(Number.isFinite)) return [];
    return [{ reference: `${bookName} ${chapter}:${startVerse}-end`, book: bookName, chapter, startVerse }];
  }

  const singleVerse = resolved.rest.match(/^(\d+):(\d+)$/);
  if (singleVerse) {
    const chapter = Number(singleVerse[1]);
    const verse = Number(singleVerse[2]);
    if (![chapter, verse].every(Number.isFinite)) return [];
    return [{ reference: `${bookName} ${chapter}:${verse}`, book: bookName, chapter, startVerse: verse, endVerse: verse }];
  }

  const chapterRange = resolved.rest.match(/^(\d+)-(\d+)$/);
  if (!chapterRange) {
    const singleChapter = resolved.rest.match(/^(\d+)$/);
    if (!singleChapter) return [];
    const chapter = Number(singleChapter[1]);
    return Number.isFinite(chapter) ? [{ reference: `${bookName} ${chapter}`, book: bookName, chapter }] : [];
  }

  const start = Number(chapterRange[1]);
  const end = Number(chapterRange[2]);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return [];

  const first = Math.min(start, end);
  const last = Math.max(start, end);
  return Array.from({ length: last - first + 1 }, (_, index) => {
    const chapter = first + index;
    return { reference: `${bookName} ${chapter}`, book: bookName, chapter };
  });
}

export function parseBsbPassageReference(query: string) {
  const compact = query.trim().replace(/\s+/g, " ").replace(/\s*:\s*/g, ":").replace(/\s*-\s*/g, "-");
  const resolved = resolveBibleBookReference(compact);
  if (!resolved) return null;

  const bookName = normalizeBibleBookName(resolved.book);
  const bookId = BSB_BOOK_IDS[bookName];
  const rest = resolved.rest;
  const match = rest.match(/^(\d+)(?::(\d+)(?:-(\d+))?)?$/);
  if (!bookId || !match) return null;

  return {
    bookName,
    bookId,
    chapter: Number(match[1]),
    startVerse: match[2] ? Number(match[2]) : undefined,
    endVerse: match[3] ? Number(match[3]) : undefined
  };
}

function normalizeBibleApiText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function formatBsbReference(parsed: { bookName: string; chapter: number; startVerse?: number; endVerse?: number }) {
  if (!parsed.startVerse) return `${parsed.bookName} ${parsed.chapter}`;
  return `${parsed.bookName} ${parsed.chapter}:${parsed.startVerse}${parsed.endVerse ? `-${parsed.endVerse}` : ""}`;
}

function resolveBibleBookReference(reference: string) {
  const normalizedReference = normalizeBibleBookLookupKey(reference);
  const aliases = buildBibleBookAliasEntries();
  const matched = aliases.find(({ key }) => {
    if (normalizedReference === key) return true;
    if (!normalizedReference.startsWith(key)) return false;
    const nextChar = normalizedReference.slice(key.length, key.length + 1);
    return !nextChar || /\s|\d|:|-/.test(nextChar);
  });

  if (!matched) return null;

  return {
    book: matched.book,
    rest: normalizedReference.slice(matched.key.length).trim()
  };
}

function buildBibleBookAliasEntries() {
  const entries = new Map<string, string>();
  const add = (alias: string, book: string) => {
    const key = normalizeBibleBookLookupKey(alias);
    if (key) entries.set(key, book);
  };

  [...bibleBooks, "Psalm"].forEach((book) => {
    add(book, book);
    add(book.replace(/\s+/g, ""), book);
  });
  Object.entries(BIBLE_BOOK_ALIASES).forEach(([alias, book]) => add(alias, book));

  return Array.from(entries, ([key, book]) => ({ key, book })).sort((a, b) => b.key.length - a.key.length);
}

function normalizeBibleBookLookupKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[.]/g, "")
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
}
