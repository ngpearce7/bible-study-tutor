import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

const reactionValidator = v.union(v.literal("amen"), v.literal("praying"), v.literal("encouraged"));

export const myFriends = query({
  args: {
    profileId: v.id("profiles")
  },
  handler: async (ctx, args) => {
    await authorizeSignedInProfile(ctx, args.profileId);

    const sent = await ctx.db
      .query("communityFriends")
      .withIndex("by_requester", (q) => q.eq("requesterProfileId", args.profileId))
      .take(50);
    const received = await ctx.db
      .query("communityFriends")
      .withIndex("by_recipient", (q) => q.eq("recipientProfileId", args.profileId))
      .take(50);

    const rows = [...sent, ...received].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 80);
    const friends = [];
    for (const row of rows) {
      const isRequester = row.requesterProfileId === args.profileId;
      const otherProfile = await ctx.db.get(isRequester ? row.recipientProfileId : row.requesterProfileId);
      const otherUser = await ctx.db.get(isRequester ? row.recipientAuthUserId : row.requesterAuthUserId);
      if (!otherProfile) continue;
      friends.push({
        _id: row._id,
        friendProfileId: otherProfile._id,
        name: clampText(otherProfile.displayName, 80) || "Bible student",
        email: otherUser?.email || "",
        status: row.status,
        direction: isRequester ? "sent" : "received",
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      });
    }

    return friends;
  }
});

export const inviteFriendByEmail = mutation({
  args: {
    profileId: v.id("profiles"),
    email: v.string()
  },
  handler: async (ctx, args) => {
    const profile = await authorizeSignedInProfile(ctx, args.profileId);
    const authUserId = await getRequiredAuthUserId(ctx);
    const email = clampText(args.email, 254).toLowerCase();
    if (!email) throw new Error("Add your friend's account email.");

    const targetUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (!targetUser) throw new Error("No registered user found with that email.");
    if (targetUser._id === authUserId) throw new Error("You cannot add yourself as a friend.");

    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", targetUser._id))
      .unique();
    if (!targetProfile) throw new Error("That user has not finished setting up a profile yet.");

    return await createOrAcceptFriendship(ctx, profile, authUserId, targetProfile, targetUser._id);
  }
});

export const ensureFriendCode = mutation({
  args: {
    profileId: v.id("profiles")
  },
  handler: async (ctx, args) => {
    const profile = await authorizeSignedInProfile(ctx, args.profileId);
    if (profile.friendCode) return profile.friendCode;

    const friendCode = buildFriendCode(profile._id);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_friend_code", (q) => q.eq("friendCode", friendCode))
      .unique();
    if (existing && existing._id !== profile._id) throw new Error("Could not create a friend code. Please try again.");

    await ctx.db.patch(profile._id, { friendCode, updatedAt: Date.now() });
    return friendCode;
  }
});

export const inviteFriendByCode = mutation({
  args: {
    profileId: v.id("profiles"),
    friendCode: v.string()
  },
  handler: async (ctx, args) => {
    const profile = await authorizeSignedInProfile(ctx, args.profileId);
    const authUserId = await getRequiredAuthUserId(ctx);
    const friendCode = normalizeFriendCode(args.friendCode);
    if (!friendCode) throw new Error("Enter your friend's code.");

    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_friend_code", (q) => q.eq("friendCode", friendCode))
      .unique();
    if (!targetProfile) throw new Error("No registered user found with that friend code.");
    if (targetProfile._id === profile._id) throw new Error("You cannot add yourself as a friend.");
    if (!targetProfile.authUserId) throw new Error("That user has not finished setting up a signed-in profile yet.");

    return await createOrAcceptFriendship(ctx, profile, authUserId, targetProfile, targetProfile.authUserId);
  }
});

async function createOrAcceptFriendship(
  ctx: MutationCtx,
  profile: Doc<"profiles">,
  authUserId: Id<"users">,
  targetProfile: Doc<"profiles">,
  targetAuthUserId: Id<"users">
) {
  const existingForward = await ctx.db
    .query("communityFriends")
    .withIndex("by_requester_and_recipient", (q) => q.eq("requesterProfileId", profile._id).eq("recipientProfileId", targetProfile._id))
    .unique();
  if (existingForward) return existingForward._id;

  const existingReverse = await ctx.db
    .query("communityFriends")
    .withIndex("by_requester_and_recipient", (q) => q.eq("requesterProfileId", targetProfile._id).eq("recipientProfileId", profile._id))
    .unique();
  if (existingReverse) {
    if (existingReverse.status === "pending") {
      await ctx.db.patch(existingReverse._id, { status: "accepted", updatedAt: Date.now() });
    }
    return existingReverse._id;
  }

  const now = Date.now();
  return await ctx.db.insert("communityFriends", {
    requesterProfileId: profile._id,
    recipientProfileId: targetProfile._id,
    requesterAuthUserId: authUserId,
    recipientAuthUserId: targetAuthUserId,
    status: "pending",
    createdAt: now,
    updatedAt: now
  });
}

