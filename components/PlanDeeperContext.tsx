import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { BibleReadingPlanDeeperContext } from "@/data/bibleReadingPlanTypes";
import { DEVOTIONAL_TEXT_SIZE_STYLES, type DevotionalTextSize } from "@/data/devotionalTypography";

type Props = {
  context: BibleReadingPlanDeeperContext;
  darkMode: boolean;
  textSize: DevotionalTextSize;
};

function openPassage(reference: string) {
  const url = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference)}&version=WEB`;
  void Linking.openURL(url);
}

export function PlanDeeperContext({ context, darkMode, textSize }: Props) {
  const [expanded, setExpanded] = useState(false);
  const sizing = DEVOTIONAL_TEXT_SIZE_STYLES[textSize];
  const ink = darkMode ? "#f5f0e9" : "#172536";
  const muted = darkMode ? "#c8c1b9" : "#53677e";
  const accent = darkMode ? "#d4a768" : "#8d5528";
  return (
    <View style={[styles.box, darkMode && styles.boxDark]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? "Hide" : "Explore"} passage connections`}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={styles.toggle}
      >
        <View style={styles.toggleCopy}>
          <Text style={[styles.title, sizing.label, { color: accent }]}>EXPLORE CONNECTIONS</Text>
          {!expanded && <Text style={[styles.body, sizing.copy, { color: muted }]}>Context, related passages, and one comparison question</Text>}
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={19} color={accent} />
      </Pressable>
      {expanded && (
        <View style={styles.content}>
          <Text style={[styles.disclaimer, sizing.copy, { color: muted }]}>Start with today's passage. These readings add context or invite comparison. References open Bible Gateway in a browser.</Text>
          <View style={styles.row}>
            <Text style={[styles.label, sizing.label, { color: accent }]}>READ IN CONTEXT</Text>
            <Pressable accessibilityRole="link" accessibilityLabel={`Read ${context.contextReference} on Bible Gateway`} onPress={() => openPassage(context.contextReference)}>
              <Text style={[styles.reference, sizing.copy, { color: ink }]}>{context.contextReference} ↗</Text>
            </Pressable>
            <Text style={[styles.body, sizing.copy, { color: muted }]}>{context.contextNote}</Text>
          </View>
          {context.connections.map((connection) => (
            <View key={`${connection.reference}:${connection.relationship}`} style={styles.row}>
              <Text style={[styles.label, sizing.label, { color: accent }]}>{connection.relationship.toUpperCase()}</Text>
              <Pressable accessibilityRole="link" accessibilityLabel={`Read ${connection.reference} on Bible Gateway`} onPress={() => openPassage(connection.reference)}>
                <Text style={[styles.reference, sizing.copy, { color: ink }]}>{connection.reference} ↗</Text>
              </Pressable>
              <Text style={[styles.body, sizing.copy, { color: muted }]}>{connection.note}</Text>
            </View>
          ))}
          <View style={styles.compare}>
            <Text style={[styles.label, sizing.label, { color: accent }]}>COMPARE THE PASSAGES</Text>
            <Text style={[styles.body, sizing.copy, { color: ink }]}>{context.comparePrompt}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginTop: 16, borderWidth: 1, borderColor: "#d7e1e9", borderRadius: 14, backgroundColor: "#f5f8fa", overflow: "hidden" },
  boxDark: { borderColor: "#4c443c", backgroundColor: "#292727" },
  toggle: { flexDirection: "row", alignItems: "center", padding: 14, minHeight: 60 },
  toggleCopy: { flex: 1, paddingRight: 12 },
  title: { fontWeight: "700", letterSpacing: 0.4 },
  content: { paddingHorizontal: 14, paddingBottom: 15 },
  disclaimer: { marginBottom: 6 },
  row: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#a4a4a444" },
  label: { fontWeight: "700", marginBottom: 5 },
  reference: { fontWeight: "700", textDecorationLine: "underline", marginBottom: 4 },
  body: { lineHeight: 23 },
  compare: { paddingTop: 13, borderTopWidth: 1, borderTopColor: "#a4a4a444" }
});
