import { StyleSheet } from "react-native";
import { colors } from "./ui";

export function recoveryStyles(dark: boolean) {
  return StyleSheet.create({
    panel: { gap: 12, padding: 16, borderWidth: 1, borderRadius: 12, borderColor: dark ? "#514b3d" : colors.line, backgroundColor: dark ? "#1b2421" : colors.panel, minWidth: 0 },
    text: { color: dark ? "#eee7d8" : colors.ink, fontSize: 14, lineHeight: 21 },
    input: { borderWidth: 1, borderColor: dark ? "#514b3d" : colors.line, backgroundColor: dark ? "#141b18" : colors.panel, color: dark ? "#eee7d8" : colors.ink, borderRadius: 10, minHeight: 48, padding: 12, fontSize: 16, minWidth: 0 },
    secondary: { backgroundColor: dark ? "#1b2421" : colors.panel, borderColor: dark ? "#72634a" : colors.line, paddingVertical: 12 },
    secondaryLabel: { color: dark ? "#eee7d8" : colors.oliveDark },
    code: { color: dark ? "#eee7d8" : colors.ink, fontSize: 16, lineHeight: 24, flexShrink: 1 }
  });
}
