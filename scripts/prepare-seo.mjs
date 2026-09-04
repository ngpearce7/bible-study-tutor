import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const publicDir = join(process.cwd(), "public");
const productionSiteUrl = "https://biblestudytutor.org";
const rawSiteUrl = process.env.EXPO_PUBLIC_SITE_URL || process.env.SITE_URL || "";
const normalizedSiteUrl = rawSiteUrl.replace(/\/$/, "");
const siteUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalizedSiteUrl) ? productionSiteUrl : normalizedSiteUrl || productionSiteUrl;
const analyticsEnabled = process.env.EXPO_PUBLIC_ANALYTICS_ENABLED === "true";
const rawConvexSiteUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL || "";
const rawConvexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || "";
const isCloudflareBuild = process.env.CF_PAGES === "1" || process.env.CF_PAGES === "true";

if (isCloudflareBuild) {
  const missingProductionVars = [
    ["EXPO_PUBLIC_SITE_URL", rawSiteUrl],
    ["EXPO_PUBLIC_CONVEX_URL", rawConvexUrl],
    ["EXPO_PUBLIC_CONVEX_SITE_URL", rawConvexSiteUrl]
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingProductionVars.length > 0) {
    throw new Error(`Cloudflare Pages build is missing required environment variable(s): ${missingProductionVars.join(", ")}`);
  }
}

