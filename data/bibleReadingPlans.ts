import { BIBLE_CHAPTER_COUNTS, NEW_TESTAMENT_BOOKS, OLD_TESTAMENT_BOOKS } from "@/data/bibleLibrary";

export type BibleReadingPlanSource = "built-in" | "custom";

export type BibleReadingPlanDay = {
  day: number;
  title: string;
  reference: string;
  readerBook: string;
  readerChapter: number;
  studyReference: string;
  devotional?: {
    title: string;
    body: string;
    source?: string;
  };
  reflectionPrompt?: string;
  prayerPrompt?: string;
};

export type BibleReadingPlan = {
  id: string;
  title: string;
  description: string;
  source: BibleReadingPlanSource;
  category?: string;
  purpose?: string;
  bestFor?: string;
  pace?: string;
  estimatedTime?: string;
  coverage?: string;
  rhythm?: string;
  sampleDayNumbers?: number[];
  days: BibleReadingPlanDay[];
};

type ChapterRef = { book: string; chapter: number };

function referenceBook(book: string) {
  return book === "Psalms" ? "Psalm" : book;
}

export function readerBookFromReferenceBook(book: string) {
  return book === "Psalm" ? "Psalms" : book;
}

export function chapterReference(book: string, chapter: number) {
  return `${referenceBook(book)} ${chapter}`;
}

function compactReference(group: ChapterRef[]) {
  if (!group.length) return "";
  if (group.length === 1) return chapterReference(group[0].book, group[0].chapter);

  const segments: string[] = [];
  let start = group[0];
  let previous = group[0];

  for (const current of group.slice(1)) {
    const consecutive = current.book === previous.book && current.chapter === previous.chapter + 1;
    if (consecutive) {
      previous = current;
      continue;
    }

    segments.push(formatSegment(start, previous));
    start = current;
    previous = current;
  }

  segments.push(formatSegment(start, previous));
  return segments.join("; ");
}

function formatSegment(start: ChapterRef, end: ChapterRef) {
  if (start.book === end.book && start.chapter !== end.chapter) {
    return `${referenceBook(start.book)} ${start.chapter}-${end.chapter}`;
  }
  return chapterReference(start.book, start.chapter);
}

function chaptersForBooks(books: string[]) {
  return books.flatMap((book) =>
    Array.from({ length: BIBLE_CHAPTER_COUNTS[book] || 1 }, (_, index) => ({
      book,
      chapter: index + 1
    }))
  );
}

type BibleReadingPlanDayExtras = Pick<BibleReadingPlanDay, "devotional" | "reflectionPrompt" | "prayerPrompt">;

function buildDay(
  day: number,
  reference: string,
  readerBook: string,
  readerChapter: number,
  title = `Day ${day}`,
  studyReference = chapterReference(readerBook, readerChapter),
  extras: BibleReadingPlanDayExtras = {}
): BibleReadingPlanDay {
  return {
    day,
    title,
    reference,
    readerBook,
    readerChapter,
    studyReference,
    ...extras
  };
}

function planFromReferences(id: string, title: string, description: string, references: Array<[string, string, number, string?, BibleReadingPlanDayExtras?]>, category = "Topical"): BibleReadingPlan {
  return enrichPlanMetadata({
    id,
    title,
    description,
    source: "built-in",
    category,
    days: references.map(([reference, book, chapter, dayTitle, extras], index) =>
      buildDay(index + 1, reference, readerBookFromReferenceBook(book), chapter, dayTitle || reference, reference, extras)
    )
  });
}

function buildChapterPlan(id: string, title: string, description: string, books: string[], dayCount: number, category = "Whole Bible"): BibleReadingPlan {
  const chapters = chaptersForBooks(books);
  const days: BibleReadingPlanDay[] = [];
  let cursor = 0;

  for (let day = 1; day <= dayCount; day += 1) {
    const remainingChapters = chapters.length - cursor;
    const remainingDays = dayCount - day + 1;
    const take = Math.max(1, Math.ceil(remainingChapters / remainingDays));
    const group = chapters.slice(cursor, cursor + take);
    const first = group[0] || chapters[chapters.length - 1];
    cursor += take;
    days.push(buildDay(day, compactReference(group), first.book, first.chapter));
  }

  return enrichPlanMetadata({ id, title, description, source: "built-in", category, days });
}

function buildChapterPlanWithReflectionDays(id: string, title: string, description: string, books: string[], dayCount: number, category = "Book study"): BibleReadingPlan {
  const chapters = chaptersForBooks(books);
  const days: BibleReadingPlanDay[] = [];

  for (let day = 1; day <= dayCount; day += 1) {
    const chapter = chapters[Math.min(day - 1, chapters.length - 1)] || chapters[0];
    const reference = chapterReference(chapter.book, chapter.chapter);
    const isReflectionDay = day > chapters.length;
    days.push(buildDay(day, reference, chapter.book, chapter.chapter, isReflectionDay ? `Reflect on ${reference}` : reference, reference));
  }

  return enrichPlanMetadata({ id, title, description, source: "built-in", category, days });
}

function buildOldNewTogetherPlan(id: string, title: string, description: string, dayCount: number): BibleReadingPlan {
  const oldTestamentChapters = chaptersForBooks(OLD_TESTAMENT_BOOKS);
  const newTestamentChapters = chaptersForBooks(NEW_TESTAMENT_BOOKS);
  const days: BibleReadingPlanDay[] = [];
  let oldCursor = 0;
  let newCursor = 0;

  for (let day = 1; day <= dayCount; day += 1) {
    const remainingDays = dayCount - day + 1;
    const oldTake = Math.max(1, Math.ceil((oldTestamentChapters.length - oldCursor) / remainingDays));
    const newTake = Math.max(1, Math.ceil((newTestamentChapters.length - newCursor) / remainingDays));
    const group = [
      ...oldTestamentChapters.slice(oldCursor, oldCursor + oldTake),
      ...newTestamentChapters.slice(newCursor, newCursor + newTake)
    ];
    const first = group[0] || oldTestamentChapters[oldTestamentChapters.length - 1];
    oldCursor += oldTake;
    newCursor += newTake;
    days.push(buildDay(day, compactReference(group), first.book, first.chapter));
  }

  return enrichPlanMetadata({ id, title, description, source: "built-in", category: "Whole Bible", days });
}

