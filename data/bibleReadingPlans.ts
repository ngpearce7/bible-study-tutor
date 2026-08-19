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

const lifeOfJesusDevotionals: Record<string, BibleReadingPlanDayExtras> = {
  "Luke 2": guidedDevotional({
    title: "The Savior is born",
    context: "Luke places Jesus' birth in ordinary history: a census, Bethlehem, a manger, and shepherds keeping watch.",
    body: "The promised Savior comes with deep humility. Heaven announces Him as Savior, Christ, and Lord, yet the sign is a baby lying in a manger. This passage invites you to see God's glory in the humility of Christ and to receive the good news with worship rather than mere sentiment.",
    observationQuestion: "What titles are given to Jesus, and what sign are the shepherds told to look for?",
    reflectionQuestion: "Where do you need to receive Christ's humble nearness as good news today?",
    prayer: "Lord Jesus, help me worship You as Savior, Christ, and Lord, and receive Your humble nearness with joy.",
    gentleAction: "Write down one title for Jesus from the passage and carry it into prayer today.",
    studyMethod: "OIA"
  }),
  "Matthew 3": guidedDevotional({
    title: "The beloved Son",
    context: "Jesus comes to John at the Jordan, where people are confessing sin and being baptized.",
    body: "Jesus has no sin to confess, yet He stands with His people in the waters. The Father delights in Him, and the Spirit rests upon Him. Before Jesus' public ministry unfolds, the passage shows who He is: the beloved Son who fulfills righteousness and acts in the pleasure of the Father.",
    observationQuestion: "What does Jesus say about His baptism, and what does the Father say about Him?",
    reflectionQuestion: "How does the Father's delight in the Son steady your view of Jesus' mission?",
    prayer: "Father, help me behold Your beloved Son with reverence, trust, and joy.",
    gentleAction: "Pause over the words 'My beloved Son' and let them shape your worship.",
    studyMethod: "SOAP"
  }),
  "Matthew 4": guidedDevotional({
    title: "Faithful in temptation",
    context: "After His baptism, Jesus is led by the Spirit into the wilderness and tempted by the devil.",
    body: "Jesus answers temptation with Scripture and faithful dependence on the Father. Where Israel failed in the wilderness, the Son remains obedient. He refuses to use His identity for self-protection, spectacle, or false worship. His victory teaches you to trust God's Word when pressure tries to bend your desires.",
    observationQuestion: "What does each temptation offer, and how does Jesus answer it?",
    reflectionQuestion: "Where do you need Scripture to reorder desire, fear, or ambition?",
    prayer: "Lord Jesus, train me to trust Your Word and resist every path that leads away from the Father.",
    gentleAction: "Choose one sentence from Jesus' replies and pray it before a likely temptation today.",
    studyMethod: "COMA"
  }),
  "Matthew 5": guidedDevotional({
    title: "Kingdom life",
    context: "Matthew 5 begins the Sermon on the Mount, where Jesus teaches His disciples the character of kingdom life.",
    body: "Jesus does not describe a shallow spirituality. He blesses the poor in spirit, the meek, the merciful, and the persecuted, then calls His people to visible righteousness from the heart. The passage presses beyond appearance and into a life formed by the King Himself.",
    observationQuestion: "What kind of people does Jesus call blessed, and what kind of righteousness does He describe?",
    reflectionQuestion: "Which part of Jesus' kingdom teaching exposes an area that needs His formation?",
    prayer: "King Jesus, form Your character in me and make my life a faithful witness to Your kingdom.",
    gentleAction: "Pick one beatitude and ask how it could shape one interaction today.",
    studyMethod: "Inductive"
  }),
  "Mark 2": guidedDevotional({
    title: "Authority and mercy",
    context: "Mark gathers scenes where Jesus forgives, heals, calls Levi, eats with sinners, and teaches about Sabbath mercy.",
    body: "Jesus' authority is not cold power; it is mercy that restores. He forgives sins, calls the unlikely, and challenges religious hardness. The chapter asks you to see Him as the Son of Man with authority to forgive and as the Physician who comes for the sick.",
    observationQuestion: "How do people respond to Jesus' authority and mercy in this chapter?",
    reflectionQuestion: "Where do you need to come to Jesus honestly as one who needs mercy?",
    prayer: "Lord Jesus, forgive, heal, and reorder my heart by Your merciful authority.",
    gentleAction: "Name one place where you need mercy rather than image-management.",
    studyMethod: "OIA"
  }),
  "Luke 15": guidedDevotional({
    title: "The Father's joy",
    context: "Jesus tells these parables in response to grumbling that He welcomes sinners and eats with them.",
    body: "The lost sheep, lost coin, and lost son reveal the joy of God in restoring the lost. Jesus does not minimize sin, but He magnifies grace. The elder brother's resentment warns against hearts that resent mercy while standing close to the house.",
    observationQuestion: "What is lost, what is found, and what joy follows in each parable?",
    reflectionQuestion: "Do you most need to return, rejoice, or repent of resentment today?",
    prayer: "Father, bring me home to Your mercy and teach me to rejoice when others receive it too.",
    gentleAction: "Pray by name for someone who needs to know the Father's welcome.",
    studyMethod: "COMA"
  }),
  "John 6": guidedDevotional({
    title: "The bread of life",
    context: "After feeding the crowd, Jesus teaches that the sign points beyond bread to Himself.",
    body: "Jesus does not merely provide bread; He is the Bread of Life. The crowd wants another sign and another meal, but Jesus calls them to come to Him and believe. The passage turns appetite into invitation: lasting life is found in Christ Himself.",
    observationQuestion: "How does Jesus move the crowd from physical bread to Himself?",
    reflectionQuestion: "Where are you seeking gifts from Jesus while needing to come to Jesus Himself?",
    prayer: "Lord Jesus, satisfy me with Yourself and teach me to seek the life that only You give.",
    gentleAction: "Before one meal today, thank Christ as the giver and sustainer of true life.",
    studyMethod: "Word study"
  }),
  "John 10": guidedDevotional({
    title: "The Good Shepherd",
    context: "Jesus uses shepherd imagery to describe His relationship to His sheep and His coming death.",
    body: "The Good Shepherd knows His sheep, calls them by name, protects them, and lays down His life for them. This is not vague comfort; it is costly care. Jesus' sheep are safe because their Shepherd gives Himself for them and holds them in His hand.",
    observationQuestion: "What does Jesus say the Good Shepherd does for His sheep?",
    reflectionQuestion: "Which promise of the Shepherd do you most need to trust today?",
    prayer: "Good Shepherd, help me hear Your voice, trust Your care, and rest in Your keeping.",
    gentleAction: "Repeat one shepherd promise from the passage when you feel scattered today.",
    studyMethod: "Meditation"
  }),
  "John 11": guidedDevotional({
    title: "Resurrection and life",
    context: "Lazarus has died, and Jesus meets Martha and Mary in grief before going to the tomb.",
    body: "Jesus reveals Himself as the resurrection and the life while also weeping with those who grieve. His tears show real compassion; His command at the tomb shows real authority. Hope in this passage is not an idea but a Person standing before death.",
    observationQuestion: "What does Jesus say about Himself, and how does He respond to grief?",
    reflectionQuestion: "Where do you need to trust both the compassion and authority of Jesus?",
    prayer: "Lord Jesus, be my resurrection hope and meet me with Your compassion and power.",
    gentleAction: "Bring one grief or fear of loss honestly to Christ in prayer.",
    studyMethod: "SOAP"
  }),
  "John 13": guidedDevotional({
    title: "Servant love",
    context: "During the last supper, Jesus washes His disciples' feet before teaching them to love one another.",
    body: "Jesus knows His hour has come, yet He stoops to serve. The Lord and Teacher takes the servant's place, showing love that cleanses and humbles. His command to love one another is grounded in His own costly, lowly love.",
    observationQuestion: "What does Jesus know, what does He do, and what command does He give?",
    reflectionQuestion: "Where is Jesus' servant love calling you away from pride or self-protection?",
    prayer: "Lord Jesus, wash my pride and teach me to love others from the love You have shown me.",
    gentleAction: "Choose one quiet act of service that reflects Christ's humility.",
    studyMethod: "OIA"
  }),
  "John 17": guidedDevotional({
    title: "Jesus prays for His people",
    context: "Before the cross, Jesus prays to the Father for His disciples and for those who will believe through their word.",
    body: "Jesus prays for glory, eternal life, protection, sanctification, unity, and love. His people are not left to themselves; they are carried in the prayer of the Son to the Father. The passage lets you listen to the heart of Christ for those who belong to Him.",
    observationQuestion: "What does Jesus ask the Father to do for His people?",
    reflectionQuestion: "Which part of Jesus' prayer gives you courage or correction today?",
    prayer: "Lord Jesus, sanctify me in Your truth and keep me in the love of the Father.",
    gentleAction: "Pray one request from John 17 for yourself and one other believer.",
    studyMethod: "COMA"
  }),
  "Matthew 26": guidedDevotional({
    title: "Obedience in sorrow",
    context: "Matthew 26 moves through betrayal, Passover, Gethsemane, arrest, and denial.",
    body: "In Gethsemane, Jesus is deeply sorrowful and yet wholly submitted to the Father. His obedience is not detached or easy; it is costly faithfulness under the weight of the coming cross. The passage invites reverent attention to the Savior who says, 'Your will be done.'",
    observationQuestion: "What sorrow, weakness, betrayal, and obedience appear in this chapter?",
    reflectionQuestion: "How does Jesus' costly obedience reshape the way you pray in hardship?",
    prayer: "Lord Jesus, thank You for obeying the Father for us. Teach me trust when obedience is costly.",
    gentleAction: "Pray 'Your will be done' over one area you are tempted to control.",
    studyMethod: "Meditation"
  }),
  "John 19": guidedDevotional({
    title: "It is finished",
    context: "John records Jesus' trial, crucifixion, death, and burial with repeated attention to Scripture being fulfilled.",
    body: "Jesus is mocked as king, lifted up on the cross, and yet remains sovereign in His suffering. His words 'It is finished' announce completion, not defeat. The Lamb gives Himself fully, fulfilling Scripture and accomplishing the work the Father gave Him to do.",
    observationQuestion: "What details show both Jesus' suffering and the fulfillment of Scripture?",
    reflectionQuestion: "What changes when you receive the cross as finished work rather than unfinished striving?",
    prayer: "Lord Jesus, thank You that Your saving work is finished. Help me rest in Your cross with grateful faith.",
    gentleAction: "Write 'It is finished' beside one burden of guilt or striving.",
    studyMethod: "SOAP"
  }),
  "John 20": guidedDevotional({
    title: "The risen Lord",
    context: "John 20 moves from the empty tomb to Jesus appearing to Mary, the disciples, and Thomas.",
    body: "The resurrection turns grief into witness, fear into peace, and doubt into confession. Jesus is not merely remembered; He is risen and present with His people. Thomas' confession, 'My Lord and my God,' gives the fitting response to the risen Christ.",
    observationQuestion: "How do Mary, the disciples, and Thomas respond as they encounter the risen Jesus?",
    reflectionQuestion: "Where do you need the risen Lord to turn fear, grief, or doubt into faith?",
    prayer: "Risen Lord Jesus, give me peace, strengthen my faith, and send me as Your witness.",
    gentleAction: "Confess slowly: 'My Lord and my God,' and let that shape your day.",
    studyMethod: "Inductive"
  })
};

const holyWeekDevotionals: Record<string, BibleReadingPlanDayExtras> = {
  "Matthew 21": guidedDevotional({
    title: "The King comes humbly",
    context: "Jesus enters Jerusalem as crowds shout Hosanna, then He enters the temple and confronts fruitless religion.",
    body: "Holy Week begins with Jesus openly receiving royal praise, but His kingship is humble, prophetic, and searching. He comes not as a ruler who flatters religious appearances, but as the promised King who exposes what is barren and calls His people to true worship.",
    observationQuestion: "What do the crowds say about Jesus, and what does Jesus confront after entering Jerusalem?",
    reflectionQuestion: "Where might you welcome Jesus publicly while resisting His searching authority privately?",
    prayer: "King Jesus, receive my worship and make my life fruitful before You.",
    gentleAction: "Pray 'Hosanna' slowly and ask where Christ's rule needs to be welcomed today.",
    studyMethod: "COMA"
  }),
  "Matthew 22": guidedDevotional({
    title: "Love God and neighbor",
    context: "Religious leaders test Jesus with questions, and He answers with wisdom about kingdom invitation, allegiance, resurrection, and the greatest commandment.",
    body: "Jesus is not trapped by hostile questions. He reveals the heart of faithful life: love the Lord with all your heart, soul, and mind, and love your neighbor as yourself. In the shadow of the cross, Jesus shows that true obedience is ordered by love.",
    observationQuestion: "What questions are brought to Jesus, and how does He redirect attention to God?",
    reflectionQuestion: "Where does love for God or neighbor need to become more than an idea today?",
    prayer: "Lord Jesus, order my loves around God and teach me to love my neighbor faithfully.",
    gentleAction: "Choose one concrete act that reflects love for God or neighbor today.",
    studyMethod: "OIA"
  }),
  "Matthew 26": lifeOfJesusDevotionals["Matthew 26"],
  "John 13": lifeOfJesusDevotionals["John 13"],
  "John 17": lifeOfJesusDevotionals["John 17"],
  "John 19": lifeOfJesusDevotionals["John 19"],
  "John 20": lifeOfJesusDevotionals["John 20"]
};

