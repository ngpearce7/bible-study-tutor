import Resend from "@auth/core/providers/resend";
import { passwordResetEmail, passwordResetMaxAge } from "./passwordResetEmail";

export const passwordReset = Resend({
  id: "password-reset",
  maxAge: passwordResetMaxAge,
  async sendVerificationRequest({ identifier, token }) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.AUTH_EMAIL_FROM;
    if (!apiKey || !from || identifier.endsWith("@username.biblestudytutor.local")) {
      throw new Error("Email recovery is unavailable");
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [identifier], ...passwordResetEmail(token) })
    });
    if (!response.ok) throw new Error("Email delivery failed");
  }
});
