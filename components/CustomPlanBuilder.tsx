import Ionicons from "@expo/vector-icons/Ionicons";
import { createElement, useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { BIBLE_CHAPTER_COUNTS, NEW_TESTAMENT_BOOKS, OLD_TESTAMENT_BOOKS, displayBibleBookName, normalizeBibleBookName } from "@/data/bibleLibrary";
import { fetchBsbPassage } from "@/data/biblePassage";
import { normalizeCustomPlanReference } from "@/data/customPlanReference";
import { AppButton, colors } from "@/components/ui";

type Props = {
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  references: string[];
  onReferencesChange: (references: string[]) => void;
  onCreate: (references: string[]) => void;
  onCancel: () => void;
  darkMode: boolean;
  phoneLayout: boolean;
};

export function CustomPlanBuilder({ title, onTitleChange, description, onDescriptionChange, references, onReferencesChange, onCreate, onCancel, darkMode, phoneLayout }: Props) {
  const [draft, setDraft] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [titleError, setTitleError] = useState("");
  const [browserOpen, setBrowserOpen] = useState(false);
  const [testament, setTestament] = useState<"old" | "new">("new");
  const [bookSearch, setBookSearch] = useState("");
  const [bookListOpen, setBookListOpen] = useState(false);
  const [book, setBook] = useState("John");
  const [chapter, setChapter] = useState(1);
  const [useVerseRange, setUseVerseRange] = useState(false);
  const [startVerse, setStartVerse] = useState("1");
  const [endVerse, setEndVerse] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [previewStatus, setPreviewStatus] = useState<"loading" | "ready" | "error">("loading");
  const dragRef = useRef<{ startY: number; fromIndex: number; row: HTMLElement } | null>(null);
  const textColor = darkMode ? "#f6f2ed" : colors.ink;
  const mutedColor = darkMode ? "#b8b3ac" : colors.muted;
  const accentColor = darkMode ? "#d4a768" : colors.coral;
  const borderColor = darkMode ? "#57534d" : colors.line;
  const surfaceColor = darkMode ? "#242424" : colors.panel;
  const softColor = darkMode ? "#30383d" : colors.soft;
  const books = (testament === "old" ? OLD_TESTAMENT_BOOKS : NEW_TESTAMENT_BOOKS).filter((item) => item.toLowerCase().includes(bookSearch.trim().toLowerCase()));
  const chapterCount = BIBLE_CHAPTER_COUNTS[book] || 1;
  const chosenReference = `${normalizeBibleBookName(book)} ${chapter}${useVerseRange ? `:${startVerse.trim()}${endVerse.trim() ? `-${endVerse.trim()}` : ""}` : ""}`;

  useEffect(() => {
    if (!browserOpen || !normalizeCustomPlanReference(chosenReference)) {
      setPreviewText("");
      setPreviewStatus("error");
      return;
    }
    const controller = new AbortController();
    setPreviewStatus("loading");
    fetchBsbPassage(chosenReference, controller.signal)
      .then((passage) => {
        const firstVerse = passage.verses?.[0];
        setPreviewText(firstVerse ? `${firstVerse.verse}  ${firstVerse.text}` : "");
        setPreviewStatus(firstVerse ? "ready" : "error");
      })
      .catch(() => { if (!controller.signal.aborted) setPreviewStatus("error"); });
    return () => controller.abort();
  }, [browserOpen, chosenReference]);

  function addReference(value: string) {
    const normalized = normalizeCustomPlanReference(value);
    if (!normalized) {
      setError("Enter a valid book, chapter, or verse range, such as John 2:1-12.");
      return false;
    }
    if (editingIndex === null) onReferencesChange([...references, normalized]);
    else onReferencesChange(references.map((item, index) => index === editingIndex ? normalized : item));
    setDraft("");
    setEditingIndex(null);
    setError("");
    return true;
  }

  function createPlan() {
    if (!title.trim()) {
      setTitleError("Add a plan title first.");
      return;
    }
    const pending = draft.trim();
    if (!pending) {
      if (!references.length) {
        setError("Add at least one daily reading before creating your plan.");
        return;
      }
      onCreate(references);
      return;
    }
    const normalized = normalizeCustomPlanReference(pending);
    if (!normalized) {
      setError("Check the passage before creating your plan.");
      return;
    }
    const nextReferences = editingIndex === null
      ? [...references, normalized]
      : references.map((item, index) => index === editingIndex ? normalized : item);
    onCreate(nextReferences);
  }

  function moveReference(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= references.length) return;
    const next = [...references];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onReferencesChange(next);
    if (editingIndex === index) setEditingIndex(nextIndex);
    else if (editingIndex === nextIndex) setEditingIndex(index);
  }

  function dragHandle(index: number) {
    if (Platform.OS !== "web") return null;
    const finish = (event: any) => {
      const drag = dragRef.current;
      if (!drag) return;
      const distance = event.clientY - drag.startY;
      const rowHeight = drag.row.getBoundingClientRect().height + 10;
      const nextIndex = Math.max(0, Math.min(references.length - 1, drag.fromIndex + Math.round(distance / rowHeight)));
      drag.row.style.transform = "";
      drag.row.style.zIndex = "";
      drag.row.style.boxShadow = "";
      dragRef.current = null;
      if (nextIndex !== drag.fromIndex) {
        const next = [...references];
        const [item] = next.splice(drag.fromIndex, 1);
        next.splice(nextIndex, 0, item);
        onReferencesChange(next);
      }
    };
    return createElement("div", {
      role: "button",
      tabIndex: 0,
      "aria-label": `Drag Day ${index + 1} to reorder`,
      onPointerDown: (event: any) => {
        const row = event.currentTarget.closest("[data-plan-day]") as HTMLElement | null;
        if (!row) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = { startY: event.clientY, fromIndex: index, row };
        row.style.zIndex = "2";
        row.style.boxShadow = "0 10px 24px rgba(23,37,54,.18)";
      },
      onPointerMove: (event: any) => {
        const drag = dragRef.current;
        if (drag?.fromIndex === index) drag.row.style.transform = `translateY(${event.clientY - drag.startY}px)`;
      },
      onPointerUp: finish,
      onPointerCancel: finish,
      onKeyDown: (event: any) => {
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          event.preventDefault();
          moveReference(index, event.key === "ArrowUp" ? -1 : 1);
        }
      },
      style: { width: 36, height: 40, display: "flex", alignItems: "center", justifyContent: "center", touchAction: "none", cursor: "grab", color: accentColor },
      children: createElement(Ionicons, { name: "reorder-three-outline", size: 22, color: accentColor })
    });
  }

  function chooseBook(nextBook: string) {
    setBook(nextBook);
    setChapter(1);
    setError("");
    setBookListOpen(false);
  }

  return (
    <View style={s.root}>
      <Text style={[s.heading, { color: textColor }]}>{browserOpen ? "Choose readings from the Bible" : "Build your reading plan"}</Text>
      <Text style={[s.intro, { color: mutedColor }]}>{browserOpen ? "Browse a book, choose a chapter or verse range, then add it to your plan." : "Choose one passage for each day. You can change the order before creating the plan."}</Text>
      {!browserOpen && <>
      <TextInput accessibilityLabel="Custom reading plan title" value={title} onChangeText={(value) => { onTitleChange(value); setTitleError(""); }} placeholder="Plan title" placeholderTextColor={mutedColor} style={[s.input, { color: textColor, backgroundColor: surfaceColor, borderColor }]} />
      {!!titleError && <Text accessibilityRole="alert" style={[s.error, { color: accentColor }]}>{titleError}</Text>}
      <TextInput accessibilityLabel="Custom reading plan description" value={description} onChangeText={onDescriptionChange} placeholder="Optional description" placeholderTextColor={mutedColor} style={[s.input, { color: textColor, backgroundColor: surfaceColor, borderColor }]} />

      <Text style={[s.sectionTitle, { color: accentColor }]}>DAILY READINGS{references.length ? ` · ${references.length}` : ""}</Text>
      {references.map((reference, index) => (
        <View key={`${index}:${reference}`} {...(Platform.OS === "web" ? { dataSet: { planDay: String(index) } } : {})} style={[s.dayCard, phoneLayout && s.dayCardPhone, { borderColor, backgroundColor: surfaceColor }]}>
          <View style={s.dayMain}><View style={[s.dayNumber, { backgroundColor: softColor }]}><Text style={[s.dayNumberText, { color: textColor }]}>{index + 1}</Text></View>
            <View style={s.dayDetails}><Text style={[s.dayLabel, { color: textColor }]}>Day {index + 1}</Text><Text style={[s.reference, { color: mutedColor }]}>{reference}</Text></View></View>
          <View style={[s.dayActions, phoneLayout && s.dayActionsPhone]}>
            {Platform.OS === "web" ? dragHandle(index) : <><Pressable accessibilityRole="button" accessibilityLabel={`Move Day ${index + 1} earlier`} disabled={index === 0} onPress={() => moveReference(index, -1)} style={s.iconButton}><Ionicons name="arrow-up-outline" size={19} color={index === 0 ? mutedColor : accentColor} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Move Day ${index + 1} later`} disabled={index === references.length - 1} onPress={() => moveReference(index, 1)} style={s.iconButton}><Ionicons name="arrow-down-outline" size={19} color={index === references.length - 1 ? mutedColor : accentColor} /></Pressable></>}
            <Pressable accessibilityRole="button" accessibilityLabel={`Edit Day ${index + 1}`} onPress={() => { setDraft(reference); setEditingIndex(index); setError(""); }} style={s.iconButton}><Ionicons name="pencil-outline" size={19} color={accentColor} /></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove Day ${index + 1}`} onPress={() => { onReferencesChange(references.filter((_, itemIndex) => itemIndex !== index)); if (editingIndex === index) { setEditingIndex(null); setDraft(""); } }} style={s.iconButton}><Ionicons name="close-outline" size={21} color={accentColor} /></Pressable>
          </View>
        </View>
      ))}
      {references.length === 0 && <Text style={[s.empty, { color: mutedColor, borderColor }]}>No readings yet. Type a reference or browse the Bible to add Day 1.</Text>}

      <View style={[s.addRow, phoneLayout && s.addRowPhone]}>
        <TextInput accessibilityLabel={editingIndex === null ? "Add a daily reading" : `Edit Day ${editingIndex + 1} reading`} value={draft} onChangeText={(value) => { setDraft(value); setError(""); }} onSubmitEditing={() => addReference(draft)} placeholder="Type a passage, e.g. John 2:1-12" placeholderTextColor={mutedColor} style={[s.input, s.addInput, { color: textColor, backgroundColor: surfaceColor, borderColor }]} />
        <AppButton label={editingIndex === null ? "Add day" : "Save day"} onPress={() => addReference(draft)} style={phoneLayout && s.phoneButton} />
        <AppButton label="Browse Bible" variant="secondary" onPress={() => { setBrowserOpen(true); setEditingIndex(null); setDraft(""); setError(""); }} style={[phoneLayout && s.phoneButton, { borderColor }]} labelStyle={{ color: textColor }} />
      </View>
      {!!error && <Text accessibilityRole="alert" style={[s.error, { color: accentColor }]}>{error}</Text>}
      </>}

      {browserOpen && <>
        <View style={[s.browserColumns, phoneLayout && s.browserColumnsPhone]}>
        <View style={[s.browserPane, phoneLayout && s.browserPanePhone, { borderColor, backgroundColor: surfaceColor }]}>
        <Text style={[s.browserTitle, { color: textColor }]}>Select a passage</Text>
        <View style={s.tabs}>
          <Pressable accessibilityRole="button" accessibilityLabel="Switch Testament" onPress={() => { const next = testament === "new" ? "old" : "new"; setTestament(next); setBook(next === "old" ? "Genesis" : "Matthew"); setChapter(1); setBookSearch(""); setBookListOpen(false); }} style={[s.pickerSelect, { borderColor }]}><Text style={[s.pickerSelectText, { color: textColor }]}>{testament === "old" ? "Old Testament" : "New Testament"} ▾</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Choose Bible book" accessibilityState={{ expanded: bookListOpen }} onPress={() => setBookListOpen((open) => !open)} style={[s.pickerSelect, { borderColor }]}><Text style={[s.pickerSelectText, { color: textColor }]}>{displayBibleBookName(book)} ▾</Text></Pressable>
        </View>
        {bookListOpen && <><TextInput accessibilityLabel="Search Bible books" value={bookSearch} onChangeText={setBookSearch} placeholder="Find a Bible book" placeholderTextColor={mutedColor} style={[s.input, { color: textColor, backgroundColor: surfaceColor, borderColor }]} />
        <ScrollView style={s.bookList} contentContainerStyle={s.chipGrid} nestedScrollEnabled keyboardShouldPersistTaps="handled">
          {books.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: book === item }} onPress={() => chooseBook(item)} style={[s.chip, { borderColor, backgroundColor: book === item ? (darkMode ? "#8b531f" : "#234b70") : surfaceColor }]}><Text style={{ color: book === item ? "#fff" : textColor, fontWeight: "600" }}>{displayBibleBookName(item)}</Text></Pressable>)}
        </ScrollView></>}
        <Text style={[s.subheading, { color: textColor }]}>{displayBibleBookName(book)} · choose a chapter</Text>
        <ScrollView style={[s.chapterList, { height: Math.min(164, Math.ceil(chapterCount / (phoneLayout ? 5 : 8)) * 49 + 6) }]} contentContainerStyle={s.chapterGrid} nestedScrollEnabled keyboardShouldPersistTaps="handled">
          {Array.from({ length: chapterCount }, (_, index) => index + 1).map((item) => <Pressable key={item} accessibilityRole="button" accessibilityLabel={`${displayBibleBookName(book)} chapter ${item}`} accessibilityState={{ selected: chapter === item }} onPress={() => setChapter(item)} style={[s.chapter, { borderColor, backgroundColor: chapter === item ? (darkMode ? "#8b531f" : "#234b70") : surfaceColor }]}><Text style={{ color: chapter === item ? "#fff" : textColor, fontWeight: "700" }}>{item}</Text></Pressable>)}
        </ScrollView>
        <View style={s.rangeRow}>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: !useVerseRange }} onPress={() => setUseVerseRange(false)} style={[s.tab, { borderColor }, !useVerseRange && { backgroundColor: darkMode ? "#8b531f" : "#234b70" }]}><Text style={{ color: !useVerseRange ? "#fff" : textColor }}>Whole chapter</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: useVerseRange }} onPress={() => setUseVerseRange(true)} style={[s.tab, { borderColor }, useVerseRange && { backgroundColor: darkMode ? "#8b531f" : "#234b70" }]}><Text style={{ color: useVerseRange ? "#fff" : textColor }}>Verse range</Text></Pressable>
          {useVerseRange && <><TextInput accessibilityLabel="Start verse" value={startVerse} onChangeText={setStartVerse} keyboardType="number-pad" placeholder="From" placeholderTextColor={mutedColor} style={[s.verseInput, { color: textColor, backgroundColor: surfaceColor, borderColor }]} /><Text style={{ color: mutedColor }}>–</Text><TextInput accessibilityLabel="End verse, optional" value={endVerse} onChangeText={setEndVerse} keyboardType="number-pad" placeholder="To" placeholderTextColor={mutedColor} style={[s.verseInput, { color: textColor, backgroundColor: surfaceColor, borderColor }]} /></>}
        </View>
        <View style={[s.passagePreview, { backgroundColor: softColor }]}><Text style={[s.selectedReference, { color: textColor }]}>{chosenReference}</Text><Text style={[s.previewText, { color: mutedColor }]}>{previewStatus === "ready" ? `${previewText.slice(0, 240)}${previewText.length > 240 ? "…" : ""}` : previewStatus === "loading" ? "Loading passage preview…" : "Preview unavailable. Check the reference before adding it."}</Text></View>
        </View>
        <View style={[s.browserPane, phoneLayout && s.browserPanePhone, { borderColor, backgroundColor: surfaceColor }]}>
          <View style={s.browserHeadingRow}><Text style={[s.browserTitle, { color: textColor }]}>Your plan</Text><Text style={{ color: mutedColor }}>{references.length} {references.length === 1 ? "day" : "days"}</Text></View>
          <ScrollView style={s.planSummary} nestedScrollEnabled>{references.map((reference, index) => <View key={`${index}:${reference}`} style={[s.summaryDay, { borderColor }]}><Text style={[s.summaryNumber, { color: textColor }]}>Day {index + 1}</Text><Text style={{ color: mutedColor }}>{reference}</Text></View>)}</ScrollView>
          {references.length === 0 && <Text style={[s.empty, { color: mutedColor, borderColor }]}>Your selected readings will appear here.</Text>}
          <AppButton label={`Add ${chosenReference} as Day ${references.length + 1}`} onPress={() => addReference(chosenReference)} />
          <Text style={[s.browserHint, { color: mutedColor }]}>Review the order and name your plan before saving.</Text>
          {!!error && <Text accessibilityRole="alert" style={[s.error, { color: accentColor }]}>{error}</Text>}
        </View>
        </View>
        <View style={[s.footer, phoneLayout && s.footerPhone]}><AppButton label="Back" variant="secondary" onPress={() => setBrowserOpen(false)} style={[phoneLayout && s.phoneButton, { borderColor }]} labelStyle={{ color: textColor }} /><AppButton label="Review plan" onPress={() => setBrowserOpen(false)} style={phoneLayout && s.phoneButton} /></View>
      </>}

      {!browserOpen && <View style={[s.footer, phoneLayout && s.footerPhone]}><AppButton label="Cancel" variant="secondary" onPress={onCancel} style={[phoneLayout && s.phoneButton, { borderColor }]} labelStyle={{ color: textColor }} /><AppButton label="Create plan" onPress={createPlan} style={phoneLayout && s.phoneButton} /></View>}
    </View>
  );
}

