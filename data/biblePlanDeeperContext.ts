import { parseBsbPassageReference } from "@/data/biblePassage";
import type { BibleReadingPlanDay, BibleReadingPlanDeeperContext } from "@/data/bibleReadingPlanTypes";
import type { StudyCrossReference } from "@/data/studyContext";

const curatedConnectionsByReference: Record<string, BibleReadingPlanDeeperContext["connections"]> = {
  "1 Samuel 16": [
    { reference: "1 Samuel 13:14", relationship: "shared theme", note: "Samuel had already said the LORD would seek a king after His own heart; read how David's selection follows that warning." },
    { reference: "Acts 13:22-23", relationship: "later use", note: "Paul later places David within the story that leads to Jesus, while speaking to a different audience." }
  ],
  "Exodus 2": [
    { reference: "Acts 7:20-29", relationship: "later use", note: "Stephen retells Moses' early years as part of his speech about Israel's history." },
    { reference: "Hebrews 11:23-27", relationship: "later use", note: "Hebrews reflects on the faith shown around Moses' early life and choices." }
  ],
  "Matthew 6:5-13": [
    { reference: "Luke 11:1-4", relationship: "close parallel", note: "Luke also records Jesus teaching His disciples to pray; notice the setting and wording of each account." },
    { reference: "Psalm 62:8", relationship: "shared theme", note: "The psalm calls God's people to pour out their hearts before Him." }
  ],
  "Matthew 6:9-13": [
    { reference: "Luke 11:1-4", relationship: "close parallel", note: "Luke also records Jesus teaching His disciples to pray; notice the setting and wording of each account." },
    { reference: "Psalm 62:8", relationship: "shared theme", note: "The psalm calls God's people to pour out their hearts before Him." }
  ],
  "Psalm 1": [
    { reference: "Jeremiah 17:7-8", relationship: "shared theme", note: "Jeremiah also uses a tree by water, while speaking in a different setting about trust in the LORD." },
    { reference: "Matthew 7:13-14", relationship: "shared theme", note: "Jesus speaks of two ways and their outcomes; compare the images without treating them as identical." }
  ],
  "Psalm 13:1-6": [
    { reference: "Psalm 42:5-11", relationship: "shared theme", note: "Another psalm gives voice to distress while calling the soul to hope in God." },
    { reference: "Lamentations 3:19-26", relationship: "shared theme", note: "Lamentations remembers affliction and then speaks of the LORD's steadfast mercy." }
  ],
  "Psalm 23:1-4": [
    { reference: "Isaiah 40:10-11", relationship: "shared theme", note: "Isaiah pictures the LORD gathering and carrying His flock in a message of comfort." },
    { reference: "John 10:11-15", relationship: "shared theme", note: "Jesus calls Himself the good shepherd and speaks of His care for the sheep." }
  ],
  "John 1:1-14": [
    { reference: "Colossians 1:15-20", relationship: "shared theme", note: "Paul speaks of the Son's place in creation and reconciliation; read his argument as well as John's opening." },
    { reference: "Hebrews 1:1-4", relationship: "shared theme", note: "Hebrews opens by describing God's decisive revelation through His Son." }
  ],
  "John 1:9-13": [
    { reference: "1 John 3:1-3", relationship: "shared theme", note: "John celebrates the Father's love in calling believers His children." },
    { reference: "Romans 8:14-17", relationship: "shared theme", note: "Paul describes adoption and the Spirit's witness that believers are God's children." }
  ],
  "John 15:1-8": [
    { reference: "1 John 2:24-28", relationship: "shared theme", note: "John also calls believers to remain in what they heard from the beginning." },
    { reference: "Galatians 5:22-23", relationship: "shared theme", note: "Paul names the Spirit's fruit; compare it with Jesus' image of fruitfulness without merging the two settings." }
  ],
  "Luke 2": [
    { reference: "Matthew 1:18-25", relationship: "close parallel", note: "Matthew tells related events around Jesus' birth from a different angle." },
    { reference: "John 1:14", relationship: "shared theme", note: "John announces that the Word became flesh, using different language from Luke's birth narrative." }
  ],
  "Matthew 21": [
    { reference: "Mark 11:1-11", relationship: "close parallel", note: "Mark also narrates Jesus entering Jerusalem; compare the details and each Gospel's wider setting." },
    { reference: "Zechariah 9:9-10", relationship: "earlier source", note: "Matthew 21:4-5 draws on Zechariah's image of a humble king." }
  ],
  "Matthew 11:28-30": [
    { reference: "John 6:37-40", relationship: "shared theme", note: "Jesus speaks of receiving those who come to Him in John's account." },
    { reference: "Hebrews 4:9-11", relationship: "shared theme", note: "Hebrews discusses God's rest in a different argument; compare what each passage asks of its readers." }
  ],
  "Acts 2:42-47": [
    { reference: "Acts 4:32-35", relationship: "shared theme", note: "Acts gives another picture of the first believers' shared life and generosity." },
    { reference: "Hebrews 10:24-25", relationship: "shared theme", note: "Hebrews urges believers to meet and encourage one another." }
  ],
  "Acts 4": [
    { reference: "Acts 2:22-24", relationship: "shared theme", note: "Peter also proclaims Jesus' death and resurrection in an earlier speech." },
    { reference: "1 Corinthians 15:3-8", relationship: "later use", note: "Paul later summarizes the received gospel and the witnesses to Christ's resurrection." }
  ],
  "Genesis 1": [
    { reference: "Psalm 104:24-30", relationship: "shared theme", note: "The psalm praises God's wisdom and sustaining care in creation." },
    { reference: "John 1:1-5", relationship: "shared theme", note: "John's Gospel opens with creation language while introducing the Word." }
  ],
  "Genesis 3": [
    { reference: "Romans 5:12-19", relationship: "later use", note: "Paul contrasts Adam's trespass with Christ's obedience in his argument about sin and grace." },
    { reference: "Galatians 4:4-5", relationship: "shared theme", note: "Paul speaks of God's Son coming to redeem; read this as part of the wider story, not as a quotation of Genesis 3." }
  ],
  "Isaiah 53": [
    { reference: "Acts 8:30-35", relationship: "later use", note: "Philip begins with this passage when explaining the good news about Jesus." },
    { reference: "1 Peter 2:21-25", relationship: "later use", note: "Peter echoes the servant's suffering while addressing believers' conduct." }
  ],
  "John 20": [
    { reference: "Luke 24:1-12", relationship: "close parallel", note: "Luke tells of the empty tomb with different details and emphasis." },
    { reference: "1 Corinthians 15:3-8", relationship: "later use", note: "Paul summarizes the resurrection message and names witnesses to the risen Christ." }
  ],
  "Romans 1": [
    { reference: "Romans 3:21-26", relationship: "shared theme", note: "Read on in the letter to see Paul's account of God's righteousness revealed through faith in Jesus Christ." },
    { reference: "Romans 5:6-8", relationship: "shared theme", note: "Paul later describes God's love shown while people were still sinners." }
  ],
  "Romans 12": [
    { reference: "Ephesians 4:1-3", relationship: "shared theme", note: "Paul also urges a life marked by humility, patience, and love in another letter." },
    { reference: "James 1:22-25", relationship: "shared theme", note: "James presses hearers of the word toward action, using a different image and argument." }
  ],
  "Colossians 3:12-17": [
    { reference: "Ephesians 4:1-3", relationship: "shared theme", note: "Paul also speaks of humility, patience, love, and unity among believers." },
    { reference: "Philippians 4:4-9", relationship: "shared theme", note: "Paul joins prayer, thanksgiving, peace, and practiced teaching in another letter." }
  ],
  "1 Peter 1:3-9": [
    { reference: "James 1:2-4", relationship: "shared theme", note: "James also addresses faith tested by trials, with his own emphasis on steadfastness." },
    { reference: "Romans 8:18-25", relationship: "shared theme", note: "Paul places present suffering alongside future hope in a different argument." }
  ],
  "Revelation 22": [
    { reference: "Revelation 21:1-5", relationship: "shared theme", note: "The preceding vision describes God dwelling with His people and making all things new." },
    { reference: "2 Peter 3:13", relationship: "shared theme", note: "Peter also speaks of the promised new heavens and new earth." }
  ]
};

