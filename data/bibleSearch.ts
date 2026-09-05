import {
  BIBLE_CHAPTER_COUNTS,
  BSB_BOOK_IDS,
  NEW_TESTAMENT_BOOKS,
  OLD_TESTAMENT_BOOKS,
  bibleBooks,
  flattenBsbVerseContent,
  normalizeBibleBookName
} from "@/data/bibleLibrary";
import { fetchWithTimeout, throwIfRequestAborted } from "@/data/network";

export type BibleSearchScope = "all" | "old" | "new";
export type BibleSearchMode = "word" | "phrase" | "allWords" | "anyWords" | "theme";

export type BibleSearchResult = {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
  sourceQuery: string;
};

type SearchTranslation = "KJV" | "WEB" | "BSB";

function bibleSearchTranslationId(translation: SearchTranslation) {
  if (translation === "KJV") return "KJV";
  if (translation === "BSB") return "BSB";
  return "WEB";
}

export async function fetchBibleSearchResults(
  searchTerm: string,
  translation: SearchTranslation,
  scope: BibleSearchScope,
  bookFilter: string,
  matchWhole: boolean,
  signal?: AbortSignal
): Promise<BibleSearchResult[]> {
  if (translation === "BSB") {
    try {
      const indexedResults = await fetchIndexedBibleSearchResults(searchTerm, translation, scope, bookFilter, matchWhole, signal);
      if (indexedResults.length > 0 || !bookFilter) return indexedResults;
    } catch (error) {
      throwIfRequestAborted(signal);
      if (!bookFilter) return [];
    }
    return fetchBsbSearchResults(searchTerm, scope, bookFilter, matchWhole, signal);
  }

  return fetchIndexedBibleSearchResults(searchTerm, translation, scope, bookFilter, matchWhole, signal);
}

async function fetchIndexedBibleSearchResults(
  searchTerm: string,
  translation: SearchTranslation,
  scope: BibleSearchScope,
  bookFilter: string,
  matchWhole: boolean,
  signal?: AbortSignal
): Promise<BibleSearchResult[]> {
  const params = new URLSearchParams({
    search: searchTerm,
    match_case: "false",
    match_whole: matchWhole ? "true" : "false",
    limit: "30",
    page: "1"
  });
  if (bookFilter) {
    const bookIndex = bibleBooks.indexOf(bookFilter);
    if (bookIndex >= 0) params.set("book", String(bookIndex + 1));
  } else if (scope !== "all") {
    params.set("book", scope === "old" ? "ot" : "nt");
  }

  const response = await fetchWithTimeout(`https://bolls.life/v2/find/${bibleSearchTranslationId(translation)}?${params.toString()}`, { signal });
  if (!response.ok) throw new Error("Bible search failed");
  const data = await response.json();
  const rawResults = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];

  return rawResults
    .map((item: any): BibleSearchResult | null => {
      const bookIndex = Number(item.book || item.book_id || item.bookId || 0) - 1;
      const book = bibleBooks[bookIndex] || normalizeBibleBookName(String(item.book_name || item.bookName || ""));
      const chapter = Number(item.chapter || 0);
      const verse = Number(item.verse || 0);
      const text = stripHtmlText(String(item.text || item.verse_text || item.content || ""));
      if (!book || !chapter || !verse || !text) return null;
      return {
        id: `${translation}-${book}-${chapter}-${verse}`,
        book,
        chapter,
        verse,
        text,
        translation,
        sourceQuery: searchTerm
      };
    })
    .filter((item: BibleSearchResult | null): item is BibleSearchResult => item !== null);
}

