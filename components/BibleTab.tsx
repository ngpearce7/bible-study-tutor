import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { AppButton, Card, Eyebrow, colors } from "@/components/ui";
import { BibleReaderControls } from "@/components/BibleReaderControls";
import { BibleReaderNavigator } from "@/components/BibleReaderNavigator";
import { BibleReaderPassage } from "@/components/BibleReaderPassage";
import { BibleSearchPanel } from "@/components/BibleSearchPanel";

export function BibleTab({
  styles,
  compactLayout,
  phoneLayout,
  bibleDarkMode,
  readerNavCollapsed,
  translations,
  bibleTranslation,
  readBibleChapterCount,
  readBibleChapters,
  currentBookReadChapterCount,
  bibleBookmarks,
  bibleReaderHistory,
  readerHistoryCollapsed,
  bookmarksCollapsed,
  bookmarksExpanded,
  bookmarkNotesOnly,
  bookmarkSearch,
  readerBookSearch,
  visibleBibleBookmarks,
  filteredBibleBookmarks,
  activeBookmarkNoteId,
  bookmarkNoteDraft,
  readerMobileMenu,
  expandedMobileReaderBook,
  readerBook,
  readerChapter,
  readerBookSections,
  bibleReadingPlans,
  activeBibleReadingPlanId,
  activeBibleReadingPlan,
  activeBibleReadingPlanToday,
  activeBibleReadingPlanCompletedCount,
  activeBibleReadingPlanComplete,
  onSelectBibleReadingPlan,
  onOpenBibleReadingPlanDay,
  onMarkBibleReadingPlanDayComplete,
  onStudyBibleReadingPlanDay,
  onToggleReaderNavCollapsed,
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
  onSelectChapter,
  onClearReadBook,
  bibleSearchCollapsed,
  bibleSearchQuery,
  bibleSearchScope,
  bibleSearchMode,
  bibleSearchBook,
  bibleSearchBookOptions,
  bibleSearchBookMenuOpen,
  bibleSearchCriteriaOpen,
  bibleSearchTranslation,
  bibleSearchStatus,
  bibleSearchDuration,
  bibleSearchActiveQuery,
  bibleSearchSections,
  onToggleBibleSearchCollapsed,
  onBibleSearchQueryChange,
  onRunBibleSearch,
  onClearBibleSearch,
  onToggleBibleSearchCriteria,
  onSelectBibleSearchScope,
  onSelectBibleSearchMode,
  onToggleBibleSearchBookMenu,
  onSelectBibleSearchBook,
  onBibleSearchSummaryLayout,
  renderBibleSearchResultActions,
  readerStudyReference,
  readerChapterDraft,
  readerChapterCount,
  selectedReaderVerses,
  currentChapterRead,
  currentChapterBookmarked,
  readerIconTooltip,
  onStudyReaderChapter,
  onClearReaderSelection,
  onMoveReaderChapter,
  onChapterDraftChange,
  onCommitChapter,
  onToggleChapterRead,
  onBookmarkChapter,
  onClearReadingProgress,
  readerIconHoverProps,
  hideReaderTooltip,
  readerPassage,
  readerStatus,
  readerMemoryStatus,
  activeReaderActionVerse,
  readerMemoryVerseKeys,
  currentSelectionBookmarked,
  currentSelectionBookmark,
  selectedReaderVersesAlreadyInMemory,
  onPassageLayout,
  onVerseLayout,
  onToggleVerse,
  onBookmarkSelection,
  onOpenNote,
  onPrintWorksheet,
  onSaveMemory,
  isVerseBookmarked,
  isVerseNoted
}: any) {
  return (
    <View style={[styles.bibleReaderLayout, compactLayout && styles.stackedLayout, bibleDarkMode && styles.accountDarkLayout]}>
      <BibleReaderNavigator
        styles={styles}
        darkMode={bibleDarkMode}
        phoneLayout={phoneLayout}
        compactLayout={compactLayout}
        collapsed={readerNavCollapsed}
        translations={translations}
        translationId={bibleTranslation}
        readChapterCount={readBibleChapterCount}
        readChapters={readBibleChapters}
        bookmarks={bibleBookmarks}
        history={bibleReaderHistory}
        historyCollapsed={readerHistoryCollapsed}
        bookmarksCollapsed={bookmarksCollapsed}
        bookmarksExpanded={bookmarksExpanded}
        bookmarkNotesOnly={bookmarkNotesOnly}
        bookmarkSearch={bookmarkSearch}
        bookSearch={readerBookSearch}
        visibleBookmarks={visibleBibleBookmarks}
        filteredBookmarksCount={filteredBibleBookmarks.length}
        activeBookmarkNoteId={activeBookmarkNoteId}
        bookmarkNoteDraft={bookmarkNoteDraft}
        mobileMenu={readerMobileMenu}
        expandedBook={expandedMobileReaderBook}
        readerBook={readerBook}
        readerChapter={readerChapter}
        readerBookSections={readerBookSections}
        onToggleCollapsed={onToggleReaderNavCollapsed}
        onSelectTranslation={onSelectTranslation}
        onBookSearchChange={onBookSearchChange}
        onToggleHistoryCollapsed={onToggleHistoryCollapsed}
        onClearHistory={onClearHistory}
        onOpenHistoryItem={onOpenHistoryItem}
        onToggleBookmarksCollapsed={onToggleBookmarksCollapsed}
        onBookmarkSearchChange={onBookmarkSearchChange}
        onToggleBookmarkNotesOnly={onToggleBookmarkNotesOnly}
        onOpenBookmark={onOpenBookmark}
        onOpenBookmarkNote={onOpenBookmarkNote}
        onRemoveBookmark={onRemoveBookmark}
        onBookmarkNoteDraftChange={onBookmarkNoteDraftChange}
        onSaveBookmarkNote={onSaveBookmarkNote}
        onDeleteBookmarkNote={onDeleteBookmarkNote}
        onCancelBookmarkNote={onCancelBookmarkNote}
        onToggleBookmarksExpanded={onToggleBookmarksExpanded}
        onToggleMobileMenu={onToggleMobileMenu}
        onSelectMobileBook={onSelectMobileBook}
        onSelectBook={onSelectBook}
        onSelectChapter={onSelectChapter}
        onClearReadBook={onClearReadBook}
      />

      <Card style={[styles.bibleReaderContentCard, compactLayout && styles.fluidCard, bibleDarkMode && styles.accountDarkMainCard]}>
        <View style={[styles.bibleReadingPlanPanel, bibleDarkMode && styles.accountDarkSection]}>
          <View style={styles.bibleReadingPlanHeader}>
            <View style={styles.bibleReadingPlanTitleBlock}>
              <Eyebrow>Reading Plan</Eyebrow>
              <Text style={[styles.cardTitle, bibleDarkMode && styles.accountDarkTitle]}>{activeBibleReadingPlan.title}</Text>
            </View>
            <Text style={[styles.draftPill, bibleDarkMode && styles.plansDarkDraftPill]}>
              {activeBibleReadingPlanCompletedCount}/{activeBibleReadingPlan.days.length}
            </Text>
          </View>

          <View style={[styles.bibleReadingPlanChooser, phoneLayout && styles.phoneBibleReadingPlanChooser]}>
            {bibleReadingPlans.map((plan: any) => (
              <Pressable
                key={plan.id}
                accessibilityRole="button"
                accessibilityLabel={`Choose ${plan.title} reading plan`}
                onPress={() => onSelectBibleReadingPlan(plan.id)}
                style={[styles.bibleReadingPlanChip, bibleDarkMode && styles.printDarkOptionChip, activeBibleReadingPlanId === plan.id && styles.activeReaderBookChip]}
              >
                <Text numberOfLines={1} style={[styles.bibleReadingPlanChipText, bibleDarkMode && styles.accountDarkMutedText, activeBibleReadingPlanId === plan.id && styles.activeReaderBookText]}>
                  {plan.title}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.planProgressTrack}>
            <View style={[styles.planProgressFill, { width: `${Math.min(100, (activeBibleReadingPlanCompletedCount / activeBibleReadingPlan.days.length) * 100)}%` }]} />
          </View>

          <View style={[styles.bibleReadingPlanToday, bibleDarkMode && styles.accountDarkInsetBox]}>
            <View style={styles.bibleReadingPlanTodayHeader}>
              <View style={styles.bibleReadingPlanTodayTitleBlock}>
                <Text style={[styles.readerBookSectionTitle, bibleDarkMode && styles.studyDarkAccentText]}>
                  {activeBibleReadingPlanComplete ? "Plan complete" : `Today: Day ${activeBibleReadingPlanToday.day}`}
                </Text>
                <Text style={[styles.readerReadChapterBookTitle, bibleDarkMode && styles.accountDarkTitle]}>
                  {activeBibleReadingPlanComplete ? "Choose a new plan or keep reviewing." : activeBibleReadingPlanToday.reference}
                </Text>
              </View>
              <Ionicons name={activeBibleReadingPlanComplete ? "checkmark-circle" : "calendar-outline"} size={20} color={bibleDarkMode ? "#e9b76a" : colors.coral} />
            </View>
            <Text style={[styles.muted, bibleDarkMode && styles.accountDarkMutedText]}>{activeBibleReadingPlan.description}</Text>
            {!activeBibleReadingPlanComplete && (
              <View style={[styles.bibleReadingPlanActions, phoneLayout && styles.phoneBibleReadingPlanActions]}>
                <AppButton label="Open passage" variant="secondary" onPress={() => onOpenBibleReadingPlanDay(activeBibleReadingPlanToday)} style={[phoneLayout && styles.phonePlanSecondaryButton, bibleDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phonePlanButtonLabel, bibleDarkMode && styles.homeDarkResumeButtonText]} />
                <AppButton label="Mark complete" onPress={() => onMarkBibleReadingPlanDayComplete(activeBibleReadingPlanToday)} style={phoneLayout && styles.phonePlanPrimaryButton} labelStyle={phoneLayout && styles.phonePlanButtonLabel} />
                <AppButton label="Study passage" variant="secondary" onPress={() => onStudyBibleReadingPlanDay(activeBibleReadingPlanToday)} style={[phoneLayout && styles.phonePlanSecondaryButton, bibleDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phonePlanButtonLabel, bibleDarkMode && styles.homeDarkResumeButtonText]} />
              </View>
            )}
          </View>
        </View>

        <BibleSearchPanel
          styles={styles}
          darkMode={bibleDarkMode}
          phoneLayout={phoneLayout}
          collapsed={bibleSearchCollapsed}
          query={bibleSearchQuery}
          scope={bibleSearchScope}
          mode={bibleSearchMode}
          book={bibleSearchBook}
          bookOptions={bibleSearchBookOptions}
          bookMenuOpen={bibleSearchBookMenuOpen}
          criteriaOpen={bibleSearchCriteriaOpen}
          translationLabel={bibleSearchTranslation}
          translationId={bibleTranslation}
          status={bibleSearchStatus}
          duration={bibleSearchDuration}
          activeQuery={bibleSearchActiveQuery}
          sections={bibleSearchSections}
          onToggleCollapsed={onToggleBibleSearchCollapsed}
          onQueryChange={onBibleSearchQueryChange}
          onRunSearch={onRunBibleSearch}
          onClearSearch={onClearBibleSearch}
          onToggleCriteria={onToggleBibleSearchCriteria}
          onSelectScope={onSelectBibleSearchScope}
          onSelectMode={onSelectBibleSearchMode}
          onToggleBookMenu={onToggleBibleSearchBookMenu}
          onSelectBook={onSelectBibleSearchBook}
          onSummaryLayout={onBibleSearchSummaryLayout}
          renderResultActions={renderBibleSearchResultActions}
        />

        <BibleReaderControls
          styles={styles}
          darkMode={bibleDarkMode}
          phoneLayout={phoneLayout}
          translationId={bibleTranslation}
          readerReference={readerStudyReference}
          chapterDraft={readerChapterDraft}
          chapterCount={readerChapterCount}
          selectedVerseCount={selectedReaderVerses.length}
          currentChapterRead={currentChapterRead}
          currentChapterBookmarked={currentChapterBookmarked}
          readChapterCount={readBibleChapterCount}
          currentBookReadChapterCount={currentBookReadChapterCount}
          tooltip={readerIconTooltip}
          onStudy={onStudyReaderChapter}
          onClearSelection={onClearReaderSelection}
          onMoveChapter={onMoveReaderChapter}
          onChapterDraftChange={onChapterDraftChange}
          onCommitChapter={onCommitChapter}
          onToggleChapterRead={onToggleChapterRead}
          onBookmarkChapter={onBookmarkChapter}
          onClearReadingProgress={onClearReadingProgress}
          readerIconHoverProps={readerIconHoverProps}
          hideReaderTooltip={hideReaderTooltip}
        />
        <BibleReaderPassage
          styles={styles}
          darkMode={bibleDarkMode}
          phoneLayout={phoneLayout}
          passage={readerPassage}
          status={readerStatus}
          memoryStatus={readerMemoryStatus}
          selectedVerses={selectedReaderVerses}
          activeActionVerse={activeReaderActionVerse}
          readerReference={readerStudyReference}
          memoryVerseKeys={readerMemoryVerseKeys}
          currentSelectionBookmarked={currentSelectionBookmarked}
          currentSelectionBookmark={currentSelectionBookmark}
          selectedVersesAlreadyInMemory={selectedReaderVersesAlreadyInMemory}
          currentChapterRead={currentChapterRead}
          onPassageLayout={onPassageLayout}
          onVerseLayout={onVerseLayout}
          onToggleVerse={onToggleVerse}
          onOpenStudy={onStudyReaderChapter}
          onBookmarkSelection={onBookmarkSelection}
          onOpenNote={onOpenNote}
          onPrintWorksheet={onPrintWorksheet}
          onSaveMemory={onSaveMemory}
          onClearSelection={onClearReaderSelection}
          onMoveChapter={onMoveReaderChapter}
          onToggleChapterRead={onToggleChapterRead}
          isVerseBookmarked={isVerseBookmarked}
          isVerseNoted={isVerseNoted}
        />
      </Card>
    </View>
  );
}
