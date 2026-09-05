import { parseBsbPassageReference, type BibleVerse } from "@/data/biblePassage";
import { fetchWithTimeout } from "@/data/network";

export type StudyContextReference = {
  reference: string;
  selectedReference: string;
};

export type StudyCrossReference = {
  reference: string;
  title: string;
  reason: string;
  source?: "curated" | "crossreferences.org";
};

const CONTEXT_VERSES_BEFORE = 2;
const CONTEXT_VERSES_AFTER = 3;
// Bump when the generated cross-reference corpus changes so immutable browser caches receive the new files.
const CROSS_REFERENCE_ASSET_VERSION = "2026-09-05";

const CROSS_REFERENCE_SETS: { anchor: string; references: StudyCrossReference[] }[] = [
  {
    anchor: "Acts 1:8",
    references: [
      { reference: "Luke 24:46-49", title: "Promise and witness", reason: "Jesus connects witness with the promised power from above." },
      { reference: "Matthew 28:18-20", title: "The commission", reason: "Jesus sends His disciples to make disciples of all nations." },
      { reference: "Acts 2:1-4", title: "Power given", reason: "The Spirit comes and equips the church for witness." }
    ]
  },
  {
    anchor: "Psalm 23",
    references: [
      { reference: "John 10:11-15", title: "The good Shepherd", reason: "Jesus describes Himself as the Shepherd who gives His life for the sheep." },
      { reference: "Ezekiel 34:11-16", title: "God shepherds His people", reason: "The Lord promises to seek, gather, and care for His flock." },
      { reference: "Psalm 80:1", title: "Shepherd of Israel", reason: "A prayer that addresses God as the Shepherd who leads His people." }
    ]
  },
  {
    anchor: "Proverbs 3:5-6",
    references: [
      { reference: "Psalm 37:3-5", title: "Trust and commit", reason: "Trusting the Lord is joined to committing your way to Him." },
      { reference: "Jeremiah 17:7-8", title: "Blessed trust", reason: "Trust in the Lord is pictured as a fruitful, well-watered life." },
      { reference: "James 1:5", title: "Ask for wisdom", reason: "God gives wisdom generously to those who ask Him." }
    ]
  },
  {
    anchor: "Romans 8:1",
    references: [
      { reference: "John 3:17-18", title: "No condemnation", reason: "Jesus came to save, and the one who believes in Him is not condemned." },
      { reference: "Romans 5:1", title: "Peace with God", reason: "Justification by faith brings peace with God through Christ." },
      { reference: "2 Corinthians 5:17", title: "New creation", reason: "Those in Christ are made new." }
    ]
  },
  {
    anchor: "Romans 12:1-2",
    references: [
      { reference: "1 Peter 1:14-16", title: "Holy living", reason: "God calls His people to holiness rather than conformity." },
      { reference: "Ephesians 4:22-24", title: "Renewed mind", reason: "The new self is connected to renewal in the spirit of the mind." },
      { reference: "Colossians 3:1-4", title: "Set your mind", reason: "Believers are called to seek and set their minds on things above." }
    ]
  },
  {
    anchor: "Matthew 28:18-20",
    references: [
      { reference: "Acts 1:8", title: "Witnesses sent", reason: "The risen Jesus sends His people in the Spirit's power." },
      { reference: "Mark 16:15", title: "Proclaim the gospel", reason: "The mission is described as proclaiming good news broadly." },
      { reference: "2 Timothy 2:2", title: "Entrust to others", reason: "Faithful teaching is passed on so others can teach also." }
    ]
  },
  {
    anchor: "Philippians 4:6-7",
    references: [
      { reference: "Matthew 6:25-34", title: "Do not worry", reason: "Jesus calls His people to trust the Father's care." },
      { reference: "1 Peter 5:7", title: "Cast your cares", reason: "God invites His people to cast anxiety on Him because He cares." },
      { reference: "Isaiah 26:3", title: "Perfect peace", reason: "The steadfast mind is kept in peace by trusting the Lord." }
    ]
  },
  {
    anchor: "James 1:2-8",
    references: [
      { reference: "Romans 5:3-5", title: "Suffering and hope", reason: "Trials can produce endurance, character, and hope." },
      { reference: "1 Peter 1:6-7", title: "Tested faith", reason: "Faith tested by trials is precious before God." },
      { reference: "Proverbs 2:1-6", title: "Seek wisdom", reason: "Wisdom is sought diligently and given by the Lord." }
    ]
  }
];

