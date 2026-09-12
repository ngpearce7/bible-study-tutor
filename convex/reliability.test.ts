/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, vi, afterEach } from "vitest";
import schema from "./schema";
import { api, internal } from "./_generated/api";
import { createHash } from "node:crypto";
import { passwordCrypto } from "./passwordCrypto";
import { enforceRecentLimit } from "./security";
afterEach(() => vi.useRealTimers());
const modules = import.meta.glob("./**/*.ts");

test("stale reader snapshot cannot delete a newer bookmark or completion", async () => {
  const t = convexTest(schema, modules);
  const clientKey = "reader-device-secret";
  const profileId = await t.mutation(api.study.ensureProfile, { clientKey });
  const bookmark = { id: "john", book: "John", chapter: 1, reference: "John 1", createdAt: "2026-09-12" };
  await t.mutation(api.accountability.saveBibleReaderState, { profileId, clientKey, baseRevision: 0, state: { bookmarks: [bookmark], readingPlanProgress: { activePlanId: "john", completedDays: ["john:1"], customPlans: [] } } });
  await expect(t.mutation(api.accountability.saveBibleReaderState, { profileId, clientKey, baseRevision: 0, state: { bookmarks: [], readingPlanProgress: { activePlanId: "john", completedDays: [], customPlans: [] } } })).rejects.toThrow("READER_CONFLICT");
  const saved = await t.query(api.accountability.bibleReaderState, { profileId, clientKey });
  expect(saved?.bookmarks).toEqual([bookmark]);
  expect(saved?.readingPlanProgress?.completedDays).toEqual(["john:1"]);
  await t.mutation(api.accountability.saveBibleReaderState, { profileId, clientKey, baseRevision: 1, state: { bookmarks: [] } });
  expect((await t.query(api.accountability.bibleReaderState, { profileId, clientKey }))?.bookmarks).toEqual([]);
});

test("statistics change when supplied day advances without another write", async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-12T12:00:00Z"));
  const t = convexTest(schema, modules);
  const clientKey = "statistics-device";
  const profileId = await t.mutation(api.study.ensureProfile, { clientKey });
  await t.mutation(api.statistics.ensureStats, { profileId, clientKey });
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  await t.mutation(api.study.saveSession, { profileId, clientKey, passage: "John 1", methodId: "soap", methodName: "SOAP", minutes: 5, localDayKey: "2026-09-12", answers: [{ stepTitle: "Observe", answer: "The Word" }] });
  const today = await t.query(api.study.stats, { profileId, clientKey, now: Date.parse("2026-09-12T12:00:00Z") });
  const later = await t.query(api.study.stats, { profileId, clientKey, now: Date.parse("2026-09-22T12:00:00Z") });
  expect(today.currentStreak).toBe(1);
  expect(later.currentStreak).toBe(0);
  expect(later.weeklyRhythm.studiesCompleted).toBe(0);
});

test("recovery code consumption, password update and session revocation are atomic", async () => {
  const t = convexTest(schema, modules);
  const { userId, accountId, profileId } = await t.run(async ctx => {
    const userId = await ctx.db.insert("users", {});
    const profileId = await ctx.db.insert("profiles", { authUserId: userId, clientKey: "auth:user", displayName: "Reader", recoveryDigest: "digest", createdAt: 0, updatedAt: 0 });
    const accountId = await ctx.db.insert("authAccounts", { userId, provider: "password", providerAccountId: "reader@username.biblestudytutor.local", secret: "old" });
    await ctx.db.insert("authSessions", { userId, expirationTime: Date.now() + 10000 });
    return { userId, accountId, profileId };
  });
  await t.mutation(internal.recoveryData.redeemCode, { digest: "digest", secret: "new-provider-hash" });
  await expect(t.mutation(internal.recoveryData.redeemCode, { digest: "digest", secret: "attacker" })).rejects.toThrow("Invalid recovery code");
  await t.run(async ctx => {
    expect((await ctx.db.get(accountId))?.secret).toBe("new-provider-hash");
    expect((await ctx.db.get(profileId))?.recoveryDigest).toBeUndefined();
    expect(await ctx.db.query("authSessions").withIndex("userId", q => q.eq("userId", userId)).collect()).toEqual([]);
  });
});

test.each(["null", "[]", "true", "1"])("malformed telemetry %s returns 400", async (body) => {
  const t = convexTest(schema, modules);
  const response = await t.fetch("/reliability", { method: "POST", body });
  expect(response.status).toBe(400);
});

test("recovery action creates a hash accepted by the installed password provider", async () => {
  const t = convexTest(schema, modules);
  const code = "a".repeat(64);
  const accountId = await t.run(async ctx => {
    const userId = await ctx.db.insert("users", {});
    await ctx.db.insert("profiles", { authUserId: userId, clientKey: "auth:user", displayName: "Reader", recoveryDigest: createHash("sha256").update(code).digest("hex"), createdAt: 0, updatedAt: 0 });
    return await ctx.db.insert("authAccounts", { userId, provider: "password", providerAccountId: "reader@username.biblestudytutor.local", secret: "old" });
  });
  await t.action(api.recovery.resetWithCode, { code, password: "new-long-password" });
  const account = await t.run(ctx => ctx.db.get(accountId));
  expect(await passwordCrypto.verifySecret("new-long-password", account!.secret!)).toBe(true);
  await expect(t.action(api.recovery.resetWithCode, { code, password: "another-password" })).rejects.toThrow("Invalid recovery");
});

test("rate rejection logs a content-free signal instead of a rolled-back audit row", async () => {
  const t = convexTest(schema, modules);
  const profileId = await t.mutation(api.study.ensureProfile, { clientKey: "logging-secret" });
  const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  try {
    await expect(t.run(ctx => enforceRecentLimit(ctx, profileId, [{ createdAt: 100 }], "createdAt", { now: 100, max: 1, windowMs: 1000, label: "Study" }))).rejects.toThrow("limit reached");
    expect(warning).toHaveBeenCalledOnce();
    expect(warning.mock.calls[0][0]).not.toContain(profileId);
    expect(await t.run(ctx => ctx.db.query("securityEvents").take(1))).toEqual([]);
  } finally { warning.mockRestore(); }
});
