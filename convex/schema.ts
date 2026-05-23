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

export default defineSchema({
  ...authTables,
  profiles: defineTable({
    authUserId: v.optional(v.id("users")),
    clientKey: v.string(),
    displayName: v.string(),
    weeklyGoal: v.optional(v.string()),
    accountabilityPartner: v.optional(v.string()),
    preferredMethodId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_auth_user_id", ["authUserId"])
    .index("by_client_key", ["clientKey"]),
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
    .index("by_admin_created", ["adminUserId", "createdAt"])
});
