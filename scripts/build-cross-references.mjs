import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_URL = "https://raw.githubusercontent.com/CrossReferences-org/bible-cross-references/main/bsb/crossreferences_bsb.tsv";
const OUTPUT_DIR = path.join(process.cwd(), "public", "cross-references", "bsb");
const MAX_REFERENCES_PER_VERSE = 10;

const BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job",
  "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel",
  "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
  "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon",
  "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

const BOOK_ABBREVIATIONS = {
  Gen: "Genesis", Exod: "Exodus", Lev: "Leviticus", Num: "Numbers", Deut: "Deuteronomy", Josh: "Joshua", Judg: "Judges",
  Ruth: "Ruth", "1 Sam": "1 Samuel", "2 Sam": "2 Samuel", "1 Kgs": "1 Kings", "2 Kgs": "2 Kings",
  "1 Chr": "1 Chronicles", "2 Chr": "2 Chronicles", Ezra: "Ezra", Neh: "Nehemiah", Esth: "Esther", Job: "Job",
  Ps: "Psalms", Prov: "Proverbs", Eccl: "Ecclesiastes", Song: "Song of Solomon", Isa: "Isaiah", Jer: "Jeremiah",
  Lam: "Lamentations", Ezek: "Ezekiel", Dan: "Daniel", Hos: "Hosea", Joel: "Joel", Amos: "Amos", Obad: "Obadiah",
  Jonah: "Jonah", Mic: "Micah", Nah: "Nahum", Hab: "Habakkuk", Zeph: "Zephaniah", Hag: "Haggai", Zech: "Zechariah",
  Mal: "Malachi", Matt: "Matthew", Mark: "Mark", Luke: "Luke", John: "John", Acts: "Acts", Rom: "Romans",
  "1 Cor": "1 Corinthians", "2 Cor": "2 Corinthians", Gal: "Galatians", Eph: "Ephesians", Phil: "Philippians",
  Col: "Colossians", "1 Thess": "1 Thessalonians", "2 Thess": "2 Thessalonians", "1 Tim": "1 Timothy",
  "2 Tim": "2 Timothy", Titus: "Titus", Phlm: "Philemon", Heb: "Hebrews", Jas: "James", "1 Pet": "1 Peter",
  "2 Pet": "2 Peter", "1 John": "1 John", "2 John": "2 John", "3 John": "3 John", Jude: "Jude", Rev: "Revelation"
};

const SORTED_ABBREVIATIONS = Object.keys(BOOK_ABBREVIATIONS).sort((a, b) => b.length - a.length);

function normaliseBookName(book) {
  return book === "Psalm" ? "Psalms" : book;
}

function assetBookName(book) {
  return normaliseBookName(book).replace(/\s+/g, "-");
}

function parseTargetReference(rawReference) {
  const raw = rawReference.trim();
  const abbreviation = SORTED_ABBREVIATIONS.find((item) => raw === item || raw.startsWith(`${item} `));
  if (!abbreviation) return [];

  const book = BOOK_ABBREVIATIONS[abbreviation];
  const rest = raw.slice(abbreviation.length).trim();
  const match = rest.match(/^(\d+):([\d,\-]+)$/);
  if (!book || !match) return [];

  const chapter = Number(match[1]);
  const verseParts = match[2].split(",").map((item) => item.trim()).filter(Boolean);
  return verseParts
    .map((versePart) => `${book} ${chapter}:${versePart}`)
    .filter((reference) => !reference.endsWith(":"));
}

function parseSourceBook(book) {
  return BOOK_ABBREVIATIONS[book] || null;
}

function addReference(bookData, key, anchor, reference) {
  const existing = bookData[key] || [];
  if (existing.some((item) => item.r === reference)) return;
  if (existing.length >= MAX_REFERENCES_PER_VERSE) return;
  existing.push({ r: reference, a: anchor.slice(0, 80) });
  bookData[key] = existing;
}

async function main() {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Could not download cross-reference data: ${response.status} ${response.statusText}`);
  }

  const tsv = await response.text();
  const byBook = new Map(BOOKS.map((book) => [book, {}]));
  const lines = tsv.split(/\r?\n/).slice(1);

  for (const line of lines) {
    if (!line.trim()) continue;
    const [bookAbbreviation, chapterValue, verseValue, anchor = "", references = ""] = line.split("\t");
    const book = parseSourceBook(bookAbbreviation);
    const chapter = Number(chapterValue);
    const verse = Number(verseValue);
    if (!book || !chapter || !verse || !references.trim()) continue;

    const key = `${chapter}:${verse}`;
    const bookData = byBook.get(book);
    if (!bookData) continue;

    for (const rawReference of references.split("|")) {
      for (const reference of parseTargetReference(rawReference)) {
        addReference(bookData, key, anchor.trim(), reference);
      }
    }
  }

  await mkdir(OUTPUT_DIR, { recursive: true });
  for (const book of BOOKS) {
    const payload = {
      book,
      source: "CrossReferences.org Bible cross-reference data",
      license: "CC BY 4.0",
      sourceUrl: "https://github.com/CrossReferences-org/bible-cross-references",
      references: byBook.get(book) || {}
    };
    await writeFile(path.join(OUTPUT_DIR, `${assetBookName(book)}.json`), `${JSON.stringify(payload)}\n`, "utf8");
  }

  const totalVerses = Array.from(byBook.values()).reduce((sum, bookData) => sum + Object.keys(bookData).length, 0);
  console.log(`Generated cross references for ${totalVerses} source verses in ${OUTPUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
