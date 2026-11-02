// @ts-nocheck
import Ionicons from "@expo/vector-icons/Ionicons";
import { Suspense, useEffect, useRef, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { COMMON_MEMORY_REVIEW_OPTIONS, MORE_MEMORY_REVIEW_OPTIONS, buildMemoryCollectionCards, formatMemoryHistoryDate, getMemoryVerseCollections, isMemoryVerseDue, memoryHistoryEventIcon, memoryHistoryEventLabel, memoryPracticeLabel, memoryReviewDateLabel, memoryVerseProgressDetail, memoryVerseProgressMessage, normalizeMemoryAnswer, reviewPresetForStoredRhythm } from "@/data/memory";
import { AppButton, Card, Eyebrow, colors } from "@/components/ui";
import { StableMemoryInput } from "./StableMemoryInput";
import { MemoryBlank } from "@/components/MemoryBlank";
import { MemoryHistoryPanel } from "@/components/MemoryHistoryPanel";

export function MemoryTab(props: any) {
  const PracticeGrid = Platform.OS === "web" && props.phoneLayout ? StableMemoryInput : View;
  const [collectionMenuName, setCollectionMenuName] = useState("");
  const [renameCollectionFrom, setRenameCollectionFrom] = useState("");
  const [renameCollectionDraft, setRenameCollectionDraft] = useState("");
  const [renameCollectionError, setRenameCollectionError] = useState("");
  const [renamingCollection, setRenamingCollection] = useState(false);
  const [pendingSharedReview, setPendingSharedReview] = useState<{ verses: any[]; preset: string; bulk: boolean } | null>(null);
  const [rememberSharedReviewWarning, setRememberSharedReviewWarning] = useState(false);
  const sharedReviewWarningSkippedForProfile = useRef("");
  const [reorderMode, setReorderMode] = useState(false);
  const reorderModeRef = useRef(false);
  const [draftCollectionOrder, setDraftCollectionOrder] = useState<string[]>([]);
  const [dragOverCollection, setDragOverCollection] = useState("");
  const [dragPreview, setDragPreview] = useState<{ name: string; x: number; y: number; width: number; height: number; offsetX: number; offsetY: number } | null>(null);
  const pointerDrag = useRef({ name: "", x: 0, y: 0, moved: false });
  const webDragPointerId = useRef<number | null>(null);
  const webDragCleanup = useRef<(() => void) | null>(null);
  const webDragUpdate = useRef<(source: string, x: number, y: number) => void>(() => {});
  const webDragFinish = useRef<() => void>(() => {});
  const dragTarget = useRef("");
  const lastDragTarget = useRef("");
  const collectionRefs = useRef<Record<string, any>>({});
  const collectionBounds = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const CollectionWrapper = Platform.OS === "web" ? "div" : View;
  const CollectionGrid = Platform.OS === "web" ? "div" : View;
  const {
    activeMemoryCollectionDueCount,
    activeProfileId,
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
    requestMemoryVerseAction,
    restoreArchivedMemoryVerse,
    dueMemoryCount,
    dueMemoryReviewSort,
    expandedMemoryFilterBook,
    expandedMemoryVerseIds,
    expandedReviewOptionsVerseId,
    firstName,
    focusMemoryBlankAfter,
    friendlyName,
    historyMemoryVerseId,
    memoryFinishRef,
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
    memoryCollectionsHome,
    memoryCollectionOptions,
    memoryCollectionNames,
    memoryCollectionOrder,
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
    openMemoryCollectionBuilder,
    openMemoryPrintOptions,
    phoneLayout,
    phoneMemoryFocusMode,
    removeMemoryVerseCollection,
    renameMemoryCollection,
    repeatMemoryPracticeStep,
    reviewScheduleVerseId,
    ResumeButton,
    reviewedMemoryReviewSort,
    reviewedTodayCount,
    saveMemoryMeditation,
    saveMemoryVerseCollections,
    saveMemoryCollectionOrder,
    scheduleFilteredMemoryReview,
    scheduleMemoryVerseReview,
    sharedReviewWarningDismissed,
    saveSharedReviewWarningDismissed,
    resetSharedReviewWarningDismissed,
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
    setMemoryCollectionsHome,
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

  const savedMemoryVerses = (memoryVerses || []).filter((verse: any) => !verse.archivedAt);
  const activeCollectionName = memoryCollectionFilter === "all" ? "All Verses" : memoryCollectionFilter;
  const collectionDueCount = activeMemoryCollectionDueCount;
  const collectionSavedCount = memoryCollectionFilter === "all"
    ? savedMemoryVerses.length
    : (memoryCollectionOptions.find((option: any) => option.name === memoryCollectionFilter)?.count ?? 0);
  const collectionCards = buildMemoryCollectionCards(memoryVerses || [], reorderMode ? draftCollectionOrder : memoryCollectionOrder, memoryCollectionNames);
  const customCollectionNames = collectionCards.filter((collection) => collection.key.startsWith("custom:")).map((collection) => collection.name);

  useEffect(() => () => webDragCleanup.current?.(), []);

  function requestReviewScheduleChange(verses: any[], preset: string, bulk = false) {
    const shared = verses.filter((verse: any) => getMemoryVerseCollections(verse).length > 1);
    if (shared.length && !sharedReviewWarningDismissed && sharedReviewWarningSkippedForProfile.current !== String(activeProfileId)) {
      setRememberSharedReviewWarning(false);
      setPendingSharedReview({ verses, preset, bulk });
      return;
    }
    if (bulk) scheduleFilteredMemoryReview(preset);
    else scheduleMemoryVerseReview(verses[0], preset);
  }

  function confirmSharedReviewChange() {
    if (!pendingSharedReview) return;
    if (rememberSharedReviewWarning) {
      sharedReviewWarningSkippedForProfile.current = String(activeProfileId);
      saveSharedReviewWarningDismissed();
    }
    if (pendingSharedReview.bulk) scheduleFilteredMemoryReview(pendingSharedReview.preset);
    else scheduleMemoryVerseReview(pendingSharedReview.verses[0], pendingSharedReview.preset);
    setPendingSharedReview(null);
  }

  function chooseMemoryCollection(name: string) {
    clearMemoryBrowseFilters();
    setMemoryCollectionFilter(name);
    setMemoryCollectionPickerOpen(false);
    setMemoryBrowseFiltersOpen(false);
  }

  function moveCollection(source: string, target: string) {
    if (!source || !target || source === target) return;
    const next = [...customCollectionNames];
    const from = next.indexOf(source);
    const to = next.indexOf(target);
    if (from < 0 || to < 0) return;
    next.splice(from, 1);
    next.splice(to, 0, source);
    setDraftCollectionOrder(next);
  }

  function startCollectionReorder() {
    if (customCollectionNames.length < 2 || reorderModeRef.current) return;
    setDraftCollectionOrder(customCollectionNames);
    reorderModeRef.current = true;
    setReorderMode(true);
  }

  function finishCollectionReorder() {
    if (!reorderModeRef.current) return;
    if (draftCollectionOrder.join("\u0000") !== buildMemoryCollectionCards(memoryVerses || [], memoryCollectionOrder, memoryCollectionNames)
      .filter((collection) => collection.key.startsWith("custom:"))
      .map((collection) => collection.name).join("\u0000")) {
      saveMemoryCollectionOrder(draftCollectionOrder);
    }
    reorderModeRef.current = false;
    setReorderMode(false);
    finishCollectionDrag();
  }

  function collectionAtPointer(x: number, y: number) {
    if (typeof document === "undefined") return "";
    return document.elementFromPoint(x, y)?.closest("[data-memory-collection]")?.getAttribute("data-memory-collection") || "";
  }

  function finishCollectionDrag() {
    webDragCleanup.current?.();
    webDragCleanup.current = null;
    webDragPointerId.current = null;
    pointerDrag.current = { name: "", x: 0, y: 0, moved: false };
    dragTarget.current = "";
    lastDragTarget.current = "";
    setDragOverCollection("");
    setDragPreview(null);
  }

  function previewCollectionMove(source: string, target: string) {
    setDragOverCollection(target && target !== source ? target : "");
    if (!target) {
      lastDragTarget.current = "";
      return;
    }
    if (target === source) return;
    if (lastDragTarget.current === target) return;
    lastDragTarget.current = target;
    moveCollection(source, target);
  }

  webDragUpdate.current = (source: string, x: number, y: number) => {
    if (pointerDrag.current.name !== source) return;
    if (Math.hypot(x - pointerDrag.current.x, y - pointerDrag.current.y) > 8) pointerDrag.current.moved = true;
    if (!pointerDrag.current.moved) return;
    setDragPreview((current) => current ? { ...current, x: x - current.offsetX, y: y - current.offsetY } : null);
    previewCollectionMove(source, collectionAtPointer(x, y));
  };
  webDragFinish.current = finishCollectionDrag;

  function startWebCollectionDrag(event: any, name: string) {
    if (event.isPrimary === false || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    event.stopPropagation();
    finishCollectionDrag();
    const pointerId = event.pointerId;
    const rect = event.currentTarget.closest("[data-memory-collection]")?.getBoundingClientRect();
    if (!rect) return;
    webDragPointerId.current = pointerId;
    pointerDrag.current = { name, x: event.clientX, y: event.clientY, moved: false };
    setDragPreview({ name, x: rect.left, y: rect.top, width: rect.width, height: rect.height, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top });

    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== webDragPointerId.current) return;
      moveEvent.preventDefault();
      webDragUpdate.current(name, moveEvent.clientX, moveEvent.clientY);
    };
    const onEnd = (endEvent: PointerEvent) => {
      if (endEvent.pointerId !== webDragPointerId.current) return;
      webDragUpdate.current(name, endEvent.clientX, endEvent.clientY);
      webDragFinish.current();
    };
    const onCancel = (cancelEvent: PointerEvent) => {
      if (cancelEvent.pointerId === webDragPointerId.current) webDragFinish.current();
    };
    const onBlur = () => webDragFinish.current();
    const onVisibilityChange = () => { if (document.hidden) webDragFinish.current(); };
    window.addEventListener("pointermove", onMove, { capture: true, passive: false });
    window.addEventListener("pointerup", onEnd, true);
    window.addEventListener("pointercancel", onCancel, true);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);
    webDragCleanup.current = () => {
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onEnd, true);
      window.removeEventListener("pointercancel", onCancel, true);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }

  function measureNativeCollections() {
    collectionBounds.current = {};
    customCollectionNames.forEach((name) => collectionRefs.current[name]?.measureInWindow?.((x: number, y: number, width: number, height: number) => {
      collectionBounds.current[name] = { x, y, width, height };
    }));
  }

  function nativeCollectionAtPointer(x: number, y: number) {
    return customCollectionNames.find((name) => {
      const bounds = collectionBounds.current[name];
      return bounds && x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height;
    }) || "";
  }

  async function confirmCollectionRename() {
    const name = renameCollectionDraft.trim().replace(/\s+/g, " ");
    if (!name || name.length > 40) {
      setRenameCollectionError("Enter a name of up to 40 characters.");
      return;
    }
    if (["all verses", "due for review"].includes(name.toLowerCase())) {
      setRenameCollectionError("That name is reserved. Choose another name.");
      return;
    }
    if (memoryCollectionOptions.some((collection: any) => collection.name !== renameCollectionFrom && collection.name.toLowerCase() === name.toLowerCase())) {
      setRenameCollectionError("A collection with that name already exists.");
      return;
    }
    if (name === renameCollectionFrom) {
      setRenameCollectionFrom("");
      return;
    }
    setRenamingCollection(true);
    setRenameCollectionError("");
    try {
      await renameMemoryCollection(renameCollectionFrom, name);
      setRenameCollectionFrom("");
    } catch (error: any) {
      setRenameCollectionError(String(error?.message || "Could not rename this collection. Please try again."));
    } finally {
      setRenamingCollection(false);
    }
  }

  return (
    <View style={[styles.layout, styles.memoryLayout, compactLayout && styles.stackedLayout, communitySubView === "history" && styles.focusLayout, memoryDarkMode && styles.accountDarkLayout]}>
      <Card style={[styles.mainCard, styles.memoryMainCard, compactLayout && styles.fluidCard, communitySubView === "history" && styles.focusMainCard, memoryDarkMode && styles.accountDarkMainCard]}>
        <View style={styles.phoneMemoryHeaderRow}>
          <Eyebrow>Memory</Eyebrow>
          {!activeMemoryVerseId && props.contextHelpControl}
          {!phoneMemoryFocusMode && (memoryVerses || []).length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={addMemoryPanelOpen ? "Hide add memory verse options" : "Add memory verses"}
              onPress={() => setAddMemoryPanelOpen((open) => !open)}
              style={[styles.phoneMemoryHeaderAddButton, !phoneLayout && styles.memoryHeaderAddButton, memoryDarkMode && styles.homeDarkIconBubble]}
            >
              <Ionicons name={addMemoryPanelOpen ? "close-circle-outline" : "add-circle-outline"} size={24} color={memoryDarkMode ? "#d4a768" : colors.coral} />
              {!phoneLayout && <Text style={[styles.memoryHeaderAddLabel, memoryDarkMode && styles.accountDarkText]}>Add verses</Text>}
            </Pressable>
          )}
        </View>
        <Text style={[styles.title, memoryDarkMode && styles.accountDarkTitle]}>{firstName ? `${firstName}, memorize saved verses` : "Memorize saved verses"}</Text>
        {!phoneMemoryFocusMode && (
          <>
            {!phoneLayout && <Text style={[styles.titleSupport, styles.memoryTitleSupport, memoryDarkMode && styles.accountDarkMutedText]}>Hide a little at a time and carry Scripture with you through the day.</Text>}
            {addMemoryPanelOpen && (
              <View style={[styles.phoneMemoryHeaderAddPanel, styles.memoryAddMenuPanel, memoryDarkMode && styles.accountDarkInsetBox]}>
                <View style={styles.phoneAddMemoryActions}>
                  <AppButton
                    label="Find in Bible"
                    onPress={() => {
                      setAddMemoryPanelOpen(false);
                      setTab("bible");
                    }}
                    style={styles.phoneMemoryAddActionButton}
                  />
                  <AppButton
                    label="Open Study"
                    variant="secondary"
                    onPress={() => {
                      setAddMemoryPanelOpen(false);
                      setTab("study");
                    }}
                    style={[styles.phoneMemoryAddActionButton, memoryDarkMode && styles.homeDarkResumeButton]}
                    labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText}
                  />
                </View>
              </View>
            )}
            {(memoryVerses || []).length > 0 && <View style={[styles.metricGrid, styles.memoryCompactMetricGrid, phoneLayout && styles.phoneMemoryMetricGrid]}>
              <Metric value={savedMemoryVerses.length} label="saved" compact={phoneLayout} style={[styles.memoryCompactMetric, memoryDarkMode && styles.homeDarkMetric]} valueStyle={memoryDarkMode && styles.homeDarkMetricValue} labelStyle={memoryDarkMode && styles.accountDarkMutedText} />
              <Metric value={dueMemoryCount} label="due now" compact={phoneLayout} style={[styles.memoryCompactMetric, memoryDarkMode && styles.homeDarkMetric]} valueStyle={memoryDarkMode && styles.homeDarkMetricValue} labelStyle={memoryDarkMode && styles.accountDarkMutedText} />
              <Metric value={reviewedTodayCount} label="reviewed today" compact={phoneLayout} labelLines={2} style={[styles.memoryCompactMetric, memoryDarkMode && styles.homeDarkMetric]} valueStyle={memoryDarkMode && styles.homeDarkMetricValue} labelStyle={memoryDarkMode && styles.accountDarkMutedText} />
            </View>}
          </>
        )}
        {phoneMemoryFocusMode && (
          <View style={[styles.memoryFocusBanner, memoryDarkMode && styles.memoryDarkFocusBanner]}>
            <Ionicons name={activeMemoryMeditationVerseId ? "leaf-outline" : "school-outline"} size={18} color={memoryDarkMode ? "#d4a768" : colors.coral} />
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
        {(memoryVerses || []).length === 0 && memoryCollectionOptions.length === 0 ? (
          <View style={[styles.emptyJournalBox, memoryDarkMode && styles.accountDarkSection]}>
            <Ionicons name="sparkles-outline" size={24} color={memoryDarkMode ? "#d4a768" : colors.coral} />
            <Text style={[styles.emptyJournalTitle, memoryDarkMode && styles.accountDarkTitle]}>No memory verses yet</Text>
            <Text style={[styles.emptyJournalText, memoryDarkMode && styles.accountDarkMutedText]}>{firstName ? `${firstName}, open the Bible, select one or more verses, then tap Memory. You can also save verses while studying.` : "Open the Bible, select one or more verses, then tap Memory. You can also save verses while studying."}</Text>
            <View style={styles.emptyMemoryActions}>
              <AppButton label="Open Bible" onPress={() => setTab("bible")} />
              <AppButton label="Open Study" variant="secondary" onPress={() => setTab("study")} style={memoryDarkMode && styles.homeDarkResumeButton} labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText} />
              <AppButton label="Create collection" variant="secondary" onPress={openMemoryCollectionBuilder} style={memoryDarkMode && styles.homeDarkResumeButton} labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText} />
            </View>
          </View>
        ) : (
          <View style={styles.memoryList}>
            {!phoneMemoryFocusMode && (
              <>
                <View style={[styles.memoryModeToolbar, phoneLayout && styles.phoneMemoryModeToolbar]}>
                  <View style={[styles.memoryViewToggle, styles.memoryModeToggle, memoryDarkMode && styles.accountDarkSegmentedRow]}>
                    {[
                      ["browse", "Verses"],
                      ["history", "History"],
                      ["archive", "Archive"]
                    ].map(([key, label]) => (
                      <Pressable
                        key={key}
                        onPress={() => {
                          if (reorderModeRef.current) finishCollectionReorder();
                          setMemorySearch("");
                          setMemoryBrowseFiltersOpen(false);
                          if (key === "browse") {
                            clearMemoryBrowseFilters();
                            setMemoryCollectionsHome(true);
                          }
                          setMemoryView(key as MemoryView);
                        }}
                        style={[styles.memoryViewButton, memoryView === key && styles.activeMemoryViewButton, memoryDarkMode && memoryView === key && styles.accountDarkActiveSegment]}
                      >
                        <Text style={[styles.memoryViewText, memoryDarkMode && styles.accountDarkMutedText, memoryView === key && styles.activeMemoryViewText, memoryDarkMode && memoryView === key && styles.studyDarkAccentText]}>{label}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Pressable
                    onPress={() => setMemoryToolbarMoreOpen((open) => !open)}
                    style={[styles.memoryPrintCardsButton, phoneLayout && styles.phoneMemoryPrintIconButton, memoryDarkMode && styles.homeDarkResumeButton]}
                    accessibilityLabel={memoryToolbarMoreOpen ? "Hide memory options" : "Show memory options"}
                  >
                    <Ionicons name="ellipsis-horizontal" size={20} color={memoryDarkMode ? "#d4a768" : colors.oliveDark} />
                  </Pressable>
                </View>
                {memoryToolbarMoreOpen && (
                  <View style={[styles.phoneMemoryToolbarMoreMenu, memoryDarkMode && styles.accountDarkInsetBox]}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        setMemoryToolbarMoreOpen(false);
                        openMemoryPrintOptions();
                      }}
                      style={styles.phoneMemoryMoreMenuItem}
                    >
                      <Ionicons name="print-outline" size={16} color={memoryDarkMode ? "#d4a768" : colors.oliveDark} />
                      <Text style={[styles.phoneMemoryMoreMenuText, memoryDarkMode && styles.homeDarkResumeButtonText]}>Print cards</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        setMemoryToolbarMoreOpen(false);
                        openMemoryCollectionBuilder();
                      }}
                      style={styles.phoneMemoryMoreMenuItem}
                    >
                      <Ionicons name="albums-outline" size={16} color={memoryDarkMode ? "#d4a768" : colors.oliveDark} />
                      <Text style={[styles.phoneMemoryMoreMenuText, memoryDarkMode && styles.homeDarkResumeButtonText]}>New collection</Text>
                    </Pressable>
                    {sharedReviewWarningDismissed && (
                      <Pressable accessibilityRole="button" onPress={() => {
                        sharedReviewWarningSkippedForProfile.current = "";
                        resetSharedReviewWarningDismissed();
                        setMemoryToolbarMoreOpen(false);
                      }} style={styles.phoneMemoryMoreMenuItem}>
                        <Ionicons name="information-circle-outline" size={16} color={memoryDarkMode ? "#d4a768" : colors.oliveDark} />
                        <Text style={[styles.phoneMemoryMoreMenuText, memoryDarkMode && styles.homeDarkResumeButtonText]}>Show shared review reminder</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </>
            )}
            {!phoneMemoryFocusMode && memoryView === "browse" && memoryCollectionsHome && (
              <View style={[styles.memoryReviewCompactRow, phoneLayout && styles.phoneMemoryReviewCompactRow]}>
                <View style={[styles.memoryReviewPromptBox, styles.memoryReviewCompactBox, memoryStatus ? styles.memoryReviewSuccessBox : styles.memoryReviewEncourageBox, memoryDarkMode && styles.accountDarkSection]}>
                  <Ionicons
                    name={memoryStatus ? "checkmark-circle-outline" : dueMemoryCount > 0 ? "school-outline" : "sparkles-outline"}
                    size={20}
                    color={memoryDarkMode ? "#d4a768" : colors.coral}
                  />
                  <View style={styles.memoryReviewPromptContent}>
                    <Text style={[styles.memoryReviewPromptText, memoryDarkMode && styles.accountDarkText]}>
                      {memoryStatus === "reviewed-today"
                        ? `Well done${firstName ? `, ${firstName}` : ""}. You reviewed ${Math.max(reviewedTodayCount, 1)} verse${Math.max(reviewedTodayCount, 1) === 1 ? "" : "s"} today.`
                        : memoryStatus || (dueMemoryCount > 0
                          ? `${dueMemoryCount} verse${dueMemoryCount === 1 ? " is" : "s are"} ready for review today.`
                          : reviewedTodayCount > 0
                            ? `Well done${firstName ? `, ${firstName}` : ""}. You reviewed ${reviewedTodayCount} verse${reviewedTodayCount === 1 ? "" : "s"} today.`
                            : "No verses are due today. You can practise any saved verse whenever you like.")}
                    </Text>
                  </View>
                </View>
                {memoryCollectionsHome && dueMemoryCount > 0 && (
                  <AppButton
                    label="Review all due verses"
                    onPress={() => startDueMemoryReviewQueue()}
                    style={phoneLayout && styles.phoneMemoryReviewActionButton}
                  />
                )}
              </View>
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
                <View style={[styles.memoryCollectionsHeader, styles.memoryCollectionsHeaderCompact]}>
                  {memoryCollectionsHome && <View style={styles.memoryCollectionsTitleBlock}>
                    <Text style={[styles.feedbackTitle, memoryDarkMode && styles.accountDarkTitle]}>
                      My collections
                    </Text>
                    <Text style={[styles.muted, memoryDarkMode && styles.accountDarkMutedText]}>
                      {reorderMode ? "Drag a handle to reorder. All Verses stays first." : "Keep verses together by theme or Bible book."}
                    </Text>
                  </View>}
                  {memoryCollectionsHome ? (
                    reorderMode ? (
                      <AppButton label="Done" onPress={finishCollectionReorder} />
                    ) : (
                      <View style={styles.memoryCollectionHeaderActions}>
                        {customCollectionNames.length > 1 && (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Reorder collections"
                            onPress={startCollectionReorder}
                            style={[styles.memoryCollectionReorderButton, memoryDarkMode && styles.homeDarkResumeButton]}
                          ><Ionicons name="reorder-three-outline" size={19} color={memoryDarkMode ? "#d4a768" : colors.oliveDark} /><Text style={[styles.memoryCollectionReorderLabel, memoryDarkMode && styles.accountDarkText]}>Reorder</Text></Pressable>
                        )}
                        <AppButton
                          label="New collection"
                          variant="secondary"
                          onPress={openMemoryCollectionBuilder}
                          style={memoryDarkMode && styles.homeDarkResumeButton}
                          labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText}
                        />
                      </View>
                    )
                  ) : (
                    <View style={[styles.memoryCollectionHeaderActions, styles.memoryCollectionBackActions, phoneLayout && styles.phoneMemoryCollectionDetailActions]}>
                      <AppButton
                        label="My collections"
                        variant="secondary"
                        onPress={() => {
                          clearMemoryBrowseFilters();
                          setMemorySearch("");
                          setMemoryCollectionsHome(true);
                        }}
                        style={memoryDarkMode && styles.homeDarkResumeButton}
                        labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText}
                      />
                    </View>
                  )}
                </View>
                {!memoryCollectionsHome && (
                  <View style={[styles.memoryReviewCompactRow, phoneLayout && styles.phoneMemoryReviewCompactRow]}>
                    <View style={[styles.memoryReviewPromptBox, styles.memoryReviewCompactBox, styles.memoryReviewEncourageBox, memoryDarkMode && styles.accountDarkSection]}>
                      <Ionicons name={collectionDueCount > 0 ? "school-outline" : "sparkles-outline"} size={20} color={memoryDarkMode ? "#d4a768" : colors.coral} />
                      <View style={styles.memoryReviewPromptContent}>
                        <Text style={[styles.feedbackTitle, memoryDarkMode && styles.studyDarkAccentText]}>{activeCollectionName}</Text>
                        <Text style={[styles.memoryReviewPromptText, memoryDarkMode && styles.accountDarkText]}>
                          {collectionDueCount > 0
                            ? `${collectionDueCount} verse${collectionDueCount === 1 ? " is" : "s are"} ready for review today.`
                            : "No verses are due for review in this collection today."}
                        </Text>
                        <Text style={[styles.muted, memoryDarkMode && styles.accountDarkMutedText]}>
                          {collectionSavedCount} saved verses in this collection
                        </Text>
                        {!!memoryStatus && memoryStatus !== "reviewed-today" && (
                          <Text style={[styles.muted, memoryDarkMode && styles.accountDarkMutedText]}>{memoryStatus}</Text>
                        )}
                      </View>
                    </View>
                    {collectionDueCount > 0 && (
                      <AppButton
                        label="Review all due verses"
                        onPress={() => startDueMemoryReviewQueue(memoryCollectionFilter)}
                        style={phoneLayout && styles.phoneMemoryReviewActionButton}
                      />
                    )}
                  </View>
                )}
                {memoryCollectionsHome && (
                  <CollectionGrid style={Platform.OS === "web"
                    ? { ...(styles.memoryCollectionFolderGrid as any), display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gridAutoRows: "1fr", alignItems: "stretch" }
                    : styles.memoryCollectionFolderGrid}>
                    {collectionCards.map((collection: any) => {
                      const isCustom = collection.key.startsWith("custom:");
                      const customIndex = customCollectionNames.indexOf(collection.name);
                      return (
                        <CollectionWrapper
                          key={collection.key}
                          style={Platform.OS === "web"
                            ? { ...(styles.memoryCollectionWrapper as any), width: "100%", height: "100%" }
                            : styles.memoryCollectionWrapper}
                          data-memory-collection={isCustom ? collection.name : undefined}
                          onContextMenu={Platform.OS === "web" && isCustom ? (event: any) => {
                            event.preventDefault();
                            startCollectionReorder();
                          } : undefined}
                        >
                          <Pressable
                            ref={(node: any) => { if (isCustom) collectionRefs.current[collection.name] = node; }}
                            accessibilityRole="button"
                            accessibilityLabel={`${reorderMode ? "Reordering" : "Open"} ${collection.name}, ${collection.count} verse${collection.count === 1 ? "" : "s"}${collection.dueCount ? `, ${collection.dueCount} due` : ""}`}
                            accessibilityState={{ disabled: reorderMode }}
                            disabled={reorderMode}
                            onLongPress={isCustom && !reorderMode ? startCollectionReorder : undefined}
                            onPress={() => {
                              if (reorderModeRef.current) return;
                              clearMemoryBrowseFilters();
                              setMemorySearch("");
                              if (isCustom) setMemoryCollectionFilter(collection.name);
                              setMemoryCollectionsHome(false);
                            }}
                            style={[styles.memoryCollectionFolder, Platform.OS === "web" && { height: "100%" }, phoneLayout && Platform.OS !== "web" && styles.phoneMemoryCollectionFolder, memoryDarkMode && styles.accountDarkSection, reorderMode && isCustom && styles.memoryCollectionEditing, dragOverCollection === collection.name && styles.memoryCollectionDropTarget, dragPreview?.name === collection.name && styles.memoryCollectionDraggingPlaceholder]}
                          >
                            <View style={styles.memoryCollectionCardHeader}>
                              <Ionicons name={collection.key === "all" ? "albums-outline" : "folder-outline"} size={21} color={memoryDarkMode ? "#d4a768" : colors.coral} />
                            </View>
                            {collection.dueCount > 0 && !(reorderMode && isCustom) && (
                              <Text style={[styles.reviewDatePill, styles.dueReviewDatePill, styles.memoryCollectionTopDuePill, memoryDarkMode && styles.memoryDarkDueReviewPill]}>
                                {collection.dueCount} due now
                              </Text>
                            )}
                            <Text style={[styles.bodyStrong, memoryDarkMode && styles.accountDarkText]}>{collection.name}</Text>
                            <View style={styles.memoryCollectionCardFooter}>
                              <Text style={[styles.memoryHistoryDate, memoryDarkMode && styles.accountDarkMutedText]}>
                                {collection.count} verse{collection.count === 1 ? "" : "s"}
                              </Text>
                            </View>
                          </Pressable>
                          {isCustom && !reorderMode && (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`More options for ${collection.name}`}
                              onPress={() => setCollectionMenuName(collection.name)}
                              style={[styles.memoryCollectionMenuButton, memoryDarkMode && styles.homeDarkIconBubble]}
                            >
                              <Ionicons name="ellipsis-horizontal" size={19} color={memoryDarkMode ? "#d4a768" : colors.oliveDark} />
                            </Pressable>
                          )}
                          {reorderMode && isCustom && (Platform.OS === "web" ? (
                            <div
                              role="button"
                              tabIndex={0}
                              aria-label={`Drag ${collection.name} to reorder. Use arrow keys to move it.`}
                              style={{ ...(styles.memoryCollectionDragHandle as any), ...(memoryDarkMode ? styles.accountDarkInsetBox as any : {}), touchAction: "none", cursor: "grab" }}
                              onKeyDown={(event: any) => {
                                if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                                  event.preventDefault();
                                  moveCollection(collection.name, customCollectionNames[customIndex - 1]);
                                } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                                  event.preventDefault();
                                  moveCollection(collection.name, customCollectionNames[customIndex + 1]);
                                }
                              }}
                              onPointerDown={(event: any) => startWebCollectionDrag(event, collection.name)}
                            ><Ionicons name="reorder-three-outline" size={22} color={memoryDarkMode ? "#d4a768" : colors.oliveDark} /></div>
                          ) : (
                            <View
                              accessibilityRole="adjustable"
                              accessibilityLabel={`Reorder ${collection.name}. Drag to move, or use accessibility actions.`}
                              accessibilityActions={[{ name: "decrement", label: "Move earlier" }, { name: "increment", label: "Move later" }]}
                              onAccessibilityAction={(event: any) => {
                                if (event.nativeEvent.actionName === "decrement") moveCollection(collection.name, customCollectionNames[customIndex - 1]);
                                if (event.nativeEvent.actionName === "increment") moveCollection(collection.name, customCollectionNames[customIndex + 1]);
                              }}
                              onStartShouldSetResponder={() => true}
                              onMoveShouldSetResponder={() => true}
                              onResponderGrant={(event: any) => {
                                measureNativeCollections();
                                pointerDrag.current = { name: collection.name, x: event.nativeEvent.pageX, y: event.nativeEvent.pageY, moved: false };
                              }}
                              onResponderMove={(event: any) => {
                                if (pointerDrag.current.name !== collection.name) return;
                                const x = event.nativeEvent.pageX;
                                const y = event.nativeEvent.pageY;
                                if (Math.hypot(x - pointerDrag.current.x, y - pointerDrag.current.y) > 8) pointerDrag.current.moved = true;
                                if (pointerDrag.current.moved) {
                                  dragTarget.current = nativeCollectionAtPointer(x, y);
                                  previewCollectionMove(collection.name, dragTarget.current);
                                }
                              }}
                              onResponderRelease={() => {
                                finishCollectionDrag();
                              }}
                              onResponderTerminate={finishCollectionDrag}
                              style={[styles.memoryCollectionDragHandle, memoryDarkMode && styles.accountDarkInsetBox]}
                            ><Ionicons name="reorder-three-outline" size={22} color={memoryDarkMode ? "#d4a768" : colors.oliveDark} /></View>
                          ))}
                        </CollectionWrapper>
                      );
                    })}
                    {Platform.OS === "web" && dragPreview && pointerDrag.current.moved && (
                      <div aria-hidden="true" style={{ position: "fixed", left: dragPreview.x, top: dragPreview.y, width: dragPreview.width, height: dragPreview.height, zIndex: 600, pointerEvents: "none", filter: "drop-shadow(0 12px 16px rgba(17, 39, 60, 0.2))" }}>
                        <View style={[styles.memoryCollectionFolder, styles.memoryCollectionEditing, memoryDarkMode && styles.accountDarkSection, { height: "100%" }]}>
                          <Ionicons name="folder-outline" size={21} color={memoryDarkMode ? "#d4a768" : colors.coral} />
                          {(collectionCards.find((item) => item.name === dragPreview.name)?.dueCount || 0) > 0 && (
                            <Text style={[styles.reviewDatePill, styles.dueReviewDatePill, styles.memoryCollectionTopDuePill, memoryDarkMode && styles.memoryDarkDueReviewPill]}>{collectionCards.find((item) => item.name === dragPreview.name)?.dueCount} due now</Text>
                          )}
                          <Text style={[styles.bodyStrong, memoryDarkMode && styles.accountDarkText]}>{dragPreview.name}</Text>
                          <View style={styles.memoryCollectionCardFooter}>
                            <Text style={[styles.memoryHistoryDate, memoryDarkMode && styles.accountDarkMutedText]}>{collectionCards.find((item) => item.name === dragPreview.name)?.count || 0} verses</Text>
                          </View>
                        </View>
                      </div>
                    )}
                  </CollectionGrid>
                )}
                {!memoryCollectionsHome && (
                <>
                <View style={[styles.journalSearchBox, memoryDarkMode && styles.accountDarkInput]}>
                  <Ionicons name="search-outline" size={18} color={memoryDarkMode ? "#d4a768" : colors.coral} />
                  <TextInput
                    value={memorySearch}
                    onChangeText={setMemorySearch}
                    placeholder="Search reference or verse text"
                    placeholderTextColor={memoryDarkMode ? "#8f8678" : undefined}
                    style={[styles.journalSearchInput, memoryDarkMode && styles.accountDarkText]}
                  />
                  {!!memorySearch.trim() && (
                    <Pressable onPress={() => setMemorySearch("")} style={styles.clearSearchButton}>
                      <Ionicons name="close-outline" size={18} color={memoryDarkMode ? "#bbb8b4" : colors.muted} />
                    </Pressable>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={memoryBrowseFiltersOpen ? "Hide verse filters" : "Filter verses"}
                    onPress={() => setMemoryBrowseFiltersOpen((open) => !open)}
                    style={styles.clearSearchButton}
                  >
                    <Ionicons name="options-outline" size={20} color={memoryDarkMode ? "#d4a768" : colors.oliveDark} />
                  </Pressable>
                </View>
                {memoryBrowseFilterSummary !== "All saved verses" && (
                  <Text style={[styles.memoryHistoryDate, memoryDarkMode && styles.accountDarkMutedText]}>Showing: {memoryBrowseFilterSummary}</Text>
                )}
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
                    <Ionicons name={memoryCollectionPickerOpen ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={memoryDarkMode ? "#d4a768" : colors.oliveDark} />
                  </Pressable>
                  {memoryCollectionPickerOpen && (
                    <View style={[styles.memoryCollectionPickerPanel, memoryDarkMode && styles.accountDarkInsetBox]}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          chooseMemoryCollection("all");
                        }}
                        style={styles.memoryCollectionPickerItem}
                      >
                        <Text style={[styles.bodyStrong, memoryDarkMode && styles.accountDarkText]}>All verses</Text>
                        <Text style={[styles.memoryHistoryDate, memoryDarkMode && styles.accountDarkMutedText]}>{savedMemoryVerses.length} saved verses</Text>
                      </Pressable>
                      {memoryCollectionOptions.map((collection) => (
                        <Pressable
                          key={collection.name}
                          accessibilityRole="button"
                          onPress={() => {
                            chooseMemoryCollection(collection.name);
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
                            <Ionicons name={memoryFilterMobileMenu === section.id ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={memoryDarkMode ? "#bbb8b4" : colors.muted} />
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
                  {currentBrowseMemoryVerses.some((verse: any) => !verse.archivedAt) && (
                    <View style={[styles.memoryBulkReviewBox, memoryDarkMode && styles.accountDarkInsetBox]}>
                      <View style={styles.reviewScheduleHeader}>
                        <View style={styles.memoryHistoryTextBlock}>
                          <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>Change review schedule</Text>
                          <Text style={[styles.memoryHistoryDate, memoryDarkMode && styles.accountDarkMutedText]}>
                            Applies to {currentBrowseMemoryVerses.filter((verse: any) => !verse.archivedAt).length} filtered verse{currentBrowseMemoryVerses.filter((verse: any) => !verse.archivedAt).length === 1 ? "" : "s"}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.filterRow}>
                        {COMMON_MEMORY_REVIEW_OPTIONS.map((option) => (
                          <Pressable
                            key={option.id}
                            accessibilityRole="button"
                            onPress={() => requestReviewScheduleChange(currentBrowseMemoryVerses.filter((verse: any) => !verse.archivedAt), option.id, true)}
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
                        <Ionicons name={bulkReviewOptionsExpanded ? "chevron-up-outline" : "chevron-down-outline"} size={15} color={memoryDarkMode ? "#d4a768" : colors.coral} />
                      </Pressable>
                      {bulkReviewOptionsExpanded && (
                        <View style={styles.filterRow}>
                          {MORE_MEMORY_REVIEW_OPTIONS.map((option) => (
                            <Pressable
                              key={option.id}
                              accessibilityRole="button"
                              onPress={() => requestReviewScheduleChange(currentBrowseMemoryVerses.filter((verse: any) => !verse.archivedAt), option.id, true)}
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
              </>
            )}
            {memoryView === "archive" && (
              <View style={[styles.journalSearchBox, memoryDarkMode && styles.accountDarkInput]}>
                <Ionicons name="search-outline" size={18} color={memoryDarkMode ? "#d4a768" : colors.coral} />
                <TextInput value={memorySearch} onChangeText={setMemorySearch} placeholder="Search archived verses" placeholderTextColor={memoryDarkMode ? "#8f8678" : undefined} style={[styles.journalSearchInput, memoryDarkMode && styles.accountDarkText]} />
                {!!memorySearch.trim() && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setMemorySearch("")} style={styles.clearSearchButton}><Ionicons name="close-outline" size={18} color={memoryDarkMode ? "#bbb8b4" : colors.muted} /></Pressable>}
              </View>
            )}
            {(memoryView !== "browse" || !memoryCollectionsHome || phoneMemoryFocusMode) && visibleMemorySections.map((section) => {
              const highlightedMemorySection = section.title === "Due for Review" || section.title === "Reviewed";
              const reviewedMemorySection = section.title === "Reviewed";
              const sectionSort = reviewedMemorySection ? reviewedMemoryReviewSort : dueMemoryReviewSort;
              const setSectionSort = reviewedMemorySection ? setReviewedMemoryReviewSort : setDueMemoryReviewSort;
              return (
              <View key={section.title} style={[styles.memorySection, phoneLayout && styles.phoneMemorySection]}>
                {!phoneMemoryFocusMode && (
                  <>
                    {!highlightedMemorySection && (
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
                    )}
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
                              style={[styles.memorySortButton, phoneLayout && styles.phoneMemorySortButton, sectionSort === key && styles.activeMemoryViewButton, memoryDarkMode && sectionSort === key && styles.accountDarkActiveSegment]}
                            >
                              <Text style={[styles.memoryViewText, memoryDarkMode && styles.accountDarkMutedText, phoneLayout && styles.phoneMemorySortText, sectionSort === key && styles.activeMemoryViewText, memoryDarkMode && sectionSort === key && styles.studyDarkAccentText]}>{label}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}
                    {section.title !== "Due for Review" && section.title !== "Reviewed" && (
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
                            <Ionicons name={cardExpanded ? "chevron-up-outline" : "chevron-down-outline"} size={17} color={memoryDarkMode ? "#d4a768" : colors.coral} />
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
                            {verse.archivedAt ? "Archived" : memoryReviewDateLabel(verse.nextReviewAt)}
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
                            <View style={[styles.contextHelpHeadingRow, phoneLayout && styles.phoneMemoryPracticeControls]}>
                            {props.contextHelpControl}
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
                          </View>
                          {memoryPracticeLevel === 1 ? (
                            <Text style={[styles.memoryPracticeText, phoneLayout && styles.phoneMemoryPracticeText, memoryDarkMode && styles.memoryDarkPracticeText]}>{memoryPracticeText}</Text>
                          ) : (
                            <PracticeGrid key={`${verseId}:${memoryPracticeLevel}`} style={[styles.memoryFillBox, phoneLayout && styles.phoneMemoryFillBox, memoryDarkMode && styles.memoryDarkFillBox]}>
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
                                    autoFocus={!phoneLayout && blankIndex === 0}
                                  />
                                ) : (
                                  <Text key={token.index} style={[styles.memoryPracticeWord, memoryDarkMode && styles.accountDarkText]}>{token.text}</Text>
                                );
                              })}
                            </PracticeGrid>
                          )}
                          {(memoryPracticeAllCorrect && memoryPracticeLevel > 1) ? (
                            <Text style={[styles.saveStatus, memoryDarkMode && styles.accountDarkText]}>{`Well done${firstName ? `, ${firstName}` : ""}. Every word is correct.`}</Text>
                          ) : (
                            !!memoryPracticeResult && <Text style={[styles.saveStatus, memoryDarkMode && styles.accountDarkText]}>{memoryPracticeResult}</Text>
                          )}
                          <View ref={memoryPracticeAllCorrect ? memoryFinishRef : undefined} collapsable={false} style={[styles.journalActions, phoneLayout && styles.phoneMemoryActions]}>
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
                              <ResumeButton label="Ready for Step 2" icon="checkmark-circle-outline" onPress={submitMemoryPractice} style={[phoneLayout && styles.phoneMemoryActionButton, memoryDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneMemoryActionText, memoryDarkMode && styles.homeDarkResumeButtonText]} iconColor={memoryDarkMode ? "#d4a768" : undefined} />
                            ) : null}
                            {memoryPracticeLevel > 1 && (
                              <ResumeButton label="Repeat" icon="refresh-outline" onPress={repeatMemoryPracticeStep} style={[phoneLayout && styles.phoneMemoryActionButton, memoryDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneMemoryActionText, memoryDarkMode && styles.homeDarkResumeButtonText]} iconColor={memoryDarkMode ? "#d4a768" : undefined} />
                            )}
                            {memoryPracticeLevel > 1 && !memoryPracticeAllCorrect && (
                              <ResumeButton
                                label={memoryHintsVisible ? "Hide hints" : "Show hints"}
                                icon="bulb-outline"
                                onPress={() => setMemoryHintsVisible((visible) => !visible)}
                                style={[phoneLayout && styles.phoneMemoryActionButton, memoryDarkMode && styles.homeDarkResumeButton]}
                                labelStyle={[phoneLayout && styles.phoneMemoryActionText, memoryDarkMode && styles.homeDarkResumeButtonText]}
                                iconColor={memoryDarkMode ? "#d4a768" : undefined}
                              />
                            )}
                            <ResumeButton label="Close" icon="close-outline" onPress={activeMemoryReviewQueueCount > 0 ? stopMemoryReviewQueue : () => setActiveMemoryVerseId("")} style={[phoneLayout && styles.phoneMemoryActionButton, memoryDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneMemoryActionText, memoryDarkMode && styles.homeDarkResumeButtonText]} iconColor={memoryDarkMode ? "#d4a768" : undefined} />
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
                              <Ionicons name="close-outline" size={18} color={memoryDarkMode ? "#d4a768" : colors.oliveDark} />
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
                              <ResumeButton label="Back" icon="arrow-back-outline" onPress={() => setMemoryMeditationStep((step) => Math.max(0, step - 1))} style={[phoneLayout && styles.phoneMemoryActionButton, memoryDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneMemoryActionText, memoryDarkMode && styles.homeDarkResumeButtonText]} iconColor={memoryDarkMode ? "#d4a768" : undefined} />
                            )}
                            {memoryMeditationStep < 3 ? (
                              <ResumeButton label="Next" icon="arrow-forward-outline" onPress={() => setMemoryMeditationStep((step) => Math.min(3, step + 1))} style={[phoneLayout && styles.phoneMemoryActionButton, memoryDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneMemoryActionText, memoryDarkMode && styles.homeDarkResumeButtonText]} iconColor={memoryDarkMode ? "#d4a768" : undefined} />
                            ) : (
                              <ResumeButton label="Save meditation" icon="journal-outline" onPress={() => saveMemoryMeditation(verse)} variant="primary" style={phoneLayout && styles.phoneMemoryActionButton} labelStyle={phoneLayout && styles.phoneMemoryActionText} />
                            )}
                            <ResumeButton label="Close" icon="close-outline" onPress={closeMemoryMeditation} style={[phoneLayout && styles.phoneMemoryActionButton, memoryDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneMemoryActionText, memoryDarkMode && styles.homeDarkResumeButtonText]} iconColor={memoryDarkMode ? "#d4a768" : undefined} />
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
                              <Ionicons name="trending-up-outline" size={16} color={memoryDarkMode ? "#d4a768" : colors.coral} />
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
                                    <Ionicons name={memoryHistoryEventIcon(item.event) as any} size={14} color={memoryDarkMode ? "#d4a768" : colors.coral} />
                                    <Text style={[styles.muted, styles.memoryVerseHistoryEventText, memoryDarkMode && styles.accountDarkMutedText]}>
                                      {memoryHistoryEventLabel(item.event, item.practiceLevel)} - {formatMemoryHistoryDate(item.createdAt)}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>}
                          <View style={[styles.journalActions, phoneLayout && styles.phoneMemoryActions, phoneLayout && styles.phoneMemoryPrimaryActions]}>
                            {!verse.archivedAt && <ResumeButton label={phoneLayout && isMemoryVerseDue(verse) ? "Review now" : "Practice"} icon="school-outline" onPress={() => startMemoryPractice(verse)} variant={phoneLayout ? "primary" : "default"} style={[phoneLayout && styles.phoneMemoryPracticeButton, !phoneLayout && memoryDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneMemoryActionText, !phoneLayout && memoryDarkMode && styles.homeDarkResumeButtonText]} iconColor={phoneLayout ? "#fff" : memoryDarkMode ? "#d4a768" : undefined} />}
                            <ResumeButton
                              label="Meditate"
                              icon="leaf-outline"
                              onPress={() => startMemoryMeditation(verse)}
                              style={[phoneLayout && styles.phoneMemoryMeditateButton, memoryDarkMode && styles.homeDarkResumeButton]}
                              labelStyle={[phoneLayout && styles.phoneMemoryActionText, memoryDarkMode && styles.homeDarkResumeButtonText]}
                              iconColor={memoryDarkMode ? "#d4a768" : undefined}
                            />
                            {phoneLayout ? (
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={moreOpen ? "Hide memory verse options" : "Show memory verse options"}
                                onPress={() => setMemoryMoreVerseId((current) => current === verseId ? "" : verseId)}
                                style={[styles.phoneMemoryMoreButton, memoryDarkMode && styles.homeDarkResumeButton]}
                              >
                                <Ionicons name="ellipsis-horizontal" size={18} color={memoryDarkMode ? "#d4a768" : colors.oliveDark} />
                              </Pressable>
                            ) : (
                              <>
                                <ResumeButton
                                  label={historyOpen ? "Hide history" : "History"}
                                  icon="time-outline"
                                  onPress={() => setHistoryMemoryVerseId((current) => current === verseId ? "" : verseId)}
                                  style={memoryDarkMode && styles.homeDarkResumeButton}
                                  labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText}
                                  iconColor={memoryDarkMode ? "#d4a768" : undefined}
                                />
                                {!verse.archivedAt && <ResumeButton
                                  label={reviewOpen ? "Hide review" : "Change review"}
                                  icon="calendar-outline"
                                  onPress={() => setReviewScheduleVerseId((current) => current === verseId ? "" : verseId)}
                                  style={memoryDarkMode && styles.homeDarkResumeButton}
                                  labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText}
                                  iconColor={memoryDarkMode ? "#d4a768" : undefined}
                                />}
                                <ResumeButton
                                  label={collectionOpen ? "Hide collections" : "Collections"}
                                  icon="albums-outline"
                                  onPress={() => {
                                    setCollectionMemoryVerseId((current) => current === verseId ? "" : verseId);
                                    setMemoryCollectionDraft("");
                                  }}
                                  style={memoryDarkMode && styles.homeDarkResumeButton}
                                  labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText}
                                  iconColor={memoryDarkMode ? "#d4a768" : undefined}
                                />
                                <ResumeButton
                                  label={verse.archivedAt ? "Restore" : "Archive"}
                                  icon={verse.archivedAt ? "refresh-outline" : "archive-outline"}
                                  onPress={() => verse.archivedAt ? restoreArchivedMemoryVerse(verse) : requestMemoryVerseAction(verse, "archive")}
                                  style={memoryDarkMode && styles.homeDarkResumeButton}
                                  labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText}
                                  iconColor={memoryDarkMode ? "#d4a768" : undefined}
                                />
                                <ResumeButton
                                  label="Remove"
                                  icon="trash-outline"
                                  onPress={() => requestMemoryVerseAction(verse, "remove")}
                                  style={memoryDarkMode && styles.homeDarkResumeButton}
                                  labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText}
                                  iconColor={memoryDarkMode ? "#d4a768" : undefined}
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
                                <Ionicons name="time-outline" size={16} color={memoryDarkMode ? "#d4a768" : colors.oliveDark} />
                                <Text style={[styles.phoneMemoryMoreMenuText, memoryDarkMode && styles.homeDarkResumeButtonText]}>{historyOpen ? "Hide history" : "View history"}</Text>
                              </Pressable>
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => {
                                  setMemoryMoreVerseId("");
                                  verse.archivedAt ? restoreArchivedMemoryVerse(verse) : requestMemoryVerseAction(verse, "archive");
                                }}
                                style={styles.phoneMemoryMoreMenuItem}
                              >
                                <Ionicons name={verse.archivedAt ? "refresh-outline" : "archive-outline"} size={16} color={memoryDarkMode ? "#d4a768" : colors.oliveDark} />
                                <Text style={[styles.phoneMemoryMoreMenuText, memoryDarkMode && styles.homeDarkResumeButtonText]}>{verse.archivedAt ? "Restore to reviews" : "Archive from reviews"}</Text>
                              </Pressable>
                              {!verse.archivedAt && <Pressable
                                accessibilityRole="button"
                                onPress={() => {
                                  setReviewScheduleVerseId((current) => current === verseId ? "" : verseId);
                                  setMemoryMoreVerseId("");
                                }}
                                style={styles.phoneMemoryMoreMenuItem}
                              >
                                <Ionicons name="calendar-outline" size={16} color={memoryDarkMode ? "#d4a768" : colors.oliveDark} />
                                <Text style={[styles.phoneMemoryMoreMenuText, memoryDarkMode && styles.homeDarkResumeButtonText]}>Change review date</Text>
                              </Pressable>}
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => {
                                  setCollectionMemoryVerseId((current) => current === verseId ? "" : verseId);
                                  setMemoryCollectionDraft("");
                                  setMemoryMoreVerseId("");
                                }}
                                style={styles.phoneMemoryMoreMenuItem}
                              >
                                <Ionicons name="albums-outline" size={16} color={memoryDarkMode ? "#d4a768" : colors.oliveDark} />
                                <Text style={[styles.phoneMemoryMoreMenuText, memoryDarkMode && styles.homeDarkResumeButtonText]}>Collections</Text>
                              </Pressable>
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => {
                                  setMemoryMoreVerseId("");
                                  requestMemoryVerseAction(verse, "remove");
                                }}
                                style={styles.phoneMemoryMoreMenuItem}
                              >
                                <Ionicons name="trash-outline" size={16} color={memoryDarkMode ? "#d4a768" : colors.oliveDark} />
                                <Text style={[styles.phoneMemoryMoreMenuText, memoryDarkMode && styles.homeDarkResumeButtonText]}>Remove permanently</Text>
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
                                  <Ionicons name="close-outline" size={17} color={memoryDarkMode ? "#d4a768" : colors.oliveDark} />
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
                                      <Ionicons name="close-outline" size={13} color={memoryDarkMode ? "#bbb8b4" : colors.oliveDark} />
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
                          {reviewOpen && !verse.archivedAt && (
                            <View style={[styles.reviewScheduleBox, memoryDarkMode && styles.accountDarkInsetBox]}>
                              <View style={styles.reviewScheduleHeader}>
                                <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>Review schedule</Text>
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel="Close review schedule"
                                  onPress={() => {
                                    setReviewScheduleVerseId("");
                                    setExpandedReviewOptionsVerseId("");
                                  }}
                                  style={[styles.reviewScheduleCloseButton, memoryDarkMode && styles.homeDarkIconBubble]}
                                >
                                  <Ionicons name="close-outline" size={17} color={memoryDarkMode ? "#d4a768" : colors.oliveDark} />
                                </Pressable>
                              </View>
                              <View style={styles.filterRow}>
                                {COMMON_MEMORY_REVIEW_OPTIONS.map((option) => (
                                  <Pressable
                                    key={option.id}
                                    onPress={() => requestReviewScheduleChange([verse], option.id)}
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
                                <Ionicons name={expandedReviewOptionsVerseId === verseId ? "chevron-up-outline" : "chevron-down-outline"} size={15} color={memoryDarkMode ? "#d4a768" : colors.coral} />
                              </Pressable>
                              {expandedReviewOptionsVerseId === verseId && (
                                <View style={styles.filterRow}>
                                  {MORE_MEMORY_REVIEW_OPTIONS.map((option) => (
                                    <Pressable
                                      key={option.id}
                                      onPress={() => requestReviewScheduleChange([verse], option.id)}
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
            {memoryView === "archive" && visibleMemorySections.length === 0 && (
              <View style={[styles.emptyJournalBox, memoryDarkMode && styles.accountDarkSection]}>
                <Ionicons name="archive-outline" size={24} color={memoryDarkMode ? "#d4a768" : colors.coral} />
                <Text style={[styles.emptyJournalTitle, memoryDarkMode && styles.accountDarkTitle]}>No archived verses</Text>
                <Text style={[styles.emptyJournalText, memoryDarkMode && styles.accountDarkMutedText]}>Verses you archive will appear here and can be restored later.</Text>
              </View>
            )}
            {memoryView === "browse" && !memoryCollectionsHome && visibleMemorySections.length === 0 && (
              <View style={[styles.emptyJournalBox, memoryDarkMode && styles.accountDarkSection]}>
                <Ionicons name="search-outline" size={24} color={memoryDarkMode ? "#d4a768" : colors.coral} />
                <Text style={[styles.emptyJournalTitle, memoryDarkMode && styles.accountDarkTitle]}>No saved verses found</Text>
                <Text style={[styles.emptyJournalText, memoryDarkMode && styles.accountDarkMutedText]}>Try a book, chapter, reference, or a phrase from the verse.</Text>
              </View>
            )}
          </View>
        )}
      </Card>
      <Modal transparent visible={!!(collectionMenuName || renameCollectionFrom)} animationType="fade" onRequestClose={() => {
        if (renamingCollection) return;
        setCollectionMenuName("");
        setRenameCollectionFrom("");
      }}>
        <View accessibilityLabel={renameCollectionFrom ? "Rename collection" : "Collection options"} accessibilityViewIsModal style={[styles.printOptionsOverlay, styles.editorDialogOverlay]}>
          <Pressable accessibilityLabel="Close collection options" style={[styles.printOptionsScrim, memoryDarkMode && styles.printDarkOptionsScrim]} onPress={() => {
            if (renamingCollection) return;
            setCollectionMenuName("");
            setRenameCollectionFrom("");
          }} />
          <View style={[styles.printOptionsCard, memoryDarkMode && styles.accountDarkMainCard]}>
            {renameCollectionFrom ? (
              <>
                <Text style={[styles.printOptionsTitle, memoryDarkMode && styles.accountDarkTitle]}>Rename collection</Text>
                <Text style={[styles.muted, memoryDarkMode && styles.accountDarkMutedText]}>This changes the collection name for all its verses, including any in Archive.</Text>
                <TextInput
                  accessibilityLabel="New collection name"
                  autoFocus
                  value={renameCollectionDraft}
                  onChangeText={(value) => { setRenameCollectionDraft(value); setRenameCollectionError(""); }}
                  maxLength={40}
                  onSubmitEditing={confirmCollectionRename}
                  style={[styles.input, memoryDarkMode && styles.accountDarkInput]}
                />
                {!!renameCollectionError && <Text accessibilityRole="alert" style={[styles.muted, memoryDarkMode && styles.accountDarkMutedText]}>{renameCollectionError}</Text>}
                <View style={[styles.printOptionsActions, phoneLayout && styles.memoryRenamePhoneActions]}>
                  <AppButton label="Cancel" variant="secondary" onPress={() => setRenameCollectionFrom("")} disabled={renamingCollection} style={memoryDarkMode && styles.homeDarkResumeButton} labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText} />
                  <AppButton label={renamingCollection ? "Saving..." : "Save name"} onPress={confirmCollectionRename} disabled={renamingCollection} />
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.printOptionsTitle, memoryDarkMode && styles.accountDarkTitle]}>{collectionMenuName}</Text>
                <AppButton label="Rename collection" onPress={() => {
                  const name = collectionMenuName;
                  setCollectionMenuName("");
                  setRenameCollectionFrom(name);
                  setRenameCollectionDraft(name);
                  setRenameCollectionError("");
                }} />
                <AppButton label="Cancel" variant="secondary" onPress={() => setCollectionMenuName("")} style={memoryDarkMode && styles.homeDarkResumeButton} labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText} />
              </>
            )}
          </View>
        </View>
      </Modal>
      <Modal transparent visible={!!pendingSharedReview} animationType="fade" onRequestClose={() => setPendingSharedReview(null)}>
        <View accessibilityLabel="Shared memory verse review warning" accessibilityViewIsModal style={[styles.printOptionsOverlay, styles.editorDialogOverlay]}>
          <Pressable accessibilityLabel="Cancel review change" style={[styles.printOptionsScrim, memoryDarkMode && styles.printDarkOptionsScrim]} onPress={() => setPendingSharedReview(null)} />
          <View style={[styles.printOptionsCard, memoryDarkMode && styles.accountDarkMainCard]}>
            <Text style={[styles.printOptionsTitle, memoryDarkMode && styles.accountDarkTitle]}>This changes the verse everywhere</Text>
            <Text style={[styles.helpIntro, memoryDarkMode && styles.accountDarkMutedText]}>
              {pendingSharedReview?.bulk
                ? `${pendingSharedReview.verses.filter((verse: any) => getMemoryVerseCollections(verse).length > 1).length} of the selected verses belong to multiple collections. Their review dates will change in every collection where they appear.`
                : `${pendingSharedReview?.verses[0]?.reference || "This verse"} belongs to ${getMemoryVerseCollections(pendingSharedReview?.verses[0]).join(", ")}. Changing its review date here changes it in those collections too.`}
            </Text>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: rememberSharedReviewWarning }} onPress={() => setRememberSharedReviewWarning((current) => !current)} style={styles.memorySharedReviewRememberRow}>
              <Ionicons name={rememberSharedReviewWarning ? "checkbox-outline" : "square-outline"} size={23} color={memoryDarkMode ? "#d4a768" : colors.oliveDark} />
              <Text style={[styles.bodyStrong, memoryDarkMode && styles.accountDarkText]}>Don’t show this again</Text>
            </Pressable>
            <View style={styles.printOptionsActions}>
              <AppButton label="Cancel" variant="secondary" onPress={() => setPendingSharedReview(null)} style={memoryDarkMode && styles.homeDarkResumeButton} labelStyle={memoryDarkMode && styles.homeDarkResumeButtonText} />
              <AppButton label="Change review timing" onPress={confirmSharedReviewChange} />
            </View>
          </View>
        </View>
      </Modal>
    </View>

  );
}
