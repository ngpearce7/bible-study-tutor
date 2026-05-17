import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const key = "bible-study-tutor-client-key";

export async function getDeviceKey() {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const created = createKey();
    localStorage.setItem(key, created);
    return created;
  }

  const existing = await SecureStore.getItemAsync(key);
  if (existing) return existing;
  const created = createKey();
  await SecureStore.setItemAsync(key, created);
  return created;
}

function createKey() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
