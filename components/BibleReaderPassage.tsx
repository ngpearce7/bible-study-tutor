import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";
import { type BiblePassage, type BibleVerse } from "@/data/biblePassage";
import { colors } from "@/components/ui";

type BibleReaderPassageProps = {
  styles: any;
  darkMode: boolean;
  phoneLayout: boolean;
  passage: BiblePassage | null;
  status: string;
  memoryStatus: string;
  selectedVerses: number[];
  activeActionVerse: number;
  readerReference: string;
  memoryVerseKeys: Set<string>;
  matchesActiveReadingPlanDay: boolean;
  activeReadingPlanDay?: { reference: string } | null;
  activeReadingPlanDayCompleted?: boolean;
  planReadingMode?: boolean;
  currentSelectionBookmarked: boolean;
  currentSelectionBookmark?: { note?: string } | null;
  selectedVersesAlreadyInMemory: boolean;
  currentChapterRead: boolean;
  onPassageLayout: (event: any) => void;
  onVerseLayout: (verseNumber: number, event: any) => void;
  onToggleVerse: (verseNumber: number) => void;
  onOpenStudy: () => void;
  onBookmarkSelection: () => void;
  onOpenNote: () => void;
  onPrintWorksheet: () => void;
  onSaveMemory: () => void;
  onClearSelection: () => void;
  onMoveChapter: (direction: -1 | 1) => void;
  onToggleChapterRead: () => void;
  onMarkActiveReadingPlanDayComplete: () => void;
  onExitPlanReading: () => void;
  isVerseBookmarked: (verseNumber: number) => boolean;
  isVerseNoted: (verseNumber: number) => boolean;
};

function verseKey(verse: BibleVerse) {
  return `${verse.book_name}:${verse.chapter}:${verse.verse}`;
}

