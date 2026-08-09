import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { api } from "@/convex/_generated/api";
import { catchUpBibleReadingPlanDatesState, completeBibleReadingPlanDayState, createCustomBibleReadingPlanState, deleteCustomBibleReadingPlanState, followBibleReadingPlanState, stopFollowingBibleReadingPlanState, uncompleteBibleReadingPlanDayState } from "@/data/bibleReadingPlanActions";
import { fetchBibleApiPassage, fetchBiblePlanReadingPassage, fetchBsbPassage, parseBsbPassageReference, parsePassageQuery, type BiblePassage, type BibleVerse } from "@/data/biblePassage";
import { BIBLE_CHAPTER_COUNTS, NEW_TESTAMENT_BOOKS, OLD_TESTAMENT_BOOKS, bibleBooks, displayBibleBookName, normalizeBibleBookName } from "@/data/bibleLibrary";
import { bibleReadingPlans, getBibleReadingPlanDetails, readerBookFromReferenceBook, type BibleReadingPlan, type BibleReadingPlanDay } from "@/data/bibleReadingPlans";
import { MAX_CUSTOM_BIBLE_READING_PLANS, MAX_FOLLOWED_BIBLE_READING_PLANS, bibleReadingPlanDayKey, emptyBibleReadingPlanProgress, hasBibleReadingPlanProgress, normalizeBibleReadingPlanProgress, type StoredBibleReadingPlanProgress } from "@/data/bibleReadingPlanProgress";
import { buildBibleReadingPlanView } from "@/data/bibleReadingPlanView";
import { bibleSearchModeLabel, buildBibleSearchBookOptions, buildBibleSearchQueries, buildBibleSearchSections, dedupeBibleSearchResults, fetchBibleSearchResults, filterBibleSearchResultsForMode, formatSearchDuration, rankBibleSearchResults, type BibleSearchMode, type BibleSearchResult, type BibleSearchScope } from "@/data/bibleSearch";
import { getDeviceKey } from "@/data/deviceKey";
import { getActiveCheckinPartnerId, getPinnedJournalEntries, getStoredAppearanceMode, getStoredBibleBookmarks, getStoredBibleReadChapters, getStoredBibleReaderHistory, getStoredBibleReaderPosition, getStoredBibleReadingPlanProgress, getStoredBibleTranslation, getStoredCheckinPartners, getStoredCollapsedStudyPanels, getStoredCustomWritingPrompts, getStoredMemoryReviewSorts, getStoredStudyFocusMode, getStoredTutorCoachingEnabled, saveActiveCheckinPartnerId, savePinnedJournalEntries, saveStoredAppearanceMode, saveStoredBibleBookmarks, saveStoredBibleReadChapters, saveStoredBibleReaderHistory, saveStoredBibleReaderPosition, saveStoredBibleReadingPlanProgress, saveStoredBibleTranslation, saveStoredCheckinPartners, saveStoredCollapsedStudyPanels, saveStoredCustomWritingPrompts, saveStoredMemoryReviewSorts, saveStoredStudyFocusMode, saveStoredTutorCoachingEnabled, type StoredAppearanceMode, type StoredBibleBookmark, type StoredBibleReadChapters, type StoredBibleReaderHistoryItem, type StoredCheckinPartner, type StoredMemoryReviewSort } from "@/data/feedbackPreferences";
import { getContextHelp } from "@/data/help";
import { LEGAL_LAST_UPDATED, PRIVACY_POLICY_SECTIONS, TERMS_OF_SERVICE_SECTIONS } from "@/data/legal";
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
import { useAction, useMutation, useQuery } from "convex/react";
import { Component, Suspense, createElement, lazy, useEffect, useMemo, useRef, useState, type Dispatch, type ErrorInfo, type ReactNode, type SetStateAction } from "react";
import { Alert, Animated, Easing, Image, Keyboard, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";

type Tab = "home" | "study" | "bible" | "plans" | "methods" | "memory" | "accountability" | "journal" | "account" | "help" | "admin";
const tabs: Tab[] = ["home", "study", "bible", "plans", "methods", "memory", "accountability", "journal", "account", "help", "admin"];
const publicUrlTabs = new Set<Tab>(["home", "study", "bible", "plans", "methods", "memory", "help"]);
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

function HomeSemanticResourceLinks() {
  if (Platform.OS !== "web") return null;

  const links = [
    ["/?tab=bible", "Open the Bible reader", "Read Scripture, follow reading plans, and print selected passages."],
    ["/?tab=study", "Start a guided study", "Use SOAP, OIA, inductive study, word study, and other guided methods."],
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
        background: "#fffaf2",
        border: "1px solid #eadcc9",
        borderRadius: 16,
        marginTop: 18,
        padding: 18
      }
    },
    createElement("h1", { style: hiddenHeadingStyle }, "Bible Study Tutor free Bible study app"),
    createElement(
      "h2",
      {
        id: "home-resource-links-heading",
        style: { color: colors.oliveDark, fontSize: 20, lineHeight: 1.2, margin: "0 0 8px" }
      },
      "Start with what you need"
    ),
    createElement(
      "p",
      { style: { color: colors.muted, fontSize: 15, lineHeight: 1.55, margin: "0 0 14px" } },
      "Bible Study Tutor is free, privacy-aware, and built for desktop, mobile, and printable Bible study."
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
              background: "#fffdf8",
              border: "1px solid #eadcc9",
              borderRadius: 12,
              color: colors.oliveDark,
              display: "grid",
              gap: 4,
              padding: 12,
              textDecoration: "none"
            }
          },
          createElement("strong", { style: { fontSize: 14 } }, label),
          createElement("span", { style: { color: colors.muted, fontSize: 13, lineHeight: 1.35 } }, description)
        )
      )
    )
  );
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

