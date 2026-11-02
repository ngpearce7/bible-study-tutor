import { expect, test } from "vitest";
import { buildMemoryPracticeTokens } from "@/data/memory";

test("standalone punctuation never becomes an empty memory blank", () => {
  const tokens = buildMemoryPracticeTokens("God.’ — Matthew 4:4", 3, 0);
  expect(tokens.map(({ text, blank }) => [text, blank])).toEqual([
    ["God.’", true],
    ["—", false],
    ["Matthew", true],
    ["4:4", true]
  ]);
});

test("punctuation does not shift the every-second-word practice pattern", () => {
  const tokens = buildMemoryPracticeTokens("God. — Matthew 4:4", 2, 0);
  expect(tokens.filter((token) => token.blank).map((token) => token.text)).toEqual(["God.", "4:4"]);
});
