import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const sendFirstUserRegisteredEmail = internalAction({
  args: {
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    profileId: v.string(),
    registeredAt: v.number()
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = firstEmail(process.env.ADMIN_EMAILS || "");
    const fromEmail = process.env.ADMIN_NOTIFICATION_FROM || "Bible Study Tutor <notifications@biblestudytutor.org>";

    if (!apiKey || !adminEmail) return { sent: false, reason: "missing-email-configuration" };

    const userLabel = args.name || args.email || "A new user";
    const registeredDate = new Date(args.registeredAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
    const text = [
      "Bible Study Tutor has its first non-admin user registration.",
      "",
      `Name: ${args.name || "Not provided"}`,
      `Email: ${args.email || "Not provided"}`,
      `Profile ID: ${args.profileId}`,
      `Registered: ${registeredDate}`,
      "",
      "This excludes emails listed in ADMIN_EMAILS."
    ].join("\n");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [adminEmail],
        subject: `First Bible Study Tutor user registered: ${userLabel}`,
        text
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Could not send first-user email: ${response.status} ${detail}`);
    }

    return { sent: true };
  }
});

function firstEmail(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)[0] || "";
}
