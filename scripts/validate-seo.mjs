import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const publicDir = join(root, "public");
const siteOrigin = "https://biblestudytutor.org";
const sitemap = readFileSync(join(publicDir, "sitemap.xml"), "utf8");
const redirects = readFileSync(join(publicDir, "_redirects"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const sitemapPaths = new Set(sitemapUrls.map((value) => new URL(value).pathname));
const seoPaths = [...sitemapPaths].filter((path) => path !== "/");
const seoFiles = seoPaths.map((path) => ({ path, file: join(publicDir, `${path.slice(1)}.html`) }));

for (const { path, file } of seoFiles) {
  assert(existsSync(file), `${path}: generated HTML is missing`);
}

const pages = seoFiles.map(({ path, file }) => ({ path, file, html: readFileSync(file, "utf8") }));
const titles = new Map();
const descriptions = new Map();

for (const page of pages) {
  const title = capture(page.html, /<title>([^<]+)<\/title>/, `${page.path}: title`);
  const description = capture(page.html, /<meta name="description" content="([^"]+)"/, `${page.path}: description`);
  const canonical = capture(page.html, /<link rel="canonical" href="([^"]+)"/, `${page.path}: canonical`);
  const ogUrl = capture(page.html, /<meta property="og:url" content="([^"]+)"/, `${page.path}: og:url`);
  assert(canonical === `${siteOrigin}${page.path}`, `${page.path}: canonical does not match the clean production route`);
  assert(ogUrl === canonical, `${page.path}: og:url does not match canonical`);
  assert(!titles.has(title), `${page.path}: duplicate title also used by ${titles.get(title)}`);
  assert(!descriptions.has(description), `${page.path}: duplicate description also used by ${descriptions.get(description)}`);
  titles.set(title, page.path);
  descriptions.set(description, page.path);
  validateInternalLinks(page, sitemapPaths);
  assert(page.html.includes('href="/study-examples"'), `${page.path}: study examples navigation link is missing`);
}

const worksheetPath = "/printable-bible-word-study-worksheet";
const worksheet = pageFor(worksheetPath);
assert(count(sitemap, `<loc>${siteOrigin}${worksheetPath}</loc>`) === 1, "word-study worksheet must appear in the sitemap exactly once");
assert(redirects.includes(`${worksheetPath}.html ${worksheetPath} 301`), "word-study worksheet .html redirect is missing");
assert(worksheet.html.includes("Printable Bible Word Study Worksheet | Free Study Guide"), "word-study worksheet metadata title is missing");
assert(count(worksheet.html, 'class="worksheet-section"') === 8, "word-study worksheet must contain eight printable sections");
assert(worksheet.html.includes('onclick="window.print()"'), "word-study worksheet print control is missing");
assert(worksheet.html.includes("@media print"), "word-study worksheet print styles are missing");

const churches = pageFor("/bible-study-app-for-churches");
assert(churches.html.includes("A 30–45 minute small-group session"), "churches page session plan is missing");
assert(churches.html.includes("15-minute leader setup"), "churches page leader checklist is missing");
assert(churches.html.includes("Printable leader session sheet"), "churches page printable leader sheet is missing");
assert(churches.html.includes("not a church management system"), "churches page product boundaries are missing");

for (const page of [worksheet, churches]) validateVisibleFaqSchema(page);

const requiredInboundLinks = [
  "/bible-study-methods/word-study",
  "/printable-bible-study-worksheets",
  "/bible-study-methods",
  "/bible-study-methods/oia",
  "/bible-study-methods/verse-mapping",
  "/bible-study-app-for-churches"
];
for (const sourcePath of requiredInboundLinks) {
  assert(pageFor(sourcePath).html.includes(`href="${worksheetPath}"`), `${sourcePath}: missing link to the word-study worksheet`);
}

for (const page of pages) {
  assert(!page.html.includes("method=word-study"), `${page.path}: unsupported word-study app deep link remains`);
}

console.log(`Validated ${pages.length} SEO pages, ${sitemapUrls.length} sitemap URLs, internal links, worksheet coverage, and visible FAQ schema.`);

function pageFor(path) {
  const page = pages.find((candidate) => candidate.path === path);
  assert(page, `${path}: page is not present in the sitemap`);
  return page;
}

