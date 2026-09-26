// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { noteThemeCss, scriptureDisplayColor } from "./noteTheme";

afterEach(() => { document.head.innerHTML = ""; document.body.innerHTML = ""; });

function editorFixture() {
  const style = document.createElement("style");
  style.textContent = noteThemeCss;
  document.head.append(style);
  document.body.innerHTML = `<div class="bst-note-theme-light"><div class="bst-note-editor"><span data-scripture-color="#241d19" style="color:#241d19"><em>Saved Scripture</em></span></div></div>`;
  return { wrapper: document.body.firstElementChild!, editor: document.querySelector(".bst-note-editor")!, span: document.querySelector("span")! };
}

test("switching themes changes displayed ink without changing saved formatting", () => {
  const { wrapper, editor, span } = editorFixture();
  const original = editor.innerHTML;
  expect(getComputedStyle(span).color).toBe("rgb(36, 29, 25)");
  wrapper.className = "bst-note-theme-dark";
  expect(getComputedStyle(span).color).toBe("rgb(247, 237, 220)");
  expect(editor.innerHTML).toBe(original);
  wrapper.className = "bst-note-theme-light";
  expect(getComputedStyle(span).color).toBe("rgb(36, 29, 25)");
});

test("legacy RGB colours get the same dark display counterpart", () => {
  const { wrapper, span } = editorFixture();
  span.setAttribute("data-scripture-color", "rgb(36, 29, 25)");
  wrapper.className = "bst-note-theme-dark";
  expect(getComputedStyle(span).color).toBe("rgb(247, 237, 220)");
});

test("text on pastel highlights remains dark in dark mode", () => {
  const { wrapper, editor } = editorFixture();
  wrapper.className = "bst-note-theme-dark";
  editor.innerHTML = `<mark style="background-color:#f4dfb6"><span data-scripture-color="#241d19" style="color:#241d19">Highlighted Scripture</span></mark>`;
  expect(getComputedStyle(editor.querySelector("span")!).color).toBe("rgb(36, 29, 25)");
});

test("palette choices preserve light colours and unknown colours", () => {
  for (const color of ["#241d19", "#a04734", "#39452e", "#9a6a1f"]) {
    expect(scriptureDisplayColor(color, false)).toBe(color);
    expect(scriptureDisplayColor(color, true)).not.toBe(color);
  }
  expect(scriptureDisplayColor("#123456", true)).toBe("#123456");
});
