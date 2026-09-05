import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { extname, join, relative, sep } from "node:path";

const root = process.cwd();
const distDir = join(root, "dist");
const mainBundleBudget = 500_000;
const totalJavaScriptBudget = 860_000;

assert(existsSync(distDir), "dist is missing; run npm run web:export first");

const files = walk(distDir);
const htmlFiles = files.filter((file) => extname(file) === ".html");
const jsFiles = files.filter((file) => extname(file) === ".js");
const entryFiles = jsFiles.filter((file) => /[/\\]entry-[^/\\]+\.js$/.test(file));
assert(entryFiles.length === 1, `expected one web entry bundle, found ${entryFiles.length}`);

const bundleRows = jsFiles.map((file) => {
  const source = readFileSync(file);
  return { file, raw: source.length, gzip: gzipSync(source).length };
});
const mainBundle = bundleRows.find((row) => row.file === entryFiles[0]);
const readingPlanBundles = bundleRows.filter((row) => /[/\\]bibleReadingPlans-[^/\\]+\.js$/.test(row.file));
const webVitalsBundles = bundleRows.filter((row) => /[/\\]webVitals-[^/\\]+\.js$/.test(row.file));
const totalGzip = bundleRows.reduce((total, row) => total + row.gzip, 0);

assert(mainBundle.gzip <= mainBundleBudget, `main bundle is ${formatBytes(mainBundle.gzip)} gzip; budget is ${formatBytes(mainBundleBudget)}`);
assert(totalGzip <= totalJavaScriptBudget, `all JavaScript is ${formatBytes(totalGzip)} gzip; budget is ${formatBytes(totalJavaScriptBudget)}`);
assert(readingPlanBundles.length === 1, `expected one lazy reading-plan bundle, found ${readingPlanBundles.length}`);
assert(webVitalsBundles.length === 1, `expected one lazy web-vitals bundle, found ${webVitalsBundles.length}`);
assert(!readFileSync(mainBundle.file, "utf8").includes("Old and New Testament Daily Pairing"), "the reading-plan corpus leaked into the entry bundle");
assert(readFileSync(readingPlanBundles[0].file, "utf8").includes("Old and New Testament Daily Pairing"), "the lazy reading-plan bundle is missing its corpus");
assert(!files.some((file) => file.endsWith(".map")), "production export contains source maps");

const knownRoutes = new Set(["/"]);
for (const file of htmlFiles) {
  let route = `/${relative(distDir, file).split(sep).join("/").replace(/\.html$/, "")}`;
  if (route === "/index") route = "/";
  knownRoutes.add(route);
}

let linkCount = 0;
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]));
  for (const match of html.matchAll(/\bhref=["']([^"']+)["']/g)) {
    const href = match[1];
    if (/^(https?:|mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    const [pathWithQuery, fragment] = href.split("#");
    if (!pathWithQuery) {
      if (fragment) assert(ids.has(fragment), `${relative(distDir, file)} has a missing fragment target: ${href}`);
      continue;
    }
    if (!pathWithQuery.startsWith("/")) continue;
    const path = pathWithQuery.split("?")[0].replace(/\/$/, "") || "/";
    if (path.startsWith("/_expo/") || /\.(?:css|ico|js|json|png|svg|ttf|webmanifest|xml)$/i.test(path)) continue;
    const cleanPath = path.replace(/\.html$/, "");
    assert(knownRoutes.has(path) || knownRoutes.has(cleanPath), `${relative(distDir, file)} links to a missing route: ${href}`);
    linkCount += 1;
  }
}

const headers = readFileSync(join(root, "public", "_headers"), "utf8");
assert(headers.includes("/_expo/static/*") && immutableRuleFor(headers, "/_expo/static/*"), "hashed Expo assets need an immutable cache rule");
assert(headers.includes("/cross-references/*") && immutableRuleFor(headers, "/cross-references/*"), "cross-reference assets need an immutable cache rule");

const layout = readFileSync(join(root, "app", "_layout.tsx"), "utf8");
const app = readFileSync(join(root, "app", "index.tsx"), "utf8");
const ui = readFileSync(join(root, "components", "ui.tsx"), "utf8");
const passageSource = readFileSync(join(root, "data", "biblePassage.ts"), "utf8");
const searchSource = readFileSync(join(root, "data", "bibleSearch.ts"), "utf8");
const contextSource = readFileSync(join(root, "data", "studyContext.ts"), "utf8");
assert(!app.includes("Ionicons.loadFont("), "Ionicons.loadFont reintroduces the hashed font request");
assert(!layout.includes("font-display: block"), "icon fonts must not block text rendering");
assert(layout.includes("font-display: swap"), "icon font swap behavior is missing");
assert(passageSource.includes("fetchWithTimeout("), "Bible passage requests need a timeout");
assert(searchSource.includes("fetchWithTimeout(") && searchSource.includes("signal?: AbortSignal"), "Bible search needs timeout and cancellation support");
assert(app.includes("runBibleSearch(overrides: BibleSearchCriteriaOverrides = {})"), "Bible search filters need criteria-aware refresh support");
assert(app.includes("runBibleSearch({ scope: normalized, book: nextBook })"), "Changing Bible search scope should refresh active results");
assert(app.includes("runBibleSearch({ mode: normalized })"), "Changing Bible search mode should refresh active results");
assert(app.includes("runBibleSearch({ book: normalized })"), "Changing Bible search book should refresh active results");
assert(app.includes("runBibleSearch({ translationId: normalizedTranslation })"), "Changing Bible translation should refresh active search results");
assert(contextSource.includes("CROSS_REFERENCE_ASSET_VERSION") && contextSource.includes("?v=${CROSS_REFERENCE_ASSET_VERSION}"), "cross-reference requests need a cache-busting version");

const coral = capture(ui, /coral:\s*["'](#[0-9a-f]{6})["']/i, "design-system coral colour");
const primaryContrast = contrastRatio(coral, "#ffffff");
assert(primaryContrast >= 4.5, `primary button contrast is ${primaryContrast.toFixed(2)}:1; expected at least 4.5:1`);

console.log(`Validated ${htmlFiles.length} HTML files and ${linkCount} internal links.`);
console.log(`Main bundle: ${formatBytes(mainBundle.gzip)} gzip / ${formatBytes(mainBundle.raw)} raw.`);
console.log(`All JavaScript: ${formatBytes(totalGzip)} gzip across ${jsFiles.length} files.`);
console.log(`Reading-plan chunk: ${formatBytes(readingPlanBundles[0].gzip)} gzip; loaded only when needed.`);
console.log(`Primary button contrast: ${primaryContrast.toFixed(2)}:1.`);

function walk(directory, output = []) {
  for (const name of readdirSync(directory)) {
    const file = join(directory, name);
    if (statSync(file).isDirectory()) walk(file, output);
    else output.push(file);
  }
  return output;
}

function immutableRuleFor(headers, route) {
  const section = headers.split(/\n(?=\/)/).find((value) => value.trimStart().startsWith(route));
  return !!section && /max-age=31536000, immutable/.test(section);
}

function capture(value, pattern, label) {
  const match = value.match(pattern);
  assert(match?.[1], `${label} is missing`);
  return match[1];
}

function contrastRatio(first, second) {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

function luminance(hex) {
  const channels = hex.match(/[0-9a-f]{2}/gi).map((value) => Number.parseInt(value, 16) / 255);
  const [red, green, blue] = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function formatBytes(value) {
  return `${Math.round(value / 1024)} KiB`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
