import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const app = read("app/index.tsx");
const journal = read("components/JournalTab.tsx");
const methods = read("data/methods.ts");
const schema = read("convex/schema.ts");
const study = read("convex/study.ts");
const preferences = read("data/feedbackPreferences.ts");
const printable = read("data/printableWorksheet.ts");

const stepTitleCount = (methods.match(/^\s{8}title: /gm) || []).length;
const stepIdCount = (methods.match(/^\s{8}id: /gm) || []).length;
assert(stepIdCount === stepTitleCount && stepIdCount >= 30, "Every study step needs a stable ID.");
assert((methods.match(/^\s{4}detail: \{/gm) || []).length === 7, "Every method needs a full detail guide.");
assert((methods.match(/^\s{6}duration: /gm) || []).length === 7, "Every method guide needs an approximate duration.");
for (const block of methods.match(/^\s{2}\{\n\s{4}id:.*?(?=^\s{2}\{|^\];)/gms) || []) {
  const ids = [...block.matchAll(/^\s{8}id: "([^"]+)"/gm)].map((match) => match[1]);
  assert(ids.length === new Set(ids).size, "Step IDs must be unique within each method.");
}
assert(app.includes("restoreStudyAnswers") && app.includes("item.stepId === step.id"), "Saved answers must restore by stable step ID first.");
assert(schema.match(/stepId: v\.optional\(v\.string\(\)\)/g)?.length === 2, "Step IDs must be optional on old draft and session records.");
assert(schema.includes("skippedStepIds: v.optional(v.array(v.string()))"), "Skipped steps need stable optional IDs.");
assert(study.includes("stepId: clampOptionalText(item.stepId, 80)"), "Step IDs must be cleaned server-side.");

const dueReviewQuery = study.slice(study.indexOf("export const dueStudyReviews"), study.indexOf("export const stats"));
assert(dueReviewQuery.includes("now: v.optional(v.number())") && dueReviewQuery.includes('lte("reviewAt", args.now ?? 0)'), "Due reviews must use backward-compatible client-supplied time.");
assert(!dueReviewQuery.includes("Date.now()"), "Reactive due-review queries must not read the wall clock.");
for (const queryName of ["recentDrafts", "recentSessions", "dueStudyReviews"]) {
  const start = study.indexOf(`export const ${queryName}`);
  const section = study.slice(start, start + 900);
  assert(section.includes("clampNumber(args.limit"), `${queryName} must clamp its requested result limit.`);
}
assert(app.includes("setInterval(() => setStudyReviewNow(Date.now()), 60_000)"), "The client must refresh due-review time.");
assert(study.includes("export const removeStudyReview = mutation({") && study.includes("reviewAt: undefined") && study.includes("reviewStatus: undefined"), "Scheduled study reviews must be removable without deleting the study.");
assert(app.includes("removeStudyReviewMutation") && app.includes("Review reminder removed. Your study is still in Journal."), "The Journal must invoke review removal and confirm that the study remains saved.");
assert(journal.includes('"Change review"') && journal.includes('"Remove review"') && journal.includes('"Confirm remove"'), "Scheduled reviews need clear change and confirmed removal controls.");
assert(journal.includes("Choosing a new period will replace this date."), "Changing a review must explain that the new date replaces the old one.");
const journalRenderStart = journal.indexOf("return (");
const scheduledReviewPanelStart = journal.indexOf('entry.reviewStatus === "scheduled" && (', journalRenderStart);
const scheduledReviewPanel = journal.slice(scheduledReviewPanelStart, journal.indexOf('entry.reviewStatus === "reviewed"', scheduledReviewPanelStart));
assert(scheduledReviewPanel.includes('"Change review"') && scheduledReviewPanel.includes("renderReviewScheduleOptions(entry, rawEntryId)"), "Change-review options must expand inside the scheduled-review panel.");
assert(journal.includes('entry.reviewStatus !== "scheduled" && (') && journal.includes("Delete journal entry?") && journal.includes("This cannot be undone."), "Scheduled review controls must stay out of the entry action row and journal deletion must use a warning dialog.");
assert(journal.includes('role: "dialog"') && journal.includes('accessibilityLabel="Cancel deleting journal entry"'), "The delete confirmation must expose accessible dialog and cancel controls.");

assert(app.includes("Public-domain translation comparison") && app.includes("Promise.allSettled(BIBLE_TRANSLATIONS.map"), "Study translation comparison is missing.");
assert(app.includes("Optional quiet timer") && app.includes("formatQuietTimer"), "The optional contemplative timer is missing.");
assert(app.includes("Worked example · not your response") && app.includes("methodExampleModeId"), "Guided examples must remain separate from user responses.");
assert(printable.includes("buildPrintableGroupStudyGuideHtml") && printable.includes("Private study answers are not included."), "The privacy-safe group guide export is missing.");
assert(app.includes('label="Group guide"') && app.includes("openGroupStudyGuide"), "The study flow must link to group-guide export.");
assert(preferences.includes("community: true") && preferences.includes("helps: true"), "Secondary study panels should be collapsed by default.");
assert(app.includes("phoneStudyProgressScroll") && app.includes("phoneStudyProgressPill"), "Mobile study steps need compact horizontal navigation.");
assert(app.includes("Bible passage reference in focus mode"), "Focus mode must retain passage selection.");

console.log("Validated Phase C method guides, examples, study tools, responsive navigation, exports, and Convex reliability safeguards.");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
