import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const saveCode = internalMutation({
  args: { userId: v.id("users"), digest: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    if (await getAuthUserId(ctx) !== args.userId) throw new Error("Unauthorized");
    const profile = await ctx.db.query("profiles").withIndex("by_auth_user_id", q => q.eq("authUserId", args.userId)).unique();
    if (!profile || profile.suspendedAt) throw new Error("Account unavailable");
    await ctx.db.patch(profile._id, { recoveryDigest: args.digest });
    return null;
  }
});
export const hasCode = internalQuery({
  args: { digest: v.string() }, returns: v.boolean(),
  handler: async (ctx, args) => !!await ctx.db.query("profiles").withIndex("by_recovery_digest", q => q.eq("recoveryDigest", args.digest)).unique()
});
export const redeemCode = internalMutation({
  args: { digest: v.string(), secret: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ctx.db.query("profiles").withIndex("by_recovery_digest", q => q.eq("recoveryDigest", args.digest)).unique();
    if (!profile?.authUserId || profile.suspendedAt) throw new Error("Invalid recovery code");
    const account = await ctx.db.query("authAccounts").withIndex("userIdAndProvider", q => q.eq("userId", profile.authUserId!).eq("provider", "password")).unique();
    if (!account) throw new Error("Password account unavailable");
    const sessions = await ctx.db.query("authSessions").withIndex("userId", q => q.eq("userId", profile.authUserId!)).take(101);
    if (sessions.length > 100) throw new Error("Contact support to recover this account");
    // Atomic with code consumption: two concurrent redemptions cannot both succeed.
    // Uses the installed Password provider's hash format, not a custom password hash.
    await ctx.db.patch(account._id, { secret: args.secret });
    await ctx.db.patch(profile._id, { recoveryDigest: undefined });
    for (const session of sessions) await ctx.db.delete(session._id);
    return null;
  }
});
