import Ionicons from "@expo/vector-icons/Ionicons";
import { Modal, Platform, Pressable, Text, TextInput, View } from "react-native";

import {
  CustomStudyReviewControl,
  FormattedNoteText,
  HighlightReflectionSummary,
  JournalCalendar,
  JournalMeditationAnswer,
  JournalMeditationScripture,
  JournalScriptureBrowser,
  PassageMarkupSummary
} from "@/components/JournalDisplayHelpers";
import { AppButton, Card, Eyebrow, colors } from "@/components/ui";

export function JournalTab(props: any) {
  const {
    styles,
    journalDarkMode,
    phoneLayout,
    firstName,
    journalSearch,
    setJournalSearch,
    journalView,
    setJournalView,
    journalDateFilterKey,
    setJournalDateFilterKey,
    journalFiltersOpen,
    setJournalFiltersOpen,
    activeJournalFilterLabel,
    journalFilter,
    setJournalFilter,
    journalFilterOptions,
    totalSavedHighlightCount,
    buildJournalGuideText,
    journalCalendarMonth,
    journalCalendarItems,
    setJournalCalendarMonth,
    addMonths,
    journalScriptureBookSections,
    expandedJournalScriptureBook,
    setExpandedJournalScriptureBook,
    selectedJournalScriptureBook,
    selectedJournalScriptureChapter,
    setSelectedJournalScripture,
    formatJournalDateKey,
    selectedJournalDateEntryCount,
    selectedJournalScriptureEntryCount,
    dueStudyReviewCount,
    reflectionStatus,
    journalStatus,
    showDraftsSection,
    visibleDrafts,
    isJournalEntryExpanded,
    toggleJournalEntryExpanded,
    formatJournalCreatedDate,
    ResumeButtonComponent,
    resumeDraft,
    pendingArchiveDraftId,
    deleteDraft,
    setPendingArchiveDraftId,
    showHighlightsSection,
    highlightJournalEntries,
    activeReflectionEntryId,
    setActiveReflectionEntryId,
    reflectionInsight,
    setReflectionInsight,
    reflectionPrayer,
    setReflectionPrayer,
    reflectionNextStep,
    setReflectionNextStep,
    isSavingReflection,
    saveHighlightReflection,
    startHighlightReflection,
    resumeSession,
    journalEntries,
    groupedJournalEntries,
    pinnedEntryIds,
    isMemoryMeditationEntry,
    editingJournalEntryId,
    activeStudyReviewId,
    reviewScheduleStudyId,
    pendingRemoveStudyReviewId,
    isHighlightReflection,
    getJournalEntryIcon,
    togglePinnedJournalEntry,
    editReflectionPassage,
    setEditReflectionPassage,
    editReflectionHighlights,
    setEditReflectionHighlights,
    editReflectionInsight,
    setEditReflectionInsight,
    editReflectionPrayer,
    setEditReflectionPrayer,
    editReflectionNextStep,
    setEditReflectionNextStep,
    editJournalNote,
    setEditJournalNote,
    isStudyReviewDue,
    formatReviewDate,
    studyReviewNote,
    setStudyReviewNote,
    completeStudyReview,
    studyReviewStatus,
    setStudyReviewStatus,
    isSavingJournalEdit,
    saveJournalEntryEdit,
    cancelEditJournalEntry,
    setActiveStudyReviewId,
    setReviewScheduleStudyId,
    setPendingRemoveStudyReviewId,
    startEditJournalEntry,
    pendingDeleteJournalEntryId,
    setPendingDeleteJournalEntryId,
    journalDeleteStatus,
    setJournalDeleteStatus,
    isDeletingJournalEntry,
    deleteJournalEntry,
    STUDY_REVIEW_OPTIONS,
    scheduleStudyReview,
    removeStudyReview,
    customStudyReviewDays,
    setCustomStudyReviewDays,
    showJournalEmptyState,
    journalSearchTerm,
    friendlyName,
    setTab
  } = props;
  const ResumeButton = ResumeButtonComponent;
  const pendingDeleteJournalEntry = journalEntries.find((entry: any) => String(entry._id) === pendingDeleteJournalEntryId);
  const pendingDeleteJournalEntryTitle = pendingDeleteJournalEntry?.passage
    || (pendingDeleteJournalEntry && isHighlightReflection(pendingDeleteJournalEntry) ? "Highlight reflection" : "Encouragement");
  const closeDeleteJournalDialog = () => {
    if (isDeletingJournalEntry) return;
    setPendingDeleteJournalEntryId("");
    setJournalDeleteStatus("");
  };
  const deleteDialogAccessibilityProps = {
    accessibilityLabel: "Delete journal entry confirmation",
    accessibilityViewIsModal: true,
    ...(Platform.OS === "web" ? { "aria-modal": true, role: "dialog", tabIndex: -1 } : {})
  } as any;

  const renderReviewScheduleOptions = (entry: any, rawEntryId: string) => (
    <>
      <Text style={[styles.muted, journalDarkMode && styles.accountDarkMutedText]}>
        {entry.reviewStatus === "scheduled"
          ? `Currently set for ${formatReviewDate(entry.reviewAt)}. Choosing a new period will replace this date.`
          : "Choose when you would like this study to return for review."}
      </Text>
      <View style={styles.reviewPresetRow}>
        {STUDY_REVIEW_OPTIONS.map((option: any) => (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityLabel={`Review ${option.label.toLowerCase()}`}
            onPress={() => {
              scheduleStudyReview(entry._id, option.id);
              setReviewScheduleStudyId("");
              setPendingRemoveStudyReviewId("");
            }}
            style={[styles.filterChip, journalDarkMode && styles.printDarkOptionChip]}
          >
            <Text style={[styles.filterText, journalDarkMode && styles.accountDarkMutedText]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
      <CustomStudyReviewControl
        styles={styles}
        value={customStudyReviewDays}
        onChange={setCustomStudyReviewDays}
        onSchedule={() => {
          scheduleStudyReview(entry._id);
          setReviewScheduleStudyId("");
          setPendingRemoveStudyReviewId("");
        }}
      />
      {entry.reviewStatus === "scheduled" && (
        <View>
          <View style={[styles.journalActions, phoneLayout && styles.phoneJournalActions]}>
            <ResumeButton
              label={pendingRemoveStudyReviewId === rawEntryId ? "Confirm remove" : "Remove review"}
              icon="close-circle-outline"
              onPress={() => removeStudyReview(entry)}
              style={[phoneLayout && styles.phoneJournalActionButton, journalDarkMode && styles.homeDarkResumeButton]}
              labelStyle={[phoneLayout && styles.phoneJournalActionText, journalDarkMode && styles.homeDarkResumeButtonText]}
              iconColor={journalDarkMode ? "#e9b76a" : undefined}
            />
            {pendingRemoveStudyReviewId === rawEntryId && (
              <ResumeButton
                label="Keep review"
                icon="arrow-undo-outline"
                onPress={() => setPendingRemoveStudyReviewId("")}
                style={[phoneLayout && styles.phoneJournalActionButton, journalDarkMode && styles.homeDarkResumeButton]}
                labelStyle={[phoneLayout && styles.phoneJournalActionText, journalDarkMode && styles.homeDarkResumeButtonText]}
                iconColor={journalDarkMode ? "#e9b76a" : undefined}
              />
            )}
          </View>
          {pendingRemoveStudyReviewId === rawEntryId && (
            <Text style={[styles.muted, journalDarkMode && styles.accountDarkMutedText]}>This removes the reminder only. Your completed study will stay in Journal.</Text>
          )}
        </View>
      )}
    </>
  );

  return (
    <View style={journalDarkMode && styles.accountDarkLayout}>
      <Eyebrow>Saved work</Eyebrow>
      <Text style={[styles.title, journalDarkMode && styles.accountDarkTitle]}>{firstName ? `${firstName}, your study journal` : "Your study journal"}</Text>
      <Text style={[styles.titleSupport, journalDarkMode && styles.accountDarkMutedText]}>Return to what God has been teaching you through studies, highlights, reflections, and encouragements.</Text>
      <View style={[styles.journalSearchBox, phoneLayout && styles.phoneJournalSearchBox, journalDarkMode && styles.accountDarkInput]}>
        <Ionicons name="search-outline" size={18} color={colors.coral} />
        <TextInput
          value={journalSearch}
          onChangeText={setJournalSearch}
          placeholder="Search passage, method, note, or answer"
          placeholderTextColor={journalDarkMode ? "#8f8678" : undefined}
          style={[styles.journalSearchInput, phoneLayout && styles.phoneJournalSearchInput, journalDarkMode && styles.accountDarkText]}
        />
        {!!journalSearch.trim() && (
          <Pressable onPress={() => setJournalSearch("")} style={styles.clearSearchButton}>
            <Ionicons name="close-outline" size={18} color={journalDarkMode ? "#c8bda9" : colors.muted} />
          </Pressable>
        )}
      </View>
      <View style={[styles.journalViewRow, phoneLayout && styles.phoneJournalViewRow]}>
        <View style={[styles.journalViewToggle, journalDarkMode && styles.accountDarkSegmentedRow]}>
          {[
            ["list", "List", "list-outline"],
            ["calendar", "Calendar", "calendar-outline"],
            ["scripture", "Scripture", "book-outline"]
          ].map(([key, label, icon]) => (
            <Pressable
              key={key}
                    onPress={() => setJournalView(key)}
              style={[styles.journalViewButton, journalView === key && styles.activeJournalViewButton]}
            >
              <Ionicons name={icon as any} size={15} color={journalView === key ? "white" : (journalDarkMode ? "#e9b76a" : colors.oliveDark)} />
              <Text style={[styles.journalViewText, journalDarkMode && styles.accountDarkMutedText, journalView === key && styles.activeJournalViewText]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        {!!journalDateFilterKey && (
          <Pressable onPress={() => setJournalDateFilterKey("")} style={[styles.clearDateFilterButton, journalDarkMode && styles.homeDarkResumeButton]}>
            <Text style={[styles.clearDateFilterText, journalDarkMode && styles.homeDarkResumeButtonText]}>Clear date</Text>
          </Pressable>
        )}
      </View>
      <View style={[styles.journalFilterPanel, journalDarkMode && styles.accountDarkSection]}>
        <Pressable
          onPress={() => setJournalFiltersOpen((current: boolean) => !current)}
          style={styles.journalFilterSummary}
          accessibilityRole="button"
          accessibilityLabel={journalFiltersOpen ? "Hide journal filters" : "Show journal filters"}
        >
          <View style={styles.journalFilterSummaryCopy}>
            <Text style={[styles.lastCheckinLabel, journalDarkMode && styles.studyDarkAccentText]}>Filter</Text>
            <Text style={[styles.journalFilterSummaryText, journalDarkMode && styles.accountDarkTitle]}>{activeJournalFilterLabel}</Text>
          </View>
          <View style={styles.journalFilterSummaryRight}>
            {journalFilter !== "all" && (
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  setJournalFilter("all");
                }}
                style={[styles.clearPassageFilterInlineButton, journalDarkMode && styles.homeDarkResumeButton]}
              >
                <Ionicons name="close-outline" size={14} color={colors.coral} />
                <Text style={[styles.clearPassageFilterInlineText, journalDarkMode && styles.homeDarkResumeButtonText]}>Clear</Text>
              </Pressable>
            )}
            <Ionicons name={journalFiltersOpen ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={journalDarkMode ? "#c8bda9" : colors.muted} />
          </View>
        </Pressable>
        {journalFiltersOpen && (
          <View style={[styles.filterRow, styles.journalFilterChipGrid, phoneLayout && styles.phoneJournalFilterRow]}>
                  {journalFilterOptions.map(({ key, label, icon }: any) => (
              <Pressable
                key={key}
                onPress={() => {
                  setJournalFilter(key);
                  if (phoneLayout) setJournalFiltersOpen(false);
                }}
                style={[styles.filterChip, styles.journalFilterChoiceChip, phoneLayout && styles.phoneJournalFilterChip, journalDarkMode && styles.printDarkOptionChip, journalFilter === key && styles.activeFilterChip]}
              >
                <Ionicons name={icon} size={14} color={journalFilter === key ? "white" : (journalDarkMode ? "#e9b76a" : colors.oliveDark)} />
                <Text style={[styles.filterText, phoneLayout && styles.phoneJournalFilterText, journalDarkMode && styles.accountDarkMutedText, journalFilter === key && styles.activeFilterText]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
      <View style={[styles.journalGuideBox, phoneLayout && styles.phoneJournalGuideBox, journalDarkMode && styles.accountDarkSection]}>
        <Ionicons name={journalFilter === "reviews" ? "refresh-circle-outline" : journalFilter === "highlights" ? "color-wand-outline" : journalFilter === "checkins" ? "chatbubbles-outline" : journalFilter === "meditations" ? "sparkles-outline" : "reader-outline"} size={18} color={colors.coral} />
        <Text style={[styles.journalGuideText, journalDarkMode && styles.accountDarkText]}>{buildJournalGuideText(journalFilter, totalSavedHighlightCount)}</Text>
      </View>
      {journalView === "calendar" && (
        <JournalCalendar
          styles={styles}
          monthStart={journalCalendarMonth}
          items={journalCalendarItems}
          selectedDateKey={journalDateFilterKey}
          onSelectDate={setJournalDateFilterKey}
          onPreviousMonth={() => setJournalCalendarMonth(addMonths(journalCalendarMonth, -1))}
          onNextMonth={() => setJournalCalendarMonth(addMonths(journalCalendarMonth, 1))}
          darkMode={journalDarkMode}
        />
      )}
      {journalView === "scripture" && (
        <JournalScriptureBrowser
          styles={styles}
          sections={journalScriptureBookSections}
          expandedBook={expandedJournalScriptureBook}
          selectedBook={selectedJournalScriptureBook}
          selectedChapter={selectedJournalScriptureChapter}
                onToggleBook={(book: string) => {
                  setExpandedJournalScriptureBook((current: string) => (current === book ? "" : book));
                }}
                onSelectChapter={(book: string, chapter: number) => {
            const selected = selectedJournalScriptureBook === book && selectedJournalScriptureChapter === chapter;
            setSelectedJournalScripture(selected ? "" : book, selected ? 0 : chapter);
          }}
          darkMode={journalDarkMode}
        />
      )}
      {!!journalDateFilterKey && (
        <View style={[styles.dateFilterNotice, journalDarkMode && styles.accountDarkInsetBox]}>
          <Ionicons name="calendar-outline" size={16} color={colors.coral} />
          <Text style={[styles.dateFilterText, journalDarkMode && styles.accountDarkText]}>
            {`${formatJournalDateKey(journalDateFilterKey)} · ${selectedJournalDateEntryCount} entr${selectedJournalDateEntryCount === 1 ? "y" : "ies"}`}
          </Text>
        </View>
      )}
      {!!selectedJournalScriptureBook && selectedJournalScriptureChapter > 0 && (
        <View style={[styles.dateFilterNotice, styles.passageFilterNotice, journalDarkMode && styles.accountDarkInsetBox]}>
          <Ionicons name="book-outline" size={16} color={colors.coral} />
          <Text numberOfLines={1} style={[styles.dateFilterText, styles.passageFilterText, journalDarkMode && styles.accountDarkText]}>
            {`${selectedJournalScriptureBook} ${selectedJournalScriptureChapter} · ${selectedJournalScriptureEntryCount} entr${selectedJournalScriptureEntryCount === 1 ? "y" : "ies"}`}
          </Text>
          <Pressable
            onPress={() => setSelectedJournalScripture("", 0)}
            style={[styles.clearPassageFilterInlineButton, journalDarkMode && styles.homeDarkResumeButton]}
          >
            <Ionicons name="close-outline" size={14} color={colors.coral} />
            <Text style={[styles.clearPassageFilterInlineText, journalDarkMode && styles.homeDarkResumeButtonText]}>Clear</Text>
          </Pressable>
        </View>
      )}
      {journalFilter === "all" && dueStudyReviewCount > 0 && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setJournalFilter("reviews")}
          style={[styles.highlightLibraryPanel, phoneLayout && styles.phoneHighlightLibraryPanel, journalDarkMode && styles.accountDarkSection]}
        >
          <View style={[styles.highlightLibraryIcon, journalDarkMode && styles.homeDarkIconBubble]}>
            <Ionicons name="refresh-circle-outline" size={19} color={colors.coral} />
          </View>
          <View style={styles.highlightLibraryCopy}>
            <Text style={[styles.highlightLibraryTitle, journalDarkMode && styles.accountDarkTitle]}>Studies ready to review</Text>
            <Text style={[styles.highlightLibraryText, journalDarkMode && styles.accountDarkMutedText]}>
              {`${dueStudyReviewCount} saved stud${dueStudyReviewCount === 1 ? "y is" : "ies are"} ready for a fresh look.`}
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={18} color={journalDarkMode ? "#c8bda9" : colors.muted} />
        </Pressable>
      )}
      {journalFilter === "all" && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setJournalFilter("highlights")}
          style={[styles.highlightLibraryPanel, phoneLayout && styles.phoneHighlightLibraryPanel, journalDarkMode && styles.accountDarkSection]}
        >
          <View style={[styles.highlightLibraryIcon, journalDarkMode && styles.homeDarkIconBubble]}>
            <Ionicons name="color-wand-outline" size={19} color={colors.coral} />
          </View>
          <View style={styles.highlightLibraryCopy}>
            <Text style={[styles.highlightLibraryTitle, journalDarkMode && styles.accountDarkTitle]}>Highlight library</Text>
            <Text style={[styles.highlightLibraryText, journalDarkMode && styles.accountDarkMutedText]}>
              {totalSavedHighlightCount > 0
                ? `${totalSavedHighlightCount} saved highlight${totalSavedHighlightCount === 1 ? "" : "s"} from your studies and drafts.`
                : "Highlighted verses and notes will collect here once you save a study."}
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={18} color={journalDarkMode ? "#c8bda9" : colors.muted} />
        </Pressable>
      )}
      {!!reflectionStatus && <Text style={styles.saveStatus}>{reflectionStatus}</Text>}
      {!!journalStatus && <Text style={styles.saveStatus}>{journalStatus}</Text>}
      {showDraftsSection && (
        <View style={styles.journalSection}>
          <Text style={[styles.sectionTitle, journalDarkMode && styles.accountDarkTitle]}>In progress</Text>
          {visibleDrafts.map((draft: any) => {
            const draftEntryId = `draft:${draft._id}`;
            const expanded = isJournalEntryExpanded(draftEntryId);
            return (
              <Card key={draft._id} style={[styles.journalCard, phoneLayout && styles.phoneJournalCard, !expanded && styles.collapsedJournalCard, journalDarkMode && styles.accountDarkMainCard]}>
                <Pressable onPress={() => toggleJournalEntryExpanded(draftEntryId)} style={styles.journalCompactHeader}>
                  <View style={styles.journalHeaderCopyRow}>
                    <View style={[styles.journalEntryTypeIcon, journalDarkMode && styles.homeDarkIconBubble]}>
                      <Ionicons name="create-outline" size={16} color={journalDarkMode ? "#e9b76a" : colors.coral} />
                    </View>
                    <View style={styles.journalTitleBlock}>
                      <Text style={[styles.cardTitle, journalDarkMode && styles.accountDarkTitle]} numberOfLines={phoneLayout ? 2 : 1}>{draft.passageReference || draft.passage}</Text>
                      <Text style={[styles.muted, journalDarkMode && styles.accountDarkMutedText]}>
                        {draft.methodName} · Step {draft.stepIndex + 1} · Created {formatJournalCreatedDate(draft)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.journalStatusCluster}>
                    <Text style={[styles.draftPill, journalDarkMode && styles.plansDarkDraftPill]}>Draft</Text>
                    <Ionicons name={expanded ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={journalDarkMode ? "#c8bda9" : colors.muted} />
                  </View>
                </Pressable>
                {expanded && (
                  <>
                    {draft.answers
                      .filter((item: any) => item.answer.trim())
                      .slice(0, 2)
                      .map((item: any) => (
                        <View key={item.stepTitle}>
                          <Text style={[styles.body, journalDarkMode && styles.accountDarkText]}>
                            <Text style={styles.bold}>{item.stepTitle}: </Text>
                          </Text>
                          <FormattedNoteText styles={styles} text={item.answer} darkMode={journalDarkMode} />
                        </View>
                      ))}
                    <PassageMarkupSummary styles={styles} markups={draft.passageMarkups || []} darkMode={journalDarkMode} />
                    <View style={[styles.journalActions, phoneLayout && styles.phoneJournalActions]}>
                      <ResumeButton label="Resume into study" onPress={() => resumeDraft(draft)} style={[phoneLayout && styles.phoneJournalActionButton, journalDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneJournalActionText, journalDarkMode && styles.homeDarkResumeButtonText]} iconColor={journalDarkMode ? "#e9b76a" : undefined} />
                      <ResumeButton
                        label={pendingArchiveDraftId === draft._id ? "Confirm archive" : "Archive draft"}
                        icon="archive-outline"
                        onPress={() =>
                          pendingArchiveDraftId === draft._id ? deleteDraft(draft._id) : setPendingArchiveDraftId(draft._id)
                        }
                        style={[phoneLayout && styles.phoneJournalActionButton, journalDarkMode && styles.homeDarkResumeButton]}
                        labelStyle={[phoneLayout && styles.phoneJournalActionText, journalDarkMode && styles.homeDarkResumeButtonText]}
                        iconColor={journalDarkMode ? "#e9b76a" : undefined}
                      />
                    </View>
                  </>
                )}
              </Card>
            );
          })}
        </View>
      )}
      {showHighlightsSection && (
        <View style={styles.journalSection}>
          <Text style={[styles.sectionTitle, journalDarkMode && styles.accountDarkTitle]}>Highlights</Text>
          <Text style={[styles.sectionHelp, journalDarkMode && styles.accountDarkMutedText]}>Use Create reflection to turn marked verses into a key insight, prayer, and next step.</Text>
                {highlightJournalEntries.map((item: any) => {
            const expanded = isJournalEntryExpanded(item.id) || activeReflectionEntryId === item.id;
            return (
              <Card key={item.id} style={[styles.journalCard, phoneLayout && styles.phoneJournalCard, !expanded && styles.collapsedJournalCard, journalDarkMode && styles.accountDarkMainCard]}>
                <Pressable onPress={() => toggleJournalEntryExpanded(item.id)} style={styles.journalCompactHeader}>
                  <View style={styles.journalHeaderCopyRow}>
                    <View style={[styles.journalEntryTypeIcon, journalDarkMode && styles.homeDarkIconBubble]}>
                      <Ionicons name="color-wand-outline" size={16} color={journalDarkMode ? "#e9b76a" : colors.coral} />
                    </View>
                    <View style={styles.journalTitleBlock}>
                      <Text style={[styles.cardTitle, journalDarkMode && styles.accountDarkTitle]} numberOfLines={phoneLayout ? 2 : 1}>{item.passage}</Text>
                      <Text style={[styles.muted, journalDarkMode && styles.accountDarkMutedText]}>
                        {item.methodName} · Created {formatJournalCreatedDate(item)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.journalStatusCluster}>
                    <Text style={[styles.draftPill, journalDarkMode && styles.plansDarkDraftPill]}>{item.source === "draft" ? "Draft" : `${item.markups.length} highlight${item.markups.length === 1 ? "" : "s"}`}</Text>
                    <Ionicons name={expanded ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={journalDarkMode ? "#c8bda9" : colors.muted} />
                  </View>
                </Pressable>
                {expanded && (
                  <>
                    <PassageMarkupSummary styles={styles} markups={item.markups} darkMode={journalDarkMode} />
                    {activeReflectionEntryId === item.id && (
                      <View style={[styles.reflectionBox, journalDarkMode && styles.accountDarkInsetBox]}>
                        <Text style={[styles.lastCheckinLabel, journalDarkMode && styles.studyDarkAccentText]}>Create reflection</Text>
                        <TextInput
                          multiline
                          value={reflectionInsight}
                          onChangeText={setReflectionInsight}
                          placeholder="Key insight"
                          placeholderTextColor={journalDarkMode ? "#8f8678" : undefined}
                          style={[styles.input, styles.reflectionInput, journalDarkMode && styles.accountDarkInput]}
                        />
                        <TextInput
                          multiline
                          value={reflectionPrayer}
                          onChangeText={setReflectionPrayer}
                          placeholder="Prayer"
                          placeholderTextColor={journalDarkMode ? "#8f8678" : undefined}
                          style={[styles.input, styles.reflectionInput, journalDarkMode && styles.accountDarkInput]}
                        />
                        <TextInput
                          multiline
                          value={reflectionNextStep}
                          onChangeText={setReflectionNextStep}
                          placeholder="Next step"
                          placeholderTextColor={journalDarkMode ? "#8f8678" : undefined}
                          style={[styles.input, styles.reflectionInput, journalDarkMode && styles.accountDarkInput]}
                        />
                        <View style={[styles.journalActions, phoneLayout && styles.phoneJournalActions]}>
                          <AppButton label={isSavingReflection ? "Saving..." : "Save reflection"} onPress={() => saveHighlightReflection(item)} />
                          <AppButton label="Cancel" variant="secondary" onPress={() => setActiveReflectionEntryId("")} style={journalDarkMode && styles.homeDarkResumeButton} labelStyle={journalDarkMode && styles.homeDarkResumeButtonText} />
                        </View>
                      </View>
                    )}
                    <View style={[styles.journalActions, phoneLayout && styles.phoneJournalActions]}>
                      <ResumeButton label="Create reflection" icon="create-outline" onPress={() => startHighlightReflection(item)} style={[phoneLayout && styles.phoneJournalActionButton, journalDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneJournalActionText, journalDarkMode && styles.homeDarkResumeButtonText]} iconColor={journalDarkMode ? "#e9b76a" : undefined} />
                      <ResumeButton
                        label="Revisit passage"
                        onPress={() => (item.source === "draft" ? resumeDraft(item.entry) : resumeSession(item.entry))}
                        style={[phoneLayout && styles.phoneJournalActionButton, journalDarkMode && styles.homeDarkResumeButton]}
                        labelStyle={[phoneLayout && styles.phoneJournalActionText, journalDarkMode && styles.homeDarkResumeButtonText]}
                        iconColor={journalDarkMode ? "#e9b76a" : undefined}
                      />
                    </View>
                  </>
                )}
              </Card>
            );
          })}
        </View>
      )}
      {journalEntries.length > 0 && (
        <View style={styles.journalSection}>
          <Text style={[styles.sectionTitle, journalDarkMode && styles.accountDarkTitle]}>{journalFilter === "studies" ? "Completed studies" : journalFilter === "meditations" ? "Meditations" : journalFilter === "checkins" ? "Encouragements" : "Saved entries"}</Text>
                {groupedJournalEntries.map((group: any) => (
            <View key={group.title} style={styles.journalDateGroup}>
              <Text style={[styles.journalDateGroupTitle, journalDarkMode && styles.accountDarkMutedText]}>{group.title}</Text>
              {group.entries.map((entry: any) => {
        const rawEntryId = String(entry._id);
        const entryId = `entry:${rawEntryId}`;
        const pinned = pinnedEntryIds.has(rawEntryId);
        const memoryMeditation = isMemoryMeditationEntry(entry);
        const editing = editingJournalEntryId === rawEntryId;
        const expanded = isJournalEntryExpanded(entryId) || editing || activeStudyReviewId === rawEntryId || reviewScheduleStudyId === rawEntryId;
        const entryTitle = entry.passage || (isHighlightReflection(entry) ? "Highlight reflection" : "Encouragement");
        const entryStatus = entry.answers
          ? memoryMeditation
            ? "Meditation"
            : entry.reviewStatus === "scheduled"
              ? isStudyReviewDue(entry)
                ? "Review due"
                : "Review set"
              : entry.reviewStatus === "reviewed"
                ? "Study review"
                : "Study"
          : isHighlightReflection(entry)
            ? "Reflection"
            : "Encouragement";

        return (
          <Card key={entry._id} style={[styles.journalCard, phoneLayout && styles.phoneJournalCard, !expanded && styles.collapsedJournalCard, journalDarkMode && styles.accountDarkMainCard]}>
            <View style={styles.journalCompactHeader}>
              <Pressable onPress={() => toggleJournalEntryExpanded(entryId)} style={styles.journalCompactTitleButton}>
                <View style={styles.journalHeaderCopyRow}>
                  <View style={[styles.journalEntryTypeIcon, journalDarkMode && styles.homeDarkIconBubble]}>
                    <Ionicons name={getJournalEntryIcon(entryStatus)} size={16} color={journalDarkMode ? "#e9b76a" : colors.coral} />
                  </View>
                  <View style={styles.journalTitleBlock}>
                    <Text style={[styles.cardTitle, journalDarkMode && styles.accountDarkTitle]} numberOfLines={phoneLayout ? 2 : 1}>{entryTitle}</Text>
                    <Text style={[styles.muted, journalDarkMode && styles.accountDarkMutedText]}>{entry.methodName ? `${entry.methodName} · Created ${formatJournalCreatedDate(entry)}` : `Created ${formatJournalCreatedDate(entry)}`}</Text>
                  </View>
                </View>
                <Ionicons name={expanded ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={journalDarkMode ? "#c8bda9" : colors.muted} />
              </Pressable>
              <View style={styles.journalStatusCluster}>
                <Text style={[styles.draftPill, journalDarkMode && styles.plansDarkDraftPill]}>{entryStatus}</Text>
                {entry.answers && !memoryMeditation && (
                  <Pressable
                    onPress={() => togglePinnedJournalEntry(rawEntryId)}
                    style={[styles.pinJournalIconButton, journalDarkMode && styles.homeDarkIconBubble, pinned && styles.activePinJournalIconButton]}
                    accessibilityLabel={pinned ? "Unpin journal entry" : "Pin journal entry"}
                  >
                    <Ionicons name={pinned ? "star" : "star-outline"} size={16} color={pinned ? "#2f7d4f" : (journalDarkMode ? "#c8bda9" : colors.muted)} />
                  </Pressable>
                )}
              </View>
            </View>
            {expanded && (
              <>
                {editing ? (
                  isHighlightReflection(entry) ? (
                    <View style={[styles.reflectionBox, journalDarkMode && styles.accountDarkInsetBox]}>
                      <Text style={[styles.lastCheckinLabel, journalDarkMode && styles.studyDarkAccentText]}>Edit reflection</Text>
                      <TextInput
                        multiline
                        value={editReflectionPassage}
                        onChangeText={setEditReflectionPassage}
                        placeholder="Passage"
                        placeholderTextColor={journalDarkMode ? "#8f8678" : undefined}
                        style={[styles.input, styles.reflectionInput, journalDarkMode && styles.accountDarkInput]}
                      />
                      <TextInput
                        multiline
                        value={editReflectionHighlights}
                        onChangeText={setEditReflectionHighlights}
                        placeholder="Highlights"
                        placeholderTextColor={journalDarkMode ? "#8f8678" : undefined}
                        style={[styles.input, styles.reflectionInput, journalDarkMode && styles.accountDarkInput]}
                      />
                      <TextInput
                        multiline
                        value={editReflectionInsight}
                        onChangeText={setEditReflectionInsight}
                        placeholder="Key insight"
                        placeholderTextColor={journalDarkMode ? "#8f8678" : undefined}
                        style={[styles.input, styles.reflectionInput, journalDarkMode && styles.accountDarkInput]}
                      />
                      <TextInput
                        multiline
                        value={editReflectionPrayer}
                        onChangeText={setEditReflectionPrayer}
                        placeholder="Prayer"
                        placeholderTextColor={journalDarkMode ? "#8f8678" : undefined}
                        style={[styles.input, styles.reflectionInput, journalDarkMode && styles.accountDarkInput]}
                      />
                      <TextInput
                        multiline
                        value={editReflectionNextStep}
                        onChangeText={setEditReflectionNextStep}
                        placeholder="Next step"
                        placeholderTextColor={journalDarkMode ? "#8f8678" : undefined}
                        style={[styles.input, styles.reflectionInput, journalDarkMode && styles.accountDarkInput]}
                      />
                    </View>
                  ) : (
                    <TextInput
                      multiline
                      value={editJournalNote}
                      onChangeText={setEditJournalNote}
                      placeholder="Edit journal note"
                      placeholderTextColor={journalDarkMode ? "#8f8678" : undefined}
                      style={[styles.input, styles.textarea, journalDarkMode && styles.accountDarkInput]}
                    />
                  )
                ) : entry.answers ? (
                  <>
                    {entry.reviewStatus === "scheduled" && (
                      <View style={[styles.studyReviewBox, journalDarkMode && styles.accountDarkInsetBox]}>
                        <View style={styles.feedbackHeader}>
                          <Ionicons name="refresh-circle-outline" size={18} color={colors.coral} />
                          <Text style={[styles.feedbackTitle, journalDarkMode && styles.accountDarkTitle]}>{isStudyReviewDue(entry) ? "Ready to review" : "Review scheduled"}</Text>
                        </View>
                        <Text style={[styles.body, journalDarkMode && styles.accountDarkText]}>
                          {isStudyReviewDue(entry)
                            ? "Revisit your notes, then add one fresh reflection."
                            : `This study will return on ${formatReviewDate(entry.reviewAt)}.`}
                        </Text>
                        <ResumeButton
                          label={reviewScheduleStudyId === rawEntryId ? "Hide review options" : "Change review"}
                          icon={reviewScheduleStudyId === rawEntryId ? "chevron-up-outline" : "calendar-outline"}
                          onPress={() => {
                            setReviewScheduleStudyId(reviewScheduleStudyId === rawEntryId ? "" : rawEntryId);
                            setPendingRemoveStudyReviewId("");
                            setStudyReviewStatus("");
                          }}
                          style={[phoneLayout && styles.phoneJournalActionButton, journalDarkMode && styles.homeDarkResumeButton]}
                          labelStyle={[phoneLayout && styles.phoneJournalActionText, journalDarkMode && styles.homeDarkResumeButtonText]}
                          iconColor={journalDarkMode ? "#e9b76a" : undefined}
                        />
                        {reviewScheduleStudyId === rawEntryId && (
                          <View style={[styles.reviewScheduleInline, { borderTopColor: journalDarkMode ? "#393027" : colors.line }]}>
                            {renderReviewScheduleOptions(entry, rawEntryId)}
                          </View>
                        )}
                        {activeStudyReviewId === rawEntryId && (
                          <View style={[styles.reflectionBox, journalDarkMode && styles.accountDarkSection]}>
                            <Text style={[styles.lastCheckinLabel, journalDarkMode && styles.studyDarkAccentText]}>What do you notice now?</Text>
                            <TextInput
                              multiline
                              value={studyReviewNote}
                              onChangeText={setStudyReviewNote}
                              placeholder="A fresh insight, next step, or prayer after revisiting this study"
                              placeholderTextColor={journalDarkMode ? "#8f8678" : undefined}
                              style={[styles.input, styles.reflectionInput, journalDarkMode && styles.accountDarkInput]}
                            />
                            <View style={styles.journalActions}>
                              <AppButton label="Save review" onPress={() => completeStudyReview(entry)} />
                              <AppButton label="Cancel" variant="secondary" onPress={() => setActiveStudyReviewId("")} style={journalDarkMode && styles.homeDarkResumeButton} labelStyle={journalDarkMode && styles.homeDarkResumeButtonText} />
                            </View>
                          </View>
                        )}
                        {!!studyReviewStatus && <Text style={styles.saveStatus}>{studyReviewStatus}</Text>}
                      </View>
                    )}
                    {entry.reviewStatus === "reviewed" && entry.reviewNote && (
                      <View style={[styles.studyReviewBox, journalDarkMode && styles.accountDarkInsetBox]}>
                        <Text style={[styles.lastCheckinLabel, journalDarkMode && styles.studyDarkAccentText]}>Review reflection</Text>
                        <Text style={[styles.body, journalDarkMode && styles.accountDarkText]}>{entry.reviewNote}</Text>
                      </View>
                    )}
                    {entry.shareNote && !memoryMeditation && (
                      <View style={[styles.journalShareBox, journalDarkMode && styles.accountDarkInsetBox]}>
                        <Text style={[styles.lastCheckinLabel, journalDarkMode && styles.studyDarkAccentText]}>Share note</Text>
                        <Text style={[styles.body, journalDarkMode && styles.accountDarkText]}>{entry.shareNote}</Text>
                      </View>
                    )}
                    <PassageMarkupSummary styles={styles} markups={entry.passageMarkups || []} darkMode={journalDarkMode} />
                    {entry.answers
                      .filter((item: any) => item.answer.trim())
                      .map((item: any) => (
                        <View key={item.stepTitle}>
                          {memoryMeditation && item.stepTitle === "Scripture" ? (
                            <JournalMeditationScripture styles={styles} text={item.answer} darkMode={journalDarkMode} />
                          ) : memoryMeditation ? (
                            <JournalMeditationAnswer styles={styles} title={item.stepTitle} text={item.answer} darkMode={journalDarkMode} />
                          ) : (
                            <>
                              <Text style={[styles.body, journalDarkMode && styles.accountDarkText]}>
                                <Text style={styles.bold}>{item.stepTitle}: </Text>
                              </Text>
                              <FormattedNoteText styles={styles} text={item.answer} darkMode={journalDarkMode} />
                            </>
                          )}
                        </View>
                      ))}
                    {(entry.coachingMoments || []).length > 0 && (
                      <View style={[styles.journalShareBox, journalDarkMode && styles.accountDarkInsetBox]}>
                        <Text style={[styles.lastCheckinLabel, journalDarkMode && styles.studyDarkAccentText]}>Accepted coaching</Text>
                        {(entry.coachingMoments || []).map((item: any) => (
                          <Text key={item.stepTitle + item.nextRevision} style={[styles.body, journalDarkMode && styles.accountDarkText]}>
                            <Text style={styles.bold}>{item.stepTitle}: </Text>
                            {item.nextRevision}
                          </Text>
                        ))}
                      </View>
                    )}
                  </>
                ) : isHighlightReflection(entry) ? (
                  <HighlightReflectionSummary styles={styles} note={entry.note || ""} darkMode={journalDarkMode} />
                ) : (
                  <Text style={[styles.body, journalDarkMode && styles.accountDarkText]}>{entry.note || "No note added."}</Text>
                )}
                <View style={[styles.journalActions, phoneLayout && styles.phoneJournalActions]}>
                  {editing ? (
                    <>
                      <ResumeButton label={isSavingJournalEdit ? "Saving..." : "Save changes"} icon="checkmark-circle-outline" onPress={() => saveJournalEntryEdit(entry)} style={[phoneLayout && styles.phoneJournalActionButton, journalDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneJournalActionText, journalDarkMode && styles.homeDarkResumeButtonText]} iconColor={journalDarkMode ? "#e9b76a" : undefined} />
                      <ResumeButton label="Cancel" icon="close-outline" onPress={cancelEditJournalEntry} style={[phoneLayout && styles.phoneJournalActionButton, journalDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneJournalActionText, journalDarkMode && styles.homeDarkResumeButtonText]} iconColor={journalDarkMode ? "#e9b76a" : undefined} />
                    </>
                  ) : (
                    <>
                      {entry.answers && <ResumeButton label={memoryMeditation ? "Meditate again" : "Revisit notes"} icon={memoryMeditation ? "sparkles-outline" : "book-outline"} onPress={() => resumeSession(entry)} style={[phoneLayout && styles.phoneJournalActionButton, journalDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneJournalActionText, journalDarkMode && styles.homeDarkResumeButtonText]} iconColor={journalDarkMode ? "#e9b76a" : undefined} />}
                      {entry.answers && !memoryMeditation && entry.reviewStatus === "scheduled" && isStudyReviewDue(entry) && (
                        <ResumeButton
                          label={activeStudyReviewId === rawEntryId ? "Hide review" : "Review now"}
                          icon="refresh-circle-outline"
                          onPress={() => {
                            setActiveStudyReviewId(activeStudyReviewId === rawEntryId ? "" : rawEntryId);
                            setStudyReviewNote("");
                          }}
                          style={[phoneLayout && styles.phoneJournalActionButton, journalDarkMode && styles.homeDarkResumeButton]}
                          labelStyle={[phoneLayout && styles.phoneJournalActionText, journalDarkMode && styles.homeDarkResumeButtonText]}
                          iconColor={journalDarkMode ? "#e9b76a" : undefined}
                        />
                      )}
                      {entry.answers && !memoryMeditation && entry.reviewStatus !== "scheduled" && (
                        <ResumeButton
                          label={reviewScheduleStudyId === rawEntryId ? "Hide review options" : entry.reviewStatus === "reviewed" ? "Review again later" : "Review later"}
                          icon="calendar-outline"
                          onPress={() => {
                            setReviewScheduleStudyId(reviewScheduleStudyId === rawEntryId ? "" : rawEntryId);
                            setPendingRemoveStudyReviewId("");
                            setStudyReviewStatus("");
                          }}
                          style={[phoneLayout && styles.phoneJournalActionButton, journalDarkMode && styles.homeDarkResumeButton]}
                          labelStyle={[phoneLayout && styles.phoneJournalActionText, journalDarkMode && styles.homeDarkResumeButtonText]}
                          iconColor={journalDarkMode ? "#e9b76a" : undefined}
                        />
                      )}
                      {!entry.answers && <ResumeButton label="Edit entry" icon="create-outline" onPress={() => startEditJournalEntry(entry)} style={[phoneLayout && styles.phoneJournalActionButton, journalDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneJournalActionText, journalDarkMode && styles.homeDarkResumeButtonText]} iconColor={journalDarkMode ? "#e9b76a" : undefined} />}
                    </>
                  )}
                  <ResumeButton
                    label="Delete entry"
                    icon="trash-outline"
                    onPress={() => {
                      setPendingDeleteJournalEntryId(rawEntryId);
                      setJournalDeleteStatus("");
                    }}
                    style={[phoneLayout && styles.phoneJournalActionButton, journalDarkMode && styles.homeDarkResumeButton]}
                    labelStyle={[phoneLayout && styles.phoneJournalActionText, journalDarkMode && styles.homeDarkResumeButtonText]}
                    iconColor={journalDarkMode ? "#e9b76a" : undefined}
                  />
                </View>
                {entry.answers && !memoryMeditation && entry.reviewStatus !== "scheduled" && reviewScheduleStudyId === rawEntryId && (
                  <View style={[styles.reviewScheduleBox, journalDarkMode && styles.accountDarkInsetBox]}>
                    <Text style={[styles.lastCheckinLabel, journalDarkMode && styles.studyDarkAccentText]}>Bring this study back</Text>
                    {renderReviewScheduleOptions(entry, rawEntryId)}
                  </View>
                )}
              </>
            )}
          </Card>
        );
              })}
            </View>
          ))}
        </View>
      )}
      {showJournalEmptyState && (
        <View style={[styles.emptyJournalBox, journalDarkMode && styles.accountDarkSection]}>
          <Ionicons name={journalSearchTerm ? "search-outline" : "reader-outline"} size={24} color={colors.coral} />
          <Text style={[styles.emptyJournalTitle, journalDarkMode && styles.accountDarkTitle]}>{journalSearchTerm ? "No matching entries" : "No journal entries yet"}</Text>
          <Text style={[styles.emptyJournalText, journalDarkMode && styles.accountDarkMutedText]}>
            {journalSearchTerm
              ? "Try a passage, method name, answer phrase, or encouragement word."
              : journalFilter === "drafts"
                ? "Drafts appear here once you begin writing a study response."
                : journalFilter === "highlights"
                  ? "Highlighted verses appear here after you mark up a passage and save your study."
                  : journalFilter === "meditations"
                    ? "Memory meditations appear here after you save one from the Memory tab."
                  : journalFilter === "checkins"
                    ? "Encouragements appear here after you save one from Community."
                    : `${friendlyName}, complete a study or save an encouragement to start building your journal.`}
          </Text>
          {!journalSearchTerm && (
            <AppButton
              label={journalFilter === "meditations" ? "Open Memory" : "Start a study"}
              variant="secondary"
              onPress={() => setTab(journalFilter === "meditations" ? "memory" : "study")}
              style={journalDarkMode && styles.homeDarkResumeButton}
              labelStyle={journalDarkMode && styles.homeDarkResumeButtonText}
            />
          )}
        </View>
      )}
      <Modal transparent visible={!!pendingDeleteJournalEntry} animationType="fade" onRequestClose={closeDeleteJournalDialog}>
        <View {...deleteDialogAccessibilityProps} style={[styles.printOptionsOverlay, styles.editorDialogOverlay]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel deleting journal entry"
            style={[styles.printOptionsScrim, journalDarkMode && styles.printDarkOptionsScrim]}
            onPress={closeDeleteJournalDialog}
          />
          <View style={[styles.printOptionsCard, styles.journalDeleteDialogCard, phoneLayout && styles.phoneEditorSettingsCard, journalDarkMode && styles.accountDarkMainCard]}>
            <View style={styles.printOptionsHeader}>
              <View style={styles.printOptionsTitleBlock}>
                <Text style={[styles.printOptionsTitle, journalDarkMode && styles.accountDarkTitle]}>Delete journal entry?</Text>
                <Text style={[styles.printOptionsSubtitle, journalDarkMode && styles.accountDarkMutedText]}>
                  {pendingDeleteJournalEntryTitle ? `“${pendingDeleteJournalEntryTitle}” will be permanently removed.` : "This journal entry will be permanently removed."} This cannot be undone.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel deleting journal entry"
                onPress={closeDeleteJournalDialog}
                style={[styles.readerBookmarkIconButton, journalDarkMode && styles.homeDarkIconBubble]}
              >
                <Ionicons name="close-outline" size={18} color={journalDarkMode ? "#c8bda9" : colors.muted} />
              </Pressable>
            </View>
            {!!journalDeleteStatus && <Text style={styles.saveStatus}>{journalDeleteStatus}</Text>}
            <View style={[styles.printOptionsActions, phoneLayout && styles.phoneRhythmGraceActions]}>
              <AppButton
                label="Cancel"
                variant="secondary"
                onPress={closeDeleteJournalDialog}
                style={journalDarkMode && styles.homeDarkResumeButton}
                labelStyle={journalDarkMode && styles.homeDarkResumeButtonText}
              />
              <AppButton
                label={isDeletingJournalEntry ? "Deleting..." : "Delete entry"}
                onPress={() => pendingDeleteJournalEntry && deleteJournalEntry(pendingDeleteJournalEntry)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>

  );
}
