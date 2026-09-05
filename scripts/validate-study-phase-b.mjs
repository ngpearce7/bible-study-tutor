import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const app = read("app/index.tsx");
const methods = read("data/methods.ts");
const schema = read("convex/schema.ts");
const study = read("convex/study.ts");

for (const field of ["focusText", "focusVerseKeys", "evidenceVerseKeys", "reviewReadActionTomorrow"]) {
  assert(schema.includes(`${field}: v.optional(`), `${field} must remain optional for existing study documents.`);
  assert(study.includes(field), `${field} must be accepted and cleaned by study mutations.`);
}
assert(app.includes("normalizeStudyMethodState(parsed?.methodState)"), "Older local drafts need a safe method-state fallback.");
assert(app.includes("methodState: hasStudyMethodState ? studyMethodState : undefined"), "Method-specific state must be persisted only when used.");
assert(app.includes("Your Scripture focus") && app.includes("useSelectedVersesAsFocus"), "SOAP, Lectio, and HEAR need a persistent Scripture focus.");
assert(app.includes("Passage evidence") && app.includes("useSelectedVersesAsEvidence"), "OIA needs linked passage evidence.");
assert(app.includes("Read the nearby context") && app.includes("studyContextPassage?.verses?.map"), "COMA needs nearby context in the active step.");
assert(methods.includes('title: "Respond"') && methods.includes("Keep the passage’s original meaning distinct from your present response."), "Inductive needs a text-grounded response step.");
assert(app.includes("Review this action tomorrow") && app.includes('preset: "tomorrow"'), "READ needs an explicit next-day action follow-up.");
assert(app.includes('accessibilityRole="checkbox"') && app.includes("reviewReadActionTomorrow"), "The READ follow-up control must expose checkbox semantics.");

console.log("Validated Phase B focus, evidence, context, response, persistence, and action follow-up behavior.");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