function validateInternalLinks(page, knownPaths) {
  const hrefs = [...page.html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map((match) => match[1]);
  for (const href of hrefs) {
    if (href.startsWith("#")) {
      assert(page.html.includes(`id="${href.slice(1)}"`), `${page.path}: fragment target is missing: ${href}`);
      continue;
    }
    if (href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    const url = new URL(href, siteOrigin);
    if (url.origin !== siteOrigin) continue;
    assert(knownPaths.has(url.pathname), `${page.path}: internal link target is not in the sitemap: ${href}`);
  }
}

function validateVisibleFaqSchema(page) {
  const jsonLdText = capture(page.html, /<script type="application\/ld\+json">(.*?)<\/script>/s, `${page.path}: JSON-LD`);
  const jsonLd = JSON.parse(jsonLdText);
  const graph = Array.isArray(jsonLd["@graph"]) ? jsonLd["@graph"] : [jsonLd];
  const faq = graph.find((item) => item["@type"] === "FAQPage");
  assert(faq?.mainEntity?.length, `${page.path}: FAQPage schema is missing`);
  for (const item of faq.mainEntity) {
    assert(page.html.includes(escapeHtml(item.name)), `${page.path}: structured FAQ question is not visible: ${item.name}`);
    assert(page.html.includes(escapeHtml(item.acceptedAnswer?.text || "")), `${page.path}: structured FAQ answer is not visible: ${item.name}`);
  }
}

function capture(value, pattern, label) {
  const match = value.match(pattern);
  assert(match?.[1], `${label} is missing`);
  return match[1];
}

function count(value, needle) {
  return value.split(needle).length - 1;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Validate the published lesson rather than relying on headings or word counts alone.
const { studyPages, studyLessons, scriptureExcerpts, scriptureEmphasis, buildStudyLesson, buildPracticeWorksheet } = await import("./seo/study-content.mjs");
const publicTabs = new Set(["home", "study", "bible", "plans", "methods", "memory", "help"]);
const appMethods = new Set([...readFileSync(join(root, "data", "methods.ts"), "utf8").matchAll(/^    id: "([^"]+)"/gm)].map((match) => match[1]));
assert(appMethods.size > 0, "No guided study methods found in the app");
for (const page of pages) {
  for (const match of page.html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
    const href = match[1].replaceAll("&amp;", "&");
    const url = new URL(href, siteOrigin);
    if (url.origin !== siteOrigin || url.pathname !== "/") continue;
    const tab = url.searchParams.get("tab");
    const method = url.searchParams.get("method");
    const passage = url.searchParams.get("passage");
    if (tab) assert(publicTabs.has(tab), `${page.path}: app link opens a tab that public links cannot select: ${href}`);
    if (method) assert(appMethods.has(method), `${page.path}: app link names an unavailable guided method: ${href}`);
    if (passage && tab === "study" && studyPages[page.path]) {
      const workedReference = studyLessons[studyPages[page.path].lesson].reference;
      assert(passage === workedReference, `${page.path}: app link opens ${passage} but the worked example uses ${workedReference}`);
    }
    if (url.searchParams.get("print") === "worksheet") {
      assert(tab === "study" && method && passage, `${page.path}: printable worksheet link needs a study method and passage`);
    }
  }
}
const informationalPaths = new Set(["/about", "/how-it-works", "/pricing", "/faq", "/features", "/study-examples", "/bible-study-methods/compare"]);
const comparison = pageFor("/bible-study-methods/compare");
assert(count(comparison.html, 'class="method-card"') === 7, "method comparison must show all seven guided methods without JavaScript");
assert(count(comparison.html, '<button type="button" class="method-filter') === 7, "method comparison must include seven goal filters");
assert(comparison.html.includes('id="method-table-heading"'), "method comparison table is missing");
assert(comparison.html.includes('id="method-example-heading"'), "same-passage comparison is missing");
assert(pageFor("/bible-study-methods").html.includes('href="/bible-study-methods/compare"'), "methods index must link to comparison");
for (const method of ["read", "oia", "soap", "lectio", "hear", "coma", "inductive"]) {
  assert(comparison.html.includes(`id="method-${method}"`), `method comparison is missing ${method}`);
  assert(comparison.html.includes(`href="/?tab=study&amp;method=${method}"`), `method comparison must open ${method} in the app`);
}
validateVisibleFaqSchema(comparison);
const examplesDirectory = pageFor("/study-examples");
for (const path of Object.keys(studyPages)) {
  assert(examplesDirectory.html.includes(`href="${path}#study-example"`), `${path}: missing from the study examples directory`);
  assert(pageFor(path).html.includes('id="study-example"'), `${path}: worked study anchor is missing`);
}
const featuredExamples = [
  ["/how-to-study-psalms", "Psalm 23:1-6", "lectio"],
  ["/how-to-study-philippians", "Philippians 4:4-9", "soap"],
  ["/how-to-study-james", "James 1:2-8", "oia"]
];
for (const [path, reference, method] of featuredExamples) {
  const page = pageFor(path);
  assert(studyLessons[studyPages[path].lesson].reference === reference, `${path}: worked example must match the invited passage`);
  const href = `${siteOrigin}/?tab=study&amp;method=${method}&amp;passage=${encodeURIComponent(reference)}`;
  assert(page.html.includes(`href="${href}"`), `${path}: guided study must open the matching passage and method`);
  assert(page.html.includes(`href="${href}&amp;print=worksheet"`), `${path}: printable study must use the matching passage and method`);
  const lessonHtml = page.html.slice(page.html.indexOf('id="study-example"'));
  assert(lessonHtml.indexOf('class="example-next-step"') > lessonHtml.indexOf('class="journal-scripture"'), `${path}: invitation must follow the passage`);
  assert(lessonHtml.indexOf('class="example-next-step"') < lessonHtml.indexOf('class="journal-notes"'), `${path}: invitation must precede the worked answers`);
}
const translationsUsed = new Set();
for (const page of pages) {
  if (informationalPaths.has(page.path) || page.path === "/bible-study-app-for-churches") continue;
  const guide = studyPages[page.path];
  assert(guide, `${page.path}: missing reviewed study guide`);
  if (buildPracticeWorksheet(page.path)) {
    assert(page.html.includes('onclick="window.print()"'), `${page.path}: printable practice sheet is missing`);
    assert(page.html.includes('class="worksheet-section"'), `${page.path}: blank worksheet sections are missing`);
  }
  const lesson = studyLessons[guide.lesson];
  const excerpt = scriptureExcerpts[guide.lesson];
  assert(lesson && excerpt, `${page.path}: missing lesson or verified Scripture`);
  const annotations = scriptureEmphasis[guide.lesson];
  assert(annotations?.some(([, , kind]) => kind === "mark") && annotations.some(([, , kind]) => kind === "underline"), `${page.path}: key Scripture emphasis is missing`);
  const renderedScripture = buildStudyLesson(page.path).scriptureHtml;
  assert(page.html.includes(renderedScripture), `${page.path}: annotated Scripture is not visible`);
  translationsUsed.add(lesson.translation);
  assert(lesson.reference === excerpt.reference && lesson.translation === excerpt.translation, `${page.path}: quotation attribution mismatch`);
  assert(count(page.html, 'class="extra-block journal-example study-lesson"') === 1, `${page.path}: expected one substantive study`);
  const plainScripture = renderedScripture.replace(/<\/?(?:mark|span)(?: [^>]*)?>/g, "");
  for (const verse of excerpt.verses) {
    assert(plainScripture.includes(escapeHtml(verse.text)), `${page.path}: verse ${verse.verse} differs from verified source`);
  }
  for (const field of ["context", "observation", "meaning", "application", "caution", "prayer"]) {
    for (const paragraph of lesson[field].split("\n\n")) assert(page.html.includes(escapeHtml(paragraph)), `${page.path}: missing ${field}`);
  }
  assert(page.html.includes(escapeHtml(guide.practice)), `${page.path}: missing page-specific exercise`);
  assert(page.html.includes(`href="${escapeHtml(excerpt.sourceUrl)}"`), `${page.path}: missing quotation source`);
  assert(page.html.indexOf('class="extra-block journal-example study-lesson"') < page.html.indexOf('class="cta-section"'), `${page.path}: study must precede promotion`);
}
assert(translationsUsed.size === 3 && ["BSB", "WEB", "KJV"].every(id => translationsUsed.has(id)), "Study pages must include each app translation");
console.log(`Verified ${Object.keys(studyPages).length} substantive study pages using BSB, WEB, and KJV, plus the reviewed churches study.`);
