import { afterEach, expect, test, vi } from "vitest";
import { fetchBibleApiPassage, fetchBsbPassage } from "./biblePassage";

vi.mock("@/data/reliabilityMetrics", () => ({ trackReliabilityMetric: () => undefined }));

afterEach(() => vi.unstubAllGlobals());

test("BSB chapter and verse-range navigation reuse one chapter request", async () => {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({
    book: { commonName: "John" },
    chapter: { content: [
      { type: "verse", number: 1, content: ["In the beginning"] },
      { type: "verse", number: 2, content: ["He was with God"] }
    ] }
  }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);

  const chapter = await fetchBsbPassage("John 1", new AbortController().signal);
  const singleVerse = await fetchBsbPassage("John 1:2", new AbortController().signal);

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(chapter.verses).toHaveLength(2);
  expect(singleVerse.reference).toBe("John 1:2");
  expect(singleVerse.verses?.map((verse) => verse.verse)).toEqual([2]);
});

test("passage cache is translation-specific and rejects an aborted navigation", async () => {
  const fetchMock = vi.fn(async (input: string) => new Response(JSON.stringify({
    reference: "John 2",
    text: "A verse",
    verses: [{ book_name: "John", chapter: 2, verse: 1, text: "A verse" }],
    translation_id: new URL(input).searchParams.get("translation")
  }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);

  await fetchBibleApiPassage("John 2", "web", new AbortController().signal);
  await fetchBibleApiPassage("  JOHN  2 ", "web", new AbortController().signal);
  await fetchBibleApiPassage("John 2", "kjv", new AbortController().signal);
  expect(fetchMock).toHaveBeenCalledTimes(2);

  const cancelled = new AbortController();
  cancelled.abort();
  await expect(fetchBibleApiPassage("John 2", "web", cancelled.signal)).rejects.toMatchObject({ name: "AbortError" });
});