const s = StyleSheet.create({
  root: { gap: 12, minWidth: 0 }, heading: { fontSize: 22, fontWeight: "800" }, intro: { fontSize: 15, lineHeight: 22, marginBottom: 4 }, input: { borderWidth: 1, borderRadius: 11, minHeight: 48, paddingHorizontal: 14, fontSize: 16, minWidth: 0 }, sectionTitle: { fontSize: 14, fontWeight: "800", letterSpacing: 0.5, marginTop: 10 }, dayCard: { borderWidth: 1, borderRadius: 12, padding: 11, flexDirection: "row", alignItems: "center", gap: 10, minWidth: 0, position: "relative" }, dayCardPhone: { flexWrap: "wrap" }, dayMain: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 10 }, dayNumber: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" }, dayNumberText: { fontWeight: "800" }, dayDetails: { flex: 1, minWidth: 0 }, dayLabel: { fontSize: 14, fontWeight: "800" }, reference: { fontSize: 14, marginTop: 2 }, dayActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end" }, dayActionsPhone: { width: "100%" }, iconButton: { minWidth: 32, minHeight: 36, alignItems: "center", justifyContent: "center" }, empty: { borderWidth: 1, borderStyle: "dashed", borderRadius: 11, padding: 16, fontSize: 14 }, addRow: { flexDirection: "row", alignItems: "center", gap: 8 }, addRowPhone: { flexWrap: "wrap" }, addInput: { flex: 1, minWidth: 200 }, phoneButton: { flexGrow: 1 }, error: { fontSize: 14, fontWeight: "700" }, browserTitle: { fontSize: 18, fontWeight: "800" }, tabs: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, tab: { minHeight: 38, borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" }, bookList: { maxHeight: 148 }, chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7, paddingBottom: 5 }, chip: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 11, minHeight: 38, justifyContent: "center" }, subheading: { fontSize: 15, fontWeight: "700" }, chapterList: { maxHeight: 164 }, chapterGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7, paddingBottom: 5 }, chapter: { width: 44, height: 42, borderWidth: 1, borderRadius: 8, alignItems: "center", justifyContent: "center" }, rangeRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }, verseInput: { borderWidth: 1, borderRadius: 8, width: 70, minHeight: 38, paddingHorizontal: 9, fontSize: 15 }, selectedReference: { fontSize: 16, fontWeight: "800" }, footer: { flexDirection: "row", justifyContent: "flex-end", gap: 9, marginTop: 12 }, footerPhone: { flexWrap: "wrap" },
  browserColumns: { flexDirection: "row", gap: 14, alignItems: "flex-start", minWidth: 0 },
  browserColumnsPhone: { flexDirection: "column" },
  browserPane: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 16, gap: 13, minWidth: 0 },
  browserPanePhone: { flex: 0, width: "100%" },
  pickerSelect: { borderWidth: 1, borderRadius: 9, minHeight: 42, paddingHorizontal: 12, justifyContent: "center" },
  pickerSelectText: { fontWeight: "700" },
  passagePreview: { padding: 15, borderRadius: 10, gap: 7, minHeight: 85 },
  previewText: { fontSize: 14, lineHeight: 20 },
  browserHeadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  planSummary: { maxHeight: 230 },
  summaryDay: { borderBottomWidth: 1, paddingVertical: 12, gap: 3 },
  summaryNumber: { fontWeight: "800", fontSize: 14 },
  browserHint: { fontSize: 13, lineHeight: 19 }
});
