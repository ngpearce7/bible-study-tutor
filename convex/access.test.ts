/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test, afterEach } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
const modules = import.meta.glob("./**/*.ts");
afterEach(() => { delete process.env.ADMIN_USER_IDS; delete process.env.ADMIN_EMAILS; });

describe("profile boundaries", () => {
  test("guest reads and writes require the device credential", async () => {
    const t = convexTest(schema, modules);
    const profileId = await t.mutation(api.study.ensureProfile, { clientKey: "secret-device-one" });
    await expect(t.query(api.study.recentSessions, { profileId })).rejects.toThrow("Unauthorized");
    await expect(t.query(api.study.recentSessions, { profileId, clientKey: "other" })).rejects.toThrow("Unauthorized");
    await expect(t.query(api.study.recentSessions, { profileId, clientKey: "secret-device-one" })).resolves.toEqual([]);
    await expect(t.mutation(api.accountability.savePlan, { profileId, weeklyGoal: "Read", accountabilityPartner: "", preferredMethodId: "soap" })).rejects.toThrow("Unauthorized");
  });
  test("registration adopts guest content, and signed-out device cannot read it", async () => {
    const t = convexTest(schema, modules);
    const clientKey = "guest-conversion-secret";
    const profileId = await t.mutation(api.study.ensureProfile, { clientKey });
    await t.mutation(api.study.saveSession, { profileId, clientKey, passage: "John 1", methodId: "soap", methodName: "SOAP", minutes: 5, answers: [{ stepTitle: "Observe", answer: "The Word was with God." }] });
    const userId = await t.run(ctx => ctx.db.insert("users", { name: "Reader" }));
    const signed = t.withIdentity({ subject: `${userId}|session` });
    expect(await signed.mutation(api.study.ensureProfile, { clientKey })).toEqual(profileId);
    expect(await signed.query(api.study.recentSessions, { profileId })).toHaveLength(1);
    await expect(t.query(api.study.recentSessions, { profileId, clientKey })).rejects.toThrow("Unauthorized");
    const otherId = await t.run(ctx => ctx.db.insert("users", {}));
    await expect(t.withIdentity({ subject: `${otherId}|session` }).query(api.study.recentSessions, { profileId, clientKey })).rejects.toThrow("Unauthorized");
  });
  test("unverified allowlisted email never grants administrator access", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(ctx => ctx.db.insert("users", { email: "admin@example.org" }));
    process.env.ADMIN_EMAILS = "admin@example.org";
    const caller = t.withIdentity({ subject: `${userId}|session` });
    expect(await caller.query(api.insights.adminOverview, {})).toBeNull();
    process.env.ADMIN_USER_IDS = userId;
    expect(await caller.query(api.insights.adminOverview, {})).not.toBeNull();
  });
});

test("admin search and feedback queue cover records outside the loaded directory", async () => {
  const t = convexTest(schema, modules);
  const { adminId, targetProfileId, feedbackId } = await t.run(async (ctx) => {
    const adminId = await ctx.db.insert("users", { email: "admin@example.org" });
    const targetUserId = await ctx.db.insert("users", { email: "reader@example.org" });
    const targetProfileId = await ctx.db.insert("profiles", {
      authUserId: targetUserId, clientKey: "auth:reader", displayName: "Beth Reader", createdAt: 1, updatedAt: 1
    });
    const feedbackId = await ctx.db.insert("feedback", {
      profileId: targetProfileId, category: "bug", message: "Reader page issue", status: "new", createdAt: 1
    });
    return { adminId, targetProfileId, feedbackId };
  });
  process.env.ADMIN_USER_IDS = adminId;
  const admin = t.withIdentity({ subject: `${adminId}|session` });
  expect((await admin.query(api.insights.adminSearchUsers, { term: "Beth" })).map((row) => row.profileId)).toContain(targetProfileId);
  expect((await admin.query(api.insights.adminSearchUsers, { term: "reader@example.org" })).map((row) => row.profileId)).toContain(targetProfileId);
  const page = await admin.query(api.insights.adminFeedbackPage, { status: "new", paginationOpts: { numItems: 10, cursor: null } });
  expect(page.page.map((row: any) => row._id)).toContain(feedbackId);
  expect(await t.query(api.insights.adminSearchUsers, { term: "Beth" })).toEqual([]);
  expect((await t.query(api.insights.adminFeedbackPage, { paginationOpts: { numItems: 10, cursor: null } })).page).toEqual([]);
});

test("public funnel rates count only visitors who reached both stages", async () => {
  const t = convexTest(schema, modules);
  const adminId = await t.run(async (ctx) => {
    const adminId = await ctx.db.insert("users", {});
    const now = Date.parse("2026-10-24T00:00:00Z");
    for (const [funnelId, eventType] of [["visitor-a", "public_page_view"], ["visitor-a", "seo_cta_clicked"], ["visitor-b", "public_page_view"], ["visitor-c", "study_completed"]] as const) {
      await ctx.db.insert("publicAnalyticsEvents", { funnelId, eventType, createdAt: now });
    }
    return adminId;
  });
  process.env.ADMIN_USER_IDS = adminId;
  const overview = await t.withIdentity({ subject: `${adminId}|session` }).query(api.insights.adminOverview, { now: Date.parse("2026-10-24T00:00:00Z") });
  expect(overview?.publicFunnel).toMatchObject({ views: 2, ctaActions: 1, studies: 1, viewToCtaPercent: 50, ctaToStudyPercent: 0 });
});
