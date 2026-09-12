import { useColorScheme } from "react-native";
import type { StoredAppearanceMode } from "@/data/feedbackPreferences";

export function useAppDarkMode(mode: StoredAppearanceMode) {
  const deviceScheme = useColorScheme();
  return mode === "dark" || (mode === "system" && deviceScheme === "dark");
}
