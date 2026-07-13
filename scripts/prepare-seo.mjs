import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

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
    title: "SOAP Bible Study Method | Scripture, Observation, Application and Prayer",
    description: "Use the SOAP Bible study method to read Scripture, write observations, apply the passage, and pray through what God is teaching you.",
    heading: "SOAP Bible study method",
    intro: "SOAP is a simple Bible study method for turning Scripture reading into thoughtful reflection, prayer, and everyday obedience.",
    sections: [
      ["Scripture", "Choose a passage and write down the verse or section that stands out. This keeps the study anchored in the biblical text."],
      ["Observation and application", "Notice what the passage says, then ask how it speaks to your beliefs, actions, relationships, and trust in God."],
      ["Prayer", "Finish by praying honestly through what you have seen, asking God for help to receive and obey His Word."]
    ],
    cta: "Practise SOAP",
    related: ["/bible-study-methods", "/bible-study-methods/oia", "/printable-bible-study-worksheet-for-small-groups"]
  },
  {
    path: "/bible-study-methods/inductive",
    file: "bible-study-methods/inductive.html",
    title: "Inductive Bible Study Method | Observation, Interpretation and Application",
    description: "Learn the inductive Bible study method with observation, interpretation, and application steps for deeper Scripture study.",
    heading: "Inductive Bible study method",
    intro: "Inductive Bible study helps you move from careful observation to faithful interpretation and practical application without skipping over the text.",
    sections: [
      ["Observation", "Mark repeated words, commands, contrasts, people, places, timing, and structure. Ask what the passage actually says."],
      ["Interpretation", "Use context to understand the author’s meaning. Ask how the passage fits the chapter, the book, and the message of Scripture."],
      ["Application", "Respond with specific obedience, repentance, trust, worship, or prayer rather than vague good intentions."]
    ],
    cta: "Try inductive study",
    related: ["/how-to-study-a-bible-passage", "/bible-study-methods/oia", "/how-to-study-romans"]
  },
  {
    path: "/bible-study-methods/oia",
    file: "bible-study-methods/oia.html",
    title: "OIA Bible Study Method | Observation, Interpretation and Application",
    description: "Use the OIA Bible study method to observe the passage, interpret the meaning, and apply Scripture to daily life.",
    heading: "OIA Bible study method",
    intro: "OIA is a clear and memorable way to study Scripture: observe what the passage says, interpret what it means, and apply it faithfully.",
    sections: [
      ["Observation", "Slow down and list what you see in the passage before explaining it. Look for words, themes, logic, emotion, and movement."],
      ["Interpretation", "Ask what the passage meant in context, what it reveals about God, and how it connects with the surrounding Scripture."],
      ["Application", "Write one honest response. That might be something to believe, confess, obey, pray, remember, or share."]
    ],
    cta: "Practise OIA",
    related: ["/how-to-study-a-bible-passage", "/bible-study-methods/inductive", "/bible-study-methods/soap"]
  },
  {
    path: "/bible-study-methods/lectio-divina",
    file: "bible-study-methods/lectio-divina.html",
    title: "Lectio Divina Bible Study Method | Prayerful Scripture Reflection",
    description: "Practise Lectio Divina with Scripture reading, meditation, prayer, and quiet response while keeping the Bible passage central.",
    heading: "Lectio Divina Bible study method",
    intro: "Lectio Divina is a prayerful way to read Scripture slowly, listen attentively, and respond to God with reflection and prayer.",
    sections: [
      ["Read", "Read the passage slowly and notice a word, phrase, or image that draws your attention."],
      ["Reflect and pray", "Meditate on the passage in context, then pray honestly about what it reveals and how it speaks into your life."],
      ["Carry", "Choose a short phrase or truth from the passage to carry with you through the day."]
    ],
    cta: "Try Lectio Divina",
    related: ["/bible-study-methods", "/bible-study-journal", "/bible-memory-verses"]
  },
  {
    path: "/bible-study-methods/verse-mapping",
    file: "bible-study-methods/verse-mapping.html",
    title: "Verse Mapping Bible Study Method | Explore Scripture Word by Word",
    description: "Use the verse mapping Bible study method to examine key words, context, cross references, themes, and personal response in a single Scripture passage.",
    heading: "Verse mapping Bible study method",
    intro: "Verse mapping helps you slow down over one verse or short passage, tracing words, context, themes, and connections so the Scripture becomes clearer.",
    sections: [
      ["Choose a focused passage", "Start with one verse or a short section, then write the reference, surrounding context, and any words that need closer attention."],
      ["Trace words and connections", "Look up repeated words, related passages, themes, people, places, and how the verse fits the wider chapter."],
      ["Respond with clarity", "Summarize what the verse teaches, write a prayer, and note one way to remember or apply the passage."]
    ],
    cta: "Try verse mapping",
    related: ["/bible-study-methods/word-study", "/bible-study-methods/cross-reference-study", "/printable-bible-study-journal"]
  },
  {
    path: "/bible-study-methods/word-study",
    file: "bible-study-methods/word-study.html",
    title: "Bible Word Study Method | Study Key Words in Scripture",
    description: "Learn a Bible word study method for tracing key words, repeated phrases, context, meaning, and application without losing sight of the passage.",
    heading: "Bible word study method",
    intro: "A Bible word study helps you pay attention to important words in a passage while keeping the meaning anchored in context.",
    sections: [
      ["Start with the passage", "Choose a word that carries weight in the text, then read the whole paragraph or chapter before studying the word by itself."],
      ["Look for repeated use", "Notice where the word appears nearby, how the author uses it, and whether related words or phrases develop the same idea."],
      ["Return to the main point", "A word study should help you understand the passage better, not pull the word away from what the passage is saying."]
    ],
    cta: "Start a word study",
    related: ["/bible-study-methods/verse-mapping", "/bible-study-methods/topical-study", "/bible-study-methods/inductive"]
  },
  {
    path: "/bible-study-methods/topical-study",
    file: "bible-study-methods/topical-study.html",
    title: "Topical Bible Study Method | Study Scripture by Theme",
    description: "Use a topical Bible study method to trace a theme across Scripture while reading each passage carefully in its own context.",
    heading: "Topical Bible study method",
    intro: "Topical study helps you follow a biblical theme across multiple passages while still reading each verse in context.",
    sections: [
      ["Define the topic carefully", "Begin with a clear question or theme, such as prayer, wisdom, identity in Christ, forgiveness, or the fear of the Lord."],
      ["Gather passages thoughtfully", "Read several passages that speak to the topic, noting their setting, audience, and main point before comparing them."],
      ["Summarize what Scripture teaches", "Look for patterns, tensions, commands, promises, and a faithful response shaped by the whole counsel of Scripture."]
    ],
    cta: "Try topical study",
    related: ["/bible-study-methods/word-study", "/bible-study-methods/cross-reference-study", "/bible-study-methods/character-study"]
  },
  {
    path: "/bible-study-methods/character-study",
    file: "bible-study-methods/character-study.html",
    title: "Bible Character Study Method | Learn from People in Scripture",
    description: "Use a Bible character study method to examine a person in Scripture, their context, choices, faith, failures, and what their story reveals about God.",
    heading: "Bible character study method",
    intro: "Character study helps you learn from the people in Scripture while keeping the focus on God’s character, promises, warnings, and grace.",
    sections: [
      ["Follow the person in context", "Read the passages where the person appears, noting setting, relationships, choices, conflicts, and turning points."],
      ["Notice faith and failure", "Ask what the person believed, feared, obeyed, resisted, learned, or misunderstood as the story unfolds."],
      ["Look beyond the example", "A character study is not just moral advice. Ask what the account reveals about God and how it points to faithful trust and obedience."]
    ],
    cta: "Start a character study",
    related: ["/bible-study-methods/topical-study", "/bible-study-methods/inductive", "/bible-study-methods/verse-mapping"]
  },
  {
    path: "/bible-study-methods/cross-reference-study",
    file: "bible-study-methods/cross-reference-study.html",
    title: "Cross Reference Bible Study Method | Let Scripture Interpret Scripture",
    description: "Use a cross reference Bible study method to compare related passages, clarify meaning, trace themes, and understand Scripture with Scripture.",
    heading: "Cross reference Bible study method",
    intro: "Cross-reference study helps you compare related passages so Scripture sheds light on Scripture without losing the main passage you started with.",
    sections: [
      ["Begin with one main text", "Choose a passage and identify the words, themes, quotations, or ideas that need to be compared with other Scriptures."],
      ["Compare related passages", "Read cross references carefully, noting similarities, differences, fulfillment, background, and how each passage contributes."],
      ["Return to the original passage", "Use the related passages to clarify meaning, then write a short summary of what the original passage teaches."]
    ],
    cta: "Study cross references",
    related: ["/bible-study-methods/verse-mapping", "/bible-study-methods/topical-study", "/how-to-study-a-bible-passage"]
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
    related: ["/how-to-study-the-bible", "/how-to-study-a-bible-passage", "/bible-study-methods/soap"]
  },
  {
    path: "/printable-bible-study-worksheet-for-small-groups",
    file: "printable-bible-study-worksheet-for-small-groups.html",
    title: "Printable Bible Study Worksheet for Small Groups | Free Group Study Sheet",
    description: "Create printable Bible study worksheets for small groups with selected Scripture, guided questions, writing space, and study methods.",
    heading: "Printable Bible study worksheet for small groups",
    intro: "Bible Study Tutor can help small group leaders prepare simple Scripture worksheets that work well around a table, in a class, or in a church group.",
    sections: [
      ["Choose the passage", "Select the verses your group will study and print the Scripture with enough room for people to write their own observations."],
      ["Use a shared method", "SOAP, OIA, Inductive Study, and Lectio Divina can give the group a common rhythm without making the handout complicated."],
      ["Encourage discussion", "Printed worksheets help people arrive prepared, record prayer points, and keep a useful record after the meeting."]
    ],
    cta: "Print a worksheet",
    related: ["/bible-study-for-small-groups", "/printable-bible-study-worksheets", "/bible-study-methods/soap"]
  },
  {
    path: "/printable-soap-bible-study-worksheet",
    file: "printable-soap-bible-study-worksheet.html",
    title: "Printable SOAP Bible Study Worksheet | Free Scripture Study Sheet",
    description: "Create a printable SOAP Bible study worksheet with Scripture, observation, application, and prayer sections for personal study or groups.",
    heading: "Printable SOAP Bible study worksheet",
    intro: "A printable SOAP worksheet gives readers a simple way to slow down with Scripture, write observations, apply the passage, and respond in prayer.",
    sections: [
      ["Scripture section", "Choose the passage and print the selected verses so the study begins with the Bible text, not only a blank form."],
      ["Observation and application space", "Use guided space to write what the passage says and how it calls for trust, obedience, repentance, or encouragement."],
      ["Prayer response", "Finish the worksheet with a prayer shaped by the passage, making the study personal without losing the text."]
    ],
    cta: "Print a SOAP worksheet",
    related: ["/bible-study-methods/soap", "/printable-bible-study-worksheets", "/printable-bible-study-worksheet-for-small-groups"]
  },
  {
    path: "/printable-inductive-bible-study-worksheet",
    file: "printable-inductive-bible-study-worksheet.html",
    title: "Printable Inductive Bible Study Worksheet | Observation, Interpretation, Application",
    description: "Create a printable inductive Bible study worksheet with observation, interpretation, and application space for deeper Scripture study.",
    heading: "Printable inductive Bible study worksheet",
    intro: "An inductive worksheet helps readers slow down, mark observations, interpret the passage in context, and write a specific response.",
    sections: [
      ["Observation space", "Record repeated words, structure, commands, contrasts, people, places, and questions directly from the passage."],
      ["Interpretation prompts", "Use context, surrounding verses, and related Scripture to ask what the passage means before applying it."],
      ["Application response", "Write one clear next step, prayer, or truth to remember after studying the passage."]
    ],
    cta: "Print an inductive worksheet",
    related: ["/bible-study-methods/inductive", "/how-to-study-a-bible-passage", "/printable-bible-study-worksheets"]
  },
  {
    path: "/printable-bible-study-journal",
    file: "printable-bible-study-journal.html",
    title: "Printable Bible Study Journal | Free Scripture Reflection Pages",
    description: "Use printable Bible study journal pages to record Scripture notes, prayers, observations, applications, memory verses, and reflections.",
    heading: "Printable Bible study journal",
    intro: "Printable Bible study journal pages give people room to write by hand while still following a clear Scripture-centred rhythm.",
    sections: [
      ["Write Scripture notes", "Use journal space for observations, questions, key words, cross references, and what the passage reveals about God."],
      ["Record prayer and response", "Turn study into prayer, application, repentance, gratitude, or encouragement for someone else."],
      ["Use alongside the app", "Bible Study Tutor supports both digital journaling and printable worksheets so people can study in the format that helps them most."]
    ],
    cta: "Open journal tools",
    related: ["/bible-study-journal", "/online-bible-study-journal", "/bible-study-methods/verse-mapping"]
  },
  {
    path: "/bible-study-worksheet-for-youth-groups",
    file: "bible-study-worksheet-for-youth-groups.html",
    title: "Bible Study Worksheet for Youth Groups | Printable Scripture Study",
    description: "Create printable Bible study worksheets for youth groups with selected Scripture, simple prompts, writing space, and guided study methods.",
    heading: "Bible study worksheet for youth groups",
    intro: "Youth group Bible study worksheets should be clear, Scripture-centred, and practical enough to help students read, think, discuss, and respond.",
    sections: [
      ["Keep the passage visible", "Print the selected Scripture so students can mark, reread, and discuss the passage without needing to switch apps or screens."],
      ["Use simple guided prompts", "SOAP, OIA, and READ-style questions help students notice what the passage says and how to respond."],
      ["Support discussion", "Worksheets can give quieter students time to think and write before sharing in a youth group setting."]
    ],
    cta: "Prepare a youth worksheet",
    related: ["/printable-bible-study-worksheets", "/bible-study-methods/soap", "/bible-study-methods/oia"]
  },
  {
    path: "/bible-study-worksheet-for-church-groups",
    file: "bible-study-worksheet-for-church-groups.html",
    title: "Bible Study Worksheet for Church Groups | Printable Group Study Pages",
    description: "Create printable Bible study worksheets for church groups with Scripture passages, guided questions, prayer space, and group discussion prompts.",
    heading: "Bible study worksheet for church groups",
    intro: "Church group worksheets help people study the same passage together while leaving space for personal notes, prayer, and discussion.",
    sections: [
      ["Use one shared passage", "Print the selected Scripture and method prompts so everyone can follow the same study path during the group."],
      ["Make room for prayer", "Include space for reflection, prayer points, application, and encouragement after the discussion."],
      ["Serve different learning styles", "Printable worksheets help people who prefer handwriting, need structure, or want to keep a paper record."]
    ],
    cta: "Prepare a church worksheet",
    related: ["/bible-study-app-for-churches", "/printable-bible-study-worksheet-for-small-groups", "/bible-study-methods/inductive"]
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
      ["Build a record of growth", "Your journal becomes a quiet history of what God has been teaching you through Scripture."]
    ],
    cta: "Open the journal",
    related: ["/online-bible-study-journal", "/how-to-study-a-bible-passage", "/bible-highlighting-and-notes"]
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
  },
  {
    path: "/how-to-study-romans",
    file: "how-to-study-romans.html",
    title: "How to Study Romans | A Practical Guide to Paul’s Letter",
    description: "Learn how to study Romans by tracing Paul’s argument, noting key themes, reading in context, journaling observations, and applying the gospel carefully.",
    heading: "How to study Romans",
    intro: "Romans is rich, structured, and deeply theological. Bible Study Tutor can help you move through it slowly by passage, theme, question, and response.",
    sections: [
      ["Trace the argument", "Romans builds carefully. Watch for connecting words, repeated ideas, and the movement from sin and grace to new life and practical obedience."],
      ["Keep gospel themes in view", "Notice righteousness, faith, grace, law, sin, union with Christ, the Spirit, mercy, and transformed living."],
      ["Study in manageable sections", "Romans rewards slow study. Use guided notes, memory collections, and journal entries rather than trying to master the whole letter at once."]
    ],
    cta: "Study Romans",
    related: ["/bible-study-methods/inductive", "/how-to-study-a-bible-passage", "/bible-study-journal"]
  },
  {
    path: "/how-to-study-the-gospel-of-john",
    file: "how-to-study-the-gospel-of-john.html",
    title: "How to Study the Gospel of John | Read John’s Gospel with Purpose",
    description: "Learn how to study the Gospel of John by following signs, conversations, I am sayings, belief, witness, and the purpose of John’s Gospel.",
    heading: "How to study the Gospel of John",
    intro: "The Gospel of John invites readers to see who Jesus is and believe in Him. Bible Study Tutor helps you slow down and follow John’s purpose passage by passage.",
    sections: [
      ["Look for signs and responses", "Notice Jesus’ signs, the conversations that follow, and how different people respond with belief, confusion, opposition, or worship."],
      ["Trace John’s themes", "Watch for light, life, belief, witness, glory, love, truth, the Father, the Son, and the Spirit."],
      ["Read toward John’s purpose", "John says his Gospel was written so readers may believe that Jesus is the Christ, the Son of God, and have life in His name."]
    ],
    cta: "Study John’s Gospel",
    related: ["/how-to-study-a-bible-passage", "/bible-study-methods/lectio-divina", "/bible-study-for-beginners"]
  },
  {
    path: "/how-to-study-genesis",
    file: "how-to-study-genesis.html",
    title: "How to Study Genesis | Creation, Covenant, Fall and Promise",
    description: "Learn how to study Genesis by tracing creation, fall, covenant, promise, family stories, and God’s faithfulness through the first book of the Bible.",
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
    related: ["/bible-study-methods/inductive", "/bible-study-methods/character-study", "/bible-study-methods/cross-reference-study"]
  },
  {
    path: "/how-to-study-psalms",
    file: "how-to-study-psalms.html",
    title: "How to Study Psalms | Prayer, Worship, Lament and Trust",
    description: "Learn how to study Psalms by reading Hebrew poetry, noticing prayer, lament, praise, trust, kingship, wisdom, and honest worship before God.",
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
    related: ["/bible-study-methods/lectio-divina", "/bible-study-methods/soap", "/bible-study-methods/word-study"]
  },
  {
    path: "/how-to-study-proverbs",
    file: "how-to-study-proverbs.html",
    title: "How to Study Proverbs | Wisdom, Character and the Fear of the Lord",
    description: "Learn how to study Proverbs by tracing wisdom, folly, speech, work, money, relationships, discipline, and the fear of the Lord.",
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
    related: ["/bible-study-methods/topical-study", "/bible-study-methods/word-study", "/bible-study-methods/oia"]
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
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
}
