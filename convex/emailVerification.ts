import { getAuthUserId } from "@convex-dev/auth/server";
import { retrieveAccount } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery, mutation } from "./_generated/server";

const CODE_LIFETIME_MS = 15 * 60 * 1000;
const REQUEST_WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_HOUR = 5;
const MAX_CODE_ATTEMPTS = 5;

async function codeDigest(userId: Id<"users">, code: string) {
  const bytes = new TextEncoder().encode(`${userId}:${code}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const requestExistingEmailVerification = action({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to verify your email.");
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const code = String(random[0] % 100_000_000).padStart(8, "0");
    const digest = await codeDigest(userId, code);
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.AUTH_EMAIL_FROM;
    if (!apiKey || !from) throw new Error("Email verification is unavailable. Please try again later.");
    const email = await ctx.runMutation(internal.emailVerification.prepareExistingEmailVerification, { userId, digest });
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Confirm your Bible Study Tutor email",
        text: `Bible Study Tutor\n\nYour verification code is ${code}.\n\nEnter it in the Account screen to confirm your email. It expires in 15 minutes. Your Bible study and reading progress remain available while you verify.\n\nIf you did not ask for this code, you can ignore this email.\n\nhttps://biblestudytutor.org`
      })
    });
    if (!response.ok) throw new Error("Email delivery failed. Please try again later.");
    return null;
  }
});

export const currentPasswordEmail = internalQuery({
  args: { userId: v.id("users") },
  returns: v.string(),
  handler: async (ctx, { userId }) => {
    const account = await ctx.db.query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId).eq("provider", "password")).first();
    if (!account || account.providerAccountId.endsWith("@username.biblestudytutor.local")) {
      throw new Error("This account does not have an email and password sign-in.");
    }
    return account.providerAccountId;
  }
});

export const requestEmailChange = action({
  args: { newEmail: v.string(), password: v.string() },
  returns: v.null(),
  handler: async (ctx, { newEmail, password }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to change your email.");
    const normalized = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254 ||
        normalized.endsWith("@username.biblestudytutor.local")) {
      throw new Error("Enter a valid new email address.");
    }
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.AUTH_EMAIL_FROM;
    if (!apiKey || !from) throw new Error("Email changes are unavailable. Please try again later.");
    const currentEmail = await ctx.runQuery(internal.emailVerification.currentPasswordEmail, { userId });
    if (normalized === currentEmail) throw new Error("This is already your account email.");
    const retrieved = await retrieveAccount(ctx, { provider: "password", account: { id: currentEmail, secret: password } });
    if (!retrieved || retrieved.user._id !== userId) throw new Error("Current password did not match.");
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const code = String(random[0] % 100_000_000).padStart(8, "0");
    const digest = await codeDigest(userId, code);
    await ctx.runMutation(internal.emailVerification.prepareEmailChange, { userId, accountId: retrieved.account._id, newEmail: normalized, digest });
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to: [normalized], subject: "Confirm your new Bible Study Tutor email",
        text: `Bible Study Tutor\n\nYour code to confirm this new email address is ${code}.\n\nEnter it in the Account screen within 15 minutes. Your current sign-in address will stay the same until you confirm. If you did not request this change, you can ignore this email.\n\nhttps://biblestudytutor.org`
      })
    });
    if (!response.ok) throw new Error("Email delivery failed. Please try again later.");
    return null;
  }
});

export const prepareEmailChange = internalMutation({
  args: { userId: v.id("users"), accountId: v.id("authAccounts"), newEmail: v.string(), digest: v.string() },
  returns: v.null(),
  handler: async (ctx, { userId, accountId, newEmail, digest }) => {
    const user = await ctx.db.get(userId);
    const account = await ctx.db.get(accountId);
    if (!user || !account || account.userId !== userId || account.provider !== "password") throw new Error("Account unavailable.");
    const otherAccount = await ctx.db.query("authAccounts")
      .withIndex("providerAndAccountId", (q) => q.eq("provider", "password").eq("providerAccountId", newEmail)).first();
    const otherUser = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", newEmail)).first();
    if (otherAccount || (otherUser && otherUser._id !== userId)) throw new Error("That email address is already in use.");
    const now = Date.now();
    const windowStart = user.emailVerificationRequestWindowStartedAt || now;
    const inWindow = now - windowStart < REQUEST_WINDOW_MS;
    const count = inWindow ? user.emailVerificationRequestCount || 0 : 0;
    if (count >= MAX_REQUESTS_PER_HOUR) throw new Error("Too many codes requested. Please try again later.");
    if (user.emailVerificationCodeSentAt && now - user.emailVerificationCodeSentAt < 60_000) {
      throw new Error("Please wait a minute before requesting another code.");
    }
    const expiresAt = now + CODE_LIFETIME_MS;
    await ctx.db.patch(userId, {
      emailVerificationPendingAddress: newEmail,
      emailVerificationPendingOriginAddress: account.providerAccountId,
      emailVerificationCodeDigest: digest,
      emailVerificationCodeExpiresAt: expiresAt,
      emailVerificationCodeSentAt: now,
      emailVerificationCodeAttempts: 0,
      emailVerificationRequestWindowStartedAt: inWindow ? windowStart : now,
      emailVerificationRequestCount: count + 1
    });
    await ctx.scheduler.runAfter(CODE_LIFETIME_MS, internal.emailVerification.clearExpiredCode, { userId, expiresAt });
    return null;
  }
});

