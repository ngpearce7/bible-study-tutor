import { sanitizeEditorHtml } from "@/data/noteHtml";
import { styles } from "@/components/appStyles";
import { createReaderSyncQueue } from "@/data/readerSync";
import { hydratePrivateStorage, readRecoveryValue, writeRecoveryValue, removeRecoveryValue } from "@/data/privateStorage";
import { setStorageProfile, importLegacyDevicePreferences } from "@/data/feedbackPreferences";
import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { api } from "@/convex/_generated/api";
import { catchUpBibleReadingPlanDatesState, completeBibleReadingPlanDayState, createCustomBibleReadingPlanState, deleteCustomBibleReadingPlanState, followBibleReadingPlanState, stopFollowingBibleReadingPlanState, uncompleteBibleReadingPlanDayState } from "@/data/bibleReadingPlanActions";
import { fetchBibleApiPassage, fetchBiblePlanReadingPassage, fetchBsbPassage, parseBsbPassageReference, parsePassageQuery, type BiblePassage, type BibleVerse } from "@/data/biblePassage";
import { BIBLE_CHAPTER_COUNTS, NEW_TESTAMENT_BOOKS, OLD_TESTAMENT_BOOKS, bibleBooks, displayBibleBookName, normalizeBibleBookName } from "@/data/bibleLibrary";
import { readerBookFromReferenceBook, type BibleReadingPlan, type BibleReadingPlanDay } from "@/data/bibleReadingPlanTypes";
import { MAX_BIBLE_READING_PLAN_COMPLETION_COUNT, MAX_CUSTOM_BIBLE_READING_PLANS, MAX_FOLLOWED_BIBLE_READING_PLANS, MAX_STORED_BIBLE_READING_PLAN_IDS, bibleReadingCareNoteKey, bibleReadingPlanDayKey, emptyBibleReadingPlanProgress, hasBibleReadingPlanProgress, normalizeBibleReadingPlanProgress, type StoredBibleReadingPlanProgress } from "@/data/bibleReadingPlanProgress";
import { buildBibleReadingPlanView } from "@/data/bibleReadingPlanView";
import { bibleSearchModeLabel, buildBibleSearchBookOptions, buildBibleSearchQueries, buildBibleSearchSections, dedupeBibleSearchResults, fetchBibleSearchResults, filterBibleSearchResultsForMode, formatSearchDuration, rankBibleSearchResults, type BibleSearchMode, type BibleSearchResult, type BibleSearchScope } from "@/data/bibleSearch";
import { getDeviceKey } from "@/data/deviceKey";
import { getActiveCheckinPartnerId, getPinnedJournalEntries, getStoredAppearanceMode, getStoredBibleBookmarks, getStoredBibleReadChapters, getStoredBibleReaderHistory, getStoredBibleReaderPosition, getStoredBibleReadingPlanProgress, getStoredBibleTranslation, getStoredCheckinPartners, getStoredCollapsedStudyPanels, getStoredCustomWritingPrompts, getStoredDevotionalTextSize, getStoredMemoryReviewSorts, getStoredStudyFocusMode, getStoredTutorCoachingEnabled, saveActiveCheckinPartnerId, savePinnedJournalEntries, saveStoredAppearanceMode, saveStoredBibleBookmarks, saveStoredBibleReadChapters, saveStoredBibleReaderHistory, saveStoredBibleReaderPosition, saveStoredBibleReadingPlanProgress, saveStoredBibleTranslation, saveStoredCheckinPartners, saveStoredCollapsedStudyPanels, saveStoredCustomWritingPrompts, saveStoredDevotionalTextSize, saveStoredMemoryReviewSorts, saveStoredStudyFocusMode, saveStoredTutorCoachingEnabled, type StoredAppearanceMode, type StoredBibleBookmark, type StoredBibleReadChapters, type StoredBibleReaderHistoryItem, type StoredCheckinPartner, type StoredDevotionalTextSize, type StoredMemoryReviewSort } from "@/data/feedbackPreferences";
import { DEVOTIONAL_TEXT_SIZE_OPTIONS, DEVOTIONAL_TEXT_SIZE_STYLES } from "@/data/devotionalTypography";
import { getContextHelp } from "@/data/help";
import { DEFAULT_MEMORY_MILESTONE_IDS, buildMemoryBookOptions, buildMemoryBrowseSections, buildMemoryChapterOptions, buildMemoryCollectionOptions, buildMemoryHistoryEncouragement, buildMemoryHistorySummary, buildMemoryMilestones, buildMemoryPracticeText, buildMemoryPracticeTokens, buildMemoryQueueSections, buildMemoryReference, buildMemoryVerseKeySet, buildMemoryWeeklyScripture, buildMemoryWeeklySummary, buildNeglectedMemoryVerses, clampMemoryPracticeLevel, getMemoryVerseCollections, isMemoryVerseDue, isMemoryVerseMemorized, isTodayLocal, memoryProgressLabel, neglectedMemoryVerseLabel, normalizeMemoryAnswer, normalizeMemoryMilestoneIds, parseMemoryReference, reviewPresetForStoredRhythm, reviewPresetLabel, type MemoryBrowseStatusFilter, type MemoryMilestoneGoalId, type MemoryReviewPreset } from "@/data/memory";
import { methods } from "@/data/methods";
import { buildReaderLoadRequest, buildReaderPlanReading, getReaderPlanDayForChapter, getReaderPlanReadingChunk, isReaderPlanReadingActive, type ReaderPlanReading } from "@/data/biblePlanReader";
import type { MemoryCardLayout, WorksheetWritingSpace } from "@/data/printableWorksheet";
import { trackPublicAnalytics } from "@/data/publicAnalytics";
import { buildStudyContextReference, getStudyCrossReferences, isVerseWithinReference, loadStudyCrossReferences, type StudyCrossReference } from "@/data/studyContext";
import { buildStudyHelpLinks } from "@/data/studyHelp";
import { AppButton, Card, Eyebrow, colors } from "@/components/ui";
import type { AdminStats } from "@/components/AdminDashboard";
import { CustomStudyReviewControl, FormattedNoteText } from "@/components/StudyReviewHelpers";
import { useAction, usePaginatedQuery, useQuery as useRawQuery } from "convex/react";
import { useMutation, useQuery } from "@/data/profileClient";
import { Component, Suspense, createElement, lazy, memo, useEffect, useMemo, useRef, useState, type Dispatch, type ErrorInfo, type ReactNode, type SetStateAction } from "react";
import { Alert, Animated, Easing, Image, Keyboard, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";

type Tab = "home" | "study" | "bible" | "plans" | "methods" | "memory" | "accountability" | "journal" | "account" | "help" | "admin";
type ProfileConnectionState = "idle" | "loading" | "ready" | "error";
const tabs: Tab[] = ["home", "study", "bible", "plans", "methods", "memory", "accountability", "journal", "account", "help", "admin"];
const publicUrlTabs = new Set<Tab>(["home", "study", "bible", "plans", "methods", "memory", "help"]);
type BibleReadingPlanCorpus = {
  plans: BibleReadingPlan[];
  getDetails: (plan: BibleReadingPlan) => ReturnType<typeof import("@/data/bibleReadingPlans")["getBibleReadingPlanDetails"]>;
};
type BibleSearchCriteriaOverrides = {
  scope?: BibleSearchScope;
  mode?: BibleSearchMode;
  book?: string;
  translationId?: BibleTranslationId;
};
let bibleReadingPlanCorpusPromise: Promise<BibleReadingPlanCorpus> | null = null;
function loadBibleReadingPlanCorpus() {
  if (!bibleReadingPlanCorpusPromise) {
    bibleReadingPlanCorpusPromise = import("@/data/bibleReadingPlans")
      .then((module) => ({ plans: module.bibleReadingPlans, getDetails: module.getBibleReadingPlanDetails }))
      .catch((error) => {
        bibleReadingPlanCorpusPromise = null;
        throw error;
      });
  }
  return bibleReadingPlanCorpusPromise;
}
const LegalDocument = lazy(() => import("@/components/LegalDocument").then(module => ({ default: module.LegalDocument })));
const RecoveryCode = lazy(() => import("@/components/RecoveryCode").then(module => ({ default: module.RecoveryCode })));
const PasswordRecovery = lazy(() => import("@/components/PasswordRecovery").then(module => ({ default: module.PasswordRecovery })));
const LazyAdminDashboard = lazy(() => import("@/components/AdminDashboard").then((module) => ({ default: module.AdminDashboard })));
const LazyBibleTab = lazy(() => import("@/components/BibleTab").then((module) => ({ default: module.BibleTab })));
const LazyCommunityTab = lazy(() => import("@/components/CommunityTab").then((module) => ({ default: module.CommunityTab })));
const LazyHelpTab = lazy(() => import("@/components/HelpTab").then((module) => ({ default: module.HelpTab })));
const LazyJournalTab = lazy(() => import("@/components/JournalTab").then((module) => ({ default: module.JournalTab })));
const LazyMemoryTab = lazy(() => import("@/components/MemoryTab").then((module) => ({ default: module.MemoryTab })));
const LazyStudyNoteTiptapEditor = lazy(() => import("@/components/StudyNoteTiptapEditor").then((module) => ({ default: module.StudyNoteTiptapEditor })));

function HydrationSafeIonicon({ ready, name, size, color }: { ready: boolean; name: any; size: number; color: string }) {
  if (!ready && Platform.OS === "web") {
    return <View aria-hidden style={{ height: size, width: size }} />;
  }

  return <Ionicons name={name} size={size} color={color} />;
}

function modalAccessibilityProps(label: string) {
  return {
    accessibilityLabel: label,
    accessibilityViewIsModal: true,
    ...(Platform.OS === "web" ? { "aria-modal": true, role: "dialog", tabIndex: -1 } : {})
  } as any;
}

function HomeSemanticResourceLinks({ darkMode = false }: { darkMode?: boolean }) {
  if (Platform.OS !== "web") return null;

  const links = [
    ["/bible-study-methods", "Choose a study method", "Compare Bible study methods before beginning a passage."],
    ["/printable-bible-study-worksheets", "Print a worksheet", "Prepare a paper worksheet for personal study, church groups, or youth groups."],
    ["/bible-study-app-for-churches", "For churches", "See ways churches and small groups can use Bible Study Tutor responsibly."],
    ["/bible-study-methods/word-study", "Learn word study", "Study key words while keeping the meaning anchored in context."]
  ];
  const hiddenHeadingStyle = {
    border: 0,
    clip: "rect(0 0 0 0)",
    height: 1,
    margin: -1,
    overflow: "hidden",
    padding: 0,
    position: "absolute",
    whiteSpace: "nowrap",
    width: 1
  } as const;

  return createElement(
    "section",
    {
      "aria-labelledby": "home-resource-links-heading",
      style: {
        background: darkMode ? "#1b211f" : "#fffaf2",
        border: "none",
        borderRadius: 16,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        marginTop: 18,
        padding: 0
      }
    },
    createElement("h1", { style: hiddenHeadingStyle }, "Bible Study Tutor free Bible study app"),
    createElement(
      "h2",
      {
        id: "home-resource-links-heading",
        style: {
          color: darkMode ? "#f7eddc" : colors.oliveDark,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 0,
          lineHeight: 1.2,
          margin: "0 0 7px"
        }
      },
      "Explore study resources"
    ),
    createElement(
      "p",
      {
        style: {
          color: darkMode ? "#c8bda9" : colors.muted,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: 14,
          fontWeight: 400,
          lineHeight: 1.45,
          margin: "0 0 14px"
        }
      },
      "Methods, printable worksheets and ideas for studying together."
    ),
    createElement(
      "nav",
      {
        "aria-label": "Bible Study Tutor public resources",
        style: {
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))"
        }
      },
      links.map(([href, label, description]) =>
        createElement(
          "a",
          {
            href,
            key: href,
            style: {
              background: darkMode ? "#28312e" : "#fffdf8",
              border: `1px solid ${darkMode ? "rgba(233, 183, 106, 0.2)" : "#eadcc9"}`,
              borderRadius: 12,
              color: darkMode ? "#f7eddc" : colors.ink,
              display: "grid",
              gap: 5,
              minHeight: 76,
              padding: 12,
              textDecoration: "none"
            }
          },
          createElement(
            "strong",
            {
              style: {
                color: darkMode ? "#f7eddc" : colors.ink,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1.25
              }
            },
            label
          ),
          createElement(
            "span",
            {
              style: {
                color: darkMode ? "#c8bda9" : colors.muted,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontSize: 13,
                fontWeight: 400,
                lineHeight: 1.35
              }
            },
            description
          )
        )
      )
    )
  );
}

function formatInlineList(items: string[]) {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function formatWeeklyRhythmArea(value: unknown) {
  const label = String(value || "").trim();
  if (!label) return "";
  if (label.toLowerCase() === "bible reading") return "Bible reading";
  return label.charAt(0).toLowerCase() + label.slice(1);
}

type TabErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
  resetKey: string;
};

type TabErrorBoundaryState = {
  hasError: boolean;
};

type PendingBiblePlanReadAhead = {
  planId: string;
  requestedDay: number;
  missedDay: number;
  missedDateKey: string;
  requestedReference: string;
};

type PendingBiblePlanContinueCheck = {
  planId: string;
  completedDay: number;
  completedReference: string;
  requestId: number;
};

type PendingBiblePlanContinuePrompt = {
  planId: string;
  nextDay: number;
  nextDateKey: string;
  completedReference: string;
};

type PendingBiblePlanCompletionCelebration = {
  planId: string;
  planTitle: string;
  completedDays: number;
};

type PendingRhythmGracePrompt = {
  missedDate: string;
  latestActivityDate: string;
  storageKey: string;
};

type RhythmGraceSuccess = {
  missedDate: string;
  restoredCount: number;
};

type PendingStudyTransition = {
  description: string;
};

class TabErrorBoundary extends Component<TabErrorBoundaryProps, TabErrorBoundaryState> {
  state: TabErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) console.error("Bible Study Tutor section failed to render", error, info.componentStack);
    import("@/data/reliabilityMetrics")
      .then(({ trackReliabilityMetric }) => trackReliabilityMetric({ kind: "client_error", provider: "app", operation: "unhandled", outcome: "error", errorCode: "unknown" }))
      .catch(() => undefined);
  }

  componentDidUpdate(previousProps: TabErrorBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function safeCurrentUrl() {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  try {
    return new URL(window.location.href);
  } catch {
    return null;
  }
}

function safeReplaceBrowserUrl(url: URL) {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  try {
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  } catch {
    // URL sync is a convenience; navigation state should keep working without it.
  }
}

function safeGetLocalStorageValue(key: string) {
  if (Platform.OS !== "web" || typeof localStorage === "undefined") return "";
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function safeRemoveLocalStorageValue(key: string) {
  if (Platform.OS !== "web" || typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore private-mode/storage restrictions.
  }
}

function safeSetLocalStorageValue(key: string, value: string) {
  if (Platform.OS !== "web" || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore private-mode/storage restrictions.
  }
}

type StudyPhase = "study" | "review" | "saved";
type JournalFilter = "all" | "pinned" | "drafts" | "studies" | "meditations" | "checkins" | "highlights" | "reviews";
type JournalView = "list" | "calendar" | "scripture";
type MemoryView = "review" | "browse" | "history";
type MemoryPrintSet = "due" | "reviewed" | "all" | "current" | "collection" | "custom";
type MemoryCollectionPrompt = {
  source: "study" | "bible";
  reference: string;
  translationName: string;
  verses: BibleVerse[];
  note?: string;
  collectionName: string;
};
type MemoryBookCollectionDraft = {
  book: string;
  mode: "whole" | "range";
  startChapter: string;
  endChapter: string;
  collectionName: string;
};
type MemoryReviewSort = StoredMemoryReviewSort;
type DevotionalTextSize = StoredDevotionalTextSize;
type StudyReviewPreset = "tomorrow" | "three-days" | "next-week" | "next-month";
type StudySidePanelKey = "community" | "plan" | "feedback" | "helps";
type UiPreferenceKey =
  | "studyMethodId"
  | "studyStepIndex"
  | "studyFocusMode"
  | "studyInstructionsCollapsed"
  | "studyCoachingVisible"
  | "studyPanelCommunityCollapsed"
  | "studyPanelPlanCollapsed"
  | "studyPanelFeedbackCollapsed"
  | "studyPanelHelpsCollapsed"
  | "bibleReaderNavCollapsed"
  | "bibleReaderHistoryCollapsed"
  | "bibleBookmarksCollapsed"
  | "bibleSearchCollapsed"
  | "bibleSearchScope"
  | "bibleSearchMode"
  | "bibleSearchBook"
  | "bibleSearchCriteriaOpen"
  | "devotionalTextSize"
  | "communityPeoplePanelCollapsed"
  | "communityFriendsPanelOpen"
  | "communityCirclesPanelOpen"
  | "communityFriendToolsOpen"
  | "communityCircleToolsOpen"
  | "communityRecentExpanded"
  | "memoryDueSort"
  | "memoryReviewedSort"
  | "memoryView"
  | "memoryBrowseFiltersOpen"
  | "memoryBrowseStatusFilter"
  | "memoryBookFilter"
  | "memoryChapterFilter"
  | "memoryCollectionFilter"
  | "plansOpenSections"
  | "plansExpandedPlanId"
  | "plansCompletedOpen"
  | "plansSelectedPlanDay"
  | "journalView"
  | "journalFilter"
  | "journalFiltersOpen"
  | "journalExpandedScriptureBook"
  | "journalSelectedScripture"
  | "accountPrivacyOpen"
  | "accountLegalSection"
  | "printWorksheetMethodId"
  | "printWorksheetWritingSpace"
  | "printWorksheetIncludes"
  | "memoryPrintSet"
  | "memoryPrintLayout"
  | "memoryPrintCopies"
  | "memoryPrintSafeMode"
  | "pinnedJournalEntryIds"
  | "customWritingPrompts"
  | "rhythmGraceHandledDates";
type UiPreferenceValue = boolean | string | string[];
type UiPreferenceMap = Partial<Record<UiPreferenceKey, UiPreferenceValue>>;
type ReaderMobileMenu = "old" | "new" | null;
type MemoryFilterMobileMenu = "old" | "new" | null;
const DARK_MODE_ENABLED = true;
type AnswerMap = Record<string, string>;
type BibleTranslationId = "bsb" | "web" | "kjv";
type AuthFlow = "signIn" | "signUp";
type LegalSection = "privacy" | "terms" | "";
type PassageMarkupKind = "notice" | "question" | "truth" | "apply";
type MethodRecommendationId = "quick" | "pray" | "deep" | "reflect" | "group";
type PassageMarkupMap = Record<string, PassageMarkupKind>;
type PassageMarkupNoteMap = Record<string, string>;
type PassageMarkupRecord = {
  key: string;
  kind: PassageMarkupKind;
  label: string;
  note?: string;
  reference: string;
  verse: number;
};
type StudyMethodState = {
  focusText: string;
  focusVerseKeys: string[];
  evidenceVerseKeys: string[];
  reviewReadActionTomorrow: boolean;
};
type StudyRecoveryDraft = {
  version: 1;
  profileId: string;
  studyKey: string;
  passage: string;
  methodId: string;
  stepIndex: number;
  answers: AnswerMap;
  passageMarkups: PassageMarkupRecord[];
  shareNote: string;
  skippedStepTitles: string[];
  skippedStepIds: string[];
  methodState: StudyMethodState;
  updatedAt: number;
};

function normalizeStudyMethodState(value: unknown): StudyMethodState {
  const state = value && typeof value === "object" ? value as Partial<StudyMethodState> : {};
  const cleanKeys = (keys: unknown) => Array.isArray(keys)
    ? keys.filter((key): key is string => typeof key === "string").slice(0, 40)
    : [];
  return {
    focusText: typeof state.focusText === "string" ? state.focusText.slice(0, 1200) : "",
    focusVerseKeys: cleanKeys(state.focusVerseKeys),
    evidenceVerseKeys: cleanKeys(state.evidenceVerseKeys),
    reviewReadActionTomorrow: state.reviewReadActionTomorrow === true
  };
}

function studyRecoveryStorageKey(profileId: string, currentStudyKey: string) {
  return `bible-study-tutor-study-recovery-${profileId}-${currentStudyKey}`;
}

function readStudyRecoveryDraft(profileId: string, currentStudyKey: string): StudyRecoveryDraft | null {
  const stored = readRecoveryValue(studyRecoveryStorageKey(profileId, currentStudyKey));
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    if (
      parsed?.version !== 1 ||
      parsed?.profileId !== profileId ||
      parsed?.studyKey !== currentStudyKey ||
      typeof parsed?.passage !== "string" ||
      typeof parsed?.methodId !== "string" ||
      !Number.isFinite(parsed?.stepIndex) ||
      !parsed?.answers ||
      typeof parsed.answers !== "object" ||
      !Array.isArray(parsed?.passageMarkups) ||
      typeof parsed?.updatedAt !== "number"
    ) return null;

    return {
      version: 1,
      profileId,
      studyKey: currentStudyKey,
      passage: parsed.passage.slice(0, 160),
      methodId: parsed.methodId.slice(0, 80),
      stepIndex: Math.max(0, Math.min(20, Math.round(parsed.stepIndex))),
      answers: Object.entries(parsed.answers).slice(0, 20).reduce<AnswerMap>((map, [key, value]) => {
        if (typeof value === "string") map[key] = value.slice(0, 12000);
        return map;
      }, {}),
      passageMarkups: parsed.passageMarkups.slice(0, 300),
      shareNote: typeof parsed?.shareNote === "string" ? parsed.shareNote.slice(0, 1200) : "",
      skippedStepTitles: Array.isArray(parsed?.skippedStepTitles)
        ? parsed.skippedStepTitles.filter((title: unknown): title is string => typeof title === "string").slice(0, 20)
        : [],
      skippedStepIds: Array.isArray(parsed?.skippedStepIds)
        ? parsed.skippedStepIds.filter((id: unknown): id is string => typeof id === "string").slice(0, 20)
        : [],
      methodState: normalizeStudyMethodState(parsed?.methodState),
      updatedAt: parsed.updatedAt
    };
  } catch {
    return null;
  }
}

function studyStepKey(methodId: string, stepId: string) {
  return `${methodId}:${stepId}`;
}

function restoreStudyAnswers(methodId: string, savedAnswers: { stepId?: string; stepTitle: string; answer: string }[]) {
  const selectedMethod = methods.find((item) => item.id === methodId) || methods[0];
  return selectedMethod.steps.reduce<AnswerMap>((map, step, index) => {
    const saved = savedAnswers.find((item) => item.stepId === step.id)
      || savedAnswers.find((item) => item.stepTitle === step.title)
      || savedAnswers[index];
    if (saved?.answer) map[studyStepKey(methodId, step.id)] = saved.answer;
    return map;
  }, {});
}

function normalizeStudyAnswerMap(methodId: string, savedAnswers: AnswerMap) {
  const selectedMethod = methods.find((item) => item.id === methodId) || methods[0];
  return selectedMethod.steps.reduce<AnswerMap>((map, step, index) => {
    const stableKey = studyStepKey(methodId, step.id);
    const value = savedAnswers[stableKey] ?? savedAnswers[`${methodId}:${index}`];
    if (value) map[stableKey] = value;
    return map;
  }, {});
}

function saveStudyRecoveryDraft(draft: StudyRecoveryDraft) {
  return writeRecoveryValue(studyRecoveryStorageKey(draft.profileId, draft.studyKey), JSON.stringify(draft));
}

function clearStudyRecoveryDraft(profileId: string, currentStudyKey: string, savedThrough?: number) {
  if (savedThrough) {
    const latest = readStudyRecoveryDraft(profileId, currentStudyKey);
    if (latest && latest.updatedAt > savedThrough) return;
  }
  removeRecoveryValue(studyRecoveryStorageKey(profileId, currentStudyKey));
}

function formatStudySavedTime(timestamp: number) {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(timestamp);
  } catch {
    return "just now";
  }
}
type HighlightJournalEntry = {
  id: string;
  passage: string;
  methodName: string;
  createdAt: number;
  markups: PassageMarkupRecord[];
  source: "draft" | "study";
  entry: any;
};
type JournalCalendarItem = {
  id: string;
  title: string;
  status: string;
  timestamp: number;
  dateKey: string;
};
type JournalScriptureItem = {
  id: string;
  title: string;
  status: string;
  timestamp: number;
  book: string;
  chapter: number;
  verses: number[];
};
type NoteFormatKind = "undo" | "redo" | "bold" | "italic" | "underline" | "highlight" | "bullet";

type SavedStudySummary = {
  sessionId?: any;
  passage: string;
  methodName: string;
  highlightCount: number;
  shareNote: string;
  reviewAt?: number;
  readActionReviewRequested?: boolean;
  completedPlanDay?: string;
};
type PrintableWorksheetRequest = {
  source: "study" | "bible";
  reference: string;
  translation: string;
  verses: BibleVerse[];
};
type ScriptureInsertResult = {
  reference: string;
  text: string;
  typedReference?: string;
};
type ScriptureInsertRequest = {
  reference?: string;
  typedReference?: string;
};
type ScriptureInsertSettings = {
  disabled: boolean;
  bold: boolean;
  italic: boolean;
  color: string;
  highlightColor: string;
  referencePosition: "front" | "end";
};
type SyncedBibleReaderState = {
  translation?: BibleTranslationId;
  position?: { book: string; chapter: number };
  history?: StoredBibleReaderHistoryItem[];
  readChapters?: StoredBibleReadChapters;
  bookmarks?: StoredBibleBookmark[];
  readingPlanProgress?: StoredBibleReadingPlanProgress;
};

const DEFAULT_OPEN_BIBLE_PLAN_SECTIONS = { short: true, medium: false, long: false };
const SCRIPTURE_INSERT_SETTINGS_KEY = "bible-study-tutor-scripture-insert-settings";
const DEFAULT_SCRIPTURE_INSERT_SETTINGS: ScriptureInsertSettings = {
  disabled: false,
  bold: false,
  italic: true,
  color: colors.ink,
  highlightColor: "#f4dfb6",
  referencePosition: "front"
};
const SCRIPTURE_INSERT_COLOR_OPTIONS = [
  { label: "Ink", value: colors.ink },
  { label: "Warm", value: colors.coral },
  { label: "Olive", value: colors.oliveDark },
  { label: "Gold", value: "#9a6a1f" }
];
const NOTE_HIGHLIGHT_COLOR_OPTIONS = [
  { label: "Honey", value: "#f4dfb6" },
  { label: "Rose", value: "#f5cfc5" },
  { label: "Sage", value: "#dfe8cf" },
  { label: "Sky", value: "#d6e8f7" },
  { label: "Lavender", value: "#e7ddf4" }
];
const UI_PREFERENCE_KEYS: UiPreferenceKey[] = [
  "studyMethodId",
  "studyStepIndex",
  "studyFocusMode",
  "studyInstructionsCollapsed",
  "studyCoachingVisible",
  "studyPanelCommunityCollapsed",
  "studyPanelPlanCollapsed",
  "studyPanelFeedbackCollapsed",
  "studyPanelHelpsCollapsed",
  "bibleReaderNavCollapsed",
  "bibleReaderHistoryCollapsed",
  "bibleBookmarksCollapsed",
  "bibleSearchCollapsed",
  "bibleSearchScope",
  "bibleSearchMode",
  "bibleSearchBook",
  "bibleSearchCriteriaOpen",
  "devotionalTextSize",
  "communityPeoplePanelCollapsed",
  "communityFriendsPanelOpen",
  "communityCirclesPanelOpen",
  "communityFriendToolsOpen",
  "communityCircleToolsOpen",
  "communityRecentExpanded",
  "memoryDueSort",
  "memoryReviewedSort",
  "memoryView",
  "memoryBrowseFiltersOpen",
  "memoryBrowseStatusFilter",
  "memoryBookFilter",
  "memoryChapterFilter",
  "memoryCollectionFilter",
  "plansOpenSections",
  "plansExpandedPlanId",
  "plansCompletedOpen",
  "plansSelectedPlanDay",
  "journalView",
  "journalFilter",
  "journalFiltersOpen",
  "journalExpandedScriptureBook",
  "journalSelectedScripture",
  "accountPrivacyOpen",
  "accountLegalSection",
  "printWorksheetMethodId",
  "printWorksheetWritingSpace",
  "printWorksheetIncludes",
  "memoryPrintSet",
  "memoryPrintLayout",
  "memoryPrintCopies",
  "memoryPrintSafeMode",
  "pinnedJournalEntryIds",
  "customWritingPrompts",
  "rhythmGraceHandledDates"
];
const STUDY_PANEL_UI_PREFERENCE_KEYS: Record<StudySidePanelKey, UiPreferenceKey> = {
  community: "studyPanelCommunityCollapsed",
  plan: "studyPanelPlanCollapsed",
  feedback: "studyPanelFeedbackCollapsed",
  helps: "studyPanelHelpsCollapsed"
};
const BIBLE_TRANSLATIONS: { id: BibleTranslationId; label: string; name: string }[] = [
  { id: "bsb", label: "BSB", name: "Berean Standard Bible" },
  { id: "web", label: "WEB", name: "World English Bible" },
  { id: "kjv", label: "KJV", name: "King James Version" }
];
const COMMUNITY_CIRCLES_ENABLED = process.env.EXPO_PUBLIC_ENABLE_COMMUNITY_CIRCLES === "true";
const PASSAGE_MARKUP_OPTIONS: { id: PassageMarkupKind; label: string; background: string; color: string }[] = [
  { id: "notice", label: "Notice", background: "#dfead5", color: colors.oliveDark },
  { id: "question", label: "Question", background: "#f4dfb6", color: "#6d4b16" },
  { id: "truth", label: "Key truth", background: "#f5cfc5", color: "#783423" },
  { id: "apply", label: "Apply", background: "#d7e7eb", color: colors.blue }
];
const STUDY_REVIEW_OPTIONS: { id: StudyReviewPreset; label: string }[] = [
  { id: "tomorrow", label: "Tomorrow" },
  { id: "three-days", label: "In 3 days" },
  { id: "next-week", label: "In 1 week" },
  { id: "next-month", label: "In 1 month" }
];
const APP_SHARE_URL = "https://biblestudytutor.org";
const APP_SHARE_QR_TARGET_URL = `${APP_SHARE_URL}/?shared=qr`;
const APP_SHARE_QR_URI = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(APP_SHARE_QR_TARGET_URL)}`;
const APP_SHARE_QR_DARK_URI = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&color=E9B76A&bgcolor=1B211F&data=${encodeURIComponent(APP_SHARE_QR_TARGET_URL)}`;
const COMMUNITY_STATUS_BUSY_PREFIXES = ["Posting", "Creating", "Looking", "Checking", "Accepting", "Joining", "Saving"];
const USERNAME_AUTH_DOMAIN = "username.biblestudytutor.local";

function runWhenBrowserIdle(task: () => void, timeout = 900) {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    const timer = setTimeout(task, 0);
    return () => clearTimeout(timer);
  }

  const requestIdle = (window as any).requestIdleCallback;
  const cancelIdle = (window as any).cancelIdleCallback;
  if (typeof requestIdle === "function") {
    const id = requestIdle(task, { timeout });
    return () => {
      if (typeof cancelIdle === "function") cancelIdle(id);
    };
  }

  const timer = window.setTimeout(task, Math.min(timeout, 300));
  return () => window.clearTimeout(timer);
}

function communityStatusShouldHold(message: string) {
  return COMMUNITY_STATUS_BUSY_PREFIXES.some((prefix) => message.startsWith(prefix));
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/^@+/, "");
}

function usernameCredential(username: string) {
  return `${username}@${USERNAME_AUTH_DOMAIN}`;
}

function usernameIsValid(username: string) {
  return /^[a-z0-9][a-z0-9._-]{2,23}$/.test(username);
}

function authInputLooksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysToDateKey(dateKey: string, days: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return "";
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

function formatPlanDayDate(dateKey: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return "";
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "long" }).format(new Date(year, month - 1, day));
}

function formatPlanDayRelativeDate(dateKey: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return "";
  const today = localDateKey();
  if (dateKey === today) return "Today";
  if (dateKey === addDaysToDateKey(today, 1)) return "Tomorrow";
  if (dateKey === addDaysToDateKey(today, -1)) return "Yesterday";
  return formatPlanDayDate(dateKey);
}

function formatBibleReadingPlanCompletionCount(count: number) {
  const normalized = Math.max(0, Math.round(Number(count) || 0));
  if (normalized <= 1) return "Completed once";
  if (normalized === 2) return "Completed twice";
  return `Completed ${normalized} times`;
}

export default function Home() {
  const auth = useConvexAuth();
  const userId = useRawQuery(api.accountability.currentUser, auth.isAuthenticated ? {} : "skip");
  return <HomeScreen key={auth.isLoading || (auth.isAuthenticated && userId === undefined) ? "connecting" : userId || "guest"} />;
}

function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const recoveryAvailable = useRawQuery(api.accountability.recoveryAvailable, {});
  const ensureProfile = useMutation(api.study.ensureProfile);
  const saveSession = useMutation(api.study.saveSession);
  const scheduleStudyReviewMutation = useMutation(api.study.scheduleStudyReview);
  const removeStudyReviewMutation = useMutation(api.study.removeStudyReview);
  const completeStudyReviewMutation = useMutation(api.study.completeStudyReview);
  const saveDraft = useMutation(api.study.saveDraft);
  const deleteDraftMutation = useMutation(api.study.deleteDraft);
  const deleteSessionMutation = useMutation(api.study.deleteSession);
  const savePlan = useMutation(api.accountability.savePlan);
  const saveAccountSettings = useMutation(api.accountability.saveAccountSettings);
  const saveScriptureInsertSettings = useMutation(api.accountability.saveScriptureInsertSettings);
  const saveUiPreference = useMutation(api.accountability.saveUiPreference);
  const saveMemoryMilestoneGoals = useMutation(api.accountability.saveMemoryMilestoneGoals);
  const saveBibleReaderState = useMutation(api.accountability.saveBibleReaderState);
  const ensureStudyStats = useMutation(api.statistics.ensureStats);
  const changePassword = useAction(api.accountability.changePassword);
  const saveCheckin = useMutation(api.accountability.saveCheckin);
  const deleteCheckinMutation = useMutation(api.accountability.deleteCheckin);
  const updateCheckin = useMutation(api.accountability.updateCheckin);
  const createCommunityCircle = useMutation(api.community.createCircle);
  const joinCommunityCircle = useMutation(api.community.joinCircle);
  const inviteCommunityFriend = useMutation(api.community.inviteFriendByEmail);
  const inviteCommunityFriendByCode = useMutation(api.community.inviteFriendByCode);
  const ensureCommunityFriendCode = useMutation(api.community.ensureFriendCode);
  const acceptCommunityFriend = useMutation(api.community.acceptFriend);
  const removeCommunityFriend = useMutation(api.community.removeFriend);
  const shareCheckinToCircle = useMutation(api.community.shareCheckin);
  const shareStudyInsightToCommunity = useMutation(api.community.shareInsight);
  const reactToCommunityPost = useMutation(api.community.reactToPost);
  const removeCommunityPost = useMutation(api.community.removePost);
  const updateCommunityPost = useMutation(api.community.updatePost);
  const leaveCommunityCircle = useMutation(api.community.leaveCircle);
  const deleteCommunityCircle = useMutation(api.community.deleteCircle);
  const saveMemoryVerse = useMutation(api.memory.saveVerse);
  const recordMemoryPractice = useMutation(api.memory.recordPractice);
  const removeMemoryVerse = useMutation(api.memory.remove);
  const scheduleMemoryReview = useMutation(api.memory.scheduleReview);
  const updateMemoryCollections = useMutation(api.memory.updateCollections);
  const recordMemoryHistoryEvent = useMutation(api.memory.recordHistoryEvent);
  const submitFeedback = useMutation(api.insights.submitFeedback);
  const recordUsage = useMutation(api.insights.recordUsage);
  const markFeedbackStatus = useMutation(api.insights.markFeedbackStatus);
  const requestAccountDeletion = useMutation(api.insights.requestAccountDeletion);
  const cancelAccountDeletionRequest = useMutation(api.insights.cancelAccountDeletionRequest);
  const approveDeletionRequestAsAdmin = useMutation(api.insights.approveDeletionRequestAsAdmin);
  const cancelDeletionRequestAsAdmin = useMutation(api.insights.cancelDeletionRequestAsAdmin);
  const cleanupEmptyLocalProfilesAsAdmin = useMutation(api.insights.cleanupEmptyLocalProfilesAsAdmin);
  const setProfileSuspensionAsAdmin = useMutation(api.insights.setProfileSuspensionAsAdmin);
  const markProfileSecurityReviewedAsAdmin = useMutation(api.insights.markProfileSecurityReviewedAsAdmin);
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const [profileId, setProfileId] = useState<any>(null);
  const [profileAuthState, setProfileAuthState] = useState<boolean | null>(null);
  const [displayName, setDisplayName] = useState("Bible student");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountStatus, setAccountStatus] = useState("");
  const [deletionStatus, setDeletionStatus] = useState("");
  const [deletionConfirmArmed, setDeletionConfirmArmed] = useState(false);
  const [pendingAdminDeletionRequestId, setPendingAdminDeletionRequestId] = useState("");
  const [localProfileCleanupArmed, setLocalProfileCleanupArmed] = useState(false);
  const [adminMaintenanceStatus, setAdminMaintenanceStatus] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [currentAccountPassword, setCurrentAccountPassword] = useState("");
  const [newAccountPassword, setNewAccountPassword] = useState("");
  const [authFlow, setAuthFlow] = useState<AuthFlow>("signIn");
  const [authName, setAuthName] = useState("");
  const [authIdentifier, setAuthIdentifier] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [feedbackCategory, setFeedbackCategory] = useState<"bug" | "confusing" | "suggestion" | "encouragement" | "other">("suggestion");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [expandedHelpGuideTitle, setExpandedHelpGuideTitle] = useState("");
  const [appShareStatus, setAppShareStatus] = useState("");
  const [incomingShareSource, setIncomingShareSource] = useState("");
  const [openLegalSection, setOpenLegalSection] = useState<LegalSection>("");
  const [accountPrivacyOpen, setAccountPrivacyOpen] = useState(false);
  const [selectedAdminRegion, setSelectedAdminRegion] = useState("Australia");
  const [selectedAdminProfileId, setSelectedAdminProfileId] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [appInitializationAllowed, setAppInitializationAllowed] = useState(Platform.OS !== "web");
  const [profileConnectionState, setProfileConnectionState] = useState<ProfileConnectionState>("idle");
  const [profileInitializationAttempt, setProfileInitializationAttempt] = useState(0);
  const [contextHelpOpen, setContextHelpOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [iconFontReady, setIconFontReady] = useState(Platform.OS !== "web");
  const [layoutReady, setLayoutReady] = useState(Platform.OS !== "web");
  const [passage, setPassage] = useState("Psalm 23");
  const [methodId, setMethodId] = useState(methods[0].id);
  const [activeMethodInfoId, setActiveMethodInfoId] = useState("");
  const [methodFilter, setMethodFilter] = useState("All");
  const [methodRecommendationId, setMethodRecommendationId] = useState<MethodRecommendationId>("quick");
  const [methodFilterOpen, setMethodFilterOpen] = useState(false);
  const [methodChooserOpen, setMethodChooserOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [studyPhase, setStudyPhase] = useState<StudyPhase>("study");
  const [instructionsCollapsed, setInstructionsCollapsed] = useState(false);
  const [studyMethodPickerOpen, setStudyMethodPickerOpen] = useState(false);
  const [methodExampleModeId, setMethodExampleModeId] = useState("");
  const [contemplativeTimerOpen, setContemplativeTimerOpen] = useState(false);
  const [contemplativeTimerSeconds, setContemplativeTimerSeconds] = useState(0);
  const [contemplativeTimerRunning, setContemplativeTimerRunning] = useState(false);
  const [studyStepAnchorY, setStudyStepAnchorY] = useState(0);
  const [studyFocusMode, setStudyFocusMode] = useState(false);
  const [studyFocusModeHydrated, setStudyFocusModeHydrated] = useState(false);
  const [studyReviewNow, setStudyReviewNow] = useState(() => Date.now());
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [skippedStudySteps, setSkippedStudySteps] = useState<Record<string, boolean>>({});
  const [studyMethodState, setStudyMethodState] = useState<StudyMethodState>(() => normalizeStudyMethodState(null));
  const [pendingStudyTransition, setPendingStudyTransition] = useState<PendingStudyTransition | null>(null);
  const [isSavingStudyDraft, setIsSavingStudyDraft] = useState(false);
  const [isCompletingStudy, setIsCompletingStudy] = useState(false);
  const [answerSelection, setAnswerSelection] = useState({ start: 0, end: 0 });
  const [lastAnswerSelection, setLastAnswerSelection] = useState({ start: 0, end: 0 });
  const [detectedScriptureReference, setDetectedScriptureReference] = useState("");
  const [detectedScriptureTypedReference, setDetectedScriptureTypedReference] = useState("");
  const [scriptureInsertStatus, setScriptureInsertStatus] = useState("");
  const [scriptureInsertFocusKey, setScriptureInsertFocusKey] = useState(0);
  const [customWritingPrompts, setCustomWritingPrompts] = useState<string[]>([]);
  const [customWritingPromptsHydrated, setCustomWritingPromptsHydrated] = useState(false);
  const [writingPromptStatus, setWritingPromptStatus] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState("");
  const [planStatus, setPlanStatus] = useState("");
  const [partner, setPartner] = useState("");
  const [checkinPartners, setCheckinPartners] = useState<StoredCheckinPartner[]>([]);
  const [activeCheckinPartnerId, setActiveCheckinPartnerId] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [partnerContactNote, setPartnerContactNote] = useState("");
  const [checkinNote, setCheckinNote] = useState("");
  const [communityStatus, setCommunityStatus] = useState("");
  const [isSavingCheckin, setIsSavingCheckin] = useState(false);
  const [circleName, setCircleName] = useState("");
  const [circleInviteCode, setCircleInviteCode] = useState("");
  const [selectedCircleId, setSelectedCircleId] = useState<any>(null);
  const [targetCircleId, setTargetCircleId] = useState<any>(null);
  const [circleStatus, setCircleStatus] = useState("");
  const [friendEmail, setFriendEmail] = useState("");
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [myFriendCode, setMyFriendCode] = useState("");
  const [friendStatus, setFriendStatus] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState<any>(null);
  const [targetFriendIds, setTargetFriendIds] = useState<any[]>([]);
  const [pendingFriendRemoveId, setPendingFriendRemoveId] = useState<any>(null);
  const [communityTargetType, setCommunityTargetType] = useState<"friend" | "circle">("friend");
  const [communityTargetPickerOpen, setCommunityTargetPickerOpen] = useState(false);
  const [pendingCircleDeleteId, setPendingCircleDeleteId] = useState<any>(null);
  const [pendingCircleLeaveId, setPendingCircleLeaveId] = useState<any>(null);
  const [pendingCheckinDeleteId, setPendingCheckinDeleteId] = useState<any>(null);
  const [editingRecentCheckinId, setEditingRecentCheckinId] = useState<any>(null);
  const [editRecentCheckinNote, setEditRecentCheckinNote] = useState("");
  const [isSavingRecentCheckinEdit, setIsSavingRecentCheckinEdit] = useState(false);
  const [editingCommunityPostId, setEditingCommunityPostId] = useState<any>(null);
  const [editCommunityPostNote, setEditCommunityPostNote] = useState("");
  const [isSavingCommunityPostEdit, setIsSavingCommunityPostEdit] = useState(false);
  const [communityReactionOverrides, setCommunityReactionOverrides] = useState<Record<string, { reactions: { amen: number; praying: number; encouraged: number }; myReactions: string[] }>>({});
  const [focusedCommunityItemId, setFocusedCommunityItemId] = useState("");
  const [friendToolsOpen, setFriendToolsOpen] = useState(false);
  const [circleManagerOpen, setCircleManagerOpen] = useState(false);
  const [mobileFriendsPanelOpen, setMobileFriendsPanelOpen] = useState(false);
  const [mobileCirclesPanelOpen, setMobileCirclesPanelOpen] = useState(false);
  const [peoplePanelCollapsed, setPeoplePanelCollapsed] = useState(false);
  const [recentCheckinsExpanded, setRecentCheckinsExpanded] = useState(false);
  const [communitySubView, setCommunitySubView] = useState<"encourage" | "history">("encourage");
  const [communityHistoryFilter, setCommunityHistoryFilter] = useState<"all" | "private" | "circles">("all");
  const [communityHistoryCircleId, setCommunityHistoryCircleId] = useState("all");
  const [shareNote, setShareNote] = useState("");
  const [passageText, setPassageText] = useState<BiblePassage | null>(null);
  const [studyTranslationComparisonOpen, setStudyTranslationComparisonOpen] = useState(false);
  const [studyTranslationComparisons, setStudyTranslationComparisons] = useState<BiblePassage[]>([]);
  const [studyTranslationComparisonStatus, setStudyTranslationComparisonStatus] = useState("");
  const [passageMarkups, setPassageMarkups] = useState<PassageMarkupMap>({});
  const [passageMarkupNotes, setPassageMarkupNotes] = useState<PassageMarkupNoteMap>({});
  const [selectedVerseKeys, setSelectedVerseKeys] = useState<string[]>([]);
  const [memoryStatus, setMemoryStatus] = useState("");
  const [memoryView, setMemoryView] = useState<MemoryView>("review");
  const [dueMemoryReviewSort, setDueMemoryReviewSort] = useState<MemoryReviewSort>("oldest");
  const [reviewedMemoryReviewSort, setReviewedMemoryReviewSort] = useState<MemoryReviewSort>("oldest");
  const [memoryReviewSortsHydrated, setMemoryReviewSortsHydrated] = useState(false);
  const [memorySearch, setMemorySearch] = useState("");
  const [memoryBookFilter, setMemoryBookFilter] = useState("all");
  const [memoryChapterFilter, setMemoryChapterFilter] = useState("all");
  const [memoryBrowseStatusFilter, setMemoryBrowseStatusFilter] = useState<MemoryBrowseStatusFilter>("all");
  const [memoryCollectionFilter, setMemoryCollectionFilter] = useState("all");
  const [memoryCollectionPickerOpen, setMemoryCollectionPickerOpen] = useState(false);
  const [memoryBrowseFiltersOpen, setMemoryBrowseFiltersOpen] = useState(false);
  const [expandedMemoryFilterBook, setExpandedMemoryFilterBook] = useState("");
  const [memoryFilterMobileMenu, setMemoryFilterMobileMenu] = useState<MemoryFilterMobileMenu>(null);
  const [memoryCollectionPrompt, setMemoryCollectionPrompt] = useState<MemoryCollectionPrompt | null>(null);
  const [memoryCollectionPromptSaving, setMemoryCollectionPromptSaving] = useState(false);
  const [memoryBookCollectionOpen, setMemoryBookCollectionOpen] = useState(false);
  const [memoryBookCollectionDraft, setMemoryBookCollectionDraft] = useState<MemoryBookCollectionDraft>({
    book: "Romans",
    mode: "whole",
    startChapter: "1",
    endChapter: String(BIBLE_CHAPTER_COUNTS.Romans || 16),
    collectionName: "Romans"
  });
  const [memoryBookCollectionTestamentOpen, setMemoryBookCollectionTestamentOpen] = useState<"old" | "new" | null>("new");
  const [memoryBookCollectionSaving, setMemoryBookCollectionSaving] = useState(false);
  const [memoryBookCollectionStatus, setMemoryBookCollectionStatus] = useState("");
  const [memoryHistoryExpanded, setMemoryHistoryExpanded] = useState(false);
  const [memoryToolbarMoreOpen, setMemoryToolbarMoreOpen] = useState(false);
  const [memoryMilestonePickerOpen, setMemoryMilestonePickerOpen] = useState(false);
  const [memoryMilestoneGoalIds, setMemoryMilestoneGoalIds] = useState<MemoryMilestoneGoalId[]>(DEFAULT_MEMORY_MILESTONE_IDS);
  const [memoryMilestoneStatus, setMemoryMilestoneStatus] = useState("");
  const [addMemoryPanelOpen, setAddMemoryPanelOpen] = useState(false);
  const [activeMemoryVerseId, setActiveMemoryVerseId] = useState("");
  const [activeMemoryMeditationVerseId, setActiveMemoryMeditationVerseId] = useState("");
  const [memoryReviewQueueIds, setMemoryReviewQueueIds] = useState<string[]>([]);
  const [memoryMeditationStep, setMemoryMeditationStep] = useState(0);
  const [memoryMeditationPhrase, setMemoryMeditationPhrase] = useState("");
  const [memoryMeditationReflection, setMemoryMeditationReflection] = useState("");
  const [memoryMeditationPrayer, setMemoryMeditationPrayer] = useState("");
  const [memoryMeditationCarry, setMemoryMeditationCarry] = useState("");
  const [reviewScheduleVerseId, setReviewScheduleVerseId] = useState("");
  const [bulkReviewOptionsExpanded, setBulkReviewOptionsExpanded] = useState(false);
  const [expandedReviewOptionsVerseId, setExpandedReviewOptionsVerseId] = useState("");
  const [historyMemoryVerseId, setHistoryMemoryVerseId] = useState("");
  const [collectionMemoryVerseId, setCollectionMemoryVerseId] = useState("");
  const [memoryCollectionDraft, setMemoryCollectionDraft] = useState("");
  const [memoryMoreVerseId, setMemoryMoreVerseId] = useState("");
  const [expandedMemoryVerseIds, setExpandedMemoryVerseIds] = useState<string[]>([]);
  const [memoryPracticeLevel, setMemoryPracticeLevel] = useState(1);
  const [memoryPracticeAnswers, setMemoryPracticeAnswers] = useState<Record<number, string>>({});
  const [memoryPracticeResult, setMemoryPracticeResult] = useState("");
  const [memoryPracticeChecked, setMemoryPracticeChecked] = useState(false);
  const [memoryHintsVisible, setMemoryHintsVisible] = useState(false);
  const [memoryHintLevels, setMemoryHintLevels] = useState<Record<number, number>>({});
  const [memoryStepTwoOffset, setMemoryStepTwoOffset] = useState(0);
  const [memoryPracticeFocusKey, setMemoryPracticeFocusKey] = useState(0);
  const [pendingDeleteMemoryVerseId, setPendingDeleteMemoryVerseId] = useState("");
  const memoryBlankInputRefs = useRef<Record<number, TextInput | null>>({});
  const [passageStatus, setPassageStatus] = useState("Loading passage...");
  const [passageReloadKey, setPassageReloadKey] = useState(0);
  const [loadedDraftKey, setLoadedDraftKey] = useState("");
  const [saveStatus, setSaveStatus] = useState("Drafts save automatically once you begin writing.");
  const [printWorksheetRequest, setPrintWorksheetRequest] = useState<PrintableWorksheetRequest | null>(null);
  const [pendingStudyWorksheetPrint, setPendingStudyWorksheetPrint] = useState(false);
  const [printWorksheetMethodId, setPrintWorksheetMethodId] = useState(methods[0]?.id || "");
  const [printWorksheetWritingSpace, setPrintWorksheetWritingSpace] = useState<WorksheetWritingSpace>("standard");
  const [printWorksheetIncludes, setPrintWorksheetIncludes] = useState({ memory: true, insight: true });
  const [memoryPrintOptionsOpen, setMemoryPrintOptionsOpen] = useState(false);
  const [memoryPrintSet, setMemoryPrintSet] = useState<MemoryPrintSet>("due");
  const [memoryPrintLayout, setMemoryPrintLayout] = useState<MemoryCardLayout>("pocket");
  const [memoryPrintCopies, setMemoryPrintCopies] = useState(1);
  const [memoryPrintSafeMode, setMemoryPrintSafeMode] = useState(true);
  const [memoryPrintCollectionFilter, setMemoryPrintCollectionFilter] = useState("all");
  const [memoryPrintSelectedVerseIds, setMemoryPrintSelectedVerseIds] = useState<string[]>([]);
  const [pendingRhythmGracePrompt, setPendingRhythmGracePrompt] = useState<PendingRhythmGracePrompt | null>(null);
  const [rhythmGraceSuccess, setRhythmGraceSuccess] = useState<RhythmGraceSuccess | null>(null);
  const [savedStudySummary, setSavedStudySummary] = useState<SavedStudySummary | null>(null);
  const [shareInsightStatus, setShareInsightStatus] = useState("");
  const [shareInsightPanelOpen, setShareInsightPanelOpen] = useState(false);
  const [reviewLaterPanelOpen, setReviewLaterPanelOpen] = useState(false);
  const [shareInsightTargetType, setShareInsightTargetType] = useState<"friend" | "circle">("friend");
  const [shareInsightFriendIds, setShareInsightFriendIds] = useState<any[]>([]);
  const [shareInsightCircleId, setShareInsightCircleId] = useState<any>(null);
  const [shareInsightTargetPickerOpen, setShareInsightTargetPickerOpen] = useState(false);
  const [shareInsightPostedReady, setShareInsightPostedReady] = useState(false);
  const [passageQuery, setPassageQuery] = useState("Psalm 23");
  const [showCoaching, setShowCoaching] = useState(true);
  const [collapsedStudyPanels, setCollapsedStudyPanels] = useState<Record<StudySidePanelKey, boolean>>({
    community: true,
    plan: true,
    feedback: true,
    helps: true
  });
  const [journalFilter, setJournalFilter] = useState<JournalFilter>("all");
  const [journalView, setJournalView] = useState<JournalView>("list");
  const [journalFiltersOpen, setJournalFiltersOpen] = useState(false);
  const [journalCalendarMonth, setJournalCalendarMonth] = useState(() => startOfMonth(Date.now()));
  const [journalDateFilterKey, setJournalDateFilterKey] = useState("");
  const [expandedJournalScriptureBook, setExpandedJournalScriptureBook] = useState("");
  const [selectedJournalScriptureBook, setSelectedJournalScriptureBook] = useState("");
  const [selectedJournalScriptureChapter, setSelectedJournalScriptureChapter] = useState(0);
  const [journalSearch, setJournalSearch] = useState("");
  const [expandedJournalEntryIds, setExpandedJournalEntryIds] = useState<string[]>([]);
  const [pinnedJournalEntryIds, setPinnedJournalEntryIds] = useState<string[]>([]);
  const [activeReflectionEntryId, setActiveReflectionEntryId] = useState("");
  const [reflectionInsight, setReflectionInsight] = useState("");
  const [reflectionPrayer, setReflectionPrayer] = useState("");
  const [reflectionNextStep, setReflectionNextStep] = useState("");
  const [reflectionStatus, setReflectionStatus] = useState("");
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [pendingArchiveDraftId, setPendingArchiveDraftId] = useState("");
  const [pendingDeleteJournalEntryId, setPendingDeleteJournalEntryId] = useState("");
  const [journalDeleteStatus, setJournalDeleteStatus] = useState("");
  const [isDeletingJournalEntry, setIsDeletingJournalEntry] = useState(false);
  const [journalStatus, setJournalStatus] = useState("");
  const [editingJournalEntryId, setEditingJournalEntryId] = useState("");
  const [editJournalNote, setEditJournalNote] = useState("");
  const [activeStudyReviewId, setActiveStudyReviewId] = useState("");
  const [reviewScheduleStudyId, setReviewScheduleStudyId] = useState("");
  const [pendingRemoveStudyReviewId, setPendingRemoveStudyReviewId] = useState("");
  const [customStudyReviewDays, setCustomStudyReviewDays] = useState("14");
  const [studyReviewNote, setStudyReviewNote] = useState("");
  const [studyReviewStatus, setStudyReviewStatus] = useState("");
  const [editReflectionPassage, setEditReflectionPassage] = useState("");
  const [editReflectionHighlights, setEditReflectionHighlights] = useState("");
  const [editReflectionInsight, setEditReflectionInsight] = useState("");
  const [editReflectionPrayer, setEditReflectionPrayer] = useState("");
  const [editReflectionNextStep, setEditReflectionNextStep] = useState("");
  const [isSavingJournalEdit, setIsSavingJournalEdit] = useState(false);
  const [bibleTranslation, setBibleTranslation] = useState<BibleTranslationId>("bsb");
  const [appearanceMode, setAppearanceMode] = useState<StoredAppearanceMode>("light");
  const [readerBook, setReaderBook] = useState("Genesis");
  const [readerChapter, setReaderChapter] = useState(1);
  const [readerChapterDraft, setReaderChapterDraft] = useState("1");
  const [readerPassage, setReaderPassage] = useState<BiblePassage | null>(null);
  const readerSyncQueue = useRef(createReaderSyncQueue());
  const [readerSyncError, setReaderSyncError] = useState("");
  const [readerSyncAttempt, setReaderSyncAttempt] = useState(0);
  const [replaceReaderArmed, setReplaceReaderArmed] = useState(false);
  const [readerStatus, setReaderStatus] = useState("Loading chapter...");
  const [readerMemoryStatus, setReaderMemoryStatus] = useState("");
  const [readerPlanReading, setReaderPlanReading] = useState<ReaderPlanReading | null>(null);
  const [readerBookSearch, setReaderBookSearch] = useState("");
  const [readerNavCollapsed, setReaderNavCollapsed] = useState(false);
  const [activeBibleReadingPlanId, setActiveBibleReadingPlanId] = useState("");
  const [followedBibleReadingPlanIds, setFollowedBibleReadingPlanIds] = useState<string[]>([]);
  const [completedBibleReadingPlanDays, setCompletedBibleReadingPlanDays] = useState<string[]>([]);
  const [customBibleReadingPlans, setCustomBibleReadingPlans] = useState<BibleReadingPlan[]>([]);
  const [bibleReadingPlanCorpus, setBibleReadingPlanCorpus] = useState<BibleReadingPlanCorpus | null>(null);
  const [bibleReadingPlanCorpusStatus, setBibleReadingPlanCorpusStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [bibleReadingPlanLoadAttempt, setBibleReadingPlanLoadAttempt] = useState(0);
  const [bibleReadingPlanStartDates, setBibleReadingPlanStartDates] = useState<Record<string, string>>({});
  const [bibleReadingPlanCompletionDates, setBibleReadingPlanCompletionDates] = useState<Record<string, string>>({});
  const [bibleReadingPlanCompletionCounts, setBibleReadingPlanCompletionCounts] = useState<Record<string, number>>({});
  const [acknowledgedBibleReadingCareNotes, setAcknowledgedBibleReadingCareNotes] = useState<string[]>([]);
  const [storedBibleReadingPlanProgress, setStoredBibleReadingPlanProgress] = useState<StoredBibleReadingPlanProgress | null>(null);
  const [storedBibleReadingPlanProgressHydrated, setStoredBibleReadingPlanProgressHydrated] = useState(false);
  const [devotionalTextSize, setDevotionalTextSize] = useState<DevotionalTextSize>("normal");
  const [devotionalTextSizeOptionsOpen, setDevotionalTextSizeOptionsOpen] = useState(false);
  const [customBiblePlanTitle, setCustomBiblePlanTitle] = useState("");
  const [customBiblePlanDescription, setCustomBiblePlanDescription] = useState("");
  const [customBiblePlanDaysText, setCustomBiblePlanDaysText] = useState("");
  const [customBiblePlanStatus, setCustomBiblePlanStatus] = useState("");
  const [biblePlanStatus, setBiblePlanStatus] = useState("");
  const [pendingBiblePlanReadAhead, setPendingBiblePlanReadAhead] = useState<PendingBiblePlanReadAhead | null>(null);
  const [pendingBiblePlanContinueCheck, setPendingBiblePlanContinueCheck] = useState<PendingBiblePlanContinueCheck | null>(null);
  const [pendingBiblePlanContinuePrompt, setPendingBiblePlanContinuePrompt] = useState<PendingBiblePlanContinuePrompt | null>(null);
  const [pendingBiblePlanCompletionCelebration, setPendingBiblePlanCompletionCelebration] = useState<PendingBiblePlanCompletionCelebration | null>(null);
  const [customBiblePlanFormOpen, setCustomBiblePlanFormOpen] = useState(false);
  const [expandedBiblePlanId, setExpandedBiblePlanId] = useState("");
  const [activeBiblePlanSelectedDay, setActiveBiblePlanSelectedDay] = useState(0);
  const [activeBiblePlanSelectedPlanId, setActiveBiblePlanSelectedPlanId] = useState("");
  const [expandedBiblePlanVisibleRows, setExpandedBiblePlanVisibleRows] = useState<Record<string, number>>({});
  const [visibleBiblePlanGroupRows, setVisibleBiblePlanGroupRows] = useState<Record<string, number>>({});
  const [biblePlanDayWindowStarts, setBiblePlanDayWindowStarts] = useState<Record<string, number>>({});
  const [expandedBiblePlanPreviews, setExpandedBiblePlanPreviews] = useState<Record<string, boolean>>({});
  const biblePlanPreviewToggleRefs = useRef<Record<string, { focus?: () => void } | null>>({});
  const [openBiblePlanSections, setOpenBiblePlanSections] = useState<Record<string, boolean>>(DEFAULT_OPEN_BIBLE_PLAN_SECTIONS);
  const [pendingBiblePlanDeleteId, setPendingBiblePlanDeleteId] = useState("");
  const [completedBiblePlansOpen, setCompletedBiblePlansOpen] = useState(false);
  const [bibleReaderHistory, setBibleReaderHistory] = useState<StoredBibleReaderHistoryItem[]>([]);
  const [readerHistoryCollapsed, setReaderHistoryCollapsed] = useState(true);
  const [selectedReaderVerses, setSelectedReaderVerses] = useState<number[]>([]);
  const [readerActionVerse, setReaderActionVerse] = useState(0);
  const [pendingReaderFocusVerse, setPendingReaderFocusVerse] = useState(0);
  const [readBibleChapters, setReadBibleChapters] = useState<StoredBibleReadChapters>({});
  const [bibleBookmarks, setBibleBookmarks] = useState<StoredBibleBookmark[]>([]);
  const [activeBookmarkNoteId, setActiveBookmarkNoteId] = useState("");
  const [bookmarkNoteDraft, setBookmarkNoteDraft] = useState("");
  const [bookmarkSearch, setBookmarkSearch] = useState("");
  const [bookmarkNotesOnly, setBookmarkNotesOnly] = useState(false);
  const [bookmarksCollapsed, setBookmarksCollapsed] = useState(true);
  const [bookmarksExpanded, setBookmarksExpanded] = useState(false);
  const [readerMobileMenu, setReaderMobileMenu] = useState<ReaderMobileMenu>(null);
  const [expandedMobileReaderBook, setExpandedMobileReaderBook] = useState("");
  const [readerIconTooltip, setReaderIconTooltip] = useState("");
  const [bibleSearchQuery, setBibleSearchQuery] = useState("");
  const [bibleSearchScope, setBibleSearchScope] = useState<BibleSearchScope>("all");
  const [bibleSearchBook, setBibleSearchBook] = useState("");
  const [bibleSearchMode, setBibleSearchMode] = useState<BibleSearchMode>("word");
  const [bibleSearchCollapsed, setBibleSearchCollapsed] = useState(true);
  const [bibleSearchBookMenuOpen, setBibleSearchBookMenuOpen] = useState(false);
  const [bibleSearchCriteriaOpen, setBibleSearchCriteriaOpen] = useState(false);
  const [bibleSearchResults, setBibleSearchResults] = useState<BibleSearchResult[]>([]);
  const [bibleSearchStatus, setBibleSearchStatus] = useState("");
  const [bibleSearchDuration, setBibleSearchDuration] = useState("");
  const [bibleSearchActiveQuery, setBibleSearchActiveQuery] = useState("");
  const [studyContextOpen, setStudyContextOpen] = useState(false);
  const [studyContextPassage, setStudyContextPassage] = useState<BiblePassage | null>(null);
  const [studyContextStatus, setStudyContextStatus] = useState("");
  const [selectedStudyCrossReference, setSelectedStudyCrossReference] = useState<StudyCrossReference | null>(null);
  const [studyCrossReferencePassage, setStudyCrossReferencePassage] = useState<BiblePassage | null>(null);
  const [studyCrossReferenceStatus, setStudyCrossReferenceStatus] = useState("");
  const [studyCrossReferences, setStudyCrossReferences] = useState<StudyCrossReference[]>([]);
  const [studyCrossReferenceListStatus, setStudyCrossReferenceListStatus] = useState("");
  const readerTooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appScrollRef = useRef<any>(null);
  const appScrollYRef = useRef(0);
  const biblePlanDayPickerRefs = useRef<Record<string, any>>({});
  const memoryBlankVisibilityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const planCelebrationPulse = useRef(new Animated.Value(0)).current;
  const planCelebrationParticles = useRef(Array.from({ length: 12 }, () => new Animated.Value(0))).current;
  const accountLegalYRef = useRef(0);
  const bibleSearchSummaryYRef = useRef(0);
  const readerPassageBoxYRef = useRef(0);
  const readerVerseYRef = useRef<Record<number, number>>({});
  const studyPassageRequestIdRef = useRef(0);
  const studyContextRequestIdRef = useRef(0);
  const studyCrossReferenceListRequestIdRef = useRef(0);
  const studyCrossReferenceRequestIdRef = useRef(0);
  const readerPassageRequestIdRef = useRef(0);
  const bibleSearchRequestIdRef = useRef(0);
  const bibleSearchAbortControllerRef = useRef<AbortController | null>(null);
  const previousTabRef = useRef<Tab>(tab);
  const trackedIncomingShareRef = useRef("");
  const communityReactionStorageProfileRef = useRef("");
  const previousActiveProfileIdRef = useRef("");
  const appliedBibleReaderProfileIdRef = useRef("");
  const appliedBibleReaderStateSignatureRef = useRef("");
  const pendingBibleReaderStateProfileIdRef = useRef("");
  const pendingBibleReaderStateSignatureRef = useRef("");
  const pendingBibleReaderStateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedDraftRevisionRef = useRef(0);
  const isHydratingDraftRef = useRef(false);
  const suppressStudyDraftSaveRef = useRef(false);
  const pendingStudyTransitionActionRef = useRef<(() => void) | null>(null);
  const studyDraftSavePromiseRef = useRef<Promise<unknown> | null>(null);
  const studyDraftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasReadInitialUrlRef = useRef(false);
  const skipInitialUrlSyncRef = useRef(true);

  function clearPendingBibleReaderStateSync(signature?: string) {
    if (signature && pendingBibleReaderStateSignatureRef.current !== signature) return;
    pendingBibleReaderStateProfileIdRef.current = "";
    pendingBibleReaderStateSignatureRef.current = "";
    if (pendingBibleReaderStateTimerRef.current) clearTimeout(pendingBibleReaderStateTimerRef.current);
    pendingBibleReaderStateTimerRef.current = null;
  }

  useEffect(() => {
    if (tab === "journal" && previousTabRef.current !== "journal") {
      setJournalDateFilterKey("");
    }
    previousTabRef.current = tab;
  }, [tab]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const browserFonts = typeof document !== "undefined" ? document.fonts : null;
      Promise.resolve(browserFonts?.load ? browserFonts.load("16px ionicons") : undefined)
        .catch(() => undefined)
        .finally(() => {
          if (!cancelled) {
            setIconFontReady(true);
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    setLayoutReady(true);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    let cleanup: (() => void) | undefined;
    let mounted = true;
    import("@/data/reliabilityMetrics")
      .then((module) => {
        if (mounted) cleanup = module.installPrivacySafeErrorReporting();
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
      cleanup?.();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const url = safeCurrentUrl();
    if (!url) {
      hasReadInitialUrlRef.current = true;
      return;
    }
    const requestedTab = url.searchParams.get("tab");
    const requestedMethod = url.searchParams.get("method");
    const requestedPassage = url.searchParams.get("passage");
    const requestedPrint = url.searchParams.get("print");
    const sharedSource = url.searchParams.get("shared");
    const pendingTab = safeGetLocalStorageValue("bibleStudyTutorReturnTab");
    const nextTab = publicUrlTabs.has(requestedTab as Tab) ? requestedTab : tabs.includes(pendingTab as Tab) ? pendingTab : "";
    let hasRequestedStudyPassage = false;
    if (nextTab) setTab(nextTab as Tab);
    if (requestedMethod && methods.some((item) => item.id === requestedMethod)) {
      setRememberedStudyMethod(requestedMethod, 0);
      setStudyPhase("study");
    }
    if (requestedPassage && requestedPassage.length <= 80) {
      const normalizedRequestedPassage = requestedPassage.trim().replace(/\s+/g, " ");
      if (normalizedRequestedPassage) {
        hasRequestedStudyPassage = true;
        setPassage(normalizedRequestedPassage);
        setPassageQuery(normalizedRequestedPassage);
        setPassageText(null);
        setPassageStatus("Loading passage...");
        setRememberedStudyStepIndex(0);
        setStudyPhase("study");
        setSavedStudySummary(null);
        setAnswers({});
        setSelectedVerseKeys([]);
      }
    }
    if (requestedPrint === "worksheet" && nextTab === "study" && hasRequestedStudyPassage) {
      setPendingStudyWorksheetPrint(true);
    }
    if (sharedSource) setIncomingShareSource(sharedSource.slice(0, 40));
    safeRemoveLocalStorageValue("bibleStudyTutorReturnTab");
    if (requestedTab && !publicUrlTabs.has(requestedTab as Tab)) {
      url.searchParams.set("tab", "home");
      url.searchParams.delete("method");
      url.searchParams.delete("passage");
      url.searchParams.delete("print");
      safeReplaceBrowserUrl(url);
    }
    hasReadInitialUrlRef.current = true;
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined" || !hasReadInitialUrlRef.current) return;
    const url = safeCurrentUrl();
    if (!url) return;
    const currentUrlTab = url.searchParams.get("tab");
    if (currentUrlTab && !publicUrlTabs.has(currentUrlTab as Tab)) {
      url.searchParams.set("tab", "home");
      url.searchParams.delete("method");
      safeReplaceBrowserUrl(url);
    }
    if (skipInitialUrlSyncRef.current) {
      skipInitialUrlSyncRef.current = false;
      return;
    }
    if (publicUrlTabs.has(tab)) {
      if (url.searchParams.get("tab") !== tab) {
        url.searchParams.set("tab", tab);
      }
      if (tab !== "study") {
        url.searchParams.delete("method");
        url.searchParams.delete("passage");
        url.searchParams.delete("print");
      }
    } else if (url.searchParams.has("tab") || url.searchParams.has("method") || url.searchParams.has("passage") || url.searchParams.has("print")) {
      url.searchParams.delete("tab");
      url.searchParams.delete("method");
      url.searchParams.delete("passage");
      url.searchParams.delete("print");
    }
    safeReplaceBrowserUrl(url);
  }, [tab]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined" || appInitializationAllowed) return;
    if (tab !== "home") {
      setAppInitializationAllowed(true);
      return;
    }

    const allowInitialization = () => setAppInitializationAllowed(true);
    const interactionOptions = { once: true, passive: true } as AddEventListenerOptions;
    const interactionEvents = ["pointerdown", "touchstart", "keydown", "wheel"];
    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, allowInitialization, interactionOptions);
    });
    const cancelIdle = runWhenBrowserIdle(allowInitialization, 2600);

    return () => {
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, allowInitialization);
      });
      cancelIdle();
    };
  }, [appInitializationAllowed, tab]);

  useEffect(() => {
    if (!appInitializationAllowed) {
      setProfileConnectionState("idle");
      return;
    }

    if (authLoading) {
      setProfileId(null);
      setProfileAuthState(null);
      setProfileConnectionState("loading");
      return;
    }

    let cancelled = false;
    setProfileId(null);
    setProfileAuthState(null);
    setProfileConnectionState("loading");

    getDeviceKey()
      .then((clientKey) => {
        const requestedDisplayName = authName.trim();
        return ensureProfile({
          clientKey,
          ...(requestedDisplayName ? { displayName: requestedDisplayName } : {})
        });
      })
      .then(async (nextProfileId) => {
        await hydratePrivateStorage();
        if (cancelled) return;
        setStorageProfile(String(nextProfileId));
        if (readRecoveryValue(`bible-study-tutor-study-recovery-reader-${nextProfileId}`)) setReaderSyncError("This device has reader changes that were not confirmed saved. Choose which copy to keep.");
        setProfileId(nextProfileId);
        setProfileAuthState(isAuthenticated);
        setProfileConnectionState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setProfileId(null);
        setProfileAuthState(null);
        setProfileConnectionState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [appInitializationAllowed, authLoading, authName, ensureProfile, isAuthenticated, profileInitializationAttempt]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined" || profileConnectionState !== "error") return;
    const retryWhenOnline = () => setProfileInitializationAttempt((attempt) => attempt + 1);
    window.addEventListener("online", retryWhenOnline);
    return () => window.removeEventListener("online", retryWhenOnline);
  }, [profileConnectionState]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    let activeModal: HTMLElement | null = null;
    let previousFocus: HTMLElement | null = null;
    let focusTimer: ReturnType<typeof setTimeout> | null = null;
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"]';

    const syncActiveModal = () => {
      const nextModal = document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"], [data-mobile-menu-modal="true"]');
      if (nextModal === activeModal) return;
      if (!nextModal && activeModal) previousFocus?.focus?.();
      if (nextModal) {
        previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        if (focusTimer) clearTimeout(focusTimer);
        focusTimer = setTimeout(() => {
          const firstFocusable = nextModal.querySelector<HTMLElement>(focusableSelector);
          (firstFocusable || nextModal).focus?.();
        }, 0);
      }
      activeModal = nextModal;
    };

    const keepFocusInsideModal = (event: KeyboardEvent) => {
      if (!activeModal) return;
      if (event.key === "Escape" && activeModal.dataset.mobileMenuModal === "true") {
        event.preventDefault();
        setMobileMenuOpen(false);
        return;
      }
      if (event.key === "Escape") {
        const closeControl = activeModal.querySelector<HTMLElement>('[aria-label^="Close"], [aria-label^="Cancel"]');
        if (closeControl) {
          event.preventDefault();
          closeControl.click();
        }
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(activeModal.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => !element.hasAttribute("disabled"));
      if (!focusable.length) {
        event.preventDefault();
        activeModal.focus?.();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const observer = new MutationObserver(syncActiveModal);
    observer.observe(document.body, { attributes: true, childList: true, subtree: true, attributeFilter: ["aria-modal", "data-mobile-menu-modal"] });
    document.addEventListener("keydown", keepFocusInsideModal);
    syncActiveModal();
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", keepFocusInsideModal);
      if (focusTimer) clearTimeout(focusTimer);
    };
  }, []);

  useEffect(() => () => bibleSearchAbortControllerRef.current?.abort(), []);

  useEffect(() => {
    getStoredAppearanceMode()
      .then(setAppearanceMode)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    let stopMeasurement: (() => void) | undefined;
    let mounted = true;
    const cancelIdle = runWhenBrowserIdle(() => {
      import("@/data/webVitals")
        .then((module) => {
          if (mounted) stopMeasurement = module.startWebVitalsMeasurement();
        })
        .catch(() => undefined);
    });
    return () => {
      mounted = false;
      cancelIdle();
      stopMeasurement?.();
    };
  }, []);

  const customBibleReadingPlanIdSet = useMemo(
    () => new Set(customBibleReadingPlans.map((plan) => plan.id)),
    [customBibleReadingPlans]
  );
  const needsBuiltInBibleReadingPlans =
    tab === "plans" ||
    [activeBibleReadingPlanId, ...followedBibleReadingPlanIds].some((planId) => planId && !customBibleReadingPlanIdSet.has(planId));

  useEffect(() => {
    if (!needsBuiltInBibleReadingPlans || bibleReadingPlanCorpus) return;
    let active = true;
    setBibleReadingPlanCorpusStatus("loading");
    loadBibleReadingPlanCorpus()
      .then((corpus) => {
        if (!active) return;
        setBibleReadingPlanCorpus(corpus);
        setBibleReadingPlanCorpusStatus("ready");
      })
      .catch(() => {
        if (active) setBibleReadingPlanCorpusStatus("error");
      });
    return () => {
      active = false;
    };
  }, [bibleReadingPlanCorpus, bibleReadingPlanLoadAttempt, needsBuiltInBibleReadingPlans]);

  useEffect(() => {
    if (!appInitializationAllowed || profileConnectionState !== "ready") return;

    let active = true;
    const cancelIdle = runWhenBrowserIdle(() => {
      getPinnedJournalEntries()
        .then(value => { if (active) setPinnedJournalEntryIds(value); })
        .catch(() => undefined);
      getStoredCheckinPartners()
        .then(value => { if (active) setCheckinPartners(value); })
        .catch(() => undefined);
      getActiveCheckinPartnerId()
        .then(value => { if (active) setActiveCheckinPartnerId(value); })
        .catch(() => undefined);
      getStoredBibleTranslation()
        .then(value => { if (active) setBibleTranslation(value); })
        .catch(() => undefined);
      Promise.all([getStoredBibleReadingPlanProgress(), getStoredBibleBookmarks(), getStoredBibleReaderHistory(), getStoredBibleReadChapters(), getStoredBibleReaderPosition()])
        .then(([progress, bookmarks, history, readChapters, position]) => {
          if (!active) return;
          setBibleBookmarks(bookmarks); setBibleReaderHistory(history); setReadBibleChapters(readChapters);
          if (position && bibleBooks.includes(position.book)) {
            setReaderBook(position.book); setReaderChapter(Math.min(Math.max(position.chapter, 1), BIBLE_CHAPTER_COUNTS[position.book] || 1));
          }
          const normalizedProgress = normalizeBibleReadingPlanProgress(progress);
          setStoredBibleReadingPlanProgress(normalizedProgress || emptyBibleReadingPlanProgress());
          setStoredBibleReadingPlanProgressHydrated(true);
          if (!normalizedProgress) return;
          const storedPlans = normalizedProgress.customPlans;
          const normalizedActivePlanId = normalizedProgress.activePlanId;
          const normalizedFollowedPlanIds = (normalizedProgress.followedPlanIds || []).slice(0, MAX_STORED_BIBLE_READING_PLAN_IDS);
          const normalizedCompletedDays = normalizedProgress.completedDays;
          const normalizedStartDates = normalizedProgress.startDates || {};
          const normalizedCompletionDates = normalizedProgress.completedPlanDates || {};
          const normalizedCompletionCounts = normalizedProgress.completionCounts || {};
          const normalizedAcknowledgedCareNotes = normalizedProgress.acknowledgedCareNotes || [];
          setCustomBibleReadingPlans(storedPlans);
          setFollowedBibleReadingPlanIds(normalizedFollowedPlanIds);
          setBibleReadingPlanCompletionDates(normalizedCompletionDates);
          setBibleReadingPlanCompletionCounts(normalizedCompletionCounts);
          setAcknowledgedBibleReadingCareNotes(normalizedAcknowledgedCareNotes);
          if (normalizedActivePlanId) {
            const backfilledStartDates = normalizedFollowedPlanIds.reduce<Record<string, string>>((dates, planId) => {
              if (!dates[planId]) dates[planId] = localDateKey();
              return dates;
            }, { ...normalizedStartDates });
            setBibleReadingPlanStartDates(backfilledStartDates);
            setActiveBibleReadingPlanId(normalizedActivePlanId);
            if (JSON.stringify({ ...normalizedProgress, startDates: backfilledStartDates }) !== JSON.stringify(progress)) {
              saveStoredBibleReadingPlanProgress({
                activePlanId: normalizedActivePlanId,
                followedPlanIds: normalizedFollowedPlanIds,
                completedDays: normalizedCompletedDays,
                customPlans: storedPlans,
                startDates: backfilledStartDates,
                completedPlanDates: normalizedCompletionDates,
                completionCounts: normalizedCompletionCounts,
                acknowledgedCareNotes: normalizedAcknowledgedCareNotes,
                updatedAt: normalizedProgress.updatedAt || Date.now()
              }).catch(() => undefined);
            }
          }
          setCompletedBibleReadingPlanDays(normalizedCompletedDays);
        })
        .catch(() => {
          setStoredBibleReadingPlanProgress(emptyBibleReadingPlanProgress());
          setStoredBibleReadingPlanProgressHydrated(true);
        });
      getStoredStudyFocusMode()
        .then((value) => {
          if (!active) return;
          setStudyFocusMode(value);
          setStudyFocusModeHydrated(true);
        })
        .catch(() => setStudyFocusModeHydrated(true));
      getStoredTutorCoachingEnabled()
        .then(value => { if (active) setShowCoaching(value); })
        .catch(() => undefined);
      getStoredCollapsedStudyPanels()
        .then(value => { if (active) setCollapsedStudyPanels(value); })
        .catch(() => undefined);
      getStoredCustomWritingPrompts()
        .then((prompts) => {
          if (!active) return;
          setCustomWritingPrompts(normalizeCustomWritingPrompts(prompts));
          setCustomWritingPromptsHydrated(true);
        })
        .catch(() => setCustomWritingPromptsHydrated(true));
      getStoredMemoryReviewSorts()
        .then((sorts) => {
          if (!active) return;
          setDueMemoryReviewSort(sorts.due);
          setReviewedMemoryReviewSort(sorts.reviewed);
        })
        .catch(() => undefined)
        .finally(() => setMemoryReviewSortsHydrated(true));
      getStoredDevotionalTextSize()
        .then(value => { if (active) setDevotionalTextSize(value); })
        .catch(() => undefined);
    });
    return () => { active = false; cancelIdle(); };
  }, [appInitializationAllowed, profileConnectionState, profileInitializationAttempt]);

  useEffect(() => {
    if (!appInitializationAllowed || !memoryReviewSortsHydrated) return;

    saveStoredMemoryReviewSorts({
      due: dueMemoryReviewSort,
      reviewed: reviewedMemoryReviewSort
    }).catch(() => undefined);
    persistUiPreference("memoryDueSort", dueMemoryReviewSort);
    persistUiPreference("memoryReviewedSort", reviewedMemoryReviewSort);
  }, [appInitializationAllowed, dueMemoryReviewSort, memoryReviewSortsHydrated, reviewedMemoryReviewSort]);

  useEffect(() => {
    return () => {
      if (readerTooltipTimerRef.current) clearTimeout(readerTooltipTimerRef.current);
      clearPendingBibleReaderStateSync();
    };
  }, []);

  useEffect(() => {
    if (!communityStatus || communityStatusShouldHold(communityStatus)) return;
    const timeout = setTimeout(() => {
      setCommunityStatus("");
      if (communityStatus.startsWith("Tap Confirm delete")) setPendingCheckinDeleteId(null);
    }, communityStatus.startsWith("Tap ") ? 7000 : 4200);
    return () => clearTimeout(timeout);
  }, [communityStatus]);

  useEffect(() => {
    if (!friendStatus || communityStatusShouldHold(friendStatus)) return;
    const timeout = setTimeout(() => {
      setFriendStatus("");
      if (friendStatus.startsWith("Tap Remove")) setPendingFriendRemoveId(null);
    }, friendStatus.startsWith("Tap ") ? 7000 : 4200);
    return () => clearTimeout(timeout);
  }, [friendStatus]);

  useEffect(() => {
    if (!circleStatus || communityStatusShouldHold(circleStatus)) return;
    const timeout = setTimeout(() => {
      setCircleStatus("");
      if (circleStatus.startsWith("Tap Leave")) setPendingCircleLeaveId(null);
      if (circleStatus.startsWith("Tap Delete")) setPendingCircleDeleteId(null);
    }, circleStatus.startsWith("Tap ") ? 7000 : 4200);
    return () => clearTimeout(timeout);
  }, [circleStatus]);

  const activeProfileId = profileAuthState === isAuthenticated ? profileId : null;

  useEffect(() => {
    const nextProfileKey = activeProfileId ? String(activeProfileId) : "";
    if (!previousActiveProfileIdRef.current) {
      previousActiveProfileIdRef.current = nextProfileKey;
      return;
    }
    if (previousActiveProfileIdRef.current === nextProfileKey) return;
    previousActiveProfileIdRef.current = nextProfileKey;
    appliedBibleReaderProfileIdRef.current = "";
    appliedBibleReaderStateSignatureRef.current = "";
    clearPendingBibleReaderStateSync();
    loadedDraftRevisionRef.current = 0;
    setLoadedDraftKey("");
    setAnswers({});
    setSkippedStudySteps({});
    setShareNote("");
    setPassageMarkups({});
    setPassageMarkupNotes({});
    setSelectedVerseKeys([]);
    setSaveStatus(nextProfileKey ? "Profile switched" : "Connecting profile...");
  }, [activeProfileId]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof localStorage === "undefined" || !activeProfileId || !isAuthenticated) {
      communityReactionStorageProfileRef.current = "";
      setCommunityReactionOverrides({});
      return;
    }

    const storageProfileId = String(activeProfileId);
    communityReactionStorageProfileRef.current = storageProfileId;
    try {
      const stored = localStorage.getItem(`bible-study-tutor-community-reactions-${storageProfileId}`);
      setCommunityReactionOverrides(stored ? JSON.parse(stored) : {});
    } catch {
      setCommunityReactionOverrides({});
    }
  }, [activeProfileId, isAuthenticated]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof localStorage === "undefined" || !activeProfileId || !isAuthenticated) return;
    const storageProfileId = String(activeProfileId);
    if (communityReactionStorageProfileRef.current !== storageProfileId) return;
    try {
      localStorage.setItem(`bible-study-tutor-community-reactions-${storageProfileId}`, JSON.stringify(communityReactionOverrides));
    } catch {
      // Ignore storage limits; Convex remains the source of truth when available.
    }
  }, [activeProfileId, communityReactionOverrides, isAuthenticated]);

  useEffect(() => {
    if (!activeProfileId || !incomingShareSource || trackedIncomingShareRef.current === incomingShareSource) return;
    trackedIncomingShareRef.current = incomingShareSource;
    recordUsage({
      profileId: activeProfileId,
      localDayKey: localDateKey(),
      eventType: "app_shared",
      reference: incomingShareSource === "qr" ? "QR code" : incomingShareSource,
      tab: "help"
    }).catch(() => undefined);
  }, [activeProfileId, incomingShareSource, recordUsage]);

  const profileSummary = useQuery(api.accountability.profile, activeProfileId ? { profileId: activeProfileId } : "skip");
  const accountIdentity = useQuery(api.accountability.accountIdentity, activeProfileId && tab === "account" ? { profileId: activeProfileId } : "skip");
  const profile = useMemo(
    () => profileSummary ? { ...profileSummary, ...(accountIdentity || {}) } : profileSummary,
    [accountIdentity, profileSummary]
  );
  const remoteBibleReaderState = useQuery(
    api.accountability.bibleReaderState,
    activeProfileId && isAuthenticated ? { profileId: activeProfileId } : "skip"
  );
  const profileAppearanceMode = (profile as any)?.appearanceMode;
  const profileMatchesActiveState =
    !!activeProfileId &&
    profile !== undefined &&
    String((profile as any)?._id || "") === String(activeProfileId) &&
    (isAuthenticated ? !!(profile as any)?.authUserId : !(profile as any)?.authUserId);
  const profileUiPreferences = useMemo(() => normalizeUiPreferences((profile as any)?.uiPreferences), [profile]);
  const shouldLoadStudyLists = profileMatchesActiveState && (tab === "account" || tab === "journal");
  const shouldLoadDueStudyReviews = profileMatchesActiveState && (tab === "home" || tab === "journal");
  const shouldLoadEncouragements = profileMatchesActiveState && (tab === "account" || tab === "accountability" || tab === "journal");
  const shouldLoadCommunityConnections = COMMUNITY_CIRCLES_ENABLED && profileMatchesActiveState && isAuthenticated && (tab === "accountability" || tab === "study");
  const shouldLoadAccountDeletionRequest = profileMatchesActiveState && tab === "account";
  const shouldLoadAdminDetails = profileMatchesActiveState && tab === "admin";
  const shouldLoadCurrentStudyDraft = profileMatchesActiveState && (tab === "study" || !!loadedDraftKey);
  const shouldRenderJournal = tab === "journal";
  const shouldRenderMemoryHistory = tab === "memory" && memoryView === "history";
  const shouldLoadMemoryVerses = profileMatchesActiveState && (tab === "home" || tab === "study" || tab === "bible" || tab === "memory" || tab === "journal" || tab === "account");
  const shouldLoadMemoryHistory = profileMatchesActiveState && shouldRenderMemoryHistory;
  const shouldLoadAdminOverview = profileMatchesActiveState && (tab === "account" || tab === "admin");
  const timezoneOffsetMinutes = new Date().getTimezoneOffset();

  const shouldLoadStudyStats = profileMatchesActiveState && (tab === "home" || tab === "account");
  const stats = useQuery(api.study.stats, shouldLoadStudyStats ? { profileId: activeProfileId, timezoneOffsetMinutes, now: studyReviewNow } : "skip");
  const rhythmGrace = (stats as any)?.rhythmGrace;
  const currentRhythmCount = Number((stats as any)?.currentStreak || 0);
  const sessions = useQuery(api.study.recentSessions, shouldLoadStudyLists ? { profileId: activeProfileId, limit: 12 } : "skip");
  const savedDraft = useQuery(
    api.study.draftForPassage,
    shouldLoadCurrentStudyDraft ? { profileId: activeProfileId, passage: passage.trim() || "Selected passage", methodId } : "skip"
  );
  const drafts = useQuery(api.study.recentDrafts, shouldLoadStudyLists ? { profileId: activeProfileId, limit: 12 } : "skip");
  const dueStudyReviews = useQuery(api.study.dueStudyReviews, shouldLoadDueStudyReviews ? { profileId: activeProfileId, now: studyReviewNow, limit: 10 } : "skip");

  useEffect(() => {
    if (!shouldLoadDueStudyReviews) return;
    setStudyReviewNow(Date.now());
    const interval = setInterval(() => setStudyReviewNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, [shouldLoadDueStudyReviews]);

  useEffect(() => {
    if (!profileMatchesActiveState || !activeProfileId || stats === undefined || stats?.migrationStatus === "ready" || stats?.migrationStatus === "backfilling") return;
    ensureStudyStats({ profileId: activeProfileId }).catch(() => undefined);
  }, [activeProfileId, ensureStudyStats, profileMatchesActiveState, stats]);

  useEffect(() => {
    const missedDate = typeof rhythmGrace?.missedDate === "string" ? rhythmGrace.missedDate : "";
    if (!profileMatchesActiveState || !activeProfileId || !missedDate) return;
    const storageKey = `bible-study-tutor-rhythm-grace-${activeProfileId}-${missedDate}`;
    const syncedHandledDates = uiStringList(profileUiPreferences, "rhythmGraceHandledDates") || [];
    if (syncedHandledDates.includes(missedDate)) {
      safeSetLocalStorageValue(storageKey, "handled");
      if (pendingRhythmGracePrompt?.storageKey === storageKey) setPendingRhythmGracePrompt(null);
      return;
    }
    if (pendingRhythmGracePrompt?.storageKey === storageKey) return;
    if (safeGetLocalStorageValue(storageKey) === "handled") return;
    setPendingRhythmGracePrompt({
      missedDate,
      latestActivityDate: typeof rhythmGrace?.latestActivityDate === "string" ? rhythmGrace.latestActivityDate : "",
      storageKey
    });
  }, [
    activeProfileId,
    pendingRhythmGracePrompt?.storageKey,
    profileMatchesActiveState,
    profileUiPreferences,
    rhythmGrace?.latestActivityDate,
    rhythmGrace?.missedDate
  ]);
  const checkins = useQuery(api.accountability.recentCheckins, shouldLoadEncouragements ? { profileId: activeProfileId, limit: 50 } : "skip");
  const communityFriends = useQuery(api.community.myFriends, shouldLoadCommunityConnections ? { profileId: activeProfileId } : "skip");
  const communityCircles = useQuery(api.community.myCircles, shouldLoadCommunityConnections ? { profileId: activeProfileId } : "skip");
  const memoryVerses = useQuery(api.memory.list, shouldLoadMemoryVerses ? { profileId: activeProfileId, limit: 50 } : "skip");
  const memoryHistory = useQuery(api.memory.listHistory, shouldLoadMemoryHistory ? { profileId: activeProfileId, limit: 120 } : "skip");
  const memoryStats = useQuery(api.memory.stats, shouldLoadMemoryHistory ? { profileId: activeProfileId } : "skip");
  const adminOverview = useQuery(api.insights.adminOverview, shouldLoadAdminOverview ? { now: studyReviewNow } : "skip");
  const accountDeletionRequest = useQuery(api.insights.deletionRequestForProfile, shouldLoadAccountDeletionRequest ? { profileId: activeProfileId } : "skip");
  const {
    results: adminUsers,
    status: adminUsersStatus,
    loadMore: loadMoreAdminUsers
  } = usePaginatedQuery(api.insights.adminUsersPage, shouldLoadAdminDetails ? {} : "skip", { initialNumItems: 15 });
  const adminUserDetail = useQuery(api.insights.adminUserDetail, shouldLoadAdminDetails && selectedAdminProfileId ? { profileId: selectedAdminProfileId, now: studyReviewNow } : "skip");
  const adminAuditLog = useQuery(api.insights.adminAuditLog, shouldLoadAdminDetails ? { limit: 20 } : "skip");

  useEffect(() => {
    if (!profileMatchesActiveState || !memoryReviewSortsHydrated) return;
    if (!uiMemoryReviewSort(profileUiPreferences, "memoryDueSort")) persistUiPreference("memoryDueSort", dueMemoryReviewSort);
    if (!uiMemoryReviewSort(profileUiPreferences, "memoryReviewedSort")) persistUiPreference("memoryReviewedSort", reviewedMemoryReviewSort);
    if (!uiStringList(profileUiPreferences, "pinnedJournalEntryIds") && pinnedJournalEntryIds.length > 0) {
      persistUiPreference("pinnedJournalEntryIds", pinnedJournalEntryIds.slice(0, 80));
    }
  }, [dueMemoryReviewSort, memoryReviewSortsHydrated, pinnedJournalEntryIds, profileMatchesActiveState, profileUiPreferences, reviewedMemoryReviewSort]);

  useEffect(() => {
    if (!profileMatchesActiveState) return;
    if (uiDevotionalTextSize(profileUiPreferences) === undefined && devotionalTextSize !== "normal") {
      persistUiPreference("devotionalTextSize", devotionalTextSize);
    }
  }, [devotionalTextSize, profileMatchesActiveState, profileUiPreferences]);

  useEffect(() => {
    if (!profileMatchesActiveState || !studyFocusModeHydrated) return;
    if (uiBoolean(profileUiPreferences, "studyFocusMode") === undefined && studyFocusMode) {
      persistUiPreference("studyFocusMode", true);
    }
  }, [profileMatchesActiveState, profileUiPreferences, studyFocusMode, studyFocusModeHydrated]);

  useEffect(() => {
    if (!profileMatchesActiveState || !customWritingPromptsHydrated) return;
    if (!uiStringList(profileUiPreferences, "customWritingPrompts") && customWritingPrompts.length > 0) {
      persistUiPreference("customWritingPrompts", normalizeCustomWritingPrompts(customWritingPrompts));
    }
  }, [customWritingPrompts, customWritingPromptsHydrated, profileMatchesActiveState, profileUiPreferences]);

  useEffect(() => {
    if (!COMMUNITY_CIRCLES_ENABLED || !activeProfileId || !isAuthenticated) {
      setMyFriendCode("");
      return;
    }
    if (tab !== "accountability") return;

    let cancelled = false;
    ensureCommunityFriendCode({ profileId: activeProfileId })
      .then((code: string) => {
        if (!cancelled) setMyFriendCode(code || "");
      })
      .catch(() => {
        if (!cancelled) setFriendStatus("Could not load your friend code yet.");
      });

    return () => {
      cancelled = true;
    };
  }, [activeProfileId, ensureCommunityFriendCode, isAuthenticated, tab]);
  useEffect(() => {
    if (!Array.isArray(communityCircles)) return;
    if (communityCircles.length === 0) {
      setSelectedCircleId(null);
      setTargetCircleId(null);
      return;
    }
    if (selectedCircleId && !communityCircles.some((circle: any) => String(circle._id) === String(selectedCircleId))) {
      setSelectedCircleId(null);
    }
    if (targetCircleId && !communityCircles.some((circle: any) => String(circle._id) === String(targetCircleId))) {
      setTargetCircleId(null);
    }
  }, [communityCircles, selectedCircleId, targetCircleId]);
  useEffect(() => {
    if (!Array.isArray(communityFriends)) {
      return;
    }

    const acceptedFriends = communityFriends.filter((friend: any) => friend.status === "accepted");
    if (acceptedFriends.length === 0) {
      setSelectedFriendId(null);
      setTargetFriendIds([]);
      if (Array.isArray(communityCircles) && communityCircles.length > 0) setCommunityTargetType("circle");
      return;
    }

    if (!selectedFriendId || !acceptedFriends.some((friend: any) => String(friend._id) === String(selectedFriendId))) {
      setSelectedFriendId(acceptedFriends[0]._id);
    }
    setTargetFriendIds((current) => {
      const acceptedIds = acceptedFriends.map((friend: any) => String(friend._id));
      const filtered = current.filter((id) => acceptedIds.includes(String(id)));
      if (filtered.length > 0 && filtered.length === current.length) return current;
      if (filtered.length > 0) return filtered;
      return [acceptedFriends[0]._id];
    });
    if (!targetCircleId) setCommunityTargetType("friend");
  }, [communityFriends, communityCircles, selectedFriendId, targetCircleId]);
  useEffect(() => {
    if (!Array.isArray(communityFriends)) return;
    const acceptedIds = communityFriends.filter((friend: any) => friend.status === "accepted").map((friend: any) => String(friend._id));
    setShareInsightFriendIds((current) => current.filter((id) => acceptedIds.includes(String(id))));
  }, [communityFriends]);
  useEffect(() => {
    if (!Array.isArray(communityCircles)) return;
    if (shareInsightCircleId && !communityCircles.some((circle: any) => String(circle._id) === String(shareInsightCircleId))) {
      setShareInsightCircleId(null);
    }
  }, [communityCircles, shareInsightCircleId]);
  useEffect(() => {
    if (tab === "bible") return;
    if (bibleSearchResults.length === 0 && !bibleSearchStatus && !bibleSearchDuration && !bibleSearchActiveQuery) return;
    setBibleSearchResults([]);
    setBibleSearchStatus("");
    setBibleSearchDuration("");
    setBibleSearchActiveQuery("");
    setBibleSearchBookMenuOpen(false);
    setBibleSearchCriteriaOpen(false);
  }, [bibleSearchActiveQuery, bibleSearchDuration, bibleSearchResults.length, bibleSearchStatus, tab]);
  const method = useMemo(() => methods.find((item) => item.id === methodId) || methods[0], [methodId]);
  const activeMethodInfo = useMemo(() => methods.find((item) => item.id === activeMethodInfoId) || null, [activeMethodInfoId]);
  const methodFilters = useMemo(() => ["All", ...Array.from(new Set(methods.flatMap((item) => item.labels || [])))], []);
  const visibleMethods = useMemo(
    () => (methodFilter === "All" ? methods : methods.filter((item) => item.labels?.includes(methodFilter))),
    [methodFilter]
  );
  const methodRecommendations = useMemo(
    () => [
      { id: "quick" as const, label: "10 minutes", methodId: "read", reason: "READ keeps the flow simple and ends with one concrete action." },
      { id: "pray" as const, label: "I want to pray", methodId: "lectio", reason: "Lectio slows the passage into meditation, prayer, and rest." },
      { id: "deep" as const, label: "Go deeper", methodId: "inductive", reason: "Inductive gives more room for structure, questions, and summary." },
      { id: "reflect" as const, label: "Reflect", methodId: "hear", reason: "HEAR starts with a phrase that stands out and turns it into response." },
      { id: "group" as const, label: "Group study", methodId: "coma", reason: "COMA is easy to discuss because it separates context, meaning, and application." }
    ],
    []
  );
  const selectedMethodRecommendation = methodRecommendations.find((item) => item.id === methodRecommendationId) || methodRecommendations[0];
  const recommendedMethod = methods.find((item) => item.id === selectedMethodRecommendation.methodId) || methods[0];
  const step = method.steps[stepIndex];
  const answerKey = studyStepKey(method.id, step.id);
  const currentStudyKey = studyKey(passage, method.id);
  const answeredSteps = method.steps
    .map((item, index) => ({
      index,
      title: item.title,
      answer: answers[studyStepKey(method.id, item.id)] || ""
    }))
    .filter((item) => item.answer.trim());
  const sessionAnswers = method.steps.map((item, index) => ({
    stepId: item.id,
    stepTitle: item.title,
    answer: answers[studyStepKey(method.id, item.id)] || ""
  }));
  const hasStudyWork = sessionAnswers.some((item) => item.answer.trim());
  const skippedStepTitles = useMemo(() => method.steps
    .filter((item) => item.responseType === "text" && skippedStudySteps[studyStepKey(method.id, item.id)] && !answers[studyStepKey(method.id, item.id)]?.trim())
    .map((item) => item.title), [answers, method, skippedStudySteps]);
  const skippedStepIds = useMemo(() => method.steps
    .filter((item) => item.responseType === "text" && skippedStudySteps[studyStepKey(method.id, item.id)] && !answers[studyStepKey(method.id, item.id)]?.trim())
    .map((item) => item.id), [answers, method, skippedStudySteps]);
  const writingStepCount = method.steps.filter((item) => item.responseType === "text").length;
  const completedWritingStepCount = sessionAnswers.filter((item) => item.answer.trim()).length;
  const hasStudySubstance = hasStudyWork || Object.keys(passageMarkups).length > 0;
  const hasStudyMethodState = !!studyMethodState.focusText.trim()
    || studyMethodState.focusVerseKeys.length > 0
    || studyMethodState.evidenceVerseKeys.length > 0
    || studyMethodState.reviewReadActionTomorrow;
  const hasStudyContent = hasStudySubstance || !!shareNote.trim() || hasStudyMethodState;
  const completedStudyStepCount = method.steps.filter((item, index) =>
    item.responseType === "none"
      ? index < stepIndex || studyPhase !== "study"
      : !!answers[studyStepKey(method.id, item.id)]?.trim()
  ).length;
  const progress = Math.min(100, (completedStudyStepCount / method.steps.length) * 100);
  const studyPassageReference = passageText?.reference || passage;
  const studyContextReference = useMemo(() => buildStudyContextReference(studyPassageReference), [studyPassageReference]);
  const studyHelps = useMemo(() => buildStudyHelpLinks(passageText?.reference || passage, bibleTranslation), [bibleTranslation, passage, passageText?.reference]);
  const continueLabel =
    step.responseType === "none"
      ? step.nextLabel || "I am ready for the next step"
      : stepIndex === method.steps.length - 1
        ? "Review study"
        : "Continue";
  const parsedPassage = parsePassageQuery(passageQuery);
  const latestCheckin = checkins?.[0];
  const backendReady = profileMatchesActiveState;
  const backendStatusLabel = backendReady
    ? "Saving is ready"
    : profileConnectionState === "loading"
      ? "Connecting to saved data"
      : "Saving unavailable";
  const backendStatusDetail = backendReady
    ? isAuthenticated
      ? "Drafts, journal, and account changes sync with your signed-in account."
      : "Drafts, journal, and account changes save to this device profile."
    : profileConnectionState === "loading"
      ? "Connecting to your saved data."
      : "Check your connection, then retry saving.";
  const accountProviderLabel =
    profile?.authProvider === "google"
      ? "Google"
      : profile?.authProvider === "apple"
        ? "Apple"
        : profile?.authProvider === "password" || profile?.authLoginKind === "username"
          ? profile?.authLoginKind === "username"
            ? "username and password"
            : "email and password"
          : "your account";
  const personalDisplayName =
    displayName.trim() && displayName.trim() !== "Bible student"
      ? displayName.trim()
      : profile?.authName?.trim() || authName.trim() || "Bible student";
  const firstName = personalDisplayName !== "Bible student" ? personalDisplayName.split(/\s+/)[0] : "";
  const friendlyName = firstName || "friend";
  const weeklyRhythm = (stats as any)?.weeklyRhythm;
  const homeWeeklyRhythmText = useMemo(() => {
    if (!weeklyRhythm) return "";
    const activeDays = Number(weeklyRhythm.activeDays || 0);
    const weeklySubject = firstName ? `${firstName}, you` : "You";
    if (activeDays <= 0) return `${weeklySubject} can begin this week with one reading, guided study, or memory review whenever you’re ready.`;

    const parts = [
      [weeklyRhythm.planReadingsCompleted, "completed", "plan reading"],
      [weeklyRhythm.chaptersRead, "read", "chapter"],
      [weeklyRhythm.memoryReviews, "reviewed", "memory verse"],
      [weeklyRhythm.studiesCompleted, "completed", "guided study"],
      [weeklyRhythm.worksheetsPrinted + weeklyRhythm.memoryCardsPrinted, "printed", "resource"],
      [weeklyRhythm.encouragementsShared, "shared", "encouragement"]
    ]
      .map(([count, verb, label]) => ({ count: Number(count || 0), verb: String(verb), label: String(label) }))
      .filter((item) => item.count > 0)
      .map((item) => `${item.verb} ${item.count} ${item.label}${item.count === 1 ? "" : "s"}`);
    const detail = parts.length ? ` You ${formatInlineList(parts)}.` : "";
    const strongestArea = formatWeeklyRhythmArea(weeklyRhythm.strongestArea);
    const strongest = strongestArea ? ` Your most-used area was ${strongestArea}.` : "";
    return `${weeklySubject} used Bible Study Tutor on ${activeDays} day${activeDays === 1 ? "" : "s"} this week.${detail}${strongest} Every step counts.`;
  }, [firstName, weeklyRhythm]);
  const accountIdentityLabel = profile?.authUsername
    ? `${personalDisplayName} (@${profile.authUsername})`
    : profile?.authEmail
      ? `${personalDisplayName} (${profile.authEmail})`
      : personalDisplayName;
  const activeCheckinPartner = checkinPartners.find((item) => item.id === activeCheckinPartnerId);
  const effectivePartner = activeCheckinPartner?.name || partner;
  const visibleCheckins = (checkins || []).slice(0, recentCheckinsExpanded ? 8 : 3);
  const communityCheckins = Array.isArray(checkins) ? checkins : [];
  const communityHistoryCheckins = communitySubView === "history" ? communityCheckins : [];
  const communityHistoryCircleOptions = Array.from(
    new Map(
      communityHistoryCheckins
        .flatMap((checkin: any) => Array.isArray(checkin.sharedTo) ? checkin.sharedTo : [])
        .filter((item: any) => item.circleId)
        .map((item: any) => [String(item.circleId), { circleId: String(item.circleId), circleName: item.circleName || "Circle" }])
    ).values()
  );
  const filteredCommunityHistoryCheckins = communityHistoryCheckins.filter((checkin: any) => {
    const sharedTo = Array.isArray(checkin.sharedTo) ? checkin.sharedTo : [];
    if (communityHistoryFilter === "private") return sharedTo.length === 0;
    if (communityHistoryFilter === "circles") {
      if (sharedTo.length === 0) return false;
      if (communityHistoryCircleId === "all") return true;
      return sharedTo.some((item: any) => String(item.circleId) === communityHistoryCircleId);
    }
    return true;
  });
  const communityHistoryGroups = filteredCommunityHistoryCheckins.reduce((groups: { title: string; items: any[] }[], checkin: any) => {
    const sharedTo = Array.isArray(checkin.sharedTo) ? checkin.sharedTo : [];
    const title = sharedTo.length > 0
      ? `Shared to ${sharedTo.map((item: any) => item.circleName || item.friendName).filter(Boolean).join(", ")}`
      : "Private encouragements";
    const existing = groups.find((group) => group.title === title);
    if (existing) {
      existing.items.push(checkin);
    } else {
      groups.push({ title, items: [checkin] });
    }
    return groups;
  }, []);
  const acceptedCommunityFriends = Array.isArray(communityFriends) ? communityFriends.filter((friend: any) => friend.status === "accepted") : [];
  const pendingCommunityFriendInvites = Array.isArray(communityFriends) ? communityFriends.filter((friend: any) => friend.status === "pending") : [];
  const selectedCommunityFriends = acceptedCommunityFriends.filter((friend: any) => targetFriendIds.some((id) => String(id) === String(friend._id)));
  const managedCommunityFriend = acceptedCommunityFriends.find((friend: any) => String(friend._id) === String(selectedFriendId));
  const selectedCommunityCircle = (communityCircles || []).find((circle: any) => String(circle._id) === String(targetCircleId));
  const selectedCommunityFriendNames = selectedCommunityFriends.map((friend: any) => friend.name).filter(Boolean);
  const activeCommunityTargetName = communityTargetType === "friend" ? formatNameList(selectedCommunityFriendNames) : selectedCommunityCircle?.name;
  const hasAvailableCommunityTarget = acceptedCommunityFriends.length > 0 || (communityCircles || []).length > 0;
  const hasCommunityTarget = !!activeCommunityTargetName;
  const selectedShareInsightFriends = acceptedCommunityFriends.filter((friend: any) => shareInsightFriendIds.some((id) => String(id) === String(friend._id)));
  const selectedShareInsightCircle = (communityCircles || []).find((circle: any) => String(circle._id) === String(shareInsightCircleId));
  const selectedShareInsightFriendNames = selectedShareInsightFriends.map((friend: any) => friend.name).filter(Boolean);
  const activeShareInsightTargetName = shareInsightTargetType === "friend" ? formatNameList(selectedShareInsightFriendNames) : selectedShareInsightCircle?.name;
  const hasShareInsightTarget = !!activeShareInsightTargetName;
  const communityMessage = buildCommunityMessage({ partner: activeCommunityTargetName || "", senderName: firstName, checkinNote });
  const currentCoaching = buildCoachingFeedback(method.id, step.title, stripNoteFormatting(answers[answerKey] || ""));
  const shouldPrepareBibleUi = tab === "bible";
  const readerReference = `${readerBook} ${readerChapter}`;
  const readerStudyReference = buildReaderStudyReference(readerBook, readerChapter, selectedReaderVerses);
  const filteredReaderBooks = shouldPrepareBibleUi ? bibleBooks.filter((book) => book.toLowerCase().includes(readerBookSearch.trim().toLowerCase())) : [];
  const readerBookSections = shouldPrepareBibleUi ? [
    { title: "Old Testament", books: OLD_TESTAMENT_BOOKS.filter((book) => filteredReaderBooks.includes(book)) },
    { title: "New Testament", books: NEW_TESTAMENT_BOOKS.filter((book) => filteredReaderBooks.includes(book)) }
  ].filter((section) => section.books.length > 0) : [];
  const readerChapterCount = BIBLE_CHAPTER_COUNTS[readerBook] || 1;
  const activeReaderActionVerse = selectedReaderVerses.includes(readerActionVerse) ? readerActionVerse : selectedReaderVerses[selectedReaderVerses.length - 1] || 0;
  const currentChapterRead = readBibleChapters[readerBook]?.includes(readerChapter) || false;
  const currentBookReadChapterCount = readBibleChapters[readerBook]?.length || 0;
  const readBibleChapterCount = Object.values(readBibleChapters).reduce((count, chapters) => count + chapters.length, 0);
  const todayDateKey = localDateKey();
  const bibleReadingPlanView = useMemo(() => buildBibleReadingPlanView({
    builtInPlans: bibleReadingPlanCorpus?.plans || [],
    customPlans: customBibleReadingPlans,
    followedPlanIds: followedBibleReadingPlanIds,
    activePlanId: activeBibleReadingPlanId,
    completedDayKeys: completedBibleReadingPlanDays,
    startDates: bibleReadingPlanStartDates,
    completedPlanDates: bibleReadingPlanCompletionDates,
    selectedPlanId: activeBiblePlanSelectedPlanId,
    selectedDay: activeBiblePlanSelectedDay,
    todayDateKey,
    addDaysToDateKey
  }), [
    activeBiblePlanSelectedDay,
    activeBiblePlanSelectedPlanId,
    activeBibleReadingPlanId,
    bibleReadingPlanCompletionDates,
    bibleReadingPlanCorpus,
    bibleReadingPlanStartDates,
    completedBibleReadingPlanDays,
    customBibleReadingPlans,
    followedBibleReadingPlanIds,
    todayDateKey
  ]);
  const allBibleReadingPlans = bibleReadingPlanView.allPlans;
  const followedBibleReadingPlans = bibleReadingPlanView.followedPlans;
  const completedFollowedBibleReadingPlans = bibleReadingPlanView.completedFollowedPlans;
  const followedBibleReadingPlanIdSet = bibleReadingPlanView.followedPlanIdSet;
  const selectedBibleReadingPlanId = bibleReadingPlanView.selectedActivePlanId;
  const otherFollowedBibleReadingPlans = bibleReadingPlanView.otherFollowedPlans;
  const unfollowedBibleReadingPlanGroups = bibleReadingPlanView.groups;
  const activeBibleReadingPlan = bibleReadingPlanView.activePlan;
  const completedBibleReadingPlanDaySet = bibleReadingPlanView.completedDaySet;
  const activeBibleReadingPlanCompletedCount = bibleReadingPlanView.activeCompletedCount;
  const activeBibleReadingPlanToday = bibleReadingPlanView.activeToday;
  const activeBibleReadingPlanComplete = bibleReadingPlanView.activeComplete;
  const activeBibleReadingPlanStartDate = bibleReadingPlanView.activeStartDate;
  const activeBibleReadingPlanSelectedDay = bibleReadingPlanView.activeSelectedDay;
  const activeBibleReadingPlanSelectedDateKey = bibleReadingPlanView.activeSelectedDateKey;
  const activeBibleReadingPlanTodayDateKey = bibleReadingPlanView.activeTodayDateKey;
  const activeBibleReadingPlanDoneToday = bibleReadingPlanView.activeDoneToday;
  const activeBibleReadingPlanDoneTodayLabel = bibleReadingPlanView.activeDoneTodayLabel;
  const activeBibleReadingPlanTodayLabel = activeBibleReadingPlanComplete
    ? "Plan complete"
    : activeBibleReadingPlanToday
      ? activeBibleReadingPlanTodayDateKey && activeBibleReadingPlanTodayDateKey < todayDateKey
        ? `Overdue: Day ${activeBibleReadingPlanToday.day} · ${formatPlanDayRelativeDate(activeBibleReadingPlanTodayDateKey)}`
        : `Next reading: Day ${activeBibleReadingPlanToday.day}${activeBibleReadingPlanTodayDateKey ? ` · ${formatPlanDayRelativeDate(activeBibleReadingPlanTodayDateKey)}` : ""}`
      : "";
  const activeBibleReadingPlanDayCount = activeBibleReadingPlan?.days.length || 0;
  const activeBibleReadingPlanRemainingCount = Math.max(0, activeBibleReadingPlanDayCount - activeBibleReadingPlanCompletedCount);
  const activeBibleReadingPlanProgressPercent = activeBibleReadingPlanDayCount
    ? Math.min(100, (activeBibleReadingPlanCompletedCount / activeBibleReadingPlanDayCount) * 100)
    : 0;
  const activeBibleReadingPlanQuiet = !!activeBibleReadingPlanDoneToday && !activeBibleReadingPlanComplete;
  const otherFollowedBibleReadingPlanSummaries = bibleReadingPlanView.otherSummaries;
  const activeBibleReadingPlanMissedFullDay = bibleReadingPlanView.activeMissedFullDay;
  const activeBibleReadingPlanSelectedDone = bibleReadingPlanView.activeSelectedDone;

  useEffect(() => {
    if (tab !== "plans") return;
    if (activeBibleReadingPlan?.id) {
      scrollBiblePlanDayPickerIntoView(
        activeBibleReadingPlan.id,
        activeBibleReadingPlanSelectedDay?.day || activeBibleReadingPlanToday?.day || 1,
        true,
        140
      );
    }
    otherFollowedBibleReadingPlans.forEach((plan) => {
      const selectedDay =
        activeBiblePlanSelectedPlanId === plan.id && activeBiblePlanSelectedDay
          ? activeBiblePlanSelectedDay
          : plan.days.find((day) => !completedBibleReadingPlanDaySet.has(bibleReadingPlanDayKey(plan.id, day.day)))?.day || 1;
      scrollBiblePlanDayPickerIntoView(plan.id, selectedDay, true, 160);
    });
  }, [
    activeBiblePlanSelectedDay,
    activeBiblePlanSelectedPlanId,
    activeBibleReadingPlan?.id,
    activeBibleReadingPlanSelectedDay?.day,
    activeBibleReadingPlanToday?.day,
    completedBibleReadingPlanDays,
    otherFollowedBibleReadingPlans,
    tab
  ]);
  const readerPlanReadingChunkCount = readerPlanReading?.chunks?.length || 0;
  const readerPlanReadingChunkIndex = Math.min(Math.max(readerPlanReading?.currentChunkIndex || 0, 0), Math.max(0, readerPlanReadingChunkCount - 1));
  const readerPlanCanMovePrevious = !!readerPlanReading && readerPlanReadingChunkIndex > 0;
  const readerPlanCanMoveNext = !!readerPlanReading && readerPlanReadingChunkIndex < readerPlanReadingChunkCount - 1;
  const readerPlanChunkLabel = readerPlanReadingChunkCount > 1
    ? `Part ${readerPlanReadingChunkIndex + 1} of ${readerPlanReadingChunkCount}`
    : "";
  const readerPlanCurrentChunk = getReaderPlanReadingChunk(readerPlanReading);
  const readerPlanCurrentChunkReference = readerPlanCurrentChunk?.reference || "";
  const readerBibleReadingPlan = readerPlanReading?.planId
    ? allBibleReadingPlans.find((plan) => plan.id === readerPlanReading.planId) || activeBibleReadingPlan
    : activeBibleReadingPlan;
  const readerPlanReadingActive = isReaderPlanReadingActive(readerBibleReadingPlan, readerPlanReading, readerBook, readerChapter);
  const readerActiveBibleReadingPlanDay =
    readerPlanReadingActive && readerBibleReadingPlan && readerPlanReading?.planId === readerBibleReadingPlan.id
      ? readerBibleReadingPlan.days.find((day) => day.day === readerPlanReading.day) || getReaderPlanDayForChapter(readerBibleReadingPlan, readerBook, readerChapter)
      : null;
  const readerActiveBibleReadingPlanDayComplete =
    !!readerBibleReadingPlan &&
    !!readerActiveBibleReadingPlanDay &&
    completedBibleReadingPlanDaySet.has(bibleReadingPlanDayKey(readerBibleReadingPlan.id, readerActiveBibleReadingPlanDay.day));
  const readerMatchesActiveBibleReadingPlanDay =
    !!readerPlanReadingActive && !!readerActiveBibleReadingPlanDay;
  const readerPlanCurrentChunkParsed = readerPlanCurrentChunkReference ? parseBsbPassageReference(readerPlanCurrentChunkReference) : null;
  const readerPlanChunkIsFullCurrentChapter =
    !!readerPlanReadingActive &&
    !!readerPlanCurrentChunk &&
    readerPlanReadingChunkCount === 1 &&
    readerPlanCurrentChunk.book === readerBook &&
    readerPlanCurrentChunk.chapter === readerChapter &&
    !readerPlanCurrentChunk.startVerse &&
    !readerPlanCurrentChunk.endVerse;
  const readerPlanChunkNote = readerPlanReadingActive && readerPlanCurrentChunk
    ? readerPlanReadingChunkCount > 1
      ? `Part ${readerPlanReadingChunkIndex + 1} of ${readerPlanReadingChunkCount}: ${readerPlanCurrentChunk.reference}.`
      : ""
    : "";
  const readerPlanReadingLabel =
    readerPlanReadingActive && readerBibleReadingPlan && readerActiveBibleReadingPlanDay
      ? `${readerBibleReadingPlan.title} - Day ${readerActiveBibleReadingPlanDay.day}, ${readerActiveBibleReadingPlanDay.title || readerActiveBibleReadingPlanDay.reference}`
      : "";
  const readerLoadRequest = buildReaderLoadRequest(readerPlanReadingActive, readerPlanReading, `${readerBook} ${readerChapter}`);
  const currentChapterBookmarked = bibleBookmarks.some((bookmark) => bookmark.reference === buildReaderStudyReference(readerBook, readerChapter, []) && bookmark.bookmarked !== false);
  const currentSelectionBookmark = selectedReaderVerses.length > 0
    ? bibleBookmarks.find((bookmark) => bookmark.reference === readerStudyReference)
    : undefined;
  const currentSelectionBookmarked =
    selectedReaderVerses.length > 0 && !!currentSelectionBookmark && currentSelectionBookmark.bookmarked !== false;
  const filteredBibleBookmarks = shouldPrepareBibleUi ? bibleBookmarks
    .filter((bookmark) => {
      const query = bookmarkSearch.trim().toLowerCase();
      const matchesSearch = !query || `${bookmark.reference} ${bookmark.note || ""}`.toLowerCase().includes(query);
      const matchesNoteFilter = !bookmarkNotesOnly || !!bookmark.note?.trim();
      return matchesSearch && matchesNoteFilter;
    }) : [];
  const visibleBibleBookmarks = filteredBibleBookmarks.slice(0, bookmarksExpanded ? filteredBibleBookmarks.length : 3);
  const showReaderTooltipAfterDelay = (label: string) => {
    if (readerTooltipTimerRef.current) clearTimeout(readerTooltipTimerRef.current);
    readerTooltipTimerRef.current = setTimeout(() => setReaderIconTooltip(label), 1200);
  };
  const hideReaderTooltip = () => {
    if (readerTooltipTimerRef.current) clearTimeout(readerTooltipTimerRef.current);
    readerTooltipTimerRef.current = null;
    setReaderIconTooltip("");
  };
  const readerIconHoverProps = (label: string) =>
    Platform.OS === "web"
      ? ({
          accessibilityLabel: label,
          onHoverIn: () => showReaderTooltipAfterDelay(label),
          onHoverOut: hideReaderTooltip,
          onMouseEnter: () => showReaderTooltipAfterDelay(label),
          onMouseLeave: hideReaderTooltip,
          onPointerEnter: () => showReaderTooltipAfterDelay(label),
          onPointerLeave: hideReaderTooltip
        } as any)
      : { accessibilityLabel: label };
  const selectedVerses = useMemo(
    () => passageText?.verses?.filter((verse) => selectedVerseKeys.includes(verseMarkupKey(verse))) || [],
    [passageText?.verses, selectedVerseKeys]
  );
  const focusVerses = useMemo(
    () => passageText?.verses?.filter((verse) => studyMethodState.focusVerseKeys.includes(verseMarkupKey(verse))) || [],
    [passageText?.verses, studyMethodState.focusVerseKeys]
  );
  const evidenceVerses = useMemo(
    () => passageText?.verses?.filter((verse) => studyMethodState.evidenceVerseKeys.includes(verseMarkupKey(verse))) || [],
    [passageText?.verses, studyMethodState.evidenceVerseKeys]
  );
  const selectedMarkupKinds = Array.from(new Set(selectedVerseKeys.map((key) => passageMarkups[key]).filter(Boolean)));
  const selectedVerseMarkup = selectedMarkupKinds.length === 1 ? selectedMarkupKinds[0] : undefined;
  const activeStudyMarkupVerseKey = selectedVerseKeys[selectedVerseKeys.length - 1] || "";
  const highlightedVerseCount = Object.keys(passageMarkups).length;
  const selectedHighlightedVerseKey = selectedVerseKeys.length === 1 && passageMarkups[selectedVerseKeys[0]] ? selectedVerseKeys[0] : "";
  const passageMarkupRecords = useMemo(
    () => buildPassageMarkupRecords(passageMarkups, passageMarkupNotes, passageText?.verses || []),
    [passageMarkupNotes, passageMarkups, passageText?.verses]
  );
  const memoryVerseKeys = useMemo(
    () => buildMemoryVerseKeySet(passageText?.verses || [], memoryVerses || []),
    [memoryVerses, passageText?.verses]
  );
  const readerMemoryVerseKeys = useMemo(
    () => shouldPrepareBibleUi ? buildMemoryVerseKeySet(readerPassage?.verses || [], memoryVerses || []) : new Set<string>(),
    [memoryVerses, readerPassage?.verses, shouldPrepareBibleUi]
  );
  const selectedVersesAlreadyInMemory = selectedVerses.length > 0 && selectedVerses.every((verse) => memoryVerseKeys.has(verseMarkupKey(verse)));
  const selectedReaderVerseObjects = useMemo(() => {
    if (!shouldPrepareBibleUi) return [];
    const selectedSet = new Set(selectedReaderVerses);
    return (readerPassage?.verses || [])
      .filter((verse) => selectedSet.has(verse.verse))
      .sort((a, b) => a.verse - b.verse);
  }, [readerPassage?.verses, selectedReaderVerses, shouldPrepareBibleUi]);
  const selectedReaderVersesAlreadyInMemory =
    selectedReaderVerseObjects.length > 0 &&
    selectedReaderVerseObjects.every((verse) => readerMemoryVerseKeys.has(verseMarkupKey(verse)));
  const adminStats = adminOverview as AdminStats | null;
  const bibleSearchBookOptions = useMemo(() => shouldPrepareBibleUi ? buildBibleSearchBookOptions(bibleSearchScope) : [], [bibleSearchScope, shouldPrepareBibleUi]);
  const bibleSearchSections = useMemo(() => shouldPrepareBibleUi ? buildBibleSearchSections(bibleSearchResults, bibleSearchScope, bibleSearchBook) : [], [bibleSearchBook, bibleSearchResults, bibleSearchScope, shouldPrepareBibleUi]);
  const bibleSearchTranslation = bibleTranslation === "kjv" ? "KJV" : bibleTranslation === "bsb" ? "BSB" : "WEB";
  const journalSearchTerm = journalSearch.trim().toLowerCase();
  const pinnedEntryIds = new Set(pinnedJournalEntryIds);
  const baseVisibleDrafts = shouldRenderJournal ? (drafts || []).filter((draft: any) => matchesJournalSearch(draft, journalSearchTerm)) : [];
  const baseHighlightJournalEntries = shouldRenderJournal ? buildHighlightJournalEntries(sessions || [], drafts || [], journalSearchTerm) : [];
  const totalSavedHighlightCount = countSavedHighlights(sessions || [], drafts || []);
  const savedDataItems = [
    { label: "Completed studies", value: (sessions || []).length, icon: "book-outline" },
    { label: "Draft studies", value: (drafts || []).length, icon: "create-outline" },
    { label: "Memory verses", value: (memoryVerses || []).length, icon: "sparkles-outline" },
    { label: "Encouragements", value: (checkins || []).length, icon: "people-outline" },
    { label: "Saved highlights", value: totalSavedHighlightCount, icon: "color-wand-outline" },
    { label: "Bible bookmarks", value: bibleBookmarks.length, icon: "bookmark-outline" },
    { label: "Chapters marked read", value: readBibleChapterCount, icon: "checkmark-circle-outline" }
  ];
  const journalSessionEntries = shouldRenderJournal ? (sessions || []).filter((entry: any) => {
    if (journalFilter === "studies") return !isMemoryMeditationEntry(entry);
    if (journalFilter === "meditations") return isMemoryMeditationEntry(entry);
    return true;
  }) : [];
  const baseJournalEntries = shouldRenderJournal ? [
    ...(journalFilter === "reviews" ? dueStudyReviews || [] : []),
    ...(journalFilter === "all" || journalFilter === "pinned" || journalFilter === "studies" || journalFilter === "meditations" ? journalSessionEntries : []),
    ...(journalFilter === "all" || journalFilter === "checkins" ? checkins || [] : [])
  ]
    .filter((entry: any) => (journalFilter === "pinned" ? pinnedEntryIds.has(String(entry._id)) : true))
    .filter((entry: any) => matchesJournalSearch(entry, journalSearchTerm))
    .sort((a: any, b: any) => {
      const aPinned = pinnedEntryIds.has(String(a._id)) ? 1 : 0;
      const bPinned = pinnedEntryIds.has(String(b._id)) ? 1 : 0;
      if (aPinned !== bPinned && journalFilter === "all") return bPinned - aPinned;
      return (b.completedAt || b.createdAt) - (a.completedAt || a.createdAt);
    }) : [];
  const journalCalendarItems = shouldRenderJournal ? buildJournalCalendarItems({
    drafts: (journalFilter === "all" || journalFilter === "drafts") ? baseVisibleDrafts : [],
    highlights: journalFilter === "highlights" ? baseHighlightJournalEntries : [],
    entries: baseJournalEntries,
    pinnedEntryIds
  }) : [];
  const dateFilteredDrafts = shouldRenderJournal ? baseVisibleDrafts.filter((draft: any) => matchesJournalDateFilter(draft, journalDateFilterKey)) : [];
  const dateFilteredHighlightJournalEntries = shouldRenderJournal ? baseHighlightJournalEntries.filter((item) => matchesJournalDateFilter(item, journalDateFilterKey)) : [];
  const dateFilteredJournalEntries = shouldRenderJournal ? baseJournalEntries.filter((entry: any) => matchesJournalDateFilter(entry, journalDateFilterKey)) : [];
  const journalScriptureItems = shouldRenderJournal ? buildJournalScriptureItems({
    drafts: (journalFilter === "all" || journalFilter === "drafts") ? dateFilteredDrafts : [],
    highlights: journalFilter === "highlights" ? dateFilteredHighlightJournalEntries : [],
    entries: dateFilteredJournalEntries,
    pinnedEntryIds
  }) : [];
  const journalScriptureBookSections = shouldRenderJournal ? buildJournalScriptureBookSections(journalScriptureItems) : [];
  const selectedJournalScriptureEntryCount = selectedJournalScriptureBook && selectedJournalScriptureChapter
    ? countJournalScriptureEntries(journalScriptureItems, selectedJournalScriptureBook, selectedJournalScriptureChapter)
    : 0;
  const selectedJournalDateEntryCount = journalDateFilterKey
    ? journalCalendarItems.filter((item) => item.dateKey === journalDateFilterKey).length
    : 0;
  const visibleDrafts = dateFilteredDrafts.filter((draft: any) => matchesJournalScriptureFilter(draft, selectedJournalScriptureBook, selectedJournalScriptureChapter, "draft"));
  const highlightJournalEntries = dateFilteredHighlightJournalEntries.filter((item) => matchesJournalScriptureFilter(item, selectedJournalScriptureBook, selectedJournalScriptureChapter, "highlight"));
  const journalEntries = dateFilteredJournalEntries.filter((entry: any) => matchesJournalScriptureFilter(entry, selectedJournalScriptureBook, selectedJournalScriptureChapter, "entry"));
  const groupedJournalEntries = groupJournalEntriesByRecency(journalEntries);
  const showDraftsSection = (journalFilter === "all" || journalFilter === "drafts") && visibleDrafts.length > 0;
  const showHighlightsSection = journalFilter === "highlights" && highlightJournalEntries.length > 0;
  const dueStudyReviewCount = dueStudyReviews?.length || 0;
  const showJournalEmptyState = !showDraftsSection && !showHighlightsSection && journalEntries.length === 0;
  const journalFilterOptions: { key: JournalFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "all", label: "All", icon: "albums-outline" },
    { key: "pinned", label: "Pinned", icon: "star-outline" },
    { key: "drafts", label: "Drafts", icon: "create-outline" },
    { key: "studies", label: "Studies", icon: "reader-outline" },
    { key: "meditations", label: "Meditation", icon: "sparkles-outline" },
    { key: "reviews", label: dueStudyReviewCount > 0 ? `Reviews (${dueStudyReviewCount})` : "Reviews", icon: "refresh-circle-outline" },
    { key: "highlights", label: `Highlights (${totalSavedHighlightCount})`, icon: "color-wand-outline" },
    { key: "checkins", label: "Encouragements", icon: "chatbubbles-outline" }
  ];
  const activeJournalFilterLabel = journalFilterOptions.find((item) => item.key === journalFilter)?.label || "All";
  const shouldPrepareMemoryUi = tab === "memory" || memoryPrintOptionsOpen || !!activeMemoryVerseId || !!activeMemoryMeditationVerseId;
  const activeMemoryVerse = shouldPrepareMemoryUi ? (memoryVerses || []).find((item: any) => String(item._id) === activeMemoryVerseId) : undefined;
  const activeMemoryMeditationVerse = shouldPrepareMemoryUi ? (memoryVerses || []).find((item: any) => String(item._id) === activeMemoryMeditationVerseId) : undefined;
  const memoryQueueSections = useMemo(() => shouldPrepareMemoryUi ? buildMemoryQueueSections(memoryVerses || []) : [], [memoryVerses, shouldPrepareMemoryUi]);
  const activeMemoryReviewQueueIndex = activeMemoryVerseId ? memoryReviewQueueIds.findIndex((id) => id === activeMemoryVerseId) : -1;
  const activeMemoryReviewQueueCount = memoryReviewQueueIds.length;
  const memorySearchTerm = memorySearch.trim().toLowerCase();
  const memoryCollectionOptions = useMemo(() => shouldPrepareMemoryUi ? buildMemoryCollectionOptions(memoryVerses || []) : [], [memoryVerses, shouldPrepareMemoryUi]);
  const activeMemoryCollectionName = memoryCollectionFilter === "all" ? "All collections" : memoryCollectionFilter;
  const activeMemoryCollectionDueCount = memoryCollectionFilter === "all"
    ? 0
    : (memoryVerses || []).filter((verse: any) => isMemoryVerseDue(verse) && getMemoryVerseCollections(verse).includes(memoryCollectionFilter)).length;
  const memoryBookOptions = useMemo(() => shouldPrepareMemoryUi ? buildMemoryBookOptions(memoryVerses || []) : [], [memoryVerses, shouldPrepareMemoryUi]);
  const memoryChapterOptions = useMemo(() => shouldPrepareMemoryUi ? buildMemoryChapterOptions(memoryVerses || [], memoryBookFilter) : [], [memoryBookFilter, memoryVerses, shouldPrepareMemoryUi]);
  const memoryBookCounts = useMemo(() => new Map(memoryBookOptions.map((book) => [book.book, book.count])), [memoryBookOptions]);
  const memoryBookSections = useMemo(
    () => [
      { id: "old" as MemoryFilterMobileMenu, title: "Old Testament", books: OLD_TESTAMENT_BOOKS.filter((book) => memoryBookCounts.has(book)) },
      { id: "new" as MemoryFilterMobileMenu, title: "New Testament", books: NEW_TESTAMENT_BOOKS.filter((book) => memoryBookCounts.has(book)) }
    ].filter((section) => section.books.length > 0),
    [memoryBookCounts]
  );
  const memoryChaptersByBook = useMemo(() => {
    const chapters = new Map<string, ReturnType<typeof buildMemoryChapterOptions>>();
    memoryBookOptions.forEach((book) => {
      chapters.set(book.book, buildMemoryChapterOptions(memoryVerses || [], book.book));
    });
    return chapters;
  }, [memoryBookOptions, memoryVerses]);
  const activeMemoryChapterLabel = memoryChapterOptions.find((chapter) => chapter.key === memoryChapterFilter)?.label || "";
  const memoryBrowseStatusLabel =
    memoryBrowseStatusFilter === "due"
      ? "Due"
      : memoryBrowseStatusFilter === "learning"
        ? "Reviewed"
        : memoryBrowseStatusFilter === "memorized"
          ? "Memorized"
          : "";
  const memoryBrowseFilterSummary = [
    memoryCollectionFilter !== "all" ? memoryCollectionFilter : "",
    memoryBookFilter !== "all" ? memoryBookFilter : "",
    memoryChapterFilter !== "all" ? activeMemoryChapterLabel : "",
    memoryBrowseStatusLabel
  ].filter(Boolean).join(" · ") || "All saved verses";
  const memoryBrowseSections = useMemo(
    () => shouldPrepareMemoryUi ? buildMemoryBrowseSections(memoryVerses || [], memorySearchTerm, memoryBookFilter, memoryChapterFilter, memoryBrowseStatusFilter, memoryCollectionFilter) : [],
    [memoryBookFilter, memoryBrowseStatusFilter, memoryChapterFilter, memoryCollectionFilter, memorySearchTerm, memoryVerses, shouldPrepareMemoryUi]
  );
  const dueMemoryCount = (memoryVerses || []).filter((item: any) => isMemoryVerseDue(item)).length;
  const reviewedTodayCount = (memoryVerses || []).filter((item: any) => isTodayLocal(item.lastReviewedAt)).length;
  const homeContinueItems = [
    ...(isAuthenticated && activeBibleReadingPlan && activeBibleReadingPlanToday && !activeBibleReadingPlanComplete
      ? [{
          key: "reading-plan",
          title: "Continue reading plan",
          detail: `${activeBibleReadingPlan.title}: Day ${activeBibleReadingPlanToday.day} · ${activeBibleReadingPlanToday.reference}`,
          icon: "calendar-outline",
          onPress: () => {
            openBibleReadingPlanDayInBible(activeBibleReadingPlanToday);
          }
        }]
      : []),
    ...(isAuthenticated && dueMemoryCount > 0
      ? [{
          key: "memory-due",
          title: "Review memory verses",
          detail: `${dueMemoryCount} verse${dueMemoryCount === 1 ? "" : "s"} due today`,
          icon: "school-outline",
          onPress: () => startDueMemoryReviewQueue()
        }]
      : []),
    ...(isAuthenticated && dueMemoryCount === 0 && (memoryVerses || []).length > 0
      ? [{
          key: "memory-saved",
          title: "Open saved memory verses",
          detail: `${(memoryVerses || []).length} verse${(memoryVerses || []).length === 1 ? "" : "s"} saved`,
          icon: "sparkles-outline",
          onPress: () => {
            setRememberedMemoryView("browse");
            setTab("memory");
          }
        }]
      : [])
  ];
  const memoryHistoryItems = shouldRenderMemoryHistory ? (memoryHistory || []) : [];
  const memoryHistorySummary = useMemo(
    () => shouldRenderMemoryHistory
      ? buildMemoryHistorySummary(memoryHistoryItems, memoryVerses || [])
      : { reviewedToday: 0, reviewedThisWeek: 0, reviewDaysThisWeek: 0, addedCount: 0, repeatedCount: 0, mostReviewed: null },
    [memoryHistoryItems, memoryVerses, shouldRenderMemoryHistory]
  );
  const memoryHistoryEncouragement = useMemo(
    () => shouldRenderMemoryHistory ? buildMemoryHistoryEncouragement(memoryHistorySummary, firstName) : "",
    [firstName, memoryHistorySummary, shouldRenderMemoryHistory]
  );
  const memoryWeeklySummary = useMemo(
    () => shouldRenderMemoryHistory ? buildMemoryWeeklySummary(memoryHistoryItems, memoryVerses || [], firstName) : "",
    [firstName, memoryHistoryItems, memoryVerses, shouldRenderMemoryHistory]
  );
  const memoryWeeklyScripture = useMemo(
    () => shouldRenderMemoryHistory ? buildMemoryWeeklyScripture(memoryHistoryItems, memoryVerses || []) : { reference: "", text: "" },
    [memoryHistoryItems, memoryVerses, shouldRenderMemoryHistory]
  );
  const memoryMilestones = useMemo(
    () => shouldRenderMemoryHistory ? buildMemoryMilestones(memoryHistoryItems, memoryVerses || [], memoryMilestoneGoalIds, memoryStats) : [],
    [memoryHistoryItems, memoryMilestoneGoalIds, memoryStats, memoryVerses, shouldRenderMemoryHistory]
  );
  const neglectedMemoryVerses = useMemo(
    () => shouldRenderMemoryHistory ? buildNeglectedMemoryVerses(memoryVerses || []) : [],
    [memoryVerses, shouldRenderMemoryHistory]
  );
  const visibleMemoryHistoryItems = memoryHistoryExpanded ? memoryHistoryItems.slice(0, 30) : memoryHistoryItems.slice(0, 10);
  const memoryPracticeText = useMemo(
    () => (shouldPrepareMemoryUi && activeMemoryVerse ? buildMemoryPracticeText(activeMemoryVerse) : ""),
    [activeMemoryVerse, shouldPrepareMemoryUi]
  );
  const memoryPracticeTokens = useMemo(
    () => (shouldPrepareMemoryUi && memoryPracticeText ? buildMemoryPracticeTokens(memoryPracticeText, memoryPracticeLevel, memoryStepTwoOffset) : []),
    [memoryPracticeLevel, memoryPracticeText, memoryStepTwoOffset, shouldPrepareMemoryUi]
  );
  const memoryBlankTokens = memoryPracticeTokens.filter((token) => token.blank);
  const firstMemoryBlankIndex = memoryBlankTokens[0]?.index ?? -1;
  const memoryPracticeAllCorrect =
    memoryBlankTokens.length > 0 &&
    memoryBlankTokens.every((token) => normalizeMemoryAnswer(memoryPracticeAnswers[token.index] || "") === normalizeMemoryAnswer(token.answer));
  const layoutWidth = Platform.OS === "web" && !layoutReady ? 800 : width;
  const layoutHeight = Platform.OS === "web" && !layoutReady ? 844 : height;
  const compactLayout = layoutWidth < 900;
  const phoneLayout = layoutWidth < 760;
  const activeBibleReadingPlanDayWindow = activeBibleReadingPlan
    ? getBiblePlanDayWindow(activeBibleReadingPlan, activeBibleReadingPlanSelectedDay?.day || activeBibleReadingPlanToday?.day || 1)
    : null;
  const friendPanelSummary = !COMMUNITY_CIRCLES_ENABLED
    ? "Coming soon"
    : !isAuthenticated
      ? "Sign in to add friends"
      : acceptedCommunityFriends.length === 0 && pendingCommunityFriendInvites.length === 0
        ? "No friends yet"
        : `${acceptedCommunityFriends.length} friend${acceptedCommunityFriends.length === 1 ? "" : "s"}${pendingCommunityFriendInvites.length > 0 ? ` · ${pendingCommunityFriendInvites.length} pending` : ""}`;
  const circlePanelSummary = !COMMUNITY_CIRCLES_ENABLED
    ? "Coming soon"
    : !isAuthenticated
      ? "Sign in to join circles"
      : (communityCircles || []).length === 0
        ? "No circles yet"
        : `${(communityCircles || []).length} circle${(communityCircles || []).length === 1 ? "" : "s"}`;
  const showFriendsConnectionPanel = !phoneLayout || mobileFriendsPanelOpen;
  const showCircleConnectionPanel = !phoneLayout || mobileCirclesPanelOpen;
  const accountDarkMode = DARK_MODE_ENABLED && appearanceMode === "dark";
  const homeDarkMode = accountDarkMode;
  const helpDarkMode = accountDarkMode;
  const studyDarkMode = accountDarkMode;
  const bibleDarkMode = accountDarkMode;
  const plansDarkMode = accountDarkMode;
  const methodsDarkMode = accountDarkMode;
  const memoryDarkMode = accountDarkMode;
  const journalDarkMode = accountDarkMode;
  const communityDarkMode = accountDarkMode;
  const adminDarkMode = accountDarkMode;
  const phoneMemoryFocusMode = tab === "memory" && !!activeMemoryVerseId && (phoneLayout || activeMemoryReviewQueueCount > 0);
  const visibleMemorySections = shouldPrepareMemoryUi ? (memoryView === "history" ? [] : memoryView === "review" ? memoryQueueSections : memoryBrowseSections)
    .map((section) => ({
      ...section,
      verses: phoneMemoryFocusMode
        ? section.verses.filter((verse: any) => String(verse._id) === (activeMemoryVerseId || activeMemoryMeditationVerseId))
        : memoryView === "review"
          ? sortMemoryReviewVerses(section.verses, section.title, section.title === "Reviewed" ? reviewedMemoryReviewSort : dueMemoryReviewSort)
        : section.verses
    }))
    .filter((section) => section.verses.length > 0) : [];
  const currentBrowseMemoryVerses = shouldPrepareMemoryUi ? memoryBrowseSections.flatMap((section) => section.verses) : [];
  const currentBrowseReviewPreset = currentBrowseMemoryVerses.length
    ? currentBrowseMemoryVerses.every((verse: any) => reviewPresetForStoredRhythm(verse.reviewPreset, verse.reviewIntervalDays, verse.nextReviewAt) === reviewPresetForStoredRhythm(currentBrowseMemoryVerses[0].reviewPreset, currentBrowseMemoryVerses[0].reviewIntervalDays, currentBrowseMemoryVerses[0].nextReviewAt))
      ? reviewPresetForStoredRhythm(currentBrowseMemoryVerses[0].reviewPreset, currentBrowseMemoryVerses[0].reviewIntervalDays, currentBrowseMemoryVerses[0].nextReviewAt)
      : ""
    : "";
  function getMemoryPrintCandidateVerses(printSet: MemoryPrintSet) {
    const saved = memoryVerses || [];
    if (printSet === "due") return saved.filter((verse: any) => isMemoryVerseDue(verse));
    if (printSet === "reviewed") return saved.filter((verse: any) => !isMemoryVerseDue(verse));
    if (printSet === "collection") return memoryPrintCollectionFilter === "all" ? saved : saved.filter((verse: any) => getMemoryVerseCollections(verse).includes(memoryPrintCollectionFilter));
    if (printSet === "current") return memoryView === "browse" ? currentBrowseMemoryVerses : visibleMemorySections.flatMap((section) => section.verses);
    return saved;
  }
  const memoryPrintCandidateVerses = useMemo(() => getMemoryPrintCandidateVerses(memoryPrintSet), [currentBrowseMemoryVerses, memoryPrintCollectionFilter, memoryPrintSet, memoryVerses, memoryView, visibleMemorySections]);
  const memoryPrintVerses = useMemo(() => {
    const selectedIds = new Set(memoryPrintSelectedVerseIds);
    return memoryPrintCandidateVerses.filter((verse: any) => selectedIds.has(String(verse._id)));
  }, [memoryPrintCandidateVerses, memoryPrintSelectedVerseIds]);

  useEffect(() => {
    if (compactLayout && tab === "bible") setReaderNavCollapsed(true);
  }, [compactLayout, tab]);

  useEffect(() => {
    if (!activeMemoryVerseId || memoryPracticeLevel <= 1 || firstMemoryBlankIndex < 0) return;

    const timeout = setTimeout(() => {
      memoryBlankInputRefs.current[firstMemoryBlankIndex]?.focus();
      if (!phoneLayout) ensureMemoryBlankVisible(firstMemoryBlankIndex);
    }, 120);

    return () => clearTimeout(timeout);
  }, [activeMemoryVerseId, firstMemoryBlankIndex, memoryPracticeFocusKey, memoryPracticeLevel, phoneLayout]);

  useEffect(() => () => {
    if (memoryBlankVisibilityTimerRef.current) clearTimeout(memoryBlankVisibilityTimerRef.current);
    memoryBlankVisibilityTimerRef.current = null;
  }, [activeMemoryVerseId, memoryPracticeLevel, tab]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    if (tab !== "memory" || !activeMemoryVerseId || memoryPracticeLevel <= 1 || !memoryPracticeAllCorrect) return;

    const handleMemoryPracticeEnter = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.repeat || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      event.preventDefault();
      continueMemoryPractice();
    };

    window.addEventListener("keydown", handleMemoryPracticeEnter);
    return () => window.removeEventListener("keydown", handleMemoryPracticeEnter);
  }, [activeMemoryVerseId, memoryPracticeAllCorrect, memoryPracticeLevel, tab]);

  function scrollMemoryPracticeBy(delta: number, animated = true) {
    if (!phoneLayout || tab !== "memory" || !activeMemoryVerseId || memoryPracticeLevel <= 1) return;
    appScrollRef.current?.scrollTo?.({ y: Math.max(0, appScrollYRef.current + delta), animated });
  }

  function scrollMemoryToTop(delay = 120) {
    if (tab !== "memory") return;
    setTimeout(() => appScrollRef.current?.scrollTo?.({ y: 0, animated: true }), delay);
  }

  function scrollBiblePlanDayPickerIntoView(planId: string, day = 1, animated = true, delay = 80, firstVisibleDay = 1) {
    if (tab !== "plans" || !planId || day < 1) return;
    setTimeout(() => {
      const picker = biblePlanDayPickerRefs.current[planId];
      if (!picker?.scrollTo) return;
      const tileWidth = phoneLayout ? 74 : 72;
      const gap = 8;
      const estimatedVisibleWidth = Math.max(
        phoneLayout ? 260 : 360,
        Math.min(phoneLayout ? layoutWidth - 48 : layoutWidth - 420, phoneLayout ? 520 : 760)
      );
      const tileStart = Math.max(0, day - firstVisibleDay) * (tileWidth + gap);
      const x = Math.max(0, tileStart - estimatedVisibleWidth * 0.42);
      picker.scrollTo({ x, y: 0, animated });
    }, delay);
  }

  function ensureMemoryBlankVisible(index: number, delay = 520) {
    if (!phoneLayout || tab !== "memory" || !activeMemoryVerseId || memoryPracticeLevel <= 1) return;
    if (memoryBlankVisibilityTimerRef.current) clearTimeout(memoryBlankVisibilityTimerRef.current);
    memoryBlankVisibilityTimerRef.current = setTimeout(() => {
      memoryBlankVisibilityTimerRef.current = null;
      const input = memoryBlankInputRefs.current[index] as any;
      if (!input?.measureInWindow) {
        return;
      }
      input.measureInWindow((_x: number, y: number, _width: number, inputHeight: number) => {
        const visualViewportHeight =
          Platform.OS === "web" && typeof window !== "undefined" && (window as any).visualViewport?.height
            ? Number((window as any).visualViewport.height)
            : 0;
        const keyboardSafeBottom =
          visualViewportHeight > 0 && visualViewportHeight < layoutHeight - 80
            ? visualViewportHeight - 24
            : layoutHeight - Math.min(320, Math.max(210, layoutHeight * 0.34));
        const inputBottom = y + inputHeight;
        const hiddenAmount = inputBottom - keyboardSafeBottom;
        if (hiddenAmount > 8) {
          scrollMemoryPracticeBy(Math.min(64, hiddenAmount + 8), false);
        }
      });
    }, delay);
  }

  function focusMemoryBlankWithRowCheck(currentIndex: number, nextIndex: number) {
    const currentInput = memoryBlankInputRefs.current[currentIndex] as any;
    const nextInput = memoryBlankInputRefs.current[nextIndex] as any;

    const focusNext = (crossesRow: boolean) => {
      nextInput?.focus?.();
      if (phoneLayout) {
        if (memoryBlankVisibilityTimerRef.current) clearTimeout(memoryBlankVisibilityTimerRef.current);
        memoryBlankVisibilityTimerRef.current = null;
        if (crossesRow) ensureMemoryBlankVisible(nextIndex, 360);
        return;
      }
      ensureMemoryBlankVisible(nextIndex, 180);
    };

    if (!phoneLayout || !currentInput?.measureInWindow || !nextInput?.measureInWindow) {
      focusNext(true);
      return;
    }

    currentInput.measureInWindow((_currentX: number, currentY: number) => {
      nextInput.measureInWindow((_nextX: number, nextY: number) => {
        focusNext(Math.abs(nextY - currentY) > 8);
      });
    });
  }

  useEffect(() => {
    if (!bibleSearchBook) return;
    const options = buildBibleSearchBookOptions(bibleSearchScope);
    if (!options.includes(bibleSearchBook)) setRememberedBibleSearchBook("");
  }, [bibleSearchBook, bibleSearchScope]);

  useEffect(() => {
    if (!phoneLayout || !readerNavCollapsed) return;
    setExpandedMobileReaderBook("");
  }, [phoneLayout, readerNavCollapsed]);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName || "Bible student");
    setAccountEmail(profile.authEmail || "");
    setWeeklyGoal(profile.weeklyGoal || "");
    setPartner(profile.accountabilityPartner || "");
    setMemoryMilestoneGoalIds(
      Array.isArray((profile as any).memoryMilestoneGoalIds)
        ? normalizeMemoryMilestoneIds((profile as any).memoryMilestoneGoalIds, false)
        : DEFAULT_MEMORY_MILESTONE_IDS
    );
    setCollapsedStudyPanels((current) => ({
      community: uiBoolean(profileUiPreferences, "studyPanelCommunityCollapsed") ?? current.community,
      plan: uiBoolean(profileUiPreferences, "studyPanelPlanCollapsed") ?? current.plan,
      feedback: uiBoolean(profileUiPreferences, "studyPanelFeedbackCollapsed") ?? current.feedback,
      helps: uiBoolean(profileUiPreferences, "studyPanelHelpsCollapsed") ?? current.helps
    }));
    const syncedDueSort = uiMemoryReviewSort(profileUiPreferences, "memoryDueSort");
    const syncedReviewedSort = uiMemoryReviewSort(profileUiPreferences, "memoryReviewedSort");
    const syncedMemoryView = uiMemoryView(profileUiPreferences);
    const syncedMemoryStatusFilter = uiMemoryBrowseStatusFilter(profileUiPreferences);
    const syncedMemoryBookFilter = uiMemoryBookFilter(profileUiPreferences);
    const syncedMemoryChapterFilter = uiMemoryChapterFilter(profileUiPreferences);
    const syncedMemoryCollectionFilter = uiMemoryCollectionFilter(profileUiPreferences);
    const syncedPlanOpenSections = uiPlanOpenSections(profileUiPreferences);
    const syncedPlanExpandedPlanId = uiPlanExpandedPlanId(profileUiPreferences);
    const syncedPlanSelectedDay = uiPlanSelectedDay(profileUiPreferences);
    const syncedJournalView = uiJournalView(profileUiPreferences);
    const syncedJournalFilter = uiJournalFilter(profileUiPreferences);
    const syncedJournalExpandedScriptureBook = uiJournalExpandedScriptureBook(profileUiPreferences);
    const syncedJournalSelectedScripture = uiJournalSelectedScripture(profileUiPreferences);
    const syncedAccountLegalSection = uiAccountLegalSection(profileUiPreferences);
    const syncedPrintWorksheetMethodId = uiPrintWorksheetMethodId(profileUiPreferences);
    const syncedPrintWorksheetWritingSpace = uiPrintWorksheetWritingSpace(profileUiPreferences);
    const syncedPrintWorksheetIncludes = uiPrintWorksheetIncludes(profileUiPreferences);
    const syncedMemoryPrintSet = uiMemoryPrintSet(profileUiPreferences);
    const syncedMemoryPrintLayout = uiMemoryPrintLayout(profileUiPreferences);
    const syncedMemoryPrintCopies = uiMemoryPrintCopies(profileUiPreferences);
    const syncedPinnedEntries = uiStringList(profileUiPreferences, "pinnedJournalEntryIds");
    const syncedWritingPrompts = uiStringList(profileUiPreferences, "customWritingPrompts");
    const syncedStudyMethodId = uiStudyMethodId(profileUiPreferences);
    const syncedStudyStepIndex = uiStudyStepIndex(profileUiPreferences, syncedStudyMethodId || methodId);
    const syncedBibleSearchScope = uiBibleSearchScope(profileUiPreferences);
    const syncedBibleSearchMode = uiBibleSearchMode(profileUiPreferences);
    const syncedBibleSearchBook = uiBibleSearchBook(profileUiPreferences);
    const syncedDevotionalTextSize = uiDevotionalTextSize(profileUiPreferences);
    if (syncedStudyMethodId) {
      const nextMethod = methods.find((item) => item.id === syncedStudyMethodId) || methods[0];
      setMethodId(nextMethod.id);
      setStepIndex(syncedStudyStepIndex ?? Math.min(stepIndex, nextMethod.steps.length - 1));
    } else if (syncedStudyStepIndex !== undefined) {
      setStepIndex(syncedStudyStepIndex);
    }
    if (uiBoolean(profileUiPreferences, "studyFocusMode") !== undefined) {
      const syncedFocusMode = uiBoolean(profileUiPreferences, "studyFocusMode")!;
      setStudyFocusMode(syncedFocusMode);
      saveStoredStudyFocusMode(syncedFocusMode).catch(() => undefined);
    }
    if (uiBoolean(profileUiPreferences, "studyInstructionsCollapsed") !== undefined) setInstructionsCollapsed(uiBoolean(profileUiPreferences, "studyInstructionsCollapsed")!);
    if (uiBoolean(profileUiPreferences, "studyCoachingVisible") !== undefined) setShowCoaching(uiBoolean(profileUiPreferences, "studyCoachingVisible")!);
    if (uiBoolean(profileUiPreferences, "bibleReaderNavCollapsed") !== undefined) setReaderNavCollapsed(uiBoolean(profileUiPreferences, "bibleReaderNavCollapsed")!);
    if (uiBoolean(profileUiPreferences, "bibleReaderHistoryCollapsed") !== undefined) setReaderHistoryCollapsed(uiBoolean(profileUiPreferences, "bibleReaderHistoryCollapsed")!);
    if (uiBoolean(profileUiPreferences, "bibleBookmarksCollapsed") !== undefined) setBookmarksCollapsed(uiBoolean(profileUiPreferences, "bibleBookmarksCollapsed")!);
    if (uiBoolean(profileUiPreferences, "bibleSearchCollapsed") !== undefined) setBibleSearchCollapsed(uiBoolean(profileUiPreferences, "bibleSearchCollapsed")!);
    if (syncedBibleSearchScope) setBibleSearchScope(syncedBibleSearchScope);
    if (syncedBibleSearchMode) setBibleSearchMode(syncedBibleSearchMode);
    if (syncedBibleSearchBook !== undefined) setBibleSearchBook(syncedBibleSearchBook);
    if (syncedDevotionalTextSize) {
      setDevotionalTextSize(syncedDevotionalTextSize);
      saveStoredDevotionalTextSize(syncedDevotionalTextSize).catch(() => undefined);
    }
    if (uiBoolean(profileUiPreferences, "bibleSearchCriteriaOpen") !== undefined) setBibleSearchCriteriaOpen(uiBoolean(profileUiPreferences, "bibleSearchCriteriaOpen")!);
    if (uiBoolean(profileUiPreferences, "communityPeoplePanelCollapsed") !== undefined) setPeoplePanelCollapsed(uiBoolean(profileUiPreferences, "communityPeoplePanelCollapsed")!);
    if (uiBoolean(profileUiPreferences, "communityFriendsPanelOpen") !== undefined) setMobileFriendsPanelOpen(uiBoolean(profileUiPreferences, "communityFriendsPanelOpen")!);
    if (uiBoolean(profileUiPreferences, "communityCirclesPanelOpen") !== undefined) setMobileCirclesPanelOpen(uiBoolean(profileUiPreferences, "communityCirclesPanelOpen")!);
    if (uiBoolean(profileUiPreferences, "communityFriendToolsOpen") !== undefined) setFriendToolsOpen(uiBoolean(profileUiPreferences, "communityFriendToolsOpen")!);
    if (uiBoolean(profileUiPreferences, "communityCircleToolsOpen") !== undefined) setCircleManagerOpen(uiBoolean(profileUiPreferences, "communityCircleToolsOpen")!);
    if (uiBoolean(profileUiPreferences, "communityRecentExpanded") !== undefined) setRecentCheckinsExpanded(uiBoolean(profileUiPreferences, "communityRecentExpanded")!);
    if (syncedDueSort) {
      setDueMemoryReviewSort(syncedDueSort);
      saveStoredMemoryReviewSorts({ due: syncedDueSort, reviewed: syncedReviewedSort || reviewedMemoryReviewSort }).catch(() => undefined);
    }
    if (syncedReviewedSort) {
      setReviewedMemoryReviewSort(syncedReviewedSort);
      saveStoredMemoryReviewSorts({ due: syncedDueSort || dueMemoryReviewSort, reviewed: syncedReviewedSort }).catch(() => undefined);
    }
    if (syncedMemoryView) setMemoryView(syncedMemoryView);
    if (uiBoolean(profileUiPreferences, "memoryBrowseFiltersOpen") !== undefined) setMemoryBrowseFiltersOpen(uiBoolean(profileUiPreferences, "memoryBrowseFiltersOpen")!);
    if (syncedMemoryStatusFilter) setMemoryBrowseStatusFilter(syncedMemoryStatusFilter);
    if (syncedMemoryBookFilter) setMemoryBookFilter(syncedMemoryBookFilter);
    if (syncedMemoryChapterFilter) setMemoryChapterFilter(syncedMemoryChapterFilter);
    if (syncedMemoryCollectionFilter) setMemoryCollectionFilter(syncedMemoryCollectionFilter);
    if (syncedPlanOpenSections) {
      setOpenBiblePlanSections({
        ...DEFAULT_OPEN_BIBLE_PLAN_SECTIONS,
        custom: syncedPlanOpenSections.includes("custom"),
        short: syncedPlanOpenSections.includes("short"),
        medium: syncedPlanOpenSections.includes("medium"),
        long: syncedPlanOpenSections.includes("long")
      });
    }
    if (syncedPlanExpandedPlanId !== undefined) setExpandedBiblePlanId(syncedPlanExpandedPlanId);
    if (uiBoolean(profileUiPreferences, "plansCompletedOpen") !== undefined) setCompletedBiblePlansOpen(uiBoolean(profileUiPreferences, "plansCompletedOpen")!);
    if (syncedPlanSelectedDay) {
      setActiveBiblePlanSelectedPlanId(syncedPlanSelectedDay.planId);
      setActiveBiblePlanSelectedDay(syncedPlanSelectedDay.day);
    }
    if (syncedJournalView) setJournalView(syncedJournalView);
    if (syncedJournalFilter) setJournalFilter(syncedJournalFilter);
    if (uiBoolean(profileUiPreferences, "journalFiltersOpen") !== undefined) setJournalFiltersOpen(uiBoolean(profileUiPreferences, "journalFiltersOpen")!);
    if (syncedJournalExpandedScriptureBook !== undefined) setExpandedJournalScriptureBook(syncedJournalExpandedScriptureBook);
    if (syncedJournalSelectedScripture) {
      setSelectedJournalScriptureBook(syncedJournalSelectedScripture.book);
      setSelectedJournalScriptureChapter(syncedJournalSelectedScripture.chapter);
    }
    if (uiBoolean(profileUiPreferences, "accountPrivacyOpen") !== undefined) setAccountPrivacyOpen(uiBoolean(profileUiPreferences, "accountPrivacyOpen")!);
    if (syncedAccountLegalSection !== undefined) setOpenLegalSection(syncedAccountLegalSection);
    if (syncedPrintWorksheetMethodId) setPrintWorksheetMethodId(syncedPrintWorksheetMethodId);
    if (syncedPrintWorksheetWritingSpace) setPrintWorksheetWritingSpace(syncedPrintWorksheetWritingSpace);
    if (syncedPrintWorksheetIncludes) setPrintWorksheetIncludes(syncedPrintWorksheetIncludes);
    if (syncedMemoryPrintSet) setMemoryPrintSet(syncedMemoryPrintSet);
    if (syncedMemoryPrintLayout) setMemoryPrintLayout(syncedMemoryPrintLayout);
    if (syncedMemoryPrintCopies) setMemoryPrintCopies(syncedMemoryPrintCopies);
    if (uiBoolean(profileUiPreferences, "memoryPrintSafeMode") !== undefined) setMemoryPrintSafeMode(uiBoolean(profileUiPreferences, "memoryPrintSafeMode")!);
    if (syncedPinnedEntries) {
      setPinnedJournalEntryIds(syncedPinnedEntries);
      savePinnedJournalEntries(syncedPinnedEntries).catch(() => undefined);
    }
    if (syncedWritingPrompts) {
      const normalizedPrompts = normalizeCustomWritingPrompts(syncedWritingPrompts);
      setCustomWritingPrompts(normalizedPrompts);
      saveStoredCustomWritingPrompts(normalizedPrompts).catch(() => undefined);
    }
  }, [profile, profileUiPreferences]);

  useEffect(() => {
    if (!profileMatchesActiveState || !isAuthenticated || !profile || readerSyncError) return;
    if (!storedBibleReadingPlanProgressHydrated) return;
    const syncedReaderState = normalizeSyncedBibleReaderState(remoteBibleReaderState);
    if (!syncedReaderState) {
      const profileKey = String(activeProfileId || "");
      const localPlanProgress = storedBibleReadingPlanProgress || currentBibleReadingPlanProgress();
      if (appliedBibleReaderProfileIdRef.current !== profileKey && hasLocalBibleReaderState({ history: bibleReaderHistory, readChapters: readBibleChapters, bookmarks: bibleBookmarks, readingPlanProgress: localPlanProgress })) {
        appliedBibleReaderProfileIdRef.current = profileKey;
        persistBibleReaderState({ translation: bibleTranslation, position: { book: readerBook, chapter: readerChapter }, history: bibleReaderHistory, readChapters: readBibleChapters, bookmarks: bibleBookmarks, readingPlanProgress: localPlanProgress });
      }
      return;
    }

    const signature = JSON.stringify(syncedReaderState);
    const profileKey = String(activeProfileId || "");
    const pendingSignature = pendingBibleReaderStateSignatureRef.current;
    const pendingProfileId = pendingBibleReaderStateProfileIdRef.current;
    if (pendingSignature && pendingProfileId && pendingProfileId !== profileKey) {
      clearPendingBibleReaderStateSync();
    } else if (pendingSignature && pendingSignature !== signature) {
      return;
    } else if (pendingSignature === signature) {
      clearPendingBibleReaderStateSync(signature);
    }
    if (appliedBibleReaderStateSignatureRef.current === signature) return;
    appliedBibleReaderProfileIdRef.current = profileKey;
    appliedBibleReaderStateSignatureRef.current = signature;

    if (syncedReaderState.translation) {
      setBibleTranslation(syncedReaderState.translation);
      saveStoredBibleTranslation(syncedReaderState.translation).catch(() => undefined);
    }
    if (syncedReaderState.position && bibleBooks.includes(syncedReaderState.position.book)) {
      const chapterCount = BIBLE_CHAPTER_COUNTS[syncedReaderState.position.book] || 1;
      setReaderBook(syncedReaderState.position.book);
      setReaderChapter(Math.min(Math.max(syncedReaderState.position.chapter, 1), chapterCount));
    }
    if (syncedReaderState.history) {
      setBibleReaderHistory(syncedReaderState.history);
      saveStoredBibleReaderHistory(syncedReaderState.history).catch(() => undefined);
    }
    if (syncedReaderState.readChapters) {
      setReadBibleChapters(syncedReaderState.readChapters);
      saveStoredBibleReadChapters(syncedReaderState.readChapters).catch(() => undefined);
    }
    if (syncedReaderState.bookmarks) {
      setBibleBookmarks(syncedReaderState.bookmarks);
      saveStoredBibleBookmarks(syncedReaderState.bookmarks).catch(() => undefined);
    }
    if (syncedReaderState.readingPlanProgress) {
      const progress = syncedReaderState.readingPlanProgress;
      setActiveBibleReadingPlanId(progress.activePlanId);
      setFollowedBibleReadingPlanIds(progress.followedPlanIds || (progress.activePlanId ? [progress.activePlanId] : []));
      setCompletedBibleReadingPlanDays(progress.completedDays);
      setCustomBibleReadingPlans(progress.customPlans);
      setBibleReadingPlanStartDates(progress.startDates || {});
      setBibleReadingPlanCompletionDates(progress.completedPlanDates || {});
      setBibleReadingPlanCompletionCounts(progress.completionCounts || {});
      setAcknowledgedBibleReadingCareNotes(progress.acknowledgedCareNotes || []);
      saveStoredBibleReadingPlanProgress(progress).catch(() => undefined);
      setStoredBibleReadingPlanProgress(progress);
    } else {
      const localProgress = storedBibleReadingPlanProgress || currentBibleReadingPlanProgress();
      if (hasBibleReadingPlanProgress(localProgress)) {
        persistBibleReaderState({ readingPlanProgress: localProgress });
      }
    }
  }, [activeProfileId, isAuthenticated, profile, profileMatchesActiveState, remoteBibleReaderState, storedBibleReadingPlanProgress, storedBibleReadingPlanProgressHydrated, readerSyncError, readerSyncAttempt]);

  useEffect(() => {
    if (profileAppearanceMode !== "light" && profileAppearanceMode !== "dark") return;
    setAppearanceMode((current) => {
      if (current === profileAppearanceMode) return current;
      saveStoredAppearanceMode(profileAppearanceMode).catch(() => undefined);
      return profileAppearanceMode;
    });
  }, [profileAppearanceMode]);

  useEffect(() => {
    if (savedDraft === undefined) return;
    if (studyPhase === "saved") return;

    const draftRevision = savedDraft ? ((savedDraft as any).updatedAt || 0) : 0;
    const recoveryDraft = activeProfileId ? readStudyRecoveryDraft(String(activeProfileId), currentStudyKey) : null;
    const sameStudyAlreadyLoaded = loadedDraftKey === currentStudyKey;
    if (sameStudyAlreadyLoaded && draftRevision > 0 && draftRevision <= loadedDraftRevisionRef.current) return;

    if (recoveryDraft && recoveryDraft.updatedAt > draftRevision) {
      isHydratingDraftRef.current = false;
      setAnswers(normalizeStudyAnswerMap(method.id, recoveryDraft.answers));
      setPassageMarkups(markupRecordsToMap(recoveryDraft.passageMarkups));
      setPassageMarkupNotes(markupRecordsToNoteMap(recoveryDraft.passageMarkups));
      setSkippedStudySteps(method.steps.reduce<Record<string, boolean>>((map, item) => {
        if (recoveryDraft.skippedStepIds.includes(item.id) || recoveryDraft.skippedStepTitles.includes(item.title)) map[studyStepKey(method.id, item.id)] = true;
        return map;
      }, {}));
      setSelectedVerseKeys([]);
      setStudyMethodState(recoveryDraft.methodState);
      setStepIndex(Math.min(recoveryDraft.stepIndex, Math.max(0, method.steps.length - 1)));
      setStudyPhase("study");
      loadedDraftRevisionRef.current = recoveryDraft.updatedAt;
      setLoadedDraftKey(currentStudyKey);
      setSaveStatus("Recovered unsaved work from this device. Saving when connected...");
      setShareNote(recoveryDraft.shareNote);
      return;
    }

    if (!savedDraft) {
      if (sameStudyAlreadyLoaded) return;
      loadedDraftRevisionRef.current = 0;
      isHydratingDraftRef.current = true;
      setAnswers({});
      setSkippedStudySteps({});
      setPassageMarkups({});
      setPassageMarkupNotes({});
      setSelectedVerseKeys([]);
      setStudyMethodState(normalizeStudyMethodState(null));
      setStepIndex(0);
      setStudyPhase("study");
      setLoadedDraftKey(currentStudyKey);
      setSaveStatus("Drafts save automatically once you begin writing.");
      setShareNote("");
      return;
    }

    const restoredAnswers = restoreStudyAnswers(savedDraft.methodId, savedDraft.answers);
    isHydratingDraftRef.current = true;
    setAnswers(restoredAnswers);
    setSkippedStudySteps(method.steps.reduce<Record<string, boolean>>((map, item) => {
      if ((savedDraft.skippedStepIds || []).includes(item.id) || (savedDraft.skippedStepTitles || []).includes(item.title)) map[studyStepKey(method.id, item.id)] = true;
      return map;
    }, {}));
    setPassageMarkups(markupRecordsToMap(savedDraft.passageMarkups || []));
    setPassageMarkupNotes(markupRecordsToNoteMap(savedDraft.passageMarkups || []));
    setSelectedVerseKeys([]);
    setStudyMethodState(normalizeStudyMethodState(savedDraft.methodState));
    setStepIndex(pickResumeStepIndex(savedDraft.answers, savedDraft.stepIndex, savedDraft.methodId));
    setStudyPhase("study");
    loadedDraftRevisionRef.current = draftRevision;
    setLoadedDraftKey(currentStudyKey);
    setSaveStatus(`Welcome back${firstName ? `, ${firstName}` : ""}. Your draft is restored.`);
    setShareNote(savedDraft.shareNote || "");
  }, [activeProfileId, currentStudyKey, firstName, loadedDraftKey, method, savedDraft]);

  useEffect(() => {
    setDetectedScriptureReference("");
    setDetectedScriptureTypedReference("");
    setScriptureInsertStatus("");
  }, [answerKey]);

  useEffect(() => {
    if (!contemplativeTimerRunning || contemplativeTimerSeconds <= 0) return;
    const interval = setInterval(() => {
      setContemplativeTimerSeconds((seconds) => {
        if (seconds <= 1) {
          setContemplativeTimerRunning(false);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [contemplativeTimerRunning, contemplativeTimerSeconds]);

  useEffect(() => {
    if (method.id === "lectio") return;
    setContemplativeTimerRunning(false);
    setContemplativeTimerOpen(false);
    setContemplativeTimerSeconds(0);
  }, [method.id]);

  useEffect(() => {
    if (tab !== "study") return;
    const requestId = ++studyPassageRequestIdRef.current;

    const trimmed = passage.trim();
    if (!trimmed) {
      setPassageText(null);
      setPassageStatus("Enter a passage to load the text.");
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setPassageStatus("Loading passage...");
      try {
        const data =
          bibleTranslation === "bsb"
            ? await fetchBsbPassage(trimmed, controller.signal)
            : await fetchBibleApiPassage(trimmed, bibleTranslation, controller.signal);

        if (studyPassageRequestIdRef.current !== requestId) return;
        setPassageText(data);
        setPassageStatus("");
      } catch (error) {
        if (controller.signal.aborted) return;
        if (studyPassageRequestIdRef.current !== requestId) return;
        setPassageText(null);
        setPassageStatus(
          bibleTranslation === "bsb"
            ? "I couldn't load that BSB passage. Try a chapter reference like John 3 or a same-chapter range like John 3:16-18."
            : `I couldn't load that ${bibleTranslation.toUpperCase()} passage. Try a format like John 3:16-18.`
        );
      }
    }, 450);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [passage, passageReloadKey, bibleTranslation, tab]);

  useEffect(() => {
    if (tab !== "study" || !studyTranslationComparisonOpen || !passageText) return;
    const controller = new AbortController();
    setStudyTranslationComparisonStatus("Loading public-domain translations...");
    Promise.allSettled(BIBLE_TRANSLATIONS.map((translation) =>
      translation.id === "bsb"
        ? fetchBsbPassage(passageText.reference || passage, controller.signal)
        : fetchBibleApiPassage(passageText.reference || passage, translation.id, controller.signal)
    )).then((results) => {
      if (controller.signal.aborted) return;
      const passages = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
      setStudyTranslationComparisons(passages);
      setStudyTranslationComparisonStatus(passages.length
        ? passages.length < BIBLE_TRANSLATIONS.length ? "Some translations could not be loaded." : ""
        : "Translations could not be loaded. Check your connection and try again.");
    });
    return () => controller.abort();
  }, [passage, passageText, studyTranslationComparisonOpen, tab]);

  useEffect(() => {
    if (!pendingStudyWorksheetPrint || tab !== "study" || !passageText?.verses?.length) return;
    setPendingStudyWorksheetPrint(false);
    setRememberedPrintWorksheetMethodId(method.id);
    setPrintWorksheetRequest({
      source: "study",
      reference: passageText.reference || passage,
      translation: shortBibleTranslationName(passageText.translation_name),
      verses: passageText.verses
    });
    setSaveStatus("Printable worksheet is ready to open.");
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const url = safeCurrentUrl();
      if (url?.searchParams.get("print") === "worksheet") {
        url.searchParams.delete("print");
        safeReplaceBrowserUrl(url);
      }
    }
  }, [method.id, passage, passageText, pendingStudyWorksheetPrint, tab]);

  useEffect(() => {
    setStudyContextOpen(false);
    setStudyContextPassage(null);
    setStudyContextStatus("");
    setSelectedStudyCrossReference(null);
    setStudyCrossReferencePassage(null);
    setStudyCrossReferenceStatus("");
  }, [studyPassageReference]);

  useEffect(() => {
    if (tab !== "study" || !studyContextOpen) return;
    const requestId = ++studyCrossReferenceListRequestIdRef.current;
    const initialReferences = getStudyCrossReferences(studyPassageReference);

    setStudyCrossReferences(initialReferences);
    setStudyCrossReferenceListStatus("Loading cross references...");

    loadStudyCrossReferences(studyPassageReference).then((references) => {
      if (studyCrossReferenceListRequestIdRef.current !== requestId) return;
      setStudyCrossReferences(references);
      setStudyCrossReferenceListStatus(
        references.some((item) => item.source === "crossreferences.org")
          ? "Cross references adapted from CrossReferences.org."
          : ""
      );
    }).catch(() => {
      if (studyCrossReferenceListRequestIdRef.current !== requestId) return;
      setStudyCrossReferences(initialReferences);
      setStudyCrossReferenceListStatus(initialReferences.length ? "" : "No cross references found for this passage yet.");
    });
  }, [studyContextOpen, studyPassageReference, tab]);

  useEffect(() => {
    if (tab !== "study" || !studyContextOpen || !studyContextReference?.reference) return;
    const requestId = ++studyContextRequestIdRef.current;
    const controller = new AbortController();

    setStudyContextStatus("Loading surrounding verses...");
    setStudyContextPassage(null);

    const timeout = setTimeout(async () => {
      try {
        const data =
          bibleTranslation === "bsb"
            ? await fetchBsbPassage(studyContextReference.reference, controller.signal)
            : await fetchBibleApiPassage(studyContextReference.reference, bibleTranslation, controller.signal);

        if (studyContextRequestIdRef.current !== requestId) return;
        setStudyContextPassage(data);
        setStudyContextStatus("");
      } catch (error) {
        if (controller.signal.aborted) return;
        if (studyContextRequestIdRef.current !== requestId) return;
        setStudyContextPassage(null);
        setStudyContextStatus("I couldn't load the surrounding verses just now.");
      }
    }, 150);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [bibleTranslation, studyContextOpen, studyContextReference?.reference, tab]);

  useEffect(() => {
    if (tab !== "study" || !selectedStudyCrossReference?.reference) return;
    const requestId = ++studyCrossReferenceRequestIdRef.current;
    const controller = new AbortController();

    setStudyCrossReferenceStatus("Loading cross reference...");
    setStudyCrossReferencePassage(null);

    const timeout = setTimeout(async () => {
      try {
        const data =
          bibleTranslation === "bsb"
            ? await fetchBsbPassage(selectedStudyCrossReference.reference, controller.signal)
            : await fetchBibleApiPassage(selectedStudyCrossReference.reference, bibleTranslation, controller.signal);

        if (studyCrossReferenceRequestIdRef.current !== requestId) return;
        setStudyCrossReferencePassage(data);
        setStudyCrossReferenceStatus("");
      } catch (error) {
        if (controller.signal.aborted) return;
        if (studyCrossReferenceRequestIdRef.current !== requestId) return;
        setStudyCrossReferencePassage(null);
        setStudyCrossReferenceStatus("I couldn't load that cross reference just now.");
      }
    }, 150);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [bibleTranslation, selectedStudyCrossReference?.reference, tab]);

  useEffect(() => {
    if (tab !== "bible") return;
    const requestId = ++readerPassageRequestIdRef.current;

    const controller = new AbortController();
    const { mode, reference } = readerLoadRequest;
    setReaderStatus(mode === "plan" ? "Loading plan reading..." : "Loading chapter...");
    setReaderPassage(null);

    const timeout = setTimeout(async () => {
      try {
        const data =
          mode === "plan"
            ? await fetchBiblePlanReadingPassage(reference, bibleTranslation, controller.signal)
            : bibleTranslation === "bsb"
            ? await fetchBsbPassage(reference, controller.signal)
            : await fetchBibleApiPassage(reference, bibleTranslation, controller.signal);
        if (readerPassageRequestIdRef.current !== requestId) return;
        setReaderPassage(data);
        setReaderStatus("");
      } catch {
        if (controller.signal.aborted) return;
        if (readerPassageRequestIdRef.current !== requestId) return;
        setReaderStatus(mode === "plan" ? "I couldn't load that plan reading. Exit plan reading or try again." : "I couldn't load that chapter. Try again or choose another chapter.");
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [readerLoadRequest.mode, readerLoadRequest.reference, bibleTranslation, tab]);

  useEffect(() => {
    setActiveBookmarkNoteId("");
    setBookmarkNoteDraft("");
    setReaderMemoryStatus("");
    if (pendingReaderFocusVerse) return;
    setSelectedReaderVerses([]);
    setReaderActionVerse(0);
  }, [readerBook, readerChapter]);

  useEffect(() => {
    setReaderChapterDraft(String(readerChapter));
  }, [readerBook, readerChapter]);

  useEffect(() => {
    if (!bibleBooks.includes(readerBook)) return;
    saveStoredBibleReaderPosition({ book: readerBook, chapter: readerChapter }).catch(() => undefined);
    setBibleReaderHistory((current) => {
      const reference = buildReaderStudyReference(readerBook, readerChapter, []);
      const position = { book: readerBook, chapter: readerChapter };
      const nextItem: StoredBibleReaderHistoryItem = {
        book: readerBook,
        chapter: readerChapter,
        reference,
        translation: bibleTranslation,
        updatedAt: new Date().toISOString()
      };
      const next = [
        nextItem,
        ...current.filter((item) => !(item.book === readerBook && item.chapter === readerChapter))
      ].slice(0, 8);
      saveStoredBibleReaderHistory(next).catch(() => undefined);
      persistBibleReaderState({ position, history: next, translation: bibleTranslation });
      return next;
    });
  }, [activeProfileId, bibleTranslation, isAuthenticated, profileMatchesActiveState, readerBook, readerChapter]);

  useEffect(() => {
    if (profileUiPreferences.studyInstructionsCollapsed === undefined) setInstructionsCollapsed(false);
  }, [method.id, profileUiPreferences.studyInstructionsCollapsed, stepIndex]);

  useEffect(() => {
    if (selectedVerseKeys.length === 0) return;
    const visibleVerseKeys = new Set((passageText?.verses || []).map(verseMarkupKey));
    const nextSelectedVerseKeys = selectedVerseKeys.filter((key) => visibleVerseKeys.has(key));
    if (nextSelectedVerseKeys.length !== selectedVerseKeys.length) setSelectedVerseKeys(nextSelectedVerseKeys);
  }, [passageText?.verses, selectedVerseKeys]);

  useEffect(() => {
    if (loadedDraftKey !== currentStudyKey || suppressStudyDraftSaveRef.current) return;
    if (isHydratingDraftRef.current) {
      isHydratingDraftRef.current = false;
      return;
    }
    if (!hasStudyContent) return;

    const recoveryUpdatedAt = Date.now();
    if (activeProfileId) {
      saveStudyRecoveryDraft({
        version: 1,
        profileId: String(activeProfileId),
        studyKey: currentStudyKey,
        passage: passage.trim() || "Selected passage",
        methodId: method.id,
        stepIndex,
        answers,
        passageMarkups: passageMarkupRecords,
        shareNote,
        skippedStepTitles,
        skippedStepIds,
        methodState: studyMethodState,
        updatedAt: recoveryUpdatedAt
      }).catch(() => setSaveStatus("Device storage is unavailable. Keep this screen open until your draft syncs."));
    }

    setSaveStatus(activeProfileId ? "Saving draft..." : "Changes are kept on this screen until saving reconnects.");
    const timeout = setTimeout(() => {
      studyDraftSaveTimerRef.current = null;
      void saveCurrentStudyDraft(recoveryUpdatedAt);
    }, 650);
    studyDraftSaveTimerRef.current = timeout;

    return () => {
      clearTimeout(timeout);
      if (studyDraftSaveTimerRef.current === timeout) studyDraftSaveTimerRef.current = null;
    };
  }, [answers, currentStudyKey, hasStudyContent, loadedDraftKey, method.id, passage, passageMarkupRecords, passageText, shareNote, skippedStepIds, skippedStepTitles, activeProfileId, stepIndex, studyMethodState]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const shouldWarn = hasStudyContent && (
      isSavingStudyDraft ||
      saveStatus === "Saving draft..." ||
      saveStatus.startsWith("Could not sync") ||
      saveStatus.startsWith("Changes are kept")
    );
    if (!shouldWarn) return;

    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [hasStudyContent, isSavingStudyDraft, saveStatus]);

  async function saveCurrentStudyDraft(recoveryUpdatedAt = Date.now()) {
    if (!hasStudyContent) return true;

    const recoveryDraft: StudyRecoveryDraft | null = activeProfileId
      ? {
          version: 1,
          profileId: String(activeProfileId),
          studyKey: currentStudyKey,
          passage: passage.trim() || "Selected passage",
          methodId: method.id,
          stepIndex,
          answers,
          passageMarkups: passageMarkupRecords,
          shareNote,
          skippedStepTitles,
          skippedStepIds,
          methodState: studyMethodState,
          updatedAt: recoveryUpdatedAt
        }
      : null;
    const recoveryPersisted = recoveryDraft ? await saveStudyRecoveryDraft(recoveryDraft).then(() => true, () => false) : false;

    if (!activeProfileId) {
      setSaveStatus("Changes are kept on this screen until saving reconnects.");
      return false;
    }

    setIsSavingStudyDraft(true);
    setSaveStatus("Saving draft...");
    const savePromise = saveDraft({
      profileId: activeProfileId,
      passage: passage.trim() || "Selected passage",
      passageReference: passageText?.reference,
      passageText: passageText?.text,
      translationName: passageText?.translation_name,
      passageMarkups: passageMarkupRecords,
      methodId: method.id,
      methodName: method.name,
      shareNote: shareNote.trim() || undefined,
      skippedStepTitles: skippedStepTitles.length ? skippedStepTitles : undefined,
      skippedStepIds: skippedStepIds.length ? skippedStepIds : undefined,
      methodState: hasStudyMethodState ? studyMethodState : undefined,
      stepIndex,
      answers: sessionAnswers
    });
    studyDraftSavePromiseRef.current = savePromise;

    try {
      await savePromise;
      loadedDraftRevisionRef.current = Date.now();
      clearStudyRecoveryDraft(String(activeProfileId), currentStudyKey, recoveryUpdatedAt);
      const newerRecovery = readStudyRecoveryDraft(String(activeProfileId), currentStudyKey);
      if (!newerRecovery || newerRecovery.updatedAt <= recoveryUpdatedAt) {
        setSaveStatus(`Draft saved at ${formatStudySavedTime(recoveryUpdatedAt)}`);
      }
      return true;
    } catch {
      setSaveStatus(recoveryPersisted
        ? "Could not sync yet. Your latest changes are saved on this device; retry when connected."
        : "Could not sync or save on this device. Keep this screen open and retry when connected.");
      return false;
    } finally {
      if (studyDraftSavePromiseRef.current === savePromise) {
        studyDraftSavePromiseRef.current = null;
        setIsSavingStudyDraft(false);
      }
    }
  }

  async function completeSession() {
    if (isCompletingStudy) return;
    if (!hasStudyWork) {
      const firstWritingStepIndex = method.steps.findIndex((item) => item.responseType === "text");
      if (firstWritingStepIndex >= 0) goToStudyStep(firstWritingStepIndex);
      setSaveStatus("Complete at least one written response before saving this study.");
      return;
    }
    if (!activeProfileId) {
      setSaveStatus("Profile is still loading. Try again in a moment.");
      return;
    }

    suppressStudyDraftSaveRef.current = true;
    setIsCompletingStudy(true);
    if (studyDraftSaveTimerRef.current) clearTimeout(studyDraftSaveTimerRef.current);
    studyDraftSaveTimerRef.current = null;
    if (studyDraftSavePromiseRef.current) await studyDraftSavePromiseRef.current.catch(() => undefined);

    const finalShareNote = shareNote.trim();
    setSaveStatus("Saving completed study...");
    let savedSessionId: any = null;

    try {
      savedSessionId = await saveSession({
        profileId: activeProfileId,
        localDayKey: localDateKey(),
        passage,
        methodId: method.id,
        methodName: method.name,
        shareNote: finalShareNote || undefined,
        skippedStepTitles: skippedStepTitles.length ? skippedStepTitles : undefined,
        skippedStepIds: skippedStepIds.length ? skippedStepIds : undefined,
        methodState: hasStudyMethodState ? studyMethodState : undefined,
        passageMarkups: passageMarkupRecords,
        minutes: Math.max(5, sessionAnswers.filter((item) => item.answer.trim()).length * 6),
        answers: sessionAnswers
      });
    } catch {
      suppressStudyDraftSaveRef.current = false;
      setIsCompletingStudy(false);
      setSaveStatus("We could not save your study. Your writing is still here—check your connection and try again.");
      return;
    }

    let readActionReviewAt: number | undefined;
    let readActionReviewFailed = false;
    if (method.id === "read" && studyMethodState.reviewReadActionTomorrow) {
      try {
        readActionReviewAt = await scheduleStudyReviewMutation({
          profileId: activeProfileId,
          sessionId: savedSessionId,
          preset: "tomorrow"
        });
      } catch {
        readActionReviewFailed = true;
      }
    }

    setSavedStudySummary({
      sessionId: savedSessionId,
      passage: passageText?.reference || passage,
      methodName: method.name,
      highlightCount: passageMarkupRecords.length,
      shareNote: finalShareNote,
      reviewAt: readActionReviewAt,
      readActionReviewRequested: method.id === "read" && studyMethodState.reviewReadActionTomorrow
    });
    setAnswers((current) => {
      const nextAnswers = { ...current };
      method.steps.forEach((item) => delete nextAnswers[studyStepKey(method.id, item.id)]);
      return nextAnswers;
    });
    setSkippedStudySteps({});
    setRememberedStudyStepIndex(0);
    setShareNote("");
    setPassageMarkups({});
    setPassageMarkupNotes({});
    setSelectedVerseKeys([]);
    setStudyMethodState(normalizeStudyMethodState(null));
    setStudyPhase("saved");
    setReviewLaterPanelOpen(readActionReviewFailed);
    setLoadedDraftKey(currentStudyKey);
    clearStudyRecoveryDraft(String(activeProfileId), currentStudyKey);
    suppressStudyDraftSaveRef.current = false;
    setIsCompletingStudy(false);
    setSaveStatus(readActionReviewFailed
      ? "Study saved, but the action review could not be scheduled. You can choose a review time below."
      : `Completed and saved${firstName ? `, ${firstName}` : ""}`);
    trackUsage("study_completed", { reference: passageText?.reference || passage, methodId: method.id, methodName: method.name, translation: passageText?.translation_name, tab: "study" });
    trackPublicAnalytics({ eventType: "study_completed", source: "study", ctaTarget: "/?tab=study", methodId: method.id });
    setCheckinNote(finalShareNote);
    scrollStudyStepIntoView();
  }

  function resumeDraft(draft: any) {
    resumeStudy({
      passage: draft.passage,
      methodId: draft.methodId,
      stepIndex: draft.stepIndex,
      answers: draft.answers,
      passageMarkups: draft.passageMarkups,
      shareNote: draft.shareNote,
      skippedStepTitles: draft.skippedStepTitles,
      skippedStepIds: draft.skippedStepIds,
      methodState: draft.methodState,
      status: "Restored saved draft"
    });
  }

  function resumeSession(session: any) {
    if (isMemoryMeditationEntry(session)) {
      openMemoryMeditationFromJournal(session);
      return;
    }

    const firstAnsweredStep = Math.max(
      0,
      session.answers.findIndex((item: any) => item.answer.trim())
    );
    resumeStudy({
      passage: session.passage,
      methodId: session.methodId,
      stepIndex: firstAnsweredStep,
      answers: session.answers,
      passageMarkups: session.passageMarkups,
      shareNote: session.shareNote,
      skippedStepTitles: session.skippedStepTitles,
      skippedStepIds: session.skippedStepIds,
      methodState: session.methodState,
      status: "Loaded past study notes"
    });
  }

  function openMemoryMeditationFromJournal(entry: any) {
    const matchingVerse = (memoryVerses || []).find((verse: any) => normalizeMemoryAnswer(verse.reference) === normalizeMemoryAnswer(entry.passage));
    if (matchingVerse) {
      startMemoryMeditation(matchingVerse);
      setMemoryStatus(`Reopened ${matchingVerse.reference} for meditation.`);
      return;
    }

    setRememberedMemoryView("browse");
    setMemorySearch(entry.passage || "");
    setTab("memory");
    setMemoryStatus("Find this saved verse in Memory to meditate on it again.");
  }

  function resumeStudy({
    passage: nextPassage,
    methodId: nextMethodId,
    stepIndex: nextStepIndex,
    answers: nextAnswers,
    passageMarkups: nextPassageMarkups,
    shareNote: nextShareNote,
    skippedStepTitles: nextSkippedStepTitles,
    skippedStepIds: nextSkippedStepIds,
    methodState: nextMethodState,
    status
  }: {
    passage: string;
    methodId: string;
    stepIndex: number;
    answers: { stepId?: string; stepTitle: string; answer: string }[];
    passageMarkups?: PassageMarkupRecord[];
    shareNote?: string;
    skippedStepTitles?: string[];
    skippedStepIds?: string[];
    methodState?: unknown;
    status: string;
  }) {
    const restoredAnswers = restoreStudyAnswers(nextMethodId, nextAnswers);
    const resumeStepIndex = pickResumeStepIndex(nextAnswers, nextStepIndex, nextMethodId);

    setPassage(nextPassage);
    setRememberedStudyMethod(nextMethodId, resumeStepIndex);
    setStudyPhase("study");
    setSavedStudySummary(null);
    setAnswers(restoredAnswers);
    const nextMethod = methods.find((item) => item.id === nextMethodId) || methods[0];
    setSkippedStudySteps(nextMethod.steps.reduce<Record<string, boolean>>((map, item) => {
      if ((nextSkippedStepIds || []).includes(item.id) || (nextSkippedStepTitles || []).includes(item.title)) map[studyStepKey(nextMethodId, item.id)] = true;
      return map;
    }, {}));
    setPassageMarkups(markupRecordsToMap(nextPassageMarkups || []));
    setPassageMarkupNotes(markupRecordsToNoteMap(nextPassageMarkups || []));
    setSelectedVerseKeys([]);
    setStudyMethodState(normalizeStudyMethodState(nextMethodState));
    setMethodExampleModeId("");
    setLoadedDraftKey(studyKey(nextPassage, nextMethodId));
    setSaveStatus(status);
    setShareNote(nextShareNote || "");
    setTab("study");
  }

  function continueStudy() {
    if (step.responseType === "text" && !answers[answerKey]?.trim()) {
      setSaveStatus("Write a response, or choose Skip for now.");
      return;
    }
    setSkippedStudySteps((current) => ({ ...current, [answerKey]: false }));
    if (stepIndex < method.steps.length - 1) {
      goToStudyStep(stepIndex + 1);
    } else {
      setStudyPhase("review");
      scrollStudyStepIntoView();
    }
  }

  function skipCurrentStudyStep() {
    if (step.responseType !== "text" || answers[answerKey]?.trim()) return;
    setSkippedStudySteps((current) => ({ ...current, [answerKey]: true }));
    if (stepIndex === method.steps.length - 1 && !hasStudyWork) {
      const firstWritingStepIndex = method.steps.findIndex((item) => item.responseType === "text");
      if (firstWritingStepIndex >= 0) goToStudyStep(firstWritingStepIndex);
      setSaveStatus("A completed study needs at least one written response. Add a response before reviewing and saving.");
      return;
    }
    setSaveStatus(`${step.title} skipped for now. You can return before saving.`);
    if (stepIndex < method.steps.length - 1) {
      goToStudyStep(stepIndex + 1);
    } else {
      setStudyPhase("review");
      scrollStudyStepIntoView();
    }
  }

  function goToStudyStep(nextStepIndex: number) {
    setStudyPhase("study");
    setRememberedStudyStepIndex(nextStepIndex);
    scrollStudyStepIntoView();
  }

  function scrollStudyStepIntoView() {
    const topPadding = phoneLayout ? 74 : 18;
    setTimeout(() => appScrollRef.current?.scrollTo?.({ y: Math.max(0, studyStepAnchorY - topPadding), animated: true }), 80);
  }

  function openSavedHighlights() {
    setRememberedJournalFilter("highlights");
    setTab("journal");
  }

  function resetPassageMarkup() {
    setPassageMarkups({});
    setPassageMarkupNotes({});
    setSelectedVerseKeys([]);
  }

  function requestStudyTransition(description: string, action: () => void) {
    if (!hasStudyContent || studyPhase === "saved") {
      action();
      return;
    }
    pendingStudyTransitionActionRef.current = action;
    setPendingStudyTransition({ description });
  }

  function runPendingStudyTransition() {
    const action = pendingStudyTransitionActionRef.current;
    pendingStudyTransitionActionRef.current = null;
    setPendingStudyTransition(null);
    action?.();
  }

  function cancelPendingStudyTransition() {
    pendingStudyTransitionActionRef.current = null;
    setPendingStudyTransition(null);
    setPassageQuery(passage);
  }

  async function keepDraftAndContinueStudyTransition() {
    if (studyDraftSaveTimerRef.current) clearTimeout(studyDraftSaveTimerRef.current);
    studyDraftSaveTimerRef.current = null;
    const saved = await saveCurrentStudyDraft();
    if (saved) runPendingStudyTransition();
  }

  async function discardAndContinueStudyTransition() {
    suppressStudyDraftSaveRef.current = true;
    if (studyDraftSaveTimerRef.current) clearTimeout(studyDraftSaveTimerRef.current);
    studyDraftSaveTimerRef.current = null;
    const pendingSave = studyDraftSavePromiseRef.current;
    const pendingDraftId = pendingSave ? await pendingSave.catch(() => null) : null;
    const draftId = savedDraft?._id || pendingDraftId;
    if (activeProfileId && draftId) {
      await deleteDraftMutation({ profileId: activeProfileId, draftId: draftId as any }).catch(() => undefined);
    }
    if (activeProfileId) clearStudyRecoveryDraft(String(activeProfileId), currentStudyKey);
    runPendingStudyTransition();
    suppressStudyDraftSaveRef.current = false;
  }

  function clearStudyWorkspace() {
    setAnswers({});
    setSkippedStudySteps({});
    setShareNote("");
    setShareInsightPanelOpen(false);
    setReviewLaterPanelOpen(false);
    setStudyMethodState(normalizeStudyMethodState(null));
    setMethodExampleModeId("");
    resetPassageMarkup();
  }

  function switchMethod(nextMethodId: string) {
    if (nextMethodId === method.id) return;
    const nextMethod = methods.find((item) => item.id === nextMethodId) || methods[0];
    requestStudyTransition(`switch to ${nextMethod.name}`, () => {
      trackPublicAnalytics({ eventType: "method_selected", source: "study_method_switcher", ctaTarget: `/?tab=study&method=${nextMethodId}`, methodId: nextMethodId });
      setRememberedStudyMethod(nextMethodId, 0);
      setStudyPhase("study");
      setSavedStudySummary(null);
      clearStudyWorkspace();
      setLoadedDraftKey("");
      setSaveStatus("Drafts save automatically once you begin writing.");
    });
  }

  function startMethodExample(nextMethodId: string) {
    const nextMethod = methods.find((item) => item.id === nextMethodId) || methods[0];
    const examplePassage = nextMethod.detail?.examplePassage || buildPassagePresets(nextMethod.id)[0] || "Psalm 23";

    requestStudyTransition(`open the ${nextMethod.short} example`, () => {
      setRememberedStudyMethod(nextMethod.id, 0);
      setPassage(examplePassage);
      setPassageQuery(examplePassage);
      setStudyPhase("study");
      setSavedStudySummary(null);
      clearStudyWorkspace();
      setMethodExampleModeId(nextMethod.id);
      setLoadedDraftKey("");
      setSaveStatus(`Example loaded: ${examplePassage}`);
      setActiveMethodInfoId("");
      setTab("study");
    });
  }

  function resetCurrentStudy() {
    const lastStudiedPassage = passageText?.reference || passage.trim() || passageQuery.trim() || "Psalm 23";
    requestStudyTransition("start over with this passage", () => {
      clearStudyWorkspace();
      setPassage(lastStudiedPassage);
      setPassageQuery(lastStudiedPassage);
      setRememberedStudyFocusMode(false);
      setRememberedStudyStepIndex(0);
      setStudyPhase("study");
      setSavedStudySummary(null);
      setLoadedDraftKey("");
      setSaveStatus("Fresh study started");
    });
  }

  function applyPassageQuery(nextPassage = parsedPassage.reference) {
    if (!nextPassage.trim()) return;
    if (nextPassage.trim() === passage.trim()) return;
    requestStudyTransition(`change the passage to ${nextPassage}`, () => {
      setPassage(nextPassage);
      setPassageQuery(nextPassage);
      clearStudyWorkspace();
      setRememberedStudyStepIndex(0);
      setStudyPhase("study");
      setSavedStudySummary(null);
      setLoadedDraftKey("");
      setSaveStatus("Drafts save automatically once you begin writing.");
    });
  }

  function addCheckinPartner() {
    const name = partnerName.trim();
    if (!name) {
      setPlanStatus("Add a partner or group name first.");
      return;
    }

    const created = { id: `partner-${Date.now()}`, name, contactNote: partnerContactNote.trim() || undefined };
    const next = [created, ...checkinPartners];
    setCheckinPartners(next);
    setActiveCheckinPartnerId(created.id);
    setPartner(name);
    setPartnerName("");
    setPartnerContactNote("");
    setPlanStatus("Encouragement partner added");
    setPeoplePanelCollapsed(true);
    saveStoredCheckinPartners(next).catch(() => undefined);
    saveActiveCheckinPartnerId(created.id).catch(() => undefined);
  }

  function selectCheckinPartner(id: string) {
    setActiveCheckinPartnerId(id);
    const selected = checkinPartners.find((item) => item.id === id);
    if (selected) setPartner(selected.name);
    setPeoplePanelCollapsed(true);
    saveActiveCheckinPartnerId(id).catch(() => undefined);
  }

  async function persistPlan() {
    if (!activeProfileId) {
      setPlanStatus("Profile is still loading. Try again in a moment.");
      return;
    }

    setPlanStatus("Saving accountability plan...");
    try {
      await savePlan({
        profileId: activeProfileId,
        weeklyGoal,
        accountabilityPartner: effectivePartner,
        preferredMethodId: method.id
      });
      setPlanStatus("Accountability plan saved");
    } catch {
      setPlanStatus("Could not save. Check your connection and try again.");
    }
  }

  async function persistAccountSettings() {
    if (!activeProfileId) return;
    setAccountStatus("Saving account...");
    try {
      await saveAccountSettings({
        profileId: activeProfileId,
        displayName,
        email: accountEmail,
        weeklyGoal,
        accountabilityPartner: effectivePartner,
        preferredMethodId: method.id,
        appearanceMode
      });
      setAccountStatus("Account details saved");
    } catch {
      setAccountStatus("Could not save those details. Check the email is not already in use.");
    }
  }

  async function chooseAppearanceMode(mode: StoredAppearanceMode) {
    setAppearanceMode(mode);
    saveStoredAppearanceMode(mode).catch(() => undefined);

    if (!activeProfileId) return;

    try {
      await saveAccountSettings({
        profileId: activeProfileId,
        displayName,
        email: accountEmail,
        weeklyGoal,
        accountabilityPartner: effectivePartner,
        preferredMethodId: method.id,
        appearanceMode: mode
      });
    } catch {
      // Appearance still saves locally immediately; avoid placing theme feedback under Personal details.
    }
  }

  async function submitPasswordChange() {
    if (!isAuthenticated) return;
    setPasswordStatus("Updating password...");
    try {
      await changePassword({
        accountId: profile?.authPasswordAccountId || accountEmail,
        currentPassword: currentAccountPassword,
        newPassword: newAccountPassword
      });
      setCurrentAccountPassword("");
      setNewAccountPassword("");
      setPasswordStatus("Password updated");
    } catch {
      setPasswordStatus("Could not update password. Check your current password and use at least 8 characters.");
    }
  }

  async function submitAccountDeletionRequest() {
    if (!activeProfileId) {
      setDeletionStatus("The app is still connecting to your saved data. Try again in a moment.");
      return;
    }
    if (!deletionConfirmArmed) {
      setDeletionConfirmArmed(true);
      setDeletionStatus("Tap Request deletion again to confirm. An administrator will review it before anything is removed.");
      return;
    }

    setDeletionStatus("Sending deletion request...");
    try {
      await requestAccountDeletion({
        profileId: activeProfileId,
        note: isAuthenticated ? "Requested from signed-in Account tab." : "Requested from local profile Account tab."
      });
      setDeletionConfirmArmed(false);
      setDeletionStatus("Deletion request sent. Your account will not be removed until an administrator approves it.");
    } catch {
      setDeletionStatus("Could not send deletion request. Try again in a moment.");
    }
  }

  async function cancelOwnAccountDeletionRequest() {
    if (!activeProfileId) return;
    setDeletionStatus("Cancelling deletion request...");
    try {
      await cancelAccountDeletionRequest({ profileId: activeProfileId });
      setDeletionConfirmArmed(false);
      setDeletionStatus("Deletion request cancelled.");
    } catch {
      setDeletionStatus("Could not cancel the deletion request.");
    }
  }

  async function approveAdminDeletionRequest(requestId: any) {
    if (pendingAdminDeletionRequestId !== requestId) {
      setPendingAdminDeletionRequestId(requestId);
      return;
    }

    try {
      await approveDeletionRequestAsAdmin({ requestId });
      setPendingAdminDeletionRequestId("");
    } catch {
      setPendingAdminDeletionRequestId("");
    }
  }

  async function cancelAdminDeletionRequest(requestId: any) {
    try {
      await cancelDeletionRequestAsAdmin({ requestId });
      setPendingAdminDeletionRequestId("");
    } catch {
      setPendingAdminDeletionRequestId("");
    }
  }

  async function cleanupEmptyLocalProfiles() {
    if (!localProfileCleanupArmed) {
      setLocalProfileCleanupArmed(true);
      setAdminMaintenanceStatus("Tap again to remove empty local/test profiles. Profiles with saved content will be kept.");
      return;
    }

    setAdminMaintenanceStatus("Cleaning empty local/test profiles...");
    try {
      const result = await cleanupEmptyLocalProfilesAsAdmin({});
      setLocalProfileCleanupArmed(false);
      setSelectedAdminProfileId(null);
      setAdminMaintenanceStatus(`Queued ${result?.queued ?? 0} empty local/test profile${result?.queued === 1 ? "" : "s"} for cleanup. Kept ${result?.kept ?? 0} with saved content.`);
    } catch {
      setLocalProfileCleanupArmed(false);
      setAdminMaintenanceStatus("Could not clean local/test profiles. Make sure Convex has the latest functions deployed.");
    }
  }

  async function setAdminProfileSuspension(args: { profileId: any; suspended: boolean; reason?: string }) {
    setAdminMaintenanceStatus(args.suspended ? "Suspending profile..." : "Restoring profile...");
    try {
      await setProfileSuspensionAsAdmin(args);
      setAdminMaintenanceStatus(args.suspended ? "Profile suspended. Writes are paused for that user." : "Profile restored. The user can save again.");
    } catch {
      setAdminMaintenanceStatus("Could not update that profile. Make sure Convex has the latest functions deployed.");
    }
  }

  async function markAdminProfileSecurityReviewed(args: { profileId: any; note?: string }) {
    setAdminMaintenanceStatus("Marking profile reviewed...");
    try {
      await markProfileSecurityReviewedAsAdmin(args);
      setAdminMaintenanceStatus("Profile security activity marked reviewed.");
    } catch {
      setAdminMaintenanceStatus("Could not mark that profile reviewed. Make sure Convex has the latest functions deployed.");
    }
  }

  async function submitAuth() {
    if (authBusy) return;
    Keyboard.dismiss();
    const rawIdentifier = authIdentifier.trim();
    const isEmailCredential = authInputLooksLikeEmail(rawIdentifier);
    const email = rawIdentifier.toLowerCase();
    const username = normalizeUsername(rawIdentifier);
    const credentialMode = isEmailCredential ? "email" : "username";
    const name = authName.trim();
    const accountId = credentialMode === "username" ? usernameCredential(username) : email;
    if (!rawIdentifier || !authPassword) {
      setAuthStatus("Add your email or username and password first.");
      return;
    }
    if (credentialMode === "username" && !usernameIsValid(username)) {
      setAuthStatus("For username sign-in, use 3 to 24 characters: letters, numbers, dots, hyphens, or underscores.");
      return;
    }
    if (authFlow === "signUp" && !name) {
      setAuthStatus("Add your name so the tutor can feel more personal.");
      return;
    }

    setAuthBusy(true);
    setAuthStatus("");
    if (authFlow === "signUp") {
      trackPublicAnalytics({ eventType: "account_creation_started", source: credentialMode, ctaTarget: "/?tab=account" });
    }
    try {
      const signInParams: Record<string, string> = {
        email: accountId,
        authMode: credentialMode,
        name,
        password: authPassword,
        flow: authFlow
      };
      if (credentialMode === "username") signInParams.username = username;
      await signIn("password", signInParams);
      if (authFlow === "signUp") setDisplayName(name);
      setAuthPassword("");
      setAuthStatus(authFlow === "signIn" ? "Signed in" : "Account created");
    } catch {
      setAuthStatus(
        authFlow === "signIn"
          ? `Could not sign in. Check the ${credentialMode} and password.`
          : credentialMode === "username"
            ? "Could not create account. That username may already be taken, or the password needs at least 8 characters."
            : "Could not create account. Passwords need at least 8 characters."
      );
    } finally { setAuthBusy(false); }
  }

  async function submitSignOut() {
    setAuthStatus("Signing out...");
    try {
      await signOut();
      setAuthStatus("Signed out");
    } catch {
      setAuthStatus("Could not sign out. Try again.");
    }
  }

  function trackUsage(eventType: string, details: { reference?: string; methodId?: string; methodName?: string; translation?: string; tab?: string; book?: string; chapter?: number } = {}) {
    if (!activeProfileId) return;
    const startedAt = Date.now();
    const { methodId, translation, tab, book } = details;
    recordUsage({ profileId: activeProfileId, eventType, localDayKey: localDateKey(), methodId, translation, tab, book })
      .then(() => import("@/data/reliabilityMetrics").then(({ trackReliabilityMetric }) => trackReliabilityMetric({ kind: "provider_request", provider: "convex", operation: "mutation", outcome: "success", durationMs: Date.now() - startedAt })))
      .catch(() => import("@/data/reliabilityMetrics").then(({ trackReliabilityMetric }) => trackReliabilityMetric({ kind: "provider_request", provider: "convex", operation: "mutation", outcome: "error", errorCode: "unknown", durationMs: Date.now() - startedAt })).catch(() => undefined));
  }

  function dismissRhythmGracePrompt() {
    if (pendingRhythmGracePrompt?.storageKey) {
      persistRhythmGraceHandledDate(pendingRhythmGracePrompt.missedDate, pendingRhythmGracePrompt.storageKey);
    }
    setPendingRhythmGracePrompt(null);
  }

  function restoreDailyRhythmFromGracePrompt() {
    if (!pendingRhythmGracePrompt) return;
    const restoredCount = Math.max(currentRhythmCount, 1);
    persistRhythmGraceHandledDate(pendingRhythmGracePrompt.missedDate, pendingRhythmGracePrompt.storageKey);
    trackUsage("rhythm_restored", { reference: pendingRhythmGracePrompt.missedDate, tab: "home" });
    setRhythmGraceSuccess({ missedDate: pendingRhythmGracePrompt.missedDate, restoredCount });
    setPendingRhythmGracePrompt(null);
    setTab("home");
  }

  function openStudyFromPublicSource(source: string) {
    trackPublicAnalytics({ eventType: "start_study_clicked", source, ctaTarget: "/?tab=study" });
    setTab("study");
  }

  function openBibleFromPublicSource(source: string) {
    trackPublicAnalytics({ eventType: "bible_reader_opened", source, ctaTarget: "/?tab=bible" });
    setTab("bible");
  }

  async function submitUserFeedback() {
    if (!activeProfileId) {
      setFeedbackStatus("The app is still connecting to your saved data. Try again in a moment.");
      return;
    }
    if (!feedbackMessage.trim()) {
      setFeedbackStatus("Write a short note before sending feedback.");
      return;
    }

    setFeedbackStatus("Sending feedback...");
    try {
      await submitFeedback({
        profileId: activeProfileId,
        category: feedbackCategory,
        message: feedbackMessage,
        tab,
        device: phoneLayout ? "phone" : compactLayout ? "tablet" : "desktop"
      });
      setFeedbackMessage("");
      setFeedbackStatus("Thank you. Your feedback has been sent.");
      trackUsage("feedback_sent", { tab: "help" });
    } catch {
      setFeedbackStatus("Could not send feedback. Please wait a moment and try again.");
    }
  }

  async function persistCheckin() {
    if (isSavingCheckin) return;
    if (!activeProfileId) {
      setCommunityStatus("The app is still connecting to your saved data. Please wait a moment and try again.");
      return;
    }
    if (!checkinNote.trim()) {
      setCommunityStatus("Write one honest update before saving.");
      return;
    }
    if (!hasCommunityTarget) {
      setCommunityStatus("Add an accepted friend or join a circle before saving an encouragement.");
      return;
    }

    setIsSavingCheckin(true);
    setCommunityStatus("Posting encouragement...");
    const noteToSave = checkinNote.trim();
    const shouldShareWithCircle = COMMUNITY_CIRCLES_ENABLED && communityTargetType === "circle" && targetCircleId;
    const shouldShareWithFriends = COMMUNITY_CIRCLES_ENABLED && communityTargetType === "friend" && targetFriendIds.length > 0;
    try {
      const checkinId = await saveCheckin({ profileId: activeProfileId, mood: "encouragement", note: noteToSave, sentAt: Date.now(), localDayKey: localDateKey() });
      if (shouldShareWithCircle || shouldShareWithFriends) {
        try {
          await shareCheckinToCircle({
            profileId: activeProfileId,
            circleId: shouldShareWithCircle ? targetCircleId : undefined,
            friendIds: shouldShareWithFriends ? targetFriendIds : undefined,
            checkinId,
            note: noteToSave,
            passageReference: passageText?.reference || passage
          });
        } catch {
          setCommunityStatus("Saved privately, but could not post to the selected connection. Try selecting the friend or circle again.");
          trackUsage("checkin_saved", { tab: "accountability" });
          return;
        }
      }
      setCommunityStatus(
        shouldShareWithCircle
          ? `Posted to ${selectedCommunityCircle?.name || "your circle"}`
          : shouldShareWithFriends
            ? `Posted to ${activeCommunityTargetName || "your selected friend"}`
            : "Saved privately"
      );
      trackUsage("checkin_saved", { tab: "accountability" });
      setCheckinNote("");
    } catch {
      setCommunityStatus("Could not save that encouragement. Please try again.");
    } finally {
      setIsSavingCheckin(false);
    }
  }

  async function createCircle() {
    if (!activeProfileId) return;
    if (!isAuthenticated) {
      setCircleStatus("Sign in before creating a private circle.");
      return;
    }
    const name = circleName.trim();
    if (!name) {
      setCircleStatus("Add a circle name first.");
      return;
    }

    setCircleStatus("Creating circle...");
    try {
      const result = await createCommunityCircle({ profileId: activeProfileId, name });
      setSelectedCircleId(result.circleId);
      setTargetCircleId(result.circleId);
      setCommunityTargetType("circle");
      setCircleName("");
      setCircleStatus(`Circle created. Invite code: ${result.inviteCode}`);
      trackUsage("community_circle_created", { tab: "accountability" });
    } catch {
      setCircleStatus("Could not create the circle. Make sure you are signed in.");
    }
  }

  async function inviteFriend() {
    if (!activeProfileId) return;
    if (!isAuthenticated) {
      setFriendStatus("Sign in before adding a friend.");
      return;
    }
    const email = friendEmail.trim().toLowerCase();
    if (!email) {
      setFriendStatus("Enter the email address your friend uses for Bible Study Tutor.");
      return;
    }

    setFriendStatus("Looking for that registered user...");
    try {
      await inviteCommunityFriend({ profileId: activeProfileId, email });
      setFriendEmail("");
      setFriendStatus("Friend invite saved. They will appear as a friend once accepted.");
      trackUsage("community_friend_invited", { tab: "accountability" });
    } catch {
      setFriendStatus("Could not add that friend. Check they have registered with that email.");
    }
  }

  async function inviteFriendWithCode() {
    if (!activeProfileId) return;
    if (!isAuthenticated) {
      setFriendStatus("Sign in before adding a friend.");
      return;
    }
    const friendCode = friendCodeInput.trim().replace(/[^a-z0-9]/gi, "").toUpperCase();
    if (!friendCode) {
      setFriendStatus("Enter your friend's code first.");
      return;
    }

    setFriendStatus("Checking that friend code...");
    try {
      await inviteCommunityFriendByCode({ profileId: activeProfileId, friendCode });
      setFriendCodeInput("");
      setFriendStatus("Friend invite saved. If they already invited you, they are now a friend.");
      trackUsage("community_friend_invited", { tab: "accountability", reference: "friend_code" });
    } catch {
      setFriendStatus("That friend code did not work. Check the code and try again.");
    }
  }

  async function acceptFriendInvite(friend: any) {
    if (!activeProfileId) return;
    setFriendStatus("Accepting friend invite...");
    try {
      await acceptCommunityFriend({ profileId: activeProfileId, friendId: friend._id });
      setSelectedFriendId(friend._id);
      setTargetFriendIds((current) => current.some((id) => String(id) === String(friend._id)) ? current : [...current, friend._id]);
      setCommunityTargetType("friend");
      setFriendStatus(`${friend.name} is now a friend.`);
    } catch {
      setFriendStatus("Could not accept that friend invite.");
    }
  }

  async function removeFriend(friend: any) {
    if (!activeProfileId) return;
    if (pendingFriendRemoveId !== friend._id) {
      setPendingFriendRemoveId(friend._id);
      setFriendStatus(`Tap Remove again to remove ${friend.name}.`);
      return;
    }

    try {
      await removeCommunityFriend({ profileId: activeProfileId, friendId: friend._id });
      setPendingFriendRemoveId(null);
      if (String(selectedFriendId) === String(friend._id)) setSelectedFriendId(null);
      setTargetFriendIds((current) => current.filter((id) => String(id) !== String(friend._id)));
      setFriendStatus(`${friend.name} removed.`);
    } catch {
      setFriendStatus("Could not remove that friend.");
    }
  }

  async function joinCircle() {
    if (!activeProfileId) return;
    if (!isAuthenticated) {
      setCircleStatus("Sign in before joining a private circle.");
      return;
    }
    const inviteCode = circleInviteCode.trim();
    if (!inviteCode) {
      setCircleStatus("Enter an invite code first.");
      return;
    }

    setCircleStatus("Joining circle...");
    try {
      const circleId = await joinCommunityCircle({ profileId: activeProfileId, inviteCode });
      setSelectedCircleId(circleId);
      setTargetCircleId(circleId);
      setCommunityTargetType("circle");
      setCircleInviteCode("");
      setCircleStatus("Circle joined.");
      trackUsage("community_circle_joined", { tab: "accountability" });
    } catch {
      setCircleStatus("That invite code did not work.");
    }
  }

  async function toggleCommunityReaction(
    postId: any,
    reaction: "amen" | "praying" | "encouraged",
    currentReactions: { amen?: number; praying?: number; encouraged?: number } = {},
    currentMyReactions: string[] = []
  ) {
    if (!activeProfileId || !postId || !isAuthenticated) {
      setCommunityStatus("Sign in before reacting so it can sync across devices.");
      return;
    }
    const postKey = String(postId);
    const active = currentMyReactions.includes(reaction);
    const nextMyReactions = active ? currentMyReactions.filter((item) => item !== reaction) : [...currentMyReactions, reaction];
    const nextReactions = {
      amen: Math.max(0, (currentReactions.amen || 0) + (reaction === "amen" ? active ? -1 : 1 : 0)),
      praying: Math.max(0, (currentReactions.praying || 0) + (reaction === "praying" ? active ? -1 : 1 : 0)),
      encouraged: Math.max(0, (currentReactions.encouraged || 0) + (reaction === "encouraged" ? active ? -1 : 1 : 0))
    };

    setCommunityReactionOverrides((current) => ({
      ...current,
      [postKey]: {
        reactions: nextReactions,
        myReactions: nextMyReactions
      }
    }));
    setCommunityStatus(active ? "Reaction removed." : "Reaction added.");

    try {
      await reactToCommunityPost({ profileId: activeProfileId, postId, reaction });
    } catch {
      setCommunityReactionOverrides((current) => {
        const next = { ...current };
        delete next[postKey];
        return next;
      });
      setCommunityStatus("Could not update that encouragement.");
    }
  }

  async function copyCircleInviteCode(code: string) {
    try {
      if (Platform.OS === "web" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        setCircleStatus("Invite code copied.");
        return;
      }

      const { Share } = await import("react-native");
      await Share.share({ message: `Join my Bible Study Tutor circle with invite code: ${code}` });
      setCircleStatus("Invite code ready to share.");
    } catch {
      setCircleStatus("Could not copy the invite code.");
    }
  }

  async function copyFriendCode() {
    if (!myFriendCode) {
      setFriendStatus("Your friend code is still loading.");
      return;
    }
    try {
      if (Platform.OS === "web" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(myFriendCode);
        setFriendStatus("Friend code copied.");
        return;
      }

      const { Share } = await import("react-native");
      await Share.share({ message: `Add me as a friend on Bible Study Tutor with friend code: ${myFriendCode}` });
      setFriendStatus("Friend code ready to share.");
    } catch {
      setFriendStatus("Could not copy your friend code.");
    }
  }

  async function deleteCommunityPost(postId: any) {
    if (!activeProfileId) return;
    try {
      await removeCommunityPost({ profileId: activeProfileId, postId });
      setFocusedCommunityItemId("");
      setCircleStatus("Shared encouragement removed.");
    } catch {
      setCircleStatus("Could not remove that shared encouragement.");
    }
  }

  function startEditCommunityPost(post: any) {
    setFocusedCommunityItemId(String(post._id));
    setEditingCommunityPostId(post._id);
    setEditCommunityPostNote(post.note || "");
    setCircleStatus("");
  }

  function cancelEditCommunityPost() {
    setEditingCommunityPostId(null);
    setEditCommunityPostNote("");
  }

  async function saveCommunityPostEdit(post: any) {
    if (!activeProfileId || isSavingCommunityPostEdit) return;
    const nextNote = editCommunityPostNote.trim();
    if (!nextNote) {
      setCircleStatus("Add a note before saving changes.");
      return;
    }

    setIsSavingCommunityPostEdit(true);
    setCircleStatus("Saving shared post...");
    try {
      await updateCommunityPost({ profileId: activeProfileId, postId: post._id, note: nextNote });
      cancelEditCommunityPost();
      setCircleStatus("Shared post updated.");
    } catch {
      setCircleStatus("Could not update that shared post.");
    } finally {
      setIsSavingCommunityPostEdit(false);
    }
  }

  async function deleteRecentCheckin(checkin: any) {
    if (!activeProfileId) return;
    if (pendingCheckinDeleteId !== checkin._id) {
      setPendingCheckinDeleteId(checkin._id);
      setEditingRecentCheckinId(null);
      setCommunityStatus(
        Array.isArray(checkin.sharedTo) && checkin.sharedTo.length > 0
          ? "Tap Confirm delete to remove this encouragement and its shared post."
          : "Tap Confirm delete to remove this private encouragement."
      );
      return;
    }

    try {
      await deleteCheckinMutation({ profileId: activeProfileId, checkinId: checkin._id });
      setPendingCheckinDeleteId(null);
      setFocusedCommunityItemId("");
      setCommunityStatus("Encouragement removed.");
    } catch {
      setCommunityStatus("Could not remove that encouragement.");
    }
  }

  function startEditRecentCheckin(checkin: any) {
    setPendingCheckinDeleteId(null);
    setFocusedCommunityItemId(String(checkin._id));
    setEditingRecentCheckinId(checkin._id);
    setEditRecentCheckinNote(checkin.note || "");
    setCommunityStatus("");
  }

  function cancelEditRecentCheckin() {
    setEditingRecentCheckinId(null);
    setEditRecentCheckinNote("");
  }

  async function saveRecentCheckinEdit(checkin: any) {
    if (!activeProfileId || isSavingRecentCheckinEdit) return;
    const nextNote = editRecentCheckinNote.trim();
    if (!nextNote) {
      setCommunityStatus("Add a note before saving changes.");
      return;
    }

    setIsSavingRecentCheckinEdit(true);
    setCommunityStatus("Saving changes...");
    try {
      await updateCheckin({ profileId: activeProfileId, checkinId: checkin._id, note: nextNote });
      cancelEditRecentCheckin();
      setCommunityStatus(
        Array.isArray(checkin.sharedTo) && checkin.sharedTo.length > 0
          ? "Encouragement and shared post updated."
          : "Encouragement updated."
      );
    } catch {
      setCommunityStatus("Could not update that encouragement.");
    } finally {
      setIsSavingRecentCheckinEdit(false);
    }
  }

  async function leaveCircle(circle: any) {
    if (!activeProfileId) return;
    if (pendingCircleLeaveId !== circle._id) {
      setPendingCircleLeaveId(circle._id);
      setPendingCircleDeleteId(null);
      setCircleStatus(`Tap Leave again to leave ${circle.name}.`);
      return;
    }

    try {
      await leaveCommunityCircle({ profileId: activeProfileId, circleId: circle._id });
      setPendingCircleLeaveId(null);
      setSelectedCircleId(null);
      if (String(targetCircleId) === String(circle._id)) setTargetCircleId(null);
      setCircleStatus(`You left ${circle.name}.`);
    } catch {
      setCircleStatus("Could not leave that circle.");
    }
  }

  async function deleteCircle(circle: any) {
    if (!activeProfileId) return;
    if (pendingCircleDeleteId !== circle._id) {
      setPendingCircleDeleteId(circle._id);
      setPendingCircleLeaveId(null);
      setCircleStatus(`Tap Delete again to delete ${circle.name} for every member.`);
      return;
    }

    try {
      await deleteCommunityCircle({ profileId: activeProfileId, circleId: circle._id });
      setPendingCircleDeleteId(null);
      setSelectedCircleId(null);
      if (String(targetCircleId) === String(circle._id)) setTargetCircleId(null);
      setCircleStatus(`${circle.name} deleted.`);
    } catch {
      setCircleStatus("Could not delete that circle.");
    }
  }

  function startHighlightReflection(item: HighlightJournalEntry) {
    const highlightNotes = item.markups.map((markup) => markup.note).filter(Boolean).join(" ");
    setActiveReflectionEntryId(item.id);
    setReflectionInsight(highlightNotes || "");
    setReflectionPrayer("");
    setReflectionNextStep("");
    setReflectionStatus("");
  }

  async function saveHighlightReflection(item: HighlightJournalEntry) {
    if (isSavingReflection) return;

    if (!activeProfileId) {
      setReflectionStatus("Saving is not connected yet.");
      return;
    }

    const hasReflection = [reflectionInsight, reflectionPrayer, reflectionNextStep].some((value) => value.trim());
    if (!hasReflection) {
      setReflectionStatus("Add at least one reflection note first.");
      return;
    }

    setIsSavingReflection(true);
    setReflectionStatus("Saving reflection...");
    try {
      await saveCheckin({
        profileId: activeProfileId,
        localDayKey: localDateKey(),
        mood: "Highlight reflection",
        note: buildHighlightReflectionNote(item, reflectionInsight, reflectionPrayer, reflectionNextStep)
      });
      setReflectionStatus("Reflection saved to Journal");
      setActiveReflectionEntryId("");
      setReflectionInsight("");
      setReflectionPrayer("");
      setReflectionNextStep("");
      setRememberedJournalFilter("all");
    } finally {
      setIsSavingReflection(false);
    }
  }

  async function copyPastCheckinMessage(checkin: any) {
    const message = buildCommunityMessage({
      partner: effectivePartner,
      checkinNote: checkin.note
    });

    try {
      if (Platform.OS === "web" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
        setCommunityStatus("Past encouragement copied");
        return;
      }

      const { Share } = await import("react-native");
      await Share.share({ message });
      setCommunityStatus("Share sheet opened. Mark as sent after you send it.");
    } catch {
      setCommunityStatus("Could not share from this device");
    }
  }

  async function shareStudyInsight(noteOverride?: string) {
    const insight = (noteOverride || shareNote).trim();
    if (!insight) {
      setShareInsightStatus("Write an insight first.");
      return;
    }

    const message = buildStudyInsightShareMessage({
      passageReference: passageText?.reference || passage,
      methodName: method.name,
      insight
    });

    try {
      if (Platform.OS === "web") {
        const nav = navigator as any;
        if (nav?.share) {
          await nav.share({ title: "Bible study insight", text: message });
          setShareInsightStatus("Share sheet opened");
          return;
        }
        if (nav?.clipboard?.writeText) {
          await nav.clipboard.writeText(message);
          setShareInsightStatus("Insight copied. Paste it into Messages, WhatsApp, email, or your group chat.");
          return;
        }
      }

      const { Share } = await import("react-native");
      await Share.share({ message });
      setShareInsightStatus("Share sheet opened");
    } catch {
      setShareInsightStatus("Could not share from this device");
    }
  }

  async function postStudyInsightToCommunity(noteOverride?: string) {
    const insight = (noteOverride || shareNote).trim();
    if (!insight) {
      setShareInsightStatus("Write an insight first.");
      return;
    }
    setShareInsightPostedReady(false);
    if (!activeProfileId || !isAuthenticated) {
      setShareInsightStatus("Sign in before sharing with a friend or circle.");
      return;
    }
    if (!hasShareInsightTarget) {
      setShareInsightStatus("Choose a friend or circle first.");
      return;
    }

    const shouldShareWithCircle = shareInsightTargetType === "circle" && shareInsightCircleId;
    const shouldShareWithFriends = shareInsightTargetType === "friend" && shareInsightFriendIds.length > 0;
    if (!shouldShareWithCircle && !shouldShareWithFriends) {
      setShareInsightStatus("Choose a friend or circle first.");
      return;
    }

    setShareInsightStatus("Posting insight...");
    try {
      await shareStudyInsightToCommunity({
        profileId: activeProfileId,
        circleId: shouldShareWithCircle ? shareInsightCircleId : undefined,
        friendIds: shouldShareWithFriends ? shareInsightFriendIds : undefined,
        note: insight,
        passageReference: passageText?.reference || passage
      });
      if (shouldShareWithCircle) {
        setCommunityTargetType("circle");
        setTargetCircleId(shareInsightCircleId);
        setSelectedCircleId(shareInsightCircleId);
      } else if (shouldShareWithFriends && shareInsightFriendIds.length === 1) {
        setCommunityTargetType("friend");
        setSelectedFriendId(shareInsightFriendIds[0]);
        setTargetFriendIds([shareInsightFriendIds[0]]);
      }
      setCommunitySubView("encourage");
      setShareInsightPostedReady(true);
      setShareInsightStatus(`Insight posted to ${activeShareInsightTargetName || "your selected connection"}.`);
      trackUsage("study_insight_posted", { reference: passageText?.reference || passage, tab: "study" });
    } catch {
      setShareInsightStatus("Could not post that insight. Check the selected friend or circle.");
    }
  }

  function renderShareInsightCommunityControls(noteOverride?: string) {
    return (
      <View style={[styles.shareInsightCommunityBox, accountDarkMode && styles.accountDarkInsetBox]}>
        <Text style={[styles.circleManagementLabel, accountDarkMode && styles.studyDarkAccentText]}>Post inside Bible Study Tutor</Text>
        {hasAvailableCommunityTarget ? (
          <>
            <Pressable onPress={() => setShareInsightTargetPickerOpen((open) => !open)} style={[styles.communityTargetSelect, accountDarkMode && styles.accountDarkInput]}>
              <View style={styles.communityTargetSelectTextBlock}>
                <Text style={[styles.communityRecipientText, accountDarkMode && styles.accountDarkText]}>{hasShareInsightTarget ? activeShareInsightTargetName : "Choose friends or a circle"}</Text>
              </View>
              <Ionicons name={shareInsightTargetPickerOpen ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={accountDarkMode ? "#e9b76a" : colors.oliveDark} />
            </Pressable>
            {shareInsightTargetPickerOpen && (
              <View style={[styles.communityTargetPickerPanel, accountDarkMode && styles.accountDarkSection]}>
                {acceptedCommunityFriends.length > 0 && (
                  <View style={styles.communityTargetPickerGroup}>
                    <Text style={[styles.circleManagementLabel, accountDarkMode && styles.studyDarkAccentText]}>Friends — select one or more</Text>
                    {acceptedCommunityFriends.map((friend: any) => {
                      const isTarget = shareInsightTargetType === "friend" && shareInsightFriendIds.some((id) => String(id) === String(friend._id));
                      return (
                        <Pressable
                          key={friend._id}
                          onPress={() => {
                            setShareInsightTargetType("friend");
                            setShareInsightCircleId(null);
                            setShareInsightPostedReady(false);
                            setShareInsightFriendIds((current) => {
                              const alreadySelected = current.some((id) => String(id) === String(friend._id));
                              return alreadySelected ? current.filter((id) => String(id) !== String(friend._id)) : [...current, friend._id];
                            });
                          }}
                          style={[styles.communityTargetOption, accountDarkMode && styles.accountDarkInsetBox, isTarget && styles.activeCommunityTargetOption]}
                        >
                          <Ionicons name={isTarget ? "checkmark-circle-outline" : "ellipse-outline"} size={16} color={accountDarkMode ? "#e9b76a" : colors.oliveDark} />
                          <View style={styles.journalTitleBlock}>
                            <Text style={[styles.communityTargetOptionTitle, accountDarkMode && styles.accountDarkTitle]}>{friend.name}</Text>
                            {!!friend.email && <Text style={[styles.circleChipMeta, accountDarkMode && styles.accountDarkMutedText]}>{friend.email}</Text>}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
                {(communityCircles || []).length > 0 && (
                  <View style={styles.communityTargetPickerGroup}>
                    <Text style={[styles.circleManagementLabel, accountDarkMode && styles.studyDarkAccentText]}>Circles</Text>
                    {(communityCircles || []).map((circle: any) => {
                      const isTarget = shareInsightTargetType === "circle" && String(shareInsightCircleId) === String(circle._id);
                      return (
                        <Pressable
                          key={circle._id}
                          onPress={() => {
                            setShareInsightTargetType("circle");
                            setShareInsightFriendIds([]);
                            setShareInsightCircleId(circle._id);
                            setShareInsightTargetPickerOpen(false);
                            setShareInsightPostedReady(false);
                          }}
                          style={[styles.communityTargetOption, accountDarkMode && styles.accountDarkInsetBox, isTarget && styles.activeCommunityTargetOption]}
                        >
                          <Ionicons name={isTarget ? "checkmark-circle-outline" : "people-outline"} size={16} color={accountDarkMode ? "#e9b76a" : colors.oliveDark} />
                          <View style={styles.journalTitleBlock}>
                            <Text style={[styles.communityTargetOptionTitle, accountDarkMode && styles.accountDarkTitle]}>{circle.name}</Text>
                            <Text style={[styles.circleChipMeta, accountDarkMode && styles.accountDarkMutedText]}>
                              {circle.memberCount} member{circle.memberCount === 1 ? "" : "s"}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
            <AppButton
              label={shareInsightPostedReady ? "View in Community" : "Post insight"}
              variant="secondary"
              onPress={() => {
                if (shareInsightPostedReady) {
                  setCommunitySubView("encourage");
                  setTab("accountability");
                } else {
                  postStudyInsightToCommunity(noteOverride);
                }
              }}
              style={[phoneLayout && styles.phoneFullWidthButton, accountDarkMode && styles.homeDarkResumeButton]}
              labelStyle={[phoneLayout && styles.phoneCommunityButtonLabel, accountDarkMode && styles.homeDarkResumeButtonText]}
            />
          </>
        ) : (
          <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>Add a friend or join a private circle before posting an insight inside the app.</Text>
        )}
      </View>
    );
  }

  function renderShareInsightPanel(description: string) {
    return (
      <View style={[styles.shareInsightBox, studyDarkMode && styles.accountDarkSection]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={shareInsightPanelOpen ? "Hide shareable insight" : "Add a shareable insight"}
          accessibilityState={{ expanded: shareInsightPanelOpen }}
          onPress={() => setShareInsightPanelOpen((open) => !open)}
          style={styles.collapsiblePanelHeader}
        >
          <View style={[styles.feedbackHeader, styles.collapsiblePanelTitle]}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.coral} />
            <Text style={[styles.feedbackTitle, studyDarkMode && styles.studyDarkAccentText]}>Shareable insight</Text>
          </View>
          <Ionicons name={shareInsightPanelOpen ? "remove-circle-outline" : "add-circle-outline"} size={24} color={colors.coral} />
        </Pressable>
        {shareInsightPanelOpen && (
          <>
            <Text style={[styles.helpIntro, studyDarkMode && styles.accountDarkMutedText]}>{description}</Text>
            <TextInput
              multiline
              value={shareNote}
              onChangeText={setShareNote}
              placeholder="Write a separate insight to share (optional)."
              placeholderTextColor={studyDarkMode ? "#8f8678" : undefined}
              style={[styles.input, styles.shareInput, studyDarkMode && styles.accountDarkInput]}
            />
            {renderShareInsightCommunityControls()}
            {!!shareInsightStatus && <Text style={styles.saveStatus}>{shareInsightStatus}</Text>}
          </>
        )}
      </View>
    );
  }

  async function shareAppLink() {
    const message = `Bible Study Tutor is a free Bible study app for desktop and mobile: ${APP_SHARE_URL}`;
    setAppShareStatus("");

    try {
      if (Platform.OS === "web") {
        const nav = navigator as any;
        if (nav?.share) {
          await nav.share({ title: "Bible Study Tutor", text: message, url: APP_SHARE_URL });
          trackUsage("app_shared", { reference: "Share button", tab: "help" });
          trackPublicAnalytics({ eventType: "app_shared", source: "share_button", ctaTarget: APP_SHARE_URL });
          setAppShareStatus("Share sheet opened.");
          return;
        }
        if (nav?.clipboard?.writeText) {
          await nav.clipboard.writeText(APP_SHARE_URL);
          trackUsage("app_shared", { reference: "Copy link", tab: "help" });
          trackPublicAnalytics({ eventType: "app_shared", source: "copy_link", ctaTarget: APP_SHARE_URL });
          setAppShareStatus("Link copied. Paste it into a message, email, or group chat.");
          return;
        }
      }

      const { Share } = await import("react-native");
      await Share.share({ title: "Bible Study Tutor", message });
      trackUsage("app_shared", { reference: "Share button", tab: "help" });
      trackPublicAnalytics({ eventType: "app_shared", source: "share_button", ctaTarget: APP_SHARE_URL });
      setAppShareStatus("Share sheet opened.");
    } catch {
      setAppShareStatus("Could not share from this device right now.");
    }
  }

  async function copyAppLink() {
    setAppShareStatus("");

    try {
      if (Platform.OS === "web" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(APP_SHARE_URL);
        trackUsage("app_shared", { reference: "Copy link", tab: "help" });
        trackPublicAnalytics({ eventType: "app_shared", source: "copy_link", ctaTarget: APP_SHARE_URL });
        setAppShareStatus("Link copied.");
        return;
      }

      setAppShareStatus("Use Share to send the link from this device.");
    } catch {
      setAppShareStatus("Could not copy the link right now.");
    }
  }

  async function deleteDraft(draftId: any) {
    if (!activeProfileId) return;
    await deleteDraftMutation({ profileId: activeProfileId, draftId });
    setPendingArchiveDraftId("");
    if (savedDraft?._id === draftId) resetCurrentStudy();
  }

  async function deleteJournalEntry(entry: any) {
    if (!activeProfileId || !entry?._id || isDeletingJournalEntry) return;

    const entryId = String(entry._id);
    setIsDeletingJournalEntry(true);
    setJournalDeleteStatus("Deleting journal entry...");
    try {
      if (entry.answers) {
        await deleteSessionMutation({ profileId: activeProfileId, sessionId: entry._id });
        const nextPinnedEntries = pinnedJournalEntryIds.filter((id) => id !== entryId);
        setPinnedJournalEntryIds(nextPinnedEntries);
        persistPinnedJournalEntries(nextPinnedEntries);
      } else {
        await deleteCheckinMutation({ profileId: activeProfileId, checkinId: entry._id });
      }

      setPendingDeleteJournalEntryId("");
      setJournalDeleteStatus("");
      setJournalStatus("Journal entry deleted");
    } catch {
      setJournalDeleteStatus("Could not delete this journal entry. Try again in a moment.");
    } finally {
      setIsDeletingJournalEntry(false);
    }
  }

  function startEditJournalEntry(entry: any) {
    if (entry.answers) return;

    setEditingJournalEntryId(String(entry._id));
    setJournalStatus("");
    if (isHighlightReflection(entry)) {
      const reflection = parseHighlightReflectionNote(entry.note || "");
      setEditReflectionPassage(reflection.passage);
      setEditReflectionHighlights(reflection.highlights);
      setEditReflectionInsight(reflection.keyInsight);
      setEditReflectionPrayer(reflection.prayer);
      setEditReflectionNextStep(reflection.nextStep);
      setEditJournalNote("");
    } else {
      setEditJournalNote(entry.note || "");
      setEditReflectionPassage("");
      setEditReflectionHighlights("");
      setEditReflectionInsight("");
      setEditReflectionPrayer("");
      setEditReflectionNextStep("");
    }
  }

  function cancelEditJournalEntry() {
    setEditingJournalEntryId("");
    setEditJournalNote("");
    setEditReflectionPassage("");
    setEditReflectionHighlights("");
    setEditReflectionInsight("");
    setEditReflectionPrayer("");
    setEditReflectionNextStep("");
  }

  async function saveJournalEntryEdit(entry: any) {
    if (!activeProfileId || entry.answers || isSavingJournalEdit) return;

    const nextNote = isHighlightReflection(entry)
      ? buildStructuredHighlightReflectionNote({
          passage: editReflectionPassage,
          highlights: editReflectionHighlights,
          keyInsight: editReflectionInsight,
          prayer: editReflectionPrayer,
          nextStep: editReflectionNextStep
        })
      : editJournalNote.trim();

    if (!nextNote) {
      setJournalStatus("Add a note before saving.");
      return;
    }

    setIsSavingJournalEdit(true);
    setJournalStatus("Saving changes...");
    try {
      await updateCheckin({ profileId: activeProfileId, checkinId: entry._id, note: nextNote });
      cancelEditJournalEntry();
      setJournalStatus("Journal entry updated");
    } finally {
      setIsSavingJournalEdit(false);
    }
  }

  function applyNoteFormat(kind: NoteFormatKind, forcedSelection?: { start: number; end: number } | null) {
    if (kind === "undo" || kind === "redo") return;

    const currentAnswer = answers[answerKey] || "";
    const activeSelection = getCurrentAnswerSelection(currentAnswer, forcedSelection, answerSelection, lastAnswerSelection);
    const start = activeSelection.start;
    const end = activeSelection.end;
    const selectedText = currentAnswer.slice(start, end);

    if (kind === "bullet") {
      const insertion = selectedText
        ? selectedText
            .split("\n")
            .map((line) => (line.trim() ? (line.trimStart().startsWith("- ") ? line : `- ${line}`) : line))
            .join("\n")
        : "- bullet point";
      const nextAnswer = `${currentAnswer.slice(0, start)}${insertion}${currentAnswer.slice(end)}`;
      setAnswers((current) => ({ ...current, [answerKey]: nextAnswer }));
      setAnswerSelection({ start: start + insertion.length, end: start + insertion.length });
      setLastAnswerSelection({ start: start + insertion.length, end: start + insertion.length });
      return;
    }

    const formatConfig = {
      bold: { open: "**", close: "**", placeholder: "bold note" },
      italic: { open: "*", close: "*", placeholder: "italic note" },
      underline: { open: "__", close: "__", placeholder: "underlined note" },
      highlight: { open: "==", close: "==", placeholder: "highlighted note" }
    }[kind];
    const text = selectedText || formatConfig.placeholder;
    const insertion = `${formatConfig.open}${text}${formatConfig.close}`;
    const nextAnswer = `${currentAnswer.slice(0, start)}${insertion}${currentAnswer.slice(end)}`;
    const nextCursor = selectedText ? start + insertion.length : start + formatConfig.open.length + text.length;

    setAnswers((current) => ({ ...current, [answerKey]: nextAnswer }));
    setAnswerSelection({ start: nextCursor, end: nextCursor });
    setLastAnswerSelection({ start: nextCursor, end: nextCursor });
  }

  function handleAnswerSelectionChange(selection: { start: number; end: number }) {
    setAnswerSelection(selection);
    if (selection.start !== selection.end) setLastAnswerSelection(selection);
  }

  function formatButtonProps(kind: NoteFormatKind) {
    if (Platform.OS !== "web") return { onPress: () => applyNoteFormat(kind) };

    return {
      onMouseDown: (event: any) => {
        event.preventDefault();
        applyNoteFormat(kind);
      }
    } as any;
  }

  function updateAnswerWithScriptureDetection(value: string, plainText?: string) {
    setAnswers({ ...answers, [answerKey]: value });
    setSkippedStudySteps((current) => current[answerKey] ? { ...current, [answerKey]: false } : current);
    const detected = findTypedScriptureReferenceMatch(plainText || value);
    setDetectedScriptureReference(detected?.reference || "");
    setDetectedScriptureTypedReference(detected?.typed || "");
    setScriptureInsertStatus("");
  }

  async function insertDetectedScripture(request?: ScriptureInsertRequest): Promise<ScriptureInsertResult | null> {
    const requestedReference = request?.reference || detectedScriptureReference;
    const requestedTypedReference = request?.typedReference || detectedScriptureTypedReference || requestedReference;
    if (!requestedReference) return null;

    const controller = new AbortController();
    setScriptureInsertStatus(`Finding ${requestedReference}...`);
    try {
      const passageResult =
        bibleTranslation === "bsb"
          ? await fetchBsbPassage(requestedReference, controller.signal)
          : await fetchBibleApiPassage(requestedReference, bibleTranslation, controller.signal);
      setDetectedScriptureReference("");
      setDetectedScriptureTypedReference("");
      setScriptureInsertStatus(`Inserted ${passageResult.reference}`);
      setScriptureInsertFocusKey((key) => key + 1);
      return {
        reference: passageResult.reference || requestedReference,
        text: passageResult.text,
        typedReference: requestedTypedReference
      };
    } catch {
      setScriptureInsertStatus(`Could not find ${requestedReference}`);
      return null;
    }
  }

  function addCustomWritingPrompt(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setWritingPromptStatus("Add a starter phrase first.");
      return false;
    }

    const nextPrompts = normalizeCustomWritingPrompts([trimmed, ...customWritingPrompts]);
    setCustomWritingPrompts(nextPrompts);
    saveStoredCustomWritingPrompts(nextPrompts).catch(() => undefined);
    persistUiPreference("customWritingPrompts", nextPrompts);
    setWritingPromptStatus("Starter saved");
    return true;
  }

  function removeCustomWritingPrompt(prompt: string) {
    const nextPrompts = normalizeCustomWritingPrompts(customWritingPrompts.filter((item) => item !== prompt));
    setCustomWritingPrompts(nextPrompts);
    saveStoredCustomWritingPrompts(nextPrompts).catch(() => undefined);
    persistUiPreference("customWritingPrompts", nextPrompts);
    setWritingPromptStatus("Starter removed");
  }

  async function scheduleStudyReview(sessionId: any, preset?: StudyReviewPreset, customDaysInput = customStudyReviewDays) {
    if (!activeProfileId || !sessionId) return;

    const parsedCustomDays = Number(customDaysInput);
    if (!preset && (!Number.isFinite(parsedCustomDays) || parsedCustomDays < 1 || parsedCustomDays > 365)) {
      setStudyReviewStatus("Choose between 1 and 365 days.");
      return;
    }

    setStudyReviewStatus("Scheduling review...");
    try {
      const reviewAt = await scheduleStudyReviewMutation({
        profileId: activeProfileId,
        sessionId,
        ...(preset ? { preset } : { customDays: parsedCustomDays })
      });
      setStudyReviewStatus(`Review set for ${formatReviewDate(reviewAt)}.`);
      setSavedStudySummary((current) => (current && current.sessionId === sessionId ? { ...current, reviewAt } : current));
    } catch {
      setStudyReviewStatus("Could not schedule review. Try again in a moment.");
    }
  }

  async function removeStudyReview(entry: any) {
    if (!activeProfileId || !entry?._id) return;

    const entryId = String(entry._id);
    if (pendingRemoveStudyReviewId !== entryId) {
      setPendingRemoveStudyReviewId(entryId);
      return;
    }

    setStudyReviewStatus("Removing review reminder...");
    try {
      await removeStudyReviewMutation({
        profileId: activeProfileId,
        sessionId: entry._id
      });
      setPendingRemoveStudyReviewId("");
      setReviewScheduleStudyId("");
      setActiveStudyReviewId("");
      setStudyReviewStatus("");
      setJournalStatus("Review reminder removed. Your study is still in Journal.");
    } catch {
      setStudyReviewStatus("Could not remove the review reminder. Try again in a moment.");
    }
  }

  async function completeStudyReview(entry: any) {
    if (!activeProfileId || !entry?._id) return;

    setStudyReviewStatus("Saving review...");
    try {
      await completeStudyReviewMutation({
        profileId: activeProfileId,
        sessionId: entry._id,
        reviewNote: studyReviewNote.trim() || undefined
      });
      setActiveStudyReviewId("");
      setStudyReviewNote("");
      setStudyReviewStatus("Review saved.");
    } catch {
      setStudyReviewStatus("Could not save review. Try again in a moment.");
    }
  }

  function applyVerseMarkup(kind: PassageMarkupKind) {
    if (selectedVerseKeys.length === 0) return;
    setPassageMarkups((current) => {
      const next = { ...current };
      selectedVerseKeys.forEach((key) => {
        next[key] = kind;
      });
      return next;
    });
    setSelectedVerseKeys([]);
  }

  function clearVerseMarkup() {
    if (selectedVerseKeys.length === 0) return;
    setPassageMarkups((current) => {
      const next = { ...current };
      selectedVerseKeys.forEach((key) => delete next[key]);
      return next;
    });
    setPassageMarkupNotes((current) => {
      const next = { ...current };
      selectedVerseKeys.forEach((key) => delete next[key]);
      return next;
    });
    setSelectedVerseKeys([]);
  }

  function toggleVerseSelection(key: string) {
    setSelectedVerseKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  function useSelectedVersesAsFocus() {
    if (selectedVerses.length === 0) {
      setSaveStatus("Select one or more verses in the passage first.");
      return;
    }
    setStudyMethodState((current) => ({
      ...current,
      focusText: selectedVerses.map((verse) => verse.text.trim()).join(" ").slice(0, 1200),
      focusVerseKeys: selectedVerses.map(verseMarkupKey)
    }));
    setSelectedVerseKeys([]);
    setSaveStatus("Scripture focus saved with this study.");
  }

  function useSelectedVersesAsEvidence() {
    if (selectedVerses.length === 0) {
      setSaveStatus("Select one or more verses in the passage first.");
      return;
    }
    setStudyMethodState((current) => ({
      ...current,
      evidenceVerseKeys: Array.from(new Set([
        ...current.evidenceVerseKeys,
        ...selectedVerses.map(verseMarkupKey)
      ])).slice(0, 40)
    }));
    setSelectedVerseKeys([]);
    setSaveStatus(`${selectedVerses.length === 1 ? "Verse reference" : "Verse references"} saved beside your interpretation.`);
  }

  function updateSelectedVerseNote(note: string) {
    if (!selectedHighlightedVerseKey) return;
    setPassageMarkupNotes((current) => ({ ...current, [selectedHighlightedVerseKey]: note }));
  }

  function prepareMemoryCollectionPrompt(source: "study" | "bible", reference: string, translationName: string, verses: BibleVerse[], note?: string) {
    const collectionName = defaultMemoryCollectionName(reference, verses);
    setMemoryCollectionPrompt({ source, reference, translationName, verses, note, collectionName });
  }

  async function saveMemorySelectionAsOne(request: MemoryCollectionPrompt) {
    if (!activeProfileId) return;
    const text = request.verses.map((verse) => verse.text.trim()).join(" ");
    const statusSetter = request.source === "bible" ? setReaderMemoryStatus : setMemoryStatus;
    statusSetter("Saving passage to Memory...");

    try {
      await saveMemoryVerse({
        profileId: activeProfileId,
        localDayKey: localDateKey(),
        reference: request.reference,
        verseText: text,
        translationName: request.translationName,
        note: request.note || undefined
      });
      statusSetter(`${request.reference} was recently added.`);
      setMemoryStatus(`${request.reference} was recently added.`);
      trackUsage("memory_saved", {
        reference: request.reference,
        translation: request.translationName,
        tab: request.source
      });
      if (request.source === "study") setSelectedVerseKeys([]);
      setMemoryCollectionPrompt(null);
    } catch {
      statusSetter("Could not save to Memory. Check your connection and try again.");
    }
  }

  async function saveMemorySelectionAsCollection(request: MemoryCollectionPrompt) {
    if (!activeProfileId || memoryCollectionPromptSaving) return;
    const collectionName = (request.collectionName || defaultMemoryCollectionName(request.reference, request.verses)).trim();
    const sections = splitMemorySelectionIntoSections(request.verses);
    const statusSetter = request.source === "bible" ? setReaderMemoryStatus : setMemoryStatus;

    if (!sections.length) return;
    setMemoryCollectionPromptSaving(true);
    statusSetter(`Creating ${collectionName} collection...`);

    try {
      for (const section of sections) {
        const sectionReference = buildMemorySectionReference(section);
        const memoryVerseId = await saveMemoryVerse({
          profileId: activeProfileId,
          localDayKey: localDateKey(),
          reference: sectionReference,
          verseText: section.map((verse) => verse.text.trim()).join(" "),
          translationName: request.translationName,
          note: request.note || undefined
        });
        await updateMemoryCollections({
          profileId: activeProfileId,
          memoryVerseId,
          collections: [collectionName]
        });
      }

      const message = `${request.reference} was split into ${sections.length} memory sections in ${collectionName}.`;
      statusSetter(message);
      setMemoryStatus(message);
      trackUsage("memory_saved", {
        reference: request.reference,
        translation: request.translationName,
        tab: request.source
      });
      if (request.source === "study") setSelectedVerseKeys([]);
      setMemoryCollectionPrompt(null);
    } catch {
      statusSetter("Could not create that Memory collection. Try a smaller selection.");
    } finally {
      setMemoryCollectionPromptSaving(false);
    }
  }

  function openMemoryBookCollectionBuilder() {
    setMemoryBookCollectionStatus("");
    setMemoryBookCollectionOpen(true);
  }

  function updateMemoryBookCollectionBook(book: string) {
    const chapterCount = BIBLE_CHAPTER_COUNTS[book] || 1;
    setMemoryBookCollectionDraft((current) => ({
      ...current,
      book,
      endChapter: current.mode === "whole" ? String(chapterCount) : String(Math.min(Number(current.endChapter) || chapterCount, chapterCount)),
      collectionName: current.collectionName === current.book || !current.collectionName.trim() ? normalizeBibleBookName(book) : current.collectionName
    }));
  }

  function updateMemoryBookCollectionMode(mode: "whole" | "range") {
    setMemoryBookCollectionDraft((current) => ({
      ...current,
      mode,
      startChapter: mode === "whole" ? "1" : current.startChapter,
      endChapter: mode === "whole" ? String(BIBLE_CHAPTER_COUNTS[current.book] || 1) : current.endChapter
    }));
  }

  async function createMemoryCollectionFromBible() {
    if (!activeProfileId || memoryBookCollectionSaving) return;
    const book = memoryBookCollectionDraft.book;
    const chapterCount = BIBLE_CHAPTER_COUNTS[book] || 1;
    const rawStart = memoryBookCollectionDraft.mode === "whole" ? 1 : Number(memoryBookCollectionDraft.startChapter);
    const rawEnd = memoryBookCollectionDraft.mode === "whole" ? chapterCount : Number(memoryBookCollectionDraft.endChapter);
    const startChapter = Math.max(1, Math.min(chapterCount, Number.isFinite(rawStart) ? Math.round(rawStart) : 1));
    const endChapter = Math.max(startChapter, Math.min(chapterCount, Number.isFinite(rawEnd) ? Math.round(rawEnd) : startChapter));
    const chapters = Array.from({ length: endChapter - startChapter + 1 }, (_, index) => startChapter + index);
    const collectionName = (memoryBookCollectionDraft.collectionName || `${normalizeBibleBookName(book)} ${startChapter}-${endChapter}`).trim();

    if (chapters.length > 40) {
      setMemoryBookCollectionStatus("Choose 40 chapters or fewer at a time so the app can create the collection safely.");
      return;
    }

    setMemoryBookCollectionSaving(true);
    setMemoryBookCollectionStatus(`Creating ${collectionName}...`);

    try {
      for (const chapter of chapters) {
        const reference = buildReaderStudyReference(book, chapter, []);
        const controller = new AbortController();
        const passage = bibleTranslation === "bsb"
          ? await fetchBsbPassage(reference, controller.signal)
          : await fetchBibleApiPassage(reference, bibleTranslation, controller.signal);
        const memoryVerseId = await saveMemoryVerse({
          profileId: activeProfileId,
          localDayKey: localDateKey(),
          reference,
          verseText: (passage.verses || []).map((verse) => verse.text.trim()).join(" "),
          translationName: passage.translation_name
        });
        await updateMemoryCollections({
          profileId: activeProfileId,
          memoryVerseId,
          collections: [collectionName]
        });
      }

      const message = `${collectionName} was created with ${chapters.length} chapter${chapters.length === 1 ? "" : "s"}.`;
      setMemoryBookCollectionStatus(message);
      setMemoryStatus(message);
      setMemoryBookCollectionOpen(false);
      setAddMemoryPanelOpen(false);
      setRememberedMemoryView("browse");
      setRememberedMemoryCollectionFilter(collectionName);
      trackUsage("memory_collection_created", {
        reference: chapters.length === 1 ? `${normalizeBibleBookName(book)} ${startChapter}` : `${normalizeBibleBookName(book)} ${startChapter}-${endChapter}`,
        translation: bibleTranslation.toUpperCase(),
        tab: "memory",
        book
      });
    } catch {
      setMemoryBookCollectionStatus("Could not create that collection. Try a smaller chapter range.");
    } finally {
      setMemoryBookCollectionSaving(false);
    }
  }

  async function saveSelectedVersesToMemory() {
    if (!activeProfileId || selectedVerses.length === 0 || !passageText) return;
    if (selectedVersesAlreadyInMemory) {
      setMemoryStatus("Already in Memory");
      return;
    }

    const reference = buildMemoryReference(selectedVerses);
    const note = selectedVerses
      .map((verse) => passageMarkupNotes[verseMarkupKey(verse)]?.trim())
      .filter(Boolean)
      .join("\n");
    if (shouldOfferMemoryCollectionSplit(selectedVerses)) {
      prepareMemoryCollectionPrompt("study", reference, passageText.translation_name, selectedVerses, note || undefined);
      return;
    }
    setMemoryStatus("Saving verse to Memory...");
    try {
      await saveMemoryVerse({
        profileId: activeProfileId,
        localDayKey: localDateKey(),
        reference,
        verseText: selectedVerses.map((verse) => verse.text.trim()).join(" "),
        translationName: passageText.translation_name,
        note: note || undefined
      });
      setMemoryStatus(`${reference} was recently added.`);
      trackUsage("memory_saved", { reference, translation: passageText.translation_name, tab: "study" });
      setSelectedVerseKeys([]);
    } catch {
      setMemoryStatus("Could not save to Memory. Check your connection and try again.");
    }
  }

  async function saveSelectedReaderVersesToMemory() {
    if (!activeProfileId) {
      setReaderMemoryStatus("Profile is still loading. Try again in a moment.");
      return;
    }
    if (!readerPassage || selectedReaderVerses.length === 0) return;
    if (selectedReaderVersesAlreadyInMemory) {
      setReaderMemoryStatus("Already in Memory");
      setMemoryStatus("Already in Memory");
      return;
    }

    const verses = selectedReaderVerseObjects;
    if (!verses.length) return;
    const reference = buildReaderStudyReference(readerBook, readerChapter, selectedReaderVerses);
    if (shouldOfferMemoryCollectionSplit(verses)) {
      prepareMemoryCollectionPrompt("bible", reference, readerPassage.translation_name, verses);
      return;
    }

    setReaderMemoryStatus("Saving to Memory...");
    try {
      await saveMemoryVerse({
        profileId: activeProfileId,
        localDayKey: localDateKey(),
        reference,
        verseText: verses.map((verse) => verse.text.trim()).join(" "),
        translationName: readerPassage.translation_name
      });
      setReaderMemoryStatus(`${reference} was recently added.`);
      setMemoryStatus(`${reference} was recently added.`);
      trackUsage("memory_saved", {
        reference,
        translation: readerPassage.translation_name,
        tab: "bible",
        book: readerBook,
        chapter: readerChapter
      });
    } catch {
      setReaderMemoryStatus("Could not save to Memory. Check your connection and try again.");
    }
  }

  function openReaderWorksheetOptions() {
    if (!readerPassage || selectedReaderVerseObjects.length === 0) return;
    setPrintWorksheetRequest({
      source: "bible",
      reference: buildReaderStudyReference(readerBook, readerChapter, selectedReaderVerses),
      translation: shortBibleTranslationName(readerPassage.translation_name),
      verses: selectedReaderVerseObjects
    });
  }

  function openStudyWorksheetOptions() {
    if (!passageText?.verses?.length) {
      setSaveStatus("Passage is still loading. Try again in a moment.");
      return;
    }
    const versesToPrint = selectedVerses.length ? selectedVerses : passageText.verses;
    setRememberedPrintWorksheetMethodId(method.id);
    setPrintWorksheetRequest({
      source: "study",
      reference: selectedVerses.length ? buildMemoryReference(selectedVerses) : passageText.reference || passage,
      translation: shortBibleTranslationName(passageText.translation_name),
      verses: versesToPrint
    });
  }

  async function openGroupStudyGuide() {
    if (!passageText?.verses?.length) {
      setSaveStatus("Passage is still loading. Try again in a moment.");
      return;
    }
    if (Platform.OS !== "web" || typeof window === "undefined") {
      setSaveStatus("Printable group guides are available in the web app.");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setSaveStatus("Allow pop-ups to open the group study guide.");
      return;
    }
    const { buildPrintableGroupStudyGuideHtml } = await import("@/data/printableWorksheet");
    const guideHtml = buildPrintableGroupStudyGuideHtml({
      reference: passageText.reference || passage,
      translation: shortBibleTranslationName(passageText.translation_name),
      method,
      verses: passageText.verses
    });
    printWindow.document.open();
    printWindow.document.write(guideHtml);
    printWindow.document.close();
    printWindow.document.title = `${passageText.reference || passage} Group Study Guide`;
    printWindow.focus();
    setSaveStatus("Group guide opened. Your private study answers were not included.");
  }

  async function openPrintableWorksheet() {
    if (!printWorksheetRequest) return;
    if (Platform.OS !== "web" || typeof window === "undefined") {
      if (printWorksheetRequest.source === "bible") {
        setReaderMemoryStatus("Printable worksheets are available in the web app.");
      } else {
        setSaveStatus("Printable worksheets are available in the web app.");
      }
      setPrintWorksheetRequest(null);
      return;
    }

    const selectedMethod = methods.find((item) => item.id === printWorksheetMethodId) || method;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      if (printWorksheetRequest.source === "bible") {
        setReaderMemoryStatus("Allow pop-ups to open the printable worksheet.");
      } else {
        setSaveStatus("Allow pop-ups to open the printable worksheet.");
      }
      return;
    }

    const { buildPrintableStudyWorksheetHtml } = await import("@/data/printableWorksheet");
    const worksheetHtml = buildPrintableStudyWorksheetHtml({
      reference: printWorksheetRequest.reference,
      translation: printWorksheetRequest.translation,
      method: selectedMethod,
      verses: printWorksheetRequest.verses,
      writingSpace: printWorksheetWritingSpace,
      includeMemory: printWorksheetIncludes.memory,
      includeInsight: printWorksheetIncludes.insight
    });

    printWindow.document.open();
    printWindow.document.write(worksheetHtml);
    printWindow.document.close();
    printWindow.document.title = `${printWorksheetRequest.reference} Worksheet`;
    printWindow.focus();
    const status = phoneLayout
      ? "Worksheet opened. On phone, use Share, then Print or Save to Files."
      : printWorksheetRequest.source === "study" && selectedVerses.length
        ? "Printable worksheet opened for selected verses."
        : "Printable worksheet opened.";
    if (printWorksheetRequest.source === "bible") {
      setReaderMemoryStatus(status);
    } else {
      setSaveStatus(status);
    }
    trackUsage("worksheet_printed", {
      reference: printWorksheetRequest.reference,
      methodId: selectedMethod.id,
      methodName: selectedMethod.name,
      translation: printWorksheetRequest.translation,
      tab: printWorksheetRequest.source
    });
    trackPublicAnalytics({
      eventType: "worksheet_cta_clicked",
      source: printWorksheetRequest.source,
      ctaTarget: "/?tab=bible",
      methodId: selectedMethod.id
    });
    setPrintWorksheetRequest(null);
  }

  function openMemoryPrintOptions() {
    if (!(memoryVerses || []).length) {
      setMemoryStatus("Add a memory verse before printing cards.");
      return;
    }
    const savedMemoryVerses = memoryVerses || [];
    const initialSet: MemoryPrintSet = memoryView === "browse"
      ? memoryCollectionFilter !== "all"
        ? "collection"
        : "current"
      : dueMemoryCount > 0 ? "due" : "all";
    const initialCollectionFilter = memoryView === "browse" && memoryCollectionFilter !== "all" ? memoryCollectionFilter : "all";
    const initialVerses = initialSet === "collection"
      ? savedMemoryVerses.filter((verse: any) => getMemoryVerseCollections(verse).includes(initialCollectionFilter))
      : initialSet === "current"
        ? currentBrowseMemoryVerses
        : getMemoryPrintCandidateVerses(initialSet);
    setMemoryPrintSet(initialSet);
    setMemoryPrintCollectionFilter(initialCollectionFilter);
    setMemoryPrintSelectedVerseIds(initialVerses.map((verse: any) => String(verse._id)));
    setMemoryPrintOptionsOpen(true);
  }

  function changeMemoryPrintSet(printSet: MemoryPrintSet) {
    if (printSet === "collection") {
      const defaultCollection = memoryCollectionFilter !== "all" ? memoryCollectionFilter : memoryCollectionOptions[0]?.name || "all";
      changeMemoryPrintCollection(defaultCollection);
      return;
    }
    setRememberedMemoryPrintSet(printSet);
    setMemoryPrintSelectedVerseIds(getMemoryPrintCandidateVerses(printSet).map((verse: any) => String(verse._id)));
  }

  function changeMemoryPrintCollection(collectionName: string) {
    setMemoryPrintCollectionFilter(collectionName);
    const saved = memoryVerses || [];
    const verses = collectionName === "all" ? saved : saved.filter((verse: any) => getMemoryVerseCollections(verse).includes(collectionName));
    setRememberedMemoryPrintSet("collection");
    setMemoryPrintSelectedVerseIds(verses.map((verse: any) => String(verse._id)));
  }

  function clearMemoryBrowseFilters() {
    setRememberedMemoryCollectionFilter("all");
    setMemoryCollectionPickerOpen(false);
    setRememberedMemoryBookFilter("all");
    setRememberedMemoryChapterFilter("all");
    setRememberedMemoryBrowseStatusFilter("all");
    setExpandedMemoryFilterBook("");
    setMemoryFilterMobileMenu(null);
    setRememberedMemoryBrowseFiltersOpen(false);
  }

  function selectMemoryFilterBook(book: string) {
    if (expandedMemoryFilterBook === book) {
      setExpandedMemoryFilterBook("");
      if (memoryBookFilter === book) {
        setRememberedMemoryBookFilter("all");
        setRememberedMemoryChapterFilter("all");
        setRememberedMemoryBrowseFiltersOpen(false);
      }
      return;
    }

    setExpandedMemoryFilterBook(book);
    setRememberedMemoryBookFilter(book);
    setRememberedMemoryChapterFilter("all");
    setMemoryFilterMobileMenu(OLD_TESTAMENT_BOOKS.includes(book) ? "old" : "new");
  }

  function selectMemoryFilterChapter(book: string, chapterKey: string) {
    setRememberedMemoryBookFilter(book);
    setRememberedMemoryChapterFilter(chapterKey);
    setExpandedMemoryFilterBook("");
    setMemoryFilterMobileMenu(null);
    setRememberedMemoryBrowseFiltersOpen(false);
  }

  function toggleMemoryPrintVerse(verseId: string) {
    setMemoryPrintSelectedVerseIds((selectedIds) =>
      selectedIds.includes(verseId)
        ? selectedIds.filter((id) => id !== verseId)
        : [...selectedIds, verseId]
    );
  }

  async function openPrintableMemoryCards() {
    if (!memoryPrintVerses.length) {
      setMemoryStatus("Select at least one saved memory verse before opening cards.");
      return;
    }
    if (Platform.OS !== "web" || typeof window === "undefined") {
      setMemoryStatus("Memory cards are available to print from the web app.");
      setMemoryPrintOptionsOpen(false);
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setMemoryStatus("Allow pop-ups to open printable memory cards.");
      return;
    }

    const { buildPrintableMemoryCardsHtml } = await import("@/data/printableWorksheet");
    const html = buildPrintableMemoryCardsHtml({
      verses: memoryPrintVerses.map((verse: any) => ({
        reference: verse.reference,
        verseText: verse.verseText,
        translationName: verse.translationName
      })),
      layout: memoryPrintLayout,
      copies: memoryPrintCopies,
      safePrint: memoryPrintSafeMode
    });

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.document.title = "Memory Verse Cards";
    printWindow.focus();
    setMemoryStatus(phoneLayout ? "Memory cards opened. On phone, use Share, then Print or Save to Files." : "Printable memory cards opened.");
    trackUsage("memory_cards_printed", {
      reference: memoryPrintSet,
      methodId: memoryPrintLayout,
      methodName: `${memoryPrintCopies} copy${memoryPrintCopies === 1 ? "" : "ies"}`,
      tab: "memory"
    });
    setMemoryPrintOptionsOpen(false);
  }

  async function downloadEditableMemoryCards() {
    if (!memoryPrintVerses.length) {
      setMemoryStatus("Select at least one saved memory verse before downloading cards.");
      return;
    }
    if (Platform.OS !== "web" || typeof window === "undefined" || typeof document === "undefined") {
      setMemoryStatus("Editable memory cards can be downloaded from the web app.");
      return;
    }

    const { buildEditableMemoryCardsDocHtml } = await import("@/data/printableWorksheet");
    const html = buildEditableMemoryCardsDocHtml({
      verses: memoryPrintVerses.map((verse: any) => ({
        reference: verse.reference,
        verseText: verse.verseText,
        translationName: verse.translationName
      })),
      layout: memoryPrintLayout,
      copies: memoryPrintCopies
    });
    const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "memory-verse-cards.doc";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMemoryStatus("Editable memory cards downloaded. Open the file in Word, Pages, or upload it to Google Docs.");
    trackUsage("memory_cards_doc_downloaded", {
      reference: memoryPrintSet,
      methodId: memoryPrintLayout,
      methodName: `${memoryPrintCopies} copy${memoryPrintCopies === 1 ? "" : "ies"}`,
      tab: "memory"
    });
    setMemoryPrintOptionsOpen(false);
  }

  function startMemoryPractice(verse: any, options?: { preserveReviewQueue?: boolean }) {
    if (!options?.preserveReviewQueue) setMemoryReviewQueueIds([]);
    setActiveMemoryVerseId(String(verse._id));
    setActiveMemoryMeditationVerseId("");
    setMemoryPracticeLevel(isMemoryVerseMemorized(verse) ? 1 : clampMemoryPracticeLevel(verse.practiceLevel || 1));
    setMemoryStepTwoOffset((verse.reviewCount || 0) % 2);
    setMemoryPracticeAnswers({});
    setMemoryPracticeResult("");
    setMemoryPracticeChecked(false);
    setMemoryHintsVisible(false);
    setMemoryHintLevels({});
    setMemoryStatus("");
    setMemoryPracticeFocusKey((current) => current + 1);
    setTab("memory");
  }

  function startDueMemoryReviewQueue(collectionName = "all") {
    const dueVerses = (memoryQueueSections.find((section) => section.title === "Due for Review")?.verses || [])
      .filter((verse: any) => collectionName === "all" || getMemoryVerseCollections(verse).includes(collectionName));
    if (!dueVerses.length) return;

    setMemoryReviewQueueIds(dueVerses.map((verse: any) => String(verse._id)));
    setRememberedMemoryView("review");
    startMemoryPractice(dueVerses[0], { preserveReviewQueue: true });
  }

  async function saveMemoryVerseCollections(verse: any, nextCollections: string[]) {
    if (!activeProfileId) return;
    const verseId = String(verse._id);
    try {
      await updateMemoryCollections({
        profileId: activeProfileId,
        memoryVerseId: verse._id,
        collections: nextCollections
      });
      setCollectionMemoryVerseId("");
      setMemoryCollectionDraft("");
      setMemoryMoreVerseId("");
      setMemoryStatus(`${verse.reference} collections updated.`);
    } catch {
      setMemoryStatus(`Could not update collections for ${verse.reference}.`);
    }
  }

  function addMemoryVerseCollection(verse: any) {
    const newCollection = memoryCollectionDraft.trim().replace(/\s+/g, " ");
    if (!newCollection) return;
    Keyboard.dismiss();
    const collections = getMemoryVerseCollections(verse);
    saveMemoryVerseCollections(verse, [...collections, newCollection]);
  }

  function removeMemoryVerseCollection(verse: any, collectionName: string) {
    saveMemoryVerseCollections(verse, getMemoryVerseCollections(verse).filter((collection: string) => collection !== collectionName));
  }

  function stopMemoryReviewQueue() {
    setMemoryReviewQueueIds([]);
    setActiveMemoryVerseId("");
    setMemoryPracticeAnswers({});
    setMemoryPracticeResult("");
    setMemoryPracticeChecked(false);
    setMemoryHintsVisible(false);
    setMemoryHintLevels({});
    setMemoryStatus("Review set stopped. You can continue any due verse when you are ready.");
    scrollMemoryToTop();
  }

  function startMemoryMeditation(verse: any) {
    const verseId = String(verse._id);
    setMemoryReviewQueueIds([]);
    setActiveMemoryVerseId("");
    setActiveMemoryMeditationVerseId(verseId);
    setExpandedMemoryVerseIds((current) => current.includes(verseId) ? current : [...current, verseId]);
    setReviewScheduleVerseId("");
    setHistoryMemoryVerseId("");
    setMemoryMeditationStep(0);
    setMemoryMeditationPhrase("");
    setMemoryMeditationReflection("");
    setMemoryMeditationPrayer("");
    setMemoryMeditationCarry("");
    setMemoryStatus("");
    setTab("memory");
  }

  function closeMemoryMeditation() {
    setActiveMemoryMeditationVerseId("");
    setMemoryMeditationStep(0);
    setMemoryMeditationPhrase("");
    setMemoryMeditationReflection("");
    setMemoryMeditationPrayer("");
    setMemoryMeditationCarry("");
  }

  function focusMemoryBlankAfter(index: number, answers: Record<number, string>) {
    const currentPosition = memoryBlankTokens.findIndex((token) => token.index === index);
    const nextToken = memoryBlankTokens
      .slice(Math.max(0, currentPosition + 1))
      .find((token) => normalizeMemoryAnswer(answers[token.index] || "") !== normalizeMemoryAnswer(token.answer));

    if (nextToken) {
      setTimeout(() => {
        focusMemoryBlankWithRowCheck(index, nextToken.index);
      }, phoneLayout ? 120 : 80);
      return;
    }

    if (memoryBlankVisibilityTimerRef.current) clearTimeout(memoryBlankVisibilityTimerRef.current);
    memoryBlankVisibilityTimerRef.current = null;
    Keyboard.dismiss();
    setTimeout(() => scrollMemoryPracticeBy(150), 140);
  }

  function updateMemoryPracticeAnswer(index: number, value: string) {
    const token = memoryBlankTokens.find((item) => item.index === index);
    const correctedValue = token && normalizeMemoryAnswer(value) === normalizeMemoryAnswer(token.answer) ? token.answer : value;
    const nextAnswers = { ...memoryPracticeAnswers, [index]: correctedValue };
    setMemoryPracticeAnswers((current) => ({ ...current, [index]: correctedValue }));
    setMemoryPracticeResult("");
    if (token && normalizeMemoryAnswer(correctedValue) === normalizeMemoryAnswer(token.answer)) {
      focusMemoryBlankAfter(index, nextAnswers);
    }
  }

  function moveMemoryPracticeStep(level: number) {
    const nextLevel = clampMemoryPracticeLevel(level);
    setMemoryPracticeLevel(nextLevel);
    if (nextLevel === 2) setMemoryStepTwoOffset((current) => (current === 0 ? 1 : 0));
    setMemoryPracticeAnswers({});
    setMemoryPracticeResult("");
    setMemoryPracticeChecked(false);
    setMemoryHintsVisible(false);
    setMemoryHintLevels({});
    setMemoryPracticeFocusKey((current) => current + 1);
  }

  function showMoreMemoryHint(index: number) {
    setMemoryHintsVisible(true);
    setMemoryHintLevels((current) => ({ ...current, [index]: Math.min(8, (current[index] || 1) + 1) }));
  }

  async function submitMemoryPractice() {
    if (!activeMemoryVerse) return;

    if (memoryPracticeLevel === 1) {
      moveMemoryPracticeStep(2);
      setMemoryPracticeResult(`Nice${firstName ? `, ${firstName}` : ""}. Now try every second word from memory.`);
      return;
    }

    const filledCount = memoryBlankTokens.filter((token) => (memoryPracticeAnswers[token.index] || "").trim()).length;
    setMemoryPracticeChecked(true);
    setMemoryPracticeResult(
      memoryPracticeAllCorrect
        ? memoryPracticeLevel >= 3
          ? "Correct. Finish this verse when you are ready."
          : "Correct. Move to the final step when you are ready."
        : filledCount === memoryBlankTokens.length
        ? "A few words need another look. Check the verse, then try again."
        : "Fill in each blank, then check your answer."
    );
  }

  async function continueMemoryPractice(forceCorrect = false) {
    if (!activeMemoryVerse || (!memoryPracticeAllCorrect && !forceCorrect)) return;
    const completedFinalStep = memoryPracticeLevel >= 3;
    await markMemoryPractice("got-it");
    if (completedFinalStep) {
      const completedVerseId = String(activeMemoryVerse._id);
      const queueIndex = memoryReviewQueueIds.findIndex((id) => id === completedVerseId);
      const nextQueueId = queueIndex >= 0 ? memoryReviewQueueIds[queueIndex + 1] : "";
      const nextVerse = nextQueueId ? (memoryVerses || []).find((verse: any) => String(verse._id) === nextQueueId) : null;
      setActiveMemoryVerseId("");
      setExpandedMemoryVerseIds((current) => current.filter((id) => id !== completedVerseId));
      if (nextVerse) {
        startMemoryPractice(nextVerse, { preserveReviewQueue: true });
        setMemoryStatus("");
        return;
      }
      setMemoryReviewQueueIds([]);
      setMemoryStatus("reviewed-today");
      scrollMemoryToTop();
      return;
    }
    setMemoryPracticeResult("Great. Now try the full verse from blanks.");
  }

  function repeatMemoryPracticeStep() {
    if (memoryPracticeLevel <= 1) return;
    if (activeProfileId && activeMemoryVerse) {
      recordMemoryHistoryEvent({
        profileId: activeProfileId,
        memoryVerseId: activeMemoryVerse._id,
        event: "repeated",
        practiceLevel: memoryPracticeLevel,
        localDayKey: localDayKey()
      }).catch(() => {});
    }
    if (memoryPracticeLevel === 2) setMemoryStepTwoOffset((current) => (current === 0 ? 1 : 0));
    setMemoryPracticeAnswers({});
    setMemoryPracticeChecked(false);
    setMemoryHintsVisible(false);
    setMemoryHintLevels({});
    setMemoryPracticeResult(memoryPracticeLevel === 2 ? "Repeat step 2 with a fresh set of blanks." : "Repeat step 3 from the beginning.");
    setMemoryPracticeFocusKey((current) => current + 1);
  }

  async function markMemoryPractice(result: "got-it") {
    if (!activeProfileId || !activeMemoryVerse) return;

    await recordMemoryPractice({
      profileId: activeProfileId,
      memoryVerseId: activeMemoryVerse._id,
      result,
      practiceLevel: memoryPracticeLevel,
      localDayKey: localDayKey()
    });
    setMemoryPracticeLevel((current) => Math.min(3, current + 1));
    setMemoryPracticeAnswers({});
    setMemoryPracticeResult("");
    setMemoryPracticeChecked(false);
    setMemoryHintsVisible(false);
    setMemoryHintLevels({});
    setMemoryStatus(`Nice${firstName ? `, ${firstName}` : ""}. Review scheduled.`);
  }

  async function saveMemoryMeditation(verse: any) {
    if (!activeProfileId) return;
    const phrase = memoryMeditationPhrase.trim();
    const reflection = memoryMeditationReflection.trim();
    const prayer = memoryMeditationPrayer.trim();
    const carry = memoryMeditationCarry.trim();
    if (!phrase && !reflection && !prayer && !carry) {
      setMemoryStatus("Add one thought before saving this meditation.");
      return;
    }

    try {
      await saveSession({
        profileId: activeProfileId,
        localDayKey: localDateKey(),
        passage: verse.reference,
        methodId: "memory-meditation",
        methodName: "Memory Meditation",
        shareNote: carry ? `Carry today: ${carry}` : undefined,
        minutes: 5,
        answers: [
          { stepTitle: "Scripture", answer: `${verse.reference} (${shortBibleTranslationName(verse.translationName)})\n\n${verse.verseText}` },
          { stepTitle: "Notice", answer: phrase || "No phrase saved." },
          { stepTitle: "Reflect", answer: reflection || "No reflection saved." },
          { stepTitle: "Pray", answer: prayer || "No prayer saved." },
          { stepTitle: "Carry", answer: carry || "No carry thought saved." }
        ]
      });
      await recordMemoryHistoryEvent({
        profileId: activeProfileId,
        localDayKey: localDateKey(),
        memoryVerseId: verse._id,
        event: "meditated",
        practiceLevel: verse.practiceLevel || 1
      });
      closeMemoryMeditation();
      setMemoryStatus(`Saved. Carry ${verse.reference} with you today${firstName ? `, ${firstName}` : ""}.`);
    } catch {
      setMemoryStatus("Could not save that meditation. Please try again.");
    }
  }

  async function deleteMemoryVerse(verse: any) {
    if (!activeProfileId) return;

    const verseId = String(verse._id);
    if (pendingDeleteMemoryVerseId !== verseId) {
      setPendingDeleteMemoryVerseId(verseId);
      setMemoryStatus("Tap Confirm remove to delete this memory verse.");
      return;
    }

    await removeMemoryVerse({ profileId: activeProfileId, memoryVerseId: verse._id });
    if (activeMemoryVerseId === verseId) setActiveMemoryVerseId("");
    if (activeMemoryMeditationVerseId === verseId) closeMemoryMeditation();
    setMemoryReviewQueueIds((current) => current.filter((id) => id !== verseId));
    setPendingDeleteMemoryVerseId("");
    setMemoryStatus("Memory verse removed");
  }

  async function scheduleMemoryVerseReview(verse: any, preset: MemoryReviewPreset) {
    if (!activeProfileId) return;

    const reference = verse.reference || "Memory verse";
    const reviewLabel = reviewPresetLabel(preset).toLowerCase();
    try {
      await scheduleMemoryReview({ profileId: activeProfileId, memoryVerseId: verse._id, preset });
      setReviewScheduleVerseId("");
      setExpandedReviewOptionsVerseId("");
      setMemoryStatus(`${reference} review was changed to ${reviewLabel}.`);
    } catch {
      setMemoryStatus(`Could not change the review timing for ${reference}.`);
    }
  }

  async function scheduleFilteredMemoryReview(preset: MemoryReviewPreset) {
    if (!activeProfileId) return;
    const filteredVerses = currentBrowseMemoryVerses;
    if (filteredVerses.length === 0) {
      setMemoryStatus("No filtered verses to update.");
      return;
    }

    const reviewLabel = reviewPresetLabel(preset).toLowerCase();
    try {
      await Promise.all(filteredVerses.map((verse: any) => scheduleMemoryReview({ profileId: activeProfileId, memoryVerseId: verse._id, preset })));
      const collectionText = memoryCollectionFilter !== "all" ? ` in ${memoryCollectionFilter}` : "";
      setBulkReviewOptionsExpanded(false);
      setMemoryStatus(`${filteredVerses.length} filtered verse${filteredVerses.length === 1 ? "" : "s"}${collectionText} changed to ${reviewLabel}.`);
    } catch {
      setMemoryStatus("Could not update every filtered verse. Please try again.");
    }
  }

  function togglePinnedJournalEntry(entryId: string) {
    setPinnedJournalEntryIds((current) => {
      const next = current.includes(entryId) ? current.filter((id) => id !== entryId) : [entryId, ...current];
      persistPinnedJournalEntries(next);
      return next;
    });
  }

  function toggleJournalEntryExpanded(entryId: string) {
    setExpandedJournalEntryIds((current) =>
      current.includes(entryId) ? current.filter((id) => id !== entryId) : [entryId, ...current]
    );
  }

  function isJournalEntryExpanded(entryId: string) {
    return expandedJournalEntryIds.includes(entryId);
  }

  function moveReaderChapter(direction: -1 | 1) {
    if (readerPlanReadingActive && readerPlanReading?.chunks?.length) {
      const currentIndex = Math.min(Math.max(readerPlanReading.currentChunkIndex || 0, 0), readerPlanReading.chunks.length - 1);
      const nextIndex = currentIndex + direction;
      const nextChunk = readerPlanReading.chunks[nextIndex];
      if (!nextChunk) return;
      setReaderPlanReading({
        ...readerPlanReading,
        currentChunkIndex: nextIndex,
        book: nextChunk.book,
        chapter: nextChunk.chapter
      });
      setReaderBook(nextChunk.book);
      setReaderChapter(nextChunk.chapter);
      setReaderChapterDraft(String(nextChunk.chapter));
      setSelectedReaderVerses([]);
      setReaderActionVerse(0);
      scrollReaderToTop();
      return;
    }

    setReaderPlanReading(null);
    const currentBookIndex = bibleBooks.indexOf(readerBook);
    const currentChapterCount = BIBLE_CHAPTER_COUNTS[readerBook] || 1;
    const nextChapter = readerChapter + direction;

    if (nextChapter >= 1 && nextChapter <= currentChapterCount) {
      setReaderChapter(nextChapter);
      scrollReaderToTop();
      return;
    }

    const nextBook = bibleBooks[currentBookIndex + direction];
    if (!nextBook) return;
    setReaderBook(nextBook);
    setReaderChapter(direction === 1 ? 1 : BIBLE_CHAPTER_COUNTS[nextBook] || 1);
    scrollReaderToTop();
  }

  function scrollReaderToTop() {
    setTimeout(() => appScrollRef.current?.scrollTo?.({ y: 0, animated: true }), 50);
  }

  function openPrivacyPolicyFromAccountIntro() {
    setRememberedAccountPrivacyOpen(true);
    setRememberedOpenLegalSection("privacy");
    const scrollToLegal = () => {
      appScrollRef.current?.scrollTo?.({ y: Math.max(0, accountLegalYRef.current - (phoneLayout ? 82 : 18)), animated: true });
    };
    setTimeout(scrollToLegal, 80);
    setTimeout(scrollToLegal, 220);
  }

  function scrollReaderToVerse(verseNumber: number) {
    setTimeout(() => {
      const y = readerVerseYRef.current[verseNumber];
      if (typeof y !== "number") return;
      appScrollRef.current?.scrollTo?.({ y: Math.max(0, readerPassageBoxYRef.current + y - (phoneLayout ? 96 : 118)), animated: true });
    }, 120);
  }

  function selectReaderBook(book: string) {
    if (expandedMobileReaderBook === book) {
      setExpandedMobileReaderBook("");
      return;
    }
    setExpandedMobileReaderBook(book);
  }

  function selectMobileReaderBook(book: string) {
    if (expandedMobileReaderBook === book) {
      setExpandedMobileReaderBook("");
      return;
    }
    setExpandedMobileReaderBook(book);
    setReaderMobileMenu(OLD_TESTAMENT_BOOKS.includes(book) ? "old" : "new");
  }

  function selectReaderChapter(chapter: number, book = readerBook) {
    setReaderPlanReading(null);
    setReaderBook(book);
    setReaderChapter(chapter);
    scrollReaderToTop();
    setRememberedPanel(setReaderNavCollapsed, "bibleReaderNavCollapsed", true);
    setExpandedMobileReaderBook("");
    setReaderMobileMenu(null);
  }

  function openBibleReaderHistoryItem(item: StoredBibleReaderHistoryItem) {
    setReaderPlanReading(null);
    setReaderBook(item.book);
    setReaderChapter(Math.min(Math.max(item.chapter, 1), BIBLE_CHAPTER_COUNTS[item.book] || 1));
    setReaderChapterDraft(String(item.chapter));
    if (item.translation !== bibleTranslation) {
      setBibleTranslation(item.translation);
      saveStoredBibleTranslation(item.translation).catch(() => undefined);
    }
    setReaderNavCollapsed(true);
    scrollReaderToTop();
  }

  function clearBibleReaderHistory() {
    setBibleReaderHistory([]);
    saveStoredBibleReaderHistory([]).catch(() => undefined);
    persistBibleReaderState({ history: [] });
  }

  function toggleReaderChapterRead() {
    const wasRead = currentChapterRead;
    setReadBibleChapters((current) => {
      const currentBookChapters = current[readerBook] || [];
      const chapterSet = new Set(currentBookChapters);
      if (chapterSet.has(readerChapter)) {
        chapterSet.delete(readerChapter);
      } else {
        chapterSet.add(readerChapter);
      }

      const nextBookChapters = Array.from(chapterSet).sort((a, b) => a - b);
      const next = { ...current };
      if (nextBookChapters.length) {
        next[readerBook] = nextBookChapters;
      } else {
        delete next[readerBook];
      }
      saveStoredBibleReadChapters(next).catch(() => undefined);
      persistBibleReaderState({ readChapters: next });
      return next;
    });
    if (!wasRead) {
      trackUsage("chapter_read", {
        reference: buildReaderStudyReference(readerBook, readerChapter, []),
        tab: "bible",
        book: readerBook,
        chapter: readerChapter
      });
    }
  }

  function clearBibleReadingProgress() {
    setReadBibleChapters({});
    saveStoredBibleReadChapters({}).catch(() => undefined);
    persistBibleReaderState({ readChapters: {} });
  }

  function clearBibleReadBook(book: string) {
    setReadBibleChapters((current) => {
      if (!current[book]?.length) return current;
      const next = { ...current };
      delete next[book];
      saveStoredBibleReadChapters(next).catch(() => undefined);
      persistBibleReaderState({ readChapters: next });
      return next;
    });
  }

  function persistBibleReadingPlanProgress(
    activePlanId: string,
    completedDays: string[],
    customPlans = customBibleReadingPlans,
    startDates = bibleReadingPlanStartDates,
    followedPlanIds = followedBibleReadingPlanIds,
    completedPlanDates = bibleReadingPlanCompletionDates,
    completionCounts = bibleReadingPlanCompletionCounts,
    acknowledgedCareNotes = acknowledgedBibleReadingCareNotes
  ) {
    const progress = currentBibleReadingPlanProgress(activePlanId, completedDays, customPlans, startDates, followedPlanIds, completedPlanDates, completionCounts, acknowledgedCareNotes);
    setStoredBibleReadingPlanProgress(progress);
    setStoredBibleReadingPlanProgressHydrated(true);
    saveStoredBibleReadingPlanProgress(progress).catch(() => undefined);
    persistBibleReaderState({ readingPlanProgress: progress });
  }

  function shouldShowBibleReadingCareNote(careNote?: string) {
    if (!careNote) return false;
    const key = bibleReadingCareNoteKey(careNote);
    return !!key && !acknowledgedBibleReadingCareNotes.includes(key);
  }

  function acknowledgeBibleReadingCareNote(careNote: string) {
    const key = bibleReadingCareNoteKey(careNote);
    if (!key) return;
    setAcknowledgedBibleReadingCareNotes((current) => {
      if (current.includes(key)) return current;
      const next = [...current, key].slice(-20);
      persistBibleReadingPlanProgress(
        selectedBibleReadingPlanId || activeBibleReadingPlanId,
        completedBibleReadingPlanDays,
        customBibleReadingPlans,
        bibleReadingPlanStartDates,
        followedBibleReadingPlanIds,
        bibleReadingPlanCompletionDates,
        bibleReadingPlanCompletionCounts,
        next
      );
      return next;
    });
  }

  function selectBibleReadingPlan(planId: string) {
    const nextState = followBibleReadingPlanState({
      planId,
      allPlans: allBibleReadingPlans,
      followedPlanIds: followedBibleReadingPlanIds,
      activePlanId: activeBibleReadingPlanId,
      startDates: bibleReadingPlanStartDates,
      completedDayKeys: completedBibleReadingPlanDays,
      todayKey: localDateKey()
    });
    if (!nextState) return;
    if (nextState.blocked) {
      setBiblePlanStatus(`You can follow up to ${MAX_FOLLOWED_BIBLE_READING_PLANS} reading plans at once. Stop one before adding another.`);
      return;
    }
    setActiveBibleReadingPlanId(nextState.activePlanId);
    setFollowedBibleReadingPlanIds(nextState.followedPlanIds);
    setRememberedExpandedBiblePlanId(nextState.activePlanId);
    setRememberedPlanSelectedDay(nextState.activePlanId, 0);
    setBibleReadingPlanStartDates(nextState.startDates);
    setBiblePlanStatus("");
    persistBibleReadingPlanProgress(nextState.activePlanId, completedBibleReadingPlanDays, customBibleReadingPlans, nextState.startDates, nextState.followedPlanIds);
    trackUsage("bible_reading_plan_selected", { reference: nextState.activePlanId, tab: "bible" });
  }

  function catchUpActiveBibleReadingPlanDates(planId = activeBibleReadingPlan?.id || "") {
    const plan = allBibleReadingPlans.find((item) => item.id === planId);
    const nextState = catchUpBibleReadingPlanDatesState({
      plan,
      completedDayKeys: completedBibleReadingPlanDays,
      startDates: bibleReadingPlanStartDates,
      todayKey: localDateKey(),
      addDaysToDateKey,
      startDateForDay: (day) => {
        const today = new Date();
        const nextStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        nextStart.setDate(nextStart.getDate() - (day - 1));
        return localDateKey(nextStart);
      }
    });
    if (!plan || !nextState) return null;
    setBibleReadingPlanStartDates(nextState.startDates);
    setBiblePlanStatus(`${plan.title} now continues from today.`);
    persistBibleReadingPlanProgress(plan.id, completedBibleReadingPlanDays, customBibleReadingPlans, nextState.startDates);
    trackUsage("bible_reading_plan_caught_up", { reference: plan.id, tab: "plans" });
    return nextState.startDates;
  }

  function stopFollowingBibleReadingPlan(planId = activeBibleReadingPlan?.id || "") {
    const nextState = stopFollowingBibleReadingPlanState({
      planId,
      allPlans: allBibleReadingPlans,
      followedPlanIds: followedBibleReadingPlanIds,
      activePlanId: activeBibleReadingPlanId
    });
    if (!nextState) return;
    const stoppedPlanHasProgress = completedBibleReadingPlanDays.some((key) => key.startsWith(`${nextState.stoppedPlan.id}:`));
    const nextStartDates = stoppedPlanHasProgress
      ? bibleReadingPlanStartDates
      : Object.fromEntries(Object.entries(bibleReadingPlanStartDates).filter(([id]) => id !== nextState.stoppedPlan.id));
    setFollowedBibleReadingPlanIds(nextState.followedPlanIds);
    setActiveBibleReadingPlanId(nextState.activePlanId);
    if (!stoppedPlanHasProgress) setBibleReadingPlanStartDates(nextStartDates);
    if (readerPlanReading?.planId === nextState.stoppedPlan.id) setReaderPlanReading(null);
    setRememberedExpandedBiblePlanId(nextState.activePlanId);
    if (nextState.activePlanId) {
      setRememberedPlanSelectedDay(nextState.activePlanId, 0);
    } else {
      setActiveBiblePlanSelectedDay(0);
      setActiveBiblePlanSelectedPlanId("");
      persistUiPreference("plansSelectedPlanDay", "");
    }
    setBiblePlanStatus(`${nextState.stoppedPlan.title} is no longer followed.`);
    persistBibleReadingPlanProgress(nextState.activePlanId, completedBibleReadingPlanDays, customBibleReadingPlans, nextStartDates, nextState.followedPlanIds);
    trackUsage("bible_reading_plan_stopped", { reference: nextState.stoppedPlan.id, tab: "plans" });
  }

  function restartBibleReadingPlan(planId: string) {
    const plan = allBibleReadingPlans.find((item) => item.id === planId);
    if (!plan) return;
    const nextStartDates = { ...bibleReadingPlanStartDates, [plan.id]: localDateKey() };
    const nextCompletedDays = completedBibleReadingPlanDays.filter((key) => !key.startsWith(`${plan.id}:`));
    const nextCompletionDates = { ...bibleReadingPlanCompletionDates };
    delete nextCompletionDates[plan.id];
    const nextFollowedPlanIds = Array.from(new Set([plan.id, ...followedBibleReadingPlanIds])).slice(0, MAX_STORED_BIBLE_READING_PLAN_IDS);
    setCompletedBibleReadingPlanDays(nextCompletedDays);
    setBibleReadingPlanStartDates(nextStartDates);
    setBibleReadingPlanCompletionDates(nextCompletionDates);
    setFollowedBibleReadingPlanIds(nextFollowedPlanIds);
    setActiveBibleReadingPlanId(plan.id);
    setRememberedExpandedBiblePlanId(plan.id);
    setRememberedPlanSelectedDay(plan.id, 1);
    if (readerPlanReading?.planId === plan.id) setReaderPlanReading(null);
    setBiblePlanStatus(`${plan.title} restarted from Day 1.`);
    persistBibleReadingPlanProgress(plan.id, nextCompletedDays, customBibleReadingPlans, nextStartDates, nextFollowedPlanIds, nextCompletionDates);
    trackUsage("bible_reading_plan_restarted", { reference: plan.id, tab: "plans" });
  }

  function incrementBibleReadingPlanCompletionCount(planId: string) {
    return {
      ...bibleReadingPlanCompletionCounts,
      [planId]: Math.min(MAX_BIBLE_READING_PLAN_COMPLETION_COUNT, Math.max(0, Math.round(Number(bibleReadingPlanCompletionCounts[planId]) || 0)) + 1)
    };
  }

  function requestRestartBibleReadingPlan(planId: string) {
    const plan = allBibleReadingPlans.find((item) => item.id === planId);
    if (!plan) return;
    const message = `${plan.title} will start again from Day 1 today. Your previous completed-day ticks for this plan will be cleared.`;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (window.confirm(`${message}\n\nRestart this plan?`)) {
        restartBibleReadingPlan(plan.id);
      }
      return;
    }

    Alert.alert("Restart reading plan?", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Restart", onPress: () => restartBibleReadingPlan(plan.id) }
    ]);
  }

  function requestStopFollowingBibleReadingPlan(planId = activeBibleReadingPlan?.id || "") {
    const plan = allBibleReadingPlans.find((item) => item.id === planId);
    if (!plan) return;
    const completedCount = plan.days.filter((day) => completedBibleReadingPlanDaySet.has(bibleReadingPlanDayKey(plan.id, day.day))).length;
    const planComplete = plan.days.length > 0 && completedCount >= plan.days.length;
    if (completedCount <= 0) {
      stopFollowingBibleReadingPlan(plan.id);
      return;
    }

    const message = planComplete
      ? `${plan.title} is complete. Your progress will stay saved, but this plan will be removed from Completed plans.`
      : `You have completed ${completedCount} ${completedCount === 1 ? "day" : "days"} in ${plan.title}. Your progress will stay saved, but this plan will be removed from Active plans.`;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (window.confirm(`${message}\n\n${planComplete ? "Remove this completed plan?" : "Stop following this plan?"}`)) {
        stopFollowingBibleReadingPlan(plan.id);
      }
      return;
    }

    Alert.alert(planComplete ? "Remove completed plan?" : "Stop following plan?", message, [
      { text: "Cancel", style: "cancel" },
      { text: planComplete ? "Remove" : "Stop following", style: "destructive", onPress: () => stopFollowingBibleReadingPlan(plan.id) }
    ]);
  }

  function getOverduePlanReadingBlock(plan: BibleReadingPlan | undefined, requestedDay: BibleReadingPlanDay) {
    if (!plan) return null;
    const firstIncompleteDay = plan.days.find((day) => !completedBibleReadingPlanDaySet.has(bibleReadingPlanDayKey(plan.id, day.day)));
    const firstIncompleteDateKey = firstIncompleteDay && bibleReadingPlanStartDates[plan.id]
      ? addDaysToDateKey(bibleReadingPlanStartDates[plan.id], firstIncompleteDay.day - 1)
      : "";
    if (
      firstIncompleteDay &&
      firstIncompleteDay.day !== requestedDay.day &&
      firstIncompleteDateKey &&
      firstIncompleteDateKey < localDateKey()
    ) {
      return { firstIncompleteDay, firstIncompleteDateKey };
    }
    return null;
  }

  function openBibleReadingPlanDayInBible(planDay: BibleReadingPlanDay, planId = activeBibleReadingPlan?.id || "", options: { skipOverdueGuard?: boolean } = {}) {
    if (openBibleReadingPlanDay(planDay, planId, options)) setTab("bible");
  }

  function openBibleReadingPlanDay(planDay: BibleReadingPlanDay, planId = activeBibleReadingPlan?.id || "", options: { skipOverdueGuard?: boolean } = {}) {
    const plan = allBibleReadingPlans.find((item) => item.id === planId);
    const overdueBlock = options.skipOverdueGuard ? null : getOverduePlanReadingBlock(plan, planDay);
    if (plan && overdueBlock) {
      setActiveBibleReadingPlanId(plan.id);
      setRememberedPlanSelectedDay(plan.id, planDay.day);
      setPendingBiblePlanReadAhead({
        planId: plan.id,
        requestedDay: planDay.day,
        missedDay: overdueBlock.firstIncompleteDay.day,
        missedDateKey: overdueBlock.firstIncompleteDateKey,
        requestedReference: planDay.reference
      });
      return false;
    }
    const nextPlanReading = planId ? buildReaderPlanReading(planDay, planId) : null;
    const nextBook = nextPlanReading?.book || planDay.readerBook;
    const nextChapter = nextPlanReading?.chapter || Math.max(1, Math.round(Number(planDay.readerChapter) || 1));
    setReaderBook(nextBook);
    setReaderChapter(nextChapter);
    setReaderChapterDraft(String(nextChapter));
    setSelectedReaderVerses([]);
    setReaderActionVerse(0);
    setReaderPlanReading(nextPlanReading);
    if (phoneLayout) {
      setRememberedPanel(setReaderNavCollapsed, "bibleReaderNavCollapsed", true);
      setExpandedMobileReaderBook("");
      setReaderMobileMenu(null);
    }
    scrollReaderToTop();
    trackUsage("bible_reading_plan_opened", { reference: nextPlanReading?.reference || planDay.reference, tab: "bible", book: nextBook, chapter: nextChapter });
    return true;
  }

  function openPendingMissedBiblePlanDay(prompt: PendingBiblePlanReadAhead) {
    const plan = allBibleReadingPlans.find((item) => item.id === prompt.planId);
    const missedDay = plan?.days.find((day) => day.day === prompt.missedDay);
    if (!plan || !missedDay) return;
    setPendingBiblePlanReadAhead(null);
    setActiveBibleReadingPlanId(plan.id);
    setRememberedPlanSelectedDay(plan.id, missedDay.day);
    openBibleReadingPlanDayInBible(missedDay, plan.id);
  }

  function catchUpAndOpenPendingBiblePlanDay(prompt: PendingBiblePlanReadAhead) {
    const plan = allBibleReadingPlans.find((item) => item.id === prompt.planId);
    const requestedDay = plan?.days.find((day) => day.day === prompt.requestedDay);
    if (!plan || !requestedDay) return;
    setPendingBiblePlanReadAhead(null);
    setActiveBibleReadingPlanId(plan.id);
    setRememberedPlanSelectedDay(plan.id, requestedDay.day);
    catchUpActiveBibleReadingPlanDates(plan.id);
    openBibleReadingPlanDayInBible(requestedDay, plan.id, { skipOverdueGuard: true });
  }

  function openFollowedBibleReadingPlan(planId: string) {
    const plan = followedBibleReadingPlans.find((item) => item.id === planId);
    if (!plan) return;
    const nextDay = plan.days.find((day) => !completedBibleReadingPlanDaySet.has(bibleReadingPlanDayKey(plan.id, day.day))) || plan.days[0];
    if (!nextDay) return;
    setActiveBibleReadingPlanId(plan.id);
    setRememberedPlanSelectedDay(plan.id, nextDay.day);
    persistBibleReadingPlanProgress(plan.id, completedBibleReadingPlanDays);
    openBibleReadingPlanDay(nextDay, plan.id);
  }

  function exitBibleReadingPlanMode() {
    setReaderPlanReading(null);
    setSelectedReaderVerses([]);
    setReaderActionVerse(0);
    scrollReaderToTop();
  }

  function queueBiblePlanContinueCheck(plan: BibleReadingPlan, completedDay: BibleReadingPlanDay) {
    setPendingBiblePlanContinueCheck({
      planId: plan.id,
      completedDay: completedDay.day,
      completedReference: completedDay.reference,
      requestId: Date.now()
    });
  }

  function openPendingContinueBiblePlanDay(prompt: PendingBiblePlanContinuePrompt) {
    const plan = allBibleReadingPlans.find((item) => item.id === prompt.planId);
    const nextDay = plan?.days.find((day) => day.day === prompt.nextDay);
    if (!plan || !nextDay) return;
    setPendingBiblePlanContinuePrompt(null);
    setActiveBibleReadingPlanId(plan.id);
    setRememberedPlanSelectedDay(plan.id, nextDay.day);
    openBibleReadingPlanDayInBible(nextDay, plan.id, { skipOverdueGuard: true });
  }

  function chooseAnotherBibleReadingPlanAfterCelebration() {
    setPendingBiblePlanCompletionCelebration(null);
    setTab("plans");
    setRememberedCompletedBiblePlansOpen(false);
    setTimeout(() => appScrollRef.current?.scrollTo?.({ y: 0, animated: true }), 80);
  }

  function markBibleReadingPlanDayComplete(planDay: BibleReadingPlanDay, planId = activeBibleReadingPlan?.id || "", options: { promptForNextDueReading?: boolean } = {}) {
    const plan = allBibleReadingPlans.find((item) => item.id === planId);
    const firstIncompleteDay = plan?.days.find((day) => !completedBibleReadingPlanDaySet.has(bibleReadingPlanDayKey(planId, day.day)));
    const firstIncompleteDateKey = plan && firstIncompleteDay && bibleReadingPlanStartDates[plan.id]
      ? addDaysToDateKey(bibleReadingPlanStartDates[plan.id], firstIncompleteDay.day - 1)
      : "";
    if (
      plan &&
      firstIncompleteDay &&
      firstIncompleteDay.day !== planDay.day &&
      firstIncompleteDateKey &&
      firstIncompleteDateKey < localDateKey()
    ) {
      setBiblePlanStatus(
        `${plan.title} is behind. Complete Day ${firstIncompleteDay.day} first, or use Catch me up to move the plan forward.`
      );
      return;
    }
    const nextState = completeBibleReadingPlanDayState({ plan, planDay, planId, completedDayKeys: completedBibleReadingPlanDays });
    if (!nextState) return;
    const wasPlanComplete = !!plan && plan.days.length > 0 && plan.days.every((day) => completedBibleReadingPlanDaySet.has(bibleReadingPlanDayKey(planId, day.day)));
    const planJustCompleted = !!plan && !nextState.nextIncomplete && !wasPlanComplete;
    const nextCompletionDates =
      plan && !nextState.nextIncomplete
        ? { ...bibleReadingPlanCompletionDates, [planId]: bibleReadingPlanCompletionDates[planId] || localDateKey() }
        : bibleReadingPlanCompletionDates;
    const nextCompletionCounts = planJustCompleted
      ? incrementBibleReadingPlanCompletionCount(planId)
      : bibleReadingPlanCompletionCounts;
    if (nextCompletionDates !== bibleReadingPlanCompletionDates) {
      setBibleReadingPlanCompletionDates(nextCompletionDates);
    }
    if (nextCompletionCounts !== bibleReadingPlanCompletionCounts) {
      setBibleReadingPlanCompletionCounts(nextCompletionCounts);
    }
    if (activeBiblePlanSelectedPlanId === planId) {
      setRememberedPlanSelectedDay(planId, nextState.nextIncomplete?.day || 0);
    }
    setPendingBiblePlanReadAhead((current) =>
      current?.planId === planId && (current.missedDay === planDay.day || current.requestedDay === planDay.day)
        ? null
        : current
    );
    setCompletedBibleReadingPlanDays((current) => {
      const currentState = completeBibleReadingPlanDayState({ plan, planDay, planId, completedDayKeys: current });
      const next = currentState?.completedDays || current;
      persistBibleReadingPlanProgress(planId, next, customBibleReadingPlans, bibleReadingPlanStartDates, followedBibleReadingPlanIds, nextCompletionDates, nextCompletionCounts);
      return next;
    });
    const nextStatus = nextState.nextIncomplete
      ? `${planDay.reference} completed. Next reading: ${nextState.nextIncomplete.reference}.`
      : `${plan?.title || "Reading plan"} complete.`;
    setBiblePlanStatus(nextStatus);
    const completedFocusedReading = readerPlanReading?.planId === planId && readerPlanReading.day === planDay.day;
    setReaderPlanReading((current) => current?.planId === planId && current.day === planDay.day ? null : current);
    if (completedFocusedReading) scrollReaderToTop();
    if (options.promptForNextDueReading && plan) {
      queueBiblePlanContinueCheck(plan, planDay);
    }
    if (plan && !nextState.nextIncomplete) {
      setPendingBiblePlanContinuePrompt(null);
      setPendingBiblePlanCompletionCelebration({
        planId: plan.id,
        planTitle: plan.title,
        completedDays: plan.days.length
      });
    }
    trackUsage("bible_reading_plan_day_completed", { reference: planDay.reference, tab: "bible", book: planDay.readerBook, chapter: planDay.readerChapter });
  }

  function unmarkBibleReadingPlanDayComplete(planDay: BibleReadingPlanDay, planId = activeBibleReadingPlan?.id || "") {
    const nextCompletionDates = { ...bibleReadingPlanCompletionDates };
    delete nextCompletionDates[planId];
    setBibleReadingPlanCompletionDates(nextCompletionDates);
    setCompletedBibleReadingPlanDays((current) => {
      const nextState = uncompleteBibleReadingPlanDayState({ planDay, planId, completedDayKeys: current });
      if (!nextState) return current;
      const next = nextState.completedDays;
      persistBibleReadingPlanProgress(planId, next, customBibleReadingPlans, bibleReadingPlanStartDates, followedBibleReadingPlanIds, nextCompletionDates);
      return next;
    });
    setBiblePlanStatus(`Day ${planDay.day} is no longer marked complete.`);
    trackUsage("bible_reading_plan_day_uncompleted", { reference: planDay.reference, tab: "plans", book: planDay.readerBook, chapter: planDay.readerChapter });
  }

  function markCurrentBibleReadingPlanDayComplete() {
    if (!readerMatchesActiveBibleReadingPlanDay || !readerActiveBibleReadingPlanDay || readerActiveBibleReadingPlanDayComplete) return;
    markBibleReadingPlanDayComplete(readerActiveBibleReadingPlanDay, readerBibleReadingPlan?.id || activeBibleReadingPlan?.id || "", { promptForNextDueReading: true });
  }

  function createCustomBibleReadingPlan() {
    const title = customBiblePlanTitle.trim();
    if (!title) {
      setCustomBiblePlanStatus("Add a plan title first.");
      return;
    }

    const lines = customBiblePlanDaysText
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    const days = lines
      .map((line, index): BibleReadingPlanDay | null => {
        const parts = line.split("|").map((part) => part.trim()).filter(Boolean);
        const reference = parts[0] || line;
        const parsed = parseBsbPassageReference(reference);
        if (!parsed) return null;
        const readerBook = readerBookFromReferenceBook(parsed.bookName);
        const studyReference = parts[1] || reference;
        return {
          day: index + 1,
          title: `Day ${index + 1}`,
          reference,
          readerBook,
          readerChapter: parsed.chapter,
          studyReference
        };
      })
      .filter((day): day is BibleReadingPlanDay => !!day);

    if (!days.length || days.length !== lines.length) {
      setCustomBiblePlanStatus("Each line needs a readable Bible reference, for example John 3 or Romans 8.");
      return;
    }

    const id = `custom-${Date.now()}`;
    const plan: BibleReadingPlan = {
      id,
      title: title.slice(0, 80),
      description: customBiblePlanDescription.trim().slice(0, 240),
      source: "custom",
      category: "Custom",
      days
    };
    const nextState = createCustomBibleReadingPlanState({
      plan,
      allPlans: allBibleReadingPlans,
      customPlans: customBibleReadingPlans,
      followedPlanIds: followedBibleReadingPlanIds,
      activePlanId: activeBibleReadingPlanId,
      startDates: bibleReadingPlanStartDates,
      completedDayKeys: completedBibleReadingPlanDays,
      todayKey: localDateKey()
    });
    setCustomBibleReadingPlans(nextState.customPlans);
    setCustomBiblePlanTitle("");
    setCustomBiblePlanDescription("");
    setCustomBiblePlanDaysText("");
    setCustomBiblePlanFormOpen(false);
    setCustomBiblePlanStatus(nextState.canFollow ? `${plan.title} created.` : `${plan.title} created. Stop one plan before following it.`);
    setActiveBibleReadingPlanId(nextState.activePlanId);
    setFollowedBibleReadingPlanIds(nextState.followedPlanIds);
    setRememberedExpandedBiblePlanId(nextState.canFollow ? id : "");
    if (nextState.canFollow) {
      setRememberedPlanSelectedDay(id, 0);
    } else {
      setActiveBiblePlanSelectedDay(0);
      setActiveBiblePlanSelectedPlanId("");
      persistUiPreference("plansSelectedPlanDay", "");
    }
    setBibleReadingPlanStartDates(nextState.startDates);
    persistBibleReadingPlanProgress(nextState.activePlanId, completedBibleReadingPlanDays, nextState.customPlans, nextState.startDates, nextState.followedPlanIds, bibleReadingPlanCompletionDates);
    trackUsage("bible_reading_plan_created", { reference: title, tab: "plans" });
    dismissMobileInputFocus();
  }

  function deleteCustomBibleReadingPlan(planId: string) {
    if (pendingBiblePlanDeleteId !== planId) {
      setPendingBiblePlanDeleteId(planId);
      setCustomBiblePlanStatus("Tap delete again to remove this custom plan.");
      return;
    }

    const nextState = deleteCustomBibleReadingPlanState({
      planId,
      customPlans: customBibleReadingPlans,
      completedDayKeys: completedBibleReadingPlanDays,
      followedPlanIds: followedBibleReadingPlanIds,
      activePlanId: activeBibleReadingPlanId,
      startDates: bibleReadingPlanStartDates
    });
    setCustomBibleReadingPlans(nextState.customPlans);
    setCompletedBibleReadingPlanDays(nextState.completedDays);
    setFollowedBibleReadingPlanIds(nextState.followedPlanIds);
    setActiveBibleReadingPlanId(nextState.activePlanId);
    setBibleReadingPlanStartDates(nextState.startDates);
    const nextCompletionDates = { ...bibleReadingPlanCompletionDates };
    delete nextCompletionDates[planId];
    setBibleReadingPlanCompletionDates(nextCompletionDates);
    const nextCompletionCounts = { ...bibleReadingPlanCompletionCounts };
    delete nextCompletionCounts[planId];
    setBibleReadingPlanCompletionCounts(nextCompletionCounts);
    setPendingBiblePlanDeleteId("");
    setCustomBiblePlanStatus("Custom plan deleted.");
    persistBibleReadingPlanProgress(nextState.activePlanId, nextState.completedDays, nextState.customPlans, nextState.startDates, nextState.followedPlanIds, nextCompletionDates, nextCompletionCounts);
  }

  function studyBibleReadingPlanDay(planDay: BibleReadingPlanDay) {
    requestStudyTransition(`study ${planDay.reference} from the reading plan`, () => {
      setPassage(planDay.studyReference);
      setPassageQuery(planDay.studyReference);
      clearStudyWorkspace();
      setRememberedStudyStepIndex(0);
      setStudyPhase("study");
      setLoadedDraftKey("");
      setSaveStatus(`${planDay.reference} loaded from Bible reading plan`);
      setTab("study");
      trackUsage("bible_reading_plan_studied", { reference: planDay.reference, tab: "bible", book: planDay.readerBook, chapter: planDay.readerChapter });
    });
  }

  function dismissBibleSearchInput() {
    if (!phoneLayout) return;
    Keyboard.dismiss();
    if (Platform.OS === "web" && typeof document !== "undefined") {
      (document.activeElement as HTMLElement | null)?.blur?.();
    }
  }

  function scrollToBibleSearchSummary() {
    if (!phoneLayout) return;
    setTimeout(() => {
      appScrollRef.current?.scrollTo?.({ y: Math.max(0, bibleSearchSummaryYRef.current - 88), animated: true });
    }, 120);
  }

  async function runBibleSearch(overrides: BibleSearchCriteriaOverrides = {}) {
    dismissBibleSearchInput();
    const query = bibleSearchQuery.trim();
    const searchScope = overrides.scope ?? bibleSearchScope;
    const searchMode = overrides.mode ?? bibleSearchMode;
    const requestedBook = overrides.book ?? bibleSearchBook;
    const searchBook = buildBibleSearchBookOptions(searchScope).includes(requestedBook) ? requestedBook : "";
    const searchTranslationId = overrides.translationId ?? bibleTranslation;
    const requestId = ++bibleSearchRequestIdRef.current;
    bibleSearchAbortControllerRef.current?.abort();
    if (!query) {
      setBibleSearchStatus("Type a word, theme, idea, or question to search.");
      setBibleSearchResults([]);
      setBibleSearchActiveQuery("");
      setBibleSearchDuration("");
      return;
    }

    const startedAt = Date.now();
    const controller = new AbortController();
    bibleSearchAbortControllerRef.current = controller;
    let requestTimedOut = false;
    const requestTimeout = setTimeout(() => {
      requestTimedOut = true;
      controller.abort();
    }, 15_000);
    const translation = searchTranslationId === "kjv" ? "KJV" : searchTranslationId === "bsb" ? "BSB" : "WEB";
    const queries = buildBibleSearchQueries(query, searchMode);
    setBibleSearchStatus("Searching Scripture...");
    setBibleSearchDuration("");
    setBibleSearchActiveQuery(query);

    try {
      const responses = await Promise.all(queries.map((searchTerm) => fetchBibleSearchResults(searchTerm, translation, searchScope, searchBook, searchMode === "word", controller.signal)));
      if (bibleSearchRequestIdRef.current !== requestId) return;
      const combined = rankBibleSearchResults(filterBibleSearchResultsForMode(dedupeBibleSearchResults(responses.flat()), query, searchMode), query, searchMode).slice(0, 60);
      setBibleSearchDuration(`Search completed in ${formatSearchDuration(Date.now() - startedAt)}.`);
      setBibleSearchResults(combined);
      setBibleSearchStatus(
        combined.length
          ? `${combined.length} ${bibleSearchModeLabel(searchMode).toLowerCase()} result${combined.length === 1 ? "" : "s"} found${searchBook ? ` in ${searchBook}` : ""}.`
          : searchMode === "word"
            ? "No exact word results found. Try Any words or Theme if you want broader matches."
            : "No results found. Try fewer words or a broader search mode."
      );
      scrollToBibleSearchSummary();
      trackUsage("bible_search", { reference: query, translation, tab: "bible", book: searchBook || undefined });
    } catch {
      if (bibleSearchRequestIdRef.current !== requestId) return;
      setBibleSearchStatus(requestTimedOut ? "That search took too long. Try again or choose a specific book." : "I couldn't complete the search. Check your connection and try again.");
      setBibleSearchDuration(`Search stopped after ${formatSearchDuration(Date.now() - startedAt)}.`);
      setBibleSearchResults([]);
      scrollToBibleSearchSummary();
    } finally {
      clearTimeout(requestTimeout);
      if (bibleSearchAbortControllerRef.current === controller) bibleSearchAbortControllerRef.current = null;
    }
  }

  function clearBibleSearch() {
    bibleSearchAbortControllerRef.current?.abort();
    bibleSearchAbortControllerRef.current = null;
    bibleSearchRequestIdRef.current += 1;
    setBibleSearchQuery("");
    setBibleSearchResults([]);
    setBibleSearchStatus("");
    setBibleSearchDuration("");
    setBibleSearchActiveQuery("");
    setBibleSearchBookMenuOpen(false);
    setBibleSearchCriteriaOpen(false);
  }

  function openBibleSearchResult(result: BibleSearchResult) {
    setReaderPlanReading(null);
    setPendingReaderFocusVerse(result.verse);
    setReaderBook(result.book);
    setReaderChapter(result.chapter);
    setReaderChapterDraft(String(result.chapter));
    setSelectedReaderVerses([result.verse]);
    setReaderActionVerse(result.verse);
    setReaderNavCollapsed(true);
    setExpandedMobileReaderBook("");
    clearBibleSearch();
    scrollReaderToVerse(result.verse);
  }

  function studyBibleSearchResult(result: BibleSearchResult) {
    const reference = `${result.book} ${result.chapter}:${result.verse}`;
    requestStudyTransition(`study ${reference} from Bible search`, () => {
      setPassage(reference);
      setPassageQuery(reference);
      clearStudyWorkspace();
      setRememberedStudyStepIndex(0);
      setStudyPhase("study");
      setSaveStatus("Loaded from Bible search");
      setLoadedDraftKey("");
      setTab("study");
    });
  }

  function buildBibleBookmark(verses: number[] = []): StoredBibleBookmark {
    const sortedVerses = [...verses].sort((a, b) => a - b);
    const startVerse = sortedVerses[0];
    const endVerse = sortedVerses[sortedVerses.length - 1];
    const reference = buildReaderStudyReference(readerBook, readerChapter, sortedVerses);
    return {
      id: `${readerBook}-${readerChapter}-${startVerse || "chapter"}-${Date.now()}`,
      book: readerBook,
      chapter: readerChapter,
      ...(startVerse ? { startVerse } : {}),
      ...(endVerse ? { endVerse } : {}),
      reference,
      bookmarked: true,
      createdAt: new Date().toISOString()
    };
  }

  function saveBibleBookmark(verses: number[] = []) {
    const bookmark = buildBibleBookmark(verses);

    setBibleBookmarks((current) => {
      const existing = current.find((item) => item.reference === bookmark.reference);
      const savedBookmark = { ...bookmark, id: existing?.id || bookmark.id, note: existing?.note, bookmarked: true };
      const withoutDuplicate = current.filter((item) => item.reference !== bookmark.reference);
      const next = [savedBookmark, ...withoutDuplicate].slice(0, 30);
      saveStoredBibleBookmarks(next).catch(() => undefined);
      persistBibleReaderState({ bookmarks: next });
      return next;
    });
    trackUsage("bookmark_saved", { reference: bookmark.reference, tab: "bible", book: readerBook, chapter: readerChapter });
  }

  function openSelectedReaderNote() {
    if (!selectedReaderVerses.length) return;
    const existingBookmark = bibleBookmarks.find((bookmark) => bookmark.reference === readerStudyReference);
    const bookmark = existingBookmark || { ...buildBibleBookmark(selectedReaderVerses), bookmarked: false };

    if (!existingBookmark) {
      setBibleBookmarks((current) => {
        const withoutDuplicate = current.filter((item) => item.reference !== bookmark.reference);
        const next = [bookmark, ...withoutDuplicate].slice(0, 30);
        saveStoredBibleBookmarks(next).catch(() => undefined);
        persistBibleReaderState({ bookmarks: next });
        return next;
      });
    }

    if (!phoneLayout) {
      setBookmarksCollapsed(false);
      setBookmarkNotesOnly(false);
      setBookmarkSearch("");
      setReaderNavCollapsed(false);
    }
    setActiveBookmarkNoteId(bookmark.id);
    setBookmarkNoteDraft(bookmark.note || "");
  }

  function openBibleBookmark(bookmark: StoredBibleBookmark) {
    setReaderPlanReading(null);
    setReaderBook(bookmark.book);
    setReaderChapter(bookmark.chapter);
    setSelectedReaderVerses(
      bookmark.startVerse ? buildVerseRange(bookmark.startVerse, bookmark.endVerse || bookmark.startVerse) : []
    );
    setReaderActionVerse(bookmark.endVerse || bookmark.startVerse || 0);
    scrollReaderToTop();
  }

  function removeBibleBookmark(bookmarkId: string) {
    setBibleBookmarks((current) => {
      const next = current
        .map((item) => item.id === bookmarkId ? { ...item, bookmarked: false } : item)
        .filter((item) => item.bookmarked !== false || !!item.note?.trim());
      saveStoredBibleBookmarks(next).catch(() => undefined);
      persistBibleReaderState({ bookmarks: next });
      return next;
    });
    if (activeBookmarkNoteId === bookmarkId) {
      setActiveBookmarkNoteId("");
      setBookmarkNoteDraft("");
    }
  }

  function openBookmarkNote(bookmark: StoredBibleBookmark) {
    setActiveBookmarkNoteId((current) => {
      const next = current === bookmark.id ? "" : bookmark.id;
      setBookmarkNoteDraft(next ? bookmark.note || "" : "");
      return next;
    });
  }

  function saveBookmarkNote(bookmarkId: string) {
    const note = bookmarkNoteDraft.trim();
    setBibleBookmarks((current) => {
      const next = current
        .map((bookmark) => bookmark.id === bookmarkId ? { ...bookmark, ...(note ? { note } : { note: undefined }) } : bookmark)
        .filter((bookmark) => bookmark.bookmarked !== false || !!bookmark.note?.trim());
      saveStoredBibleBookmarks(next).catch(() => undefined);
      persistBibleReaderState({ bookmarks: next });
      return next;
    });
    setActiveBookmarkNoteId("");
    setBookmarkNoteDraft("");
    dismissMobileInputFocus();
  }

  function deleteBookmarkNote(bookmarkId: string) {
    setBibleBookmarks((current) => {
      const next = current
        .map((bookmark) => bookmark.id === bookmarkId ? { ...bookmark, note: undefined } : bookmark)
        .filter((bookmark) => bookmark.bookmarked !== false);
      saveStoredBibleBookmarks(next).catch(() => undefined);
      persistBibleReaderState({ bookmarks: next });
      return next;
    });
    setActiveBookmarkNoteId("");
    setBookmarkNoteDraft("");
    dismissMobileInputFocus();
  }

  function dismissMobileInputFocus() {
    Keyboard.dismiss();
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const activeElement = document.activeElement as HTMLElement | null;
      activeElement?.blur?.();
    }
  }

  function commitReaderChapter(value = readerChapterDraft) {
    const chapter = Number(value.trim());
    const nextChapter = Number.isFinite(chapter) ? Math.min(Math.max(Math.round(chapter), 1), readerChapterCount) : readerChapter;
    setReaderChapterDraft(String(nextChapter));
    if (nextChapter !== readerChapter) {
      setReaderPlanReading(null);
      setReaderChapter(nextChapter);
    }
  }

  function openReaderChapterInStudy() {
    const studyReference = readerPlanReadingActive && readerPlanReading?.reference ? readerPlanReading.reference : readerStudyReference;
    requestStudyTransition(`study ${studyReference} from the Bible reader`, () => {
      setPassage(studyReference);
      setPassageQuery(studyReference);
      clearStudyWorkspace();
      setRememberedStudyStepIndex(0);
      setStudyPhase("study");
      setSavedStudySummary(null);
      setLoadedDraftKey("");
      setSaveStatus(selectedReaderVerses.length ? "Selected verses loaded from Bible reader" : "Chapter loaded from Bible reader");
      clearReaderSelection();
      setTab("study");
    });
  }

  function clearReaderSelection() {
    setSelectedReaderVerses([]);
    setReaderActionVerse(0);
    setActiveBookmarkNoteId("");
    setBookmarkNoteDraft("");
  }

  function toggleReaderVerse(verseNumber: number) {
    setReaderMemoryStatus("");
    setSelectedReaderVerses((current) => {
      const anchorVerse = readerActionVerse || current[current.length - 1] || verseNumber;
      const next = current.includes(verseNumber)
        ? current.filter((verse) => verse !== verseNumber)
        : Array.from(new Set([...current, ...buildVerseRange(anchorVerse, verseNumber)])).sort((a, b) => a - b);
      setReaderActionVerse(next.includes(verseNumber) ? verseNumber : next[next.length - 1] || 0);
      return next;
    });
  }

  function toggleStudyPanel(panel: StudySidePanelKey) {
    setCollapsedStudyPanels((current) => {
      const next = { ...current, [panel]: !current[panel] };
      saveStoredCollapsedStudyPanels(next).catch(() => undefined);
      persistUiPreference(STUDY_PANEL_UI_PREFERENCE_KEYS[panel], next[panel]);
      return next;
    });
  }

  function persistUiPreference(key: UiPreferenceKey, value: UiPreferenceValue) {
    if (!activeProfileId || !profileMatchesActiveState) return;
    saveUiPreference({ profileId: activeProfileId, key, value }).catch(() => undefined);
  }

  function persistPinnedJournalEntries(ids: string[]) {
    const next = Array.from(new Set(ids.map((id) => String(id)).filter(Boolean))).slice(0, 80);
    savePinnedJournalEntries(next).catch(() => undefined);
    persistUiPreference("pinnedJournalEntryIds", next);
  }

  function persistRhythmGraceHandledDate(missedDate: string, storageKey?: string) {
    const cleanDate = /^\d{4}-\d{2}-\d{2}$/.test(missedDate) ? missedDate : "";
    if (!cleanDate) return;
    if (storageKey) safeSetLocalStorageValue(storageKey, "handled");
    const current = uiStringList(profileUiPreferences, "rhythmGraceHandledDates") || [];
    const next = [cleanDate, ...current.filter((date) => date !== cleanDate)].slice(0, 30);
    persistUiPreference("rhythmGraceHandledDates", next);
  }

  function setRememberedStudyMethod(nextMethodId: string, nextStepIndex = 0) {
    const nextMethod = methods.find((item) => item.id === nextMethodId);
    if (!nextMethod) return;
    const normalizedStepIndex = Math.max(0, Math.min(nextMethod.steps.length - 1, nextStepIndex));
    setMethodId(nextMethod.id);
    setStepIndex(normalizedStepIndex);
    persistUiPreference("studyMethodId", nextMethod.id);
    persistUiPreference("studyStepIndex", String(normalizedStepIndex));
  }

  function setRememberedBibleSearchScope(nextScope: BibleSearchScope) {
    const normalized = nextScope === "old" || nextScope === "new" ? nextScope : "all";
    const nextBook = buildBibleSearchBookOptions(normalized).includes(bibleSearchBook) ? bibleSearchBook : "";
    setBibleSearchScope(normalized);
    persistUiPreference("bibleSearchScope", normalized);
    if (nextBook !== bibleSearchBook) setRememberedBibleSearchBook(nextBook);
    if (bibleSearchActiveQuery && (normalized !== bibleSearchScope || nextBook !== bibleSearchBook)) {
      runBibleSearch({ scope: normalized, book: nextBook }).catch(() => undefined);
    }
  }

  function setRememberedBibleSearchMode(nextMode: BibleSearchMode) {
    const normalized = isBibleSearchModeValue(nextMode) ? nextMode : "word";
    setBibleSearchMode(normalized);
    persistUiPreference("bibleSearchMode", normalized);
    if (bibleSearchActiveQuery && normalized !== bibleSearchMode) runBibleSearch({ mode: normalized }).catch(() => undefined);
  }

  function setRememberedBibleSearchBook(nextBook: string) {
    const normalized = bibleBooks.includes(nextBook) ? nextBook : "";
    setBibleSearchBook(normalized);
    persistUiPreference("bibleSearchBook", normalized);
  }

  function selectBibleSearchBook(nextBook: string) {
    const normalized = bibleBooks.includes(nextBook) ? nextBook : "";
    setRememberedBibleSearchBook(normalized);
    setBibleSearchBookMenuOpen(false);
    if (bibleSearchActiveQuery && normalized !== bibleSearchBook) runBibleSearch({ book: normalized }).catch(() => undefined);
  }

  function setRememberedBibleSearchCriteriaOpen(nextValue: SetStateAction<boolean>) {
    setBibleSearchCriteriaOpen((current) => {
      const next = typeof nextValue === "function" ? (nextValue as (value: boolean) => boolean)(current) : nextValue;
      persistUiPreference("bibleSearchCriteriaOpen", next);
      return next;
    });
  }

  function setRememberedStudyStepIndex(nextStepIndex: number) {
    const normalizedStepIndex = Math.max(0, Math.min(method.steps.length - 1, nextStepIndex));
    setStepIndex(normalizedStepIndex);
    persistUiPreference("studyStepIndex", String(normalizedStepIndex));
  }

  function setRememberedStudyFocusMode(nextValue: boolean) {
    setStudyFocusMode(nextValue);
    saveStoredStudyFocusMode(nextValue).catch(() => undefined);
    persistUiPreference("studyFocusMode", nextValue);
  }

  function setRememberedMemoryView(nextView: MemoryView) {
    setMemoryView(nextView);
    persistUiPreference("memoryView", nextView);
  }

  function setRememberedMemoryBrowseFiltersOpen(nextValue: SetStateAction<boolean>) {
    setMemoryBrowseFiltersOpen((current) => {
      const next = typeof nextValue === "function" ? (nextValue as (value: boolean) => boolean)(current) : nextValue;
      persistUiPreference("memoryBrowseFiltersOpen", next);
      return next;
    });
  }

  function setRememberedMemoryBrowseStatusFilter(nextFilter: MemoryBrowseStatusFilter) {
    setMemoryBrowseStatusFilter(nextFilter);
    persistUiPreference("memoryBrowseStatusFilter", nextFilter);
  }

  function setRememberedMemoryBookFilter(nextBook: string) {
    const normalized = nextBook === "all" || bibleBooks.includes(nextBook) ? nextBook : "all";
    setMemoryBookFilter(normalized);
    persistUiPreference("memoryBookFilter", normalized);
  }

  function setRememberedMemoryChapterFilter(nextChapter: string) {
    const normalized = nextChapter === "all" || /^[A-Za-z0-9 .]+:\d{1,3}$/.test(nextChapter) ? nextChapter : "all";
    setMemoryChapterFilter(normalized);
    persistUiPreference("memoryChapterFilter", normalized);
  }

  function setRememberedMemoryCollectionFilter(nextCollection: string) {
    const normalized = nextCollection.trim().slice(0, 80) || "all";
    setMemoryCollectionFilter(normalized);
    persistUiPreference("memoryCollectionFilter", normalized);
  }

  function setRememberedPlanSelectedDay(planId: string, day: number) {
    if (!isSafePlanId(planId)) return;
    if (day <= 0) {
      setActiveBiblePlanSelectedPlanId(planId);
      setActiveBiblePlanSelectedDay(0);
      persistUiPreference("plansSelectedPlanDay", "");
      return;
    }
    const normalizedDay = Math.max(1, Math.min(9999, Math.round(day || 1)));
    setActiveBiblePlanSelectedPlanId(planId);
    setActiveBiblePlanSelectedDay(normalizedDay);
    persistUiPreference("plansSelectedPlanDay", `${planId}:${normalizedDay}`);
  }

  function setRememberedExpandedBiblePlanId(planId: string) {
    const normalized = planId && isSafePlanId(planId) ? planId : "";
    setExpandedBiblePlanId(normalized);
    persistUiPreference("plansExpandedPlanId", normalized);
  }

  function setRememberedCompletedBiblePlansOpen(nextValue: SetStateAction<boolean>) {
    setCompletedBiblePlansOpen((current) => {
      const next = typeof nextValue === "function" ? (nextValue as (value: boolean) => boolean)(current) : nextValue;
      persistUiPreference("plansCompletedOpen", next);
      return next;
    });
  }

  function setRememberedOpenBiblePlanSections(nextValue: SetStateAction<Record<string, boolean>>) {
    setOpenBiblePlanSections((current) => {
      const next = typeof nextValue === "function" ? (nextValue as (value: Record<string, boolean>) => Record<string, boolean>)(current) : nextValue;
      persistUiPreference("plansOpenSections", Object.entries(next).filter(([, open]) => open).map(([id]) => id));
      return next;
    });
  }

  function setRememberedJournalView(nextView: JournalView) {
    setJournalView(nextView);
    persistUiPreference("journalView", nextView);
  }

  function setRememberedJournalFilter(nextFilter: JournalFilter) {
    setJournalFilter(nextFilter);
    persistUiPreference("journalFilter", nextFilter);
  }

  function setRememberedJournalFiltersOpen(nextValue: SetStateAction<boolean>) {
    setJournalFiltersOpen((current) => {
      const next = typeof nextValue === "function" ? (nextValue as (value: boolean) => boolean)(current) : nextValue;
      persistUiPreference("journalFiltersOpen", next);
      return next;
    });
  }

  function setRememberedExpandedJournalScriptureBook(nextValue: SetStateAction<string>) {
    setExpandedJournalScriptureBook((current) => {
      const next = typeof nextValue === "function" ? (nextValue as (value: string) => string)(current) : nextValue;
      const normalized = bibleBooks.includes(next) ? next : "";
      persistUiPreference("journalExpandedScriptureBook", normalized);
      return normalized;
    });
  }

  function setRememberedSelectedJournalScripture(book: string, chapter: number) {
    const normalizedBook = bibleBooks.includes(book) ? book : "";
    const normalizedChapter = normalizedBook && Number.isFinite(chapter) && chapter > 0 ? Math.min(200, Math.round(chapter)) : 0;
    setSelectedJournalScriptureBook(normalizedBook);
    setSelectedJournalScriptureChapter(normalizedChapter);
    persistUiPreference("journalSelectedScripture", normalizedBook && normalizedChapter ? `${normalizedBook}:${normalizedChapter}` : "");
  }

  function setRememberedAccountPrivacyOpen(nextValue: SetStateAction<boolean>) {
    setAccountPrivacyOpen((current) => {
      const next = typeof nextValue === "function" ? (nextValue as (value: boolean) => boolean)(current) : nextValue;
      persistUiPreference("accountPrivacyOpen", next);
      return next;
    });
  }

  function setRememberedOpenLegalSection(nextValue: SetStateAction<LegalSection>) {
    setOpenLegalSection((current) => {
      const next = typeof nextValue === "function" ? (nextValue as (value: LegalSection) => LegalSection)(current) : nextValue;
      const normalized = next === "privacy" || next === "terms" ? next : "";
      persistUiPreference("accountLegalSection", normalized);
      return normalized;
    });
  }

  function setRememberedPrintWorksheetMethodId(nextMethodId: string) {
    const normalized = methods.some((item) => item.id === nextMethodId) ? nextMethodId : methods[0]?.id || "";
    setPrintWorksheetMethodId(normalized);
    if (normalized) persistUiPreference("printWorksheetMethodId", normalized);
  }

  function setRememberedPrintWorksheetWritingSpace(nextSpace: WorksheetWritingSpace) {
    const normalized = nextSpace === "more" ? "more" : "standard";
    setPrintWorksheetWritingSpace(normalized);
    persistUiPreference("printWorksheetWritingSpace", normalized);
  }

  function setRememberedPrintWorksheetIncludes(nextValue: SetStateAction<{ memory: boolean; insight: boolean }>) {
    setPrintWorksheetIncludes((current) => {
      const next = typeof nextValue === "function" ? (nextValue as (value: { memory: boolean; insight: boolean }) => { memory: boolean; insight: boolean })(current) : nextValue;
      persistUiPreference("printWorksheetIncludes", [
        ...(next.memory ? ["memory"] : []),
        ...(next.insight ? ["insight"] : [])
      ]);
      return next;
    });
  }

  function setRememberedMemoryPrintSet(nextSet: MemoryPrintSet) {
    const normalized = isMemoryPrintSetValue(nextSet) ? nextSet : "due";
    setMemoryPrintSet(normalized);
    persistUiPreference("memoryPrintSet", normalized);
  }

  function setRememberedMemoryPrintLayout(nextLayout: MemoryCardLayout) {
    const normalized = nextLayout === "large" ? "large" : "pocket";
    setMemoryPrintLayout(normalized);
    persistUiPreference("memoryPrintLayout", normalized);
  }

  function setRememberedMemoryPrintCopies(nextCopies: number) {
    const normalized = [1, 2, 3, 4, 6].includes(nextCopies) ? nextCopies : 1;
    setMemoryPrintCopies(normalized);
    persistUiPreference("memoryPrintCopies", String(normalized));
  }

  function setRememberedMemoryPrintSafeMode(nextSafeMode: boolean) {
    setMemoryPrintSafeMode(nextSafeMode);
    persistUiPreference("memoryPrintSafeMode", nextSafeMode);
  }

  function currentBibleReadingPlanProgress(
    activePlanId = selectedBibleReadingPlanId || activeBibleReadingPlanId,
    completedDays = completedBibleReadingPlanDays,
    customPlans = customBibleReadingPlans,
    startDates = bibleReadingPlanStartDates,
    followedPlanIds = followedBibleReadingPlanIds,
    completedPlanDates = bibleReadingPlanCompletionDates,
    completionCounts = bibleReadingPlanCompletionCounts,
    acknowledgedCareNotes = acknowledgedBibleReadingCareNotes
  ): StoredBibleReadingPlanProgress {
    return normalizeBibleReadingPlanProgress({
      activePlanId,
      followedPlanIds,
      completedDays,
      customPlans,
      startDates,
      completedPlanDates,
      completionCounts,
      acknowledgedCareNotes,
      updatedAt: Date.now()
    }) || { ...emptyBibleReadingPlanProgress(), updatedAt: Date.now() };
  }

  function persistBibleReaderState(overrides: Partial<SyncedBibleReaderState> = {}) {
    if (!activeProfileId || !isAuthenticated || !profileMatchesActiveState || remoteBibleReaderState === undefined) return;
    const profileId = String(activeProfileId);
    const includesReadingPlanProgress = Object.prototype.hasOwnProperty.call(overrides, "readingPlanProgress");
    if (!includesReadingPlanProgress && appliedBibleReaderProfileIdRef.current !== profileId) return;
    const readingPlanProgressForSync = storedBibleReadingPlanProgress || currentBibleReadingPlanProgress();
    const state = normalizeSyncedBibleReaderState({
      translation: bibleTranslation,
      position: { book: readerBook, chapter: readerChapter },
      history: bibleReaderHistory,
      readChapters: readBibleChapters,
      bookmarks: bibleBookmarks,
      readingPlanProgress: readingPlanProgressForSync,
      ...overrides
    });
    if (!state) return;
    const includes = (key: keyof SyncedBibleReaderState) => Object.prototype.hasOwnProperty.call(overrides, key);
    const saveAllSections = Object.keys(overrides).length === 0;
    const stateForSave: Partial<SyncedBibleReaderState> = {};
    if (saveAllSections || includes("translation")) stateForSave.translation = state.translation;
    if (saveAllSections || includes("position")) stateForSave.position = state.position;
    if (saveAllSections || includes("history")) stateForSave.history = state.history;
    if (saveAllSections || includes("readChapters")) stateForSave.readChapters = state.readChapters;
    if (saveAllSections || includes("bookmarks")) stateForSave.bookmarks = state.bookmarks;
    if ((saveAllSections || includes("readingPlanProgress")) && state.readingPlanProgress) {
      stateForSave.readingPlanProgress = {
        ...state.readingPlanProgress,
        customPlans: state.readingPlanProgress.customPlans
          .filter((plan) => plan.source === "custom")
          .map((plan) => ({
            id: plan.id,
            title: plan.title,
            description: plan.description,
            source: "custom" as const,
            category: plan.category,
            days: plan.days.map((day) => ({
              day: day.day,
              title: day.title,
              reference: day.reference,
              readerBook: day.readerBook,
              readerChapter: day.readerChapter,
              studyReference: day.studyReference
            }))
          }))
      };
    }

    const signature = JSON.stringify(state);
    appliedBibleReaderStateSignatureRef.current = signature;
    pendingBibleReaderStateProfileIdRef.current = profileId;
    pendingBibleReaderStateSignatureRef.current = signature;
    clearPendingBibleReaderStateSync();
    pendingBibleReaderStateProfileIdRef.current = profileId;
    pendingBibleReaderStateSignatureRef.current = signature;
    pendingBibleReaderStateTimerRef.current = setTimeout(() => {
      if (pendingBibleReaderStateProfileIdRef.current === profileId) clearPendingBibleReaderStateSync(signature);
    }, 5000);
    const recoveryKey = `bible-study-tutor-study-recovery-reader-${profileId}`;
    let previousRecovery: Record<string, unknown> = {};
    try { previousRecovery = JSON.parse(readRecoveryValue(recoveryKey) || "{}"); } catch { /* Replace malformed local data with the current valid payload. */ }
    const serializedRecovery = JSON.stringify({ ...previousRecovery, ...stateForSave });
    void writeRecoveryValue(recoveryKey, serializedRecovery).catch(() => undefined);
    if (readerSyncError) return;
    void readerSyncQueue.current.save(remoteBibleReaderState?.revision ?? 0, (baseRevision) => saveBibleReaderState({
      profileId: activeProfileId,
      state: stateForSave as Parameters<typeof saveBibleReaderState>[0]["state"],
      baseRevision
    })).then(() => {
      if (readRecoveryValue(recoveryKey) === serializedRecovery) removeRecoveryValue(recoveryKey);
    }).catch(() => {
      if (pendingBibleReaderStateProfileIdRef.current === profileId) clearPendingBibleReaderStateSync(signature);
      setReaderSyncError("Your changes could not sync. Keep this screen open while choosing a copy. Another device may have changed the saved version.");
    });
  }

  function toggleMemoryMilestoneGoal(goalId: MemoryMilestoneGoalId) {
    setMemoryMilestoneGoalIds((current) => {
      const selected = current.includes(goalId);
      const next = selected
        ? current.filter((id) => id !== goalId)
        : current.length >= 5
          ? [...current.slice(1), goalId]
          : [...current, goalId];

      if (!selected && current.length >= 5) {
        setMemoryMilestoneStatus("Goal swapped in. You can track up to five at a time.");
      } else {
        setMemoryMilestoneStatus("Milestones updated.");
      }

      if (activeProfileId) {
        saveMemoryMilestoneGoals({ profileId: activeProfileId, goalIds: next }).catch(() => {
          setMemoryMilestoneStatus("Could not save those milestones just now.");
        });
      }
      return next;
    });
  }

  function toggleRememberedPanel(setter: Dispatch<SetStateAction<boolean>>, key: UiPreferenceKey) {
    setter((current) => {
      const next = !current;
      persistUiPreference(key, next);
      return next;
    });
  }

  function setRememberedPanel(setter: Dispatch<SetStateAction<boolean>>, key: UiPreferenceKey, value: boolean) {
    setter(value);
    persistUiPreference(key, value);
  }

  const studyInstructionPanel = studyPhase === "study" ? (
    <View style={[styles.instructionBox, instructionsCollapsed && styles.collapsedInstructionBox, studyDarkMode && styles.accountDarkSection]}>
      <View style={[styles.instructionHeader, phoneLayout && styles.phoneInstructionHeader]}>
        <View style={[styles.instructionHeaderCopy, phoneLayout && styles.phoneInstructionHeaderCopy]} onLayout={(event) => setStudyStepAnchorY(event.nativeEvent.layout.y)}>
          <Eyebrow>{`Step ${stepIndex + 1} of ${method.steps.length}`}</Eyebrow>
          <Text style={[styles.stepTitle, studyDarkMode && styles.accountDarkTitle]}>{step.title}</Text>
          <Text style={styles.instructionKicker}>Do this now</Text>
          <Text style={[styles.actionText, instructionsCollapsed && styles.collapsedActionText, studyDarkMode && styles.accountDarkText]}>{step.action}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={instructionsCollapsed ? "Show study instructions" : "Hide study instructions"} accessibilityState={{ expanded: !instructionsCollapsed }} onPress={() => toggleRememberedPanel(setInstructionsCollapsed, "studyInstructionsCollapsed")} style={[styles.collapseButton, phoneLayout && styles.phoneInstructionCollapseButton, studyDarkMode && styles.homeDarkResumeButton]}>
          <Ionicons name={instructionsCollapsed ? "chevron-down-outline" : "chevron-up-outline"} size={16} color={studyDarkMode ? "#e9b76a" : colors.oliveDark} />
          <Text style={[styles.collapseButtonText, studyDarkMode && styles.homeDarkResumeButtonText]}>{instructionsCollapsed ? "Show more" : "Hide"}</Text>
        </Pressable>
      </View>
      {!instructionsCollapsed && (
        <>
          <Text style={[styles.body, studyDarkMode && styles.accountDarkMutedText]}>{step.prompt}</Text>
          <View style={styles.checklist}>
            {step.checklist.map((item) => (
              <View key={item} style={styles.checkItem}>
                <Ionicons name="ellipse-outline" size={15} color={colors.olive} />
                <Text style={[styles.checkText, studyDarkMode && styles.accountDarkMutedText]}>{item}</Text>
              </View>
            ))}
          </View>
          {step.responseType === "text" && (
            <View style={[styles.outputBox, studyDarkMode && styles.accountDarkInsetBox]}>
              <Text style={[styles.outputLabel, studyDarkMode && styles.studyDarkAccentText]}>What to write</Text>
              <Text style={[styles.outputText, studyDarkMode && styles.accountDarkText]}>{step.output}</Text>
            </View>
          )}
        </>
      )}
    </View>
  ) : null;

  const showMobileReaderSelectionDock = phoneLayout && tab === "bible" && selectedReaderVerses.length > 0;
  const showMobileReaderNoteEditor = showMobileReaderSelectionDock && !!currentSelectionBookmark && activeBookmarkNoteId === currentSelectionBookmark.id;
  const activeContextHelp = getContextHelp(tab, {
    studyPhase,
    studyStep: stepIndex + 1,
    bibleSearchOpen: !bibleSearchCollapsed,
    bibleSearchResultCount: bibleSearchResults.length,
    selectedBibleVerseCount: selectedReaderVerses.length,
    memoryView,
    memoryPracticing: !!activeMemoryVerseId,
    memoryMeditating: !!activeMemoryMeditationVerseId,
    journalView,
    journalFilter,
    communityView: communitySubView,
    signedIn: isAuthenticated,
    adminProfileSelected: !!selectedAdminProfileId
  });
  const contextHelpBottom = showMobileReaderNoteEditor ? 300 : showMobileReaderSelectionDock ? 142 : 18;

  useEffect(() => {
    if (!pendingBiblePlanReadAhead) return;
    const missedDayKey = bibleReadingPlanDayKey(pendingBiblePlanReadAhead.planId, pendingBiblePlanReadAhead.missedDay);
    if (!completedBibleReadingPlanDaySet.has(missedDayKey)) return;
    setPendingBiblePlanReadAhead(null);
  }, [completedBibleReadingPlanDaySet, pendingBiblePlanReadAhead]);

  useEffect(() => {
    if (!devotionalTextSizeOptionsOpen) return;
    const timer = setTimeout(() => setDevotionalTextSizeOptionsOpen(false), 7000);
    return () => clearTimeout(timer);
  }, [devotionalTextSizeOptionsOpen]);

  useEffect(() => {
    if (!pendingBiblePlanContinueCheck) return;
    const plan = allBibleReadingPlans.find((item) => item.id === pendingBiblePlanContinueCheck.planId);
    if (!plan) {
      setPendingBiblePlanContinueCheck(null);
      return;
    }
    const nextDay = plan.days.find((day) => !completedBibleReadingPlanDaySet.has(bibleReadingPlanDayKey(plan.id, day.day)));
    const startDate = bibleReadingPlanStartDates[plan.id] || "";
    const nextDateKey = startDate && nextDay ? addDaysToDateKey(startDate, nextDay.day - 1) : "";
    setPendingBiblePlanContinueCheck(null);
    if (!nextDay || !nextDateKey || nextDateKey > localDateKey()) return;
    setPendingBiblePlanContinuePrompt({
      planId: plan.id,
      nextDay: nextDay.day,
      nextDateKey,
      completedReference: pendingBiblePlanContinueCheck.completedReference
    });
  }, [
    allBibleReadingPlans,
    bibleReadingPlanStartDates,
    completedBibleReadingPlanDaySet,
    pendingBiblePlanContinueCheck
  ]);

  useEffect(() => {
    if (!pendingBiblePlanCompletionCelebration) return;
    planCelebrationPulse.setValue(0);
    planCelebrationParticles.forEach((particle) => particle.setValue(0));

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(planCelebrationPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(planCelebrationPulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true
        })
      ]),
      { iterations: 3 }
    );
    const particleAnimation = Animated.stagger(
      90,
      planCelebrationParticles.map((particle) =>
        Animated.timing(particle, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        })
      )
    );

    Animated.parallel([pulseAnimation, particleAnimation]).start();
    return () => {
      pulseAnimation.stop();
      particleAnimation.stop();
    };
  }, [
    pendingBiblePlanCompletionCelebration,
    planCelebrationParticles,
    planCelebrationPulse
  ]);

  useEffect(() => {
    const followedPlanIds = new Set(followedBibleReadingPlans.map((plan) => plan.id));
    const activePlanIds = new Set([
      activeBibleReadingPlan?.id || "",
      ...otherFollowedBibleReadingPlans.map((plan) => plan.id)
    ].filter(Boolean));

    if (activeBibleReadingPlanId && activeBibleReadingPlanId !== selectedBibleReadingPlanId) {
      setActiveBibleReadingPlanId(selectedBibleReadingPlanId);
    }

    if (activeBiblePlanSelectedPlanId && !activePlanIds.has(activeBiblePlanSelectedPlanId)) {
      setActiveBiblePlanSelectedPlanId(selectedBibleReadingPlanId);
      setActiveBiblePlanSelectedDay(0);
    }

    if (pendingBiblePlanReadAhead?.planId && !followedPlanIds.has(pendingBiblePlanReadAhead.planId)) {
      setPendingBiblePlanReadAhead(null);
    }

    if (pendingBiblePlanContinuePrompt?.planId && !followedPlanIds.has(pendingBiblePlanContinuePrompt.planId)) {
      setPendingBiblePlanContinuePrompt(null);
    }

    if (readerPlanReading?.planId && !followedPlanIds.has(readerPlanReading.planId)) {
      setReaderPlanReading(null);
    }
  }, [
    activeBiblePlanSelectedPlanId,
    activeBibleReadingPlan?.id,
    activeBibleReadingPlanId,
    followedBibleReadingPlans,
    otherFollowedBibleReadingPlans,
    pendingBiblePlanContinuePrompt?.planId,
    pendingBiblePlanReadAhead?.planId,
    readerPlanReading?.planId,
    selectedBibleReadingPlanId
  ]);

  function setRememberedDevotionalTextSize(size: DevotionalTextSize) {
    setDevotionalTextSize(size);
    setDevotionalTextSizeOptionsOpen(false);
    saveStoredDevotionalTextSize(size).catch(() => undefined);
    persistUiPreference("devotionalTextSize", size);
  }

  const renderDevotionalTextSizeControl = (darkMode: boolean) => {
    const activeOption = DEVOTIONAL_TEXT_SIZE_OPTIONS.find((option) => option.id === devotionalTextSize) || DEVOTIONAL_TEXT_SIZE_OPTIONS[0];
    return (
      <View style={styles.devotionalTextSizeAnchor}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: devotionalTextSizeOptionsOpen }}
          accessibilityLabel={devotionalTextSizeOptionsOpen ? "Hide devotional text size options" : "Show devotional text size options"}
          onLongPress={(event: any) => {
            event.stopPropagation?.();
            setDevotionalTextSizeOptionsOpen(true);
          }}
          onPress={(event: any) => {
            event.stopPropagation?.();
            setDevotionalTextSizeOptionsOpen((open) => !open);
          }}
          style={[styles.devotionalTextSizeSingleButton, darkMode && styles.devotionalTextSizeButtonDark]}
        >
          <Ionicons name="search-outline" size={activeOption.iconSize} color={darkMode ? "#e9b76a" : colors.muted} />
        </Pressable>
        {devotionalTextSizeOptionsOpen && (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close devotional text size options"
              onPress={(event: any) => {
                event.stopPropagation?.();
                setDevotionalTextSizeOptionsOpen(false);
              }}
              style={styles.devotionalTextSizeDismissLayer}
            />
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
                      onPress={(event: any) => {
                        event.stopPropagation?.();
                        setRememberedDevotionalTextSize(option.id);
                      }}
                      style={[styles.devotionalTextSizeButton, selected && styles.devotionalTextSizeButtonActive, darkMode && styles.devotionalTextSizeButtonDark, darkMode && selected && styles.devotionalTextSizeButtonActiveDark]}
                    >
                      <Ionicons name="search-outline" size={option.iconSize} color={selected ? (darkMode ? "#211a12" : "white") : (darkMode ? "#e9b76a" : colors.muted)} />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </View>
    );
  };

  const renderPlanDayDevotional = (planDay: BibleReadingPlanDay, darkMode: boolean) => {
    const visibleCareNote = shouldShowBibleReadingCareNote(planDay.careNote) ? planDay.careNote : "";
    if (!planDay.context && !planDay.devotional && !planDay.observationQuestion && !planDay.reflectionQuestion && !planDay.reflectionPrompt && !planDay.prayer && !planDay.prayerPrompt && !planDay.gentleAction && !planDay.studyMethod && !visibleCareNote) return null;
    const devotionalTextSizing = DEVOTIONAL_TEXT_SIZE_STYLES[devotionalTextSize] || DEVOTIONAL_TEXT_SIZE_STYLES.normal;

    return (
      <View style={[styles.planDayDevotionalBox, darkMode && styles.planDayDevotionalBoxDark]}>
        {!planDay.context && (
          <View style={styles.planDayDevotionalToolbar}>
            {renderDevotionalTextSizeControl(darkMode)}
          </View>
        )}
        {!!planDay.context && (
          <View style={styles.planDayPromptRow}>
            <View style={styles.planDayPromptHeaderRow}>
              <Text style={[styles.planDayPromptLabel, devotionalTextSizing.label, darkMode && styles.studyDarkAccentText]}>Context</Text>
              {renderDevotionalTextSizeControl(darkMode)}
            </View>
            <Text style={[styles.planDayPromptText, devotionalTextSizing.copy, darkMode && styles.accountDarkMutedText]}>{planDay.context}</Text>
          </View>
        )}
        {!!planDay.devotional && (
          <>
            <View style={styles.planDayDevotionalHeader}>
              <View style={styles.planDayDevotionalTitleRow}>
                <Ionicons name="leaf-outline" size={15} color={darkMode ? "#e9b76a" : colors.oliveDark} />
                <Text style={[styles.planDayDevotionalTitle, devotionalTextSizing.title, darkMode && styles.accountDarkTitle]}>{planDay.devotional.title}</Text>
              </View>
            </View>
            <Text style={[styles.planDayDevotionalText, devotionalTextSizing.copy, darkMode && styles.accountDarkMutedText]}>{planDay.devotional.body}</Text>
          </>
        )}
        {!!planDay.observationQuestion && (
          <View style={styles.planDayPromptRow}>
            <Text style={[styles.planDayPromptLabel, devotionalTextSizing.label, darkMode && styles.studyDarkAccentText]}>Notice</Text>
            <Text style={[styles.planDayPromptText, devotionalTextSizing.copy, darkMode && styles.accountDarkMutedText]}>{planDay.observationQuestion}</Text>
          </View>
        )}
        {!!(planDay.reflectionQuestion || planDay.reflectionPrompt) && (
          <View style={styles.planDayPromptRow}>
            <Text style={[styles.planDayPromptLabel, devotionalTextSizing.label, darkMode && styles.studyDarkAccentText]}>Reflect</Text>
            <Text style={[styles.planDayPromptText, devotionalTextSizing.copy, darkMode && styles.accountDarkMutedText]}>{planDay.reflectionQuestion || planDay.reflectionPrompt}</Text>
          </View>
        )}
        {!!(planDay.prayer || planDay.prayerPrompt) && (
          <View style={styles.planDayPromptRow}>
            <Text style={[styles.planDayPromptLabel, devotionalTextSizing.label, darkMode && styles.studyDarkAccentText]}>Pray</Text>
            <Text style={[styles.planDayPromptText, devotionalTextSizing.copy, darkMode && styles.accountDarkMutedText]}>{planDay.prayer || planDay.prayerPrompt}</Text>
          </View>
        )}
        {!!planDay.gentleAction && (
          <View style={styles.planDayPromptRow}>
            <Text style={[styles.planDayPromptLabel, devotionalTextSizing.label, darkMode && styles.studyDarkAccentText]}>Next step</Text>
            <Text style={[styles.planDayPromptText, devotionalTextSizing.copy, darkMode && styles.accountDarkMutedText]}>{planDay.gentleAction}</Text>
          </View>
        )}
        {!!planDay.studyMethod && (
          <View style={styles.planDayPromptRow}>
            <Text style={[styles.planDayPromptLabel, devotionalTextSizing.label, darkMode && styles.studyDarkAccentText]}>Study deeper</Text>
            <Text style={[styles.planDayPromptText, devotionalTextSizing.copy, darkMode && styles.accountDarkMutedText]}>{planDay.studyMethod}</Text>
          </View>
        )}
        {!!visibleCareNote && (
          <View style={[styles.planDayPromptRow, styles.planDayCareNoteBox, darkMode && styles.planDayCareNoteBoxDark]}>
            <Text style={[styles.planDayPromptLabel, devotionalTextSizing.label, darkMode && styles.studyDarkAccentText]}>Care note</Text>
            <Text style={[styles.planDayPromptText, devotionalTextSizing.copy, darkMode && styles.accountDarkMutedText]}>{visibleCareNote}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Acknowledge this care note"
              onPress={() => acknowledgeBibleReadingCareNote(visibleCareNote)}
              style={[styles.careNoteAcknowledgeButton, darkMode && styles.homeDarkResumeButton]}
            >
              <Ionicons name="checkmark-circle-outline" size={14} color={darkMode ? "#e9b76a" : colors.oliveDark} />
              <Text style={[styles.careNoteAcknowledgeText, darkMode && styles.homeDarkResumeButtonText]}>I understand</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  const formatPlanDayReferenceTitle = (planDay: BibleReadingPlanDay) => {
    const reference = planDay.reference.trim();
    const title = planDay.title.trim();
    if (!title || title.toLowerCase() === reference.toLowerCase()) return reference;
    return `${reference} · ${title}`;
  };

  function getBiblePlanDayWindow(plan: BibleReadingPlan, focusDay = 1) {
    const size = phoneLayout ? 9 : 15;
    const maximumStart = Math.max(0, plan.days.length - size);
    const centeredStart = Math.max(0, Math.min(maximumStart, focusDay - 1 - Math.floor(size / 2)));
    const start = Math.max(0, Math.min(maximumStart, biblePlanDayWindowStarts[plan.id] ?? centeredStart));
    return {
      days: plan.days.slice(start, start + size),
      firstVisibleDay: plan.days[start]?.day || 1,
      canShowEarlier: start > 0,
      canShowLater: start + size < plan.days.length,
      showEarlier: () => setBiblePlanDayWindowStarts((current) => ({ ...current, [plan.id]: Math.max(0, start - size) })),
      showLater: () => setBiblePlanDayWindowStarts((current) => ({ ...current, [plan.id]: Math.min(maximumStart, start + size) }))
    };
  }

  const renderFollowedBibleReadingPlanPanel = (plan: BibleReadingPlan) => {
    const completedCount = plan.days.filter((day) => completedBibleReadingPlanDaySet.has(bibleReadingPlanDayKey(plan.id, day.day))).length;
    const today = plan.days.find((day) => !completedBibleReadingPlanDaySet.has(bibleReadingPlanDayKey(plan.id, day.day))) || plan.days[0];
    const complete = plan.days.length > 0 && completedCount >= plan.days.length;
    const startDate = bibleReadingPlanStartDates[plan.id] || "";
    const selectedDay =
      activeBiblePlanSelectedPlanId === plan.id && activeBiblePlanSelectedDay
        ? plan.days.find((day) => day.day === activeBiblePlanSelectedDay) || today || plan.days[0]
        : today || plan.days[0] || null;
    const selectedDateKey = startDate && selectedDay ? addDaysToDateKey(startDate, selectedDay.day - 1) : "";
    const todayDateKey = startDate && today ? addDaysToDateKey(startDate, today.day - 1) : "";
    const missedFullDay = !!todayDateKey && !complete && todayDateKey < localDateKey();
    const nextReadingLabel = today
      ? missedFullDay
        ? `Overdue: Day ${today.day}${todayDateKey ? ` · ${formatPlanDayRelativeDate(todayDateKey)}` : ""}`
        : `Next reading: Day ${today.day}${todayDateKey ? ` · ${formatPlanDayRelativeDate(todayDateKey)}` : ""}`
      : "";
    const selectedDone = !!selectedDay && completedBibleReadingPlanDaySet.has(bibleReadingPlanDayKey(plan.id, selectedDay.day));
    const progressPercent = plan.days.length ? (completedCount / plan.days.length) * 100 : 0;
    const openPlanDay = selectedDay || today;
    const dayWindow = getBiblePlanDayWindow(plan, selectedDay?.day || today?.day || 1);

    return (
      <View key={plan.id} style={[styles.currentPlanWideBox, styles.currentBibleReadingPlanBox, phoneLayout && styles.phoneCurrentPlanWideBox, plansDarkMode && styles.accountDarkSection]}>
        <View style={[styles.journalHeader, phoneLayout && styles.phonePlanHeader]}>
          <View style={styles.journalTitleBlock}>
            <View style={styles.planPageTitleRow}>
              <Text style={[styles.cardTitle, plansDarkMode && styles.accountDarkTitle]}>{plan.title}</Text>
            </View>
            <Text style={[styles.muted, styles.currentPlanHeaderSpacer, plansDarkMode && styles.accountDarkMutedText]}>{" "}</Text>
          </View>
          <Text style={[styles.draftPill, styles.readingPlanCountPill, plansDarkMode && styles.plansDarkDraftPill]}>{completedCount}/{plan.days.length}</Text>
        </View>
        <View style={[styles.planProgressTrack, plansDarkMode && styles.plansDarkProgressTrack]}>
          <View style={[styles.planProgressFill, complete && styles.completedPlanProgressFill, { width: `${Math.min(100, progressPercent)}%` }]} />
        </View>
        {!!today && (
          <View style={[styles.currentPlanNextBox, plansDarkMode && styles.accountDarkInsetBox]}>
            <View style={styles.planDayCopy}>
              <Text style={[styles.readerBookSectionTitle, plansDarkMode && styles.studyDarkAccentText]}>
                {complete ? "Plan complete" : nextReadingLabel}
              </Text>
              <Text style={[styles.readerReadChapterBookTitle, plansDarkMode && styles.accountDarkTitle]}>{today.reference}</Text>
            </View>
          </View>
        )}
        <ScrollView
          ref={(scrollView) => {
            biblePlanDayPickerRefs.current[plan.id] = scrollView;
          }}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.planDayPickerScroll}
          onContentSizeChange={() => scrollBiblePlanDayPickerIntoView(plan.id, selectedDay?.day || today?.day || 1, false, 20, dayWindow.firstVisibleDay)}
        >
          {dayWindow.canShowEarlier ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`Show earlier days in ${plan.title}`} onPress={dayWindow.showEarlier} style={[styles.planDayTile, styles.planDayWindowButton, plansDarkMode && styles.planDayTileDark]}>
              <Ionicons name="chevron-back-outline" size={18} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
              <Text style={[styles.planDayTileDate, plansDarkMode && styles.accountDarkMutedText]}>Earlier</Text>
            </Pressable>
          ) : null}
          {dayWindow.days.map((planDay) => {
            const done = completedBibleReadingPlanDaySet.has(bibleReadingPlanDayKey(plan.id, planDay.day));
            const selected = selectedDay?.day === planDay.day;
            const dateKey = startDate ? addDaysToDateKey(startDate, planDay.day - 1) : "";
            const dateLabel = dateKey ? formatPlanDayDate(dateKey) : "";
            const currentDateKey = localDateKey();
            const scheduledToday = dateKey === currentDateKey;
            const nextIncomplete = today?.day === planDay.day;
            const missed = !!dateKey && dateKey < currentDateKey && !done;
            return (
              <Pressable
                key={planDay.day}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Day ${planDay.day}${dateLabel ? `, ${dateLabel}` : ""}, ${planDay.reference}, ${done ? "completed" : scheduledToday ? "scheduled for today" : missed ? "missed" : nextIncomplete ? "next incomplete" : "not completed"}`}
                onPress={() => setRememberedPlanSelectedDay(plan.id, planDay.day)}
                style={[
                  styles.planDayTile,
                  phoneLayout && styles.phonePlanDayTile,
                  plansDarkMode && styles.planDayTileDark,
                  scheduledToday && !missed && styles.currentPlanDayTile,
                  missed && styles.missedPlanDayTile,
                  selected && styles.selectedPlanDayTile,
                  selected && missed && styles.selectedMissedPlanDayTile,
                  !plansDarkMode && done && styles.completedPlanDayTile,
                  plansDarkMode && done && styles.completedPlanDayTileDark,
                  plansDarkMode && selected && styles.selectedPlanDayTileDark,
                  plansDarkMode && selected && missed && styles.selectedMissedPlanDayTileDark
                ]}
              >
                <Text style={[styles.planDayTileNumber, plansDarkMode && styles.accountDarkTitle, plansDarkMode && done && styles.completedPlanDayTileText]}>{done ? "✓" : planDay.day}</Text>
                <Text numberOfLines={1} style={[styles.planDayTileDate, plansDarkMode && styles.accountDarkMutedText, plansDarkMode && done && styles.completedPlanDayTileText]}>{dateLabel || `Day ${planDay.day}`}</Text>
                {scheduledToday && <Text style={styles.planDayTileFlag}>Now</Text>}
                {missed && <Text style={styles.planDayTileFlag}>Due</Text>}
              </Pressable>
            );
          })}
          {dayWindow.canShowLater ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`Show later days in ${plan.title}`} onPress={dayWindow.showLater} style={[styles.planDayTile, styles.planDayWindowButton, plansDarkMode && styles.planDayTileDark]}>
              <Ionicons name="chevron-forward-outline" size={18} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
              <Text style={[styles.planDayTileDate, plansDarkMode && styles.accountDarkMutedText]}>Later</Text>
            </Pressable>
          ) : null}
        </ScrollView>
        {selectedDay && (
          <View
            style={[styles.planPageDay, styles.selectedPlanDayDetail, (selectedDay.devotional || selectedDay.reflectionPrompt || selectedDay.prayerPrompt) && styles.selectedPlanDayWithDevotional, phoneLayout && styles.phonePlanPageDay, plansDarkMode && styles.plansDarkDayRow, selectedDone && styles.completedPlanDayRow, plansDarkMode && selectedDone && styles.plansDarkCompletedDayRow]}
          >
            <View style={styles.planDayDetailTopRow}>
              <Text style={[styles.planDayBadge, styles.compactPlanDayBadge, selectedDone && styles.completedPlanDayBadge, plansDarkMode && !selectedDone && styles.plansDarkDayBadge]}>{selectedDone ? "✓" : selectedDay.day}</Text>
              <View style={styles.planDayCopy}>
                <Text style={[styles.planDayTitle, phoneLayout && styles.phonePlanDayTitle, plansDarkMode && styles.accountDarkTitle, plansDarkMode && selectedDone && styles.completedPlanDayTextDark]}>
                  {`Day ${selectedDay.day}${selectedDateKey ? ` · ${formatPlanDayDate(selectedDateKey)}` : ""}`}
                </Text>
                <Text style={[styles.muted, plansDarkMode && styles.accountDarkMutedText, plansDarkMode && selectedDone && styles.completedPlanDayMutedTextDark]}>{formatPlanDayReferenceTitle(selectedDay)}</Text>
              </View>
              <View style={styles.planDayActionStack}>
                <View style={styles.planDayActions}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Open ${selectedDay.reference} in Bible`} onPress={(event: any) => { event.stopPropagation?.(); openBibleReadingPlanDayInBible(selectedDay, plan.id); }} style={[styles.planDayIconAction, plansDarkMode && styles.homeDarkIconBubble]}>
                    <Ionicons name="reader-outline" size={15} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Study ${selectedDay.reference}`} onPress={(event: any) => { event.stopPropagation?.(); studyBibleReadingPlanDay(selectedDay); }} style={[styles.planDayIconAction, plansDarkMode && styles.homeDarkIconBubble]}>
                    <Ionicons name="book-outline" size={15} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={selectedDone ? `${selectedDay.reference} completed` : `Mark ${selectedDay.reference} complete`}
                    onPress={(event: any) => {
                      event.stopPropagation?.();
                      if (!selectedDone) {
                        markBibleReadingPlanDayComplete(selectedDay, plan.id, { promptForNextDueReading: true });
                      }
                    }}
                    style={[styles.planDayIconAction, selectedDone && styles.activeReaderReadButton, !selectedDone && styles.readerPlanCompleteButton]}
                  >
                    <Ionicons name="checkmark-circle-outline" size={15} color="white" />
                  </Pressable>
                </View>
                {selectedDone && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Mark ${selectedDay.reference} incomplete`}
                    onPress={(event: any) => {
                      event.stopPropagation?.();
                      unmarkBibleReadingPlanDayComplete(selectedDay, plan.id);
                    }}
                    style={[styles.planDayTextAction, plansDarkMode && styles.planDayTextActionDark]}
                  >
                    <Text style={[styles.planDayTextActionLabel, plansDarkMode && styles.studyDarkAccentText]}>Mark incomplete</Text>
                  </Pressable>
                )}
              </View>
            </View>
            {renderPlanDayDevotional(selectedDay, plansDarkMode)}
          </View>
        )}
        {missedFullDay && (
          <View style={[styles.currentPlanManagementRow, phoneLayout && styles.phoneCurrentPlanManagementRow]}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Catch up ${plan.title} dates to today`} onPress={() => catchUpActiveBibleReadingPlanDates(plan.id)} style={[styles.currentPlanManagementButton, plansDarkMode && styles.currentPlanManagementButtonDark]}>
              <Ionicons name="calendar-outline" size={14} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
              <Text style={[styles.currentPlanManagementText, plansDarkMode && styles.accountDarkMutedText]}>Catch me up</Text>
            </Pressable>
          </View>
        )}
        {!!biblePlanStatus && activeBibleReadingPlanId === plan.id && <Text style={styles.saveStatus}>{biblePlanStatus}</Text>}
        <View style={[styles.planActionRow, styles.currentPlanBottomActions, phoneLayout && styles.phonePlanActionRow]}>
          {!complete && !!openPlanDay && <AppButton label="Open in Bible" onPress={() => openBibleReadingPlanDayInBible(openPlanDay, plan.id)} style={[styles.currentPlanActionButton, phoneLayout && styles.phonePlanActionButton]} labelStyle={phoneLayout && styles.phonePlanButtonLabel} />}
          {!complete && !!openPlanDay && <AppButton label="Study" variant="secondary" onPress={() => studyBibleReadingPlanDay(openPlanDay)} style={[styles.currentPlanActionButton, phoneLayout && styles.phonePlanActionButton, plansDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phonePlanButtonLabel, plansDarkMode && styles.homeDarkResumeButtonText]} />}
          <AppButton label="Stop" variant="secondary" onPress={() => requestStopFollowingBibleReadingPlan(plan.id)} style={[styles.currentPlanActionButton, phoneLayout && styles.phonePlanActionButton, plansDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phonePlanButtonLabel, plansDarkMode && styles.homeDarkResumeButtonText]} />
        </View>
      </View>
    );
  };

  const renderCompletedBibleReadingPlanCard = (plan: BibleReadingPlan) => {
    const firstDay = plan.days[0];
    const completedDateKey = bibleReadingPlanCompletionDates[plan.id] || "";
    const completedDateLabel = completedDateKey ? formatPlanDayDate(completedDateKey) : "";
    const completionCount = bibleReadingPlanCompletionCounts[plan.id] || (completedDateKey ? 1 : 0);
    const completionCountLabel = completionCount ? formatBibleReadingPlanCompletionCount(completionCount) : "";

    return (
      <View key={plan.id} style={[styles.completedReadingPlanCard, phoneLayout && styles.phoneCompletedReadingPlanCard, plansDarkMode && styles.accountDarkSection]}>
        <View style={styles.completedReadingPlanHeader}>
          <View style={styles.journalTitleBlock}>
            <Text style={[styles.cardTitle, plansDarkMode && styles.accountDarkTitle]}>{plan.title}</Text>
            <Text style={[styles.muted, plansDarkMode && styles.accountDarkMutedText]}>
              {[
                `${plan.days.length} ${plan.days.length === 1 ? "reading" : "readings"} complete`,
                completedDateLabel ? `last completed ${completedDateLabel}` : "",
                completionCountLabel
              ].filter(Boolean).join(" · ")}
            </Text>
          </View>
          <View style={styles.completedReadingPlanStatus}>
            <Ionicons name="checkmark-circle" size={18} color={plansDarkMode ? "#8faa7b" : colors.oliveDark} />
            <Text style={[styles.completedReadingPlanStatusText, plansDarkMode && styles.completedReadingPlanStatusTextDark]}>Complete</Text>
          </View>
        </View>
        <Text style={[styles.currentPlanText, plansDarkMode && styles.accountDarkMutedText]}>
          Progress stays saved. Review the first reading, restart the path, or remove it from this list.
        </Text>
        <View style={[styles.completedReadingPlanActions, phoneLayout && styles.phoneCompletedReadingPlanActions]}>
          {!!firstDay && (
            <Pressable accessibilityRole="button" accessibilityLabel={`Review ${plan.title} from the first reading`} onPress={() => openBibleReadingPlanDayInBible(firstDay, plan.id, { skipOverdueGuard: true })} style={[styles.currentPlanManagementButton, plansDarkMode && styles.currentPlanManagementButtonDark]}>
              <Ionicons name="reader-outline" size={14} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
              <Text style={[styles.currentPlanManagementText, plansDarkMode && styles.accountDarkMutedText]}>Review</Text>
            </Pressable>
          )}
          <Pressable accessibilityRole="button" accessibilityLabel={`Restart ${plan.title}`} onPress={() => requestRestartBibleReadingPlan(plan.id)} style={[styles.currentPlanManagementButton, plansDarkMode && styles.currentPlanManagementButtonDark]}>
            <Ionicons name="refresh-outline" size={14} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
            <Text style={[styles.currentPlanManagementText, plansDarkMode && styles.accountDarkMutedText]}>Restart</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${plan.title} from completed plans`} onPress={() => requestStopFollowingBibleReadingPlan(plan.id)} style={[styles.currentPlanManagementButton, styles.completedReadingPlanRemoveButton, plansDarkMode && styles.currentPlanManagementButtonDark]}>
            <Ionicons name="close-outline" size={14} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
            <Text style={[styles.currentPlanManagementText, plansDarkMode && styles.accountDarkMutedText]}>Remove</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.screen, accountDarkMode && styles.appDarkScreen, compactLayout && styles.compactScreen]}>
      {!!readerSyncError && <View accessibilityRole="alert" style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 1000, padding: 16, backgroundColor: "#fffaf2", borderWidth: 1, borderColor: "#9c4537" }}>
        <Text>{readerSyncError}</Text>
        <AppButton label="Reload saved version" onPress={() => {
          removeRecoveryValue(`bible-study-tutor-study-recovery-reader-${activeProfileId}`);
          setReplaceReaderArmed(false);
          readerSyncQueue.current = createReaderSyncQueue();
          appliedBibleReaderStateSignatureRef.current = "";
          clearPendingBibleReaderStateSync();
          setReaderSyncError(""); setReaderSyncAttempt(value => value + 1);
        }} />
        <AppButton label={replaceReaderArmed ? "Confirm replace saved version" : "Keep this device copy instead"} onPress={async () => {
          if (!replaceReaderArmed) { setReplaceReaderArmed(true); return; }
          if (!activeProfileId || remoteBibleReaderState === undefined) return;
          const key = `bible-study-tutor-study-recovery-reader-${activeProfileId}`;
          try {
            const state: unknown = JSON.parse(readRecoveryValue(key) || "null");
            if (!state || typeof state !== "object" || Array.isArray(state)) throw new Error("No device copy");
            await saveBibleReaderState({ profileId: activeProfileId, state: state as Parameters<typeof saveBibleReaderState>[0]["state"], baseRevision: remoteBibleReaderState?.revision ?? 0 });
            removeRecoveryValue(key); readerSyncQueue.current = createReaderSyncQueue();
            appliedBibleReaderStateSignatureRef.current = ""; clearPendingBibleReaderStateSync();
            setReaderSyncError(""); setReplaceReaderArmed(false); setReaderSyncAttempt(value => value + 1);
          } catch { setReaderSyncError("Could not save the device copy. The saved version may have changed again. Your device copy is still available."); setReplaceReaderArmed(false); }
        }} />
      </View>}
      {phoneLayout && (
        <View style={[styles.mobileMenuBar, accountDarkMode && styles.appDarkMobileMenuBar]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={mobileMenuOpen ? "Close menu" : "Open menu"}
            onPress={() => setMobileMenuOpen((value) => !value)}
            style={[styles.mobileMenuButton, accountDarkMode && styles.appDarkMobileMenuButton]}
          >
            <HydrationSafeIonicon ready={iconFontReady} name={mobileMenuOpen ? "close-outline" : "menu-outline"} size={23} color={accountDarkMode ? "#e9b76a" : colors.oliveDark} />
          </Pressable>
          <View style={styles.mobileMenuTitleBlock}>
            <Text style={[styles.mobileMenuTitle, accountDarkMode && styles.accountDarkTitle]}>Bible Study Tutor</Text>
            <Text style={[styles.mobileMenuSubtitle, accountDarkMode && styles.accountDarkMutedText]}>{tab === "accountability" ? "Community" : tab === "admin" ? "Admin insights" : tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </View>
        </View>
      )}

      <View
        accessibilityViewIsModal={phoneLayout && mobileMenuOpen}
        {...(Platform.OS === "web" && phoneLayout && mobileMenuOpen ? ({ "aria-modal": true, "data-mobile-menu-modal": true, tabIndex: -1 } as any) : {})}
        style={[styles.sidebar, accountDarkMode && styles.appDarkSidebar, compactLayout && styles.compactSidebar, phoneLayout && !mobileMenuOpen && styles.hiddenMobileSidebar, phoneLayout && mobileMenuOpen && styles.mobileMenuDrawer]}
      >
        <View style={styles.brandRow}>
          <View style={[styles.brandMark, accountDarkMode && styles.appDarkBrandMark]}>
            <Text style={styles.brandMarkText}>BT</Text>
          </View>
          <View style={styles.brandCopy}>
            <Text style={[styles.brandTitle, accountDarkMode && styles.accountDarkTitle]}>Bible Study Tutor</Text>
          </View>
        </View>

        <View style={[styles.tabs, compactLayout && styles.compactTabs]}>
          {([
            ["home", "Home", "home-outline"],
            ["study", "Study", "book-outline"],
            ["bible", "Bible", "reader-outline"],
            ["plans", "Plans", "calendar-outline"],
            ["methods", "Methods", "layers-outline"],
            ["memory", "Memory", "sparkles-outline"],
            ["accountability", "Community", "people-outline"],
            ["journal", "Journal", "journal-outline"],
            ["account", "Account", "person-circle-outline"],
            ["help", "Help", "help-circle-outline"],
            ...(adminStats ? [["admin", "Admin", "analytics-outline"]] : [])
          ] as [Tab, string, string][]).map(([key, label, icon]) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={`Open ${label} tab`}
              onPress={() => {
                if (key === "study") trackPublicAnalytics({ eventType: "start_study_clicked", source: "main_menu", ctaTarget: "/?tab=study" });
                if (key === "bible") trackPublicAnalytics({ eventType: "bible_reader_opened", source: "main_menu", ctaTarget: "/?tab=bible" });
                if (key === "plans") trackPublicAnalytics({ eventType: "plans_opened", source: "main_menu", ctaTarget: "/?tab=plans" });
                if (key === "memory") trackPublicAnalytics({ eventType: "memory_opened", source: "main_menu", ctaTarget: "/?tab=memory" });
                setTab(key as Tab);
                if (phoneLayout) setMobileMenuOpen(false);
              }}
              style={[styles.tab, accountDarkMode && styles.appDarkTab, tab === key && styles.activeTab, accountDarkMode && tab === key && styles.appDarkActiveTab]}
            >
              <HydrationSafeIonicon ready={iconFontReady} name={icon as any} size={18} color={tab === key ? (accountDarkMode ? "#e9b76a" : colors.oliveDark) : (accountDarkMode ? "#c8bda9" : colors.muted)} />
              <Text style={[styles.tabLabel, accountDarkMode && styles.appDarkTabLabel, tab === key && styles.activeTabLabel, accountDarkMode && tab === key && styles.appDarkActiveTabLabel]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {!compactLayout && (
          <>
            <TodayRhythmCard
              profileId={profileMatchesActiveState ? activeProfileId : null}
              timezoneOffsetMinutes={timezoneOffsetMinutes}
              providedStats={shouldLoadStudyStats ? stats : undefined}
              queryOwnStats={!shouldLoadStudyStats}
              progress={progress}
              darkMode={accountDarkMode}
              effectivePartner={effectivePartner}
              friendlyName={friendlyName}
            />

          </>
        )}
      </View>

      <ScrollView
        ref={appScrollRef}
        accessibilityElementsHidden={phoneLayout && mobileMenuOpen}
        importantForAccessibility={phoneLayout && mobileMenuOpen ? "no-hide-descendants" : "auto"}
        {...(Platform.OS === "web" ? ({ "aria-hidden": phoneLayout && mobileMenuOpen } as any) : {})}
        style={styles.contentScroll}
        onScroll={(event) => {
          appScrollYRef.current = event.nativeEvent.contentOffset?.y || 0;
        }}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.content,
          accountDarkMode && styles.appDarkContent,
          phoneLayout && styles.phoneContent,
          phoneLayout && phoneMemoryFocusMode && memoryPracticeLevel > 1 && styles.phoneMemoryPracticeScrollContent,
          showMobileReaderSelectionDock && styles.contentWithMobileReaderDock,
          showMobileReaderNoteEditor && styles.contentWithMobileReaderNoteDock
        ]}
      >
        {profileConnectionState === "error" && (
          <View accessibilityRole="alert" style={[styles.connectionErrorBanner, accountDarkMode && styles.accountDarkInsetBox]}>
            <View style={styles.connectionErrorCopy}>
              <Text style={[styles.bodyStrong, accountDarkMode && styles.accountDarkText]}>Saving is temporarily unavailable</Text>
              <Text style={[styles.muted, accountDarkMode && styles.accountDarkMutedText]}>Your current screen still works. Check your connection, then retry before saving changes.</Text>
            </View>
            <AppButton label="Retry saving" variant="secondary" onPress={() => setProfileInitializationAttempt((attempt) => attempt + 1)} style={accountDarkMode && styles.homeDarkResumeButton} labelStyle={accountDarkMode && styles.homeDarkResumeButtonText} />
          </View>
        )}
        {tab === "home" && (
          <View style={[styles.homeLayout, compactLayout && styles.stackedLayout, homeDarkMode && styles.homeDarkLayout]}>
            <Card style={[styles.homeMainCard, compactLayout && styles.fluidCard, homeDarkMode && styles.accountDarkMainCard]}>
              {homeContinueItems.length > 0 && (
                <View style={styles.homeSideCard}>
                  <Text style={[styles.homeSideTitle, homeDarkMode && styles.accountDarkTitle]}>Pick up where you left off</Text>
                  {homeContinueItems.map((item) => (
                    <Pressable
                      key={item.key}
                      accessibilityRole="button"
                      accessibilityLabel={item.title}
                      onPress={item.onPress}
                      style={[styles.homePathItem, styles.homeContinueItem, homeDarkMode && styles.homeDarkContinueItem]}
                    >
                      <View style={[styles.homePathIcon, homeDarkMode && styles.homeDarkIconBubble]}>
                        <HydrationSafeIonicon ready={iconFontReady} name={item.icon as any} size={17} color={homeDarkMode ? "#e9b76a" : colors.oliveDark} />
                      </View>
                      <View style={styles.homePathTextBlock}>
                        <Text style={[styles.homePathTitle, homeDarkMode && styles.accountDarkTitle]}>{item.title}</Text>
                        <Text numberOfLines={2} style={[styles.homePathDetail, homeDarkMode && styles.accountDarkMutedText]}>{item.detail}</Text>
                      </View>
                      <HydrationSafeIonicon ready={iconFontReady} name="chevron-forward-outline" size={16} color={homeDarkMode ? "#c8bda9" : colors.muted} />
                    </Pressable>
                  ))}
                </View>
              )}
              <View style={[styles.homeHero, homeDarkMode && styles.homeDarkHero]}>
                <Eyebrow>Purpose</Eyebrow>
                <Text style={[styles.homeHeroTitle, phoneLayout && styles.phoneHomeHeroTitle, homeDarkMode && styles.homeDarkHeroTitle]}>
                  {firstName ? `${firstName}, draw near.` : "Draw near."}
                  {"\n"}
                  <Text style={[styles.homeHeroTitleAccent, homeDarkMode && styles.homeDarkHeroTitleAccent]}>Be shaped by Scripture.</Text>
                </Text>
                <Text style={[styles.homeHeroText, homeDarkMode && styles.homeDarkHeroText]}>
                  A little space for Scripture, prayer and reflection. Read a passage, follow a guided study, or return to your journal.
                </Text>
                <View style={styles.homeActionRow}>
                  <AppButton label="Start a guided study" onPress={() => openStudyFromPublicSource("home_hero")} style={phoneLayout && styles.homePhoneActionButton} />
                  <AppButton
                    label="Open the Bible reader"
                    variant="secondary"
                    onPress={() => openBibleFromPublicSource("home_hero")}
                    style={[phoneLayout && styles.homePhoneActionButton, homeDarkMode && styles.homeDarkResumeButton]}
                    labelStyle={homeDarkMode && styles.homeDarkResumeButtonText}
                  />
                </View>
              </View>

              <View style={styles.homeScriptureGrid}>
                <View style={[styles.homeScriptureBlock, homeDarkMode && styles.homeDarkScriptureBlock]}>
                  <View style={[styles.homeScriptureIcon, homeDarkMode && styles.homeDarkIconBubble]}>
                    <HydrationSafeIonicon ready={iconFontReady} name="heart-outline" size={20} color={homeDarkMode ? "#e9b76a" : colors.coral} />
                  </View>
                  <Text style={[styles.homeScriptureRef, homeDarkMode && styles.homeDarkAccentText]}>James 4:8</Text>
                  <Text style={[styles.homeScriptureQuote, homeDarkMode && styles.accountDarkTitle]}>“Draw near to God, and he will draw near to you.”</Text>
                  <Text style={[styles.homeScriptureNote, homeDarkMode && styles.accountDarkMutedText]}>The app starts with relationship, not tasks. Study becomes a way of coming near.</Text>
                </View>
                <View style={[styles.homeScriptureBlock, homeDarkMode && styles.homeDarkScriptureBlock]}>
                  <View style={[styles.homeScriptureIcon, homeDarkMode && styles.homeDarkIconBubble]}>
                    <HydrationSafeIonicon ready={iconFontReady} name="book-outline" size={20} color={homeDarkMode ? "#e9b76a" : colors.coral} />
                  </View>
                  <Text style={[styles.homeScriptureRef, homeDarkMode && styles.homeDarkAccentText]}>2 Timothy 3:16</Text>
                  <Text style={[styles.homeScriptureQuote, homeDarkMode && styles.accountDarkTitle]}>“Every Scripture is God-breathed and profitable for teaching, for reproof, for correction, and for instruction in righteousness.”</Text>
                  <Text style={[styles.homeScriptureNote, homeDarkMode && styles.accountDarkMutedText]}>The tools are here to help Scripture teach, correct, train, and form a steady life with God.</Text>
                </View>
              </View>

              <Text style={[styles.homePurposeText, homeDarkMode && styles.accountDarkMutedText]}>Free to use. Made for personal study, small groups and pen-and-paper reflection.</Text>
              <HomeSemanticResourceLinks darkMode={homeDarkMode} />
            </Card>

            <View style={[styles.homeSideColumn, compactLayout && styles.fluidCard]}>
              <Card style={[styles.homeSideCard, homeDarkMode && styles.accountDarkMainCard]}>
                <Text style={[styles.homeSideTitle, homeDarkMode && styles.accountDarkTitle]}>Today’s path</Text>
                <Text style={[styles.titleSupport, homeDarkMode && styles.accountDarkMutedText]}>{firstName ? `${firstName}, choose one small next step.` : "Choose one small next step."}</Text>
                <View style={styles.homePathList}>
                  {[
                    ["Bible reader", "Read, search, select verses, or print a worksheet.", "reader-outline", "bible"],
                    ["Guided study", `Work through ${method.short} with notes and highlights.`, "book-outline", "study"],
                    ["Remember", dueMemoryCount > 0 ? `${dueMemoryCount} memory review${dueMemoryCount === 1 ? "" : "s"} due.` : "Save a verse worth carrying.", "sparkles-outline", "memory"],
                    ["Journal", dueStudyReviewCount > 0 ? `${dueStudyReviewCount} study review${dueStudyReviewCount === 1 ? "" : "s"} ready.` : "Keep your notes connected to Scripture.", "journal-outline", "journal"]
                  ].map(([title, detail, icon, target]) => (
                    <Pressable
                      key={title}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${title}`}
                      onPress={() => setTab(target as Tab)}
                      style={[styles.homePathItem, homeDarkMode && styles.homeDarkPathItem]}
                    >
                      <View style={[styles.homePathIcon, homeDarkMode && styles.homeDarkIconBubble]}>
                        <HydrationSafeIonicon ready={iconFontReady} name={icon as any} size={17} color={homeDarkMode ? "#e9b76a" : colors.oliveDark} />
                      </View>
                      <View style={styles.homePathTextBlock}>
                        <Text style={[styles.homePathTitle, homeDarkMode && styles.accountDarkTitle]}>{title}</Text>
                        <Text style={[styles.homePathDetail, homeDarkMode && styles.accountDarkMutedText]}>{detail}</Text>
                      </View>
                      <HydrationSafeIonicon ready={iconFontReady} name="chevron-forward-outline" size={16} color={homeDarkMode ? "#c8bda9" : colors.muted} />
                    </Pressable>
                  ))}
                </View>
              </Card>

              <Card style={[styles.homeSideCard, homeDarkMode && styles.accountDarkMainCard]}>
                <Text style={[styles.homeSideTitle, homeDarkMode && styles.accountDarkTitle]}>At a glance</Text>
                <View style={styles.homeMetricGrid}>
                  <Metric value={stats?.currentStreak ?? 0} label="day rhythm" compact={phoneLayout} style={homeDarkMode && styles.homeDarkMetric} valueStyle={homeDarkMode && styles.homeDarkMetricValue} labelStyle={homeDarkMode && styles.accountDarkMutedText} />
                  <Metric value={dueMemoryCount} label="memory due" compact={phoneLayout} style={homeDarkMode && styles.homeDarkMetric} valueStyle={homeDarkMode && styles.homeDarkMetricValue} labelStyle={homeDarkMode && styles.accountDarkMutedText} />
                  <Metric value={dueStudyReviewCount} label="study reviews" compact={phoneLayout} style={homeDarkMode && styles.homeDarkMetric} valueStyle={homeDarkMode && styles.homeDarkMetricValue} labelStyle={homeDarkMode && styles.accountDarkMutedText} />
                </View>
                {!!homeWeeklyRhythmText && (
                  <View style={[styles.homeWeeklyRhythmPanel, homeDarkMode && styles.homeDarkWeeklyRhythmPanel]}>
                    <View style={styles.homeWeeklyRhythmHeader}>
                      <HydrationSafeIonicon ready={iconFontReady} name="leaf-outline" size={16} color={homeDarkMode ? "#e9b76a" : colors.oliveDark} />
                      <Text style={[styles.homeWeeklyRhythmTitle, homeDarkMode && styles.accountDarkTitle]}>This week</Text>
                    </View>
                    <Text style={[styles.homeWeeklyRhythmText, homeDarkMode && styles.accountDarkMutedText]}>{homeWeeklyRhythmText}</Text>
                  </View>
                )}
                <View style={styles.homeSmallActions}>
                  <ResumeButton label="Choose method" icon="layers-outline" iconReady={iconFontReady} onPress={() => setTab("methods")} style={homeDarkMode && styles.homeDarkResumeButton} labelStyle={homeDarkMode && styles.homeDarkResumeButtonText} iconColor={homeDarkMode ? "#e9b76a" : undefined} />
                  <ResumeButton
                    label="Open plans"
                    icon="calendar-outline"
                    onPress={() => {
                      trackPublicAnalytics({ eventType: "plans_opened", source: "home_glance", ctaTarget: "/?tab=plans" });
                      setTab("plans");
                    }}
                    style={homeDarkMode && styles.homeDarkResumeButton}
                    labelStyle={homeDarkMode && styles.homeDarkResumeButtonText}
                    iconColor={homeDarkMode ? "#e9b76a" : undefined}
                    iconReady={iconFontReady}
                  />
                </View>
              </Card>
            </View>
          </View>
        )}

        {tab === "study" && (
          <View style={[styles.layout, compactLayout && styles.stackedLayout, studyFocusMode && styles.focusLayout, studyDarkMode && styles.accountDarkLayout]}>
            <Card style={[styles.mainCard, compactLayout && styles.fluidCard, studyFocusMode && styles.focusMainCard, studyDarkMode && styles.accountDarkMainCard]}>
              {studyPhase !== "saved" && (
              <View style={[styles.studyGuidedHeader, phoneLayout && styles.phoneStudyGuidedHeader, studyDarkMode && styles.studyDarkGuidedHeader]}>
                <View style={[styles.studyGuidedTopRow, phoneLayout && styles.phoneStudyGuidedTopRow]}>
                  <View style={[styles.studyGuidedTitleBlock, phoneLayout && styles.phoneStudyGuidedTitleBlock]}>
                    <Eyebrow>Guided study</Eyebrow>
                    <Text style={[styles.title, phoneLayout && styles.phoneStudyGuidedTitle, studyDarkMode && styles.accountDarkTitle]}>{firstName ? `${firstName}, your ${method.short} study` : `${method.short} Study`}</Text>
                  </View>
                  <View style={[styles.studyHeaderControls, phoneLayout && styles.phoneStudyHeaderControls]}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={studyMethodPickerOpen ? "Hide study method picker" : "Show study method picker"}
                          onPress={() => setStudyMethodPickerOpen((value) => !value)}
                          style={[styles.compactMethodPicker, studyDarkMode && styles.studyDarkPillControl]}
                        >
                          <Text style={[styles.compactMethodLabel, studyDarkMode && styles.studyDarkAccentText]}>Method</Text>
                          <Text style={[styles.compactMethodCurrent, studyDarkMode && styles.accountDarkTitle]}>{method.short}</Text>
                          <Ionicons name={studyMethodPickerOpen ? "chevron-up-outline" : "chevron-down-outline"} size={15} color={studyDarkMode ? "#e9b76a" : colors.oliveDark} />
                        </Pressable>
                  </View>
                  <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={studyFocusMode ? "Turn study focus mode off" : "Turn study focus mode on"}
                        onPress={() => {
                          const nextValue = !studyFocusMode;
                          setRememberedStudyFocusMode(nextValue);
                        }}
                        style={[styles.togglePill, styles.studyFocusHeaderToggle, phoneLayout && styles.phoneStudyFocusHeaderToggle, studyDarkMode && styles.studyDarkTogglePill, studyFocusMode && styles.activeTogglePill]}
                      >
                        <Ionicons name={studyFocusMode ? "contract-outline" : "expand-outline"} size={14} color={studyFocusMode ? "white" : (studyDarkMode ? "#c8bda9" : colors.muted)} />
                        <Text style={[styles.toggleText, studyDarkMode && styles.accountDarkMutedText, studyFocusMode && styles.activeToggleText]}>{studyFocusMode ? "Focus off" : "Focus on"}</Text>
                  </Pressable>
                </View>
                <View style={[styles.studyGuidedDescriptionRow, phoneLayout && styles.phoneStudyGuidedDescriptionRow]}>
                  {!studyFocusMode && <Text style={[styles.titleSupport, studyDarkMode && styles.accountDarkMutedText]}>{`${method.description} Take your time and let the passage lead.`}</Text>}
                </View>
                <View style={styles.studyDraftHint}>
                  <Ionicons name="cloud-done-outline" size={15} color={studyDarkMode ? "#e9b76a" : colors.oliveDark} />
                  <Text style={[styles.studyDraftHintText, studyDarkMode && styles.accountDarkMutedText]}>Draft autosave is on. Unfinished studies appear in Journal under Drafts.</Text>
                </View>
                {studyFocusMode && (
                  <View style={[styles.focusPassageSelector, studyDarkMode && styles.accountDarkInput]}>
                    <Ionicons name="book-outline" size={16} color={studyDarkMode ? "#e9b76a" : colors.coral} />
                    <TextInput
                      accessibilityLabel="Bible passage reference in focus mode"
                      value={passageQuery}
                      onChangeText={setPassageQuery}
                      onSubmitEditing={() => applyPassageQuery()}
                      placeholder="Choose passage"
                      placeholderTextColor={studyDarkMode ? "#8f8678" : undefined}
                      style={[styles.focusPassageInput, studyDarkMode && styles.accountDarkText]}
                    />
                    <Pressable accessibilityRole="button" accessibilityLabel="Use this Bible passage" onPress={() => applyPassageQuery()} style={styles.useInlineButton}>
                      <Text style={styles.useInlineText}>Use</Text>
                    </Pressable>
                  </View>
                )}
              </View>
              )}
              {studyPhase !== "saved" && studyMethodPickerOpen && (
                <View style={[styles.compactMethodMenu, studyDarkMode && styles.accountDarkInsetBox]}>
                  {methods.map((item) => (
                      <Pressable
                        key={item.id}
                        accessibilityRole="button"
                        accessibilityLabel={`${item.name} study method`}
                        accessibilityState={{ selected: method.id === item.id }}
                      onPress={() => {
                        switchMethod(item.id);
                        setStudyMethodPickerOpen(false);
                      }}
                      style={[styles.compactMethodChip, studyDarkMode && styles.studyDarkMethodChip, method.id === item.id && styles.activeCompactMethodChip]}
                    >
                      <Text numberOfLines={1} style={[styles.compactMethodText, studyDarkMode && styles.accountDarkMutedText, method.id === item.id && styles.activeCompactMethodText]}>{`${item.short} · ${item.name}`}</Text>
                      <Text style={[styles.compactMethodDuration, studyDarkMode && styles.accountDarkMutedText, method.id === item.id && styles.activeCompactMethodText]}>{item.detail?.duration || item.tone}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {studyPhase !== "saved" && !studyFocusMode && (
                <>
                  <View style={[styles.smartPassageBox, studyDarkMode && styles.studyDarkSmartPassageBox]}>
                    <View style={[styles.smartPassageHeader, studyDarkMode && styles.accountDarkInput]}>
                      <Ionicons name="search-outline" size={20} color={studyDarkMode ? "#e9b76a" : colors.coral} />
                      <TextInput
                        accessibilityLabel="Bible passage reference"
                        value={passageQuery}
                        onChangeText={setPassageQuery}
                        onSubmitEditing={() => applyPassageQuery()}
                        placeholder="Try “Jn 3:16”, “Ps 23”, or “1 Thes 1:1”"
                        placeholderTextColor={studyDarkMode ? "#8f8678" : undefined}
                        style={[styles.smartPassageInput, studyDarkMode && styles.accountDarkText]}
                      />
                      <Pressable accessibilityRole="button" accessibilityLabel="Use this Bible passage" onPress={() => applyPassageQuery()} style={styles.useInlineButton}>
                        <Text style={styles.useInlineText}>Use</Text>
                      </Pressable>
                    </View>
                  </View>
                </>
              )}

              {studyPhase === "study" && (
                <ScrollView
                  horizontal={phoneLayout}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.studyProgressStrip, phoneLayout && styles.phoneStudyProgressStrip]}
                  style={phoneLayout && styles.phoneStudyProgressScroll}
                >
                  {method.steps.map((item, index) => {
                    const itemKey = studyStepKey(method.id, item.id);
                    const stepAnswered = !!answers[itemKey]?.trim();
                    const stepRead = item.responseType === "none" && (index < stepIndex || studyPhase !== "study");
                    const stepSkipped = item.responseType === "text" && !stepAnswered && !!skippedStudySteps[itemKey];
                    const stepCompleted = stepAnswered || stepRead;
                    const active = index === stepIndex;
                    const stepStatus = active ? "current" : stepCompleted ? "completed" : stepSkipped ? "skipped" : "not completed";
                    return (
                      <Pressable
                        key={item.id}
                        accessibilityRole="button"
                        accessibilityLabel={`Step ${index + 1}, ${item.title}, ${stepStatus}`}
                        accessibilityState={{ selected: active }}
                        onPress={() => goToStudyStep(index)}
                        style={[styles.studyProgressPill, phoneLayout && styles.phoneStudyProgressPill, studyDarkMode && styles.studyDarkProgressPill, stepCompleted && styles.completedStudyProgressPill, studyDarkMode && stepCompleted && styles.studyDarkCompletedProgressPill, stepSkipped && styles.skippedStudyProgressPill, active && styles.activeStudyProgressPill]}
                      >
                        <Text
                          style={[
                            styles.studyProgressNumber,
                            studyDarkMode && styles.studyDarkProgressNumber,
                            stepCompleted && styles.completedStudyProgressNumber,
                            studyDarkMode && stepCompleted && styles.studyDarkCompletedProgressNumber,
                            active && styles.activeStudyProgressNumber,
                            studyDarkMode && active && styles.studyDarkActiveProgressNumber
                          ]}
                        >
                          {index + 1}
                        </Text>
                        <Text style={[styles.studyProgressText, studyDarkMode && styles.accountDarkMutedText, stepCompleted && styles.completedStudyProgressText, studyDarkMode && stepCompleted && styles.accountDarkTitle, stepSkipped && styles.skippedStudyProgressText, active && styles.activeStudyProgressText]} numberOfLines={1}>
                          {item.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              {studyPhase !== "saved" && (
              <View style={[styles.scriptureBox, phoneLayout && styles.phoneScriptureBox, studyFocusMode && styles.focusScriptureBox, studyDarkMode && styles.studyDarkScriptureBox]}>
                <View style={styles.scriptureHeader}>
                  <View>
                    <Eyebrow>Passage text</Eyebrow>
                    <Text style={[styles.scriptureReference, studyDarkMode && styles.accountDarkTitle]}>{passageText?.reference || passage}</Text>
                  </View>
                  <View style={[styles.translationControls, studyDarkMode && styles.accountDarkSegmentedRow]}>
                    {BIBLE_TRANSLATIONS.map((translation) => (
                      <Pressable
                        key={translation.id}
                        accessibilityRole="button"
                        accessibilityLabel={`${translation.label} Bible translation`}
                        accessibilityState={{ selected: bibleTranslation === translation.id }}
                        onPress={() => {
                          setBibleTranslation(translation.id);
                          saveStoredBibleTranslation(translation.id).catch(() => undefined);
                        }}
                        style={[styles.translationOption, bibleTranslation === translation.id && styles.activeTranslationOption]}
                      >
                        <Text style={[styles.translationOptionText, studyDarkMode && styles.accountDarkMutedText, bibleTranslation === translation.id && styles.activeTranslationOptionText]}>
                          {translation.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                {passageText ? (
                  <>
                    {passageText.verses?.length ? (
                      <>
                        <Text style={[styles.markupHelp, studyDarkMode && styles.accountDarkMutedText]}>Tap one or more verses, then choose an action below.</Text>
                        <View style={styles.verseList}>
                          {passageText.verses.map((verse) => {
                            const key = verseMarkupKey(verse);
                            const markup = passageMarkups[key];
                            const markupOption = PASSAGE_MARKUP_OPTIONS.find((item) => item.id === markup);
                            const selected = selectedVerseKeys.includes(key);
                            const savedToMemory = memoryVerseKeys.has(key);
                            const isFocusVerse = studyMethodState.focusVerseKeys.includes(key);
                            const isEvidenceVerse = studyMethodState.evidenceVerseKeys.includes(key);

                            return (
                              <View key={key}>
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel={`${selected ? "Deselect" : "Select"} ${verse.book_name} ${verse.chapter}:${verse.verse}`}
                                  accessibilityState={{ selected }}
                                  onPress={() => toggleVerseSelection(key)}
                                  style={[
                                    styles.verseRow,
                                    phoneLayout && styles.phoneVerseRow,
                                    !markupOption && studyDarkMode && styles.studyDarkVerseRow,
                                    markupOption && { backgroundColor: markupOption.background, borderColor: markupOption.background },
                                    selected && styles.selectedVerseRow
                                  ]}
                                >
                                  <Text style={[styles.verseNumber, phoneLayout && styles.phoneVerseNumber, markupOption && { color: markupOption.color }]}>{verse.verse}</Text>
                                  <View style={styles.verseTextBlock}>
                                    <Text style={[styles.verseText, phoneLayout && styles.phoneVerseText, studyDarkMode && !markupOption && styles.accountDarkText, markupOption && { color: markupOption.color }]}>{verse.text.trim()}</Text>
                                  </View>
                                  {(savedToMemory || isFocusVerse || isEvidenceVerse) && (
                                    <View style={styles.verseStatusBadges}>
                                      {isFocusVerse && <View style={[styles.memoryVerseBadge, styles.methodVerseBadge]}><Text style={styles.methodVerseBadgeText}>Focus</Text></View>}
                                      {isEvidenceVerse && <View style={[styles.memoryVerseBadge, styles.methodVerseBadge]}><Text style={styles.methodVerseBadgeText}>Evidence</Text></View>}
                                      {savedToMemory && (
                                        <View style={styles.memoryVerseBadge}>
                                          <Ionicons name="sparkles-outline" size={12} color={colors.coral} />
                                          <Text style={styles.memoryVerseBadgeText}>Memory</Text>
                                        </View>
                                      )}
                                    </View>
                                  )}
                                </Pressable>
                                {selectedVerses.length > 0 && key === activeStudyMarkupVerseKey && (
                                  <View style={[styles.inlineReaderActionBar, styles.inlineStudyMarkupBar, phoneLayout && styles.phoneInlineStudyMarkupBar, studyDarkMode && styles.studyDarkFloatingBar]}>
                                    <View style={styles.selectedMarkupHeader}>
                                      <Text style={[styles.readerSelectionText, studyDarkMode && styles.accountDarkTitle]}>
                                        {selectedVerses.length === 1 ? `Verse ${selectedVerses[0].verse} selected` : `${selectedVerses.length} verses selected`}
                                      </Text>
                                      <Pressable onPress={() => setSelectedVerseKeys([])} style={styles.selectedMarkupCloseButton}>
                                        <Ionicons name="close-outline" size={18} color={studyDarkMode ? "#e9b76a" : colors.oliveDark} />
                                      </Pressable>
                                    </View>
                                    <View style={[styles.markupOptionsRow, styles.compactMarkupOptionsRow]}>
                                      {PASSAGE_MARKUP_OPTIONS.map((option) => (
                                        <Pressable
                                          key={option.id}
                                          onPress={() => applyVerseMarkup(option.id)}
                                          style={[
                                            styles.markupOption,
                                            styles.compactMarkupOption,
                                            { backgroundColor: option.background },
                                            selectedVerseMarkup === option.id && styles.activeMarkupOption
                                          ]}
                                        >
                                          <Text style={[styles.markupOptionText, { color: option.color }]}>{option.label}</Text>
                                        </Pressable>
                                      ))}
                                    </View>
                                    <View style={styles.inlineReaderActions}>
                                      {["soap", "lectio", "hear"].includes(method.id) && (
                                        <Pressable onPress={useSelectedVersesAsFocus} style={[styles.inlineReaderBookmarkButton, styles.compactInlineActionButton, studyDarkMode && styles.homeDarkResumeButton]}>
                                          <Ionicons name="bookmark-outline" size={14} color={studyDarkMode ? "#e9b76a" : colors.oliveDark} />
                                          <Text style={[styles.inlineReaderBookmarkText, studyDarkMode && styles.homeDarkResumeButtonText]}>Use as focus</Text>
                                        </Pressable>
                                      )}
                                      {method.id === "oia" && step.title === "Interpret" && (
                                        <Pressable accessibilityRole="button" accessibilityLabel="Save selected verses as evidence for your interpretation" onPress={useSelectedVersesAsEvidence} style={[styles.inlineReaderBookmarkButton, styles.compactInlineActionButton, studyDarkMode && styles.homeDarkResumeButton]}>
                                          <Ionicons name="bookmark-outline" size={14} color={studyDarkMode ? "#e9b76a" : colors.oliveDark} />
                                          <Text style={[styles.inlineReaderBookmarkText, studyDarkMode && styles.homeDarkResumeButtonText]}>Add as evidence</Text>
                                        </Pressable>
                                      )}
                                      {selectedMarkupKinds.length > 0 && (
                                        <Pressable onPress={clearVerseMarkup} style={[styles.inlineReaderBookmarkButton, styles.compactInlineActionButton, studyDarkMode && styles.homeDarkResumeButton]}>
                                          <Ionicons name="remove-circle-outline" size={14} color={studyDarkMode ? "#e9b76a" : colors.oliveDark} />
                                          <Text style={[styles.inlineReaderBookmarkText, studyDarkMode && styles.homeDarkResumeButtonText]}>Unmark</Text>
                                        </Pressable>
                                      )}
                                      <Pressable onPress={saveSelectedVersesToMemory} style={[styles.inlineReaderBookmarkButton, styles.compactInlineActionButton, styles.memoryReaderButton, selectedVersesAlreadyInMemory && styles.savedMemoryButton]}>
                                        <Ionicons name="sparkles-outline" size={14} color="white" />
                                        <Text style={styles.memoryReaderButtonText}>{selectedVersesAlreadyInMemory ? "In Memory" : "Memory"}</Text>
                                      </Pressable>
                                      <Pressable onPress={openStudyWorksheetOptions} style={[styles.inlineReaderBookmarkButton, styles.compactInlineActionButton, studyDarkMode && styles.homeDarkResumeButton]}>
                                        <Ionicons name="print-outline" size={14} color={studyDarkMode ? "#e9b76a" : colors.oliveDark} />
                                        <Text style={[styles.inlineReaderBookmarkText, studyDarkMode && styles.homeDarkResumeButtonText]}>Print</Text>
                                      </Pressable>
                                    </View>
                                    {!!memoryStatus && <Text style={styles.saveStatus}>{memoryStatus}</Text>}
                                    {!!selectedHighlightedVerseKey && (
                                      <View style={[styles.markupNoteBox, studyDarkMode && styles.accountDarkInsetBox]}>
                                        <Text style={styles.markupNoteLabel}>Verse note</Text>
                                        <TextInput
                                          multiline
                                          value={passageMarkupNotes[selectedHighlightedVerseKey] || ""}
                                          onChangeText={updateSelectedVerseNote}
                                          placeholder="Why did this verse stand out?"
                                          placeholderTextColor={studyDarkMode ? "#8f8678" : undefined}
                                          style={[styles.input, styles.markupNoteInput, studyDarkMode && styles.accountDarkInput]}
                                        />
                                      </View>
                                    )}
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </View>
                        {selectedVerses.length === 0 && highlightedVerseCount > 0 && (
                          <View style={[styles.markupToolbar, phoneLayout && styles.phoneMarkupToolbar, studyDarkMode && styles.accountDarkInsetBox]}>
                            <View style={styles.markupToolbarHeader}>
                              <Text style={[styles.markupToolbarTitle, studyDarkMode && styles.accountDarkTitle]}>
                                {selectedVerses.length === 0
                                  ? "Highlight key"
                                  : selectedVerses.length === 1
                                    ? `Verse ${selectedVerses[0].verse} selected`
                                    : `${selectedVerses.length} verses selected`}
                              </Text>
                              {selectedVerses.length > 0 && (
                                <Pressable accessibilityRole="button" accessibilityLabel="Clear selected verses" onPress={() => setSelectedVerseKeys([])} style={styles.markupCloseButton}>
                                  <Ionicons name="close-outline" size={18} color={colors.muted} />
                                </Pressable>
                              )}
                            </View>
                            {selectedVerses.length === 0 && <Text style={[styles.markupToolbarHelp, studyDarkMode && styles.accountDarkMutedText]}>Select one or more verses to add or change highlights.</Text>}
                            <View style={styles.markupOptionsRow}>
                              {PASSAGE_MARKUP_OPTIONS.map((option) => (
                                <Pressable
                                  key={option.id}
                                  disabled={selectedVerses.length === 0}
                                  onPress={() => applyVerseMarkup(option.id)}
                                  style={[
                                    styles.markupOption,
                                    { backgroundColor: option.background },
                                    selectedVerses.length === 0 && styles.markupLegendOption,
                                    selectedVerseMarkup === option.id && styles.activeMarkupOption
                                  ]}
                                >
                                  <Text style={[styles.markupOptionText, { color: option.color }]}>{option.label}</Text>
                                </Pressable>
                              ))}
                              {selectedMarkupKinds.length > 0 && (
                                <Pressable onPress={clearVerseMarkup} style={styles.clearMarkupButton}>
                                  <Text style={styles.clearMarkupText}>Clear markup</Text>
                                </Pressable>
                              )}
                              {selectedVerses.length > 0 && (
                                <Pressable onPress={() => setSelectedVerseKeys([])} style={styles.clearMarkupButton}>
                                  <Text style={styles.clearMarkupText}>Clear selection</Text>
                                </Pressable>
                              )}
                              {selectedVerses.length > 0 && (
                                <Pressable onPress={saveSelectedVersesToMemory} style={[styles.clearMarkupButton, styles.memoryMarkupButton, selectedVersesAlreadyInMemory && styles.savedMemoryButton]}>
                                  <Text style={styles.memoryMarkupText}>{selectedVersesAlreadyInMemory ? "In Memory" : "Save to Memory"}</Text>
                                </Pressable>
                              )}
                              {highlightedVerseCount > 0 && (
                                <Pressable onPress={resetPassageMarkup} style={[styles.clearMarkupButton, styles.clearAllMarkupButton]}>
                                  <Text style={styles.clearMarkupText}>Clear all</Text>
                                </Pressable>
                              )}
                            </View>
                            {!!memoryStatus && <Text style={styles.saveStatus}>{memoryStatus}</Text>}
                            {!!selectedHighlightedVerseKey && (
                              <View style={styles.markupNoteBox}>
                                <Text style={styles.markupNoteLabel}>Verse note</Text>
                                <TextInput
                                  multiline
                                  value={passageMarkupNotes[selectedHighlightedVerseKey] || ""}
                                  onChangeText={updateSelectedVerseNote}
                                  placeholder="Why did this verse stand out?"
                                  style={[styles.input, styles.markupNoteInput]}
                                />
                              </View>
                            )}
                          </View>
                        )}
                      </>
                    ) : (
                      <Text style={[styles.scriptureText, studyDarkMode && styles.accountDarkText]}>{passageText.text.trim()}</Text>
                    )}
                    <Text style={[styles.translationNote, studyDarkMode && styles.accountDarkMutedText]}>
                      {passageText.translation_name} · {passageText.translation_note || "Public Domain"}
                    </Text>
                    <View style={styles.studyPassageActions}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={studyTranslationComparisonOpen ? "Hide translation comparison" : "Compare public-domain translations"}
                        accessibilityState={{ expanded: studyTranslationComparisonOpen }}
                        onPress={() => setStudyTranslationComparisonOpen((value) => !value)}
                        style={[styles.studyContextToggle, studyDarkMode && styles.homeDarkResumeButton]}
                      >
                        <Ionicons name="copy-outline" size={15} color={studyDarkMode ? "#e9b76a" : colors.oliveDark} />
                        <Text style={[styles.studyContextToggleText, studyDarkMode && styles.homeDarkResumeButtonText]}>{studyTranslationComparisonOpen ? "Hide comparison" : "Compare translations"}</Text>
                      </Pressable>
                    </View>
                    {studyTranslationComparisonOpen && (
                      <View style={[styles.translationComparisonBox, studyDarkMode && styles.accountDarkInsetBox]}>
                        <View style={styles.translationComparisonHeader}>
                          <Text style={[styles.studyContextToolTitle, studyDarkMode && styles.accountDarkTitle]}>Public-domain translation comparison</Text>
                          <Text style={[styles.helpIntro, studyDarkMode && styles.accountDarkMutedText]}>Compare wording without treating every difference as a different meaning. Read each rendering in the passage’s context.</Text>
                        </View>
                        {!!studyTranslationComparisonStatus && <Text accessibilityLiveRegion="polite" style={[styles.saveStatus, studyDarkMode && styles.accountDarkMutedText]}>{studyTranslationComparisonStatus}</Text>}
                        <View style={[styles.translationComparisonGrid, phoneLayout && styles.phoneTranslationComparisonGrid]}>
                          {studyTranslationComparisons.map((comparison) => (
                            <View key={comparison.translation_id} style={[styles.translationComparisonColumn, studyDarkMode && styles.accountDarkSection]}>
                              <Text style={[styles.translationComparisonLabel, studyDarkMode && styles.studyDarkAccentText]}>{shortBibleTranslationName(comparison.translation_name)}</Text>
                              {(comparison.verses || []).map((verse) => (
                                <Text key={`${comparison.translation_id}-${verse.verse}`} style={[styles.translationComparisonVerse, studyDarkMode && styles.accountDarkText]}>
                                  <Text style={styles.translationComparisonVerseNumber}>{verse.verse} </Text>{verse.text.trim()}
                                </Text>
                              ))}
                              {!comparison.verses?.length && <Text style={[styles.translationComparisonVerse, studyDarkMode && styles.accountDarkText]}>{comparison.text.trim()}</Text>}
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    {passageText && (
                      <View style={[styles.studyContextTools, studyDarkMode && styles.accountDarkInsetBox]}>
                        <View style={styles.studyContextToolHeader}>
                          <View style={styles.studyContextToolTitleBlock}>
                            <Text style={[styles.studyContextToolTitle, studyDarkMode && styles.accountDarkTitle]}>Context and cross references</Text>
                            {studyContextOpen && <Text style={[styles.studyContextToolIntro, studyDarkMode && styles.accountDarkMutedText]}>Read nearby verses first, then compare related passages.</Text>}
                          </View>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={studyContextOpen ? "Hide context and cross references" : "Show context and cross references"}
                            accessibilityState={{ expanded: studyContextOpen }}
                            onPress={() => setStudyContextOpen((value) => !value)}
                            style={[styles.studyContextToggle, studyDarkMode && styles.homeDarkResumeButton]}
                          >
                            <Ionicons name={studyContextOpen ? "chevron-up-outline" : "git-branch-outline"} size={15} color={studyDarkMode ? "#e9b76a" : colors.oliveDark} />
                            <Text style={[styles.studyContextToggleText, studyDarkMode && styles.homeDarkResumeButtonText]}>{studyContextOpen ? "Hide" : "Show"}</Text>
                          </Pressable>
                        </View>

                        {studyContextOpen && studyContextReference && (
                          <View style={[styles.studyContextPreviewBox, studyDarkMode && styles.studyDarkPreviewBox]}>
                            <Text style={[styles.studyContextPreviewLabel, studyDarkMode && styles.studyDarkAccentText]}>{studyContextReference.reference}</Text>
                            {!!studyContextStatus && <Text style={[styles.helpDescription, studyDarkMode && styles.accountDarkMutedText]}>{studyContextStatus}</Text>}
                            {studyContextPassage?.verses?.length ? (
                              <View style={styles.studyContextVerseList}>
                                {studyContextPassage.verses.map((verse) => {
                                  const selected = isVerseWithinReference(verse, studyContextReference.selectedReference);
                                  return (
                                    <View key={`context-${verse.book_name}-${verse.chapter}-${verse.verse}`} style={[styles.studyContextVerseRow, selected && styles.studyContextSelectedVerseRow, studyDarkMode && styles.studyDarkContextVerseRow, selected && studyDarkMode && styles.studyDarkContextSelectedVerseRow]}>
                                      <Text style={[styles.studyContextVerseNumber, selected && styles.studyContextSelectedVerseNumber, studyDarkMode && !selected && styles.accountDarkMutedText]}>{verse.verse}</Text>
                                      <Text style={[styles.studyContextVerseText, selected && styles.studyContextSelectedVerseText, studyDarkMode && !selected && styles.accountDarkText, selected && studyDarkMode && styles.accountDarkTitle]}>{verse.text.trim()}</Text>
                                    </View>
                                  );
                                })}
                              </View>
                            ) : null}
                          </View>
                        )}

                        {studyContextOpen && (studyCrossReferenceListStatus || studyCrossReferences.length > 0) && (
                          <View style={styles.studyCrossReferenceArea}>
                            <Text style={[styles.studyContextPreviewLabel, studyDarkMode && styles.studyDarkAccentText]}>Cross references</Text>
                            {!!studyCrossReferenceListStatus && <Text style={[styles.studyCrossReferenceReason, studyDarkMode && styles.accountDarkMutedText]}>{studyCrossReferenceListStatus}</Text>}
                            <View style={styles.studyCrossReferenceRow}>
                              {studyCrossReferences.map((item) => {
                                const selected = selectedStudyCrossReference?.reference === item.reference;
                                return (
                                  <Pressable
                                    key={item.reference}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Open cross reference ${item.reference}`}
                                    accessibilityState={{ selected }}
                                    onPress={() => setSelectedStudyCrossReference(selected ? null : item)}
                                    style={[styles.studyCrossReferenceChip, selected && styles.activeStudyCrossReferenceChip, studyDarkMode && styles.studyDarkCrossReferenceChip, selected && studyDarkMode && styles.studyDarkActiveCrossReferenceChip]}
                                  >
                                    <Text style={[styles.studyCrossReferenceText, selected && styles.activeStudyCrossReferenceText, studyDarkMode && !selected && styles.accountDarkTitle]}>{item.reference}</Text>
                                  </Pressable>
                                );
                              })}
                            </View>
                            {selectedStudyCrossReference && (
                              <View style={[styles.studyContextPreviewBox, styles.studyCrossReferencePreviewBox, studyDarkMode && styles.studyDarkPreviewBox]}>
                                <View style={styles.studyCrossReferencePreviewHeader}>
                                  <View style={styles.studyCrossReferencePreviewTitleBlock}>
                                    <Text style={[styles.studyContextPreviewLabel, studyDarkMode && styles.studyDarkAccentText]}>{selectedStudyCrossReference.title}</Text>
                                    <Text style={[styles.helpTitle, studyDarkMode && styles.accountDarkTitle]}>{selectedStudyCrossReference.reference} · {bibleTranslation.toUpperCase()}</Text>
                                    <Text style={[styles.studyCrossReferenceReason, studyDarkMode && styles.accountDarkMutedText]}>{selectedStudyCrossReference.reason}</Text>
                                  </View>
                                  <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Close cross reference preview"
                                    onPress={() => setSelectedStudyCrossReference(null)}
                                    style={styles.studyCrossReferenceClose}
                                  >
                                    <Ionicons name="close-outline" size={18} color={studyDarkMode ? "#e9b76a" : colors.muted} />
                                  </Pressable>
                                </View>
                                {!!studyCrossReferenceStatus && <Text style={[styles.helpDescription, studyDarkMode && styles.accountDarkMutedText]}>{studyCrossReferenceStatus}</Text>}
                                {studyCrossReferencePassage?.verses?.length ? (
                                  <View style={styles.studyContextVerseList}>
                                    {studyCrossReferencePassage.verses.map((verse) => (
                                      <View key={`cross-${verse.book_name}-${verse.chapter}-${verse.verse}`} style={[styles.studyContextVerseRow, studyDarkMode && styles.studyDarkContextVerseRow]}>
                                        <Text style={[styles.studyContextVerseNumber, studyDarkMode && styles.accountDarkMutedText]}>{verse.verse}</Text>
                                        <Text style={[styles.studyContextVerseText, studyDarkMode && styles.accountDarkText]}>{verse.text.trim()}</Text>
                                      </View>
                                    ))}
                                  </View>
                                ) : null}
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                    {passageText.verses?.length ? (
                      <View style={styles.studyPrintRow}>
                        <ResumeButton
                          label={selectedVerses.length ? "Print selected worksheet" : "Print worksheet"}
                          icon="print-outline"
                          onPress={openStudyWorksheetOptions}
                          style={[phoneLayout && styles.phoneStudyPrintButton, studyDarkMode && styles.homeDarkResumeButton]}
                          labelStyle={[phoneLayout && styles.phoneStudyPrintButtonText, studyDarkMode && styles.homeDarkResumeButtonText]}
                          iconColor={studyDarkMode ? "#e9b76a" : undefined}
                        />
                        <ResumeButton
                          label="Group guide"
                          icon="people-outline"
                          onPress={() => void openGroupStudyGuide()}
                          style={[phoneLayout && styles.phoneStudyPrintButton, studyDarkMode && styles.homeDarkResumeButton]}
                          labelStyle={[phoneLayout && styles.phoneStudyPrintButtonText, studyDarkMode && styles.homeDarkResumeButtonText]}
                          iconColor={studyDarkMode ? "#e9b76a" : undefined}
                        />
                      </View>
                    ) : null}
                  </>
                ) : (
                  <View style={styles.passageStatusBox}>
                    <Text style={[styles.muted, studyDarkMode && styles.accountDarkMutedText]}>{passageStatus}</Text>
                    {passageStatus.startsWith("I couldn't") && (
                      <Pressable onPress={() => setPassageReloadKey((value) => value + 1)} style={styles.retryLink}>
                        <Ionicons name="refresh-outline" size={15} color={colors.coral} />
                        <Text style={styles.retryLinkText}>Try again</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
              )}

              {studyInstructionPanel}

              {studyPhase === "saved" && savedStudySummary ? (
                <View accessibilityLiveRegion="polite" aria-live="polite" style={[styles.savedSummaryBox, studyDarkMode && styles.accountDarkInsetBox]}>
                  <View style={[styles.savedSummaryIcon, studyDarkMode && styles.homeDarkIconBubble]}>
                    <Ionicons name="checkmark-circle-outline" size={30} color={colors.coral} />
                  </View>
                  <Eyebrow>Saved to Journal</Eyebrow>
                  <Text style={[styles.stepTitle, studyDarkMode && styles.accountDarkTitle]}>{firstName ? `Your study is safely saved, ${firstName}.` : "Your study is safely saved."}</Text>
                  <Text style={[styles.body, studyDarkMode && styles.accountDarkMutedText]}>{`${savedStudySummary.passage} · ${savedStudySummary.methodName} is now in your Journal.`}</Text>
                  <View style={[styles.savedSummaryGrid, phoneLayout && styles.phoneSavedSummaryGrid]}>
                    <Metric value={1} label="study saved" compact={phoneLayout} style={studyDarkMode && styles.homeDarkMetric} valueStyle={studyDarkMode && styles.homeDarkMetricValue} labelStyle={studyDarkMode && styles.accountDarkMutedText} />
                    <Metric value={savedStudySummary.highlightCount} label="highlights" compact={phoneLayout} style={studyDarkMode && styles.homeDarkMetric} valueStyle={studyDarkMode && styles.homeDarkMetricValue} labelStyle={studyDarkMode && styles.accountDarkMutedText} />
                  </View>
                  {!!savedStudySummary.completedPlanDay && (
                    <View style={[styles.savedSummaryPanel, studyDarkMode && styles.accountDarkSection]}>
                      <Text style={[styles.lastCheckinLabel, studyDarkMode && styles.studyDarkAccentText]}>Plan progress</Text>
                      <Text style={[styles.body, studyDarkMode && styles.accountDarkMutedText]}>{savedStudySummary.completedPlanDay} marked complete.</Text>
                    </View>
                  )}
                  <View style={[styles.savedSummaryPanel, studyDarkMode && styles.accountDarkSection]}>
                    <Text style={[styles.lastCheckinLabel, studyDarkMode && styles.studyDarkAccentText]}>Shareable insight</Text>
                    <Text style={[styles.body, studyDarkMode && styles.accountDarkMutedText]}>{savedStudySummary.shareNote || "Study saved without a share note."}</Text>
                    {!!savedStudySummary.shareNote && renderShareInsightCommunityControls(savedStudySummary.shareNote)}
                    {!!shareInsightStatus && <Text style={styles.saveStatus}>{shareInsightStatus}</Text>}
                  </View>
                  <View style={[styles.savedSummaryPanel, studyDarkMode && styles.accountDarkSection]}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={reviewLaterPanelOpen ? "Hide optional review scheduling" : "Show optional review scheduling"}
                      accessibilityState={{ expanded: reviewLaterPanelOpen }}
                      onPress={() => setReviewLaterPanelOpen((open) => !open)}
                      style={styles.collapsiblePanelHeader}
                    >
                      <View style={styles.savedReviewLaterHeaderCopy}>
                        <Text style={[styles.lastCheckinLabel, studyDarkMode && styles.studyDarkAccentText]}>Review later (optional)</Text>
                        <Text style={[styles.savedReviewLaterSummary, studyDarkMode && styles.accountDarkMutedText]}>
                          {savedStudySummary.reviewAt ? `Scheduled for ${formatReviewDate(savedStudySummary.reviewAt)}` : "Choose a reminder only if it would help."}
                        </Text>
                      </View>
                      <Ionicons name={reviewLaterPanelOpen ? "remove-circle-outline" : "add-circle-outline"} size={24} color={colors.coral} />
                    </Pressable>
                    {reviewLaterPanelOpen && (
                      <View style={styles.savedReviewLaterBody}>
                        <Text style={[styles.body, studyDarkMode && styles.accountDarkMutedText]}>
                          {savedStudySummary.reviewAt
                            ? `${savedStudySummary.readActionReviewRequested ? "Your READ action" : "This study"} is set for review on ${formatReviewDate(savedStudySummary.reviewAt)}.`
                            : savedStudySummary.readActionReviewRequested
                              ? "Your action follow-up was not scheduled. Choose a review time below to try again."
                              : "Choose when you want this study to come back into your Journal."}
                        </Text>
                        <View style={[styles.reviewPresetRow, phoneLayout && styles.phoneReviewPresetRow]}>
                          {STUDY_REVIEW_OPTIONS.map((option) => (
                            <Pressable
                              key={option.id}
                              onPress={() => scheduleStudyReview(savedStudySummary.sessionId, option.id)}
                              style={[styles.filterChip, phoneLayout && styles.phoneJournalFilterChip, studyDarkMode && styles.homeDarkResumeButton]}
                            >
                              <Text style={[styles.filterText, phoneLayout && styles.phoneJournalFilterText, studyDarkMode && styles.homeDarkResumeButtonText]}>{option.label}</Text>
                            </Pressable>
                          ))}
                        </View>
                        <CustomStudyReviewControl
                          styles={styles}
                          value={customStudyReviewDays}
                          onChange={setCustomStudyReviewDays}
                          onSchedule={() => scheduleStudyReview(savedStudySummary.sessionId)}
                        />
                        {!!studyReviewStatus && <Text style={styles.saveStatus}>{studyReviewStatus}</Text>}
                      </View>
                    )}
                  </View>
                  <View style={[styles.savedSummaryActions, phoneLayout && styles.phoneSavedSummaryActions]}>
                    <AppButton label="Open Journal" onPress={() => setTab("journal")} style={phoneLayout && styles.phoneSavedSummaryActionButton} labelStyle={phoneLayout && styles.phoneSavedSummaryActionLabel} />
                    {savedStudySummary.highlightCount > 0 && <AppButton label="Reflect" variant="secondary" onPress={openSavedHighlights} style={phoneLayout && styles.phoneSavedSummaryActionButton} labelStyle={phoneLayout && styles.phoneSavedSummaryActionLabel} />}
                    <AppButton label="Encouragement" variant="secondary" onPress={() => setTab("accountability")} style={phoneLayout && styles.phoneSavedSummaryActionButton} labelStyle={phoneLayout && styles.phoneSavedSummaryActionLabel} />
                    <AppButton label="New study" variant="secondary" onPress={resetCurrentStudy} style={phoneLayout && styles.phoneSavedSummaryActionButton} labelStyle={phoneLayout && styles.phoneSavedSummaryActionLabel} />
                  </View>
                </View>
              ) : studyPhase === "review" ? (
                <View style={[styles.reviewBox, studyDarkMode && styles.accountDarkInsetBox]}>
                  <Eyebrow>Review before saving</Eyebrow>
                  <Text style={[styles.stepTitle, studyDarkMode && styles.accountDarkTitle]}>{passageText?.reference || passage}</Text>
                  <Text style={[styles.reviewMeta, studyDarkMode && styles.accountDarkMutedText]}>{method.name}</Text>
                  <Text accessibilityLiveRegion="polite" aria-live="polite" style={[styles.helpIntro, studyDarkMode && styles.accountDarkMutedText]}>
                    {completedWritingStepCount === 0
                      ? "Complete at least one writing step before this study can be saved."
                      : completedWritingStepCount === writingStepCount
                      ? `All ${writingStepCount} writing steps are complete.`
                      : `${completedWritingStepCount} of ${writingStepCount} writing steps completed. Review unfinished steps before saving if you wish.`}
                  </Text>
                  {(studyMethodState.focusText || focusVerses.length > 0) && (
                    <View style={[styles.reviewAnswer, studyDarkMode && styles.accountDarkSection]}>
                      <Text style={[styles.reviewStepTitle, studyDarkMode && styles.studyDarkAccentText]}>Scripture focus</Text>
                      {!!focusVerses.length && <Text style={[styles.methodSupportReference, studyDarkMode && styles.accountDarkTitle]}>{formatStudyVerseReferences(focusVerses)}</Text>}
                      {!!studyMethodState.focusText && <Text style={[styles.body, studyDarkMode && styles.accountDarkMutedText]}>{studyMethodState.focusText}</Text>}
                    </View>
                  )}
                  {evidenceVerses.length > 0 && (
                    <View style={[styles.reviewAnswer, studyDarkMode && styles.accountDarkSection]}>
                      <Text style={[styles.reviewStepTitle, studyDarkMode && styles.studyDarkAccentText]}>Verses supporting your interpretation</Text>
                      <Text style={[styles.body, studyDarkMode && styles.accountDarkMutedText]}>{formatStudyVerseReferences(evidenceVerses)}</Text>
                    </View>
                  )}
                  {method.id === "read" && studyMethodState.reviewReadActionTomorrow && (
                    <View style={[styles.reviewAnswer, studyDarkMode && styles.accountDarkSection]}>
                      <Text style={[styles.reviewStepTitle, studyDarkMode && styles.studyDarkAccentText]}>Action follow-up</Text>
                      <Text style={[styles.body, studyDarkMode && styles.accountDarkMutedText]}>Schedule this study to return tomorrow after saving.</Text>
                    </View>
                  )}
                  <View style={styles.reviewAnswers}>
                    {method.steps.map((methodStep, index) => {
                      if (methodStep.responseType === "none") return null;
                      const itemKey = studyStepKey(method.id, methodStep.id);
                      const answer = answers[itemKey] || "";
                      return (
                        <View key={methodStep.id} style={[styles.reviewAnswer, studyDarkMode && styles.accountDarkSection]}>
                          <Text style={[styles.reviewStepTitle, studyDarkMode && styles.studyDarkAccentText]}>{methodStep.title}</Text>
                          {answer.trim()
                            ? <FormattedNoteText styles={styles} text={answer} darkMode={studyDarkMode} />
                            : <Text style={[styles.skippedReviewText, studyDarkMode && styles.accountDarkMutedText]}>
                                {skippedStudySteps[itemKey] ? "Skipped for now" : "Not completed"}
                              </Text>}
                        </View>
                      );
                    })}
                  </View>
                  {renderShareInsightPanel("Write a separate note here only if you want to share it. Your study responses stay private unless you deliberately share them.")}
                  <View style={styles.buttonRow}>
                    <AppButton label="Back to edit" variant="secondary" onPress={() => setStudyPhase("study")} />
                    <AppButton label={isCompletingStudy ? "Saving study..." : "Save study"} onPress={completeSession} />
                  </View>
                </View>
              ) : (
                <View style={[styles.guidedStudyStepPanel, phoneLayout && styles.phoneGuidedStudyStepPanel, studyDarkMode && styles.studyDarkStepPanel]}>
                  {method.id === "lectio" && (
                    <View style={[styles.contemplativeTimerBox, studyDarkMode && styles.accountDarkSection]}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={contemplativeTimerOpen ? "Hide optional quiet timer" : "Show optional quiet timer"}
                        accessibilityState={{ expanded: contemplativeTimerOpen }}
                        onPress={() => setContemplativeTimerOpen((value) => !value)}
                        style={styles.contemplativeTimerHeader}
                      >
                        <View style={styles.feedbackHeader}>
                          <Ionicons name="timer-outline" size={18} color={colors.coral} />
                          <Text style={[styles.feedbackTitle, studyDarkMode && styles.studyDarkAccentText]}>Optional quiet timer</Text>
                        </View>
                        <Ionicons name={contemplativeTimerOpen ? "chevron-up-outline" : "chevron-down-outline"} size={17} color={studyDarkMode ? "#e9b76a" : colors.oliveDark} />
                      </Pressable>
                      {contemplativeTimerOpen && (
                        <View style={styles.contemplativeTimerBody}>
                          <Text style={[styles.helpIntro, studyDarkMode && styles.accountDarkMutedText]}>Use silence to remain with the Scripture, not to empty it of its meaning. The timer is optional and stays on this device.</Text>
                          <Text accessibilityLiveRegion={contemplativeTimerSeconds === 0 ? "polite" : "none"} style={[styles.contemplativeTimerValue, studyDarkMode && styles.accountDarkTitle]}>
                            {formatQuietTimer(contemplativeTimerSeconds)}
                          </Text>
                          <View style={styles.contemplativeTimerActions}>
                            {[2, 5, 10].map((minutes) => (
                              <Pressable key={minutes} accessibilityRole="button" onPress={() => { setContemplativeTimerSeconds(minutes * 60); setContemplativeTimerRunning(true); }} style={[styles.filterChip, studyDarkMode && styles.homeDarkResumeButton]}>
                                <Text style={[styles.filterText, studyDarkMode && styles.homeDarkResumeButtonText]}>{minutes} min</Text>
                              </Pressable>
                            ))}
                            {contemplativeTimerSeconds > 0 && (
                              <Pressable accessibilityRole="button" onPress={() => setContemplativeTimerRunning((value) => !value)} style={[styles.filterChip, studyDarkMode && styles.homeDarkResumeButton]}>
                                <Text style={[styles.filterText, studyDarkMode && styles.homeDarkResumeButtonText]}>{contemplativeTimerRunning ? "Pause" : "Resume"}</Text>
                              </Pressable>
                            )}
                            {contemplativeTimerSeconds > 0 && (
                              <Pressable accessibilityRole="button" onPress={() => { setContemplativeTimerRunning(false); setContemplativeTimerSeconds(0); }} style={styles.methodSupportClear}>
                                <Text style={styles.methodSupportClearText}>Reset</Text>
                              </Pressable>
                            )}
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                  {methodExampleModeId === method.id && method.detail?.exampleWalkthrough?.[stepIndex] && (
                    <View style={[styles.methodGuidedExampleBox, studyDarkMode && styles.accountDarkSection]}>
                      <View style={styles.methodGuidedExampleHeader}>
                        <View style={styles.feedbackHeader}>
                          <Ionicons name="school-outline" size={18} color={colors.coral} />
                          <Text style={[styles.feedbackTitle, studyDarkMode && styles.studyDarkAccentText]}>Worked example · not your response</Text>
                        </View>
                        <Pressable accessibilityRole="button" accessibilityLabel="Hide worked example" onPress={() => setMethodExampleModeId("")} style={styles.methodSupportClear}>
                          <Text style={styles.methodSupportClearText}>Hide</Text>
                        </Pressable>
                      </View>
                      <Text style={[styles.methodGuidedExampleText, studyDarkMode && styles.accountDarkText]}>{method.detail.exampleWalkthrough[stepIndex]}</Text>
                      <Text style={[styles.helpIntro, studyDarkMode && styles.accountDarkMutedText]}>Use this to understand the step, then write your own response in the blank editor below.</Text>
                    </View>
                  )}
                  {stepIndex > 0 && ["soap", "lectio", "hear"].includes(method.id) && (studyMethodState.focusText || focusVerses.length > 0) && (
                    <View style={[styles.methodFocusReminder, studyDarkMode && styles.accountDarkSection]}>
                      <Ionicons name="bookmark" size={16} color={studyDarkMode ? "#e9b76a" : colors.oliveDark} />
                      <View style={styles.readyCopy}>
                        <Text style={[styles.methodSupportReference, studyDarkMode && styles.studyDarkAccentText]}>{focusVerses.length ? formatStudyVerseReferences(focusVerses) : "Scripture focus"}</Text>
                        {!!studyMethodState.focusText && <Text numberOfLines={4} style={[styles.methodFocusReminderText, studyDarkMode && styles.accountDarkMutedText]}>{studyMethodState.focusText}</Text>}
                      </View>
                      <Pressable accessibilityRole="button" onPress={() => goToStudyStep(0)} style={styles.methodSupportClear}>
                        <Text style={styles.methodSupportClearText}>Edit</Text>
                      </Pressable>
                    </View>
                  )}
                  {stepIndex === 0 && ["soap", "lectio", "hear"].includes(method.id) && (
                    <View style={[styles.methodSupportBox, studyDarkMode && styles.accountDarkSection]}>
                      <View style={styles.feedbackHeader}>
                        <Ionicons name="bookmark-outline" size={18} color={colors.coral} />
                        <Text style={[styles.feedbackTitle, studyDarkMode && styles.studyDarkAccentText]}>Your Scripture focus</Text>
                      </View>
                      <Text style={[styles.helpIntro, studyDarkMode && styles.accountDarkMutedText]}>Tap a verse in the passage and use it here, or type the exact phrase you want to carry through this method.</Text>
                      {!!focusVerses.length && <Text style={[styles.methodSupportReference, studyDarkMode && styles.accountDarkTitle]}>{formatStudyVerseReferences(focusVerses)}</Text>}
                      <TextInput
                        multiline
                        value={studyMethodState.focusText}
                        onChangeText={(focusText) => setStudyMethodState((current) => ({ ...current, focusText }))}
                        placeholder="Verse or phrase to focus on"
                        placeholderTextColor={studyDarkMode ? "#8f8678" : undefined}
                        style={[styles.input, styles.methodSupportInput, studyDarkMode && styles.accountDarkInput]}
                      />
                      <View style={styles.methodSupportActions}>
                        <Pressable accessibilityRole="button" onPress={useSelectedVersesAsFocus} style={[styles.methodSupportAction, studyDarkMode && styles.homeDarkResumeButton]}>
                          <Text style={[styles.methodSupportActionText, studyDarkMode && styles.homeDarkResumeButtonText]}>{selectedVerses.length ? `Use ${selectedVerses.length === 1 ? "selected verse" : `${selectedVerses.length} selected verses`}` : "Use selected verse"}</Text>
                        </Pressable>
                        {(studyMethodState.focusText || studyMethodState.focusVerseKeys.length > 0) && (
                          <Pressable accessibilityRole="button" onPress={() => setStudyMethodState((current) => ({ ...current, focusText: "", focusVerseKeys: [] }))} style={styles.methodSupportClear}>
                            <Text style={styles.methodSupportClearText}>Clear focus</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  )}
                  {method.id === "oia" && step.title === "Interpret" && (
                    <View style={[styles.methodSupportBox, studyDarkMode && styles.accountDarkSection]}>
                      <View style={styles.feedbackHeader}>
                        <Ionicons name="bookmark-outline" size={18} color={colors.coral} />
                        <Text style={[styles.feedbackTitle, studyDarkMode && styles.studyDarkAccentText]}>Verses supporting your interpretation</Text>
                      </View>
                      <Text style={[styles.helpIntro, studyDarkMode && styles.accountDarkMutedText]}>Optional: select the verse or verses above that most clearly support the meaning you wrote. Saving them keeps their references beside your interpretation in Review. It does not insert verse text, create a hyperlink, or share anything.</Text>
                      {!!evidenceVerses.length && <Text style={[styles.methodSupportReference, studyDarkMode && styles.accountDarkTitle]}>Saved evidence: {formatStudyVerseReferences(evidenceVerses)}</Text>}
                      <View style={styles.methodSupportActions}>
                        <Pressable accessibilityRole="button" accessibilityLabel="Save selected verses as evidence for your interpretation" onPress={useSelectedVersesAsEvidence} style={[styles.methodSupportAction, studyDarkMode && styles.homeDarkResumeButton]}>
                          <Text style={[styles.methodSupportActionText, studyDarkMode && styles.homeDarkResumeButtonText]}>{evidenceVerses.length ? "Add selected as evidence" : "Save selected as evidence"}</Text>
                        </Pressable>
                        {!!studyMethodState.evidenceVerseKeys.length && (
                          <Pressable accessibilityRole="button" accessibilityLabel="Clear saved interpretation evidence" onPress={() => setStudyMethodState((current) => ({ ...current, evidenceVerseKeys: [] }))} style={styles.methodSupportClear}>
                            <Text style={styles.methodSupportClearText}>Clear evidence</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  )}
                  {method.id === "coma" && step.title === "Context" && (
                    <View style={[styles.methodSupportBox, studyDarkMode && styles.accountDarkSection]}>
                      <View style={styles.feedbackHeader}>
                        <Ionicons name="albums-outline" size={18} color={colors.coral} />
                        <Text style={[styles.feedbackTitle, studyDarkMode && styles.studyDarkAccentText]}>Read the nearby context</Text>
                      </View>
                      <Text style={[styles.helpIntro, studyDarkMode && styles.accountDarkMutedText]}>Use the verses before and after the selection to identify the speaker, audience, situation, and flow before writing.</Text>
                      {studyContextReference ? (
                        <>
                          <Pressable accessibilityRole="button" accessibilityState={{ expanded: studyContextOpen }} onPress={() => setStudyContextOpen((value) => !value)} style={[styles.methodSupportAction, styles.methodSupportContextAction, studyDarkMode && styles.homeDarkResumeButton]}>
                            <Text style={[styles.methodSupportActionText, studyDarkMode && styles.homeDarkResumeButtonText]}>{studyContextOpen ? "Hide nearby context" : "Show nearby context"}</Text>
                          </Pressable>
                          {studyContextOpen && (
                            <View style={[styles.methodContextPreview, studyDarkMode && styles.accountDarkInsetBox]}>
                              {!!studyContextStatus && <Text style={[styles.helpDescription, studyDarkMode && styles.accountDarkMutedText]}>{studyContextStatus}</Text>}
                              {studyContextPassage?.verses?.map((verse) => (
                                <View key={`coma-context-${verse.book_name}-${verse.chapter}-${verse.verse}`} style={styles.methodContextVerseRow}>
                                  <Text style={[styles.methodContextVerseNumber, studyDarkMode && styles.accountDarkMutedText]}>{verse.verse}</Text>
                                  <Text style={[styles.methodContextVerseText, studyDarkMode && styles.accountDarkText]}>{verse.text.trim()}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </>
                      ) : (
                        <Text style={[styles.methodContextWholeChapter, studyDarkMode && styles.accountDarkMutedText]}>This selection already includes the whole chapter. Notice how the opening, middle, and closing develop the main thought.</Text>
                      )}
                    </View>
                  )}
                  {step.responseType === "none" ? (
                    <View style={[styles.readyBox, studyDarkMode && styles.accountDarkSection]}>
                      <Ionicons name="book-outline" size={22} color={colors.coral} />
                      <View style={styles.readyCopy}>
                        <Text style={[styles.readyTitle, studyDarkMode && styles.accountDarkTitle]}>No response needed for this step.</Text>
                        <Text style={[styles.readyText, studyDarkMode && styles.accountDarkMutedText]}>Take your time with the passage. When you have completed the checklist, move to the next guided step.</Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={styles.responseWorkspace}>
                        <View style={styles.responseEditorColumn}>
                          <StudyNoteEditor
                            value={answers[answerKey] || ""}
                            onChange={updateAnswerWithScriptureDetection}
                            onSelectionChange={handleAnswerSelectionChange}
                            onFormat={applyNoteFormat}
                            placeholder={step.output}
                            studyFocusMode={studyFocusMode}
                            phoneLayout={phoneLayout}
                            writingPrompts={buildStudyWritingPrompts(method.id, step.title, customWritingPrompts)}
                            customWritingPrompts={customWritingPrompts}
                            writingPromptStatus={writingPromptStatus}
                            onAddCustomWritingPrompt={addCustomWritingPrompt}
                            onRemoveCustomWritingPrompt={removeCustomWritingPrompt}
                            scriptureReference={detectedScriptureReference}
                            scriptureTypedReference={detectedScriptureTypedReference}
                            scriptureInsertStatus={scriptureInsertStatus}
                            scriptureInsertFocusKey={scriptureInsertFocusKey}
                            onInsertScripture={insertDetectedScripture}
                            profileScriptureInsertSettings={(profile as any)?.scriptureInsertSettings}
                            onSaveScriptureInsertSettings={async (settings) => {
                              if (!activeProfileId) return;
                              await saveScriptureInsertSettings({ profileId: activeProfileId, settings });
                            }}
                            darkMode={studyDarkMode}
                          />
                          {!showCoaching && (
                            <Pressable
                              onPress={() => {
                                setShowCoaching(true);
                                saveStoredTutorCoachingEnabled(true).catch(() => undefined);
                                persistUiPreference("studyCoachingVisible", true);
                              }}
                              style={[styles.collapsedCoachingBox, studyDarkMode && styles.accountDarkSection]}
                            >
                              <View style={styles.coachingHeaderRow}>
                                <View style={styles.feedbackHeader}>
                                  <Ionicons name="sparkles-outline" size={17} color={colors.coral} />
                                  <Text style={[styles.feedbackTitle, studyDarkMode && styles.studyDarkAccentText]}>Tutor coaching is off</Text>
                                </View>
                                <Text style={styles.coachingToggleBadge}>Off</Text>
                              </View>
                              <Text style={[styles.collapsedCoachingText, studyDarkMode && styles.accountDarkMutedText]}>Tap to show gentle writing feedback for this step.</Text>
                            </Pressable>
                          )}
                          {showCoaching && (
                            <View style={[styles.coachingBox, studyDarkMode && styles.accountDarkSection]}>
                              <View style={styles.coachingHeaderRow}>
                                <View style={styles.feedbackHeader}>
                                  <Ionicons name="bulb-outline" size={18} color={colors.coral} />
                                  <Text style={[styles.feedbackTitle, studyDarkMode && styles.studyDarkAccentText]}>Coaching feedback</Text>
                                </View>
                                <Pressable onPress={() => {
                                  setShowCoaching(false);
                                  saveStoredTutorCoachingEnabled(false).catch(() => undefined);
                                  persistUiPreference("studyCoachingVisible", false);
                                }} style={[styles.coachingToggleBadge, styles.activeCoachingToggleBadge]}>
                                  <Text style={styles.activeCoachingToggleText}>On</Text>
                                </Pressable>
                              </View>
                              {currentCoaching.length > 0 ? (
                                currentCoaching.map((item) => (
                                  <View key={item} style={styles.coachingItem}>
                                    <Ionicons name="ellipse" size={7} color={colors.olive} />
                                    <Text style={[styles.coachingText, studyDarkMode && styles.accountDarkMutedText]}>{item}</Text>
                                  </View>
                                ))
                              ) : (
                                <Text style={[styles.coachingText, studyDarkMode && styles.accountDarkMutedText]}>Start writing and local coaching will respond to this step.</Text>
                              )}
                            </View>
                          )}
                          {answeredSteps.length > 0 && (
                            <View style={[styles.savedStepBox, studyDarkMode && styles.accountDarkSection]}>
                              <Text style={[styles.savedStepTitle, studyDarkMode && styles.studyDarkAccentText]}>Saved responses</Text>
                              <View style={styles.savedStepRow}>
                                {answeredSteps.map((item) => (
                                  <Pressable
                                    key={item.index}
                                    onPress={() => goToStudyStep(item.index)}
                                    style={[styles.savedStepChip, studyDarkMode && styles.studyDarkMethodChip, stepIndex === item.index && styles.activeSavedStepChip]}
                                  >
                                    <Text style={[styles.savedStepChipText, studyDarkMode && styles.accountDarkMutedText, stepIndex === item.index && styles.activeSavedStepChipText]}>
                                      Step {item.index + 1}
                                    </Text>
                                  </Pressable>
                                ))}
                              </View>
                            </View>
                          )}
                          <View style={styles.responseFooter}>
                            <Text style={styles.saveStatus}>{(answers[answerKey] || "").trim().split(/\s+/).filter(Boolean).length} words</Text>
                          </View>
                        </View>
                      </View>
                      {stepIndex === method.steps.length - 1 && (
                        renderShareInsightPanel("Optional: write a separate note only if you want to share it. Your study response is not copied here automatically.")
                      )}
                      {method.id === "read" && step.title === "Do" && (
                        <Pressable
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: studyMethodState.reviewReadActionTomorrow }}
                          onPress={() => setStudyMethodState((current) => ({ ...current, reviewReadActionTomorrow: !current.reviewReadActionTomorrow }))}
                          style={[styles.methodFollowUpBox, studyMethodState.reviewReadActionTomorrow && styles.activeMethodFollowUpBox, studyDarkMode && styles.accountDarkSection]}
                        >
                          <Ionicons name={studyMethodState.reviewReadActionTomorrow ? "checkbox-outline" : "square-outline"} size={22} color={studyDarkMode ? "#e9b76a" : colors.oliveDark} />
                          <View style={styles.readyCopy}>
                            <Text style={[styles.readyTitle, studyDarkMode && styles.accountDarkTitle]}>Review this action tomorrow</Text>
                            <Text style={[styles.readyText, studyDarkMode && styles.accountDarkMutedText]}>When you save the study, it will return in your Journal for a brief follow-up.</Text>
                          </View>
                        </Pressable>
                      )}
                    </>
                  )}
                  <View style={[styles.buttonRow, phoneLayout && styles.studyStepButtonRow]}>
                    {stepIndex > 0 ? (
                      <AppButton
                        label="Back"
                        variant="secondary"
                        onPress={() => goToStudyStep(stepIndex - 1)}
                        style={[phoneLayout && styles.studyStepBackButton, studyDarkMode && styles.homeDarkResumeButton]}
                        labelStyle={[phoneLayout && styles.studyStepButtonLabel, studyDarkMode && styles.homeDarkResumeButtonText]}
                      />
                    ) : (
                      <View style={[styles.hiddenBackButtonSpace, phoneLayout && styles.studyStepBackButton]} />
                    )}
                    <AppButton
                      label={continueLabel}
                      onPress={continueStudy}
                      style={phoneLayout && styles.studyStepContinueButton}
                      labelStyle={phoneLayout && styles.studyStepButtonLabel}
                    />
                    {step.responseType === "text" && !answers[answerKey]?.trim() && (
                      <AppButton
                        label="Skip for now"
                        variant="secondary"
                        onPress={skipCurrentStudyStep}
                        style={[phoneLayout && styles.studyStepFreshButton, studyDarkMode && styles.homeDarkResumeButton]}
                        labelStyle={[phoneLayout && styles.studyStepButtonLabel, studyDarkMode && styles.homeDarkResumeButtonText]}
                      />
                    )}
                    <AppButton
                      label="Fresh start"
                      variant="secondary"
                      onPress={resetCurrentStudy}
                      style={[phoneLayout && styles.studyStepFreshButton, studyDarkMode && styles.homeDarkResumeButton]}
                      labelStyle={[phoneLayout && styles.studyStepButtonLabel, studyDarkMode && styles.homeDarkResumeButtonText]}
                    />
                  </View>
                  <View style={styles.studySaveStatusRow}>
                    <Text accessibilityLiveRegion="polite" aria-live="polite" style={[styles.saveStatus, studyDarkMode && styles.accountDarkMutedText]}>
                      {isSavingStudyDraft ? "Saving draft..." : saveStatus}
                    </Text>
                    {saveStatus.startsWith("Could not sync") && (
                      <Pressable accessibilityRole="button" accessibilityLabel="Retry saving study draft" onPress={() => void saveCurrentStudyDraft()} style={[styles.studySaveRetryButton, studyDarkMode && styles.homeDarkResumeButton]}>
                        <Text style={[styles.studySaveRetryText, studyDarkMode && styles.homeDarkResumeButtonText]}>Retry save</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              )}
            </Card>

            {!studyFocusMode && (
            <Card style={[styles.memoryCoachCard, compactLayout && styles.fluidCard, studyDarkMode && styles.accountDarkMainCard]}>
              <CollapsibleStudyPanel
                title="Study helps"
                icon="library-outline"
                collapsed={collapsedStudyPanels.helps}
                onToggle={() => toggleStudyPanel("helps")}
                style={styles.studyHelpsBox}
                darkMode={studyDarkMode}
              >
                <Text style={[styles.helpIntro, studyDarkMode && styles.accountDarkMutedText]}>Use these after you have written your own observations.</Text>
                {studyHelps.map((help) => (
                  <Pressable key={help.title} onPress={() => Linking.openURL(help.url)} style={[styles.helpLink, studyDarkMode && styles.accountDarkInsetBox]}>
                    <View style={[styles.helpIcon, studyDarkMode && styles.homeDarkIconBubble]}>
                      <Ionicons name={help.icon as any} size={17} color={studyDarkMode ? "#e9b76a" : colors.oliveDark} />
                    </View>
                    <View style={styles.helpTextBlock}>
                      <Text style={[styles.helpTitle, studyDarkMode && styles.accountDarkTitle]}>{help.title}</Text>
                      <Text style={[styles.helpDescription, studyDarkMode && styles.accountDarkMutedText]}>{help.description}</Text>
                    </View>
                    <Ionicons name="open-outline" size={16} color={studyDarkMode ? "#c8bda9" : colors.muted} />
                  </Pressable>
                ))}
              </CollapsibleStudyPanel>
              <CollapsibleStudyPanel
                title="Reading plans"
                icon="calendar-outline"
                collapsed={collapsedStudyPanels.plan}
                onToggle={() => toggleStudyPanel("plan")}
                style={styles.studyPlansBox}
                darkMode={studyDarkMode}
              >
                {activeBibleReadingPlan && activeBibleReadingPlanToday ? (
                  <View style={styles.bibleReadingPlanStack}>
                    <View style={[styles.bibleReadingPlanPanel, activeBibleReadingPlanQuiet && styles.compactBibleReadingPlanPanel, studyDarkMode && styles.accountDarkSection]}>
                      <View style={styles.bibleReadingPlanHeader}>
                        <View style={styles.bibleReadingPlanTitleBlock}>
                          <Eyebrow>Current plan</Eyebrow>
                          <Text numberOfLines={2} style={[styles.cardTitle, studyDarkMode && styles.accountDarkTitle]}>{activeBibleReadingPlan.title}</Text>
                        </View>
                        <Text style={[styles.draftPill, styles.readingPlanCountPill, studyDarkMode && styles.plansDarkDraftPill]}>
                          {activeBibleReadingPlanCompletedCount}/{activeBibleReadingPlanDayCount}
                        </Text>
                      </View>
                      <View style={styles.planProgressTrack}>
                        <View style={[styles.planProgressFill, activeBibleReadingPlanComplete && styles.completedPlanProgressFill, { width: `${activeBibleReadingPlanProgressPercent}%` }]} />
                      </View>
                      {activeBibleReadingPlanQuiet ? (
                        <View style={[styles.bibleReadingPlanDoneRow, studyDarkMode && styles.accountDarkInsetBox]}>
                          <View style={[styles.bibleReadingPlanDoneIcon, studyDarkMode && styles.homeDarkIconBubble]}>
                            <Ionicons name="checkmark" size={14} color={studyDarkMode ? "#e9b76a" : colors.oliveDark} />
                          </View>
                          <View style={styles.bibleReadingPlanDoneTextBlock}>
                            <Text numberOfLines={1} style={[styles.readerBookSectionTitle, studyDarkMode && styles.accountDarkTitle]}>{activeBibleReadingPlanDoneTodayLabel || "Done today"}</Text>
                            <Text numberOfLines={1} style={[styles.readerReadChapterBookTitle, studyDarkMode && styles.accountDarkMutedText]}>Next: {activeBibleReadingPlanToday.reference}</Text>
                          </View>
                        </View>
                      ) : (
                        <>
                          <View style={styles.bibleReadingPlanMetaRow}>
                            <Text style={[styles.bibleReadingPlanMetaChip, studyDarkMode && styles.plansDarkDraftPill]}>
                              {activeBibleReadingPlanComplete ? "Completed" : `${activeBibleReadingPlanRemainingCount} remaining`}
                            </Text>
                            <Text style={[styles.bibleReadingPlanMetaChip, studyDarkMode && styles.plansDarkDraftPill]}>
                              {activeBibleReadingPlanDayCount} day{activeBibleReadingPlanDayCount === 1 ? "" : "s"}
                            </Text>
                          </View>
                          <Pressable
                            accessibilityRole={activeBibleReadingPlanComplete ? undefined : "button"}
                            accessibilityLabel={activeBibleReadingPlanComplete ? undefined : `Open reading ${activeBibleReadingPlanToday.reference}`}
                            onPress={activeBibleReadingPlanComplete ? undefined : () => openBibleReadingPlanDayInBible(activeBibleReadingPlanToday)}
                            style={[styles.bibleReadingPlanToday, !activeBibleReadingPlanComplete && styles.clickableBibleReadingPlanToday, studyDarkMode && styles.accountDarkInsetBox]}
                          >
                            <View style={styles.bibleReadingPlanTodayHeader}>
                              <View style={styles.bibleReadingPlanTodayTitleBlock}>
                                <Text numberOfLines={2} style={[styles.readerBookSectionTitle, studyDarkMode && styles.studyDarkAccentText]}>
                                  {activeBibleReadingPlanTodayLabel || (activeBibleReadingPlanComplete ? "Plan complete" : `Next reading: Day ${activeBibleReadingPlanToday.day}`)}
                                </Text>
                                <Text numberOfLines={2} style={[styles.readerReadChapterBookTitle, studyDarkMode && styles.accountDarkTitle]}>
                                  {activeBibleReadingPlanComplete ? "Choose a new plan or keep reviewing." : activeBibleReadingPlanToday.reference}
                                </Text>
                              </View>
                              <Ionicons name={activeBibleReadingPlanComplete ? "checkmark-circle" : "calendar-outline"} size={20} color={studyDarkMode ? "#e9b76a" : activeBibleReadingPlanComplete ? colors.oliveDark : colors.coral} />
                            </View>
                          </Pressable>
                        </>
                      )}
                    </View>
                    {otherFollowedBibleReadingPlanSummaries.map((plan) => {
                      const planQuiet = !!plan.doneToday && !plan.complete;
                      return (
                        <View key={plan.id} style={[styles.bibleReadingPlanPanel, planQuiet && styles.compactBibleReadingPlanPanel, studyDarkMode && styles.accountDarkSection]}>
                          <View style={styles.bibleReadingPlanHeader}>
                            <View style={styles.bibleReadingPlanTitleBlock}>
                              <Eyebrow>Reading Plan</Eyebrow>
                              <Text numberOfLines={2} style={[styles.cardTitle, studyDarkMode && styles.accountDarkTitle]}>{plan.title}</Text>
                            </View>
                            <Text style={[styles.draftPill, styles.readingPlanCountPill, studyDarkMode && styles.plansDarkDraftPill]}>{plan.completedCount}/{plan.dayCount}</Text>
                          </View>
                          <View style={styles.planProgressTrack}>
                            <View style={[styles.planProgressFill, plan.complete && styles.completedPlanProgressFill, { width: `${Math.min(100, Math.max(0, plan.progressPercent))}%` }]} />
                          </View>
                          {planQuiet ? (
                            <View style={[styles.bibleReadingPlanDoneRow, studyDarkMode && styles.accountDarkInsetBox]}>
                              <View style={[styles.bibleReadingPlanDoneIcon, studyDarkMode && styles.homeDarkIconBubble]}>
                                <Ionicons name="checkmark" size={14} color={studyDarkMode ? "#e9b76a" : colors.oliveDark} />
                              </View>
                              <View style={styles.bibleReadingPlanDoneTextBlock}>
                                <Text numberOfLines={1} style={[styles.readerBookSectionTitle, studyDarkMode && styles.accountDarkTitle]}>{plan.doneTodayLabel || "Done today"}</Text>
                                <Text numberOfLines={1} style={[styles.readerReadChapterBookTitle, studyDarkMode && styles.accountDarkMutedText]}>Next: {plan.reference}</Text>
                              </View>
                            </View>
                          ) : (
                            <Pressable
                              accessibilityRole={plan.complete ? undefined : "button"}
                              accessibilityLabel={plan.complete ? undefined : `Open ${plan.title} reading ${plan.reference}`}
                              onPress={plan.complete ? undefined : () => {
                                openFollowedBibleReadingPlan(plan.id);
                                setTab("bible");
                              }}
                              style={[styles.bibleReadingPlanToday, !plan.complete && styles.clickableBibleReadingPlanToday, studyDarkMode && styles.accountDarkInsetBox]}
                            >
                              <View style={styles.bibleReadingPlanTodayHeader}>
                                <View style={styles.bibleReadingPlanTodayTitleBlock}>
                                  <Text numberOfLines={2} style={[styles.readerBookSectionTitle, studyDarkMode && styles.studyDarkAccentText]}>
                                    {plan.complete ? "Plan complete" : plan.overdue ? plan.label : `Next reading: ${plan.label}`}
                                  </Text>
                                  <Text numberOfLines={2} style={[styles.readerReadChapterBookTitle, studyDarkMode && styles.accountDarkTitle]}>
                                    {plan.complete ? "Choose a new plan or keep reviewing." : plan.reference}
                                  </Text>
                                </View>
                                <Ionicons name={plan.complete ? "checkmark-circle" : "calendar-outline"} size={20} color={studyDarkMode ? "#e9b76a" : plan.complete ? colors.oliveDark : colors.coral} />
                              </View>
                            </Pressable>
                          )}
                        </View>
                      );
                    })}
                    <ResumeButton label="Manage plans" icon="list-outline" onPress={() => setTab("plans")} style={studyDarkMode && styles.homeDarkResumeButton} labelStyle={studyDarkMode && styles.homeDarkResumeButtonText} iconColor={studyDarkMode ? "#e9b76a" : undefined} />
                  </View>
                ) : (
                  <View style={[styles.bibleReadingPlanStarter, studyDarkMode && styles.accountDarkSection]}>
                    <Eyebrow>Reading Plans</Eyebrow>
                    <Text style={[styles.readerBookSectionTitle, studyDarkMode && styles.accountDarkTitle]}>Choose a Bible reading plan from the Plans tab.</Text>
                    <Text style={[styles.helpIntro, studyDarkMode && styles.accountDarkMutedText]}>Your followed plans will appear here while you study.</Text>
                    <ResumeButton label="Browse plans" icon="calendar-outline" onPress={() => setTab("plans")} style={studyDarkMode && styles.homeDarkResumeButton} labelStyle={studyDarkMode && styles.homeDarkResumeButtonText} iconColor={studyDarkMode ? "#e9b76a" : undefined} />
                  </View>
                )}
              </CollapsibleStudyPanel>
              <CollapsibleStudyPanel
                title="Coaching"
                icon="bulb-outline"
                collapsed={collapsedStudyPanels.feedback}
                onToggle={() => toggleStudyPanel("feedback")}
                style={styles.feedbackOptionsBox}
                darkMode={studyDarkMode}
              >
                <Text style={[styles.helpIntro, studyDarkMode && styles.accountDarkMutedText]}>
                  {showCoaching
                    ? "Free local coaching is on. It uses built-in prompts only."
                    : "Free local coaching is off for the study screen."}
                </Text>
                <ResumeButton
                  label={showCoaching ? "Turn off" : "Turn on"}
                  icon={showCoaching ? "eye-off-outline" : "eye-outline"}
                  onPress={() => {
                    const nextValue = !showCoaching;
                    setShowCoaching(nextValue);
                    saveStoredTutorCoachingEnabled(nextValue).catch(() => undefined);
                    persistUiPreference("studyCoachingVisible", nextValue);
                  }}
                  style={studyDarkMode && styles.homeDarkResumeButton}
                  labelStyle={studyDarkMode && styles.homeDarkResumeButtonText}
                  iconColor={studyDarkMode ? "#e9b76a" : undefined}
                />
              </CollapsibleStudyPanel>
            </Card>
            )}
          </View>
        )}

        {tab === "bible" && (
          <TabErrorBoundary
            resetKey={`bible-${bibleTranslation}-${readerBook}-${readerChapter}`}
            fallback={<Card style={[styles.bibleReaderContentCard, compactLayout && styles.fluidCard, bibleDarkMode && styles.accountDarkMainCard]}><Text style={[styles.cardTitle, bibleDarkMode && styles.accountDarkTitle]}>Bible reader could not load</Text><Text style={[styles.muted, bibleDarkMode && styles.accountDarkMutedText]}>Try another tab, then return to Bible.</Text></Card>}
          >
            <Suspense fallback={<Card style={[styles.bibleReaderContentCard, compactLayout && styles.fluidCard, bibleDarkMode && styles.accountDarkMainCard]}><Text style={[styles.muted, bibleDarkMode && styles.accountDarkMutedText]}>Loading Bible reader...</Text></Card>}>
              <LazyBibleTab
              styles={styles}
              compactLayout={compactLayout}
              phoneLayout={phoneLayout}
              bibleDarkMode={bibleDarkMode}
              readerNavCollapsed={readerNavCollapsed}
              translations={BIBLE_TRANSLATIONS}
              bibleTranslation={bibleTranslation}
              readBibleChapterCount={readBibleChapterCount}
              readBibleChapters={readBibleChapters}
              currentBookReadChapterCount={currentBookReadChapterCount}
              bibleBookmarks={bibleBookmarks}
              bibleReaderHistory={bibleReaderHistory}
              readerHistoryCollapsed={readerHistoryCollapsed}
              bookmarksCollapsed={bookmarksCollapsed}
              bookmarksExpanded={bookmarksExpanded}
              bookmarkNotesOnly={bookmarkNotesOnly}
              bookmarkSearch={bookmarkSearch}
              readerBookSearch={readerBookSearch}
              visibleBibleBookmarks={visibleBibleBookmarks}
              filteredBibleBookmarks={filteredBibleBookmarks}
              activeBookmarkNoteId={activeBookmarkNoteId}
              bookmarkNoteDraft={bookmarkNoteDraft}
              readerMobileMenu={readerMobileMenu}
              expandedMobileReaderBook={expandedMobileReaderBook}
              readerBook={readerBook}
              readerChapter={readerChapter}
              readerBookSections={readerBookSections}
              activeBibleReadingPlan={activeBibleReadingPlan}
              activeBibleReadingPlanToday={activeBibleReadingPlanToday}
              activeBibleReadingPlanTodayLabel={activeBibleReadingPlanTodayLabel}
              activeBibleReadingPlanDoneToday={activeBibleReadingPlanDoneToday}
              activeBibleReadingPlanDoneTodayLabel={activeBibleReadingPlanDoneTodayLabel}
              activeBibleReadingPlanCompletedCount={activeBibleReadingPlanCompletedCount}
              activeBibleReadingPlanComplete={activeBibleReadingPlanComplete}
              activeBibleReadingPlanOpen={readerPlanReadingActive}
              biblePlanStatus={biblePlanStatus}
              otherActiveBibleReadingPlans={otherFollowedBibleReadingPlanSummaries}
              onOpenPlansTab={() => setTab("plans")}
              onOpenActivePlanReading={() => {
                if (!activeBibleReadingPlanToday) return;
                openBibleReadingPlanDay(activeBibleReadingPlanToday);
              }}
              onOpenFollowedPlanReading={openFollowedBibleReadingPlan}
              onToggleReaderNavCollapsed={() => toggleRememberedPanel(setReaderNavCollapsed, "bibleReaderNavCollapsed")}
              onSelectTranslation={(nextTranslationId: string) => {
                const normalizedTranslation = nextTranslationId as BibleTranslationId;
                setBibleTranslation(normalizedTranslation);
                saveStoredBibleTranslation(normalizedTranslation).catch(() => undefined);
                persistBibleReaderState({ translation: normalizedTranslation });
                if (bibleSearchActiveQuery && normalizedTranslation !== bibleTranslation) {
                  runBibleSearch({ translationId: normalizedTranslation }).catch(() => undefined);
                }
              }}
              onBookSearchChange={setReaderBookSearch}
              onToggleHistoryCollapsed={() => toggleRememberedPanel(setReaderHistoryCollapsed, "bibleReaderHistoryCollapsed")}
              onClearHistory={clearBibleReaderHistory}
              onOpenHistoryItem={openBibleReaderHistoryItem}
              onToggleBookmarksCollapsed={() => {
                setBookmarksCollapsed((value) => {
                  if (!value) setBookmarksExpanded(false);
                  const next = !value;
                  persistUiPreference("bibleBookmarksCollapsed", next);
                  return next;
                });
              }}
              onBookmarkSearchChange={setBookmarkSearch}
              onToggleBookmarkNotesOnly={() => setBookmarkNotesOnly((value) => !value)}
              onOpenBookmark={openBibleBookmark}
              onOpenBookmarkNote={openBookmarkNote}
              onRemoveBookmark={removeBibleBookmark}
              onBookmarkNoteDraftChange={setBookmarkNoteDraft}
              onSaveBookmarkNote={saveBookmarkNote}
              onDeleteBookmarkNote={deleteBookmarkNote}
              onCancelBookmarkNote={() => {
                setActiveBookmarkNoteId("");
                setBookmarkNoteDraft("");
                dismissMobileInputFocus();
              }}
              onToggleBookmarksExpanded={() => setBookmarksExpanded((value) => !value)}
              onToggleMobileMenu={setReaderMobileMenu}
              onSelectMobileBook={selectMobileReaderBook}
              onSelectBook={selectReaderBook}
              onSelectChapter={selectReaderChapter}
              onClearReadBook={clearBibleReadBook}
              bibleSearchCollapsed={bibleSearchCollapsed}
              bibleSearchQuery={bibleSearchQuery}
              bibleSearchScope={bibleSearchScope}
              bibleSearchMode={bibleSearchMode}
              bibleSearchBook={bibleSearchBook}
              bibleSearchBookOptions={bibleSearchBookOptions}
              bibleSearchBookMenuOpen={bibleSearchBookMenuOpen}
              bibleSearchCriteriaOpen={bibleSearchCriteriaOpen}
              bibleSearchTranslation={bibleSearchTranslation}
              bibleSearchStatus={bibleSearchStatus}
              bibleSearchDuration={bibleSearchDuration}
              bibleSearchActiveQuery={bibleSearchActiveQuery}
              bibleSearchSections={bibleSearchSections}
              onToggleBibleSearchCollapsed={() => toggleRememberedPanel(setBibleSearchCollapsed, "bibleSearchCollapsed")}
              onBibleSearchQueryChange={setBibleSearchQuery}
              onRunBibleSearch={() => runBibleSearch()}
              onClearBibleSearch={clearBibleSearch}
              onToggleBibleSearchCriteria={() => setRememberedBibleSearchCriteriaOpen((value) => !value)}
              onSelectBibleSearchScope={setRememberedBibleSearchScope}
              onSelectBibleSearchMode={setRememberedBibleSearchMode}
              onToggleBibleSearchBookMenu={() => setBibleSearchBookMenuOpen((value) => !value)}
              onSelectBibleSearchBook={selectBibleSearchBook}
              onBibleSearchSummaryLayout={(event: any) => {
                bibleSearchSummaryYRef.current = event.nativeEvent.layout.y;
              }}
              renderBibleSearchResultActions={(result: BibleSearchResult) => (
                <>
                  <ResumeButton label="Read" icon="reader-outline" onPress={() => openBibleSearchResult(result)} style={bibleDarkMode && styles.homeDarkResumeButton} labelStyle={bibleDarkMode && styles.homeDarkResumeButtonText} iconColor={bibleDarkMode ? "#e9b76a" : undefined} />
                  <ResumeButton label="Study" icon="book-outline" onPress={() => studyBibleSearchResult(result)} style={bibleDarkMode && styles.homeDarkResumeButton} labelStyle={bibleDarkMode && styles.homeDarkResumeButtonText} iconColor={bibleDarkMode ? "#e9b76a" : undefined} />
                </>
              )}
              readerStudyReference={readerStudyReference}
              readerChapterDraft={readerChapterDraft}
              readerChapterCount={readerChapterCount}
              planReadingLabel={readerPlanReadingLabel}
              selectedReaderVerses={selectedReaderVerses}
              currentChapterRead={currentChapterRead}
              currentChapterBookmarked={currentChapterBookmarked}
              readerIconTooltip={readerIconTooltip}
              onStudyReaderChapter={openReaderChapterInStudy}
              onClearReaderSelection={clearReaderSelection}
              onMoveReaderChapter={moveReaderChapter}
              onChapterDraftChange={setReaderChapterDraft}
              onCommitChapter={commitReaderChapter}
              onToggleChapterRead={toggleReaderChapterRead}
              onBookmarkChapter={() => saveBibleBookmark()}
              onClearReadingProgress={clearBibleReadingProgress}
              readerIconHoverProps={readerIconHoverProps}
              hideReaderTooltip={hideReaderTooltip}
              readerPassage={readerPassage}
              readerStatus={readerStatus}
              readerMemoryStatus={readerMemoryStatus}
              activeReaderActionVerse={activeReaderActionVerse}
              readerMemoryVerseKeys={readerMemoryVerseKeys}
              readerMatchesActiveBibleReadingPlanDay={readerMatchesActiveBibleReadingPlanDay}
              activeReadingPlanDay={readerActiveBibleReadingPlanDay}
              activeReadingPlanName={readerBibleReadingPlan?.title || ""}
              activeReadingPlanDayCompleted={readerActiveBibleReadingPlanDayComplete}
              devotionalTextSize={devotionalTextSize}
              onDevotionalTextSizeChange={setRememberedDevotionalTextSize}
              onAcknowledgeCareNote={acknowledgeBibleReadingCareNote}
              shouldShowCareNote={shouldShowBibleReadingCareNote}
              planReadingMode={readerPlanReadingActive}
              planReadingCanMovePrevious={readerPlanCanMovePrevious}
              planReadingCanMoveNext={readerPlanCanMoveNext}
              planReadingChunkLabel={readerPlanChunkLabel}
              planReadingNote={readerPlanChunkNote}
              planReadingFullChapter={readerPlanChunkIsFullCurrentChapter}
              onMarkActiveReadingPlanDayComplete={markCurrentBibleReadingPlanDayComplete}
              onExitPlanReading={exitBibleReadingPlanMode}
              currentSelectionBookmarked={currentSelectionBookmarked}
              currentSelectionBookmark={currentSelectionBookmark}
              selectedReaderVersesAlreadyInMemory={selectedReaderVersesAlreadyInMemory}
              onPassageLayout={(event: any) => {
                readerPassageBoxYRef.current = event.nativeEvent.layout.y;
              }}
              onVerseLayout={(verseNumber: number, event: any) => {
                readerVerseYRef.current[verseNumber] = event.nativeEvent.layout.y;
                if (pendingReaderFocusVerse === verseNumber) {
                  setPendingReaderFocusVerse(0);
                  scrollReaderToVerse(verseNumber);
                }
              }}
              onToggleVerse={toggleReaderVerse}
              onBookmarkSelection={() => saveBibleBookmark(selectedReaderVerses)}
              onOpenNote={openSelectedReaderNote}
              onPrintWorksheet={openReaderWorksheetOptions}
              onSaveMemory={saveSelectedReaderVersesToMemory}
              isVerseBookmarked={(verseNumber: number) => isReaderVerseBookmarked(verseNumber, bibleBookmarks, readerBook, readerChapter)}
              isVerseNoted={(verseNumber: number) => isReaderVerseBookmarkNoted(verseNumber, bibleBookmarks, readerBook, readerChapter)}
              />
            </Suspense>
          </TabErrorBoundary>
        )}

        {tab === "plans" && (
          <TabErrorBoundary
            resetKey={`plans-${activeBibleReadingPlanId}-${customBibleReadingPlans.length}`}
            fallback={<Card style={[styles.mainCard, plansDarkMode && styles.accountDarkMainCard]}><Text style={[styles.cardTitle, plansDarkMode && styles.accountDarkTitle]}>Reading plans could not load</Text><Text style={[styles.muted, plansDarkMode && styles.accountDarkMutedText]}>Try another tab, then return to Plans.</Text></Card>}
          >
            <View style={plansDarkMode && styles.accountDarkLayout}>
            <Eyebrow>Reading paths</Eyebrow>
            <Text style={[styles.title, plansDarkMode && styles.accountDarkTitle]}>Bible reading plans</Text>
            <Text style={[styles.titleSupport, plansDarkMode && styles.accountDarkMutedText]}>Choose, continue, create, and manage reading plans. The Bible reader shows the active plan for today.</Text>
            <Text style={[styles.planSectionHeading, plansDarkMode && styles.planSectionHeadingDark]}>Active plans</Text>
            {activeBibleReadingPlan && activeBibleReadingPlanToday ? (
              <View style={[styles.currentPlanWideBox, styles.currentBibleReadingPlanBox, phoneLayout && styles.phoneCurrentPlanWideBox, plansDarkMode && styles.accountDarkSection]}>
                <View style={[styles.journalHeader, phoneLayout && styles.phonePlanHeader]}>
                  <View style={styles.journalTitleBlock}>
                    <View style={styles.planPageTitleRow}>
                      <Text style={[styles.cardTitle, plansDarkMode && styles.accountDarkTitle]}>{activeBibleReadingPlan.title}</Text>
                    </View>
                    <Text style={[styles.muted, styles.currentPlanHeaderSpacer, plansDarkMode && styles.accountDarkMutedText]}>{" "}</Text>
                  </View>
                  <Text style={[styles.draftPill, styles.readingPlanCountPill, plansDarkMode && styles.plansDarkDraftPill]}>{activeBibleReadingPlanCompletedCount}/{activeBibleReadingPlan.days.length}</Text>
                </View>
                <View style={[styles.planProgressTrack, plansDarkMode && styles.plansDarkProgressTrack]}>
                  <View style={[styles.planProgressFill, activeBibleReadingPlanComplete && styles.completedPlanProgressFill, { width: `${(activeBibleReadingPlanCompletedCount / activeBibleReadingPlan.days.length) * 100}%` }]} />
                </View>
                <View style={[styles.currentPlanNextBox, plansDarkMode && styles.accountDarkInsetBox]}>
                  <View style={styles.planDayCopy}>
                    <Text style={[styles.readerBookSectionTitle, plansDarkMode && styles.studyDarkAccentText]}>
                      {activeBibleReadingPlanTodayLabel || (activeBibleReadingPlanComplete ? "Plan complete" : `Next reading: Day ${activeBibleReadingPlanToday.day}`)}
                    </Text>
                    <Text style={[styles.readerReadChapterBookTitle, plansDarkMode && styles.accountDarkTitle]}>{activeBibleReadingPlanToday.reference}</Text>
                  </View>
                </View>
                <ScrollView
                  ref={(scrollView) => {
                    biblePlanDayPickerRefs.current[activeBibleReadingPlan.id] = scrollView;
                  }}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.planDayPickerScroll}
                  onContentSizeChange={() => scrollBiblePlanDayPickerIntoView(activeBibleReadingPlan.id, activeBibleReadingPlanSelectedDay?.day || activeBibleReadingPlanToday?.day || 1, false, 20, activeBibleReadingPlanDayWindow?.firstVisibleDay || 1)}
                >
                  {activeBibleReadingPlanDayWindow?.canShowEarlier ? (
                    <Pressable accessibilityRole="button" accessibilityLabel={`Show earlier days in ${activeBibleReadingPlan.title}`} onPress={activeBibleReadingPlanDayWindow.showEarlier} style={[styles.planDayTile, styles.planDayWindowButton, plansDarkMode && styles.planDayTileDark]}>
                      <Ionicons name="chevron-back-outline" size={18} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
                      <Text style={[styles.planDayTileDate, plansDarkMode && styles.accountDarkMutedText]}>Earlier</Text>
                    </Pressable>
                  ) : null}
                  {(activeBibleReadingPlanDayWindow?.days || []).map((planDay) => {
                    const done = completedBibleReadingPlanDaySet.has(bibleReadingPlanDayKey(activeBibleReadingPlan.id, planDay.day));
                    const selected = activeBibleReadingPlanSelectedDay?.day === planDay.day;
                    const dateKey = activeBibleReadingPlanStartDate ? addDaysToDateKey(activeBibleReadingPlanStartDate, planDay.day - 1) : "";
                    const dateLabel = dateKey ? formatPlanDayDate(dateKey) : "";
                    const currentDateKey = localDateKey();
                    const scheduledToday = dateKey === currentDateKey;
                    const nextIncomplete = activeBibleReadingPlanToday.day === planDay.day;
                    const missed = !!dateKey && dateKey < currentDateKey && !done;
                    return (
                      <Pressable
                        key={planDay.day}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`Day ${planDay.day}${dateLabel ? `, ${dateLabel}` : ""}, ${planDay.reference}, ${done ? "completed" : scheduledToday ? "scheduled for today" : missed ? "missed" : nextIncomplete ? "next incomplete" : "not completed"}`}
                        onPress={() => setRememberedPlanSelectedDay(activeBibleReadingPlan.id, planDay.day)}
                        style={[
                          styles.planDayTile,
                          phoneLayout && styles.phonePlanDayTile,
                          plansDarkMode && styles.planDayTileDark,
                          scheduledToday && !missed && styles.currentPlanDayTile,
                          missed && styles.missedPlanDayTile,
                          selected && styles.selectedPlanDayTile,
                          selected && missed && styles.selectedMissedPlanDayTile,
                          !plansDarkMode && done && styles.completedPlanDayTile,
                          plansDarkMode && done && styles.completedPlanDayTileDark,
                          plansDarkMode && selected && styles.selectedPlanDayTileDark,
                          plansDarkMode && selected && missed && styles.selectedMissedPlanDayTileDark
                        ]}
                      >
                        <Text style={[styles.planDayTileNumber, plansDarkMode && styles.accountDarkTitle, plansDarkMode && done && styles.completedPlanDayTileText]}>{done ? "✓" : planDay.day}</Text>
                        <Text numberOfLines={1} style={[styles.planDayTileDate, plansDarkMode && styles.accountDarkMutedText, plansDarkMode && done && styles.completedPlanDayTileText]}>{dateLabel || `Day ${planDay.day}`}</Text>
                        {scheduledToday && <Text style={styles.planDayTileFlag}>Now</Text>}
                        {missed && <Text style={styles.planDayTileFlag}>Due</Text>}
                      </Pressable>
                    );
                  })}
                  {activeBibleReadingPlanDayWindow?.canShowLater ? (
                    <Pressable accessibilityRole="button" accessibilityLabel={`Show later days in ${activeBibleReadingPlan.title}`} onPress={activeBibleReadingPlanDayWindow.showLater} style={[styles.planDayTile, styles.planDayWindowButton, plansDarkMode && styles.planDayTileDark]}>
                      <Ionicons name="chevron-forward-outline" size={18} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
                      <Text style={[styles.planDayTileDate, plansDarkMode && styles.accountDarkMutedText]}>Later</Text>
                    </Pressable>
                  ) : null}
                </ScrollView>
                {activeBibleReadingPlanSelectedDay && (
                  <View
                    style={[styles.planPageDay, styles.selectedPlanDayDetail, (activeBibleReadingPlanSelectedDay.context || activeBibleReadingPlanSelectedDay.devotional || activeBibleReadingPlanSelectedDay.observationQuestion || activeBibleReadingPlanSelectedDay.reflectionQuestion || activeBibleReadingPlanSelectedDay.reflectionPrompt || activeBibleReadingPlanSelectedDay.prayer || activeBibleReadingPlanSelectedDay.prayerPrompt || activeBibleReadingPlanSelectedDay.gentleAction || activeBibleReadingPlanSelectedDay.studyMethod || activeBibleReadingPlanSelectedDay.careNote) && styles.selectedPlanDayWithDevotional, phoneLayout && styles.phonePlanPageDay, plansDarkMode && styles.plansDarkDayRow, activeBibleReadingPlanSelectedDone && styles.completedPlanDayRow, plansDarkMode && activeBibleReadingPlanSelectedDone && styles.plansDarkCompletedDayRow]}
                  >
                    <View style={styles.planDayDetailTopRow}>
                      <Text style={[styles.planDayBadge, styles.compactPlanDayBadge, activeBibleReadingPlanSelectedDone && styles.completedPlanDayBadge, plansDarkMode && !activeBibleReadingPlanSelectedDone && styles.plansDarkDayBadge]}>{activeBibleReadingPlanSelectedDone ? "✓" : activeBibleReadingPlanSelectedDay.day}</Text>
                      <View style={styles.planDayCopy}>
                        <Text style={[styles.planDayTitle, phoneLayout && styles.phonePlanDayTitle, plansDarkMode && styles.accountDarkTitle, plansDarkMode && activeBibleReadingPlanSelectedDone && styles.completedPlanDayTextDark]}>
                          {`Day ${activeBibleReadingPlanSelectedDay.day}${activeBibleReadingPlanSelectedDateKey ? ` · ${formatPlanDayDate(activeBibleReadingPlanSelectedDateKey)}` : ""}`}
                        </Text>
                        <Text style={[styles.muted, plansDarkMode && styles.accountDarkMutedText, plansDarkMode && activeBibleReadingPlanSelectedDone && styles.completedPlanDayMutedTextDark]}>{formatPlanDayReferenceTitle(activeBibleReadingPlanSelectedDay)}</Text>
                      </View>
                      <View style={styles.planDayActionStack}>
                        <View style={styles.planDayActions}>
                          <Pressable accessibilityRole="button" accessibilityLabel={`Open ${activeBibleReadingPlanSelectedDay.reference} in Bible`} onPress={(event: any) => { event.stopPropagation?.(); openBibleReadingPlanDayInBible(activeBibleReadingPlanSelectedDay); }} style={[styles.planDayIconAction, plansDarkMode && styles.homeDarkIconBubble]}>
                            <Ionicons name="reader-outline" size={15} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
                          </Pressable>
                          <Pressable accessibilityRole="button" accessibilityLabel={`Study ${activeBibleReadingPlanSelectedDay.reference}`} onPress={(event: any) => { event.stopPropagation?.(); studyBibleReadingPlanDay(activeBibleReadingPlanSelectedDay); }} style={[styles.planDayIconAction, plansDarkMode && styles.homeDarkIconBubble]}>
                            <Ionicons name="book-outline" size={15} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={activeBibleReadingPlanSelectedDone ? `${activeBibleReadingPlanSelectedDay.reference} completed` : `Mark ${activeBibleReadingPlanSelectedDay.reference} complete`}
                            onPress={(event: any) => {
                              event.stopPropagation?.();
                              if (!activeBibleReadingPlanSelectedDone) {
                                markBibleReadingPlanDayComplete(activeBibleReadingPlanSelectedDay, activeBibleReadingPlan.id, { promptForNextDueReading: true });
                              }
                            }}
                            style={[styles.planDayIconAction, activeBibleReadingPlanSelectedDone && styles.activeReaderReadButton, !activeBibleReadingPlanSelectedDone && styles.readerPlanCompleteButton]}
                          >
                            <Ionicons name={activeBibleReadingPlanSelectedDone ? "checkmark-circle-outline" : "checkmark-circle-outline"} size={15} color="white" />
                          </Pressable>
                        </View>
                        {activeBibleReadingPlanSelectedDone && (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Mark ${activeBibleReadingPlanSelectedDay.reference} incomplete`}
                            onPress={(event: any) => {
                              event.stopPropagation?.();
                              unmarkBibleReadingPlanDayComplete(activeBibleReadingPlanSelectedDay, activeBibleReadingPlan.id);
                            }}
                            style={[styles.planDayTextAction, plansDarkMode && styles.planDayTextActionDark]}
                          >
                            <Text style={[styles.planDayTextActionLabel, plansDarkMode && styles.studyDarkAccentText]}>Mark incomplete</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                    {renderPlanDayDevotional(activeBibleReadingPlanSelectedDay, plansDarkMode)}
                  </View>
                )}
                {activeBibleReadingPlanMissedFullDay && (
                  <View style={[styles.currentPlanManagementRow, phoneLayout && styles.phoneCurrentPlanManagementRow]}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Catch up reading plan dates to today" onPress={() => catchUpActiveBibleReadingPlanDates()} style={[styles.currentPlanManagementButton, plansDarkMode && styles.currentPlanManagementButtonDark]}>
                      <Ionicons name="calendar-outline" size={14} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
                      <Text style={[styles.currentPlanManagementText, plansDarkMode && styles.accountDarkMutedText]}>Catch me up</Text>
                    </Pressable>
                  </View>
                )}
                {!!biblePlanStatus && <Text style={styles.saveStatus}>{biblePlanStatus}</Text>}
                <View style={[styles.planActionRow, styles.currentPlanBottomActions, phoneLayout && styles.phonePlanActionRow]}>
                  {!activeBibleReadingPlanComplete && activeBibleReadingPlanSelectedDay && <AppButton label="Open in Bible" onPress={() => openBibleReadingPlanDayInBible(activeBibleReadingPlanSelectedDay)} style={[styles.currentPlanActionButton, phoneLayout && styles.phonePlanActionButton]} labelStyle={phoneLayout && styles.phonePlanButtonLabel} />}
                  {!activeBibleReadingPlanComplete && activeBibleReadingPlanSelectedDay && <AppButton label="Study" variant="secondary" onPress={() => studyBibleReadingPlanDay(activeBibleReadingPlanSelectedDay)} style={[styles.currentPlanActionButton, phoneLayout && styles.phonePlanActionButton, plansDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phonePlanButtonLabel, plansDarkMode && styles.homeDarkResumeButtonText]} />}
                  <AppButton label="Stop" variant="secondary" onPress={() => requestStopFollowingBibleReadingPlan()} style={[styles.currentPlanActionButton, phoneLayout && styles.phonePlanActionButton, plansDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phonePlanButtonLabel, plansDarkMode && styles.homeDarkResumeButtonText]} />
                </View>
              </View>
            ) : (
              <View style={[styles.currentPlanWideBox, phoneLayout && styles.phoneCurrentPlanWideBox, plansDarkMode && styles.accountDarkSection]}>
                <Text style={[styles.cardTitle, plansDarkMode && styles.accountDarkTitle]}>No active reading plan</Text>
                <Text style={[styles.muted, plansDarkMode && styles.accountDarkMutedText]}>Choose a plan below when you want a guided reading path.</Text>
                {!!biblePlanStatus && <Text style={styles.saveStatus}>{biblePlanStatus}</Text>}
              </View>
            )}
            {otherFollowedBibleReadingPlans.length > 0 && (
              <View style={styles.otherFollowedPlanGrid}>
                {otherFollowedBibleReadingPlans.map(renderFollowedBibleReadingPlanPanel)}
              </View>
            )}
            {completedFollowedBibleReadingPlans.length > 0 && (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${completedBiblePlansOpen || completedFollowedBibleReadingPlans.length === 1 ? "Hide" : "Show"} completed reading plans`}
                  accessibilityState={{ expanded: completedBiblePlansOpen || completedFollowedBibleReadingPlans.length === 1 }}
                  onPress={() => setRememberedCompletedBiblePlansOpen((open) => !open)}
                  style={styles.completedReadingPlanSectionHeader}
                >
                  <View style={styles.planPageTitleRow}>
                    <Text style={[styles.planSectionHeading, styles.completedReadingPlanSectionTitle, plansDarkMode && styles.planSectionHeadingDark]}>Completed plans</Text>
                    <Text style={[styles.draftPill, styles.readingPlanCountPill, plansDarkMode && styles.plansDarkDraftPill]}>{completedFollowedBibleReadingPlans.length}</Text>
                  </View>
                  {completedFollowedBibleReadingPlans.length > 1 && (
                    <Ionicons name={completedBiblePlansOpen ? "chevron-up-outline" : "chevron-down-outline"} size={17} color={plansDarkMode ? "#c8bda9" : colors.muted} />
                  )}
                </Pressable>
                {(completedBiblePlansOpen || completedFollowedBibleReadingPlans.length === 1) && (
                  <View style={styles.completedReadingPlanGrid}>
                    {completedFollowedBibleReadingPlans.map(renderCompletedBibleReadingPlanCard)}
                  </View>
                )}
              </>
            )}

            <Text style={[styles.planSectionHeading, plansDarkMode && styles.planSectionHeadingDark]}>Custom plans</Text>
            <View style={[styles.currentPlanWideBox, phoneLayout && styles.phoneCurrentPlanWideBox, plansDarkMode && styles.accountDarkSection]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={customBiblePlanFormOpen ? "Hide custom reading plan form" : "Create custom reading plan"}
                onPress={() => setCustomBiblePlanFormOpen((open) => !open)}
                style={styles.collapsiblePanelHeader}
              >
                <View style={styles.feedbackHeader}>
                  <Ionicons name="add-circle-outline" size={18} color={plansDarkMode ? "#e9b76a" : colors.coral} />
                  <Text style={[styles.feedbackTitle, plansDarkMode && styles.studyDarkAccentText]}>Create custom plan</Text>
                </View>
                <Ionicons name={customBiblePlanFormOpen ? "chevron-up-outline" : "chevron-down-outline"} size={17} color={plansDarkMode ? "#c8bda9" : colors.muted} />
              </Pressable>
              {customBiblePlanFormOpen && (
                <View style={styles.planCustomForm}>
                  <TextInput accessibilityLabel="Custom reading plan title" value={customBiblePlanTitle} onChangeText={setCustomBiblePlanTitle} placeholder="Plan title" placeholderTextColor={plansDarkMode ? "#8f8678" : undefined} style={[styles.input, plansDarkMode && styles.accountDarkInput]} />
                  <TextInput accessibilityLabel="Custom reading plan description" value={customBiblePlanDescription} onChangeText={setCustomBiblePlanDescription} placeholder="Optional description" placeholderTextColor={plansDarkMode ? "#8f8678" : undefined} style={[styles.input, plansDarkMode && styles.accountDarkInput]} />
                  <TextInput
                    accessibilityLabel="Custom reading plan days"
                    value={customBiblePlanDaysText}
                    onChangeText={setCustomBiblePlanDaysText}
                    placeholder={"One reading per line, for example:\nJohn 1\nJohn 2\nRomans 8"}
                    multiline
                    placeholderTextColor={plansDarkMode ? "#8f8678" : undefined}
                    style={[styles.input, styles.planCustomDaysInput, plansDarkMode && styles.accountDarkInput]}
                  />
                  <View style={[styles.planActionRow, phoneLayout && styles.phonePlanActionRow]}>
                    <AppButton label="Create plan" onPress={createCustomBibleReadingPlan} style={phoneLayout && styles.phonePlanPrimaryButton} labelStyle={phoneLayout && styles.phonePlanButtonLabel} />
                    <AppButton label="Cancel" variant="secondary" onPress={() => { setCustomBiblePlanFormOpen(false); setCustomBiblePlanStatus(""); dismissMobileInputFocus(); }} style={[phoneLayout && styles.phonePlanSecondaryButton, plansDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phonePlanButtonLabel, plansDarkMode && styles.homeDarkResumeButtonText]} />
                  </View>
                </View>
              )}
              {!!customBiblePlanStatus && <Text style={styles.saveStatus}>{customBiblePlanStatus}</Text>}
            </View>

            <View style={styles.planBrowseIntro}>
              <Text style={[styles.planSectionHeading, plansDarkMode && styles.planSectionHeadingDark]}>Browse plans</Text>
            </View>
            <View style={styles.planBrowseSectionStack}>
              {bibleReadingPlanCorpusStatus !== "ready" ? (
                <Card style={[styles.planPageCard, plansDarkMode && styles.accountDarkMainCard]}>
                  <Text accessibilityLiveRegion="polite" aria-live="polite" style={[styles.cardTitle, plansDarkMode && styles.accountDarkTitle]}>
                    {bibleReadingPlanCorpusStatus === "error" ? "Reading plans could not be loaded" : "Loading reading plans…"}
                  </Text>
                  <Text style={[styles.muted, plansDarkMode && styles.accountDarkMutedText]}>
                    {bibleReadingPlanCorpusStatus === "error" ? "Check your connection and try again." : "The plan library loads only when you need it."}
                  </Text>
                  {bibleReadingPlanCorpusStatus === "error" ? (
                    <AppButton label="Try again" variant="secondary" onPress={() => { setBibleReadingPlanCorpusStatus("idle"); setBibleReadingPlanLoadAttempt((attempt) => attempt + 1); }} style={plansDarkMode && styles.homeDarkResumeButton} labelStyle={plansDarkMode && styles.homeDarkResumeButtonText} />
                  ) : null}
                </Card>
              ) : unfollowedBibleReadingPlanGroups.map((group) => {
                const sectionOpen = openBiblePlanSections[group.id] ?? (group.id === "custom" || group.id === "short");
                const visibleGroupRowCount = visibleBiblePlanGroupRows[group.id] || (phoneLayout ? 6 : 9);
                const visibleGroupPlans = group.plans.slice(0, visibleGroupRowCount);
                return (
                  <View key={group.id} style={[styles.planBrowseSection, plansDarkMode && styles.planBrowseSectionDark]}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${sectionOpen ? "Collapse" : "Expand"} ${group.title}`}
                      accessibilityState={{ expanded: sectionOpen }}
                      onPress={() => setRememberedOpenBiblePlanSections((current) => ({ ...current, [group.id]: !sectionOpen }))}
                      style={styles.planBrowseSectionHeader}
                    >
                      <View style={styles.planBrowseSectionTitleBlock}>
                        <View style={styles.planBrowseSectionTitleRow}>
                          <Text style={[styles.planBrowseSectionTitle, plansDarkMode && styles.accountDarkTitle]}>{group.title}</Text>
                          <Text style={[styles.draftPill, styles.planBrowseCountPill, plansDarkMode && styles.plansDarkDraftPill]}>{group.plans.length}</Text>
                        </View>
                        <Text style={[styles.planBrowseSectionDescription, plansDarkMode && styles.accountDarkMutedText]}>{group.description}</Text>
                      </View>
                      <Ionicons name={sectionOpen ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
                    </Pressable>
                    {sectionOpen && (
                      <View style={[styles.planPageGrid, phoneLayout && styles.phonePlanPageGrid]}>
                        {visibleGroupPlans.map((plan) => {
                const completedCount = plan.days.filter((day) => completedBibleReadingPlanDaySet.has(bibleReadingPlanDayKey(plan.id, day.day))).length;
                const expanded = expandedBiblePlanId === plan.id;
                const progressPercent = plan.days.length ? (completedCount / plan.days.length) * 100 : 0;
                const planDetails = bibleReadingPlanCorpus!.getDetails(plan);
                const visibleRows = expandedBiblePlanVisibleRows[plan.id] || 0;
                const previewOpen = !!expandedBiblePlanPreviews[plan.id];
                const previewContentId = `complete-day-preview-${plan.id.replace(/[^A-Za-z0-9_-]/g, "-")}`;
                const visiblePlanDays = visibleRows > 0 ? plan.days.slice(0, visibleRows) : [];
                const planStarted = completedCount > 0;
                const planComplete = plan.days.length > 0 && completedCount >= plan.days.length;
                const lastCompletedDateKey = bibleReadingPlanCompletionDates[plan.id] || "";
                const lastCompletedDateLabel = lastCompletedDateKey ? formatPlanDayDate(lastCompletedDateKey) : "";
                const completionCount = bibleReadingPlanCompletionCounts[plan.id] || (lastCompletedDateKey ? 1 : 0);
                const completionCountLabel = completionCount ? formatBibleReadingPlanCompletionCount(completionCount) : "";
                return (
                  <Card key={plan.id} style={[styles.planPageCard, expanded && styles.expandedBrowsePlanCard, phoneLayout && styles.phonePlanPageCard, plansDarkMode && styles.accountDarkMainCard]}>
                    <View style={[styles.journalHeader, phoneLayout && styles.phonePlanHeader]}>
                      <View style={styles.journalTitleBlock}>
                        <View style={styles.planPageTitleRow}>
                          <Text style={[styles.cardTitle, plansDarkMode && styles.accountDarkTitle]}>{plan.title}</Text>
                        </View>
                        <Text style={[styles.muted, plansDarkMode && styles.accountDarkMutedText]}>{plan.description || "Custom reading plan"}</Text>
                        <Text style={[styles.planPageMetaText, plansDarkMode && styles.accountDarkMutedText]}>
                          {(plan.category || (plan.source === "custom" ? "Custom" : "Reading plan"))} · {plan.days.length} days
                        </Text>
                        {planComplete ? (
                          <Text style={[styles.planPageMetaText, styles.planLastCompletedText, plansDarkMode && styles.accountDarkMutedText]}>
                            {[
                              `Last completed: ${lastCompletedDateLabel || "date not recorded"}`,
                              completionCountLabel
                            ].filter(Boolean).join(" · ")}
                          </Text>
                        ) : planStarted ? (
                          <Text style={[styles.planPageMetaText, plansDarkMode && styles.accountDarkMutedText]}>
                            Progress saved: {completedCount} of {plan.days.length} completed
                          </Text>
                        ) : null}
                      </View>
                      {planStarted && (
                        <View style={styles.planPageHeaderActions}>
                          <Text style={[styles.draftPill, styles.readingPlanCountPill, plansDarkMode && styles.plansDarkDraftPill]}>{completedCount}/{plan.days.length}</Text>
                        </View>
                      )}
                    </View>
                    {planStarted && (
                      <View style={[styles.planProgressTrack, plansDarkMode && styles.plansDarkProgressTrack]}>
                        <View style={[styles.planProgressFill, { width: `${Math.min(100, progressPercent)}%` }]} />
                      </View>
                    )}
                    <View style={styles.planCardActionRow}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Follow ${plan.title}`}
                        onPress={() => selectBibleReadingPlan(plan.id)}
                        style={[styles.planCardActionChip, styles.planCardPrimaryChip, plansDarkMode && styles.planCardPrimaryChipDark]}
                      >
                        <Ionicons name="calendar-outline" size={13} color={plansDarkMode ? "#dce7c8" : colors.oliveDark} />
                        <Text style={[styles.planCardActionText, styles.planCardPrimaryText, plansDarkMode && styles.planCardPrimaryTextDark]}>Follow</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={expanded ? `Hide details for ${plan.title}` : `Show more details for ${plan.title}`}
                        accessibilityState={{ expanded }}
                        onPress={() => {
                          setRememberedExpandedBiblePlanId(expanded ? "" : plan.id);
                          if (!expanded) setExpandedBiblePlanVisibleRows((current) => ({ ...current, [plan.id]: 0 }));
                        }}
                        style={[styles.planCardActionChip, styles.planCardSecondaryChip, plansDarkMode && styles.planCardSecondaryChipDark]}
                      >
                        <Ionicons name={expanded ? "chevron-up-outline" : "information-circle-outline"} size={13} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
                        <Text style={[styles.planCardActionText, styles.planCardSecondaryText, plansDarkMode && styles.homeDarkResumeButtonText]}>{expanded ? "Hide" : "Details"}</Text>
                      </Pressable>
                      {plan.source === "custom" && (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={pendingBiblePlanDeleteId === plan.id ? `Confirm delete ${plan.title}` : `Delete ${plan.title}`}
                          onPress={() => deleteCustomBibleReadingPlan(plan.id)}
                          style={[styles.planCardActionChip, styles.planCardDangerChip, plansDarkMode && styles.planCardDangerChipDark]}
                        >
                          <Ionicons name="trash-outline" size={13} color={plansDarkMode ? "#f2a088" : colors.coral} />
                          <Text style={[styles.planCardActionText, styles.planCardDangerText, plansDarkMode && styles.planCardDangerTextDark]}>{pendingBiblePlanDeleteId === plan.id ? "Confirm" : "Delete"}</Text>
                        </Pressable>
                      )}
                    </View>
                    {expanded && (
                      <>
                        <View style={[styles.planDetailsPanel, plansDarkMode && styles.accountDarkInsetBox]}>
                          <View style={styles.planDetailsGrid}>
                            {[
                              ["Purpose", planDetails.purpose],
                              ["Best for", planDetails.bestFor],
                              ["Pace", planDetails.pace],
                              ["Time", planDetails.estimatedTime],
                              ["Covers", planDetails.coverage],
                              ["Rhythm", planDetails.rhythm],
                              ...(planDetails.careNote ? [["Care note", planDetails.careNote]] : [])
                            ].map(([label, value]) => (
                              <View key={label} style={styles.planDetailItem}>
                                <Text style={[styles.planDetailLabel, plansDarkMode && styles.studyDarkAccentText]}>{label}</Text>
                                <Text style={[styles.planDetailText, plansDarkMode && styles.accountDarkMutedText]}>{value}</Text>
                              </View>
                            ))}
                          </View>
                          <View style={styles.planSampleList}>
                            <Text style={[styles.planDetailLabel, plansDarkMode && styles.studyDarkAccentText]}>Sample readings</Text>
                            {planDetails.sampleReadings.map((planDay) => (
                              <View key={planDay.day} style={[styles.planSampleReading, plansDarkMode && styles.plansDarkDayRow]}>
                                <Text style={[styles.planDayBadge, styles.compactPlanDayBadge, plansDarkMode && styles.plansDarkDayBadge]}>{planDay.day}</Text>
                                <View style={styles.planDayCopy}>
                                  <Text style={[styles.planDayTitle, plansDarkMode && styles.accountDarkTitle]}>{planDay.title}</Text>
                                  <Text style={[styles.planDayPassage, plansDarkMode && styles.accountDarkMutedText]}>{planDay.reference}</Text>
                                </View>
                              </View>
                            ))}
                          </View>
                          {planDetails.previewDay ? (
                            <View style={styles.planSampleList}>
                              <Pressable
                                ref={(node) => {
                                  biblePlanPreviewToggleRefs.current[plan.id] = node;
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={`${previewOpen ? "Hide" : "Preview"} ${plan.title} day ${planDetails.previewDay.day}, ${planDetails.previewDay.reference}`}
                                accessibilityState={{ expanded: previewOpen }}
                                aria-expanded={previewOpen}
                                aria-controls={previewContentId}
                                onPress={() => {
                                  setExpandedBiblePlanPreviews((current) => ({ ...current, [plan.id]: !previewOpen }));
                                  if (previewOpen && Platform.OS === "web") {
                                    requestAnimationFrame(() => biblePlanPreviewToggleRefs.current[plan.id]?.focus?.());
                                  }
                                }}
                                style={[styles.readerBookmarkExpandButton, styles.planViewAllButton, plansDarkMode && styles.homeDarkResumeButton]}
                              >
                                <Text style={[styles.readerBookmarkExpandText, plansDarkMode && styles.homeDarkResumeButtonText]}>{previewOpen ? "Hide complete day" : "Preview a complete day"}</Text>
                                <Ionicons name={previewOpen ? "chevron-up-outline" : "reader-outline"} size={14} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
                              </Pressable>
                              {previewOpen ? (
                                <View nativeID={previewContentId} style={[styles.planSampleReading, styles.planPreviewDayBox, phoneLayout && styles.phonePlanPreviewDayBox, plansDarkMode && styles.plansDarkDayRow]}>
                                  <Text style={[styles.planDayBadge, styles.compactPlanDayBadge, plansDarkMode && styles.plansDarkDayBadge]}>{planDetails.previewDay.day}</Text>
                                  <View style={[styles.planDayCopy, phoneLayout && styles.phonePlanPreviewCopy]}>
                                    <Text style={[styles.planDayTitle, phoneLayout && styles.phonePlanPreviewTitle, plansDarkMode && styles.accountDarkTitle]}>{planDetails.previewDay.title}</Text>
                                    <Text style={[styles.planDayPassage, plansDarkMode && styles.accountDarkMutedText]}>{planDetails.previewDay.reference}</Text>
                                    {planDetails.previewDay.context ? (
                                      <>
                                        <Text style={[styles.planDetailLabel, styles.planPreviewSectionLabel, plansDarkMode && styles.studyDarkAccentText]}>Context</Text>
                                        <Text style={[styles.planDetailText, plansDarkMode && styles.accountDarkMutedText]}>{planDetails.previewDay.context}</Text>
                                      </>
                                    ) : null}
                                    {planDetails.previewDay.devotional ? (
                                      <>
                                        <Text style={[styles.planDetailLabel, styles.planPreviewSectionLabel, plansDarkMode && styles.studyDarkAccentText]}>{planDetails.previewDay.devotional.title}</Text>
                                        <Text style={[styles.planDetailText, plansDarkMode && styles.accountDarkMutedText]}>{planDetails.previewDay.devotional.body}</Text>
                                      </>
                                    ) : null}
                                    {[
                                      ["Notice", planDetails.previewDay.observationQuestion],
                                      ["Reflect", planDetails.previewDay.reflectionQuestion || planDetails.previewDay.reflectionPrompt],
                                      ["Pray", planDetails.previewDay.prayer || planDetails.previewDay.prayerPrompt],
                                      ["Next step", planDetails.previewDay.gentleAction],
                                      ["Study deeper", planDetails.previewDay.studyMethod],
                                      ["Care note", shouldShowBibleReadingCareNote(planDetails.previewDay.careNote) ? planDetails.previewDay.careNote : ""]
                                    ].filter(([, value]) => !!value).map(([label, value]) => (
                                      <View key={label} style={[styles.planPreviewSection, label === "Care note" && styles.planDayCareNoteBox, label === "Care note" && plansDarkMode && styles.planDayCareNoteBoxDark]}>
                                        <Text style={[styles.planDetailLabel, plansDarkMode && styles.studyDarkAccentText]}>{label}</Text>
                                        <Text style={[styles.planDetailText, plansDarkMode && styles.accountDarkMutedText]}>{value}</Text>
                                        {label === "Care note" ? (
                                          <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel="Acknowledge this care note"
                                            onPress={() => acknowledgeBibleReadingCareNote(String(value))}
                                            style={[styles.careNoteAcknowledgeButton, plansDarkMode && styles.homeDarkResumeButton]}
                                          >
                                            <Ionicons name="checkmark-circle-outline" size={14} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
                                            <Text style={[styles.careNoteAcknowledgeText, plansDarkMode && styles.homeDarkResumeButtonText]}>I understand</Text>
                                          </Pressable>
                                        ) : null}
                                      </View>
                                    ))}
                                  </View>
                                </View>
                              ) : null}
                            </View>
                          ) : null}
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={visibleRows > 0 ? `Hide all readings for ${plan.title}` : `View all readings for ${plan.title}`}
                            accessibilityState={{ expanded: visibleRows > 0 }}
                            onPress={() => setExpandedBiblePlanVisibleRows((current) => ({ ...current, [plan.id]: visibleRows > 0 ? 0 : 10 }))}
                            style={[styles.readerBookmarkExpandButton, styles.planViewAllButton, plansDarkMode && styles.homeDarkResumeButton]}
                          >
                            <Text style={[styles.readerBookmarkExpandText, plansDarkMode && styles.homeDarkResumeButtonText]}>{visibleRows > 0 ? "Hide all readings" : "View all readings"}</Text>
                            <Ionicons name={visibleRows > 0 ? "chevron-up-outline" : "list-outline"} size={14} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
                          </Pressable>
                        </View>
                        {visiblePlanDays.map((planDay) => {
                          const done = completedBibleReadingPlanDaySet.has(bibleReadingPlanDayKey(plan.id, planDay.day));
                          return (
                            <View key={planDay.day} style={[styles.planPageDay, styles.compactPlanPageDay, phoneLayout && styles.phonePlanPageDay, phoneLayout && styles.phoneCompactPlanPageDay, plansDarkMode && styles.plansDarkDayRow, done && styles.completedPlanDayRow, plansDarkMode && done && styles.plansDarkCompletedDayRow]}>
                              <Text style={[styles.planDayBadge, styles.compactPlanDayBadge, done && styles.completedPlanDayBadge, plansDarkMode && !done && styles.plansDarkDayBadge]}>{done ? "✓" : planDay.day}</Text>
                              <View style={styles.planDayCopy}>
                                <Text style={[styles.planDayTitle, phoneLayout && styles.phonePlanDayTitle, plansDarkMode && styles.accountDarkTitle, plansDarkMode && done && styles.completedPlanDayTextDark]}>{planDay.title}</Text>
                                <Text numberOfLines={1} style={[styles.planDayPassage, phoneLayout && styles.phonePlanDayPassage, plansDarkMode && styles.accountDarkMutedText, plansDarkMode && done && styles.completedPlanDayMutedTextDark]}>{planDay.reference}</Text>
                              </View>
                              <View style={styles.planDayActions}>
                                <Pressable accessibilityRole="button" accessibilityLabel={`Open ${planDay.reference} in Bible without following ${plan.title}`} onPress={(event: any) => { event.stopPropagation?.(); openBibleReadingPlanDayInBible(planDay, ""); }} style={[styles.planDayIconAction, plansDarkMode && styles.homeDarkIconBubble]}>
                                  <Ionicons name="reader-outline" size={15} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
                                </Pressable>
                                <Pressable accessibilityRole="button" accessibilityLabel={`Study ${planDay.reference} without following ${plan.title}`} onPress={(event: any) => { event.stopPropagation?.(); studyBibleReadingPlanDay(planDay); }} style={[styles.planDayIconAction, plansDarkMode && styles.homeDarkIconBubble]}>
                                  <Ionicons name="book-outline" size={15} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
                                </Pressable>
                              </View>
                            </View>
                          );
                        })}
                        {plan.days.length > visiblePlanDays.length && (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Show more readings for ${plan.title}`}
                            onPress={() => setExpandedBiblePlanVisibleRows((current) => ({ ...current, [plan.id]: (current[plan.id] || 10) + 10 }))}
                            style={[styles.readerBookmarkExpandButton, plansDarkMode && styles.homeDarkResumeButton]}
                          >
                            <Text style={[styles.readerBookmarkExpandText, plansDarkMode && styles.homeDarkResumeButtonText]}>Show 10 more</Text>
                            <Ionicons name="chevron-down-outline" size={14} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
                          </Pressable>
                        )}
                      </>
                    )}
                  </Card>
                );
                        })}
                        {group.plans.length > visibleGroupPlans.length ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Show more ${group.title.toLowerCase()}`}
                            onPress={() => setVisibleBiblePlanGroupRows((current) => ({ ...current, [group.id]: visibleGroupRowCount + (phoneLayout ? 6 : 9) }))}
                            style={[styles.readerBookmarkExpandButton, plansDarkMode && styles.homeDarkResumeButton]}
                          >
                            <Text style={[styles.readerBookmarkExpandText, plansDarkMode && styles.homeDarkResumeButtonText]}>Show more plans</Text>
                            <Ionicons name="chevron-down-outline" size={14} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
                          </Pressable>
                        ) : null}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
            </View>
          </TabErrorBoundary>
        )}
        {tab === "methods" && (
          <View style={methodsDarkMode && styles.accountDarkLayout}>
            <Eyebrow>Practice library</Eyebrow>
            <Text style={[styles.title, methodsDarkMode && styles.accountDarkTitle]}>Choose how you want to learn</Text>
            <Text style={[styles.titleSupport, methodsDarkMode && styles.accountDarkMutedText]}>Tap the info button to see when to use a method, how it works, and a worked example.</Text>
            <View style={[styles.currentMethodStrip, methodsDarkMode && styles.accountDarkSection]}>
              <View style={styles.currentMethodCopy}>
                <Text style={[styles.methodInfoLabel, methodsDarkMode && styles.studyDarkAccentText]}>Current method</Text>
                <Text style={[styles.currentMethodTitle, methodsDarkMode && styles.accountDarkTitle]}>{method.short} · {method.name}</Text>
              </View>
              <View style={styles.currentMethodActions}>
                <AppButton label="Continue study" onPress={() => setTab("study")} style={styles.currentMethodButton} labelStyle={styles.currentMethodButtonLabel} />
                <AppButton label="Details" variant="secondary" onPress={() => setActiveMethodInfoId(method.id)} style={[styles.currentMethodButton, methodsDarkMode && styles.homeDarkResumeButton]} labelStyle={[styles.currentMethodButtonLabel, methodsDarkMode && styles.homeDarkResumeButtonText]} />
              </View>
            </View>
            <View style={styles.methodLibraryToolbar}>
              <Pressable accessibilityRole="button" onPress={() => setMethodChooserOpen((value) => !value)} style={[styles.methodToolbarButton, methodsDarkMode && styles.homeDarkResumeButton]}>
                <Ionicons name="sparkles-outline" size={16} color={methodsDarkMode ? "#e9b76a" : colors.oliveDark} />
                <Text style={[styles.methodToolbarButtonText, methodsDarkMode && styles.homeDarkResumeButtonText]}>Help me choose</Text>
                <Text style={[styles.methodToolbarBadge, methodsDarkMode && styles.methodsDarkBadge]}>{recommendedMethod.short}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setMethodFilterOpen((value) => !value)} style={[styles.methodToolbarButton, methodsDarkMode && styles.homeDarkResumeButton]}>
                <Ionicons name="filter-outline" size={16} color={methodsDarkMode ? "#e9b76a" : colors.oliveDark} />
                <Text style={[styles.methodToolbarButtonText, methodsDarkMode && styles.homeDarkResumeButtonText]}>{`Filter: ${methodFilter}`}</Text>
              </Pressable>
            </View>
            {methodFilterOpen && (
              <View style={styles.methodFilterSection}>
                <View style={styles.methodFilterRow}>
                  {methodFilters.map((filter) => (
                    <Pressable
                      key={filter}
                      accessibilityRole="button"
                      onPress={() => {
                        setMethodFilter(filter);
                        setMethodFilterOpen(false);
                      }}
                      style={[styles.methodFilterChip, methodsDarkMode && styles.printDarkOptionChip, methodFilter === filter && styles.activeMethodFilterChip]}
                    >
                      <Text style={[styles.methodFilterText, methodsDarkMode && styles.accountDarkMutedText, methodFilter === filter && styles.activeMethodFilterText]}>{filter}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
            {methodChooserOpen && (
              <Card style={[styles.methodRecommendPanel, methodsDarkMode && styles.accountDarkMainCard]}>
                <View style={styles.methodRecommendHeader}>
                  <View style={styles.methodRecommendTitleBlock}>
                    <Text style={[styles.methodInfoLabel, methodsDarkMode && styles.studyDarkAccentText]}>Help me choose</Text>
                    <Text style={[styles.methodRecommendTitle, methodsDarkMode && styles.accountDarkTitle]}>{recommendedMethod.name}</Text>
                    <Text style={[styles.methodRecommendReason, methodsDarkMode && styles.accountDarkMutedText]}>{selectedMethodRecommendation.reason}</Text>
                  </View>
                  <Text style={[styles.badge, methodsDarkMode && styles.methodsDarkBadge]}>{recommendedMethod.short}</Text>
                </View>
                <View style={styles.methodRecommendChoices}>
                  {methodRecommendations.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => setMethodRecommendationId(item.id)}
                    style={[styles.methodRecommendChoice, methodsDarkMode && styles.printDarkOptionChip, methodRecommendationId === item.id && styles.activeMethodRecommendChoice]}
                  >
                    <Text style={[styles.methodRecommendChoiceText, methodsDarkMode && styles.accountDarkMutedText, methodRecommendationId === item.id && styles.activeMethodRecommendChoiceText]}>{item.label}</Text>
                  </Pressable>
                  ))}
                </View>
                <View style={styles.methodInfoActions}>
                  <AppButton
                    label="Start recommended"
                    onPress={() => {
                      switchMethod(recommendedMethod.id);
                      setTab("study");
                    }}
                  />
                  <AppButton label="View details" variant="secondary" onPress={() => setActiveMethodInfoId(recommendedMethod.id)} style={methodsDarkMode && styles.homeDarkResumeButton} labelStyle={methodsDarkMode && styles.homeDarkResumeButtonText} />
                  <AppButton label="Hide" variant="secondary" onPress={() => setMethodChooserOpen(false)} style={methodsDarkMode && styles.homeDarkResumeButton} labelStyle={methodsDarkMode && styles.homeDarkResumeButtonText} />
                </View>
              </Card>
            )}
            {activeMethodInfo && (
              <Card style={[styles.methodInfoPanel, methodsDarkMode && styles.accountDarkMainCard]}>
                <View style={styles.methodInfoHeader}>
                  <View style={styles.methodInfoTitleBlock}>
                    <Text style={[styles.badge, methodsDarkMode && styles.methodsDarkBadge]}>{activeMethodInfo.short}</Text>
                    <Text style={[styles.cardTitle, methodsDarkMode && styles.accountDarkTitle]}>{activeMethodInfo.name}</Text>
                    <Text style={[styles.muted, methodsDarkMode && styles.accountDarkMutedText]}>{activeMethodInfo.tone}</Text>
                  </View>
                  <Pressable accessibilityRole="button" onPress={() => setActiveMethodInfoId("")} style={[styles.methodIconButton, methodsDarkMode && styles.homeDarkIconBubble]}>
                    <Ionicons name="close-outline" size={18} color={methodsDarkMode ? "#e9b76a" : colors.oliveDark} />
                  </Pressable>
                </View>
                <Text style={[styles.body, methodsDarkMode && styles.accountDarkText]}>{activeMethodInfo.detail?.purpose || activeMethodInfo.description}</Text>
                <Text style={[styles.methodDurationText, methodsDarkMode && styles.accountDarkMutedText]}>{`Typical pace: ${activeMethodInfo.detail?.duration || "Take the time you need"}`}</Text>
                <View style={styles.methodInfoSection}>
                  <Text style={[styles.methodInfoLabel, methodsDarkMode && styles.studyDarkAccentText]}>Best for</Text>
                  <View style={styles.methodFitRow}>
                    {Array.from(new Set([...(activeMethodInfo.detail?.bestFor || []), ...(activeMethodInfo.labels || []), activeMethodInfo.tone])).map((fit) => (
                      <Text key={fit} style={[styles.methodFitPill, methodsDarkMode && styles.methodsDarkPill]}>{fit}</Text>
                    ))}
                  </View>
                </View>
                <View style={styles.methodInfoSection}>
                  <Text style={[styles.methodInfoLabel, methodsDarkMode && styles.studyDarkAccentText]}>How it works</Text>
                  {activeMethodInfo.steps.map((methodStep, index) => (
                    <View key={`${activeMethodInfo.id}-${methodStep.id}`} style={[styles.methodStepPreview, methodsDarkMode && styles.accountDarkInsetBox]}>
                      <Text style={styles.methodStepNumber}>{index + 1}</Text>
                      <View style={styles.methodStepCopy}>
                        <Text style={[styles.methodStepTitle, methodsDarkMode && styles.accountDarkTitle]}>{methodStep.title}</Text>
                        <Text style={[styles.methodStepText, methodsDarkMode && styles.accountDarkMutedText]}>{methodStep.action}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                <View style={styles.methodInfoSection}>
                  <Text style={[styles.methodInfoLabel, methodsDarkMode && styles.studyDarkAccentText]}>Example</Text>
                  <Text style={styles.methodExamplePassage}>{activeMethodInfo.detail?.examplePassage || "Psalm 23"}</Text>
                  {(activeMethodInfo.detail?.exampleWalkthrough || activeMethodInfo.steps.map((methodStep) => `${methodStep.title}: ${methodStep.example}`)).map((line) => (
                    <Text key={line} style={[styles.methodExampleLine, methodsDarkMode && styles.accountDarkText]}>{line}</Text>
                  ))}
                </View>
                {!!activeMethodInfo.detail?.watchFor && (
                  <View style={[styles.methodWatchBox, methodsDarkMode && styles.methodsDarkWatchBox]}>
                    <Ionicons name="alert-circle-outline" size={17} color={colors.coral} />
                    <Text style={[styles.methodWatchText, methodsDarkMode && styles.accountDarkText]}>{activeMethodInfo.detail.watchFor}</Text>
                  </View>
                )}
                <View style={styles.methodInfoActions}>
                  <AppButton
                    label="Start with this method"
                    onPress={() => {
                      switchMethod(activeMethodInfo.id);
                      setActiveMethodInfoId("");
                      setTab("study");
                    }}
                  />
                  <AppButton label="Try example" variant="secondary" onPress={() => startMethodExample(activeMethodInfo.id)} style={methodsDarkMode && styles.homeDarkResumeButton} labelStyle={methodsDarkMode && styles.homeDarkResumeButtonText} />
                  <AppButton label="Close" variant="secondary" onPress={() => setActiveMethodInfoId("")} style={methodsDarkMode && styles.homeDarkResumeButton} labelStyle={methodsDarkMode && styles.homeDarkResumeButtonText} />
                </View>
              </Card>
            )}
            <View style={styles.methodGrid}>
              {visibleMethods.map((item) => (
                <Card key={item.id} style={[styles.methodCard, phoneLayout && styles.phoneMethodCard, methodsDarkMode && styles.accountDarkMainCard]}>
                  <View style={styles.methodCardHeader}>
                    <Text style={[styles.badge, methodsDarkMode && styles.methodsDarkBadge]}>{item.short}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel={`About ${item.short}`} onPress={() => setActiveMethodInfoId(item.id)} style={[styles.methodIconButton, methodsDarkMode && styles.homeDarkIconBubble]}>
                      <Ionicons name="information-circle-outline" size={18} color={methodsDarkMode ? "#e9b76a" : colors.oliveDark} />
                    </Pressable>
                  </View>
                  <Text style={[styles.cardTitle, methodsDarkMode && styles.accountDarkTitle]}>{item.name}</Text>
                  <Text style={[styles.muted, methodsDarkMode && styles.accountDarkMutedText]}>{item.tone}</Text>
                  <View style={styles.methodLabelRow}>
                    {(item.labels || [item.tone]).slice(0, 3).map((label) => (
                      <Text key={`${item.id}-${label}`} style={[styles.methodLabelPill, methodsDarkMode && styles.methodsDarkPill]}>{label}</Text>
                    ))}
                  </View>
                  <Text style={[styles.body, methodsDarkMode && styles.accountDarkText]}>{item.description}</Text>
                  <View style={styles.methodStepCountRow}>
                    <Ionicons name="list-outline" size={15} color={colors.coral} />
                    <Text style={[styles.methodStepCountText, methodsDarkMode && styles.accountDarkMutedText]}>{`${item.steps.length} guided steps · ${item.detail?.duration || item.tone}`}</Text>
                  </View>
                  <View style={styles.methodCardAction}>
                    <AppButton
                      label="Practice"
                      variant="secondary"
                      onPress={() => {
                        switchMethod(item.id);
                        setTab("study");
                      }}
                      style={methodsDarkMode && styles.homeDarkResumeButton}
                      labelStyle={methodsDarkMode && styles.homeDarkResumeButtonText}
                    />
                  </View>
                </Card>
              ))}
              {!visibleMethods.length && (
                <Card style={[styles.emptyMethodCard, methodsDarkMode && styles.accountDarkMainCard]}>
                  <Text style={[styles.emptyJournalTitle, methodsDarkMode && styles.accountDarkTitle]}>No methods match this filter</Text>
                  <Text style={[styles.emptyJournalText, methodsDarkMode && styles.accountDarkMutedText]}>Choose another focus to keep browsing.</Text>
                </Card>
              )}
            </View>
          </View>
        )}

        {tab === "memory" && (
          <TabErrorBoundary
            resetKey={`memory-${memoryView}-${activeMemoryVerseId || ""}`}
            fallback={<Card style={[styles.mainCard, memoryDarkMode && styles.accountDarkMainCard]}><Text style={[styles.cardTitle, memoryDarkMode && styles.accountDarkTitle]}>Memory could not load</Text><Text style={[styles.muted, memoryDarkMode && styles.accountDarkMutedText]}>Try another tab, then return to Memory.</Text></Card>}
          >
            <Suspense fallback={<Card style={[styles.mainCard, memoryDarkMode && styles.accountDarkMainCard]}><Text style={[styles.muted, memoryDarkMode && styles.accountDarkMutedText]}>Loading memory...</Text></Card>}>
              <LazyMemoryTab
              activeMemoryCollectionDueCount={activeMemoryCollectionDueCount}
              activeMemoryCollectionName={activeMemoryCollectionName}
              activeMemoryMeditationVerseId={activeMemoryMeditationVerseId}
              activeMemoryReviewQueueCount={activeMemoryReviewQueueCount}
              activeMemoryReviewQueueIndex={activeMemoryReviewQueueIndex}
              activeMemoryVerseId={activeMemoryVerseId}
              addMemoryPanelOpen={addMemoryPanelOpen}
              addMemoryVerseCollection={addMemoryVerseCollection}
              bulkReviewOptionsExpanded={bulkReviewOptionsExpanded}
              clearMemoryBrowseFilters={clearMemoryBrowseFilters}
              closeMemoryMeditation={closeMemoryMeditation}
              collectionMemoryVerseId={collectionMemoryVerseId}
              communitySubView={communitySubView}
              compactLayout={compactLayout}
              continueMemoryPractice={continueMemoryPractice}
              currentBrowseMemoryVerses={currentBrowseMemoryVerses}
              currentBrowseReviewPreset={currentBrowseReviewPreset}
              deleteMemoryVerse={deleteMemoryVerse}
              dueMemoryCount={dueMemoryCount}
              dueMemoryReviewSort={dueMemoryReviewSort}
              expandedMemoryFilterBook={expandedMemoryFilterBook}
              expandedMemoryVerseIds={expandedMemoryVerseIds}
              expandedReviewOptionsVerseId={expandedReviewOptionsVerseId}
              firstName={firstName}
              focusMemoryBlankAfter={focusMemoryBlankAfter}
              friendlyName={friendlyName}
              historyMemoryVerseId={historyMemoryVerseId}
              memoryBlankInputRefs={memoryBlankInputRefs}
              memoryBlankTokens={memoryBlankTokens}
              memoryBookCounts={memoryBookCounts}
              memoryBookFilter={memoryBookFilter}
              memoryBookSections={memoryBookSections}
              memoryBrowseFilterSummary={memoryBrowseFilterSummary}
              memoryBrowseFiltersOpen={memoryBrowseFiltersOpen}
              memoryBrowseSections={memoryBrowseSections}
              memoryBrowseStatusFilter={memoryBrowseStatusFilter}
              memoryChapterFilter={memoryChapterFilter}
              memoryChaptersByBook={memoryChaptersByBook}
              memoryCollectionDraft={memoryCollectionDraft}
              memoryCollectionFilter={memoryCollectionFilter}
              memoryCollectionOptions={memoryCollectionOptions}
              memoryCollectionPickerOpen={memoryCollectionPickerOpen}
              memoryDarkMode={memoryDarkMode}
              memoryFilterMobileMenu={memoryFilterMobileMenu}
              memoryHintLevels={memoryHintLevels}
              memoryHintsVisible={memoryHintsVisible}
              memoryHistoryEncouragement={memoryHistoryEncouragement}
              memoryHistoryExpanded={memoryHistoryExpanded}
              memoryHistoryItems={memoryHistoryItems}
              memoryHistorySummary={memoryHistorySummary}
              memoryMeditationCarry={memoryMeditationCarry}
              memoryMeditationPhrase={memoryMeditationPhrase}
              memoryMeditationPrayer={memoryMeditationPrayer}
              memoryMeditationReflection={memoryMeditationReflection}
              memoryMeditationStep={memoryMeditationStep}
              memoryMilestoneGoalIds={memoryMilestoneGoalIds}
              memoryMilestonePickerOpen={memoryMilestonePickerOpen}
              memoryMilestoneStatus={memoryMilestoneStatus}
              memoryMilestones={memoryMilestones}
              memoryMoreVerseId={memoryMoreVerseId}
              memoryPracticeAllCorrect={memoryPracticeAllCorrect}
              memoryPracticeAnswers={memoryPracticeAnswers}
              memoryPracticeChecked={memoryPracticeChecked}
              memoryPracticeLevel={memoryPracticeLevel}
              memoryPracticeResult={memoryPracticeResult}
              memoryPracticeText={memoryPracticeText}
              memoryPracticeTokens={memoryPracticeTokens}
              memorySearch={memorySearch}
              memoryStatus={memoryStatus}
              memoryToolbarMoreOpen={memoryToolbarMoreOpen}
              memoryVerses={memoryVerses}
              memoryView={memoryView}
              memoryWeeklyScripture={memoryWeeklyScripture}
              memoryWeeklySummary={memoryWeeklySummary}
              Metric={Metric}
              moveMemoryPracticeStep={moveMemoryPracticeStep}
              neglectedMemoryVerses={neglectedMemoryVerses}
              openMemoryBookCollectionBuilder={openMemoryBookCollectionBuilder}
              openMemoryPrintOptions={openMemoryPrintOptions}
              pendingDeleteMemoryVerseId={pendingDeleteMemoryVerseId}
              phoneLayout={phoneLayout}
              phoneMemoryFocusMode={phoneMemoryFocusMode}
              removeMemoryVerseCollection={removeMemoryVerseCollection}
              repeatMemoryPracticeStep={repeatMemoryPracticeStep}
              reviewScheduleVerseId={reviewScheduleVerseId}
              ResumeButton={ResumeButton}
              reviewedMemoryReviewSort={reviewedMemoryReviewSort}
              reviewedTodayCount={reviewedTodayCount}
              saveMemoryMeditation={saveMemoryMeditation}
              saveMemoryVerseCollections={saveMemoryVerseCollections}
              scheduleFilteredMemoryReview={scheduleFilteredMemoryReview}
              scheduleMemoryVerseReview={scheduleMemoryVerseReview}
              selectMemoryFilterBook={selectMemoryFilterBook}
              selectMemoryFilterChapter={selectMemoryFilterChapter}
              setActiveMemoryVerseId={setActiveMemoryVerseId}
              setAddMemoryPanelOpen={setAddMemoryPanelOpen}
              setBulkReviewOptionsExpanded={setBulkReviewOptionsExpanded}
              setCollectionMemoryVerseId={setCollectionMemoryVerseId}
              setDueMemoryReviewSort={setDueMemoryReviewSort}
              setExpandedMemoryVerseIds={setExpandedMemoryVerseIds}
              setExpandedReviewOptionsVerseId={setExpandedReviewOptionsVerseId}
              setHistoryMemoryVerseId={setHistoryMemoryVerseId}
              setMemoryBrowseFiltersOpen={setRememberedMemoryBrowseFiltersOpen}
              setMemoryBrowseStatusFilter={setRememberedMemoryBrowseStatusFilter}
              setMemoryCollectionDraft={setMemoryCollectionDraft}
              setMemoryCollectionFilter={setRememberedMemoryCollectionFilter}
              setMemoryCollectionPickerOpen={setMemoryCollectionPickerOpen}
              setMemoryFilterMobileMenu={setMemoryFilterMobileMenu}
              setMemoryHintsVisible={setMemoryHintsVisible}
              setMemoryHistoryExpanded={setMemoryHistoryExpanded}
              setMemoryMeditationCarry={setMemoryMeditationCarry}
              setMemoryMeditationPhrase={setMemoryMeditationPhrase}
              setMemoryMeditationPrayer={setMemoryMeditationPrayer}
              setMemoryMeditationReflection={setMemoryMeditationReflection}
              setMemoryMeditationStep={setMemoryMeditationStep}
              setMemoryMilestonePickerOpen={setMemoryMilestonePickerOpen}
              setMemoryMoreVerseId={setMemoryMoreVerseId}
              setMemorySearch={setMemorySearch}
              setMemoryToolbarMoreOpen={setMemoryToolbarMoreOpen}
              setMemoryView={setRememberedMemoryView}
              setReviewScheduleVerseId={setReviewScheduleVerseId}
              setReviewedMemoryReviewSort={setReviewedMemoryReviewSort}
              setTab={setTab}
              shortBibleTranslationName={shortBibleTranslationName}
              showMoreMemoryHint={showMoreMemoryHint}
              startDueMemoryReviewQueue={startDueMemoryReviewQueue}
              startMemoryMeditation={startMemoryMeditation}
              startMemoryPractice={startMemoryPractice}
              stopMemoryReviewQueue={stopMemoryReviewQueue}
              styles={styles}
              submitMemoryPractice={submitMemoryPractice}
              toggleMemoryMilestoneGoal={toggleMemoryMilestoneGoal}
              updateMemoryPracticeAnswer={updateMemoryPracticeAnswer}
              visibleMemoryHistoryItems={visibleMemoryHistoryItems}
              visibleMemorySections={visibleMemorySections}
              />
            </Suspense>
          </TabErrorBoundary>
        )}

        {tab === "accountability" && (
          <TabErrorBoundary
            resetKey={`community-${communitySubView}`}
            fallback={<Card style={[styles.mainCard, communityDarkMode && styles.accountDarkMainCard]}><Text style={[styles.cardTitle, communityDarkMode && styles.accountDarkTitle]}>Community could not load</Text><Text style={[styles.muted, communityDarkMode && styles.accountDarkMutedText]}>Try another tab, then return to Community.</Text></Card>}
          >
            <Suspense fallback={<Card style={[styles.mainCard, communityDarkMode && styles.accountDarkMainCard]}><Text style={[styles.muted, communityDarkMode && styles.accountDarkMutedText]}>Loading community...</Text></Card>}>
              <LazyCommunityTab
              styles={styles}
              compactLayout={compactLayout}
              phoneLayout={phoneLayout}
              communitySubView={communitySubView}
              setCommunitySubView={setCommunitySubView}
              communityDarkMode={communityDarkMode}
              firstName={firstName}
              toggleRememberedPanel={toggleRememberedPanel}
              setMobileFriendsPanelOpen={setMobileFriendsPanelOpen}
              friendPanelSummary={friendPanelSummary}
              mobileFriendsPanelOpen={mobileFriendsPanelOpen}
              showFriendsConnectionPanel={showFriendsConnectionPanel}
              COMMUNITY_CIRCLES_ENABLED={COMMUNITY_CIRCLES_ENABLED}
              isAuthenticated={isAuthenticated}
              myFriendCode={myFriendCode}
              copyFriendCode={copyFriendCode}
              setFriendToolsOpen={setFriendToolsOpen}
              friendToolsOpen={friendToolsOpen}
              friendCodeInput={friendCodeInput}
              setFriendCodeInput={setFriendCodeInput}
              inviteFriendWithCode={inviteFriendWithCode}
              friendEmail={friendEmail}
              setFriendEmail={setFriendEmail}
              inviteFriend={inviteFriend}
              acceptedCommunityFriends={acceptedCommunityFriends}
              selectedFriendId={selectedFriendId}
              setSelectedFriendId={setSelectedFriendId}
              setPendingFriendRemoveId={setPendingFriendRemoveId}
              pendingCommunityFriendInvites={pendingCommunityFriendInvites}
              acceptFriendInvite={acceptFriendInvite}
              removeFriend={removeFriend}
              pendingFriendRemoveId={pendingFriendRemoveId}
              managedCommunityFriend={managedCommunityFriend}
              friendStatus={friendStatus}
              setTab={setTab}
              setMobileCirclesPanelOpen={setMobileCirclesPanelOpen}
              circlePanelSummary={circlePanelSummary}
              mobileCirclesPanelOpen={mobileCirclesPanelOpen}
              showCirclesConnectionPanel={showCircleConnectionPanel}
              communityCircles={communityCircles}
              selectedCircleId={selectedCircleId}
              setSelectedCircleId={setSelectedCircleId}
              setPendingCircleDeleteId={setPendingCircleDeleteId}
              copyCircleInviteCode={copyCircleInviteCode}
              deleteCircle={deleteCircle}
              pendingCircleDeleteId={pendingCircleDeleteId}
              pendingCircleLeaveId={pendingCircleLeaveId}
              setPendingCircleLeaveId={setPendingCircleLeaveId}
              leaveCircle={leaveCircle}
              circleStatus={circleStatus}
              setCircleManagerOpen={setCircleManagerOpen}
              circleManagerOpen={circleManagerOpen}
              circleName={circleName}
              setCircleName={setCircleName}
              createCircle={createCircle}
              circleInviteCode={circleInviteCode}
              setCircleInviteCode={setCircleInviteCode}
              joinCircle={joinCircle}
              communityTargetPickerOpen={communityTargetPickerOpen}
              setCommunityTargetPickerOpen={setCommunityTargetPickerOpen}
              activeCommunityTargetName={activeCommunityTargetName}
              communityTargetType={communityTargetType}
              targetFriendIds={targetFriendIds}
              setTargetFriendIds={setTargetFriendIds}
              setCommunityTargetType={setCommunityTargetType}
              setTargetCircleId={setTargetCircleId}
              targetCircleId={targetCircleId}
              hasAvailableCommunityTarget={hasAvailableCommunityTarget}
              friendlyName={friendlyName}
              checkinNote={checkinNote}
              setCheckinNote={setCheckinNote}
              communityMessage={communityMessage}
              isSavingCheckin={isSavingCheckin}
              persistCheckin={persistCheckin}
              communityStatus={communityStatus}
              communityHistoryFilter={communityHistoryFilter}
              setCommunityHistoryFilter={setCommunityHistoryFilter}
              communityHistoryCircleId={communityHistoryCircleId}
              setCommunityHistoryCircleId={setCommunityHistoryCircleId}
              communityHistoryCircleOptions={communityHistoryCircleOptions}
              communityHistoryGroups={communityHistoryGroups}
              visibleCheckins={visibleCheckins}
              checkins={checkins}
              recentCheckinsExpanded={recentCheckinsExpanded}
              setRecentCheckinsExpanded={setRecentCheckinsExpanded}
              communityReactionOverrides={communityReactionOverrides}
              pendingCheckinDeleteId={pendingCheckinDeleteId}
              editingCommunityPostId={editingCommunityPostId}
              editingRecentCheckinId={editingRecentCheckinId}
              editCommunityPostNote={editCommunityPostNote}
              editRecentCheckinNote={editRecentCheckinNote}
              isSavingCommunityPostEdit={isSavingCommunityPostEdit}
              isSavingRecentCheckinEdit={isSavingRecentCheckinEdit}
              focusedCommunityItemId={focusedCommunityItemId}
              setFocusedCommunityItemId={setFocusedCommunityItemId}
              setEditCommunityPostNote={setEditCommunityPostNote}
              setEditRecentCheckinNote={setEditRecentCheckinNote}
              toggleCommunityReaction={toggleCommunityReaction}
              saveCommunityPostEdit={saveCommunityPostEdit}
              saveRecentCheckinEdit={saveRecentCheckinEdit}
              cancelEditCommunityPost={cancelEditCommunityPost}
              cancelEditRecentCheckin={cancelEditRecentCheckin}
              copyPastCheckinMessage={copyPastCheckinMessage}
              startEditCommunityPost={startEditCommunityPost}
              startEditRecentCheckin={startEditRecentCheckin}
              deleteCommunityPost={deleteCommunityPost}
              deleteRecentCheckin={deleteRecentCheckin}
            />
          </Suspense>
          </TabErrorBoundary>
        )}

        {tab === "account" && (
          <View style={[styles.layout, compactLayout && styles.stackedLayout, accountDarkMode && styles.accountDarkLayout]}>
            <Card style={[styles.mainCard, compactLayout && styles.fluidCard, accountDarkMode && styles.accountDarkMainCard]}>
              <Eyebrow>Account & access</Eyebrow>
              <Text style={[styles.title, accountDarkMode && styles.accountDarkTitle]}>{firstName ? `${firstName}, your profile` : "Your account"}</Text>
              <Text style={[styles.titleSupport, accountDarkMode && styles.accountDarkMutedText]}>{isAuthenticated ? "Manage your profile, sign-in details, and preferences." : "Sign in or create an account to keep your studies across devices."}</Text>
              <View style={[styles.accountSection, styles.accountAccessSection, accountDarkMode && styles.accountDarkSection]}>
                <Text style={[styles.sectionTitle, accountDarkMode && styles.accountDarkTitle]}>{isAuthenticated ? "Your account" : authFlow === "signIn" ? "Sign in" : "Create account"}</Text>
                {isAuthenticated ? (
                  <>
                    <View style={styles.signedInBadgeRow}>
                      <View style={[styles.signedInBadge, accountDarkMode && styles.accountDarkBadge]}>
                        <Ionicons name={profile?.authProvider === "google" ? "logo-google" : profile?.authProvider === "apple" ? "logo-apple" : "checkmark-circle-outline"} size={16} color={accountDarkMode ? "#e9b76a" : colors.oliveDark} />
                        <Text style={[styles.signedInBadgeText, accountDarkMode && styles.accountDarkBadgeText]}>{`Signed in with ${accountProviderLabel}`}</Text>
                      </View>
                    </View>
                    <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>{`${accountIdentityLabel}. New studies, drafts, and encouragements can follow this account across devices.`}</Text>
                    <AppButton label="Sign out" onPress={submitSignOut} />
                  </>
                ) : (
                  <>
                    <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>{authFlow === "signIn" ? "Welcome back. Sign in to access your saved studies and reading progress." : "Create a free account to keep your studies and reading progress across devices."}</Text>
                    {authFlow === "signUp" && <View style={[styles.freeAccountBox, accountDarkMode && styles.accountDarkInsetBox]}>
                      <View style={styles.feedbackHeader}>
                        <Ionicons name="gift-outline" size={18} color={accountDarkMode ? "#e9b76a" : colors.coral} />
                        <Text style={[styles.feedbackTitle, accountDarkMode && styles.accountDarkTitle]}>Why create a free account?</Text>
                      </View>
                      {[
                        "Keep your studies, journal, highlights, memory verses, and reading progress connected to you.",
                        "Move between phone, desktop, and web without starting again.",
                        "Keep the app personal, with encouragement using your name."
                      ].map((benefit) => (
                        <View key={benefit} style={styles.freeAccountBenefitRow}>
                          <Ionicons name="checkmark-circle-outline" size={16} color={accountDarkMode ? "#e9b76a" : colors.oliveDark} />
                          <Text style={[styles.freeAccountBenefitText, accountDarkMode && styles.accountDarkText]}>{benefit}</Text>
                        </View>
                      ))}
                      <Pressable onPress={openPrivacyPolicyFromAccountIntro} style={styles.freeAccountPrivacyLink}>
                        <Ionicons name="shield-checkmark-outline" size={15} color={accountDarkMode ? "#e9b76a" : colors.oliveDark} />
                        <Text style={[styles.freeAccountPrivacyLinkText, accountDarkMode && styles.accountDarkBadgeText]}>Read the Privacy Policy</Text>
                      </Pressable>
                    </View>}
                    <View style={[styles.authFlowRow, accountDarkMode && styles.accountDarkSegmentedRow]}>
                      <Pressable accessibilityRole="button" accessibilityLabel="Sign in to an existing account" disabled={authBusy} accessibilityState={{ selected: authFlow === "signIn", disabled: authBusy }} onPress={() => { setAuthFlow("signIn"); setAuthStatus(""); setAuthPassword(""); }} style={[styles.authFlowButton, authFlow === "signIn" && styles.activeAuthFlowButton, accountDarkMode && authFlow === "signIn" && styles.accountDarkActiveSegment]}>
                        <Text style={[styles.authFlowText, accountDarkMode && styles.accountDarkMutedText, authFlow === "signIn" && styles.activeAuthFlowText]}>Sign in</Text>
                      </Pressable>
                      <Pressable accessibilityRole="button" accessibilityLabel="Create a free account" disabled={authBusy} accessibilityState={{ selected: authFlow === "signUp", disabled: authBusy }} onPress={() => { setAuthFlow("signUp"); setAuthStatus(""); setAuthPassword(""); }} style={[styles.authFlowButton, authFlow === "signUp" && styles.activeAuthFlowButton, accountDarkMode && authFlow === "signUp" && styles.accountDarkActiveSegment]}>
                        <Text style={[styles.authFlowText, accountDarkMode && styles.accountDarkMutedText, authFlow === "signUp" && styles.activeAuthFlowText]}>Create account</Text>
                      </Pressable>
                    </View>
                    {authFlow === "signUp" && (
                      <TextInput
                        accessibilityLabel="Your name"
                        value={authName}
                        onChangeText={setAuthName}
                        autoCapitalize="words"
                        placeholder="Your name"
                        placeholderTextColor={accountDarkMode ? "#9d927f" : undefined}
                        style={[styles.input, styles.accountAuthInput, accountDarkMode && styles.accountDarkInput]}
                      />
                    )}
                    <Text style={[styles.authFieldLabel, accountDarkMode && styles.accountDarkText]}>Email or username</Text>
                    <TextInput
                      accessibilityLabel="Email address or username"
                      value={authIdentifier}
                      onChangeText={setAuthIdentifier}
                      autoCapitalize="none"
                      placeholder="Email or username"
                      placeholderTextColor={accountDarkMode ? "#9d927f" : undefined}
                      style={[styles.input, styles.accountAuthInput, accountDarkMode && styles.accountDarkInput]}
                    />
                    <Text style={[styles.authHelperText, accountDarkMode && styles.accountDarkMutedText]}>
                      {authFlow === "signIn"
                        ? "Enter the email address or username you used when creating your account."
                        : "Use an email address, or choose a unique username without sharing your email."}
                    </Text>
                    <Text style={[styles.authFieldLabel, accountDarkMode && styles.accountDarkText]}>{authFlow === "signUp" ? "Password (at least 8 characters)" : "Password"}</Text>
                    <TextInput
                      accessibilityLabel="Password"
                      value={authPassword}
                      onChangeText={setAuthPassword}
                      autoCapitalize="none"
                      secureTextEntry
                      placeholder="Password"
                      placeholderTextColor={accountDarkMode ? "#9d927f" : undefined}
                      style={[styles.input, styles.accountAuthInput, accountDarkMode && styles.accountDarkInput]}
                    />
                    <AppButton label={authBusy ? (authFlow === "signIn" ? "Signing in…" : "Creating account…") : authFlow === "signIn" ? "Sign in" : "Create account"} disabled={authBusy} onPress={submitAuth} />
                    {!!authStatus && <Text accessibilityLiveRegion="polite" style={[styles.authFeedback, accountDarkMode && styles.accountDarkText]}>{authStatus}</Text>}
                    {authFlow === "signIn" && <View style={styles.accountRecoveryOptions}>
                      <Text style={[styles.authFeedback, accountDarkMode && styles.accountDarkMutedText]}>Need help signing in?</Text>
                      <Suspense fallback={<Text style={[styles.authFeedback, accountDarkMode && styles.accountDarkText]}>Loading recovery options…</Text>}>
                        <PasswordRecovery enabled={recoveryAvailable === true} darkMode={accountDarkMode} />
                        <RecoveryCode darkMode={accountDarkMode} />
                      </Suspense>
                    </View>}
                  </>
                )}
                {isAuthenticated && accountIdentity?.authPasswordAccountId && <Suspense fallback={<Text>Loading recovery options…</Text>}><View style={styles.accountRecoveryOptions}><RecoveryCode accountId={accountIdentity.authPasswordAccountId} darkMode={accountDarkMode} /></View></Suspense>}
                {isAuthenticated && !!authStatus && <Text accessibilityLiveRegion="polite" style={[styles.authFeedback, accountDarkMode && styles.accountDarkText]}>{authStatus}</Text>}
              </View>
              <View style={[styles.accountSection, styles.accountAccessSection, accountDarkMode && styles.accountDarkSection]}>
                <Text style={[styles.sectionTitle, accountDarkMode && styles.accountDarkTitle]}>Older data on this device</Text>
                <Text style={[styles.authFeedback, accountDarkMode && styles.accountDarkMutedText]}>If you used an older version of this app, you can copy its saved device data into your current profile. On a shared device, only import data that belongs to you. Existing saved data will be kept.</Text>
                <AppButton label="Import older device data" variant="secondary" style={accountDarkMode && styles.accountDarkInsetBox} labelStyle={accountDarkMode && styles.accountDarkText} onPress={async () => {
                  try { await importLegacyDevicePreferences(); setProfileInitializationAttempt(value => value + 1); setImportStatus("Import finished. Existing saved data was kept; any available older data filled missing entries."); }
                  catch { setImportStatus("Could not import device data. Please try again."); }
                }} />
                {!!importStatus && <Text accessibilityLiveRegion="polite" style={[styles.authFeedback, accountDarkMode && styles.accountDarkText]}>{importStatus}</Text>}
              </View>
              {isAuthenticated && (
                <View style={[styles.accountSection, accountDarkMode && styles.accountDarkSection]}>
                  <Text style={[styles.sectionTitle, accountDarkMode && styles.accountDarkTitle]}>Personal details</Text>
                  <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>This is how the app refers to you in encouraging prompts, account details, and community spaces.</Text>
                  <TextInput accessibilityLabel="Display name" value={displayName} onChangeText={setDisplayName} placeholder="Display name" placeholderTextColor={accountDarkMode ? "#9d927f" : undefined} style={[styles.input, accountDarkMode && styles.accountDarkInput]} />
                  {!!profile?.authUsername && (
                    <View style={[styles.signedInBadge, styles.accountUsernameBadge, accountDarkMode && styles.accountDarkBadge]}>
                      <Ionicons name="person-circle-outline" size={16} color={accountDarkMode ? "#e9b76a" : colors.oliveDark} />
                      <Text style={[styles.signedInBadgeText, accountDarkMode && styles.accountDarkBadgeText]}>{`Username: @${profile.authUsername}`}</Text>
                    </View>
                  )}
                  <TextInput
                    accessibilityLabel={profile?.authUsername ? "Optional contact email" : "Email address"}
                    value={accountEmail}
                    onChangeText={setAccountEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder={profile?.authUsername ? "Optional contact email" : "Email"}
                    placeholderTextColor={accountDarkMode ? "#9d927f" : undefined}
                    style={[styles.input, accountDarkMode && styles.accountDarkInput]}
                  />
                  {!!profile?.authUsername && (
                    <Text style={[styles.authHelperText, accountDarkMode && styles.accountDarkMutedText]}>
                      This contact email does not enable email password recovery for a username account. Save a recovery code to recover your account.
                    </Text>
                  )}
                  <AppButton label="Save details" onPress={persistAccountSettings} />
                  {!!accountStatus && <Text style={styles.saveStatus}>{accountStatus}</Text>}
                </View>
              )}
              {isAuthenticated && profile?.authProvider === "password" && (
                <View style={[styles.accountSection, accountDarkMode && styles.accountDarkSection]}>
                  <Text style={[styles.sectionTitle, accountDarkMode && styles.accountDarkTitle]}>Change password</Text>
                  <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>Use this if you signed in with email or username and password.</Text>
                  <TextInput
                    accessibilityLabel="Current password"
                    value={currentAccountPassword}
                    onChangeText={setCurrentAccountPassword}
                    autoCapitalize="none"
                    secureTextEntry
                    placeholder="Current password"
                    placeholderTextColor={accountDarkMode ? "#9d927f" : undefined}
                    style={[styles.input, accountDarkMode && styles.accountDarkInput]}
                  />
                  <TextInput
                    accessibilityLabel="New password"
                    value={newAccountPassword}
                    onChangeText={setNewAccountPassword}
                    autoCapitalize="none"
                    secureTextEntry
                    placeholder="New password"
                    placeholderTextColor={accountDarkMode ? "#9d927f" : undefined}
                    style={[styles.input, accountDarkMode && styles.accountDarkInput]}
                  />
                  <AppButton label="Update password" onPress={submitPasswordChange} />
                  {!!passwordStatus && <Text style={styles.saveStatus}>{passwordStatus}</Text>}
                </View>
              )}
              <View style={[styles.accountSection, accountDarkMode && styles.accountDarkSection]}>
                <Text style={[styles.sectionTitle, accountDarkMode && styles.accountDarkTitle]}>App preferences</Text>
                <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>Choose how Bible Study Tutor reads, looks, and supports your study rhythm.</Text>
                <View style={[styles.accountSubsection, accountDarkMode && styles.accountDarkInsetBox]}>
                  <View style={styles.feedbackHeader}>
                    <Ionicons name="book-outline" size={18} color={accountDarkMode ? "#e9b76a" : colors.coral} />
                    <Text style={[styles.feedbackTitle, accountDarkMode && styles.accountDarkTitle]}>Bible translations</Text>
                  </View>
                  <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>{`Current: ${BIBLE_TRANSLATIONS.find((translation) => translation.id === bibleTranslation)?.name || bibleTranslation.toUpperCase()}`}</Text>
                  <View style={styles.accountOptionGrid}>
                    {BIBLE_TRANSLATIONS.map((translation) => (
                      <Pressable
                        key={translation.id}
                        onPress={() => {
                          setBibleTranslation(translation.id);
                          saveStoredBibleTranslation(translation.id).catch(() => undefined);
                        }}
                        style={[styles.aiOptionCard, styles.accountOptionCard, accountDarkMode && styles.accountDarkOptionCard, bibleTranslation === translation.id && styles.activeAiOptionCard, accountDarkMode && bibleTranslation === translation.id && styles.accountDarkActiveOptionCard]}
                      >
                        <Ionicons name={bibleTranslation === translation.id ? "checkmark-circle" : "book-outline"} size={20} color={accountDarkMode ? "#e9b76a" : colors.oliveDark} />
                        <View style={styles.aiOptionCopy}>
                          <Text style={[styles.aiOptionTitle, accountDarkMode && styles.accountDarkTitle]}>{translation.label}</Text>
                          <Text style={[styles.aiOptionText, accountDarkMode && styles.accountDarkMutedText]}>{translation.name}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                  <View style={[styles.translationLockedBox, accountDarkMode && styles.accountDarkInsetBox]}>
                    <View style={styles.feedbackHeader}>
                      <Ionicons name="heart-outline" size={18} color={accountDarkMode ? "#e9b76a" : colors.coral} />
                      <Text style={[styles.feedbackTitle, accountDarkMode && styles.accountDarkTitle]}>Why these translations?</Text>
                    </View>
                    <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>
                      Bible Study Tutor uses free and legally available Bible texts so the app can remain accessible without charging users or breaching publisher licences. Some modern translations require separate permission or paid licensing.
                    </Text>
                  </View>
                </View>
                {DARK_MODE_ENABLED && (
                  <View style={[styles.accountSubsection, accountDarkMode && styles.accountDarkInsetBox]}>
                    <View style={styles.feedbackHeader}>
                      <Ionicons name="moon-outline" size={18} color={accountDarkMode ? "#e9b76a" : colors.coral} />
                      <Text style={[styles.feedbackTitle, accountDarkMode && styles.accountDarkTitle]}>Appearance</Text>
                    </View>
                    <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>Choose the app display that feels easiest to read.</Text>
                    <View style={styles.accountOptionGrid}>
                      {([
                        ["light", "Light", "Warm study colours", "sunny-outline"],
                        ["dark", "Dark", "Soft charcoal with warm accents", "moon-outline"]
                      ] as const).map(([mode, label, description, icon]) => (
                        <Pressable
                          key={mode}
                          onPress={() => chooseAppearanceMode(mode)}
                          style={[
                            styles.aiOptionCard,
                            styles.accountOptionCard,
                            accountDarkMode && styles.accountDarkOptionCard,
                            appearanceMode === mode && styles.activeAiOptionCard,
                            accountDarkMode && appearanceMode === mode && styles.accountDarkActiveOptionCard
                          ]}
                        >
                          <Ionicons name={appearanceMode === mode ? "checkmark-circle" : icon} size={20} color={accountDarkMode ? "#e9b76a" : colors.oliveDark} />
                          <View style={styles.aiOptionCopy}>
                            <Text style={[styles.aiOptionTitle, accountDarkMode && styles.accountDarkTitle]}>{label}</Text>
                            <Text style={[styles.aiOptionText, accountDarkMode && styles.accountDarkMutedText]}>{description}</Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
                {isAuthenticated && (
                  <View style={[styles.accountSubsection, accountDarkMode && styles.accountDarkInsetBox]}>
                    <View style={styles.feedbackHeader}>
                      <Ionicons name={showCoaching ? "bulb" : "bulb-outline"} size={18} color={accountDarkMode ? "#e9b76a" : colors.coral} />
                      <Text style={[styles.feedbackTitle, accountDarkMode && styles.accountDarkTitle]}>Coaching preference</Text>
                    </View>
                    <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>
                      Free local coaching gives gentle prompts while studying. It does not use paid AI credits, send your notes to an AI provider, or require an AI account.
                    </Text>
                    <Pressable
                      onPress={() => {
                        const nextValue = !showCoaching;
                        setShowCoaching(nextValue);
                        saveStoredTutorCoachingEnabled(nextValue).catch(() => undefined);
                        persistUiPreference("studyCoachingVisible", nextValue);
                      }}
                      style={[styles.aiOptionCard, styles.accountOptionCard, accountDarkMode && styles.accountDarkOptionCard, showCoaching && styles.activeAiOptionCard, accountDarkMode && showCoaching && styles.accountDarkActiveOptionCard]}
                    >
                      <Ionicons name={showCoaching ? "checkmark-circle" : "bulb-outline"} size={20} color={accountDarkMode ? "#e9b76a" : colors.oliveDark} />
                      <View style={styles.aiOptionCopy}>
                        <Text style={[styles.aiOptionTitle, accountDarkMode && styles.accountDarkTitle]}>{showCoaching ? "Coaching is on" : "Coaching is off"}</Text>
                        <Text style={[styles.aiOptionText, accountDarkMode && styles.accountDarkMutedText]}>{showCoaching ? "Tap to hide coaching prompts in Study." : "Tap to show coaching prompts in Study."}</Text>
                      </View>
                    </Pressable>
                  </View>
                )}
              </View>
              <View
                onLayout={(event) => {
                  accountLegalYRef.current = event.nativeEvent.layout.y;
                }}
                style={[styles.accountSection, accountDarkMode && styles.accountDarkSection]}
              >
                <Pressable
                  onPress={() => setRememberedAccountPrivacyOpen((open) => !open)}
                  style={styles.accountCollapsibleHeader}
                  accessibilityRole="button"
                  accessibilityLabel={accountPrivacyOpen ? "Hide privacy and data" : "Show privacy and data"}
                >
                  <View style={styles.accountCollapsibleTitleBlock}>
                    <Text style={[styles.sectionTitle, accountDarkMode && styles.accountDarkTitle]}>Privacy & data</Text>
                    <Text style={[styles.helpIntro, styles.accountCollapsibleSummary, accountDarkMode && styles.accountDarkMutedText]}>
                      Legal details, saved data summary, and account deletion controls.
                    </Text>
                  </View>
                  <Ionicons name={accountPrivacyOpen ? "chevron-up-outline" : "chevron-down-outline"} size={19} color={accountDarkMode ? "#c8bda9" : colors.muted} />
                </Pressable>
                {accountPrivacyOpen && (
                  <View style={styles.accountCollapsibleBody}>
                    {isAuthenticated && (
                      <View style={[styles.accountSubsection, accountDarkMode && styles.accountDarkInsetBox]}>
                        <Text style={[styles.feedbackTitle, accountDarkMode && styles.accountDarkTitle]}>Your saved data</Text>
                        <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>
                          A simple summary of what Bible Study Tutor is currently keeping for you. This does not show private note content.
                        </Text>
                        <View style={[styles.savedDataGrid, phoneLayout && styles.phoneSavedDataGrid]}>
                          {savedDataItems.map((item) => (
                            <View key={item.label} style={[styles.savedDataItem, phoneLayout && styles.phoneSavedDataItem, accountDarkMode && styles.accountDarkSavedDataItem]}>
                              <View style={[styles.savedDataIcon, accountDarkMode && styles.accountDarkSavedDataIcon]}>
                                <Ionicons name={item.icon as any} size={17} color={accountDarkMode ? "#e9b76a" : colors.oliveDark} />
                              </View>
                              <View style={styles.savedDataCopy}>
                                <Text style={[styles.savedDataValue, accountDarkMode && styles.accountDarkTitle]}>{item.value}</Text>
                                <Text style={[styles.savedDataLabel, accountDarkMode && styles.accountDarkMutedText]}>{item.label}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                        <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>
                          Account-linked studies, drafts, encouragements, memory verses, feedback, and usage events are removed if an approved deletion request is completed. Some Bible reader preferences and bookmarks may live on this device.
                        </Text>
                      </View>
                    )}
                    <View style={[styles.accountSubsection, accountDarkMode && styles.accountDarkInsetBox]}>
                      <Text style={[styles.feedbackTitle, accountDarkMode && styles.accountDarkTitle]}>Legal</Text>
                      <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>Privacy and terms for Bible Study Tutor. These explain how the app stores data, supports accounts, and sets expectations for safe use.</Text>
                      <Suspense fallback={<Text>Loading document…</Text>}><LegalDocument
                        title="Privacy Policy"
                        icon="shield-checkmark-outline"
                        open={openLegalSection === "privacy"}
                        kind="privacy"
                        onToggle={() => setRememberedOpenLegalSection((current) => (current === "privacy" ? "" : "privacy"))}
                        darkMode={accountDarkMode}
                      /></Suspense>
                      <Suspense fallback={<Text>Loading document…</Text>}><LegalDocument
                        title="Terms of Service"
                        icon="document-text-outline"
                        open={openLegalSection === "terms"}
                        kind="terms"
                        onToggle={() => setRememberedOpenLegalSection((current) => (current === "terms" ? "" : "terms"))}
                        darkMode={accountDarkMode}
                      /></Suspense>
                    </View>
                    {isAuthenticated && (
                      <View style={[styles.accountSubsection, accountDarkMode && styles.accountDarkInsetBox]}>
                        <Text style={[styles.feedbackTitle, accountDarkMode && styles.accountDarkTitle]}>Account deletion</Text>
                        <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>
                          You can request deletion of your saved app data. For safety, requests are reviewed by an administrator before anything is removed.
                        </Text>
                        {accountDeletionRequest ? (
                          <View style={[styles.deletionRequestBox, accountDarkMode && styles.accountDarkInsetBox]}>
                            <View style={styles.feedbackHeader}>
                              <Ionicons name="time-outline" size={18} color={accountDarkMode ? "#e9b76a" : colors.coral} />
                              <Text style={[styles.feedbackTitle, accountDarkMode && styles.accountDarkTitle]}>Deletion request pending</Text>
                            </View>
                            <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>{`Requested ${formatAdminDate(accountDeletionRequest.requestedAt)}. You can cancel this request before it is approved.`}</Text>
                            <AppButton label="Cancel request" variant="secondary" onPress={cancelOwnAccountDeletionRequest} />
                          </View>
                        ) : (
                          <View style={[styles.deletionRequestBox, accountDarkMode && styles.accountDarkInsetBox]}>
                            <View style={styles.feedbackHeader}>
                              <Ionicons name="warning-outline" size={18} color={accountDarkMode ? "#e9b76a" : colors.coral} />
                              <Text style={[styles.feedbackTitle, accountDarkMode && styles.accountDarkTitle]}>Before requesting deletion</Text>
                            </View>
                            <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>Approved deletion removes your profile, studies, drafts, encouragements, memory verses, feedback, usage events, and sign-in records where connected.</Text>
                            <AppButton
                              label={deletionConfirmArmed ? "Request deletion" : "Request account deletion"}
                              variant="secondary"
                              onPress={submitAccountDeletionRequest}
                            />
                          </View>
                        )}
                        {!!deletionStatus && <Text style={styles.saveStatus}>{deletionStatus}</Text>}
                      </View>
                    )}
                  </View>
                )}
              </View>
            </Card>
            {isAuthenticated && (
              <Card style={[styles.coachCard, compactLayout && styles.fluidCard, accountDarkMode && styles.accountDarkMainCard]}>
                <View style={[styles.accountStatusBox, accountDarkMode && styles.accountDarkSection]}>
                  <View style={styles.feedbackHeader}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={accountDarkMode ? "#e9b76a" : colors.coral} />
                    <Text style={[styles.feedbackTitle, accountDarkMode && styles.accountDarkTitle]}>Account health</Text>
                  </View>
                  <View style={styles.accountHealthList}>
                    {[
                      {
                        icon: profile?.authProvider === "google" ? "logo-google" : profile?.authProvider === "apple" ? "logo-apple" : "person-circle-outline",
                        title: `Signed in with ${accountProviderLabel}`,
                        body: `${accountIdentityLabel} is connected for cross-device sync.`
                      },
                      {
                        icon: "cloud-done-outline",
                        title: backendStatusLabel,
                        body: backendStatusDetail
                      },
                      {
                        icon: "lock-closed-outline",
                        title: "Private by design",
                        body: "Free coaching stays local. Study notes are not sent to an AI provider or paid API service."
                      }
                    ].map((item) => (
                      <View key={item.title} style={[styles.accountHealthItem, accountDarkMode && styles.accountDarkInsetBox]}>
                        <Ionicons name={item.icon as any} size={17} color={accountDarkMode ? "#e9b76a" : colors.coral} />
                        <View style={styles.helpTabCopy}>
                          <Text style={[styles.helpFaqQuestion, accountDarkMode && styles.accountDarkTitle]}>{item.title}</Text>
                          <Text style={[styles.helpFaqAnswer, accountDarkMode && styles.accountDarkMutedText]}>{item.body}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={[styles.accountStatusBox, accountDarkMode && styles.accountDarkSection]}>
                  <View style={styles.feedbackHeader}>
                    <Ionicons name="navigate-outline" size={18} color={accountDarkMode ? "#e9b76a" : colors.coral} />
                    <Text style={[styles.feedbackTitle, accountDarkMode && styles.accountDarkTitle]}>Quick links</Text>
                  </View>
                  <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>Jump to related areas without crowding the main account form.</Text>
                  <ResumeButton label="Open community" icon="people-outline" onPress={() => setTab("accountability")} style={accountDarkMode && styles.homeDarkResumeButton} labelStyle={accountDarkMode && styles.homeDarkResumeButtonText} iconColor={accountDarkMode ? "#e9b76a" : undefined} />
                  <ResumeButton label="Open journal" icon="journal-outline" onPress={() => setTab("journal")} style={accountDarkMode && styles.homeDarkResumeButton} labelStyle={accountDarkMode && styles.homeDarkResumeButtonText} iconColor={accountDarkMode ? "#e9b76a" : undefined} />
                </View>
                {adminStats && (
                  <View style={[styles.accountStatusBox, accountDarkMode && styles.accountDarkSection]}>
                    <View style={styles.feedbackHeader}>
                      <Ionicons name="analytics-outline" size={18} color={accountDarkMode ? "#e9b76a" : colors.coral} />
                      <Text style={[styles.feedbackTitle, accountDarkMode && styles.accountDarkTitle]}>Admin insights</Text>
                    </View>
                    <View style={[styles.adminMetricGrid, styles.accountAdminMetricGrid]}>
                      <Metric value={adminStats.totals.activeProfiles7d} label="active 7d" labelLines={2} compact style={[styles.accountAdminMetricTile, accountDarkMode && styles.accountDarkInsetBox]} valueStyle={accountDarkMode && styles.accountDarkTitle} labelStyle={[styles.accountAdminMetricLabel, accountDarkMode && styles.accountDarkMutedText]} />
                      <Metric value={adminStats.totals.signedInProfiles} label="signed in" labelLines={2} compact style={[styles.accountAdminMetricTile, accountDarkMode && styles.accountDarkInsetBox]} valueStyle={accountDarkMode && styles.accountDarkTitle} labelStyle={[styles.accountAdminMetricLabel, accountDarkMode && styles.accountDarkMutedText]} />
                      <Metric value={adminStats.totals.profilesWithStudies} label="with studies" labelLines={2} compact style={[styles.accountAdminMetricTile, accountDarkMode && styles.accountDarkInsetBox]} valueStyle={accountDarkMode && styles.accountDarkTitle} labelStyle={[styles.accountAdminMetricLabel, accountDarkMode && styles.accountDarkMutedText]} />
                      <Metric value={adminStats.totals.newFeedback} label="new feedback" labelLines={2} compact style={[styles.accountAdminMetricTile, accountDarkMode && styles.accountDarkInsetBox]} valueStyle={accountDarkMode && styles.accountDarkTitle} labelStyle={[styles.accountAdminMetricLabel, accountDarkMode && styles.accountDarkMutedText]} />
                      <Metric value={adminStats.totals.appShares || 0} label="app shares" labelLines={2} compact style={[styles.accountAdminMetricTile, accountDarkMode && styles.accountDarkInsetBox]} valueStyle={accountDarkMode && styles.accountDarkTitle} labelStyle={[styles.accountAdminMetricLabel, accountDarkMode && styles.accountDarkMutedText]} />
                      <Metric value={adminStats.totals.pendingDeletionRequests} label="deletion requests" labelLines={2} compact style={[styles.accountAdminMetricTile, accountDarkMode && styles.accountDarkInsetBox]} valueStyle={accountDarkMode && styles.accountDarkTitle} labelStyle={[styles.accountAdminMetricLabel, accountDarkMode && styles.accountDarkMutedText]} />
                    </View>
                    <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>
                      Raw profiles: {adminStats.totals.profiles} total · {adminStats.totals.localProfiles} local/test · {adminStats.totals.events} recent events tracked.
                    </Text>
                    <ResumeButton label="Open full insights" icon="analytics-outline" onPress={() => setTab("admin")} style={accountDarkMode && styles.homeDarkResumeButton} labelStyle={accountDarkMode && styles.homeDarkResumeButtonText} iconColor={accountDarkMode ? "#e9b76a" : undefined} />
                  </View>
                )}
              </Card>
            )}
          </View>
        )}

        {tab === "admin" && (
          <TabErrorBoundary
            resetKey={`admin-${selectedAdminProfileId || ""}`}
            fallback={<Card style={[styles.mainCard, adminDarkMode && styles.accountDarkMainCard]}><Text style={[styles.cardTitle, adminDarkMode && styles.accountDarkTitle]}>Admin could not load</Text><Text style={[styles.muted, adminDarkMode && styles.accountDarkMutedText]}>Try another tab, then return to Admin.</Text></Card>}
          >
            <Suspense fallback={<Card style={[styles.mainCard, adminDarkMode && styles.accountDarkMainCard]}><Text style={[styles.body, adminDarkMode && styles.accountDarkText]}>Loading admin insights...</Text></Card>}>
              <LazyAdminDashboard
              adminStats={adminStats}
              adminUsers={Array.isArray(adminUsers) ? adminUsers : []}
              adminUsersCanLoadMore={adminUsersStatus === "CanLoadMore"}
              adminUserDetail={adminUserDetail}
              adminAuditLog={Array.isArray(adminAuditLog) ? adminAuditLog : []}
              adminMaintenanceStatus={adminMaintenanceStatus}
              pendingConfirmId={pendingAdminDeletionRequestId}
              selectedProfileId={selectedAdminProfileId}
              selectedRegion={selectedAdminRegion}
              compactLayout={compactLayout}
              phoneLayout={phoneLayout}
              darkMode={adminDarkMode}
              styles={styles}
              MetricComponent={Metric}
              onApproveDeletion={approveAdminDeletionRequest}
              onCancelDeletion={cancelAdminDeletionRequest}
              onCleanupLocalProfiles={cleanupEmptyLocalProfiles}
              onMarkFeedbackStatus={markFeedbackStatus}
              onLoadMoreAdminUsers={() => loadMoreAdminUsers(15)}
              onOpenAccount={() => setTab("account")}
              onSelectProfile={setSelectedAdminProfileId}
              onSelectRegion={setSelectedAdminRegion}
              onMarkSecurityReviewed={markAdminProfileSecurityReviewed}
              onSetProfileSuspension={setAdminProfileSuspension}
              />
            </Suspense>
          </TabErrorBoundary>
        )}

        {tab === "journal" && (
          <TabErrorBoundary
            resetKey={`journal-${journalView}-${journalFilter}`}
            fallback={<Card style={[styles.journalCard, journalDarkMode && styles.accountDarkMainCard]}><Text style={[styles.cardTitle, journalDarkMode && styles.accountDarkTitle]}>Journal could not load</Text><Text style={[styles.muted, journalDarkMode && styles.accountDarkMutedText]}>Try another tab, then return to Journal.</Text></Card>}
          >
            <Suspense fallback={<Card style={[styles.journalCard, journalDarkMode && styles.accountDarkMainCard]}><Text style={[styles.muted, journalDarkMode && styles.accountDarkMutedText]}>Loading journal...</Text></Card>}>
              <LazyJournalTab
              styles={styles}
              journalDarkMode={journalDarkMode}
              phoneLayout={phoneLayout}
              firstName={firstName}
              journalSearch={journalSearch}
              setJournalSearch={setJournalSearch}
              journalView={journalView}
              setJournalView={setRememberedJournalView}
              journalDateFilterKey={journalDateFilterKey}
              setJournalDateFilterKey={setJournalDateFilterKey}
              journalFiltersOpen={journalFiltersOpen}
              setJournalFiltersOpen={setRememberedJournalFiltersOpen}
              activeJournalFilterLabel={activeJournalFilterLabel}
              journalFilter={journalFilter}
              setJournalFilter={setRememberedJournalFilter}
              journalFilterOptions={journalFilterOptions}
              totalSavedHighlightCount={totalSavedHighlightCount}
              buildJournalGuideText={buildJournalGuideText}
              journalCalendarMonth={journalCalendarMonth}
              journalCalendarItems={journalCalendarItems}
              setJournalCalendarMonth={setJournalCalendarMonth}
              addMonths={addMonths}
              journalScriptureBookSections={journalScriptureBookSections}
              expandedJournalScriptureBook={expandedJournalScriptureBook}
              setExpandedJournalScriptureBook={setRememberedExpandedJournalScriptureBook}
              selectedJournalScriptureBook={selectedJournalScriptureBook}
              selectedJournalScriptureChapter={selectedJournalScriptureChapter}
              setSelectedJournalScripture={setRememberedSelectedJournalScripture}
              formatJournalDateKey={formatJournalDateKey}
              selectedJournalDateEntryCount={selectedJournalDateEntryCount}
              selectedJournalScriptureEntryCount={selectedJournalScriptureEntryCount}
              dueStudyReviewCount={dueStudyReviewCount}
              reflectionStatus={reflectionStatus}
              journalStatus={journalStatus}
              showDraftsSection={showDraftsSection}
              visibleDrafts={visibleDrafts}
              isJournalEntryExpanded={isJournalEntryExpanded}
              toggleJournalEntryExpanded={toggleJournalEntryExpanded}
              formatJournalCreatedDate={formatJournalCreatedDate}
              ResumeButtonComponent={ResumeButton}
              resumeDraft={resumeDraft}
              pendingArchiveDraftId={pendingArchiveDraftId}
              deleteDraft={deleteDraft}
              setPendingArchiveDraftId={setPendingArchiveDraftId}
              showHighlightsSection={showHighlightsSection}
              highlightJournalEntries={highlightJournalEntries}
              activeReflectionEntryId={activeReflectionEntryId}
              setActiveReflectionEntryId={setActiveReflectionEntryId}
              reflectionInsight={reflectionInsight}
              setReflectionInsight={setReflectionInsight}
              reflectionPrayer={reflectionPrayer}
              setReflectionPrayer={setReflectionPrayer}
              reflectionNextStep={reflectionNextStep}
              setReflectionNextStep={setReflectionNextStep}
              isSavingReflection={isSavingReflection}
              saveHighlightReflection={saveHighlightReflection}
              startHighlightReflection={startHighlightReflection}
              resumeSession={resumeSession}
              journalEntries={journalEntries}
              groupedJournalEntries={groupedJournalEntries}
              pinnedEntryIds={pinnedEntryIds}
              isMemoryMeditationEntry={isMemoryMeditationEntry}
              editingJournalEntryId={editingJournalEntryId}
              activeStudyReviewId={activeStudyReviewId}
              reviewScheduleStudyId={reviewScheduleStudyId}
              pendingRemoveStudyReviewId={pendingRemoveStudyReviewId}
              isHighlightReflection={isHighlightReflection}
              getJournalEntryIcon={getJournalEntryIcon}
              togglePinnedJournalEntry={togglePinnedJournalEntry}
              editReflectionPassage={editReflectionPassage}
              setEditReflectionPassage={setEditReflectionPassage}
              editReflectionHighlights={editReflectionHighlights}
              setEditReflectionHighlights={setEditReflectionHighlights}
              editReflectionInsight={editReflectionInsight}
              setEditReflectionInsight={setEditReflectionInsight}
              editReflectionPrayer={editReflectionPrayer}
              setEditReflectionPrayer={setEditReflectionPrayer}
              editReflectionNextStep={editReflectionNextStep}
              setEditReflectionNextStep={setEditReflectionNextStep}
              editJournalNote={editJournalNote}
              setEditJournalNote={setEditJournalNote}
              isStudyReviewDue={isStudyReviewDue}
              formatReviewDate={formatReviewDate}
              studyReviewNote={studyReviewNote}
              setStudyReviewNote={setStudyReviewNote}
              completeStudyReview={completeStudyReview}
              studyReviewStatus={studyReviewStatus}
              setStudyReviewStatus={setStudyReviewStatus}
              isSavingJournalEdit={isSavingJournalEdit}
              saveJournalEntryEdit={saveJournalEntryEdit}
              cancelEditJournalEntry={cancelEditJournalEntry}
              setActiveStudyReviewId={setActiveStudyReviewId}
              setReviewScheduleStudyId={setReviewScheduleStudyId}
              setPendingRemoveStudyReviewId={setPendingRemoveStudyReviewId}
              startEditJournalEntry={startEditJournalEntry}
              pendingDeleteJournalEntryId={pendingDeleteJournalEntryId}
              setPendingDeleteJournalEntryId={setPendingDeleteJournalEntryId}
              journalDeleteStatus={journalDeleteStatus}
              setJournalDeleteStatus={setJournalDeleteStatus}
              isDeletingJournalEntry={isDeletingJournalEntry}
              deleteJournalEntry={deleteJournalEntry}
              STUDY_REVIEW_OPTIONS={STUDY_REVIEW_OPTIONS}
              scheduleStudyReview={scheduleStudyReview}
              removeStudyReview={removeStudyReview}
              customStudyReviewDays={customStudyReviewDays}
              setCustomStudyReviewDays={setCustomStudyReviewDays}
              showJournalEmptyState={showJournalEmptyState}
              journalSearchTerm={journalSearchTerm}
              friendlyName={friendlyName}
              setTab={setTab}
              />
            </Suspense>
          </TabErrorBoundary>
        )}

        {tab === "help" && (
          <TabErrorBoundary
            resetKey={`help-${expandedHelpGuideTitle || ""}`}
            fallback={<Card style={[styles.helpSectionCard, helpDarkMode && styles.accountDarkMainCard]}><Text style={[styles.cardTitle, helpDarkMode && styles.accountDarkTitle]}>Help could not load</Text><Text style={[styles.muted, helpDarkMode && styles.accountDarkMutedText]}>Try another tab, then return to Help.</Text></Card>}
          >
            <Suspense fallback={<Card style={[styles.helpSectionCard, helpDarkMode && styles.accountDarkMainCard]}><Text style={[styles.muted, helpDarkMode && styles.accountDarkMutedText]}>Loading help...</Text></Card>}>
              <LazyHelpTab
              styles={styles}
              helpDarkMode={helpDarkMode}
              phoneLayout={phoneLayout}
              firstName={firstName}
              setTab={setTab}
              openBibleFromPublicSource={openBibleFromPublicSource}
              openStudyFromPublicSource={openStudyFromPublicSource}
              shareAppLink={shareAppLink}
              copyAppLink={copyAppLink}
              appShareStatus={appShareStatus}
              appShareQrDarkUri={APP_SHARE_QR_DARK_URI}
              appShareQrUri={APP_SHARE_QR_URI}
              ResumeButtonComponent={ResumeButton}
              expandedHelpGuideTitle={expandedHelpGuideTitle}
              setExpandedHelpGuideTitle={setExpandedHelpGuideTitle}
              feedbackCategory={feedbackCategory}
              setFeedbackCategory={setFeedbackCategory}
              feedbackMessage={feedbackMessage}
              setFeedbackMessage={setFeedbackMessage}
              submitUserFeedback={submitUserFeedback}
              feedbackStatus={feedbackStatus}
              />
            </Suspense>
          </TabErrorBoundary>
        )}
      </ScrollView>
      {showMobileReaderSelectionDock && (
        <View style={[styles.mobileReaderSelectionDock, bibleDarkMode && styles.bibleDarkMobileSelectionDock]}>
          <Text numberOfLines={1} style={[styles.mobileReaderSelectionText, bibleDarkMode && styles.accountDarkTitle]}>{readerMemoryStatus || readerStudyReference}</Text>
          <View style={styles.mobileReaderSelectionActions}>
            <Pressable onPress={openReaderChapterInStudy} style={[styles.mobileReaderSelectionButton, styles.primaryMobileReaderSelectionButton]}>
              <Ionicons name="book-outline" size={15} color="white" />
              <Text style={[styles.mobileReaderSelectionButtonText, styles.primaryMobileReaderSelectionButtonText]}>Study</Text>
            </Pressable>
            <Pressable
              onPress={() => saveBibleBookmark(selectedReaderVerses)}
              style={[styles.mobileReaderSelectionButton, bibleDarkMode && styles.homeDarkResumeButton, currentSelectionBookmarked && styles.activeReaderBookmarkButton]}
            >
              <Ionicons name={currentSelectionBookmarked ? "bookmark" : "bookmark-outline"} size={15} color={currentSelectionBookmarked ? "white" : (bibleDarkMode ? "#e9b76a" : colors.oliveDark)} />
              <Text style={[styles.mobileReaderSelectionButtonText, bibleDarkMode && styles.homeDarkResumeButtonText, currentSelectionBookmarked && styles.activeReaderReadButtonText]}>Save</Text>
            </Pressable>
            <Pressable onPress={openSelectedReaderNote} style={[styles.mobileReaderSelectionButton, bibleDarkMode && styles.homeDarkResumeButton, currentSelectionBookmark?.note?.trim() && styles.activeBookmarkNoteButton]}>
              <Ionicons name={currentSelectionBookmark?.note?.trim() ? "document-text" : "document-text-outline"} size={15} color={currentSelectionBookmark?.note?.trim() ? "white" : (bibleDarkMode ? "#e9b76a" : colors.oliveDark)} />
              <Text style={[styles.mobileReaderSelectionButtonText, bibleDarkMode && styles.homeDarkResumeButtonText, currentSelectionBookmark?.note?.trim() && styles.primaryMobileReaderSelectionButtonText]}>Note</Text>
            </Pressable>
            <Pressable onPress={openReaderWorksheetOptions} style={[styles.mobileReaderSelectionButton, bibleDarkMode && styles.homeDarkResumeButton]}>
              <Ionicons name="print-outline" size={15} color={bibleDarkMode ? "#e9b76a" : colors.oliveDark} />
              <Text style={[styles.mobileReaderSelectionButtonText, bibleDarkMode && styles.homeDarkResumeButtonText]}>Print</Text>
            </Pressable>
            <Pressable onPress={saveSelectedReaderVersesToMemory} style={[styles.mobileReaderSelectionButton, styles.mobileReaderMemoryButton, selectedReaderVersesAlreadyInMemory && styles.savedMemoryButton]}>
              <Ionicons name="sparkles-outline" size={15} color="white" />
              <Text style={[styles.mobileReaderSelectionButtonText, styles.primaryMobileReaderSelectionButtonText]}>
                {selectedReaderVersesAlreadyInMemory ? "Saved" : "Memory"}
              </Text>
            </Pressable>
            <Pressable
              onPress={clearReaderSelection}
              style={[styles.mobileReaderSelectionIconButton, bibleDarkMode && styles.homeDarkIconBubble]}
            >
              <Ionicons name="close-outline" size={17} color={bibleDarkMode ? "#c8bda9" : colors.muted} />
            </Pressable>
          </View>
          {currentSelectionBookmark && activeBookmarkNoteId === currentSelectionBookmark.id && (
            <View style={[styles.mobileReaderNoteEditor, bibleDarkMode && styles.bibleDarkMobileNoteEditor]}>
              <TextInput
                multiline
                value={bookmarkNoteDraft}
                onChangeText={setBookmarkNoteDraft}
                placeholder="Add a note for these verses"
                placeholderTextColor={bibleDarkMode ? "#8f8678" : undefined}
                style={[styles.input, styles.readerBookmarkNoteInput, styles.mobileReaderBookmarkNoteInput, bibleDarkMode && styles.accountDarkInput]}
              />
              <View style={styles.readerBookmarkNoteActions}>
                <Pressable onPress={() => saveBookmarkNote(currentSelectionBookmark.id)} style={[styles.inlineReaderBookmarkButton, bibleDarkMode && styles.homeDarkResumeButton]}>
                  <Text style={[styles.inlineReaderBookmarkText, bibleDarkMode && styles.homeDarkResumeButtonText]}>Save note</Text>
                </Pressable>
                {!!currentSelectionBookmark.note?.trim() && (
                  <Pressable onPress={() => deleteBookmarkNote(currentSelectionBookmark.id)} style={[styles.clearMarkupButton, bibleDarkMode && styles.homeDarkResumeButton]}>
                    <Text style={[styles.clearMarkupText, bibleDarkMode && styles.homeDarkResumeButtonText]}>Delete note</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => {
                    setActiveBookmarkNoteId("");
                    setBookmarkNoteDraft("");
                    dismissMobileInputFocus();
                  }}
                  style={[styles.clearMarkupButton, bibleDarkMode && styles.homeDarkResumeButton]}
                >
                  <Text style={[styles.clearMarkupText, bibleDarkMode && styles.homeDarkResumeButtonText]}>Close</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}
      {activeMemoryMeditationVerse && (
        <View {...modalAccessibilityProps("Scripture meditation")} style={styles.printOptionsOverlay}>
          <Pressable style={[styles.printOptionsScrim, styles.memoryMeditationScrim, accountDarkMode && styles.printDarkOptionsScrim]} onPress={closeMemoryMeditation} />
          <View style={[styles.memoryMeditationFocusCard, phoneLayout && styles.phoneMemoryMeditationFocusCard, accountDarkMode && styles.accountDarkMainCard]}>
            <View style={styles.printOptionsHeader}>
              <View style={styles.printOptionsTitleBlock}>
                <Text style={[styles.printOptionsTitle, accountDarkMode && styles.accountDarkTitle]}>Meditate on Scripture</Text>
                <Text style={[styles.printOptionsSubtitle, accountDarkMode && styles.accountDarkMutedText]}>
                  {activeMemoryMeditationVerse.reference} · {shortBibleTranslationName(activeMemoryMeditationVerse.translationName)}
                </Text>
              </View>
              <Pressable onPress={closeMemoryMeditation} style={styles.markupCloseButton} accessibilityLabel="Close meditation">
                <Ionicons name="close-outline" size={21} color={accountDarkMode ? "#c8bda9" : colors.muted} />
              </Pressable>
            </View>
            <ScrollView style={styles.memoryMeditationFocusScroll} contentContainerStyle={styles.memoryMeditationFocusContent} keyboardShouldPersistTaps="handled">
              <Text style={[styles.memoryMeditationVerse, styles.memoryMeditationFocusVerse, accountDarkMode && styles.memoryDarkPracticeText]}>{activeMemoryMeditationVerse.verseText}</Text>
              <View style={[styles.memoryStepRow, styles.memoryMeditationFocusSteps, accountDarkMode && styles.accountDarkSegmentedRow]}>
                {["Notice", "Reflect", "Pray", "Carry"].map((label, index) => (
                  <Pressable
                    key={label}
                    onPress={() => setMemoryMeditationStep(index)}
                    style={[styles.memoryMeditationStepButton, memoryMeditationStep === index && styles.activeMemoryStepButton]}
                  >
                    <Text style={[styles.memoryStepText, accountDarkMode && styles.accountDarkMutedText, memoryMeditationStep === index && styles.activeMemoryStepText]}>{phoneLayout ? index + 1 : label}</Text>
                  </Pressable>
                ))}
              </View>
              {memoryMeditationStep === 0 && (
                <View style={styles.memoryMeditationPromptBox}>
                  <Text style={[styles.bodyStrong, accountDarkMode && styles.accountDarkText]}>What word or phrase stands out today?</Text>
                  <TextInput
                    value={memoryMeditationPhrase}
                    onChangeText={setMemoryMeditationPhrase}
                    placeholder="A phrase I am holding..."
                    placeholderTextColor={accountDarkMode ? "#8f8678" : colors.muted}
                    style={[styles.input, styles.memoryMeditationInput, phoneLayout && styles.phoneMemoryMeditationInput, accountDarkMode && styles.accountDarkInput]}
                  />
                </View>
              )}
              {memoryMeditationStep === 1 && (
                <View style={styles.memoryMeditationPromptBox}>
                  <Text style={[styles.bodyStrong, accountDarkMode && styles.accountDarkText]}>What does this show you about God, or invite you to trust or obey?</Text>
                  <TextInput
                    value={memoryMeditationReflection}
                    onChangeText={setMemoryMeditationReflection}
                    placeholder="This verse is showing me..."
                    placeholderTextColor={accountDarkMode ? "#8f8678" : colors.muted}
                    multiline
                    style={[styles.input, styles.memoryMeditationTextarea, phoneLayout && styles.phoneMemoryMeditationInput, accountDarkMode && styles.accountDarkInput]}
                  />
                </View>
              )}
              {memoryMeditationStep === 2 && (
                <View style={styles.memoryMeditationPromptBox}>
                  <Text style={[styles.bodyStrong, accountDarkMode && styles.accountDarkText]}>Turn this verse into a short prayer.</Text>
                  <TextInput
                    value={memoryMeditationPrayer}
                    onChangeText={setMemoryMeditationPrayer}
                    placeholder="Lord, help me..."
                    placeholderTextColor={accountDarkMode ? "#8f8678" : colors.muted}
                    multiline
                    style={[styles.input, styles.memoryMeditationTextarea, phoneLayout && styles.phoneMemoryMeditationInput, accountDarkMode && styles.accountDarkInput]}
                  />
                </View>
              )}
              {memoryMeditationStep === 3 && (
                <View style={styles.memoryMeditationPromptBox}>
                  <Text style={[styles.bodyStrong, accountDarkMode && styles.accountDarkText]}>What do you want to carry with you today?</Text>
                  <TextInput
                    value={memoryMeditationCarry}
                    onChangeText={setMemoryMeditationCarry}
                    placeholder="Today I want to carry..."
                    placeholderTextColor={accountDarkMode ? "#8f8678" : colors.muted}
                    multiline
                    style={[styles.input, styles.memoryMeditationTextarea, phoneLayout && styles.phoneMemoryMeditationInput, accountDarkMode && styles.accountDarkInput]}
                  />
                </View>
              )}
            </ScrollView>
            <View style={styles.printOptionsActions}>
              {memoryMeditationStep > 0 && (
                <Pressable onPress={() => setMemoryMeditationStep((step) => Math.max(0, step - 1))} style={[styles.printOptionsCancelButton, accountDarkMode && styles.printDarkCancelButton]}>
                  <Text style={[styles.printOptionsCancelText, accountDarkMode && styles.homeDarkResumeButtonText]}>Back</Text>
                </Pressable>
              )}
              {memoryMeditationStep < 3 ? (
                <ResumeButton label="Next" icon="arrow-forward-outline" onPress={() => setMemoryMeditationStep((step) => Math.min(3, step + 1))} variant="primary" style={phoneLayout && styles.phonePrintOpenButton} labelStyle={phoneLayout && styles.phonePrintOpenButtonText} />
              ) : (
                <ResumeButton label="Save meditation" icon="journal-outline" onPress={() => saveMemoryMeditation(activeMemoryMeditationVerse)} variant="primary" style={phoneLayout && styles.phonePrintOpenButton} labelStyle={phoneLayout && styles.phonePrintOpenButtonText} />
              )}
            </View>
          </View>
        </View>
      )}
      {memoryCollectionPrompt && (
        <View {...modalAccessibilityProps("Memory collection")} style={styles.printOptionsOverlay}>
          <Pressable
            style={[styles.printOptionsScrim, accountDarkMode && styles.printDarkOptionsScrim]}
            onPress={() => !memoryCollectionPromptSaving && setMemoryCollectionPrompt(null)}
          />
          <View
            style={[
              styles.printOptionsCard,
              styles.memoryCollectionPromptCard,
              phoneLayout && styles.phonePrintOptionsCard,
              accountDarkMode && styles.accountDarkMainCard
            ]}
          >
            <View style={styles.printOptionsHeader}>
              <View style={styles.printOptionsTitleBlock}>
                <Text style={[styles.printOptionsTitle, accountDarkMode && styles.accountDarkTitle]}>Save as Memory collection?</Text>
                <Text style={[styles.printOptionsSubtitle, accountDarkMode && styles.accountDarkMutedText]}>
                  {memoryCollectionPrompt.reference} is a longer selection. Split it into smaller sections so it is easier to review.
                </Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close memory collection" disabled={memoryCollectionPromptSaving} onPress={() => setMemoryCollectionPrompt(null)} style={styles.markupCloseButton}>
                <Ionicons name="close-outline" size={19} color={accountDarkMode ? "#c8bda9" : colors.muted} />
              </Pressable>
            </View>

            <View style={styles.printOptionGroup}>
              <Text style={[styles.printOptionLabel, accountDarkMode && styles.studyDarkAccentText]}>Collection name</Text>
              <TextInput
                value={memoryCollectionPrompt.collectionName}
                onChangeText={(collectionName) => setMemoryCollectionPrompt((current) => current ? { ...current, collectionName } : current)}
                placeholder="Romans 1"
                placeholderTextColor={accountDarkMode ? "#8f8678" : colors.muted}
                style={[styles.input, accountDarkMode && styles.accountDarkInput]}
              />
            </View>

            <View style={[styles.memoryCollectionPromptSummary, accountDarkMode && styles.memoryDarkSoftPanel]}>
              <Ionicons name="albums-outline" size={20} color={accountDarkMode ? "#e9b76a" : colors.coral} />
              <Text style={[styles.memoryCollectionPromptText, accountDarkMode && styles.accountDarkMutedText]}>
                This will create {splitMemorySelectionIntoSections(memoryCollectionPrompt.verses).length} smaller memory section{splitMemorySelectionIntoSections(memoryCollectionPrompt.verses).length === 1 ? "" : "s"} inside one collection.
              </Text>
            </View>

            <View style={styles.printOptionsActions}>
              <Pressable
                disabled={memoryCollectionPromptSaving}
                onPress={() => setMemoryCollectionPrompt(null)}
                style={[styles.printOptionsCancelButton, accountDarkMode && styles.printDarkCancelButton]}
              >
                <Text style={[styles.printOptionsCancelText, accountDarkMode && styles.homeDarkResumeButtonText]}>Cancel</Text>
              </Pressable>
              {canSaveMemorySelectionAsSingle(memoryCollectionPrompt.verses) && (
                <Pressable
                  disabled={memoryCollectionPromptSaving}
                  onPress={() => saveMemorySelectionAsOne(memoryCollectionPrompt)}
                  style={[styles.printOptionsCancelButton, accountDarkMode && styles.printDarkCancelButton]}
                >
                  <Text style={[styles.printOptionsCancelText, accountDarkMode && styles.homeDarkResumeButtonText]}>Save as one</Text>
                </Pressable>
              )}
              <Pressable
                disabled={memoryCollectionPromptSaving}
                onPress={() => saveMemorySelectionAsCollection(memoryCollectionPrompt)}
                style={[styles.resumeButton, styles.primaryResumeButton, phoneLayout && styles.phonePrintOpenButton, memoryCollectionPromptSaving && styles.disabledButton]}
              >
                <Ionicons name="folder-open-outline" size={17} color="white" />
                <Text style={[styles.primaryResumeButtonText, phoneLayout && styles.phonePrintOpenButtonText]}>
                  {memoryCollectionPromptSaving ? "Saving..." : "Split into collection"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
      {memoryBookCollectionOpen && (
        <View {...modalAccessibilityProps("Bible book collection")} style={styles.printOptionsOverlay}>
          <Pressable
            style={[styles.printOptionsScrim, accountDarkMode && styles.printDarkOptionsScrim]}
            onPress={() => !memoryBookCollectionSaving && setMemoryBookCollectionOpen(false)}
          />
          <View
            style={[
              styles.printOptionsCard,
              styles.memoryBookCollectionCard,
              phoneLayout && styles.phonePrintOptionsCard,
              accountDarkMode && styles.accountDarkMainCard
            ]}
          >
            <View style={styles.printOptionsHeader}>
              <View style={styles.printOptionsTitleBlock}>
                <Text style={[styles.printOptionsTitle, accountDarkMode && styles.accountDarkTitle]}>Create Memory collection</Text>
                <Text style={[styles.printOptionsSubtitle, accountDarkMode && styles.accountDarkMutedText]}>
                  Choose a Bible book or chapter range. Each chapter becomes one saved Memory section in the collection.
                </Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close Bible book collection" disabled={memoryBookCollectionSaving} onPress={() => setMemoryBookCollectionOpen(false)} style={styles.markupCloseButton}>
                <Ionicons name="close-outline" size={19} color={accountDarkMode ? "#c8bda9" : colors.muted} />
              </Pressable>
            </View>

            <ScrollView style={styles.memoryBookCollectionScroll} contentContainerStyle={styles.memoryBookCollectionContent} keyboardShouldPersistTaps="handled">
              <View style={styles.printOptionGroup}>
                <Text style={[styles.printOptionLabel, accountDarkMode && styles.studyDarkAccentText]}>Book</Text>
                <View style={styles.memoryBookDropdownStack}>
                  {[
                    { id: "new" as const, label: "New Testament", books: NEW_TESTAMENT_BOOKS },
                    { id: "old" as const, label: "Old Testament", books: OLD_TESTAMENT_BOOKS }
                  ].map((section) => {
                    const open = memoryBookCollectionTestamentOpen === section.id;
                    const selectedInSection = section.books.includes(memoryBookCollectionDraft.book);
                    return (
                      <View key={section.id} style={[styles.memoryBookDropdown, accountDarkMode && styles.memoryDarkSoftPanel]}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setMemoryBookCollectionTestamentOpen((current) => current === section.id ? null : section.id)}
                          style={styles.memoryBookDropdownHeader}
                        >
                          <View style={styles.memoryBookDropdownTitleBlock}>
                            <Text style={[styles.memoryBookDropdownTitle, accountDarkMode && styles.accountDarkTitle]}>{section.label}</Text>
                            <Text style={[styles.memoryBookDropdownSubtitle, accountDarkMode && styles.accountDarkMutedText]}>
                              {selectedInSection ? displayBibleBookName(memoryBookCollectionDraft.book) : `${section.books.length} books`}
                            </Text>
                          </View>
                          <Ionicons name={open ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={accountDarkMode ? "#e9b76a" : colors.oliveDark} />
                        </Pressable>
                        {open && (
                          <View style={styles.memoryBookPickerGrid}>
                            {section.books.map((book) => (
                              <Pressable
                                key={book}
                                onPress={() => {
                                  updateMemoryBookCollectionBook(book);
                                  setMemoryBookCollectionTestamentOpen(null);
                                }}
                                style={[styles.memoryBookPickerChip, accountDarkMode && styles.printDarkOptionChip, memoryBookCollectionDraft.book === book && styles.activePrintOptionChip]}
                              >
                                <Text style={[styles.memoryBookPickerChipText, accountDarkMode && styles.accountDarkMutedText, memoryBookCollectionDraft.book === book && styles.activePrintOptionChipText]}>{displayBibleBookName(book)}</Text>
                              </Pressable>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.printOptionGroup}>
                <Text style={[styles.printOptionLabel, accountDarkMode && styles.studyDarkAccentText]}>Range</Text>
                <View style={styles.printOptionChipRow}>
                  {[
                    ["whole", `Whole book (${BIBLE_CHAPTER_COUNTS[memoryBookCollectionDraft.book] || 1})`],
                    ["range", "Chapter range"]
                  ].map(([key, label]) => (
                    <Pressable
                      key={key}
                      onPress={() => updateMemoryBookCollectionMode(key as "whole" | "range")}
                      style={[styles.printOptionChip, accountDarkMode && styles.printDarkOptionChip, memoryBookCollectionDraft.mode === key && styles.activePrintOptionChip]}
                    >
                      <Text style={[styles.printOptionChipText, accountDarkMode && styles.accountDarkMutedText, memoryBookCollectionDraft.mode === key && styles.activePrintOptionChipText]}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
                {memoryBookCollectionDraft.mode === "range" && (
                  <View style={styles.memoryBookRangeRow}>
                    <TextInput
                      value={memoryBookCollectionDraft.startChapter}
                      onChangeText={(startChapter) => setMemoryBookCollectionDraft((current) => ({ ...current, startChapter }))}
                      keyboardType="number-pad"
                      placeholder="Start"
                      placeholderTextColor={accountDarkMode ? "#8f8678" : colors.muted}
                      style={[styles.input, styles.memoryBookRangeInput, accountDarkMode && styles.accountDarkInput]}
                    />
                    <Text style={[styles.memoryBookRangeDash, accountDarkMode && styles.accountDarkMutedText]}>to</Text>
                    <TextInput
                      value={memoryBookCollectionDraft.endChapter}
                      onChangeText={(endChapter) => setMemoryBookCollectionDraft((current) => ({ ...current, endChapter }))}
                      keyboardType="number-pad"
                      placeholder="End"
                      placeholderTextColor={accountDarkMode ? "#8f8678" : colors.muted}
                      style={[styles.input, styles.memoryBookRangeInput, accountDarkMode && styles.accountDarkInput]}
                    />
                  </View>
                )}
              </View>

              <View style={styles.printOptionGroup}>
                <Text style={[styles.printOptionLabel, accountDarkMode && styles.studyDarkAccentText]}>Collection name</Text>
                <TextInput
                  value={memoryBookCollectionDraft.collectionName}
                  onChangeText={(collectionName) => setMemoryBookCollectionDraft((current) => ({ ...current, collectionName }))}
                  placeholder="Romans"
                  placeholderTextColor={accountDarkMode ? "#8f8678" : colors.muted}
                  style={[styles.input, accountDarkMode && styles.accountDarkInput]}
                />
              </View>

              <View style={[styles.memoryCollectionPromptSummary, accountDarkMode && styles.memoryDarkSoftPanel]}>
                <Ionicons name="information-circle-outline" size={20} color={accountDarkMode ? "#e9b76a" : colors.coral} />
                <Text style={[styles.memoryCollectionPromptText, accountDarkMode && styles.accountDarkMutedText]}>
                  Whole books over 40 chapters should be created in chapter ranges. This keeps the app responsive and avoids creating too much at once.
                </Text>
              </View>
              {!!memoryBookCollectionStatus && <Text style={[styles.saveStatus, accountDarkMode && styles.accountDarkMutedText]}>{memoryBookCollectionStatus}</Text>}
            </ScrollView>

            <View style={styles.printOptionsActions}>
              <Pressable
                disabled={memoryBookCollectionSaving}
                onPress={() => setMemoryBookCollectionOpen(false)}
                style={[styles.printOptionsCancelButton, accountDarkMode && styles.printDarkCancelButton]}
              >
                <Text style={[styles.printOptionsCancelText, accountDarkMode && styles.homeDarkResumeButtonText]}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={memoryBookCollectionSaving}
                onPress={createMemoryCollectionFromBible}
                style={[styles.resumeButton, styles.primaryResumeButton, phoneLayout && styles.phonePrintOpenButton, memoryBookCollectionSaving && styles.disabledButton]}
              >
                <Ionicons name="folder-open-outline" size={17} color="white" />
                <Text style={[styles.primaryResumeButtonText, phoneLayout && styles.phonePrintOpenButtonText]}>
                  {memoryBookCollectionSaving ? "Creating..." : "Create collection"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
      {memoryPrintOptionsOpen && (
        <View {...modalAccessibilityProps("Memory card print options")} style={styles.printOptionsOverlay}>
          <Pressable style={[styles.printOptionsScrim, accountDarkMode && styles.printDarkOptionsScrim]} onPress={() => setMemoryPrintOptionsOpen(false)} />
          <View
            style={[
              styles.printOptionsCard,
              styles.memoryPrintOptionsCard,
              phoneLayout && styles.phonePrintOptionsCard,
              phoneLayout && { maxHeight: Math.max(320, layoutHeight - 96) },
              accountDarkMode && styles.accountDarkMainCard
            ]}
          >
            <View style={styles.printOptionsHeader}>
              <View style={styles.printOptionsTitleBlock}>
                <Text style={[styles.printOptionsTitle, accountDarkMode && styles.accountDarkTitle]}>Print memory cards</Text>
                <Text style={[styles.printOptionsSubtitle, accountDarkMode && styles.accountDarkMutedText]}>
                  {memoryPrintVerses.length} of {memoryPrintCandidateVerses.length} verse{memoryPrintCandidateVerses.length === 1 ? "" : "s"} selected · {memoryPrintCopies} cop{memoryPrintCopies === 1 ? "y" : "ies"} each
                </Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close memory card print options" onPress={() => setMemoryPrintOptionsOpen(false)} style={styles.markupCloseButton}>
                <Ionicons name="close-outline" size={19} color={accountDarkMode ? "#c8bda9" : colors.muted} />
              </Pressable>
            </View>

            <ScrollView style={styles.memoryPrintOptionsScroll} contentContainerStyle={styles.memoryPrintOptionsScrollContent} keyboardShouldPersistTaps="handled">
              <View style={styles.printOptionGroup}>
                <Text style={[styles.printOptionLabel, accountDarkMode && styles.studyDarkAccentText]}>Verses</Text>
                <View style={styles.printOptionChipRow}>
                  {[
                    ["due", "Due for review"],
                    ["reviewed", "Reviewed"],
                    ["all", "All saved"],
                    ["collection", "Collection"],
                    ["current", memoryView === "browse" ? "Current browse results" : "Current view"],
                    ["custom", "Custom"]
                  ].map(([key, label]) => (
                    <Pressable
                      key={key}
                      onPress={() => changeMemoryPrintSet(key as MemoryPrintSet)}
                      style={[styles.printOptionChip, accountDarkMode && styles.printDarkOptionChip, memoryPrintSet === key && styles.activePrintOptionChip]}
                    >
                      <Text style={[styles.printOptionChipText, accountDarkMode && styles.accountDarkMutedText, memoryPrintSet === key && styles.activePrintOptionChipText]}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {memoryPrintSet === "collection" && (
                <View style={styles.printOptionGroup}>
                  <Text style={[styles.printOptionLabel, accountDarkMode && styles.studyDarkAccentText]}>Collection</Text>
                  <View style={styles.printOptionChipRow}>
                    {memoryCollectionOptions.length === 0 ? (
                      <Text style={[styles.printOptionsSubtitle, accountDarkMode && styles.accountDarkMutedText]}>Add collections to saved verses first.</Text>
                    ) : (
                      memoryCollectionOptions.map((collection) => (
                        <Pressable
                          key={collection.name}
                          onPress={() => changeMemoryPrintCollection(collection.name)}
                          style={[styles.printOptionChip, accountDarkMode && styles.printDarkOptionChip, memoryPrintCollectionFilter === collection.name && styles.activePrintOptionChip]}
                        >
                          <Text style={[styles.printOptionChipText, accountDarkMode && styles.accountDarkMutedText, memoryPrintCollectionFilter === collection.name && styles.activePrintOptionChipText]}>{collection.name}</Text>
                        </Pressable>
                      ))
                    )}
                  </View>
                </View>
              )}

              {memoryPrintSet === "custom" && (
                <View style={styles.printOptionGroup}>
                  <View style={styles.memoryPrintPickerHeader}>
                    <Text style={[styles.printOptionLabel, accountDarkMode && styles.studyDarkAccentText]}>Choose saved verses</Text>
                    <View style={styles.memoryPrintPickerActions}>
                      <Pressable onPress={() => setMemoryPrintSelectedVerseIds(memoryPrintCandidateVerses.map((verse: any) => String(verse._id)))}>
                        <Text style={[styles.memoryPrintPickerActionText, accountDarkMode && styles.studyDarkAccentText]}>Select all</Text>
                      </Pressable>
                      <Pressable onPress={() => setMemoryPrintSelectedVerseIds([])}>
                        <Text style={[styles.memoryPrintPickerActionText, accountDarkMode && styles.studyDarkAccentText]}>Clear</Text>
                      </Pressable>
                    </View>
                  </View>
                  {memoryPrintCandidateVerses.length > 0 ? (
                    <View style={[styles.memoryPrintVersePicker, styles.memoryPrintVersePickerContent, accountDarkMode && styles.memoryDarkSubPanel]}>
                      {memoryPrintCandidateVerses.map((verse: any) => {
                        const verseId = String(verse._id);
                        const selected = memoryPrintSelectedVerseIds.includes(verseId);
                        return (
                          <Pressable
                            key={verseId}
                            onPress={() => toggleMemoryPrintVerse(verseId)}
                            style={[styles.memoryPrintVerseRow, accountDarkMode && styles.memoryDarkSoftPanel, selected && styles.activeMemoryPrintVerseRow]}
                          >
                            <Ionicons name={selected ? "checkbox-outline" : "square-outline"} size={20} color={selected ? colors.coral : accountDarkMode ? "#c8bda9" : colors.muted} />
                            <View style={styles.memoryPrintVerseCopy}>
                              <Text style={[styles.memoryPrintVerseReference, accountDarkMode && styles.accountDarkText]} numberOfLines={1}>{verse.reference}</Text>
                              <Text style={[styles.memoryPrintVerseText, accountDarkMode && styles.accountDarkMutedText]} numberOfLines={2}>{verse.verseText}</Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={[styles.printOptionsSubtitle, accountDarkMode && styles.accountDarkMutedText]}>No saved verses match this group yet.</Text>
                  )}
                </View>
              )}

              <View style={styles.printOptionGroup}>
                <Text style={[styles.printOptionLabel, accountDarkMode && styles.studyDarkAccentText]}>Layout</Text>
                <View style={styles.printOptionChipRow}>
                  {[
                    ["pocket", "Pocket cards"],
                    ["large", "Large cards"]
                  ].map(([key, label]) => (
                    <Pressable
                      key={key}
                      onPress={() => setRememberedMemoryPrintLayout(key as MemoryCardLayout)}
                      style={[styles.printOptionChip, accountDarkMode && styles.printDarkOptionChip, memoryPrintLayout === key && styles.activePrintOptionChip]}
                    >
                      <Text style={[styles.printOptionChipText, accountDarkMode && styles.accountDarkMutedText, memoryPrintLayout === key && styles.activePrintOptionChipText]}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.printOptionGroup}>
                <Text style={[styles.printOptionLabel, accountDarkMode && styles.studyDarkAccentText]}>Copies of each verse</Text>
                <View style={styles.printOptionChipRow}>
                  {[1, 2, 3, 4, 6].map((count) => (
                    <Pressable
                      key={count}
                      onPress={() => setRememberedMemoryPrintCopies(count)}
                      style={[styles.printOptionChip, accountDarkMode && styles.printDarkOptionChip, memoryPrintCopies === count && styles.activePrintOptionChip]}
                    >
                      <Text style={[styles.printOptionChipText, accountDarkMode && styles.accountDarkMutedText, memoryPrintCopies === count && styles.activePrintOptionChipText]}>{count}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Text style={[styles.printOptionsHintText, accountDarkMode && styles.accountDarkMutedText]}>
                Downloads a Word-compatible file. Open it in Word, Pages, or upload it to Google Docs to adjust spacing before printing.
              </Text>
            </ScrollView>

            <View style={styles.printOptionsActions}>
              <Pressable onPress={() => setMemoryPrintOptionsOpen(false)} style={[styles.printOptionsCancelButton, accountDarkMode && styles.printDarkCancelButton]}>
                <Text style={[styles.printOptionsCancelText, accountDarkMode && styles.homeDarkResumeButtonText]}>Cancel</Text>
              </Pressable>
              <ResumeButton label="Download Word doc" icon="download-outline" onPress={downloadEditableMemoryCards} variant="primary" style={phoneLayout && styles.phonePrintOpenButton} labelStyle={phoneLayout && styles.phonePrintOpenButtonText} />
            </View>
          </View>
        </View>
      )}
      {printWorksheetRequest && (
        <View {...modalAccessibilityProps("Worksheet print options")} style={styles.printOptionsOverlay}>
          <Pressable style={[styles.printOptionsScrim, accountDarkMode && styles.printDarkOptionsScrim]} onPress={() => setPrintWorksheetRequest(null)} />
          <View style={[styles.printOptionsCard, styles.rhythmGraceCard, phoneLayout && styles.phonePrintOptionsCard, phoneLayout && styles.phoneRhythmGraceCard, accountDarkMode && styles.accountDarkMainCard]}>
            <View style={styles.printOptionsHeader}>
              <View style={styles.printOptionsTitleBlock}>
                <Text style={[styles.printOptionsTitle, accountDarkMode && styles.accountDarkTitle]}>Print worksheet</Text>
                <Text style={[styles.printOptionsSubtitle, accountDarkMode && styles.accountDarkMutedText]}>
                  {printWorksheetRequest.reference} · {methods.find((item) => item.id === printWorksheetMethodId)?.short || method.short} · {printWorksheetRequest.translation}
                </Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close worksheet print options" onPress={() => setPrintWorksheetRequest(null)} style={styles.markupCloseButton}>
                <Ionicons name="close-outline" size={19} color={accountDarkMode ? "#c8bda9" : colors.muted} />
              </Pressable>
            </View>

            <View style={styles.printOptionGroup}>
              <Text style={[styles.printOptionLabel, accountDarkMode && styles.studyDarkAccentText]}>Method</Text>
              <View style={styles.printOptionChipRow}>
                {methods.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => setRememberedPrintWorksheetMethodId(item.id)}
                    style={[styles.printOptionChip, accountDarkMode && styles.printDarkOptionChip, printWorksheetMethodId === item.id && styles.activePrintOptionChip]}
                  >
                    <Text style={[styles.printOptionChipText, accountDarkMode && styles.accountDarkMutedText, printWorksheetMethodId === item.id && styles.activePrintOptionChipText]}>{item.short}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.printOptionGroup}>
              <Text style={[styles.printOptionLabel, accountDarkMode && styles.studyDarkAccentText]}>Writing space</Text>
              <View style={styles.printOptionChipRow}>
                {[
                  ["standard", "Standard"],
                  ["more", "More space"]
                ].map(([key, label]) => (
                  <Pressable
                    key={key}
                    onPress={() => setRememberedPrintWorksheetWritingSpace(key as WorksheetWritingSpace)}
                    style={[styles.printOptionChip, accountDarkMode && styles.printDarkOptionChip, printWorksheetWritingSpace === key && styles.activePrintOptionChip]}
                  >
                    <Text style={[styles.printOptionChipText, accountDarkMode && styles.accountDarkMutedText, printWorksheetWritingSpace === key && styles.activePrintOptionChipText]}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.printOptionGroup}>
              <Text style={[styles.printOptionLabel, accountDarkMode && styles.studyDarkAccentText]}>Include</Text>
              <View style={styles.printOptionToggleList}>
                {[
                  ["memory", "Memory verse"],
                  ["insight", "Shareable insight"]
                ].map(([key, label]) => {
                  const active = printWorksheetIncludes[key as keyof typeof printWorksheetIncludes];
                  return (
                    <Pressable
                      key={key}
                      onPress={() => setRememberedPrintWorksheetIncludes((current) => ({ ...current, [key]: !current[key as keyof typeof current] }))}
                      style={styles.printOptionToggle}
                    >
                      <Ionicons name={active ? "checkbox" : "square-outline"} size={19} color={active ? (accountDarkMode ? "#e9b76a" : colors.coral) : (accountDarkMode ? "#c8bda9" : colors.muted)} />
                      <Text style={[styles.printOptionToggleText, accountDarkMode && styles.accountDarkText]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.printOptionsActions}>
              <Pressable onPress={() => setPrintWorksheetRequest(null)} style={[styles.printOptionsCancelButton, accountDarkMode && styles.printDarkCancelButton]}>
                <Text style={[styles.printOptionsCancelText, accountDarkMode && styles.homeDarkResumeButtonText]}>Cancel</Text>
              </Pressable>
              <ResumeButton label="Open worksheet" icon="open-outline" onPress={openPrintableWorksheet} variant="primary" style={phoneLayout && styles.phonePrintOpenButton} labelStyle={phoneLayout && styles.phonePrintOpenButtonText} />
            </View>
          </View>
        </View>
      )}
      {pendingBiblePlanReadAhead && (() => {
        const plan = allBibleReadingPlans.find((item) => item.id === pendingBiblePlanReadAhead.planId);
        if (!plan) return null;
        return (
          <View {...modalAccessibilityProps("Reading plan reminder")} style={styles.printOptionsOverlay}>
            <Pressable style={[styles.printOptionsScrim, accountDarkMode && styles.printDarkOptionsScrim]} onPress={() => setPendingBiblePlanReadAhead(null)} />
            <View style={[styles.printOptionsCard, phoneLayout && styles.phonePrintOptionsCard, accountDarkMode && styles.accountDarkMainCard]}>
              <View style={styles.printOptionsHeader}>
                <View style={styles.printOptionsTitleBlock}>
                  <Text style={[styles.printOptionsTitle, accountDarkMode && styles.accountDarkTitle]}>You have missed a reading</Text>
                  <Text style={[styles.printOptionsSubtitle, accountDarkMode && styles.accountDarkMutedText]}>
                    {plan.title}
                  </Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Close reading plan reminder" onPress={() => setPendingBiblePlanReadAhead(null)} style={styles.markupCloseButton}>
                  <Ionicons name="close-outline" size={19} color={accountDarkMode ? "#c8bda9" : colors.muted} />
                </Pressable>
              </View>
              <View style={[styles.currentPlanNextBox, accountDarkMode && styles.accountDarkInsetBox]}>
                <Text style={[styles.readerBookSectionTitle, accountDarkMode && styles.studyDarkAccentText]}>
                  Start with Day {pendingBiblePlanReadAhead.missedDay}
                </Text>
                <Text style={[styles.muted, accountDarkMode && styles.accountDarkMutedText]}>
                  Day {pendingBiblePlanReadAhead.missedDay} was due {formatPlanDayRelativeDate(pendingBiblePlanReadAhead.missedDateKey)}. You tried to open {pendingBiblePlanReadAhead.requestedReference}.
                </Text>
              </View>
              <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>
                To keep this plan in order, open the missed reading first. Or use Catch me up if you want the plan dates moved forward.
              </Text>
              <View style={styles.printOptionsActions}>
                <Pressable onPress={() => setPendingBiblePlanReadAhead(null)} style={[styles.printOptionsCancelButton, accountDarkMode && styles.printDarkCancelButton]}>
                  <Text style={[styles.printOptionsCancelText, accountDarkMode && styles.homeDarkResumeButtonText]}>Cancel</Text>
                </Pressable>
                <ResumeButton label={`Open Day ${pendingBiblePlanReadAhead.missedDay}`} icon="return-down-forward-outline" onPress={() => openPendingMissedBiblePlanDay(pendingBiblePlanReadAhead)} style={[phoneLayout && styles.phonePrintOpenButton, accountDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phonePrintOpenButtonText, accountDarkMode && styles.homeDarkResumeButtonText]} iconColor={accountDarkMode ? "#e9b76a" : undefined} />
                <ResumeButton label="Catch me up" icon="calendar-outline" onPress={() => catchUpAndOpenPendingBiblePlanDay(pendingBiblePlanReadAhead)} variant="primary" style={phoneLayout && styles.phonePrintOpenButton} labelStyle={phoneLayout && styles.phonePrintOpenButtonText} />
              </View>
            </View>
          </View>
        );
      })()}
      {pendingStudyTransition && (
        <View {...modalAccessibilityProps("Protect unfinished study")} style={styles.printOptionsOverlay}>
          <Pressable style={[styles.printOptionsScrim, studyDarkMode && styles.printDarkOptionsScrim]} onPress={cancelPendingStudyTransition} />
          <View style={[styles.printOptionsCard, phoneLayout && styles.phonePrintOptionsCard, studyDarkMode && styles.accountDarkMainCard]}>
            <View style={styles.printOptionsHeader}>
              <View style={styles.printOptionsTitleBlock}>
                <Text style={[styles.printOptionsTitle, studyDarkMode && styles.accountDarkTitle]}>Keep your current study?</Text>
                <Text style={[styles.printOptionsSubtitle, studyDarkMode && styles.accountDarkMutedText]}>
                  You are about to {pendingStudyTransition.description}.
                </Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Cancel study change" onPress={cancelPendingStudyTransition} style={styles.markupCloseButton}>
                <Ionicons name="close-outline" size={19} color={studyDarkMode ? "#c8bda9" : colors.muted} />
              </Pressable>
            </View>
            <Text style={[styles.helpIntro, studyDarkMode && styles.accountDarkMutedText]}>
              Keep your answers, highlights, skipped steps, and optional sharing note as a draft, or discard this study before continuing.
            </Text>
            {saveStatus.startsWith("Could not sync") && (
              <Text accessibilityLiveRegion="assertive" aria-live="assertive" style={styles.warningText}>{saveStatus}</Text>
            )}
            <View style={styles.printOptionsActions}>
              <Pressable accessibilityRole="button" accessibilityLabel="Cancel study change" onPress={cancelPendingStudyTransition} style={[styles.printOptionsCancelButton, studyDarkMode && styles.printDarkCancelButton]}>
                <Text style={[styles.printOptionsCancelText, studyDarkMode && styles.homeDarkResumeButtonText]}>Cancel</Text>
              </Pressable>
              <AppButton label="Discard study" variant="secondary" onPress={() => void discardAndContinueStudyTransition()} style={studyDarkMode && styles.homeDarkResumeButton} labelStyle={studyDarkMode && styles.homeDarkResumeButtonText} />
              <ResumeButton label={isSavingStudyDraft ? "Saving draft..." : "Keep draft & continue"} icon="save-outline" onPress={() => void keepDraftAndContinueStudyTransition()} variant="primary" style={phoneLayout && styles.phonePrintOpenButton} labelStyle={phoneLayout && styles.phonePrintOpenButtonText} />
            </View>
          </View>
        </View>
      )}
      {pendingRhythmGracePrompt && (
        <View {...modalAccessibilityProps("Daily rhythm grace")} style={styles.printOptionsOverlay}>
          <Pressable style={[styles.printOptionsScrim, accountDarkMode && styles.printDarkOptionsScrim]} onPress={dismissRhythmGracePrompt} />
          <View style={[styles.printOptionsCard, phoneLayout && styles.phonePrintOptionsCard, accountDarkMode && styles.accountDarkMainCard]}>
            <View style={styles.printOptionsHeader}>
              <View style={styles.printOptionsTitleBlock}>
                <Text style={[styles.printOptionsTitle, accountDarkMode && styles.accountDarkTitle]}>Restore your daily rhythm?</Text>
                <Text style={[styles.printOptionsSubtitle, accountDarkMode && styles.accountDarkMutedText]}>
                  {firstName ? `${firstName}, y` : "Y"}ou missed {formatPlanDayRelativeDate(pendingRhythmGracePrompt.missedDate)}.
                </Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close daily rhythm grace prompt" onPress={dismissRhythmGracePrompt} style={styles.markupCloseButton}>
                <Ionicons name="close-outline" size={19} color={accountDarkMode ? "#c8bda9" : colors.muted} />
              </Pressable>
            </View>
            <View style={[styles.rhythmGraceInfoBox, accountDarkMode && styles.accountDarkInsetBox]}>
              <View style={[styles.rhythmGraceIconBubble, accountDarkMode && styles.homeDarkIconBubble]}>
                <Ionicons name="refresh-outline" size={17} color={accountDarkMode ? "#e9b76a" : colors.coral} />
              </View>
              <View style={styles.rhythmGraceInfoCopy}>
                <Text style={[styles.rhythmGraceInfoLabel, accountDarkMode && styles.studyDarkAccentText]}>
                  Grace day available
                </Text>
                <Text style={[styles.rhythmGraceInfoText, accountDarkMode && styles.accountDarkMutedText]}>
                  Use one grace day to keep your Scripture rhythm going from today.
                </Text>
              </View>
            </View>
            <View style={[styles.rhythmGraceCountBox, accountDarkMode && styles.memoryDarkSoftPanel]}>
              <Text style={[styles.rhythmGraceCountLabel, accountDarkMode && styles.accountDarkMutedText]}>Current rhythm</Text>
              <Text style={[styles.rhythmGraceCountValue, accountDarkMode && styles.accountDarkTitle]}>
                {currentRhythmCount} day{currentRhythmCount === 1 ? "" : "s"}
              </Text>
            </View>
            <View style={[styles.printOptionsActions, styles.rhythmGraceActions, phoneLayout && styles.phoneRhythmGraceActions]}>
              <ResumeButton label="Restore rhythm" icon="refresh-outline" onPress={restoreDailyRhythmFromGracePrompt} variant="primary" style={[styles.rhythmGracePrimaryButton, phoneLayout && styles.phonePrintOpenButton]} labelStyle={phoneLayout && styles.phonePrintOpenButtonText} />
              <Pressable onPress={dismissRhythmGracePrompt} style={[styles.rhythmGraceSecondaryButton, accountDarkMode && styles.printDarkCancelButton]}>
                <Text style={[styles.printOptionsCancelText, accountDarkMode && styles.homeDarkResumeButtonText]}>Not now</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
      {rhythmGraceSuccess && (
        <View {...modalAccessibilityProps("Restored rhythm confirmation")} style={styles.printOptionsOverlay}>
          <Pressable style={[styles.printOptionsScrim, accountDarkMode && styles.printDarkOptionsScrim]} onPress={() => setRhythmGraceSuccess(null)} />
          <View style={[styles.printOptionsCard, styles.rhythmGraceCard, phoneLayout && styles.phonePrintOptionsCard, phoneLayout && styles.phoneRhythmGraceCard, accountDarkMode && styles.accountDarkMainCard]}>
            <View style={styles.printOptionsHeader}>
              <View style={styles.printOptionsTitleBlock}>
                <Text style={[styles.printOptionsTitle, accountDarkMode && styles.accountDarkTitle]}>Rhythm restored</Text>
                <Text style={[styles.printOptionsSubtitle, accountDarkMode && styles.accountDarkMutedText]}>
                  Success{firstName ? `, ${firstName}` : ""}. Your current rhythm is now {rhythmGraceSuccess.restoredCount} day{rhythmGraceSuccess.restoredCount === 1 ? "" : "s"}.
                </Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close restored rhythm confirmation" onPress={() => setRhythmGraceSuccess(null)} style={styles.markupCloseButton}>
                <Ionicons name="close-outline" size={19} color={accountDarkMode ? "#c8bda9" : colors.muted} />
              </Pressable>
            </View>
            <View style={[styles.rhythmGraceCountBox, accountDarkMode && styles.memoryDarkSoftPanel]}>
              <Text style={[styles.rhythmGraceCountLabel, accountDarkMode && styles.accountDarkMutedText]}>Current rhythm</Text>
              <Text style={[styles.rhythmGraceCountValue, accountDarkMode && styles.accountDarkTitle]}>
                {rhythmGraceSuccess.restoredCount} day{rhythmGraceSuccess.restoredCount === 1 ? "" : "s"}
              </Text>
            </View>
            <View style={styles.rhythmGraceSuccessIconRow}>
              <View style={[styles.rhythmGraceSuccessIcon, accountDarkMode && styles.homeDarkIconBubble]}>
                <Ionicons name="checkmark-outline" size={34} color={accountDarkMode ? "#e9b76a" : colors.oliveDark} />
              </View>
            </View>
            <View style={[styles.printOptionsActions, styles.rhythmGraceActions, phoneLayout && styles.phoneRhythmGraceActions]}>
              <ResumeButton label="Done" icon="checkmark-outline" onPress={() => setRhythmGraceSuccess(null)} variant="primary" style={[styles.rhythmGracePrimaryButton, phoneLayout && styles.phonePrintOpenButton]} labelStyle={phoneLayout && styles.phonePrintOpenButtonText} />
            </View>
          </View>
        </View>
      )}
      {pendingBiblePlanContinuePrompt && (() => {
        const plan = allBibleReadingPlans.find((item) => item.id === pendingBiblePlanContinuePrompt.planId);
        const nextDay = plan?.days.find((day) => day.day === pendingBiblePlanContinuePrompt.nextDay);
        if (!plan || !nextDay) return null;
        const relativeDate = formatPlanDayRelativeDate(pendingBiblePlanContinuePrompt.nextDateKey);
        const title = pendingBiblePlanContinuePrompt.nextDateKey === localDateKey() ? "Continue with today’s reading?" : "Continue catching up?";
        return (
          <View {...modalAccessibilityProps("Continue reading plan")} style={styles.printOptionsOverlay}>
            <Pressable style={[styles.printOptionsScrim, accountDarkMode && styles.printDarkOptionsScrim]} onPress={() => setPendingBiblePlanContinuePrompt(null)} />
            <View style={[styles.printOptionsCard, phoneLayout && styles.phonePrintOptionsCard, accountDarkMode && styles.accountDarkMainCard]}>
              <View style={styles.printOptionsHeader}>
                <View style={styles.printOptionsTitleBlock}>
                  <Text style={[styles.printOptionsTitle, accountDarkMode && styles.accountDarkTitle]}>{title}</Text>
                  <Text style={[styles.printOptionsSubtitle, accountDarkMode && styles.accountDarkMutedText]}>
                    {plan.title}
                  </Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Close continue reading prompt" onPress={() => setPendingBiblePlanContinuePrompt(null)} style={styles.markupCloseButton}>
                  <Ionicons name="close-outline" size={19} color={accountDarkMode ? "#c8bda9" : colors.muted} />
                </Pressable>
              </View>
              <View style={[styles.currentPlanNextBox, accountDarkMode && styles.accountDarkInsetBox]}>
                <Text style={[styles.readerBookSectionTitle, accountDarkMode && styles.studyDarkAccentText]}>
                  Next reading: Day {nextDay.day}{relativeDate ? ` · ${relativeDate}` : ""}
                </Text>
                <Text style={[styles.muted, accountDarkMode && styles.accountDarkMutedText]}>
                  {nextDay.reference}
                </Text>
              </View>
              <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>
                You finished {pendingBiblePlanContinuePrompt.completedReference}. Would you like to keep going with the next due reading now?
              </Text>
              <View style={styles.printOptionsActions}>
                <Pressable onPress={() => setPendingBiblePlanContinuePrompt(null)} style={[styles.printOptionsCancelButton, accountDarkMode && styles.printDarkCancelButton]}>
                  <Text style={[styles.printOptionsCancelText, accountDarkMode && styles.homeDarkResumeButtonText]}>Not now</Text>
                </Pressable>
                <ResumeButton label={`Open Day ${nextDay.day}`} icon="return-down-forward-outline" onPress={() => openPendingContinueBiblePlanDay(pendingBiblePlanContinuePrompt)} variant="primary" style={phoneLayout && styles.phonePrintOpenButton} labelStyle={phoneLayout && styles.phonePrintOpenButtonText} />
              </View>
            </View>
          </View>
        );
      })()}
      {pendingBiblePlanCompletionCelebration && (() => {
        const particlePositions = [
          [18, 24], [32, 10], [48, 30], [63, 12], [78, 26], [88, 46],
          [24, 58], [40, 72], [56, 56], [71, 74], [84, 64], [12, 45]
        ];
        const pulseScale = planCelebrationPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
        const pulseOpacity = planCelebrationPulse.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] });
        return (
          <View {...modalAccessibilityProps("Reading plan completion")} style={styles.printOptionsOverlay}>
            <Pressable style={[styles.printOptionsScrim, accountDarkMode && styles.printDarkOptionsScrim]} onPress={() => setPendingBiblePlanCompletionCelebration(null)} />
            <View style={[styles.printOptionsCard, styles.planCelebrationCard, phoneLayout && styles.phonePrintOptionsCard, accountDarkMode && styles.accountDarkMainCard]}>
              <View style={styles.planCelebrationArt} pointerEvents="none">
                {planCelebrationParticles.map((particle, index) => {
                  const [left, top] = particlePositions[index] || [50, 50];
                  const translateY = particle.interpolate({ inputRange: [0, 1], outputRange: [16, -26 - (index % 4) * 5] });
                  const scale = particle.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.35, 1, 0.7] });
                  const opacity = particle.interpolate({ inputRange: [0, 0.18, 0.82, 1], outputRange: [0, 1, 1, 0] });
                  return (
                    <Animated.View
                      key={`plan-celebration-${index}`}
                      style={[
                        styles.planCelebrationParticle,
                        {
                          left: `${left}%`,
                          opacity,
                          top,
                          transform: [{ translateY }, { scale }]
                        },
                        index % 3 === 1 && styles.planCelebrationParticleGold,
                        index % 3 === 2 && styles.planCelebrationParticleGreen
                      ]}
                    />
                  );
                })}
                <Animated.View style={[styles.planCelebrationIcon, accountDarkMode && styles.planCelebrationIconDark, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]}>
                  <Ionicons name="checkmark-circle-outline" size={42} color={accountDarkMode ? "#e9b76a" : colors.oliveDark} />
                </Animated.View>
              </View>
              <View style={styles.printOptionsHeader}>
                <View style={styles.printOptionsTitleBlock}>
                  <Text style={[styles.printOptionsTitle, styles.planCelebrationTitle, accountDarkMode && styles.accountDarkTitle]}>
                    Congratulations{firstName ? `, ${firstName}` : ""}
                  </Text>
                  <Text style={[styles.printOptionsSubtitle, accountDarkMode && styles.accountDarkMutedText]}>
                    You completed {pendingBiblePlanCompletionCelebration.planTitle}.
                  </Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Close plan completion celebration" onPress={() => setPendingBiblePlanCompletionCelebration(null)} style={styles.markupCloseButton}>
                  <Ionicons name="close-outline" size={19} color={accountDarkMode ? "#c8bda9" : colors.muted} />
                </Pressable>
              </View>
              <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>
                Well done for completing {pendingBiblePlanCompletionCelebration.completedDays} days of reading. Would you like to choose another Bible reading plan?
              </Text>
              <View style={styles.printOptionsActions}>
                <Pressable onPress={() => setPendingBiblePlanCompletionCelebration(null)} style={[styles.printOptionsCancelButton, accountDarkMode && styles.printDarkCancelButton]}>
                  <Text style={[styles.printOptionsCancelText, accountDarkMode && styles.homeDarkResumeButtonText]}>Not now</Text>
                </Pressable>
                <ResumeButton label="Choose another plan" icon="calendar-outline" onPress={chooseAnotherBibleReadingPlanAfterCelebration} variant="primary" style={phoneLayout && styles.phonePrintOpenButton} labelStyle={phoneLayout && styles.phonePrintOpenButtonText} />
              </View>
            </View>
          </View>
        );
      })()}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Help for ${activeContextHelp.title}`}
        onPress={() => setContextHelpOpen(true)}
        style={[styles.contextHelpButton, { bottom: contextHelpBottom }]}
      >
        <HydrationSafeIonicon ready={iconFontReady} name="help-circle-outline" size={22} color="white" />
      </Pressable>
      {contextHelpOpen && (
        <View {...modalAccessibilityProps(activeContextHelp.title)} style={styles.contextHelpOverlay}>
          <Pressable style={styles.contextHelpScrim} onPress={() => setContextHelpOpen(false)} />
          <View style={[styles.contextHelpCard, phoneLayout && styles.phoneContextHelpCard, accountDarkMode && styles.accountDarkMainCard]}>
            <View style={styles.contextHelpHeader}>
              <View style={styles.feedbackHeader}>
                <Ionicons name={activeContextHelp.icon as any} size={18} color={accountDarkMode ? "#e9b76a" : colors.coral} />
                <Text style={[styles.feedbackTitle, accountDarkMode && styles.accountDarkTitle]}>{activeContextHelp.title}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close contextual help" onPress={() => setContextHelpOpen(false)} style={styles.markupCloseButton}>
                <Ionicons name="close-outline" size={19} color={accountDarkMode ? "#c8bda9" : colors.muted} />
              </Pressable>
            </View>
            <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>{activeContextHelp.summary}</Text>
            <View style={styles.contextHelpList}>
              {activeContextHelp.tips.map((tip) => (
                <View key={tip} style={[styles.contextHelpTip, accountDarkMode && styles.accountDarkInsetBox]}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={accountDarkMode ? "#e9b76a" : colors.oliveDark} />
                  <Text style={[styles.contextHelpTipText, accountDarkMode && styles.accountDarkText]}>{tip}</Text>
                </View>
              ))}
            </View>
            <View style={styles.contextHelpActions}>
              <ResumeButton
                label="Full help"
                icon="help-circle-outline"
                onPress={() => {
                  setContextHelpOpen(false);
                  setTab("help");
                }}
                style={accountDarkMode && styles.homeDarkResumeButton}
                labelStyle={accountDarkMode && styles.homeDarkResumeButtonText}
                iconColor={accountDarkMode ? "#e9b76a" : undefined}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function formatAdminDate(value?: number) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

const TodayRhythmCard = memo(function TodayRhythmCard({
  profileId,
  timezoneOffsetMinutes,
  providedStats,
  queryOwnStats,
  progress,
  darkMode,
  effectivePartner,
  friendlyName
}: {
  profileId: any;
  timezoneOffsetMinutes: number;
  providedStats: any;
  queryOwnStats: boolean;
  progress: number;
  darkMode: boolean;
  effectivePartner: string;
  friendlyName: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(timer); }, []);
  const isolatedStats = useQuery(
    api.study.stats,
    queryOwnStats && profileId ? { profileId, timezoneOffsetMinutes, now } : "skip"
  );
  const currentStats = providedStats ?? isolatedStats;

  return (
    <Card style={[styles.todayCard, darkMode && styles.accountDarkMainCard]}>
      <Eyebrow>Today</Eyebrow>
      <Text style={[styles.streakNumber, darkMode && styles.accountDarkTitle]}>{currentStats?.currentStreak ?? 0}</Text>
      <Text style={[styles.muted, darkMode && styles.accountDarkMutedText]}>day rhythm</Text>
      <View style={[styles.progressTrack, darkMode && styles.appDarkProgressTrack]}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={[styles.muted, darkMode && styles.accountDarkMutedText]}>
        {effectivePartner
          ? `${friendlyName === "friend" ? "Share" : `${friendlyName}, share`} an encouragement with ${effectivePartner} after your study.`
          : `${friendlyName === "friend" ? "Invite" : `${friendlyName}, invite`} someone to connect with you.`}
      </Text>
    </Card>
  );
});

function Metric({
  value,
  label,
  compact = false,
  style,
  valueStyle,
  labelStyle,
  labelLines = 1
}: {
  value: number;
  label: string;
  compact?: boolean;
  style?: any;
  valueStyle?: any;
  labelStyle?: any;
  labelLines?: number;
}) {
  return (
    <View style={[styles.metric, compact && styles.phoneMemoryMetric, style]}>
      <Text style={[styles.metricValue, compact && styles.phoneMemoryMetricValue, valueStyle]}>{value}</Text>
      <Text numberOfLines={labelLines} style={[styles.muted, compact && styles.phoneMemoryMetricLabel, labelStyle]}>{label}</Text>
    </View>
  );
}

function ResumeButton({
  label,
  onPress,
  icon = "return-up-forward-outline",
  variant = "default",
  style,
  labelStyle,
  iconColor,
  iconReady = true
}: {
  label: string;
  onPress: () => void;
  icon?: string;
  variant?: "default" | "primary";
  style?: any;
  labelStyle?: any;
  iconColor?: string;
  iconReady?: boolean;
}) {
  const primary = variant === "primary";
  const keyboardActivationProps: any = Platform.OS === "web"
    ? {
        tabIndex: 0,
        onKeyDown: (event: any) => {
          const key = event.key || event.nativeEvent?.key;
          if (key !== "Enter") return;
          event.preventDefault?.();
          onPress();
        }
      }
    : {};

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...keyboardActivationProps}
      onPress={onPress}
      style={({ pressed }) => [styles.resumeButton, primary && styles.primaryResumeButton, pressed && styles.resumeButtonPressed, style]}
    >
      <HydrationSafeIonicon ready={iconReady} name={icon as any} size={17} color={iconColor || (primary ? "white" : colors.coral)} />
      <Text style={[styles.resumeButtonText, primary && styles.primaryResumeButtonText, labelStyle]}>{label}</Text>
    </Pressable>
  );
}

function ScriptureInsertPrompt({
  reference,
  status,
  onInsert,
  onDismiss,
  compact = false,
  darkMode = false
}: {
  reference: string;
  status?: string;
  onInsert?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
  darkMode?: boolean;
}) {
  if (Platform.OS === "web") {
    return (
      <View style={[styles.scriptureInsertBox, compact && styles.compactScriptureInsertBox, darkMode && styles.accountDarkSection]}>
        <Ionicons name="book-outline" size={17} color={darkMode ? "#e9b76a" : colors.coral} />
        <Text style={[styles.scriptureInsertText, darkMode && styles.accountDarkText]}>{status || `Add text for ${reference}`}</Text>
        {createElement("button", {
          type: "button",
          onMouseDown: (event: any) => event.preventDefault(),
          onClick: () => onInsert?.(),
          style: {
            backgroundColor: colors.coral,
            border: "none",
            borderRadius: 999,
            color: "white",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 900,
            padding: "7px 10px"
          },
          children: "Insert"
        })}
        <Pressable onPress={onDismiss} style={[styles.scriptureInsertCloseButton, darkMode && styles.homeDarkIconBubble]} accessibilityLabel="Close scripture insert">
          <Ionicons name="close-outline" size={16} color={darkMode ? "#c8bda9" : colors.muted} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.scriptureInsertBox, compact && styles.compactScriptureInsertBox, darkMode && styles.accountDarkSection]}>
      <Ionicons name="book-outline" size={17} color={darkMode ? "#e9b76a" : colors.coral} />
      <Text style={[styles.scriptureInsertText, darkMode && styles.accountDarkText]}>{status || `Add text for ${reference}`}</Text>
      <Pressable onPress={() => onInsert?.()} style={styles.scriptureInsertButton}>
        <Text style={styles.scriptureInsertButtonText}>Insert</Text>
      </Pressable>
      <Pressable onPress={onDismiss} style={[styles.scriptureInsertCloseButton, darkMode && styles.homeDarkIconBubble]} accessibilityLabel="Close scripture insert">
        <Ionicons name="close-outline" size={16} color={darkMode ? "#c8bda9" : colors.muted} />
      </Pressable>
    </View>
  );
}

function StudyNoteEditor({
  value,
  onChange,
  onSelectionChange,
  onFormat,
  placeholder,
  studyFocusMode,
  writingPrompts = [],
  customWritingPrompts = [],
  writingPromptStatus,
  onAddCustomWritingPrompt,
  onRemoveCustomWritingPrompt,
  scriptureReference,
  scriptureTypedReference,
  scriptureInsertStatus,
  scriptureInsertFocusKey,
  onInsertScripture,
  profileScriptureInsertSettings,
  onSaveScriptureInsertSettings,
  phoneLayout = false,
  darkMode = false
}: {
  value: string;
  onChange: (value: string, plainText?: string) => void;
  onSelectionChange: (selection: { start: number; end: number }) => void;
  onFormat: (kind: NoteFormatKind) => void;
  placeholder: string;
  studyFocusMode: boolean;
  writingPrompts?: string[];
  customWritingPrompts?: string[];
  writingPromptStatus?: string;
  onAddCustomWritingPrompt?: (prompt: string) => boolean;
  onRemoveCustomWritingPrompt?: (prompt: string) => void;
  scriptureReference?: string;
  scriptureTypedReference?: string;
  scriptureInsertStatus?: string;
  scriptureInsertFocusKey?: number;
  onInsertScripture?: (request?: ScriptureInsertRequest) => Promise<ScriptureInsertResult | null | undefined>;
  profileScriptureInsertSettings?: Partial<ScriptureInsertSettings> | null;
  onSaveScriptureInsertSettings?: (settings: ScriptureInsertSettings) => Promise<void>;
  phoneLayout?: boolean;
  darkMode?: boolean;
}) {
  const nativeInputRef = useRef<any>(null);
  const nativeSelectionRef = useRef({ start: value.length, end: value.length });
  const lastNativeTextSelectionRef = useRef<{ start: number; end: number } | null>(null);
  const savedNativeHighlightSelectionRef = useRef<{ start: number; end: number } | null>(null);
  const [nativeSelection, setNativeSelection] = useState({ start: value.length, end: value.length });
  const [scriptureInsertSettings, setScriptureInsertSettings] = useState<ScriptureInsertSettings>(() => getStoredScriptureInsertSettings());
  const [scriptureSettingsOpen, setScriptureSettingsOpen] = useState(false);
  const [highlightPickerOpen, setHighlightPickerOpen] = useState(false);
  const [nativeDismissedReference, setNativeDismissedReference] = useState("");
  const nativeSelectionKey = `${nativeSelection.start}:${nativeSelection.end}`;
  const nativeTextSelected = nativeSelection.start !== nativeSelection.end;
  const [dismissedNativeMiniBarKey, setDismissedNativeMiniBarKey] = useState("");

  useEffect(() => {
    if (!profileScriptureInsertSettings) return;
    const nextSettings = normalizeScriptureInsertSettings(profileScriptureInsertSettings);
    setScriptureInsertSettings(nextSettings);
    saveStoredScriptureInsertSettings(nextSettings);
  }, [profileScriptureInsertSettings]);

  const saveScriptureSettings = async (nextSettings: ScriptureInsertSettings) => {
    setScriptureInsertSettings(nextSettings);
    saveStoredScriptureInsertSettings(nextSettings);
    await onSaveScriptureInsertSettings?.(nextSettings);
  };

  const openScriptureSettings = () => {
    setScriptureSettingsOpen(true);
  };

  const saveHighlightColor = async (highlightColor: string) => {
    await saveScriptureSettings({ ...scriptureInsertSettings, highlightColor });
    setHighlightPickerOpen(false);
  };

  const openNativeHighlightPicker = () => {
    const currentSelection = nativeSelectionRef.current;
    savedNativeHighlightSelectionRef.current =
      currentSelection.start !== currentSelection.end
        ? currentSelection
        : lastNativeTextSelectionRef.current;
    setHighlightPickerOpen(true);
  };

  const saveNativeHighlightColor = async (highlightColor: string) => {
    await saveHighlightColor(highlightColor);
    const savedSelection = savedNativeHighlightSelectionRef.current;
    if (!savedSelection) return;
    nativeSelectionRef.current = savedSelection;
    lastNativeTextSelectionRef.current = savedSelection;
    setNativeSelection(savedSelection);
    onSelectionChange(savedSelection);
    requestAnimationFrame(() => nativeInputRef.current?.focus?.());
  };

  const insertWritingPromptNative = (prompt: string) => {
    const nextValue = value.trim() ? `${value.trimEnd()}\n${prompt} ` : `${prompt} `;
    onChange(nextValue);
    const nextSelection = { start: nextValue.length, end: nextValue.length };
    setNativeSelection(nextSelection);
    onSelectionChange(nextSelection);
  };

  const updateNativeSelection = (selection: { start: number; end: number }) => {
    const nextKey = `${selection.start}:${selection.end}`;
    nativeSelectionRef.current = selection;
    if (selection.start !== selection.end) lastNativeTextSelectionRef.current = selection;
    setNativeSelection(selection);
    if (nextKey !== dismissedNativeMiniBarKey) setDismissedNativeMiniBarKey("");
    onSelectionChange(selection);
  };

  const formatNativeNote = (kind: NoteFormatKind) => {
    const currentSelection = nativeSelectionRef.current;
    const usableSelection =
      currentSelection.start !== currentSelection.end
        ? currentSelection
        : lastNativeTextSelectionRef.current || currentSelection;
    const { nextValue, nextSelection } = formatPlainNoteValue(value, kind, usableSelection);
    onChange(nextValue);
    onFormat(kind);
    lastNativeTextSelectionRef.current = null;
    nativeSelectionRef.current = nextSelection;
    setNativeSelection(nextSelection);
    onSelectionChange(nextSelection);
    setTimeout(() => nativeInputRef.current?.focus?.(), 50);
  };

  const insertScriptureNative = async () => {
    const result = await onInsertScripture?.({ reference: scriptureReference, typedReference: scriptureTypedReference || scriptureReference });
    if (!result) return;

    const caretEnd = nativeSelectionRef.current.end;
    const inserted = plainScriptureExpansion(result.reference, result.text, scriptureInsertSettings);
    const { nextValue, nextSelection } = replaceTypedReferenceBeforeIndex(value, result.typedReference || result.reference, inserted, caretEnd);
    onChange(nextValue, nextValue.slice(0, nextSelection.end));
    nativeSelectionRef.current = nextSelection;
    setNativeSelection(nextSelection);
    onSelectionChange(nextSelection);
    setTimeout(() => nativeInputRef.current?.focus?.(), 50);
  };

  if (Platform.OS === "web") {
    return (
      <StudyNoteTiptapEditor
        value={value}
        onChange={onChange}
        onSelectionChange={onSelectionChange}
        placeholder={placeholder}
        studyFocusMode={studyFocusMode}
        writingPrompts={writingPrompts}
        customWritingPrompts={customWritingPrompts}
        writingPromptStatus={writingPromptStatus}
        onAddCustomWritingPrompt={onAddCustomWritingPrompt}
        onRemoveCustomWritingPrompt={onRemoveCustomWritingPrompt}
        scriptureInsertStatus={scriptureInsertStatus}
        scriptureInsertFocusKey={scriptureInsertFocusKey}
        onInsertScripture={onInsertScripture}
        scriptureInsertSettings={scriptureInsertSettings}
        onSaveScriptureInsertSettings={saveScriptureSettings}
        highlightPickerOpen={highlightPickerOpen}
        onOpenHighlightPicker={() => setHighlightPickerOpen(true)}
        onCloseHighlightPicker={() => setHighlightPickerOpen(false)}
        onSaveHighlightColor={saveHighlightColor}
        scriptureSettingsOpen={scriptureSettingsOpen}
        onOpenScriptureSettings={openScriptureSettings}
        onCloseScriptureSettings={() => setScriptureSettingsOpen(false)}
        phoneLayout={phoneLayout}
        darkMode={darkMode}
      />
    );
  }

  const updateNativeText = (nextValue: string) => {
    const lengthDelta = nextValue.length - value.length;
    const estimatedCaretEnd = Math.max(0, Math.min(nextValue.length, nativeSelectionRef.current.end + lengthDelta));
    onChange(nextValue, nextValue.slice(0, estimatedCaretEnd));
  };

  return (
    <View style={styles.studyNoteEditorWrap}>
      <WritingPromptChips
        prompts={writingPrompts}
        customPrompts={customWritingPrompts}
        status={writingPromptStatus}
        onInsert={insertWritingPromptNative}
        onAddCustomPrompt={onAddCustomWritingPrompt}
        onRemoveCustomPrompt={onRemoveCustomWritingPrompt}
        compact={phoneLayout}
        darkMode={darkMode}
      />
      <TextInput
        ref={nativeInputRef}
        multiline
        value={value}
        onChangeText={updateNativeText}
        selection={nativeSelection}
        onPressIn={() => {
          if (nativeTextSelected) setDismissedNativeMiniBarKey(nativeSelectionKey);
        }}
        onSelectionChange={(event) => updateNativeSelection(event.nativeEvent.selection)}
        placeholder={placeholder}
        placeholderTextColor={darkMode ? "#8f8678" : undefined}
        style={[styles.input, styles.textarea, studyFocusMode && styles.focusTextarea, darkMode && styles.accountDarkInput]}
      />
      {phoneLayout && nativeTextSelected && dismissedNativeMiniBarKey !== nativeSelectionKey && (
        <MobileNoteFormatBar
          onFormat={formatNativeNote}
          highlightColor={scriptureInsertSettings.highlightColor}
          onOpenHighlightPicker={openNativeHighlightPicker}
          onDismiss={() => setDismissedNativeMiniBarKey(nativeSelectionKey)}
          darkMode={darkMode}
        />
      )}
      {!!scriptureReference && !scriptureInsertSettings.disabled && nativeDismissedReference !== scriptureReference && (
        <ScriptureInsertPrompt
          reference={scriptureReference}
          status={scriptureInsertStatus}
          onInsert={insertScriptureNative}
          onDismiss={() => setNativeDismissedReference(scriptureReference || "")}
          darkMode={darkMode}
        />
      )}
      <NoteFormatToolbar
        onFormat={formatNativeNote}
        activeFormats={[]}
        highlightColor={scriptureInsertSettings.highlightColor}
        onOpenHighlightPicker={openNativeHighlightPicker}
        onOpenSettings={openScriptureSettings}
        compact={phoneLayout}
        darkMode={darkMode}
      />
      {highlightPickerOpen && (
        <NoteHighlightColorPicker
          color={scriptureInsertSettings.highlightColor}
          onSelect={saveNativeHighlightColor}
          onClose={() => setHighlightPickerOpen(false)}
          darkMode={darkMode}
        />
      )}
      {scriptureSettingsOpen && (
        <ScriptureInsertSettingsDialog
          settings={scriptureInsertSettings}
          onSave={saveScriptureSettings}
          onClose={() => setScriptureSettingsOpen(false)}
          darkMode={darkMode}
          phoneLayout={phoneLayout}
        />
      )}
    </View>
  );
}

function StudyNoteTiptapEditor(props: {
  value: string;
  onChange: (value: string, plainText?: string) => void;
  onSelectionChange: (selection: { start: number; end: number }) => void;
  placeholder: string;
  studyFocusMode: boolean;
  writingPrompts?: string[];
  customWritingPrompts?: string[];
  writingPromptStatus?: string;
  onAddCustomWritingPrompt?: (prompt: string) => boolean;
  onRemoveCustomWritingPrompt?: (prompt: string) => void;
  scriptureInsertStatus?: string;
  scriptureInsertFocusKey?: number;
  onInsertScripture?: (request?: ScriptureInsertRequest) => Promise<ScriptureInsertResult | null | undefined>;
  scriptureInsertSettings: ScriptureInsertSettings;
  onSaveScriptureInsertSettings: (settings: ScriptureInsertSettings) => Promise<void>;
  highlightPickerOpen: boolean;
  onOpenHighlightPicker: () => void;
  onCloseHighlightPicker: () => void;
  onSaveHighlightColor: (color: string) => Promise<void>;
  scriptureSettingsOpen: boolean;
  onOpenScriptureSettings: (event?: any) => void;
  onCloseScriptureSettings: () => void;
  phoneLayout?: boolean;
  darkMode?: boolean;
}) {
  return (
    <Suspense fallback={<View style={styles.studyNoteEditorWrap}><Text style={styles.saveStatus}>Loading editor...</Text></View>}>
      <LazyStudyNoteTiptapEditor
        {...props}
        appStyles={styles}
        components={{
          WritingPromptChips,
          MobileNoteFormatBar,
          ScriptureInsertPrompt,
          NoteFormatToolbar,
          NoteHighlightColorPicker,
          ScriptureInsertSettingsDialog
        }}
        helpers={{
          findTypedScriptureReferenceMatches,
          getScriptureMatchKey,
          richScriptureExpansion,
          sanitizeEditorHtml
        }}
      />
    </Suspense>
  );
}

function MobileNoteFormatBar({
  onFormat,
  highlightColor,
  onOpenHighlightPicker,
  onDismiss,
  floating = false,
  style,
  darkMode = false
}: {
  onFormat: (kind: NoteFormatKind) => void;
  highlightColor: string;
  onOpenHighlightPicker: () => void;
  onDismiss?: () => void;
  floating?: boolean;
  style?: any;
  darkMode?: boolean;
}) {
  const miniBarPressProps = (action: () => void) =>
    Platform.OS === "web"
      ? ({
          onPointerDown: (event: any) => {
            event.preventDefault();
            action();
          }
        } as any)
      : { onPress: action };

  return (
    <View style={[styles.mobileNoteFormatBar, floating && styles.floatingMobileNoteFormatBar, darkMode && styles.accountDarkSection, style]}>
      <Pressable {...miniBarPressProps(() => onFormat("bold"))} style={[styles.mobileNoteFormatButton, darkMode && styles.studyDarkFormatButton]} accessibilityLabel="Bold">
        <Text style={[styles.noteFormatText, styles.noteFormatBold, darkMode && styles.accountDarkText]}>B</Text>
      </Pressable>
      <Pressable {...miniBarPressProps(() => onFormat("italic"))} style={[styles.mobileNoteFormatButton, darkMode && styles.studyDarkFormatButton]} accessibilityLabel="Italic">
        <Text style={[styles.noteFormatText, styles.noteFormatItalic, darkMode && styles.accountDarkText]}>I</Text>
      </Pressable>
      <Pressable {...miniBarPressProps(() => onFormat("underline"))} style={[styles.mobileNoteFormatButton, darkMode && styles.studyDarkFormatButton]} accessibilityLabel="Underline">
        <Text style={[styles.noteFormatText, styles.noteFormatUnderline, darkMode && styles.accountDarkText]}>U</Text>
      </Pressable>
      <Pressable {...miniBarPressProps(() => onFormat("highlight"))} style={[styles.mobileNoteFormatButton, darkMode && styles.studyDarkFormatButton]} accessibilityLabel="Highlight">
        <Text style={[styles.noteFormatText, styles.noteFormatHighlight, darkMode && styles.studyDarkNoteFormatHighlight, { backgroundColor: highlightColor }]}>H</Text>
      </Pressable>
      <Pressable {...miniBarPressProps(onOpenHighlightPicker)} style={[styles.mobileNoteFormatButton, darkMode && styles.studyDarkFormatButton]} accessibilityLabel="Highlight colour">
        <View style={[styles.mobileHighlightSwatch, { backgroundColor: highlightColor }]} />
      </Pressable>
      <Pressable {...miniBarPressProps(() => onFormat("bullet"))} style={[styles.mobileNoteFormatButton, darkMode && styles.studyDarkFormatButton]} accessibilityLabel="Bullet list">
        <Ionicons name="list-outline" size={17} color={darkMode ? "#f7eddc" : colors.oliveDark} />
      </Pressable>
      {!!onDismiss && (
        <Pressable {...miniBarPressProps(onDismiss)} style={[styles.mobileNoteFormatButton, darkMode && styles.studyDarkFormatButton]} accessibilityLabel="Hide mini editor">
          <Ionicons name="close-outline" size={17} color={darkMode ? "#f7eddc" : colors.oliveDark} />
        </Pressable>
      )}
    </View>
  );
}

function NoteFormatToolbar({
  onFormat,
  activeFormats = [],
  highlightActive = false,
  highlightColor = DEFAULT_SCRIPTURE_INSERT_SETTINGS.highlightColor,
  onOpenHighlightPicker,
  onOpenSettings,
  compact = false,
  darkMode = false
}: {
  onFormat: (kind: NoteFormatKind) => void;
  activeFormats?: NoteFormatKind[];
  highlightActive?: boolean;
  highlightColor?: string;
  onOpenHighlightPicker?: () => void;
  onOpenSettings?: (event?: any) => void;
  compact?: boolean;
  darkMode?: boolean;
}) {
  const [hoveredFormat, setHoveredFormat] = useState<NoteFormatKind | null>(null);
  const [mobileToolbarOpen, setMobileToolbarOpen] = useState(false);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeFormatSet = new Set(activeFormats);
  if (highlightActive) activeFormatSet.add("highlight");
  const formatLabels: Record<NoteFormatKind, string> = {
    undo: "Undo",
    redo: "Redo",
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    highlight: "Highlight",
    bullet: "Bullet list"
  };

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      if (highlightPressTimerRef.current) clearTimeout(highlightPressTimerRef.current);
    };
  }, []);

  const showTooltipAfterDelay = (kind: NoteFormatKind) => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    tooltipTimerRef.current = setTimeout(() => setHoveredFormat(kind), 1500);
  };

  const hideTooltip = () => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    tooltipTimerRef.current = null;
    setHoveredFormat(null);
  };

  const pressProps = (kind: NoteFormatKind) =>
    Platform.OS === "web"
      ? ({
          accessibilityLabel: formatLabels[kind],
          onHoverIn: () => showTooltipAfterDelay(kind),
          onHoverOut: hideTooltip,
          onMouseEnter: () => showTooltipAfterDelay(kind),
          onMouseLeave: hideTooltip,
          onPointerEnter: () => showTooltipAfterDelay(kind),
          onPointerLeave: hideTooltip,
          onMouseDown: (event: any) => {
            event.preventDefault();
            hideTooltip();
            onFormat(kind);
          },
          onTouchStart: (event: any) => {
            event.preventDefault();
            hideTooltip();
            onFormat(kind);
          }
        } as any)
      : { accessibilityLabel: formatLabels[kind], onPressIn: () => onFormat(kind) };

  const startHighlightPress = (event?: any) => {
    event?.preventDefault?.();
    hideTooltip();
    if (highlightPressTimerRef.current) clearTimeout(highlightPressTimerRef.current);
    highlightPressTimerRef.current = setTimeout(() => {
      highlightPressTimerRef.current = null;
      onOpenHighlightPicker?.();
    }, 650);
  };

  const finishHighlightPress = (event?: any) => {
    event?.preventDefault?.();
    if (highlightPressTimerRef.current) {
      clearTimeout(highlightPressTimerRef.current);
      highlightPressTimerRef.current = null;
      onFormat("highlight");
      return;
    }
  };

  const cancelHighlightPress = () => {
    if (highlightPressTimerRef.current) clearTimeout(highlightPressTimerRef.current);
    highlightPressTimerRef.current = null;
  };

  const highlightButtonProps =
    Platform.OS === "web"
      ? compact
        ? ({
            accessibilityLabel: "Highlight",
            onMouseDown: (event: any) => {
              event.preventDefault();
              hideTooltip();
              onFormat("highlight");
            },
            onTouchStart: (event: any) => {
              event.preventDefault();
              hideTooltip();
              onFormat("highlight");
            }
          } as any)
        : ({
          accessibilityLabel: "Highlight",
          onHoverIn: () => showTooltipAfterDelay("highlight"),
          onHoverOut: () => {
            hideTooltip();
            cancelHighlightPress();
          },
          onContextMenu: (event: any) => {
            event.preventDefault();
            hideTooltip();
            onOpenHighlightPicker?.();
          },
          onMouseDown: startHighlightPress,
          onMouseLeave: cancelHighlightPress,
          onMouseUp: finishHighlightPress,
          onPointerLeave: cancelHighlightPress,
          onTouchCancel: cancelHighlightPress,
          onTouchEnd: finishHighlightPress,
          onTouchStart: startHighlightPress
        } as any)
      : {
          accessibilityLabel: "Highlight",
          onPress: () => onFormat("highlight")
        };

  return (
    <View style={[styles.noteFormatToolbar, compact && styles.compactNoteFormatToolbar, compact && mobileToolbarOpen && styles.expandedCompactNoteFormatToolbar, darkMode && styles.accountDarkSection]}>
      {compact && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mobileToolbarOpen ? "Hide editing tools" : "Show editing tools"}
          accessibilityState={{ expanded: mobileToolbarOpen }}
          onPress={() => setMobileToolbarOpen((open) => !open)}
          style={[styles.mobileToolbarToggle, darkMode && styles.studyDarkFormatButton]}
        >
          <Ionicons name="options-outline" size={17} color={darkMode ? "#f7eddc" : colors.oliveDark} />
          <Text style={[styles.mobileToolbarToggleText, darkMode && styles.accountDarkText]}>Editing tools</Text>
          <Ionicons name={mobileToolbarOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={darkMode ? "#c8bda9" : colors.muted} />
        </Pressable>
      )}
      {(!compact || mobileToolbarOpen) && <View style={styles.noteFormatButtonRow}>
        <View style={styles.noteFormatMainButtons}>
          {Platform.OS === "web" && (
            <>
              <Pressable {...pressProps("undo")} style={[styles.noteFormatButton, compact && styles.compactNoteFormatButton, darkMode && styles.studyDarkFormatButton]}>
                <Ionicons name="arrow-undo-outline" size={17} color={darkMode ? "#f7eddc" : colors.oliveDark} />
              </Pressable>
              <Pressable {...pressProps("redo")} style={[styles.noteFormatButton, compact && styles.compactNoteFormatButton, darkMode && styles.studyDarkFormatButton]}>
                <Ionicons name="arrow-redo-outline" size={17} color={darkMode ? "#f7eddc" : colors.oliveDark} />
              </Pressable>
            </>
          )}
          <Pressable {...pressProps("bold")} style={[styles.noteFormatButton, compact && styles.compactNoteFormatButton, darkMode && styles.studyDarkFormatButton, activeFormatSet.has("bold") && styles.activeNoteFormatButton]}>
            <Text style={[styles.noteFormatText, styles.noteFormatBold, darkMode && styles.accountDarkText, activeFormatSet.has("bold") && styles.activeNoteFormatText]}>B</Text>
          </Pressable>
          <Pressable {...pressProps("italic")} style={[styles.noteFormatButton, compact && styles.compactNoteFormatButton, darkMode && styles.studyDarkFormatButton, activeFormatSet.has("italic") && styles.activeNoteFormatButton]}>
            <Text style={[styles.noteFormatText, styles.noteFormatItalic, darkMode && styles.accountDarkText, activeFormatSet.has("italic") && styles.activeNoteFormatText]}>I</Text>
          </Pressable>
          <Pressable {...pressProps("underline")} style={[styles.noteFormatButton, compact && styles.compactNoteFormatButton, darkMode && styles.studyDarkFormatButton, activeFormatSet.has("underline") && styles.activeNoteFormatButton]}>
            <Text style={[styles.noteFormatText, styles.noteFormatUnderline, darkMode && styles.accountDarkText, activeFormatSet.has("underline") && styles.activeNoteFormatText]}>U</Text>
          </Pressable>
          <Pressable {...highlightButtonProps} style={[styles.noteFormatButton, compact && styles.compactNoteFormatButton, darkMode && styles.studyDarkFormatButton, activeFormatSet.has("highlight") && styles.activeNoteFormatButton]}>
            <Text style={[styles.noteFormatText, styles.noteFormatHighlight, darkMode && styles.studyDarkNoteFormatHighlight, { backgroundColor: highlightColor }, activeFormatSet.has("highlight") && styles.activeNoteFormatText, activeFormatSet.has("highlight") && styles.activeNoteHighlightFormatText]}>H</Text>
          </Pressable>
          <Pressable {...pressProps("bullet")} style={[styles.noteFormatButton, compact && styles.compactNoteFormatButton, darkMode && styles.studyDarkFormatButton, activeFormatSet.has("bullet") && styles.activeNoteFormatButton]}>
            <Ionicons name="list-outline" size={17} color={activeFormatSet.has("bullet") ? "white" : darkMode ? "#f7eddc" : colors.oliveDark} />
          </Pressable>
        </View>
        {!!onOpenSettings && (
          <Pressable accessibilityRole="button" onPress={(event) => onOpenSettings(event)} style={[styles.noteFormatButton, styles.noteSettingsButton, compact && styles.compactNoteFormatButton, darkMode && styles.studyDarkFormatButton]} accessibilityLabel="Editor settings">
            <Ionicons name="settings-outline" size={17} color={darkMode ? "#f7eddc" : colors.oliveDark} />
          </Pressable>
        )}
      </View>}
      {Platform.OS === "web" && hoveredFormat && <Text style={styles.noteFormatTooltip}>{formatLabels[hoveredFormat]}</Text>}
    </View>
  );
}

function ScriptureInsertSettingsDialog({
  settings,
  onSave,
  onClose,
  darkMode = false,
  phoneLayout = false
}: {
  settings: ScriptureInsertSettings;
  onSave: (settings: ScriptureInsertSettings) => Promise<void>;
  onClose: () => void;
  darkMode?: boolean;
  phoneLayout?: boolean;
}) {
  const [draft, setDraft] = useState(settings);
  const [saveStatus, setSaveStatus] = useState("");
  const update = (patch: Partial<ScriptureInsertSettings>) => setDraft((current) => ({ ...current, ...patch }));

  useEffect(() => {
    setDraft(settings);
    setSaveStatus("");
  }, [settings]);

  const saveSettings = async () => {
    setSaveStatus("Saving...");
    try {
      await onSave(draft);
      setSaveStatus("Saved");
      onClose();
    } catch {
      setSaveStatus("Saved on this device only.");
    }
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
    <View {...modalAccessibilityProps("Editor settings")} style={[styles.printOptionsOverlay, styles.editorDialogOverlay]}>
      <Pressable accessibilityLabel="Close editor settings" style={[styles.printOptionsScrim, darkMode && styles.printDarkOptionsScrim]} onPress={onClose} />
      <View style={[styles.printOptionsCard, styles.editorSettingsCard, phoneLayout && styles.phoneEditorSettingsCard, darkMode && styles.accountDarkMainCard]}>
        <View style={styles.printOptionsHeader}>
          <View style={styles.printOptionsTitleBlock}>
            <Text style={[styles.printOptionsTitle, darkMode && styles.accountDarkTitle]}>Editor settings</Text>
            <Text style={[styles.printOptionsSubtitle, darkMode && styles.accountDarkMutedText]}>
              Choose how scripture references behave and how inserted Scripture is styled.
            </Text>
          </View>
          <Pressable onPress={onClose} style={[styles.readerBookmarkIconButton, darkMode && styles.homeDarkIconBubble]} accessibilityLabel="Close editor settings">
            <Ionicons name="close-outline" size={18} color={darkMode ? "#c8bda9" : colors.muted} />
          </Pressable>
        </View>

        <ScrollView style={styles.editorSettingsScrollArea} contentContainerStyle={styles.scriptureSettingList}>
          <Pressable onPress={() => update({ disabled: !draft.disabled })} style={styles.scriptureSettingToggle}>
            <Ionicons name={draft.disabled ? "checkbox" : "square-outline"} size={20} color={darkMode ? "#e9b76a" : colors.oliveDark} />
            <Text style={[styles.printOptionToggleText, darkMode && styles.accountDarkText]}>Disable scripture insert popup</Text>
          </Pressable>

          <View style={styles.printOptionGroup}>
            <Text style={[styles.printOptionLabel, darkMode && styles.studyDarkAccentText]}>Inserted scripture style</Text>
            <View style={styles.printOptionChipRow}>
              <Pressable onPress={() => update({ bold: !draft.bold })} style={[styles.printOptionChip, darkMode && styles.printDarkOptionChip, draft.bold && styles.activePrintOptionChip]}>
                <Text style={[styles.printOptionChipText, darkMode && styles.accountDarkText, draft.bold && styles.activePrintOptionChipText]}>Bold</Text>
              </Pressable>
              <Pressable onPress={() => update({ italic: !draft.italic })} style={[styles.printOptionChip, darkMode && styles.printDarkOptionChip, draft.italic && styles.activePrintOptionChip]}>
                <Text style={[styles.printOptionChipText, darkMode && styles.accountDarkText, draft.italic && styles.activePrintOptionChipText]}>Italic</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.printOptionGroup}>
            <Text style={[styles.printOptionLabel, darkMode && styles.studyDarkAccentText]}>Colour</Text>
            <View style={styles.printOptionChipRow}>
              {SCRIPTURE_INSERT_COLOR_OPTIONS.map((option) => {
                const active = draft.color === option.value;
                return (
                  <Pressable key={option.value} onPress={() => update({ color: option.value })} style={[styles.scriptureColorOption, active && styles.activeScriptureColorOption, darkMode && styles.printDarkOptionChip]}>
                    <View style={[styles.scriptureColorSwatch, { backgroundColor: option.value }]} />
                    <Text style={[styles.printOptionChipText, darkMode && styles.accountDarkText, active && styles.scriptureColorActiveText]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.printOptionGroup}>
            <Text style={[styles.printOptionLabel, darkMode && styles.studyDarkAccentText]}>Reference position</Text>
            <View style={styles.printOptionChipRow}>
              <Pressable onPress={() => update({ referencePosition: "front" })} style={[styles.printOptionChip, darkMode && styles.printDarkOptionChip, draft.referencePosition === "front" && styles.activePrintOptionChip]}>
                <Text style={[styles.printOptionChipText, darkMode && styles.accountDarkText, draft.referencePosition === "front" && styles.activePrintOptionChipText]}>At front</Text>
              </Pressable>
              <Pressable onPress={() => update({ referencePosition: "end" })} style={[styles.printOptionChip, darkMode && styles.printDarkOptionChip, draft.referencePosition === "end" && styles.activePrintOptionChip]}>
                <Text style={[styles.printOptionChipText, darkMode && styles.accountDarkText, draft.referencePosition === "end" && styles.activePrintOptionChipText]}>At end</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <View style={styles.printOptionsActions}>
          {!!saveStatus && <Text style={[styles.editorSettingsStatus, darkMode && styles.accountDarkMutedText]}>{saveStatus}</Text>}
          <Pressable onPress={onClose} style={[styles.printOptionsCancelButton, darkMode && styles.printDarkCancelButton]}>
            <Text style={[styles.printOptionsCancelText, darkMode && styles.homeDarkResumeButtonText]}>Cancel</Text>
          </Pressable>
          <Pressable onPress={saveSettings} style={styles.editorSettingsSaveButton}>
            <Text style={styles.editorSettingsSaveText}>Save</Text>
          </Pressable>
        </View>
      </View>
    </View>
    </Modal>
  );
}

function NoteHighlightColorPicker({
  color,
  onSelect,
  onClose,
  darkMode = false
}: {
  color: string;
  onSelect: (color: string) => Promise<void>;
  onClose: () => void;
  darkMode?: boolean;
}) {
  const [draftColor, setDraftColor] = useState(color);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setDraftColor(color);
    setStatus("");
  }, [color]);

  const saveColor = async () => {
    setStatus("Saving...");
    try {
      await onSelect(draftColor);
      onClose();
    } catch {
      setStatus("Saved on this device only.");
      onClose();
    }
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
    <View {...modalAccessibilityProps("Highlight colour picker")} style={[styles.printOptionsOverlay, styles.editorDialogOverlay]}>
      <Pressable accessibilityLabel="Close highlight colour picker" style={[styles.printOptionsScrim, darkMode && styles.printDarkOptionsScrim]} onPress={onClose} />
      <View style={[styles.highlightColorPickerCard, styles.editorHighlightColorPickerCard, darkMode && styles.accountDarkMainCard]}>
        <View style={styles.printOptionsHeader}>
          <View style={styles.printOptionsTitleBlock}>
            <Text style={[styles.printOptionsTitle, darkMode && styles.accountDarkTitle]}>Highlight colour</Text>
            <Text style={[styles.printOptionsSubtitle, darkMode && styles.accountDarkMutedText]}>
              Long press Highlight to change this colour.
            </Text>
          </View>
          <Pressable onPress={onClose} style={[styles.readerBookmarkIconButton, darkMode && styles.homeDarkIconBubble]} accessibilityLabel="Close highlight colour picker">
            <Ionicons name="close-outline" size={18} color={darkMode ? "#c8bda9" : colors.muted} />
          </Pressable>
        </View>
        <View style={styles.highlightColorGrid}>
          {NOTE_HIGHLIGHT_COLOR_OPTIONS.map((option) => {
            const active = draftColor === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setDraftColor(option.value)}
                style={[styles.highlightColorChoice, active && styles.activeHighlightColorChoice, darkMode && styles.printDarkOptionChip]}
              >
                <View style={[styles.highlightColorSwatch, { backgroundColor: option.value }]} />
                <Text style={[styles.printOptionChipText, darkMode && styles.accountDarkText, active && styles.scriptureColorActiveText]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.printOptionsActions}>
          {!!status && <Text style={[styles.editorSettingsStatus, darkMode && styles.accountDarkMutedText]}>{status}</Text>}
          <Pressable onPress={onClose} style={[styles.printOptionsCancelButton, darkMode && styles.printDarkCancelButton]}>
            <Text style={[styles.printOptionsCancelText, darkMode && styles.homeDarkResumeButtonText]}>Cancel</Text>
          </Pressable>
          <Pressable onPress={saveColor} style={styles.editorSettingsSaveButton}>
            <Text style={styles.editorSettingsSaveText}>Save</Text>
          </Pressable>
        </View>
      </View>
    </View>
    </Modal>
  );
}

function WritingPromptChips({
  prompts,
  customPrompts = [],
  status,
  onInsert,
  onAddCustomPrompt,
  onRemoveCustomPrompt,
  compact = false,
  darkMode = false
}: {
  prompts: string[];
  customPrompts?: string[];
  status?: string;
  onInsert: (prompt: string) => void;
  onAddCustomPrompt?: (prompt: string) => boolean;
  onRemoveCustomPrompt?: (prompt: string) => void;
  compact?: boolean;
  darkMode?: boolean;
}) {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [promptsOpen, setPromptsOpen] = useState(!compact);
  const [draftPrompt, setDraftPrompt] = useState("");
  const customPromptSet = new Set(customPrompts);
  const panelOpen = !compact || promptsOpen || isCustomizing;

  useEffect(() => {
    if (!compact) setPromptsOpen(true);
  }, [compact]);

  if (!prompts.length && !onAddCustomPrompt) return null;

  const addPrompt = () => {
    const saved = onAddCustomPrompt?.(draftPrompt);
    if (saved) {
      setDraftPrompt("");
      setIsCustomizing(false);
    }
  };

  return (
    <View style={[styles.writingPromptBox, compact && styles.compactWritingPromptBox, darkMode && styles.accountDarkSection]}>
      <View style={[styles.writingPromptHeader, compact && styles.compactWritingPromptHeader]}>
        <Pressable
          disabled={!compact}
          onPress={() => setPromptsOpen((open) => !open)}
          style={[styles.writingPromptTitleButton, compact && styles.compactWritingPromptTitleButton]}
          accessibilityRole="button"
          accessibilityLabel={panelOpen ? "Hide note starters" : "Show note starters"}
        >
          <Text style={[styles.writingPromptLabel, darkMode && styles.studyDarkAccentText]}>Note starters</Text>
          {compact && (
            <Ionicons
              name={panelOpen ? "chevron-up-outline" : "chevron-down-outline"}
              size={16}
              color={darkMode ? "#e9b76a" : colors.oliveDark}
            />
          )}
        </Pressable>
        {!!onAddCustomPrompt && (
          <Pressable
            onPress={() => {
              setIsCustomizing((current) => !current);
              if (compact) setPromptsOpen(true);
            }}
            style={[styles.customizePromptButton, compact && styles.compactCustomizePromptButton]}
          >
            <Ionicons name={isCustomizing ? "close-outline" : "create-outline"} size={14} color={darkMode ? "#e9b76a" : colors.coral} />
            <Text style={styles.customizePromptText}>{isCustomizing ? "Close" : compact ? "Edit" : "Customize"}</Text>
          </Pressable>
        )}
      </View>
      {panelOpen && (
        <View style={[styles.writingPromptRow, compact && styles.compactWritingPromptRow]}>
          {prompts.map((prompt) => (
            <View key={prompt} style={[styles.writingPromptChip, compact && styles.compactWritingPromptChip, darkMode && styles.studyDarkMethodChip]}>
              <Pressable onPress={() => onInsert(prompt)} style={[styles.writingPromptInsert, compact && styles.compactWritingPromptInsert]}>
                {!compact && <Ionicons name="add-circle-outline" size={15} color={darkMode ? "#e9b76a" : colors.oliveDark} />}
                <Text style={[styles.writingPromptText, compact && styles.compactWritingPromptText, darkMode && styles.accountDarkText]} numberOfLines={compact ? 2 : 1}>{prompt}</Text>
              </Pressable>
              {customPromptSet.has(prompt) && !!onRemoveCustomPrompt && (
                <Pressable onPress={() => onRemoveCustomPrompt(prompt)} style={[styles.removePromptButton, compact && styles.compactRemovePromptButton]}>
                  <Ionicons name="close-outline" size={14} color={darkMode ? "#e9b76a" : colors.oliveDark} />
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}
      {isCustomizing && (
        <View style={styles.customPromptEditor}>
          <TextInput
            accessibilityLabel="Custom note starter phrase"
            value={draftPrompt}
            onChangeText={setDraftPrompt}
            placeholder="Add your own starter phrase"
            placeholderTextColor={darkMode ? "#8f8678" : undefined}
            style={[styles.customPromptInput, darkMode && styles.accountDarkInput]}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Add custom note starter phrase" onPress={addPrompt} style={styles.addPromptButton}>
            <Text style={styles.addPromptText}>Add</Text>
          </Pressable>
        </View>
      )}
      {!!status && <Text style={[styles.writingPromptStatus, darkMode && styles.accountDarkMutedText]}>{status}</Text>}
    </View>
  );
}


function CollapsibleStudyPanel({
  title,
  icon,
  collapsed,
  onToggle,
  style,
  darkMode = false,
  children
}: {
  title: string;
  icon: string;
  collapsed: boolean;
  onToggle: () => void;
  style: any;
  darkMode?: boolean;
  children: any;
}) {
  return (
    <View style={[style, darkMode && styles.accountDarkSection]}>
      <Pressable onPress={onToggle} style={styles.collapsiblePanelHeader}>
        <View style={[styles.feedbackHeader, styles.collapsiblePanelTitle]}>
          <Ionicons name={icon as any} size={18} color={darkMode ? "#e9b76a" : colors.coral} />
          <Text style={[styles.feedbackTitle, darkMode && styles.studyDarkAccentText]}>{title}</Text>
        </View>
        <Ionicons name={collapsed ? "chevron-down-outline" : "chevron-up-outline"} size={17} color={darkMode ? "#c8bda9" : colors.muted} />
      </Pressable>
      {!collapsed && children}
    </View>
  );
}

function verseMarkupKey(verse: BibleVerse) {
  return `${verse.book_name}:${verse.chapter}:${verse.verse}`;
}

function formatStudyVerseReferences(verses: BibleVerse[]) {
  if (!verses.length) return "";
  const first = verses[0];
  const sameChapter = verses.every((verse) => verse.book_name === first.book_name && verse.chapter === first.chapter);
  if (!sameChapter) return verses.map((verse) => `${verse.book_name} ${verse.chapter}:${verse.verse}`).join(", ");
  const verseNumbers = verses.map((verse) => verse.verse);
  return `${first.book_name} ${first.chapter}:${verseNumbers.join(", ")}`;
}

function localDayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildPassageMarkupRecords(markups: PassageMarkupMap, notes: PassageMarkupNoteMap, verses: BibleVerse[]): PassageMarkupRecord[] {
  const verseByKey = new Map(verses.map((verse) => [verseMarkupKey(verse), verse]));

  return Object.entries(markups)
    .map<PassageMarkupRecord | null>(([key, kind]) => {
      const verse = verseByKey.get(key);
      const option = PASSAGE_MARKUP_OPTIONS.find((item) => item.id === kind);
      if (!verse || !option) return null;
      const note = notes[key]?.trim();

      return {
        key,
        kind,
        label: option.label,
        ...(note ? { note } : {}),
        reference: `${normalizeBibleBookName(verse.book_name)} ${verse.chapter}:${verse.verse}`,
        verse: verse.verse
      };
    })
    .filter((item): item is PassageMarkupRecord => item !== null);
}

function markupRecordsToMap(records: PassageMarkupRecord[]): PassageMarkupMap {
  return records.reduce<PassageMarkupMap>((map, record) => {
    if (PASSAGE_MARKUP_OPTIONS.some((item) => item.id === record.kind)) map[record.key] = record.kind;
    return map;
  }, {});
}

function markupRecordsToNoteMap(records: PassageMarkupRecord[]): PassageMarkupNoteMap {
  return records.reduce<PassageMarkupNoteMap>((map, record) => {
    if (record.note?.trim()) map[record.key] = record.note;
    return map;
  }, {});
}

function studyKey(passage: string, methodId: string) {
  return `${(passage.trim() || "Selected passage").toLowerCase()}|${methodId}`;
}

function findTypedScriptureReference(text: string) {
  return findTypedScriptureReferenceMatch(text)?.reference || "";
}

function findTypedScriptureReferenceMatch(text: string) {
  return findTypedScriptureReferenceMatches(text).at(-1) || null;
}

function findTypedScriptureReferenceMatches(text: string) {
  const cleaned = stripNoteFormatting(text).replace(/[\u200B-\u200D\uFEFF]/g, "");
  const searchStart = Math.max(0, cleaned.length - 1500);
  const searchText = cleaned.slice(searchStart);
  const versePattern = /\d{1,3}:\d{1,3}(?:-\d{1,3})?/g;
  const verseMatches = Array.from(searchText.matchAll(versePattern));
  const results: { reference: string; typed: string; start: number; end: number }[] = [];

  for (const verseMatch of verseMatches) {
    const verseText = verseMatch[0];
    const verseStart = verseMatch.index || 0;
    const verseEnd = verseStart + verseText.length;
    const precedingText = searchText.slice(0, verseStart);
    const precedingTokens = Array.from(precedingText.matchAll(/[1-3]|[A-Za-z.]+/g)).map((tokenMatch) => ({
      text: tokenMatch[0],
      start: tokenMatch.index || 0,
      end: (tokenMatch.index || 0) + tokenMatch[0].length
    }));
    const recentTokens = precedingTokens.slice(-7);

    const candidates: { reference: string; typed: string; start: number; end: number }[] = [];

    for (let index = 0; index < recentTokens.length; index += 1) {
      const candidateTokens = recentTokens.slice(index);
      const candidateBook = candidateTokens.map((token) => token.text).join(" ");
      const typed = `${candidateBook} ${verseText}`;
      const parsed = parsePassageQuery(typed).reference;
      if (!parseBsbPassageReference(parsed)) continue;

      const matchStart = candidateTokens[0].start;
      candidates.push({
        reference: parsed,
        typed: searchText.slice(matchStart, verseEnd).trim(),
        start: searchStart + matchStart,
        end: searchStart + verseEnd
      });
    }

    const bestCandidate = candidates.sort((a, b) => b.start - a.start || b.typed.length - a.typed.length)[0];
    if (bestCandidate) results.push(bestCandidate);
  }

  return results;
}

function expandScriptureReference(currentAnswer: string, reference: string, verseText: string, useRichHtml = false, typedReference?: string) {
  const verseOnly = verseText.trim().replace(/\s+/g, " ");
  const plainExpansion = `*${reference} — "${verseOnly}"* `;
  const htmlExpansion = `<em>${escapeHtml(reference)} — "${escapeHtml(verseOnly)}"</em>&nbsp;`;
  const replaceTarget = typedReference?.trim() || reference;
  const referencePattern = new RegExp(`(${escapeRegExp(replaceTarget)})(?!\\s*[—-])`, "gi");
  const matches = Array.from(currentAnswer.matchAll(referencePattern));
  const latest = matches.at(-1);

  if (latest?.index !== undefined) {
    const expansion = useRichHtml || /<\/?[a-z][\s\S]*>/i.test(currentAnswer) ? htmlExpansion : plainExpansion;
    return `${currentAnswer.slice(0, latest.index)}${expansion}${currentAnswer.slice(latest.index + latest[0].length)}`;
  }

  if (useRichHtml || /<\/?[a-z][\s\S]*>/i.test(currentAnswer)) {
    return `${currentAnswer}<p>${htmlExpansion}</p>`;
  }

  return `${currentAnswer.trimEnd()}${currentAnswer.trim() ? "\n\n" : ""}${plainExpansion}`;
}

function plainScriptureExpansion(reference: string, verseText: string, settings: ScriptureInsertSettings = DEFAULT_SCRIPTURE_INSERT_SETTINGS) {
  const text = verseText.trim().replace(/\s+/g, " ");
  const content = settings.referencePosition === "end" ? `"${text}" — ${reference}` : `${reference} — "${text}"`;
  const styled = `${settings.bold ? "**" : ""}${settings.italic ? "*" : ""}${content}${settings.italic ? "*" : ""}${settings.bold ? "**" : ""}`;
  return `${styled} `;
}

function richScriptureExpansion(reference: string, verseText: string, settings: ScriptureInsertSettings = DEFAULT_SCRIPTURE_INSERT_SETTINGS) {
  const text = verseText.trim().replace(/\s+/g, " ");
  const content = settings.referencePosition === "end" ? `"${text}" — ${reference}` : `${reference} — "${text}"`;
  const style = settings.color ? ` data-scripture-color="${escapeHtml(settings.color)}" style="color: ${escapeHtml(settings.color)}"` : "";
  const wrapped = `${settings.bold ? "<strong>" : ""}${settings.italic ? "<em>" : ""}${escapeHtml(content)}${settings.italic ? "</em>" : ""}${settings.bold ? "</strong>" : ""}`;
  return `<span${style}>${wrapped}</span>&nbsp;`;
}

function getStoredScriptureInsertSettings(): ScriptureInsertSettings {
  if (Platform.OS !== "web" || typeof localStorage === "undefined") return DEFAULT_SCRIPTURE_INSERT_SETTINGS;
  try {
    const stored = localStorage.getItem(SCRIPTURE_INSERT_SETTINGS_KEY);
    if (!stored) return DEFAULT_SCRIPTURE_INSERT_SETTINGS;
    return normalizeScriptureInsertSettings(JSON.parse(stored));
  } catch {
    return DEFAULT_SCRIPTURE_INSERT_SETTINGS;
  }
}

function saveStoredScriptureInsertSettings(settings: ScriptureInsertSettings) {
  if (Platform.OS !== "web" || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SCRIPTURE_INSERT_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Settings are a convenience; editing should keep working even if storage is unavailable.
  }
}

function normalizeScriptureInsertSettings(value: Partial<ScriptureInsertSettings> | null | undefined): ScriptureInsertSettings {
  const colorOptions = new Set(SCRIPTURE_INSERT_COLOR_OPTIONS.map((option) => option.value));
  const highlightColorOptions = new Set(NOTE_HIGHLIGHT_COLOR_OPTIONS.map((option) => option.value));
  return {
    disabled: Boolean(value?.disabled),
    bold: Boolean(value?.bold),
    italic: value?.italic === undefined ? DEFAULT_SCRIPTURE_INSERT_SETTINGS.italic : Boolean(value.italic),
    color: value?.color && colorOptions.has(value.color) ? value.color : DEFAULT_SCRIPTURE_INSERT_SETTINGS.color,
    highlightColor: value?.highlightColor && highlightColorOptions.has(value.highlightColor) ? value.highlightColor : DEFAULT_SCRIPTURE_INSERT_SETTINGS.highlightColor,
    referencePosition: value?.referencePosition === "end" ? "end" : "front"
  };
}

function normalizeUiPreferences(value: unknown): UiPreferenceMap {
  if (!value || typeof value !== "object") return {};
  const source = value as Record<string, unknown>;
  const preferences: UiPreferenceMap = {};
  UI_PREFERENCE_KEYS.forEach((key) => {
    const item = source[key];
    if (key === "studyMethodId") {
      if (typeof item === "string" && methods.some((method) => method.id === item)) preferences[key] = item;
      return;
    }
    if (key === "studyStepIndex") {
      if (typeof item === "string" && /^\d{1,2}$/.test(item)) preferences[key] = item;
      return;
    }
    if (key === "memoryDueSort" || key === "memoryReviewedSort") {
      if (item === "oldest" || item === "newest") preferences[key] = item;
      return;
    }
    if (key === "bibleSearchScope") {
      if (item === "all" || item === "old" || item === "new") preferences[key] = item;
      return;
    }
    if (key === "bibleSearchMode") {
      if (isBibleSearchModeValue(item)) preferences[key] = item;
      return;
    }
    if (key === "bibleSearchBook") {
      if (typeof item === "string" && (item === "" || bibleBooks.includes(item))) preferences[key] = item;
      return;
    }
    if (key === "devotionalTextSize") {
      if (item === "normal" || item === "large" || item === "larger") preferences[key] = item;
      return;
    }
    if (key === "memoryView") {
      if (item === "review" || item === "browse" || item === "history") preferences[key] = item;
      return;
    }
    if (key === "memoryBrowseStatusFilter") {
      if (item === "all" || item === "due" || item === "learning" || item === "memorized") preferences[key] = item;
      return;
    }
    if (key === "memoryBookFilter") {
      if (item === "all" || (typeof item === "string" && bibleBooks.includes(item))) preferences[key] = item;
      return;
    }
    if (key === "memoryChapterFilter") {
      if (item === "all" || (typeof item === "string" && /^[A-Za-z0-9 .]+:\d{1,3}$/.test(item))) preferences[key] = item;
      return;
    }
    if (key === "memoryCollectionFilter") {
      if (typeof item === "string" && item.length <= 80 && !item.startsWith("$") && !item.startsWith("_")) preferences[key] = item.trim() || "all";
      return;
    }
    if (key === "plansOpenSections") {
      if (Array.isArray(item)) preferences[key] = normalizePlanSectionIds(item);
      return;
    }
    if (key === "plansExpandedPlanId") {
      if (typeof item === "string" && isSafePlanId(item)) preferences[key] = item;
      return;
    }
    if (key === "plansSelectedPlanDay") {
      if (typeof item === "string" && isSafePlanDaySelection(item)) preferences[key] = item;
      return;
    }
    if (key === "journalView") {
      if (item === "list" || item === "calendar" || item === "scripture") preferences[key] = item;
      return;
    }
    if (key === "journalFilter") {
      if (isJournalFilterValue(item)) preferences[key] = item;
      return;
    }
    if (key === "journalExpandedScriptureBook") {
      if (typeof item === "string" && (item === "" || bibleBooks.includes(item))) preferences[key] = item;
      return;
    }
    if (key === "journalSelectedScripture") {
      if (typeof item === "string" && (item === "" || isSafeJournalScriptureSelection(item))) preferences[key] = item;
      return;
    }
    if (key === "accountLegalSection") {
      if (item === "" || item === "privacy" || item === "terms") preferences[key] = item;
      return;
    }
    if (key === "printWorksheetMethodId") {
      if (typeof item === "string" && methods.some((method) => method.id === item)) preferences[key] = item;
      return;
    }
    if (key === "printWorksheetWritingSpace") {
      if (item === "standard" || item === "more") preferences[key] = item;
      return;
    }
    if (key === "printWorksheetIncludes") {
      if (Array.isArray(item)) preferences[key] = normalizePrintWorksheetIncludes(item);
      return;
    }
    if (key === "memoryPrintSet") {
      if (isMemoryPrintSetValue(item)) preferences[key] = item;
      return;
    }
    if (key === "memoryPrintLayout") {
      if (item === "pocket" || item === "large") preferences[key] = item;
      return;
    }
    if (key === "memoryPrintCopies") {
      if (typeof item === "string" && ["1", "2", "3", "4", "6"].includes(item)) preferences[key] = item;
      return;
    }
    if (key === "customWritingPrompts") {
      if (Array.isArray(item)) preferences[key] = normalizeCustomWritingPrompts(item);
      return;
    }
    if (key === "pinnedJournalEntryIds" || key === "rhythmGraceHandledDates") {
      if (Array.isArray(item)) {
        preferences[key] = Array.from(new Set(item.map((entryId) => (typeof entryId === "string" ? entryId.trim() : "")).filter(Boolean))).slice(0, 80);
      }
      return;
    }
    if (typeof item === "boolean") preferences[key] = item;
  });
  return preferences;
}

function uiBoolean(preferences: UiPreferenceMap, key: UiPreferenceKey) {
  return typeof preferences[key] === "boolean" ? preferences[key] as boolean : undefined;
}

function uiMemoryReviewSort(preferences: UiPreferenceMap, key: "memoryDueSort" | "memoryReviewedSort") {
  const value = preferences[key];
  return value === "newest" || value === "oldest" ? value : undefined;
}

function uiBibleSearchScope(preferences: UiPreferenceMap) {
  const value = preferences.bibleSearchScope;
  return value === "all" || value === "old" || value === "new" ? value : undefined;
}

function isBibleSearchModeValue(value: unknown): value is BibleSearchMode {
  return value === "word" ||
    value === "phrase" ||
    value === "allWords" ||
    value === "anyWords" ||
    value === "theme";
}

function uiBibleSearchMode(preferences: UiPreferenceMap) {
  const value = preferences.bibleSearchMode;
  return isBibleSearchModeValue(value) ? value : undefined;
}

function uiBibleSearchBook(preferences: UiPreferenceMap) {
  const value = preferences.bibleSearchBook;
  return typeof value === "string" && (value === "" || bibleBooks.includes(value)) ? value : undefined;
}

function uiDevotionalTextSize(preferences: UiPreferenceMap) {
  const value = preferences.devotionalTextSize;
  return value === "normal" || value === "large" || value === "larger" ? value : undefined;
}

function uiMemoryView(preferences: UiPreferenceMap) {
  const value = preferences.memoryView;
  return value === "review" || value === "browse" || value === "history" ? value : undefined;
}

function uiMemoryBrowseStatusFilter(preferences: UiPreferenceMap) {
  const value = preferences.memoryBrowseStatusFilter;
  return value === "all" || value === "due" || value === "learning" || value === "memorized" ? value : undefined;
}

function uiMemoryBookFilter(preferences: UiPreferenceMap) {
  const value = preferences.memoryBookFilter;
  return value === "all" || (typeof value === "string" && bibleBooks.includes(value)) ? value : undefined;
}

function uiMemoryChapterFilter(preferences: UiPreferenceMap) {
  const value = preferences.memoryChapterFilter;
  return value === "all" || (typeof value === "string" && /^[A-Za-z0-9 .]+:\d{1,3}$/.test(value)) ? value : undefined;
}

function uiMemoryCollectionFilter(preferences: UiPreferenceMap) {
  const value = preferences.memoryCollectionFilter;
  return typeof value === "string" && value.length <= 80 && !value.startsWith("$") && !value.startsWith("_") ? value : undefined;
}

function normalizePlanSectionIds(value: unknown[]) {
  const allowed = new Set(["custom", "short", "medium", "long"]);
  return Array.from(new Set(value.map((item) => (typeof item === "string" ? item.trim() : "")).filter((item) => allowed.has(item)))).slice(0, 4);
}

function isSafePlanId(value: string) {
  return /^[a-z0-9-]{1,80}$/i.test(value);
}

function isSafePlanDaySelection(value: string) {
  return /^[a-z0-9-]{1,80}:\d{1,4}$/i.test(value);
}

function uiPlanOpenSections(preferences: UiPreferenceMap) {
  const value = preferences.plansOpenSections;
  return Array.isArray(value) ? normalizePlanSectionIds(value) : undefined;
}

function uiPlanExpandedPlanId(preferences: UiPreferenceMap) {
  const value = preferences.plansExpandedPlanId;
  return typeof value === "string" && isSafePlanId(value) ? value : undefined;
}

function uiPlanSelectedDay(preferences: UiPreferenceMap) {
  const value = preferences.plansSelectedPlanDay;
  if (typeof value !== "string" || !isSafePlanDaySelection(value)) return undefined;
  const [planId, dayValue] = value.split(":");
  const day = Number.parseInt(dayValue, 10);
  return planId && Number.isFinite(day) && day > 0 ? { planId, day } : undefined;
}

function isJournalFilterValue(value: unknown): value is JournalFilter {
  return value === "all" ||
    value === "pinned" ||
    value === "drafts" ||
    value === "studies" ||
    value === "meditations" ||
    value === "checkins" ||
    value === "highlights" ||
    value === "reviews";
}

function uiJournalView(preferences: UiPreferenceMap) {
  const value = preferences.journalView;
  return value === "list" || value === "calendar" || value === "scripture" ? value : undefined;
}

function uiJournalFilter(preferences: UiPreferenceMap) {
  const value = preferences.journalFilter;
  return isJournalFilterValue(value) ? value : undefined;
}

function uiJournalExpandedScriptureBook(preferences: UiPreferenceMap) {
  const value = preferences.journalExpandedScriptureBook;
  return typeof value === "string" && (value === "" || bibleBooks.includes(value)) ? value : undefined;
}

function isSafeJournalScriptureSelection(value: string) {
  const separatorIndex = value.lastIndexOf(":");
  if (separatorIndex <= 0) return false;
  const book = value.slice(0, separatorIndex);
  const chapter = Number.parseInt(value.slice(separatorIndex + 1), 10);
  return bibleBooks.includes(book) && Number.isFinite(chapter) && chapter > 0 && chapter <= 200;
}

function uiJournalSelectedScripture(preferences: UiPreferenceMap) {
  const value = preferences.journalSelectedScripture;
  if (typeof value !== "string") return undefined;
  if (!value) return { book: "", chapter: 0 };
  if (!isSafeJournalScriptureSelection(value)) return undefined;
  const separatorIndex = value.lastIndexOf(":");
  return {
    book: value.slice(0, separatorIndex),
    chapter: Number.parseInt(value.slice(separatorIndex + 1), 10)
  };
}

function uiAccountLegalSection(preferences: UiPreferenceMap) {
  const value = preferences.accountLegalSection;
  return value === "" || value === "privacy" || value === "terms" ? value : undefined;
}

function normalizePrintWorksheetIncludes(value: unknown[]) {
  const allowed = new Set(["memory", "insight"]);
  return Array.from(new Set(value.map((item) => (typeof item === "string" ? item.trim() : "")).filter((item) => allowed.has(item)))).slice(0, 2);
}

function uiPrintWorksheetMethodId(preferences: UiPreferenceMap) {
  const value = preferences.printWorksheetMethodId;
  return typeof value === "string" && methods.some((method) => method.id === value) ? value : undefined;
}

function uiPrintWorksheetWritingSpace(preferences: UiPreferenceMap) {
  const value = preferences.printWorksheetWritingSpace;
  return value === "standard" || value === "more" ? value : undefined;
}

function uiPrintWorksheetIncludes(preferences: UiPreferenceMap) {
  const value = preferences.printWorksheetIncludes;
  if (!Array.isArray(value)) return undefined;
  const normalized = normalizePrintWorksheetIncludes(value);
  return {
    memory: normalized.includes("memory"),
    insight: normalized.includes("insight")
  };
}

function isMemoryPrintSetValue(value: unknown): value is MemoryPrintSet {
  return value === "due" ||
    value === "reviewed" ||
    value === "all" ||
    value === "current" ||
    value === "collection" ||
    value === "custom";
}

function uiMemoryPrintSet(preferences: UiPreferenceMap) {
  const value = preferences.memoryPrintSet;
  return isMemoryPrintSetValue(value) ? value : undefined;
}

function uiMemoryPrintLayout(preferences: UiPreferenceMap) {
  const value = preferences.memoryPrintLayout;
  return value === "pocket" || value === "large" ? value : undefined;
}

function uiMemoryPrintCopies(preferences: UiPreferenceMap) {
  const value = preferences.memoryPrintCopies;
  if (typeof value !== "string" || !["1", "2", "3", "4", "6"].includes(value)) return undefined;
  return Number.parseInt(value, 10);
}

function uiStudyMethodId(preferences: UiPreferenceMap) {
  const value = preferences.studyMethodId;
  return typeof value === "string" && methods.some((method) => method.id === value) ? value : undefined;
}

function uiStudyStepIndex(preferences: UiPreferenceMap, methodId: string) {
  const value = preferences.studyStepIndex;
  if (typeof value !== "string" || !/^\d{1,2}$/.test(value)) return undefined;
  const method = methods.find((item) => item.id === methodId) || methods[0];
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(0, Math.min(method.steps.length - 1, parsed));
}

function normalizeCustomWritingPrompts(value: unknown[]) {
  return Array.from(
    new Set(value.map((item) => (typeof item === "string" ? item.trim().replace(/\s+/g, " ") : "")).filter(Boolean))
  ).slice(0, 12);
}

function uiStringList(preferences: UiPreferenceMap, key: "pinnedJournalEntryIds" | "customWritingPrompts" | "rhythmGraceHandledDates") {
  const value = preferences[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : undefined;
}

function getScriptureMatchKey(match: { reference: string; from: number; to: number }) {
  return `${match.reference}|${match.from}|${match.to}`;
}

function replaceTypedReferenceBeforeIndex(value: string, typedReference: string, insertion: string, caretEnd: number) {
  const beforeCaret = value.slice(0, caretEnd);
  const typed = typedReference.trim();
  const start = typed ? beforeCaret.toLowerCase().lastIndexOf(typed.toLowerCase()) : -1;
  const replaceStart = start >= 0 ? start : Math.max(0, caretEnd - typed.length);
  const replaceEnd = start >= 0 ? start + typed.length : caretEnd;
  const nextValue = `${value.slice(0, replaceStart)}${insertion}${value.slice(replaceEnd)}`;
  const cursor = replaceStart + insertion.length;
  return {
    nextValue,
    nextSelection: { start: cursor, end: cursor }
  };
}

function rangeForTextBeforeCaret(root: any, caretRange: any, typedReference: string, documentRef: any) {
  const typed = typedReference.trim();
  if (!root || !caretRange || !typed || !documentRef) return null;

  if (caretRange.endContainer?.nodeType === 3) {
    const text = caretRange.endContainer.textContent || "";
    const localBeforeCaret = text.slice(0, caretRange.endOffset);
    const localStart = localBeforeCaret.toLowerCase().lastIndexOf(typed.toLowerCase());
    if (localStart >= 0) {
      const localRange = documentRef.createRange();
      localRange.setStart(caretRange.endContainer, localStart);
      localRange.setEnd(caretRange.endContainer, localStart + typed.length);
      return localRange;
    }
  }

  const beforeRange = documentRef.createRange();
  beforeRange.selectNodeContents(root);
  beforeRange.setEnd(caretRange.endContainer, caretRange.endOffset);
  const beforeText = beforeRange.toString();
  const startOffset = beforeText.toLowerCase().lastIndexOf(typed.toLowerCase());
  if (startOffset < 0) return null;

  const endOffset = startOffset + typed.length;
  const startPoint = domPointForTextOffset(root, startOffset, documentRef);
  const endPoint = domPointForTextOffset(root, endOffset, documentRef);
  if (!startPoint || !endPoint) return null;

  const range = documentRef.createRange();
  range.setStart(startPoint.node, startPoint.offset);
  range.setEnd(endPoint.node, endPoint.offset);
  return range;
}

function domPointForTextOffset(root: any, offset: number, documentRef: any) {
  const walker = documentRef.createTreeWalker(root, 4);
  let remaining = Math.max(0, offset);
  let node = walker.nextNode();
  let lastNode = null;

  while (node) {
    const length = node.textContent?.length || 0;
    if (remaining <= length) return { node, offset: remaining };
    remaining -= length;
    lastNode = node;
    node = walker.nextNode();
  }

  return lastNode ? { node: lastNode, offset: lastNode.textContent?.length || 0 } : null;
}

function insertHtmlAtSelection(html: string, documentRef: any, selection: any, root: any) {
  if (!documentRef || !selection?.rangeCount) return false;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return false;

  const template = documentRef.createElement("template");
  template.innerHTML = html;
  const fragment = template.content.cloneNode(true);
  const lastNode = fragment.lastChild;
  range.deleteContents();
  range.insertNode(fragment);

  if (lastNode) {
    const nextRange = documentRef.createRange();
    nextRange.setStartAfter(lastNode);
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);
  }

  root.normalize?.();
  return true;
}

function replaceTypedReferenceInEditorHtml(editor: any, typedReference: string, html: string) {
  const typed = typedReference.trim();
  if (!editor || !typed) return false;

  const currentHtml = editor.innerHTML || "";
  const pattern = new RegExp(escapeRegExp(escapeHtml(typed)), "gi");
  const matches = Array.from(currentHtml.matchAll(pattern)) as RegExpMatchArray[];
  const latest = matches.at(-1);
  if (!latest?.index && latest?.index !== 0) return false;

  editor.innerHTML = `${currentHtml.slice(0, latest.index)}${html}${currentHtml.slice(latest.index + latest[0].length)}`;
  moveCaretToEnd(editor);
  return true;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value: string | number | undefined | null) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function moveCaretToEnd(element: any) {
  const documentRef = (globalThis as any).document;
  const selection = (globalThis as any).getSelection?.();
  if (!documentRef || !selection) return;

  const range = documentRef.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function readActiveNoteFormats(editor?: any): NoteFormatKind[] {
  const documentRef = (globalThis as any).document;
  if (!documentRef?.queryCommandState) return [];

  const selection = (globalThis as any).getSelection?.();
  if (!selection?.anchorNode || !editor?.contains?.(selection.anchorNode)) return [];

  const formats: NoteFormatKind[] = [];
  if (documentRef.queryCommandState("bold")) formats.push("bold");
  if (documentRef.queryCommandState("italic")) formats.push("italic");
  if (documentRef.queryCommandState("underline")) formats.push("underline");
  if (documentRef.queryCommandState("insertUnorderedList")) formats.push("bullet");
  if (closestNoteHighlight(selection.anchorNode, editor)) formats.push("highlight");

  return formats;
}

function toggleNoteHighlight(editor: any) {
  const documentRef = (globalThis as any).document;
  const selection = (globalThis as any).getSelection?.();
  if (!documentRef || !selection?.rangeCount) return false;

  const range = selection.getRangeAt(0);
  if (!editor?.contains?.(range.commonAncestorContainer)) return false;

  if (range.collapsed) {
    const activeHighlight = closestNoteHighlight(range.startContainer, editor);
    if (activeHighlight) {
      unwrapElement(activeHighlight);
      editor.normalize?.();
      return false;
    }
    return false;
  }

  const highlightedElements = findSelectedNoteHighlights(editor, range);
  if (highlightedElements.length > 0) {
    const lastHighlight = highlightedElements[highlightedElements.length - 1];
    const fallbackParent = lastHighlight.parentNode || editor;
    const nextNode = lastHighlight.nextSibling;
    highlightedElements.forEach(unwrapElement);
    selection.removeAllRanges();
    const afterRange = documentRef.createRange();
    if (nextNode?.parentNode) {
      afterRange.setStartBefore(nextNode);
    } else {
      afterRange.selectNodeContents(fallbackParent);
      afterRange.collapse(false);
    }
    afterRange.collapse(true);
    selection.addRange(afterRange);
    editor.normalize?.();
    return false;
  }

  const mark = documentRef.createElement("mark");
  mark.style.backgroundColor = "#f4dfb6";
  mark.style.borderRadius = "4px";
  mark.style.padding = "0 2px";

  try {
    mark.appendChild(range.extractContents());
    range.insertNode(mark);
    selection.removeAllRanges();
    const afterRange = documentRef.createRange();
    afterRange.setStartAfter(mark);
    afterRange.collapse(true);
    selection.addRange(afterRange);
    editor.normalize?.();
    return true;
  } catch {
    documentRef.execCommand?.("backColor", false, "#f4dfb6");
    return true;
  }
}

function findSelectedNoteHighlights(editor: any, range: any) {
  const documentRef = (globalThis as any).document;
  const highlights = new Set<any>();
  const addHighlightAncestors = (node: any) => {
    let element = node?.nodeType === 1 ? node : node?.parentElement;
    while (element && element !== editor) {
      if (isNoteHighlightElement(element)) highlights.add(element);
      element = element.parentElement;
    }
  };

  addHighlightAncestors(range.startContainer);
  addHighlightAncestors(range.endContainer);

  const walker = documentRef?.createTreeWalker?.(editor, (globalThis as any).NodeFilter?.SHOW_ELEMENT);
  let node = walker?.nextNode?.();
  while (node) {
    if (isNoteHighlightElement(node) && range.intersectsNode?.(node)) highlights.add(node);
    node = walker.nextNode();
  }

  return Array.from(highlights);
}

function isNoteHighlightElement(element: any) {
  if (!element || element.nodeType !== 1) return false;
  const style = (globalThis as any).getComputedStyle?.(element);
  const color = `${element.style?.backgroundColor || ""} ${style?.backgroundColor || ""}`.toLowerCase().replace(/\s+/g, "");
  return element.tagName?.toLowerCase() === "mark" || color.includes("rgb(244,223,182)") || color.includes("#f4dfb6");
}

function closestNoteHighlight(node: any, editor: any) {
  let element = node?.nodeType === 1 ? node : node?.parentElement;
  while (element && element !== editor) {
    if (isNoteHighlightElement(element)) return element;
    element = element.parentElement;
  }
  return null;
}

function unwrapElement(element: any) {
  const parent = element?.parentNode;
  if (!parent) return;
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }
  parent.removeChild(element);
}

function buildPassagePresets(methodId: string) {
  if (methodId === "lectio") return ["Psalm 46:10", "John 15:4-5", "Matthew 11:28-30"];
  if (methodId === "inductive") return ["Mark 4:35-41", "Ephesians 2:1-10", "James 1:2-8"];
  if (methodId === "soap") return ["Philippians 4:4-9", "Romans 12:1-2", "Psalm 121"];
  if (methodId === "read") return ["James 1:22-25", "Psalm 1", "Matthew 7:24-27"];
  if (methodId === "hear") return ["Psalm 23:1-4", "Isaiah 41:10", "John 10:27-30"];
  if (methodId === "coma") return ["Philippians 4:6-9", "Colossians 3:1-4", "1 Peter 1:3-9"];
  return ["Psalm 23", "John 3:16-18", "Romans 8:1-4"];
}

function buildStudyWritingPrompts(methodId: string, stepTitle: string, customPrompts: string[] = []) {
  const title = stepTitle.toLowerCase();
  const promptsByMethod: Record<string, Record<string, string[]>> = {
    oia: {
      observe: ["I notice...", "The repeated word is...", "The main action is..."],
      interpret: ["This passage teaches...", "This shows me that God...", "Because of this, I understand..."],
      apply: ["Today I will...", "I need to trust God with...", "One practical response is..."]
    },
    soap: {
      observation: ["I notice...", "The phrase that stands out is...", "This shows..."],
      application: ["I can apply this by...", "This speaks to my...", "Today I need to..."],
      prayer: ["Lord, thank You for...", "Please help me...", "Teach me to..."]
    },
    inductive: {
      divide: ["Verses ... focus on...", "This section changes when...", "A good section label is..."],
      mark: ["A key detail is...", "This matters because...", "I see a contrast between..."],
      ask: ["Why does the passage...?", "How does this show...?", "A first answer might be..."],
      summarize: ["The main point is...", "This passage teaches that...", "Because..., therefore..."]
    },
    lectio: {
      meditate: ["The phrase I am holding is...", "This brings up...", "I sense God inviting me to..."],
      pray: ["God, I bring You...", "Help me receive...", "I ask for grace to..."],
      rest: ["Today I will carry...", "The truth I want to remember is...", "I can rest in..."]
    },
    read: {
      explore: ["I noticed...", "This stands out because...", "The main movement is..."],
      apply: ["This applies to...", "I need to receive...", "This challenges me to..."],
      do: ["Today I will...", "One concrete response is...", "Before the day ends I will..."]
    },
    hear: {
      explain: ["This means...", "In my own words...", "The passage shows..."],
      apply: ["This speaks to...", "I see this in my life when...", "The invitation here is..."],
      respond: ["Lord, help me...", "Thank You for...", "I respond by..."]
    },
    coma: {
      context: ["In context...", "This passage sits within...", "The situation appears to be..."],
      observation: ["I notice...", "A repeated idea is...", "The contrast is..."],
      meaning: ["This passage means...", "The main point is...", "This teaches that..."],
      application: ["Because of this...", "I can respond by...", "This changes how I..."]
    }
  };

  const methodPrompts = promptsByMethod[methodId] || {};
  const matchingKey = Object.keys(methodPrompts).find((key) => title.includes(key));
  return Array.from(new Set([...(matchingKey ? methodPrompts[matchingKey] : []), ...customPrompts]));
}

function buildJournalGuideText(filter: JournalFilter, highlightCount: number) {
  if (filter === "reviews") return "Scheduled study reviews bring older notes back so you can notice what has changed.";
  if (filter === "highlights") {
    return highlightCount > 0
      ? "Highlights are saved from marked passage text. Open one to revisit the study or create a reflection."
      : "Highlight verses while studying, then save the study or draft to collect them here.";
  }
  if (filter === "drafts") return "Drafts are studies you started but have not completed yet.";
  if (filter === "studies") return "Studies are completed study sessions with your answers, notes, and highlights.";
  if (filter === "meditations") return "Meditations are saved reflections from slowing down with a memory verse.";
  if (filter === "checkins") return "Encouragements include community updates and saved highlight reflections.";
  if (filter === "pinned") return "Pinned entries stay at the top of your saved work for quick review.";
  return "Use the filters to narrow your journal, or search for a passage, answer, highlight note, or reflection.";
}

function getJournalEntryIcon(status: string): keyof typeof Ionicons.glyphMap {
  const normalized = status.toLowerCase();
  if (normalized.includes("meditation")) return "sparkles-outline";
  if (normalized.includes("encouragement")) return "chatbubbles-outline";
  if (normalized.includes("reflection")) return "color-wand-outline";
  if (normalized.includes("review")) return "refresh-circle-outline";
  return "reader-outline";
}

function groupJournalEntriesByRecency(entries: any[]) {
  const today = dateKeyFromTimestamp(Date.now());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = dateKeyFromTimestamp(yesterdayDate.getTime());
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoTime = new Date(weekAgo.getFullYear(), weekAgo.getMonth(), weekAgo.getDate()).getTime();
  const groups: { title: string; entries: any[] }[] = [
    { title: "Today", entries: [] },
    { title: "Yesterday", entries: [] },
    { title: "This week", entries: [] },
    { title: "Older", entries: [] }
  ];

  entries.forEach((entry) => {
    const timestamp = journalEntryTimestamp(entry);
    const key = dateKeyFromTimestamp(timestamp);
    if (key === today) {
      groups[0].entries.push(entry);
    } else if (key === yesterday) {
      groups[1].entries.push(entry);
    } else if (timestamp >= weekAgoTime) {
      groups[2].entries.push(entry);
    } else {
      groups[3].entries.push(entry);
    }
  });

  return groups.filter((group) => group.entries.length > 0);
}

function isStudyReviewDue(entry: { reviewAt?: number }) {
  return !!entry.reviewAt && entry.reviewAt <= Date.now();
}

function formatReviewDate(value?: number) {
  if (!value) return "not scheduled";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function journalEntryTimestamp(entry: any) {
  return entry?.createdAt || entry?.completedAt || entry?.updatedAt || Date.now();
}

function formatJournalCreatedDate(entry: any) {
  return new Date(journalEntryTimestamp(entry)).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function dateKeyFromTimestamp(value: number) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatJournalDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function matchesJournalDateFilter(entry: any, dateKey: string) {
  if (!dateKey) return true;
  return dateKeyFromTimestamp(journalEntryTimestamp(entry)) === dateKey;
}

function startOfMonth(value: number) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
}

function addMonths(monthStart: number, amount: number) {
  const date = new Date(monthStart);
  return new Date(date.getFullYear(), date.getMonth() + amount, 1).getTime();
}

function buildJournalCalendarItems({
  drafts,
  highlights,
  entries,
  pinnedEntryIds
}: {
  drafts: any[];
  highlights: HighlightJournalEntry[];
  entries: any[];
  pinnedEntryIds: Set<string>;
}): JournalCalendarItem[] {
  return [
    ...drafts.map((draft) => ({
      id: `draft:${draft._id}`,
      title: draft.passageReference || draft.passage || "Draft study",
      status: "Draft",
      timestamp: journalEntryTimestamp(draft)
    })),
    ...highlights.map((item) => ({
      id: item.id,
      title: item.passage,
      status: item.source === "draft" ? "Draft highlights" : "Highlights",
      timestamp: item.createdAt
    })),
    ...entries.map((entry) => {
      return {
        id: `entry:${entry._id}`,
        title: entry.passage || (isHighlightReflection(entry) ? "Highlight reflection" : "Encouragement"),
        status: entry.answers ? (isMemoryMeditationEntry(entry) ? "Meditation" : "Study") : isHighlightReflection(entry) ? "Reflection" : "Encouragement",
        timestamp: journalEntryTimestamp(entry)
      };
    })
  ].map((item) => ({
    ...item,
    dateKey: dateKeyFromTimestamp(item.timestamp)
  }));
}

function buildJournalCalendarCells(monthStart: number, items: JournalCalendarItem[]) {
  const month = new Date(monthStart);
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.dateKey] = (acc[item.dateKey] || 0) + 1;
    return acc;
  }, {});

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dateKey = dateKeyFromTimestamp(date.getTime());
    return {
      dateKey,
      day: date.getDate(),
      inMonth: date.getMonth() === month.getMonth(),
      count: counts[dateKey] || 0
    };
  });
}

function buildJournalScriptureItems({
  drafts,
  highlights,
  entries,
  pinnedEntryIds
}: {
  drafts: any[];
  highlights: HighlightJournalEntry[];
  entries: any[];
  pinnedEntryIds: Set<string>;
}): JournalScriptureItem[] {
  const sourceItems = [
    ...drafts.map((draft) => ({
      id: `draft:${draft._id}`,
      title: draft.passageReference || draft.passage || "Draft study",
      status: "Draft",
      timestamp: journalEntryTimestamp(draft),
      references: journalReferenceTextForItem(draft, "draft")
    })),
    ...highlights.map((item) => ({
      id: item.id,
      title: item.passage,
      status: item.source === "draft" ? "Draft highlights" : "Highlights",
      timestamp: item.createdAt,
      references: journalReferenceTextForItem(item, "highlight")
    })),
    ...entries.map((entry) => {
      return {
        id: `entry:${entry._id}`,
        title: entry.passage || (isHighlightReflection(entry) ? "Highlight reflection" : "Encouragement"),
        status: entry.answers ? (isMemoryMeditationEntry(entry) ? "Meditation" : "Study") : isHighlightReflection(entry) ? "Reflection" : "Encouragement",
        timestamp: journalEntryTimestamp(entry),
        references: journalReferenceTextForItem(entry, "entry")
      };
    })
  ];

  return sourceItems.flatMap((item) =>
    parseJournalScriptureLocations(item.references).map((location) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      timestamp: item.timestamp,
      ...location
    }))
  );
}

function buildJournalScriptureBookSections(items: JournalScriptureItem[]) {
  const locationMap = new Map<string, { book: string; chapter: number; entryIds: Set<string>; verses: Set<number> }>();

  items.forEach((item) => {
    const key = `${item.book}:${item.chapter}`;
    const existing = locationMap.get(key) || { book: item.book, chapter: item.chapter, entryIds: new Set<string>(), verses: new Set<number>() };
    existing.entryIds.add(item.id);
    item.verses.forEach((verse) => existing.verses.add(verse));
    locationMap.set(key, existing);
  });

  const chapterMap = Array.from(locationMap.values()).reduce<Record<string, { chapter: number; entryCount: number; verseCount: number }[]>>(
    (map, item) => {
      if (!map[item.book]) map[item.book] = [];
      map[item.book].push({
        chapter: item.chapter,
        entryCount: item.entryIds.size,
        verseCount: item.verses.size
      });
      return map;
    },
    {}
  );

  const buildSection = (title: string, books: string[]) => ({
    title,
    books: books
      .filter((book) => chapterMap[book]?.length)
      .map((book) => ({
        book,
        chapters: chapterMap[book].sort((a, b) => a.chapter - b.chapter)
      }))
  });

  return [
    buildSection("Old Testament", OLD_TESTAMENT_BOOKS),
    buildSection("New Testament", NEW_TESTAMENT_BOOKS)
  ].filter((section) => section.books.length > 0);
}

function countJournalScriptureEntries(items: JournalScriptureItem[], book: string, chapter: number) {
  return new Set(items.filter((item) => item.book === book && item.chapter === chapter).map((item) => item.id)).size;
}

function matchesJournalScriptureFilter(entry: any, book: string, chapter: number, source: "draft" | "highlight" | "entry") {
  if (!book || !chapter) return true;
  return parseJournalScriptureLocations(journalReferenceTextForItem(entry, source)).some(
    (location) => location.book === book && location.chapter === chapter
  );
}

function journalReferenceTextForItem(entry: any, source: "draft" | "highlight" | "entry") {
  if (source === "highlight") {
    return [
      entry.passage,
      ...(entry.markups || []).flatMap((markup: any) => [markup.reference])
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    entry.passage,
    entry.passageReference,
    isHighlightReflection(entry) ? parseHighlightReflectionNote(entry.note || "").passage : "",
    ...(entry.passageMarkups || []).flatMap((markup: any) => [markup.reference])
  ]
    .filter(Boolean)
    .join(" ");
}

function parseJournalScriptureLocations(text: string) {
  if (!text.trim()) return [];

  const bookPattern = Array.from(new Set([...bibleBooks, "Psalm"]))
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|");
  const referencePattern = new RegExp(`\\b(${bookPattern})\\s+(\\d{1,3})(?::(\\d{1,3})(?:-(\\d{1,3}))?)?`, "gi");
  const locations = new Map<string, { book: string; chapter: number; verses: number[] }>();
  let match: RegExpExecArray | null;

  while ((match = referencePattern.exec(text)) !== null) {
    const book = displayBibleBookName(normalizeBibleBookName(match[1]));
    const chapter = Number(match[2]);
    const maxChapter = BIBLE_CHAPTER_COUNTS[book] || 0;
    if (!chapter || (maxChapter && chapter > maxChapter)) continue;

    const startVerse = match[3] ? Number(match[3]) : 0;
    const endVerse = match[4] ? Number(match[4]) : startVerse;
    const verses = startVerse ? buildVerseRange(startVerse, endVerse) : [];
    const key = `${book}:${chapter}`;
    const existing = locations.get(key) || { book, chapter, verses: [] };
    existing.verses = Array.from(new Set([...existing.verses, ...verses])).sort((a, b) => a - b);
    locations.set(key, existing);
  }

  return Array.from(locations.values());
}

function buildHighlightJournalEntries(sessions: any[], drafts: any[], searchTerm: string): HighlightJournalEntry[] {
  return [
    ...sessions.map((entry) => ({
      id: `study:${entry._id}`,
      passage: entry.passage || entry.passageReference || "Saved study",
      methodName: entry.methodName || "Study",
      createdAt: entry.completedAt || entry.createdAt,
      markups: entry.passageMarkups || [],
      source: "study" as const,
      entry
    })),
    ...drafts.map((entry) => ({
      id: `draft:${entry._id}`,
      passage: entry.passageReference || entry.passage || "Draft study",
      methodName: entry.methodName || "Draft",
      createdAt: entry.updatedAt || entry.createdAt,
      markups: entry.passageMarkups || [],
      source: "draft" as const,
      entry
    }))
  ]
    .map((item) => ({
      ...item,
      markups: item.markups.filter((markup: PassageMarkupRecord) => matchesHighlightSearch(item, markup, searchTerm))
    }))
    .filter((item) => item.markups.length > 0)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function countSavedHighlights(sessions: any[], drafts: any[]) {
  return [...sessions, ...drafts].reduce((total, entry) => total + (entry.passageMarkups?.length || 0), 0);
}

function buildHighlightReflectionNote(item: HighlightJournalEntry, insight: string, prayer: string, nextStep: string) {
  const highlightedReferences = item.markups.map((markup) => `${markup.reference} (${markup.label})`).join(", ");

  return buildStructuredHighlightReflectionNote({
    passage: item.passage,
    highlights: highlightedReferences,
    keyInsight: insight,
    prayer,
    nextStep
  });
}

function buildStructuredHighlightReflectionNote({
  passage,
  highlights,
  keyInsight,
  prayer,
  nextStep
}: {
  passage: string;
  highlights: string;
  keyInsight: string;
  prayer: string;
  nextStep: string;
}) {
  const sections = [
    passage.trim() ? `Passage: ${passage.trim()}` : "",
    highlights.trim() ? `Highlights: ${highlights.trim()}` : "",
    keyInsight.trim() ? `Key insight: ${keyInsight.trim()}` : "",
    prayer.trim() ? `Prayer: ${prayer.trim()}` : "",
    nextStep.trim() ? `Next step: ${nextStep.trim()}` : ""
  ];

  return sections.filter(Boolean).join("\n\n");
}

function isHighlightReflection(entry: any) {
  return entry.mood === "Highlight reflection";
}

function isMemoryMeditationEntry(entry: any) {
  return entry?.methodId === "memory-meditation" || entry?.methodName === "Memory Meditation";
}

function parseHighlightReflectionNote(note: string) {
  const parsed = {
    passage: "",
    highlights: "",
    keyInsight: "",
    prayer: "",
    nextStep: ""
  };

  note.split(/\n{2,}/).forEach((section) => {
    const [rawLabel, ...rest] = section.split(":");
    const value = rest.join(":").trim();
    const label = rawLabel.trim().toLowerCase();
    if (!value) return;

    if (label === "passage") parsed.passage = value;
    if (label === "highlights") parsed.highlights = value;
    if (label === "key insight") parsed.keyInsight = value;
    if (label === "prayer") parsed.prayer = value;
    if (label === "next step") parsed.nextStep = value;
  });

  return parsed;
}

function matchesHighlightSearch(entry: Omit<HighlightJournalEntry, "markups">, markup: PassageMarkupRecord, searchTerm: string) {
  if (!searchTerm) return true;

  return [entry.passage, entry.methodName, markup.kind, markup.label, markup.reference, markup.note]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(searchTerm);
}

function matchesJournalSearch(entry: any, searchTerm: string) {
  if (!searchTerm) return true;

  const searchable = [
    entry.passage,
    entry.passageReference,
    entry.methodName,
    entry.methodId,
    entry.shareNote,
    entry.mood,
    entry.note,
    ...(entry.answers || []).flatMap((item: any) => [item.stepTitle, item.answer]),
    ...(entry.passageMarkups || []).flatMap((item: any) => [item.kind, item.label, item.reference, item.note]),
    ...(entry.coachingMoments || []).flatMap((item: any) => [item.stepTitle, item.encouragement, item.textGrounding, item.nextRevision])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(searchTerm);
}

function sortMemoryReviewVerses(verses: any[], sectionTitle: string, sortOrder: MemoryReviewSort) {
  const direction = sortOrder === "oldest" ? 1 : -1;
  const timestampForSort = (verse: any) =>
    verse.nextReviewAt || verse.lastReviewedAt || verse.updatedAt || verse.createdAt || 0;

  return [...verses].sort((a, b) =>
    (timestampForSort(a) - timestampForSort(b)) * direction ||
    String(a.reference || "").localeCompare(String(b.reference || ""))
  );
}

function buildCoachingFeedback(methodId: string, stepTitle: string, answer: string) {
  const trimmed = answer.trim();
  if (!trimmed) return [];

  const lowerStep = stepTitle.toLowerCase();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const sentenceCount = trimmed.split(/[.!?]+/).filter((item) => item.trim().length > 0).length;
  const hasTextAnchor = hasAnyPattern(trimmed, [
    /\bverse\b/i,
    /\bpassage\b/i,
    /\bscripture\b/i,
    /\bi notice\b/i,
    /\bi noticed\b/i,
    /\bstands out\b/i,
    /\bsays\b/i,
    /\bshows\b/i,
    /\bteaches\b/i,
    /\bmeans\b/i,
    /["'][^"']+["']/,
    /\b(v|vv|verse|verses)\.?\s*\d+/i
  ]);
  const hasMeaningBridge = hasAnyPattern(trimmed, [/\bbecause\b/i, /\btherefore\b/i, /\bso that\b/i, /\bthis means\b/i, /\bthis shows\b/i, /\bthis teaches\b/i, /\breveals\b/i]);
  const hasAction = hasAnyPattern(trimmed, [/\btoday\b/i, /\bthis week\b/i, /\bi will\b/i, /\bi can\b/i, /\bi need to\b/i, /\bi am going to\b/i, /\bask\b/i, /\bchoose\b/i, /\bstop\b/i, /\bstart\b/i, /\bpractice\b/i]);
  const isPrayerful = hasAnyPattern(trimmed, [/\bgod\b/i, /\blord\b/i, /\bfather\b/i, /\bjesus\b/i, /\bholy spirit\b/i, /\bamen\b/i]);
  const hasQuestion = /\?/.test(trimmed) || hasAnyPattern(trimmed, [/\bwhy\b/i, /\bhow\b/i, /\bwhat does\b/i, /\bwhat is\b/i]);
  const feedback: string[] = [];

  if (wordCount < 8) feedback.push("This is a good start. Add one concrete detail so future you can remember what stood out.");
  if (wordCount >= 8 && wordCount <= 45) feedback.push(pickCoachingLine(trimmed, [
    "Good pace. You are keeping this focused enough to revisit later.",
    "This is clear and usable. One small text detail could make it even stronger.",
    "You are building a thoughtful note without overcomplicating it."
  ]));
  if (wordCount > 90) feedback.push("Strong engagement. Consider tightening this to the clearest one or two insights before moving on.");

  if (methodId === "soap") {
    addSoapCoaching(lowerStep, trimmed, feedback, { hasTextAnchor, hasAction, isPrayerful });
  } else if (methodId === "oia") {
    addOiaCoaching(lowerStep, trimmed, feedback, { hasTextAnchor, hasMeaningBridge, hasAction });
  } else if (methodId === "inductive") {
    addInductiveCoaching(lowerStep, trimmed, feedback, { hasTextAnchor, hasMeaningBridge, hasQuestion, sentenceCount });
  } else if (methodId === "lectio") {
    addLectioCoaching(lowerStep, trimmed, feedback, { hasTextAnchor, isPrayerful, sentenceCount });
  } else if (methodId === "read") {
    addReadCoaching(lowerStep, trimmed, feedback, { hasTextAnchor, hasMeaningBridge, hasAction });
  } else if (methodId === "hear") {
    addHearCoaching(lowerStep, trimmed, feedback, { hasTextAnchor, hasMeaningBridge, hasAction, isPrayerful });
  } else if (methodId === "coma") {
    addComaCoaching(lowerStep, trimmed, feedback, { hasTextAnchor, hasMeaningBridge, hasAction });
  } else if (lowerStep.includes("observe") || lowerStep.includes("observation") || lowerStep.includes("mark")) {
    if (/today i|i will|i can apply|my life|for me/i.test(trimmed)) {
      feedback.push("This sounds like application. Save that thought, then add one detail that is directly visible in the passage.");
    } else {
      feedback.push("Good direction: this stays close to the text. Try naming a repeated word, action, image, or contrast.");
    }
  } else if (lowerStep.includes("interpret") || lowerStep.includes("summarize")) {
    if (!/because|therefore|teaches|means|shows/i.test(trimmed)) {
      feedback.push("Try connecting your answer to meaning with a phrase like “This teaches...” or “This shows...”.");
    } else {
      feedback.push("Good: you are moving from observation toward meaning. Make sure one phrase from the passage supports it.");
    }
  } else if (lowerStep.includes("apply") || lowerStep.includes("application")) {
    if (!/today|will|can|this week|next|pray|ask|choose|stop|start/i.test(trimmed)) {
      feedback.push("Make this more actionable by naming what you will do and when you will do it.");
    } else {
      feedback.push("Good: this is becoming specific. Keep it doable enough for the next 24 hours.");
    }
  } else if (lowerStep.includes("pray") || lowerStep.includes("prayer")) {
    if (!/god|lord|father|jesus/i.test(trimmed)) {
      feedback.push("Consider turning this directly toward God in plain prayer language.");
    } else {
      feedback.push("Good: this reads like honest prayer rather than a summary about prayer.");
    }
  } else if (methodId === "lectio") {
    feedback.push("Stay with one word or phrase. The goal here is prayerful attention, not covering every detail.");
  } else {
    feedback.push("Good work. Before moving on, ask whether this answer is tied to the passage and clear enough to revisit later.");
  }

  return Array.from(new Set(feedback)).slice(0, 3);
}

function addSoapCoaching(
  lowerStep: string,
  answer: string,
  feedback: string[],
  checks: { hasTextAnchor: boolean; hasAction: boolean; isPrayerful: boolean }
) {
  if (lowerStep.includes("observation")) {
    if (!checks.hasTextAnchor) feedback.push("For SOAP observation, name one word, image, command, or contrast from the Scripture itself.");
    else feedback.push("Good SOAP observation. You are letting the Scripture lead before moving to personal application.");
    if (/i will|today|my life|apply/i.test(answer)) feedback.push("This may be application. Keep it handy, but first write what the passage says.");
    return;
  }

  if (lowerStep.includes("application")) {
    if (!checks.hasAction) feedback.push("For SOAP application, make this personal and concrete: what will you believe, change, or do today?");
    else feedback.push("Good SOAP application. It is moving from the passage toward a real response.");
    return;
  }

  if (lowerStep.includes("prayer")) {
    if (!checks.isPrayerful) feedback.push("Turn this directly toward God with simple prayer language, not just thoughts about prayer.");
    else feedback.push("Good prayerful response. Keep it honest, specific, and connected to your application.");
  }
}

function addOiaCoaching(
  lowerStep: string,
  answer: string,
  feedback: string[],
  checks: { hasTextAnchor: boolean; hasMeaningBridge: boolean; hasAction: boolean }
) {
  if (lowerStep.includes("observe")) {
    if (/i think this means|this teaches|therefore|i will/i.test(answer)) feedback.push("You may be moving ahead. In Observation, stay with details you can point to in the passage.");
    else if (!checks.hasTextAnchor) feedback.push("Try adding one visible detail: a repeated word, action, speaker, contrast, promise, or command.");
    else feedback.push("Good observation. You are staying close to what is actually in the text.");
    return;
  }

  if (lowerStep.includes("interpret")) {
    if (!checks.hasMeaningBridge) feedback.push("For Interpretation, connect your point with meaning using a phrase like 'This shows...' or 'This teaches...'.");
    else feedback.push("Good interpretation. Now make sure one observation from the passage supports that meaning.");
    return;
  }

  if (lowerStep.includes("apply")) {
    if (!checks.hasAction) feedback.push("For Application, make the response concrete enough to act on in the next 24 hours.");
    else feedback.push("Good application. It is specific enough to become more than a general idea.");
  }
}

function addInductiveCoaching(
  lowerStep: string,
  answer: string,
  feedback: string[],
  checks: { hasTextAnchor: boolean; hasMeaningBridge: boolean; hasQuestion: boolean; sentenceCount: number }
) {
  if (lowerStep.includes("divide")) {
    if (!/\b\d+\b|verse|verses|vv/i.test(answer)) feedback.push("For dividing the passage, include verse numbers or small section labels so the structure is easy to follow.");
    else feedback.push("Good structure. Section labels make the passage easier to study and teach later.");
    return;
  }

  if (lowerStep.includes("mark")) {
    if (!checks.hasTextAnchor) feedback.push("Mark one concrete detail from the passage: a repeated word, command, promise, contrast, or strong verb.");
    else feedback.push("Good inductive detail. Now ask why that detail matters in the flow of the passage.");
    return;
  }

  if (lowerStep.includes("question")) {
    if (!checks.hasQuestion) feedback.push("Add at least one real question from the text, especially a 'why' or 'how' question.");
    else feedback.push("Good question. Try writing a first-pass answer from nearby clues before using outside sources.");
    return;
  }

  if (lowerStep.includes("summarize")) {
    if (!checks.hasMeaningBridge || checks.sentenceCount > 3) feedback.push("For the summary, aim for one or two sentences that explain the main claim of the passage.");
    else feedback.push("Good summary. It is beginning to gather the passage into one clear main point.");
  }
}

function addLectioCoaching(
  lowerStep: string,
  answer: string,
  feedback: string[],
  checks: { hasTextAnchor: boolean; isPrayerful: boolean; sentenceCount: number }
) {
  if (lowerStep.includes("meditate")) {
    if (!checks.hasTextAnchor) feedback.push("For Lectio, choose one phrase from the passage and stay with what it stirs in you.");
    else feedback.push("Good Lectio rhythm. You are lingering with a phrase instead of trying to cover everything.");
    return;
  }

  if (lowerStep.includes("pray")) {
    if (!checks.isPrayerful) feedback.push("Let this become direct prayer: speak to God from the phrase that stood out.");
    else feedback.push("Good. This sounds like prayerful response, not just analysis.");
    return;
  }

  if (lowerStep.includes("rest")) {
    if (checks.sentenceCount > 2) feedback.push("For Rest, simplify this to one truth you can carry quietly through the day.");
    else feedback.push("Good simplicity. Lectio often ends best with one received truth.");
  }
}

function addReadCoaching(
  lowerStep: string,
  answer: string,
  feedback: string[],
  checks: { hasTextAnchor: boolean; hasMeaningBridge: boolean; hasAction: boolean }
) {
  if (lowerStep.includes("explore")) {
    if (!checks.hasTextAnchor) feedback.push("For Explore, name the word, phrase, command, warning, promise, or image that stood out.");
    else if (!checks.hasMeaningBridge) feedback.push("Good noticing. Add why it matters in the passage before moving to action.");
    else feedback.push("Good exploring. You are noticing and beginning to explain why it matters.");
    return;
  }

  if (lowerStep.includes("apply")) {
    if (!/this applies|my|i\b/i.test(answer)) feedback.push("For Apply, connect the passage to one real area of your own life.");
    else feedback.push("Good application. You are making the passage personal without skipping the text.");
    return;
  }

  if (lowerStep.includes("do")) {
    if (!checks.hasAction) feedback.push("For Do, write one small action you can actually take today.");
    else feedback.push("Good next step. Keep it small enough that you can obey it today.");
  }
}

function addHearCoaching(
  lowerStep: string,
  answer: string,
  feedback: string[],
  checks: { hasTextAnchor: boolean; hasMeaningBridge: boolean; hasAction: boolean; isPrayerful: boolean }
) {
  if (lowerStep.includes("explain")) {
    if (!checks.hasTextAnchor) feedback.push("For Explain, include the phrase you highlighted and one clue from the surrounding passage.");
    else if (!checks.hasMeaningBridge) feedback.push("Good phrase choice. Now explain what it means in plain words.");
    else feedback.push("Good explanation. You are grounding the phrase before applying it.");
    return;
  }

  if (lowerStep.includes("apply")) {
    if (!checks.hasAction && !/my|me|i\b/i.test(answer)) feedback.push("For Apply, name where this phrase touches your actual day, fear, habit, relationship, or hope.");
    else feedback.push("Good personal connection. The highlighted phrase is beginning to speak into real life.");
    return;
  }

  if (lowerStep.includes("respond")) {
    if (!checks.isPrayerful && !checks.hasAction) feedback.push("For Respond, turn this into either a short prayer or one concrete act of obedience.");
    else feedback.push("Good response. You are letting the passage move you toward God or action.");
  }
}

function addComaCoaching(
  lowerStep: string,
  answer: string,
  feedback: string[],
  checks: { hasTextAnchor: boolean; hasMeaningBridge: boolean; hasAction: boolean }
) {
  if (lowerStep.includes("context")) {
    if (!/context|before|after|speaker|audience|letter|poem|story|teaching/i.test(answer)) feedback.push("For Context, note the setting, speaker, audience, nearby flow, or type of writing.");
    else feedback.push("Good context. This will help your meaning and application stay grounded.");
    return;
  }

  if (lowerStep.includes("observation")) {
    if (!checks.hasTextAnchor) feedback.push("For Observation, list details the passage actually says before deciding what it means.");
    else feedback.push("Good observation. COMA works best when meaning grows from details like these.");
    return;
  }

  if (lowerStep.includes("meaning")) {
    if (!checks.hasMeaningBridge) feedback.push("For Meaning, state the main point with language like 'This passage means...' or 'This teaches...'.");
    else feedback.push("Good meaning statement. Make sure it flows from context and observation.");
    return;
  }

  if (lowerStep.includes("application")) {
    if (!checks.hasAction) feedback.push("For Application, choose one wise response for today or this week.");
    else feedback.push("Good application. It is concrete enough to carry out.");
  }
}

function hasAnyPattern(value: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(value));
}

function pickCoachingLine(seed: string, lines: string[]) {
  const total = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return lines[total % lines.length];
}

function getCurrentAnswerSelection(
  answer: string,
  forcedSelection: { start: number; end: number } | null | undefined,
  currentSelection: { start: number; end: number },
  rememberedSelection: { start: number; end: number }
) {
  const length = answer.length;
  const candidates = [forcedSelection, currentSelection, rememberedSelection].filter(Boolean) as { start: number; end: number }[];
  const selectedRange = candidates
    .map((selection) => ({
      start: Math.max(0, Math.min(length, Math.min(selection.start, selection.end))),
      end: Math.max(0, Math.min(length, Math.max(selection.start, selection.end)))
    }))
    .find((selection) => selection.start !== selection.end);

  if (selectedRange) return selectedRange;

  const cursor = Math.max(0, Math.min(length, currentSelection.end));
  return { start: cursor, end: cursor };
}

function formatPlainNoteValue(answer: string, kind: NoteFormatKind, selection: { start: number; end: number }) {
  if (kind === "undo" || kind === "redo") {
    const cursor = Math.max(0, Math.min(answer.length, selection.end));
    return { nextValue: answer, nextSelection: { start: cursor, end: cursor } };
  }

  const length = answer.length;
  const start = Math.max(0, Math.min(length, Math.min(selection.start, selection.end)));
  const end = Math.max(0, Math.min(length, Math.max(selection.start, selection.end)));
  const selectedText = answer.slice(start, end);

  if (kind === "bullet") {
    const insertion = selectedText
      ? selectedText
          .split("\n")
          .map((line) => (line.trim() ? (line.trimStart().startsWith("- ") ? line : `- ${line}`) : line))
          .join("\n")
      : "- ";
    const nextValue = `${answer.slice(0, start)}${insertion}${answer.slice(end)}`;
    const cursor = start + insertion.length;
    return { nextValue, nextSelection: { start: cursor, end: cursor } };
  }

  const formatConfig = {
    bold: { open: "**", close: "**", placeholder: "bold note" },
    italic: { open: "*", close: "*", placeholder: "italic note" },
    underline: { open: "__", close: "__", placeholder: "underlined note" },
    highlight: { open: "==", close: "==", placeholder: "highlighted note" }
  }[kind];
  const text = selectedText || formatConfig.placeholder;
  const insertion = `${formatConfig.open}${text}${formatConfig.close}`;
  const nextValue = `${answer.slice(0, start)}${insertion}${answer.slice(end)}`;
  const cursor = selectedText ? start + insertion.length : start + formatConfig.open.length + text.length;
  return { nextValue, nextSelection: { start: cursor, end: cursor } };
}

function buildReaderStudyReference(book: string, chapter: number, selectedVerses: number[]) {
  const referenceBook = normalizeBibleBookName(book);
  if (!selectedVerses.length) return `${referenceBook} ${chapter}`;

  const sorted = [...selectedVerses].sort((a, b) => a - b);
  const start = sorted[0];
  const end = sorted[sorted.length - 1];
  return start === end ? `${referenceBook} ${chapter}:${start}` : `${referenceBook} ${chapter}:${start}-${end}`;
}

const MEMORY_SINGLE_TEXT_LIMIT = 4800;
const MEMORY_COLLECTION_PROMPT_VERSE_THRESHOLD = 12;
const MEMORY_COLLECTION_SECTION_VERSE_LIMIT = 6;
const MEMORY_COLLECTION_SECTION_TEXT_LIMIT = 900;

function shouldOfferMemoryCollectionSplit(verses: BibleVerse[]) {
  if (verses.length <= 1) return false;
  if (verses.map((verse) => verse.text.trim()).join(" ").length > MEMORY_SINGLE_TEXT_LIMIT) return true;
  const chapterKeys = new Set(verses.map((verse) => `${verse.book_name}:${verse.chapter}`));
  return verses.length > MEMORY_COLLECTION_PROMPT_VERSE_THRESHOLD || chapterKeys.size > 1;
}

function canSaveMemorySelectionAsSingle(verses: BibleVerse[]) {
  return verses.map((verse) => verse.text.trim()).join(" ").length <= MEMORY_SINGLE_TEXT_LIMIT;
}

function splitMemorySelectionIntoSections(verses: BibleVerse[]) {
  const sections: BibleVerse[][] = [];
  let current: BibleVerse[] = [];
  let currentTextLength = 0;

  verses.forEach((verse) => {
    const verseTextLength = verse.text.trim().length;
    const previous = current[current.length - 1];
    const chapterChanged = previous && (previous.book_name !== verse.book_name || previous.chapter !== verse.chapter);
    const sectionFull = current.length >= MEMORY_COLLECTION_SECTION_VERSE_LIMIT;
    const sectionTooLong = current.length > 0 && currentTextLength + verseTextLength > MEMORY_COLLECTION_SECTION_TEXT_LIMIT;

    if (chapterChanged || sectionFull || sectionTooLong) {
      sections.push(current);
      current = [];
      currentTextLength = 0;
    }

    current.push(verse);
    currentTextLength += verseTextLength;
  });

  if (current.length) sections.push(current);
  return sections;
}

function buildMemorySectionReference(verses: BibleVerse[]) {
  return buildMemoryReference(verses);
}

function defaultMemoryCollectionName(reference: string, verses: BibleVerse[]) {
  if (!verses.length) return `${reference} Memory`;
  const books = Array.from(new Set(verses.map((verse) => normalizeBibleBookName(verse.book_name))));
  const chapters = Array.from(new Set(verses.map((verse) => verse.chapter))).sort((a, b) => a - b);
  if (books.length === 1 && chapters.length === 1) return `${books[0]} ${chapters[0]}`;
  if (books.length === 1 && chapters.length > 1) return `${books[0]} ${chapters[0]}-${chapters[chapters.length - 1]}`;
  return reference.replace(/:\d+.*$/, "").trim() || `${reference} Memory`;
}

function shortBibleTranslationName(name?: string) {
  const normalized = (name || "").toLowerCase();
  if (normalized.includes("berean")) return "BSB";
  if (normalized.includes("world english")) return "WEB";
  if (normalized.includes("king james")) return "KJV";
  return name || "";
}

function normalizeSyncedBibleReaderState(value: unknown): SyncedBibleReaderState | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, any>;
  const translation = source.translation === "web" || source.translation === "kjv" || source.translation === "bsb"
    ? source.translation as BibleTranslationId
    : undefined;
  const position = source.position && typeof source.position === "object" && bibleBooks.includes(source.position.book)
    ? {
        book: source.position.book,
        chapter: Math.min(Math.max(Math.round(Number(source.position.chapter) || 1), 1), BIBLE_CHAPTER_COUNTS[source.position.book] || 1)
      }
    : undefined;
  const history = Array.isArray(source.history)
    ? source.history
        .map((item: any): StoredBibleReaderHistoryItem | null => {
          const itemTranslation = item?.translation === "web" || item?.translation === "kjv" || item?.translation === "bsb" ? item.translation : undefined;
          if (!item || typeof item.book !== "string" || !bibleBooks.includes(item.book) || !itemTranslation) return null;
          const chapterCount = BIBLE_CHAPTER_COUNTS[item.book] || 1;
          return {
            book: item.book,
            chapter: Math.min(Math.max(Math.round(Number(item.chapter) || 1), 1), chapterCount),
            reference: String(item.reference || `${item.book} ${item.chapter || 1}`).slice(0, 120),
            translation: itemTranslation,
            updatedAt: String(item.updatedAt || new Date().toISOString()).slice(0, 40)
          };
        })
        .filter((item): item is StoredBibleReaderHistoryItem => !!item)
        .slice(0, 12)
    : undefined;
  const readChapters = source.readChapters && typeof source.readChapters === "object" && !Array.isArray(source.readChapters)
    ? Object.entries(source.readChapters).reduce<StoredBibleReadChapters>((map, [book, chapters]) => {
        if (!bibleBooks.includes(book) || !Array.isArray(chapters)) return map;
        const chapterCount = BIBLE_CHAPTER_COUNTS[book] || 1;
        const normalized = Array.from(new Set(chapters.map((chapter) => Math.round(Number(chapter) || 0)).filter((chapter) => chapter >= 1 && chapter <= chapterCount))).sort((a, b) => a - b);
        if (normalized.length) map[book] = normalized;
        return map;
      }, {})
    : undefined;
  const bookmarks = Array.isArray(source.bookmarks)
    ? source.bookmarks
        .map((bookmark: any): StoredBibleBookmark | null => {
          if (!bookmark || typeof bookmark.book !== "string" || !bibleBooks.includes(bookmark.book) || typeof bookmark.reference !== "string") return null;
          const chapterCount = BIBLE_CHAPTER_COUNTS[bookmark.book] || 1;
          const chapter = Math.min(Math.max(Math.round(Number(bookmark.chapter) || 1), 1), chapterCount);
          return {
            id: String(bookmark.id || `${bookmark.book}-${chapter}-${bookmark.startVerse || "chapter"}`).slice(0, 160),
            book: bookmark.book,
            chapter,
            ...(Number.isFinite(Number(bookmark.startVerse)) ? { startVerse: Math.max(1, Math.round(Number(bookmark.startVerse))) } : {}),
            ...(Number.isFinite(Number(bookmark.endVerse)) ? { endVerse: Math.max(1, Math.round(Number(bookmark.endVerse))) } : {}),
            reference: bookmark.reference.slice(0, 120),
            bookmarked: bookmark.bookmarked === false ? false : undefined,
            ...(typeof bookmark.note === "string" && bookmark.note.trim() ? { note: bookmark.note.trim().slice(0, 1200) } : {}),
            createdAt: String(bookmark.createdAt || new Date().toISOString()).slice(0, 40)
          };
        })
        .filter((bookmark): bookmark is StoredBibleBookmark => !!bookmark)
        .filter((bookmark) => bookmark.bookmarked !== false || !!bookmark.note?.trim())
        .slice(0, 30)
    : undefined;
  const readingPlanProgress = normalizeBibleReadingPlanProgress(source.readingPlanProgress);

  const state: SyncedBibleReaderState = {};
  if (translation) state.translation = translation;
  if (position) state.position = position;
  if (history) state.history = history;
  if (readChapters) state.readChapters = readChapters;
  if (bookmarks) state.bookmarks = bookmarks;
  if (readingPlanProgress) state.readingPlanProgress = readingPlanProgress;
  return Object.keys(state).length ? state : null;
}

function hasLocalBibleReaderState(state: Pick<SyncedBibleReaderState, "history" | "readChapters" | "bookmarks" | "readingPlanProgress">) {
  return !!(
    state.history?.length ||
    Object.values(state.readChapters || {}).some((chapters) => chapters.length > 0) ||
    state.bookmarks?.length ||
    hasBibleReadingPlanProgress(state.readingPlanProgress)
  );
}

function isReaderVerseBookmarked(verse: number, bookmarks: StoredBibleBookmark[], book: string, chapter: number) {
  return bookmarks.some((bookmark) => {
    if (bookmark.book !== book || bookmark.chapter !== chapter || !bookmark.startVerse || bookmark.bookmarked === false) return false;
    return verse >= bookmark.startVerse && verse <= (bookmark.endVerse || bookmark.startVerse);
  });
}

function isReaderVerseBookmarkNoted(verse: number, bookmarks: StoredBibleBookmark[], book: string, chapter: number) {
  return bookmarks.some((bookmark) => {
    if (bookmark.book !== book || bookmark.chapter !== chapter || !bookmark.startVerse || !bookmark.note?.trim()) return false;
    return verse >= bookmark.startVerse && verse <= (bookmark.endVerse || bookmark.startVerse);
  });
}

function buildVerseRange(startVerse: number, endVerse: number) {
  const start = Math.min(startVerse, endVerse);
  const end = Math.max(startVerse, endVerse);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function pickResumeStepIndex(answers: { stepId?: string; stepTitle?: string; answer: string }[], requestedIndex: number, methodId: string) {
  const selectedMethod = methods.find((item) => item.id === methodId) || methods[0];
  const currentIndexForSavedAnswer = (savedIndex: number) => {
    const saved = answers[savedIndex];
    if (!saved) return -1;
    const byId = saved.stepId ? selectedMethod.steps.findIndex((step) => step.id === saved.stepId) : -1;
    if (byId >= 0) return byId;
    const byTitle = saved.stepTitle ? selectedMethod.steps.findIndex((step) => step.title === saved.stepTitle) : -1;
    return byTitle >= 0 ? byTitle : Math.min(savedIndex, selectedMethod.steps.length - 1);
  };

  if (answers[requestedIndex]?.answer?.trim()) return Math.max(0, currentIndexForSavedAnswer(requestedIndex));

  for (let index = Math.min(requestedIndex, answers.length - 1); index >= 0; index -= 1) {
    if (answers[index]?.answer?.trim()) return Math.max(0, currentIndexForSavedAnswer(index));
  }

  const firstAnswered = answers.findIndex((item) => item.answer.trim());
  return Math.max(0, currentIndexForSavedAnswer(firstAnswered));
}

function formatQuietTimer(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function buildCommunityMessage({
  partner,
  senderName,
  checkinNote
}: {
  partner: string;
  senderName?: string;
  checkinNote: string;
}) {
  const greeting = partner.trim() ? `${partner.trim()}, here is my Bible study encouragement:` : "Here is my Bible study encouragement:";
  const note = checkinNote.trim() || "I studied today and want to keep the rhythm going.";
  const signedBy = senderName?.trim() ? `From: ${senderName.trim()}` : "";

  return [greeting, note, signedBy].filter(Boolean).join("\n");
}

function formatNameList(names: string[]) {
  const cleaned = names.map((name) => name.trim()).filter(Boolean);
  if (cleaned.length <= 2) return cleaned.join(" and ");
  return `${cleaned.slice(0, -1).join(", ")}, and ${cleaned[cleaned.length - 1]}`;
}

function buildStudyInsightShareMessage({
  passageReference,
  methodName,
  insight
}: {
  passageReference: string;
  methodName: string;
  insight: string;
}) {
  return [`Bible study insight`, `Passage: ${passageReference}`, `Method: ${methodName}`, "", insight.trim()].join("\n");
}

function stripNoteFormatting(text: string) {
  return text
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/==([^=]+)==/g, "$1")
    .replace(/^\s*-\s+/gm, "");
}



function richHtmlToMarkupText(text: string) {
  if (!/<\/?[a-z][\s\S]*>/i.test(text)) return text;

  return sanitizeEditorHtml(text)
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**")
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*")
    .replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, "__$1__")
    .replace(/<(mark)[^>]*>([\s\S]*?)<\/\1>/gi, "==$2==")
    .replace(/<span[^>]*(background-color|background)[^>]*>([\s\S]*?)<\/span>/gi, "==$2==")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|ul|ol)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
