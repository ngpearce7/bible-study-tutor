import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const app = read("app/index.tsx");
const progress = read("data/bibleReadingPlanProgress.ts");
const view = read("data/bibleReadingPlanView.ts");
const accountability = read("convex/accountability.ts");
const vitals = read("data/webVitals.ts");

assert(!/^import .*bibleReadingPlans/m.test(app), "the app entry must not statically import the reading-plan corpus");
assert(app.includes('import("@/data/bibleReadingPlans")'), "the reading-plan corpus must be loaded on demand");
assert(!progress.includes('from "@/data/bibleReadingPlans"'), "progress hydration must stay independent of the plan corpus");
assert(!view.includes('from "@/data/bibleReadingPlans"'), "plan view selectors must stay independent of the plan corpus");
assert(view.includes("builtInPlans: BibleReadingPlan[]") && view.includes("[...builtInPlans, ...customPlans]"), "plan view must accept the lazily loaded corpus");
assert(app.includes("group.plans.slice(0, visibleGroupRowCount)"), "plan groups must render a bounded initial window");
assert(app.includes("dayWindow.days.map((planDay)") && app.includes("(activeBibleReadingPlanDayWindow?.days || []).map((planDay)"), "active and followed plan timelines must render bounded day windows");
assert(app.includes("const TodayRhythmCard = memo("), "the always-visible rhythm subscription must be isolated from the root surface");
assert(app.includes('tab === "account" ? { profileId: activeProfileId } : "skip"'), "account identity must only subscribe on the Account tab");
assert(app.includes('tab === "home" || tab === "account"'), "study stats must only subscribe where they are rendered");
assert(accountability.includes("export const accountIdentity = query"), "account credential projection is missing");
assert(accountability.includes("_id: profile._id") && !accountability.includes("...profileSummary"), "core profile query must return an explicit projection");
assert(vitals.includes("LCP: 2500") && vitals.includes("INP: 200") && vitals.includes("CLS: 0.1"), "field Core Web Vitals targets must match the good thresholds");
assert(vitals.includes("Measures locally only") && !vitals.includes("fetch("), "field metrics must remain local and privacy-preserving");

console.log("Validated Phase 3 lazy plan loading, bounded rendering, projected subscriptions, and local Core Web Vitals targets.");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
