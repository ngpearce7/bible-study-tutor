import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { type BiblePassage, type BibleVerse } from "@/data/biblePassage";
import { colors } from "@/components/ui";

type DevotionalTextSize = "normal" | "large" | "larger";

const DEVOTIONAL_TEXT_SIZE_OPTIONS: { id: DevotionalTextSize; accessibilityLabel: string; iconSize: number }[] = [
  { id: "normal", accessibilityLabel: "Use normal devotional text size", iconSize: 13 },
  { id: "large", accessibilityLabel: "Use large devotional text size", iconSize: 16 },
  { id: "larger", accessibilityLabel: "Use larger devotional text size", iconSize: 19 }
];

const DEVOTIONAL_TEXT_SIZE_STYLES: Record<DevotionalTextSize, { title: { fontSize: number; lineHeight: number }; label: { fontSize: number; lineHeight: number }; body: { fontSize: number; lineHeight: number }; prompt: { fontSize: number; lineHeight: number } }> = {
  normal: { title: { fontSize: 13, lineHeight: 17 }, label: { fontSize: 10, lineHeight: 13 }, body: { fontSize: 12, lineHeight: 18 }, prompt: { fontSize: 12, lineHeight: 17 } },
  large: { title: { fontSize: 15, lineHeight: 20 }, label: { fontSize: 12, lineHeight: 15 }, body: { fontSize: 14, lineHeight: 21 }, prompt: { fontSize: 14, lineHeight: 20 } },
  larger: { title: { fontSize: 17, lineHeight: 23 }, label: { fontSize: 13, lineHeight: 17 }, body: { fontSize: 16, lineHeight: 24 }, prompt: { fontSize: 15, lineHeight: 22 } }
};

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
  activeReadingPlanDay?: {
    reference: string;
    devotional?: {
      title: string;
      body: string;
      source?: string;
    };
    reflectionPrompt?: string;
    prayerPrompt?: string;
  } | null;
  activeReadingPlanName?: string;
  activeReadingPlanDayCompleted?: boolean;
  devotionalTextSize?: DevotionalTextSize;
  onDevotionalTextSizeChange?: (size: DevotionalTextSize) => void;
  planReadingMode?: boolean;
  planReadingCanMovePrevious?: boolean;
  planReadingCanMoveNext?: boolean;
  planReadingChunkLabel?: string;
  planReadingNote?: string;
  planReadingFullChapter?: boolean;
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
  activeReadingPlanName,
  activeReadingPlanDayCompleted,
  devotionalTextSize = "normal",
  onDevotionalTextSizeChange,
  planReadingMode,
  planReadingCanMovePrevious,
  planReadingCanMoveNext,
  planReadingChunkLabel,
  planReadingNote,
  planReadingFullChapter,
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
  const [devotionalTextSizeOptionsOpen, setDevotionalTextSizeOptionsOpen] = useState(false);

  useEffect(() => {
    if (!devotionalTextSizeOptionsOpen) return;
    const timer = setTimeout(() => setDevotionalTextSizeOptionsOpen(false), 7000);
    return () => clearTimeout(timer);
  }, [devotionalTextSizeOptionsOpen]);

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

  const planReadingHasMultipleParts = !!planReadingMode && (!!planReadingCanMovePrevious || !!planReadingCanMoveNext || !!planReadingChunkLabel);
  const showExitPlanReadingButton = !!planReadingMode;
  const exitPlanReadingLabel = phoneLayout ? "Cancel" : "Cancel reading";
  const exitPlanReadingAccessibilityLabel = "Cancel focused plan reading";
  const activeReadingPlanLabel = activeReadingPlanDay
    ? planReadingMode && activeReadingPlanName?.trim()
      ? `${activeReadingPlanDay.reference} - ${activeReadingPlanName.trim()}`
      : activeReadingPlanDay.reference
    : "";
  const focusedPlanReadingNote = planReadingNote || (planReadingHasMultipleParts
    ? "Use Previous and Next to move through this plan reading."
    : "");
  const devotionalTextSizing = DEVOTIONAL_TEXT_SIZE_STYLES[devotionalTextSize] || DEVOTIONAL_TEXT_SIZE_STYLES.normal;
  const activeDevotionalTextSizeOption = DEVOTIONAL_TEXT_SIZE_OPTIONS.find((option) => option.id === devotionalTextSize) || DEVOTIONAL_TEXT_SIZE_OPTIONS[0];

  const devotionalTextSizeControl = (
    <View style={styles.devotionalTextSizeAnchor}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: devotionalTextSizeOptionsOpen }}
        accessibilityLabel={devotionalTextSizeOptionsOpen ? "Hide devotional text size options" : "Show devotional text size options"}
        onLongPress={() => setDevotionalTextSizeOptionsOpen(true)}
        onPress={() => setDevotionalTextSizeOptionsOpen((open) => !open)}
        style={[styles.devotionalTextSizeSingleButton, darkMode && styles.devotionalTextSizeButtonDark]}
      >
        <Ionicons name="search-outline" size={activeDevotionalTextSizeOption.iconSize} color={darkMode ? "#e9b76a" : colors.muted} />
      </Pressable>
      {devotionalTextSizeOptionsOpen && (
        <View style={[styles.devotionalTextSizePopover, darkMode && styles.devotionalTextSizePopoverDark]}>
          <View style={[styles.devotionalTextSizePopoverTail, darkMode && styles.devotionalTextSizePopoverTailDark]} />
          <View style={styles.devotionalTextSizePopoverButtons}>
            {DEVOTIONAL_TEXT_SIZE_OPTIONS.map((option) => {
              const selected = devotionalTextSize === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={option.accessibilityLabel}
                  onPress={() => {
                    onDevotionalTextSizeChange?.(option.id);
                    setDevotionalTextSizeOptionsOpen(false);
                  }}
                  style={[styles.devotionalTextSizeButton, selected && styles.devotionalTextSizeButtonActive, darkMode && styles.devotionalTextSizeButtonDark, darkMode && selected && styles.devotionalTextSizeButtonActiveDark]}
                >
                  <Ionicons name="search-outline" size={option.iconSize} color={selected ? (darkMode ? "#211a12" : "white") : (darkMode ? "#e9b76a" : colors.muted)} />
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );

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
        {passage.verses.map((verse) => {
          const selected = selectedVerses.includes(verse.verse);
          return (
            <View
              key={`${verse.chapter}-${verse.verse}`}
              onLayout={(event) => onVerseLayout(verse.verse, event)}
            >
              <Pressable
                onPress={() => {
                  onToggleVerse(verse.verse);
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
          <View style={[styles.readerPlanCompletionBox, phoneLayout && styles.phoneReaderPlanCompletionBox, darkMode && styles.accountDarkSection]}>
            <View style={styles.readerPlanCompletionCopy}>
              <Text style={[styles.readerBookSectionTitle, darkMode && styles.studyDarkAccentText]}>{planReadingMode ? "Focused plan reading" : "Reading plan"}</Text>
              <Text style={[styles.muted, darkMode && styles.accountDarkMutedText]}>
                {activeReadingPlanDayCompleted ? `${activeReadingPlanLabel} is complete.` : activeReadingPlanLabel}
                {planReadingMode && !activeReadingPlanDayCompleted
                  ? focusedPlanReadingNote ? ` ${focusedPlanReadingNote}` : ""
                  : ""}
              </Text>
              {(activeReadingPlanDay.devotional || activeReadingPlanDay.reflectionPrompt || activeReadingPlanDay.prayerPrompt) && (
                <View style={[styles.readerPlanDevotionalBox, darkMode && styles.planDayDevotionalBoxDark]}>
                  {!!activeReadingPlanDay.devotional && (
                    <>
                      <View style={styles.planDayDevotionalHeader}>
                        <View style={styles.planDayDevotionalTitleRow}>
                          <Ionicons name="leaf-outline" size={15} color={darkMode ? "#e9b76a" : colors.oliveDark} />
                          <Text style={[styles.planDayDevotionalTitle, devotionalTextSizing.title, darkMode && styles.accountDarkTitle]}>{activeReadingPlanDay.devotional.title}</Text>
                        </View>
                        {devotionalTextSizeControl}
                      </View>
                      <Text style={[styles.planDayDevotionalText, devotionalTextSizing.body, darkMode && styles.accountDarkMutedText]}>{activeReadingPlanDay.devotional.body}</Text>
                    </>
                  )}
                  {!!activeReadingPlanDay.reflectionPrompt && (
                    <View style={styles.planDayPromptRow}>
                      <Text style={[styles.planDayPromptLabel, devotionalTextSizing.label, darkMode && styles.studyDarkAccentText]}>Reflect</Text>
                      <Text style={[styles.planDayPromptText, devotionalTextSizing.prompt, darkMode && styles.accountDarkMutedText]}>{activeReadingPlanDay.reflectionPrompt}</Text>
                    </View>
                  )}
                  {!!activeReadingPlanDay.prayerPrompt && (
                    <View style={styles.planDayPromptRow}>
                      <Text style={[styles.planDayPromptLabel, devotionalTextSizing.label, darkMode && styles.studyDarkAccentText]}>Pray</Text>
                      <Text style={[styles.planDayPromptText, devotionalTextSizing.prompt, darkMode && styles.accountDarkMutedText]}>{activeReadingPlanDay.prayerPrompt}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            <View style={[styles.inlineReaderActions, phoneLayout && styles.phoneReaderPlanCompletionActions]}>
              {showExitPlanReadingButton && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={exitPlanReadingAccessibilityLabel}
                  onPress={onExitPlanReading}
                  style={[styles.inlineReaderBookmarkButton, phoneLayout && styles.phoneReaderPlanCompletionExitButton, darkMode && styles.homeDarkResumeButton]}
                >
                  <Ionicons name="close-outline" size={15} color={darkMode ? "#e9b76a" : colors.oliveDark} />
                  <Text style={[styles.inlineReaderBookmarkText, phoneLayout && styles.phoneReaderPlanCompletionButtonText, darkMode && styles.homeDarkResumeButtonText]}>{exitPlanReadingLabel}</Text>
                </Pressable>
              )}
              {activeReadingPlanDayCompleted ? (
                <View
                  accessibilityRole="text"
                  style={[
                    styles.readerPlanCompletedStatus,
                    darkMode && styles.readerPlanCompletedStatusDark
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={15} color={darkMode ? "#b8d992" : colors.oliveDark} />
                  <Text style={[styles.readerPlanCompletedStatusText, phoneLayout && styles.phoneReaderPlanCompletionButtonText, darkMode && styles.readerPlanCompletedStatusTextDark]}>{phoneLayout ? "Complete" : "Reading complete"}</Text>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Mark ${activeReadingPlanDay.reference} complete in the active reading plan`}
                  onPress={onMarkActiveReadingPlanDayComplete}
                  style={[styles.inlineReaderBookmarkButton, phoneLayout && styles.phoneReaderPlanCompletionPrimaryButton, styles.readerPlanCompleteButton]}
                >
                  <Ionicons name="checkmark-circle-outline" size={15} color="white" />
                  <Text style={[styles.activeReaderReadButtonText, phoneLayout && styles.phoneReaderPlanCompletionButtonText]}>{phoneLayout ? "Complete" : (planReadingMode ? "Complete reading" : "Mark today complete")}</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {planReadingMode && planReadingHasMultipleParts ? (
          <View style={[styles.readerBottomNav, darkMode && styles.bibleDarkDividerSection]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open previous part of this plan reading"
              disabled={!planReadingCanMovePrevious}
              onPress={() => onMoveChapter(-1)}
              style={[styles.readerBottomNavButton, darkMode && styles.homeDarkResumeButton, !planReadingCanMovePrevious && styles.inactiveCollapsedReaderIconButton]}
            >
              <Ionicons name="chevron-back-outline" size={15} color={darkMode ? "#e9b76a" : colors.oliveDark} />
              <Text style={[styles.readerBottomNavText, darkMode && styles.homeDarkResumeButtonText]}>Previous</Text>
            </Pressable>
            <View style={[styles.readerBottomNavButton, darkMode && styles.homeDarkResumeButton]}>
              <Ionicons name="reader-outline" size={15} color={darkMode ? "#e9b76a" : colors.oliveDark} />
              <Text style={[styles.readerBottomNavText, darkMode && styles.homeDarkResumeButtonText]}>{planReadingChunkLabel || "Plan passage"}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open next part of this plan reading"
              disabled={!planReadingCanMoveNext}
              onPress={() => onMoveChapter(1)}
              style={[styles.readerBottomNavButton, darkMode && styles.homeDarkResumeButton, !planReadingCanMoveNext && styles.inactiveCollapsedReaderIconButton]}
            >
              <Text style={[styles.readerBottomNavText, darkMode && styles.homeDarkResumeButtonText]}>Next</Text>
              <Ionicons name="chevron-forward-outline" size={15} color={darkMode ? "#e9b76a" : colors.oliveDark} />
            </Pressable>
          </View>
        ) : !planReadingMode ? (
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
        ) : null}
        <Text style={[styles.translationNote, darkMode && styles.accountDarkMutedText]}>
          {passage.translation_name} · {passage.translation_note || "Public Domain"}
        </Text>
      </View>
      {!!memoryStatus && <Text style={styles.saveStatus}>{memoryStatus}</Text>}
    </>
  );
}
