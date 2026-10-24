const methods = [
  {
    id: "read", name: "READ", fullName: "Read · Explore · Apply · Do", time: "10–15 min",
    focus: "One small action", best: "You want a simple daily starting point.",
    difference: "Ends with a concrete step you can take today.",
    watch: "Explore the passage before choosing what to do.",
    goals: ["quick", "new"],
  },
  {
    id: "oia", name: "OIA", fullName: "Observe · Interpret · Apply", time: "15–25 min",
    focus: "Understand the passage", best: "You want a dependable method to learn first.",
    difference: "Separates what the text says from what it means and how to respond.",
    watch: "Read the surrounding verses before drawing a conclusion.",
    goals: ["new", "understand", "group"], guide: "/bible-study-methods/oia",
  },
  {
    id: "soap", name: "SOAP", fullName: "Scripture · Observation · Application · Prayer", time: "10–20 min",
    focus: "Devotion and prayer", best: "You want to journal and pray through a short passage.",
    difference: "Gives prayer its own step after a personal response.",
    watch: "Keep the chosen verse in its paragraph, not on its own.",
    goals: ["new", "pray", "quick"], guide: "/bible-study-methods/soap",
  },
  {
    id: "lectio", name: "Lectio Divina", fullName: "Read · Meditate · Pray · Rest", time: "10–20 min",
    focus: "Slow prayerful reading", best: "You need to slow down with a Psalm or Gospel passage.",
    difference: "Makes room to linger over a phrase and pray from it.",
    watch: "Let the whole passage guide what the phrase means.",
    goals: ["pray"], guide: "/bible-study-methods/lectio-divina",
  },
  {
    id: "hear", name: "HEAR", fullName: "Highlight · Explain · Apply · Respond", time: "10–20 min",
    focus: "One meaningful phrase", best: "You like highlighting and writing a brief response.",
    difference: "Starts with a phrase, then asks you to explain it in context.",
    watch: "Explain from the text before writing how it feels to you.",
    goals: ["pray", "quick"],
  },
  {
    id: "coma", name: "COMA", fullName: "Context · Observation · Meaning · Application", time: "20–30 min",
    focus: "Context and discussion", best: "You are studying a teaching passage with a group.",
    difference: "Names context first, which helps a group discuss meaning carefully.",
    watch: "Do not skip the context step to reach application.",
    goals: ["group", "understand"],
  },
  {
    id: "inductive", name: "Inductive Study", fullName: "Context · Structure · Details · Questions · Summary · Response", time: "30–45 min",
    focus: "Close investigation", best: "You have time to examine a paragraph in depth.",
    difference: "Spends longer tracing the passage before stating its main point.",
    watch: "Let details support the main argument rather than distract from it.",
    goals: ["deep", "understand"], guide: "/bible-study-methods/inductive",
  },
];

