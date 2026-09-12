// @vitest-environment jsdom
import { expect, test } from "vitest";
import { sanitizeEditorHtml } from "./noteHtml";
test("saved notes cannot execute event handlers or load external resources", () => {
  const result = sanitizeEditorHtml('<img src=x onerror=alert(1)><svg onload=alert(1)></svg><p onclick=alert(1) style="background-image:url(https://example.org/track);color:#123456">Safe <strong>note</strong></p><iframe srcdoc="evil"></iframe>');
  expect(result).not.toMatch(/onerror|onclick|onload|iframe|svg|img|url\(/);
  expect(result).toContain("<strong>note</strong>");
  expect(result).toContain("color:#123456");
});
test("supported note formatting and scripture colors remain", () => {
  const html = '<p><u>Observe</u> <mark>truth</mark><span data-scripture-color="#123456" style="color:#123456">John 1</span></p>';
  expect(sanitizeEditorHtml(html)).toBe(html);
});