const analyticsSiteUrl = (rawConvexSiteUrl || (rawConvexUrl.endsWith(".convex.cloud") ? rawConvexUrl.replace(".convex.cloud", ".convex.site") : "")).replace(/\/$/, "");
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
      ["For personal and church use", "Read the Bible, follow study methods, save journal entries, memorize verses, and share private encouragements with trusted friends or circles."],
      ["Privacy-aware and practical", "Bible Study Tutor avoids a public timeline and focuses on private study, trusted encouragement, and simple tools that help people keep returning to Scripture."],
      ["Why it stays focused", "The app is not trying to replace church, pastoral care, or in-person discipleship. It is a companion for reading, studying, remembering, praying, and preparing practical study resources."]
    ],
    schemaType: "FAQPage",
    faq: [
      ["Who is Bible Study Tutor for?", "Bible Study Tutor is for individuals, churches, small groups, youth groups, and anyone who wants practical help reading and studying Scripture."],
      ["Is Bible Study Tutor free?", "Yes. The core Bible study tools are designed to remain free and accessible."],
      ["Does Bible Study Tutor replace church community?", "No. It is a tool to support Scripture engagement, journaling, memory, and private encouragement. It should serve real discipleship rather than replace it."],
      ["Why does Bible Study Tutor include printable tools?", "Some people study better with pen and paper, and printable worksheets can help groups, classes, and families study without depending on screens."]
    ],
    cta: "Open Bible Study Tutor",
    related: ["/how-it-works", "/free-bible-study-app", "/pricing", "/features", "/bible-study-app-for-churches"],
    extraBlocks: [
      {
        type: "list",
        title: "What Bible Study Tutor helps with",
        intro: "The app keeps the main Scripture study rhythms in one calm place.",
        items: [
          "Reading Scripture by book and chapter.",
          "Following Bible reading plans without confusing them with guided study plans.",
          "Studying a selected passage with guided methods such as SOAP, OIA, and Inductive Study, with additional method guides for approaches such as word study.",
          "Saving notes, highlights, bookmarks, meditations, and journal entries.",
          "Reviewing memory verses and printing worksheets or memory cards.",
          "Sharing private encouragements with trusted friends or circles."
        ]
      },
      {
        type: "cta",
        title: "Open Bible Study Tutor",
        intro: "Start with Scripture, choose a guided method, or print a worksheet for your next study.",
        href: "/?tab=home",
        label: "Open the app"
      }
    ]
  },
  {
    path: "/how-it-works",
    file: "how-it-works.html",
    title: "How Bible Study Tutor Works | Read, Study, Remember and Print",
    description: "See how Bible Study Tutor helps you read Scripture, follow Bible reading plans, study passages, save notes, memorize verses, and print worksheets.",
    heading: "How Bible Study Tutor works",
    intro: "Bible Study Tutor is built around a simple Scripture-first rhythm: read the Bible, slow down with a guided method, save what matters, remember Scripture, and use printable worksheets when paper helps.",
    sections: [
      ["Open Scripture", "Start in the Bible reader, choose a passage, search for a word or theme, or continue a Bible reading plan from where you left off."],
      ["Study with a method", "Send a passage into Study and choose an available guided method such as SOAP, OIA, Inductive Study, Lectio Divina, READ, HEAR, or COMA. The site also includes careful educational guides for approaches such as word study."],
      ["Save and return", "Keep notes, highlights, bookmarks, meditations, memory verses, and journal entries together so your study can grow over time."],
      ["Print when helpful", "Print Bible study worksheets or memory cards for small groups, church classes, youth groups, or personal pen-and-paper study."],
      ["Continue across devices", "A free account helps save reading progress, memory review, journal entries, and preferences across desktop and mobile."]
    ],
    cta: "Start a guided study",
    related: ["/features", "/bible-study-methods", "/printable-bible-study-worksheets", "/faq"],
    schemaType: "HowTo",
    howToSteps: [
      "Open the Bible reader and choose a passage.",
      "Send the passage into a guided study method.",
      "Write observations, application, prayer, or reflection.",
      "Save the study to your journal or print a worksheet.",
      "Return later for review, memory practice, or continued reading."
    ],
    faq: [
      ["What should I do first in Bible Study Tutor?", "Start in the Bible reader if you want to read Scripture, or open Study if you already know the passage you want to examine."],
      ["What is the difference between Bible and Study?", "The Bible tab is for reading, searching, selecting, and following reading plans. The Study tab is for slowing down with a guided method over a selected passage."],
      ["Where do saved notes go?", "Saved studies, notes, meditations, highlights, bookmarks, and reflections can be found in the Journal."],
      ["Can I print instead of using the app digitally?", "Yes. You can print Bible study worksheets and memory cards when paper is the better fit."]
    ],
    extraBlocks: [
      {
        type: "previews",
        title: "A simple first-time path",
        intro: "If you are new, use one of these starting points.",
        items: [
          ["Read", "Open the Bible reader and choose a book and chapter."],
          ["Study", "Select a passage and use SOAP or OIA for simple guided prompts."],
          ["Remember", "Save one verse to Memory and practise it later."],
          ["Print", "Create a worksheet if you prefer writing by hand."]
        ]
      },
      {
        type: "cta",
        title: "Start your next Bible study",
        intro: "Open the app and choose the path that fits your next step: read, study, remember, journal, or print.",
        href: "/?tab=home",
        label: "Open Bible Study Tutor"
      }
    ]
  },
  {
    path: "/pricing",
    file: "pricing.html",
    title: "Bible Study Tutor Pricing | Free Bible Study App",
    description: "Bible Study Tutor is free to use for Bible reading, guided study, journaling, memory verses, printable worksheets, and church or small group use.",
    heading: "Bible Study Tutor is free to use",
    intro: "Bible Study Tutor is intentionally free and accessible for individuals, small groups, churches, youth groups, and anyone who wants practical Scripture study tools without a paywall.",
    sections: [
      ["Free core study tools", "Bible reading, guided study methods, notes, highlights, bookmarks, memory verses, reading plans, journal entries, and printable worksheets are available without a paid subscription."],
      ["Built for churches and groups", "The app is designed so a church can recommend it freely, and a group can use digital tools or printed worksheets without asking members to pay."],
      ["Why some translations are limited", "Bible Study Tutor uses free and legally available Bible texts so the app can remain accessible without charging users or breaching publisher licences. Some modern translations require separate permission or paid licensing."],
      ["No paid social feed", "Private friends and circles are for trusted encouragement, not a public timeline or paid community platform."]
    ],
    cta: "Start studying free",
    related: ["/free-bible-study-app", "/about", "/faq", "/bible-study-app-for-churches"],
    schemaType: "FAQPage",
    faq: [
      ["Is Bible Study Tutor free?", "Yes. The core Bible study tools are free to use on desktop and mobile."],
      ["Do I need to pay to print worksheets?", "No. Printable Bible study worksheets and memory cards are part of the free app experience."],
      ["Why does Bible Study Tutor not include every modern Bible translation?", "Many modern translations require separate publisher permission or paid licensing. The app stays free by using Bible texts that can be used legally and responsibly."],
      ["Can churches use Bible Study Tutor?", "Yes. The app is designed to be useful for churches, small groups, youth groups, and personal discipleship."]
    ],
    extraBlocks: [
      {
        type: "list",
        title: "What free means here",
        intro: "The free core experience is intended to cover the ordinary Bible study needs people return to each week.",
        items: [
          "Bible reading, search, bookmarks, and notes.",
          "Guided study methods and saved journal entries.",
          "Bible reading plans and chapter reading progress.",
          "Memory verses, review schedules, collections, and printable memory cards.",
          "Printable Bible study worksheets for personal, group, and church use.",
          "Private encouragement with trusted friends or circles."
        ]
      },
      {
        type: "checklist",
        title: "Why translation access is handled carefully",
        intro: "Bible Study Tutor only uses Bible text that can be used legally and responsibly.",
        items: [
          "Many modern Bible translations are protected by publisher licences.",
          "Some licences restrict caching, display, printing, or app integration.",
          "The app avoids promising access to translations it does not have permission to use.",
          "This helps keep the app free and legally responsible."
        ]
      },
      {
        type: "cta",
        title: "Start studying free",
        intro: "Open Bible Study Tutor and begin with the Bible reader, guided study, memory verses, or printable worksheets.",
        href: "/?tab=home",
        label: "Start studying free"
      }
    ]
  },
  {
    path: "/faq",
    file: "faq.html",
    title: "Bible Study Tutor FAQ | Free Bible Study App Questions",
    description: "Answers to common questions about Bible Study Tutor, including how to study Scripture, use reading plans, print worksheets, save notes, and create a free account.",
    heading: "Bible Study Tutor FAQ",
    intro: "Here are practical answers for new visitors and church leaders who want to understand how Bible Study Tutor works before using or sharing it.",
    sections: [
      ["Getting started", "You can use Bible Study Tutor without signing in, but creating a free account helps save progress across desktop and mobile devices."],
      ["Reading plans and guided study", "Bible reading plans help you keep reading through Scripture, while guided study methods help you slow down over a selected passage."],
      ["Notes, highlights, and journal", "Highlights, bookmarks, notes, studies, meditations, and encouragements can be saved so you can return to them later."],
      ["Worksheets and memory cards", "Selected passages can become printable study worksheets, and saved memory verses can become printable cards for review."]
    ],
    cta: "Open Bible Study Tutor",
    related: ["/how-it-works", "/pricing", "/features", "/printable-bible-study-worksheets"],
    schemaType: "FAQPage",
    faq: [
      ["Can I use Bible Study Tutor without signing in?", "Yes. You can explore the app without an account. A free account helps save your study data across devices."],
      ["What is the difference between a reading plan and a guided study?", "A reading plan helps you keep moving through Scripture over days or weeks. A guided study helps you examine one passage with a method such as SOAP, OIA, or Inductive Study."],
      ["Can I print from my phone?", "Yes. Use the print worksheet or print memory cards options, then use your phone browser’s share or print controls to save or print the page."],
      ["Where do my notes go?", "Saved studies, meditations, highlights, bookmarks, and reflections are kept in the Journal so you can revisit them by date, Scripture, or type."],
      ["Is Bible Study Tutor private?", "Bible Study Tutor avoids public timelines. Friends and circles are designed for trusted encouragement, and the app does not track private journal text or study answers for public analytics."],
      ["How do I follow a Bible reading plan?", "Open the Plans tab, choose a plan, then use the Bible reader to open and complete each reading."],
      ["What is Mark Chapter Read?", "Mark Chapter Read tracks ordinary Bible chapter reading. Mark Today’s Plan Reading Complete tracks progress through a chosen reading plan."],
      ["What should I do if the app feels crowded on mobile?", "Use collapsed sections, the main menu, and focused views such as Study focus mode, memory review, or reading plan panels to keep one task in view."]
    ],
    extraBlocks: [
      {
        type: "previews",
        title: "Common first questions",
        intro: "These quick answers help new users choose the right part of the app.",
        items: [
          ["I want to read", "Open the Bible reader or choose a reading plan."],
          ["I want to understand a passage", "Open Study and choose SOAP, OIA, or Inductive Study."],
          ["I want to remember Scripture", "Open Memory, save a verse, and practise it with blanks and hints."],
          ["I want paper", "Open the Bible reader or Study tab and print a worksheet."],
          ["I want to revisit notes", "Open the Journal and filter by Scripture, type, date, or pinned entries."]
        ]
      },
      {
        type: "cta",
        title: "Open the app",
        intro: "Start with the Bible reader, Study, Memory, or Journal depending on what you need today.",
        href: "/?tab=home",
        label: "Open Bible Study Tutor"
      }
    ]
  },
  {
    path: "/printable-bible-study-worksheets",
    file: "printable-bible-study-worksheets.html",
    title: "Printable Bible Study Worksheets | Free Worksheets for Scripture Study",
    description: "Print free Bible study worksheets for personal study, small groups, youth groups, sermon notes, and church classes using guided methods like SOAP, OIA, and Inductive Study.",
    heading: "Printable Bible study worksheets",
    intro: "Bible Study Tutor can turn selected verses into clean printable worksheets for personal study, church groups, youth groups, Bible classes, sermon follow-up, or anyone who prefers pen and paper.",
    sections: [
      ["Choose any passage", "Select verses in the Bible reader or open a passage in Study, then print a worksheet for the selected Scripture. For example, select Romans 8:1-4, choose SOAP, and print a one-page reflection sheet."],
      ["Pick a study method", "Worksheets can use guided methods such as SOAP, OIA, Inductive Study, Lectio Divina, READ, and other Scripture study patterns, so the questions match the way you want to study."],
      ["Use it in real settings", "Print worksheets for personal quiet time, youth group discussion, church small groups, family devotions, sermon notes, or a Bible class handout."],
      ["Print from desktop or mobile", "Open the worksheet preview, then use your browser print or save-as-PDF controls. On a phone, use the browser share or print option to send it to a printer or save it."]
    ],
    cta: "Start with the Bible reader",
    related: ["/bible-study-app-with-printable-worksheets", "/printable-soap-bible-study-worksheet", "/printable-inductive-bible-study-worksheet", "/bible-study-for-small-groups"],
    schemaType: "FAQPage",
    faq: [
      ["Are the Bible study worksheets free?", "Yes. Bible Study Tutor includes printable worksheets as part of the free app experience."],
      ["Can I use these worksheets for a small group?", "Yes. You can print selected passages and guided questions for small groups, youth groups, church classes, or personal study."],
      ["Can I print worksheets from a phone?", "Yes. Open the printable worksheet and use your phone browser’s share, print, or save-to-PDF option."],
      ["Which Bible study methods work with worksheets?", "You can use methods such as SOAP, OIA, Inductive Study, Lectio Divina, READ, and other guided Scripture study patterns."]
    ],
    extraBlocks: [
      {
        type: "previews",
        title: "Worksheet options",
        intro: "Printable worksheets can support different kinds of Scripture study without forcing everyone into the same format.",
        items: [
          ["SOAP worksheet", "Best for daily reflection, prayer, and a clear response to a short passage."],
          ["OIA worksheet", "Best for observing, interpreting, and applying a passage in a simple structure."],
          ["Inductive worksheet", "Best for slower study of a paragraph, repeated words, context, and main idea."],
          ["Journal-style worksheet", "Best for prayerful reflection, sermon follow-up, or keeping a paper record."],
          ["Group worksheet", "Best for small groups, youth groups, Bible classes, and church discussion."]
        ]
      },
      {
        type: "example",
        title: "Example worksheet: Romans 8:1-4",
        intro: "A selected passage can become a one-page study sheet with Scripture, guided prompts, and writing space.",
        items: [
          ["Before printing", "Select Romans 8:1-4 in the Bible reader or open it in Study."],
          ["Method", "Choose SOAP for simple reflection or Inductive Study for deeper observation and interpretation."],
          ["Use", "Print the worksheet for personal study, a small group, sermon follow-up, or a Bible class."],
          ["Afterward", "Save notes in the app or keep the printed page in a paper journal."]
        ]
      },
      {
        type: "checklist",
        title: "Before you print",
        intro: "A few quick choices make a worksheet more useful.",
        items: [
          "Is the passage short enough for careful study?",
          "Which method fits the setting: personal, group, youth, or sermon follow-up?",
          "Does the worksheet need more space for observation, application, or prayer?",
          "Will people use it digitally, on paper, or both?",
          "Should the passage also be saved to Memory or Journal?"
        ]
      },
      {
        type: "cta",
        title: "Print a Bible study worksheet",
        intro: "Open the Bible reader, choose a passage, and print a guided worksheet for study on paper.",
        href: "/?tab=bible",
        label: "Print a worksheet",
        secondaryHref: "/?tab=study&method=soap&passage=Romans%208%3A1&print=worksheet",
        secondaryLabel: "Print a Romans 8:1 worksheet"
      }
    ]
  },
  {
    path: "/bible-study-methods",
    file: "bible-study-methods.html",
    title: "Bible Study Methods | SOAP, OIA, Inductive, Lectio Divina and READ",
    description: "Learn Bible study methods including SOAP, OIA, Inductive Study, Lectio Divina, READ, word study, verse mapping, character study, and prayerful reflection.",
    heading: "Bible study methods and guides",
    intro: "Bible Study Tutor includes guided in-app methods and educational method guides. Choose an available guided method to answer one step at a time, or use a guide on this site to practise another approach with the Bible reader.",
    sections: [
      ["Start with the passage", "Every method should serve careful reading of Scripture. Choose the passage first, then use the method to slow down, notice details, understand context, and respond faithfully."],
      ["Simple daily methods", "SOAP and OIA are useful when you want a clear rhythm for a short passage: read, observe, understand, apply, and pray."],
      ["Deeper study methods", "Use the guided Inductive Study in the app when you want to examine a passage closely. The site’s educational guides explain verse mapping, character study, word study, and cross-reference study without presenting them as selectable in-app workflows."],
      ["Reflective methods", "Use Lectio Divina, READ, and prayerful reflection when you want to meditate slowly on Scripture and turn the passage into prayer."],
      ["Save or print the study", "After studying, save the notes to your journal or print a worksheet for personal study, small groups, Bible classes, or youth groups."]
    ],
    schemaType: "FAQPage",
    faq: [
      ["Which Bible study method should a beginner use first?", "SOAP or OIA are usually the easiest places to begin because they use simple prompts and work well with short passages."],
      ["When should I use inductive Bible study?", "Use inductive study when you want to spend more time observing the text, understanding context, and applying a passage carefully."],
      ["Can I change methods after starting?", "Yes. In Bible Study Tutor, methods are meant to help you study the passage, not trap you in one rigid approach."],
      ["Can Bible study methods be printed?", "Yes. You can print worksheets using guided methods so the same passage can be studied on paper."]
    ],
    cta: "Choose a study method",
    related: ["/how-to-study-the-bible", "/bible-study-methods/soap", "/bible-study-methods/inductive", "/bible-study-methods/oia", "/printable-bible-study-worksheets"],
    extraBlocks: [
      {
        type: "previews",
        title: "How to choose a method",
        intro: "Different methods fit different kinds of study. Start with the simplest option that helps you pay attention to the passage.",
        items: [
          ["SOAP", "Best for daily devotion, prayer, and simple Scripture reflection."],
          ["OIA", "Best for learning to observe, interpret, and apply a passage clearly."],
          ["Inductive Study", "Best for deeper study of paragraphs, letters, arguments, and repeated themes."],
          ["Word Study", "Best for tracing a repeated or important biblical word in context."],
          ["Lectio Divina", "Best for slow, prayerful meditation on a shorter passage."]
        ]
      },
      {
        type: "checklist",
        title: "Method selection checklist",
        intro: "Use these questions before choosing a study method.",
        items: [
          "Am I studying a short passage, a full chapter, or a theme?",
          "Do I need simple devotional reflection or deeper observation?",
          "Would a printable worksheet help me slow down?",
          "Do I want to save notes to my journal afterward?",
          "Will this method help me listen to Scripture rather than forcing my own idea onto it?"
        ]
      },
      {
        type: "cta",
        title: "Choose a Bible study method",
        intro: "Open the Methods tab in Bible Study Tutor and choose a guided method before starting your next passage.",
        href: "/?tab=methods",
        label: "Choose a study method"
      }
    ]
  },
  {
    path: "/how-to-study-the-bible",
    file: "how-to-study-the-bible.html",
    title: "How to Study the Bible | A Simple Guide for Bible Study",
    description: "Learn how to study the Bible with a simple Scripture-first rhythm: read carefully, observe the passage, understand the meaning, respond in prayer, and apply it.",
    heading: "How to study the Bible",
    intro: "Bible Study Tutor helps you study the Bible with a calm, repeatable rhythm: open Scripture, slow down, notice what is there, understand the passage, and respond faithfully.",
    sections: [
      ["Begin with prayer and context", "Ask God for wisdom, read the surrounding verses, and notice who is speaking, what is happening, and where the passage sits in the wider book."],
      ["Observe before applying", "Look for repeated words, commands, promises, contrasts, people, places, and questions before rushing to a personal takeaway."],
      ["Understand the passage in context", "Ask what the author is saying to the original audience before deciding what the passage means for you today."],
      ["Respond with obedience", "A good Bible study does not stop at information. Write a prayer, choose one next step, and return to the passage through the week."],
      ["Keep a record", "Save notes, questions, prayers, highlights, and memory verses so your study can grow over time rather than disappearing after one reading."]
    ],
    schemaType: "HowTo",
    howToSteps: [
      "Choose a Bible passage that is short enough to study carefully.",
      "Pray and read the surrounding context.",
      "Observe repeated words, commands, promises, contrasts, and questions.",
      "Interpret the passage in its chapter, book, and biblical context.",
      "Apply the passage with prayer, obedience, memory, or a saved journal note."
    ],
    faq: [
      ["Where should I start studying the Bible?", "Start with a manageable passage, such as a paragraph in a Gospel, Psalm, or New Testament letter. Shorter passages are easier to observe carefully."],
      ["Do I need a complicated method?", "No. A simple rhythm of reading, observing, understanding, applying, and praying is enough to begin."],
      ["How can I avoid taking verses out of context?", "Read the surrounding verses, notice the flow of thought, and ask what the passage meant before applying it personally."],
      ["Should I write notes while studying?", "Writing notes can help you slow down, remember what you saw, and return to the passage later."]
    ],
    cta: "Start a guided study",
    related: ["/bible-study-for-beginners", "/how-to-study-a-bible-passage", "/bible-study-methods", "/bible-study-journal"],
    extraBlocks: [
      {
        type: "example",
        title: "Simple example: studying Psalm 23:1",
        intro: "A short verse can still be studied carefully when you slow down and ask good questions.",
        items: [
          ["Observation", "The verse says the Lord is my shepherd and connects His care with the statement that I shall not want."],
          ["Interpretation", "The image of shepherding points to God's provision, guidance, protection, and personal care."],
          ["Application", "A faithful response could be to name one anxiety and bring it under the care of the Lord in prayer."],
          ["Prayer", "Lord, shepherd me today. Teach me to trust Your care rather than living as though I must provide everything for myself."]
        ]
      },
      {
        type: "journalExample",
        title: "Example journal entry: Psalm 23:1",
        intro: "A saved study can keep the Scripture visible above the notes, with simple markings that show what the reader noticed.",
        reference: "Psalm 23:1",
        translation: "KJV",
        scriptureHtml: "The <mark>Lord</mark> is my <span class=\"scripture-underline\">shepherd</span>; I shall not want.",
        notes: [
          ["Observation", "The verse names the Lord personally and describes Him as shepherd. The marked words keep attention on who God is and what He does."],
          ["Interpretation", "Shepherd language points to provision, guidance, protection, and personal care rather than distant religious theory."],
          ["Application", "A faithful response is to name one area of anxiety and bring it under the Lord’s care in prayer."]
        ]
      },
      {
        type: "checklist",
        title: "Bible study checklist",
        intro: "Use this simple checklist whenever you feel unsure what to do next.",
        items: [
          "Have I read the passage more than once?",
          "Have I noticed what is actually in the text?",
          "Have I considered the surrounding context?",
          "Can I summarize the main point in one sentence?",
          "Have I responded with prayer or a specific next step?"
        ]
      },
      {
        type: "cta",
        title: "Start a simple Bible study",
        intro: "Open the Study tab and let Bible Study Tutor guide you through Scripture one step at a time.",
        href: "/?tab=study",
        label: "Start a guided study"
      }
    ]
  },
  {
    path: "/how-to-study-a-bible-passage",
    file: "how-to-study-a-bible-passage.html",
    title: "How to Study a Bible Passage | Observe, Interpret and Apply Scripture",
    description: "Learn how to study a Bible passage by reading the text, making observations, interpreting the meaning, applying the truth, and saving your notes.",
    heading: "How to study a Bible passage",
    intro: "When you study a Bible passage, the goal is to listen carefully to the text before deciding what it means for life. Bible Study Tutor gives you a structured way to do that.",
    sections: [
      ["Read the passage more than once", "Read slowly, then reread. Notice the flow of thought, key words, commands, promises, and anything that surprises you."],
      ["Ask what the author meant", "Interpret the passage in context. Look at the chapter, the book, the audience, and how the passage points to God's character and work."],
      ["Use a method without forcing the text", "A method like OIA, SOAP, or Inductive Study gives structure, but the passage should still set the agenda."],
      ["Write a clear response", "Turn your study into prayer, action, memory, or encouragement. Save the notes in your journal so you can revisit them later."],
      ["Print when paper helps", "If handwriting helps you think, print a worksheet with the selected passage and use it for quiet study, small groups, or sermon follow-up."]
    ],
    schemaType: "HowTo",
    howToSteps: [
      "Read the passage and the surrounding context.",
      "Write observations from the text before applying it.",
      "Identify the main idea of the passage.",
      "Choose a method such as OIA, SOAP, or Inductive Study.",
      "Save your notes, pray through the passage, or print a worksheet."
    ],
    faq: [
      ["How long should a Bible passage be for study?", "A paragraph or short section is usually best. It gives enough context without becoming too large to observe carefully."],
      ["What should I write first?", "Start with observations: repeated words, commands, contrasts, questions, people, places, and anything the passage emphasizes."],
      ["What is the difference between interpretation and application?", "Interpretation asks what the passage means in context. Application asks how that meaning should shape belief, prayer, obedience, and daily life."],
      ["Can I turn a passage study into a worksheet?", "Yes. Bible Study Tutor can print selected Scripture with guided prompts for personal or group study."]
    ],
    cta: "Study a passage now",
    related: ["/how-to-study-the-bible", "/bible-study-methods/oia", "/printable-bible-study-worksheets", "/bible-study-journal"],
    extraBlocks: [
      {
        type: "example",
        title: "Example workflow: Romans 8:1-4",
        intro: "A passage like Romans 8:1-4 can be studied in a focused way without trying to solve the whole letter at once.",
        items: [
          ["Read", "Read Romans 8:1-4, then glance back at the end of Romans 7 so the word therefore is not isolated."],
          ["Observe", "Notice condemnation, Christ Jesus, law, Spirit, flesh, and righteous requirement."],
          ["Interpret", "Ask how Paul connects freedom from condemnation with the work of Christ and the Spirit."],
          ["Apply", "Write one way this passage calls you to trust Christ rather than live under condemnation."],
          ["Pray", "Ask God to help the truth of the passage shape your confidence and obedience."]
        ]
      },
      {
        type: "journalExample",
        title: "Example journal entry: Romans 8:1",
        intro: "The journal-style view helps readers see how highlighted words become observations before moving to meaning and application.",
        reference: "Romans 8:1",
        translation: "KJV",
        scriptureHtml: "<span class=\"scripture-underline\">There is therefore</span> now <mark>no condemnation</mark> to them which are in Christ Jesus.",
        notes: [
          ["Observation", "The word therefore shows this verse is connected to the argument before it. The highlighted phrase carries the central promise."],
          ["Interpretation", "Paul is not saying believers never struggle. He is declaring that condemnation has been removed for those who are in Christ."],
          ["Application", "This calls me to answer guilt and fear with the finished work of Christ rather than self-justification."]
        ]
      },
      {
        type: "checklist",
        title: "Passage study safeguards",
        intro: "These safeguards keep a Bible passage study from becoming rushed or disconnected.",
        items: [
          "Do not build an application before reading the context.",
          "Do not treat a single word as the whole meaning of the passage.",
          "Notice the main idea before focusing on smaller details.",
          "Let difficult questions slow you down rather than forcing a quick answer.",
          "Save questions you need to revisit later."
        ]
      },
      {
        type: "cta",
        title: "Study a Bible passage",
        intro: "Open the Study tab and use guided prompts to work through a selected passage carefully.",
        href: "/?tab=study&method=oia",
        label: "Study a passage now"
      }
    ]
  },
  {
    path: "/bible-study-methods/soap",
    file: "bible-study-methods/soap.html",
    title: "SOAP Bible Study Method | Scripture, Observation, Application, Prayer",
    description: "Learn the SOAP Bible study method with a simple example, when to use it, printable worksheet options, and guided Scripture study in Bible Study Tutor.",
    heading: "SOAP Bible study method",
    intro: "SOAP is a simple Bible study method for turning Scripture reading into thoughtful reflection, prayer, and everyday obedience. It works especially well when you want a clear path for a short passage.",
    sections: [
      ["Scripture", "Choose a passage and write down the verse or section that stands out. This keeps the study anchored in the biblical text before reflection begins."],
      ["Observation", "Notice what the passage says. Look for repeated words, commands, promises, people, contrasts, and what the passage reveals about God."],
      ["Application", "Ask how the passage speaks to your beliefs, actions, relationships, worship, and trust in God. Keep the response specific rather than vague."],
      ["Prayer", "Finish by praying honestly through what you have seen, asking God for help to receive and obey His Word."],
      ["Simple SOAP example", "For Romans 8:1, Scripture records the verse, Observation notices the promise of no condemnation in Christ, Application responds with trust rather than fear, and Prayer asks God to help that truth settle into daily life."]
    ],
    cta: "Practise SOAP",
    related: ["/printable-soap-bible-study-worksheet", "/bible-study-methods/oia", "/how-to-study-a-bible-passage", "/bible-study-app-with-printable-worksheets"],
    schemaType: "FAQPage",
    faq: [
      ["What does SOAP stand for?", "SOAP stands for Scripture, Observation, Application, and Prayer."],
      ["When is SOAP a good Bible study method?", "SOAP is useful for beginners, daily devotions, small groups, and short passages where you want a simple structure."],
      ["Can I print a SOAP worksheet?", "Yes. Bible Study Tutor can create printable worksheets for selected Scripture passages using the SOAP method."],
      ["Is SOAP the same as inductive Bible study?", "SOAP is simpler and more devotional. Inductive study usually spends more time on detailed observation, interpretation, and cross references."]
    ],
    extraBlocks: [
      {
        type: "example",
        title: "Worked SOAP example: Psalm 23:1",
        intro: "SOAP works well with a short verse because it helps you slow down without making the study complicated.",
        items: [
          ["Scripture", "Psalm 23:1 says, “The Lord is my shepherd; I shall not want.”"],
          ["Observation", "The verse describes the Lord personally as shepherd and connects His care with provision and contentment."],
          ["Application", "A faithful response could be to name one area where anxiety is replacing trust in the Lord’s care."],
          ["Prayer", "Lord, shepherd me today. Help me trust Your provision and follow Your care with a quiet heart."]
        ]
      },
      {
        type: "journalExample",
        title: "SOAP journal example: Psalm 23:1",
        intro: "A SOAP journal entry can keep the selected Scripture above the user's notes so the prayer and application stay anchored in the verse.",
        reference: "Psalm 23:1",
        translation: "KJV",
        scriptureHtml: "The Lord is my <mark>shepherd</mark>; I shall <span class=\"scripture-underline\">not want</span>.",
        notes: [
          ["Scripture", "The selected verse is short enough to carry through the whole SOAP reflection."],
          ["Observation", "The shepherd image describes personal care, direction, and provision."],
          ["Application", "I can respond by trusting God with a specific area where I feel lack or pressure."],
          ["Prayer", "Lord, teach me to receive Your shepherding care today."]
        ]
      },
      {
        type: "checklist",
        title: "SOAP study safeguards",
        intro: "SOAP is simple, but it still needs careful reading.",
        items: [
          "Start with the actual Scripture, not only a thought about the Scripture.",
          "Write observations before personal application.",
          "Keep application specific enough to act on.",
          "Let prayer respond to the passage rather than becoming disconnected.",
          "Read the surrounding verses when a passage feels unclear."
        ]
      },
      {
        type: "list",
        title: "When SOAP is especially helpful",
        intro: "SOAP is a good fit when you need a repeatable rhythm for ordinary Bible reading.",
        items: [
          "Morning or evening devotional study.",
          "A short passage for a small group or youth group.",
          "Sermon follow-up during the week.",
          "A passage you want to turn into prayer.",
          "A printed worksheet for people new to Bible study."
        ]
      },
      {
        type: "cta",
        title: "Practise SOAP",
        intro: "Open the Study tab and use SOAP to move from Scripture to observation, application, and prayer.",
        href: "/?tab=study&method=soap",
        label: "Practise SOAP"
      }
    ]
  },
  {
    path: "/bible-study-methods/inductive",
    file: "bible-study-methods/inductive.html",
    title: "Inductive Bible Study Method | Observation, Interpretation and Application",
    description: "Learn the inductive Bible study method with step-by-step observation, interpretation, application, a worked example, safeguards, and printable worksheet options.",
    heading: "Inductive Bible study method",
    intro: "Inductive Bible study helps you move from careful observation to faithful interpretation and practical application without skipping over the text. It is especially useful when you want to understand what a passage says before deciding how it speaks into life.",
    sections: [
      ["Observation", "Mark repeated words, commands, contrasts, people, places, timing, and structure. Ask what the passage actually says before explaining what it means."],
      ["Interpretation", "Use context to understand the author’s meaning. Ask how the passage fits the chapter, the book, the original audience, and the message of Scripture."],
      ["Application", "Respond with specific obedience, repentance, trust, worship, or prayer rather than vague good intentions. The application should flow from the meaning of the passage."],
      ["Why the order matters", "Observation protects you from rushing. Interpretation protects you from guessing. Application protects the study from staying only in your notebook."]
    ],
    cta: "Try inductive study",
    related: ["/printable-inductive-bible-study-worksheet", "/how-to-study-a-bible-passage", "/bible-study-methods/oia", "/how-to-study-romans"],
    schemaType: "HowTo",
    howToSteps: [
      "Read the passage and surrounding context carefully.",
      "Write observations from the text before explaining meaning.",
      "Interpret the passage using context, author, audience, and related Scripture.",
      "Summarize the main point in one or two sentences.",
      "Write one faithful application and prayer response."
    ],
    faq: [
      ["What does inductive Bible study mean?", "Inductive Bible study moves from observation to interpretation to application, letting the passage guide the conclusions."],
      ["Is inductive study good for beginners?", "Yes, but it is more detailed than SOAP. Beginners can start with shorter passages and simple observation questions."],
      ["How long should an inductive study passage be?", "A paragraph or short section is usually best, especially when learning the method."],
      ["Can I print an inductive worksheet?", "Yes. Bible Study Tutor includes printable worksheet options for inductive Bible study."]
    ],
    extraBlocks: [
      {
        type: "example",
        title: "Worked example: Romans 8:1",
        intro: "A short inductive study can begin with Romans 8:1: “Therefore, there is now no condemnation for those who are in Christ Jesus.”",
        items: [
          ["Observation", "The verse begins with “Therefore,” so it points back to Paul’s argument. The promise is stated strongly: “no condemnation.” The promise is located “in Christ Jesus.”"],
          ["Interpretation", "In context, Paul is explaining the freedom and life given in Christ after describing the struggle with sin. The verse does not promise that believers never struggle; it declares that condemnation has been removed in Christ."],
          ["Application", "A faithful response might be to confess where guilt or fear has been ruling the heart and to rest again in Christ rather than self-justification."],
          ["Prayer", "Lord, help me trust what You have declared in Christ. Teach me to live from grace rather than fear."]
        ]
      },
      {
        type: "checklist",
        title: "Inductive study checklist",
        intro: "Use this checklist to keep the study anchored in the passage.",
        items: [
          "Have I read the whole paragraph or section?",
          "Have I separated observations from interpretation?",
          "Have I noticed repeated words, commands, contrasts, and structure?",
          "Have I considered the book and chapter context?",
          "Can I state the main point of the passage?",
          "Does my application come from the passage rather than from a loose idea?"
        ]
      },
      {
        type: "checklist",
        title: "Common inductive study mistakes",
        intro: "These are the easiest ways to weaken an inductive Bible study.",
        items: [
          "Skipping observation because the passage feels familiar.",
          "Using cross references before understanding the immediate context.",
          "Turning application into general advice instead of a text-shaped response.",
          "Studying too large a passage too quickly.",
          "Treating personal impressions as equal to the meaning of the text."
        ]
      },
      {
        type: "cta",
        title: "Print an inductive study worksheet",
        intro: "Select a passage in Bible Study Tutor and print a worksheet with space for observation, interpretation, application, prayer, and questions.",
        href: "/?tab=bible",
        label: "Print an inductive worksheet"
      }
    ]
  },
  {
    path: "/bible-study-methods/oia",
    file: "bible-study-methods/oia.html",
    title: "OIA Bible Study Method | Observation, Interpretation and Application",
    description: "Use the OIA Bible study method to observe, interpret, and apply Scripture with clear steps, an example, safeguards, checklist, and worksheet options.",
    heading: "OIA Bible study method",
    intro: "OIA is a clear and memorable way to study Scripture: observe what the passage says, interpret what it means, and apply it faithfully. It gives structure without making the study complicated.",
    sections: [
      ["Observation", "Slow down and list what you see in the passage before explaining it. Look for words, themes, logic, emotion, movement, commands, promises, and contrasts."],
      ["Interpretation", "Ask what the passage meant in context, what it reveals about God, and how it connects with the surrounding Scripture. The goal is the author’s meaning, not a detached idea."],
      ["Application", "Write one honest response. That might be something to believe, confess, obey, pray, remember, or share."],
      ["Why OIA works well", "OIA is simple enough for beginners and strong enough for repeated use, because it slows the reader down before moving toward response."]
    ],
    cta: "Practise OIA",
    related: ["/how-to-study-a-bible-passage", "/bible-study-methods/inductive", "/bible-study-methods/soap", "/printable-bible-study-worksheets"],
    schemaType: "HowTo",
    howToSteps: [
      "Choose a short passage and read it slowly.",
      "Write observations from the words and structure of the passage.",
      "Interpret the passage in context.",
      "Write one specific application.",
      "Save the study or print a worksheet for review."
    ],
    faq: [
      ["What does OIA stand for?", "OIA stands for Observation, Interpretation, and Application."],
      ["How is OIA different from SOAP?", "OIA focuses on observe, interpret, and apply. SOAP adds a dedicated Scripture and Prayer structure, which can feel more devotional."],
      ["Is OIA good for group Bible study?", "Yes. OIA gives a group a shared order: first observe together, then interpret, then discuss application."],
      ["Can I use OIA with a printable worksheet?", "Yes. Bible Study Tutor can help you print worksheets for selected Scripture passages and guided study methods."]
    ],
    extraBlocks: [
      {
        type: "example",
        title: "Worked OIA example: Mark 1:35",
        intro: "Mark 1:35 is a short verse that works well for learning OIA: Jesus rises early, goes to a solitary place, and prays.",
        items: [
          ["Observation", "The verse includes time, place, action, and purpose. Jesus gets up early, leaves for a quiet place, and prays."],
          ["Interpretation", "In the flow of Mark 1, Jesus has been serving many people. The verse shows His communion with the Father in the middle of demanding ministry."],
          ["Application", "A simple application could be to make space for prayer before activity, especially when life is crowded or demanding."],
          ["Prayer", "Father, teach me to seek You before rushing into the day. Shape my service from dependence on You."]
        ]
      },
      {
        type: "checklist",
        title: "OIA checklist",
        intro: "Use this checklist to keep each step distinct.",
        items: [
          "Observation: What do I see in the passage?",
          "Interpretation: What did this mean in context?",
          "Application: How should I faithfully respond?",
          "Have I avoided applying the passage before interpreting it?",
          "Can I explain my answer from the text itself?"
        ]
      },
      {
        type: "cta",
        title: "Try OIA in Bible Study Tutor",
        intro: "Open a passage, choose OIA, and let the app guide you through observation, interpretation, and application.",
        href: "/?tab=study&method=oia",
        label: "Start an OIA study"
      }
    ]
  },
  {
    path: "/bible-study-methods/lectio-divina",
    file: "bible-study-methods/lectio-divina.html",
    title: "Lectio Divina Bible Study Method | Prayerful Scripture Reflection",
    description: "Practise Lectio Divina with Scripture reading, meditation, prayer, quiet response, a worked example, safeguards, checklist, and guided study CTA.",
    heading: "Lectio Divina Bible study method",
    intro: "Lectio Divina is a prayerful way to read Scripture slowly, listen attentively, and respond to God with reflection and prayer. It should keep the Bible passage central rather than replacing Scripture with vague impressions.",
    sections: [
      ["Read", "Read the passage slowly and notice a word, phrase, or image that draws your attention. Keep the whole passage in view."],
      ["Reflect", "Meditate on the passage in context. Ask what the text reveals about God, faith, repentance, comfort, or obedience."],
      ["Pray", "Pray honestly in response to what Scripture says. Let the words of the passage shape the prayer."],
      ["Carry", "Choose a short phrase or truth from the passage to carry with you through the day."]
    ],
    cta: "Try Lectio Divina",
    related: ["/bible-study-methods", "/bible-study-journal", "/bible-memory-verses", "/how-to-memorize-bible-verses"],
    schemaType: "HowTo",
    howToSteps: [
      "Choose a short Scripture passage.",
      "Read the passage slowly more than once.",
      "Reflect on a word, phrase, or truth in context.",
      "Pray in response to the passage.",
      "Carry one phrase or truth into the day."
    ],
    faq: [
      ["What does Lectio Divina mean?", "Lectio Divina is often described as prayerful Scripture reading, usually moving through reading, reflection, prayer, and quiet response."],
      ["Is Lectio Divina the same as Bible study?", "It is more prayerful and reflective than analytical, but it should still stay anchored in the meaning of the passage."],
      ["What passage length works best?", "A short passage, paragraph, Psalm section, or Gospel scene usually works best."],
      ["Can I save a Lectio Divina reflection?", "Yes. Bible Study Tutor can save meditations and reflections to the journal."]
    ],
    extraBlocks: [
      {
        type: "example",
        title: "Worked example: Psalm 131:1-2",
        intro: "Psalm 131 is short, prayerful, and well suited to slow reflection.",
        items: [
          ["Read", "Read the psalm slowly and notice the picture of a quieted soul."],
          ["Reflect", "The passage contrasts pride and restless striving with humble trust before the Lord."],
          ["Pray", "Ask God to quiet restless ambition and teach childlike trust."],
          ["Carry", "Carry the phrase “quieted my soul” as a reminder to return to trust during the day."]
        ]
      },
      {
        type: "checklist",
        title: "Lectio Divina safeguards",
        intro: "These safeguards keep prayerful reflection connected to Scripture.",
        items: [
          "Read the whole passage before focusing on one phrase.",
          "Do not detach a phrase from its context.",
          "Let prayer respond to the text rather than ignore it.",
          "Avoid treating every feeling as the meaning of the passage.",
          "Return to Scripture if reflection becomes vague or self-focused."
        ]
      },
      {
        type: "cta",
        title: "Try prayerful Scripture reflection",
        intro: "Open a short passage in Bible Study Tutor and use Lectio Divina to read, reflect, pray, and carry Scripture into the day.",
        href: "/?tab=study&method=lectio",
        label: "Try Lectio Divina"
      }
    ]
  },
  {
    path: "/bible-study-methods/verse-mapping",
    file: "bible-study-methods/verse-mapping.html",
    title: "Verse Mapping Bible Study Method | Explore Scripture Word by Word",
    description: "Use the verse mapping Bible study method with key words, context, cross references, themes, a worked example, checklist, safeguards, and worksheet CTA.",
    heading: "Verse mapping Bible study method",
    intro: "Verse mapping helps you slow down over one verse or short passage, tracing words, context, themes, and connections so the Scripture becomes clearer. It is best used to understand the verse in its passage, not as a decorative note page only.",
    sections: [
      ["Choose a focused passage", "Start with one verse or a short section, then write the reference, surrounding context, and any words that need closer attention."],
      ["Trace words and connections", "Look up repeated words, related passages, themes, people, places, and how the verse fits the wider chapter."],
      ["Summarize the verse", "Write the main point of the verse in your own words while staying faithful to the passage."],
      ["Respond with clarity", "Summarize what the verse teaches, write a prayer, and note one way to remember or apply the passage."]
    ],
    cta: "Try verse mapping",
    related: ["/bible-study-methods/word-study", "/bible-study-methods/cross-reference-study", "/printable-bible-study-journal", "/bible-study-methods/inductive"],
    schemaType: "HowTo",
    howToSteps: [
      "Choose one verse or a short passage.",
      "Write the reference and surrounding context.",
      "Identify key words, repeated ideas, and related passages.",
      "Summarize the verse in context.",
      "Write a prayer, memory note, or application."
    ],
    faq: [
      ["What is verse mapping?", "Verse mapping is a way to slow down over one verse by tracing context, key words, related passages, and response."],
      ["Is verse mapping only creative journaling?", "It can be visually creative, but the main goal should be understanding the Scripture in context."],
      ["How many verses should I map at once?", "One verse or a short passage is usually best."],
      ["Can verse mapping help with memorization?", "Yes. Mapping a verse can help you notice structure and meaning, which can support memory practice."]
    ],
    extraBlocks: [
      {
        type: "example",
        title: "Worked example: Micah 6:8",
        intro: "Micah 6:8 is often memorized, but verse mapping helps keep it connected to its context.",
        items: [
          ["Context", "Micah 6 includes the Lord’s case against His people. The verse summarizes a faithful response rather than empty religious performance."],
          ["Key words", "Justice, mercy, and humble walking each describe covenant faithfulness lived before God."],
          ["Connections", "Related themes appear throughout Scripture, but the immediate passage should guide the meaning first."],
          ["Response", "A faithful response could include one concrete act of mercy, one step of humility, and prayer for a just heart."]
        ]
      },
      {
        type: "checklist",
        title: "Verse mapping checklist",
        intro: "Use this checklist so the verse stays connected to Scripture.",
        items: [
          "Have I read the surrounding paragraph or chapter?",
          "Have I written the verse reference clearly?",
          "Have I identified key words and repeated ideas?",
          "Have I checked related passages without ignoring the main context?",
          "Can I summarize the verse faithfully?",
          "Have I written a prayer or response?"
        ]
      },
      {
        type: "cta",
        title: "Start a verse map",
        intro: "Choose one verse in Bible Study Tutor, study it carefully, and save or print notes for review.",
        href: "/?tab=study&method=verse-mapping",
        label: "Start verse mapping"
      }
    ]
  },
  {
    path: "/bible-study-methods/word-study",
    file: "bible-study-methods/word-study.html",
    title: "How to Do a Bible Word Study | Step-by-Step Method",
    description: "Learn how to do a Bible word study step by step, with a worked example, careful comparisons, common mistakes, and safeguards that keep each word anchored in context.",
    heading: "How to do a Bible word study: step-by-step method",
    intro: "A Bible word study examines how an important word contributes to a passage without pulling it away from its sentence, author, genre, or place in Scripture. For example, studying “peace” in John 14:27 begins with Jesus comforting troubled disciples, not with a list of every possible meaning of peace.",
    showHowToSteps: true,
    includeFaqSchema: true,
    sections: [
      ["Tools you need", "Begin with the passage itself, a way to record observations, and cross references if they help you follow the author’s use of the word. Read the paragraph or chapter more than once before consulting outside resources."],
      ["Tools you do not need", "You do not need specialist software or knowledge of Greek or Hebrew to begin. Original-language tools can be useful, but they are optional and must not override the sentence, grammar, and context."],
      ["Compare in the right order", "Look first at the immediate passage, then the same book and author, and only then at related passages elsewhere in Scripture. Each comparison should clarify the main passage rather than replace it."],
      ["Return to the passage", "Finish by stating how the word contributes to the author’s main point. A faithful word study explains the passage more clearly and leads to a response shaped by what the text actually says."]
    ],
    cta: "Choose a passage for word study",
    related: ["/bible-study-methods/verse-mapping", "/bible-study-methods/cross-reference-study", "/bible-study-methods/inductive", "/printable-bible-study-worksheets"],
    schemaType: "HowTo",
    howToSteps: [
      "Choose an important or repeated word in a specific Bible passage.",
      "Read the whole paragraph or chapter and summarize its main point before isolating the word.",
      "Write the word, reference, sentence, speaker or author, audience, and reason the word matters.",
      "Notice repetition, contrasts, commands, promises, grammar, and nearby ideas that shape the word in context.",
      "Compare how the same book or author uses the word in nearby passages.",
      "Use cross references or optional original-language tools carefully, without importing every possible definition into the verse.",
      "Explain in one or two sentences how the word clarifies the main passage.",
      "Write one prayer, belief, or action that responds to the passage rather than to the word in isolation."
    ],
    faq: [
      ["What is a word study in the Bible?", "A Bible word study examines how an important or repeated word contributes to the meaning of a particular passage, then compares related uses without ignoring context."],
      ["How do I do a Bible word study?", "Choose a word in a passage, read the surrounding context, record how the sentence and author use it, compare related passages carefully, and finish by explaining the passage’s main point."],
      ["Do I need Greek or Hebrew for a Bible word study?", "No. Careful reading, context, repetition, and cross references are enough to begin. Original-language tools are optional and should be used humbly because a dictionary entry does not determine a word’s meaning by itself."],
      ["What is the biggest mistake in a Bible word study?", "The biggest mistake is separating a word from its sentence and assuming every occurrence or dictionary definition has the same meaning. Context and grammar must guide the study."]
    ],
    extraBlocks: [
      {
        type: "example",
        title: "Complete example: studying \"peace\" in John 14:27",
        intro: "A simple word study might begin with Jesus’ words, “Peace I leave with you; My peace I give to you.” The aim is not to collect every possible meaning of peace, but to understand what Jesus is promising in this passage.",
        items: [
          ["Passage context", "John 14 is part of Jesus’ words to His disciples before the cross. The disciples are troubled, and Jesus speaks of the Father, the Spirit, His departure, and His continuing care."],
          ["Word focus", "The word “peace” is repeated in the verse and contrasted with what the world gives. That contrast helps shape the meaning: Jesus gives a peace rooted in Himself, not merely calm circumstances."],
          ["Careful comparison", "Related passages such as John 16:33 and Philippians 4:6-7 can help, but they should support the meaning of John 14:27 rather than replace it."],
          ["Faithful summary", "In this passage, Jesus comforts His disciples with a peace that belongs to Him and is given by Him, so their hearts do not need to be ruled by fear."]
        ]
      },
      {
        type: "checklist",
        title: "Word study checklist",
        intro: "Use this checklist before moving from observation to application.",
        items: [
          "Have I read the whole paragraph or chapter?",
          "Have I written the word, reference, and immediate context?",
          "Have I noticed repetition, contrast, commands, promises, or questions around the word?",
          "Have I checked whether the same author uses the word nearby?",
          "Have I avoided building a meaning from the word alone while ignoring the sentence?",
          "Can I explain how this word helps clarify the passage?"
        ]
      },
      {
        type: "table",
        title: "Common word study mistakes",
        intro: "These corrections keep a word study from becoming detached from Scripture.",
        headers: ["Mistake", "Better approach"],
        rows: [
          ["Dictionary dumping", "Use only the sense that fits the sentence and passage."],
          ["The root fallacy", "Do not assume a word’s history or parts determine its meaning in this verse."],
          ["Treating every occurrence identically", "Let each author, sentence, and genre shape the word’s meaning."],
          ["Ignoring grammar", "Read the whole phrase and notice how the word functions in the sentence."],
          ["Proof-texting", "Understand the immediate passage before gathering wider cross references."]
        ]
      },
      {
        type: "cta",
        title: "Choose a passage for your word study",
        intro: "Open the Bible reader, choose a short passage, and use the steps and checklist on this page to study an important word. Bible Study Tutor does not currently include a dedicated guided word-study workflow.",
        href: "/?tab=bible",
        label: "Open the Bible reader"
      }
    ]
  },
  {
    path: "/bible-study-methods/topical-study",
    file: "bible-study-methods/topical-study.html",
    title: "Topical Bible Study Method | Study Scripture by Theme",
    description: "Use a topical Bible study method to trace a theme across Scripture with context, sample passages, safeguards, a worked example, checklist, and study CTA.",
    heading: "Topical Bible study method",
    intro: "Topical study helps you follow a biblical theme across multiple passages while still reading each verse in context. It is useful for themes like prayer, wisdom, identity in Christ, forgiveness, comfort, or the fear of the Lord.",
    sections: [
      ["Define the topic carefully", "Begin with a clear question or theme, such as prayer, wisdom, identity in Christ, forgiveness, or the fear of the Lord."],
      ["Gather passages thoughtfully", "Read several passages that speak to the topic, noting their setting, audience, and main point before comparing them."],
      ["Compare without flattening", "Let each passage speak in its own context before drawing together themes. Avoid treating every verse as if it says the same thing in the same way."],
      ["Summarize what Scripture teaches", "Look for patterns, tensions, commands, promises, and a faithful response shaped by the whole counsel of Scripture."]
    ],
    cta: "Try topical study",
    related: ["/bible-study-methods/word-study", "/bible-study-methods/cross-reference-study", "/bible-study-methods/character-study", "/printable-bible-study-worksheets"],
    schemaType: "HowTo",
    howToSteps: [
      "Choose a clear topic or question.",
      "Gather several relevant passages.",
      "Read each passage in context before comparing them.",
      "Identify patterns, tensions, commands, promises, and warnings.",
      "Summarize what Scripture teaches and write a faithful response."
    ],
    faq: [
      ["What is topical Bible study?", "Topical Bible study traces a theme or question across several passages while reading each passage in context."],
      ["What topics are good to study?", "Prayer, wisdom, forgiveness, identity in Christ, suffering, comfort, generosity, and the fear of the Lord are common starting points."],
      ["What is the danger of topical study?", "The danger is proof-texting: collecting verses without respecting their original context."],
      ["Can I use topical study with a worksheet?", "Yes. A worksheet can help you record passages, context, patterns, and a faithful summary."]
    ],
    extraBlocks: [
      {
        type: "example",
        title: "Worked example: prayer",
        intro: "A topical study on prayer might compare several passages while letting each one keep its own voice.",
        items: [
          ["Matthew 6:9-13", "Jesus teaches prayer shaped by the Father’s name, kingdom, provision, forgiveness, and deliverance."],
          ["Philippians 4:6-7", "Paul connects prayer with thanksgiving and the peace of God in anxious circumstances."],
          ["James 1:5", "James encourages asking God for wisdom with trust."],
          ["Summary", "Prayer is not only asking for help. It is worship, dependence, confession, thanksgiving, trust, and seeking wisdom from God."]
        ]
      },
      {
        type: "checklist",
        title: "Topical study safeguards",
        intro: "Use these safeguards to avoid shallow proof-texting.",
        items: [
          "Have I read each passage in context?",
          "Am I collecting passages from different genres carefully?",
          "Have I noticed differences as well as similarities?",
          "Have I avoided forcing one passage to answer every question?",
          "Can I summarize the theme with humility and clarity?"
        ]
      },
      {
        type: "cta",
        title: "Start a topical study",
        intro: "Choose a theme, gather passages, and use Bible Study Tutor to save notes or print a worksheet for careful comparison.",
        href: "/?tab=study&method=topical-study",
        label: "Start topical study"
      }
    ]
  },
  {
    path: "/bible-study-methods/character-study",
    file: "bible-study-methods/character-study.html",
    title: "Bible Character Study Method | Learn from People in Scripture",
    description: "Use a Bible character study method to examine people in Scripture with context, faith, failure, God’s character, a worked example, safeguards, and checklist.",
    heading: "Bible character study method",
    intro: "Character study helps you learn from the people in Scripture while keeping the focus on God’s character, promises, warnings, and grace. The goal is not merely to copy heroes or avoid villains, but to see God at work in real lives.",
    sections: [
      ["Follow the person in context", "Read the passages where the person appears, noting setting, relationships, choices, conflicts, and turning points."],
      ["Notice faith and failure", "Ask what the person believed, feared, obeyed, resisted, learned, or misunderstood as the story unfolds."],
      ["Look beyond the example", "A character study is not just moral advice. Ask what the account reveals about God and how it points to faithful trust and obedience."],
      ["Respond carefully", "Apply the passage in a way that honours the story’s context, not by flattening every person into a simple lesson."]
    ],
    cta: "Start a character study",
    related: ["/bible-study-methods/topical-study", "/bible-study-methods/inductive", "/bible-study-methods/verse-mapping", "/bible-study-methods/cross-reference-study"],
    schemaType: "HowTo",
    howToSteps: [
      "Choose a person in Scripture and gather the key passages where they appear.",
      "Read each passage in context.",
      "Notice setting, choices, relationships, faith, failure, and turning points.",
      "Ask what the account reveals about God.",
      "Write a careful response shaped by the passage."
    ],
    faq: [
      ["What is a Bible character study?", "It is a study of a person in Scripture, their context, choices, faith, failure, and what their story reveals about God."],
      ["What is a good character to study first?", "Ruth, David, Peter, Mary, Joseph, Moses, Esther, and Paul are common starting points."],
      ["What mistake should I avoid?", "Avoid reducing the passage to moral advice without asking what God is revealing through the account."],
      ["Can character study be used in groups?", "Yes. It works well when the group reads the actual passages rather than only summarizing the person’s life."]
    ],
    extraBlocks: [
      {
        type: "example",
        title: "Worked example: Peter",
        intro: "Peter’s story includes bold confession, fear, failure, restoration, and Spirit-empowered witness.",
        items: [
          ["Context", "Read passages such as Matthew 16:13-20, Luke 22:54-62, John 21:15-19, and Acts 2."],
          ["Faith and failure", "Peter confesses Jesus as the Christ, denies Him under pressure, and is later restored by Jesus."],
          ["God’s grace", "The story highlights Christ’s patience, forgiveness, restoration, and commissioning grace."],
          ["Response", "A careful application could be repentance after failure and renewed trust in Christ’s restoring grace."]
        ]
      },
      {
        type: "checklist",
        title: "Character study checklist",
        intro: "Use this checklist to keep the study faithful to Scripture.",
        items: [
          "Have I read the main passages rather than only a summary?",
          "Have I noted setting, conflict, choices, and turning points?",
          "Have I noticed both faith and failure where present?",
          "Have I asked what the passage reveals about God?",
          "Have I avoided turning the person into a flat moral example?"
        ]
      },
      {
        type: "cta",
        title: "Start a character study",
        intro: "Choose a person in Scripture, gather the passages, and use Bible Study Tutor to save notes or print a study worksheet.",
        href: "/?tab=study&method=character-study",
        label: "Start a character study"
      }
    ]
  },
  {
    path: "/bible-study-methods/cross-reference-study",
    file: "bible-study-methods/cross-reference-study.html",
    title: "Cross Reference Bible Study Method | Let Scripture Interpret Scripture",
    description: "Use a cross reference Bible study method to compare related passages, clarify meaning, trace themes, avoid proof-texting, and study Scripture carefully.",
    heading: "Cross reference Bible study method",
    intro: "Cross-reference study helps you compare related passages so Scripture sheds light on Scripture without losing the main passage you started with. It is helpful for tracing quotations, themes, promises, background, and fulfilment.",
    sections: [
      ["Begin with one main text", "Choose a passage and identify the words, themes, quotations, or ideas that need to be compared with other Scriptures."],
      ["Compare related passages", "Read cross references carefully, noting similarities, differences, fulfilment, background, and how each passage contributes."],
      ["Avoid proof-texting", "Do not use related passages to override the original context. Cross references should clarify, not distract."],
      ["Return to the original passage", "Use the related passages to clarify meaning, then write a short summary of what the original passage teaches."]
    ],
    cta: "Study cross references",
    related: ["/bible-study-methods/verse-mapping", "/bible-study-methods/topical-study", "/how-to-study-a-bible-passage", "/bible-study-methods/word-study"],
    schemaType: "HowTo",
    howToSteps: [
      "Choose one main passage.",
      "Identify words, themes, quotations, or background that need comparison.",
      "Read related passages in their own contexts.",
      "Note similarities, differences, background, and fulfilment.",
      "Return to the main passage and summarize what became clearer."
    ],
    faq: [
      ["What is cross-reference Bible study?", "It is the practice of comparing related Scripture passages to clarify meaning, trace themes, and understand Scripture with Scripture."],
      ["What is the danger of cross references?", "The danger is leaving the main passage behind or using unrelated verses to force a preferred meaning."],
      ["Where should I start?", "Begin with one main passage, then compare references that clearly share words, quotations, themes, or background."],
      ["Is cross-reference study good for beginners?", "It can be, but beginners should keep the main passage short and avoid collecting too many references at once."]
    ],
    extraBlocks: [
      {
        type: "example",
        title: "Worked example: Matthew 4:1-11",
        intro: "Matthew 4 shows Jesus answering temptation with Scripture from Deuteronomy.",
        items: [
          ["Main text", "Read Matthew 4:1-11 and note each time Jesus says, “It is written.”"],
          ["Cross references", "Compare Deuteronomy 8:3, 6:16, and 6:13 in their original setting."],
          ["Clarification", "The references show Jesus trusting and obeying where Israel had failed in the wilderness."],
          ["Return", "The cross references deepen Matthew’s account, but the main passage remains Jesus’ faithful obedience under temptation."]
        ]
      },
      {
        type: "checklist",
        title: "Cross-reference checklist",
        intro: "Use this checklist before drawing conclusions.",
        items: [
          "Have I understood the main passage first?",
          "Are the cross references genuinely related?",
          "Have I read each related passage in context?",
          "Have I noticed differences as well as similarities?",
          "Can I explain how the cross reference clarifies the main passage?"
        ]
      },
      {
        type: "cta",
        title: "Study cross references carefully",
        intro: "Open a passage in Bible Study Tutor and use cross references to clarify meaning while keeping the main passage central.",
        href: "/?tab=study&method=cross-reference-study",
        label: "Start cross-reference study"
      }
    ]
  },
  {
    path: "/features",
    file: "features.html",
    title: "Bible Study Tutor Features | Read, Study, Journal, Memorize and Print",
    description: "Explore Bible Study Tutor features: Bible reader, Scripture search, guided study, printable worksheets, journal, memory verses, highlights, bookmarks, and private encouragements.",
    heading: "Bible Study Tutor features",
    intro: "Bible Study Tutor brings reading, study, memory, journaling, and simple community rhythms together in one free app.",
    sections: [
      ["Read and search Scripture", "Navigate by book and chapter, search exact words or themes, follow Bible reading plans, and send selected verses into Study."],
      ["Study with structure", "Use guided methods such as SOAP, OIA, Inductive Study, Lectio Divina, READ, HEAR, and COMA, or follow the site’s educational guides for other study approaches."],
      ["Save what matters", "Highlight verses, add notes, bookmark passages, save studies to your journal, and return to previous reflections by date or Scripture."],
      ["Memorize and review", "Save memory verses and practise them in three simple steps with blanks, hints, review dates, collections, and printable cards."],
      ["Print for paper study", "Create printable worksheets and memory cards for personal study, small groups, youth groups, church classes, and people who prefer handwriting."]
    ],
    schemaType: "FAQPage",
    faq: [
      ["What can I do in Bible Study Tutor?", "You can read Scripture, follow reading plans, study passages, save notes, highlight verses, memorize Scripture, print worksheets, and keep a Bible study journal."],
      ["Does Bible Study Tutor work on mobile?", "Yes. It is designed for desktop and mobile, with account sync available for signed-in users."],
      ["Can I use the app with paper worksheets?", "Yes. Printable Bible study worksheets and memory cards are part of the app's purpose."],
      ["Is there a public social feed?", "No. Community features are private and designed for trusted encouragement, not public posting."]
    ],
    cta: "Open the app",
    related: ["/bible-memory-verses", "/online-bible-study-journal", "/bible-highlighting-and-notes", "/printable-bible-study-worksheets", "/bible-reading-plan-app"],
    extraBlocks: [
      {
        type: "previews",
        title: "Feature pathways",
        intro: "New users can begin with the part of the app that matches their immediate need.",
        items: [
          ["Read", "Open the Bible reader, choose a book and chapter, or continue a reading plan."],
          ["Study", "Select a passage and use a guided method to write observations, application, and prayer."],
          ["Remember", "Save a verse to Memory and review it with blanks, hints, and scheduled practice."],
          ["Print", "Create a worksheet or memory cards for study away from the screen."],
          ["Journal", "Return to saved notes, studies, meditations, highlights, and bookmarks."]
        ]
      },
      {
        type: "cta",
        title: "Open Bible Study Tutor",
        intro: "Start with the Bible reader, a guided study method, or memory verses depending on what you want to do next.",
        href: "/?tab=home",
        label: "Open the app"
      }
    ]
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
      ["Built for steady habits", "Daily rhythm, memory review, bookmarks, notes, reading plans, and journal history help users keep returning to Scripture without turning study into a complicated system."],
      ["Privacy-aware by design", "The app avoids public timelines and does not need to turn private study notes, answers, prayers, or journal entries into public content."],
      ["Useful for churches", "Because the core tools are free, a church or small group can recommend the app without asking people to pay for the basic study experience."]
    ],
    schemaType: "FAQPage",
    faq: [
      ["Is Bible Study Tutor really free?", "Yes. The core app is intended to remain free for Bible reading, guided study, journaling, memory verses, and printable worksheets."],
      ["Why is the app free?", "The goal is to make practical Bible study tools accessible to individuals, small groups, and churches without a paywall."],
      ["Can I use Bible Study Tutor without an account?", "Yes. You can explore the app without signing in. A free account helps sync saved progress across devices."],
      ["Why are some Bible translations limited?", "Some modern Bible translations require separate publisher permission or paid licensing. Bible Study Tutor uses legally available Bible texts so the app can stay free."]
    ],
    cta: "Start studying free",
    related: ["/about", "/features", "/bible-study-for-beginners", "/pricing", "/bible-study-app-for-churches"],
    extraBlocks: [
      {
        type: "list",
        title: "What is included free",
        intro: "The free app experience is designed around practical Scripture engagement.",
        items: [
          "Bible reading by book and chapter.",
          "Bible search and selected passage study.",
          "Guided methods such as SOAP, OIA, Inductive Study, Lectio Divina, READ, HEAR, and COMA.",
          "Journal entries, highlights, bookmarks, and notes.",
          "Memory verse review, collections, and printable cards.",
          "Printable Bible study worksheets for personal or group use."
        ]
      },
      {
        type: "cta",
        title: "Start studying free",
        intro: "Open Bible Study Tutor and begin with Scripture, a guided method, or a printable worksheet.",
        href: "/?tab=home",
        label: "Start studying free"
      }
    ]
  },
  {
    path: "/bible-study-for-beginners",
    file: "bible-study-for-beginners.html",
    title: "Bible Study for Beginners | Simple Guided Scripture Study",
    description: "Start Bible study as a beginner with simple steps, recommended passages, guided methods, examples, printable worksheets, and clear next actions.",
    heading: "Bible study for beginners",
    intro: "Bible Study Tutor helps new Bible readers slow down and understand a passage one step at a time, without needing to know where to begin. Start small, stay close to the text, and let Scripture shape prayer and response.",
    sections: [
      ["Start with a short passage", "Open a chapter, select a few verses, and send them into Study so the app can guide you through the passage. A paragraph is usually better than a whole book when you are learning."],
      ["Use clear prompts", "Methods such as SOAP, OIA, and READ ask simple questions about what you notice, what the passage means, and how to respond."],
      ["Ask simple questions", "Begin with questions like: What does this say about God? What is happening here? Is there a command, promise, warning, or comfort? How should I pray in response?"],
      ["Keep a record", "Save studies to your journal so your understanding, prayers, and next steps are easy to revisit later."]
    ],
    cta: "Open guided study",
    related: ["/how-to-study-the-bible", "/how-to-study-a-bible-passage", "/bible-study-methods/soap", "/printable-soap-bible-study-worksheet"],
    schemaType: "HowTo",
    howToSteps: [
      "Choose a short passage from a Gospel, Psalm, or New Testament letter.",
      "Read the passage slowly and notice repeated words or main ideas.",
      "Use SOAP or OIA to write observations, meaning, application, and prayer.",
      "Save the study to your journal or print a worksheet.",
      "Return later to review what you learned or memorize one verse."
    ],
    faq: [
      ["Where should a beginner start reading the Bible?", "Many beginners start with the Gospel of John, Mark, a Psalm, or a short New Testament passage."],
      ["What Bible study method is best for beginners?", "SOAP is often a good first method because it is simple: Scripture, Observation, Application, and Prayer."],
      ["Do I need a Bible study account to begin?", "No. You can explore Bible Study Tutor first. A free account helps save progress across devices."],
      ["Should beginners study alone or with others?", "Both can be helpful. Personal study builds rhythm, while a church, mentor, or small group can help with questions and encouragement."]
    ],
    extraBlocks: [
      {
        type: "list",
        title: "Good starter passages",
        intro: "These passages are short enough to study carefully and rich enough to begin meaningful reflection.",
        items: [
          "John 1:1-5 for seeing Jesus as the Word and light.",
          "Psalm 23 for learning to pray trust in God’s care.",
          "Mark 1:14-20 for seeing Jesus call people to follow Him.",
          "Romans 8:1-4 for understanding grace and life in Christ.",
          "James 1:2-8 for wisdom, trials, and prayer."
        ]
      },
      {
        type: "example",
        title: "Beginner example: John 15:5",
        intro: "A beginner study does not need to be long. John 15:5 can be studied with a few careful questions.",
        items: [
          ["Notice", "Jesus says He is the vine and His disciples are branches. The picture shows dependence and connection."],
          ["Understand", "The verse teaches that fruitful life comes from abiding in Christ, not from spiritual self-effort."],
          ["Respond", "A beginner application might be to pray before work, study, parenting, or ministry, acknowledging dependence on Jesus."],
          ["Remember", "This verse can also become a memory verse because it is short and central to daily trust."]
        ]
      },
      {
        type: "checklist",
        title: "Beginner Bible study checklist",
        intro: "Use this simple pattern when you are not sure what to do next.",
        items: [
          "Read a short passage slowly.",
          "Write one thing you notice.",
          "Ask what the passage shows about God, people, sin, grace, or faith.",
          "Write one honest response.",
          "Pray using words shaped by the passage."
        ]
      },
      {
        type: "cta",
        title: "Start your first guided study",
        intro: "Open Bible Study Tutor, choose a short passage, and let the guided prompts help you take the next step.",
        href: "/?tab=study&method=soap",
        label: "Start a beginner study"
      }
    ]
  },
  {
    path: "/printable-bible-study-worksheet-for-small-groups",
    file: "printable-bible-study-worksheet-for-small-groups.html",
    title: "Printable Bible Study Worksheet for Small Groups | Free Group Study Sheet",
    description: "Create printable Bible study worksheets for small groups with selected Scripture, guided questions, leader workflow, example passages, discussion prompts, and prayer space.",
    heading: "Printable Bible study worksheet for small groups",
    intro: "Bible Study Tutor can help small group leaders prepare simple Scripture worksheets that work well around a table, in a class, or in a church group. A good worksheet gives people room to observe the passage before the discussion starts.",
    sections: [
      ["Choose the passage", "Select the verses your group will study and print the Scripture with enough room for people to write their own observations. A short passage usually creates better discussion than a large section rushed through quickly."],
      ["Use a shared method", "SOAP, OIA, Inductive Study, and Lectio Divina can give the group a common rhythm without making the handout complicated."],
      ["Encourage discussion", "Printed worksheets help people arrive prepared, record prayer points, and keep a useful record after the meeting."],
      ["Leave space for prayer", "A group worksheet should end with prayer, response, or encouragement so the discussion moves from information to faithful living."]
    ],
    cta: "Print a worksheet",
    related: ["/bible-study-for-small-groups", "/printable-bible-study-worksheets", "/bible-study-methods/soap", "/bible-study-methods/oia"],
    schemaType: "FAQPage",
    faq: [
      ["What should a small group Bible study worksheet include?", "It should include the Scripture passage, observation prompts, discussion questions, application space, and prayer response."],
      ["How long should the passage be?", "A paragraph or short section usually works best for a group discussion."],
      ["Can the worksheet be used before the meeting?", "Yes. Leaders can send or print the worksheet ahead of time so people arrive ready to discuss."],
      ["Which method works best for small groups?", "SOAP works well for simple reflection, while OIA and Inductive Study are helpful when a group wants deeper observation and interpretation."]
    ],
    extraBlocks: [
      {
        type: "list",
        title: "Small group worksheet flow",
        intro: "A clear worksheet can support the whole meeting without taking it over.",
        items: [
          "Read the passage aloud together.",
          "Give people quiet time to write observations.",
          "Discuss what the passage means in context.",
          "Invite specific applications rather than vague answers.",
          "Close with prayer shaped by the passage."
        ]
      },
      {
        type: "example",
        title: "Example passage: Colossians 3:12-17",
        intro: "Colossians 3:12-17 works well for a group because it includes identity, character, relationships, worship, and gratitude.",
        items: [
          ["Observation", "Ask the group to list the commands and character qualities in the passage."],
          ["Interpretation", "Discuss how the commands flow from being chosen, holy, and beloved."],
          ["Application", "Invite each person to choose one relationship where patience, forgiveness, or gratitude needs to be practised."],
          ["Prayer", "Pray for the group to be shaped by Christ’s peace, word, and love."]
        ]
      },
      {
        type: "checklist",
        title: "Leader preparation checklist",
        intro: "Before printing the worksheet, check that it will serve the discussion well.",
        items: [
          "Is the passage short enough to study carefully?",
          "Are the questions tied to the text?",
          "Is there space for quiet written reflection?",
          "Is there a prayer or application section?",
          "Can people keep the worksheet as a useful record?"
        ]
      },
      {
        type: "cta",
        title: "Print a small group worksheet",
        intro: "Open the Bible reader, select your group passage, and print a worksheet using SOAP, OIA, Inductive Study, or another guided method.",
        href: "/?tab=bible",
        label: "Print a group worksheet"
      }
    ]
  },
  {
    path: "/printable-soap-bible-study-worksheet",
    file: "printable-soap-bible-study-worksheet.html",
    title: "Printable SOAP Bible Study Worksheet | Free Scripture Study Sheet",
    description: "Learn how to use a printable SOAP Bible study worksheet with step-by-step guidance, a worked example, common mistakes, FAQs, and a free worksheet CTA.",
    heading: "Printable SOAP Bible study worksheet",
    intro: "A printable SOAP worksheet gives readers a simple way to slow down with Scripture, write observations, apply the passage, and respond in prayer. It is useful for personal devotions, small groups, youth groups, sermon reflection, and anyone who studies best with pen and paper.",
    sections: [
      ["What SOAP stands for", "SOAP stands for Scripture, Observation, Application, and Prayer. The method keeps the Bible text first, then helps you notice what the passage says, respond personally, and pray from Scripture."],
      ["Scripture section", "Choose the passage and print the selected verses so the study begins with the Bible text, not only a blank form. A short passage usually works best: one verse, a paragraph, or a small section."],
      ["Observation section", "Write what you can see in the passage before jumping to application. Look for repeated words, commands, promises, contrasts, people, questions, reasons, and what the passage reveals about God."],
      ["Application section", "Ask how the passage calls for trust, obedience, repentance, worship, comfort, patience, or encouragement. Keep the response specific enough to practise today."],
      ["Prayer section", "Finish with a prayer shaped by the passage. This helps the study become a response to God rather than only a written exercise."]
    ],
    cta: "Print a SOAP worksheet",
    related: ["/bible-study-methods/soap", "/printable-bible-study-worksheets", "/printable-bible-study-worksheet-for-small-groups", "/bible-study-app-with-printable-worksheets"],
    schemaType: "HowTo",
    howToSteps: [
      "Choose a short Bible passage and read it slowly in context.",
      "Write the Scripture reference and selected text in the worksheet.",
      "Record observations from the passage before deciding how it applies.",
      "Write one specific application shaped by the passage.",
      "Pray in response to what Scripture has shown you."
    ],
    faq: [
      ["What does SOAP stand for?", "SOAP stands for Scripture, Observation, Application, and Prayer."],
      ["Is SOAP good for beginners?", "Yes. SOAP is simple enough for beginners while still encouraging careful attention to the Bible text."],
      ["How long should the passage be?", "A short passage usually works best. Start with one verse, one paragraph, or a small section rather than a whole chapter."],
      ["Can SOAP worksheets be used in groups?", "Yes. A group can study the same passage, write individually, then discuss observations, applications, and prayer responses together."],
      ["Can I print a SOAP worksheet from Bible Study Tutor?", "Yes. Open the Bible reader, select a passage, choose the worksheet option, and print or save the SOAP worksheet."]
    ],
    extraBlocks: [
      {
        type: "example",
        title: "Worked SOAP example: Psalm 23:1",
        intro: "Here is a simple example using Psalm 23:1: “The LORD is my shepherd; I shall not want.”",
        items: [
          ["Scripture", "Psalm 23:1 says that the LORD is the shepherd of His people. The verse is short, but it gives a strong picture of God’s care, guidance, and provision."],
          ["Observation", "David describes the LORD personally as “my shepherd.” The result is contentment and trust: “I shall not want.” The verse points to dependence on God rather than self-sufficiency."],
          ["Application", "Today I can bring my needs and anxieties to God instead of carrying them alone. I can ask whether I am trusting Him as shepherd or trying to shepherd myself."],
          ["Prayer", "Lord, teach me to trust You as my shepherd. Help me receive Your care, follow Your leading, and rest in Your provision today."]
        ]
      },
      {
        type: "checklist",
        title: "SOAP worksheet checklist",
        intro: "Before finishing your worksheet, check that each section is doing its job.",
        items: [
          "Did I read the passage in context?",
          "Did I write the Scripture reference clearly?",
          "Did my observations come from the passage rather than my first impression only?",
          "Did I keep application specific and realistic?",
          "Did my prayer respond to what the passage actually says?",
          "Did I note any question worth studying later?"
        ]
      },
      {
        type: "checklist",
        title: "Common SOAP mistakes to avoid",
        intro: "SOAP is simple, but these mistakes can make it shallow or disconnected from Scripture.",
        items: [
          "Do not skip observation and move straight to personal application.",
          "Do not make the application so broad that it cannot be practised.",
          "Do not treat the prayer section as unrelated to the passage.",
          "Do not choose too much Scripture if the worksheet is for careful reflection.",
          "Do not use SOAP as a replacement for deeper study when a passage needs more context."
        ]
      },
      {
        type: "list",
        title: "Ways to use a printable SOAP worksheet",
        intro: "A printed SOAP worksheet can help in several settings where writing by hand slows the study down.",
        items: [
          "Personal quiet time: print one passage and keep the completed sheet in a journal or Bible.",
          "Small groups: give everyone the same passage, then discuss observations before applications.",
          "Youth groups: use one short passage and invite students to write one honest prayer response.",
          "Sermon follow-up: print the Sunday passage and use SOAP during the week.",
          "Family devotions: study one verse together and let each person write or share a short response."
        ]
      },
      {
        type: "cta",
        title: "Print a SOAP worksheet in Bible Study Tutor",
        intro: "Open the Bible reader, select a passage, choose the worksheet option, and print or save a SOAP worksheet for desktop, mobile, or paper study.",
        href: "/?tab=bible",
        label: "Print a SOAP worksheet"
      }
    ]
  },
  {
    path: "/printable-inductive-bible-study-worksheet",
    file: "printable-inductive-bible-study-worksheet.html",
    title: "Printable Inductive Bible Study Worksheet | Observation, Interpretation, Application",
    description: "Create a printable inductive Bible study worksheet with step-by-step guidance, observation prompts, interpretation safeguards, examples, FAQs, and worksheet CTA.",
    heading: "Printable inductive Bible study worksheet",
    intro: "An inductive worksheet helps readers slow down, mark observations, interpret the passage in context, and write a specific response. It works well for deeper personal study, small groups, Bible classes, and sermon follow-up.",
    sections: [
      ["Observation space", "Record repeated words, structure, commands, contrasts, people, places, and questions directly from the passage. This section should be filled from the text, not from assumptions."],
      ["Interpretation prompts", "Use context, surrounding verses, author, audience, and related Scripture to ask what the passage means before applying it."],
      ["Application response", "Write one clear next step, prayer, or truth to remember after studying the passage. The application should be specific and tied to the passage."],
      ["Questions to revisit", "A good worksheet leaves room for honest questions. Some passages need further study, discussion, or help from a trusted teacher."]
    ],
    cta: "Print an inductive worksheet",
    related: ["/bible-study-methods/inductive", "/how-to-study-a-bible-passage", "/printable-bible-study-worksheets", "/bible-study-worksheet-for-church-groups"],
    schemaType: "HowTo",
    howToSteps: [
      "Choose a passage and print it with space for notes.",
      "Write observations from the passage before interpreting it.",
      "Use context and related Scripture to understand the meaning.",
      "Summarize the main point of the passage.",
      "Write a specific application and prayer response."
    ],
    faq: [
      ["What is an inductive Bible study worksheet?", "It is a worksheet that guides readers through observation, interpretation, and application."],
      ["How is it different from a SOAP worksheet?", "SOAP is simpler and more devotional. Inductive study gives more space to careful observation and interpretation."],
      ["Can this be used in a Bible class?", "Yes. It works well when a teacher wants people to observe the passage before discussion."],
      ["Can I print one from my phone?", "Yes. Open the worksheet preview, then use the browser share, print, or save-as-PDF controls."]
    ],
    extraBlocks: [
      {
        type: "example",
        title: "Example worksheet flow: Ephesians 2:8-10",
        intro: "Ephesians 2:8-10 is a helpful short passage for inductive study because it includes grace, faith, works, and purpose.",
        items: [
          ["Observation", "Notice repeated ideas: grace, faith, gift, works, created, and walk. The passage contrasts salvation by grace with boasting in works."],
          ["Interpretation", "In context, Paul is explaining what God has done in Christ. Good works do not earn salvation; they are prepared by God as the fruit of His saving grace."],
          ["Application", "A faithful response might include humility before God, gratitude for grace, and a willingness to walk in the good works God gives."],
          ["Prayer", "Lord, keep me from boasting in myself. Help me receive grace with humility and walk faithfully in what You prepare."]
        ]
      },
      {
        type: "checklist",
        title: "Worksheet checklist",
        intro: "A useful inductive worksheet should help readers keep each step clear.",
        items: [
          "Is there enough room for observations from the passage?",
          "Does the worksheet ask context questions before application?",
          "Is there space to summarize the main point?",
          "Does the application section ask for a specific response?",
          "Is there room for prayer and unresolved questions?"
        ]
      },
      {
        type: "cta",
        title: "Print an inductive worksheet",
        intro: "Select a passage in Bible Study Tutor and print a worksheet with guided space for observation, interpretation, application, and prayer.",
        href: "/?tab=bible",
        label: "Print an inductive worksheet"
      }
    ]
  },
  {
    path: "/printable-bible-study-journal",
    file: "printable-bible-study-journal.html",
    title: "Printable Bible Study Journal | Free Scripture Reflection Pages",
    description: "Use printable Bible study journal pages with Scripture notes, prayer, reflection prompts, examples, journaling rhythms, and paper study workflows.",
    heading: "Printable Bible study journal",
    intro: "Printable Bible study journal pages give people room to write by hand while still following a clear Scripture-centred rhythm. They are helpful for quiet time, sermon reflection, guided study, memory verses, and prayer.",
    sections: [
      ["Write Scripture notes", "Use journal space for observations, questions, key words, cross references, and what the passage reveals about God."],
      ["Record prayer and response", "Turn study into prayer, application, repentance, gratitude, or encouragement for someone else."],
      ["Keep a study record", "A paper journal can help you see what you have been reading, praying, wrestling with, and returning to over time."],
      ["Use alongside the app", "Bible Study Tutor supports both digital journaling and printable worksheets so people can study in the format that helps them most."]
    ],
    cta: "Open journal tools",
    related: ["/bible-study-journal", "/online-bible-study-journal", "/bible-study-methods/verse-mapping", "/printable-bible-study-worksheets"],
    schemaType: "FAQPage",
    faq: [
      ["What should I write in a Bible study journal?", "You can write observations, questions, prayers, applications, memory verses, cross references, and reflections from the passage."],
      ["Is a printable journal different from a worksheet?", "A worksheet usually guides one study session. A journal helps you keep a longer record of study, prayer, and reflection."],
      ["Can I use paper and the app together?", "Yes. You can print pages for handwriting and still use the app for Bible reading, memory verses, and saved notes."],
      ["How often should I journal?", "Start small. Journaling once or twice a week after a Bible reading or guided study can build a steady rhythm."]
    ],
    extraBlocks: [
      {
        type: "list",
        title: "Simple journal rhythm",
        intro: "A printable journal works best when the prompts are repeatable.",
        items: [
          "Write the date and Scripture reference.",
          "Record one observation from the passage.",
          "Write one question or word to study further.",
          "Note one response of faith, obedience, repentance, or prayer.",
          "Choose one verse to remember or revisit."
        ]
      },
      {
        type: "example",
        title: "Example journal entry: Psalm 46:1",
        intro: "A journal entry can be short and still useful.",
        items: [
          ["Scripture", "Psalm 46:1 says God is refuge, strength, and a present help in trouble."],
          ["Observation", "The verse does not deny trouble. It describes God’s nearness and strength within trouble."],
          ["Response", "I can bring fear to God honestly instead of pretending I am strong by myself."],
          ["Prayer", "Lord, be my refuge today. Help me trust Your nearness when I feel weak."]
        ]
      },
      {
        type: "cta",
        title: "Print a journal-style worksheet",
        intro: "Choose a passage in Bible Study Tutor and print a worksheet you can keep as part of a paper Bible study journal.",
        href: "/?tab=bible",
        label: "Print a journal page"
      }
    ]
  },
  {
    path: "/bible-study-worksheet-for-youth-groups",
    file: "bible-study-worksheet-for-youth-groups.html",
    title: "Bible Study Worksheet for Youth Groups | Printable Scripture Study",
    description: "Create printable Bible study worksheets for youth groups with Scripture, simple prompts, discussion flow, example passages, leader tips, and prayer response.",
    heading: "Bible study worksheet for youth groups",
    intro: "Youth group Bible study worksheets should be clear, Scripture-centred, and practical enough to help students read, think, discuss, and respond. A good worksheet gives students time to notice the Bible text before answering out loud.",
    sections: [
      ["Keep the passage visible", "Print the selected Scripture so students can mark, reread, and discuss the passage without needing to switch apps or screens."],
      ["Use simple guided prompts", "SOAP, OIA, and READ-style questions help students notice what the passage says and how to respond."],
      ["Support discussion", "Worksheets can give quieter students time to think and write before sharing in a youth group setting."],
      ["End with prayer", "A youth worksheet should help students turn the passage into honest prayer, not only correct answers."]
    ],
    cta: "Prepare a youth worksheet",
    related: ["/printable-bible-study-worksheets", "/bible-study-methods/soap", "/bible-study-methods/oia", "/bible-study-for-beginners"],
    schemaType: "FAQPage",
    faq: [
      ["What makes a good youth Bible study worksheet?", "It should keep the passage visible, use clear prompts, allow quiet thinking time, and end with practical prayer or response."],
      ["How long should a youth group passage be?", "A short passage or paragraph is usually best, especially when discussion time is limited."],
      ["Can students use SOAP?", "Yes. SOAP is simple enough for students because it gives four clear steps: Scripture, Observation, Application, and Prayer."],
      ["Should youth worksheets include answers?", "They can include prompts, but it is often better to help students observe the passage themselves before giving summary answers."]
    ],
    extraBlocks: [
      {
        type: "example",
        title: "Example youth study: Matthew 5:14-16",
        intro: "Matthew 5:14-16 is short, visual, and practical, which makes it useful for youth discussion.",
        items: [
          ["Read", "Read the passage aloud and ask students to underline words about light, visibility, and good works."],
          ["Notice", "Ask what Jesus says His followers are and what their lives should point toward."],
          ["Discuss", "Talk about ordinary places where students are tempted to hide their faith or seek attention for themselves."],
          ["Pray", "Pray for courage to live visibly for God’s glory, not personal praise."]
        ]
      },
      {
        type: "checklist",
        title: "Youth leader checklist",
        intro: "Keep the worksheet focused and student-friendly.",
        items: [
          "Is the passage short and readable?",
          "Are the questions clear enough for different reading levels?",
          "Is there room for students to write quietly?",
          "Does the discussion return to the passage?",
          "Is there a prayer or action step?"
        ]
      },
      {
        type: "cta",
        title: "Prepare a youth group worksheet",
        intro: "Open the Bible reader, choose a short passage, and print a worksheet with simple guided prompts.",
        href: "/?tab=bible",
        label: "Prepare a youth worksheet"
      }
    ]
  },
  {
    path: "/bible-study-worksheet-for-church-groups",
    file: "bible-study-worksheet-for-church-groups.html",
    title: "Bible Study Worksheet for Church Groups | Printable Group Study Pages",
    description: "Create printable Bible study worksheets for church groups with Scripture passages, guided questions, discussion flow, leader use cases, privacy notes, and prayer space.",
    heading: "Bible study worksheet for church groups",
    intro: "Church group worksheets help people study the same passage together while leaving space for personal notes, prayer, and discussion. They can support small groups, classes, sermon follow-up, youth ministry, and discipleship pathways.",
    sections: [
      ["Use one shared passage", "Print the selected Scripture and method prompts so everyone can follow the same study path during the group."],
      ["Make room for prayer", "Include space for reflection, prayer points, application, and encouragement after the discussion."],
      ["Serve different learning styles", "Printable worksheets help people who prefer handwriting, need structure, or want to keep a paper record."],
      ["Keep technology optional", "A church can recommend the app while still serving people who would rather use printed pages."]
    ],
    cta: "Prepare a church worksheet",
    related: ["/bible-study-app-for-churches", "/printable-bible-study-worksheet-for-small-groups", "/bible-study-methods/inductive", "/bible-study-for-small-groups"],
    schemaType: "FAQPage",
    faq: [
      ["Can churches print worksheets for free?", "Yes. Bible Study Tutor is designed so churches can print worksheets without asking members to pay for basic Bible study tools."],
      ["What church settings work well for worksheets?", "Small groups, Bible classes, youth groups, sermon follow-up, pastoral care, and new believer studies can all use printed worksheets."],
      ["Do worksheets replace group teaching?", "No. They support Scripture reading, preparation, discussion, and prayer. They should serve the local church’s teaching and discipleship."],
      ["Can people keep notes private?", "Yes. Printed notes stay with the person, and the app is designed without a public timeline."]
    ],
    extraBlocks: [
      {
        type: "list",
        title: "Church use cases",
        intro: "A printable worksheet can serve several ordinary ministry moments.",
        items: [
          "Sermon follow-up: print the Sunday passage with observation and application prompts.",
          "Bible class: give learners space to mark structure and write questions.",
          "Pastoral care: provide a short comfort passage with prayer space.",
          "New believer study: use a simple method with foundational passages.",
          "Youth or family ministry: choose a short passage and simple discussion prompts."
        ]
      },
      {
        type: "example",
        title: "Example church worksheet: Acts 2:42-47",
        intro: "Acts 2:42-47 can help a church group reflect on Scripture, fellowship, prayer, generosity, and witness.",
        items: [
          ["Observation", "List the practices of the early believers and notice what is repeated or emphasized."],
          ["Interpretation", "Discuss how the passage describes the life of the early church without treating every detail as a program to copy mechanically."],
          ["Application", "Ask how your group can grow in devotion to Scripture, prayer, generosity, and hospitality."],
          ["Prayer", "Pray for a church life shaped by the apostles’ teaching, fellowship, breaking of bread, and prayers."]
        ]
      },
      {
        type: "cta",
        title: "Prepare a church group worksheet",
        intro: "Choose a passage in Bible Study Tutor and print a worksheet for a class, group, or sermon follow-up.",
        href: "/?tab=bible",
        label: "Prepare a church worksheet"
      }
    ]
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
      ["Connect study with prayer", "Use the journal to record what you noticed, how Scripture corrected or encouraged you, and how you want to respond."],
      ["Use pinned entries carefully", "Pin entries you want to revisit, such as a repeated question, an important memory verse, a completed meditation, or a passage you are still praying through."],
      ["Keep private reflections private", "The journal is designed for personal Scripture notes and reflection, not a public social feed."]
    ],
    schemaType: "FAQPage",
    faq: [
      ["What can I save in the online Bible study journal?", "You can save guided studies, drafts, meditations, highlights, bookmarks, notes, prayers, and reflections."],
      ["Can I find old journal entries?", "Yes. Filters help you return to entries by Scripture, type, date, status, or pinned favourites."],
      ["Is the journal public?", "No. The journal is for private study and reflection."],
      ["Can I use the journal across devices?", "A free signed-in account helps keep saved study material available across devices."]
    ],
    cta: "Open the journal",
    related: ["/bible-study-methods", "/bible-highlighting-and-notes", "/bible-memory-verses", "/bible-study-journal"],
    extraBlocks: [
      {
        type: "list",
        title: "Helpful journal entry types",
        intro: "A useful journal can include more than long written reflections.",
        items: [
          "A short observation from a passage.",
          "A question to revisit later.",
          "A prayer shaped by Scripture.",
          "A highlighted or bookmarked passage.",
          "A completed meditation with notice, reflect, pray, and carry prompts.",
          "A memory verse you want to keep reviewing."
        ]
      },
      {
        type: "cta",
        title: "Open your online Bible journal",
        intro: "Use the Journal tab to revisit saved studies, notes, meditations, highlights, and Scripture reflections.",
        href: "/?tab=journal",
        label: "Open the journal"
      }
    ]
  },
  {
    path: "/bible-study-journal",
    file: "bible-study-journal.html",
    title: "Bible Study Journal | Save Scripture Notes, Prayers and Reflections",
    description: "Use a Bible study journal to save Scripture notes, prayers, reflections, meditations, highlights, bookmarks, and completed studies.",
    heading: "Bible study journal",
    intro: "A Bible study journal helps you remember what you have read, how you prayed, and how Scripture shaped your thinking over time.",
    sections: [
      ["Save more than notes", "Bible Study Tutor can keep guided studies, meditations, highlights, bookmarks, drafts, prayers, and reflections together."],
      ["Find your way back", "Filter journal entries by Scripture, date, type, status, or pinned favourites when you want to revisit a passage."],
      ["Connect reading with memory", "Journal entries can sit alongside highlighted passages and saved memory verses so Scripture is easier to return to through the week."],
      ["Build a record of growth", "Your journal becomes a quiet history of what you have noticed, prayed, and returned to in Scripture."]
    ],
    schemaType: "FAQPage",
    faq: [
      ["What goes into a Bible study journal?", "A journal can include observations, questions, prayers, applications, highlights, bookmarks, meditations, memory verses, and completed studies."],
      ["How is the journal different from notes?", "Notes can be attached to passages, while the journal gives a broader place to revisit saved studies, meditations, highlights, bookmarks, and reflections."],
      ["Can I filter journal entries?", "Yes. Bible Study Tutor includes filters for finding entries by Scripture, date, type, status, or pinned favourites."],
      ["Can I use the journal without sharing publicly?", "Yes. The journal is for private study and reflection, not a public timeline."]
    ],
    cta: "Open the journal",
    related: ["/online-bible-study-journal", "/how-to-study-a-bible-passage", "/bible-highlighting-and-notes", "/bible-memory-verses"],
    extraBlocks: [
      {
        type: "example",
        title: "Example journal entry structure",
        intro: "A helpful journal entry does not need to be long. It simply records what you saw and how you want to respond.",
        items: [
          ["Passage", "Romans 8:1-4"],
          ["Observation", "Paul emphasizes no condemnation in Christ and life by the Spirit."],
          ["Reflection", "I often live as though guilt has the final word, but this passage calls me back to Christ."],
          ["Prayer", "Lord, help me trust Your grace and walk by the Spirit today."],
          ["Next step", "Return to Romans 8:1 this week as a memory verse."]
        ]
      },
      {
        type: "checklist",
        title: "Bible journal prompts",
        intro: "Use these prompts when you are not sure what to write.",
        items: [
          "What did I notice in the passage?",
          "What does this show me about God, Christ, people, sin, grace, or obedience?",
          "What question do I need to keep exploring?",
          "How should I pray in response?",
          "What is one concrete way to remember or obey this passage?"
        ]
      },
      {
        type: "cta",
        title: "Open your Bible study journal",
        intro: "Save a study, revisit notes, or return to Scripture you have highlighted and bookmarked.",
        href: "/?tab=journal",
        label: "Open the journal"
      }
    ]
  },
  {
    path: "/bible-memory-verses",
    file: "bible-memory-verses.html",
    title: "Bible Memory Verses | Save, Review and Memorize Scripture",
    description: "Save Bible memory verses, review them in three steps, use hints, group verses into collections, and print memory cards to keep Scripture close through the day.",
    heading: "Bible memory verses with review and reflection",
    intro: "Bible Study Tutor helps users save favourite verses, review them over time, practise fill-in-the-blank recall, reflect prayerfully on Scripture, and print memory cards.",
    sections: [
      ["Three-step review", "Read the verse, practise with some words hidden, then recall the verse with all words blanked out."],
      ["Review at your pace", "Set review dates from daily to annual rhythms, sort due and reviewed verses, and group passages into collections."],
      ["Keep Scripture close", "Print memory cards for selected saved verses so Scripture can be placed around the home, kept in a Bible, or shared with a group."],
      ["Reflect before reviewing", "Meditation prompts help users slow down and think about what the verse reveals, how to pray, and how to carry the passage into the day."],
      ["Group verses by theme", "Collections can gather verses around themes such as identity in Christ, prayer, comfort, wisdom, faith, or a book of the Bible."]
    ],
    schemaType: "FAQPage",
    faq: [
      ["How does Bible Study Tutor help with memory verses?", "It lets users save verses, practise with blanks and hints, set review rhythms, group verses into collections, and print memory cards."],
      ["Can I memorize more than one verse?", "Yes. You can save individual verses, passages, or themed collections and review them over time."],
      ["What are memory verse collections?", "Collections let you group saved verses by theme, book, topic, or study purpose."],
      ["Can I print memory verses?", "Yes. Saved verses can be printed as memory cards."]
    ],
    cta: "Open memory verses",
    related: ["/scripture-memorization-app", "/printable-bible-memory-cards", "/features", "/how-to-memorize-bible-verses"],
    extraBlocks: [
      {
        type: "example",
        title: "Example memory collection: identity in Christ",
        intro: "A collection can help users review related passages together instead of treating every verse as isolated.",
        items: [
          ["Romans 8:1", "A verse for remembering there is no condemnation in Christ."],
          ["2 Corinthians 5:17", "A verse for remembering new creation in Christ."],
          ["Ephesians 2:8-10", "A passage for remembering grace, faith, and prepared good works."],
          ["Galatians 2:20", "A verse for remembering life by faith in the Son of God."]
        ]
      },
      {
        type: "checklist",
        title: "Memory verse review checklist",
        intro: "Memorization is more useful when it stays connected to meaning and prayer.",
        items: [
          "Have I read the verse in context?",
          "Can I explain the verse in my own words?",
          "Have I prayed through the verse?",
          "Do I need to group this verse with a related theme?",
          "Would a printed card help me review it during the week?"
        ]
      },
      {
        type: "cta",
        title: "Open memory verses",
        intro: "Save a verse, practise recall, reflect prayerfully, or print memory cards.",
        href: "/?tab=memory",
        label: "Open memory verses"
      }
    ]
  },
  {
    path: "/scripture-memorization-app",
    file: "scripture-memorization-app.html",
    title: "Scripture Memorization App | Practice Verses with Blanks and Hints",
    description: "Use a Scripture memorization app with fill-in-the-blank practice, hints, review schedules, collections, Scripture reflection, and memory history.",
    heading: "Scripture memorization with blanks, hints, and review",
    intro: "Bible Study Tutor makes memorization practical by combining saved verses, typed recall, gentle hints, review scheduling, Scripture-centred reflection prompts, and memory history.",
    sections: [
      ["Practise actively", "Instead of only rereading, users type missing words and receive clear feedback as they remember each verse."],
      ["Use helpful hints", "Hints can reveal more of a difficult word when needed, while still encouraging users to recall the verse for themselves."],
      ["Track progress", "Memory history and milestones show recent reviews, rhythms, added verses, and verses worth revisiting."],
      ["Meditate on the verse", "Scripture meditation mode helps users notice, reflect, pray, and carry a verse rather than only testing recall."],
      ["Print and review offline", "Memory cards can be printed so Scripture can be reviewed away from the screen."]
    ],
    schemaType: "FAQPage",
    faq: [
      ["What makes Scripture memorization more effective?", "Active recall, repeated review, prayerful reflection, and reviewing verses in context all help Scripture memory become more meaningful."],
      ["Does the app only test exact typing?", "The review flow is designed to help users practise recall with blanks, hints, and feedback, while still encouraging careful memory of the verse."],
      ["Can I review verses by theme?", "Yes. Collections can group memory verses by topic, book, or personal study focus."],
      ["Can I use memorization without staying on my phone?", "Yes. Printable memory cards let users review Scripture away from the screen."]
    ],
    cta: "Try memory practice",
    related: ["/bible-memory-verses", "/printable-bible-memory-cards", "/bible-study-for-beginners", "/how-to-memorize-bible-verses"],
    extraBlocks: [
      {
        type: "list",
        title: "A practical memorization rhythm",
        intro: "A simple rhythm can make memorization more steady and less frustrating.",
        items: [
          "Read the verse aloud in context.",
          "Hide a few words and practise active recall.",
          "Use hints when needed rather than giving up.",
          "Pray through the verse before marking it reviewed.",
          "Return to the verse on a future review date."
        ]
      },
      {
        type: "cta",
        title: "Try Scripture memory practice",
        intro: "Open Memory in Bible Study Tutor and practise saved verses with blanks, hints, reflection, and review dates.",
        href: "/?tab=memory",
        label: "Try memory practice"
      }
    ]
  },
  {
    path: "/printable-bible-memory-cards",
    file: "printable-bible-memory-cards.html",
    title: "Printable Bible Memory Cards | Free Scripture Memory Cards",
    description: "Create printable Bible memory cards from saved verses with practical review ideas, collections, examples, group uses, printing tips, and Scripture memory FAQs.",
    heading: "Printable Bible memory cards",
    intro: "Bible Study Tutor can turn saved memory verses into printable cards so Scripture can move beyond the screen and stay close through the day. Cards can be used for personal review, family rhythms, church groups, youth groups, and encouragement.",
    sections: [
      ["Choose saved verses", "Print due verses, reviewed verses, a current filtered list, a collection, or a custom selection of saved memory verses."],
      ["Print more than one copy", "Choose how many copies to print when preparing cards for personal use, family, a Bible study group, or a church class."],
      ["Group by theme", "Collections can help you print verses around themes such as identity in Christ, prayer, comfort, wisdom, faith, or evangelism."],
      ["Keep cards simple", "Cards focus on the Scripture reference and verse text, with a clean footer and room for practical use."]
    ],
    cta: "Print memory cards",
    related: ["/bible-memory-verses", "/scripture-memorization-app", "/printable-bible-study-worksheets", "/how-to-memorize-bible-verses"],
    schemaType: "FAQPage",
    faq: [
      ["How do printable Bible memory cards work?", "Save verses in Bible Study Tutor, choose which verses or collection to print, then open the card preview and print or save as PDF."],
      ["Can I print more than one copy?", "Yes. The print dialog lets you choose multiple copies for personal use, families, groups, or church classes."],
      ["Can I print cards by collection?", "Yes. Collections are useful for printing themed sets such as prayer, comfort, wisdom, or identity in Christ."],
      ["Are memory cards useful for children or youth?", "Yes. Short cards can be placed somewhere visible and reviewed aloud during the week."],
      ["Can I use memory cards without staying on a screen?", "Yes. That is one of the main benefits: Scripture can stay visible in everyday places."]
    ],
    extraBlocks: [
      {
        type: "list",
        title: "Ways to use memory cards",
        intro: "Printed cards help Scripture become part of ordinary daily rhythms.",
        items: [
          "Place one card near a desk, mirror, fridge, or bedside table.",
          "Carry one card in a Bible, notebook, wallet, or bag.",
          "Print a themed set for a small group or youth group.",
          "Review one card during breakfast, commuting, or evening prayer.",
          "Use cards for short family Scripture memory moments."
        ]
      },
      {
        type: "example",
        title: "Example memory card set: anxiety and peace",
        intro: "A themed set can help someone return to related passages over several days.",
        items: [
          ["Philippians 4:6-7", "A card for prayer, thanksgiving, and the peace of God."],
          ["John 14:27", "A card for remembering the peace Jesus gives."],
          ["Psalm 46:1", "A card for seeking refuge and strength in God."],
          ["1 Peter 5:7", "A card for casting anxieties on the Lord because He cares."]
        ]
      },
      {
        type: "checklist",
        title: "Memory card printing checklist",
        intro: "Before printing, make sure the cards will be useful in real life.",
        items: [
          "Have I selected verses that are short enough to review easily?",
          "Would a collection help keep the cards themed?",
          "Do I need more than one copy?",
          "Will the card be placed somewhere visible?",
          "Can I pair the card with a simple daily review rhythm?"
        ]
      },
      {
        type: "cta",
        title: "Print Bible memory cards",
        intro: "Open Memory in Bible Study Tutor, choose saved verses or a collection, and print clean cards for review through the week.",
        href: "/?tab=memory",
        label: "Print memory cards"
      }
    ]
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
      ["Send verses into study", "Selected passages can become a guided study, a printable worksheet, or a saved memory verse."],
      ["Keep notes connected", "Highlights, bookmarks, and notes can be revisited from the Journal so important passages are not lost after reading."],
      ["Use marks with purpose", "Highlighting is most helpful when colours point to real categories such as truth, prayer, warning, comfort, or application."]
    ],
    schemaType: "FAQPage",
    faq: [
      ["What is the difference between a highlight and a bookmark?", "A highlight marks selected Scripture visually, while a bookmark saves a passage you want to revisit."],
      ["Can I add notes to Bible passages?", "Yes. Notes can be saved with passages and revisited later in the Journal."],
      ["Can highlighted verses become memory verses?", "Selected verses can be saved to Memory, sent into Study, or used for printable worksheets."],
      ["Are Bible notes public?", "No. Notes and journal reflections are private study content."]
    ],
    cta: "Open the Bible reader",
    related: ["/online-bible-study-journal", "/features", "/bible-study-methods", "/bible-study-journal"],
    extraBlocks: [
      {
        type: "checklist",
        title: "Helpful highlighting habits",
        intro: "These habits keep highlighting useful rather than decorative.",
        items: [
          "Highlight phrases that help you understand the passage.",
          "Use notes for questions you want to revisit.",
          "Bookmark passages you want to find quickly later.",
          "Send important verses to Study or Memory when you want to go deeper.",
          "Review journal entries so highlights become part of ongoing study."
        ]
      },
      {
        type: "cta",
        title: "Open the Bible reader",
        intro: "Select a passage, highlight it, add a note, bookmark it, or send it into Study.",
        href: "/?tab=bible",
        label: "Open the Bible reader"
      }
    ]
  },
  {
    path: "/bible-study-for-small-groups",
    file: "bible-study-for-small-groups.html",
    title: "Bible Study for Small Groups | Worksheets, Methods and Private Encouragement",
    description: "Use Bible Study Tutor for small groups with practical study workflows, printable worksheets, guided methods, private encouragement, memory verses, and FAQs.",
    heading: "Bible study tools for small groups",
    intro: "Bible Study Tutor can support small groups with printable worksheets, shared study rhythms, private encouragement, memory verses, and simple Scripture-centred structure. It is designed to help a group gather around the Bible without becoming another public social platform.",
    sections: [
      ["Prepare group worksheets", "Print selected passages with guided questions so people can study with pen and paper before or during a group meeting. This helps quieter members prepare thoughts before discussion."],
      ["Use shared methods", "Group members can use the same study method, passage, or memory collection while keeping their own notes and journal."],
      ["Keep sharing private", "Friends and circles are designed for trusted encouragement rather than public social media feeds. The focus is encouragement between people who already know one another."],
      ["Continue after the meeting", "Members can save studies, memory verses, notes, and reflections so the group’s Scripture focus can continue during the week."]
    ],
    cta: "Prepare a group study",
    related: ["/printable-bible-study-worksheets", "/printable-bible-study-worksheet-for-small-groups", "/bible-study-app-for-churches", "/bible-study-methods"],
    schemaType: "FAQPage",
    faq: [
      ["Can a small group use Bible Study Tutor for free?", "Yes. Bible Study Tutor is designed to be free for personal Bible study, small groups, churches, and youth groups."],
      ["Can leaders print worksheets before a group meeting?", "Yes. Leaders can select a passage and print worksheets for SOAP, OIA, Inductive Study, or other guided methods."],
      ["Does Bible Study Tutor have a public group feed?", "No. Friends and circles are intended for private encouragement, not public social media posting."],
      ["Can each person keep their own notes?", "Yes. Group members can study the same passage while keeping their own notes, highlights, memory verses, and journal entries."],
      ["What is a simple plan for a small group study?", "Choose one passage, pick one method, let people observe the text, discuss meaning together, and finish with prayer shaped by the passage."]
    ],
    extraBlocks: [
      {
        type: "list",
        title: "A simple small group workflow",
        intro: "This rhythm keeps a group focused without making the meeting complicated.",
        items: [
          "Choose the passage before the meeting.",
          "Print or share a worksheet using SOAP, OIA, or Inductive Study.",
          "Ask everyone to write observations before discussing application.",
          "Use discussion to clarify the passage, not replace it.",
          "Finish with prayer and one practical response for the week."
        ]
      },
      {
        type: "example",
        title: "Example group study: Philippians 2:1-11",
        intro: "Philippians 2:1-11 can work well for a small group because it moves from unity and humility to the example of Christ.",
        items: [
          ["Before the meeting", "Ask each person to read the passage and write observations about humility, unity, and Christ’s example."],
          ["During discussion", "Start with what the group noticed in the passage before asking how humility should shape relationships."],
          ["Prayer response", "Pray for Christlike humility, unity, and obedience in the actual relationships represented in the group."],
          ["During the week", "Invite members to memorize Philippians 2:3-4 or journal one concrete act of humble service."]
        ]
      },
      {
        type: "checklist",
        title: "Small group leader checklist",
        intro: "A few simple decisions can make group Bible study clearer.",
        items: [
          "Is the passage short enough for careful discussion?",
          "Have I chosen one main method or set of questions?",
          "Will people have time to observe before application?",
          "Is there a clear prayer response?",
          "Is there a simple way to continue during the week?"
        ]
      },
      {
        type: "cta",
        title: "Prepare your next group study",
        intro: "Open the Bible reader, choose a passage, and print a worksheet or start a guided study for your next small group.",
        href: "/?tab=bible",
        label: "Prepare a group study"
      }
    ]
  },
  {
    path: "/bible-study-app-for-churches",
    file: "bible-study-app-for-churches.html",
    title: "Bible Study App for Churches | Free Scripture Tools for Discipleship",
    description: "A free Bible study app churches can use for Scripture reading, guided study, printable worksheets, memory verses, journaling, private encouragement, and reading plans.",
    heading: "A free Bible study app for churches",
    intro: "Bible Study Tutor is built to serve the church by keeping Scripture study free, practical, and accessible on desktop, mobile, and paper. It helps leaders point people back to the Bible without adding a paid platform or public social feed.",
    sections: [
      ["No paid barrier", "The core app is intended to remain free so churches can recommend it without asking people to pay for basic Bible study tools, reading plans, memory verses, or printable worksheets."],
      ["Useful in different settings", "Use it for personal discipleship, small groups, youth groups, Bible classes, sermon follow-up, pastoral care follow-up, new believer pathways, or printed study sheets."],
      ["Digital and printable", "Some people study best on a phone or laptop; others prefer paper. Bible Study Tutor supports both by pairing guided study tools with printable worksheets and memory cards."],
      ["Careful community design", "Private encouragements, friends, and circles are designed to support real relationships without becoming another public feed, popularity system, or social media replacement."]
    ],
    cta: "Open Bible Study Tutor",
    related: ["/free-bible-study-app", "/bible-study-for-small-groups", "/printable-bible-study-worksheets", "/bible-reading-plan-app", "/about"],
    schemaType: "FAQPage",
    faq: [
      ["Can a church use Bible Study Tutor for free?", "Yes. Bible Study Tutor is designed to be free for individuals, churches, small groups, youth groups, and Bible classes."],
      ["Does Bible Study Tutor replace a church’s discipleship ministry?", "No. It is a practical tool to support Bible reading, guided study, journaling, memory verses, and printed handouts. It should serve local church discipleship rather than replace it."],
      ["Can leaders print worksheets for group discussion?", "Yes. In the web app, leaders can select a passage and print worksheets using available guided methods such as SOAP, OIA, or Inductive Study."],
      ["Is there a public social feed?", "No. Bible Study Tutor is designed around private friends and circles for trusted encouragement, not a public timeline."],
      ["What private information is avoided in public analytics?", "Public analytics should not include journal text, study answers, notes, names, email addresses, Scripture search text, or community encouragement content."]
    ],
    extraBlocks: [
      {
        type: "list",
        title: "Practical church use cases",
        intro: "A church can use Bible Study Tutor in several ordinary ministry settings without asking people to learn a complicated system.",
        items: [
          "Small group leaders can print a worksheet for Sunday’s sermon passage and invite people to bring handwritten observations.",
          "Youth leaders can choose a short passage, use SOAP or OIA, and give students a simple structure for discussion.",
          "New believers can begin with a reading plan, save questions in the journal, and memorize a small set of foundational verses.",
          "Pastoral care teams can encourage someone privately with Scripture while keeping the app away from public social-media style posting.",
          "Bible class teachers can point people to a method page, then ask them to study the same passage during the week."
        ]
      },
      {
        type: "list",
        title: "Privacy-aware by design",
        intro: "The app is intended to support real discipleship without turning private spiritual reflection into public content.",
        items: [
          "There is no public timeline for notes, studies, or encouragements.",
          "Friends and circles are private spaces for trusted encouragement.",
          "Public analytics are intended to measure app usage patterns, not private journal text, notes, answers, emails, names, or community content.",
          "A free account helps sync saved study data across devices, but people can still explore the app before creating one.",
          "Bible translation choices are shaped by legal access and the desire to keep the app free."
        ]
      },
      {
        type: "previews",
        title: "What church members can do",
        intro: "These lightweight previews show the kinds of workflows the app supports.",
        items: [
          ["Read and continue", "Open the Bible reader, follow a reading plan, and mark chapters or plan readings complete."],
          ["Study with structure", "Send Romans 8:1-4 into Study, choose SOAP or Inductive Study, and save notes to the journal."],
          ["Print for the room", "Create a printable worksheet for a group, youth lesson, or church class handout."],
          ["Remember Scripture", "Save memory verses, review them during the week, and print cards for home or group use."]
        ]
      },
      {
        type: "cta",
        title: "Try it with your next group passage",
        intro: "Choose a passage, open the Bible reader, and print a worksheet or start a guided study before your next small group or Bible class.",
        href: "/?tab=bible",
        label: "Open the Bible reader"
      }
    ]
  },
  {
    path: "/free-bible-study-app-for-small-groups",
    file: "free-bible-study-app-for-small-groups.html",
    title: "Free Bible Study App for Small Groups | Bible Study Tutor",
    description: "Use Bible Study Tutor as a free Bible study app for small groups with Scripture reading, guided methods, printable worksheets, private encouragements, and memory verses.",
    heading: "Free Bible study app for small groups",
    intro: "Bible Study Tutor helps small groups study Scripture together without needing a paid subscription, public social feed, or complicated setup.",
    sections: [
      ["Prepare around one passage", "Leaders can select a Scripture passage, choose a study method, and print worksheets for group discussion before or during a meeting."],
      ["Support different study styles", "Group members can use the app digitally or bring a printed worksheet if handwriting helps them slow down, think, and pray."],
      ["Keep encouragement private", "Friends and circles are designed for trusted encouragement, not public posting or social media-style feeds."],
      ["Continue after the group meets", "Members can save notes, memory verses, reading plan progress, and journal reflections so the group study carries into the week."]
    ],
    cta: "Prepare a group study",
    related: ["/bible-study-for-small-groups", "/printable-bible-study-worksheet-for-small-groups", "/bible-study-methods/soap", "/pricing"],
    schemaType: "FAQPage",
    faq: [
      ["Can small groups use Bible Study Tutor for free?", "Yes. Bible Study Tutor is designed to be free and accessible for small groups, churches, and personal Scripture study."],
      ["Can a leader print worksheets for a group?", "Yes. A leader can select a passage and print worksheets using guided methods such as SOAP, OIA, or Inductive Study."],
      ["Does Bible Study Tutor have a public social feed?", "No. Friends and circles are intended for private, trusted encouragement rather than public posting."]
    ],
    extraBlocks: [
      {
        type: "list",
        title: "How a small group can use it",
        intro: "Bible Study Tutor can support a group without turning Bible study into a complicated platform.",
        items: [
          "Choose one passage for the week.",
          "Ask members to read it in the Bible reader before meeting.",
          "Print SOAP or OIA worksheets for people who prefer paper.",
          "Use the same method in discussion so everyone follows the same structure.",
          "Encourage members to save one note, prayer, or memory verse after the meeting."
        ]
      },
      {
        type: "example",
        title: "Example small group flow: John 15:1-8",
        intro: "John 15:1-8 gives a group a concrete passage for discussing abiding in Christ and fruitfulness.",
        items: [
          ["Prepare", "Ask everyone to read the passage and write two observations before the meeting."],
          ["Discuss", "Talk about the repeated words abide, fruit, branch, and vine before moving to application."],
          ["Respond", "Invite each person to write one prayer about abiding in Christ during the week."],
          ["Continue", "Save John 15:5 as a memory verse or print a worksheet for follow-up."]
        ]
      },
      {
        type: "checklist",
        title: "Small group setup checklist",
        intro: "These choices help a group use the app simply.",
        items: [
          "Is the selected passage short enough to discuss well?",
          "Will the group use the app, a printed worksheet, or both?",
          "Which method will keep the conversation grounded in Scripture?",
          "Is there a clear prayer response?",
          "Would one memory verse help the passage stay with the group?"
        ]
      },
      {
        type: "cta",
        title: "Prepare a free group study",
        intro: "Open the Bible reader, choose a passage, and prepare a worksheet or guided study for your small group.",
        href: "/?tab=bible",
        label: "Prepare a group study"
      }
    ]
  },
  {
    path: "/bible-reading-plan-app",
    file: "bible-reading-plan-app.html",
    title: "Bible Reading Plan App | Follow Scripture Reading Plans",
    description: "Follow Bible reading plans in Bible Study Tutor, track progress, mark readings complete, continue across devices, and study selected passages.",
    heading: "Bible reading plan app",
    intro: "Bible Study Tutor includes Bible reading plans to help users keep a steady rhythm of reading Scripture, then slow down into deeper study when a passage needs attention.",
    sections: [
      ["Follow a plan", "Choose a short, medium, or long reading plan and continue from the next reading. Plans can help with John, Romans, Psalms, the Gospels, the New Testament, or the whole Bible."],
      ["Keep reading and study connected", "Open a plan reading in the Bible reader, then send the passage to Study when you want guided prompts, notes, prayer, or a printable worksheet."],
      ["Track progress without pressure", "Mark readings complete, catch up when needed, and keep ordinary chapter reading separate from plan completion."],
      ["Use plans on desktop and mobile", "Signed-in users can keep reading plan progress available across devices while still using the app in a simple, privacy-aware way."]
    ],
    cta: "Open reading plans",
    related: ["/how-to-start-a-bible-reading-plan", "/how-it-works", "/features", "/how-to-study-the-bible", "/faq"],
    schemaType: "FAQPage",
    faq: [
      ["What is a Bible reading plan?", "A Bible reading plan gives you a sequence of passages to read over a set number of days."],
      ["Can I study a reading plan passage?", "Yes. You can open a plan reading in the Bible reader and send it into a guided study method."],
      ["Can I follow more than one reading plan?", "Bible Study Tutor supports multiple active reading plans while keeping the Bible reader focused on the next readings."]
    ],
    extraBlocks: [
      {
        type: "previews",
        title: "Types of reading plans",
        intro: "Different reading plans serve different seasons and goals.",
        items: [
          ["Short plans", "Useful for prayer, peace, grief, new believers, or a focused 7-14 day rhythm."],
          ["Medium plans", "Useful for Gospels, New Testament sections, overviews, or book-based reading."],
          ["Long plans", "Useful for reading the whole Bible, the New Testament, or Psalms and Proverbs over a longer period."],
          ["Custom plans", "Useful when a church, group, or individual wants to create a specific reading pathway."]
        ]
      },
      {
        type: "checklist",
        title: "Reading plan safeguards",
        intro: "A plan should help Scripture reading, not become a burden.",
        items: [
          "Choose a pace that fits your actual life.",
          "Use catch-up tools when dates need adjusting.",
          "Do not confuse chapter read status with plan-day completion.",
          "Send important readings into Study when you need to slow down.",
          "Let the plan serve prayerful reading rather than pressure."
        ]
      },
      {
        type: "cta",
        title: "Open Bible reading plans",
        intro: "Choose a plan, open the next reading, and keep your Bible reading rhythm clear.",
        href: "/?tab=plans",
        label: "Open reading plans"
      }
    ]
  },
  {
    path: "/how-to-start-a-bible-reading-plan",
    file: "how-to-start-a-bible-reading-plan.html",
    title: "How to Start a Bible Reading Plan and Build a Lasting Rhythm",
    description: "Learn how to create your own Bible reading plan or choose a beginner plan, set a realistic pace, handle missed days, and build a Scripture reading rhythm that lasts.",
    heading: "How to start a Bible reading plan and build a rhythm that lasts",
    intro: "A Bible reading plan works best when it has a clear purpose, a realistic daily portion, and room for ordinary interruptions. You can choose a built-in plan in Bible Study Tutor or create your own plan from a list of Bible passages, then track each day as you read.",
    showHowToSteps: true,
    includeFaqSchema: true,
    sections: [
      ["Begin with a purpose", "Decide whether you want to meet Jesus in a Gospel, understand one Bible book, trace a theme, establish a short daily habit, or read through a larger part of Scripture. The goal should shape the passages and pace."],
      ["Choose or create the plan", "Use a built-in short, medium, or long plan, or create a custom plan by entering a title and one Bible reference per day. A custom plan is useful for a church series, book study, or personal reading pathway."],
      ["Keep reading and deeper study distinct", "Read the day’s passage first. When a section needs closer attention, send it to SOAP, OIA, Inductive Study, or another available guided method rather than expecting every daily reading to become a long study."],
      ["Use a gracious catch-up rule", "If you miss several days, continue with the first incomplete reading or use Catch me up to move the remaining dates forward. Avoid doubling every missed reading if that turns the plan into pressure."]
    ],
    cta: "Open reading plans",
    related: ["/bible-reading-plan-app", "/how-it-works", "/bible-study-methods/soap", "/bible-study-journal"],
    schemaType: "HowTo",
    howToSteps: [
      "Choose one clear goal, such as reading a Gospel, studying a book, or building a daily Scripture habit.",
      "Select a book or theme that serves that goal and read enough context to avoid collecting disconnected verses.",
      "Choose a realistic length such as 7, 30, or 90 days, or one year.",
      "Set a daily reading size you can usually complete without rushing.",
      "Choose a catch-up rule before you begin: resume with the first incomplete reading or move the remaining dates forward.",
      "Decide which readings need deeper study and which can remain attentive reading and prayer.",
      "Review the plan weekly and adjust the pace if it is producing pressure instead of steady engagement with Scripture."
    ],
    faq: [
      ["How do I create my own Bible reading plan?", "Choose a goal and duration, list one Bible passage for each day, and decide how you will handle missed readings. In Bible Study Tutor, open Plans, choose Create custom plan, add a title, and enter one Bible reference per line."],
      ["What is a good Bible reading plan for beginners?", "A focused seven-day plan through key Gospel passages is a manageable place to begin. It introduces Jesus’ identity, teaching, compassion, death, and resurrection without requiring several chapters each day."],
      ["What should I do when I miss several days?", "Resume with the first incomplete reading instead of trying to repay a debt. In Bible Study Tutor, you can also use Catch me up to move the remaining plan dates forward."],
      ["Should I study every reading deeply?", "Not necessarily. Read each passage attentively, but reserve deeper guided study for passages that raise questions, carry the main theme, or need slower reflection."]
    ],
    extraBlocks: [
      {
        type: "table",
        title: "Choose a realistic Bible reading plan length",
        intro: "Daily time is only a rough guide because passage length and reading pace vary. Begin with a pace you can sustain and adjust it when needed.",
        headers: ["Plan length", "Best suited to", "Typical daily rhythm"],
        rows: [
          ["7 days", "Beginners, one theme, or restarting a habit", "One short passage · about 5–10 minutes"],
          ["30 days", "One book, a Gospel overview, or a monthly theme", "One passage or chapter · about 10–15 minutes"],
          ["90 days", "A larger section of Scripture or a steady seasonal plan", "One to three chapters · about 15–25 minutes"],
          ["One year", "The whole Bible or another broad reading goal", "Several chapters · about 15–30 minutes"]
        ]
      },
      {
        type: "example",
        title: "Complete beginner example: a 7-day Gospel starter",
        intro: "This example can be entered as a custom plan. Read the whole passage before focusing on one detail, and use the surrounding chapter whenever the immediate context is unclear.",
        items: [
          ["Day 1 · John 1:1-18", "Meet Jesus as the eternal Word who became flesh and makes the Father known."],
          ["Day 2 · Mark 1:14-20", "Notice Jesus’ announcement of God’s kingdom and His call to repent, believe, and follow."],
          ["Day 3 · Mark 2:1-12", "See Jesus respond to faith, forgive sins, and heal with divine authority."],
          ["Day 4 · Luke 15:1-7", "Observe why Jesus welcomes sinners and how heaven responds when one repents."],
          ["Day 5 · John 10:11-18", "Listen to Jesus describe Himself as the good Shepherd who knows His sheep and lays down His life."],
          ["Day 6 · Mark 15:33-39", "Read the crucifixion carefully and notice the centurion’s response to Jesus’ death."],
          ["Day 7 · John 20:1-18", "Finish with the empty tomb, the risen Jesus, and Mary Magdalene’s witness."]
        ]
      },
      {
        type: "cta",
        title: "Start a Bible reading plan",
        intro: "Open the Plans tab, choose a plan, and continue from the next reading in the Bible reader.",
        href: "/?tab=plans",
        label: "Open reading plans"
      }
    ]
  },
  {
    path: "/bible-study-app-with-printable-worksheets",
    file: "bible-study-app-with-printable-worksheets.html",
    title: "Bible Study App with Printable Worksheets | Digital and Paper Study",
    description: "Use Bible Study Tutor as a Bible study app with printable worksheets for personal study, small groups, youth groups, church groups, and pen-and-paper reflection.",
    heading: "Bible study app with printable worksheets",
    intro: "Bible Study Tutor works for digital study and pen-and-paper study, helping users move from Scripture reading to guided notes, prayer, memory, and printable worksheets.",
    sections: [
      ["Select Scripture first", "Start with the passage so the worksheet is anchored in the Bible text rather than in a vague topic or disconnected question."],
      ["Choose a method", "Use SOAP, OIA, Inductive Study, Lectio Divina, READ, or another guided rhythm to shape the worksheet prompts."],
      ["Print for real-life settings", "Worksheets can support personal devotion, family study, youth groups, Bible classes, sermon follow-up, and church small groups."],
      ["Keep digital and paper together", "A user can study in the app, print a worksheet when paper helps, and save notes or memory verses for later review."]
    ],
    cta: "Print a worksheet",
    related: ["/printable-bible-study-worksheets", "/printable-soap-bible-study-worksheet", "/printable-inductive-bible-study-worksheet", "/bible-study-worksheet-for-church-groups"],
    schemaType: "FAQPage",
    faq: [
      ["Can Bible Study Tutor be used without printing?", "Yes. The app supports digital Bible reading, guided study, notes, journaling, memory verses, and reading plans."],
      ["Why include printable worksheets?", "Some people think, pray, and discuss more easily with pen and paper, especially in small groups or church classes."],
      ["Can I choose the study method for a worksheet?", "Yes. Worksheets can be created from guided methods such as SOAP, OIA, Inductive Study, Lectio Divina, and READ."]
    ],
    extraBlocks: [
      {
        type: "previews",
        title: "Digital and paper workflows",
        intro: "The same passage can move between app-based study and printed study depending on what helps the user most.",
        items: [
          ["Read digitally", "Open the Bible reader, choose a passage, and select verses."],
          ["Study with prompts", "Send the passage to Study and choose a method such as SOAP, OIA, or Inductive Study."],
          ["Print for handwriting", "Open a worksheet preview and print or save it as a PDF."],
          ["Save for later", "Keep notes, highlights, memory verses, and journal entries in the app."]
        ]
      },
      {
        type: "example",
        title: "Example: sermon follow-up worksheet",
        intro: "A church member or leader can turn Sunday’s passage into a practical study sheet for the week.",
        items: [
          ["Passage", "Select the sermon passage in the Bible reader."],
          ["Method", "Choose OIA to help people observe, interpret, and apply the passage."],
          ["Print", "Print one copy for personal reflection or several copies for a group."],
          ["Continue", "Save one application note or memory verse in Bible Study Tutor."]
        ]
      },
      {
        type: "checklist",
        title: "When printable worksheets help",
        intro: "Printable study sheets are not only for people without devices.",
        items: [
          "When handwriting helps someone slow down.",
          "When a group needs one shared page in front of them.",
          "When a youth group or class needs a simple handout.",
          "When a user wants to study away from screens.",
          "When sermon follow-up needs space for notes and prayer."
        ]
      },
      {
        type: "cta",
        title: "Print a worksheet",
        intro: "Open the Bible reader and create a printable study sheet from any selected passage.",
        href: "/?tab=bible",
        label: "Print a worksheet"
      }
    ]
  },
  {
    path: "/how-to-memorize-bible-verses",
    file: "how-to-memorize-bible-verses.html",
    title: "How to Memorize Bible Verses | Scripture Memory with Review",
    description: "Learn how to memorize Bible verses with reading, blanks, hints, review rhythms, Scripture-centred reflection prompts, collections, and printable memory cards.",
    heading: "How to memorize Bible verses",
    intro: "Memorizing Scripture is helped by repetition, reflection, prayer, and review. Bible Study Tutor gives users a simple way to save, practise, pray through, and print memory verses.",
    sections: [
      ["Read before recall", "Begin by reading the verse carefully and noticing the words, theme, and context before hiding words or testing memory."],
      ["Practise with blanks", "Hide parts of the verse, type the missing words, and use hints when needed so review stays active rather than passive."],
      ["Review over time", "Set review rhythms, group related verses into collections, and return to verses that need more attention."],
      ["Use Scripture-centred reflection and memory cards", "Pause over a saved verse by thinking about its meaning in context, praying through it, and considering a faithful response. You can also print memory cards to keep Scripture close through the day."]
    ],
    cta: "Open memory verses",
    related: ["/bible-memory-verses", "/scripture-memorization-app", "/printable-bible-memory-cards", "/bible-study-journal"],
    schemaType: "HowTo",
    howToSteps: [
      "Choose a verse or passage to save to memory.",
      "Read the verse carefully in context.",
      "Practise missing words with hints when needed.",
      "Review the verse again on future days.",
      "Group related verses or print memory cards for regular review."
    ],
    faq: [
      ["What is the best way to memorize a Bible verse?", "Read it in context, repeat it aloud, practise active recall, pray through it, and review it again over time."],
      ["Should I memorize single verses or longer passages?", "Both can be helpful. Beginners may start with single verses, while longer passages can be split into manageable collections."],
      ["How often should I review memory verses?", "Review more often when a verse is new, then use longer review intervals as it becomes familiar."],
      ["Can printed cards help memorization?", "Yes. Cards keep Scripture visible during ordinary moments away from the screen."]
    ],
    extraBlocks: [
      {
        type: "example",
        title: "Example: memorizing Philippians 4:6-7",
        intro: "This passage can be memorized slowly by connecting each phrase to prayer.",
        items: [
          ["Read", "Read Philippians 4:4-9 so the command about anxiety is heard in context."],
          ["Notice", "Mark anxiety, prayer, supplication, thanksgiving, peace, hearts, and minds."],
          ["Practise", "Hide a few words at a time and say the sentence aloud before typing it."],
          ["Pray", "Turn one worry into prayer with thanksgiving."],
          ["Review", "Return to the passage later in the week and print a card if it would help."]
        ]
      },
      {
        type: "checklist",
        title: "Scripture memory checklist",
        intro: "Use this checklist before marking a verse reviewed.",
        items: [
          "Have I read the surrounding passage?",
          "Do I understand the verse well enough to explain it simply?",
          "Can I recall the verse without only recognizing it?",
          "Have I prayed through it?",
          "Should this verse be part of a collection?"
        ]
      },
      {
        type: "cta",
        title: "Start memorizing Scripture",
        intro: "Open Memory in Bible Study Tutor, save a verse, and practise it with blanks, hints, and review reminders.",
        href: "/?tab=memory",
        label: "Open memory verses"
      }
    ]
  },
  {
    path: "/how-to-study-romans",
    file: "how-to-study-romans.html",
    title: "How to Study Romans | A Practical Guide to Paul’s Letter",
    description: "Learn how to study Romans with themes, structure, starter passages, cautions, a worked example, recommended methods, and guided study CTA.",
    heading: "How to study Romans",
    intro: "Romans is rich, structured, and deeply theological. Bible Study Tutor can help you move through it slowly by passage, theme, question, and response without rushing past Paul’s argument.",
    sections: [
      ["Trace the argument", "Romans builds carefully. Watch for connecting words, repeated ideas, and the movement from sin and grace to new life and practical obedience."],
      ["Keep gospel themes in view", "Notice righteousness, faith, grace, law, sin, union with Christ, the Spirit, mercy, and transformed living."],
      ["Study in manageable sections", "Romans rewards slow study. Use guided notes, memory collections, and journal entries rather than trying to master the whole letter at once."],
      ["Recommended method", "Use inductive study for whole paragraphs, word study for repeated theological words, and cross-reference study where Paul quotes the Old Testament."]
    ],
    cta: "Study Romans",
    related: ["/bible-study-methods/inductive", "/bible-study-methods/word-study", "/how-to-study-a-bible-passage", "/bible-study-journal"],
    schemaType: "HowTo",
    howToSteps: [
      "Read Romans in manageable paragraphs.",
      "Trace Paul’s argument and connecting words.",
      "Note repeated themes such as righteousness, faith, grace, law, sin, Spirit, and mercy.",
      "Use context before drawing doctrinal conclusions.",
      "Write a gospel-shaped response of faith, worship, obedience, or prayer."
    ],
    faq: [
      ["Where should I start in Romans?", "Romans 1:16-17, Romans 3:21-26, Romans 5:1-11, Romans 8:1-17, and Romans 12:1-2 are useful starter passages."],
      ["Is Romans difficult to study?", "Romans is deep, but it becomes clearer when studied slowly in paragraphs rather than isolated verses only."],
      ["What method works best for Romans?", "Inductive study is a strong starting point, with word study and cross-reference study used carefully where needed."],
      ["Should Romans be used for memory verses?", "Yes. Romans includes many passages worth memorizing, but memory should stay connected to context."]
    ],
    extraBlocks: [
      {
        type: "list",
        title: "Starter passages in Romans",
        intro: "These passages give a useful path into Paul’s letter.",
        items: [
          "Romans 1:16-17 for the gospel and righteousness of God.",
          "Romans 3:21-26 for grace, faith, redemption, and Christ’s saving work.",
          "Romans 5:1-11 for peace with God and hope through Christ.",
          "Romans 8:1-17 for no condemnation, life in the Spirit, and adoption.",
          "Romans 12:1-2 for transformed living in response to God’s mercy."
        ]
      },
      {
        type: "example",
        title: "Worked example: Romans 12:1-2",
        intro: "Romans 12:1-2 is best read after Paul’s long explanation of God’s mercy.",
        items: [
          ["Observation", "Paul appeals “by the mercies of God” and calls believers to present their bodies as living sacrifices."],
          ["Interpretation", "The practical commands of Romans 12 flow from the gospel mercy explained earlier in the letter."],
          ["Application", "A faithful response might ask where worship needs to become embodied obedience rather than only words."],
          ["Prayer", "Lord, renew my mind and teach me to live in response to Your mercy."]
        ]
      },
      {
        type: "checklist",
        title: "Romans study cautions",
        intro: "Romans is often quoted in fragments, so context matters.",
        items: [
          "Do not isolate a verse from Paul’s argument.",
          "Watch for “therefore,” “for,” “but now,” and other connecting words.",
          "Let Romans 1-11 shape Romans 12-16.",
          "Read Old Testament quotations carefully.",
          "Move from doctrine to worship and obedience."
        ]
      },
      {
        type: "cta",
        title: "Start studying Romans",
        intro: "Open a passage from Romans in Bible Study Tutor and use inductive study or word study to move slowly through the text.",
        href: "/?tab=study&method=inductive&passage=Romans%2012%3A1-2",
        label: "Start a Romans study"
      }
    ]
  },
  {
    path: "/how-to-study-the-gospel-of-john",
    file: "how-to-study-the-gospel-of-john.html",
    title: "How to Study the Gospel of John | Read John’s Gospel with Purpose",
    description: "Learn how to study John’s Gospel with signs, I am sayings, belief, witness, starter passages, cautions, a worked example, and guided study CTA.",
    heading: "How to study the Gospel of John",
    intro: "The Gospel of John invites readers to see who Jesus is and believe in Him. Bible Study Tutor helps you slow down and follow John’s purpose passage by passage.",
    sections: [
      ["Look for signs and responses", "Notice Jesus’ signs, the conversations that follow, and how different people respond with belief, confusion, opposition, or worship."],
      ["Trace John’s themes", "Watch for light, life, belief, witness, glory, love, truth, the Father, the Son, and the Spirit."],
      ["Read toward John’s purpose", "John says his Gospel was written so readers may believe that Jesus is the Christ, the Son of God, and have life in His name."],
      ["Recommended method", "Use OIA for signs and conversations, Lectio Divina for prayerful reflection, and word study for repeated themes such as life, light, and belief."]
    ],
    cta: "Study John’s Gospel",
    related: ["/how-to-study-a-bible-passage", "/bible-study-methods/oia", "/bible-study-methods/lectio-divina", "/bible-study-for-beginners"],
    schemaType: "HowTo",
    howToSteps: [
      "Read each passage as part of John’s purpose.",
      "Notice signs, conversations, I am sayings, witnesses, and responses.",
      "Ask what the passage reveals about Jesus.",
      "Trace repeated themes such as life, light, belief, glory, and love.",
      "Write a response of faith, worship, prayer, or witness."
    ],
    faq: [
      ["Why is John a good Gospel to study?", "John clearly presents who Jesus is and why believing in Him matters."],
      ["Where should beginners start in John?", "John 1:1-18, John 3:1-21, John 10:1-18, John 15:1-11, and John 20:30-31 are helpful places to begin."],
      ["What should I look for in John?", "Look for signs, conversations, I am sayings, witness, belief, life, light, glory, and love."],
      ["Can John be studied devotionally?", "Yes. John is rich for prayerful reflection, but each passage should still be read in context."]
    ],
    extraBlocks: [
      {
        type: "example",
        title: "Worked example: John 20:30-31",
        intro: "John 20:30-31 states the purpose of the Gospel and helps guide the whole study.",
        items: [
          ["Observation", "John says Jesus did many signs, and these written signs have a purpose."],
          ["Interpretation", "The Gospel is written so readers may believe Jesus is the Christ, the Son of God, and have life in His name."],
          ["Application", "A study of John should regularly ask: what does this passage show about Jesus, and how does it call for faith?"],
          ["Prayer", "Lord Jesus, help me see You clearly and believe with living faith."]
        ]
      },
      {
        type: "checklist",
        title: "John study checklist",
        intro: "Use this checklist as you move through John’s Gospel.",
        items: [
          "What does this passage reveal about Jesus?",
          "How do people respond to Him?",
          "Is there a sign, saying, witness, or contrast?",
          "How does this passage connect to John’s purpose?",
          "What response of belief, worship, or obedience is fitting?"
        ]
      },
      {
        type: "cta",
        title: "Start studying John",
        intro: "Open John in Bible Study Tutor and use OIA, SOAP, or Lectio Divina to follow the Gospel passage by passage.",
        href: "/?tab=study&method=oia&passage=John%2020%3A30-31",
        label: "Start a John study"
      }
    ]
  },
  {
    path: "/how-to-study-genesis",
    file: "how-to-study-genesis.html",
    title: "How to Study Genesis | Creation, Covenant, Fall and Promise",
    description: "Learn how to study Genesis with creation, fall, covenant, promise, starter passages, narrative cautions, a worked example, and guided study methods.",
    heading: "How to study Genesis",
    intro: "Genesis lays the foundation for the Bible’s story of creation, sin, promise, covenant, blessing, and God’s faithfulness. Study it slowly and watch how its themes echo through Scripture.",
    sections: [
      ["Why Genesis matters", "Genesis introduces God as Creator, shows the seriousness of sin, and begins the story of promise through Abraham and his family."],
      ["How to approach it", "Read Genesis as narrative. Notice repeated promises, family tensions, covenant language, blessing, exile, land, and God’s patient faithfulness."],
      ["Recommended study method", "Use the inductive method to observe the story carefully, interpret each scene in context, and apply what it reveals about God and human need."],
      ["Suggested starter passages", "Begin with Genesis 1:1-2:3, Genesis 3, Genesis 12:1-9, Genesis 15, and Genesis 50:15-21."],
      ["Links to Bible study methods", "Genesis pairs well with inductive study, character study, word study, and cross-reference study."]
    ],
    cta: "Start a guided study",
    related: ["/bible-study-methods/inductive", "/bible-study-methods/character-study", "/bible-study-methods/cross-reference-study", "/bible-study-methods/word-study"],
    schemaType: "HowTo",
    howToSteps: [
      "Read Genesis as narrative and notice repeated promises and themes.",
      "Trace creation, fall, covenant, blessing, family conflict, and God’s faithfulness.",
      "Study each scene in its immediate context before jumping ahead.",
      "Use cross references carefully where later Scripture echoes Genesis.",
      "Write what the passage reveals about God, human need, promise, and faith."
    ],
    faq: [
      ["Why is Genesis important?", "Genesis introduces creation, sin, promise, covenant, blessing, and the family line through which God’s promises unfold."],
      ["What method works well for Genesis?", "Inductive study and character study are especially helpful because Genesis is narrative."],
      ["Where should I start in Genesis?", "Genesis 1-3, Genesis 12, Genesis 15, Genesis 22, and Genesis 50:15-21 are strong starter passages."],
      ["What should I avoid when studying Genesis?", "Avoid treating every narrative detail as a direct command. Ask what the passage reveals in context."]
    ],
    extraBlocks: [
      {
        type: "example",
        title: "Worked example: Genesis 12:1-9",
        intro: "Genesis 12 begins the story of Abram with command, promise, faith, and movement.",
        items: [
          ["Observation", "The Lord calls Abram to go and gives promises of land, nation, blessing, name, and blessing to all families of the earth."],
          ["Interpretation", "This passage begins a major covenant promise thread that shapes the rest of Genesis and the Bible’s storyline."],
          ["Application", "A faithful response might include trusting God’s promise when obedience requires leaving security behind."],
          ["Prayer", "Lord, teach me to trust Your promises and follow You faithfully."]
        ]
      },
      {
        type: "checklist",
        title: "Genesis study cautions",
        intro: "Genesis is foundational, but narrative needs careful reading.",
        items: [
          "Read scenes in their literary context.",
          "Notice what God says and promises.",
          "Do not treat every character action as something to imitate.",
          "Trace repeated themes across the book.",
          "Let later Scripture clarify echoes without ignoring Genesis itself."
        ]
      },
      {
        type: "cta",
        title: "Start studying Genesis",
        intro: "Open Genesis in Bible Study Tutor and use inductive study or character study to follow the story carefully.",
        href: "/?tab=study&method=inductive&passage=Genesis%2012%3A1-9",
        label: "Start a Genesis study"
      }
    ]
  },
  {
    path: "/how-to-study-psalms",
    file: "how-to-study-psalms.html",
    title: "How to Study Psalms | Prayer, Worship, Lament and Trust",
    description: "Learn how to study Psalms with prayer, lament, praise, poetry, starter psalms, a worked example, safeguards, and guided study methods.",
    heading: "How to study Psalms",
    intro: "Psalms teaches God’s people to pray, worship, lament, remember, confess, and trust. It is both deeply personal and richly theological.",
    sections: [
      ["Why Psalms matters", "Psalms gives language for joy, fear, grief, repentance, thanksgiving, worship, and confidence in the Lord."],
      ["How to approach it", "Read each psalm as poetry and prayer. Notice parallel lines, images, emotional movement, repeated words, and how the psalm addresses God."],
      ["Recommended study method", "Use Lectio Divina or SOAP when praying through a psalm, and use word study for repeated themes such as refuge, steadfast love, and righteousness."],
      ["Suggested starter passages", "Begin with Psalm 1, Psalm 23, Psalm 27, Psalm 51, Psalm 103, and Psalm 139."],
      ["Links to Bible study methods", "Psalms works well with Lectio Divina, SOAP, word study, and topical study."]
    ],
    cta: "Start a guided study",
    related: ["/bible-study-methods/lectio-divina", "/bible-study-methods/soap", "/bible-study-methods/word-study", "/printable-bible-study-journal"],
    schemaType: "HowTo",
    howToSteps: [
      "Read the psalm slowly as poetry and prayer.",
      "Notice images, repeated words, emotional movement, and direct address to God.",
      "Identify whether the psalm includes lament, praise, confession, wisdom, thanksgiving, or trust.",
      "Ask what the psalm teaches about God and faithful prayer.",
      "Write a prayer shaped by the psalm."
    ],
    faq: [
      ["How should I study Psalms?", "Read each psalm as poetry and prayer, noticing images, movement, repeated words, and how the psalm speaks to God."],
      ["What psalms are good to start with?", "Psalm 1, Psalm 23, Psalm 27, Psalm 46, Psalm 51, Psalm 103, and Psalm 139 are helpful starter psalms."],
      ["Can I pray the Psalms?", "Yes. The Psalms teach honest prayer, including praise, lament, confession, thanksgiving, and trust."],
      ["What method works well for Psalms?", "Lectio Divina, SOAP, word study, and journaling all work well with Psalms."]
    ],
    extraBlocks: [
      {
        type: "example",
        title: "Worked example: Psalm 23",
        intro: "Psalm 23 is familiar, but slow study helps the imagery become richer.",
        items: [
          ["Observation", "The psalm uses shepherd, path, valley, table, oil, cup, goodness, mercy, and dwelling imagery."],
          ["Interpretation", "David confesses the Lord’s care, guidance, protection, provision, and covenant goodness."],
          ["Application", "A faithful response might be to trust God’s shepherding care in a specific place of fear or uncertainty."],
          ["Prayer", "Lord, shepherd me today. Lead me, restore me, and teach me to trust Your presence."]
        ]
      },
      {
        type: "checklist",
        title: "Psalms study checklist",
        intro: "Use this checklist to pray and study with care.",
        items: [
          "What kind of psalm is this: praise, lament, wisdom, thanksgiving, confession, or trust?",
          "What images or repeated words stand out?",
          "How does the psalm move emotionally?",
          "What does it reveal about God?",
          "How can this psalm shape my prayer?"
        ]
      },
      {
        type: "cta",
        title: "Start studying Psalms",
        intro: "Open a psalm in Bible Study Tutor and use Lectio Divina, SOAP, or journaling to pray through the passage.",
        href: "/?tab=study&method=lectio&passage=Psalm%2023",
        label: "Start a Psalms study"
      }
    ]
  },
  {
    path: "/how-to-study-proverbs",
    file: "how-to-study-proverbs.html",
    title: "How to Study Proverbs | Wisdom, Character and the Fear of the Lord",
    description: "Learn how to study Proverbs with wisdom themes, genre cautions, starter passages, a worked example, topical study, and practical application.",
    heading: "How to study Proverbs",
    intro: "Proverbs trains readers in wise living before God. It calls us to fear the Lord, receive instruction, and practise wisdom in ordinary life.",
    sections: [
      ["Why Proverbs matters", "Proverbs connects faith with daily choices, words, habits, relationships, work, money, correction, and character."],
      ["How to approach it", "Read proverbs as wisdom sayings, not mechanical promises. Compare related sayings and notice patterns across the whole book."],
      ["Recommended study method", "Use topical study to gather related proverbs, then use application prompts to move from insight to concrete wise practice."],
      ["Suggested starter passages", "Begin with Proverbs 1:1-7, Proverbs 3:1-12, Proverbs 4:20-27, Proverbs 10, and Proverbs 31:10-31."],
      ["Links to Bible study methods", "Proverbs pairs naturally with topical study, word study, and OIA."]
    ],
    cta: "Start a guided study",
    related: ["/bible-study-methods/topical-study", "/bible-study-methods/word-study", "/bible-study-methods/oia", "/bible-study-for-beginners"],
    schemaType: "HowTo",
    howToSteps: [
      "Read Proverbs as wisdom literature.",
      "Begin with the fear of the Lord as the foundation of wisdom.",
      "Group related proverbs by theme before drawing conclusions.",
      "Avoid treating each proverb as a mechanical guarantee.",
      "Write one concrete wise practice shaped by the passage."
    ],
    faq: [
      ["How should Proverbs be interpreted?", "Proverbs should be read as wisdom sayings, not as mechanical promises detached from the rest of Scripture."],
      ["Where should I start in Proverbs?", "Proverbs 1:1-7, Proverbs 3:1-12, Proverbs 4:20-27, Proverbs 10, and Proverbs 31:10-31 are helpful starting points."],
      ["What themes should I trace?", "Wisdom, folly, speech, work, money, correction, relationships, justice, discipline, and the fear of the Lord are major themes."],
      ["What method works well for Proverbs?", "Topical study works well because Proverbs often gathers wisdom in short sayings across repeated themes."]
    ],
    extraBlocks: [
      {
        type: "example",
        title: "Worked example: Proverbs 3:5-6",
        intro: "Proverbs 3:5-6 is often memorized, but it should be read in the context of wisdom, trust, and instruction.",
        items: [
          ["Observation", "The passage contrasts trusting the Lord with leaning on one’s own understanding. It calls for acknowledging Him in all ways."],
          ["Interpretation", "The proverb teaches wholehearted trust and humble dependence, not a formula for an easy life without difficulty."],
          ["Application", "A faithful response could be to identify one decision where self-reliance needs to become prayerful trust."],
          ["Prayer", "Lord, teach me to trust You with my whole heart and seek Your wisdom in my decisions."]
        ]
      },
      {
        type: "checklist",
        title: "Proverbs study cautions",
        intro: "These cautions help Proverbs form wisdom rather than simplistic expectations.",
        items: [
          "Read proverbs as wisdom sayings, not automatic guarantees.",
          "Compare related proverbs on the same topic.",
          "Let the fear of the Lord shape the whole study.",
          "Look for patterns across the book.",
          "Apply wisdom concretely in speech, work, relationships, and choices."
        ]
      },
      {
        type: "cta",
        title: "Start studying Proverbs",
        intro: "Open Proverbs in Bible Study Tutor and use topical study or OIA to trace wisdom into daily life.",
        href: "/?tab=study&method=topical-study&passage=Proverbs%203%3A5-6",
        label: "Start a Proverbs study"
      }
    ]
  },
  {
    path: "/how-to-study-matthew",
    file: "how-to-study-matthew.html",
    title: "How to Study Matthew | Jesus the King and Fulfilled Promise",
    description: "Learn how to study Matthew by tracing Jesus as King, fulfilled prophecy, discipleship, parables, kingdom teaching, and the Great Commission.",
    heading: "How to study Matthew",
    intro: "Matthew presents Jesus as the promised King who fulfills Scripture and calls His disciples to live under His gracious rule.",
    sections: [
      ["Why Matthew matters", "Matthew connects Jesus with Israel's story, highlights fulfilled Scripture, and teaches what discipleship under the King looks like."],
      ["How to approach it", "Trace repeated words such as kingdom, fulfill, righteousness, disciple, and authority. Watch how Jesus teaches, heals, confronts hypocrisy, and forms His people."],
      ["Recommended study method", "Use cross-reference study for Old Testament quotations and inductive study for teaching sections such as the Sermon on the Mount."],
      ["Suggested starter passages", "Begin with Matthew 5-7, Matthew 13, Matthew 16:13-28, Matthew 26-28, and Matthew 28:16-20."],
      ["Links to Bible study methods", "Matthew works well with cross-reference study, inductive study, and character study."]
    ],
    schemaType: "HowTo",
    howToSteps: [
      "Read the passage and note what Jesus reveals about the kingdom of heaven.",
      "Look up Old Testament quotations or echoes when Matthew points to fulfillment.",
      "Observe the response Jesus calls for from disciples, crowds, and opponents.",
      "Summarize the passage in one sentence before applying it.",
      "Write one practical act of obedience shaped by Jesus' teaching."
    ],
    faq: [
      ["What is the best way to start studying Matthew?", "Start with Matthew 5-7 to hear Jesus' kingdom teaching, then study Matthew 26-28 to see how His death and resurrection complete the story."],
      ["Why does Matthew quote the Old Testament so often?", "Matthew shows that Jesus is not disconnected from Israel's Scriptures. The quotations help readers see promise, fulfillment, and continuity in God's plan."],
      ["Which study method suits Matthew best?", "Cross-reference study is especially useful for fulfillment passages, while inductive study helps with longer teaching sections and narrative scenes."]
    ],
    cta: "Start a guided study",
    related: ["/bible-study-methods/cross-reference-study", "/bible-study-methods/inductive", "/how-to-study-the-gospel-of-john"],
    extraBlocks: [
      {
        type: "example",
        title: "Worked example: Matthew 28:16-20",
        intro: "The Great Commission is a helpful place to see Matthew's themes come together: Jesus' authority, discipleship, obedience, and His continuing presence.",
        items: [
          ["Observation", "Jesus speaks with all authority and sends His followers to make disciples of all nations."],
          ["Interpretation", "The passage is not only about travel or mission programs. It is about the risen King's authority and the church's ongoing call to teach obedience to Him."],
          ["Application", "A faithful response could be to name one person you can encourage toward Jesus and one command of Jesus you need to obey more fully."],
          ["Prayer", "Lord Jesus, help me trust Your authority and take my part in making disciples with humility and courage."]
        ]
      },
      {
        type: "checklist",
        title: "Matthew study checklist",
        intro: "Use this checklist to keep Matthew grounded in the text rather than turning it into disconnected moral lessons.",
        items: [
          "Notice how Matthew presents Jesus as King and Messiah.",
          "Follow repeated kingdom language.",
          "Check Old Testament references in context.",
          "Ask what Jesus teaches disciples to believe and do.",
          "Let the cross and resurrection shape your application."
        ]
      },
      {
        type: "cta",
        title: "Start studying Matthew",
        intro: "Open Matthew in Bible Study Tutor and use guided study prompts to observe, interpret, apply, and pray through the passage.",
        href: "/?tab=study&method=cross-reference-study&passage=Matthew%2028%3A16-20",
        label: "Start a Matthew study"
      }
    ]
  },
  {
    path: "/how-to-study-mark",
    file: "how-to-study-mark.html",
    title: "How to Study Mark | The Servant King and the Way of the Cross",
    description: "Learn how to study Mark by following Jesus’ authority, urgency, miracles, discipleship, suffering, and the way of the cross.",
    heading: "How to study Mark",
    intro: "Mark moves quickly and focuses sharply on Jesus’ authority, His suffering, and the call to follow Him on the way of the cross.",
    sections: [
      ["Why Mark matters", "Mark shows Jesus as the powerful Son of God who serves, suffers, and calls disciples to costly faith."],
      ["How to approach it", "Watch the pace of the narrative, repeated misunderstandings, miracle stories, conflict, and the turning point around Peter's confession."],
      ["Recommended study method", "Use OIA to keep the story moving from observation to meaning and application without overcomplicating short narrative scenes."],
      ["Suggested starter passages", "Begin with Mark 1:1-15, Mark 2:1-12, Mark 4:35-41, Mark 8:27-38, Mark 10:35-45, and Mark 15-16."],
      ["Links to Bible study methods", "Mark pairs well with OIA, character study, and inductive study."]
    ],
    schemaType: "HowTo",
    howToSteps: [
      "Read the scene and identify what Jesus says or does.",
      "Notice how people respond to Jesus with faith, fear, confusion, or opposition.",
      "Ask how the passage points toward Jesus' suffering and the cross.",
      "Summarize what the passage reveals about discipleship.",
      "Apply the passage by naming one way to follow Jesus with trust and humility."
    ],
    faq: [
      ["Why does Mark feel so fast-paced?", "Mark often moves quickly from one scene to the next, helping readers feel the urgency of Jesus' ministry and the growing question of who He is."],
      ["What passage should beginners study first in Mark?", "Mark 10:35-45 is a strong starting point because it clearly shows Jesus' servant-hearted mission and the shape of discipleship."],
      ["Which method works best for Mark?", "OIA works well because Mark's short scenes invite careful observation, simple interpretation, and direct application."]
    ],
    cta: "Start a guided study",
    related: ["/bible-study-methods/oia", "/bible-study-methods/character-study", "/how-to-study-a-bible-passage"],
    extraBlocks: [
      {
        type: "example",
        title: "Worked example: Mark 10:45",
        intro: "Mark 10:45 is a concise summary of Jesus' mission and a helpful anchor for studying the whole Gospel.",
        items: [
          ["Observation", "Jesus contrasts being served with serving and connects His mission with giving His life."],
          ["Interpretation", "The verse shows that Jesus' greatness is expressed through sacrificial service, not status-seeking power."],
          ["Application", "A faithful response could be to identify one place where you are seeking status and ask how Christ's servant way reshapes your posture."],
          ["Prayer", "Lord Jesus, teach me to follow You in humble service and gratitude for Your saving work."]
        ]
      },
      {
        type: "checklist",
        title: "Mark study cautions",
        intro: "These reminders help readers study Mark as gospel narrative, not merely a series of inspiring episodes.",
        items: [
          "Keep each miracle or teaching in the flow of the whole story.",
          "Notice when the disciples misunderstand Jesus.",
          "Do not skip the suffering and cross when applying Mark.",
          "Ask what the passage reveals about Jesus before asking what it means for you.",
          "Let the pace of Mark lead to active trust, not rushed reading."
        ]
      },
      {
        type: "cta",
        title: "Start studying Mark",
        intro: "Open Mark in Bible Study Tutor and use OIA prompts to move carefully from the text to faithful response.",
        href: "/?tab=study&method=oia&passage=Mark%2010%3A45",
        label: "Start a Mark study"
      }
    ]
  },
  {
    path: "/how-to-study-luke",
    file: "how-to-study-luke.html",
    title: "How to Study Luke | Jesus, Mercy, Mission and the Outsider",
    description: "Learn how to study Luke by tracing Jesus’ compassion, parables, prayer, the Spirit, salvation, outsiders, and God’s mission.",
    heading: "How to study Luke",
    intro: "Luke gives an orderly account of Jesus’ life and ministry, highlighting mercy, prayer, the Spirit, salvation, and good news for all kinds of people.",
    sections: [
      ["Why Luke matters", "Luke emphasizes Jesus’ compassion, concern for the poor and outsider, prayerful dependence, and the unfolding mission of God."],
      ["How to approach it", "Notice meals, parables, reversals, references to the Spirit, prayer, women, outsiders, and the journey toward Jerusalem."],
      ["Recommended study method", "Use character study for encounters with Jesus and topical study for themes such as mercy, prayer, and mission."],
      ["Suggested starter passages", "Begin with Luke 4:16-30, Luke 10:25-37, Luke 15, Luke 18:9-14, Luke 19:1-10, and Luke 24."],
      ["Links to Bible study methods", "Luke works well with character study, topical study, and Lectio Divina."]
    ],
    schemaType: "HowTo",
    howToSteps: [
      "Read the passage and identify who meets Jesus or listens to Him.",
      "Notice reversals, mercy, prayer, and references to salvation.",
      "Ask what the passage reveals about Jesus' mission.",
      "Compare your first reaction with the response Jesus commends.",
      "Write a prayer that responds to Jesus' mercy and call."
    ],
    faq: [
      ["What themes should I look for in Luke?", "Look for mercy, prayer, the Holy Spirit, salvation, table fellowship, reversals, outsiders, and Jesus' journey toward Jerusalem."],
      ["Is Luke good for beginners?", "Yes. Luke is clear, narrative-rich, and full of encounters that help new readers see Jesus' compassion and authority."],
      ["How can I study Luke without missing the bigger story?", "Keep asking how each scene contributes to Jesus' mission and how Luke prepares for the ongoing witness described in Acts."]
    ],
    cta: "Start a guided study",
    related: ["/bible-study-methods/character-study", "/bible-study-methods/topical-study", "/bible-study-methods/lectio-divina"],
    extraBlocks: [
      {
        type: "example",
        title: "Worked example: Luke 19:1-10",
        intro: "Zacchaeus' encounter with Jesus helps readers see mercy, repentance, restoration, and Jesus' mission to seek and save the lost.",
        items: [
          ["Observation", "Zacchaeus seeks to see Jesus, Jesus calls him by name, and the crowd grumbles at Jesus' mercy."],
          ["Interpretation", "The passage shows salvation reaching a despised person and producing visible repentance."],
          ["Application", "A faithful response could be to welcome Jesus' mercy personally and consider where repentance should become concrete."],
          ["Prayer", "Lord Jesus, thank You for seeking the lost. Help me receive Your mercy and walk in changed obedience."]
        ]
      },
      {
        type: "checklist",
        title: "Luke study checklist",
        intro: "Use this checklist to follow Luke's emphasis without flattening the narrative.",
        items: [
          "Notice who is welcomed, restored, challenged, or corrected.",
          "Pay attention to prayer and the work of the Spirit.",
          "Look for reversals of pride and humility.",
          "Read parables in their immediate setting.",
          "Ask how the passage points to Jesus' saving mission."
        ]
      },
      {
        type: "cta",
        title: "Start studying Luke",
        intro: "Open Luke in Bible Study Tutor and use character study or topical study prompts to trace mercy, mission, and discipleship.",
        href: "/?tab=study&method=character-study&passage=Luke%2019%3A1-10",
        label: "Start a Luke study"
      }
    ]
  },
  {
    path: "/how-to-study-acts",
    file: "how-to-study-acts.html",
    title: "How to Study Acts | The Spirit, Mission and the Early Church",
    description: "Learn how to study Acts by tracing the Holy Spirit, gospel mission, the early church, prayer, persecution, and the spread of the Word.",
    heading: "How to study Acts",
    intro: "Acts shows the risen Jesus continuing His mission by the Holy Spirit through the witness of the early church.",
    sections: [
      ["Why Acts matters", "Acts helps readers understand the spread of the gospel, the work of the Spirit, the shape of the early church, and mission across cultures."],
      ["How to approach it", "Follow geography, speeches, prayer, opposition, conversions, church life, and repeated statements about the Word growing."],
      ["Recommended study method", "Use inductive study for narrative flow and cross-reference study when speeches explain Old Testament promises fulfilled in Christ."],
      ["Suggested starter passages", "Begin with Acts 1:1-11, Acts 2, Acts 4:23-31, Acts 8, Acts 10, Acts 13, and Acts 17:16-34."],
      ["Links to Bible study methods", "Acts pairs well with inductive study, cross-reference study, and character study."]
    ],
    schemaType: "HowTo",
    howToSteps: [
      "Track where the gospel is spreading and who is involved.",
      "Observe the role of prayer, the Spirit, witness, opposition, and courage.",
      "Read speeches carefully because they often explain the meaning of events.",
      "Ask what is descriptive history and what gives enduring instruction.",
      "Apply the passage by considering faithful witness, prayer, and dependence on God."
    ],
    faq: [
      ["How should I read Acts responsibly?", "Read Acts as inspired history that describes the early church and teaches through repeated patterns, speeches, and Spirit-led mission."],
      ["What is a good starter passage in Acts?", "Acts 1:8 is a helpful anchor because it frames the spread of witness from Jerusalem outward."],
      ["Does Acts give a model for church life?", "Acts gives important patterns of prayer, teaching, fellowship, generosity, courage, and mission, but each passage should still be read in context."]
    ],
    cta: "Start a guided study",
    related: ["/bible-study-methods/inductive", "/bible-study-methods/cross-reference-study", "/bible-study-methods/character-study"],
    extraBlocks: [
      {
        type: "example",
        title: "Worked example: Acts 1:8",
        intro: "Acts 1:8 introduces the mission pattern that shapes the rest of the book.",
        items: [
          ["Observation", "Jesus promises power by the Holy Spirit and describes witness moving from Jerusalem to the ends of the earth."],
          ["Interpretation", "The verse frames Acts as the continuing mission of the risen Jesus through Spirit-empowered witnesses."],
          ["Application", "A faithful response could be to pray for courage and identify one concrete opportunity to bear witness to Christ."],
          ["Prayer", "Lord, make me dependent on Your Spirit and faithful in the witness You place before me."]
        ]
      },
      {
        type: "checklist",
        title: "Acts study cautions",
        intro: "Acts is rich and exciting, so these cautions help keep interpretation careful.",
        items: [
          "Distinguish repeated patterns from one-time events.",
          "Read speeches as theological explanations, not interruptions.",
          "Notice both growth and opposition.",
          "Avoid turning every narrative detail into a command.",
          "Let prayer and dependence on the Spirit shape application."
        ]
      },
      {
        type: "cta",
        title: "Start studying Acts",
        intro: "Open Acts in Bible Study Tutor and use inductive prompts to follow the spread of the gospel with clarity.",
        href: "/?tab=study&method=inductive&passage=Acts%201%3A8",
        label: "Start an Acts study"
      }
    ]
  },
  {
    path: "/how-to-study-ephesians",
    file: "how-to-study-ephesians.html",
    title: "How to Study Ephesians | Identity in Christ and Gospel-Shaped Life",
    description: "Learn how to study Ephesians by tracing identity in Christ, grace, the church, unity, prayer, spiritual growth, and gospel-shaped living.",
    heading: "How to study Ephesians",
    intro: "Ephesians lifts our eyes to God’s grace in Christ and then shows how that grace reshapes the church, relationships, speech, work, and spiritual battle.",
    sections: [
      ["Why Ephesians matters", "Ephesians gives a rich picture of salvation, identity in Christ, unity in the church, and practical holiness."],
      ["How to approach it", "Notice the movement from gospel truth in chapters 1-3 to gospel-shaped living in chapters 4-6."],
      ["Recommended study method", "Use word study for repeated phrases such as in Christ, grace, walk, and body, then use OIA for application."],
      ["Suggested starter passages", "Begin with Ephesians 1:3-14, Ephesians 2:1-10, Ephesians 3:14-21, Ephesians 4:1-16, and Ephesians 6:10-20."],
      ["Links to Bible study methods", "Ephesians works well with word study, OIA, and topical study."]
    ],
    schemaType: "HowTo",
    howToSteps: [
      "Read the passage and identify whether Paul is emphasizing gospel truth, prayer, or practical walking.",
      "Mark repeated phrases such as in Christ, grace, walk, body, and love.",
      "Connect commands in chapters 4-6 back to grace in chapters 1-3.",
      "Summarize what God has done before naming what believers are called to do.",
      "Apply the passage in church life, relationships, speech, work, or prayer."
    ],
    faq: [
      ["Why is Ephesians helpful for identity in Christ?", "Ephesians repeatedly grounds believers in what God has done in Christ before calling them to live in a worthy manner."],
      ["Where should I start in Ephesians?", "Ephesians 1:3-14 and 2:1-10 are strong starting passages because they highlight grace, salvation, and identity in Christ."],
      ["Which study method suits Ephesians?", "Word study is useful for repeated phrases, and OIA helps connect doctrine with practical application."]
    ],
    cta: "Start a guided study",
    related: ["/bible-study-methods/word-study", "/bible-study-methods/oia", "/bible-study-methods/topical-study"],
    extraBlocks: [
      {
        type: "example",
        title: "Worked example: Ephesians 4:1-6",
        intro: "Ephesians 4:1-6 is a clear example of how Paul moves from gospel calling to practical unity.",
        items: [
          ["Observation", "Paul urges believers to walk worthy of their calling with humility, gentleness, patience, love, and unity."],
          ["Interpretation", "The command to preserve unity is grounded in shared gospel realities: one body, one Spirit, one hope, one Lord, one faith, one baptism, and one God."],
          ["Application", "A faithful response could be to choose one relationship where humility and patience need to become visible."],
          ["Prayer", "Father, help me live in a way that reflects Your grace and preserves unity in love."]
        ]
      },
      {
        type: "checklist",
        title: "Ephesians study checklist",
        intro: "These prompts help keep Ephesians connected from doctrine to daily life.",
        items: [
          "Notice what God has done before focusing on what you should do.",
          "Trace repeated phrases such as in Christ and walk.",
          "Connect personal application with church unity.",
          "Do not separate spiritual growth from prayer.",
          "Let grace shape obedience rather than guilt."
        ]
      },
      {
        type: "cta",
        title: "Start studying Ephesians",
        intro: "Open Ephesians 4:1-6 with OIA in Bible Study Tutor, or use the word-study guide on this site to trace repeated language carefully.",
        href: "/?tab=study&method=oia&passage=Ephesians%204%3A1-6",
        label: "Study Ephesians with OIA"
      }
    ]
  },
  {
    path: "/how-to-study-philippians",
    file: "how-to-study-philippians.html",
    title: "How to Study Philippians | Joy, Humility and Life in Christ",
    description: "Learn how to study Philippians by tracing joy, partnership, humility, suffering, contentment, prayer, and the mind of Christ.",
    heading: "How to study Philippians",
    intro: "Philippians is a warm letter about joy in Christ, gospel partnership, humility, endurance, and contentment in every circumstance.",
    sections: [
      ["Why Philippians matters", "Philippians teaches joy that is rooted in Christ rather than circumstances and shows how the gospel shapes humility and perseverance."],
      ["How to approach it", "Watch for repeated language about joy, partnership, the gospel, thinking, standing firm, and life in Christ."],
      ["Recommended study method", "Use SOAP for devotional study and word study for repeated themes such as joy, mind, gospel, and contentment."],
      ["Suggested starter passages", "Begin with Philippians 1:3-11, Philippians 1:21-30, Philippians 2:1-11, Philippians 3:7-14, and Philippians 4:4-13."],
      ["Links to Bible study methods", "Philippians pairs well with SOAP, word study, and Lectio Divina."]
    ],
    schemaType: "HowTo",
    howToSteps: [
      "Read the passage and mark repeated words such as joy, rejoice, gospel, mind, and Christ.",
      "Notice Paul's circumstances and how they shape the passage.",
      "Ask how the passage points to Christ as the source, pattern, and goal of life.",
      "Write one sentence about the attitude or practice Paul commends.",
      "Respond with prayer, thanksgiving, or a concrete act of humble service."
    ],
    faq: [
      ["Why is Philippians called a letter of joy?", "Philippians repeatedly speaks of joy and rejoicing, but that joy is rooted in Christ and gospel partnership rather than easy circumstances."],
      ["What is a good passage for anxiety and prayer?", "Philippians 4:4-9 is a strong passage to study prayer, thanksgiving, peace, and disciplined thought."],
      ["Which method should I use for Philippians?", "SOAP works well for devotional reflection, and word study helps trace repeated themes across the letter."]
    ],
    cta: "Start a guided study",
    related: ["/bible-study-methods/soap", "/bible-study-methods/word-study", "/bible-study-methods/lectio-divina"],
    extraBlocks: [
      {
        type: "example",
        title: "Worked example: Philippians 4:4-9",
        intro: "Philippians 4:4-9 is often used for anxiety, but it should be studied as a call to rejoicing, prayer, thanksgiving, and disciplined attention to what is good.",
        items: [
          ["Observation", "Paul commands rejoicing, gentleness, prayer with thanksgiving, and attention to what is true, honorable, just, pure, lovely, and commendable."],
          ["Interpretation", "The passage does not pretend believers never feel anxiety. It calls anxious hearts toward prayerful dependence and the peace of God."],
          ["Application", "A faithful response could be to turn a specific worry into prayer and name one true thing to meditate on today."],
          ["Prayer", "Lord, teach me to bring my anxieties to You with thanksgiving and to set my mind on what is pleasing to You."]
        ]
      },
      {
        type: "checklist",
        title: "Philippians study checklist",
        intro: "Use these questions to keep joy connected to Christ and the gospel.",
        items: [
          "Notice how joy appears alongside suffering or difficulty.",
          "Trace references to the gospel and partnership.",
          "Look for commands about thinking, humility, and contentment.",
          "Ask how Christ is the pattern and source of obedience.",
          "Apply the passage with prayer rather than pressure."
        ]
      },
      {
        type: "cta",
        title: "Start studying Philippians",
        intro: "Open Philippians in Bible Study Tutor and use SOAP prompts for prayerful, practical reflection.",
        href: "/?tab=study&method=soap&passage=Philippians%204%3A4-9",
        label: "Start a Philippians study"
      }
    ]
  },
  {
    path: "/how-to-study-james",
    file: "how-to-study-james.html",
    title: "How to Study James | Faith, Wisdom, Works and Steadfastness",
    description: "Learn how to study James by tracing practical faith, wisdom, trials, speech, humility, works, prayer, and steadfast obedience.",
    heading: "How to study James",
    intro: "James is direct, practical, and searching. It presses readers to receive God’s wisdom and live out genuine faith with steadfast obedience.",
    sections: [
      ["Why James matters", "James connects faith with trials, speech, generosity, humility, prayer, wisdom, and active obedience."],
      ["How to approach it", "Read James as wisdom-filled instruction. Notice commands, contrasts, illustrations, and repeated concern for whole-hearted faith."],
      ["Recommended study method", "Use topical study for themes like speech and wisdom, and use OIA to move from each command to faithful application."],
      ["Suggested starter passages", "Begin with James 1:2-8, James 1:19-27, James 2:14-26, James 3:1-12, James 4:1-10, and James 5:13-20."],
      ["Links to Bible study methods", "James works well with topical study, OIA, SOAP, and word study."]
    ],
    schemaType: "HowTo",
    howToSteps: [
      "Read the passage and underline direct commands or contrasts.",
      "Identify the practical issue James addresses: trials, speech, partiality, wisdom, prayer, or works.",
      "Ask how the passage exposes divided loyalty or calls for whole-hearted faith.",
      "Summarize the passage as wisdom for faithful living.",
      "Choose one concrete practice that puts the passage into action."
    ],
    faq: [
      ["How should I understand faith and works in James?", "James emphasizes that genuine faith becomes visible in action. It should be read alongside the whole Bible's teaching on grace, faith, and obedience."],
      ["Is James practical for new believers?", "Yes. James is direct and memorable, but it is best studied slowly so application grows from the text rather than from guilt."],
      ["What study method works best for James?", "Topical study is useful for themes like speech and wisdom, while OIA keeps each passage connected to faithful application."]
    ],
    cta: "Start a guided study",
    related: ["/bible-study-methods/topical-study", "/bible-study-methods/oia", "/bible-study-methods/soap"],
    extraBlocks: [
      {
        type: "example",
        title: "Worked example: James 1:2-8",
        intro: "James 1:2-8 helps readers study trials, steadfastness, wisdom, and prayer without turning hardship into a shallow slogan.",
        items: [
          ["Observation", "James speaks to trials, testing, steadfastness, maturity, wisdom, prayer, faith, and double-mindedness."],
          ["Interpretation", "The passage teaches that God can use trials to produce steadfastness and that believers should ask Him for wisdom in the middle of them."],
          ["Application", "A faithful response could be to name one trial honestly and ask God for wisdom rather than only asking for the situation to end."],
          ["Prayer", "Father, give me wisdom, steadfastness, and undivided trust as I walk through difficulty."]
        ]
      },
      {
        type: "checklist",
        title: "James study cautions",
        intro: "James is practical and direct, but careful study keeps it from becoming mere moralism.",
        items: [
          "Read commands in light of God's grace and wisdom.",
          "Notice contrasts such as hearing and doing, wisdom and selfish ambition, humility and pride.",
          "Avoid using James to create shame without hope.",
          "Apply the passage concretely, especially in speech and relationships.",
          "Let prayer remain central to obedience."
        ]
      },
      {
        type: "cta",
        title: "Start studying James",
        intro: "Open James in Bible Study Tutor and use OIA or topical study prompts to turn careful reading into practical obedience.",
        href: "/?tab=study&method=oia&passage=James%201%3A2-8",
        label: "Start a James study"
      }
    ]
  }
];