export const acceptFriend = mutation({
  args: {
    profileId: v.id("profiles"),
    friendId: v.id("communityFriends")
  },
  handler: async (ctx, args) => {
    await authorizeSignedInProfile(ctx, args.profileId);
    const friendship = await ctx.db.get(args.friendId);
    if (!friendship || friendship.recipientProfileId !== args.profileId) throw new Error("Friend invite not found.");
    await ctx.db.patch(friendship._id, { status: "accepted", updatedAt: Date.now() });
    return true;
  }
});

export const removeFriend = mutation({
  args: {
    profileId: v.id("profiles"),
    friendId: v.id("communityFriends")
  },
  handler: async (ctx, args) => {
    await authorizeSignedInProfile(ctx, args.profileId);
    const friendship = await ctx.db.get(args.friendId);
    if (!friendship) return false;
    if (friendship.requesterProfileId !== args.profileId && friendship.recipientProfileId !== args.profileId) {
      throw new Error("Friend connection not found.");
    }
    await ctx.db.delete(friendship._id);
    return true;
  }
});

export const myCircles = query({
  args: {
    profileId: v.id("profiles")
  },
  handler: async (ctx, args) => {
    await authorizeSignedInProfile(ctx, args.profileId);
    const authUserId = await getRequiredAuthUserId(ctx);

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
        memberCount: members.length,
        canDelete: membership.role === "owner" || circle.ownerProfileId === args.profileId || circle.ownerAuthUserId === authUserId
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

export const updatePost = mutation({
  args: {
    profileId: v.id("profiles"),
    postId: v.id("communityPosts"),
    note: v.string()
  },
  handler: async (ctx, args) => {
    await authorizeSignedInProfile(ctx, args.profileId);
    const post = await ctx.db.get(args.postId);
    if (!post) return false;
    await authorizeCircleMember(ctx, post.circleId, args.profileId);
    if (post.profileId !== args.profileId) throw new Error("Only the person who shared this check-in can edit it.");

    const nextNote = clampText(args.note, 1200);
    await ctx.db.patch(args.postId, { note: nextNote });
    if (post.checkinId) {
      const checkin = await ctx.db.get(post.checkinId);
      if (checkin && checkin.profileId === args.profileId) {
        await ctx.db.patch(checkin._id, { note: clampText(args.note, 4000) });
      }
    }
    return true;
  }
});

export const leaveCircle = mutation({
  args: {
    profileId: v.id("profiles"),
    circleId: v.id("communityCircles")
  },
  handler: async (ctx, args) => {
    await authorizeSignedInProfile(ctx, args.profileId);
    const authUserId = await getRequiredAuthUserId(ctx);
    const membership = await authorizeCircleMember(ctx, args.circleId, args.profileId);
    const circle = await ctx.db.get(args.circleId);
    if (membership.role === "owner" || circle?.ownerProfileId === args.profileId || circle?.ownerAuthUserId === authUserId) throw new Error("Owners need to delete the circle instead.");

    await removeProfileReactionsInCircle(ctx, args.profileId, args.circleId);
    await ctx.db.delete(membership._id);
    return true;
  }
});

export const deleteCircle = mutation({
  args: {
    profileId: v.id("profiles"),
    circleId: v.id("communityCircles")
  },
  handler: async (ctx, args) => {
    await authorizeSignedInProfile(ctx, args.profileId);
    const authUserId = await getRequiredAuthUserId(ctx);
    const circle = await ctx.db.get(args.circleId);
    if (!circle) return false;
    const membership = await authorizeCircleMember(ctx, args.circleId, args.profileId);
    const isOwner = membership.role === "owner" || circle.ownerProfileId === args.profileId || circle.ownerAuthUserId === authUserId;
    if (!isOwner) throw new Error("Only the circle owner can delete this circle.");

    const posts = await ctx.db
      .query("communityPosts")
      .withIndex("by_circle_created", (q) => q.eq("circleId", args.circleId))
      .take(200);
    for (const post of posts) {
      const reactions = await ctx.db
        .query("communityReactions")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .take(200);
      for (const reaction of reactions) {
        await ctx.db.delete(reaction._id);
      }
      await ctx.db.delete(post._id);
    }

    const members = await ctx.db
      .query("communityMembers")
      .withIndex("by_circle", (q) => q.eq("circleId", args.circleId))
      .take(200);
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    await ctx.db.delete(args.circleId);
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

async function removeProfileReactionsInCircle(ctx: MutationCtx, profileId: Id<"profiles">, circleId: Id<"communityCircles">) {
  const reactions = await ctx.db
    .query("communityReactions")
    .withIndex("by_profile", (q) => q.eq("profileId", profileId))
    .take(200);

  for (const reaction of reactions) {
    const post = await ctx.db.get(reaction.postId);
    if (post?.circleId === circleId) await ctx.db.delete(reaction._id);
  }
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

function buildFriendCode(profileId: Id<"profiles">) {
  return `FR${String(profileId).replace(/[^a-z0-9]/gi, "").slice(-10).toUpperCase()}`;
}

function normalizeFriendCode(value: string) {
  return clampText(value, 24).replace(/[^a-z0-9]/gi, "").toUpperCase();
}

function clampText(value: string | undefined, maxLength: number) {
  return (value || "").trim().slice(0, maxLength);
}

function clampOptionalText(value: string | undefined, maxLength: number) {
  const cleaned = clampText(value, maxLength);
  return cleaned || undefined;
}
