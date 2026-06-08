import { getAuthUserId, modifyAccountCredentials, retrieveAccount } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
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

    await ctx.db.patch(args.profileId, {
      weeklyGoal: clampText(args.weeklyGoal, 300),
      accountabilityPartner: clampText(args.accountabilityPartner, 200),
      preferredMethodId: clampOptionalText(args.preferredMethodId, 80),
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
    preferredMethodId: v.optional(v.string()),
    appearanceMode: v.optional(v.union(v.literal("light"), v.literal("dark")))
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);
    const authUserId = await getAuthUserId(ctx);
    const nextName = clampText(args.displayName, 80) || "Bible student";
    const nextEmail = clampText(args.email, 254).toLowerCase();

    await ctx.db.patch(args.profileId, {
      displayName: nextName,
      weeklyGoal: clampOptionalText(args.weeklyGoal, 300),
      accountabilityPartner: clampOptionalText(args.accountabilityPartner, 200),
      preferredMethodId: clampOptionalText(args.preferredMethodId, 80),
      appearanceMode: args.appearanceMode,
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

export const saveScriptureInsertSettings = mutation({
  args: {
    profileId: v.id("profiles"),
    settings: v.object({
      disabled: v.boolean(),
      bold: v.boolean(),
      italic: v.boolean(),
      color: v.string(),
      highlightColor: v.string(),
      referencePosition: v.union(v.literal("front"), v.literal("end"))
    })
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    await ctx.db.patch(args.profileId, {
      scriptureInsertSettings: {
        disabled: args.settings.disabled,
        bold: args.settings.bold,
        italic: args.settings.italic,
        color: clampText(args.settings.color, 40),
        highlightColor: clampText(args.settings.highlightColor, 40),
        referencePosition: args.settings.referencePosition
      },
      updatedAt: Date.now()
    });
  }
});

export const saveUiPreference = mutation({
  args: {
    profileId: v.id("profiles"),
    key: v.string(),
    value: v.boolean()
  },
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId);
    const key = clampText(args.key, 80);
    if (!key || key.startsWith("$") || key.startsWith("_")) throw new Error("Invalid preference key.");

    await ctx.db.patch(args.profileId, {
      uiPreferences: {
        ...(((profile as any).uiPreferences as Record<string, boolean> | undefined) || {}),
        [key]: args.value
      },
      updatedAt: Date.now()
    });
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
    if (email.length > 254 || args.currentPassword.length > 200 || args.newPassword.length > 200) throw new Error("Those details are too long.");

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
      profileId: args.profileId,
      mood: clampText(args.mood, 80),
      note: clampText(args.note, 4000),
      sentAt: args.sentAt,
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

    const checkins = await ctx.db
      .query("checkins")
      .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(args.limit ?? 12);

    const profilePosts = await ctx.db
      .query("communityPosts")
      .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(200);

    const enriched = [];
    for (const checkin of checkins) {
      const sharedPosts = profilePosts.filter((post) => post.checkinId === checkin._id);
      const sharedTo = [];
      const allReactions = [];
      for (const post of sharedPosts) {
        const reactions = await ctx.db
          .query("communityReactions")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .take(200);
        allReactions.push(...reactions);
        if (post.circleId) {
          const circle = await ctx.db.get(post.circleId);
          if (!circle) continue;
          sharedTo.push({
            postId: post._id,
            circleId: circle._id,
            circleName: circle.name,
            destinationType: "circle",
            createdAt: post.createdAt
          });
        } else if (post.recipientProfileId) {
          const friendProfile = await ctx.db.get(post.recipientProfileId);
          sharedTo.push({
            postId: post._id,
            friendProfileId: post.recipientProfileId,
            friendName: friendProfile?.displayName || "Friend",
            destinationType: "friend",
            createdAt: post.createdAt
          });
        }
      }
      enriched.push({
        ...checkin,
        itemType: "checkin",
        authorLabel: "Posted by me",
        canEdit: true,
        sharedPostId: sharedPosts.length === 1 ? sharedPosts[0]._id : undefined,
        reactions: reactionSummary(allReactions),
        myReactions: allReactions.filter((reaction) => reaction.profileId === args.profileId).map((reaction) => reaction.reaction),
        sharedTo
      });
    }

    const standalonePosts = profilePosts.filter((post) => !post.checkinId);
    for (const post of standalonePosts) {
      const reactions = await ctx.db
        .query("communityReactions")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .take(200);
      const sharedTo = [];
      if (post.circleId) {
        const circle = await ctx.db.get(post.circleId);
        if (circle) {
          sharedTo.push({
            postId: post._id,
            circleId: circle._id,
            circleName: circle.name,
            destinationType: "circle",
            createdAt: post.createdAt
          });
        }
      } else if (post.recipientProfileId) {
        const friendProfile = await ctx.db.get(post.recipientProfileId);
        sharedTo.push({
          postId: post._id,
          friendProfileId: post.recipientProfileId,
          friendName: friendProfile?.displayName || "Friend",
          destinationType: "friend",
          createdAt: post.createdAt
        });
      }
      enriched.push({
        _id: post._id,
        itemType: "communityPost",
        mood: post.source === "studyInsight" ? "study insight" : "shared post",
        note: post.note,
        authorName: post.authorName,
        authorLabel: post.profileId === args.profileId ? "Posted by me" : `Posted by ${post.authorName || "Bible student"}`,
        canEdit: post.profileId === args.profileId,
        passageReference: post.passageReference,
        createdAt: post.createdAt,
        sentAt: post.createdAt,
        sharedPostId: post._id,
        reactions: reactionSummary(reactions),
        myReactions: reactions.filter((reaction) => reaction.profileId === args.profileId).map((reaction) => reaction.reaction),
        sharedTo
      });
    }

    return enriched.sort((a, b) => b.createdAt - a.createdAt).slice(0, args.limit ?? 12);
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

    const sharedPosts = (await ctx.db
      .query("communityPosts")
      .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(200)).filter((post) => post.checkinId === args.checkinId);
    for (const post of sharedPosts) {
      const reactions = await ctx.db
        .query("communityReactions")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .take(200);
      for (const reaction of reactions) {
        await ctx.db.delete(reaction._id);
      }
      await ctx.db.delete(post._id);
    }
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

    const nextNote = clampText(args.note, 4000);
    await ctx.db.patch(args.checkinId, {
      note: nextNote
    });

    const sharedPosts = (await ctx.db
      .query("communityPosts")
      .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(200)).filter((post) => post.checkinId === args.checkinId);
    for (const post of sharedPosts) {
      await ctx.db.patch(post._id, {
        note: clampText(nextNote, 1200)
      });
    }
    return true;
  }
});

function clampText(value: string | undefined, maxLength: number) {
  return (value || "").trim().slice(0, maxLength);
}

function clampOptionalText(value: string | undefined, maxLength: number) {
  const cleaned = clampText(value, maxLength);
  return cleaned || undefined;
}

function reactionSummary(reactions: Doc<"communityReactions">[]) {
  return {
    amen: reactions.filter((reaction) => reaction.reaction === "amen").length,
    praying: reactions.filter((reaction) => reaction.reaction === "praying").length,
    encouraged: reactions.filter((reaction) => reaction.reaction === "encouraged").length
  };
}

async function authorizeProfileAccess(ctx: QueryCtx | MutationCtx, profileId: Id<"profiles">) {
  const profile = await ctx.db.get(profileId);
  if (!profile) throw new Error("Profile not found");

  const authUserId = await getAuthUserId(ctx);
  if (authUserId && profile.authUserId !== authUserId) throw new Error("Unauthorized");

  return profile;
}