const generatedJournalExamplesByPath = {
  "/printable-bible-study-worksheets": journalExample({
    title: "Example worksheet notes: Romans 8:1",
    intro: "A worksheet can show the selected Scripture first, then leave room for notes that grow out of marked words and phrases.",
    reference: "Romans 8:1",
    scriptureHtml: "<span class=\"scripture-underline\">There is therefore</span> now <mark>no condemnation</mark> to them which are in Christ Jesus.",
    notes: [
      ["Observation", "Therefore links the verse to Paul's earlier argument. No condemnation is the central promise."],
      ["Interpretation", "The promise belongs to those who are in Christ Jesus, not to people trying to justify themselves."],
      ["Application", "A worksheet response could name one fear or accusation and answer it with this promise."]
    ]
  }),
  "/bible-study-methods": journalExample({
    title: "Method example: John 15:5",
    intro: "Different methods can study the same verse from different angles while keeping the Scripture visible.",
    reference: "John 15:5",
    scriptureHtml: "I am the <mark>vine</mark>, ye are the branches: He that <span class=\"scripture-underline\">abideth in me</span>, and I in him, the same bringeth forth much fruit.",
    notes: [
      ["Observation", "The image links Jesus, branches, abiding, and fruitfulness."],
      ["Method choice", "SOAP could turn this into prayer; OIA could trace the image; word study could examine abide."],
      ["Application", "The response should grow from dependence on Christ rather than self-produced effort."]
    ]
  }),
  "/bible-study-methods/inductive": journalExample({
    title: "Inductive journal example: Romans 8:1",
    intro: "Inductive study benefits from visible markings because observations need to be separated from conclusions.",
    reference: "Romans 8:1",
    scriptureHtml: "<span class=\"scripture-underline\">There is therefore</span> now <mark>no condemnation</mark> to them which are in Christ Jesus.",
    notes: [
      ["Observation", "Therefore points backward. No condemnation is stated as a present reality."],
      ["Interpretation", "Paul's conclusion rests on Christ's work, not on a believer's emotional confidence."],
      ["Application", "The passage invites trust in Christ when guilt or fear is loud."]
    ]
  }),
  "/bible-study-methods/oia": journalExample({
    title: "OIA journal example: Philippians 4:6",
    intro: "OIA moves from what is seen in the text to what it means, then to one faithful response.",
    reference: "Philippians 4:6",
    scriptureHtml: "Be careful for nothing; but in every thing by <mark>prayer</mark> and supplication with <span class=\"scripture-underline\">thanksgiving</span> let your requests be made known unto God.",
    notes: [
      ["Observation", "The verse contrasts anxiety with prayer, supplication, thanksgiving, and requests."],
      ["Interpretation", "The passage calls believers to bring needs to God rather than carrying anxiety alone."],
      ["Application", "A response could be to turn one specific worry into prayer with thanksgiving today."]
    ]
  }),
  "/bible-study-methods/lectio-divina": journalExample({
    title: "Lectio journal example: Psalm 46:10",
    intro: "A Lectio-style journal entry often marks one phrase and turns attention slowly toward prayer.",
    reference: "Psalm 46:10",
    scriptureHtml: "<mark>Be still</mark>, and know that <span class=\"scripture-underline\">I am God</span>.",
    notes: [
      ["Notice", "The phrase be still draws attention because it is direct and simple."],
      ["Reflect", "The command is connected to knowing God, not merely becoming quiet for quietness' sake."],
      ["Pray", "Lord, quiet my striving and teach me to know You as God today."]
    ]
  }),
  "/bible-study-methods/verse-mapping": journalExample({
    title: "Verse mapping example: Ephesians 2:8",
    intro: "Verse mapping can mark repeated ideas, connecting words, and theological anchors in one verse.",
    reference: "Ephesians 2:8",
    scriptureHtml: "For by <mark>grace</mark> are ye saved through faith; and that not of yourselves: it is the <span class=\"scripture-underline\">gift of God</span>.",
    notes: [
      ["Key words", "Grace, saved, faith, yourselves, and gift carry the main meaning."],
      ["Connection", "The verse explains salvation as God's gift rather than human achievement."],
      ["Response", "The application should lead to humility, gratitude, and trust."]
    ]
  }),
  "/bible-study-methods/word-study": journalExample({
    title: "Word study example: abide",
    intro: "A word study should mark the word in context before moving to broader themes.",
    reference: "John 15:4",
    scriptureHtml: "<mark>Abide</mark> in me, and I in you. As the branch cannot bear fruit of itself, except it <span class=\"scripture-underline\">abide</span> in the vine.",
    notes: [
      ["Word in context", "Abide is used with the vine and branch image, so the word is about dependent connection."],
      ["Safeguard", "The meaning should come from John 15 before jumping to other passages."],
      ["Application", "The response is to remain dependent on Christ rather than trying to bear fruit alone."]
    ]
  }),
  "/bible-study-methods/topical-study": journalExample({
    title: "Topical study example: wisdom",
    intro: "A topical study can begin with one anchor passage before comparing other verses.",
    reference: "James 1:5",
    scriptureHtml: "If any of you lack <mark>wisdom</mark>, let him ask of God, that giveth to all men liberally.",
    notes: [
      ["Anchor text", "Wisdom is connected to asking God, especially in the context of trials."],
      ["Theme", "The topic should stay tied to the passage rather than becoming a loose list of ideas."],
      ["Application", "A faithful response is to ask God for wisdom in one named situation."]
    ]
  }),
  "/bible-study-methods/character-study": journalExample({
    title: "Character study example: Mary",
    intro: "A character study should notice a person's words and actions before drawing lessons.",
    reference: "Luke 1:38",
    scriptureHtml: "And Mary said, Behold the <mark>handmaid of the Lord</mark>; be it unto me according to thy word.",
    notes: [
      ["Observation", "Mary identifies herself in relation to the Lord and receives the word spoken to her."],
      ["Meaning", "Her response shows humble trust, but the passage remains centered on God's promise."],
      ["Application", "The response is not to imitate circumstances but to receive God's word with humble faith."]
    ]
  }),
  "/bible-study-methods/cross-reference-study": journalExample({
    title: "Cross-reference example: Genesis 15:6",
    intro: "Cross references are most useful when the first passage is understood before related passages are compared.",
    reference: "Genesis 15:6",
    scriptureHtml: "And he <mark>believed in the Lord</mark>; and he counted it to him for <span class=\"scripture-underline\">righteousness</span>.",
    notes: [
      ["Anchor passage", "The verse connects believing the Lord with righteousness."],
      ["Related passages", "Romans 4 and Galatians 3 later reflect on this verse, but Genesis 15 should be read first."],
      ["Application", "Cross references should deepen confidence in God's promise, not replace the original context."]
    ]
  }),
  "/free-bible-study-app": journalExample({
    title: "Free study example: Matthew 6:33",
    intro: "The free app experience supports ordinary Scripture study: read, mark, observe, apply, and save.",
    reference: "Matthew 6:33",
    scriptureHtml: "But seek ye first the <mark>kingdom of God</mark>, and his righteousness; and all these things shall be added unto you.",
    notes: [
      ["Observation", "The command is to seek God's kingdom and righteousness first."],
      ["Interpretation", "The verse sits in Jesus' teaching about worry, needs, and trust in the Father."],
      ["Application", "A saved note could name one anxious priority that needs to be reordered."]
    ]
  }),
  "/bible-study-for-beginners": journalExample({
    title: "Beginner journal example: Mark 1:15",
    intro: "Beginners do not need complicated notes. A short passage can become a clear observation and response.",
    reference: "Mark 1:15",
    scriptureHtml: "The time is fulfilled, and the <mark>kingdom of God</mark> is at hand: repent ye, and believe the gospel.",
    notes: [
      ["Observation", "Jesus announces the kingdom of God and calls for repentance and belief."],
      ["Meaning", "The passage presents good news as something to receive and respond to."],
      ["Application", "A beginner can ask where the gospel calls for trust and change today."]
    ]
  }),
  "/printable-bible-study-worksheet-for-small-groups": journalExample({
    title: "Small group worksheet example: Colossians 3:12",
    intro: "A group worksheet can mark words that shape discussion before people answer questions.",
    reference: "Colossians 3:12",
    scriptureHtml: "Put on therefore, as the elect of God, holy and beloved, <mark>bowels of mercies</mark>, kindness, humbleness of mind, meekness, longsuffering.",
    notes: [
      ["Observation", "The command to put on is grounded in identity: elect, holy, and beloved."],
      ["Discussion", "The group can list the qualities and ask where each is needed in community."],
      ["Prayer", "The worksheet can end by praying for Christlike patience and mercy."]
    ]
  }),
  "/printable-soap-bible-study-worksheet": journalExample({
    title: "Printable SOAP example: Psalm 121:2",
    intro: "A printable SOAP worksheet can keep Scripture and prayer together on one page.",
    reference: "Psalm 121:2",
    scriptureHtml: "My help cometh from the <mark>Lord</mark>, which made heaven and earth.",
    notes: [
      ["Scripture", "The verse identifies the Lord as the source of help."],
      ["Observation", "The Lord is not only near but also Creator of heaven and earth."],
      ["Application", "The response is to seek help from God before grasping for control."],
      ["Prayer", "Lord, teach me to look to You for help today."]
    ]
  }),
  "/printable-inductive-bible-study-worksheet": journalExample({
    title: "Printable inductive example: Ephesians 2:10",
    intro: "An inductive worksheet can keep observations visible before summary and application.",
    reference: "Ephesians 2:10",
    scriptureHtml: "For we are his <mark>workmanship</mark>, created in Christ Jesus unto good works.",
    notes: [
      ["Observation", "The verse names believers as God's workmanship and connects new creation with good works."],
      ["Interpretation", "Good works flow from God's saving work rather than earning salvation."],
      ["Application", "The worksheet can ask what prepared good work might be walked in today."]
    ]
  }),
  "/printable-bible-study-journal": journalExample({
    title: "Printable journal example: Psalm 119:105",
    intro: "A printable journal page can show the verse, marked words, and a few structured reflections.",
    reference: "Psalm 119:105",
    scriptureHtml: "Thy word is a <mark>lamp</mark> unto my feet, and a <span class=\"scripture-underline\">light</span> unto my path.",
    notes: [
      ["Observation", "The verse uses lamp and light imagery for God's word."],
      ["Reflection", "The image suggests guidance for the next step, not merely abstract information."],
      ["Prayer", "Lord, guide my next step through Your word."]
    ]
  }),
  "/bible-study-worksheet-for-youth-groups": journalExample({
    title: "Youth worksheet example: 1 Timothy 4:12",
    intro: "A youth worksheet can highlight the direct call and then ask for practical examples.",
    reference: "1 Timothy 4:12",
    scriptureHtml: "Let no man despise thy youth; but be thou an <mark>example</mark> of the believers.",
    notes: [
      ["Observation", "The verse connects youth with being an example in visible ways."],
      ["Discussion", "Students can list what example looks like in speech, conduct, love, faith, and purity."],
      ["Application", "Each person can choose one setting where faith should become visible this week."]
    ]
  }),
  "/bible-study-worksheet-for-church-groups": journalExample({
    title: "Church group worksheet example: Acts 2:42",
    intro: "A church group worksheet can mark the shared practices of the early believers.",
    reference: "Acts 2:42",
    scriptureHtml: "And they continued stedfastly in the apostles' doctrine and <mark>fellowship</mark>, and in breaking of bread, and in prayers.",
    notes: [
      ["Observation", "The verse lists teaching, fellowship, breaking bread, and prayers."],
      ["Meaning", "The early church's life was shared, steady, and shaped by doctrine and prayer."],
      ["Application", "A group can ask which shared practice needs renewed attention."]
    ]
  }),
  "/online-bible-study-journal": journalExample({
    title: "Online journal example: John 15:4",
    intro: "An online journal can preserve marked Scripture alongside the user's own reflection.",
    reference: "John 15:4",
    scriptureHtml: "<mark>Abide</mark> in me, and I in you.",
    notes: [
      ["Observation", "The command is relational and repeated in the wider passage."],
      ["Reflection", "The verse calls for remaining with Christ, not simply working harder for Him."],
      ["Prayer", "Lord Jesus, teach me to abide in You today."]
    ]
  }),
  "/bible-study-journal": journalExample({
    title: "Bible study journal example: Psalm 27:1",
    intro: "A Bible study journal becomes more useful when the verse, markings, and response stay together.",
    reference: "Psalm 27:1",
    scriptureHtml: "The Lord is my <mark>light</mark> and my salvation; whom shall I fear?",
    notes: [
      ["Observation", "The verse names the Lord as light and salvation before asking about fear."],
      ["Meaning", "Confidence comes from who the Lord is, not from the absence of danger."],
      ["Application", "A journal response could name one fear in light of God's saving care."]
    ]
  }),
  "/bible-highlighting-and-notes": journalExample({
    title: "Highlighting example: Hebrews 4:12",
    intro: "Highlights are most helpful when they lead to a written observation rather than decoration only.",
    reference: "Hebrews 4:12",
    scriptureHtml: "For the word of God is <mark>quick, and powerful</mark>, and sharper than any twoedged sword.",
    notes: [
      ["Observation", "The highlighted words describe God's word as living and active."],
      ["Meaning", "The verse presents Scripture as something that searches and exposes, not merely informs."],
      ["Response", "A note can ask where God's word is calling for honesty and trust."]
    ]
  }),
  "/bible-study-for-small-groups": journalExample({
    title: "Small group study example: Ephesians 4:32",
    intro: "Small group notes should keep the passage central before discussion moves to personal stories.",
    reference: "Ephesians 4:32",
    scriptureHtml: "And be ye <mark>kind one to another</mark>, tenderhearted, forgiving one another, even as God for Christ's sake hath forgiven you.",
    notes: [
      ["Observation", "The command includes kindness, tenderheartedness, and forgiveness."],
      ["Meaning", "The reason for forgiving one another is God's forgiveness in Christ."],
      ["Application", "A group can name one relationship where gospel-shaped forgiveness is needed."]
    ]
  }),
  "/bible-study-app-for-churches": journalExample({
    title: "Church use example: 2 Timothy 3:16",
    intro: "A church can use the app to help people observe what Scripture says before discussing application.",
    reference: "2 Timothy 3:16",
    scriptureHtml: "All scripture is given by inspiration of God, and is <mark>profitable</mark> for doctrine, for reproof, for correction, for instruction in righteousness.",
    notes: [
      ["Observation", "The verse lists several ways Scripture is profitable."],
      ["Meaning", "Scripture forms belief and life because it is God-given."],
      ["Application", "A church group can ask which use of Scripture is most needed in the current series."]
    ]
  }),
  "/free-bible-study-app-for-small-groups": journalExample({
    title: "Free small group example: Galatians 5:13",
    intro: "A free group tool should still keep discussion close to the words of the passage.",
    reference: "Galatians 5:13",
    scriptureHtml: "By love <mark>serve one another</mark>.",
    notes: [
      ["Observation", "Freedom is connected to serving one another by love."],
      ["Meaning", "Christian liberty should not become selfishness but loving service."],
      ["Application", "A small group can choose one practical way to serve someone this week."]
    ]
  }),
  "/bible-study-app-with-printable-worksheets": journalExample({
    title: "Digital-to-print example: Micah 6:8",
    intro: "The same marked passage can become a saved digital note or a printed worksheet.",
    reference: "Micah 6:8",
    scriptureHtml: "What doth the Lord require of thee, but to do <mark>justly</mark>, and to love mercy, and to walk humbly with thy God?",
    notes: [
      ["Observation", "The verse names justice, mercy, and humble walking with God."],
      ["Worksheet prompt", "Ask where each phrase touches ordinary relationships and choices."],
      ["Application", "Choose one concrete act of justice, mercy, or humility."]
    ]
  }),
  "/how-to-study-romans": journalExample({
    title: "Romans journal example: Romans 8:1",
    intro: "Romans rewards careful attention to connecting words and theological claims.",
    reference: "Romans 8:1",
    scriptureHtml: "<span class=\"scripture-underline\">There is therefore</span> now <mark>no condemnation</mark> to them which are in Christ Jesus.",
    notes: [
      ["Observation", "Therefore links the verse to Paul's previous argument."],
      ["Meaning", "No condemnation is grounded in Christ, not human performance."],
      ["Application", "Romans should lead to confidence in Christ and humble obedience."]
    ]
  }),
  "/how-to-study-the-gospel-of-john": journalExample({
    title: "John journal example: John 20:31",
    intro: "John often states his purpose clearly, which helps guide a book study.",
    reference: "John 20:31",
    scriptureHtml: "But these are written, that ye might <mark>believe</mark> that Jesus is the Christ, the Son of God.",
    notes: [
      ["Observation", "John states that the signs and testimony are written for belief."],
      ["Meaning", "The Gospel aims to reveal Jesus as the Christ, the Son of God."],
      ["Application", "A study of John should ask how each passage calls for faith in Jesus."]
    ]
  }),
  "/how-to-study-genesis": journalExample({
    title: "Genesis journal example: Genesis 1:1",
    intro: "Genesis begins with God as Creator, which shapes the rest of the book.",
    reference: "Genesis 1:1",
    scriptureHtml: "In the beginning <mark>God created</mark> the heaven and the earth.",
    notes: [
      ["Observation", "God is the subject of the opening sentence."],
      ["Meaning", "Creation begins with God's action, authority, and purpose."],
      ["Application", "A Genesis study should begin with worship and creaturely humility."]
    ]
  }),
  "/how-to-study-psalms": journalExample({
    title: "Psalms journal example: Psalm 1:2",
    intro: "Psalms often invite slow meditation rather than quick extraction of a lesson.",
    reference: "Psalm 1:2",
    scriptureHtml: "But his delight is in the <mark>law of the Lord</mark>; and in his law doth he meditate day and night.",
    notes: [
      ["Observation", "Delight and meditation are connected to the Lord's instruction."],
      ["Meaning", "The blessed life is shaped by sustained attention to God's word."],
      ["Application", "A Psalm can become prayer and meditation through the day."]
    ]
  }),
  "/how-to-study-proverbs": journalExample({
    title: "Proverbs journal example: Proverbs 3:5",
    intro: "Proverbs should be studied as wisdom that shapes trust and daily choices.",
    reference: "Proverbs 3:5",
    scriptureHtml: "Trust in the Lord with <mark>all thine heart</mark>; and lean not unto thine own understanding.",
    notes: [
      ["Observation", "Trust in the Lord is contrasted with leaning on one's own understanding."],
      ["Meaning", "Wisdom begins with dependence on the Lord, not self-reliance."],
      ["Application", "Name one decision where trust must replace self-protection."]
    ]
  }),
  "/how-to-study-matthew": journalExample({
    title: "Matthew journal example: Matthew 5:16",
    intro: "Matthew often connects discipleship with visible obedience and the glory of the Father.",
    reference: "Matthew 5:16",
    scriptureHtml: "Let your <mark>light</mark> so shine before men, that they may see your good works, and glorify your Father which is in heaven.",
    notes: [
      ["Observation", "Good works are visible, but the goal is the Father's glory."],
      ["Meaning", "Discipleship is public without becoming self-promoting."],
      ["Application", "Choose one quiet act that points beyond self to the Father."]
    ]
  }),
  "/how-to-study-mark": journalExample({
    title: "Mark journal example: Mark 10:45",
    intro: "Mark moves quickly, but key verses reveal Jesus' mission.",
    reference: "Mark 10:45",
    scriptureHtml: "For even the Son of man came not to be ministered unto, but to <mark>minister</mark>, and to give his life a ransom for many.",
    notes: [
      ["Observation", "Jesus contrasts being served with serving and giving His life."],
      ["Meaning", "The verse summarizes the servant mission of Jesus."],
      ["Application", "A study of Mark should lead to worship and servant-hearted discipleship."]
    ]
  }),
  "/how-to-study-luke": journalExample({
    title: "Luke journal example: Luke 19:10",
    intro: "Luke often highlights Jesus' compassion for the lost and overlooked.",
    reference: "Luke 19:10",
    scriptureHtml: "For the Son of man is come to <mark>seek and to save</mark> that which was lost.",
    notes: [
      ["Observation", "Jesus describes His mission as seeking and saving the lost."],
      ["Meaning", "The passage reveals purposeful mercy, not accidental kindness."],
      ["Application", "A Luke study can ask who Jesus sees that others overlook."]
    ]
  }),
  "/how-to-study-acts": journalExample({
    title: "Acts journal example: Acts 1:8",
    intro: "Acts should be studied with attention to the Spirit, witness, and movement of the gospel.",
    reference: "Acts 1:8",
    scriptureHtml: "But ye shall receive <mark>power</mark>, after that the Holy Ghost is come upon you: and ye shall be witnesses unto me.",
    notes: [
      ["Observation", "Power is connected to the Holy Spirit and witness."],
      ["Meaning", "Acts begins with mission empowered by God rather than human strategy alone."],
      ["Application", "Ask where faithful witness depends on the Spirit's help."]
    ]
  }),
  "/how-to-study-ephesians": journalExample({
    title: "Ephesians journal example: Ephesians 2:10",
    intro: "Ephesians connects identity in Christ with a transformed walk.",
    reference: "Ephesians 2:10",
    scriptureHtml: "For we are his <mark>workmanship</mark>, created in Christ Jesus unto good works.",
    notes: [
      ["Observation", "Believers are described as God's workmanship."],
      ["Meaning", "Good works flow from being created in Christ Jesus."],
      ["Application", "Ask what walking in grace-shaped good works looks like today."]
    ]
  }),
  "/how-to-study-philippians": journalExample({
    title: "Philippians journal example: Philippians 1:21",
    intro: "Philippians studies joy, suffering, humility, and Christ-centered life.",
    reference: "Philippians 1:21",
    scriptureHtml: "For to me to live is <mark>Christ</mark>, and to die is gain.",
    notes: [
      ["Observation", "Paul frames both life and death around Christ."],
      ["Meaning", "Christ is not one part of Paul's life but the defining center."],
      ["Application", "Ask what would change if Christ were consciously central today."]
    ]
  }),
  "/how-to-study-james": journalExample({
    title: "James journal example: James 1:22",
    intro: "James calls readers to let the word become visible in practice.",
    reference: "James 1:22",
    scriptureHtml: "But be ye <mark>doers of the word</mark>, and not hearers only, deceiving your own selves.",
    notes: [
      ["Observation", "James contrasts doing the word with hearing only."],
      ["Meaning", "Receiving God's word should produce obedient action."],
      ["Application", "Choose one concrete act of obedience before the day ends."]
    ]
  })
};