async function fetchBsbSearchResults(searchTerm: string, scope: BibleSearchScope, bookFilter: string, matchWhole: boolean, signal?: AbortSignal): Promise<BibleSearchResult[]> {
  const books = bookFilter
    ? [bookFilter]
    : scope === "old"
      ? OLD_TESTAMENT_BOOKS
      : scope === "new"
        ? NEW_TESTAMENT_BOOKS
        : bibleBooks;
  const chapters = books.flatMap((book) => Array.from({ length: BIBLE_CHAPTER_COUNTS[book] || 1 }, (_, index) => ({ book, chapter: index + 1 })));
  const results: BibleSearchResult[] = [];
  const batchSize = 8;

  for (let index = 0; index < chapters.length && results.length < 80; index += batchSize) {
    throwIfRequestAborted(signal);
    const batch = chapters.slice(index, index + batchSize);
    const batchResults = await Promise.all(batch.map(({ book, chapter }) =>
      fetchBsbSearchChapter(searchTerm, book, chapter, matchWhole, signal).catch((error) => {
        throwIfRequestAborted(signal);
        return [] as BibleSearchResult[];
      })
    ));
    results.push(...batchResults.flat());
  }

  return results;
}

async function fetchBsbSearchChapter(searchTerm: string, book: string, chapter: number, matchWhole: boolean, signal?: AbortSignal): Promise<BibleSearchResult[]> {
  const bookId = BSB_BOOK_IDS[normalizeBibleBookName(book)];
  if (!bookId) return [];

  const response = await fetchWithTimeout(`https://bible.helloao.org/api/BSB/${bookId}/${chapter}.json`, { signal });
  if (!response.ok) return [];

  const data = await response.json();
  const verses = (data.chapter?.content || []).filter((item: any) => item.type === "verse" && typeof item.number === "number");
  return verses
    .map((item: any): BibleSearchResult => {
      const verse = Number(item.number);
      return {
        id: `BSB-${book}-${chapter}-${verse}`,
        book,
        chapter,
        verse,
        text: flattenBsbVerseContent(item.content),
        translation: "BSB",
        sourceQuery: searchTerm
      };
    })
    .filter((result: BibleSearchResult) => bsbSearchResultMatchesTerm(result.text, searchTerm, matchWhole));
}

function bsbSearchResultMatchesTerm(text: string, searchTerm: string, matchWhole: boolean) {
  const normalizedTerm = normalizeBibleSearchText(searchTerm);
  if (!normalizedTerm) return false;
  if (matchWhole) return bibleSearchWords(text).includes(normalizedTerm);
  return normalizeBibleSearchText(text).includes(normalizedTerm);
}

export function buildBibleSearchQueries(query: string, mode: BibleSearchMode) {
  const words = bibleSearchWords(query);
  if (mode === "word") return [words[0] || query].filter(Boolean);
  if (mode === "phrase") return [query];
  if (mode === "allWords" || mode === "anyWords") return words.length ? words : [query];

  const normalized = query.toLowerCase();
  const themes: Record<string, string[]> = {
    anxiety: ["anxious", "fear", "peace", "trouble"],
    worry: ["anxious", "care", "fear", "peace"],
    afraid: ["fear not", "afraid", "courage"],
    fear: ["fear not", "afraid", "courage"],
    comfort: ["comfort", "peace", "hope"],
    grief: ["comfort", "mourning", "sorrow"],
    wisdom: ["wisdom", "understanding", "instruction"],
    prayer: ["pray", "prayer", "ask"],
    forgiveness: ["forgive", "forgiven", "mercy"],
    forgive: ["forgive", "forgiven", "mercy"],
    love: ["love", "charity", "kindness"],
    faith: ["faith", "believe", "trust"],
    hope: ["hope", "promise", "comfort"],
    scripture: ["scripture", "word", "profitable"],
    bible: ["scripture", "word", "profitable"],
    temptation: ["temptation", "endure", "escape"],
    suffering: ["suffering", "affliction", "comfort"],
    joy: ["joy", "rejoice", "gladness"],
    peace: ["peace", "rest", "comfort"],
    righteousness: ["righteousness", "godliness", "holiness"],
    repentance: ["repent", "turn", "confess"],
    near: ["draw nigh", "near", "seek"],
    purpose: ["purpose", "called", "works"]
  };
  const expanded = Object.entries(themes)
    .filter(([theme]) => normalized.includes(theme))
    .flatMap(([, terms]) => terms);
  const questionTerms = normalized.includes("?") || /\bwhat|where|why|how|does|about\b/.test(normalized)
    ? normalized.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 3 && !["what", "where", "does", "about", "when", "with", "from", "that"].includes(word))
    : [];
  return Array.from(new Set([query, ...expanded, ...questionTerms])).slice(0, 5);
}

