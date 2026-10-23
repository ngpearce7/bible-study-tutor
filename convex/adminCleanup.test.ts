/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, expect, test, vi } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
const modules = import.meta.glob("./**/*.ts");
afterEach(() => { delete process.env.ADMIN_USER_IDS; vi.useRealTimers(); });

test("cleanup removes empty guests and preserves accounts and saved reader content", async () => {
  vi.useFakeTimers();
  const t = convexTest(schema, modules);
  const adminId = await t.run(ctx => ctx.db.insert("users", {}));
  process.env.ADMIN_USER_IDS = adminId;
  const admin = t.withIdentity({ subject: `${adminId}|session` });
  const ids = await t.run(async ctx => {
    const make = (clientKey: string) => ctx.db.insert("profiles", { clientKey, displayName: "Test", createdAt: 1, updatedAt: 1 });
    const empty = await make("empty");
    const bookmark = await make("bookmark");
    await ctx.db.insert("bibleBookmarks", { profileId: bookmark, bookmarkId: "one", book: "John", chapter: 1, reference: "John 1", createdAt: "2026-09-27", updatedAt: 1 });
    const plan = await make("plan");
    await ctx.db.insert("bibleReadingPlanCompletions", { profileId: plan, planId: "john", completedDays: [1], updatedAt: 1 });
    const reader = await make("reader");
    await ctx.db.insert("bibleReaderStates", { profileId: reader, readChapters: { John: [1] }, revision: 1, updatedAt: 1 });
    const legacy = await make("legacy");
    await ctx.db.patch(legacy, { bibleReaderState: { readingPlanProgress: { activePlanId: "john", completedDays: [], customPlans: [] } } });
    const signed = await make("signed");
    await ctx.db.patch(signed, { authUserId: adminId });
    return { empty, bookmark, plan, reader, legacy, signed };
  });
  await expect(admin.mutation(api.insights.cleanupEmptyLocalProfilesAsAdmin, {})).resolves.toMatchObject({ queued: 1, kept: 4, isDone: true });
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  await t.run(async ctx => {
    expect(await ctx.db.get(ids.empty)).toBeNull();
    for (const id of [ids.bookmark, ids.plan, ids.reader, ids.legacy, ids.signed]) expect(await ctx.db.get(id)).not.toBeNull();
    const jobs = await ctx.db.query("cleanupJobs").collect();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].status).toBe("complete");
  });
  await expect(admin.mutation(api.insights.cleanupEmptyLocalProfilesAsAdmin, {})).resolves.toMatchObject({ queued: 0, kept: 4, isDone: true });
});

test("one confirmed cleanup can queue every empty local profile across pages", async () => {
  vi.useFakeTimers();
  const t = convexTest(schema, modules);
  const adminId = await t.run(ctx => ctx.db.insert("users", {}));
  process.env.ADMIN_USER_IDS = adminId;
  const admin = t.withIdentity({ subject: `${adminId}|session` });
  await t.run(async (ctx) => {
    for (let index = 0; index < 45; index += 1) {
      await ctx.db.insert("profiles", { clientKey: `empty-${index}`, displayName: "Empty", createdAt: index, updatedAt: index });
    }
    for (let index = 0; index < 6; index += 1) {
      const profileId = await ctx.db.insert("profiles", { clientKey: `saved-${index}`, displayName: "Saved", createdAt: 100 + index, updatedAt: 100 + index });
      await ctx.db.insert("bibleBookmarks", { profileId, bookmarkId: `bookmark-${index}`, book: "John", chapter: 1, reference: "John 1", createdAt: "2026-10-24", updatedAt: 100 + index });
    }
  });
  let cursor: string | undefined;
  let isDone = false;
  let queued = 0;
  let kept = 0;
  let batches = 0;
  while (!isDone) {
    const result = await admin.mutation(api.insights.cleanupEmptyLocalProfilesAsAdmin, { cursor });
    queued += result.queued;
    kept += result.kept;
    isDone = result.isDone;
    cursor = result.continueCursor;
    batches += 1;
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  }
  expect({ queued, kept, batches }).toEqual({ queued: 45, kept: 6, batches: 3 });
  expect(await t.run(ctx => ctx.db.query("profiles").collect())).toHaveLength(6);
});

test("cleanup scans saved profiles once even when their activity changes between pages", async () => {
  vi.useFakeTimers();
  const t = convexTest(schema, modules);
  const adminId = await t.run(ctx => ctx.db.insert("users", {}));
  process.env.ADMIN_USER_IDS = adminId;
  const admin = t.withIdentity({ subject: `${adminId}|session` });
  const savedIds = await t.run(async (ctx) => {
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const profileId = await ctx.db.insert("profiles", { clientKey: `saved-first-${index}`, displayName: "Saved", createdAt: index, updatedAt: index });
      await ctx.db.insert("bibleBookmarks", { profileId, bookmarkId: `bookmark-${index}`, book: "John", chapter: 1, reference: "John 1", createdAt: "2026-10-24", updatedAt: index });
      ids.push(profileId);
    }
    for (let index = 0; index < 45; index += 1) {
      await ctx.db.insert("profiles", { clientKey: `empty-after-${index}`, displayName: "Empty", createdAt: 100 + index, updatedAt: 100 + index });
    }
    return ids;
  });
  let cursor: string | undefined;
  let isDone = false;
  let queued = 0;
  let kept = 0;
  let batches = 0;
  while (!isDone && batches < 10) {
    const result = await admin.mutation(api.insights.cleanupEmptyLocalProfilesAsAdmin, { cursor });
    queued += result.queued;
    kept += result.kept;
    isDone = result.isDone;
    cursor = result.continueCursor;
    batches += 1;
    await t.run(async (ctx) => {
      for (const id of savedIds) await ctx.db.patch(id, { updatedAt: 1000 + batches });
    });
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  }
  expect({ queued, kept, batches, isDone }).toEqual({ queued: 45, kept: 6, batches: 3, isDone: true });
  expect(await t.run(ctx => ctx.db.query("profiles").collect())).toHaveLength(6);
});

test("cleanup refuses callers without administrator access", async () => {
  const t = convexTest(schema, modules);
  const userId = await t.run(ctx => ctx.db.insert("users", {}));
  await expect(t.mutation(api.insights.cleanupEmptyLocalProfilesAsAdmin, {})).rejects.toThrow("Unauthorized");
  await expect(t.withIdentity({ subject: `${userId}|session` }).mutation(api.insights.cleanupEmptyLocalProfilesAsAdmin, {})).rejects.toThrow("Unauthorized");
  expect(await t.run(ctx => ctx.db.query("cleanupJobs").collect())).toEqual([]);
});