const adventDevotionals: Record<string, BibleReadingPlanDayExtras> = {
  "Genesis 3": guidedDevotional({
    title: "Promise in the fall",
    context: "Human rebellion brings shame, judgment, and exile, yet God speaks a promise of defeat for the serpent.",
    body: "Advent begins where the need for rescue begins. The promise of the woman's offspring does not erase the seriousness of sin, but it plants hope inside judgment. The coming of Christ answers a problem deeper than disappointment: humanity needs a Redeemer.",
    observationQuestion: "What is broken by sin, and what promise does God speak?",
    reflectionQuestion: "How does the first promise of rescue deepen your view of why Christ came?",
    prayer: "Lord God, thank You for promising rescue when humanity could not rescue itself.",
    gentleAction: "Name one place where you need redemption rather than self-repair.",
    studyMethod: "Biblical theology"
  }),
  "Genesis 12": guidedDevotional({
    title: "Blessing for the nations",
    context: "God calls Abram and promises land, descendants, blessing, and blessing for all families of the earth.",
    body: "The hope of Christ is not narrow or accidental. God promises blessing through Abraham that will reach the nations. Advent remembers that Jesus comes as the promised seed through whom God's blessing spreads beyond one family to people from every people and place.",
    observationQuestion: "What does God promise Abram, and who will be blessed through him?",
    reflectionQuestion: "How does God's promise to bless the nations enlarge your worship of Christ?",
    prayer: "God of promise, thank You that Your blessing in Christ reaches the nations.",
    gentleAction: "Pray for one nation, people group, or community to know Christ's blessing.",
    studyMethod: "COMA"
  }),
  "Isaiah 7": guidedDevotional({
    title: "God with us",
    context: "In a time of political fear, Isaiah gives the sign of Immanuel: God with us.",
    body: "Isaiah 7 speaks into fear and unbelief. The sign of Immanuel becomes part of the long hope that God will be with His people in a decisive way. Advent is not simply comfort in the abstract; it is the wonder that God draws near in Christ.",
    observationQuestion: "What fear surrounds the passage, and what sign is given?",
    reflectionQuestion: "Where do you need the promise of God with us to confront fear or unbelief?",
    prayer: "Immanuel, steady my heart with the truth that God has drawn near in Christ.",
    gentleAction: "Write 'God with us' beside one concern you are carrying.",
    studyMethod: "OIA"
  }),
  "Isaiah 9": guidedDevotional({
    title: "A child who reigns",
    context: "Isaiah promises light for people in darkness and a child whose government and peace will not end.",
    body: "The promised child is more than a symbol of hope. He bears royal names and brings righteous peace. Advent holds together tenderness and majesty: a child is born, a Son is given, and the government rests on His shoulders.",
    observationQuestion: "What darkness is answered, and what names are given to the promised child?",
    reflectionQuestion: "Which name of the promised King do you most need to trust today?",
    prayer: "Wonderful Counselor, Mighty God, Everlasting Father, Prince of Peace, reign in my heart today.",
    gentleAction: "Pray through one title from Isaiah 9 as worship.",
    studyMethod: "Word study"
  }),
  "Isaiah 11": guidedDevotional({
    title: "The righteous Branch",
    context: "Isaiah looks for a shoot from Jesse's line, filled with the Spirit and ruling with righteousness.",
    body: "The Messiah brings wisdom, justice, and peace that reaches beyond what human rulers can produce. Isaiah's vision is not mere moral improvement; it is creation renewed under the righteous reign of the Lord's anointed King.",
    observationQuestion: "What does the Spirit give the coming King, and what kind of reign follows?",
    reflectionQuestion: "Where do you long for Christ's righteous peace to make things new?",
    prayer: "Righteous King, rule with wisdom and peace, and teach me to hope in Your renewal.",
    gentleAction: "Pray for one place where righteousness and peace are desperately needed.",
    studyMethod: "Inductive"
  }),
  "Micah 5": guidedDevotional({
    title: "Ruler from Bethlehem",
    context: "Micah promises a ruler from Bethlehem whose origins are ancient and whose greatness reaches to the ends of the earth.",
    body: "God's promised ruler comes from a small place, yet His rule is everlasting and His care is shepherd-like. Advent teaches you to look for God's saving work where the world may not think to look: in humility, promise, and faithful shepherding.",
    observationQuestion: "What does Micah say about the ruler's origin, rule, and shepherding care?",
    reflectionQuestion: "How does Bethlehem's smallness help you recognize God's way of working?",
    prayer: "Lord, teach me to trust Your promised Shepherd-King even when Your ways appear small.",
    gentleAction: "Thank God for one quiet mercy that reveals His faithful care.",
    studyMethod: "SOAP"
  }),
  "Luke 1": guidedDevotional({
    title: "Mercy remembered",
    context: "Luke 1 announces the births of John and Jesus, and Mary praises God for remembering His mercy.",
    body: "The coming of Jesus is not an isolated miracle. It is God's faithfulness to His promises, His mercy to the humble, and His saving help for His people. Mary's song teaches Advent worship to remember God's character and promises.",
    observationQuestion: "What does Mary say God has done, and what kind of people receive His mercy?",
    reflectionQuestion: "Where do you need to remember that God keeps His promises with mercy?",
    prayer: "Lord, magnify Your mercy in my heart and teach me to rejoice in Your faithfulness.",
    gentleAction: "Write one phrase from Mary's song as a sentence of praise.",
    studyMethod: "OIA"
  }),
  "Luke 2": lifeOfJesusDevotionals["Luke 2"],
  "Matthew 1": guidedDevotional({
    title: "Jesus saves His people",
    context: "Matthew traces Jesus' genealogy and records the angel's word to Joseph about Mary's child.",
    body: "Jesus' name declares His mission: He will save His people from their sins. Matthew also names Him Immanuel, God with us. Advent joy is therefore not vague cheer; it is salvation from sin and God's presence with His people in the Son.",
    observationQuestion: "What names or titles are given to Jesus, and what do they reveal?",
    reflectionQuestion: "How does Jesus' mission to save from sin shape your Advent hope?",
    prayer: "Jesus, Savior and Immanuel, forgive my sin and draw me near to God.",
    gentleAction: "Pray with the name Jesus, thanking Him for saving grace.",
    studyMethod: "SOAP"
  }),
  "Matthew 2": guidedDevotional({
    title: "Worship the newborn King",
    context: "Magi seek Jesus, Herod resists Him, and God protects the child through warning and flight.",
    body: "Matthew 2 contrasts worship and opposition. The nations begin to come to the King, while earthly power feels threatened by Him. The chapter reminds you that Christ's coming calls for costly worship and that God's preserving hand is active even amid danger.",
    observationQuestion: "How do the Magi and Herod respond differently to the birth of Jesus?",
    reflectionQuestion: "Where does Christ's kingship call for worship rather than control?",
    prayer: "King Jesus, receive my worship and loosen my grip on control.",
    gentleAction: "Offer one concrete gift of attention, time, or obedience to Christ today.",
    studyMethod: "COMA"
  }),
  "John 1": guidedDevotional({
    title: "The Word became flesh",
    context: "John begins before creation and announces that the eternal Word became flesh and dwelt among us.",
    body: "The child in the manger is the eternal Word through whom all things were made. John holds together glory and nearness: the Word became flesh, full of grace and truth. Advent worship bows before the mystery that God the Son truly came among us.",
    observationQuestion: "What does John say about the Word before describing His becoming flesh?",
    reflectionQuestion: "What does it mean for you today that God's grace and truth have come in Christ?",
    prayer: "Word made flesh, fill my heart with wonder at Your glory, grace, and truth.",
    gentleAction: "Read John 1:14 slowly three times and emphasize a different word each time.",
    studyMethod: "Meditation"
  }),
  "Galatians 4": guidedDevotional({
    title: "Sent in the fullness of time",
    context: "Paul explains that God sent His Son to redeem those under the law so they might receive adoption.",
    body: "Christmas is timed by God's wisdom and aimed at redemption and adoption. The Son is sent so slaves become children and the Spirit teaches them to cry, 'Abba, Father.' Advent hope reaches into identity: in Christ, you are received as God's child.",
    observationQuestion: "Why does Paul say God sent His Son, and what status is given to believers?",
    reflectionQuestion: "Where do you need to live as an adopted child rather than a spiritual orphan?",
    prayer: "Father, thank You for sending Your Son so I may belong to You as Your child.",
    gentleAction: "Pray 'Abba, Father' and name one need honestly before God.",
    studyMethod: "Word study"
  }),
  "Philippians 2": guidedDevotional({
    title: "The humility of Christ",
    context: "Paul calls believers to humility by pointing to Christ's descent, obedience, death, and exaltation.",
    body: "The incarnation reveals not only that Christ came, but how He came: in humility, servanthood, and obedience to death. The Father exalts Him, and every knee will bow. Advent worship should produce humble love, not merely seasonal feeling.",
    observationQuestion: "What movement do you see from Christ's humility to His exaltation?",
    reflectionQuestion: "Where should Christ's humility reshape your attitude toward others?",
    prayer: "Lord Jesus, humble my heart and teach me to love in the pattern of Your self-giving.",
    gentleAction: "Choose one interaction where you can take the lower place in love.",
    studyMethod: "Inductive"
  }),
  "Revelation 22": guidedDevotional({
    title: "Come, Lord Jesus",
    context: "The Bible ends with the river of life, the tree of life, and the promise that Jesus is coming soon.",
    body: "Advent looks back to Christ's first coming and forward to His return. The final prayer, 'Come, Lord Jesus,' gathers longing, hope, and worship. The One who came in humility will come again, and His people will see His face.",
    observationQuestion: "What future hope is described, and what promise does Jesus give?",
    reflectionQuestion: "How does longing for Christ's return shape the way you wait now?",
    prayer: "Come, Lord Jesus. Keep my hope awake until I see Your face.",
    gentleAction: "End today with the prayer, 'Come, Lord Jesus.'",
    studyMethod: "Meditation"
  })
};