class TabErrorBoundary extends Component<TabErrorBoundaryProps, TabErrorBoundaryState> {
  state: TabErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Bible Study Tutor section failed to render", error, info.componentStack);
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
type StudyReviewPreset = "tomorrow" | "three-days" | "next-week" | "next-month";
type StudySidePanelKey = "community" | "plan" | "feedback" | "helps";
type UiPreferenceKey =
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
  | "communityPeoplePanelCollapsed"
  | "communityFriendsPanelOpen"
  | "communityCirclesPanelOpen"
  | "communityFriendToolsOpen"
  | "communityCircleToolsOpen"
  | "communityRecentExpanded";
type UiPreferenceMap = Partial<Record<UiPreferenceKey, boolean>>;
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
  "communityPeoplePanelCollapsed",
  "communityFriendsPanelOpen",
  "communityCirclesPanelOpen",
  "communityFriendToolsOpen",
  "communityCircleToolsOpen",
  "communityRecentExpanded"
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

export default function Home() {
  const { width, height } = useWindowDimensions();
  const ensureProfile = useMutation(api.study.ensureProfile);
  const saveSession = useMutation(api.study.saveSession);
  const scheduleStudyReviewMutation = useMutation(api.study.scheduleStudyReview);
  const completeStudyReviewMutation = useMutation(api.study.completeStudyReview);
  const saveDraft = useMutation(api.study.saveDraft);
  const deleteDraftMutation = useMutation(api.study.deleteDraft);
  const deleteSessionMutation = useMutation(api.study.deleteSession);
  const savePlan = useMutation(api.accountability.savePlan);
  const saveAccountSettings = useMutation(api.accountability.saveAccountSettings);
  const saveScriptureInsertSettings = useMutation((api as any).accountability.saveScriptureInsertSettings);
  const saveUiPreference = useMutation((api as any).accountability.saveUiPreference);
  const saveMemoryMilestoneGoals = useMutation((api as any).accountability.saveMemoryMilestoneGoals);
  const saveBibleReaderState = useMutation((api as any).accountability.saveBibleReaderState);
  const changePassword = useAction(api.accountability.changePassword);
  const saveCheckin = useMutation(api.accountability.saveCheckin);
  const deleteCheckinMutation = useMutation(api.accountability.deleteCheckin);
  const updateCheckin = useMutation(api.accountability.updateCheckin);
  const createCommunityCircle = useMutation((api as any).community.createCircle);
  const joinCommunityCircle = useMutation((api as any).community.joinCircle);
  const inviteCommunityFriend = useMutation((api as any).community.inviteFriendByEmail);
  const inviteCommunityFriendByCode = useMutation((api as any).community.inviteFriendByCode);
  const ensureCommunityFriendCode = useMutation((api as any).community.ensureFriendCode);
  const acceptCommunityFriend = useMutation((api as any).community.acceptFriend);
  const removeCommunityFriend = useMutation((api as any).community.removeFriend);
  const shareCheckinToCircle = useMutation((api as any).community.shareCheckin);
  const shareStudyInsightToCommunity = useMutation((api as any).community.shareInsight);
  const reactToCommunityPost = useMutation((api as any).community.reactToPost);
  const removeCommunityPost = useMutation((api as any).community.removePost);
  const updateCommunityPost = useMutation((api as any).community.updatePost);
  const leaveCommunityCircle = useMutation((api as any).community.leaveCircle);
  const deleteCommunityCircle = useMutation((api as any).community.deleteCircle);
  const saveMemoryVerse = useMutation(api.memory.saveVerse);
  const recordMemoryPractice = useMutation(api.memory.recordPractice);
  const removeMemoryVerse = useMutation(api.memory.remove);
  const scheduleMemoryReview = useMutation((api as any).memory.scheduleReview);
  const updateMemoryCollections = useMutation((api as any).memory.updateCollections);
  const recordMemoryHistoryEvent = useMutation((api as any).memory.recordHistoryEvent);
  const submitFeedback = useMutation((api as any).insights.submitFeedback);
  const recordUsage = useMutation((api as any).insights.recordUsage);
  const markFeedbackStatus = useMutation((api as any).insights.markFeedbackStatus);
  const requestAccountDeletion = useMutation((api as any).insights.requestAccountDeletion);
  const cancelAccountDeletionRequest = useMutation((api as any).insights.cancelAccountDeletionRequest);
  const approveDeletionRequestAsAdmin = useMutation((api as any).insights.approveDeletionRequestAsAdmin);
  const cancelDeletionRequestAsAdmin = useMutation((api as any).insights.cancelDeletionRequestAsAdmin);
  const cleanupEmptyLocalProfilesAsAdmin = useMutation((api as any).insights.cleanupEmptyLocalProfilesAsAdmin);
  const setProfileSuspensionAsAdmin = useMutation((api as any).insights.setProfileSuspensionAsAdmin);
  const markProfileSecurityReviewedAsAdmin = useMutation((api as any).insights.markProfileSecurityReviewedAsAdmin);
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
  const [studyStepAnchorY, setStudyStepAnchorY] = useState(0);
  const [studyFocusMode, setStudyFocusMode] = useState(false);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [answerSelection, setAnswerSelection] = useState({ start: 0, end: 0 });
  const [lastAnswerSelection, setLastAnswerSelection] = useState({ start: 0, end: 0 });
  const [detectedScriptureReference, setDetectedScriptureReference] = useState("");
  const [detectedScriptureTypedReference, setDetectedScriptureTypedReference] = useState("");
  const [scriptureInsertStatus, setScriptureInsertStatus] = useState("");
  const [scriptureInsertFocusKey, setScriptureInsertFocusKey] = useState(0);
  const [customWritingPrompts, setCustomWritingPrompts] = useState<string[]>([]);
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
  const [passageMarkups, setPassageMarkups] = useState<PassageMarkupMap>({});
  const [passageMarkupNotes, setPassageMarkupNotes] = useState<PassageMarkupNoteMap>({});
  const [selectedVerseKeys, setSelectedVerseKeys] = useState<string[]>([]);
  const [memoryStatus, setMemoryStatus] = useState("");
  const [memoryView, setMemoryView] = useState<MemoryView>("review");
  const [dueMemoryReviewSort, setDueMemoryReviewSort] = useState<MemoryReviewSort>("oldest");
  const [reviewedMemoryReviewSort, setReviewedMemoryReviewSort] = useState<MemoryReviewSort>("oldest");
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
  const [saveStatus, setSaveStatus] = useState("Not saved yet");
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
  const [savedStudySummary, setSavedStudySummary] = useState<SavedStudySummary | null>(null);
  const [shareInsightStatus, setShareInsightStatus] = useState("");
  const [shareInsightTargetType, setShareInsightTargetType] = useState<"friend" | "circle">("friend");
  const [shareInsightFriendIds, setShareInsightFriendIds] = useState<any[]>([]);
  const [shareInsightCircleId, setShareInsightCircleId] = useState<any>(null);
  const [shareInsightTargetPickerOpen, setShareInsightTargetPickerOpen] = useState(false);
  const [shareInsightPostedReady, setShareInsightPostedReady] = useState(false);
  const [passageQuery, setPassageQuery] = useState("Psalm 23");
  const [showCoaching, setShowCoaching] = useState(true);
  const [collapsedStudyPanels, setCollapsedStudyPanels] = useState<Record<StudySidePanelKey, boolean>>({
    community: false,
    plan: false,
    feedback: false,
    helps: false
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
  const [journalStatus, setJournalStatus] = useState("");
  const [editingJournalEntryId, setEditingJournalEntryId] = useState("");
  const [editJournalNote, setEditJournalNote] = useState("");
  const [activeStudyReviewId, setActiveStudyReviewId] = useState("");
  const [reviewScheduleStudyId, setReviewScheduleStudyId] = useState("");
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
  const [readerStatus, setReaderStatus] = useState("Loading chapter...");
  const [readerMemoryStatus, setReaderMemoryStatus] = useState("");
  const [readerPlanReading, setReaderPlanReading] = useState<ReaderPlanReading | null>(null);
  const [readerBookSearch, setReaderBookSearch] = useState("");
  const [readerNavCollapsed, setReaderNavCollapsed] = useState(false);
  const [activeBibleReadingPlanId, setActiveBibleReadingPlanId] = useState("");
  const [followedBibleReadingPlanIds, setFollowedBibleReadingPlanIds] = useState<string[]>([]);
  const [completedBibleReadingPlanDays, setCompletedBibleReadingPlanDays] = useState<string[]>([]);
  const [customBibleReadingPlans, setCustomBibleReadingPlans] = useState<BibleReadingPlan[]>([]);
  const [bibleReadingPlanStartDates, setBibleReadingPlanStartDates] = useState<Record<string, string>>({});
  const [bibleReadingPlanCompletionDates, setBibleReadingPlanCompletionDates] = useState<Record<string, string>>({});
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
  const [openBiblePlanSections, setOpenBiblePlanSections] = useState<Record<string, boolean>>({ short: true, medium: false, long: false });
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
      setJournalView("list");
      setJournalDateFilterKey("");
    }
    previousTabRef.current = tab;
  }, [tab]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    let cancelled = false;

    Ionicons.loadFont()
      .then(async () => {
        const browserFonts = typeof document !== "undefined" ? document.fonts : null;
        if (browserFonts?.load) {
          await browserFonts.load("16px ionicons").catch(() => undefined);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIconFontReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    setLayoutReady(true);
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
      setMethodId(requestedMethod);
      setStepIndex(0);
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
        setStepIndex(0);
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
    if (!appInitializationAllowed) return;

    if (authLoading) {
      setProfileId(null);
      setProfileAuthState(null);
      return;
    }

    let cancelled = false;
    setProfileId(null);
    setProfileAuthState(null);

    getDeviceKey()
      .then((clientKey) => {
        const requestedDisplayName = authName.trim();
        return ensureProfile({
          clientKey,
          ...(requestedDisplayName ? { displayName: requestedDisplayName } : {})
        });
      })
      .then((nextProfileId) => {
        if (cancelled) return;
        setProfileId(nextProfileId);
        setProfileAuthState(isAuthenticated);
      })
      .catch(() => {
        if (cancelled) return;
        setProfileId(null);
        setProfileAuthState(null);
      });

    return () => {
      cancelled = true;
    };
  }, [appInitializationAllowed, authLoading, authName, ensureProfile, isAuthenticated]);

  useEffect(() => {
    getStoredAppearanceMode()
      .then(setAppearanceMode)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!appInitializationAllowed) return;

    return runWhenBrowserIdle(() => {
      getPinnedJournalEntries()
        .then(setPinnedJournalEntryIds)
        .catch(() => undefined);
      getStoredCheckinPartners()
        .then(setCheckinPartners)
        .catch(() => undefined);
      getActiveCheckinPartnerId()
        .then(setActiveCheckinPartnerId)
        .catch(() => undefined);
      getStoredBibleTranslation()
        .then(setBibleTranslation)
        .catch(() => undefined);
      getStoredBibleReaderPosition()
        .then((position) => {
          if (!position || !bibleBooks.includes(position.book)) return;
          const chapterCount = BIBLE_CHAPTER_COUNTS[position.book] || 1;
          setReaderBook(position.book);
          setReaderChapter(Math.min(Math.max(position.chapter, 1), chapterCount));
        })
        .catch(() => undefined);
      getStoredBibleReaderHistory()
        .then(setBibleReaderHistory)
        .catch(() => undefined);
      getStoredBibleReadChapters()
        .then(setReadBibleChapters)
        .catch(() => undefined);
      getStoredBibleReadingPlanProgress()
        .then((progress) => {
          const normalizedProgress = normalizeBibleReadingPlanProgress(progress);
          if (!normalizedProgress) return;
          const storedPlans = normalizedProgress.customPlans;
          const availablePlans = [...bibleReadingPlans, ...storedPlans];
          const normalizedActivePlanId = normalizedProgress.activePlanId;
          const normalizedFollowedPlanIds = (normalizedProgress.followedPlanIds || []).filter((planId) => availablePlans.some((plan) => plan.id === planId)).slice(0, MAX_FOLLOWED_BIBLE_READING_PLANS);
          const normalizedCompletedDays = normalizedProgress.completedDays;
          const normalizedStartDates = normalizedProgress.startDates || {};
          const normalizedCompletionDates = normalizedProgress.completedPlanDates || {};
          setCustomBibleReadingPlans(storedPlans);
          setFollowedBibleReadingPlanIds(normalizedFollowedPlanIds);
          setBibleReadingPlanCompletionDates(normalizedCompletionDates);
          if (availablePlans.some((plan) => plan.id === normalizedActivePlanId)) {
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
                updatedAt: normalizedProgress.updatedAt || Date.now()
              }).catch(() => undefined);
            }
          }
          setCompletedBibleReadingPlanDays(normalizedCompletedDays);
        })
        .catch(() => undefined);
      getStoredBibleBookmarks()
        .then(setBibleBookmarks)
        .catch(() => undefined);
      getStoredStudyFocusMode()
        .then(setStudyFocusMode)
        .catch(() => undefined);
      getStoredTutorCoachingEnabled()
        .then(setShowCoaching)
        .catch(() => undefined);
      getStoredCollapsedStudyPanels()
        .then(setCollapsedStudyPanels)
        .catch(() => undefined);
      getStoredCustomWritingPrompts()
        .then(setCustomWritingPrompts)
        .catch(() => undefined);
      getStoredMemoryReviewSorts()
        .then((sorts) => {
          setDueMemoryReviewSort(sorts.due);
          setReviewedMemoryReviewSort(sorts.reviewed);
        })
        .catch(() => undefined);
    });
  }, [appInitializationAllowed]);

  useEffect(() => {
    if (!appInitializationAllowed) return;

    saveStoredMemoryReviewSorts({
      due: dueMemoryReviewSort,
      reviewed: reviewedMemoryReviewSort
    }).catch(() => undefined);
  }, [appInitializationAllowed, dueMemoryReviewSort, reviewedMemoryReviewSort]);

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
      eventType: "app_shared",
      reference: incomingShareSource === "qr" ? "QR code" : incomingShareSource,
      tab: "help"
    }).catch(() => undefined);
  }, [activeProfileId, incomingShareSource, recordUsage]);

  const profile = useQuery(api.accountability.profile, activeProfileId ? { profileId: activeProfileId } : "skip");
  const profileAppearanceMode = (profile as any)?.appearanceMode;
  const profileMatchesActiveState =
    !!activeProfileId &&
    profile !== undefined &&
    String((profile as any)?._id || "") === String(activeProfileId) &&
    (isAuthenticated ? !!(profile as any)?.authUserId : !(profile as any)?.authUserId);
  const shouldLoadStudyLists = profileMatchesActiveState && (tab === "account" || tab === "journal");
  const shouldLoadDueStudyReviews = profileMatchesActiveState && (tab === "home" || tab === "journal");
  const shouldLoadEncouragements = profileMatchesActiveState && (tab === "account" || tab === "accountability" || tab === "journal");
  const shouldLoadCommunityConnections = COMMUNITY_CIRCLES_ENABLED && profileMatchesActiveState && isAuthenticated && (tab === "accountability" || tab === "study");
  const shouldLoadAccountDeletionRequest = profileMatchesActiveState && tab === "account";
  const shouldLoadAdminDetails = profileMatchesActiveState && tab === "admin";
  const shouldLoadCurrentStudyDraft = profileMatchesActiveState && tab === "study";
  const shouldRenderJournal = tab === "journal";
  const shouldRenderMemoryHistory = tab === "memory" && memoryView === "history";
  const shouldLoadMemoryVerses = profileMatchesActiveState && (tab === "home" || tab === "study" || tab === "bible" || tab === "memory" || tab === "journal" || tab === "account");
  const shouldLoadMemoryHistory = profileMatchesActiveState && shouldRenderMemoryHistory;
  const shouldLoadAdminOverview = profileMatchesActiveState && (tab === "account" || tab === "admin");
  const timezoneOffsetMinutes = new Date().getTimezoneOffset();

  const stats = useQuery(api.study.stats, profileMatchesActiveState ? { profileId: activeProfileId, timezoneOffsetMinutes } : "skip");
  const rhythmGrace = (stats as any)?.rhythmGrace;
  const sessions = useQuery(api.study.recentSessions, shouldLoadStudyLists ? { profileId: activeProfileId, limit: 12 } : "skip");
  const savedDraft = useQuery(
    api.study.draftForPassage,
    shouldLoadCurrentStudyDraft ? { profileId: activeProfileId, passage: passage.trim() || "Selected passage", methodId } : "skip"
  );
  const drafts = useQuery(api.study.recentDrafts, shouldLoadStudyLists ? { profileId: activeProfileId, limit: 12 } : "skip");
  const dueStudyReviews = useQuery(api.study.dueStudyReviews, shouldLoadDueStudyReviews ? { profileId: activeProfileId, limit: 10 } : "skip");

  useEffect(() => {
    const missedDate = typeof rhythmGrace?.missedDate === "string" ? rhythmGrace.missedDate : "";
    if (!profileMatchesActiveState || !activeProfileId || !missedDate) return;
    const storageKey = `bible-study-tutor-rhythm-grace-${activeProfileId}-${missedDate}`;
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
    rhythmGrace?.latestActivityDate,
    rhythmGrace?.missedDate
  ]);
  const checkins = useQuery(api.accountability.recentCheckins, shouldLoadEncouragements ? { profileId: activeProfileId, limit: 50 } : "skip");
  const communityFriends = useQuery((api as any).community.myFriends, shouldLoadCommunityConnections ? { profileId: activeProfileId } : "skip");
  const communityCircles = useQuery((api as any).community.myCircles, shouldLoadCommunityConnections ? { profileId: activeProfileId } : "skip");
  const memoryVerses = useQuery(api.memory.list, shouldLoadMemoryVerses ? { profileId: activeProfileId, limit: 50 } : "skip");
  const memoryHistory = useQuery((api as any).memory.listHistory, shouldLoadMemoryHistory ? { profileId: activeProfileId, limit: 120 } : "skip");
  const memoryStats = useQuery((api as any).memory.stats, shouldLoadMemoryHistory ? { profileId: activeProfileId } : "skip");
  const profileUiPreferences = useMemo(() => normalizeUiPreferences((profile as any)?.uiPreferences), [profile]);
  const adminOverview = useQuery((api as any).insights.adminOverview, shouldLoadAdminOverview ? {} : "skip");
  const accountDeletionRequest = useQuery((api as any).insights.deletionRequestForProfile, shouldLoadAccountDeletionRequest ? { profileId: activeProfileId } : "skip");
  const adminUsers = useQuery((api as any).insights.adminUsers, shouldLoadAdminDetails ? {} : "skip");
  const adminUserDetail = useQuery((api as any).insights.adminUserDetail, shouldLoadAdminDetails && selectedAdminProfileId ? { profileId: selectedAdminProfileId } : "skip");
  const adminAuditLog = useQuery((api as any).insights.adminAuditLog, shouldLoadAdminDetails ? { limit: 20 } : "skip");
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
  const answerKey = `${method.id}:${stepIndex}`;
  const progress = Math.min(100, ((stepIndex + (answers[answerKey]?.trim() ? 1 : 0)) / method.steps.length) * 100);
  const currentStudyKey = studyKey(passage, method.id);
  const answeredSteps = method.steps
    .map((item, index) => ({
      index,
      title: item.title,
      answer: answers[`${method.id}:${index}`] || ""
    }))
    .filter((item) => item.answer.trim());
  const sessionAnswers = method.steps.map((item, index) => ({
    stepTitle: item.title,
    answer: answers[`${method.id}:${index}`] || ""
  }));
  const hasStudyWork = sessionAnswers.some((item) => item.answer.trim());
  const studyPassageReference = passageText?.reference || passage;
  const studyContextReference = useMemo(() => buildStudyContextReference(studyPassageReference), [studyPassageReference]);
  const studyHelps = useMemo(() => buildStudyHelpLinks(passageText?.reference || passage, bibleTranslation), [bibleTranslation, passage, passageText?.reference]);
  const continueLabel =
    step.responseType === "none"
      ? step.nextLabel || "I am ready for the next step"
      : stepIndex === method.steps.length - 1
        ? "Review study"
        : "Save and continue";
  const parsedPassage = parsePassageQuery(passageQuery);
  const latestCheckin = checkins?.[0];
  const backendReady = profileMatchesActiveState;
  const backendStatusLabel = backendReady ? "Saving connected" : "Saving unavailable";
  const backendStatusDetail = backendReady
    ? isAuthenticated
      ? "Drafts, journal, and account changes sync with your signed-in account."
      : "Drafts, journal, and account changes save to this device profile."
    : "Start the app backend before saving studies.";
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
  const accountIdentityLabel = profile?.authUsername
    ? `${personalDisplayName} (@${profile.authUsername})`
    : profile?.authEmail
      ? `${personalDisplayName} (${profile.authEmail})`
      : personalDisplayName;
  const suggestedShareNote = buildShareNote(method, answers, passageText?.reference || passage);
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
  const bibleReadingPlanView = buildBibleReadingPlanView({
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
  });
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
  const readerActiveBibleReadingPlanDay =
    readerBibleReadingPlan && readerPlanReading?.planId === readerBibleReadingPlan.id
      ? readerBibleReadingPlan.days.find((day) => day.day === readerPlanReading.day) || getReaderPlanDayForChapter(readerBibleReadingPlan, readerBook, readerChapter)
      : getReaderPlanDayForChapter(readerBibleReadingPlan, readerBook, readerChapter);
  const readerActiveBibleReadingPlanDayComplete =
    !!readerBibleReadingPlan &&
    !!readerActiveBibleReadingPlanDay &&
    completedBibleReadingPlanDaySet.has(bibleReadingPlanDayKey(readerBibleReadingPlan.id, readerActiveBibleReadingPlanDay.day));
  const readerMatchesActiveBibleReadingPlanDay =
    !!readerActiveBibleReadingPlanDay;
  const readerPlanReadingActive = isReaderPlanReadingActive(readerBibleReadingPlan, readerPlanReading, readerBook, readerChapter);
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
      : readerPlanChunkIsFullCurrentChapter
        ? ""
        : readerPlanCurrentChunk.startVerse && readerPlanCurrentChunk.endVerse && readerPlanCurrentChunk.startVerse === readerPlanCurrentChunk.endVerse
          ? `Only verse ${readerPlanCurrentChunk.startVerse} is shown.`
          : readerPlanCurrentChunk.startVerse && readerPlanCurrentChunk.endVerse
            ? `Only verses ${readerPlanCurrentChunk.startVerse}-${readerPlanCurrentChunk.endVerse} are shown.`
            : readerPlanCurrentChunk.startVerse
              ? `This plan reading starts at verse ${readerPlanCurrentChunk.startVerse}.`
              : "Only this plan passage is shown."
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
            setMemoryView("browse");
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
  const phoneMemoryFocusMode = phoneLayout && tab === "memory" && !!activeMemoryVerseId;
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

  function scrollBiblePlanDayPickerIntoView(planId: string, day = 1, animated = true, delay = 80) {
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
      const tileStart = (day - 1) * (tileWidth + gap);
      const x = Math.max(0, tileStart - estimatedVisibleWidth * 0.42);
      picker.scrollTo({ x, y: 0, animated });
    }, delay);
  }

  function ensureMemoryBlankVisible(index: number, delay = 520) {
    if (!phoneLayout || tab !== "memory" || !activeMemoryVerseId || memoryPracticeLevel <= 1) return;
    if (memoryBlankVisibilityTimerRef.current) clearTimeout(memoryBlankVisibilityTimerRef.current);
    memoryBlankVisibilityTimerRef.current = setTimeout(() => {
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
            ? visualViewportHeight - 82
            : layoutHeight - Math.min(320, Math.max(210, layoutHeight * 0.34));
        const inputBottom = y + inputHeight + 72;
        const hiddenAmount = inputBottom - keyboardSafeBottom;
        if (hiddenAmount > 120) {
          scrollMemoryPracticeBy(Math.min(90, hiddenAmount - 76), false);
        }
      });
    }, delay);
  }

  useEffect(() => {
    if (!bibleSearchBook) return;
    const options = buildBibleSearchBookOptions(bibleSearchScope);
    if (!options.includes(bibleSearchBook)) setBibleSearchBook("");
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
      community: profileUiPreferences.studyPanelCommunityCollapsed ?? current.community,
      plan: profileUiPreferences.studyPanelPlanCollapsed ?? current.plan,
      feedback: profileUiPreferences.studyPanelFeedbackCollapsed ?? current.feedback,
      helps: profileUiPreferences.studyPanelHelpsCollapsed ?? current.helps
    }));
    if (profileUiPreferences.studyInstructionsCollapsed !== undefined) setInstructionsCollapsed(profileUiPreferences.studyInstructionsCollapsed);
    if (profileUiPreferences.studyCoachingVisible !== undefined) setShowCoaching(profileUiPreferences.studyCoachingVisible);
    if (profileUiPreferences.bibleReaderNavCollapsed !== undefined) setReaderNavCollapsed(profileUiPreferences.bibleReaderNavCollapsed);
    if (profileUiPreferences.bibleReaderHistoryCollapsed !== undefined) setReaderHistoryCollapsed(profileUiPreferences.bibleReaderHistoryCollapsed);
    if (profileUiPreferences.bibleBookmarksCollapsed !== undefined) setBookmarksCollapsed(profileUiPreferences.bibleBookmarksCollapsed);
    if (profileUiPreferences.bibleSearchCollapsed !== undefined) setBibleSearchCollapsed(profileUiPreferences.bibleSearchCollapsed);
    if (profileUiPreferences.communityPeoplePanelCollapsed !== undefined) setPeoplePanelCollapsed(profileUiPreferences.communityPeoplePanelCollapsed);
    if (profileUiPreferences.communityFriendsPanelOpen !== undefined) setMobileFriendsPanelOpen(profileUiPreferences.communityFriendsPanelOpen);
    if (profileUiPreferences.communityCirclesPanelOpen !== undefined) setMobileCirclesPanelOpen(profileUiPreferences.communityCirclesPanelOpen);
    if (profileUiPreferences.communityFriendToolsOpen !== undefined) setFriendToolsOpen(profileUiPreferences.communityFriendToolsOpen);
    if (profileUiPreferences.communityCircleToolsOpen !== undefined) setCircleManagerOpen(profileUiPreferences.communityCircleToolsOpen);
    if (profileUiPreferences.communityRecentExpanded !== undefined) setRecentCheckinsExpanded(profileUiPreferences.communityRecentExpanded);
  }, [profile, profileUiPreferences]);

  useEffect(() => {
    if (!profileMatchesActiveState || !isAuthenticated || !profile) return;
    const syncedReaderState = normalizeSyncedBibleReaderState((profile as any).bibleReaderState);
    if (!syncedReaderState) {
      const profileKey = String(activeProfileId || "");
      if (appliedBibleReaderProfileIdRef.current !== profileKey && hasLocalBibleReaderState({ history: bibleReaderHistory, readChapters: readBibleChapters, bookmarks: bibleBookmarks, readingPlanProgress: currentBibleReadingPlanProgress() })) {
        appliedBibleReaderProfileIdRef.current = profileKey;
        persistBibleReaderState();
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
      saveStoredBibleReadingPlanProgress(progress).catch(() => undefined);
    } else {
      const localProgress = currentBibleReadingPlanProgress();
      if (hasBibleReadingPlanProgress(localProgress)) {
        persistBibleReaderState({ readingPlanProgress: localProgress });
      }
    }
  }, [activeProfileId, isAuthenticated, profile, profileMatchesActiveState]);

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

    const draftRevision = savedDraft ? ((savedDraft as any).updatedAt || 0) : 0;
    const sameStudyAlreadyLoaded = loadedDraftKey === currentStudyKey;
    if (sameStudyAlreadyLoaded && draftRevision > 0 && draftRevision <= loadedDraftRevisionRef.current) return;

    if (!savedDraft) {
      if (sameStudyAlreadyLoaded) return;
      loadedDraftRevisionRef.current = 0;
      isHydratingDraftRef.current = true;
      setAnswers({});
      setPassageMarkups({});
      setPassageMarkupNotes({});
      setSelectedVerseKeys([]);
      setStepIndex(0);
      setStudyPhase("study");
      setLoadedDraftKey(currentStudyKey);
      setSaveStatus("Not saved yet");
      setShareNote("");
      return;
    }

    const restoredAnswers: AnswerMap = {};
    savedDraft.answers.forEach((item: any, index: number) => {
      restoredAnswers[`${savedDraft.methodId}:${index}`] = item.answer;
    });
    isHydratingDraftRef.current = true;
    setAnswers(restoredAnswers);
    setPassageMarkups(markupRecordsToMap(savedDraft.passageMarkups || []));
    setPassageMarkupNotes(markupRecordsToNoteMap(savedDraft.passageMarkups || []));
    setSelectedVerseKeys([]);
    setStepIndex(pickResumeStepIndex(savedDraft.answers, savedDraft.stepIndex));
    setStudyPhase("study");
    loadedDraftRevisionRef.current = draftRevision;
    setLoadedDraftKey(currentStudyKey);
    setSaveStatus(`Welcome back${firstName ? `, ${firstName}` : ""}. Your draft is restored.`);
    setShareNote(buildShareNote(method, restoredAnswers, savedDraft.passageReference || savedDraft.passage));
  }, [currentStudyKey, firstName, loadedDraftKey, method, savedDraft]);

  useEffect(() => {
    setDetectedScriptureReference("");
    setDetectedScriptureTypedReference("");
    setScriptureInsertStatus("");
  }, [answerKey]);

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
    if (!pendingStudyWorksheetPrint || tab !== "study" || !passageText?.verses?.length) return;
    setPendingStudyWorksheetPrint(false);
    setPrintWorksheetMethodId(method.id);
    setPrintWorksheetWritingSpace("standard");
    setPrintWorksheetIncludes({ memory: true, insight: true });
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
    if (!activeProfileId || loadedDraftKey !== currentStudyKey) return;
    if (isHydratingDraftRef.current) {
      isHydratingDraftRef.current = false;
      return;
    }

    const draftAnswers = method.steps.map((item, index) => ({
      stepTitle: item.title,
      answer: answers[`${method.id}:${index}`] || ""
    }));

    if (!draftAnswers.some((item) => item.answer.trim()) && passageMarkupRecords.length === 0) return;

    setSaveStatus("Saving draft...");
    const timeout = setTimeout(() => {
      saveDraft({
        profileId: activeProfileId,
        passage: passage.trim() || "Selected passage",
        passageReference: passageText?.reference,
        passageText: passageText?.text,
        translationName: passageText?.translation_name,
        passageMarkups: passageMarkupRecords,
        methodId: method.id,
        methodName: method.name,
        stepIndex,
        answers: draftAnswers
      })
        .then(() => setSaveStatus(`Draft saved${firstName ? ` for ${firstName}` : ""}`))
        .catch(() => setSaveStatus("Draft could not be saved"));
    }, 650);

    return () => clearTimeout(timeout);
  }, [answers, currentStudyKey, loadedDraftKey, method.id, method.name, method.steps, passage, passageMarkupRecords, passageText, activeProfileId, saveDraft, stepIndex]);

  async function completeSession() {
    if (!activeProfileId) {
      setSaveStatus("Profile is still loading. Try again in a moment.");
      return;
    }
    if (!hasStudyWork) {
      setSaveStatus("Write at least one response before saving.");
      return;
    }

    const finalShareNote = (shareNote.trim() || suggestedShareNote).trim();
    setSaveStatus("Saving completed study...");
    let savedSessionId: any = null;

    try {
      savedSessionId = await saveSession({
        profileId: activeProfileId,
        passage,
        methodId: method.id,
        methodName: method.name,
        shareNote: finalShareNote || undefined,
        passageMarkups: passageMarkupRecords,
        minutes: Math.max(5, sessionAnswers.filter((item) => item.answer.trim()).length * 6),
        answers: sessionAnswers
      });
    } catch {
      setSaveStatus("Could not save. Check that Convex is running, then try again.");
      return;
    }

    setSavedStudySummary({
      sessionId: savedSessionId,
      passage: passageText?.reference || passage,
      methodName: method.name,
      highlightCount: passageMarkupRecords.length,
      shareNote: finalShareNote
    });
    setAnswers((current) => {
      const nextAnswers = { ...current };
      method.steps.forEach((_, index) => delete nextAnswers[`${method.id}:${index}`]);
      return nextAnswers;
    });
    setStepIndex(0);
    setShareNote("");
    setPassageMarkups({});
    setPassageMarkupNotes({});
    setSelectedVerseKeys([]);
    setStudyPhase("saved");
    setLoadedDraftKey("");
    setSaveStatus(`Completed and saved${firstName ? `, ${firstName}` : ""}`);
    trackUsage("study_completed", { reference: passageText?.reference || passage, methodId: method.id, methodName: method.name, translation: passageText?.translation_name, tab: "study" });
    trackPublicAnalytics({ eventType: "study_completed", source: "study", ctaTarget: "/?tab=study", methodId: method.id });
    setCheckinNote(finalShareNote);
  }

  function resumeDraft(draft: any) {
    resumeStudy({
      passage: draft.passage,
      methodId: draft.methodId,
      stepIndex: draft.stepIndex,
      answers: draft.answers,
      passageMarkups: draft.passageMarkups,
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

    setMemoryView("browse");
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
    status
  }: {
    passage: string;
    methodId: string;
    stepIndex: number;
    answers: { stepTitle: string; answer: string }[];
    passageMarkups?: PassageMarkupRecord[];
    status: string;
  }) {
    const restoredAnswers: AnswerMap = {};
    nextAnswers.forEach((item, index) => {
      restoredAnswers[`${nextMethodId}:${index}`] = item.answer;
    });
    const resumeStepIndex = pickResumeStepIndex(nextAnswers, nextStepIndex);

    setPassage(nextPassage);
    setMethodId(nextMethodId);
    setStepIndex(resumeStepIndex);
    setStudyPhase("study");
    setSavedStudySummary(null);
    setAnswers(restoredAnswers);
    setPassageMarkups(markupRecordsToMap(nextPassageMarkups || []));
    setPassageMarkupNotes(markupRecordsToNoteMap(nextPassageMarkups || []));
    setSelectedVerseKeys([]);
    setLoadedDraftKey(studyKey(nextPassage, nextMethodId));
    setSaveStatus(status);
    setShareNote(buildShareNote(methods.find((item) => item.id === nextMethodId) || methods[0], restoredAnswers, nextPassage));
    setTab("study");
  }

  function continueStudy() {
    if (stepIndex < method.steps.length - 1) {
      goToStudyStep(stepIndex + 1);
    } else {
      setShareNote((current) => current || suggestedShareNote);
      setStudyPhase("review");
      scrollStudyStepIntoView();
    }
  }

  function goToStudyStep(nextStepIndex: number) {
    setStudyPhase("study");
    setStepIndex(Math.max(0, Math.min(method.steps.length - 1, nextStepIndex)));
    scrollStudyStepIntoView();
  }

  function scrollStudyStepIntoView() {
    const topPadding = phoneLayout ? 74 : 18;
    setTimeout(() => appScrollRef.current?.scrollTo?.({ y: Math.max(0, studyStepAnchorY - topPadding), animated: true }), 80);
  }

  function openSavedHighlights() {
    setJournalFilter("highlights");
    setTab("journal");
  }

  function resetPassageMarkup() {
    setPassageMarkups({});
    setPassageMarkupNotes({});
    setSelectedVerseKeys([]);
  }

  function switchMethod(nextMethodId: string) {
    if (nextMethodId === method.id) return;
    trackPublicAnalytics({ eventType: "method_selected", source: "study_method_switcher", ctaTarget: `/?tab=study&method=${nextMethodId}`, methodId: nextMethodId });
    setMethodId(nextMethodId);
    setStepIndex(0);
    setStudyPhase("study");
    setSavedStudySummary(null);
    setAnswers({});
    setShareNote("");
    resetPassageMarkup();
    setLoadedDraftKey("");
    setSaveStatus("Not saved yet");
  }

  function startMethodExample(nextMethodId: string) {
    const nextMethod = methods.find((item) => item.id === nextMethodId) || methods[0];
    const examplePassage = nextMethod.detail?.examplePassage || buildPassagePresets(nextMethod.id)[0] || "Psalm 23";

    setMethodId(nextMethod.id);
    setPassage(examplePassage);
    setPassageQuery(examplePassage);
    setStepIndex(0);
    setStudyPhase("study");
    setSavedStudySummary(null);
    setAnswers({});
    setShareNote("");
    resetPassageMarkup();
    setLoadedDraftKey("");
    setSaveStatus(`Example loaded: ${examplePassage}`);
    setActiveMethodInfoId("");
    setTab("study");
  }

  function resetCurrentStudy() {
    const lastStudiedPassage = passageText?.reference || passage.trim() || passageQuery.trim() || "Psalm 23";
    setAnswers({});
    setShareNote("");
    resetPassageMarkup();
    setPassage(lastStudiedPassage);
    setPassageQuery(lastStudiedPassage);
    setStudyFocusMode(false);
    saveStoredStudyFocusMode(false).catch(() => undefined);
    setStepIndex(0);
    setStudyPhase("study");
    setSavedStudySummary(null);
    setLoadedDraftKey("");
    setSaveStatus("Fresh study started");
  }

  function applyPassageQuery(nextPassage = parsedPassage.reference) {
    if (!nextPassage.trim()) return;
    setPassage(nextPassage);
    setPassageQuery(nextPassage);
    setAnswers({});
    setShareNote("");
    resetPassageMarkup();
    setStepIndex(0);
    setStudyPhase("study");
    setSavedStudySummary(null);
    setLoadedDraftKey("");
    setSaveStatus("Not saved yet");
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
      setPlanStatus("Could not save. Check that saving is connected.");
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
      setDeletionStatus("Saving is still connecting. Try again in a moment.");
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
      setAdminMaintenanceStatus(`Removed ${result?.removed ?? 0} empty local/test profile${result?.removed === 1 ? "" : "s"}. Kept ${result?.kept ?? 0} with saved content.`);
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
    Keyboard.dismiss();
    const rawIdentifier = authIdentifier.trim();
    const isEmailCredential = authInputLooksLikeEmail(rawIdentifier);
    const email = rawIdentifier.toLowerCase();
    const username = normalizeUsername(rawIdentifier);
    const credentialMode = isEmailCredential ? "email" : "username";
    const name = authName.trim();
    const accountId = credentialMode === "username" ? usernameCredential(username) : email;
    if (!accountId || !authPassword) {
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

    setAuthStatus(authFlow === "signIn" ? "Signing in..." : "Creating account...");
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
    }
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
    recordUsage({ profileId: activeProfileId, eventType, ...details }).catch(() => undefined);
  }

  function dismissRhythmGracePrompt() {
    if (pendingRhythmGracePrompt?.storageKey) {
      safeSetLocalStorageValue(pendingRhythmGracePrompt.storageKey, "handled");
    }
    setPendingRhythmGracePrompt(null);
  }

  function restoreDailyRhythmFromGracePrompt() {
    if (!pendingRhythmGracePrompt) return;
    safeSetLocalStorageValue(pendingRhythmGracePrompt.storageKey, "handled");
    trackUsage("rhythm_restored", { reference: pendingRhythmGracePrompt.missedDate, tab: "home" });
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
      setFeedbackStatus("Saving is still connecting. Try again in a moment.");
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
      setCommunityStatus("Saving is still connecting. Please wait a moment and try again.");
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
      const checkinId = await saveCheckin({ profileId: activeProfileId, mood: "encouragement", note: noteToSave, sentAt: Date.now() });
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
        mood: "Highlight reflection",
        note: buildHighlightReflectionNote(item, reflectionInsight, reflectionPrayer, reflectionNextStep)
      });
      setReflectionStatus("Reflection saved to Journal");
      setActiveReflectionEntryId("");
      setReflectionInsight("");
      setReflectionPrayer("");
      setReflectionNextStep("");
      setJournalFilter("all");
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
    const insight = (noteOverride || shareNote || suggestedShareNote).trim();
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
    const insight = (noteOverride || shareNote || suggestedShareNote).trim();
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
                    <Text style={[styles.circleManagementLabel, accountDarkMode && styles.studyDarkAccentText]}>Friends - select one or more</Text>
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
    if (!activeProfileId) return;

    const entryId = String(entry._id);
    if (pendingDeleteJournalEntryId !== entryId) {
      setPendingDeleteJournalEntryId(entryId);
      setJournalStatus("Tap Confirm delete to remove this journal entry.");
      return;
    }

    if (entry.answers) {
      await deleteSessionMutation({ profileId: activeProfileId, sessionId: entry._id });
      const nextPinnedEntries = pinnedJournalEntryIds.filter((id) => id !== entryId);
      setPinnedJournalEntryIds(nextPinnedEntries);
      savePinnedJournalEntries(nextPinnedEntries).catch(() => undefined);
    } else {
      await deleteCheckinMutation({ profileId: activeProfileId, checkinId: entry._id });
    }

    setPendingDeleteJournalEntryId("");
    setJournalStatus("Journal entry deleted");
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

    const nextPrompts = Array.from(new Set([trimmed, ...customWritingPrompts])).slice(0, 12);
    setCustomWritingPrompts(nextPrompts);
    saveStoredCustomWritingPrompts(nextPrompts).catch(() => undefined);
    setWritingPromptStatus("Starter saved");
    return true;
  }

  function removeCustomWritingPrompt(prompt: string) {
    const nextPrompts = customWritingPrompts.filter((item) => item !== prompt);
    setCustomWritingPrompts(nextPrompts);
    saveStoredCustomWritingPrompts(nextPrompts).catch(() => undefined);
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
      statusSetter("Could not save to Memory. Check that saving is connected.");
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
      setMemoryView("browse");
      setMemoryCollectionFilter(collectionName);
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
        reference,
        verseText: selectedVerses.map((verse) => verse.text.trim()).join(" "),
        translationName: passageText.translation_name,
        note: note || undefined
      });
      setMemoryStatus(`${reference} was recently added.`);
      trackUsage("memory_saved", { reference, translation: passageText.translation_name, tab: "study" });
      setSelectedVerseKeys([]);
    } catch {
      setMemoryStatus("Could not save to Memory. Check that saving is connected.");
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
      setReaderMemoryStatus("Could not save to Memory. Check that saving is connected.");
    }
  }

  function openReaderWorksheetOptions() {
    if (!readerPassage || selectedReaderVerseObjects.length === 0) return;
    setPrintWorksheetMethodId(method.id);
    setPrintWorksheetWritingSpace("standard");
    setPrintWorksheetIncludes({ memory: true, insight: true });
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
    setPrintWorksheetMethodId(method.id);
    setPrintWorksheetWritingSpace("standard");
    setPrintWorksheetIncludes({ memory: true, insight: true });
    setPrintWorksheetRequest({
      source: "study",
      reference: selectedVerses.length ? buildMemoryReference(selectedVerses) : passageText.reference || passage,
      translation: shortBibleTranslationName(passageText.translation_name),
      verses: versesToPrint
    });
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
    setMemoryPrintLayout("pocket");
    setMemoryPrintCopies(1);
    setMemoryPrintOptionsOpen(true);
  }

  function changeMemoryPrintSet(printSet: MemoryPrintSet) {
    if (printSet === "collection") {
      const defaultCollection = memoryCollectionFilter !== "all" ? memoryCollectionFilter : memoryCollectionOptions[0]?.name || "all";
      changeMemoryPrintCollection(defaultCollection);
      return;
    }
    setMemoryPrintSet(printSet);
    setMemoryPrintSelectedVerseIds(getMemoryPrintCandidateVerses(printSet).map((verse: any) => String(verse._id)));
  }

  function changeMemoryPrintCollection(collectionName: string) {
    setMemoryPrintCollectionFilter(collectionName);
    const saved = memoryVerses || [];
    const verses = collectionName === "all" ? saved : saved.filter((verse: any) => getMemoryVerseCollections(verse).includes(collectionName));
    setMemoryPrintSet("collection");
    setMemoryPrintSelectedVerseIds(verses.map((verse: any) => String(verse._id)));
  }

  function clearMemoryBrowseFilters() {
    setMemoryCollectionFilter("all");
    setMemoryCollectionPickerOpen(false);
    setMemoryBookFilter("all");
    setMemoryChapterFilter("all");
    setMemoryBrowseStatusFilter("all");
    setExpandedMemoryFilterBook("");
    setMemoryFilterMobileMenu(null);
    setMemoryBrowseFiltersOpen(false);
  }

  function selectMemoryFilterBook(book: string) {
    if (expandedMemoryFilterBook === book) {
      setExpandedMemoryFilterBook("");
      if (memoryBookFilter === book) {
        setMemoryBookFilter("all");
        setMemoryChapterFilter("all");
        setMemoryBrowseFiltersOpen(false);
      }
      return;
    }

    setExpandedMemoryFilterBook(book);
    setMemoryBookFilter(book);
    setMemoryChapterFilter("all");
    setMemoryFilterMobileMenu(OLD_TESTAMENT_BOOKS.includes(book) ? "old" : "new");
  }

  function selectMemoryFilterChapter(book: string, chapterKey: string) {
    setMemoryBookFilter(book);
    setMemoryChapterFilter(chapterKey);
    setExpandedMemoryFilterBook("");
    setMemoryFilterMobileMenu(null);
    setMemoryBrowseFiltersOpen(false);
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
    setMemoryView("review");
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
        memoryBlankInputRefs.current[nextToken.index]?.focus();
        ensureMemoryBlankVisible(nextToken.index, phoneLayout ? 620 : 180);
      }, phoneLayout ? 120 : 80);
      return;
    }

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
      savePinnedJournalEntries(next).catch(() => undefined);
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
    setAccountPrivacyOpen(true);
    setOpenLegalSection("privacy");
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
    completedPlanDates = bibleReadingPlanCompletionDates
  ) {
    const progress = currentBibleReadingPlanProgress(activePlanId, completedDays, customPlans, startDates, followedPlanIds, completedPlanDates);
    saveStoredBibleReadingPlanProgress(progress).catch(() => undefined);
    persistBibleReaderState({ readingPlanProgress: progress });
  }

  function selectBibleReadingPlan(planId: string) {
    const nextState = followBibleReadingPlanState({
      planId,
      allPlans: allBibleReadingPlans,
      followedPlanIds: followedBibleReadingPlanIds,
      activePlanId: activeBibleReadingPlanId,
      startDates: bibleReadingPlanStartDates,
      todayKey: localDateKey()
    });
    if (!nextState) return;
    if (nextState.blocked) {
      setBiblePlanStatus(`You can follow up to ${MAX_FOLLOWED_BIBLE_READING_PLANS} reading plans at once. Stop one before adding another.`);
      return;
    }
    setActiveBibleReadingPlanId(nextState.activePlanId);
    setFollowedBibleReadingPlanIds(nextState.followedPlanIds);
    setExpandedBiblePlanId(nextState.activePlanId);
    setActiveBiblePlanSelectedDay(0);
    setActiveBiblePlanSelectedPlanId(nextState.activePlanId);
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
    setFollowedBibleReadingPlanIds(nextState.followedPlanIds);
    setActiveBibleReadingPlanId(nextState.activePlanId);
    if (readerPlanReading?.planId === nextState.stoppedPlan.id) setReaderPlanReading(null);
    setExpandedBiblePlanId(nextState.activePlanId);
    setActiveBiblePlanSelectedDay(0);
    setActiveBiblePlanSelectedPlanId(nextState.activePlanId);
    setBiblePlanStatus(`${nextState.stoppedPlan.title} is no longer followed.`);
    persistBibleReadingPlanProgress(nextState.activePlanId, completedBibleReadingPlanDays, customBibleReadingPlans, bibleReadingPlanStartDates, nextState.followedPlanIds);
    trackUsage("bible_reading_plan_stopped", { reference: nextState.stoppedPlan.id, tab: "plans" });
  }

  function restartBibleReadingPlan(planId: string) {
    const plan = allBibleReadingPlans.find((item) => item.id === planId);
    if (!plan) return;
    const nextStartDates = { ...bibleReadingPlanStartDates, [plan.id]: localDateKey() };
    const nextCompletedDays = completedBibleReadingPlanDays.filter((key) => !key.startsWith(`${plan.id}:`));
    const nextCompletionDates = { ...bibleReadingPlanCompletionDates };
    delete nextCompletionDates[plan.id];
    const nextFollowedPlanIds = Array.from(new Set([plan.id, ...followedBibleReadingPlanIds])).slice(0, MAX_FOLLOWED_BIBLE_READING_PLANS);
    setCompletedBibleReadingPlanDays(nextCompletedDays);
    setBibleReadingPlanStartDates(nextStartDates);
    setBibleReadingPlanCompletionDates(nextCompletionDates);
    setFollowedBibleReadingPlanIds(nextFollowedPlanIds);
    setActiveBibleReadingPlanId(plan.id);
    setExpandedBiblePlanId(plan.id);
    setActiveBiblePlanSelectedPlanId(plan.id);
    setActiveBiblePlanSelectedDay(1);
    if (readerPlanReading?.planId === plan.id) setReaderPlanReading(null);
    setBiblePlanStatus(`${plan.title} restarted from Day 1.`);
    persistBibleReadingPlanProgress(plan.id, nextCompletedDays, customBibleReadingPlans, nextStartDates, nextFollowedPlanIds, nextCompletionDates);
    trackUsage("bible_reading_plan_restarted", { reference: plan.id, tab: "plans" });
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
      setActiveBiblePlanSelectedPlanId(plan.id);
      setActiveBiblePlanSelectedDay(planDay.day);
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
    setActiveBiblePlanSelectedPlanId(plan.id);
    setActiveBiblePlanSelectedDay(missedDay.day);
    openBibleReadingPlanDayInBible(missedDay, plan.id);
  }

  function catchUpAndOpenPendingBiblePlanDay(prompt: PendingBiblePlanReadAhead) {
    const plan = allBibleReadingPlans.find((item) => item.id === prompt.planId);
    const requestedDay = plan?.days.find((day) => day.day === prompt.requestedDay);
    if (!plan || !requestedDay) return;
    setPendingBiblePlanReadAhead(null);
    setActiveBibleReadingPlanId(plan.id);
    setActiveBiblePlanSelectedPlanId(plan.id);
    setActiveBiblePlanSelectedDay(requestedDay.day);
    catchUpActiveBibleReadingPlanDates(plan.id);
    openBibleReadingPlanDayInBible(requestedDay, plan.id, { skipOverdueGuard: true });
  }

  function openFollowedBibleReadingPlan(planId: string) {
    const plan = followedBibleReadingPlans.find((item) => item.id === planId);
    if (!plan) return;
    const nextDay = plan.days.find((day) => !completedBibleReadingPlanDaySet.has(bibleReadingPlanDayKey(plan.id, day.day))) || plan.days[0];
    if (!nextDay) return;
    setActiveBibleReadingPlanId(plan.id);
    setActiveBiblePlanSelectedPlanId(plan.id);
    setActiveBiblePlanSelectedDay(nextDay.day);
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
    setActiveBiblePlanSelectedPlanId(plan.id);
    setActiveBiblePlanSelectedDay(nextDay.day);
    openBibleReadingPlanDayInBible(nextDay, plan.id, { skipOverdueGuard: true });
  }

  function chooseAnotherBibleReadingPlanAfterCelebration() {
    setPendingBiblePlanCompletionCelebration(null);
    setTab("plans");
    setCompletedBiblePlansOpen(false);
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
    const nextCompletionDates =
      plan && !nextState.nextIncomplete
        ? { ...bibleReadingPlanCompletionDates, [planId]: bibleReadingPlanCompletionDates[planId] || localDateKey() }
        : bibleReadingPlanCompletionDates;
    if (nextCompletionDates !== bibleReadingPlanCompletionDates) {
      setBibleReadingPlanCompletionDates(nextCompletionDates);
    }
    if (activeBiblePlanSelectedPlanId === planId) {
      setActiveBiblePlanSelectedDay(nextState.nextIncomplete?.day || 0);
    }
    setPendingBiblePlanReadAhead((current) =>
      current?.planId === planId && (current.missedDay === planDay.day || current.requestedDay === planDay.day)
        ? null
        : current
    );
    setCompletedBibleReadingPlanDays((current) => {
      const currentState = completeBibleReadingPlanDayState({ plan, planDay, planId, completedDayKeys: current });
      const next = currentState?.completedDays || current;
      persistBibleReadingPlanProgress(planId, next, customBibleReadingPlans, bibleReadingPlanStartDates, followedBibleReadingPlanIds, nextCompletionDates);
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
      customPlans: customBibleReadingPlans,
      followedPlanIds: followedBibleReadingPlanIds,
      activePlanId: activeBibleReadingPlanId,
      startDates: bibleReadingPlanStartDates,
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
    setExpandedBiblePlanId(nextState.canFollow ? id : "");
    setActiveBiblePlanSelectedDay(0);
    setActiveBiblePlanSelectedPlanId(nextState.canFollow ? id : "");
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
    setPendingBiblePlanDeleteId("");
    setCustomBiblePlanStatus("Custom plan deleted.");
    persistBibleReadingPlanProgress(nextState.activePlanId, nextState.completedDays, nextState.customPlans, nextState.startDates, nextState.followedPlanIds, nextCompletionDates);
  }

  function studyBibleReadingPlanDay(planDay: BibleReadingPlanDay) {
    setPassage(planDay.studyReference);
    setPassageQuery(planDay.studyReference);
    setAnswers({});
    setShareNote("");
    resetPassageMarkup();
    setStepIndex(0);
    setStudyPhase("study");
    setLoadedDraftKey("");
    setSaveStatus(`${planDay.reference} loaded from Bible reading plan`);
    setTab("study");
    trackUsage("bible_reading_plan_studied", { reference: planDay.reference, tab: "bible", book: planDay.readerBook, chapter: planDay.readerChapter });
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

  async function runBibleSearch() {
    dismissBibleSearchInput();
    const query = bibleSearchQuery.trim();
    const requestId = ++bibleSearchRequestIdRef.current;
    if (!query) {
      setBibleSearchStatus("Type a word, theme, idea, or question to search.");
      setBibleSearchResults([]);
      setBibleSearchActiveQuery("");
      setBibleSearchDuration("");
      return;
    }

    const startedAt = Date.now();
    const translation = bibleTranslation === "kjv" ? "KJV" : bibleTranslation === "bsb" ? "BSB" : "WEB";
    const queries = buildBibleSearchQueries(query, bibleSearchMode);
    setBibleSearchStatus("Searching Scripture...");
    setBibleSearchDuration("");
    setBibleSearchActiveQuery(query);

    try {
      const responses = await Promise.all(queries.map((searchTerm) => fetchBibleSearchResults(searchTerm, translation, bibleSearchScope, bibleSearchBook, bibleSearchMode === "word")));
      if (bibleSearchRequestIdRef.current !== requestId) return;
      const combined = rankBibleSearchResults(filterBibleSearchResultsForMode(dedupeBibleSearchResults(responses.flat()), query, bibleSearchMode), query, bibleSearchMode).slice(0, 60);
      setBibleSearchDuration(`Search completed in ${formatSearchDuration(Date.now() - startedAt)}.`);
      setBibleSearchResults(combined);
      setBibleSearchStatus(
        combined.length
          ? `${combined.length} ${bibleSearchModeLabel(bibleSearchMode).toLowerCase()} result${combined.length === 1 ? "" : "s"} found${bibleSearchBook ? ` in ${bibleSearchBook}` : ""}.`
          : bibleSearchMode === "word"
            ? "No exact word results found. Try Any words or Theme if you want broader matches."
            : "No results found. Try fewer words or a broader search mode."
      );
      scrollToBibleSearchSummary();
      trackUsage("bible_search", { reference: query, translation, tab: "bible", book: bibleSearchBook || undefined });
    } catch {
      if (bibleSearchRequestIdRef.current !== requestId) return;
      setBibleSearchStatus("I couldn't complete the search. Check your connection and try again.");
      setBibleSearchDuration(`Search stopped after ${formatSearchDuration(Date.now() - startedAt)}.`);
      setBibleSearchResults([]);
      scrollToBibleSearchSummary();
    }
  }

  function clearBibleSearch() {
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
    setPassage(reference);
    setPassageQuery(reference);
    setAnswers({});
    setShareNote("");
    resetPassageMarkup();
    setStepIndex(0);
    setStudyPhase("study");
    setSaveStatus("Loaded from Bible search");
    setTab("study");
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
    setPassage(studyReference);
    setPassageQuery(studyReference);
    setAnswers({});
    setShareNote("");
    resetPassageMarkup();
    setStepIndex(0);
    setStudyPhase("study");
    setSavedStudySummary(null);
    setLoadedDraftKey("");
    setSaveStatus(selectedReaderVerses.length ? "Selected verses loaded from Bible reader" : "Chapter loaded from Bible reader");
    clearReaderSelection();
    setTab("study");
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

  function persistUiPreference(key: UiPreferenceKey, value: boolean) {
    if (!activeProfileId) return;
    saveUiPreference({ profileId: activeProfileId, key, value }).catch(() => undefined);
  }

  function currentBibleReadingPlanProgress(
    activePlanId = selectedBibleReadingPlanId || activeBibleReadingPlanId,
    completedDays = completedBibleReadingPlanDays,
    customPlans = customBibleReadingPlans,
    startDates = bibleReadingPlanStartDates,
    followedPlanIds = followedBibleReadingPlanIds,
    completedPlanDates = bibleReadingPlanCompletionDates
  ): StoredBibleReadingPlanProgress {
    return normalizeBibleReadingPlanProgress({
      activePlanId,
      followedPlanIds,
      completedDays,
      customPlans,
      startDates,
      completedPlanDates,
      updatedAt: Date.now()
    }) || { ...emptyBibleReadingPlanProgress(), updatedAt: Date.now() };
  }

  function persistBibleReaderState(overrides: Partial<SyncedBibleReaderState> = {}) {
    if (!activeProfileId || !isAuthenticated || !profileMatchesActiveState) return;
    const state = normalizeSyncedBibleReaderState({
      translation: bibleTranslation,
      position: { book: readerBook, chapter: readerChapter },
      history: bibleReaderHistory,
      readChapters: readBibleChapters,
      bookmarks: bibleBookmarks,
      readingPlanProgress: currentBibleReadingPlanProgress(),
      ...overrides
    });
    if (!state) return;

    const signature = JSON.stringify(state);
    const profileId = String(activeProfileId);
    appliedBibleReaderStateSignatureRef.current = signature;
    pendingBibleReaderStateProfileIdRef.current = profileId;
    pendingBibleReaderStateSignatureRef.current = signature;
    clearPendingBibleReaderStateSync();
    pendingBibleReaderStateProfileIdRef.current = profileId;
    pendingBibleReaderStateSignatureRef.current = signature;
    pendingBibleReaderStateTimerRef.current = setTimeout(() => {
      if (pendingBibleReaderStateProfileIdRef.current === profileId) clearPendingBibleReaderStateSync(signature);
    }, 5000);
    saveBibleReaderState({ profileId: activeProfileId, state }).catch(() => {
      if (pendingBibleReaderStateProfileIdRef.current === profileId) clearPendingBibleReaderStateSync(signature);
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
        <Pressable onPress={() => toggleRememberedPanel(setInstructionsCollapsed, "studyInstructionsCollapsed")} style={[styles.collapseButton, phoneLayout && styles.phoneInstructionCollapseButton, studyDarkMode && styles.homeDarkResumeButton]}>
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
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.olive} />
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
          onContentSizeChange={() => scrollBiblePlanDayPickerIntoView(plan.id, selectedDay?.day || today?.day || 1, false, 20)}
        >
          {plan.days.map((planDay) => {
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
                onPress={() => {
                  setActiveBiblePlanSelectedDay(planDay.day);
                  setActiveBiblePlanSelectedPlanId(plan.id);
                }}
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
        </ScrollView>
        {selectedDay && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Selected reading day ${selectedDay.day}, ${selectedDay.reference}`}
            onPress={() => openBibleReadingPlanDayInBible(selectedDay, plan.id)}
            style={[styles.planPageDay, styles.selectedPlanDayDetail, phoneLayout && styles.phonePlanPageDay, plansDarkMode && styles.plansDarkDayRow, selectedDone && styles.completedPlanDayRow, plansDarkMode && selectedDone && styles.plansDarkCompletedDayRow]}
          >
            <Text style={[styles.planDayBadge, styles.compactPlanDayBadge, selectedDone && styles.completedPlanDayBadge, plansDarkMode && !selectedDone && styles.plansDarkDayBadge]}>{selectedDone ? "✓" : selectedDay.day}</Text>
            <View style={styles.planDayCopy}>
              <Text style={[styles.planDayTitle, phoneLayout && styles.phonePlanDayTitle, plansDarkMode && styles.accountDarkTitle, plansDarkMode && selectedDone && styles.completedPlanDayTextDark]}>
                {`Day ${selectedDay.day}${selectedDateKey ? ` · ${formatPlanDayDate(selectedDateKey)}` : ""}`}
              </Text>
              <Text style={[styles.muted, plansDarkMode && styles.accountDarkMutedText, plansDarkMode && selectedDone && styles.completedPlanDayMutedTextDark]}>{selectedDay.title}</Text>
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
          </Pressable>
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

    return (
      <View key={plan.id} style={[styles.completedReadingPlanCard, phoneLayout && styles.phoneCompletedReadingPlanCard, plansDarkMode && styles.accountDarkSection]}>
        <View style={styles.completedReadingPlanHeader}>
          <View style={styles.journalTitleBlock}>
            <Text style={[styles.cardTitle, plansDarkMode && styles.accountDarkTitle]}>{plan.title}</Text>
            <Text style={[styles.muted, plansDarkMode && styles.accountDarkMutedText]}>
              {`${plan.days.length} ${plan.days.length === 1 ? "reading" : "readings"} complete${completedDateLabel ? ` · completed ${completedDateLabel}` : ""}`}
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

      <View style={[styles.sidebar, accountDarkMode && styles.appDarkSidebar, compactLayout && styles.compactSidebar, phoneLayout && !mobileMenuOpen && styles.hiddenMobileSidebar, phoneLayout && mobileMenuOpen && styles.mobileMenuDrawer]}>
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
            <Card style={[styles.todayCard, accountDarkMode && styles.accountDarkMainCard]}>
              <Eyebrow>Today</Eyebrow>
              <Text style={[styles.streakNumber, accountDarkMode && styles.accountDarkTitle]}>{stats?.currentStreak ?? 0}</Text>
              <Text style={[styles.muted, accountDarkMode && styles.accountDarkMutedText]}>day rhythm</Text>
              <View style={[styles.progressTrack, accountDarkMode && styles.appDarkProgressTrack]}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={[styles.muted, accountDarkMode && styles.accountDarkMutedText]}>{effectivePartner ? `${friendlyName}, share an encouragement with ${effectivePartner} after study.` : `${friendlyName}, invite one person into the rhythm.`}</Text>
            </Card>

          </>
        )}
      </View>

      <ScrollView
        ref={appScrollRef}
        style={styles.contentScroll}
        onScroll={(event) => {
          appScrollYRef.current = event.nativeEvent.contentOffset?.y || 0;
        }}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.content,
          accountDarkMode && styles.appDarkContent,
          phoneLayout && styles.phoneContent,
          phoneMemoryFocusMode && memoryPracticeLevel > 1 && styles.phoneMemoryPracticeScrollContent,
          showMobileReaderSelectionDock && styles.contentWithMobileReaderDock,
          showMobileReaderNoteEditor && styles.contentWithMobileReaderNoteDock
        ]}
      >
        {tab === "home" && (
          <View style={[styles.homeLayout, compactLayout && styles.stackedLayout, homeDarkMode && styles.homeDarkLayout]}>
            <Card style={[styles.homeMainCard, compactLayout && styles.fluidCard, homeDarkMode && styles.accountDarkMainCard]}>
              <View style={[styles.homeHero, homeDarkMode && styles.homeDarkHero]}>
                <Eyebrow>Purpose</Eyebrow>
                <Text style={[styles.homeHeroTitle, phoneLayout && styles.phoneHomeHeroTitle, homeDarkMode && styles.homeDarkHeroTitle]}>
                  {firstName ? `${firstName}, draw near.` : "Draw near."}
                  {"\n"}
                  <Text style={[styles.homeHeroTitleAccent, homeDarkMode && styles.homeDarkHeroTitleAccent]}>Be shaped by Scripture.</Text>
                </Text>
                <Text style={[styles.homeHeroText, homeDarkMode && styles.homeDarkHeroText]}>
                  Bible Study Tutor helps you draw near to God through Scripture, prayerful reflection, and steady daily rhythms. Read, study, journal, memorize, review, and print worksheets in one free, privacy-aware place.
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

              <View style={[styles.homePurposePanel, homeDarkMode && styles.homeDarkPurposePanel]}>
                <Text style={[styles.homePurposeTitle, homeDarkMode && styles.accountDarkTitle]}>Free Bible study for everyday discipleship.</Text>
                <Text style={[styles.homePurposeText, homeDarkMode && styles.accountDarkMutedText]}>
                  Built for individuals, small groups, and churches, Bible Study Tutor is free to use on desktop and mobile, with printable worksheets for anyone who prefers pen and paper.
                </Text>
                <View style={styles.homePurposePillRow}>
                  <View style={[styles.homePurposePill, homeDarkMode && styles.homeDarkPurposePill]}>
                    <HydrationSafeIonicon ready={iconFontReady} name="gift-outline" size={15} color={homeDarkMode ? "#e9b76a" : colors.oliveDark} />
                    <Text style={[styles.homePurposePillText, homeDarkMode && styles.accountDarkTitle]}>Free to use</Text>
                  </View>
                  <View style={[styles.homePurposePill, homeDarkMode && styles.homeDarkPurposePill]}>
                    <HydrationSafeIonicon ready={iconFontReady} name="phone-portrait-outline" size={15} color={homeDarkMode ? "#e9b76a" : colors.oliveDark} />
                    <Text style={[styles.homePurposePillText, homeDarkMode && styles.accountDarkTitle]}>Mobile ready</Text>
                  </View>
                  <View style={[styles.homePurposePill, homeDarkMode && styles.homeDarkPurposePill]}>
                    <HydrationSafeIonicon ready={iconFontReady} name="desktop-outline" size={15} color={homeDarkMode ? "#e9b76a" : colors.oliveDark} />
                    <Text style={[styles.homePurposePillText, homeDarkMode && styles.accountDarkTitle]}>Desktop friendly</Text>
                  </View>
                  <View style={[styles.homePurposePill, homeDarkMode && styles.homeDarkPurposePill]}>
                    <HydrationSafeIonicon ready={iconFontReady} name="print-outline" size={15} color={homeDarkMode ? "#e9b76a" : colors.oliveDark} />
                    <Text style={[styles.homePurposePillText, homeDarkMode && styles.accountDarkTitle]}>Printable worksheets</Text>
                  </View>
                </View>
              </View>
              <HomeSemanticResourceLinks />
            </Card>

            <View style={[styles.homeSideColumn, compactLayout && styles.fluidCard]}>
              <Card style={[styles.homeSideCard, homeDarkMode && styles.accountDarkMainCard]}>
                <Text style={[styles.homeSideTitle, homeDarkMode && styles.accountDarkTitle]}>Today’s path</Text>
                <Text style={[styles.titleSupport, homeDarkMode && styles.accountDarkMutedText]}>{`${friendlyName}, take the next small faithful step.`}</Text>
                <View style={styles.homePathList}>
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
                  {[
                    ["Bible reader", "Read, search, select verses, or print a worksheet.", "reader-outline", "bible"],
                    ["Guided study", `Work through ${method.short} with notes and highlights.`, "book-outline", "study"],
                    ["Study methods", "Choose SOAP, OIA, Inductive, Lectio Divina, or another method.", "layers-outline", "methods"],
                    ["Worksheets", "Select verses in the Bible reader and print for pen-and-paper study.", "print-outline", "bible"],
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
                      setStudyFocusMode(nextValue);
                      saveStoredStudyFocusMode(nextValue).catch(() => undefined);
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
              </View>
              {studyMethodPickerOpen && (
                <View style={[styles.compactMethodMenu, studyDarkMode && styles.accountDarkInsetBox]}>
                  {methods.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        switchMethod(item.id);
                        setStudyMethodPickerOpen(false);
                      }}
                      style={[styles.compactMethodChip, studyDarkMode && styles.studyDarkMethodChip, method.id === item.id && styles.activeCompactMethodChip]}
                    >
                      <Text style={[styles.compactMethodText, studyDarkMode && styles.accountDarkMutedText, method.id === item.id && styles.activeCompactMethodText]}>{item.short}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {!studyFocusMode && (
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
                <View style={[styles.studyProgressStrip, phoneLayout && styles.phoneStudyProgressStrip]}>
                  {method.steps.map((item, index) => {
                    const stepAnswered = !!answers[`${method.id}:${index}`]?.trim();
                    const active = index === stepIndex;
                    return (
                      <Pressable
                        key={item.title}
                        onPress={() => goToStudyStep(index)}
                        style={[styles.studyProgressPill, studyDarkMode && styles.studyDarkProgressPill, stepAnswered && styles.completedStudyProgressPill, studyDarkMode && stepAnswered && styles.studyDarkCompletedProgressPill, active && styles.activeStudyProgressPill]}
                      >
                        <Text
                          style={[
                            styles.studyProgressNumber,
                            studyDarkMode && styles.studyDarkProgressNumber,
                            stepAnswered && styles.completedStudyProgressNumber,
                            studyDarkMode && stepAnswered && styles.studyDarkCompletedProgressNumber,
                            active && styles.activeStudyProgressNumber,
                            studyDarkMode && active && styles.studyDarkActiveProgressNumber
                          ]}
                        >
                          {index + 1}
                        </Text>
                        <Text style={[styles.studyProgressText, studyDarkMode && styles.accountDarkMutedText, stepAnswered && styles.completedStudyProgressText, studyDarkMode && stepAnswered && styles.accountDarkTitle, active && styles.activeStudyProgressText]} numberOfLines={1}>
                          {item.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {studyInstructionPanel}

              <View style={[styles.scriptureBox, phoneLayout && styles.phoneScriptureBox, studyPhase === "study" && styles.attachedScriptureBox, studyFocusMode && styles.focusScriptureBox, studyDarkMode && styles.studyDarkScriptureBox]}>
                <View style={styles.scriptureHeader}>
                  <View>
                    <Eyebrow>Passage text</Eyebrow>
                    <Text style={[styles.scriptureReference, studyDarkMode && styles.accountDarkTitle]}>{passageText?.reference || passage}</Text>
                  </View>
                  <View style={[styles.translationControls, studyDarkMode && styles.accountDarkSegmentedRow]}>
                    {BIBLE_TRANSLATIONS.map((translation) => (
                      <Pressable
                        key={translation.id}
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
                        <Text style={[styles.markupHelp, studyDarkMode && styles.accountDarkMutedText]}>Tap one or more verses, then choose a highlight label.</Text>
                        <View style={styles.verseList}>
                          {passageText.verses.map((verse) => {
                            const key = verseMarkupKey(verse);
                            const markup = passageMarkups[key];
                            const markupOption = PASSAGE_MARKUP_OPTIONS.find((item) => item.id === markup);
                            const selected = selectedVerseKeys.includes(key);
                            const savedToMemory = memoryVerseKeys.has(key);

                            return (
                              <View key={key}>
                                <Pressable
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
                                  {savedToMemory && (
                                    <View style={styles.memoryVerseBadge}>
                                      <Ionicons name="sparkles-outline" size={12} color={colors.coral} />
                                      <Text style={styles.memoryVerseBadgeText}>Memory</Text>
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
                                <Pressable onPress={() => setSelectedVerseKeys([])} style={styles.markupCloseButton}>
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

              {studyPhase === "saved" && savedStudySummary ? (
                <View style={[styles.savedSummaryBox, studyDarkMode && styles.accountDarkInsetBox]}>
                  <View style={[styles.savedSummaryIcon, studyDarkMode && styles.homeDarkIconBubble]}>
                    <Ionicons name="checkmark-circle-outline" size={30} color={colors.coral} />
                  </View>
                  <Eyebrow>Study saved</Eyebrow>
                  <Text style={[styles.stepTitle, studyDarkMode && styles.accountDarkTitle]}>{firstName ? `Well done, ${firstName}.` : "Well done."}</Text>
                  <Text style={[styles.reviewMeta, studyDarkMode && styles.accountDarkMutedText]}>{savedStudySummary.passage}</Text>
                  <Text style={[styles.reviewMeta, studyDarkMode && styles.accountDarkMutedText]}>{savedStudySummary.methodName}</Text>
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
                    <Text style={[styles.lastCheckinLabel, studyDarkMode && styles.studyDarkAccentText]}>Review later</Text>
                    <Text style={[styles.body, studyDarkMode && styles.accountDarkMutedText]}>
                      {savedStudySummary.reviewAt
                        ? `This study is set for review on ${formatReviewDate(savedStudySummary.reviewAt)}.`
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
                  <View style={[styles.savedSummaryActions, phoneLayout && styles.phoneSavedSummaryActions]}>
                    <AppButton label="View Journal" onPress={() => setTab("journal")} style={phoneLayout && styles.phoneSavedSummaryActionButton} labelStyle={phoneLayout && styles.phoneSavedSummaryActionLabel} />
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
                  <View style={styles.reviewAnswers}>
                    {sessionAnswers
                      .filter((item) => item.answer.trim())
                      .map((item) => (
                        <View key={item.stepTitle} style={[styles.reviewAnswer, studyDarkMode && styles.accountDarkSection]}>
                          <Text style={[styles.reviewStepTitle, studyDarkMode && styles.studyDarkAccentText]}>{item.stepTitle}</Text>
                          <FormattedNoteText styles={styles} text={item.answer} darkMode={studyDarkMode} />
                        </View>
                      ))}
                  </View>
                  <View style={[styles.shareInsightBox, studyDarkMode && styles.accountDarkSection]}>
                    <View style={styles.feedbackHeader}>
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.coral} />
                      <Text style={[styles.feedbackTitle, studyDarkMode && styles.studyDarkAccentText]}>Shareable insight</Text>
                    </View>
                    <TextInput
                      multiline
                      value={shareNote}
                      onChangeText={setShareNote}
                      placeholder={suggestedShareNote || "Today I noticed..."}
                      placeholderTextColor={studyDarkMode ? "#8f8678" : undefined}
                      style={[styles.input, styles.shareInput, studyDarkMode && styles.accountDarkInput]}
                    />
                    {renderShareInsightCommunityControls()}
                    {!!shareInsightStatus && <Text style={styles.saveStatus}>{shareInsightStatus}</Text>}
                  </View>
                  <View style={styles.buttonRow}>
                    <AppButton label="Back to edit" variant="secondary" onPress={() => setStudyPhase("study")} />
                    <AppButton label="Save study" onPress={completeSession} />
                  </View>
                </View>
              ) : (
                <View style={[styles.guidedStudyStepPanel, phoneLayout && styles.phoneGuidedStudyStepPanel, studyDarkMode && styles.studyDarkStepPanel]}>
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
                            <Text style={styles.saveStatus}>{saveStatus}</Text>
                            <Text style={styles.saveStatus}>{(answers[answerKey] || "").trim().split(/\s+/).filter(Boolean).length} words</Text>
                          </View>
                        </View>
                      </View>
                      {stepIndex === method.steps.length - 1 && (
                        <View style={[styles.shareInsightBox, studyDarkMode && styles.accountDarkSection]}>
                          <View style={styles.feedbackHeader}>
                            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.coral} />
                            <Text style={[styles.feedbackTitle, studyDarkMode && styles.studyDarkAccentText]}>Shareable insight</Text>
                          </View>
                          <Text style={[styles.helpIntro, studyDarkMode && styles.accountDarkMutedText]}>End with one honest note you could bring to a partner or group.</Text>
                          <TextInput
                            multiline
                            value={shareNote}
                            onChangeText={setShareNote}
                            placeholder={suggestedShareNote || "Today I noticed..."}
                            placeholderTextColor={studyDarkMode ? "#8f8678" : undefined}
                            style={[styles.input, styles.shareInput, studyDarkMode && styles.accountDarkInput]}
                          />
                          {renderShareInsightCommunityControls()}
                          {!!shareInsightStatus && <Text style={styles.saveStatus}>{shareInsightStatus}</Text>}
                        </View>
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
                      label={phoneLayout && continueLabel === "Save and continue" ? "Save + continue" : continueLabel}
                      onPress={continueStudy}
                      style={phoneLayout && styles.studyStepContinueButton}
                      labelStyle={phoneLayout && styles.studyStepButtonLabel}
                    />
                    <AppButton
                      label="Fresh start"
                      variant="secondary"
                      onPress={resetCurrentStudy}
                      style={[phoneLayout && styles.studyStepFreshButton, studyDarkMode && styles.homeDarkResumeButton]}
                      labelStyle={[phoneLayout && styles.studyStepButtonLabel, studyDarkMode && styles.homeDarkResumeButtonText]}
                    />
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
                setBibleTranslation(nextTranslationId as BibleTranslationId);
                saveStoredBibleTranslation(nextTranslationId as BibleTranslationId).catch(() => undefined);
                persistBibleReaderState({ translation: nextTranslationId as BibleTranslationId });
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
              onRunBibleSearch={runBibleSearch}
              onClearBibleSearch={clearBibleSearch}
              onToggleBibleSearchCriteria={() => setBibleSearchCriteriaOpen((value) => !value)}
              onSelectBibleSearchScope={setBibleSearchScope}
              onSelectBibleSearchMode={setBibleSearchMode}
              onToggleBibleSearchBookMenu={() => setBibleSearchBookMenuOpen((value) => !value)}
              onSelectBibleSearchBook={(nextBook: string) => {
                setBibleSearchBook(nextBook);
                setBibleSearchBookMenuOpen(false);
              }}
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
                  onContentSizeChange={() => scrollBiblePlanDayPickerIntoView(activeBibleReadingPlan.id, activeBibleReadingPlanSelectedDay?.day || activeBibleReadingPlanToday?.day || 1, false, 20)}
                >
                  {activeBibleReadingPlan.days.map((planDay) => {
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
                        onPress={() => {
                          setActiveBiblePlanSelectedDay(planDay.day);
                          setActiveBiblePlanSelectedPlanId(activeBibleReadingPlan.id);
                        }}
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
                </ScrollView>
                {activeBibleReadingPlanSelectedDay && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Selected reading day ${activeBibleReadingPlanSelectedDay.day}, ${activeBibleReadingPlanSelectedDay.reference}`}
                    onPress={() => openBibleReadingPlanDayInBible(activeBibleReadingPlanSelectedDay)}
                    style={[styles.planPageDay, styles.selectedPlanDayDetail, phoneLayout && styles.phonePlanPageDay, plansDarkMode && styles.plansDarkDayRow, activeBibleReadingPlanSelectedDone && styles.completedPlanDayRow, plansDarkMode && activeBibleReadingPlanSelectedDone && styles.plansDarkCompletedDayRow]}
                  >
                    <Text style={[styles.planDayBadge, styles.compactPlanDayBadge, activeBibleReadingPlanSelectedDone && styles.completedPlanDayBadge, plansDarkMode && !activeBibleReadingPlanSelectedDone && styles.plansDarkDayBadge]}>{activeBibleReadingPlanSelectedDone ? "✓" : activeBibleReadingPlanSelectedDay.day}</Text>
                    <View style={styles.planDayCopy}>
                      <Text style={[styles.planDayTitle, phoneLayout && styles.phonePlanDayTitle, plansDarkMode && styles.accountDarkTitle, plansDarkMode && activeBibleReadingPlanSelectedDone && styles.completedPlanDayTextDark]}>
                        {`Day ${activeBibleReadingPlanSelectedDay.day}${activeBibleReadingPlanSelectedDateKey ? ` · ${formatPlanDayDate(activeBibleReadingPlanSelectedDateKey)}` : ""}`}
                      </Text>
                      <Text style={[styles.muted, plansDarkMode && styles.accountDarkMutedText, plansDarkMode && activeBibleReadingPlanSelectedDone && styles.completedPlanDayMutedTextDark]}>{activeBibleReadingPlanSelectedDay.title}</Text>
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
                  </Pressable>
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
                  onPress={() => setCompletedBiblePlansOpen((open) => !open)}
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
              {unfollowedBibleReadingPlanGroups.map((group) => {
                const sectionOpen = openBiblePlanSections[group.id] ?? (group.id === "custom" || group.id === "short");
                return (
                  <View key={group.id} style={[styles.planBrowseSection, plansDarkMode && styles.planBrowseSectionDark]}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${sectionOpen ? "Collapse" : "Expand"} ${group.title}`}
                      accessibilityState={{ expanded: sectionOpen }}
                      onPress={() => setOpenBiblePlanSections((current) => ({ ...current, [group.id]: !sectionOpen }))}
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
                        {group.plans.map((plan) => {
                const completedCount = plan.days.filter((day) => completedBibleReadingPlanDaySet.has(bibleReadingPlanDayKey(plan.id, day.day))).length;
                const expanded = expandedBiblePlanId === plan.id;
                const progressPercent = plan.days.length ? (completedCount / plan.days.length) * 100 : 0;
                const planDetails = getBibleReadingPlanDetails(plan);
                const visibleRows = expandedBiblePlanVisibleRows[plan.id] || 0;
                const visiblePlanDays = visibleRows > 0 ? plan.days.slice(0, visibleRows) : [];
                const planStarted = completedCount > 0;
                const planComplete = plan.days.length > 0 && completedCount >= plan.days.length;
                const lastCompletedDateKey = bibleReadingPlanCompletionDates[plan.id] || "";
                const lastCompletedDateLabel = lastCompletedDateKey ? formatPlanDayDate(lastCompletedDateKey) : "";
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
                            Last completed: {lastCompletedDateLabel || "date not recorded"}
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
                          setExpandedBiblePlanId(expanded ? "" : plan.id);
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
                              ["Rhythm", planDetails.rhythm]
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
                            <Pressable key={planDay.day} onPress={() => { selectBibleReadingPlan(plan.id); openBibleReadingPlanDayInBible(planDay, plan.id); }} style={[styles.planPageDay, styles.compactPlanPageDay, phoneLayout && styles.phonePlanPageDay, phoneLayout && styles.phoneCompactPlanPageDay, plansDarkMode && styles.plansDarkDayRow, done && styles.completedPlanDayRow, plansDarkMode && done && styles.plansDarkCompletedDayRow]}>
                              <Text style={[styles.planDayBadge, styles.compactPlanDayBadge, done && styles.completedPlanDayBadge, plansDarkMode && !done && styles.plansDarkDayBadge]}>{done ? "✓" : planDay.day}</Text>
                              <View style={styles.planDayCopy}>
                                <Text style={[styles.planDayTitle, phoneLayout && styles.phonePlanDayTitle, plansDarkMode && styles.accountDarkTitle, plansDarkMode && done && styles.completedPlanDayTextDark]}>{planDay.title}</Text>
                                <Text numberOfLines={1} style={[styles.planDayPassage, phoneLayout && styles.phonePlanDayPassage, plansDarkMode && styles.accountDarkMutedText, plansDarkMode && done && styles.completedPlanDayMutedTextDark]}>{planDay.reference}</Text>
                              </View>
                              <View style={styles.planDayActions}>
                                <Pressable accessibilityRole="button" accessibilityLabel={`Open ${planDay.reference} in Bible`} onPress={(event: any) => { event.stopPropagation?.(); selectBibleReadingPlan(plan.id); openBibleReadingPlanDayInBible(planDay, plan.id); }} style={[styles.planDayIconAction, plansDarkMode && styles.homeDarkIconBubble]}>
                                  <Ionicons name="reader-outline" size={15} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
                                </Pressable>
                                <Pressable accessibilityRole="button" accessibilityLabel={`Study ${planDay.reference}`} onPress={(event: any) => { event.stopPropagation?.(); selectBibleReadingPlan(plan.id); studyBibleReadingPlanDay(planDay); }} style={[styles.planDayIconAction, plansDarkMode && styles.homeDarkIconBubble]}>
                                  <Ionicons name="book-outline" size={15} color={plansDarkMode ? "#e9b76a" : colors.oliveDark} />
                                </Pressable>
                                <Pressable accessibilityRole="button" accessibilityLabel={done ? `${planDay.reference} completed` : `Mark ${planDay.reference} complete`} onPress={(event: any) => { event.stopPropagation?.(); selectBibleReadingPlan(plan.id); if (!done) markBibleReadingPlanDayComplete(planDay, plan.id); }} style={[styles.planDayIconAction, done && styles.activeReaderReadButton, plansDarkMode && !done && styles.homeDarkIconBubble]}>
                                  <Ionicons name={done ? "checkmark-circle" : "checkmark-circle-outline"} size={15} color={done ? "white" : (plansDarkMode ? "#e9b76a" : colors.oliveDark)} />
                                </Pressable>
                              </View>
                            </Pressable>
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
                <View style={styles.methodInfoSection}>
                  <Text style={[styles.methodInfoLabel, methodsDarkMode && styles.studyDarkAccentText]}>Best for</Text>
                  <View style={styles.methodFitRow}>
                    {(activeMethodInfo.labels || activeMethodInfo.detail?.bestFor || [activeMethodInfo.tone]).map((fit) => (
                      <Text key={fit} style={[styles.methodFitPill, methodsDarkMode && styles.methodsDarkPill]}>{fit}</Text>
                    ))}
                  </View>
                </View>
                <View style={styles.methodInfoSection}>
                  <Text style={[styles.methodInfoLabel, methodsDarkMode && styles.studyDarkAccentText]}>How it works</Text>
                  {activeMethodInfo.steps.map((methodStep, index) => (
                    <View key={`${activeMethodInfo.id}-${methodStep.title}`} style={[styles.methodStepPreview, methodsDarkMode && styles.accountDarkInsetBox]}>
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
                    <Text style={[styles.methodStepCountText, methodsDarkMode && styles.accountDarkMutedText]}>{`${item.steps.length} guided steps`}</Text>
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
              setMemoryBrowseFiltersOpen={setMemoryBrowseFiltersOpen}
              setMemoryBrowseStatusFilter={setMemoryBrowseStatusFilter}
              setMemoryCollectionDraft={setMemoryCollectionDraft}
              setMemoryCollectionFilter={setMemoryCollectionFilter}
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
              setMemoryView={setMemoryView}
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
              <Text style={[styles.title, accountDarkMode && styles.accountDarkTitle]}>{firstName ? `${firstName}, your profile` : "Your profile and feedback choices"}</Text>
              <Text style={[styles.titleSupport, accountDarkMode && styles.accountDarkMutedText]}>Keep your details current so the app can speak to you personally and help you draw near to God.</Text>
              <View style={[styles.accountSection, accountDarkMode && styles.accountDarkSection]}>
                <Text style={[styles.sectionTitle, accountDarkMode && styles.accountDarkTitle]}>Sign in</Text>
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
                    <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>Create an account to carry your study journal between phone, web, and desktop. Adding your name helps the app feel more personal as you draw near to God.</Text>
                    <View style={[styles.freeAccountBox, accountDarkMode && styles.accountDarkInsetBox]}>
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
                    </View>
                    <View style={[styles.authFlowRow, accountDarkMode && styles.accountDarkSegmentedRow]}>
                      <Pressable accessibilityRole="button" accessibilityLabel="Sign in to an existing account" onPress={() => setAuthFlow("signIn")} style={[styles.authFlowButton, authFlow === "signIn" && styles.activeAuthFlowButton, accountDarkMode && authFlow === "signIn" && styles.accountDarkActiveSegment]}>
                        <Text style={[styles.authFlowText, accountDarkMode && styles.accountDarkMutedText, authFlow === "signIn" && styles.activeAuthFlowText]}>Sign in</Text>
                      </Pressable>
                      <Pressable accessibilityRole="button" accessibilityLabel="Create a free account" onPress={() => setAuthFlow("signUp")} style={[styles.authFlowButton, authFlow === "signUp" && styles.activeAuthFlowButton, accountDarkMode && authFlow === "signUp" && styles.accountDarkActiveSegment]}>
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
                    <AppButton label={authFlow === "signIn" ? "Sign in" : "Create account"} onPress={submitAuth} />
                  </>
                )}
                {!!authStatus && <Text style={styles.saveStatus}>{authStatus}</Text>}
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
                    accessibilityLabel={profile?.authUsername ? "Optional email for account recovery" : "Email address"}
                    value={accountEmail}
                    onChangeText={setAccountEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder={profile?.authUsername ? "Optional email for recovery" : "Email"}
                    placeholderTextColor={accountDarkMode ? "#9d927f" : undefined}
                    style={[styles.input, accountDarkMode && styles.accountDarkInput]}
                  />
                  {!!profile?.authUsername && (
                    <Text style={[styles.authHelperText, accountDarkMode && styles.accountDarkMutedText]}>
                      Username sign-in still works even if you add an email later.
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
                  onPress={() => setAccountPrivacyOpen((open) => !open)}
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
                      <LegalDocument
                        title="Privacy Policy"
                        icon="shield-checkmark-outline"
                        open={openLegalSection === "privacy"}
                        sections={PRIVACY_POLICY_SECTIONS}
                        onToggle={() => setOpenLegalSection((current) => (current === "privacy" ? "" : "privacy"))}
                        darkMode={accountDarkMode}
                      />
                      <LegalDocument
                        title="Terms of Service"
                        icon="document-text-outline"
                        open={openLegalSection === "terms"}
                        sections={TERMS_OF_SERVICE_SECTIONS}
                        onToggle={() => setOpenLegalSection((current) => (current === "terms" ? "" : "terms"))}
                        darkMode={accountDarkMode}
                      />
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
              setJournalView={setJournalView}
              journalDateFilterKey={journalDateFilterKey}
              setJournalDateFilterKey={setJournalDateFilterKey}
              journalFiltersOpen={journalFiltersOpen}
              setJournalFiltersOpen={setJournalFiltersOpen}
              activeJournalFilterLabel={activeJournalFilterLabel}
              journalFilter={journalFilter}
              setJournalFilter={setJournalFilter}
              journalFilterOptions={journalFilterOptions}
              totalSavedHighlightCount={totalSavedHighlightCount}
              buildJournalGuideText={buildJournalGuideText}
              journalCalendarMonth={journalCalendarMonth}
              journalCalendarItems={journalCalendarItems}
              setJournalCalendarMonth={setJournalCalendarMonth}
              addMonths={addMonths}
              journalScriptureBookSections={journalScriptureBookSections}
              expandedJournalScriptureBook={expandedJournalScriptureBook}
              setExpandedJournalScriptureBook={setExpandedJournalScriptureBook}
              selectedJournalScriptureBook={selectedJournalScriptureBook}
              selectedJournalScriptureChapter={selectedJournalScriptureChapter}
              setSelectedJournalScriptureBook={setSelectedJournalScriptureBook}
              setSelectedJournalScriptureChapter={setSelectedJournalScriptureChapter}
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
              isSavingJournalEdit={isSavingJournalEdit}
              saveJournalEntryEdit={saveJournalEntryEdit}
              cancelEditJournalEntry={cancelEditJournalEntry}
              setActiveStudyReviewId={setActiveStudyReviewId}
              setReviewScheduleStudyId={setReviewScheduleStudyId}
              startEditJournalEntry={startEditJournalEntry}
              pendingDeleteJournalEntryId={pendingDeleteJournalEntryId}
              deleteJournalEntry={deleteJournalEntry}
              STUDY_REVIEW_OPTIONS={STUDY_REVIEW_OPTIONS}
              scheduleStudyReview={scheduleStudyReview}
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
        <View style={styles.printOptionsOverlay}>
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
        <View style={styles.printOptionsOverlay}>
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
              <Pressable disabled={memoryCollectionPromptSaving} onPress={() => setMemoryCollectionPrompt(null)} style={styles.markupCloseButton}>
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
        <View style={styles.printOptionsOverlay}>
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
              <Pressable disabled={memoryBookCollectionSaving} onPress={() => setMemoryBookCollectionOpen(false)} style={styles.markupCloseButton}>
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
        <View style={styles.printOptionsOverlay}>
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
              <Pressable onPress={() => setMemoryPrintOptionsOpen(false)} style={styles.markupCloseButton}>
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
                      onPress={() => setMemoryPrintLayout(key as MemoryCardLayout)}
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
                      onPress={() => setMemoryPrintCopies(count)}
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
        <View style={styles.printOptionsOverlay}>
          <Pressable style={[styles.printOptionsScrim, accountDarkMode && styles.printDarkOptionsScrim]} onPress={() => setPrintWorksheetRequest(null)} />
          <View style={[styles.printOptionsCard, styles.rhythmGraceCard, phoneLayout && styles.phonePrintOptionsCard, phoneLayout && styles.phoneRhythmGraceCard, accountDarkMode && styles.accountDarkMainCard]}>
            <View style={styles.printOptionsHeader}>
              <View style={styles.printOptionsTitleBlock}>
                <Text style={[styles.printOptionsTitle, accountDarkMode && styles.accountDarkTitle]}>Print worksheet</Text>
                <Text style={[styles.printOptionsSubtitle, accountDarkMode && styles.accountDarkMutedText]}>
                  {printWorksheetRequest.reference} · {methods.find((item) => item.id === printWorksheetMethodId)?.short || method.short} · {printWorksheetRequest.translation}
                </Text>
              </View>
              <Pressable onPress={() => setPrintWorksheetRequest(null)} style={styles.markupCloseButton}>
                <Ionicons name="close-outline" size={19} color={accountDarkMode ? "#c8bda9" : colors.muted} />
              </Pressable>
            </View>

            <View style={styles.printOptionGroup}>
              <Text style={[styles.printOptionLabel, accountDarkMode && styles.studyDarkAccentText]}>Method</Text>
              <View style={styles.printOptionChipRow}>
                {methods.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => setPrintWorksheetMethodId(item.id)}
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
                    onPress={() => setPrintWorksheetWritingSpace(key as WorksheetWritingSpace)}
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
                      onPress={() => setPrintWorksheetIncludes((current) => ({ ...current, [key]: !current[key as keyof typeof current] }))}
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
          <View style={styles.printOptionsOverlay}>
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
      {pendingRhythmGracePrompt && (
        <View style={styles.printOptionsOverlay}>
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
            <Text style={[styles.rhythmGraceBodyText, accountDarkMode && styles.accountDarkMutedText]}>
              This simply records today as a rhythm check-in. Your notes, reading plans, and memory verses stay unchanged.
            </Text>
            <View style={[styles.printOptionsActions, styles.rhythmGraceActions, phoneLayout && styles.phoneRhythmGraceActions]}>
              <ResumeButton label="Restore rhythm" icon="refresh-outline" onPress={restoreDailyRhythmFromGracePrompt} variant="primary" style={[styles.rhythmGracePrimaryButton, phoneLayout && styles.phonePrintOpenButton]} labelStyle={phoneLayout && styles.phonePrintOpenButtonText} />
              <Pressable onPress={dismissRhythmGracePrompt} style={[styles.rhythmGraceSecondaryButton, accountDarkMode && styles.printDarkCancelButton]}>
                <Text style={[styles.printOptionsCancelText, accountDarkMode && styles.homeDarkResumeButtonText]}>Not now</Text>
              </Pressable>
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
          <View style={styles.printOptionsOverlay}>
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
          <View style={styles.printOptionsOverlay}>
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
        <View style={styles.contextHelpOverlay}>
          <Pressable style={styles.contextHelpScrim} onPress={() => setContextHelpOpen(false)} />
          <View style={[styles.contextHelpCard, phoneLayout && styles.phoneContextHelpCard, accountDarkMode && styles.accountDarkMainCard]}>
            <View style={styles.contextHelpHeader}>
              <View style={styles.feedbackHeader}>
                <Ionicons name={activeContextHelp.icon as any} size={18} color={accountDarkMode ? "#e9b76a" : colors.coral} />
                <Text style={[styles.feedbackTitle, accountDarkMode && styles.accountDarkTitle]}>{activeContextHelp.title}</Text>
              </View>
              <Pressable onPress={() => setContextHelpOpen(false)} style={styles.markupCloseButton}>
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
    <View style={[styles.noteFormatToolbar, compact && styles.compactNoteFormatToolbar, darkMode && styles.accountDarkSection]}>
      <View style={styles.noteFormatButtonRow}>
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
          <Pressable onPress={(event) => onOpenSettings(event)} style={[styles.noteFormatButton, styles.noteSettingsButton, compact && styles.compactNoteFormatButton, darkMode && styles.studyDarkFormatButton]} accessibilityLabel="Editor settings">
            <Ionicons name="settings-outline" size={17} color={darkMode ? "#f7eddc" : colors.oliveDark} />
          </Pressable>
        )}
      </View>
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
    <View style={styles.printOptionsOverlay}>
      <Pressable style={[styles.printOptionsScrim, darkMode && styles.printDarkOptionsScrim]} onPress={onClose} />
      <View style={[styles.printOptionsCard, styles.editorSettingsCard, phoneLayout && styles.phonePrintOptionsCard, darkMode && styles.accountDarkMainCard]}>
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
    <View style={styles.printOptionsOverlay}>
      <Pressable style={[styles.printOptionsScrim, darkMode && styles.printDarkOptionsScrim]} onPress={onClose} />
      <View style={[styles.highlightColorPickerCard, darkMode && styles.accountDarkMainCard]}>
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

function LegalDocument({
  title,
  icon,
  open,
  sections,
  onToggle,
  darkMode = false
}: {
  title: string;
  icon: string;
  open: boolean;
  sections: { title: string; body: string }[];
  onToggle: () => void;
  darkMode?: boolean;
}) {
  return (
    <View style={[styles.legalDocBox, darkMode && styles.accountDarkLegalDocBox]}>
      <Pressable onPress={onToggle} style={styles.legalDocHeader}>
        <View style={styles.feedbackHeader}>
          <Ionicons name={icon as any} size={18} color={darkMode ? "#e9b76a" : colors.coral} />
          <Text style={[styles.feedbackTitle, darkMode && styles.accountDarkTitle]}>{title}</Text>
        </View>
        <Ionicons name={open ? "chevron-up-outline" : "chevron-down-outline"} size={17} color={darkMode ? "#c8bda9" : colors.muted} />
      </Pressable>
      {open && (
        <View style={styles.legalDocBody}>
          <Text style={[styles.legalUpdatedText, darkMode && styles.accountDarkMutedText]}>Last updated {LEGAL_LAST_UPDATED}</Text>
          {sections.map((section) => (
            <View key={section.title} style={styles.legalDocSection}>
              <Text style={[styles.legalDocSectionTitle, darkMode && styles.accountDarkTitle]}>{section.title}</Text>
              <Text style={[styles.legalDocText, darkMode && styles.accountDarkMutedText]}>{section.body}</Text>
            </View>
          ))}
        </View>
      )}
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
  return UI_PREFERENCE_KEYS.reduce<UiPreferenceMap>((preferences, key) => {
    if (typeof source[key] === "boolean") preferences[key] = source[key] as boolean;
    return preferences;
  }, {});
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

function pickResumeStepIndex(answers: { answer: string }[], requestedIndex: number) {
  if (answers[requestedIndex]?.answer?.trim()) return requestedIndex;

  for (let index = Math.min(requestedIndex, answers.length - 1); index >= 0; index -= 1) {
    if (answers[index]?.answer?.trim()) return index;
  }

  const firstAnswered = answers.findIndex((item) => item.answer.trim());
  return Math.max(0, firstAnswered);
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

function buildShareNote(method: (typeof methods)[number], answers: AnswerMap, passageReference: string) {
  const finalAnsweredStep = method.steps
    .map((item, index) => ({
      title: item.title,
      answer: answers[`${method.id}:${index}`] || ""
    }))
    .filter((item) => item.answer.trim())
    .at(-1);

  if (!finalAnsweredStep) return "";

  const cleaned = stripNoteFormatting(finalAnsweredStep.answer).trim().replace(/\s+/g, " ");
  const clipped = cleaned.length > 150 ? `${cleaned.slice(0, 147).trim()}...` : cleaned;
  return `${passageReference}: ${clipped}`;
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

function sanitizeEditorHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
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

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.paper,
    flex: 1,
    flexDirection: "row",
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    position: "relative"
  },
  appDarkScreen: {
    backgroundColor: "#171b1c"
  },
  compactScreen: {
    flexDirection: "column",
    maxWidth: "100%",
    minWidth: 0
  },
  mobileMenuBar: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderBottomColor: "rgba(108, 91, 67, 0.18)",
    borderBottomWidth: 1,
    elevation: 20,
    flexDirection: "row",
    gap: 10,
    maxWidth: "100%",
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: "relative",
    width: "100%",
    zIndex: 100
  },
  appDarkMobileMenuBar: {
    backgroundColor: "#1b211f",
    borderBottomColor: "rgba(233, 183, 106, 0.18)"
  },
  mobileMenuButton: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  appDarkMobileMenuButton: {
    backgroundColor: "#202625",
    borderColor: "rgba(233, 183, 106, 0.22)"
  },
  mobileMenuTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  mobileMenuTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  mobileMenuSubtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  sidebar: {
    backgroundColor: "#fff6eb",
    borderColor: "rgba(108, 91, 67, 0.18)",
    borderRightWidth: 1,
    gap: 22,
    padding: 16,
    width: 200
  },
  appDarkSidebar: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.18)"
  },
  compactSidebar: {
    borderBottomWidth: 1,
    borderRightWidth: 0,
    gap: 10,
    padding: 12,
    width: "100%"
  },
  hiddenMobileSidebar: {
    display: "none"
  },
  mobileMenuDrawer: {
    borderBottomWidth: 1,
    elevation: 18,
    paddingBottom: 12,
    position: "relative",
    zIndex: 90
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14
  },
  brandCopy: {
    flex: 1,
    minWidth: 0
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: colors.coral,
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  appDarkBrandMark: {
    backgroundColor: "#8f6a35"
  },
  brandMarkText: {
    color: "white",
    fontWeight: "800"
  },
  brandTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 21
  },
  tabs: {
    flexDirection: Platform.OS === "web" ? "column" : "row",
    flexWrap: "wrap",
    gap: 8
  },
  compactTabs: {
    flexDirection: "row",
    gap: 6
  },
  tab: {
    alignItems: "center",
    borderRadius: 9,
    flexDirection: "row",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12
  },
  appDarkTab: {
    borderColor: "rgba(233, 183, 106, 0.08)"
  },
  activeTab: {
    backgroundColor: colors.blush
  },
  appDarkActiveTab: {
    backgroundColor: "#2d352d",
    borderColor: "rgba(233, 183, 106, 0.28)"
  },
  tabLabel: {
    color: colors.muted,
    fontWeight: "700"
  },
  appDarkTabLabel: {
    color: "#c8bda9"
  },
  activeTabLabel: {
    color: colors.coral
  },
  appDarkActiveTabLabel: {
    color: "#e9b76a"
  },
  todayCard: {
    marginTop: 0
  },
  streakNumber: {
    color: colors.ink,
    fontSize: 36,
    fontWeight: "800"
  },
  progressTrack: {
    backgroundColor: "#dce4dc",
    borderRadius: 999,
    height: 10,
    marginVertical: 14,
    overflow: "hidden"
  },
  appDarkProgressTrack: {
    backgroundColor: "#151a19"
  },
  progressFill: {
    backgroundColor: colors.coral,
    height: "100%"
  },
  content: {
    flexGrow: 1,
    maxWidth: "100%",
    minWidth: 0,
    padding: 24
  },
  contentScroll: {
    flex: 1,
    maxWidth: "100%",
    minWidth: 0,
    width: "100%"
  },
  appDarkContent: {
    backgroundColor: "#171b1c"
  },
  phoneContent: {
    padding: 14
  },
  phoneMemoryPracticeScrollContent: {
    paddingBottom: 220
  },
  contentWithMobileReaderDock: {
    paddingBottom: 172
  },
  contentWithMobileReaderNoteDock: {
    paddingBottom: 292
  },
  layout: {
    flexDirection: "row",
    gap: 18,
    maxWidth: "100%",
    minWidth: 0
  },
  homeLayout: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 18,
    maxWidth: "100%",
    minWidth: 0
  },
  homeDarkLayout: {
    backgroundColor: "#171b1c"
  },
  homeMainCard: {
    flex: 1,
    gap: 20,
    maxWidth: "100%",
    minWidth: 0
  },
  homeHero: {
    borderBottomColor: "rgba(102, 114, 78, 0.18)",
    borderBottomWidth: 1,
    gap: 14,
    paddingBottom: 18
  },
  homeDarkHero: {
    borderBottomColor: "rgba(233, 183, 106, 0.18)"
  },
  homeHeroTitle: {
    color: colors.ink,
    fontFamily: Platform.select({ ios: "Georgia", web: "Georgia", default: undefined }),
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 48
  },
  homeDarkHeroTitle: {
    color: "#f7eddc"
  },
  homeHeroTitleAccent: {
    color: colors.oliveDark,
    fontFamily: Platform.select({ ios: "Georgia", web: "Georgia", default: undefined }),
    fontStyle: "italic",
    fontWeight: "700"
  },
  homeDarkHeroTitleAccent: {
    color: "#e9b76a"
  },
  phoneHomeHeroTitle: {
    fontSize: 34,
    lineHeight: 40
  },
  homeHeroText: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "500",
    lineHeight: 27,
    maxWidth: 720
  },
  homeDarkHeroText: {
    color: "#f7eddc"
  },
  homePurposePanel: {
    backgroundColor: "#fffaf2",
    borderColor: "rgba(102, 114, 78, 0.22)",
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  homeDarkPurposePanel: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  homePurposeTitle: {
    color: colors.oliveDark,
    fontSize: 16,
    fontWeight: "900"
  },
  homePurposeText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 21
  },
  homePurposePillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  homePurposePill: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  homeDarkPurposePill: {
    backgroundColor: "#242b2a",
    borderColor: "rgba(233, 183, 106, 0.18)"
  },
  homePurposePillText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  homeActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
    maxWidth: "100%",
    minWidth: 0,
    width: "100%"
  },
  homePhoneActionButton: {
    flex: 1,
    minWidth: 0
  },
  homeScriptureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    maxWidth: "100%",
    minWidth: 0
  },
  homeScriptureBlock: {
    backgroundColor: "#fffdf8",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 10,
    maxWidth: "100%",
    minWidth: 240,
    padding: 16
  },
  homeDarkScriptureBlock: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  homeScriptureIcon: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  homeDarkIconBubble: {
    backgroundColor: "#2d352d"
  },
  homeScriptureRef: {
    color: colors.coral,
    fontSize: 13,
    fontWeight: "900"
  },
  homeDarkAccentText: {
    color: "#e9b76a"
  },
  homeScriptureQuote: {
    color: colors.ink,
    fontFamily: Platform.select({ ios: "Georgia", web: "Georgia", default: undefined }),
    fontSize: 20,
    fontStyle: "italic",
    fontWeight: "600",
    lineHeight: 29
  },
  homeScriptureNote: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 21
  },
  homeSideColumn: {
    gap: 18,
    maxWidth: "100%",
    minWidth: 0,
    width: 360
  },
  homeSideCard: {
    gap: 12,
    maxWidth: "100%",
    minWidth: 0
  },
  homeContinueCard: {
    borderColor: "rgba(201, 103, 80, 0.28)",
    borderWidth: 1.5
  },
  homeSideTitle: {
    color: colors.oliveDark,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 2
  },
  homePathList: {
    gap: 8,
    maxWidth: "100%",
    minWidth: 0
  },
  homePathItem: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    maxWidth: "100%",
    minWidth: 0,
    padding: 11
  },
  homeContinueItem: {
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.52)",
    borderWidth: 1.5
  },
  homeDarkContinueItem: {
    backgroundColor: "#211d18",
    borderColor: "rgba(233, 183, 106, 0.38)",
    borderWidth: 1.5
  },
  homeDarkPathItem: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  homeDarkMetric: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.16)",
    borderWidth: 1
  },
  homeDarkMetricValue: {
    color: "#e9b76a"
  },
  homeDarkResumeButton: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.26)"
  },
  homeDarkResumeButtonText: {
    color: "#f7eddc"
  },
  homePathIcon: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  homePathTextBlock: {
    flex: 1,
    maxWidth: "100%",
    minWidth: 0
  },
  homePathTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  homePathDetail: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
    marginTop: 2
  },
  homeMetricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  homeSmallActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  bibleReaderLayout: {
    flexDirection: "row",
    gap: 18,
    maxWidth: "100%",
    minWidth: 0
  },
  bibleReaderNavCard: {
    gap: 12,
    width: 330
  },
  collapsedBibleReaderNavCard: {
    alignItems: "center",
    paddingHorizontal: 10,
    width: 68
  },
  compactCollapsedBibleReaderNavCard: {
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    width: "100%"
  },
  readerNavHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  compactCollapsedReaderNavHeader: {
    justifyContent: "center",
    width: "100%"
  },
  readerNavTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  collapsedReaderIconStack: {
    alignItems: "center",
    gap: 9
  },
  compactCollapsedReaderIconStack: {
    flexDirection: "row",
    justifyContent: "center"
  },
  collapsedReaderIconButton: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  inactiveCollapsedReaderIconButton: {
    opacity: 0.62
  },
  bibleReaderContentCard: {
    flex: 1,
    gap: 14,
    maxWidth: "100%",
    minWidth: 0
  },
  bibleSearchPanel: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    maxWidth: "100%",
    minWidth: 0,
    padding: 14
  },
  bibleSearchHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    maxWidth: "100%",
    minWidth: 0
  },
  bibleSearchHeaderMeta: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 8
  },
  bibleSearchTranslationText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  bibleSearchInputRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    maxWidth: "100%",
    minWidth: 0
  },
  bibleSearchInput: {
    flex: 1,
    marginBottom: 0,
    minWidth: 220
  },
  phoneBibleSearchInputRow: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 8,
    width: "100%"
  },
  phoneBibleSearchInput: {
    fontSize: 16,
    minWidth: 0,
    width: "100%"
  },
  phoneBibleSearchButton: {
    flex: 1,
    minWidth: 0,
    width: "100%"
  },
  bibleSearchClearButton: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    maxWidth: "100%",
    minHeight: 42,
    paddingHorizontal: 13
  },
  bibleSearchClearText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  bibleSearchSummaryBlock: {
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.28)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    maxWidth: "100%",
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  bibleSearchStatusText: {
    color: colors.coral,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 19
  },
  bibleSearchDurationText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  mobileBibleCriteriaDropdown: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    width: "100%"
  },
  mobileBibleCriteriaHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    maxWidth: "100%",
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  mobileBibleCriteriaCopy: {
    flex: 1,
    minWidth: 0
  },
  mobileBibleCriteriaTitle: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "900"
  },
  mobileBibleCriteriaSummary: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2
  },
  mobileBibleCriteriaPanel: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    gap: 12,
    padding: 12
  },
  mobileBibleCriteriaGroup: {
    gap: 7,
    maxWidth: "100%",
    minWidth: 0
  },
  mobileBibleCriteriaLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  mobileBibleCriteriaChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    maxWidth: "100%",
    minWidth: 0
  },
  bibleSearchControls: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    maxWidth: "100%",
    minWidth: 0
  },
  phoneBibleSearchControls: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    maxWidth: "100%",
    width: "100%"
  },
  bibleSearchRefineRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    maxWidth: "100%",
    minWidth: 0
  },
  phoneBibleSearchRefineRow: {
    alignItems: "flex-start",
    flexWrap: "wrap",
    maxWidth: "100%",
    width: "100%"
  },
  bibleSearchModeGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    maxWidth: "100%",
    minWidth: 0
  },
  bibleSearchBookFilter: {
    maxWidth: "100%",
    minWidth: 150,
    width: 170
  },
  phoneBibleSearchBookFilter: {
    minWidth: 0,
    width: "100%"
  },
  bibleSearchExactChip: {
    flexShrink: 0
  },
  bibleSearchChip: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    maxWidth: "100%",
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  phoneBibleSearchChip: {
    flexShrink: 1,
    height: 36,
    maxWidth: "100%",
    minWidth: 0,
    paddingHorizontal: 9,
    paddingVertical: 0
  },
  activeBibleSearchChip: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  bibleSearchChipText: {
    color: colors.oliveDark,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "800",
    minWidth: 0
  },
  bibleSearchSelect: {
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
    minHeight: 34,
    paddingHorizontal: 11,
    width: "100%"
  },
  phoneBibleSearchSelect: {
    height: 36,
    minHeight: 36
  },
  bibleSearchSelectButton: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 34,
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  phoneBibleSearchSelectButton: {
    height: 36,
    minHeight: 36,
    paddingVertical: 0
  },
  bibleSearchSelectText: {
    color: colors.ink,
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    minWidth: 0
  },
  bibleSearchSelectMenu: {
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 220,
    overflow: "hidden"
  },
  bibleSearchSelectOption: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  activeBibleSearchSelectOption: {
    backgroundColor: colors.oliveDark
  },
  bibleSearchSelectOptionText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  activeBibleSearchChipText: {
    color: "white"
  },
  bibleSearchFootnote: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  bibleSearchResultSection: {
    gap: 8,
    marginTop: 4
  },
  bibleSearchSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  bibleSearchSectionCount: {
    backgroundColor: colors.coral,
    borderRadius: 999,
    color: "white",
    fontSize: 11,
    fontWeight: "900",
    minWidth: 24,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3,
    textAlign: "center"
  },
  bibleSearchResultCard: {
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 11
  },
  bibleSearchResultHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between"
  },
  bibleSearchResultReference: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  bibleSearchSourceQuery: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  bibleSearchResultText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20
  },
  bibleSearchResultActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    maxWidth: "100%",
    minWidth: 0
  },
  readerHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    maxWidth: "100%",
    minWidth: 0
  },
  readerTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    maxWidth: "100%",
    minWidth: 0
  },
  readerBookSections: {
    gap: 14
  },
  mobileReaderPicker: {
    gap: 12
  },
  mobileReaderDropdown: {
    gap: 8,
    minWidth: 0,
    width: "100%"
  },
  mobileReaderDropdownButton: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 11
  },
  mobileReaderDropdownText: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    minWidth: 0
  },
  mobileReaderBookList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  mobileReaderBookBlock: {
    gap: 7
  },
  expandedMobileReaderBookBlock: {
    width: "100%"
  },
  mobileReaderBookOption: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  activeMobileReaderBookOption: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  mobileReaderBookText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800"
  },
  activeMobileReaderBookText: {
    color: "white"
  },
  mobileReaderChapterPanel: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 9,
    maxWidth: "100%",
    padding: 10
  },
  mobileReaderChapterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  mobileReaderChapterSquare: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: 1,
    justifyContent: "center",
    width: 38
  },
  readMobileReaderChapterSquare: {
    backgroundColor: "#edf2dc",
    borderColor: "rgba(102, 114, 78, 0.38)"
  },
  darkReadMobileReaderChapterSquare: {
    backgroundColor: "rgba(233, 183, 106, 0.14)",
    borderColor: "rgba(233, 183, 106, 0.38)"
  },
  activeMobileReaderChapterSquare: {
    backgroundColor: colors.coral,
    borderColor: colors.coral
  },
  mobileReaderChapterText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900"
  },
  readMobileReaderChapterText: {
    color: colors.oliveDark
  },
  darkReadMobileReaderChapterText: {
    color: "#e9b76a"
  },
  activeMobileReaderChapterText: {
    color: "white"
  },
  readerChapterPanelHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  readerChapterReadCountText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900"
  },
  memoryBookFilterOption: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7
  },
  memoryBookCountText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 12
  },
  memoryChapterAllSquare: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 10
  },
  memoryChapterCountText: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "900",
    lineHeight: 10
  },
  readerBookmarkSection: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    gap: 8,
    paddingBottom: 12
  },
  readerHistorySection: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    gap: 8,
    paddingBottom: 12
  },
  readerHistoryHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  readerHistoryActions: {
    alignItems: "flex-end"
  },
  readerHistoryClearButton: {
    paddingHorizontal: 4,
    paddingVertical: 3
  },
  readerHistoryList: {
    gap: 6
  },
  bibleReadingPlanPanel: {
    backgroundColor: "#fffaf3",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 10
  },
  compactBibleReadingPlanPanel: {
    gap: 7,
    paddingVertical: 9
  },
  bibleReadingPlanStack: {
    gap: 8,
    marginBottom: 14
  },
  bibleReadingPlanHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  bibleReadingPlanTitleBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  bibleReadingPlanChooser: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  bibleReadingPlanStarter: {
    gap: 8,
    marginBottom: 14
  },
  phoneBibleReadingPlanChooser: {
    flexWrap: "wrap"
  },
  bibleReadingPlanChip: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 32,
    maxWidth: 180,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  bibleReadingPlanChipText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900"
  },
  bibleReadingPlanToday: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 9
  },
  clickableBibleReadingPlanToday: {
    borderColor: "rgba(185, 91, 72, 0.34)"
  },
  bibleReadingPlanOpenHint: {
    color: colors.coral,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  bibleReadingPlanStatusText: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  bibleReadingPlanMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  bibleReadingPlanMetaChip: {
    backgroundColor: "#fff6eb",
    borderRadius: 999,
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  bibleReadingPlanDoneRow: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: "rgba(102, 114, 78, 0.24)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    padding: 9
  },
  bibleReadingPlanDoneIcon: {
    alignItems: "center",
    backgroundColor: "#edf3e4",
    borderColor: "rgba(102, 114, 78, 0.28)",
    borderRadius: 999,
    borderWidth: 1,
    height: 26,
    justifyContent: "center",
    width: 26
  },
  bibleReadingPlanDoneTextBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  bibleReadingPlanTodayHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  bibleReadingPlanTodayTitleBlock: {
    flex: 1,
    gap: 3,
    minWidth: 0
  },
  bibleReadingPlanActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  phoneBibleReadingPlanActions: {
    alignItems: "stretch",
    flexDirection: "column"
  },
  planCustomForm: {
    gap: 9
  },
  planCustomDaysInput: {
    minHeight: 110,
    textAlignVertical: "top"
  },
  readerQuickListToggle: {
    alignItems: "center",
    backgroundColor: "#f8efe4",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    padding: 4
  },
  readerQuickListToggleButton: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minHeight: 30,
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  readerQuickListToggleText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900"
  },
  readerQuickListToggleCount: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900"
  },
  readerHistoryChip: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 9
  },
  readerHistoryText: {
    color: colors.ink,
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    minWidth: 0
  },
  readerHistoryTranslation: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900"
  },
  readerReadChapterList: {
    gap: 8
  },
  readerReadChapterSwipeWrap: {
    overflow: "hidden",
    position: "relative"
  },
  readerReadChapterSwipeClear: {
    alignItems: "center",
    backgroundColor: colors.coral,
    borderRadius: 10,
    bottom: 0,
    gap: 2,
    justifyContent: "center",
    paddingHorizontal: 8,
    position: "absolute",
    right: 0,
    top: 0,
    width: 70
  },
  readerReadChapterSwipeClearText: {
    color: "white",
    fontSize: 10,
    fontWeight: "900"
  },
  readerReadChapterBook: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    gap: 7,
    paddingHorizontal: 9,
    paddingVertical: 8
  },
  readerReadChapterBookRevealed: {
    transform: [{ translateX: -76 }]
  },
  readerReadChapterBookHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  readerReadChapterBookMeta: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 8
  },
  readerReadChapterBookTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    minWidth: 0
  },
  readerReadChapterClearButton: {
    paddingHorizontal: 4,
    paddingVertical: 3
  },
  readerReadChapterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  readerReadChapterChip: {
    alignItems: "center",
    backgroundColor: "#fffdf8",
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 28,
    minWidth: 34,
    paddingHorizontal: 8
  },
  readerReadChapterChipText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "900"
  },
  readerBookmarkHeader: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  readerBookmarkHeaderTitle: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: 6,
    minWidth: 0
  },
  readerBookmarkHeaderMeta: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 6
  },
  readerBookmarkCount: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900"
  },
  readerBookmarkSearchInput: {
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  readerBookmarkFilterChip: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  readerBookmarkFilterText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  readerBookmarkExpandButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 4
  },
  readerBookmarkExpandText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  readerBookmarkItem: {
    gap: 6
  },
  readerBookmarkRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  readerBookmarkOpen: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    minWidth: 0,
    paddingHorizontal: 9,
    paddingVertical: 8
  },
  readerBookmarkText: {
    color: colors.ink,
    flex: 1,
    fontSize: 12,
    fontWeight: "800"
  },
  readerBookmarkIconButton: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 31,
    justifyContent: "center",
    width: 31
  },
  activeBookmarkNoteButton: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  readerBookmarkRemove: {
    padding: 6
  },
  readerBookmarkNoteEditor: {
    gap: 8
  },
  readerBookmarkNoteInput: {
    minHeight: 70,
    textAlignVertical: "top"
  },
  mobileReaderBookmarkNoteInput: {
    fontSize: 16,
    lineHeight: 22
  },
  readerBookmarkNoteActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  readerBookSection: {
    gap: 8
  },
  readerBookSectionTitle: {
    color: colors.coral,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  readerBookGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  desktopReaderBookList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  desktopReaderBookBlock: {
    gap: 7
  },
  expandedDesktopReaderBookBlock: {
    width: "100%"
  },
  readerBookChip: {
    alignSelf: "flex-start",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  activeReaderBookChip: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  readerBookText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800"
  },
  activeReaderBookText: {
    color: "white"
  },
  desktopReaderChapterPanel: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 9,
    maxWidth: "100%",
    padding: 10
  },
  desktopReaderChapterHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  desktopReaderChapterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  readerNavigationRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 7,
    justifyContent: "space-between",
    maxWidth: "100%",
    minWidth: 0
  },
  phoneReaderNavigationRow: {
    gap: 4,
    maxWidth: "100%",
    width: "100%"
  },
  readerNavIconButton: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  phoneReaderNavIconButton: {
    height: 34,
    width: 34
  },
  readerIconTooltip: {
    alignSelf: "flex-start",
    backgroundColor: colors.oliveDark,
    borderRadius: 999,
    color: "white",
    fontSize: 12,
    fontWeight: "800",
    marginTop: -6,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  readerChapterControl: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    maxWidth: "100%",
    minWidth: 132,
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  phoneReaderChapterControl: {
    flex: 1,
    gap: 4,
    maxWidth: 132,
    minWidth: 0,
    paddingHorizontal: 6
  },
  readerChapterLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  phoneReaderChapterLabel: {
    flexShrink: 0,
    fontSize: 11
  },
  readerChapterInput: {
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 9,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    minWidth: 40,
    paddingHorizontal: 6,
    paddingVertical: 4,
    textAlign: "center"
  },
  phoneReaderChapterInput: {
    fontSize: 14,
    height: 28,
    minWidth: 0,
    paddingHorizontal: 4,
    width: 42
  },
  readerChapterCountText: {
    color: colors.muted,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "800",
    minWidth: 0
  },
  phoneReaderChapterCountText: {
    flexShrink: 1,
    fontSize: 11
  },
  readerReadButton: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  activeReaderReadButton: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  activeReaderBookmarkButton: {
    backgroundColor: colors.coral,
    borderColor: colors.coral
  },
  readerReadButtonText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  activeReaderReadButtonText: {
    color: "white"
  },
  readerProgressRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
    marginTop: -6
  },
  readerProgressText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  readerProgressClearButton: {
    paddingHorizontal: 4,
    paddingVertical: 2
  },
  readerProgressClearText: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "900"
  },
  mobileReaderSelectionDock: {
    backgroundColor: "#fff6eb",
    borderColor: "rgba(102, 114, 78, 0.22)",
    borderRadius: 14,
    borderWidth: 1,
    bottom: 12,
    gap: 8,
    left: 12,
    padding: 9,
    position: "absolute",
    right: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    zIndex: 200
  },
  mobileReaderSelectionText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  mobileReaderSelectionActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  mobileReaderSelectionButton: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    flexBasis: "24%",
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 0,
    paddingHorizontal: 7
  },
  primaryMobileReaderSelectionButton: {
    backgroundColor: colors.olive,
    borderColor: colors.olive
  },
  mobileReaderMemoryButton: {
    backgroundColor: colors.coral,
    borderColor: colors.coral
  },
  savedMemoryButton: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  mobileReaderSelectionButtonText: {
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "900"
  },
  primaryMobileReaderSelectionButtonText: {
    color: "white"
  },
  mobileReaderSelectionIconButton: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    marginLeft: "auto",
    width: 34
  },
  mobileReaderNoteEditor: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 9
  },
  readerPassageBox: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    maxWidth: "100%",
    minWidth: 0,
    padding: 14
  },
  phoneReaderPassageBox: {
    paddingHorizontal: 8,
    paddingVertical: 10
  },
  phoneReaderPassageWithSelectionDock: {
    paddingBottom: 146
  },
  readerBottomNav: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
    maxWidth: "100%",
    minWidth: 0,
    marginTop: 4,
    paddingTop: 12
  },
  readerPlanCompletionBox: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    padding: 10
  },
  phoneReaderPlanCompletionBox: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 8
  },
  readerPlanCompletionCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  phoneReaderPlanCompletionActions: {
    alignItems: "stretch",
    alignSelf: "stretch",
    flexDirection: "row",
    flexWrap: "nowrap",
    width: "100%"
  },
  phoneReaderPlanCompletionExitButton: {
    flex: 1,
    justifyContent: "center",
    minHeight: 38,
    minWidth: 0,
    paddingHorizontal: 8
  },
  phoneReaderPlanCompletionPrimaryButton: {
    flex: 1,
    justifyContent: "center",
    minHeight: 38,
    minWidth: 0,
    paddingHorizontal: 8
  },
  phoneReaderPlanCompletionButtonText: {
    flexShrink: 1,
    textAlign: "center"
  },
  readerPlanCompleteButton: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark,
    flexShrink: 0
  },
  readerPlanCompletedStatus: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 5,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 4
  },
  readerPlanCompletedStatusDark: {
    backgroundColor: "transparent"
  },
  readerPlanCompletedStatusText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  readerPlanCompletedStatusTextDark: {
    color: "#dcebc8"
  },
  readerBottomNavButton: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 1,
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  readerBottomReadButton: {
    backgroundColor: colors.sage,
    borderColor: "rgba(102, 114, 78, 0.24)"
  },
  readerBottomNavText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  readerVerseRow: {
    alignItems: "flex-start",
    borderColor: "transparent",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    maxWidth: "100%",
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  phoneReaderVerseRow: {
    gap: 5,
    paddingHorizontal: 2,
    paddingVertical: 4
  },
  readerVerseIconRow: {
    alignItems: "center",
    flexDirection: "column",
    gap: 4,
    paddingTop: 3,
    width: 17
  },
  phoneReaderVerseIconRow: {
    width: 16
  },
  selectedReaderVerseRow: {
    backgroundColor: "#f4dfb6"
  },
  phoneSelectedReaderVerseRow: {
    borderColor: colors.coral,
    borderLeftWidth: 4,
    paddingLeft: 7
  },
  inlineReaderActionBar: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#fbf2e4",
    borderColor: "#ead8bc",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
    marginBottom: 6,
    marginLeft: 32,
    marginTop: 2,
    maxWidth: "100%",
    minWidth: 0,
    padding: 10
  },
  inlineStudyMarkupBar: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 7,
    marginLeft: 28,
    padding: 8
  },
  phoneInlineStudyMarkupBar: {
    marginLeft: 20,
    padding: 8
  },
  selectedMarkupHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    minWidth: 0
  },
  selectedMarkupCloseButton: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 0,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  inlineReaderActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  inlineReaderStudyButton: {
    backgroundColor: colors.olive,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  inlineReaderStudyText: {
    color: "white",
    fontSize: 12,
    fontWeight: "900"
  },
  inlineReaderBookmarkButton: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  compactInlineActionButton: {
    minHeight: 32,
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  inlineReaderBookmarkText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  memoryReaderButton: {
    backgroundColor: colors.coral,
    borderColor: colors.coral
  },
  memoryReaderButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "900"
  },
  readerSelectionBar: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
    minWidth: 0,
    padding: 10
  },
  readerSelectionText: {
    color: colors.oliveDark,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800"
  },
  readerVerseNumber: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 22,
    minWidth: 24,
    textAlign: "right"
  },
  phoneReaderVerseNumber: {
    minWidth: 18
  },
  readerVerseText: {
    color: colors.ink,
    flex: 1,
    fontSize: 17,
    lineHeight: 27,
    minWidth: 0
  },
  phoneReaderVerseText: {
    fontSize: 16,
    lineHeight: 25
  },
  stackedLayout: {
    flexDirection: "column"
  },
  mainCard: {
    flex: 1,
    minWidth: 0
  },
  focusLayout: {
    gap: 0
  },
  coachCard: {
    gap: 14,
    width: 250
  },
  memoryCoachCard: {
    gap: 14,
    width: 430
  },
  fluidCard: {
    minWidth: 0,
    width: "100%"
  },
  coachTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800"
  },
  studyGuidedHeader: {
    alignItems: "flex-start",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 14,
    padding: 14,
    position: "relative"
  },
  phoneStudyGuidedHeader: {
    paddingRight: 14,
    position: "relative"
  },
  studyGuidedTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
    width: "100%"
  },
  phoneStudyGuidedTopRow: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 10,
    paddingRight: 96
  },
  studyGuidedDescriptionRow: {
    width: "100%"
  },
  phoneStudyGuidedDescriptionRow: {
    paddingRight: 0
  },
  studyGuidedTitleBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 0
  },
  phoneStudyGuidedTitleBlock: {
    flex: 0,
    width: "100%"
  },
  phoneStudyGuidedTitle: {
    fontSize: 20,
    lineHeight: 25
  },
  studyHeaderControls: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexShrink: 1,
    gap: 8,
    justifyContent: "flex-end",
    maxWidth: 430,
    minWidth: 0
  },
  phoneStudyHeaderControls: {
    alignItems: "flex-start",
    flexDirection: "column",
    maxWidth: "100%",
    width: "100%"
  },
  studyFocusHeaderToggle: {
    flexShrink: 0
  },
  phoneStudyFocusHeaderToggle: {
    position: "absolute",
    right: 12,
    top: 12
  },
  compactMethodPicker: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    maxWidth: "100%",
    minHeight: 38,
    minWidth: 0,
    paddingHorizontal: 12
  },
  compactMethodLabel: {
    color: colors.oliveDark,
    flexShrink: 0,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  compactMethodChips: {
    flexDirection: "row",
    flexShrink: 1,
    flexWrap: "wrap",
    gap: 5,
    justifyContent: "flex-end",
    minWidth: 0
  },
  compactMethodCurrent: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "900"
  },
  compactMethodMenu: {
    alignSelf: "flex-end",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    justifyContent: "flex-end",
    marginBottom: 12,
    marginTop: -6,
    maxWidth: 430,
    padding: 8
  },
  compactMethodChip: {
    backgroundColor: "#fff6eb",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  activeCompactMethodChip: {
    backgroundColor: colors.oliveDark
  },
  compactMethodText: {
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "900"
  },
  activeCompactMethodText: {
    color: "white"
  },
  studyProgressStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8
  },
  phoneStudyProgressStrip: {
    gap: 6
  },
  studyProgressPill: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderColor: "transparent",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    flexGrow: 1,
    flexShrink: 1,
    gap: 7,
    minHeight: 36,
    minWidth: 120,
    paddingHorizontal: 10
  },
  completedStudyProgressPill: {
    backgroundColor: colors.sage
  },
  activeStudyProgressPill: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  studyProgressNumber: {
    backgroundColor: "white",
    borderRadius: 999,
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900",
    height: 22,
    lineHeight: 22,
    overflow: "hidden",
    textAlign: "center",
    width: 22
  },
  completedStudyProgressNumber: {
    backgroundColor: "#fffaf2"
  },
  activeStudyProgressNumber: {
    color: colors.oliveDark
  },
  studyProgressText: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    minWidth: 0
  },
  completedStudyProgressText: {
    color: colors.oliveDark
  },
  activeStudyProgressText: {
    color: "white"
  },
  studyIntro: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    marginBottom: 18
  },
  studyIntroCopy: {
    flex: 1,
    minWidth: 0
  },
  methodPill: {
    alignItems: "center",
    backgroundColor: colors.oliveDark,
    borderRadius: 999,
    minWidth: 52,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  methodPillText: {
    color: "white",
    fontSize: 13,
    fontWeight: "800"
  },
  title: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: "800",
    lineHeight: 28,
    marginBottom: 3
  },
  methodFullName: {
    color: colors.oliveDark,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 5
  },
  inlineMethodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14
  },
  inlineMethodChip: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  activeInlineMethodChip: {
    backgroundColor: colors.oliveDark
  },
  inlineMethodText: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "700"
  },
  activeInlineMethodText: {
    color: "white"
  },
  coachingToggleRow: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: "rgba(102, 114, 78, 0.18)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  togglePill: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  activeTogglePill: {
    backgroundColor: colors.oliveDark
  },
  toggleText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  activeToggleText: {
    color: "white"
  },
  titleSupport: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22
  },
  input: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 11,
    borderWidth: 1,
    color: colors.ink,
    marginBottom: 14,
    maxWidth: "100%",
    minHeight: 48,
    paddingHorizontal: 14
  },
  accountAuthInput: {
    fontSize: 16,
    lineHeight: 22
  },
  smartPassageBox: {
    backgroundColor: "#fffdfa",
    borderColor: colors.coral,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 14,
    maxWidth: "100%",
    minWidth: 0,
    padding: 12
  },
  smartPassageHeader: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    minWidth: 0,
    paddingHorizontal: 12
  },
  smartPassageInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    minHeight: 44,
    minWidth: 0,
    outlineStyle: "none" as any
  },
  useInlineButton: {
    backgroundColor: colors.coral,
    borderRadius: 999,
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  useInlineText: {
    color: "white",
    fontWeight: "800"
  },
  textarea: {
    minHeight: 150,
    paddingTop: 14,
    textAlignVertical: "top"
  },
  noteFormatToolbar: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    marginTop: -6,
    padding: 8
  },
  compactNoteFormatToolbar: {
    alignItems: "flex-start",
    flexDirection: "column",
    gap: 7,
    marginTop: 0,
    padding: 9
  },
  mobileNoteFormatBar: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    marginBottom: 12,
    marginTop: -4,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    width: "100%",
    zIndex: 80
  },
  floatingMobileNoteFormatBar: {
    marginBottom: 0,
    marginTop: 0,
    maxWidth: 292,
    position: "absolute",
    width: 292
  },
  mobileNoteFormatButton: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: "rgba(102, 114, 78, 0.24)",
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  mobileHighlightSwatch: {
    borderColor: "rgba(36, 29, 25, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    height: 18,
    width: 18
  },
  noteFormatButtonRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 7,
    width: "100%"
  },
  noteFormatMainButtons: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    flexWrap: "wrap",
    gap: 7,
    minWidth: 0
  },
  noteFormatButton: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: "rgba(102, 114, 78, 0.24)",
    borderRadius: 9,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  compactNoteFormatButton: {
    height: 42,
    width: 42
  },
  noteSettingsButton: {
    marginLeft: "auto"
  },
  activeNoteFormatButton: {
    backgroundColor: colors.coral,
    borderColor: colors.coral
  },
  noteFormatText: {
    color: colors.oliveDark,
    fontSize: 15,
    fontWeight: "900"
  },
  activeNoteFormatText: {
    color: "white"
  },
  noteFormatTooltip: {
    backgroundColor: colors.oliveDark,
    borderRadius: 999,
    color: "white",
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  noteFormatBold: {
    fontWeight: "900"
  },
  noteFormatItalic: {
    fontStyle: "italic"
  },
  noteFormatUnderline: {
    textDecorationLine: "underline"
  },
  noteFormatHighlight: {
    backgroundColor: "#f4dfb6",
    borderRadius: 5,
    overflow: "hidden",
    paddingHorizontal: 3
  },
  studyDarkNoteFormatHighlight: {
    backgroundColor: "#e9b76a",
    color: "#171b1c"
  },
  activeNoteHighlightFormatText: {
    backgroundColor: "transparent",
    color: "white"
  },
  noteFormatHelp: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    minWidth: 180
  },
  compactNoteFormatHelp: {
    alignSelf: "stretch",
    flex: 0,
    minWidth: 0,
    width: "100%"
  },
  writingPromptBox: {
    backgroundColor: "#fffaf2",
    borderColor: "rgba(102, 114, 78, 0.16)",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    marginTop: -4,
    padding: 10
  },
  compactWritingPromptBox: {
    marginBottom: 8,
    marginTop: -2,
    padding: 7
  },
  writingPromptHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8
  },
  compactWritingPromptHeader: {
    marginBottom: 5
  },
  writingPromptTitleButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    minHeight: 26
  },
  compactWritingPromptTitleButton: {
    flex: 1,
    justifyContent: "space-between",
    minWidth: 0
  },
  writingPromptLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  customizePromptButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3
  },
  compactCustomizePromptButton: {
    paddingHorizontal: 3,
    paddingVertical: 2
  },
  customizePromptText: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "800"
  },
  writingPromptRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  compactWritingPromptRow: {
    gap: 5
  },
  writingPromptChip: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 999,
    flexDirection: "row",
    overflow: "hidden"
  },
  compactWritingPromptChip: {
    borderRadius: 10,
    flexBasis: "100%",
    flexShrink: 1,
    maxWidth: "100%"
  },
  writingPromptInsert: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 7
  },
  compactWritingPromptInsert: {
    gap: 0,
    justifyContent: "flex-start",
    paddingLeft: 8,
    paddingRight: 8,
    paddingVertical: 6,
    width: "100%"
  },
  writingPromptText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  compactWritingPromptText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15
  },
  removePromptButton: {
    borderColor: "rgba(102, 114, 78, 0.18)",
    borderLeftWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8
  },
  compactRemovePromptButton: {
    paddingHorizontal: 6,
    paddingVertical: 6
  },
  customPromptEditor: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 10
  },
  customPromptInput: {
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.ink,
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 10
  },
  addPromptButton: {
    backgroundColor: colors.coral,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  addPromptText: {
    color: "white",
    fontWeight: "800"
  },
  writingPromptStatus: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8
  },
  responseFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: -6
  },
  responseWorkspace: {
    gap: 12
  },
  responseEditorColumn: {
    flex: 1,
    minWidth: 0
  },
  saveStatus: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  warningText: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  savedStepBox: {
    backgroundColor: "#fff6eb",
    borderColor: "rgba(102, 114, 78, 0.2)",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    marginTop: -4,
    padding: 12
  },
  savedStepTitle: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
    textTransform: "uppercase"
  },
  savedStepRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  savedStepChip: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  activeSavedStepChip: {
    backgroundColor: colors.oliveDark
  },
  savedStepChipText: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "700"
  },
  activeSavedStepChipText: {
    color: "white"
  },
  coachingBox: {
    backgroundColor: colors.sage,
    borderColor: "rgba(102, 114, 78, 0.2)",
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 14,
    padding: 12
  },
  coachingHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minWidth: 0
  },
  coachingToggleBadge: {
    backgroundColor: colors.soft,
    borderRadius: 999,
    color: colors.muted,
    flexShrink: 0,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  activeCoachingToggleBadge: {
    backgroundColor: colors.oliveDark
  },
  activeCoachingToggleText: {
    color: "white",
    fontSize: 12,
    fontWeight: "900"
  },
  collapsedCoachingBox: {
    backgroundColor: "#fff6eb",
    borderColor: "rgba(102, 114, 78, 0.16)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    marginBottom: 14,
    padding: 10
  },
  collapsedCoachingText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  coachingItem: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8
  },
  coachingText: {
    color: colors.oliveDark,
    flex: 1,
    fontSize: 14,
    lineHeight: 20
  },
  aiOptionCard: {
    alignItems: "flex-start",
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.18)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    maxWidth: "100%",
    minWidth: 0,
    padding: 11
  },
  aiOptionCopy: {
    flex: 1,
    minWidth: 0
  },
  aiOptionTitle: {
    color: colors.oliveDark,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 3
  },
  aiOptionText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  feedbackHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    minWidth: 0
  },
  collapsiblePanelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8
  },
  collapsiblePanelTitle: {
    flex: 1,
    marginBottom: 0,
    minWidth: 0
  },
  feedbackTitle: {
    color: colors.coral,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  studyPlansBox: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 14
  },
  planSelectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  planChip: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  activePlanChip: {
    backgroundColor: colors.oliveDark
  },
  planChipText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  activePlanChipText: {
    color: "white"
  },
  planDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  planProgressText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  currentPlanBox: {
    backgroundColor: colors.sage,
    borderRadius: 12,
    gap: 5,
    padding: 11
  },
  currentPlanTitle: {
    color: colors.oliveDark,
    fontSize: 14,
    fontWeight: "800"
  },
  currentPlanHeaderSpacer: {
    minHeight: 18
  },
  currentPlanText: {
    color: colors.oliveDark,
    fontSize: 13,
    lineHeight: 18
  },
  planActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  currentPlanBottomActions: {
    alignSelf: "flex-end",
    justifyContent: "flex-end",
    marginTop: 2,
    width: "50%"
  },
  currentPlanActionButton: {
    flex: 1,
    minWidth: 0
  },
  currentPlanManagementRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-end"
  },
  phoneCurrentPlanManagementRow: {
    justifyContent: "flex-start"
  },
  currentPlanManagementButton: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  currentPlanManagementButtonDark: {
    backgroundColor: "#181510",
    borderColor: "#4f4636"
  },
  currentPlanManagementText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  phonePlanActionRow: {
    flexWrap: "nowrap",
    gap: 6,
    width: "100%"
  },
  phonePlanPrimaryButton: {
    flex: 1.35,
    minHeight: 42,
    paddingHorizontal: 8
  },
  phonePlanSecondaryButton: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 8
  },
  phonePlanActionButton: {
    flex: 1,
    minHeight: 42,
    minWidth: 0,
    paddingHorizontal: 8
  },
  phonePlanResumeButton: {
    flex: 1,
    justifyContent: "center",
    marginTop: 0,
    minHeight: 38,
    minWidth: 0,
    paddingHorizontal: 8
  },
  phonePlanButtonLabel: {
    fontSize: 12,
    textAlign: "center"
  },
  planDayRow: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderRadius: 12,
    flexDirection: "row",
    gap: 9,
    padding: 10
  },
  completedPlanDayRow: {
    backgroundColor: "#fff",
    borderColor: colors.sage,
    borderWidth: 1
  },
  planDayBadge: {
    backgroundColor: colors.coral,
    borderRadius: 999,
    color: "white",
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  completedPlanDayBadge: {
    backgroundColor: colors.oliveDark
  },
  planDayCopy: {
    flex: 1,
    minWidth: 0
  },
  planDayTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  planDayPassage: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  phonePlanDayTitle: {
    fontSize: 12
  },
  phonePlanDayPassage: {
    fontSize: 11,
    lineHeight: 16
  },
  feedbackOptionsBox: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 14
  },
  selectedAiOption: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 2,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start"
  },
  activeAiOptionCard: {
    borderColor: colors.oliveDark,
    borderWidth: 2
  },
  aiDetailsBox: {
    backgroundColor: colors.sage,
    borderRadius: 12,
    gap: 5,
    padding: 11
  },
  aiDetailsTitle: {
    color: colors.oliveDark,
    fontSize: 14,
    fontWeight: "800"
  },
  aiDetailsText: {
    color: colors.oliveDark,
    fontSize: 13,
    lineHeight: 19
  },
  studyHelpsBox: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 14
  },
  communityBox: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  avatarRow: {
    flexDirection: "row",
    marginBottom: 2
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderColor: colors.panel,
    borderRadius: 999,
    borderWidth: 2,
    height: 38,
    justifyContent: "center",
    marginRight: -8,
    width: 38
  },
  avatarLead: {
    backgroundColor: colors.coral
  },
  avatarText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  communityTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 1,
    lineHeight: 21
  },
  communityFocusBox: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    marginBottom: 14,
    padding: 14
  },
  communityStepBlock: {
    gap: 6,
    marginBottom: 18
  },
  communitySubViewTabs: {
    alignSelf: "flex-start",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    marginBottom: 18,
    marginTop: 12,
    padding: 4
  },
  communitySubViewTab: {
    borderRadius: 999,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 13
  },
  activeCommunitySubViewTab: {
    backgroundColor: colors.oliveDark
  },
  communitySubViewTabText: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "900"
  },
  activeCommunitySubViewTabText: {
    color: "white"
  },
  communityHistoryPanel: {
    gap: 12
  },
  communityHistoryFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  communityHistoryGroupList: {
    gap: 12
  },
  communityHistoryGroup: {
    backgroundColor: "rgba(255, 250, 242, 0.7)",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 9,
    padding: 10
  },
  communityStepHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 9,
    marginBottom: 8
  },
  communityStepBadge: {
    alignItems: "center",
    backgroundColor: colors.oliveDark,
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    marginTop: 1,
    width: 24
  },
  communityStepBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 14
  },
  phoneCommunityFocusBox: {
    borderRadius: 12,
    marginBottom: 10,
    padding: 11
  },
  phoneCommunityStepBlock: {
    gap: 6,
    marginBottom: 16
  },
  communityRecipientText: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26
  },
  communityTargetSelect: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: "rgba(102, 114, 78, 0.22)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  communityTargetSelectTextBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  communityTargetPickerPanel: {
    backgroundColor: "rgba(255, 255, 255, 0.62)",
    borderColor: "rgba(102, 114, 78, 0.16)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 10
  },
  communityTargetPickerGroup: {
    gap: 7
  },
  communityTargetOption: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 10
  },
  activeCommunityTargetOption: {
    backgroundColor: "#f5eedf",
    borderColor: "rgba(102, 114, 78, 0.42)"
  },
  communityTargetOptionTitle: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "900"
  },
  communityTargetModeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  communityTargetModeChip: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 10
  },
  activeCommunityTargetModeChip: {
    backgroundColor: "#f5eedf",
    borderColor: "rgba(102, 114, 78, 0.42)"
  },
  communityTargetModeText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  phoneCommunityMetricGrid: {
    flexWrap: "nowrap",
    gap: 6,
    marginBottom: 12
  },
  lastCheckinBox: {
    backgroundColor: "#fff6eb",
    borderRadius: 12,
    padding: 11
  },
  emptyCommunityBox: {
    backgroundColor: "#fff6eb",
    borderRadius: 12,
    gap: 5,
    padding: 12
  },
  checkinHistoryItem: {
    backgroundColor: "#fff6eb",
    borderColor: "rgba(102, 114, 78, 0.14)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 11
  },
  phoneCheckinHistoryItem: {
    borderRadius: 11,
    padding: 10
  },
  focusedCheckinHistoryItem: {
    borderColor: "rgba(102, 114, 78, 0.34)"
  },
  checkinHistoryHeader: {
    alignItems: "flex-start",
    gap: 8
  },
  checkinHistoryMeta: {
    gap: 4,
    minWidth: 0,
    width: "100%"
  },
  checkinTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  checkinDestinationText: {
    color: colors.muted,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  communityPostFooterRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    width: "100%"
  },
  phoneCommunityPostFooterRow: {
    alignItems: "flex-start",
    flexWrap: "wrap"
  },
  checkinActionRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    justifyContent: "flex-end"
  },
  phoneCheckinActionRow: {
    flexWrap: "nowrap"
  },
  checkinIconButton: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderColor: "rgba(102, 114, 78, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  checkinSaveIconButton: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  checkinDeleteIconButton: {
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.28)"
  },
  checkinEditInput: {
    minHeight: 84,
    textAlignVertical: "top"
  },
  checkinMood: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
    textTransform: "capitalize"
  },
  communityPanelHeader: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    marginBottom: 10,
    minHeight: 42,
    paddingHorizontal: 11,
    paddingVertical: 9
  },
  communityHeaderMeta: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: 6,
    minWidth: 0
  },
  communityHeaderMetaText: {
    color: colors.muted,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "800"
  },
  partnerManagerBox: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 14,
    padding: 14
  },
  phonePartnerManagerBox: {
    borderRadius: 12,
    gap: 6,
    marginBottom: 10,
    padding: 11
  },
  communityGoalBox: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
    padding: 12
  },
  communityConnectionGrid: {
    alignItems: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
    marginTop: 18
  },
  phoneCommunityConnectionGrid: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 8,
    marginBottom: 22,
    width: "100%"
  },
  communityConnectionPanel: {
    flex: 1,
    minWidth: 280
  },
  phoneCommunityConnectionPanel: {
    alignSelf: "stretch",
    flexBasis: "auto",
    flexGrow: 0,
    flexShrink: 1,
    maxWidth: "100%",
    minWidth: 0,
    width: "100%"
  },
  mobileCommunityPanelHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 0,
    minHeight: 42
  },
  mobileCommunityPanelTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: 8
  },
  mobileCommunityPanelSummaryRow: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: 6,
    justifyContent: "flex-end",
    minWidth: 0
  },
  mobileCommunityPanelSummary: {
    color: colors.muted,
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 15,
    textAlign: "right"
  },
  communityCircleBox: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 14,
    padding: 12
  },
  circleManagementBox: {
    backgroundColor: "rgba(255, 255, 255, 0.58)",
    borderColor: "rgba(102, 114, 78, 0.14)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginTop: 2,
    padding: 10
  },
  phoneCircleManagementBox: {
    padding: 8
  },
  circleSelectorPanel: {
    backgroundColor: "rgba(102, 114, 78, 0.07)",
    borderColor: "rgba(102, 114, 78, 0.14)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 10
  },
  circleSelectorHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8
  },
  circleCountText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900"
  },
  circleManagementContent: {
    gap: 9
  },
  circleManagementLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  circleActionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  phoneCircleActionGrid: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 8,
    maxWidth: "100%",
    width: "100%"
  },
  circleActionBox: {
    flex: 1,
    gap: 8,
    minWidth: 170
  },
  phoneCircleActionBox: {
    alignSelf: "stretch",
    flexBasis: "auto",
    flexGrow: 0,
    flexShrink: 1,
    maxWidth: "100%",
    minWidth: 0
  },
  phoneCommunityInput: {
    marginBottom: 8,
    width: "100%"
  },
  circleManagerToggle: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.sage,
    borderColor: "rgba(102, 114, 78, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  circleList: {
    gap: 8
  },
  circleChip: {
    backgroundColor: "#fff6eb",
    borderColor: "rgba(102, 114, 78, 0.16)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
    padding: 10
  },
  circleChipHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  activeCircleChip: {
    backgroundColor: "#f5eedf",
    borderColor: "rgba(102, 114, 78, 0.42)"
  },
  circleChipTitle: {
    color: colors.oliveDark,
    fontSize: 14,
    fontWeight: "900"
  },
  circleChipMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  activeCircleChipText: {
    color: colors.oliveDark
  },
  circleInlineManagement: {
    borderTopColor: "rgba(102, 114, 78, 0.14)",
    borderTopWidth: 1,
    gap: 8,
    marginTop: 8,
    paddingTop: 9
  },
  circleInviteLine: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between"
  },
  phoneCircleInviteLine: {
    alignItems: "flex-start",
    justifyContent: "flex-start"
  },
  circleInviteCodeText: {
    color: colors.oliveDark,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
    minWidth: 0
  },
  circleCopyButton: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 999,
    flexDirection: "row",
    flexShrink: 0,
    gap: 4,
    minHeight: 30,
    paddingHorizontal: 8
  },
  circleCopyText: {
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "900"
  },
  circleManagementRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8
  },
  circleManageButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.sage,
    borderColor: "rgba(102, 114, 78, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  activeCircleManageButton: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  circleDangerManageButton: {
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.28)"
  },
  activeCircleDangerManageButton: {
    backgroundColor: colors.coral,
    borderColor: colors.coral
  },
  circleManageText: {
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "900"
  },
  activeCircleManageText: {
    color: "white"
  },
  circleDangerManageText: {
    color: colors.coral
  },
  activeCircleDangerManageText: {
    color: "white"
  },
  circlePostCard: {
    backgroundColor: "#fff6eb",
    borderColor: "rgba(102, 114, 78, 0.14)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 11
  },
  circleReactionRow: {
    flexShrink: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  circlePostIconRow: {
    flexDirection: "row",
    flexShrink: 0,
    gap: 7
  },
  pendingDeleteButton: {
    backgroundColor: colors.blush,
    borderColor: "rgba(201, 103, 80, 0.32)"
  },
  circleReactionChip: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    minHeight: 32,
    minWidth: 46,
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  activeCircleReactionChip: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  circleReactionText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  circleReactionSymbol: {
    fontSize: 15,
    lineHeight: 18
  },
  activeCircleReactionText: {
    color: "white"
  },
  communityDivider: {
    backgroundColor: colors.line,
    height: 1,
    marginVertical: 4
  },
  communityShowMoreButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 6
  },
  communityShowMoreText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  partnerList: {
    gap: 8
  },
  partnerChip: {
    backgroundColor: "#fff6eb",
    borderColor: "rgba(102, 114, 78, 0.16)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
    padding: 10
  },
  phonePartnerChip: {
    borderRadius: 11,
    paddingHorizontal: 9,
    paddingVertical: 8
  },
  activePartnerChip: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  partnerChipText: {
    color: colors.oliveDark,
    fontSize: 14,
    fontWeight: "800"
  },
  activePartnerChipText: {
    color: "white"
  },
  partnerContactText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  accountabilitySummaryBox: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14
  },
  phoneAccountabilitySummaryBox: {
    borderRadius: 12,
    marginBottom: 10,
    padding: 11
  },
  sendNoteBox: {
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.2)",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12
  },
  phoneSendNoteBox: {
    borderRadius: 11,
    padding: 10
  },
  lastCheckinLabel: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
    textTransform: "uppercase"
  },
  lastCheckinText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20
  },
  shareMessageText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8
  },
  phoneShareMessageText: {
    fontSize: 13,
    lineHeight: 19
  },
  phoneCheckinTextarea: {
    minHeight: 112
  },
  phoneFullWidthButton: {
    width: "100%",
    minHeight: 42
  },
  phoneCommunityButtonLabel: {
    fontSize: 12,
    textAlign: "center"
  },
  shareInsightBox: {
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.25)",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14
  },
  shareInput: {
    marginBottom: 0,
    minHeight: 86,
    paddingTop: 12,
    textAlignVertical: "top"
  },
  shareInsightCommunityBox: {
    backgroundColor: "rgba(255, 255, 255, 0.58)",
    borderColor: "rgba(102, 114, 78, 0.14)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 9,
    marginTop: 10,
    padding: 10
  },
  savedSummaryBox: {
    alignItems: "flex-start",
    backgroundColor: "#fffaf2",
    borderColor: "rgba(201, 103, 80, 0.22)",
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 18
  },
  savedSummaryIcon: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderRadius: 999,
    height: 54,
    justifyContent: "center",
    width: 54
  },
  savedSummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    width: "100%"
  },
  phoneSavedSummaryGrid: {
    flexWrap: "nowrap",
    gap: 6
  },
  savedSummaryPanel: {
    backgroundColor: "#fff6eb",
    borderRadius: 12,
    padding: 12,
    width: "100%"
  },
  savedSummaryActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  phoneSavedSummaryActions: {
    gap: 6
  },
  phoneSavedSummaryActionButton: {
    flex: 1,
    minHeight: 40,
    minWidth: 132,
    paddingHorizontal: 8
  },
  phoneSavedSummaryActionLabel: {
    fontSize: 12,
    textAlign: "center"
  },
  reviewPresetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8
  },
  phoneReviewPresetRow: {
    gap: 6
  },
  customReviewControl: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10
  },
  customReviewLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  customReviewInput: {
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.ink,
    minHeight: 38,
    paddingHorizontal: 10,
    width: 70
  },
  customReviewUnit: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  helpIntro: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4
  },
  helpLink: {
    alignItems: "flex-start",
    backgroundColor: "#fff6eb",
    borderRadius: 12,
    flexDirection: "row",
    gap: 10,
    padding: 10
  },
  helpIcon: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  helpTextBlock: {
    flex: 1
  },
  helpTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  helpDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  scriptureBox: {
    backgroundColor: "#fff3e8",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    maxWidth: "100%",
    minWidth: 0,
    padding: 16
  },
  attachedScriptureBox: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    marginBottom: 0
  },
  phoneScriptureBox: {
    borderRadius: 11,
    padding: 11
  },
  passageStatusBox: {
    gap: 10
  },
  retryLink: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 5,
    minHeight: 32
  },
  retryLinkText: {
    color: colors.coral,
    fontSize: 13,
    fontWeight: "700"
  },
  scriptureHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    minWidth: 0,
    marginBottom: 10
  },
  scriptureReference: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800"
  },
  scriptureText: {
    color: "#342821",
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 12
  },
  markupHelp: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginBottom: 10
  },
  verseList: {
    gap: 7,
    marginBottom: 12
  },
  verseRow: {
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 250, 242, 0.55)",
    borderColor: "transparent",
    borderRadius: 9,
    borderWidth: 2,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    position: "relative"
  },
  phoneVerseRow: {
    borderRadius: 8,
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 8
  },
  selectedVerseRow: {
    borderColor: colors.coral
  },
  verseText: {
    borderRadius: 5,
    color: "#342821",
    fontSize: 16,
    lineHeight: 24
  },
  verseTextBlock: {
    flex: 1,
    gap: 5,
    minWidth: 0
  },
  memoryVerseBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff3e8",
    borderColor: "rgba(201, 103, 80, 0.28)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    marginLeft: 4,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  memoryVerseBadgeText: {
    color: colors.coral,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  phoneVerseText: {
    fontSize: 15,
    lineHeight: 22
  },
  verseNumber: {
    color: colors.coral,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 20,
    minWidth: 18,
    textAlign: "right"
  },
  phoneVerseNumber: {
    minWidth: 16
  },
  markupToolbar: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
    padding: 10
  },
  phoneMarkupToolbar: {
    borderRadius: 10,
    padding: 9
  },
  markupToolbarHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  markupToolbarTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  markupToolbarHelp: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  markupCloseButton: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
    width: 30
  },
  markupOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  compactMarkupOptionsRow: {
    gap: 5
  },
  markupOption: {
    borderColor: "transparent",
    borderRadius: 999,
    borderWidth: 2,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 11
  },
  compactMarkupOption: {
    minHeight: 30,
    paddingHorizontal: 9
  },
  markupLegendOption: {
    opacity: 0.9
  },
  activeMarkupOption: {
    borderColor: colors.ink
  },
  markupOptionText: {
    fontSize: 12,
    fontWeight: "800"
  },
  clearMarkupButton: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 999,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 11
  },
  clearAllMarkupButton: {
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.35)",
    borderWidth: 1
  },
  memoryMarkupButton: {
    backgroundColor: colors.oliveDark
  },
  memoryMarkupText: {
    color: "white",
    fontSize: 12,
    fontWeight: "800"
  },
  clearMarkupText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  markupNoteBox: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10
  },
  markupNoteLabel: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 7,
    textTransform: "uppercase"
  },
  markupNoteInput: {
    marginBottom: 0,
    minHeight: 70,
    paddingTop: 10,
    textAlignVertical: "top"
  },
  translationBadge: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    color: "white",
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  translationControls: {
    backgroundColor: "#f8eadf",
    borderRadius: 999,
    flexDirection: "row",
    flexShrink: 1,
    maxWidth: "100%",
    padding: 3
  },
  translationRow: {
    alignSelf: "flex-start",
    backgroundColor: "#f8eadf",
    borderRadius: 999,
    flexDirection: "row",
    flexShrink: 1,
    maxWidth: "100%",
    padding: 3
  },
  translationOption: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  activeTranslationOption: {
    backgroundColor: colors.gold
  },
  translationOptionText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  activeTranslationOptionText: {
    color: "white"
  },
  translationNote: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  studyPrintRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10
  },
  studyContextTools: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginTop: 12,
    padding: 11
  },
  studyContextToolHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between"
  },
  studyContextToolTitleBlock: {
    flex: 1,
    gap: 2,
    minWidth: 190
  },
  studyContextToolTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  studyContextToolIntro: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  studyContextToggle: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.soft,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    minHeight: 32,
    paddingHorizontal: 11
  },
  studyContextToggleText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  studyContextPreviewBox: {
    backgroundColor: "rgba(255, 246, 235, 0.78)",
    borderColor: "rgba(201, 103, 80, 0.18)",
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    padding: 10
  },
  studyContextPreviewLabel: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  studyContextVerseList: {
    gap: 5
  },
  studyContextVerseRow: {
    alignItems: "flex-start",
    borderRadius: 8,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  studyContextSelectedVerseRow: {
    backgroundColor: "#fff0df"
  },
  studyContextVerseNumber: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 19,
    minWidth: 18,
    textAlign: "right"
  },
  studyContextSelectedVerseNumber: {
    color: colors.coral
  },
  studyContextVerseText: {
    color: "#342821",
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    minWidth: 0
  },
  studyContextSelectedVerseText: {
    color: colors.ink,
    fontWeight: "700"
  },
  studyCrossReferenceArea: {
    gap: 8
  },
  studyCrossReferenceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  studyCrossReferenceChip: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: 10
  },
  activeStudyCrossReferenceChip: {
    backgroundColor: colors.coral,
    borderColor: colors.coral
  },
  studyCrossReferenceText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  activeStudyCrossReferenceText: {
    color: "white"
  },
  studyCrossReferencePreviewBox: {
    marginTop: 2
  },
  studyCrossReferencePreviewHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  studyCrossReferencePreviewTitleBlock: {
    flex: 1,
    gap: 3,
    minWidth: 0
  },
  studyCrossReferenceReason: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  studyCrossReferenceClose: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
    width: 30
  },
  studyDarkPreviewBox: {
    backgroundColor: "#151a19",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  studyDarkContextVerseRow: {
    backgroundColor: "rgba(247, 237, 220, 0.03)"
  },
  studyDarkContextSelectedVerseRow: {
    backgroundColor: "rgba(233, 183, 106, 0.12)"
  },
  studyDarkCrossReferenceChip: {
    backgroundColor: "#151a19",
    borderColor: "rgba(233, 183, 106, 0.18)"
  },
  studyDarkActiveCrossReferenceChip: {
    backgroundColor: "#8f6a35",
    borderColor: "#e9b76a"
  },
  phoneStudyPrintButton: {
    alignSelf: "stretch",
    justifyContent: "center",
    width: "100%"
  },
  phoneStudyPrintButtonText: {
    textAlign: "center"
  },
  mobilePrintHint: {
    alignItems: "flex-start",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  mobilePrintHintText: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  methodChip: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  activeMethodChip: {
    backgroundColor: colors.oliveDark
  },
  methodChipText: {
    color: colors.oliveDark,
    fontWeight: "700"
  },
  activeMethodChipText: {
    color: "white"
  },
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14
  },
  guidedStudyStepPanel: {
    backgroundColor: "#fffefa",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderColor: colors.line,
    borderTopWidth: 0,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16
  },
  phoneGuidedStudyStepPanel: {
    borderBottomLeftRadius: 11,
    borderBottomRightRadius: 11,
    padding: 12
  },
  focusModeRow: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    padding: 12
  },
  focusMainCard: {
    flexBasis: "100%",
    paddingTop: 14,
    width: "100%"
  },
  focusScriptureBox: {
    padding: 14
  },
  focusTextarea: {
    minHeight: 240
  },
  reviewBox: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16
  },
  reviewMeta: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12
  },
  reviewAnswers: {
    gap: 10,
    marginBottom: 14
  },
  reviewAnswer: {
    backgroundColor: "#fff6eb",
    borderRadius: 12,
    padding: 12
  },
  reviewStepTitle: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 5
  },
  stepTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800"
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.oliveDark,
    borderRadius: 999,
    color: "white",
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  body: {
    color: "#3e4d44",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12
  },
  bodyStrong: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18
  },
  instructionBox: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16
  },
  actionText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    marginBottom: 8
  },
  instructionKicker: {
    color: colors.coral,
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 5,
    marginTop: 10,
    textTransform: "uppercase"
  },
  collapsedActionText: {
    marginBottom: 0
  },
  collapsedInstructionBox: {
    paddingBottom: 12
  },
  instructionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  phoneInstructionHeader: {
    flexDirection: "column",
    gap: 10
  },
  instructionHeaderCopy: {
    flex: 1,
    minWidth: 0
  },
  phoneInstructionHeaderCopy: {
    alignSelf: "stretch",
    flex: 0,
    width: "100%"
  },
  collapseButton: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    minHeight: 34,
    paddingHorizontal: 10
  },
  phoneInstructionCollapseButton: {
    alignSelf: "flex-end"
  },
  collapseButtonText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  checklist: {
    gap: 8,
    marginBottom: 12
  },
  checkItem: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8
  },
  checkText: {
    color: "#3e4d44",
    flex: 1,
    fontSize: 15,
    lineHeight: 21
  },
  outputBox: {
    backgroundColor: colors.sage,
    borderRadius: 12,
    padding: 12
  },
  outputLabel: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
    textTransform: "uppercase"
  },
  outputText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21
  },
  readyBox: {
    alignItems: "flex-start",
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.25)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
    padding: 14
  },
  studyNoteEditorWrap: {
    position: "relative"
  },
  scriptureInsertBox: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    padding: 10
  },
  compactScriptureInsertBox: {
    boxShadow: "0 10px 24px rgba(52, 40, 33, 0.16)" as any,
    marginBottom: 0,
    maxWidth: 270,
    minWidth: 230
  },
  scriptureInsertText: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    minWidth: 160
  },
  scriptureInsertButton: {
    backgroundColor: colors.coral,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  scriptureInsertButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "800"
  },
  scriptureInsertCloseButton: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  scriptureSettingList: {
    gap: 14
  },
  editorSettingsScrollArea: {
    flexShrink: 1
  },
  scriptureSettingToggle: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
    minHeight: 34
  },
  scriptureColorOption: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  activeScriptureColorOption: {
    borderColor: colors.coral,
    borderWidth: 2
  },
  scriptureColorSwatch: {
    borderColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 999,
    borderWidth: 1,
    height: 16,
    width: 16
  },
  scriptureColorActiveText: {
    color: colors.coral
  },
  readyCopy: {
    flex: 1
  },
  readyTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4
  },
  readyText: {
    color: "#4b4039",
    fontSize: 15,
    lineHeight: 21
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  studyStepButtonRow: {
    flexWrap: "nowrap",
    gap: 6,
    width: "100%"
  },
  studyStepBackButton: {
    flex: 0.72,
    minHeight: 42,
    paddingHorizontal: 8
  },
  hiddenBackButtonSpace: {
    minHeight: 42,
    width: Platform.OS === "web" ? 88 : 0
  },
  studyStepContinueButton: {
    flex: 1.65,
    minHeight: 42,
    paddingHorizontal: 8
  },
  studyStepFreshButton: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 8
  },
  studyStepButtonLabel: {
    fontSize: 12,
    textAlign: "center"
  },
  planBrowseSectionStack: {
    gap: 12
  },
  planSectionHeading: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    marginBottom: 8,
    marginTop: 6,
    textTransform: "uppercase"
  },
  planSectionHeadingDark: {
    color: "#e9b76a"
  },
  planBrowseIntro: {
    marginTop: 4
  },
  planBrowseSection: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 12
  },
  planBrowseSectionDark: {
    backgroundColor: "#181510",
    borderColor: "#3a3329"
  },
  planBrowseSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  planBrowseSectionTitleBlock: {
    flex: 1,
    gap: 4,
    minWidth: 0
  },
  planBrowseSectionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  planBrowseSectionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  planBrowseSectionDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  planBrowseCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  planPageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14
  },
  phonePlanPageGrid: {
    gap: 10
  },
  otherFollowedPlanGrid: {
    marginBottom: 14,
    marginTop: 10
  },
  completedReadingPlanGrid: {
    gap: 10,
    marginBottom: 14
  },
  completedReadingPlanSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 6
  },
  completedReadingPlanSectionTitle: {
    marginBottom: 0,
    marginTop: 0
  },
  completedReadingPlanCard: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  phoneCompletedReadingPlanCard: {
    borderRadius: 12,
    padding: 12
  },
  completedReadingPlanHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  completedReadingPlanStatus: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    paddingTop: 2
  },
  completedReadingPlanStatusText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  completedReadingPlanStatusTextDark: {
    color: "#b8d39b"
  },
  completedReadingPlanActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-end"
  },
  phoneCompletedReadingPlanActions: {
    justifyContent: "flex-start"
  },
  completedReadingPlanRemoveButton: {
    backgroundColor: "#fffdf8"
  },
  planPageCard: {
    gap: 10,
    maxWidth: "100%",
    width: 360
  },
  expandedBrowsePlanCard: {
    width: "100%"
  },
  followingBiblePlanCard: {
    backgroundColor: "#fff6eb",
    borderColor: colors.coral,
    borderWidth: 1.5
  },
  followingBiblePlanCardDark: {
    backgroundColor: "#211d18",
    borderColor: "#e9b76a"
  },
  phonePlanPageCard: {
    gap: 8,
    padding: 12,
    width: "100%"
  },
  planPageTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  followingPlanBadge: {
    backgroundColor: "#f8efe4",
    borderColor: colors.coral,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.coral,
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: "uppercase"
  },
  planPageMetaText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  planLastCompletedText: {
    color: colors.oliveDark
  },
  planPageHeaderActions: {
    alignItems: "flex-end",
    gap: 8
  },
  planCardActionRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 1
  },
  planCardActionChip: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  planCardPrimaryChip: {
    backgroundColor: "#eef3e7",
    borderColor: "#b8c8a7"
  },
  planCardPrimaryChipDark: {
    backgroundColor: "#263026",
    borderColor: "rgba(172, 196, 151, 0.45)"
  },
  planCardSecondaryChip: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line
  },
  planCardSecondaryChipDark: {
    backgroundColor: "#181510",
    borderColor: "#4f4636"
  },
  planCardDangerChip: {
    backgroundColor: "#fff6eb",
    borderColor: "#f0c4b7"
  },
  planCardDangerChipDark: {
    backgroundColor: "#251817",
    borderColor: "rgba(242, 160, 136, 0.3)"
  },
  planCardActionText: {
    fontSize: 12,
    fontWeight: "900"
  },
  planCardPrimaryText: {
    color: colors.oliveDark
  },
  planCardPrimaryTextDark: {
    color: "#dce7c8"
  },
  planCardSecondaryText: {
    color: colors.oliveDark
  },
  planCardDangerText: {
    color: colors.coral
  },
  planCardDangerTextDark: {
    color: "#f2a088"
  },
  planExpandButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    minHeight: 30,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  planExpandButtonText: {
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "900"
  },
  planDetailsButton: {
    minHeight: 38,
    paddingHorizontal: 12
  },
  planDetailsPanel: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 12
  },
  planDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  planDetailItem: {
    flexBasis: 220,
    flexGrow: 1,
    gap: 3,
    minWidth: 0
  },
  planDetailLabel: {
    color: colors.coral,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  planDetailText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  planSampleList: {
    gap: 7
  },
  planSampleReading: {
    alignItems: "center",
    backgroundColor: "#fffdf8",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 8
  },
  planViewAllButton: {
    alignSelf: "flex-start"
  },
  currentPlanWideBox: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 14,
    padding: 16
  },
  currentBibleReadingPlanBox: {
    borderColor: colors.line,
    borderWidth: 1
  },
  phoneCurrentPlanWideBox: {
    borderRadius: 12,
    gap: 8,
    marginBottom: 10,
    padding: 12
  },
  phonePlanHeader: {
    gap: 8
  },
  planProgressTrack: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    height: 9,
    overflow: "hidden"
  },
  planProgressFill: {
    backgroundColor: colors.coral,
    height: "100%"
  },
  completedPlanProgressFill: {
    backgroundColor: colors.oliveDark
  },
  planPageDay: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderRadius: 12,
    flexDirection: "row",
    gap: 9,
    padding: 10
  },
  compactPlanPageDay: {
    borderRadius: 10,
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  phonePlanPageDay: {
    borderRadius: 10,
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 8
  },
  phoneCompactPlanPageDay: {
    minHeight: 46,
    paddingHorizontal: 8,
    paddingVertical: 7
  },
  currentPlanDayList: {
    gap: 6
  },
  planDayPickerScroll: {
    gap: 8,
    paddingRight: 12
  },
  planDayTile: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    height: 74,
    justifyContent: "center",
    paddingHorizontal: 8,
    width: 72
  },
  phonePlanDayTile: {
    height: 76,
    width: 74
  },
  planDayTileDark: {
    backgroundColor: "#211d18",
    borderColor: "#4b4035"
  },
  completedPlanDayTile: {
    backgroundColor: colors.sage,
    borderColor: colors.olive,
    borderStyle: "solid",
    borderWidth: 1
  },
  completedPlanDayTileDark: {
    backgroundColor: "#34422f",
    borderColor: "rgba(233, 183, 106, 0.45)"
  },
  completedPlanDayTileText: {
    color: "#f7eddc"
  },
  currentPlanDayTile: {
    borderColor: colors.coral,
    borderWidth: 2
  },
  selectedPlanDayTile: {
    backgroundColor: "#fff",
    borderColor: colors.coral,
    borderWidth: 2
  },
  selectedPlanDayTileDark: {
    backgroundColor: "#2b241d",
    borderColor: "#e9b76a"
  },
  missedPlanDayTile: {
    borderColor: colors.coral,
    borderStyle: "dashed"
  },
  selectedMissedPlanDayTile: {
    backgroundColor: "#fff",
    borderStyle: "solid",
    shadowColor: colors.coral,
    shadowOpacity: 0.16,
    shadowRadius: 6
  },
  selectedMissedPlanDayTileDark: {
    backgroundColor: "#2b241d",
    borderStyle: "solid",
    shadowColor: "#e9b76a",
    shadowOpacity: 0.18,
    shadowRadius: 6
  },
  planDayTileNumber: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  planDayTileDate: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3,
    textAlign: "center"
  },
  planDayTileFlag: {
    color: colors.coral,
    fontSize: 9,
    fontWeight: "900",
    marginTop: 2,
    textTransform: "uppercase"
  },
  selectedPlanDayDetail: {
    alignItems: "center",
    marginTop: 2
  },
  currentPlanNextBox: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    padding: 10
  },
  compactPlanDayBadge: {
    minWidth: 30,
    paddingHorizontal: 7,
    paddingVertical: 4,
    textAlign: "center"
  },
  planDayActions: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 5
  },
  planDayActionStack: {
    alignItems: "flex-end",
    flexShrink: 0,
    gap: 6
  },
  planDayTextAction: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  planDayTextActionDark: {
    backgroundColor: "#181510",
    borderColor: "#4f4636"
  },
  planDayTextActionLabel: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  planDayIconAction: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  methodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14
  },
  accountSection: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
    maxWidth: "100%",
    minWidth: 0,
    padding: 14
  },
  accountSubsection: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginTop: 12,
    maxWidth: "100%",
    minWidth: 0,
    padding: 12
  },
  accountCollapsibleHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: 44
  },
  accountCollapsibleTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  accountCollapsibleSummary: {
    marginTop: 4
  },
  accountCollapsibleBody: {
    gap: 12,
    marginTop: 12
  },
  accountDarkLayout: {
    backgroundColor: "#171b1c"
  },
  accountDarkMainCard: {
    backgroundColor: "#202625",
    borderColor: "rgba(233, 183, 106, 0.18)",
    shadowColor: "#000000",
    shadowOpacity: 0.2
  },
  accountDarkSection: {
    backgroundColor: "#242b2a",
    borderColor: "rgba(233, 183, 106, 0.18)"
  },
  accountDarkInsetBox: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  accountDarkLegalDocBox: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  accountDarkOptionCard: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  accountDarkActiveOptionCard: {
    backgroundColor: "#2d352d",
    borderColor: "rgba(233, 183, 106, 0.48)"
  },
  accountDarkInput: {
    backgroundColor: "#151a19",
    borderColor: "rgba(233, 183, 106, 0.2)",
    color: "#f7eddc"
  },
  accountDarkTitle: {
    color: "#f7eddc"
  },
  accountDarkText: {
    color: "#f7eddc"
  },
  accountDarkMutedText: {
    color: "#c8bda9"
  },
  accountDarkBadge: {
    backgroundColor: "#2d352d",
    borderColor: "rgba(233, 183, 106, 0.45)"
  },
  accountDarkBadgeText: {
    color: "#f7eddc"
  },
  accountDarkSegmentedRow: {
    backgroundColor: "#171b1c"
  },
  accountDarkActiveSegment: {
    backgroundColor: "#8f6a35"
  },
  studyDarkGuidedHeader: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.18)"
  },
  studyDarkPillControl: {
    backgroundColor: "#151a19",
    borderColor: "rgba(233, 183, 106, 0.22)"
  },
  studyDarkTogglePill: {
    backgroundColor: "#151a19"
  },
  studyDarkAccentText: {
    color: "#e9b76a"
  },
  studyDarkMethodChip: {
    backgroundColor: "#2d352d"
  },
  studyDarkSmartPassageBox: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.34)"
  },
  studyDarkProgressPill: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.14)"
  },
  studyDarkCompletedProgressPill: {
    backgroundColor: "#2d352d",
    borderColor: "rgba(233, 183, 106, 0.2)"
  },
  studyDarkProgressNumber: {
    backgroundColor: "#2d352d",
    color: "#e9b76a"
  },
  studyDarkCompletedProgressNumber: {
    backgroundColor: "#e9b76a",
    color: "#171b1c"
  },
  studyDarkActiveProgressNumber: {
    backgroundColor: "#f7eddc",
    color: "#171b1c"
  },
  studyDarkScriptureBox: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.18)"
  },
  studyDarkVerseRow: {
    backgroundColor: "rgba(247, 237, 220, 0.04)"
  },
  studyDarkFloatingBar: {
    backgroundColor: "#202625",
    borderColor: "rgba(233, 183, 106, 0.22)"
  },
  bibleDarkDividerSection: {
    borderBottomColor: "rgba(233, 183, 106, 0.16)",
    borderTopColor: "rgba(233, 183, 106, 0.16)"
  },
  bibleDarkSearchSelect: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.18)",
    color: "#f7eddc"
  },
  bibleDarkVerseRow: {
    backgroundColor: "rgba(247, 237, 220, 0.035)"
  },
  bibleDarkMobileSelectionDock: {
    backgroundColor: "#202625",
    borderColor: "rgba(233, 183, 106, 0.26)",
    shadowColor: "#000",
    shadowOpacity: 0.22
  },
  bibleDarkMobileNoteEditor: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.18)"
  },
  plansDarkProgressTrack: {
    backgroundColor: "#2d352d"
  },
  plansDarkDraftPill: {
    backgroundColor: "#2d352d",
    color: "#f7eddc"
  },
  plansDarkDayRow: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.14)",
    borderWidth: 1
  },
  plansDarkCompletedDayRow: {
    backgroundColor: "#34422f",
    borderColor: "rgba(233, 183, 106, 0.45)"
  },
  completedPlanDayTextDark: {
    color: "#f7eddc"
  },
  completedPlanDayMutedTextDark: {
    color: "#d8ceb8"
  },
  plansDarkDayBadge: {
    backgroundColor: "#8f6a35"
  },
  methodsDarkBadge: {
    backgroundColor: "#2d352d",
    color: "#f7eddc"
  },
  methodsDarkPill: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.18)",
    color: "#f7eddc"
  },
  methodsDarkWatchBox: {
    backgroundColor: "rgba(201, 103, 80, 0.12)",
    borderColor: "rgba(201, 103, 80, 0.32)"
  },
  memoryDarkFocusBanner: {
    backgroundColor: "rgba(201, 103, 80, 0.12)",
    borderColor: "rgba(201, 103, 80, 0.32)"
  },
  memoryDarkCountPill: {
    backgroundColor: "#2d352d",
    color: "#f7eddc"
  },
  memoryDarkActiveCard: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(201, 103, 80, 0.34)"
  },
  memoryDarkReviewPill: {
    backgroundColor: "#242b2a",
    borderColor: "rgba(233, 183, 106, 0.18)",
    borderWidth: 1,
    color: "#f7eddc"
  },
  memoryDarkDueReviewPill: {
    backgroundColor: "#242b2a",
    borderColor: "rgba(201, 103, 80, 0.7)",
    borderWidth: 1,
    color: "#f2a08c"
  },
  memoryDarkPracticeText: {
    backgroundColor: "#1b211f",
    color: "#f7eddc"
  },
  memoryDarkFillBox: {
    backgroundColor: "#1b211f"
  },
  journalDarkCalendarDayCell: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  journalDarkActiveCalendarDayCell: {
    backgroundColor: "rgba(233, 183, 106, 0.12)",
    borderColor: "rgba(233, 183, 106, 0.34)"
  },
  journalDarkScriptureActiveBookChip: {
    backgroundColor: "rgba(233, 183, 106, 0.12)",
    borderColor: "rgba(233, 183, 106, 0.34)"
  },
  studyDarkStepPanel: {
    backgroundColor: "#171b1c",
    borderColor: "rgba(233, 183, 106, 0.24)"
  },
  studyDarkFormatButton: {
    backgroundColor: "#151a19",
    borderColor: "rgba(233, 183, 106, 0.2)"
  },
  signedInBadgeRow: {
    alignItems: "flex-start",
    marginBottom: 10
  },
  signedInBadge: {
    alignItems: "center",
    backgroundColor: "#eef3e5",
    borderColor: colors.olive,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    maxWidth: "100%",
    minWidth: 0,
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  accountUsernameBadge: {
    alignSelf: "flex-start",
    marginBottom: 12
  },
  signedInBadgeText: {
    color: colors.oliveDark,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "900"
  },
  freeAccountBox: {
    backgroundColor: "#fff6eb",
    borderColor: "#edd8bd",
    borderRadius: 12,
    borderWidth: 1,
    gap: 9,
    marginVertical: 12,
    padding: 12
  },
  freeAccountBenefitRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    maxWidth: "100%",
    minWidth: 0
  },
  freeAccountPrivacyLink: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
    minHeight: 32
  },
  freeAccountPrivacyLinkText: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "900",
    textDecorationLine: "underline"
  },
  freeAccountBenefitText: {
    color: colors.ink,
    flex: 1,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    minWidth: 0
  },
  authDividerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
    marginBottom: 12
  },
  authDividerLine: {
    backgroundColor: colors.line,
    flex: 1,
    height: 1
  },
  authDividerText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  authFlowRow: {
    backgroundColor: colors.soft,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    minWidth: 0,
    padding: 4
  },
  authFlowButton: {
    alignItems: "center",
    borderRadius: 9,
    flex: 1,
    minHeight: 40,
    minWidth: 0,
    justifyContent: "center",
    paddingHorizontal: 10
  },
  activeAuthFlowButton: {
    backgroundColor: colors.oliveDark
  },
  authFlowText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  },
  activeAuthFlowText: {
    color: "white"
  },
  authHelperText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
    marginTop: -6
  },
  accountOptionGrid: {
    minWidth: 0,
    gap: 10
  },
  accountOptionCard: {
    backgroundColor: "#fff6eb"
  },
  legalDocBox: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 10,
    minWidth: 0,
    padding: 10
  },
  legalDocHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  legalDocBody: {
    gap: 10
  },
  legalUpdatedText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  legalDocSection: {
    gap: 3
  },
  legalDocSectionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  legalDocText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  translationLockedBox: {
    backgroundColor: "#fbf2e4",
    borderColor: "#ead8bc",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 12,
    maxWidth: "100%",
    minWidth: 0,
    padding: 12
  },
  lockedTranslationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  lockedTranslationPill: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  lockedTranslationText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900"
  },
  accountStatusBox: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    maxWidth: "100%",
    minWidth: 0,
    padding: 14
  },
  accountHealthList: {
    gap: 10
  },
  accountHealthItem: {
    alignItems: "flex-start",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    minWidth: 0,
    padding: 10
  },
  accountAdminMetricGrid: {
    gap: 10
  },
  accountAdminMetricTile: {
    flexBasis: 112,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 78,
    minWidth: 112
  },
  accountAdminMetricLabel: {
    lineHeight: 15,
    marginTop: 2
  },
  memoryList: {
    gap: 12
  },
  phoneMemoryHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2
  },
  phoneMemoryHeaderAddButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 0,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  phoneMemoryHeaderAddPanel: {
    backgroundColor: "#fffdfa",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    marginTop: 8,
    padding: 8
  },
  memoryReviewPromptBox: {
    alignItems: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 12
  },
  memoryReviewSuccessBox: {
    backgroundColor: "#edf5df",
    borderColor: "rgba(102, 114, 78, 0.28)"
  },
  memoryReviewEncourageBox: {
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.22)"
  },
  memoryReviewPromptText: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
  },
  memoryListTools: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  phoneMemoryListToolButton: {
    alignSelf: "stretch",
    justifyContent: "center",
    width: "100%"
  },
  memoryViewToggle: {
    backgroundColor: colors.soft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    padding: 4
  },
  memoryModeToolbar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  phoneMemoryModeToolbar: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 8
  },
  memoryModeToggle: {
    flex: 1
  },
  memoryPrintCardsButton: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 13
  },
  memoryPrintCardsButtonText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  phoneMemoryPrintIconButton: {
    backgroundColor: "transparent",
    borderWidth: 0,
    flexShrink: 0,
    minHeight: 42,
    minWidth: 42,
    paddingHorizontal: 0,
    width: 42
  },
  memoryViewButton: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 10
  },
  activeMemoryViewButton: {
    backgroundColor: colors.oliveDark
  },
  memoryViewText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800"
  },
  activeMemoryViewText: {
    color: "white"
  },
  memoryDiscoverBlock: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 12
  },
  memoryBrowseFiltersToggle: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  phoneMemoryBrowseFiltersPanel: {
    gap: 7,
    padding: 10
  },
  memoryBrowseFilterHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  memoryBrowseClearText: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "900"
  },
  memoryCollectionSelect: {
    alignItems: "center",
    backgroundColor: "#fffdfa",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  memoryCollectionPickerPanel: {
    backgroundColor: "#fffdfa",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 8
  },
  memoryCollectionPickerItem: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  memoryCollectionReviewButton: {
    alignItems: "center",
    backgroundColor: colors.coral,
    borderRadius: 999,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 14
  },
  memoryDiscoverLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  memoryFilterByLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 12,
    marginBottom: -4,
    textTransform: "uppercase"
  },
  memoryHistoryStack: {
    gap: 12
  },
  memoryHistorySummaryBox: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 14
  },
  memoryHistorySummaryHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  memoryHistorySummaryTextBlock: {
    flex: 1,
    minWidth: 0
  },
  memoryHistoryEncouragementBox: {
    alignItems: "flex-start",
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.22)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 10
  },
  memoryEncouragementHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7
  },
  memoryEncouragementGrid: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 10,
    minWidth: 0
  },
  memoryEncouragementBlock: {
    flex: 1,
    gap: 4,
    minWidth: 0
  },
  phoneMemoryEncouragementStack: {
    gap: 10,
    width: "100%"
  },
  phoneMemoryEncouragementItem: {
    gap: 4,
    width: "100%"
  },
  memoryHistoryEncouragementText: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    minWidth: 0
  },
  memoryWeeklySummaryBox: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
    padding: 10
  },
  memoryWeeklySummaryContent: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 10,
    minWidth: 0
  },
  phoneMemoryWeeklySummaryContent: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 8,
    width: "100%"
  },
  memoryWeeklySummaryText: {
    flex: 1.4
  },
  memoryWeeklyScriptureBox: {
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.2)",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 0,
    padding: 9
  },
  memoryWeeklyScriptureText: {
    color: colors.ink,
    fontSize: 12,
    fontStyle: "italic",
    fontWeight: "800",
    lineHeight: 18
  },
  memoryWeeklyInlineScripture: {
    color: colors.muted,
    fontSize: 12,
    fontStyle: "italic",
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 4
  },
  memoryMilestoneList: {
    gap: 8
  },
  memoryMilestoneItem: {
    alignItems: "flex-start",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 9
  },
  memoryMilestonePicker: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 10
  },
  memoryMilestoneGoalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  memoryMilestoneGoalChip: {
    alignItems: "flex-start",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    minWidth: 190,
    padding: 9,
    width: "48%"
  },
  memoryMilestoneGoalTitle: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  memoryMilestoneGoalDescription: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15
  },
  memoryHistoryHighlight: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
    padding: 12
  },
  memoryHistoryList: {
    gap: 8
  },
  memoryHistoryItem: {
    alignItems: "flex-start",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 10
  },
  memoryHistoryIcon: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  memoryHistoryTextBlock: {
    flex: 1,
    minWidth: 0
  },
  memoryHistoryDate: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2
  },
  memoryHistoryMoreButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8
  },
  memoryHistoryMoreText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  neglectedMemoryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minWidth: 0
  },
  neglectedMemoryPracticeButton: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  neglectedMemoryPracticeText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  memoryVerseHistoryBox: {
    backgroundColor: "rgba(255, 250, 242, 0.82)",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 10
  },
  memoryVerseProgressBox: {
    alignItems: "flex-start",
    backgroundColor: "#fffaf2",
    borderColor: "rgba(201, 103, 80, 0.18)",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 9
  },
  phoneMemoryVerseHistoryBox: {
    gap: 8,
    padding: 9
  },
  memoryVerseHistoryStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  memoryVerseHistoryStat: {
    flexBasis: 120,
    flexGrow: 1,
    gap: 3,
    minWidth: 0
  },
  memoryVerseHistoryEvents: {
    gap: 6
  },
  memoryVerseHistoryEvent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  memoryVerseHistoryEventText: {
    flex: 1,
    fontSize: 12,
    minWidth: 0
  },
  memoryFocusBanner: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.25)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    padding: 10
  },
  memoryFocusBannerText: {
    color: colors.oliveDark,
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  memoryReviewQueueStopButton: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: 11
  },
  memoryReviewQueueStopText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  reviewScheduleBox: {
    backgroundColor: "rgba(255, 250, 242, 0.82)",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 10
  },
  memoryBulkReviewBox: {
    backgroundColor: "#fffdfa",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 10
  },
  memoryMoreReviewOptionsButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 4
  },
  memorySectionSortRow: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  memorySortToggle: {
    backgroundColor: colors.soft,
    borderRadius: 999,
    flexDirection: "row",
    flexShrink: 0,
    gap: 4,
    padding: 4
  },
  memorySortButton: {
    alignItems: "center",
    borderRadius: 999,
    minHeight: 30,
    minWidth: 72,
    justifyContent: "center",
    paddingHorizontal: 10
  },
  phoneMemorySortButton: {
    minHeight: 28,
    minWidth: 62,
    paddingHorizontal: 8
  },
  phoneMemorySortText: {
    fontSize: 11
  },
  reviewScheduleHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  reviewScheduleCloseButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  memorySection: {
    gap: 10
  },
  phoneMemorySection: {
    gap: 12,
    marginTop: 8,
    paddingTop: 4
  },
  memorySectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    marginTop: 4
  },
  memorySectionHeaderFeatured: {
    backgroundColor: "rgba(255, 250, 242, 0.9)",
    borderColor: "rgba(201, 103, 80, 0.22)",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 9
  },
  memoryDarkSectionHeaderFeatured: {
    backgroundColor: "#181511",
    borderColor: "#393027"
  },
  memorySectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800"
  },
  memorySectionTitleFeatured: {
    textTransform: "uppercase"
  },
  memorySectionCount: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800",
    minWidth: 26,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlign: "center"
  },
  memorySectionCountFeatured: {
    backgroundColor: "rgba(201, 103, 80, 0.14)",
    color: colors.coral,
    fontSize: 13,
    minWidth: 34,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  memorySectionCountReviewed: {
    backgroundColor: colors.sage,
    color: colors.oliveDark
  },
  memoryDarkSectionCountFeatured: {
    backgroundColor: "rgba(201, 103, 80, 0.22)",
    color: "#f2c7ba"
  },
  memoryDarkSectionCountReviewed: {
    backgroundColor: "rgba(118, 158, 123, 0.22)",
    color: "#cde0c8"
  },
  memoryCard: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 14
  },
  memoryCollectionPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  memoryCollectionPill: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  memoryDarkCollectionPill: {
    backgroundColor: "#2d352d",
    borderColor: "rgba(233, 183, 106, 0.16)",
    borderWidth: 1,
    color: "#f7eddc"
  },
  memoryCollectionManageBox: {
    backgroundColor: "rgba(255, 250, 242, 0.82)",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 9,
    padding: 10
  },
  memoryCollectionEditablePill: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  memoryCollectionEditableText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  memoryCollectionInputRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  memoryCollectionInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 42
  },
  memoryCollectionAddButton: {
    alignItems: "center",
    backgroundColor: colors.coral,
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 14
  },
  memoryCollectionSuggestionPill: {
    backgroundColor: "#fffdfa",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  collapsedMemoryCard: {
    gap: 5,
    paddingVertical: 10
  },
  phoneMemoryCard: {
    borderRadius: 12,
    gap: 9,
    padding: 11
  },
  activeMemoryCard: {
    backgroundColor: "#fffaf2",
    borderColor: "rgba(201, 103, 80, 0.28)"
  },
  phoneMemoryCardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 8,
    width: "100%"
  },
  memoryCardHeaderButton: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between"
  },
  memoryReferenceRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    minWidth: 0
  },
  memoryReferenceTitle: {
    flexShrink: 1,
    marginBottom: 0
  },
  memoryHeaderBadges: {
    alignItems: "flex-end",
    gap: 6
  },
  phoneMemoryHeaderBadges: {
    alignItems: "flex-end",
    flexDirection: "column",
    flexShrink: 0,
    gap: 4,
    justifyContent: "flex-start",
    maxWidth: 132
  },
  phoneMemoryHeaderPill: {
    fontSize: 10,
    lineHeight: 12,
    maxWidth: 132,
    paddingHorizontal: 7,
    paddingVertical: 4,
    textAlign: "right"
  },
  reviewDatePill: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 13,
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
    textAlign: "right"
  },
  dueReviewDatePill: {
    backgroundColor: colors.blush,
    color: colors.coral
  },
  memoryVerseText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24
  },
  phoneMemoryVerseText: {
    fontSize: 15,
    lineHeight: 22
  },
  memoryVersePreview: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18
  },
  memoryTranslationLabel: {
    fontSize: 12,
    lineHeight: 17
  },
  inlineMemoryPractice: {
    gap: 10
  },
  phoneInlineMemoryPractice: {
    backgroundColor: "#fffdfa",
    borderColor: "rgba(102, 114, 78, 0.14)",
    borderRadius: 12,
    borderWidth: 1,
    padding: 10
  },
  memoryMeditationBox: {
    backgroundColor: "#fffdfa",
    borderColor: "rgba(102, 114, 78, 0.14)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 12
  },
  phoneMemoryMeditationBox: {
    padding: 10
  },
  memoryMeditationScrim: {
    ...(Platform.OS === "web" ? ({ backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" } as any) : {}),
    backgroundColor: "rgba(36, 29, 25, 0.56)"
  },
  memoryMeditationFocusCard: {
    alignSelf: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
    marginTop: 46,
    maxHeight: "88%",
    maxWidth: 720,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    width: "88%"
  },
  phoneMemoryMeditationFocusCard: {
    borderRadius: 0,
    height: "100%",
    marginTop: 0,
    maxHeight: "100%",
    paddingHorizontal: 14,
    paddingTop: 16,
    width: "100%"
  },
  memoryMeditationFocusScroll: {
    maxHeight: 520
  },
  memoryMeditationFocusContent: {
    gap: 12,
    paddingBottom: 4
  },
  memoryMeditationHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  memoryMeditationVerse: {
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.14)",
    borderRadius: 12,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    fontStyle: "italic",
    fontWeight: "800",
    lineHeight: 24,
    padding: 12
  },
  memoryMeditationFocusVerse: {
    fontSize: 18,
    lineHeight: 28,
    padding: 14
  },
  memoryMeditationFocusSteps: {
    alignSelf: "stretch"
  },
  memoryMeditationStepButton: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    minHeight: 34,
    minWidth: 0,
    justifyContent: "center",
    paddingHorizontal: 8
  },
  memoryMeditationPromptBox: {
    gap: 8
  },
  memoryMeditationInput: {
    minHeight: 46
  },
  memoryMeditationTextarea: {
    minHeight: 92,
    textAlignVertical: "top"
  },
  phoneMemoryMeditationInput: {
    fontSize: 16,
    lineHeight: 22,
    maxWidth: "100%",
    width: "100%"
  },
  memoryPracticeBox: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  memoryPracticeText: {
    backgroundColor: "#fff6eb",
    borderRadius: 12,
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 30,
    padding: 14
  },
  phoneMemoryPracticeText: {
    fontSize: 17,
    lineHeight: 26,
    padding: 12
  },
  memoryPracticeHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between"
  },
  phoneMemoryPracticeHeader: {
    alignItems: "center",
    flexWrap: "nowrap"
  },
  phoneMemoryPracticeTitle: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 0,
    minWidth: 0
  },
  memoryStepRow: {
    backgroundColor: colors.soft,
    borderRadius: 999,
    flexDirection: "row",
    flexShrink: 0,
    gap: 5,
    padding: 4
  },
  phoneMemoryStepRow: {
    alignSelf: "flex-start",
    borderRadius: 999,
    flexShrink: 0,
    gap: 3,
    padding: 3
  },
  memoryStepButton: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    minHeight: 34,
    minWidth: 74,
    justifyContent: "center",
    paddingHorizontal: 8
  },
  phoneMemoryStepButton: {
    flex: 0,
    height: 28,
    minHeight: 28,
    minWidth: 28,
    paddingHorizontal: 0,
    width: 28
  },
  activeMemoryStepButton: {
    backgroundColor: colors.oliveDark
  },
  memoryStepText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 15
  },
  phoneMemoryStepText: {
    fontSize: 11
  },
  activeMemoryStepText: {
    color: "white"
  },
  memoryFillBox: {
    alignItems: "flex-start",
    backgroundColor: "#fff6eb",
    borderRadius: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 5,
    rowGap: 4,
    padding: 14
  },
  phoneMemoryFillBox: {
    columnGap: 4,
    paddingHorizontal: 10,
    paddingVertical: 12,
    rowGap: 6
  },
  memoryPracticeWord: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 32
  },
  methodCard: {
    alignSelf: "stretch",
    gap: 10,
    maxWidth: "100%",
    width: Platform.OS === "web" ? 310 : "100%"
  },
  methodCardAction: {
    marginTop: "auto"
  },
  methodCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  methodIconButton: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  methodStepCountRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  methodStepCountText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  methodLabelRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  methodLabelPill: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  methodLibraryToolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
    marginTop: 14
  },
  currentMethodStrip: {
    alignItems: "center",
    backgroundColor: "#fffdf8",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    marginTop: 14,
    padding: 12
  },
  currentMethodCopy: {
    flex: 1,
    minWidth: 190
  },
  currentMethodTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 19
  },
  currentMethodActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  currentMethodButton: {
    minHeight: 36,
    paddingHorizontal: 12
  },
  currentMethodButtonLabel: {
    fontSize: 12
  },
  methodToolbarButton: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  methodToolbarButtonText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  methodToolbarBadge: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    color: colors.oliveDark,
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3
  },
  methodFilterSection: {
    gap: 8,
    marginBottom: 14,
    marginTop: -4
  },
  methodFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  methodFilterChip: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  activeMethodFilterChip: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  methodFilterText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  activeMethodFilterText: {
    color: "white"
  },
  methodRecommendPanel: {
    gap: 12,
    marginBottom: 16
  },
  methodRecommendHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  methodRecommendTitleBlock: {
    flex: 1,
    gap: 4
  },
  methodRecommendTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  methodRecommendReason: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  methodRecommendChoices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  methodRecommendChoice: {
    backgroundColor: "#fffdf8",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  activeMethodRecommendChoice: {
    backgroundColor: colors.coral,
    borderColor: colors.coral
  },
  methodRecommendChoiceText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  activeMethodRecommendChoiceText: {
    color: "white"
  },
  emptyMethodCard: {
    maxWidth: "100%",
    width: Platform.OS === "web" ? 310 : "100%"
  },
  methodInfoPanel: {
    gap: 14,
    marginBottom: 16
  },
  methodInfoHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  methodInfoTitleBlock: {
    flex: 1
  },
  methodInfoSection: {
    gap: 8
  },
  methodInfoLabel: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  methodFitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  methodFitPill: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  methodStepPreview: {
    alignItems: "flex-start",
    backgroundColor: "#fffdf8",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 10
  },
  methodStepNumber: {
    backgroundColor: colors.coral,
    borderRadius: 999,
    color: "white",
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  methodStepCopy: {
    flex: 1,
    gap: 3
  },
  methodStepTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  methodStepText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  methodExamplePassage: {
    color: colors.coral,
    fontSize: 13,
    fontWeight: "900"
  },
  methodExampleLine: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 19
  },
  methodWatchBox: {
    alignItems: "flex-start",
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.24)",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 10
  },
  methodWatchText: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    lineHeight: 18
  },
  methodInfoActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  phoneMethodCard: {
    width: "100%"
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16
  },
  memoryTitleSupport: {
    marginBottom: 12
  },
  phoneMemoryMetricGrid: {
    flexWrap: "nowrap",
    gap: 6,
    marginBottom: 20,
    marginTop: 6
  },
  metric: {
    backgroundColor: colors.blush,
    borderRadius: 12,
    flex: 1,
    minWidth: 110,
    padding: 14
  },
  phoneMemoryMetric: {
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 10
  },
  metricValue: {
    color: colors.coral,
    fontSize: 24,
    fontWeight: "800"
  },
  phoneMemoryMetricValue: {
    fontSize: 20,
    textAlign: "center"
  },
  phoneMemoryMetricLabel: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center"
  },
  phoneMemoryPrimaryReviewButton: {
    alignItems: "center",
    backgroundColor: colors.coral,
    borderRadius: 999,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    marginBottom: 12,
    minHeight: 42,
    paddingHorizontal: 14
  },
  phoneMemoryPrimaryReviewText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900"
  },
  journalCard: {
    marginBottom: 14
  },
  collapsedJournalCard: {
    paddingVertical: 12
  },
  phoneJournalCard: {
    padding: 12
  },
  journalSearchBox: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    minHeight: 48,
    paddingHorizontal: 12
  },
  phoneJournalSearchBox: {
    borderRadius: 11,
    marginBottom: 10,
    minHeight: 44,
    paddingHorizontal: 10
  },
  journalSearchInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    minHeight: 44,
    minWidth: 0,
    outlineStyle: "none" as any
  },
  phoneJournalSearchInput: {
    fontSize: 14,
    minHeight: 40
  },
  clearSearchButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  },
  journalViewRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    marginBottom: 12
  },
  phoneJournalViewRow: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 8
  },
  journalViewToggle: {
    backgroundColor: colors.soft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    padding: 4
  },
  journalViewButton: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 12
  },
  activeJournalViewButton: {
    backgroundColor: colors.oliveDark
  },
  journalViewText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  activeJournalViewText: {
    color: "white"
  },
  clearDateFilterButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 34,
    paddingHorizontal: 12,
    justifyContent: "center"
  },
  clearDateFilterText: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "900"
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14
  },
  phoneJournalFilterRow: {
    gap: 6,
    marginBottom: 10
  },
  filterChip: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  phoneJournalFilterChip: {
    paddingHorizontal: 9,
    paddingVertical: 7
  },
  activeFilterChip: {
    backgroundColor: colors.oliveDark
  },
  filterText: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "700"
  },
  phoneJournalFilterText: {
    fontSize: 12
  },
  activeFilterText: {
    color: "white"
  },
  journalFilterPanel: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 13,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
    padding: 10
  },
  journalFilterSummary: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minHeight: 42
  },
  journalFilterSummaryCopy: {
    flex: 1,
    minWidth: 0
  },
  journalFilterSummaryText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20
  },
  journalFilterSummaryRight: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 8
  },
  journalFilterChipGrid: {
    marginBottom: 0
  },
  journalFilterChoiceChip: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  journalGuideBox: {
    alignItems: "flex-start",
    backgroundColor: colors.sage,
    borderRadius: 12,
    flexDirection: "row",
    gap: 9,
    marginBottom: 14,
    padding: 12
  },
  phoneJournalGuideBox: {
    borderRadius: 11,
    marginBottom: 10,
    padding: 10
  },
  journalGuideText: {
    color: colors.oliveDark,
    flex: 1,
    fontSize: 13,
    lineHeight: 19
  },
  journalCalendarBox: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 14,
    padding: 12
  },
  journalCalendarHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  calendarMonthButton: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  journalCalendarTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  calendarWeekdayRow: {
    flexDirection: "row"
  },
  calendarWeekday: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center"
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5
  },
  calendarDayCell: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flexBasis: "13.4%",
    height: 58,
    justifyContent: "center",
    minHeight: 44
  },
  activeCalendarDayCell: {
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.34)"
  },
  selectedCalendarDayCell: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  inactiveCalendarDayCell: {
    opacity: 0.42
  },
  calendarDayNumber: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  inactiveCalendarDayNumber: {
    color: colors.muted
  },
  selectedCalendarDayNumber: {
    color: "white"
  },
  calendarEntryCount: {
    color: colors.coral,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 1
  },
  selectedCalendarEntryCount: {
    color: "white"
  },
  journalScriptureBox: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
    marginBottom: 14,
    padding: 12
  },
  journalScriptureSection: {
    gap: 8
  },
  journalScriptureActiveBookChip: {
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.34)"
  },
  journalScriptureChapterSquare: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    width: 44
  },
  journalScriptureChapterCount: {
    color: colors.coral,
    fontSize: 9,
    fontWeight: "900",
    marginTop: 1
  },
  emptyJournalScriptureBox: {
    alignItems: "flex-start",
    gap: 8,
    padding: 4
  },
  dateFilterNotice: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.28)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  dateFilterText: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "800"
  },
  passageFilterNotice: {
    maxWidth: "100%",
    minWidth: 0
  },
  passageFilterText: {
    flexShrink: 1,
    minWidth: 0
  },
  clearPassageFilterInlineButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderColor: "rgba(201, 103, 80, 0.22)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    flexShrink: 0,
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  clearPassageFilterInlineText: {
    color: colors.coral,
    fontSize: 11,
    fontWeight: "900"
  },
  highlightLibraryPanel: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.28)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
    padding: 14
  },
  phoneHighlightLibraryPanel: {
    alignItems: "flex-start",
    borderRadius: 12,
    gap: 10,
    padding: 11
  },
  highlightLibraryIcon: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  highlightLibraryCopy: {
    flex: 1,
    minWidth: 0
  },
  highlightLibraryTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 3
  },
  highlightLibraryText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  reflectionBox: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 10,
    padding: 12
  },
  reflectionInput: {
    marginBottom: 0,
    minHeight: 66,
    paddingTop: 10,
    textAlignVertical: "top"
  },
  journalSection: {
    marginBottom: 16
  },
  emptyJournalBox: {
    alignItems: "flex-start",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 9,
    padding: 18
  },
  emptyMemoryActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  addMemoryHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  phoneAddMemoryHeader: {
    minHeight: 30,
    width: "100%"
  },
  addMemoryBox: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.24)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 12
  },
  phoneAddMemoryBox: {
    alignItems: "stretch",
    borderRadius: 12,
    flexDirection: "column",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  addMemoryCopy: {
    flex: 1,
    gap: 5,
    minWidth: 0
  },
  addMemoryText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  phoneAddMemoryTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  phoneAddMemoryTitle: {
    fontSize: 14,
    lineHeight: 17
  },
  phoneAddMemorySubtitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 14,
    marginTop: 1
  },
  phoneAddMemoryActions: {
    alignItems: "stretch",
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 6,
    width: "100%"
  },
  phoneMemoryAddActionButton: {
    flex: 1,
    minHeight: 34,
    minWidth: 0
  },
  phoneMemoryAddButton: {
    width: "100%"
  },
  emptyJournalTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800"
  },
  emptyJournalText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  helpPage: {
    gap: 16
  },
  helpHeroCard: {
    gap: 12
  },
  helpShareCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between"
  },
  phoneHelpShareCard: {
    alignItems: "stretch",
    flexDirection: "column"
  },
  helpShareCopy: {
    flex: 1,
    gap: 9,
    minWidth: 0
  },
  helpShareTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26
  },
  helpShareUrl: {
    alignSelf: "flex-start",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  helpDarkShareUrl: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.24)",
    color: "#e9b76a"
  },
  helpShareActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2
  },
  phoneHelpShareButton: {
    flex: 1,
    justifyContent: "center",
    minWidth: 130
  },
  phoneHelpShareButtonText: {
    textAlign: "center"
  },
  helpQrFrame: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 7,
    padding: 11
  },
  helpDarkQrFrame: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  helpQrImage: {
    height: 168,
    width: 168
  },
  helpQrCaption: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  helpActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  helpCategoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  helpCategoryChip: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  activeHelpCategoryChip: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  helpCategoryText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  activeHelpCategoryText: {
    color: "white"
  },
  helpQuickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  helpQuickCard: {
    flex: 1,
    gap: 8,
    minWidth: 210
  },
  phoneHelpGrid: {
    alignItems: "stretch",
    flexDirection: "column"
  },
  phoneHelpCard: {
    minWidth: 0,
    width: "100%"
  },
  helpStepNumber: {
    alignItems: "center",
    backgroundColor: colors.oliveDark,
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  helpDarkStepNumber: {
    backgroundColor: "#8f6a35"
  },
  helpStepNumberText: {
    color: "white",
    fontSize: 13,
    fontWeight: "900"
  },
  helpCardTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  helpCardText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  helpWalkthroughGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14
  },
  helpScreenshotCard: {
    flex: 1,
    gap: 10,
    minWidth: 280
  },
  helpScreenshotHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  helpWindowDots: {
    flexDirection: "row",
    gap: 4
  },
  helpWindowDot: {
    backgroundColor: colors.line,
    borderRadius: 999,
    height: 7,
    width: 7
  },
  helpDarkWindowDot: {
    backgroundColor: "rgba(233, 183, 106, 0.32)"
  },
  helpScreenshotFrame: {
    backgroundColor: "#fffdf8",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 9,
    minHeight: 170,
    overflow: "hidden",
    padding: 12
  },
  helpDarkScreenshotFrame: {
    backgroundColor: "#151a19",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  helpScreenshotTopBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  helpScreenshotLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  helpScreenshotPill: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  helpDarkScreenshotPill: {
    backgroundColor: "#2d352d",
    color: "#e9b76a"
  },
  helpVerseLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  helpSelectedLine: {
    backgroundColor: "#f4dfb6",
    borderRadius: 9,
    padding: 8
  },
  helpDarkSelectedLine: {
    backgroundColor: "rgba(233, 183, 106, 0.14)"
  },
  helpVerseNumber: {
    color: colors.coral,
    fontSize: 13,
    fontWeight: "900"
  },
  helpLongLine: {
    backgroundColor: colors.line,
    borderRadius: 999,
    height: 10,
    width: "78%"
  },
  helpDarkLine: {
    backgroundColor: "rgba(247, 237, 220, 0.24)"
  },
  helpMediumLine: {
    backgroundColor: colors.line,
    borderRadius: 999,
    height: 10,
    width: "62%"
  },
  helpShortLine: {
    backgroundColor: colors.line,
    borderRadius: 999,
    height: 10,
    width: "42%"
  },
  helpDockPreview: {
    backgroundColor: "#fbf2e4",
    borderColor: "#ead8bc",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    marginTop: "auto",
    padding: 7
  },
  helpDarkDockPreview: {
    backgroundColor: "#202625",
    borderColor: "rgba(233, 183, 106, 0.18)"
  },
  helpDockButton: {
    backgroundColor: colors.oliveDark,
    borderRadius: 999,
    color: "white",
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  helpTextAreaPreview: {
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    gap: 9,
    padding: 12
  },
  helpDarkTextAreaPreview: {
    backgroundColor: "#202625",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  helpToolbarPreview: {
    flexDirection: "row",
    gap: 6
  },
  helpToolButton: {
    backgroundColor: colors.sage,
    borderRadius: 8,
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  helpDarkToolButton: {
    backgroundColor: "#2d352d",
    color: "#e9b76a"
  },
  helpMemoryLine: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  helpBlankWord: {
    borderBottomColor: colors.coral,
    borderBottomWidth: 2,
    height: 18,
    width: 48
  },
  helpDarkBlankWord: {
    borderBottomColor: "#e9b76a"
  },
  helpMemoryWord: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  helpJournalRow: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10
  },
  helpDarkJournalRow: {
    backgroundColor: "#202625",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  helpJournalTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  helpFaqCard: {
    gap: 10
  },
  helpFaqItem: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    gap: 4,
    paddingTop: 10
  },
  helpDarkFaqItem: {
    borderTopColor: "rgba(233, 183, 106, 0.16)"
  },
  helpFaqQuestion: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  helpFaqAnswer: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  helpSectionCard: {
    gap: 12
  },
  helpGuideGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  phoneHelpGuideGrid: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 10,
    width: "100%"
  },
  helpGuideItem: {
    backgroundColor: "#fffdf8",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 10,
    minWidth: 280,
    padding: 12
  },
  helpDarkGuideItem: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  phoneHelpGuideItem: {
    alignSelf: "stretch",
    borderRadius: 10,
    flexBasis: "auto",
    flexGrow: 0,
    flexShrink: 0,
    gap: 6,
    minWidth: 0,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 9,
    width: "100%"
  },
  phoneHelpGuideItemOpen: {
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  phoneHelpGridItem: {
    minWidth: 0,
    width: "100%"
  },
  phoneHelpGuideHeader: {
    alignItems: "center",
    marginBottom: 0,
    minHeight: 34,
    width: "100%"
  },
  helpGuideTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    minWidth: 0
  },
  helpGuideSummary: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  helpGuideStepList: {
    gap: 7
  },
  phoneHelpGuideStepList: {
    gap: 10,
    maxWidth: "100%",
    minWidth: 0,
    width: "100%"
  },
  helpGuideStep: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    maxWidth: "100%",
    minWidth: 0
  },
  phoneHelpGuideStep: {
    alignSelf: "stretch",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    gap: 8,
    maxWidth: "100%",
    minWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    width: "auto"
  },
  helpDarkGuideStep: {
    backgroundColor: "transparent",
    borderColor: "transparent"
  },
  helpGuideStepNumber: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    color: colors.oliveDark,
    flexShrink: 0,
    fontSize: 11,
    fontWeight: "900",
    minWidth: 22,
    overflow: "hidden",
    paddingVertical: 4,
    textAlign: "center"
  },
  helpDarkGuideStepNumber: {
    backgroundColor: "#2d352d",
    color: "#e9b76a"
  },
  helpGuideStepText: {
    color: colors.ink,
    flex: 1,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19,
    minWidth: 0
  },
  phoneHelpGuideStepText: {
    flexBasis: 0,
    fontSize: 13,
    lineHeight: 18,
    maxWidth: "100%"
  },
  phoneHelpGuideAction: {
    alignSelf: "stretch",
    justifyContent: "center",
    marginTop: 2
  },
  phoneHelpGuideActionText: {
    textAlign: "center"
  },
  helpTabGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  helpTabItem: {
    alignItems: "flex-start",
    backgroundColor: "#fffdf8",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    minWidth: 250,
    padding: 11,
    width: "32%"
  },
  helpDarkTabItem: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  phoneHelpTabItem: {
    minWidth: 0,
    width: "100%"
  },
  helpTabCopy: {
    flex: 1,
    minWidth: 0
  },
  helpTroubleList: {
    gap: 9
  },
  helpTroubleItem: {
    alignItems: "flex-start",
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.24)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    padding: 11
  },
  helpDarkTroubleItem: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  feedbackCategoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  feedbackCategoryChip: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  helpDarkCategoryChip: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  activeFeedbackCategoryChip: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  feedbackCategoryText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  activeFeedbackCategoryText: {
    color: "white"
  },
  dangerActionChip: {
    backgroundColor: "#c96750",
    borderColor: "#c96750"
  },
  dangerActionText: {
    color: "white"
  },
  deletionRequestBox: {
    backgroundColor: "#fff6eb",
    borderColor: "#edd8bd",
    borderRadius: 12,
    borderWidth: 1,
    gap: 9,
    marginTop: 10,
    padding: 12
  },
  savedDataGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginVertical: 10
  },
  phoneSavedDataGrid: {
    flexDirection: "column",
    flexWrap: "nowrap"
  },
  savedDataItem: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: "31%",
    flexDirection: "row",
    gap: 9,
    minWidth: 150,
    padding: 10
  },
  phoneSavedDataItem: {
    flexBasis: "auto",
    minWidth: 0,
    width: "100%"
  },
  accountDarkSavedDataItem: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  savedDataIcon: {
    alignItems: "center",
    backgroundColor: "#eef3e5",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  accountDarkSavedDataIcon: {
    backgroundColor: "#2d352d"
  },
  savedDataCopy: {
    flex: 1,
    minWidth: 0
  },
  savedDataValue: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  savedDataLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  feedbackInput: {
    minHeight: 110,
    paddingTop: 12,
    textAlignVertical: "top"
  },
  iconTextButton: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  iconTextButtonLabel: {
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "900"
  },
  adminMapCard: {
    gap: 14,
    marginBottom: 14
  },
  adminMapHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  phoneAdminMapHeader: {
    flexDirection: "column"
  },
  adminMapTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  adminMapMetricPill: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderColor: "rgba(102, 114, 78, 0.28)",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  phoneAdminMapMetricPill: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 7,
    width: "100%"
  },
  adminMapMetricValue: {
    color: colors.oliveDark,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 24
  },
  adminMapMetricLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  adminMapLayout: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 14
  },
  phoneAdminMapLayout: {
    flexDirection: "column"
  },
  adminMapCanvas: {
    backgroundColor: "#fffdf8",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minHeight: 320,
    minWidth: 0,
    overflow: "hidden",
    position: "relative"
  },
  adminDarkMapCanvas: {
    backgroundColor: "#151a19",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  phoneAdminMapCanvas: {
    flex: 0,
    flexShrink: 0,
    height: 210,
    maxHeight: 210,
    minHeight: 210,
    width: "100%"
  },
  adminMapImage: {
    height: "100%",
    opacity: 0.82,
    width: "100%"
  },
  phoneAdminMapImage: {
    bottom: 0,
    height: "100%",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    width: "100%"
  },
  adminMapHotspot: {
    alignItems: "center",
    backgroundColor: colors.coral,
    borderColor: "#fffdf8",
    borderRadius: 999,
    borderWidth: 3,
    justifyContent: "center",
    position: "absolute",
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    transform: [{ translateX: -16 }, { translateY: -16 }]
  },
  adminMapHotspotSmall: {
    height: 28,
    width: 28
  },
  adminMapHotspotMedium: {
    height: 34,
    width: 34
  },
  adminMapHotspotLarge: {
    height: 40,
    width: 40
  },
  phoneAdminMapHotspot: {
    borderWidth: 2,
    height: 26,
    transform: [{ translateX: -13 }, { translateY: -13 }],
    width: 26
  },
  activeAdminMapHotspot: {
    backgroundColor: colors.oliveDark
  },
  adminMapHotspotText: {
    color: "white",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 18
  },
  adminMapNote: {
    alignItems: "center",
    backgroundColor: "rgba(255, 250, 242, 0.94)",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    bottom: 12,
    flexDirection: "row",
    gap: 6,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    position: "absolute"
  },
  phoneAdminMapNote: {
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  adminMapNoteText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  adminMapDetailPanel: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    minWidth: 240,
    padding: 12,
    width: "30%"
  },
  phoneAdminMapDetailPanel: {
    gap: 4,
    minWidth: 0,
    padding: 10,
    width: "100%"
  },
  adminMapDetailList: {
    gap: 8
  },
  adminMapDetailRow: {
    backgroundColor: "#fffdf8",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    gap: 3,
    padding: 9
  },
  adminMapDetailLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  adminMapDetailValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  adminDashboardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
    marginTop: 14
  },
  adminDashboardMetric: {
    flexBasis: 148,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 92,
    minWidth: 148
  },
  adminDashboardMetricLabel: {
    lineHeight: 17,
    marginTop: 2
  },
  phoneAdminDashboardGrid: {
    gap: 8,
    marginBottom: 10,
    marginTop: 10
  },
  adminDashboardCard: {
    flex: 1,
    gap: 10,
    marginBottom: 14,
    minWidth: 260
  },
  adminContainedAdminCard: {
    alignSelf: "stretch",
    flexBasis: "auto" as any,
    flexShrink: 1,
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    width: "100%"
  },
  phoneAdminDashboardCard: {
    alignSelf: "stretch",
    flexBasis: "auto" as any,
    flexGrow: 0,
    flexShrink: 1,
    marginBottom: 8,
    maxWidth: "100%",
    minWidth: 0,
    overflow: "visible",
    width: "100%"
  },
  adminSectionGrid: {
    alignItems: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14
  },
  phoneAdminSectionGrid: {
    alignItems: "stretch",
    flexDirection: "column",
    flexWrap: "nowrap",
    gap: 8,
    maxWidth: "100%",
    minWidth: 0,
    width: "100%"
  },
  adminMetricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  phoneAdminDetailMetricGrid: {
    gap: 8
  },
  adminCountList: {
    gap: 6
  },
  adminCountRow: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    minWidth: 0,
    padding: 8
  },
  phoneAdminCountRow: {
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  adminCountLabel: {
    color: colors.ink,
    flex: 1,
    fontSize: 12,
    fontWeight: "800"
  },
  adminFeedbackItem: {
    backgroundColor: "#fffdf8",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    minWidth: 0,
    padding: 10
  },
  phoneAdminFeedbackItem: {
    gap: 6,
    padding: 8
  },
  adminFeedbackList: {
    gap: 10
  },
  adminContainedList: {
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    width: "100%"
  },
  adminEmptyStateText: {
    flexShrink: 1,
    maxWidth: "100%",
    minWidth: 0
  },
  adminContainedText: {
    flexShrink: 1,
    maxWidth: "100%",
    minWidth: 0
  },
  securitySummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    width: "100%"
  },
  phoneSecuritySummaryGrid: {
    gap: 6
  },
  securitySummaryTile: {
    backgroundColor: "#fffdf8",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: 86,
    paddingHorizontal: 9,
    paddingVertical: 8
  },
  securitySummaryValue: {
    color: colors.oliveDark,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 21
  },
  securitySummaryLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  securityTypeBox: {
    backgroundColor: "#fffdf8",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 7,
    padding: 9
  },
  securityTypeChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  securityTypeChip: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  securityTypeChipText: {
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "900"
  },
  securityTypeChipCount: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900"
  },
  suspensionReasonBox: {
    alignSelf: "stretch",
    backgroundColor: "#fffdf8",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 7,
    maxWidth: "100%",
    minWidth: 0,
    padding: 9
  },
  suspensionReasonChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    maxWidth: "100%"
  },
  suspensionReasonChip: {
    borderColor: "rgba(201, 103, 80, 0.35)"
  },
  adminReviewBox: {
    backgroundColor: "#fffdf8",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 10
  },
  adminReviewForm: {
    gap: 8
  },
  adminReviewInput: {
    minHeight: 74,
    textAlignVertical: "top"
  },
  adminDirectoryTools: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 9,
    padding: 10
  },
  adminDirectorySearchBox: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  adminDirectorySearchInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    minWidth: 0,
    outlineStyle: "none" as any,
    padding: 0
  },
  adminDirectoryFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  adminDirectorySummary: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  adminDirectoryShowMore: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8
  },
  adminSuspendButton: {
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  adminUserRow: {
    alignItems: "center",
    backgroundColor: "#fffdf8",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minWidth: 0,
    padding: 10
  },
  phoneAdminUserRow: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 8
  },
  activeAdminUserRow: {
    backgroundColor: "#eef3e5",
    borderColor: colors.olive
  },
  adminDarkActiveUserRow: {
    backgroundColor: "#2d352d",
    borderColor: "rgba(233, 183, 106, 0.35)"
  },
  adminUserMetaPills: {
    alignItems: "flex-end",
    flexShrink: 0,
    gap: 5
  },
  phoneAdminUserMetaPills: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start"
  },
  adminUserDetailBox: {
    gap: 10,
    minWidth: 0
  },
  adminMiniActivityBox: {
    gap: 7
  },
  warningPill: {
    backgroundColor: "#f5cfc5",
    color: "#783423"
  },
  adminEventItem: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    padding: 10
  },
  adminAuditHeader: {
    maxWidth: "100%",
    minWidth: 0
  },
  adminAuditTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  adminAuditTitle: {
    flexShrink: 1,
    minWidth: 0
  },
  adminAuditDate: {
    flexShrink: 0
  },
  adminAuditDetails: {
    flexShrink: 1,
    maxWidth: "100%",
    minWidth: 0
  },
  phoneAdminEventItem: {
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 7
  },
  adminEventMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  printOptionsOverlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 520
  },
  printOptionsScrim: {
    backgroundColor: "rgba(36, 29, 25, 0.28)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  printDarkOptionsScrim: {
    backgroundColor: "rgba(0, 0, 0, 0.56)"
  },
  printOptionsCard: {
    alignSelf: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
    marginTop: 82,
    maxWidth: 520,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    width: "88%"
  },
  planCelebrationCard: {
    gap: 16,
    overflow: "hidden",
    paddingTop: 18
  },
  planCelebrationArt: {
    alignItems: "center",
    height: 96,
    justifyContent: "center",
    marginBottom: -2,
    overflow: "hidden"
  },
  planCelebrationIcon: {
    alignItems: "center",
    backgroundColor: "#eef3e5",
    borderColor: "#cbd8bd",
    borderRadius: 999,
    borderWidth: 1,
    height: 70,
    justifyContent: "center",
    width: 70,
    zIndex: 2
  },
  planCelebrationIconDark: {
    backgroundColor: "#2f3025",
    borderColor: "#5b6348"
  },
  planCelebrationParticle: {
    backgroundColor: colors.coral,
    borderRadius: 999,
    height: 7,
    position: "absolute",
    width: 7
  },
  planCelebrationParticleGold: {
    backgroundColor: "#d49a3a"
  },
  planCelebrationParticleGreen: {
    backgroundColor: colors.oliveDark
  },
  planCelebrationTitle: {
    fontSize: 24
  },
  memoryPrintOptionsCard: {
    overflow: "hidden"
  },
  memoryCollectionPromptCard: {
    maxWidth: 560
  },
  memoryBookCollectionCard: {
    maxHeight: "86%",
    maxWidth: 680,
    overflow: "hidden"
  },
  memoryBookCollectionScroll: {
    flexShrink: 1
  },
  memoryBookCollectionContent: {
    gap: 14,
    paddingBottom: 4
  },
  memoryBookDropdownStack: {
    gap: 8
  },
  memoryBookDropdown: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 9
  },
  memoryBookDropdownHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minHeight: 42
  },
  memoryBookDropdownTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  memoryBookDropdownTitle: {
    color: colors.oliveDark,
    fontSize: 14,
    fontWeight: "900"
  },
  memoryBookDropdownSubtitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 15
  },
  memoryBookPickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  memoryBookPickerChip: {
    backgroundColor: "#fffdf8",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 7
  },
  memoryBookPickerChipText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  memoryBookRangeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  memoryBookRangeInput: {
    flex: 1,
    minWidth: 72
  },
  memoryBookRangeDash: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900"
  },
  memoryCollectionPromptSummary: {
    alignItems: "flex-start",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    padding: 10
  },
  memoryCollectionPromptText: {
    color: colors.muted,
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    minWidth: 0
  },
  editorSettingsCard: {
    maxWidth: 520,
    overflow: "hidden"
  },
  editorSettingsStatus: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    minWidth: 120
  },
  editorSettingsSaveButton: {
    alignItems: "center",
    backgroundColor: colors.coral,
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 18
  },
  editorSettingsSaveText: {
    color: "white",
    fontSize: 13,
    fontWeight: "900"
  },
  highlightColorPickerCard: {
    alignSelf: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
    marginTop: 112,
    maxWidth: 420,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    width: "88%"
  },
  highlightColorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  highlightColorChoice: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  activeHighlightColorChoice: {
    borderColor: colors.coral,
    borderWidth: 2
  },
  highlightColorSwatch: {
    borderColor: "rgba(36, 29, 25, 0.16)",
    borderRadius: 999,
    borderWidth: 1,
    height: 20,
    width: 20
  },
  phonePrintOptionsCard: {
    marginTop: 68,
    width: "92%"
  },
  rhythmGraceCard: {
    gap: 13
  },
  phoneRhythmGraceCard: {
    marginTop: 62,
    padding: 14,
    width: "91%"
  },
  printOptionsHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  printOptionsTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  printOptionsTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  printOptionsSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 3
  },
  printOptionGroup: {
    gap: 8
  },
  printOptionsHintText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  printOptionLabel: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  printOptionChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  printOptionChip: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 12
  },
  printDarkOptionChip: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.18)"
  },
  activePrintOptionChip: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  printOptionChipText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  activePrintOptionChipText: {
    color: "white"
  },
  printOptionToggleList: {
    gap: 8
  },
  printOptionToggle: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    minHeight: 32
  },
  printOptionToggleCopy: {
    flex: 1,
    minWidth: 0
  },
  printOptionToggleText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  memoryPrintPickerHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  memoryPrintPickerActions: {
    flexDirection: "row",
    flexShrink: 0,
    gap: 12
  },
  memoryPrintPickerActionText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  memoryPrintVersePicker: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1
  },
  memoryPrintOptionsScroll: {
    flexShrink: 1,
    minHeight: 0
  },
  memoryPrintOptionsScrollContent: {
    gap: 14,
    paddingBottom: 2
  },
  memoryPrintVersePickerContent: {
    gap: 8,
    padding: 8
  },
  memoryPrintVerseRow: {
    alignItems: "flex-start",
    backgroundColor: "white",
    borderColor: "rgba(108, 91, 67, 0.14)",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    padding: 10
  },
  activeMemoryPrintVerseRow: {
    borderColor: colors.coral
  },
  memoryPrintVerseCopy: {
    flex: 1,
    minWidth: 0
  },
  memoryPrintVerseReference: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  memoryPrintVerseText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 2
  },
  memoryDarkSubPanel: {
    backgroundColor: "#151a19",
    borderColor: "rgba(233, 183, 106, 0.18)"
  },
  memoryDarkSoftPanel: {
    backgroundColor: "#1b211f",
    borderColor: "rgba(233, 183, 106, 0.14)"
  },
  rhythmGraceInfoBox: {
    alignItems: "flex-start",
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 11
  },
  rhythmGraceIconBubble: {
    alignItems: "center",
    backgroundColor: "#fff0df",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  rhythmGraceInfoCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0
  },
  rhythmGraceInfoLabel: {
    color: colors.coral,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  rhythmGraceInfoText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  rhythmGraceBodyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20
  },
  printOptionsActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    flexShrink: 0,
    gap: 10,
    justifyContent: "flex-end"
  },
  rhythmGraceActions: {
    justifyContent: "space-between"
  },
  phoneRhythmGraceActions: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 8
  },
  rhythmGracePrimaryButton: {
    minWidth: 190
  },
  rhythmGraceSecondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 14
  },
  printOptionsCancelButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 12
  },
  printDarkCancelButton: {
    backgroundColor: "#151a19",
    borderColor: "rgba(233, 183, 106, 0.32)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16
  },
  printOptionsCancelText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900"
  },
  phonePrintOpenButton: {
    justifyContent: "center",
    width: "100%"
  },
  phonePrintOpenButtonText: {
    textAlign: "center"
  },
  contextHelpButton: {
    alignItems: "center",
    backgroundColor: colors.oliveDark,
    borderColor: "rgba(255, 255, 255, 0.72)",
    borderRadius: 999,
    borderWidth: 2,
    height: 48,
    justifyContent: "center",
    position: "absolute",
    right: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    width: 48,
    zIndex: 350
  },
  contextHelpOverlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 500
  },
  contextHelpScrim: {
    backgroundColor: "rgba(36, 29, 25, 0.22)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  contextHelpCard: {
    alignSelf: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginTop: 86,
    maxWidth: 520,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    width: "88%"
  },
  phoneContextHelpCard: {
    marginTop: 74,
    width: "92%"
  },
  contextHelpHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  contextHelpList: {
    gap: 8
  },
  contextHelpTip: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8
  },
  contextHelpTipText: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    lineHeight: 20
  },
  contextHelpActions: {
    alignItems: "flex-start",
    marginTop: 2
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10
  },
  sectionHelp: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10
  },
  journalHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between"
  },
  journalCompactHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  journalCompactTitleButton: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 8,
    minWidth: 0
  },
  journalTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  journalHeaderCopyRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 9,
    minWidth: 0
  },
  journalEntryTypeIcon: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderRadius: 999,
    flexShrink: 0,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  journalStatusCluster: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 7
  },
  journalDateGroup: {
    gap: 10,
    marginBottom: 8
  },
  journalDateGroupTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.4,
    marginTop: 2,
    textTransform: "uppercase"
  },
  pinButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.sage,
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    minHeight: 32,
    paddingHorizontal: 10
  },
  activePinButton: {
    backgroundColor: colors.oliveDark
  },
  pinButtonText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  activePinButtonText: {
    color: "white"
  },
  pinIconButton: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  activePinIconButton: {
    backgroundColor: colors.oliveDark
  },
  pinJournalIconButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 6,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  activePinJournalIconButton: {
    backgroundColor: "transparent"
  },
  draftPill: {
    backgroundColor: colors.blush,
    borderRadius: 999,
    color: colors.coral,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 13,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  readingPlanCountPill: {
    backgroundColor: "#f5eadb",
    color: "#7d6744"
  },
  pinnedJournalPill: {
    backgroundColor: colors.oliveDark,
    color: "white"
  },
  journalShareBox: {
    backgroundColor: "#fff6eb",
    borderRadius: 12,
    marginBottom: 10,
    padding: 12
  },
  journalMeditationScriptureBox: {
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.18)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 10,
    marginTop: 6,
    padding: 12
  },
  journalDarkMeditationScriptureBox: {
    backgroundColor: "#151a19",
    borderColor: "rgba(233, 183, 106, 0.24)"
  },
  journalMeditationReference: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.2,
    lineHeight: 18
  },
  journalMeditationVerseText: {
    color: colors.ink,
    fontSize: 16,
    fontStyle: "italic",
    fontWeight: "700",
    lineHeight: 24
  },
  journalMeditationAnswer: {
    marginBottom: 8
  },
  journalMeditationAnswerHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    marginBottom: 4
  },
  journalMeditationAnswerTitle: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.4,
    lineHeight: 16,
    textTransform: "uppercase"
  },
  studyReviewBox: {
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.18)",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12
  },
  formattedNote: {
    gap: 4,
    marginBottom: 8
  },
  formattedBulletRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 7
  },
  formattedBullet: {
    color: colors.coral,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 0
  },
  formattedBulletText: {
    flex: 1,
    marginBottom: 0
  },
  formattedBold: {
    fontWeight: "900"
  },
  formattedItalic: {
    fontStyle: "italic"
  },
  formattedUnderline: {
    textDecorationLine: "underline"
  },
  formattedHighlight: {
    backgroundColor: "#f4dfb6",
    borderRadius: 4,
    overflow: "hidden",
    paddingHorizontal: 2
  },
  markupSummaryRow: {
    gap: 9
  },
  markupSummaryItem: {
    alignItems: "flex-start",
    gap: 5,
    maxWidth: "100%"
  },
  markupSummaryChip: {
    borderRadius: 999,
    maxWidth: "100%",
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  markupSummaryText: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16
  },
  markupSummaryNote: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 19
  },
  reflectionSummaryBox: {
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.24)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 10,
    padding: 12
  },
  reflectionSummaryHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7
  },
  reflectionSummarySection: {
    gap: 3
  },
  reflectionSummaryLabel: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  journalActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  phoneJournalActions: {
    gap: 6
  },
  phoneJournalActionButton: {
    flex: 1,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 38,
    minWidth: 130,
    paddingHorizontal: 8
  },
  phoneJournalActionText: {
    fontSize: 12,
    textAlign: "center"
  },
  phoneMemoryActions: {
    gap: 6
  },
  phoneMemoryPrimaryActions: {
    alignItems: "stretch",
    flexDirection: "row",
    flexWrap: "nowrap"
  },
  resumeButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.28)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    marginTop: 6,
    maxWidth: "100%",
    minHeight: 40,
    paddingHorizontal: 13
  },
  phoneMemoryActionButton: {
    flex: 1,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 38,
    minWidth: 112,
    paddingHorizontal: 8
  },
  phoneMemoryPracticeButton: {
    flex: 1.25,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 38,
    minWidth: 0,
    paddingHorizontal: 8
  },
  phoneMemoryMeditateButton: {
    flex: 1,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 38,
    minWidth: 0,
    paddingHorizontal: 8
  },
  phoneMemoryMoreButton: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "transparent",
    borderRadius: 999,
    borderWidth: 0,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 38,
    width: 42
  },
  phoneMemoryMoreMenu: {
    backgroundColor: "#fffdfa",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
    padding: 8
  },
  phoneMemoryToolbarMoreMenu: {
    alignSelf: "stretch",
    backgroundColor: "#fffdfa",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
    marginTop: -4,
    padding: 8
  },
  phoneMemoryMoreMenuItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    minHeight: 34,
    paddingHorizontal: 4
  },
  phoneMemoryMoreMenuText: {
    color: colors.oliveDark,
    flex: 1,
    fontSize: 12,
    fontWeight: "900"
  },
  phoneMemoryActionText: {
    fontSize: 12,
    textAlign: "center"
  },
  primaryResumeButton: {
    backgroundColor: colors.coral,
    borderColor: colors.coral
  },
  resumeButtonPressed: {
    opacity: 0.72
  },
  disabledButton: {
    opacity: 0.56
  },
  resumeButtonText: {
    color: colors.coral,
    flexShrink: 1,
    fontWeight: "800"
  },
  primaryResumeButtonText: {
    color: "white"
  },
  bold: {
    fontWeight: "800"
  }
});
