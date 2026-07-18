import Ionicons from "@expo/vector-icons/Ionicons";
import { Platform, Pressable, Text, TextInput, View } from "react-native";

import { AppButton, Eyebrow, colors } from "@/components/ui";

type BibleReaderControlsProps = {
  styles: any;
  darkMode: boolean;
  phoneLayout: boolean;
  translationId: string;
  readerReference: string;
  chapterDraft: string;
  chapterCount: number;
  selectedVerseCount: number;
  currentChapterRead: boolean;
  currentChapterBookmarked: boolean;
  readChapterCount: number;
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
  chapterDraft,
  chapterCount,
  selectedVerseCount,
  currentChapterRead,
  currentChapterBookmarked,
  readChapterCount,
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
  return (
    <>
      <View style={styles.readerHeader}>
        <View>
          <Eyebrow>{translationId.toUpperCase()}</Eyebrow>
          <View style={styles.readerTitleRow}>
            <Text style={[styles.stepTitle, darkMode && styles.accountDarkTitle]}>{readerReference}</Text>
            {currentChapterBookmarked && <Ionicons name="bookmark" size={17} color={colors.coral} />}
          </View>
        </View>
        <AppButton label={selectedVerseCount ? "Study selected" : "Study this"} variant="secondary" onPress={onStudy} style={darkMode && styles.homeDarkResumeButton} labelStyle={darkMode && styles.homeDarkResumeButtonText} />
      </View>

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

      {Platform.OS === "web" && !!tooltip && <Text style={styles.readerIconTooltip}>{tooltip}</Text>}

      <View style={styles.readerProgressRow}>
        <Text style={[styles.readerProgressText, darkMode && styles.accountDarkMutedText]}>{`${readChapterCount} chapter${readChapterCount === 1 ? "" : "s"} read`}</Text>
        {readChapterCount > 0 && (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear all Bible reading progress" onPress={onClearReadingProgress} style={styles.readerProgressClearButton}>
            <Text style={styles.readerProgressClearText}>Clear all</Text>
          </Pressable>
        )}
      </View>
    </>
  );
}
