import AsyncStorage from "./deviceStorage";
import { Platform } from "react-native";

// Synchronous cache supports immediate recovery reads; disk writes are serialized.
const cache = new Map<string, string>();
let writes: Promise<void> = Promise.resolve();
export async function hydratePrivateStorage() {
  if (Platform.OS === "web") return;
  const keys = (await AsyncStorage.getAllKeys()).filter(key => key.startsWith("bible-study-tutor-study-recovery-"));
  for (const [key, value] of await AsyncStorage.multiGet(keys)) if (value !== null && !cache.has(key)) cache.set(key, value);
}
export function readRecoveryValue(key: string) {
  if (cache.has(key)) return cache.get(key)!;
  if (Platform.OS !== "web") return null;
  try { return localStorage.getItem(key); } catch { return null; }
}
export function writeRecoveryValue(key: string, value: string) {
  cache.set(key, value);
  if (Platform.OS === "web") {
    try { localStorage.setItem(key, value); return Promise.resolve(); } catch (error) { return Promise.reject(error); }
  }
  const next = writes.catch(() => undefined).then(() => AsyncStorage.setItem(key, value));
  writes = next;
  return next;
}
export function removeRecoveryValue(key: string) {
  cache.delete(key);
  if (Platform.OS === "web") {
    try { localStorage.removeItem(key); } catch { /* Preserve remote success. */ }
    return;
  }
  writes = writes.catch(() => undefined).then(() => AsyncStorage.removeItem(key));
  void writes.catch(() => undefined);
}
