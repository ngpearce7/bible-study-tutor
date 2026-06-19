import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const passageMarkup = v.object({
  key: v.string(),
  kind: v.union(v.literal("notice"), v.literal("question"), v.literal("truth"), v.literal("apply")),
  label: v.string(),
  note: v.optional(v.string()),
  reference: v.string(),
  verse: v.number()
});

const scriptureInsertSettings = v.object({
  disabled: v.boolean(),
  bold: v.boolean(),
  italic: v.boolean(),
  color: v.string(),
  highlightColor: v.optional(v.string()),
  referencePosition: v.union(v.literal("front"), v.literal("end"))
});

const uiPreferences = v.record(v.string(), v.boolean());

export default defineSchema({
  ...authTables,
  profiles: defineTable({
    authUserId: v.optional(v.id("users")),
    clientKey: v.string(),
    displayName: v.string(),
    username: v.optional(v.string()),
    normalizedUsername: v.optional(v.string()),
    accountLoginKind: v.optional(v.union(v.literal("email"), v.literal("username"), v.literal("oauth"))),
    friendCode: v.optional(v.string()),
    weeklyGoal: v.optional(v.string()),
    accountabilityPartner: v.optional(v.string()),
    preferredMethodId: v.optional(v.string()),
    appearanceMode: v.optional(v.union(v.literal("light"), v.literal("dark"))),
    scriptureInsertSettings: v.optional(scriptureInsertSettings),
    uiPreferences: v.optional(uiPreferences),
    memoryMilestoneGoalIds: v.optional(v.array(v.string())),
    suspendedAt: v.optional(v.number()),
    suspendedBy: v.optional(v.id("users")),
    suspensionReason: v.optional(v.string()),
    securityReviewedAt: v.optional(v.number()),
    securityReviewedBy: v.optional(v.id("users")),
    securityReviewNote: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_auth_user_id", ["authUserId"])
    .index("by_client_key", ["clientKey"])
    .index("by_normalized_username", ["normalizedUsername"])
    .index("by_friend_code", ["friendCode"]),
  sessions: defineTable({
    profileId: v.id("profiles"),
    passage: v.string(),
    methodId: v.string(),
    methodName: v.string(),
    shareNote: v.optional(v.string()),
    passageMarkups: v.optional(v.array(passageMarkup)),
    reviewStatus: v.optional(v.union(v.literal("scheduled"), v.literal("reviewed"))),
    reviewAt: v.optional(v.number()),
    reviewedAt: v.optional(v.number()),
    reviewNote: v.optional(v.string()),
    minutes: v.number(),
    coachingMoments: v.optional(
      v.array(
        v.object({
          stepTitle: v.string(),
          encouragement: v.string(),
          textGrounding: v.string(),
          nextRevision: v.string()
        })
      )
    ),
    answers: v.array(
      v.object({
        stepTitle: v.string(),
        answer: v.string()
      })
    ),
    completedAt: v.number()
  })
    .index("by_profile", ["profileId"])
    .index("by_profile_completed", ["profileId", "completedAt"])
    .index("by_profile_review_status_and_review_at", ["profileId", "reviewStatus", "reviewAt"]),
  drafts: defineTable({
    profileId: v.id("profiles"),
    passage: v.string(),
    passageReference: v.optional(v.string()),
    passageText: v.optional(v.string()),
    translationName: v.optional(v.string()),
    passageMarkups: v.optional(v.array(passageMarkup)),
    methodId: v.string(),
    methodName: v.string(),
    stepIndex: v.number(),
    answers: v.array(
      v.object({
        stepTitle: v.string(),
        answer: v.string()
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_profile", ["profileId"])
    .index("by_profile_updated", ["profileId", "updatedAt"])
    .index("by_profile_passage_method", ["profileId", "passage", "methodId"]),
  checkins: defineTable({
    profileId: v.id("profiles"),
    mood: v.string(),
    note: v.string(),
    sentAt: v.optional(v.number()),
    createdAt: v.number()
  })
    .index("by_profile", ["profileId"])
    .index("by_profile_created", ["profileId", "createdAt"]),
  communityCircles: defineTable({
    name: v.string(),
    inviteCode: v.string(),
    ownerProfileId: v.id("profiles"),
    ownerAuthUserId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_invite_code", ["inviteCode"])
    .index("by_owner_profile", ["ownerProfileId"]),
  communityMembers: defineTable({
    circleId: v.id("communityCircles"),
    profileId: v.id("profiles"),
    authUserId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("member")),
    joinedAt: v.number()
  })
    .index("by_profile", ["profileId"])
    .index("by_circle", ["circleId"])
    .index("by_circle_and_profile", ["circleId", "profileId"]),
  communityFriends: defineTable({
    requesterProfileId: v.id("profiles"),
    recipientProfileId: v.id("profiles"),
    requesterAuthUserId: v.id("users"),
    recipientAuthUserId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted")),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_requester", ["requesterProfileId"])
    .index("by_recipient", ["recipientProfileId"])
    .index("by_requester_and_recipient", ["requesterProfileId", "recipientProfileId"])
    .index("by_requester_created", ["requesterProfileId", "createdAt"])
    .index("by_requester_and_status", ["requesterProfileId", "status"])
    .index("by_recipient_and_status", ["recipientProfileId", "status"]),
  communityPosts: defineTable({
    circleId: v.optional(v.id("communityCircles")),
    recipientProfileId: v.optional(v.id("profiles")),
    checkinId: v.optional(v.id("checkins")),
    source: v.optional(v.union(v.literal("checkin"), v.literal("studyInsight"))),
    profileId: v.id("profiles"),
    authorName: v.string(),
    note: v.string(),
    passageReference: v.optional(v.string()),
    createdAt: v.number()
  })
    .index("by_circle_created", ["circleId", "createdAt"])
    .index("by_recipient_profile_created", ["recipientProfileId", "createdAt"])
    .index("by_profile_created", ["profileId", "createdAt"]),
  communityReactions: defineTable({
    postId: v.id("communityPosts"),
    profileId: v.id("profiles"),
    reaction: v.union(v.literal("amen"), v.literal("praying"), v.literal("encouraged")),
    createdAt: v.number()
  })
    .index("by_post", ["postId"])
    .index("by_profile", ["profileId"])
    .index("by_profile_created", ["profileId", "createdAt"])
    .index("by_post_and_profile_and_reaction", ["postId", "profileId", "reaction"]),
  memoryVerses: defineTable({
    profileId: v.id("profiles"),
    reference: v.string(),
    verseText: v.string(),
    translationName: v.string(),
    note: v.optional(v.string()),
    status: v.union(v.literal("new"), v.literal("learning"), v.literal("review"), v.literal("memorized")),
    practiceLevel: v.number(),
    reviewCount: v.number(),
    lastReviewedAt: v.optional(v.number()),
    nextReviewAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_profile", ["profileId"])
    .index("by_profile_updated", ["profileId", "updatedAt"])
    .index("by_profile_reference", ["profileId", "reference"]),
  memoryHistory: defineTable({
    profileId: v.id("profiles"),
    memoryVerseId: v.optional(v.id("memoryVerses")),
    reference: v.string(),
    event: v.union(
      v.literal("added"),
      v.literal("updated"),
      v.literal("reviewed"),
      v.literal("repeated"),
      v.literal("scheduled"),
      v.literal("meditated"),
      v.literal("removed")
    ),
    practiceLevel: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    nextReviewAt: v.optional(v.number()),
    createdAt: v.number()
  })
    .index("by_profile_created", ["profileId", "createdAt"])
    .index("by_profile_memoryVerse_created", ["profileId", "memoryVerseId", "createdAt"]),
  feedback: defineTable({
    profileId: v.id("profiles"),
    category: v.union(v.literal("bug"), v.literal("confusing"), v.literal("suggestion"), v.literal("encouragement"), v.literal("other")),
    message: v.string(),
    tab: v.optional(v.string()),
    device: v.optional(v.string()),
    status: v.union(v.literal("new"), v.literal("reviewed"), v.literal("actioned"), v.literal("ignored")),
    createdAt: v.number()
  })
    .index("by_profile_created", ["profileId", "createdAt"])
    .index("by_status_created", ["status", "createdAt"])
    .index("by_created", ["createdAt"]),
  usageEvents: defineTable({
    profileId: v.id("profiles"),
    eventType: v.string(),
    reference: v.optional(v.string()),
    methodId: v.optional(v.string()),
    methodName: v.optional(v.string()),
    translation: v.optional(v.string()),
    tab: v.optional(v.string()),
    book: v.optional(v.string()),
    chapter: v.optional(v.number()),
    createdAt: v.number()
  })
    .index("by_profile_created", ["profileId", "createdAt"])
    .index("by_event_type_created", ["eventType", "createdAt"])
    .index("by_created", ["createdAt"]),
  adminNotificationState: defineTable({
    key: v.string(),
    profileId: v.optional(v.id("profiles")),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    triggeredAt: v.number()
  }).index("by_key", ["key"]),
  accountDeletionRequests: defineTable({
    profileId: v.id("profiles"),
    authUserId: v.optional(v.id("users")),
    displayName: v.string(),
    email: v.optional(v.string()),
    note: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("cancelled"), v.literal("approved")),
    requestedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
    completedAt: v.optional(v.number())
  })
    .index("by_profile_status", ["profileId", "status"])
    .index("by_status_requested", ["status", "requestedAt"]),
  adminAuditLog: defineTable({
    adminUserId: v.id("users"),
    action: v.string(),
    targetProfileId: v.optional(v.id("profiles")),
    targetUserId: v.optional(v.id("users")),
    targetEmail: v.optional(v.string()),
    details: v.optional(v.string()),
    createdAt: v.number()
  })
    .index("by_created", ["createdAt"])
    .index("by_admin_created", ["adminUserId", "createdAt"]),
  securityEvents: defineTable({
    profileId: v.id("profiles"),
    eventType: v.string(),
    details: v.optional(v.string()),
    createdAt: v.number()
  })
    .index("by_profile_created", ["profileId", "createdAt"])
    .index("by_event_type_created", ["eventType", "createdAt"])
    .index("by_created", ["createdAt"])
});
