import { beforeEach, expect, test, vi } from "vitest";
const { disk, legacy } = vi.hoisted(() => ({ disk: new Map<string, string>(), legacy: new Map<string, string>() }));
vi.mock("react-native", () => ({ Platform: { OS: "ios" } }));
vi.mock("expo-secure-store", () => ({ getItemAsync: async (key: string) => legacy.get(key) ?? null }));
vi.mock("./deviceStorage", () => ({ default: {
  getItem: async (key: string) => disk.get(key) ?? null,
  setItem: async (key: string, value: string) => { disk.set(key, value); },
  removeItem: async (key: string) => { disk.delete(key); },
  getAllKeys: async () => [...disk.keys()],
  multiGet: async (keys: string[]) => keys.map(key => [key, disk.get(key) ?? null])
} }));
beforeEach(() => { disk.clear(); legacy.clear(); vi.resetModules(); });

test("account caches and explicit legacy import do not replace another account's notes", async () => {
  const store = await import("./feedbackPreferences");
  const bookmark = { id: "one", book: "John", chapter: 1, reference: "John 1", note: "Private reflection", createdAt: "2026-09-12" };
  store.setStorageProfile("alice"); await store.saveStoredBibleBookmarks([bookmark]);
  store.setStorageProfile("bob"); expect(await store.getStoredBibleBookmarks()).toEqual([]);
  legacy.set("bible-study-tutor-bible-bookmarks", JSON.stringify([{ ...bookmark, note: "Legacy" }]));
  await store.importLegacyDevicePreferences(); expect((await store.getStoredBibleBookmarks())[0].note).toBe("Legacy");
  store.setStorageProfile("alice"); await store.importLegacyDevicePreferences();
  expect((await store.getStoredBibleBookmarks())[0].note).toBe("Private reflection");
});
test("native draft survives a fresh module session", async () => {
  let store = await import("./privateStorage");
  const key = "bible-study-tutor-study-recovery-alice-john";
  await store.writeRecoveryValue(key, JSON.stringify({ answer: "A long reflection" }));
  vi.resetModules(); store = await import("./privateStorage");
  expect(store.readRecoveryValue(key)).toBeNull();
  await store.hydratePrivateStorage();
  expect(JSON.parse(store.readRecoveryValue(key)!)).toEqual({ answer: "A long reflection" });
});
