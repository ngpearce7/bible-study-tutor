/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { api, internal } from "./_generated/api";

const modules = import.meta.glob("./**/*.ts");

async function digest(userId: string, code: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${userId}:${code}`));
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

describe("email verification rollout", () => {
  test("only existing unverified email accounts start a grace period, and it starts once", async () => {
    const t = convexTest(schema, modules);
    const [legacy, username, newEmail] = await t.run(async (ctx) => {
      const make = async (email: string, required = false) => {
        const userId = await ctx.db.insert("users", { email, ...(required ? { emailVerificationRequiredAt: 100 } : {}) });
        await ctx.db.insert("authAccounts", { userId, provider: "password", providerAccountId: email });
        return userId;
      };
      return [await make("legacy@example.org"), await make("reader@username.biblestudytutor.local"), await make("new@example.org", true)];
    });
    await t.withIdentity({ subject: `${legacy}|session` }).mutation(api.study.ensureProfile, {});
    const firstStart = await t.run(async (ctx) => (await ctx.db.get(legacy))?.emailVerificationGraceStartedAt);
    expect(firstStart).toBeTypeOf("number");
    await t.withIdentity({ subject: `${legacy}|session` }).mutation(api.study.ensureProfile, {});
    await t.withIdentity({ subject: `${username}|session` }).mutation(api.study.ensureProfile, {});
    await t.withIdentity({ subject: `${newEmail}|session` }).mutation(api.study.ensureProfile, {});
    await t.run(async (ctx) => {
      expect((await ctx.db.get(legacy))?.emailVerificationGraceStartedAt).toBe(firstStart);
      expect((await ctx.db.get(username))?.emailVerificationGraceStartedAt).toBeUndefined();
      expect((await ctx.db.get(newEmail))?.emailVerificationGraceStartedAt).toBeUndefined();
    });
  });

  test("an existing account can confirm its own code; wrong codes and other users cannot", async () => {
    const t = convexTest(schema, modules);
    const { userId, otherId, accountId } = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", { email: "reader@example.org", emailVerificationGraceStartedAt: Date.now() });
      const otherId = await ctx.db.insert("users", { email: "other@example.org" });
      const accountId = await ctx.db.insert("authAccounts", { userId, provider: "password", providerAccountId: "reader@example.org" });
      return { userId, otherId, accountId };
    });
    const code = "12345678";
    await t.run(async (ctx) => ctx.db.patch(userId, {
      emailVerificationCodeDigest: await digest(userId, code),
      emailVerificationCodeExpiresAt: Date.now() + 15 * 60 * 1000,
      emailVerificationCodeAttempts: 0
    }));
    const reader = t.withIdentity({ subject: `${userId}|session` });
    const other = t.withIdentity({ subject: `${otherId}|session` });
    await expect(other.mutation(api.emailVerification.confirmExistingEmailVerification, { code })).rejects.toThrow();
    expect(await reader.mutation(api.emailVerification.confirmExistingEmailVerification, { code: "00000000" })).toBe(false);
    await t.run(async (ctx) => { expect((await ctx.db.get(userId))?.emailVerificationCodeAttempts).toBe(1); });
    expect(await reader.mutation(api.emailVerification.confirmExistingEmailVerification, { code })).toBe(true);
    await t.run(async (ctx) => {
      expect((await ctx.db.get(userId))?.emailVerificationTime).toBeTypeOf("number");
      expect((await ctx.db.get(accountId))?.emailVerified).toBe("reader@example.org");
      expect((await ctx.db.get(userId))?.emailVerificationCodeDigest).toBeUndefined();
    });
  });

  test("an existing user can change email only after confirming a code sent to the new address", async () => {
    const t = convexTest(schema, modules);
    const { userId, otherId, accountId } = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", { email: "old@example.org", emailVerificationGraceStartedAt: Date.now() });
      const otherId = await ctx.db.insert("users", { email: "other@example.org" });
      const accountId = await ctx.db.insert("authAccounts", { userId, provider: "password", providerAccountId: "old@example.org" });
      await ctx.db.insert("profiles", { authUserId: userId, clientKey: "auth:reader", displayName: "Reader", createdAt: 1, updatedAt: 1 });
      return { userId, otherId, accountId };
    });
    const code = "87654321";
    await t.mutation(internal.emailVerification.prepareEmailChange, {
      userId, accountId, newEmail: "new@example.org", digest: await digest(userId, code)
    });
    await expect(t.mutation(internal.emailVerification.prepareExistingEmailVerification, { userId, digest: "unused" })).rejects.toThrow();
    const other = t.withIdentity({ subject: `${otherId}|session` });
    await expect(other.mutation(api.emailVerification.confirmEmailChange, { code })).rejects.toThrow();
    const reader = t.withIdentity({ subject: `${userId}|session` });
    expect(await reader.mutation(api.emailVerification.confirmEmailChange, { code: "00000000" })).toBe(false);
    await t.run(async (ctx) => {
      expect((await ctx.db.get(accountId))?.providerAccountId).toBe("old@example.org");
      expect((await ctx.db.get(userId))?.email).toBe("old@example.org");
    });
    expect(await reader.mutation(api.emailVerification.confirmEmailChange, { code })).toBe(true);
    await t.run(async (ctx) => {
      expect((await ctx.db.get(accountId))?.providerAccountId).toBe("new@example.org");
      expect((await ctx.db.get(accountId))?.emailVerified).toBe("new@example.org");
      expect((await ctx.db.get(userId))?.email).toBe("new@example.org");
      expect((await ctx.db.get(userId))?.emailVerificationPendingAddress).toBeUndefined();
      const profile = await ctx.db.query("profiles").withIndex("by_auth_user_id", (q) => q.eq("authUserId", userId)).first();
      expect(profile?.displayName).toBe("Reader");
    });
  });

  test("only a new, unused, unverified email account can correct its address", async () => {
    const t = convexTest(schema, modules);
    const { userId, accountId } = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", { email: "typo@example.org", emailVerificationRequiredAt: Date.now() });
      const accountId = await ctx.db.insert("authAccounts", { userId, provider: "password", providerAccountId: "typo@example.org" });
      return { userId, accountId };
    });
    await t.mutation(internal.emailVerification.movePendingSignupEmail, { userId, accountId, newEmail: "correct@example.org" });
    await t.run(async (ctx) => {
      expect((await ctx.db.get(userId))?.email).toBe("correct@example.org");
      expect((await ctx.db.get(accountId))?.providerAccountId).toBe("correct@example.org");
    });
    await t.run(async (ctx) => { await ctx.db.patch(userId, { emailVerificationTime: Date.now() }); });
    await expect(t.mutation(internal.emailVerification.movePendingSignupEmail, { userId, accountId, newEmail: "attacker@example.org" })).rejects.toThrow();
  });

  test("an expired grace period limits email invitations without blocking saved work", async () => {
    const t = convexTest(schema, modules);
    const { userId, profileId } = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        email: "reader@example.org",
        emailVerificationGraceStartedAt: Date.now() - 91 * 86_400_000
      });
      const profileId = await ctx.db.insert("profiles", {
        authUserId: userId, clientKey: "auth:reader", displayName: "Reader", createdAt: 1, updatedAt: 1
      });
      await ctx.db.insert("authAccounts", { userId, provider: "password", providerAccountId: "reader@example.org" });
      return { userId, profileId };
    });
    const reader = t.withIdentity({ subject: `${userId}|session` });
    await expect(reader.mutation(api.community.inviteFriendByEmail, { profileId, email: "friend@example.org" })).rejects.toThrow("Verify your account email");
    await expect(reader.query(api.study.recentSessions, { profileId })).resolves.toEqual([]);
  });

  test("new-account verification codes have a resend cooldown", async () => {
    const t = convexTest(schema, modules);
    const { userId, accountId } = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", { email: "new@example.org", emailVerificationRequiredAt: Date.now() });
      const accountId = await ctx.db.insert("authAccounts", { userId, provider: "password", providerAccountId: "new@example.org" });
      return { userId, accountId };
    });
    await t.mutation(internal.emailVerification.permitNewEmailCode, { userId, accountId });
    await expect(t.mutation(internal.emailVerification.permitNewEmailCode, { userId, accountId })).rejects.toThrow("wait a minute");
  });
});
