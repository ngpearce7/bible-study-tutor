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

test("a rhythm longer than the daily query window keeps its full count", async () => {
  const t = convexTest(schema, modules);
  const clientKey = "long-rhythm-device";
  const profileId = await t.mutation(api.study.ensureProfile, { clientKey });
  const today = Date.parse("2026-09-23T12:00:00Z");
  await t.run(async (ctx) => {
    await ctx.db.insert("studyStats", {
      profileId, sessionCount: 401, minutes: 401, currentStreak: 401,
      bestStreak: 401, lastActiveDayKey: "2026-09-23", migrationStatus: "ready", updatedAt: today
    });
    for (let offset = 400; offset >= 0; offset -= 1) {
      const dayKey = new Date(today - offset * 86400000).toISOString().slice(0, 10);
      await ctx.db.insert("studyDailyStats", {
        profileId, dayKey, studiesCompleted: 1, planReadingsCompleted: 0,
        planReadingsOpened: 0, chaptersRead: 0, bibleSearches: 0,
        memoryReviews: 0, memoryMeditations: 0, memorySaved: 0,
        worksheetsPrinted: 0, memoryCardsPrinted: 0,
        encouragementsShared: 0, bookmarksSaved: 0, updatedAt: today
      });
    }
  });
  const stats = await t.query(api.study.stats, { profileId, clientKey, now: today });
  expect(stats.currentStreak).toBe(401);
  expect(stats.bestStreak).toBe(401);
  await t.run(async (ctx) => {
    const aggregate = await ctx.db.query("studyStats").withIndex("by_profile", (q) => q.eq("profileId", profileId)).unique();
    if (!aggregate) throw new Error("Missing test aggregate");
    await ctx.db.patch(aggregate._id, { lastActiveDayKey: "2026-09-22" });
  });
  expect((await t.query(api.study.stats, { profileId, clientKey, now: today })).currentStreak).toBe(400);
});

test("saving a memory verse assigns collections atomically and preserves existing collections", async () => {
  const t = convexTest(schema, modules);
  const clientKey = "memory-collection-device";
  const profileId = await t.mutation(api.study.ensureProfile, { clientKey });
  const args = { profileId, clientKey, reference: "Isaiah 46:4", verseText: "I will sustain you.", translationName: "BSB" };
  const verseId = await t.mutation(api.memory.saveVerse, { ...args, collections: ["Promises", "Trust"] });
  expect((await t.query(api.memory.list, { profileId, clientKey })).find((verse) => verse._id === verseId)?.collections).toEqual(["Promises", "Trust"]);
  await t.mutation(api.memory.saveVerse, { ...args, collections: ["Identity"] });
  const verses = await t.query(api.memory.list, { profileId, clientKey });
  expect(verses).toHaveLength(1);
  expect(verses[0].collections).toEqual(["Promises", "Trust", "Identity"]);
});

test("memory list includes older saved verses beyond the former 50-verse window", async () => {
  const t = convexTest(schema, modules);
  const clientKey = "many-verses-device";
  const profileId = await t.mutation(api.study.ensureProfile, { clientKey });
  await t.run(async (ctx) => {
    for (let index = 0; index < 55; index += 1) {
      await ctx.db.insert("memoryVerses", {
        profileId, reference: `Psalm 119:${index + 1}`, verseText: `Verse ${index + 1}`,
        translationName: "BSB", status: "new", practiceLevel: 1,
        reviewCount: 0, createdAt: index, updatedAt: index
      });
    }
  });
  const verses = await t.query(api.memory.list, { profileId, clientKey, limit: 500 });
  expect(verses).toHaveLength(55);
  expect(verses[verses.length - 1]?.reference).toBe("Psalm 119:1");
});

