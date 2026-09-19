export const DEFAULT_OPEN_BIBLE_PLAN_SECTIONS: Record<string, boolean> = {
  custom: true, start: true, books: false, life: false, story: false, whole: false, intensive: false
};

export function normalizePlanSectionIds(value: unknown[]): string[] {
  const ids = value.map(item => typeof item === "string" ? item.trim() : "");
  const current = Object.keys(DEFAULT_OPEN_BIBLE_PLAN_SECTIONS).filter(id => ids.includes(id));
  // Old duration categories reopen Start here; they cannot map to the new topics.
  if (!current.some(id => id !== "custom") && ids.some(id => /^(short|medium|long)$/.test(id))) current.push("start");
  return current;
}

export function restoreBiblePlanSections(ids: unknown[]): Record<string, boolean> {
  const open = new Set(normalizePlanSectionIds(ids));
  return Object.fromEntries(Object.keys(DEFAULT_OPEN_BIBLE_PLAN_SECTIONS).map(id => [id, open.has(id)]));
}
