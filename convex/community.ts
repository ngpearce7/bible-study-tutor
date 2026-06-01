import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

const reactionValidator = v.union(v.literal("amen"), v.literal("praying"), v.literal("encouraged"));

export const myCircles = query({
  args: {
    profileId: v.id("profiles")
  },
  handler: async (ctx, args) => {
    await authorizeSignedInProfile(ctx, args.profileId);

    const memberships = await ctx.db
      .query("communityMembers")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .take(20);

    const circles = [];
    for (const membership of memberships) {
      const circle = await ctx.db.get(membership.circleId);
      if (!circle) continue;
      const members = await ctx.db
        .query("communityMembers")
        .withIndex("by_circle", (q) => q.eq("circleId", circle._id))
        .take(200);
      circles.push({
        ...circle,
        role: membership.role,
        memberCount: members.length
      });
    }

    return circles;
  }
});

export const feed = query({
  args: {
    profileId: v.id("profiles"),
    circleId: v.optional(v.id("communityCircles")),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await authorizeSignedInProfile(ctx, args.profileId);
    if (!args.circleId) return [];
    await authorizeCircleMember(ctx, args.circleId, args.profileId);

    const posts = await ctx.db
      .query("communityPosts")
      .withIndex("by_circle_created", (q) => q.eq("circleId", args.circleId!))
      .order("desc")
      .take(Math.min(args.limit ?? 12, 30));

    const enriched = [];
    for (const post of posts) {
      const reactions = await ctx.db
        .query("communityReactions")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .take(200);
      enriched.push({
        ...post,
        reactions: reactionSummary(reactions),
        myReactions: reactions.filter((reaction) => reaction.profileId === args.profileId).map((reaction) => reaction.reaction),
        canRemove: post.profileId === args.profileId
      });
    }

    return enriched;
  }
});

export const createCircle = mutation({
  args: {
    profileId: v.id("profiles"),
    name: v.string()
  },
  handler: async (ctx, args) => {
    const profile = await authorizeSignedInProfile(ctx, args.profileId);
    const authUserId = await getRequiredAuthUserId(ctx);
    const now = Date.now();
    const name = clampText(args.name, 80) || "Bible study circle";

    const circleId = await ctx.db.insert("communityCircles", {
      name,
      inviteCode: "pending",
      ownerProfileId: args.profileId,
      ownerAuthUserId: authUserId,
      createdAt: now,
      updatedAt: now
    });
    const inviteCode = buildInviteCode(circleId);
    await ctx.db.patch(circleId, { inviteCode });
    await ctx.db.insert("communityMembers", {
      circleId,
      profileId: profile._id,
      authUserId,
      role: "owner",
      joinedAt: now
    });

    return { circleId, inviteCode };
  }
});

export const joinCircle = mutation({
  args: {
    profileId: v.id("profiles"),
    inviteCode: v.string()
  },
  handler: async (ctx, args) => {
    const profile = await authorizeSignedInProfile(ctx, args.profileId);
    const authUserId = await getRequiredAuthUserId(ctx);
    const inviteCode = clampText(args.inviteCode, 40).toUpperCase();
    const circle = await ctx.db
      .query("communityCircles")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
      .unique();
    if (!circle) throw new Error("Circle invite code not found.");

    const existing = await ctx.db
      .query("communityMembers")
      .withIndex("by_circle_and_profile", (q) => q.eq("circleId", circle._id).eq("profileId", profile._id))
      .unique();
    if (existing) return circle._id;

    await ctx.db.insert("communityMembers", {
      circleId: circle._id,
      profileId: profile._id,
      authUserId,
      role: "member",
      joinedAt: Date.now()
    });
    return circle._id;
  }
});