test("home memory count respects the local due-day boundary and profile access", async () => {
  const t = convexTest(schema, modules);
  const clientKey = "home-memory-device";
  const profileId = await t.mutation(api.study.ensureProfile, { clientKey });
  const dueThrough = Date.parse("2026-09-25T00:00:00Z");
  await t.run(async (ctx) => {
    for (const [index, nextReviewAt] of [undefined, dueThrough - 1, dueThrough].entries()) {
      await ctx.db.insert("memoryVerses", {
        profileId, reference: `Psalm 23:${index + 1}`, verseText: `Verse ${index + 1}`,
        translationName: "BSB", status: "new", practiceLevel: 1,
        reviewCount: 0, nextReviewAt, createdAt: index, updatedAt: index
      });
    }
  });
  expect(await t.query(api.memory.homeSummary, { profileId, clientKey, dueThrough })).toEqual({ dueCount: 2 });
  await expect(t.query(api.memory.homeSummary, { profileId, dueThrough })).rejects.toThrow("Unauthorized");
});

test("archived memory verses leave reviews, restore, and can be removed with their history", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-02T09:00:00Z"));
  const t = convexTest(schema, modules);
  const clientKey = "memory-archive-device";
  const profileId = await t.mutation(api.study.ensureProfile, { clientKey });
  const otherProfileId = await t.mutation(api.study.ensureProfile, { clientKey: "other-memory-device" });
  const memoryVerseId = await t.mutation(api.memory.saveVerse, {
    profileId, clientKey, reference: "James 1:22", verseText: "Be doers of the word", translationName: "BSB", note: "Remember to act"
  });
  const dueThrough = Date.now() + 86400000;
  expect(await t.query(api.memory.homeSummary, { profileId, clientKey, dueThrough })).toEqual({ dueCount: 1 });
  await expect(t.mutation(api.memory.archive, { profileId: otherProfileId, clientKey: "other-memory-device", memoryVerseId })).resolves.toBe(false);
  expect(await t.mutation(api.memory.archive, { profileId, clientKey, memoryVerseId })).toBe(true);
  expect(await t.query(api.memory.homeSummary, { profileId, clientKey, dueThrough })).toEqual({ dueCount: 0 });
  expect((await t.query(api.memory.list, { profileId, clientKey }))[0]).toMatchObject({ archivedAt: expect.any(Number), note: "Remember to act" });
  expect(await t.query(api.memory.listHistory, { profileId, clientKey, memoryVerseId })).toHaveLength(1);
  expect(await t.mutation(api.memory.restore, { profileId, clientKey, memoryVerseId })).toBe(true);
  expect(await t.query(api.memory.homeSummary, { profileId, clientKey, dueThrough })).toEqual({ dueCount: 1 });
  await t.run(async (ctx) => {
    for (let index = 0; index < 105; index += 1) {
      await ctx.db.insert("memoryHistory", { profileId, memoryVerseId, reference: "James 1:22", event: "reviewed", createdAt: index });
    }
  });
  expect(await t.mutation(api.memory.remove, { profileId, clientKey, memoryVerseId })).toBe(true);
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect(await t.query(api.memory.list, { profileId, clientKey })).toHaveLength(0);
  expect(await t.query(api.memory.listHistory, { profileId, clientKey, memoryVerseId })).toHaveLength(0);
});

test("renaming a collection updates active and archived verses and keeps its order", async () => {
  const t = convexTest(schema, modules);
  const clientKey = "rename-memory-device";
  const profileId = await t.mutation(api.study.ensureProfile, { clientKey });
  await t.run(async (ctx) => {
    await ctx.db.patch(profileId, { uiPreferences: { memoryCollectionOrder: ["Trust", "Promises"], memoryCollectionFilter: "Trust" } });
    for (const [index, collections, archivedAt] of [
      [0, ["Trust", "Promises"], undefined],
      [1, ["Trust"], 1],
      [2, ["Promises"], undefined]
    ] as const) {
      await ctx.db.insert("memoryVerses", {
        profileId, reference: `Romans 8:${index + 1}`, verseText: `Verse ${index + 1}`,
        translationName: "BSB", collections: [...collections], archivedAt,
        status: "new", practiceLevel: 1, reviewCount: 0, createdAt: index, updatedAt: index
      });
    }
  });
  await expect(t.mutation(api.memory.renameCollection, { profileId, clientKey: "wrong-device", oldName: "Trust", newName: "Identity", order: ["Identity", "Promises"] })).rejects.toThrow("Unauthorized");
  await expect(t.mutation(api.memory.renameCollection, { profileId, clientKey, oldName: "Trust", newName: "Promises", order: ["Promises"] })).rejects.toThrow("already exists");
  expect(await t.mutation(api.memory.renameCollection, { profileId, clientKey, oldName: "Trust", newName: "Identity", order: ["Identity", "Promises"] })).toEqual({ renamedCount: 2 });
  const verses = await t.query(api.memory.list, { profileId, clientKey });
  expect(verses.find((verse) => verse.reference === "Romans 8:1")?.collections).toEqual(["Identity", "Promises"]);
  expect(verses.find((verse) => verse.reference === "Romans 8:2")?.collections).toEqual(["Identity"]);
  const preferences = await t.run(async (ctx) => (await ctx.db.get(profileId))?.uiPreferences);
  expect(preferences?.memoryCollectionOrder).toEqual(["Identity", "Promises"]);
  expect(preferences?.memoryCollectionFilter).toBe("Identity");
});

