import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import type { StoredAppearanceMode } from "@/data/feedbackPreferences";

export function AppearanceControl({ mode, dark, onChange }: {
  mode: StoredAppearanceMode; dark: boolean; onChange: (mode: StoredAppearanceMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const ink = dark ? "#f7eddc" : "#39452e";
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel="Change appearance" onPress={() => setOpen(true)} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 12 }}>
      <Text style={{ color: ink, fontSize: 13, fontWeight: "600" }}>Theme: {mode === "system" ? "Device" : mode === "dark" ? "Dark" : "Light"}</Text>
    </Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 24 }}>
        <View accessibilityViewIsModal style={{ width: "100%", maxWidth: 360, backgroundColor: dark ? "#222b28" : "#fffaf2", borderRadius: 20, padding: 24, gap: 12 }}>
          <Text accessibilityRole="header" style={{ color: ink, fontSize: 22, fontWeight: "700" }}>Appearance</Text>
          {([['light', 'Light'], ['dark', 'Dark'], ['system', 'Use device setting']] as const).map(([value, label]) =>
            <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: mode === value }} onPress={() => { onChange(value); setOpen(false); }} style={{ minHeight: 48, justifyContent: "center", padding: 12, borderRadius: 10, backgroundColor: mode === value ? (dark ? "#364237" : "#e5ecda") : "transparent" }}>
              <Text style={{ color: ink, fontSize: 16 }}>{label}{mode === value ? ' ✓' : ''}</Text>
            </Pressable>
          )}
          <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={{ minHeight: 44, justifyContent: "center", alignItems: "center" }}><Text style={{ color: ink }}>Close</Text></Pressable>
        </View>
      </View>
    </Modal>
  </>;
}
