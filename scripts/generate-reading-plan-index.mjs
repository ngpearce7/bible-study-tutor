import { build } from "esbuild";
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const { outputFiles } = await build({
  entryPoints: [join(root, "data", "bibleReadingPlans.ts")],
  absWorkingDir: root,
  alias: { "@": root },
  bundle: true,
  format: "cjs",
  platform: "node",
  write: false,
  logLevel: "silent"
});
const compiled = outputFiles[0]?.text;
if (!compiled) throw new Error("Could not compile the reading-plan library");
const compiledModule = { exports: {} };
new Function("require", "module", "exports", compiled)(createRequire(import.meta.url), compiledModule, compiledModule.exports);

const plans = compiledModule.exports.bibleReadingPlans;
if (!Array.isArray(plans) || !plans.length) throw new Error("Reading-plan library is empty");
const compactPlans = plans.map(({ days, ...metadata }) => ({
  ...metadata,
  days: days.map(({ title, reference, readerBook, readerChapter, studyReference }) =>
    [title, reference, readerBook, readerChapter, studyReference])
}));
const output = { version: 1, plans: compactPlans };
writeFileSync(join(root, "public", "bible-reading-plan-index.json"), `${JSON.stringify(output)}\n`);
console.log(`Generated reading-plan index for ${plans.length} plans.`);