const goals = [
  ["all", "Show all", "All seven guided methods"],
  ["new", "I’m new", "Three gentle starting points"],
  ["quick", "I have 15 minutes", "Short daily approaches"],
  ["understand", "I want to understand", "Methods that slow down interpretation"],
  ["pray", "I want to pray", "Methods with a prayerful response"],
  ["group", "I’m with a group", "Shared discussion methods"],
  ["deep", "I want to go deeper", "A longer close-reading method"],
];

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export function buildMethodComparisonGuide() {
  const filters = goals.map(([id, label]) => `<button type="button" class="method-filter${id === "all" ? " is-active" : ""}" data-goal="${id}" aria-pressed="${id === "all"}">${escapeHtml(label)}</button>`).join("\n          ");
  const cards = methods.map((method, index) => `<article class="method-card" data-goals="${method.goals.join(" ")}" aria-labelledby="method-${method.id}">
        <div class="method-card-top"><span class="method-number">${String(index + 1).padStart(2, "0")}</span><span class="method-time">${escapeHtml(method.time)}</span></div>
        <h3 id="method-${method.id}">${escapeHtml(method.name)}</h3>
        <p class="method-steps">${escapeHtml(method.fullName)}</p>
        <div class="method-card-rule"></div>
        <p class="method-focus">${escapeHtml(method.focus)}</p>
        <p><strong>Choose it when</strong> ${escapeHtml(method.best)}</p>
        <p><strong>What makes it different</strong> ${escapeHtml(method.difference)}</p>
        <p class="method-watch"><strong>Keep in mind</strong> ${escapeHtml(method.watch)}</p>
        <div class="method-actions"><a class="method-start" href="/?tab=study&amp;method=${method.id}">Try ${escapeHtml(method.name)} <span aria-hidden="true">↗</span></a>${method.guide ? `<a class="method-guide" href="${method.guide}">Read the guide</a>` : ""}</div>
      </article>`).join("\n      ");
  const rows = methods.map((method) => `<tr><th scope="row">${escapeHtml(method.name)}</th><td>${escapeHtml(method.time)}</td><td>${escapeHtml(method.focus)}</td><td>${escapeHtml(method.difference)}</td></tr>`).join("\n            ");

  return `<section class="method-finder" aria-labelledby="method-finder-heading">
    <div class="method-finder-heading"><div><span class="method-kicker">A simple place to begin</span><h2 id="method-finder-heading">What do you need from today’s study?</h2><p>Choose your aim to narrow the methods. There is no perfect method to master first; each one is a set of questions that helps you listen to the same Scripture.</p></div><span class="method-spark" aria-hidden="true">✦</span></div>
    <div class="method-filters" role="group" aria-label="Filter Bible study methods by goal">${filters}</div>
    <p class="method-filter-status" id="method-filter-status" role="status" aria-live="polite">All seven guided methods</p>
    <div class="method-cards" id="method-cards">${cards}</div>
  </section>
  <section class="method-example" aria-labelledby="method-example-heading">
    <div class="method-example-heading"><span class="method-kicker">One passage, different questions</span><h2 id="method-example-heading">How the methods differ in practice</h2><p>Read all of Psalm 23, then use verse 1 as a starting point: “The LORD is my shepherd; I shall not want.”</p></div>
    <div class="method-example-grid">
      <div><span>OIA · understand</span><strong>What does the shepherd image say about the Lord’s care in this psalm?</strong><p>Notice the image, read the rest of the psalm, then explain it before applying it.</p></div>
      <div><span>SOAP · pray</span><strong>How can I bring a real worry before the Lord as my shepherd?</strong><p>Observe the verse in context, write one response, and turn that response into prayer.</p></div>
      <div><span>READ · act</span><strong>What one faithful response can I take today?</strong><p>Explore the verse’s meaning first, then choose a specific, modest action.</p></div>
    </div>
    <p class="method-example-note">These are sample questions, not three different meanings. The passage sets the meaning; the method shapes the questions you ask and how you respond.</p>
  </section>
  <section class="method-table-section" aria-labelledby="method-table-heading">
    <h2 id="method-table-heading">Compare every guided method at a glance</h2>
    <p>Times are rough guides. A short passage can take longer when it raises good questions.</p>
    <div class="method-table-wrap" role="region" aria-label="Comparison of seven Bible study methods" tabindex="0"><table class="method-table"><thead><tr><th scope="col">Method</th><th scope="col">Typical time</th><th scope="col">Main focus</th><th scope="col">Distinctive strength</th></tr></thead><tbody>${rows}</tbody></table></div>
  </section>
  <section class="method-next" aria-labelledby="method-next-heading"><div><span class="method-kicker">Still unsure?</span><h2 id="method-next-heading">Start with OIA, then try another later.</h2><p>OIA makes a useful first habit: notice what the passage says, understand it in context, and choose a fitting response. For a shorter daily session, try READ. Every method can begin with the same short passage.</p></div><a class="button" href="/?tab=study&amp;method=oia">Start with OIA</a></section>`;
}

