// @vitest-environment jsdom
import { expect, test } from "vitest";
import { verificationEmailTemplate } from "./verificationEmailTemplate";

test("verification emails use the app icon in the header", () => {
  for (const kind of ["account", "new-account", "change-address"] as const) {
    const email = verificationEmailTemplate("12345678", kind);
    const document = new DOMParser().parseFromString(email.html, "text/html");
    expect(document.querySelector("img")?.getAttribute("src")).toBe("https://biblestudytutor.org/apple-touch-icon.png");
    expect(document.body.textContent).toContain("12345678");
    expect(document.body.textContent).not.toContain("✝");
  }
});
