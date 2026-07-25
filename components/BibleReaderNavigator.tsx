import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import { PanResponder, Pressable, Text, TextInput, View } from "react-native";

import { BIBLE_CHAPTER_COUNTS, NEW_TESTAMENT_BOOKS, OLD_TESTAMENT_BOOKS } from "@/data/bibleLibrary";
import { AppButton, Card, Eyebrow, colors } from "@/components/ui";

type ReaderMobileMenu = "old" | "new" | null;
type ReaderQuickListView = "recent" | "read";

type BibleTranslationOption = {
  id: string;
  label: string;
};

type ReaderBookSection = {
  title: string;
  books: string[];
};

type FollowedReadingPlanSummary = {
  id: string;
  title: string;
  reference: string;
  label: string;
  overdue?: boolean;
  completedCount: number;
  dayCount: number;
  remainingCount: number;
  progressPercent: number;
  complete: boolean;
};

type BibleReaderNavigatorProps = {
  styles: any;
  darkMode: boolean;
  phoneLayout: boolean;
  compactLayout: boolean;
  collapsed: boolean;
  translations: BibleTranslationOption[];
  translationId: string;
  readChapterCount: number;
  readChapters: Record<string, number[]>;
  bookmarks: any[];
  history: any[];
  historyCollapsed: boolean;
  bookmarksCollapsed: boolean;
  bookmarksExpanded: boolean;
  bookmarkNotesOnly: boolean;
  bookmarkSearch: string;
  bookSearch: string;
  visibleBookmarks: any[];
  filteredBookmarksCount: number;
  activeBookmarkNoteId: string;
  bookmarkNoteDraft: string;
  mobileMenu: ReaderMobileMenu;
  expandedBook: string;
  readerBook: string;
  readerChapter: number;
  readerBookSections: ReaderBookSection[];
  activeBibleReadingPlan?: any;
  activeBibleReadingPlanToday?: any;
  activeBibleReadingPlanTodayLabel?: string;
  activeBibleReadingPlanCompletedCount: number;
  activeBibleReadingPlanComplete: boolean;
  activeBibleReadingPlanOpen?: boolean;
  biblePlanStatus?: string;
  otherActiveBibleReadingPlans?: FollowedReadingPlanSummary[];
  onToggleCollapsed: () => void;
  onOpenPlansTab: () => void;
  onOpenActivePlanReading: () => void;
  onOpenFollowedPlanReading: (planId: string) => void;
  onSelectTranslation: (translationId: string) => void;
  onBookSearchChange: (value: string) => void;
  onToggleHistoryCollapsed: () => void;
  onClearHistory: () => void;
  onOpenHistoryItem: (item: any) => void;
  onToggleBookmarksCollapsed: () => void;
  onBookmarkSearchChange: (value: string) => void;
  onToggleBookmarkNotesOnly: () => void;
  onOpenBookmark: (bookmark: any) => void;
  onOpenBookmarkNote: (bookmark: any) => void;
  onRemoveBookmark: (bookmarkId: string) => void;
  onBookmarkNoteDraftChange: (value: string) => void;
  onSaveBookmarkNote: (bookmarkId: string) => void;
  onDeleteBookmarkNote: (bookmarkId: string) => void;
  onCancelBookmarkNote: () => void;
  onToggleBookmarksExpanded: () => void;
  onToggleMobileMenu: (menu: ReaderMobileMenu) => void;
  onSelectMobileBook: (book: string) => void;
  onSelectChapter: (chapter: number, book: string) => void;
  onClearReadBook: (book: string) => void;
};