export const methodComparisonStyles = `
  .method-finder, .method-example, .method-table-section, .method-next { margin-top: 24px; }
  .method-finder { background: linear-gradient(145deg, #edf4f8 0%, #ffffff 52%, #fbf4e9 100%); border-color: #d1dfe8; overflow: hidden; padding: clamp(22px, 4vw, 38px); }
  .method-finder-heading { align-items: flex-start; display: flex; gap: 18px; justify-content: space-between; }
  .method-kicker { color: var(--bronze); display: block; font-size: 12px; font-weight: 900; letter-spacing: .12em; margin-bottom: 10px; text-transform: uppercase; }
  .method-finder h2, .method-example h2, .method-table-section h2, .method-next h2 { color: var(--ink); font-size: clamp(25px, 4vw, 34px); line-height: 1.16; margin-bottom: 10px; }
  .method-finder-heading p { max-width: 650px; }
  .method-spark { align-items: center; background: #dcebf4; border-radius: 22px; color: var(--navy); display: flex; flex: 0 0 68px; font-size: 34px; height: 68px; justify-content: center; }
  .method-filters { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 26px; }
  .method-filter { background: #fff; border: 1px solid #b9ccd8; border-radius: 999px; color: var(--ink); cursor: pointer; font: inherit; font-size: 14px; font-weight: 800; min-height: 44px; padding: 10px 16px; }
  .method-filter:hover { border-color: var(--navy); }
  .method-filter.is-active { background: var(--navy); border-color: var(--navy); color: #fff; }
  .method-filter:focus-visible, .method-actions a:focus-visible, .method-next a:focus-visible { outline: 3px solid #bd7d32; outline-offset: 3px; }
  .method-filter-status { color: var(--navy); font-size: 14px; font-weight: 800; margin: 20px 0 13px; }
  .method-cards { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); }
  .method-card { background: #fff; border: 1px solid #cbdbe5; border-radius: 18px; box-shadow: 0 8px 24px rgba(16, 35, 59, .06); display: flex; flex-direction: column; gap: 11px; padding: 22px; }
  .method-card[hidden] { display: none; }
  .method-card-top { align-items: center; display: flex; justify-content: space-between; }
  .method-number { color: var(--bronze); font-size: 12px; font-weight: 900; letter-spacing: .13em; }
  .method-time { background: #e5f0f8; border-radius: 999px; color: var(--navy); font-size: 12px; font-weight: 800; padding: 6px 10px; }
  .method-card h3 { color: var(--ink); font-size: 25px; letter-spacing: -.03em; margin: 0; }
  .method-card p { font-size: 14px; line-height: 1.5; }
  .method-card p strong { color: var(--ink); display: block; font-size: 12px; letter-spacing: .04em; margin-bottom: 3px; text-transform: uppercase; }
  .method-card .method-steps { color: var(--navy); font-size: 13px; font-weight: 800; min-height: 39px; }
  .method-card-rule { background: #dce7ed; height: 1px; }
  .method-card .method-focus { color: var(--bronze); font-size: 13px; font-weight: 900; letter-spacing: .04em; text-transform: uppercase; }
  .method-card .method-watch { background: #f5f8fa; border-radius: 10px; margin-top: auto; padding: 11px; }
  .method-actions { align-items: center; display: flex; flex-wrap: wrap; gap: 8px 14px; margin-top: 3px; }
  .method-actions a { font-size: 13px; font-weight: 900; text-decoration: none; }
  .method-start { background: var(--navy); border-radius: 999px; color: #fff; padding: 10px 13px; }
  .method-guide { color: var(--navy); text-decoration: underline !important; text-underline-offset: 3px; }
  .method-example { background: var(--ink); border-color: var(--ink); padding: clamp(22px, 4vw, 36px); }
  .method-example h2, .method-example p, .method-example strong { color: #fff; }
  .method-example-heading p { color: #dbe6ef; }
  .method-example .method-kicker { color: #e7b779; }
  .method-example-grid { display: grid; gap: 12px; grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 24px 0 16px; }
  .method-example-grid > div { background: #24415f; border: 1px solid #43627f; border-radius: 14px; padding: 20px; }
  .method-example-grid span { color: #f1c58f; display: block; font-size: 12px; font-weight: 900; letter-spacing: .07em; margin-bottom: 12px; text-transform: uppercase; }
  .method-example-grid strong { display: block; font-size: 16px; line-height: 1.45; }
  .method-example-grid p { color: #dbe6ef; font-size: 13px; margin-top: 10px; }
  .method-example .method-example-note { border-top: 1px solid #43627f; color: #dbe6ef; font-size: 14px; padding-top: 16px; }
  .method-table-section { padding: clamp(22px, 4vw, 32px); }
  .method-table-wrap { margin-top: 18px; overflow-x: auto; }
  .method-table { border-collapse: collapse; min-width: 650px; width: 100%; }
  .method-table th, .method-table td { border-bottom: 1px solid var(--line); font-size: 14px; line-height: 1.5; padding: 13px 10px; text-align: left; vertical-align: top; }
  .method-table thead th { background: #e8f1f7; color: var(--navy); font-size: 12px; letter-spacing: .04em; text-transform: uppercase; }
  .method-table tbody th { color: var(--ink); }
  .method-table tbody tr:nth-child(even) { background: #f6f9fb; }
  .method-next { align-items: center; background: #f8efe1; border-color: #e5d3b9; display: flex; gap: 28px; justify-content: space-between; padding: clamp(22px, 4vw, 32px); }
  .method-next p { max-width: 680px; }
  .method-next .button { flex-shrink: 0; }
  @media (max-width: 700px) { .method-example-grid { grid-template-columns: 1fr; } .method-next { align-items: flex-start; flex-direction: column; } .method-spark { display: none; } }
`;

export const methodComparisonScript = `<script>
  (function () {
    var filters = Array.prototype.slice.call(document.querySelectorAll('.method-filter'));
    var cards = Array.prototype.slice.call(document.querySelectorAll('.method-card'));
    var status = document.getElementById('method-filter-status');
    var labels = ${JSON.stringify(Object.fromEntries(goals.map(([id, , description]) => [id, description])))};
    filters.forEach(function (button) {
      button.addEventListener('click', function () {
        var goal = button.getAttribute('data-goal');
        filters.forEach(function (filter) {
          var active = filter === button;
          filter.classList.toggle('is-active', active);
          filter.setAttribute('aria-pressed', String(active));
        });
        cards.forEach(function (card) {
          card.hidden = goal !== 'all' && !card.getAttribute('data-goals').split(' ').includes(goal);
        });
        status.textContent = labels[goal] + ' · ' + cards.filter(function (card) { return !card.hidden; }).length + ' methods shown';
      });
    });
  })();
</script>`;
