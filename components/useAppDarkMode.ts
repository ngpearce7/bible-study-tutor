import { useEffect } from "react";
import { Platform, useColorScheme } from "react-native";
import type { StoredAppearanceMode } from "@/data/feedbackPreferences";

export function useAppDarkMode(mode: StoredAppearanceMode) {
  const deviceScheme = useColorScheme();
  const dark = mode === "dark" || (mode === "system" && deviceScheme === "dark");
  useEffect(() => {
    if (Platform.OS !== "web") return;
    // iOS can expose the document canvas when panning a focused input above
    // the keyboard. Theme that canvas as well as the React Native screen.
    const elements = [document.documentElement, document.body];
    const previous = elements.map(({ style }) => [style.backgroundColor, style.colorScheme]);
    elements.forEach(({ style }) => {
      style.backgroundColor = dark ? "#181818" : "#f8f1e6";
      style.colorScheme = dark ? "dark" : "light";
    });
    return () => elements.forEach(({ style }, index) => {
      [style.backgroundColor, style.colorScheme] = previous[index];
    });
  }, [dark]);
  return dark;
}
