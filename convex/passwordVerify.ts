import Resend from "@auth/core/providers/resend";
import { verificationEmailTemplate } from "./verificationEmailTemplate";

export const passwordVerifyMaxAge = 15 * 60;

export const passwordVerify = Resend({
  id: "password-verify",
  maxAge: passwordVerifyMaxAge,
  generateVerificationToken() {
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    return String(random[0] % 100_000_000).padStart(8, "0");
  },
  async sendVerificationRequest({ identifier, token }) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.AUTH_EMAIL_FROM;
    if (!apiKey || !from || identifier.endsWith("@username.biblestudytutor.local")) {
      throw new Error("Email verification is unavailable. Please try again later.");
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [identifier],
        ...verificationEmailTemplate(token, "new-account")
      })
    });
    if (!response.ok) throw new Error("Email delivery failed. Please try again later.");
  }
});