export function BibleReaderNavigator({
  styles,
  darkMode,
  phoneLayout,
  compactLayout,
  collapsed,
  translations,
  translationId,
  readChapterCount,
  readChapters,
  bookmarks,
  history,
  historyCollapsed,
  bookmarksCollapsed,
  bookmarksExpanded,
  bookmarkNotesOnly,
  bookmarkSearch,
  bookSearch,
  visibleBookmarks,
  filteredBookmarksCount,
  activeBookmarkNoteId,
  bookmarkNoteDraft,
  mobileMenu,
  expandedBook,
  readerBook,
  readerChapter,
  readerBookSections,
  activeBibleReadingPlan,
  activeBibleReadingPlanToday,
  activeBibleReadingPlanTodayLabel,
  activeBibleReadingPlanCompletedCount,
  activeBibleReadingPlanComplete,
  activeBibleReadingPlanOpen,
  biblePlanStatus,
  otherActiveBibleReadingPlans = [],
  onToggleCollapsed,
  onOpenPlansTab,
  onOpenActivePlanReading,
  onOpenFollowedPlanReading,
  onSelectTranslation,
  onBookSearchChange,
  onToggleHistoryCollapsed,
  onClearHistory,
  onOpenHistoryItem,
  onToggleBookmarksCollapsed,
  onBookmarkSearchChange,
  onToggleBookmarkNotesOnly,
  onOpenBookmark,
  onOpenBookmarkNote,
  onRemoveBookmark,
  onBookmarkNoteDraftChange,
  onSaveBookmarkNote,
  onDeleteBookmarkNote,
  onCancelBookmarkNote,
  onToggleBookmarksExpanded,
  onToggleMobileMenu,
  onSelectMobileBook,
  onSelectChapter,
  onClearReadBook
}: BibleReaderNavigatorProps) {
  const [quickListView, setQuickListView] = useState<ReaderQuickListView>("recent");
  const activePlanDayCount = Array.isArray(activeBibleReadingPlan?.days) ? activeBibleReadingPlan.days.length : 0;
  const activePlanCompletedCount = Math.min(activeBibleReadingPlanCompletedCount, activePlanDayCount);
  const activePlanRemainingCount = Math.max(0, activePlanDayCount - activePlanCompletedCount);
  const activePlanProgressPercent = activePlanDayCount ? Math.min(100, (activePlanCompletedCount / activePlanDayCount) * 100) : 0;
  const getReadChapterSet = (book: string) => new Set(readChapters[book] || []);
  const getReadProgressLabel = (book: string) => {
    const total = BIBLE_CHAPTER_COUNTS[book] || 1;
    const read = readChapters[book]?.length || 0;
    return `${read} of ${total} read`;
  };
  const readChapterSections = [...OLD_TESTAMENT_BOOKS, ...NEW_TESTAMENT_BOOKS]
    .map((book) => ({
      book,
      chapters: [...(readChapters[book] || [])].sort((a, b) => a - b)
    }))
    .filter((section) => section.chapters.length > 0);
  const quickListCount = quickListView === "read" ? readChapterCount : Math.max(0, history.length - 1);
  const bookPickerSections = phoneLayout
    ? [
        { id: "old" as ReaderMobileMenu, title: "Old Testament", books: OLD_TESTAMENT_BOOKS },
        { id: "new" as ReaderMobileMenu, title: "New Testament", books: NEW_TESTAMENT_BOOKS }
      ]
    : readerBookSections.map((section) => ({
        id: section.title === "Old Testament" ? "old" as ReaderMobileMenu : "new" as ReaderMobileMenu,
        title: section.title,
        books: section.books
      }));
  return (
    <Card
      style={[
        styles.bibleReaderNavCard,
        collapsed && styles.collapsedBibleReaderNavCard,
        compactLayout && styles.fluidCard,
        compactLayout && collapsed && styles.compactCollapsedBibleReaderNavCard,
        darkMode && styles.accountDarkMainCard
      ]}
    >
      <Pressable
        onPress={onToggleCollapsed}
        style={[styles.readerNavHeader, compactLayout && collapsed && styles.compactCollapsedReaderNavHeader]}
      >
        {collapsed ? (
          <View style={[styles.collapsedReaderIconStack, compactLayout && styles.compactCollapsedReaderIconStack]}>
            <View style={[styles.collapsedReaderIconButton, darkMode && styles.homeDarkIconBubble]}>
              <Ionicons name="book-outline" size={19} color={darkMode ? "#e9b76a" : colors.oliveDark} />
            </View>
            <View style={[styles.collapsedReaderIconButton, darkMode && styles.homeDarkIconBubble, !bookmarks.length && styles.inactiveCollapsedReaderIconButton]}>
              <Ionicons name={bookmarks.length ? "bookmark" : "bookmark-outline"} size={18} color={bookmarks.length ? (darkMode ? "#e9b76a" : colors.coral) : (darkMode ? "#c8bda9" : colors.muted)} />
            </View>
            <View style={[styles.collapsedReaderIconButton, darkMode && styles.homeDarkIconBubble, !readChapterCount && styles.inactiveCollapsedReaderIconButton]}>
              <Ionicons name={readChapterCount ? "checkmark-circle" : "checkmark-circle-outline"} size={18} color={readChapterCount ? (darkMode ? "#e9b76a" : colors.oliveDark) : (darkMode ? "#c8bda9" : colors.muted)} />
            </View>
            <View style={[styles.collapsedReaderIconButton, darkMode && styles.homeDarkIconBubble]}>
              <Ionicons name="chevron-forward-outline" size={18} color={darkMode ? "#c8bda9" : colors.muted} />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.readerNavTitleBlock}>
              <Eyebrow>Read Scripture</Eyebrow>
              <Text style={[styles.title, darkMode && styles.accountDarkTitle]}>Bible reader</Text>
            </View>
            <Ionicons name="chevron-back-outline" size={18} color={darkMode ? "#c8bda9" : colors.muted} />
          </>
        )}
      </Pressable>

      {!collapsed && (
        <>
          <Text style={[styles.titleSupport, darkMode && styles.accountDarkMutedText]}>Navigate by book and chapter, then send any chapter into Study when you want to slow down.</Text>
          <View style={[styles.translationRow, darkMode && styles.accountDarkSegmentedRow]}>
            {translations.map((translation) => (
              <Pressable
                key={translation.id}
                accessibilityRole="button"
                accessibilityLabel={`Use ${translation.label} translation`}
                onPress={() => onSelectTranslation(translation.id)}
                style={[styles.translationOption, translationId === translation.id && styles.activeTranslationOption]}
              >
                <Text style={[styles.translationOptionText, darkMode && styles.accountDarkMutedText, translationId === translation.id && styles.activeTranslationOptionText]}>
                  {translation.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {!phoneLayout && (
            <TextInput
              accessibilityLabel="Find a Bible book"
              value={bookSearch}
              onChangeText={onBookSearchChange}
              placeholder="Find a book"
              placeholderTextColor={darkMode ? "#8f8678" : undefined}
              style={[styles.input, darkMode && styles.accountDarkInput]}
            />
          )}

          {(history.length > 1 || readChapterCount > 0) && (
            <View style={[styles.readerHistorySection, darkMode && styles.bibleDarkDividerSection]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={historyCollapsed ? "Show Bible reading quick lists" : "Hide Bible reading quick lists"}
                onPress={onToggleHistoryCollapsed}
                style={[styles.readerBookmarkHeader, darkMode && styles.accountDarkInsetBox]}
              >
                <View style={styles.readerBookmarkHeaderTitle}>
                  <Ionicons name={quickListView === "read" ? "checkmark-circle-outline" : "time-outline"} size={15} color={colors.coral} />
                  <Text style={[styles.readerBookSectionTitle, darkMode && styles.studyDarkAccentText]}>{quickListView === "read" ? "Read chapters" : "Recent"}</Text>
                </View>
                <View style={styles.readerBookmarkHeaderMeta}>
                  <Text style={[styles.readerBookmarkCount, darkMode && styles.accountDarkMutedText]}>{quickListCount}</Text>
                  <Ionicons name={historyCollapsed ? "chevron-down-outline" : "chevron-up-outline"} size={15} color={darkMode ? "#c8bda9" : colors.muted} />
                </View>
              </Pressable>
              {!historyCollapsed && (
                <>
                  <View style={[styles.readerQuickListToggle, darkMode && styles.accountDarkSegmentedRow]}>
                    {[
                      { id: "recent" as ReaderQuickListView, label: "Recent", count: Math.max(0, history.length - 1) },
                      { id: "read" as ReaderQuickListView, label: "Read chapters", count: readChapterCount }
                    ].map((option) => (
                      <Pressable
                        key={option.id}
                        accessibilityRole="button"
                        accessibilityLabel={`Show ${option.label.toLowerCase()}`}
                        onPress={() => setQuickListView(option.id)}
                        style={[styles.readerQuickListToggleButton, quickListView === option.id && styles.activeTranslationOption]}
                      >
                        <Text style={[styles.readerQuickListToggleText, darkMode && styles.accountDarkMutedText, quickListView === option.id && styles.activeTranslationOptionText]}>{option.label}</Text>
                        <Text style={[styles.readerQuickListToggleCount, darkMode && styles.accountDarkMutedText, quickListView === option.id && styles.activeTranslationOptionText]}>{option.count}</Text>
                      </Pressable>
                    ))}
                  </View>

                  {quickListView === "recent" ? (
                    <>
                      {history.length > 1 && (
                        <View style={styles.readerHistoryActions}>
                          <Pressable accessibilityRole="button" accessibilityLabel="Clear Bible reading history" onPress={onClearHistory} style={styles.readerHistoryClearButton}>
                            <Text style={styles.readerProgressClearText}>Clear</Text>
                          </Pressable>
                        </View>
                      )}
                      <View style={styles.readerHistoryList}>
                        {history.slice(1, phoneLayout ? 5 : 7).map((item) => (
                          <Pressable
                            key={`${item.book}-${item.chapter}-${item.translation}`}
                            accessibilityRole="button"
                            accessibilityLabel={`Open recent reading ${item.reference}`}
                            onPress={() => onOpenHistoryItem(item)}
                            style={[styles.readerHistoryChip, darkMode && styles.accountDarkInsetBox]}
                          >
                            <Ionicons name="reader-outline" size={13} color={darkMode ? "#e9b76a" : colors.oliveDark} />
                            <Text numberOfLines={1} style={[styles.readerHistoryText, darkMode && styles.accountDarkTitle]}>{item.reference}</Text>
                            <Text style={[styles.readerHistoryTranslation, darkMode && styles.accountDarkMutedText]}>{item.translation.toUpperCase()}</Text>
                          </Pressable>
                        ))}
                        {history.length <= 1 && <Text style={[styles.muted, darkMode && styles.accountDarkMutedText]}>No recent chapters yet.</Text>}
                      </View>
                    </>
                  ) : (
                    <View style={styles.readerReadChapterList}>
                      {readChapterSections.map((section) => (
                        <ReadChapterBookCard
                          key={section.book}
                          styles={styles}
                          darkMode={darkMode}
                          phoneLayout={phoneLayout}
                          section={section}
                          active={readerBook === section.book}
                          activeChapter={readerBook === section.book ? readerChapter : 0}
                          onSelectChapter={onSelectChapter}
                          onClearReadBook={onClearReadBook}
                        />
                      ))}
                      {!readChapterSections.length && <Text style={[styles.muted, darkMode && styles.accountDarkMutedText]}>No chapters marked read yet.</Text>}
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {bookmarks.length > 0 && (
            <View style={[styles.readerBookmarkSection, darkMode && styles.bibleDarkDividerSection]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={bookmarksCollapsed ? "Show bookmarks and notes" : "Hide bookmarks and notes"}
                onPress={onToggleBookmarksCollapsed}
                style={[styles.readerBookmarkHeader, darkMode && styles.accountDarkInsetBox]}
              >
                <View style={styles.readerBookmarkHeaderTitle}>
                  <Ionicons name="bookmark-outline" size={15} color={colors.coral} />
                  <Text style={[styles.readerBookSectionTitle, darkMode && styles.studyDarkAccentText]}>Bookmarks & notes</Text>
                </View>
                <View style={styles.readerBookmarkHeaderMeta}>
                  <Text style={[styles.readerBookmarkCount, darkMode && styles.accountDarkMutedText]}>{bookmarks.length}</Text>
                  <Ionicons name={bookmarksCollapsed ? "chevron-down-outline" : "chevron-up-outline"} size={15} color={darkMode ? "#c8bda9" : colors.muted} />
                </View>
              </Pressable>
              {!bookmarksCollapsed && (
                <>
                  <TextInput
                    accessibilityLabel="Search bookmarks or notes"
                    value={bookmarkSearch}
                    onChangeText={onBookmarkSearchChange}
                    placeholder="Search bookmarks or notes"
                    placeholderTextColor={darkMode ? "#8f8678" : undefined}
                    style={[styles.input, styles.readerBookmarkSearchInput, darkMode && styles.accountDarkInput]}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={bookmarkNotesOnly ? "Show all bookmarks" : "Show only bookmarks with notes"}
                    onPress={onToggleBookmarkNotesOnly}
                    style={[styles.readerBookmarkFilterChip, darkMode && styles.homeDarkResumeButton, bookmarkNotesOnly && styles.activeReaderBookChip]}
                  >
                    <Ionicons name={bookmarkNotesOnly ? "document-text" : "document-text-outline"} size={14} color={bookmarkNotesOnly ? "white" : (darkMode ? "#e9b76a" : colors.oliveDark)} />
                    <Text style={[styles.readerBookmarkFilterText, darkMode && styles.homeDarkResumeButtonText, bookmarkNotesOnly && styles.activeReaderBookText]}>With notes</Text>
                  </Pressable>
                  {visibleBookmarks.map((bookmark) => (
                    <View key={bookmark.id} style={styles.readerBookmarkItem}>
                      <View style={styles.readerBookmarkRow}>
                        <Pressable accessibilityRole="button" accessibilityLabel={`Open ${bookmark.reference}`} onPress={() => onOpenBookmark(bookmark)} style={[styles.readerBookmarkOpen, darkMode && styles.accountDarkInsetBox]}>
                          <Ionicons name={bookmark.bookmarked === false ? "document-text-outline" : "bookmark-outline"} size={14} color={bookmark.bookmarked === false ? (darkMode ? "#e9b76a" : colors.oliveDark) : (darkMode ? "#e9b76a" : colors.coral)} />
                          <Text style={[styles.readerBookmarkText, darkMode && styles.accountDarkTitle]}>{bookmark.reference}</Text>
                        </Pressable>
                        <Pressable accessibilityRole="button" accessibilityLabel={`Edit note for ${bookmark.reference}`} onPress={() => onOpenBookmarkNote(bookmark)} style={[styles.readerBookmarkIconButton, darkMode && styles.homeDarkIconBubble, bookmark.note?.trim() && styles.activeBookmarkNoteButton]}>
                          <Ionicons name={bookmark.note?.trim() ? "document-text" : "document-text-outline"} size={15} color={bookmark.note?.trim() ? "white" : (darkMode ? "#e9b76a" : colors.oliveDark)} />
                        </Pressable>
                        <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${bookmark.reference}`} onPress={() => onRemoveBookmark(bookmark.id)} style={styles.readerBookmarkRemove}>
                          <Ionicons name="close-outline" size={15} color={colors.muted} />
                        </Pressable>
                      </View>
                      {activeBookmarkNoteId === bookmark.id && (
                        <View style={styles.readerBookmarkNoteEditor}>
                          <TextInput
                            accessibilityLabel={`Note for ${bookmark.reference}`}
                            value={bookmarkNoteDraft}
                            onChangeText={onBookmarkNoteDraftChange}
                            placeholder="Add a note"
                            multiline
                            placeholderTextColor={darkMode ? "#8f8678" : undefined}
                            style={[styles.input, styles.readerBookmarkNoteInput, phoneLayout && styles.mobileReaderBookmarkNoteInput, darkMode && styles.accountDarkInput]}
                          />
                          <View style={styles.readerBookmarkNoteActions}>
                            <Pressable onPress={() => onSaveBookmarkNote(bookmark.id)} style={[styles.inlineReaderBookmarkButton, darkMode && styles.homeDarkResumeButton]}>
                              <Text style={[styles.inlineReaderBookmarkText, darkMode && styles.homeDarkResumeButtonText]}>Save note</Text>
                            </Pressable>
                            {!!bookmark.note?.trim() && (
                              <Pressable onPress={() => onDeleteBookmarkNote(bookmark.id)} style={[styles.clearMarkupButton, darkMode && styles.homeDarkResumeButton]}>
                                <Text style={[styles.clearMarkupText, darkMode && styles.homeDarkResumeButtonText]}>Delete note</Text>
                              </Pressable>
                            )}
                            <Pressable
                              onPress={onCancelBookmarkNote}
                              style={[styles.clearMarkupButton, darkMode && styles.homeDarkResumeButton]}
                            >
                              <Text style={[styles.clearMarkupText, darkMode && styles.homeDarkResumeButtonText]}>Cancel</Text>
                            </Pressable>
                          </View>
                        </View>
                      )}
                    </View>
                  ))}
                  {filteredBookmarksCount > 3 && (
                    <Pressable onPress={onToggleBookmarksExpanded} style={styles.readerBookmarkExpandButton}>
                      <Text style={[styles.readerBookmarkExpandText, darkMode && styles.studyDarkAccentText]}>
                        {bookmarksExpanded ? "Show latest 3" : `Show all ${filteredBookmarksCount}`}
                      </Text>
                      <Ionicons name={bookmarksExpanded ? "chevron-up-outline" : "chevron-down-outline"} size={14} color={darkMode ? "#e9b76a" : colors.oliveDark} />
                    </Pressable>
                  )}
                  {!visibleBookmarks.length && <Text style={[styles.muted, darkMode && styles.accountDarkMutedText]}>No matching bookmarks.</Text>}
                </>
              )}
            </View>
          )}

          <View style={styles.mobileReaderPicker}>
            {bookPickerSections.map((section) => (
              <View key={section.id || section.title} style={styles.mobileReaderDropdown}>
                <Pressable
                  onPress={() => onToggleMobileMenu(mobileMenu === section.id ? null : section.id)}
                  style={[styles.mobileReaderDropdownButton, darkMode && styles.accountDarkInsetBox]}
                >
                  <Text style={[styles.mobileReaderDropdownText, darkMode && styles.accountDarkTitle]}>{section.title}</Text>
                  <Ionicons name={mobileMenu === section.id ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={darkMode ? "#c8bda9" : colors.muted} />
                </Pressable>
                {mobileMenu === section.id && (
                  <View style={styles.mobileReaderBookList}>
                    {section.books.map((book) => (
                      <View key={book} style={[styles.mobileReaderBookBlock, expandedBook === book && styles.expandedMobileReaderBookBlock]}>
                        <Pressable
                          onPress={() => onSelectMobileBook(book)}
                          style={[styles.mobileReaderBookOption, darkMode && styles.printDarkOptionChip, readerBook === book && styles.activeMobileReaderBookOption]}
                        >
                          <Text style={[styles.mobileReaderBookText, darkMode && styles.accountDarkMutedText, readerBook === book && styles.activeMobileReaderBookText]}>{book}</Text>
                        </Pressable>
                        {expandedBook === book && (
                          <View style={[styles.mobileReaderChapterPanel, darkMode && styles.accountDarkSection]}>
                            <View style={styles.readerChapterPanelHeader}>
                              <Text style={[styles.readerBookSectionTitle, darkMode && styles.studyDarkAccentText]}>{book}</Text>
                              <Text style={[styles.readerChapterReadCountText, darkMode && styles.accountDarkMutedText]}>{getReadProgressLabel(book)}</Text>
                            </View>
                            <View style={styles.mobileReaderChapterGrid}>
                              {Array.from({ length: BIBLE_CHAPTER_COUNTS[book] || 1 }, (_, index) => index + 1).map((chapter) => {
                                const chapterRead = getReadChapterSet(book).has(chapter);
                                const chapterActive = readerBook === book && readerChapter === chapter;
                                return (
                                  <Pressable
                                    key={chapter}
                                    accessibilityRole="button"
                                    accessibilityLabel={`${book} chapter ${chapter}${chapterRead ? ", read" : ""}`}
                                    onPress={() => onSelectChapter(chapter, book)}
                                    style={[
                                      styles.mobileReaderChapterSquare,
                                      darkMode && styles.printDarkOptionChip,
                                      chapterRead && styles.readMobileReaderChapterSquare,
                                      darkMode && chapterRead && styles.darkReadMobileReaderChapterSquare,
                                      chapterActive && styles.activeMobileReaderChapterSquare
                                    ]}
                                  >
                                    <Text style={[
                                      styles.mobileReaderChapterText,
                                      darkMode && styles.accountDarkMutedText,
                                      chapterRead && styles.readMobileReaderChapterText,
                                      darkMode && chapterRead && styles.darkReadMobileReaderChapterText,
                                      chapterActive && styles.activeMobileReaderChapterText
                                    ]}>{chapter}</Text>
                                    {chapterRead && (
                                      <Ionicons name="checkmark" size={10} color={chapterActive ? "white" : (darkMode ? "#e9b76a" : colors.oliveDark)} />
                                    )}
                                  </Pressable>
                                );
                              })}
                            </View>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
            {!bookPickerSections.length && <Text style={[styles.muted, darkMode && styles.accountDarkMutedText]}>No matching books found.</Text>}
          </View>

          {activeBibleReadingPlan ? (
            <View style={styles.bibleReadingPlanStack}>
              <View style={[styles.bibleReadingPlanPanel, darkMode && styles.accountDarkSection]}>
                <View style={styles.bibleReadingPlanHeader}>
                  <View style={styles.bibleReadingPlanTitleBlock}>
                    <Eyebrow>Reading Plan</Eyebrow>
                    <Text numberOfLines={2} style={[styles.cardTitle, darkMode && styles.accountDarkTitle]}>
                      {activeBibleReadingPlan.title}
                    </Text>
                  </View>
                  <Text style={[styles.draftPill, styles.readingPlanCountPill, darkMode && styles.plansDarkDraftPill]}>
                    {activePlanCompletedCount}/{activePlanDayCount}
                  </Text>
                </View>

                {activeBibleReadingPlanToday ? (
                  <>
                    <View style={styles.planProgressTrack}>
                      <View style={[styles.planProgressFill, activeBibleReadingPlanComplete && styles.completedPlanProgressFill, { width: `${activePlanProgressPercent}%` }]} />
                    </View>
                    <View style={styles.bibleReadingPlanMetaRow}>
                      <Text style={[styles.bibleReadingPlanMetaChip, darkMode && styles.plansDarkDraftPill]}>
                        {activeBibleReadingPlanComplete ? "Completed" : `${activePlanRemainingCount} remaining`}
                      </Text>
                      <Text style={[styles.bibleReadingPlanMetaChip, darkMode && styles.plansDarkDraftPill]}>
                        {activePlanDayCount} day{activePlanDayCount === 1 ? "" : "s"}
                      </Text>
                    </View>

                    <Pressable
                      accessibilityRole={activeBibleReadingPlanComplete ? undefined : "button"}
                      accessibilityLabel={activeBibleReadingPlanComplete ? undefined : `Open reading ${activeBibleReadingPlanToday.reference}`}
                      onPress={activeBibleReadingPlanComplete ? undefined : onOpenActivePlanReading}
                      style={[styles.bibleReadingPlanToday, !activeBibleReadingPlanComplete && styles.clickableBibleReadingPlanToday, darkMode && styles.accountDarkInsetBox]}
                    >
                      <View style={styles.bibleReadingPlanTodayHeader}>
                        <View style={styles.bibleReadingPlanTodayTitleBlock}>
                          <Text numberOfLines={2} style={[styles.readerBookSectionTitle, darkMode && styles.studyDarkAccentText]}>
                            {activeBibleReadingPlanTodayLabel || (activeBibleReadingPlanComplete ? "Plan complete" : `Next reading: Day ${activeBibleReadingPlanToday.day}`)}
                          </Text>
                          <Text numberOfLines={2} style={[styles.readerReadChapterBookTitle, darkMode && styles.accountDarkTitle]}>
                            {activeBibleReadingPlanComplete ? "Choose a new plan or keep reviewing." : activeBibleReadingPlanToday.reference}
                          </Text>
                        </View>
                        <Ionicons name={activeBibleReadingPlanComplete ? "checkmark-circle" : "calendar-outline"} size={20} color={darkMode ? "#e9b76a" : activeBibleReadingPlanComplete ? colors.oliveDark : colors.coral} />
                    </View>
                  </Pressable>
                  {!!biblePlanStatus && (
                    <Text style={[styles.bibleReadingPlanStatusText, darkMode && styles.studyDarkAccentText]}>{biblePlanStatus}</Text>
                  )}
                  </>
                ) : (
                  <Text style={[styles.muted, darkMode && styles.accountDarkMutedText]}>Choose another plan or keep reviewing completed passages.</Text>
                )}
              </View>
              {otherActiveBibleReadingPlans.map((plan) => (
                <View key={plan.id} style={[styles.bibleReadingPlanPanel, darkMode && styles.accountDarkSection]}>
                  <View style={styles.bibleReadingPlanHeader}>
                    <View style={styles.bibleReadingPlanTitleBlock}>
                      <Eyebrow>Reading Plan</Eyebrow>
                      <Text numberOfLines={2} style={[styles.cardTitle, darkMode && styles.accountDarkTitle]}>
                        {plan.title}
                      </Text>
                    </View>
                    <Text style={[styles.draftPill, styles.readingPlanCountPill, darkMode && styles.plansDarkDraftPill]}>
                      {plan.completedCount}/{plan.dayCount}
                    </Text>
                  </View>
                  <View style={styles.planProgressTrack}>
                    <View style={[styles.planProgressFill, plan.complete && styles.completedPlanProgressFill, { width: `${Math.min(100, Math.max(0, plan.progressPercent))}%` }]} />
                  </View>
                  <View style={styles.bibleReadingPlanMetaRow}>
                    <Text style={[styles.bibleReadingPlanMetaChip, darkMode && styles.plansDarkDraftPill]}>
                      {plan.complete ? "Completed" : `${plan.remainingCount} remaining`}
                    </Text>
                    <Text style={[styles.bibleReadingPlanMetaChip, darkMode && styles.plansDarkDraftPill]}>
                      {plan.dayCount} day{plan.dayCount === 1 ? "" : "s"}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole={plan.complete ? undefined : "button"}
                    accessibilityLabel={plan.complete ? undefined : `Open ${plan.title} reading ${plan.reference}`}
                    onPress={plan.complete ? undefined : () => onOpenFollowedPlanReading(plan.id)}
                    style={[styles.bibleReadingPlanToday, !plan.complete && styles.clickableBibleReadingPlanToday, darkMode && styles.accountDarkInsetBox]}
                  >
                    <View style={styles.bibleReadingPlanTodayHeader}>
                      <View style={styles.bibleReadingPlanTodayTitleBlock}>
                        <Text numberOfLines={2} style={[styles.readerBookSectionTitle, darkMode && styles.studyDarkAccentText]}>
                          {plan.complete ? "Plan complete" : plan.overdue ? plan.label : `Next reading: ${plan.label}`}
                        </Text>
                        <Text numberOfLines={2} style={[styles.readerReadChapterBookTitle, darkMode && styles.accountDarkTitle]}>
                          {plan.complete ? "Choose a new plan or keep reviewing." : plan.reference}
                        </Text>
                      </View>
                      <Ionicons name={plan.complete ? "checkmark-circle" : "calendar-outline"} size={20} color={darkMode ? "#e9b76a" : plan.complete ? colors.oliveDark : colors.coral} />
                    </View>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.bibleReadingPlanStarter, darkMode && styles.accountDarkSection]}>
              <Eyebrow>Reading Plans</Eyebrow>
              <Text style={[styles.readerBookSectionTitle, darkMode && styles.accountDarkTitle]}>Choose a reading plan from the Plans tab.</Text>
              <AppButton label="Browse plans" variant="secondary" onPress={onOpenPlansTab} style={darkMode && styles.homeDarkResumeButton} labelStyle={darkMode && styles.homeDarkResumeButtonText} />
            </View>
          )}
        </>
      )}
    </Card>
  );
}

function ReadChapterBookCard({
  styles,
  darkMode,
  phoneLayout,
  section,
  active,
  activeChapter,
  onSelectChapter,
  onClearReadBook
}: {
  styles: any;
  darkMode: boolean;
  phoneLayout: boolean;
  section: { book: string; chapters: number[] };
  active: boolean;
  activeChapter: number;
  onSelectChapter: (chapter: number, book: string) => void;
  onClearReadBook: (book: string) => void;
}) {
  const [clearRevealed, setClearRevealed] = useState(false);
  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => phoneLayout && Math.abs(gesture.dx) > 18 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -35) setClearRevealed(true);
        if (gesture.dx > 25) setClearRevealed(false);
      }
    }),
    [phoneLayout]
  );

  const clearBook = () => {
    setClearRevealed(false);
    onClearReadBook(section.book);
  };

  return (
    <View style={styles.readerReadChapterSwipeWrap} {...(phoneLayout ? panResponder.panHandlers : {})}>
      {phoneLayout && clearRevealed && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Clear read chapters for ${section.book}`}
          onPress={clearBook}
          style={styles.readerReadChapterSwipeClear}
        >
          <Ionicons name="trash-outline" size={16} color="white" />
          <Text style={styles.readerReadChapterSwipeClearText}>Clear</Text>
        </Pressable>
      )}
      <View
        style={[
          styles.readerReadChapterBook,
          darkMode && styles.accountDarkInsetBox,
          phoneLayout && clearRevealed && styles.readerReadChapterBookRevealed
        ]}
      >
        <View style={styles.readerReadChapterBookHeader}>
          <Text style={[styles.readerReadChapterBookTitle, darkMode && styles.accountDarkTitle]}>{section.book}</Text>
          <View style={styles.readerReadChapterBookMeta}>
            <Text style={[styles.readerBookmarkCount, darkMode && styles.accountDarkMutedText]}>{`${section.chapters.length} of ${BIBLE_CHAPTER_COUNTS[section.book] || 1}`}</Text>
            {!phoneLayout && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Clear read chapters for ${section.book}`}
                onPress={clearBook}
                style={styles.readerReadChapterClearButton}
              >
                <Text style={styles.readerProgressClearText}>Clear</Text>
              </Pressable>
            )}
          </View>
        </View>
        <View style={styles.readerReadChapterGrid}>
          {section.chapters.map((chapter) => (
            <Pressable
              key={`${section.book}-${chapter}`}
              accessibilityRole="button"
              accessibilityLabel={`Open ${section.book} chapter ${chapter}`}
              onPress={() => {
                setClearRevealed(false);
                onSelectChapter(chapter, section.book);
              }}
              style={[
                styles.readerReadChapterChip,
                darkMode && styles.printDarkOptionChip,
                active && activeChapter === chapter && styles.activeMobileReaderChapterSquare
              ]}
            >
              <Text
                style={[
                  styles.readerReadChapterChipText,
                  darkMode && styles.accountDarkMutedText,
                  active && activeChapter === chapter && styles.activeMobileReaderChapterText
                ]}
              >
                {chapter}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
