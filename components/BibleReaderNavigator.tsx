import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { BIBLE_CHAPTER_COUNTS, NEW_TESTAMENT_BOOKS, OLD_TESTAMENT_BOOKS } from "@/data/bibleLibrary";
import { Card, Eyebrow, colors } from "@/components/ui";

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
  onToggleCollapsed: () => void;
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
  onSelectBook: (book: string) => void;
  onSelectChapter: (chapter: number, book: string) => void;
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
  onToggleCollapsed,
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
  onSelectBook,
  onSelectChapter
}: BibleReaderNavigatorProps) {
  const [quickListView, setQuickListView] = useState<ReaderQuickListView>("recent");
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
                        <View key={section.book} style={[styles.readerReadChapterBook, darkMode && styles.accountDarkInsetBox]}>
                          <View style={styles.readerReadChapterBookHeader}>
                            <Text style={[styles.readerReadChapterBookTitle, darkMode && styles.accountDarkTitle]}>{section.book}</Text>
                            <Text style={[styles.readerBookmarkCount, darkMode && styles.accountDarkMutedText]}>{`${section.chapters.length} of ${BIBLE_CHAPTER_COUNTS[section.book] || 1}`}</Text>
                          </View>
                          <View style={styles.readerReadChapterGrid}>
                            {section.chapters.map((chapter) => (
                              <Pressable
                                key={`${section.book}-${chapter}`}
                                accessibilityRole="button"
                                accessibilityLabel={`Open ${section.book} chapter ${chapter}`}
                                onPress={() => onSelectChapter(chapter, section.book)}
                                style={[
                                  styles.readerReadChapterChip,
                                  darkMode && styles.printDarkOptionChip,
                                  readerBook === section.book && readerChapter === chapter && styles.activeMobileReaderChapterSquare
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.readerReadChapterChipText,
                                    darkMode && styles.accountDarkMutedText,
                                    readerBook === section.book && readerChapter === chapter && styles.activeMobileReaderChapterText
                                  ]}
                                >
                                  {chapter}
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                        </View>
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

          {phoneLayout ? (
            <View style={styles.mobileReaderPicker}>
              {[
                { id: "old" as ReaderMobileMenu, title: "Old Testament", books: OLD_TESTAMENT_BOOKS },
                { id: "new" as ReaderMobileMenu, title: "New Testament", books: NEW_TESTAMENT_BOOKS }
              ].map((section) => (
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
            </View>
          ) : (
            <View style={styles.readerBookSections}>
              {readerBookSections.map((section) => (
                <View key={section.title} style={styles.readerBookSection}>
                  <Text style={[styles.readerBookSectionTitle, darkMode && styles.studyDarkAccentText]}>{section.title}</Text>
                  <View style={styles.desktopReaderBookList}>
                    {section.books.map((book) => (
                      <View key={book} style={[styles.desktopReaderBookBlock, expandedBook === book && styles.expandedDesktopReaderBookBlock]}>
                        <Pressable
                          onPress={() => onSelectBook(book)}
                          style={[styles.readerBookChip, darkMode && styles.printDarkOptionChip, readerBook === book && styles.activeReaderBookChip]}
                        >
                          <Text style={[styles.readerBookText, darkMode && styles.accountDarkMutedText, readerBook === book && styles.activeReaderBookText]}>{book}</Text>
                        </Pressable>
                        {expandedBook === book && (
                          <View style={[styles.desktopReaderChapterPanel, darkMode && styles.accountDarkSection]}>
                            <View style={styles.desktopReaderChapterHeader}>
                              <Text style={[styles.readerBookSectionTitle, darkMode && styles.studyDarkAccentText]}>{book}</Text>
                              <Text style={[styles.readerChapterCountText, darkMode && styles.accountDarkMutedText]}>{getReadProgressLabel(book)}</Text>
                            </View>
                            <View style={styles.desktopReaderChapterGrid}>
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
                </View>
              ))}
              {!readerBookSections.length && <Text style={[styles.muted, darkMode && styles.accountDarkMutedText]}>No matching books found.</Text>}
            </View>
          )}
        </>
      )}
    </Card>
  );
}
