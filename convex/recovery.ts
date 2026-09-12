"use node";
import { randomBytes, createHash } from "node:crypto";
import { getAuthUserId, retrieveAccount } from "@convex-dev/auth/server";
import { passwordCrypto } from "./passwordCrypto";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const digest = (code: string) => createHash("sha256").update(code.trim()).digest("hex");
export const createCode = action({
  args: { accountId: v.string(), password: v.string() }, returns: v.string(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in first");
    const account = await retrieveAccount(ctx, { provider: "password", account: { id: args.accountId, secret: args.password } });
    if (account.user._id !== userId) throw new Error("Unauthorized");
    const code = randomBytes(32).toString("hex");
    await ctx.runMutation(internal.recoveryData.saveCode, { userId, digest: digest(code) });
    return code;
  }
});
export const resetWithCode = action({
  args: { code: v.string(), password: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    if (!/^[a-f0-9]{64}$/.test(args.code.trim()) || args.password.length < 8 || args.password.length > 1024) throw new Error("Invalid recovery code or password");
    const codeDigest = digest(args.code);
    if (!await ctx.runQuery(internal.recoveryData.hasCode, { digest: codeDigest })) throw new Error("Invalid recovery code or password");
    const secret = await passwordCrypto.hashSecret(args.password);
    await ctx.runMutation(internal.recoveryData.redeemCode, { digest: codeDigest, secret });
    return null;
  }
});