export function bibleSearchModeLabel(mode: BibleSearchMode) {
  const labels: Record<BibleSearchMode, string> = {
    word: "Exact word",
    phrase: "Exact phrase",
    allWords: "All words",
    anyWords: "Any words",
    theme: "Theme"
  };
  return labels[mode];
}

export function filterBibleSearchResultsForMode(results: BibleSearchResult[], query: string, mode: BibleSearchMode) {
  const words = bibleSearchWords(query);
  const phrase = normalizeBibleSearchText(query);
  if (mode === "theme") return results;

  return results.filter((result) => {
    const text = normalizeBibleSearchText(result.text);
    const tokens = bibleSearchWords(result.text);
    if (mode === "phrase") return !!phrase && text.includes(phrase);
    if (mode === "anyWords") return words.some((word) => tokens.includes(word));
    return words.length > 0 && words.every((word) => tokens.includes(word));
  });
}

export function rankBibleSearchResults(results: BibleSearchResult[], query: string, mode: BibleSearchMode) {
  const words = bibleSearchWords(query);
  const phrase = normalizeBibleSearchText(query);
  return results.slice().sort((a, b) => {
    const aScore = bibleSearchScore(a, words, phrase, mode);
    const bScore = bibleSearchScore(b, words, phrase, mode);
    return bScore - aScore || bibleBooks.indexOf(a.book) - bibleBooks.indexOf(b.book) || a.chapter - b.chapter || a.verse - b.verse;
  });
}

function bibleSearchScore(result: BibleSearchResult, words: string[], phrase: string, mode: BibleSearchMode) {
  const text = normalizeBibleSearchText(result.text);
  const tokens = bibleSearchWords(result.text);
  let score = 0;
  if (phrase && text.includes(phrase)) score += mode === "phrase" ? 20 : 8;
  words.forEach((word) => {
    const occurrences = tokens.filter((token) => token === word).length;
    score += occurrences * (mode === "word" ? 10 : 4);
  });
  if (result.sourceQuery && words.includes(normalizeBibleSearchText(result.sourceQuery))) score += 2;
  return score;
}

function bibleSearchWords(value: string) {
  return normalizeBibleSearchText(value).split(/\s+/).filter((word) => word.length > 0);
}

function normalizeBibleSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function formatSearchDuration(milliseconds: number) {
  const seconds = milliseconds / 1000;
  if (seconds < 1) return `${Math.max(0.1, seconds).toFixed(1)} seconds`;
  if (seconds < 10) return `${seconds.toFixed(1)} seconds`;
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes} min ${remainingSeconds} sec`;
}

export function dedupeBibleSearchResults(results: BibleSearchResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.book}-${result.chapter}-${result.verse}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildBibleSearchBookOptions(scope: BibleSearchScope) {
  if (scope === "old") return OLD_TESTAMENT_BOOKS;
  if (scope === "new") return NEW_TESTAMENT_BOOKS;
  return bibleBooks;
}

export function buildBibleSearchSections(results: BibleSearchResult[], scope: BibleSearchScope, bookFilter: string) {
  const filtered = results.filter((result) => {
    if (bookFilter) return result.book === bookFilter;
    if (scope === "old") return OLD_TESTAMENT_BOOKS.includes(result.book);
    if (scope === "new") return NEW_TESTAMENT_BOOKS.includes(result.book);
    return true;
  });

  if (bookFilter) return [{ title: bookFilter, results: filtered }];
  if (scope === "old") return [{ title: "Old Testament", results: filtered }];
  if (scope === "new") return [{ title: "New Testament", results: filtered }];

  return [
    { title: "Old Testament", results: filtered.filter((result) => OLD_TESTAMENT_BOOKS.includes(result.book)) },
    { title: "New Testament", results: filtered.filter((result) => NEW_TESTAMENT_BOOKS.includes(result.book)) }
  ].filter((section) => section.results.length > 0);
}

function stripHtmlText(text: string) {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
