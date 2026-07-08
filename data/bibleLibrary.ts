import { bibleBooks } from "@/data/bibleBooks";

export { bibleBooks };

export const BIBLE_CHAPTER_COUNTS: Record<string, number> = {
  Genesis: 50, Exodus: 40, Leviticus: 27, Numbers: 36, Deuteronomy: 34, Joshua: 24, Judges: 21, Ruth: 4,
  "1 Samuel": 31, "2 Samuel": 24, "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36,
  Ezra: 10, Nehemiah: 13, Esther: 10, Job: 42, Psalms: 150, Proverbs: 31, Ecclesiastes: 12, "Song of Solomon": 8,
  Isaiah: 66, Jeremiah: 52, Lamentations: 5, Ezekiel: 48, Daniel: 12, Hosea: 14, Joel: 3, Amos: 9, Obadiah: 1,
  Jonah: 4, Micah: 7, Nahum: 3, Habakkuk: 3, Zephaniah: 3, Haggai: 2, Zechariah: 14, Malachi: 4,
  Matthew: 28, Mark: 16, Luke: 24, John: 21, Acts: 28, Romans: 16, "1 Corinthians": 16, "2 Corinthians": 13,
  Galatians: 6, Ephesians: 6, Philippians: 4, Colossians: 4, "1 Thessalonians": 5, "2 Thessalonians": 3,
  "1 Timothy": 6, "2 Timothy": 4, Titus: 3, Philemon: 1, Hebrews: 13, James: 5, "1 Peter": 5, "2 Peter": 3,
  "1 John": 5, "2 John": 1, "3 John": 1, Jude: 1, Revelation: 22
};

export const BIBLE_BOOK_ALIASES: Record<string, string> = {
  gen: "Genesis", ge: "Genesis", ex: "Exodus", exo: "Exodus", lev: "Leviticus", le: "Leviticus", num: "Numbers", nu: "Numbers",
  deut: "Deuteronomy", de: "Deuteronomy", dt: "Deuteronomy", josh: "Joshua", jos: "Joshua", judg: "Judges", jdg: "Judges",
  ruth: "Ruth", ru: "Ruth", "1sam": "1 Samuel", "1 sam": "1 Samuel", "1sa": "1 Samuel", "1 sa": "1 Samuel",
  "2sam": "2 Samuel", "2 sam": "2 Samuel", "2sa": "2 Samuel", "2 sa": "2 Samuel", "1ki": "1 Kings", "1 ki": "1 Kings",
  "1kgs": "1 Kings", "1 kgs": "1 Kings", "1king": "1 Kings", "1 king": "1 Kings", "2ki": "2 Kings", "2 ki": "2 Kings",
  "2kgs": "2 Kings", "2 kgs": "2 Kings", "2king": "2 Kings", "2 king": "2 Kings", "1chron": "1 Chronicles",
  "1 chron": "1 Chronicles", "1chr": "1 Chronicles", "1 chr": "1 Chronicles", "1ch": "1 Chronicles", "1 ch": "1 Chronicles",
  "2chron": "2 Chronicles", "2 chron": "2 Chronicles", "2chr": "2 Chronicles", "2 chr": "2 Chronicles", "2ch": "2 Chronicles",
  "2 ch": "2 Chronicles", ezra: "Ezra", ezr: "Ezra", neh: "Nehemiah", est: "Esther", job: "Job", ps: "Psalm",
  psa: "Psalm", psm: "Psalm", psalm: "Psalm", psalms: "Psalm", prov: "Proverbs", pro: "Proverbs", pr: "Proverbs",
  ecc: "Ecclesiastes", eccl: "Ecclesiastes", song: "Song of Solomon", sos: "Song of Solomon", "song sol": "Song of Solomon",
  "song of sol": "Song of Solomon", isa: "Isaiah", is: "Isaiah", jer: "Jeremiah", lam: "Lamentations", ezek: "Ezekiel",
  eze: "Ezekiel", ezk: "Ezekiel", dan: "Daniel", hos: "Hosea", obad: "Obadiah", mic: "Micah", nah: "Nahum",
  hab: "Habakkuk", zeph: "Zephaniah", zep: "Zephaniah", hag: "Haggai", zech: "Zechariah", zec: "Zechariah",
  mal: "Malachi", matt: "Matthew", mt: "Matthew", mrk: "Mark", mk: "Mark", lk: "Luke", jn: "John", joh: "John",
  ac: "Acts", rom: "Romans", ro: "Romans", "1cor": "1 Corinthians", "1 cor": "1 Corinthians", "1co": "1 Corinthians",
  "1 co": "1 Corinthians", "2cor": "2 Corinthians", "2 cor": "2 Corinthians", "2co": "2 Corinthians", "2 co": "2 Corinthians",
  gal: "Galatians", ga: "Galatians", eph: "Ephesians", phil: "Philippians", php: "Philippians", col: "Colossians",
  "1thes": "1 Thessalonians", "1 thes": "1 Thessalonians", "1thess": "1 Thessalonians", "1 thess": "1 Thessalonians",
  "1th": "1 Thessalonians", "1 th": "1 Thessalonians", "2thes": "2 Thessalonians", "2 thes": "2 Thessalonians",
  "2thess": "2 Thessalonians", "2 thess": "2 Thessalonians", "2th": "2 Thessalonians", "2 th": "2 Thessalonians",
  "1tim": "1 Timothy", "1 tim": "1 Timothy", "1ti": "1 Timothy", "1 ti": "1 Timothy", "2tim": "2 Timothy",
  "2 tim": "2 Timothy", "2ti": "2 Timothy", "2 ti": "2 Timothy", tit: "Titus", philem: "Philemon", phm: "Philemon",
  heb: "Hebrews", jas: "James", jam: "James", "1pet": "1 Peter", "1 pet": "1 Peter", "1pe": "1 Peter",
  "1 pe": "1 Peter", "2pet": "2 Peter", "2 pet": "2 Peter", "2pe": "2 Peter", "2 pe": "2 Peter", "1jn": "1 John",
  "1 jn": "1 John", "1john": "1 John", "1 john": "1 John", "2jn": "2 John", "2 jn": "2 John", "2john": "2 John",
  "2 john": "2 John", "3jn": "3 John", "3 jn": "3 John", "3john": "3 John", "3 john": "3 John", rev: "Revelation",
  revelation: "Revelation"
};

