import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

const passageMarkup = v.object({
  key: v.string(),
  kind: v.union(v.literal("notice"), v.literal("question"), v.literal("truth"), v.literal("apply")),
  label: v.string(),
  note: v.optional(v.string()),
  reference: v.string(),
  verse: v.number()
});
const reviewPreset = v.union(v.literal("tomorrow"), v.literal("three-days"), v.literal("next-week"), v.literal("next-month"));

export const ensureProfile = mutation({
  args: {
    clientKey: v.optional(v.string()),
    displayName: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    const now = Date.now();

    const authUser = authUserId ? await ctx.db.get(authUserId) : null;
    const authProfileName = authUser?.name?.trim() || authUser?.email?.trim() || "";
    const profileName = args.displayName?.trim() || authProfileName || "Bible student";

    if (authUserId) {
      const authenticatedProfile = await ctx.db
        .query("profiles")
        .withIndex("by_auth_user_id", (q) => q.eq("authUserId", authUserId))
        .first();

      if (authenticatedProfile) {
        if (profileName && profileName !== "Bible student" && authenticatedProfile.displayName === "Bible student") {
          await ctx.db.patch(authenticatedProfile._id, {
            displayName: profileName,
            updatedAt: now
          });
        }

        return authenticatedProfile._id;
      }
    }

    const clientKey = args.clientKey;
    const existingDeviceProfile = clientKey
      ? await ctx.db
          .query("profiles")
          .withIndex("by_client_key", (q) => q.eq("clientKey", clientKey))
          .first()
      : null;

    if (existingDeviceProfile) {
      if (authUserId) {
        if (!existingDeviceProfile.authUserId) {
          const profilePatch: { authUserId: Id<"users">; updatedAt: number; displayName?: string } = {
            authUserId,
            updatedAt: now
          };
          if (authProfileName && existingDeviceProfile.displayName === "Bible student") {
            profilePatch.displayName = authProfileName;
          }
          await ctx.db.patch(existingDeviceProfile._id, profilePatch);
          await maybeNotifyFirstNonAdminRegistration(ctx, {
            profileId: existingDeviceProfile._id,
            email: authUser?.email,
            name: profilePatch.displayName || existingDeviceProfile.displayName,
            now
          });
          return existingDeviceProfile._id;
        }

        if (existingDeviceProfile.authUserId === authUserId) return existingDeviceProfile._id;
      } else {
        return existingDeviceProfile._id;
      }
    }

    const profileId = await ctx.db.insert("profiles", {
      authUserId: authUserId || undefined,
      clientKey: authUserId ? `auth:${authUserId}` : clientKey || `guest:${now}`,
      displayName: profileName,
      createdAt: now,
      updatedAt: now
    });
    await maybeNotifyFirstNonAdminRegistration(ctx, {
      profileId,
      email: authUser?.email,
      name: profileName,
      now
    });
    return profileId;
  }
});

export const saveSession = mutation({
  args: {
    profileId: v.id("profiles"),
    passage: v.string(),
    methodId: v.string(),
    methodName: v.string(),
    shareNote: v.optional(v.string()),
    passageMarkups: v.optional(v.array(passageMarkup)),
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
    )
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    const sessionId = await ctx.db.insert("sessions", {
      ...args,
      completedAt: Date.now()
    });

    const draft = await ctx.db
      .query("drafts")
      .withIndex("by_profile_passage_method", (q) =>
        q.eq("profileId", args.profileId).eq("passage", args.passage).eq("methodId", args.methodId)
      )
      .first();

    if (draft) await ctx.db.delete(draft._id);

    return sessionId;
  }
});

