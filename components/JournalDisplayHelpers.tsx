import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { createElement } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";

import { colors } from "@/components/ui";

const PASSAGE_MARKUP_OPTIONS = [
  { id: "notice", label: "Notice", background: "#dfead5", color: colors.oliveDark },
  { id: "question", label: "Question", background: "#f4dfb6", color: "#6d4b16" },
  { id: "truth", label: "Key truth", background: "#f5cfc5", color: "#783423" },
  { id: "apply", label: "Apply", background: "#d7e7eb", color: colors.blue }
];

function dateKeyFromTimestamp(value: number) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildJournalCalendarCells(monthStart: number, items: any[]) {
  const month = new Date(monthStart);
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.dateKey] = (acc[item.dateKey] || 0) + 1;
    return acc;
  }, {});

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dateKey = dateKeyFromTimestamp(date.getTime());
    return {
      dateKey,
      day: date.getDate(),
      inMonth: date.getMonth() === month.getMonth(),
      count: counts[dateKey] || 0
    };
  });
}

function sanitizeEditorHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

function richHtmlToMarkupText(text: string) {
  if (!/<\/?[a-z][\s\S]*>/i.test(text)) return text;

  return sanitizeEditorHtml(text)
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**")
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*")
    .replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, "__$1__")
    .replace(/<(mark)[^>]*>([\s\S]*?)<\/\1>/gi, "==$2==")
    .replace(/<span[^>]*(background-color|background)[^>]*>([\s\S]*?)<\/span>/gi, "==$2==")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|ul|ol)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderFormattedNoteSegments(text: string, styles: any) {
  const segments = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|==[^=]+==)/g).filter((segment) => segment.length > 0);

  return segments.map((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      return (
        <Text key={`${segment}-${index}`} style={styles.formattedBold}>
          {segment.slice(2, -2)}
        </Text>
      );
    }
    if (segment.startsWith("*") && segment.endsWith("*")) {
      return (
        <Text key={`${segment}-${index}`} style={styles.formattedItalic}>
          {segment.slice(1, -1)}
        </Text>
      );
    }
    if (segment.startsWith("__") && segment.endsWith("__")) {
      return (
        <Text key={`${segment}-${index}`} style={styles.formattedUnderline}>
          {segment.slice(2, -2)}
        </Text>
      );
    }
    if (segment.startsWith("==") && segment.endsWith("==")) {
      return (
        <Text key={`${segment}-${index}`} style={styles.formattedHighlight}>
          {segment.slice(2, -2)}
        </Text>
      );
    }
    return segment;
  });
}

function parseHighlightReflectionNote(note: string) {
  const parsed = {
    passage: "",
    highlights: "",
    keyInsight: "",
    prayer: "",
    nextStep: ""
  };

  note.split(/\n{2,}/).forEach((section) => {
    const [rawLabel, ...rest] = section.split(":");
    const value = rest.join(":").trim();
    const label = rawLabel.trim().toLowerCase();
    if (!value) return;

    if (label === "passage") parsed.passage = value;
    if (label === "highlights") parsed.highlights = value;
    if (label === "key insight") parsed.keyInsight = value;
    if (label === "prayer") parsed.prayer = value;
    if (label === "next step") parsed.nextStep = value;
  });

  return parsed;
}

function getMeditationAnswerIcon(title: string) {
  const normalized = title.trim().toLowerCase();
  if (normalized === "notice") return "eye-outline";
  if (normalized === "reflect") return "lightbulb-outline";
  if (normalized === "pray") return "hands-pray";
  if (normalized === "carry") return "book-account-outline";
  return "book-open-page-variant-outline";
}

