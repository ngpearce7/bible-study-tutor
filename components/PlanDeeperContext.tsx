import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PlanRelatedPassage } from "@/components/PlanRelatedPassage";
import type { BibleApiTranslationId } from "@/data/biblePassage";
import { hasCuratedPlanConnections, hasPlanDeeperContext, planContextReference, selectPlanCrossReferences } from "@/data/biblePlanDeeperContext";
import type { BibleReadingPlanDay } from "@/data/bibleReadingPlanTypes";
import { DEVOTIONAL_TEXT_SIZE_STYLES, type DevotionalTextSize } from "@/data/devotionalTypography";
import { getStudyCrossReferences, loadStudyCrossReferences, type StudyCrossReference } from "@/data/studyContext";

type Props = { day: BibleReadingPlanDay; planDayCount: number; darkMode: boolean; textSize: DevotionalTextSize; translation: "bsb" | BibleApiTranslationId };

export function PlanDeeperContext({ day, planDayCount, darkMode, textSize, translation }: Props) {
  const [deeperWidth, setDeeperWidth] = useState(0);
  const [relatedReference, setRelatedReference] = useState("");
  const [suggestionResult, setSuggestionResult] = useState<{ reference: string; items: StudyCrossReference[]; loading: boolean }>(() => ({
    reference: day.reference,
    items: getStudyCrossReferences(day.reference),
    loading: false
  }));
  useEffect(() => {
    if (day.deeperContext || hasCuratedPlanConnections(day.reference) || !hasPlanDeeperContext(day, planDayCount)) return;
    let active = true;
    setSuggestionResult({ reference: day.reference, items: getStudyCrossReferences(day.reference), loading: true });
    void loadStudyCrossReferences(day.reference, 300).then((loaded) => {
      if (active) setSuggestionResult({ reference: day.reference, items: loaded, loading: false });
    }).finally(() => {
      if (active) setSuggestionResult((result) => result.reference === day.reference ? { ...result, loading: false } : result);
    });
    return () => { active = false; };
  }, [day.reference, day.deeperContext, day.guidanceKind, planDayCount]);

  if (!hasPlanDeeperContext(day, planDayCount)) return null;
  const isCurated = !!day.deeperContext || hasCuratedPlanConnections(day.reference);
  const suggestions = suggestionResult.reference === day.reference ? suggestionResult.items : getStudyCrossReferences(day.reference);
  const suggestionsLoading = suggestionResult.reference !== day.reference || suggestionResult.loading;
  const deeper = day.deeperContext || {
    contextReference: planContextReference(day),
    contextNote: day.reference === planContextReference(day)
      ? "Read the passage as a whole and notice how its argument, story, or prayer develops."
      : "Read the whole chapter to see what comes before and after today's verses.",
    connections: selectPlanCrossReferences(day, suggestions),
    comparePrompt: "What is each passage saying in its own setting? Where do they genuinely connect, and where do they differ?"
  };

  const sizing = DEVOTIONAL_TEXT_SIZE_STYLES[textSize];
  const ink = darkMode ? "#f2efeb" : "#172536";
  const muted = darkMode ? "#c4beb8" : "#53677e";
  const accent = darkMode ? "#d5a45f" : "#8d5528";
  const border = darkMode ? "#4a3e31" : "#d7e1e9";
  const twoColumns = deeperWidth >= 620;
  const headingSize = textSize === "normal" ? 19 : textSize === "large" ? 21 : 23;

  const passageLink = (reference: string) => (
    <Pressable accessibilityRole="button" accessibilityLabel={`Read ${reference} in Bible reader`} onPress={() => setRelatedReference(reference)}>
      <Text style={[styles.link, sizing.copy, { color: ink }]}>{reference} ›</Text>
    </Pressable>
  );
  const prompt = (label: string, value?: string) => value ? (
    <View style={styles.promptRow} key={label}>
      <Text style={[styles.label, sizing.label, { color: accent }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.copy, sizing.copy, { color: muted }]}>{value}</Text>
    </View>
  ) : null;

  return (
    <View style={styles.root}>
      <View style={styles.contextSection}>
        <Text style={[styles.label, sizing.label, { color: accent }]}>CONTEXT</Text>
        <Text style={[styles.copy, sizing.copy, { color: muted }]}>{day.context || deeper.contextNote}</Text>
        {!!day.devotional && (
          <View style={styles.devotional}>
            <Text style={[styles.devotionalTitle, sizing.title, { color: ink }]}>{day.devotional.title}</Text>
            <Text style={[styles.copy, sizing.copy, { color: muted }]}>{day.devotional.body}</Text>
          </View>
        )}
        <View style={styles.prompts}>
          <Text style={[styles.label, sizing.label, { color: accent }]}>DAILY PROMPTS</Text>
          {prompt("Notice", day.observationQuestion)}
          {prompt("Reflect", day.reflectionQuestion || day.reflectionPrompt)}
          {prompt("Pray", day.prayer || day.prayerPrompt)}
          {prompt("Next step", day.gentleAction)}
          {prompt("Study method", day.studyMethod)}
        </View>
      </View>

      <View onLayout={(event) => setDeeperWidth(event.nativeEvent.layout.width)} style={[styles.deeperSection, !twoColumns && styles.deeperCompact, { borderColor: border, backgroundColor: darkMode ? "#292727" : "#f7f9fb" }]}>
        <Text style={[styles.label, sizing.label, { color: accent }]}>GO DEEPER</Text>
        <Text style={[styles.heading, { color: ink, fontSize: headingSize, lineHeight: headingSize + 5 }]}>One reading, two ways to go deeper</Text>
        <Text style={[styles.intro, sizing.copy, { color: muted }]}>Start with today's reading, then explore its setting and related passages.</Text>
        <View style={[styles.columns, twoColumns && styles.columnsWide]}>
          <View style={[styles.mainColumn, twoColumns && styles.wideColumn, twoColumns && { borderRightWidth: 1, borderRightColor: border, paddingRight: 18 }]}>
            <Text style={[styles.label, sizing.label, { color: accent }]}>TODAY'S READING</Text>
            <View style={styles.step}>
              <Text style={[styles.number, { color: accent, backgroundColor: darkMode ? "#51402c" : "#f0dfca" }]}>1</Text>
              <View style={styles.stepCopy}>
                <Text style={[styles.stepTitle, sizing.copy, { color: ink }]}>Begin with {day.reference}</Text>
                <Text style={[styles.copy, sizing.copy, { color: muted }]}>Notice the passage's own words before following a connection.</Text>
              </View>
            </View>
            <View style={styles.step}>
              <Text style={[styles.number, { color: accent, backgroundColor: darkMode ? "#51402c" : "#f0dfca" }]}>2</Text>
              <View style={styles.stepCopy}>
                <Text style={[styles.stepTitle, sizing.copy, { color: ink }]}>{deeper.contextReference === day.reference ? "Reread the whole passage" : "Read the surrounding words"}</Text>
                {passageLink(deeper.contextReference)}
                <Text style={[styles.copy, sizing.copy, { color: muted }]}>{deeper.contextNote}</Text>
              </View>
            </View>
            <View style={styles.step}>
              <Text style={[styles.number, { color: accent, backgroundColor: darkMode ? "#51402c" : "#f0dfca" }]}>3</Text>
              <View style={styles.stepCopy}>
                <Text style={[styles.stepTitle, sizing.copy, { color: ink }]}>Read alongside</Text>
                <Text style={[styles.copy, sizing.copy, { color: muted }]}>Compare the related passages without losing the setting of today's reading.</Text>
              </View>
            </View>
          </View>
          <View style={[styles.sideColumn, twoColumns && styles.wideColumn, !twoColumns && { borderTopWidth: 1, borderTopColor: border, paddingTop: 16 }]}>
            <Text style={[styles.label, sizing.label, { color: accent }]}>READ ALONGSIDE</Text>
            <Text style={[styles.sideHeading, { color: ink, fontSize: textSize === "normal" ? 16 : textSize === "large" ? 18 : 20 }]}>{isCurated ? "Two useful connections" : "Cross-reference suggestions"}</Text>
            {!deeper.connections.length && <Text style={[styles.copy, sizing.copy, { color: muted }]}>{suggestionsLoading ? "Finding related passages…" : "Related passages are unavailable right now. You can still explore the surrounding text."}</Text>}
            {deeper.connections.map((connection, index) => (
              <View key={connection.reference} style={[styles.connection, !twoColumns && styles.connectionCompact, { backgroundColor: darkMode ? "#33302d" : "#ffffff", borderLeftColor: index === 0 ? (darkMode ? "#e47f6a" : "#a74f3d") : (darkMode ? "#8db7d1" : "#285679") }]}>
                <Text style={[styles.label, sizing.label, { color: accent }]}>{connection.relationship.toUpperCase()}</Text>
                {passageLink(connection.reference)}
                <Text style={[styles.copy, sizing.copy, { color: muted }]}>{connection.note}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={[styles.compare, { backgroundColor: darkMode ? "#352c25" : "#f7eee3" }]}>
          <Text style={[styles.label, sizing.label, { color: accent }]}>COMPARE THE PASSAGES</Text>
          <Text style={[styles.copy, sizing.copy, { color: ink }]}>{deeper.comparePrompt}</Text>
        </View>
        <Text style={[styles.tail, sizing.copy, { color: muted }]}>{isCurated ? "These connections are further reading; today's passage remains the starting point." : "These suggestions come from the app's cross-reference index. Compare each passage in its own setting; today's reading remains the starting point."}</Text>
      </View>
      {!!relatedReference && (
        <PlanRelatedPassage
          key={relatedReference}
          reference={relatedReference}
          dayReference={day.reference}
          dayNumber={day.day}
          translation={translation}
          darkMode={darkMode}
          onClose={() => setRelatedReference("")}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: "100%" },
  contextSection: { gap: 5 },
  label: { fontWeight: "700", letterSpacing: 0.5 },
  copy: { marginTop: 2 },
  devotional: { marginTop: 12, gap: 3 },
  devotionalTitle: { fontWeight: "700" },
  prompts: { marginTop: 15, gap: 13 },
  promptRow: { gap: 2 },
  deeperSection: { borderWidth: 1, borderRadius: 14, marginTop: 23, padding: 16 },
  deeperCompact: { padding: 10 },
  heading: { fontWeight: "700", marginTop: 5 },
  intro: { marginTop: 5 },
  columns: { marginTop: 19, gap: 18 },
  columnsWide: { flexDirection: "row" },
  mainColumn: { minWidth: 0 },
  sideColumn: { minWidth: 0 },
  wideColumn: { flex: 1 },
  step: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 16 },
  number: { width: 27, height: 27, borderRadius: 14, textAlign: "center", textAlignVertical: "center", overflow: "hidden", fontSize: 12, fontWeight: "700", lineHeight: 27 },
  stepCopy: { flex: 1, minWidth: 0 },
  stepTitle: { fontWeight: "700" },
  link: { fontWeight: "700", textDecorationLine: "underline", marginTop: 3 },
  sideHeading: { fontWeight: "700", marginTop: 5 },
  connection: { borderLeftWidth: 3, borderTopRightRadius: 10, borderBottomRightRadius: 10, paddingHorizontal: 14, paddingVertical: 11, marginTop: 10 },
  connectionCompact: { paddingHorizontal: 10 },
  compare: { borderRadius: 10, marginTop: 16, paddingHorizontal: 14, paddingVertical: 13 },
  tail: { marginTop: 16 }
});
