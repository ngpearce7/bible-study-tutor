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
  await expect(admin.mutation(api.insights.cleanupEmptyLocalProfilesAsAdmin, {})).resolves.toEqual({ queued: 1, kept: 4 });
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  await t.run(async ctx => {
    expect(await ctx.db.get(ids.empty)).toBeNull();
    for (const id of [ids.bookmark, ids.plan, ids.reader, ids.legacy, ids.signed]) expect(await ctx.db.get(id)).not.toBeNull();
    const jobs = await ctx.db.query("cleanupJobs").collect();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].status).toBe("complete");
  });
  await expect(admin.mutation(api.insights.cleanupEmptyLocalProfilesAsAdmin, {})).resolves.toEqual({ queued: 0, kept: 4 });
});

test("cleanup refuses callers without administrator access", async () => {
  const t = convexTest(schema, modules);
  const userId = await t.run(ctx => ctx.db.insert("users", {}));
  await expect(t.mutation(api.insights.cleanupEmptyLocalProfilesAsAdmin, {})).rejects.toThrow("Unauthorized");
  await expect(t.withIdentity({ subject: `${userId}|session` }).mutation(api.insights.cleanupEmptyLocalProfilesAsAdmin, {})).rejects.toThrow("Unauthorized");
  expect(await t.run(ctx => ctx.db.query("cleanupJobs").collect())).toEqual([]);
});