const easterDevotionals: Record<string, BibleReadingPlanDayExtras> = {
  "Isaiah 53": guidedDevotional({
    title: "Wounded for our transgressions",
    context: "Isaiah speaks of the suffering Servant who bears sin, is pierced, and yet sees life beyond His suffering.",
    body: "Isaiah 53 prepares you to see the cross as substitution, not tragedy alone. The Servant suffers for His people, bears their iniquity, and brings peace through His wounds. Easter hope begins with the costly mercy of the suffering Servant.",
    observationQuestion: "What does the Servant suffer, and for whom does He suffer?",
    reflectionQuestion: "How does Christ bearing sin change the way you bring guilt or shame to God?",
    prayer: "Lord Jesus, thank You for bearing sin and bringing peace through Your wounds.",
    gentleAction: "Confess one sin honestly and receive the mercy of Christ.",
    studyMethod: "SOAP"
  }),
  "Matthew 28": guidedDevotional({
    title: "He has risen",
    context: "Women come to the tomb, hear the angel's announcement, meet the risen Jesus, and receive a commission.",
    body: "The resurrection is announced with clarity: He is not here; He has risen. Fear gives way to worship and mission. The risen Jesus sends His disciples with authority, presence, and a command to make disciples of all nations.",
    observationQuestion: "What message is given at the tomb, and what command does Jesus give His disciples?",
    reflectionQuestion: "Where should resurrection hope turn fear into worship or witness?",
    prayer: "Risen Lord, fill me with worship and courage to live as Your disciple.",
    gentleAction: "Tell one person or write one sentence about why the resurrection matters.",
    studyMethod: "COMA"
  }),
  "Mark 16": guidedDevotional({
    title: "Alarm and announcement",
    context: "The women come to anoint Jesus and find the stone rolled away and the tomb empty.",
    body: "Mark's resurrection account confronts human fear with divine announcement. The crucified Jesus is risen, and His followers are called to go and tell. The passage does not ask you to manufacture confidence; it asks you to hear the announcement and respond.",
    observationQuestion: "What do the women expect, what do they find, and what message are they given?",
    reflectionQuestion: "What fear needs to be answered by the announcement that Jesus is risen?",
    prayer: "Lord Jesus, meet my fear with the truth of Your resurrection.",
    gentleAction: "Repeat the words 'He has risen' when fear feels louder than faith.",
    studyMethod: "OIA"
  }),
  "Luke 24": guidedDevotional({
    title: "Opened eyes and burning hearts",
    context: "Luke 24 moves from the empty tomb to the Emmaus road and Jesus opening the Scriptures to His disciples.",
    body: "The risen Jesus teaches His followers to understand His death and resurrection from the Scriptures. Their hearts burn as He opens the Word, and their eyes are opened to know Him. Resurrection faith is anchored in Scripture and fellowship with the living Christ.",
    observationQuestion: "How does Jesus explain His suffering and glory to the disciples?",
    reflectionQuestion: "Where do you need Christ to open the Scriptures and renew your hope?",
    prayer: "Risen Lord, open my eyes to know You and my heart to receive Your Word.",
    gentleAction: "Read one paragraph slowly and ask, 'How does this point me to Christ?'",
    studyMethod: "Biblical theology"
  }),
  "John 20": lifeOfJesusDevotionals["John 20"],
  "John 21": guidedDevotional({
    title: "Restored and sent",
    context: "The risen Jesus meets His disciples by the sea, provides breakfast, and restores Peter.",
    body: "Jesus restores Peter not by ignoring his failure, but by drawing love and calling from him again. The risen Lord feeds, forgives, and commissions. Easter grace restores failed disciples into renewed love and faithful service.",
    observationQuestion: "How does Jesus care for the disciples and restore Peter?",
    reflectionQuestion: "Where do you need the risen Jesus to restore love after failure?",
    prayer: "Lord Jesus, restore my love for You and teach me to follow You faithfully.",
    gentleAction: "Answer Jesus' question, 'Do you love Me?' in prayer with honesty.",
    studyMethod: "SOAP"
  }),
  "Acts 2": guidedDevotional({
    title: "The risen Christ proclaimed",
    context: "At Pentecost, Peter proclaims that God raised Jesus and made Him both Lord and Christ.",
    body: "The resurrection becomes public proclamation. Peter announces that the crucified Jesus is risen, exalted, and reigning. The right response is repentance, faith, baptism, and life among God's people under the gift of the Spirit.",
    observationQuestion: "What does Peter say God has done with Jesus?",
    reflectionQuestion: "How should Jesus' resurrection and lordship shape your repentance and witness?",
    prayer: "Lord Jesus, rule over me by Your Spirit and make me bold in faithful witness.",
    gentleAction: "Pray for courage to speak of Christ clearly and humbly.",
    studyMethod: "Inductive"
  }),
  "Acts 4": guidedDevotional({
    title: "No other name",
    context: "Peter and John testify before leaders after healing a man in Jesus' name.",
    body: "The apostles do not present Jesus as one spiritual option among many. The rejected stone has become the cornerstone, and salvation is found in no other name. Resurrection confidence produces humble boldness before opposition.",
    observationQuestion: "What claims are made about Jesus' name and salvation?",
    reflectionQuestion: "Where do you need Spirit-given courage to hold fast to Christ?",
    prayer: "Lord Jesus, keep me faithful to Your name with courage, humility, and love.",
    gentleAction: "Pray Acts 4:12 as a confession of trust in Christ.",
    studyMethod: "COMA"
  }),
  "Romans 6": guidedDevotional({
    title: "Raised to new life",
    context: "Paul explains that believers are united with Christ in His death and resurrection.",
    body: "The resurrection is not only something to believe about Jesus; it is the life believers share in Him. United to Christ, you are no longer to live as a slave to sin. Easter power means walking in newness of life.",
    observationQuestion: "What does Paul say happened to believers with Christ?",
    reflectionQuestion: "What would it look like to walk in newness of life today?",
    prayer: "Lord Jesus, make Your resurrection life visible in my desires, choices, and habits.",
    gentleAction: "Identify one old pattern to resist and one new obedience to practice.",
    studyMethod: "OIA"
  }),
  "Romans 8": guidedDevotional({
    title: "Life in the Spirit",
    context: "Romans 8 describes life in Christ, the Spirit's work, present suffering, future glory, and God's inseparable love.",
    body: "Because of Christ, there is no condemnation for those who are in Him. The Spirit gives life, helps weakness, and anchors hope as believers wait for glory. Resurrection hope does not erase suffering, but it assures you that nothing can separate you from God's love in Christ.",
    observationQuestion: "What does Romans 8 say the Spirit does for those who belong to Christ?",
    reflectionQuestion: "Which promise in this chapter needs to steady your hope today?",
    prayer: "Spirit of God, lead me in life, help me in weakness, and anchor me in Christ's love.",
    gentleAction: "Choose one promise from Romans 8 and keep it visible today.",
    studyMethod: "SOAP"
  }),
  "1 Corinthians 15": guidedDevotional({
    title: "If Christ has been raised",
    context: "Paul defends the resurrection and explains why Christ's resurrection is central to Christian hope.",
    body: "Paul makes the resurrection essential, not optional. If Christ is not raised, faith is empty; but Christ has been raised, the firstfruits of those who sleep. This hope gives courage for steadfast, meaningful labor in the Lord.",
    observationQuestion: "What consequences does Paul name if Christ is not raised, and what hope follows because He is raised?",
    reflectionQuestion: "How does resurrection hope make faithfulness worth it today?",
    prayer: "Risen Christ, make me steadfast and full of hope because Your resurrection is sure.",
    gentleAction: "Do one small act of faithful service as work that is not in vain.",
    studyMethod: "Inductive"
  }),
  "1 Peter 1": guidedDevotional({
    title: "Born again to living hope",
    context: "Peter writes to suffering believers and begins with praise for new birth through Jesus' resurrection.",
    body: "The resurrection gives believers a living hope and an imperishable inheritance. Trials are real, but they are not ultimate. Faith is refined, Christ is loved though unseen, and salvation is guarded by God's power.",
    observationQuestion: "What blessings flow from the resurrection of Jesus in this passage?",
    reflectionQuestion: "Where do you need living hope to steady you in trial or uncertainty?",
    prayer: "Father, strengthen my living hope through the resurrection of Jesus Christ.",
    gentleAction: "Name one hope in Christ that cannot perish, spoil, or fade.",
    studyMethod: "Meditation"
  }),
  "Revelation 1": guidedDevotional({
    title: "The Living One",
    context: "John sees the risen and glorified Christ, who declares that He was dead and is alive forevermore.",
    body: "The risen Jesus is not fragile or distant. He is the Living One, holding authority over death and Hades. Easter hope matures into awe: the crucified and risen Christ reigns in glory and speaks to His churches.",
    observationQuestion: "How is Jesus described in John's vision?",
    reflectionQuestion: "How does seeing Jesus as the Living One reshape fear of death or uncertainty?",
    prayer: "Living Lord Jesus, fill me with reverent trust in Your victory and authority.",
    gentleAction: "Pray Revelation 1:17-18 as worship and courage.",
    studyMethod: "OIA"
  }),
  "Revelation 21": guidedDevotional({
    title: "Every tear wiped away",
    context: "John sees the new heaven and new earth, where God dwells with His people and makes all things new.",
    body: "Resurrection hope ends in renewal. Death, mourning, crying, and pain do not have the final word. The God who raised Jesus will make all things new and dwell with His people forever.",
    observationQuestion: "What former things pass away, and what does God promise to make new?",
    reflectionQuestion: "Which sorrow needs to be held in the light of God's promised renewal?",
    prayer: "God of resurrection hope, keep my heart anchored in the day when You make all things new.",
    gentleAction: "Bring one sorrow to God and answer it with the words, 'I am making all things new.'",
    studyMethod: "Meditation"
  })
};