export function hasCuratedPlanConnections(reference: string) {
  return !!curatedConnectionsByReference[reference];
}

export function hasPlanDeeperContext(day: BibleReadingPlanDay, planDayCount: number) {
  return !!day.deeperContext || (planDayCount > 0 && planDayCount <= 14 && day.guidanceKind === "guided-devotional");
}

export function planContextReference(day: BibleReadingPlanDay) {
  if (day.deeperContext) return day.deeperContext.contextReference;
  const parsed = parseBsbPassageReference(day.reference);
  return parsed?.startVerse ? `${parsed.bookName} ${parsed.chapter}` : day.reference;
}

const COMMON_WORDS = new Set([
  "about", "after", "again", "also", "among", "because", "before", "being", "christ", "does", "from", "have", "into", "jesus", "john", "lord", "more", "their", "them", "there", "these", "this", "those", "through", "today", "with", "would", "your", "god", "paul", "read", "reading", "passage", "people", "believers", "chapter", "verse", "verses", "word", "words", "says", "said", "will", "what", "when", "where", "which", "while", "that", "than", "then", "they", "were", "shall", "upon", "unto", "such", "each", "every", "into", "only", "all", "and", "for", "the", "his", "her", "him", "she", "who", "you", "are", "not", "but", "its", "one", "two"
]);

