import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { BibleReadingPlanDay } from "@/data/bibleReadingPlanTypes";
import { DEVOTIONAL_TEXT_SIZE_STYLES, type DevotionalTextSize } from "@/data/devotionalTypography";

type Props = { day: BibleReadingPlanDay; darkMode: boolean; textSize: DevotionalTextSize };

function openPassage(reference: string) {
  void Linking.openURL(`https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference)}&version=WEB`);
}

export function PlanDeeperContext({ day, darkMode, textSize }: Props) {
  const context = day.deeperContext;
  const [width, setWidth] = useState(0);
  const [whyOpen, setWhyOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  if (!context) return null;

  const sizing = DEVOTIONAL_TEXT_SIZE_STYLES[textSize];
  const ink = darkMode ? "#f2efeb" : "#172536";
  const muted = darkMode ? "#c4beb8" : "#53677e";
  const gold = darkMode ? "#d5a45f" : "#8d5528";
  const inset = darkMode ? "#292929" : "#f3f7fa";
  const border = darkMode ? "#4a3e31" : "#d7e1e9";
  const twoColumns = width >= 620;
  const passageLink = (reference: string) => (
    <Pressable accessibilityRole="link" accessibilityLabel={`Read ${reference} on Bible Gateway`} onPress={() => openPassage(reference)}>
      <Text style={[styles.link, sizing.copy, { color: ink }]}>{reference} ↗</Text>
    </Pressable>
  );

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={styles.root}>
      <Text style={[styles.kicker, sizing.label, { color: gold }]}>FOCUSED PLAN READING · {day.reference.toUpperCase()}</Text>
      <Text style={[styles.heading, { fontSize: textSize === "normal" ? 20 : textSize === "large" ? 22 : 24, lineHeight: textSize === "normal" ? 26 : textSize === "large" ? 29 : 32, color: ink }]}>One reading, two ways to go deeper</Text>
      <View style={[styles.contextSection, { borderBottomColor: border }]}>
        <Text style={[styles.kicker, sizing.label, { color: gold }]}>CONTEXT</Text>
        <Text style={[styles.contextText, sizing.copy, { color: muted }]}>{day.context || context.contextNote}</Text>
      </View>
      <View style={[styles.columns, twoColumns && styles.columnsWide]}>
        <View style={[styles.mainColumn, twoColumns && { borderRightWidth: 1, borderRightColor: border, paddingRight: 18 }]}>
          <Text style={[styles.kicker, sizing.label, { color: gold }]}>TODAY'S READING</Text>
          <View style={styles.step}>
            <Text style={[styles.number, { color: gold, backgroundColor: darkMode ? "#51402c" : "#f0dfca" }]}>1</Text>
            <View style={styles.stepCopy}>
              <Text style={[styles.stepTitle, sizing.copy, { color: ink }]}>Observe {day.reference}</Text>
              <Text style={[styles.body, sizing.copy, { color: muted }]}>{context.observationNote}</Text>
            </View>
          </View>
          <View style={styles.step}>
            <Text style={[styles.number, { color: gold, backgroundColor: darkMode ? "#51402c" : "#f0dfca" }]}>2</Text>
            <View style={styles.stepCopy}>
              <Text style={[styles.stepTitle, sizing.copy, { color: ink }]}>Read the surrounding words</Text>
              <Text style={[styles.body, sizing.copy, { color: muted }]}>See how today's reading fits its chapter.</Text>
              {passageLink(context.contextReference)}
            </View>
          </View>
          <View style={styles.step}>
            <Text style={[styles.number, { color: gold, backgroundColor: darkMode ? "#51402c" : "#f0dfca" }]}>3</Text>
            <View style={styles.stepCopy}>
              <Text style={[styles.stepTitle, sizing.copy, { color: ink }]}>Choose a response</Text>
              <Text style={[styles.body, sizing.copy, { color: muted }]}>{day.gentleAction}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.sideColumn, !twoColumns && { borderTopWidth: 1, borderTopColor: border, paddingTop: 16 }]}>
          <Text style={[styles.kicker, sizing.label, { color: gold }]}>READ ALONGSIDE</Text>
          <Text style={[styles.sideHeading, { fontSize: textSize === "normal" ? 16 : textSize === "large" ? 18 : 20, color: ink }]}>Two useful connections</Text>
          {context.connections.map((connection, index) => (
            <View key={connection.reference} style={[twoColumns ? styles.connection : styles.connectionCompact, twoColumns ? { backgroundColor: inset, borderLeftColor: index === 0 ? (darkMode ? "#e47f6a" : "#a74f3d") : (darkMode ? "#8db7d1" : "#285679") } : { borderTopColor: border }]}>
              <Text style={[styles.connectionLabel, sizing.label, { color: gold }]}>{connection.relationship.toUpperCase()}</Text>
              {passageLink(connection.reference)}
              <Text style={[styles.body, sizing.copy, { color: muted }]}>{connection.note}</Text>
            </View>
          ))}
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: whyOpen }} onPress={() => setWhyOpen((open) => !open)} style={[styles.toggle, { borderTopColor: border }]}>
            <Text style={[styles.toggleText, sizing.copy, { color: gold }]}>Why these two passages?</Text>
            <Ionicons name={whyOpen ? "chevron-up" : "chevron-down"} size={16} color={gold} />
          </Pressable>
          {whyOpen && <Text style={[styles.body, sizing.copy, { color: muted }]}>A close parallel recounts a related teaching. A shared theme approaches the same question from another setting. A later use shows how a later writer applies an earlier passage. Read each passage in its own context.</Text>}
        </View>
      </View>
      <View style={[twoColumns ? styles.compare : styles.compareCompact, twoColumns ? { backgroundColor: darkMode ? "#352c25" : "#f7eee3" } : { borderTopColor: border }]}>
        <Text style={[styles.connectionLabel, sizing.label, { color: gold }]}>COMPARISON PROMPT</Text>
        <Text style={[styles.body, sizing.copy, { color: ink }]}>{context.comparePrompt}</Text>
      </View>
      <Text style={[styles.tail, sizing.copy, { color: muted }]}>Connections suggest further reading; today's passage remains the starting point. Links open Bible Gateway.</Text>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: moreOpen }} onPress={() => setMoreOpen((open) => !open)} style={[styles.toggle, { borderTopColor: border }]}>
        <Text style={[styles.toggleText, sizing.copy, { color: gold }]}>{moreOpen ? "Hide daily prompts" : "More daily prompts"}</Text>
        <Ionicons name={moreOpen ? "chevron-up" : "chevron-down"} size={16} color={gold} />
      </Pressable>
      {moreOpen && (
        <View style={styles.moreContent}>
          {!!day.devotional?.body && <Text style={[styles.body, sizing.copy, { color: muted }]}>{day.devotional.body}</Text>}
          {!!day.observationQuestion && <Text style={[styles.body, sizing.copy, { color: muted }]}><Text style={{ color: gold, fontWeight: "700" }}>NOTICE  </Text>{day.observationQuestion}</Text>}
          {!!(day.reflectionQuestion || day.reflectionPrompt) && <Text style={[styles.body, sizing.copy, { color: muted }]}><Text style={{ color: gold, fontWeight: "700" }}>REFLECT  </Text>{day.reflectionQuestion || day.reflectionPrompt}</Text>}
          {!!(day.prayer || day.prayerPrompt) && <Text style={[styles.body, sizing.copy, { color: muted }]}><Text style={{ color: gold, fontWeight: "700" }}>PRAY  </Text>{day.prayer || day.prayerPrompt}</Text>}
          {!!day.studyMethod && <Text style={[styles.body, sizing.copy, { color: muted }]}><Text style={{ color: gold, fontWeight: "700" }}>STUDY DEEPER  </Text>{day.studyMethod}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: "100%" },
  kicker: { fontSize: 11, fontWeight: "700", letterSpacing: 0.7 },
  heading: { fontSize: 21, fontWeight: "700", marginTop: 6, marginBottom: 8 },
  contextSection: { borderBottomWidth: 1, paddingTop: 13, paddingBottom: 17 },
  contextText: { marginTop: 6 },
  columns: { marginTop: 19, gap: 18 },
  columnsWide: { flexDirection: "row" },
  mainColumn: { flex: 1, minWidth: 0 },
  sideColumn: { flex: 1, minWidth: 0 },
  step: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 16 },
  number: { width: 27, height: 27, borderRadius: 14, textAlign: "center", textAlignVertical: "center", overflow: "hidden", fontSize: 12, fontWeight: "700", lineHeight: 27 },
  stepCopy: { flex: 1, minWidth: 0 },
  stepTitle: { fontWeight: "700" },
  body: { lineHeight: 21, marginTop: 4 },
  link: { fontWeight: "700", textDecorationLine: "underline", marginTop: 5 },
  sideHeading: { fontSize: 16, fontWeight: "700", marginTop: 5 },
  connection: { borderLeftWidth: 3, borderTopRightRadius: 10, borderBottomRightRadius: 10, paddingHorizontal: 14, paddingVertical: 11, marginTop: 10 },
  connectionCompact: { borderTopWidth: 1, paddingVertical: 12 },
  connectionLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.7 },
  toggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, marginTop: 14, paddingTop: 10, minHeight: 44 },
  toggleText: { fontWeight: "700" },
  compare: { borderRadius: 10, marginTop: 16, paddingHorizontal: 14, paddingVertical: 13 },
  compareCompact: { borderTopWidth: 1, marginTop: 16, paddingTop: 14 },
  tail: { fontSize: 12, marginTop: 12 },
  moreContent: { gap: 10, paddingBottom: 4 }
});