export const prepareExistingEmailVerification = internalMutation({
  args: { userId: v.id("users"), digest: v.string() },
  returns: v.string(),
  handler: async (ctx, { userId, digest }) => {
    const user = await ctx.db.get(userId);
    if (!user || user.emailVerificationRequiredAt || user.emailVerificationTime || !user.emailVerificationGraceStartedAt || user.emailVerificationPendingAddress) {
      throw new Error("This account does not need legacy email verification.");
    }
    const account = await ctx.db.query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId).eq("provider", "password"))
      .first();
    const email = account?.providerAccountId;
    if (!account || !email || email.endsWith("@username.biblestudytutor.local") || account.emailVerified) {
      throw new Error("This account does not need email verification.");
    }
    const now = Date.now();
    const windowStart = user.emailVerificationRequestWindowStartedAt || now;
    const inWindow = now - windowStart < REQUEST_WINDOW_MS;
    const requestCount = inWindow ? user.emailVerificationRequestCount || 0 : 0;
    if (requestCount >= MAX_REQUESTS_PER_HOUR) throw new Error("Too many codes requested. Please try again later.");
    if (user.emailVerificationCodeSentAt && now - user.emailVerificationCodeSentAt < 60_000) {
      throw new Error("Please wait a minute before requesting another code.");
    }
    await ctx.db.patch(userId, {
      emailVerificationCodeDigest: digest,
      emailVerificationCodeExpiresAt: now + CODE_LIFETIME_MS,
      emailVerificationCodeSentAt: now,
      emailVerificationCodeAttempts: 0,
      emailVerificationRequestWindowStartedAt: inWindow ? windowStart : now,
      emailVerificationRequestCount: requestCount + 1
    });
    await ctx.scheduler.runAfter(CODE_LIFETIME_MS, internal.emailVerification.clearExpiredCode, {
      userId,
      expiresAt: now + CODE_LIFETIME_MS
    });
    return email;
  }
});

export const permitNewEmailCode = internalMutation({
  args: { userId: v.id("users"), accountId: v.id("authAccounts") },
  returns: v.null(),
  handler: async (ctx, { userId, accountId }) => {
    const user = await ctx.db.get(userId);
    const account = await ctx.db.get(accountId);
    if (!user?.emailVerificationRequiredAt || !account || account.userId !== userId || account.provider !== "password" || account.emailVerified) {
      throw new Error("Email verification is unavailable for this account.");
    }
    const now = Date.now();
    const windowStart = user.emailVerificationRequestWindowStartedAt || now;
    const inWindow = now - windowStart < REQUEST_WINDOW_MS;
    const requestCount = inWindow ? user.emailVerificationRequestCount || 0 : 0;
    if (requestCount >= MAX_REQUESTS_PER_HOUR) throw new Error("Too many codes requested. Please try again later.");
    if (user.emailVerificationCodeSentAt && now - user.emailVerificationCodeSentAt < 60_000) {
      throw new Error("Please wait a minute before requesting another code.");
    }
    await ctx.db.patch(userId, {
      emailVerificationCodeSentAt: now,
      emailVerificationRequestWindowStartedAt: inWindow ? windowStart : now,
      emailVerificationRequestCount: requestCount + 1
    });
    return null;
  }
});

export const clearExpiredCode = internalMutation({
  args: { userId: v.id("users"), expiresAt: v.number() },
  returns: v.null(),
  handler: async (ctx, { userId, expiresAt }) => {
    const user = await ctx.db.get(userId);
    if (user?.emailVerificationCodeExpiresAt === expiresAt && Date.now() >= expiresAt) {
      await ctx.db.patch(userId, {
        emailVerificationCodeDigest: undefined,
        emailVerificationCodeExpiresAt: undefined,
        emailVerificationCodeAttempts: undefined,
        emailVerificationPendingAddress: undefined,
        emailVerificationPendingOriginAddress: undefined
      });
    }
    return null;
  }
});

