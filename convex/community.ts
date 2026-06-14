import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { assertCollectionLimit, assertProfileCanWrite, enforceRecentLimit } from "./security";
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
    assertProfileCanWrite(profile);
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
    assertProfileCanWrite(profile);
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
    assertProfileCanWrite(profile);
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

  const requestedFriends = await ctx.db
    .query("communityFriends")
    .withIndex("by_requester_created", (q) => q.eq("requesterProfileId", profile._id))
    .order("desc")
    .take(101);
  assertCollectionLimit(requestedFriends.length, 100, "Friend connection");
  await enforceRecentLimit(ctx, profile._id, requestedFriends, "createdAt", { max: 20, windowMs: 24 * 60 * 60 * 1000, label: "Friend invite" });

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
    const profile = await authorizeSignedInProfile(ctx, args.profileId);
    assertProfileCanWrite(profile);
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
    const profile = await authorizeSignedInProfile(ctx, args.profileId);
    assertProfileCanWrite(profile);
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
    friendId: v.optional(v.id("communityFriends")),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await authorizeSignedInProfile(ctx, args.profileId);
    const limit = Math.min(args.limit ?? 12, 30);
    let posts: Doc<"communityPosts">[] = [];

    if (args.circleId) {
      await authorizeCircleMember(ctx, args.circleId, args.profileId);
      posts = await ctx.db
        .query("communityPosts")
        .withIndex("by_circle_created", (q) => q.eq("circleId", args.circleId!))
        .order("desc")
        .take(limit);
    } else if (args.friendId) {
      const friendProfileId = await authorizeAcceptedFriend(ctx, args.profileId, args.friendId);
      const outgoing = (await ctx.db
        .query("communityPosts")
        .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
        .order("desc")
        .take(80)).filter((post) => post.recipientProfileId === friendProfileId);
      const incoming = (await ctx.db
        .query("communityPosts")
        .withIndex("by_recipient_profile_created", (q) => q.eq("recipientProfileId", args.profileId))
        .order("desc")
        .take(80)).filter((post) => post.profileId === friendProfileId);
      posts = [...outgoing, ...incoming].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
    } else {
      return [];
    }

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
    assertProfileCanWrite(profile);
    const authUserId = await getRequiredAuthUserId(ctx);
    const now = Date.now();
    const name = clampText(args.name, 80) || "Bible study circle";
    const existingCircles = await ctx.db
      .query("communityCircles")
      .withIndex("by_owner_profile", (q) => q.eq("ownerProfileId", args.profileId))
      .take(21);
    assertCollectionLimit(existingCircles.length, 20, "Private circle");

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
    assertProfileCanWrite(profile);
    const authUserId = await getRequiredAuthUserId(ctx);
    const memberships = await ctx.db
      .query("communityMembers")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .take(51);
    assertCollectionLimit(memberships.length, 50, "Circle membership");
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
    circleId: v.optional(v.id("communityCircles")),
    friendIds: v.optional(v.array(v.id("communityFriends"))),
    checkinId: v.optional(v.id("checkins")),
    note: v.string(),
    passageReference: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const profile = await authorizeSignedInProfile(ctx, args.profileId);
    assertProfileCanWrite(profile);

    if (args.checkinId) {
      const checkin = await ctx.db.get(args.checkinId);
      if (!checkin || checkin.profileId !== args.profileId) throw new Error("Encouragement not found.");
    }

    return await shareCommunityNote(ctx, {
      profile,
      profileId: args.profileId,
      checkinId: args.checkinId,
      circleId: args.circleId,
      friendIds: args.friendIds,
      note: args.note,
      passageReference: args.passageReference,
      source: "checkin"
    });
  }
});

