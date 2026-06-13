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
      title: "Matthew Henry Concise",
      description: "Public-domain devotional commentary source.",
      icon: "book-outline",
      url: "https://crosswire.org/sword/modules/ModInfo.jsp?modName=MHCC"
    },
    {
      title: "Treasury cross references",
      description: "Find related passages before application.",
      icon: "git-branch-outline",
      url: `https://www.openbible.info/labs/cross-references/?q=${encoded}`
    },
    {
      title: "Bible Hub commentaries",
      description: "Compare multiple free online commentaries.",
      icon: "albums-outline",
      url: buildBibleHubCommentaryUrl(parsedReference)
    },
    {
      title: "CCEL Matthew Henry",
      description: "Public-domain full commentary library.",
      icon: "library-outline",
      url: "https://www.ccel.org/ccel/henry/mhc"
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
  const parsed = parseStudyHelpReference(reference).match(/^(.+?)\s+(\d+)(?::(\d+))?/);
  if (!parsed) return "https://biblehub.com/commentaries/";

  const book = bibleHubBookSlug(parsed[1]);
  const chapter = parsed[2];
  const verse = parsed[3] || "1";
  return `https://biblehub.com/commentaries/${book}/${chapter}-${verse}.htm`;
}

function buildBibleHubPassageUrl(reference: string, translation: BibleTranslationId) {
  const parsedReference = parseStudyHelpReference(reference || "Psalm 23");
  const parsed = parsedReference.match(/^(.+?)\s+(\d+)(?::(\d+))?/);
  if (!parsed) return `https://biblehub.com/${translation}/`;

  const book = bibleHubBookSlug(parsed[1]);
  const chapter = parsed[2];
  const verse = parsed[3];
  if (!verse) return `https://biblehub.com/p/${translation}/${translation}/${book}/${chapter}.shtml`;

  return `https://biblehub.com/${book}/${chapter}-${verse}.htm`;
}

function parseStudyHelpReference(reference: string) {
  const compact = reference.trim().replace(/\s+/g, " ");
  if (!compact) return "";

  return compact
    .replace(/\s*:\s*/g, ":")
    .replace(/\s*-\s*/g, "-")
    .replace(/^Psalms\b/i, "Psalm");
}

function bibleHubBookSlug(book: string) {
  const normalized = book.trim().replace(/^Psalm$/i, "Psalms");
  return normalized.toLowerCase().replace(/\s+/g, "_");
}
