import { afterEach, expect, test, vi } from "vitest";
import { fetchBibleSearchResults } from "./bibleSearch";

vi.mock("@/data/reliabilityMetrics", () => ({ trackReliabilityMetric: () => undefined }));

afterEach(() => vi.unstubAllGlobals());

test("Bible search exposes subsequent result pages without repeating the first page", async () => {
  const requests: URL[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: string) => {
    const url = new URL(input);
    requests.push(url);
    const page = Number(url.searchParams.get("page"));
    const count = page === 1 ? 30 : 5;
    const firstVerse = page === 1 ? 1 : 31;
    return new Response(JSON.stringify({
      total: 35,
      results: Array.from({ length: count }, (_, index) => ({
        book: 19, chapter: 119, verse: firstVerse + index, text: `Verse ${firstVerse + index}`
      }))
    }), { status: 200 });
  }));

  const first = await fetchBibleSearchResults("love", "WEB", "all", "", true);
  const second = await fetchBibleSearchResults("love", "WEB", "all", "", true, undefined, 2);

  expect(requests.map((url) => url.searchParams.get("page"))).toEqual(["1", "2"]);
  expect(first.results).toHaveLength(30);
  expect(first.hasMore).toBe(true);
  expect(second.results).toHaveLength(5);
  expect(second.results[0].verse).toBe(31);
  expect(second.hasMore).toBe(false);
});