function oneChapterPerDayPlan(id: string, title: string, description: string, book: string, days: number, category = "Book study"): BibleReadingPlan {
  return enrichPlanMetadata({
    id,
    title,
    description,
    source: "built-in",
    category,
    days: Array.from({ length: days }, (_, index) => buildDay(index + 1, chapterReference(book, index + 1), book, index + 1, chapterReference(book, index + 1), chapterReference(book, index + 1)))
  });
}

function sampleDayNumbersFor(dayCount: number) {
  if (dayCount <= 3) return Array.from({ length: dayCount }, (_, index) => index + 1);
  const middle = Math.max(2, Math.ceil(dayCount / 2));
  return Array.from(new Set([1, middle, dayCount]));
}

function estimateTimeFor(dayCount: number, referenceCount = dayCount) {
  if (dayCount <= 10 && referenceCount <= 12) return "5-10 minutes";
  if (dayCount <= 40) return "10-15 minutes";
  if (dayCount <= 90) return "15-25 minutes";
  return "15-30 minutes";
}

function paceFor(dayCount: number, category = "") {
  if (dayCount <= 10) return "Short and flexible";
  if (dayCount <= 31) return category === "Whole Bible" ? "Intensive daily readings" : "Short daily readings";
  if (dayCount <= 90) return "Steady daily readings";
  return "Gentle long-term rhythm";
}

function bestForFor(category = "", dayCount = 0) {
  const lower = category.toLowerCase();
  if (lower.includes("beginner")) return "Beginners and anyone wanting a friendly first path";
  if (lower.includes("prayer")) return "Prayer, devotional reading, and reflection";
  if (lower.includes("care")) return "Comfort, peace, grief, and pastoral care";
  if (lower.includes("identity")) return "Remembering who you are in Christ";
  if (lower.includes("abiding")) return "Devotional reading, prayer, and remaining close to Christ";
  if (lower.includes("wisdom")) return "Decision-making, discernment, and daily wisdom";
  if (lower.includes("overview")) return "Seeing the big picture before deeper study";
  if (lower.includes("gospel") || lower.includes("gospels")) return "Learning Jesus' life, teaching, death, and resurrection";
  if (lower.includes("new testament")) return "Understanding Jesus, the early church, and Christian living";
  if (lower.includes("book")) return "Slow book-by-book reading";
  if (dayCount >= 300) return "Long-term whole Bible reading";
  return "Regular Bible reading and steady Scripture engagement";
}

function coverageFor(plan: Pick<BibleReadingPlan, "title" | "category" | "days">) {
  const first = plan.days[0]?.reference || "the opening reading";
  const last = plan.days[plan.days.length - 1]?.reference || "the final reading";
  if ((plan.category || "").toLowerCase().includes("whole bible")) return `A path from ${first} through ${last}, covering the whole Bible in arranged daily portions.`;
  if (plan.days.length <= 12) return `A focused set of ${plan.days.length} readings from ${first} to ${last}.`;
  return `${plan.days.length} readings beginning with ${first} and ending with ${last}.`;
}

function purposeFor(plan: Pick<BibleReadingPlan, "title" | "description" | "category" | "days">) {
  const category = (plan.category || "").toLowerCase();
  if (category.includes("prayer")) return "To help you turn Scripture into prayer, trust, worship, and honest dependence on God.";
  if (category.includes("care")) return "To give gentle Scripture readings for seasons of worry, grief, comfort, and hope.";
  if (category.includes("identity")) return "To help you receive what Scripture says about who you are in Christ before rushing into performance or comparison.";
  if (category.includes("abiding")) return "To help you slow down with Jesus' invitation to remain in him, depend on him, and bear fruit from closeness with him.";
  if (category.includes("wisdom")) return "To help you read slowly for wisdom, discernment, and faithful decisions.";
  if (category.includes("overview")) return "To give a manageable overview before choosing where to study more deeply.";
  if (category.includes("gospel")) return "To keep your attention on Jesus and the good news of grace, faith, and new life.";
  if (category.includes("new testament")) return "To move steadily through Jesus' life, the early church, and the letters.";
  if (category.includes("book")) return "To help you stay with one Bible book long enough to notice its flow and message.";
  return plan.description || "To provide a steady, practical rhythm for reading Scripture.";
}

function enrichPlanMetadata(plan: BibleReadingPlan): BibleReadingPlan {
  return {
    ...plan,
    purpose: plan.purpose || purposeFor(plan),
    bestFor: plan.bestFor || bestForFor(plan.category, plan.days.length),
    pace: plan.pace || paceFor(plan.days.length, plan.category),
    estimatedTime: plan.estimatedTime || estimateTimeFor(plan.days.length),
    coverage: plan.coverage || coverageFor(plan),
    rhythm: plan.rhythm || "Read the passage, notice one thing, pray briefly, then mark the day complete when you finish.",
    sampleDayNumbers: plan.sampleDayNumbers || sampleDayNumbersFor(plan.days.length)
  };
}

export function getBibleReadingPlanDetails(plan: BibleReadingPlan) {
  const enriched = enrichPlanMetadata(plan);
  const sampleNumbers = enriched.sampleDayNumbers || sampleDayNumbersFor(enriched.days.length);
  const sampleReadings = sampleNumbers
    .map((dayNumber) => enriched.days.find((day) => day.day === dayNumber))
    .filter((day): day is BibleReadingPlanDay => !!day);

  return {
    purpose: enriched.purpose || "",
    bestFor: enriched.bestFor || "",
    pace: enriched.pace || "",
    estimatedTime: enriched.estimatedTime || "",
    coverage: enriched.coverage || "",
    rhythm: enriched.rhythm || "",
    sampleReadings
  };
}

const gospelBooks = ["Matthew", "Mark", "Luke", "John"];
const wholeBibleBooks = [...OLD_TESTAMENT_BOOKS, ...NEW_TESTAMENT_BOOKS];
const chronologicalBibleBooks = [
  "Genesis", "Job", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Chronicles", "Psalms", "1 Kings", "2 Chronicles", "Proverbs", "Ecclesiastes",
  "Song of Solomon", "2 Kings", "Obadiah", "Joel", "Jonah", "Amos", "Hosea", "Isaiah", "Micah", "Nahum",
  "Zephaniah", "Habakkuk", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Ezra", "Haggai", "Zechariah",
  "Esther", "Nehemiah", "Malachi", ...NEW_TESTAMENT_BOOKS
];
const paulineBooks = ["Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon"];
const pentateuchBooks = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy"];
const majorProphetBooks = ["Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel"];

