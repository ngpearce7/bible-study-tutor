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
transpileToCjs("data/bibleReadingPlanTypes.ts", "bibleReadingPlanTypes.cjs");
const plansPath = transpileToCjs("data/bibleReadingPlans.ts", "bibleReadingPlans.cjs", [
  ['"@/data/bibleLibrary"', '"./bibleLibrary.cjs"'],
  ['"@/data/bibleReadingPlanTypes"', '"./bibleReadingPlanTypes.cjs"']
]);
const { bibleReadingPlans } = require(plansPath);
const registry = JSON.parse(fs.readFileSync(path.join(repoRoot, "docs/editorial-reviews.json"), "utf8"));
const reviews = new Map();
for (const item of registry.reviews) {
  const key = `${item.planId}:${item.day}`;
  if (reviews.has(key) || !item.reviewer?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(item.reviewedAt || "") || !item.sources?.length || !item.contentHash) throw new Error(`Incomplete editorial review: ${key}`);
  reviews.set(key, item);
}
const { createHash } = require("node:crypto");
const rows = bibleReadingPlans.flatMap(plan => plan.days.filter(day => day.guidanceKind).map(day => {
  const key = `${plan.id}:${day.day}`;
  const contentHash = createHash("sha256").update(JSON.stringify(day)).digest("hex");
  const review = reviews.get(key);
  reviews.delete(key);
  return { planId: plan.id, day: day.day, reference: day.reference, kind: day.guidanceKind, contentHash, status: review ? review.contentHash === contentHash ? "reviewed" : "changed-since-review" : "pending-human-review" };
}));
if (reviews.size) throw new Error("Editorial registry references missing plan days");
const pending = rows.filter(row => row.status !== "reviewed");
console.log(`Editorial provenance: ${rows.length - pending.length} current human reviews; ${pending.length} pending or changed.`);
if (process.argv.includes("--write-queue")) fs.writeFileSync(path.join(repoRoot, "docs/editorial-queue.json"), JSON.stringify(rows, null, 2) + "\n");
if (process.argv.includes("--require-reviewed") && pending.length) process.exitCode = 1;
fs.rmSync(tempDir, { recursive: true, force: true });
