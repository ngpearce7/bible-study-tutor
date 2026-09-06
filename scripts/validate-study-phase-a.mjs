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
assert(app.includes("Draft autosave is on. Unfinished studies appear in Journal under Drafts."), "The study screen must explain automatic draft saving and where drafts are found.");
assert(app.includes('window.addEventListener("beforeunload"'), "Unsynced web drafts need a navigation warning.");
assert(app.includes('label="Skip for now"') && app.includes("skippedStepTitles"), "Intentional skipped-step handling is missing.");
assert(app.includes('if (stepIndex === method.steps.length - 1 && !hasStudyWork)') && app.includes("A completed study needs at least one written response."), "Skipping every writing step must return the user to a writing step instead of Review.");
assert(app.includes('if (!hasStudyWork)') && app.includes("Complete at least one written response before saving this study."), "The client must prevent an empty study from being completed.");
assert(study.includes('if (!cleaned.answers.some((item) => item.answer.length > 0))'), "Convex must reject completed studies without a written response.");
assert(app.includes('if (studyPhase === "saved") return;') && app.includes("setLoadedDraftKey(currentStudyKey)"), "Deleting a completed draft must not reset the visible saved confirmation.");
assert(app.includes("Saved to Journal") && app.includes('label="Open Journal"'), "Completed studies need an explicit Journal confirmation and next action.");
assertIncludes(app, '{studyPhase !== "saved" && (\n              <View style={[styles.scriptureBox', "The passage workspace must be hidden once the saved confirmation is shown.");
assert(app.includes("writing steps completed") && app.includes("Not completed"), "Partial completion must be visible during review.");
assert(!app.includes("shareNote || suggestedShareNote") && !app.includes("function buildShareNote("), "Private study responses must not automatically populate sharing text.");
assert(app.includes("Your study responses stay private unless you deliberately share them."), "The sharing privacy explanation is missing.");
assert(app.includes("shareInsightPanelOpen") && app.includes('accessibilityLabel={shareInsightPanelOpen ? "Hide shareable insight" : "Add a shareable insight"}'), "Shareable insight must use an accessible collapsed-by-default panel.");
assert(app.includes('name={shareInsightPanelOpen ? "remove-circle-outline" : "add-circle-outline"} size={24} color={colors.coral}'), "Shareable insight needs the established coral circular expand control aligned in its header.");
assert(app.includes('accessibilityState={{ selected: active }}'), "Study progress needs a selected accessibility state.");
assert(app.includes('accessibilityLiveRegion="polite"'), "Save and completion status must be announced accessibly.");
assert(schema.includes("shareNote: v.optional(v.string())") && schema.includes("skippedStepTitles: v.optional(v.array(v.string()))"), "Draft/session recovery fields must stay backward-compatible.");
assert(study.includes("cleanStepTitles(args.skippedStepTitles)"), "Skipped step titles must be bounded and cleaned server-side.");

console.log("Validated Phase A study guards, recovery, explicit sharing, partial completion, and accessibility states.");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertIncludes(source, value, message) {
  assert(source.includes(value), message);
}
