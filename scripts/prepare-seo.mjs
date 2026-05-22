import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const publicDir = join(process.cwd(), "public");
const rawSiteUrl = process.env.EXPO_PUBLIC_SITE_URL || process.env.SITE_URL || "";
const normalizedSiteUrl = rawSiteUrl.replace(/\/$/, "");
const siteUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalizedSiteUrl) ? "" : normalizedSiteUrl;
const now = new Date().toISOString();
const seoPages = [
  {
    path: "/about",
    file: "about.html",
    title: "About Bible Study Tutor | Free Bible study for desktop and mobile",
    description: "Bible Study Tutor is a free Bible study app for individuals, small groups, and churches, built around reading Scripture, guided study, journaling, memory verses, and printable worksheets.",
    heading: "Free Bible study for everyday discipleship",
    intro: "Bible Study Tutor helps people draw near to God through Scripture. It works on desktop and mobile, and it is intentionally free so churches, small groups, and individuals can use it without a paywall.",
    sections: [
      ["Built around Scripture", "The app is shaped by James 4:8 and 2 Timothy 3:16: draw near to God, and let Scripture teach, correct, train, and form daily life."],
      ["Digital or pen and paper", "Use guided study tools inside the app, or print Bible study worksheets for people who prefer handwriting, group handouts, or quiet study away from a screen."],
      ["For personal and church use", "Read the Bible, follow study methods, save journal entries, memorize verses, and create simple check-ins for trusted community."]
    ],
    cta: "Open Bible Study Tutor"
  },
  {
    path: "/printable-bible-study-worksheets",
    file: "printable-bible-study-worksheets.html",
    title: "Printable Bible Study Worksheets | Free Bible Study Tutor",
    description: "Create free printable Bible study worksheets from selected Scripture passages using guided methods like SOAP, OIA, Inductive Study, Lectio Divina, READ, and more.",
    heading: "Printable Bible study worksheets",
    intro: "Bible Study Tutor can turn selected verses into clean printable worksheets for personal study, church groups, youth groups, Bible classes, or anyone who prefers pen and paper.",
    sections: [
      ["Choose any passage", "Select verses in the Bible reader or open a passage in Study, then print a worksheet for the selected Scripture."],
      ["Pick a study method", "Worksheets can use guided methods such as SOAP, OIA, Inductive Study, Lectio Divina, READ, and other Scripture study patterns."],
      ["Room to write", "Choose standard or extra writing space, and include optional memory verse and shareable insight sections."]
    ],
    cta: "Start with the Bible reader"
  },
  {
    path: "/bible-study-methods",
    file: "bible-study-methods.html",
    title: "Bible Study Methods | SOAP, OIA, Inductive, Lectio Divina and READ",
    description: "Learn and practise Bible study methods including SOAP, OIA, Inductive Study, Lectio Divina, READ, verse mapping, character study, and prayerful reflection.",
    heading: "Guided Bible study methods",
    intro: "Bible Study Tutor gives structure without making study feel complicated. Choose a method, read the passage, answer one step at a time, and save your study to the journal.",
    sections: [
      ["SOAP and OIA", "Use simple observation, interpretation, application, prayer, and response prompts to slow down and listen carefully to the text."],
      ["Deeper study methods", "Use Inductive Study, verse mapping, character study, word study, and cross-reference study when you want to examine a passage more deeply."],
      ["Reflective methods", "Use Lectio Divina, READ, and prayerful reflection when you want to respond slowly and personally to Scripture."]
    ],
    cta: "Choose a study method"
  },
  {
    path: "/features",
    file: "features.html",
    title: "Bible Study Tutor Features | Read, Study, Journal, Memorize and Print",
    description: "Explore Bible Study Tutor features: Bible reader, Scripture search, guided study, printable worksheets, journal, memory verses, highlights, bookmarks, and community check-ins.",
    heading: "Bible Study Tutor features",
    intro: "Bible Study Tutor brings reading, study, memory, journaling, and simple community rhythms together in one free app.",
    sections: [
      ["Read and search Scripture", "Navigate by book and chapter, search exact words or themes, and send selected verses into Study."],
      ["Save what matters", "Highlight verses, add notes, bookmark passages, save studies to your journal, and return to previous reflections by date or Scripture."],
      ["Memorize and review", "Save memory verses and practise them in three simple steps with blanks, hints, and review dates."]
    ],
    cta: "Open the app"
  }
];

mkdirSync(publicDir, { recursive: true });
copyFileSync(
  join(process.cwd(), "node_modules", "@expo", "vector-icons", "build", "vendor", "react-native-vector-icons", "Fonts", "Ionicons.ttf"),
  join(publicDir, "ionicons.ttf")
);
copyFileSync(join(process.cwd(), "assets", "icon.png"), join(publicDir, "icon.png"));
copyFileSync(join(process.cwd(), "assets", "favicon.png"), join(publicDir, "favicon.png"));
writeFileSync(join(publicDir, "favicon.ico"), pngToIco(readFileSync(join(process.cwd(), "assets", "favicon.png")), 48, 48));