function focusWords(value: string) {
  return value.toLowerCase().match(/[a-z]{3,}/g)?.filter((word) => !COMMON_WORDS.has(word)) || [];
}

export function selectPlanCrossReferences(day: BibleReadingPlanDay, suggestions: StudyCrossReference[]): BibleReadingPlanDeeperContext["connections"] {
  const curated = curatedConnectionsByReference[day.reference];
  if (curated) return curated;
  const current = parseBsbPassageReference(day.reference);
  const selected: BibleReadingPlanDeeperContext["connections"] = [];
  const usedChapters = new Set<string>();
  const titleWords = new Set(focusWords(`${day.title} ${day.devotional?.title || ""}`));
  const contextWords = new Set(focusWords(`${day.context || ""} ${day.devotional?.body || ""}`));
  const candidates = suggestions.map((suggestion, index) => {
    const target = parseBsbPassageReference(suggestion.reference);
    const anchor = focusWords(suggestion.anchor || "");
    const score = (suggestion.source === "curated" ? 100 : 0) +
      anchor.reduce((total, word) => total + (titleWords.has(word) ? 8 : contextWords.has(word) ? 3 : 0), 0) +
      Math.min(anchor.length, 5) * 0.2;
    return { suggestion, target, score, index };
  }).filter(({ target }) => target && (!current || target.bookName !== current.bookName || target.chapter !== current.chapter))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  for (const preferAnotherBook of [true, false]) {
    for (const { suggestion, target } of candidates) {
      if (!target) continue;
      const chapterKey = `${target.bookName}:${target.chapter}`;
      if (usedChapters.has(chapterKey)) continue;
      if (preferAnotherBook && selected.some((item) => parseBsbPassageReference(item.reference)?.bookName === target.bookName)) continue;
      selected.push({
        reference: suggestion.reference,
        relationship: "cross-reference",
        note: suggestion.source === "curated"
          ? suggestion.reason
          : "A cross-reference to explore. Read it in its own setting before deciding how it relates to today's passage."
      });
      usedChapters.add(chapterKey);
      if (selected.length === 2) return selected;
    }
  }
  return selected;
}
