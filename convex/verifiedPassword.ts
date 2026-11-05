import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { createAccount, invalidateSessions, modifyAccountCredentials, retrieveAccount, signInViaProvider } from "@convex-dev/auth/server";
import type { DataModel } from "./_generated/dataModel";
import { passwordCrypto } from "./passwordCrypto";
import { passwordReset } from "./passwordReset";
import { passwordVerify } from "./passwordVerify";
import { assertCurrentTermsAcceptance, CURRENT_TERMS_VERSION } from "../data/accountTerms";
import { internal } from "./_generated/api";

const usernameDomain = "@username.biblestudytutor.local";

function accountProfile(params: Record<string, unknown>) {
  const flow = String(params.flow || "");
  assertCurrentTermsAcceptance(flow, params.termsAccepted, params.termsVersion);
  const requestedUsername = String(params.username || "").trim().toLowerCase().replace(/^@+/, "");
  const isUsername = params.authMode === "username" || !!requestedUsername;
  if (flow === "signUp" && (isUsername || String(params.email || "").trim().toLowerCase().endsWith(usernameDomain))) {
    throw new Error("Create an account with an email address. Existing username accounts can still sign in.");
  }
  if (isUsername && !/^[a-z0-9][a-z0-9._-]{2,23}$/.test(requestedUsername)) {
    throw new Error("Username must be 3 to 24 characters and use letters, numbers, dots, hyphens, or underscores.");
  }
  const email = isUsername ? `${requestedUsername}${usernameDomain}` : String(params.email || "").trim().toLowerCase();
  if (!isUsername && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  const name = String(params.name || "").trim().slice(0, 80);
  return {
    email: email.slice(0, 254),
    name: name || (isUsername ? requestedUsername : email),
    ...(flow === "signUp" ? {
      termsAcceptedAt: Date.now(),
      termsVersion: CURRENT_TERMS_VERSION,
      emailVerificationRequiredAt: Date.now()
    } : {})
  };
}

// Keep the provider ID "password" so existing credentials and recovery codes remain valid.
// Existing synthetic username credentials can still sign in, but all new accounts verify email.
export const verifiedPassword = ConvexCredentials<DataModel>({
  id: "password",
  crypto: passwordCrypto,
  extraProviders: [passwordReset, passwordVerify],
  authorize: async (params, ctx) => {
    const flow = String(params.flow || "");
    const profile = accountProfile(params);
    const email = profile.email;
    const secret = params.password as string | undefined;
    if (flow === "signUp") {
      if (!secret || secret.length < 8) throw new Error("Password must have at least 8 characters.");
      const { account, user } = await createAccount(ctx, {
        provider: "password",
        account: { id: email, secret },
        profile,
        // An unverified address must never link this password to an existing
        // OAuth account merely because both accounts claim the same email.
        shouldLinkViaEmail: false
      });
      if (user.emailVerificationRequiredAt && !account.emailVerified) {
        await ctx.runMutation(internal.emailVerification.permitNewEmailCode, { userId: user._id, accountId: account._id });
        return await signInViaProvider(ctx, passwordVerify, { accountId: account._id, params });
      }
      return { userId: user._id };
    }
    if (flow === "signIn") {
      if (!secret) throw new Error("Missing password.");
      const retrieved = await retrieveAccount(ctx, { provider: "password", account: { id: email, secret } });
      if (!retrieved) throw new Error("Invalid credentials.");
      if (retrieved.user.emailVerificationRequiredAt && !retrieved.account.emailVerified) {
        await ctx.runMutation(internal.emailVerification.permitNewEmailCode, { userId: retrieved.user._id, accountId: retrieved.account._id });
        return await signInViaProvider(ctx, passwordVerify, { accountId: retrieved.account._id, params });
      }
      return { userId: retrieved.user._id };
    }
    if (flow === "email-verification") {
      if (typeof params.code !== "string" || !params.code.trim()) throw new Error("Enter the code from your email.");
      const retrieved = await retrieveAccount(ctx, { provider: "password", account: { id: email } });
      if (!retrieved || !retrieved.user.emailVerificationRequiredAt || retrieved.account.emailVerified) {
        throw new Error("No pending email verification for this account.");
      }
      return await signInViaProvider(ctx, passwordVerify, { accountId: retrieved.account._id, params });
    }
    if (flow === "correct-email") {
      const newEmail = String(params.newEmail || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail) || newEmail.length > 254 || newEmail.endsWith(usernameDomain)) {
        throw new Error("Enter a valid new email address.");
      }
      if (!secret) throw new Error("Enter your account password.");
      const retrieved = await retrieveAccount(ctx, { provider: "password", account: { id: email, secret } });
      if (!retrieved) throw new Error("Invalid credentials.");
      await ctx.runMutation(internal.emailVerification.movePendingSignupEmail, {
        userId: retrieved.user._id,
        accountId: retrieved.account._id,
        newEmail
      });
      await ctx.runMutation(internal.emailVerification.permitNewEmailCode, { userId: retrieved.user._id, accountId: retrieved.account._id });
      return await signInViaProvider(ctx, passwordVerify, { accountId: retrieved.account._id, params });
    }
    if (flow === "reset") {
      const retrieved = await retrieveAccount(ctx, { provider: "password", account: { id: email } });
      if (!retrieved) throw new Error("Account unavailable.");
      return await signInViaProvider(ctx, passwordReset, { accountId: retrieved.account._id, params });
    }
    if (flow === "reset-verification") {
      const newPassword = params.newPassword as string | undefined;
      if (!newPassword || newPassword.length < 8) throw new Error("Password must have at least 8 characters.");
      const retrieved = await retrieveAccount(ctx, { provider: "password", account: { id: email } });
      if (!retrieved) throw new Error("Account unavailable.");
      const result = await signInViaProvider(ctx, passwordReset, { params });
      if (!result || result.userId !== retrieved.user._id) throw new Error("Invalid code.");
      await modifyAccountCredentials(ctx, { provider: "password", account: { id: email, secret: newPassword } });
      await invalidateSessions(ctx, { userId: result.userId, except: [result.sessionId] });
      return result;
    }
    throw new Error("Unsupported sign-in flow.");
  }
});