export const shareCheckin = mutation({
  args: {
    profileId: v.id("profiles"),
    circleId: v.id("communityCircles"),
    checkinId: v.optional(v.id("checkins")),
    note: v.string(),
    passageReference: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const profile = await authorizeSignedInProfile(ctx, args.profileId);
    await authorizeCircleMember(ctx, args.circleId, args.profileId);

    if (args.checkinId) {
      const checkin = await ctx.db.get(args.checkinId);
      if (!checkin || checkin.profileId !== args.profileId) throw new Error("Check-in not found.");
    }

    return await ctx.db.insert("communityPosts", {
      circleId: args.circleId,
      checkinId: args.checkinId,
      profileId: args.profileId,
      authorName: clampText(profile.displayName, 80) || "Bible student",
      note: clampText(args.note, 1200),
      passageReference: clampOptionalText(args.passageReference, 120),
      createdAt: Date.now()
    });
  }
});

export const reactToPost = mutation({
  args: {
    profileId: v.id("profiles"),
    postId: v.id("communityPosts"),
    reaction: reactionValidator
  },
  handler: async (ctx, args) => {
    await authorizeSignedInProfile(ctx, args.profileId);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Shared check-in not found.");
    await authorizeCircleMember(ctx, post.circleId, args.profileId);

    const existing = await ctx.db
      .query("communityReactions")
      .withIndex("by_post_and_profile_and_reaction", (q) =>
        q.eq("postId", args.postId).eq("profileId", args.profileId).eq("reaction", args.reaction)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }

    await ctx.db.insert("communityReactions", {
      postId: args.postId,
      profileId: args.profileId,
      reaction: args.reaction,
      createdAt: Date.now()
    });
    return true;
  }
});

export const removePost = mutation({
  args: {
    profileId: v.id("profiles"),
    postId: v.id("communityPosts")
  },
  handler: async (ctx, args) => {
    await authorizeSignedInProfile(ctx, args.profileId);
    const post = await ctx.db.get(args.postId);
    if (!post) return false;
    await authorizeCircleMember(ctx, post.circleId, args.profileId);
    if (post.profileId !== args.profileId) throw new Error("Only the person who shared this check-in can remove it.");

    const reactions = await ctx.db
      .query("communityReactions")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .take(200);
    for (const reaction of reactions) {
      await ctx.db.delete(reaction._id);
    }
    await ctx.db.delete(args.postId);
    return true;
  }
});

async function authorizeSignedInProfile(ctx: QueryCtx | MutationCtx, profileId: Id<"profiles">) {
  const profile = await ctx.db.get(profileId);
  if (!profile) throw new Error("Profile not found.");

  const authUserId = await getRequiredAuthUserId(ctx);
  if (profile.authUserId !== authUserId) throw new Error("Sign in to use private circles.");

  return profile;
}

async function authorizeCircleMember(ctx: QueryCtx | MutationCtx, circleId: Id<"communityCircles">, profileId: Id<"profiles">) {
  const membership = await ctx.db
    .query("communityMembers")
    .withIndex("by_circle_and_profile", (q) => q.eq("circleId", circleId).eq("profileId", profileId))
    .unique();
  if (!membership) throw new Error("You are not a member of this circle.");
  return membership;
}

async function getRequiredAuthUserId(ctx: QueryCtx | MutationCtx) {
  const authUserId = await getAuthUserId(ctx);
  if (!authUserId) throw new Error("Sign in to use private circles.");
  return authUserId;
}

function reactionSummary(reactions: Doc<"communityReactions">[]) {
  return {
    amen: reactions.filter((reaction) => reaction.reaction === "amen").length,
    praying: reactions.filter((reaction) => reaction.reaction === "praying").length,
    encouraged: reactions.filter((reaction) => reaction.reaction === "encouraged").length
  };
}

function buildInviteCode(circleId: Id<"communityCircles">) {
  return String(circleId).replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase();
}

function clampText(value: string | undefined, maxLength: number) {
  return (value || "").trim().slice(0, maxLength);
}

function clampOptionalText(value: string | undefined, maxLength: number) {
  const cleaned = clampText(value, maxLength);
  return cleaned || undefined;
}
