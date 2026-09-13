import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";

import { AppButton, Eyebrow, colors } from "@/components/ui";

type BibleReaderControlsProps = {
  styles: any;
  darkMode: boolean;
  phoneLayout: boolean;
  translationId: string;
  readerReference: string;
  onBrowse: () => void;
  onSearch: () => void;
  searchOpen: boolean;
  planReadingMode?: boolean;
  planReadingLabel?: string;
  chapterDraft: string;
  chapterCount: number;
  selectedVerseCount: number;
  currentChapterRead: boolean;
  currentChapterBookmarked: boolean;
  readChapterCount: number;
  currentBookReadChapterCount: number;
  tooltip: string;
  onStudy: () => void;
  onClearSelection: () => void;
  onMoveChapter: (direction: -1 | 1) => void;
  onChapterDraftChange: (value: string) => void;
  onCommitChapter: () => void;
  onToggleChapterRead: () => void;
  onBookmarkChapter: () => void;
  onClearReadingProgress: () => void;
  readerIconHoverProps: (label: string) => any;
  hideReaderTooltip: () => void;
};

export function BibleReaderControls({
  styles,
  darkMode,
  phoneLayout,
  translationId,
  readerReference,
  onBrowse,
  onSearch,
  searchOpen,
  planReadingMode,
  planReadingLabel,
  chapterDraft,
  chapterCount,
  selectedVerseCount,
  currentChapterRead,
  currentChapterBookmarked,
  readChapterCount,
  currentBookReadChapterCount,
  tooltip,
  onStudy,
  onClearSelection,
  onMoveChapter,
  onChapterDraftChange,
  onCommitChapter,
  onToggleChapterRead,
  onBookmarkChapter,
  onClearReadingProgress,
  readerIconHoverProps,
  hideReaderTooltip
}: BibleReaderControlsProps) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [planReadingPlanName, planReadingDetail] = (planReadingLabel || "Plan reading").split(" - ");

  return (
    <>
      <View style={[styles.readerHeader, { flexWrap: "nowrap", alignItems: "center", gap: phoneLayout ? 4 : 12 }]}>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <View style={styles.readerTitleRow}>
            <Text style={[styles.stepTitle, { flexShrink: 1 }, darkMode && styles.accountDarkTitle]}>{readerReference}</Text>
            {currentChapterBookmarked && <Ionicons name="bookmark" size={17} color={darkMode ? "#e9b76a" : colors.coral} />}
            <Text style={[styles.readerProgressText, darkMode && styles.accountDarkMutedText]}>{translationId.toUpperCase()}</Text>
          </View>
        </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Browse Bible books, chapters, and translations" onPress={onBrowse} style={{ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: phoneLayout ? 8 : 10, borderWidth: 1, borderColor: darkMode ? "#68705c" : colors.line, borderRadius: 10, backgroundColor: darkMode ? "#28312e" : colors.paper }}>
            {!phoneLayout && <Ionicons name="book-outline" size={16} color={darkMode ? "#e9b76a" : colors.oliveDark} />}
            <Text style={{ fontSize: 13, fontWeight: "700", color: darkMode ? "#f7eddc" : colors.oliveDark }}>{phoneLayout ? "Browse" : "Browse Bible"}</Text>
            <Ionicons name="chevron-down-outline" size={14} color={darkMode ? "#e9b76a" : colors.oliveDark} />
          </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={searchOpen ? "Hide Scripture search" : "Show Scripture search"} accessibilityState={{ expanded: searchOpen }} onPress={onSearch} style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="search-outline" size={21} color={darkMode ? "#e9b76a" : colors.oliveDark} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Reader actions" accessibilityState={{ expanded: toolsOpen }} onPress={() => setToolsOpen(open => !open)} style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="ellipsis-horizontal" size={21} color={darkMode ? "#e9b76a" : colors.oliveDark} />
        </Pressable>
      </View>

      {toolsOpen && <AppButton label={selectedVerseCount ? "Study selected" : planReadingMode ? "Study reading" : "Study this chapter"} variant="secondary" onPress={onStudy} style={darkMode && styles.homeDarkResumeButton} labelStyle={darkMode && styles.homeDarkResumeButtonText} />}

      {selectedVerseCount > 0 && (
        <View style={[styles.readerSelectionBar, darkMode && styles.accountDarkSection]}>
          <Text style={[styles.readerSelectionText, darkMode && styles.accountDarkTitle]}>{`${selectedVerseCount} verse${selectedVerseCount === 1 ? "" : "s"} selected`}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear selected Bible verses"
            onPress={onClearSelection}
            style={[styles.clearMarkupButton, darkMode && styles.homeDarkResumeButton]}
          >
            <Text style={[styles.clearMarkupText, darkMode && styles.homeDarkResumeButtonText]}>Clear</Text>
          </Pressable>
        </View>
      )}

      {planReadingMode ? (
        <View style={[styles.readerSelectionBar, styles.readerPlanModeBar, darkMode && styles.accountDarkSection]}>
          <Ionicons name="reader-outline" size={16} color={darkMode ? "#e9b76a" : colors.oliveDark} />
          <View style={styles.readerPlanModeCopy}>
            <Text style={[styles.readerPlanModeName, darkMode && styles.readerDarkPlanModeName]}>{planReadingPlanName}</Text>
            {!!planReadingDetail && <Text style={[styles.readerSelectionText, darkMode && styles.accountDarkMutedText]}>{planReadingDetail}</Text>}
          </View>
        </View>
      ) : (
      <View style={[styles.readerNavigationRow, phoneLayout && styles.phoneReaderNavigationRow]}>
        <Pressable
          accessibilityRole="button"
          {...readerIconHoverProps("Previous chapter")}
          onPress={() => {
            hideReaderTooltip();
            onMoveChapter(-1);
          }}
          style={[styles.readerNavIconButton, phoneLayout && styles.phoneReaderNavIconButton, darkMode && styles.homeDarkIconBubble]}
        >
          <Ionicons name="chevron-back-outline" size={18} color={darkMode ? "#e9b76a" : colors.oliveDark} />
        </Pressable>

        <View style={[styles.readerChapterControl, phoneLayout && styles.phoneReaderChapterControl, darkMode && styles.accountDarkInsetBox]}>
          <Text numberOfLines={1} style={[styles.readerChapterLabel, phoneLayout && styles.phoneReaderChapterLabel, darkMode && styles.accountDarkMutedText]}>
            {phoneLayout ? "Ch" : "Ch."}
          </Text>
          <TextInput
            accessibilityLabel="Bible chapter number"
            value={chapterDraft}
            onChangeText={onChapterDraftChange}
            onBlur={onCommitChapter}
            onSubmitEditing={onCommitChapter}
            keyboardType="number-pad"
            selectTextOnFocus
            style={[styles.readerChapterInput, phoneLayout && styles.phoneReaderChapterInput, darkMode && styles.accountDarkInput]}
          />
          <Text numberOfLines={1} style={[styles.readerChapterCountText, phoneLayout && styles.phoneReaderChapterCountText, darkMode && styles.accountDarkMutedText]}>
            {phoneLayout ? `/ ${chapterCount}` : `of ${chapterCount}`}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={currentChapterRead ? "Mark current Bible chapter unread" : "Mark current Bible chapter read"}
          {...readerIconHoverProps(currentChapterRead ? "Mark unread" : "Mark chapter read")}
          onPress={() => {
            hideReaderTooltip();
            onToggleChapterRead();
          }}
          style={[styles.readerNavIconButton, phoneLayout && styles.phoneReaderNavIconButton, darkMode && styles.homeDarkIconBubble, currentChapterRead && styles.activeReaderReadButton]}
        >
          <Ionicons name={currentChapterRead ? "checkmark-circle" : "checkmark-circle-outline"} size={18} color={currentChapterRead ? "white" : (darkMode ? "#e9b76a" : colors.oliveDark)} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          {...readerIconHoverProps(currentChapterBookmarked ? "Chapter bookmarked" : "Bookmark chapter")}
          onPress={() => {
            hideReaderTooltip();
            onBookmarkChapter();
          }}
          style={[styles.readerNavIconButton, phoneLayout && styles.phoneReaderNavIconButton, darkMode && styles.homeDarkIconBubble, currentChapterBookmarked && styles.activeReaderBookmarkButton]}
        >
          <Ionicons name={currentChapterBookmarked ? "bookmark" : "bookmark-outline"} size={18} color={currentChapterBookmarked ? "white" : (darkMode ? "#e9b76a" : colors.oliveDark)} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          {...readerIconHoverProps("Next chapter")}
          onPress={() => {
            hideReaderTooltip();
            onMoveChapter(1);
          }}
          style={[styles.readerNavIconButton, phoneLayout && styles.phoneReaderNavIconButton, darkMode && styles.homeDarkIconBubble]}
        >
          <Ionicons name="chevron-forward-outline" size={18} color={darkMode ? "#e9b76a" : colors.oliveDark} />
        </Pressable>
      </View>
      )}

      {Platform.OS === "web" && !!tooltip && <Text style={styles.readerIconTooltip}>{tooltip}</Text>}

      {!planReadingMode && toolsOpen && <View style={styles.readerProgressRow}>
        <Text style={[styles.readerProgressText, darkMode && styles.accountDarkMutedText]}>
          {`${readerReference.split(" ").slice(0, -1).join(" ") || readerReference}: ${currentBookReadChapterCount} of ${chapterCount} chapter${chapterCount === 1 ? "" : "s"} marked read`}
        </Text>
        {readChapterCount > 0 && (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear all Bible reading progress" onPress={onClearReadingProgress} style={styles.readerProgressClearButton}>
            <Text style={styles.readerProgressClearText}>Clear all</Text>
          </Pressable>
        )}
      </View>}
    </>
  );
}
