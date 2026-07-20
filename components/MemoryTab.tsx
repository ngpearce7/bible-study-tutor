// @ts-nocheck
import Ionicons from "@expo/vector-icons/Ionicons";
import { Suspense } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { COMMON_MEMORY_REVIEW_OPTIONS, MORE_MEMORY_REVIEW_OPTIONS, formatMemoryHistoryDate, getMemoryVerseCollections, isMemoryVerseDue, memoryHistoryEventIcon, memoryHistoryEventLabel, memoryPracticeLabel, memoryReviewDateLabel, memoryVerseProgressDetail, memoryVerseProgressMessage, normalizeMemoryAnswer, reviewPresetForStoredRhythm } from "@/data/memory";
import { AppButton, Card, Eyebrow, colors } from "@/components/ui";
import { MemoryBlank } from "@/components/MemoryBlank";
import { MemoryHistoryPanel } from "@/components/MemoryHistoryPanel";

export function MemoryTab(props: any) {
  const {
    activeMemoryCollectionDueCount,
    activeMemoryCollectionName,
    activeMemoryMeditationVerseId,
    activeMemoryReviewQueueCount,
    activeMemoryReviewQueueIndex,
    activeMemoryVerseId,
    addMemoryPanelOpen,
    addMemoryVerseCollection,
    bulkReviewOptionsExpanded,
    clearMemoryBrowseFilters,
    closeMemoryMeditation,
    collectionMemoryVerseId,
    communitySubView,
    compactLayout,
    continueMemoryPractice,
    currentBrowseMemoryVerses,
    currentBrowseReviewPreset,
    deleteMemoryVerse,
    dueMemoryCount,
    dueMemoryReviewSort,
    expandedMemoryFilterBook,
    expandedMemoryVerseIds,
    expandedReviewOptionsVerseId,
    firstName,
    focusMemoryBlankAfter,
    friendlyName,
    historyMemoryVerseId,
    memoryBlankInputRefs,
    memoryBlankTokens,
    memoryBookCounts,
    memoryBookFilter,
    memoryBookSections,
    memoryBrowseFilterSummary,
    memoryBrowseFiltersOpen,
    memoryBrowseSections,
    memoryBrowseStatusFilter,
    memoryChapterFilter,
    memoryChaptersByBook,
    memoryCollectionDraft,
    memoryCollectionFilter,
    memoryCollectionOptions,
    memoryCollectionPickerOpen,
    memoryDarkMode,
    memoryFilterMobileMenu,
    memoryHintLevels,
    memoryHintsVisible,
    memoryHistoryEncouragement,
    memoryHistoryExpanded,
    memoryHistoryItems,
    memoryHistorySummary,
    memoryMeditationCarry,
    memoryMeditationPhrase,
    memoryMeditationPrayer,
    memoryMeditationReflection,
    memoryMeditationStep,
    memoryMilestoneGoalIds,
    memoryMilestonePickerOpen,
    memoryMilestoneStatus,
    memoryMilestones,
    memoryMoreVerseId,
    memoryPracticeAllCorrect,
    memoryPracticeAnswers,
    memoryPracticeChecked,
    memoryPracticeLevel,
    memoryPracticeResult,
    memoryPracticeText,
    memoryPracticeTokens,
    memorySearch,
    memoryStatus,
    memoryToolbarMoreOpen,
    memoryVerses,
    memoryView,
    memoryWeeklyScripture,
    memoryWeeklySummary,
    Metric,
    moveMemoryPracticeStep,
    neglectedMemoryVerses,
    openMemoryBookCollectionBuilder,
    openMemoryPrintOptions,
    pendingDeleteMemoryVerseId,
    phoneLayout,
    phoneMemoryFocusMode,
    removeMemoryVerseCollection,
    repeatMemoryPracticeStep,
    reviewScheduleVerseId,
    ResumeButton,
    reviewedMemoryReviewSort,
    reviewedTodayCount,
    saveMemoryMeditation,
    saveMemoryVerseCollections,
    scheduleFilteredMemoryReview,
    scheduleMemoryVerseReview,
    selectMemoryFilterBook,
    selectMemoryFilterChapter,
    setActiveMemoryVerseId,
    setAddMemoryPanelOpen,
    setBulkReviewOptionsExpanded,
    setCollectionMemoryVerseId,
    setDueMemoryReviewSort,
    setExpandedMemoryVerseIds,
    setExpandedReviewOptionsVerseId,
    setHistoryMemoryVerseId,
    setMemoryBrowseFiltersOpen,
    setMemoryBrowseStatusFilter,
    setMemoryCollectionDraft,
    setMemoryCollectionFilter,
    setMemoryCollectionPickerOpen,
    setMemoryFilterMobileMenu,
    setMemoryHintsVisible,
    setMemoryHistoryExpanded,
    setMemoryMeditationCarry,
    setMemoryMeditationPhrase,
    setMemoryMeditationPrayer,
    setMemoryMeditationReflection,
    setMemoryMeditationStep,
    setMemoryMilestonePickerOpen,
    setMemoryMoreVerseId,
    setMemorySearch,
    setMemoryToolbarMoreOpen,
    setMemoryView,
    setReviewScheduleVerseId,
    setReviewedMemoryReviewSort,
    setTab,
    shortBibleTranslationName,
    showMoreMemoryHint,
    startDueMemoryReviewQueue,
    startMemoryMeditation,
    startMemoryPractice,
    stopMemoryReviewQueue,
    styles,
    submitMemoryPractice,
    toggleMemoryMilestoneGoal,
    updateMemoryPracticeAnswer,
    visibleMemoryHistoryItems,
    visibleMemorySections
  } = props;

  return (
    <View style={[styles.layout, compactLayout && styles.stackedLayout, communitySubView === "history" && styles.focusLayout, memoryDarkMode && styles.accountDarkLayout]}>
      <Card style={[styles.mainCard, compactLayout && styles.fluidCard, communitySubView === "history" && styles.focusMainCard, memoryDarkMode && styles.accountDarkMainCard]}>
        <View style={phoneLayout ? styles.phoneMemoryHeaderRow : undefined}>
          <Eyebrow>Memory</Eyebrow>
          {phoneLayout && !phoneMemoryFocusMode && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={addMemoryPanelOpen ? "Hide add memory verse options" : "Add memory verses"}
              onPress={() => setAddMemoryPanelOpen((open) => !open)}
              style={[styles.phoneMemoryHeaderAddButton, memoryDarkMode && styles.homeDarkIconBubble]}
            >
              <Ionicons name="add-circle-outline" size={24} color={memoryDarkMode ? "#e9b76a" : colors.coral} />
            </Pressable>
          )}
        </View>
        <Text style={[styles.title, memoryDarkMode && styles.accountDarkTitle]}>{firstName ? `${firstName}, memorize saved verses` : "Memorize saved verses"}</Text>
        {!phoneMemoryFocusMode && (
          <>
            {!phoneLayout && <Text style={[styles.titleSupport, styles.memoryTitleSupport, memoryDarkMode && styles.accountDarkMutedText]}>Hide a little at a time and carry Scripture with you through the day.</Text>}
            {phoneLayout && addMemoryPanelOpen && (
              <View style={[styles.phoneMemoryHeaderAddPanel, memoryDarkMode && styles.accountDarkInsetBox]}>
                <View style={styles.phoneAddMemoryActions}>
                  <AppButton
                    label="Bible"
                    onPress={() => {
                      setAddMemoryPanelOpen(false);
                      setTab("bible");
                    }}
                    style={styles.phoneMemoryAddActionButton}
                  />
                  <AppButton
                    label="Study"
                    variant="secondary"
                    onPress={() => {
                      setAddMemoryPanelOpen(false);
                      setTab("study");
                    }}
                    style={[styles.phoneMemoryAddActionButton, memoryDarkMode && styles.homeDarkResumeButton]}
                    labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText}
                  />
                  <AppButton
                    label="Collection"
                    variant="secondary"
                    onPress={openMemoryBookCollectionBuilder}
                    style={[styles.phoneMemoryAddActionButton, memoryDarkMode && styles.homeDarkResumeButton]}
                    labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText}
                  />
                </View>
              </View>
            )}
            <View style={[styles.metricGrid, phoneLayout && styles.phoneMemoryMetricGrid]}>
              <Metric value={(memoryVerses || []).length} label="saved" compact={phoneLayout} style={memoryDarkMode && styles.homeDarkMetric} valueStyle={memoryDarkMode && styles.homeDarkMetricValue} labelStyle={memoryDarkMode && styles.accountDarkMutedText} />
              <Metric value={dueMemoryCount} label="due now" compact={phoneLayout} style={memoryDarkMode && styles.homeDarkMetric} valueStyle={memoryDarkMode && styles.homeDarkMetricValue} labelStyle={memoryDarkMode && styles.accountDarkMutedText} />
              <Metric value={reviewedTodayCount} label="reviewed today" compact={phoneLayout} labelLines={2} style={memoryDarkMode && styles.homeDarkMetric} valueStyle={memoryDarkMode && styles.homeDarkMetricValue} labelStyle={memoryDarkMode && styles.accountDarkMutedText} />
            </View>
          </>
        )}
        {phoneMemoryFocusMode && (
          <View style={[styles.memoryFocusBanner, memoryDarkMode && styles.memoryDarkFocusBanner]}>
            <Ionicons name={activeMemoryMeditationVerseId ? "leaf-outline" : "school-outline"} size={18} color={colors.coral} />
            <Text style={[styles.memoryFocusBannerText, memoryDarkMode && styles.accountDarkText]}>
              {activeMemoryMeditationVerseId
                ? "Meditation mode. Save or close this reflection to return to your saved list."
                : activeMemoryReviewQueueCount > 1 && activeMemoryReviewQueueIndex >= 0
                  ? `Review set ${activeMemoryReviewQueueIndex + 1} of ${activeMemoryReviewQueueCount}. Finish this verse to open the next one.`
                  : "Practice mode. Close or finish this verse to return to your saved list."}
            </Text>
            {activeMemoryReviewQueueCount > 0 && (
              <Pressable
                accessibilityRole="button"
                onPress={stopMemoryReviewQueue}
                style={[styles.memoryReviewQueueStopButton, memoryDarkMode && styles.homeDarkResumeButton]}
              >
                <Text style={[styles.memoryReviewQueueStopText, memoryDarkMode && styles.homeDarkResumeButtonText]}>Stop</Text>
              </Pressable>
            )}
          </View>
        )}
        {(memoryVerses || []).length === 0 ? (
          <View style={[styles.emptyJournalBox, memoryDarkMode && styles.accountDarkSection]}>
            <Ionicons name="sparkles-outline" size={24} color={colors.coral} />
            <Text style={[styles.emptyJournalTitle, memoryDarkMode && styles.accountDarkTitle]}>No memory verses yet</Text>
            <Text style={[styles.emptyJournalText, memoryDarkMode && styles.accountDarkMutedText]}>{`${friendlyName}, open the Bible, select one or more verses, then tap Memory. You can also save verses while studying.`}</Text>
            <View style={styles.emptyMemoryActions}>
              <AppButton label="Open Bible" onPress={() => setTab("bible")} />
              <AppButton label="Open Study" variant="secondary" onPress={() => setTab("study")} style={memoryDarkMode && styles.homeDarkResumeButton} labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText} />
              <AppButton label="Create collection" variant="secondary" onPress={openMemoryBookCollectionBuilder} style={memoryDarkMode && styles.homeDarkResumeButton} labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText} />
            </View>
          </View>
        ) : (
          <View style={styles.memoryList}>
            {!phoneLayout && !phoneMemoryFocusMode && memoryView !== "history" && (
              <View style={[styles.addMemoryBox, phoneLayout && styles.phoneAddMemoryBox, memoryDarkMode && styles.accountDarkSection]}>
                <View style={styles.addMemoryCopy}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={phoneLayout ? (addMemoryPanelOpen ? "Hide add memory verse options" : "Show add memory verse options") : undefined}
                    disabled={!phoneLayout}
                    onPress={() => setAddMemoryPanelOpen((open) => !open)}
                    style={[styles.addMemoryHeader, phoneLayout && styles.phoneAddMemoryHeader]}
                  >
                    <View style={[styles.feedbackHeader, phoneLayout && styles.phoneAddMemoryTitleBlock]}>
                      <Ionicons name="add-circle-outline" size={18} color={colors.coral} />
                      <View style={styles.addMemoryCopy}>
                        <Text style={[styles.feedbackTitle, phoneLayout && styles.phoneAddMemoryTitle, memoryDarkMode && styles.accountDarkTitle]}>{phoneLayout ? "Add verses" : "Add memory verses"}</Text>
                        {phoneLayout && <Text style={[styles.phoneAddMemorySubtitle, memoryDarkMode && styles.accountDarkMutedText]}>From Bible or Study</Text>}
                      </View>
                    </View>
                    {phoneLayout && (
                      <Ionicons
                        name={addMemoryPanelOpen ? "chevron-up-outline" : "chevron-down-outline"}
                        size={18}
                        color={memoryDarkMode ? "#e9b76a" : colors.oliveDark}
                      />
                    )}
                  </Pressable>
                  {!phoneLayout && <Text style={[styles.addMemoryText, memoryDarkMode && styles.accountDarkMutedText]}>Open the Bible, select verse/s, then tap Memory. You can also save verses from Study.</Text>}
                </View>
                {(!phoneLayout || addMemoryPanelOpen) && (
                  <View style={[styles.emptyMemoryActions, phoneLayout && styles.phoneAddMemoryActions]}>
                    <AppButton label={phoneLayout ? "Bible" : "Find in Bible"} onPress={() => setTab("bible")} style={phoneLayout && styles.phoneMemoryAddActionButton} />
                    <AppButton label={phoneLayout ? "Study" : "Open Study"} variant="secondary" onPress={() => setTab("study")} style={[phoneLayout && styles.phoneMemoryAddActionButton, memoryDarkMode && styles.homeDarkResumeButton]} labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText} />
                    <AppButton label="Collection" variant="secondary" onPress={openMemoryBookCollectionBuilder} style={[phoneLayout && styles.phoneMemoryAddActionButton, memoryDarkMode && styles.homeDarkResumeButton]} labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText} />
                  </View>
                )}
              </View>
            )}
            {!phoneMemoryFocusMode && (
              <>
                <View style={[styles.memoryModeToolbar, phoneLayout && styles.phoneMemoryModeToolbar]}>
                  <View style={[styles.memoryViewToggle, styles.memoryModeToggle, memoryDarkMode && styles.accountDarkSegmentedRow]}>
                    {[
                      ["review", "Review"],
                      ["browse", "Browse"],
                      ["history", "History"]
                    ].map(([key, label]) => (
                      <Pressable
                        key={key}
                        onPress={() => setMemoryView(key as MemoryView)}
                        style={[styles.memoryViewButton, memoryView === key && styles.activeMemoryViewButton]}
                      >
                        <Text style={[styles.memoryViewText, memoryDarkMode && styles.accountDarkMutedText, memoryView === key && styles.activeMemoryViewText]}>{label}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Pressable
                    onPress={() => phoneLayout ? setMemoryToolbarMoreOpen((open) => !open) : openMemoryPrintOptions()}
                    style={[styles.memoryPrintCardsButton, phoneLayout && styles.phoneMemoryPrintIconButton, memoryDarkMode && styles.homeDarkResumeButton]}
                    accessibilityLabel={phoneLayout ? "Show memory options" : "Print memory cards"}
                  >
                    <Ionicons name={phoneLayout ? "ellipsis-horizontal" : "print-outline"} size={16} color={memoryDarkMode ? "#e9b76a" : colors.oliveDark} />
                    {!phoneLayout && <Text style={[styles.memoryPrintCardsButtonText, memoryDarkMode && styles.homeDarkResumeButtonText]}>Print cards</Text>}
                  </Pressable>
                </View>
                {phoneLayout && memoryToolbarMoreOpen && (
                  <View style={[styles.phoneMemoryToolbarMoreMenu, memoryDarkMode && styles.accountDarkInsetBox]}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        setMemoryToolbarMoreOpen(false);
                        openMemoryPrintOptions();
                      }}
                      style={styles.phoneMemoryMoreMenuItem}
                    >
                      <Ionicons name="print-outline" size={16} color={memoryDarkMode ? "#e9b76a" : colors.oliveDark} />
                      <Text style={[styles.phoneMemoryMoreMenuText, memoryDarkMode && styles.homeDarkResumeButtonText]}>Print cards</Text>
                    </Pressable>
                  </View>
                )}
              </>
            )}
            {!phoneMemoryFocusMode && memoryView === "history" && (
              <Suspense fallback={<Card style={[styles.memoryHistorySummaryBox, memoryDarkMode && styles.accountDarkMainCard]}><Text style={[styles.muted, memoryDarkMode && styles.accountDarkMutedText]}>Loading memory history...</Text></Card>}>
                <MemoryHistoryPanel
                  styles={styles}
                  darkMode={memoryDarkMode}
                  phoneLayout={phoneLayout}
                  historySummary={memoryHistorySummary}
                  todayEncouragement={memoryHistoryEncouragement}
                  weeklySummary={memoryWeeklySummary}
                  weeklyScripture={memoryWeeklyScripture}
                  neglectedVerses={neglectedMemoryVerses}
                  milestones={memoryMilestones}
                  milestoneGoalIds={memoryMilestoneGoalIds}
                  milestonePickerOpen={memoryMilestonePickerOpen}
                  milestoneStatus={memoryMilestoneStatus}
                  historyItems={memoryHistoryItems}
                  visibleHistoryItems={visibleMemoryHistoryItems}
                  historyExpanded={memoryHistoryExpanded}
                  onPracticeVerse={startMemoryPractice}
                  onToggleMilestonePicker={() => setMemoryMilestonePickerOpen((current) => !current)}
                  onToggleMilestoneGoal={toggleMemoryMilestoneGoal}
                  onToggleHistoryExpanded={() => setMemoryHistoryExpanded((expanded) => !expanded)}
                />
              </Suspense>
            )}
            {!phoneMemoryFocusMode && memoryView === "browse" && (
              <>
                <View style={[styles.journalSearchBox, memoryDarkMode && styles.accountDarkInput]}>
                  <Ionicons name="search-outline" size={18} color={colors.coral} />
                  <TextInput
                    value={memorySearch}
                    onChangeText={setMemorySearch}
                    placeholder="Search reference or verse text"
                    placeholderTextColor={memoryDarkMode ? "#8f8678" : undefined}
                    style={[styles.journalSearchInput, memoryDarkMode && styles.accountDarkText]}
                  />
                  {!!memorySearch.trim() && (
                    <Pressable onPress={() => setMemorySearch("")} style={styles.clearSearchButton}>
                      <Ionicons name="close-outline" size={18} color={memoryDarkMode ? "#c8bda9" : colors.muted} />
                    </Pressable>
                  )}
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setMemoryBrowseFiltersOpen((open) => !open)}
                  style={[styles.memoryBrowseFiltersToggle, memoryDarkMode && styles.accountDarkSection]}
                >
                  <View style={styles.memoryHistoryTextBlock}>
                    <Text style={[styles.bodyStrong, memoryDarkMode && styles.accountDarkText]}>Filters</Text>
                    <Text style={[styles.memoryHistoryDate, memoryDarkMode && styles.accountDarkMutedText]}>{memoryBrowseFilterSummary}</Text>
                  </View>
                  <Ionicons name={memoryBrowseFiltersOpen ? "chevron-up-outline" : "options-outline"} size={18} color={memoryDarkMode ? "#e9b76a" : colors.oliveDark} />
                </Pressable>
                {memoryBrowseFiltersOpen && (
                <View style={[styles.memoryDiscoverBlock, styles.phoneMemoryBrowseFiltersPanel, memoryDarkMode && styles.accountDarkSection]}>
                  <View style={styles.memoryBrowseFilterHeader}>
                    <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>Filter saved verses</Text>
                    <Pressable accessibilityRole="button" onPress={clearMemoryBrowseFilters}>
                      <Text style={[styles.memoryBrowseClearText, memoryDarkMode && styles.studyDarkAccentText]}>Clear</Text>
                    </Pressable>
                  </View>
                  <Text style={[styles.memoryFilterByLabel, memoryDarkMode && styles.accountDarkMutedText]}>Filter by:</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setMemoryCollectionPickerOpen((open) => !open)}
                    style={[styles.memoryCollectionSelect, memoryDarkMode && styles.accountDarkInput]}
                  >
                    <View style={styles.memoryHistoryTextBlock}>
                      <Text style={[styles.bodyStrong, memoryDarkMode && styles.accountDarkText]}>{activeMemoryCollectionName}</Text>
                      <Text style={[styles.memoryHistoryDate, memoryDarkMode && styles.accountDarkMutedText]}>
                        {memoryCollectionFilter === "all" ? "Filter saved verses by theme" : `${activeMemoryCollectionDueCount} due for review`}
                      </Text>
                    </View>
                    <Ionicons name={memoryCollectionPickerOpen ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={memoryDarkMode ? "#e9b76a" : colors.oliveDark} />
                  </Pressable>
                  {memoryCollectionPickerOpen && (
                    <View style={[styles.memoryCollectionPickerPanel, memoryDarkMode && styles.accountDarkInsetBox]}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          setMemoryCollectionFilter("all");
                          setMemoryCollectionPickerOpen(false);
                          setMemoryBrowseFiltersOpen(false);
                        }}
                        style={styles.memoryCollectionPickerItem}
                      >
                        <Text style={[styles.bodyStrong, memoryDarkMode && styles.accountDarkText]}>All collections</Text>
                        <Text style={[styles.memoryHistoryDate, memoryDarkMode && styles.accountDarkMutedText]}>{(memoryVerses || []).length} saved verses</Text>
                      </Pressable>
                      {memoryCollectionOptions.map((collection) => (
                        <Pressable
                          key={collection.name}
                          accessibilityRole="button"
                          onPress={() => {
                            setMemoryCollectionFilter(collection.name);
                            setMemoryCollectionPickerOpen(false);
                            setMemoryBrowseFiltersOpen(false);
                          }}
                          style={styles.memoryCollectionPickerItem}
                        >
                          <Text style={[styles.bodyStrong, memoryDarkMode && styles.accountDarkText]}>{collection.name}</Text>
                          <Text style={[styles.memoryHistoryDate, memoryDarkMode && styles.accountDarkMutedText]}>{collection.count} verse{collection.count === 1 ? "" : "s"}</Text>
                        </Pressable>
                      ))}
                      {memoryCollectionOptions.length === 0 && (
                        <Text style={[styles.muted, memoryDarkMode && styles.accountDarkMutedText]}>Add a verse to a collection from its More menu.</Text>
                      )}
                    </View>
                  )}
                  {memoryCollectionFilter !== "all" && activeMemoryCollectionDueCount > 0 && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => startDueMemoryReviewQueue(memoryCollectionFilter)}
                      style={styles.memoryCollectionReviewButton}
                    >
                      <Ionicons name="school-outline" size={16} color="#fff" />
                      <Text style={styles.phoneMemoryPrimaryReviewText}>Review {activeMemoryCollectionDueCount} due</Text>
                    </Pressable>
                  )}
                  <Text style={[styles.memoryFilterByLabel, memoryDarkMode && styles.accountDarkMutedText]}>Filter by:</Text>
                  {memoryBookSections.length === 0 ? (
                    <Text style={[styles.muted, memoryDarkMode && styles.accountDarkMutedText]}>Saved verses will appear here by book and chapter.</Text>
                  ) : phoneLayout ? (
                    <View style={styles.mobileReaderPicker}>
                      {memoryBookSections.map((section) => (
                        <View key={section.id || section.title} style={styles.mobileReaderDropdown}>
                          <Pressable
                            onPress={() => setMemoryFilterMobileMenu((current) => current === section.id ? null : section.id)}
                            style={[styles.mobileReaderDropdownButton, memoryDarkMode && styles.accountDarkInsetBox]}
                          >
                            <Text style={[styles.mobileReaderDropdownText, memoryDarkMode && styles.accountDarkTitle]}>{section.title}</Text>
                            <Ionicons name={memoryFilterMobileMenu === section.id ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={memoryDarkMode ? "#c8bda9" : colors.muted} />
                          </Pressable>
                          {memoryFilterMobileMenu === section.id && (
                            <View style={styles.mobileReaderBookList}>
                              {section.books.map((book) => {
                                const bookCount = memoryBookCounts.get(book) || 0;
                                const chapters = memoryChaptersByBook.get(book) || [];
                                const bookSelected = memoryBookFilter === book;
                                const bookExpanded = expandedMemoryFilterBook === book;
                                return (
                                  <View key={book} style={[styles.mobileReaderBookBlock, bookExpanded && styles.expandedMobileReaderBookBlock]}>
                                    <Pressable
                                      onPress={() => selectMemoryFilterBook(book)}
                                      style={[styles.mobileReaderBookOption, styles.memoryBookFilterOption, memoryDarkMode && styles.printDarkOptionChip, bookSelected && styles.activeMobileReaderBookOption]}
                                    >
                                      <Text style={[styles.mobileReaderBookText, memoryDarkMode && styles.accountDarkMutedText, bookSelected && styles.activeMobileReaderBookText]}>{book}</Text>
                                      <Text style={[styles.memoryBookCountText, memoryDarkMode && styles.accountDarkMutedText, bookSelected && styles.activeMobileReaderBookText]}>{bookCount}</Text>
                                    </Pressable>
                                    {bookExpanded && (
                                      <View style={[styles.mobileReaderChapterPanel, memoryDarkMode && styles.accountDarkSection]}>
                                        <Text style={[styles.readerBookSectionTitle, memoryDarkMode && styles.studyDarkAccentText]}>{book}</Text>
                                        <View style={styles.mobileReaderChapterGrid}>
                                          <Pressable
                                            onPress={() => selectMemoryFilterChapter(book, "all")}
                                            style={[styles.memoryChapterAllSquare, memoryDarkMode && styles.printDarkOptionChip, bookSelected && memoryChapterFilter === "all" && styles.activeMobileReaderChapterSquare]}
                                          >
                                            <Text style={[styles.mobileReaderChapterText, memoryDarkMode && styles.accountDarkMutedText, bookSelected && memoryChapterFilter === "all" && styles.activeMobileReaderChapterText]}>All</Text>
                                          </Pressable>
                                          {chapters.map((chapter) => (
                                            <Pressable
                                              key={chapter.key}
                                              onPress={() => selectMemoryFilterChapter(book, chapter.key)}
                                              style={[styles.mobileReaderChapterSquare, memoryDarkMode && styles.printDarkOptionChip, memoryBookFilter === book && memoryChapterFilter === chapter.key && styles.activeMobileReaderChapterSquare]}
                                            >
                                              <Text style={[styles.mobileReaderChapterText, memoryDarkMode && styles.accountDarkMutedText, memoryBookFilter === book && memoryChapterFilter === chapter.key && styles.activeMobileReaderChapterText]}>{chapter.chapter || "-"}</Text>
                                              <Text style={[styles.memoryChapterCountText, memoryDarkMode && styles.accountDarkMutedText, memoryBookFilter === book && memoryChapterFilter === chapter.key && styles.activeMobileReaderChapterText]}>{chapter.count}</Text>
                                            </Pressable>
                                          ))}
                                        </View>
                                      </View>
                                    )}
                                  </View>
                                );
                              })}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.readerBookSections}>
                      {memoryBookSections.map((section) => (
                        <View key={section.title} style={styles.readerBookSection}>
                          <Text style={[styles.readerBookSectionTitle, memoryDarkMode && styles.studyDarkAccentText]}>{section.title}</Text>
                          <View style={styles.desktopReaderBookList}>
                            {section.books.map((book) => {
                              const bookCount = memoryBookCounts.get(book) || 0;
                              const chapters = memoryChaptersByBook.get(book) || [];
                              const bookSelected = memoryBookFilter === book;
                              const bookExpanded = expandedMemoryFilterBook === book;
                              return (
                                <View key={book} style={[styles.desktopReaderBookBlock, bookExpanded && styles.expandedDesktopReaderBookBlock]}>
                                  <Pressable
                                    onPress={() => selectMemoryFilterBook(book)}
                                    style={[styles.readerBookChip, styles.memoryBookFilterOption, memoryDarkMode && styles.printDarkOptionChip, bookSelected && styles.activeReaderBookChip]}
                                  >
                                    <Text style={[styles.readerBookText, memoryDarkMode && styles.accountDarkMutedText, bookSelected && styles.activeReaderBookText]}>{book}</Text>
                                    <Text style={[styles.memoryBookCountText, memoryDarkMode && styles.accountDarkMutedText, bookSelected && styles.activeReaderBookText]}>{bookCount}</Text>
                                  </Pressable>
                                  {bookExpanded && (
                                    <View style={[styles.desktopReaderChapterPanel, memoryDarkMode && styles.accountDarkSection]}>
                                      <View style={styles.desktopReaderChapterHeader}>
                                        <Text style={[styles.readerBookSectionTitle, memoryDarkMode && styles.studyDarkAccentText]}>{book}</Text>
                                        <Text style={[styles.readerChapterCountText, memoryDarkMode && styles.accountDarkMutedText]}>{chapters.length} saved chapter{chapters.length === 1 ? "" : "s"}</Text>
                                      </View>
                                      <View style={styles.desktopReaderChapterGrid}>
                                        <Pressable
                                          onPress={() => selectMemoryFilterChapter(book, "all")}
                                          style={[styles.memoryChapterAllSquare, memoryDarkMode && styles.printDarkOptionChip, bookSelected && memoryChapterFilter === "all" && styles.activeMobileReaderChapterSquare]}
                                        >
                                          <Text style={[styles.mobileReaderChapterText, memoryDarkMode && styles.accountDarkMutedText, bookSelected && memoryChapterFilter === "all" && styles.activeMobileReaderChapterText]}>All</Text>
                                        </Pressable>
                                        {chapters.map((chapter) => (
                                          <Pressable
                                            key={chapter.key}
                                            onPress={() => selectMemoryFilterChapter(book, chapter.key)}
                                            style={[styles.mobileReaderChapterSquare, memoryDarkMode && styles.printDarkOptionChip, memoryBookFilter === book && memoryChapterFilter === chapter.key && styles.activeMobileReaderChapterSquare]}
                                          >
                                            <Text style={[styles.mobileReaderChapterText, memoryDarkMode && styles.accountDarkMutedText, memoryBookFilter === book && memoryChapterFilter === chapter.key && styles.activeMobileReaderChapterText]}>{chapter.chapter || "-"}</Text>
                                            <Text style={[styles.memoryChapterCountText, memoryDarkMode && styles.accountDarkMutedText, memoryBookFilter === book && memoryChapterFilter === chapter.key && styles.activeMobileReaderChapterText]}>{chapter.count}</Text>
                                          </Pressable>
                                        ))}
                                      </View>
                                    </View>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                  <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>Status</Text>
                  <View style={styles.filterRow}>
                    {[
                      ["all", "All"],
                      ["due", "Due"],
                      ["learning", "Reviewed"],
                      ["memorized", "Memorized"]
                    ].map(([key, label]) => (
                      <Pressable
                        key={key}
                        onPress={() => {
                          setMemoryBrowseStatusFilter(key as MemoryBrowseStatusFilter);
                          setMemoryBrowseFiltersOpen(false);
                        }}
                        style={[styles.filterChip, memoryDarkMode && styles.printDarkOptionChip, memoryBrowseStatusFilter === key && styles.activeFilterChip]}
                      >
                        <Text style={[styles.filterText, memoryDarkMode && styles.accountDarkMutedText, memoryBrowseStatusFilter === key && styles.activeFilterText]}>{label}</Text>
                      </Pressable>
                    ))}
                  </View>
                  {currentBrowseMemoryVerses.length > 0 && (
                    <View style={[styles.memoryBulkReviewBox, memoryDarkMode && styles.accountDarkInsetBox]}>
                      <View style={styles.reviewScheduleHeader}>
                        <View style={styles.memoryHistoryTextBlock}>
                          <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>Change review rhythm</Text>
                          <Text style={[styles.memoryHistoryDate, memoryDarkMode && styles.accountDarkMutedText]}>
                            Applies to {currentBrowseMemoryVerses.length} filtered verse{currentBrowseMemoryVerses.length === 1 ? "" : "s"}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.filterRow}>
                        {COMMON_MEMORY_REVIEW_OPTIONS.map((option) => (
                          <Pressable
                            key={option.id}
                            accessibilityRole="button"
                            onPress={() => scheduleFilteredMemoryReview(option.id)}
                            style={[styles.filterChip, memoryDarkMode && styles.printDarkOptionChip, currentBrowseReviewPreset === option.id && styles.activeFilterChip]}
                          >
                            <Text style={[styles.filterText, memoryDarkMode && styles.accountDarkMutedText, currentBrowseReviewPreset === option.id && styles.activeFilterText]}>{option.label}</Text>
                          </Pressable>
                        ))}
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setBulkReviewOptionsExpanded((expanded) => !expanded)}
                        style={styles.memoryMoreReviewOptionsButton}
                      >
                        <Text style={[styles.memoryBrowseClearText, memoryDarkMode && styles.studyDarkAccentText]}>
                          {bulkReviewOptionsExpanded ? "Hide review options" : "More review options"}
                        </Text>
                        <Ionicons name={bulkReviewOptionsExpanded ? "chevron-up-outline" : "chevron-down-outline"} size={15} color={memoryDarkMode ? "#e9b76a" : colors.coral} />
                      </Pressable>
                      {bulkReviewOptionsExpanded && (
                        <View style={styles.filterRow}>
                          {MORE_MEMORY_REVIEW_OPTIONS.map((option) => (
                            <Pressable
                              key={option.id}
                              accessibilityRole="button"
                              onPress={() => scheduleFilteredMemoryReview(option.id)}
                              style={[styles.filterChip, memoryDarkMode && styles.printDarkOptionChip, currentBrowseReviewPreset === option.id && styles.activeFilterChip]}
                            >
                              <Text style={[styles.filterText, memoryDarkMode && styles.accountDarkMutedText, currentBrowseReviewPreset === option.id && styles.activeFilterText]}>{option.label}</Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
                )}
              </>
            )}
            {!phoneMemoryFocusMode && memoryView === "review" && (
              <View style={[styles.memoryReviewPromptBox, memoryStatus ? styles.memoryReviewSuccessBox : styles.memoryReviewEncourageBox, memoryDarkMode && styles.accountDarkSection]}>
                <Ionicons
                  name={memoryStatus ? "checkmark-circle-outline" : dueMemoryCount > 0 ? "school-outline" : "sparkles-outline"}
                  size={20}
                  color={memoryStatus ? colors.oliveDark : colors.coral}
                />
                <Text style={[styles.memoryReviewPromptText, memoryDarkMode && styles.accountDarkText]}>
                  {memoryStatus === "reviewed-today"
                    ? `Well done${firstName ? `, ${firstName}` : ""}. You have successfully reviewed ${Math.max(reviewedTodayCount, 1)} verse${Math.max(reviewedTodayCount, 1) === 1 ? "" : "s"} today.`
                    : memoryStatus || (reviewedTodayCount > 0
                    ? `Well done${firstName ? `, ${firstName}` : ""}. You have successfully reviewed ${reviewedTodayCount} verse${reviewedTodayCount === 1 ? "" : "s"} today.`
                    : dueMemoryCount > 0
                      ? `${friendlyName}, ${dueMemoryCount} verse${dueMemoryCount === 1 ? " is" : "s are"} ready for review today. Start with one and build from there.`
                      : `${friendlyName}, your saved verses are resting until their next review. You can still practise any verse when you want to keep it fresh.`)}
                </Text>
              </View>
            )}
            {visibleMemorySections.map((section) => {
              const highlightedMemorySection = section.title === "Due for Review" || section.title === "Reviewed";
              const reviewedMemorySection = section.title === "Reviewed";
              const sectionSort = reviewedMemorySection ? reviewedMemoryReviewSort : dueMemoryReviewSort;
              const setSectionSort = reviewedMemorySection ? setReviewedMemoryReviewSort : setDueMemoryReviewSort;
              return (
              <View key={section.title} style={[styles.memorySection, phoneLayout && styles.phoneMemorySection]}>
                {!phoneMemoryFocusMode && (
                  <>
                    <View style={[styles.memorySectionHeader, highlightedMemorySection && styles.memorySectionHeaderFeatured, memoryDarkMode && highlightedMemorySection && styles.memoryDarkSectionHeaderFeatured]}>
                      <Text style={[styles.memorySectionTitle, highlightedMemorySection && styles.memorySectionTitleFeatured, memoryDarkMode && styles.accountDarkTitle]}>{section.title}</Text>
                      <Text
                        style={[
                          styles.memorySectionCount,
                          highlightedMemorySection && styles.memorySectionCountFeatured,
                          reviewedMemorySection && styles.memorySectionCountReviewed,
                          memoryDarkMode && styles.memoryDarkCountPill,
                          memoryDarkMode && highlightedMemorySection && styles.memoryDarkSectionCountFeatured,
                          memoryDarkMode && reviewedMemorySection && styles.memoryDarkSectionCountReviewed
                        ]}
                      >
                        {section.verses.length}
                      </Text>
                    </View>
                    {highlightedMemorySection && (
                      <View style={[styles.memorySectionSortRow, memoryDarkMode && styles.accountDarkInsetBox]}>
                        <Text style={[styles.memoryHistoryDate, memoryDarkMode && styles.accountDarkMutedText]}>
                          {sectionSort === "oldest" ? "Soonest review first" : "Latest review first"}
                        </Text>
                        <View style={[styles.memorySortToggle, memoryDarkMode && styles.accountDarkSegmentedRow]}>
                          {[
                            ["oldest", "Soonest"],
                            ["newest", "Latest"]
                          ].map(([key, label]) => (
                            <Pressable
                              key={key}
                              accessibilityRole="button"
                              onPress={() => setSectionSort(key as MemoryReviewSort)}
                              style={[styles.memorySortButton, phoneLayout && styles.phoneMemorySortButton, sectionSort === key && styles.activeMemoryViewButton]}
                            >
                              <Text style={[styles.memoryViewText, memoryDarkMode && styles.accountDarkMutedText, phoneLayout && styles.phoneMemorySortText, sectionSort === key && styles.activeMemoryViewText]}>{label}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}
                    {section.title === "Due for Review" && dueMemoryCount > 0 ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => startDueMemoryReviewQueue()}
                        style={styles.phoneMemoryPrimaryReviewButton}
                      >
                        <Ionicons name="school-outline" size={16} color="#fff" />
                        <Text style={styles.phoneMemoryPrimaryReviewText}>
                          Review {dueMemoryCount} due verse{dueMemoryCount === 1 ? "" : "s"}
                        </Text>
                      </Pressable>
                    ) : section.title === "Reviewed" ? null : (
                      <Text style={[styles.muted, memoryDarkMode && styles.accountDarkMutedText]}>{section.description}</Text>
                    )}
                  </>
                )}
                {section.verses.map((verse: any) => {
                  const verseId = String(verse._id);
                  const practicing = verseId === activeMemoryVerseId;
                  const meditating = verseId === activeMemoryMeditationVerseId;
                  const reviewOpen = reviewScheduleVerseId === verseId;
                  const historyOpen = historyMemoryVerseId === verseId;
                  const collectionOpen = collectionMemoryVerseId === verseId;
                  const moreOpen = memoryMoreVerseId === verseId;
                  const collections = getMemoryVerseCollections(verse);
                  const cardExpanded = expandedMemoryVerseIds.includes(verseId) || practicing || meditating || reviewOpen || historyOpen || collectionOpen || moreOpen;
                  const verseHistory = memoryHistoryItems
                    .filter((item: any) => String(item.memoryVerseId || "") === verseId || item.reference === verse.reference)
                    .slice(0, 4);
                  const selectedReviewPreset = reviewPresetForStoredRhythm(verse.reviewPreset, verse.reviewIntervalDays, verse.nextReviewAt);

                  return (
                    <View key={verse._id} style={[styles.memoryCard, memoryDarkMode && styles.accountDarkSection, !cardExpanded && styles.collapsedMemoryCard, phoneLayout && styles.phoneMemoryCard, (practicing || meditating) && styles.activeMemoryCard, memoryDarkMode && (practicing || meditating) && styles.memoryDarkActiveCard]}>
                      <Pressable
                        onPress={() => {
                          setExpandedMemoryVerseIds((current) =>
                            current.includes(verseId) ? current.filter((id) => id !== verseId) : [...current, verseId]
                          );
                        }}
                        style={[styles.memoryCardHeaderButton, phoneLayout && styles.phoneMemoryCardHeader]}
                      >
                        <View style={styles.journalTitleBlock}>
                          <View style={styles.memoryReferenceRow}>
                            <Text numberOfLines={1} style={[styles.cardTitle, styles.memoryReferenceTitle, memoryDarkMode && styles.accountDarkTitle]}>{verse.reference}</Text>
                            <Ionicons name={cardExpanded ? "chevron-up-outline" : "chevron-down-outline"} size={17} color={colors.coral} />
                          </View>
                          <Text numberOfLines={1} style={[styles.muted, phoneLayout && styles.memoryTranslationLabel, memoryDarkMode && styles.accountDarkMutedText]}>
                            {phoneLayout ? shortBibleTranslationName(verse.translationName) : verse.translationName}
                          </Text>
                        </View>
                        <View style={[styles.memoryHeaderBadges, phoneLayout && styles.phoneMemoryHeaderBadges]}>
                          <Text
                            numberOfLines={phoneLayout ? 2 : 1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.76}
                            style={[styles.reviewDatePill, memoryDarkMode && styles.memoryDarkReviewPill, phoneLayout && styles.phoneMemoryHeaderPill, isMemoryVerseDue(verse) && styles.dueReviewDatePill, memoryDarkMode && isMemoryVerseDue(verse) && styles.memoryDarkDueReviewPill]}
                          >
                            {memoryReviewDateLabel(verse.nextReviewAt)}
                          </Text>
                        </View>
                      </Pressable>
                      {!cardExpanded && <Text numberOfLines={1} style={[styles.memoryVersePreview, memoryDarkMode && styles.accountDarkMutedText]}>{verse.verseText}</Text>}
                      {cardExpanded && (
                        <>
                      {practicing ? (
                        <View style={[styles.inlineMemoryPractice, phoneLayout && styles.phoneInlineMemoryPractice, memoryDarkMode && styles.accountDarkInsetBox]}>
                          <View style={[styles.memoryPracticeHeader, phoneLayout && styles.phoneMemoryPracticeHeader]}>
                            <Text style={[styles.helpIntro, phoneLayout && styles.phoneMemoryPracticeTitle, memoryDarkMode && styles.accountDarkMutedText]}>Step {memoryPracticeLevel}: {memoryPracticeLabel(memoryPracticeLevel)}</Text>
                            <View style={[styles.memoryStepRow, phoneLayout && styles.phoneMemoryStepRow, memoryDarkMode && styles.accountDarkSegmentedRow]}>
                              {[1, 2, 3].map((level) => (
                                <Pressable
                                  key={level}
                                  onPress={() => moveMemoryPracticeStep(level)}
                                  style={[styles.memoryStepButton, phoneLayout && styles.phoneMemoryStepButton, memoryPracticeLevel === level && styles.activeMemoryStepButton]}
                                >
                                  <Text
                                    numberOfLines={1}
                                    style={[styles.memoryStepText, memoryDarkMode && styles.accountDarkMutedText, phoneLayout && styles.phoneMemoryStepText, memoryPracticeLevel === level && styles.activeMemoryStepText]}
                                  >
                                    {phoneLayout ? level : `Step ${level}`}
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                          </View>
                          {memoryPracticeLevel === 1 ? (
                            <Text style={[styles.memoryPracticeText, phoneLayout && styles.phoneMemoryPracticeText, memoryDarkMode && styles.memoryDarkPracticeText]}>{memoryPracticeText}</Text>
                          ) : (
                            <View style={[styles.memoryFillBox, phoneLayout && styles.phoneMemoryFillBox, memoryDarkMode && styles.memoryDarkFillBox]}>
                              {memoryPracticeTokens.map((token) => {
                                const blankIndex = token.blank ? memoryBlankTokens.findIndex((item) => item.index === token.index) : -1;
                                return token.blank ? (
                                  <MemoryBlank
                                    key={token.index}
                                    token={token}
                                    value={memoryPracticeAnswers[token.index] || ""}
                                    checked={memoryPracticeChecked}
                                    hintsVisible={memoryHintsVisible}
                                    hintLevel={memoryHintLevels[token.index] || 1}
                                    inputRef={(input) => {
                                      memoryBlankInputRefs.current[token.index] = input;
                                    }}
                                    onChange={(value) => updateMemoryPracticeAnswer(token.index, value)}
                                    onSubmit={(submittedValue) => {
                                      const nextAnswers = { ...memoryPracticeAnswers, [token.index]: submittedValue || memoryPracticeAnswers[token.index] || "" };
                                      const allAnswersCorrect =
                                        memoryBlankTokens.length > 0 &&
                                        memoryBlankTokens.every((blank) => normalizeMemoryAnswer(nextAnswers[blank.index] || "") === normalizeMemoryAnswer(blank.answer));

                                      if (blankIndex === memoryBlankTokens.length - 1 && allAnswersCorrect && memoryPracticeLevel > 1) {
                                        continueMemoryPractice(true);
                                        return;
                                      }

                                      focusMemoryBlankAfter(token.index, nextAnswers);
                                    }}
                                    onMoreHint={() => showMoreMemoryHint(token.index)}
                                    returnKeyType={blankIndex === memoryBlankTokens.length - 1 ? "done" : "next"}
                                    compact={phoneLayout}
                                    darkMode={memoryDarkMode}
                                  />
                                ) : (
                                  <Text key={token.index} style={[styles.memoryPracticeWord, memoryDarkMode && styles.accountDarkText]}>{token.text}</Text>
                                );
                              })}
                            </View>
                          )}
                          {(memoryPracticeAllCorrect && memoryPracticeLevel > 1) ? (
                            <Text style={styles.saveStatus}>{`Well done${firstName ? `, ${firstName}` : ""}. Every word is correct.`}</Text>
                          ) : (
                            !!memoryPracticeResult && <Text style={styles.saveStatus}>{memoryPracticeResult}</Text>
                          )}
                          <View style={[styles.journalActions, phoneLayout && styles.phoneMemoryActions]}>
                            {memoryPracticeAllCorrect && memoryPracticeLevel > 1 ? (
                              <ResumeButton
                                label={memoryPracticeLevel >= 3 ? "Finish verse" : "Continue"}
                                icon="arrow-forward-circle-outline"
                                onPress={continueMemoryPractice}
                                variant="primary"
                                style={phoneLayout && styles.phoneMemoryActionButton}
                                labelStyle={phoneLayout && styles.phoneMemoryActionText}
                              />
                            ) : memoryPracticeLevel === 1 ? (
                              <ResumeButton label="Ready for Step 2" icon="checkmark-circle-outline" onPress={submitMemoryPractice} style={[phoneLayout && styles.phoneMemoryActionButton, memoryDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneMemoryActionText, memoryDarkMode && styles.homeDarkResumeButtonText]} iconColor={memoryDarkMode ? "#e9b76a" : undefined} />
                            ) : null}
                            {memoryPracticeLevel > 1 && (
                              <ResumeButton label="Repeat" icon="refresh-outline" onPress={repeatMemoryPracticeStep} style={[phoneLayout && styles.phoneMemoryActionButton, memoryDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneMemoryActionText, memoryDarkMode && styles.homeDarkResumeButtonText]} iconColor={memoryDarkMode ? "#e9b76a" : undefined} />
                            )}
                            {memoryPracticeLevel > 1 && !memoryPracticeAllCorrect && (
                              <ResumeButton
                                label={memoryHintsVisible ? "Hide hints" : "Show hints"}
                                icon="bulb-outline"
                                onPress={() => setMemoryHintsVisible((visible) => !visible)}
                                style={[phoneLayout && styles.phoneMemoryActionButton, memoryDarkMode && styles.homeDarkResumeButton]}
                                labelStyle={[phoneLayout && styles.phoneMemoryActionText, memoryDarkMode && styles.homeDarkResumeButtonText]}
                                iconColor={memoryDarkMode ? "#e9b76a" : undefined}
                              />
                            )}
                            <ResumeButton label="Close" icon="close-outline" onPress={activeMemoryReviewQueueCount > 0 ? stopMemoryReviewQueue : () => setActiveMemoryVerseId("")} style={[phoneLayout && styles.phoneMemoryActionButton, memoryDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneMemoryActionText, memoryDarkMode && styles.homeDarkResumeButtonText]} iconColor={memoryDarkMode ? "#e9b76a" : undefined} />
                          </View>
                        </View>
                      ) : meditating ? (
                        <View style={[styles.memoryMeditationBox, phoneLayout && styles.phoneMemoryMeditationBox, memoryDarkMode && styles.accountDarkInsetBox]}>
                          <View style={styles.memoryMeditationHeader}>
                            <View style={styles.journalTitleBlock}>
                              <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>Meditate</Text>
                              <Text style={[styles.feedbackTitle, memoryDarkMode && styles.accountDarkTitle]}>{verse.reference}</Text>
                            </View>
                            <Pressable onPress={closeMemoryMeditation} style={[styles.checkinIconButton, memoryDarkMode && styles.homeDarkIconBubble]} accessibilityLabel="Close meditation">
                              <Ionicons name="close-outline" size={18} color={memoryDarkMode ? "#e9b76a" : colors.oliveDark} />
                            </Pressable>
                          </View>
                          <Text style={[styles.memoryMeditationVerse, memoryDarkMode && styles.memoryDarkPracticeText]}>{verse.verseText}</Text>
                          <View style={[styles.memoryStepRow, memoryDarkMode && styles.accountDarkSegmentedRow]}>
                            {["Notice", "Reflect", "Pray", "Carry"].map((label, index) => (
                              <Pressable
                                key={label}
                                onPress={() => setMemoryMeditationStep(index)}
                                style={[styles.memoryMeditationStepButton, memoryMeditationStep === index && styles.activeMemoryStepButton]}
                              >
                                <Text style={[styles.memoryStepText, memoryDarkMode && styles.accountDarkMutedText, memoryMeditationStep === index && styles.activeMemoryStepText]}>{phoneLayout ? index + 1 : label}</Text>
                              </Pressable>
                            ))}
                          </View>
                          {memoryMeditationStep === 0 && (
                            <View style={styles.memoryMeditationPromptBox}>
                              <Text style={[styles.bodyStrong, memoryDarkMode && styles.accountDarkText]}>What word or phrase stands out today?</Text>
                              <TextInput
                                value={memoryMeditationPhrase}
                                onChangeText={setMemoryMeditationPhrase}
                                placeholder="A phrase I am holding..."
                                placeholderTextColor={memoryDarkMode ? "#8f8678" : colors.muted}
                                style={[styles.input, styles.memoryMeditationInput, phoneLayout && styles.phoneMemoryMeditationInput, memoryDarkMode && styles.accountDarkInput]}
                              />
                            </View>
                          )}
                          {memoryMeditationStep === 1 && (
                            <View style={styles.memoryMeditationPromptBox}>
                              <Text style={[styles.bodyStrong, memoryDarkMode && styles.accountDarkText]}>What does this show you about God, or invite you to trust or obey?</Text>
                              <TextInput
                                value={memoryMeditationReflection}
                                onChangeText={setMemoryMeditationReflection}
                                placeholder="This verse is showing me..."
                                placeholderTextColor={memoryDarkMode ? "#8f8678" : colors.muted}
                                multiline
                                style={[styles.input, styles.memoryMeditationTextarea, phoneLayout && styles.phoneMemoryMeditationInput, memoryDarkMode && styles.accountDarkInput]}
                              />
                            </View>
                          )}
                          {memoryMeditationStep === 2 && (
                            <View style={styles.memoryMeditationPromptBox}>
                              <Text style={[styles.bodyStrong, memoryDarkMode && styles.accountDarkText]}>Turn this verse into a short prayer.</Text>
                              <TextInput
                                value={memoryMeditationPrayer}
                                onChangeText={setMemoryMeditationPrayer}
                                placeholder="Lord, help me..."
                                placeholderTextColor={memoryDarkMode ? "#8f8678" : colors.muted}
                                multiline
                                style={[styles.input, styles.memoryMeditationTextarea, phoneLayout && styles.phoneMemoryMeditationInput, memoryDarkMode && styles.accountDarkInput]}
                              />
                            </View>
                          )}
                          {memoryMeditationStep === 3 && (
                            <View style={styles.memoryMeditationPromptBox}>
                              <Text style={[styles.bodyStrong, memoryDarkMode && styles.accountDarkText]}>What do you want to carry with you today?</Text>
                              <TextInput
                                value={memoryMeditationCarry}
                                onChangeText={setMemoryMeditationCarry}
                                placeholder="Today I want to carry..."
                                placeholderTextColor={memoryDarkMode ? "#8f8678" : colors.muted}
                                multiline
                                style={[styles.input, styles.memoryMeditationTextarea, phoneLayout && styles.phoneMemoryMeditationInput, memoryDarkMode && styles.accountDarkInput]}
                              />
                            </View>
                          )}
                          <View style={[styles.journalActions, phoneLayout && styles.phoneMemoryActions]}>
                            {memoryMeditationStep > 0 && (
                              <ResumeButton label="Back" icon="arrow-back-outline" onPress={() => setMemoryMeditationStep((step) => Math.max(0, step - 1))} style={[phoneLayout && styles.phoneMemoryActionButton, memoryDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneMemoryActionText, memoryDarkMode && styles.homeDarkResumeButtonText]} iconColor={memoryDarkMode ? "#e9b76a" : undefined} />
                            )}
                            {memoryMeditationStep < 3 ? (
                              <ResumeButton label="Next" icon="arrow-forward-outline" onPress={() => setMemoryMeditationStep((step) => Math.min(3, step + 1))} style={[phoneLayout && styles.phoneMemoryActionButton, memoryDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneMemoryActionText, memoryDarkMode && styles.homeDarkResumeButtonText]} iconColor={memoryDarkMode ? "#e9b76a" : undefined} />
                            ) : (
                              <ResumeButton label="Save meditation" icon="journal-outline" onPress={() => saveMemoryMeditation(verse)} variant="primary" style={phoneLayout && styles.phoneMemoryActionButton} labelStyle={phoneLayout && styles.phoneMemoryActionText} />
                            )}
                            <ResumeButton label="Close" icon="close-outline" onPress={closeMemoryMeditation} style={[phoneLayout && styles.phoneMemoryActionButton, memoryDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneMemoryActionText, memoryDarkMode && styles.homeDarkResumeButtonText]} iconColor={memoryDarkMode ? "#e9b76a" : undefined} />
                          </View>
                        </View>
                      ) : (
                        <>
                          <Text style={[styles.memoryVerseText, phoneLayout && styles.phoneMemoryVerseText, memoryDarkMode && styles.accountDarkText]}>{verse.verseText}</Text>
                          {!!verse.note && <Text style={[styles.muted, memoryDarkMode && styles.accountDarkMutedText]}>{verse.note}</Text>}
                          {collections.length > 0 && (
                            <View style={styles.memoryCollectionPillRow}>
                              {collections.slice(0, 3).map((collection: string) => (
                                <Text key={collection} style={[styles.memoryCollectionPill, memoryDarkMode && styles.memoryDarkCollectionPill]}>{collection}</Text>
                              ))}
                              {collections.length > 3 && <Text style={[styles.memoryCollectionPill, memoryDarkMode && styles.memoryDarkCollectionPill]}>+{collections.length - 3}</Text>}
                            </View>
                          )}
                          {historyOpen && <View style={[styles.memoryVerseHistoryBox, phoneLayout && styles.phoneMemoryVerseHistoryBox, memoryDarkMode && styles.accountDarkInsetBox]}>
                            <View style={[styles.memoryVerseProgressBox, memoryDarkMode && styles.accountDarkSection]}>
                              <Ionicons name="trending-up-outline" size={16} color={memoryDarkMode ? "#e9b76a" : colors.coral} />
                              <View style={styles.memoryHistoryTextBlock}>
                                <Text style={[styles.bodyStrong, memoryDarkMode && styles.accountDarkText]}>{memoryVerseProgressMessage(verse)}</Text>
                                <Text style={[styles.memoryVerseHistoryEventText, memoryDarkMode && styles.accountDarkMutedText]}>{memoryVerseProgressDetail(verse)}</Text>
                              </View>
                            </View>
                            <View style={styles.memoryVerseHistoryStats}>
                              <View style={styles.memoryVerseHistoryStat}>
                                <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>Reviews</Text>
                                <Text style={[styles.bodyStrong, memoryDarkMode && styles.accountDarkText]}>{verse.reviewCount || 0}</Text>
                              </View>
                              <View style={styles.memoryVerseHistoryStat}>
                                <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>Last reviewed</Text>
                                <Text style={[styles.bodyStrong, memoryDarkMode && styles.accountDarkText]}>{verse.lastReviewedAt ? formatMemoryHistoryDate(verse.lastReviewedAt) : "Not yet"}</Text>
                              </View>
                              <View style={styles.memoryVerseHistoryStat}>
                                <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>Added</Text>
                                <Text style={[styles.bodyStrong, memoryDarkMode && styles.accountDarkText]}>{formatMemoryHistoryDate(verse.createdAt)}</Text>
                              </View>
                            </View>
                            {verseHistory.length > 0 && (
                              <View style={styles.memoryVerseHistoryEvents}>
                                {verseHistory.map((item: any) => (
                                  <View key={item._id} style={styles.memoryVerseHistoryEvent}>
                                    <Ionicons name={memoryHistoryEventIcon(item.event) as any} size={14} color={memoryDarkMode ? "#e9b76a" : colors.coral} />
                                    <Text style={[styles.muted, styles.memoryVerseHistoryEventText, memoryDarkMode && styles.accountDarkMutedText]}>
                                      {memoryHistoryEventLabel(item.event, item.practiceLevel)} - {formatMemoryHistoryDate(item.createdAt)}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>}
                          <View style={[styles.journalActions, phoneLayout && styles.phoneMemoryActions, phoneLayout && styles.phoneMemoryPrimaryActions]}>
                            <ResumeButton label={phoneLayout && isMemoryVerseDue(verse) ? "Review now" : "Practice"} icon="school-outline" onPress={() => startMemoryPractice(verse)} variant={phoneLayout ? "primary" : "default"} style={[phoneLayout && styles.phoneMemoryPracticeButton, !phoneLayout && memoryDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneMemoryActionText, !phoneLayout && memoryDarkMode && styles.homeDarkResumeButtonText]} iconColor={phoneLayout ? "#fff" : memoryDarkMode ? "#e9b76a" : undefined} />
                            <ResumeButton
                              label="Meditate"
                              icon="leaf-outline"
                              onPress={() => startMemoryMeditation(verse)}
                              style={[phoneLayout && styles.phoneMemoryMeditateButton, memoryDarkMode && styles.homeDarkResumeButton]}
                              labelStyle={[phoneLayout && styles.phoneMemoryActionText, memoryDarkMode && styles.homeDarkResumeButtonText]}
                              iconColor={memoryDarkMode ? "#e9b76a" : undefined}
                            />
                            {phoneLayout ? (
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={moreOpen ? "Hide memory verse options" : "Show memory verse options"}
                                onPress={() => setMemoryMoreVerseId((current) => current === verseId ? "" : verseId)}
                                style={[styles.phoneMemoryMoreButton, memoryDarkMode && styles.homeDarkResumeButton]}
                              >
                                <Ionicons name="ellipsis-horizontal" size={18} color={memoryDarkMode ? "#e9b76a" : colors.oliveDark} />
                              </Pressable>
                            ) : (
                              <>
                                <ResumeButton
                                  label={historyOpen ? "Hide history" : "History"}
                                  icon="time-outline"
                                  onPress={() => setHistoryMemoryVerseId((current) => current === verseId ? "" : verseId)}
                                  style={memoryDarkMode && styles.homeDarkResumeButton}
                                  labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText}
                                  iconColor={memoryDarkMode ? "#e9b76a" : undefined}
                                />
                                <ResumeButton
                                  label={reviewOpen ? "Hide review" : "Change review"}
                                  icon="calendar-outline"
                                  onPress={() => setReviewScheduleVerseId((current) => current === verseId ? "" : verseId)}
                                  style={memoryDarkMode && styles.homeDarkResumeButton}
                                  labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText}
                                  iconColor={memoryDarkMode ? "#e9b76a" : undefined}
                                />
                                <ResumeButton
                                  label={collectionOpen ? "Hide collections" : "Collections"}
                                  icon="albums-outline"
                                  onPress={() => {
                                    setCollectionMemoryVerseId((current) => current === verseId ? "" : verseId);
                                    setMemoryCollectionDraft("");
                                  }}
                                  style={memoryDarkMode && styles.homeDarkResumeButton}
                                  labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText}
                                  iconColor={memoryDarkMode ? "#e9b76a" : undefined}
                                />
                                <ResumeButton
                                  label={pendingDeleteMemoryVerseId === verseId ? "Confirm remove" : "Remove"}
                                  icon="trash-outline"
                                  onPress={() => deleteMemoryVerse(verse)}
                                  style={memoryDarkMode && styles.homeDarkResumeButton}
                                  labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText}
                                  iconColor={memoryDarkMode ? "#e9b76a" : undefined}
                                />
                              </>
                            )}
                          </View>
                          {phoneLayout && moreOpen && (
                            <View style={[styles.phoneMemoryMoreMenu, memoryDarkMode && styles.accountDarkInsetBox]}>
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => {
                                  setHistoryMemoryVerseId((current) => current === verseId ? "" : verseId);
                                  setMemoryMoreVerseId("");
                                }}
                                style={styles.phoneMemoryMoreMenuItem}
                              >
                                <Ionicons name="time-outline" size={16} color={memoryDarkMode ? "#e9b76a" : colors.oliveDark} />
                                <Text style={[styles.phoneMemoryMoreMenuText, memoryDarkMode && styles.homeDarkResumeButtonText]}>{historyOpen ? "Hide history" : "View history"}</Text>
                              </Pressable>
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => {
                                  setReviewScheduleVerseId((current) => current === verseId ? "" : verseId);
                                  setMemoryMoreVerseId("");
                                }}
                                style={styles.phoneMemoryMoreMenuItem}
                              >
                                <Ionicons name="calendar-outline" size={16} color={memoryDarkMode ? "#e9b76a" : colors.oliveDark} />
                                <Text style={[styles.phoneMemoryMoreMenuText, memoryDarkMode && styles.homeDarkResumeButtonText]}>Change review date</Text>
                              </Pressable>
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => {
                                  setCollectionMemoryVerseId((current) => current === verseId ? "" : verseId);
                                  setMemoryCollectionDraft("");
                                  setMemoryMoreVerseId("");
                                }}
                                style={styles.phoneMemoryMoreMenuItem}
                              >
                                <Ionicons name="albums-outline" size={16} color={memoryDarkMode ? "#e9b76a" : colors.oliveDark} />
                                <Text style={[styles.phoneMemoryMoreMenuText, memoryDarkMode && styles.homeDarkResumeButtonText]}>Collections</Text>
                              </Pressable>
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => {
                                  setMemoryMoreVerseId("");
                                  deleteMemoryVerse(verse);
                                }}
                                style={styles.phoneMemoryMoreMenuItem}
                              >
                                <Ionicons name="trash-outline" size={16} color={memoryDarkMode ? "#e9b76a" : colors.oliveDark} />
                                <Text style={[styles.phoneMemoryMoreMenuText, memoryDarkMode && styles.homeDarkResumeButtonText]}>{pendingDeleteMemoryVerseId === verseId ? "Confirm remove" : "Remove from Memory"}</Text>
                              </Pressable>
                            </View>
                          )}
                          {collectionOpen && (
                            <View style={[styles.memoryCollectionManageBox, memoryDarkMode && styles.accountDarkInsetBox]}>
                              <View style={styles.reviewScheduleHeader}>
                                <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>Collections</Text>
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel="Close collections"
                                  onPress={() => {
                                    setCollectionMemoryVerseId("");
                                    setMemoryCollectionDraft("");
                                  }}
                                  style={[styles.reviewScheduleCloseButton, memoryDarkMode && styles.homeDarkIconBubble]}
                                >
                                  <Ionicons name="close-outline" size={17} color={memoryDarkMode ? "#e9b76a" : colors.oliveDark} />
                                </Pressable>
                              </View>
                              {collections.length > 0 ? (
                                <View style={styles.memoryCollectionPillRow}>
                                  {collections.map((collection: string) => (
                                    <Pressable
                                      key={collection}
                                      accessibilityRole="button"
                                      onPress={() => removeMemoryVerseCollection(verse, collection)}
                                      style={[styles.memoryCollectionEditablePill, memoryDarkMode && styles.memoryDarkCollectionPill]}
                                    >
                                      <Text style={[styles.memoryCollectionEditableText, memoryDarkMode && styles.accountDarkText]}>{collection}</Text>
                                      <Ionicons name="close-outline" size={13} color={memoryDarkMode ? "#c8bda9" : colors.oliveDark} />
                                    </Pressable>
                                  ))}
                                </View>
                              ) : (
                                <Text style={[styles.muted, memoryDarkMode && styles.accountDarkMutedText]}>Add this verse to a theme like Identity, Prayer, Hope, or Courage.</Text>
                              )}
                              <View style={styles.memoryCollectionInputRow}>
                                <TextInput
                                  value={memoryCollectionDraft}
                                  onChangeText={setMemoryCollectionDraft}
                                  placeholder="New collection"
                                  placeholderTextColor={memoryDarkMode ? "#8f8678" : undefined}
                                  style={[styles.input, styles.memoryCollectionInput, memoryDarkMode && styles.accountDarkInput]}
                                />
                                <Pressable
                                  accessibilityRole="button"
                                  onPress={() => addMemoryVerseCollection(verse)}
                                  style={styles.memoryCollectionAddButton}
                                >
                                  <Text style={styles.phoneMemoryPrimaryReviewText}>Add</Text>
                                </Pressable>
                              </View>
                              {memoryCollectionOptions.some((collection) => !collections.includes(collection.name)) && (
                                <View style={styles.memoryCollectionPillRow}>
                                  {memoryCollectionOptions
                                    .filter((collection) => !collections.includes(collection.name))
                                    .slice(0, 6)
                                    .map((collection) => (
                                      <Pressable
                                        key={collection.name}
                                        accessibilityRole="button"
                                        onPress={() => saveMemoryVerseCollections(verse, [...collections, collection.name])}
                                        style={[styles.memoryCollectionSuggestionPill, memoryDarkMode && styles.printDarkOptionChip]}
                                      >
                                        <Text style={[styles.filterText, memoryDarkMode && styles.accountDarkMutedText]}>{collection.name}</Text>
                                      </Pressable>
                                    ))}
                                </View>
                              )}
                            </View>
                          )}
                          {reviewOpen && (
                            <View style={[styles.reviewScheduleBox, memoryDarkMode && styles.accountDarkInsetBox]}>
                              <View style={styles.reviewScheduleHeader}>
                                <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>Review rhythm</Text>
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel="Close review schedule"
                                  onPress={() => {
                                    setReviewScheduleVerseId("");
                                    setExpandedReviewOptionsVerseId("");
                                  }}
                                  style={[styles.reviewScheduleCloseButton, memoryDarkMode && styles.homeDarkIconBubble]}
                                >
                                  <Ionicons name="close-outline" size={17} color={memoryDarkMode ? "#e9b76a" : colors.oliveDark} />
                                </Pressable>
                              </View>
                              <View style={styles.filterRow}>
                                {COMMON_MEMORY_REVIEW_OPTIONS.map((option) => (
                                  <Pressable
                                    key={option.id}
                                    onPress={() => scheduleMemoryVerseReview(verse, option.id)}
                                    style={[styles.filterChip, memoryDarkMode && styles.printDarkOptionChip, selectedReviewPreset === option.id && styles.activeFilterChip]}
                                  >
                                    <Text style={[styles.filterText, memoryDarkMode && styles.accountDarkMutedText, selectedReviewPreset === option.id && styles.activeFilterText]}>{option.label}</Text>
                                  </Pressable>
                                ))}
                              </View>
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => setExpandedReviewOptionsVerseId((current) => current === verseId ? "" : verseId)}
                                style={styles.memoryMoreReviewOptionsButton}
                              >
                                <Text style={[styles.memoryBrowseClearText, memoryDarkMode && styles.studyDarkAccentText]}>
                                  {expandedReviewOptionsVerseId === verseId ? "Hide review options" : "More review options"}
                                </Text>
                                <Ionicons name={expandedReviewOptionsVerseId === verseId ? "chevron-up-outline" : "chevron-down-outline"} size={15} color={memoryDarkMode ? "#e9b76a" : colors.coral} />
                              </Pressable>
                              {expandedReviewOptionsVerseId === verseId && (
                                <View style={styles.filterRow}>
                                  {MORE_MEMORY_REVIEW_OPTIONS.map((option) => (
                                    <Pressable
                                      key={option.id}
                                      onPress={() => scheduleMemoryVerseReview(verse, option.id)}
                                      style={[styles.filterChip, memoryDarkMode && styles.printDarkOptionChip, selectedReviewPreset === option.id && styles.activeFilterChip]}
                                    >
                                      <Text style={[styles.filterText, memoryDarkMode && styles.accountDarkMutedText, selectedReviewPreset === option.id && styles.activeFilterText]}>{option.label}</Text>
                                    </Pressable>
                                  ))}
                                </View>
                              )}
                            </View>
                          )}
                        </>
                      )}
                        </>
                      )}
                    </View>
                  );
                })}
              </View>
            );})}
            {memoryView === "browse" && memoryBrowseSections.length === 0 && (
              <View style={[styles.emptyJournalBox, memoryDarkMode && styles.accountDarkSection]}>
                <Ionicons name="search-outline" size={24} color={colors.coral} />
                <Text style={[styles.emptyJournalTitle, memoryDarkMode && styles.accountDarkTitle]}>No saved verses found</Text>
                <Text style={[styles.emptyJournalText, memoryDarkMode && styles.accountDarkMutedText]}>Try a book, chapter, reference, or a phrase from the verse.</Text>
              </View>
            )}
          </View>
        )}
      </Card>
    </View>

  );
}
