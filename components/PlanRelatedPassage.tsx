import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { expandPlanReadingReferences, fetchBiblePlanReadingPassage, type BibleApiTranslationId, type BiblePassage } from "@/data/biblePassage";

type Props = {
  reference: string;
  dayReference: string;
  dayNumber: number;
  translation: "bsb" | BibleApiTranslationId;
  darkMode: boolean;
  onClose: () => void;
};

export function PlanRelatedPassage({ reference, dayReference, dayNumber, translation, darkMode, onClose }: Props) {
  const { width } = useWindowDimensions();
  const [fullChapter, setFullChapter] = useState(false);
  const [retry, setRetry] = useState(0);
  const [passage, setPassage] = useState<BiblePassage | null>(null);
  const [error, setError] = useState(false);
  const chapter = expandPlanReadingReferences(reference)[0];
  const chapterReference = chapter ? `${chapter.book} ${chapter.chapter}` : "";
  const requestedReference = fullChapter && chapterReference ? chapterReference : reference;

  useEffect(() => {
    const controller = new AbortController();
    setPassage(null);
    setError(false);
    void fetchBiblePlanReadingPassage(requestedReference, translation, controller.signal)
      .then((loaded) => {
        if (!controller.signal.aborted) setPassage(loaded);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [requestedReference, translation, retry]);

  const ink = darkMode ? "#f2efeb" : "#172536";
  const muted = darkMode ? "#c4beb8" : "#53677e";
  const accent = darkMode ? "#d5a45f" : "#8d5528";
  const surface = darkMode ? "#292727" : "#ffffff";
  const border = darkMode ? "#4a3e31" : "#d7e1e9";

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, width < 600 && styles.phoneOverlay]}>
        <Pressable style={styles.scrim} accessibilityRole="button" accessibilityLabel="Back to plan reading" onPress={onClose} />
        <SafeAreaView accessibilityViewIsModal style={[styles.sheet, width < 600 && styles.phoneSheet, { backgroundColor: surface, borderColor: border }]}>
          <View style={[styles.header, { borderBottomColor: border }]}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Back to plan Day ${dayNumber}`} onPress={onClose} style={styles.backButton}>
              <Text style={[styles.backText, { color: accent }]}>‹ Back to Day {dayNumber}</Text>
            </Pressable>
            <Text style={[styles.eyebrow, { color: muted }]}>BIBLE READER · RELATED PASSAGE</Text>
          </View>
          <ScrollView key={requestedReference} contentContainerStyle={styles.content}>
            <Text accessibilityRole="header" style={[styles.title, { color: ink }]}>{requestedReference}</Text>
            <Text style={[styles.subtitle, { color: muted }]}>From the Go deeper section for {dayReference}</Text>
            {!!chapterReference && chapterReference !== reference && (
              <Pressable accessibilityRole="button" onPress={() => setFullChapter((current) => !current)} style={[styles.chapterButton, { borderColor: border }]}>
                <Text style={[styles.chapterButtonText, { color: ink }]}>{fullChapter ? `Show ${reference}` : `Read all of ${chapterReference}`}</Text>
              </Pressable>
            )}
            {error ? (
              <View style={styles.message}>
                <Text style={{ color: muted }}>This passage could not be loaded. Check your connection and try again.</Text>
                <Pressable accessibilityRole="button" onPress={() => setRetry((current) => current + 1)} style={[styles.chapterButton, { borderColor: border }]}>
                  <Text style={[styles.chapterButtonText, { color: ink }]}>Try again</Text>
                </Pressable>
              </View>
            ) : !passage ? (
              <Text style={[styles.message, { color: muted }]}>Loading passage…</Text>
            ) : (
              <>
                {passage.verses?.map((verse) => (
                  <View key={`${verse.book_name}-${verse.chapter}-${verse.verse}`} style={styles.verseRow}>
                    <Text style={[styles.verseNumber, { color: accent }]}>{verse.verse}</Text>
                    <Text style={[styles.verseText, { color: ink }]}>{verse.text}</Text>
                  </View>
                ))}
                <Text style={[styles.translation, { color: muted }]}>{passage.translation_name} · {passage.translation_note || "Public Domain"}</Text>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "rgba(12, 24, 38, 0.55)" },
  phoneOverlay: { padding: 0 },
  scrim: { ...StyleSheet.absoluteFillObject },
  sheet: { width: "100%", maxWidth: 780, maxHeight: "90%", minHeight: 340, borderWidth: 1, borderRadius: 20, overflow: "hidden" },
  phoneSheet: { maxWidth: "100%", maxHeight: "100%", flex: 1, borderRadius: 0, borderWidth: 0 },
  header: { paddingHorizontal: 22, paddingVertical: 16, borderBottomWidth: 1, gap: 6 },
  backButton: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  backText: { fontSize: 16, fontWeight: "700" },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 0.6 },
  content: { paddingHorizontal: 22, paddingVertical: 22, paddingBottom: 44 },
  title: { fontSize: 26, lineHeight: 33, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: 5, marginBottom: 18 },
  chapterButton: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, minHeight: 44, justifyContent: "center", marginBottom: 20 },
  chapterButtonText: { fontSize: 14, fontWeight: "700" },
  message: { marginTop: 18, gap: 14 },
  verseRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 17 },
  verseNumber: { width: 24, paddingTop: 2, fontSize: 14, fontWeight: "700" },
  verseText: { flex: 1, fontSize: 18, lineHeight: 29 },
  translation: { marginTop: 14, fontSize: 13 }
});