function devotional(title: string, body: string, reflectionPrompt: string, prayerPrompt: string): BibleReadingPlanDayExtras {
  return {
    devotional: {
      title,
      body,
      source: "Bible Study Tutor"
    },
    reflectionPrompt,
    prayerPrompt
  };
}

type DevotionalTheme = "prayer" | "peace" | "faith" | "wisdom" | "comfort" | "gospel" | "beginner";

function withThemedDevotionals(plan: BibleReadingPlan, theme: DevotionalTheme): BibleReadingPlan {
  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      ...(day.devotional ? {} : themedDevotionalForDay(theme, day))
    }))
  };
}

function themedDevotionalForDay(theme: DevotionalTheme, day: BibleReadingPlanDay): BibleReadingPlanDayExtras {
  const title = day.title || day.reference;
  if (theme === "prayer") {
    return devotional(
      `Pray through ${title}`,
      `This reading invites prayer before it invites performance. Let ${day.reference} give language to your dependence on God. Notice what the passage reveals about God's character, then turn that truth into honest prayer, whether that prayer begins with praise, confession, asking, waiting, or surrender.`,
      `What does ${day.reference} teach you to ask, confess, thank God for, or trust today?`,
      "Father, let your word shape my prayer instead of letting my worries lead it."
    );
  }
  if (theme === "peace") {
    return devotional(
      `Peace for ${title.toLowerCase()}`,
      `Biblical peace is more than a quiet mood. It is the steadiness that comes from God's presence, promises, and care. As you read ${day.reference}, do not rush past the fear or pressure named in the passage. Let Scripture bring that pressure into the light of who God is.`,
      "What anxiety, fear, or burden does this passage invite you to bring to God?",
      "God of peace, guard my heart and mind as I bring this concern to you."
    );
  }
  if (theme === "faith") {
    return devotional(
      `Trust in ${title.toLowerCase()}`,
      `Faith is not pretending life is easy. In ${day.reference}, faith looks toward God and takes him at his word. Read slowly for what God promises, commands, reveals, or provides. Then consider one small act of trust that could make your faith visible today.`,
      "What would trusting God look like in one ordinary decision today?",
      "Lord, strengthen my faith and help me obey you with a willing heart."
    );
  }
  if (theme === "wisdom") {
    return devotional(
      `Wisdom for ${title.toLowerCase()}`,
      `Wisdom begins with reverence for God and grows through attentive listening. As you read ${day.reference}, look for the path Scripture commends and the path it warns against. The goal is not merely to make better decisions, but to become a person whose choices are shaped by God.`,
      "What wise path is Scripture placing before you today?",
      "Lord, give me wisdom that is humble, teachable, and faithful."
    );
  }
  if (theme === "comfort") {
    return devotional(
      `Comfort in ${title.toLowerCase()}`,
      `This passage does not ask you to hide sorrow from God. In ${day.reference}, bring grief, weariness, and longing honestly before him. Scripture's comfort is not shallow optimism; it is the nearness of God, the hope of his promises, and the mercy he gives in weakness.`,
      "What sorrow or ache can you bring honestly to God as you read?",
      "God of all comfort, meet me with your mercy and steady hope."
    );
  }
  if (theme === "gospel") {
    return devotional(
      `Grace in ${title.toLowerCase()}`,
      `Read ${day.reference} with your attention on what God has done before you consider what you must do. The gospel gives grace before it calls for response. Look for Christ's mercy, the seriousness of sin, the gift of faith, and the new life God creates by grace.`,
      "What part of the good news does this passage make clearer today?",
      "Lord Jesus, keep my heart grounded in your grace and responsive to your word."
    );
  }
  return devotional(
    `Begin with ${title.toLowerCase()}`,
    `This reading is a simple starting point, not a test. As you read ${day.reference}, look for one clear thing the passage says about God, people, sin, grace, or hope. You do not need to understand everything today. Begin with what is plain, then respond honestly to God.`,
    "What is one clear truth from this passage that you can carry today?",
    "Lord, open my eyes to understand your word and respond with trust."
  );
}

