import { readFileSync } from "node:fs";

export const studyLessons = JSON.parse(readFileSync(new URL("./study-lessons.json", import.meta.url), "utf8"));
export const studyPages = JSON.parse(readFileSync(new URL("./study-pages.json", import.meta.url), "utf8"));
export const scriptureExcerpts = JSON.parse(readFileSync(new URL("./scripture-excerpts.json", import.meta.url), "utf8"));
const translationNames = { BSB: "Berean Standard Bible", WEB: "World English Bible", KJV: "King James Version" };
const escape = (value) => String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

export function buildStudyLesson(path) {
  const guide = studyPages[path];
  if (!guide) return null;
  const lesson = studyLessons[guide.lesson];
  const excerpt = scriptureExcerpts[guide.lesson];
  if (!lesson || !excerpt || lesson.reference !== excerpt.reference || lesson.translation !== excerpt.translation) {
    throw new Error(`Missing or mismatched verified Scripture for ${path}`);
  }
  return {
    type: "journalExample",
    layout: "lesson",
    title: `${guide.title}: ${lesson.reference}`,
    intro: "Read the passage before comparing your answers with the worked notes. Each example separates what the text says, how its meaning follows from context, and one possible response. Use a Bible and paper or your preferred study tool.",
    reference: lesson.reference,
    translation: `${lesson.translation} · ${translationNames[lesson.translation]}`,
    sourceUrl: excerpt.sourceUrl,
    scriptureHtml: excerpt.verses.map(verse => `<span class="study-verse"><sup>${verse.verse}</sup> ${escape(verse.text)}</span>`).join(" "),
    notes: [
      ["Read in context", lesson.context],
      ["1. Observation · what does it say?", lesson.observation],
      ["2. Meaning · how does the context explain it?", lesson.meaning],
      ["3. Application · one possible response", lesson.application],
      [guide.title, `Try it yourself: ${guide.question}\n\n${guide.practice}`],
      ["A reading to avoid", lesson.caution],
      ["Pray and revisit", `${lesson.prayer}\n\nAfter trying your response, return to the passage: what did you learn, what did you do, and what still needs thought? You can revise your notes as your understanding grows.`]
    ]
  };
}

export function buildPracticeWorksheet(path) {
  if ((!path.includes("worksheet") && path !== "/printable-bible-study-journal") || path === "/printable-bible-word-study-worksheet") return null;
  const guide = studyPages[path];
  if (!guide) return null;
  const lesson = studyLessons[guide.lesson];
  const soap = path.includes("soap");
  return {
    type: "worksheet",
    title: soap ? "Your printable SOAP worksheet" : "Your printable study worksheet",
    eyebrow: "Bible Study Tutor · Practise the method",
    intro: `Try your own answers for ${lesson.reference} (${lesson.translation}) before comparing them with the worked study. You can reuse this blank sheet with another passage. The print button prints the worksheet.`,
    meta: ["Name (optional)", "Date", "Passage", "Translation"],
    sections: soap ? [
      { title: "S · Scripture and context", prompt: "Copy your chosen verse accurately. What comes before and after it?", lines: 5 },
      { title: "O · Observation and meaning", prompt: "What does the passage say? Include verse references, then explain what it means in context.", lines: 5 },
      { title: "A · Application", prompt: "Name one possible response. How does it follow from the passage, and when will you act on it?", lines: 4 },
      { title: "P · Prayer and follow-up", prompt: "Pray from what you learned. When will you revisit your response?", lines: 4 }
    ] : [
      { title: "Read in context", prompt: "Who is speaking, to whom, and in what situation? Read the surrounding paragraph.", lines: 3 },
      { title: "Observe", prompt: "Record three details with verse references. Notice commands, contrasts, repetitions, and connections.", lines: 4 },
      { title: "Understand", prompt: "Explain the main point and the evidence supporting it. Distinguish what is clear from what you still need to study.", lines: 4 },
      { title: "Respond", prompt: "What is one faithful response in your circumstances? Explain how it follows from the text.", lines: 3 },
      { title: "Pray and revisit", prompt: "Write a prayer, a realistic next step, and a time to return to your notes.", lines: 3 }
    ]
  };
}
