/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("verse highlights save, recolour and remove without changing other chapters", async () => {
  const t = convexTest(schema, modules);
  const profileId = await t.mutation(api.study.ensureProfile, { clientKey: "reader-one" });
  const args = { profileId, clientKey: "reader-one", book: "James", chapter: 1 };
  await t.mutation(api.bibleHighlights.setHighlights, { ...args, verses: [22, 23], color: "gold" });
  await t.mutation(api.bibleHighlights.setHighlights, { ...args, verses: [22], color: "blue" });
  expect(await t.query(api.bibleHighlights.chapterHighlights, args)).toEqual([
    { verse: 22, color: "blue" }, { verse: 23, color: "gold" }
  ]);
  expect(await t.query(api.bibleHighlights.chapterHighlights, { ...args, chapter: 2 })).toEqual([]);
  await t.mutation(api.bibleHighlights.setHighlights, { ...args, verses: [23], color: null });
  expect(await t.query(api.bibleHighlights.chapterHighlights, args)).toEqual([{ verse: 22, color: "blue" }]);
});

test("another profile cannot read or change saved highlights", async () => {
  const t = convexTest(schema, modules);
  const profileId = await t.mutation(api.study.ensureProfile, { clientKey: "reader-owner" });
  const args = { profileId, clientKey: "reader-owner", book: "James", chapter: 1 };
  await t.mutation(api.bibleHighlights.setHighlights, { ...args, verses: [22], color: "green" });
  await expect(t.query(api.bibleHighlights.chapterHighlights, { ...args, clientKey: "other-device" })).rejects.toThrow("Unauthorized");
  await expect(t.mutation(api.bibleHighlights.setHighlights, { ...args, clientKey: "other-device", verses: [22], color: null })).rejects.toThrow("Unauthorized");
  expect(await t.query(api.bibleHighlights.chapterHighlights, args)).toEqual([{ verse: 22, color: "green" }]);
});

test("a signed-in reader sees highlights from another session", async () => {
  const t = convexTest(schema, modules);
  const { userId, profileId } = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {});
    const profileId = await ctx.db.insert("profiles", {
      authUserId: userId, clientKey: `auth:${userId}`, displayName: "Reader", createdAt: 1, updatedAt: 1
    });
    return { userId, profileId };
  });
  const firstSession = t.withIdentity({ subject: `${userId}|session-one` });
  const secondSession = t.withIdentity({ subject: `${userId}|session-two` });
  await firstSession.mutation(api.bibleHighlights.setHighlights, {
    profileId, book: "Romans", chapter: 12, verses: [2], color: "gold"
  });
  expect(await secondSession.query(api.bibleHighlights.chapterHighlights, {
    profileId, book: "Romans", chapter: 12
  })).toEqual([{ verse: 2, color: "gold" }]);
});
