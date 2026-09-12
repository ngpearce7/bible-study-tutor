import Resend from "@auth/core/providers/resend";

export const passwordReset = Resend({
  id: "password-reset",
  maxAge: 15 * 60,
  async sendVerificationRequest({ identifier, token }) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.AUTH_EMAIL_FROM;
    if (!apiKey || !from || identifier.endsWith("@username.biblestudytutor.local")) {
      throw new Error("Email recovery is unavailable");
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [identifier], subject: "Reset your Bible Study Tutor password", text: `Your password reset code is:\n\n${token}\n\nIt expires in 15 minutes. If you did not request this, ignore this email.` })
    });
    if (!response.ok) throw new Error("Email delivery failed");
  }
});
