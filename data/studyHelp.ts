type BibleTranslationId = "bsb" | "web" | "kjv";

export function buildStudyHelpLinks(reference: string, translation: BibleTranslationId) {
  const parsedReference = parseStudyHelpReference(reference || "Psalm 23");
  const encoded = encodeURIComponent(parsedReference || "Psalm 23");
  const helpVersion = translation.toUpperCase();

  return [
    {
      title: "Bible Hub passage",
      description: "Open this passage on Bible Hub in your selected translation where available.",
      icon: "reader-outline",
      url: buildBibleHubPassageUrl(parsedReference, translation)
    },
    {
      title: "Enduring Word commentary",
      description: "Modern, free chapter commentary with pastoral explanation and application.",
      icon: "book-outline",
      url: buildEnduringWordCommentaryUrl(parsedReference)
    },
    {
      title: "Bible Hub commentaries",
      description: "Compare multiple free online commentaries.",
      icon: "albums-outline",
      url: buildBibleHubCommentaryUrl(parsedReference)
    },
    {
      title: "BibleProject book guide",
      description: "See the book's structure, themes, and place in the Bible story.",
      icon: "library-outline",
      url: buildBibleProjectBookGuideUrl(parsedReference)
    },
    {
      title: "STEP Bible",
      description: "Explore words, themes, and nearby context.",
      icon: "search-outline",
      url: `https://www.stepbible.org/?q=version=${helpVersion}|reference=${encoded}`
    }
  ];
}

function buildBibleHubCommentaryUrl(reference: string) {
  const parsed = getStudyHelpReferenceParts(reference);
  if (!parsed) return "https://biblehub.com/commentaries/";

  const book = bibleHubBookSlug(parsed.book);
  const chapter = String(parsed.chapter);
  const verse = parsed.verse ? String(parsed.verse) : "1";
  return `https://biblehub.com/commentaries/${book}/${chapter}-${verse}.htm`;
}

function buildBibleHubPassageUrl(reference: string, translation: BibleTranslationId) {
  const parsedReference = parseStudyHelpReference(reference || "Psalm 23");
  const parsed = getStudyHelpReferenceParts(parsedReference);
  if (!parsed) return `https://biblehub.com/${translation}/`;

  const book = bibleHubBookSlug(parsed.book);
  const chapter = String(parsed.chapter);
  const verse = parsed.verse ? String(parsed.verse) : "";
  if (!verse) return `https://biblehub.com/p/${translation}/${translation}/${book}/${chapter}.shtml`;

  return `https://biblehub.com/${book}/${chapter}-${verse}.htm`;
}

function buildEnduringWordCommentaryUrl(reference: string) {
  const parsed = getStudyHelpReferenceParts(reference);
  if (!parsed) return "https://enduringword.com/commentary/";

  return `https://enduringword.com/bible-commentary/${enduringWordBookSlug(parsed.book)}-${parsed.chapter}/`;
}

function buildBibleProjectBookGuideUrl(reference: string) {
  const parsed = getStudyHelpReferenceParts(reference);
  if (!parsed) return "https://bibleproject.com/guides/";

  return `https://bibleproject.com/guides/book-of-${bibleProjectBookSlug(parsed.book)}/`;
}

function parseStudyHelpReference(reference: string) {
  const compact = reference.trim().replace(/\s+/g, " ");
  if (!compact) return "";

  return compact
    .replace(/\s*:\s*/g, ":")
    .replace(/\s*-\s*/g, "-")
    .replace(/^Psalms\b/i, "Psalm");
}

function getStudyHelpReferenceParts(reference: string) {
  const parsed = parseStudyHelpReference(reference).match(/^(.+?)\s+(\d+)(?::(\d+))?/);
  if (!parsed) return null;

  return {
    book: parsed[1],
    chapter: Number(parsed[2]),
    verse: parsed[3] ? Number(parsed[3]) : 0
  };
}

function bibleHubBookSlug(book: string) {
  const normalized = book.trim().replace(/^Psalm$/i, "Psalms");
  return normalized.toLowerCase().replace(/\s+/g, "_");
}

function enduringWordBookSlug(book: string) {
  const normalized = book.trim().replace(/^Psalms$/i, "Psalm");
  return normalized.toLowerCase().replace(/\s+/g, "-");
}

function bibleProjectBookSlug(book: string) {
  const normalized = book.trim().replace(/^Psalm$/i, "Psalms");
  const overrides: Record<string, string> = {
    "Song of Solomon": "song-of-songs"
  };
  return (overrides[normalized] || normalized).toLowerCase().replace(/\s+/g, "-");
}
