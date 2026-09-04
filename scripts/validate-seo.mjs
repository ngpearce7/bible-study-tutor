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
