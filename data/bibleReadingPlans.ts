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
  guidanceKind?: "guided-devotional" | "reading-guidance";
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
  previewDayNumber?: number;
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
  | "guidanceKind"
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
    guidanceKind: "reading-guidance",
    context: `This reflection day returns to ${reference} so the passage can settle rather than simply be checked off. Read it again in its book context, watching for repeated words, commands, promises, warnings, and what the passage reveals about the Lord before moving to application.`,
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
    rhythm: plan.rhythm || "Read the passage, consider the devotional, reflect and pray, then complete the day when you are ready.",
    sampleDayNumbers: plan.sampleDayNumbers || sampleDayNumbersFor(plan.days.length)
  };
}

export function getBibleReadingPlanDetails(plan: BibleReadingPlan) {
  const enriched = enrichPlanMetadata(plan);
  const sampleNumbers = enriched.sampleDayNumbers || sampleDayNumbersFor(enriched.days.length);
  const sampleReadings = sampleNumbers
    .map((dayNumber) => enriched.days.find((day) => day.day === dayNumber))
    .filter((day): day is BibleReadingPlanDay => !!day);
  const previewDay =
    enriched.days.find((day) => day.day === enriched.previewDayNumber && hasCompleteDayPreview(day)) ||
    enriched.days.find(hasCompleteDayPreview) ||
    enriched.days[0];

  return {
    purpose: enriched.purpose || "",
    bestFor: enriched.bestFor || "",
    pace: enriched.pace || "",
    estimatedTime: enriched.estimatedTime || "",
    coverage: enriched.coverage || "",
    rhythm: enriched.rhythm || "",
    careNote: enriched.careNote || "",
    sampleReadings,
    previewDay
  };
}

function hasCompleteDayPreview(day: BibleReadingPlanDay) {
  return !!(
    day.guidanceKind === "guided-devotional" &&
    day.context &&
    day.devotional?.title &&
    day.devotional.body &&
    day.observationQuestion &&
    (day.reflectionQuestion || day.reflectionPrompt) &&
    (day.prayer || day.prayerPrompt) &&
    day.gentleAction &&
    day.studyMethod
  );
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
    guidanceKind: extras.guidanceKind || "guided-devotional",
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

const anxietyPastoralCareNote =
  "Anxiety is not a sign that you have failed spiritually. Scripture can accompany you through worry and distress, but this plan is not a substitute for appropriate pastoral, medical, or mental-health care. If anxiety is persistent, severe, or leaves you feeling unsafe or unable to cope, contact a trusted person and suitable local support.";

const griefPastoralCareNote =
  "Grief is not a sign that you have failed spiritually, and it does not follow a fixed timetable. Scripture can accompany you in sorrow, but this plan is not a substitute for appropriate personal, pastoral, medical, or mental-health support. If you feel unsafe or unable to cope, contact a trusted person and suitable local support.";

const carePlanPastoralNote = anxietyPastoralCareNote;

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

function withPastoralCareNote(plan: BibleReadingPlan, careNote: string): BibleReadingPlan {
  return {
    ...plan,
    careNote: plan.careNote || careNote,
    days: plan.days.map((day) => ({
      ...day,
      careNote: day.careNote || careNote
    }))
  };
}

const psalm46StillBeforeGodDevotional = devotional(
  "Be still before the God who reigns",
  "Psalm 46 does not pretend the world is calm. The earth gives way, nations rage, and kingdoms totter, yet the Lord of hosts is present with His city and rules over the nations. The call to be still, or cease, most likely rebukes hostile nations, while God's people hear the Lord's universal rule and exaltation.",
  "What fear, conflict, or false security needs to be answered by the Lord's presence and rule?",
  "Lord of hosts, help me know that You are present with Your people and exalted over the nations.",
  {
    context: "Psalm 46 is a Korahite Song of Zion. It pictures cosmic instability, hostile nations, God present with His city, and the Lord's rule over the whole earth. In verse 10, 'be still' or 'cease' most likely rebukes the hostile nations, though some interpreters hear reassurance to Judah. Either way, the emphasis is God's universal rule and exaltation, not private relaxation or passivity."
  }
);

const psalm46RefugeDevotional = devotional(
  "God is refuge in the shaking",
  "Psalm 46 names real instability: trouble, fear, noise, conflict, and upheaval. Its comfort is not that trouble disappears, but that God is with His people in the midst of it. Read the Psalm slowly and notice the repeated confidence: the Lord is refuge, the Lord is with us, and the Lord will be exalted.",
  "What trouble feels loud today, and what does this Psalm say is truer than that trouble?",
  "God, be my refuge and strength today. Teach me to trust Your presence more than the noise around me.",
  {
    context: "Psalm 46 is a communal song of confidence, not a denial that trouble exists. It names shaking creation and unstable nations, then repeats the deeper assurance that the Lord of hosts is with His people. Refuge rests in God's presence and rule."
  }
);

type CuratedDevotionalMap = Record<string, Record<string, BibleReadingPlanDayExtras>>;

const lifeOfJesusDevotionals: Record<string, BibleReadingPlanDayExtras> = {
  "Luke 2": guidedDevotional({
    title: "The Savior is born",
    context: "Luke places Jesus' birth in ordinary history: a census, Bethlehem, a manger, and shepherds keeping watch. The scene joins David's city, angelic announcement, and humble sign so the reader sees the promised Savior arriving in lowliness rather than royal display.",
    body: "The promised Savior comes with deep humility. Heaven announces Him as Savior, Christ, and Lord, yet the sign is a baby lying in a manger. This passage invites you to see God's glory in the humility of Christ and to receive the good news with worship rather than mere sentiment.",
    observationQuestion: "What titles are given to Jesus, and what sign are the shepherds told to look for?",
    reflectionQuestion: "Where do you need to receive Christ's humble nearness as good news today?",
    prayer: "Lord Jesus, help me worship You as Savior, Christ, and Lord, and receive Your humble nearness with joy.",
    gentleAction: "Write down one title for Jesus from the passage and carry it into prayer today.",
    studyMethod: "OIA"
  }),
  "Matthew 3": guidedDevotional({
    title: "The beloved Son",
    context: "Jesus comes to John at the Jordan, where people are confessing sin and being baptized. His baptism identifies Him with the people He came to save, reveals Father, Son, and Spirit, and introduces His public ministry as the beloved Son who fulfills righteousness.",
    body: "Jesus has no sin to confess, yet He stands with His people in the waters. The Father delights in Him, and the Spirit rests upon Him. Before Jesus' public ministry unfolds, the passage shows who He is: the beloved Son who fulfills righteousness and acts in the pleasure of the Father.",
    observationQuestion: "What does Jesus say about His baptism, and what does the Father say about Him?",
    reflectionQuestion: "How does the Father's delight in the Son steady your view of Jesus' mission?",
    prayer: "Father, help me behold Your beloved Son with reverence, trust, and joy.",
    gentleAction: "Pause over the words 'My beloved Son' and let them shape your worship.",
    studyMethod: "SOAP"
  }),
  "Matthew 4": guidedDevotional({
    title: "Faithful in temptation",
    context: "After His baptism, Jesus is led by the Spirit into the wilderness and tempted by the devil. Matthew echoes Israel's wilderness testing, but Jesus answers with Scripture and remains faithful where God's people had repeatedly failed.",
    body: "Jesus answers temptation with Scripture and faithful dependence on the Father. Where Israel failed in the wilderness, the Son remains obedient. He refuses to use His identity for self-protection, spectacle, or false worship. His victory teaches you to trust God's Word when pressure tries to bend your desires.",
    observationQuestion: "What does each temptation offer, and how does Jesus answer it?",
    reflectionQuestion: "Where do you need Scripture to reorder desire, fear, or ambition?",
    prayer: "Lord Jesus, train me to trust Your Word and resist every path that leads away from the Father.",
    gentleAction: "Choose one sentence from Jesus' replies and pray it before a likely temptation today.",
    studyMethod: "COMA"
  }),
  "Matthew 5": guidedDevotional({
    title: "Kingdom life",
    context: "Matthew 5 begins the Sermon on the Mount, where Jesus teaches His disciples the character of kingdom life. The Beatitudes and heart-level commands show the righteousness of the kingdom under the authority of the King who has come near.",
    body: "Jesus does not describe a shallow spirituality. He blesses the poor in spirit, the meek, the merciful, and the persecuted, then calls His people to visible righteousness from the heart. The passage presses beyond appearance and into a life formed by the King Himself.",
    observationQuestion: "What kind of people does Jesus call blessed, and what kind of righteousness does He describe?",
    reflectionQuestion: "Which part of Jesus' kingdom teaching exposes an area that needs His formation?",
    prayer: "King Jesus, form Your character in me and make my life a faithful witness to Your kingdom.",
    gentleAction: "Pick one beatitude and ask how it could shape one interaction today.",
    studyMethod: "Inductive"
  }),
  "Mark 2": guidedDevotional({
    title: "Authority and mercy",
    context: "Mark gathers scenes where Jesus forgives, heals, calls Levi, eats with sinners, and teaches about Sabbath mercy. Each controversy presses the same question: who has authority to forgive, redefine uncleanness, and bring mercy into places guarded by religious suspicion?",
    body: "Jesus' authority is not cold power; it is mercy that restores. He forgives sins, calls the unlikely, and challenges religious hardness. The chapter asks you to see Him as the Son of Man with authority to forgive and as the Physician who comes for the sick.",
    observationQuestion: "How do people respond to Jesus' authority and mercy in this chapter?",
    reflectionQuestion: "Where do you need to come to Jesus honestly as one who needs mercy?",
    prayer: "Lord Jesus, forgive, heal, and reorder my heart by Your merciful authority.",
    gentleAction: "Name one place where you need mercy rather than image-management.",
    studyMethod: "OIA"
  }),
  "Luke 15": guidedDevotional({
    title: "The Father's joy",
    context: "Jesus tells these parables in response to grumbling that He welcomes sinners and eats with them. The lost sheep, coin, and son answer that complaint by revealing the Father's joy over repentance and exposing resentment toward mercy.",
    body: "The lost sheep, lost coin, and lost son reveal the joy of God in restoring the lost. Jesus does not minimize sin, but He magnifies grace. The elder brother's resentment warns against hearts that resent mercy while standing close to the house.",
    observationQuestion: "What is lost, what is found, and what joy follows in each parable?",
    reflectionQuestion: "Do you most need to return, rejoice, or repent of resentment today?",
    prayer: "Father, bring me home to Your mercy and teach me to rejoice when others receive it too.",
    gentleAction: "Pray by name for someone who needs to know the Father's welcome.",
    studyMethod: "COMA"
  }),
  "John 6": guidedDevotional({
    title: "The bread of life",
    context: "After feeding the crowd, Jesus teaches that the sign points beyond bread to Himself. John places the miracle and discourse together so physical hunger becomes a doorway to Jesus' claim that He is the bread who gives life to the world.",
    body: "Jesus does not merely provide bread; He is the Bread of Life. The crowd wants another sign and another meal, but Jesus calls them to come to Him and believe. The passage turns appetite into invitation: lasting life is found in Christ Himself.",
    observationQuestion: "How does Jesus move the crowd from physical bread to Himself?",
    reflectionQuestion: "Where are you seeking gifts from Jesus while needing to come to Jesus Himself?",
    prayer: "Lord Jesus, satisfy me with Yourself and teach me to seek the life that only You give.",
    gentleAction: "Before one meal today, thank Christ as the giver and sustainer of true life.",
    studyMethod: "Word study"
  }),
  "John 10": guidedDevotional({
    title: "The Good Shepherd",
    context: "Jesus uses shepherd imagery to describe His relationship to His sheep and His coming death. In contrast to thieves and hired hands, He presents Himself as the Good Shepherd who knows, gathers, protects, and lays down His life willingly.",
    body: "The Good Shepherd knows His sheep, calls them by name, protects them, and lays down His life for them. This is not vague comfort; it is costly care. Jesus' sheep are safe because their Shepherd gives Himself for them and holds them in His hand.",
    observationQuestion: "What does Jesus say the Good Shepherd does for His sheep?",
    reflectionQuestion: "Which promise of the Shepherd do you most need to trust today?",
    prayer: "Good Shepherd, help me hear Your voice, trust Your care, and rest in Your keeping.",
    gentleAction: "Repeat one shepherd promise from the passage when you feel scattered today.",
    studyMethod: "Meditation"
  }),
  "John 11": guidedDevotional({
    title: "Resurrection and life",
    context: "Lazarus has died, and Jesus meets Martha and Mary in grief before going to the tomb. The sign comes near the climax of John's Gospel, revealing Jesus as resurrection and life while also showing His tears before human death.",
    body: "Jesus reveals Himself as the resurrection and the life while also weeping with those who grieve. His tears show real compassion; His command at the tomb shows real authority. Hope in this passage is not an idea but a Person standing before death.",
    observationQuestion: "What does Jesus say about Himself, and how does He respond to grief?",
    reflectionQuestion: "Where do you need to trust both the compassion and authority of Jesus?",
    prayer: "Lord Jesus, be my resurrection hope and meet me with Your compassion and power.",
    gentleAction: "Bring one grief or fear of loss honestly to Christ in prayer.",
    studyMethod: "SOAP"
  }),
  "John 13": guidedDevotional({
    title: "Servant love",
    context: "During the last supper, Jesus washes His disciples' feet before teaching them to love one another. John frames the action with Jesus knowing His hour had come, so the foot washing interprets His love as humble, cleansing service before the cross.",
    body: "Jesus knows His hour has come, yet He stoops to serve. The Lord and Teacher takes the servant's place, showing love that cleanses and humbles. His command to love one another is grounded in His own costly, lowly love.",
    observationQuestion: "What does Jesus know, what does He do, and what command does He give?",
    reflectionQuestion: "Where is Jesus' servant love calling you away from pride or self-protection?",
    prayer: "Lord Jesus, wash my pride and teach me to love others from the love You have shown me.",
    gentleAction: "Choose one quiet act of service that reflects Christ's humility.",
    studyMethod: "OIA"
  }),
  "John 17": guidedDevotional({
    title: "Jesus prays for His people",
    context: "Before the cross, Jesus prays to the Father for His disciples and for those who will believe through their word. The prayer gathers the themes of glory, mission, truth, unity, and love as Jesus prepares His people for life in the world after His departure.",
    body: "Jesus prays for glory, eternal life, protection, sanctification, unity, and love. His people are not left to themselves; they are carried in the prayer of the Son to the Father. The passage lets you listen to the heart of Christ for those who belong to Him.",
    observationQuestion: "What does Jesus ask the Father to do for His people?",
    reflectionQuestion: "Which part of Jesus' prayer gives you courage or correction today?",
    prayer: "Lord Jesus, sanctify me in Your truth and keep me in the love of the Father.",
    gentleAction: "Pray one request from John 17 for yourself and one other believer.",
    studyMethod: "COMA"
  }),
  "Matthew 26": guidedDevotional({
    title: "Obedience in sorrow",
    context: "Matthew 26 moves through betrayal, Passover, Gethsemane, arrest, and denial. The chapter holds Jesus' sorrow and obedience together, showing Him willingly receiving the cup while the disciples scatter and human schemes gather around Him.",
    body: "In Gethsemane, Jesus is deeply sorrowful and yet wholly submitted to the Father. His obedience is not detached or easy; it is costly faithfulness under the weight of the coming cross. The passage invites reverent attention to the Savior who says, 'Your will be done.'",
    observationQuestion: "What sorrow, weakness, betrayal, and obedience appear in this chapter?",
    reflectionQuestion: "How does Jesus' costly obedience reshape the way you pray in hardship?",
    prayer: "Lord Jesus, thank You for obeying the Father for us. Teach me trust when obedience is costly.",
    gentleAction: "Pray 'Your will be done' over one area you are tempted to control.",
    studyMethod: "Meditation"
  }),
  "John 19": guidedDevotional({
    title: "It is finished",
    context: "John records Jesus' trial, crucifixion, death, and burial with repeated attention to Scripture being fulfilled. The scene presents the mocked King as sovereign even in suffering, completing the work given by the Father rather than being defeated by Rome or religious opposition.",
    body: "Jesus is mocked as king, lifted up on the cross, and yet remains sovereign in His suffering. His words 'It is finished' announce completion, not defeat. The Lamb gives Himself fully, fulfilling Scripture and accomplishing the work the Father gave Him to do.",
    observationQuestion: "What details show both Jesus' suffering and the fulfillment of Scripture?",
    reflectionQuestion: "What changes when you receive the cross as finished work rather than unfinished striving?",
    prayer: "Lord Jesus, thank You that Your saving work is finished. Help me rest in Your cross with grateful faith.",
    gentleAction: "Write 'It is finished' beside one burden of guilt or striving.",
    studyMethod: "SOAP"
  }),
  "John 20": guidedDevotional({
    title: "The risen Lord",
    context: "John 20 moves from the empty tomb to Jesus appearing to Mary, the disciples, and Thomas. The chapter turns grief, fear, and doubt into witness, peace, and confession so readers may believe that Jesus is the Christ, the Son of God.",
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
    context: "Jesus enters Jerusalem as crowds shout Hosanna, then He enters the temple and confronts fruitless religion. Matthew presents the humble King from Zechariah arriving with royal praise while also judging empty worship and calling for true fruit.",
    body: "Holy Week begins with Jesus openly receiving royal praise, but His kingship is humble, prophetic, and searching. He comes not as a ruler who flatters religious appearances, but as the promised King who exposes what is barren and calls His people to true worship.",
    observationQuestion: "What do the crowds say about Jesus, and what does Jesus confront after entering Jerusalem?",
    reflectionQuestion: "Where might you welcome Jesus publicly while resisting His searching authority privately?",
    prayer: "King Jesus, receive my worship and make my life fruitful before You.",
    gentleAction: "Pray 'Hosanna' slowly and ask where Christ's rule needs to be welcomed today.",
    studyMethod: "COMA"
  }),
  "Matthew 22": guidedDevotional({
    title: "Love God and neighbor",
    context: "Religious leaders test Jesus with questions, and He answers with wisdom about kingdom invitation, allegiance, resurrection, and the greatest commandment. The chapter shows Jesus exposing hostile traps while drawing attention back to God's claim on love, loyalty, and hope.",
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
    context: "Human rebellion brings shame, judgment, and exile, yet God speaks a promise of defeat for the serpent. Advent begins here because the birth of Christ answers the first rupture: sin, death, and the need for the woman's offspring to crush evil.",
    body: "Advent begins where the need for rescue begins. The promise of the woman's offspring does not erase the seriousness of sin, but it plants hope inside judgment. The coming of Christ answers a problem deeper than disappointment: humanity needs a Redeemer.",
    observationQuestion: "What is broken by sin, and what promise does God speak?",
    reflectionQuestion: "How does the first promise of rescue deepen your view of why Christ came?",
    prayer: "Lord God, thank You for promising rescue when humanity could not rescue itself.",
    gentleAction: "Name one place where you need redemption rather than self-repair.",
    studyMethod: "Biblical theology"
  }),
  "Genesis 12": guidedDevotional({
    title: "Blessing for the nations",
    context: "God calls Abram and promises land, descendants, blessing, and blessing for all families of the earth. Advent hope widens through this covenant promise, because the coming Christ carries Abraham's blessing beyond one family to the nations.",
    body: "The hope of Christ is not narrow or accidental. God promises blessing through Abraham that will reach the nations. Advent remembers that Jesus comes as the promised seed through whom God's blessing spreads beyond one family to people from every people and place.",
    observationQuestion: "What does God promise Abram, and who will be blessed through him?",
    reflectionQuestion: "How does God's promise to bless the nations enlarge your worship of Christ?",
    prayer: "God of promise, thank You that Your blessing in Christ reaches the nations.",
    gentleAction: "Pray for one nation, people group, or community to know Christ's blessing.",
    studyMethod: "COMA"
  }),
  "Isaiah 7": guidedDevotional({
    title: "God with us",
    context: "In a time of political fear, Isaiah gives the sign of Immanuel: God with us. The promise confronts Ahaz's unbelief and later becomes part of Matthew's witness that God draws near decisively in the birth of Jesus.",
    body: "Isaiah 7 speaks into fear and unbelief. The sign of Immanuel becomes part of the long hope that God will be with His people in a decisive way. Advent is not simply comfort in the abstract; it is the wonder that God draws near in Christ.",
    observationQuestion: "What fear surrounds the passage, and what sign is given?",
    reflectionQuestion: "Where do you need the promise of God with us to confront fear or unbelief?",
    prayer: "Immanuel, steady my heart with the truth that God has drawn near in Christ.",
    gentleAction: "Write 'God with us' beside one concern you are carrying.",
    studyMethod: "OIA"
  }),
  "Isaiah 9": guidedDevotional({
    title: "A child who reigns",
    context: "Isaiah promises light for people in darkness and a child whose government and peace will not end. The passage holds together royal rule, divine titles, and endless peace, preparing readers to expect a King unlike every failing human ruler.",
    body: "The promised child is more than a symbol of hope. He bears royal names and brings righteous peace. Advent holds together tenderness and majesty: a child is born, a Son is given, and the government rests on His shoulders.",
    observationQuestion: "What darkness is answered, and what names are given to the promised child?",
    reflectionQuestion: "Which name of the promised King do you most need to trust today?",
    prayer: "Wonderful Counselor, Mighty God, Everlasting Father, Prince of Peace, reign in my heart today.",
    gentleAction: "Pray through one title from Isaiah 9 as worship.",
    studyMethod: "Word study"
  }),
  "Isaiah 11": guidedDevotional({
    title: "The righteous Branch",
    context: "Isaiah looks for a shoot from Jesse's line, filled with the Spirit and ruling with righteousness. The hope is Davidic and creation-wide: the coming King judges rightly, protects the vulnerable, and brings peace that reaches the nations.",
    body: "The Messiah brings wisdom, justice, and peace that reaches beyond what human rulers can produce. Isaiah's vision is not mere moral improvement; it is creation renewed under the righteous reign of the Lord's anointed King.",
    observationQuestion: "What does the Spirit give the coming King, and what kind of reign follows?",
    reflectionQuestion: "Where do you long for Christ's righteous peace to make things new?",
    prayer: "Righteous King, rule with wisdom and peace, and teach me to hope in Your renewal.",
    gentleAction: "Pray for one place where righteousness and peace are desperately needed.",
    studyMethod: "Inductive"
  }),
  "Micah 5": guidedDevotional({
    title: "Ruler from Bethlehem",
    context: "Micah promises a ruler from Bethlehem whose origins are ancient and whose greatness reaches to the ends of the earth. The small town is not accidental; it displays God's way of bringing shepherd-like rule from humble places according to His promise.",
    body: "God's promised ruler comes from a small place, yet His rule is everlasting and His care is shepherd-like. Advent teaches you to look for God's saving work where the world may not think to look: in humility, promise, and faithful shepherding.",
    observationQuestion: "What does Micah say about the ruler's origin, rule, and shepherding care?",
    reflectionQuestion: "How does Bethlehem's smallness help you recognize God's way of working?",
    prayer: "Lord, teach me to trust Your promised Shepherd-King even when Your ways appear small.",
    gentleAction: "Thank God for one quiet mercy that reveals His faithful care.",
    studyMethod: "SOAP"
  }),
  "Luke 1": guidedDevotional({
    title: "Mercy remembered",
    context: "Luke 1 announces the births of John and Jesus, and Mary praises God for remembering His mercy. The chapter links Gabriel's announcement, Elizabeth's blessing, and Mary's song to God's covenant faithfulness to Abraham and His mercy to the humble.",
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
    context: "Matthew traces Jesus' genealogy and records the angel's word to Joseph about Mary's child. The names Jesus and Immanuel interpret the birth: this child saves His people from their sins and brings God's presence near.",
    body: "Jesus' name declares His mission: He will save His people from their sins. Matthew also names Him Immanuel, God with us. Advent joy is therefore not vague cheer; it is salvation from sin and God's presence with His people in the Son.",
    observationQuestion: "What names or titles are given to Jesus, and what do they reveal?",
    reflectionQuestion: "How does Jesus' mission to save from sin shape your Advent hope?",
    prayer: "Jesus, Savior and Immanuel, forgive my sin and draw me near to God.",
    gentleAction: "Pray with the name Jesus, thanking Him for saving grace.",
    studyMethod: "SOAP"
  }),
  "Matthew 2": guidedDevotional({
    title: "Worship the newborn King",
    context: "Magi seek Jesus, Herod resists Him, and God protects the child through warning and flight. Matthew places Gentile worship, royal threat, Bethlehem prophecy, and exile imagery together to show the true King opposed yet preserved by God.",
    body: "Matthew 2 contrasts worship and opposition. The nations begin to come to the King, while earthly power feels threatened by Him. The chapter reminds you that Christ's coming calls for costly worship and that God's preserving hand is active even amid danger.",
    observationQuestion: "How do the Magi and Herod respond differently to the birth of Jesus?",
    reflectionQuestion: "Where does Christ's kingship call for worship rather than control?",
    prayer: "King Jesus, receive my worship and loosen my grip on control.",
    gentleAction: "Offer one concrete gift of attention, time, or obedience to Christ today.",
    studyMethod: "COMA"
  }),
  "John 1": guidedDevotional({
    title: "The Word became flesh",
    context: "John begins before creation and announces that the eternal Word became flesh and dwelt among us. Advent wonder is cosmic and personal here: the Maker enters His world, brings light into darkness, and reveals the Father in grace and truth.",
    body: "The child in the manger is the eternal Word through whom all things were made. John holds together glory and nearness: the Word became flesh, full of grace and truth. Advent worship bows before the mystery that God the Son truly came among us.",
    observationQuestion: "What does John say about the Word before describing His becoming flesh?",
    reflectionQuestion: "Where do you need to receive Christ's grace and truth today?",
    prayer: "Word made flesh, fill my heart with wonder at Your glory, grace, and truth.",
    gentleAction: "Read John 1:14 slowly three times and emphasize a different word each time.",
    studyMethod: "Meditation"
  }),
  "Galatians 4": guidedDevotional({
    title: "Sent in the fullness of time",
    context: "Paul explains that God sent His Son to redeem those under the law so they might receive adoption. The timing of Christ's coming serves redemption: slaves become children and the Spirit teaches believers to cry, Abba, Father.",
    body: "Christmas is timed by God's wisdom and aimed at redemption and adoption. The Son is sent so slaves become children and the Spirit teaches them to cry, 'Abba, Father.' Advent hope reaches into identity: in Christ, you are received as God's child.",
    observationQuestion: "Why does Paul say God sent His Son, and what status is given to believers?",
    reflectionQuestion: "Where do you need to live as an adopted child rather than a spiritual orphan?",
    prayer: "Father, thank You for sending Your Son so I may belong to You as Your child.",
    gentleAction: "Pray 'Abba, Father' and name one need honestly before God.",
    studyMethod: "Word study"
  }),
  "Philippians 2": guidedDevotional({
    title: "The humility of Christ",
    context: "Paul calls believers to humility by pointing to Christ's descent, obedience, death, and exaltation. The incarnation is shown as self-giving descent, not seasonal sentiment, and it becomes the pattern for humble love among Christ's people.",
    body: "The incarnation reveals not only that Christ came, but how He came: in humility, servanthood, and obedience to death. The Father exalts Him, and every knee will bow. Advent worship should produce humble love, not merely seasonal feeling.",
    observationQuestion: "What movement do you see from Christ's humility to His exaltation?",
    reflectionQuestion: "Where should Christ's humility reshape your attitude toward others?",
    prayer: "Lord Jesus, humble my heart and teach me to love in the pattern of Your self-giving.",
    gentleAction: "Choose one interaction where you can take the lower place in love.",
    studyMethod: "Inductive"
  }),
  "Revelation 22": guidedDevotional({
    title: "Come, Lord Jesus",
    context: "The Bible ends with the river of life, the tree of life, and the promise that Jesus is coming soon. Advent longing reaches forward here, turning the memory of Christ's first coming into prayer for His return and final renewal.",
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
    context: "Isaiah speaks of the suffering Servant who bears sin, is pierced, and yet sees life beyond His suffering. Easter hope begins before the empty tomb with the Servant's substitution: peace comes through wounds and many are counted righteous through His bearing of iniquity.",
    body: "Isaiah 53 prepares you to see the cross as substitution, not tragedy alone. The Servant suffers for His people, bears their iniquity, and brings peace through His wounds. Easter hope begins with the costly mercy of the suffering Servant.",
    observationQuestion: "What does the Servant suffer, and for whom does He suffer?",
    reflectionQuestion: "How does Christ bearing sin change the way you bring guilt or shame to God?",
    prayer: "Lord Jesus, thank You for bearing sin and bringing peace through Your wounds.",
    gentleAction: "Confess one sin honestly and receive the mercy of Christ.",
    studyMethod: "SOAP"
  }),
  "Matthew 28": guidedDevotional({
    title: "He has risen",
    context: "Women come to the tomb, hear the angel's announcement, meet the risen Jesus, and receive a commission. Matthew pairs resurrection worship with mission, ending his Gospel with Jesus' authority and presence for disciple-making among the nations.",
    body: "The resurrection is announced with clarity: He is not here; He has risen. Fear gives way to worship and mission. The risen Jesus sends His disciples with authority, presence, and a command to make disciples of all nations.",
    observationQuestion: "What message is given at the tomb, and what command does Jesus give His disciples?",
    reflectionQuestion: "Where should resurrection hope turn fear into worship or witness?",
    prayer: "Risen Lord, fill me with worship and courage to live as Your disciple.",
    gentleAction: "Tell one person or write one sentence about why the resurrection matters.",
    studyMethod: "COMA"
  }),
  "Mark 16": guidedDevotional({
    title: "Alarm and announcement",
    context: "The women come to anoint Jesus and find the stone rolled away and the tomb empty. Mark's terse ending presses the reader into the alarm and wonder of the announcement: the crucified Jesus is risen and His followers must go and tell.",
    body: "Mark's resurrection account confronts human fear with divine announcement. The crucified Jesus is risen, and His followers are called to go and tell. The passage does not ask you to manufacture confidence; it asks you to hear the announcement and respond.",
    observationQuestion: "What do the women expect, what do they find, and what message are they given?",
    reflectionQuestion: "What fear needs to be answered by the announcement that Jesus is risen?",
    prayer: "Lord Jesus, meet my fear with the truth of Your resurrection.",
    gentleAction: "Repeat the words 'He has risen' when fear feels louder than faith.",
    studyMethod: "OIA"
  }),
  "Luke 24": guidedDevotional({
    title: "Opened eyes and burning hearts",
    context: "Luke 24 moves from the empty tomb to the Emmaus road and Jesus opening the Scriptures to His disciples. The risen Christ teaches that His suffering and glory were not a detour but the fulfillment of Moses, the Prophets, and the Psalms.",
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
    context: "The risen Jesus meets His disciples by the sea, provides breakfast, and restores Peter. John's epilogue shows resurrection grace after failure: the Shepherd feeds His servants, restores love, and renews Peter's call to follow.",
    body: "Jesus restores Peter not by ignoring his failure, but by drawing love and calling from him again. The risen Lord feeds, forgives, and commissions. Easter grace restores failed disciples into renewed love and faithful service.",
    observationQuestion: "How does Jesus care for the disciples and restore Peter?",
    reflectionQuestion: "Where do you need the risen Jesus to restore love after failure?",
    prayer: "Lord Jesus, restore my love for You and teach me to follow You faithfully.",
    gentleAction: "Answer Jesus' question, 'Do you love Me?' in prayer with honesty.",
    studyMethod: "SOAP"
  }),
  "Acts 2": guidedDevotional({
    title: "The risen Christ proclaimed",
    context: "At Pentecost, Peter proclaims that God raised Jesus and made Him both Lord and Christ. The Spirit's arrival, the multilingual witness, and Peter's sermon show the exalted Jesus pouring out the promised Spirit and calling hearers to repentance.",
    body: "The resurrection becomes public proclamation. Peter announces that the crucified Jesus is risen, exalted, and reigning. The right response is repentance, faith, baptism, and life among God's people under the gift of the Spirit.",
    observationQuestion: "What does Peter say God has done with Jesus?",
    reflectionQuestion: "How should Jesus' resurrection and lordship shape your repentance and witness?",
    prayer: "Lord Jesus, rule over me by Your Spirit and make me bold in faithful witness.",
    gentleAction: "Pray for courage to speak of Christ clearly and humbly.",
    studyMethod: "Inductive"
  }),
  "Acts 4": guidedDevotional({
    title: "No other name",
    context: "Peter and John testify before leaders after healing a man in Jesus' name. The council's opposition highlights the apostles' bold claim that the rejected stone has become the cornerstone and that salvation is found in no other name.",
    body: "The apostles do not present Jesus as one spiritual option among many. The rejected stone has become the cornerstone, and salvation is found in no other name. Resurrection confidence produces humble boldness before opposition.",
    observationQuestion: "What claims are made about Jesus' name and salvation?",
    reflectionQuestion: "Where do you need Spirit-given courage to hold fast to Christ?",
    prayer: "Lord Jesus, keep me faithful to Your name with courage, humility, and love.",
    gentleAction: "Pray Acts 4:12 as a confession of trust in Christ.",
    studyMethod: "COMA"
  }),
  "Romans 6": guidedDevotional({
    title: "Raised to new life",
    context: "Paul explains that believers are united with Christ in His death and resurrection. Easter becomes personal and ethical here: those joined to Christ are no longer enslaved to sin and are called to walk in newness of life.",
    body: "The resurrection is not only something to believe about Jesus; it is the life believers share in Him. United to Christ, you are no longer to live as a slave to sin. Easter power means walking in newness of life.",
    observationQuestion: "What does Paul say happened to believers with Christ?",
    reflectionQuestion: "What would it look like to walk in newness of life today?",
    prayer: "Lord Jesus, make Your resurrection life visible in my desires, choices, and habits.",
    gentleAction: "Identify one old pattern to resist and one new obedience to practice.",
    studyMethod: "OIA"
  }),
  "Romans 8": guidedDevotional({
    title: "Life in the Spirit",
    context: "Romans 8 describes life in Christ, the Spirit's work, present suffering, future glory, and God's inseparable love. Resurrection hope stretches from no condemnation to bodily redemption, assuring believers that suffering cannot sever them from Christ.",
    body: "Because of Christ, there is no condemnation for those who are in Him. The Spirit gives life, helps weakness, and anchors hope as believers wait for glory. Resurrection hope does not erase suffering, but it assures you that nothing can separate you from God's love in Christ.",
    observationQuestion: "What does Romans 8 say the Spirit does for those who belong to Christ?",
    reflectionQuestion: "Which promise in this chapter needs to steady your hope today?",
    prayer: "Spirit of God, lead me in life, help me in weakness, and anchor me in Christ's love.",
    gentleAction: "Choose one promise from Romans 8 and keep it visible today.",
    studyMethod: "SOAP"
  }),
  "1 Corinthians 15": guidedDevotional({
    title: "If Christ has been raised",
    context: "Paul defends the resurrection and explains why Christ's resurrection is central to Christian hope. The argument moves from eyewitness testimony to future resurrection and present steadfastness, making the empty tomb essential to faith and labor.",
    body: "Paul makes the resurrection essential, not optional. If Christ is not raised, faith is empty; but Christ has been raised, the firstfruits of those who sleep. This hope gives courage for steadfast, meaningful labor in the Lord.",
    observationQuestion: "What consequences does Paul name if Christ is not raised, and what hope follows because He is raised?",
    reflectionQuestion: "How does resurrection hope make faithfulness worth it today?",
    prayer: "Risen Christ, make me steadfast and full of hope because Your resurrection is sure.",
    gentleAction: "Do one small act of faithful service as work that is not in vain.",
    studyMethod: "Inductive"
  }),
  "1 Peter 1": guidedDevotional({
    title: "Born again to living hope",
    context: "Peter writes to suffering believers and begins with praise for new birth through Jesus' resurrection. Living hope is not optimism; it is an imperishable inheritance guarded by God while faith is refined through real trials.",
    body: "The resurrection gives believers a living hope and an imperishable inheritance. Trials are real, but they are not ultimate. Faith is refined, Christ is loved though unseen, and salvation is guarded by God's power.",
    observationQuestion: "What blessings flow from the resurrection of Jesus in this passage?",
    reflectionQuestion: "Where do you need living hope to steady you in trial or uncertainty?",
    prayer: "Father, strengthen my living hope through the resurrection of Jesus Christ.",
    gentleAction: "Name one hope in Christ that cannot perish, spoil, or fade.",
    studyMethod: "Meditation"
  }),
  "Revelation 1": guidedDevotional({
    title: "The Living One",
    context: "John sees the risen and glorified Christ, who declares that He was dead and is alive forevermore. Easter hope appears as awe before the Living One who holds the keys of Death and Hades and speaks to His churches.",
    body: "The risen Jesus is not fragile or distant. He is the Living One, holding authority over death and Hades. Easter hope matures into awe: the crucified and risen Christ reigns in glory and speaks to His churches.",
    observationQuestion: "How is Jesus described in John's vision?",
    reflectionQuestion: "How does seeing Jesus as the Living One reshape fear of death or uncertainty?",
    prayer: "Living Lord Jesus, fill me with reverent trust in Your victory and authority.",
    gentleAction: "Pray Revelation 1:17-18 as worship and courage.",
    studyMethod: "OIA"
  }),
  "Revelation 21": guidedDevotional({
    title: "Every tear wiped away",
    context: "John sees the new heaven and new earth, where God dwells with His people and makes all things new. Resurrection hope reaches its horizon as death, mourning, crying, and pain pass away under God's final renewing presence.",
    body: "Resurrection hope ends in renewal. Death, mourning, crying, and pain do not have the final word. The God who raised Jesus will make all things new and dwell with His people forever.",
    observationQuestion: "What former things pass away, and what does God promise to make new?",
    reflectionQuestion: "Which sorrow needs to be held in the light of God's promised renewal?",
    prayer: "God of resurrection hope, keep my heart anchored in the day when You make all things new.",
    gentleAction: "Bring one sorrow to God and answer it with the words, 'I am making all things new.'",
    studyMethod: "Meditation"
  })
};

const lifeOfDavidDevotionals: Record<string, BibleReadingPlanDayExtras> = {
  "1 Samuel 16": guidedDevotional({
    title: "The Lord looks at the heart",
    context: "Samuel is sent to Bethlehem to anoint the king God has chosen from Jesse's sons. The chapter comes after Saul's rejection, so David's anointing quietly introduces God's chosen king while the Spirit departs from Saul and rests on David.",
    body: "David's story begins with God's seeing. The impressive sons pass before Samuel, but the Lord is not bound by outward appearance. David is chosen by grace and prepared by the Spirit. This passage teaches that God's purposes are not measured by human visibility or status.",
    observationQuestion: "What does the Lord tell Samuel about outward appearance and the heart?",
    reflectionQuestion: "Where are you tempted to measure yourself or others by what people can see?",
    prayer: "Lord, shape my heart before You and free me from judging by outward appearance.",
    gentleAction: "Ask God to make one hidden part of your life faithful before Him.",
    studyMethod: "OIA"
  }),
  "1 Samuel 17": guidedDevotional({
    title: "Courage rooted in the Lord",
    context: "David faces Goliath while Israel's army is afraid and Saul's armor does not fit him. The battle contrasts Saul-like fear with David's confidence that the Lord's name and covenant honor matter more than the giant's weapons or size.",
    body: "David's courage is not confidence in himself. He remembers the Lord's past deliverance and trusts that the battle belongs to Him. The passage is not mainly about becoming a hero; it points to faith that sees the Lord as greater than the enemy.",
    observationQuestion: "What does David say about the Lord before facing Goliath?",
    reflectionQuestion: "What fear needs to be placed under the truth that the battle belongs to the Lord?",
    prayer: "Lord, give me courage rooted in Your faithfulness, not in my own strength.",
    gentleAction: "Name one fear and one past mercy of God beside it.",
    studyMethod: "COMA"
  }),
  "1 Samuel 18": guidedDevotional({
    title: "Faithfulness under jealousy",
    context: "David succeeds, Jonathan loves him, and Saul grows jealous and afraid. The chapter follows Goliath's defeat and shows two responses to God's favor on David: Jonathan's covenant love and Saul's threatened, murderous envy.",
    body: "David's rise exposes Saul's insecurity. Jealousy turns Saul against the one God is blessing, while Jonathan responds with covenant love. The chapter invites you to notice how the heart responds when God blesses another person.",
    observationQuestion: "How do Saul and Jonathan respond differently to David?",
    reflectionQuestion: "Where do you need to resist jealousy and practice covenant love or contentment?",
    prayer: "Lord, guard my heart from jealousy and teach me to rejoice in Your work in others.",
    gentleAction: "Encourage one person today without needing their place or recognition.",
    studyMethod: "SOAP"
  }),
  "1 Samuel 24": guidedDevotional({
    title: "Mercy in the cave",
    context: "David has an opportunity to kill Saul, but he refuses to seize the throne by violence. The cave scene tests whether David will trust the Lord's timing for the kingdom or grasp the promise through revenge against the Lord's anointed.",
    body: "David trusts God's timing enough to show mercy when revenge is available. He does not deny Saul's wrongdoing, but he refuses to take judgment into his own hands. The passage teaches restraint, reverence, and patient trust under injustice.",
    observationQuestion: "What opportunity does David have, and why does he refuse to take it?",
    reflectionQuestion: "Where are you tempted to force an outcome instead of trusting God's timing?",
    prayer: "Lord, teach me patient mercy and keep me from grasping what You have not given.",
    gentleAction: "Pray for restraint in one situation where you feel wronged.",
    studyMethod: "OIA"
  }),
  "2 Samuel 5": guidedDevotional({
    title: "Shepherding God's people",
    context: "David is made king over Israel, and the people name his call to shepherd and lead them. After years of conflict, the tribes gather around David, and Jerusalem becomes central to a reign meant to shepherd God's people under the Lord.",
    body: "David's kingship is described in shepherd language. Authority is not given for self-importance but for faithful care. David's reign points beyond itself to the greater Son of David, Jesus, whose rule perfectly shepherds God's people.",
    observationQuestion: "What reasons do the tribes give for coming to David as king?",
    reflectionQuestion: "How should responsibility be shaped by shepherd-like care rather than status?",
    prayer: "Lord, make every responsibility I carry an act of faithful service before You.",
    gentleAction: "Identify one person or task you can serve rather than control today.",
    studyMethod: "Biblical theology"
  }),
  "2 Samuel 6": guidedDevotional({
    title: "Reverent joy",
    context: "David brings the ark toward Jerusalem, and the chapter holds together holy reverence and public joy. Uzzah's death and David's dancing must be read together: the Lord's presence is not manageable, yet His presence among His people is cause for humbled gladness.",
    body: "The ark reminds Israel that God's presence is holy, not manageable. David's worship becomes joyful, embodied, and humble, yet the chapter warns against treating the Lord casually. True worship holds reverence and gladness together.",
    observationQuestion: "What moments in the chapter reveal both holiness and joy?",
    reflectionQuestion: "Does your worship need deeper reverence, freer joy, or both?",
    prayer: "Holy Lord, teach me to worship You with reverence, joy, and humility.",
    gentleAction: "Offer one simple act of worship today without performing for others.",
    studyMethod: "Inductive"
  }),
  "2 Samuel 7": guidedDevotional({
    title: "God builds the house",
    context: "David wants to build a house for the Lord, but God promises to build David's house instead. The covenant promise shifts the focus from David's temple plans to God's initiative, promising an enduring throne that later biblical hope attaches to the Son of David.",
    body: "Grace reverses David's plan. David wants to do something great for God, but God gives a covenant promise that reaches forward to an everlasting kingdom. This promise finds its fulfillment in Christ, the Son of David whose throne endures forever.",
    observationQuestion: "What does David want to build, and what does God promise to build?",
    reflectionQuestion: "Where do you need to receive God's promise before trying to prove yourself by service?",
    prayer: "Lord, thank You that Your promises are greater than my plans. Keep me resting in Christ the King.",
    gentleAction: "Write one promise of God that is stronger than your best effort.",
    studyMethod: "Biblical theology"
  }),
  "2 Samuel 11": guidedDevotional({
    title: "The danger of hidden sin",
    context: "David remains in Jerusalem, takes Bathsheba, and arranges Uriah's death to cover his sin. The chapter deliberately exposes royal abuse, secrecy, and violence, interrupting David's victories with the sober truth that even the king needs judgment and mercy.",
    body: "This chapter does not excuse David. Power, desire, deceit, and violence are exposed with painful clarity. Scripture tells the truth about human sin so that repentance is possible and so that hope rests in God's mercy, not in human heroes.",
    observationQuestion: "What steps does David take as sin deepens and spreads?",
    reflectionQuestion: "What warning does this chapter give about secrecy, power, or unchecked desire?",
    prayer: "Merciful God, expose what needs to be brought into the light and lead me to repentance.",
    gentleAction: "Confess one hidden compromise to God and seek wise help if needed.",
    studyMethod: "SOAP"
  }),
  "2 Samuel 12": guidedDevotional({
    title: "Mercy through confrontation",
    context: "Nathan confronts David with a parable, and David is brought to confession. The prophet's story pierces David's self-deception, showing that the Lord sees hidden sin and that forgiveness does not erase all temporal consequences.",
    body: "God's mercy sometimes comes through painful truth. Nathan's confrontation exposes David's sin and breaks through self-deception. The chapter shows both real consequences and real forgiveness, teaching you not to confuse grace with pretending sin is small.",
    observationQuestion: "How does Nathan expose David's sin, and how does David respond?",
    reflectionQuestion: "Where might you need to receive correction as a mercy from God?",
    prayer: "Lord, give me a repentant heart that receives truth and runs to Your mercy.",
    gentleAction: "Ask God to make you teachable before correction becomes harder.",
    studyMethod: "COMA"
  }),
  "Psalm 51": guidedDevotional({
    title: "A broken and contrite heart",
    context: "Psalm 51 gives David's prayer of repentance after Nathan confronts him about Bathsheba. The superscription ties the Psalm to David's exposed sin, making the prayer a model of appeal to mercy, cleansing, renewed heart, and restored joy.",
    body: "David does not bargain or minimize. He appeals to God's steadfast love, confesses sin, asks for cleansing, and longs for a renewed heart. Repentance is not despair; it is returning to the God whose mercy can create clean hearts.",
    observationQuestion: "What does David ask God to wash, create, restore, and renew?",
    reflectionQuestion: "What would honest repentance sound like in your own words today?",
    prayer: "Have mercy on me, O God. Create in me a clean heart and renew a right spirit within me.",
    gentleAction: "Pray Psalm 51:10 slowly and honestly.",
    studyMethod: "Lectio Divina"
  }),
  "Psalm 23": guidedDevotional({
    title: "The Shepherd who restores",
    context: "David, once a shepherd and later king, prays of the Lord as his Shepherd. The Psalm turns David's own shepherding background into worship, naming the Lord as the true Shepherd who provides, restores, leads, protects, and brings His people home.",
    body: "Psalm 23 is personal trust in the Lord's care. The Shepherd provides, restores, leads, protects, prepares a table, and brings His people home. David's best shepherding points beyond himself to the Lord who shepherds perfectly.",
    observationQuestion: "What does the Lord do as Shepherd in this Psalm?",
    reflectionQuestion: "Which shepherding action of the Lord do you most need today?",
    prayer: "Lord, my Shepherd, restore my soul and lead me in Your faithful care.",
    gentleAction: "Choose one phrase from Psalm 23 to repeat during the day.",
    studyMethod: "Meditation"
  }),
  "1 Kings 2": guidedDevotional({
    title: "A final charge",
    context: "Near death, David charges Solomon to walk faithfully before the Lord as king. The scene closes David's life with covenant exhortation and unfinished consequences, handing the kingdom to Solomon under the demand for faithful obedience.",
    body: "David's final words mix wisdom, unfinished consequences, and a call to covenant faithfulness. His life has shown both grace and failure. The chapter reminds you that legacy is not image management; it is a call to walk before the Lord with faithful obedience.",
    observationQuestion: "What does David urge Solomon to keep and follow?",
    reflectionQuestion: "What kind of faithfulness do you want to pass on through your words and life?",
    prayer: "Lord, teach me to walk faithfully before You and leave behind what points others to You.",
    gentleAction: "Write one sentence of faith you would want someone younger to remember.",
    studyMethod: "OIA"
  })
};

const lifeOfMosesDevotionals: Record<string, BibleReadingPlanDayExtras> = {
  "Exodus 2": guidedDevotional({
    title: "Preserved before he knows",
    context: "Moses is born under Pharaoh's threat, hidden by faith, drawn from the water, and later flees after killing an Egyptian. The chapter shows God's preservation before Moses knows his calling, while also naming the flawed zeal and exile that precede the burning bush.",
    body: "Moses' life begins under danger, but God's preserving hand is already at work before Moses understands it. The chapter also tells the truth about Moses' flawed zeal and exile. God's calling grows in a real, complicated life, not a polished biography.",
    observationQuestion: "How is Moses preserved, and what events lead him into exile?",
    reflectionQuestion: "Where can you look back and see God's preserving mercy before you understood it?",
    prayer: "Lord, thank You for hidden mercies and for working even through complicated beginnings.",
    gentleAction: "Name one past mercy of God that you did not recognize at the time.",
    studyMethod: "OIA"
  }),
  "Exodus 3": guidedDevotional({
    title: "The God who sees and sends",
    context: "At the burning bush, the Lord reveals His holiness, His name, His compassion, and His call for Moses. The holy ground, divine name, and promise of presence show that deliverance begins with God's seeing, God's sending, and God's own faithfulness.",
    body: "God does not call Moses because Moses feels ready. He calls because He has seen His people's affliction and will be with the one He sends. The holy God draws near with compassion and reveals Himself as the faithful I AM.",
    observationQuestion: "What does God say He has seen, heard, and come down to do?",
    reflectionQuestion: "Where do you need to trust God's presence more than your readiness?",
    prayer: "I AM, help me trust Your presence and obey Your call with reverence.",
    gentleAction: "Pray over one task by saying, 'Lord, be with me in this.'",
    studyMethod: "COMA"
  }),
  "Exodus 12": guidedDevotional({
    title: "Deliverance by the lamb",
    context: "The Passover marks Israel's deliverance from judgment and slavery through the blood of the lamb. The chapter forms Israel's calendar around redemption, teaching that rescue from Egypt comes through the Lord's provided sacrifice and remembered mercy.",
    body: "Passover teaches that deliverance comes by God's provision, not Israel's strength. The lamb's blood marks rescue from judgment and begins a new identity as a redeemed people. Christians rightly see this pattern fulfilled in Christ, our Passover Lamb.",
    observationQuestion: "What are the Israelites told to do, and what does the blood signify?",
    reflectionQuestion: "How does deliverance by sacrifice deepen your gratitude for Christ?",
    prayer: "Lord, thank You for redeeming Your people by mercy and sacrifice.",
    gentleAction: "Thank Christ specifically for deliverance from sin and judgment.",
    studyMethod: "Biblical theology"
  }),
  "Exodus 14": guidedDevotional({
    title: "Stand firm and see salvation",
    context: "Israel is trapped between Pharaoh's army and the sea, and the Lord delivers them through the waters. This sea-crossing turns helpless fear into salvation by the Lord's own action, judging Egypt and bringing His people onto the path of freedom.",
    body: "Israel cannot save itself. The Lord fights for His people and makes a way where there is none. This chapter teaches faith at the edge of impossibility: stand firm, see the salvation of the Lord, and follow where He opens the way.",
    observationQuestion: "What are Israel, Moses, and the Lord each doing in this chapter?",
    reflectionQuestion: "When fear rises quickly, what might it look like to turn your attention toward the Lord's salvation?",
    prayer: "Lord, help me stand firm in trust when I cannot see the way forward.",
    gentleAction: "Write 'The Lord will fight for you' beside one pressure you face.",
    studyMethod: "SOAP"
  }),
  "Exodus 16": guidedDevotional({
    title: "Daily bread in the wilderness",
    context: "Israel grumbles in the wilderness, and the Lord provides manna day by day. The manna is both provision and test, training redeemed people to trust the Lord's daily word rather than hoard as though He will not provide tomorrow.",
    body: "The manna trains Israel in daily dependence. God gives enough for each day and exposes the impulse to hoard or distrust. Wilderness provision is not only about food; it is about learning that life is sustained by the Lord.",
    observationQuestion: "What instructions does God give about gathering manna?",
    reflectionQuestion: "Where do you need to receive today's provision instead of trying to secure tomorrow by anxiety?",
    prayer: "Lord, give me daily bread and train my heart in daily trust.",
    gentleAction: "Thank God for one provision from today before thinking about tomorrow.",
    studyMethod: "Meditation"
  }),
  "Exodus 19": guidedDevotional({
    title: "A treasured people",
    context: "At Sinai, God reminds Israel of deliverance and calls them to covenant faithfulness. Before the law is given, the Lord anchors obedience in grace: He carried Israel on eagles' wings and brought them to Himself.",
    body: "Before commands are given, God reminds Israel what He has done: He carried them on eagles' wings and brought them to Himself. Obedience is meant to flow from redemption and belonging. Israel is called to be a treasured possession and holy nation.",
    observationQuestion: "What does God say He has done for Israel before calling them to obey?",
    reflectionQuestion: "How does belonging to God change the way you think about obedience?",
    prayer: "Lord, let my obedience grow from gratitude for Your redeeming grace.",
    gentleAction: "Begin one act of obedience today by first thanking God for His grace.",
    studyMethod: "OIA"
  }),
  "Exodus 20": guidedDevotional({
    title: "Words for a redeemed people",
    context: "God gives the Ten Commandments after declaring that He brought Israel out of slavery. The commandments begin with redemption, so the law is covenant instruction for a rescued people rather than a ladder by which slaves earn rescue.",
    body: "The commandments begin with grace: 'I am the LORD your God, who brought you out.' God's law reveals His character and forms His redeemed people. It is not a ladder into salvation, but instruction for life under the Lord who saves.",
    observationQuestion: "How does God introduce Himself before giving the commandments?",
    reflectionQuestion: "Which commandment reveals an area where love for God or neighbor needs attention?",
    prayer: "Lord, write Your ways on my heart and teach me obedience shaped by love.",
    gentleAction: "Choose one commandment and ask how it protects love today.",
    studyMethod: "Inductive"
  }),
  "Exodus 32": guidedDevotional({
    title: "The danger of false gods",
    context: "While Moses is on the mountain, Israel makes the golden calf and worships what their hands have made. The episode exposes how quickly impatience becomes idolatry, and Moses' intercession stands between covenant rebellion and deserved judgment.",
    body: "Idolatry often begins when waiting feels too hard. Israel wants something visible and controllable, but the result is spiritual ruin. Moses' intercession shows the seriousness of sin and the need for mercy from the covenant Lord.",
    observationQuestion: "What leads Israel toward the golden calf, and how does Moses respond?",
    reflectionQuestion: "What visible or controllable thing are you tempted to trust instead of the Lord?",
    prayer: "Lord, expose my idols and draw me back to worship You alone.",
    gentleAction: "Name one false trust and surrender it to God in prayer.",
    studyMethod: "COMA"
  }),
  "Exodus 33": guidedDevotional({
    title: "If Your presence will not go",
    context: "After Israel's sin, Moses pleads for God's presence to go with His people. The chapter asks whether promised land without the Lord would be enough, and Moses rightly treats God's presence as the distinguishing gift.",
    body: "Moses understands that the promised land without God's presence would not be enough. The true gift is God Himself with His people. This chapter teaches longing for the Lord above success, destination, or visible blessing.",
    observationQuestion: "What does Moses ask God for, and why is God's presence essential?",
    reflectionQuestion: "Where are you tempted to want God's gifts more than God's presence?",
    prayer: "Lord, let Your presence be my greatest need and deepest joy.",
    gentleAction: "Pray, 'If Your presence will not go with me, do not let me settle for less.'",
    studyMethod: "Meditation"
  }),
  "Numbers 13": guidedDevotional({
    title: "Seeing by faith",
    context: "The spies see the land's fruitfulness and its dangers, but most interpret the future through fear. The report reveals that unbelief can see the same evidence as faith yet interpret obstacles as larger than the Lord's promise.",
    body: "The same land produces two kinds of reports: fear without faith, and faith that remembers the Lord's promise. This passage does not deny real obstacles. It asks whether those obstacles will be interpreted apart from God's faithfulness.",
    observationQuestion: "What do the spies agree about, and where do their conclusions differ?",
    reflectionQuestion: "Where are you interpreting a real obstacle as though God has not spoken?",
    prayer: "Lord, teach me to see difficulties in the light of Your promises.",
    gentleAction: "Write one obstacle and one promise of God in the same sentence.",
    studyMethod: "OIA"
  }),
  "Numbers 20": guidedDevotional({
    title: "Leadership under pressure",
    context: "The people quarrel for water, and Moses strikes the rock instead of speaking to it as the Lord commanded. The scene is a sober leadership failure: Moses' anger misrepresents the Lord's holiness even while God still provides water for His people.",
    body: "Moses' failure is sobering because it happens under pressure and after years of leadership. The passage warns that frustration can distort obedience and misrepresent God's holiness. Even faithful servants need humble dependence on the Lord.",
    observationQuestion: "What does God command Moses to do, and what does Moses actually do?",
    reflectionQuestion: "Where does pressure tempt you to act from frustration rather than trust?",
    prayer: "Holy Lord, guard my obedience when I am tired, pressured, or frustrated.",
    gentleAction: "Pause before one difficult response today and ask God for meekness.",
    studyMethod: "SOAP"
  }),
  "Deuteronomy 34": guidedDevotional({
    title: "The Lord's faithful servant",
    context: "Moses sees the land from a distance, dies, and is remembered as the prophet whom the Lord knew face to face. The ending honors Moses while leaving longing for the promised Prophet and reminding readers that God's purposes continue beyond one servant's lifetime.",
    body: "Moses' story ends with both consequence and grace. He does not enter the land, yet the Lord Himself shows it to him and honors him as His servant. The chapter leaves you longing for the greater Prophet like Moses, fulfilled in Christ.",
    observationQuestion: "How is Moses remembered, and what remains unresolved at the end of his life?",
    reflectionQuestion: "How does Moses' ending teach humility, hope, and trust in God's larger story?",
    prayer: "Lord, make me faithful in my part of the story and keep my hope fixed on Christ.",
    gentleAction: "Thank God for one unfinished thing you can entrust to Him.",
    studyMethod: "Biblical theology"
  })
};

const chronologicalOverviewDevotionals: Record<string, BibleReadingPlanDayExtras> = {
  "Genesis 1": guidedDevotional({
    title: "The God who creates",
    context: "Genesis opens the Bible with God creating by His word, ordering the world, and making humanity in His image. This beginning establishes creation's goodness, human dignity, and God's ownership before the later story of rebellion, promise, redemption, and new creation unfolds.",
    body: "The Bible story begins with God, not with human effort or confusion. Creation is good because it comes from Him, and humanity has dignity because people are made in His image. This first chapter gives the whole story its foundation: the world belongs to the Lord.",
    observationQuestion: "What does God create, bless, and call good in this chapter?",
    reflectionQuestion: "How does beginning with God as Creator reshape the way you see yourself and the world?",
    prayer: "Creator God, teach me to receive life, creation, and calling as gifts from You.",
    gentleAction: "Notice one created thing today and turn it into praise.",
    studyMethod: "OIA"
  }),
  "Genesis 12": adventDevotionals["Genesis 12"],
  "Exodus 12": lifeOfMosesDevotionals["Exodus 12"],
  "Joshua 1": guidedDevotional({
    title: "Courage for the next step",
    context: "After Moses' death, Joshua is called to lead Israel into the land God promised. The transition from wilderness to land rests on God's presence, courage shaped by the law, and the continuing faithfulness of the covenant Lord.",
    body: "Joshua's courage is grounded in God's presence and promise, not in Joshua's natural confidence. The Lord calls him to meditate on the law and walk in obedience. At a major transition point, the path forward is faithfulness to the God who goes with His people.",
    observationQuestion: "What promises and commands does the Lord give Joshua?",
    reflectionQuestion: "What next step requires courage grounded in God's presence rather than self-confidence?",
    prayer: "Lord, make me strong and courageous by keeping me close to Your Word and Your presence.",
    gentleAction: "Write one obedience step for today and pray before taking it.",
    studyMethod: "SOAP"
  }),
  "1 Samuel 16": lifeOfDavidDevotionals["1 Samuel 16"],
  "2 Samuel 7": lifeOfDavidDevotionals["2 Samuel 7"],
  "Isaiah 53": easterDevotionals["Isaiah 53"],
  "Luke 2": lifeOfJesusDevotionals["Luke 2"],
  "John 19": lifeOfJesusDevotionals["John 19"],
  "Acts 2": easterDevotionals["Acts 2"],
  "Romans 8": easterDevotionals["Romans 8"],
  "Revelation 21": easterDevotionals["Revelation 21"]
};

const actsEarlyChurchDevotionals: Record<string, BibleReadingPlanDayExtras> = {
  "Acts 1": guidedDevotional({
    title: "Witnesses by the Spirit",
    context: "The risen Jesus teaches His apostles, promises the Holy Spirit, ascends, and prepares them for witness. The opening chapter bridges Luke's Gospel and Acts, making clear that the mission waits for promised power from the Spirit rather than beginning in apostolic enthusiasm.",
    body: "Acts begins with the risen Christ still leading His people. The mission does not rest on human energy; Jesus promises power from the Holy Spirit and sends His witnesses outward. Waiting and witness belong together because the church moves by Christ's command and Spirit's power.",
    observationQuestion: "What does Jesus promise, and what mission does He give His witnesses?",
    reflectionQuestion: "Where do you need to wait on the Lord rather than rush ahead in your own strength?",
    prayer: "Risen Lord, make me a faithful witness by the power of Your Spirit.",
    gentleAction: "Pray for one ordinary opportunity to bear witness to Christ today.",
    studyMethod: "COMA"
  }),
  "Acts 2": easterDevotionals["Acts 2"],
  "Acts 3": guidedDevotional({
    title: "In the name of Jesus",
    context: "Peter and John meet a lame man at the temple gate, and he is healed in Jesus' name. The miracle at the temple becomes a public sermon about the Servant whom Israel rejected, the Author of life whom God raised, and the restoration promised through the prophets.",
    body: "The healing points beyond the miracle itself to the risen Jesus. Peter refuses personal credit and calls people to repentance and restoration. The church's mercy and message belong together: Jesus is alive, powerful, and worthy of trust.",
    observationQuestion: "How does Peter explain the healing and point attention away from himself?",
    reflectionQuestion: "Where might a gift, mercy, or answered prayer need to point back to Jesus?",
    prayer: "Lord Jesus, make my words and actions point clearly to Your living power.",
    gentleAction: "Give thanks for one mercy and name Jesus as the giver.",
    studyMethod: "OIA"
  }),
  "Acts 4": easterDevotionals["Acts 4"],
  "Acts 5": guidedDevotional({
    title: "Holiness and bold witness",
    context: "Acts 5 includes the judgment of Ananias and Sapphira, signs among the people, opposition, and renewed apostolic witness. The chapter refuses a sentimental picture of the church: the Spirit forms a holy community, exposes deceit, and gives courage to obey God rather than men.",
    body: "The early church is marked by both grace and holiness. God is not a tool for reputation, and the apostles are not silenced by pressure. The chapter holds together reverent fear, healing mercy, suffering for Christ, and joy in His name.",
    observationQuestion: "What forms of fear, opposition, and boldness appear in this chapter?",
    reflectionQuestion: "Where do you need honesty before God and courage before people?",
    prayer: "Holy Lord, purify my motives and give me joyfully faithful courage.",
    gentleAction: "Practice one hidden act of honesty before God today.",
    studyMethod: "SOAP"
  }),
  "Acts 6": guidedDevotional({
    title: "Serving without neglecting the Word",
    context: "A practical need in the church leads to Spirit-filled servants being appointed, and Stephen's witness begins. Luke shows the Word continuing to increase as the church handles ethnic tension, practical care, and leadership wisely rather than letting need fracture the community.",
    body: "Growth brings real needs and possible tension. The apostles do not treat practical care as unspiritual, nor do they neglect prayer and the Word. The church needs wise, Spirit-filled service so both mercy and ministry remain healthy.",
    observationQuestion: "What problem arises, and how does the church respond?",
    reflectionQuestion: "Where does faithful service require wisdom, fairness, and spiritual maturity?",
    prayer: "Lord, make Your church wise in care and faithful in prayer and the Word.",
    gentleAction: "Notice one practical need and consider how to serve without resentment.",
    studyMethod: "OIA"
  }),
  "Acts 7": guidedDevotional({
    title: "Faithful witness under pressure",
    context: "Stephen retells Israel's story, exposes resistance to God, and dies while seeing the exalted Christ. Stephen's speech traces a long pattern of resisting God's messengers, and his death places him as a faithful witness who sees Jesus vindicated at God's right hand.",
    body: "Stephen's speech shows that God's presence and purposes have never been confined to one building or controlled by human opposition. His death is tragic, but not meaningless; he bears witness to the Son of Man standing at God's right hand.",
    observationQuestion: "How does Stephen use Israel's history to confront his hearers?",
    reflectionQuestion: "What would faithfulness look like when truth is costly?",
    prayer: "Lord Jesus, keep my eyes on You when faithfulness is difficult.",
    gentleAction: "Pray for persecuted believers and for courage to speak truth with grace.",
    studyMethod: "Biblical theology"
  }),
  "Acts 8": guidedDevotional({
    title: "The gospel spreads through scattering",
    context: "Persecution scatters believers, Philip preaches in Samaria, and an Ethiopian official receives the gospel. The scattering caused by persecution becomes the means by which the gospel reaches Samaritans and an African official through Spirit-led Scripture witness.",
    body: "Opposition cannot cage the Word of God. The gospel moves to Samaria and to an Ethiopian seeker through Scripture, Spirit-led witness, and the good news of Jesus. God gathers people across old boundaries and personal distance.",
    observationQuestion: "How does the gospel spread, and who receives it in this chapter?",
    reflectionQuestion: "Where might God use disruption or an unexpected conversation for witness?",
    prayer: "Lord, send Your gospel across boundaries and make me attentive to Spirit-led opportunities.",
    gentleAction: "Be ready to explain one Scripture or one hope in Christ simply.",
    studyMethod: "COMA"
  }),
  "Acts 9": guidedDevotional({
    title: "Grace meets an enemy",
    context: "Saul persecutes the church until the risen Jesus confronts him on the road to Damascus. Saul's conversion displays the risen Christ's sovereign mercy, while Ananias' obedience shows the church learning to receive a former enemy as a brother.",
    body: "Saul is not seeking Jesus when Jesus stops him. His conversion displays sovereign mercy: an enemy becomes a chosen instrument. Ananias' obedience also matters, showing costly welcome toward someone he had reason to fear.",
    observationQuestion: "What does Jesus say to Saul, and how does Ananias respond to Jesus' command?",
    reflectionQuestion: "How does Saul's conversion enlarge your view of grace for unlikely people?",
    prayer: "Lord Jesus, thank You for mercy that can transform enemies into servants.",
    gentleAction: "Pray for someone you find difficult to imagine receiving grace.",
    studyMethod: "SOAP"
  }),
  "Acts 10": guidedDevotional({
    title: "God shows no partiality",
    context: "Peter is sent to Cornelius, and Gentiles receive the Holy Spirit as the gospel crosses another boundary. Cornelius' house becomes a decisive Gentile inclusion moment, with Peter learning that God cleanses people through Christ rather than by ethnic boundary markers.",
    body: "God teaches Peter that the good news of Jesus is not confined by ethnic boundary or religious habit. Cornelius' household hears of Christ's life, death, resurrection, and forgiveness, and the Spirit confirms God's welcome of Gentile believers.",
    observationQuestion: "What does Peter learn, and what does he proclaim about Jesus?",
    reflectionQuestion: "Where might your assumptions be narrower than God's welcome in Christ?",
    prayer: "Lord, align my heart with Your mercy for people from every nation.",
    gentleAction: "Pray for someone culturally or socially distant from you to know Christ.",
    studyMethod: "Inductive"
  }),
  "Acts 11": guidedDevotional({
    title: "Grace recognized",
    context: "Peter explains Gentile inclusion, and the church in Antioch grows through scattered believers and faithful teaching. The Jerusalem church must recognize grace outside its expectations, and Antioch emerges as a teaching and sending community shaped by Gentile inclusion.",
    body: "The Jerusalem believers learn to recognize God's grace where they did not expect it. Antioch becomes a place of teaching, generosity, and the name Christian. The chapter calls the church to discern God's work and respond with gladness.",
    observationQuestion: "How do believers respond when they hear what God did among the Gentiles?",
    reflectionQuestion: "Where do you need to recognize and rejoice in grace beyond familiar places?",
    prayer: "Lord, give me eyes to recognize Your grace and a heart that rejoices in it.",
    gentleAction: "Name one sign of God's grace in someone else's life and give thanks.",
    studyMethod: "OIA"
  }),
  "Acts 12": guidedDevotional({
    title: "Prayer and deliverance",
    context: "James is killed, Peter is imprisoned, and the church prays while God delivers Peter. Luke places martyrdom, deliverance, prayer, and Herod's judgment side by side, teaching God's rule without reducing providence to one predictable outcome.",
    body: "Acts 12 does not give a simple formula: James dies, Peter is rescued, and Herod is judged. The church prays in weakness, and God rules over prison doors and proud kings. Faith trusts God's sovereignty even when outcomes differ.",
    observationQuestion: "What different outcomes appear in this chapter, and how does the church respond?",
    reflectionQuestion: "How can you pray faithfully while leaving outcomes in God's hands?",
    prayer: "Sovereign Lord, teach me to pray with trust when I cannot control the outcome.",
    gentleAction: "Pray honestly for one hard situation without demanding the script.",
    studyMethod: "COMA"
  }),
  "Acts 13": guidedDevotional({
    title: "Sent by the Spirit",
    context: "The church in Antioch sends Barnabas and Saul, and Paul proclaims Jesus from Israel's story. The first missionary journey begins in worship and fasting, and Paul's synagogue sermon roots Jesus' resurrection in God's promises to Israel.",
    body: "Mission begins in worship, fasting, and the Spirit's sending. Paul's sermon shows that Jesus is the promised Savior, raised from the dead, and the source of forgiveness. The gospel goes out because God keeps His promises.",
    observationQuestion: "How are Barnabas and Saul sent, and how does Paul connect Jesus to Israel's story?",
    reflectionQuestion: "Where does mission need to begin with worship and dependence rather than strategy alone?",
    prayer: "Holy Spirit, send Your people with worshipful dependence and gospel clarity.",
    gentleAction: "Pray for a missionary, church planter, or gospel worker today.",
    studyMethod: "Biblical theology"
  }),
  "Acts 14": guidedDevotional({
    title: "Strengthened through trials",
    context: "Paul and Barnabas preach, suffer opposition, and strengthen new disciples before returning to Antioch. The journey includes both fruitful gospel reception and violent opposition, so new disciples are strengthened for tribulation rather than promised ease.",
    body: "The gospel bears fruit amid misunderstanding, praise, violence, and perseverance. Paul and Barnabas do not promise ease; they strengthen believers to continue in faith through many tribulations. The kingdom advances through faithful endurance.",
    observationQuestion: "What opposition and encouragement appear as Paul and Barnabas travel?",
    reflectionQuestion: "Where do you need strengthening to continue in faith rather than chase ease?",
    prayer: "Lord, strengthen me to continue in faith through difficulty.",
    gentleAction: "Encourage one believer who is trying to remain faithful under pressure.",
    studyMethod: "SOAP"
  }),
  "Acts 15": guidedDevotional({
    title: "Grace for the nations",
    context: "The Jerusalem council addresses whether Gentile believers must take on the law of Moses to be saved. The council protects salvation by grace while seeking wise fellowship between Jewish and Gentile believers, making gospel clarity and communal love inseparable.",
    body: "The church protects the truth that salvation is by the grace of the Lord Jesus. The council also seeks wise love between Jewish and Gentile believers. Gospel clarity and communal care belong together.",
    observationQuestion: "What question is debated, and what conclusion is reached about grace?",
    reflectionQuestion: "Where do you need to protect grace while practicing love toward others?",
    prayer: "Lord Jesus, keep me clear about grace and careful in love.",
    gentleAction: "Ask whether one expectation you place on others is gospel truth or cultural habit.",
    studyMethod: "Inductive"
  }),
  "Acts 16": guidedDevotional({
    title: "The gospel opens hearts",
    context: "Paul's team is led to Macedonia, Lydia believes, a slave girl is freed, and a jailer is saved. Macedonia receives the gospel through very different encounters, showing the Lord opening hearts, freeing captives, and bringing salvation into households.",
    body: "Acts 16 shows many kinds of gospel openings: a businesswoman by a river, a captive girl in spiritual bondage, and a jailer in crisis. The Lord opens hearts, breaks chains, and creates household joy through Christ.",
    observationQuestion: "Who receives mercy in this chapter, and how does God work in each situation?",
    reflectionQuestion: "How does this chapter expand your expectation of where God may be working?",
    prayer: "Lord, open hearts to Your gospel and make me attentive to Your leading.",
    gentleAction: "Pray for one person by name, asking God to open their heart.",
    studyMethod: "OIA"
  }),
  "Acts 17": guidedDevotional({
    title: "Reasoning from Scripture and creation",
    context: "Paul reasons in synagogues and speaks in Athens, proclaiming the Creator and the risen Judge. Luke contrasts Berean searching, synagogue reasoning, and Athenian public engagement, showing witness that adapts its starting point without abandoning resurrection proclamation.",
    body: "Paul adapts his approach without changing the message. With Jews he reasons from Scripture; in Athens he begins with creation and idolatry, then proclaims repentance and resurrection. Faithful witness listens carefully and points clearly to Christ.",
    observationQuestion: "How does Paul's approach differ in Thessalonica, Berea, and Athens?",
    reflectionQuestion: "Where do you need both careful listening and clear witness?",
    prayer: "Lord, give me wisdom to speak Christ clearly in different settings.",
    gentleAction: "Practice explaining one reason the resurrection matters in simple words.",
    studyMethod: "COMA"
  }),
  "Acts 18": guidedDevotional({
    title: "Do not be afraid",
    context: "Paul ministers in Corinth, receives encouragement from the Lord, and later Apollos is taught more accurately. Corinth becomes a place where the Lord strengthens fearful ministry, and Priscilla and Aquila model humble correction that helps gifted teaching become more accurate.",
    body: "The Lord strengthens Paul in a hard city: do not be afraid, keep speaking, for I am with you. The chapter also shows humble teaching through Priscilla and Aquila helping Apollos. Gospel ministry needs courage, patience, and teachability.",
    observationQuestion: "How does the Lord encourage Paul, and how is Apollos helped?",
    reflectionQuestion: "Where do you need courage to keep speaking or humility to keep learning?",
    prayer: "Lord, keep me faithful, teachable, and unafraid because You are with me.",
    gentleAction: "Receive one correction or encouragement today as a gift from God.",
    studyMethod: "SOAP"
  }),
  "Acts 19": guidedDevotional({
    title: "The Word grows in power",
    context: "In Ephesus, the gospel confronts incomplete understanding, spiritual counterfeits, magic, and economic idolatry. Ephesus shows the gospel challenging rival spiritual powers and economic loyalties, so repentance becomes visible in costly public renunciation.",
    body: "The Word of the Lord grows and prevails as people confess, turn from false power, and abandon costly idols. The gospel does not merely add Jesus to existing loyalties; it challenges rival powers and reorders worship.",
    observationQuestion: "What false powers or rival loyalties are exposed in Ephesus?",
    reflectionQuestion: "What costly loyalty might the gospel call you to surrender?",
    prayer: "Lord Jesus, let Your Word prevail over every rival loyalty in my life.",
    gentleAction: "Identify one habit, possession, or ambition that needs to be placed under Christ.",
    studyMethod: "OIA"
  }),
  "Acts 20": guidedDevotional({
    title: "Shepherding with tears",
    context: "Paul encourages believers, raises Eutychus, and gives farewell counsel to the Ephesian elders. Paul's farewell to the Ephesian elders gives a rare window into pastoral ministry marked by tears, vigilance, generosity, and trust in the word of grace.",
    body: "Paul's ministry is marked by humility, tears, teaching, warning, and generosity. He entrusts the elders to God and to the word of His grace. Leadership in the church is not image or control; it is watchful care under Christ.",
    observationQuestion: "What does Paul say about his ministry and the elders' responsibility?",
    reflectionQuestion: "Where does faithful care require humility, warning, or generosity?",
    prayer: "Lord, make Your church faithful under the word of Your grace.",
    gentleAction: "Pray for a pastor, elder, or church leader to shepherd faithfully.",
    studyMethod: "Inductive"
  }),
  "Acts 21": guidedDevotional({
    title: "Ready for the name of Jesus",
    context: "Paul travels toward Jerusalem despite warnings and is arrested after unrest in the temple. The journey to Jerusalem highlights Paul's willingness to suffer for Jesus' name and the misunderstandings that surround his mission among Jews and Gentiles.",
    body: "Paul is not careless, but he is surrendered. He is ready to suffer for the name of the Lord Jesus. The chapter also shows how quickly misunderstanding can turn into conflict, making Paul's steady allegiance to Christ stand out.",
    observationQuestion: "What warnings does Paul receive, and how does he respond?",
    reflectionQuestion: "Where does allegiance to Jesus need to outrank comfort or reputation?",
    prayer: "Lord Jesus, make me faithful to Your name when obedience is costly.",
    gentleAction: "Pray for courage to obey Christ in one uncomfortable area.",
    studyMethod: "COMA"
  }),
  "Acts 22": guidedDevotional({
    title: "A testimony of mercy",
    context: "Paul tells his conversion story to a hostile crowd in Jerusalem. Paul centers his testimony on the risen Jesus who interrupted his violence, cleansed him, and sent him especially toward the Gentiles.",
    body: "Paul's testimony is not self-promotion; it is witness to the mercy and calling of Jesus. He tells how the risen Lord interrupted him, forgave him, and sent him. Personal story becomes faithful witness when Christ is the center.",
    observationQuestion: "What parts of Paul's story highlight Jesus' mercy and calling?",
    reflectionQuestion: "How could you tell your story in a way that makes Christ, not yourself, central?",
    prayer: "Lord Jesus, help me speak honestly of Your mercy in my life.",
    gentleAction: "Write three sentences about what Christ has done for you.",
    studyMethod: "OIA"
  }),
  "Acts 23": guidedDevotional({
    title: "Take courage",
    context: "Paul faces division, danger, and a plot against his life, but the Lord stands by him. Legal chaos and assassination plans do not cancel Jesus' word to Paul that he must testify in Rome, so providence works through danger and protection.",
    body: "The Lord's word to Paul is tender and purposeful: take courage. Human plotting is real, yet God's purpose carries Paul forward toward Rome. The chapter encourages trust when circumstances look chaotic but Christ has not left His servant.",
    observationQuestion: "What danger surrounds Paul, and what does the Lord say to him?",
    reflectionQuestion: "Where do you need to hear Christ's courage-giving presence today?",
    prayer: "Lord Jesus, stand near me with courage when circumstances feel unstable.",
    gentleAction: "Write 'Take courage' beside one situation that feels uncertain.",
    studyMethod: "SOAP"
  }),
  "Acts 24": guidedDevotional({
    title: "Faithfulness while waiting",
    context: "Paul gives his defense before Felix and remains imprisoned while Felix delays justice. Felix hears about righteousness, self-control, and coming judgment but delays, making Paul's imprisonment a setting for patient, costly witness.",
    body: "Paul speaks about faith in Christ, resurrection hope, righteousness, self-control, and coming judgment. Felix delays, but Paul remains faithful. The chapter teaches patient witness when people are interested but unwilling to surrender.",
    observationQuestion: "What does Paul speak about, and how does Felix respond?",
    reflectionQuestion: "Where do you need patience when someone delays responding to truth?",
    prayer: "Lord, help me speak truth patiently and trust Your timing.",
    gentleAction: "Pray for someone who seems near truth but hesitant to respond.",
    studyMethod: "COMA"
  }),
  "Acts 25": guidedDevotional({
    title: "Appeal and providence",
    context: "Paul stands before Festus, appeals to Caesar, and continues moving toward Rome through legal proceedings. The appeal to Caesar is not a procedural dead end; it becomes the providential road by which Paul's witness continues toward Rome.",
    body: "Acts 25 may feel procedural, but providence often works through ordinary systems and delays. Paul's appeal is not escape from mission; it becomes the road toward Rome. God can use slow, tangled circumstances for His purposes.",
    observationQuestion: "What legal decisions move Paul's case forward?",
    reflectionQuestion: "Where might God be working through a slow process you would not have chosen?",
    prayer: "Lord, help me trust Your providence in delays, decisions, and systems beyond my control.",
    gentleAction: "Entrust one slow process to God in a brief written prayer.",
    studyMethod: "OIA"
  }),
  "Acts 26": guidedDevotional({
    title: "Almost persuaded",
    context: "Paul testifies before Agrippa, retelling his calling and proclaiming Christ's suffering and resurrection. Before Agrippa, Paul's defense becomes a gospel appeal about light, repentance, forgiveness, and the Messiah's suffering and resurrection.",
    body: "Paul speaks with respect and boldness. His defense becomes proclamation: Christ suffered, rose, and brings light to Jews and Gentiles. Agrippa's response is close but unresolved, reminding you that hearing the gospel still calls for response.",
    observationQuestion: "How does Paul describe his commission and the message about Christ?",
    reflectionQuestion: "Where do you need to move from almost persuaded to obedient trust?",
    prayer: "Lord Jesus, keep my heart responsive to Your light and truth.",
    gentleAction: "Ask God to expose one area where you are delaying obedience.",
    studyMethod: "Inductive"
  }),
  "Acts 27": guidedDevotional({
    title: "God's promise in the storm",
    context: "Paul sails toward Rome, the ship is caught in a violent storm, and God promises preservation. The storm narrative shows Paul's trust in God's promise becoming public courage, even while sailors, soldiers, and prisoners face real danger.",
    body: "The storm is severe, but God's promise stands. Paul becomes a calm witness of trust in the middle of danger, urging courage because he believes God. Faith does not deny the storm; it holds fast to the God who speaks in it.",
    observationQuestion: "What does God promise Paul, and how does Paul encourage the others?",
    reflectionQuestion: "What storm needs to be answered by trust in God's word rather than panic?",
    prayer: "Lord, help me believe what You have spoken when the storm is loud.",
    gentleAction: "Speak one promise of God aloud before reacting to pressure today.",
    studyMethod: "SOAP"
  }),
  "Acts 28": guidedDevotional({
    title: "The kingdom unhindered",
    context: "Paul reaches Rome, ministers on Malta, and proclaims the kingdom of God and Jesus Christ under house arrest. Acts ends with Paul constrained but the Word unhindered, leaving the reader with the kingdom still being proclaimed beyond Jerusalem and Rome.",
    body: "Acts ends with Paul confined but the Word unhindered. The gospel has moved from Jerusalem toward Rome, and Christ's kingdom is still being proclaimed. The ending is open because the mission continues through the Spirit-empowered witness of the church.",
    observationQuestion: "How does Acts describe Paul's final ministry in Rome?",
    reflectionQuestion: "Where do you need to remember that God's Word is not chained by your limitations?",
    prayer: "Lord Jesus, let Your kingdom be proclaimed through my life, even within my limits.",
    gentleAction: "Ask how one current limitation could still become a place of witness.",
    studyMethod: "Biblical theology"
  })
};

const paulsLettersOverviewDevotionals: Record<string, BibleReadingPlanDayExtras> = {
  "Romans 1-2": guidedDevotional({
    title: "The gospel and human need",
    context: "Romans opens with Paul's eagerness to preach the gospel, then exposes Gentile and Jewish need before God. In Romans, Paul is unfolding the gospel's logic of sin, grace, faith, Israel, mercy, and embodied worship; follow that argument through Romans 1-2.",
    body: "Paul begins with the power of the gospel before showing why every person needs it. Human sin is not limited to obvious rebellion; it includes suppressing truth, judging others, and relying on religious privilege. The good news shines because the need is universal.",
    observationQuestion: "What does Paul say about the gospel, and what kinds of human sin does he expose?",
    reflectionQuestion: "Where do you need the gospel to confront both obvious sin and quiet self-righteousness?",
    prayer: "Lord, humble me under the truth and make me grateful for the power of the gospel.",
    gentleAction: "Ask God to show one place where you judge others while needing mercy yourself.",
    studyMethod: "Inductive"
  }),
  "Romans 3-4": guidedDevotional({
    title: "Justified by faith",
    context: "Paul explains that all have sinned and that righteousness comes through faith in Christ, using Abraham as a witness. In Romans, Paul is unfolding the gospel's logic of sin, grace, faith, Israel, mercy, and embodied worship; follow that argument through Romans 3-4.",
    body: "Romans 3-4 moves from the closing of every mouth to the gift of justification. God is just and the justifier of the one who has faith in Jesus. Abraham's example shows that faith receives God's promise rather than earning standing by works.",
    observationQuestion: "What does Paul say about sin, righteousness, faith, and boasting?",
    reflectionQuestion: "Where do you still try to establish your standing before God by performance?",
    prayer: "Father, help me rest in the righteousness You give through faith in Christ.",
    gentleAction: "Write 'received, not earned' beside Romans 3:24 or Romans 4:5.",
    studyMethod: "SOAP"
  }),
  "Romans 5-6": guidedDevotional({
    title: "Peace and newness of life",
    context: "Paul connects justification with peace, hope, union with Christ, and freedom from slavery to sin. In Romans, Paul is unfolding the gospel's logic of sin, grace, faith, Israel, mercy, and embodied worship; follow that argument through Romans 5-6.",
    body: "Grace is not thin forgiveness. Through Christ, believers have peace with God, hope in suffering, and participation in His death and resurrection. Romans 6 refuses the idea that grace makes sin safe; grace brings new life under Christ's lordship.",
    observationQuestion: "What gifts flow from justification, and what does Paul say about union with Christ?",
    reflectionQuestion: "What would it look like to live today as someone united to Christ in new life?",
    prayer: "Lord Jesus, deepen my peace with God and teach me to walk in newness of life.",
    gentleAction: "Choose one old pattern to resist and one new obedience to practice today.",
    studyMethod: "OIA"
  }),
  "Romans 7-8": guidedDevotional({
    title: "No condemnation in Christ",
    context: "Paul names the struggle with sin and then announces life, assurance, help, and hope in the Spirit. In Romans, Paul is unfolding the gospel's logic of sin, grace, faith, Israel, mercy, and embodied worship; follow that argument through Romans 7-8.",
    body: "Romans 8 answers the distress of Romans 7 with Christ and the Spirit. There is no condemnation for those in Christ Jesus. The Spirit gives life, helps weakness, anchors hope in future glory, and assures believers that nothing can separate them from God's love.",
    observationQuestion: "What does Romans 8 say the Spirit does for believers?",
    reflectionQuestion: "Which promise from Romans 8 needs to answer shame, weakness, or fear today?",
    prayer: "Spirit of God, lead me in life and keep me anchored in the love of Christ.",
    gentleAction: "Return to Romans 8:1 whenever accusation or shame rises today.",
    studyMethod: "Meditation"
  }),
  "Romans 9-10": guidedDevotional({
    title: "Mercy and the preached word",
    context: "Paul grieves for Israel and reflects on God's mercy, human response, and the nearness of the word of faith. In Romans, Paul is unfolding the gospel's logic of sin, grace, faith, Israel, mercy, and embodied worship; follow that argument through Romans 9-10.",
    body: "These chapters are weighty because Paul holds together sorrow, God's sovereign mercy, and the call to believe and confess Christ. The gospel is not hidden far away; Christ is proclaimed, and everyone who calls on the name of the Lord will be saved.",
    observationQuestion: "What does Paul grieve, and what does he say about calling on the Lord?",
    reflectionQuestion: "How do mercy, prayer, and proclamation belong together in your concern for others?",
    prayer: "Merciful God, save people through the preached word of Christ and make me faithful in prayer.",
    gentleAction: "Pray Romans 10:13 for one person by name.",
    studyMethod: "COMA"
  }),
  "Romans 11-12": guidedDevotional({
    title: "Mercy that becomes worship",
    context: "Paul moves from God's mercy in His saving purposes to the call to present our bodies as living sacrifices. In Romans, Paul is unfolding the gospel's logic of sin, grace, faith, Israel, mercy, and embodied worship; follow that argument through Romans 11-12.",
    body: "Doctrine becomes doxology, and doxology becomes embodied worship. After marveling at God's wisdom and mercy, Paul calls believers to offer their lives to God and be transformed by renewed minds. Mercy is meant to reshape ordinary life.",
    observationQuestion: "How does Paul move from worship to practical obedience?",
    reflectionQuestion: "What part of your ordinary life needs to become worship in response to mercy?",
    prayer: "Lord, renew my mind and make my whole life a living response to Your mercy.",
    gentleAction: "Offer one ordinary task to God as worship today.",
    studyMethod: "OIA"
  }),
  "Romans 13-14": guidedDevotional({
    title: "Love in ordinary tensions",
    context: "Paul addresses civic responsibility, love as fulfilling the law, and patient welcome among believers with different consciences. In Romans, Paul is unfolding the gospel's logic of sin, grace, faith, Israel, mercy, and embodied worship; follow that argument through Romans 13-14.",
    body: "Christian obedience touches public life, private conduct, and community disagreements. Paul calls believers to wakefulness, love, and humility with one another. The strong and weak must not despise or judge, because each belongs to the Lord.",
    observationQuestion: "What commands does Paul give about love, conduct, and judging one another?",
    reflectionQuestion: "Where do you need to practice love rather than contempt in a disagreement?",
    prayer: "Lord Jesus, teach me to walk in love, humility, and wakeful obedience.",
    gentleAction: "Choose one way to honor another believer whose conscience differs from yours.",
    studyMethod: "Inductive"
  }),
  "Romans 15-16": guidedDevotional({
    title: "Welcome and mission",
    context: "Paul closes Romans by calling believers to welcome one another, hope in Scripture, and participate in gospel mission. In Romans, Paul is unfolding the gospel's logic of sin, grace, faith, Israel, mercy, and embodied worship; follow that argument through Romans 15-16.",
    body: "The God of endurance and encouragement forms a people of hope. Paul wants Jews and Gentiles to glorify God together in Christ, and he names many co-workers in mission. The gospel creates welcome, worship, and shared labor.",
    observationQuestion: "What does Paul pray for, and how does he describe his mission and co-workers?",
    reflectionQuestion: "How might hope in Christ make you more welcoming and mission-minded?",
    prayer: "God of hope, fill me with joy and peace in believing, and make me useful in Your mission.",
    gentleAction: "Thank God for one person who has helped your faith.",
    studyMethod: "SOAP"
  }),
  "1 Corinthians 1-2": guidedDevotional({
    title: "Christ crucified, God's wisdom",
    context: "Paul addresses a divided church by centering them on the cross and the wisdom revealed by the Spirit. In 1 Corinthians, Paul pastors a divided and gifted church by bringing its pride, worship, bodies, and hope under the cross through 1 Corinthians 1-2.",
    body: "The Corinthians are tempted by status, eloquence, and party spirit. Paul responds with Christ crucified, the wisdom and power of God. The cross humbles boasting and teaches the church to measure wisdom by God's revelation rather than cultural applause.",
    observationQuestion: "What divisions or boasts does Paul confront, and how does he center the cross?",
    reflectionQuestion: "Where are you tempted to seek impressive spirituality instead of cruciform wisdom?",
    prayer: "Lord Jesus, keep my confidence in Your cross, not in human status or cleverness.",
    gentleAction: "Ask whether one desire for approval is shaping your faith more than the cross.",
    studyMethod: "COMA"
  }),
  "1 Corinthians 3-4": guidedDevotional({
    title: "Servants, not celebrities",
    context: "Paul confronts spiritual immaturity, leader factions, and pride in the Corinthian church. In 1 Corinthians, Paul pastors a divided and gifted church by bringing its pride, worship, bodies, and hope under the cross through 1 Corinthians 3-4.",
    body: "Paul refuses celebrity Christianity. Leaders are servants, God gives the growth, and the church belongs to Him. The passage challenges pride that compares people, claims status, or forgets that every gift is received.",
    observationQuestion: "How does Paul describe leaders, the church, and God's role in growth?",
    reflectionQuestion: "Where do comparison or personality loyalties need to give way to humility before God?",
    prayer: "Lord, make me humble, teachable, and grateful for every servant You use.",
    gentleAction: "Thank God for one faithful servant without turning them into your identity marker.",
    studyMethod: "OIA"
  }),
  "1 Corinthians 5-6": guidedDevotional({
    title: "Holiness with costly grace",
    context: "Paul addresses serious sin, church discipline, lawsuits, sexual immorality, and the believer's body as belonging to Christ. In 1 Corinthians, Paul pastors a divided and gifted church by bringing its pride, worship, bodies, and hope under the cross through 1 Corinthians 5-6.",
    body: "Grace does not make holiness optional. Paul calls the church to take sin seriously because believers belong to Christ and are temples of the Holy Spirit. The passage is firm because redemption is precious: you were bought with a price.",
    observationQuestion: "What reasons does Paul give for taking sin and the body seriously?",
    reflectionQuestion: "Where does belonging to Christ need to reshape your choices with your body or relationships?",
    prayer: "Lord Jesus, help me glorify You with my body because I belong to You.",
    gentleAction: "Name one boundary or confession that would honor Christ's ownership today.",
    studyMethod: "SOAP"
  }),
  "1 Corinthians 7-8": guidedDevotional({
    title: "Love in freedom and calling",
    context: "Paul gives pastoral counsel about marriage, singleness, calling, conscience, and food offered to idols. In 1 Corinthians, Paul pastors a divided and gifted church by bringing its pride, worship, bodies, and hope under the cross through 1 Corinthians 7-8.",
    body: "Paul applies the gospel to complex personal situations without reducing wisdom to slogans. Whether married, single, free, or constrained, believers belong to the Lord. Knowledge must be governed by love, because freedom that wounds a brother or sister is not mature freedom.",
    observationQuestion: "What does Paul say about calling, devotion to the Lord, knowledge, and love?",
    reflectionQuestion: "Where should love guide the way you use freedom or knowledge?",
    prayer: "Lord, help me live faithfully in my calling and use freedom for love.",
    gentleAction: "Consider one choice where love should matter more than proving you are right.",
    studyMethod: "Inductive"
  }),
  "1 Corinthians 9-10": guidedDevotional({
    title: "Freedom that serves",
    context: "Paul describes surrendering rights for the gospel and warns from Israel's wilderness failures. In 1 Corinthians, Paul pastors a divided and gifted church by bringing its pride, worship, bodies, and hope under the cross through 1 Corinthians 9-10.",
    body: "Christian freedom is not self-indulgence. Paul gives up rights to serve the gospel, disciplines himself, and warns against idolatry and presumption. The goal is God's glory and the good of others, not the maximum exercise of personal liberty.",
    observationQuestion: "What rights does Paul surrender, and what warnings does he draw from Israel's story?",
    reflectionQuestion: "Where might love for the gospel call you to limit a freedom willingly?",
    prayer: "Lord, make my freedom serve Your glory and the good of others.",
    gentleAction: "Choose one small way to give up convenience for someone else's good.",
    studyMethod: "COMA"
  }),
  "1 Corinthians 11-12": guidedDevotional({
    title: "One body, many gifts",
    context: "Paul addresses worship disorder, the Lord's Supper, spiritual gifts, and the unity of Christ's body. In 1 Corinthians, Paul pastors a divided and gifted church by bringing its pride, worship, bodies, and hope under the cross through 1 Corinthians 11-12.",
    body: "The Corinthians need to learn that worship and gifts are not stages for self-display. The Lord's Supper calls for discernment and care, and spiritual gifts are given for the common good. The Spirit forms one body with many members.",
    observationQuestion: "How does Paul connect worship, the body, gifts, and care for others?",
    reflectionQuestion: "Where do your gifts need to be used for the common good rather than self-importance?",
    prayer: "Holy Spirit, help me honor Christ's body and serve with the gifts You give.",
    gentleAction: "Use one ability quietly for another person's good today.",
    studyMethod: "OIA"
  }),
  "1 Corinthians 13-14": guidedDevotional({
    title: "Love builds up",
    context: "Paul places love at the center of spiritual maturity and then applies it to gathered worship. In 1 Corinthians, Paul pastors a divided and gifted church by bringing its pride, worship, bodies, and hope under the cross through 1 Corinthians 13-14.",
    body: "Spiritual gifts without love become noise. Love is patient, kind, humble, enduring, and committed to building others up. Paul does not oppose gifts; he orders them under love so the church is strengthened rather than confused.",
    observationQuestion: "What does love look like, and how should it shape gathered worship?",
    reflectionQuestion: "Where does your speech or service need to become more loving and upbuilding?",
    prayer: "Lord, make my words and gifts servants of love.",
    gentleAction: "Before speaking today, ask whether your words will build up.",
    studyMethod: "Meditation"
  }),
  "1 Corinthians 15-16": guidedDevotional({
    title: "Resurrection and steadfastness",
    context: "Paul defends the resurrection, then closes with practical instructions and affection for fellow workers. In 1 Corinthians, Paul pastors a divided and gifted church by bringing its pride, worship, bodies, and hope under the cross through 1 Corinthians 15-16.",
    body: "The resurrection is the foundation for steadfast faithfulness. Because Christ has been raised, labor in the Lord is not in vain. Paul moves from future hope to present endurance, generosity, courage, love, and partnership.",
    observationQuestion: "What does Paul say follows if Christ has been raised?",
    reflectionQuestion: "How does resurrection hope make today's ordinary faithfulness worth it?",
    prayer: "Risen Christ, make me steadfast, immovable, and abounding in Your work.",
    gentleAction: "Do one ordinary act of service as labor that is not in vain.",
    studyMethod: "SOAP"
  }),
  "2 Corinthians 1-2": guidedDevotional({
    title: "Comfort and costly forgiveness",
    context: "Paul begins with the God of all comfort, explains affliction, and urges restored love toward a repentant offender. In 2 Corinthians, Paul's suffering, apostolic ministry, reconciliation, generosity, and weakness form the pastoral setting for 2 Corinthians 1-2.",
    body: "Paul does not hide suffering. Comfort comes from God and then moves through His people to others. The church must also practice forgiveness and restoration where repentance is real, so sorrow does not become despair.",
    observationQuestion: "How does comfort move from God to Paul and then to others?",
    reflectionQuestion: "Where might received comfort need to become shared comfort or forgiving love?",
    prayer: "God of all comfort, comfort me in Christ and make me a comfort to others.",
    gentleAction: "Send one gentle word of comfort to someone who is burdened.",
    studyMethod: "OIA"
  }),
  "2 Corinthians 3-4": guidedDevotional({
    title: "Treasure in jars of clay",
    context: "Paul contrasts old and new covenant ministry and describes weakness as the setting for God's surpassing power. In 2 Corinthians, Paul's suffering, apostolic ministry, reconciliation, generosity, and weakness form the pastoral setting for 2 Corinthians 3-4.",
    body: "New covenant ministry is marked by the Spirit, unveiled sight of Christ's glory, and perseverance in weakness. The treasure is not the messenger's impressiveness but the gospel of Christ. Fragile jars of clay make God's power clearer.",
    observationQuestion: "What contrasts does Paul make between veil and glory, weakness and power?",
    reflectionQuestion: "When weakness feels discouraging, how does this passage invite you to trust God's power?",
    prayer: "Lord, let the treasure of Christ shine through my weakness.",
    gentleAction: "Name one weakness and ask how it could display dependence on God.",
    studyMethod: "COMA"
  }),
  "2 Corinthians 5-6": guidedDevotional({
    title: "New creation and reconciliation",
    context: "Paul speaks of resurrection hope, pleasing Christ, new creation, reconciliation, and faithful ministry under hardship. In 2 Corinthians, Paul's suffering, apostolic ministry, reconciliation, generosity, and weakness form the pastoral setting for 2 Corinthians 5-6.",
    body: "In Christ, new creation has begun. Believers are reconciled to God and entrusted with a message of reconciliation. This calling is carried in real hardship, but it is strengthened by the love of Christ and the promise of life beyond death.",
    observationQuestion: "What does Paul say Christ's love does, and what ministry is entrusted to believers?",
    reflectionQuestion: "Where should reconciliation with God reshape the way you relate to others?",
    prayer: "Lord Jesus, let Your reconciling love control me and move through me.",
    gentleAction: "Pray for one strained relationship in light of Christ's reconciling work.",
    studyMethod: "Inductive"
  }),
  "2 Corinthians 7-8": guidedDevotional({
    title: "Godly grief and generous grace",
    context: "Paul rejoices over repentance and then points to the Macedonians' generous giving by God's grace. In 2 Corinthians, Paul's suffering, apostolic ministry, reconciliation, generosity, and weakness form the pastoral setting for 2 Corinthians 7-8.",
    body: "Godly grief leads to repentance without regret, not shame that crushes. Grace also produces generosity that surprises worldly expectations. Paul roots giving in Christ Himself, who became poor so that His people might become rich in grace.",
    observationQuestion: "What fruit comes from godly grief, and what motivates generous giving?",
    reflectionQuestion: "Where do you need repentance that leads to life or generosity shaped by grace?",
    prayer: "Lord, give me repentance without despair and generosity rooted in Christ's grace.",
    gentleAction: "Choose one small act of generosity that reflects grace, not pressure.",
    studyMethod: "SOAP"
  }),
  "2 Corinthians 9-10": guidedDevotional({
    title: "Cheerful giving and humble strength",
    context: "Paul continues teaching about generosity, then defends ministry with spiritual rather than worldly weapons. In 2 Corinthians, Paul's suffering, apostolic ministry, reconciliation, generosity, and weakness form the pastoral setting for 2 Corinthians 9-10.",
    body: "God loves cheerful giving because generosity reflects trust in His provision. Paul also refuses worldly boasting, reminding the church that spiritual strength is not measured by appearances. The gospel forms open hands and humbled confidence.",
    observationQuestion: "What does Paul say about sowing, giving, boasting, and spiritual weapons?",
    reflectionQuestion: "Where do you need either open-handed generosity or freedom from appearance-based boasting?",
    prayer: "God, make me cheerful in generosity and humble in confidence before You.",
    gentleAction: "Give, share, or encourage in a way that does not seek attention.",
    studyMethod: "OIA"
  }),
  "2 Corinthians 11-12": guidedDevotional({
    title: "Power made perfect in weakness",
    context: "Paul warns against false apostles and describes boasting only in weakness because Christ's grace is sufficient. In 2 Corinthians, Paul's suffering, apostolic ministry, reconciliation, generosity, and weakness form the pastoral setting for 2 Corinthians 11-12.",
    body: "Paul's weakness is not a branding strategy; it is where Christ's power is displayed. He refuses impressive spiritual performance that leads people away from sincere devotion to Christ. The thorn remains, but grace is sufficient.",
    observationQuestion: "What does Paul fear for the church, and what does the Lord say about weakness?",
    reflectionQuestion: "What weakness could become a place to rely more deeply on Christ's sufficient grace?",
    prayer: "Lord Jesus, let Your grace be sufficient and Your power rest on me in weakness.",
    gentleAction: "Pray, 'Your grace is sufficient,' over one limitation today.",
    studyMethod: "Meditation"
  }),
  "2 Corinthians 13; Galatians 1": guidedDevotional({
    title: "Examine yourselves, hold fast to grace",
    context: "Paul closes 2 Corinthians with a call to self-examination, then opens Galatians defending the one true gospel. In 2 Corinthians, Paul's suffering, apostolic ministry, reconciliation, generosity, and weakness form the pastoral setting for 2 Corinthians 13; Galatians 1.",
    body: "These chapters hold together sober self-examination and fierce gospel clarity. Paul wants believers to test whether they are in the faith, but he also refuses any distorted gospel that adds to Christ. Healthy faith is honest before God and anchored in grace.",
    observationQuestion: "What does Paul urge the Corinthians to examine, and what warning does he give the Galatians?",
    reflectionQuestion: "Where do you need both honest self-examination and renewed confidence in the gospel of grace?",
    prayer: "Lord Jesus, keep me honest before You and guarded from every distortion of Your gospel.",
    gentleAction: "Name one fruit of faith to examine and one gospel truth to hold fast.",
    studyMethod: "COMA"
  }),
  "Galatians 2-3": guidedDevotional({
    title: "Crucified with Christ",
    context: "Paul defends justification by faith and confronts any return to law-based acceptance before God. In Galatians, Paul defends the gospel of grace against law-based identity and shows Spirit-shaped freedom in Galatians 2-3.",
    body: "Paul insists that sinners are justified through faith in Christ, not works of the law. The Christian life is not self-salvation dressed in religious language; it is union with Christ. You live by faith in the Son of God, who loved you and gave Himself for you.",
    observationQuestion: "What does Paul say about justification, faith, the law, and Christ's giving of Himself?",
    reflectionQuestion: "Where are you tempted to rebuild a performance-based standing before God?",
    prayer: "Lord Jesus, help me live by faith in You, the Son of God who loved me and gave Yourself for me.",
    gentleAction: "Write Galatians 2:20 in your own words as a prayer.",
    studyMethod: "SOAP"
  }),
  "Galatians 4-5": guidedDevotional({
    title: "Freedom through the Spirit",
    context: "Paul describes adoption in Christ and calls believers to stand firm in freedom and walk by the Spirit. In Galatians, Paul defends the gospel of grace against law-based identity and shows Spirit-shaped freedom in Galatians 4-5.",
    body: "The gospel makes slaves into children who cry, 'Abba, Father.' Freedom in Christ is not permission for self-indulgence; it is life by the Spirit, expressed through love. The fruit of the Spirit shows what freedom grows into over time.",
    observationQuestion: "What does Paul say about adoption, freedom, love, and the Spirit's fruit?",
    reflectionQuestion: "Where should freedom in Christ become love rather than self-protection or self-indulgence?",
    prayer: "Father, teach me to live as Your child and walk by the Spirit in love.",
    gentleAction: "Choose one fruit of the Spirit to pray for and practice today.",
    studyMethod: "OIA"
  }),
  "Galatians 6; Ephesians 1": guidedDevotional({
    title: "Boasting in the cross, blessed in Christ",
    context: "Galatians closes with cross-shaped boasting, and Ephesians opens with praise for every spiritual blessing in Christ. In Galatians, Paul defends the gospel of grace against law-based identity and shows Spirit-shaped freedom in Galatians 6; Ephesians 1.",
    body: "Paul ends Galatians refusing to boast except in the cross, then begins Ephesians blessing God for grace planned, accomplished, and sealed in Christ. The Christian's identity is not self-made. It is received in Christ and marked by His cross.",
    observationQuestion: "What does Paul boast in, and what blessings does he name in Christ?",
    reflectionQuestion: "Which blessing in Christ needs to become more real to your sense of identity?",
    prayer: "Father, teach me to boast in the cross and receive every blessing You give in Christ.",
    gentleAction: "Choose one phrase from Ephesians 1 and thank God for it slowly.",
    studyMethod: "Inductive"
  }),
  "Ephesians 2-3": guidedDevotional({
    title: "Grace creates one new people",
    context: "Paul explains salvation by grace and the mystery of Jews and Gentiles made one in Christ. In Ephesians, God's saving purpose in Christ creates a new people whose unity, holiness, and spiritual endurance shape Ephesians 2-3.",
    body: "Ephesians 2 begins with death and mercy, then moves to reconciliation. Grace saves individuals and creates a new people, breaking down hostility through the cross. Paul's prayer in chapter 3 asks that believers would know Christ's love beyond knowledge.",
    observationQuestion: "What does God do by grace, and what dividing wall has Christ broken down?",
    reflectionQuestion: "How should grace make you humbler before God and more welcoming toward others?",
    prayer: "Lord, root me in Christ's love and make me part of Your reconciled people.",
    gentleAction: "Pray for one relationship or group where Christ's peace is needed.",
    studyMethod: "SOAP"
  }),
  "Ephesians 4-5": guidedDevotional({
    title: "Walk worthy in love and light",
    context: "Paul moves from doctrine to the church's shared life, calling believers to unity, maturity, holiness, love, and light. In Ephesians, God's saving purpose in Christ creates a new people whose unity, holiness, and spiritual endurance shape Ephesians 4-5.",
    body: "The gospel creates a new walk. Believers put off the old self and put on the new, speaking truth, forgiving as God forgave them, walking in love, and walking as children of light. Doctrine becomes visible in habits, speech, purity, and relationships.",
    observationQuestion: "What old patterns are to be put off, and what new patterns are to be put on?",
    reflectionQuestion: "Which part of your walk needs to better match the grace you have received?",
    prayer: "Lord Jesus, make my life worthy of Your calling, full of truth, forgiveness, love, and light.",
    gentleAction: "Practice one specific 'put off' and one specific 'put on' today.",
    studyMethod: "OIA"
  }),
  "Ephesians 6; Philippians 1": guidedDevotional({
    title: "Stand firm, live worthy",
    context: "Ephesians ends with spiritual warfare and prayer, while Philippians begins with gospel partnership and courage. In Ephesians, God's saving purpose in Christ creates a new people whose unity, holiness, and spiritual endurance shape Ephesians 6; Philippians 1.",
    body: "Paul calls believers to stand in the Lord's strength, clothed with God's armor and dependent in prayer. Philippians then shows gospel partnership marked by affection, discernment, and courage. The Christian life is not passive; it stands firm and lives worthy of the gospel.",
    observationQuestion: "What resources does God give for standing firm, and what does Paul pray for in Philippians?",
    reflectionQuestion: "Where do you need strength to stand firm and love to grow in discernment?",
    prayer: "Lord, strengthen me in Your armor and make my life worthy of the gospel.",
    gentleAction: "Pray through one piece of God's armor before a difficult part of your day.",
    studyMethod: "COMA"
  }),
  "Philippians 2-3": guidedDevotional({
    title: "The mind of Christ",
    context: "Paul points to Christ's humility and exaltation, then counts everything loss because of the surpassing worth of knowing Him. In Philippians, joy, humility, partnership, and perseverance in Christ frame Paul's counsel through Philippians 2-3.",
    body: "Christ's humility is the pattern for the church's life together. Paul then shows the same gospel logic personally: status and achievement are loss compared with knowing Christ. The Christian presses on because Christ has made them His own.",
    observationQuestion: "What does Christ's humility look like, and what does Paul count as loss?",
    reflectionQuestion: "Where does the mind of Christ confront pride, rivalry, or misplaced confidence?",
    prayer: "Lord Jesus, form Your humility in me and make knowing You my surpassing treasure.",
    gentleAction: "Take one lowly step of service that no one needs to applaud.",
    studyMethod: "Meditation"
  }),
  "Philippians 4; Colossians 1": guidedDevotional({
    title: "Peace and the preeminence of Christ",
    context: "Philippians closes with peace, contentment, and generosity, while Colossians opens with the supremacy of Christ. In Philippians, joy, humility, partnership, and perseverance in Christ frame Paul's counsel through Philippians 4; Colossians 1.",
    body: "Paul's peace is not detached from Christ's greatness. Philippians calls anxious hearts to prayer and contentment; Colossians shows the Son as image of God, Creator, Sustainer, Redeemer, and Head of the church. Peace grows as the heart is anchored in Christ's preeminence.",
    observationQuestion: "What does Paul say about prayer, contentment, and the supremacy of Christ?",
    reflectionQuestion: "Which concern needs to be brought under the greatness and nearness of Christ?",
    prayer: "Lord Jesus, rule my heart with Your peace and keep my eyes fixed on Your glory.",
    gentleAction: "Turn one anxious thought into a specific prayer with thanksgiving.",
    studyMethod: "SOAP"
  }),
  "Colossians 2-3": guidedDevotional({
    title: "Rooted in Christ, raised with Christ",
    context: "Paul warns against empty teaching and calls believers to live from their union with Christ. In Colossians, Christ's supremacy and sufficiency guard the church from rival spiritual claims and shape new life in Colossians 2-3.",
    body: "Colossians roots maturity in Christ Himself. Believers are filled in Him, buried and raised with Him, and called to set their minds above because their life is hidden with Christ in God. New life then becomes visible in putting off sin and putting on love.",
    observationQuestion: "What does Paul say believers have in Christ, and what are they called to put off and put on?",
    reflectionQuestion: "Where should being raised with Christ change your attention, desires, or relationships?",
    prayer: "Christ, keep me rooted in You and make my hidden life with You visible in love.",
    gentleAction: "Choose one 'put on' quality from Colossians 3 to practice deliberately.",
    studyMethod: "Inductive"
  }),
  "Colossians 4; 1 Thessalonians 1": guidedDevotional({
    title: "Prayerful witness and visible faith",
    context: "Colossians closes with prayerful, gracious speech, and 1 Thessalonians opens by celebrating faith, love, and hope. In Colossians, Christ's supremacy and sufficiency guard the church from rival spiritual claims and shape new life in Colossians 4; 1 Thessalonians 1.",
    body: "Paul joins witness and character. Believers are to pray for open doors, speak with grace, and live in such a way that faith, love, and hope become visible. The gospel rings out through ordinary communities shaped by Christ.",
    observationQuestion: "What does Paul ask believers to pray for, and what does he celebrate in the Thessalonians?",
    reflectionQuestion: "How could your speech or daily faith make Christ more visible this week?",
    prayer: "Lord, open doors for Your Word and make my faith, love, and hope visible.",
    gentleAction: "Prepare one gracious sentence that could point someone toward Christ.",
    studyMethod: "OIA"
  }),
  "1 Thessalonians 2-3": guidedDevotional({
    title: "Gentle care and steadfast faith",
    context: "Paul recalls his gentle, honest ministry among the Thessalonians and his concern for their endurance. In the Thessalonian letters, Paul encourages a young church in faith, holiness, work, endurance, and hope in Christ's return through 1 Thessalonians 2-3.",
    body: "Gospel ministry is both truthful and tender. Paul compares his care to a nursing mother and an encouraging father, then rejoices that the believers stand firm. Christian encouragement is not vague positivity; it helps faith endure under pressure.",
    observationQuestion: "What images does Paul use for his care, and what does he desire for their faith?",
    reflectionQuestion: "Who needs your truthful, gentle encouragement to stand firm?",
    prayer: "Lord, make me tender, truthful, and strengthening toward others in faith.",
    gentleAction: "Encourage one believer with a specific reminder of God's faithfulness.",
    studyMethod: "SOAP"
  }),
  "1 Thessalonians 4-5": guidedDevotional({
    title: "Holiness, hope, and watchfulness",
    context: "Paul teaches about holiness, brotherly love, resurrection hope, the day of the Lord, and life together. In the Thessalonian letters, Paul encourages a young church in faith, holiness, work, endurance, and hope in Christ's return through 1 Thessalonians 4-5.",
    body: "The hope of Christ's return shapes present holiness. Paul comforts grief with resurrection promise and calls the church to watchfulness, encouragement, prayer, gratitude, and discernment. Future hope should make ordinary faithfulness steadier.",
    observationQuestion: "What does Paul teach about holiness, grief, Christ's return, and life together?",
    reflectionQuestion: "How should resurrection hope change the way you grieve, encourage, or pursue holiness?",
    prayer: "Lord Jesus, sanctify me and keep me watchful in hope until You come.",
    gentleAction: "Use 1 Thessalonians 5:16-18 as a simple rhythm today: rejoice, pray, give thanks.",
    studyMethod: "COMA"
  }),
  "2 Thessalonians 1-2": guidedDevotional({
    title: "Steady hope under confusion",
    context: "Paul comforts suffering believers and corrects confusion about the day of the Lord. In the Thessalonian letters, Paul encourages a young church in faith, holiness, work, endurance, and hope in Christ's return through 2 Thessalonians 1-2.",
    body: "The Thessalonians face affliction and unsettling claims, but Paul anchors them in God's righteous judgment, Christ's glory, and the truth they received. Hope does not need speculation to survive; it needs steadfast trust in the Lord who will set things right.",
    observationQuestion: "What comfort and correction does Paul give to suffering and unsettled believers?",
    reflectionQuestion: "Where do you need steady hope rather than anxious speculation?",
    prayer: "Lord Jesus, steady me in truth, hope, and endurance under pressure.",
    gentleAction: "Turn one anxious question about the future into trust in Christ's faithful return.",
    studyMethod: "Inductive"
  }),
  "2 Thessalonians 3; 1 Timothy 1": guidedDevotional({
    title: "Faithful order and abundant mercy",
    context: "Paul calls for prayer, ordered work, and perseverance, then opens 1 Timothy by celebrating mercy to sinners. In the Thessalonian letters, Paul encourages a young church in faith, holiness, work, endurance, and hope in Christ's return through 2 Thessalonians 3; 1 Timothy 1.",
    body: "Paul cares about both church order and gospel mercy. The Lord is faithful to establish and guard His people, and Christ came into the world to save sinners. Ordered discipleship must never forget the mercy that rescued Paul and rescues us.",
    observationQuestion: "What does Paul ask believers to pray for, and how does he describe Christ's mercy in 1 Timothy?",
    reflectionQuestion: "Where do you need both disciplined faithfulness and fresh gratitude for mercy?",
    prayer: "Lord, establish me in faithfulness and keep me amazed that Christ saves sinners.",
    gentleAction: "Pray for the Word of the Lord to speed ahead in one place or person.",
    studyMethod: "SOAP"
  }),
  "1 Timothy 2-3": guidedDevotional({
    title: "Prayer and faithful leadership",
    context: "Paul gives instructions about prayer, godliness, and qualifications for overseers and deacons. In the Pastoral Letters, Paul instructs Timothy about sound teaching, church order, godliness, endurance, and faithful ministry in 1 Timothy 2-3.",
    body: "The church's life is to be shaped by prayer, peaceable godliness, and trustworthy leadership. Paul grounds the church's hope in the one mediator, Christ Jesus, who gave Himself as a ransom. Leadership matters because the church belongs to the living God.",
    observationQuestion: "What does Paul teach about prayer, Christ as mediator, and church leadership?",
    reflectionQuestion: "How can you pray more faithfully for leaders and for people to know Christ?",
    prayer: "God our Savior, make Your church prayerful, godly, and faithful under Christ our mediator.",
    gentleAction: "Pray for church leaders and for one public authority by name.",
    studyMethod: "OIA"
  }),
  "1 Timothy 4-5": guidedDevotional({
    title: "Train for godliness, care for people",
    context: "Paul warns against false teaching, urges Timothy toward godliness, and gives practical care instructions for the church. In the Pastoral Letters, Paul instructs Timothy about sound teaching, church order, godliness, endurance, and faithful ministry in 1 Timothy 4-5.",
    body: "Godliness is trained over time through Scripture, teaching, example, and perseverance. Paul also shows that doctrine must produce practical care, especially for vulnerable people. Truth and tenderness are not enemies in a healthy church.",
    observationQuestion: "What is Timothy told to train, teach, model, and care for?",
    reflectionQuestion: "What small training habit in godliness would be faithful for you right now?",
    prayer: "Lord, train me in godliness and make my doctrine visible in practical care.",
    gentleAction: "Choose one repeatable practice: Scripture, prayer, service, or encouragement.",
    studyMethod: "COMA"
  }),
  "1 Timothy 6; 2 Timothy 1": guidedDevotional({
    title: "Contentment and courage",
    context: "Paul warns about greed and calls Timothy to fight the good fight, then urges him not to be ashamed of the gospel. In the Pastoral Letters, Paul instructs Timothy about sound teaching, church order, godliness, endurance, and faithful ministry in 1 Timothy 6; 2 Timothy 1.",
    body: "Contentment guards the heart from the love of money, and courage guards witness from shame. Paul calls Timothy to hold eternal life, guard the good deposit, and rely on God's power. Faithfulness requires both loosened hands and strengthened courage.",
    observationQuestion: "What dangers and commands does Paul name around wealth, witness, and guarding the gospel?",
    reflectionQuestion: "Where do you need contentment with earthly things and courage in gospel witness?",
    prayer: "Lord, free me from greed and strengthen me to guard and share the gospel without shame.",
    gentleAction: "Give thanks for enough, then pray for courage in one gospel opportunity.",
    studyMethod: "Inductive"
  }),
  "2 Timothy 2-3": guidedDevotional({
    title: "Endure and continue in Scripture",
    context: "Paul calls Timothy to endure as a faithful worker and continue in the Scriptures that make one wise for salvation. In the Pastoral Letters, Paul instructs Timothy about sound teaching, church order, godliness, endurance, and faithful ministry in 2 Timothy 2-3.",
    body: "Faithful ministry is not glamorous. It includes endurance, careful handling of the Word, fleeing sin, gentle correction, and continuing in Scripture. The Word equips God's servant for every good work because it is breathed out by God.",
    observationQuestion: "What images and commands does Paul use for faithful endurance and Scripture-shaped ministry?",
    reflectionQuestion: "Where do you need to continue steadily rather than chase something new?",
    prayer: "Lord, make me faithful, gentle, and deeply shaped by Your breathed-out Word.",
    gentleAction: "Read 2 Timothy 3:16-17 and name one way Scripture can equip you today.",
    studyMethod: "SOAP"
  }),
  "2 Timothy 4; Titus 1": guidedDevotional({
    title: "Finish faithfully, appoint faithfully",
    context: "Paul charges Timothy to preach the Word and finishes with personal reflections, while Titus is told to appoint qualified elders. In the Pastoral Letters, Paul instructs Timothy about sound teaching, church order, godliness, endurance, and faithful ministry in 2 Timothy 4; Titus 1.",
    body: "Paul's final charge is sober and hopeful: preach the Word, endure, fulfill your ministry. His own race is nearly complete. Titus 1 reminds the church that faithful teaching and qualified leadership protect God's people from empty talk and error.",
    observationQuestion: "What charge does Paul give Timothy, and what qualities matter for elders in Titus?",
    reflectionQuestion: "What would faithful finishing look like in the responsibility God has given you?",
    prayer: "Lord, help me fulfill my calling faithfully and love sound teaching.",
    gentleAction: "Pray for perseverance in one responsibility that feels tiring.",
    studyMethod: "COMA"
  }),
  "Titus 2": guidedDevotional({
    title: "Grace trains us",
    context: "Paul describes sound teaching across generations and explains that God's grace trains believers for godly living. In Titus, grace trains God's people in sound teaching and visible good works within the church's public witness in Titus 2.",
    body: "Grace is not only pardon; it is a teacher. The grace of God has appeared in Christ, bringing salvation and training believers to renounce ungodliness while waiting for blessed hope. Good works flow from a people redeemed by Christ.",
    observationQuestion: "What does grace train believers to renounce, pursue, and wait for?",
    reflectionQuestion: "Where is grace training you toward a more self-controlled, upright, and godly life?",
    prayer: "Lord Jesus, let Your grace train me while I wait for Your appearing.",
    gentleAction: "Identify one ungodly habit to renounce and one good work to practice.",
    studyMethod: "OIA"
  }),
  "Titus 3": guidedDevotional({
    title: "Saved by mercy",
    context: "Paul calls believers to gentle public conduct and grounds salvation in God's mercy, not works. In Titus, grace trains God's people in sound teaching and visible good works within the church's public witness in Titus 3.",
    body: "Titus 3 joins humility toward others with memory of mercy. Believers should not be quarrelsome or harsh because they too were rescued by God's kindness. Salvation comes through mercy, renewal by the Spirit, and justification by grace.",
    observationQuestion: "What conduct does Paul command, and how does he describe God's saving mercy?",
    reflectionQuestion: "How should remembering mercy make you gentler toward others?",
    prayer: "God of mercy, renew me by Your Spirit and make me gentle because I have received grace.",
    gentleAction: "Choose gentleness in one conversation where irritation would be easier.",
    studyMethod: "SOAP"
  }),
  "Philemon 1": guidedDevotional({
    title: "The gospel reshapes relationships",
    context: "Paul appeals to Philemon to receive Onesimus no longer merely as a slave, but as a beloved brother. In Philemon, Paul applies the gospel to reconciliation, brotherhood, and costly love within a real household situation in Philemon 1.",
    body: "Philemon is personal, but not small. Paul applies the gospel to a strained and costly relationship, appealing through love rather than coercion. In Christ, reconciliation must become visible in how believers receive one another.",
    observationQuestion: "How does Paul describe Onesimus, and what does he ask Philemon to do?",
    reflectionQuestion: "Where might the gospel require costly welcome, forgiveness, or restored relationship?",
    prayer: "Lord Jesus, let Your reconciling grace reshape the way I receive and forgive others.",
    gentleAction: "Pray honestly about one relationship where gospel-shaped reconciliation is needed.",
    studyMethod: "OIA"
  })
};

const majorProphetsOverviewDevotionals: Record<string, BibleReadingPlanDayExtras> = {
  "Isaiah 1-5": guidedDevotional({
    title: "The Holy One calls His people back",
    context: "Isaiah opens by exposing Judah's rebellion, empty worship, social injustice, and the Lord's call to cleansing and repentance. Keep Isaiah's Judah-and-Zion setting in view: holy judgment, failed trust, servant hope, and promised restoration are being proclaimed through Isaiah 1-5.",
    body: "Isaiah begins with a wound diagnosis. God's people have religious activity, but their hearts and public life are far from Him. Yet judgment is not the only word: the Holy One calls them to reason together, be cleansed, and learn to do good.",
    observationQuestion: "What sins does the Lord expose, and what return does He invite?",
    reflectionQuestion: "Where might outward religion need to become repentance, justice, and renewed obedience?",
    prayer: "Holy Lord, cleanse what is false in me and teach me to do good before You.",
    gentleAction: "Choose one practical act of justice, mercy, or repentance today.",
    studyMethod: "COMA"
  }),
  "Isaiah 6-10": guidedDevotional({
    title: "Holy, holy, holy",
    context: "Isaiah sees the Lord's holiness, is cleansed, and is sent into a hard ministry amid judgment and promise. Keep Isaiah's Judah-and-Zion setting in view: holy judgment, failed trust, servant hope, and promised restoration are being proclaimed through Isaiah 6-10.",
    body: "The prophet's calling begins with worship and cleansing. Isaiah is undone before the Holy One, yet grace touches his guilt. These chapters also hold a promised child, Immanuel hope, and warnings against fear-driven alliances.",
    observationQuestion: "What does Isaiah see, confess, receive, and hear?",
    reflectionQuestion: "How should God's holiness and grace reshape your readiness to obey?",
    prayer: "Holy Lord, cleanse my lips and make me willing to go where You send.",
    gentleAction: "Pray Isaiah's words, 'Here am I. Send me,' over one faithful step.",
    studyMethod: "SOAP"
  }),
  "Isaiah 11-15": guidedDevotional({
    title: "The righteous Branch",
    context: "Isaiah promises a Spirit-filled ruler from Jesse's line, then turns to songs of salvation and oracles over the nations. Keep Isaiah's Judah-and-Zion setting in view: holy judgment, failed trust, servant hope, and promised restoration are being proclaimed through Isaiah 11-15.",
    body: "Judgment over proud nations is real, but it is not the whole horizon. Isaiah sees a righteous King who will rule with justice and bring peace beyond human ability. God's salvation becomes a song because His rule is both holy and hopeful.",
    observationQuestion: "What kind of ruler is promised, and what future peace is described?",
    reflectionQuestion: "Where do you need hope in Christ's righteous reign rather than trust in human power?",
    prayer: "Righteous King, rule with wisdom, justice, and peace in me and in Your world.",
    gentleAction: "Pray for one place where Christ's justice and peace are needed.",
    studyMethod: "Biblical theology"
  }),
  "Isaiah 16-19": guidedDevotional({
    title: "Mercy beyond borders",
    context: "Isaiah speaks oracles concerning Moab, Damascus, Cush, and Egypt, showing the Lord's authority over all nations. Keep Isaiah's Judah-and-Zion setting in view: holy judgment, failed trust, servant hope, and promised restoration are being proclaimed through Isaiah 16-19.",
    body: "The prophets are not only interested in Israel's private spirituality. The Lord rules over nations, pride, fear, oppression, and false worship. Even Egypt's oracle contains surprising hope that former enemies may know and worship the Lord.",
    observationQuestion: "What judgments are named, and what surprising hope appears for Egypt?",
    reflectionQuestion: "How does God's concern for the nations enlarge your prayers and expectations?",
    prayer: "Lord of all nations, humble pride, heal enemies, and draw peoples to worship You.",
    gentleAction: "Pray for a nation or people group beyond your own.",
    studyMethod: "OIA"
  }),
  "Isaiah 20-23": guidedDevotional({
    title: "When human security fails",
    context: "Isaiah gives signs and oracles against nations and cities that trust power, wealth, alliances, or reputation. Keep Isaiah's Judah-and-Zion setting in view: holy judgment, failed trust, servant hope, and promised restoration are being proclaimed through Isaiah 20-23.",
    body: "These chapters unsettle false security. Egypt, Cush, Babylon, Edom, Arabia, Jerusalem, and Tyre all show that human strength cannot become ultimate refuge. The Lord exposes what people trust so they might return to Him as true security.",
    observationQuestion: "What sources of security are exposed as fragile in these chapters?",
    reflectionQuestion: "What earthly security are you tempted to treat as stronger than the Lord?",
    prayer: "Lord, loosen my trust in fragile things and teach me to find refuge in You.",
    gentleAction: "Name one false security and answer it with a truth about God.",
    studyMethod: "COMA"
  }),
  "Isaiah 24-27": guidedDevotional({
    title: "Judgment and the feast of salvation",
    context: "Isaiah widens the view to worldwide judgment, songs of trust, and the Lord's promised feast where death is swallowed up. Keep Isaiah's Judah-and-Zion setting in view: holy judgment, failed trust, servant hope, and promised restoration are being proclaimed through Isaiah 24-27.",
    body: "Isaiah does not minimize judgment, but he also gives a breathtaking vision of salvation. The Lord will swallow up death, wipe away tears, and provide a feast for all peoples. Hope is not escape from holiness; it is salvation through the holy God who reigns.",
    observationQuestion: "What judgment is described, and what salvation does the Lord promise?",
    reflectionQuestion: "Which promise in these chapters strengthens your hope beyond present trouble?",
    prayer: "Lord, keep my hope fixed on Your victory over death and Your promised salvation.",
    gentleAction: "Carry Isaiah 25:8 as a sentence of hope today.",
    studyMethod: "Meditation"
  }),
  "Isaiah 28-31": guidedDevotional({
    title: "A sure foundation",
    context: "Isaiah confronts pride, false refuge, empty counsel, and reliance on Egypt rather than quiet trust in the Lord. Keep Isaiah's Judah-and-Zion setting in view: holy judgment, failed trust, servant hope, and promised restoration are being proclaimed through Isaiah 28-31.",
    body: "The Lord exposes lies that people use as shelter. Against unstable refuge, He promises a precious cornerstone, a sure foundation. The call is not frantic self-rescue but returning, rest, quietness, and trust in the Lord.",
    observationQuestion: "What false refuges are exposed, and what true foundation is promised?",
    reflectionQuestion: "Where are you tempted to seek frantic rescue rather than quiet trust?",
    prayer: "Lord, be my sure foundation and teach me the strength of quiet trust.",
    gentleAction: "Before acting from panic, pause and pray Isaiah 30:15 in your own words.",
    studyMethod: "SOAP"
  }),
  "Isaiah 32-35": guidedDevotional({
    title: "The wilderness will blossom",
    context: "Isaiah looks toward righteous rule, the Spirit poured out, judgment on evil, and restoration pictured as a blossoming wilderness. Keep Isaiah's Judah-and-Zion setting in view: holy judgment, failed trust, servant hope, and promised restoration are being proclaimed through Isaiah 32-35.",
    body: "The prophets often move from devastation to restoration. Isaiah promises a future where righteousness brings peace, the weak are strengthened, and the redeemed return with singing. The Lord's salvation renews both people and creation.",
    observationQuestion: "What changes when righteousness, the Spirit, and redemption are described?",
    reflectionQuestion: "Where do you need courage from the promise that the Lord will renew what is barren?",
    prayer: "Lord, strengthen weak hands, steady fearful hearts, and make barren places blossom by Your grace.",
    gentleAction: "Encourage one weary person with a hope rooted in God's promise.",
    studyMethod: "OIA"
  }),
  "Isaiah 36-39": guidedDevotional({
    title: "Trust under threat",
    context: "Jerusalem faces Assyrian intimidation, Hezekiah prays, the Lord delivers, and later Hezekiah stumbles through pride. Keep Isaiah's Judah-and-Zion setting in view: holy judgment, failed trust, servant hope, and promised restoration are being proclaimed through Isaiah 36-39.",
    body: "The Assyrian threat is loud, public, and frightening, but Hezekiah brings the letter before the Lord. Deliverance comes by God's zeal, not Judah's strength. Yet the later pride with Babylon warns that yesterday's faithfulness does not remove today's need for humility.",
    observationQuestion: "How does Hezekiah respond to threat, and where does he later fail?",
    reflectionQuestion: "What threat needs to be spread before the Lord, and what pride needs watching?",
    prayer: "Lord, teach me to bring threats to You and remain humble after mercy.",
    gentleAction: "Write one pressure as a prayer and place it before God.",
    studyMethod: "COMA"
  }),
  "Isaiah 40-43": guidedDevotional({
    title: "Comfort for weary people",
    context: "Isaiah announces comfort, the greatness of God, the servant of the Lord, and redemption through waters and fire. Keep Isaiah's Judah-and-Zion setting in view: holy judgment, failed trust, servant hope, and promised restoration are being proclaimed through Isaiah 40-43.",
    body: "After judgment, the Lord speaks comfort. He is Creator, Shepherd, incomparable King, and Redeemer. His people are weak, but He gives strength; they pass through waters and fire, but they are called by name and belong to Him.",
    observationQuestion: "What names, actions, and promises reveal God's comfort and greatness?",
    reflectionQuestion: "Which promise do you most need as a weary or fearful person today?",
    prayer: "Lord, renew my strength and help me remember that I am Yours.",
    gentleAction: "Read Isaiah 43:1 slowly as God's covenant comfort, then thank Him for belonging to Him in Christ.",
    studyMethod: "Meditation"
  }),
  "Isaiah 44-47": guidedDevotional({
    title: "No other God",
    context: "Isaiah contrasts the living Lord with powerless idols and announces God's sovereign purpose through Cyrus. Keep Isaiah's Judah-and-Zion setting in view: holy judgment, failed trust, servant hope, and promised restoration are being proclaimed through Isaiah 44-47.",
    body: "Idols are exposed as human-made and unable to save. The Lord alone creates, redeems, names the future, and carries His purposes forward. These chapters invite worshipful confidence in the God who is not managed by human hands.",
    observationQuestion: "How are idols described, and how is the Lord described differently?",
    reflectionQuestion: "What modern idol promises control, comfort, or identity but cannot save?",
    prayer: "Lord, turn my heart from lifeless idols to You, the living Redeemer.",
    gentleAction: "Name one false source of trust and consciously refuse its claim today.",
    studyMethod: "Inductive"
  }),
  "Isaiah 48-51": guidedDevotional({
    title: "Listen to the Redeemer",
    context: "The Lord confronts stubbornness, calls His people to listen, and reveals His servant as light to the nations. Keep Isaiah's Judah-and-Zion setting in view: holy judgment, failed trust, servant hope, and promised restoration are being proclaimed through Isaiah 48-51.",
    body: "God's redemption includes correction. He calls His people out of stubbornness and into attentive trust. The servant's mission reaches beyond Israel to the nations, showing that God's salvation is larger than His people's small expectations.",
    observationQuestion: "What does the Lord ask His people to hear, remember, and trust?",
    reflectionQuestion: "Where might stubbornness be keeping you from listening to the Lord's redeeming word?",
    prayer: "Redeemer, open my ears and make me responsive to Your voice.",
    gentleAction: "Pause before one decision and ask, 'Am I listening or resisting?'",
    studyMethod: "OIA"
  }),
  "Isaiah 52-55": guidedDevotional({
    title: "The Servant and the invitation",
    context: "Isaiah announces good news, describes the suffering Servant, and invites the thirsty to come and receive mercy. Keep Isaiah's Judah-and-Zion setting in view: holy judgment, failed trust, servant hope, and promised restoration are being proclaimed through Isaiah 52-55.",
    body: "These chapters stand near the heart of Isaiah's hope. The Servant is pierced for transgressions and bears iniquity, yet His work leads to peace and healing. Because of Him, the invitation goes out freely: come, listen, seek the Lord, receive mercy.",
    observationQuestion: "What does the Servant suffer, and what invitation follows in Isaiah 55?",
    reflectionQuestion: "How does the Servant's costly mercy make the free invitation more beautiful?",
    prayer: "Lord Jesus, thank You for bearing sin and inviting the thirsty to come.",
    gentleAction: "Answer Isaiah 55:1 in prayer: tell the Lord where you are thirsty.",
    studyMethod: "SOAP"
  }),
  "Isaiah 56-59": guidedDevotional({
    title: "A house of prayer and a need for rescue",
    context: "Isaiah speaks of welcome for outsiders, true fasting, justice, sin, and the Lord's own arm bringing salvation. Keep Isaiah's Judah-and-Zion setting in view: holy judgment, failed trust, servant hope, and promised restoration are being proclaimed through Isaiah 56-59.",
    body: "The Lord's salvation creates a people marked by worship, justice, mercy, and truth. Yet Isaiah also exposes deep sin: hands, words, and paths are corrupt. The hope is that the Lord Himself sees, acts, and brings redemption.",
    observationQuestion: "What kind of worship and justice does the Lord desire, and what sin does He expose?",
    reflectionQuestion: "Where should worship become mercy, justice, and truthful living?",
    prayer: "Lord, make my worship true and rescue what sin has made crooked.",
    gentleAction: "Practice one concrete mercy that matches your prayers.",
    studyMethod: "COMA"
  }),
  "Isaiah 60-63": guidedDevotional({
    title: "Glory, good news, and the anointed one",
    context: "Isaiah looks toward Zion's glory, the anointed messenger of good news, and the Lord's final victory. Keep Isaiah's Judah-and-Zion setting in view: holy judgment, failed trust, servant hope, and promised restoration are being proclaimed through Isaiah 60-63.",
    body: "Light rises where darkness covered the people. The anointed one brings good news to the poor, comfort to mourners, and freedom to captives. Jesus later takes Isaiah 61 upon His own lips, showing that this hope finds its center in Him.",
    observationQuestion: "What images of light, restoration, good news, and justice appear?",
    reflectionQuestion: "Where do you need Christ's good news to bring restoration rather than mere optimism?",
    prayer: "Anointed Savior, bring good news, freedom, comfort, and righteousness where I am poor and needy.",
    gentleAction: "Read Isaiah 61:1-3 and name the promise you most need today.",
    studyMethod: "Biblical theology"
  }),
  "Isaiah 64-66; Jeremiah 1": guidedDevotional({
    title: "Longing, judgment, and a prophet called",
    context: "Isaiah ends with longing for God to act, warnings of judgment, new creation hope, and Jeremiah begins with a prophet set apart. Keep Isaiah's Judah-and-Zion setting in view: holy judgment, failed trust, servant hope, and promised restoration are being proclaimed through Isaiah 64-66; Jeremiah 1.",
    body: "The transition from Isaiah to Jeremiah keeps the prophetic tension alive: longing for God, exposure of sin, promised renewal, and a servant called to speak God's word. Jeremiah's call reminds us that God's word continues to confront and heal through reluctant messengers.",
    observationQuestion: "What longings and warnings close Isaiah, and what does God say to Jeremiah?",
    reflectionQuestion: "Where do you need both longing for renewal and courage to receive God's confronting word?",
    prayer: "Lord, come near, renew what is broken, and make me receptive to Your word.",
    gentleAction: "Pray, 'Speak, Lord; I am listening,' before reading Scripture again.",
    studyMethod: "OIA"
  }),
  "Jeremiah 2-5": guidedDevotional({
    title: "Broken cisterns",
    context: "Jeremiah begins by bringing the Lord's covenant case against Judah for forsaking Him and chasing worthless gods. Keep the late-Judah and exile setting in view: covenant unfaithfulness, coming judgment, lament, and promised renewal shape the message in Jeremiah 2-5.",
    body: "The image of broken cisterns is painfully clear: God's people have left the fountain of living waters for things that cannot hold water. Jeremiah exposes spiritual adultery, injustice, and stubborn refusal to return, yet the call to repent still sounds.",
    observationQuestion: "What images does Jeremiah use for Judah's unfaithfulness?",
    reflectionQuestion: "What broken cistern are you tempted to trust for life, comfort, or security?",
    prayer: "Lord, turn me from empty substitutes and draw me back to You, the fountain of living waters.",
    gentleAction: "Name one empty substitute and answer it with a prayer of return.",
    studyMethod: "COMA"
  }),
  "Jeremiah 6-9": guidedDevotional({
    title: "Peace when there is no peace",
    context: "Jeremiah warns of coming disaster, shallow healing, rejected correction, and grief over Judah's sin. Keep the late-Judah and exile setting in view: covenant unfaithfulness, coming judgment, lament, and promised renewal shape the message in Jeremiah 6-9.",
    body: "False prophets say 'peace' while wounds remain untreated. Jeremiah shows that God is not interested in soothing language that avoids repentance. These chapters invite honest grief, humble correction, and a deeper boasting only in knowing the Lord.",
    observationQuestion: "What false assurances are exposed, and what does Jeremiah say is worth boasting in?",
    reflectionQuestion: "Where do you need honest healing rather than words that merely soothe?",
    prayer: "Lord, heal what is truly wounded and teach me to boast only in knowing You.",
    gentleAction: "Ask God to show one wound or sin that needs truthful attention.",
    studyMethod: "SOAP"
  }),
  "Jeremiah 10-13": guidedDevotional({
    title: "The living God and stubborn hearts",
    context: "Jeremiah contrasts idols with the living God and uses vivid signs to expose Judah's pride and covenant unfaithfulness. Keep the late-Judah and exile setting in view: covenant unfaithfulness, coming judgment, lament, and promised renewal shape the message in Jeremiah 10-13.",
    body: "Idols must be carried, but the living God made the heavens and the earth. Judah's problem is not lack of religious objects; it is a stubborn heart that will not listen. The prophet's signs show how pride ruins what was meant to cling close to the Lord.",
    observationQuestion: "How does Jeremiah contrast idols with the Lord, and what does the ruined waistband picture?",
    reflectionQuestion: "Where does pride keep you from clinging closely to the Lord?",
    prayer: "Living God, humble my stubborn heart and keep me close to You.",
    gentleAction: "Pause before defending yourself and ask whether pride is speaking.",
    studyMethod: "OIA"
  }),
  "Jeremiah 14-17": guidedDevotional({
    title: "The heart and the fountain",
    context: "Jeremiah laments drought and judgment, warns against false prophecy, and contrasts cursed trust in man with blessed trust in the Lord. Keep the late-Judah and exile setting in view: covenant unfaithfulness, coming judgment, lament, and promised renewal shape the message in Jeremiah 14-17.",
    body: "Jeremiah gives one of Scripture's clearest diagnoses of the human heart: deceitful and desperately sick. But the passage also offers a better root system: the one who trusts the Lord is like a tree by water. Judgment exposes, but trust returns to the fountain of living water.",
    observationQuestion: "What does Jeremiah say about the heart, trust, and the Lord as fountain?",
    reflectionQuestion: "Where are you relying on human strength instead of rooting trust in the Lord?",
    prayer: "Lord, search my heart and root my trust in You like a tree by water.",
    gentleAction: "Pray Jeremiah 17:7-8 over one anxious or self-reliant place.",
    studyMethod: "Meditation"
  }),
  "Jeremiah 18-21": guidedDevotional({
    title: "Clay in the Potter's hands",
    context: "The Lord sends Jeremiah to the potter's house and continues warning Judah through signs and confrontation. Keep the late-Judah and exile setting in view: covenant unfaithfulness, coming judgment, lament, and promised renewal shape the message in Jeremiah 18-21.",
    body: "The potter image humbles human pride without making God careless. The Lord has authority to reshape, judge, and relent according to His righteous purposes. Judah resists the word, but the image still calls for yieldedness in the hands of the Potter.",
    observationQuestion: "What does the potter's house teach Jeremiah about the Lord's authority?",
    reflectionQuestion: "Where do you need to become pliable rather than resistant before God's word?",
    prayer: "Lord, You are the Potter. Make my heart yielded and responsive in Your hands.",
    gentleAction: "Pray over one area of resistance: 'Shape this according to Your will.'",
    studyMethod: "COMA"
  }),
  "Jeremiah 22-25": guidedDevotional({
    title: "Justice, shepherds, and the righteous Branch",
    context: "Jeremiah confronts kings and leaders, announces judgment, and promises a righteous Branch from David's line. Keep the late-Judah and exile setting in view: covenant unfaithfulness, coming judgment, lament, and promised renewal shape the message in Jeremiah 22-25.",
    body: "Bad shepherds scatter and exploit, but the Lord promises a righteous King who will reign wisely and execute justice. Jeremiah's warnings are severe because leadership, justice, and worship matter. Hope comes not through corrupt rulers improving themselves, but through the Lord raising the righteous Branch.",
    observationQuestion: "What does the Lord condemn in Judah's leaders, and what future King does He promise?",
    reflectionQuestion: "How does the promise of the righteous Branch correct your hopes for human leadership?",
    prayer: "Righteous Branch, rule with justice and make me faithful under Your kingship.",
    gentleAction: "Pray for leaders to act with justice and for your own influence to serve others.",
    studyMethod: "Biblical theology"
  }),
  "Jeremiah 26-29": guidedDevotional({
    title: "Faithfulness in exile",
    context: "Jeremiah faces danger for speaking God's word and later writes to exiles, calling them to seek the welfare of the city. Keep the late-Judah and exile setting in view: covenant unfaithfulness, coming judgment, lament, and promised renewal shape the message in Jeremiah 26-29.",
    body: "Jeremiah 29 is often quoted for comfort, but it sits inside exile, discipline, and patient waiting. God's good plans do not remove the call to faithful presence. The exiles are to build, plant, pray, and seek the city's welfare while trusting God's promised future.",
    observationQuestion: "What does Jeremiah tell the exiles to do while they wait?",
    reflectionQuestion: "Where is God calling you to faithful presence rather than quick escape?",
    prayer: "Lord, help me seek faithfulness where You have placed me while trusting Your future.",
    gentleAction: "Pray for the welfare of your city, workplace, school, or neighbourhood.",
    studyMethod: "OIA"
  }),
  "Jeremiah 30-33": guidedDevotional({
    title: "A new covenant promised",
    context: "These chapters gather promises of restoration, return, healing, Davidic hope, and the new covenant written on the heart. Keep the late-Judah and exile setting in view: covenant unfaithfulness, coming judgment, lament, and promised renewal shape the message in Jeremiah 30-33.",
    body: "Jeremiah's book is not only judgment. Here the Lord promises restoration that reaches deeper than return from exile: a new covenant, forgiven sin, and God's law written on hearts. This hope finds its fulfillment in Christ, who brings covenant mercy by His blood.",
    observationQuestion: "What restoration promises does the Lord give, especially about the new covenant?",
    reflectionQuestion: "How does forgiveness and a changed heart deepen your hope beyond outward improvement?",
    prayer: "Lord, write Your word on my heart and keep me resting in Your covenant mercy.",
    gentleAction: "Thank God specifically for forgiveness and ask for inner renewal.",
    studyMethod: "SOAP"
  }),
  "Jeremiah 34-37": guidedDevotional({
    title: "Partial obedience is not covenant faithfulness",
    context: "Judah's leaders make and break a covenant to free servants, while Jeremiah continues warning amid political pressure. Keep the late-Judah and exile setting in view: covenant unfaithfulness, coming judgment, lament, and promised renewal shape the message in Jeremiah 34-37.",
    body: "These chapters show the danger of temporary obedience that collapses when pressure changes. The people release servants, then take them back. Jeremiah exposes faithfulness that is only convenient, reminding us that covenant obedience must reach beyond public gestures.",
    observationQuestion: "What covenant action is reversed, and what does that reveal?",
    reflectionQuestion: "Where might your obedience be temporary, convenient, or dependent on circumstances?",
    prayer: "Lord, make my obedience sincere and steady, not merely convenient.",
    gentleAction: "Follow through on one faithful commitment you are tempted to reverse.",
    studyMethod: "COMA"
  }),
  "Jeremiah 38-41": guidedDevotional({
    title: "Truth in the pit",
    context: "Jeremiah is thrown into a cistern, rescued, and later witnesses the fall of Jerusalem and its aftermath. Keep the late-Judah and exile setting in view: covenant unfaithfulness, coming judgment, lament, and promised renewal shape the message in Jeremiah 38-41.",
    body: "Jeremiah's faithfulness does not protect him from suffering. He is lowered into mud for speaking truth, yet the Lord preserves him. The fall of Jerusalem confirms that rejected truth does not become false; God's word stands even when ignored.",
    observationQuestion: "How is Jeremiah treated, and what happens to Jerusalem?",
    reflectionQuestion: "Where do you need courage to stay truthful even when truth is unwanted?",
    prayer: "Lord, keep me faithful to Your word when obedience feels costly or lonely.",
    gentleAction: "Pray for someone who is suffering because they have told the truth.",
    studyMethod: "OIA"
  }),
  "Jeremiah 42-45": guidedDevotional({
    title: "Asking without listening",
    context: "The remnant asks Jeremiah to seek the Lord, but they reject the answer and flee toward Egypt. Keep the late-Judah and exile setting in view: covenant unfaithfulness, coming judgment, lament, and promised renewal shape the message in Jeremiah 42-45.",
    body: "It is possible to ask for God's guidance while already deciding not to obey. The remnant wants confirmation, not surrender. These chapters warn against religious language that masks unbelief and call for listening that is ready to obey.",
    observationQuestion: "What do the people ask Jeremiah to do, and how do they respond to God's answer?",
    reflectionQuestion: "Where are you asking God for guidance while holding obedience at arm's length?",
    prayer: "Lord, make me willing to obey before I ask You to speak.",
    gentleAction: "Before seeking guidance, pray, 'Make me willing to hear and obey.'",
    studyMethod: "SOAP"
  }),
  "Jeremiah 46-49": guidedDevotional({
    title: "The Lord judges the nations",
    context: "Jeremiah speaks oracles against surrounding nations, showing that the Lord's rule extends beyond Judah. Keep the late-Judah and exile setting in view: covenant unfaithfulness, coming judgment, lament, and promised renewal shape the message in Jeremiah 46-49.",
    body: "Judah's God is not a tribal deity. The Lord judges pride, violence, false security, and idolatry among the nations. These chapters are sobering, but they also remind us that no empire, army, or border sits outside God's moral rule.",
    observationQuestion: "What patterns of pride, security, or judgment appear among the nations?",
    reflectionQuestion: "How should God's rule over nations shape your prayer for the world?",
    prayer: "Lord of the nations, humble pride, restrain evil, and bring peoples under Your righteous mercy.",
    gentleAction: "Pray for justice and mercy in one nation facing conflict or corruption.",
    studyMethod: "Inductive"
  }),
  "Jeremiah 50-52; Lamentations 1": guidedDevotional({
    title: "Babylon falls, Jerusalem weeps",
    context: "Jeremiah ends with judgment on Babylon and the fall of Jerusalem, then Lamentations begins with grief over the ruined city. Keep the late-Judah and exile setting in view: covenant unfaithfulness, coming judgment, lament, and promised renewal shape the message in Jeremiah 50-52; Lamentations 1.",
    body: "The proud oppressor is judged, but Jerusalem's grief is not skipped. Scripture gives space for both justice and lament. The fall of Babylon says evil will not last forever; Lamentations 1 teaches God's people to tell the truth about sorrow.",
    observationQuestion: "What happens to Babylon and Jerusalem, and how does Lamentations describe the city?",
    reflectionQuestion: "Where do you need to hold together hope for justice and honest lament?",
    prayer: "Lord, judge evil rightly and teach me to bring sorrow honestly before You.",
    gentleAction: "Write one sentence of lament without rushing to solve it.",
    studyMethod: "COMA"
  }),
  "Lamentations 2-5": guidedDevotional({
    title: "Mercies in the ruins",
    context: "Lamentations grieves Jerusalem's destruction, confesses sin, and reaches for hope in the Lord's steadfast love. Keep the late-Judah and exile setting in view: covenant unfaithfulness, coming judgment, lament, and promised renewal shape the message in Lamentations 2-5.",
    body: "Lamentations is not tidy comfort. It teaches prayer from inside devastation. The famous words about new mercies come surrounded by grief, which makes them deeper rather than thinner. Hope is not denial; it is turning toward the Lord whose steadfast love has not ended.",
    observationQuestion: "What grief, confession, and hope are voiced in these chapters?",
    reflectionQuestion: "Where do you need to pray honestly while still holding to the Lord's mercies?",
    prayer: "Lord, great is Your faithfulness. Meet me with mercy in places that still feel ruined.",
    gentleAction: "Pray Lamentations 3:22-24 slowly, without pretending grief is gone.",
    studyMethod: "Meditation"
  }),
  "Ezekiel 1-4": guidedDevotional({
    title: "Glory in exile",
    context: "Ezekiel is among the exiles by the Chebar canal when he sees the glory of the Lord and receives a difficult prophetic calling. Keep Ezekiel's exilic setting in view: visions, signs, judgment, restored presence, and renewed hearts frame the prophetic witness in Ezekiel 1-4.",
    body: "Ezekiel begins outside the land, but not outside God's reach. The vision of glory shows that the Lord is not trapped in Jerusalem or defeated by exile. Ezekiel's calling is weighty: he must speak God's word whether people listen or refuse.",
    observationQuestion: "What does Ezekiel see, hear, eat, and act out in these opening chapters?",
    reflectionQuestion: "Where do you need to remember that the Lord's glory is not limited by your location or circumstances?",
    prayer: "Lord, open my eyes to Your glory and make me faithful with the word You give.",
    gentleAction: "Name one place that feels like exile, then confess that the Lord is present there.",
    studyMethod: "OIA"
  }),
  "Ezekiel 5-8": guidedDevotional({
    title: "When worship is corrupted",
    context: "Ezekiel acts out Jerusalem's judgment, prophesies against idolatry, and is shown hidden abominations in the temple. Keep Ezekiel's exilic setting in view: visions, signs, judgment, restored presence, and renewed hearts frame the prophetic witness in Ezekiel 5-8.",
    body: "These chapters are severe because Israel's worship has been corrupted at the center. The Lord sees what is public and what is hidden. Judgment is not random anger; it exposes idolatry that has replaced covenant faithfulness.",
    observationQuestion: "What sins are named, and where are they taking place?",
    reflectionQuestion: "What hidden loyalties might compete with sincere worship of the Lord?",
    prayer: "Holy God, search my heart and turn me from hidden idols to wholehearted worship.",
    gentleAction: "Ask what one habit, fear, or desire has been receiving worship-like attention.",
    studyMethod: "COMA"
  }),
  "Ezekiel 9-12": guidedDevotional({
    title: "The word stands",
    context: "Ezekiel sees judgment on Jerusalem, the glory departing, and signs that exile is truly coming. Keep Ezekiel's exilic setting in view: visions, signs, judgment, restored presence, and renewed hearts frame the prophetic witness in Ezekiel 9-12.",
    body: "The departure of glory is devastating. It shows that the real tragedy is not only political collapse but the loss of God's holy presence among a rebellious people. Yet the Lord's word still stands when people dismiss it as delayed or unlikely.",
    observationQuestion: "How do people respond to Ezekiel's warnings, and what does the Lord say about His word?",
    reflectionQuestion: "Where have you been tempted to treat God's warnings or promises as distant and unreal?",
    prayer: "Lord, teach me to take Your word seriously and to grieve anything that pushes away Your presence.",
    gentleAction: "Write one sentence beginning, 'Your word stands when...'",
    studyMethod: "SOAP"
  }),
  "Ezekiel 13-16": guidedDevotional({
    title: "False comfort and covenant grief",
    context: "The Lord rebukes false prophets, exposes idolatry, and describes Jerusalem's covenant unfaithfulness in painful detail. Keep Ezekiel's exilic setting in view: visions, signs, judgment, restored presence, and renewed hearts frame the prophetic witness in Ezekiel 13-16.",
    body: "False comfort can sound kind while keeping people from repentance. Ezekiel confronts spiritual leaders who heal wounds lightly and a city that has forgotten grace. The imagery is confronting, but its point is covenant grief: the Lord had loved and rescued His people, and they turned from Him.",
    observationQuestion: "What kinds of false security are exposed in these chapters?",
    reflectionQuestion: "Where do you need the Lord's truthful mercy more than shallow reassurance?",
    prayer: "Lord, save me from false comfort and bring me back to faithful love for You.",
    gentleAction: "Identify one comforting message you need to test against Scripture.",
    studyMethod: "OIA"
  }),
  "Ezekiel 17-20": guidedDevotional({
    title: "Grace remembered, rebellion exposed",
    context: "Ezekiel uses parables and history to show Jerusalem's rebellion while holding out the Lord's future promise. Keep Ezekiel's exilic setting in view: visions, signs, judgment, restored presence, and renewed hearts frame the prophetic witness in Ezekiel 17-20.",
    body: "The Lord remembers Israel's story more truly than Israel does. He exposes repeated rebellion, but He also promises a tender sprig that He Himself will plant. Responsibility matters, history matters, and grace is still the Lord's work from beginning to end.",
    observationQuestion: "What does Ezekiel say about responsibility, history, and the Lord's promised future?",
    reflectionQuestion: "Where do you need to remember grace honestly without excusing rebellion?",
    prayer: "Lord, help me remember Your mercy truthfully and follow You with an undivided heart.",
    gentleAction: "List one mercy from your past that should lead to faithfulness today.",
    studyMethod: "Biblical theology"
  }),
  "Ezekiel 21-24": guidedDevotional({
    title: "The end of false security",
    context: "Ezekiel announces the sword, exposes corrupt leadership and worship, and marks Jerusalem's siege with painful signs. Keep Ezekiel's exilic setting in view: visions, signs, judgment, restored presence, and renewed hearts frame the prophetic witness in Ezekiel 21-24.",
    body: "These chapters refuse to let false security survive. Kings, priests, prophets, and people are all weighed by the Lord's holiness. Ezekiel's personal sorrow also shows that judgment is not an abstract idea; sin tears through real lives.",
    observationQuestion: "What people, institutions, and false hopes are judged in these chapters?",
    reflectionQuestion: "What security would collapse if it were not anchored in the Lord?",
    prayer: "Lord, remove false confidence and anchor me in Your righteous rule.",
    gentleAction: "Name one thing you rely on that cannot carry the weight of your hope.",
    studyMethod: "COMA"
  }),
  "Ezekiel 25-28": guidedDevotional({
    title: "Pride among the nations",
    context: "The Lord speaks judgment against surrounding nations, especially Tyre, for pride, violence, and rejoicing over Judah's fall. Keep Ezekiel's exilic setting in view: visions, signs, judgment, restored presence, and renewed hearts frame the prophetic witness in Ezekiel 25-28.",
    body: "Ezekiel widens the view from Jerusalem to the nations. The Lord rules over every people, economy, ruler, and boast. Pride may look secure for a season, but no nation can exalt itself above the God who made the seas and the coastlands.",
    observationQuestion: "What attitudes and actions are condemned among the surrounding nations?",
    reflectionQuestion: "Where do pride, success, or comparison quietly shape your sense of security?",
    prayer: "King of the nations, humble my pride and teach me to trust Your rule.",
    gentleAction: "Turn one boast into thanksgiving before the Lord.",
    studyMethod: "Inductive"
  }),
  "Ezekiel 29-32": guidedDevotional({
    title: "Egypt brought low",
    context: "Ezekiel announces judgment on Egypt and Pharaoh, using images of monsters, trees, and descent to the grave. Keep Ezekiel's exilic setting in view: visions, signs, judgment, restored presence, and renewed hearts frame the prophetic witness in Ezekiel 29-32.",
    body: "Egypt represents impressive power that cannot finally save. Pharaoh's boast is answered by the Lord's sovereignty. The passage teaches that political strength, military confidence, and ancient prestige all bow before the One who judges nations justly.",
    observationQuestion: "What images does Ezekiel use to describe Egypt's pride and downfall?",
    reflectionQuestion: "What impressive power are you tempted to fear or trust more than the Lord?",
    prayer: "Lord, You are greater than every power that frightens or fascinates me.",
    gentleAction: "Pray for humility in the way you think about earthly power.",
    studyMethod: "OIA"
  }),
  "Ezekiel 33-36": guidedDevotional({
    title: "Watchman, shepherd, new heart",
    context: "Ezekiel is renewed as watchman, Israel's shepherds are judged, and the Lord promises cleansing, a new heart, and His Spirit. Keep Ezekiel's exilic setting in view: visions, signs, judgment, restored presence, and renewed hearts frame the prophetic witness in Ezekiel 33-36.",
    body: "After judgment, restoration begins with the Lord's own name and mercy. Bad shepherds are confronted, scattered sheep are sought, and hard hearts are promised renewal. Hope rests not in Israel improving itself, but in the Lord giving His people a new heart and Spirit.",
    observationQuestion: "What does the Lord promise to do for His people in these chapters?",
    reflectionQuestion: "Where do you need more than self-improvement: a heart renewed by God?",
    prayer: "Lord, cleanse me, give me a tender heart, and lead me as my true Shepherd.",
    gentleAction: "Pray Ezekiel 36:26 in your own words.",
    studyMethod: "SOAP"
  }),
  "Ezekiel 37-40": guidedDevotional({
    title: "Dry bones and returning hope",
    context: "Ezekiel sees dry bones raised, the people reunited under one shepherd, enemies defeated, and a restored temple vision beginning. Keep Ezekiel's exilic setting in view: visions, signs, judgment, restored presence, and renewed hearts frame the prophetic witness in Ezekiel 37-40.",
    body: "The valley of dry bones is not optimism; it is resurrection-like hope created by God's Spirit and word. The Lord can bring life where there is no human possibility. The restored temple vision then turns hope toward His dwelling presence.",
    observationQuestion: "How does life come to the dry bones, and what future does the Lord promise?",
    reflectionQuestion: "Where do you need hope that depends on God's Spirit rather than your strength?",
    prayer: "Spirit of God, breathe life where I have only seen dry bones.",
    gentleAction: "Speak one prayer of hope over a place that feels impossible.",
    studyMethod: "Biblical theology"
  }),
  "Ezekiel 41-44": guidedDevotional({
    title: "A holy dwelling",
    context: "Ezekiel continues the temple vision, sees the Lord's glory return, and hears instructions about holiness and worship. Keep Ezekiel's exilic setting in view: visions, signs, judgment, restored presence, and renewed hearts frame the prophetic witness in Ezekiel 41-44.",
    body: "The measurements can feel slow, but they teach order, holiness, and reverence. Restoration is not merely getting land back; it is the return of the Lord's glory. His people are called to live around His presence with renewed awe.",
    observationQuestion: "What details emphasize holiness, order, and the return of the Lord's glory?",
    reflectionQuestion: "How might reverence for God's presence reshape ordinary parts of your life?",
    prayer: "Lord, make my life a place of reverent attention to Your holy presence.",
    gentleAction: "Choose one ordinary space or routine to dedicate consciously to the Lord.",
    studyMethod: "OIA"
  }),
  "Ezekiel 45-48": guidedDevotional({
    title: "The Lord is there",
    context: "Ezekiel's vision concludes with restored worship, renewed land, a life-giving river, and a city named for the Lord's presence. Keep Ezekiel's exilic setting in view: visions, signs, judgment, restored presence, and renewed hearts frame the prophetic witness in Ezekiel 45-48.",
    body: "Ezekiel ends not with exile but with presence. The river flowing from the temple brings life wherever it goes, and the final name of the city is the deepest promise: the Lord is there. Restoration is finally about dwelling with Him.",
    observationQuestion: "What signs of restored worship, justice, life, and presence appear in these chapters?",
    reflectionQuestion: "Where do you long to know, in a settled way, that the Lord is there?",
    prayer: "Lord, let Your presence be my hope, my home, and my life.",
    gentleAction: "Write the phrase 'The Lord is there' beside one concern you are carrying.",
    studyMethod: "Meditation"
  }),
  "Daniel 1-4": guidedDevotional({
    title: "Faithful in exile",
    context: "Daniel and his friends serve in Babylon while remaining faithful, interpreting dreams, facing the furnace, and seeing a proud king humbled. These opening chapters move from food-table faithfulness to imperial dreams and the fiery furnace, showing that the God of Israel gives wisdom and humbles Babylonian pride.",
    body: "Daniel shows faithfulness under pressure without pretending exile is easy. The Lord gives wisdom, preserves His servants, and humbles kings. Even in Babylon, no ruler has the final word over those who belong to God.",
    observationQuestion: "How do Daniel and his friends remain faithful, and how does the Lord act?",
    reflectionQuestion: "Where do you need quiet courage to remain faithful in a pressured environment?",
    prayer: "Lord, give me wisdom, courage, and humility wherever You have placed me.",
    gentleAction: "Choose one small act of faithfulness you can practice without needing attention.",
    studyMethod: "COMA"
  }),
  "Daniel 5-8": guidedDevotional({
    title: "Kingdoms weighed and passing",
    context: "Daniel interprets Babylon's fall, survives the lions' den, and receives visions of kingdoms that rise and pass away. The handwriting, lions' den, and beastly visions together teach that arrogant empires are weighed by God and that the Ancient of Days rules beyond their violence.",
    body: "Earthly kingdoms can look overwhelming, but Daniel insists they are accountable to God. Proud rulers are weighed, faithful prayer is tested, and beastly powers do not last forever. The Ancient of Days reigns when history looks unstable.",
    observationQuestion: "What do these chapters reveal about rulers, kingdoms, prayer, and God's authority?",
    reflectionQuestion: "What current fear becomes smaller when you remember that earthly kingdoms pass away?",
    prayer: "Ancient of Days, steady my heart under Your everlasting rule.",
    gentleAction: "Pray for Daniel-like faithfulness in one pressure you face today.",
    studyMethod: "Biblical theology"
  }),
  "Daniel 9-12": guidedDevotional({
    title: "Hope beyond exile",
    context: "Daniel prays confession over Israel's exile and receives visions of conflict, endurance, and final resurrection hope. The final chapters join penitential prayer with difficult apocalyptic hope, calling God's people to wisdom and endurance until the promised resurrection.",
    body: "Daniel's hope is deeply prayerful. He does not treat prophecy as curiosity, but responds with confession, humility, and trust. The final visions are difficult, yet they lift the reader toward endurance and resurrection: the Lord has not lost control of history.",
    observationQuestion: "How does Daniel pray, and what hope is given to God's people in the final chapters?",
    reflectionQuestion: "Where do you need endurance that is rooted in confession, mercy, and resurrection hope?",
    prayer: "Lord, have mercy, give endurance, and keep my hope fixed on Your final victory.",
    gentleAction: "Pray a short confession, then thank the Lord for hope beyond what you can see.",
    studyMethod: "SOAP"
  })
};

function devotionalEntries(entries: Array<[string, string, string, string, string]>, guidanceKind: BibleReadingPlanDay["guidanceKind"] = "reading-guidance"): Record<string, BibleReadingPlanDayExtras> {
  return Object.fromEntries(entries.map(([reference, title, body, reflection, prayer]) => [reference, devotional(title, body, reflection, prayer, { guidanceKind })]));
}

function withContexts(
  devotionals: Record<string, BibleReadingPlanDayExtras>,
  contexts: Record<string, string>
): Record<string, BibleReadingPlanDayExtras> {
  return Object.fromEntries(
    Object.entries(devotionals).map(([reference, extras]) => [
      reference,
      contexts[reference] ? { ...extras, context: contexts[reference] } : extras
    ])
  );
}

const johnGospelDevotionals = withContexts(devotionalEntries([
  ["John 1", "The Word became flesh", "John opens by showing that Jesus is eternal, divine, Creator, Light, and the Word made flesh. The chapter does not present Jesus as merely a teacher; He is the Son who reveals the Father and brings grace and truth.", "Which truth about Jesus in John 1 most needs to shape your worship today?", "Lord Jesus, help me receive Your light, grace, and truth."],
  ["John 2", "Glory revealed in signs", "Jesus' first sign at Cana and His cleansing of the temple both reveal His authority. He brings joy, fulfills what old symbols pointed toward, and claims the right to reorder worship around Himself.", "Where do you need Jesus to reorder shallow religion into true worship?", "Lord Jesus, purify my worship and teach me to trust Your glory."],
  ["John 3", "Born from above", "Nicodemus learns that religious knowledge cannot replace new birth. The Son is lifted up so that believing sinners may receive eternal life, not condemnation, through God's love.", "What would it mean to receive salvation as new birth rather than self-improvement?", "Father, thank You for loving the world by giving Your Son."],
  ["John 4", "Living water for outsiders", "Jesus meets a Samaritan woman with truth and mercy. He exposes thirst, offers living water, and teaches that true worship is in spirit and truth.", "Where are you trying to satisfy thirst apart from Christ?", "Lord Jesus, give me living water and make me a truthful worshiper."],
  ["John 5", "The Son gives life", "Jesus heals on the Sabbath and teaches that the Son does the Father's work, gives life, and will raise the dead. The chapter presses readers to honor the Son as they honor the Father.", "How might Jesus' authority to give life strengthen your trust in Him today?", "Father, help me honor the Son and hear His voice with faith."],
  ["John 6", "The bread of life", "After feeding the crowd, Jesus teaches that He Himself is the true bread from heaven. He does not merely give gifts; He gives Himself for the life of the world.", "Where are you seeking satisfaction without coming to Christ Himself?", "Lord Jesus, feed my soul with Yourself, the bread of life."],
  ["John 7", "Thirst and division", "At the feast, Jesus calls the thirsty to come to Him and drink while crowds divide over His identity. His words expose whether people judge by appearance or receive Him by faith.", "What thirst or confusion does Jesus invite you to bring to Him?", "Lord Jesus, teach me to come to You and receive the Spirit's life."],
  ["John 8", "Truth that sets free", "Jesus confronts false confidence and offers freedom through abiding in His word. True freedom is not self-rule; it is rescue from sin through the Son.", "Where do you need freedom that comes from abiding in Jesus' word?", "Lord Jesus, keep me in Your truth and set me free from sin's lies."],
  ["John 9", "Sight for the blind", "Jesus gives sight to a man born blind while religious leaders reveal spiritual blindness. The sign asks whether we will truly see and worship the Son of Man.", "Where might pride keep you from seeing what Jesus is showing?", "Lord Jesus, open my eyes and lead me to worship You."],
  ["John 10", "The good Shepherd", "Jesus is the door and the good Shepherd who knows His sheep, lays down His life, and gives eternal life. His care is personal, costly, and secure.", "Which promise of the Shepherd most steadies you today?", "Good Shepherd, help me hear Your voice and rest in Your care."],
  ["John 11", "Resurrection and tears", "At Lazarus' tomb, Jesus weeps and then reveals Himself as the resurrection and the life. He meets grief with compassion and hope that is stronger than death.", "What grief needs both the tears and power of Jesus?", "Lord Jesus, meet me in sorrow and keep my hope in Your life."],
  ["John 12", "The hour has come", "Mary's worship, the crowd's praise, and Jesus' teaching all move toward His hour. The grain of wheat must die to bear fruit, pointing to the cross.", "How might Jesus' path of self-giving love shape your response to Him today?", "Lord Jesus, help me follow You in humble, fruitful obedience."],
  ["John 13", "Love with a towel", "Jesus washes His disciples' feet and commands them to love one another. His authority is expressed in humble service, and His people are marked by His love.", "Who is Jesus calling you to serve with humble love?", "Lord Jesus, wash me, humble me, and make Your love visible in me."],
  ["John 14", "The way to the Father", "Jesus comforts troubled disciples by promising the Father's house, the Spirit, and His peace. He is not one way among many; He is the way, the truth, and the life.", "Where does your troubled heart need Christ's peace and promise?", "Lord Jesus, keep my heart trusting You as the way to the Father."],
  ["John 15", "Abide and bear fruit", "Jesus describes Himself as the true vine and calls His disciples to abide in Him. Fruitful life comes from remaining in His love, not from detached effort.", "What would abiding in Christ look like in one ordinary part of today?", "Lord Jesus, keep me near You so my life bears fruit that honors You."],
  ["John 16", "Sorrow turned to joy", "Jesus prepares His disciples for grief, opposition, and the Spirit's help. Their sorrow will be real, but it will not be final because He overcomes the world.", "What sorrow or fear needs to be held under Jesus' victory?", "Lord Jesus, give me courage because You have overcome the world."],
  ["John 17", "Jesus prays for His people", "Jesus prays for His disciples and for those who will believe through their word. He asks for protection, holiness, unity, and that His people would behold His glory.", "Which part of Jesus' prayer gives you assurance or direction today?", "Father, sanctify me in Your truth and keep me in the love of Christ."],
  ["John 18", "The King on trial", "Jesus is arrested and questioned while Peter denies Him. Even in apparent weakness, Jesus stands as the true King whose kingdom is not from this world.", "Where do you need courage to confess Christ rather than shrink back?", "King Jesus, strengthen my loyalty when pressure exposes my weakness."],
  ["John 19", "It is finished", "John shows Jesus crucified as the true King and sacrificial Savior. His finished work is not defeat; it is the completion of the saving work the Father gave Him.", "What burden do you need to bring under Jesus' words, 'It is finished'?", "Lord Jesus, thank You for finishing the work of salvation at the cross."],
  ["John 20", "Believe and have life", "The risen Jesus appears to Mary, the disciples, and Thomas. John states his purpose clearly: these things are written so readers may believe and have life in Jesus' name.", "How does the risen Christ invite you from doubt or grief into faith?", "Risen Lord, deepen my faith and life in Your name."],
  ["John 21", "Restored to follow", "Jesus meets failed disciples with breakfast, restoration, and a renewed call to follow. Peter's failure is not the end of his discipleship because Jesus restores and sends him.", "Where do you need to receive Jesus' restoration and follow Him again?", "Lord Jesus, restore my love and help me follow You faithfully."]
]), {
  "John 1": "John opens with a theological prologue before the narrative ministry begins. The chapter presents Jesus as the eternal Word, Creator, Light, and Son who reveals the Father. John immediately ties belief, witness, grace, truth, and the incarnation together.",
  "John 2": "John 2 begins the book's signs at Cana and then moves to Jesus cleansing the temple in Jerusalem. Both scenes reveal Jesus' glory and authority over old covenant symbols. The chapter points forward to His death and resurrection as the true temple.",
  "John 3": "Nicodemus comes to Jesus as a respected Jewish teacher, yet Jesus says entrance into God's kingdom requires birth from above. The chapter joins new birth, the Spirit's work, the lifted-up Son, and God's love for the world. Salvation is received by faith, not status.",
  "John 4": "Jesus crosses social and religious boundaries by speaking with a Samaritan woman. The chapter contrasts old hostilities with the gift of living water and worship in spirit and truth. Her witness also prepares a wider Samaritan response to Jesus as Savior.",
  "John 5": "A Sabbath healing leads into one of John's major discourses about Jesus' authority. Jesus presents His work as the Father's work and speaks of life, judgment, resurrection, and witness. The issue is not merely healing, but whether people honor the Son.",
  "John 6": "John 6 follows the feeding of the crowd and Jesus walking on the sea with the Bread of Life discourse. The crowd wants provision, but Jesus presses deeper toward faith in Himself. The chapter separates temporary satisfaction from receiving the Son given for life.",
  "John 7": "Jesus teaches during the Feast of Tabernacles while public opinion about Him is divided. The feast setting highlights water, light, and hope, and Jesus invites the thirsty to come to Him. The chapter shows how His identity exposes shallow judgments.",
  "John 8": "John 8 continues the conflict over Jesus' identity, testimony, and relationship to the Father. Jesus calls hearers to abide in His word and tells them true freedom comes through the Son. The chapter confronts false confidence while offering truth that liberates.",
  "John 9": "Jesus heals a man born blind, and the sign becomes a trial of spiritual sight. The healed man moves toward clearer confession while the religious leaders harden in resistance. John uses physical sight to reveal the deeper question of recognizing Jesus.",
  "John 10": "Jesus speaks as the door and the good Shepherd in contrast to false or harmful shepherds. The chapter draws on Old Testament shepherd imagery and emphasizes His knowledge, protection, sacrifice, and authority. His sheep are secure because He gives His life.",
  "John 11": "The raising of Lazarus stands near the turning point toward Jesus' death. Jesus delays, weeps, speaks with Martha, and reveals Himself as resurrection and life before raising Lazarus. The sign offers real hope without minimizing grief or death.",
  "John 12": "John 12 closes the public ministry as Jesus' hour approaches. Mary's anointing, the triumphal entry, and Jesus' teaching about the grain of wheat all point toward the cross. Glory in John is revealed through Jesus' self-giving death.",
  "John 13": "John 13 begins the farewell section on the night before the cross. Jesus washes His disciples' feet, identifies betrayal, and gives the new command to love one another. The scene roots Christian service and love in His own humble, cleansing work.",
  "John 14": "Jesus speaks to troubled disciples during the farewell discourse. He comforts them with the Father's house, His unique way to the Father, the coming Spirit, and His peace. The chapter prepares believers for His departure without leaving them orphaned.",
  "John 15": "John 15 continues the farewell discourse with the image of the true vine. Jesus calls His disciples to remain in Him, receive His words, keep His commands, and bear fruit in love. Fruitfulness is rooted in union and dependence, not detached effort.",
  "John 16": "Jesus prepares His disciples for sorrow, opposition, and the Spirit's witness after His departure. He does not deny their grief, but promises the Spirit's help and joy beyond the coming anguish. The chapter ends with courage grounded in His victory.",
  "John 17": "John 17 records Jesus' prayer before His arrest. He prays for the Father's glory, His disciples' protection and holiness, and future believers' unity and witness. The prayer lets readers hear what Jesus desires for His people before the cross.",
  "John 18": "John 18 moves from Jesus' arrest to questioning before Jewish leaders and Pilate. Peter's denial is set beside Jesus' steady testimony about His kingdom. The chapter shows the true King apparently judged by human powers while remaining in control.",
  "John 19": "John 19 presents the crucifixion with repeated emphasis on Jesus as King and on Scripture being fulfilled. His death is not accidental failure but the completion of the work given by the Father. The chapter invites faith in the finished saving work of Christ.",
  "John 20": "John 20 narrates the empty tomb and resurrection appearances to Mary, the disciples, and Thomas. The chapter names John's purpose: written testimony so readers may believe Jesus is the Christ and have life in His name. Doubt is met by the risen Lord.",
  "John 21": "John 21 functions as an epilogue after the stated purpose of the Gospel. Jesus provides for His disciples, restores Peter after denial, and renews the call to follow. The chapter shows that resurrection grace sends restored disciples into faithful service."
});

const romansDevotionals = withContexts(devotionalEntries([
  ["Romans 1", "The gospel of God", "Paul introduces the gospel as God's promised good news about His Son. Human sin is serious, but the letter begins with the righteousness of God revealed through faith.", "How does beginning with God's good news about His Son steady the way you read Romans?", "Father, help me receive the gospel as Your good news about Your Son."],
  ["Romans 2", "Judgment and true obedience", "Paul warns religious and moral people not to hide behind comparison. God's judgment is truthful, impartial, and concerned with reality rather than outward labels.", "Where are you tempted to rely on comparison instead of honest repentance?", "Lord, make my faith sincere from the heart, not merely outward."],
  ["Romans 3", "Righteousness through faith", "Paul gathers all people under sin, then announces righteousness through faith in Jesus Christ. Grace is not vague kindness; it comes through Christ's redeeming blood.", "What makes grace necessary and secure in this chapter?", "Lord Jesus, thank You for redemption and righteousness received by faith."],
  ["Romans 4", "Faith counted as righteousness", "Abraham is Paul’s example that righteousness is received by faith, not achieved by works. God's promise rests on grace so that it may be certain.", "Where do you need to trust promise rather than performance?", "God of promise, strengthen my faith in what You have done."],
  ["Romans 5", "Peace with God", "Because believers are justified by faith, they have peace with God through Christ. Adam's trespass brought death, but Christ's obedience brings grace and life.", "How does Christ's work give you peace that your performance cannot create?", "Lord Jesus, help me stand in the grace You have given."],
  ["Romans 6", "Dead to sin, alive to God", "Paul rejects the idea that grace excuses sin. Union with Christ means believers have died to sin and are called to walk in newness of life.", "What old pattern needs to be treated as no longer your master?", "Lord, help me live as one alive to You in Christ Jesus."],
  ["Romans 7", "The law and the struggle", "Paul shows the goodness of God's law and the deep struggle of sin within. The cry for rescue prepares the way for the hope of Christ and the Spirit.", "Where do you feel the need for rescue rather than mere resolution?", "Lord Jesus, rescue me from sin's power and teach me dependence."],
  ["Romans 8", "Life in the Spirit", "Romans 8 gathers assurance, Spirit-led life, suffering, hope, prayer, and God's unbreakable love. No condemnation leads to no separation in Christ.", "Which promise in Romans 8 most strengthens your assurance today?", "Father, help me walk by the Spirit and rest in Your inseparable love."],
  ["Romans 9", "Mercy and God's purpose", "Paul grieves Israel's unbelief while defending God's freedom and mercy. The chapter calls for humility before God's purposes rather than presumption.", "How does this chapter humble both pride and despair?", "Lord, keep me humble before Your mercy and faithful in prayer for others."],
  ["Romans 10", "Christ and the preached word", "Paul longs for Israel's salvation and shows that righteousness is not far away in Christ. Faith comes through hearing the word of Christ.", "Who needs your prayer that they would hear and respond to Christ?", "Lord, send Your word with power and make me faithful to confess Christ."],
  ["Romans 11", "Mercy for Jew and Gentile", "Paul warns Gentile believers against arrogance and marvels at God's mercy. The chapter ends in worship before God's wisdom and ways.", "Where do you need wonder instead of pride when thinking about salvation?", "Oh the depth of Your wisdom, Lord. Keep me humble in Your mercy."],
  ["Romans 12", "Living sacrifice", "The mercies of God lead to whole-life worship. Paul moves from grace to transformed minds, humble gifts, sincere love, patience, hospitality, and peace.", "Which mark of transformed life is the Spirit pressing on you today?", "Lord, make my ordinary life an offering of worship to You."],
  ["Romans 13", "Love and wakefulness", "Paul speaks about governing authorities, love as fulfilling the law, and living awake in light of the coming day. Christian ethics are shaped by love and hope.", "Where does love need to become concrete rather than merely intended?", "Lord, help me walk honorably in love as one who belongs to the day."],
  ["Romans 14", "Welcome without contempt", "Paul teaches believers to welcome one another amid disputable matters. Love limits freedom for the sake of a brother or sister for whom Christ died.", "Where do you need to trade contempt or judgment for patient love?", "Lord Jesus, teach me to honor Your people with humility and care."],
  ["Romans 15", "Hope and mission", "Paul calls strong believers to bear with the weak, points to Christ's servant-hearted welcome, and looks outward to gospel mission among the nations.", "How does Christ's welcome reshape the way you welcome others?", "God of hope, fill me with joy and peace in believing."],
  ["Romans 16", "Grace among real people", "Romans ends with names, greetings, warnings, and praise. The gospel creates a real community of servants, households, coworkers, and faithful witnesses.", "Who has helped your faith, and who can you encourage in the Lord?", "Lord, thank You for Your people. Make me faithful in ordinary service."]
]), {
  "Romans 1": "Paul writes to believers in Rome and begins by announcing the gospel promised in Scripture concerning God's Son. The chapter introduces key themes: faith, righteousness, Gentile mission, and humanity's refusal to honor God. It sets the need for salvation before explaining it.",
  "Romans 2": "Romans 2 turns from obvious Gentile sin toward moral and religious self-confidence. Paul warns that possession of God's law or outward religious markers cannot replace obedient reality before God. The argument exposes every basis for boasting before the impartial Judge.",
  "Romans 3": "Romans 3 draws Jew and Gentile alike under sin before announcing God's righteousness through faith in Jesus Christ. Paul holds together human guilt, God's justice, redemption, and grace. The chapter is central to Romans because it shows why the gospel is necessary and secure.",
  "Romans 4": "Paul uses Abraham and David to show that justification has always rested on faith rather than works. Abraham is counted righteous before circumcision, so the promise can embrace Gentiles as well as Jews. The chapter anchors Christian assurance in God's gracious promise.",
  "Romans 5": "Romans 5 follows justification by describing peace with God, hope in suffering, and God's love shown in Christ's death. Paul then contrasts Adam and Christ as two representative heads. The chapter shows grace reigning where sin and death once ruled.",
  "Romans 6": "After celebrating grace, Paul answers the objection that grace might encourage sin. Baptism imagery points to union with Christ in His death and resurrection. The chapter calls believers to live from their new identity: dead to sin and alive to God.",
  "Romans 7": "Romans 7 explains the law's goodness while exposing sin's deep power. Paul shows that God's commandment is not the problem; sin seizes the commandment and produces death. The chapter's cry for rescue prepares readers for life in the Spirit in Romans 8.",
  "Romans 8": "Romans 8 is the summit of Paul's argument about life in Christ and the Spirit. It moves from no condemnation to adoption, suffering, future glory, Spirit-led prayer, and inseparable love. Assurance is grounded in God's action in Christ, not in denial of hardship.",
  "Romans 9": "Romans 9 begins Paul's three-chapter reflection on Israel, God's promises, and Gentile inclusion. Paul grieves Israel's unbelief while insisting that God's word has not failed. The chapter must be read with humility, lament, and confidence in God's mercy.",
  "Romans 10": "Romans 10 continues Paul's concern for Israel's salvation and contrasts zeal without knowledge with righteousness in Christ. Paul emphasizes confession, faith, preaching, and hearing the word of Christ. The chapter keeps mission and prayer tied to the gospel message.",
  "Romans 11": "Romans 11 completes Paul's reflection on Israel and the nations. Gentile believers are warned against arrogance, Israel's stumbling is not treated as final, and all mercy leads to worship. The chapter ends by bowing before God's wisdom rather than explaining everything neatly.",
  "Romans 12": "Romans 12 begins the practical section with the mercies of God as the foundation for whole-life worship. Paul moves from renewed minds to humble use of gifts and sincere love. Christian obedience here is response to grace, not a way to earn it.",
  "Romans 13": "Romans 13 applies gospel-shaped life to public order, neighbor love, and alert holiness. Paul speaks of governing authorities, then summarizes the law through love. The chapter closes with urgency because believers live in light of the coming day.",
  "Romans 14": "Romans 14 addresses tensions among believers over disputable matters such as food and special days. Paul calls the church away from contempt and judgment toward welcome, conscience, and love. Freedom is real, but it is governed by Christ's lordship and care for others.",
  "Romans 15": "Romans 15 continues the call for the strong to bear with the weak and roots welcome in Christ's own welcome. Paul also gathers Scripture to show God's mercy reaching the nations. The chapter moves naturally from church unity to gospel mission.",
  "Romans 16": "Romans 16 is more than an appendix; it reveals the network of real people shaped by the gospel. Paul greets women and men, households, coworkers, and servants while warning against division. The letter ends with praise to the God who establishes His people through the gospel."
});

const psalmsPrayerDevotionals = withContexts(devotionalEntries([
  ["Psalm 1-8", "Prayer begins with delight", "The Psalms open by contrasting the way of the righteous with the way of the wicked, then move through trouble, trust, and praise. Prayer begins with delight in God's instruction and honest dependence on His care.", "Which desire, fear, confession, or praise from these Psalms gives words to your prayer today?", "Lord, root my life in Your word and teach me to pray honestly."],
  ["Psalm 9-16", "Refuge and trust", "These Psalms bring enemies, injustice, lament, and confidence before the Lord. They teach that prayer can name danger while taking refuge in God's faithful rule.", "Which line helps you bring fear or injustice to the Lord today?", "Lord, be my refuge and keep my heart trusting You."],
  ["Psalm 17-24", "The King and Shepherd", "David prays for protection, celebrates deliverance, hears creation declare God's glory, and sings of the Lord as Shepherd and King. Prayer becomes both need and worship.", "How do these Psalms move you from request to worship?", "Lord, shepherd me, search me, and reign over my heart."],
  ["Psalm 25-31", "Teach me Your ways", "These Psalms repeatedly ask for guidance, forgiveness, protection, and courage. They train believers to bring shame, fear, waiting, and trust into God's presence.", "Where do you need to pray, 'Teach me Your paths'?", "Lord, guide me in Your truth and keep me waiting with courage."],
  ["Psalm 32-38", "Confession and mercy", "This section gives words for confession, forgiveness, praise, and physical or emotional distress. The Lord's mercy is not thin; it meets real guilt and real weakness.", "What needs to be confessed or received under God's steadfast love?", "Merciful Lord, forgive, restore, and surround me with Your steadfast love."],
  ["Psalm 39-45", "Hope while waiting", "These Psalms hold mortality, waiting, sorrow, rescue, and royal hope together. They teach patience that looks beyond self to the Lord's faithful deliverance.", "Where do you need to wait without losing hope in the Lord?", "Lord, put a new song in my mouth and keep my hope in You."],
  ["Psalm 46-52", "God is our refuge", "Psalm 46 anchors this section in God's presence amid shaking. The following Psalms praise His kingship and confront evil, deceit, and misplaced confidence.", "What false security needs to give way to God as refuge?", "Lord Almighty, still my striving and be my refuge."],
  ["Psalm 53-59", "Prayer under pressure", "These Psalms pray amid corruption, betrayal, danger, and pursuit. They show that faith can speak plainly to God when human help feels unreliable.", "What pressure do you need to bring to God without polishing the words?", "Lord, hear me under pressure and keep me faithful."],
  ["Psalm 60-66", "Rescue and praise", "This section moves from defeat and need to confidence, blessing, and praise. Prayer remembers that deliverance belongs to God and turns answered prayer into worship.", "Where has the Lord carried you, corrected you, or heard you?", "Lord, let Your rescue lead me into grateful praise."],
  ["Psalm 67-73", "Blessing, justice, and nearness", "These Psalms ask God to bless the nations, defend the needy, and steady the heart when the wicked prosper. Psalm 73 brings the believer back to the nearness of God.", "Where do you need to say, 'But as for me, it is good to be near God'?", "Lord, be my portion and steady my heart when life feels uneven."],
  ["Psalm 74-80", "Lament for God's people", "These communal laments ask why devastation has come and plead for restoration. Prayer is not only individual; God's people grieve and hope together.", "What burden for God's people or the world do you need to bring before Him?", "Shepherd of Israel, restore us and make Your face shine."],
  ["Psalm 81-87", "Listen and return", "The Lord calls His people to listen, turn from idols, and seek justice. These Psalms also celebrate Zion as the place of God's dwelling and blessing.", "Where is God calling you to listen more deeply and return?", "Lord, free me from false worship and tune my heart to Your voice."],
  ["Psalm 88-94", "Darkness and reign", "Psalm 88 gives one of Scripture's darkest prayers, while later Psalms proclaim the Lord's reign and justice. Faith can pray from darkness without abandoning God's throne.", "What lament can you bring to the reigning Lord today?", "Lord, meet me in darkness and keep me trusting Your righteous rule."],
  ["Psalm 95-101", "Worship the King", "These Psalms call creation and nations to worship the Lord as King. Praise includes reverence, joy, justice, holiness, and obedience.", "What reason for worship stands out most clearly in these Psalms?", "Lord, make my worship joyful, reverent, and obedient."],
  ["Psalm 102-108", "Steadfast love across generations", "These Psalms move through affliction, forgiveness, human frailty, and God's enduring love. Prayer finds hope in the Lord whose years have no end.", "What weakness can you bring to the everlasting mercy of God?", "Lord, remember me with Your steadfast love and renew my praise."],
  ["Psalm 109-115", "Justice, Messiah, and glory", "These Psalms cry for justice, speak of the Lord's chosen King and Priest, and reject idols. Prayer learns to seek God's glory above human vengeance or false trust.", "Where do you need God's justice and glory to reframe your response?", "Lord, not to us, but to Your name give glory."],
  ["Psalm 116-122", "Thanks and pilgrimage", "These Psalms thank the Lord for rescue and then move into songs for the journey to worship. Prayer becomes gratitude, testimony, and longing for peace.", "What rescue or mercy should become thanksgiving today?", "Lord, thank You for hearing me. Lead me in peace and worship."],
  ["Psalm 123-129", "Dependence on the journey", "The pilgrim Psalms lift tired eyes to the Lord, remember His help, and ask for mercy. They form prayer for people who are still on the way.", "Where do you need to lift your eyes to the Lord rather than stare at the difficulty?", "Lord, have mercy and keep me walking with You."],
  ["Psalm 130-136", "Waiting and steadfast love", "These Psalms move from the depths to hope, unity, worship, and the repeated refrain of God's steadfast love. Waiting is held by mercy.", "Where might the Lord's steadfast love help you wait with hope rather than despair?", "Lord, from the depths I wait for You and trust Your unfailing mercy."],
  ["Psalm 137-143", "Exile, honesty, and rescue", "These Psalms include the ache of exile, thanksgiving, searching prayer, and pleas for deliverance. They teach honest prayer that still turns toward God's faithful character.", "What hard emotion needs to be prayed honestly before the Lord?", "Lord, search me, lead me, and deliver me according to Your steadfast love."],
  ["Psalm 144-150", "Everything that has breath", "The Psalter ends with rescue, kingdom praise, and a crescendo of hallelujah. Prayer that began with delight now gathers every breath into praise.", "How can praise become the final word over this season of prayer?", "Lord, let everything in me praise You with joy and faithfulness."]
]), {
  "Psalm 1-8": "The Psalter opens by setting the way of the righteous beside the way of the wicked, then moves quickly into kingship, lament, and trust. These early prayers introduce delight in God's instruction, opposition to God's rule, and confidence that the Lord hears.",
  "Psalm 9-16": "This section includes individual and communal prayers that name injustice, danger, corruption, and refuge. Davidic laments and songs of trust sit beside confidence in the Lord's righteous judgment. Prayer here learns to bring fear and public wrong before God.",
  "Psalm 17-24": "These Psalms move from pleas for protection to rescue, creation's witness, royal strength, shepherd care, and the King of glory. Several are Davidic and teach prayer that is both personal and public. Need, worship, and kingship belong together.",
  "Psalm 25-31": "Davidic prayers dominate this section, often asking for guidance, forgiveness, protection, and deliverance. The language of waiting, shame, enemies, and trust gives shape to honest dependence. Prayer asks the Lord to teach His paths while holding trouble before Him.",
  "Psalm 32-38": "These Psalms include confession, instruction, praise, and prayers from weakness or distress. They do not separate spiritual guilt from embodied suffering too neatly, but bring the whole person before God. Mercy, forgiveness, and steadfast love remain central.",
  "Psalm 39-45": "This section brings mortality, waiting, lament, deliverance, and royal hope into prayer. Several Psalms wrestle with frailty and delayed rescue, while others praise God's help and the king's beauty. Hope is learned while still waiting on the Lord.",
  "Psalm 46-52": "Psalm 46 begins this range with Zion confidence: creation shakes and nations rage, yet the Lord of hosts is with His people. The surrounding Psalms praise God's kingship and confront deceit, violence, and misplaced security. Refuge is found in God's reign.",
  "Psalm 53-59": "These Psalms include prayers about folly, betrayal, enemies, and danger, many linked to David's pressured seasons. They speak plainly about human evil without pretending the faithful are untouched. Prayer becomes a way to entrust threat and vindication to God.",
  "Psalm 60-66": "This range moves through defeat, longing, confidence, blessing, and corporate praise. Some Psalms remember trouble and correction; others summon all the earth to worship. Prayer here turns need and deliverance into testimony before God and His people.",
  "Psalm 67-73": "These Psalms widen prayer toward the nations, justice for the needy, royal righteousness, and the struggle of seeing the wicked prosper. Psalm 73 resolves envy by entering God's presence. Blessing is meant to lead to worship, justice, and nearness to God.",
  "Psalm 74-80": "This section is heavy with communal lament after devastation among God's people. The prayers ask why, remember God's past acts, and plead for restoration. They show that biblical prayer can carry shared grief, public loss, and hope for God's face to shine again.",
  "Psalm 81-87": "These Psalms call God's people to listen, remember, turn from idols, seek justice, and rejoice in Zion. Some speak with God's own covenant appeal, while others celebrate His dwelling with His people. Prayer includes both return and worship.",
  "Psalm 88-94": "Psalm 88 is one of Scripture's darkest laments, and the following Psalms answer darkness with covenant remembrance and the Lord's reign. This range does not rush grief into easy resolution. It teaches prayer that can speak from the depths while still addressing God.",
  "Psalm 95-101": "This section contains strong calls to worship the Lord as Creator, King, Judge, and holy ruler. The Psalms summon nations and creation, while also warning God's people not to harden their hearts. Praise and obedience are held together.",
  "Psalm 102-108": "These Psalms move from afflicted prayer to remembrance of God's enduring mercy, covenant love, and help for His people. Human life is frail, but the Lord's steadfast love spans generations. Prayer here holds weakness within God's larger faithfulness.",
  "Psalm 109-115": "This range includes hard prayers for justice, royal and priestly hope, praise for God's works, and rejection of idols. Psalm 110 is especially important for later messianic reading. The section teaches prayer to seek God's name and rule above human revenge or false trust.",
  "Psalm 116-122": "These Psalms move from thanksgiving for rescue into the Songs of Ascents, prayers for pilgrims going up to worship. Gratitude, testimony, Jerusalem, peace, and dependence shape the section. Prayer becomes a journey toward worship with God's people.",
  "Psalm 123-129": "These Songs of Ascents continue the pilgrim pattern with mercy, help, deliverance, and endurance under contempt or oppression. The prayers are short but communal and road-tested. They teach weary people to lift their eyes to the Lord while still on the way.",
  "Psalm 130-136": "This range moves from the depths of confession to waiting hope, humble trust, unity, blessing, and repeated praise for steadfast love. The Psalms teach that mercy is not shallow optimism. Waiting is held by forgiveness and the Lord's enduring covenant love.",
  "Psalm 137-143": "These Psalms include exile's grief, thanksgiving, searching prayer, and pleas for rescue from enemies. Some language is raw and should not be flattened into private irritation. Prayer here brings hard memory, longing, and need before the faithful Lord.",
  "Psalm 144-150": "The Psalter closes with rescue, royal hope, creation praise, and a final crescendo of hallelujahs. These Psalms gather the whole book's movement from lament and trust into praise. The ending calls every breath to worship the Lord."
});

const beginnerBibleDevotionals = withContexts(devotionalEntries([
  ["Genesis 1", "The God who creates", "The Bible begins with God, not with us. Genesis 1 shows the Lord creating, ordering, blessing, and making humanity in His image. This gives the whole story its foundation: life belongs to God and is made for His glory.", "How does seeing God as Creator reshape your sense of dignity, purpose, and worship?", "Creator God, teach me to receive life as Your gift and live for Your glory."],
  ["Genesis 12", "Promise and blessing", "God calls Abram and promises land, offspring, and blessing for the nations. The Bible's story of redemption begins to narrow through one family so blessing can widen to the world.", "How does God's promise to Abram show both personal calling and global mercy?", "Lord, help me trust You as the God who keeps promise and blesses the nations in Christ."],
  ["Exodus 3", "The God who sees and sends", "At the burning bush, the Lord reveals His name, hears His people's cries, and sends Moses. Deliverance begins with God's compassion and covenant faithfulness.", "Where do you need to trust that God sees suffering and is able to act?", "Lord, You see and hear. Help me trust Your faithful presence."],
  ["Psalm 23", "The Lord shepherds", "Psalm 23 gives a simple and deep picture of God's personal care. The Lord leads, restores, protects, provides, and brings His people home.", "Which action of the Shepherd do you most need today?", "Lord, shepherd me and keep me close to Your care."],
  ["Isaiah 53", "The suffering Servant", "Isaiah points to the Servant who bears grief, sin, rejection, and judgment for others. Christians see this fulfilled in Jesus' suffering and saving work.", "How does the Servant's suffering deepen your gratitude for God's mercy in Christ?", "Lord Jesus, thank You for bearing sin and bringing peace."],
  ["Luke 2", "Christ the Savior is born", "Luke places Jesus' birth among ordinary people and announces good news of great joy. The Savior, Christ the Lord, comes in humility.", "Where do you need to receive Jesus' humble nearness as good news today?", "Lord Jesus, fill me with wonder that You came near to save."],
  ["John 3", "God so loved the world", "Jesus teaches new birth and the gift of the Son. Eternal life is received by believing in Him, because God loved the world and gave His Son.", "How does John 3 explain both our need and God's love?", "Father, thank You for giving Your Son so that sinners may have life."],
  ["Romans 8", "No condemnation, no separation", "Romans 8 gathers the assurance of the Christian life: no condemnation in Christ, life by the Spirit, hope in suffering, and no separation from God's love.", "Which assurance in Romans 8 do you need to hold today?", "Lord, help me rest in Your Spirit's life and Your inseparable love."],
  ["Ephesians 2", "Saved by grace", "Paul describes spiritual death, God's mercy, salvation by grace through faith, and a new people made in Christ. Good works flow from grace; they do not purchase it.", "How does this chapter keep grace first and obedience in its right place?", "God of mercy, thank You for saving by grace and making me alive in Christ."],
  ["Revelation 21", "God makes all things new", "The Bible's story ends with God dwelling with His people, wiping away tears, and making all things new. Christian hope is not escape from creation but restored life with God.", "What part of this final hope strengthens you today?", "Lord, keep my hope fixed on the day You make all things new."]
]), {
  "Genesis 1": "Genesis 1 opens the Bible with God as Creator, speaking, ordering, blessing, and declaring His creation good. Humanity appears as male and female in God's image, given dignity and vocation under His rule. This first reading sets the Bible's story in worship before application.",
  "Genesis 12": "Genesis 12 comes after creation, fall, flood, and Babel. God calls Abram by grace and promises land, offspring, blessing, and blessing for all families of the earth. The passage begins the covenant line through which Scripture's rescue story will unfold.",
  "Exodus 3": "Exodus 3 stands after Israel's slavery in Egypt and Moses' exile in Midian. At the burning bush, the Lord reveals His holiness, His covenant name, and His compassion for His oppressed people. Deliverance begins with God's seeing, hearing, remembering, and sending.",
  "Psalm 23": "Psalm 23 is a Davidic psalm of trust that pictures the Lord as Shepherd and host. Its comfort is not the absence of danger, because the valley and enemies remain present, but the Lord's guiding, restoring, protecting, and welcoming care.",
  "Isaiah 53": "Isaiah 53 belongs within Isaiah's Servant Songs, where the Servant suffers, is rejected, bears sin, and brings peace to many. Christians read this passage in light of Jesus' death and resurrection, while keeping Isaiah's first setting of promised restoration in view.",
  "Luke 2": "Luke 2 places Jesus' birth within real history under Caesar Augustus, but the announcement comes first to shepherds. The chapter joins humility and glory: the Savior, Christ the Lord, is born in David's city, and God's salvation comes near to ordinary people.",
  "John 3": "John 3 records Jesus' conversation with Nicodemus, a teacher of Israel, about new birth, the Spirit, and believing in the Son. The famous promise of God's love comes within a passage that also speaks honestly about human darkness and the need for life from above.",
  "Romans 8": "Romans 8 follows Paul's explanation of sin, law, justification, and union with Christ. It gathers the assurance of life in the Spirit: no condemnation, adoption, suffering with hope, Spirit-helped weakness, and God's inseparable love in Christ.",
  "Ephesians 2": "Ephesians 2 moves from spiritual death to God's mercy, then from personal salvation to a reconciled new people in Christ. Grace through faith is the foundation, and good works are the fruit God prepares. The chapter keeps rescue and community together.",
  "Revelation 21": "Revelation 21 comes after judgment and the defeat of evil, showing the new heaven and new earth where God dwells with His people. The final hope is not vague escape, but renewed creation, wiped tears, holiness, and life with God forever."
});

const contextOverridesByPlan: Record<string, Record<string, string>> = {
  "life-of-jesus": {
    "Luke 2": "This shorter Life of Jesus path begins with Luke's birth narrative under Caesar Augustus, where angelic glory meets the humility of a manger. The day introduces Jesus as Savior, Christ, and Lord before tracing His ministry, cross, and resurrection.",
    "Matthew 3": "In this Life of Jesus path, Matthew 3 marks the public unveiling of the beloved Son. Jesus stands with repentant Israel at the Jordan, and the Father's voice and Spirit's descent frame everything that follows.",
    "Matthew 4": "This day follows Jesus from the Jordan into wilderness testing. The passage shows the Son beginning His ministry in obedient dependence, answering the tempter with Scripture before He announces the kingdom.",
    "Matthew 5": "This Life of Jesus reading pauses at the opening of His kingdom teaching. The Sermon on the Mount reveals the kind of people formed by the King and the heart-level righteousness His reign brings.",
    "Mark 2": "In the Life of Jesus sequence, Mark 2 shows His authority becoming impossible to ignore. Forgiveness, table fellowship, fasting, and Sabbath controversies reveal mercy that unsettles religious control.",
    "Luke 15": "This reading places Jesus' welcome of sinners near the center of His ministry. The parables answer religious grumbling by revealing the Father's joy and the searching mercy embodied in Christ.",
    "John 11": "In the Life of Jesus path, John 11 brings the journey close to the cross. Raising Lazarus reveals Jesus as resurrection and life while intensifying the opposition that will lead to His death.",
    "John 13": "This Life of Jesus day enters the upper room, where the Lord serves His disciples before the cross. The foot washing displays the shape of His love and prepares the disciples for the command to love one another.",
    "John 17": "Near the end of the Life of Jesus path, John 17 lets readers hear the Son praying before His suffering. His concerns are glory, protection, truth, unity, mission, and love for those the Father has given Him.",
    "Matthew 26": "This Life of Jesus reading follows the Savior into betrayal, Passover, and Gethsemane. His sorrow is real, but His obedience remains steady as He receives the cup from the Father.",
    "John 19": "This Life of Jesus day reaches the cross through John's account of trial, crucifixion, and burial. The repeated fulfillment of Scripture shows that Jesus' death is not accident but completed saving work.",
    "John 20": "The Life of Jesus path concludes with John's resurrection witnesses. Mary, the gathered disciples, and Thomas move from grief, fear, and doubt toward peace, confession, and believing witness."
  },
  "holy-week-passion-week": {
    "Matthew 26": "In Holy Week, Matthew 26 belongs to the night of betrayal and surrender. Passover, Gethsemane, arrest, and denial reveal Jesus walking willingly toward the cross while human faithfulness collapses around Him.",
    "John 13": "In the Holy Week sequence, John 13 opens the upper-room hours before the cross. Jesus' washing of feet interprets His passion as cleansing, servant-hearted love given to disciples who still need grace.",
    "John 17": "This Holy Week reading lets Jesus' prayer stand between the upper room and the cross. He entrusts His people to the Father, praying for truth, unity, protection, and love as His hour arrives.",
    "John 19": "On Good Friday, John 19 presents the mocked King completing the Father's work. The crucifixion is full of suffering, yet John's fulfillment details show Jesus laying down His life with sovereign purpose.",
    "John 20": "Holy Week ends in John's resurrection morning and evening appearances. The empty tomb, Mary's witness, the disciples' peace, and Thomas' confession answer the grief and fear of the previous days."
  },
  "advent-readings": {
    "Luke 2": "In the Advent path, Luke 2 is read as the arrival long promised through Israel's story. Bethlehem, David's city, angelic praise, and shepherd witnesses announce that the Savior has come in humility for ordinary people."
  },
  "easter-resurrection-readings": {
    "John 20": "In the Easter path, John 20 centers the resurrection as the turning point of Christian faith. The signs are written so readers may believe Jesus is the Christ and have life in His name.",
    "Acts 2": "In the Easter path, Acts 2 shows resurrection proclaimed after Pentecost. Peter announces that the crucified Jesus has been raised and exalted, and the Spirit's gift confirms His reign.",
    "Acts 4": "In the Easter path, Acts 4 shows resurrection witness under pressure. The healed man becomes evidence that the rejected Jesus is now the cornerstone and the only name of salvation."
  },
  "chronological-overview": {
    "Genesis 12": "In the Chronological Overview, Genesis 12 is the covenant turn after creation, fall, and flood. God's promise to Abram narrows the line of blessing while widening its goal to all families of the earth.",
    "Exodus 12": "In the Chronological Overview, Exodus 12 marks redemption from slavery through Passover. Israel's identity is reshaped around the Lord's rescue, sacrifice, judgment, and remembered deliverance.",
    "1 Samuel 16": "In the Chronological Overview, 1 Samuel 16 moves the story from Saul's failed kingship toward David. God's choice of the overlooked shepherd prepares the Davidic line through which messianic hope will later be traced.",
    "2 Samuel 7": "In the Chronological Overview, 2 Samuel 7 is a major covenant milestone. God's promise to build David's house carries the Bible's royal hope forward toward an enduring Son and kingdom.",
    "Isaiah 53": "In the Chronological Overview, Isaiah 53 brings prophetic hope into the shape of suffering service. The Servant bears sin and brings peace, preparing the reader to understand the cross as substitution.",
    "Luke 2": "In the Chronological Overview, Luke 2 marks the promised arrival within ordinary history. The Savior is born in David's city, joining covenant hope, humble circumstances, and heavenly announcement.",
    "John 19": "In the Chronological Overview, John 19 is the cross at the center of redemption's story. Scripture is fulfilled, the King is lifted up, and Jesus declares the saving work finished.",
    "Acts 2": "In the Chronological Overview, Acts 2 marks the Spirit-empowered expansion after Jesus' resurrection and ascension. The church's witness begins publicly with Peter proclaiming the crucified and risen Lord.",
    "Romans 8": "In the Chronological Overview, Romans 8 explains the life created by Christ's saving work. No condemnation, adoption, Spirit-helped weakness, and future glory show redemption applied and creation's renewal awaited.",
    "Revelation 21": "In the Chronological Overview, Revelation 21 brings the story to new creation. God's dwelling with His people, the end of death, and the making-new of all things answer the Bible's long hope."
  },
  "anxiety-peace": {
    "Matthew 6:25-34": "In Anxiety and Peace, Matthew 6 addresses worry by reordering attention toward the Father's care and kingdom. Jesus does not mock anxious need; He calls disciples to live today under God's knowledge of what they need.",
    "Matthew 11:28-30": "In Anxiety and Peace, Matthew 11 presents rest as coming to Jesus and learning His gentle way. The promise is not escape from discipleship, but relief from crushing burdens under the yoke of the humble Savior.",
    "John 14:25-27": "In Anxiety and Peace, John 14 speaks to troubled disciples on the night before the cross. Jesus' peace is grounded in His word, the Spirit's ministry, and His continuing care when circumstances are not easy.",
    "Philippians 4:4-9": "In Anxiety and Peace, Philippians 4 gives anxious thoughts a practiced path: prayer, thanksgiving, truthful attention, and faithful obedience. God's peace guards in Christ while the God of peace remains with His people.",
    "1 Peter 5:6-11": "In Anxiety and Peace, 1 Peter 5 joins casting cares with humility, watchfulness, and suffering hope. God's care does not remove every battle at once, but He promises restoration, strength, and firmness in Christ."
  }
};

const curatedDevotionalsByPlan: CuratedDevotionalMap = {
  "john-21": johnGospelDevotionals,
  "romans-16": romansDevotionals,
  "psalms-prayer": psalmsPrayerDevotionals,
  "beginner-bible": beginnerBibleDevotionals,
  "fourteen-days-life-of-jesus": lifeOfJesusDevotionals,
  "life-of-jesus": lifeOfJesusDevotionals,
  "holy-week-passion-week": holyWeekDevotionals,
  "advent-readings": adventDevotionals,
  "easter-resurrection-readings": easterDevotionals,
  "life-of-david": lifeOfDavidDevotionals,
  "life-of-moses": lifeOfMosesDevotionals,
  "chronological-overview": chronologicalOverviewDevotionals,
  "acts-early-church": actsEarlyChurchDevotionals,
  "pauls-letters-overview": paulsLettersOverviewDevotionals,
  "major-prophets-overview": majorProphetsOverviewDevotionals,
  "seven-days-prayer": {
    "Matthew 6:5-13": devotional(
      "Pray to your Father",
      "Jesus warns against prayer that performs for people and teaches prayer that rests before the Father. The Lord's Prayer begins with God's name, kingdom, and will before turning to daily bread, forgiveness, and deliverance. Prayer is not a display of spirituality; it is childlike dependence on the Father who sees.",
      "Where does your prayer need to become simpler, more honest, and more Father-centered?",
      "Father, teach me to pray for Your name, Your kingdom, and today's needed grace.",
      {
        context: "Jesus is teaching His disciples in the Sermon on the Mount. He contrasts public religious performance with prayer offered to the Father who sees in secret. The Lord's Prayer begins with God's name, kingdom, and will before daily needs are named."
      }
    ),
    "Luke 11:1-13": devotional(
      "Teach us to pray",
      "The disciples ask Jesus to teach them to pray, and He answers with both a pattern and encouragement to ask. The Father is not reluctant or careless; He gives what is good, especially the Holy Spirit. Prayer grows when you trust the Father's goodness more than your own words.",
      "What do you need to ask the Father for with renewed trust in His goodness?",
      "Father, teach me to ask, seek, and knock as one who trusts Your heart.",
      {
        context: "After Jesus prays, His disciples ask Him to teach them to pray. He gives a pattern of prayer and then encourages persistence by contrasting imperfect human giving with the Father's greater goodness. The passage climaxes with the Father's gift of the Holy Spirit."
      }
    ),
    "Psalm 23:1-6": devotional(
      "Pray from trust",
      "Psalm 23 gives prayer the language of trust. The Lord shepherds, restores, guides, protects, provides, and surrounds His people with goodness and mercy. You can pray from need without panic because the Shepherd knows how to care for His sheep.",
      "Which line of Psalm 23 gives words to your prayer today?",
      "Lord, my Shepherd, lead me, restore me, and keep me near You.",
      {
        context: "Psalm 23 is a Davidic psalm using shepherd and host imagery for the Lord's personal care. It moves through rest, restoration, guidance, danger, provision, mercy, and dwelling with God. Prayer from this psalm is trust in the Shepherd's presence, not denial of valleys."
      }
    ),
    "Psalm 46:1-11": psalm46StillBeforeGodDevotional,
    "Philippians 4:4-7": devotional(
      "Pray with thanksgiving",
      "Paul calls anxious hearts to bring requests to God with thanksgiving. Thanksgiving does not pretend needs are small; it remembers God's faithfulness while naming them. The peace that follows is God's guard over the heart and mind in Christ.",
      "What anxious request can you bring to God with thanksgiving today?",
      "Lord, receive my requests and guard my heart and mind in Christ.",
      {
        context: "Paul writes from prison to a beloved church and has just urged Euodia and Syntyche toward unity. He calls the church to rejoice in the Lord, show gentleness, and bring requests to God with thanksgiving. The peace promised is God's guard in Christ, not a reward for perfect calm."
      }
    ),
    "James 5:13-18": devotional(
      "Pray in every season",
      "James places prayer in suffering, cheerfulness, sickness, confession, and restoration. Prayer is not reserved for one emotional state; it belongs to the whole life of faith. The example of Elijah reminds you that God works through ordinary human prayer offered in trust.",
      "What season are you in, and what kind of prayer does James invite from you?",
      "Lord, teach me to turn to You in suffering, joy, weakness, confession, and hope.",
      {
        context: "James closes his letter by placing prayer in suffering, cheerfulness, sickness, confession, restoration, and ordinary human weakness. The example of Elijah is given to encourage faithful prayer, not to make prayer a technique for controlling God."
      }
    ),
    "1 John 5:13-15": devotional(
      "Ask with confidence",
      "John grounds confidence in eternal life given through the Son and in asking according to God's will. This is not confidence that every desire will be granted on our terms, but confidence that God hears His children and is faithful to His will.",
      "What request needs to be brought under God's will with confidence that He hears?",
      "Father, help me ask with trust, humility, and confidence in Your will.",
      {
        context: "John writes so believers may know they have eternal life in the Son. Prayer confidence rests inside that assurance and is shaped by asking according to God's will. The passage teaches bold humility, not a blank cheque for every desire."
      }
    )
  },
  "fourteen-days-anxiety-trust": {
    "Psalm 23:1-4": guidedDevotional({
      title: "The Shepherd is near",
      context: "Psalm 23 is a Davidic psalm using shepherd imagery for the Lord's provision, guidance, and protection. In verses 1-4 the speaker moves from testimony about God to direct address in the valley of deep darkness. The comfort rests on the Shepherd's presence, not on the absence of danger.",
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
      context: "Psalm 27 begins with Davidic confidence in the Lord amid enemies and danger, then turns toward prayer for God's presence. Verses 1-5 move from fearless trust to the one desire to dwell with the Lord and seek Him. The shelter imagery is covenant worship and protection language, not a promise that trouble never comes.",
      body: "Fear is answered first by who God is. David's desire to dwell with the Lord is not escape; it is the deepest safety he knows when pressure surrounds him. The passage invites fearful hearts to seek the Lord before fear takes the lead.",
      observationQuestion: "What names does David use for the Lord before describing trouble?",
      reflectionQuestion: "Which fear needs to be answered today by who the Lord is?",
      prayer: "Lord, be my light and salvation. Teach my heart to seek You before fear takes the lead.",
      gentleAction: "Write the phrase 'The Lord is my light' beside one specific fear.",
      studyMethod: "SOAP",
      careNote: carePlanPastoralNote
    }),
    "Psalm 46:1-11": guidedDevotional({
      title: "God is refuge and ruler",
      context: "Psalm 46 is a Korahite Song of Zion. It portrays creation convulsing and nations raging, yet God remains present with His city and brings warfare to an end. In verse 10, 'be still' or 'cease' most likely rebukes the hostile nations, although some interpreters understand it as reassurance to Judah. In either reading, the climax is God's universal rule and exaltation.",
      body: "'Be still' is not primarily a technique for creating private inner calm. In a world of conflict and upheaval, it calls striving and opposition to cease before the God who will be exalted. An anxious reader can take comfort not in an ability to make life quiet, but in the Lord who remains with His people and rules over what is shaking.",
      observationQuestion: "What disturbances does the Psalm name, what does God do, and which assurance is repeated?",
      reflectionQuestion: "Where does conflict or instability make God's rule difficult to see? How do the Psalm's repeated assurances reshape your response?",
      prayer: "Lord of hosts, be my refuge when life feels unstable. Help me entrust what I cannot rule to the One who is exalted over all.",
      gentleAction: "Read verses 1, 7, 10, and 11 slowly, then name one unsettled situation you are entrusting to God.",
      studyMethod: "COMA",
      careNote: carePlanPastoralNote
    }),
    "Psalm 91:1-4": guidedDevotional({
      title: "Shelter under His wings",
      context: "Psalm 91 speaks in poetic, wisdom-like confidence about the safety of those who dwell under the Most High's shelter. The opening verses use refuge, fortress, wings, and shield imagery to describe God's protection. The psalm invites trust without denying that faithful people may still suffer.",
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
      context: "Isaiah 26 is a song to be sung in Judah about God's strong city, salvation, and the righteous people who keep faith. Within that communal song, God's people are called to trust the Lord forever as the everlasting Rock.",
      body: "The promised peace is not detached positive thinking. It belongs to a people whose purpose is held steady because they trust the Lord. An anxious mind may wander, but the song directs God's people together toward His enduring character rather than changing circumstances.",
      observationQuestion: "How do the song's images of a strong city, a steadfast mind, trust, and the everlasting Rock belong together?",
      reflectionQuestion: "What thought pattern needs to be re-anchored in the Lord today?",
      prayer: "Lord, keep my mind stayed on You and teach me to trust You as my everlasting Rock.",
      gentleAction: "When a thought repeats, answer it once with the words 'everlasting Rock.'",
      studyMethod: "Word study",
      careNote: carePlanPastoralNote
    }),
    "Isaiah 41:8-13": guidedDevotional({
      title: "God holds His servant",
      context: "In contrast to fearful nations and their idols, God addresses Israel, also called Jacob, as His chosen servant and the offspring of Abraham. He assures His covenant people that He has not rejected them and will remain with, strengthen, help, and uphold them.",
      body: "The promise first reassures Israel that God has not abandoned His chosen servant. Help rests in God's covenant faithfulness, not Israel's strength. It should not be detached from that story or treated as a guarantee that every feared outcome will disappear; it reveals the God who remains with and upholds His people.",
      observationQuestion: "Who is God's servant in these verses, and what reasons does God give His people not to fear?",
      reflectionQuestion: "How does God's faithfulness to His people reshape the way you face your present fear?",
      prayer: "Faithful God, keep me near Your people and help me face fear in the strength of Your presence and care.",
      gentleAction: "Write down each reason God gives Israel not to fear, then thank Him for what it reveals about His character.",
      studyMethod: "SOAP",
      careNote: carePlanPastoralNote
    }),
    "Matthew 6:25-34": guidedDevotional({
      title: "Seek first the kingdom",
      context: "In the Sermon on the Mount, Jesus has just warned against storing up earthly treasure and trying to serve both God and money. Therefore, He tells His disciples not to let concern for food, drink, and clothing rule them. Their heavenly Father knows their needs, and Jesus calls them to seek God's kingdom and righteousness one day at a time.",
      body: "Jesus is not shaming people for experiencing anxiety or forbidding wise planning. He challenges worry that tries to secure life apart from the Father. Because life is more than possessions and the Father knows what His children need, disciples can seek His kingdom today and leave tomorrow in His care. This is an invitation to reordered trust, not a promise that distress will immediately disappear.",
      observationQuestion: "What reasons does Jesus give for not being ruled by worry, and what priority does He put in its place?",
      reflectionQuestion: "Which present need or concern about tomorrow is occupying you today? What could seeking God's kingdom look like in one concrete action?",
      prayer: "Father, You know what I need. Help me seek Your kingdom and righteousness today and entrust tomorrow to You.",
      gentleAction: "Name one present need, take one appropriate action available today, and entrust what cannot yet be acted upon to God.",
      studyMethod: "COMA",
      careNote: carePlanPastoralNote
    }),
    "Matthew 11:28-30": guidedDevotional({
      title: "Rest under Jesus' yoke",
      context: "In Matthew 11 Jesus has just spoken of the Father revealing the Son to the humble rather than the self-sufficient. He invites the weary and burdened to come to Him, take His yoke, and learn from His gentle and humble heart. The rest He gives is discipleship under the gentle Messiah, not escape from all responsibility.",
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
      context: "These words belong to Jesus' Farewell Discourse on the night before His crucifixion. The disciples are troubled because He is going away, and Jesus promises that the Holy Spirit will teach them and bring His words to remembrance. That promise is first addressed to the disciples who will bear witness to Jesus after His departure. Believers now receive and live in Jesus' peace through the apostolic word and the Spirit's continuing ministry.",
      body: "Jesus' peace is not the world's promise of easy circumstances, but the settled gift of His presence, word, and Spirit. Troubled hearts are invited to trust Him because He remains faithful. His peace is received, not manufactured.",
      observationQuestion: "What does Jesus promise, and how is His peace different from the world's peace?",
      reflectionQuestion: "What trouble needs to be brought under the peace Jesus gives?",
      prayer: "Lord Jesus, give me Your peace and keep my heart from being ruled by fear.",
      gentleAction: "Read Jesus' words in verses 25-27 again, and ask the Spirit to help you remember, trust, and live by what Jesus has said.",
      studyMethod: "Inductive",
      careNote: carePlanPastoralNote
    }),
    "Romans 8:31-39": guidedDevotional({
      title: "Nothing can separate",
      context: "Romans 8 concludes Paul's argument that those in Christ are no longer condemned and are led by the Spirit as God's children. Paul speaks to believers who still suffer, groan, and wait for glory. The passage assures them that no accusation, hardship, power, or death can separate them from God's love in Christ.",
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
      context: "Near the close of his letter, after urging Euodia and Syntyche toward unity, Paul addresses the whole church. Because the Lord is near, they are to rejoice, show gentleness, bring requests to God, dwell on what is true, and practice what they have received.",
      body: "Paul places anxiety within the church's shared life of gentleness, prayer, thanksgiving, truthful thought, and faithful practice. He gives concerns somewhere to go without suggesting that anxious feelings prove spiritual failure. God's peace guards hearts and minds in Christ while the church continues to live what it has learned.",
      observationQuestion: "What does Paul tell believers to do with requests, thoughts, and practices?",
      reflectionQuestion: "What request can you bring to God today with thanksgiving rather than silent worry?",
      prayer: "God of peace, guard my heart and mind in Christ Jesus.",
      gentleAction: "Write one request, one thank-you, and one true thing to dwell on.",
      studyMethod: "SOAP",
      careNote: carePlanPastoralNote
    }),
    "Colossians 3:12-17": guidedDevotional({
      title: "Let peace rule",
      context: "Paul addresses God's chosen people as one body. They are to put on compassion, patience, forgiveness, and love; let Christ's peace govern their shared life; and let Christ's word dwell among them through teaching, worship, gratitude, and faithful action.",
      body: "The peace of Christ is not presented here mainly as relief from private anxiety. It is to govern a community called into one body, especially where patience and forgiveness are needed. Christ's word, gratitude, worship, and love shape a people whose relationships come under His rule.",
      observationQuestion: "Which communal practices surround the command to let Christ's peace rule in the one body?",
      reflectionQuestion: "Which relationship needs compassion, patience, forgiveness, or gratitude so that Christ's peace can govern your response?",
      prayer: "Lord Jesus, let Your peace rule among us and let Your word dwell richly in Your people.",
      gentleAction: "Choose one peaceful word or thankful action in a relationship today.",
      studyMethod: "COMA",
      careNote: carePlanPastoralNote
    }),
    "1 Peter 5:6-11": guidedDevotional({
      title: "Cast your cares on Him",
      context: "Peter writes to scattered Christians facing social pressure and suffering. After instructing elders and the community in humility, he calls believers to humble themselves under God, cast anxieties on Him, and resist the devil together. The promise is God's final restoration after suffering, not a denial that suffering is real.",
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
      context: "John describes believers abiding in God through the Spirit, confessing Jesus as God's Son, and knowing God's love. This gives them confidence for the day of judgment, because God's completed love drives out the fear of punishment.",
      body: "Perfect love casts out fear because judgment is no longer the believer's final terror in Christ. Fear is answered by abiding in the love God has first given. The passage does not shame fear; it directs fear toward the finished love of God.",
      observationQuestion: "What does John say about God's love, abiding, confidence, and fear?",
      reflectionQuestion: "Where do you need God's first love to quiet fear of judgment or punishment?",
      prayer: "Father, help me abide in Your love and rest in the confidence Christ gives for the day of judgment.",
      gentleAction: "Repeat once today: 'I love because He first loved me.'",
      studyMethod: "Inductive",
      careNote: carePlanPastoralNote
    })
  },
  "prayer-dependence": {
    "Matthew 6:9-13": guidedDevotional({
      title: "Pray as a child of the Father",
      context: "Jesus teaches the Lord's Prayer within the Sermon on the Mount, where hidden devotion before the Father is contrasted with religious performance. The prayer begins with God's name, kingdom, and will before bringing daily bread, forgiveness, temptation, and deliverance to Him.",
      body: "The Lord's Prayer trains dependence without performance. It begins with the Father, not with frantic need. Daily bread, forgiveness, and rescue are brought into relationship with the One whose name is holy and whose kingdom is coming.",
      observationQuestion: "What requests are directed toward God first, and what needs are then brought to Him?",
      reflectionQuestion: "Which phrase of the Lord's Prayer most needs to shape your dependence today?",
      prayer: "Father, let Your name be hallowed in me and teach me to depend on You for today.",
      gentleAction: "Pray the Lord's Prayer slowly, pausing at the phrase that most catches your attention.",
      studyMethod: "SOAP"
    }),
    "Luke 11:5-13": guidedDevotional({
      title: "Ask the generous Father",
      context: "After teaching His disciples to pray, Jesus uses a midnight request and parent-child comparison to encourage persistence. The point is not that God is reluctant, but that the Father is better than flawed human givers and gives the Holy Spirit to those who ask.",
      body: "The heart of this passage is not that God is reluctant and must be worn down. Jesus points beyond imperfect human generosity to the Father's goodness, especially His gift of the Holy Spirit. Dependence grows when you ask from trust rather than suspicion.",
      observationQuestion: "What does Jesus say the Father gives, and how does He compare the Father to human parents?",
      reflectionQuestion: "Where are you hesitant to ask because you doubt the Father's goodness?",
      prayer: "Father, teach me to ask, seek, and knock with trust in Your generous heart.",
      gentleAction: "Ask God plainly for one good thing you need, then thank Him for hearing you as Father.",
      studyMethod: "OIA"
    }),
    "Psalm 23:1-6": guidedDevotional({
      title: "The Lord provides",
      context: "Psalm 23 is David's confession of the Lord as Shepherd, not a promise that need or danger will never appear. The Shepherd leads, restores, guides, comforts, provides, and keeps His people near from green pastures through the valley and toward dwelling with Him.",
      body: "Psalm 23 turns dependence into worship. David's confidence is not that need never appears, but that the Shepherd meets him in every season. The Lord's care is personal, steady, and generous enough for green pastures, dark valleys, and the house of the Lord.",
      observationQuestion: "What does the Shepherd provide or do across this Psalm?",
      reflectionQuestion: "Which need can you bring to the Shepherd instead of managing alone?",
      prayer: "Lord, my Shepherd, lead me, restore me, and teach me to trust Your provision.",
      gentleAction: "Name one place where you need shepherding and ask the Lord to lead you there.",
      studyMethod: "Meditation"
    }),
    "Psalm 46:1-11": guidedDevotional({
      title: "Be still before the God who reigns",
      context: "Psalm 46 is a Korahite Song of Zion that names shaking creation, raging nations, and human striving. Its repeated confidence is that the Lord of hosts is with His people. Being still is a summons to cease striving before God's rule, not a denial of trouble.",
      body: "The command to be still is not denial or passivity. It is a summons to stop striving as if everything rests on you and to know that the Lord is exalted. Dependence becomes worship when pressure is brought before the God who reigns.",
      observationQuestion: "What trouble is named, and what is repeated about God?",
      reflectionQuestion: "Where are you carrying pressure as though God is absent or unable to help?",
      prayer: "Lord Almighty, quiet my striving and help me know that You are present, faithful, and exalted.",
      gentleAction: "Sit quietly for one minute and repeat, 'The Lord is with us.'",
      studyMethod: "COMA"
    }),
    "Philippians 4:4-7": guidedDevotional({
      title: "Pray with thanksgiving",
      context: "Paul writes Philippians from hardship and addresses a community learning joy, gentleness, unity, and endurance in Christ. The call to pray with thanksgiving is not a demand for effortless calm; it is an invitation to bring real requests to God so His peace guards hearts and minds in Christ.",
      body: "Thanksgiving does not erase need; it remembers God's faithfulness while need is being named. The promised peace guards hearts and minds in Christ, not apart from Him. Dependence means bringing requests to God rather than letting them rule unspoken.",
      observationQuestion: "What does Paul tell believers to do with their requests?",
      reflectionQuestion: "What request can you bring to God today with honest need and real thanksgiving?",
      prayer: "Lord, receive my requests and guard my heart and mind in Christ Jesus.",
      gentleAction: "Write one request and one reason for thanksgiving beside it.",
      studyMethod: "SOAP"
    }),
    "James 1:5-8": guidedDevotional({
      title: "Ask God for wisdom",
      context: "James writes to scattered believers facing trials and teaches that steadfastness grows through testing. In that pressure, wisdom is needed for faithful endurance, so James invites anyone lacking wisdom to ask the generous God rather than react from divided trust.",
      body: "This is dependence in decision-making: not pretending to know, not wavering between self-rule and trust, but asking the Lord for wisdom to endure faithfully. God is not stingy with wisdom. He gives generously to those who come to Him.",
      observationQuestion: "What does James say to do when wisdom is lacking?",
      reflectionQuestion: "Where do you need wisdom more than control?",
      prayer: "Generous God, give me wisdom and make my trust steady before You.",
      gentleAction: "Before making one decision today, ask God for wisdom in a single honest sentence.",
      studyMethod: "Inductive"
    }),
    "1 Peter 5:6-11": guidedDevotional({
      title: "Cast your cares",
      context: "Peter writes to believers under pressure and calls them to humble themselves under God's mighty hand. Casting anxieties on God sits beside sober watchfulness and hope in the God of all grace, so dependence is neither panic nor passivity but trust under His care.",
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
      context: "Genesis 15 comes after Abram has received God's call and promise, yet he still has no child of promise. The Lord answers Abram's honest question by reaffirming His covenant promise and showing him the stars. Abram's faith is trust in the God who speaks, not vague optimism about circumstances.",
      body: "Abram's faith is not vague optimism; he believes the Lord who speaks. Scripture says this trust was counted to him as righteousness, pointing forward to the grace God gives through faith. Faith begins by taking God at His word even when sight has not caught up.",
      observationQuestion: "What does God promise Abram, and how does Abram respond?",
      reflectionQuestion: "What promise of God needs to become weightier than what you can presently see?",
      prayer: "Lord, help me take You at Your word and trust Your promise.",
      gentleAction: "Name one promise of God and one visible circumstance that makes trust feel difficult.",
      studyMethod: "OIA"
    }),
    "Psalm 37:3-7": guidedDevotional({
      title: "Trust and wait",
      context: "Psalm 37 teaches God's people how to respond when the wicked seem to prosper and outcomes feel delayed. Faith here is patient trust expressed through dwelling, doing good, delighting in the Lord, committing the way to Him, and waiting for His vindication.",
      body: "Trust is joined with concrete faithfulness: dwell, do good, delight in the Lord, commit your way, be still, and wait. Faith is not frantic control. It is patient confidence that the Lord sees and acts rightly.",
      observationQuestion: "What active commands does the Psalm give to someone learning to trust?",
      reflectionQuestion: "Where do you need to practice trust by waiting faithfully rather than forcing an outcome?",
      prayer: "Lord, help me commit my way to You and wait with a quiet heart.",
      gentleAction: "Choose one faithful action you can do while leaving the outcome with God.",
      studyMethod: "SOAP"
    }),
    "Habakkuk 3:17-19": guidedDevotional({
      title: "Rejoice when it is hard",
      context: "Habakkuk ends with worship after the prophet has wrestled honestly with injustice, judgment, waiting, and fear. The failed crops and empty stalls describe covenant-level devastation, not a minor inconvenience. His joy is anchored in the Lord Himself when visible supports are stripped away.",
      body: "Habakkuk's faith does not depend on visible abundance. Even if fields, flocks, and harvests fail, he rejoices in the Lord and takes strength in God. This is not denial of loss; it is worship anchored in God when supports are stripped away.",
      observationQuestion: "What losses does Habakkuk name, and where does he locate joy and strength?",
      reflectionQuestion: "What circumstance is testing whether your joy is anchored in God Himself?",
      prayer: "Lord, be my strength when visible supports feel weak.",
      gentleAction: "Write a short 'even if... yet I will...' prayer from your present situation.",
      studyMethod: "Meditation"
    }),
    "Matthew 8:5-13": guidedDevotional({
      title: "Great faith",
      context: "A centurion comes to Jesus for his servant, recognizing Jesus' authority even from a distance. The passage presents faith as confidence in Jesus' word and authority, with a Gentile soldier understanding what many in Israel are still failing to see.",
      body: "The centurion trusts Jesus' word because he sees Jesus' authority. Jesus marvels at this faith because it understands who He is. Faith is not confidence in technique; it is confidence in the authority and mercy of Christ.",
      observationQuestion: "What does the centurion understand about authority, and how does Jesus respond?",
      reflectionQuestion: "Where do you need to trust the authority of Jesus' word today?",
      prayer: "Lord Jesus, strengthen my faith in Your authority and mercy.",
      gentleAction: "Bring one need to Jesus simply, without trying to control how He must answer.",
      studyMethod: "COMA"
    }),
    "Mark 9:20-27": guidedDevotional({
      title: "Help my unbelief",
      context: "A desperate father brings his son to Jesus after years of suffering and mixed hope. His cry, 'I believe; help my unbelief,' gives honest language for divided trust while placing even weak faith before Jesus' mercy and power.",
      body: "The father's cry is honest: 'I believe; help my unbelief.' Jesus does not require polished confidence before mercy is given. This passage gives weak faith words to bring both trust and struggle to Christ.",
      observationQuestion: "What does the father confess to Jesus, and what does Jesus do?",
      reflectionQuestion: "Where can you honestly say, 'I believe; help my unbelief'?",
      prayer: "Lord Jesus, meet me in weak faith and strengthen my trust in You.",
      gentleAction: "Use the father's prayer exactly as your own when faith feels mixed today.",
      studyMethod: "OIA"
    }),
    "John 20:24-31": guidedDevotional({
      title: "Blessed are those who believe",
      context: "John 20 records resurrection appearances and then states the Gospel's purpose: that readers may believe Jesus is the Christ, the Son of God. Thomas moves from absence and doubt to worship when he encounters the risen Christ. The blessing extends to later believers who trust the apostolic witness.",
      body: "John writes so readers may believe that Jesus is the Christ, the Son of God, and have life in His name. Faith rests on the witness to the risen Lord. Doubt is not answered by vague comfort, but by the crucified and risen Jesus.",
      observationQuestion: "What confession does Thomas make, and why does John say he wrote these things?",
      reflectionQuestion: "How might Thomas' confession help you bring doubt or hesitation honestly to the risen Jesus?",
      prayer: "My Lord and my God, deepen my faith in Your risen life.",
      gentleAction: "Say Thomas' confession slowly as a prayer of faith.",
      studyMethod: "Inductive"
    }),
    "Romans 4:18-25": guidedDevotional({
      title: "Faith credited",
      context: "Paul reflects on Abraham's faith to show that righteousness is counted by grace, not achieved by works. Abraham trusts the God who gives life to the dead, and Paul connects that same faith to Jesus delivered for sins and raised for justification.",
      body: "Abraham trusts the God who gives life to the dead, and Paul points believers to Jesus, delivered for our trespasses and raised for our justification. Saving faith looks away from self-earning and toward the God who raises the dead.",
      observationQuestion: "How does Paul connect Abraham's faith with faith in Jesus?",
      reflectionQuestion: "How does Christ's death and resurrection strengthen your confidence before God?",
      prayer: "Father, ground my faith in Christ who died and was raised for me.",
      gentleAction: "Thank God specifically for Christ being delivered and raised for you.",
      studyMethod: "Word study"
    }),
    "Romans 5:1-5": guidedDevotional({
      title: "Justified by faith",
      context: "Paul describes the results of being justified by faith: peace, access, hope, endurance, and God's poured-out love. Faith opens into a whole reconciled life with God, where even suffering is held within hope because the Spirit pours God's love into believers' hearts.",
      body: "Because believers are justified by faith, they have peace with God through Jesus Christ. Even suffering is not meaningless, because God uses it to form endurance, character, and hope. This hope does not shame us because God's love has been poured into our hearts.",
      observationQuestion: "What blessings flow from being justified by faith?",
      reflectionQuestion: "Where do you need peace with God to steady you in suffering?",
      prayer: "Lord, let the hope of Your love strengthen me through trial.",
      gentleAction: "Write one hardship beside one hope named in this passage.",
      studyMethod: "SOAP"
    }),
    "Galatians 2:19-21": guidedDevotional({
      title: "Live by faith",
      context: "Paul explains life in Christ as crucified with Christ and now lived by faith in the Son of God. Faith is union-shaped and personal here: Paul lives from the self-giving love of Christ rather than rebuilding a law-based standing before God.",
      body: "Faith is deeply personal here: daily life is lived from union with Christ and His self-giving love. Paul does not set aside grace by trying to build righteousness apart from Christ. The believer's life is shaped by the Son of God who loved and gave Himself.",
      observationQuestion: "What does Paul say happened to him, and how does he now live?",
      reflectionQuestion: "What part of today needs to be lived by faith in the Son of God who loves you?",
      prayer: "Christ, live in me and teach me to trust Your love.",
      gentleAction: "Before one ordinary action today, remember: 'Christ loved me and gave Himself for me.'",
      studyMethod: "Meditation"
    }),
    "Ephesians 2:8-10": guidedDevotional({
      title: "Saved by grace",
      context: "Paul makes the order clear: salvation is God's gracious gift, and good works flow from His workmanship. Faith receives grace before it produces obedience, so boasting is excluded while Spirit-formed good works are still expected as the fruit of new creation.",
      body: "Salvation is by grace through faith, not works, so no one may boast. Yet grace also creates a new life prepared for good works. Faith receives God's gift before it walks in God's workmanship.",
      observationQuestion: "What does Paul say salvation is, and what does he say good works are?",
      reflectionQuestion: "Where do you need to receive grace before trying to prove yourself?",
      prayer: "Father, keep me humble in grace and ready for the good works You prepare.",
      gentleAction: "Practice one good work today as gratitude, not self-proof.",
      studyMethod: "Inductive"
    }),
    "Hebrews 10:35-39": guidedDevotional({
      title: "Do not shrink back",
      context: "Hebrews encourages weary believers to endure because God's promise is sure and the coming One will come. Faith is perseverance under pressure, refusing to shrink back because the promised future rests on God's faithfulness rather than present comfort.",
      body: "Faith keeps moving toward the coming One rather than shrinking back under pressure. This passage encourages confidence rooted in God's faithfulness, not in easy circumstances. Endurance grows when the promise of God feels more solid than the pressure to retreat.",
      observationQuestion: "What does the passage say believers need, and what promise is given?",
      reflectionQuestion: "Where are you tempted to shrink back instead of endure in faith?",
      prayer: "Lord, give me endurance and keep my confidence in Your promise.",
      gentleAction: "Choose one small act of endurance that says, 'I am still trusting You.'",
      studyMethod: "COMA"
    }),
    "Hebrews 11:1-6": guidedDevotional({
      title: "Faith and pleasing God",
      context: "Hebrews 11 follows a call not to shrink back but to endure by faith. The chapter describes faith through assurance, conviction, and examples of people who trusted God's unseen promise. Faith is not wishful thinking; it is persevering trust in the God who exists and rewards those who seek Him.",
      body: "Faith is assurance and conviction rooted in God's unseen reality. Abel, Enoch, and all who draw near to God show that faith believes He exists and rewards those who seek Him. Faith is relational trust in God Himself.",
      observationQuestion: "How does Hebrews describe faith, and what must those who draw near believe?",
      reflectionQuestion: "What unseen promise of God needs your trust today?",
      prayer: "Lord, help me draw near to You with faith that seeks and trusts You.",
      gentleAction: "Take one deliberate step of seeking God before checking for visible results.",
      studyMethod: "OIA"
    }),
    "James 2:14-18": guidedDevotional({
      title: "Faith made visible",
      context: "James challenges empty claims of faith that do not become mercy toward people in need. The issue is not faith versus works as rivals, but living faith versus a lifeless claim that refuses practical love to a brother or sister.",
      body: "James does not oppose Paul; he opposes claims that never become love. Genuine faith shows itself in mercy and obedience. Works do not replace faith, but living faith refuses to leave a neighbor uncared for.",
      observationQuestion: "What example does James use to expose empty faith?",
      reflectionQuestion: "How might faith become visible in love or mercy today?",
      prayer: "Lord, make my faith living, humble, and active in love.",
      gentleAction: "Look for one practical mercy you can offer without making a display of it.",
      studyMethod: "Inductive"
    }),
    "1 Peter 1:3-9": guidedDevotional({
      title: "Faith through trials",
      context: "Peter blesses God for new birth into living hope while acknowledging grief in various trials. Faith is tested like precious metal, loving Christ though unseen and rejoicing in a salvation secured by His resurrection and guarded by God.",
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
      context: "At the beginning of his reign, Solomon meets the Lord at Gibeon and is invited to ask. He asks for a discerning heart to govern God's people rather than first asking for wealth, long life, or victory, showing that wisdom is tied to humble responsibility before God.",
      body: "Wisdom begins with humble need. Solomon knows the task before him is too large for self-confidence, so he asks God for a discerning heart. This passage invites us to bring responsibility, decisions, and limits before the God who gives wisdom.",
      observationQuestion: "What does Solomon ask for, and why is the Lord pleased with his request?",
      reflectionQuestion: "Where do you need wisdom more than control, speed, or self-confidence?",
      prayer: "Lord, give me a discerning heart and make my decisions faithful before You.",
      gentleAction: "Name one decision and ask God for wisdom before you act.",
      studyMethod: "COMA"
    }),
    "Psalm 1:1-6": guidedDevotional({
      title: "The way of wisdom",
      context: "Psalm 1 opens the Psalter by contrasting the way of the righteous with the way of the wicked. Wisdom is pictured as delighting in the Lord's instruction and being planted like a fruitful tree, while the wicked are unstable like chaff.",
      body: "Wisdom is more than clever choices; it is a rooted life. The blessed person refuses destructive counsel and delights in the Lord's instruction. Like a tree by streams of water, wisdom grows through steady nourishment, not hurried self-improvement.",
      observationQuestion: "What does the blessed person avoid, and what do they delight in?",
      reflectionQuestion: "What counsel, habit, or influence needs to be weighed against God's word?",
      prayer: "Lord, plant me near Your word and make my life fruitful in Your time.",
      gentleAction: "Notice one influence shaping you today and ask whether it leads toward the Lord.",
      studyMethod: "Meditation"
    }),
    "Psalm 119:97-105": guidedDevotional({
      title: "A lamp to my feet",
      context: "Psalm 119 is an extended acrostic meditation on the Lord's instruction. In these verses, love for God's word shapes wisdom, restraint, direction, and delight. The lamp image gives enough light for faithful steps, not detached curiosity.",
      body: "God's word does not always show the whole road at once, but it gives light for faithful steps. Wisdom listens, meditates, restrains the feet from evil, and keeps walking. Scripture is not only information; it is guidance for the next obedient step.",
      observationQuestion: "What does the Psalmist say God's word does for understanding and direction?",
      reflectionQuestion: "Where do you need enough light for the next step rather than certainty about the whole path?",
      prayer: "Lord, make Your word a lamp to my feet and a light to my path.",
      gentleAction: "Choose one clear obedient step from today's reading.",
      studyMethod: "SOAP"
    }),
    "Proverbs 1:1-7": guidedDevotional({
      title: "The beginning of knowledge",
      context: "Proverbs opens by explaining its purpose: wisdom, instruction, understanding, righteousness, justice, prudence, and discretion. It names the fear of the Lord as the beginning of knowledge, so skill for living starts with reverence before God.",
      body: "Biblical wisdom begins with reverence. Skill for living is not detached from God; it starts with receiving instruction under His authority. The fool refuses wisdom because pride will not listen, but the wise become teachable before the Lord.",
      observationQuestion: "What purposes does Proverbs give for its instruction?",
      reflectionQuestion: "Where do you need to become teachable before the Lord?",
      prayer: "Lord, give me reverence, humility, and a heart willing to receive correction.",
      gentleAction: "Ask one honest question today before defending your first instinct.",
      studyMethod: "Word study"
    }),
    "Proverbs 2:1-11": guidedDevotional({
      title: "Search for wisdom",
      context: "Proverbs 2 addresses wisdom as both a gift from the Lord and something pursued with attention, prayer, and effort. The learner receives, treasures, calls out, seeks, and searches, while the Lord gives wisdom and guards the way of His people.",
      body: "Wisdom is both gift and pursuit. The Lord gives wisdom, yet the passage calls us to receive, treasure, call out, seek, and search. This protects us from passivity and pride: we depend on God while actively seeking what He gives.",
      observationQuestion: "What actions does the passage call for, and what does the Lord give?",
      reflectionQuestion: "What would it look like to seek wisdom more deliberately this week?",
      prayer: "Lord, teach me to seek wisdom as treasure and receive what comes from Your mouth.",
      gentleAction: "Write one area where you need wisdom, then list one practical way to search for it faithfully.",
      studyMethod: "Inductive"
    }),
    "Proverbs 3:5-12": guidedDevotional({
      title: "Trust the Lord",
      context: "Proverbs 3 is parental wisdom instruction, not a formula for guaranteed outcomes. Trusting the Lord means relying on Him rather than leaning on unaided human understanding, while acknowledging Him in the whole path. The section also joins guidance with humility, generosity, and fatherly correction.",
      body: "Wisdom is not leaning on your own understanding while asking God to bless your plan. It is trusting the Lord with all your heart, acknowledging Him, and receiving His correction as love. The wise path is relational before it is strategic.",
      observationQuestion: "What does this passage contrast with leaning on your own understanding?",
      reflectionQuestion: "Where are you tempted to trust your own understanding more than the Lord?",
      prayer: "Lord, help me trust You with all my heart and acknowledge You in my ways.",
      gentleAction: "Pause before one decision and consciously acknowledge the Lord.",
      studyMethod: "SOAP"
    }),
    "Proverbs 4:20-27": guidedDevotional({
      title: "Guard your heart",
      context: "Proverbs 4 continues parental wisdom instruction, urging the listener to pay attention, keep wise words, and guard the heart. The passage connects inner desire with speech, sight, steps, and direction, showing that wisdom forms the whole person.",
      body: "Wisdom pays attention to the inner life. The heart is not ignored as long as outward behavior looks fine; it must be guarded because life flows from it. Words, eyes, paths, and feet all matter because the whole person is being directed.",
      observationQuestion: "What parts of life does the passage tell the listener to watch or guard?",
      reflectionQuestion: "What is currently shaping your heart more than you realize?",
      prayer: "Lord, guard my heart and straighten the path of my words, attention, and choices.",
      gentleAction: "Remove or limit one influence today that is bending your heart away from wisdom.",
      studyMethod: "OIA"
    }),
    "Proverbs 8:10-21": guidedDevotional({
      title: "Wisdom's value",
      context: "In Proverbs 8, Wisdom is personified as publicly calling out and offering instruction, prudence, truth, righteousness, and counsel. The passage teaches readers to value wisdom above silver, gold, or jewels because wisdom aligns life with what is true before God.",
      body: "Wisdom is valuable because it aligns life with what is true and right before God. Proverbs 8 does not despise practical life; it teaches us to prize wisdom above the things we often chase first. Better treasure leads to better decisions.",
      observationQuestion: "What does wisdom say is better than silver, gold, and jewels?",
      reflectionQuestion: "What lesser treasure is competing with wisdom in your choices?",
      prayer: "Lord, make wisdom more precious to me than comfort, approval, or gain.",
      gentleAction: "Before one purchase, plan, or ambition, ask what wisdom would value most.",
      studyMethod: "Word study"
    }),
    "Ecclesiastes 3:1-11": guidedDevotional({
      title: "A time for everything",
      context: "Ecclesiastes 3 reflects on the ordered seasons of life and the limits of human control and understanding under God's rule. The poem names times for joy and sorrow, building and breaking, silence and speech, inviting humility about timing.",
      body: "Wisdom accepts that life has seasons we cannot fully control. God makes everything beautiful in its time, yet humans cannot grasp the whole work of God from beginning to end. This passage invites humility, patience, and trust when timing is not in your hands.",
      observationQuestion: "What repeated pattern does the passage use to describe life's seasons?",
      reflectionQuestion: "What season do you need to receive with humility before God?",
      prayer: "Lord, teach me to trust Your timing when I cannot see the whole work You are doing.",
      gentleAction: "Name the season you are in and one faithful response for today.",
      studyMethod: "COMA"
    }),
    "Matthew 7:24-27": guidedDevotional({
      title: "Build on the rock",
      context: "Jesus closes the Sermon on the Mount by comparing two builders. Both hear His words, but only the wise builder does them. The storm reveals the foundation, so wisdom is not admiration of Jesus' teaching but obedient trust in Him.",
      body: "Wisdom is not merely admiring Jesus' teaching. The wise builder hears and does His words. Storms reveal foundations, so the question is not whether words sounded inspiring, but whether life is being built on obedience to Christ.",
      observationQuestion: "What is the difference between the wise and foolish builders?",
      reflectionQuestion: "What word of Jesus needs to move from hearing to obedience in your life?",
      prayer: "Lord Jesus, make me a hearer and doer of Your words.",
      gentleAction: "Choose one command of Jesus you can put into practice today.",
      studyMethod: "SOAP"
    }),
    "James 1:5-8": guidedDevotional({
      title: "Ask God for wisdom",
      context: "James writes to scattered believers facing trials and teaches that steadfastness grows under testing. When wisdom is lacking in that pressure, believers are invited to ask the generous God in faith rather than live from divided trust.",
      body: "Wisdom is needed not only for big decisions but for endurance. James points us to a God who gives generously without reproach. Asking for wisdom is an act of faith: we come to God as the source rather than wavering between dependence and self-rule.",
      observationQuestion: "What does James say God is like toward those who ask for wisdom?",
      reflectionQuestion: "Where do you need to ask God for wisdom instead of merely reacting?",
      prayer: "Generous God, give me wisdom and make my trust steady.",
      gentleAction: "Ask God for wisdom before responding to one pressure today.",
      studyMethod: "Inductive"
    }),
    "James 3:13-18": guidedDevotional({
      title: "Wisdom from above",
      context: "James 3 follows warnings about the tongue and then tests wisdom by its fruit. Earthly wisdom is marked by jealousy, selfish ambition, disorder, and falsehood, while wisdom from above is pure, peaceable, gentle, reasonable, merciful, fruitful, impartial, and sincere.",
      body: "Not all wisdom is from God. James exposes the difference by its fruit. Heavenly wisdom is pure, peaceable, gentle, open to reason, full of mercy and good fruit, impartial, and sincere. True wisdom can be recognized in the kind of life it produces.",
      observationQuestion: "What traits distinguish wisdom from above from earthly wisdom?",
      reflectionQuestion: "Which fruit of wisdom from above needs to grow in your relationships?",
      prayer: "Lord, make my wisdom peaceable, gentle, merciful, and sincere.",
      gentleAction: "Choose gentleness in one conversation where self-protection would be easier.",
      studyMethod: "OIA"
    }),
    "Colossians 3:12-17": guidedDevotional({
      title: "Wise community life",
      context: "Paul writes to a church whose life is now hidden with Christ and shaped by the new self. After calling them to put off old practices, he tells God's chosen, holy, beloved people to put on compassion, forgiveness, love, peace, and thankfulness. Wisdom here is communal Christian formation, not only private decision-making.",
      body: "Wisdom is not only private decision-making. It is seen in the way believers bear with one another, forgive, let peace rule, and let Christ's word dwell richly. A wise life is a word-shaped, thankful, love-clothed life among other people.",
      observationQuestion: "What practices does Paul call God's people to put on or let rule among them?",
      reflectionQuestion: "Where does wisdom need to shape your words or relationships today?",
      prayer: "Christ, let Your word dwell richly in me and make my life thankful and loving.",
      gentleAction: "Speak one word today that is shaped by gratitude, peace, or forgiveness.",
      studyMethod: "COMA"
    }),
    "2 Timothy 3:14-17": guidedDevotional({
      title: "Scripture equips",
      context: "Paul writes to Timothy near the end of his ministry, urging him to continue in what he has learned from the sacred Scriptures. Scripture is God-breathed and able to make him wise for salvation through faith in Christ and equipped for every good work.",
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
      context: "Romans opens with the gospel of God concerning His Son, promised beforehand and declared in power through the resurrection. Paul then begins to show why humanity needs that gospel: created people exchange God's truth for lies and worship created things rather than the Creator.",
      body: "Paul does not begin with a shallow problem. He shows that the human heart exchanges the truth of God for lies and worships created things rather than the Creator. The gospel is good news because it meets a real need: people need rescue, righteousness, and mercy before God.",
      observationQuestion: "What exchanges does Paul describe in this chapter?",
      reflectionQuestion: "Where does this chapter expose the danger of worshiping created things instead of the Creator?",
      prayer: "Creator God, turn my heart from false worship and make me ready to receive Your gospel.",
      gentleAction: "Name one created thing that can become too ultimate in your heart.",
      studyMethod: "OIA"
    }),
    "Romans 3": guidedDevotional({
      title: "Righteousness through faith",
      context: "Romans 3 gathers Paul's argument that both Jews and Gentiles are under sin and unable to boast before God. Into that honest diagnosis, Paul announces God's righteousness through faith in Jesus Christ, justification by grace, and redemption in Christ.",
      body: "Romans 3 brings honest diagnosis and glorious grace together. All have sinned and fall short of God's glory, yet God justifies by His grace through the redemption in Christ Jesus. The gospel does not minimize sin; it reveals God's righteous mercy in Christ.",
      observationQuestion: "What does Paul say about all people, and what does God provide through Christ?",
      reflectionQuestion: "How does grace become more precious when sin is named honestly?",
      prayer: "Lord Jesus, thank You for redemption and mercy that I could never earn.",
      gentleAction: "Write one sentence of confession and one sentence of thanks for grace.",
      studyMethod: "SOAP"
    }),
    "Romans 5": guidedDevotional({
      title: "Peace with God",
      context: "Romans 5 follows Paul's teaching that Abraham was justified by faith, then explains what justification brings: peace with God, access to grace, hope, and love poured out by the Spirit. Paul also contrasts Adam's trespass with Christ's greater gracious gift.",
      body: "The gospel gives more than a fresh start; it gives peace with God through Jesus Christ. God's love is shown in Christ dying for sinners, not for people who had already made themselves worthy. Grace is stronger than the ruin sin brought.",
      observationQuestion: "What blessings does Paul connect with being justified by faith?",
      reflectionQuestion: "Where do you need peace with God to steady your heart today?",
      prayer: "Father, let the love You showed in Christ give me peace, hope, and endurance.",
      gentleAction: "Read Romans 5:8 slowly and thank God that Christ died for sinners.",
      studyMethod: "Inductive"
    }),
    "Romans 6": guidedDevotional({
      title: "Alive to God",
      context: "Romans 6 answers the question of whether grace means continuing in sin. Paul points believers to union with Christ in His death and resurrection, showing that grace does not leave people enslaved but calls them to live as those alive to God.",
      body: "Grace does not leave believers enslaved to sin. Those united to Christ are to consider themselves dead to sin and alive to God. New life is not self-improvement with religious language; it is resurrection-shaped belonging to Christ.",
      observationQuestion: "What does Paul say has happened to believers in relation to Christ's death and life?",
      reflectionQuestion: "What old slavery needs to hear that you belong to Christ now?",
      prayer: "Lord Jesus, teach me to live as one who is alive to God in You.",
      gentleAction: "Offer one part of your body, speech, or attention to God today.",
      studyMethod: "COMA"
    }),
    "Romans 8": guidedDevotional({
      title: "Life in the Spirit",
      context: "Romans 8 follows Paul's description of the struggle with sin and opens with no condemnation for those in Christ. The chapter moves through life by the Spirit, adoption, suffering and hope, intercession, God's purpose, and inseparable love in Christ.",
      body: "The gospel brings assurance deep enough for real struggle. There is no condemnation in Christ, the Spirit bears witness that believers are God's children, and nothing can separate God's people from His love in Christ Jesus. Hope does not deny suffering; it holds suffering inside God's saving purpose.",
      observationQuestion: "What assurances does Paul give to those who are in Christ?",
      reflectionQuestion: "Which promise in Romans 8 most needs to answer fear, shame, or suffering today?",
      prayer: "Spirit of God, help me live as God's child and rest in Christ's unbreakable love.",
      gentleAction: "Choose one phrase from Romans 8 to carry as assurance today.",
      studyMethod: "Meditation"
    }),
    "Romans 10": guidedDevotional({
      title: "Call on the Lord",
      context: "Romans 10 sits within Paul's grief and hope for Israel and his contrast between pursuing righteousness by law and receiving righteousness by faith. The word is near: confess Jesus as Lord, believe God raised Him, and call on Him.",
      body: "The gospel is not hidden behind impossible achievement. Paul says the word is near: confess with your mouth that Jesus is Lord and believe in your heart that God raised Him from the dead. Salvation rests on Christ and is received by faith that calls on Him.",
      observationQuestion: "What does Paul say about confessing, believing, and calling on the Lord?",
      reflectionQuestion: "Where do you need to trust Jesus as Lord rather than lean on your own righteousness or control?",
      prayer: "Lord Jesus, I confess You as Lord and trust the life God gives through You.",
      gentleAction: "Pray a simple confession of trust in Jesus as Lord.",
      studyMethod: "Word study"
    }),
    "Romans 12": guidedDevotional({
      title: "A life of mercy",
      context: "Romans 12 turns from Paul's extended exposition of God's mercy in Christ to the shape of a transformed life. Believers offer themselves to God, resist conformity to the age, discern His will, and live out humble, practical love in the body of Christ.",
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
      context: "Proverbs opens by naming its purpose: wisdom, instruction, understanding, righteousness, justice, prudence, and discretion. The fear of the Lord is the beginning of knowledge, so wise decisions begin with reverence and teachability before God, not technique alone.",
      body: "Wise decisions do not begin with technique alone. They begin with reverence for the Lord, humility, and willingness to receive instruction. The fool refuses wisdom because pride will not listen, but the wise become teachable before God.",
      observationQuestion: "What does Proverbs say its wisdom is for?",
      reflectionQuestion: "Where do you need reverence and teachability before making a decision?",
      prayer: "Lord, give me reverence, humility, and a heart willing to receive correction.",
      gentleAction: "Before deciding, ask, 'What would honour the Lord here?'",
      studyMethod: "Word study"
    }),
    "Proverbs 2:1-11": guidedDevotional({
      title: "Search for wisdom",
      context: "Proverbs 2 addresses wisdom as both God's gift and a diligent pursuit. The learner is told to receive, treasure, call out, seek, and search, while remembering that the Lord gives wisdom and guards the path of those who walk uprightly.",
      body: "Decision-making wisdom is not passive. The Lord gives wisdom, and the wise receive, treasure, call out, seek, and search. This keeps us dependent and engaged: we ask God while also paying careful attention to His ways.",
      observationQuestion: "What actions does the passage call for, and what does the Lord promise to give?",
      reflectionQuestion: "What decision needs patient seeking rather than a rushed answer?",
      prayer: "Lord, help me seek wisdom as treasure and receive what comes from Your mouth.",
      gentleAction: "Write down the decision and one wise source of counsel or Scripture to consider.",
      studyMethod: "Inductive"
    }),
    "Proverbs 3:5-12": guidedDevotional({
      title: "Trust the Lord",
      context: "Proverbs 3 is parental wisdom instruction, not a formula for guaranteed outcomes. Trusting the Lord means relying on Him rather than leaning on unaided human understanding, while acknowledging Him in the whole path. The section also joins guidance with humility, honouring God, and fatherly correction.",
      body: "Trusting the Lord is not asking Him to bless a plan already ruled by self-reliance. Wisdom acknowledges Him in the way itself. Even correction is part of His fatherly love, shaping decisions that are less proud and more faithful.",
      observationQuestion: "What does this passage contrast with leaning on your own understanding?",
      reflectionQuestion: "Where are you tempted to trust your own understanding more than the Lord?",
      prayer: "Lord, help me trust You with all my heart and acknowledge You in my ways.",
      gentleAction: "Pause over one choice and consciously invite the Lord into the way, not just the outcome.",
      studyMethod: "SOAP"
    }),
    "Proverbs 16:1-9": guidedDevotional({
      title: "Commit your way",
      context: "Proverbs 16 gathers sayings about plans, motives, speech, justice, kingship, humility, and the Lord's sovereign direction. It neither forbids planning nor lets human plans become ultimate; wisdom commits work to the Lord while receiving His right to establish steps.",
      body: "Wisdom neither refuses planning nor pretends plans control everything. A person may make plans, weigh motives, and commit work to the Lord, but the Lord establishes steps. This gives freedom to plan humbly and walk dependently.",
      observationQuestion: "What does the passage say belongs to people, and what belongs to the Lord?",
      reflectionQuestion: "What plan needs to be committed to the Lord with humility?",
      prayer: "Lord, establish what is faithful and redirect what is proud or unwise.",
      gentleAction: "Write your plan in one sentence, then pray, 'Establish my steps as You see fit.'",
      studyMethod: "COMA"
    }),
    "James 1:5-8": guidedDevotional({
      title: "Ask God for wisdom",
      context: "James speaks to believers facing trials and teaches that testing can produce steadfastness. In that setting, wisdom is not abstract advice but faithful discernment under pressure, received from the generous God by a heart that trusts Him rather than wavering.",
      body: "Wisdom is needed when pressure makes reactions quick and trust thin. James points to God, who gives generously without reproach. Asking for wisdom is not weakness; it is faith turning toward the One who knows the faithful path.",
      observationQuestion: "What does James say God is like toward those who ask?",
      reflectionQuestion: "Where do you need to ask before reacting?",
      prayer: "Generous God, give me wisdom and make my trust steady before You.",
      gentleAction: "Before responding to one pressure today, ask God for wisdom in a single sentence.",
      studyMethod: "OIA"
    }),
    "Colossians 3:12-17": guidedDevotional({
      title: "Wisdom in community",
      context: "Paul writes to a church whose life is now hidden with Christ and shaped by the new self. After calling them to put off old practices, he tells God's chosen, holy, beloved people to put on compassion, forgiveness, love, peace, and thankfulness. The decision-making wisdom here is relational and communal.",
      body: "Many decisions are not made in isolation. Christ's peace, word, and love shape how believers choose together and relate to one another. Wisdom listens for what grows gratitude, forgiveness, truth, and love rather than what merely protects preference.",
      observationQuestion: "What practices does Paul describe for God's people together?",
      reflectionQuestion: "How should love, peace, or gratitude shape the decision before you?",
      prayer: "Christ, let Your peace rule and Your word dwell richly in my choices.",
      gentleAction: "Ask how your decision will affect one other person and what love requires.",
      studyMethod: "SOAP"
    }),
    "Psalm 25:4-10": guidedDevotional({
      title: "Teach me Your paths",
      context: "Psalm 25 is a Davidic prayer that joins guidance with trust, confession, mercy, covenant love, and humility. David asks the Lord to make His ways known and lead him in truth, showing that biblical guidance is relational formation, not merely getting an answer.",
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
      context: "Psalm 1 opens the Psalter by contrasting the way of the righteous with the way of the wicked. The blessed person delights in the Lord's instruction and is pictured as a fruitful tree, while the wicked are unstable like chaff.",
      body: "The blessed life is pictured as a tree planted by streams of water. This is not hurried spirituality; it is a life nourished by delighting in the Lord's instruction. The Psalm asks where your roots are going down and what counsel is shaping your path.",
      observationQuestion: "What does the blessed person avoid, and what do they delight in?",
      reflectionQuestion: "What is currently shaping your path more than God's word?",
      prayer: "Lord, root me deeply in Your word and make my life fruitful in Your time.",
      gentleAction: "Choose one phrase from Psalm 1 to carry through the day.",
      studyMethod: "Meditation"
    }),
    "Psalm 8": guidedDevotional({
      title: "Majesty and smallness",
      context: "Psalm 8 is a hymn of praise that begins and ends with the Lord's majestic name in all the earth. It holds together the vastness of creation, the surprising dignity given to humans, and the wonder that the Creator remembers and cares for them.",
      body: "This Psalm holds together two truths: God is majestic above the heavens, and He gives dignity to small human creatures. Worship grows when you see both His greatness and His kindness. Your worth is not self-made; it is received from the Creator who remembers and cares.",
      observationQuestion: "What does David notice about God, creation, and humanity?",
      reflectionQuestion: "Where do you need to receive both humility and dignity before God?",
      prayer: "Majestic Lord, teach me to worship You with humility and receive my life as Your gift.",
      gentleAction: "Look at one created thing today and turn it into praise.",
      studyMethod: "OIA"
    }),
    "Psalm 19": guidedDevotional({
      title: "Creation and the word",
      context: "Psalm 19 moves from the heavens declaring God's glory without speech to the Lord's word reviving, making wise, rejoicing, warning, and searching the servant's heart. Creation and Scripture both lead the worshiper toward reverent response.",
      body: "God speaks through what He has made and through what He has revealed. Creation declares His glory, and Scripture searches and restores the heart. The Psalm ends personally: the worshiper asks that words and thoughts would be pleasing to the Lord.",
      observationQuestion: "What does creation declare, and what does the Lord's word do?",
      reflectionQuestion: "Where do your words or thoughts need the Lord's searching and restoring work?",
      prayer: "Lord, let the words of my mouth and the meditation of my heart be pleasing to You.",
      gentleAction: "Pause before one conversation and ask God to shape your words.",
      studyMethod: "SOAP"
    }),
    "Psalm 23": guidedDevotional({
      title: "The Shepherd's care",
      context: "Psalm 23 is David's confession of the Lord as Shepherd across rest, restoration, guidance, danger, provision, mercy, and dwelling with God. Its comfort is not that valleys disappear, but that the Shepherd remains present and faithful.",
      body: "Psalm 23 gives trust a voice. The Lord's care is not abstract; He leads, restores, comforts, provides, and keeps His people near. Even the valley is not outside His presence. The Shepherd remains faithful from green pastures to the house of the Lord.",
      observationQuestion: "What actions does the Shepherd take throughout the Psalm?",
      reflectionQuestion: "Which part of the Shepherd's care do you most need today?",
      prayer: "Lord, my Shepherd, lead me, restore me, and keep me near You.",
      gentleAction: "Pray one line of Psalm 23 slowly during a pause today.",
      studyMethod: "Lectio Divina"
    }),
    "Psalm 27": guidedDevotional({
      title: "Seek His face",
      context: "Psalm 27 moves between confidence, enemies, trouble, desire, and prayer. David names fear but centers his longing on the Lord Himself: to dwell with Him, behold His beauty, seek His face, and wait with courage.",
      body: "Psalm 27 answers fear first with who the Lord is: light, salvation, and stronghold. David's desire to behold the Lord is not escape from trouble; it is the deepest safety he knows. Courage grows as the heart learns to seek God's face.",
      observationQuestion: "What does David fear, and what does he desire most?",
      reflectionQuestion: "What would it mean to seek the Lord as your 'one thing' today?",
      prayer: "Lord, when You say, 'Seek My face,' help my heart answer, 'Your face I will seek.'",
      gentleAction: "Turn one anxious pause into a short prayer of seeking.",
      studyMethod: "COMA"
    }),
    "Psalm 42": guidedDevotional({
      title: "Speak hope to your soul",
      context: "Psalm 42 gives words to spiritual thirst, tears, memory, and inner turmoil. Rather than shaming a downcast soul, the psalmist speaks honestly to it and calls it to hope in God while waiting for praise to return.",
      body: "The Psalmist does not shame a downcast soul. He speaks to it with honesty and hope. Faith may include tears, longing, and questions, but it also learns to remember God and wait for praise to return.",
      observationQuestion: "What signs of distress appear, and what does the Psalmist say to his soul?",
      reflectionQuestion: "Where does your own soul need hope in God to speak louder than discouragement today?",
      prayer: "Lord, meet me in longing and teach my soul to hope in You.",
      gentleAction: "Speak one gentle truth from this Psalm to yourself.",
      studyMethod: "Meditation"
    }),
    "Psalm 46": guidedDevotional({
      title: "Be still before the God who reigns",
      context: "Psalm 46 is a Korahite Song of Zion. It names trouble, shaking creation, and raging nations, but repeats that the Lord of hosts is with His people. The call to be still is a summons to cease striving before God's rule, not merely a private relaxation technique.",
      body: "The command to be still is not denial or passivity. It is a summons to stop striving as if everything rests on you and to know that the Lord is exalted. Prayer can become worship when pressure is brought before the God who reigns.",
      observationQuestion: "What trouble is named, and what is repeated about God?",
      reflectionQuestion: "Where are you carrying pressure as though God is absent or unable to help?",
      prayer: "Lord Almighty, quiet my striving and help me know that You are present, faithful, and exalted.",
      gentleAction: "Sit quietly for one minute and repeat, 'The Lord is with us.'",
      studyMethod: "COMA"
    }),
    "Psalm 51": guidedDevotional({
      title: "Mercy for a contrite heart",
      context: "Psalm 51 is David's prayer of confession after grievous sin, traditionally connected to Nathan confronting him. David appeals to God's steadfast mercy, asks for cleansing and a clean heart, and seeks restored joy and truthful worship.",
      body: "This Psalm does not excuse sin, but it does teach sinners where to go. David appeals to God's mercy and asks for a clean heart. Repentance is not self-punishment; it is honest return to the God who can cleanse, renew, and restore.",
      observationQuestion: "What does David confess, and what does he ask God to create or restore?",
      reflectionQuestion: "Where do you need to bring honest confession rather than hiding?",
      prayer: "Merciful God, create in me a clean heart and renew a steadfast spirit within me.",
      gentleAction: "Pray one honest sentence of confession and one request for renewal.",
      studyMethod: "SOAP"
    }),
    "Psalm 91": guidedDevotional({
      title: "Dwelling in refuge",
      context: "Psalm 91 speaks in poetic, wisdom-like confidence about the safety of those who dwell under the Most High's shelter. Its refuge language invites trust and nearness to God without denying that faithful people may still suffer. The psalm should not be used as a formula for a trouble-free life.",
      body: "The Psalm's safety language invites nearness and trust in the Lord. It is not a tool for demanding a trouble-free life; it is a call to dwell with God as refuge. The safest place is belonging to Him.",
      observationQuestion: "What refuge images does the Psalm use for God's care?",
      reflectionQuestion: "Where are you tempted to seek shelter somewhere other than the Lord?",
      prayer: "Most High God, teach me to dwell near You and trust Your faithful care.",
      gentleAction: "Name one false refuge, then ask God to draw you back to Himself.",
      studyMethod: "OIA"
    }),
    "Psalm 103": guidedDevotional({
      title: "Bless the Lord",
      context: "Psalm 103 calls the soul to bless the Lord and not forget His benefits. It gathers mercy, forgiveness, healing, compassion, fatherly tenderness, human frailty, covenant love, and worship into one remembering response before God.",
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
      context: "Proverbs opens by naming its purpose: wisdom, instruction, understanding, righteousness, justice, prudence, and discretion. It places the fear of the Lord at the beginning of knowledge, so wisdom begins with reverent teachability before God.",
      body: "Wisdom begins with reverence. Proverbs is not merely advice for getting ahead; it teaches a teachable life before God. The wise listen and receive correction because they know the Lord is the source of knowledge.",
      observationQuestion: "What purposes does Proverbs give for its instruction?",
      reflectionQuestion: "Where do you need to become more teachable before the Lord?",
      prayer: "Lord, give me reverence, humility, and a heart willing to receive wisdom.",
      gentleAction: "Ask one honest question today before defending your first instinct.",
      studyMethod: "Word study"
    }),
    "Proverbs 2": guidedDevotional({
      title: "Search for wisdom",
      context: "Proverbs 2 presents wisdom as both God's gift and a treasure to pursue. The learner receives, treasures, calls out, seeks, and searches, while the Lord gives wisdom, guards the upright, and preserves the way of His faithful people.",
      body: "Wisdom is both gift and pursuit. The Lord gives wisdom, yet the wise receive, treasure, call out, seek, and search. This protects from passivity and pride: you depend on God while actively seeking what He gives.",
      observationQuestion: "What actions are used to describe seeking wisdom?",
      reflectionQuestion: "What area of life needs a more deliberate search for wisdom?",
      prayer: "Lord, help me seek wisdom as treasure and receive what comes from Your mouth.",
      gentleAction: "Write one question where you need wisdom and bring it to God.",
      studyMethod: "Inductive"
    }),
    "Proverbs 3": guidedDevotional({
      title: "Trust the Lord",
      context: "Proverbs 3 is parental wisdom instruction, not a formula for guaranteed outcomes. Trusting the Lord means relying on Him rather than leaning on unaided human understanding, while acknowledging Him in the whole path. The chapter also joins guidance with humility, generosity, and fatherly correction.",
      body: "Wisdom does not lean on self-reliance while asking God to bless the result. It trusts the Lord with all the heart and acknowledges Him in the way itself. Even correction is part of His fatherly love.",
      observationQuestion: "What does this chapter say about trust, understanding, and correction?",
      reflectionQuestion: "Where are you leaning on your own understanding?",
      prayer: "Lord, help me trust You with all my heart and acknowledge You in my ways.",
      gentleAction: "Pause before one choice and consciously acknowledge the Lord.",
      studyMethod: "SOAP"
    }),
    "Proverbs 4": guidedDevotional({
      title: "Guard your heart",
      context: "Proverbs 4 continues parental wisdom instruction and urges careful attention to words that bring life. The heart must be guarded because it directs speech, sight, steps, and paths; wisdom forms the whole person, not only outward choices.",
      body: "Wisdom pays attention to the inner life. The heart is not ignored as long as outward behavior looks fine; it must be guarded because life flows from it. Words, eyes, paths, and feet all matter because the whole person is being directed.",
      observationQuestion: "What parts of life does this chapter tell the listener to guard or direct?",
      reflectionQuestion: "What is shaping your heart more than you realize?",
      prayer: "Lord, guard my heart and straighten the path of my words, attention, and choices.",
      gentleAction: "Remove or limit one influence today that bends your heart away from wisdom.",
      studyMethod: "OIA"
    }),
    "Proverbs 8": guidedDevotional({
      title: "Wisdom's worth",
      context: "In Proverbs 8, Wisdom is personified as calling publicly and inviting people to value instruction, truth, prudence, righteousness, and counsel. The chapter teaches that wisdom is better than riches because it aligns desire with what is true and right.",
      body: "Wisdom is valuable because it aligns life with what is true and right before God. Proverbs 8 teaches us to prize wisdom above things we often chase first. Better treasure leads to better decisions.",
      observationQuestion: "What does wisdom say is better than silver, gold, and jewels?",
      reflectionQuestion: "What lesser treasure is competing with wisdom in your choices?",
      prayer: "Lord, make wisdom more precious to me than comfort, approval, or gain.",
      gentleAction: "Before one choice today, ask what wisdom would value most.",
      studyMethod: "Word study"
    }),
    "Proverbs 10": guidedDevotional({
      title: "Daily wisdom in contrast",
      context: "Proverbs 10 begins a major collection of short sayings that often contrast wisdom and folly, righteousness and wickedness, diligence and laziness, truthful speech and harmful words. Wisdom is shown in ordinary repeated choices.",
      body: "This chapter shows wisdom in ordinary life: words, work, honesty, discipline, wealth, fear, and hope. Wisdom is not abstract. It appears in repeated small choices that either build life or scatter it.",
      observationQuestion: "Which contrasts appear repeatedly in this chapter?",
      reflectionQuestion: "Which ordinary area of life needs wisdom most today: words, work, money, or discipline?",
      prayer: "Lord, make me faithful in the small choices where wisdom becomes visible.",
      gentleAction: "Choose one proverb from the chapter and apply it to a concrete action today.",
      studyMethod: "OIA"
    }),
    "Proverbs 11": guidedDevotional({
      title: "Integrity and generosity",
      context: "Proverbs 11 highlights honest scales, humility, righteousness, speech, generosity, and the fruit of wise living. It shows that wisdom is not merely private insight; it is integrity and open-handed faithfulness before the Lord and neighbor.",
      body: "Wisdom cares about integrity when no one is watching and generosity when self-protection feels safer. The Lord delights in honesty, and the generous life bears fruit beyond itself. Wisdom is both upright and open-handed.",
      observationQuestion: "What does this chapter say about honesty, humility, and generosity?",
      reflectionQuestion: "Where does integrity or generosity need to shape your next step?",
      prayer: "Lord, make me honest, humble, and generous before You.",
      gentleAction: "Practice one quiet act of honesty or generosity today.",
      studyMethod: "SOAP"
    }),
    "Proverbs 12": guidedDevotional({
      title: "Words that heal",
      context: "Proverbs 12 gives many sayings about speech, diligence, truth, anxiety, correction, and the way of righteousness. The chapter treats words as morally weighty: rash speech can wound, but wise speech can bring healing.",
      body: "Wisdom is heard in speech. Rash words can pierce, but wise words bring healing. This chapter does not treat words as harmless; it calls for truth, care, diligence, and speech that serves life.",
      observationQuestion: "What kinds of speech are contrasted in this chapter?",
      reflectionQuestion: "Where could your words bring healing rather than harm today?",
      prayer: "Lord, make my words truthful, careful, and life-giving.",
      gentleAction: "Before one reply, pause and ask whether your words will heal or pierce.",
      studyMethod: "Word study"
    }),
    "Proverbs 15": guidedDevotional({
      title: "A gentle answer",
      context: "Proverbs 15 speaks often about speech, correction, prayer, humility, joy, and the Lord's sight. It contrasts gentle and harsh words while also reminding readers that wisdom includes receiving correction and living openly before God.",
      body: "Wisdom is not only what is said, but how it is said. A gentle answer can turn away wrath, while harsh words stir it up. The chapter also reminds us that the Lord sees deeply and receives the prayer of the upright.",
      observationQuestion: "What does this chapter teach about gentle and harsh speech?",
      reflectionQuestion: "Where would a gentle answer be wiser than winning an argument?",
      prayer: "Lord, give me humility to receive correction and gentleness in my speech.",
      gentleAction: "Use a gentler tone than your first impulse in one conversation today.",
      studyMethod: "COMA"
    }),
    "Proverbs 16": guidedDevotional({
      title: "Plans under the Lord",
      context: "Proverbs 16 gathers sayings about plans, motives, speech, justice, kingship, humility, and the Lord's sovereign direction. It neither forbids planning nor lets human plans become ultimate; the Lord weighs and establishes steps.",
      body: "Wisdom neither refuses planning nor pretends plans control everything. A person may make plans, weigh motives, and commit work to the Lord, but the Lord establishes steps. This gives freedom to plan humbly and walk dependently.",
      observationQuestion: "What belongs to human planning, and what belongs to the Lord?",
      reflectionQuestion: "What plan needs to be committed to the Lord with humility?",
      prayer: "Lord, establish what is faithful and redirect what is proud or unwise.",
      gentleAction: "Write one plan and pray, 'Establish my steps as You see fit.'",
      studyMethod: "SOAP"
    }),
    "Proverbs 18": guidedDevotional({
      title: "Listening before answering",
      context: "Proverbs 18 includes sayings about isolation, speech, listening, conflict, partiality, friendship, and the name of the Lord as a strong tower. It warns against answering before listening and treating words as harmless.",
      body: "Wisdom listens before answering. The chapter warns against words that damage and opinions formed too quickly. It also gives refuge: the name of the Lord is a strong tower for the righteous.",
      observationQuestion: "What does this chapter say about listening, answering, and words?",
      reflectionQuestion: "Where do you need to listen before answering?",
      prayer: "Lord, slow my speech, deepen my listening, and make Your name my refuge.",
      gentleAction: "Ask one clarifying question before offering your opinion today.",
      studyMethod: "OIA"
    }),
    "Proverbs 22": guidedDevotional({
      title: "A good name and a generous heart",
      context: "Proverbs 22 speaks about reputation, humility, wealth, training, justice, generosity, diligence, and guarding against oppression. It reminds readers that wisdom values character and reverence for the Lord above gain or advantage.",
      body: "Wisdom values character over image and justice over advantage. A good name is better than great riches, and humility before the Lord shapes how power, money, and opportunity are handled. The wise life notices the vulnerable.",
      observationQuestion: "What values does this chapter lift above wealth or advantage?",
      reflectionQuestion: "Where should character, justice, or generosity matter more than gain?",
      prayer: "Lord, form my character and make me attentive to people who are easily overlooked.",
      gentleAction: "Choose one generous or just action that costs you some convenience.",
      studyMethod: "COMA"
    }),
    "Proverbs 27": guidedDevotional({
      title: "Faithful friendship and humility",
      context: "Proverbs 27 includes sayings about tomorrow, praise, friendship, counsel, humility, and careful attention to responsibilities. It reminds readers not to presume on the future and to receive faithful correction and wise friendship.",
      body: "Wisdom is humble about tomorrow and honest about relationships. Faithful wounds from a friend may serve love better than flattery, and wise counsel can sharpen a life. This chapter invites humility, teachability, and faithful attention to what has been entrusted.",
      observationQuestion: "What does this chapter say about friends, counsel, and tomorrow?",
      reflectionQuestion: "Where do you need faithful counsel or humility about tomorrow?",
      prayer: "Lord, make me humble, teachable, and faithful with today's responsibilities.",
      gentleAction: "Thank one faithful friend or ask for honest counsel where you need it.",
      studyMethod: "Inductive"
    }),
    "Proverbs 31": guidedDevotional({
      title: "Wisdom embodied",
      context: "Proverbs 31 includes royal counsel and an acrostic portrait of wisdom embodied in faithful, capable, generous household leadership. The passage praises strength, diligence, generosity, wise speech, and fear of the Lord rather than charm or appearance.",
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
      context: "Psalm 4 is a Davidic evening prayer spoken under pressure, where public anxiety asks who will show any good. David's confidence rests in the Lord hearing, lifting the light of His face, giving deeper joy than abundance, and making His servant dwell in safety.",
      body: "Psalm 4 does not promise that every outward pressure has disappeared by bedtime. It shows a heart learning to rest because the Lord Himself gives safety. Peace here is not denial; it is trust that can lie down under God's care even before every circumstance changes.",
      observationQuestion: "What does David ask from the Lord, and what allows him to lie down in peace?",
      reflectionQuestion: "What concern is keeping your heart awake before God?",
      prayer: "Lord, lift the light of Your face on me and teach me to rest in Your safety.",
      gentleAction: "Before sleep or a quiet pause, name one concern and entrust it to the Lord.",
      studyMethod: "Meditation"
    }),
    "Psalm 23:1-4": guidedDevotional({
      title: "Peace with the Shepherd",
      context: "Psalm 23 is a Davidic psalm using shepherd imagery for the Lord's provision, guidance, and protection. The opening verses include green pastures and the valley of deep darkness, so the peace described is not fragile comfort in easy places only. It rests on the Shepherd who remains with His sheep.",
      body: "The green pastures and quiet waters come from the Shepherd's presence and leading. Even the valley is not faced alone. Peace is not the absence of shadows; it is the nearness of the Lord who restores and guides His people.",
      observationQuestion: "What does the Shepherd do for His sheep in these verses?",
      reflectionQuestion: "Where do you need to follow the Shepherd into peace rather than force peace for yourself?",
      prayer: "Lord, restore my soul and lead me in the path of Your care.",
      gentleAction: "Pray slowly through one phrase from Psalm 23 and let it answer one anxious thought.",
      studyMethod: "SOAP"
    }),
    "Isaiah 26:3-4": guidedDevotional({
      title: "Perfect peace",
      context: "Isaiah 26 is a song of trust within Isaiah's vision of judgment and restoration. The peace described belongs to the righteous people who trust the Lord while waiting for His vindication. It is not first a private calm technique, but a confession that lasting security rests in the everlasting Rock.",
      body: "Perfect peace is tied to a mind stayed on God because it trusts Him. The foundation is not a technique, mood, or personality type; it is the Lord Himself. Peace grows as attention and trust are re-centered on Him.",
      observationQuestion: "What connection does Isaiah make between mind, trust, peace, and the Lord?",
      reflectionQuestion: "What thought needs to be stayed on God rather than carried alone?",
      prayer: "Lord, keep my mind fixed on You and teach me to trust You as my Rock.",
      gentleAction: "When your mind circles today, repeat, 'The Lord is my everlasting Rock.'",
      studyMethod: "Word study"
    }),
    "Matthew 6:25-34": guidedDevotional({
      title: "The Father knows",
      context: "These words are part of the Sermon on the Mount and follow Jesus' warning that no one can serve both God and money. Jesus speaks to disciples tempted to be consumed by food, clothing, and tomorrow's needs. He calls them to seek the Father's kingdom first while facing each day's real trouble.",
      body: "Jesus does not mock human need. He names food, drink, clothing, and tomorrow, then brings them under the Father's knowledge and care. Birds and lilies become witnesses that life is not secured by anxious striving. The call is to seek first God's kingdom and receive today's grace for today's trouble.",
      observationQuestion: "What examples does Jesus use to show the Father's care?",
      reflectionQuestion: "What need does your Father already know before you can solve it?",
      prayer: "Father, help me seek Your kingdom today and trust Your care for what I need.",
      gentleAction: "Write one worry for tomorrow, then ask God for faithfulness for today.",
      studyMethod: "COMA"
    }),
    "John 14:25-27": guidedDevotional({
      title: "Peace Jesus gives",
      context: "Jesus speaks these words in the Farewell Discourse before the cross. The disciples are troubled by His departure, and He promises the Spirit will teach them and remind them of His words. His peace is not worldly ease, but His own gift to troubled disciples.",
      body: "Jesus gives peace to disciples who are about to face confusion and loss. His peace is tied to His word and the Spirit's help. It is not dependent on outward calm; it rests on the presence and promise of Christ.",
      observationQuestion: "What does Jesus promise, and how is His peace different from the world's peace?",
      reflectionQuestion: "What trouble needs to be brought beneath Jesus' words, 'My peace I give to you'?",
      prayer: "Jesus, give me Your peace and keep my heart from fear.",
      gentleAction: "Pause once today and ask the Holy Spirit to remind you of Jesus' words.",
      studyMethod: "OIA"
    }),
    "Philippians 4:4-9": guidedDevotional({
      title: "Peace that guards",
      context: "Paul writes from prison to a beloved church and has just urged Euodia and Syntyche toward unity. These commands are given to the community: rejoice in the Lord, show gentleness, pray with thanksgiving, think on what is true, and practice what they received. The peace of God guards believers in Christ as they live this shared pattern.",
      body: "God's peace guards the heart and mind in Christ, and the God of peace is with His people as they walk in what they have received. Peace is not detached from prayer or practice; it is received as worries are brought to God and minds are trained toward what is true and worthy.",
      observationQuestion: "What commands does Paul give before and after describing God's peace?",
      reflectionQuestion: "What request, thought, or practice needs to be brought under God's peace today?",
      prayer: "God of peace, guard me and guide me in what is true and pleasing to You.",
      gentleAction: "Bring one request to God with thanksgiving, then choose one true thing to dwell on.",
      studyMethod: "SOAP"
    }),
    "Colossians 3:12-17": guidedDevotional({
      title: "Peace ruling together",
      context: "Paul writes to a church whose life is now hidden with Christ and shaped by the new self. After calling them to put off old practices, he tells God's chosen, holy, beloved people to put on compassion, forgiveness, love, peace, and thankfulness. The passage is communal Christian formation, not merely private mood management.",
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
      context: "Psalm 13 is a short lament where David brings repeated 'How long?' questions before the Lord. The movement from complaint to trust is not emotional pretending; it shows covenant faith speaking pain to the God whose steadfast love remains.",
      body: "Psalm 13 gives grief honest words. David does not rush past sorrow, yet he turns toward God's steadfast love. Biblical lament brings pain into relationship with God and waits for His salvation without pretending the ache is small.",
      observationQuestion: "What questions does David ask, and where does the Psalm turn?",
      reflectionQuestion: "What honest sorrow can you bring to God without pretending it is small?",
      prayer: "Lord, receive my lament and help me trust Your steadfast love.",
      gentleAction: "Write one honest 'How long?' prayer to God.",
      studyMethod: "SOAP",
      careNote: griefPastoralCareNote
    }),
    "Psalm 23:1-6": guidedDevotional({
      title: "Comfort from the Shepherd",
      context: "Psalm 23 traces the Shepherd's care through rest, restoration, guidance, danger, provision, mercy, and home. Comfort comes because the Lord is personally present in the valley and faithful to lead His people all the way to His dwelling.",
      body: "Psalm 23 comforts by showing the Lord's personal care in every part of the way. Even in the valley, the Shepherd is present. Grief is not walked alone; goodness and mercy still follow because the Shepherd remains faithful.",
      observationQuestion: "What does the Shepherd provide across the whole Psalm?",
      reflectionQuestion: "Where do you need the Shepherd's presence in grief today?",
      prayer: "Lord, restore my soul and walk with me through every valley.",
      gentleAction: "Read one line of Psalm 23 aloud as a prayer for today's grief.",
      studyMethod: "Meditation",
      careNote: griefPastoralCareNote
    }),
    "Psalm 34:17-22": guidedDevotional({
      title: "Near the brokenhearted",
      context: "Psalm 34 names affliction, brokenheartedness, and the Lord's nearness and rescue. The Psalm does not promise the righteous a trouble-free life; it promises that the Lord hears, stays near, and redeems His servants.",
      body: "Psalm 34 does not say the righteous avoid affliction. It says the Lord hears, is near to the brokenhearted, and saves the crushed in spirit. Comfort begins with God's nearness to real pain, not with pressure to be fine.",
      observationQuestion: "What does the Lord do for the brokenhearted and crushed in spirit?",
      reflectionQuestion: "Where do you need to believe that the Lord is near, not distant?",
      prayer: "Lord, be near to me in brokenness and save me with Your mercy.",
      gentleAction: "Place your hand over your heart and pray, 'Lord, be near here.'",
      studyMethod: "OIA",
      careNote: griefPastoralCareNote
    }),
    "Psalm 42:5-11": guidedDevotional({
      title: "Hope in God",
      context: "Psalm 42 speaks to a downcast soul while remembering God and longing for renewed praise. The repeated question to the soul models faith that talks back to despair with hope while still naming turmoil honestly.",
      body: "The Psalmist speaks to a downcast soul rather than shaming it. He remembers God, names turmoil, and calls the soul to hope again. Grief may keep speaking, but faith also learns to speak back with patience and hope.",
      observationQuestion: "What does the Psalmist say to his own soul?",
      reflectionQuestion: "Where does your downcast soul need hope in God to speak louder than turmoil today?",
      prayer: "Lord, help me hope in You while my soul is still unsettled.",
      gentleAction: "Speak one gentle truth from this Psalm to your own soul.",
      studyMethod: "Meditation",
      careNote: griefPastoralCareNote
    }),
    "Psalm 46:1-7": guidedDevotional({
      title: "God is refuge",
      context: "Psalm 46 names trouble, fear, shaking, and nations in uproar, yet confesses God as refuge and present help. Its comfort rests on the Lord of hosts being with His people when creation and nations feel unstable, not on pretending the shaking is imaginary.",
      body: "This Psalm does not pretend the world is quiet. Its comfort is that God is refuge, strength, and present help in trouble. Grief can feel like the earth giving way, but the Lord of hosts remains with His people.",
      observationQuestion: "What instability is described, and what is confessed about God?",
      reflectionQuestion: "What trouble feels loud today, and what does this Psalm say is truer than that trouble?",
      prayer: "God, be my refuge and strength today. Teach me to trust Your presence more than the noise around me.",
      gentleAction: "Repeat, 'God is our refuge and strength,' slowly three times.",
      studyMethod: "COMA",
      careNote: griefPastoralCareNote
    }),
    "Psalm 73:23-28": guidedDevotional({
      title: "God is my portion",
      context: "Psalm 73 moves from confusion and envy into renewed nearness to God. After entering God's sanctuary, the Psalmist sees that God's presence is better than the prosperity he envied and stronger than failing flesh and heart.",
      body: "The Psalmist discovers that even when heart and flesh fail, God is the strength of the heart and portion forever. Comfort rests in having God Himself, not in having every question resolved. Nearness to God becomes the good that grief cannot finally take away.",
      observationQuestion: "What does the Psalmist say about God when heart and flesh fail?",
      reflectionQuestion: "What loss or confusion needs the promise that God is your portion?",
      prayer: "Lord, hold me by Your hand and be the strength of my heart.",
      gentleAction: "Name one question you cannot resolve and one truth about God you can hold.",
      studyMethod: "Inductive",
      careNote: griefPastoralCareNote
    }),
    "Isaiah 40:27-31": guidedDevotional({
      title: "Strength renewed",
      context: "Isaiah speaks to weary people who wonder if their way is hidden from the Lord. The answer is God's everlasting strength and attentive care: He does not grow faint, and those who wait for Him receive renewed strength.",
      body: "God does not grow faint, and He gives power to the weary. Waiting on Him is not empty delay; it is dependence on the everlasting God. The weary are not scolded for needing strength; they are invited to receive it from Him.",
      observationQuestion: "What does Isaiah say about God's strength and the weary?",
      reflectionQuestion: "Where are you weary enough to need strength that only God can give?",
      prayer: "Everlasting God, renew my strength as I wait for You.",
      gentleAction: "Take one slow breath and ask God for strength for the next faithful step.",
      studyMethod: "SOAP",
      careNote: griefPastoralCareNote
    }),
    "Isaiah 43:1-7": guidedDevotional({
      title: "Called by name",
      context: "The Lord comforts His people with redemption, belonging, and promised presence through waters and fire. The passage names danger but anchors courage in God's claim, 'You are Mine,' and His promise to be with His redeemed people.",
      body: "Isaiah 43 comforts with belonging: 'I have called you by name; you are Mine.' Waters and fire are named, but God's presence is promised through them. The Lord's redeeming love is stronger than the threatening flood.",
      observationQuestion: "What does God say about belonging, waters, fire, and His presence?",
      reflectionQuestion: "What water or fire do you need to face with the words, 'You are Mine'?",
      prayer: "Redeeming Lord, help me trust Your presence and love in the deep waters.",
      gentleAction: "Write your name beside the phrase, 'You are Mine,' as a reminder of belonging.",
      studyMethod: "OIA",
      careNote: griefPastoralCareNote
    }),
    "Lamentations 3:19-26": guidedDevotional({
      title: "Mercies each morning",
      context: "Lamentations remembers affliction and bitterness, then turns toward God's steadfast love, mercy, and faithfulness. Hope rises inside remembered suffering because the Lord's mercies are new every morning and His compassion is not exhausted.",
      body: "Hope appears in the middle of remembered pain, not after it is erased. The turning point is God's steadfast love, mercy, and faithfulness. Waiting quietly for the Lord is possible because His compassion is not exhausted.",
      observationQuestion: "What painful memories are named, and what truths does the writer call to mind?",
      reflectionQuestion: "What sorrow needs to be held together with the truth that His mercies are new?",
      prayer: "Faithful God, meet me with mercy today and teach me to wait for You.",
      gentleAction: "At the start of the day, name one mercy however small.",
      studyMethod: "Meditation",
      careNote: griefPastoralCareNote
    }),
    "Matthew 5:1-12": guidedDevotional({
      title: "Blessed are those who mourn",
      context: "Jesus opens the Sermon on the Mount by announcing kingdom blessing to the poor in spirit, mourners, the meek, and others. Mourners are blessed not because sorrow is pleasant, but because the kingdom promises God's comfort to those who come to Him empty-handed.",
      body: "Jesus does not call mourners blessed because grief feels good, but because the kingdom of heaven belongs to those who receive God's comfort. Mourning is not outside His blessing. In Christ, sorrow is seen by God and held in hope.",
      observationQuestion: "Who does Jesus call blessed, and what promises are attached?",
      reflectionQuestion: "Where do you need Jesus' promise of comfort for mourners?",
      prayer: "Lord Jesus, meet my mourning with the comfort of Your kingdom.",
      gentleAction: "Let the words 'they will be comforted' become a short prayer today.",
      studyMethod: "COMA",
      careNote: griefPastoralCareNote
    }),
    "John 11:32-44": guidedDevotional({
      title: "Jesus wept",
      context: "At Lazarus' tomb, Jesus meets grief with tears, prayer, authority, and resurrection power. The scene refuses to separate compassion from power: Jesus truly weeps with mourners and truly commands death to release Lazarus.",
      body: "Jesus reveals both compassion and authority. He weeps with those who weep, and He calls the dead man out. Christian comfort does not choose between tears and resurrection hope; Jesus brings both together.",
      observationQuestion: "How does Jesus respond emotionally and actively at the tomb?",
      reflectionQuestion: "What grief needs the compassion of Jesus and the hope of His resurrection power?",
      prayer: "Lord Jesus, meet me in grief, strengthen my hope, and keep me near the resurrection life that is in You.",
      gentleAction: "Tell Jesus plainly what makes you weep, trusting that He is not unmoved.",
      studyMethod: "OIA",
      careNote: griefPastoralCareNote
    }),
    "Romans 8:18-25": guidedDevotional({
      title: "Future glory",
      context: "Paul places present suffering within the larger hope of creation's renewal and the redemption to come. Creation and believers groan together, yet hope waits because the future glory promised by God outweighs present suffering without minimizing it.",
      body: "Creation groans, believers groan, and yet hope waits for redemption. Comfort does not deny pain; it gives pain a horizon because God will complete His work. Christian hope is patient because future glory is not fragile.",
      observationQuestion: "What groaning and what hope does Paul describe?",
      reflectionQuestion: "What present suffering needs to be held in the hope of future glory?",
      prayer: "Lord, help me wait with hope for the redemption You have promised.",
      gentleAction: "Name one present groan and one future hope from this passage.",
      studyMethod: "Inductive",
      careNote: griefPastoralCareNote
    }),
    "2 Corinthians 1:3-7": guidedDevotional({
      title: "God of all comfort",
      context: "Paul praises the Father of mercies and God of all comfort in the middle of affliction. Comfort is both received and shared: God's mercy meets suffering people and then makes them able to comfort others in their affliction.",
      body: "God comforts us in affliction so that comfort can overflow to others. Suffering is not good in itself, but God's mercy is active in it and can make us instruments of His comfort. Comfort received from God can become gentleness toward another.",
      observationQuestion: "How does Paul describe God, affliction, comfort, and sharing comfort?",
      reflectionQuestion: "Where have you received comfort that may one day help you comfort another?",
      prayer: "Father of mercies, comfort me and make me gentle with others in pain.",
      gentleAction: "Receive comfort today before trying to explain or fix everything.",
      studyMethod: "SOAP",
      careNote: griefPastoralCareNote
    }),
    "Revelation 21:1-5": guidedDevotional({
      title: "Every tear wiped away",
      context: "Revelation 21 looks to new creation, God dwelling with His people, and the end of death, mourning, crying, and pain. The promise is final and embodied: God Himself dwells with His people and wipes away tears because the former things have passed away.",
      body: "This promise does not trivialize today's sorrow; it assures you that sorrow will not have the last word. God Himself will wipe every tear away and make all things new. Grief is held inside a story that ends with God's presence and restoration.",
      observationQuestion: "What does John see, and what does God promise to remove and make new?",
      reflectionQuestion: "What tear needs to be held before the God who will make all things new?",
      prayer: "Lord, keep my hope fixed on the day when You wipe every tear away.",
      gentleAction: "Hold one grief before God and say, 'This will not have the last word.'",
      studyMethod: "Meditation",
      careNote: griefPastoralCareNote
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
      "Where does your downcast soul need hope in God to speak louder than grief today?",
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
      ...(curatedDevotionals[day.reference] || {})
    }))
  };
}

function withContextOverrides(plan: BibleReadingPlan): BibleReadingPlan {
  const contextOverrides = contextOverridesByPlan[plan.id] || {};
  if (Object.keys(contextOverrides).length === 0) return plan;
  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      ...(contextOverrides[day.reference] ? { context: contextOverrides[day.reference] } : {})
    }))
  };
}

function withPlanContentSafeguards(plans: BibleReadingPlan[]): BibleReadingPlan[] {
  return plans.map(withContextOverrides);
}

const torahBookSet = new Set(["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy"]);
const historicalBookSet = new Set(["Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther"]);
const wisdomBookSet = new Set(["Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon"]);
const prophetBookSet = new Set(["Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"]);
const gospelBookSet = new Set(["Matthew", "Mark", "Luke", "John"]);
const paulineBookSet = new Set(paulineBooks);
const generalEpistleBookSet = new Set(["Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude"]);

function bookSectionGuidance(book: string): BibleReadingPlanDayExtras {
  if (torahBookSet.has(book)) {
    return devotional(
      `Beginning ${book}`,
      `${book} belongs to the Torah, where Scripture lays foundations for creation, covenant, rescue, holiness, wilderness faith, and life with the Lord. Read this section slowly, asking how God's character and covenant purposes are being revealed before rushing to application.`,
      `What foundation for knowing the Lord is being laid as ${book} begins?`,
      "Lord, ground my faith in Your character, Your promises, and Your covenant mercy.",
      {
        context: `${book} stands within the Torah, the opening five-book foundation of Scripture. These books establish creation, promise, covenant, rescue from bondage, worship, holiness, and life before the Lord. Read the opening section as foundation for the Bible's larger story.`,
        guidanceKind: "reading-guidance"
      }
    );
  }
  if (historicalBookSet.has(book)) {
    return devotional(
      `Entering ${book}`,
      `${book} tells part of Israel's lived history with the Lord. Watch for faithfulness and failure, leadership and worship, judgment and mercy. These chapters are not merely examples to imitate or avoid; they show how God's purposes continue through real people and real consequences.`,
      `What does ${book} show about the Lord's faithfulness in the middle of human faithfulness and failure?`,
      "Lord, teach me to read history with humility, repentance, and trust in Your purposes.",
      {
        context: `${book} belongs to the historical books, where Israel's life in the land, leadership, worship, failure, judgment, and mercy unfold in real events. Read this book as part of God's covenant dealings rather than as isolated moral examples.`,
        guidanceKind: "reading-guidance"
      }
    );
  }
  if (wisdomBookSet.has(book)) {
    return devotional(
      `Learning prayer and wisdom in ${book}`,
      `${book} trains the heart as well as the mind. Read for worship, honest prayer, wisdom, limits, longing, and faithful living before God. Let the passage shape what you love, fear, ask, confess, and practice.`,
      `What desire, prayer, or wisdom is ${book} forming in you today?`,
      "Lord, shape my heart with wisdom, worship, and honest prayer.",
      {
        context: `${book} stands among Scripture's wisdom and worship books, where prayer, praise, lament, desire, suffering, limits, and practical discernment are brought before God. Read slowly, allowing the genre to shape worship and wisdom before immediate application.`,
        guidanceKind: "reading-guidance"
      }
    );
  }
  if (prophetBookSet.has(book)) {
    return devotional(
      `Listening to ${book}`,
      `${book} speaks into covenant unfaithfulness, injustice, judgment, mercy, and hope. Prophetic books are not mainly prediction puzzles; they call God's people to hear His word, return to Him, and trust His promised restoration.`,
      `What warning, promise, or hope should be heard clearly as ${book} begins?`,
      "Lord, give me ears to hear Your word with repentance, reverence, and hope.",
      {
        context: `${book} belongs to the prophetic witness, where the Lord addresses covenant unfaithfulness, injustice, idolatry, judgment, mercy, and future hope. Read the opening section as God's word to His people before turning it into private prediction or general advice.`,
        guidanceKind: "reading-guidance"
      }
    );
  }
  if (gospelBookSet.has(book)) {
    return devotional(
      `Following Jesus in ${book}`,
      `${book} presents the life, teaching, death, and resurrection of Jesus. Read with your eyes on who He is, what He reveals about the Father, how He brings the kingdom, and how He calls people to trust and follow Him.`,
      `What does ${book} reveal about Jesus that should shape your faith today?`,
      "Lord Jesus, help me see You clearly and follow You faithfully.",
      {
        context: `${book} is one of the four Gospels, presenting Jesus' identity, teaching, kingdom mission, death, and resurrection. Read this book with attention to its own portrait of Christ, while remembering that every episode serves the larger witness to who Jesus is.`,
        guidanceKind: "reading-guidance"
      }
    );
  }
  if (book === "Acts") {
    return devotional(
      "The risen Christ at work",
      "Acts shows the risen Jesus continuing His mission by the Spirit through His witnesses. Watch how prayer, courage, suffering, preaching, repentance, and community form the early church as the gospel moves outward.",
      "How does Acts show the Spirit empowering witness to Jesus?",
      "Risen Lord, make me faithful by Your Spirit in ordinary witness and love.",
      {
        context: "Acts follows Luke's Gospel and shows the risen Jesus continuing His mission by the Holy Spirit through His witnesses. The gospel moves from Jerusalem toward the nations through preaching, prayer, suffering, repentance, and Spirit-formed community.",
        guidanceKind: "reading-guidance"
      }
    );
  }
  if (paulineBookSet.has(book)) {
    return devotional(
      `Reading ${book} as gospel-shaped instruction`,
      `${book} is part of Paul's apostolic teaching for churches and believers. Look for how gospel truth leads into worship, identity, holiness, unity, endurance, and love. Keep grace as the root, not merely behavior as the goal.`,
      `How does ${book} connect what God has done in Christ with how believers now live?`,
      "Lord, let Your grace take root in my belief, worship, relationships, and obedience.",
      {
        context: `${book} belongs to Paul's apostolic letters, written to churches or coworkers with gospel truth for real belief, worship, holiness, endurance, and shared life. Read commands and encouragements from the foundation of grace in Christ, not as detached religious advice.`,
        guidanceKind: "reading-guidance"
      }
    );
  }
  if (generalEpistleBookSet.has(book)) {
    return devotional(
      `Receiving ${book}`,
      `${book} helps believers endure, discern truth, love faithfully, and live as God's people. Read for both comfort and correction, remembering that Christian obedience grows from belonging to the Lord.`,
      `What comfort or correction does ${book} bring to faithful discipleship?`,
      "Lord, strengthen me to receive Your word and live faithfully as one who belongs to You.",
      {
        context: `${book} belongs to the General Epistles, writings that strengthen believers in endurance, truth, holiness, love, discernment, and hope. Read its correction and comfort as words for God's people learning to remain faithful under pressure.`,
        guidanceKind: "reading-guidance"
      }
    );
  }
  if (book === "Revelation") {
    return devotional(
      "The Lamb reigns",
      "Revelation unveils Jesus Christ as the slain and risen Lamb who reigns, judges evil, keeps His people, and brings all things to their appointed end. Read with worship and endurance rather than speculation.",
      "How does Revelation call you to worship, endurance, and hope in Christ?",
      "Lord Jesus, keep my hope fixed on Your victory and coming renewal.",
      {
        context: "Revelation is an apocalyptic and prophetic witness to Jesus Christ, the slain and risen Lamb who reigns, judges evil, keeps His people, and brings creation to renewal. Read its images with worship, endurance, and hope rather than speculation.",
        guidanceKind: "reading-guidance"
      }
    );
  }
  return devotional(
    `Beginning ${book}`,
    `${book} begins a new section in this reading plan. Pause before moving quickly and ask where this book sits in the wider story of Scripture, what it reveals about God, and how it calls His people to trust, worship, repentance, or obedience.`,
    `What does this new section reveal about the Lord and His purposes?`,
    "Lord, help me read this section with attention, humility, and faith.",
    {
      context: `${book} begins a new section in this reading plan, so it is worth pausing before moving quickly into details. Ask where this book sits in Scripture's larger story and how it reveals the Lord's character, purposes, promises, warnings, and mercy.`,
      guidanceKind: "reading-guidance"
    }
  );
}

function withBookSectionGuidance(plan: BibleReadingPlan): BibleReadingPlan {
  const seenBooks = new Set<string>();
  return {
    ...plan,
    days: plan.days.map((day) => {
      const startsNewBookSection = !seenBooks.has(day.readerBook);
      seenBooks.add(day.readerBook);
      if (!startsNewBookSection || day.devotional) return day;
      return {
        ...day,
        ...bookSectionGuidance(day.readerBook)
      };
    })
  };
}

export const builtInBibleReadingPlans: BibleReadingPlan[] = withPlanContentSafeguards([
  withCuratedDevotionals(oneChapterPerDayPlan("john-21", "21 Days in John", "Read one chapter a day through John's Gospel.", "John", 21)),
  withCuratedDevotionals(oneChapterPerDayPlan("romans-16", "Romans in 16 Days", "Move slowly through Paul's letter one chapter at a time.", "Romans", 16)),
  withCuratedDevotionals(buildChapterPlan("psalms-prayer", "Psalms for Prayer", "Twenty-one Psalms chosen to shape prayer, trust, confession, and worship.", ["Psalms"], 21, "Prayer")),
  withBookSectionGuidance(buildChapterPlan("new-testament-90", "New Testament in 90 Days", "Read through the New Testament in steady daily portions.", NEW_TESTAMENT_BOOKS, 90, "New Testament")),
  withBookSectionGuidance({
    ...buildChapterPlan("bible-365", "Bible in 1 Year", "A simple chapter-by-chapter path through every book of the Bible.", wholeBibleBooks, 365),
    purpose: "To build a steady year-long rhythm through the whole Bible while keeping each book within the larger story of creation, covenant, Christ, church, and new creation.",
    bestFor: "Readers who want a simple whole-Bible habit without jumping between testaments each day.",
    pace: "Gentle long-term rhythm",
    estimatedTime: "15-30 minutes",
    coverage: "A chapter-by-chapter journey from Genesis to Revelation across one year.",
    rhythm: "Read the daily portion, notice where the current book sits in Scripture's story, pray briefly, then mark the day complete."
  }),
  withBookSectionGuidance({
    ...buildChapterPlan("bible-1-year-chronological", "Bible in 1 Year Chronological", "Read the Bible in a broad historical flow over one year.", chronologicalBibleBooks, 365),
    purpose: "To help you follow the Bible story in a roughly historical order from creation, the patriarchs, Israel, exile, Jesus, the church, and new creation.",
    bestFor: "Readers who want the storyline of Scripture to feel connected across the whole year.",
    pace: "Gentle long-term rhythm",
    estimatedTime: "15-30 minutes",
    coverage: "A whole-Bible journey arranged in a broad chronological-style sequence.",
    rhythm: "Read the daily portion, notice where it fits in the story, pray, then mark the day complete."
  }),
  withBookSectionGuidance({
    ...buildOldNewTogetherPlan("bible-1-year-old-new", "Old and New Testament Daily Pairing", "A one-year plan that pairs Old Testament and New Testament readings each day.", 365),
    purpose: "To keep the whole Bible moving while regularly returning to the teaching of Jesus, the apostles, and the early church.",
    bestFor: "Readers who like variety and want Old Testament and New Testament readings side by side.",
    pace: "Gentle long-term rhythm",
    estimatedTime: "15-30 minutes",
    coverage: "Daily portions pair Old Testament and New Testament readings through the year.",
    rhythm: "Read both portions, notice one connection, pray briefly, then mark the day complete."
  }),
  withBookSectionGuidance({
    ...buildChapterPlan("bible-6-months", "Bible in 6 Months", "A brisk six-month journey through the whole Bible.", wholeBibleBooks, 180),
    pace: "Brisk daily readings",
    estimatedTime: "25-40 minutes",
    bestFor: "Readers who want a focused season of stronger whole-Bible momentum."
  }),
  withBookSectionGuidance({
    ...buildChapterPlanWithReflectionDays("new-testament-1-year", "New Testament in 1 Year", "A gentle year-long path through the New Testament with reflection days.", NEW_TESTAMENT_BOOKS, 365, "New Testament"),
    purpose: "To let the New Testament settle slowly through repeated reading and reflection.",
    pace: "Gentle long-term rhythm",
    estimatedTime: "5-10 minutes",
    coverage: "Every New Testament chapter with later reflection readings to help the message sink in."
  }),
  withBookSectionGuidance({
    ...buildChapterPlanWithReflectionDays("psalms-proverbs-1-year", "Psalms and Proverbs in 1 Year", "A slow yearly rhythm through prayer, worship, and wisdom.", ["Psalms", "Proverbs"], 365, "Wisdom"),
    purpose: "To shape prayer and daily wisdom through repeated exposure to Psalms and Proverbs.",
    pace: "Gentle long-term rhythm",
    estimatedTime: "5-10 minutes",
    coverage: "Psalms and Proverbs with reflection readings across the year."
  }),
  withBookSectionGuidance({
    ...buildChapterPlan("bible-30", "Bible in 30 Days", "A fast overview pace through the whole Bible.", wholeBibleBooks, 30),
    purpose: "To give an intensive, big-picture sweep of Scripture rather than a slow devotional pace.",
    bestFor: "Experienced readers or short focused seasons where overview matters more than detail.",
    pace: "Intensive daily readings",
    estimatedTime: "45-75 minutes",
    rhythm: "Read for the broad movement of the story, note one major theme, pray briefly, then return later for deeper study."
  }),
  withBookSectionGuidance({
    ...buildChapterPlan("bible-90", "Bible in 90 Days", "A strong three-month path through the whole Bible.", wholeBibleBooks, 90),
    purpose: "To move through the whole Bible in a focused season while still leaving room to notice repeated themes and book transitions.",
    bestFor: "Readers who want strong momentum and can set aside a meaningful daily reading window.",
    pace: "Strong daily readings",
    estimatedTime: "30-50 minutes",
    rhythm: "Read attentively for the passage flow, note one repeated theme, pray, then mark the day complete."
  }),
  withBookSectionGuidance({
    ...buildChapterPlan("bible-overview-60", "Bible Overview in 60 Days", "A two-month overview of the Bible's major movements.", wholeBibleBooks, 60, "Overview"),
    purpose: "To help readers see the Bible's main storyline and major movements before choosing books for slower study.",
    bestFor: "Readers wanting orientation to the whole Bible without beginning with a full-year plan.",
    pace: "Intensive overview readings",
    estimatedTime: "35-60 minutes",
    rhythm: "Read for orientation, notice the book or covenant setting, and write one question for future deeper study."
  }),
  withBookSectionGuidance({
    ...buildChapterPlan("new-testament-30", "New Testament in 30 Days", "Read the New Testament in one month.", NEW_TESTAMENT_BOOKS, 30, "New Testament"),
    purpose: "To move quickly through Jesus' life, the early church, the letters, and Revelation while keeping Christ central.",
    bestFor: "Readers wanting a concentrated month in the New Testament.",
    pace: "Steady daily readings",
    estimatedTime: "20-35 minutes",
    rhythm: "Read the daily portion, ask what it reveals about Christ and His people, pray, then mark the day complete."
  }),
  withBookSectionGuidance({
    ...buildChapterPlan("psalms-30", "Psalms in 30 Days", "Pray and reflect through the Psalms in a month.", ["Psalms"], 30, "Prayer"),
    purpose: "To let the Psalms train honest prayer, praise, lament, confession, trust, and hope.",
    bestFor: "Prayer, worship, lament, and learning to bring the whole heart before God.",
    pace: "Steady daily readings",
    estimatedTime: "15-30 minutes",
    rhythm: "Read slowly, choose one line to pray back to God, and let the Psalm give words to worship or lament."
  }),
  withBookSectionGuidance({
    ...oneChapterPerDayPlan("proverbs-31", "Proverbs in 31 Days", "Read one chapter of Proverbs each day.", "Proverbs", 31, "Wisdom"),
    purpose: "To read Proverbs as wisdom formation, not as mechanical guarantees detached from the fear of the Lord.",
    bestFor: "Daily wisdom, speech, relationships, work, money, humility, and discernment.",
    pace: "Short daily readings",
    estimatedTime: "5-10 minutes",
    rhythm: "Read one chapter, choose one proverb to carry, and ask how wisdom should shape one concrete decision."
  }),
  withBookSectionGuidance({
    ...buildChapterPlan("gospels-40", "Gospels in 40 Days", "Read Matthew, Mark, Luke, and John in forty days.", gospelBooks, 40, "Gospels"),
    purpose: "To keep sustained attention on Jesus' identity, kingdom, teaching, compassion, death, and resurrection.",
    bestFor: "Readers wanting to know Jesus more clearly through all four Gospel witnesses.",
    pace: "Steady daily readings",
    estimatedTime: "15-25 minutes",
    rhythm: "Read with your eyes on Jesus, note what He reveals about the Father and the kingdom, then respond in prayer."
  }),
  withBookSectionGuidance({
    ...buildChapterPlan("torah-pentateuch-50", "Torah / Pentateuch in 50 Days", "Read Genesis through Deuteronomy in a steady fifty-day path.", pentateuchBooks, 50, "Book study"),
    purpose: "To lay foundations in creation, covenant, promise, exodus, holiness, wilderness faith, and life with the Lord.",
    bestFor: "Readers wanting Old Testament foundations before moving into history, wisdom, prophets, and the New Testament.",
    pace: "Steady daily readings",
    estimatedTime: "20-35 minutes",
    rhythm: "Read for God's character and covenant purposes before rushing to personal application."
  }),
  withBookSectionGuidance(withCuratedDevotionals(buildChapterPlan("major-prophets-overview", "Major Prophets Overview", "A manageable overview through Isaiah, Jeremiah, Lamentations, Ezekiel, and Daniel.", majorProphetBooks, 45, "Overview"))),
  withCuratedDevotionals(buildChapterPlan("acts-early-church", "Acts and the Early Church", "Follow the birth and spread of the early church through Acts.", ["Acts"], 28, "New Testament")),
  withCuratedDevotionals(buildChapterPlan("pauls-letters-overview", "Paul's Letters Overview", "A guided overview through Paul's letters to churches and co-workers.", paulineBooks, 45, "New Testament")),
  withCuratedDevotionals(planFromReferences("life-of-david", "Life of David", "Trace David's calling, courage, failure, repentance, and worship.", [
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
  ], "Character study")),
  withCuratedDevotionals(planFromReferences("life-of-moses", "Life of Moses", "Follow Moses from deliverance to leadership, wilderness testing, and covenant faithfulness.", [
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
  ], "Character study")),
  {
    ...planFromReferences("seven-days-prayer", "7 Days of Prayer", "A one-week path for learning prayer as relationship, trust, worship, lament, confession, and dependence.", [
      ["Matthew 6:5-13", "Matthew", 6, "Pray to your Father", guidedDevotional({
        title: "Pray before the Father who sees",
        context: "Jesus is teaching His disciples in the Sermon on the Mount, where true righteousness is lived before the Father rather than for human applause. He contrasts prayer performed for attention with prayer offered to the Father who sees in secret, then gives a pattern that begins with God's name, kingdom, and will.",
        body: "The Lord's Prayer begins with God: His name, kingdom, and will. Only then does it teach us to ask for bread, forgiveness, and deliverance. Prayer is not religious performance; it is dependent children coming to the Father who sees.",
        observationQuestion: "What comes first in Jesus' pattern of prayer?",
        reflectionQuestion: "Where might prayer become simpler and more Father-centered for you?",
        prayer: "Father, teach me to pray for Your name, Your kingdom, Your will, and today's needed grace.",
        gentleAction: "Pray the Lord's Prayer slowly once, pausing after each line.",
        studyMethod: "SOAP"
      })],
      ["Luke 11:1-13", "Luke", 11, "Ask the generous Father", guidedDevotional({
        title: "Ask, seek, and knock",
        context: "Luke places this teaching after Jesus Himself has been praying, prompting His disciples to ask for instruction. Jesus gives a prayer pattern, then uses friendship and fatherly giving to encourage persistence. The passage climaxes with the Father's generous gift of the Holy Spirit.",
        body: "Jesus encourages persistence, not because God is reluctant, but because the Father is good. Prayer grows as trust grows. The greatest gift named here is the Holy Spirit, so our asking is held within God's wise and generous care.",
        observationQuestion: "What reasons does Jesus give for continuing to ask?",
        reflectionQuestion: "Where do you need to trust the Father's goodness rather than suspect His heart?",
        prayer: "Father, teach me to ask, seek, and knock with trust in Your generous care.",
        gentleAction: "Name one need honestly before God, then thank Him for hearing.",
        studyMethod: "OIA"
      })],
      ["Psalm 23:1-6", "Psalms", 23, "Pray from trust", guidedDevotional({
        title: "Let trust become prayer",
        context: "Psalm 23 is a Davidic psalm of trust that describes the Lord as Shepherd and generous host. It moves through rest, restoration, guidance, danger, provision, mercy, and dwelling with God. Prayer from this psalm is not denial of the valley, but confidence in the Shepherd's presence.",
        body: "Psalm 23 gives prayer words when you need to be led. The Shepherd restores and protects His people, even in the valley. You can pray from need without panic because the Lord's care is personal and present.",
        observationQuestion: "What actions does the Shepherd take in this Psalm?",
        reflectionQuestion: "Which line gives words to your prayer today?",
        prayer: "Lord, my Shepherd, lead me, restore me, and keep me near You.",
        gentleAction: "Choose one phrase from Psalm 23 and carry it into the next hour.",
        studyMethod: "Lectio Divina"
      })],
      ["Psalm 46:1-11", "Psalms", 46, "Be still before God", guidedDevotional({
        title: "Be still before the God who reigns",
        context: "Psalm 46 is a Korahite Song of Zion. It names trouble, shaking creation, and raging nations, but repeats that the Lord of hosts is with His people. Prayer learns stillness here by ceasing anxious striving before God's rule, not by pretending the world is already quiet.",
        body: "The command to be still is not denial or passivity. It is a summons to stop striving as if everything rests on you and to know that the Lord is exalted. Prayer can become worship when pressure is brought before the God who reigns.",
        observationQuestion: "What trouble is named, and what is repeated about God?",
        reflectionQuestion: "Where are you carrying pressure as though God is absent or unable to help?",
        prayer: "Lord Almighty, quiet my striving and help me know that You are present, faithful, and exalted.",
        gentleAction: "Sit quietly for one minute and repeat, 'The Lord is with us.'",
        studyMethod: "COMA"
      })],
      ["Philippians 4:4-7", "Philippians", 4, "Pray with thanksgiving", guidedDevotional({
        title: "Bring requests with thanksgiving",
        context: "Paul writes from prison to a beloved church and has just urged Euodia and Syntyche toward unity. He calls the church to rejoice in the Lord, show gentleness, and bring requests to God with thanksgiving. The peace promised is God's guard in Christ, not a reward for perfect calm.",
        body: "Thanksgiving does not pretend needs are small. It remembers God's faithfulness while bringing real requests to Him. The promised peace is God's guard over the heart and mind in Christ, not a reward for perfect calm.",
        observationQuestion: "What does Paul tell believers to do with their requests?",
        reflectionQuestion: "What anxious request can you bring to God with thanksgiving?",
        prayer: "Lord, receive my requests and guard my heart and mind in Christ Jesus.",
        gentleAction: "Write one request and one reason for thanksgiving beside it.",
        studyMethod: "SOAP"
      })],
      ["James 5:13-18", "James", 5, "Pray in every season", guidedDevotional({
        title: "Prayer for the whole life",
        context: "James closes a letter about whole-life faith by placing prayer in suffering, cheerfulness, sickness, confession, restoration, and ordinary human weakness. Elijah is named as an example of a righteous person's prayer, not to turn prayer into control, but to encourage faithful dependence on God.",
        body: "Prayer is not reserved for one mood. James invites God's people to pray when suffering, sing when cheerful, confess when needed, and ask for help together. Faithful prayer trusts God without trying to control Him.",
        observationQuestion: "How many different situations for prayer does James mention?",
        reflectionQuestion: "What season are you in, and what kind of prayer does James invite?",
        prayer: "Lord, teach me to turn to You in suffering, joy, weakness, confession, and hope.",
        gentleAction: "Pray one sentence that honestly names your present season.",
        studyMethod: "OIA"
      })],
      ["1 John 5:13-15", "1 John", 5, "Ask according to His will", guidedDevotional({
        title: "Confidence under God's will",
        context: "John writes so believers may know they have eternal life in the Son of God. His words about prayer sit inside that assurance and are shaped by asking according to God's will. The confidence is real, but it is not a blank cheque detached from God's character and purposes.",
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
  withPastoralCareNote(withCuratedDevotionals(planFromReferences("seven-days-peace", "7 Days of Peace", "A short plan for anxiety, rest, and the peace of God.", [
    ["Psalm 4:6-8", "Psalms", 4, "Sleep in peace"],
    ["Psalm 23:1-4", "Psalms", 23, "The Shepherd's care"],
    ["Isaiah 26:3-4", "Isaiah", 26, "Perfect peace"],
    ["Matthew 6:25-34", "Matthew", 6, "Do not worry"],
    ["John 14:25-27", "John", 14, "My peace I give"],
    ["Philippians 4:4-9", "Philippians", 4, "Peace that guards"],
    ["Colossians 3:12-17", "Colossians", 3, "Let peace rule"]
  ], "Care")), anxietyPastoralCareNote),
  planFromReferences("identity-in-christ", "Identity in Christ", "Seven readings to help you remember who you are because of Christ.", [
    ["John 1:9-13", "John", 1, "Received as God's children", guidedDevotional({
      title: "Received before you perform",
      context: "John opens by presenting Jesus as the true Light and eternal Word who came into the world He made. Some reject Him, but those who receive Him and believe in His name are given the right to become children of God, born not by human status or effort but by God.",
      body: "This passage begins identity with reception, not achievement. Belonging to God is not something you climb toward by religious effort; it is a gift given through Christ. Before productivity, approval, failure, or family history speaks over you, Scripture says that those who receive the Son are born of God.",
      observationQuestion: "What does John say is given to those who receive Christ and believe in His name?",
      reflectionQuestion: "What false measure of identity does this passage gently correct for you?",
      prayer: "Father, help me receive the gift of belonging to You through Christ.",
      gentleAction: "Write one sentence beginning, 'Because of Christ, I am received by God...'",
      studyMethod: "OIA"
    })],
    ["Romans 8:1-4", "Romans", 8, "No condemnation", guidedDevotional({
      title: "No condemnation in Christ",
      context: "Romans 8 follows Paul's description of sin's struggle and the law's inability to rescue. The chapter begins by announcing what God has done in Christ and by the Spirit: condemnation has been answered, sin has been judged in the Son, and believers now walk in new life.",
      body: "The Christian life does not begin under a cloud of accusation. There is now no condemnation for those who are in Christ Jesus because God has acted through His Son where the law could not rescue us. This is not denial of sin; it is confidence that Christ has dealt with sin so that life can now be walked by the Spirit.",
      observationQuestion: "What has God done through His Son that the law could not do?",
      reflectionQuestion: "Where do you most need to hear 'no condemnation' today?",
      prayer: "Lord Jesus, teach me to stand in Your mercy rather than my shame.",
      gentleAction: "When accusation rises today, pause and answer it with Romans 8:1.",
      studyMethod: "SOAP"
    })],
    ["2 Corinthians 5:17-21", "2 Corinthians", 5, "New creation", guidedDevotional({
      title: "Made new for reconciliation",
      context: "Paul writes as an apostle whose ministry is shaped by Christ's death and resurrection. In this section, reconciliation is not a vague fresh start; God reconciles sinners to Himself through Christ and entrusts His people with a message of reconciliation.",
      body: "In Christ, new creation is not merely a private feeling. God reconciles us to Himself and then gives us a ministry of reconciliation. Your identity is both received and sent: loved by God, made new by grace, and invited to become a witness of that grace in ordinary relationships.",
      observationQuestion: "What does Paul say God has done for us in Christ, and what has He entrusted to us?",
      reflectionQuestion: "What would it look like to live today as someone reconciled to God?",
      prayer: "God of mercy, make Your reconciling grace visible in me.",
      gentleAction: "Choose one ordinary relationship where you can practice peace, honesty, or forgiveness today.",
      studyMethod: "COMA"
    })],
    ["Galatians 3:26-29", "Galatians", 3, "Clothed with Christ", guidedDevotional({
      title: "Clothed with Christ",
      context: "In Galatians 3, Paul argues that believers are children of God through faith in Christ rather than through law-based status. Baptism language pictures being clothed with Christ, and the promise to Abraham gathers diverse believers into one family in Him.",
      body: "Believers have been clothed with Christ. Before the world sees your gifts, background, weakness, status, or mistakes, God sees you in His Son. Unity in Christ does not erase your story, but it gives you a deeper identity than every human label.",
      observationQuestion: "What identity words does Paul use for those who belong to Christ?",
      reflectionQuestion: "Which lesser label has been louder than your identity in Christ?",
      prayer: "Lord, let Christ be the truest thing about how I see myself and others.",
      gentleAction: "Name one label you need to hold under the greater truth that you belong to Christ.",
      studyMethod: "Word study"
    })],
    ["Ephesians 1:3-10", "Ephesians", 1, "Blessed and chosen", guidedDevotional({
      title: "Blessed in Christ",
      context: "Paul opens Ephesians with a long sentence of blessing that traces salvation to the Father's purpose, the Son's redemption, and God's lavish grace. Identity here is received in Christ: chosen, adopted, redeemed, forgiven, and gathered into God's plan for all things.",
      body: "Ephesians lifts your eyes from self-definition to God's gracious purpose. In Christ, believers are blessed, chosen, adopted, redeemed, and forgiven. These words are not decorations; they are anchors. Your identity is grounded in God's will, God's grace, and God's plan to bring all things together in Christ.",
      observationQuestion: "What blessings does Paul say believers have in Christ?",
      reflectionQuestion: "Which word in this passage gives your heart the strongest anchor today?",
      prayer: "Father, help me rest in the grace You have lavished in Christ.",
      gentleAction: "Choose one identity word from the passage and carry it through the day.",
      studyMethod: "Inductive"
    })],
    ["Colossians 3:1-4", "Colossians", 3, "Hidden with Christ", guidedDevotional({
      title: "Hidden with Christ",
      context: "Colossians 3 follows Paul's warning against empty religion and his insistence that believers are united with Christ. Because they have been raised with Him, they are called to seek things above, set their minds where Christ reigns, and live from a life hidden with Him.",
      body: "Being hidden with Christ is not escape from ordinary life. Because believers have been raised with Christ, they learn to seek what belongs to Him and set their minds where He reigns. Your life is hidden with Christ in God, so earthly pressures no longer get the final word. Hiddenness means safety, new direction, and future hope when Christ appears in glory.",
      observationQuestion: "What does Paul say believers should seek and set their minds on?",
      reflectionQuestion: "What earthly concern needs to be re-ordered by seeking Christ and setting your mind on things above?",
      prayer: "Christ, keep my mind set on You and my life anchored in You.",
      gentleAction: "When one earthly pressure feels loud today, deliberately name Christ's rule over it.",
      studyMethod: "Meditation"
    })],
    ["1 Peter 2:9-10", "1 Peter", 2, "A chosen people", guidedDevotional({
      title: "Chosen to declare His praise",
      context: "Peter writes to scattered believers experiencing pressure and social displacement. He uses Old Testament identity language for the church as a chosen people, royal priesthood, holy nation, and God's possession, grounding their purpose in God's mercy and praise.",
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
      context: "John 15 belongs to Jesus' Farewell Discourse on the night before the cross. As He prepares His disciples for His departure, He calls Himself the true vine and them the branches, teaching that fruitfulness comes from remaining in Him and receiving His words.",
      body: "Jesus does not call His disciples to produce fruit by anxious striving. He calls them to remain in Him. Branches bear fruit because they stay connected to the vine. Begin with dependence: receive His word, stay near, and let obedience grow from communion rather than pressure.",
      observationQuestion: "What does Jesus say branches can and cannot do apart from the vine?",
      reflectionQuestion: "Where are you tempted to produce fruit without remaining close to Christ?",
      prayer: "Jesus, teach me to remain in You and receive life from You.",
      gentleAction: "Before one task today, pray, 'Apart from You I can do nothing.'",
      studyMethod: "OIA"
    })],
    ["Psalm 1:1-3", "Psalms", 1, "Planted by streams", guidedDevotional({
      title: "Planted where life flows",
      context: "Psalm 1 opens the Psalter by contrasting the way of the righteous with the way of the wicked. The blessed life is pictured as delighting in the Lord's instruction and being planted like a tree by streams of water, fruitful because it is rooted in God's word.",
      body: "Psalm 1 describes a life rooted in God's instruction like a tree planted by streams of water. This is not hurried spirituality. It is a settled life, nourished over time. Abiding often looks ordinary: returning to Scripture, refusing the wrong path, and staying where God gives life.",
      observationQuestion: "What does the blessed person avoid, and what do they delight in?",
      reflectionQuestion: "What stream of God's word do you need to stay near today?",
      prayer: "Lord, plant me deeply in Your word and make my life fruitful in season.",
      gentleAction: "Read the passage slowly once more and underline one phrase to meditate on.",
      studyMethod: "Meditation"
    })],
    ["Psalm 27:4-8", "Psalms", 27, "Dwell with the Lord", guidedDevotional({
      title: "One thing",
      context: "Psalm 27 is a Davidic prayer that moves between confidence, danger, desire, and seeking the Lord's face. In verses 4-8, the central longing is not first escape from pressure but nearness to the Lord: dwelling with Him, beholding His beauty, and seeking His face.",
      body: "David's desire is beautifully focused: to dwell in the house of the Lord and seek Him. Abiding is not adding more spiritual noise; it is learning to seek one necessary thing. In pressure or distraction, God invites you to turn your face toward Him again.",
      observationQuestion: "What is the 'one thing' David asks of the Lord?",
      reflectionQuestion: "What would it mean to seek the Lord as your 'one thing' today?",
      prayer: "Lord, when You say, 'Seek My face,' help my heart answer, 'Your face I will seek.'",
      gentleAction: "Take one ordinary pause today and turn it into a moment of seeking the Lord.",
      studyMethod: "SOAP"
    })],
    ["Matthew 11:25-30", "Matthew", 11, "Come to Me", guidedDevotional({
      title: "Rest for your soul",
      context: "Matthew 11 has just contrasted proud unbelief with the Father's gracious revelation of the Son to the humble. Jesus then invites the weary and burdened to come to Him, take His yoke, and learn from His gentle and humble heart. His rest is discipleship with Him.",
      body: "Jesus' invitation is personal and gentle: come to Me. He does not ignore weariness; He names it and offers rest. Abiding in Christ includes bringing your burdens honestly to Him and learning His way. His yoke is not the crushing weight of self-salvation, but the restful obedience of walking with Him.",
      observationQuestion: "Who does Jesus invite, and what does He promise to give?",
      reflectionQuestion: "What burden do you need to bring to Jesus rather than carry alone?",
      prayer: "Gentle and humble Savior, give rest to my soul as I come to You.",
      gentleAction: "Name one burden in prayer before you try to solve it.",
      studyMethod: "COMA"
    })],
    ["Luke 10:38-42", "Luke", 10, "Sit at Jesus' feet", guidedDevotional({
      title: "The necessary thing",
      context: "Luke places this home scene after Jesus' teaching about loving God and neighbor. Martha's service is real, but anxiety and distraction overtake her, while Mary sits at Jesus' feet as a disciple listening to His word. The necessary thing is receiving from Christ before activity.",
      body: "Martha's service mattered, but her worry crowded out attentiveness to Jesus. Mary shows a posture of receiving before doing. This passage does not shame faithful work; it reorders it. Abiding means letting Jesus have your attention before your activity takes over.",
      observationQuestion: "What is Martha troubled by, and what does Jesus commend in Mary?",
      reflectionQuestion: "What good activity might be crowding out attention to Jesus?",
      prayer: "Lord Jesus, quiet my distracted heart and help me choose what is necessary.",
      gentleAction: "Before checking a task list, spend two quiet minutes receiving from Jesus' words.",
      studyMethod: "OIA"
    })],
    ["Colossians 2:6-7", "Colossians", 2, "Rooted and built up", guidedDevotional({
      title: "Continue as you received",
      context: "In Colossians 2, Paul warns believers not to be captured by empty teaching or human tradition. The answer is not novelty but continuing in the Christ they received: rooted, built up, established in the faith, and overflowing with thankfulness.",
      body: "The Christian life grows by the same grace that began it. You are rooted, built up, strengthened, and overflowing with thankfulness as you keep walking in Him. Abiding is steady continuation, not constant reinvention.",
      observationQuestion: "What images does Paul use to describe continuing in Christ?",
      reflectionQuestion: "Where do you need to continue in simple trust rather than start over in anxiety?",
      prayer: "Christ, root me more deeply in You and grow thanksgiving in me.",
      gentleAction: "Write one thing you are thankful for as evidence of God's steady work.",
      studyMethod: "Word study"
    })],
    ["1 John 2:24-28", "1 John", 2, "Abide in Him", guidedDevotional({
      title: "Let the word remain",
      context: "John writes to believers facing deception about Christ and urges them to let the apostolic message they heard from the beginning remain in them. Abiding is anchored in the truth about the Son and the Father, leading to confidence rather than drift.",
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
        context: "John opens his Gospel before creation, identifying Jesus as the eternal Word who was with God and was God. The Word becomes flesh, brings light into darkness, gives new birth to those who receive Him, and makes the Father known in grace and truth.",
        body: "Christian faith begins with Jesus Himself. He is the light who enters darkness and the Son who reveals the Father. New life is not built on vague spirituality, but on receiving the One who came full of grace and truth.",
        observationQuestion: "What does John say about who Jesus is and what He came to reveal?",
        reflectionQuestion: "Which truth about Jesus in this passage most strengthens or challenges your understanding of Him today?",
        prayer: "Lord Jesus, help me see You truly and receive Your grace and truth.",
        gentleAction: "Read verse 14 aloud and thank God that Jesus came near.",
        studyMethod: "OIA"
      })],
      ["1 Corinthians 15:1-8", "1 Corinthians", 15, "The cross and resurrection", guidedDevotional({
        title: "The gospel of first importance",
        context: "Paul writes to the Corinthians to remind them of the gospel they received and in which they stand. Christ's death for sins, burial, resurrection on the third day, and appearances to witnesses are matters of first importance, not optional extras for mature believers only.",
        body: "The cross and resurrection are not advanced topics for later; they are the foundation. Jesus' death deals with sin, and His resurrection announces living hope. Faith rests on what Christ has done, not on your ability to earn God's acceptance.",
        observationQuestion: "What events does Paul call central to the gospel?",
        reflectionQuestion: "How does Christ's finished work steady you more than religious performance?",
        prayer: "Lord Jesus, thank You for dying for sins and rising again. Ground my faith in Your finished work.",
        gentleAction: "Summarize the gospel from this passage in one sentence.",
        studyMethod: "SOAP"
      })],
      ["Ephesians 2:1-10", "Ephesians", 2, "Saved by grace through faith", guidedDevotional({
        title: "Grace, not earning",
        context: "Ephesians 2 moves from spiritual death to God's rich mercy and saving grace. Paul insists salvation is by grace through faith, not works, then immediately says believers are created in Christ for good works. Grace is the root; obedient life is the fruit.",
        body: "This passage protects new believers from both pride and despair. Salvation is God's gift, received by faith, not a wage earned by performance. Good works matter, but they flow from grace; they are not the basis of being saved.",
        observationQuestion: "What does Paul say salvation is, and what does he say it is not?",
        reflectionQuestion: "When are you tempted to measure God's acceptance by your performance? How do verses 8-9 answer that temptation?",
        prayer: "God of mercy, help me rest in Your grace and walk in the good works You prepare.",
        gentleAction: "Write the phrase 'by grace through faith' somewhere you will see it today.",
        studyMethod: "Inductive"
      })],
      ["Romans 8:1-4", "Romans", 8, "New life and assurance in Christ", guidedDevotional({
        title: "No condemnation",
        context: "Romans 8 follows Paul's account of sin's struggle and opens with assurance for those in Christ Jesus. God has dealt with sin through His Son, and the Spirit now leads believers into a new way of life. Assurance begins with Christ's work before personal progress.",
        body: "New life begins under the word 'no condemnation.' This does not make sin unimportant; it means Christ has answered condemnation so the Spirit can lead believers into life. Assurance looks to Christ before it looks at your progress.",
        observationQuestion: "What has God done through His Son that the law could not do?",
        reflectionQuestion: "Where are you carrying guilt or shame? How does Romans 8:1 direct you to look to Christ?",
        prayer: "Father, help me stand in Christ's mercy and walk by the Spirit.",
        gentleAction: "When guilt or shame rises, read Romans 8:1 again. Ask whether you need to receive Christ's assurance, confess honestly, make an appropriate repair, or seek trusted support.",
        studyMethod: "SOAP"
      })],
      ["Matthew 6:5-13", "Matthew", 6, "Prayer and relationship with God", guidedDevotional({
        title: "Pray to your Father",
        context: "Jesus teaches this prayer in the Sermon on the Mount, contrasting hidden devotion before the Father with religious performance for human praise. The Lord's Prayer trains new disciples to begin with God's name, kingdom, and will, then bring daily needs, forgiveness, and deliverance.",
        body: "Prayer is relationship before it is technique. Jesus teaches you to come to the Father with worship, dependence, confession, and trust. You do not need impressive words to begin; you need the Father who hears.",
        observationQuestion: "What needs does Jesus teach His disciples to bring to the Father?",
        reflectionQuestion: "Which line of the Lord's Prayer helps you begin praying today?",
        prayer: "Father, teach me to pray with honesty, dependence, and trust.",
        gentleAction: "Pray the Lord's Prayer slowly in your own words.",
        studyMethod: "Lectio Divina"
      })],
      ["Galatians 5:16-25", "Galatians", 5, "Life through the Holy Spirit", guidedDevotional({
        title: "Walk by the Spirit",
        context: "Galatians 5 follows Paul's defense of freedom in Christ. That freedom is not self-rule but life by the Spirit, where the works of the flesh are resisted and the Spirit bears fruit in love, joy, peace, patience, holiness, and self-control.",
        body: "The Christian life is not self-improvement by sheer willpower. Believers are called to walk by the Spirit. The fruit listed here grows from God's work in us, shaping love, joy, peace, patience, and holiness over time.",
        observationQuestion: "What fruit does Paul say the Spirit produces?",
        reflectionQuestion: "Which fruit of the Spirit do you want to ask God to grow in you?",
        prayer: "Father, lead me by Your Spirit today and grow the Spirit's fruit in my life.",
        gentleAction: "Choose one fruit of the Spirit and identify one concrete way it could shape your words or actions today. Ask God to help you respond that way.",
        studyMethod: "OIA"
      })],
      ["Acts 2:42-47", "Acts", 2, "Following Jesus with His people", guidedDevotional({
        title: "A shared life of faith",
        context: "Acts 2 follows Pentecost, Peter's sermon, and the response of those who received the word about the risen Christ. Luke then summarizes the early believers' shared life: apostolic teaching, fellowship, breaking bread, prayer, generosity, worship, and witness.",
        body: "Jesus saves people into a family, not isolation. The church is not the basis of salvation, but it is one of God's gifts for growth, care, teaching, prayer, and shared witness. Following Jesus becomes a shared life of grace.",
        observationQuestion: "What practices shaped the first believers' life together?",
        reflectionQuestion: "What small step could help you follow Jesus with His people?",
        prayer: "Lord, guide me toward a faithful Christian community. Help me receive care, grow in truth, and serve others with grace.",
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
  ], "Care")), griefPastoralCareNote),
  withPastoralCareNote(withCuratedDevotionals({
    ...planFromReferences("fourteen-days-anxiety-trust", "14 Days on Anxiety and Trust", "A two-week path for worry, fear, peace, and dependence on God.", [
      ["Psalm 23:1-4", "Psalms", 23, "The Shepherd is near"],
      ["Psalm 27:1-5", "Psalms", 27, "The Lord is my light"],
      ["Psalm 46:1-11", "Psalms", 46, "God is refuge and ruler", psalm46StillBeforeGodDevotional],
      ["Psalm 91:1-4", "Psalms", 91, "Shelter of the Most High"],
      ["Isaiah 26:3-4", "Isaiah", 26, "Perfect peace"],
      ["Isaiah 41:8-13", "Isaiah", 41, "God holds His servant"],
      ["Matthew 6:25-34", "Matthew", 6, "Seek first the kingdom"],
      ["Matthew 11:28-30", "Matthew", 11, "Rest for your soul"],
      ["John 14:25-27", "John", 14, "My peace I give"],
      ["Romans 8:31-39", "Romans", 8, "Nothing can separate"],
      ["Philippians 4:4-9", "Philippians", 4, "Peace that guards"],
      ["Colossians 3:12-17", "Colossians", 3, "Let peace rule"],
      ["1 Peter 5:6-11", "1 Peter", 5, "Cast your cares"],
      ["1 John 4:13-19", "1 John", 4, "Perfect love"]
    ], "Care"),
    purpose: "To help anxious readers meet worry and fear with Scripture-shaped trust in God's character, care, presence, kingdom, and love in Christ.",
    bestFor: "Readers seeking a gentle two-week path through worry and fear without shame, simplistic promises, or pressure."
  }), anxietyPastoralCareNote),
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
        context: "Psalm 23 is a Davidic psalm using shepherd imagery for the Lord's provision, guidance, and protection. The opening verses include both restful places and the valley of deep darkness. Comfort rests on the Shepherd's presence with His sheep, not on pretending the valley is harmless.",
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
        context: "Psalm 46 is a communal Song of Zion that names instability in creation and nations, then anchors hope in the Lord of hosts who is with His people. The refuge language is not a promise that trouble is imaginary, but a confession that God's presence is stronger than what shakes.",
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
        context: "Isaiah 26 is a song of trust within Isaiah's vision of judgment and restoration. The peace described belongs to the people who trust the Lord while waiting for His vindication. It is not first a private calm technique, but a confession that lasting security rests in the everlasting Rock.",
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
        context: "These words are part of the Sermon on the Mount and follow Jesus' warning that no one can serve both God and money. Jesus speaks to disciples tempted to be consumed by food, clothing, and tomorrow's needs. He calls them to seek the Father's kingdom first while facing each day's real trouble.",
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
        context: "In Matthew 11 Jesus has just spoken of the Father revealing the Son to the humble rather than the self-sufficient. He invites the weary and burdened to come to Him, take His yoke, and learn from His gentle and humble heart. The rest He gives is discipleship under the gentle Messiah, not escape from all responsibility.",
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
        context: "Jesus speaks these words in the Farewell Discourse before the cross. The disciples are troubled by His departure, and He promises the Spirit will teach them and remind them of His words. His peace is not worldly ease, but His own gift to troubled disciples.",
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
        context: "Paul writes from prison to a beloved church and has just urged Euodia and Syntyche toward unity. These commands are given to the community: rejoice in the Lord, show gentleness, pray with thanksgiving, think on what is true, and practice what they received. The peace of God guards believers in Christ as they live this shared pattern.",
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
        context: "Peter writes to scattered Christians facing social pressure and suffering. After instructing elders and the community in humility, he calls believers to humble themselves under God, cast anxieties on Him, and resist the devil together. The promise is God's final restoration after suffering, not a denial that suffering is real.",
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
        context: "Psalm 13 is a Davidic lament moving from repeated 'How long?' questions to petition and trust. It gives grief truthful speech before God rather than rushing it into resolution. The final trust grows within lament, not by pretending sorrow is gone.",
        body: "This Psalm gives grief permission to speak honestly. Faith does not have to rush past 'How long?' The movement toward trust is real, but it does not erase the ache. Biblical lament brings sorrow into relationship with God.",
        observationQuestion: "What honest questions does David bring to God?",
        reflectionQuestion: "What sorrow can you bring to God without pretending it is small?",
        prayer: "Lord, receive my lament and help me trust Your steadfast love in Your time.",
        gentleAction: "Write one honest sentence of lament to God.",
        studyMethod: "SOAP",
        careNote: griefPastoralCareNote
      })],
      ["Psalm 34:17-22", "Psalms", 34, "Near the brokenhearted", guidedDevotional({
        title: "The Lord is near",
        context: "Psalm 34 is an acrostic wisdom psalm tied to David's deliverance. These verses speak generally of the Lord's nearness to the righteous and His care for the brokenhearted. They comfort sufferers without promising a pain-free life; the psalm holds affliction and deliverance together.",
        body: "The Psalm does not say God's people avoid affliction. It says the Lord hears and is near to the brokenhearted. Comfort begins with God's presence in real pain, not with a demand that pain disappear quickly.",
        observationQuestion: "What does the Lord do for the brokenhearted and afflicted?",
        reflectionQuestion: "Where do you need to believe that the Lord is near, not distant?",
        prayer: "Lord, be near to me in brokenness and save me with Your mercy.",
        gentleAction: "Read verse 18 slowly and let it name God's nearness.",
        studyMethod: "Lectio Divina",
        careNote: griefPastoralCareNote
      })],
      ["Psalm 42:5-11", "Psalms", 42, "Hope in God", guidedDevotional({
        title: "Speak hope to the downcast soul",
        context: "Psalm 42 is a Korahite lament from a worshiper longing for God while feeling far from the sanctuary. The refrain addresses the soul directly: 'Why are you downcast?' and calls it to hope in God. The passage names spiritual thirst and turmoil while still turning toward praise.",
        body: "The Psalmist does not scold sadness away. He speaks to his soul and calls it toward hope while turmoil remains. Grief may keep speaking, and faith may need to answer again and again with remembrance of God.",
        observationQuestion: "What words or images show the Psalmist's inner turmoil?",
        reflectionQuestion: "Where does your downcast soul need hope in God to speak louder than grief today?",
        prayer: "Lord, help me hope in You while my soul is still unsettled.",
        gentleAction: "Choose one truth about God to repeat when grief feels loud.",
        studyMethod: "OIA",
        careNote: griefPastoralCareNote
      })],
      ["Isaiah 40:27-31", "Isaiah", 40, "Strength renewed", guidedDevotional({
        title: "The weary are not forgotten",
        context: "Isaiah 40 opens the comfort section addressed to weary exiles who wonder whether their way is hidden from the Lord. The prophet contrasts human weakness with the Creator's inexhaustible strength. Waiting on the Lord is covenant trust in His renewing power, not a guarantee that fatigue instantly vanishes.",
        body: "God does not shame His weary people. He reminds them that He is everlasting, wise, and generous with strength. Waiting on the Lord is not a timetable for grief; it is dependence on the God whose compassion does not run out.",
        observationQuestion: "What does Isaiah say about God's strength and understanding?",
        reflectionQuestion: "Where are you weary enough to need strength only God can give?",
        prayer: "Everlasting God, renew my strength as I wait for You.",
        gentleAction: "Rest from one unnecessary demand today if you are able.",
        studyMethod: "COMA",
        careNote: griefPastoralCareNote
      })],
      ["John 11:32-44", "John", 11, "Jesus wept", guidedDevotional({
        title: "Tears and resurrection hope",
        context: "John 11 narrates Jesus at Lazarus's tomb before His own death and resurrection. Mary and Martha grieve, and Jesus is deeply moved even though He will raise Lazarus. The sign reveals Jesus as resurrection and life while honoring the real sorrow of death.",
        body: "Jesus' tears matter. He does not stand outside grief with cold answers; He enters the sorrow of those He loves. At the same time, He is the resurrection and the life. Christian comfort holds tears and hope together without forcing one to cancel the other.",
        observationQuestion: "How does Jesus respond before He calls Lazarus from the tomb?",
        reflectionQuestion: "What grief needs both the compassion of Jesus and the hope of His life?",
        prayer: "Lord Jesus, meet me in grief and keep me near the resurrection life that is in You.",
        gentleAction: "If helpful, tell a trusted person one specific way grief is affecting you today.",
        studyMethod: "Inductive",
        careNote: griefPastoralCareNote
      })],
      ["2 Corinthians 1:3-7", "2 Corinthians", 1, "God of all comfort", guidedDevotional({
        title: "Comfort received and shared",
        context: "Paul opens 2 Corinthians by blessing God for comfort received in affliction. His suffering and comfort are tied to apostolic ministry and shared with the church. The passage teaches that God's comfort equips believers to comfort others, not that faithful people avoid affliction.",
        body: "Suffering is not good in itself, and Paul does not pretend it is. Yet God's mercy is active in affliction. Comfort received from Him can one day become gentle comfort offered to someone else, without minimizing their pain.",
        observationQuestion: "What names does Paul use for God in this passage?",
        reflectionQuestion: "Where do you need to receive comfort before trying to explain anything?",
        prayer: "Father of mercies, comfort me and make me gentle with others in pain.",
        gentleAction: "Receive care today before trying to be strong for everyone else.",
        studyMethod: "SOAP",
        careNote: griefPastoralCareNote
      })],
      ["Revelation 21:1-5", "Revelation", 21, "Every tear wiped away", guidedDevotional({
        title: "The final comfort",
        context: "Revelation 21 follows visions of judgment with the new heaven and new earth. John sees God dwelling with His people and finally removing death, mourning, crying, and pain. This is future consummation hope, not a denial of present grief.",
        body: "Revelation does not trivialize present grief. It gives grief a final horizon: God Himself will wipe away every tear. Present comfort is real, but final restoration is still ahead. Sorrow will not have the last word.",
        observationQuestion: "What does God promise will be gone in the new creation?",
        reflectionQuestion: "What tear needs to be held before the God who will make all things new?",
        prayer: "Lord, keep my hope fixed on the day when You wipe every tear away.",
        gentleAction: "Let today's hope be small and honest: name one thing God will make new.",
        studyMethod: "Lectio Divina",
        careNote: griefPastoralCareNote
      })]
    ], "Care"),
    purpose: "To give sorrow a faithful place to speak, lament, receive comfort, and wait for the God who will make all things new.",
    bestFor: "Readers grieving loss, carrying sadness, or needing gentle Scripture without rushed emotional resolution.",
    estimatedTime: "7-12 minutes",
    careNote: griefPastoralCareNote
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
  withCuratedDevotionals(planFromReferences("chronological-overview", "Chronological Bible Overview", "A broad overview of the Bible story in historical flow.", [
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
  ], "Overview")),
  withBookSectionGuidance({
    ...buildChapterPlan("old-testament-overview", "Old Testament Overview in 60 Days", "A broad chapter-by-chapter overview of the Old Testament.", OLD_TESTAMENT_BOOKS, 60, "Overview"),
    purpose: "To help readers follow the Old Testament's major movements of creation, covenant, promise, kingdom, exile, wisdom, prophecy, judgment, and hope.",
    bestFor: "Readers who want Old Testament orientation before detailed book study.",
    pace: "Intensive overview readings",
    estimatedTime: "30-50 minutes",
    rhythm: "Read for the movement of the book, notice covenant setting and repeated themes, then write one question for later study."
  }),
  withBookSectionGuidance({
    ...buildChapterPlan("new-testament-overview", "New Testament Overview", "A broad chapter-by-chapter overview of the New Testament.", NEW_TESTAMENT_BOOKS, 30, "Overview"),
    purpose: "To help readers see the New Testament's flow from Jesus' ministry to the church's witness, apostolic teaching, and final hope.",
    bestFor: "Readers who want a broad New Testament orientation before slower study.",
    pace: "Steady daily readings",
    estimatedTime: "20-35 minutes",
    rhythm: "Read for how each section bears witness to Christ, forms His people, and calls for faithful response."
  })
]);

export const bibleReadingPlans = builtInBibleReadingPlans;