mkdirSync(publicDir, { recursive: true });
copyFileSync(join(process.cwd(), "assets", "icon.png"), join(publicDir, "icon.png"));
copyFileSync(join(process.cwd(), "assets", "favicon.png"), join(publicDir, "favicon.png"));
copyFileSync(join(process.cwd(), "assets", "apple-touch-icon.png"), join(publicDir, "apple-touch-icon.png"));
copyFileSync(join(process.cwd(), "assets", "social-preview.png"), join(publicDir, "social-preview.png"));
copyFileSync(join(process.cwd(), "node_modules", "@expo", "vector-icons", "build", "vendor", "react-native-vector-icons", "Fonts", "Ionicons.ttf"), join(publicDir, "ionicons.ttf"));
copyFileSync(join(process.cwd(), "node_modules", "@expo", "vector-icons", "build", "vendor", "react-native-vector-icons", "Fonts", "MaterialCommunityIcons.ttf"), join(publicDir, "material-community-icons.ttf"));
writeFileIfChanged(join(publicDir, "favicon.ico"), pngToIco(readFileSync(join(process.cwd(), "assets", "favicon.png")), 48, 48));

const robots = [
  "User-agent: *",
  "Allow: /",
  siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml` : ""
].filter(Boolean).join("\n") + "\n";

writeFileIfChanged(join(publicDir, "robots.txt"), robots);
writeFileIfChanged(join(publicDir, "404.html"), buildNotFoundPage(siteUrl));

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
  const image = baseUrl ? `${baseUrl}/social-preview.png` : "/social-preview.png";
  const ctaHref = getCtaHref(page, appUrl);
  const ctaLabel = getStandardCtaLabel(page);
  const analyticsSnippet = buildAnalyticsSnippet(page, ctaHref);
  const breadcrumbs = getBreadcrumbs(page);
  const relatedPages = (page.related || [])
    .map((path) => seoPages.find((candidate) => candidate.path === path))
    .filter(Boolean);
  const pageExtraBlocks = withGeneratedJournalExample(page);
  const leadHowToBlock = page.showHowToSteps && page.howToSteps?.length
    ? buildVisibleHowToSteps(page)
    : "";
  const pageSpecificStyles = pageExtraBlocks.some((block) => block.type === "table")
    ? `<style>
      .table-wrap { margin-top: 14px; overflow-x: auto; }
      .comparison-table { border-collapse: collapse; min-width: 620px; width: 100%; }
      .comparison-table th, .comparison-table td { border: 1px solid var(--line); line-height: 1.55; padding: 13px 14px; text-align: left; vertical-align: top; }
      .comparison-table th { background: #f2eadc; color: var(--olive); font-size: 14px; }
      .comparison-table td { background: #fffaf2; color: var(--muted); }
    </style>`
    : "";
  const sections = page.sections
    .map(([heading, body]) => `<section><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(body)}</p></section>`)
    .join("\n");
  const extraBlocks = pageExtraBlocks
    .map((block) => buildExtraSeoBlock(block))
    .join("\n");
  const faqBlock = page.faq?.length
    ? `<section class="faq-section" aria-labelledby="faq-heading">
        <h2 id="faq-heading">Common questions</h2>
        <div class="faq-list">
          ${page.faq.map(([question, answer]) => `<details><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join("\n          ")}
        </div>
      </section>`
    : "";
  const breadcrumbLinks = breadcrumbs
    .map((crumb, index) => {
      const isLast = index === breadcrumbs.length - 1;
      return isLast
        ? `<span aria-current="page">${escapeHtml(crumb.label)}</span>`
        : `<a href="${escapeHtml(crumb.href)}">${escapeHtml(crumb.label)}</a>`;
    })
    .join("\n          <span aria-hidden=\"true\">/</span>\n          ");
  const relatedLinks = relatedPages.length
    ? `<aside class="related" aria-labelledby="related-heading">
        <h2 id="related-heading">Related Bible study resources</h2>
        <div class="related-grid">
          ${relatedPages.map((related) => `<a href="${escapeHtml(related.path)}"><strong>${escapeHtml(related.heading)}</strong><span>${escapeHtml(related.description)}</span></a>`).join("\n          ")}
        </div>
      </aside>`
    : "";
  const jsonLd = buildSeoStructuredData(page, canonical, appUrl);

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
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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
    ${analyticsSnippet}
    <style>
      :root { color-scheme: light; --ink: #241d19; --muted: #6f665c; --paper: #f8f1e6; --panel: #fffdf8; --line: #e4d6c5; --olive: #39452e; --coral: #c96750; }
      * { box-sizing: border-box; }
      body { background: var(--paper); color: var(--ink); font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; }
      .shell { margin: 0 auto; max-width: 980px; padding-left: 20px; padding-right: 20px; }
      .site-header { border-bottom: 1px solid var(--line); background: rgba(255, 253, 248, .72); }
      .site-header .shell { align-items: center; display: flex; flex-wrap: wrap; gap: 18px; justify-content: space-between; padding-bottom: 18px; padding-top: 18px; }
      .brand { color: var(--olive); font-weight: 900; text-decoration: none; }
      .main-nav { display: flex; flex-wrap: wrap; gap: 14px; }
      .main-nav a { color: var(--olive); font-weight: 800; text-decoration: none; }
      main { padding-bottom: 48px; padding-top: 34px; }
      .breadcrumb { align-items: center; color: var(--muted); display: flex; flex-wrap: wrap; font-size: 14px; gap: 8px; margin-bottom: 22px; }
      .breadcrumb a { color: var(--olive); font-weight: 800; text-decoration: none; }
      .button { align-items: center; background: var(--olive); border-radius: 999px; color: white; display: inline-flex; font-weight: 800; min-height: 42px; padding: 10px 16px; text-decoration: none; }
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
      .faq-section { margin-top: 28px; }
      .faq-list { display: grid; gap: 10px; margin-top: 14px; }
      .extra-block { margin-top: 18px; }
      .extra-block ul, .extra-block ol { color: var(--muted); line-height: 1.65; margin: 12px 0 0; padding-left: 22px; }
      .extra-block li + li { margin-top: 7px; }
      .example-grid, .preview-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-top: 14px; }
      .example-card, .preview-card { background: #fbf5eb; border: 1px solid var(--line); border-radius: 12px; padding: 15px; }
      .example-card h3, .preview-card h3 { color: var(--coral); font-size: 14px; letter-spacing: .04em; margin: 0 0 8px; text-transform: uppercase; }
      .journal-example { display: grid; gap: 14px; }
      .journal-scripture { background: #fffaf2; border: 1px solid var(--line); border-radius: 12px; padding: 16px; }
      .journal-reference { color: var(--coral); font-size: 13px; font-weight: 900; letter-spacing: .05em; margin-bottom: 10px; text-transform: uppercase; }
      .scripture-text { color: var(--ink); font-family: Georgia, "Times New Roman", serif; font-size: 22px; line-height: 1.65; }
      .scripture-text mark { background: #f4dfb6; border-radius: 6px; box-decoration-break: clone; -webkit-box-decoration-break: clone; padding: 1px 4px; }
      .scripture-underline { border-bottom: 3px solid rgba(201, 103, 80, .42); padding-bottom: 1px; }
      .journal-notes { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .journal-note { background: #fbf5eb; border: 1px solid var(--line); border-radius: 12px; padding: 15px; }
      .journal-note h3 { color: var(--olive); font-size: 15px; margin: 0 0 7px; }
      .extra-cta { align-items: flex-start; display: grid; gap: 14px; }
      .cta-actions { display: flex; flex-wrap: wrap; gap: 10px; }
      .button.secondary { background: transparent; border: 1px solid var(--olive); color: var(--olive); }
      details { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 16px; }
      summary { color: var(--olive); cursor: pointer; font-weight: 900; }
      details p { margin-top: 10px; }
      .cta-section { background: var(--olive); border-radius: 18px; color: white; margin-top: 30px; padding: 24px; }
      .cta-section h2 { color: white; }
      .cta-section p { color: rgba(255, 255, 255, .84); margin-bottom: 16px; max-width: 680px; }
      .cta-section .button { background: var(--coral); }
      .site-footer { border-top: 1px solid var(--line); color: var(--muted); }
      .site-footer .shell { display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; padding-bottom: 26px; padding-top: 18px; }
      .site-footer a { color: var(--olive); font-weight: 800; }
    </style>${pageSpecificStyles}
  </head>
  <body>
    <header class="site-header">
      <div class="shell">
        <a class="brand" href="/">Bible Study Tutor</a>
        <nav class="main-nav" aria-label="Main">
          <a href="/">Open app</a>
          <a href="/about">About</a>
          <a href="/printable-bible-study-worksheets">Worksheets</a>
          <a href="/bible-study-methods">Methods</a>
          <a href="/how-it-works">How it works</a>
          <a href="/pricing">Pricing</a>
          <a href="/faq">FAQ</a>
          <a href="/features">Features</a>
        </nav>
      </div>
    </header>
    <main class="shell">
      <nav class="breadcrumb" aria-label="Breadcrumb">
          ${breadcrumbLinks}
      </nav>
      <section class="hero" aria-labelledby="page-heading">
        <div class="eyebrow">Bible Study Tutor</div>
        <h1 id="page-heading">${escapeHtml(page.heading)}</h1>
        <p class="intro">${escapeHtml(page.intro)}</p>
      </section>${leadHowToBlock}
      <div class="grid">${sections}</div>
      ${extraBlocks}
      ${faqBlock}
      ${relatedLinks}
      <section class="cta-section" aria-labelledby="cta-heading">
        <h2 id="cta-heading">Continue in Bible Study Tutor</h2>
        <p>Open the free app on desktop or mobile. Bible Study Tutor is privacy-aware, has no public timeline, and includes guided study, the Bible reader, memory verses, journal tools, and printable worksheets.</p>
        <a class="button" href="${escapeHtml(ctaHref)}" aria-label="${escapeHtml(`${ctaLabel} in Bible Study Tutor`)}">${escapeHtml(ctaLabel)}</a>
      </section>
    </main>
    <footer class="site-footer">
      <div class="shell">
        <span>Free Bible study app for desktop, mobile, and printable worksheets.</span>
        <span><a href="/">Bible Study Tutor</a></span>
      </div>
    </footer>
  </body>
</html>
`;
}

function buildExtraSeoBlock(block) {
  const intro = block.intro ? `<p>${escapeHtml(block.intro)}</p>` : "";

  if (block.type === "example" || block.type === "previews") {
    const cardClass = block.type === "example" ? "example-card" : "preview-card";
    const gridClass = block.type === "example" ? "example-grid" : "preview-grid";
    const cards = (block.items || [])
      .map(([title, body]) => `<article class="${cardClass}"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></article>`)
      .join("\n          ");
    return `<section class="extra-block" aria-labelledby="${slugifyForId(block.title)}">
        <h2 id="${slugifyForId(block.title)}">${escapeHtml(block.title)}</h2>
        ${intro}
        <div class="${gridClass}">
          ${cards}
        </div>
      </section>`;
  }

  if (block.type === "checklist" || block.type === "list") {
    const items = (block.items || [])
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("\n          ");
    return `<section class="extra-block" aria-labelledby="${slugifyForId(block.title)}">
        <h2 id="${slugifyForId(block.title)}">${escapeHtml(block.title)}</h2>
        ${intro}
        <ul>
          ${items}
        </ul>
      </section>`;
  }

  if (block.type === "table") {
    const headers = (block.headers || [])
      .map((header) => `<th scope="col">${escapeHtml(header)}</th>`)
      .join("");
    const rows = (block.rows || [])
      .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
      .join("\n          ");
    return `<section class="extra-block" aria-labelledby="${slugifyForId(block.title)}">
        <h2 id="${slugifyForId(block.title)}">${escapeHtml(block.title)}</h2>
        ${intro}
        <div class="table-wrap" tabindex="0" role="region" aria-label="${escapeHtml(block.title)}">
          <table class="comparison-table">
            <thead><tr>${headers}</tr></thead>
            <tbody>
          ${rows}
            </tbody>
          </table>
        </div>
      </section>`;
  }

  if (block.type === "journalExample") {
    const notes = (block.notes || [])
      .map(([title, body]) => `<article class="journal-note"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></article>`)
      .join("\n          ");
    return `<section class="extra-block journal-example" aria-labelledby="${slugifyForId(block.title)}">
        <h2 id="${slugifyForId(block.title)}">${escapeHtml(block.title)}</h2>
        ${intro}
        <div class="journal-scripture">
          <div class="journal-reference">${escapeHtml(block.reference || "Example passage")}${block.translation ? ` · ${escapeHtml(block.translation)}` : ""}</div>
          <p class="scripture-text">${block.scriptureHtml || ""}</p>
        </div>
        <div class="journal-notes">
          ${notes}
        </div>
      </section>`;
  }

  if (block.type === "cta") {
    const href = block.href || "/";
    const label = block.label || "Open Bible Study Tutor";
    const secondaryButton = block.secondaryHref && block.secondaryLabel
      ? `<a class="button secondary" href="${escapeHtml(block.secondaryHref)}">${escapeHtml(block.secondaryLabel)}</a>`
      : "";
    return `<section class="extra-block extra-cta" aria-labelledby="${slugifyForId(block.title)}">
        <div>
          <h2 id="${slugifyForId(block.title)}">${escapeHtml(block.title)}</h2>
          ${intro}
        </div>
        <div class="cta-actions">
          <a class="button" href="${escapeHtml(href)}">${escapeHtml(label)}</a>
          ${secondaryButton}
        </div>
      </section>`;
  }

  return "";
}

function buildVisibleHowToSteps(page) {
  const items = page.howToSteps
    .map((step) => `<li>${escapeHtml(step)}</li>`)
    .join("\n          ");
  return `<section class="extra-block" aria-labelledby="step-by-step-heading">
        <h2 id="step-by-step-heading">Step-by-step process</h2>
        <ol>
          ${items}
        </ol>
      </section>`;
}

function withGeneratedJournalExample(page) {
  const blocks = [...(page.extraBlocks || [])];
  const hasJournalExample = blocks.some((block) => block.type === "journalExample");
  const generatedExample = hasJournalExample ? null : generatedJournalExamplesByPath[page.path];
  if (!generatedExample) return blocks;

  const ctaIndex = blocks.findIndex((block) => block.type === "cta");
  if (ctaIndex >= 0) {
    blocks.splice(ctaIndex, 0, generatedExample);
  } else {
    blocks.push(generatedExample);
  }
  return blocks;
}

function journalExample({ title, intro, reference, translation = "KJV", scriptureHtml, notes }) {
  return {
    type: "journalExample",
    title,
    intro,
    reference,
    translation,
    scriptureHtml,
    notes
  };
}

function buildNotFoundPage(baseUrl) {
  const canonical = baseUrl ? `${baseUrl}/` : "/";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Page not found | Bible Study Tutor</title>
  <link rel="canonical" href="${canonical}">
  <style>
    body{margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f6f1e8;color:#231f1a;display:grid;min-height:100vh;place-items:center;padding:24px}
    main{max-width:560px}
    a{color:#9f3d1e;font-weight:700}
  </style>
</head>
<body>
  <main>
    <h1>Page not found</h1>
    <p>The page or file you requested could not be found.</p>
    <p><a href="/">Open Bible Study Tutor</a></p>
  </main>
</body>
</html>
`;
}

function buildSeoStructuredData(page, canonical, appUrl) {
  const webPage = {
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

  if (page.schemaType === "FAQPage" && page.faq?.length) {
    return {
      "@context": "https://schema.org",
      "@graph": [
        stripContext(webPage),
        {
          "@type": "FAQPage",
          name: page.heading,
          url: canonical,
          mainEntity: page.faq.map(([question, answer]) => ({
            "@type": "Question",
            name: question,
            acceptedAnswer: {
              "@type": "Answer",
              text: answer
            }
          }))
        }
      ]
    };
  }

  if (page.schemaType === "HowTo" && page.howToSteps?.length) {
    const faqSchema = page.includeFaqSchema && page.faq?.length
      ? [{
          "@type": "FAQPage",
          name: `${page.heading} questions`,
          url: canonical,
          mainEntity: page.faq.map(([question, answer]) => ({
            "@type": "Question",
            name: question,
            acceptedAnswer: {
              "@type": "Answer",
              text: answer
            }
          }))
        }]
      : [];
    return {
      "@context": "https://schema.org",
      "@graph": [
        stripContext(webPage),
        {
          "@type": "HowTo",
          name: page.heading,
          description: page.description,
          url: canonical,
          step: page.howToSteps.map((step, index) => ({
            "@type": "HowToStep",
            position: index + 1,
            text: step
          }))
        },
        ...faqSchema
      ]
    };
  }

  return webPage;
}

function stripContext(item) {
  const { ["@context"]: _context, ...rest } = item;
  return rest;
}

function buildAnalyticsSnippet(page, ctaHref) {
  if (!analyticsEnabled || !analyticsSiteUrl) return "";
  const eventType = publicCtaEventType(page);
  return `<script>
      (function () {
        var endpoint = ${JSON.stringify(`${analyticsSiteUrl}/analytics`)};
        var pagePath = ${JSON.stringify(page.path)};
        var ctaTarget = ${JSON.stringify(ctaHref)};
        var methodId = ${JSON.stringify(methodIdForSeoPage(page))};
        function track(eventType, source) {
          try {
            var payload = JSON.stringify({ eventType: eventType, pagePath: pagePath, ctaTarget: ctaTarget, methodId: methodId || undefined, source: source });
            if (navigator.sendBeacon) {
              navigator.sendBeacon(endpoint, new Blob([payload], { type: "text/plain" }));
              return;
            }
            fetch(endpoint, { method: "POST", headers: { "content-type": "text/plain" }, body: payload, keepalive: true });
          } catch (error) {}
        }
        track("public_page_view", "seo_page");
        document.addEventListener("click", function (event) {
          var link = event.target && event.target.closest ? event.target.closest(".cta-section .button") : null;
          if (link) track(${JSON.stringify(eventType)}, "seo_cta");
        });
      })();
    </script>`;
}

function publicCtaEventType(page) {
  if (page.path.startsWith("/bible-study-methods/")) return "method_page_cta_clicked";
  if (page.path.includes("worksheet") || page.path.includes("printable")) return "worksheet_cta_clicked";
  if (page.path.includes("reading-plan")) return "plans_opened";
  return "seo_cta_clicked";
}

function methodIdForSeoPage(page) {
  if (!page.path.startsWith("/bible-study-methods/")) return "";
  const methodSlug = page.path.split("/").filter(Boolean).pop() || "";
  const methodMap = {
    soap: "soap",
    inductive: "inductive",
    oia: "oia",
    "lectio-divina": "lectio",
    "verse-mapping": "verse-mapping",
    "topical-study": "topical-study",
    "character-study": "character-study",
    "cross-reference-study": "cross-reference-study"
  };
  return methodMap[methodSlug] || "";
}

function getCtaHref(page, appUrl) {
  const query = getAppEntryQuery(page);
  if (!query) return appUrl;
  return appUrl.includes("?") ? `${appUrl}&${query}` : `${appUrl}?${query}`;
}

function getAppEntryQuery(page) {
  const starterStudyTargets = {
    "/how-to-study-romans": ["inductive", "Romans 12:1-2"],
    "/how-to-study-the-gospel-of-john": ["oia", "John 20:30-31"],
    "/how-to-study-genesis": ["inductive", "Genesis 12:1-9"],
    "/how-to-study-psalms": ["lectio", "Psalm 23"],
    "/how-to-study-proverbs": ["topical-study", "Proverbs 3:5-6"],
    "/how-to-study-matthew": ["cross-reference-study", "Matthew 28:16-20"],
    "/how-to-study-mark": ["oia", "Mark 10:45"],
    "/how-to-study-luke": ["character-study", "Luke 19:1-10"],
    "/how-to-study-acts": ["inductive", "Acts 1:8"],
    "/how-to-study-ephesians": ["oia", "Ephesians 4:1-6"],
    "/how-to-study-philippians": ["soap", "Philippians 4:4-9"],
    "/how-to-study-james": ["oia", "James 1:2-8"]
  };
  const starterStudyTarget = starterStudyTargets[page.path];
  if (starterStudyTarget) {
    const [methodId, passage] = starterStudyTarget;
    return `tab=study&method=${methodId}&passage=${encodeURIComponent(passage)}`;
  }
  if (page.path === "/bible-study-methods") return "tab=methods";
  if (page.path === "/bible-study-methods/word-study") return "tab=bible";
  if (page.path.startsWith("/bible-study-methods/")) {
    const methodSlug = page.path.split("/").filter(Boolean).pop() || "";
    const methodMap = {
      soap: "soap",
      inductive: "inductive",
      oia: "oia",
      "lectio-divina": "lectio",
      "verse-mapping": "verse-mapping",
      "topical-study": "topical-study",
      "character-study": "character-study",
      "cross-reference-study": "cross-reference-study"
    };
    const methodId = methodMap[methodSlug] || "";
    return methodId ? `tab=study&method=${methodId}` : "tab=methods";
  }
  const value = `${page.path} ${page.cta} ${page.title}`.toLowerCase();
  if (value.includes("feature") || value.includes("about") || value.includes("free bible study app")) return "tab=home";
  if (value.includes("reading plan")) return "tab=plans";
  if (value.includes("memor") || value.includes("memory")) return "tab=memory";
  if (value.includes("worksheet") || value.includes("printable") || value.includes("reader") || value.includes("highlight")) return "tab=bible";
  if (value.includes("method")) return "tab=methods";
  if (value.includes("journal") || value.includes("group") || value.includes("church") || value.includes("encouragement")) return "tab=study";
  return "tab=study";
}

function getStandardCtaLabel(page) {
  const value = `${page.path} ${page.cta} ${page.title}`.toLowerCase();
  if (page.path === "/bible-study-methods/word-study") return "Open the Bible reader";
  if (value.includes("feature") || value.includes("about") || value.includes("free bible study app")) return "Start a guided study";
  if (value.includes("reading plan")) return "Open reading plans";
  if (page.path === "/bible-study-methods" || value.includes("method")) return "Choose a study method";
  if (page.path.includes("memory-card")) return "Print memory cards";
  if (value.includes("memor") || value.includes("memory")) return "Open memory verses";
  if (value.includes("worksheet") || value.includes("printable")) return "Print a worksheet";
  if (value.includes("reader") || value.includes("highlight")) return "Open the Bible reader";
  return "Start a guided study";
}

function getBreadcrumbs(page) {
  const breadcrumbs = [{ label: "Home", href: "/" }];
  if (page.path.startsWith("/bible-study-methods/")) {
    breadcrumbs.push({ label: "Bible study methods", href: "/bible-study-methods" });
  } else if (page.path.startsWith("/how-to-study-")) {
    breadcrumbs.push({ label: "Study guides", href: "/how-to-study-the-bible" });
  } else if (page.path.includes("worksheet")) {
    breadcrumbs.push({ label: "Worksheets", href: "/printable-bible-study-worksheets" });
  } else if (page.path.includes("memory") || page.path.includes("memorization")) {
    breadcrumbs.push({ label: "Memory verses", href: "/bible-memory-verses" });
  } else if (page.path.includes("journal")) {
    breadcrumbs.push({ label: "Journal", href: "/bible-study-journal" });
  }
  breadcrumbs.push({ label: page.heading, href: page.path });
  return breadcrumbs;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function slugifyForId(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
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
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
}