test("empty Memory collections persist and can be renamed without a verse", async () => {
  const t = convexTest(schema, modules);
  const clientKey = "empty-memory-collection-device";
  const profileId = await t.mutation(api.study.ensureProfile, { clientKey });
  await expect(t.mutation(api.memory.createCollection, { profileId, clientKey: "wrong-device", name: "Promises" })).rejects.toThrow("Unauthorized");
  expect(await t.mutation(api.memory.createCollection, { profileId, clientKey, name: "Promises" })).toBe("Promises");
  await expect(t.mutation(api.memory.createCollection, { profileId, clientKey, name: "promises" })).rejects.toThrow("already exists");
  expect(await t.mutation(api.memory.renameCollection, { profileId, clientKey, oldName: "Promises", newName: "Trust", order: ["Trust"] })).toEqual({ renamedCount: 0 });
  const preferences = await t.run(async (ctx) => (await ctx.db.get(profileId))?.uiPreferences);
  expect(preferences?.memoryCollectionNames).toEqual(["Trust"]);
  expect(preferences?.memoryCollectionOrder).toEqual(["Trust"]);
});

test("creating a collection can attach selected active verses atomically", async () => {
  const t = convexTest(schema, modules);
  const clientKey = "selected-memory-collection-device";
  const profileId = await t.mutation(api.study.ensureProfile, { clientKey });
  const otherProfileId = await t.mutation(api.study.ensureProfile, { clientKey: "other-selected-memory-device" });
  const [firstId, secondId, archivedId, otherId] = await t.run(async (ctx) => {
    const insert = (owner: typeof profileId, reference: string, archivedAt?: number) => ctx.db.insert("memoryVerses", {
      profileId: owner, reference, verseText: reference, translationName: "BSB",
      status: "new" as const, practiceLevel: 1, reviewCount: 0, createdAt: 1, updatedAt: 1,
      ...(archivedAt ? { archivedAt } : {})
    });
    return [
      await insert(profileId, "Romans 5:8"),
      await insert(profileId, "James 1:22"),
      await insert(profileId, "Matthew 4:4", 1),
      await insert(otherProfileId, "Psalm 23:1")
    ];
  });
  await expect(t.mutation(api.memory.createCollection, { profileId, clientKey, name: "Promises", memoryVerseIds: [firstId, otherId] })).rejects.toThrow("no longer in All Verses");
  await expect(t.mutation(api.memory.createCollection, { profileId, clientKey, name: "Promises", memoryVerseIds: [archivedId] })).rejects.toThrow("no longer in All Verses");
  expect((await t.run(async (ctx) => (await ctx.db.get(profileId))?.uiPreferences))?.memoryCollectionNames).toBeUndefined();
  expect(await t.mutation(api.memory.createCollection, { profileId, clientKey, name: "Promises", memoryVerseIds: [firstId, secondId] })).toBe("Promises");
  const verses = await t.query(api.memory.list, { profileId, clientKey });
  expect(verses.filter((verse) => [firstId, secondId].includes(verse._id)).every((verse) => verse.collections?.includes("Promises"))).toBe(true);
  expect(verses.find((verse) => verse._id === archivedId)?.collections).toBeUndefined();
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
