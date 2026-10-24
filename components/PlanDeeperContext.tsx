import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { BibleReadingPlanDay } from "@/data/bibleReadingPlanTypes";
import { DEVOTIONAL_TEXT_SIZE_STYLES, type DevotionalTextSize } from "@/data/devotionalTypography";

type Props = { day: BibleReadingPlanDay; darkMode: boolean; textSize: DevotionalTextSize };

function openPassage(reference: string) {
  void Linking.openURL(`https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference)}&version=WEB`);
}

export function PlanDeeperContext({ day, darkMode, textSize }: Props) {
  const deeper = day.deeperContext;
  if (!deeper) return null;

  const sizing = DEVOTIONAL_TEXT_SIZE_STYLES[textSize];
  const ink = darkMode ? "#f2efeb" : "#172536";
  const muted = darkMode ? "#c4beb8" : "#53677e";
  const accent = darkMode ? "#d5a45f" : "#8d5528";
  const border = darkMode ? "#4a3e31" : "#d7e1e9";
  const headingSize = textSize === "normal" ? 19 : textSize === "large" ? 21 : 23;

  const passageLink = (reference: string) => (
    <Pressable accessibilityRole="link" accessibilityLabel={`Read ${reference} on Bible Gateway`} onPress={() => openPassage(reference)}>
      <Text style={[styles.link, sizing.copy, { color: ink }]}>{reference} ↗</Text>
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
          {prompt("Notice", day.observationQuestion)}
          {prompt("Reflect", day.reflectionQuestion || day.reflectionPrompt)}
          {prompt("Pray", day.prayer || day.prayerPrompt)}
          {prompt("Next step", day.gentleAction)}
          {prompt("Study method", day.studyMethod)}
        </View>
      </View>

      <View style={[styles.deeperSection, { borderTopColor: border }]}>
        <Text style={[styles.heading, { color: ink, fontSize: headingSize, lineHeight: headingSize + 5 }]}>Go deeper</Text>
        <Text style={[styles.intro, sizing.copy, { color: muted }]}>Start with today's reading, then explore its setting and related passages.</Text>

        <View style={styles.reading}>
          <Text style={[styles.label, sizing.label, { color: accent }]}>READ IN CONTEXT</Text>
          {passageLink(deeper.contextReference)}
          <Text style={[styles.copy, sizing.copy, { color: muted }]}>{deeper.contextNote}</Text>
        </View>

        <Text style={[styles.label, styles.alongsideHeading, sizing.label, { color: accent }]}>READ ALONGSIDE</Text>
        {deeper.connections.map((connection) => (
          <View key={connection.reference} style={[styles.reading, styles.relatedReading, { borderTopColor: border }]}>
            <Text style={[styles.label, sizing.label, { color: accent }]}>{connection.relationship.toUpperCase()}</Text>
            {passageLink(connection.reference)}
            <Text style={[styles.copy, sizing.copy, { color: muted }]}>{connection.note}</Text>
          </View>
        ))}

        <View style={[styles.compare, { borderTopColor: border }]}>
          <Text style={[styles.label, sizing.label, { color: accent }]}>COMPARE THE PASSAGES</Text>
          <Text style={[styles.copy, sizing.copy, { color: ink }]}>{deeper.comparePrompt}</Text>
        </View>
        <Text style={[styles.tail, sizing.copy, { color: muted }]}>These connections are further reading; today's passage remains the starting point. Links open Bible Gateway.</Text>
      </View>
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
  deeperSection: { borderTopWidth: 1, marginTop: 23, paddingTop: 19 },
  heading: { fontWeight: "700" },
  intro: { marginTop: 5 },
  reading: { marginTop: 17, gap: 2 },
  link: { fontWeight: "700", textDecorationLine: "underline", marginTop: 3 },
  alongsideHeading: { marginTop: 20 },
  relatedReading: { borderTopWidth: 1, paddingTop: 13, marginTop: 12 },
  compare: { borderTopWidth: 1, marginTop: 18, paddingTop: 14 },
  tail: { marginTop: 16 }
});
