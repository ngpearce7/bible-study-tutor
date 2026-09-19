import { describe, expect, it } from "vitest";
import { DEFAULT_OPEN_BIBLE_PLAN_SECTIONS, normalizePlanSectionIds, restoreBiblePlanSections } from "./biblePlanSections";

describe("reading-plan category preferences", () => {
  it.each(Object.keys(DEFAULT_OPEN_BIBLE_PLAN_SECTIONS))("keeps %s open through save, normalization, and profile restoration", id => {
    const state = { ...restoreBiblePlanSections([]), [id]: true };
    const saved = Object.entries(state).filter(([, open]) => open).map(([key]) => key);
    expect(restoreBiblePlanSections(normalizePlanSectionIds(saved))).toEqual(state);
  });
  it("preserves an explicitly closed Start here category and multiple open categories", () => {
    const restored = restoreBiblePlanSections(["books", "whole", "intensive"]);
    expect(restored.start).toBe(false);
    expect(Object.keys(restored).filter(id => restored[id])).toEqual(["books", "whole", "intensive"]);
    expect(Object.values(restoreBiblePlanSections([])).every(open => !open)).toBe(true);
  });
  it("handles legacy duration preferences and rejects unknown values", () => {
    expect(normalizePlanSectionIds(["short", "medium", "long", "custom"])).toEqual(["custom", "start"]);
    expect(normalizePlanSectionIds([" books ", "books", "invalid", null, 3])).toEqual(["books"]);
  });
});