export const OLD_TESTAMENT_BOOKS = bibleBooks.slice(0, bibleBooks.indexOf("Matthew"));
export const NEW_TESTAMENT_BOOKS = bibleBooks.slice(bibleBooks.indexOf("Matthew"));

export const BSB_BOOK_IDS: Record<string, string> = {
  Genesis: "GEN", Exodus: "EXO", Leviticus: "LEV", Numbers: "NUM", Deuteronomy: "DEU", Joshua: "JOS", Judges: "JDG", Ruth: "RUT",
  "1 Samuel": "1SA", "2 Samuel": "2SA", "1 Kings": "1KI", "2 Kings": "2KI", "1 Chronicles": "1CH", "2 Chronicles": "2CH",
  Ezra: "EZR", Nehemiah: "NEH", Esther: "EST", Job: "JOB", Psalm: "PSA", Proverbs: "PRO", Ecclesiastes: "ECC",
  "Song of Solomon": "SNG", Isaiah: "ISA", Jeremiah: "JER", Lamentations: "LAM", Ezekiel: "EZK", Daniel: "DAN", Hosea: "HOS",
  Joel: "JOL", Amos: "AMO", Obadiah: "OBA", Jonah: "JON", Micah: "MIC", Nahum: "NAM", Habakkuk: "HAB", Zephaniah: "ZEP",
  Haggai: "HAG", Zechariah: "ZEC", Malachi: "MAL", Matthew: "MAT", Mark: "MRK", Luke: "LUK", John: "JHN", Acts: "ACT",
  Romans: "ROM", "1 Corinthians": "1CO", "2 Corinthians": "2CO", Galatians: "GAL", Ephesians: "EPH", Philippians: "PHP",
  Colossians: "COL", "1 Thessalonians": "1TH", "2 Thessalonians": "2TH", "1 Timothy": "1TI", "2 Timothy": "2TI", Titus: "TIT",
  Philemon: "PHM", Hebrews: "HEB", James: "JAS", "1 Peter": "1PE", "2 Peter": "2PE", "1 John": "1JN", "2 John": "2JN",
  "3 John": "3JN", Jude: "JUD", Revelation: "REV"
};

export function normalizeBibleBookName(bookName: string) {
  return bookName === "Psalms" ? "Psalm" : bookName;
}

export function displayBibleBookName(bookName: string) {
  return bookName === "Psalm" ? "Psalms" : bookName;
}

export function flattenBsbVerseContent(content: any[]) {
  return (content || [])
    .map((piece) => {
      if (typeof piece === "string") return piece;
      if (typeof piece?.text === "string") return piece.text;
      if (typeof piece?.heading === "string") return piece.heading;
      if (piece?.lineBreak) return " ";
      return "";
    })
    .filter(Boolean)
    .join(" ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/(["'(\[])\s+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
