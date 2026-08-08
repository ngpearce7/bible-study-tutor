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
      ["For personal and church use", "Read the Bible, follow study methods, save journal entries, memorize verses, and share private encouragements with trusted friends or circles."]
    ],
    cta: "Open Bible Study Tutor",
    related: ["/how-it-works", "/free-bible-study-app", "/pricing", "/features", "/bible-study-app-for-churches"]
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
      ["Study with a method", "Send a passage into Study and choose a guided method such as SOAP, OIA, Inductive Study, Lectio Divina, READ, verse mapping, or word study."],
      ["Save and return", "Keep notes, highlights, bookmarks, meditations, memory verses, and journal entries together so your study can grow over time."],
      ["Print when helpful", "Print Bible study worksheets or memory cards for small groups, church classes, youth groups, or personal pen-and-paper study."]
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
      ["Is Bible Study Tutor private?", "Bible Study Tutor avoids public timelines. Friends and circles are designed for trusted encouragement, and the app does not track private journal text or study answers for public analytics."]
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
    ]
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
    related: ["/how-to-study-the-bible", "/bible-study-methods/soap", "/bible-study-methods/inductive"]
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
      ["Respond with obedience", "A good Bible study does not stop at information. Write a prayer, choose one next step, and return to the passage through the week."]
    ],
    cta: "Start a guided study",
    related: ["/bible-study-for-beginners", "/how-to-study-a-bible-passage", "/bible-study-methods"]
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
      ["Ask what the author meant", "Interpret the passage in context. Look at the chapter, the book, the audience, and how the passage points to God’s character and work."],
      ["Write a clear response", "Turn your study into prayer, action, memory, or encouragement. Save the notes in your journal so you can revisit them later."]
    ],
    cta: "Study a passage now",
    related: ["/how-to-study-the-bible", "/bible-study-methods/oia", "/printable-bible-study-worksheets"]
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
    title: "Bible Word Study Method | Study Key Words in Scripture",
    description: "Learn a careful Bible word study method with an example, safeguards, checklist, and printable worksheet option so key words stay anchored in context.",
    heading: "Bible word study method",
    intro: "A Bible word study helps you pay attention to important words in a passage while keeping the meaning anchored in context, author, genre, and the wider message of Scripture.",
    sections: [
      ["Start with the passage", "Choose a word that carries weight in the text, then read the whole paragraph or chapter before studying the word by itself. Ask what the author is saying before asking how one word sounds in isolation."],
      ["Look for repeated use", "Notice where the word appears nearby, how the author uses it, and whether related words or phrases develop the same idea. Repetition often shows emphasis, contrast, or movement in the argument."],
      ["Compare carefully", "Compare the word in nearby passages first, then related passages by the same author, then the wider Bible. Do not assume every occurrence has the exact same shade of meaning."],
      ["Return to the main point", "A word study should help you understand the passage better, not pull the word away from what the passage is saying. Finish by restating the passage in context and writing a faithful response."]
    ],
    cta: "Start a word study",
    related: ["/bible-study-methods/verse-mapping", "/bible-study-methods/cross-reference-study", "/bible-study-methods/inductive", "/printable-bible-study-worksheets"],
    schemaType: "HowTo",
    howToSteps: [
      "Read the passage and surrounding paragraph before isolating the word.",
      "Write the word, reference, immediate context, and why the word matters.",
      "Look for repeated use in the same passage, book, or author.",
      "Compare related passages carefully without forcing every occurrence to mean the same thing.",
      "Summarize how the word clarifies the passage and write one prayerful response."
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
        type: "checklist",
        title: "Methodological safeguards",
        intro: "These safeguards keep a word study from becoming detached from Scripture.",
        items: [
          "Do not treat a dictionary entry as the meaning of every verse.",
          "Do not build a doctrine from one word without reading the whole passage.",
          "Do not assume English word connections always reflect the original-language wording.",
          "Do not use cross references to escape a difficult context.",
          "Let the passage’s grammar, flow, and authorial purpose control the study."
        ]
      },
      {
        type: "cta",
        title: "Print a word study worksheet",
        intro: "If you prefer pen and paper, select a passage in Bible Study Tutor, choose a word study approach, and print a worksheet with room for context, repeated words, comparisons, summary, and prayer.",
        href: "/?tab=bible",
        label: "Print a worksheet"
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
      ["Connect study with prayer", "Use the journal to record what you noticed, how Scripture corrected or encouraged you, and how you want to respond."]
    ],
    cta: "Open the journal",
    related: ["/bible-study-methods", "/bible-highlighting-and-notes", "/bible-memory-verses"]
  },
  {
    path: "/bible-study-journal",
    file: "bible-study-journal.html",
    title: "Bible Study Journal | Save Scripture Notes, Prayers and Reflections",
    description: "Use a Bible study journal to save Scripture notes, prayers, reflections, meditations, highlights, bookmarks, and completed studies.",
    heading: "Bible study journal",
    intro: "A Bible study journal helps you remember what you have read, how you prayed, and how Scripture shaped your thinking over time.",
    sections: [
      ["Save more than notes", "Bible Study Tutor can keep guided studies, meditations, highlights, bookmarks, drafts, and prayerful reflections together."],
      ["Find your way back", "Filter journal entries by Scripture, date, type, status, or pinned favourites when you want to revisit a passage."],
      ["Build a record of growth", "Your journal becomes a quiet history of what you have noticed, prayed, and returned to in Scripture."]
    ],
    cta: "Open the journal",
    related: ["/online-bible-study-journal", "/how-to-study-a-bible-passage", "/bible-highlighting-and-notes"]
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
      ["Keep Scripture close", "Print memory cards for selected saved verses so Scripture can be placed around the home, kept in a Bible, or shared with a group."]
    ],
    cta: "Open memory verses",
    related: ["/scripture-memorization-app", "/printable-bible-memory-cards", "/features"]
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
      ["Track progress", "Memory history and milestones show recent reviews, rhythms, added verses, and verses worth revisiting."]
    ],
    cta: "Try memory practice",
    related: ["/bible-memory-verses", "/printable-bible-memory-cards", "/bible-study-for-beginners"]
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
      ["Send verses into study", "Selected passages can become a guided study, a printable worksheet, or a saved memory verse."]
    ],
    cta: "Open the Bible reader",
    related: ["/online-bible-study-journal", "/features", "/bible-study-methods"]
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
      ["Can leaders print worksheets for group discussion?", "Yes. Leaders can select a passage and print worksheets for methods such as SOAP, OIA, Inductive Study, or word study."],
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
    ]
  },
  {
    path: "/how-to-start-a-bible-reading-plan",
    file: "how-to-start-a-bible-reading-plan.html",
    title: "How to Start a Bible Reading Plan | Simple Scripture Reading Rhythm",
    description: "Learn how to start a Bible reading plan with a realistic pace, daily reading rhythm, progress tracking, catch-up options, and guided study when needed.",
    heading: "How to start a Bible reading plan",
    intro: "A Bible reading plan works best when it is simple enough to return to and flexible enough for real life. Bible Study Tutor helps you choose a plan, open the next reading, and keep progress clear.",
    sections: [
      ["Choose a realistic plan", "Start with a plan that fits your season. A short plan can build rhythm, while a longer plan can help you move through larger parts of Scripture."],
      ["Read the next passage", "Open the current reading in the Bible reader, read the selected passage, and mark the plan day complete when you finish."],
      ["Slow down when needed", "If a passage raises questions or needs more reflection, send it to Study and use SOAP, OIA, Inductive Study, or another guided method."],
      ["Catch up without confusion", "If you miss a day, Bible Study Tutor can help you return to the missed reading or shift the plan forward so the rhythm stays clear."]
    ],
    cta: "Open reading plans",
    related: ["/bible-reading-plan-app", "/how-it-works", "/bible-study-methods/soap", "/bible-study-journal"],
    schemaType: "HowTo",
    howToSteps: [
      "Choose a Bible reading plan with a pace you can realistically keep.",
      "Open the next reading in the Bible reader.",
      "Read the passage and mark the plan day complete.",
      "Send difficult or meaningful passages into guided study.",
      "Return the next day or use catch-up tools if you fall behind."
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
        href: "/?tab=study&method=inductive",
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
        href: "/?tab=study&method=oia",
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
        href: "/?tab=study&method=inductive",
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
        href: "/?tab=study&method=lectio",
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
        href: "/?tab=study&method=topical-study",
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
    intro: "Matthew presents Jesus as the promised King and Messiah who fulfills Scripture and calls His disciples to kingdom life.",
    sections: [
      ["Why Matthew matters", "Matthew connects Jesus with Israel’s story, highlights fulfilled Scripture, and teaches what discipleship under the King looks like."],
      ["How to approach it", "Notice Old Testament quotations, kingdom language, teaching blocks, parables, conflict, and Jesus’ authority."],
      ["Recommended study method", "Use cross-reference study for fulfilled prophecy and inductive study for major teaching sections like the Sermon on the Mount."],
      ["Suggested starter passages", "Begin with Matthew 5-7, Matthew 13, Matthew 16:13-28, Matthew 26-28, and Matthew 28:16-20."],
      ["Links to Bible study methods", "Matthew works well with cross-reference study, inductive study, and character study."]
    ],
    cta: "Start a guided study",
    related: ["/bible-study-methods/cross-reference-study", "/bible-study-methods/inductive", "/how-to-study-the-gospel-of-john"]
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
      ["How to approach it", "Watch the pace of the narrative, repeated misunderstandings, miracle stories, conflict, and the turning point around Peter’s confession."],
      ["Recommended study method", "Use OIA to keep the story moving from observation to meaning and application without overcomplicating short narrative scenes."],
      ["Suggested starter passages", "Begin with Mark 1:1-15, Mark 2:1-12, Mark 4:35-41, Mark 8:27-38, Mark 10:35-45, and Mark 15-16."],
      ["Links to Bible study methods", "Mark pairs well with OIA, character study, and inductive study."]
    ],
    cta: "Start a guided study",
    related: ["/bible-study-methods/oia", "/bible-study-methods/character-study", "/how-to-study-a-bible-passage"]
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
    cta: "Start a guided study",
    related: ["/bible-study-methods/character-study", "/bible-study-methods/topical-study", "/bible-study-methods/lectio-divina"]
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
    cta: "Start a guided study",
    related: ["/bible-study-methods/inductive", "/bible-study-methods/cross-reference-study", "/bible-study-methods/character-study"]
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
    cta: "Start a guided study",
    related: ["/bible-study-methods/word-study", "/bible-study-methods/oia", "/bible-study-methods/topical-study"]
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
    cta: "Start a guided study",
    related: ["/bible-study-methods/soap", "/bible-study-methods/word-study", "/bible-study-methods/lectio-divina"]
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
    cta: "Start a guided study",
    related: ["/bible-study-methods/topical-study", "/bible-study-methods/oia", "/bible-study-methods/soap"]
  }
];

