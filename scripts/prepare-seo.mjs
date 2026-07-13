import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const publicDir = join(process.cwd(), "public");
const productionSiteUrl = "https://biblestudytutor.org";
const rawSiteUrl = process.env.EXPO_PUBLIC_SITE_URL || process.env.SITE_URL || "";
const normalizedSiteUrl = rawSiteUrl.replace(/\/$/, "");
const siteUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalizedSiteUrl) ? productionSiteUrl : normalizedSiteUrl || productionSiteUrl;
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
      ["For personal and church use", "Read the Bible, follow study methods, save journal entries, memorize verses, and share private encouragements with trusted friends or circles."]
    ],
    cta: "Open Bible Study Tutor",
    related: ["/free-bible-study-app", "/features", "/bible-study-app-for-churches"]
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
    cta: "Start with the Bible reader",
    related: ["/bible-study-methods", "/bible-study-for-small-groups", "/bible-study-for-beginners"]
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
    cta: "Choose a study method",
    related: ["/printable-bible-study-worksheets", "/bible-study-for-beginners", "/online-bible-study-journal"]
  },
  {
    path: "/features",
    file: "features.html",
    title: "Bible Study Tutor Features | Read, Study, Journal, Memorize and Print",
    description: "Explore Bible Study Tutor features: Bible reader, Scripture search, guided study, printable worksheets, journal, memory verses, highlights, bookmarks, and private encouragements.",
    heading: "Bible Study Tutor features",
    intro: "Bible Study Tutor brings reading, study, memory, journaling, and simple community rhythms together in one free app.",
    sections: [
      ["Read and search Scripture", "Navigate by book and chapter, search exact words or themes, and send selected verses into Study."],
      ["Save what matters", "Highlight verses, add notes, bookmark passages, save studies to your journal, and return to previous reflections by date or Scripture."],
      ["Memorize and review", "Save memory verses and practise them in three simple steps with blanks, hints, and review dates."]
    ],
    cta: "Open the app",
    related: ["/bible-memory-verses", "/online-bible-study-journal", "/bible-highlighting-and-notes"]
  },
  {
    path: "/free-bible-study-app",
    file: "free-bible-study-app.html",
    title: "Free Bible Study App | Bible Study Tutor for Desktop and Mobile",
    description: "Use Bible Study Tutor as a free Bible study app for reading Scripture, guided study, journaling, memory verses, printable worksheets, and private encouragements.",
    heading: "A free Bible study app for desktop and mobile",
    intro: "Bible Study Tutor is designed to stay free and accessible for everyday believers, churches, Bible study groups, and anyone who wants a simple place to read, study, remember, and respond to Scripture.",
    sections: [
      ["No paywall for core study", "Read Scripture, use guided study methods, save notes, create journal entries, review memory verses, and print worksheets without needing a paid subscription."],
      ["Works where people study", "Use the app on a desktop at a desk, on a phone during the day, or with printed worksheets when pen and paper is the better fit."],
      ["Built for steady habits", "Daily rhythm, memory review, bookmarks, notes, and journal history help users keep returning to Scripture without turning study into a complicated system."]
    ],
    cta: "Start studying free",
    related: ["/about", "/features", "/bible-study-for-beginners"]
  },
  {
    path: "/bible-study-for-beginners",
    file: "bible-study-for-beginners.html",
    title: "Bible Study for Beginners | Simple Guided Scripture Study",
    description: "Start Bible study with simple guided steps, clear prompts, Scripture reading, notes, journaling, and printable worksheets for beginners.",
    heading: "Bible study for beginners",
    intro: "Bible Study Tutor helps new Bible readers slow down and understand a passage one step at a time, without needing to know where to begin.",
    sections: [
      ["Start with a passage", "Open a chapter, select a few verses, and send them into Study so the app can guide you through the passage."],
      ["Use clear prompts", "Methods such as SOAP, OIA, and READ ask simple questions about what you notice, what the passage means, and how to respond."],
      ["Keep a record", "Save studies to your journal so your understanding, prayers, and next steps are easy to revisit later."]
    ],
    cta: "Open guided study",
    related: ["/bible-study-methods", "/printable-bible-study-worksheets", "/online-bible-study-journal"]
  },
  {
    path: "/online-bible-study-journal",
    file: "online-bible-study-journal.html",
    title: "Online Bible Study Journal | Save Scripture Notes and Reflections",
    description: "Keep an online Bible study journal with saved studies, Scripture notes, meditations, highlights, bookmarks, pinned entries, filters, and calendar views.",
    heading: "Online Bible study journal",
    intro: "Bible Study Tutor keeps your study notes, reflections, meditations, highlights, and saved Scripture work together so your journal becomes a useful record of growth.",
    sections: [
      ["Save studies and drafts", "Guided studies can be saved as completed entries or kept as drafts while you continue working through a passage."],
      ["Find entries later", "Filter journal entries by status, date, Scripture book and chapter, pinned entries, meditations, highlights, and study notes."],
      ["Connect study with prayer", "Use the journal to record what you noticed, how Scripture corrected or encouraged you, and how you want to respond."]
    ],
    cta: "Open the journal",
    related: ["/bible-study-methods", "/bible-highlighting-and-notes", "/bible-memory-verses"]
  },
  {
    path: "/bible-memory-verses",
    file: "bible-memory-verses.html",
    title: "Bible Memory Verses | Save, Review and Memorize Scripture",
    description: "Save Bible memory verses, review them in three steps, use hints, group verses into collections, and print memory cards to carry Scripture with you.",
    heading: "Bible memory verses with review and reflection",
    intro: "Bible Study Tutor helps users save favourite verses, review them over time, practise fill-in-the-blank recall, meditate on Scripture, and carry printed memory cards.",
    sections: [
      ["Three-step review", "Read the verse, practise with some words hidden, then recall the verse with all words blanked out."],
      ["Review at your pace", "Set review dates from daily to annual rhythms, sort due and reviewed verses, and group passages into collections."],
      ["Carry Scripture with you", "Print memory cards for selected saved verses so Scripture can be placed around the home, kept in a Bible, or shared with a group."]
    ],
    cta: "Open memory verses",
    related: ["/scripture-memorization-app", "/printable-bible-memory-cards", "/features"]
  },
  {
    path: "/scripture-memorization-app",
    file: "scripture-memorization-app.html",
    title: "Scripture Memorization App | Practice Verses with Blanks and Hints",
    description: "Use a Scripture memorization app with fill-in-the-blank practice, hints, review schedules, collections, meditation mode, and memory history.",
    heading: "Scripture memorization with blanks, hints, and review",
    intro: "Bible Study Tutor makes memorization practical by combining saved verses, typed recall, gentle hints, review scheduling, meditation prompts, and memory history.",
    sections: [
      ["Practise actively", "Instead of only rereading, users type missing words and receive clear feedback as they remember each verse."],
      ["Use helpful hints", "Hints can reveal more of a difficult word when needed, while still encouraging users to recall the verse for themselves."],
      ["Track progress", "Memory history and milestones show recent reviews, rhythms, added verses, and verses worth revisiting."]
    ],
    cta: "Try memory practice",
    related: ["/bible-memory-verses", "/printable-bible-memory-cards", "/bible-study-for-beginners"]
  },
  {
    path: "/printable-bible-memory-cards",
    file: "printable-bible-memory-cards.html",
    title: "Printable Bible Memory Cards | Free Scripture Memory Cards",
    description: "Create printable Bible memory cards from saved verses, choose selected verses or collections, and print copies for home, church, groups, or personal review.",
    heading: "Printable Bible memory cards",
    intro: "Bible Study Tutor can turn saved memory verses into printable cards so Scripture can move beyond the screen and stay close through the day.",
    sections: [
      ["Choose saved verses", "Print due verses, reviewed verses, a current filtered list, a collection, or a custom selection of saved memory verses."],
      ["Print more than one copy", "Choose how many copies to print when preparing cards for personal use, family, a Bible study group, or a church class."],
      ["Keep cards simple", "Cards focus on the Scripture reference and verse text, with a clean footer and room for practical use."]
    ],
    cta: "Print memory cards",
    related: ["/bible-memory-verses", "/scripture-memorization-app", "/printable-bible-study-worksheets"]
  },
  {
    path: "/bible-highlighting-and-notes",
    file: "bible-highlighting-and-notes.html",
    title: "Bible Highlighting and Notes | Mark Up Scripture and Save Reflections",
    description: "Highlight Bible verses, add notes, bookmark passages, save marked Scripture to your journal, and return to important reflections later.",
    heading: "Bible highlighting, bookmarks, and notes",
    intro: "Bible Study Tutor lets users mark Scripture as they read, save important passages, add notes, and carry those reflections into study, memory, or the journal.",
    sections: [
      ["Highlight selected verses", "Select one or more verses and mark them with colour categories that help you notice truth, questions, application, and key ideas."],
      ["Bookmark and note passages", "Save passages you want to revisit and add notes directly from the Bible reader without losing your place."],
      ["Send verses into study", "Selected passages can become a guided study, a printable worksheet, or a saved memory verse."]
    ],
    cta: "Open the Bible reader",
    related: ["/online-bible-study-journal", "/features", "/bible-study-methods"]
  },
  {
    path: "/bible-study-for-small-groups",
    file: "bible-study-for-small-groups.html",
    title: "Bible Study for Small Groups | Worksheets, Methods and Private Encouragement",
    description: "Use Bible Study Tutor for small groups with printable worksheets, guided study methods, private circles, encouragements, memory verses, and shared Scripture reflection.",
    heading: "Bible study tools for small groups",
    intro: "Bible Study Tutor can support small groups with printable worksheets, shared study rhythms, private encouragement, memory verses, and simple Scripture-centred structure.",
    sections: [
      ["Prepare group worksheets", "Print selected passages with guided questions so people can study with pen and paper before or during a group meeting."],
      ["Keep sharing private", "Friends and circles are designed for trusted encouragement rather than public social media feeds."],
      ["Use shared methods", "Group members can use the same study method, passage, or memory collection while keeping their own notes and journal."]
    ],
    cta: "Prepare a group study",
    related: ["/printable-bible-study-worksheets", "/bible-study-app-for-churches", "/bible-study-methods"]
  },
  {
    path: "/bible-study-app-for-churches",
    file: "bible-study-app-for-churches.html",
    title: "Bible Study App for Churches | Free Scripture Tools for Discipleship",
    description: "A free Bible study app churches can use for Scripture reading, study methods, printable worksheets, memory verses, journaling, and private encouragement.",
    heading: "A free Bible study app for churches",
    intro: "Bible Study Tutor is built to serve the church by keeping Scripture study free, practical, and accessible on desktop, mobile, and paper.",
    sections: [
      ["No paid barrier", "The core app is intended to remain free so churches can recommend it without asking people to pay for basic Bible study tools."],
      ["Useful in different settings", "Use it for personal discipleship, small groups, youth groups, Bible classes, sermon follow-up, or printed study sheets."],
      ["Careful community design", "Private encouragements, friends, and circles are designed to support real relationships without becoming another social feed."]
    ],
    cta: "Open Bible Study Tutor",
    related: ["/free-bible-study-app", "/bible-study-for-small-groups", "/about"]
  }
];

