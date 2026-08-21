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
const generatedSectionGuidancePlanIds = new Set([
  "new-testament-90",
  "bible-365",
  "bible-1-year-chronological",
  "bible-1-year-old-new",
  "bible-6-months",
  "new-testament-1-year",
  "psalms-proverbs-1-year",
  "bible-30",
  "bible-90",
  "bible-overview-60",
  "new-testament-30",
  "psalms-30",
  "proverbs-31",
  "gospels-40",
  "torah-pentateuch-50",
  "old-testament-overview",
  "new-testament-overview"
]);
const exactTextExpectations = {
  "seven-days-new-believers": {
    1: {
      reflectionQuestion: "Which truth about Jesus in this passage most strengthens or challenges your understanding of Him today?"
    },
    3: {
      reflectionQuestion: "When are you tempted to measure God's acceptance by your performance? How do verses 8-9 answer that temptation?"
    },
    4: {
      reflectionQuestion: "Where are you carrying guilt or shame? How does Romans 8:1 direct you to look to Christ?"
    },
    6: {
      prayer: "Father, lead me by Your Spirit today and grow the Spirit's fruit in my life.",
      gentleAction: "Choose one fruit of the Spirit and identify one concrete way it could shape your words or actions today. Ask God to help you respond that way."
    },
    7: {
      prayer: "Lord, guide me toward a faithful Christian community. Help me receive care, grow in truth, and serve others with grace."
    }
  }
};
const sensitivePlanIds = new Set([
  "anxiety-peace",
  "seven-days-peace",
  "fourteen-days-anxiety-trust",
  "grief-comfort",
  "fourteen-days-grief-comfort"
]);
const prayerPlanIds = new Set(["seven-days-prayer", "prayer-dependence", "psalms-prayer", "psalms-30"]);
const oldGenericRhythm = "Read the passage, notice one thing, pray briefly, then mark the day complete when you finish.";
const unresolvedPlaceholderPattern = /\{\{|\}\}|TODO|TBD|FIXME|\[[^\]]*(passage|reference|title|name)[^\]]*\]/i;
const discouragedPhrases = [
  "what part do you need to receive",
  "what part of this description",
  "what accusation needs to hear",
  "where do you need to stop",
  "why have you failed to",
  "what is god telling you",
  "god wants you to know",
  "if you truly trust god",
  "choose one practice of"
];

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

