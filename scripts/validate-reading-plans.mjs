import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const repoRoot = process.cwd();
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bst-reading-plans-"));

function transpileToCjs(sourcePath, outputName, replacements = []) {
  let source = fs.readFileSync(path.join(repoRoot, sourcePath), "utf8");
  for (const [from, to] of replacements) {
    source = source.replaceAll(from, to);
  }
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      skipLibCheck: true
    },
    fileName: sourcePath
  });
  const outputPath = path.join(tempDir, outputName);
  fs.writeFileSync(outputPath, result.outputText);
  return outputPath;
}

transpileToCjs("data/bibleBooks.ts", "bibleBooks.cjs");
transpileToCjs("data/bibleLibrary.ts", "bibleLibrary.cjs", [
  ['"@/data/bibleBooks"', '"./bibleBooks.cjs"']
]);
const plansPath = transpileToCjs("data/bibleReadingPlans.ts", "bibleReadingPlans.cjs", [
  ['"@/data/bibleLibrary"', '"./bibleLibrary.cjs"']
]);

const { bibleReadingPlans } = require(plansPath);

const errors = [];
const warnings = [];
const flagshipPlanIds = new Set([
  "seven-days-new-believers",
  "seven-days-prayer",
  "anxiety-peace",
  "grief-comfort"
]);
const carePlanIds = new Set(["anxiety-peace", "grief-comfort", "fourteen-days-anxiety-trust", "fourteen-days-grief-comfort"]);

function pushIssue(collection, plan, day, message) {
  const prefix = day ? `${plan.id} day ${day.day}` : plan.id;
  collection.push(`${prefix}: ${message}`);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasDevotional(day) {
  return hasText(day.devotional?.title) && hasText(day.devotional?.body);
}

function checkPlan(plan) {
  if (!hasText(plan.id)) errors.push("Plan missing id.");
  if (!hasText(plan.title)) pushIssue(errors, plan, null, "missing title.");
  if (!hasText(plan.description)) pushIssue(errors, plan, null, "missing description.");
  if (!Array.isArray(plan.days) || plan.days.length === 0) {
    pushIssue(errors, plan, null, "has no days.");
    return;
  }

  const seenDays = new Set();
  for (const day of plan.days) {
    if (!Number.isInteger(day.day) || day.day < 1) pushIssue(errors, plan, day, "has an invalid day number.");
    if (seenDays.has(day.day)) pushIssue(errors, plan, day, "duplicates another day number.");
    seenDays.add(day.day);
    if (!hasText(day.title)) pushIssue(errors, plan, day, "missing title.");
    if (!hasText(day.reference)) pushIssue(errors, plan, day, "missing passage/reference.");
    if (!hasText(day.readerBook)) pushIssue(errors, plan, day, "missing reader book.");
    if (!Number.isInteger(day.readerChapter) || day.readerChapter < 1) pushIssue(errors, plan, day, "has an invalid reader chapter.");
    if (!hasText(day.studyReference)) pushIssue(errors, plan, day, "missing study reference.");

    if (day.title?.startsWith("Reflect on") && !hasDevotional(day)) {
      pushIssue(warnings, plan, day, "is a reflection day without devotional guidance.");
    }

    if (flagshipPlanIds.has(plan.id)) {
      if (!hasText(day.context)) pushIssue(errors, plan, day, "flagship day missing context.");
      if (!hasDevotional(day)) pushIssue(errors, plan, day, "flagship day missing devotional title/body.");
      if (!hasText(day.observationQuestion)) pushIssue(errors, plan, day, "flagship day missing observation question.");
      if (!hasText(day.reflectionQuestion) && !hasText(day.reflectionPrompt)) pushIssue(errors, plan, day, "flagship day missing reflection question.");
      if (!hasText(day.prayer) && !hasText(day.prayerPrompt)) pushIssue(errors, plan, day, "flagship day missing prayer.");
      if (!hasText(day.gentleAction)) pushIssue(errors, plan, day, "flagship day missing gentle action.");
      if (!hasText(day.studyMethod)) pushIssue(errors, plan, day, "flagship day missing study method.");
    }

    if (carePlanIds.has(plan.id) && !hasText(day.careNote)) {
      pushIssue(warnings, plan, day, "care plan day does not include a pastoral care note.");
    }
  }

  if (carePlanIds.has(plan.id) && !hasText(plan.careNote)) {
    pushIssue(warnings, plan, null, "care plan does not include a plan-level pastoral care note.");
  }
}

const seenIds = new Set();
for (const plan of bibleReadingPlans) {
  if (seenIds.has(plan.id)) errors.push(`${plan.id}: duplicate plan id.`);
  seenIds.add(plan.id);
  checkPlan(plan);
}

console.log(`Checked ${bibleReadingPlans.length} Bible reading plans.`);

if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`);
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (errors.length) {
  console.error(`\nErrors (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("No blocking reading-plan issues found.");
}