export const getDeeperFeedback = action({
  args: {
    passageReference: v.string(),
    passageText: v.optional(v.string()),
    methodName: v.string(),
    stepTitle: v.string(),
    stepPrompt: v.string(),
    answer: v.string(),
    localFeedback: v.array(v.string())
  },
  handler: async (_ctx, args) => {
    const fallback = {
      encouragement: args.localFeedback[0] || "You are engaging the passage thoughtfully.",
      textGrounding: "Look for one word, action, image, or claim in the passage that supports your answer.",
      nextRevision: args.localFeedback[1] || "Revise this by adding one concrete detail from the selected passage.",
      source: "local" as const
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return fallback;

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.OPENAI_TUTOR_MODEL || "gpt-5.4-mini",
          reasoning: { effort: "low" },
          input: [
            {
              role: "system",
              content:
                "You are a gentle Bible study tutor. Give concise, non-guilt-based coaching. Keep feedback tied to the selected passage and method. Do not invent historical background. Do not write the student's answer for them."
            },
            {
              role: "user",
              content: JSON.stringify({
                passageReference: args.passageReference,
                passageText: args.passageText?.slice(0, 3000),
                methodName: args.methodName,
                stepTitle: args.stepTitle,
                stepPrompt: args.stepPrompt,
                studentAnswer: args.answer,
                localFeedback: args.localFeedback
              })
            }
          ],
          text: {
            format: {
              type: "json_schema",
              name: "bible_tutor_feedback",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                required: ["encouragement", "textGrounding", "nextRevision"],
                properties: {
                  encouragement: {
                    type: "string",
                    description: "One warm sentence naming what is working in the student's answer."
                  },
                  textGrounding: {
                    type: "string",
                    description: "One concise suggestion for tying the answer more closely to the passage."
                  },
                  nextRevision: {
                    type: "string",
                    description: "One concrete revision prompt the student can act on."
                  }
                }
              }
            }
          },
          max_output_tokens: 500
        })
      });

      if (!response.ok) return fallback;

      const data = await response.json();
      const outputText = extractOutputText(data);
      if (!outputText) return fallback;

      const parsed = JSON.parse(outputText);
      return {
        encouragement: String(parsed.encouragement || fallback.encouragement),
        textGrounding: String(parsed.textGrounding || fallback.textGrounding),
        nextRevision: String(parsed.nextRevision || fallback.nextRevision),
        source: "openai" as const
      };
    } catch {
      return fallback;
    }
  }
});

function extractOutputText(data: any) {
  if (typeof data.output_text === "string") return data.output_text;

  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }

  return "";
}

export const saveDraft = mutation({
  args: {
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
    )
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    const existing = await ctx.db
      .query("drafts")
      .withIndex("by_profile_passage_method", (q) =>
        q.eq("profileId", args.profileId).eq("passage", args.passage).eq("methodId", args.methodId)
      )
      .first();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        passageReference: args.passageReference,
        passageText: args.passageText,
        translationName: args.translationName,
        passageMarkups: args.passageMarkups,
        methodName: args.methodName,
        stepIndex: args.stepIndex,
        answers: args.answers,
        updatedAt: now
      });
      return existing._id;
    }

    return await ctx.db.insert("drafts", {
      ...args,
      createdAt: now,
      updatedAt: now
    });
  }
});

export const draftForPassage = query({
  args: {
    profileId: v.id("profiles"),
    passage: v.string(),
    methodId: v.string()
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    return await ctx.db
      .query("drafts")
      .withIndex("by_profile_passage_method", (q) =>
        q.eq("profileId", args.profileId).eq("passage", args.passage).eq("methodId", args.methodId)
      )
      .first();
  }
});

export const recentDrafts = query({
  args: {
    profileId: v.id("profiles"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    return await ctx.db
      .query("drafts")
      .withIndex("by_profile_updated", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(args.limit ?? 12);
  }
});

export const deleteDraft = mutation({
  args: {
    profileId: v.id("profiles"),
    draftId: v.id("drafts")
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.profileId !== args.profileId) return false;

    await ctx.db.delete(args.draftId);
    return true;
  }
});

export const deleteSession = mutation({
  args: {
    profileId: v.id("profiles"),
    sessionId: v.id("sessions")
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.profileId !== args.profileId) return false;

    await ctx.db.delete(args.sessionId);
    return true;
  }
});

export const scheduleStudyReview = mutation({
  args: {
    profileId: v.id("profiles"),
    sessionId: v.id("sessions"),
    preset: v.optional(reviewPreset),
    customDays: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.profileId !== args.profileId) throw new Error("Study not found");

    const reviewAt = args.customDays ? customReviewTimestamp(args.customDays) : reviewTimestamp(args.preset || "next-week");
    await ctx.db.patch(args.sessionId, {
      reviewStatus: "scheduled",
      reviewAt,
      reviewedAt: undefined,
      reviewNote: undefined
    });
    return reviewAt;
  }
});