export function CustomStudyReviewControl({ styles, value, onChange, onSchedule }: any) {
  return (
    <View style={styles.customReviewControl}>
      <Text style={styles.customReviewLabel}>Custom</Text>
      <TextInput
        accessibilityLabel="Custom review interval in days"
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        placeholder="14"
        style={styles.customReviewInput}
      />
      <Text style={styles.customReviewUnit}>days</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Set custom review interval" onPress={onSchedule} style={styles.addPromptButton}>
        <Text style={styles.addPromptText}>Set</Text>
      </Pressable>
    </View>
  );
}

export function FormattedNoteText({ styles, text, darkMode = false }: any) {
  if (!text.trim()) return null;
  const displayText = Platform.OS === "web" ? text : richHtmlToMarkupText(text);

  if (Platform.OS === "web" && /<\/?[a-z][\s\S]*>/i.test(displayText)) {
    return createElement("div", {
      style: {
        color: colors.ink,
        ...(darkMode ? { color: "#f7eddc" } : {}),
        fontSize: 15,
        lineHeight: "21px",
        marginBottom: 8
      },
      dangerouslySetInnerHTML: { __html: sanitizeEditorHtml(displayText) }
    });
  }

  return (
    <View style={styles.formattedNote}>
      {displayText.split("\n").map((line: string, index: number) => {
        const isBullet = line.trimStart().startsWith("- ");
        const content = isBullet ? line.trimStart().slice(2) : line;

        return (
          <View key={`${line}-${index}`} style={isBullet ? styles.formattedBulletRow : undefined}>
            {isBullet && <Text style={styles.formattedBullet}>•</Text>}
            <Text style={[styles.body, darkMode && styles.accountDarkText, isBullet && styles.formattedBulletText]}>{renderFormattedNoteSegments(content, styles)}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function JournalMeditationScripture({ styles, text, darkMode = false }: any) {
  const [referenceLine, ...verseLines] = text.split(/\n+/).map((line: string) => line.trim()).filter(Boolean);
  const verseText = verseLines.join(" ").trim() || text.trim();

  return (
    <View style={[styles.journalMeditationScriptureBox, darkMode && styles.journalDarkMeditationScriptureBox]}>
      <View style={styles.feedbackHeader}>
        <Ionicons name="book-outline" size={16} color={darkMode ? "#e9b76a" : colors.coral} />
        <Text style={[styles.lastCheckinLabel, darkMode && styles.studyDarkAccentText]}>Scripture</Text>
      </View>
      {!!referenceLine && <Text style={[styles.journalMeditationReference, darkMode && styles.accountDarkTitle]}>{referenceLine}</Text>}
      <Text style={[styles.journalMeditationVerseText, darkMode && styles.accountDarkText]}>{verseText}</Text>
    </View>
  );
}

export function JournalMeditationAnswer({ styles, title, text, darkMode = false }: any) {
  const icon = getMeditationAnswerIcon(title);
  const iconColor = darkMode ? "#e9b76a" : colors.coral;

  return (
    <View style={styles.journalMeditationAnswer}>
      <View style={styles.journalMeditationAnswerHeader}>
        <MaterialCommunityIcons name={icon as any} size={18} color={iconColor} />
        <Text style={[styles.journalMeditationAnswerTitle, darkMode && styles.studyDarkAccentText]}>{title}</Text>
      </View>
      <FormattedNoteText styles={styles} text={text} darkMode={darkMode} />
    </View>
  );
}

export function PassageMarkupSummary({ styles, markups, darkMode = false }: any) {
  if (!markups.length) return null;

  return (
    <View style={[styles.journalShareBox, darkMode && styles.accountDarkInsetBox]}>
      <Text style={[styles.lastCheckinLabel, darkMode && styles.studyDarkAccentText]}>Highlights</Text>
      <View style={styles.markupSummaryRow}>
        {markups.map((markup: any) => {
          const option = PASSAGE_MARKUP_OPTIONS.find((item) => item.id === markup.kind);

          return (
            <View key={markup.key} style={styles.markupSummaryItem}>
              <View style={[styles.markupSummaryChip, option && { backgroundColor: option.background }]}>
                <Text style={[styles.markupSummaryText, option && { color: option.color }]}>
                  {markup.reference} · {markup.label}
                </Text>
              </View>
              {!!markup.note && <Text style={[styles.markupSummaryNote, darkMode && styles.accountDarkText]}>{markup.note}</Text>}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function JournalCalendar({ styles, monthStart, items, selectedDateKey, onSelectDate, onPreviousMonth, onNextMonth, darkMode = false }: any) {
  const cells = buildJournalCalendarCells(monthStart, items);

  return (
    <View style={[styles.journalCalendarBox, darkMode && styles.accountDarkSection]}>
      <View style={styles.journalCalendarHeader}>
        <Pressable onPress={onPreviousMonth} style={[styles.calendarMonthButton, darkMode && styles.homeDarkIconBubble]}>
          <Ionicons name="chevron-back-outline" size={18} color={darkMode ? "#e9b76a" : colors.oliveDark} />
        </Pressable>
        <Text style={[styles.journalCalendarTitle, darkMode && styles.accountDarkTitle]}>
          {new Date(monthStart).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </Text>
        <Pressable onPress={onNextMonth} style={[styles.calendarMonthButton, darkMode && styles.homeDarkIconBubble]}>
          <Ionicons name="chevron-forward-outline" size={18} color={darkMode ? "#e9b76a" : colors.oliveDark} />
        </Pressable>
      </View>
      <View style={styles.calendarWeekdayRow}>
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <Text key={`${day}-${index}`} style={[styles.calendarWeekday, darkMode && styles.accountDarkMutedText]}>{day}</Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {cells.map((cell) => {
          const selected = selectedDateKey === cell.dateKey;
          return (
            <Pressable
              key={cell.dateKey}
              onPress={() => onSelectDate(selected ? "" : cell.dateKey)}
              style={[
                styles.calendarDayCell,
                darkMode && styles.journalDarkCalendarDayCell,
                !cell.inMonth && styles.inactiveCalendarDayCell,
                selected && styles.selectedCalendarDayCell,
                cell.count > 0 && !selected && styles.activeCalendarDayCell,
                darkMode && cell.count > 0 && !selected && styles.journalDarkActiveCalendarDayCell
              ]}
            >
              <Text style={[styles.calendarDayNumber, darkMode && styles.accountDarkText, selected && styles.selectedCalendarDayNumber, !cell.inMonth && styles.inactiveCalendarDayNumber]}>
                {cell.day}
              </Text>
              {cell.count > 0 && (
                <Text style={[styles.calendarEntryCount, selected && styles.selectedCalendarEntryCount]}>
                  {cell.count}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function JournalScriptureBrowser({ styles, sections, expandedBook, selectedBook, selectedChapter, onToggleBook, onSelectChapter, darkMode = false }: any) {
  const activeBookSet = new Set(sections.flatMap((section: any) => section.books.map((item: any) => item.book)));

  return (
    <View style={[styles.journalScriptureBox, darkMode && styles.accountDarkSection]}>
      {sections.length === 0 ? (
        <View style={styles.emptyJournalScriptureBox}>
          <Ionicons name="book-outline" size={22} color={colors.coral} />
          <Text style={[styles.emptyJournalTitle, darkMode && styles.accountDarkTitle]}>No passage entries yet</Text>
          <Text style={[styles.emptyJournalText, darkMode && styles.accountDarkMutedText]}>Saved studies, drafts, and highlights with scripture references will appear here.</Text>
        </View>
      ) : (
        sections.map((section: any) => (
          <View key={section.title} style={styles.journalScriptureSection}>
            <Text style={[styles.readerBookSectionTitle, darkMode && styles.studyDarkAccentText]}>{section.title}</Text>
            <View style={styles.desktopReaderBookList}>
              {section.books.map(({ book, chapters }: any) => {
                const expanded = expandedBook === book;
                const selected = selectedBook === book;
                return (
                  <View key={book} style={[styles.desktopReaderBookBlock, expanded && styles.expandedDesktopReaderBookBlock]}>
                    <Pressable
                      onPress={() => onToggleBook(book)}
                      style={[
                        styles.readerBookChip,
                        darkMode && styles.printDarkOptionChip,
                        activeBookSet.has(book) && styles.journalScriptureActiveBookChip,
                        darkMode && activeBookSet.has(book) && styles.journalDarkScriptureActiveBookChip,
                        selected && styles.activeReaderBookChip
                      ]}
                    >
                      <Text style={[styles.readerBookText, darkMode && styles.accountDarkMutedText, selected && styles.activeReaderBookText]}>{book}</Text>
                    </Pressable>
                    {expanded && (
                      <View style={[styles.desktopReaderChapterPanel, darkMode && styles.accountDarkInsetBox]}>
                        <View style={styles.desktopReaderChapterHeader}>
                          <Text style={[styles.readerBookSectionTitle, darkMode && styles.studyDarkAccentText]}>{book}</Text>
                          <Text style={[styles.readerChapterCountText, darkMode && styles.accountDarkMutedText]}>{`${chapters.length} chapter${chapters.length === 1 ? "" : "s"}`}</Text>
                        </View>
                        <View style={styles.desktopReaderChapterGrid}>
                          {chapters.map(({ chapter, entryCount, verseCount }: any) => {
                            const chapterSelected = selectedBook === book && selectedChapter === chapter;
                            return (
                              <Pressable
                                key={`${book}-${chapter}`}
                                onPress={() => onSelectChapter(book, chapter)}
                                style={[styles.journalScriptureChapterSquare, darkMode && styles.printDarkOptionChip, chapterSelected && styles.activeMobileReaderChapterSquare]}
                              >
                                <Text style={[styles.mobileReaderChapterText, darkMode && styles.accountDarkMutedText, chapterSelected && styles.activeMobileReaderChapterText]}>{chapter}</Text>
                                <Text style={[styles.journalScriptureChapterCount, chapterSelected && styles.activeMobileReaderChapterText]}>
                                  {verseCount > 0 ? `${verseCount}v` : `${entryCount}e`}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

export function HighlightReflectionSummary({ styles, note, darkMode = false }: any) {
  const reflection = parseHighlightReflectionNote(note);
  const sections = [
    ["Key insight", reflection.keyInsight],
    ["Prayer", reflection.prayer],
    ["Next step", reflection.nextStep]
  ].filter(([, value]) => value);

  if (!reflection.passage && !reflection.highlights && sections.length === 0) {
    return <Text style={[styles.body, darkMode && styles.accountDarkText]}>{note || "No note added."}</Text>;
  }

  return (
    <View style={[styles.reflectionSummaryBox, darkMode && styles.accountDarkInsetBox]}>
      <View style={styles.reflectionSummaryHeader}>
        <Ionicons name="sparkles-outline" size={18} color={colors.coral} />
        <Text style={[styles.lastCheckinLabel, darkMode && styles.studyDarkAccentText]}>Reflection</Text>
      </View>
      {!!reflection.passage && (
        <View style={styles.reflectionSummarySection}>
          <Text style={styles.reflectionSummaryLabel}>Passage</Text>
          <Text style={[styles.body, darkMode && styles.accountDarkText]}>{reflection.passage}</Text>
        </View>
      )}
      {!!reflection.highlights && (
        <View style={styles.reflectionSummarySection}>
          <Text style={styles.reflectionSummaryLabel}>Highlights</Text>
          <Text style={[styles.body, darkMode && styles.accountDarkText]}>{reflection.highlights}</Text>
        </View>
      )}
      {sections.map(([label, value]) => (
        <View key={label} style={styles.reflectionSummarySection}>
          <Text style={styles.reflectionSummaryLabel}>{label}</Text>
          <Text style={[styles.body, darkMode && styles.accountDarkText]}>{value}</Text>
        </View>
      ))}
    </View>
  );
}