mkdirSync(publicDir, { recursive: true });
copyFileSync(
  join(process.cwd(), "node_modules", "@expo", "vector-icons", "build", "vendor", "react-native-vector-icons", "Fonts", "Ionicons.ttf"),
  join(publicDir, "ionicons.ttf")
);
copyFileSync(
  join(process.cwd(), "node_modules", "@expo", "vector-icons", "build", "vendor", "react-native-vector-icons", "Fonts", "MaterialCommunityIcons.ttf"),
  join(publicDir, "material-community-icons.ttf")
);
copyFileSync(join(process.cwd(), "assets", "icon.png"), join(publicDir, "icon.png"));
copyFileSync(join(process.cwd(), "assets", "favicon.png"), join(publicDir, "favicon.png"));
writeFileIfChanged(join(publicDir, "favicon.ico"), pngToIco(readFileSync(join(process.cwd(), "assets", "favicon.png")), 48, 48));

const robots = [
  "User-agent: *",
  "Allow: /",
  siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml` : ""
].filter(Boolean).join("\n") + "\n";

writeFileIfChanged(join(publicDir, "robots.txt"), robots);

seoPages.forEach((page) => {
  writeFileIfChanged(join(publicDir, page.file), buildSeoPage(page, siteUrl));
});

const redirects = [
  "/index.html / 301",
  ...seoPages.map((page) => `/${page.file} ${page.path} 301`)
].join("\n") + "\n";
writeFileIfChanged(join(publicDir, "_redirects"), redirects);

if (siteUrl) {
  const sitemapUrls = [
    { loc: `${siteUrl}/`, priority: "1.0", changefreq: "weekly" },
    ...seoPages.map((page) => ({ loc: `${siteUrl}${page.path}`, priority: "0.8", changefreq: "monthly" }))
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((url) => `  <url>
    <loc>${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;
  writeFileIfChanged(join(publicDir, "sitemap.xml"), sitemap);
} else {
  rmSync(join(publicDir, "sitemap.xml"), { force: true });
}

function buildSeoPage(page, baseUrl) {
  const canonical = baseUrl ? `${baseUrl}${page.path}` : page.path;
  const appUrl = baseUrl ? `${baseUrl}/` : "/";
  const image = baseUrl ? `${baseUrl}/icon.png` : "/icon.png";
  const relatedPages = (page.related || [])
    .map((path) => seoPages.find((candidate) => candidate.path === path))
    .filter(Boolean);
  const sections = page.sections
    .map(([heading, body]) => `<section><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(body)}</p></section>`)
    .join("\n");
  const relatedLinks = relatedPages.length
    ? `<aside class="related" aria-labelledby="related-heading">
        <h2 id="related-heading">Related Bible study resources</h2>
        <div class="related-grid">
          ${relatedPages.map((related) => `<a href="${escapeHtml(related.path)}"><strong>${escapeHtml(related.heading)}</strong><span>${escapeHtml(related.description)}</span></a>`).join("\n          ")}
        </div>
      </aside>`
    : "";
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
      .related { background: #f2eadc; border: 1px solid var(--line); border-radius: 16px; margin: 30px 0; padding: 22px; }
      .related h2 { margin-bottom: 14px; }
      .related-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .related-grid a { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; color: var(--ink); display: grid; gap: 6px; padding: 16px; text-decoration: none; }
      .related-grid strong { color: var(--olive); font-size: 16px; }
      .related-grid span { color: var(--muted); font-size: 14px; line-height: 1.45; }
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
      ${relatedLinks}
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

function writeFileIfChanged(filePath, content) {
  const next = Buffer.isBuffer(content) ? content : Buffer.from(String(content));
  if (existsSync(filePath) && Buffer.compare(readFileSync(filePath), next) === 0) return;
  writeFileSync(filePath, content);
}
