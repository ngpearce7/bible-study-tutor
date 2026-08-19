import { BIBLE_CHAPTER_COUNTS, NEW_TESTAMENT_BOOKS, OLD_TESTAMENT_BOOKS } from "@/data/bibleLibrary";

export type BibleReadingPlanSource = "built-in" | "custom";

export type BibleReadingPlanDay = {
  day: number;
  title: string;
  reference: string;
  readerBook: string;
  readerChapter: number;
  studyReference: string;
  context?: string;
  devotional?: {
    title: string;
    body: string;
    source?: string;
  };
  observationQuestion?: string;
  reflectionQuestion?: string;
  reflectionPrompt?: string;
  prayer?: string;
  prayerPrompt?: string;
  gentleAction?: string;
  studyMethod?: string;
  careNote?: string;
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
  careNote?: string;
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

type BibleReadingPlanDayExtras = Pick<
  BibleReadingPlanDay,
  | "context"
  | "devotional"
  | "observationQuestion"
  | "reflectionQuestion"
  | "reflectionPrompt"
  | "prayer"
  | "prayerPrompt"
  | "gentleAction"
  | "studyMethod"
  | "careNote"
>;

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
    days.push(
      buildDay(
        day,
        reference,
        chapter.book,
        chapter.chapter,
        isReflectionDay ? `Reflect on ${reference}` : reference,
        reference,
        isReflectionDay ? reflectionDayGuidance(reference) : {}
      )
    );
  }

  return enrichPlanMetadata({ id, title, description, source: "built-in", category, days });
}

