import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const app = read("app/index.tsx");
const schema = read("convex/schema.ts");
const study = read("convex/study.ts");

assert(app.includes("requestStudyTransition("), "Study changes must pass through the unfinished-work guard.");
for (const transition of ["switchMethod", "resetCurrentStudy", "applyPassageQuery", "studyBibleReadingPlanDay", "studyBibleSearchResult", "openReaderChapterInStudy"]) {
  const start = app.indexOf(`function ${transition}`);
  const section = app.slice(start, start + 1_600);
  assert(start >= 0 && section.includes("requestStudyTransition("), `${transition} must protect unfinished study work.`);
}
assert(app.includes("Keep draft & continue") && app.includes("Discard study") && app.includes("Cancel study change"), "The study transition dialog needs keep, discard, and cancel choices.");
assert(app.includes("saveStudyRecoveryDraft({") && app.includes("Recovered unsaved work from this device"), "Web study recovery storage is missing.");
assert(app.includes('window.addEventListener("beforeunload"'), "Unsynced web drafts need a navigation warning.");
assert(app.includes('label="Skip for now"') && app.includes("skippedStepTitles"), "Intentional skipped-step handling is missing.");
assert(app.includes("writing steps completed") && app.includes("Not completed"), "Partial completion must be visible during review.");
assert(!app.includes("shareNote || suggestedShareNote") && !app.includes("function buildShareNote("), "Private study responses must not automatically populate sharing text.");
assert(app.includes("Your study responses stay private unless you deliberately share them."), "The sharing privacy explanation is missing.");
assert(app.includes('accessibilityState={{ selected: active }}'), "Study progress needs a selected accessibility state.");
assert(app.includes('accessibilityLiveRegion="polite"'), "Save and completion status must be announced accessibly.");
assert(schema.includes("shareNote: v.optional(v.string())") && schema.includes("skippedStepTitles: v.optional(v.array(v.string()))"), "Draft/session recovery fields must stay backward-compatible.");
assert(study.includes("cleanStepTitles(args.skippedStepTitles)"), "Skipped step titles must be bounded and cleaned server-side.");

console.log("Validated Phase A study guards, recovery, explicit sharing, partial completion, and accessibility states.");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