const robots = [
  "User-agent: *",
  "Allow: /",
  siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml` : ""
].filter(Boolean).join("\n") + "\n";

writeFileSync(join(publicDir, "robots.txt"), robots);

seoPages.forEach((page) => {
  writeFileSync(join(publicDir, page.file), buildSeoPage(page, siteUrl));
});

if (siteUrl) {
  const sitemapUrls = [
    { loc: `${siteUrl}/`, priority: "1.0", changefreq: "weekly" },
    ...seoPages.map((page) => ({ loc: `${siteUrl}${page.path}`, priority: "0.8", changefreq: "monthly" }))
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;
  writeFileSync(join(publicDir, "sitemap.xml"), sitemap);
} else {
  rmSync(join(publicDir, "sitemap.xml"), { force: true });
}

function buildSeoPage(page, baseUrl) {
  const canonical = baseUrl ? `${baseUrl}${page.path}` : page.path;
  const appUrl = baseUrl ? `${baseUrl}/` : "/";
  const image = baseUrl ? `${baseUrl}/icon.png` : "/icon.png";
  const sections = page.sections
    .map(([heading, body]) => `<section><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(body)}</p></section>`)
    .join("\n");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.description,
    url: canonical,
    isPartOf: {
      "@type": "WebSite",
      name: "Bible Study Tutor",
      url: appUrl
    },
    about: ["Bible study", "Scripture", "Printable Bible study worksheets", "Bible study methods"]
  };

  return `<!doctype html>
<html lang="en-AU">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/icon.png" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Bible Study Tutor" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    <style>
      :root { color-scheme: light; --ink: #241d19; --muted: #6f665c; --paper: #f8f1e6; --panel: #fffdf8; --line: #e4d6c5; --olive: #39452e; --coral: #c96750; }
      * { box-sizing: border-box; }
      body { background: var(--paper); color: var(--ink); font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; }
      main { margin: 0 auto; max-width: 980px; padding: 48px 20px; }
      nav { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 36px; }
      nav a, .button { align-items: center; background: var(--olive); border-radius: 999px; color: white; display: inline-flex; font-weight: 800; min-height: 42px; padding: 10px 16px; text-decoration: none; }
      nav a { background: transparent; color: var(--olive); padding-left: 0; }
      .hero { background: var(--panel); border: 1px solid var(--line); border-radius: 18px; padding: clamp(24px, 5vw, 46px); }
      .eyebrow { color: var(--coral); font-size: 12px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
      h1 { color: var(--olive); font-size: clamp(34px, 7vw, 64px); line-height: .98; margin: 12px 0 18px; max-width: 780px; }
      .intro { color: var(--ink); font-size: 19px; line-height: 1.65; max-width: 760px; }
      .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin: 28px 0; }
      section { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 20px; }
      h2 { color: var(--olive); font-size: 20px; margin: 0 0 8px; }
      p { color: var(--muted); line-height: 1.65; margin: 0; }
      footer { border-top: 1px solid var(--line); color: var(--muted); display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; margin-top: 42px; padding-top: 18px; }
      footer a { color: var(--olive); font-weight: 800; }
    </style>
  </head>
  <body>
    <main>
      <nav aria-label="Main">
        <a href="/">Open app</a>
        <a href="/about">About</a>
        <a href="/printable-bible-study-worksheets">Worksheets</a>
        <a href="/bible-study-methods">Methods</a>
        <a href="/features">Features</a>
      </nav>
      <div class="hero">
        <div class="eyebrow">Bible Study Tutor</div>
        <h1>${escapeHtml(page.heading)}</h1>
        <p class="intro">${escapeHtml(page.intro)}</p>
      </div>
      <div class="grid">${sections}</div>
      <a class="button" href="${escapeHtml(appUrl)}">${escapeHtml(page.cta)}</a>
      <footer>
        <span>Free Bible study app for desktop, mobile, and printable worksheets.</span>
        <span><a href="/">Bible Study Tutor</a></span>
      </footer>
    </main>
  </body>
</html>
`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function pngToIco(png, width, height) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const directory = Buffer.alloc(16);
  directory.writeUInt8(width === 256 ? 0 : width, 0);
  directory.writeUInt8(height === 256 ? 0 : height, 1);
  directory.writeUInt8(0, 2);
  directory.writeUInt8(0, 3);
  directory.writeUInt16LE(1, 4);
  directory.writeUInt16LE(32, 6);
  directory.writeUInt32LE(png.length, 8);
  directory.writeUInt32LE(header.length + directory.length, 12);

  return Buffer.concat([header, directory, png]);
}
