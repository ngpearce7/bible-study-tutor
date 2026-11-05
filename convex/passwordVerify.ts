import Resend from "@auth/core/providers/resend";

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
        subject: "Verify your Bible Study Tutor email",
        text: `Bible Study Tutor\n\nYour verification code is ${token}.\n\nEnter this code in the app to finish setting up your account. It expires in 15 minutes. If you did not ask for this, you can ignore this email.\n\nhttps://biblestudytutor.org`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#172536"><h1 style="font-size:24px">Verify your email</h1><p>Enter this code in Bible Study Tutor to finish setting up your account:</p><p style="font-size:26px;font-weight:bold;letter-spacing:4px">${token.replace(/[&<>"']/g, "")}</p><p>The code expires in 15 minutes. If you did not ask for this, you can ignore this email.</p></div>`
      })
    });
    if (!response.ok) throw new Error("Email delivery failed. Please try again later.");
  }
});