export const completeStudyReview = mutation({
  args: {
    profileId: v.id("profiles"),
    sessionId: v.id("sessions"),
    reviewNote: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.profileId !== args.profileId) throw new Error("Study not found");

    await ctx.db.patch(args.sessionId, {
      reviewStatus: "reviewed",
      reviewedAt: Date.now(),
      reviewNote: args.reviewNote?.trim() || undefined
    });
    return true;
  }
});

export const recentSessions = query({
  args: {
    profileId: v.id("profiles"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    return await ctx.db
      .query("sessions")
      .withIndex("by_profile_completed", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(args.limit ?? 20);
  }
});

export const dueStudyReviews = query({
  args: {
    profileId: v.id("profiles"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    return await ctx.db
      .query("sessions")
      .withIndex("by_profile_review_status_and_review_at", (q) =>
        q.eq("profileId", args.profileId).eq("reviewStatus", "scheduled").lte("reviewAt", Date.now())
      )
      .order("asc")
      .take(args.limit ?? 10);
  }
});

export const stats = query({
  args: {
    profileId: v.id("profiles")
  },
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId);

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_profile_completed", (q) => q.eq("profileId", args.profileId))
      .collect();

    const dates = Array.from(new Set(sessions.map((session) => dayKey(session.completedAt)))).sort();

    return {
      sessionCount: sessions.length,
      minutes: sessions.reduce((total, session) => total + session.minutes, 0),
      currentStreak: currentStreak(dates),
      bestStreak: bestStreak(dates)
    };
  }
});

async function authorizeProfileAccess(ctx: QueryCtx | MutationCtx, profileId: Id<"profiles">) {
  const profile = await ctx.db.get(profileId);
  if (!profile) throw new Error("Profile not found");

  const authUserId = await getAuthUserId(ctx);
  if (authUserId && profile.authUserId !== authUserId) throw new Error("Unauthorized");

  return profile;
}

async function maybeNotifyFirstNonAdminRegistration(
  ctx: MutationCtx,
  args: { profileId: Id<"profiles">; email?: string; name?: string; now: number }
) {
  if (!args.email || isAdminEmail(args.email)) return;

  const notificationKey = "first-non-admin-registration";
  const existingNotification = await ctx.db
    .query("adminNotificationState")
    .withIndex("by_key", (q) => q.eq("key", notificationKey))
    .first();
  if (existingNotification) return;

  const profiles = await ctx.db.query("profiles").collect();
  let nonAdminSignedInCount = 0;

  for (const profile of profiles) {
    if (!profile.authUserId) continue;
    const user = await ctx.db.get(profile.authUserId);
    if (user?.email && !isAdminEmail(user.email)) nonAdminSignedInCount += 1;
  }

  if (nonAdminSignedInCount !== 1) return;

  await ctx.db.insert("adminNotificationState", {
    key: notificationKey,
    profileId: args.profileId,
    email: args.email,
    name: args.name,
    triggeredAt: args.now
  });

  await ctx.scheduler.runAfter(0, internal.adminNotifications.sendFirstUserRegisteredEmail, {
    email: args.email,
    name: args.name,
    profileId: args.profileId,
    registeredAt: args.now
  });
}

function isAdminEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
}

function dayKey(value: number) {
  return new Date(value).toISOString().slice(0, 10);
}

function reviewTimestamp(preset: "tomorrow" | "three-days" | "next-week" | "next-month") {
  const days =
    preset === "tomorrow"
      ? 1
      : preset === "three-days"
        ? 3
        : preset === "next-week"
          ? 7
          : 30;
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

function customReviewTimestamp(daysFromNow: number) {
  const days = Math.floor(daysFromNow);
  if (!Number.isFinite(days) || days < 1 || days > 365) throw new Error("Choose 1 to 365 days");
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

function currentStreak(dates: string[]) {
  let count = 0;
  const cursor = new Date(dayKey(Date.now()));

  while (dates.includes(dayKey(cursor.getTime()))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return count;
}

function bestStreak(dates: string[]) {
  if (dates.length === 0) return 0;
  let best = 1;
  let active = 1;

  for (let index = 1; index < dates.length; index += 1) {
    const previous = new Date(dates[index - 1]);
    previous.setDate(previous.getDate() + 1);

    if (dayKey(previous.getTime()) === dates[index]) {
      active += 1;
      best = Math.max(best, active);
    } else {
      active = 1;
    }
  }

  return best;
}