mkdirSync(publicDir, { recursive: true });
copyFileSync(join(process.cwd(), "node_modules", "@expo", "vector-icons", "build", "vendor", "react-native-vector-icons", "Fonts", "Ionicons.ttf"), join(publicDir, "ionicons.ttf"));
copyFileSync(join(process.cwd(), "node_modules", "@expo", "vector-icons", "build", "vendor", "react-native-vector-icons", "Fonts", "MaterialCommunityIcons.ttf"), join(publicDir, "material-community-icons.ttf"));
copyFileSync(join(process.cwd(), "assets", "icon.png"), join(publicDir, "icon.png"));
copyFileSync(join(process.cwd(), "assets", "favicon.png"), join(publicDir, "favicon.png"));
copyFileSync(join(process.cwd(), "assets", "apple-touch-icon.png"), join(publicDir, "apple-touch-icon.png"));
copyFileSync(join(process.cwd(), "assets", "social-preview.png"), join(publicDir, "social-preview.png"));
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
  const sections = page.sections
    .map(([heading, body]) => `<section><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(body)}</p></section>`)
    .join("\n");
  const extraBlocks = (page.extraBlocks || [])
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
      .extra-cta { align-items: flex-start; display: grid; gap: 14px; }
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
    </style>
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
      </section>
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

  if (block.type === "cta") {
    const href = block.href || "/";
    const label = block.label || "Open Bible Study Tutor";
    return `<section class="extra-block extra-cta" aria-labelledby="${slugifyForId(block.title)}">
        <div>
          <h2 id="${slugifyForId(block.title)}">${escapeHtml(block.title)}</h2>
          ${intro}
        </div>
        <a class="button" href="${escapeHtml(href)}">${escapeHtml(label)}</a>
      </section>`;
  }

  return "";
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
        }
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
    "word-study": "word-study",
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
  if (page.path === "/bible-study-methods") return "tab=methods";
  if (page.path.startsWith("/bible-study-methods/")) {
    const methodSlug = page.path.split("/").filter(Boolean).pop() || "";
    const methodMap = {
      soap: "soap",
      inductive: "inductive",
      oia: "oia",
      "lectio-divina": "lectio",
      "verse-mapping": "verse-mapping",
      "word-study": "word-study",
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
