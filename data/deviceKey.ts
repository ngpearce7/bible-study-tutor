import { createSecureDeviceKey } from "./secureRandom";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const key = "bible-study-tutor-client-key";

let cachedDeviceKey: string | undefined;
export const getCachedDeviceKey = () => cachedDeviceKey;

let loadingDeviceKey: Promise<string> | undefined;
export async function getDeviceKey() {
  if (cachedDeviceKey) return cachedDeviceKey;
  if (!loadingDeviceKey) loadingDeviceKey = loadDeviceKey().then(value => {
    cachedDeviceKey = value;
    return value;
  }).catch(error => { loadingDeviceKey = undefined; throw error; });
  return loadingDeviceKey;
}

async function loadDeviceKey() {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    try {
      const existing = localStorage.getItem(key);
      if (existing) return existing;
    } catch { /* Storage may be unavailable; use a key for this session. */ }
    const created = createKey();
    try { localStorage.setItem(key, created); } catch { /* Keep the in-memory key. */ }
    return created;
  }

  const existing = await SecureStore.getItemAsync(key);
  if (existing) return existing;
  const created = createKey();
  await SecureStore.setItemAsync(key, created);
  return created;
}

function createKey() { return createSecureDeviceKey(); }
