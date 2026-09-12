import * as Crypto from "expo-crypto";
export const createSecureDeviceKey = () => Crypto.randomUUID();
