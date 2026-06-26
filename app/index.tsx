import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Mark, mergeAttributes } from "@tiptap/core";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { api } from "@/convex/_generated/api";
import { bibleBooks } from "@/data/bibleBooks";
import { getDeviceKey } from "@/data/deviceKey";
import { getActiveCheckinPartnerId, getCompletedPlanDays, getPinnedJournalEntries, getStoredAppearanceMode, getStoredBibleBookmarks, getStoredBibleReadChapters, getStoredBibleReaderHistory, getStoredBibleReaderPosition, getStoredBibleTranslation, getStoredCheckinPartners, getStoredCollapsedStudyPanels, getStoredCustomWritingPrompts, getStoredStudyFocusMode, getStoredTutorCoachingEnabled, saveActiveCheckinPartnerId, saveCompletedPlanDays, savePinnedJournalEntries, saveStoredAppearanceMode, saveStoredBibleBookmarks, saveStoredBibleReadChapters, saveStoredBibleReaderHistory, saveStoredBibleReaderPosition, saveStoredBibleTranslation, saveStoredCheckinPartners, saveStoredCollapsedStudyPanels, saveStoredCustomWritingPrompts, saveStoredStudyFocusMode, saveStoredTutorCoachingEnabled, type StoredAppearanceMode, type StoredBibleBookmark, type StoredBibleReadChapters, type StoredBibleReaderHistoryItem, type StoredCheckinPartner } from "@/data/feedbackPreferences";
import { getContextHelp } from "@/data/help";
import { LEGAL_LAST_UPDATED, PRIVACY_POLICY_SECTIONS, TERMS_OF_SERVICE_SECTIONS } from "@/data/legal";
import { DEFAULT_MEMORY_MILESTONE_IDS, MEMORY_MILESTONE_GOALS, MEMORY_REVIEW_OPTIONS, buildMemoryBookOptions, buildMemoryBrowseSections, buildMemoryChapterOptions, buildMemoryHistoryEncouragement, buildMemoryHistorySummary, buildMemoryMilestones, buildMemoryPracticeText, buildMemoryPracticeTokens, buildMemoryQueueSections, buildMemoryReference, buildMemoryVerseKeySet, buildMemoryWeeklyScripture, buildMemoryWeeklySummary, buildNeglectedMemoryVerses, clampMemoryPracticeLevel, formatMemoryBlankValue, formatMemoryHistoryDate, isMemoryVerseDue, isMemoryVerseMemorized, isTodayLocal, memoryAnswerIsReference, memoryBlankWidth, memoryHintRevealCount, memoryHintText, memoryHistoryEventIcon, memoryHistoryEventLabel, memoryPracticeLabel, memoryProgressLabel, memoryReviewDateLabel, memoryVerseProgressDetail, memoryVerseProgressMessage, neglectedMemoryVerseLabel, normalizeMemoryAnswer, normalizeMemoryMilestoneIds, parseMemoryReference, reviewPresetForDate, reviewPresetLabel, type MemoryBrowseStatusFilter, type MemoryMilestoneGoalId, type MemoryReviewPreset } from "@/data/memory";
import { methods } from "@/data/methods";
import { buildEditableMemoryCardsDocHtml, buildPrintableMemoryCardsHtml, buildPrintableStudyWorksheetHtml, type MemoryCardLayout, type WorksheetWritingSpace } from "@/data/printableWorksheet";
import { buildStudyHelpLinks } from "@/data/studyHelp";
import { studyPlans } from "@/data/studyPlans";
import { AppButton, Card, Eyebrow, colors } from "@/components/ui";
import { AdminDashboard, type AdminStats } from "@/components/AdminDashboard";
import { HelpScreenshot } from "@/components/HelpScreenshot";
import { useAction, useMutation, useQuery } from "convex/react";
import { createElement, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Image, Keyboard, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";

type Tab = "home" | "study" | "bible" | "plans" | "methods" | "memory" | "accountability" | "journal" | "account" | "help" | "admin";
const tabs: Tab[] = ["home", "study", "bible", "plans", "methods", "memory", "accountability", "journal", "account", "help", "admin"];
type StudyPhase = "study" | "review" | "saved";
type JournalFilter = "all" | "pinned" | "drafts" | "studies" | "meditations" | "checkins" | "highlights" | "reviews";
type JournalView = "list" | "calendar" | "scripture";
type MemoryView = "review" | "browse" | "history";
type MemoryPrintSet = "due" | "reviewed" | "all" | "current" | "custom";
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
type BibleSearchScope = "all" | "old" | "new";
type BibleSearchMode = "word" | "phrase" | "allWords" | "anyWords" | "theme";
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

const ScriptureTextColor = Mark.create({
  name: "scriptureTextColor",
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-scripture-color") || element.style.color || null,
        renderHTML: (attributes) =>
          attributes.color ? { "data-scripture-color": attributes.color, style: `color: ${attributes.color}` } : {}
      }
    };
  },
  parseHTML() {
    return [
      { tag: "span[data-scripture-color]" },
      {
        tag: "span",
        getAttrs: (element) => {
          const color = (element as HTMLElement).style.color;
          return color ? { color } : false;
        }
      }
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  }
});

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
const BIBLE_CHAPTER_COUNTS: Record<string, number> = {
  Genesis: 50, Exodus: 40, Leviticus: 27, Numbers: 36, Deuteronomy: 34, Joshua: 24, Judges: 21, Ruth: 4,
  "1 Samuel": 31, "2 Samuel": 24, "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36,
  Ezra: 10, Nehemiah: 13, Esther: 10, Job: 42, Psalms: 150, Proverbs: 31, Ecclesiastes: 12, "Song of Solomon": 8,
  Isaiah: 66, Jeremiah: 52, Lamentations: 5, Ezekiel: 48, Daniel: 12, Hosea: 14, Joel: 3, Amos: 9, Obadiah: 1,
  Jonah: 4, Micah: 7, Nahum: 3, Habakkuk: 3, Zephaniah: 3, Haggai: 2, Zechariah: 14, Malachi: 4,
  Matthew: 28, Mark: 16, Luke: 24, John: 21, Acts: 28, Romans: 16, "1 Corinthians": 16, "2 Corinthians": 13,
  Galatians: 6, Ephesians: 6, Philippians: 4, Colossians: 4, "1 Thessalonians": 5, "2 Thessalonians": 3,
  "1 Timothy": 6, "2 Timothy": 4, Titus: 3, Philemon: 1, Hebrews: 13, James: 5, "1 Peter": 5, "2 Peter": 3,
  "1 John": 5, "2 John": 1, "3 John": 1, Jude: 1, Revelation: 22
};
const BIBLE_BOOK_ALIASES: Record<string, string> = {
  gen: "Genesis", ge: "Genesis", ex: "Exodus", exo: "Exodus", lev: "Leviticus", le: "Leviticus", num: "Numbers", nu: "Numbers",
  deut: "Deuteronomy", de: "Deuteronomy", dt: "Deuteronomy", josh: "Joshua", jos: "Joshua", judg: "Judges", jdg: "Judges",
  ruth: "Ruth", ru: "Ruth", "1sam": "1 Samuel", "1 sam": "1 Samuel", "1sa": "1 Samuel", "1 sa": "1 Samuel",
  "2sam": "2 Samuel", "2 sam": "2 Samuel", "2sa": "2 Samuel", "2 sa": "2 Samuel", "1ki": "1 Kings", "1 ki": "1 Kings",
  "1kgs": "1 Kings", "1 kgs": "1 Kings", "1king": "1 Kings", "1 king": "1 Kings", "2ki": "2 Kings", "2 ki": "2 Kings",
  "2kgs": "2 Kings", "2 kgs": "2 Kings", "2king": "2 Kings", "2 king": "2 Kings", "1chron": "1 Chronicles",
  "1 chron": "1 Chronicles", "1chr": "1 Chronicles", "1 chr": "1 Chronicles", "1ch": "1 Chronicles", "1 ch": "1 Chronicles",
  "2chron": "2 Chronicles", "2 chron": "2 Chronicles", "2chr": "2 Chronicles", "2 chr": "2 Chronicles", "2ch": "2 Chronicles",
  "2 ch": "2 Chronicles", ezra: "Ezra", ezr: "Ezra", neh: "Nehemiah", est: "Esther", job: "Job", ps: "Psalm",
  psa: "Psalm", psm: "Psalm", psalm: "Psalm", psalms: "Psalm", prov: "Proverbs", pro: "Proverbs", pr: "Proverbs",
  ecc: "Ecclesiastes", eccl: "Ecclesiastes", song: "Song of Solomon", sos: "Song of Solomon", "song sol": "Song of Solomon",
  "song of sol": "Song of Solomon", isa: "Isaiah", is: "Isaiah", jer: "Jeremiah", lam: "Lamentations", ezek: "Ezekiel",
  eze: "Ezekiel", ezk: "Ezekiel", dan: "Daniel", hos: "Hosea", obad: "Obadiah", mic: "Micah", nah: "Nahum",
  hab: "Habakkuk", zeph: "Zephaniah", zep: "Zephaniah", hag: "Haggai", zech: "Zechariah", zec: "Zechariah",
  mal: "Malachi", matt: "Matthew", mt: "Matthew", mrk: "Mark", mk: "Mark", lk: "Luke", jn: "John", joh: "John",
  ac: "Acts", rom: "Romans", ro: "Romans", "1cor": "1 Corinthians", "1 cor": "1 Corinthians", "1co": "1 Corinthians",
  "1 co": "1 Corinthians", "2cor": "2 Corinthians", "2 cor": "2 Corinthians", "2co": "2 Corinthians", "2 co": "2 Corinthians",
  gal: "Galatians", ga: "Galatians", eph: "Ephesians", phil: "Philippians", php: "Philippians", col: "Colossians",
  "1thes": "1 Thessalonians", "1 thes": "1 Thessalonians", "1thess": "1 Thessalonians", "1 thess": "1 Thessalonians",
  "1th": "1 Thessalonians", "1 th": "1 Thessalonians", "2thes": "2 Thessalonians", "2 thes": "2 Thessalonians",
  "2thess": "2 Thessalonians", "2 thess": "2 Thessalonians", "2th": "2 Thessalonians", "2 th": "2 Thessalonians",
  "1tim": "1 Timothy", "1 tim": "1 Timothy", "1ti": "1 Timothy", "1 ti": "1 Timothy", "2tim": "2 Timothy",
  "2 tim": "2 Timothy", "2ti": "2 Timothy", "2 ti": "2 Timothy", tit: "Titus", philem: "Philemon", phm: "Philemon",
  heb: "Hebrews", jas: "James", jam: "James", "1pet": "1 Peter", "1 pet": "1 Peter", "1pe": "1 Peter",
  "1 pe": "1 Peter", "2pet": "2 Peter", "2 pet": "2 Peter", "2pe": "2 Peter", "2 pe": "2 Peter", "1jn": "1 John",
  "1 jn": "1 John", "1john": "1 John", "1 john": "1 John", "2jn": "2 John", "2 jn": "2 John", "2john": "2 John",
  "2 john": "2 John", "3jn": "3 John", "3 jn": "3 John", "3john": "3 John", "3 john": "3 John", rev: "Revelation",
  revelation: "Revelation"
};
const OLD_TESTAMENT_BOOKS = bibleBooks.slice(0, bibleBooks.indexOf("Matthew"));
const NEW_TESTAMENT_BOOKS = bibleBooks.slice(bibleBooks.indexOf("Matthew"));
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
type BibleVerse = {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
};
type BiblePassage = {
  reference: string;
  text: string;
  verses?: BibleVerse[];
  translation_id: string;
  translation_name: string;
  translation_note: string;
};
type BibleSearchResult = {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
  sourceQuery: string;
};

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
  const [appShareStatus, setAppShareStatus] = useState("");
  const [incomingShareSource, setIncomingShareSource] = useState("");
  const [openLegalSection, setOpenLegalSection] = useState<LegalSection>("");
  const [selectedAdminRegion, setSelectedAdminRegion] = useState("Australia");
  const [selectedAdminProfileId, setSelectedAdminProfileId] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [contextHelpOpen, setContextHelpOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setIconFontReady] = useState(Platform.OS !== "web");
  const [passage, setPassage] = useState("Psalm 23");
  const [methodId, setMethodId] = useState(methods[0].id);
  const [activeMethodInfoId, setActiveMethodInfoId] = useState("");
  const [methodFilter, setMethodFilter] = useState("All");
  const [methodRecommendationId, setMethodRecommendationId] = useState<MethodRecommendationId>("quick");
  const [methodFilterOpen, setMethodFilterOpen] = useState(false);
  const [methodChooserOpen, setMethodChooserOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(studyPlans[0].id);
  const [activePlanDayKey, setActivePlanDayKey] = useState("");
  const [completedPlanDayKeys, setCompletedPlanDayKeys] = useState<string[]>([]);
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
  const [memorySearch, setMemorySearch] = useState("");
  const [memoryBookFilter, setMemoryBookFilter] = useState("all");
  const [memoryChapterFilter, setMemoryChapterFilter] = useState("all");
  const [memoryBrowseStatusFilter, setMemoryBrowseStatusFilter] = useState<MemoryBrowseStatusFilter>("all");
  const [memoryHistoryExpanded, setMemoryHistoryExpanded] = useState(false);
  const [memoryToolbarMoreOpen, setMemoryToolbarMoreOpen] = useState(false);
  const [memoryMilestonePickerOpen, setMemoryMilestonePickerOpen] = useState(false);
  const [memoryMilestoneGoalIds, setMemoryMilestoneGoalIds] = useState<MemoryMilestoneGoalId[]>(DEFAULT_MEMORY_MILESTONE_IDS);
  const [memoryMilestoneStatus, setMemoryMilestoneStatus] = useState("");
  const [addMemoryPanelOpen, setAddMemoryPanelOpen] = useState(false);
  const [activeMemoryVerseId, setActiveMemoryVerseId] = useState("");
  const [activeMemoryMeditationVerseId, setActiveMemoryMeditationVerseId] = useState("");
  const [memoryMeditationStep, setMemoryMeditationStep] = useState(0);
  const [memoryMeditationPhrase, setMemoryMeditationPhrase] = useState("");
  const [memoryMeditationReflection, setMemoryMeditationReflection] = useState("");
  const [memoryMeditationPrayer, setMemoryMeditationPrayer] = useState("");
  const [memoryMeditationCarry, setMemoryMeditationCarry] = useState("");
  const [reviewScheduleVerseId, setReviewScheduleVerseId] = useState("");
  const [historyMemoryVerseId, setHistoryMemoryVerseId] = useState("");
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
  const [printWorksheetMethodId, setPrintWorksheetMethodId] = useState(methods[0]?.id || "");
  const [printWorksheetWritingSpace, setPrintWorksheetWritingSpace] = useState<WorksheetWritingSpace>("standard");
  const [printWorksheetIncludes, setPrintWorksheetIncludes] = useState({ memory: true, insight: true });
  const [memoryPrintOptionsOpen, setMemoryPrintOptionsOpen] = useState(false);
  const [memoryPrintSet, setMemoryPrintSet] = useState<MemoryPrintSet>("due");
  const [memoryPrintLayout, setMemoryPrintLayout] = useState<MemoryCardLayout>("pocket");
  const [memoryPrintCopies, setMemoryPrintCopies] = useState(1);
  const [memoryPrintSafeMode, setMemoryPrintSafeMode] = useState(true);
  const [memoryPrintSelectedVerseIds, setMemoryPrintSelectedVerseIds] = useState<string[]>([]);
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
  const [readerBookSearch, setReaderBookSearch] = useState("");
  const [readerNavCollapsed, setReaderNavCollapsed] = useState(false);
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
  const readerTooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appScrollRef = useRef<any>(null);
  const accountLegalYRef = useRef(0);
  const bibleSearchSummaryYRef = useRef(0);
  const readerPassageBoxYRef = useRef(0);
  const readerVerseYRef = useRef<Record<number, number>>({});
  const previousTabRef = useRef<Tab>(tab);
  const trackedIncomingShareRef = useRef("");
  const communityReactionStorageProfileRef = useRef("");
  const previousActiveProfileIdRef = useRef("");
  const loadedDraftRevisionRef = useRef(0);
  const isHydratingDraftRef = useRef(false);

  useEffect(() => {
    if (tab === "journal" && previousTabRef.current !== "journal") {
      setJournalView("list");
      setJournalDateFilterKey("");
    }
    previousTabRef.current = tab;
  }, [tab]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    Ionicons.loadFont()
      .then(() => setIconFontReady(true))
      .catch(() => setIconFontReady(true));
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const requestedTab = url.searchParams.get("tab");
    const sharedSource = url.searchParams.get("shared");
    const pendingTab = typeof localStorage !== "undefined" ? localStorage.getItem("bibleStudyTutorReturnTab") : "";
    const nextTab = tabs.includes(requestedTab as Tab) ? requestedTab : tabs.includes(pendingTab as Tab) ? pendingTab : "";
    if (nextTab) setTab(nextTab as Tab);
    if (sharedSource) setIncomingShareSource(sharedSource.slice(0, 40));
    if (typeof localStorage !== "undefined") localStorage.removeItem("bibleStudyTutorReturnTab");
    if (requestedTab || sharedSource) {
      url.searchParams.delete("tab");
      url.searchParams.delete("shared");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
  }, []);

  useEffect(() => {
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
  }, [authLoading, authName, ensureProfile, isAuthenticated]);

  useEffect(() => {
    getPinnedJournalEntries()
      .then(setPinnedJournalEntryIds)
      .catch(() => undefined);
    getCompletedPlanDays()
      .then(setCompletedPlanDayKeys)
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
    getStoredAppearanceMode()
      .then(setAppearanceMode)
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
  }, []);

  useEffect(() => {
    return () => {
      if (readerTooltipTimerRef.current) clearTimeout(readerTooltipTimerRef.current);
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
  const shouldLoadMemoryVerses = profileMatchesActiveState && (tab === "home" || tab === "study" || tab === "bible" || tab === "memory" || tab === "journal" || tab === "account");
  const shouldLoadMemoryHistory = profileMatchesActiveState && tab === "memory";
  const shouldLoadAdminOverview = profileMatchesActiveState && (tab === "account" || tab === "admin");
  const timezoneOffsetMinutes = new Date().getTimezoneOffset();

  const stats = useQuery(api.study.stats, profileMatchesActiveState ? { profileId: activeProfileId, timezoneOffsetMinutes } : "skip");
  const sessions = useQuery(api.study.recentSessions, shouldLoadStudyLists ? { profileId: activeProfileId, limit: 12 } : "skip");
  const savedDraft = useQuery(
    api.study.draftForPassage,
    profileMatchesActiveState ? { profileId: activeProfileId, passage: passage.trim() || "Selected passage", methodId } : "skip"
  );
  const drafts = useQuery(api.study.recentDrafts, shouldLoadStudyLists ? { profileId: activeProfileId, limit: 12 } : "skip");
  const dueStudyReviews = useQuery(api.study.dueStudyReviews, shouldLoadDueStudyReviews ? { profileId: activeProfileId, limit: 10 } : "skip");
  const checkins = useQuery(api.accountability.recentCheckins, shouldLoadEncouragements ? { profileId: activeProfileId, limit: 50 } : "skip");
  const communityFriends = useQuery((api as any).community.myFriends, shouldLoadCommunityConnections ? { profileId: activeProfileId } : "skip");
  const communityCircles = useQuery((api as any).community.myCircles, shouldLoadCommunityConnections ? { profileId: activeProfileId } : "skip");
  const memoryVerses = useQuery(api.memory.list, shouldLoadMemoryVerses ? { profileId: activeProfileId, limit: 50 } : "skip");
  const memoryHistory = useQuery((api as any).memory.listHistory, shouldLoadMemoryHistory ? { profileId: activeProfileId, limit: 120 } : "skip");
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
  const studyHelps = useMemo(() => buildStudyHelpLinks(passageText?.reference || passage, bibleTranslation), [bibleTranslation, passage, passageText?.reference]);
  const continueLabel =
    step.responseType === "none"
      ? step.nextLabel || "I am ready for the next step"
      : stepIndex === method.steps.length - 1
        ? "Review study"
        : "Save and continue";
  const parsedPassage = parsePassageQuery(passageQuery);
  const latestCheckin = checkins?.[0];
  const selectedPlan = studyPlans.find((item) => item.id === selectedPlanId) || studyPlans[0];
  const completedPlanDaySet = new Set(completedPlanDayKeys);
  const selectedPlanCompletedCount = selectedPlan.days.filter((day) => completedPlanDaySet.has(planDayKey(selectedPlan.id, day.day))).length;
  const selectedPlanNextDay = selectedPlan.days.find((day) => !completedPlanDaySet.has(planDayKey(selectedPlan.id, day.day))) || selectedPlan.days[0];
  const selectedPlanComplete = selectedPlanCompletedCount === selectedPlan.days.length;
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
  const readerReference = `${readerBook} ${readerChapter}`;
  const readerStudyReference = buildReaderStudyReference(readerBook, readerChapter, selectedReaderVerses);
  const filteredReaderBooks = bibleBooks.filter((book) => book.toLowerCase().includes(readerBookSearch.trim().toLowerCase()));
  const readerBookSections = [
    { title: "Old Testament", books: OLD_TESTAMENT_BOOKS.filter((book) => filteredReaderBooks.includes(book)) },
    { title: "New Testament", books: NEW_TESTAMENT_BOOKS.filter((book) => filteredReaderBooks.includes(book)) }
  ].filter((section) => section.books.length > 0);
  const readerChapterCount = BIBLE_CHAPTER_COUNTS[readerBook] || 1;
  const activeReaderActionVerse = selectedReaderVerses.includes(readerActionVerse) ? readerActionVerse : selectedReaderVerses[selectedReaderVerses.length - 1] || 0;
  const currentChapterRead = readBibleChapters[readerBook]?.includes(readerChapter) || false;
  const readBibleChapterCount = Object.values(readBibleChapters).reduce((count, chapters) => count + chapters.length, 0);
  const currentChapterBookmarked = bibleBookmarks.some((bookmark) => bookmark.reference === buildReaderStudyReference(readerBook, readerChapter, []) && bookmark.bookmarked !== false);
  const currentSelectionBookmark = selectedReaderVerses.length > 0
    ? bibleBookmarks.find((bookmark) => bookmark.reference === readerStudyReference)
    : undefined;
  const currentSelectionBookmarked =
    selectedReaderVerses.length > 0 && !!currentSelectionBookmark && currentSelectionBookmark.bookmarked !== false;
  const filteredBibleBookmarks = bibleBookmarks
    .filter((bookmark) => {
      const query = bookmarkSearch.trim().toLowerCase();
      const matchesSearch = !query || `${bookmark.reference} ${bookmark.note || ""}`.toLowerCase().includes(query);
      const matchesNoteFilter = !bookmarkNotesOnly || !!bookmark.note?.trim();
      return matchesSearch && matchesNoteFilter;
    });
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
    () => buildMemoryVerseKeySet(readerPassage?.verses || [], memoryVerses || []),
    [memoryVerses, readerPassage?.verses]
  );
  const selectedVersesAlreadyInMemory = selectedVerses.length > 0 && selectedVerses.every((verse) => memoryVerseKeys.has(verseMarkupKey(verse)));
  const selectedReaderVerseObjects = useMemo(() => {
    const selectedSet = new Set(selectedReaderVerses);
    return (readerPassage?.verses || [])
      .filter((verse) => selectedSet.has(verse.verse))
      .sort((a, b) => a.verse - b.verse);
  }, [readerPassage?.verses, selectedReaderVerses]);
  const selectedReaderVersesAlreadyInMemory =
    selectedReaderVerseObjects.length > 0 &&
    selectedReaderVerseObjects.every((verse) => readerMemoryVerseKeys.has(verseMarkupKey(verse)));
  const adminStats = adminOverview as AdminStats | null;
  const bibleSearchBookOptions = useMemo(() => buildBibleSearchBookOptions(bibleSearchScope), [bibleSearchScope]);
  const bibleSearchSections = useMemo(() => buildBibleSearchSections(bibleSearchResults, bibleSearchScope, bibleSearchBook), [bibleSearchBook, bibleSearchResults, bibleSearchScope]);
  const bibleSearchTranslation = bibleTranslation === "kjv" ? "KJV" : bibleTranslation === "bsb" ? "BSB" : "WEB";
  const journalSearchTerm = journalSearch.trim().toLowerCase();
  const pinnedEntryIds = new Set(pinnedJournalEntryIds);
  const baseVisibleDrafts = (drafts || []).filter((draft: any) => matchesJournalSearch(draft, journalSearchTerm));
  const baseHighlightJournalEntries = buildHighlightJournalEntries(sessions || [], drafts || [], journalSearchTerm);
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
  const journalSessionEntries = (sessions || []).filter((entry: any) => {
    if (journalFilter === "studies") return !isMemoryMeditationEntry(entry);
    if (journalFilter === "meditations") return isMemoryMeditationEntry(entry);
    return true;
  });
  const baseJournalEntries = [
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
    });
  const journalCalendarItems = buildJournalCalendarItems({
    drafts: (journalFilter === "all" || journalFilter === "drafts") ? baseVisibleDrafts : [],
    highlights: journalFilter === "highlights" ? baseHighlightJournalEntries : [],
    entries: baseJournalEntries,
    pinnedEntryIds
  });
  const dateFilteredDrafts = baseVisibleDrafts.filter((draft: any) => matchesJournalDateFilter(draft, journalDateFilterKey));
  const dateFilteredHighlightJournalEntries = baseHighlightJournalEntries.filter((item) => matchesJournalDateFilter(item, journalDateFilterKey));
  const dateFilteredJournalEntries = baseJournalEntries.filter((entry: any) => matchesJournalDateFilter(entry, journalDateFilterKey));
  const journalScriptureItems = buildJournalScriptureItems({
    drafts: (journalFilter === "all" || journalFilter === "drafts") ? dateFilteredDrafts : [],
    highlights: journalFilter === "highlights" ? dateFilteredHighlightJournalEntries : [],
    entries: dateFilteredJournalEntries,
    pinnedEntryIds
  });
  const journalScriptureBookSections = buildJournalScriptureBookSections(journalScriptureItems);
  const selectedJournalScriptureEntryCount = selectedJournalScriptureBook && selectedJournalScriptureChapter
    ? countJournalScriptureEntries(journalScriptureItems, selectedJournalScriptureBook, selectedJournalScriptureChapter)
    : 0;
  const selectedJournalDateEntryCount = journalDateFilterKey
    ? journalCalendarItems.filter((item) => item.dateKey === journalDateFilterKey).length
    : 0;
  const visibleDrafts = dateFilteredDrafts.filter((draft: any) => matchesJournalScriptureFilter(draft, selectedJournalScriptureBook, selectedJournalScriptureChapter, "draft"));
  const highlightJournalEntries = dateFilteredHighlightJournalEntries.filter((item) => matchesJournalScriptureFilter(item, selectedJournalScriptureBook, selectedJournalScriptureChapter, "highlight"));
  const journalEntries = dateFilteredJournalEntries.filter((entry: any) => matchesJournalScriptureFilter(entry, selectedJournalScriptureBook, selectedJournalScriptureChapter, "entry"));
  const showDraftsSection = (journalFilter === "all" || journalFilter === "drafts") && visibleDrafts.length > 0;
  const showHighlightsSection = journalFilter === "highlights" && highlightJournalEntries.length > 0;
  const dueStudyReviewCount = dueStudyReviews?.length || 0;
  const showJournalEmptyState = !showDraftsSection && !showHighlightsSection && journalEntries.length === 0;
  const activeMemoryVerse = (memoryVerses || []).find((item: any) => String(item._id) === activeMemoryVerseId);
  const activeMemoryMeditationVerse = (memoryVerses || []).find((item: any) => String(item._id) === activeMemoryMeditationVerseId);
  const memoryQueueSections = useMemo(() => buildMemoryQueueSections(memoryVerses || []), [memoryVerses]);
  const firstDueMemoryVerse = memoryQueueSections.find((section) => section.title === "Due for Review")?.verses[0];
  const memorySearchTerm = memorySearch.trim().toLowerCase();
  const memoryBookOptions = useMemo(() => buildMemoryBookOptions(memoryVerses || []), [memoryVerses]);
  const memoryChapterOptions = useMemo(() => buildMemoryChapterOptions(memoryVerses || [], memoryBookFilter), [memoryBookFilter, memoryVerses]);
  const memoryBrowseSections = useMemo(
    () => buildMemoryBrowseSections(memoryVerses || [], memorySearchTerm, memoryBookFilter, memoryChapterFilter, memoryBrowseStatusFilter),
    [memoryBookFilter, memoryBrowseStatusFilter, memoryChapterFilter, memorySearchTerm, memoryVerses]
  );
  const dueMemoryCount = (memoryVerses || []).filter((item: any) => isMemoryVerseDue(item)).length;
  const reviewedTodayCount = (memoryVerses || []).filter((item: any) => isTodayLocal(item.lastReviewedAt)).length;
  const memoryHistoryItems = memoryHistory || [];
  const memoryHistorySummary = useMemo(() => buildMemoryHistorySummary(memoryHistoryItems, memoryVerses || []), [memoryHistoryItems, memoryVerses]);
  const memoryHistoryEncouragement = useMemo(
    () => buildMemoryHistoryEncouragement(memoryHistorySummary, firstName),
    [firstName, memoryHistorySummary]
  );
  const memoryWeeklySummary = useMemo(() => buildMemoryWeeklySummary(memoryHistoryItems, memoryVerses || [], firstName), [firstName, memoryHistoryItems, memoryVerses]);
  const memoryWeeklyScripture = useMemo(() => buildMemoryWeeklyScripture(memoryHistoryItems, memoryVerses || []), [memoryHistoryItems, memoryVerses]);
  const memoryMilestones = useMemo(
    () => buildMemoryMilestones(memoryHistoryItems, memoryVerses || [], memoryMilestoneGoalIds),
    [memoryHistoryItems, memoryMilestoneGoalIds, memoryVerses]
  );
  const neglectedMemoryVerses = useMemo(() => buildNeglectedMemoryVerses(memoryVerses || []), [memoryVerses]);
  const visibleMemoryHistoryItems = memoryHistoryExpanded ? memoryHistoryItems.slice(0, 30) : memoryHistoryItems.slice(0, 10);
  const memoryPracticeText = useMemo(
    () => (activeMemoryVerse ? buildMemoryPracticeText(activeMemoryVerse) : ""),
    [activeMemoryVerse]
  );
  const memoryPracticeTokens = useMemo(
    () => (memoryPracticeText ? buildMemoryPracticeTokens(memoryPracticeText, memoryPracticeLevel, memoryStepTwoOffset) : []),
    [memoryPracticeLevel, memoryPracticeText, memoryStepTwoOffset]
  );
  const memoryBlankTokens = memoryPracticeTokens.filter((token) => token.blank);
  const firstMemoryBlankIndex = memoryBlankTokens[0]?.index ?? -1;
  const memoryPracticeAllCorrect =
    memoryBlankTokens.length > 0 &&
    memoryBlankTokens.every((token) => normalizeMemoryAnswer(memoryPracticeAnswers[token.index] || "") === normalizeMemoryAnswer(token.answer));
  const compactLayout = width < 900;
  const phoneLayout = width < 760;
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
  const visibleMemorySections = (memoryView === "history" ? [] : memoryView === "review" ? memoryQueueSections : memoryBrowseSections)
    .map((section) => ({
      ...section,
      verses: phoneMemoryFocusMode
        ? section.verses.filter((verse: any) => String(verse._id) === (activeMemoryVerseId || activeMemoryMeditationVerseId))
        : section.verses
    }))
    .filter((section) => section.verses.length > 0);
  const currentBrowseMemoryVerses = memoryBrowseSections.flatMap((section) => section.verses);
  function getMemoryPrintCandidateVerses(printSet: MemoryPrintSet) {
    const saved = memoryVerses || [];
    if (printSet === "due") return saved.filter((verse: any) => isMemoryVerseDue(verse));
    if (printSet === "reviewed") return saved.filter((verse: any) => !isMemoryVerseDue(verse));
    if (printSet === "current") return memoryView === "browse" ? currentBrowseMemoryVerses : visibleMemorySections.flatMap((section) => section.verses);
    return saved;
  }
  const memoryPrintCandidateVerses = useMemo(() => getMemoryPrintCandidateVerses(memoryPrintSet), [currentBrowseMemoryVerses, memoryPrintSet, memoryVerses, memoryView, visibleMemorySections]);
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
    }, 120);

    return () => clearTimeout(timeout);
  }, [activeMemoryVerseId, firstMemoryBlankIndex, memoryPracticeFocusKey, memoryPracticeLevel]);

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
    if (profile.appearanceMode === "light" || profile.appearanceMode === "dark") {
      setAppearanceMode(profile.appearanceMode);
      saveStoredAppearanceMode(profile.appearanceMode).catch(() => undefined);
    }
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

        setPassageText(data);
        setPassageStatus("");
      } catch (error) {
        if (controller.signal.aborted) return;
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
  }, [passage, passageReloadKey, bibleTranslation]);

  useEffect(() => {
    const controller = new AbortController();
    const reference = `${readerBook} ${readerChapter}`;
    setReaderStatus("Loading chapter...");
    setReaderPassage(null);

    const timeout = setTimeout(async () => {
      try {
        const data =
          bibleTranslation === "bsb"
            ? await fetchBsbPassage(reference, controller.signal)
            : await fetchBibleApiPassage(reference, bibleTranslation, controller.signal);
        setReaderPassage(data);
        setReaderStatus("");
      } catch {
        if (controller.signal.aborted) return;
        setReaderStatus("I couldn't load that chapter. Try again or choose another chapter.");
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [readerBook, readerChapter, bibleTranslation]);

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
      return next;
    });
  }, [bibleTranslation, readerBook, readerChapter]);

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
      shareNote: finalShareNote,
      completedPlanDay: activePlanDayKey ? selectedPlan.days.find((day) => planDayKey(selectedPlan.id, day.day) === activePlanDayKey)?.title : undefined
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
    setCheckinNote(finalShareNote);
    if (activePlanDayKey) {
      setCompletedPlanDayKeys((current) => {
        if (current.includes(activePlanDayKey)) return current;
        const next = [activePlanDayKey, ...current];
        saveCompletedPlanDays(next).catch(() => undefined);
        return next;
      });
      setActivePlanDayKey("");
    }
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
    setActivePlanDayKey("");
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
      setAccountStatus("Appearance saved");
    } catch {
      setAccountStatus("Appearance saved on this device only");
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

  function renderCommunityHistoryItem(item: any) {
    const sharedTo = Array.isArray(item.sharedTo) ? item.sharedTo : [];
    const itemIsPost = item.itemType === "communityPost";
    const canEditItem = !itemIsPost || item.canEdit !== false;
    const reactionPostId = item.sharedPostId || sharedTo.find((destination: any) => destination.postId)?.postId || (itemIsPost ? item._id : undefined);
    const reactionOverride = reactionPostId ? communityReactionOverrides[String(reactionPostId)] : undefined;
    const reactionCounts = reactionOverride?.reactions || item.reactions || {};
    const myReactions = reactionOverride?.myReactions || (Array.isArray(item.myReactions) ? item.myReactions : []);
    const reactionOptions = [
      { key: "amen", label: "Amen", symbol: "🙌", count: reactionCounts.amen || 0 },
      { key: "praying", label: "Praying", symbol: "🙏", count: reactionCounts.praying || 0 }
    ] as const;
    const destinationText = sharedTo.length > 0
      ? `Shared to ${sharedTo.map((destination: any) => destination.circleName || destination.friendName).filter(Boolean).join(", ")}`
      : itemIsPost ? "Shared post" : "Private encouragement";
    const deletePending = !itemIsPost && pendingCheckinDeleteId === item._id;
    const itemIsEditing = itemIsPost ? editingCommunityPostId === item._id : editingRecentCheckinId === item._id;
    const editValue = itemIsPost ? editCommunityPostNote : editRecentCheckinNote;
    const saveBusy = itemIsPost ? isSavingCommunityPostEdit : isSavingRecentCheckinEdit;
    const itemLabel = itemIsPost ? item.mood || "study insight" : item.mood === "check-in" ? "encouragement" : item.mood || "encouragement";
    const focusedItem = String(focusedCommunityItemId) === String(item._id);
    const showActionRow = focusedItem || itemIsEditing || deletePending;
    const authorText = item.authorLabel || "";
    const itemMeta = [
      new Date(item.createdAt).toLocaleDateString(),
      authorText,
      destinationText,
      item.passageReference
    ].filter(Boolean).join(" · ");

    return (
      <Pressable
        key={item._id}
        onPress={() => {
          if (!itemIsEditing) setFocusedCommunityItemId((current) => String(current) === String(item._id) ? "" : String(item._id));
        }}
        style={[styles.checkinHistoryItem, communityDarkMode && styles.accountDarkInsetBox, focusedItem && styles.focusedCheckinHistoryItem, communityDarkMode && focusedItem && styles.accountDarkSection, phoneLayout && styles.phoneCheckinHistoryItem]}
        accessibilityRole="button"
        accessibilityLabel={showActionRow ? "Hide post actions" : "Show post actions"}
      >
        <View style={styles.checkinHistoryHeader}>
          <View style={styles.checkinHistoryMeta}>
            <View style={styles.checkinTitleRow}>
              <Text style={[styles.checkinMood, communityDarkMode && styles.accountDarkTitle]}>{itemLabel}</Text>
            </View>
            <Text style={[styles.checkinDestinationText, communityDarkMode && styles.accountDarkMutedText]}>{itemMeta}</Text>
          </View>
        </View>
        {itemIsEditing ? (
          <TextInput
            value={editValue}
            onChangeText={itemIsPost ? setEditCommunityPostNote : setEditRecentCheckinNote}
            multiline
            placeholderTextColor={communityDarkMode ? "#8f8678" : undefined}
            style={[styles.input, styles.checkinEditInput, communityDarkMode && styles.accountDarkInput]}
          />
        ) : (
          <Text style={[styles.lastCheckinText, communityDarkMode && styles.accountDarkText]}>{item.note || "No note added."}</Text>
        )}
        {(reactionPostId && !itemIsEditing) || showActionRow ? (
          <View style={[styles.communityPostFooterRow, phoneLayout && styles.phoneCommunityPostFooterRow]}>
            {reactionPostId && !itemIsEditing ? (
              <View style={styles.circleReactionRow}>
                {reactionOptions.map((reaction) => {
                  const active = myReactions.includes(reaction.key);
                  return (
                    <Pressable
                      key={reaction.key}
                      onPress={(event) => {
                        event.stopPropagation?.();
                        toggleCommunityReaction(reactionPostId, reaction.key, reactionCounts, myReactions);
                      }}
                      style={[styles.circleReactionChip, communityDarkMode && styles.accountDarkSection, active && styles.activeCircleReactionChip]}
                      accessibilityLabel={`${reaction.label} reaction`}
                    >
                      <Text style={styles.circleReactionSymbol}>{reaction.symbol}</Text>
                      {reaction.count > 0 && (
                        <Text style={[styles.circleReactionText, communityDarkMode && styles.accountDarkMutedText, active && styles.activeCircleReactionText]}>{reaction.count}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ) : <View />}
            {showActionRow && <View style={[styles.checkinActionRow, phoneLayout && styles.phoneCheckinActionRow]}>
              {itemIsEditing && canEditItem ? (
                <>
                  <Pressable
                    onPress={() => itemIsPost ? saveCommunityPostEdit(item) : saveRecentCheckinEdit(item)}
                    style={[styles.checkinIconButton, styles.checkinSaveIconButton]}
                    accessibilityLabel={itemIsPost ? "Save shared post changes" : "Save encouragement changes"}
                  >
                    <Ionicons name={saveBusy ? "hourglass-outline" : "checkmark-outline"} size={16} color="white" />
                  </Pressable>
                  <Pressable onPress={itemIsPost ? cancelEditCommunityPost : cancelEditRecentCheckin} style={[styles.checkinIconButton, communityDarkMode && styles.homeDarkIconBubble]} accessibilityLabel="Cancel edit">
                    <Ionicons name="close-outline" size={16} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable onPress={() => copyPastCheckinMessage(item)} style={[styles.checkinIconButton, communityDarkMode && styles.homeDarkIconBubble]} accessibilityLabel={itemIsPost ? "Copy shared post" : "Copy encouragement"}>
                    <Ionicons name="copy-outline" size={16} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                  </Pressable>
                  {canEditItem && (
                    <>
                      <Pressable onPress={() => itemIsPost ? startEditCommunityPost(item) : startEditRecentCheckin(item)} style={[styles.checkinIconButton, communityDarkMode && styles.homeDarkIconBubble]} accessibilityLabel={itemIsPost ? "Edit shared post" : "Edit encouragement"}>
                        <Ionicons name="create-outline" size={16} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                      </Pressable>
                      <Pressable
                        onPress={() => itemIsPost ? deleteCommunityPost(item._id) : deleteRecentCheckin(item)}
                        style={[styles.checkinIconButton, styles.checkinDeleteIconButton, deletePending && styles.pendingDeleteButton]}
                        accessibilityLabel={deletePending ? "Confirm delete encouragement" : itemIsPost ? "Remove shared post" : "Remove encouragement"}
                      >
                        <Ionicons name={deletePending ? "alert-circle-outline" : "trash-outline"} size={16} color={colors.coral} />
                      </Pressable>
                    </>
                  )}
                </>
              )}
            </View>}
          </View>
        ) : null}
      </Pressable>
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
          setAppShareStatus("Share sheet opened.");
          return;
        }
        if (nav?.clipboard?.writeText) {
          await nav.clipboard.writeText(APP_SHARE_URL);
          trackUsage("app_shared", { reference: "Copy link", tab: "help" });
          setAppShareStatus("Link copied. Paste it into a message, email, or group chat.");
          return;
        }
      }

      const { Share } = await import("react-native");
      await Share.share({ title: "Bible Study Tutor", message });
      trackUsage("app_shared", { reference: "Share button", tab: "help" });
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

  function openPrintableWorksheet() {
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
    const worksheetHtml = buildPrintableStudyWorksheetHtml({
      reference: printWorksheetRequest.reference,
      translation: printWorksheetRequest.translation,
      method: selectedMethod,
      verses: printWorksheetRequest.verses,
      writingSpace: printWorksheetWritingSpace,
      includeMemory: printWorksheetIncludes.memory,
      includeInsight: printWorksheetIncludes.insight
    });
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      if (printWorksheetRequest.source === "bible") {
        setReaderMemoryStatus("Allow pop-ups to open the printable worksheet.");
      } else {
        setSaveStatus("Allow pop-ups to open the printable worksheet.");
      }
      return;
    }

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
    setPrintWorksheetRequest(null);
  }

  function openMemoryPrintOptions() {
    if (!(memoryVerses || []).length) {
      setMemoryStatus("Add a memory verse before printing cards.");
      return;
    }
    const initialSet: MemoryPrintSet = dueMemoryCount > 0 ? "due" : "all";
    setMemoryPrintSet(initialSet);
    setMemoryPrintSelectedVerseIds(getMemoryPrintCandidateVerses(initialSet).map((verse: any) => String(verse._id)));
    setMemoryPrintLayout("pocket");
    setMemoryPrintCopies(1);
    setMemoryPrintOptionsOpen(true);
  }

  function changeMemoryPrintSet(printSet: MemoryPrintSet) {
    setMemoryPrintSet(printSet);
    setMemoryPrintSelectedVerseIds(getMemoryPrintCandidateVerses(printSet).map((verse: any) => String(verse._id)));
  }

  function toggleMemoryPrintVerse(verseId: string) {
    setMemoryPrintSelectedVerseIds((selectedIds) =>
      selectedIds.includes(verseId)
        ? selectedIds.filter((id) => id !== verseId)
        : [...selectedIds, verseId]
    );
  }

  function openPrintableMemoryCards() {
    if (!memoryPrintVerses.length) {
      setMemoryStatus("Select at least one saved memory verse before opening cards.");
      return;
    }
    if (Platform.OS !== "web" || typeof window === "undefined") {
      setMemoryStatus("Memory cards are available to print from the web app.");
      setMemoryPrintOptionsOpen(false);
      return;
    }

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
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setMemoryStatus("Allow pop-ups to open printable memory cards.");
      return;
    }

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

  function downloadEditableMemoryCards() {
    if (!memoryPrintVerses.length) {
      setMemoryStatus("Select at least one saved memory verse before downloading cards.");
      return;
    }
    if (Platform.OS !== "web" || typeof window === "undefined" || typeof document === "undefined") {
      setMemoryStatus("Editable memory cards can be downloaded from the web app.");
      return;
    }

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

  function startMemoryPractice(verse: any) {
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

  function startMemoryMeditation(verse: any) {
    const verseId = String(verse._id);
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
      setTimeout(() => memoryBlankInputRefs.current[nextToken.index]?.focus(), 80);
      return;
    }

    Keyboard.dismiss();
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

  async function continueMemoryPractice() {
    if (!activeMemoryVerse || !memoryPracticeAllCorrect) return;
    const completedFinalStep = memoryPracticeLevel >= 3;
    await markMemoryPractice("got-it");
    if (completedFinalStep) {
      const completedVerseId = String(activeMemoryVerse._id);
      setActiveMemoryVerseId("");
      setExpandedMemoryVerseIds((current) => current.filter((id) => id !== completedVerseId));
      setMemoryStatus("reviewed-today");
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
        practiceLevel: memoryPracticeLevel
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
      practiceLevel: memoryPracticeLevel
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
      setMemoryStatus(`${reference} review was changed to ${reviewLabel}.`);
    } catch {
      setMemoryStatus(`Could not change the review timing for ${reference}.`);
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

  function startPlanDay(planDay: (typeof studyPlans)[number]["days"][number], planId = selectedPlan.id) {
    setSelectedPlanId(planId);
    const nextMethod = methods.find((item) => item.id === planDay.methodId) || method;
    setPassage(planDay.passage);
    setPassageQuery(planDay.passage);
    setMethodId(nextMethod.id);
    setAnswers({});
    setShareNote("");
    resetPassageMarkup();
    setStepIndex(0);
    setStudyPhase("study");
    setLoadedDraftKey("");
    setActivePlanDayKey(planDayKey(planId, planDay.day));
    setSaveStatus("Plan day " + planDay.day + " loaded");
    setTab("study");
  }

  function moveReaderChapter(direction: -1 | 1) {
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
    setReaderBook(book);
    setReaderChapter(chapter);
    scrollReaderToTop();
    setRememberedPanel(setReaderNavCollapsed, "bibleReaderNavCollapsed", true);
    setExpandedMobileReaderBook("");
    setReaderMobileMenu(null);
  }

  function openBibleReaderHistoryItem(item: StoredBibleReaderHistoryItem) {
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
    if (nextChapter !== readerChapter) setReaderChapter(nextChapter);
  }

  function openReaderChapterInStudy() {
    setPassage(readerStudyReference);
    setPassageQuery(readerStudyReference);
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

  function resetSelectedPlanProgress(planId = selectedPlan.id) {
    setCompletedPlanDayKeys((current) => {
      const next = current.filter((key) => !key.startsWith(`${planId}:`));
      saveCompletedPlanDays(next).catch(() => undefined);
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
  const activeContextHelp = getContextHelp(tab);
  const contextHelpBottom = showMobileReaderNoteEditor ? 300 : showMobileReaderSelectionDock ? 142 : 18;

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
            <Ionicons name={mobileMenuOpen ? "close-outline" : "menu-outline"} size={23} color={accountDarkMode ? "#e9b76a" : colors.oliveDark} />
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
              onPress={() => {
                setTab(key as Tab);
                if (phoneLayout) setMobileMenuOpen(false);
              }}
              style={[styles.tab, accountDarkMode && styles.appDarkTab, tab === key && styles.activeTab, accountDarkMode && tab === key && styles.appDarkActiveTab]}
            >
              <Ionicons name={icon as any} size={18} color={tab === key ? (accountDarkMode ? "#e9b76a" : colors.oliveDark) : (accountDarkMode ? "#c8bda9" : colors.muted)} />
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
        contentContainerStyle={[
          styles.content,
          accountDarkMode && styles.appDarkContent,
          phoneLayout && styles.phoneContent,
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
                  Bible Study Tutor helps you draw near to God through Scripture, prayerful reflection, and steady daily rhythms. Read, study, journal, memorize, and review in one simple place.
                </Text>
                <View style={styles.homeActionRow}>
                  <AppButton label="Start a study" onPress={() => setTab("study")} style={phoneLayout && styles.homePhoneActionButton} />
                  <AppButton
                    label="Read Scripture"
                    variant="secondary"
                    onPress={() => setTab("bible")}
                    style={[phoneLayout && styles.homePhoneActionButton, homeDarkMode && styles.homeDarkResumeButton]}
                    labelStyle={homeDarkMode && styles.homeDarkResumeButtonText}
                  />
                </View>
              </View>

              <View style={styles.homeScriptureGrid}>
                <View style={[styles.homeScriptureBlock, homeDarkMode && styles.homeDarkScriptureBlock]}>
                  <View style={[styles.homeScriptureIcon, homeDarkMode && styles.homeDarkIconBubble]}>
                    <Ionicons name="heart-outline" size={20} color={homeDarkMode ? "#e9b76a" : colors.coral} />
                  </View>
                  <Text style={[styles.homeScriptureRef, homeDarkMode && styles.homeDarkAccentText]}>James 4:8</Text>
                  <Text style={[styles.homeScriptureQuote, homeDarkMode && styles.accountDarkTitle]}>“Draw near to God, and he will draw near to you.”</Text>
                  <Text style={[styles.homeScriptureNote, homeDarkMode && styles.accountDarkMutedText]}>The app starts with relationship, not tasks. Study becomes a way of coming near.</Text>
                </View>
                <View style={[styles.homeScriptureBlock, homeDarkMode && styles.homeDarkScriptureBlock]}>
                  <View style={[styles.homeScriptureIcon, homeDarkMode && styles.homeDarkIconBubble]}>
                    <Ionicons name="book-outline" size={20} color={homeDarkMode ? "#e9b76a" : colors.coral} />
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
                    <Ionicons name="gift-outline" size={15} color={homeDarkMode ? "#e9b76a" : colors.oliveDark} />
                    <Text style={[styles.homePurposePillText, homeDarkMode && styles.accountDarkTitle]}>Free to use</Text>
                  </View>
                  <View style={[styles.homePurposePill, homeDarkMode && styles.homeDarkPurposePill]}>
                    <Ionicons name="phone-portrait-outline" size={15} color={homeDarkMode ? "#e9b76a" : colors.oliveDark} />
                    <Text style={[styles.homePurposePillText, homeDarkMode && styles.accountDarkTitle]}>Mobile ready</Text>
                  </View>
                  <View style={[styles.homePurposePill, homeDarkMode && styles.homeDarkPurposePill]}>
                    <Ionicons name="desktop-outline" size={15} color={homeDarkMode ? "#e9b76a" : colors.oliveDark} />
                    <Text style={[styles.homePurposePillText, homeDarkMode && styles.accountDarkTitle]}>Desktop friendly</Text>
                  </View>
                  <View style={[styles.homePurposePill, homeDarkMode && styles.homeDarkPurposePill]}>
                    <Ionicons name="print-outline" size={15} color={homeDarkMode ? "#e9b76a" : colors.oliveDark} />
                    <Text style={[styles.homePurposePillText, homeDarkMode && styles.accountDarkTitle]}>Printable worksheets</Text>
                  </View>
                </View>
              </View>
            </Card>

            <View style={[styles.homeSideColumn, compactLayout && styles.fluidCard]}>
              <Card style={[styles.homeSideCard, homeDarkMode && styles.accountDarkMainCard]}>
                <Text style={[styles.homeSideTitle, homeDarkMode && styles.accountDarkTitle]}>Today’s path</Text>
                <Text style={[styles.titleSupport, homeDarkMode && styles.accountDarkMutedText]}>{`${friendlyName}, take the next small faithful step.`}</Text>
                <View style={styles.homePathList}>
                  {[
                    ["Read", "Open the Bible reader and choose a passage.", "reader-outline", "bible"],
                    ["Study", `Work through ${method.short} with notes and highlights.`, "book-outline", "study"],
                    ["Remember", dueMemoryCount > 0 ? `${dueMemoryCount} memory review${dueMemoryCount === 1 ? "" : "s"} due.` : "Save a verse worth carrying.", "sparkles-outline", "memory"],
                    ["Reflect", dueStudyReviewCount > 0 ? `${dueStudyReviewCount} study review${dueStudyReviewCount === 1 ? "" : "s"} ready.` : "Keep your journal connected to Scripture.", "journal-outline", "journal"],
                    ["Share", effectivePartner ? `Encourage ${effectivePartner}.` : "Bring one honest sentence to someone.", "people-outline", "accountability"]
                  ].map(([title, detail, icon, target]) => (
                    <Pressable key={title} onPress={() => setTab(target as Tab)} style={[styles.homePathItem, homeDarkMode && styles.homeDarkPathItem]}>
                      <View style={[styles.homePathIcon, homeDarkMode && styles.homeDarkIconBubble]}>
                        <Ionicons name={icon as any} size={17} color={homeDarkMode ? "#e9b76a" : colors.oliveDark} />
                      </View>
                      <View style={styles.homePathTextBlock}>
                        <Text style={[styles.homePathTitle, homeDarkMode && styles.accountDarkTitle]}>{title}</Text>
                        <Text style={[styles.homePathDetail, homeDarkMode && styles.accountDarkMutedText]}>{detail}</Text>
                      </View>
                      <Ionicons name="chevron-forward-outline" size={16} color={homeDarkMode ? "#c8bda9" : colors.muted} />
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
                  <ResumeButton label="Choose method" icon="layers-outline" onPress={() => setTab("methods")} style={homeDarkMode && styles.homeDarkResumeButton} labelStyle={homeDarkMode && styles.homeDarkResumeButtonText} iconColor={homeDarkMode ? "#e9b76a" : undefined} />
                  <ResumeButton label="Open plans" icon="calendar-outline" onPress={() => setTab("plans")} style={homeDarkMode && styles.homeDarkResumeButton} labelStyle={homeDarkMode && styles.homeDarkResumeButtonText} iconColor={homeDarkMode ? "#e9b76a" : undefined} />
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
                    <Pressable onPress={() => setStudyMethodPickerOpen((value) => !value)} style={[styles.compactMethodPicker, studyDarkMode && styles.studyDarkPillControl]}>
                      <Text style={[styles.compactMethodLabel, studyDarkMode && styles.studyDarkAccentText]}>Method</Text>
                      <Text style={[styles.compactMethodCurrent, studyDarkMode && styles.accountDarkTitle]}>{method.short}</Text>
                      <Ionicons name={studyMethodPickerOpen ? "chevron-up-outline" : "chevron-down-outline"} size={15} color={studyDarkMode ? "#e9b76a" : colors.oliveDark} />
                    </Pressable>
                  </View>
                  <Pressable onPress={() => {
                    const nextValue = !studyFocusMode;
                    setStudyFocusMode(nextValue);
                    saveStoredStudyFocusMode(nextValue).catch(() => undefined);
                  }} style={[styles.togglePill, styles.studyFocusHeaderToggle, phoneLayout && styles.phoneStudyFocusHeaderToggle, studyDarkMode && styles.studyDarkTogglePill, studyFocusMode && styles.activeTogglePill]}>
                    <Text style={[styles.toggleText, studyDarkMode && styles.accountDarkMutedText, studyFocusMode && styles.activeToggleText]}>{studyFocusMode ? "Focus on" : "Normal"}</Text>
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
                        value={passageQuery}
                        onChangeText={setPassageQuery}
                        onSubmitEditing={() => applyPassageQuery()}
                        placeholder="Try “Jn 3:16”, “Ps 23”, or “1 Thes 1:1”"
                        placeholderTextColor={studyDarkMode ? "#8f8678" : undefined}
                        style={[styles.smartPassageInput, studyDarkMode && styles.accountDarkText]}
                      />
                      <Pressable onPress={() => applyPassageQuery()} style={styles.useInlineButton}>
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
                          <FormattedNoteText text={item.answer} />
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
                title="Current plan"
                icon="calendar-outline"
                collapsed={collapsedStudyPanels.plan}
                onToggle={() => toggleStudyPanel("plan")}
                style={styles.studyPlansBox}
                darkMode={studyDarkMode}
              >
                <Text style={[styles.communityTitle, studyDarkMode && styles.accountDarkTitle]}>{selectedPlan.title}</Text>
                <Text style={[styles.helpIntro, studyDarkMode && styles.accountDarkMutedText]}>{selectedPlanComplete ? "Plan complete. Start another path when you are ready." : `Next: Day ${selectedPlanNextDay.day} · ${selectedPlanNextDay.passage}`}</Text>
                <Text style={[styles.planProgressText, studyDarkMode && styles.studyDarkAccentText]}>{selectedPlanCompletedCount} of {selectedPlan.days.length} complete</Text>
                <View style={styles.planActionRow}>
                  <ResumeButton label={selectedPlanComplete ? "Open plans" : "Continue"} icon={selectedPlanComplete ? "calendar-outline" : "play-outline"} onPress={() => selectedPlanComplete ? setTab("plans") : startPlanDay(selectedPlanNextDay)} style={studyDarkMode && styles.homeDarkResumeButton} labelStyle={studyDarkMode && styles.homeDarkResumeButtonText} iconColor={studyDarkMode ? "#e9b76a" : undefined} />
                  <ResumeButton label="All plans" icon="list-outline" onPress={() => setTab("plans")} style={studyDarkMode && styles.homeDarkResumeButton} labelStyle={studyDarkMode && styles.homeDarkResumeButtonText} iconColor={studyDarkMode ? "#e9b76a" : undefined} />
                </View>
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
          <View style={[styles.bibleReaderLayout, compactLayout && styles.stackedLayout, bibleDarkMode && styles.accountDarkLayout]}>
            <Card
              style={[
                styles.bibleReaderNavCard,
                readerNavCollapsed && styles.collapsedBibleReaderNavCard,
                compactLayout && styles.fluidCard,
                compactLayout && readerNavCollapsed && styles.compactCollapsedBibleReaderNavCard,
                bibleDarkMode && styles.accountDarkMainCard
              ]}
            >
              <Pressable
                onPress={() => toggleRememberedPanel(setReaderNavCollapsed, "bibleReaderNavCollapsed")}
                style={[styles.readerNavHeader, compactLayout && readerNavCollapsed && styles.compactCollapsedReaderNavHeader]}
              >
                {readerNavCollapsed ? (
                  <View style={[styles.collapsedReaderIconStack, compactLayout && styles.compactCollapsedReaderIconStack]}>
                    <View style={[styles.collapsedReaderIconButton, bibleDarkMode && styles.homeDarkIconBubble]}>
                      <Ionicons name="book-outline" size={19} color={bibleDarkMode ? "#e9b76a" : colors.oliveDark} />
                    </View>
                    <View style={[styles.collapsedReaderIconButton, bibleDarkMode && styles.homeDarkIconBubble, !bibleBookmarks.length && styles.inactiveCollapsedReaderIconButton]}>
                      <Ionicons name={bibleBookmarks.length ? "bookmark" : "bookmark-outline"} size={18} color={bibleBookmarks.length ? (bibleDarkMode ? "#e9b76a" : colors.coral) : (bibleDarkMode ? "#c8bda9" : colors.muted)} />
                    </View>
                    <View style={[styles.collapsedReaderIconButton, bibleDarkMode && styles.homeDarkIconBubble, !readBibleChapterCount && styles.inactiveCollapsedReaderIconButton]}>
                      <Ionicons name={readBibleChapterCount ? "checkmark-circle" : "checkmark-circle-outline"} size={18} color={readBibleChapterCount ? (bibleDarkMode ? "#e9b76a" : colors.oliveDark) : (bibleDarkMode ? "#c8bda9" : colors.muted)} />
                    </View>
                    <View style={[styles.collapsedReaderIconButton, bibleDarkMode && styles.homeDarkIconBubble]}>
                      <Ionicons name="chevron-forward-outline" size={18} color={bibleDarkMode ? "#c8bda9" : colors.muted} />
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={styles.readerNavTitleBlock}>
                      <Eyebrow>Read Scripture</Eyebrow>
                      <Text style={[styles.title, bibleDarkMode && styles.accountDarkTitle]}>Bible reader</Text>
                    </View>
                    <Ionicons name="chevron-back-outline" size={18} color={bibleDarkMode ? "#c8bda9" : colors.muted} />
                  </>
                )}
              </Pressable>
              {!readerNavCollapsed && (
                <>
                  <Text style={[styles.titleSupport, bibleDarkMode && styles.accountDarkMutedText]}>Navigate by book and chapter, then send any chapter into Study when you want to slow down.</Text>
                  <View style={[styles.translationRow, bibleDarkMode && styles.accountDarkSegmentedRow]}>
                    {BIBLE_TRANSLATIONS.map((translation) => (
                      <Pressable
                        key={translation.id}
                        onPress={() => {
                          setBibleTranslation(translation.id);
                          saveStoredBibleTranslation(translation.id).catch(() => undefined);
                        }}
                        style={[styles.translationOption, bibleTranslation === translation.id && styles.activeTranslationOption]}
                      >
                        <Text style={[styles.translationOptionText, bibleDarkMode && styles.accountDarkMutedText, bibleTranslation === translation.id && styles.activeTranslationOptionText]}>
                          {translation.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {!phoneLayout && (
                    <TextInput
                      value={readerBookSearch}
                      onChangeText={setReaderBookSearch}
                      placeholder="Find a book"
                      placeholderTextColor={bibleDarkMode ? "#8f8678" : undefined}
                      style={[styles.input, bibleDarkMode && styles.accountDarkInput]}
                    />
                  )}
                  {bibleReaderHistory.length > 1 && (
                    <View style={[styles.readerHistorySection, bibleDarkMode && styles.bibleDarkDividerSection]}>
                      <Pressable onPress={() => toggleRememberedPanel(setReaderHistoryCollapsed, "bibleReaderHistoryCollapsed")} style={[styles.readerBookmarkHeader, bibleDarkMode && styles.accountDarkInsetBox]}>
                        <View style={styles.readerBookmarkHeaderTitle}>
                          <Ionicons name="time-outline" size={15} color={colors.coral} />
                          <Text style={[styles.readerBookSectionTitle, bibleDarkMode && styles.studyDarkAccentText]}>Recent</Text>
                        </View>
                        <View style={styles.readerBookmarkHeaderMeta}>
                          <Text style={[styles.readerBookmarkCount, bibleDarkMode && styles.accountDarkMutedText]}>{bibleReaderHistory.length - 1}</Text>
                          <Ionicons name={readerHistoryCollapsed ? "chevron-down-outline" : "chevron-up-outline"} size={15} color={bibleDarkMode ? "#c8bda9" : colors.muted} />
                        </View>
                      </Pressable>
                      {!readerHistoryCollapsed && (
                        <>
                          <View style={styles.readerHistoryActions}>
                            <Pressable onPress={clearBibleReaderHistory} style={styles.readerHistoryClearButton}>
                              <Text style={styles.readerProgressClearText}>Clear</Text>
                            </Pressable>
                          </View>
                          <View style={styles.readerHistoryList}>
                            {bibleReaderHistory.slice(1, phoneLayout ? 5 : 7).map((item) => (
                              <Pressable
                                key={`${item.book}-${item.chapter}-${item.translation}`}
                                onPress={() => openBibleReaderHistoryItem(item)}
                                style={[styles.readerHistoryChip, bibleDarkMode && styles.accountDarkInsetBox]}
                              >
                                <Ionicons name="reader-outline" size={13} color={bibleDarkMode ? "#e9b76a" : colors.oliveDark} />
                                <Text numberOfLines={1} style={[styles.readerHistoryText, bibleDarkMode && styles.accountDarkTitle]}>{item.reference}</Text>
                                <Text style={[styles.readerHistoryTranslation, bibleDarkMode && styles.accountDarkMutedText]}>{item.translation.toUpperCase()}</Text>
                              </Pressable>
                            ))}
                          </View>
                        </>
                      )}
                    </View>
                  )}
                  {bibleBookmarks.length > 0 && (
                    <View style={[styles.readerBookmarkSection, bibleDarkMode && styles.bibleDarkDividerSection]}>
                      <Pressable
                        onPress={() => {
                          setBookmarksCollapsed((value) => {
                            if (!value) setBookmarksExpanded(false);
                            const next = !value;
                            persistUiPreference("bibleBookmarksCollapsed", next);
                            return next;
                          });
                        }}
                        style={[styles.readerBookmarkHeader, bibleDarkMode && styles.accountDarkInsetBox]}
                      >
                        <View style={styles.readerBookmarkHeaderTitle}>
                          <Ionicons name="bookmark-outline" size={15} color={colors.coral} />
                          <Text style={[styles.readerBookSectionTitle, bibleDarkMode && styles.studyDarkAccentText]}>Bookmarks & notes</Text>
                        </View>
                        <View style={styles.readerBookmarkHeaderMeta}>
                          <Text style={[styles.readerBookmarkCount, bibleDarkMode && styles.accountDarkMutedText]}>{bibleBookmarks.length}</Text>
                          <Ionicons name={bookmarksCollapsed ? "chevron-down-outline" : "chevron-up-outline"} size={15} color={bibleDarkMode ? "#c8bda9" : colors.muted} />
                        </View>
                      </Pressable>
                      {!bookmarksCollapsed && (
                        <>
                          <TextInput
                            value={bookmarkSearch}
                            onChangeText={setBookmarkSearch}
                            placeholder="Search bookmarks or notes"
                            placeholderTextColor={bibleDarkMode ? "#8f8678" : undefined}
                            style={[styles.input, styles.readerBookmarkSearchInput, bibleDarkMode && styles.accountDarkInput]}
                          />
                          <Pressable
                            onPress={() => setBookmarkNotesOnly((value) => !value)}
                            style={[styles.readerBookmarkFilterChip, bibleDarkMode && styles.homeDarkResumeButton, bookmarkNotesOnly && styles.activeReaderBookChip]}
                          >
                            <Ionicons name={bookmarkNotesOnly ? "document-text" : "document-text-outline"} size={14} color={bookmarkNotesOnly ? "white" : (bibleDarkMode ? "#e9b76a" : colors.oliveDark)} />
                            <Text style={[styles.readerBookmarkFilterText, bibleDarkMode && styles.homeDarkResumeButtonText, bookmarkNotesOnly && styles.activeReaderBookText]}>With notes</Text>
                          </Pressable>
                          {visibleBibleBookmarks.map((bookmark) => (
                            <View key={bookmark.id} style={styles.readerBookmarkItem}>
                              <View style={styles.readerBookmarkRow}>
                                <Pressable onPress={() => openBibleBookmark(bookmark)} style={[styles.readerBookmarkOpen, bibleDarkMode && styles.accountDarkInsetBox]}>
                                  <Ionicons name={bookmark.bookmarked === false ? "document-text-outline" : "bookmark-outline"} size={14} color={bookmark.bookmarked === false ? (bibleDarkMode ? "#e9b76a" : colors.oliveDark) : (bibleDarkMode ? "#e9b76a" : colors.coral)} />
                                  <Text style={[styles.readerBookmarkText, bibleDarkMode && styles.accountDarkTitle]}>{bookmark.reference}</Text>
                                </Pressable>
                                <Pressable onPress={() => openBookmarkNote(bookmark)} style={[styles.readerBookmarkIconButton, bibleDarkMode && styles.homeDarkIconBubble, bookmark.note?.trim() && styles.activeBookmarkNoteButton]}>
                                  <Ionicons name={bookmark.note?.trim() ? "document-text" : "document-text-outline"} size={15} color={bookmark.note?.trim() ? "white" : (bibleDarkMode ? "#e9b76a" : colors.oliveDark)} />
                                </Pressable>
                                <Pressable onPress={() => removeBibleBookmark(bookmark.id)} style={styles.readerBookmarkRemove}>
                                  <Ionicons name="close-outline" size={15} color={colors.muted} />
                                </Pressable>
                              </View>
                              {activeBookmarkNoteId === bookmark.id && (
                                <View style={styles.readerBookmarkNoteEditor}>
                                  <TextInput
                                    value={bookmarkNoteDraft}
                                    onChangeText={setBookmarkNoteDraft}
                                    placeholder="Add a note"
                                    multiline
                                    placeholderTextColor={bibleDarkMode ? "#8f8678" : undefined}
                                    style={[styles.input, styles.readerBookmarkNoteInput, phoneLayout && styles.mobileReaderBookmarkNoteInput, bibleDarkMode && styles.accountDarkInput]}
                                  />
                                  <View style={styles.readerBookmarkNoteActions}>
                                    <Pressable onPress={() => saveBookmarkNote(bookmark.id)} style={[styles.inlineReaderBookmarkButton, bibleDarkMode && styles.homeDarkResumeButton]}>
                                      <Text style={[styles.inlineReaderBookmarkText, bibleDarkMode && styles.homeDarkResumeButtonText]}>Save note</Text>
                                    </Pressable>
                                    {!!bookmark.note?.trim() && (
                                      <Pressable onPress={() => deleteBookmarkNote(bookmark.id)} style={[styles.clearMarkupButton, bibleDarkMode && styles.homeDarkResumeButton]}>
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
                                      <Text style={[styles.clearMarkupText, bibleDarkMode && styles.homeDarkResumeButtonText]}>Cancel</Text>
                                    </Pressable>
                                  </View>
                                </View>
                              )}
                            </View>
                          ))}
                          {filteredBibleBookmarks.length > 3 && (
                            <Pressable onPress={() => setBookmarksExpanded((value) => !value)} style={styles.readerBookmarkExpandButton}>
                              <Text style={[styles.readerBookmarkExpandText, bibleDarkMode && styles.studyDarkAccentText]}>
                                {bookmarksExpanded ? "Show latest 3" : `Show all ${filteredBibleBookmarks.length}`}
                              </Text>
                              <Ionicons name={bookmarksExpanded ? "chevron-up-outline" : "chevron-down-outline"} size={14} color={bibleDarkMode ? "#e9b76a" : colors.oliveDark} />
                            </Pressable>
                          )}
                          {!visibleBibleBookmarks.length && <Text style={[styles.muted, bibleDarkMode && styles.accountDarkMutedText]}>No matching bookmarks.</Text>}
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
                        <View key={section.id} style={styles.mobileReaderDropdown}>
                          <Pressable
                            onPress={() => setReaderMobileMenu((current) => current === section.id ? null : section.id)}
                            style={[styles.mobileReaderDropdownButton, bibleDarkMode && styles.accountDarkInsetBox]}
                          >
                            <Text style={[styles.mobileReaderDropdownText, bibleDarkMode && styles.accountDarkTitle]}>{section.title}</Text>
                            <Ionicons name={readerMobileMenu === section.id ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={bibleDarkMode ? "#c8bda9" : colors.muted} />
                          </Pressable>
                          {readerMobileMenu === section.id && (
                            <>
                              <View style={styles.mobileReaderBookList}>
                                {section.books.map((book) => (
                                  <View key={book} style={[styles.mobileReaderBookBlock, expandedMobileReaderBook === book && styles.expandedMobileReaderBookBlock]}>
                                    <Pressable
                                      onPress={() => selectMobileReaderBook(book)}
                                      style={[styles.mobileReaderBookOption, bibleDarkMode && styles.printDarkOptionChip, readerBook === book && styles.activeMobileReaderBookOption]}
                                    >
                                      <Text style={[styles.mobileReaderBookText, bibleDarkMode && styles.accountDarkMutedText, readerBook === book && styles.activeMobileReaderBookText]}>{book}</Text>
                                    </Pressable>
                                    {expandedMobileReaderBook === book && (
                                      <View style={[styles.mobileReaderChapterPanel, bibleDarkMode && styles.accountDarkSection]}>
                                        <Text style={[styles.readerBookSectionTitle, bibleDarkMode && styles.studyDarkAccentText]}>{book}</Text>
                                        <View style={styles.mobileReaderChapterGrid}>
                                          {Array.from({ length: BIBLE_CHAPTER_COUNTS[book] || 1 }, (_, index) => index + 1).map((chapter) => (
                                            <Pressable
                                              key={chapter}
                                              onPress={() => selectReaderChapter(chapter, book)}
                                              style={[styles.mobileReaderChapterSquare, bibleDarkMode && styles.printDarkOptionChip, readerBook === book && readerChapter === chapter && styles.activeMobileReaderChapterSquare]}
                                            >
                                              <Text style={[styles.mobileReaderChapterText, bibleDarkMode && styles.accountDarkMutedText, readerBook === book && readerChapter === chapter && styles.activeMobileReaderChapterText]}>{chapter}</Text>
                                            </Pressable>
                                          ))}
                                        </View>
                                      </View>
                                    )}
                                  </View>
                                ))}
                              </View>
                            </>
                          )}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.readerBookSections}>
                      {readerBookSections.map((section) => (
                        <View key={section.title} style={styles.readerBookSection}>
                          <Text style={[styles.readerBookSectionTitle, bibleDarkMode && styles.studyDarkAccentText]}>{section.title}</Text>
                          <View style={styles.desktopReaderBookList}>
                            {section.books.map((book) => (
                              <View key={book} style={[styles.desktopReaderBookBlock, expandedMobileReaderBook === book && styles.expandedDesktopReaderBookBlock]}>
                                <Pressable
                                  onPress={() => selectReaderBook(book)}
                                  style={[styles.readerBookChip, bibleDarkMode && styles.printDarkOptionChip, readerBook === book && styles.activeReaderBookChip]}
                                >
                                  <Text style={[styles.readerBookText, bibleDarkMode && styles.accountDarkMutedText, readerBook === book && styles.activeReaderBookText]}>{book}</Text>
                                </Pressable>
                                {expandedMobileReaderBook === book && (
                                  <View style={[styles.desktopReaderChapterPanel, bibleDarkMode && styles.accountDarkSection]}>
                                    <View style={styles.desktopReaderChapterHeader}>
                                      <Text style={[styles.readerBookSectionTitle, bibleDarkMode && styles.studyDarkAccentText]}>{book}</Text>
                                      <Text style={[styles.readerChapterCountText, bibleDarkMode && styles.accountDarkMutedText]}>{BIBLE_CHAPTER_COUNTS[book] || 1} chapters</Text>
                                    </View>
                                    <View style={styles.desktopReaderChapterGrid}>
                                      {Array.from({ length: BIBLE_CHAPTER_COUNTS[book] || 1 }, (_, index) => index + 1).map((chapter) => (
                                        <Pressable
                                          key={chapter}
                                          onPress={() => selectReaderChapter(chapter, book)}
                                          style={[styles.mobileReaderChapterSquare, bibleDarkMode && styles.printDarkOptionChip, readerBook === book && readerChapter === chapter && styles.activeMobileReaderChapterSquare]}
                                        >
                                          <Text style={[styles.mobileReaderChapterText, bibleDarkMode && styles.accountDarkMutedText, readerBook === book && readerChapter === chapter && styles.activeMobileReaderChapterText]}>{chapter}</Text>
                                        </Pressable>
                                      ))}
                                    </View>
                                  </View>
                                )}
                              </View>
                            ))}
                          </View>
                        </View>
                      ))}
                      {!readerBookSections.length && <Text style={[styles.muted, bibleDarkMode && styles.accountDarkMutedText]}>No matching books found.</Text>}
                    </View>
                  )}
                </>
              )}
            </Card>

            <Card style={[styles.bibleReaderContentCard, compactLayout && styles.fluidCard, bibleDarkMode && styles.accountDarkMainCard]}>
              <View style={[styles.bibleSearchPanel, bibleDarkMode && styles.accountDarkSection]}>
                <Pressable onPress={() => toggleRememberedPanel(setBibleSearchCollapsed, "bibleSearchCollapsed")} style={styles.bibleSearchHeader}>
                  <View style={styles.feedbackHeader}>
                    <Ionicons name="search-outline" size={18} color={bibleDarkMode ? "#e9b76a" : colors.coral} />
                    <Text style={[styles.feedbackTitle, bibleDarkMode && styles.studyDarkAccentText]}>Search Scripture</Text>
                  </View>
                  <View style={styles.bibleSearchHeaderMeta}>
                    <Text style={[styles.bibleSearchTranslationText, bibleDarkMode && styles.accountDarkMutedText]}>{bibleSearchTranslation}</Text>
                    <Ionicons name={bibleSearchCollapsed ? "chevron-down-outline" : "chevron-up-outline"} size={16} color={bibleDarkMode ? "#c8bda9" : colors.muted} />
                  </View>
                </Pressable>
                {!bibleSearchCollapsed && (
                  <>
                    <Text style={[styles.helpIntro, bibleDarkMode && styles.accountDarkMutedText]}>Choose how closely Scripture should match your search. Exact word is best when you remember a specific word.</Text>
                    <View style={[styles.bibleSearchInputRow, phoneLayout && styles.phoneBibleSearchInputRow]}>
                      <TextInput
                        value={bibleSearchQuery}
                        onChangeText={setBibleSearchQuery}
                        onSubmitEditing={runBibleSearch}
                        placeholder="Try “draw near”, “anxiety”, or “what does Scripture teach?”"
                        placeholderTextColor={bibleDarkMode ? "#8f8678" : undefined}
                        style={[styles.input, styles.bibleSearchInput, phoneLayout && styles.phoneBibleSearchInput, bibleDarkMode && styles.accountDarkInput]}
                      />
                      <AppButton label="Search" onPress={runBibleSearch} style={phoneLayout && styles.phoneBibleSearchButton} />
                      <Pressable
                        accessibilityRole="button"
                        onPress={clearBibleSearch}
                        style={[styles.bibleSearchClearButton, phoneLayout && styles.phoneBibleSearchButton, bibleDarkMode && styles.homeDarkResumeButton]}
                      >
                        <Ionicons name="close-circle-outline" size={16} color={bibleDarkMode ? "#e9b76a" : colors.oliveDark} />
                        <Text style={[styles.bibleSearchClearText, bibleDarkMode && styles.homeDarkResumeButtonText]}>Clear</Text>
                      </Pressable>
                    </View>
                    {phoneLayout ? (
                      <View style={[styles.mobileBibleCriteriaDropdown, bibleDarkMode && styles.accountDarkInsetBox]}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setBibleSearchCriteriaOpen((value) => !value)}
                          style={styles.mobileBibleCriteriaHeader}
                        >
                          <View style={styles.mobileBibleCriteriaCopy}>
                            <Text style={[styles.mobileBibleCriteriaTitle, bibleDarkMode && styles.accountDarkTitle]}>Search criteria</Text>
                            <Text numberOfLines={1} style={[styles.mobileBibleCriteriaSummary, bibleDarkMode && styles.accountDarkMutedText]}>
                              {`${bibleSearchScope === "old" ? "Old Testament" : bibleSearchScope === "new" ? "New Testament" : "All"} · ${bibleSearchModeLabel(bibleSearchMode)} · ${bibleSearchBook || "Any book"}`}
                            </Text>
                          </View>
                          <Ionicons name={bibleSearchCriteriaOpen ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={bibleDarkMode ? "#c8bda9" : colors.muted} />
                        </Pressable>
                        {bibleSearchCriteriaOpen && (
                          <View style={styles.mobileBibleCriteriaPanel}>
                            <View style={styles.mobileBibleCriteriaGroup}>
                              <Text style={[styles.mobileBibleCriteriaLabel, bibleDarkMode && styles.accountDarkMutedText]}>Where to search</Text>
                              <View style={styles.mobileBibleCriteriaChipRow}>
                                {[
                                  ["all", "All"],
                                  ["old", "Old Testament"],
                                  ["new", "New Testament"]
                                ].map(([scope, label]) => (
                                  <Pressable
                                    key={scope}
                                    onPress={() => setBibleSearchScope(scope as BibleSearchScope)}
                                    style={[styles.bibleSearchChip, styles.phoneBibleSearchChip, bibleDarkMode && styles.printDarkOptionChip, bibleSearchScope === scope && styles.activeBibleSearchChip]}
                                  >
                                    <Text style={[styles.bibleSearchChipText, bibleDarkMode && styles.accountDarkMutedText, bibleSearchScope === scope && styles.activeBibleSearchChipText]}>{label}</Text>
                                  </Pressable>
                                ))}
                              </View>
                            </View>
                            <View style={styles.mobileBibleCriteriaGroup}>
                              <Text style={[styles.mobileBibleCriteriaLabel, bibleDarkMode && styles.accountDarkMutedText]}>Match type</Text>
                              <View style={styles.mobileBibleCriteriaChipRow}>
                                {([
                                  ["word", "Word"],
                                  ["phrase", "Phrase"],
                                  ["allWords", "All words"],
                                  ["anyWords", "Any words"],
                                  ["theme", "Theme"]
                                ] as [BibleSearchMode, string][]).map(([mode, label]) => (
                                  <Pressable
                                    key={mode}
                                    onPress={() => setBibleSearchMode(mode)}
                                    style={[styles.bibleSearchChip, styles.phoneBibleSearchChip, bibleDarkMode && styles.printDarkOptionChip, bibleSearchMode === mode && styles.activeBibleSearchChip]}
                                  >
                                    <Text style={[styles.bibleSearchChipText, bibleDarkMode && styles.accountDarkMutedText, bibleSearchMode === mode && styles.activeBibleSearchChipText]}>{label}</Text>
                                  </Pressable>
                                ))}
                              </View>
                            </View>
                            <View style={styles.mobileBibleCriteriaGroup}>
                              <Text style={[styles.mobileBibleCriteriaLabel, bibleDarkMode && styles.accountDarkMutedText]}>Book</Text>
                              {Platform.OS === "web" ? (
                                <select
                                  aria-label="Book filter"
                                  value={bibleSearchBook}
                                  onChange={(event) => setBibleSearchBook(event.currentTarget.value)}
                                  style={StyleSheet.flatten([styles.bibleSearchSelect, styles.phoneBibleSearchSelect, bibleDarkMode && styles.bibleDarkSearchSelect]) as any}
                                >
                                  <option value="">Any book</option>
                                  {bibleSearchBookOptions.map((book) => (
                                    <option key={book} value={book}>{book}</option>
                                  ))}
                                </select>
                              ) : (
                                <>
                                  <Pressable onPress={() => setBibleSearchBookMenuOpen((value) => !value)} style={[styles.bibleSearchSelectButton, styles.phoneBibleSearchSelectButton, bibleDarkMode && styles.printDarkOptionChip]}>
                                    <Text numberOfLines={1} style={[styles.bibleSearchSelectText, bibleDarkMode && styles.accountDarkText]}>{bibleSearchBook || "Any book"}</Text>
                                    <Ionicons name={bibleSearchBookMenuOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={bibleDarkMode ? "#c8bda9" : colors.muted} />
                                  </Pressable>
                                  {bibleSearchBookMenuOpen && (
                                    <View style={[styles.bibleSearchSelectMenu, bibleDarkMode && styles.accountDarkSection]}>
                                      <Pressable
                                        onPress={() => {
                                          setBibleSearchBook("");
                                          setBibleSearchBookMenuOpen(false);
                                        }}
                                        style={styles.bibleSearchSelectOption}
                                      >
                                        <Text style={[styles.bibleSearchSelectOptionText, bibleDarkMode && styles.accountDarkText]}>Any book</Text>
                                      </Pressable>
                                      {bibleSearchBookOptions.map((book) => (
                                        <Pressable
                                          key={book}
                                          onPress={() => {
                                            setBibleSearchBook(book);
                                            setBibleSearchBookMenuOpen(false);
                                          }}
                                          style={[styles.bibleSearchSelectOption, bibleSearchBook === book && styles.activeBibleSearchSelectOption]}
                                        >
                                          <Text style={[styles.bibleSearchSelectOptionText, bibleDarkMode && styles.accountDarkText, bibleSearchBook === book && styles.activeBibleSearchChipText]}>{book}</Text>
                                        </Pressable>
                                      ))}
                                    </View>
                                  )}
                                </>
                              )}
                            </View>
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={styles.bibleSearchControls}>
                        {[
                          ["all", "All"],
                          ["old", "Old Testament"],
                          ["new", "New Testament"]
                        ].map(([scope, label]) => (
                          <Pressable
                            key={scope}
                            onPress={() => setBibleSearchScope(scope as BibleSearchScope)}
                            style={[styles.bibleSearchChip, bibleDarkMode && styles.printDarkOptionChip, bibleSearchScope === scope && styles.activeBibleSearchChip]}
                          >
                            <Text style={[styles.bibleSearchChipText, bibleDarkMode && styles.accountDarkMutedText, bibleSearchScope === scope && styles.activeBibleSearchChipText]}>{label}</Text>
                          </Pressable>
                        ))}
                        <View style={styles.bibleSearchRefineRow}>
                          <View style={styles.bibleSearchModeGroup}>
                            {([
                              ["word", "Word"],
                              ["phrase", "Phrase"],
                              ["allWords", "All words"],
                              ["anyWords", "Any words"],
                              ["theme", "Theme"]
                            ] as [BibleSearchMode, string][]).map(([mode, label]) => (
                              <Pressable
                                key={mode}
                                onPress={() => setBibleSearchMode(mode)}
                                style={[styles.bibleSearchChip, styles.bibleSearchExactChip, bibleDarkMode && styles.printDarkOptionChip, bibleSearchMode === mode && styles.activeBibleSearchChip]}
                              >
                                <Text style={[styles.bibleSearchChipText, bibleDarkMode && styles.accountDarkMutedText, bibleSearchMode === mode && styles.activeBibleSearchChipText]}>{label}</Text>
                              </Pressable>
                            ))}
                          </View>
                          <View style={styles.bibleSearchBookFilter}>
                            {Platform.OS === "web" ? (
                              <select
                                aria-label="Book filter"
                                value={bibleSearchBook}
                                onChange={(event) => setBibleSearchBook(event.currentTarget.value)}
                                style={StyleSheet.flatten([styles.bibleSearchSelect, bibleDarkMode && styles.bibleDarkSearchSelect]) as any}
                              >
                                <option value="">Any book</option>
                                {bibleSearchBookOptions.map((book) => (
                                  <option key={book} value={book}>{book}</option>
                                ))}
                              </select>
                            ) : (
                              <>
                                <Pressable onPress={() => setBibleSearchBookMenuOpen((value) => !value)} style={[styles.bibleSearchSelectButton, bibleDarkMode && styles.printDarkOptionChip]}>
                                  <Text numberOfLines={1} style={[styles.bibleSearchSelectText, bibleDarkMode && styles.accountDarkText]}>{bibleSearchBook || "Any book"}</Text>
                                  <Ionicons name={bibleSearchBookMenuOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={bibleDarkMode ? "#c8bda9" : colors.muted} />
                                </Pressable>
                                {bibleSearchBookMenuOpen && (
                                  <View style={[styles.bibleSearchSelectMenu, bibleDarkMode && styles.accountDarkSection]}>
                                    <Pressable
                                      onPress={() => {
                                        setBibleSearchBook("");
                                        setBibleSearchBookMenuOpen(false);
                                      }}
                                      style={styles.bibleSearchSelectOption}
                                    >
                                      <Text style={[styles.bibleSearchSelectOptionText, bibleDarkMode && styles.accountDarkText]}>Any book</Text>
                                    </Pressable>
                                    {bibleSearchBookOptions.map((book) => (
                                      <Pressable
                                        key={book}
                                        onPress={() => {
                                          setBibleSearchBook(book);
                                          setBibleSearchBookMenuOpen(false);
                                        }}
                                        style={[styles.bibleSearchSelectOption, bibleSearchBook === book && styles.activeBibleSearchSelectOption]}
                                      >
                                        <Text style={[styles.bibleSearchSelectOptionText, bibleDarkMode && styles.accountDarkText, bibleSearchBook === book && styles.activeBibleSearchChipText]}>{book}</Text>
                                      </Pressable>
                                    ))}
                                  </View>
                                )}
                              </>
                            )}
                          </View>
                        </View>
                      </View>
                    )}
                  </>
                )}
                {!bibleSearchCollapsed && (!!bibleSearchStatus || !!bibleSearchDuration || !!bibleSearchActiveQuery) && (
                  <View
                    onLayout={(event) => {
                      bibleSearchSummaryYRef.current = event.nativeEvent.layout.y;
                    }}
                    style={[styles.bibleSearchSummaryBlock, bibleDarkMode && styles.accountDarkInsetBox]}
                  >
                    {!!bibleSearchStatus && <Text style={[styles.bibleSearchStatusText, bibleDarkMode && styles.studyDarkAccentText]}>{bibleSearchStatus}</Text>}
                    {!!bibleSearchDuration && <Text style={[styles.bibleSearchDurationText, bibleDarkMode && styles.accountDarkText]}>{bibleSearchDuration}</Text>}
                    {!!bibleSearchActiveQuery && (
                      <Text style={[styles.bibleSearchFootnote, bibleDarkMode && styles.accountDarkMutedText]}>
                        {bibleTranslation === "bsb"
                          ? "Search is using BSB text. Word mode only matches whole words."
                          : "Word mode only matches whole words. Use Theme when you want broader ideas."}
                      </Text>
                    )}
                  </View>
                )}
                {!bibleSearchCollapsed && bibleSearchSections.map((section) => (
                  <View key={section.title} style={styles.bibleSearchResultSection}>
                    <View style={styles.bibleSearchSectionHeader}>
                      <Text style={[styles.readerBookSectionTitle, bibleDarkMode && styles.studyDarkAccentText]}>{section.title}</Text>
                      <Text style={[styles.bibleSearchSectionCount, bibleDarkMode && styles.homeDarkResumeButtonText]}>{section.results.length}</Text>
                    </View>
                    {section.results.map((result) => (
                      <View key={result.id} style={[styles.bibleSearchResultCard, bibleDarkMode && styles.accountDarkInsetBox]}>
                        <View style={styles.bibleSearchResultHeader}>
                          <Text style={[styles.bibleSearchResultReference, bibleDarkMode && styles.accountDarkTitle]}>{`${result.book} ${result.chapter}:${result.verse}`}</Text>
                          <Text style={[styles.bibleSearchSourceQuery, bibleDarkMode && styles.accountDarkMutedText]}>{result.sourceQuery}</Text>
                        </View>
                        <Text style={[styles.bibleSearchResultText, bibleDarkMode && styles.accountDarkText]}>{result.text}</Text>
                        <View style={styles.bibleSearchResultActions}>
                          <ResumeButton label="Read" icon="reader-outline" onPress={() => openBibleSearchResult(result)} style={bibleDarkMode && styles.homeDarkResumeButton} labelStyle={bibleDarkMode && styles.homeDarkResumeButtonText} iconColor={bibleDarkMode ? "#e9b76a" : undefined} />
                          <ResumeButton label="Study" icon="book-outline" onPress={() => studyBibleSearchResult(result)} style={bibleDarkMode && styles.homeDarkResumeButton} labelStyle={bibleDarkMode && styles.homeDarkResumeButtonText} iconColor={bibleDarkMode ? "#e9b76a" : undefined} />
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </View>

              <View style={styles.readerHeader}>
                <View>
                  <Eyebrow>{bibleTranslation.toUpperCase()}</Eyebrow>
                  <View style={styles.readerTitleRow}>
                    <Text style={[styles.stepTitle, bibleDarkMode && styles.accountDarkTitle]}>{readerStudyReference}</Text>
                    {currentChapterBookmarked && <Ionicons name="bookmark" size={17} color={colors.coral} />}
                  </View>
                </View>
                <AppButton label={selectedReaderVerses.length ? "Study selected" : "Study this"} variant="secondary" onPress={openReaderChapterInStudy} style={bibleDarkMode && styles.homeDarkResumeButton} labelStyle={bibleDarkMode && styles.homeDarkResumeButtonText} />
              </View>
              {selectedReaderVerses.length > 0 && (
                <View style={[styles.readerSelectionBar, bibleDarkMode && styles.accountDarkSection]}>
                  <Text style={[styles.readerSelectionText, bibleDarkMode && styles.accountDarkTitle]}>{`${selectedReaderVerses.length} verse${selectedReaderVerses.length === 1 ? "" : "s"} selected`}</Text>
                  <Pressable
                    onPress={clearReaderSelection}
                    style={[styles.clearMarkupButton, bibleDarkMode && styles.homeDarkResumeButton]}
                  >
                    <Text style={[styles.clearMarkupText, bibleDarkMode && styles.homeDarkResumeButtonText]}>Clear</Text>
                  </Pressable>
                </View>
              )}
              <View style={[styles.readerNavigationRow, phoneLayout && styles.phoneReaderNavigationRow]}>
                <Pressable accessibilityRole="button" {...readerIconHoverProps("Previous chapter")} onPress={() => { hideReaderTooltip(); moveReaderChapter(-1); }} style={[styles.readerNavIconButton, phoneLayout && styles.phoneReaderNavIconButton, bibleDarkMode && styles.homeDarkIconBubble]}>
                  <Ionicons name="chevron-back-outline" size={18} color={bibleDarkMode ? "#e9b76a" : colors.oliveDark} />
                </Pressable>
                <View style={[styles.readerChapterControl, phoneLayout && styles.phoneReaderChapterControl, bibleDarkMode && styles.accountDarkInsetBox]}>
                  <Text numberOfLines={1} style={[styles.readerChapterLabel, phoneLayout && styles.phoneReaderChapterLabel, bibleDarkMode && styles.accountDarkMutedText]}>
                    {phoneLayout ? "Ch" : "Ch."}
                  </Text>
                  <TextInput
                    value={readerChapterDraft}
                    onChangeText={setReaderChapterDraft}
                    onBlur={() => commitReaderChapter()}
                    onSubmitEditing={() => commitReaderChapter()}
                    keyboardType="number-pad"
                    selectTextOnFocus
                    style={[styles.readerChapterInput, phoneLayout && styles.phoneReaderChapterInput, bibleDarkMode && styles.accountDarkInput]}
                  />
                  <Text numberOfLines={1} style={[styles.readerChapterCountText, phoneLayout && styles.phoneReaderChapterCountText, bibleDarkMode && styles.accountDarkMutedText]}>
                    {phoneLayout ? `/ ${readerChapterCount}` : `of ${readerChapterCount}`}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  {...readerIconHoverProps(currentChapterRead ? "Chapter read" : "Mark chapter read")}
                  onPress={() => {
                    hideReaderTooltip();
                    toggleReaderChapterRead();
                  }}
                  style={[styles.readerNavIconButton, phoneLayout && styles.phoneReaderNavIconButton, bibleDarkMode && styles.homeDarkIconBubble, currentChapterRead && styles.activeReaderReadButton]}
                >
                  <Ionicons name={currentChapterRead ? "checkmark-circle" : "checkmark-circle-outline"} size={18} color={currentChapterRead ? "white" : (bibleDarkMode ? "#e9b76a" : colors.oliveDark)} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  {...readerIconHoverProps(currentChapterBookmarked ? "Chapter bookmarked" : "Bookmark chapter")}
                  onPress={() => {
                    hideReaderTooltip();
                    saveBibleBookmark();
                  }}
                  style={[styles.readerNavIconButton, phoneLayout && styles.phoneReaderNavIconButton, bibleDarkMode && styles.homeDarkIconBubble, currentChapterBookmarked && styles.activeReaderBookmarkButton]}
                >
                  <Ionicons name={currentChapterBookmarked ? "bookmark" : "bookmark-outline"} size={18} color={currentChapterBookmarked ? "white" : (bibleDarkMode ? "#e9b76a" : colors.oliveDark)} />
                </Pressable>
                <Pressable accessibilityRole="button" {...readerIconHoverProps("Next chapter")} onPress={() => { hideReaderTooltip(); moveReaderChapter(1); }} style={[styles.readerNavIconButton, phoneLayout && styles.phoneReaderNavIconButton, bibleDarkMode && styles.homeDarkIconBubble]}>
                  <Ionicons name="chevron-forward-outline" size={18} color={bibleDarkMode ? "#e9b76a" : colors.oliveDark} />
                </Pressable>
              </View>
              {Platform.OS === "web" && !!readerIconTooltip && <Text style={styles.readerIconTooltip}>{readerIconTooltip}</Text>}
              <View style={styles.readerProgressRow}>
                <Text style={[styles.readerProgressText, bibleDarkMode && styles.accountDarkMutedText]}>{`${readBibleChapterCount} chapter${readBibleChapterCount === 1 ? "" : "s"} read`}</Text>
                {readBibleChapterCount > 0 && (
                  <Pressable onPress={clearBibleReadingProgress} style={styles.readerProgressClearButton}>
                    <Text style={styles.readerProgressClearText}>Clear all</Text>
                  </Pressable>
                )}
              </View>
              {readerPassage?.verses?.length ? (
                <View
                  onLayout={(event) => {
                    readerPassageBoxYRef.current = event.nativeEvent.layout.y;
                  }}
                  style={[styles.readerPassageBox, phoneLayout && styles.phoneReaderPassageBox, phoneLayout && selectedReaderVerses.length > 0 && styles.phoneReaderPassageWithSelectionDock, bibleDarkMode && styles.accountDarkInsetBox]}
                >
                  {readerPassage.verses.map((verse) => (
                    <View
                      key={`${verse.chapter}-${verse.verse}`}
                      onLayout={(event) => {
                        readerVerseYRef.current[verse.verse] = event.nativeEvent.layout.y;
                        if (pendingReaderFocusVerse === verse.verse) {
                          setPendingReaderFocusVerse(0);
                          scrollReaderToVerse(verse.verse);
                        }
                      }}
                    >
                      <Pressable
                        onPress={() => toggleReaderVerse(verse.verse)}
                        style={[styles.readerVerseRow, phoneLayout && styles.phoneReaderVerseRow, bibleDarkMode && styles.bibleDarkVerseRow, selectedReaderVerses.includes(verse.verse) && styles.selectedReaderVerseRow, phoneLayout && selectedReaderVerses.includes(verse.verse) && styles.phoneSelectedReaderVerseRow]}
                      >
                        <Text style={[styles.readerVerseNumber, phoneLayout && styles.phoneReaderVerseNumber]}>{verse.verse}</Text>
                        <Text style={[styles.readerVerseText, phoneLayout && styles.phoneReaderVerseText, bibleDarkMode && !selectedReaderVerses.includes(verse.verse) && styles.accountDarkText]}>{verse.text}</Text>
                        <View style={[styles.readerVerseIconRow, phoneLayout && styles.phoneReaderVerseIconRow]}>
                          {readerMemoryVerseKeys.has(verseMarkupKey(verse)) && (
                            <Ionicons name="sparkles" size={15} color={colors.coral} />
                          )}
                          {isReaderVerseBookmarked(verse.verse, bibleBookmarks, readerBook, readerChapter) && (
                            <Ionicons name="bookmark" size={15} color={colors.coral} />
                          )}
                          {isReaderVerseBookmarkNoted(verse.verse, bibleBookmarks, readerBook, readerChapter) && (
                            <Ionicons name="document-text" size={15} color={bibleDarkMode ? "#e9b76a" : colors.oliveDark} />
                          )}
                        </View>
                      </Pressable>
                      {!phoneLayout && selectedReaderVerses.length > 0 && verse.verse === activeReaderActionVerse && (
                        <View style={[styles.inlineReaderActionBar, bibleDarkMode && styles.studyDarkFloatingBar]}>
                          <Text style={[styles.readerSelectionText, bibleDarkMode && styles.accountDarkTitle]}>{readerStudyReference}</Text>
                          <View style={styles.inlineReaderActions}>
                            <Pressable onPress={openReaderChapterInStudy} style={styles.inlineReaderStudyButton}>
                              <Text style={styles.inlineReaderStudyText}>Study selected</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => saveBibleBookmark(selectedReaderVerses)}
                              style={[styles.inlineReaderBookmarkButton, bibleDarkMode && styles.homeDarkResumeButton, currentSelectionBookmarked && styles.activeReaderBookmarkButton]}
                            >
                              <Ionicons name={currentSelectionBookmarked ? "bookmark" : "bookmark-outline"} size={14} color={currentSelectionBookmarked ? "white" : (bibleDarkMode ? "#e9b76a" : colors.oliveDark)} />
                              <Text style={[styles.inlineReaderBookmarkText, bibleDarkMode && styles.homeDarkResumeButtonText, currentSelectionBookmarked && styles.activeReaderReadButtonText]}>
                                {currentSelectionBookmarked ? "Bookmarked" : "Bookmark"}
                              </Text>
                            </Pressable>
                            <Pressable onPress={openSelectedReaderNote} style={[styles.inlineReaderBookmarkButton, bibleDarkMode && styles.homeDarkResumeButton, currentSelectionBookmark?.note?.trim() && styles.activeBookmarkNoteButton]}>
                              <Ionicons name={currentSelectionBookmark?.note?.trim() ? "document-text" : "document-text-outline"} size={14} color={currentSelectionBookmark?.note?.trim() ? "white" : (bibleDarkMode ? "#e9b76a" : colors.oliveDark)} />
                              <Text style={[styles.inlineReaderBookmarkText, bibleDarkMode && styles.homeDarkResumeButtonText, currentSelectionBookmark?.note?.trim() && styles.activeReaderReadButtonText]}>Note</Text>
                            </Pressable>
                            <Pressable onPress={openReaderWorksheetOptions} style={[styles.inlineReaderBookmarkButton, bibleDarkMode && styles.homeDarkResumeButton]}>
                              <Ionicons name="print-outline" size={14} color={bibleDarkMode ? "#e9b76a" : colors.oliveDark} />
                              <Text style={[styles.inlineReaderBookmarkText, bibleDarkMode && styles.homeDarkResumeButtonText]}>Print</Text>
                            </Pressable>
                            <Pressable onPress={saveSelectedReaderVersesToMemory} style={[styles.inlineReaderBookmarkButton, styles.memoryReaderButton, selectedReaderVersesAlreadyInMemory && styles.savedMemoryButton]}>
                              <Ionicons name="sparkles-outline" size={14} color="white" />
                              <Text style={styles.memoryReaderButtonText}>{selectedReaderVersesAlreadyInMemory ? "In Memory" : "Memory"}</Text>
                            </Pressable>
                            <Pressable
                              onPress={clearReaderSelection}
                              style={[styles.clearMarkupButton, bibleDarkMode && styles.homeDarkResumeButton]}
                            >
                              <Text style={[styles.clearMarkupText, bibleDarkMode && styles.homeDarkResumeButtonText]}>Clear</Text>
                            </Pressable>
                          </View>
                        </View>
                      )}
                    </View>
                  ))}
                  <View style={[styles.readerBottomNav, bibleDarkMode && styles.bibleDarkDividerSection]}>
                    <Pressable onPress={() => moveReaderChapter(-1)} style={[styles.readerBottomNavButton, bibleDarkMode && styles.homeDarkResumeButton]}>
                      <Ionicons name="chevron-back-outline" size={15} color={bibleDarkMode ? "#e9b76a" : colors.oliveDark} />
                      <Text style={[styles.readerBottomNavText, bibleDarkMode && styles.homeDarkResumeButtonText]}>Previous</Text>
                    </Pressable>
                    <Pressable onPress={toggleReaderChapterRead} style={[styles.readerBottomNavButton, styles.readerBottomReadButton, bibleDarkMode && styles.homeDarkResumeButton, currentChapterRead && styles.activeReaderReadButton]}>
                      <Ionicons name={currentChapterRead ? "checkmark-circle" : "checkmark-circle-outline"} size={15} color={currentChapterRead ? "white" : (bibleDarkMode ? "#e9b76a" : colors.oliveDark)} />
                      <Text style={[styles.readerBottomNavText, bibleDarkMode && styles.homeDarkResumeButtonText, currentChapterRead && styles.activeReaderReadButtonText]}>
                        {currentChapterRead ? "Chapter read" : "Mark read"}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => moveReaderChapter(1)} style={[styles.readerBottomNavButton, bibleDarkMode && styles.homeDarkResumeButton]}>
                      <Text style={[styles.readerBottomNavText, bibleDarkMode && styles.homeDarkResumeButtonText]}>Next</Text>
                      <Ionicons name="chevron-forward-outline" size={15} color={bibleDarkMode ? "#e9b76a" : colors.oliveDark} />
                    </Pressable>
                  </View>
                  <Text style={[styles.translationNote, bibleDarkMode && styles.accountDarkMutedText]}>
                    {readerPassage.translation_name} · {readerPassage.translation_note || "Public Domain"}
                  </Text>
                </View>
              ) : (
                <View style={styles.passageStatusBox}>
                  <Text style={[styles.muted, bibleDarkMode && styles.accountDarkMutedText]}>{readerStatus}</Text>
                </View>
              )}
              {!!readerMemoryStatus && <Text style={styles.saveStatus}>{readerMemoryStatus}</Text>}
            </Card>
          </View>
        )}

        {tab === "plans" && (
          <View style={plansDarkMode && styles.accountDarkLayout}>
            <Eyebrow>Guided paths</Eyebrow>
            <Text style={[styles.title, plansDarkMode && styles.accountDarkTitle]}>Study plans</Text>
            <Text style={[styles.titleSupport, plansDarkMode && styles.accountDarkMutedText]}>Choose an original seven-day path, then save each study to mark the day complete.</Text>
            <View style={[styles.currentPlanWideBox, phoneLayout && styles.phoneCurrentPlanWideBox, plansDarkMode && styles.accountDarkSection]}>
              <View style={[styles.journalHeader, phoneLayout && styles.phonePlanHeader]}>
                <View style={styles.journalTitleBlock}>
                  <Text style={[styles.cardTitle, plansDarkMode && styles.accountDarkTitle]}>{selectedPlan.title}</Text>
                  <Text style={[styles.muted, plansDarkMode && styles.accountDarkMutedText]}>{selectedPlanComplete ? "Completed. Start again or choose a new plan." : `Next: Day ${selectedPlanNextDay.day} · ${selectedPlanNextDay.passage}`}</Text>
                </View>
                <Text style={[styles.draftPill, plansDarkMode && styles.plansDarkDraftPill]}>{selectedPlanCompletedCount}/{selectedPlan.days.length}</Text>
              </View>
              <View style={[styles.planProgressTrack, plansDarkMode && styles.plansDarkProgressTrack]}>
                <View style={[styles.planProgressFill, { width: `${(selectedPlanCompletedCount / selectedPlan.days.length) * 100}%` }]} />
              </View>
              <View style={[styles.planActionRow, phoneLayout && styles.phonePlanActionRow]}>
                <AppButton label={selectedPlanComplete ? "Restart current plan" : "Continue current plan"} onPress={() => selectedPlanComplete ? resetSelectedPlanProgress() : startPlanDay(selectedPlanNextDay)} style={[phoneLayout && styles.phonePlanPrimaryButton]} labelStyle={phoneLayout && styles.phonePlanButtonLabel} />
                {selectedPlanCompletedCount > 0 && !selectedPlanComplete && <AppButton label="Reset progress" variant="secondary" onPress={() => resetSelectedPlanProgress()} style={[phoneLayout && styles.phonePlanSecondaryButton, plansDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phonePlanButtonLabel, plansDarkMode && styles.homeDarkResumeButtonText]} />}
              </View>
            </View>
            <View style={[styles.planPageGrid, phoneLayout && styles.phonePlanPageGrid]}>
              {studyPlans.map((plan) => {
                const completedCount = plan.days.filter((day) => completedPlanDaySet.has(planDayKey(plan.id, day.day))).length;
                return (
                  <Card key={plan.id} style={[styles.planPageCard, phoneLayout && styles.phonePlanPageCard, plansDarkMode && styles.accountDarkMainCard]}>
                    <View style={[styles.journalHeader, phoneLayout && styles.phonePlanHeader]}>
                      <View style={styles.journalTitleBlock}>
                        <Text style={[styles.cardTitle, plansDarkMode && styles.accountDarkTitle]}>{plan.title}</Text>
                        <Text style={[styles.muted, plansDarkMode && styles.accountDarkMutedText]}>{plan.description}</Text>
                      </View>
                      <Text style={[styles.draftPill, plansDarkMode && styles.plansDarkDraftPill]}>{completedCount}/{plan.days.length}</Text>
                    </View>
                    <View style={[styles.planProgressTrack, plansDarkMode && styles.plansDarkProgressTrack]}>
                      <View style={[styles.planProgressFill, { width: `${(completedCount / plan.days.length) * 100}%` }]} />
                    </View>
                    <View style={[styles.planActionRow, phoneLayout && styles.phonePlanActionRow]}>
                      <ResumeButton label={completedCount === plan.days.length ? "Restart" : "Continue"} icon={completedCount === plan.days.length ? "refresh-outline" : "play-outline"} onPress={() => {
                        setSelectedPlanId(plan.id);
                        const nextDay = plan.days.find((day) => !completedPlanDaySet.has(planDayKey(plan.id, day.day))) || plan.days[0];
                        completedCount === plan.days.length ? resetSelectedPlanProgress(plan.id) : startPlanDay(nextDay, plan.id);
                      }} style={[phoneLayout && styles.phonePlanResumeButton, plansDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phonePlanButtonLabel, plansDarkMode && styles.homeDarkResumeButtonText]} iconColor={plansDarkMode ? "#e9b76a" : undefined} />
                      {completedCount > 0 && completedCount < plan.days.length && <ResumeButton label="Reset" icon="refresh-outline" onPress={() => resetSelectedPlanProgress(plan.id)} style={[phoneLayout && styles.phonePlanResumeButton, plansDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phonePlanButtonLabel, plansDarkMode && styles.homeDarkResumeButtonText]} iconColor={plansDarkMode ? "#e9b76a" : undefined} />}
                    </View>
                    {plan.days.map((planDay) => {
                      const done = completedPlanDaySet.has(planDayKey(plan.id, planDay.day));
                      return (
                        <Pressable key={planDay.day} onPress={() => startPlanDay(planDay, plan.id)} style={[styles.planPageDay, phoneLayout && styles.phonePlanPageDay, plansDarkMode && styles.plansDarkDayRow, done && styles.completedPlanDayRow, plansDarkMode && done && styles.plansDarkCompletedDayRow]}>
                          <Text style={[styles.planDayBadge, done && styles.completedPlanDayBadge, plansDarkMode && !done && styles.plansDarkDayBadge]}>{done ? "✓" : planDay.day}</Text>
                          <View style={styles.planDayCopy}>
                            <Text style={[styles.planDayTitle, phoneLayout && styles.phonePlanDayTitle, plansDarkMode && styles.accountDarkTitle]}>{planDay.title}</Text>
                            <Text numberOfLines={1} style={[styles.planDayPassage, phoneLayout && styles.phonePlanDayPassage, plansDarkMode && styles.accountDarkMutedText]}>{planDay.passage} · {(methods.find((item) => item.id === planDay.methodId) || methods[0]).short}</Text>
                          </View>
                          <Ionicons name="arrow-forward-outline" size={16} color={plansDarkMode ? "#c8bda9" : colors.muted} />
                        </Pressable>
                      );
                    })}
                  </Card>
                );
              })}
            </View>
          </View>
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
          <View style={[styles.layout, compactLayout && styles.stackedLayout, communitySubView === "history" && styles.focusLayout, memoryDarkMode && styles.accountDarkLayout]}>
            <Card style={[styles.mainCard, compactLayout && styles.fluidCard, communitySubView === "history" && styles.focusMainCard, memoryDarkMode && styles.accountDarkMainCard]}>
              <Eyebrow>Memory</Eyebrow>
              <Text style={[styles.title, memoryDarkMode && styles.accountDarkTitle]}>{firstName ? `${firstName}, memorize saved verses` : "Memorize saved verses"}</Text>
              {!phoneMemoryFocusMode && (
                <>
                  <Text style={[styles.titleSupport, styles.memoryTitleSupport, memoryDarkMode && styles.accountDarkMutedText]}>Hide a little at a time and carry Scripture with you through the day.</Text>
                  <View style={[styles.metricGrid, phoneLayout && styles.phoneMemoryMetricGrid]}>
                    <Metric value={(memoryVerses || []).length} label="saved" compact={phoneLayout} style={memoryDarkMode && styles.homeDarkMetric} valueStyle={memoryDarkMode && styles.homeDarkMetricValue} labelStyle={memoryDarkMode && styles.accountDarkMutedText} />
                    <Metric value={dueMemoryCount} label="due now" compact={phoneLayout} style={memoryDarkMode && styles.homeDarkMetric} valueStyle={memoryDarkMode && styles.homeDarkMetricValue} labelStyle={memoryDarkMode && styles.accountDarkMutedText} />
                    <Metric value={reviewedTodayCount} label="reviewed today" compact={phoneLayout} labelLines={2} style={memoryDarkMode && styles.homeDarkMetric} valueStyle={memoryDarkMode && styles.homeDarkMetricValue} labelStyle={memoryDarkMode && styles.accountDarkMutedText} />
                  </View>
                  {phoneLayout && firstDueMemoryVerse && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => startMemoryPractice(firstDueMemoryVerse)}
                      style={styles.phoneMemoryPrimaryReviewButton}
                    >
                      <Ionicons name="school-outline" size={16} color="#fff" />
                      <Text style={styles.phoneMemoryPrimaryReviewText}>
                        Review {dueMemoryCount} due verse{dueMemoryCount === 1 ? "" : "s"}
                      </Text>
                    </Pressable>
                  )}
                </>
              )}
              {phoneMemoryFocusMode && (
                <View style={[styles.memoryFocusBanner, memoryDarkMode && styles.memoryDarkFocusBanner]}>
                  <Ionicons name={activeMemoryMeditationVerseId ? "leaf-outline" : "school-outline"} size={18} color={colors.coral} />
                  <Text style={[styles.memoryFocusBannerText, memoryDarkMode && styles.accountDarkText]}>
                    {activeMemoryMeditationVerseId ? "Meditation mode. Save or close this reflection to return to your saved list." : "Practice mode. Close or finish this verse to return to your saved list."}
                  </Text>
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
                  </View>
                </View>
              ) : (
                <View style={styles.memoryList}>
                  {!phoneMemoryFocusMode && memoryView !== "history" && (
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
                    <View style={styles.memoryHistoryStack}>
                        <View style={[styles.memoryHistorySummaryBox, memoryDarkMode && styles.accountDarkSection]}>
                        <View style={styles.memoryHistorySummaryHeader}>
                          <View style={styles.memoryHistorySummaryTextBlock}>
                            <Text style={[styles.feedbackTitle, memoryDarkMode && styles.accountDarkTitle]}>Memory engagement</Text>
                          </View>
                          <Ionicons name="time-outline" size={22} color={colors.coral} />
                        </View>
                        <View style={[styles.memoryHistoryEncouragementBox, memoryDarkMode && styles.accountDarkInsetBox]}>
                          <View style={styles.memoryEncouragementHeader}>
                            <Ionicons name="sparkles-outline" size={17} color={memoryDarkMode ? "#e9b76a" : colors.coral} />
                            <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>Encouragement</Text>
                          </View>
                          {phoneLayout ? (
                            <View style={styles.phoneMemoryEncouragementStack}>
                              <View style={styles.phoneMemoryEncouragementItem}>
                                <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>Today</Text>
                                <Text style={[styles.memoryHistoryEncouragementText, memoryDarkMode && styles.accountDarkText]}>{memoryHistoryEncouragement}</Text>
                              </View>
                              <View style={styles.phoneMemoryEncouragementItem}>
                                <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>This week</Text>
                                <Text style={[styles.memoryHistoryEncouragementText, memoryDarkMode && styles.accountDarkText]}>{memoryWeeklySummary}</Text>
                                <Text style={[styles.memoryWeeklyInlineScripture, memoryDarkMode && styles.accountDarkMutedText]}>
                                  "{memoryWeeklyScripture.text}" - {memoryWeeklyScripture.reference}
                                </Text>
                              </View>
                            </View>
                          ) : (
                            <View style={styles.memoryEncouragementGrid}>
                              <View style={styles.memoryEncouragementBlock}>
                                <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>Today</Text>
                                <Text style={[styles.memoryHistoryEncouragementText, memoryDarkMode && styles.accountDarkText]}>{memoryHistoryEncouragement}</Text>
                              </View>
                              <View style={styles.memoryEncouragementBlock}>
                                <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>This week</Text>
                                <Text style={[styles.memoryHistoryEncouragementText, memoryDarkMode && styles.accountDarkText]}>{memoryWeeklySummary}</Text>
                              </View>
                              <View style={[styles.memoryWeeklyScriptureBox, memoryDarkMode && styles.accountDarkSection]}>
                                <Text style={[styles.memoryWeeklyScriptureText, memoryDarkMode && styles.accountDarkText]}>"{memoryWeeklyScripture.text}"</Text>
                                <Text style={[styles.memoryHistoryDate, memoryDarkMode && styles.accountDarkMutedText]}>{memoryWeeklyScripture.reference}</Text>
                              </View>
                            </View>
                          )}
                        </View>
                        <View style={[styles.metricGrid, phoneLayout && styles.phoneMemoryMetricGrid]}>
                          <Metric value={memoryHistorySummary.reviewedToday} label="reviewed today" compact={phoneLayout} labelLines={2} style={memoryDarkMode && styles.homeDarkMetric} valueStyle={memoryDarkMode && styles.homeDarkMetricValue} labelStyle={memoryDarkMode && styles.accountDarkMutedText} />
                          <Metric value={memoryHistorySummary.reviewedThisWeek} label="this week" compact={phoneLayout} style={memoryDarkMode && styles.homeDarkMetric} valueStyle={memoryDarkMode && styles.homeDarkMetricValue} labelStyle={memoryDarkMode && styles.accountDarkMutedText} />
                          <Metric value={memoryHistorySummary.addedCount} label="added" compact={phoneLayout} style={memoryDarkMode && styles.homeDarkMetric} valueStyle={memoryDarkMode && styles.homeDarkMetricValue} labelStyle={memoryDarkMode && styles.accountDarkMutedText} />
                        </View>
                        {memoryHistorySummary.mostReviewed && (
                          <View style={[styles.memoryHistoryHighlight, memoryDarkMode && styles.accountDarkInsetBox]}>
                            <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>Most reviewed</Text>
                            <Text style={[styles.body, memoryDarkMode && styles.accountDarkText]}>{memoryHistorySummary.mostReviewed.reference}</Text>
                            <Text style={[styles.muted, memoryDarkMode && styles.accountDarkMutedText]}>{memoryHistorySummary.mostReviewed.count} review{memoryHistorySummary.mostReviewed.count === 1 ? "" : "s"} recorded</Text>
                          </View>
                        )}
                        {neglectedMemoryVerses.length > 0 && (
                          <View style={[styles.memoryHistoryHighlight, memoryDarkMode && styles.accountDarkInsetBox]}>
                            <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>Worth revisiting</Text>
                            <View style={styles.memoryHistoryList}>
                              {neglectedMemoryVerses.map((verse: any) => (
                                <View key={String(verse._id)} style={styles.neglectedMemoryRow}>
                                  <View style={styles.memoryHistoryTextBlock}>
                                    <Text style={[styles.bodyStrong, memoryDarkMode && styles.accountDarkText]}>{verse.reference}</Text>
                                    <Text style={[styles.memoryHistoryDate, memoryDarkMode && styles.accountDarkMutedText]}>{neglectedMemoryVerseLabel(verse.daysSinceReview, verse.reviewCount)}</Text>
                                  </View>
                                  <Pressable
                                    accessibilityRole="button"
                                    onPress={() => startMemoryPractice(verse)}
                                    style={[styles.neglectedMemoryPracticeButton, memoryDarkMode && styles.homeDarkResumeButton]}
                                  >
                                    <Text style={[styles.neglectedMemoryPracticeText, memoryDarkMode && styles.homeDarkResumeButtonText]}>Practice</Text>
                                  </Pressable>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                      <View style={[styles.memoryHistorySummaryBox, memoryDarkMode && styles.accountDarkSection]}>
                        <View style={styles.memoryHistorySummaryHeader}>
                          <View style={styles.memoryHistorySummaryTextBlock}>
                            <Text style={[styles.feedbackTitle, memoryDarkMode && styles.accountDarkTitle]}>Memory milestones</Text>
                            <Text style={[styles.muted, memoryDarkMode && styles.accountDarkMutedText]}>
                              Choose up to five goals to keep in view.
                            </Text>
                          </View>
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => setMemoryMilestonePickerOpen((current) => !current)}
                            style={[styles.memoryHistoryMoreButton, memoryDarkMode && styles.homeDarkResumeButton]}
                          >
                            <Text style={[styles.memoryHistoryMoreText, memoryDarkMode && styles.homeDarkResumeButtonText]}>
                              {memoryMilestonePickerOpen ? "Hide goals" : "Choose goals"}
                            </Text>
                            <Ionicons name={memoryMilestonePickerOpen ? "chevron-up-outline" : "options-outline"} size={16} color={memoryDarkMode ? "#e9b76a" : colors.oliveDark} />
                          </Pressable>
                        </View>
                        {memoryMilestonePickerOpen && (
                          <View style={[styles.memoryMilestonePicker, memoryDarkMode && styles.accountDarkInsetBox]}>
                            <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>
                              Tracking {memoryMilestoneGoalIds.length} of 5
                            </Text>
                            <View style={styles.memoryMilestoneGoalGrid}>
                              {MEMORY_MILESTONE_GOALS.map((goal) => {
                                const selected = memoryMilestoneGoalIds.includes(goal.id);
                                return (
                                  <Pressable
                                    key={goal.id}
                                    accessibilityRole="button"
                                    onPress={() => toggleMemoryMilestoneGoal(goal.id)}
                                    style={[
                                      styles.memoryMilestoneGoalChip,
                                      memoryDarkMode && styles.printDarkOptionChip,
                                      selected && styles.activeFilterChip
                                    ]}
                                  >
                                    <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={15} color={selected ? "#ffffff" : memoryDarkMode ? "#e9b76a" : colors.oliveDark} />
                                    <View style={styles.memoryHistoryTextBlock}>
                                      <Text style={[styles.memoryMilestoneGoalTitle, memoryDarkMode && styles.accountDarkText, selected && styles.activeFilterText]}>{goal.label}</Text>
                                      <Text style={[styles.memoryMilestoneGoalDescription, memoryDarkMode && styles.accountDarkMutedText, selected && styles.activeFilterText]}>{goal.description}</Text>
                                    </View>
                                  </Pressable>
                                );
                              })}
                            </View>
                            {!!memoryMilestoneStatus && <Text style={[styles.memoryHistoryDate, memoryDarkMode && styles.accountDarkMutedText]}>{memoryMilestoneStatus}</Text>}
                          </View>
                        )}
                        <View style={styles.memoryMilestoneList}>
                          {memoryMilestones.map((milestone) => (
                            <View key={milestone.id || milestone.title} style={[styles.memoryMilestoneItem, memoryDarkMode && styles.accountDarkInsetBox]}>
                              <Ionicons name={milestone.achieved ? "checkmark-circle-outline" : "ellipse-outline"} size={16} color={memoryDarkMode ? "#e9b76a" : colors.coral} />
                              <View style={styles.memoryHistoryTextBlock}>
                                <Text style={[styles.bodyStrong, memoryDarkMode && styles.accountDarkText]}>{milestone.title}</Text>
                                <Text style={[styles.memoryVerseHistoryEventText, memoryDarkMode && styles.accountDarkMutedText]}>{milestone.description}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                      <View style={[styles.memoryHistorySummaryBox, memoryDarkMode && styles.accountDarkSection]}>
                        <Text style={[styles.feedbackTitle, memoryDarkMode && styles.accountDarkTitle]}>Recent memory activity</Text>
                        {memoryHistoryItems.length === 0 ? (
                          <Text style={[styles.muted, memoryDarkMode && styles.accountDarkMutedText]}>Your history will appear here as you add, review, repeat, and schedule memory verses.</Text>
                        ) : (
                          <View style={styles.memoryHistoryList}>
                            {visibleMemoryHistoryItems.map((item: any) => (
                              <View key={item._id} style={[styles.memoryHistoryItem, memoryDarkMode && styles.accountDarkInsetBox]}>
                                <View style={[styles.memoryHistoryIcon, memoryDarkMode && styles.homeDarkIconBubble]}>
                                  <Ionicons name={memoryHistoryEventIcon(item.event) as any} size={17} color={memoryDarkMode ? "#e9b76a" : colors.coral} />
                                </View>
                                <View style={styles.memoryHistoryTextBlock}>
                                  <Text style={[styles.bodyStrong, memoryDarkMode && styles.accountDarkText]}>{memoryHistoryEventLabel(item.event, item.practiceLevel)}</Text>
                                  <Text style={[styles.muted, memoryDarkMode && styles.accountDarkMutedText]}>{item.reference}</Text>
                                  <Text style={[styles.memoryHistoryDate, memoryDarkMode && styles.accountDarkMutedText]}>{formatMemoryHistoryDate(item.createdAt)}</Text>
                                </View>
                              </View>
                            ))}
                            {memoryHistoryItems.length > 10 && (
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => setMemoryHistoryExpanded((expanded) => !expanded)}
                                style={[styles.memoryHistoryMoreButton, memoryDarkMode && styles.homeDarkResumeButton]}
                              >
                                <Text style={[styles.memoryHistoryMoreText, memoryDarkMode && styles.homeDarkResumeButtonText]}>
                                  {memoryHistoryExpanded ? "Show less" : `Show more (${Math.min(memoryHistoryItems.length, 30) - 10})`}
                                </Text>
                                <Ionicons name={memoryHistoryExpanded ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={memoryDarkMode ? "#e9b76a" : colors.oliveDark} />
                              </Pressable>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
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
                      <View style={[styles.memoryDiscoverBlock, memoryDarkMode && styles.accountDarkSection]}>
                        <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>Books saved</Text>
                        <View style={styles.filterRow}>
                          <Pressable
                            onPress={() => {
                              setMemoryBookFilter("all");
                              setMemoryChapterFilter("all");
                            }}
                            style={[styles.filterChip, memoryDarkMode && styles.printDarkOptionChip, memoryBookFilter === "all" && styles.activeFilterChip]}
                          >
                            <Text style={[styles.filterText, memoryDarkMode && styles.accountDarkMutedText, memoryBookFilter === "all" && styles.activeFilterText]}>All books</Text>
                          </Pressable>
                          {memoryBookOptions.map((book) => (
                            <Pressable
                              key={book.book}
                              onPress={() => {
                                setMemoryBookFilter(book.book);
                                setMemoryChapterFilter("all");
                              }}
                              style={[styles.filterChip, memoryDarkMode && styles.printDarkOptionChip, memoryBookFilter === book.book && styles.activeFilterChip]}
                            >
                              <Text style={[styles.filterText, memoryDarkMode && styles.accountDarkMutedText, memoryBookFilter === book.book && styles.activeFilterText]}>
                                {book.book} ({book.count})
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                        <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>Chapters saved</Text>
                        <View style={styles.filterRow}>
                          <Pressable
                            onPress={() => setMemoryChapterFilter("all")}
                            style={[styles.filterChip, memoryDarkMode && styles.printDarkOptionChip, memoryChapterFilter === "all" && styles.activeFilterChip]}
                          >
                            <Text style={[styles.filterText, memoryDarkMode && styles.accountDarkMutedText, memoryChapterFilter === "all" && styles.activeFilterText]}>All chapters</Text>
                          </Pressable>
                          {memoryChapterOptions.map((chapter) => (
                            <Pressable
                              key={chapter.key}
                              onPress={() => setMemoryChapterFilter(chapter.key)}
                              style={[styles.filterChip, memoryDarkMode && styles.printDarkOptionChip, memoryChapterFilter === chapter.key && styles.activeFilterChip]}
                            >
                              <Text style={[styles.filterText, memoryDarkMode && styles.accountDarkMutedText, memoryChapterFilter === chapter.key && styles.activeFilterText]}>
                                {chapter.label} ({chapter.count})
                              </Text>
                            </Pressable>
                          ))}
                        </View>
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
                              onPress={() => setMemoryBrowseStatusFilter(key as MemoryBrowseStatusFilter)}
                              style={[styles.filterChip, memoryDarkMode && styles.printDarkOptionChip, memoryBrowseStatusFilter === key && styles.activeFilterChip]}
                            >
                              <Text style={[styles.filterText, memoryDarkMode && styles.accountDarkMutedText, memoryBrowseStatusFilter === key && styles.activeFilterText]}>{label}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    </>
                  )}
                  {!phoneMemoryFocusMode && memoryView !== "history" && (
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
                  {visibleMemorySections.map((section) => (
                    <View key={section.title} style={styles.memorySection}>
                      {!phoneMemoryFocusMode && (
                        <>
                          <View style={styles.memorySectionHeader}>
                            <Text style={[styles.memorySectionTitle, memoryDarkMode && styles.accountDarkTitle]}>{section.title}</Text>
                            <Text style={[styles.memorySectionCount, memoryDarkMode && styles.memoryDarkCountPill]}>{section.verses.length}</Text>
                          </View>
                          <Text style={[styles.muted, memoryDarkMode && styles.accountDarkMutedText]}>{section.description}</Text>
                        </>
                      )}
                      {section.verses.map((verse: any) => {
                        const verseId = String(verse._id);
                        const practicing = verseId === activeMemoryVerseId;
                        const meditating = verseId === activeMemoryMeditationVerseId;
                        const reviewOpen = reviewScheduleVerseId === verseId;
                        const historyOpen = historyMemoryVerseId === verseId;
                        const moreOpen = memoryMoreVerseId === verseId;
                        const cardExpanded = expandedMemoryVerseIds.includes(verseId) || practicing || meditating || reviewOpen || historyOpen || moreOpen;
                        const verseHistory = memoryHistoryItems
                          .filter((item: any) => String(item.memoryVerseId || "") === verseId || item.reference === verse.reference)
                          .slice(0, 4);

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
                                          onSubmit={() => focusMemoryBlankAfter(token.index, memoryPracticeAnswers)}
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
                                  ) : (
                                    <ResumeButton label={memoryPracticeLevel === 1 ? "Ready for Step 2" : "Check answers"} icon="checkmark-circle-outline" onPress={submitMemoryPractice} style={[phoneLayout && styles.phoneMemoryActionButton, memoryDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneMemoryActionText, memoryDarkMode && styles.homeDarkResumeButtonText]} iconColor={memoryDarkMode ? "#e9b76a" : undefined} />
                                  )}
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
                                  <ResumeButton label="Close" icon="close-outline" onPress={() => setActiveMemoryVerseId("")} style={[phoneLayout && styles.phoneMemoryActionButton, memoryDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneMemoryActionText, memoryDarkMode && styles.homeDarkResumeButtonText]} iconColor={memoryDarkMode ? "#e9b76a" : undefined} />
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
                                      <Text style={[styles.phoneMemoryMoreMenuText, memoryDarkMode && styles.homeDarkResumeButtonText]}>{reviewOpen ? "Hide review schedule" : "Change review date"}</Text>
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
                                {reviewOpen && (
                                  <View style={[styles.reviewScheduleBox, memoryDarkMode && styles.accountDarkInsetBox]}>
                                    <Text style={[styles.memoryDiscoverLabel, memoryDarkMode && styles.studyDarkAccentText]}>Review again</Text>
                                    <View style={styles.filterRow}>
                                      {MEMORY_REVIEW_OPTIONS.map((option) => (
                                        <Pressable
                                          key={option.id}
                                          onPress={() => scheduleMemoryVerseReview(verse, option.id)}
                                          style={[styles.filterChip, memoryDarkMode && styles.printDarkOptionChip, reviewPresetForDate(verse.nextReviewAt) === option.id && styles.activeFilterChip]}
                                        >
                                          <Text style={[styles.filterText, memoryDarkMode && styles.accountDarkMutedText, reviewPresetForDate(verse.nextReviewAt) === option.id && styles.activeFilterText]}>{option.label}</Text>
                                        </Pressable>
                                      ))}
                                    </View>
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
                  ))}
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
        )}

        {tab === "accountability" && (
          <View style={[styles.layout, compactLayout && styles.stackedLayout, communitySubView === "history" && styles.focusLayout, communityDarkMode && styles.accountDarkLayout]}>
            <Card style={[styles.mainCard, compactLayout && styles.fluidCard, communitySubView === "history" && styles.focusMainCard, communityDarkMode && styles.accountDarkMainCard]}>
              <Eyebrow>Community</Eyebrow>
              <Text style={[styles.title, communityDarkMode && styles.accountDarkTitle]}>{firstName ? `${firstName}, share encouragement` : "Share encouragement"}</Text>
              <Text style={[styles.titleSupport, communityDarkMode && styles.accountDarkMutedText]}>Community only opens through registered friends or private circles. No public feed, no open posting.</Text>
              <View style={[styles.communitySubViewTabs, communityDarkMode && styles.accountDarkSegmentedRow]}>
                {[
                  ["encourage", "Encourage"],
                  ["history", "History"]
                ].map(([key, label]) => (
                  <Pressable
                    key={key}
                    onPress={() => setCommunitySubView(key as "encourage" | "history")}
                    style={[styles.communitySubViewTab, communitySubView === key && styles.activeCommunitySubViewTab]}
                  >
                    <Text style={[styles.communitySubViewTabText, communityDarkMode && styles.accountDarkMutedText, communitySubView === key && styles.activeCommunitySubViewTabText]}>{label}</Text>
                  </Pressable>
                ))}
              </View>
              {communitySubView === "encourage" ? (
                <>
              <View style={[styles.communityConnectionGrid, phoneLayout && styles.phoneCommunityConnectionGrid]}>
              <View style={[styles.communityCircleBox, styles.communityConnectionPanel, communityDarkMode && styles.accountDarkSection, phoneLayout && styles.phoneCommunityConnectionPanel]}>
                <Pressable
                  disabled={!phoneLayout}
                  onPress={() => toggleRememberedPanel(setMobileFriendsPanelOpen, "communityFriendsPanelOpen")}
                  style={[styles.feedbackHeader, phoneLayout && styles.mobileCommunityPanelHeader]}
                >
                  <View style={styles.mobileCommunityPanelTitleRow}>
                    <Ionicons name="person-add-outline" size={18} color={colors.coral} />
                    <Text style={[styles.feedbackTitle, communityDarkMode && styles.accountDarkTitle]}>Friends</Text>
                  </View>
                  {phoneLayout && (
                    <View style={styles.mobileCommunityPanelSummaryRow}>
                      <Text numberOfLines={1} style={[styles.mobileCommunityPanelSummary, communityDarkMode && styles.accountDarkMutedText]}>{friendPanelSummary}</Text>
                      <Ionicons name={mobileFriendsPanelOpen ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                    </View>
                  )}
                </Pressable>
                {showFriendsConnectionPanel && (
                  <>
                    <Text style={[styles.helpIntro, communityDarkMode && styles.accountDarkMutedText]}>
                      Friends are registered Bible Study Tutor users you personally add by code or email. Share your code privately with someone you trust, then encourage one another without a public feed.
                    </Text>
                    {COMMUNITY_CIRCLES_ENABLED && isAuthenticated ? (
                      <>
                    <View style={[styles.circleManagementBox, communityDarkMode && styles.accountDarkInsetBox, phoneLayout && styles.phoneCircleManagementBox]}>
                      <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>Your friend code</Text>
                      <View style={[styles.circleChip, communityDarkMode && styles.accountDarkSection]}>
                        <View style={[styles.circleInviteLine, phoneLayout && styles.phoneCircleInviteLine]}>
                          <Text style={[styles.circleInviteCodeText, communityDarkMode && styles.accountDarkTitle]}>{myFriendCode || "Loading..."}</Text>
                          <Pressable onPress={copyFriendCode} style={[styles.circleCopyButton, communityDarkMode && styles.homeDarkResumeButton]}>
                            <Ionicons name="copy-outline" size={13} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                            <Text style={[styles.circleCopyText, communityDarkMode && styles.homeDarkResumeButtonText]}>Copy</Text>
                          </Pressable>
                        </View>
                        <Text style={[styles.circleChipMeta, communityDarkMode && styles.accountDarkMutedText]}>Share this code privately so another registered user can add you as a friend.</Text>
                      </View>
                      <Pressable onPress={() => toggleRememberedPanel(setFriendToolsOpen, "communityFriendToolsOpen")} style={[styles.circleManagerToggle, communityDarkMode && styles.homeDarkResumeButton]}>
                        <Ionicons name="person-add-outline" size={14} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                        <Text style={[styles.circleManageText, communityDarkMode && styles.homeDarkResumeButtonText]}>{friendToolsOpen ? "Hide friend tools" : "Add or invite"}</Text>
                        <Ionicons name={friendToolsOpen ? "chevron-up-outline" : "chevron-down-outline"} size={15} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                      </Pressable>
                      {friendToolsOpen && (
                        <View style={styles.circleManagementContent}>
                          <View style={[styles.circleActionGrid, phoneLayout && styles.phoneCircleActionGrid]}>
                            <View style={[styles.circleActionBox, communityDarkMode && styles.accountDarkSection, phoneLayout && styles.phoneCircleActionBox]}>
                              <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>Add by friend code</Text>
                              <TextInput
                                value={friendCodeInput}
                                onChangeText={(value) => setFriendCodeInput(value.toUpperCase())}
                                placeholder="Friend code"
                                autoCapitalize="characters"
                                placeholderTextColor={communityDarkMode ? "#8f8678" : undefined}
                                style={[styles.input, communityDarkMode && styles.accountDarkInput, phoneLayout && styles.phoneCommunityInput]}
                              />
                              <AppButton label="Add by code" variant="secondary" onPress={inviteFriendWithCode} style={phoneLayout && styles.phoneFullWidthButton} labelStyle={phoneLayout && styles.phoneCommunityButtonLabel} />
                            </View>
                            <View style={[styles.circleActionBox, communityDarkMode && styles.accountDarkSection, phoneLayout && styles.phoneCircleActionBox]}>
                              <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>Add by email</Text>
                              <TextInput
                                value={friendEmail}
                                onChangeText={setFriendEmail}
                                placeholder="Friend's account email"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                placeholderTextColor={communityDarkMode ? "#8f8678" : undefined}
                                style={[styles.input, communityDarkMode && styles.accountDarkInput, phoneLayout && styles.phoneCommunityInput]}
                              />
                              <AppButton label="Send invite" variant="secondary" onPress={inviteFriend} style={phoneLayout && styles.phoneFullWidthButton} labelStyle={phoneLayout && styles.phoneCommunityButtonLabel} />
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                    {acceptedCommunityFriends.length > 0 ? (
                      <View style={[styles.circleSelectorPanel, communityDarkMode && styles.accountDarkInsetBox]}>
                        <View style={styles.circleSelectorHeader}>
                          <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>Your friends</Text>
                          <Text style={[styles.circleCountText, communityDarkMode && styles.accountDarkMutedText]}>{acceptedCommunityFriends.length} accepted</Text>
                        </View>
                        <View style={styles.circleList}>
                          {acceptedCommunityFriends.map((friend: any) => {
                            const friendIsSelected = String(selectedFriendId) === String(friend._id);
                            return (
                              <Pressable
                                key={friend._id}
                                onPress={() => {
                                  setSelectedFriendId(friend._id);
                                  setPendingFriendRemoveId(null);
                                }}
                                style={[styles.circleChip, communityDarkMode && styles.accountDarkSection, friendIsSelected && styles.activeCircleChip]}
                              >
                                <Text style={[styles.circleChipTitle, communityDarkMode && styles.accountDarkTitle, friendIsSelected && styles.activeCircleChipText]}>{friend.name}</Text>
                                <Text style={[styles.circleChipMeta, communityDarkMode && styles.accountDarkMutedText, friendIsSelected && styles.activeCircleChipText]}>
                                  {friendIsSelected ? "Selected for management" : "Tap to manage"}{friend.email ? ` · ${friend.email}` : ""}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    ) : (
                      <View style={[styles.emptyCommunityBox, communityDarkMode && styles.accountDarkInsetBox]}>
                        <Text style={[styles.communityTitle, communityDarkMode && styles.accountDarkTitle]}>No accepted friends yet</Text>
                        <Text style={[styles.helpIntro, communityDarkMode && styles.accountDarkMutedText]}>Invite a registered user by email, or accept an invite below.</Text>
                      </View>
                    )}
                    {pendingCommunityFriendInvites.length > 0 && (
                      <View style={[styles.circleSelectorPanel, communityDarkMode && styles.accountDarkInsetBox]}>
                        <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>Pending friend invites</Text>
                        <View style={styles.circleList}>
                          {pendingCommunityFriendInvites.map((friend: any) => (
                            <View key={friend._id} style={[styles.circleChip, communityDarkMode && styles.accountDarkSection]}>
                              <Text style={[styles.circleChipTitle, communityDarkMode && styles.accountDarkTitle]}>{friend.name}</Text>
                              <Text style={[styles.circleChipMeta, communityDarkMode && styles.accountDarkMutedText]}>
                                {friend.direction === "received" ? "Waiting for you to accept" : "Invite sent"}{friend.email ? ` · ${friend.email}` : ""}
                              </Text>
                              <View style={styles.circleManagementRow}>
                                {friend.direction === "received" && (
                                  <Pressable onPress={() => acceptFriendInvite(friend)} style={[styles.circleManageButton, communityDarkMode && styles.homeDarkResumeButton]}>
                                    <Text style={[styles.circleManageText, communityDarkMode && styles.homeDarkResumeButtonText]}>Accept</Text>
                                  </Pressable>
                                )}
                                <Pressable
                                  onPress={() => removeFriend(friend)}
                                  style={[styles.circleManageButton, styles.circleDangerManageButton, pendingFriendRemoveId === friend._id && styles.activeCircleDangerManageButton]}
                                >
                                  <Text style={[styles.circleManageText, styles.circleDangerManageText, pendingFriendRemoveId === friend._id && styles.activeCircleDangerManageText]}>
                                    {pendingFriendRemoveId === friend._id ? "Confirm remove" : friend.direction === "received" ? "Decline" : "Cancel"}
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    {!!managedCommunityFriend && (
                      <Pressable
                        onPress={() => removeFriend(managedCommunityFriend)}
                        style={[styles.circleManageButton, styles.circleDangerManageButton, pendingFriendRemoveId === managedCommunityFriend._id && styles.activeCircleDangerManageButton]}
                      >
                        <Text style={[styles.circleManageText, styles.circleDangerManageText, pendingFriendRemoveId === managedCommunityFriend._id && styles.activeCircleDangerManageText]}>
                          {pendingFriendRemoveId === managedCommunityFriend._id ? "Confirm remove friend" : `Remove ${managedCommunityFriend.name}`}
                        </Text>
                      </Pressable>
                    )}
                    {!!friendStatus && <Text style={[styles.saveStatus, communityDarkMode && styles.accountDarkMutedText]}>{friendStatus}</Text>}
                      </>
                    ) : COMMUNITY_CIRCLES_ENABLED ? (
                      <AppButton label="Open account" variant="secondary" onPress={() => setTab("account")} style={phoneLayout && styles.phoneFullWidthButton} labelStyle={phoneLayout && styles.phoneCommunityButtonLabel} />
                    ) : (
                      <Text style={[styles.saveStatus, communityDarkMode && styles.accountDarkMutedText]}>Friends will be enabled after the backend is ready.</Text>
                    )}
                  </>
                )}
              </View>
              <View style={[styles.communityCircleBox, styles.communityConnectionPanel, communityDarkMode && styles.accountDarkSection, phoneLayout && styles.phoneCommunityConnectionPanel]}>
                <Pressable
                  disabled={!phoneLayout}
                  onPress={() => toggleRememberedPanel(setMobileCirclesPanelOpen, "communityCirclesPanelOpen")}
                  style={[styles.feedbackHeader, phoneLayout && styles.mobileCommunityPanelHeader]}
                >
                  <View style={styles.mobileCommunityPanelTitleRow}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.coral} />
                    <Text style={[styles.feedbackTitle, communityDarkMode && styles.accountDarkTitle]}>Private circle</Text>
                  </View>
                  {phoneLayout && (
                    <View style={styles.mobileCommunityPanelSummaryRow}>
                      <Text numberOfLines={1} style={[styles.mobileCommunityPanelSummary, communityDarkMode && styles.accountDarkMutedText]}>{circlePanelSummary}</Text>
                      <Ionicons name={mobileCirclesPanelOpen ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                    </View>
                  )}
                </Pressable>
                {showCircleConnectionPanel && (
                  <>
                    <Text style={[styles.helpIntro, communityDarkMode && styles.accountDarkMutedText]}>
                    {COMMUNITY_CIRCLES_ENABLED
                      ? isAuthenticated
                        ? "A circle is a small, invite-only group for people you trust. Share a study thought, prayer point, or simple encouragement so you can encourage one another to keep drawing near to God."
                        : "Sign in to create or join a small private circle where trusted people can share study thoughts, prayer points, and encouragement."
                      : "Private circles are being prepared and will be enabled after the backend is ready."}
                    </Text>
                    {COMMUNITY_CIRCLES_ENABLED && isAuthenticated ? (
                      <>
                    {(communityCircles || []).length > 0 && (
                      <View style={[styles.circleSelectorPanel, communityDarkMode && styles.accountDarkInsetBox]}>
                        <View style={styles.circleSelectorHeader}>
                          <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>Your circles</Text>
                          <Text style={[styles.circleCountText, communityDarkMode && styles.accountDarkMutedText]}>{(communityCircles || []).length} saved</Text>
                        </View>
                        <View style={styles.circleList}>
                          {(communityCircles || []).map((circle: any) => {
                            const circleIsSelected = String(selectedCircleId) === String(circle._id);
                            return (
                              <View key={circle._id} style={[styles.circleChip, communityDarkMode && styles.accountDarkSection, circleIsSelected && styles.activeCircleChip]}>
                                <Pressable
                                  onPress={() => {
                                    setSelectedCircleId(circleIsSelected ? null : circle._id);
                                    setPendingCircleDeleteId(null);
                                    setPendingCircleLeaveId(null);
                                  }}
                                  style={styles.circleChipHeader}
                                >
                                  <View style={styles.journalTitleBlock}>
                                    <Text style={[styles.circleChipTitle, communityDarkMode && styles.accountDarkTitle, circleIsSelected && styles.activeCircleChipText]}>{circle.name}</Text>
                                    <Text style={[styles.circleChipMeta, communityDarkMode && styles.accountDarkMutedText, circleIsSelected && styles.activeCircleChipText]}>
                                      {circleIsSelected ? "Managing this circle" : "Tap to manage"} · {circle.memberCount} member{circle.memberCount === 1 ? "" : "s"} · {circle.canDelete ? "Owner" : "Member"}
                                    </Text>
                                  </View>
                                  <Ionicons name={circleIsSelected ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={communityDarkMode && !circleIsSelected ? "#e9b76a" : colors.oliveDark} />
                                </Pressable>
                                {circleIsSelected && (
                                  <View style={styles.circleInlineManagement}>
                                    <View style={[styles.circleInviteLine, phoneLayout && styles.phoneCircleInviteLine]}>
                                      <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>Invite code</Text>
                                      <Text style={[styles.circleInviteCodeText, communityDarkMode && styles.accountDarkTitle]}>{circle.inviteCode}</Text>
                                    </View>
                                    <View style={styles.circleManagementRow}>
                                      <Pressable onPress={() => copyCircleInviteCode(circle.inviteCode)} style={[styles.circleCopyButton, communityDarkMode && styles.homeDarkResumeButton]}>
                                        <Ionicons name="copy-outline" size={14} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                                        <Text style={[styles.circleCopyText, communityDarkMode && styles.homeDarkResumeButtonText]}>Copy invite</Text>
                                      </Pressable>
                                      {circle.canDelete ? (
                                        <Pressable
                                          onPress={() => deleteCircle(circle)}
                                          style={[styles.circleManageButton, styles.circleDangerManageButton, pendingCircleDeleteId === circle._id && styles.activeCircleDangerManageButton]}
                                        >
                                          <Text style={[styles.circleManageText, styles.circleDangerManageText, pendingCircleDeleteId === circle._id && styles.activeCircleDangerManageText]}>
                                            {pendingCircleDeleteId === circle._id ? "Confirm delete" : "Delete circle"}
                                          </Text>
                                        </Pressable>
                                      ) : (
                                        <Pressable
                                          onPress={() => leaveCircle(circle)}
                                          style={[styles.circleManageButton, pendingCircleLeaveId === circle._id && styles.activeCircleManageButton]}
                                        >
                                          <Text style={[styles.circleManageText, pendingCircleLeaveId === circle._id && styles.activeCircleManageText]}>
                                            {pendingCircleLeaveId === circle._id ? "Confirm leave" : "Leave circle"}
                                          </Text>
                                        </Pressable>
                                      )}
                                    </View>
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    )}
                    {(communityCircles || []).length === 0 && (
                      <View style={[styles.emptyCommunityBox, communityDarkMode && styles.accountDarkInsetBox]}>
                        <Text style={[styles.communityTitle, communityDarkMode && styles.accountDarkTitle]}>No private circles yet</Text>
                        <Text style={[styles.helpIntro, communityDarkMode && styles.accountDarkMutedText]}>Create one or join with an invite code when you are ready.</Text>
                      </View>
                    )}
                    <View style={[styles.circleManagementBox, communityDarkMode && styles.accountDarkInsetBox, phoneLayout && styles.phoneCircleManagementBox]}>
                      <Pressable onPress={() => toggleRememberedPanel(setCircleManagerOpen, "communityCircleToolsOpen")} style={[styles.circleManagerToggle, communityDarkMode && styles.homeDarkResumeButton]}>
                        <Ionicons name="settings-outline" size={14} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                        <Text style={[styles.circleManageText, communityDarkMode && styles.homeDarkResumeButtonText]}>{circleManagerOpen || (communityCircles || []).length === 0 ? "Hide circle tools" : "Create or join"}</Text>
                        <Ionicons name={circleManagerOpen || (communityCircles || []).length === 0 ? "chevron-up-outline" : "chevron-down-outline"} size={15} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                      </Pressable>
                      {(circleManagerOpen || (communityCircles || []).length === 0) && (
                        <View style={styles.circleManagementContent}>
                          <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>Create or join a circle</Text>
                          <View style={[styles.circleActionGrid, phoneLayout && styles.phoneCircleActionGrid]}>
                            <View style={[styles.circleActionBox, communityDarkMode && styles.accountDarkSection, phoneLayout && styles.phoneCircleActionBox]}>
                              <Text style={[styles.lastCheckinLabel, communityDarkMode && styles.studyDarkAccentText]}>Create</Text>
                              <TextInput value={circleName} onChangeText={setCircleName} placeholder="Circle name" placeholderTextColor={communityDarkMode ? "#8f8678" : undefined} style={[styles.input, communityDarkMode && styles.accountDarkInput, phoneLayout && styles.phoneCommunityInput]} />
                              <AppButton label="Create circle" variant="secondary" onPress={createCircle} style={phoneLayout && styles.phoneFullWidthButton} labelStyle={phoneLayout && styles.phoneCommunityButtonLabel} />
                            </View>
                            <View style={[styles.circleActionBox, communityDarkMode && styles.accountDarkSection, phoneLayout && styles.phoneCircleActionBox]}>
                              <Text style={[styles.lastCheckinLabel, communityDarkMode && styles.studyDarkAccentText]}>Join</Text>
                              <TextInput value={circleInviteCode} onChangeText={(value) => setCircleInviteCode(value.toUpperCase())} placeholder="Invite code" placeholderTextColor={communityDarkMode ? "#8f8678" : undefined} autoCapitalize="characters" style={[styles.input, communityDarkMode && styles.accountDarkInput, phoneLayout && styles.phoneCommunityInput]} />
                              <AppButton label="Join circle" variant="secondary" onPress={joinCircle} style={phoneLayout && styles.phoneFullWidthButton} labelStyle={phoneLayout && styles.phoneCommunityButtonLabel} />
                            </View>
                          </View>
                        </View>
                      )}
                      {!!circleStatus && <Text style={[styles.saveStatus, communityDarkMode && styles.accountDarkMutedText]}>{circleStatus}</Text>}
                      </View>
                      </>
                    ) : COMMUNITY_CIRCLES_ENABLED ? (
                      <AppButton label="Open account" variant="secondary" onPress={() => setTab("account")} style={phoneLayout && styles.phoneFullWidthButton} labelStyle={phoneLayout && styles.phoneCommunityButtonLabel} />
                    ) : (
                      <Text style={[styles.saveStatus, communityDarkMode && styles.accountDarkMutedText]}>Encouragements still save privately and can be copied or sent as before.</Text>
                    )}
                  </>
                )}
              </View>
              </View>
              <View style={[styles.communityStepBlock, phoneLayout && styles.phoneCommunityStepBlock]}>
                <View style={styles.communityStepHeader}>
                  <View style={styles.communityStepBadge}>
                    <Text style={styles.communityStepBadgeText}>1</Text>
                  </View>
                  <View style={styles.journalTitleBlock}>
                    <Text style={[styles.feedbackTitle, communityDarkMode && styles.accountDarkTitle]}>Choose a friend or circle</Text>
                  </View>
                </View>
                {hasAvailableCommunityTarget ? (
                  <>
                    <Pressable onPress={() => setCommunityTargetPickerOpen((open) => !open)} style={[styles.communityTargetSelect, communityDarkMode && styles.accountDarkInsetBox]}>
                      <View style={styles.communityTargetSelectTextBlock}>
                        <Text style={[styles.communityRecipientText, communityDarkMode && styles.accountDarkTitle]}>{activeCommunityTargetName || "Choose a connection"}</Text>
                      </View>
                      <Ionicons name={communityTargetPickerOpen ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                    </Pressable>
                    {communityTargetPickerOpen && (
                      <View style={[styles.communityTargetPickerPanel, communityDarkMode && styles.accountDarkInsetBox]}>
                        {acceptedCommunityFriends.length > 0 && (
                          <View style={styles.communityTargetPickerGroup}>
                            <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>Friends - select one or more</Text>
                            {acceptedCommunityFriends.map((friend: any) => {
                              const isTarget = communityTargetType === "friend" && targetFriendIds.some((id) => String(id) === String(friend._id));
                              return (
                                <Pressable
                                  key={friend._id}
                                  onPress={() => {
                                    setCommunityTargetType("friend");
                                    setTargetFriendIds((current) => {
                                      const alreadySelected = current.some((id) => String(id) === String(friend._id));
                                      return alreadySelected ? current.filter((id) => String(id) !== String(friend._id)) : [...current, friend._id];
                                    });
                                  }}
                                  style={[styles.communityTargetOption, communityDarkMode && styles.accountDarkSection, isTarget && styles.activeCommunityTargetOption]}
                                >
                                  <Ionicons name={isTarget ? "checkmark-circle-outline" : "ellipse-outline"} size={16} color={communityDarkMode && !isTarget ? "#e9b76a" : colors.oliveDark} />
                                  <View style={styles.journalTitleBlock}>
                                    <Text style={[styles.communityTargetOptionTitle, communityDarkMode && styles.accountDarkTitle]}>{friend.name}</Text>
                                    {!!friend.email && <Text style={[styles.circleChipMeta, communityDarkMode && styles.accountDarkMutedText]}>{friend.email}</Text>}
                                  </View>
                                </Pressable>
                              );
                            })}
                          </View>
                        )}
                        {(communityCircles || []).length > 0 && (
                          <View style={styles.communityTargetPickerGroup}>
                            <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>Circles</Text>
                            {(communityCircles || []).map((circle: any) => {
                              const isTarget = communityTargetType === "circle" && String(targetCircleId) === String(circle._id);
                              return (
                                <Pressable
                                  key={circle._id}
                                  onPress={() => {
                                    setCommunityTargetType("circle");
                                    setTargetCircleId(circle._id);
                                    setCommunityTargetPickerOpen(false);
                                  }}
                                  style={[styles.communityTargetOption, communityDarkMode && styles.accountDarkSection, isTarget && styles.activeCommunityTargetOption]}
                                >
                                  <Ionicons name={isTarget ? "checkmark-circle-outline" : "people-outline"} size={16} color={communityDarkMode && !isTarget ? "#e9b76a" : colors.oliveDark} />
                                  <View style={styles.journalTitleBlock}>
                                    <Text style={[styles.communityTargetOptionTitle, communityDarkMode && styles.accountDarkTitle]}>{circle.name}</Text>
                                    <Text style={[styles.circleChipMeta, communityDarkMode && styles.accountDarkMutedText]}>
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
                    <Text style={[styles.helpIntro, communityDarkMode && styles.accountDarkMutedText]}>
                      {communityTargetType === "circle"
                        ? "Saving can post this encouragement to the selected circle."
                        : "Saving can post this encouragement to your selected friend or friends."}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.communityRecipientText, communityDarkMode && styles.accountDarkTitle]}>No friend or circle selected</Text>
                    <Text style={[styles.helpIntro, communityDarkMode && styles.accountDarkMutedText]}>{`${friendlyName}, add a registered friend or join a private circle above.`}</Text>
                  </>
                )}
              </View>
              <View style={styles.communityStepHeader}>
                <View style={styles.communityStepBadge}>
                  <Text style={styles.communityStepBadgeText}>2</Text>
                </View>
                <View style={styles.journalTitleBlock}>
                  <Text style={[styles.feedbackTitle, communityDarkMode && styles.accountDarkTitle]}>Write one honest update</Text>
                </View>
              </View>
              <TextInput
                multiline
                value={checkinNote}
                onChangeText={setCheckinNote}
                placeholder="Example: I studied Psalm 23 and was reminded that God leads me one step at a time."
                placeholderTextColor={communityDarkMode ? "#8f8678" : undefined}
                style={[styles.input, styles.textarea, communityDarkMode && styles.accountDarkInput, phoneLayout && styles.phoneCheckinTextarea]}
              />
              <View style={[styles.communityStepBlock, phoneLayout && styles.phoneCommunityStepBlock]}>
                <View style={styles.communityStepHeader}>
                  <View style={styles.communityStepBadge}>
                    <Text style={styles.communityStepBadgeText}>3</Text>
                  </View>
                  <View style={styles.journalTitleBlock}>
                    <Text style={[styles.feedbackTitle, communityDarkMode && styles.accountDarkTitle]}>Post encouragement</Text>
                  </View>
                </View>
                <Text style={[styles.shareMessageText, communityDarkMode && styles.accountDarkText, phoneLayout && styles.phoneShareMessageText]}>{communityMessage}</Text>
                <AppButton
                  label={isSavingCheckin ? "Posting..." : "Post"}
                  onPress={persistCheckin}
                  style={phoneLayout && styles.phoneFullWidthButton}
                  labelStyle={phoneLayout && styles.phoneCommunityButtonLabel}
                />
                {!!communityStatus && <Text style={[styles.saveStatus, communityDarkMode && styles.accountDarkMutedText]}>{communityStatus}</Text>}
              </View>
                </>
              ) : (
                <View style={[styles.communityHistoryPanel, communityDarkMode && styles.accountDarkSection]}>
                  <View style={styles.feedbackHeader}>
                    <Ionicons name="albums-outline" size={18} color={colors.coral} />
                    <Text style={[styles.feedbackTitle, communityDarkMode && styles.accountDarkTitle]}>Encouragement history</Text>
                  </View>
                  <Text style={[styles.helpIntro, communityDarkMode && styles.accountDarkMutedText]}>Review, edit, copy, or remove your saved encouragements. Circle posts stay grouped by where they were shared.</Text>
                  <View style={styles.communityHistoryFilterRow}>
                    {[
                      ["all", "All"],
                      ["private", "Private"],
                      ["circles", "Circles"]
                    ].map(([key, label]) => (
                      <Pressable
                        key={key}
                        onPress={() => {
                          setCommunityHistoryFilter(key as "all" | "private" | "circles");
                          if (key !== "circles") setCommunityHistoryCircleId("all");
                        }}
                        style={[styles.filterChip, communityDarkMode && styles.printDarkOptionChip, communityHistoryFilter === key && styles.activeFilterChip]}
                      >
                        <Text style={[styles.filterText, communityDarkMode && styles.accountDarkMutedText, communityHistoryFilter === key && styles.activeFilterText]}>{label}</Text>
                      </Pressable>
                    ))}
                  </View>
                  {communityHistoryFilter === "circles" && communityHistoryCircleOptions.length > 1 && (
                    <View style={styles.communityHistoryFilterRow}>
                      <Pressable
                        onPress={() => setCommunityHistoryCircleId("all")}
                        style={[styles.filterChip, communityDarkMode && styles.printDarkOptionChip, communityHistoryCircleId === "all" && styles.activeFilterChip]}
                      >
                        <Text style={[styles.filterText, communityDarkMode && styles.accountDarkMutedText, communityHistoryCircleId === "all" && styles.activeFilterText]}>All circles</Text>
                      </Pressable>
                      {communityHistoryCircleOptions.map((circle) => (
                        <Pressable
                          key={circle.circleId}
                          onPress={() => setCommunityHistoryCircleId(circle.circleId)}
                          style={[styles.filterChip, communityDarkMode && styles.printDarkOptionChip, communityHistoryCircleId === circle.circleId && styles.activeFilterChip]}
                        >
                          <Text style={[styles.filterText, communityDarkMode && styles.accountDarkMutedText, communityHistoryCircleId === circle.circleId && styles.activeFilterText]}>{circle.circleName}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  {communityHistoryGroups.length === 0 ? (
                    <View style={[styles.emptyCommunityBox, communityDarkMode && styles.accountDarkInsetBox]}>
                      <Text style={[styles.communityTitle, communityDarkMode && styles.accountDarkTitle]}>No posts found</Text>
                      <Text style={[styles.helpIntro, communityDarkMode && styles.accountDarkMutedText]}>Try another filter, or post a new encouragement or study insight.</Text>
                    </View>
                  ) : (
                    <View style={styles.communityHistoryGroupList}>
                      {communityHistoryGroups.map((group) => (
                        <View key={group.title} style={[styles.communityHistoryGroup, communityDarkMode && styles.accountDarkInsetBox]}>
                          <View style={styles.circleSelectorHeader}>
                            <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>{group.title}</Text>
                            <Text style={[styles.circleCountText, communityDarkMode && styles.accountDarkMutedText]}>{group.items.length}</Text>
                          </View>
                          <View style={styles.circleList}>
                            {group.items.map((item: any) => renderCommunityHistoryItem(item))}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                  {!!communityStatus && <Text style={[styles.saveStatus, communityDarkMode && styles.accountDarkMutedText]}>{communityStatus}</Text>}
                </View>
              )}
            </Card>

            {communitySubView !== "history" && <Card style={[styles.coachCard, compactLayout && styles.fluidCard, communityDarkMode && styles.accountDarkMainCard]}>
              <View style={[styles.communityGoalBox, communityDarkMode && styles.accountDarkSection]}>
                <View style={styles.feedbackHeader}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.coral} />
                  <Text style={[styles.feedbackTitle, communityDarkMode && styles.accountDarkTitle]}>Community boundary</Text>
                </View>
                <Text style={[styles.helpIntro, communityDarkMode && styles.accountDarkMutedText]}>Community is intentionally limited to accepted friends and invite-only circles. It is not a public timeline or open messaging system.</Text>
              </View>
              <View style={styles.communityDivider} />
              <View style={styles.feedbackHeader}>
                <Ionicons name="time-outline" size={18} color={colors.coral} />
                  <Text style={[styles.feedbackTitle, communityDarkMode && styles.accountDarkTitle]}>Recent encouragements</Text>
              </View>
              {(checkins || []).length === 0 ? (
                <View style={[styles.emptyCommunityBox, communityDarkMode && styles.accountDarkInsetBox]}>
                  <Text style={[styles.communityTitle, communityDarkMode && styles.accountDarkTitle]}>No encouragements yet</Text>
                  <Text style={[styles.helpIntro, communityDarkMode && styles.accountDarkMutedText]}>{`After your next study, ${friendlyName}, save one sentence here and keep the rhythm visible.`}</Text>
                </View>
              ) : (
                <>
                  {visibleCheckins.map((item: any) => renderCommunityHistoryItem(item))}
                  {(checkins || []).length > 3 && (
                    <Pressable onPress={() => toggleRememberedPanel(setRecentCheckinsExpanded, "communityRecentExpanded")} style={[styles.communityShowMoreButton, communityDarkMode && styles.homeDarkResumeButton]}>
                      <Text style={[styles.communityShowMoreText, communityDarkMode && styles.homeDarkResumeButtonText]}>{recentCheckinsExpanded ? "Show latest 3" : `Show more (${(checkins || []).length - 3})`}</Text>
                      <Ionicons name={recentCheckinsExpanded ? "chevron-up-outline" : "chevron-down-outline"} size={14} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                    </Pressable>
                  )}
                </>
              )}
            </Card>}
          </View>
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
                      <Pressable onPress={() => setAuthFlow("signIn")} style={[styles.authFlowButton, authFlow === "signIn" && styles.activeAuthFlowButton, accountDarkMode && authFlow === "signIn" && styles.accountDarkActiveSegment]}>
                        <Text style={[styles.authFlowText, accountDarkMode && styles.accountDarkMutedText, authFlow === "signIn" && styles.activeAuthFlowText]}>Sign in</Text>
                      </Pressable>
                      <Pressable onPress={() => setAuthFlow("signUp")} style={[styles.authFlowButton, authFlow === "signUp" && styles.activeAuthFlowButton, accountDarkMode && authFlow === "signUp" && styles.accountDarkActiveSegment]}>
                        <Text style={[styles.authFlowText, accountDarkMode && styles.accountDarkMutedText, authFlow === "signUp" && styles.activeAuthFlowText]}>Create account</Text>
                      </Pressable>
                    </View>
                    {authFlow === "signUp" && (
                      <TextInput
                        value={authName}
                        onChangeText={setAuthName}
                        autoCapitalize="words"
                        placeholder="Your name"
                        placeholderTextColor={accountDarkMode ? "#9d927f" : undefined}
                        style={[styles.input, styles.accountAuthInput, accountDarkMode && styles.accountDarkInput]}
                      />
                    )}
                    <TextInput
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
                  <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Display name" placeholderTextColor={accountDarkMode ? "#9d927f" : undefined} style={[styles.input, accountDarkMode && styles.accountDarkInput]} />
                  {!!profile?.authUsername && (
                    <View style={[styles.signedInBadge, styles.accountUsernameBadge, accountDarkMode && styles.accountDarkBadge]}>
                      <Ionicons name="person-circle-outline" size={16} color={accountDarkMode ? "#e9b76a" : colors.oliveDark} />
                      <Text style={[styles.signedInBadgeText, accountDarkMode && styles.accountDarkBadgeText]}>{`Username: @${profile.authUsername}`}</Text>
                    </View>
                  )}
                  <TextInput
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
                    value={currentAccountPassword}
                    onChangeText={setCurrentAccountPassword}
                    autoCapitalize="none"
                    secureTextEntry
                    placeholder="Current password"
                    placeholderTextColor={accountDarkMode ? "#9d927f" : undefined}
                    style={[styles.input, accountDarkMode && styles.accountDarkInput]}
                  />
                  <TextInput
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
                <Text style={[styles.sectionTitle, accountDarkMode && styles.accountDarkTitle]}>Bible translations</Text>
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
                    Bible Study Tutor is intentionally free and built for churches, groups, and personal study. These translations let the app support reading, study notes, memory verses, journaling, and printable worksheets without putting commercial Bible licensing costs onto users.
                  </Text>
                </View>
              </View>
              {isAuthenticated && (
                <View style={[styles.accountSection, accountDarkMode && styles.accountDarkSection]}>
                  <Text style={[styles.sectionTitle, accountDarkMode && styles.accountDarkTitle]}>Coaching preference</Text>
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
                    <Ionicons name={showCoaching ? "bulb" : "bulb-outline"} size={20} color={accountDarkMode ? "#e9b76a" : colors.oliveDark} />
                    <View style={styles.aiOptionCopy}>
                      <Text style={[styles.aiOptionTitle, accountDarkMode && styles.accountDarkTitle]}>{showCoaching ? "Coaching is on" : "Coaching is off"}</Text>
                      <Text style={[styles.aiOptionText, accountDarkMode && styles.accountDarkMutedText]}>{showCoaching ? "Tap to hide coaching prompts in Study." : "Tap to show coaching prompts in Study."}</Text>
                    </View>
                  </Pressable>
                </View>
              )}
              {isAuthenticated && (
                <View style={[styles.accountSection, accountDarkMode && styles.accountDarkSection]}>
                  <Text style={[styles.sectionTitle, accountDarkMode && styles.accountDarkTitle]}>Your saved data</Text>
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
              {DARK_MODE_ENABLED && (
                <View style={[styles.accountSection, accountDarkMode && styles.accountDarkSection]}>
                  <Text style={[styles.sectionTitle, accountDarkMode && styles.accountDarkTitle]}>Appearance</Text>
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
              <View
                onLayout={(event) => {
                  accountLegalYRef.current = event.nativeEvent.layout.y;
                }}
                style={[styles.accountSection, accountDarkMode && styles.accountDarkSection]}
              >
                <Text style={[styles.sectionTitle, accountDarkMode && styles.accountDarkTitle]}>Legal</Text>
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
                <View style={[styles.accountSection, accountDarkMode && styles.accountDarkSection]}>
                  <Text style={[styles.sectionTitle, accountDarkMode && styles.accountDarkTitle]}>Account deletion</Text>
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
            </Card>
            {isAuthenticated && (
              <Card style={[styles.coachCard, compactLayout && styles.fluidCard, accountDarkMode && styles.accountDarkMainCard]}>
                <View style={[styles.accountStatusBox, accountDarkMode && styles.accountDarkSection]}>
                  <View style={styles.feedbackHeader}>
                    <Ionicons name={profile?.authProvider === "google" ? "logo-google" : profile?.authProvider === "apple" ? "logo-apple" : "person-circle-outline"} size={18} color={accountDarkMode ? "#e9b76a" : colors.coral} />
                    <Text style={[styles.feedbackTitle, accountDarkMode && styles.accountDarkTitle]}>Account status</Text>
                  </View>
                  <Text style={[styles.communityTitle, accountDarkMode && styles.accountDarkTitle]}>{`Signed in with ${accountProviderLabel}`}</Text>
                  <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>
                    {`${accountIdentityLabel} is connected for cross-device sync.`}
                  </Text>
                </View>
                <View style={[styles.accountStatusBox, accountDarkMode && styles.accountDarkSection]}>
                  <View style={styles.feedbackHeader}>
                    <Ionicons name="cloud-done-outline" size={18} color={accountDarkMode ? "#e9b76a" : colors.coral} />
                    <Text style={[styles.feedbackTitle, accountDarkMode && styles.accountDarkTitle]}>Save status</Text>
                  </View>
                  <Text style={[styles.communityTitle, accountDarkMode && styles.accountDarkTitle]}>{backendStatusLabel}</Text>
                  <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>{backendStatusDetail}</Text>
                </View>
                <View style={[styles.accountStatusBox, accountDarkMode && styles.accountDarkSection]}>
                  <View style={styles.feedbackHeader}>
                    <Ionicons name="people-outline" size={18} color={accountDarkMode ? "#e9b76a" : colors.coral} />
                    <Text style={[styles.feedbackTitle, accountDarkMode && styles.accountDarkTitle]}>Community settings</Text>
                  </View>
                  <Text style={[styles.communityTitle, accountDarkMode && styles.accountDarkTitle]}>Encouragements live in Community</Text>
                  <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>Set your weekly goal and encouragement person or group from the Community tab.</Text>
                  <ResumeButton label="Open community" icon="people-outline" onPress={() => setTab("accountability")} style={accountDarkMode && styles.homeDarkResumeButton} labelStyle={accountDarkMode && styles.homeDarkResumeButtonText} iconColor={accountDarkMode ? "#e9b76a" : undefined} />
                </View>
                <View style={[styles.accountStatusBox, accountDarkMode && styles.accountDarkSection]}>
                  <View style={styles.feedbackHeader}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={accountDarkMode ? "#e9b76a" : colors.coral} />
                    <Text style={[styles.feedbackTitle, accountDarkMode && styles.accountDarkTitle]}>Privacy</Text>
                  </View>
                  <Text style={[styles.helpIntro, accountDarkMode && styles.accountDarkMutedText]}>Free coaching stays local. Study notes are not sent to an AI provider or paid API service.</Text>
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
          <AdminDashboard
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
        )}

        {tab === "journal" && (
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
                    onPress={() => setJournalView(key as JournalView)}
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
            <View style={[styles.filterRow, phoneLayout && styles.phoneJournalFilterRow]}>
              {[
                ["all", "All"],
                ["pinned", "Pinned"],
                ["drafts", "Drafts"],
                ["studies", "Studies"],
                ["meditations", "Meditation"],
                ["reviews", dueStudyReviewCount > 0 ? `Reviews (${dueStudyReviewCount})` : "Reviews"],
                ["highlights", `Highlights (${totalSavedHighlightCount})`],
                ["checkins", "Encouragements"]
              ].map(([key, label]) => (
                <Pressable
                  key={key}
                  onPress={() => setJournalFilter(key as JournalFilter)}
                  style={[styles.filterChip, phoneLayout && styles.phoneJournalFilterChip, journalDarkMode && styles.printDarkOptionChip, journalFilter === key && styles.activeFilterChip]}
                >
                  <Text style={[styles.filterText, phoneLayout && styles.phoneJournalFilterText, journalDarkMode && styles.accountDarkMutedText, journalFilter === key && styles.activeFilterText]}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={[styles.journalGuideBox, phoneLayout && styles.phoneJournalGuideBox, journalDarkMode && styles.accountDarkSection]}>
              <Ionicons name={journalFilter === "reviews" ? "refresh-circle-outline" : journalFilter === "highlights" ? "color-wand-outline" : journalFilter === "checkins" ? "chatbubbles-outline" : journalFilter === "meditations" ? "sparkles-outline" : "reader-outline"} size={18} color={colors.coral} />
              <Text style={[styles.journalGuideText, journalDarkMode && styles.accountDarkText]}>{buildJournalGuideText(journalFilter, totalSavedHighlightCount)}</Text>
            </View>
            {journalView === "calendar" && (
              <JournalCalendar
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
                sections={journalScriptureBookSections}
                expandedBook={expandedJournalScriptureBook}
                selectedBook={selectedJournalScriptureBook}
                selectedChapter={selectedJournalScriptureChapter}
                onToggleBook={(book) => {
                  setExpandedJournalScriptureBook((current) => (current === book ? "" : book));
                }}
                onSelectChapter={(book, chapter) => {
                  const selected = selectedJournalScriptureBook === book && selectedJournalScriptureChapter === chapter;
                  setSelectedJournalScriptureBook(selected ? "" : book);
                  setSelectedJournalScriptureChapter(selected ? 0 : chapter);
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
                  onPress={() => {
                    setSelectedJournalScriptureBook("");
                    setSelectedJournalScriptureChapter(0);
                  }}
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
                        <View style={styles.journalTitleBlock}>
                          <Text style={[styles.cardTitle, journalDarkMode && styles.accountDarkTitle]}>{draft.passageReference || draft.passage}</Text>
                          <Text style={[styles.muted, journalDarkMode && styles.accountDarkMutedText]}>
                            {draft.methodName} · Step {draft.stepIndex + 1} · Created {formatJournalCreatedDate(draft)}
                          </Text>
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
                                <FormattedNoteText text={item.answer} darkMode={journalDarkMode} />
                              </View>
                            ))}
                          <PassageMarkupSummary markups={draft.passageMarkups || []} darkMode={journalDarkMode} />
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
                {highlightJournalEntries.map((item) => {
                  const expanded = isJournalEntryExpanded(item.id) || activeReflectionEntryId === item.id;
                  return (
                    <Card key={item.id} style={[styles.journalCard, phoneLayout && styles.phoneJournalCard, !expanded && styles.collapsedJournalCard, journalDarkMode && styles.accountDarkMainCard]}>
                      <Pressable onPress={() => toggleJournalEntryExpanded(item.id)} style={styles.journalCompactHeader}>
                        <View style={styles.journalTitleBlock}>
                          <Text style={[styles.cardTitle, journalDarkMode && styles.accountDarkTitle]}>{item.passage}</Text>
                          <Text style={[styles.muted, journalDarkMode && styles.accountDarkMutedText]}>
                            {item.methodName} · Created {formatJournalCreatedDate(item)}
                          </Text>
                        </View>
                        <View style={styles.journalStatusCluster}>
                          <Text style={[styles.draftPill, journalDarkMode && styles.plansDarkDraftPill]}>{item.source === "draft" ? "Draft" : `${item.markups.length} highlight${item.markups.length === 1 ? "" : "s"}`}</Text>
                          <Ionicons name={expanded ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={journalDarkMode ? "#c8bda9" : colors.muted} />
                        </View>
                      </Pressable>
                      {expanded && (
                        <>
                          <PassageMarkupSummary markups={item.markups} darkMode={journalDarkMode} />
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
                {journalEntries.map((entry: any) => {
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
                      <View style={styles.journalTitleBlock}>
                        <Text style={[styles.cardTitle, journalDarkMode && styles.accountDarkTitle]}>{entryTitle}</Text>
                        <Text style={[styles.muted, journalDarkMode && styles.accountDarkMutedText]}>{entry.methodName ? `${entry.methodName} · Created ${formatJournalCreatedDate(entry)}` : `Created ${formatJournalCreatedDate(entry)}`}</Text>
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
                          <PassageMarkupSummary markups={entry.passageMarkups || []} darkMode={journalDarkMode} />
                          {entry.answers
                            .filter((item: any) => item.answer.trim())
                            .map((item: any) => (
                              <View key={item.stepTitle}>
                                {memoryMeditation && item.stepTitle === "Scripture" ? (
                                  <JournalMeditationScripture text={item.answer} darkMode={journalDarkMode} />
                                ) : memoryMeditation ? (
                                  <JournalMeditationAnswer title={item.stepTitle} text={item.answer} darkMode={journalDarkMode} />
                                ) : (
                                  <>
                                    <Text style={[styles.body, journalDarkMode && styles.accountDarkText]}>
                                      <Text style={styles.bold}>{item.stepTitle}: </Text>
                                    </Text>
                                    <FormattedNoteText text={item.answer} darkMode={journalDarkMode} />
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
                        <HighlightReflectionSummary note={entry.note || ""} darkMode={journalDarkMode} />
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
                            {entry.answers && !memoryMeditation && (
                              <ResumeButton
                                label={reviewScheduleStudyId === rawEntryId ? "Hide schedule" : "Review later"}
                                icon="calendar-outline"
                                onPress={() => setReviewScheduleStudyId(reviewScheduleStudyId === rawEntryId ? "" : rawEntryId)}
                                style={[phoneLayout && styles.phoneJournalActionButton, journalDarkMode && styles.homeDarkResumeButton]}
                                labelStyle={[phoneLayout && styles.phoneJournalActionText, journalDarkMode && styles.homeDarkResumeButtonText]}
                                iconColor={journalDarkMode ? "#e9b76a" : undefined}
                              />
                            )}
                            {!entry.answers && <ResumeButton label="Edit entry" icon="create-outline" onPress={() => startEditJournalEntry(entry)} style={[phoneLayout && styles.phoneJournalActionButton, journalDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneJournalActionText, journalDarkMode && styles.homeDarkResumeButtonText]} iconColor={journalDarkMode ? "#e9b76a" : undefined} />}
                          </>
                        )}
                        <ResumeButton
                          label={pendingDeleteJournalEntryId === rawEntryId ? "Confirm delete" : "Delete entry"}
                          icon="trash-outline"
                          onPress={() => deleteJournalEntry(entry)}
                          style={[phoneLayout && styles.phoneJournalActionButton, journalDarkMode && styles.homeDarkResumeButton]}
                          labelStyle={[phoneLayout && styles.phoneJournalActionText, journalDarkMode && styles.homeDarkResumeButtonText]}
                          iconColor={journalDarkMode ? "#e9b76a" : undefined}
                        />
                      </View>
                      {entry.answers && !memoryMeditation && reviewScheduleStudyId === rawEntryId && (
                        <View style={[styles.reviewScheduleBox, journalDarkMode && styles.accountDarkInsetBox]}>
                          <Text style={[styles.lastCheckinLabel, journalDarkMode && styles.studyDarkAccentText]}>Bring this study back</Text>
                          <View style={styles.reviewPresetRow}>
                            {STUDY_REVIEW_OPTIONS.map((option) => (
                              <Pressable
                                key={option.id}
                                onPress={() => {
                                  scheduleStudyReview(entry._id, option.id);
                                  setReviewScheduleStudyId("");
                                }}
                                style={[styles.filterChip, journalDarkMode && styles.printDarkOptionChip]}
                              >
                                <Text style={[styles.filterText, journalDarkMode && styles.accountDarkMutedText]}>{option.label}</Text>
                              </Pressable>
                            ))}
                          </View>
                          <CustomStudyReviewControl
                            value={customStudyReviewDays}
                            onChange={setCustomStudyReviewDays}
                            onSchedule={() => {
                              scheduleStudyReview(entry._id);
                              setReviewScheduleStudyId("");
                            }}
                          />
                        </View>
                      )}
                    </>
                  )}
                </Card>
              );
                })}
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
          </View>
        )}

        {tab === "help" && (
          <View style={[styles.helpPage, helpDarkMode && styles.accountDarkLayout]}>
            <Card style={[styles.helpHeroCard, helpDarkMode && styles.accountDarkMainCard]}>
              <Eyebrow>Help</Eyebrow>
              <Text style={[styles.title, helpDarkMode && styles.accountDarkTitle]}>{firstName ? `${firstName}, start here` : "Start here"}</Text>
              <Text style={[styles.titleSupport, helpDarkMode && styles.accountDarkMutedText]}>
                Bible Study Tutor is a free Bible study app for desktop and mobile, made to help people and churches read, study, remember, journal, share Scripture, and print worksheets for pen-and-paper study.
              </Text>
              <View style={styles.helpActionRow}>
                <AppButton label="Read the Bible" onPress={() => setTab("bible")} style={phoneLayout && styles.phoneFullWidthButton} />
                <AppButton
                  label="Start a study"
                  variant="secondary"
                  onPress={() => setTab("study")}
                  style={[phoneLayout && styles.phoneFullWidthButton, helpDarkMode && styles.homeDarkResumeButton]}
                  labelStyle={helpDarkMode && styles.homeDarkResumeButtonText}
                />
                <AppButton
                  label="Open journal"
                  variant="secondary"
                  onPress={() => setTab("journal")}
                  style={[phoneLayout && styles.phoneFullWidthButton, helpDarkMode && styles.homeDarkResumeButton]}
                  labelStyle={helpDarkMode && styles.homeDarkResumeButtonText}
                />
              </View>
            </Card>

            <Card style={[styles.helpShareCard, phoneLayout && styles.phoneHelpShareCard, helpDarkMode && styles.accountDarkMainCard]}>
              <View style={styles.helpShareCopy}>
                <View style={styles.feedbackHeader}>
                  <Ionicons name="qr-code-outline" size={19} color={helpDarkMode ? "#e9b76a" : colors.coral} />
                  <Text style={[styles.helpCardTitle, helpDarkMode && styles.accountDarkTitle]}>Share Bible Study Tutor</Text>
                </View>
                <Text style={[styles.helpShareTitle, helpDarkMode && styles.accountDarkTitle]}>Invite someone to study Scripture with you.</Text>
                <Text style={[styles.helpCardText, helpDarkMode && styles.accountDarkMutedText]}>
                  Bible Study Tutor is free and works on desktop and mobile. Scan the QR code, copy the link, or send it straight to a friend, church group, or Bible study partner.
                </Text>
                <Text selectable style={[styles.helpShareUrl, helpDarkMode && styles.helpDarkShareUrl]}>biblestudytutor.org</Text>
                <View style={styles.helpShareActions}>
                  <ResumeButton label="Share app" icon="share-outline" onPress={shareAppLink} style={[phoneLayout && styles.phoneHelpShareButton, helpDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneHelpShareButtonText, helpDarkMode && styles.homeDarkResumeButtonText]} iconColor={helpDarkMode ? "#e9b76a" : undefined} />
                  <ResumeButton label="Copy link" icon="copy-outline" onPress={copyAppLink} style={[phoneLayout && styles.phoneHelpShareButton, helpDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneHelpShareButtonText, helpDarkMode && styles.homeDarkResumeButtonText]} iconColor={helpDarkMode ? "#e9b76a" : undefined} />
                </View>
                {!!appShareStatus && <Text style={styles.saveStatus}>{appShareStatus}</Text>}
              </View>
              <View style={[styles.helpQrFrame, helpDarkMode && styles.helpDarkQrFrame]}>
                <Image source={{ uri: helpDarkMode ? APP_SHARE_QR_DARK_URI : APP_SHARE_QR_URI }} style={styles.helpQrImage} />
                <Text style={[styles.helpQrCaption, helpDarkMode && styles.accountDarkMutedText]}>Scan to open</Text>
              </View>
            </Card>

            <View style={[styles.helpQuickGrid, phoneLayout && styles.phoneHelpGrid]}>
              {[
                ["1", "Choose Scripture", "Open Bible, search, or type a passage in Study.", "reader-outline"],
                ["2", "Respond honestly", "Use a method, write notes, highlight verses, and save your study.", "create-outline"],
                ["3", "Print when useful", "Create worksheets for pen-and-paper study, groups, or church handouts.", "print-outline"],
                ["4", "Return later", "Review your journal, practise memory verses, and share encouragements.", "refresh-circle-outline"]
              ].map(([number, title, body, icon]) => (
                <Card key={title} style={[styles.helpQuickCard, phoneLayout && styles.phoneHelpCard, helpDarkMode && styles.accountDarkMainCard]}>
                  <View style={[styles.helpStepNumber, helpDarkMode && styles.helpDarkStepNumber]}><Text style={styles.helpStepNumberText}>{number}</Text></View>
                  <Ionicons name={icon as any} size={20} color={helpDarkMode ? "#e9b76a" : colors.coral} />
                  <Text style={[styles.helpCardTitle, helpDarkMode && styles.accountDarkTitle]}>{title}</Text>
                  <Text style={[styles.helpCardText, helpDarkMode && styles.accountDarkMutedText]}>{body}</Text>
                </Card>
              ))}
            </View>

            <View style={[styles.helpWalkthroughGrid, phoneLayout && styles.phoneHelpGrid]}>
              <HelpScreenshot
                title="Bible reader"
                caption="Read by book and chapter, search Scripture, then tap Read to open a result with that verse selected."
                variant="bible"
                darkMode={helpDarkMode}
                styles={styles}
              />
              <HelpScreenshot
                title="Guided study"
                caption="Follow the current step, write notes in the box, then save and continue. Focus mode hides extra panels."
                variant="study"
                darkMode={helpDarkMode}
                styles={styles}
              />
              <HelpScreenshot
                title="Memory practice"
                caption="Save verses to Memory, practise them in three steps, meditate slowly, or download editable verse cards."
                variant="memory"
                darkMode={helpDarkMode}
                styles={styles}
              />
              <HelpScreenshot
                title="Journal review"
                caption="Your saved studies, highlights, encouragements, and reflections collect here for later review."
                variant="journal"
                darkMode={helpDarkMode}
                styles={styles}
              />
            </View>

            <Card style={[styles.helpSectionCard, helpDarkMode && styles.accountDarkMainCard]}>
              <Text style={[styles.sectionTitle, helpDarkMode && styles.accountDarkTitle]}>Step-by-step guide</Text>
              <View style={[styles.helpGuideGrid, phoneLayout && styles.phoneHelpGuideGrid]}>
                {[
                  {
                    icon: "reader-outline",
                    title: "Read and navigate Scripture",
                    steps: [
                      "Open Bible from the menu.",
                      "Choose Old Testament or New Testament, then choose a book.",
                      "Select a chapter from the chapter grid.",
                      "Use Previous and Next at the bottom to keep reading."
                    ],
                    action: "Open Bible",
                    target: "bible"
                  },
                  {
                    icon: "search-outline",
                    title: "Search for a passage or idea",
                    steps: [
                      "Open Bible and expand Search Scripture.",
                      "Type exact words, a theme, or a question.",
                      "On mobile, tap Search criteria to choose All, a Testament, match type, or a book.",
                      "Use the result counts beside Old Testament and New Testament to scan quickly.",
                      "Tap Read to open the result in the Bible reader, or Study to open it in the guided study area."
                    ],
                    action: "Try search",
                    target: "bible"
                  },
                  {
                    icon: "color-wand-outline",
                    title: "Highlight or note verses",
                    steps: [
                      "In Bible or Study, tap a verse to select it.",
                      "Tap another verse to select a range.",
                      "Choose a highlight colour, Note, Bookmark, Study, or Memory.",
                      "On mobile, use the action bar that appears near the bottom."
                    ],
                    action: "Read Scripture",
                    target: "bible"
                  },
                  {
                    icon: "book-outline",
                    title: "Complete a guided study",
                    steps: [
                      "Open Study and choose a passage.",
                      "Pick a method, or keep the suggested method.",
                      "Write a response for each step and use the editor tools if you want bold, italics, underline, highlights, or inserted Scripture.",
                      "Review, add a shareable insight, then save to Journal."
                    ],
                    action: "Start study",
                    target: "study"
                  },
                  {
                    icon: "print-outline",
                    title: "Print a worksheet",
                    steps: [
                      "In Bible, select one or more verses and tap Print.",
                      "In Study, use Print worksheet to print the current passage.",
                      "If verses are selected in Study, the worksheet prints just those verses.",
                      "On phone, open the worksheet, then use Share to Print or Save to Files."
                    ],
                    action: "Open Bible",
                    target: "bible"
                  },
                  {
                    icon: "sparkles-outline",
                    title: "Memorize Scripture",
                    steps: [
                      "Save a verse to Memory from Bible or Study.",
                      "Open Memory and press Practice.",
                      "Read the verse, fill every second word, then fill all words.",
                      "Use hints when needed and set the next review date.",
                      "Use Meditate when you want to slow down with one verse."
                    ],
                    action: "Open Memory",
                    target: "memory"
                  },
                  {
                    icon: "albums-outline",
                    title: "Print memory cards",
                    steps: [
                      "Open Memory and press Print cards.",
                      "Choose due, reviewed, all, current view, or custom verses.",
                      "Choose pocket or large cards and how many copies you want.",
                      "Download the Word document, then print or adjust it in Word, Pages, or Google Docs."
                    ],
                    action: "Open Memory",
                    target: "memory"
                  },
                  {
                    icon: "journal-outline",
                    title: "Review your journal",
                    steps: [
                      "Open Journal to see saved studies and encouragements.",
                      "Use List for quick scanning.",
                      "Use Calendar to review by date.",
                      "Use Scripture view to browse entries by book and chapter."
                    ],
                    action: "Open Journal",
                    target: "journal"
                  },
                  {
                    icon: "time-outline",
                    title: "Understand your daily rhythm",
                    steps: [
                      "Your rhythm grows when you engage with Scripture in the app.",
                      "Reading, study, memory, encouragements, bookmarks, searches, and worksheets can count.",
                      "It shows a steady pattern, not a score to feel guilty about.",
                      "A grace day helps if you miss one day after recent activity."
                    ],
                    action: "Go Home",
                    target: "home"
                  }
                ].map((item) => (
                  <View key={item.title} style={[styles.helpGuideItem, phoneLayout && styles.phoneHelpGuideItem, helpDarkMode && styles.helpDarkGuideItem]}>
                    <View style={[styles.feedbackHeader, phoneLayout && styles.phoneHelpGuideHeader]}>
                      <Ionicons name={item.icon as any} size={18} color={helpDarkMode ? "#e9b76a" : colors.coral} />
                      <Text style={[styles.helpGuideTitle, helpDarkMode && styles.accountDarkTitle]}>{item.title}</Text>
                    </View>
                    <View style={styles.helpGuideStepList}>
                      {item.steps.map((stepText, index) => (
                        <View key={stepText} style={[styles.helpGuideStep, phoneLayout && styles.phoneHelpGuideStep, helpDarkMode && styles.helpDarkGuideStep]}>
                          <Text style={[styles.helpGuideStepNumber, helpDarkMode && styles.helpDarkGuideStepNumber]}>{index + 1}</Text>
                          <Text style={[styles.helpGuideStepText, phoneLayout && styles.phoneHelpGuideStepText, helpDarkMode && styles.accountDarkMutedText]}>{stepText}</Text>
                        </View>
                      ))}
                    </View>
                    <ResumeButton
                      label={item.action}
                      icon={item.icon}
                      onPress={() => setTab(item.target as Tab)}
                      style={[phoneLayout && styles.phoneHelpGuideAction, helpDarkMode && styles.homeDarkResumeButton]}
                      labelStyle={[phoneLayout && styles.phoneHelpGuideActionText, helpDarkMode && styles.homeDarkResumeButtonText]}
                      iconColor={helpDarkMode ? "#e9b76a" : undefined}
                    />
                  </View>
                ))}
              </View>
            </Card>

            <Card style={[styles.helpSectionCard, helpDarkMode && styles.accountDarkMainCard]}>
              <Text style={[styles.sectionTitle, helpDarkMode && styles.accountDarkTitle]}>What each tab is for</Text>
              <View style={styles.helpTabGrid}>
                {[
                  ["Home", "Your starting point and next best actions.", "home-outline"],
                  ["Bible", "Read, search, select verses, bookmark, note, print worksheets, and send to Study.", "reader-outline"],
                  ["Study", "Guided Bible study with notes, highlights, coaching, worksheets, and saving.", "book-outline"],
                  ["Methods", "Choose how you want to study a passage.", "layers-outline"],
                  ["Plans", "Follow short guided paths over several days.", "calendar-outline"],
                  ["Memory", "Review saved verses, meditate on Scripture, view history, and download memory cards.", "sparkles-outline"],
                  ["Community", "Share encouragements privately with accepted friends or invite-only circles.", "people-outline"],
                  ["Journal", "Review saved studies, drafts, highlights, and encouragements.", "journal-outline"],
                  ["Account", "Manage your name, sign-in, username or email account, translation, appearance, and privacy details.", "person-circle-outline"]
                ].map(([title, body, icon]) => (
                  <View key={title} style={[styles.helpTabItem, phoneLayout && styles.phoneHelpTabItem, helpDarkMode && styles.helpDarkTabItem]}>
                    <Ionicons name={icon as any} size={17} color={helpDarkMode ? "#e9b76a" : colors.oliveDark} />
                    <View style={styles.helpTabCopy}>
                      <Text style={[styles.helpFaqQuestion, helpDarkMode && styles.accountDarkTitle]}>{title}</Text>
                      <Text style={[styles.helpFaqAnswer, helpDarkMode && styles.accountDarkMutedText]}>{body}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            <Card style={[styles.helpFaqCard, helpDarkMode && styles.accountDarkMainCard]}>
              <Text style={[styles.sectionTitle, helpDarkMode && styles.accountDarkTitle]}>Common questions</Text>
              {[
                ["How do I make a note on a verse?", "In Bible, select a verse and tap Note. On mobile the note box opens in the bottom action panel."],
                ["How do I study selected verses?", "Select one or more verses in Bible, then tap Study. The app opens Study with those verses loaded."],
                ["How do I search Scripture?", "Open Bible, expand Search Scripture, type a word or idea, then press Search. On mobile, Search criteria hides the filters until you need them."],
                ["What does Read do in search results?", "Read opens the matching chapter in the Bible reader and selects the verse so you can keep reading around it."],
                ["Where do highlights go?", "Highlights stay with the saved study and can be found again from Journal."],
                ["How do I memorize a verse?", "Select verses in Bible or Study, tap Memory, then practise them from the Memory tab. You can also use Meditate for slower reflection."],
                ["Can I print memory verses?", "Yes. Open Memory, tap Print cards, choose the saved verses and copies you want, then download the editable Word document."],
                ["How do I print a worksheet?", "Select verses in Bible and tap Print, or open Study and tap Print worksheet. On phone, use Share, then Print or Save to Files."],
                ["Can I create an account without email?", "Yes. In Account, create a free account with either an email address or a unique username. You can add an email later if you want."],
                ["How do I share an insight?", "On the final Study review screen, write or keep the shareable insight, choose a friend or circle, then tap Post insight."],
                ["How does daily rhythm work?", "It is a gentle measure of regular Scripture engagement. Studies, Bible reading actions, memory practice, encouragements, bookmarks, searches, and printed worksheets can count. It also allows a grace day, so missing one day does not immediately erase the rhythm."],
                ["How do I change the Bible translation?", "Open Account, then choose BSB, WEB, or KJV under Bible translations."],
                ["How do I hide busy panels?", "Use Focus mode in Study, collapse the Bible reader panel, and use the small arrow controls on collapsible sections."],
                ["Can I use the app without signing in?", "Yes. You can use a local profile, or sign in later to carry your work between devices."]
              ].map(([question, answer]) => (
                <View key={question} style={[styles.helpFaqItem, helpDarkMode && styles.helpDarkFaqItem]}>
                  <Text style={[styles.helpFaqQuestion, helpDarkMode && styles.accountDarkTitle]}>{question}</Text>
                  <Text style={[styles.helpFaqAnswer, helpDarkMode && styles.accountDarkMutedText]}>{answer}</Text>
                </View>
              ))}
            </Card>

            <Card style={[styles.helpSectionCard, helpDarkMode && styles.accountDarkMainCard]}>
              <Text style={[styles.sectionTitle, helpDarkMode && styles.accountDarkTitle]}>Troubleshooting</Text>
              <View style={styles.helpTroubleList}>
                {[
                  ["The screen feels crowded", "Use Study Focus mode, collapse side panels, or open the mobile menu only when you need it."],
                  ["I cannot find a saved verse", "Open Memory, switch to Browse, then filter by book, chapter, or status."],
                  ["I saved a note but not a bookmark", "That is expected. A note-only verse shows the note icon; a bookmarked verse shows the bookmark icon."],
                  ["I want to find an older study", "Open Journal and use search, Calendar view, or Scripture view."],
                  ["I am not signed in", "You can keep using a local profile. Sign in from Account when you want account-connected saving."]
                ].map(([title, body]) => (
                  <View key={title} style={[styles.helpTroubleItem, helpDarkMode && styles.helpDarkTroubleItem]}>
                    <Ionicons name="alert-circle-outline" size={17} color={helpDarkMode ? "#e9b76a" : colors.coral} />
                    <View style={styles.helpTabCopy}>
                      <Text style={[styles.helpFaqQuestion, helpDarkMode && styles.accountDarkTitle]}>{title}</Text>
                      <Text style={[styles.helpFaqAnswer, helpDarkMode && styles.accountDarkMutedText]}>{body}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            <Card style={[styles.helpSectionCard, helpDarkMode && styles.accountDarkMainCard]}>
              <Text style={[styles.sectionTitle, helpDarkMode && styles.accountDarkTitle]}>Send feedback</Text>
              <Text style={[styles.helpCardText, helpDarkMode && styles.accountDarkMutedText]}>
                Use this for bugs, confusing areas, suggestions, or encouragement. Feedback is saved with basic context so it can be reviewed without needing private study notes.
              </Text>
              <View style={styles.feedbackCategoryRow}>
                {[
                  ["bug", "Bug"],
                  ["confusing", "Confusing"],
                  ["suggestion", "Suggestion"],
                  ["encouragement", "Encouragement"],
                  ["other", "Other"]
                ].map(([key, label]) => (
                  <Pressable
                    key={key}
                    onPress={() => setFeedbackCategory(key as typeof feedbackCategory)}
                    style={[styles.feedbackCategoryChip, helpDarkMode && styles.helpDarkCategoryChip, feedbackCategory === key && styles.activeFeedbackCategoryChip, helpDarkMode && feedbackCategory === key && styles.accountDarkActiveOptionCard]}
                  >
                    <Text style={[styles.feedbackCategoryText, helpDarkMode && styles.accountDarkTitle, feedbackCategory === key && styles.activeFeedbackCategoryText]}>{label}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                multiline
                value={feedbackMessage}
                onChangeText={setFeedbackMessage}
                placeholder="What should be improved, fixed, or made clearer?"
                placeholderTextColor={helpDarkMode ? "#9d927f" : undefined}
                style={[styles.input, styles.feedbackInput, helpDarkMode && styles.accountDarkInput]}
              />
              <View style={styles.helpActionRow}>
                <AppButton label="Send feedback" onPress={submitUserFeedback} style={phoneLayout && styles.phoneFullWidthButton} />
              </View>
              {!!feedbackStatus && <Text style={styles.saveStatus}>{feedbackStatus}</Text>}
            </Card>
          </View>
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
      {memoryPrintOptionsOpen && (
        <View style={styles.printOptionsOverlay}>
          <Pressable style={[styles.printOptionsScrim, accountDarkMode && styles.printDarkOptionsScrim]} onPress={() => setMemoryPrintOptionsOpen(false)} />
          <View
            style={[
              styles.printOptionsCard,
              styles.memoryPrintOptionsCard,
              phoneLayout && styles.phonePrintOptionsCard,
              phoneLayout && { maxHeight: Math.max(320, height - 96) },
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
          <View style={[styles.printOptionsCard, phoneLayout && styles.phonePrintOptionsCard, accountDarkMode && styles.accountDarkMainCard]}>
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Help for ${activeContextHelp.title}`}
        onPress={() => setContextHelpOpen(true)}
        style={[styles.contextHelpButton, { bottom: contextHelpBottom }]}
      >
        <Ionicons name="help-circle-outline" size={22} color="white" />
      </Pressable>
      {contextHelpOpen && (
        <View style={styles.contextHelpOverlay}>
          <Pressable style={styles.contextHelpScrim} onPress={() => setContextHelpOpen(false)} />
          <View style={[styles.contextHelpCard, phoneLayout && styles.phoneContextHelpCard]}>
            <View style={styles.contextHelpHeader}>
              <View style={styles.feedbackHeader}>
                <Ionicons name={activeContextHelp.icon as any} size={18} color={colors.coral} />
                <Text style={styles.feedbackTitle}>{activeContextHelp.title}</Text>
              </View>
              <Pressable onPress={() => setContextHelpOpen(false)} style={styles.markupCloseButton}>
                <Ionicons name="close-outline" size={19} color={colors.muted} />
              </Pressable>
            </View>
            <Text style={styles.helpIntro}>{activeContextHelp.summary}</Text>
            <View style={styles.contextHelpList}>
              {activeContextHelp.tips.map((tip) => (
                <View key={tip} style={styles.contextHelpTip}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.oliveDark} />
                  <Text style={styles.contextHelpTipText}>{tip}</Text>
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
  iconColor
}: {
  label: string;
  onPress: () => void;
  icon?: string;
  variant?: "default" | "primary";
  style?: any;
  labelStyle?: any;
  iconColor?: string;
}) {
  const primary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.resumeButton, primary && styles.primaryResumeButton, pressed && styles.resumeButtonPressed, style]}
    >
      <Ionicons name={icon as any} size={17} color={iconColor || (primary ? "white" : colors.coral)} />
      <Text style={[styles.resumeButtonText, primary && styles.primaryResumeButtonText, labelStyle]}>{label}</Text>
    </Pressable>
  );
}

function MemoryBlank({
  token,
  value,
  checked,
  hintsVisible,
  hintLevel,
  inputRef,
  onChange,
  onSubmit,
  onMoreHint,
  returnKeyType = "next",
  compact = false,
  darkMode = false
}: {
  token: { index: number; answer: string };
  value: string;
  checked: boolean;
  hintsVisible: boolean;
  hintLevel: number;
  inputRef?: (input: TextInput | null) => void;
  onChange: (value: string, plainText?: string) => void;
  onSubmit?: () => void;
  onMoreHint: () => void;
  returnKeyType?: "next" | "done";
  compact?: boolean;
  darkMode?: boolean;
}) {
  const correct = !!value && normalizeMemoryAnswer(value) === normalizeMemoryAnswer(token.answer);
  const normalizedValue = normalizeMemoryAnswer(value);
  const normalizedAnswer = normalizeMemoryAnswer(token.answer);
  const incorrect = !!normalizedValue && !correct && (checked || normalizedValue.length >= normalizedAnswer.length);
  const canShowMoreHint = memoryHintRevealCount(token.answer, hintLevel) < token.answer.replace(/[^a-z0-9]/gi, "").length;

  return (
    <View style={[styles.memoryBlankWrap, { width: memoryBlankWidth(token.answer, compact) }]}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(nextValue) => onChange(formatMemoryBlankValue(token.answer, nextValue))}
        onSubmitEditing={onSubmit}
        autoCapitalize="none"
        blurOnSubmit={false}
        keyboardType={memoryAnswerIsReference(token.answer) ? "numbers-and-punctuation" : "default"}
        returnKeyType={returnKeyType}
        style={[
          styles.memoryBlankInput,
          darkMode && styles.memoryDarkBlankInput,
          correct && styles.correctMemoryBlankInput,
          darkMode && correct && styles.memoryDarkCorrectBlankInput,
          incorrect && styles.incorrectMemoryBlankInput
        ]}
      />
      {hintsVisible && !correct && (
        <View style={styles.memoryHintRow}>
          <Text style={styles.memoryHintText}>{memoryHintText(token.answer, hintLevel)}</Text>
          {canShowMoreHint && (
            <Pressable onPress={onMoreHint} style={styles.moreMemoryHintButton}>
              <Text style={[styles.moreMemoryHintText, darkMode && styles.accountDarkMutedText]}>Hint</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
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

function StudyNoteTiptapEditor({
  value,
  onChange,
  onSelectionChange,
  placeholder,
  studyFocusMode,
  writingPrompts = [],
  customWritingPrompts = [],
  writingPromptStatus,
  onAddCustomWritingPrompt,
  onRemoveCustomWritingPrompt,
  scriptureInsertStatus,
  scriptureInsertFocusKey,
  onInsertScripture,
  scriptureInsertSettings,
  onSaveScriptureInsertSettings,
  highlightPickerOpen,
  onOpenHighlightPicker,
  onCloseHighlightPicker,
  onSaveHighlightColor,
  scriptureSettingsOpen,
  onOpenScriptureSettings,
  onCloseScriptureSettings,
  phoneLayout = false,
  darkMode = false
}: {
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
  const wrapRef = useRef<any>(null);
  const lastHtmlRef = useRef(value || "");
  const [scripturePopoverPosition, setScripturePopoverPosition] = useState({ left: 14, top: 70 });
  const [activeNoteFormats, setActiveNoteFormats] = useState<NoteFormatKind[]>([]);
  const [localScriptureMatch, setLocalScriptureMatch] = useState<{ reference: string; typed: string; from: number; to: number } | null>(null);
  const [selectedTextActive, setSelectedTextActive] = useState(false);
  const [selectedTextRangeKey, setSelectedTextRangeKey] = useState("");
  const [mobileMiniBarPosition, setMobileMiniBarPosition] = useState({ left: 8, top: 0 });
  const [dismissedMobileMiniBarKey, setDismissedMobileMiniBarKey] = useState("");
  const [dismissedScriptureKey, setDismissedScriptureKey] = useState("");
  const scriptureInsertSettingsRef = useRef(scriptureInsertSettings);
  const dismissedScriptureKeyRef = useRef(dismissedScriptureKey);
  const savedEditorHighlightSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scriptureInsertSettingsRef.current = scriptureInsertSettings;
  }, [scriptureInsertSettings]);

  useEffect(() => {
    dismissedScriptureKeyRef.current = dismissedScriptureKey;
  }, [dismissedScriptureKey]);

  const syncTiptapState = (editor: Editor) => {
    const cursorMatch = findTiptapScriptureReferenceBeforeCursor(editor);
    const textBeforeCursor = cursorMatch.textBeforeCursor;
    const matchKey = cursorMatch.match ? getScriptureMatchKey(cursorMatch.match) : "";
    const nextMatch = !scriptureInsertSettingsRef.current.disabled && matchKey !== dismissedScriptureKeyRef.current ? cursorMatch.match : null;
    const nextFormats = getTiptapActiveFormats(editor);
    const nextSelectedTextActive = !editor.state.selection.empty;
    const nextSelectedTextRangeKey = nextSelectedTextActive ? `${editor.state.selection.from}:${editor.state.selection.to}` : "";

    setLocalScriptureMatch((current) => scriptureEditorMatchesEqual(current, nextMatch) ? current : nextMatch);
    setActiveNoteFormats((current) => noteFormatArraysEqual(current, nextFormats) ? current : nextFormats);
    setSelectedTextRangeKey((current) => {
      if (current !== nextSelectedTextRangeKey) setDismissedMobileMiniBarKey("");
      return current === nextSelectedTextRangeKey ? current : nextSelectedTextRangeKey;
    });
    setSelectedTextActive((current) => current === nextSelectedTextActive ? current : nextSelectedTextActive);
    if (nextSelectedTextActive) updateTiptapMobileMiniBarPosition(editor, wrapRef.current, setMobileMiniBarPosition);
    updateTiptapScripturePopoverPosition(editor, wrapRef.current, setScripturePopoverPosition);
    return textBeforeCursor;
  };
  const syncTiptapStateSoon = (editor: Editor) => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      syncTimeoutRef.current = null;
      if (!editor.isDestroyed) syncTiptapState(editor);
    }, 16);
  };

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        horizontalRule: false,
        blockquote: false
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      ScriptureTextColor
    ],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": placeholder,
        "data-placeholder": placeholder,
        class: "bst-note-editor"
      },
      handleDOMEvents: {
        keyup: () => {
          if (editor) syncTiptapStateSoon(editor);
          return false;
        },
        input: () => {
          if (editor) syncTiptapStateSoon(editor);
          return false;
        },
        paste: () => {
          if (editor) syncTiptapStateSoon(editor);
          return false;
        },
        click: () => {
          if (editor) syncTiptapStateSoon(editor);
          return false;
        },
        focus: () => {
          if (editor) syncTiptapStateSoon(editor);
          return false;
        },
        touchend: () => {
          if (editor) syncTiptapStateSoon(editor);
          return false;
        }
      }
    },
    onCreate: ({ editor }) => {
      syncTiptapStateSoon(editor);
    },
    onUpdate: ({ editor }) => {
      const nextHtml = sanitizeEditorHtml(editor.getHTML());
      lastHtmlRef.current = nextHtml;
      onChange(nextHtml, syncTiptapState(editor));
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      onSelectionChange({ start: from, end: to });
      syncTiptapState(editor);
    }
  });

  useEffect(() => {
    if (!editor || lastHtmlRef.current === value) return;
    const currentHtml = sanitizeEditorHtml(editor.getHTML());
    if (currentHtml === value) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
    lastHtmlRef.current = value || "";
    syncTiptapStateSoon(editor);
  }, [editor, value]);

  useEffect(() => {
    if (!editor || !scriptureInsertFocusKey) return;
    editor.commands.focus("end");
  }, [editor, scriptureInsertFocusKey]);

  useEffect(() => {
    if (scriptureInsertSettings.disabled) setLocalScriptureMatch(null);
  }, [scriptureInsertSettings.disabled]);

  const insertWritingPromptWeb = (prompt: string) => {
    if (!editor) return;
    const prefix = editor.getText().trim() ? "\n" : "";
    editor.chain().focus().insertContent(`${prefix}${prompt} `).run();
  };

  const insertScriptureWeb = async (chosenMatch?: { reference: string; typed: string; from: number; to: number }) => {
    if (!editor) return;
    const liveMatch =
      chosenMatch ||
      findTiptapScriptureReferenceBeforeCursor(editor).match ||
      localScriptureMatch;
    const reference = liveMatch?.reference || "";
    const typedReference = liveMatch?.typed || "";
    const result = await onInsertScripture?.({ reference, typedReference });
    if (!result) return;

    const { from } = editor.state.selection;
    const deleteFrom = liveMatch?.from || from;
    const deleteTo = liveMatch?.to || from;
    const html = richScriptureExpansion(result.reference, result.text, scriptureInsertSettingsRef.current);

    editor
      .chain()
      .focus()
      .deleteRange({ from: deleteFrom, to: deleteTo })
      .insertContent(html)
      .insertContent(" ")
      .run();

    const nextHtml = sanitizeEditorHtml(editor.getHTML());
    lastHtmlRef.current = nextHtml;
    setLocalScriptureMatch(null);
    onChange(nextHtml, syncTiptapState(editor));
  };

  const restoreEditorSelectionAfterDialog = () => {
    if (!editor) return;
    const savedSelection = savedEditorHighlightSelectionRef.current;
    if (!savedSelection) return;
    const windowRef = (globalThis as any).window;
    const scrollX = windowRef?.scrollX || 0;
    const scrollY = windowRef?.scrollY || 0;
    const restoreScroll = () => windowRef?.scrollTo?.(scrollX, scrollY);
    requestAnimationFrame(() => {
      if (editor.isDestroyed) return;
      editor.view.dom.focus?.({ preventScroll: true });
      editor.commands.setTextSelection(savedSelection);
      syncTiptapState(editor);
      updateTiptapMobileMiniBarPosition(editor, wrapRef.current, setMobileMiniBarPosition);
      restoreScroll();
      requestAnimationFrame(() => {
        if (editor.isDestroyed) return;
        editor.commands.setTextSelection(savedSelection);
        syncTiptapState(editor);
        updateTiptapMobileMiniBarPosition(editor, wrapRef.current, setMobileMiniBarPosition);
        restoreScroll();
      });
    });
  };

  const openEditorHighlightPicker = () => {
    if (editor && !editor.state.selection.empty) {
      const { from, to } = editor.state.selection;
      savedEditorHighlightSelectionRef.current = { from, to };
    }
    onOpenHighlightPicker();
  };

  const saveEditorHighlightColor = async (color: string) => {
    await onSaveHighlightColor(color);
    restoreEditorSelectionAfterDialog();
  };

  const applyTiptapFormat = (kind: NoteFormatKind) => {
    if (!editor) return;
    const selectedRange = !editor.state.selection.empty
      ? { from: editor.state.selection.from, to: editor.state.selection.to }
      : savedEditorHighlightSelectionRef.current;
    if (selectedRange) savedEditorHighlightSelectionRef.current = selectedRange;

    let chain = editor.chain();
    if (selectedRange) chain = chain.setTextSelection(selectedRange);
    if (!phoneLayout) chain = chain.focus();
    if (kind === "undo") chain.undo().run();
    if (kind === "redo") chain.redo().run();
    if (kind === "bold") chain.toggleBold().run();
    if (kind === "italic") chain.toggleItalic().run();
    if (kind === "underline") chain.toggleUnderline().run();
    if (kind === "highlight") chain.toggleHighlight({ color: scriptureInsertSettingsRef.current.highlightColor }).run();
    if (kind === "bullet") chain.toggleBulletList().run();
    setActiveNoteFormats(getTiptapActiveFormats(editor));
    syncTiptapState(editor);
  };

  const editorStyle = {
    backgroundColor: darkMode ? "#151a19" : "#fffaf2",
    border: `1px solid ${darkMode ? "rgba(233, 183, 106, 0.2)" : colors.line}`,
    borderRadius: 11,
    color: darkMode ? "#f7eddc" : colors.ink,
    marginBottom: 14,
    minHeight: studyFocusMode ? (phoneLayout ? 220 : 260) : phoneLayout ? 170 : 150,
    outline: "none",
    overflow: "hidden"
  };
  const visibleScriptureReference = localScriptureMatch?.reference || "";
  const dismissScripturePrompt = () => {
    if (localScriptureMatch) {
      const nextKey = getScriptureMatchKey(localScriptureMatch);
      dismissedScriptureKeyRef.current = nextKey;
      setDismissedScriptureKey(nextKey);
    }
    setLocalScriptureMatch(null);
  };

  return (
    <View ref={wrapRef} style={styles.studyNoteEditorWrap}>
      {createElement("style", {
        children: `.bst-note-editor{box-sizing:border-box;min-height:${editorStyle.minHeight}px;padding:${phoneLayout ? "15px" : "14px"};outline:none;line-height:22px;white-space:pre-wrap;color:inherit}.bst-note-editor p{margin:0 0 10px}.bst-note-editor p:last-child{margin-bottom:0}.bst-note-editor ul{margin:0 0 10px 20px;padding:0}.bst-note-editor mark{border-radius:4px;padding:0 2px}.bst-note-editor:empty:before{content:attr(data-placeholder);color:${darkMode ? "#8f8678" : "#7c7162"};pointer-events:none}`
      })}
      <WritingPromptChips
        prompts={writingPrompts}
        customPrompts={customWritingPrompts}
        status={writingPromptStatus}
        onInsert={insertWritingPromptWeb}
        onAddCustomPrompt={onAddCustomWritingPrompt}
        onRemoveCustomPrompt={onRemoveCustomWritingPrompt}
        compact={phoneLayout}
        darkMode={darkMode}
      />
      {createElement("div", { style: editorStyle, children: createElement(EditorContent, { editor }) })}
      {phoneLayout && selectedTextActive && dismissedMobileMiniBarKey !== selectedTextRangeKey && (
        <MobileNoteFormatBar
          onFormat={applyTiptapFormat}
          highlightColor={scriptureInsertSettings.highlightColor}
          onOpenHighlightPicker={openEditorHighlightPicker}
          onDismiss={() => setDismissedMobileMiniBarKey(selectedTextRangeKey)}
          floating
          style={{
            left: mobileMiniBarPosition.left,
            top: mobileMiniBarPosition.top
          }}
          darkMode={darkMode}
        />
      )}
      {!!visibleScriptureReference &&
        createElement("div", {
          style: {
            position: "absolute",
            left: scripturePopoverPosition.left,
            top: scripturePopoverPosition.top,
            zIndex: 20
          },
          children: createElement(ScriptureInsertPrompt, {
            reference: visibleScriptureReference,
            status: scriptureInsertStatus,
            onInsert: insertScriptureWeb,
            onDismiss: dismissScripturePrompt,
            compact: true,
            darkMode
          })
        })}
      <NoteFormatToolbar
        onFormat={applyTiptapFormat}
        activeFormats={activeNoteFormats}
        highlightActive={activeNoteFormats.includes("highlight")}
        highlightColor={scriptureInsertSettings.highlightColor}
        onOpenHighlightPicker={openEditorHighlightPicker}
        onOpenSettings={onOpenScriptureSettings}
        compact={phoneLayout}
        darkMode={darkMode}
      />
      {highlightPickerOpen && (
        <NoteHighlightColorPicker
          color={scriptureInsertSettings.highlightColor}
          onSelect={saveEditorHighlightColor}
          onClose={onCloseHighlightPicker}
          darkMode={darkMode}
        />
      )}
      {scriptureSettingsOpen && (
        <ScriptureInsertSettingsDialog
          settings={scriptureInsertSettings}
          onSave={onSaveScriptureInsertSettings}
          onClose={onCloseScriptureSettings}
          darkMode={darkMode}
          phoneLayout={phoneLayout}
        />
      )}
    </View>
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
            value={draftPrompt}
            onChangeText={setDraftPrompt}
            placeholder="Add your own starter phrase"
            placeholderTextColor={darkMode ? "#8f8678" : undefined}
            style={[styles.customPromptInput, darkMode && styles.accountDarkInput]}
          />
          <Pressable onPress={addPrompt} style={styles.addPromptButton}>
            <Text style={styles.addPromptText}>Add</Text>
          </Pressable>
        </View>
      )}
      {!!status && <Text style={[styles.writingPromptStatus, darkMode && styles.accountDarkMutedText]}>{status}</Text>}
    </View>
  );
}

function CustomStudyReviewControl({
  value,
  onChange,
  onSchedule
}: {
  value: string;
  onChange: (value: string) => void;
  onSchedule: () => void;
}) {
  return (
    <View style={styles.customReviewControl}>
      <Text style={styles.customReviewLabel}>Custom</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        placeholder="14"
        style={styles.customReviewInput}
      />
      <Text style={styles.customReviewUnit}>days</Text>
      <Pressable onPress={onSchedule} style={styles.addPromptButton}>
        <Text style={styles.addPromptText}>Set</Text>
      </Pressable>
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

function FormattedNoteText({ text, darkMode = false }: { text: string; darkMode?: boolean }) {
  if (!text.trim()) return null;
  const displayText = Platform.OS === "web" ? text : richHtmlToMarkupText(text);

  if (Platform.OS === "web" && /<\/?[a-z][\s\S]*>/i.test(displayText)) {
    return createElement("div", {
      style: {
        color: colors.ink,
        ...(darkMode ? { color: "#f7eddc" } : {}),
        fontSize: 15,
        lineHeight: "21px",
        marginBottom: 8
      },
      dangerouslySetInnerHTML: { __html: sanitizeEditorHtml(displayText) }
    });
  }

  return (
    <View style={styles.formattedNote}>
      {displayText.split("\n").map((line, index) => {
        const isBullet = line.trimStart().startsWith("- ");
        const content = isBullet ? line.trimStart().slice(2) : line;

        return (
          <View key={`${line}-${index}`} style={isBullet ? styles.formattedBulletRow : undefined}>
            {isBullet && <Text style={styles.formattedBullet}>•</Text>}
            <Text style={[styles.body, darkMode && styles.accountDarkText, isBullet && styles.formattedBulletText]}>{renderFormattedNoteSegments(content)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function JournalMeditationScripture({ text, darkMode = false }: { text: string; darkMode?: boolean }) {
  const [referenceLine, ...verseLines] = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const verseText = verseLines.join(" ").trim() || text.trim();

  return (
    <View style={[styles.journalMeditationScriptureBox, darkMode && styles.journalDarkMeditationScriptureBox]}>
      <View style={styles.feedbackHeader}>
        <Ionicons name="book-outline" size={16} color={darkMode ? "#e9b76a" : colors.coral} />
        <Text style={[styles.lastCheckinLabel, darkMode && styles.studyDarkAccentText]}>Scripture</Text>
      </View>
      {!!referenceLine && <Text style={[styles.journalMeditationReference, darkMode && styles.accountDarkTitle]}>{referenceLine}</Text>}
      <Text style={[styles.journalMeditationVerseText, darkMode && styles.accountDarkText]}>{verseText}</Text>
    </View>
  );
}

function JournalMeditationAnswer({ title, text, darkMode = false }: { title: string; text: string; darkMode?: boolean }) {
  const icon = getMeditationAnswerIcon(title);
  const iconColor = darkMode ? "#e9b76a" : colors.coral;

  return (
    <View style={styles.journalMeditationAnswer}>
      <View style={styles.journalMeditationAnswerHeader}>
        <MaterialCommunityIcons name={icon as any} size={18} color={iconColor} />
        <Text style={[styles.journalMeditationAnswerTitle, darkMode && styles.studyDarkAccentText]}>{title}</Text>
      </View>
      <FormattedNoteText text={text} darkMode={darkMode} />
    </View>
  );
}

function getMeditationAnswerIcon(title: string) {
  const normalized = title.trim().toLowerCase();
  if (normalized === "notice") return "eye-outline";
  if (normalized === "reflect") return "lightbulb-outline";
  if (normalized === "pray") return "hands-pray";
  if (normalized === "carry") return "book-account-outline";
  return "book-open-page-variant-outline";
}

function renderFormattedNoteSegments(text: string) {
  const segments = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|==[^=]+==)/g).filter((segment) => segment.length > 0);

  return segments.map((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      return (
        <Text key={`${segment}-${index}`} style={styles.formattedBold}>
          {segment.slice(2, -2)}
        </Text>
      );
    }
    if (segment.startsWith("*") && segment.endsWith("*")) {
      return (
        <Text key={`${segment}-${index}`} style={styles.formattedItalic}>
          {segment.slice(1, -1)}
        </Text>
      );
    }
    if (segment.startsWith("__") && segment.endsWith("__")) {
      return (
        <Text key={`${segment}-${index}`} style={styles.formattedUnderline}>
          {segment.slice(2, -2)}
        </Text>
      );
    }
    if (segment.startsWith("==") && segment.endsWith("==")) {
      return (
        <Text key={`${segment}-${index}`} style={styles.formattedHighlight}>
          {segment.slice(2, -2)}
        </Text>
      );
    }
    return segment;
  });
}

function PassageMarkupSummary({ markups, darkMode = false }: { markups: PassageMarkupRecord[]; darkMode?: boolean }) {
  if (!markups.length) return null;

  return (
    <View style={[styles.journalShareBox, darkMode && styles.accountDarkInsetBox]}>
      <Text style={[styles.lastCheckinLabel, darkMode && styles.studyDarkAccentText]}>Highlights</Text>
      <View style={styles.markupSummaryRow}>
        {markups.map((markup) => {
          const option = PASSAGE_MARKUP_OPTIONS.find((item) => item.id === markup.kind);

          return (
            <View key={markup.key} style={styles.markupSummaryItem}>
              <View style={[styles.markupSummaryChip, option && { backgroundColor: option.background }]}>
                <Text style={[styles.markupSummaryText, option && { color: option.color }]}>
                  {markup.reference} · {markup.label}
                </Text>
              </View>
              {!!markup.note && <Text style={[styles.markupSummaryNote, darkMode && styles.accountDarkText]}>{markup.note}</Text>}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function JournalCalendar({
  monthStart,
  items,
  selectedDateKey,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
  darkMode = false
}: {
  monthStart: number;
  items: JournalCalendarItem[];
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  darkMode?: boolean;
}) {
  const cells = buildJournalCalendarCells(monthStart, items);

  return (
    <View style={[styles.journalCalendarBox, darkMode && styles.accountDarkSection]}>
      <View style={styles.journalCalendarHeader}>
        <Pressable onPress={onPreviousMonth} style={[styles.calendarMonthButton, darkMode && styles.homeDarkIconBubble]}>
          <Ionicons name="chevron-back-outline" size={18} color={darkMode ? "#e9b76a" : colors.oliveDark} />
        </Pressable>
        <Text style={[styles.journalCalendarTitle, darkMode && styles.accountDarkTitle]}>
          {new Date(monthStart).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </Text>
        <Pressable onPress={onNextMonth} style={[styles.calendarMonthButton, darkMode && styles.homeDarkIconBubble]}>
          <Ionicons name="chevron-forward-outline" size={18} color={darkMode ? "#e9b76a" : colors.oliveDark} />
        </Pressable>
      </View>
      <View style={styles.calendarWeekdayRow}>
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <Text key={`${day}-${index}`} style={[styles.calendarWeekday, darkMode && styles.accountDarkMutedText]}>{day}</Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {cells.map((cell) => {
          const selected = selectedDateKey === cell.dateKey;
          return (
            <Pressable
              key={cell.dateKey}
              onPress={() => onSelectDate(selected ? "" : cell.dateKey)}
              style={[
                styles.calendarDayCell,
                darkMode && styles.journalDarkCalendarDayCell,
                !cell.inMonth && styles.inactiveCalendarDayCell,
                selected && styles.selectedCalendarDayCell,
                cell.count > 0 && !selected && styles.activeCalendarDayCell,
                darkMode && cell.count > 0 && !selected && styles.journalDarkActiveCalendarDayCell
              ]}
            >
              <Text style={[styles.calendarDayNumber, darkMode && styles.accountDarkText, selected && styles.selectedCalendarDayNumber, !cell.inMonth && styles.inactiveCalendarDayNumber]}>
                {cell.day}
              </Text>
              {cell.count > 0 && (
                <Text style={[styles.calendarEntryCount, selected && styles.selectedCalendarEntryCount]}>
                  {cell.count}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function JournalScriptureBrowser({
  sections,
  expandedBook,
  selectedBook,
  selectedChapter,
  onToggleBook,
  onSelectChapter,
  darkMode = false
}: {
  sections: { title: string; books: { book: string; chapters: { chapter: number; entryCount: number; verseCount: number }[] }[] }[];
  expandedBook: string;
  selectedBook: string;
  selectedChapter: number;
  onToggleBook: (book: string) => void;
  onSelectChapter: (book: string, chapter: number) => void;
  darkMode?: boolean;
}) {
  const activeBookSet = new Set(sections.flatMap((section) => section.books.map((item) => item.book)));

  return (
    <View style={[styles.journalScriptureBox, darkMode && styles.accountDarkSection]}>
      {sections.length === 0 ? (
        <View style={styles.emptyJournalScriptureBox}>
          <Ionicons name="book-outline" size={22} color={colors.coral} />
          <Text style={[styles.emptyJournalTitle, darkMode && styles.accountDarkTitle]}>No passage entries yet</Text>
          <Text style={[styles.emptyJournalText, darkMode && styles.accountDarkMutedText]}>Saved studies, drafts, and highlights with scripture references will appear here.</Text>
        </View>
      ) : (
        sections.map((section) => (
          <View key={section.title} style={styles.journalScriptureSection}>
            <Text style={[styles.readerBookSectionTitle, darkMode && styles.studyDarkAccentText]}>{section.title}</Text>
            <View style={styles.desktopReaderBookList}>
              {section.books.map(({ book, chapters }) => {
                const expanded = expandedBook === book;
                const selected = selectedBook === book;
                return (
                  <View key={book} style={[styles.desktopReaderBookBlock, expanded && styles.expandedDesktopReaderBookBlock]}>
                    <Pressable
                      onPress={() => onToggleBook(book)}
                      style={[
                        styles.readerBookChip,
                        darkMode && styles.printDarkOptionChip,
                        activeBookSet.has(book) && styles.journalScriptureActiveBookChip,
                        darkMode && activeBookSet.has(book) && styles.journalDarkScriptureActiveBookChip,
                        selected && styles.activeReaderBookChip
                      ]}
                    >
                      <Text style={[styles.readerBookText, darkMode && styles.accountDarkMutedText, selected && styles.activeReaderBookText]}>{book}</Text>
                    </Pressable>
                    {expanded && (
                      <View style={[styles.desktopReaderChapterPanel, darkMode && styles.accountDarkInsetBox]}>
                        <View style={styles.desktopReaderChapterHeader}>
                          <Text style={[styles.readerBookSectionTitle, darkMode && styles.studyDarkAccentText]}>{book}</Text>
                          <Text style={[styles.readerChapterCountText, darkMode && styles.accountDarkMutedText]}>{`${chapters.length} chapter${chapters.length === 1 ? "" : "s"}`}</Text>
                        </View>
                        <View style={styles.desktopReaderChapterGrid}>
                          {chapters.map(({ chapter, entryCount, verseCount }) => {
                            const chapterSelected = selectedBook === book && selectedChapter === chapter;
                            return (
                              <Pressable
                                key={`${book}-${chapter}`}
                                onPress={() => onSelectChapter(book, chapter)}
                                style={[styles.journalScriptureChapterSquare, darkMode && styles.printDarkOptionChip, chapterSelected && styles.activeMobileReaderChapterSquare]}
                              >
                                <Text style={[styles.mobileReaderChapterText, darkMode && styles.accountDarkMutedText, chapterSelected && styles.activeMobileReaderChapterText]}>{chapter}</Text>
                                <Text style={[styles.journalScriptureChapterCount, chapterSelected && styles.activeMobileReaderChapterText]}>
                                  {verseCount > 0 ? `${verseCount}v` : `${entryCount}e`}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function HighlightReflectionSummary({ note, darkMode = false }: { note: string; darkMode?: boolean }) {
  const reflection = parseHighlightReflectionNote(note);
  const sections = [
    ["Key insight", reflection.keyInsight],
    ["Prayer", reflection.prayer],
    ["Next step", reflection.nextStep]
  ].filter(([, value]) => value);

  if (!reflection.passage && !reflection.highlights && sections.length === 0) {
    return <Text style={[styles.body, darkMode && styles.accountDarkText]}>{note || "No note added."}</Text>;
  }

  return (
    <View style={[styles.reflectionSummaryBox, darkMode && styles.accountDarkInsetBox]}>
      <View style={styles.reflectionSummaryHeader}>
        <Ionicons name="sparkles-outline" size={18} color={colors.coral} />
        <Text style={[styles.lastCheckinLabel, darkMode && styles.studyDarkAccentText]}>Reflection</Text>
      </View>
      {!!reflection.passage && (
        <View style={styles.reflectionSummarySection}>
          <Text style={styles.reflectionSummaryLabel}>Passage</Text>
          <Text style={[styles.body, darkMode && styles.accountDarkText]}>{reflection.passage}</Text>
        </View>
      )}
      {!!reflection.highlights && (
        <View style={styles.reflectionSummarySection}>
          <Text style={styles.reflectionSummaryLabel}>Highlights</Text>
          <Text style={[styles.body, darkMode && styles.accountDarkText]}>{reflection.highlights}</Text>
        </View>
      )}
      {sections.map(([label, value]) => (
        <View key={label} style={styles.reflectionSummarySection}>
          <Text style={styles.reflectionSummaryLabel}>{label}</Text>
          <Text style={[styles.body, darkMode && styles.accountDarkText]}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function planDayKey(planId: string, day: number) {
  return `${planId}:${day}`;
}

function verseMarkupKey(verse: BibleVerse) {
  return `${verse.book_name}:${verse.chapter}:${verse.verse}`;
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

function normalizeBibleBookName(bookName: string) {
  return bookName === "Psalms" ? "Psalm" : bookName;
}

function displayBibleBookName(bookName: string) {
  return bookName === "Psalm" ? "Psalms" : bookName;
}

function bibleSearchTranslationId(translation: "KJV" | "WEB" | "BSB") {
  if (translation === "KJV") return "KJV";
  if (translation === "BSB") return "BSB";
  return "WEB";
}

async function fetchBibleSearchResults(searchTerm: string, translation: "KJV" | "WEB" | "BSB", scope: BibleSearchScope, bookFilter: string, matchWhole: boolean): Promise<BibleSearchResult[]> {
  if (translation === "BSB") {
    try {
      const indexedResults = await fetchIndexedBibleSearchResults(searchTerm, translation, scope, bookFilter, matchWhole);
      if (indexedResults.length > 0 || !bookFilter) return indexedResults;
    } catch {
      if (!bookFilter) return [];
    }
    return fetchBsbSearchResults(searchTerm, scope, bookFilter, matchWhole);
  }

  return fetchIndexedBibleSearchResults(searchTerm, translation, scope, bookFilter, matchWhole);
}

async function fetchIndexedBibleSearchResults(searchTerm: string, translation: "KJV" | "WEB" | "BSB", scope: BibleSearchScope, bookFilter: string, matchWhole: boolean): Promise<BibleSearchResult[]> {
  const params = new URLSearchParams({
    search: searchTerm,
    match_case: "false",
    match_whole: matchWhole ? "true" : "false",
    limit: "30",
    page: "1"
  });
  if (bookFilter) {
    const bookIndex = bibleBooks.indexOf(bookFilter);
    if (bookIndex >= 0) params.set("book", String(bookIndex + 1));
  } else if (scope !== "all") {
    params.set("book", scope === "old" ? "ot" : "nt");
  }

  const response = await fetch(`https://bolls.life/v2/find/${bibleSearchTranslationId(translation)}?${params.toString()}`);
  if (!response.ok) throw new Error("Bible search failed");
  const data = await response.json();
  const rawResults = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];

  return rawResults
    .map((item: any): BibleSearchResult | null => {
      const bookIndex = Number(item.book || item.book_id || item.bookId || 0) - 1;
      const book = bibleBooks[bookIndex] || normalizeBibleBookName(String(item.book_name || item.bookName || ""));
      const chapter = Number(item.chapter || 0);
      const verse = Number(item.verse || 0);
      const text = stripHtmlText(String(item.text || item.verse_text || item.content || ""));
      if (!book || !chapter || !verse || !text) return null;
      return {
        id: `${translation}-${book}-${chapter}-${verse}`,
        book,
        chapter,
        verse,
        text,
        translation,
        sourceQuery: searchTerm
      };
    })
    .filter((item: BibleSearchResult | null): item is BibleSearchResult => item !== null);
}

async function fetchBsbSearchResults(searchTerm: string, scope: BibleSearchScope, bookFilter: string, matchWhole: boolean): Promise<BibleSearchResult[]> {
  const books = bookFilter
    ? [bookFilter]
    : scope === "old"
      ? OLD_TESTAMENT_BOOKS
      : scope === "new"
        ? NEW_TESTAMENT_BOOKS
        : bibleBooks;
  const chapters = books.flatMap((book) => Array.from({ length: BIBLE_CHAPTER_COUNTS[book] || 1 }, (_, index) => ({ book, chapter: index + 1 })));
  const results: BibleSearchResult[] = [];
  const batchSize = 8;

  for (let index = 0; index < chapters.length && results.length < 80; index += batchSize) {
    const batch = chapters.slice(index, index + batchSize);
    const batchResults = await Promise.all(batch.map(({ book, chapter }) => fetchBsbSearchChapter(searchTerm, book, chapter, matchWhole).catch(() => [] as BibleSearchResult[])));
    results.push(...batchResults.flat());
  }

  return results;
}

async function fetchBsbSearchChapter(searchTerm: string, book: string, chapter: number, matchWhole: boolean): Promise<BibleSearchResult[]> {
  const bookId = BSB_BOOK_IDS[normalizeBibleBookName(book)];
  if (!bookId) return [];

  const response = await fetch(`https://bible.helloao.org/api/BSB/${bookId}/${chapter}.json`);
  if (!response.ok) return [];

  const data = await response.json();
  const verses = (data.chapter?.content || []).filter((item: any) => item.type === "verse" && typeof item.number === "number");
  return verses
    .map((item: any): BibleSearchResult => {
      const verse = Number(item.number);
      return {
        id: `BSB-${book}-${chapter}-${verse}`,
        book,
        chapter,
        verse,
        text: flattenBsbVerseContent(item.content),
        translation: "BSB",
        sourceQuery: searchTerm
      };
    })
    .filter((result: BibleSearchResult) => bsbSearchResultMatchesTerm(result.text, searchTerm, matchWhole));
}

function bsbSearchResultMatchesTerm(text: string, searchTerm: string, matchWhole: boolean) {
  const normalizedTerm = normalizeBibleSearchText(searchTerm);
  if (!normalizedTerm) return false;
  if (matchWhole) return bibleSearchWords(text).includes(normalizedTerm);
  return normalizeBibleSearchText(text).includes(normalizedTerm);
}

function buildBibleSearchQueries(query: string, mode: BibleSearchMode) {
  const words = bibleSearchWords(query);
  if (mode === "word") return [words[0] || query].filter(Boolean);
  if (mode === "phrase") return [query];
  if (mode === "allWords" || mode === "anyWords") return words.length ? words : [query];

  const normalized = query.toLowerCase();
  const themes: Record<string, string[]> = {
    anxiety: ["anxious", "fear", "peace", "trouble"],
    worry: ["anxious", "care", "fear", "peace"],
    afraid: ["fear not", "afraid", "courage"],
    fear: ["fear not", "afraid", "courage"],
    comfort: ["comfort", "peace", "hope"],
    grief: ["comfort", "mourning", "sorrow"],
    wisdom: ["wisdom", "understanding", "instruction"],
    prayer: ["pray", "prayer", "ask"],
    forgiveness: ["forgive", "forgiven", "mercy"],
    forgive: ["forgive", "forgiven", "mercy"],
    love: ["love", "charity", "kindness"],
    faith: ["faith", "believe", "trust"],
    hope: ["hope", "promise", "comfort"],
    scripture: ["scripture", "word", "profitable"],
    bible: ["scripture", "word", "profitable"],
    temptation: ["temptation", "endure", "escape"],
    suffering: ["suffering", "affliction", "comfort"],
    joy: ["joy", "rejoice", "gladness"],
    peace: ["peace", "rest", "comfort"],
    righteousness: ["righteousness", "godliness", "holiness"],
    repentance: ["repent", "turn", "confess"],
    near: ["draw nigh", "near", "seek"],
    purpose: ["purpose", "called", "works"]
  };
  const expanded = Object.entries(themes)
    .filter(([theme]) => normalized.includes(theme))
    .flatMap(([, terms]) => terms);
  const questionTerms = normalized.includes("?") || /\bwhat|where|why|how|does|about\b/.test(normalized)
    ? normalized.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 3 && !["what", "where", "does", "about", "when", "with", "from", "that"].includes(word))
    : [];
  return Array.from(new Set([query, ...expanded, ...questionTerms])).slice(0, 5);
}

function bibleSearchModeLabel(mode: BibleSearchMode) {
  const labels: Record<BibleSearchMode, string> = {
    word: "Exact word",
    phrase: "Exact phrase",
    allWords: "All words",
    anyWords: "Any words",
    theme: "Theme"
  };
  return labels[mode];
}

function filterBibleSearchResultsForMode(results: BibleSearchResult[], query: string, mode: BibleSearchMode) {
  const words = bibleSearchWords(query);
  const phrase = normalizeBibleSearchText(query);
  if (mode === "theme") return results;

  return results.filter((result) => {
    const text = normalizeBibleSearchText(result.text);
    const tokens = bibleSearchWords(result.text);
    if (mode === "phrase") return !!phrase && text.includes(phrase);
    if (mode === "anyWords") return words.some((word) => tokens.includes(word));
    return words.length > 0 && words.every((word) => tokens.includes(word));
  });
}

function rankBibleSearchResults(results: BibleSearchResult[], query: string, mode: BibleSearchMode) {
  const words = bibleSearchWords(query);
  const phrase = normalizeBibleSearchText(query);
  return results.slice().sort((a, b) => {
    const aScore = bibleSearchScore(a, words, phrase, mode);
    const bScore = bibleSearchScore(b, words, phrase, mode);
    return bScore - aScore || bibleBooks.indexOf(a.book) - bibleBooks.indexOf(b.book) || a.chapter - b.chapter || a.verse - b.verse;
  });
}

function bibleSearchScore(result: BibleSearchResult, words: string[], phrase: string, mode: BibleSearchMode) {
  const text = normalizeBibleSearchText(result.text);
  const tokens = bibleSearchWords(result.text);
  let score = 0;
  if (phrase && text.includes(phrase)) score += mode === "phrase" ? 20 : 8;
  words.forEach((word) => {
    const occurrences = tokens.filter((token) => token === word).length;
    score += occurrences * (mode === "word" ? 10 : 4);
  });
  if (result.sourceQuery && words.includes(normalizeBibleSearchText(result.sourceQuery))) score += 2;
  return score;
}

function bibleSearchWords(value: string) {
  return normalizeBibleSearchText(value).split(/\s+/).filter((word) => word.length > 0);
}

function normalizeBibleSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function formatSearchDuration(milliseconds: number) {
  const seconds = milliseconds / 1000;
  if (seconds < 1) return `${Math.max(0.1, seconds).toFixed(1)} seconds`;
  if (seconds < 10) return `${seconds.toFixed(1)} seconds`;
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes} min ${remainingSeconds} sec`;
}

function dedupeBibleSearchResults(results: BibleSearchResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.book}-${result.chapter}-${result.verse}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildBibleSearchBookOptions(scope: BibleSearchScope) {
  if (scope === "old") return OLD_TESTAMENT_BOOKS;
  if (scope === "new") return NEW_TESTAMENT_BOOKS;
  return bibleBooks;
}

function buildBibleSearchSections(results: BibleSearchResult[], scope: BibleSearchScope, bookFilter: string) {
  const filtered = results.filter((result) => {
    if (bookFilter) return result.book === bookFilter;
    if (scope === "old") return OLD_TESTAMENT_BOOKS.includes(result.book);
    if (scope === "new") return NEW_TESTAMENT_BOOKS.includes(result.book);
    return true;
  });

  if (bookFilter) return [{ title: bookFilter, results: filtered }];
  if (scope === "old") return [{ title: "Old Testament", results: filtered }];
  if (scope === "new") return [{ title: "New Testament", results: filtered }];

  return [
    { title: "Old Testament", results: filtered.filter((result) => OLD_TESTAMENT_BOOKS.includes(result.book)) },
    { title: "New Testament", results: filtered.filter((result) => NEW_TESTAMENT_BOOKS.includes(result.book)) }
  ].filter((section) => section.results.length > 0);
}

function stripHtmlText(text: string) {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchBibleApiPassage(reference: string, translation: Exclude<BibleTranslationId, "bsb">, signal: AbortSignal): Promise<BiblePassage> {
  const response = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}?translation=${translation}`, { signal });
  if (!response.ok) throw new Error("Passage not found");
  const data = (await response.json()) as BiblePassage;
  const verses = data.verses?.map((verse) => ({
    ...verse,
    text: normalizeBibleApiText(verse.text)
  }));

  return {
    ...data,
    text: verses?.map((verse) => verse.text).join("\n") || normalizeBibleApiText(data.text),
    verses
  };
}

function normalizeBibleApiText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

async function fetchBsbPassage(reference: string, signal: AbortSignal): Promise<BiblePassage> {
  const parsed = parseBsbPassageReference(reference);
  if (!parsed) throw new Error("BSB needs a chapter reference");

  const response = await fetch(`https://bible.helloao.org/api/BSB/${parsed.bookId}/${parsed.chapter}.json`, { signal });
  if (!response.ok) throw new Error("BSB passage not found");

  const data = await response.json();
  const allVerses = (data.chapter?.content || []).filter((item: any) => item.type === "verse" && typeof item.number === "number");
  const selectedVerses = allVerses.filter((item: any) => {
    if (!parsed.startVerse) return true;
    return item.number >= parsed.startVerse && item.number <= (parsed.endVerse || parsed.startVerse);
  });

  if (!selectedVerses.length) throw new Error("No BSB verses found");

  const verses = selectedVerses.map((item: any) => ({
    book_name: data.book?.commonName || parsed.bookName,
    chapter: parsed.chapter,
    verse: item.number,
    text: flattenBsbVerseContent(item.content)
  }));

  return {
    reference: formatBsbReference(parsed),
    text: verses.map((verse: BibleVerse) => verse.text).join("\n"),
    verses,
    translation_id: "BSB",
    translation_name: "Berean Standard Bible",
    translation_note: "Public Domain"
  };
}

function parseBsbPassageReference(query: string) {
  const compact = query.trim().replace(/\s+/g, " ").replace(/\s*:\s*/g, ":").replace(/\s*-\s*/g, "-");
  const resolved = resolveBibleBookReference(compact);
  if (!resolved) return null;

  const bookName = normalizeBibleBookName(resolved.book);
  const bookId = BSB_BOOK_IDS[bookName];
  const rest = resolved.rest;
  const match = rest.match(/^(\d+)(?::(\d+)(?:-(\d+))?)?$/);
  if (!bookId || !match) return null;

  return {
    bookName,
    bookId,
    chapter: Number(match[1]),
    startVerse: match[2] ? Number(match[2]) : undefined,
    endVerse: match[3] ? Number(match[3]) : undefined
  };
}

function flattenBsbVerseContent(content: any[]) {
  return (content || [])
    .map((piece) => {
      if (typeof piece === "string") return piece;
      if (typeof piece?.text === "string") return piece.text;
      if (typeof piece?.heading === "string") return piece.heading;
      if (piece?.lineBreak) return " ";
      return "";
    })
    .filter(Boolean)
    .join(" ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([“‘(\[])\s+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function formatBsbReference(parsed: { bookName: string; chapter: number; startVerse?: number; endVerse?: number }) {
  if (!parsed.startVerse) return `${parsed.bookName} ${parsed.chapter}`;
  return `${parsed.bookName} ${parsed.chapter}:${parsed.startVerse}${parsed.endVerse ? `-${parsed.endVerse}` : ""}`;
}

function resolveBibleBookReference(reference: string) {
  const normalizedReference = normalizeBibleBookLookupKey(reference);
  const aliases = buildBibleBookAliasEntries();
  const matched = aliases.find(({ key }) => {
    if (normalizedReference === key) return true;
    if (!normalizedReference.startsWith(key)) return false;
    const nextChar = normalizedReference.slice(key.length, key.length + 1);
    return !nextChar || /\s|\d|:|-/.test(nextChar);
  });

  if (!matched) return null;

  return {
    book: matched.book,
    rest: normalizedReference.slice(matched.key.length).trim()
  };
}

function buildBibleBookAliasEntries() {
  const entries = new Map<string, string>();
  const add = (alias: string, book: string) => {
    const key = normalizeBibleBookLookupKey(alias);
    if (key) entries.set(key, book);
  };

  [...bibleBooks, "Psalm"].forEach((book) => {
    add(book, book);
    add(book.replace(/\s+/g, ""), book);
  });
  Object.entries(BIBLE_BOOK_ALIASES).forEach(([alias, book]) => add(alias, book));

  return Array.from(entries, ([key, book]) => ({ key, book })).sort((a, b) => b.key.length - a.key.length);
}

function normalizeBibleBookLookupKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[.]/g, "")
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
}

const BSB_BOOK_IDS: Record<string, string> = {
  Genesis: "GEN",
  Exodus: "EXO",
  Leviticus: "LEV",
  Numbers: "NUM",
  Deuteronomy: "DEU",
  Joshua: "JOS",
  Judges: "JDG",
  Ruth: "RUT",
  "1 Samuel": "1SA",
  "2 Samuel": "2SA",
  "1 Kings": "1KI",
  "2 Kings": "2KI",
  "1 Chronicles": "1CH",
  "2 Chronicles": "2CH",
  Ezra: "EZR",
  Nehemiah: "NEH",
  Esther: "EST",
  Job: "JOB",
  Psalm: "PSA",
  Proverbs: "PRO",
  Ecclesiastes: "ECC",
  "Song of Solomon": "SNG",
  Isaiah: "ISA",
  Jeremiah: "JER",
  Lamentations: "LAM",
  Ezekiel: "EZK",
  Daniel: "DAN",
  Hosea: "HOS",
  Joel: "JOL",
  Amos: "AMO",
  Obadiah: "OBA",
  Jonah: "JON",
  Micah: "MIC",
  Nahum: "NAM",
  Habakkuk: "HAB",
  Zephaniah: "ZEP",
  Haggai: "HAG",
  Zechariah: "ZEC",
  Malachi: "MAL",
  Matthew: "MAT",
  Mark: "MRK",
  Luke: "LUK",
  John: "JHN",
  Acts: "ACT",
  Romans: "ROM",
  "1 Corinthians": "1CO",
  "2 Corinthians": "2CO",
  Galatians: "GAL",
  Ephesians: "EPH",
  Philippians: "PHP",
  Colossians: "COL",
  "1 Thessalonians": "1TH",
  "2 Thessalonians": "2TH",
  "1 Timothy": "1TI",
  "2 Timothy": "2TI",
  Titus: "TIT",
  Philemon: "PHM",
  Hebrews: "HEB",
  James: "JAS",
  "1 Peter": "1PE",
  "2 Peter": "2PE",
  "1 John": "1JN",
  "2 John": "2JN",
  "3 John": "3JN",
  Jude: "JUD",
  Revelation: "REV"
};

function studyKey(passage: string, methodId: string) {
  return `${(passage.trim() || "Selected passage").toLowerCase()}|${methodId}`;
}

function parsePassageQuery(query: string) {
  const compact = query.trim().replace(/\s+/g, " ");
  if (!compact) return { reference: "" };

  const normalized = compact.replace(/\s*:\s*/g, ":").replace(/\s*-\s*/g, "-");
  const resolved = resolveBibleBookReference(normalized);
  if (!resolved) return { reference: normalized };

  const rest = resolved.rest;
  const parts = rest.match(/^(\d+)?(?:\s+|:)?(\d+)?(?:-(\d+))?$/);
  const chapter = parts?.[1] || "";
  const startVerse = parts?.[2] || "";
  const endVerse = parts?.[3] || "";
  const verse = startVerse ? `:${startVerse}${endVerse ? `-${endVerse}` : ""}` : "";

  return {
    reference: `${normalizeBibleBookName(resolved.book)}${chapter ? ` ${chapter}` : ""}${verse}`.trim()
  };
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

function getTiptapTextBeforeCursor(editor: Editor) {
  const { from } = editor.state.selection;
  return editor.state.doc.textBetween(0, from, "\n");
}

function findTiptapScriptureReferenceBeforeCursor(editor: Editor) {
  const { from } = editor.state.selection;
  if (!editor.state.selection.empty) return { textBeforeCursor: "", match: null };

  const textMap = getTiptapTextMapBeforeCursor(editor, from);
  const scanStart = Math.max(0, textMap.text.length - 700);
  const textBeforeCursor = textMap.text.slice(scanStart);
  const match = findTypedScriptureReferenceMatches(textBeforeCursor).at(-1);
  if (!match) return { textBeforeCursor, match: null };

  const textAfterMatch = textBeforeCursor.slice(match.end);
  if (textAfterMatch.length > 0) {
    return { textBeforeCursor, match: null };
  }

  const mappedStart = textMap.positions[scanStart + match.start];
  const mappedEnd = textMap.positions[scanStart + match.end - 1];
  if (!Number.isFinite(mappedStart) || !Number.isFinite(mappedEnd)) return { textBeforeCursor, match: null };

  return {
    textBeforeCursor,
    match: {
      ...match,
      from: mappedStart,
      to: Math.min(from, mappedEnd + 1)
    }
  };
}

function getTiptapTextMapBeforeCursor(editor: Editor, cursorPosition: number) {
  let text = "";
  const positions: number[] = [];

  editor.state.doc.descendants((node, pos) => {
    if (pos >= cursorPosition) return false;

    if (node.isText) {
      const nodeText = node.text || "";
      const end = Math.min(nodeText.length, Math.max(0, cursorPosition - pos));
      for (let index = 0; index < end; index += 1) {
        text += nodeText[index];
        positions.push(pos + index);
      }
      return false;
    }

    if (node.isBlock && text && !text.endsWith("\n")) {
      text += "\n";
      positions.push(Math.max(1, pos));
    }

    return true;
  });

  return { text, positions };
}

function getTiptapActiveFormats(editor: Editor): NoteFormatKind[] {
  const formats: NoteFormatKind[] = [];
  if (editor.isActive("bold")) formats.push("bold");
  if (editor.isActive("italic")) formats.push("italic");
  if (editor.isActive("underline")) formats.push("underline");
  if (editor.isActive("highlight")) formats.push("highlight");
  if (editor.isActive("bulletList")) formats.push("bullet");
  return formats;
}

function scriptureEditorMatchesEqual(
  left: { reference: string; typed: string; from: number; to: number } | null,
  right: { reference: string; typed: string; from: number; to: number } | null
) {
  if (left === right) return true;
  if (!left || !right) return false;
  return left.reference === right.reference && left.typed === right.typed && left.from === right.from && left.to === right.to;
}

function noteFormatArraysEqual(left: NoteFormatKind[], right: NoteFormatKind[]) {
  if (left.length !== right.length) return false;
  return left.every((format, index) => format === right[index]);
}

function updateTiptapScripturePopoverPosition(
  editor: Editor,
  wrapper: any,
  setPosition: Dispatch<SetStateAction<{ left: number; top: number }>>
) {
  if (!wrapper) return;
  const view = editor.view;
  let coords;
  try {
    coords = view.coordsAtPos(editor.state.selection.from);
  } catch {
    return;
  }
  const wrapperRect = wrapper.getBoundingClientRect?.();
  const editorRect = view.dom.getBoundingClientRect?.();
  if (!coords || !wrapperRect || !editorRect) return;

  const left = Math.max(8, Math.min(coords.left - wrapperRect.left + 24, wrapperRect.width - 260));
  const top = Math.max(editorRect.top - wrapperRect.top + 8, coords.top - wrapperRect.top - 46);
  setPosition((current) => Math.abs(current.left - left) < 1 && Math.abs(current.top - top) < 1 ? current : { left, top });
}

function updateTiptapMobileMiniBarPosition(
  editor: Editor,
  wrapper: any,
  setPosition: Dispatch<SetStateAction<{ left: number; top: number }>>
) {
  if (!wrapper || editor.state.selection.empty) return;

  const view = editor.view;
  let coords;
  try {
    coords = view.coordsAtPos(editor.state.selection.to);
  } catch {
    return;
  }

  const wrapperRect = wrapper.getBoundingClientRect?.();
  const editorRect = view.dom.getBoundingClientRect?.();
  if (!coords || !wrapperRect || !editorRect) return;

  const estimatedWidth = 292;
  const left = Math.max(8, Math.min(coords.left - wrapperRect.left - estimatedWidth / 2, wrapperRect.width - estimatedWidth - 8));
  const top = Math.max(editorRect.top - wrapperRect.top + 8, coords.bottom - wrapperRect.top + 48);
  setPosition((current) => Math.abs(current.left - left) < 1 && Math.abs(current.top - top) < 1 ? current : { left, top });
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

function shortBibleTranslationName(name?: string) {
  const normalized = (name || "").toLowerCase();
  if (normalized.includes("berean")) return "BSB";
  if (normalized.includes("world english")) return "WEB";
  if (normalized.includes("king james")) return "KJV";
  return name || "";
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
    flexDirection: "row",
    gap: 10,
    maxWidth: "100%",
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: "100%"
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
    paddingBottom: 12
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
    justifyContent: "center",
    width: 38
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
  activeMobileReaderChapterText: {
    color: "white"
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
    borderRadius: 10,
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
    backgroundColor: colors.soft,
    borderRadius: 999,
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
  phonePlanActionRow: {
    flexWrap: "nowrap",
    gap: 6
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
    backgroundColor: colors.sage
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
  planPageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14
  },
  phonePlanPageGrid: {
    gap: 10
  },
  planPageCard: {
    gap: 10,
    maxWidth: "100%",
    width: 360
  },
  phonePlanPageCard: {
    gap: 8,
    padding: 12,
    width: "100%"
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
  planPageDay: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderRadius: 12,
    flexDirection: "row",
    gap: 9,
    padding: 10
  },
  phonePlanPageDay: {
    borderRadius: 10,
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 8
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
    backgroundColor: "#2d352d",
    borderColor: "rgba(233, 183, 106, 0.22)"
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
  memoryDarkBlankInput: {
    color: "#f7eddc"
  },
  memoryDarkCorrectBlankInput: {
    backgroundColor: "rgba(233, 183, 106, 0.14)",
    borderColor: "rgba(233, 183, 106, 0.34)",
    borderBottomColor: "#e9b76a",
    color: "#f7eddc"
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
  memoryDiscoverLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
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
  reviewScheduleBox: {
    backgroundColor: "rgba(255, 250, 242, 0.82)",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 10
  },
  memorySection: {
    gap: 10
  },
  memorySectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    marginTop: 4
  },
  memorySectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800"
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
  memoryCard: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 14
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
  memoryBlankWrap: {
    alignItems: "center",
    gap: 1,
    minHeight: 45
  },
  memoryBlankInput: {
    backgroundColor: "transparent",
    borderBottomColor: colors.coral,
    borderBottomWidth: 2,
    borderColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 25,
    minHeight: 32,
    paddingHorizontal: 4,
    paddingVertical: 0,
    width: "100%",
    textAlign: "center"
  },
  correctMemoryBlankInput: {
    backgroundColor: "rgba(138, 154, 91, 0.14)",
    borderColor: "rgba(102, 114, 78, 0.35)",
    borderBottomColor: colors.olive
  },
  hintedMemoryBlankInput: {
    backgroundColor: "rgba(201, 103, 80, 0.08)"
  },
  memoryHintText: {
    color: colors.coral,
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 12
  },
  memoryHintRow: {
    alignItems: "center",
    gap: 2
  },
  moreMemoryHintButton: {
    paddingHorizontal: 3,
    paddingVertical: 1
  },
  moreMemoryHintText: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 10
  },
  incorrectMemoryBlankInput: {
    backgroundColor: "rgba(201, 103, 80, 0.18)",
    borderColor: "rgba(201, 103, 80, 0.75)",
    borderBottomColor: colors.coral,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.coral
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
    marginBottom: 12
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
    borderRadius: 10,
    gap: 9,
    minWidth: 0,
    padding: 10,
    width: "100%"
  },
  phoneHelpGridItem: {
    minWidth: 0,
    width: "100%"
  },
  phoneHelpGuideHeader: {
    alignItems: "flex-start",
    marginBottom: 2
  },
  helpGuideTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    minWidth: 0
  },
  helpGuideStepList: {
    gap: 7
  },
  helpGuideStep: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8
  },
  phoneHelpGuideStep: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 9,
    borderWidth: 1,
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  helpDarkGuideStep: {
    backgroundColor: "#202625",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  helpGuideStepNumber: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    color: colors.oliveDark,
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
    fontSize: 13,
    lineHeight: 19
  },
  phoneHelpGuideStepText: {
    fontSize: 12,
    lineHeight: 16
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
  memoryPrintOptionsCard: {
    overflow: "hidden"
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
  printOptionsActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    flexShrink: 0,
    gap: 10,
    justifyContent: "flex-end"
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
  journalStatusCluster: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 7
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
    backgroundColor: "#fff6eb",
    borderColor: "rgba(201, 103, 80, 0.28)",
    borderRadius: 999,
    borderWidth: 1,
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
