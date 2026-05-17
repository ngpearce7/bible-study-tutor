import { getAuthUserId, modifyAccountCredentials, retrieveAccount } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { action, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

export const savePlan = mutation({
  args: {
    profileId: v.id("profiles"),
    weeklyGoal: v.string(),
    accountabilityPartner: v.string(),
    preferredMethodId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    const { profileId, ...patch } = args;
    await ctx.db.patch(profileId, {
      ...patch,
      updatedAt: Date.now()
    });
  }
});

export const saveAccountSettings = mutation({
  args: {
    profileId: v.id("profiles"),
    displayName: v.string(),
    email: v.optional(v.string()),
    weeklyGoal: v.optional(v.string()),
    accountabilityPartner: v.optional(v.string()),
    preferredMethodId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);
    const authUserId = await getAuthUserId(ctx);
    const nextName = args.displayName.trim() || "Bible student";
    const nextEmail = args.email?.trim().toLowerCase();

    const { profileId, email, ...patch } = args;
    await ctx.db.patch(profileId, {
      ...patch,
      displayName: nextName,
      updatedAt: Date.now()
    });

    if (!authUserId) return;

    const authUser = await ctx.db.get(authUserId);
    const userPatch: { name: string; email?: string } = { name: nextName };

    if (nextEmail && nextEmail !== authUser?.email?.toLowerCase()) {
      const passwordAccount = await ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) => q.eq("userId", authUserId).eq("provider", "password"))
        .unique();

      if (!passwordAccount) throw new Error("Email changes are only available for email and password accounts.");

      const existingAccount = await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", (q) => q.eq("provider", "password").eq("providerAccountId", nextEmail))
        .unique();
      if (existingAccount && existingAccount.userId !== authUserId) throw new Error("That email is already used by another account.");

      await ctx.db.patch(passwordAccount._id, {
        providerAccountId: nextEmail,
        emailVerified: undefined
      });
      userPatch.email = nextEmail;
    }

    await ctx.db.patch(authUserId, userPatch);
  }
});

export const changePassword = action({
  args: {
    email: v.string(),
    currentPassword: v.string(),
    newPassword: v.string()
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Sign in before changing your password.");

    const email = args.email.trim().toLowerCase();
    if (!email || !args.currentPassword) throw new Error("Add your current password.");
    if (!args.newPassword || args.newPassword.length < 8) throw new Error("New password needs at least 8 characters.");

    const retrieved = await retrieveAccount(ctx, {
      provider: "password",
      account: { id: email, secret: args.currentPassword }
    });
    if (retrieved.user._id !== authUserId) throw new Error("Current password was not accepted.");

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: email, secret: args.newPassword }
    });

    return true;
  }
});

export const saveCheckin = mutation({
  args: {
    profileId: v.id("profiles"),
    mood: v.string(),
    note: v.string(),
    sentAt: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    return await ctx.db.insert("checkins", {
      ...args,
      createdAt: Date.now()
    });
  }
});

export const profile = query({
  args: {
    profileId: v.id("profiles")
  },
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    const authUserId = await getAuthUserId(ctx);
    const authUser = authUserId ? await ctx.db.get(authUserId) : null;
    const authAccounts = authUserId
      ? await ctx.db
          .query("authAccounts")
          .withIndex("userIdAndProvider", (q) => q.eq("userId", authUserId))
          .collect()
      : [];
    const preferredAuthAccount =
      authAccounts.find((account) => account.provider === "google") ||
      authAccounts.find((account) => account.provider === "apple") ||
      authAccounts[0];

    return {
      ...profile,
      authEmail: authUser?.email,
      authName: authUser?.name,
      authProvider: preferredAuthAccount?.provider
    };
  }
});

export const recentCheckins = query({
  args: {
    profileId: v.id("profiles"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    return await ctx.db
      .query("checkins")
      .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(args.limit ?? 12);
  }
});

export const deleteCheckin = mutation({
  args: {
    profileId: v.id("profiles"),
    checkinId: v.id("checkins")
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    const checkin = await ctx.db.get(args.checkinId);
    if (!checkin || checkin.profileId !== args.profileId) return false;

    await ctx.db.delete(args.checkinId);
    return true;
  }
});

export const updateCheckin = mutation({
  args: {
    profileId: v.id("profiles"),
    checkinId: v.id("checkins"),
    note: v.string()
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    const checkin = await ctx.db.get(args.checkinId);
    if (!checkin || checkin.profileId !== args.profileId) return false;

    await ctx.db.patch(args.checkinId, {
      note: args.note
    });
    return true;
  }
});

async function authorizeProfileAccess(ctx: QueryCtx | MutationCtx, profileId: Id<"profiles">) {
  const profile = await ctx.db.get(profileId);
  if (!profile) throw new Error("Profile not found");

  const authUserId = await getAuthUserId(ctx);
  if (authUserId && profile.authUserId !== authUserId) throw new Error("Unauthorized");

  return profile;
}
