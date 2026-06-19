export type WorksheetWritingSpace = "standard" | "more";
export type MemoryCardLayout = "pocket" | "large";

type PrintableWorksheetVerse = {
  verse: number;
  text: string;
};

type PrintableMemoryCardVerse = {
  reference: string;
  verseText: string;
  translationName?: string;
};

type PrintableWorksheetMethodStep = {
  title: string;
  prompt?: string;
  action?: string;
  responseType?: string;
};

type PrintableWorksheetMethod = {
  short: string;
  steps: PrintableWorksheetMethodStep[];
};

export function buildPrintableStudyWorksheetHtml({
  reference,
  translation,
  method,
  verses,
  writingSpace = "standard",
  includeMemory = true,
  includeInsight = true
}: {
  reference: string;
  translation: string;
  method: PrintableWorksheetMethod;
  verses: PrintableWorksheetVerse[];
  writingSpace?: WorksheetWritingSpace;
  includeMemory?: boolean;
  includeInsight?: boolean;
}) {
  const safeReference = escapeHtml(reference);
  const safeTranslation = escapeHtml(translation || "");
  const printableSteps = method.steps.filter((step) => step.responseType === "text");
  const methodLabel = `${method.short} Study Method`;
  const verseCount = verses.length;
  const passageClass = verseCount === 1 ? "single-passage" : verseCount > 10 ? "long-passage" : "";
  const stepLineCount = getPrintableStepLineCount(verseCount, printableSteps.length, writingSpace);
  const smallBoxHtml = [
    includeMemory ? '<div class="small-box"><h3>Memory Verse</h3><div class="line"></div><div class="line"></div></div>' : "",
    includeInsight ? '<div class="small-box"><h3>Shareable Insight</h3><div class="line"></div><div class="line"></div></div>' : ""
  ].filter(Boolean).join("");
  const passageHtml = verses
    .map((verse) => `<span class="verse"><span class="verse-number">${verse.verse}</span>${escapeHtml(verse.text)}</span>`)
    .join(" ");
  const promptHtml = printableSteps
    .map((step, index) => {
      const badge = method.short.charAt(index) || String(index + 1);
      const lines = Array.from({ length: stepLineCount }, () => '<div class="line"></div>').join("");
      return `
        <div class="prompt">
          <div class="prompt-title">
            <span class="badge">${escapeHtml(badge)}</span>
            <div><strong>${escapeHtml(step.title)}</strong><span>${escapeHtml(step.prompt || step.action)}</span></div>
          </div>
          <div class="lines">${lines}</div>
        </div>
      `;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeReference} Worksheet</title>
    <style>
      :root { --ink: #241d19; --muted: #766d63; --paper: #f8f1e6; --line: #d8c8b6; --olive: #39452e; --coral: #c96750; --soft: #fffaf2; }
      * { box-sizing: border-box; }
      body { background: var(--paper); color: var(--ink); font-family: Georgia, "Times New Roman", serif; margin: 0; padding: 28px; }
      .toolbar { align-items: center; display: flex; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; gap: 12px; justify-content: space-between; margin: 0 auto 18px; max-width: 900px; }
      .toolbar p { color: var(--muted); margin: 0; }
      .toolbar-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
      .print-shortcut { background: #fff6eb; border: 1px solid var(--line); border-radius: 999px; color: var(--olive); font-weight: 900; padding: 8px 12px; white-space: nowrap; }
      .page { background: #fffdf8; border: 1px solid rgba(108, 91, 67, 0.18); box-shadow: 0 12px 30px rgba(90, 63, 45, 0.14); margin: 0 auto; max-width: 900px; min-height: 1160px; padding: 46px; }
      .header { border-bottom: 3px double var(--line); display: grid; gap: 12px; grid-template-columns: 1fr auto; min-height: 108px; padding-bottom: 14px; }
      .title-block { display: flex; flex-direction: column; justify-content: space-between; }
      .eyebrow { color: var(--coral); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 12px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; }
      h1 { color: var(--olive); font-size: 34px; line-height: 1; margin: 6px 0 0; }
      .title-row { align-items: baseline; display: flex; flex-wrap: wrap; gap: 10px; }
      .translation-code { color: var(--coral); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 12px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; }
      .meta { color: var(--muted); display: flex; flex-direction: column; font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 13px; font-weight: 700; justify-content: space-between; line-height: 1.6; text-align: right; }
      .meta-method { color: var(--olive); display: block; font-size: 17px; font-weight: 900; line-height: 1.2; }
      .scripture { border-bottom: 1px solid var(--line); padding: 12px 0 12px; }
      .scripture h2 { color: var(--olive); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 17px; margin: 0 0 8px; }
      .passage { columns: 2; column-gap: 34px; font-size: 15.5px; line-height: 1.62; }
      .passage p { margin: 0; }
      .single-passage { columns: 1; font-size: 18px; line-height: 1.65; max-width: 720px; }
      .long-passage { font-size: 14.5px; line-height: 1.54; }
      .verse { break-inside: avoid; display: inline; }
      .verse-number { color: var(--coral); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 11px; font-weight: 900; margin-right: 4px; vertical-align: super; }
      .section { margin-top: 14px; }
      .prompt { border: 1px solid var(--line); border-radius: 10px; break-inside: avoid; break-inside: avoid-page; margin-bottom: 10px; overflow: hidden; page-break-inside: avoid; -webkit-column-break-inside: avoid; }
      .prompt-title { align-items: center; background: #fff6eb; border-bottom: 1px solid var(--line); display: flex; font-family: Inter, ui-sans-serif, system-ui, sans-serif; gap: 10px; padding: 8px 10px; }
      .badge { align-items: center; background: var(--olive); border-radius: 999px; color: white; display: inline-flex; font-size: 12px; font-weight: 900; height: 26px; justify-content: center; min-width: 26px; }
      .prompt-title strong { color: var(--ink); }
      .prompt-title span:not(.badge) { color: var(--muted); display: block; font-size: 12px; margin-top: 2px; }
      .lines { padding: 10px; }
      .line { border-bottom: 1px solid #cfc0ad; height: ${verseCount === 1 ? 28 : verseCount > 10 ? 28 : 22}px; }
      .two-column { break-inside: avoid; break-inside: avoid-page; display: grid; gap: 14px; grid-template-columns: 1fr 1fr; page-break-inside: avoid; -webkit-column-break-inside: avoid; }
      .small-box { border: 1px solid var(--line); border-radius: 10px; break-inside: avoid; break-inside: avoid-page; page-break-inside: avoid; padding: 12px; -webkit-column-break-inside: avoid; }
      .small-box h3 { color: var(--olive); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 14px; margin: 0 0 8px; }
      .footer { border-top: 1px solid var(--line); color: var(--muted); display: flex; font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 11px; justify-content: space-between; margin-top: 16px; padding-top: 10px; }
      @media (max-width: 720px) { body { padding: 12px; } .toolbar { align-items: stretch; flex-direction: column; } .page { padding: 24px 18px; } .header { grid-template-columns: 1fr; min-height: 0; } .meta { text-align: left; } .passage { columns: 1; } .footer { align-items: flex-start; flex-direction: column; } .two-column { grid-template-columns: 1fr; } }
      @media print { @page { margin: 8mm 9mm; } body { background: white; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .toolbar { display: none; } .page { border: 0; box-shadow: none; max-width: none; min-height: auto; padding: 0; } .header { min-height: 96px; padding-bottom: 12px; } h1 { font-size: 31px; } .scripture { padding: 10px 0; } .passage { font-size: 14.5px; line-height: 1.46; } .single-passage { font-size: 17px; line-height: 1.55; } .long-passage { font-size: 13.5px; line-height: 1.42; } .section { margin-top: 10px; } .prompt, .small-box, .two-column { break-inside: avoid; break-inside: avoid-page; page-break-inside: avoid; -webkit-column-break-inside: avoid; } .prompt { display: block; margin-bottom: 8px; overflow: visible; } .prompt-title, .lines { break-inside: avoid; page-break-inside: avoid; } .prompt-title { padding: 6px 9px; } .badge { height: 22px; min-width: 22px; } .lines { padding: 8px 10px; } .line { height: ${verseCount === 1 ? 24 : verseCount > 10 ? 24 : 19}px; } .small-box { display: block; padding: 9px; } .footer { margin-top: 10px; padding-top: 8px; } }
    </style>
  </head>
  <body>
    <div class="toolbar">
      <p>Printable worksheet for ${safeReference}. On desktop, use your browser's print command. On phone or tablet, use the browser Share menu, then choose Print or Save to Files.</p>
      <div class="toolbar-actions">
        <span class="print-shortcut">Desktop: Ctrl+P or Cmd+P</span>
        <span class="print-shortcut">Phone: Share &gt; Print</span>
      </div>
    </div>
    <main class="page">
      <header class="header">
        <div class="title-block">
          <div class="eyebrow">Bible Study Tutor worksheet</div>
          <div class="title-row"><h1>${safeReference}</h1>${safeTranslation ? `<span class="translation-code">${safeTranslation}</span>` : ""}</div>
        </div>
        <div class="meta"><span class="meta-method">${escapeHtml(methodLabel)}</span><span>Date: ____________________</span></div>
      </header>
      <section class="scripture">
        <h2>Selected Scripture</h2>
        <div class="passage ${passageClass}"><p>${passageHtml}</p></div>
      </section>
      <section class="section">${promptHtml}</section>
      ${smallBoxHtml ? `<section class="section two-column">${smallBoxHtml}</section>` : ""}
      <footer class="footer"><span>Free Bible study worksheet from Bible Study Tutor</span><span>biblestudytutor.org</span></footer>
    </main>
  </body>
</html>`;
}

export function buildPrintableMemoryCardsHtml({
  verses,
  layout = "pocket",
  copies = 1
}: {
  verses: PrintableMemoryCardVerse[];
  layout?: MemoryCardLayout;
  copies?: number;
}) {
  const safeCopies = Math.max(1, Math.min(12, Math.round(copies || 1)));
  const cards = verses.flatMap((verse) => Array.from({ length: safeCopies }, () => verse));
  const layoutClass = layout === "large" ? "large" : "pocket";
  const title = layout === "large" ? "Large Memory Cards" : "Pocket Memory Cards";
  const cardHtml = cards.map((verse) => {
    const cardText = prepareMemoryCardText(verse.verseText);
    const printVars = getMemoryCardPrintVars(cardText.text);
    return `
    <article class="card" style="${printVars}">
      <div class="brand">Bible Study Tutor</div>
      <h2>${escapeHtml(verse.reference)}</h2>
      <p class="verse">${escapeHtml(cardText.text)}</p>
      ${cardText.shortened ? '<p class="card-note">Longer passage shortened for card printing.</p>' : ""}
      <div class="footer">
        <span>${escapeHtml(shortTranslationForPrint(verse.translationName))}</span>
        <span>biblestudytutor.org</span>
      </div>
    </article>
  `;
  }).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root { --ink: #241d19; --muted: #766d63; --paper: #f8f1e6; --line: #d8c8b6; --olive: #39452e; --coral: #c96750; --soft: #fffaf2; }
      * { box-sizing: border-box; }
      body { background: var(--paper); color: var(--ink); font-family: Georgia, "Times New Roman", serif; margin: 0; padding: 24px; }
      .toolbar { align-items: center; display: flex; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; gap: 12px; justify-content: space-between; margin: 0 auto 18px; max-width: 980px; }
      .toolbar p { color: var(--muted); margin: 0; }
      .print-shortcut { background: #fff6eb; border: 1px solid var(--line); border-radius: 999px; color: var(--olive); font-weight: 900; padding: 8px 12px; white-space: nowrap; }
      .sheet { background: #fffdf8; border: 1px solid rgba(108, 91, 67, 0.18); box-shadow: 0 12px 30px rgba(90, 63, 45, 0.14); display: grid; gap: 14px; margin: 0 auto; max-width: 980px; padding: 24px; }
      .sheet.pocket { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .sheet.large { grid-template-columns: 1fr; }
      .card { background: white; border: 1.5px solid var(--line); border-radius: 14px; break-inside: avoid; display: flex; flex-direction: column; gap: 10px; min-height: 300px; overflow: hidden; padding: 20px; page-break-inside: avoid; -webkit-column-break-inside: avoid; }
      .large .card { min-height: 455px; padding: 28px; }
      .brand { color: var(--coral); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 11px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; }
      h2 { color: var(--olive); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 22px; line-height: 1.1; margin: 0; }
      .large h2 { font-size: 30px; }
      .verse { color: var(--ink); flex: 1; font-size: var(--screen-pocket-size); font-weight: 700; line-height: var(--screen-line); margin: 0; overflow-wrap: anywhere; }
      .large .verse { font-size: var(--screen-large-size); line-height: var(--screen-large-line); }
      .card-note { color: var(--coral); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 10px; font-weight: 900; margin: -3px 0 0; }
      .footer { border-top: 1px solid var(--line); color: var(--muted); display: flex; font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 11px; font-weight: 800; justify-content: space-between; padding-top: 8px; }
      @media (max-width: 720px) { body { padding: 12px; } .toolbar { align-items: stretch; flex-direction: column; } .sheet, .sheet.pocket { grid-template-columns: 1fr; padding: 12px; } }
      @media print { @page { size: A4 portrait; margin: 8mm; } body { background: white; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .toolbar { display: none; } .sheet { border: 0; box-shadow: none; gap: 8mm; max-width: none; padding: 0; } .sheet.pocket { grid-template-columns: repeat(2, 1fr); } .card { break-inside: avoid; height: 126mm; max-height: 126mm; min-height: 0; page-break-inside: avoid; padding: 7mm; } .large .card { height: 132mm; max-height: 132mm; min-height: 0; padding: 8mm; } .brand { font-size: 9px; } h2 { font-size: 19px; } .large h2 { font-size: 25px; } .verse { font-size: var(--print-pocket-size); line-height: var(--print-line); } .large .verse { font-size: var(--print-large-size); line-height: var(--print-large-line); } .card-note { font-size: 8px; margin-top: -2px; } .footer { font-size: 9px; padding-top: 5px; } }
    </style>
  </head>
  <body>
    <div class="toolbar">
      <p>${escapeHtml(title)}. On desktop, use your browser's print command. On phone or tablet, use Share, then Print or Save to Files.</p>
      <span class="print-shortcut">Desktop: Ctrl+P or Cmd+P</span>
    </div>
    <main class="sheet ${layoutClass}">${cardHtml}</main>
  </body>
</html>`;
}

function getPrintableStepLineCount(verseCount: number, stepCount: number, writingSpace: WorksheetWritingSpace = "standard") {
  if (writingSpace === "more") {
    if (verseCount <= 1) return 8;
    if (verseCount <= 6) return 8;
    if (verseCount <= 12) return Math.max(8, Math.round(24 / Math.max(stepCount, 1)));
    return Math.max(9, Math.round(30 / Math.max(stepCount, 1)));
  }
  if (verseCount <= 1) return 5;
  if (verseCount <= 6) return 6;
  if (verseCount <= 12) return Math.max(6, Math.round(18 / Math.max(stepCount, 1)));
  return Math.max(7, Math.round(24 / Math.max(stepCount, 1)));
}

function escapeHtml(value: string | number | undefined | null) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function prepareMemoryCardText(value?: string) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  const maxLength = 760;
  if (text.length <= maxLength) return { text, shortened: false };

  const trimmed = text.slice(0, maxLength);
  const lastSpace = trimmed.lastIndexOf(" ");
  return {
    text: `${trimmed.slice(0, lastSpace > 640 ? lastSpace : maxLength).trim()}...`,
    shortened: true
  };
}

function getMemoryCardPrintVars(value?: string) {
  const length = String(value || "").length;
  const settings =
    length <= 80
      ? { screenPocket: 26, screenLarge: 34, printPocket: 22, printLarge: 29, line: 1.42 }
      : length <= 140
        ? { screenPocket: 23, screenLarge: 30, printPocket: 19.5, printLarge: 25.5, line: 1.4 }
        : length <= 220
          ? { screenPocket: 20, screenLarge: 26, printPocket: 17, printLarge: 22, line: 1.34 }
          : length <= 340
            ? { screenPocket: 17.5, screenLarge: 23, printPocket: 14.8, printLarge: 19, line: 1.28 }
            : length <= 520
              ? { screenPocket: 15.2, screenLarge: 20, printPocket: 12.8, printLarge: 16.2, line: 1.22 }
              : { screenPocket: 13.4, screenLarge: 17, printPocket: 11.2, printLarge: 13.8, line: 1.16 };

  return [
    `--screen-pocket-size:${settings.screenPocket}px`,
    `--screen-large-size:${settings.screenLarge}px`,
    `--print-pocket-size:${settings.printPocket}px`,
    `--print-large-size:${settings.printLarge}px`,
    `--screen-line:${settings.line}`,
    `--screen-large-line:${settings.line}`,
    `--print-line:${settings.line}`,
    `--print-large-line:${settings.line}`
  ].join(";");
}

function shortTranslationForPrint(value?: string) {
  const normalized = (value || "").toLowerCase();
  if (normalized.includes("berean")) return "BSB";
  if (normalized.includes("world english")) return "WEB";
  if (normalized.includes("king james")) return "KJV";
  return value || "";
}