export const shareInsight = mutation({
  args: {
    profileId: v.id("profiles"),
    circleId: v.optional(v.id("communityCircles")),
    friendIds: v.optional(v.array(v.id("communityFriends"))),
    note: v.string(),
    passageReference: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const profile = await authorizeSignedInProfile(ctx, args.profileId);
    assertProfileCanWrite(profile);
    return await shareCommunityNote(ctx, {
      profile,
      profileId: args.profileId,
      circleId: args.circleId,
      friendIds: args.friendIds,
      note: args.note,
      passageReference: args.passageReference,
      source: "studyInsight"
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
    const profile = await authorizeSignedInProfile(ctx, args.profileId);
    assertProfileCanWrite(profile);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Shared encouragement not found.");
    await authorizePostViewer(ctx, post, args.profileId);

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

    const recentReactions = await ctx.db
      .query("communityReactions")
      .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(120);
    await enforceRecentLimit(ctx, args.profileId, recentReactions, "createdAt", { max: 120, windowMs: 60 * 60 * 1000, label: "Reaction" });

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
    const profile = await authorizeSignedInProfile(ctx, args.profileId);
    assertProfileCanWrite(profile);
    const post = await ctx.db.get(args.postId);
    if (!post) return false;
    await authorizePostViewer(ctx, post, args.profileId);
    if (post.profileId !== args.profileId) throw new Error("Only the person who shared this encouragement can remove it.");

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
    const profile = await authorizeSignedInProfile(ctx, args.profileId);
    assertProfileCanWrite(profile);
    const post = await ctx.db.get(args.postId);
    if (!post) return false;
    await authorizePostViewer(ctx, post, args.profileId);
    if (post.profileId !== args.profileId) throw new Error("Only the person who shared this encouragement can edit it.");

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
    const profile = await authorizeSignedInProfile(ctx, args.profileId);
    assertProfileCanWrite(profile);
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
    const profile = await authorizeSignedInProfile(ctx, args.profileId);
    assertProfileCanWrite(profile);
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

async function authorizeAcceptedFriend(ctx: QueryCtx | MutationCtx, profileId: Id<"profiles">, friendId: Id<"communityFriends">) {
  const friendship = await ctx.db.get(friendId);
  if (!friendship || friendship.status !== "accepted") throw new Error("Accepted friend connection not found.");
  if (friendship.requesterProfileId === profileId) return friendship.recipientProfileId;
  if (friendship.recipientProfileId === profileId) return friendship.requesterProfileId;
  throw new Error("Accepted friend connection not found.");
}

async function authorizePostViewer(ctx: QueryCtx | MutationCtx, post: Doc<"communityPosts">, profileId: Id<"profiles">) {
  if (post.circleId) {
    await authorizeCircleMember(ctx, post.circleId, profileId);
    return true;
  }
  if (post.profileId === profileId || post.recipientProfileId === profileId) {
    return true;
  }
  throw new Error("Shared post not found.");
}

async function shareCommunityNote(
  ctx: MutationCtx,
  args: {
    profile: Doc<"profiles">;
    profileId: Id<"profiles">;
    circleId?: Id<"communityCircles">;
    friendIds?: Id<"communityFriends">[];
    checkinId?: Id<"checkins">;
    note: string;
    passageReference?: string;
    source: "checkin" | "studyInsight";
  }
) {
  const note = clampText(args.note, 1200);
  if (!note) throw new Error("Write something before sharing.");
  const recentPosts = await ctx.db
    .query("communityPosts")
    .withIndex("by_profile_created", (q) => q.eq("profileId", args.profileId))
    .order("desc")
    .take(30);
  await enforceRecentLimit(ctx, args.profileId, recentPosts, "createdAt", { max: 10, windowMs: 10 * 60 * 1000, label: "Shared encouragement" });
  await enforceRecentLimit(ctx, args.profileId, recentPosts, "createdAt", { max: 30, windowMs: 24 * 60 * 60 * 1000, label: "Shared encouragement" });

  const friendIds = Array.from(new Set((args.friendIds || []).map((friendId) => String(friendId)))).slice(0, 10) as Id<"communityFriends">[];
  const destinations: { circleId?: Id<"communityCircles">; recipientProfileId?: Id<"profiles"> }[] = [];

  if (args.circleId) {
    await authorizeCircleMember(ctx, args.circleId, args.profileId);
    destinations.push({ circleId: args.circleId });
  }

  for (const friendId of friendIds) {
    const recipientProfileId = await authorizeAcceptedFriend(ctx, args.profileId, friendId);
    destinations.push({ recipientProfileId });
  }

  if (destinations.length === 0) throw new Error("Choose a friend or circle before sharing.");

  const createdAt = Date.now();
  const postIds = [];
  for (const destination of destinations) {
    postIds.push(await ctx.db.insert("communityPosts", {
      ...destination,
      checkinId: args.checkinId,
      source: args.source,
      profileId: args.profileId,
      authorName: clampText(args.profile.displayName, 80) || "Bible student",
      note,
      passageReference: clampOptionalText(args.passageReference, 120),
      createdAt
    }));
  }

  return { count: postIds.length, postIds };
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