export function buildStudyContextReference(reference: string): StudyContextReference | null {
  const parsed = parseBsbPassageReference(reference);
  if (!parsed?.startVerse) return null;

  const selectedEnd = parsed.endVerse || parsed.startVerse;
  const contextStart = Math.max(1, parsed.startVerse - CONTEXT_VERSES_BEFORE);
  const contextEnd = selectedEnd + CONTEXT_VERSES_AFTER;

  return {
    reference: `${parsed.bookName} ${parsed.chapter}:${contextStart}-${contextEnd}`,
    selectedReference: `${parsed.bookName} ${parsed.chapter}:${parsed.startVerse}${parsed.endVerse ? `-${parsed.endVerse}` : ""}`
  };
}

export function getStudyCrossReferences(reference: string): StudyCrossReference[] {
  const parsed = parseBsbPassageReference(reference);
  if (!parsed) return [];

  const matches = CROSS_REFERENCE_SETS.find((set) => passageIncludesAnchor(parsed, set.anchor));
  return matches?.references.map((item) => ({ ...item, source: "curated" as const })) || [];
}

export async function loadStudyCrossReferences(reference: string): Promise<StudyCrossReference[]> {
  const parsed = parseBsbPassageReference(reference);
  if (!parsed) return getStudyCrossReferences(reference);

  try {
    const response = await fetchWithTimeout(`/cross-references/bsb/${assetBookName(parsed.bookName)}.json?v=${CROSS_REFERENCE_ASSET_VERSION}`, {}, 8_000);
    if (!response.ok) return getStudyCrossReferences(reference);

    const data = await response.json();
    const sourceKeys = parsed.startVerse
      ? verseKeysForRange(parsed.chapter, parsed.startVerse, parsed.endVerse || parsed.startVerse)
      : Object.keys(data?.references || {}).filter((key) => key.startsWith(`${parsed.chapter}:`));
    const seen = new Set<string>();
    const references: StudyCrossReference[] = [];

    for (const key of sourceKeys) {
      const entries = Array.isArray(data?.references?.[key]) ? data.references[key] : [];
      for (const entry of entries) {
        const target = typeof entry?.r === "string" ? entry.r : "";
        if (!target || seen.has(target)) continue;
        seen.add(target);
        references.push({
          reference: target,
          title: "Related passage",
          reason: typeof entry?.a === "string" && entry.a.trim()
            ? `Connected through “${entry.a.trim()}”.`
            : "A related passage from the Treasury of Scripture Knowledge tradition.",
          source: "crossreferences.org"
        });
      }
    }

    return mergeCrossReferences(getStudyCrossReferences(reference), references).slice(0, 12);
  } catch (error) {
    return getStudyCrossReferences(reference);
  }
}

export function isVerseWithinReference(verse: BibleVerse, reference: string) {
  const parsed = parseBsbPassageReference(reference);
  if (!parsed) return false;
  if (parsed.bookName !== verse.book_name || parsed.chapter !== verse.chapter) return false;
  if (!parsed.startVerse) return true;

  const endVerse = parsed.endVerse || parsed.startVerse;
  return verse.verse >= parsed.startVerse && verse.verse <= endVerse;
}

function passageIncludesAnchor(current: NonNullable<ReturnType<typeof parseBsbPassageReference>>, anchor: string) {
  const parsedAnchor = parseBsbPassageReference(anchor);
  if (!parsedAnchor) return false;
  if (parsedAnchor.bookName !== current.bookName || parsedAnchor.chapter !== current.chapter) return false;
  if (!parsedAnchor.startVerse) return true;
  if (!current.startVerse) return true;

  const currentEnd = current.endVerse || current.startVerse;
  const anchorStart = parsedAnchor.startVerse;
  const anchorEnd = parsedAnchor.endVerse || parsedAnchor.startVerse;
  return anchorStart <= currentEnd && anchorEnd >= current.startVerse;
}

function verseKeysForRange(chapter: number, startVerse: number, endVerse: number) {
  const first = Math.min(startVerse, endVerse);
  const last = Math.max(startVerse, endVerse);
  return Array.from({ length: last - first + 1 }, (_, index) => `${chapter}:${first + index}`);
}

function assetBookName(bookName: string) {
  return (bookName === "Psalm" ? "Psalms" : bookName).replace(/\s+/g, "-");
}

function mergeCrossReferences(primary: StudyCrossReference[], secondary: StudyCrossReference[]) {
  const seen = new Set<string>();
  const merged: StudyCrossReference[] = [];
  [...primary, ...secondary].forEach((item) => {
    if (seen.has(item.reference)) return;
    seen.add(item.reference);
    merged.push(item);
  });
  return merged;
}
