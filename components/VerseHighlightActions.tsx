import { Pressable, Text, View } from "react-native";

export type VerseHighlightColor = "gold" | "blue" | "green";

const choices: { color: VerseHighlightColor; label: string; light: string; dark: string }[] = [
  { color: "gold", label: "Gold", light: "#f5dc9d", dark: "#795b2f" },
  { color: "blue", label: "Blue", light: "#c8e4f4", dark: "#315a72" },
  { color: "green", label: "Green", light: "#d6e9cb", dark: "#436549" }
];

export function VerseHighlightActions({ darkMode, onChoose }: { darkMode: boolean; onChoose: (color: VerseHighlightColor | null) => void }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 7 }}>
      <Text style={{ color: darkMode ? "#ddd2c2" : "#53677e", fontWeight: "700" }}>Highlight</Text>
      {choices.map(({ color, label, light, dark }) => (
        <Pressable key={color} accessibilityRole="button" accessibilityLabel={`Highlight selected verses ${label.toLowerCase()}`} onPress={() => onChoose(color)} style={{ minWidth: 44, minHeight: 40, paddingHorizontal: 8, borderRadius: 8, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: darkMode ? "#9c8f7c" : "#bdcbd2", backgroundColor: darkMode ? dark : light }}>
          <Text style={{ color: darkMode ? "#fff" : "#172536", fontWeight: "700", fontSize: 12 }}>{label}</Text>
        </Pressable>
      ))}
      <Pressable accessibilityRole="button" accessibilityLabel="Remove highlight from selected verses" onPress={() => onChoose(null)} style={{ minHeight: 40, paddingHorizontal: 10, borderRadius: 8, justifyContent: "center", borderWidth: 1, borderColor: darkMode ? "#82766a" : "#bdcbd2" }}>
        <Text style={{ color: darkMode ? "#ddd2c2" : "#285679", fontWeight: "700", fontSize: 12 }}>Remove</Text>
      </Pressable>
    </View>
  );
}