const curatedDevotionalsByPlan: CuratedDevotionalMap = {
  "fourteen-days-life-of-jesus": lifeOfJesusDevotionals,
  "life-of-jesus": lifeOfJesusDevotionals,
  "holy-week-passion-week": holyWeekDevotionals,
  "advent-readings": adventDevotionals,
  "easter-resurrection-readings": easterDevotionals,
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
    "Psalm 23:1-4": guidedDevotional({
      title: "The Shepherd is near",
      context: "Psalm 23 begins with the Lord as Shepherd and includes both restful places and the valley of deep darkness.",
      body: "David can walk through the valley because the Shepherd is with him. This passage does not deny dark places or promise instant relief; it teaches you to locate comfort in God's presence, guidance, and care while you pass through them.",
      observationQuestion: "What does the Shepherd do, and where is He present?",
      reflectionQuestion: "Where do you need to remember that the Lord is with you, not merely watching from far away?",
      prayer: "Lord, Shepherd of my soul, steady me with Your presence and lead me in Your care.",
      gentleAction: "Pray one line of Psalm 23 when anxious thoughts rise today.",
      studyMethod: "Meditation",
      careNote: carePlanPastoralNote
    }),
    "Psalm 27:1-5": guidedDevotional({
      title: "Light when fear rises",
      context: "David names enemies and trouble, but he begins by naming the Lord as light, salvation, and stronghold.",
      body: "Fear is answered first by who God is. David's desire to dwell with the Lord is not escape; it is the deepest safety he knows when pressure surrounds him. The passage invites fearful hearts to seek the Lord before fear takes the lead.",
      observationQuestion: "What names does David use for the Lord before describing trouble?",
      reflectionQuestion: "Which fear needs to be answered today by who the Lord is?",
      prayer: "Lord, be my light and salvation. Teach my heart to seek You before fear takes the lead.",
      gentleAction: "Write the phrase 'The Lord is my light' beside one specific fear.",
      studyMethod: "SOAP",
      careNote: carePlanPastoralNote
    }),
    "Psalm 46:1-11": guidedDevotional({
      title: "Be still before the God who reigns",
      context: "Psalm 46 names trouble, shaking, conflict, and noise, but repeats that God is refuge and present with His people.",
      body: "The command to be still is not denial or passivity. It is a summons to stop striving as if everything rests on you and to know that the Lord is exalted. Anxiety is met not by pretending the world is calm, but by remembering the God who reigns.",
      observationQuestion: "What trouble is named, and what is repeated about God?",
      reflectionQuestion: "Where are you carrying pressure as though God is absent or unable to help?",
      prayer: "Lord Almighty, quiet my striving and help me know that You are present, faithful, and exalted.",
      gentleAction: "Sit quietly for one minute and repeat, 'The Lord is with us.'",
      studyMethod: "COMA",
      careNote: carePlanPastoralNote
    }),
    "Psalm 91:1-4": guidedDevotional({
      title: "Shelter under His wings",
      context: "Psalm 91 speaks of dwelling in the shelter of the Most High and trusting the Lord as refuge and fortress.",
      body: "The image of wings invites nearness and dependence, not a demand that hardship cannot touch us. The safest place is belonging to the Lord. When fear looks for another refuge, this Psalm calls the heart back to trusting God Himself.",
      observationQuestion: "What shelter and refuge images does the Psalm use?",
      reflectionQuestion: "Where are you tempted to seek shelter in control rather than in God Himself?",
      prayer: "Most High God, draw me near and teach me to trust Your care when fear looks for another refuge.",
      gentleAction: "Name one false refuge and one way to return to the Lord today.",
      studyMethod: "OIA",
      careNote: carePlanPastoralNote
    }),
    "Isaiah 26:3-4": guidedDevotional({
      title: "A mind stayed on Him",
      context: "Isaiah connects peace with a mind stayed on God because it trusts in Him as the everlasting Rock.",
      body: "This is not positive thinking; it is steady attention to the Lord. Peace grows as trust is anchored in God's character rather than in changing circumstances. An anxious mind may wander, but Scripture invites it back to the Rock.",
      observationQuestion: "What connection does Isaiah make between mind, trust, peace, and the Lord?",
      reflectionQuestion: "What thought pattern needs to be re-anchored in the Lord today?",
      prayer: "Lord, keep my mind stayed on You and teach me to trust You as my everlasting Rock.",
      gentleAction: "When a thought repeats, answer it once with the words 'everlasting Rock.'",
      studyMethod: "Word study",
      careNote: carePlanPastoralNote
    }),
    "Isaiah 41:8-13": guidedDevotional({
      title: "Held by His righteous hand",
      context: "God speaks tenderly to His servant with commands not to fear, rooted in His presence, help, and upholding hand.",
      body: "Fear is not minimized; it is met by God's covenant faithfulness and personal nearness. The command 'do not fear' rests on 'I am with you' and 'I will help you.' Courage grows from being held, not from pretending weakness is gone.",
      observationQuestion: "What reasons does God give for His people not to fear?",
      reflectionQuestion: "Where do you need to receive God's promise, 'I will help you'?",
      prayer: "Lord, uphold me with Your righteous hand and make me brave in Your presence.",
      gentleAction: "Open your hand, then close it gently as a reminder that God holds you.",
      studyMethod: "SOAP",
      careNote: carePlanPastoralNote
    }),
    "Matthew 6:25-34": guidedDevotional({
      title: "Seek first the Father",
      context: "Jesus speaks to anxious thoughts by pointing to the Father's care, the birds and lilies, and the priority of God's kingdom.",
      body: "Jesus does not mock anxious thoughts. He redirects them toward the Father's knowledge and care. The passage calls you away from tomorrow's imagined burdens and toward today's faithful trust. Today's trouble is enough for today, and today's Father is near.",
      observationQuestion: "What examples does Jesus use to show the Father's care?",
      reflectionQuestion: "Which concern about tomorrow are you trying to carry before grace has been given for it?",
      prayer: "Father, help me seek Your kingdom today and trust You with tomorrow.",
      gentleAction: "Write one tomorrow-concern, then ask for grace for today's next faithful step.",
      studyMethod: "COMA",
      careNote: carePlanPastoralNote
    }),
    "Matthew 11:28-30": guidedDevotional({
      title: "Rest under Jesus' yoke",
      context: "Jesus invites the weary and burdened to come to Him, take His yoke, and learn from His gentle and humble heart.",
      body: "Jesus invites the weary to Himself, not merely to a calmer mindset. His rest comes through belonging to Him and learning His gentle way. The yoke of Christ is not crushing self-rescue; it is the restful obedience of walking with the Savior.",
      observationQuestion: "Who does Jesus invite, and what does He say about His heart and yoke?",
      reflectionQuestion: "What burden do you need to bring honestly to Jesus rather than keep carrying alone?",
      prayer: "Gentle Savior, teach me Your way and give rest to my soul.",
      gentleAction: "Name one burden to Jesus before trying to solve it.",
      studyMethod: "OIA",
      careNote: carePlanPastoralNote
    }),
    "John 14:25-27": guidedDevotional({
      title: "Peace from Jesus",
      context: "Jesus prepares His disciples for His departure, promising the Spirit and giving His peace.",
      body: "Jesus' peace is not the world's promise of easy circumstances, but the settled gift of His presence, word, and Spirit. Troubled hearts are invited to trust Him because He remains faithful. His peace is received, not manufactured.",
      observationQuestion: "What does Jesus promise, and how is His peace different from the world's peace?",
      reflectionQuestion: "What trouble needs to be brought under the peace Jesus gives?",
      prayer: "Lord Jesus, give me Your peace and keep my heart from being ruled by fear.",
      gentleAction: "Pause once and ask the Spirit to remind you of Jesus' words.",
      studyMethod: "Inductive",
      careNote: carePlanPastoralNote
    }),
    "Romans 8:31-39": guidedDevotional({
      title: "Nothing can separate",
      context: "Paul asks a series of questions so believers will feel the strength of God's saving love in Christ.",
      body: "Suffering is named honestly, but it cannot separate God's people from Christ. Assurance rests not in your grip on God, but in His saving love shown through His Son. Fear is answered by the love that holds through every named threat.",
      observationQuestion: "What threats does Paul name, and what conclusion does he reach?",
      reflectionQuestion: "Which accusation, fear, or suffering needs to hear that nothing can separate you from Christ's love?",
      prayer: "Father, root me deeply in the love You have shown in Christ Jesus my Lord.",
      gentleAction: "Choose one phrase from Romans 8 and carry it as an answer to fear.",
      studyMethod: "Meditation",
      careNote: carePlanPastoralNote
    }),
    "Philippians 4:4-9": guidedDevotional({
      title: "Peace that guards",
      context: "Paul calls believers to rejoice, pray, give thanks, dwell on what is true, and practice what they have received.",
      body: "Paul does not tell anxious believers simply to stop feeling anxious. He calls them to bring requests to God with thanksgiving and to fill their minds with what is true, honorable, and praiseworthy. God's peace guards the heart and mind in Christ like a watchman at the gate.",
      observationQuestion: "What does Paul tell believers to do with requests, thoughts, and practices?",
      reflectionQuestion: "What request can you bring to God today with thanksgiving rather than silent worry?",
      prayer: "God of peace, guard my heart and mind in Christ Jesus.",
      gentleAction: "Write one request, one thank-you, and one true thing to dwell on.",
      studyMethod: "SOAP",
      careNote: carePlanPastoralNote
    }),
    "Colossians 3:12-17": guidedDevotional({
      title: "Let peace rule",
      context: "Paul places peace inside a community clothed with compassion, forgiveness, love, thankfulness, and the word of Christ.",
      body: "Peace is not only an inner feeling; it is allowed to rule relationships under Christ's lordship. Anxiety is often calmed as Christ's word and peace take the governing place in thoughts, words, worship, and community life.",
      observationQuestion: "What practices surround the command to let Christ's peace rule?",
      reflectionQuestion: "Where does Christ's peace need to rule your response to another person?",
      prayer: "Lord Jesus, let Your peace rule in me and let Your word dwell richly in my life.",
      gentleAction: "Choose one peaceful word or thankful action in a relationship today.",
      studyMethod: "COMA",
      careNote: carePlanPastoralNote
    }),
    "1 Peter 5:6-11": guidedDevotional({
      title: "Cast your cares on Him",
      context: "Peter joins humility, casting anxieties on God, watchfulness, suffering, and hope in the God of all grace.",
      body: "Casting anxieties on God is not denial; it is a humble act of trust because He cares for you. The passage also calls for alertness, so peace is not carelessness. You can be watchful without being ruled by fear.",
      observationQuestion: "What does Peter connect with humility, anxiety, watchfulness, and God's care?",
      reflectionQuestion: "What care do you need to hand to God because He cares for you?",
      prayer: "God of all grace, receive my cares and strengthen me in Christ.",
      gentleAction: "Open your hands and name one care you are casting on God.",
      studyMethod: "OIA",
      careNote: carePlanPastoralNote
    }),
    "1 John 4:13-19": guidedDevotional({
      title: "Love that drives out fear",
      context: "John grounds confidence in God's love made known through Christ and witnessed by the Spirit.",
      body: "Perfect love casts out fear because judgment is no longer the believer's final terror in Christ. Fear is answered by abiding in the love God has first given. The passage does not shame fear; it directs fear toward the finished love of God.",
      observationQuestion: "What does John say about God's love, abiding, confidence, and fear?",
      reflectionQuestion: "Where do you need God's first love to quiet fear of punishment, rejection, or exposure?",
      prayer: "Father, help me abide in Your love and live without the fear that Christ has answered.",
      gentleAction: "Repeat once today: 'I love because He first loved me.'",
      studyMethod: "Inductive",
      careNote: carePlanPastoralNote
    })
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
    "Genesis 15:1-6": guidedDevotional({
      title: "Believed the Lord",
      context: "Abram receives God's promise while the visible evidence still looks impossible.",
      body: "Abram's faith is not vague optimism; he believes the Lord who speaks. Scripture says this trust was counted to him as righteousness, pointing forward to the grace God gives through faith. Faith begins by taking God at His word even when sight has not caught up.",
      observationQuestion: "What does God promise Abram, and how does Abram respond?",
      reflectionQuestion: "What promise of God needs to become weightier than what you can presently see?",
      prayer: "Lord, help me take You at Your word and trust Your promise.",
      gentleAction: "Name one promise of God and one visible circumstance that makes trust feel difficult.",
      studyMethod: "OIA"
    }),
    "Psalm 37:3-7": guidedDevotional({
      title: "Trust and wait",
      context: "Psalm 37 teaches God's people how to respond when the wicked seem to prosper and outcomes feel delayed.",
      body: "Trust is joined with concrete faithfulness: dwell, do good, delight in the Lord, commit your way, be still, and wait. Faith is not frantic control. It is patient confidence that the Lord sees and acts rightly.",
      observationQuestion: "What active commands does the Psalm give to someone learning to trust?",
      reflectionQuestion: "Where do you need to practice trust by waiting faithfully rather than forcing an outcome?",
      prayer: "Lord, help me commit my way to You and wait with a quiet heart.",
      gentleAction: "Choose one faithful action you can do while leaving the outcome with God.",
      studyMethod: "SOAP"
    }),
    "Habakkuk 3:17-19": guidedDevotional({
      title: "Rejoice when it is hard",
      context: "Habakkuk ends with worship after wrestling honestly with injustice, waiting, and fear.",
      body: "Habakkuk's faith does not depend on visible abundance. Even if fields, flocks, and harvests fail, he rejoices in the Lord and takes strength in God. This is not denial of loss; it is worship anchored in God when supports are stripped away.",
      observationQuestion: "What losses does Habakkuk name, and where does he locate joy and strength?",
      reflectionQuestion: "What circumstance is testing whether your joy is anchored in God Himself?",
      prayer: "Lord, be my strength when visible supports feel weak.",
      gentleAction: "Write a short 'even if... yet I will...' prayer from your present situation.",
      studyMethod: "Meditation"
    }),
    "Matthew 8:5-13": guidedDevotional({
      title: "Great faith",
      context: "A centurion comes to Jesus for his servant, recognizing Jesus' authority even from a distance.",
      body: "The centurion trusts Jesus' word because he sees Jesus' authority. Jesus marvels at this faith because it understands who He is. Faith is not confidence in technique; it is confidence in the authority and mercy of Christ.",
      observationQuestion: "What does the centurion understand about authority, and how does Jesus respond?",
      reflectionQuestion: "Where do you need to trust the authority of Jesus' word today?",
      prayer: "Lord Jesus, strengthen my faith in Your authority and mercy.",
      gentleAction: "Bring one need to Jesus simply, without trying to control how He must answer.",
      studyMethod: "COMA"
    }),
    "Mark 9:20-27": guidedDevotional({
      title: "Help my unbelief",
      context: "A desperate father brings his son to Jesus after years of suffering and mixed hope.",
      body: "The father's cry is honest: 'I believe; help my unbelief.' Jesus does not require polished confidence before mercy is given. This passage gives weak faith words to bring both trust and struggle to Christ.",
      observationQuestion: "What does the father confess to Jesus, and what does Jesus do?",
      reflectionQuestion: "Where can you honestly say, 'I believe; help my unbelief'?",
      prayer: "Lord Jesus, meet me in weak faith and strengthen my trust in You.",
      gentleAction: "Use the father's prayer exactly as your own when faith feels mixed today.",
      studyMethod: "OIA"
    }),
    "John 20:24-31": guidedDevotional({
      title: "Blessed are those who believe",
      context: "Thomas moves from doubt to worship when he encounters the risen Christ.",
      body: "John writes so readers may believe that Jesus is the Christ, the Son of God, and have life in His name. Faith rests on the witness to the risen Lord. Doubt is not answered by vague comfort, but by the crucified and risen Jesus.",
      observationQuestion: "What confession does Thomas make, and why does John say he wrote these things?",
      reflectionQuestion: "What does this passage invite you to confess about Jesus?",
      prayer: "My Lord and my God, deepen my faith in Your risen life.",
      gentleAction: "Say Thomas' confession slowly as a prayer of faith.",
      studyMethod: "Inductive"
    }),
    "Romans 4:18-25": guidedDevotional({
      title: "Faith credited",
      context: "Paul reflects on Abraham's faith to show that righteousness is counted by grace, not achieved by works.",
      body: "Abraham trusts the God who gives life to the dead, and Paul points believers to Jesus, delivered for our trespasses and raised for our justification. Saving faith looks away from self-earning and toward the God who raises the dead.",
      observationQuestion: "How does Paul connect Abraham's faith with faith in Jesus?",
      reflectionQuestion: "How does Christ's death and resurrection strengthen your confidence before God?",
      prayer: "Father, ground my faith in Christ who died and was raised for me.",
      gentleAction: "Thank God specifically for Christ being delivered and raised for you.",
      studyMethod: "Word study"
    }),
    "Romans 5:1-5": guidedDevotional({
      title: "Justified by faith",
      context: "Paul describes the results of being justified by faith: peace, access, hope, endurance, and God's poured-out love.",
      body: "Because believers are justified by faith, they have peace with God through Jesus Christ. Even suffering is not meaningless, because God uses it to form endurance, character, and hope. This hope does not shame us because God's love has been poured into our hearts.",
      observationQuestion: "What blessings flow from being justified by faith?",
      reflectionQuestion: "Where do you need peace with God to steady you in suffering?",
      prayer: "Lord, let the hope of Your love strengthen me through trial.",
      gentleAction: "Write one hardship beside one hope named in this passage.",
      studyMethod: "SOAP"
    }),
    "Galatians 2:19-21": guidedDevotional({
      title: "Live by faith",
      context: "Paul explains life in Christ as crucified with Christ and now lived by faith in the Son of God.",
      body: "Faith is deeply personal here: daily life is lived from union with Christ and His self-giving love. Paul does not set aside grace by trying to build righteousness apart from Christ. The believer's life is shaped by the Son of God who loved and gave Himself.",
      observationQuestion: "What does Paul say happened to him, and how does he now live?",
      reflectionQuestion: "What part of today needs to be lived by faith in the Son of God who loves you?",
      prayer: "Christ, live in me and teach me to trust Your love.",
      gentleAction: "Before one ordinary action today, remember: 'Christ loved me and gave Himself for me.'",
      studyMethod: "Meditation"
    }),
    "Ephesians 2:8-10": guidedDevotional({
      title: "Saved by grace",
      context: "Paul makes the order clear: salvation is God's gracious gift, and good works flow from His workmanship.",
      body: "Salvation is by grace through faith, not works, so no one may boast. Yet grace also creates a new life prepared for good works. Faith receives God's gift before it walks in God's workmanship.",
      observationQuestion: "What does Paul say salvation is, and what does he say good works are?",
      reflectionQuestion: "Where do you need to receive grace before trying to prove yourself?",
      prayer: "Father, keep me humble in grace and ready for the good works You prepare.",
      gentleAction: "Practice one good work today as gratitude, not self-proof.",
      studyMethod: "Inductive"
    }),
    "Hebrews 10:35-39": guidedDevotional({
      title: "Do not shrink back",
      context: "Hebrews encourages weary believers to endure because God's promise is sure and the coming One will come.",
      body: "Faith keeps moving toward the coming One rather than shrinking back under pressure. This passage encourages confidence rooted in God's faithfulness, not in easy circumstances. Endurance grows when the promise of God feels more solid than the pressure to retreat.",
      observationQuestion: "What does the passage say believers need, and what promise is given?",
      reflectionQuestion: "Where are you tempted to shrink back instead of endure in faith?",
      prayer: "Lord, give me endurance and keep my confidence in Your promise.",
      gentleAction: "Choose one small act of endurance that says, 'I am still trusting You.'",
      studyMethod: "COMA"
    }),
    "Hebrews 11:1-6": guidedDevotional({
      title: "Faith and pleasing God",
      context: "Hebrews describes faith through assurance, conviction, and examples of people who drew near to God.",
      body: "Faith is assurance and conviction rooted in God's unseen reality. Abel, Enoch, and all who draw near to God show that faith believes He exists and rewards those who seek Him. Faith is relational trust in God Himself.",
      observationQuestion: "How does Hebrews describe faith, and what must those who draw near believe?",
      reflectionQuestion: "What unseen promise of God needs your trust today?",
      prayer: "Lord, help me draw near to You with faith that seeks and trusts You.",
      gentleAction: "Take one deliberate step of seeking God before checking for visible results.",
      studyMethod: "OIA"
    }),
    "James 2:14-18": guidedDevotional({
      title: "Faith made visible",
      context: "James challenges empty claims of faith that do not become mercy toward people in need.",
      body: "James does not oppose Paul; he opposes claims that never become love. Genuine faith shows itself in mercy and obedience. Works do not replace faith, but living faith refuses to leave a neighbor uncared for.",
      observationQuestion: "What example does James use to expose empty faith?",
      reflectionQuestion: "How might faith become visible in love or mercy today?",
      prayer: "Lord, make my faith living, humble, and active in love.",
      gentleAction: "Look for one practical mercy you can offer without making a display of it.",
      studyMethod: "Inductive"
    }),
    "1 Peter 1:3-9": guidedDevotional({
      title: "Faith through trials",
      context: "Peter blesses God for new birth into living hope while acknowledging grief in various trials.",
      body: "Trials grieve believers, but tested faith is precious because it looks toward Christ and the salvation to be revealed. Faith holds joy and grief together in hope. The resurrection of Jesus gives suffering a future it cannot destroy.",
      observationQuestion: "What hope does Peter name, and how does he describe tested faith?",
      reflectionQuestion: "What trial needs to be held in the living hope of Christ's resurrection?",
      prayer: "Father, guard my faith and fill me with hope in the risen Christ.",
      gentleAction: "Name one grief and one hope from this passage in the same prayer.",
      studyMethod: "SOAP"
    })
  },
  "fourteen-days-wisdom": {
    "1 Kings 3:5-14": guidedDevotional({
      title: "Ask for wisdom",
      context: "At the beginning of his reign, Solomon asks the Lord for wisdom to govern God's people rather than asking first for wealth or long life.",
      body: "Wisdom begins with humble need. Solomon knows the task before him is too large for self-confidence, so he asks God for a discerning heart. This passage invites us to bring responsibility, decisions, and limits before the God who gives wisdom.",
      observationQuestion: "What does Solomon ask for, and why is the Lord pleased with his request?",
      reflectionQuestion: "Where do you need wisdom more than control, speed, or self-confidence?",
      prayer: "Lord, give me a discerning heart and make my decisions faithful before You.",
      gentleAction: "Name one decision and ask God for wisdom before you act.",
      studyMethod: "COMA"
    }),
    "Psalm 1:1-6": guidedDevotional({
      title: "The way of wisdom",
      context: "Psalm 1 opens the Psalms by contrasting the way of the righteous with the way of the wicked.",
      body: "Wisdom is more than clever choices; it is a rooted life. The blessed person refuses destructive counsel and delights in the Lord's instruction. Like a tree by streams of water, wisdom grows through steady nourishment, not hurried self-improvement.",
      observationQuestion: "What does the blessed person avoid, and what do they delight in?",
      reflectionQuestion: "What counsel, habit, or influence needs to be weighed against God's word?",
      prayer: "Lord, plant me near Your word and make my life fruitful in Your time.",
      gentleAction: "Notice one influence shaping you today and ask whether it leads toward the Lord.",
      studyMethod: "Meditation"
    }),
    "Psalm 119:97-105": guidedDevotional({
      title: "A lamp to my feet",
      context: "Psalm 119 celebrates the Lord's word as wisdom, sweetness, protection, and light for the path.",
      body: "God's word does not always show the whole road at once, but it gives light for faithful steps. Wisdom listens, meditates, restrains the feet from evil, and keeps walking. Scripture is not only information; it is guidance for the next obedient step.",
      observationQuestion: "What does the Psalmist say God's word does for understanding and direction?",
      reflectionQuestion: "Where do you need enough light for the next step rather than certainty about the whole path?",
      prayer: "Lord, make Your word a lamp to my feet and a light to my path.",
      gentleAction: "Choose one clear obedient step from today's reading.",
      studyMethod: "SOAP"
    }),
    "Proverbs 1:1-7": guidedDevotional({
      title: "The beginning of knowledge",
      context: "Proverbs opens by explaining its purpose and naming the fear of the Lord as the beginning of knowledge.",
      body: "Biblical wisdom begins with reverence. Skill for living is not detached from God; it starts with receiving instruction under His authority. The fool refuses wisdom because pride will not listen, but the wise become teachable before the Lord.",
      observationQuestion: "What purposes does Proverbs give for its instruction?",
      reflectionQuestion: "Where do you need to become teachable before the Lord?",
      prayer: "Lord, give me reverence, humility, and a heart willing to receive correction.",
      gentleAction: "Ask one honest question today before defending your first instinct.",
      studyMethod: "Word study"
    }),
    "Proverbs 2:1-11": guidedDevotional({
      title: "Search for wisdom",
      context: "Proverbs 2 describes wisdom as something received from the Lord and pursued with attention, prayer, and effort.",
      body: "Wisdom is both gift and pursuit. The Lord gives wisdom, yet the passage calls us to receive, treasure, call out, seek, and search. This protects us from passivity and pride: we depend on God while actively seeking what He gives.",
      observationQuestion: "What actions does the passage call for, and what does the Lord give?",
      reflectionQuestion: "What would it look like to seek wisdom more deliberately this week?",
      prayer: "Lord, teach me to seek wisdom as treasure and receive what comes from Your mouth.",
      gentleAction: "Write one area where you need wisdom, then list one practical way to search for it faithfully.",
      studyMethod: "Inductive"
    }),
    "Proverbs 3:5-12": guidedDevotional({
      title: "Trust the Lord",
      context: "Proverbs 3 joins trust, humility, obedience, generosity, and receiving the Lord's correction.",
      body: "Wisdom is not leaning on your own understanding while asking God to bless your plan. It is trusting the Lord with all your heart, acknowledging Him, and receiving His correction as love. The wise path is relational before it is strategic.",
      observationQuestion: "What does this passage contrast with leaning on your own understanding?",
      reflectionQuestion: "Where are you tempted to trust your own understanding more than the Lord?",
      prayer: "Lord, help me trust You with all my heart and acknowledge You in my ways.",
      gentleAction: "Pause before one decision and consciously acknowledge the Lord.",
      studyMethod: "SOAP"
    }),
    "Proverbs 4:20-27": guidedDevotional({
      title: "Guard your heart",
      context: "A father urges careful attention to wise words because the heart shapes the direction of life.",
      body: "Wisdom pays attention to the inner life. The heart is not ignored as long as outward behavior looks fine; it must be guarded because life flows from it. Words, eyes, paths, and feet all matter because the whole person is being directed.",
      observationQuestion: "What parts of life does the passage tell the listener to watch or guard?",
      reflectionQuestion: "What is currently shaping your heart more than you realize?",
      prayer: "Lord, guard my heart and straighten the path of my words, attention, and choices.",
      gentleAction: "Remove or limit one influence today that is bending your heart away from wisdom.",
      studyMethod: "OIA"
    }),
    "Proverbs 8:10-21": guidedDevotional({
      title: "Wisdom's value",
      context: "Wisdom speaks, calling people to value instruction, prudence, truth, righteousness, and what is better than riches.",
      body: "Wisdom is valuable because it aligns life with what is true and right before God. Proverbs 8 does not despise practical life; it teaches us to prize wisdom above the things we often chase first. Better treasure leads to better decisions.",
      observationQuestion: "What does wisdom say is better than silver, gold, and jewels?",
      reflectionQuestion: "What lesser treasure is competing with wisdom in your choices?",
      prayer: "Lord, make wisdom more precious to me than comfort, approval, or gain.",
      gentleAction: "Before one purchase, plan, or ambition, ask what wisdom would value most.",
      studyMethod: "Word study"
    }),
    "Ecclesiastes 3:1-11": guidedDevotional({
      title: "A time for everything",
      context: "Ecclesiastes reflects on the seasons of life and the limits of human understanding under God's rule.",
      body: "Wisdom accepts that life has seasons we cannot fully control. God makes everything beautiful in its time, yet humans cannot grasp the whole work of God from beginning to end. This passage invites humility, patience, and trust when timing is not in your hands.",
      observationQuestion: "What repeated pattern does the passage use to describe life's seasons?",
      reflectionQuestion: "What season do you need to receive with humility before God?",
      prayer: "Lord, teach me to trust Your timing when I cannot see the whole work You are doing.",
      gentleAction: "Name the season you are in and one faithful response for today.",
      studyMethod: "COMA"
    }),
    "Matthew 7:24-27": guidedDevotional({
      title: "Build on the rock",
      context: "Jesus closes the Sermon on the Mount by comparing those who hear and obey His words with those who hear and do not obey.",
      body: "Wisdom is not merely admiring Jesus' teaching. The wise builder hears and does His words. Storms reveal foundations, so the question is not whether words sounded inspiring, but whether life is being built on obedience to Christ.",
      observationQuestion: "What is the difference between the wise and foolish builders?",
      reflectionQuestion: "What word of Jesus needs to move from hearing to obedience in your life?",
      prayer: "Lord Jesus, make me a hearer and doer of Your words.",
      gentleAction: "Choose one command of Jesus you can put into practice today.",
      studyMethod: "SOAP"
    }),
    "James 1:5-8": guidedDevotional({
      title: "Ask God for wisdom",
      context: "James writes to believers facing trials and invites those lacking wisdom to ask the generous God.",
      body: "Wisdom is needed not only for big decisions but for endurance. James points us to a God who gives generously without reproach. Asking for wisdom is an act of faith: we come to God as the source rather than wavering between dependence and self-rule.",
      observationQuestion: "What does James say God is like toward those who ask for wisdom?",
      reflectionQuestion: "Where do you need to ask God for wisdom instead of merely reacting?",
      prayer: "Generous God, give me wisdom and make my trust steady.",
      gentleAction: "Ask God for wisdom before responding to one pressure today.",
      studyMethod: "Inductive"
    }),
    "James 3:13-18": guidedDevotional({
      title: "Wisdom from above",
      context: "James contrasts earthly wisdom marked by selfish ambition with wisdom from above marked by purity and peace.",
      body: "Not all wisdom is from God. James exposes the difference by its fruit. Heavenly wisdom is pure, peaceable, gentle, open to reason, full of mercy and good fruit, impartial, and sincere. True wisdom can be recognized in the kind of life it produces.",
      observationQuestion: "What traits distinguish wisdom from above from earthly wisdom?",
      reflectionQuestion: "Which fruit of wisdom from above needs to grow in your relationships?",
      prayer: "Lord, make my wisdom peaceable, gentle, merciful, and sincere.",
      gentleAction: "Choose gentleness in one conversation where self-protection would be easier.",
      studyMethod: "OIA"
    }),
    "Colossians 3:12-17": guidedDevotional({
      title: "Wise community life",
      context: "Paul describes the life of God's chosen people as they put on compassion, forgiveness, love, peace, gratitude, and the word of Christ.",
      body: "Wisdom is not only private decision-making. It is seen in the way believers bear with one another, forgive, let peace rule, and let Christ's word dwell richly. A wise life is a word-shaped, thankful, love-clothed life among other people.",
      observationQuestion: "What practices does Paul call God's people to put on or let rule among them?",
      reflectionQuestion: "Where does wisdom need to shape your words or relationships today?",
      prayer: "Christ, let Your word dwell richly in me and make my life thankful and loving.",
      gentleAction: "Speak one word today that is shaped by gratitude, peace, or forgiveness.",
      studyMethod: "COMA"
    }),
    "2 Timothy 3:14-17": guidedDevotional({
      title: "Scripture equips",
      context: "Paul urges Timothy to continue in the Scriptures, which are God-breathed and able to make him wise for salvation through faith in Christ.",
      body: "Scripture gives wisdom that leads to salvation in Christ and equips God's people for every good work. This keeps wisdom anchored: the goal is not appearing insightful, but being taught, corrected, trained, and equipped by God's breathed-out word.",
      observationQuestion: "What does Paul say Scripture is able to do and useful for?",
      reflectionQuestion: "Where do you need Scripture to teach, correct, train, or equip you?",
      prayer: "God, let Your breathed-out Word make me wise in Christ and ready for good works.",
      gentleAction: "Choose one correction or encouragement from Scripture to carry into action.",
      studyMethod: "Inductive"
    })
  },
  "romans-road": {
    "Romans 1": guidedDevotional({
      title: "Human need before God",
      context: "Romans opens with the gospel of God concerning His Son, then shows why humanity needs that gospel.",
      body: "Paul does not begin with a shallow problem. He shows that the human heart exchanges the truth of God for lies and worships created things rather than the Creator. The gospel is good news because it meets a real need: people need rescue, righteousness, and mercy before God.",
      observationQuestion: "What exchanges does Paul describe in this chapter?",
      reflectionQuestion: "Where does this chapter expose the danger of worshiping created things instead of the Creator?",
      prayer: "Creator God, turn my heart from false worship and make me ready to receive Your gospel.",
      gentleAction: "Name one created thing that can become too ultimate in your heart.",
      studyMethod: "OIA"
    }),
    "Romans 3": guidedDevotional({
      title: "Righteousness through faith",
      context: "After showing that both Jews and Gentiles are under sin, Paul announces God's righteousness revealed through faith in Jesus Christ.",
      body: "Romans 3 brings honest diagnosis and glorious grace together. All have sinned and fall short of God's glory, yet God justifies by His grace through the redemption in Christ Jesus. The gospel does not minimize sin; it reveals God's righteous mercy in Christ.",
      observationQuestion: "What does Paul say about all people, and what does God provide through Christ?",
      reflectionQuestion: "How does grace become more precious when sin is named honestly?",
      prayer: "Lord Jesus, thank You for redemption and mercy that I could never earn.",
      gentleAction: "Write one sentence of confession and one sentence of thanks for grace.",
      studyMethod: "SOAP"
    }),
    "Romans 5": guidedDevotional({
      title: "Peace with God",
      context: "Paul explains what follows from justification by faith and contrasts Adam's trespass with Christ's gracious gift.",
      body: "The gospel gives more than a fresh start; it gives peace with God through Jesus Christ. God's love is shown in Christ dying for sinners, not for people who had already made themselves worthy. Grace is stronger than the ruin sin brought.",
      observationQuestion: "What blessings does Paul connect with being justified by faith?",
      reflectionQuestion: "Where do you need peace with God to steady your heart today?",
      prayer: "Father, let the love You showed in Christ give me peace, hope, and endurance.",
      gentleAction: "Read Romans 5:8 slowly and thank God that Christ died for sinners.",
      studyMethod: "Inductive"
    }),
    "Romans 6": guidedDevotional({
      title: "Alive to God",
      context: "Paul answers the question of whether grace means continuing in sin and points believers to union with Christ's death and resurrection.",
      body: "Grace does not leave believers enslaved to sin. Those united to Christ are to consider themselves dead to sin and alive to God. New life is not self-improvement with religious language; it is resurrection-shaped belonging to Christ.",
      observationQuestion: "What does Paul say has happened to believers in relation to Christ's death and life?",
      reflectionQuestion: "What old slavery needs to hear that you belong to Christ now?",
      prayer: "Lord Jesus, teach me to live as one who is alive to God in You.",
      gentleAction: "Offer one part of your body, speech, or attention to God today.",
      studyMethod: "COMA"
    }),
    "Romans 8": guidedDevotional({
      title: "Life in the Spirit",
      context: "Romans 8 describes no condemnation, life by the Spirit, adoption, suffering, hope, intercession, and God's inseparable love.",
      body: "The gospel brings assurance deep enough for real struggle. There is no condemnation in Christ, the Spirit bears witness that believers are God's children, and nothing can separate God's people from His love in Christ Jesus. Hope does not deny suffering; it holds suffering inside God's saving purpose.",
      observationQuestion: "What assurances does Paul give to those who are in Christ?",
      reflectionQuestion: "Which promise in Romans 8 most needs to answer fear, shame, or suffering today?",
      prayer: "Spirit of God, help me live as God's child and rest in Christ's unbreakable love.",
      gentleAction: "Choose one phrase from Romans 8 to carry as assurance today.",
      studyMethod: "Meditation"
    }),
    "Romans 10": guidedDevotional({
      title: "Call on the Lord",
      context: "Paul speaks of righteousness by faith, confessing Jesus as Lord, believing God raised Him, and calling on Him.",
      body: "The gospel is not hidden behind impossible achievement. Paul says the word is near: confess with your mouth that Jesus is Lord and believe in your heart that God raised Him from the dead. Salvation rests on Christ and is received by faith that calls on Him.",
      observationQuestion: "What does Paul say about confessing, believing, and calling on the Lord?",
      reflectionQuestion: "What does it mean for you to trust Jesus as Lord rather than yourself?",
      prayer: "Lord Jesus, I confess You as Lord and trust the life God gives through You.",
      gentleAction: "Pray a simple confession of trust in Jesus as Lord.",
      studyMethod: "Word study"
    }),
    "Romans 12": guidedDevotional({
      title: "A life of mercy",
      context: "After unfolding God's mercy in Christ, Paul calls believers to offer themselves to God and live transformed lives.",
      body: "Romans Road does not end with information. Because of God's mercies, believers offer themselves to God, resist being conformed to the world, and learn transformed love. The gospel creates worship, humility, service, patience, hospitality, peace, and practical love.",
      observationQuestion: "What kinds of transformed living does Paul describe?",
      reflectionQuestion: "Where should God's mercy become visible in your ordinary life?",
      prayer: "God of mercy, make my life a living offering shaped by Your grace.",
      gentleAction: "Choose one instruction from Romans 12 and put it into practice today.",
      studyMethod: "SOAP"
    })
  },
  "wisdom-decisions": {
    "Proverbs 1:1-7": guidedDevotional({
      title: "Begin with the fear of the Lord",
      context: "Proverbs opens by naming its purpose and placing the fear of the Lord at the beginning of knowledge.",
      body: "Wise decisions do not begin with technique alone. They begin with reverence for the Lord, humility, and willingness to receive instruction. The fool refuses wisdom because pride will not listen, but the wise become teachable before God.",
      observationQuestion: "What does Proverbs say its wisdom is for?",
      reflectionQuestion: "Where do you need reverence and teachability before making a decision?",
      prayer: "Lord, give me reverence, humility, and a heart willing to receive correction.",
      gentleAction: "Before deciding, ask, 'What would honour the Lord here?'",
      studyMethod: "Word study"
    }),
    "Proverbs 2:1-11": guidedDevotional({
      title: "Search for wisdom",
      context: "Proverbs 2 describes wisdom as both a gift from the Lord and something to seek diligently.",
      body: "Decision-making wisdom is not passive. The Lord gives wisdom, and the wise receive, treasure, call out, seek, and search. This keeps us dependent and engaged: we ask God while also paying careful attention to His ways.",
      observationQuestion: "What actions does the passage call for, and what does the Lord promise to give?",
      reflectionQuestion: "What decision needs patient seeking rather than a rushed answer?",
      prayer: "Lord, help me seek wisdom as treasure and receive what comes from Your mouth.",
      gentleAction: "Write down the decision and one wise source of counsel or Scripture to consider.",
      studyMethod: "Inductive"
    }),
    "Proverbs 3:5-12": guidedDevotional({
      title: "Trust the Lord",
      context: "Proverbs 3 joins trust, acknowledging the Lord, humility, honouring God, and receiving His correction.",
      body: "Trusting the Lord is not asking Him to bless a plan already ruled by self-reliance. Wisdom acknowledges Him in the way itself. Even correction is part of His fatherly love, shaping decisions that are less proud and more faithful.",
      observationQuestion: "What does this passage contrast with leaning on your own understanding?",
      reflectionQuestion: "Where are you tempted to trust your own understanding more than the Lord?",
      prayer: "Lord, help me trust You with all my heart and acknowledge You in my ways.",
      gentleAction: "Pause over one choice and consciously invite the Lord into the way, not just the outcome.",
      studyMethod: "SOAP"
    }),
    "Proverbs 16:1-9": guidedDevotional({
      title: "Commit your way",
      context: "Proverbs 16 holds human plans and the Lord's sovereign direction together.",
      body: "Wisdom neither refuses planning nor pretends plans control everything. A person may make plans, weigh motives, and commit work to the Lord, but the Lord establishes steps. This gives freedom to plan humbly and walk dependently.",
      observationQuestion: "What does the passage say belongs to people, and what belongs to the Lord?",
      reflectionQuestion: "What plan needs to be committed to the Lord with humility?",
      prayer: "Lord, establish what is faithful and redirect what is proud or unwise.",
      gentleAction: "Write your plan in one sentence, then pray, 'Establish my steps as You see fit.'",
      studyMethod: "COMA"
    }),
    "James 1:5-8": guidedDevotional({
      title: "Ask God for wisdom",
      context: "James speaks to believers under trial and invites anyone lacking wisdom to ask the generous God.",
      body: "Wisdom is needed when pressure makes reactions quick and trust thin. James points to God, who gives generously without reproach. Asking for wisdom is not weakness; it is faith turning toward the One who knows the faithful path.",
      observationQuestion: "What does James say God is like toward those who ask?",
      reflectionQuestion: "Where do you need to ask before reacting?",
      prayer: "Generous God, give me wisdom and make my trust steady before You.",
      gentleAction: "Before responding to one pressure today, ask God for wisdom in a single sentence.",
      studyMethod: "OIA"
    }),
    "Colossians 3:12-17": guidedDevotional({
      title: "Wisdom in community",
      context: "Paul describes the life of God's chosen people through compassion, forgiveness, love, peace, gratitude, and the word of Christ.",
      body: "Many decisions are not made in isolation. Christ's peace, word, and love shape how believers choose together and relate to one another. Wisdom listens for what grows gratitude, forgiveness, truth, and love rather than what merely protects preference.",
      observationQuestion: "What practices does Paul describe for God's people together?",
      reflectionQuestion: "How should love, peace, or gratitude shape the decision before you?",
      prayer: "Christ, let Your peace rule and Your word dwell richly in my choices.",
      gentleAction: "Ask how your decision will affect one other person and what love requires.",
      studyMethod: "SOAP"
    }),
    "Psalm 25:4-10": guidedDevotional({
      title: "Teach me Your paths",
      context: "David asks the Lord to make His ways known, lead him in truth, remember mercy, and guide the humble.",
      body: "Wisdom for decisions is ultimately a request to be led by the Lord. Psalm 25 joins guidance with mercy, humility, covenant love, and truth. The prayer is not only, 'Show me what to do,' but 'Teach me Your paths.'",
      observationQuestion: "What does David ask the Lord to teach, lead, remember, and do?",
      reflectionQuestion: "What decision needs to become a prayer for God's path, not only God's answer?",
      prayer: "Lord, make me know Your ways, teach me Your paths, and lead me in Your truth.",
      gentleAction: "Pray Psalm 25:4-5 over one decision before taking the next step.",
      studyMethod: "Meditation"
    })
  },
  "ten-days-psalms": {
    "Psalm 1": guidedDevotional({
      title: "Rooted in the Lord's word",
      context: "Psalm 1 opens the Psalms by contrasting the way of the righteous with the way of the wicked.",
      body: "The blessed life is pictured as a tree planted by streams of water. This is not hurried spirituality; it is a life nourished by delighting in the Lord's instruction. The Psalm asks where your roots are going down and what counsel is shaping your path.",
      observationQuestion: "What does the blessed person avoid, and what do they delight in?",
      reflectionQuestion: "What is currently shaping your path more than God's word?",
      prayer: "Lord, root me deeply in Your word and make my life fruitful in Your time.",
      gentleAction: "Choose one phrase from Psalm 1 to carry through the day.",
      studyMethod: "Meditation"
    }),
    "Psalm 8": guidedDevotional({
      title: "Majesty and smallness",
      context: "Psalm 8 praises the Lord's majesty in creation and wonders that God cares for human beings.",
      body: "This Psalm holds together two truths: God is majestic above the heavens, and He gives dignity to small human creatures. Worship grows when you see both His greatness and His kindness. Your worth is not self-made; it is received from the Creator who remembers and cares.",
      observationQuestion: "What does David notice about God, creation, and humanity?",
      reflectionQuestion: "Where do you need to receive both humility and dignity before God?",
      prayer: "Majestic Lord, teach me to worship You with humility and receive my life as Your gift.",
      gentleAction: "Look at one created thing today and turn it into praise.",
      studyMethod: "OIA"
    }),
    "Psalm 19": guidedDevotional({
      title: "Creation and the word",
      context: "Psalm 19 moves from the heavens declaring God's glory to the Lord's word reviving, making wise, rejoicing, and warning.",
      body: "God speaks through what He has made and through what He has revealed. Creation declares His glory, and Scripture searches and restores the heart. The Psalm ends personally: the worshiper asks that words and thoughts would be pleasing to the Lord.",
      observationQuestion: "What does creation declare, and what does the Lord's word do?",
      reflectionQuestion: "Where do your words or thoughts need the Lord's searching and restoring work?",
      prayer: "Lord, let the words of my mouth and the meditation of my heart be pleasing to You.",
      gentleAction: "Pause before one conversation and ask God to shape your words.",
      studyMethod: "SOAP"
    }),
    "Psalm 23": guidedDevotional({
      title: "The Shepherd's care",
      context: "David describes the Lord as Shepherd across rest, restoration, guidance, danger, provision, mercy, and home.",
      body: "Psalm 23 gives trust a voice. The Lord's care is not abstract; He leads, restores, comforts, provides, and keeps His people near. Even the valley is not outside His presence. The Shepherd remains faithful from green pastures to the house of the Lord.",
      observationQuestion: "What actions does the Shepherd take throughout the Psalm?",
      reflectionQuestion: "Which part of the Shepherd's care do you most need today?",
      prayer: "Lord, my Shepherd, lead me, restore me, and keep me near You.",
      gentleAction: "Pray one line of Psalm 23 slowly during a pause today.",
      studyMethod: "Lectio Divina"
    }),
    "Psalm 27": guidedDevotional({
      title: "Seek His face",
      context: "David names fear, enemies, and trouble, yet longs to dwell with the Lord and seek His face.",
      body: "Psalm 27 answers fear first with who the Lord is: light, salvation, and stronghold. David's desire to behold the Lord is not escape from trouble; it is the deepest safety he knows. Courage grows as the heart learns to seek God's face.",
      observationQuestion: "What does David fear, and what does he desire most?",
      reflectionQuestion: "What would it mean to seek the Lord as your 'one thing' today?",
      prayer: "Lord, when You say, 'Seek My face,' help my heart answer, 'Your face I will seek.'",
      gentleAction: "Turn one anxious pause into a short prayer of seeking.",
      studyMethod: "COMA"
    }),
    "Psalm 42": guidedDevotional({
      title: "Speak hope to your soul",
      context: "Psalm 42 gives words to spiritual thirst, tears, memory, turmoil, and renewed hope in God.",
      body: "The Psalmist does not shame a downcast soul. He speaks to it with honesty and hope. Faith may include tears, longing, and questions, but it also learns to remember God and wait for praise to return.",
      observationQuestion: "What signs of distress appear, and what does the Psalmist say to his soul?",
      reflectionQuestion: "What does your soul need to remember about God today?",
      prayer: "Lord, meet me in longing and teach my soul to hope in You.",
      gentleAction: "Speak one gentle truth from this Psalm to yourself.",
      studyMethod: "Meditation"
    }),
    "Psalm 46": guidedDevotional({
      title: "Be still before the God who reigns",
      context: "Psalm 46 names trouble, shaking, conflict, and noise, but repeats that God is refuge and present with His people.",
      body: "The command to be still is not denial or passivity. It is a summons to stop striving as if everything rests on you and to know that the Lord is exalted. Prayer can become worship when pressure is brought before the God who reigns.",
      observationQuestion: "What trouble is named, and what is repeated about God?",
      reflectionQuestion: "Where are you carrying pressure as though God is absent or unable to help?",
      prayer: "Lord Almighty, quiet my striving and help me know that You are present, faithful, and exalted.",
      gentleAction: "Sit quietly for one minute and repeat, 'The Lord is with us.'",
      studyMethod: "COMA"
    }),
    "Psalm 51": guidedDevotional({
      title: "Mercy for a contrite heart",
      context: "Psalm 51 is David's prayer of confession after grievous sin, asking for mercy, cleansing, renewal, and restored joy.",
      body: "This Psalm does not excuse sin, but it does teach sinners where to go. David appeals to God's mercy and asks for a clean heart. Repentance is not self-punishment; it is honest return to the God who can cleanse, renew, and restore.",
      observationQuestion: "What does David confess, and what does he ask God to create or restore?",
      reflectionQuestion: "Where do you need to bring honest confession rather than hiding?",
      prayer: "Merciful God, create in me a clean heart and renew a steadfast spirit within me.",
      gentleAction: "Pray one honest sentence of confession and one request for renewal.",
      studyMethod: "SOAP"
    }),
    "Psalm 91": guidedDevotional({
      title: "Dwelling in refuge",
      context: "Psalm 91 speaks of dwelling in the shelter of the Most High and trusting Him as refuge and fortress.",
      body: "The Psalm's safety language invites nearness and trust in the Lord. It is not a tool for demanding a trouble-free life; it is a call to dwell with God as refuge. The safest place is belonging to Him.",
      observationQuestion: "What refuge images does the Psalm use for God's care?",
      reflectionQuestion: "Where are you tempted to seek shelter somewhere other than the Lord?",
      prayer: "Most High God, teach me to dwell near You and trust Your faithful care.",
      gentleAction: "Name one false refuge, then ask God to draw you back to Himself.",
      studyMethod: "OIA"
    }),
    "Psalm 103": guidedDevotional({
      title: "Bless the Lord",
      context: "Psalm 103 calls the soul to bless the Lord and remember His mercy, forgiveness, compassion, and steadfast love.",
      body: "Praise grows by remembering. The Psalm gathers God's benefits: forgiveness, healing, redemption, compassion, patience, and covenant love. It teaches the soul not to forget the Lord's mercy, especially when weakness and dust-like frailty are obvious.",
      observationQuestion: "What reasons does the Psalm give for blessing the Lord?",
      reflectionQuestion: "Which mercy of the Lord do you need to remember today?",
      prayer: "Lord, help my soul remember Your mercy and bless Your holy name.",
      gentleAction: "List three mercies from this Psalm and thank God for one of them.",
      studyMethod: "Inductive"
    })
  },
  "fourteen-days-proverbs": {
    "Proverbs 1": guidedDevotional({
      title: "The beginning of wisdom",
      context: "Proverbs opens by naming its purpose and placing the fear of the Lord at the beginning of knowledge.",
      body: "Wisdom begins with reverence. Proverbs is not merely advice for getting ahead; it teaches a teachable life before God. The wise listen and receive correction because they know the Lord is the source of knowledge.",
      observationQuestion: "What purposes does Proverbs give for its instruction?",
      reflectionQuestion: "Where do you need to become more teachable before the Lord?",
      prayer: "Lord, give me reverence, humility, and a heart willing to receive wisdom.",
      gentleAction: "Ask one honest question today before defending your first instinct.",
      studyMethod: "Word study"
    }),
    "Proverbs 2": guidedDevotional({
      title: "Search for wisdom",
      context: "Proverbs 2 describes wisdom as something received from the Lord and pursued like treasure.",
      body: "Wisdom is both gift and pursuit. The Lord gives wisdom, yet the wise receive, treasure, call out, seek, and search. This protects from passivity and pride: you depend on God while actively seeking what He gives.",
      observationQuestion: "What actions are used to describe seeking wisdom?",
      reflectionQuestion: "What area of life needs a more deliberate search for wisdom?",
      prayer: "Lord, help me seek wisdom as treasure and receive what comes from Your mouth.",
      gentleAction: "Write one question where you need wisdom and bring it to God.",
      studyMethod: "Inductive"
    }),
    "Proverbs 3": guidedDevotional({
      title: "Trust the Lord",
      context: "Proverbs 3 joins trust, acknowledging the Lord, humility, generosity, and receiving His correction.",
      body: "Wisdom does not lean on self-reliance while asking God to bless the result. It trusts the Lord with all the heart and acknowledges Him in the way itself. Even correction is part of His fatherly love.",
      observationQuestion: "What does this chapter say about trust, understanding, and correction?",
      reflectionQuestion: "Where are you leaning on your own understanding?",
      prayer: "Lord, help me trust You with all my heart and acknowledge You in my ways.",
      gentleAction: "Pause before one choice and consciously acknowledge the Lord.",
      studyMethod: "SOAP"
    }),
    "Proverbs 4": guidedDevotional({
      title: "Guard your heart",
      context: "Proverbs 4 urges careful attention to instruction because the heart shapes the course of life.",
      body: "Wisdom pays attention to the inner life. The heart is not ignored as long as outward behavior looks fine; it must be guarded because life flows from it. Words, eyes, paths, and feet all matter because the whole person is being directed.",
      observationQuestion: "What parts of life does this chapter tell the listener to guard or direct?",
      reflectionQuestion: "What is shaping your heart more than you realize?",
      prayer: "Lord, guard my heart and straighten the path of my words, attention, and choices.",
      gentleAction: "Remove or limit one influence today that bends your heart away from wisdom.",
      studyMethod: "OIA"
    }),
    "Proverbs 8": guidedDevotional({
      title: "Wisdom's worth",
      context: "Wisdom calls out publicly and invites people to value instruction, truth, prudence, and righteousness.",
      body: "Wisdom is valuable because it aligns life with what is true and right before God. Proverbs 8 teaches us to prize wisdom above things we often chase first. Better treasure leads to better decisions.",
      observationQuestion: "What does wisdom say is better than silver, gold, and jewels?",
      reflectionQuestion: "What lesser treasure is competing with wisdom in your choices?",
      prayer: "Lord, make wisdom more precious to me than comfort, approval, or gain.",
      gentleAction: "Before one choice today, ask what wisdom would value most.",
      studyMethod: "Word study"
    }),
    "Proverbs 10": guidedDevotional({
      title: "Daily wisdom in contrast",
      context: "Proverbs 10 begins a collection of short sayings that often contrast wisdom and folly, righteousness and wickedness.",
      body: "This chapter shows wisdom in ordinary life: words, work, honesty, discipline, wealth, fear, and hope. Wisdom is not abstract. It appears in repeated small choices that either build life or scatter it.",
      observationQuestion: "Which contrasts appear repeatedly in this chapter?",
      reflectionQuestion: "Which ordinary area of life needs wisdom most today: words, work, money, or discipline?",
      prayer: "Lord, make me faithful in the small choices where wisdom becomes visible.",
      gentleAction: "Choose one proverb from the chapter and apply it to a concrete action today.",
      studyMethod: "OIA"
    }),
    "Proverbs 11": guidedDevotional({
      title: "Integrity and generosity",
      context: "Proverbs 11 highlights honest scales, humility, righteousness, generosity, and the fruit of wise living.",
      body: "Wisdom cares about integrity when no one is watching and generosity when self-protection feels safer. The Lord delights in honesty, and the generous life bears fruit beyond itself. Wisdom is both upright and open-handed.",
      observationQuestion: "What does this chapter say about honesty, humility, and generosity?",
      reflectionQuestion: "Where does integrity or generosity need to shape your next step?",
      prayer: "Lord, make me honest, humble, and generous before You.",
      gentleAction: "Practice one quiet act of honesty or generosity today.",
      studyMethod: "SOAP"
    }),
    "Proverbs 12": guidedDevotional({
      title: "Words that heal",
      context: "Proverbs 12 gives many sayings about speech, diligence, truth, anxiety, and the way of righteousness.",
      body: "Wisdom is heard in speech. Rash words can pierce, but wise words bring healing. This chapter does not treat words as harmless; it calls for truth, care, diligence, and speech that serves life.",
      observationQuestion: "What kinds of speech are contrasted in this chapter?",
      reflectionQuestion: "Where could your words bring healing rather than harm today?",
      prayer: "Lord, make my words truthful, careful, and life-giving.",
      gentleAction: "Before one reply, pause and ask whether your words will heal or pierce.",
      studyMethod: "Word study"
    }),
    "Proverbs 15": guidedDevotional({
      title: "A gentle answer",
      context: "Proverbs 15 speaks often about speech, correction, prayer, humility, and the Lord's sight.",
      body: "Wisdom is not only what is said, but how it is said. A gentle answer can turn away wrath, while harsh words stir it up. The chapter also reminds us that the Lord sees deeply and receives the prayer of the upright.",
      observationQuestion: "What does this chapter teach about gentle and harsh speech?",
      reflectionQuestion: "Where would a gentle answer be wiser than winning an argument?",
      prayer: "Lord, give me humility to receive correction and gentleness in my speech.",
      gentleAction: "Use a gentler tone than your first impulse in one conversation today.",
      studyMethod: "COMA"
    }),
    "Proverbs 16": guidedDevotional({
      title: "Plans under the Lord",
      context: "Proverbs 16 holds human plans and the Lord's sovereign direction together.",
      body: "Wisdom neither refuses planning nor pretends plans control everything. A person may make plans, weigh motives, and commit work to the Lord, but the Lord establishes steps. This gives freedom to plan humbly and walk dependently.",
      observationQuestion: "What belongs to human planning, and what belongs to the Lord?",
      reflectionQuestion: "What plan needs to be committed to the Lord with humility?",
      prayer: "Lord, establish what is faithful and redirect what is proud or unwise.",
      gentleAction: "Write one plan and pray, 'Establish my steps as You see fit.'",
      studyMethod: "SOAP"
    }),
    "Proverbs 18": guidedDevotional({
      title: "Listening before answering",
      context: "Proverbs 18 includes sayings about isolation, speech, listening, conflict, and the name of the Lord as a strong tower.",
      body: "Wisdom listens before answering. The chapter warns against words that damage and opinions formed too quickly. It also gives refuge: the name of the Lord is a strong tower for the righteous.",
      observationQuestion: "What does this chapter say about listening, answering, and words?",
      reflectionQuestion: "Where do you need to listen before answering?",
      prayer: "Lord, slow my speech, deepen my listening, and make Your name my refuge.",
      gentleAction: "Ask one clarifying question before offering your opinion today.",
      studyMethod: "OIA"
    }),
    "Proverbs 22": guidedDevotional({
      title: "A good name and a generous heart",
      context: "Proverbs 22 speaks about reputation, humility, riches, training, justice, generosity, and guarding against oppression.",
      body: "Wisdom values character over image and justice over advantage. A good name is better than great riches, and humility before the Lord shapes how power, money, and opportunity are handled. The wise life notices the vulnerable.",
      observationQuestion: "What values does this chapter lift above wealth or advantage?",
      reflectionQuestion: "Where should character, justice, or generosity matter more than gain?",
      prayer: "Lord, form my character and make me attentive to people who are easily overlooked.",
      gentleAction: "Choose one generous or just action that costs you some convenience.",
      studyMethod: "COMA"
    }),
    "Proverbs 27": guidedDevotional({
      title: "Faithful friendship and humility",
      context: "Proverbs 27 includes sayings about tomorrow, praise, friendship, counsel, and careful attention to responsibilities.",
      body: "Wisdom is humble about tomorrow and honest about relationships. Faithful wounds from a friend may serve love better than flattery, and wise counsel can sharpen a life. This chapter invites humility, teachability, and faithful attention to what has been entrusted.",
      observationQuestion: "What does this chapter say about friends, counsel, and tomorrow?",
      reflectionQuestion: "Where do you need faithful counsel or humility about tomorrow?",
      prayer: "Lord, make me humble, teachable, and faithful with today's responsibilities.",
      gentleAction: "Thank one faithful friend or ask for honest counsel where you need it.",
      studyMethod: "Inductive"
    }),
    "Proverbs 31": guidedDevotional({
      title: "Wisdom embodied",
      context: "Proverbs 31 includes royal counsel and a portrait of wisdom embodied in faithful, capable, generous household leadership.",
      body: "This chapter is not meant to crush people with an impossible image. It honors wisdom lived out in strength, diligence, generosity, speech, planning, and fear of the Lord. The final measure is not charm or appearance, but reverence for God expressed in faithful life.",
      observationQuestion: "What qualities are praised, and what is named as worthy of praise?",
      reflectionQuestion: "Which wise quality in this chapter do you want God to grow in you?",
      prayer: "Lord, grow wisdom that becomes faithful action, generous care, and reverence for You.",
      gentleAction: "Choose one ordinary responsibility and do it today as service before the Lord.",
      studyMethod: "Inductive"
    })
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
    "Psalm 13:1-6": guidedDevotional({
      title: "Lament with trust",
      context: "Psalm 13 is a short lament where David brings repeated 'How long?' questions before the Lord.",
      body: "Psalm 13 gives grief honest words. David does not rush past sorrow, yet he turns toward God's steadfast love. Biblical lament brings pain into relationship with God and waits for His salvation without pretending the ache is small.",
      observationQuestion: "What questions does David ask, and where does the Psalm turn?",
      reflectionQuestion: "What honest sorrow can you bring to God without pretending it is small?",
      prayer: "Lord, receive my lament and help me trust Your steadfast love.",
      gentleAction: "Write one honest 'How long?' prayer to God.",
      studyMethod: "SOAP",
      careNote: carePlanPastoralNote
    }),
    "Psalm 23:1-6": guidedDevotional({
      title: "Comfort from the Shepherd",
      context: "Psalm 23 traces the Shepherd's care through rest, restoration, guidance, danger, provision, mercy, and home.",
      body: "Psalm 23 comforts by showing the Lord's personal care in every part of the way. Even in the valley, the Shepherd is present. Grief is not walked alone; goodness and mercy still follow because the Shepherd remains faithful.",
      observationQuestion: "What does the Shepherd provide across the whole Psalm?",
      reflectionQuestion: "Where do you need the Shepherd's presence in grief today?",
      prayer: "Lord, restore my soul and walk with me through every valley.",
      gentleAction: "Read one line of Psalm 23 aloud as a prayer for today's grief.",
      studyMethod: "Meditation",
      careNote: carePlanPastoralNote
    }),
    "Psalm 34:17-22": guidedDevotional({
      title: "Near the brokenhearted",
      context: "Psalm 34 names affliction, brokenheartedness, and the Lord's nearness and rescue.",
      body: "Psalm 34 does not say the righteous avoid affliction. It says the Lord hears, is near to the brokenhearted, and saves the crushed in spirit. Comfort begins with God's nearness to real pain, not with pressure to be fine.",
      observationQuestion: "What does the Lord do for the brokenhearted and crushed in spirit?",
      reflectionQuestion: "Where do you need to believe that the Lord is near, not distant?",
      prayer: "Lord, be near to me in brokenness and save me with Your mercy.",
      gentleAction: "Place your hand over your heart and pray, 'Lord, be near here.'",
      studyMethod: "OIA",
      careNote: carePlanPastoralNote
    }),
    "Psalm 42:5-11": guidedDevotional({
      title: "Hope in God",
      context: "Psalm 42 speaks to a downcast soul while remembering God and longing for renewed praise.",
      body: "The Psalmist speaks to a downcast soul rather than shaming it. He remembers God, names turmoil, and calls the soul to hope again. Grief may keep speaking, but faith also learns to speak back with patience and hope.",
      observationQuestion: "What does the Psalmist say to his own soul?",
      reflectionQuestion: "What does your downcast soul need to remember about God today?",
      prayer: "Lord, help me hope in You while my soul is still unsettled.",
      gentleAction: "Speak one gentle truth from this Psalm to your own soul.",
      studyMethod: "Meditation",
      careNote: carePlanPastoralNote
    }),
    "Psalm 46:1-7": guidedDevotional({
      title: "God is refuge",
      context: "Psalm 46 names trouble, fear, shaking, and nations in uproar, yet confesses God as refuge and present help.",
      body: "This Psalm does not pretend the world is quiet. Its comfort is that God is refuge, strength, and present help in trouble. Grief can feel like the earth giving way, but the Lord of hosts remains with His people.",
      observationQuestion: "What instability is described, and what is confessed about God?",
      reflectionQuestion: "What trouble feels loud today, and what does this Psalm say is truer than that trouble?",
      prayer: "God, be my refuge and strength today. Teach me to trust Your presence more than the noise around me.",
      gentleAction: "Repeat, 'God is our refuge and strength,' slowly three times.",
      studyMethod: "COMA",
      careNote: carePlanPastoralNote
    }),
    "Psalm 73:23-28": guidedDevotional({
      title: "God is my portion",
      context: "Psalm 73 moves from confusion and envy into renewed nearness to God.",
      body: "The Psalmist discovers that even when heart and flesh fail, God is the strength of the heart and portion forever. Comfort rests in having God Himself, not in having every question resolved. Nearness to God becomes the good that grief cannot finally take away.",
      observationQuestion: "What does the Psalmist say about God when heart and flesh fail?",
      reflectionQuestion: "What loss or confusion needs the promise that God is your portion?",
      prayer: "Lord, hold me by Your hand and be the strength of my heart.",
      gentleAction: "Name one question you cannot resolve and one truth about God you can hold.",
      studyMethod: "Inductive",
      careNote: carePlanPastoralNote
    }),
    "Isaiah 40:27-31": guidedDevotional({
      title: "Strength renewed",
      context: "Isaiah speaks to weary people who wonder if their way is hidden from the Lord.",
      body: "God does not grow faint, and He gives power to the weary. Waiting on Him is not empty delay; it is dependence on the everlasting God. The weary are not scolded for needing strength; they are invited to receive it from Him.",
      observationQuestion: "What does Isaiah say about God's strength and the weary?",
      reflectionQuestion: "Where are you weary enough to need strength that only God can give?",
      prayer: "Everlasting God, renew my strength as I wait for You.",
      gentleAction: "Take one slow breath and ask God for strength for the next faithful step.",
      studyMethod: "SOAP",
      careNote: carePlanPastoralNote
    }),
    "Isaiah 43:1-7": guidedDevotional({
      title: "Called by name",
      context: "The Lord comforts His people with redemption, belonging, and promised presence through waters and fire.",
      body: "Isaiah 43 comforts with belonging: 'I have called you by name; you are Mine.' Waters and fire are named, but God's presence is promised through them. The Lord's redeeming love is stronger than the threatening flood.",
      observationQuestion: "What does God say about belonging, waters, fire, and His presence?",
      reflectionQuestion: "What water or fire do you need to face with the words, 'You are Mine'?",
      prayer: "Redeeming Lord, help me trust Your presence and love in the deep waters.",
      gentleAction: "Write your name beside the phrase, 'You are Mine,' as a reminder of belonging.",
      studyMethod: "OIA",
      careNote: carePlanPastoralNote
    }),
    "Lamentations 3:19-26": guidedDevotional({
      title: "Mercies each morning",
      context: "Lamentations remembers affliction and bitterness, then turns toward God's steadfast love, mercy, and faithfulness.",
      body: "Hope appears in the middle of remembered pain, not after it is erased. The turning point is God's steadfast love, mercy, and faithfulness. Waiting quietly for the Lord is possible because His compassion is not exhausted.",
      observationQuestion: "What painful memories are named, and what truths does the writer call to mind?",
      reflectionQuestion: "What sorrow needs to be held together with the truth that His mercies are new?",
      prayer: "Faithful God, meet me with mercy today and teach me to wait for You.",
      gentleAction: "At the start of the day, name one mercy however small.",
      studyMethod: "Meditation",
      careNote: carePlanPastoralNote
    }),
    "Matthew 5:1-12": guidedDevotional({
      title: "Blessed are those who mourn",
      context: "Jesus opens the Sermon on the Mount by announcing kingdom blessing to the poor in spirit, mourners, the meek, and others.",
      body: "Jesus does not call mourners blessed because grief feels good, but because the kingdom of heaven belongs to those who receive God's comfort. Mourning is not outside His blessing. In Christ, sorrow is seen by God and held in hope.",
      observationQuestion: "Who does Jesus call blessed, and what promises are attached?",
      reflectionQuestion: "Where do you need Jesus' promise of comfort for mourners?",
      prayer: "Lord Jesus, meet my mourning with the comfort of Your kingdom.",
      gentleAction: "Let the words 'they will be comforted' become a short prayer today.",
      studyMethod: "COMA",
      careNote: carePlanPastoralNote
    }),
    "John 11:32-44": guidedDevotional({
      title: "Jesus wept",
      context: "At Lazarus' tomb, Jesus meets grief with tears, prayer, authority, and resurrection power.",
      body: "Jesus reveals both compassion and authority. He weeps with those who weep, and He calls the dead man out. Christian comfort does not choose between tears and resurrection hope; Jesus brings both together.",
      observationQuestion: "How does Jesus respond emotionally and actively at the tomb?",
      reflectionQuestion: "What grief needs the compassion of Jesus and the hope of His resurrection power?",
      prayer: "Lord Jesus, meet me in grief, strengthen my hope, and keep me near the resurrection life that is in You.",
      gentleAction: "Tell Jesus plainly what makes you weep, trusting that He is not unmoved.",
      studyMethod: "OIA",
      careNote: carePlanPastoralNote
    }),
    "Romans 8:18-25": guidedDevotional({
      title: "Future glory",
      context: "Paul places present suffering within the larger hope of creation's renewal and the redemption to come.",
      body: "Creation groans, believers groan, and yet hope waits for redemption. Comfort does not deny pain; it gives pain a horizon because God will complete His work. Christian hope is patient because future glory is not fragile.",
      observationQuestion: "What groaning and what hope does Paul describe?",
      reflectionQuestion: "What present suffering needs to be held in the hope of future glory?",
      prayer: "Lord, help me wait with hope for the redemption You have promised.",
      gentleAction: "Name one present groan and one future hope from this passage.",
      studyMethod: "Inductive",
      careNote: carePlanPastoralNote
    }),
    "2 Corinthians 1:3-7": guidedDevotional({
      title: "God of all comfort",
      context: "Paul praises the Father of mercies and God of all comfort in the middle of affliction.",
      body: "God comforts us in affliction so that comfort can overflow to others. Suffering is not good in itself, but God's mercy is active in it and can make us instruments of His comfort. Comfort received from God can become gentleness toward another.",
      observationQuestion: "How does Paul describe God, affliction, comfort, and sharing comfort?",
      reflectionQuestion: "Where have you received comfort that may one day help you comfort another?",
      prayer: "Father of mercies, comfort me and make me gentle with others in pain.",
      gentleAction: "Receive comfort today before trying to explain or fix everything.",
      studyMethod: "SOAP",
      careNote: carePlanPastoralNote
    }),
    "Revelation 21:1-5": guidedDevotional({
      title: "Every tear wiped away",
      context: "Revelation 21 looks to new creation, God dwelling with His people, and the end of death, mourning, crying, and pain.",
      body: "This promise does not trivialize today's sorrow; it assures you that sorrow will not have the last word. God Himself will wipe every tear away and make all things new. Grief is held inside a story that ends with God's presence and restoration.",
      observationQuestion: "What does John see, and what does God promise to remove and make new?",
      reflectionQuestion: "What tear needs to be held before the God who will make all things new?",
      prayer: "Lord, keep my hope fixed on the day when You wipe every tear away.",
      gentleAction: "Hold one grief before God and say, 'This will not have the last word.'",
      studyMethod: "Meditation",
      careNote: carePlanPastoralNote
    })
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
    ["Psalm 46", "Psalms", 46, "Be still before God"],
    ["Psalm 51", "Psalms", 51],
    ["Psalm 91", "Psalms", 91],
    ["Psalm 103", "Psalms", 103]
  ], "Prayer")),
  withCuratedDevotionals(planFromReferences("fourteen-days-proverbs", "14 Days in Proverbs", "Two weeks of practical wisdom for daily decisions.", [
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
  ], "Wisdom")),
  withCuratedDevotionals(planFromReferences("fourteen-days-life-of-jesus", "14 Days on the Life of Jesus", "A focused two-week path through Jesus' life, teaching, death, and resurrection.", [
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
  ], "Gospels")),
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
  withCuratedDevotionals(planFromReferences("holy-week-passion-week", "Holy Week / Passion Week", "Walk through the final week, cross, and resurrection of Jesus.", [
    ["Matthew 21", "Matthew", 21, "Palm Sunday"],
    ["Matthew 22", "Matthew", 22, "Questions and teaching"],
    ["Matthew 26", "Matthew", 26, "Gethsemane"],
    ["John 13", "John", 13, "Servant love"],
    ["John 17", "John", 17, "Jesus prays"],
    ["John 19", "John", 19, "The cross"],
    ["John 20", "John", 20, "The resurrection"]
  ], "Gospels")),
  withCuratedDevotionals(planFromReferences("advent-readings", "Advent readings", "Readings that trace promise, hope, and the coming of Christ.", [
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
  ], "Gospels")),
  withCuratedDevotionals(planFromReferences("easter-resurrection-readings", "Easter / Resurrection readings", "Readings that focus on the resurrection and the hope it brings.", [
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
  ], "Gospels")),
  withCuratedDevotionals(planFromReferences("life-of-jesus", "Life of Jesus", "Key readings from the birth, ministry, death, and resurrection of Jesus.", [
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
  ], "Gospels")),
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
