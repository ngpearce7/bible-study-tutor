// @vitest-environment jsdom
import { expect, test } from "vitest";
import { passwordResetEmail, passwordResetMaxAge } from "./passwordResetEmail";

test("the HTML code stays copyable and cannot inject markup", () => {
  const token = '<img src=x onerror="alert(1)">&\'Ab09';
  const email = passwordResetEmail(token);
  const document = new DOMParser().parseFromString(email.html, "text/html");
  expect(document.querySelector("img, script")).toBeNull();
  expect(Array.from(document.querySelectorAll("p")).some((p) => p.textContent === token)).toBe(true);
  expect(email.text).toContain(`\n\n${token}\n\n`);
  expect(email.text).toContain(`${passwordResetMaxAge / 60} minutes`);
  expect(document.body.textContent).toContain(`${passwordResetMaxAge / 60} minutes`);
});