function normalized(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function textFieldsFor(day) {
  return [
    ["context", day.context],
    ["devotional title", day.devotional?.title],
    ["devotional body", day.devotional?.body],
    ["notice", day.observationQuestion],
    ["reflect", day.reflectionQuestion || day.reflectionPrompt],
    ["pray", day.prayer || day.prayerPrompt],
    ["next step", day.gentleAction],
    ["study deeper", day.studyMethod],
    ["care note", day.careNote]
  ].filter(([, value]) => hasText(value));
}

function dayHasGuidedFields(day) {
  return !!(
    day.context ||
    day.devotional ||
    day.observationQuestion ||
    day.reflectionQuestion ||
    day.reflectionPrompt ||
    day.prayer ||
    day.prayerPrompt ||
    day.gentleAction ||
    day.studyMethod ||
    day.careNote
  );
}

function hasCompletePreview(day) {
  return !!(
    hasDevotional(day) &&
    (hasText(day.reflectionQuestion) || hasText(day.reflectionPrompt)) &&
    (hasText(day.prayer) || hasText(day.prayerPrompt))
  );
}

function checkQuestion(collection, plan, day, label, value) {
  if (!hasText(value)) return;
  if (!String(value).trim().endsWith("?")) {
    pushIssue(collection, plan, day, `${label} should be phrased as a question.`);
  }
}

function checkEditorialWarnings(plan, day) {
  const reflect = day.reflectionQuestion || day.reflectionPrompt || "";
  const prayer = day.prayer || day.prayerPrompt || "";
  const notice = day.observationQuestion || "";

  for (const [label, value] of textFieldsFor(day)) {
    if (unresolvedPlaceholderPattern.test(value)) pushIssue(errors, plan, day, `${label} appears to contain an unresolved placeholder.`);
    if (String(value).length > 900) pushIssue(warnings, plan, day, `${label} is long enough to deserve an editorial readability check.`);
    for (const phrase of discouragedPhrases) {
      if (normalized(value).includes(phrase)) {
        pushIssue(warnings, plan, day, `${label} contains wording flagged for editorial review: "${phrase}".`);
      }
    }
  }

  checkQuestion(warnings, plan, day, "Notice", notice);
  checkQuestion(warnings, plan, day, "Reflect", reflect);

  if (hasText(prayer) && String(prayer).trim().endsWith("?")) {
    pushIssue(warnings, plan, day, "prayer appears to be written as a question.");
  }
  if (hasText(reflect) && /\b(lord|father|jesus|spirit|god)\b/i.test(reflect) && !String(reflect).trim().endsWith("?")) {
    pushIssue(warnings, plan, day, "reflect field may contain prayer-like wording.");
  }
  if (hasText(prayer) && /^(what|where|when|which|how|why)\b/i.test(String(prayer).trim())) {
    pushIssue(warnings, plan, day, "prayer may contain a reflection question.");
  }
  if (hasText(reflect) && hasText(notice) && normalized(reflect) === normalized(notice)) {
    pushIssue(errors, plan, day, "reflect question duplicates notice question.");
  }
  if (!generatedSectionGuidancePlanIds.has(plan.id) && hasText(reflect) && /^(what does|what do|list|which words|what events|what actions)\b/i.test(String(reflect).trim())) {
    pushIssue(warnings, plan, day, "reflect question may be asking observation rather than personal reflection.");
  }
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
  const reflectTexts = new Map();
  const prayerTexts = new Map();
  let guidedDayCount = 0;
  let completePreviewDayCount = 0;
  const usesGeneratedSectionGuidance = generatedSectionGuidancePlanIds.has(plan.id);
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

    if (dayHasGuidedFields(day)) {
      guidedDayCount += 1;
      if (hasCompletePreview(day)) completePreviewDayCount += 1;
      if (day.devotional && !hasDevotional(day)) pushIssue(errors, plan, day, "has incomplete devotional title/body.");
      if (hasDevotional(day) && !hasText(day.reflectionQuestion) && !hasText(day.reflectionPrompt)) pushIssue(errors, plan, day, "devotional day missing reflection question.");
      if (hasDevotional(day) && !hasText(day.prayer) && !hasText(day.prayerPrompt)) pushIssue(errors, plan, day, "devotional day missing prayer.");
      checkEditorialWarnings(plan, day);
    }

    const reflectText = normalized(day.reflectionQuestion || day.reflectionPrompt);
    if (reflectText && !usesGeneratedSectionGuidance) {
      if (reflectTexts.has(reflectText)) pushIssue(warnings, plan, day, `reflect text duplicates day ${reflectTexts.get(reflectText)}.`);
      reflectTexts.set(reflectText, day.day);
    }
    const prayerText = normalized(day.prayer || day.prayerPrompt);
    if (prayerText && !usesGeneratedSectionGuidance) {
      if (prayerTexts.has(prayerText)) pushIssue(warnings, plan, day, `prayer text duplicates day ${prayerTexts.get(prayerText)}.`);
      prayerTexts.set(prayerText, day.day);
    }

    const expected = exactTextExpectations[plan.id]?.[day.day];
    if (expected) {
      for (const [field, expectedText] of Object.entries(expected)) {
        if (day[field] !== expectedText) pushIssue(errors, plan, day, `${field} does not match the approved wording.`);
      }
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

  if (guidedDayCount > 0 && completePreviewDayCount === 0) {
    pushIssue(errors, plan, null, "has devotional material but no complete day suitable for plan preview.");
  }
  if (plan.rhythm === oldGenericRhythm) {
    pushIssue(errors, plan, null, "uses outdated generic rhythm copy.");
  }
  if (carePlanIds.has(plan.id) && !hasText(plan.careNote)) {
    pushIssue(warnings, plan, null, "care plan does not include a plan-level pastoral care note.");
  }
  if (sensitivePlanIds.has(plan.id) && !hasText(plan.careNote) && plan.days.some((day) => !hasText(day.careNote))) {
    pushIssue(warnings, plan, null, "sensitive pastoral-care plan should include a plan-level or day-level care note.");
  }
  if (prayerPlanIds.has(plan.id)) {
    const prayerText = normalized(plan.days.map((day) => day.prayer || day.prayerPrompt || "").join(" "));
    const rangeWords = ["praise", "thank", "confess", "lament", "depend", "trust", "will"];
    const found = rangeWords.filter((word) => prayerText.includes(word)).length;
    if (found < 3) pushIssue(warnings, plan, null, "prayer-focused plan may need a broader range of prayer language.");
  }
}

const seenIds = new Set();
const devotionalBodiesByText = new Map();
for (const plan of bibleReadingPlans) {
  if (seenIds.has(plan.id)) errors.push(`${plan.id}: duplicate plan id.`);
  seenIds.add(plan.id);
  checkPlan(plan);
  for (const day of plan.days) {
    if (generatedSectionGuidancePlanIds.has(plan.id)) continue;
    const body = normalized(day.devotional?.body);
    if (!body || body.length < 80) continue;
    const existing = devotionalBodiesByText.get(body);
    if (existing && existing.planId !== plan.id) {
      pushIssue(warnings, plan, day, `devotional body matches ${existing.planId} day ${existing.day}.`);
    } else {
      devotionalBodiesByText.set(body, { planId: plan.id, day: day.day });
    }
  }
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
