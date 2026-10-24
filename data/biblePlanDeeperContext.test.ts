import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { hasPlanDeeperContext, planContextReference, selectPlanCrossReferences } from "./biblePlanDeeperContext";
import { bibleReadingPlans } from "./bibleReadingPlans";
import { parseBsbPassageReference } from "./biblePassage";
import type { BibleReadingPlanDay } from "./bibleReadingPlanTypes";

vi.mock("react-native", () => ({ Platform: { OS: "web" } }));

const day: BibleReadingPlanDay = {
  day: 1,
  title: "Ask for wisdom",
  reference: "James 1:5-8",
  readerBook: "James",
  readerChapter: 1,
  studyReference: "James 1:5-8",
  guidanceKind: "guided-devotional"
};

describe("short plan deeper reading", () => {
  it("limits the automatic layout to short guided plans and opens the whole chapter for context", () => {
    expect(hasPlanDeeperContext(day, 14)).toBe(true);
    expect(hasPlanDeeperContext(day, 28)).toBe(false);
    expect(planContextReference(day)).toBe("James 1");
    expect(planContextReference({ ...day, reference: "Psalm 23" })).toBe("Psalm 23");
  });

  it("keeps related passages outside the current chapter and chooses distinct books", () => {
    const selected = selectPlanCrossReferences(day, [
      { reference: "James 1:2-4", title: "Same chapter", reason: "Same chapter" },
      { reference: "Exodus 31:3", title: "Wisdom", reason: "Related wisdom" },
      { reference: "Exodus 36:1-4", title: "Wisdom", reason: "Related wisdom" },
      { reference: "1 Kings 3:9-12", title: "Solomon", reason: "Solomon asks for wisdom", source: "curated" }
    ]);
    expect(selected.map((item) => item.reference)).toEqual(["1 Kings 3:9-12", "Exodus 31:3"]);
    expect(selected[0].note).toBe("Solomon asks for wisdom");
  });
});

it("offers two explorable references for every short guided plan day", () => {
  for (const plan of bibleReadingPlans.filter((item) => item.days.length <= 14 && item.days.every((itemDay) => itemDay.guidanceKind === "guided-devotional") && item.id !== "fourteen-days-wisdom")) {
    for (const example of plan.days) {
      const parsed = parseBsbPassageReference(example.reference)!;
      const bookFile = parsed.bookName.replace(/^Psalm$/, "Psalms").replace(/\s+/g, "-");
      const asset = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/cross-references/bsb", `${bookFile}.json`), "utf8"));
      const keys = parsed.startVerse
        ? Array.from({ length: (parsed.endVerse || parsed.startVerse) - parsed.startVerse + 1 }, (_, index) => `${parsed.chapter}:${parsed.startVerse! + index}`)
        : Object.keys(asset.references).filter((key) => key.startsWith(`${parsed.chapter}:`));
      const seen = new Set<string>();
      const suggestions = keys.flatMap((key) => asset.references[key] || []).filter((entry: any) => {
        if (seen.has(entry.r)) return false;
        seen.add(entry.r);
        return true;
      }).slice(0, 300).map((entry: any) => ({ reference: entry.r, title: "Related passage", reason: `Connected through “${entry.a}”.`, anchor: entry.a, source: "crossreferences.org" as const }));
      const connections = selectPlanCrossReferences(example, suggestions);
      expect(connections, `${plan.id} day ${example.day}`).toHaveLength(2);
      expect(connections.every((connection) => !!parseBsbPassageReference(connection.reference)), `${plan.id} day ${example.day} has readable references`).toBe(true);
    }
  }
});