export const builtInBibleReadingPlans: BibleReadingPlan[] = [
  oneChapterPerDayPlan("john-21", "21 Days in John", "Read one chapter a day through John's Gospel.", "John", 21),
  oneChapterPerDayPlan("romans-16", "Romans in 16 Days", "Move slowly through Paul's letter one chapter at a time.", "Romans", 16),
  buildChapterPlan("psalms-prayer", "Psalms for Prayer", "Twenty-one Psalms chosen to shape prayer, trust, confession, and worship.", ["Psalms"], 21, "Prayer"),
  buildChapterPlan("new-testament-90", "New Testament in 90 Days", "Read through the New Testament in steady daily portions.", NEW_TESTAMENT_BOOKS, 90, "New Testament"),
  buildChapterPlan("bible-365", "Bible in 1 Year", "A simple chapter-by-chapter path through every book of the Bible.", wholeBibleBooks, 365),
  {
    ...buildChapterPlan("bible-1-year-chronological", "Bible in 1 Year Chronological", "Read the Bible in a broad historical flow over one year.", chronologicalBibleBooks, 365),
    purpose: "To help you follow the Bible story in a roughly historical order from creation, the patriarchs, Israel, exile, Jesus, the church, and new creation.",
    bestFor: "Readers who want the storyline of Scripture to feel connected across the whole year.",
    pace: "Gentle long-term rhythm",
    estimatedTime: "15-30 minutes",
    coverage: "A whole-Bible journey arranged in a broad chronological-style sequence.",
    rhythm: "Read the daily portion, notice where it fits in the story, pray, then mark the day complete."
  },
  {
    ...buildOldNewTogetherPlan("bible-1-year-old-new", "Old and New Testament Daily Pairing", "A one-year plan that pairs Old Testament and New Testament readings each day.", 365),
    purpose: "To keep the whole Bible moving while regularly returning to the teaching of Jesus, the apostles, and the early church.",
    bestFor: "Readers who like variety and want Old Testament and New Testament readings side by side.",
    pace: "Gentle long-term rhythm",
    estimatedTime: "15-30 minutes",
    coverage: "Daily portions pair Old Testament and New Testament readings through the year.",
    rhythm: "Read both portions, notice one connection, pray briefly, then mark the day complete."
  },
  {
    ...buildChapterPlan("bible-6-months", "Bible in 6 Months", "A brisk six-month journey through the whole Bible.", wholeBibleBooks, 180),
    pace: "Brisk daily readings",
    estimatedTime: "25-40 minutes",
    bestFor: "Readers who want a focused season of stronger whole-Bible momentum."
  },
  {
    ...buildChapterPlanWithReflectionDays("new-testament-1-year", "New Testament in 1 Year", "A gentle year-long path through the New Testament with reflection days.", NEW_TESTAMENT_BOOKS, 365, "New Testament"),
    purpose: "To let the New Testament settle slowly through repeated reading and reflection.",
    pace: "Gentle long-term rhythm",
    estimatedTime: "5-10 minutes",
    coverage: "Every New Testament chapter with later reflection readings to help the message sink in."
  },
  {
    ...buildChapterPlanWithReflectionDays("psalms-proverbs-1-year", "Psalms and Proverbs in 1 Year", "A slow yearly rhythm through prayer, worship, and wisdom.", ["Psalms", "Proverbs"], 365, "Wisdom"),
    purpose: "To shape prayer and daily wisdom through repeated exposure to Psalms and Proverbs.",
    pace: "Gentle long-term rhythm",
    estimatedTime: "5-10 minutes",
    coverage: "Psalms and Proverbs with reflection readings across the year."
  },
  buildChapterPlan("bible-30", "Bible in 30 Days", "A fast overview pace through the whole Bible.", wholeBibleBooks, 30),
  buildChapterPlan("bible-90", "Bible in 90 Days", "A strong three-month path through the whole Bible.", wholeBibleBooks, 90),
  buildChapterPlan("bible-overview-60", "Bible Overview in 60 Days", "A two-month overview of the Bible's major movements.", wholeBibleBooks, 60, "Overview"),
  buildChapterPlan("new-testament-30", "New Testament in 30 Days", "Read the New Testament in one month.", NEW_TESTAMENT_BOOKS, 30, "New Testament"),
  buildChapterPlan("psalms-30", "Psalms in 30 Days", "Pray and reflect through the Psalms in a month.", ["Psalms"], 30, "Prayer"),
  oneChapterPerDayPlan("proverbs-31", "Proverbs in 31 Days", "Read one chapter of Proverbs each day.", "Proverbs", 31, "Wisdom"),
  buildChapterPlan("gospels-40", "Gospels in 40 Days", "Read Matthew, Mark, Luke, and John in forty days.", gospelBooks, 40, "Gospels"),
  buildChapterPlan("torah-pentateuch-50", "Torah / Pentateuch in 50 Days", "Read Genesis through Deuteronomy in a steady fifty-day path.", pentateuchBooks, 50, "Book study"),
  buildChapterPlan("major-prophets-overview", "Major Prophets Overview", "A manageable overview through Isaiah, Jeremiah, Lamentations, Ezekiel, and Daniel.", majorProphetBooks, 45, "Overview"),
  buildChapterPlan("acts-early-church", "Acts and the Early Church", "Follow the birth and spread of the early church through Acts.", ["Acts"], 28, "New Testament"),
  buildChapterPlan("pauls-letters-overview", "Paul's Letters Overview", "A guided overview through Paul's letters to churches and co-workers.", paulineBooks, 45, "New Testament"),
  planFromReferences("life-of-david", "Life of David", "Trace David's calling, courage, failure, repentance, and worship.", [
    ["1 Samuel 16", "1 Samuel", 16, "David anointed"],
    ["1 Samuel 17", "1 Samuel", 17, "David and Goliath"],
    ["1 Samuel 18", "1 Samuel", 18, "David and Saul"],
    ["1 Samuel 24", "1 Samuel", 24, "Mercy in the cave"],
    ["2 Samuel 5", "2 Samuel", 5, "David becomes king"],
    ["2 Samuel 6", "2 Samuel", 6, "Worship and the ark"],
    ["2 Samuel 7", "2 Samuel", 7, "God's promise"],
    ["2 Samuel 11", "2 Samuel", 11, "David's sin"],
    ["2 Samuel 12", "2 Samuel", 12, "Nathan confronts David"],
    ["Psalm 51", "Psalms", 51, "Repentance"],
    ["Psalm 23", "Psalms", 23, "The shepherd king"],
    ["1 Kings 2", "1 Kings", 2, "David's final charge"]
  ], "Character study"),
  planFromReferences("life-of-moses", "Life of Moses", "Follow Moses from deliverance to leadership, wilderness testing, and covenant faithfulness.", [
    ["Exodus 2", "Exodus", 2, "Moses preserved"],
    ["Exodus 3", "Exodus", 3, "The burning bush"],
    ["Exodus 12", "Exodus", 12, "Passover"],
    ["Exodus 14", "Exodus", 14, "Through the sea"],
    ["Exodus 16", "Exodus", 16, "Manna"],
    ["Exodus 19", "Exodus", 19, "At Sinai"],
    ["Exodus 20", "Exodus", 20, "The commandments"],
    ["Exodus 32", "Exodus", 32, "The golden calf"],
    ["Exodus 33", "Exodus", 33, "God's presence"],
    ["Numbers 13", "Numbers", 13, "Spies in the land"],
    ["Numbers 20", "Numbers", 20, "Water from the rock"],
    ["Deuteronomy 34", "Deuteronomy", 34, "Moses' final view"]
  ], "Character study"),
  withThemedDevotionals(planFromReferences("seven-days-prayer", "7 Days of Prayer", "A one-week path for turning Scripture into prayer.", [
    ["Matthew 6:5-13", "Matthew", 6, "Pray to your Father"],
    ["Luke 11:1-13", "Luke", 11, "Teach us to pray"],
    ["Psalm 23:1-6", "Psalms", 23, "Pray from trust"],
    ["Psalm 46:1-11", "Psalms", 46, "Be still before God"],
    ["Philippians 4:4-7", "Philippians", 4, "Pray with thanksgiving"],
    ["James 5:13-18", "James", 5, "Pray in every season"],
    ["1 John 5:13-15", "1 John", 5, "Ask with confidence"]
  ], "Prayer"), "prayer"),
  withThemedDevotionals(planFromReferences("seven-days-peace", "7 Days of Peace", "A short plan for anxiety, rest, and the peace of God.", [
    ["Psalm 4:6-8", "Psalms", 4, "Sleep in peace"],
    ["Psalm 23:1-4", "Psalms", 23, "The Shepherd's care"],
    ["Isaiah 26:3-4", "Isaiah", 26, "Perfect peace"],
    ["Matthew 6:25-34", "Matthew", 6, "Do not worry"],
    ["John 14:25-27", "John", 14, "My peace I give"],
    ["Philippians 4:4-9", "Philippians", 4, "Peace that guards"],
    ["Colossians 3:12-17", "Colossians", 3, "Let peace rule"]
  ], "Care"), "peace"),
  planFromReferences("identity-in-christ", "Identity in Christ", "Seven readings to help you remember who you are because of Christ.", [
    ["John 1:9-13", "John", 1, "Received as God's children", devotional(
      "Received before you perform",
      "John begins identity with reception, not achievement. Those who receive Christ are given the right to become children of God. That means belonging is not something you climb toward by religious effort; it is a gift God gives through Christ. Today, let this passage steady you before you measure yourself by productivity, approval, or failure.",
      "What false measure of identity does this passage gently correct for you?",
      "Father, help me receive the gift of belonging to you through Christ."
    )],
    ["Romans 8:1-4", "Romans", 8, "No condemnation", devotional(
      "No condemnation in Christ",
      "The Christian life does not begin under a cloud of accusation. Paul says there is now no condemnation for those who are in Christ Jesus. This is not denial of sin; it is confidence that Christ has dealt with sin. When shame tries to become your name, return to the sentence God speaks over those who belong to Christ.",
      "Where do you most need to hear 'no condemnation' today?",
      "Lord Jesus, teach me to stand in your mercy rather than my shame."
    )],
    ["2 Corinthians 5:17-21", "2 Corinthians", 5, "New creation", devotional(
      "Made new for reconciliation",
      "In Christ, new creation is not merely a private feeling. God reconciles us to himself and then gives us a ministry of reconciliation. Your identity is both received and sent: loved by God, made new by grace, and invited to become a witness of that grace in ordinary relationships.",
      "What would it look like to live today as someone reconciled to God?",
      "God of mercy, make your reconciling grace visible in me."
    )],
    ["Galatians 3:26-29", "Galatians", 3, "Clothed with Christ", devotional(
      "Clothed with Christ",
      "Paul says believers have been clothed with Christ. This image is wonderfully practical: before the world sees your gifts, background, weakness, or status, God sees you in his Son. Unity in Christ does not erase your story, but it gives you a deeper identity than every human label.",
      "Which lesser label has been louder than your identity in Christ?",
      "Lord, let Christ be the truest thing about how I see myself and others."
    )],
    ["Ephesians 1:3-10", "Ephesians", 1, "Blessed and chosen", devotional(
      "Blessed in Christ",
      "Ephesians lifts your eyes from self-definition to God's gracious purpose. In Christ, believers are blessed, chosen, adopted, redeemed, and forgiven. These words are not decorations; they are anchors. Your identity is grounded in God's will, God's grace, and God's plan to bring all things together in Christ.",
      "Which word in this passage gives your heart the strongest anchor today?",
      "Father, help me rest in the grace you have lavished in Christ."
    )],
    ["Colossians 3:1-4", "Colossians", 3, "Hidden with Christ", devotional(
      "Hidden with Christ",
      "Some parts of your life are visible and easily judged. But Paul says your life is hidden with Christ in God. That hiddenness is not emptiness; it is safety. Your deepest life is held by Christ, even when circumstances feel exposed, ordinary, or unfinished.",
      "How does being hidden with Christ change the way you face today?",
      "Christ, keep my mind set on you and my life anchored in you."
    )],
    ["1 Peter 2:9-10", "1 Peter", 2, "A chosen people", devotional(
      "Chosen to declare his praise",
      "Peter gives identity in plural form: a chosen people, a royal priesthood, a holy nation, God's own possession. You are not saved into isolation. You belong to God and to his people, so that your life can declare the mercy that brought you out of darkness into light.",
      "How can your life quietly declare God's mercy today?",
      "Lord, thank you for making me yours. Let my life point to your light."
    )]
  ], "Identity"),
  planFromReferences("abiding-in-christ", "Abiding in Christ", "A gentle week of readings about remaining with Jesus and bearing fruit from him.", [
    ["John 15:1-8", "John", 15, "Remain in me", devotional(
      "Fruit from closeness",
      "Jesus does not call his disciples to produce fruit by anxious striving. He calls them to remain in him. Branches bear fruit because they stay connected to the vine. Today, begin with dependence: receive his word, stay near, and let obedience grow from communion rather than pressure.",
      "Where are you tempted to produce fruit without remaining close to Christ?",
      "Jesus, teach me to remain in you and receive life from you."
    )],
    ["Psalm 1:1-3", "Psalms", 1, "Planted by streams", devotional(
      "Planted where life flows",
      "Psalm 1 describes a life rooted in God's instruction like a tree planted by streams of water. This is not hurried spirituality. It is a settled life, nourished over time. Abiding often looks ordinary: returning to Scripture, refusing the wrong path, and staying where God gives life.",
      "What stream of God's word do you need to stay near today?",
      "Lord, plant me deeply in your word and make my life fruitful in season."
    )],
    ["Psalm 27:4-8", "Psalms", 27, "Dwell with the Lord", devotional(
      "One thing",
      "David's desire is beautifully focused: to dwell in the house of the Lord and seek him. Abiding is not adding more spiritual noise; it is learning to seek one necessary thing. In pressure or distraction, God invites you to turn your face toward him again.",
      "What would it mean to seek the Lord as your 'one thing' today?",
      "Lord, when you say, 'Seek my face,' help my heart answer, 'Your face I will seek.'"
    )],
    ["Matthew 11:25-30", "Matthew", 11, "Come to me", devotional(
      "Rest for your soul",
      "Jesus' invitation is personal and gentle: come to me. He does not ignore weariness; he names it and offers rest. Abiding in Christ includes bringing your burdens honestly to him and learning his way. His yoke is not the crushing weight of self-salvation, but the restful obedience of walking with him.",
      "What burden do you need to bring to Jesus rather than carry alone?",
      "Gentle and humble Savior, give rest to my soul as I come to you."
    )],
    ["Luke 10:38-42", "Luke", 10, "Sit at Jesus' feet", devotional(
      "The necessary thing",
      "Martha's service mattered, but her worry crowded out attentiveness to Jesus. Mary shows a posture of receiving before doing. This passage does not shame faithful work; it reorders it. Abiding means letting Jesus have your attention before your activity takes over.",
      "What good activity might be crowding out attention to Jesus?",
      "Lord Jesus, quiet my distracted heart and help me choose what is necessary."
    )],
    ["Colossians 2:6-7", "Colossians", 2, "Rooted and built up", devotional(
      "Continue as you received",
      "Paul says to continue in Christ just as you received him. The Christian life grows by the same grace that began it. You are rooted, built up, strengthened, and overflowing with thankfulness as you keep walking in him. Abiding is steady continuation, not constant reinvention.",
      "Where do you need to continue in simple trust rather than start over in anxiety?",
      "Christ, root me more deeply in you and grow thanksgiving in me."
    )],
    ["1 John 2:24-28", "1 John", 2, "Abide in him", devotional(
      "Let the word remain",
      "John connects abiding with letting the apostolic message remain in us. Staying close to Christ is not vague spirituality; it is holding fast to the truth about the Son and the Father. As his word remains in you, you are invited to remain in him with confidence.",
      "What truth about Christ do you need to let remain in you today?",
      "Father, keep me in the truth of your Son and teach me to abide with confidence."
    )]
  ], "Abiding"),
  withThemedDevotionals(planFromReferences("seven-days-new-believers", "7 Days for New Believers", "A friendly first week for understanding grace, faith, prayer, and new life.", [
    ["John 3", "John", 3],
    ["Ephesians 2", "Ephesians", 2],
    ["Romans 8", "Romans", 8],
    ["Matthew 6", "Matthew", 6],
    ["Galatians 5", "Galatians", 5],
    ["1 John 1", "1 John", 1],
    ["Colossians 3", "Colossians", 3]
  ], "Beginner"), "beginner"),
  withThemedDevotionals(planFromReferences("ten-days-psalms", "10 Days in the Psalms", "Ten Psalms for worship, honesty, trust, and hope.", [
    ["Psalm 1", "Psalms", 1],
    ["Psalm 8", "Psalms", 8],
    ["Psalm 19", "Psalms", 19],
    ["Psalm 23", "Psalms", 23],
    ["Psalm 27", "Psalms", 27],
    ["Psalm 42", "Psalms", 42],
    ["Psalm 46", "Psalms", 46],
    ["Psalm 51", "Psalms", 51],
    ["Psalm 91", "Psalms", 91],
    ["Psalm 103", "Psalms", 103]
  ], "Prayer"), "prayer"),
  planFromReferences("fourteen-days-proverbs", "14 Days in Proverbs", "Two weeks of practical wisdom for daily decisions.", [
    ["Proverbs 1", "Proverbs", 1],
    ["Proverbs 2", "Proverbs", 2],
    ["Proverbs 3", "Proverbs", 3],
    ["Proverbs 4", "Proverbs", 4],
    ["Proverbs 8", "Proverbs", 8],
    ["Proverbs 10", "Proverbs", 10],
    ["Proverbs 11", "Proverbs", 11],
    ["Proverbs 12", "Proverbs", 12],
    ["Proverbs 15", "Proverbs", 15],
    ["Proverbs 16", "Proverbs", 16],
    ["Proverbs 18", "Proverbs", 18],
    ["Proverbs 22", "Proverbs", 22],
    ["Proverbs 27", "Proverbs", 27],
    ["Proverbs 31", "Proverbs", 31]
  ], "Wisdom"),
  planFromReferences("fourteen-days-life-of-jesus", "14 Days on the Life of Jesus", "A focused two-week path through Jesus' life, teaching, death, and resurrection.", [
    ["Luke 2", "Luke", 2],
    ["Matthew 3", "Matthew", 3],
    ["Matthew 4", "Matthew", 4],
    ["Matthew 5", "Matthew", 5],
    ["Mark 2", "Mark", 2],
    ["Luke 15", "Luke", 15],
    ["John 6", "John", 6],
    ["John 10", "John", 10],
    ["John 11", "John", 11],
    ["John 13", "John", 13],
    ["John 17", "John", 17],
    ["Matthew 26", "Matthew", 26],
    ["John 19", "John", 19],
    ["John 20", "John", 20]
  ], "Gospels"),
  withThemedDevotionals(planFromReferences("fourteen-days-faith", "14 Days on Faith", "Readings about trust, endurance, grace, and living by faith.", [
    ["Genesis 15:1-6", "Genesis", 15, "Believed the Lord"],
    ["Psalm 37:3-7", "Psalms", 37, "Trust and wait"],
    ["Habakkuk 3:17-19", "Habakkuk", 3, "Rejoice when it is hard"],
    ["Matthew 8:5-13", "Matthew", 8, "Great faith"],
    ["Mark 9:20-27", "Mark", 9, "Help my unbelief"],
    ["John 20:24-31", "John", 20, "Blessed are those who believe"],
    ["Romans 4:18-25", "Romans", 4, "Faith credited"],
    ["Romans 5:1-5", "Romans", 5, "Justified by faith"],
    ["Galatians 2:19-21", "Galatians", 2, "Live by faith"],
    ["Ephesians 2:8-10", "Ephesians", 2, "Saved by grace"],
    ["Hebrews 10:35-39", "Hebrews", 10, "Do not shrink back"],
    ["Hebrews 11:1-6", "Hebrews", 11, "Faith and pleasing God"],
    ["James 2:14-18", "James", 2, "Faith made visible"],
    ["1 Peter 1:3-9", "1 Peter", 1, "Faith through trials"]
  ], "Gospel"), "faith"),
  withThemedDevotionals(planFromReferences("fourteen-days-wisdom", "14 Days on Wisdom", "Two weeks of readings for wise choices, words, and priorities.", [
    ["1 Kings 3:5-14", "1 Kings", 3, "Ask for wisdom"],
    ["Psalm 1:1-6", "Psalms", 1, "The way of wisdom"],
    ["Psalm 119:97-105", "Psalms", 119, "A lamp to my feet"],
    ["Proverbs 1:1-7", "Proverbs", 1, "The beginning of knowledge"],
    ["Proverbs 2:1-11", "Proverbs", 2, "Search for wisdom"],
    ["Proverbs 3:5-12", "Proverbs", 3, "Trust the Lord"],
    ["Proverbs 4:20-27", "Proverbs", 4, "Guard your heart"],
    ["Proverbs 8:10-21", "Proverbs", 8, "Wisdom's value"],
    ["Ecclesiastes 3:1-11", "Ecclesiastes", 3, "A time for everything"],
    ["Matthew 7:24-27", "Matthew", 7, "Build on the rock"],
    ["James 1:5-8", "James", 1, "Ask God for wisdom"],
    ["James 3:13-18", "James", 3, "Wisdom from above"],
    ["Colossians 3:12-17", "Colossians", 3, "Wise community life"],
    ["2 Timothy 3:14-17", "2 Timothy", 3, "Scripture equips"]
  ], "Wisdom"), "wisdom"),
  withThemedDevotionals(planFromReferences("fourteen-days-grief-comfort", "14 Days on Grief and Comfort", "Gentle readings for sorrow, hope, and God's nearness.", [
    ["Psalm 13:1-6", "Psalms", 13, "How long, O Lord"],
    ["Psalm 23:1-6", "Psalms", 23, "The Shepherd's comfort"],
    ["Psalm 34:17-22", "Psalms", 34, "Near the brokenhearted"],
    ["Psalm 42:5-11", "Psalms", 42, "Hope in God"],
    ["Psalm 46:1-7", "Psalms", 46, "God is refuge"],
    ["Psalm 73:23-28", "Psalms", 73, "God is my portion"],
    ["Isaiah 40:27-31", "Isaiah", 40, "Strength renewed"],
    ["Isaiah 43:1-7", "Isaiah", 43, "I have called you by name"],
    ["Lamentations 3:19-26", "Lamentations", 3, "Mercies each morning"],
    ["Matthew 5:1-12", "Matthew", 5, "Blessed are those who mourn"],
    ["John 11:32-44", "John", 11, "Jesus wept"],
    ["Romans 8:18-25", "Romans", 8, "Future glory"],
    ["2 Corinthians 1:3-7", "2 Corinthians", 1, "God of all comfort"],
    ["Revelation 21:1-5", "Revelation", 21, "Every tear wiped away"]
  ], "Care"), "comfort"),
  withThemedDevotionals(planFromReferences("fourteen-days-anxiety-trust", "14 Days on Anxiety and Trust", "A two-week path for worry, fear, peace, and dependence on God.", [
    ["Psalm 23:1-4", "Psalms", 23, "The Shepherd is near"],
    ["Psalm 27:1-5", "Psalms", 27, "The Lord is my light"],
    ["Psalm 46:1-11", "Psalms", 46, "Be still"],
    ["Psalm 91:1-4", "Psalms", 91, "Shelter of the Most High"],
    ["Isaiah 26:3-4", "Isaiah", 26, "Perfect peace"],
    ["Isaiah 41:8-13", "Isaiah", 41, "Do not fear"],
    ["Matthew 6:25-34", "Matthew", 6, "Do not worry"],
    ["Matthew 11:28-30", "Matthew", 11, "Rest for your soul"],
    ["John 14:25-27", "John", 14, "My peace I give"],
    ["Romans 8:31-39", "Romans", 8, "Nothing can separate"],
    ["Philippians 4:4-9", "Philippians", 4, "Peace that guards"],
    ["Colossians 3:12-17", "Colossians", 3, "Let peace rule"],
    ["1 Peter 5:6-11", "1 Peter", 5, "Cast your cares"],
    ["1 John 4:13-19", "1 John", 4, "Perfect love"]
  ], "Care"), "peace"),
  planFromReferences("holy-week-passion-week", "Holy Week / Passion Week", "Walk through the final week, cross, and resurrection of Jesus.", [
    ["Matthew 21", "Matthew", 21, "Palm Sunday"],
    ["Matthew 22", "Matthew", 22, "Questions and teaching"],
    ["Matthew 26", "Matthew", 26, "Gethsemane"],
    ["John 13", "John", 13, "Servant love"],
    ["John 17", "John", 17, "Jesus prays"],
    ["John 19", "John", 19, "The cross"],
    ["John 20", "John", 20, "The resurrection"]
  ], "Gospels"),
  planFromReferences("advent-readings", "Advent readings", "Readings that trace promise, hope, and the coming of Christ.", [
    ["Genesis 3", "Genesis", 3],
    ["Genesis 12", "Genesis", 12],
    ["Isaiah 7", "Isaiah", 7],
    ["Isaiah 9", "Isaiah", 9],
    ["Isaiah 11", "Isaiah", 11],
    ["Micah 5", "Micah", 5],
    ["Luke 1", "Luke", 1],
    ["Luke 2", "Luke", 2],
    ["Matthew 1", "Matthew", 1],
    ["Matthew 2", "Matthew", 2],
    ["John 1", "John", 1],
    ["Galatians 4", "Galatians", 4],
    ["Philippians 2", "Philippians", 2],
    ["Revelation 22", "Revelation", 22]
  ], "Gospels"),
  planFromReferences("easter-resurrection-readings", "Easter / Resurrection readings", "Readings that focus on the resurrection and the hope it brings.", [
    ["Isaiah 53", "Isaiah", 53],
    ["Matthew 28", "Matthew", 28],
    ["Mark 16", "Mark", 16],
    ["Luke 24", "Luke", 24],
    ["John 20", "John", 20],
    ["John 21", "John", 21],
    ["Acts 2", "Acts", 2],
    ["Acts 4", "Acts", 4],
    ["Romans 6", "Romans", 6],
    ["Romans 8", "Romans", 8],
    ["1 Corinthians 15", "1 Corinthians", 15],
    ["1 Peter 1", "1 Peter", 1],
    ["Revelation 1", "Revelation", 1],
    ["Revelation 21", "Revelation", 21]
  ], "Gospels"),
  planFromReferences("life-of-jesus", "Life of Jesus", "Key readings from the birth, ministry, death, and resurrection of Jesus.", [
    ["Luke 2", "Luke", 2, "Birth of Jesus"],
    ["Matthew 3", "Matthew", 3, "Baptism of Jesus"],
    ["Matthew 4", "Matthew", 4, "Temptation"],
    ["Matthew 5", "Matthew", 5, "Kingdom teaching"],
    ["Mark 2", "Mark", 2, "Authority and mercy"],
    ["Luke 15", "Luke", 15, "Lost and found"],
    ["John 11", "John", 11, "Resurrection and life"],
    ["John 13", "John", 13, "Servant love"],
    ["John 17", "John", 17, "Jesus prays"],
    ["Matthew 26", "Matthew", 26, "Gethsemane"],
    ["John 19", "John", 19, "The cross"],
    ["John 20", "John", 20, "The resurrection"]
  ], "Gospels"),
  withThemedDevotionals(planFromReferences("romans-road", "Romans Road", "A short path through Romans for sin, grace, faith, and new life.", [
    ["Romans 1", "Romans", 1],
    ["Romans 3", "Romans", 3],
    ["Romans 5", "Romans", 5],
    ["Romans 6", "Romans", 6],
    ["Romans 8", "Romans", 8],
    ["Romans 10", "Romans", 10],
    ["Romans 12", "Romans", 12]
  ], "Gospel"), "gospel"),
  withThemedDevotionals(planFromReferences("prayer-dependence", "Prayer and Dependence", "Readings that invite trust, prayer, and daily dependence on God.", [
    ["Matthew 6:9-13", "Matthew", 6, "The Lord's Prayer"],
    ["Luke 11:5-13", "Luke", 11, "Ask, seek, knock"],
    ["Psalm 23:1-6", "Psalms", 23, "The Lord provides"],
    ["Psalm 46:1-11", "Psalms", 46, "God is refuge"],
    ["Philippians 4:4-7", "Philippians", 4, "Pray with thanksgiving"],
    ["James 1:5-8", "James", 1, "Ask for wisdom"],
    ["1 Peter 5:6-11", "1 Peter", 5, "Cast your cares"]
  ], "Prayer"), "prayer"),
  withThemedDevotionals(planFromReferences("anxiety-peace", "Anxiety and Peace", "Scripture readings for worry, fear, peace, and trust.", [
    ["Psalm 23:1-4", "Psalms", 23, "The Shepherd's care"],
    ["Psalm 46:1-7", "Psalms", 46, "God is refuge"],
    ["Isaiah 26:3-4", "Isaiah", 26, "Perfect peace"],
    ["Matthew 6:25-34", "Matthew", 6, "Do not worry"],
    ["Matthew 11:28-30", "Matthew", 11, "Come to me"],
    ["John 14:25-27", "John", 14, "Peace from Jesus"],
    ["Philippians 4:4-9", "Philippians", 4, "Peace that guards"],
    ["1 Peter 5:6-11", "1 Peter", 5, "Cast your cares"]
  ], "Care"), "peace"),
  withThemedDevotionals(planFromReferences("wisdom-decisions", "Wisdom for Decisions", "Readings for wisdom, discernment, and faithful choices.", [
    ["Proverbs 1:1-7", "Proverbs", 1, "Begin with the fear of the Lord"],
    ["Proverbs 2:1-11", "Proverbs", 2, "Search for wisdom"],
    ["Proverbs 3:5-12", "Proverbs", 3, "Trust the Lord"],
    ["Proverbs 16:1-9", "Proverbs", 16, "Commit your way"],
    ["James 1:5-8", "James", 1, "Ask God for wisdom"],
    ["Colossians 3:12-17", "Colossians", 3, "Wisdom in community"],
    ["Psalm 25:4-10", "Psalms", 25, "Teach me your paths"]
  ], "Wisdom"), "wisdom"),
  withThemedDevotionals(planFromReferences("grief-comfort", "Grief and Comfort", "Gentle passages for sorrow, comfort, hope, and God's nearness.", [
    ["Psalm 13:1-6", "Psalms", 13, "Bring sorrow to God"],
    ["Psalm 34:17-22", "Psalms", 34, "Near the brokenhearted"],
    ["Psalm 42:5-11", "Psalms", 42, "Hope in God"],
    ["Isaiah 40:27-31", "Isaiah", 40, "Strength renewed"],
    ["John 11:32-44", "John", 11, "Jesus wept"],
    ["2 Corinthians 1:3-7", "2 Corinthians", 1, "God of all comfort"],
    ["Revelation 21:1-5", "Revelation", 21, "Every tear wiped away"]
  ], "Care"), "comfort"),
  withThemedDevotionals(planFromReferences("beginner-bible", "Beginner Bible Reading Plan", "A friendly first path through major Bible themes and stories.", [
    ["Genesis 1", "Genesis", 1],
    ["Genesis 12", "Genesis", 12],
    ["Exodus 3", "Exodus", 3],
    ["Psalm 23", "Psalms", 23],
    ["Isaiah 53", "Isaiah", 53],
    ["Luke 2", "Luke", 2],
    ["John 3", "John", 3],
    ["Romans 8", "Romans", 8],
    ["Ephesians 2", "Ephesians", 2],
    ["Revelation 21", "Revelation", 21]
  ], "Beginner"), "beginner"),
  planFromReferences("chronological-overview", "Chronological Bible Overview", "A broad overview of the Bible story in historical flow.", [
    ["Genesis 1", "Genesis", 1],
    ["Genesis 12", "Genesis", 12],
    ["Exodus 12", "Exodus", 12],
    ["Joshua 1", "Joshua", 1],
    ["1 Samuel 16", "1 Samuel", 16],
    ["2 Samuel 7", "2 Samuel", 7],
    ["Isaiah 53", "Isaiah", 53],
    ["Luke 2", "Luke", 2],
    ["John 19", "John", 19],
    ["Acts 2", "Acts", 2],
    ["Romans 8", "Romans", 8],
    ["Revelation 21", "Revelation", 21]
  ], "Overview"),
  buildChapterPlan("old-testament-overview", "Old Testament Overview in 60 Days", "A broad chapter-by-chapter overview of the Old Testament.", OLD_TESTAMENT_BOOKS, 60, "Overview"),
  buildChapterPlan("new-testament-overview", "New Testament Overview", "A broad chapter-by-chapter overview of the New Testament.", NEW_TESTAMENT_BOOKS, 30, "Overview")
];

export const bibleReadingPlans = builtInBibleReadingPlans;