export function BibleReaderPassage({
  styles,
  darkMode,
  phoneLayout,
  passage,
  status,
  memoryStatus,
  selectedVerses,
  activeActionVerse,
  readerReference,
  memoryVerseKeys,
  matchesActiveReadingPlanDay,
  activeReadingPlanDay,
  activeReadingPlanDayCompleted,
  planReadingMode,
  currentSelectionBookmarked,
  currentSelectionBookmark,
  selectedVersesAlreadyInMemory,
  currentChapterRead,
  onPassageLayout,
  onVerseLayout,
  onToggleVerse,
  onOpenStudy,
  onBookmarkSelection,
  onOpenNote,
  onPrintWorksheet,
  onSaveMemory,
  onClearSelection,
  onMoveChapter,
  onToggleChapterRead,
  onMarkActiveReadingPlanDayComplete,
  onExitPlanReading,
  isVerseBookmarked,
  isVerseNoted
}: BibleReaderPassageProps) {
  if (!passage?.verses?.length) {
    return (
      <>
        <View style={styles.passageStatusBox}>
          <Text style={[styles.muted, darkMode && styles.accountDarkMutedText]}>{status}</Text>
        </View>
        {!!memoryStatus && <Text style={styles.saveStatus}>{memoryStatus}</Text>}
      </>
    );
  }

  const multiChapterPlanReading = !!planReadingMode && new Set(passage.verses.map((verse) => `${verse.book_name}:${verse.chapter}`)).size > 1;

  return (
    <>
      <View
        onLayout={onPassageLayout}
        style={[
          styles.readerPassageBox,
          phoneLayout && styles.phoneReaderPassageBox,
          phoneLayout && selectedVerses.length > 0 && styles.phoneReaderPassageWithSelectionDock,
          darkMode && styles.accountDarkInsetBox
        ]}
      >
        {multiChapterPlanReading && (
          <View style={[styles.readerSelectionBar, darkMode && styles.accountDarkSection]}>
            <Ionicons name="information-circle-outline" size={16} color={darkMode ? "#e9b76a" : colors.oliveDark} />
            <Text style={[styles.readerSelectionText, darkMode && styles.accountDarkTitle]}>Multi-chapter plan reading. Verse selection is available again when you exit plan reading mode.</Text>
          </View>
        )}
        {passage.verses.map((verse) => {
          const selectionDisabled = multiChapterPlanReading;
          const selected = !selectionDisabled && selectedVerses.includes(verse.verse);
          return (
            <View
              key={`${verse.chapter}-${verse.verse}`}
              onLayout={(event) => onVerseLayout(verse.verse, event)}
            >
              <Pressable
                onPress={() => {
                  if (!selectionDisabled) onToggleVerse(verse.verse);
                }}
                style={[
                  styles.readerVerseRow,
                  phoneLayout && styles.phoneReaderVerseRow,
                  darkMode && styles.bibleDarkVerseRow,
                  selected && styles.selectedReaderVerseRow,
                  phoneLayout && selected && styles.phoneSelectedReaderVerseRow
                ]}
              >
                <Text style={[styles.readerVerseNumber, phoneLayout && styles.phoneReaderVerseNumber]}>{verse.verse}</Text>
                <Text style={[styles.readerVerseText, phoneLayout && styles.phoneReaderVerseText, darkMode && !selected && styles.accountDarkText]}>{verse.text}</Text>
                <View style={[styles.readerVerseIconRow, phoneLayout && styles.phoneReaderVerseIconRow]}>
                  {memoryVerseKeys.has(verseKey(verse)) && (
                    <Ionicons name="sparkles" size={15} color={colors.coral} />
                  )}
                  {isVerseBookmarked(verse.verse) && (
                    <Ionicons name="bookmark" size={15} color={colors.coral} />
                  )}
                  {isVerseNoted(verse.verse) && (
                    <Ionicons name="document-text" size={15} color={darkMode ? "#e9b76a" : colors.oliveDark} />
                  )}
                </View>
              </Pressable>

              {!phoneLayout && selectedVerses.length > 0 && verse.verse === activeActionVerse && (
                <View style={[styles.inlineReaderActionBar, darkMode && styles.studyDarkFloatingBar]}>
                  <Text style={[styles.readerSelectionText, darkMode && styles.accountDarkTitle]}>{readerReference}</Text>
                  <View style={styles.inlineReaderActions}>
                    <Pressable onPress={onOpenStudy} style={styles.inlineReaderStudyButton}>
                      <Text style={styles.inlineReaderStudyText}>Study selected</Text>
                    </Pressable>
                    <Pressable
                      onPress={onBookmarkSelection}
                      style={[styles.inlineReaderBookmarkButton, darkMode && styles.homeDarkResumeButton, currentSelectionBookmarked && styles.activeReaderBookmarkButton]}
                    >
                      <Ionicons name={currentSelectionBookmarked ? "bookmark" : "bookmark-outline"} size={14} color={currentSelectionBookmarked ? "white" : (darkMode ? "#e9b76a" : colors.oliveDark)} />
                      <Text style={[styles.inlineReaderBookmarkText, darkMode && styles.homeDarkResumeButtonText, currentSelectionBookmarked && styles.activeReaderReadButtonText]}>
                        {currentSelectionBookmarked ? "Bookmarked" : "Bookmark"}
                      </Text>
                    </Pressable>
                    <Pressable onPress={onOpenNote} style={[styles.inlineReaderBookmarkButton, darkMode && styles.homeDarkResumeButton, currentSelectionBookmark?.note?.trim() && styles.activeBookmarkNoteButton]}>
                      <Ionicons name={currentSelectionBookmark?.note?.trim() ? "document-text" : "document-text-outline"} size={14} color={currentSelectionBookmark?.note?.trim() ? "white" : (darkMode ? "#e9b76a" : colors.oliveDark)} />
                      <Text style={[styles.inlineReaderBookmarkText, darkMode && styles.homeDarkResumeButtonText, currentSelectionBookmark?.note?.trim() && styles.activeReaderReadButtonText]}>Note</Text>
                    </Pressable>
                    <Pressable onPress={onPrintWorksheet} style={[styles.inlineReaderBookmarkButton, darkMode && styles.homeDarkResumeButton]}>
                      <Ionicons name="print-outline" size={14} color={darkMode ? "#e9b76a" : colors.oliveDark} />
                      <Text style={[styles.inlineReaderBookmarkText, darkMode && styles.homeDarkResumeButtonText]}>Print</Text>
                    </Pressable>
                    <Pressable onPress={onSaveMemory} style={[styles.inlineReaderBookmarkButton, styles.memoryReaderButton, selectedVersesAlreadyInMemory && styles.savedMemoryButton]}>
                      <Ionicons name="sparkles-outline" size={14} color="white" />
                      <Text style={styles.memoryReaderButtonText}>{selectedVersesAlreadyInMemory ? "In Memory" : "Memory"}</Text>
                    </Pressable>
                    <Pressable onPress={onClearSelection} style={[styles.clearMarkupButton, darkMode && styles.homeDarkResumeButton]}>
                      <Text style={[styles.clearMarkupText, darkMode && styles.homeDarkResumeButtonText]}>Clear</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {matchesActiveReadingPlanDay && activeReadingPlanDay && (
          <View style={[styles.readerPlanCompletionBox, darkMode && styles.accountDarkSection]}>
            <View style={styles.readerPlanCompletionCopy}>
              <Text style={[styles.readerBookSectionTitle, darkMode && styles.studyDarkAccentText]}>Reading plan</Text>
              <Text style={[styles.muted, darkMode && styles.accountDarkMutedText]}>
                {activeReadingPlanDayCompleted ? `${activeReadingPlanDay.reference} is complete.` : activeReadingPlanDay.reference}
                {planReadingMode && !activeReadingPlanDayCompleted ? " Only this plan reading is shown." : ""}
              </Text>
            </View>
            <View style={styles.inlineReaderActions}>
              {planReadingMode && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Exit plan reading mode"
                  onPress={onExitPlanReading}
                  style={[styles.inlineReaderBookmarkButton, darkMode && styles.homeDarkResumeButton]}
                >
                  <Ionicons name="close-outline" size={15} color={darkMode ? "#e9b76a" : colors.oliveDark} />
                  <Text style={[styles.inlineReaderBookmarkText, darkMode && styles.homeDarkResumeButtonText]}>Exit</Text>
                </Pressable>
              )}
              {activeReadingPlanDayCompleted ? (
                <View style={[styles.inlineReaderBookmarkButton, styles.activeReaderReadButton]}>
                  <Ionicons name="checkmark-circle" size={15} color="white" />
                  <Text style={styles.activeReaderReadButtonText}>Complete</Text>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Mark ${activeReadingPlanDay.reference} complete in the active reading plan`}
                  onPress={onMarkActiveReadingPlanDayComplete}
                  style={[styles.inlineReaderBookmarkButton, styles.readerPlanCompleteButton]}
                >
                  <Ionicons name="checkmark-circle-outline" size={15} color="white" />
                  <Text style={styles.activeReaderReadButtonText}>{planReadingMode ? "Complete reading" : "Mark today complete"}</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {planReadingMode ? (
          <View style={[styles.readerBottomNav, darkMode && styles.bibleDarkDividerSection]}>
            <View style={[styles.readerBottomNavButton, darkMode && styles.homeDarkResumeButton]}>
              <Ionicons name="reader-outline" size={15} color={darkMode ? "#e9b76a" : colors.oliveDark} />
              <Text style={[styles.readerBottomNavText, darkMode && styles.homeDarkResumeButtonText]}>Plan reading mode</Text>
            </View>
          </View>
        ) : (
        <View style={[styles.readerBottomNav, darkMode && styles.bibleDarkDividerSection]}>
          <Pressable onPress={() => onMoveChapter(-1)} style={[styles.readerBottomNavButton, darkMode && styles.homeDarkResumeButton]}>
            <Ionicons name="chevron-back-outline" size={15} color={darkMode ? "#e9b76a" : colors.oliveDark} />
            <Text style={[styles.readerBottomNavText, darkMode && styles.homeDarkResumeButtonText]}>Previous</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={currentChapterRead ? "Mark current Bible chapter unread" : "Mark current Bible chapter read"}
            onPress={onToggleChapterRead}
            style={[styles.readerBottomNavButton, styles.readerBottomReadButton, darkMode && styles.homeDarkResumeButton, currentChapterRead && styles.activeReaderReadButton]}
          >
            <Ionicons name={currentChapterRead ? "checkmark-circle" : "checkmark-circle-outline"} size={15} color={currentChapterRead ? "white" : (darkMode ? "#e9b76a" : colors.oliveDark)} />
            <Text style={[styles.readerBottomNavText, darkMode && styles.homeDarkResumeButtonText, currentChapterRead && styles.activeReaderReadButtonText]}>
              {currentChapterRead ? "Mark Unread" : "Mark Chapter Read"}
            </Text>
          </Pressable>
          <Pressable onPress={() => onMoveChapter(1)} style={[styles.readerBottomNavButton, darkMode && styles.homeDarkResumeButton]}>
            <Text style={[styles.readerBottomNavText, darkMode && styles.homeDarkResumeButtonText]}>Next</Text>
            <Ionicons name="chevron-forward-outline" size={15} color={darkMode ? "#e9b76a" : colors.oliveDark} />
          </Pressable>
        </View>
        )}
        <Text style={[styles.translationNote, darkMode && styles.accountDarkMutedText]}>
          {passage.translation_name} · {passage.translation_note || "Public Domain"}
        </Text>
      </View>
      {!!memoryStatus && <Text style={styles.saveStatus}>{memoryStatus}</Text>}
    </>
  );
}