function reflectionDayGuidance(reference: string): BibleReadingPlanDayExtras {
  return {
    context: `This reflection day returns to ${reference} so the passage can settle rather than simply be checked off.`,
    devotional: {
      title: `Return to ${reference}`,
      body: "A slower reading can reveal what a first reading missed. Come back to the passage with attention to repeated words, commands, promises, warnings, and the way it points you toward God. Let review become meditation, not busywork.",
      source: "Bible Study Tutor"
    },
    observationQuestion: "What did you notice this time that you did not notice before?",
    reflectionQuestion: "What part of this passage needs to shape your trust, repentance, worship, or obedience today?",
    prayer: "Lord, help Your Word remain with me and form me in faithful love for You.",
    gentleAction: "Write one sentence you want to carry from this passage today.",
    studyMethod: "Meditation"
  };
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
  if (category.includes("abiding")) return "To help you slow down with Jesus' invitation to remain in Him, depend on Him, and bear fruit from closeness with Him.";
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
    careNote: enriched.careNote || "",
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

function devotional(
  title: string,
  body: string,
  reflectionPrompt: string,
  prayerPrompt: string,
  extras: Omit<BibleReadingPlanDayExtras, "devotional" | "reflectionPrompt" | "prayerPrompt"> = {}
): BibleReadingPlanDayExtras {
  return {
    ...extras,
    devotional: {
      title,
      body,
      source: "Bible Study Tutor"
    },
    reflectionPrompt,
    prayerPrompt
  };
}

const carePlanPastoralNote =
  "Anxiety and grief are not signs that you have failed spiritually. Scripture can accompany you through distress, but this plan is not a substitute for appropriate pastoral, medical, or mental-health care. If you feel unsafe or unable to cope, contact a trusted person and suitable local support.";

function guidedDevotional({
  title,
  context,
  body,
  observationQuestion,
  reflectionQuestion,
  prayer,
  gentleAction,
  studyMethod,
  careNote
}: {
  title: string;
  context: string;
  body: string;
  observationQuestion: string;
  reflectionQuestion: string;
  prayer: string;
  gentleAction: string;
  studyMethod?: string;
  careNote?: string;
}): BibleReadingPlanDayExtras {
  return devotional(title, body, reflectionQuestion, prayer, {
    context,
    observationQuestion,
    reflectionQuestion,
    prayer,
    gentleAction,
    studyMethod,
    careNote
  });
}

function withPastoralCareNote(plan: BibleReadingPlan): BibleReadingPlan {
  return {
    ...plan,
    careNote: plan.careNote || carePlanPastoralNote,
    days: plan.days.map((day) => ({
      ...day,
      careNote: day.careNote || carePlanPastoralNote
    }))
  };
}

const psalm46StillBeforeGodDevotional = devotional(
  "Be still before the God who reigns",
  "Psalm 46 does not pretend the world is calm. The earth gives way, nations rage, and kingdoms totter, yet God is present with His people as refuge, strength, and help. The call to be still is not passive avoidance; it is a summons to stop striving as though everything rests on you, and to know that the Lord is exalted over every shaking thing.",
  "Where are you carrying pressure as though God is absent, hurried, or unable to help?",
  "Lord Almighty, quiet my striving and help me know that You are present, faithful, and exalted."
);

const psalm46RefugeDevotional = devotional(
  "God is refuge in the shaking",
  "Psalm 46 names real instability: trouble, fear, noise, conflict, and upheaval. Its comfort is not that trouble disappears, but that God is with His people in the midst of it. Read the Psalm slowly and notice the repeated confidence: the Lord is refuge, the Lord is with us, and the Lord will be exalted.",
  "What trouble feels loud today, and what does this Psalm say is truer than that trouble?",
  "God, be my refuge and strength today. Teach me to trust Your presence more than the noise around me."
);

type CuratedDevotionalMap = Record<string, Record<string, BibleReadingPlanDayExtras>>;

const curatedDevotionalsByPlan: CuratedDevotionalMap = {
  "seven-days-prayer": {
    "Matthew 6:5-13": devotional(
      "Pray to your Father",
      "Jesus warns against prayer that performs for people and teaches prayer that rests before the Father. The Lord's Prayer begins with God's name, kingdom, and will before turning to daily bread, forgiveness, and deliverance. Prayer is not a display of spirituality; it is childlike dependence on the Father who sees.",
      "Where does your prayer need to become simpler, more honest, and more Father-centered?",
      "Father, teach me to pray for Your name, Your kingdom, and today's needed grace."
    ),
    "Luke 11:1-13": devotional(
      "Teach us to pray",
      "The disciples ask Jesus to teach them to pray, and He answers with both a pattern and encouragement to ask. The Father is not reluctant or careless; He gives what is good, especially the Holy Spirit. Prayer grows when you trust the Father's goodness more than your own words.",
      "What do you need to ask the Father for with renewed trust in His goodness?",
      "Father, teach me to ask, seek, and knock as one who trusts Your heart."
    ),
    "Psalm 23:1-6": devotional(
      "Pray from trust",
      "Psalm 23 gives prayer the language of trust. The Lord shepherds, restores, guides, protects, provides, and surrounds His people with goodness and mercy. You can pray from need without panic because the Shepherd knows how to care for His sheep.",
      "Which line of Psalm 23 gives words to your prayer today?",
      "Lord, my Shepherd, lead me, restore me, and keep me near You."
    ),
    "Psalm 46:1-11": psalm46StillBeforeGodDevotional,
    "Philippians 4:4-7": devotional(
      "Pray with thanksgiving",
      "Paul calls anxious hearts to bring requests to God with thanksgiving. Thanksgiving does not pretend needs are small; it remembers God's faithfulness while naming them. The peace that follows is God's guard over the heart and mind in Christ.",
      "What anxious request can you bring to God with thanksgiving today?",
      "Lord, receive my requests and guard my heart and mind in Christ."
    ),
    "James 5:13-18": devotional(
      "Pray in every season",
      "James places prayer in suffering, cheerfulness, sickness, confession, and restoration. Prayer is not reserved for one emotional state; it belongs to the whole life of faith. The example of Elijah reminds you that God works through ordinary human prayer offered in trust.",
      "What season are you in, and what kind of prayer does James invite from you?",
      "Lord, teach me to turn to You in suffering, joy, weakness, confession, and hope."
    ),
    "1 John 5:13-15": devotional(
      "Ask with confidence",
      "John grounds confidence in eternal life given through the Son and in asking according to God's will. This is not confidence that every desire will be granted on our terms, but confidence that God hears His children and is faithful to His will.",
      "What request needs to be brought under God's will with confidence that He hears?",
      "Father, help me ask with trust, humility, and confidence in Your will."
    )
  },
  "fourteen-days-anxiety-trust": {
    "Psalm 23:1-4": devotional(
      "The Shepherd is near",
      "Psalm 23 begins with the Lord Himself, not with the sheep's ability to manage fear. David can walk through the valley because the Shepherd is with him. This passage does not deny dark places; it teaches you to locate comfort in God's presence, guidance, and care while you pass through them.",
      "Where do you need to remember that the Lord is with you, not merely watching from far away?",
      "Lord, Shepherd of my soul, steady me with Your presence and lead me in Your care."
    ),
    "Psalm 27:1-5": devotional(
      "Light when fear rises",
      "David names enemies and trouble, but he begins with the Lord as light, salvation, and stronghold. Fear is answered first by who God is. The desire to dwell with the Lord is not escape; it is the deepest safety David knows when pressure surrounds him.",
      "Which fear needs to be answered today by who the Lord is?",
      "Lord, be my light and salvation. Teach my heart to seek You before fear takes the lead."
    ),
    "Psalm 46:1-11": psalm46StillBeforeGodDevotional,
    "Psalm 91:1-4": devotional(
      "Shelter under His wings",
      "Psalm 91 speaks of dwelling in the shelter of the Most High. Its confidence is relational: God is refuge and fortress for those who trust Him. The image of wings invites nearness and dependence, not a demand that hardship cannot touch us. The safest place is belonging to the Lord.",
      "Where are you tempted to seek shelter in control rather than in God Himself?",
      "Most High God, draw me near and teach me to trust Your care when fear looks for another refuge."
    ),
    "Isaiah 26:3-4": devotional(
      "A mind stayed on Him",
      "Isaiah connects peace with a mind stayed on God because it trusts in Him. This is not positive thinking; it is steady attention to the Lord as the everlasting Rock. Peace grows as trust is anchored in God's character rather than in changing circumstances.",
      "What thought pattern needs to be re-anchored in the Lord today?",
      "Lord, keep my mind stayed on You and teach me to trust You as my everlasting Rock."
    ),
    "Isaiah 41:8-13": devotional(
      "Held by His righteous hand",
      "God's words to His servant are tender and strong: do not fear, for I am with you. The command rests on His presence, His help, and His upholding hand. Fear is not minimized; it is met by God's covenant faithfulness and personal nearness.",
      "Where do you need to receive God's promise, 'I will help you'?",
      "Lord, uphold me with Your righteous hand and make me brave in Your presence."
    ),
    "Matthew 6:25-34": devotional(
      "Seek first the Father",
      "Jesus does not mock anxious thoughts. He redirects them toward the Father's care, the birds and lilies, and the priority of God's kingdom. The passage calls you away from tomorrow's imagined burdens and toward today's faithful trust.",
      "Which concern about tomorrow are you trying to carry before grace has been given for it?",
      "Father, help me seek Your kingdom today and trust You with tomorrow."
    ),
    "Matthew 11:28-30": devotional(
      "Rest under Jesus' yoke",
      "Jesus invites the weary to come to Him, not merely to adopt a calmer mindset. His rest comes through belonging to Him and learning His gentle way. The yoke of Christ is not crushing self-rescue; it is the restful obedience of walking with the Savior.",
      "What burden do you need to bring honestly to Jesus rather than keep carrying alone?",
      "Gentle Savior, teach me Your way and give rest to my soul."
    ),
    "John 14:25-27": devotional(
      "Peace from Jesus",
      "Jesus gives peace while preparing His disciples for His departure. His peace is not the world's promise of easy circumstances, but the settled gift of His presence, word, and Spirit. Troubled hearts are invited to trust Him because He remains faithful.",
      "What trouble needs to be brought under the peace Jesus gives?",
      "Lord Jesus, give me Your peace and keep my heart from being ruled by fear."
    ),
    "Romans 8:31-39": devotional(
      "Nothing can separate",
      "Paul stacks question upon question so believers will feel the strength of God's love in Christ. Suffering is named honestly, but it cannot separate God's people from Christ. Assurance rests not in your grip on God, but in His saving love shown through His Son.",
      "Which accusation, fear, or suffering needs to hear that nothing can separate you from Christ's love?",
      "Father, root me deeply in the love You have shown in Christ Jesus my Lord."
    ),
    "Philippians 4:4-9": devotional(
      "Peace that guards",
      "Paul does not tell anxious believers simply to stop feeling anxious. He calls them to bring requests to God with thanksgiving and to fill their minds with what is true, honorable, and praiseworthy. God's peace guards the heart and mind in Christ, like a watchman at the gate.",
      "What request can you bring to God today with thanksgiving rather than silent worry?",
      "God of peace, guard my heart and mind in Christ Jesus."
    ),
    "Colossians 3:12-17": devotional(
      "Let peace rule",
      "Paul places peace inside the life of a community clothed with compassion, forgiveness, love, and thankfulness. Peace is not only an inner feeling; it is allowed to rule relationships under Christ's lordship. Anxiety is often calmed as Christ's word and peace take the governing place.",
      "Where does Christ's peace need to rule your response to another person?",
      "Lord Jesus, let Your peace rule in me and let Your word dwell richly in my life."
    ),
    "1 Peter 5:6-11": devotional(
      "Cast your cares on Him",
      "Peter joins humility, watchfulness, suffering, and hope. Casting anxieties on God is not denial; it is a humble act of trust because He cares for you. The God of all grace will restore, confirm, strengthen, and establish His people.",
      "What care do you need to hand to God because He cares for you?",
      "God of all grace, receive my cares and strengthen me in Christ."
    ),
    "1 John 4:13-19": devotional(
      "Love that drives out fear",
      "John grounds confidence in God's love made known through Christ and witnessed by the Spirit. Perfect love casts out fear because judgment is no longer the believer's final terror in Christ. Fear is answered by abiding in the love God has first given.",
      "Where do you need God's first love to quiet fear of punishment, rejection, or exposure?",
      "Father, help me abide in Your love and live without the fear that Christ has answered."
    )
  },
  "prayer-dependence": {
    "Matthew 6:9-13": guidedDevotional({
      title: "Pray as a child of the Father",
      context: "Jesus teaches His disciples to pray with God first: His name, His kingdom, and His will, then daily needs, forgiveness, and deliverance.",
      body: "The Lord's Prayer trains dependence without performance. It begins with the Father, not with frantic need. Daily bread, forgiveness, and rescue are brought into relationship with the One whose name is holy and whose kingdom is coming.",
      observationQuestion: "What requests are directed toward God first, and what needs are then brought to Him?",
      reflectionQuestion: "Which phrase of the Lord's Prayer most needs to shape your dependence today?",
      prayer: "Father, let Your name be hallowed in me and teach me to depend on You for today.",
      gentleAction: "Pray the Lord's Prayer slowly, pausing at the phrase that most catches your attention.",
      studyMethod: "SOAP"
    }),
    "Luke 11:5-13": guidedDevotional({
      title: "Ask the generous Father",
      context: "After teaching prayer, Jesus encourages persistence by pointing to human asking and the Father's greater goodness.",
      body: "The heart of this passage is not that God is reluctant and must be worn down. Jesus points beyond imperfect human generosity to the Father's goodness, especially His gift of the Holy Spirit. Dependence grows when you ask from trust rather than suspicion.",
      observationQuestion: "What does Jesus say the Father gives, and how does He compare the Father to human parents?",
      reflectionQuestion: "Where are you hesitant to ask because you doubt the Father's goodness?",
      prayer: "Father, teach me to ask, seek, and knock with trust in Your generous heart.",
      gentleAction: "Ask God plainly for one good thing you need, then thank Him for hearing you as Father.",
      studyMethod: "OIA"
    }),
    "Psalm 23:1-6": guidedDevotional({
      title: "The Lord provides",
      context: "David confesses the Lord as Shepherd across rest, restoration, guidance, danger, provision, mercy, and dwelling with God.",
      body: "Psalm 23 turns dependence into worship. David's confidence is not that need never appears, but that the Shepherd meets him in every season. The Lord's care is personal, steady, and generous enough for green pastures, dark valleys, and the house of the Lord.",
      observationQuestion: "What does the Shepherd provide or do across this Psalm?",
      reflectionQuestion: "Which need can you bring to the Shepherd instead of managing alone?",
      prayer: "Lord, my Shepherd, lead me, restore me, and teach me to trust Your provision.",
      gentleAction: "Name one place where you need shepherding and ask the Lord to lead you there.",
      studyMethod: "Meditation"
    }),
    "Psalm 46:1-11": guidedDevotional({
      title: "Be still before the God who reigns",
      context: "Psalm 46 names trouble, shaking, conflict, and noise, but repeats that God is refuge and present with His people.",
      body: "The command to be still is not denial or passivity. It is a summons to stop striving as if everything rests on you and to know that the Lord is exalted. Dependence becomes worship when pressure is brought before the God who reigns.",
      observationQuestion: "What trouble is named, and what is repeated about God?",
      reflectionQuestion: "Where are you carrying pressure as though God is absent or unable to help?",
      prayer: "Lord Almighty, quiet my striving and help me know that You are present, faithful, and exalted.",
      gentleAction: "Sit quietly for one minute and repeat, 'The Lord is with us.'",
      studyMethod: "COMA"
    }),
    "Philippians 4:4-7": guidedDevotional({
      title: "Pray with thanksgiving",
      context: "Paul writes from hardship and calls believers to rejoice, be gentle, and bring requests to God with thanksgiving.",
      body: "Thanksgiving does not erase need; it remembers God's faithfulness while need is being named. The promised peace guards hearts and minds in Christ, not apart from Him. Dependence means bringing requests to God rather than letting them rule unspoken.",
      observationQuestion: "What does Paul tell believers to do with their requests?",
      reflectionQuestion: "What request can you bring to God today with honest need and real thanksgiving?",
      prayer: "Lord, receive my requests and guard my heart and mind in Christ Jesus.",
      gentleAction: "Write one request and one reason for thanksgiving beside it.",
      studyMethod: "SOAP"
    }),
    "James 1:5-8": guidedDevotional({
      title: "Ask God for wisdom",
      context: "James writes about trials and steadfastness, then invites those who lack wisdom to ask the generous God.",
      body: "This is dependence in decision-making: not pretending to know, not wavering between self-rule and trust, but asking the Lord for wisdom to endure faithfully. God is not stingy with wisdom. He gives generously to those who come to Him.",
      observationQuestion: "What does James say to do when wisdom is lacking?",
      reflectionQuestion: "Where do you need wisdom more than control?",
      prayer: "Generous God, give me wisdom and make my trust steady before You.",
      gentleAction: "Before making one decision today, ask God for wisdom in a single honest sentence.",
      studyMethod: "Inductive"
    }),
    "1 Peter 5:6-11": guidedDevotional({
      title: "Cast your cares",
      context: "Peter speaks to humbled believers under pressure, calling them to cast anxieties on God while remaining watchful and hopeful.",
      body: "Dependence does not make you careless; the same passage calls for sober watchfulness. You can be alert without being ruled by fear because God cares for you, and the God of all grace will restore, confirm, strengthen, and establish His people.",
      observationQuestion: "What does Peter connect with humility, watchfulness, suffering, and God's care?",
      reflectionQuestion: "What care needs to be cast on God rather than carried as though it belongs to you alone?",
      prayer: "God of all grace, care for me, strengthen me, and keep me watchful in hope.",
      gentleAction: "Open your hands as a simple prayer and name one care you are giving to God.",
      studyMethod: "COMA"
    })
  },
  "fourteen-days-faith": {
    "Genesis 15:1-6": devotional(
      "Believed the Lord",
      "Abram hears God's promise while the visible evidence still looks impossible. His faith is not vague optimism; he believes the Lord who speaks. Scripture says this trust was counted to him as righteousness, pointing forward to the grace God gives through faith.",
      "What promise of God needs to become weightier than what you can presently see?",
      "Lord, help me take You at Your word and trust Your promise."
    ),
    "Psalm 37:3-7": devotional(
      "Trust and wait",
      "Psalm 37 joins trust with concrete faithfulness: dwell, do good, delight in the Lord, commit your way, be still, and wait. Faith is not frantic control. It is patient confidence that the Lord sees and acts rightly.",
      "Where do you need to practice trust by waiting faithfully rather than forcing an outcome?",
      "Lord, help me commit my way to You and wait with a quiet heart."
    ),
    "Habakkuk 3:17-19": devotional(
      "Rejoice when it is hard",
      "Habakkuk's faith does not depend on visible abundance. Even if fields, flocks, and harvests fail, he rejoices in the Lord and takes strength in God. This is not denial of loss; it is worship anchored in God when supports are stripped away.",
      "What circumstance is testing whether your joy is anchored in God Himself?",
      "Lord, be my strength when visible supports feel weak."
    ),
    "Matthew 8:5-13": devotional(
      "Great faith",
      "The centurion recognizes Jesus' authority and trusts His word even from a distance. Jesus marvels at this faith because it sees who He is. Faith is not confidence in technique; it is confidence in the authority and mercy of Christ.",
      "Where do you need to trust the authority of Jesus' word today?",
      "Lord Jesus, strengthen my faith in Your authority and mercy."
    ),
    "Mark 9:20-27": devotional(
      "Help my unbelief",
      "The father's cry is honest: 'I believe; help my unbelief.' Jesus does not require polished confidence before mercy is given. This passage gives weak faith words to bring both trust and struggle to Christ.",
      "Where can you honestly say, 'I believe; help my unbelief'?",
      "Lord Jesus, meet me in weak faith and strengthen my trust in You."
    ),
    "John 20:24-31": devotional(
      "Blessed are those who believe",
      "Thomas moves from doubt to worship when he meets the risen Christ. John writes so readers may believe that Jesus is the Christ, the Son of God, and have life in His name. Faith rests on the witness to the risen Lord.",
      "What does this passage invite you to confess about Jesus?",
      "My Lord and my God, deepen my faith in Your risen life."
    ),
    "Romans 4:18-25": devotional(
      "Faith credited",
      "Paul reflects on Abraham's faith to show that righteousness is counted by grace, not achieved by works. Abraham trusts the God who gives life to the dead, and Paul points believers to Jesus, delivered for our trespasses and raised for our justification.",
      "How does Christ's death and resurrection strengthen your confidence before God?",
      "Father, ground my faith in Christ who died and was raised for me."
    ),
    "Romans 5:1-5": devotional(
      "Justified by faith",
      "Because believers are justified by faith, they have peace with God through Jesus Christ. Even suffering is not meaningless, because God uses it to form endurance, character, and hope. This hope does not shame us because God's love has been poured into our hearts.",
      "Where do you need peace with God to steady you in suffering?",
      "Lord, let the hope of Your love strengthen me through trial."
    ),
    "Galatians 2:19-21": devotional(
      "Live by faith",
      "Paul says he has been crucified with Christ and now lives by faith in the Son of God, who loved him and gave Himself for him. Faith is deeply personal here: daily life is lived from union with Christ and His self-giving love.",
      "What part of today needs to be lived by faith in the Son of God who loves you?",
      "Christ, live in me and teach me to trust Your love."
    ),
    "Ephesians 2:8-10": devotional(
      "Saved by grace",
      "Ephesians makes the order clear: salvation is by grace through faith, not works, so no one may boast. Yet grace also creates a new life prepared for good works. Faith receives God's gift before it walks in God's workmanship.",
      "Where do you need to receive grace before trying to prove yourself?",
      "Father, keep me humble in grace and ready for the good works You prepare."
    ),
    "Hebrews 10:35-39": devotional(
      "Do not shrink back",
      "Hebrews calls weary believers to endurance because God's promise is sure. Faith keeps moving toward the coming One rather than shrinking back under pressure. The passage encourages confidence rooted in God's faithfulness.",
      "Where are you tempted to shrink back instead of endure in faith?",
      "Lord, give me endurance and keep my confidence in Your promise."
    ),
    "Hebrews 11:1-6": devotional(
      "Faith and pleasing God",
      "Hebrews describes faith as assurance and conviction rooted in God's unseen reality. Abel, Enoch, and all who draw near to God show that faith believes He exists and rewards those who seek Him. Faith is relational trust in God Himself.",
      "What unseen promise of God needs your trust today?",
      "Lord, help me draw near to You with faith that seeks and trusts You."
    ),
    "James 2:14-18": devotional(
      "Faith made visible",
      "James does not oppose Paul; he opposes empty claims that never become love. Genuine faith shows itself in mercy and obedience. Works do not replace faith, but living faith refuses to leave a neighbor uncared for.",
      "How might faith become visible in love or mercy today?",
      "Lord, make my faith living, humble, and active in love."
    ),
    "1 Peter 1:3-9": devotional(
      "Faith through trials",
      "Peter blesses God for new birth into a living hope through the resurrection of Jesus. Trials grieve believers, but tested faith is precious because it looks toward Christ and the salvation to be revealed. Faith holds joy and grief together in hope.",
      "What trial needs to be held in the living hope of Christ's resurrection?",
      "Father, guard my faith and fill me with hope in the risen Christ."
    )
  },
  "seven-days-peace": {
    "Psalm 4:6-8": guidedDevotional({
      title: "Sleep in the Lord's care",
      context: "David speaks to God while many are asking who will show them good. His confidence rests in the Lord's face, joy, safety, and care.",
      body: "Psalm 4 does not promise that every outward pressure has disappeared by bedtime. It shows a heart learning to rest because the Lord Himself gives safety. Peace here is not denial; it is trust that can lie down under God's care even before every circumstance changes.",
      observationQuestion: "What does David ask from the Lord, and what allows him to lie down in peace?",
      reflectionQuestion: "What concern is keeping your heart awake before God?",
      prayer: "Lord, lift the light of Your face on me and teach me to rest in Your safety.",
      gentleAction: "Before sleep or a quiet pause, name one concern and entrust it to the Lord.",
      studyMethod: "Meditation"
    }),
    "Psalm 23:1-4": guidedDevotional({
      title: "Peace with the Shepherd",
      context: "David describes the Lord as Shepherd who provides, restores, leads, and stays near even in the valley of deep darkness.",
      body: "The green pastures and quiet waters come from the Shepherd's presence and leading. Even the valley is not faced alone. Peace is not the absence of shadows; it is the nearness of the Lord who restores and guides His people.",
      observationQuestion: "What does the Shepherd do for His sheep in these verses?",
      reflectionQuestion: "Where do you need to follow the Shepherd into peace rather than force peace for yourself?",
      prayer: "Lord, restore my soul and lead me in the path of Your care.",
      gentleAction: "Pray slowly through one phrase from Psalm 23 and let it answer one anxious thought.",
      studyMethod: "SOAP"
    }),
    "Isaiah 26:3-4": guidedDevotional({
      title: "Perfect peace",
      context: "Isaiah calls God's people to trust the Lord forever because He is the everlasting Rock.",
      body: "Perfect peace is tied to a mind stayed on God because it trusts Him. The foundation is not a technique, mood, or personality type; it is the Lord Himself. Peace grows as attention and trust are re-centered on Him.",
      observationQuestion: "What connection does Isaiah make between mind, trust, peace, and the Lord?",
      reflectionQuestion: "What thought needs to be stayed on God rather than carried alone?",
      prayer: "Lord, keep my mind fixed on You and teach me to trust You as my Rock.",
      gentleAction: "When your mind circles today, repeat, 'The Lord is my everlasting Rock.'",
      studyMethod: "Word study"
    }),
    "Matthew 6:25-34": guidedDevotional({
      title: "The Father knows",
      context: "In the Sermon on the Mount, Jesus speaks to worry by pointing to the Father's care, creation's witness, and the priority of God's kingdom.",
      body: "Jesus does not mock human need. He names food, drink, clothing, and tomorrow, then brings them under the Father's knowledge and care. Birds and lilies become witnesses that life is not secured by anxious striving. The call is to seek first God's kingdom and receive today's grace for today's trouble.",
      observationQuestion: "What examples does Jesus use to show the Father's care?",
      reflectionQuestion: "What need does your Father already know before you can solve it?",
      prayer: "Father, help me seek Your kingdom today and trust Your care for what I need.",
      gentleAction: "Write one worry for tomorrow, then ask God for faithfulness for today.",
      studyMethod: "COMA"
    }),
    "John 14:25-27": guidedDevotional({
      title: "Peace Jesus gives",
      context: "Jesus speaks to His disciples before the cross, promising the Spirit and giving peace in the middle of coming trouble.",
      body: "Jesus gives peace to disciples who are about to face confusion and loss. His peace is tied to His word and the Spirit's help. It is not dependent on outward calm; it rests on the presence and promise of Christ.",
      observationQuestion: "What does Jesus promise, and how is His peace different from the world's peace?",
      reflectionQuestion: "What trouble needs to be brought beneath Jesus' words, 'My peace I give to you'?",
      prayer: "Jesus, give me Your peace and keep my heart from fear.",
      gentleAction: "Pause once today and ask the Holy Spirit to remind you of Jesus' words.",
      studyMethod: "OIA"
    }),
    "Philippians 4:4-9": guidedDevotional({
      title: "Peace that guards",
      context: "Paul writes from hardship and teaches joy, gentleness, prayer, thanksgiving, disciplined thought, and faithful practice.",
      body: "God's peace guards the heart and mind in Christ, and the God of peace is with His people as they walk in what they have received. Peace is not detached from prayer or practice; it is received as worries are brought to God and minds are trained toward what is true and worthy.",
      observationQuestion: "What commands does Paul give before and after describing God's peace?",
      reflectionQuestion: "What request, thought, or practice needs to be brought under God's peace today?",
      prayer: "God of peace, guard me and guide me in what is true and pleasing to You.",
      gentleAction: "Bring one request to God with thanksgiving, then choose one true thing to dwell on.",
      studyMethod: "SOAP"
    }),
    "Colossians 3:12-17": guidedDevotional({
      title: "Peace ruling together",
      context: "Paul describes the life of God's chosen people as they put on compassion, forgiveness, love, peace, gratitude, and the word of Christ.",
      body: "Colossians shows that peace is not merely private calm. It rules among people who forgive, love, give thanks, and let Christ's word dwell richly. The peace of Christ shapes relationships, words, worship, and ordinary community life.",
      observationQuestion: "What virtues and practices surround the command to let Christ's peace rule?",
      reflectionQuestion: "Where does Christ's peace need to govern your words or relationships today?",
      prayer: "Christ, let Your peace rule in me and make me thankful.",
      gentleAction: "Choose one word or action today that lets peace, gratitude, or forgiveness lead.",
      studyMethod: "Inductive"
    })
  },
  "anxiety-peace": {
    "Psalm 23:1-4": devotional(
      "The Shepherd's care",
      "Psalm 23 meets anxiety with the Shepherd's presence. The Lord leads, restores, and walks with His people through dark valleys. The comfort is not that every valley disappears, but that His rod and staff are there with you.",
      "What valley feels less lonely when you remember the Shepherd is with you?",
      "Lord, Shepherd me today and comfort me with Your presence."
    ),
    "Psalm 46:1-7": psalm46RefugeDevotional,
    "Isaiah 26:3-4": devotional(
      "Peace held by trust",
      "Isaiah's perfect peace is not detached from trust. The mind stayed on God rests on the Lord as the everlasting Rock. Anxiety may pull attention in many directions; this passage calls attention back to Him.",
      "What anxious thought needs to be redirected toward the Lord's steady character?",
      "Lord, keep me in Your peace as I trust in You."
    ),
    "Matthew 6:25-34": devotional(
      "Do not borrow tomorrow",
      "Jesus calls His disciples away from anxious striving by reminding them of the Father's care. Today's trouble is enough for today, and today's obedience is to seek first the kingdom. Anxiety is answered by trust-filled attention to the Father.",
      "What tomorrow are you trying to live before it arrives?",
      "Father, give me grace for today and teach me to seek Your kingdom first."
    ),
    "Matthew 11:28-30": devotional(
      "Come to Me",
      "Jesus does not tell the weary to hide their weariness. He invites them to Himself. His yoke teaches a different way to carry life: not self-saving pressure, but humble learning from the gentle Savior.",
      "What burden needs to be carried with Jesus instead of apart from Him?",
      "Jesus, I come to You. Teach me Your rest."
    ),
    "John 14:25-27": devotional(
      "Peace from Jesus",
      "Jesus gives peace when His disciples have reason to be troubled. His peace is grounded in His ongoing care and the Spirit's work, not in easy circumstances. The command not to fear rests on the gift He gives.",
      "Where do you need to receive Jesus' peace rather than try to create calm by control?",
      "Lord Jesus, let Your peace quiet my troubled heart."
    ),
    "Philippians 4:4-9": devotional(
      "Peace that guards",
      "Philippians 4 gives anxiety a path toward God: rejoice, pray, ask, give thanks, and dwell on what is true. God's peace guards in Christ, and His presence meets His people as they practice what they have received.",
      "What request can become prayer instead of circling worry?",
      "God of peace, guard my heart and mind in Christ."
    ),
    "1 Peter 5:6-11": devotional(
      "Cast your cares",
      "Peter's call to cast anxieties on God is rooted in God's care. The passage also names spiritual alertness and suffering, so peace is not denial. It is humble trust in the God who restores and strengthens His people.",
      "Which care can you name before God and entrust to Him today?",
      "God of all grace, take my cares and strengthen me in Christ."
    )
  },
  "fourteen-days-grief-comfort": {
    "Psalm 13:1-6": devotional(
      "Lament with trust",
      "Psalm 13 gives grief honest words: 'How long?' David does not rush past sorrow, yet he turns toward God's steadfast love. Biblical lament brings pain into relationship with God and waits for His salvation.",
      "What honest sorrow can you bring to God without pretending it is small?",
      "Lord, receive my lament and help me trust Your steadfast love."
    ),
    "Psalm 23:1-6": devotional(
      "Comfort from the Shepherd",
      "Psalm 23 comforts by showing the Lord's personal care through rest, restoration, guidance, protection, provision, and mercy. Even in the valley, the Shepherd is present. Grief is not walked alone.",
      "Where do you need the Shepherd's presence in grief today?",
      "Lord, restore my soul and walk with me through every valley."
    ),
    "Psalm 34:17-22": devotional(
      "Near the brokenhearted",
      "Psalm 34 does not say the righteous avoid affliction. It says the Lord hears, is near to the brokenhearted, and saves the crushed in spirit. Comfort begins with God's nearness to real pain.",
      "Where do you need to believe that the Lord is near, not distant?",
      "Lord, be near to me in brokenness and save me with Your mercy."
    ),
    "Psalm 42:5-11": devotional(
      "Hope in God",
      "Psalm 42 speaks to a downcast soul rather than shaming it. The Psalmist remembers God, names turmoil, and calls the soul to hope again. Grief may keep speaking, but faith also learns to speak back.",
      "What does your downcast soul need to remember about God today?",
      "Lord, help me hope in You while my soul is still unsettled."
    ),
    "Psalm 46:1-7": psalm46RefugeDevotional,
    "Psalm 73:23-28": devotional(
      "God is my portion",
      "Psalm 73 moves from confusion to nearness. The Psalmist discovers that even when heart and flesh fail, God is the strength of the heart and portion forever. Comfort rests in having God Himself, not in having every question resolved.",
      "What loss or confusion needs the promise that God is your portion?",
      "Lord, hold me by Your hand and be the strength of my heart."
    ),
    "Isaiah 40:27-31": devotional(
      "Strength renewed",
      "Isaiah speaks to weary people who wonder if their way is hidden from the Lord. God does not grow faint, and He gives power to the weary. Waiting on Him is not empty delay; it is dependence on the everlasting God.",
      "Where are you weary enough to need strength that only God can give?",
      "Everlasting God, renew my strength as I wait for You."
    ),
    "Isaiah 43:1-7": devotional(
      "Called by name",
      "Isaiah 43 comforts with belonging: 'I have called you by name; you are Mine.' Waters and fire are named, but God's presence is promised through them. The Lord's redeeming love is stronger than the threatening flood.",
      "What water or fire do you need to face with the words, 'You are Mine'?",
      "Redeeming Lord, help me trust Your presence and love in the deep waters."
    ),
    "Lamentations 3:19-26": devotional(
      "Mercies each morning",
      "Lamentations does not hide affliction; hope appears in the middle of remembered bitterness. The turning point is God's steadfast love, mercy, and faithfulness. Waiting quietly for the Lord is possible because His compassion is not exhausted.",
      "What sorrow needs to be held together with the truth that His mercies are new?",
      "Faithful God, meet me with mercy today and teach me to wait for You."
    ),
    "Matthew 5:1-12": devotional(
      "Blessed are those who mourn",
      "Jesus does not call mourners blessed because grief feels good, but because the kingdom of heaven belongs to those who receive God's comfort. Mourning is not outside His blessing. In Christ, sorrow is seen by God and held in hope.",
      "Where do you need Jesus' promise of comfort for mourners?",
      "Lord Jesus, meet my mourning with the comfort of Your kingdom."
    ),
    "John 11:32-44": devotional(
      "Jesus wept",
      "At Lazarus' tomb, Jesus reveals both compassion and authority. He weeps with those who weep, and He calls the dead man out. Christian comfort does not choose between tears and resurrection hope; Jesus brings both together.",
      "What grief needs the compassion of Jesus and the hope of His resurrection power?",
      "Lord Jesus, meet me in grief, strengthen my hope, and keep me near the resurrection life that is in You."
    ),
    "Romans 8:18-25": devotional(
      "Future glory",
      "Paul places present suffering inside the larger hope of coming glory. Creation groans, believers groan, and yet hope waits for redemption. Comfort does not deny pain; it gives pain a horizon because God will complete His work.",
      "What present suffering needs to be held in the hope of future glory?",
      "Lord, help me wait with hope for the redemption You have promised."
    ),
    "2 Corinthians 1:3-7": devotional(
      "God of all comfort",
      "Paul praises the Father of mercies and God of all comfort, who comforts us in affliction so that comfort can overflow to others. Suffering is not good in itself, but God's mercy is active in it and can make us instruments of His comfort.",
      "Where have you received comfort that may one day help you comfort another?",
      "Father of mercies, comfort me and make me gentle with others in pain."
    ),
    "Revelation 21:1-5": devotional(
      "Every tear wiped away",
      "Revelation 21 gives grief its final horizon: God dwelling with His people, wiping every tear, and making all things new. This promise does not trivialize today's sorrow; it assures you that sorrow will not have the last word.",
      "What tear needs to be held before the God who will make all things new?",
      "Lord, keep my hope fixed on the day when You wipe every tear away."
    )
  },
  "grief-comfort": {
    "Psalm 13:1-6": devotional(
      "Lament with trust",
      "Psalm 13 gives grief honest words: 'How long?' David does not rush past sorrow, yet he turns toward God's steadfast love. Biblical lament brings pain into relationship with God and waits for His salvation.",
      "What honest sorrow can you bring to God without pretending it is small?",
      "Lord, receive my lament and help me trust Your steadfast love."
    ),
    "Psalm 34:17-22": devotional(
      "Near the brokenhearted",
      "Psalm 34 does not say the righteous avoid affliction. It says the Lord hears, is near to the brokenhearted, and saves the crushed in spirit. Comfort begins with God's nearness to real pain.",
      "Where do you need to believe that the Lord is near, not distant?",
      "Lord, be near to me in brokenness and save me with Your mercy."
    ),
    "Psalm 42:5-11": devotional(
      "Hope in God",
      "Psalm 42 speaks to a downcast soul rather than shaming it. The Psalmist remembers God, names turmoil, and calls the soul to hope again. Grief may keep speaking, but faith also learns to speak back.",
      "What does your downcast soul need to remember about God today?",
      "Lord, help me hope in You while my soul is still unsettled."
    ),
    "Isaiah 40:27-31": devotional(
      "Strength renewed",
      "Isaiah speaks to weary people who wonder if their way is hidden from the Lord. God does not grow faint, and He gives power to the weary. Waiting on Him is not empty delay; it is dependence on the everlasting God.",
      "Where are you weary enough to need strength that only God can give?",
      "Everlasting God, renew my strength as I wait for You."
    ),
    "John 11:32-44": devotional(
      "Jesus wept",
      "At Lazarus' tomb, Jesus reveals both compassion and authority. He weeps with those who weep, and He calls the dead man out. Christian comfort does not choose between tears and resurrection hope; Jesus brings both together.",
      "What grief needs the compassion of Jesus and the hope of His resurrection power?",
      "Lord Jesus, meet me in grief, strengthen my hope, and keep me near the resurrection life that is in You."
    ),
    "2 Corinthians 1:3-7": devotional(
      "God of all comfort",
      "Paul praises the Father of mercies and God of all comfort, who comforts us in affliction so that comfort can overflow to others. Suffering is not good in itself, but God's mercy is active in it and can make us instruments of His comfort.",
      "Where have you received comfort that may one day help you comfort another?",
      "Father of mercies, comfort me and make me gentle with others in pain."
    ),
    "Revelation 21:1-5": devotional(
      "Every tear wiped away",
      "Revelation 21 gives grief its final horizon: God dwelling with His people, wiping every tear, and making all things new. This promise does not trivialize today's sorrow; it assures you that sorrow will not have the last word.",
      "What tear needs to be held before the God who will make all things new?",
      "Lord, keep my hope fixed on the day when You wipe every tear away."
    )
  }
};

function withCuratedDevotionals(plan: BibleReadingPlan): BibleReadingPlan {
  const curatedDevotionals = curatedDevotionalsByPlan[plan.id] || {};
  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      ...(day.devotional ? {} : curatedDevotionals[day.reference] || {})
    }))
  };
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
  {
    ...planFromReferences("seven-days-prayer", "7 Days of Prayer", "A one-week path for learning prayer as relationship, trust, worship, lament, confession, and dependence.", [
      ["Matthew 6:5-13", "Matthew", 6, "Pray to your Father", guidedDevotional({
        title: "Pray before the Father who sees",
        context: "Jesus is teaching His disciples in the Sermon on the Mount. He contrasts prayer performed for attention with prayer offered to the Father.",
        body: "The Lord's Prayer begins with God: His name, kingdom, and will. Only then does it teach us to ask for bread, forgiveness, and deliverance. Prayer is not religious performance; it is dependent children coming to the Father who sees.",
        observationQuestion: "What comes first in Jesus' pattern of prayer?",
        reflectionQuestion: "Where might prayer become simpler and more Father-centered for you?",
        prayer: "Father, teach me to pray for Your name, Your kingdom, Your will, and today's needed grace.",
        gentleAction: "Pray the Lord's Prayer slowly once, pausing after each line.",
        studyMethod: "SOAP"
      })],
      ["Luke 11:1-13", "Luke", 11, "Ask the generous Father", guidedDevotional({
        title: "Ask, seek, and knock",
        context: "After Jesus prays, His disciples ask Him to teach them. He answers with a pattern and a picture of the Father's generosity.",
        body: "Jesus encourages persistence, not because God is reluctant, but because the Father is good. Prayer grows as trust grows. The greatest gift named here is the Holy Spirit, so our asking is held within God's wise and generous care.",
        observationQuestion: "What reasons does Jesus give for continuing to ask?",
        reflectionQuestion: "Where do you need to trust the Father's goodness rather than suspect His heart?",
        prayer: "Father, teach me to ask, seek, and knock with trust in Your generous care.",
        gentleAction: "Name one need honestly before God, then thank Him for hearing.",
        studyMethod: "OIA"
      })],
      ["Psalm 23:1-6", "Psalms", 23, "Pray from trust", guidedDevotional({
        title: "Let trust become prayer",
        context: "David describes the Lord as Shepherd. The Psalm moves through rest, guidance, danger, provision, mercy, and dwelling with God.",
        body: "Psalm 23 gives prayer words when you need to be led. The Shepherd restores and protects His people, even in the valley. You can pray from need without panic because the Lord's care is personal and present.",
        observationQuestion: "What actions does the Shepherd take in this Psalm?",
        reflectionQuestion: "Which line gives words to your prayer today?",
        prayer: "Lord, my Shepherd, lead me, restore me, and keep me near You.",
        gentleAction: "Choose one phrase from Psalm 23 and carry it into the next hour.",
        studyMethod: "Lectio Divina"
      })],
      ["Psalm 46:1-11", "Psalms", 46, "Be still before God", guidedDevotional({
        title: "Be still before the God who reigns",
        context: "Psalm 46 names trouble, shaking, conflict, and noise, but repeats that God is refuge and present with His people.",
        body: "The command to be still is not denial or passivity. It is a summons to stop striving as if everything rests on you and to know that the Lord is exalted. Prayer can become worship when pressure is brought before the God who reigns.",
        observationQuestion: "What trouble is named, and what is repeated about God?",
        reflectionQuestion: "Where are you carrying pressure as though God is absent or unable to help?",
        prayer: "Lord Almighty, quiet my striving and help me know that You are present, faithful, and exalted.",
        gentleAction: "Sit quietly for one minute and repeat, 'The Lord is with us.'",
        studyMethod: "COMA"
      })],
      ["Philippians 4:4-7", "Philippians", 4, "Pray with thanksgiving", guidedDevotional({
        title: "Bring requests with thanksgiving",
        context: "Paul writes from hardship and calls the church to rejoice, gentleness, prayer, thanksgiving, and peace in Christ.",
        body: "Thanksgiving does not pretend needs are small. It remembers God's faithfulness while bringing real requests to Him. The promised peace is God's guard over the heart and mind in Christ, not a reward for perfect calm.",
        observationQuestion: "What does Paul tell believers to do with their requests?",
        reflectionQuestion: "What anxious request can you bring to God with thanksgiving?",
        prayer: "Lord, receive my requests and guard my heart and mind in Christ Jesus.",
        gentleAction: "Write one request and one reason for thanksgiving beside it.",
        studyMethod: "SOAP"
      })],
      ["James 5:13-18", "James", 5, "Pray in every season", guidedDevotional({
        title: "Prayer for the whole life",
        context: "James closes his letter by placing prayer in suffering, cheerfulness, sickness, confession, restoration, and ordinary human weakness.",
        body: "Prayer is not reserved for one mood. James invites God's people to pray when suffering, sing when cheerful, confess when needed, and ask for help together. Faithful prayer trusts God without trying to control Him.",
        observationQuestion: "How many different situations for prayer does James mention?",
        reflectionQuestion: "What season are you in, and what kind of prayer does James invite?",
        prayer: "Lord, teach me to turn to You in suffering, joy, weakness, confession, and hope.",
        gentleAction: "Pray one sentence that honestly names your present season.",
        studyMethod: "OIA"
      })],
      ["1 John 5:13-15", "1 John", 5, "Ask according to His will", guidedDevotional({
        title: "Confidence under God's will",
        context: "John writes so believers may know they have eternal life in the Son. Confidence in prayer rests inside that assurance.",
        body: "John does not promise that every request will be granted on our terms. He teaches confidence that God hears His children as they ask according to His will. Prayer is bold and humble at the same time.",
        observationQuestion: "What kind of confidence does John describe?",
        reflectionQuestion: "What request needs to be brought under God's will with trust?",
        prayer: "Father, help me ask with confidence, humility, and trust in Your will.",
        gentleAction: "End today's prayer with, 'Your will be done.'",
        studyMethod: "Inductive"
      })]
    ], "Prayer"),
    purpose: "To help prayer become honest, Scripture-shaped dependence on God rather than performance or pressure.",
    bestFor: "Anyone wanting a focused week of prayer, worship, confession, thanksgiving, lament, and trust.",
    estimatedTime: "7-12 minutes"
  },
  withCuratedDevotionals(planFromReferences("seven-days-peace", "7 Days of Peace", "A short plan for anxiety, rest, and the peace of God.", [
    ["Psalm 4:6-8", "Psalms", 4, "Sleep in peace"],
    ["Psalm 23:1-4", "Psalms", 23, "The Shepherd's care"],
    ["Isaiah 26:3-4", "Isaiah", 26, "Perfect peace"],
    ["Matthew 6:25-34", "Matthew", 6, "Do not worry"],
    ["John 14:25-27", "John", 14, "My peace I give"],
    ["Philippians 4:4-9", "Philippians", 4, "Peace that guards"],
    ["Colossians 3:12-17", "Colossians", 3, "Let peace rule"]
  ], "Care")),
  planFromReferences("identity-in-christ", "Identity in Christ", "Seven readings to help you remember who you are because of Christ.", [
    ["John 1:9-13", "John", 1, "Received as God's children", guidedDevotional({
      title: "Received before you perform",
      context: "John introduces Jesus as the true Light who came into the world. Not everyone received Him, but those who did were given the right to become children of God.",
      body: "This passage begins identity with reception, not achievement. Belonging to God is not something you climb toward by religious effort; it is a gift given through Christ. Before productivity, approval, failure, or family history speaks over you, Scripture says that those who receive the Son are born of God.",
      observationQuestion: "What does John say is given to those who receive Christ and believe in His name?",
      reflectionQuestion: "What false measure of identity does this passage gently correct for you?",
      prayer: "Father, help me receive the gift of belonging to You through Christ.",
      gentleAction: "Write one sentence beginning, 'Because of Christ, I am received by God...'",
      studyMethod: "OIA"
    })],
    ["Romans 8:1-4", "Romans", 8, "No condemnation", guidedDevotional({
      title: "No condemnation in Christ",
      context: "Paul has just described the struggle with sin and now announces what God has done through Christ and the Spirit.",
      body: "The Christian life does not begin under a cloud of accusation. There is now no condemnation for those who are in Christ Jesus because God has acted through His Son where the law could not rescue us. This is not denial of sin; it is confidence that Christ has dealt with sin so that life can now be walked by the Spirit.",
      observationQuestion: "What has God done through His Son that the law could not do?",
      reflectionQuestion: "Where do you most need to hear 'no condemnation' today?",
      prayer: "Lord Jesus, teach me to stand in Your mercy rather than my shame.",
      gentleAction: "When accusation rises today, pause and answer it with Romans 8:1.",
      studyMethod: "SOAP"
    })],
    ["2 Corinthians 5:17-21", "2 Corinthians", 5, "New creation", guidedDevotional({
      title: "Made new for reconciliation",
      context: "Paul describes the ministry of reconciliation that flows from Christ's death and resurrection.",
      body: "In Christ, new creation is not merely a private feeling. God reconciles us to Himself and then gives us a ministry of reconciliation. Your identity is both received and sent: loved by God, made new by grace, and invited to become a witness of that grace in ordinary relationships.",
      observationQuestion: "What does Paul say God has done for us in Christ, and what has He entrusted to us?",
      reflectionQuestion: "What would it look like to live today as someone reconciled to God?",
      prayer: "God of mercy, make Your reconciling grace visible in me.",
      gentleAction: "Choose one ordinary relationship where you can practice peace, honesty, or forgiveness today.",
      studyMethod: "COMA"
    })],
    ["Galatians 3:26-29", "Galatians", 3, "Clothed with Christ", guidedDevotional({
      title: "Clothed with Christ",
      context: "Paul is explaining how faith in Christ makes believers children of God and joins them together as heirs of the promise.",
      body: "Believers have been clothed with Christ. Before the world sees your gifts, background, weakness, status, or mistakes, God sees you in His Son. Unity in Christ does not erase your story, but it gives you a deeper identity than every human label.",
      observationQuestion: "What identity words does Paul use for those who belong to Christ?",
      reflectionQuestion: "Which lesser label has been louder than your identity in Christ?",
      prayer: "Lord, let Christ be the truest thing about how I see myself and others.",
      gentleAction: "Name one label you need to hold under the greater truth that you belong to Christ.",
      studyMethod: "Word study"
    })],
    ["Ephesians 1:3-10", "Ephesians", 1, "Blessed and chosen", guidedDevotional({
      title: "Blessed in Christ",
      context: "Paul opens Ephesians with a long blessing that traces salvation to God's grace, purpose, and work in Christ.",
      body: "Ephesians lifts your eyes from self-definition to God's gracious purpose. In Christ, believers are blessed, chosen, adopted, redeemed, and forgiven. These words are not decorations; they are anchors. Your identity is grounded in God's will, God's grace, and God's plan to bring all things together in Christ.",
      observationQuestion: "List the blessings Paul says believers have in Christ.",
      reflectionQuestion: "Which word in this passage gives your heart the strongest anchor today?",
      prayer: "Father, help me rest in the grace You have lavished in Christ.",
      gentleAction: "Choose one identity word from the passage and carry it through the day.",
      studyMethod: "Inductive"
    })],
    ["Colossians 3:1-4", "Colossians", 3, "Hidden with Christ", guidedDevotional({
      title: "Hidden with Christ",
      context: "Paul calls believers who have been raised with Christ to seek the things above and set their minds where Christ is.",
      body: "Being hidden with Christ is not escape from ordinary life. Because believers have been raised with Christ, they learn to seek what belongs to Him and set their minds where He reigns. Your life is hidden with Christ in God, so earthly pressures no longer get the final word. Hiddenness means safety, new direction, and future hope when Christ appears in glory.",
      observationQuestion: "What does Paul say believers should seek and set their minds on?",
      reflectionQuestion: "What earthly concern needs to be re-ordered by seeking Christ and setting your mind on things above?",
      prayer: "Christ, keep my mind set on You and my life anchored in You.",
      gentleAction: "When one earthly pressure feels loud today, deliberately name Christ's rule over it.",
      studyMethod: "Meditation"
    })],
    ["1 Peter 2:9-10", "1 Peter", 2, "A chosen people", guidedDevotional({
      title: "Chosen to declare His praise",
      context: "Peter writes to believers who are scattered and pressured, reminding them who they are together in God's mercy.",
      body: "Peter gives identity in plural form: a chosen people, a royal priesthood, a holy nation, God's own possession. You are not saved into isolation. You belong to God and to His people, so that your life can declare the mercy that brought you out of darkness into light.",
      observationQuestion: "What names does Peter give God's people, and what purpose does he attach to them?",
      reflectionQuestion: "How can your life quietly declare God's mercy today?",
      prayer: "Lord, thank You for making me Yours. Let my life point to Your light.",
      gentleAction: "Tell God one specific mercy He has shown you and look for one quiet way to reflect it.",
      studyMethod: "SOAP"
    })]
  ], "Identity"),
  planFromReferences("abiding-in-christ", "Abiding in Christ", "A gentle week of readings about remaining with Jesus and bearing fruit from Him.", [
    ["John 15:1-8", "John", 15, "Remain in Me", guidedDevotional({
      title: "Fruit from closeness",
      context: "On the night before the cross, Jesus teaches His disciples that He is the true vine and they are branches.",
      body: "Jesus does not call His disciples to produce fruit by anxious striving. He calls them to remain in Him. Branches bear fruit because they stay connected to the vine. Begin with dependence: receive His word, stay near, and let obedience grow from communion rather than pressure.",
      observationQuestion: "What does Jesus say branches can and cannot do apart from the vine?",
      reflectionQuestion: "Where are you tempted to produce fruit without remaining close to Christ?",
      prayer: "Jesus, teach me to remain in You and receive life from You.",
      gentleAction: "Before one task today, pray, 'Apart from You I can do nothing.'",
      studyMethod: "OIA"
    })],
    ["Psalm 1:1-3", "Psalms", 1, "Planted by streams", guidedDevotional({
      title: "Planted where life flows",
      context: "Psalm 1 contrasts two paths and describes the blessed person as one who delights in the Lord's instruction.",
      body: "Psalm 1 describes a life rooted in God's instruction like a tree planted by streams of water. This is not hurried spirituality. It is a settled life, nourished over time. Abiding often looks ordinary: returning to Scripture, refusing the wrong path, and staying where God gives life.",
      observationQuestion: "What does the blessed person avoid, and what do they delight in?",
      reflectionQuestion: "What stream of God's word do you need to stay near today?",
      prayer: "Lord, plant me deeply in Your word and make my life fruitful in season.",
      gentleAction: "Read the passage slowly once more and underline one phrase to meditate on.",
      studyMethod: "Meditation"
    })],
    ["Psalm 27:4-8", "Psalms", 27, "Dwell with the Lord", guidedDevotional({
      title: "One thing",
      context: "David speaks from desire and need, longing to dwell with the Lord, behold His beauty, and seek Him.",
      body: "David's desire is beautifully focused: to dwell in the house of the Lord and seek Him. Abiding is not adding more spiritual noise; it is learning to seek one necessary thing. In pressure or distraction, God invites you to turn your face toward Him again.",
      observationQuestion: "What is the 'one thing' David asks of the Lord?",
      reflectionQuestion: "What would it mean to seek the Lord as your 'one thing' today?",
      prayer: "Lord, when You say, 'Seek My face,' help my heart answer, 'Your face I will seek.'",
      gentleAction: "Take one ordinary pause today and turn it into a moment of seeking the Lord.",
      studyMethod: "SOAP"
    })],
    ["Matthew 11:25-30", "Matthew", 11, "Come to Me", guidedDevotional({
      title: "Rest for your soul",
      context: "Jesus reveals the Father and then invites the weary and burdened to come to Him.",
      body: "Jesus' invitation is personal and gentle: come to Me. He does not ignore weariness; He names it and offers rest. Abiding in Christ includes bringing your burdens honestly to Him and learning His way. His yoke is not the crushing weight of self-salvation, but the restful obedience of walking with Him.",
      observationQuestion: "Who does Jesus invite, and what does He promise to give?",
      reflectionQuestion: "What burden do you need to bring to Jesus rather than carry alone?",
      prayer: "Gentle and humble Savior, give rest to my soul as I come to You.",
      gentleAction: "Name one burden in prayer before you try to solve it.",
      studyMethod: "COMA"
    })],
    ["Luke 10:38-42", "Luke", 10, "Sit at Jesus' feet", guidedDevotional({
      title: "The necessary thing",
      context: "Jesus visits the home of Martha and Mary. Martha serves anxiously while Mary sits at Jesus' feet listening to His word.",
      body: "Martha's service mattered, but her worry crowded out attentiveness to Jesus. Mary shows a posture of receiving before doing. This passage does not shame faithful work; it reorders it. Abiding means letting Jesus have your attention before your activity takes over.",
      observationQuestion: "What is Martha troubled by, and what does Jesus commend in Mary?",
      reflectionQuestion: "What good activity might be crowding out attention to Jesus?",
      prayer: "Lord Jesus, quiet my distracted heart and help me choose what is necessary.",
      gentleAction: "Before checking a task list, spend two quiet minutes receiving from Jesus' words.",
      studyMethod: "OIA"
    })],
    ["Colossians 2:6-7", "Colossians", 2, "Rooted and built up", guidedDevotional({
      title: "Continue as you received",
      context: "Paul urges believers who received Christ to continue walking in Him, rooted and built up in faith.",
      body: "The Christian life grows by the same grace that began it. You are rooted, built up, strengthened, and overflowing with thankfulness as you keep walking in Him. Abiding is steady continuation, not constant reinvention.",
      observationQuestion: "What images does Paul use to describe continuing in Christ?",
      reflectionQuestion: "Where do you need to continue in simple trust rather than start over in anxiety?",
      prayer: "Christ, root me more deeply in You and grow thanksgiving in me.",
      gentleAction: "Write one thing you are thankful for as evidence of God's steady work.",
      studyMethod: "Word study"
    })],
    ["1 John 2:24-28", "1 John", 2, "Abide in Him", guidedDevotional({
      title: "Let the word remain",
      context: "John calls believers to let what they heard from the beginning remain in them so they remain in the Son and the Father.",
      body: "Staying close to Christ is not vague spirituality; it is holding fast to the truth about the Son and the Father. As His word remains in you, you are invited to remain in Him with confidence. Abiding is personal, but it is also anchored in the truth God has spoken.",
      observationQuestion: "What does John say should remain in believers?",
      reflectionQuestion: "What truth about Christ do you need to let remain in you today?",
      prayer: "Father, keep me in the truth of Your Son and teach me to abide with confidence.",
      gentleAction: "Choose one phrase from the passage and repeat it when your attention drifts.",
      studyMethod: "Inductive"
    })]
  ], "Abiding"),
  {
    ...planFromReferences("seven-days-new-believers", "7 Days for New Believers", "A friendly first week for understanding Jesus, grace, faith, prayer, new life, the Spirit, and following Christ with His people.", [
      ["John 1:1-14", "John", 1, "Who Jesus is and why He came", guidedDevotional({
        title: "The Word became flesh",
        context: "John opens his Gospel by showing that Jesus is not merely a teacher. He is the eternal Word who became flesh and made God known.",
        body: "Christian faith begins with Jesus Himself. He is the light who enters darkness and the Son who reveals the Father. New life is not built on vague spirituality, but on receiving the One who came full of grace and truth.",
        observationQuestion: "What does John say about who Jesus is and what He came to reveal?",
        reflectionQuestion: "What part of this description of Jesus do you most need to receive today?",
        prayer: "Lord Jesus, help me see You truly and receive Your grace and truth.",
        gentleAction: "Read verse 14 aloud and thank God that Jesus came near.",
        studyMethod: "OIA"
      })],
      ["1 Corinthians 15:1-8", "1 Corinthians", 15, "The cross and resurrection", guidedDevotional({
        title: "The gospel of first importance",
        context: "Paul reminds the Corinthians of the gospel he preached: Christ died for sins, was buried, was raised, and appeared to witnesses.",
        body: "The cross and resurrection are not advanced topics for later; they are the foundation. Jesus' death deals with sin, and His resurrection announces living hope. Faith rests on what Christ has done, not on your ability to earn God's acceptance.",
        observationQuestion: "What events does Paul call central to the gospel?",
        reflectionQuestion: "How does Christ's finished work steady you more than religious performance?",
        prayer: "Lord Jesus, thank You for dying for sins and rising again. Ground my faith in Your finished work.",
        gentleAction: "Summarize the gospel from this passage in one sentence.",
        studyMethod: "SOAP"
      })],
      ["Ephesians 2:1-10", "Ephesians", 2, "Saved by grace through faith", guidedDevotional({
        title: "Grace, not earning",
        context: "Paul contrasts spiritual death with God's mercy and explains that salvation is by grace through faith, not by works.",
        body: "This passage protects new believers from both pride and despair. Salvation is God's gift, received by faith, not a wage earned by performance. Good works matter, but they flow from grace; they are not the basis of being saved.",
        observationQuestion: "What does Paul say salvation is, and what does he say it is not?",
        reflectionQuestion: "Where do you need to stop trying to earn what God gives by grace?",
        prayer: "God of mercy, help me rest in Your grace and walk in the good works You prepare.",
        gentleAction: "Write the phrase 'by grace through faith' somewhere you will see it today.",
        studyMethod: "Inductive"
      })],
      ["Romans 8:1-4", "Romans", 8, "New life and assurance in Christ", guidedDevotional({
        title: "No condemnation",
        context: "After describing the struggle with sin, Paul announces the assurance believers have in Christ and the Spirit's new way of life.",
        body: "New life begins under the word 'no condemnation.' This does not make sin unimportant; it means Christ has answered condemnation so the Spirit can lead believers into life. Assurance looks to Christ before it looks at your progress.",
        observationQuestion: "What has God done through His Son that the law could not do?",
        reflectionQuestion: "What accusation needs to hear 'no condemnation' today?",
        prayer: "Father, help me stand in Christ's mercy and walk by the Spirit.",
        gentleAction: "Pause when shame rises today and answer it with Romans 8:1.",
        studyMethod: "SOAP"
      })],
      ["Matthew 6:5-13", "Matthew", 6, "Prayer and relationship with God", guidedDevotional({
        title: "Pray to your Father",
        context: "Jesus teaches disciples to pray simply before the Father, not as a public display of spirituality.",
        body: "Prayer is relationship before it is technique. Jesus teaches you to come to the Father with worship, dependence, confession, and trust. You do not need impressive words to begin; you need the Father who hears.",
        observationQuestion: "What needs does Jesus teach His disciples to bring to the Father?",
        reflectionQuestion: "Which line of the Lord's Prayer helps you begin praying today?",
        prayer: "Father, teach me to pray with honesty, dependence, and trust.",
        gentleAction: "Pray the Lord's Prayer slowly in your own words.",
        studyMethod: "Lectio Divina"
      })],
      ["Galatians 5:16-25", "Galatians", 5, "Life through the Holy Spirit", guidedDevotional({
        title: "Walk by the Spirit",
        context: "Paul contrasts the works of the flesh with the fruit of the Spirit as he teaches believers how freedom in Christ becomes a changed life.",
        body: "The Christian life is not self-improvement by sheer willpower. Believers are called to walk by the Spirit. The fruit listed here grows from God's work in us, shaping love, joy, peace, patience, and holiness over time.",
        observationQuestion: "What fruit does Paul say the Spirit produces?",
        reflectionQuestion: "Which fruit of the Spirit do you want to ask God to grow in you?",
        prayer: "Holy Spirit, lead me today and grow Your fruit in my life.",
        gentleAction: "Choose one fruit of the Spirit and ask God for one small practice of it today.",
        studyMethod: "OIA"
      })],
      ["Acts 2:42-47", "Acts", 2, "Following Jesus with His people", guidedDevotional({
        title: "A shared life of faith",
        context: "After Pentecost, Luke describes the early believers' ordinary pattern of teaching, fellowship, breaking bread, prayer, generosity, and worship.",
        body: "Jesus saves people into a family, not isolation. The church is not the basis of salvation, but it is one of God's gifts for growth, care, teaching, prayer, and shared witness. Following Jesus becomes a shared life of grace.",
        observationQuestion: "What practices shaped the first believers' life together?",
        reflectionQuestion: "What small step could help you follow Jesus with His people?",
        prayer: "Lord, place me wisely among Your people and help me grow in grace with them.",
        gentleAction: "Consider one trusted church, pastor, or mature Christian you could connect with this week.",
        studyMethod: "COMA"
      })]
    ], "Beginner"),
    purpose: "To introduce the heart of Christian faith without implying that salvation is earned by religious performance.",
    bestFor: "New believers, returning Christians, or anyone wanting a clear first-week overview.",
    estimatedTime: "7-12 minutes"
  },
  withCuratedDevotionals(planFromReferences("ten-days-psalms", "10 Days in the Psalms", "Ten Psalms for worship, honesty, trust, and hope.", [
    ["Psalm 1", "Psalms", 1],
    ["Psalm 8", "Psalms", 8],
    ["Psalm 19", "Psalms", 19],
    ["Psalm 23", "Psalms", 23],
    ["Psalm 27", "Psalms", 27],
    ["Psalm 42", "Psalms", 42],
    ["Psalm 46", "Psalms", 46, "Be still before God", psalm46StillBeforeGodDevotional],
    ["Psalm 51", "Psalms", 51],
    ["Psalm 91", "Psalms", 91],
    ["Psalm 103", "Psalms", 103]
  ], "Prayer")),
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
  withCuratedDevotionals(planFromReferences("fourteen-days-faith", "14 Days on Faith", "Readings about trust, endurance, grace, and living by faith.", [
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
  ], "Gospel")),
  withCuratedDevotionals(planFromReferences("fourteen-days-wisdom", "14 Days on Wisdom", "Two weeks of readings for wise choices, words, and priorities.", [
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
  ], "Wisdom")),
  withPastoralCareNote(withCuratedDevotionals(planFromReferences("fourteen-days-grief-comfort", "14 Days on Grief and Comfort", "Gentle readings for sorrow, hope, and God's nearness.", [
    ["Psalm 13:1-6", "Psalms", 13, "How long, O Lord"],
    ["Psalm 23:1-6", "Psalms", 23, "The Shepherd's comfort"],
    ["Psalm 34:17-22", "Psalms", 34, "Near the brokenhearted"],
    ["Psalm 42:5-11", "Psalms", 42, "Hope in God"],
    ["Psalm 46:1-7", "Psalms", 46, "God is refuge", psalm46RefugeDevotional],
    ["Psalm 73:23-28", "Psalms", 73, "God is my portion"],
    ["Isaiah 40:27-31", "Isaiah", 40, "Strength renewed"],
    ["Isaiah 43:1-7", "Isaiah", 43, "I have called you by name"],
    ["Lamentations 3:19-26", "Lamentations", 3, "Mercies each morning"],
    ["Matthew 5:1-12", "Matthew", 5, "Blessed are those who mourn"],
    ["John 11:32-44", "John", 11, "Jesus wept"],
    ["Romans 8:18-25", "Romans", 8, "Future glory"],
    ["2 Corinthians 1:3-7", "2 Corinthians", 1, "God of all comfort"],
    ["Revelation 21:1-5", "Revelation", 21, "Every tear wiped away"]
  ], "Care"))),
  withPastoralCareNote(withCuratedDevotionals(planFromReferences("fourteen-days-anxiety-trust", "14 Days on Anxiety and Trust", "A two-week path for worry, fear, peace, and dependence on God.", [
    ["Psalm 23:1-4", "Psalms", 23, "The Shepherd is near"],
    ["Psalm 27:1-5", "Psalms", 27, "The Lord is my light"],
    ["Psalm 46:1-11", "Psalms", 46, "Be still", psalm46StillBeforeGodDevotional],
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
  ], "Care"))),
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
  withCuratedDevotionals(planFromReferences("romans-road", "Romans Road", "A short path through Romans for sin, grace, faith, and new life.", [
    ["Romans 1", "Romans", 1],
    ["Romans 3", "Romans", 3],
    ["Romans 5", "Romans", 5],
    ["Romans 6", "Romans", 6],
    ["Romans 8", "Romans", 8],
    ["Romans 10", "Romans", 10],
    ["Romans 12", "Romans", 12]
  ], "Gospel")),
  withCuratedDevotionals(planFromReferences("prayer-dependence", "Prayer and Dependence", "Readings that invite trust, prayer, and daily dependence on God.", [
    ["Matthew 6:9-13", "Matthew", 6, "The Lord's Prayer"],
    ["Luke 11:5-13", "Luke", 11, "Ask, seek, knock"],
    ["Psalm 23:1-6", "Psalms", 23, "The Lord provides"],
    ["Psalm 46:1-11", "Psalms", 46, "God is refuge"],
    ["Philippians 4:4-7", "Philippians", 4, "Pray with thanksgiving"],
    ["James 1:5-8", "James", 1, "Ask for wisdom"],
    ["1 Peter 5:6-11", "1 Peter", 5, "Cast your cares"]
  ], "Prayer")),
  {
    ...planFromReferences("anxiety-peace", "Anxiety and Peace", "Gentle Scripture readings for worry, fear, trust, and the peace Christ gives.", [
      ["Psalm 23:1-4", "Psalms", 23, "The Shepherd's care", guidedDevotional({
        title: "The Shepherd is with you",
        context: "David speaks of the Lord as Shepherd, including both restful places and the valley of deep darkness.",
        body: "Psalm 23 does not shame fearful sheep. It gives them a Shepherd. The comfort is not that every valley disappears immediately, but that the Lord is present, leading, restoring, and guarding His people as they walk.",
        observationQuestion: "What does the Shepherd do for His sheep in these verses?",
        reflectionQuestion: "Where do you need to remember that the Lord is with you, not far away?",
        prayer: "Lord, Shepherd me today. Restore my soul and comfort me with Your presence.",
        gentleAction: "Take one slow breath and repeat, 'You are with me.'",
        studyMethod: "Lectio Divina",
        careNote: carePlanPastoralNote
      })],
      ["Psalm 46:1-7", "Psalms", 46, "God is refuge", guidedDevotional({
        title: "Refuge when things shake",
        context: "The Psalm names instability in creation and nations, then anchors hope in God's presence with His people.",
        body: "This passage does not ask you to pretend life is quiet. It teaches that God is refuge and strength in trouble. Peace here is not denial; it is being held by the God who is present when circumstances feel loud.",
        observationQuestion: "What shaking does the Psalm describe, and what does it say about God?",
        reflectionQuestion: "What feels loud today, and what is truer about God than that noise?",
        prayer: "God, be my refuge and strength today. Help me trust Your presence in trouble.",
        gentleAction: "Name one trouble to God without trying to solve it immediately.",
        studyMethod: "COMA",
        careNote: carePlanPastoralNote
      })],
      ["Isaiah 26:3-4", "Isaiah", 26, "Peace held by trust", guidedDevotional({
        title: "A mind stayed on the Lord",
        context: "Isaiah calls God's people to trust the Lord as the everlasting Rock.",
        body: "Perfect peace is connected to trust in God, not to perfect control over circumstances. This is not positive thinking. It is steady attention to the Lord's character when anxious thoughts pull in many directions.",
        observationQuestion: "What reason does Isaiah give for trusting the Lord?",
        reflectionQuestion: "What thought needs to be re-anchored in the everlasting Rock?",
        prayer: "Lord, keep my mind stayed on You and teach me to trust You.",
        gentleAction: "Write one true thing about God beside one anxious thought.",
        studyMethod: "SOAP",
        careNote: carePlanPastoralNote
      })],
      ["Matthew 6:25-34", "Matthew", 6, "Today's grace", guidedDevotional({
        title: "The Father knows",
        context: "Jesus teaches His disciples about worry, the Father's care, and seeking God's kingdom.",
        body: "Jesus does not mock anxious people. He points them to the Father's care and calls them away from trying to live tomorrow before it arrives. Today's trouble is met with today's grace, not with guilt for feeling concern.",
        observationQuestion: "What examples does Jesus use to show the Father's care?",
        reflectionQuestion: "What tomorrow are you trying to carry today?",
        prayer: "Father, give me grace for today and teach me to seek Your kingdom first.",
        gentleAction: "Choose one small faithful action for today, leaving tomorrow with God.",
        studyMethod: "OIA",
        careNote: carePlanPastoralNote
      })],
      ["Matthew 11:28-30", "Matthew", 11, "Rest with Jesus", guidedDevotional({
        title: "Come to Me",
        context: "Jesus invites the weary and burdened to come to Him, learn from Him, and receive rest.",
        body: "Jesus does not tell the weary to hide their weariness. He invites them to Himself. His rest is not self-rescue; it is learning His gentle way while carrying life with Him rather than alone.",
        observationQuestion: "What does Jesus invite weary people to do?",
        reflectionQuestion: "What burden do you need to bring honestly to Jesus?",
        prayer: "Gentle Savior, I come to You. Teach me Your rest.",
        gentleAction: "Open your hands for a moment as a sign of bringing your burden to Christ.",
        studyMethod: "Lectio Divina",
        careNote: carePlanPastoralNote
      })],
      ["John 14:25-27", "John", 14, "Peace from Jesus", guidedDevotional({
        title: "Peace unlike the world",
        context: "Jesus prepares His disciples for His departure and promises the Spirit's help and His own peace.",
        body: "Jesus gives peace to troubled disciples before every hard thing is removed. His peace is tied to His word, His presence, and the Spirit's work. It is not a guarantee of easy circumstances, but a gift from the faithful Lord.",
        observationQuestion: "What does Jesus promise, and what does He command?",
        reflectionQuestion: "Where do you need peace that is grounded in Christ rather than circumstances?",
        prayer: "Lord Jesus, give me Your peace and keep my heart from being ruled by fear.",
        gentleAction: "Read verse 27 slowly twice, placing emphasis on 'My peace.'",
        studyMethod: "SOAP",
        careNote: carePlanPastoralNote
      })],
      ["Philippians 4:4-9", "Philippians", 4, "Peace that guards", guidedDevotional({
        title: "Requests brought to God",
        context: "Paul writes to believers about rejoicing, gentleness, prayer, thanksgiving, thought, practice, and God's peace.",
        body: "Paul does not say anxious feelings prove weak faith. He gives anxiety somewhere to go: to God in prayer with thanksgiving. God's peace guards hearts and minds in Christ while believers keep practicing what is true and good.",
        observationQuestion: "What actions does Paul place around anxiety and peace?",
        reflectionQuestion: "What request can become prayer instead of circling worry?",
        prayer: "God of peace, guard my heart and mind in Christ Jesus.",
        gentleAction: "Turn one worry into a short written prayer.",
        studyMethod: "Inductive",
        careNote: carePlanPastoralNote
      })],
      ["1 Peter 5:6-11", "1 Peter", 5, "Cast your cares", guidedDevotional({
        title: "He cares for you",
        context: "Peter writes to suffering believers, calling them to humility, watchfulness, and hope in the God of all grace.",
        body: "Casting anxieties on God is not denial. It is humble trust because He cares for you. Peter also names suffering and alertness, so this passage holds tenderness and strength together without promising instant relief.",
        observationQuestion: "Why does Peter say believers can cast anxieties on God?",
        reflectionQuestion: "Which care can you name before God and entrust to Him today?",
        prayer: "God of all grace, receive my cares and strengthen me in Christ.",
        gentleAction: "Tell one trusted person if anxiety feels persistent, severe, or unsafe.",
        studyMethod: "COMA",
        careNote: carePlanPastoralNote
      })]
    ], "Care"),
    purpose: "To help anxious hearts bring worry, fear, and pressure to the faithful God who is present with His people.",
    bestFor: "A gentle focused week for readers seeking Scripture-shaped peace without pressure or simplistic answers.",
    estimatedTime: "7-12 minutes",
    careNote: carePlanPastoralNote
  },
  withCuratedDevotionals(planFromReferences("wisdom-decisions", "Wisdom for Decisions", "Readings for wisdom, discernment, and faithful choices.", [
    ["Proverbs 1:1-7", "Proverbs", 1, "Begin with the fear of the Lord"],
    ["Proverbs 2:1-11", "Proverbs", 2, "Search for wisdom"],
    ["Proverbs 3:5-12", "Proverbs", 3, "Trust the Lord"],
    ["Proverbs 16:1-9", "Proverbs", 16, "Commit your way"],
    ["James 1:5-8", "James", 1, "Ask God for wisdom"],
    ["Colossians 3:12-17", "Colossians", 3, "Wisdom in community"],
    ["Psalm 25:4-10", "Psalms", 25, "Teach me Your paths"]
  ], "Wisdom")),
  {
    ...planFromReferences("grief-comfort", "Grief and Comfort", "Gentle passages for lament, comfort, patient hope, and God's nearness in sorrow.", [
      ["Psalm 13:1-6", "Psalms", 13, "Bring sorrow to God", guidedDevotional({
        title: "How long, O Lord?",
        context: "Psalm 13 is a lament. David brings unanswered pain to God and still turns toward steadfast love.",
        body: "This Psalm gives grief permission to speak honestly. Faith does not have to rush past 'How long?' The movement toward trust is real, but it does not erase the ache. Biblical lament brings sorrow into relationship with God.",
        observationQuestion: "What honest questions does David bring to God?",
        reflectionQuestion: "What sorrow can you bring to God without pretending it is small?",
        prayer: "Lord, receive my lament and help me trust Your steadfast love in Your time.",
        gentleAction: "Write one honest sentence of lament to God.",
        studyMethod: "SOAP",
        careNote: carePlanPastoralNote
      })],
      ["Psalm 34:17-22", "Psalms", 34, "Near the brokenhearted", guidedDevotional({
        title: "The Lord is near",
        context: "Psalm 34 speaks of affliction, brokenheartedness, and the Lord's nearness and rescue.",
        body: "The Psalm does not say God's people avoid affliction. It says the Lord hears and is near to the brokenhearted. Comfort begins with God's presence in real pain, not with a demand that pain disappear quickly.",
        observationQuestion: "What does the Lord do for the brokenhearted and afflicted?",
        reflectionQuestion: "Where do you need to believe that the Lord is near, not distant?",
        prayer: "Lord, be near to me in brokenness and save me with Your mercy.",
        gentleAction: "Read verse 18 slowly and let it name God's nearness.",
        studyMethod: "Lectio Divina",
        careNote: carePlanPastoralNote
      })],
      ["Psalm 42:5-11", "Psalms", 42, "Hope in God", guidedDevotional({
        title: "Speak hope to the downcast soul",
        context: "Psalm 42 speaks to a soul that is downcast and in turmoil while remembering God.",
        body: "The Psalmist does not scold sadness away. He speaks to his soul and calls it toward hope while turmoil remains. Grief may keep speaking, and faith may need to answer again and again with remembrance of God.",
        observationQuestion: "What words or images show the Psalmist's inner turmoil?",
        reflectionQuestion: "What does your downcast soul need to remember about God today?",
        prayer: "Lord, help me hope in You while my soul is still unsettled.",
        gentleAction: "Choose one truth about God to repeat when grief feels loud.",
        studyMethod: "OIA",
        careNote: carePlanPastoralNote
      })],
      ["Isaiah 40:27-31", "Isaiah", 40, "Strength renewed", guidedDevotional({
        title: "The weary are not forgotten",
        context: "Isaiah speaks to weary people who wonder if their way is hidden from the Lord.",
        body: "God does not shame His weary people. He reminds them that He is everlasting, wise, and generous with strength. Waiting on the Lord is not a timetable for grief; it is dependence on the God whose compassion does not run out.",
        observationQuestion: "What does Isaiah say about God's strength and understanding?",
        reflectionQuestion: "Where are you weary enough to need strength only God can give?",
        prayer: "Everlasting God, renew my strength as I wait for You.",
        gentleAction: "Rest from one unnecessary demand today if you are able.",
        studyMethod: "COMA",
        careNote: carePlanPastoralNote
      })],
      ["John 11:32-44", "John", 11, "Jesus wept", guidedDevotional({
        title: "Tears and resurrection hope",
        context: "Jesus comes to Lazarus' tomb. He meets Mary and Martha in grief before raising Lazarus.",
        body: "Jesus' tears matter. He does not stand outside grief with cold answers; He enters the sorrow of those He loves. At the same time, He is the resurrection and the life. Christian comfort holds tears and hope together without forcing one to cancel the other.",
        observationQuestion: "How does Jesus respond before He calls Lazarus from the tomb?",
        reflectionQuestion: "What grief needs both the compassion of Jesus and the hope of His life?",
        prayer: "Lord Jesus, meet me in grief and keep me near the resurrection life that is in You.",
        gentleAction: "If helpful, tell a trusted person one specific way grief is affecting you today.",
        studyMethod: "Inductive",
        careNote: carePlanPastoralNote
      })],
      ["2 Corinthians 1:3-7", "2 Corinthians", 1, "God of all comfort", guidedDevotional({
        title: "Comfort received and shared",
        context: "Paul blesses the Father of mercies, who comforts His people in affliction and makes them able to comfort others.",
        body: "Suffering is not good in itself, and Paul does not pretend it is. Yet God's mercy is active in affliction. Comfort received from Him can one day become gentle comfort offered to someone else, without minimizing their pain.",
        observationQuestion: "What names does Paul use for God in this passage?",
        reflectionQuestion: "Where do you need to receive comfort before trying to explain anything?",
        prayer: "Father of mercies, comfort me and make me gentle with others in pain.",
        gentleAction: "Receive care today before trying to be strong for everyone else.",
        studyMethod: "SOAP",
        careNote: carePlanPastoralNote
      })],
      ["Revelation 21:1-5", "Revelation", 21, "Every tear wiped away", guidedDevotional({
        title: "The final comfort",
        context: "John sees the new heaven and new earth, where God dwells with His people and makes all things new.",
        body: "Revelation does not trivialize present grief. It gives grief a final horizon: God Himself will wipe away every tear. Present comfort is real, but final restoration is still ahead. Sorrow will not have the last word.",
        observationQuestion: "What does God promise will be gone in the new creation?",
        reflectionQuestion: "What tear needs to be held before the God who will make all things new?",
        prayer: "Lord, keep my hope fixed on the day when You wipe every tear away.",
        gentleAction: "Let today's hope be small and honest: name one thing God will make new.",
        studyMethod: "Lectio Divina",
        careNote: carePlanPastoralNote
      })]
    ], "Care"),
    purpose: "To give sorrow a faithful place to speak, lament, receive comfort, and wait for the God who will make all things new.",
    bestFor: "Readers grieving loss, carrying sadness, or needing gentle Scripture without rushed emotional resolution.",
    estimatedTime: "7-12 minutes",
    careNote: carePlanPastoralNote
  },
  withCuratedDevotionals(planFromReferences("beginner-bible", "Beginner Bible Reading Plan", "A friendly first path through major Bible themes and stories.", [
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
  ], "Beginner")),
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