export const confirmExistingEmailVerification = mutation({
  args: { code: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { code }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to verify your email.");
    if (!/^\d{8}$/.test(code)) throw new Error("Enter the eight-digit code from your email.");
    const user = await ctx.db.get(userId);
    const now = Date.now();
    if (!user?.emailVerificationCodeDigest || user.emailVerificationPendingAddress || !user.emailVerificationCodeExpiresAt || now > user.emailVerificationCodeExpiresAt) {
      throw new Error("This code has expired. Request a new one.");
    }
    const attempts = user.emailVerificationCodeAttempts || 0;
    if (attempts >= MAX_CODE_ATTEMPTS) throw new Error("Too many attempts. Request a new code.");
    if ((await codeDigest(userId, code)) !== user.emailVerificationCodeDigest) {
      await ctx.db.patch(userId, { emailVerificationCodeAttempts: attempts + 1 });
      return false;
    }
    const account = await ctx.db.query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId).eq("provider", "password"))
      .first();
    if (!account || account.providerAccountId.endsWith("@username.biblestudytutor.local")) throw new Error("Email account unavailable.");
    await ctx.db.patch(account._id, { emailVerified: account.providerAccountId });
    await ctx.db.patch(userId, {
      email: account.providerAccountId,
      emailVerificationTime: now,
      emailVerificationCodeDigest: undefined,
      emailVerificationCodeExpiresAt: undefined,
      emailVerificationCodeAttempts: undefined,
      emailVerificationCodeSentAt: undefined,
      emailVerificationPendingAddress: undefined,
      emailVerificationPendingOriginAddress: undefined
    });
    return true;
  }
});

export const confirmEmailChange = mutation({
  args: { code: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { code }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to change your email.");
    if (!/^\d{8}$/.test(code)) throw new Error("Enter the eight-digit code from your new email.");
    const user = await ctx.db.get(userId);
    const now = Date.now();
    const newEmail = user?.emailVerificationPendingAddress;
    if (!user?.emailVerificationCodeDigest || !user.emailVerificationCodeExpiresAt || now > user.emailVerificationCodeExpiresAt || !newEmail) {
      throw new Error("This code has expired. Request a new one.");
    }
    const attempts = user.emailVerificationCodeAttempts || 0;
    if (attempts >= MAX_CODE_ATTEMPTS) throw new Error("Too many attempts. Request a new code.");
    if ((await codeDigest(userId, code)) !== user.emailVerificationCodeDigest) {
      await ctx.db.patch(userId, { emailVerificationCodeAttempts: attempts + 1 });
      return false;
    }
    const account = await ctx.db.query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId).eq("provider", "password")).first();
    if (!account || account.providerAccountId !== user.emailVerificationPendingOriginAddress) {
      throw new Error("The account changed. Request a new code.");
    }
    const otherAccount = await ctx.db.query("authAccounts")
      .withIndex("providerAndAccountId", (q) => q.eq("provider", "password").eq("providerAccountId", newEmail)).first();
    const otherUser = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", newEmail)).first();
    if (otherAccount || (otherUser && otherUser._id !== userId)) throw new Error("That email address is already in use.");
    await ctx.db.patch(account._id, { providerAccountId: newEmail, emailVerified: newEmail });
    await ctx.db.patch(userId, {
      email: newEmail,
      emailVerificationTime: now,
      emailVerificationCodeDigest: undefined,
      emailVerificationCodeExpiresAt: undefined,
      emailVerificationCodeSentAt: undefined,
      emailVerificationCodeAttempts: undefined,
      emailVerificationPendingAddress: undefined,
      emailVerificationPendingOriginAddress: undefined
    });
    return true;
  }
});

export const dismissEmailVerificationNotice = mutation({
  args: { stage: v.number() },
  returns: v.null(),
  handler: async (ctx, { stage }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first.");
    const user = await ctx.db.get(userId);
    if (!user?.emailVerificationGraceStartedAt || !Number.isInteger(stage) || stage < 1 || stage > 4) {
      throw new Error("Notice unavailable.");
    }
    await ctx.db.patch(userId, { emailVerificationNoticeStageDismissed: Math.max(stage, user.emailVerificationNoticeStageDismissed || 0) });
    return null;
  }
});

// A new email account has not signed in or stored any work yet. The password
// holder can correct a typo, then must prove ownership of the new address.
export const movePendingSignupEmail = internalMutation({
  args: { userId: v.id("users"), accountId: v.id("authAccounts"), newEmail: v.string() },
  returns: v.null(),
  handler: async (ctx, { userId, accountId, newEmail }) => {
    const user = await ctx.db.get(userId);
    const account = await ctx.db.get(accountId);
    if (!user?.emailVerificationRequiredAt || user.emailVerificationTime || !account ||
        account.userId !== userId || account.provider !== "password" || account.emailVerified) {
      throw new Error("This address cannot be changed here.");
    }
    const accounts = await ctx.db.query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId)).take(2);
    const profile = await ctx.db.query("profiles")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", userId)).first();
    if (accounts.length !== 1 || profile) throw new Error("This address cannot be changed here. Please contact support.");
    const existingAccount = await ctx.db.query("authAccounts")
      .withIndex("providerAndAccountId", (q) => q.eq("provider", "password").eq("providerAccountId", newEmail)).first();
    const existingUser = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", newEmail)).first();
    if (existingAccount || (existingUser && existingUser._id !== userId)) throw new Error("That email address is already in use.");
    await ctx.db.patch(accountId, { providerAccountId: newEmail });
    await ctx.db.patch(userId, {
      email: newEmail,
      emailVerificationCodeSentAt: undefined,
      emailVerificationRequestWindowStartedAt: undefined,
      emailVerificationRequestCount: undefined
    });
    return null;
  }
});
