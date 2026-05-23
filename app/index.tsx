import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { api } from "@/convex/_generated/api";
import { bibleBooks } from "@/data/bibleBooks";
import { getDeviceKey } from "@/data/deviceKey";
import { getActiveCheckinPartnerId, getCompletedPlanDays, getPinnedJournalEntries, getStoredAiAccessChoice, getStoredBibleBookmarks, getStoredBibleReadChapters, getStoredBibleReaderHistory, getStoredBibleReaderPosition, getStoredBibleTranslation, getStoredCheckinPartners, getStoredCollapsedStudyPanels, getStoredCustomWritingPrompts, getStoredStudyFocusMode, getStoredTutorCoachingEnabled, saveActiveCheckinPartnerId, saveCompletedPlanDays, savePinnedJournalEntries, saveStoredAiAccessChoice, saveStoredBibleBookmarks, saveStoredBibleReadChapters, saveStoredBibleReaderHistory, saveStoredBibleReaderPosition, saveStoredBibleTranslation, saveStoredCheckinPartners, saveStoredCollapsedStudyPanels, saveStoredCustomWritingPrompts, saveStoredStudyFocusMode, saveStoredTutorCoachingEnabled, type StoredBibleBookmark, type StoredBibleReadChapters, type StoredBibleReaderHistoryItem, type StoredCheckinPartner } from "@/data/feedbackPreferences";
import { methods } from "@/data/methods";
import { studyPlans } from "@/data/studyPlans";
import { AppButton, Card, Eyebrow, colors } from "@/components/ui";
import { useAction, useMutation, useQuery } from "convex/react";
import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { Image, Keyboard, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";

type Tab = "home" | "study" | "bible" | "plans" | "methods" | "memory" | "accountability" | "journal" | "account" | "help" | "admin";
const tabs: Tab[] = ["home", "study", "bible", "plans", "methods", "memory", "accountability", "journal", "account", "help", "admin"];
type StudyPhase = "study" | "review" | "saved";
type JournalFilter = "all" | "pinned" | "drafts" | "studies" | "checkins" | "highlights" | "reviews";
type JournalView = "list" | "calendar" | "scripture";
type MemoryView = "review" | "browse";
type MemoryBrowseStatusFilter = "all" | "due" | "learning" | "memorized";
type MemoryReviewPreset = "later-today" | "tomorrow" | "three-days" | "next-week" | "next-month";
type StudyReviewPreset = "tomorrow" | "three-days" | "next-week" | "next-month";
type StudySidePanelKey = "community" | "plan" | "feedback" | "helps";
type ReaderMobileMenu = "old" | "new" | null;
type BibleSearchScope = "all" | "old" | "new";
type WorksheetWritingSpace = "standard" | "more";
type AnswerMap = Record<string, string>;
type SmartFeedback = {
  encouragement: string;
  textGrounding: string;
  nextRevision: string;
  source: "local" | "openai";
};
type AiAccessOption = "free" | "own-key" | "premium";
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
type NoteFormatKind = "bold" | "italic" | "underline" | "highlight" | "bullet";
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

const BIBLE_TRANSLATIONS: { id: BibleTranslationId; label: string; name: string }[] = [
  { id: "bsb", label: "BSB", name: "Berean Standard Bible" },
  { id: "web", label: "WEB", name: "World English Bible" },
  { id: "kjv", label: "KJV", name: "King James Version" }
];
const PREMIUM_TRANSLATION_PLACEHOLDERS = [
  "NIV",
  "ESV",
  "NKJV",
  "NLT",
  "CSB"
];
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
const OLD_TESTAMENT_BOOKS = bibleBooks.slice(0, bibleBooks.indexOf("Matthew"));
const NEW_TESTAMENT_BOOKS = bibleBooks.slice(bibleBooks.indexOf("Matthew"));
const PASSAGE_MARKUP_OPTIONS: { id: PassageMarkupKind; label: string; background: string; color: string }[] = [
  { id: "notice", label: "Notice", background: "#dfead5", color: colors.oliveDark },
  { id: "question", label: "Question", background: "#f4dfb6", color: "#6d4b16" },
  { id: "truth", label: "Key truth", background: "#f5cfc5", color: "#783423" },
  { id: "apply", label: "Apply", background: "#d7e7eb", color: colors.blue }
];
const MEMORY_REVIEW_OPTIONS: { id: MemoryReviewPreset; label: string }[] = [
  { id: "later-today", label: "Later today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "three-days", label: "In 3 days" },
  { id: "next-week", label: "Next week" },
  { id: "next-month", label: "Next month" }
];
const STUDY_REVIEW_OPTIONS: { id: StudyReviewPreset; label: string }[] = [
  { id: "tomorrow", label: "Tomorrow" },
  { id: "three-days", label: "In 3 days" },
  { id: "next-week", label: "In 1 week" },
  { id: "next-month", label: "In 1 month" }
];
const LEGAL_LAST_UPDATED = "May 23, 2026";
const ADMIN_WORLD_MAP_URI = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/BlankMap-World.svg/1280px-BlankMap-World.svg.png";
type AdminRegionInsight = { name: string; description: string; count: number; x: number; y: number; size: "small" | "medium" | "large" };
const ADMIN_REGION_PREVIEW: AdminRegionInsight[] = [
  { name: "Australia", description: "Broad region only", count: 0, x: 79, y: 73, size: "large" },
  { name: "Europe", description: "Broad region only", count: 0, x: 52, y: 32, size: "medium" },
  { name: "North America", description: "Broad region only", count: 0, x: 23, y: 35, size: "medium" },
  { name: "Africa", description: "Broad region only", count: 0, x: 52, y: 55, size: "small" },
  { name: "Asia", description: "Broad region only", count: 0, x: 70, y: 38, size: "small" }
];
const PRIVACY_POLICY_SECTIONS = [
  {
    title: "Who we are",
    body: "Bible Study Tutor is a free Bible reading and study app available at biblestudytutor.org. For privacy questions, data requests, account deletion, or concerns, contact support@biblestudytutor.org."
  },
  {
    title: "Information you provide",
    body: "The app may store your name, email address, password-protected account details, study notes, journal entries, saved highlights, bookmarks, memory verses, review dates, check-ins, goals, feedback messages, and app preferences."
  },
  {
    title: "Faith and personal reflections",
    body: "Your notes, journal entries, check-ins, and feedback may include religious beliefs, prayer needs, personal struggles, or other sensitive reflections. By choosing to save that content, you consent to the app storing and using it to provide the features you request. Please write thoughtfully and avoid adding information you would not want stored in the app."
  },
  {
    title: "How we use information",
    body: "We use your information to create and secure your account, save and sync your studies, personalize encouragement by name, restore your work across devices, provide Bible reading, journaling and memory tools, respond to feedback, improve the app, and protect the service from misuse."
  },
  {
    title: "Information we do not intentionally collect",
    body: "Bible Study Tutor does not intentionally collect payment card details, precise location, government identity numbers, or contact lists. The app does not sell personal study data."
  },
  {
    title: "Local and cloud storage",
    body: "If you use the app without signing in, some preferences and local work may be connected to your device. If you create an account, account-linked data is stored through Convex so it can sync between devices. The live Convex deployment currently runs in the United States."
  },
  {
    title: "Hosting and service providers",
    body: "The website is hosted with Cloudflare Pages and the app backend is provided by Convex. These providers process data needed to deliver, secure, store, and operate the app. Depending on how those services route traffic and store data, information may be processed outside Australia."
  },
  {
    title: "Local storage and device information",
    body: "The app may use local storage on your device to remember settings such as Bible translation, reading position, focus mode, device profile, and sign-in state. Hosting and backend providers may also process normal technical information such as browser type, request details, and security logs."
  },
  {
    title: "Admin insights and feedback",
    body: "Administrators may view feedback you submit and limited app insights such as account/profile counts, recent activity types, popular bookmarked verses, popular memory verses, search terms, and feature usage. These insights are used to improve the app and keep it helpful and safe."
  },
  {
    title: "AI and coaching",
    body: "Free coaching is generated locally in the app and does not require paid AI usage. Deeper AI feedback is optional and should only run if you deliberately enable it in the future. Do not enter sensitive information into optional AI features unless you are comfortable with that processing."
  },
  {
    title: "Sharing from the app",
    body: "The app can help you copy or share study insights and check-in messages, but you choose where to send them. Once you share content outside the app, that outside service or recipient controls what happens to it."
  },
  {
    title: "Data retention and deletion",
    body: "We keep account and study data while your account is active or while it is needed to operate the app. You can delete many items inside the app, including journal entries, memory verses, bookmarks, notes, and drafts. To request account deletion or broader data removal, contact support@biblestudytutor.org."
  },
  {
    title: "Access, correction, deletion, and complaints",
    body: "You can update your name and account details in the Account tab. To ask for access to your data, correction of data, deletion, or to raise a privacy concern, contact support@biblestudytutor.org. We will respond as reasonably as we can. If you are not satisfied with the response, you may also contact the Office of the Australian Information Commissioner."
  },
  {
    title: "Security",
    body: "We take reasonable steps to protect the app and stored information, including account access controls and backend authorization checks. No online service can be guaranteed completely secure, so use a strong password and sign out on shared devices."
  },
  {
    title: "Children and shared devices",
    body: "Bible Study Tutor is intended for general church and personal study use. If a child uses the app, a parent or guardian should supervise their account and what they write. On shared devices, sign out when finished."
  },
  {
    title: "Changes to this policy",
    body: "We may update this policy as the app changes. The latest version will be shown in the Account tab and will include the date it was last updated."
  }
];
const TERMS_OF_SERVICE_SECTIONS = [
  {
    title: "Acceptance of these terms",
    body: "By using Bible Study Tutor, you agree to these terms. If you do not agree, please do not use the app."
  },
  {
    title: "Purpose of the app",
    body: "Bible Study Tutor is a free study tool designed to support Bible reading, guided study methods, journaling, memorization, bookmarks, highlights, printable worksheets, feedback, and simple community check-ins."
  },
  {
    title: "Not professional advice",
    body: "The app is not a substitute for pastoral care, counselling, medical, legal, financial, emergency, or crisis support. If you need urgent help, contact appropriate local services, church leaders, or qualified professionals."
  },
  {
    title: "Your account",
    body: "Creating an account is free. You are responsible for keeping your sign-in details secure and for activity on your account. Use accurate account information, sign out on shared devices, and tell us if you believe your account has been misused."
  },
  {
    title: "Your content",
    body: "You keep ownership of the notes, reflections, check-ins, and feedback you create. You give Bible Study Tutor permission to store and process that content so the app can provide its features, sync your account, improve the service, and respond to feedback."
  },
  {
    title: "Write and share wisely",
    body: "You are responsible for what you write, save, copy, or share from the app. Do not use the app to harass, threaten, exploit, mislead, or harm others, and do not add another person's private information without permission."
  },
  {
    title: "Bible translations and third-party content",
    body: "The app may include public-domain or permission-based Bible text options such as BSB, WEB, and KJV access paths. Bible translation names and content remain the property of their respective rights holders. Future modern paid translations may require publisher licensing, purchase terms, or app store rules before they are available."
  },
  {
    title: "Free access and future changes",
    body: "The intention is to keep the core app free and accessible to the church. Features, hosting, Bible translation availability, optional premium ideas, and AI options may change over time, especially while the app is still growing."
  },
  {
    title: "Fair use and security",
    body: "Do not scrape, spam, overload, reverse engineer, bypass security, attempt to access another user's data, interfere with the service, or use automated/bot activity in a way that harms the app or other users."
  },
  {
    title: "Respectful use",
    body: "Do not use the app to store or share unlawful, abusive, exploitative, hateful, threatening, or deliberately misleading content. Do not impersonate another person or use the app to harm churches, groups, or individuals."
  },
  {
    title: "Feedback",
    body: "If you send feedback, you allow us to review it, store it, classify it, act on it, and use it to improve the app. Please do not include private information in feedback unless it is necessary."
  },
  {
    title: "Availability",
    body: "The app is provided as-is. We aim to keep it reliable, but we cannot promise uninterrupted access, permanent data availability, or that every feature will always work on every device or browser."
  },
  {
    title: "Account limits or removal",
    body: "We may limit, suspend, or remove access if an account appears to be used for abuse, security attacks, unlawful activity, or conduct that harms the app or other users."
  },
  {
    title: "Liability",
    body: "To the extent permitted by law, Bible Study Tutor is not liable for indirect loss, lost data, missed spiritual or practical outcomes, or decisions you make based on app content. Use Scripture, wisdom, community, and qualified help together."
  },
  {
    title: "Australian operation",
    body: "Bible Study Tutor is operated from Australia. These terms are intended to be read in a way that is consistent with applicable Australian law and any rights that cannot legally be excluded."
  },
  {
    title: "Changes to these terms",
    body: "We may update these terms as the app changes. Continued use of the app after updated terms are shown means you accept the updated terms."
  }
];
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
  const { width } = useWindowDimensions();
  const ensureProfile = useMutation(api.study.ensureProfile);
  const saveSession = useMutation(api.study.saveSession);
  const scheduleStudyReviewMutation = useMutation(api.study.scheduleStudyReview);
  const completeStudyReviewMutation = useMutation(api.study.completeStudyReview);
  const saveDraft = useMutation(api.study.saveDraft);
  const deleteDraftMutation = useMutation(api.study.deleteDraft);
  const deleteSessionMutation = useMutation(api.study.deleteSession);
  const getDeeperFeedback = useAction(api.study.getDeeperFeedback);
  const savePlan = useMutation(api.accountability.savePlan);
  const saveAccountSettings = useMutation(api.accountability.saveAccountSettings);
  const changePassword = useAction(api.accountability.changePassword);
  const saveCheckin = useMutation(api.accountability.saveCheckin);
  const deleteCheckinMutation = useMutation(api.accountability.deleteCheckin);
  const updateCheckin = useMutation(api.accountability.updateCheckin);
  const saveMemoryVerse = useMutation(api.memory.saveVerse);
  const recordMemoryPractice = useMutation(api.memory.recordPractice);
  const removeMemoryVerse = useMutation(api.memory.remove);
  const scheduleMemoryReview = useMutation((api as any).memory.scheduleReview);
  const submitFeedback = useMutation((api as any).insights.submitFeedback);
  const recordUsage = useMutation((api as any).insights.recordUsage);
  const markFeedbackStatus = useMutation((api as any).insights.markFeedbackStatus);
  const requestAccountDeletion = useMutation((api as any).insights.requestAccountDeletion);
  const cancelAccountDeletionRequest = useMutation((api as any).insights.cancelAccountDeletionRequest);
  const approveDeletionRequestAsAdmin = useMutation((api as any).insights.approveDeletionRequestAsAdmin);
  const cancelDeletionRequestAsAdmin = useMutation((api as any).insights.cancelDeletionRequestAsAdmin);
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
  const [passwordStatus, setPasswordStatus] = useState("");
  const [currentAccountPassword, setCurrentAccountPassword] = useState("");
  const [newAccountPassword, setNewAccountPassword] = useState("");
  const [authFlow, setAuthFlow] = useState<AuthFlow>("signIn");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const [feedbackCategory, setFeedbackCategory] = useState<"bug" | "confusing" | "suggestion" | "encouragement" | "other">("suggestion");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");
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
  const [studyStepAnchorY, setStudyStepAnchorY] = useState(0);
  const [studyFocusMode, setStudyFocusMode] = useState(false);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [answerSelection, setAnswerSelection] = useState({ start: 0, end: 0 });
  const [lastAnswerSelection, setLastAnswerSelection] = useState({ start: 0, end: 0 });
  const [detectedScriptureReference, setDetectedScriptureReference] = useState("");
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
  const [checkinMarkedSent, setCheckinMarkedSent] = useState(false);
  const [isSavingCheckin, setIsSavingCheckin] = useState(false);
  const [peoplePanelCollapsed, setPeoplePanelCollapsed] = useState(false);
  const [recentCheckinsExpanded, setRecentCheckinsExpanded] = useState(false);
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
  const [activeMemoryVerseId, setActiveMemoryVerseId] = useState("");
  const [reviewScheduleVerseId, setReviewScheduleVerseId] = useState("");
  const [memoryPracticeLevel, setMemoryPracticeLevel] = useState(1);
  const [memoryPracticeAnswers, setMemoryPracticeAnswers] = useState<Record<number, string>>({});
  const [memoryPracticeResult, setMemoryPracticeResult] = useState("");
  const [memoryPracticeChecked, setMemoryPracticeChecked] = useState(false);
  const [memoryHintsVisible, setMemoryHintsVisible] = useState(false);
  const [memoryHintLevels, setMemoryHintLevels] = useState<Record<number, number>>({});
  const [memoryStepTwoOffset, setMemoryStepTwoOffset] = useState(0);
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
  const [savedStudySummary, setSavedStudySummary] = useState<SavedStudySummary | null>(null);
  const [shareInsightStatus, setShareInsightStatus] = useState("");
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
  const [smartFeedback, setSmartFeedback] = useState<SmartFeedback | null>(null);
  const [smartFeedbackKey, setSmartFeedbackKey] = useState("");
  const [smartFeedbackStatus, setSmartFeedbackStatus] = useState("");
  const [acceptedCoaching, setAcceptedCoaching] = useState<Record<string, SmartFeedback>>({});
  const [showAiOptions, setShowAiOptions] = useState(false);
  const [aiAccessChoice, setAiAccessChoice] = useState<AiAccessOption>("free");
  const [aiDetailsOpen, setAiDetailsOpen] = useState<AiAccessOption>("free");
  const [bibleTranslation, setBibleTranslation] = useState<BibleTranslationId>("bsb");
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
  const [bibleSearchExact, setBibleSearchExact] = useState(false);
  const [bibleSearchCollapsed, setBibleSearchCollapsed] = useState(true);
  const [bibleSearchBookMenuOpen, setBibleSearchBookMenuOpen] = useState(false);
  const [bibleSearchResults, setBibleSearchResults] = useState<BibleSearchResult[]>([]);
  const [bibleSearchStatus, setBibleSearchStatus] = useState("");
  const [bibleSearchActiveQuery, setBibleSearchActiveQuery] = useState("");
  const readerTooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appScrollRef = useRef<any>(null);
  const previousTabRef = useRef<Tab>(tab);

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
    const pendingTab = typeof localStorage !== "undefined" ? localStorage.getItem("bibleStudyTutorReturnTab") : "";
    const nextTab = tabs.includes(requestedTab as Tab) ? requestedTab : tabs.includes(pendingTab as Tab) ? pendingTab : "";
    if (nextTab) setTab(nextTab as Tab);
    if (typeof localStorage !== "undefined") localStorage.removeItem("bibleStudyTutorReturnTab");
    if (requestedTab) {
      url.searchParams.delete("tab");
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
    getStoredAiAccessChoice()
      .then((choice) => {
        setAiAccessChoice(choice);
        setAiDetailsOpen(choice);
      })
      .catch(() => undefined);
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

  const activeProfileId = profileAuthState === isAuthenticated ? profileId : null;
  const stats = useQuery(api.study.stats, activeProfileId ? { profileId: activeProfileId } : "skip");
  const sessions = useQuery(api.study.recentSessions, activeProfileId ? { profileId: activeProfileId, limit: 12 } : "skip");
  const savedDraft = useQuery(
    api.study.draftForPassage,
    activeProfileId ? { profileId: activeProfileId, passage: passage.trim() || "Selected passage", methodId } : "skip"
  );
  const drafts = useQuery(api.study.recentDrafts, activeProfileId ? { profileId: activeProfileId, limit: 12 } : "skip");
  const dueStudyReviews = useQuery(api.study.dueStudyReviews, activeProfileId ? { profileId: activeProfileId, limit: 10 } : "skip");
  const checkins = useQuery(api.accountability.recentCheckins, activeProfileId ? { profileId: activeProfileId, limit: 12 } : "skip");
  const memoryVerses = useQuery(api.memory.list, activeProfileId ? { profileId: activeProfileId, limit: 50 } : "skip");
  const profile = useQuery(api.accountability.profile, activeProfileId ? { profileId: activeProfileId } : "skip");
  const adminOverview = useQuery((api as any).insights.adminOverview, activeProfileId ? {} : "skip");
  const accountDeletionRequest = useQuery((api as any).insights.deletionRequestForProfile, activeProfileId ? { profileId: activeProfileId } : "skip");
  const adminUsers = useQuery((api as any).insights.adminUsers, activeProfileId ? {} : "skip");
  const adminUserDetail = useQuery((api as any).insights.adminUserDetail, selectedAdminProfileId ? { profileId: selectedAdminProfileId } : "skip");
  const adminAuditLog = useQuery((api as any).insights.adminAuditLog, activeProfileId ? { limit: 20 } : "skip");
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
  const smartSuggestions = buildPassageSuggestions(passageQuery);
  const latestCheckin = checkins?.[0];
  const selectedPlan = studyPlans.find((item) => item.id === selectedPlanId) || studyPlans[0];
  const completedPlanDaySet = new Set(completedPlanDayKeys);
  const selectedPlanCompletedCount = selectedPlan.days.filter((day) => completedPlanDaySet.has(planDayKey(selectedPlan.id, day.day))).length;
  const selectedPlanNextDay = selectedPlan.days.find((day) => !completedPlanDaySet.has(planDayKey(selectedPlan.id, day.day))) || selectedPlan.days[0];
  const selectedPlanComplete = selectedPlanCompletedCount === selectedPlan.days.length;
  const backendReady = !!activeProfileId && profile !== undefined;
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
        : profile?.authProvider === "password"
          ? "email and password"
          : "your account";
  const personalDisplayName =
    displayName.trim() && displayName.trim() !== "Bible student"
      ? displayName.trim()
      : profile?.authName?.trim() || authName.trim() || "Bible student";
  const firstName = personalDisplayName !== "Bible student" ? personalDisplayName.split(/\s+/)[0] : "";
  const friendlyName = firstName || "friend";
  const accountIdentityLabel = profile?.authEmail ? `${personalDisplayName} (${profile.authEmail})` : personalDisplayName;
  const suggestedShareNote = buildShareNote(method, answers, passageText?.reference || passage);
  const activeCheckinPartner = checkinPartners.find((item) => item.id === activeCheckinPartnerId);
  const effectivePartner = activeCheckinPartner?.name || partner;
  const communityMessage = buildCommunityMessage({ partner: effectivePartner, senderName: firstName, checkinNote, shareNote: suggestedShareNote, passageReference: passageText?.reference || passage });
  const visibleCheckins = (checkins || []).slice(0, recentCheckinsExpanded ? 8 : 3);
  const currentCoaching = buildCoachingFeedback(method.id, step.title, stripNoteFormatting(answers[answerKey] || ""));
  const currentAcceptedCoaching = acceptedCoaching[answerKey];
  const passagePresets = buildPassagePresets(method.id);
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
  const adminStats = adminOverview as null | {
    totals: {
      profiles: number;
      signedInProfiles: number;
      localProfiles: number;
      activeProfiles7d: number;
      profilesWithStudies: number;
      events: number;
      feedback: number;
      newFeedback: number;
      pendingDeletionRequests: number;
    };
    topBookmarked: { label: string; count: number }[];
    topMemory: { label: string; count: number }[];
    topMethods: { label: string; count: number }[];
    topSearches: { label: string; count: number }[];
    eventBreakdown: { label: string; count: number }[];
    feedbackByCategory: { label: string; count: number }[];
    feedbackByStatus: { label: string; count: number }[];
    recentEvents: {
      _id: string;
      eventType: string;
      reference?: string;
      methodName?: string;
      tab?: string;
      createdAt: number;
    }[];
    recentFeedback: any[];
    deletionRequests: any[];
  };
  const bibleSearchBookOptions = useMemo(() => buildBibleSearchBookOptions(bibleSearchScope), [bibleSearchScope]);
  const bibleSearchSections = useMemo(() => buildBibleSearchSections(bibleSearchResults, bibleSearchScope, bibleSearchBook), [bibleSearchBook, bibleSearchResults, bibleSearchScope]);
  const bibleSearchTranslation = bibleTranslation === "kjv" ? "KJV" : "WEB";
  const journalSearchTerm = journalSearch.trim().toLowerCase();
  const pinnedEntryIds = new Set(pinnedJournalEntryIds);
  const baseVisibleDrafts = (drafts || []).filter((draft: any) => matchesJournalSearch(draft, journalSearchTerm));
  const baseHighlightJournalEntries = buildHighlightJournalEntries(sessions || [], drafts || [], journalSearchTerm);
  const totalSavedHighlightCount = countSavedHighlights(sessions || [], drafts || []);
  const baseJournalEntries = [
    ...(journalFilter === "reviews" ? dueStudyReviews || [] : []),
    ...(journalFilter === "all" || journalFilter === "pinned" || journalFilter === "studies" ? sessions || [] : []),
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
  const memoryQueueSections = useMemo(() => buildMemoryQueueSections(memoryVerses || []), [memoryVerses]);
  const memorySearchTerm = memorySearch.trim().toLowerCase();
  const memoryBookOptions = useMemo(() => buildMemoryBookOptions(memoryVerses || []), [memoryVerses]);
  const memoryChapterOptions = useMemo(() => buildMemoryChapterOptions(memoryVerses || [], memoryBookFilter), [memoryBookFilter, memoryVerses]);
  const memoryBrowseSections = useMemo(
    () => buildMemoryBrowseSections(memoryVerses || [], memorySearchTerm, memoryBookFilter, memoryChapterFilter, memoryBrowseStatusFilter),
    [memoryBookFilter, memoryBrowseStatusFilter, memoryChapterFilter, memorySearchTerm, memoryVerses]
  );
  const dueMemoryCount = (memoryVerses || []).filter((item: any) => !isMemoryVerseMemorized(item) && isMemoryVerseDue(item)).length;
  const memoryPracticeText = useMemo(
    () => (activeMemoryVerse ? buildMemoryPracticeText(activeMemoryVerse) : ""),
    [activeMemoryVerse]
  );
  const memoryPracticeTokens = useMemo(
    () => (memoryPracticeText ? buildMemoryPracticeTokens(memoryPracticeText, memoryPracticeLevel, memoryStepTwoOffset) : []),
    [memoryPracticeLevel, memoryPracticeText, memoryStepTwoOffset]
  );
  const memoryBlankTokens = memoryPracticeTokens.filter((token) => token.blank);
  const memoryPracticeAllCorrect =
    memoryBlankTokens.length > 0 &&
    memoryBlankTokens.every((token) => normalizeMemoryAnswer(memoryPracticeAnswers[token.index] || "") === normalizeMemoryAnswer(token.answer));
  const compactLayout = width < 900;
  const phoneLayout = width < 760;
  const phoneMemoryFocusMode = phoneLayout && tab === "memory" && !!activeMemoryVerseId;
  const visibleMemorySections = (memoryView === "review" ? memoryQueueSections : memoryBrowseSections)
    .map((section) => ({
      ...section,
      verses: phoneMemoryFocusMode
        ? section.verses.filter((verse: any) => String(verse._id) === activeMemoryVerseId)
        : section.verses
    }))
    .filter((section) => section.verses.length > 0);

  useEffect(() => {
    if (compactLayout && tab === "bible") setReaderNavCollapsed(true);
  }, [compactLayout, tab]);

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
  }, [profile]);

  useEffect(() => {
    if (savedDraft === undefined || loadedDraftKey === currentStudyKey) return;

    if (!savedDraft) {
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
    setAnswers(restoredAnswers);
    setPassageMarkups(markupRecordsToMap(savedDraft.passageMarkups || []));
    setPassageMarkupNotes(markupRecordsToNoteMap(savedDraft.passageMarkups || []));
    setSelectedVerseKeys([]);
    setStepIndex(pickResumeStepIndex(savedDraft.answers, savedDraft.stepIndex));
    setStudyPhase("study");
    setLoadedDraftKey(currentStudyKey);
      setSaveStatus(`Welcome back${firstName ? `, ${firstName}` : ""}. Your draft is restored.`);
    setShareNote(buildShareNote(method, restoredAnswers, savedDraft.passageReference || savedDraft.passage));
  }, [currentStudyKey, loadedDraftKey, method, savedDraft]);

  useEffect(() => {
    setDetectedScriptureReference("");
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
    setSelectedReaderVerses([]);
    setReaderActionVerse(0);
    setActiveBookmarkNoteId("");
    setBookmarkNoteDraft("");
    setReaderMemoryStatus("");
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
    setInstructionsCollapsed(false);
  }, [method.id, stepIndex]);

  useEffect(() => {
    if (selectedVerseKeys.length === 0) return;
    const visibleVerseKeys = new Set((passageText?.verses || []).map(verseMarkupKey));
    const nextSelectedVerseKeys = selectedVerseKeys.filter((key) => visibleVerseKeys.has(key));
    if (nextSelectedVerseKeys.length !== selectedVerseKeys.length) setSelectedVerseKeys(nextSelectedVerseKeys);
  }, [passageText?.verses, selectedVerseKeys]);

  useEffect(() => {
    if (!activeProfileId || loadedDraftKey !== currentStudyKey) return;

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
        coachingMoments: Object.entries(acceptedCoaching).map(([key, feedback]) => ({
          stepTitle: method.steps[Number(key.split(":")[1])]?.title || "Study step",
          encouragement: feedback.encouragement,
          textGrounding: feedback.textGrounding,
          nextRevision: feedback.nextRevision
        })),
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
    setSmartFeedback(null);
    setShowAiOptions(false);
    setAcceptedCoaching({});
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
    setAcceptedCoaching({});
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
    setSmartFeedback(null);
    setShowAiOptions(false);
    setAcceptedCoaching({});
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
    setSmartFeedback(null);
    setShowAiOptions(false);
    setAcceptedCoaching({});
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
    setSmartFeedback(null);
    setShowAiOptions(false);
    setAcceptedCoaching({});
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
    setSmartFeedback(null);
    setShowAiOptions(false);
    setAcceptedCoaching({});
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
    setPlanStatus("Check-in partner added");
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
        preferredMethodId: method.id
      });
      setAccountStatus("Account details saved");
    } catch {
      setAccountStatus("Could not save those details. Check the email is not already in use.");
    }
  }

  async function submitPasswordChange() {
    if (!isAuthenticated) return;
    setPasswordStatus("Updating password...");
    try {
      await changePassword({
        email: accountEmail,
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

  async function submitAuth() {
    const email = authEmail.trim();
    const name = authName.trim();
    if (!email || !authPassword) {
      setAuthStatus("Add your email and password first.");
      return;
    }
    if (authFlow === "signUp" && !name) {
      setAuthStatus("Add your name so the tutor can feel more personal.");
      return;
    }

    setAuthStatus(authFlow === "signIn" ? "Signing in..." : "Creating account...");
    try {
      await signIn("password", {
        email,
        name,
        password: authPassword,
        flow: authFlow
      });
      if (authFlow === "signUp") setDisplayName(name);
      setAuthPassword("");
      setAuthStatus(authFlow === "signIn" ? "Signed in" : "Account created");
    } catch {
      setAuthStatus(authFlow === "signIn" ? "Could not sign in. Check the email and password." : "Could not create account. Passwords need at least 8 characters.");
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
    if (!activeProfileId || !checkinNote.trim() || isSavingCheckin) return;

    setIsSavingCheckin(true);
    setCommunityStatus("Saving check-in...");
    try {
      await saveCheckin({ profileId: activeProfileId, mood: "check-in", note: checkinNote.trim(), sentAt: checkinMarkedSent ? Date.now() : undefined });
      setCommunityStatus(checkinMarkedSent ? "Sent check-in saved" : "Check-in saved");
      trackUsage("checkin_saved", { tab: "accountability" });
      setCheckinNote("");
      setCheckinMarkedSent(false);
    } finally {
      setIsSavingCheckin(false);
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
      checkinNote: checkin.note,
      shareNote: "",
      passageReference: passageText?.reference || passage
    });

    try {
      if (Platform.OS === "web" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
        setCommunityStatus("Past check-in copied");
        return;
      }

      const { Share } = await import("react-native");
      await Share.share({ message });
      setCommunityStatus("Share sheet opened. Mark as sent after you send it.");
    } catch {
      setCommunityStatus("Could not share from this device");
    }
  }

  function markCheckinMessageSent() {
    setCheckinMarkedSent(true);
    setCommunityStatus("Marked as sent. Save the check-in to keep the record.");
  }

  async function shareCommunityMessage() {
    try {
      if (Platform.OS === "web" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(communityMessage);
        setCommunityStatus("Message copied. Paste it into Messages, WhatsApp, email, or your group chat.");
        return;
      }

      const { Share } = await import("react-native");
      await Share.share({ message: communityMessage });
      setCommunityStatus("Share sheet opened");
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

  async function insertDetectedScripture() {
    if (!detectedScriptureReference) return;

    const controller = new AbortController();
    setScriptureInsertStatus(`Finding ${detectedScriptureReference}...`);
    try {
      const passageResult =
        bibleTranslation === "bsb"
          ? await fetchBsbPassage(detectedScriptureReference, controller.signal)
          : await fetchBibleApiPassage(detectedScriptureReference, bibleTranslation, controller.signal);
      setAnswers((current) => ({
        ...current,
        [answerKey]: expandScriptureReference(current[answerKey] || "", detectedScriptureReference, passageResult.text, Platform.OS === "web")
      }));
      setDetectedScriptureReference("");
      setScriptureInsertStatus(`Inserted ${passageResult.reference}`);
      setScriptureInsertFocusKey((key) => key + 1);
    } catch {
      setScriptureInsertStatus(`Could not find ${detectedScriptureReference}`);
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

  async function requestDeeperFeedback() {
    const answer = answers[answerKey]?.trim();
    if (!answer) return;

    setSmartFeedback(null);
    setSmartFeedbackKey(answerKey);
    setSmartFeedbackStatus("");
    setShowAiOptions(true);
  }

  function chooseAiAccess(option: AiAccessOption, createFeedback = false) {
    setAiAccessChoice(option);
    setAiDetailsOpen(option);
    saveStoredAiAccessChoice(option).catch(() => undefined);

    if (!createFeedback) {
      setSmartFeedbackStatus(option === "free" ? "Free local coaching selected" : "This feedback option is planned, but not active yet.");
      return;
    }

    setSmartFeedbackKey(answerKey);

    if (option === "free") {
      setSmartFeedback({
        encouragement: currentCoaching[0] || "You are engaging the passage thoughtfully.",
        textGrounding: "Free coaching uses built-in guidance, so it will not create any AI usage cost.",
        nextRevision: currentCoaching[1] || "Add one concrete word, image, or action from the passage to strengthen your answer.",
        source: "local"
      });
      setSmartFeedbackStatus("Free local coaching ready");
      setShowAiOptions(false);
      return;
    }

    if (option === "own-key") {
      setSmartFeedbackStatus("Personal AI keys are coming soon. For now, free local coaching is still available.");
      return;
    }

    setSmartFeedbackStatus("Premium subscriptions are coming soon. For now, free local coaching is still available.");
  }

  function acceptSmartFeedback() {
    if (!smartFeedback) return;
    setAcceptedCoaching((current) => ({ ...current, [answerKey]: smartFeedback }));
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
      setMemoryStatus(`Saved to Memory${firstName ? ` for ${firstName}` : ""}`);
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

    setReaderMemoryStatus("Saving to Memory...");
    try {
      await saveMemoryVerse({
        profileId: activeProfileId,
        reference: buildReaderStudyReference(readerBook, readerChapter, selectedReaderVerses),
        verseText: verses.map((verse) => verse.text.trim()).join(" "),
        translationName: readerPassage.translation_name
      });
      setReaderMemoryStatus("Saved to Memory");
      setMemoryStatus(`Saved to Memory${firstName ? ` for ${firstName}` : ""}`);
      trackUsage("memory_saved", {
        reference: buildReaderStudyReference(readerBook, readerChapter, selectedReaderVerses),
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

  function startMemoryPractice(verse: any) {
    setActiveMemoryVerseId(String(verse._id));
    setMemoryPracticeLevel(isMemoryVerseMemorized(verse) ? 1 : clampMemoryPracticeLevel(verse.practiceLevel || 1));
    setMemoryStepTwoOffset((verse.reviewCount || 0) % 2);
    setMemoryPracticeAnswers({});
    setMemoryPracticeResult("");
    setMemoryPracticeChecked(false);
    setMemoryHintsVisible(false);
    setMemoryHintLevels({});
    setMemoryStatus("");
    setTab("memory");
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
    const nextAnswers = { ...memoryPracticeAnswers, [index]: value };
    setMemoryPracticeAnswers((current) => ({ ...current, [index]: value }));
    setMemoryPracticeResult("");
    if (token && normalizeMemoryAnswer(value) === normalizeMemoryAnswer(token.answer)) {
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
      setActiveMemoryVerseId("");
      setMemoryStatus(`Well done${firstName ? `, ${firstName}` : ""}. You completed this verse from memory.`);
      return;
    }
    setMemoryPracticeResult("Great. Now try the full verse from blanks.");
  }

  function repeatMemoryPracticeStep() {
    if (memoryPracticeLevel <= 1) return;
    if (memoryPracticeLevel === 2) setMemoryStepTwoOffset((current) => (current === 0 ? 1 : 0));
    setMemoryPracticeAnswers({});
    setMemoryPracticeChecked(false);
    setMemoryHintsVisible(false);
    setMemoryHintLevels({});
    setMemoryPracticeResult(memoryPracticeLevel === 2 ? "Repeat step 2 with a fresh set of blanks." : "Repeat step 3 from the beginning.");
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
    setPendingDeleteMemoryVerseId("");
    setMemoryStatus("Memory verse removed");
  }

  async function scheduleMemoryVerseReview(verse: any, preset: MemoryReviewPreset) {
    if (!activeProfileId) return;

    await scheduleMemoryReview({ profileId: activeProfileId, memoryVerseId: verse._id, preset });
    setReviewScheduleVerseId("");
    setMemoryStatus(`Review set for ${reviewPresetLabel(preset).toLowerCase()}.`);
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
    setSmartFeedback(null);
    setShowAiOptions(false);
    setAcceptedCoaching({});
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
    if (phoneLayout) {
      setReaderNavCollapsed(true);
      setExpandedMobileReaderBook("");
    }
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

  async function runBibleSearch() {
    const query = bibleSearchQuery.trim();
    if (!query) {
      setBibleSearchStatus("Type a word, theme, idea, or question to search.");
      setBibleSearchResults([]);
      setBibleSearchActiveQuery("");
      return;
    }

    const translation = bibleTranslation === "kjv" ? "KJV" : "WEB";
    const queries = bibleSearchExact ? [query] : buildBibleSearchQueries(query);
    setBibleSearchStatus("Searching Scripture...");
    setBibleSearchActiveQuery(query);

    try {
      const responses = await Promise.all(queries.map((searchTerm) => fetchBibleSearchResults(searchTerm, translation, bibleSearchScope, bibleSearchBook, bibleSearchExact)));
      const combined = dedupeBibleSearchResults(responses.flat()).slice(0, 60);
      setBibleSearchResults(combined);
      setBibleSearchStatus(
        combined.length
          ? `${combined.length} result${combined.length === 1 ? "" : "s"} found${bibleSearchBook ? ` in ${bibleSearchBook}` : ""}${queries.length > 1 ? ` from ${queries.length} related searches` : ""}.`
          : "No results found. Try fewer words or a broader theme."
      );
      trackUsage("bible_search", { reference: query, translation, tab: "bible", book: bibleSearchBook || undefined });
    } catch {
      setBibleSearchStatus("I couldn't complete the search. Check your connection and try again.");
      setBibleSearchResults([]);
    }
  }

  function openBibleSearchResult(result: BibleSearchResult) {
    setReaderBook(result.book);
    setReaderChapter(result.chapter);
    setReaderChapterDraft(String(result.chapter));
    setSelectedReaderVerses([result.verse]);
    setReaderActionVerse(result.verse);
    setReaderNavCollapsed(true);
    setExpandedMobileReaderBook("");
    scrollReaderToTop();
  }

  function studyBibleSearchResult(result: BibleSearchResult) {
    const reference = `${result.book} ${result.chapter}:${result.verse}`;
    setPassage(reference);
    setPassageQuery(reference);
    setAnswers({});
    setShareNote("");
    setSmartFeedback(null);
    setShowAiOptions(false);
    setAcceptedCoaching({});
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
    setSmartFeedback(null);
    setShowAiOptions(false);
    setAcceptedCoaching({});
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
      return next;
    });
  }

  const showMobileReaderSelectionDock = phoneLayout && tab === "bible" && selectedReaderVerses.length > 0;
  const showMobileReaderNoteEditor = showMobileReaderSelectionDock && !!currentSelectionBookmark && activeBookmarkNoteId === currentSelectionBookmark.id;
  const activeContextHelp = getContextHelp(tab);
  const contextHelpBottom = showMobileReaderNoteEditor ? 300 : showMobileReaderSelectionDock ? 142 : 18;

  return (
    <View style={[styles.screen, compactLayout && styles.compactScreen]}>
      {phoneLayout && (
        <View style={styles.mobileMenuBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={mobileMenuOpen ? "Close menu" : "Open menu"}
            onPress={() => setMobileMenuOpen((value) => !value)}
            style={styles.mobileMenuButton}
          >
            <Ionicons name={mobileMenuOpen ? "close-outline" : "menu-outline"} size={23} color={colors.oliveDark} />
          </Pressable>
          <View style={styles.mobileMenuTitleBlock}>
            <Text style={styles.mobileMenuTitle}>Bible Study Tutor</Text>
            <Text style={styles.mobileMenuSubtitle}>{tab === "accountability" ? "Community" : tab === "admin" ? "Admin insights" : tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </View>
        </View>
      )}

      <View style={[styles.sidebar, compactLayout && styles.compactSidebar, phoneLayout && !mobileMenuOpen && styles.hiddenMobileSidebar, phoneLayout && mobileMenuOpen && styles.mobileMenuDrawer]}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>BT</Text>
          </View>
          <View style={styles.brandCopy}>
            <Text style={styles.brandTitle}>Bible Study Tutor</Text>
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
              style={[styles.tab, tab === key && styles.activeTab]}
            >
              <Ionicons name={icon as any} size={18} color={tab === key ? colors.oliveDark : colors.muted} />
              <Text style={[styles.tabLabel, tab === key && styles.activeTabLabel]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {!compactLayout && (
          <>
            <Card style={styles.todayCard}>
              <Eyebrow>Today</Eyebrow>
              <Text style={styles.streakNumber}>{stats?.currentStreak ?? 0}</Text>
              <Text style={styles.muted}>day rhythm</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.muted}>{effectivePartner ? `${friendlyName}, check in with ${effectivePartner} after study.` : `${friendlyName}, invite one person into the rhythm.`}</Text>
            </Card>

          </>
        )}
      </View>

      <ScrollView
        ref={appScrollRef}
        contentContainerStyle={[
          styles.content,
          phoneLayout && styles.phoneContent,
          showMobileReaderSelectionDock && styles.contentWithMobileReaderDock,
          showMobileReaderNoteEditor && styles.contentWithMobileReaderNoteDock
        ]}
      >
        {tab === "home" && (
          <View style={[styles.homeLayout, compactLayout && styles.stackedLayout]}>
            <Card style={[styles.homeMainCard, compactLayout && styles.fluidCard]}>
              <View style={styles.homeHero}>
                <Eyebrow>Purpose</Eyebrow>
                <Text style={[styles.homeHeroTitle, phoneLayout && styles.phoneHomeHeroTitle]}>
                  {firstName ? `${firstName}, draw near.` : "Draw near."}
                  {"\n"}
                  <Text style={styles.homeHeroTitleAccent}>Be shaped by Scripture.</Text>
                </Text>
                <Text style={styles.homeHeroText}>
                  Bible Study Tutor is here to help you come close to God, open the Scriptures, respond honestly, and carry the word into memory, prayer, and community.
                </Text>
                <View style={styles.homeActionRow}>
                  <AppButton label="Start a study" onPress={() => setTab("study")} style={phoneLayout && styles.homePhoneActionButton} />
                  <AppButton label="Read Scripture" variant="secondary" onPress={() => setTab("bible")} style={phoneLayout && styles.homePhoneActionButton} />
                </View>
              </View>

              <View style={styles.homeScriptureGrid}>
                <View style={styles.homeScriptureBlock}>
                  <View style={styles.homeScriptureIcon}>
                    <Ionicons name="heart-outline" size={20} color={colors.coral} />
                  </View>
                  <Text style={styles.homeScriptureRef}>James 4:8</Text>
                  <Text style={styles.homeScriptureQuote}>“Draw near to God, and he will draw near to you.”</Text>
                  <Text style={styles.homeScriptureNote}>The app starts with relationship, not tasks. Study becomes a way of coming near.</Text>
                </View>
                <View style={styles.homeScriptureBlock}>
                  <View style={styles.homeScriptureIcon}>
                    <Ionicons name="book-outline" size={20} color={colors.coral} />
                  </View>
                  <Text style={styles.homeScriptureRef}>2 Timothy 3:16</Text>
                  <Text style={styles.homeScriptureQuote}>“Every Scripture is God-breathed and profitable for teaching, for reproof, for correction, and for instruction in righteousness.”</Text>
                  <Text style={styles.homeScriptureNote}>The tools are here to help Scripture teach, correct, train, and form a steady life with God.</Text>
                </View>
              </View>

              <View style={styles.homePurposePanel}>
                <Text style={styles.homePurposeTitle}>Free Bible study for everyday discipleship.</Text>
                <Text style={styles.homePurposeText}>
                  Built for individuals, small groups, and churches, Bible Study Tutor is free to use on desktop and mobile, with printable worksheets for anyone who prefers pen and paper.
                </Text>
                <View style={styles.homePurposePillRow}>
                  <View style={styles.homePurposePill}>
                    <Ionicons name="gift-outline" size={15} color={colors.oliveDark} />
                    <Text style={styles.homePurposePillText}>Free to use</Text>
                  </View>
                  <View style={styles.homePurposePill}>
                    <Ionicons name="phone-portrait-outline" size={15} color={colors.oliveDark} />
                    <Text style={styles.homePurposePillText}>Mobile ready</Text>
                  </View>
                  <View style={styles.homePurposePill}>
                    <Ionicons name="desktop-outline" size={15} color={colors.oliveDark} />
                    <Text style={styles.homePurposePillText}>Desktop friendly</Text>
                  </View>
                  <View style={styles.homePurposePill}>
                    <Ionicons name="print-outline" size={15} color={colors.oliveDark} />
                    <Text style={styles.homePurposePillText}>Printable worksheets</Text>
                  </View>
                </View>
              </View>
            </Card>

            <View style={[styles.homeSideColumn, compactLayout && styles.fluidCard]}>
              <Card style={styles.homeSideCard}>
                <Text style={styles.homeSideTitle}>Today’s path</Text>
                <Text style={styles.titleSupport}>{`${friendlyName}, take the next small faithful step.`}</Text>
                <View style={styles.homePathList}>
                  {[
                    ["Read", "Open the Bible reader and choose a passage.", "reader-outline", "bible"],
                    ["Study", `Work through ${method.short} with notes and highlights.`, "book-outline", "study"],
                    ["Remember", dueMemoryCount > 0 ? `${dueMemoryCount} memory review${dueMemoryCount === 1 ? "" : "s"} due.` : "Save a verse worth carrying.", "sparkles-outline", "memory"],
                    ["Reflect", dueStudyReviewCount > 0 ? `${dueStudyReviewCount} study review${dueStudyReviewCount === 1 ? "" : "s"} ready.` : "Keep your journal connected to Scripture.", "journal-outline", "journal"],
                    ["Share", effectivePartner ? `Check in with ${effectivePartner}.` : "Bring one honest sentence to someone.", "people-outline", "accountability"]
                  ].map(([title, detail, icon, target]) => (
                    <Pressable key={title} onPress={() => setTab(target as Tab)} style={styles.homePathItem}>
                      <View style={styles.homePathIcon}>
                        <Ionicons name={icon as any} size={17} color={colors.oliveDark} />
                      </View>
                      <View style={styles.homePathTextBlock}>
                        <Text style={styles.homePathTitle}>{title}</Text>
                        <Text style={styles.homePathDetail}>{detail}</Text>
                      </View>
                      <Ionicons name="chevron-forward-outline" size={16} color={colors.muted} />
                    </Pressable>
                  ))}
                </View>
              </Card>

              <Card style={styles.homeSideCard}>
                <Text style={styles.homeSideTitle}>At a glance</Text>
                <View style={styles.homeMetricGrid}>
                  <Metric value={stats?.currentStreak ?? 0} label="day rhythm" compact={phoneLayout} />
                  <Metric value={dueMemoryCount} label="memory due" compact={phoneLayout} />
                  <Metric value={dueStudyReviewCount} label="study reviews" compact={phoneLayout} />
                </View>
                <View style={styles.homeSmallActions}>
                  <ResumeButton label="Choose method" icon="layers-outline" onPress={() => setTab("methods")} />
                  <ResumeButton label="Open plans" icon="calendar-outline" onPress={() => setTab("plans")} />
                </View>
              </Card>
            </View>
          </View>
        )}

        {tab === "study" && (
          <View style={[styles.layout, compactLayout && styles.stackedLayout, studyFocusMode && styles.focusLayout]}>
            <Card style={[styles.mainCard, compactLayout && styles.fluidCard, studyFocusMode && styles.focusMainCard]}>
              <View style={styles.focusModeRow}>
                <View style={styles.feedbackHeader}>
                  <Ionicons name="resize-outline" size={18} color={colors.coral} />
                  <Text style={styles.feedbackTitle}>Study focus</Text>
                </View>
                <Pressable onPress={() => {
                  const nextValue = !studyFocusMode;
                  setStudyFocusMode(nextValue);
                  saveStoredStudyFocusMode(nextValue).catch(() => undefined);
                }} style={[styles.togglePill, studyFocusMode && styles.activeTogglePill]}>
                  <Text style={[styles.toggleText, studyFocusMode && styles.activeToggleText]}>{studyFocusMode ? "Focus on" : "Normal"}</Text>
                </Pressable>
              </View>

              {!studyFocusMode && (
                <>
                  <View style={styles.studyIntro}>
                    <View style={styles.methodPill}>
                      <Text style={styles.methodPillText}>{method.short}</Text>
                    </View>
                    <View style={styles.studyIntroCopy}>
                      <Eyebrow>Selected method</Eyebrow>
                      <Text style={styles.title}>{firstName ? `${firstName}, your ${method.short} study` : `${method.short} Study`}</Text>
                      <Text style={styles.methodFullName}>{method.name}</Text>
                      <Text style={styles.titleSupport}>{`${method.description} Take your time and let the passage lead.`}</Text>
                    </View>
                  </View>

                  <View style={styles.inlineMethodRow}>
                    {methods.map((item) => (
                      <Pressable
                        key={item.id}
                        onPress={() => switchMethod(item.id)}
                        style={[styles.inlineMethodChip, method.id === item.id && styles.activeInlineMethodChip]}
                      >
                        <Text style={[styles.inlineMethodText, method.id === item.id && styles.activeInlineMethodText]}>{item.short}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.coachingToggleRow}>
                    <View style={styles.feedbackHeader}>
                      <Ionicons name="sparkles-outline" size={18} color={colors.coral} />
                      <Text style={styles.feedbackTitle}>Tutor coaching</Text>
                    </View>
                    <Pressable onPress={() => {
                      const nextValue = !showCoaching;
                      setShowCoaching(nextValue);
                      saveStoredTutorCoachingEnabled(nextValue).catch(() => undefined);
                    }} style={[styles.togglePill, showCoaching && styles.activeTogglePill]}>
                      <Text style={[styles.toggleText, showCoaching && styles.activeToggleText]}>{showCoaching ? "On" : "Off"}</Text>
                    </Pressable>
                  </View>

                  <View style={styles.smartPassageBox}>
                    <View style={styles.smartPassageHeader}>
                      <Ionicons name="search-outline" size={20} color={colors.coral} />
                      <TextInput
                        value={passageQuery}
                        onChangeText={setPassageQuery}
                        onSubmitEditing={() => applyPassageQuery()}
                        placeholder="Try “John 3:16-18” or “Psalm 23”"
                        style={styles.smartPassageInput}
                      />
                      <Pressable onPress={() => applyPassageQuery()} style={styles.useInlineButton}>
                        <Text style={styles.useInlineText}>Use</Text>
                      </Pressable>
                    </View>

                    <View style={styles.suggestionRow}>
                      {smartSuggestions.map((suggestion) => (
                        <Pressable key={suggestion} onPress={() => applyPassageQuery(suggestion)} style={styles.suggestionChip}>
                          <Text style={styles.suggestionText}>{suggestion}</Text>
                        </Pressable>
                      ))}
                    </View>

                    <View style={styles.presetSection}>
                      <Text style={styles.presetLabel}>Common starts</Text>
                      <View style={styles.suggestionRow}>
                        {passagePresets.map((preset) => (
                          <Pressable key={preset} onPress={() => applyPassageQuery(preset)} style={styles.presetChip}>
                            <Text style={styles.presetText}>{preset}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                </>
              )}

              <View style={[styles.scriptureBox, phoneLayout && styles.phoneScriptureBox, studyFocusMode && styles.focusScriptureBox]}>
                <View style={styles.scriptureHeader}>
                  <View>
                    <Eyebrow>Passage text</Eyebrow>
                    <Text style={styles.scriptureReference}>{passageText?.reference || passage}</Text>
                  </View>
                  <View style={styles.translationControls}>
                    {BIBLE_TRANSLATIONS.map((translation) => (
                      <Pressable
                        key={translation.id}
                        onPress={() => {
                          setBibleTranslation(translation.id);
                          saveStoredBibleTranslation(translation.id).catch(() => undefined);
                        }}
                        style={[styles.translationOption, bibleTranslation === translation.id && styles.activeTranslationOption]}
                      >
                        <Text style={[styles.translationOptionText, bibleTranslation === translation.id && styles.activeTranslationOptionText]}>
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
                        <Text style={styles.markupHelp}>Tap one or more verses, then choose a highlight label.</Text>
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
                                    markupOption && { backgroundColor: markupOption.background, borderColor: markupOption.background },
                                    selected && styles.selectedVerseRow
                                  ]}
                                >
                                  <Text style={[styles.verseNumber, phoneLayout && styles.phoneVerseNumber, markupOption && { color: markupOption.color }]}>{verse.verse}</Text>
                                  <View style={styles.verseTextBlock}>
                                    <Text style={[styles.verseText, phoneLayout && styles.phoneVerseText, markupOption && { color: markupOption.color }]}>{verse.text.trim()}</Text>
                                  </View>
                                  {savedToMemory && (
                                    <View style={styles.memoryVerseBadge}>
                                      <Ionicons name="sparkles-outline" size={12} color={colors.coral} />
                                      <Text style={styles.memoryVerseBadgeText}>Memory</Text>
                                    </View>
                                  )}
                                </Pressable>
                                {selectedVerses.length > 0 && key === activeStudyMarkupVerseKey && (
                                  <View style={[styles.inlineReaderActionBar, styles.inlineStudyMarkupBar, phoneLayout && styles.phoneInlineStudyMarkupBar]}>
                                    <Text style={styles.readerSelectionText}>
                                      {selectedVerses.length === 1 ? `Verse ${selectedVerses[0].verse} selected` : `${selectedVerses.length} verses selected`}
                                    </Text>
                                    <View style={styles.markupOptionsRow}>
                                      {PASSAGE_MARKUP_OPTIONS.map((option) => (
                                        <Pressable
                                          key={option.id}
                                          onPress={() => applyVerseMarkup(option.id)}
                                          style={[
                                            styles.markupOption,
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
                                        <Pressable onPress={clearVerseMarkup} style={styles.inlineReaderBookmarkButton}>
                                          <Ionicons name="remove-circle-outline" size={14} color={colors.oliveDark} />
                                          <Text style={styles.inlineReaderBookmarkText}>Clear markup</Text>
                                        </Pressable>
                                      )}
                                      <Pressable onPress={saveSelectedVersesToMemory} style={[styles.inlineReaderBookmarkButton, styles.memoryReaderButton, selectedVersesAlreadyInMemory && styles.savedMemoryButton]}>
                                        <Ionicons name="sparkles-outline" size={14} color="white" />
                                        <Text style={styles.memoryReaderButtonText}>{selectedVersesAlreadyInMemory ? "In Memory" : "Memory"}</Text>
                                      </Pressable>
                                      <Pressable onPress={openStudyWorksheetOptions} style={styles.inlineReaderBookmarkButton}>
                                        <Ionicons name="print-outline" size={14} color={colors.oliveDark} />
                                        <Text style={styles.inlineReaderBookmarkText}>Print</Text>
                                      </Pressable>
                                      <Pressable onPress={() => setSelectedVerseKeys([])} style={styles.inlineReaderBookmarkButton}>
                                        <Ionicons name="close-outline" size={14} color={colors.oliveDark} />
                                        <Text style={styles.inlineReaderBookmarkText}>Clear</Text>
                                      </Pressable>
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
                              </View>
                            );
                          })}
                        </View>
                        {selectedVerses.length === 0 && highlightedVerseCount > 0 && (
                          <View style={[styles.markupToolbar, phoneLayout && styles.phoneMarkupToolbar]}>
                            <View style={styles.markupToolbarHeader}>
                              <Text style={styles.markupToolbarTitle}>
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
                            {selectedVerses.length === 0 && <Text style={styles.markupToolbarHelp}>Select one or more verses to add or change highlights.</Text>}
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
                      <Text style={styles.scriptureText}>{passageText.text.trim()}</Text>
                    )}
                    <Text style={styles.translationNote}>
                      {passageText.translation_name} · {passageText.translation_note || "Public Domain"}
                    </Text>
                    {passageText.verses?.length ? (
                      <View style={styles.studyPrintRow}>
                        <ResumeButton
                          label={selectedVerses.length ? "Print selected worksheet" : "Print worksheet"}
                          icon="print-outline"
                          onPress={openStudyWorksheetOptions}
                          style={phoneLayout && styles.phoneStudyPrintButton}
                          labelStyle={phoneLayout && styles.phoneStudyPrintButtonText}
                        />
                      </View>
                    ) : null}
                    {phoneLayout && passageText.verses?.length ? (
                      <View style={styles.mobilePrintHint}>
                        <Ionicons name="phone-portrait-outline" size={15} color={colors.coral} />
                        <Text style={styles.mobilePrintHintText}>On phone, open the worksheet, then use Share to Print or Save to Files.</Text>
                      </View>
                    ) : null}
                  </>
                ) : (
                  <View style={styles.passageStatusBox}>
                    <Text style={styles.muted}>{passageStatus}</Text>
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
                <View style={styles.savedSummaryBox}>
                  <View style={styles.savedSummaryIcon}>
                    <Ionicons name="checkmark-circle-outline" size={30} color={colors.coral} />
                  </View>
                  <Eyebrow>Study saved</Eyebrow>
                  <Text style={styles.stepTitle}>{firstName ? `Well done, ${firstName}.` : "Well done."}</Text>
                  <Text style={styles.reviewMeta}>{savedStudySummary.passage}</Text>
                  <Text style={styles.reviewMeta}>{savedStudySummary.methodName}</Text>
                  <View style={[styles.savedSummaryGrid, phoneLayout && styles.phoneSavedSummaryGrid]}>
                    <Metric value={1} label="study saved" compact={phoneLayout} />
                    <Metric value={savedStudySummary.highlightCount} label="highlights" compact={phoneLayout} />
                  </View>
                  {!!savedStudySummary.completedPlanDay && (
                    <View style={styles.savedSummaryPanel}>
                      <Text style={styles.lastCheckinLabel}>Plan progress</Text>
                      <Text style={styles.body}>{savedStudySummary.completedPlanDay} marked complete.</Text>
                    </View>
                  )}
                  <View style={styles.savedSummaryPanel}>
                    <Text style={styles.lastCheckinLabel}>Shareable insight</Text>
                    <Text style={styles.body}>{savedStudySummary.shareNote || "Study saved without a share note."}</Text>
                    {!!savedStudySummary.shareNote && (
                      <View style={styles.shareInsightActions}>
                        <ResumeButton label="Share insight" icon="share-outline" onPress={() => shareStudyInsight(savedStudySummary.shareNote)} />
                      </View>
                    )}
                  </View>
                  <View style={styles.savedSummaryPanel}>
                    <Text style={styles.lastCheckinLabel}>Review later</Text>
                    <Text style={styles.body}>
                      {savedStudySummary.reviewAt
                        ? `This study is set for review on ${formatReviewDate(savedStudySummary.reviewAt)}.`
                        : "Choose when you want this study to come back into your Journal."}
                    </Text>
                    <View style={[styles.reviewPresetRow, phoneLayout && styles.phoneReviewPresetRow]}>
                      {STUDY_REVIEW_OPTIONS.map((option) => (
                        <Pressable
                          key={option.id}
                          onPress={() => scheduleStudyReview(savedStudySummary.sessionId, option.id)}
                          style={[styles.filterChip, phoneLayout && styles.phoneJournalFilterChip]}
                        >
                          <Text style={[styles.filterText, phoneLayout && styles.phoneJournalFilterText]}>{option.label}</Text>
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
                    <AppButton label="Check-in" variant="secondary" onPress={() => setTab("accountability")} style={phoneLayout && styles.phoneSavedSummaryActionButton} labelStyle={phoneLayout && styles.phoneSavedSummaryActionLabel} />
                    <AppButton label="New study" variant="secondary" onPress={resetCurrentStudy} style={phoneLayout && styles.phoneSavedSummaryActionButton} labelStyle={phoneLayout && styles.phoneSavedSummaryActionLabel} />
                  </View>
                </View>
              ) : studyPhase === "review" ? (
                <View style={styles.reviewBox}>
                  <Eyebrow>Review before saving</Eyebrow>
                  <Text style={styles.stepTitle}>{passageText?.reference || passage}</Text>
                  <Text style={styles.reviewMeta}>{method.name}</Text>
                  <View style={styles.reviewAnswers}>
                    {sessionAnswers
                      .filter((item) => item.answer.trim())
                      .map((item) => (
                        <View key={item.stepTitle} style={styles.reviewAnswer}>
                          <Text style={styles.reviewStepTitle}>{item.stepTitle}</Text>
                          <FormattedNoteText text={item.answer} />
                        </View>
                      ))}
                  </View>
                  <View style={styles.shareInsightBox}>
                    <View style={styles.feedbackHeader}>
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.coral} />
                      <Text style={styles.feedbackTitle}>Shareable insight</Text>
                    </View>
                    <TextInput
                      multiline
                      value={shareNote}
                      onChangeText={setShareNote}
                      placeholder={suggestedShareNote || "Today I noticed..."}
                      style={[styles.input, styles.shareInput]}
                    />
                    <View style={styles.shareInsightActions}>
                      <ResumeButton label="Share insight" icon="share-outline" onPress={() => shareStudyInsight()} />
                    </View>
                    {!!shareInsightStatus && <Text style={styles.saveStatus}>{shareInsightStatus}</Text>}
                  </View>
                  <View style={styles.buttonRow}>
                    <AppButton label="Back to edit" variant="secondary" onPress={() => setStudyPhase("study")} />
                    <AppButton label="Save study" onPress={completeSession} />
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.stepHeader} onLayout={(event) => setStudyStepAnchorY(event.nativeEvent.layout.y)}>
                    <View>
                      <Eyebrow>{`Step ${stepIndex + 1} of ${method.steps.length}`}</Eyebrow>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.titleSupport}>{`Stay with the text, ${friendlyName}. One honest response is enough.`}</Text>
                    </View>
                    <Text style={styles.badge}>{method.short}</Text>
                  </View>
                  <View style={[styles.instructionBox, instructionsCollapsed && styles.collapsedInstructionBox]}>
                    <View style={styles.instructionHeader}>
                      <View style={styles.instructionHeaderCopy}>
                        <Eyebrow>Do this now</Eyebrow>
                        <Text style={[styles.actionText, instructionsCollapsed && styles.collapsedActionText]}>{step.action}</Text>
                      </View>
                      <Pressable onPress={() => setInstructionsCollapsed((value) => !value)} style={styles.collapseButton}>
                        <Ionicons name={instructionsCollapsed ? "chevron-down-outline" : "chevron-up-outline"} size={16} color={colors.oliveDark} />
                        <Text style={styles.collapseButtonText}>{instructionsCollapsed ? "Show" : "Hide"}</Text>
                      </Pressable>
                    </View>
                    {!instructionsCollapsed && (
                      <>
                        <Text style={styles.body}>{step.prompt}</Text>
                        <View style={styles.checklist}>
                          {step.checklist.map((item) => (
                            <View key={item} style={styles.checkItem}>
                              <Ionicons name="checkmark-circle-outline" size={18} color={colors.olive} />
                              <Text style={styles.checkText}>{item}</Text>
                            </View>
                          ))}
                        </View>
                        {step.responseType === "text" && (
                          <View style={styles.outputBox}>
                            <Text style={styles.outputLabel}>What to write</Text>
                            <Text style={styles.outputText}>{step.output}</Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                  {step.responseType === "none" ? (
                    <View style={styles.readyBox}>
                      <Ionicons name="book-outline" size={22} color={colors.coral} />
                      <View style={styles.readyCopy}>
                        <Text style={styles.readyTitle}>No response needed for this step.</Text>
                        <Text style={styles.readyText}>Take your time with the passage. When you have completed the checklist, move to the next guided step.</Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      <StudyNoteEditor
                        value={answers[answerKey] || ""}
                        onChange={(value) => {
                          setAnswers({ ...answers, [answerKey]: value });
                          setDetectedScriptureReference(findTypedScriptureReference(value));
                          setScriptureInsertStatus("");
                        }}
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
                        scriptureInsertStatus={scriptureInsertStatus}
                        scriptureInsertFocusKey={scriptureInsertFocusKey}
                        onInsertScripture={insertDetectedScripture}
                      />
                      {answeredSteps.length > 0 && (
                        <View style={styles.savedStepBox}>
                          <Text style={styles.savedStepTitle}>Saved responses</Text>
                          <View style={styles.savedStepRow}>
                            {answeredSteps.map((item) => (
                              <Pressable
                                key={item.index}
                                onPress={() => goToStudyStep(item.index)}
                                style={[styles.savedStepChip, stepIndex === item.index && styles.activeSavedStepChip]}
                              >
                                <Text style={[styles.savedStepChipText, stepIndex === item.index && styles.activeSavedStepChipText]}>
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
                      {!showCoaching && (
                        <Pressable
                          onPress={() => {
                            setShowCoaching(true);
                            saveStoredTutorCoachingEnabled(true).catch(() => undefined);
                          }}
                          style={styles.collapsedCoachingBox}
                        >
                          <View style={styles.feedbackHeader}>
                            <Ionicons name="sparkles-outline" size={17} color={colors.coral} />
                            <Text style={styles.feedbackTitle}>Tutor coaching is off</Text>
                          </View>
                          <Text style={styles.collapsedCoachingText}>Tap to show gentle writing feedback for this step.</Text>
                        </Pressable>
                      )}
                      {showCoaching && currentCoaching.length > 0 && (
                        <View style={styles.coachingBox}>
                          <View style={styles.feedbackHeader}>
                            <Ionicons name="bulb-outline" size={18} color={colors.coral} />
                            <Text style={styles.feedbackTitle}>Coaching feedback</Text>
                          </View>
                          {currentCoaching.map((item) => (
                            <View key={item} style={styles.coachingItem}>
                              <Ionicons name="ellipse" size={7} color={colors.olive} />
                              <Text style={styles.coachingText}>{item}</Text>
                            </View>
                          ))}
                          <Pressable onPress={requestDeeperFeedback} style={styles.deeperFeedbackButton}>
                            <Ionicons name="sparkles-outline" size={16} color={colors.oliveDark} />
                            <Text style={styles.deeperFeedbackText}>AI feedback options</Text>
                          </Pressable>
                          {showAiOptions && smartFeedbackKey === answerKey && (
                            <View style={styles.aiOptionsBox}>
                              <Text style={styles.aiOptionsTitle}>Choose your feedback option</Text>
                              <Text style={styles.aiOptionsText}>
                                Deeper AI feedback may create usage costs. Choose the option that works for you.
                              </Text>
                              <Pressable onPress={() => chooseAiAccess("free", true)} style={styles.aiOptionCard}>
                                <Ionicons name="leaf-outline" size={20} color={colors.oliveDark} />
                                <View style={styles.aiOptionCopy}>
                                  <Text style={styles.aiOptionTitle}>Continue free</Text>
                                  <Text style={styles.aiOptionText}>Use built-in coaching. No account, payment, or AI cost.</Text>
                                </View>
                              </Pressable>
                              <Pressable onPress={() => chooseAiAccess("own-key", true)} style={styles.aiOptionCard}>
                                <Ionicons name="key-outline" size={20} color={colors.oliveDark} />
                                <View style={styles.aiOptionCopy}>
                                  <Text style={styles.aiOptionTitle}>Use my own AI key</Text>
                                  <Text style={styles.aiOptionText}>Coming soon. You would pay the AI provider directly.</Text>
                                </View>
                              </Pressable>
                              <Pressable onPress={() => chooseAiAccess("premium", true)} style={styles.aiOptionCard}>
                                <Ionicons name="card-outline" size={20} color={colors.oliveDark} />
                                <View style={styles.aiOptionCopy}>
                                  <Text style={styles.aiOptionTitle}>Premium subscription</Text>
                                  <Text style={styles.aiOptionText}>Coming soon. Subscription access with clear usage limits.</Text>
                                </View>
                              </Pressable>
                            </View>
                          )}
                          {!!smartFeedbackStatus && smartFeedbackStatus !== "Asking the tutor..." && (
                            <Text style={styles.saveStatus}>{smartFeedbackStatus}</Text>
                          )}
                          {smartFeedback && smartFeedbackKey === answerKey && (
                            <View style={styles.smartFeedbackBox}>
                              <View style={styles.smartFeedbackHeader}>
                                <Text style={styles.reviewStepTitle}>
                                  {smartFeedback.source === "openai" ? "Smart tutor" : "Local tutor"}
                                </Text>
                                {currentAcceptedCoaching && <Text style={styles.acceptedPill}>Accepted</Text>}
                              </View>
                              <Text style={styles.body}>
                                <Text style={styles.bold}>Encouragement: </Text>
                                {smartFeedback.encouragement}
                              </Text>
                              <Text style={styles.body}>
                                <Text style={styles.bold}>Text grounding: </Text>
                                {smartFeedback.textGrounding}
                              </Text>
                              <Text style={styles.body}>
                                <Text style={styles.bold}>Next revision: </Text>
                                {smartFeedback.nextRevision}
                              </Text>
                              <ResumeButton label="Save this coaching" icon="checkmark-circle-outline" onPress={acceptSmartFeedback} />
                            </View>
                          )}
                        </View>
                      )}
                      {stepIndex === method.steps.length - 1 && (
                        <View style={styles.shareInsightBox}>
                          <View style={styles.feedbackHeader}>
                            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.coral} />
                            <Text style={styles.feedbackTitle}>Shareable insight</Text>
                          </View>
                          <Text style={styles.helpIntro}>End with one honest note you could bring to a partner or group.</Text>
                          <TextInput
                            multiline
                            value={shareNote}
                            onChangeText={setShareNote}
                            placeholder={suggestedShareNote || "Today I noticed..."}
                            style={[styles.input, styles.shareInput]}
                          />
                          <View style={styles.shareInsightActions}>
                            <ResumeButton label="Share insight" icon="share-outline" onPress={() => shareStudyInsight()} />
                          </View>
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
                        style={phoneLayout && styles.studyStepBackButton}
                        labelStyle={phoneLayout && styles.studyStepButtonLabel}
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
                      style={phoneLayout && styles.studyStepFreshButton}
                      labelStyle={phoneLayout && styles.studyStepButtonLabel}
                    />
                  </View>
                </>
              )}
            </Card>

            {!studyFocusMode && (
            <Card style={[styles.memoryCoachCard, compactLayout && styles.fluidCard]}>
              <CollapsibleStudyPanel
                title="Community cue"
                icon="people-outline"
                collapsed={collapsedStudyPanels.community}
                onToggle={() => toggleStudyPanel("community")}
                style={styles.communityBox}
              >
                <Text style={styles.communityTitle}>{effectivePartner ? `Bring ${effectivePartner} one sentence.` : "Bring one person into this rhythm."}</Text>
                <Text style={styles.helpIntro}>{suggestedShareNote || "Your final answer becomes a small share note when you complete the study."}</Text>
                <AppButton label="Open community" variant="secondary" onPress={() => setTab("accountability")} />
              </CollapsibleStudyPanel>
              <CollapsibleStudyPanel
                title="Current plan"
                icon="calendar-outline"
                collapsed={collapsedStudyPanels.plan}
                onToggle={() => toggleStudyPanel("plan")}
                style={styles.studyPlansBox}
              >
                <Text style={styles.communityTitle}>{selectedPlan.title}</Text>
                <Text style={styles.helpIntro}>{selectedPlanComplete ? "Plan complete. Start another path when you are ready." : `Next: Day ${selectedPlanNextDay.day} · ${selectedPlanNextDay.passage}`}</Text>
                <Text style={styles.planProgressText}>{selectedPlanCompletedCount} of {selectedPlan.days.length} complete</Text>
                <View style={styles.planActionRow}>
                  <ResumeButton label={selectedPlanComplete ? "Open plans" : "Continue"} icon={selectedPlanComplete ? "calendar-outline" : "play-outline"} onPress={() => selectedPlanComplete ? setTab("plans") : startPlanDay(selectedPlanNextDay)} />
                  <ResumeButton label="All plans" icon="list-outline" onPress={() => setTab("plans")} />
                </View>
              </CollapsibleStudyPanel>
              <CollapsibleStudyPanel
                title="Feedback"
                icon="sparkles-outline"
                collapsed={collapsedStudyPanels.feedback}
                onToggle={() => toggleStudyPanel("feedback")}
                style={styles.feedbackOptionsBox}
              >
                <Text style={styles.helpIntro}>Current: {aiAccessChoice === "free" ? "Free local coaching" : aiAccessChoice === "own-key" ? "Own AI key" : "Premium"}</Text>
                <ResumeButton label="Manage access" icon="settings-outline" onPress={() => setTab("account")} />
              </CollapsibleStudyPanel>
              <CollapsibleStudyPanel
                title="Study helps"
                icon="library-outline"
                collapsed={collapsedStudyPanels.helps}
                onToggle={() => toggleStudyPanel("helps")}
                style={styles.studyHelpsBox}
              >
                <Text style={styles.helpIntro}>Use these after you have written your own observations.</Text>
                {studyHelps.map((help) => (
                  <Pressable key={help.title} onPress={() => Linking.openURL(help.url)} style={styles.helpLink}>
                    <View style={styles.helpIcon}>
                      <Ionicons name={help.icon as any} size={17} color={colors.oliveDark} />
                    </View>
                    <View style={styles.helpTextBlock}>
                      <Text style={styles.helpTitle}>{help.title}</Text>
                      <Text style={styles.helpDescription}>{help.description}</Text>
                    </View>
                    <Ionicons name="open-outline" size={16} color={colors.muted} />
                  </Pressable>
                ))}
              </CollapsibleStudyPanel>
            </Card>
            )}
          </View>
        )}

        {tab === "bible" && (
          <View style={[styles.bibleReaderLayout, compactLayout && styles.stackedLayout]}>
            <Card
              style={[
                styles.bibleReaderNavCard,
                readerNavCollapsed && styles.collapsedBibleReaderNavCard,
                compactLayout && styles.fluidCard,
                compactLayout && readerNavCollapsed && styles.compactCollapsedBibleReaderNavCard
              ]}
            >
              <Pressable
                onPress={() => setReaderNavCollapsed((value) => !value)}
                style={[styles.readerNavHeader, compactLayout && readerNavCollapsed && styles.compactCollapsedReaderNavHeader]}
              >
                {readerNavCollapsed ? (
                  <View style={[styles.collapsedReaderIconStack, compactLayout && styles.compactCollapsedReaderIconStack]}>
                    <View style={styles.collapsedReaderIconButton}>
                      <Ionicons name="book-outline" size={19} color={colors.oliveDark} />
                    </View>
                    <View style={[styles.collapsedReaderIconButton, !bibleBookmarks.length && styles.inactiveCollapsedReaderIconButton]}>
                      <Ionicons name={bibleBookmarks.length ? "bookmark" : "bookmark-outline"} size={18} color={bibleBookmarks.length ? colors.coral : colors.muted} />
                    </View>
                    <View style={[styles.collapsedReaderIconButton, !readBibleChapterCount && styles.inactiveCollapsedReaderIconButton]}>
                      <Ionicons name={readBibleChapterCount ? "checkmark-circle" : "checkmark-circle-outline"} size={18} color={readBibleChapterCount ? colors.oliveDark : colors.muted} />
                    </View>
                    <View style={styles.collapsedReaderIconButton}>
                      <Ionicons name="chevron-forward-outline" size={18} color={colors.muted} />
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={styles.readerNavTitleBlock}>
                      <Eyebrow>Read Scripture</Eyebrow>
                      <Text style={styles.title}>Bible reader</Text>
                    </View>
                    <Ionicons name="chevron-back-outline" size={18} color={colors.muted} />
                  </>
                )}
              </Pressable>
              {!readerNavCollapsed && (
                <>
                  <Text style={styles.titleSupport}>Navigate by book and chapter, then send any chapter into Study when you want to slow down.</Text>
                  <View style={styles.translationRow}>
                    {BIBLE_TRANSLATIONS.map((translation) => (
                      <Pressable
                        key={translation.id}
                        onPress={() => {
                          setBibleTranslation(translation.id);
                          saveStoredBibleTranslation(translation.id).catch(() => undefined);
                        }}
                        style={[styles.translationOption, bibleTranslation === translation.id && styles.activeTranslationOption]}
                      >
                        <Text style={[styles.translationOptionText, bibleTranslation === translation.id && styles.activeTranslationOptionText]}>
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
                      style={styles.input}
                    />
                  )}
                  {bibleReaderHistory.length > 1 && (
                    <View style={styles.readerHistorySection}>
                      <Pressable onPress={() => setReaderHistoryCollapsed((value) => !value)} style={styles.readerBookmarkHeader}>
                        <View style={styles.readerBookmarkHeaderTitle}>
                          <Ionicons name="time-outline" size={15} color={colors.coral} />
                          <Text style={styles.readerBookSectionTitle}>Recent</Text>
                        </View>
                        <View style={styles.readerBookmarkHeaderMeta}>
                          <Text style={styles.readerBookmarkCount}>{bibleReaderHistory.length - 1}</Text>
                          <Ionicons name={readerHistoryCollapsed ? "chevron-down-outline" : "chevron-up-outline"} size={15} color={colors.muted} />
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
                                style={styles.readerHistoryChip}
                              >
                                <Ionicons name="reader-outline" size={13} color={colors.oliveDark} />
                                <Text numberOfLines={1} style={styles.readerHistoryText}>{item.reference}</Text>
                                <Text style={styles.readerHistoryTranslation}>{item.translation.toUpperCase()}</Text>
                              </Pressable>
                            ))}
                          </View>
                        </>
                      )}
                    </View>
                  )}
                  {bibleBookmarks.length > 0 && (
                    <View style={styles.readerBookmarkSection}>
                      <Pressable
                        onPress={() => {
                          setBookmarksCollapsed((value) => {
                            if (!value) setBookmarksExpanded(false);
                            return !value;
                          });
                        }}
                        style={styles.readerBookmarkHeader}
                      >
                        <View style={styles.readerBookmarkHeaderTitle}>
                          <Ionicons name="bookmark-outline" size={15} color={colors.coral} />
                          <Text style={styles.readerBookSectionTitle}>Bookmarks & notes</Text>
                        </View>
                        <View style={styles.readerBookmarkHeaderMeta}>
                          <Text style={styles.readerBookmarkCount}>{bibleBookmarks.length}</Text>
                          <Ionicons name={bookmarksCollapsed ? "chevron-down-outline" : "chevron-up-outline"} size={15} color={colors.muted} />
                        </View>
                      </Pressable>
                      {!bookmarksCollapsed && (
                        <>
                          <TextInput
                            value={bookmarkSearch}
                            onChangeText={setBookmarkSearch}
                            placeholder="Search bookmarks or notes"
                            style={[styles.input, styles.readerBookmarkSearchInput]}
                          />
                          <Pressable
                            onPress={() => setBookmarkNotesOnly((value) => !value)}
                            style={[styles.readerBookmarkFilterChip, bookmarkNotesOnly && styles.activeReaderBookChip]}
                          >
                            <Ionicons name={bookmarkNotesOnly ? "document-text" : "document-text-outline"} size={14} color={bookmarkNotesOnly ? "white" : colors.oliveDark} />
                            <Text style={[styles.readerBookmarkFilterText, bookmarkNotesOnly && styles.activeReaderBookText]}>With notes</Text>
                          </Pressable>
                          {visibleBibleBookmarks.map((bookmark) => (
                            <View key={bookmark.id} style={styles.readerBookmarkItem}>
                              <View style={styles.readerBookmarkRow}>
                                <Pressable onPress={() => openBibleBookmark(bookmark)} style={styles.readerBookmarkOpen}>
                                  <Ionicons name={bookmark.bookmarked === false ? "document-text-outline" : "bookmark-outline"} size={14} color={bookmark.bookmarked === false ? colors.oliveDark : colors.coral} />
                                  <Text style={styles.readerBookmarkText}>{bookmark.reference}</Text>
                                </Pressable>
                                <Pressable onPress={() => openBookmarkNote(bookmark)} style={[styles.readerBookmarkIconButton, bookmark.note?.trim() && styles.activeBookmarkNoteButton]}>
                                  <Ionicons name={bookmark.note?.trim() ? "document-text" : "document-text-outline"} size={15} color={bookmark.note?.trim() ? "white" : colors.oliveDark} />
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
                                    style={[styles.input, styles.readerBookmarkNoteInput, phoneLayout && styles.mobileReaderBookmarkNoteInput]}
                                  />
                                  <View style={styles.readerBookmarkNoteActions}>
                                    <Pressable onPress={() => saveBookmarkNote(bookmark.id)} style={styles.inlineReaderBookmarkButton}>
                                      <Text style={styles.inlineReaderBookmarkText}>Save note</Text>
                                    </Pressable>
                                    {!!bookmark.note?.trim() && (
                                      <Pressable onPress={() => deleteBookmarkNote(bookmark.id)} style={styles.clearMarkupButton}>
                                        <Text style={styles.clearMarkupText}>Delete note</Text>
                                      </Pressable>
                                    )}
                                    <Pressable
                                      onPress={() => {
                                        setActiveBookmarkNoteId("");
                                        setBookmarkNoteDraft("");
                                        dismissMobileInputFocus();
                                      }}
                                      style={styles.clearMarkupButton}
                                    >
                                      <Text style={styles.clearMarkupText}>Cancel</Text>
                                    </Pressable>
                                  </View>
                                </View>
                              )}
                            </View>
                          ))}
                          {filteredBibleBookmarks.length > 3 && (
                            <Pressable onPress={() => setBookmarksExpanded((value) => !value)} style={styles.readerBookmarkExpandButton}>
                              <Text style={styles.readerBookmarkExpandText}>
                                {bookmarksExpanded ? "Show latest 3" : `Show all ${filteredBibleBookmarks.length}`}
                              </Text>
                              <Ionicons name={bookmarksExpanded ? "chevron-up-outline" : "chevron-down-outline"} size={14} color={colors.oliveDark} />
                            </Pressable>
                          )}
                          {!visibleBibleBookmarks.length && <Text style={styles.muted}>No matching bookmarks.</Text>}
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
                            style={styles.mobileReaderDropdownButton}
                          >
                            <Text style={styles.mobileReaderDropdownText}>{section.title}</Text>
                            <Ionicons name={readerMobileMenu === section.id ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={colors.muted} />
                          </Pressable>
                          {readerMobileMenu === section.id && (
                            <>
                              <View style={styles.mobileReaderBookList}>
                                {section.books.map((book) => (
                                  <View key={book} style={[styles.mobileReaderBookBlock, expandedMobileReaderBook === book && styles.expandedMobileReaderBookBlock]}>
                                    <Pressable
                                      onPress={() => selectMobileReaderBook(book)}
                                      style={[styles.mobileReaderBookOption, readerBook === book && styles.activeMobileReaderBookOption]}
                                    >
                                      <Text style={[styles.mobileReaderBookText, readerBook === book && styles.activeMobileReaderBookText]}>{book}</Text>
                                    </Pressable>
                                    {expandedMobileReaderBook === book && (
                                      <View style={styles.mobileReaderChapterPanel}>
                                        <Text style={styles.readerBookSectionTitle}>{book}</Text>
                                        <View style={styles.mobileReaderChapterGrid}>
                                          {Array.from({ length: BIBLE_CHAPTER_COUNTS[book] || 1 }, (_, index) => index + 1).map((chapter) => (
                                            <Pressable
                                              key={chapter}
                                              onPress={() => selectReaderChapter(chapter, book)}
                                              style={[styles.mobileReaderChapterSquare, readerBook === book && readerChapter === chapter && styles.activeMobileReaderChapterSquare]}
                                            >
                                              <Text style={[styles.mobileReaderChapterText, readerBook === book && readerChapter === chapter && styles.activeMobileReaderChapterText]}>{chapter}</Text>
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
                          <Text style={styles.readerBookSectionTitle}>{section.title}</Text>
                          <View style={styles.desktopReaderBookList}>
                            {section.books.map((book) => (
                              <View key={book} style={[styles.desktopReaderBookBlock, expandedMobileReaderBook === book && styles.expandedDesktopReaderBookBlock]}>
                                <Pressable
                                  onPress={() => selectReaderBook(book)}
                                  style={[styles.readerBookChip, readerBook === book && styles.activeReaderBookChip]}
                                >
                                  <Text style={[styles.readerBookText, readerBook === book && styles.activeReaderBookText]}>{book}</Text>
                                </Pressable>
                                {expandedMobileReaderBook === book && (
                                  <View style={styles.desktopReaderChapterPanel}>
                                    <View style={styles.desktopReaderChapterHeader}>
                                      <Text style={styles.readerBookSectionTitle}>{book}</Text>
                                      <Text style={styles.readerChapterCountText}>{BIBLE_CHAPTER_COUNTS[book] || 1} chapters</Text>
                                    </View>
                                    <View style={styles.desktopReaderChapterGrid}>
                                      {Array.from({ length: BIBLE_CHAPTER_COUNTS[book] || 1 }, (_, index) => index + 1).map((chapter) => (
                                        <Pressable
                                          key={chapter}
                                          onPress={() => selectReaderChapter(chapter, book)}
                                          style={[styles.mobileReaderChapterSquare, readerBook === book && readerChapter === chapter && styles.activeMobileReaderChapterSquare]}
                                        >
                                          <Text style={[styles.mobileReaderChapterText, readerBook === book && readerChapter === chapter && styles.activeMobileReaderChapterText]}>{chapter}</Text>
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
                      {!readerBookSections.length && <Text style={styles.muted}>No matching books found.</Text>}
                    </View>
                  )}
                </>
              )}
            </Card>

            <Card style={[styles.bibleReaderContentCard, compactLayout && styles.fluidCard]}>
              <View style={styles.bibleSearchPanel}>
                <Pressable onPress={() => setBibleSearchCollapsed((value) => !value)} style={styles.bibleSearchHeader}>
                  <View style={styles.feedbackHeader}>
                    <Ionicons name="search-outline" size={18} color={colors.coral} />
                    <Text style={styles.feedbackTitle}>Search Scripture</Text>
                  </View>
                  <View style={styles.bibleSearchHeaderMeta}>
                    <Text style={styles.bibleSearchTranslationText}>{bibleSearchTranslation}</Text>
                    <Ionicons name={bibleSearchCollapsed ? "chevron-down-outline" : "chevron-up-outline"} size={16} color={colors.muted} />
                  </View>
                </Pressable>
                {!bibleSearchCollapsed && (
                  <>
                    <Text style={styles.helpIntro}>Search exact words, close wording, themes, ideas, or questions. Results split by testament unless you choose one.</Text>
                    <View style={[styles.bibleSearchInputRow, phoneLayout && styles.phoneBibleSearchInputRow]}>
                      <TextInput
                        value={bibleSearchQuery}
                        onChangeText={setBibleSearchQuery}
                        onSubmitEditing={runBibleSearch}
                        placeholder="Try “draw near”, “anxiety”, or “what does Scripture teach?”"
                        style={[styles.input, styles.bibleSearchInput, phoneLayout && styles.phoneBibleSearchInput]}
                      />
                      <AppButton label="Search" onPress={runBibleSearch} style={phoneLayout && styles.phoneBibleSearchButton} />
                    </View>
                    <View style={[styles.bibleSearchControls, phoneLayout && styles.phoneBibleSearchControls]}>
                      {[
                        ["all", "All"],
                        ["old", "Old Testament"],
                        ["new", "New Testament"]
                      ].map(([scope, label]) => (
                        <Pressable
                          key={scope}
                          onPress={() => setBibleSearchScope(scope as BibleSearchScope)}
                          style={[styles.bibleSearchChip, phoneLayout && styles.phoneBibleSearchChip, bibleSearchScope === scope && styles.activeBibleSearchChip]}
                        >
                          <Text style={[styles.bibleSearchChipText, bibleSearchScope === scope && styles.activeBibleSearchChipText]}>{label}</Text>
                        </Pressable>
                      ))}
                      <View style={[styles.bibleSearchRefineRow, phoneLayout && styles.phoneBibleSearchRefineRow]}>
                        <Pressable
                          onPress={() => setBibleSearchExact((value) => !value)}
                          style={[styles.bibleSearchChip, styles.bibleSearchExactChip, phoneLayout && styles.phoneBibleSearchChip, bibleSearchExact && styles.activeBibleSearchChip]}
                        >
                          <Ionicons name={bibleSearchExact ? "checkmark-circle" : "ellipse-outline"} size={14} color={bibleSearchExact ? "white" : colors.oliveDark} />
                          <Text style={[styles.bibleSearchChipText, bibleSearchExact && styles.activeBibleSearchChipText]}>Exact phrase</Text>
                        </Pressable>
                        <View style={[styles.bibleSearchBookFilter, phoneLayout && styles.phoneBibleSearchBookFilter]}>
                          {Platform.OS === "web" ? (
                            <select
                              aria-label="Book filter"
                              value={bibleSearchBook}
                              onChange={(event) => setBibleSearchBook(event.currentTarget.value)}
                              style={StyleSheet.flatten([styles.bibleSearchSelect, phoneLayout && styles.phoneBibleSearchSelect]) as any}
                            >
                              <option value="">Any book</option>
                              {bibleSearchBookOptions.map((book) => (
                                <option key={book} value={book}>{book}</option>
                              ))}
                            </select>
                          ) : (
                            <>
                              <Pressable onPress={() => setBibleSearchBookMenuOpen((value) => !value)} style={[styles.bibleSearchSelectButton, phoneLayout && styles.phoneBibleSearchSelectButton]}>
                                <Text numberOfLines={1} style={styles.bibleSearchSelectText}>{bibleSearchBook || "Any book"}</Text>
                                <Ionicons name={bibleSearchBookMenuOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={colors.muted} />
                              </Pressable>
                              {bibleSearchBookMenuOpen && (
                                <View style={styles.bibleSearchSelectMenu}>
                                <Pressable
                                  onPress={() => {
                                    setBibleSearchBook("");
                                    setBibleSearchBookMenuOpen(false);
                                  }}
                                  style={styles.bibleSearchSelectOption}
                                >
                                  <Text style={styles.bibleSearchSelectOptionText}>Any book</Text>
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
                                    <Text style={[styles.bibleSearchSelectOptionText, bibleSearchBook === book && styles.activeBibleSearchChipText]}>{book}</Text>
                                  </Pressable>
                                ))}
                                </View>
                              )}
                            </>
                          )}
                        </View>
                      </View>
                    </View>
                  </>
                )}
                {!bibleSearchCollapsed && !!bibleSearchStatus && <Text style={styles.saveStatus}>{bibleSearchStatus}</Text>}
                {!bibleSearchCollapsed && !!bibleSearchActiveQuery && bibleTranslation === "bsb" && (
                  <Text style={styles.bibleSearchFootnote}>Search uses WEB text while the reader can stay on BSB.</Text>
                )}
                {!bibleSearchCollapsed && bibleSearchSections.map((section) => (
                  <View key={section.title} style={styles.bibleSearchResultSection}>
                    <Text style={styles.readerBookSectionTitle}>{section.title}</Text>
                    {section.results.map((result) => (
                      <View key={result.id} style={styles.bibleSearchResultCard}>
                        <View style={styles.bibleSearchResultHeader}>
                          <Text style={styles.bibleSearchResultReference}>{`${result.book} ${result.chapter}:${result.verse}`}</Text>
                          <Text style={styles.bibleSearchSourceQuery}>{result.sourceQuery}</Text>
                        </View>
                        <Text style={styles.bibleSearchResultText}>{result.text}</Text>
                        <View style={styles.bibleSearchResultActions}>
                          <ResumeButton label="Read" icon="reader-outline" onPress={() => openBibleSearchResult(result)} />
                          <ResumeButton label="Study" icon="book-outline" onPress={() => studyBibleSearchResult(result)} />
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
                    <Text style={styles.stepTitle}>{readerStudyReference}</Text>
                    {currentChapterBookmarked && <Ionicons name="bookmark" size={17} color={colors.coral} />}
                  </View>
                </View>
                <AppButton label={selectedReaderVerses.length ? "Study selected" : "Study this"} variant="secondary" onPress={openReaderChapterInStudy} />
              </View>
              {selectedReaderVerses.length > 0 && (
                <View style={styles.readerSelectionBar}>
                  <Text style={styles.readerSelectionText}>{`${selectedReaderVerses.length} verse${selectedReaderVerses.length === 1 ? "" : "s"} selected`}</Text>
                  <Pressable
                    onPress={clearReaderSelection}
                    style={styles.clearMarkupButton}
                  >
                    <Text style={styles.clearMarkupText}>Clear</Text>
                  </Pressable>
                </View>
              )}
              <View style={[styles.readerNavigationRow, phoneLayout && styles.phoneReaderNavigationRow]}>
                <Pressable accessibilityRole="button" {...readerIconHoverProps("Previous chapter")} onPress={() => { hideReaderTooltip(); moveReaderChapter(-1); }} style={[styles.readerNavIconButton, phoneLayout && styles.phoneReaderNavIconButton]}>
                  <Ionicons name="chevron-back-outline" size={18} color={colors.oliveDark} />
                </Pressable>
                <View style={[styles.readerChapterControl, phoneLayout && styles.phoneReaderChapterControl]}>
                  <Text numberOfLines={1} style={[styles.readerChapterLabel, phoneLayout && styles.phoneReaderChapterLabel]}>
                    {phoneLayout ? "Ch" : "Ch."}
                  </Text>
                  <TextInput
                    value={readerChapterDraft}
                    onChangeText={setReaderChapterDraft}
                    onBlur={() => commitReaderChapter()}
                    onSubmitEditing={() => commitReaderChapter()}
                    keyboardType="number-pad"
                    selectTextOnFocus
                    style={[styles.readerChapterInput, phoneLayout && styles.phoneReaderChapterInput]}
                  />
                  <Text numberOfLines={1} style={[styles.readerChapterCountText, phoneLayout && styles.phoneReaderChapterCountText]}>
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
                  style={[styles.readerNavIconButton, phoneLayout && styles.phoneReaderNavIconButton, currentChapterRead && styles.activeReaderReadButton]}
                >
                  <Ionicons name={currentChapterRead ? "checkmark-circle" : "checkmark-circle-outline"} size={18} color={currentChapterRead ? "white" : colors.oliveDark} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  {...readerIconHoverProps(currentChapterBookmarked ? "Chapter bookmarked" : "Bookmark chapter")}
                  onPress={() => {
                    hideReaderTooltip();
                    saveBibleBookmark();
                  }}
                  style={[styles.readerNavIconButton, phoneLayout && styles.phoneReaderNavIconButton, currentChapterBookmarked && styles.activeReaderBookmarkButton]}
                >
                  <Ionicons name={currentChapterBookmarked ? "bookmark" : "bookmark-outline"} size={18} color={currentChapterBookmarked ? "white" : colors.oliveDark} />
                </Pressable>
                <Pressable accessibilityRole="button" {...readerIconHoverProps("Next chapter")} onPress={() => { hideReaderTooltip(); moveReaderChapter(1); }} style={[styles.readerNavIconButton, phoneLayout && styles.phoneReaderNavIconButton]}>
                  <Ionicons name="chevron-forward-outline" size={18} color={colors.oliveDark} />
                </Pressable>
              </View>
              {Platform.OS === "web" && !!readerIconTooltip && <Text style={styles.readerIconTooltip}>{readerIconTooltip}</Text>}
              <View style={styles.readerProgressRow}>
                <Text style={styles.readerProgressText}>{`${readBibleChapterCount} chapter${readBibleChapterCount === 1 ? "" : "s"} read`}</Text>
                {readBibleChapterCount > 0 && (
                  <Pressable onPress={clearBibleReadingProgress} style={styles.readerProgressClearButton}>
                    <Text style={styles.readerProgressClearText}>Clear all</Text>
                  </Pressable>
                )}
              </View>
              {readerPassage?.verses?.length ? (
                <View style={[styles.readerPassageBox, phoneLayout && styles.phoneReaderPassageBox, phoneLayout && selectedReaderVerses.length > 0 && styles.phoneReaderPassageWithSelectionDock]}>
                  {readerPassage.verses.map((verse) => (
                    <View key={`${verse.chapter}-${verse.verse}`}>
                      <Pressable
                        onPress={() => toggleReaderVerse(verse.verse)}
                        style={[styles.readerVerseRow, phoneLayout && styles.phoneReaderVerseRow, selectedReaderVerses.includes(verse.verse) && styles.selectedReaderVerseRow]}
                      >
                        <Text style={[styles.readerVerseNumber, phoneLayout && styles.phoneReaderVerseNumber]}>{verse.verse}</Text>
                        <Text style={[styles.readerVerseText, phoneLayout && styles.phoneReaderVerseText]}>{verse.text}</Text>
                        <View style={[styles.readerVerseIconRow, phoneLayout && styles.phoneReaderVerseIconRow]}>
                          {readerMemoryVerseKeys.has(verseMarkupKey(verse)) && (
                            <Ionicons name="sparkles" size={15} color={colors.coral} />
                          )}
                          {isReaderVerseBookmarked(verse.verse, bibleBookmarks, readerBook, readerChapter) && (
                            <Ionicons name="bookmark" size={15} color={colors.coral} />
                          )}
                          {isReaderVerseBookmarkNoted(verse.verse, bibleBookmarks, readerBook, readerChapter) && (
                            <Ionicons name="document-text" size={15} color={colors.oliveDark} />
                          )}
                        </View>
                      </Pressable>
                      {!phoneLayout && selectedReaderVerses.length > 0 && verse.verse === activeReaderActionVerse && (
                        <View style={styles.inlineReaderActionBar}>
                          <Text style={styles.readerSelectionText}>{readerStudyReference}</Text>
                          <View style={styles.inlineReaderActions}>
                            <Pressable onPress={openReaderChapterInStudy} style={styles.inlineReaderStudyButton}>
                              <Text style={styles.inlineReaderStudyText}>Study selected</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => saveBibleBookmark(selectedReaderVerses)}
                              style={[styles.inlineReaderBookmarkButton, currentSelectionBookmarked && styles.activeReaderBookmarkButton]}
                            >
                              <Ionicons name={currentSelectionBookmarked ? "bookmark" : "bookmark-outline"} size={14} color={currentSelectionBookmarked ? "white" : colors.oliveDark} />
                              <Text style={[styles.inlineReaderBookmarkText, currentSelectionBookmarked && styles.activeReaderReadButtonText]}>
                                {currentSelectionBookmarked ? "Bookmarked" : "Bookmark"}
                              </Text>
                            </Pressable>
                            <Pressable onPress={openSelectedReaderNote} style={[styles.inlineReaderBookmarkButton, currentSelectionBookmark?.note?.trim() && styles.activeBookmarkNoteButton]}>
                              <Ionicons name={currentSelectionBookmark?.note?.trim() ? "document-text" : "document-text-outline"} size={14} color={currentSelectionBookmark?.note?.trim() ? "white" : colors.oliveDark} />
                              <Text style={[styles.inlineReaderBookmarkText, currentSelectionBookmark?.note?.trim() && styles.activeReaderReadButtonText]}>Note</Text>
                            </Pressable>
                            <Pressable onPress={openReaderWorksheetOptions} style={styles.inlineReaderBookmarkButton}>
                              <Ionicons name="print-outline" size={14} color={colors.oliveDark} />
                              <Text style={styles.inlineReaderBookmarkText}>Print</Text>
                            </Pressable>
                            <Pressable onPress={saveSelectedReaderVersesToMemory} style={[styles.inlineReaderBookmarkButton, styles.memoryReaderButton, selectedReaderVersesAlreadyInMemory && styles.savedMemoryButton]}>
                              <Ionicons name="sparkles-outline" size={14} color="white" />
                              <Text style={styles.memoryReaderButtonText}>{selectedReaderVersesAlreadyInMemory ? "In Memory" : "Memory"}</Text>
                            </Pressable>
                            <Pressable
                              onPress={clearReaderSelection}
                              style={styles.clearMarkupButton}
                            >
                              <Text style={styles.clearMarkupText}>Clear</Text>
                            </Pressable>
                          </View>
                        </View>
                      )}
                    </View>
                  ))}
                  <View style={styles.readerBottomNav}>
                    <Pressable onPress={() => moveReaderChapter(-1)} style={styles.readerBottomNavButton}>
                      <Ionicons name="chevron-back-outline" size={15} color={colors.oliveDark} />
                      <Text style={styles.readerBottomNavText}>Previous</Text>
                    </Pressable>
                    <Pressable onPress={toggleReaderChapterRead} style={[styles.readerBottomNavButton, styles.readerBottomReadButton, currentChapterRead && styles.activeReaderReadButton]}>
                      <Ionicons name={currentChapterRead ? "checkmark-circle" : "checkmark-circle-outline"} size={15} color={currentChapterRead ? "white" : colors.oliveDark} />
                      <Text style={[styles.readerBottomNavText, currentChapterRead && styles.activeReaderReadButtonText]}>
                        {currentChapterRead ? "Chapter read" : "Mark read"}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => moveReaderChapter(1)} style={styles.readerBottomNavButton}>
                      <Text style={styles.readerBottomNavText}>Next</Text>
                      <Ionicons name="chevron-forward-outline" size={15} color={colors.oliveDark} />
                    </Pressable>
                  </View>
                  <Text style={styles.translationNote}>
                    {readerPassage.translation_name} · {readerPassage.translation_note || "Public Domain"}
                  </Text>
                </View>
              ) : (
                <View style={styles.passageStatusBox}>
                  <Text style={styles.muted}>{readerStatus}</Text>
                </View>
              )}
              {!!readerMemoryStatus && <Text style={styles.saveStatus}>{readerMemoryStatus}</Text>}
            </Card>
          </View>
        )}

        {tab === "plans" && (
          <View>
            <Eyebrow>Guided paths</Eyebrow>
            <Text style={styles.title}>Study plans</Text>
            <Text style={styles.titleSupport}>Choose an original seven-day path, then save each study to mark the day complete.</Text>
            <View style={[styles.currentPlanWideBox, phoneLayout && styles.phoneCurrentPlanWideBox]}>
              <View style={[styles.journalHeader, phoneLayout && styles.phonePlanHeader]}>
                <View style={styles.journalTitleBlock}>
                  <Text style={styles.cardTitle}>{selectedPlan.title}</Text>
                  <Text style={styles.muted}>{selectedPlanComplete ? "Completed. Start again or choose a new plan." : `Next: Day ${selectedPlanNextDay.day} · ${selectedPlanNextDay.passage}`}</Text>
                </View>
                <Text style={styles.draftPill}>{selectedPlanCompletedCount}/{selectedPlan.days.length}</Text>
              </View>
              <View style={styles.planProgressTrack}>
                <View style={[styles.planProgressFill, { width: `${(selectedPlanCompletedCount / selectedPlan.days.length) * 100}%` }]} />
              </View>
              <View style={[styles.planActionRow, phoneLayout && styles.phonePlanActionRow]}>
                <AppButton label={selectedPlanComplete ? "Restart current plan" : "Continue current plan"} onPress={() => selectedPlanComplete ? resetSelectedPlanProgress() : startPlanDay(selectedPlanNextDay)} style={phoneLayout && styles.phonePlanPrimaryButton} labelStyle={phoneLayout && styles.phonePlanButtonLabel} />
                {selectedPlanCompletedCount > 0 && !selectedPlanComplete && <AppButton label="Reset progress" variant="secondary" onPress={() => resetSelectedPlanProgress()} style={phoneLayout && styles.phonePlanSecondaryButton} labelStyle={phoneLayout && styles.phonePlanButtonLabel} />}
              </View>
            </View>
            <View style={[styles.planPageGrid, phoneLayout && styles.phonePlanPageGrid]}>
              {studyPlans.map((plan) => {
                const completedCount = plan.days.filter((day) => completedPlanDaySet.has(planDayKey(plan.id, day.day))).length;
                return (
                  <Card key={plan.id} style={[styles.planPageCard, phoneLayout && styles.phonePlanPageCard]}>
                    <View style={[styles.journalHeader, phoneLayout && styles.phonePlanHeader]}>
                      <View style={styles.journalTitleBlock}>
                        <Text style={styles.cardTitle}>{plan.title}</Text>
                        <Text style={styles.muted}>{plan.description}</Text>
                      </View>
                      <Text style={styles.draftPill}>{completedCount}/{plan.days.length}</Text>
                    </View>
                    <View style={styles.planProgressTrack}>
                      <View style={[styles.planProgressFill, { width: `${(completedCount / plan.days.length) * 100}%` }]} />
                    </View>
                    <View style={[styles.planActionRow, phoneLayout && styles.phonePlanActionRow]}>
                      <ResumeButton label={completedCount === plan.days.length ? "Restart" : "Continue"} icon={completedCount === plan.days.length ? "refresh-outline" : "play-outline"} onPress={() => {
                        setSelectedPlanId(plan.id);
                        const nextDay = plan.days.find((day) => !completedPlanDaySet.has(planDayKey(plan.id, day.day))) || plan.days[0];
                        completedCount === plan.days.length ? resetSelectedPlanProgress(plan.id) : startPlanDay(nextDay, plan.id);
                      }} style={phoneLayout && styles.phonePlanResumeButton} labelStyle={phoneLayout && styles.phonePlanButtonLabel} />
                      {completedCount > 0 && completedCount < plan.days.length && <ResumeButton label="Reset" icon="refresh-outline" onPress={() => resetSelectedPlanProgress(plan.id)} style={phoneLayout && styles.phonePlanResumeButton} labelStyle={phoneLayout && styles.phonePlanButtonLabel} />}
                    </View>
                    {plan.days.map((planDay) => {
                      const done = completedPlanDaySet.has(planDayKey(plan.id, planDay.day));
                      return (
                        <Pressable key={planDay.day} onPress={() => startPlanDay(planDay, plan.id)} style={[styles.planPageDay, phoneLayout && styles.phonePlanPageDay, done && styles.completedPlanDayRow]}>
                          <Text style={[styles.planDayBadge, done && styles.completedPlanDayBadge]}>{done ? "✓" : planDay.day}</Text>
                          <View style={styles.planDayCopy}>
                            <Text style={[styles.planDayTitle, phoneLayout && styles.phonePlanDayTitle]}>{planDay.title}</Text>
                            <Text numberOfLines={1} style={[styles.planDayPassage, phoneLayout && styles.phonePlanDayPassage]}>{planDay.passage} · {(methods.find((item) => item.id === planDay.methodId) || methods[0]).short}</Text>
                          </View>
                          <Ionicons name="arrow-forward-outline" size={16} color={colors.muted} />
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
          <View>
            <Eyebrow>Practice library</Eyebrow>
            <Text style={styles.title}>Choose how you want to learn</Text>
            <Text style={styles.titleSupport}>Tap the info button to see when to use a method, how it works, and a worked example.</Text>
            <View style={styles.currentMethodStrip}>
              <View style={styles.currentMethodCopy}>
                <Text style={styles.methodInfoLabel}>Current method</Text>
                <Text style={styles.currentMethodTitle}>{method.short} · {method.name}</Text>
              </View>
              <View style={styles.currentMethodActions}>
                <AppButton label="Continue study" onPress={() => setTab("study")} style={styles.currentMethodButton} labelStyle={styles.currentMethodButtonLabel} />
                <AppButton label="Details" variant="secondary" onPress={() => setActiveMethodInfoId(method.id)} style={styles.currentMethodButton} labelStyle={styles.currentMethodButtonLabel} />
              </View>
            </View>
            <View style={styles.methodLibraryToolbar}>
              <Pressable accessibilityRole="button" onPress={() => setMethodChooserOpen((value) => !value)} style={styles.methodToolbarButton}>
                <Ionicons name="sparkles-outline" size={16} color={colors.oliveDark} />
                <Text style={styles.methodToolbarButtonText}>Help me choose</Text>
                <Text style={styles.methodToolbarBadge}>{recommendedMethod.short}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setMethodFilterOpen((value) => !value)} style={styles.methodToolbarButton}>
                <Ionicons name="filter-outline" size={16} color={colors.oliveDark} />
                <Text style={styles.methodToolbarButtonText}>{`Filter: ${methodFilter}`}</Text>
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
                      style={[styles.methodFilterChip, methodFilter === filter && styles.activeMethodFilterChip]}
                    >
                      <Text style={[styles.methodFilterText, methodFilter === filter && styles.activeMethodFilterText]}>{filter}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
            {methodChooserOpen && (
              <Card style={styles.methodRecommendPanel}>
                <View style={styles.methodRecommendHeader}>
                  <View style={styles.methodRecommendTitleBlock}>
                    <Text style={styles.methodInfoLabel}>Help me choose</Text>
                    <Text style={styles.methodRecommendTitle}>{recommendedMethod.name}</Text>
                    <Text style={styles.methodRecommendReason}>{selectedMethodRecommendation.reason}</Text>
                  </View>
                  <Text style={styles.badge}>{recommendedMethod.short}</Text>
                </View>
                <View style={styles.methodRecommendChoices}>
                  {methodRecommendations.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => setMethodRecommendationId(item.id)}
                    style={[styles.methodRecommendChoice, methodRecommendationId === item.id && styles.activeMethodRecommendChoice]}
                  >
                    <Text style={[styles.methodRecommendChoiceText, methodRecommendationId === item.id && styles.activeMethodRecommendChoiceText]}>{item.label}</Text>
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
                  <AppButton label="View details" variant="secondary" onPress={() => setActiveMethodInfoId(recommendedMethod.id)} />
                  <AppButton label="Hide" variant="secondary" onPress={() => setMethodChooserOpen(false)} />
                </View>
              </Card>
            )}
            {activeMethodInfo && (
              <Card style={styles.methodInfoPanel}>
                <View style={styles.methodInfoHeader}>
                  <View style={styles.methodInfoTitleBlock}>
                    <Text style={styles.badge}>{activeMethodInfo.short}</Text>
                    <Text style={styles.cardTitle}>{activeMethodInfo.name}</Text>
                    <Text style={styles.muted}>{activeMethodInfo.tone}</Text>
                  </View>
                  <Pressable accessibilityRole="button" onPress={() => setActiveMethodInfoId("")} style={styles.methodIconButton}>
                    <Ionicons name="close-outline" size={18} color={colors.oliveDark} />
                  </Pressable>
                </View>
                <Text style={styles.body}>{activeMethodInfo.detail?.purpose || activeMethodInfo.description}</Text>
                <View style={styles.methodInfoSection}>
                  <Text style={styles.methodInfoLabel}>Best for</Text>
                  <View style={styles.methodFitRow}>
                    {(activeMethodInfo.labels || activeMethodInfo.detail?.bestFor || [activeMethodInfo.tone]).map((fit) => (
                      <Text key={fit} style={styles.methodFitPill}>{fit}</Text>
                    ))}
                  </View>
                </View>
                <View style={styles.methodInfoSection}>
                  <Text style={styles.methodInfoLabel}>How it works</Text>
                  {activeMethodInfo.steps.map((methodStep, index) => (
                    <View key={`${activeMethodInfo.id}-${methodStep.title}`} style={styles.methodStepPreview}>
                      <Text style={styles.methodStepNumber}>{index + 1}</Text>
                      <View style={styles.methodStepCopy}>
                        <Text style={styles.methodStepTitle}>{methodStep.title}</Text>
                        <Text style={styles.methodStepText}>{methodStep.action}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                <View style={styles.methodInfoSection}>
                  <Text style={styles.methodInfoLabel}>Example</Text>
                  <Text style={styles.methodExamplePassage}>{activeMethodInfo.detail?.examplePassage || "Psalm 23"}</Text>
                  {(activeMethodInfo.detail?.exampleWalkthrough || activeMethodInfo.steps.map((methodStep) => `${methodStep.title}: ${methodStep.example}`)).map((line) => (
                    <Text key={line} style={styles.methodExampleLine}>{line}</Text>
                  ))}
                </View>
                {!!activeMethodInfo.detail?.watchFor && (
                  <View style={styles.methodWatchBox}>
                    <Ionicons name="alert-circle-outline" size={17} color={colors.coral} />
                    <Text style={styles.methodWatchText}>{activeMethodInfo.detail.watchFor}</Text>
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
                  <AppButton label="Try example" variant="secondary" onPress={() => startMethodExample(activeMethodInfo.id)} />
                  <AppButton label="Close" variant="secondary" onPress={() => setActiveMethodInfoId("")} />
                </View>
              </Card>
            )}
            <View style={styles.methodGrid}>
              {visibleMethods.map((item) => (
                <Card key={item.id} style={[styles.methodCard, phoneLayout && styles.phoneMethodCard]}>
                  <View style={styles.methodCardHeader}>
                    <Text style={styles.badge}>{item.short}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel={`About ${item.short}`} onPress={() => setActiveMethodInfoId(item.id)} style={styles.methodIconButton}>
                      <Ionicons name="information-circle-outline" size={18} color={colors.oliveDark} />
                    </Pressable>
                  </View>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.muted}>{item.tone}</Text>
                  <View style={styles.methodLabelRow}>
                    {(item.labels || [item.tone]).slice(0, 3).map((label) => (
                      <Text key={`${item.id}-${label}`} style={styles.methodLabelPill}>{label}</Text>
                    ))}
                  </View>
                  <Text style={styles.body}>{item.description}</Text>
                  <View style={styles.methodStepCountRow}>
                    <Ionicons name="list-outline" size={15} color={colors.coral} />
                    <Text style={styles.methodStepCountText}>{`${item.steps.length} guided steps`}</Text>
                  </View>
                  <View style={styles.methodCardAction}>
                    <AppButton
                      label="Practice"
                      variant="secondary"
                      onPress={() => {
                        switchMethod(item.id);
                        setTab("study");
                      }}
                    />
                  </View>
                </Card>
              ))}
              {!visibleMethods.length && (
                <Card style={styles.emptyMethodCard}>
                  <Text style={styles.emptyJournalTitle}>No methods match this filter</Text>
                  <Text style={styles.emptyJournalText}>Choose another focus to keep browsing.</Text>
                </Card>
              )}
            </View>
          </View>
        )}

        {tab === "memory" && (
          <View style={[styles.layout, compactLayout && styles.stackedLayout]}>
            <Card style={[styles.mainCard, compactLayout && styles.fluidCard]}>
              <Eyebrow>Memory</Eyebrow>
              <Text style={styles.title}>{firstName ? `${firstName}, memorize saved verses` : "Memorize saved verses"}</Text>
              {!phoneMemoryFocusMode && (
                <>
                  <Text style={styles.titleSupport}>Hide a little at a time and carry Scripture with you through the day.</Text>
                  <View style={[styles.metricGrid, phoneLayout && styles.phoneMemoryMetricGrid]}>
                    <Metric value={(memoryVerses || []).length} label="saved" compact={phoneLayout} />
                    <Metric value={dueMemoryCount} label="due now" compact={phoneLayout} />
                    <Metric value={(memoryVerses || []).filter((item: any) => isMemoryVerseMemorized(item)).length} label="memorized" compact={phoneLayout} />
                  </View>
                </>
              )}
              {phoneMemoryFocusMode && (
                <View style={styles.memoryFocusBanner}>
                  <Ionicons name="school-outline" size={18} color={colors.coral} />
                  <Text style={styles.memoryFocusBannerText}>Practice mode. Close or finish this verse to return to your saved list.</Text>
                </View>
              )}
              {!!memoryStatus && <Text style={styles.saveStatus}>{memoryStatus}</Text>}
              {(memoryVerses || []).length === 0 ? (
                <View style={styles.emptyJournalBox}>
                  <Ionicons name="sparkles-outline" size={24} color={colors.coral} />
                  <Text style={styles.emptyJournalTitle}>No memory verses yet</Text>
                  <Text style={styles.emptyJournalText}>{`${friendlyName}, open the Bible, select one or more verses, then tap Memory. You can also save verses while studying.`}</Text>
                  <View style={styles.emptyMemoryActions}>
                    <AppButton label="Open Bible" onPress={() => setTab("bible")} />
                    <AppButton label="Open Study" variant="secondary" onPress={() => setTab("study")} />
                  </View>
                </View>
              ) : (
                <View style={styles.memoryList}>
                  {!phoneMemoryFocusMode && (
                    <View style={[styles.addMemoryBox, phoneLayout && styles.phoneAddMemoryBox]}>
                      <View style={styles.addMemoryCopy}>
                        <View style={styles.feedbackHeader}>
                          <Ionicons name="add-circle-outline" size={18} color={colors.coral} />
                          <Text style={styles.feedbackTitle}>Add memory verses</Text>
                        </View>
                        <Text style={styles.addMemoryText}>Open the Bible, select verse/s, then tap Memory. You can also save verses from Study.</Text>
                      </View>
                      <View style={[styles.emptyMemoryActions, phoneLayout && styles.phoneAddMemoryActions]}>
                        <AppButton label="Find in Bible" onPress={() => setTab("bible")} style={phoneLayout && styles.phoneMemoryAddButton} />
                        <AppButton label="Open Study" variant="secondary" onPress={() => setTab("study")} style={phoneLayout && styles.phoneMemoryAddButton} />
                      </View>
                    </View>
                  )}
                  {!phoneMemoryFocusMode && <View style={styles.memoryViewToggle}>
                    {[
                      ["review", "Review"],
                      ["browse", "Browse"]
                    ].map(([key, label]) => (
                      <Pressable
                        key={key}
                        onPress={() => setMemoryView(key as MemoryView)}
                        style={[styles.memoryViewButton, memoryView === key && styles.activeMemoryViewButton]}
                      >
                        <Text style={[styles.memoryViewText, memoryView === key && styles.activeMemoryViewText]}>{label}</Text>
                      </Pressable>
                    ))}
                  </View>}
                  {!phoneMemoryFocusMode && memoryView === "browse" && (
                    <>
                      <View style={styles.journalSearchBox}>
                        <Ionicons name="search-outline" size={18} color={colors.coral} />
                        <TextInput
                          value={memorySearch}
                          onChangeText={setMemorySearch}
                          placeholder="Search reference or verse text"
                          style={styles.journalSearchInput}
                        />
                        {!!memorySearch.trim() && (
                          <Pressable onPress={() => setMemorySearch("")} style={styles.clearSearchButton}>
                            <Ionicons name="close-outline" size={18} color={colors.muted} />
                          </Pressable>
                        )}
                      </View>
                      <View style={styles.memoryDiscoverBlock}>
                        <Text style={styles.memoryDiscoverLabel}>Books saved</Text>
                        <View style={styles.filterRow}>
                          <Pressable
                            onPress={() => {
                              setMemoryBookFilter("all");
                              setMemoryChapterFilter("all");
                            }}
                            style={[styles.filterChip, memoryBookFilter === "all" && styles.activeFilterChip]}
                          >
                            <Text style={[styles.filterText, memoryBookFilter === "all" && styles.activeFilterText]}>All books</Text>
                          </Pressable>
                          {memoryBookOptions.map((book) => (
                            <Pressable
                              key={book.book}
                              onPress={() => {
                                setMemoryBookFilter(book.book);
                                setMemoryChapterFilter("all");
                              }}
                              style={[styles.filterChip, memoryBookFilter === book.book && styles.activeFilterChip]}
                            >
                              <Text style={[styles.filterText, memoryBookFilter === book.book && styles.activeFilterText]}>
                                {book.book} ({book.count})
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                        <Text style={styles.memoryDiscoverLabel}>Chapters saved</Text>
                        <View style={styles.filterRow}>
                          <Pressable
                            onPress={() => setMemoryChapterFilter("all")}
                            style={[styles.filterChip, memoryChapterFilter === "all" && styles.activeFilterChip]}
                          >
                            <Text style={[styles.filterText, memoryChapterFilter === "all" && styles.activeFilterText]}>All chapters</Text>
                          </Pressable>
                          {memoryChapterOptions.map((chapter) => (
                            <Pressable
                              key={chapter.key}
                              onPress={() => setMemoryChapterFilter(chapter.key)}
                              style={[styles.filterChip, memoryChapterFilter === chapter.key && styles.activeFilterChip]}
                            >
                              <Text style={[styles.filterText, memoryChapterFilter === chapter.key && styles.activeFilterText]}>
                                {chapter.label} ({chapter.count})
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                        <Text style={styles.memoryDiscoverLabel}>Status</Text>
                        <View style={styles.filterRow}>
                          {[
                            ["all", "All"],
                            ["due", "Due"],
                            ["learning", "Learning"],
                            ["memorized", "Memorized"]
                          ].map(([key, label]) => (
                            <Pressable
                              key={key}
                              onPress={() => setMemoryBrowseStatusFilter(key as MemoryBrowseStatusFilter)}
                              style={[styles.filterChip, memoryBrowseStatusFilter === key && styles.activeFilterChip]}
                            >
                              <Text style={[styles.filterText, memoryBrowseStatusFilter === key && styles.activeFilterText]}>{label}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    </>
                  )}
                  {visibleMemorySections.map((section) => (
                    <View key={section.title} style={styles.memorySection}>
                      {!phoneMemoryFocusMode && (
                        <>
                          <View style={styles.memorySectionHeader}>
                            <Text style={styles.memorySectionTitle}>{section.title}</Text>
                            <Text style={styles.memorySectionCount}>{section.verses.length}</Text>
                          </View>
                          <Text style={styles.muted}>{section.description}</Text>
                        </>
                      )}
                      {section.verses.map((verse: any) => {
                        const practicing = String(verse._id) === activeMemoryVerseId;

                        return (
                          <View key={verse._id} style={[styles.memoryCard, phoneLayout && styles.phoneMemoryCard, practicing && styles.activeMemoryCard]}>
                            <View style={[styles.journalHeader, phoneLayout && styles.phoneMemoryCardHeader]}>
                              <View style={styles.journalTitleBlock}>
                                <Text style={styles.cardTitle}>{verse.reference}</Text>
                                <Text numberOfLines={1} style={[styles.muted, phoneLayout && styles.memoryTranslationLabel]}>
                                  {phoneLayout ? shortBibleTranslationName(verse.translationName) : verse.translationName}
                                </Text>
                              </View>
                              <View style={[styles.memoryHeaderBadges, phoneLayout && styles.phoneMemoryHeaderBadges]}>
                                <Text style={[styles.reviewDatePill, isMemoryVerseDue(verse) && styles.dueReviewDatePill]}>{memoryReviewDateLabel(verse.nextReviewAt)}</Text>
                                <Text style={styles.draftPill}>{memoryProgressLabel(verse)}</Text>
                              </View>
                            </View>
                            {practicing ? (
                              <View style={[styles.inlineMemoryPractice, phoneLayout && styles.phoneInlineMemoryPractice]}>
                                <Text style={styles.helpIntro}>Step {memoryPracticeLevel}: {memoryPracticeLabel(memoryPracticeLevel)}</Text>
                                <View style={[styles.memoryStepRow, phoneLayout && styles.phoneMemoryStepRow]}>
                                  {[1, 2, 3].map((level) => (
                                    <Pressable
                                      key={level}
                                      onPress={() => moveMemoryPracticeStep(level)}
                                      style={[styles.memoryStepButton, memoryPracticeLevel === level && styles.activeMemoryStepButton]}
                                    >
                                      <Text style={[styles.memoryStepText, memoryPracticeLevel === level && styles.activeMemoryStepText]}>Step {level}</Text>
                                    </Pressable>
                                  ))}
                                </View>
                                {memoryPracticeLevel === 1 ? (
                                  <Text style={[styles.memoryPracticeText, phoneLayout && styles.phoneMemoryPracticeText]}>{memoryPracticeText}</Text>
                                ) : (
                                  <View style={[styles.memoryFillBox, phoneLayout && styles.phoneMemoryFillBox]}>
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
                                        />
                                      ) : (
                                        <Text key={token.index} style={styles.memoryPracticeWord}>{token.text}</Text>
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
                                    <ResumeButton label={memoryPracticeLevel === 1 ? "Ready for Step 2" : "Check answers"} icon="checkmark-circle-outline" onPress={submitMemoryPractice} style={phoneLayout && styles.phoneMemoryActionButton} labelStyle={phoneLayout && styles.phoneMemoryActionText} />
                                  )}
                                  {memoryPracticeLevel > 1 && (
                                    <ResumeButton label="Repeat" icon="refresh-outline" onPress={repeatMemoryPracticeStep} style={phoneLayout && styles.phoneMemoryActionButton} labelStyle={phoneLayout && styles.phoneMemoryActionText} />
                                  )}
                                  {memoryPracticeLevel > 1 && !memoryPracticeAllCorrect && (
                                    <ResumeButton
                                      label={memoryHintsVisible ? "Hide hints" : "Show hints"}
                                      icon="bulb-outline"
                                      onPress={() => setMemoryHintsVisible((visible) => !visible)}
                                      style={phoneLayout && styles.phoneMemoryActionButton}
                                      labelStyle={phoneLayout && styles.phoneMemoryActionText}
                                    />
                                  )}
                                  <ResumeButton label="Close" icon="close-outline" onPress={() => setActiveMemoryVerseId("")} style={phoneLayout && styles.phoneMemoryActionButton} labelStyle={phoneLayout && styles.phoneMemoryActionText} />
                                </View>
                              </View>
                            ) : (
                              <>
                                <Text style={styles.memoryVerseText}>{verse.verseText}</Text>
                                {!!verse.note && <Text style={styles.muted}>{verse.note}</Text>}
                                <View style={[styles.journalActions, phoneLayout && styles.phoneMemoryActions]}>
                                  <ResumeButton label="Practice" icon="school-outline" onPress={() => startMemoryPractice(verse)} style={phoneLayout && styles.phoneMemoryActionButton} labelStyle={phoneLayout && styles.phoneMemoryActionText} />
                                  <ResumeButton
                                    label={reviewScheduleVerseId === String(verse._id) ? "Hide review" : "Change review"}
                                    icon="calendar-outline"
                                    onPress={() => setReviewScheduleVerseId((current) => current === String(verse._id) ? "" : String(verse._id))}
                                    style={phoneLayout && styles.phoneMemoryActionButton}
                                    labelStyle={phoneLayout && styles.phoneMemoryActionText}
                                  />
                                  <ResumeButton
                                    label={pendingDeleteMemoryVerseId === String(verse._id) ? "Confirm remove" : "Remove"}
                                    icon="trash-outline"
                                    onPress={() => deleteMemoryVerse(verse)}
                                    style={phoneLayout && styles.phoneMemoryActionButton}
                                    labelStyle={phoneLayout && styles.phoneMemoryActionText}
                                  />
                                </View>
                                {reviewScheduleVerseId === String(verse._id) && (
                                  <View style={styles.reviewScheduleBox}>
                                    <Text style={styles.memoryDiscoverLabel}>Review again</Text>
                                    <View style={styles.filterRow}>
                                      {MEMORY_REVIEW_OPTIONS.map((option) => (
                                        <Pressable
                                          key={option.id}
                                          onPress={() => scheduleMemoryVerseReview(verse, option.id)}
                                          style={[styles.filterChip, reviewPresetForDate(verse.nextReviewAt) === option.id && styles.activeFilterChip]}
                                        >
                                          <Text style={[styles.filterText, reviewPresetForDate(verse.nextReviewAt) === option.id && styles.activeFilterText]}>{option.label}</Text>
                                        </Pressable>
                                      ))}
                                    </View>
                                  </View>
                                )}
                              </>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ))}
                  {memoryView === "browse" && memoryBrowseSections.length === 0 && (
                    <View style={styles.emptyJournalBox}>
                      <Ionicons name="search-outline" size={24} color={colors.coral} />
                      <Text style={styles.emptyJournalTitle}>No saved verses found</Text>
                      <Text style={styles.emptyJournalText}>Try a book, chapter, reference, or a phrase from the verse.</Text>
                    </View>
                  )}
                </View>
              )}
            </Card>
          </View>
        )}

        {tab === "accountability" && (
          <View style={[styles.layout, compactLayout && styles.stackedLayout]}>
            <Card style={[styles.mainCard, compactLayout && styles.fluidCard]}>
              <Eyebrow>Community</Eyebrow>
              <Text style={styles.title}>{firstName ? `${firstName}, share a simple check-in` : "Share a simple check-in"}</Text>
              <Text style={styles.titleSupport}>One honest update can help you stay steady, encouraged, and accountable.</Text>
              <View style={[styles.communityFocusBox, phoneLayout && styles.phoneCommunityFocusBox]}>
                <View style={styles.feedbackHeader}>
                  <Ionicons name="person-circle-outline" size={18} color={colors.coral} />
                  <Text style={styles.feedbackTitle}>Sending to</Text>
                </View>
                <Text style={styles.communityRecipientText}>{effectivePartner.trim() || "Choose a person or group"}</Text>
                <Text style={styles.helpIntro}>
                  {effectivePartner.trim()
                    ? "This name is used at the start of your copied message."
                    : `${friendlyName}, add or choose someone from the People panel.`}
                </Text>
              </View>
              <TextInput
                multiline
                value={checkinNote}
                onChangeText={setCheckinNote}
                placeholder="What did you study, what stood out, and what is your next small step?"
                style={[styles.input, styles.textarea, phoneLayout && styles.phoneCheckinTextarea]}
              />
              <View style={[styles.sendNoteBox, phoneLayout && styles.phoneSendNoteBox]}>
                <View style={styles.feedbackHeader}>
                  <Ionicons name="send-outline" size={18} color={colors.coral} />
                  <Text style={styles.feedbackTitle}>Message preview</Text>
                </View>
                <Text style={[styles.shareMessageText, phoneLayout && styles.phoneShareMessageText]}>{communityMessage}</Text>
                <View style={[styles.buttonRow, phoneLayout && styles.phoneCommunityButtonRow]}>
                  <AppButton label="Copy message" onPress={shareCommunityMessage} style={phoneLayout && styles.phoneCommunityPrimaryButton} labelStyle={phoneLayout && styles.phoneCommunityButtonLabel} />
                  <AppButton label={checkinMarkedSent ? "Marked sent" : "Mark sent"} variant="secondary" onPress={markCheckinMessageSent} style={phoneLayout && styles.phoneCommunitySecondaryButton} labelStyle={phoneLayout && styles.phoneCommunityButtonLabel} />
                  <AppButton label={isSavingCheckin ? "Saving..." : "Save"} variant="secondary" onPress={persistCheckin} style={phoneLayout && styles.phoneCommunitySecondaryButton} labelStyle={phoneLayout && styles.phoneCommunityButtonLabel} />
                </View>
                {!!communityStatus && <Text style={styles.saveStatus}>{communityStatus}</Text>}
              </View>
            </Card>

            <Card style={[styles.coachCard, compactLayout && styles.fluidCard]}>
              <Pressable onPress={() => setPeoplePanelCollapsed((value) => !value)} style={styles.communityPanelHeader}>
                <View style={styles.feedbackHeader}>
                  <Ionicons name="people-outline" size={18} color={colors.coral} />
                  <Text style={styles.feedbackTitle}>People</Text>
                </View>
                <View style={styles.communityHeaderMeta}>
                  {!!effectivePartner.trim() && <Text style={styles.communityHeaderMetaText}>{effectivePartner}</Text>}
                  <Ionicons name={peoplePanelCollapsed ? "chevron-down-outline" : "chevron-up-outline"} size={16} color={colors.muted} />
                </View>
              </Pressable>
              {!peoplePanelCollapsed && (
                <>
                  <Text style={styles.helpIntro}>Keep this to the person, group, or chat you actually send updates to.</Text>
                  <View style={[styles.partnerManagerBox, phoneLayout && styles.phonePartnerManagerBox]}>
                    <TextInput value={partnerName} onChangeText={setPartnerName} placeholder="Partner or group name" style={styles.input} />
                    <TextInput value={partnerContactNote} onChangeText={setPartnerContactNote} placeholder="Optional: text, WhatsApp, email, group chat" style={styles.input} />
                    <AppButton label="Add person" variant="secondary" onPress={addCheckinPartner} style={phoneLayout && styles.phoneFullWidthButton} labelStyle={phoneLayout && styles.phoneCommunityButtonLabel} />
                    <View style={styles.partnerList}>
                      {checkinPartners.length === 0 ? (
                        <Text style={styles.helpIntro}>No people added yet.</Text>
                      ) : (
                        checkinPartners.map((item) => (
                          <Pressable key={item.id} onPress={() => selectCheckinPartner(item.id)} style={[styles.partnerChip, phoneLayout && styles.phonePartnerChip, activeCheckinPartnerId === item.id && styles.activePartnerChip]}>
                            <Text style={[styles.partnerChipText, activeCheckinPartnerId === item.id && styles.activePartnerChipText]}>{item.name}</Text>
                            {item.contactNote && <Text style={[styles.partnerContactText, activeCheckinPartnerId === item.id && styles.activePartnerChipText]}>{item.contactNote}</Text>}
                          </Pressable>
                        ))
                      )}
                    </View>
                  </View>
                </>
              )}
              <View style={styles.communityGoalBox}>
                <Text style={styles.lastCheckinLabel}>Weekly goal</Text>
                <TextInput value={weeklyGoal} onChangeText={setWeeklyGoal} placeholder="Example: Study 3 times this week" style={styles.input} />
              </View>
              <AppButton label="Save people" onPress={persistPlan} style={phoneLayout && styles.phoneFullWidthButton} labelStyle={phoneLayout && styles.phoneCommunityButtonLabel} />
              {!!planStatus && <Text style={styles.saveStatus}>{planStatus}</Text>}
              <View style={styles.communityDivider} />
              <View style={styles.feedbackHeader}>
                <Ionicons name="time-outline" size={18} color={colors.coral} />
                <Text style={styles.feedbackTitle}>Recent check-ins</Text>
              </View>
              {(checkins || []).length === 0 ? (
                <View style={styles.emptyCommunityBox}>
                  <Text style={styles.communityTitle}>No check-ins yet</Text>
                  <Text style={styles.helpIntro}>{`After your next study, ${friendlyName}, save one sentence here and keep the rhythm visible.`}</Text>
                </View>
              ) : (
                <>
                  {visibleCheckins.map((checkin: any) => (
                    <View key={checkin._id} style={[styles.checkinHistoryItem, phoneLayout && styles.phoneCheckinHistoryItem]}>
                      <View style={styles.journalHeader}>
                        <View style={styles.journalTitleBlock}>
                          <View style={styles.checkinTitleRow}>
                            <Text style={styles.checkinMood}>{checkin.mood}</Text>
                            <Text style={[styles.sentPill, checkin.sentAt && styles.sentPillActive]}>{checkin.sentAt ? "Sent" : "Saved"}</Text>
                          </View>
                          <Text style={styles.muted}>{new Date(checkin.createdAt).toLocaleDateString()}</Text>
                        </View>
                        <Pressable onPress={() => copyPastCheckinMessage(checkin)} style={[styles.copySmallButton, phoneLayout && styles.phoneCopySmallButton]}>
                          <Ionicons name="copy-outline" size={15} color={colors.oliveDark} />
                          <Text style={styles.copySmallText}>Copy</Text>
                        </Pressable>
                      </View>
                      <Text style={styles.lastCheckinText}>{checkin.note || "No note added."}</Text>
                    </View>
                  ))}
                  {(checkins || []).length > 3 && (
                    <Pressable onPress={() => setRecentCheckinsExpanded((value) => !value)} style={styles.communityShowMoreButton}>
                      <Text style={styles.communityShowMoreText}>{recentCheckinsExpanded ? "Show latest 3" : `Show more (${(checkins || []).length - 3})`}</Text>
                      <Ionicons name={recentCheckinsExpanded ? "chevron-up-outline" : "chevron-down-outline"} size={14} color={colors.oliveDark} />
                    </Pressable>
                  )}
                </>
              )}
            </Card>
          </View>
        )}

        {tab === "account" && (
          <View style={[styles.layout, compactLayout && styles.stackedLayout]}>
            <Card style={[styles.mainCard, compactLayout && styles.fluidCard]}>
              <Eyebrow>Account & access</Eyebrow>
              <Text style={styles.title}>{firstName ? `${firstName}, your profile` : "Your profile and feedback choices"}</Text>
              <Text style={styles.titleSupport}>Keep your details current so the app can speak to you personally and help you draw near to God.</Text>
              <View style={styles.accountSection}>
                <Text style={styles.sectionTitle}>Sign in</Text>
                {isAuthenticated ? (
                  <>
                    <View style={styles.signedInBadgeRow}>
                      <View style={styles.signedInBadge}>
                        <Ionicons name={profile?.authProvider === "google" ? "logo-google" : profile?.authProvider === "apple" ? "logo-apple" : "checkmark-circle-outline"} size={16} color={colors.oliveDark} />
                        <Text style={styles.signedInBadgeText}>{`Signed in with ${accountProviderLabel}`}</Text>
                      </View>
                    </View>
                    <Text style={styles.helpIntro}>{`${accountIdentityLabel}. New studies, drafts, and check-ins can follow this account across devices.`}</Text>
                    <AppButton label="Sign out" onPress={submitSignOut} />
                  </>
                ) : (
                  <>
                    <Text style={styles.helpIntro}>Create an account to carry your study journal between phone, web, and desktop. Adding your name helps the app feel more personal as you draw near to God.</Text>
                    <View style={styles.freeAccountBox}>
                      <View style={styles.feedbackHeader}>
                        <Ionicons name="gift-outline" size={18} color={colors.coral} />
                        <Text style={styles.feedbackTitle}>Why create a free account?</Text>
                      </View>
                      {[
                        "Keep your studies, journal, highlights, memory verses, and reading progress connected to you.",
                        "Move between phone, desktop, and web without starting again.",
                        "Keep the app personal, with encouragement using your name."
                      ].map((benefit) => (
                        <View key={benefit} style={styles.freeAccountBenefitRow}>
                          <Ionicons name="checkmark-circle-outline" size={16} color={colors.oliveDark} />
                          <Text style={styles.freeAccountBenefitText}>{benefit}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.authFlowRow}>
                      <Pressable onPress={() => setAuthFlow("signIn")} style={[styles.authFlowButton, authFlow === "signIn" && styles.activeAuthFlowButton]}>
                        <Text style={[styles.authFlowText, authFlow === "signIn" && styles.activeAuthFlowText]}>Sign in</Text>
                      </Pressable>
                      <Pressable onPress={() => setAuthFlow("signUp")} style={[styles.authFlowButton, authFlow === "signUp" && styles.activeAuthFlowButton]}>
                        <Text style={[styles.authFlowText, authFlow === "signUp" && styles.activeAuthFlowText]}>Create account</Text>
                      </Pressable>
                    </View>
                    {authFlow === "signUp" && (
                      <TextInput
                        value={authName}
                        onChangeText={setAuthName}
                        autoCapitalize="words"
                        placeholder="Your name"
                        style={styles.input}
                      />
                    )}
                    <TextInput
                      value={authEmail}
                      onChangeText={setAuthEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholder="Email"
                      style={styles.input}
                    />
                    <TextInput
                      value={authPassword}
                      onChangeText={setAuthPassword}
                      autoCapitalize="none"
                      secureTextEntry
                      placeholder="Password"
                      style={styles.input}
                    />
                    <AppButton label={authFlow === "signIn" ? "Sign in" : "Create account"} onPress={submitAuth} />
                  </>
                )}
                {!!authStatus && <Text style={styles.saveStatus}>{authStatus}</Text>}
              </View>
              <View style={styles.accountSection}>
                <Text style={styles.sectionTitle}>Personal details</Text>
                <Text style={styles.helpIntro}>This is how the app refers to you in encouraging prompts, account details, and community spaces.</Text>
                <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Display name" style={styles.input} />
                {isAuthenticated && (
                  <TextInput
                    value={accountEmail}
                    onChangeText={setAccountEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="Email"
                    style={styles.input}
                  />
                )}
                <AppButton label={isAuthenticated ? "Save details" : "Save name"} onPress={persistAccountSettings} />
                {!!accountStatus && <Text style={styles.saveStatus}>{accountStatus}</Text>}
              </View>
              {isAuthenticated && profile?.authProvider === "password" && (
                <View style={styles.accountSection}>
                  <Text style={styles.sectionTitle}>Change password</Text>
                  <Text style={styles.helpIntro}>Use this if you signed in with email and password.</Text>
                  <TextInput
                    value={currentAccountPassword}
                    onChangeText={setCurrentAccountPassword}
                    autoCapitalize="none"
                    secureTextEntry
                    placeholder="Current password"
                    style={styles.input}
                  />
                  <TextInput
                    value={newAccountPassword}
                    onChangeText={setNewAccountPassword}
                    autoCapitalize="none"
                    secureTextEntry
                    placeholder="New password"
                    style={styles.input}
                  />
                  <AppButton label="Update password" onPress={submitPasswordChange} />
                  {!!passwordStatus && <Text style={styles.saveStatus}>{passwordStatus}</Text>}
                </View>
              )}
              <View style={styles.accountSection}>
                <Text style={styles.sectionTitle}>Feedback access</Text>
                <Text style={styles.helpIntro}>Current: {aiAccessChoice === "free" ? "Free local coaching" : aiAccessChoice === "own-key" ? "Use my own AI key" : "Premium subscription"}</Text>
                <View style={styles.accountOptionGrid}>
                  <Pressable onPress={() => chooseAiAccess("free")} style={[styles.aiOptionCard, styles.accountOptionCard, aiAccessChoice === "free" && styles.activeAiOptionCard]}>
                    <Ionicons name="leaf-outline" size={20} color={colors.oliveDark} />
                    <View style={styles.aiOptionCopy}>
                      <Text style={styles.aiOptionTitle}>Free</Text>
                      <Text style={styles.aiOptionText}>Built-in coaching. No AI usage or payment.</Text>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => chooseAiAccess("own-key")} style={[styles.aiOptionCard, styles.accountOptionCard, aiAccessChoice === "own-key" && styles.activeAiOptionCard]}>
                    <Ionicons name="key-outline" size={20} color={colors.oliveDark} />
                    <View style={styles.aiOptionCopy}>
                      <Text style={styles.aiOptionTitle}>Own key</Text>
                      <Text style={styles.aiOptionText}>Planned. User pays the AI provider directly.</Text>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => chooseAiAccess("premium")} style={[styles.aiOptionCard, styles.accountOptionCard, aiAccessChoice === "premium" && styles.activeAiOptionCard]}>
                    <Ionicons name="card-outline" size={20} color={colors.oliveDark} />
                    <View style={styles.aiOptionCopy}>
                      <Text style={styles.aiOptionTitle}>Premium</Text>
                      <Text style={styles.aiOptionText}>Planned. Subscription with clear monthly limits.</Text>
                    </View>
                  </Pressable>
                </View>
              </View>
              <View style={styles.accountSection}>
                <Text style={styles.sectionTitle}>Bible translations</Text>
                <Text style={styles.helpIntro}>{`Current: ${BIBLE_TRANSLATIONS.find((translation) => translation.id === bibleTranslation)?.name || bibleTranslation.toUpperCase()}`}</Text>
                <View style={styles.accountOptionGrid}>
                  {BIBLE_TRANSLATIONS.map((translation) => (
                    <Pressable
                      key={translation.id}
                      onPress={() => {
                        setBibleTranslation(translation.id);
                        saveStoredBibleTranslation(translation.id).catch(() => undefined);
                      }}
                      style={[styles.aiOptionCard, styles.accountOptionCard, bibleTranslation === translation.id && styles.activeAiOptionCard]}
                    >
                      <Ionicons name={bibleTranslation === translation.id ? "checkmark-circle" : "book-outline"} size={20} color={colors.oliveDark} />
                      <View style={styles.aiOptionCopy}>
                        <Text style={styles.aiOptionTitle}>{translation.label}</Text>
                        <Text style={styles.aiOptionText}>{translation.name}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.translationLockedBox}>
                  <View style={styles.feedbackHeader}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.coral} />
                    <Text style={styles.feedbackTitle}>Premium translations later</Text>
                  </View>
                  <Text style={styles.helpIntro}>Modern paid translations need publisher licensing and app-store purchase setup before they can be sold here.</Text>
                  <View style={styles.lockedTranslationRow}>
                    {PREMIUM_TRANSLATION_PLACEHOLDERS.map((translation) => (
                      <View key={translation} style={styles.lockedTranslationPill}>
                        <Text style={styles.lockedTranslationText}>{translation}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.accountSection}>
                <Text style={styles.sectionTitle}>Legal</Text>
                <Text style={styles.helpIntro}>Privacy and terms for Bible Study Tutor. These explain how the app stores data, supports accounts, and sets expectations for safe use.</Text>
                <LegalDocument
                  title="Privacy Policy"
                  icon="shield-checkmark-outline"
                  open={openLegalSection === "privacy"}
                  sections={PRIVACY_POLICY_SECTIONS}
                  onToggle={() => setOpenLegalSection((current) => (current === "privacy" ? "" : "privacy"))}
                />
                <LegalDocument
                  title="Terms of Service"
                  icon="document-text-outline"
                  open={openLegalSection === "terms"}
                  sections={TERMS_OF_SERVICE_SECTIONS}
                  onToggle={() => setOpenLegalSection((current) => (current === "terms" ? "" : "terms"))}
                />
              </View>
              <View style={styles.accountSection}>
                <Text style={styles.sectionTitle}>Account deletion</Text>
                <Text style={styles.helpIntro}>
                  You can request deletion of your saved app data. For safety, requests are reviewed by an administrator before anything is removed.
                </Text>
                {accountDeletionRequest ? (
                  <View style={styles.deletionRequestBox}>
                    <View style={styles.feedbackHeader}>
                      <Ionicons name="time-outline" size={18} color={colors.coral} />
                      <Text style={styles.feedbackTitle}>Deletion request pending</Text>
                    </View>
                    <Text style={styles.helpIntro}>{`Requested ${formatAdminDate(accountDeletionRequest.requestedAt)}. You can cancel this request before it is approved.`}</Text>
                    <AppButton label="Cancel request" variant="secondary" onPress={cancelOwnAccountDeletionRequest} />
                  </View>
                ) : (
                  <View style={styles.deletionRequestBox}>
                    <View style={styles.feedbackHeader}>
                      <Ionicons name="warning-outline" size={18} color={colors.coral} />
                      <Text style={styles.feedbackTitle}>Before requesting deletion</Text>
                    </View>
                    <Text style={styles.helpIntro}>Approved deletion removes your profile, studies, drafts, check-ins, memory verses, feedback, usage events, and sign-in records where connected.</Text>
                    <AppButton
                      label={deletionConfirmArmed ? "Request deletion" : "Request account deletion"}
                      variant="secondary"
                      onPress={submitAccountDeletionRequest}
                    />
                  </View>
                )}
                {!!deletionStatus && <Text style={styles.saveStatus}>{deletionStatus}</Text>}
              </View>
            </Card>
            <Card style={[styles.coachCard, compactLayout && styles.fluidCard]}>
              <View style={styles.accountStatusBox}>
                <View style={styles.feedbackHeader}>
                  <Ionicons name="cloud-done-outline" size={18} color={colors.coral} />
                  <Text style={styles.feedbackTitle}>Save status</Text>
                </View>
                <Text style={styles.communityTitle}>{backendStatusLabel}</Text>
                <Text style={styles.helpIntro}>{backendStatusDetail}</Text>
              </View>
              {adminStats && (
                <View style={styles.accountStatusBox}>
                  <View style={styles.feedbackHeader}>
                    <Ionicons name="analytics-outline" size={18} color={colors.coral} />
                    <Text style={styles.feedbackTitle}>Admin insights</Text>
                  </View>
                  <View style={styles.adminMetricGrid}>
                    <Metric value={adminStats.totals.activeProfiles7d} label="active 7d" compact />
                    <Metric value={adminStats.totals.signedInProfiles} label="signed-in" compact />
                    <Metric value={adminStats.totals.profilesWithStudies} label="with studies" compact />
                    <Metric value={adminStats.totals.newFeedback} label="new feedback" compact />
                    <Metric value={adminStats.totals.pendingDeletionRequests} label="deletion requests" compact />
                  </View>
                  <Text style={styles.helpIntro}>
                    Raw profiles: {adminStats.totals.profiles} total · {adminStats.totals.localProfiles} local/test · {adminStats.totals.events} recent events tracked.
                  </Text>
                  <ResumeButton label="Open full insights" icon="analytics-outline" onPress={() => setTab("admin")} />
                </View>
              )}
              <View style={styles.accountStatusBox}>
                <View style={styles.feedbackHeader}>
                  <Ionicons name={profile?.authProvider === "google" ? "logo-google" : profile?.authProvider === "apple" ? "logo-apple" : "person-circle-outline"} size={18} color={colors.coral} />
                  <Text style={styles.feedbackTitle}>Account status</Text>
                </View>
                <Text style={styles.communityTitle}>{isAuthenticated ? `Signed in with ${accountProviderLabel}` : "Local profile"}</Text>
                <Text style={styles.helpIntro}>
                  {isAuthenticated
                    ? `${accountIdentityLabel} is connected for cross-device sync.`
                    : "Your journal is connected to this device profile until you sign in."}
                </Text>
              </View>
              <View style={styles.accountStatusBox}>
                <View style={styles.feedbackHeader}>
                  <Ionicons name="people-outline" size={18} color={colors.coral} />
                  <Text style={styles.feedbackTitle}>Community settings</Text>
                </View>
                <Text style={styles.communityTitle}>Check-ins live in Community</Text>
                <Text style={styles.helpIntro}>Set your weekly goal and check-in person or group from the Community tab.</Text>
                <ResumeButton label="Open community" icon="people-outline" onPress={() => setTab("accountability")} />
              </View>
              <View style={styles.accountStatusBox}>
                <View style={styles.feedbackHeader}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.coral} />
                  <Text style={styles.feedbackTitle}>Privacy</Text>
                </View>
                <Text style={styles.helpIntro}>Free coaching stays local. Future AI options should always make cost, storage, and usage limits clear before deeper feedback is enabled.</Text>
              </View>
              <View style={styles.accountStatusBox}>
                <View style={styles.feedbackHeader}>
                  <Ionicons name="card-outline" size={18} color={colors.coral} />
                  <Text style={styles.feedbackTitle}>Subscription</Text>
                </View>
                <Text style={styles.communityTitle}>Not active</Text>
                <Text style={styles.helpIntro}>Premium is a placeholder until payment and usage-limit systems are wired in.</Text>
              </View>
            </Card>
          </View>
        )}

        {tab === "admin" && (
          adminStats ? (
            <View>
              <Eyebrow>Administrator</Eyebrow>
              <Text style={styles.title}>Admin insights</Text>
              <Text style={styles.titleSupport}>A fuller view of genuine app activity, feedback, and the passages people are returning to.</Text>

              <View style={[styles.adminDashboardGrid, phoneLayout && styles.phoneAdminDashboardGrid]}>
                <Metric value={adminStats.totals.activeProfiles7d} label="active 7d" compact={phoneLayout} />
                <Metric value={adminStats.totals.signedInProfiles} label="signed in" compact={phoneLayout} />
                <Metric value={adminStats.totals.profilesWithStudies} label="with studies" compact={phoneLayout} />
                <Metric value={adminStats.totals.newFeedback} label="new feedback" compact={phoneLayout} />
                <Metric value={adminStats.totals.pendingDeletionRequests} label="deletion requests" compact={phoneLayout} />
                <Metric value={adminStats.totals.events} label="events" compact={phoneLayout} />
                <Metric value={adminStats.totals.localProfiles} label="local/test" compact={phoneLayout} />
              </View>

              <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard]}>
                <View style={styles.feedbackHeader}>
                  <Ionicons name="trash-outline" size={18} color={colors.coral} />
                  <Text style={styles.feedbackTitle}>Account deletion requests</Text>
                </View>
                <Text style={styles.helpIntro}>Approve only after you are confident the request is genuine. Approval removes the user's app data and connected sign-in records.</Text>
                <AdminDeletionRequestList
                  requests={adminStats.deletionRequests}
                  pendingConfirmId={pendingAdminDeletionRequestId}
                  onApprove={approveAdminDeletionRequest}
                  onCancel={cancelAdminDeletionRequest}
                />
              </Card>

              <View style={[styles.adminSectionGrid, compactLayout && styles.stackedLayout, phoneLayout && styles.phoneAdminSectionGrid]}>
                <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard]}>
                  <View style={styles.feedbackHeader}>
                    <Ionicons name="people-outline" size={18} color={colors.coral} />
                    <Text style={styles.feedbackTitle}>User directory</Text>
                  </View>
                  <Text style={styles.helpIntro}>A privacy-safe list of profiles, account status, and activity counts.</Text>
                  <AdminUserDirectory
                    users={Array.isArray(adminUsers) ? adminUsers : []}
                    selectedProfileId={selectedAdminProfileId}
                    onSelect={setSelectedAdminProfileId}
                  />
                </Card>
                <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard]}>
                  <View style={styles.feedbackHeader}>
                    <Ionicons name="person-circle-outline" size={18} color={colors.coral} />
                    <Text style={styles.feedbackTitle}>User summary</Text>
                  </View>
                  <AdminUserDetail detail={adminUserDetail} />
                </Card>
              </View>

              <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard]}>
                <View style={styles.feedbackHeader}>
                  <Ionicons name="receipt-outline" size={18} color={colors.coral} />
                  <Text style={styles.feedbackTitle}>Admin audit log</Text>
                </View>
                <Text style={styles.helpIntro}>Tracks sensitive admin actions such as deletion approvals and feedback status changes.</Text>
                <AdminAuditLog entries={Array.isArray(adminAuditLog) ? adminAuditLog : []} />
              </Card>

              <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard]}>
                <View style={styles.feedbackHeader}>
                  <Ionicons name="information-circle-outline" size={18} color={colors.coral} />
                  <Text style={styles.feedbackTitle}>Profile context</Text>
                </View>
                <Text style={styles.helpIntro}>
                  Total raw profiles: {adminStats.totals.profiles}. This can include local test profiles and older device-only profiles, so active users and signed-in profiles are the better health signals.
                </Text>
              </Card>

              <AdminReachMap
                activeUsers={adminStats.totals.activeProfiles7d}
                regions={[...ADMIN_REGION_PREVIEW]}
                selectedRegion={selectedAdminRegion}
                onSelectRegion={setSelectedAdminRegion}
                phoneLayout={phoneLayout}
              />

              <View style={[styles.adminSectionGrid, compactLayout && styles.stackedLayout, phoneLayout && styles.phoneAdminSectionGrid]}>
                <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard]}>
                  <AdminCountList title="Top bookmarked verses" items={adminStats.topBookmarked} />
                </Card>
                <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard]}>
                  <AdminCountList title="Top memory verses" items={adminStats.topMemory} />
                </Card>
                <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard]}>
                  <AdminCountList title="Top study methods" items={adminStats.topMethods} />
                </Card>
                <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard]}>
                  <AdminCountList title="Bible searches" items={adminStats.topSearches} />
                </Card>
              </View>

              <View style={[styles.adminSectionGrid, compactLayout && styles.stackedLayout, phoneLayout && styles.phoneAdminSectionGrid]}>
                <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard]}>
                  <AdminCountList title="Activity breakdown" items={adminStats.eventBreakdown} />
                </Card>
                <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard]}>
                  <AdminCountList title="Feedback categories" items={adminStats.feedbackByCategory} />
                  <AdminCountList title="Feedback status" items={adminStats.feedbackByStatus} />
                </Card>
              </View>

              <View style={[styles.adminSectionGrid, compactLayout && styles.stackedLayout, phoneLayout && styles.phoneAdminSectionGrid]}>
                <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard]}>
                  <Text style={styles.lastCheckinLabel}>Latest feedback</Text>
                  <AdminFeedbackList feedback={adminStats.recentFeedback} onMarkStatus={markFeedbackStatus} />
                </Card>
                <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard]}>
                  <Text style={styles.lastCheckinLabel}>Recent activity</Text>
                  <AdminEventList events={adminStats.recentEvents} />
                </Card>
              </View>
            </View>
          ) : (
            <View>
              <Eyebrow>Administrator</Eyebrow>
              <Text style={styles.title}>Admin insights</Text>
              <Text style={styles.titleSupport}>Sign in with an administrator account to view app insights.</Text>
              <AppButton label="Open account" onPress={() => setTab("account")} />
            </View>
          )
        )}

        {tab === "journal" && (
          <View>
            <Eyebrow>Saved work</Eyebrow>
            <Text style={styles.title}>{firstName ? `${firstName}, your study journal` : "Your study journal"}</Text>
            <Text style={styles.titleSupport}>Return to what God has been teaching you through studies, highlights, reflections, and check-ins.</Text>
            <View style={[styles.journalSearchBox, phoneLayout && styles.phoneJournalSearchBox]}>
              <Ionicons name="search-outline" size={18} color={colors.coral} />
              <TextInput
                value={journalSearch}
                onChangeText={setJournalSearch}
                placeholder="Search passage, method, note, or answer"
                style={[styles.journalSearchInput, phoneLayout && styles.phoneJournalSearchInput]}
              />
              {!!journalSearch.trim() && (
                <Pressable onPress={() => setJournalSearch("")} style={styles.clearSearchButton}>
                  <Ionicons name="close-outline" size={18} color={colors.muted} />
                </Pressable>
              )}
            </View>
            <View style={[styles.journalViewRow, phoneLayout && styles.phoneJournalViewRow]}>
              <View style={styles.journalViewToggle}>
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
                    <Ionicons name={icon as any} size={15} color={journalView === key ? "white" : colors.oliveDark} />
                    <Text style={[styles.journalViewText, journalView === key && styles.activeJournalViewText]}>{label}</Text>
                  </Pressable>
                ))}
              </View>
              {!!journalDateFilterKey && (
                <Pressable onPress={() => setJournalDateFilterKey("")} style={styles.clearDateFilterButton}>
                  <Text style={styles.clearDateFilterText}>Clear date</Text>
                </Pressable>
              )}
            </View>
            <View style={[styles.filterRow, phoneLayout && styles.phoneJournalFilterRow]}>
              {[
                ["all", "All"],
                ["pinned", "Pinned"],
                ["drafts", "Drafts"],
                ["studies", "Studies"],
                ["reviews", dueStudyReviewCount > 0 ? `Reviews (${dueStudyReviewCount})` : "Reviews"],
                ["highlights", `Highlights (${totalSavedHighlightCount})`],
                ["checkins", "Check-ins"]
              ].map(([key, label]) => (
                <Pressable
                  key={key}
                  onPress={() => setJournalFilter(key as JournalFilter)}
                  style={[styles.filterChip, phoneLayout && styles.phoneJournalFilterChip, journalFilter === key && styles.activeFilterChip]}
                >
                  <Text style={[styles.filterText, phoneLayout && styles.phoneJournalFilterText, journalFilter === key && styles.activeFilterText]}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={[styles.journalGuideBox, phoneLayout && styles.phoneJournalGuideBox]}>
              <Ionicons name={journalFilter === "reviews" ? "refresh-circle-outline" : journalFilter === "highlights" ? "color-wand-outline" : journalFilter === "checkins" ? "chatbubbles-outline" : "reader-outline"} size={18} color={colors.coral} />
              <Text style={styles.journalGuideText}>{buildJournalGuideText(journalFilter, totalSavedHighlightCount)}</Text>
            </View>
            {journalView === "calendar" && (
              <JournalCalendar
                monthStart={journalCalendarMonth}
                items={journalCalendarItems}
                selectedDateKey={journalDateFilterKey}
                onSelectDate={setJournalDateFilterKey}
                onPreviousMonth={() => setJournalCalendarMonth(addMonths(journalCalendarMonth, -1))}
                onNextMonth={() => setJournalCalendarMonth(addMonths(journalCalendarMonth, 1))}
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
              />
            )}
            {!!journalDateFilterKey && (
              <View style={styles.dateFilterNotice}>
                <Ionicons name="calendar-outline" size={16} color={colors.coral} />
                <Text style={styles.dateFilterText}>
                  {`${formatJournalDateKey(journalDateFilterKey)} · ${selectedJournalDateEntryCount} entr${selectedJournalDateEntryCount === 1 ? "y" : "ies"}`}
                </Text>
              </View>
            )}
            {!!selectedJournalScriptureBook && selectedJournalScriptureChapter > 0 && (
              <View style={[styles.dateFilterNotice, styles.passageFilterNotice]}>
                <Ionicons name="book-outline" size={16} color={colors.coral} />
                <Text numberOfLines={1} style={[styles.dateFilterText, styles.passageFilterText]}>
                  {`${selectedJournalScriptureBook} ${selectedJournalScriptureChapter} · ${selectedJournalScriptureEntryCount} entr${selectedJournalScriptureEntryCount === 1 ? "y" : "ies"}`}
                </Text>
                <Pressable
                  onPress={() => {
                    setSelectedJournalScriptureBook("");
                    setSelectedJournalScriptureChapter(0);
                  }}
                  style={styles.clearPassageFilterInlineButton}
                >
                  <Ionicons name="close-outline" size={14} color={colors.coral} />
                  <Text style={styles.clearPassageFilterInlineText}>Clear</Text>
                </Pressable>
              </View>
            )}
            {journalFilter === "all" && dueStudyReviewCount > 0 && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setJournalFilter("reviews")}
                style={[styles.highlightLibraryPanel, phoneLayout && styles.phoneHighlightLibraryPanel]}
              >
                <View style={styles.highlightLibraryIcon}>
                  <Ionicons name="refresh-circle-outline" size={19} color={colors.coral} />
                </View>
                <View style={styles.highlightLibraryCopy}>
                  <Text style={styles.highlightLibraryTitle}>Studies ready to review</Text>
                  <Text style={styles.highlightLibraryText}>
                    {`${dueStudyReviewCount} saved stud${dueStudyReviewCount === 1 ? "y is" : "ies are"} ready for a fresh look.`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={18} color={colors.muted} />
              </Pressable>
            )}
            {journalFilter === "all" && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setJournalFilter("highlights")}
                style={[styles.highlightLibraryPanel, phoneLayout && styles.phoneHighlightLibraryPanel]}
              >
                <View style={styles.highlightLibraryIcon}>
                  <Ionicons name="color-wand-outline" size={19} color={colors.coral} />
                </View>
                <View style={styles.highlightLibraryCopy}>
                  <Text style={styles.highlightLibraryTitle}>Highlight library</Text>
                  <Text style={styles.highlightLibraryText}>
                    {totalSavedHighlightCount > 0
                      ? `${totalSavedHighlightCount} saved highlight${totalSavedHighlightCount === 1 ? "" : "s"} from your studies and drafts.`
                      : "Highlighted verses and notes will collect here once you save a study."}
                  </Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={18} color={colors.muted} />
              </Pressable>
            )}
            {!!reflectionStatus && <Text style={styles.saveStatus}>{reflectionStatus}</Text>}
            {!!journalStatus && <Text style={styles.saveStatus}>{journalStatus}</Text>}
            {showDraftsSection && (
              <View style={styles.journalSection}>
                <Text style={styles.sectionTitle}>In progress</Text>
                {visibleDrafts.map((draft: any) => {
                  const draftEntryId = `draft:${draft._id}`;
                  const expanded = isJournalEntryExpanded(draftEntryId);
                  return (
                    <Card key={draft._id} style={[styles.journalCard, phoneLayout && styles.phoneJournalCard, !expanded && styles.collapsedJournalCard]}>
                      <Pressable onPress={() => toggleJournalEntryExpanded(draftEntryId)} style={styles.journalCompactHeader}>
                        <View style={styles.journalTitleBlock}>
                          <Text style={styles.cardTitle}>{draft.passageReference || draft.passage}</Text>
                          <Text style={styles.muted}>
                            {draft.methodName} · Step {draft.stepIndex + 1} · Created {formatJournalCreatedDate(draft)}
                          </Text>
                        </View>
                        <View style={styles.journalStatusCluster}>
                          <Text style={styles.draftPill}>Draft</Text>
                          <Ionicons name={expanded ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={colors.muted} />
                        </View>
                      </Pressable>
                      {expanded && (
                        <>
                          {draft.answers
                            .filter((item: any) => item.answer.trim())
                            .slice(0, 2)
                            .map((item: any) => (
                              <View key={item.stepTitle}>
                                <Text style={styles.body}>
                                  <Text style={styles.bold}>{item.stepTitle}: </Text>
                                </Text>
                                <FormattedNoteText text={item.answer} />
                              </View>
                            ))}
                          <PassageMarkupSummary markups={draft.passageMarkups || []} />
                          <View style={[styles.journalActions, phoneLayout && styles.phoneJournalActions]}>
                            <ResumeButton label="Resume into study" onPress={() => resumeDraft(draft)} style={phoneLayout && styles.phoneJournalActionButton} labelStyle={phoneLayout && styles.phoneJournalActionText} />
                            <ResumeButton
                              label={pendingArchiveDraftId === draft._id ? "Confirm archive" : "Archive draft"}
                              icon="archive-outline"
                              onPress={() =>
                                pendingArchiveDraftId === draft._id ? deleteDraft(draft._id) : setPendingArchiveDraftId(draft._id)
                              }
                              style={phoneLayout && styles.phoneJournalActionButton}
                              labelStyle={phoneLayout && styles.phoneJournalActionText}
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
                <Text style={styles.sectionTitle}>Highlights</Text>
                <Text style={styles.sectionHelp}>Use Create reflection to turn marked verses into a key insight, prayer, and next step.</Text>
                {highlightJournalEntries.map((item) => {
                  const expanded = isJournalEntryExpanded(item.id) || activeReflectionEntryId === item.id;
                  return (
                    <Card key={item.id} style={[styles.journalCard, phoneLayout && styles.phoneJournalCard, !expanded && styles.collapsedJournalCard]}>
                      <Pressable onPress={() => toggleJournalEntryExpanded(item.id)} style={styles.journalCompactHeader}>
                        <View style={styles.journalTitleBlock}>
                          <Text style={styles.cardTitle}>{item.passage}</Text>
                          <Text style={styles.muted}>
                            {item.methodName} · Created {formatJournalCreatedDate(item)}
                          </Text>
                        </View>
                        <View style={styles.journalStatusCluster}>
                          <Text style={styles.draftPill}>{item.source === "draft" ? "Draft" : `${item.markups.length} highlight${item.markups.length === 1 ? "" : "s"}`}</Text>
                          <Ionicons name={expanded ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={colors.muted} />
                        </View>
                      </Pressable>
                      {expanded && (
                        <>
                          <PassageMarkupSummary markups={item.markups} />
                          {activeReflectionEntryId === item.id && (
                            <View style={styles.reflectionBox}>
                              <Text style={styles.lastCheckinLabel}>Create reflection</Text>
                              <TextInput
                                multiline
                                value={reflectionInsight}
                                onChangeText={setReflectionInsight}
                                placeholder="Key insight"
                                style={[styles.input, styles.reflectionInput]}
                              />
                              <TextInput
                                multiline
                                value={reflectionPrayer}
                                onChangeText={setReflectionPrayer}
                                placeholder="Prayer"
                                style={[styles.input, styles.reflectionInput]}
                              />
                              <TextInput
                                multiline
                                value={reflectionNextStep}
                                onChangeText={setReflectionNextStep}
                                placeholder="Next step"
                                style={[styles.input, styles.reflectionInput]}
                              />
                              <View style={[styles.journalActions, phoneLayout && styles.phoneJournalActions]}>
                                <AppButton label={isSavingReflection ? "Saving..." : "Save reflection"} onPress={() => saveHighlightReflection(item)} />
                                <AppButton label="Cancel" variant="secondary" onPress={() => setActiveReflectionEntryId("")} />
                              </View>
                            </View>
                          )}
                          <View style={[styles.journalActions, phoneLayout && styles.phoneJournalActions]}>
                            <ResumeButton label="Create reflection" icon="create-outline" onPress={() => startHighlightReflection(item)} style={phoneLayout && styles.phoneJournalActionButton} labelStyle={phoneLayout && styles.phoneJournalActionText} />
                            <ResumeButton
                              label="Revisit passage"
                              onPress={() => (item.source === "draft" ? resumeDraft(item.entry) : resumeSession(item.entry))}
                              style={phoneLayout && styles.phoneJournalActionButton}
                              labelStyle={phoneLayout && styles.phoneJournalActionText}
                            />
                          </View>
                        </>
                      )}
                    </Card>
                  );
                })}
              </View>
            )}
            {journalEntries.map((entry: any) => {
              const rawEntryId = String(entry._id);
              const entryId = `entry:${rawEntryId}`;
              const pinned = pinnedEntryIds.has(rawEntryId);
              const editing = editingJournalEntryId === rawEntryId;
              const expanded = isJournalEntryExpanded(entryId) || editing || activeStudyReviewId === rawEntryId || reviewScheduleStudyId === rawEntryId;
              const entryTitle = entry.passage || (isHighlightReflection(entry) ? "Highlight reflection" : `Check-in: ${entry.mood}`);
              const entryStatus = entry.answers
                ? pinned
                  ? "Pinned"
                  : entry.reviewStatus === "scheduled"
                    ? isStudyReviewDue(entry)
                      ? "Review due"
                      : "Review set"
                    : entry.reviewStatus === "reviewed"
                      ? "Reviewed"
                      : "Study"
                : isHighlightReflection(entry)
                  ? "Reflection"
                  : "Check-in";

              return (
                <Card key={entry._id} style={[styles.journalCard, phoneLayout && styles.phoneJournalCard, !expanded && styles.collapsedJournalCard]}>
                  <View style={styles.journalCompactHeader}>
                    <Pressable onPress={() => toggleJournalEntryExpanded(entryId)} style={styles.journalCompactTitleButton}>
                      <View style={styles.journalTitleBlock}>
                        <Text style={styles.cardTitle}>{entryTitle}</Text>
                        <Text style={styles.muted}>{entry.methodName ? `${entry.methodName} · Created ${formatJournalCreatedDate(entry)}` : `Created ${formatJournalCreatedDate(entry)}`}</Text>
                      </View>
                      <Ionicons name={expanded ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={colors.muted} />
                    </Pressable>
                    <View style={styles.journalStatusCluster}>
                      <Text style={[styles.draftPill, pinned && styles.pinnedJournalPill]}>{entryStatus}</Text>
                      {entry.answers && (
                        <Pressable onPress={() => togglePinnedJournalEntry(rawEntryId)} style={[styles.pinIconButton, pinned && styles.activePinIconButton]}>
                          <Ionicons name={pinned ? "bookmark" : "bookmark-outline"} size={16} color={pinned ? "white" : colors.oliveDark} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                  {expanded && (
                    <>
                      {editing ? (
                        isHighlightReflection(entry) ? (
                          <View style={styles.reflectionBox}>
                            <Text style={styles.lastCheckinLabel}>Edit reflection</Text>
                            <TextInput
                              multiline
                              value={editReflectionPassage}
                              onChangeText={setEditReflectionPassage}
                              placeholder="Passage"
                              style={[styles.input, styles.reflectionInput]}
                            />
                            <TextInput
                              multiline
                              value={editReflectionHighlights}
                              onChangeText={setEditReflectionHighlights}
                              placeholder="Highlights"
                              style={[styles.input, styles.reflectionInput]}
                            />
                            <TextInput
                              multiline
                              value={editReflectionInsight}
                              onChangeText={setEditReflectionInsight}
                              placeholder="Key insight"
                              style={[styles.input, styles.reflectionInput]}
                            />
                            <TextInput
                              multiline
                              value={editReflectionPrayer}
                              onChangeText={setEditReflectionPrayer}
                              placeholder="Prayer"
                              style={[styles.input, styles.reflectionInput]}
                            />
                            <TextInput
                              multiline
                              value={editReflectionNextStep}
                              onChangeText={setEditReflectionNextStep}
                              placeholder="Next step"
                              style={[styles.input, styles.reflectionInput]}
                            />
                          </View>
                        ) : (
                          <TextInput
                            multiline
                            value={editJournalNote}
                            onChangeText={setEditJournalNote}
                            placeholder="Edit journal note"
                            style={[styles.input, styles.textarea]}
                          />
                        )
                      ) : entry.answers ? (
                        <>
                          {entry.reviewStatus === "scheduled" && (
                            <View style={styles.studyReviewBox}>
                              <View style={styles.feedbackHeader}>
                                <Ionicons name="refresh-circle-outline" size={18} color={colors.coral} />
                                <Text style={styles.feedbackTitle}>{isStudyReviewDue(entry) ? "Ready to review" : "Review scheduled"}</Text>
                              </View>
                              <Text style={styles.body}>
                                {isStudyReviewDue(entry)
                                  ? "Revisit your notes, then add one fresh reflection."
                                  : `This study will return on ${formatReviewDate(entry.reviewAt)}.`}
                              </Text>
                              {activeStudyReviewId === rawEntryId && (
                                <View style={styles.reflectionBox}>
                                  <Text style={styles.lastCheckinLabel}>What do you notice now?</Text>
                                  <TextInput
                                    multiline
                                    value={studyReviewNote}
                                    onChangeText={setStudyReviewNote}
                                    placeholder="A fresh insight, next step, or prayer after revisiting this study"
                                    style={[styles.input, styles.reflectionInput]}
                                  />
                                  <View style={styles.journalActions}>
                                    <AppButton label="Save review" onPress={() => completeStudyReview(entry)} />
                                    <AppButton label="Cancel" variant="secondary" onPress={() => setActiveStudyReviewId("")} />
                                  </View>
                                </View>
                              )}
                              {!!studyReviewStatus && <Text style={styles.saveStatus}>{studyReviewStatus}</Text>}
                            </View>
                          )}
                          {entry.reviewStatus === "reviewed" && entry.reviewNote && (
                            <View style={styles.studyReviewBox}>
                              <Text style={styles.lastCheckinLabel}>Review reflection</Text>
                              <Text style={styles.body}>{entry.reviewNote}</Text>
                            </View>
                          )}
                          {entry.shareNote && (
                            <View style={styles.journalShareBox}>
                              <Text style={styles.lastCheckinLabel}>Share note</Text>
                              <Text style={styles.body}>{entry.shareNote}</Text>
                            </View>
                          )}
                          <PassageMarkupSummary markups={entry.passageMarkups || []} />
                          {entry.answers
                            .filter((item: any) => item.answer.trim())
                            .map((item: any) => (
                              <View key={item.stepTitle}>
                                <Text style={styles.body}>
                                  <Text style={styles.bold}>{item.stepTitle}: </Text>
                                </Text>
                                <FormattedNoteText text={item.answer} />
                              </View>
                            ))}
                          {(entry.coachingMoments || []).length > 0 && (
                            <View style={styles.journalShareBox}>
                              <Text style={styles.lastCheckinLabel}>Accepted coaching</Text>
                              {(entry.coachingMoments || []).map((item: any) => (
                                <Text key={item.stepTitle + item.nextRevision} style={styles.body}>
                                  <Text style={styles.bold}>{item.stepTitle}: </Text>
                                  {item.nextRevision}
                                </Text>
                              ))}
                            </View>
                          )}
                        </>
                      ) : isHighlightReflection(entry) ? (
                        <HighlightReflectionSummary note={entry.note || ""} />
                      ) : (
                        <Text style={styles.body}>{entry.note || "No note added."}</Text>
                      )}
                      <View style={[styles.journalActions, phoneLayout && styles.phoneJournalActions]}>
                        {editing ? (
                          <>
                            <ResumeButton label={isSavingJournalEdit ? "Saving..." : "Save changes"} icon="checkmark-circle-outline" onPress={() => saveJournalEntryEdit(entry)} style={phoneLayout && styles.phoneJournalActionButton} labelStyle={phoneLayout && styles.phoneJournalActionText} />
                            <ResumeButton label="Cancel" icon="close-outline" onPress={cancelEditJournalEntry} style={phoneLayout && styles.phoneJournalActionButton} labelStyle={phoneLayout && styles.phoneJournalActionText} />
                          </>
                        ) : (
                          <>
                            {entry.answers && <ResumeButton label="Revisit notes" onPress={() => resumeSession(entry)} style={phoneLayout && styles.phoneJournalActionButton} labelStyle={phoneLayout && styles.phoneJournalActionText} />}
                            {entry.answers && entry.reviewStatus === "scheduled" && isStudyReviewDue(entry) && (
                              <ResumeButton
                                label={activeStudyReviewId === rawEntryId ? "Hide review" : "Review now"}
                                icon="refresh-circle-outline"
                                onPress={() => {
                                  setActiveStudyReviewId(activeStudyReviewId === rawEntryId ? "" : rawEntryId);
                                  setStudyReviewNote("");
                                }}
                                style={phoneLayout && styles.phoneJournalActionButton}
                                labelStyle={phoneLayout && styles.phoneJournalActionText}
                              />
                            )}
                            {entry.answers && (
                              <ResumeButton
                                label={reviewScheduleStudyId === rawEntryId ? "Hide schedule" : "Review later"}
                                icon="calendar-outline"
                                onPress={() => setReviewScheduleStudyId(reviewScheduleStudyId === rawEntryId ? "" : rawEntryId)}
                                style={phoneLayout && styles.phoneJournalActionButton}
                                labelStyle={phoneLayout && styles.phoneJournalActionText}
                              />
                            )}
                            {!entry.answers && <ResumeButton label="Edit entry" icon="create-outline" onPress={() => startEditJournalEntry(entry)} style={phoneLayout && styles.phoneJournalActionButton} labelStyle={phoneLayout && styles.phoneJournalActionText} />}
                          </>
                        )}
                        <ResumeButton
                          label={pendingDeleteJournalEntryId === rawEntryId ? "Confirm delete" : "Delete entry"}
                          icon="trash-outline"
                          onPress={() => deleteJournalEntry(entry)}
                          style={phoneLayout && styles.phoneJournalActionButton}
                          labelStyle={phoneLayout && styles.phoneJournalActionText}
                        />
                      </View>
                      {entry.answers && reviewScheduleStudyId === rawEntryId && (
                        <View style={styles.reviewScheduleBox}>
                          <Text style={styles.lastCheckinLabel}>Bring this study back</Text>
                          <View style={styles.reviewPresetRow}>
                            {STUDY_REVIEW_OPTIONS.map((option) => (
                              <Pressable
                                key={option.id}
                                onPress={() => {
                                  scheduleStudyReview(entry._id, option.id);
                                  setReviewScheduleStudyId("");
                                }}
                                style={styles.filterChip}
                              >
                                <Text style={styles.filterText}>{option.label}</Text>
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
            {showJournalEmptyState && (
              <View style={styles.emptyJournalBox}>
                <Ionicons name={journalSearchTerm ? "search-outline" : "reader-outline"} size={24} color={colors.coral} />
                <Text style={styles.emptyJournalTitle}>{journalSearchTerm ? "No matching entries" : "No journal entries yet"}</Text>
                <Text style={styles.emptyJournalText}>
                  {journalSearchTerm
                    ? "Try a passage, method name, answer phrase, or check-in word."
                    : journalFilter === "drafts"
                      ? "Drafts appear here once you begin writing a study response."
                      : journalFilter === "highlights"
                        ? "Highlighted verses appear here after you mark up a passage and save your study."
                        : journalFilter === "checkins"
                          ? "Check-ins appear here after you save one from Community."
                          : `${friendlyName}, complete a study or save a check-in to start building your journal.`}
                </Text>
                {!journalSearchTerm && <AppButton label="Start a study" variant="secondary" onPress={() => setTab("study")} />}
              </View>
            )}
          </View>
        )}

        {tab === "help" && (
          <View style={styles.helpPage}>
            <Card style={styles.helpHeroCard}>
              <Eyebrow>Help</Eyebrow>
              <Text style={styles.title}>{firstName ? `${firstName}, start here` : "Start here"}</Text>
              <Text style={styles.titleSupport}>
                Bible Study Tutor is a free Bible study app for desktop and mobile, made to help people and churches read, study, remember, journal, share Scripture, and print worksheets for pen-and-paper study.
              </Text>
              <View style={styles.helpActionRow}>
                <AppButton label="Read the Bible" onPress={() => setTab("bible")} style={phoneLayout && styles.phoneFullWidthButton} />
                <AppButton label="Start a study" variant="secondary" onPress={() => setTab("study")} style={phoneLayout && styles.phoneFullWidthButton} />
                <AppButton label="Open journal" variant="secondary" onPress={() => setTab("journal")} style={phoneLayout && styles.phoneFullWidthButton} />
              </View>
            </Card>

            <View style={[styles.helpQuickGrid, phoneLayout && styles.phoneHelpGrid]}>
              {[
                ["1", "Choose Scripture", "Open Bible, search, or type a passage in Study.", "reader-outline"],
                ["2", "Respond honestly", "Use a method, write notes, highlight verses, and save your study.", "create-outline"],
                ["3", "Print when useful", "Create worksheets for pen-and-paper study, groups, or church handouts.", "print-outline"],
                ["4", "Return later", "Review your journal, practise memory verses, and share check-ins.", "refresh-circle-outline"]
              ].map(([number, title, body, icon]) => (
                <Card key={title} style={[styles.helpQuickCard, phoneLayout && styles.phoneHelpCard]}>
                  <View style={styles.helpStepNumber}><Text style={styles.helpStepNumberText}>{number}</Text></View>
                  <Ionicons name={icon as any} size={20} color={colors.coral} />
                  <Text style={styles.helpCardTitle}>{title}</Text>
                  <Text style={styles.helpCardText}>{body}</Text>
                </Card>
              ))}
            </View>

            <View style={[styles.helpWalkthroughGrid, phoneLayout && styles.phoneHelpGrid]}>
              <HelpScreenshot
                title="Bible reader"
                caption="Tap one verse, or tap another verse to select the whole range. The action bar lets you study, note, print, save, or memorize."
                variant="bible"
              />
              <HelpScreenshot
                title="Guided study"
                caption="Follow the current step, write notes in the box, then save and continue. Focus mode hides extra panels."
                variant="study"
              />
              <HelpScreenshot
                title="Memory practice"
                caption="Save a verse to Memory, then read it, fill every second word, and finally type the full verse."
                variant="memory"
              />
              <HelpScreenshot
                title="Journal review"
                caption="Your saved studies, highlights, check-ins, and reflections collect here for later review."
                variant="journal"
              />
            </View>

            <Card style={styles.helpSectionCard}>
              <Text style={styles.sectionTitle}>Step-by-step guide</Text>
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
                      "Use testament or book filters when you want narrower results.",
                      "Tap Study to open a result in the guided study area."
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
                      "Write a response for each step.",
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
                      "Use hints when needed and set the next review date."
                    ],
                    action: "Open Memory",
                    target: "memory"
                  },
                  {
                    icon: "journal-outline",
                    title: "Review your journal",
                    steps: [
                      "Open Journal to see saved studies and check-ins.",
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
                      "Reading, studying, saving memory verses, check-ins, bookmarks, chapter reading, searches, and worksheet printing can count.",
                      "The app uses your recent activity to show a steady daily pattern, not a score to feel guilty about.",
                      "If you miss today but were active yesterday, the rhythm gives a grace day before dropping back."
                    ],
                    action: "Go Home",
                    target: "home"
                  }
                ].map((item) => (
                  <View key={item.title} style={[styles.helpGuideItem, phoneLayout && styles.phoneHelpGuideItem]}>
                    <View style={[styles.feedbackHeader, phoneLayout && styles.phoneHelpGuideHeader]}>
                      <Ionicons name={item.icon as any} size={18} color={colors.coral} />
                      <Text style={styles.helpGuideTitle}>{item.title}</Text>
                    </View>
                    <View style={styles.helpGuideStepList}>
                      {item.steps.map((stepText, index) => (
                        <View key={stepText} style={[styles.helpGuideStep, phoneLayout && styles.phoneHelpGuideStep]}>
                          <Text style={styles.helpGuideStepNumber}>{index + 1}</Text>
                          <Text style={[styles.helpGuideStepText, phoneLayout && styles.phoneHelpGuideStepText]}>{stepText}</Text>
                        </View>
                      ))}
                    </View>
                    <ResumeButton
                      label={item.action}
                      icon={item.icon}
                      onPress={() => setTab(item.target as Tab)}
                      style={phoneLayout && styles.phoneHelpGuideAction}
                      labelStyle={phoneLayout && styles.phoneHelpGuideActionText}
                    />
                  </View>
                ))}
              </View>
            </Card>

            <Card style={styles.helpSectionCard}>
              <Text style={styles.sectionTitle}>What each tab is for</Text>
              <View style={styles.helpTabGrid}>
                {[
                  ["Home", "Your starting point and next best actions.", "home-outline"],
                  ["Bible", "Read, search, select verses, bookmark, note, print worksheets, and send to Study.", "reader-outline"],
                  ["Study", "Guided Bible study with notes, highlights, coaching, worksheets, and saving.", "book-outline"],
                  ["Methods", "Choose how you want to study a passage.", "layers-outline"],
                  ["Plans", "Follow short guided paths over several days.", "calendar-outline"],
                  ["Memory", "Practise saved verses in three simple steps.", "sparkles-outline"],
                  ["Community", "Create and save check-ins for a person or group.", "people-outline"],
                  ["Journal", "Review saved studies, drafts, highlights, and check-ins.", "journal-outline"],
                  ["Account", "Manage your name, sign-in, translation, and privacy details.", "person-circle-outline"]
                ].map(([title, body, icon]) => (
                  <View key={title} style={[styles.helpTabItem, phoneLayout && styles.phoneHelpTabItem]}>
                    <Ionicons name={icon as any} size={17} color={colors.oliveDark} />
                    <View style={styles.helpTabCopy}>
                      <Text style={styles.helpFaqQuestion}>{title}</Text>
                      <Text style={styles.helpFaqAnswer}>{body}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            <Card style={styles.helpFaqCard}>
              <Text style={styles.sectionTitle}>Common questions</Text>
              {[
                ["How do I make a note on a verse?", "In Bible, select a verse and tap Note. On mobile the note box opens in the bottom action panel."],
                ["How do I study selected verses?", "Select one or more verses in Bible, then tap Study. The app opens Study with those verses loaded."],
                ["Where do highlights go?", "Highlights stay with the saved study and can be found again from Journal."],
                ["How do I memorize a verse?", "Select verses in Bible or Study, tap Memory, then practise them from the Memory tab."],
                ["How do I print a worksheet?", "Select verses in Bible and tap Print, or open Study and tap Print worksheet. On phone, use Share, then Print or Save to Files."],
                ["How do I share an insight?", "On the final Study review screen, write or keep the shareable insight, then tap Share insight."],
                ["How does daily rhythm work?", "It is a gentle measure of regular Scripture engagement. Studies, Bible reading actions, memory practice, check-ins, bookmarks, searches, and printed worksheets can count. It also allows a grace day, so missing one day does not immediately erase the rhythm."],
                ["How do I change the Bible translation?", "Open Account, then choose BSB, WEB, or KJV under Bible translations."],
                ["How do I hide busy panels?", "Use Focus mode in Study, collapse the Bible reader panel, and use the small arrow controls on collapsible sections."],
                ["Can I use the app without signing in?", "Yes. You can use a local profile, or sign in later to carry your work between devices."]
              ].map(([question, answer]) => (
                <View key={question} style={styles.helpFaqItem}>
                  <Text style={styles.helpFaqQuestion}>{question}</Text>
                  <Text style={styles.helpFaqAnswer}>{answer}</Text>
                </View>
              ))}
            </Card>

            <Card style={styles.helpSectionCard}>
              <Text style={styles.sectionTitle}>Troubleshooting</Text>
              <View style={styles.helpTroubleList}>
                {[
                  ["The screen feels crowded", "Use Study Focus mode, collapse side panels, or open the mobile menu only when you need it."],
                  ["I cannot find a saved verse", "Open Memory, switch to Browse, then filter by book, chapter, or status."],
                  ["I saved a note but not a bookmark", "That is expected. A note-only verse shows the note icon; a bookmarked verse shows the bookmark icon."],
                  ["I want to find an older study", "Open Journal and use search, Calendar view, or Scripture view."],
                  ["I am not signed in", "You can keep using a local profile. Sign in from Account when you want account-connected saving."]
                ].map(([title, body]) => (
                  <View key={title} style={styles.helpTroubleItem}>
                    <Ionicons name="alert-circle-outline" size={17} color={colors.coral} />
                    <View style={styles.helpTabCopy}>
                      <Text style={styles.helpFaqQuestion}>{title}</Text>
                      <Text style={styles.helpFaqAnswer}>{body}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            <Card style={styles.helpSectionCard}>
              <Text style={styles.sectionTitle}>Send feedback</Text>
              <Text style={styles.helpCardText}>
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
                    style={[styles.feedbackCategoryChip, feedbackCategory === key && styles.activeFeedbackCategoryChip]}
                  >
                    <Text style={[styles.feedbackCategoryText, feedbackCategory === key && styles.activeFeedbackCategoryText]}>{label}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                multiline
                value={feedbackMessage}
                onChangeText={setFeedbackMessage}
                placeholder="What should be improved, fixed, or made clearer?"
                style={[styles.input, styles.feedbackInput]}
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
        <View style={styles.mobileReaderSelectionDock}>
          <Text numberOfLines={1} style={styles.mobileReaderSelectionText}>{readerMemoryStatus || readerStudyReference}</Text>
          <View style={styles.mobileReaderSelectionActions}>
            <Pressable onPress={openReaderChapterInStudy} style={[styles.mobileReaderSelectionButton, styles.primaryMobileReaderSelectionButton]}>
              <Ionicons name="book-outline" size={15} color="white" />
              <Text style={[styles.mobileReaderSelectionButtonText, styles.primaryMobileReaderSelectionButtonText]}>Study</Text>
            </Pressable>
            <Pressable
              onPress={() => saveBibleBookmark(selectedReaderVerses)}
              style={[styles.mobileReaderSelectionButton, currentSelectionBookmarked && styles.activeReaderBookmarkButton]}
            >
              <Ionicons name={currentSelectionBookmarked ? "bookmark" : "bookmark-outline"} size={15} color={currentSelectionBookmarked ? "white" : colors.oliveDark} />
              <Text style={[styles.mobileReaderSelectionButtonText, currentSelectionBookmarked && styles.activeReaderReadButtonText]}>Save</Text>
            </Pressable>
            <Pressable onPress={openSelectedReaderNote} style={[styles.mobileReaderSelectionButton, currentSelectionBookmark?.note?.trim() && styles.activeBookmarkNoteButton]}>
              <Ionicons name={currentSelectionBookmark?.note?.trim() ? "document-text" : "document-text-outline"} size={15} color={currentSelectionBookmark?.note?.trim() ? "white" : colors.oliveDark} />
              <Text style={[styles.mobileReaderSelectionButtonText, currentSelectionBookmark?.note?.trim() && styles.primaryMobileReaderSelectionButtonText]}>Note</Text>
            </Pressable>
            <Pressable onPress={openReaderWorksheetOptions} style={styles.mobileReaderSelectionButton}>
              <Ionicons name="print-outline" size={15} color={colors.oliveDark} />
              <Text style={styles.mobileReaderSelectionButtonText}>Print</Text>
            </Pressable>
            <Pressable onPress={saveSelectedReaderVersesToMemory} style={[styles.mobileReaderSelectionButton, styles.mobileReaderMemoryButton, selectedReaderVersesAlreadyInMemory && styles.savedMemoryButton]}>
              <Ionicons name="sparkles-outline" size={15} color="white" />
              <Text style={[styles.mobileReaderSelectionButtonText, styles.primaryMobileReaderSelectionButtonText]}>
                {selectedReaderVersesAlreadyInMemory ? "Saved" : "Memory"}
              </Text>
            </Pressable>
            <Pressable
              onPress={clearReaderSelection}
              style={styles.mobileReaderSelectionIconButton}
            >
              <Ionicons name="close-outline" size={17} color={colors.muted} />
            </Pressable>
          </View>
          {currentSelectionBookmark && activeBookmarkNoteId === currentSelectionBookmark.id && (
            <View style={styles.mobileReaderNoteEditor}>
              <TextInput
                multiline
                value={bookmarkNoteDraft}
                onChangeText={setBookmarkNoteDraft}
                placeholder="Add a note for these verses"
                style={[styles.input, styles.readerBookmarkNoteInput, styles.mobileReaderBookmarkNoteInput]}
              />
              <View style={styles.readerBookmarkNoteActions}>
                <Pressable onPress={() => saveBookmarkNote(currentSelectionBookmark.id)} style={styles.inlineReaderBookmarkButton}>
                  <Text style={styles.inlineReaderBookmarkText}>Save note</Text>
                </Pressable>
                {!!currentSelectionBookmark.note?.trim() && (
                  <Pressable onPress={() => deleteBookmarkNote(currentSelectionBookmark.id)} style={styles.clearMarkupButton}>
                    <Text style={styles.clearMarkupText}>Delete note</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => {
                    setActiveBookmarkNoteId("");
                    setBookmarkNoteDraft("");
                    dismissMobileInputFocus();
                  }}
                  style={styles.clearMarkupButton}
                >
                  <Text style={styles.clearMarkupText}>Close</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}
      {printWorksheetRequest && (
        <View style={styles.printOptionsOverlay}>
          <Pressable style={styles.printOptionsScrim} onPress={() => setPrintWorksheetRequest(null)} />
          <View style={[styles.printOptionsCard, phoneLayout && styles.phonePrintOptionsCard]}>
            <View style={styles.printOptionsHeader}>
              <View style={styles.printOptionsTitleBlock}>
                <Text style={styles.printOptionsTitle}>Print worksheet</Text>
                <Text style={styles.printOptionsSubtitle}>
                  {printWorksheetRequest.reference} · {methods.find((item) => item.id === printWorksheetMethodId)?.short || method.short} · {printWorksheetRequest.translation}
                </Text>
              </View>
              <Pressable onPress={() => setPrintWorksheetRequest(null)} style={styles.markupCloseButton}>
                <Ionicons name="close-outline" size={19} color={colors.muted} />
              </Pressable>
            </View>

            <View style={styles.printOptionGroup}>
              <Text style={styles.printOptionLabel}>Method</Text>
              <View style={styles.printOptionChipRow}>
                {methods.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => setPrintWorksheetMethodId(item.id)}
                    style={[styles.printOptionChip, printWorksheetMethodId === item.id && styles.activePrintOptionChip]}
                  >
                    <Text style={[styles.printOptionChipText, printWorksheetMethodId === item.id && styles.activePrintOptionChipText]}>{item.short}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.printOptionGroup}>
              <Text style={styles.printOptionLabel}>Writing space</Text>
              <View style={styles.printOptionChipRow}>
                {[
                  ["standard", "Standard"],
                  ["more", "More space"]
                ].map(([key, label]) => (
                  <Pressable
                    key={key}
                    onPress={() => setPrintWorksheetWritingSpace(key as WorksheetWritingSpace)}
                    style={[styles.printOptionChip, printWorksheetWritingSpace === key && styles.activePrintOptionChip]}
                  >
                    <Text style={[styles.printOptionChipText, printWorksheetWritingSpace === key && styles.activePrintOptionChipText]}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.printOptionGroup}>
              <Text style={styles.printOptionLabel}>Include</Text>
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
                      <Ionicons name={active ? "checkbox" : "square-outline"} size={19} color={active ? colors.coral : colors.muted} />
                      <Text style={styles.printOptionToggleText}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.printOptionsActions}>
              <Pressable onPress={() => setPrintWorksheetRequest(null)} style={styles.printOptionsCancelButton}>
                <Text style={styles.printOptionsCancelText}>Cancel</Text>
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

function getContextHelp(tab: Tab) {
  const help: Record<Tab, { title: string; icon: string; summary: string; tips: string[] }> = {
    home: {
      title: "Home help",
      icon: "home-outline",
      summary: "Home gathers the next useful steps so you can move into reading, study, memory, or review without hunting around.",
      tips: ["Use Today’s path when you are unsure what to do next.", "At a glance shows memory reviews and study reviews that need attention.", "Start with Read Scripture or Start a study if you are new."]
    },
    study: {
      title: "Study help",
      icon: "book-outline",
      summary: "Study walks you through one method step at a time, with passage text, notes, highlighting, memory saving, and journal saving.",
      tips: ["Type or choose a passage, then press Use.", "Select verses to highlight, note, save to Memory, or print a worksheet.", "Use Focus mode when you want fewer side panels."]
    },
    bible: {
      title: "Bible help",
      icon: "reader-outline",
      summary: "Bible lets you read by book and chapter, search Scripture, select verses, add notes, bookmark passages, and launch a study.",
      tips: ["Tap one verse, then another verse to select a range.", "Use the bottom action bar on mobile for Study, Save, Note, Print, and Memory.", "Use the reader panel to change books and chapters."]
    },
    plans: {
      title: "Plans help",
      icon: "calendar-outline",
      summary: "Plans give you short guided paths. Each day opens a passage and method, then saving the study marks that day complete.",
      tips: ["Choose a plan that matches your current season.", "Press Continue to open the next unfinished day.", "Reset a plan if you want to start it again."]
    },
    methods: {
      title: "Methods help",
      icon: "layers-outline",
      summary: "Methods explain different ways to study Scripture, from quick reflection to deeper observation and application.",
      tips: ["Use filters to narrow the method list.", "Tap the info button for details and examples.", "Press Practice to start Study with that method."]
    },
    memory: {
      title: "Memory help",
      icon: "sparkles-outline",
      summary: "Memory helps you keep saved verses through a simple three-step practice flow.",
      tips: ["Save verses from Bible or Study first.", "Step 1 is reading, Step 2 hides every second word, Step 3 hides all words.", "Use hints when a word will not come to mind."]
    },
    accountability: {
      title: "Community help",
      icon: "people-outline",
      summary: "Community helps you turn one study insight into a simple check-in message for a trusted person or group.",
      tips: ["Add a person or group in the People panel.", "Write one honest update, then copy the message.", "Save check-ins so they appear in Journal."]
    },
    journal: {
      title: "Journal help",
      icon: "journal-outline",
      summary: "Journal is where saved studies, drafts, highlights, reflections, check-ins, and reviews come back together.",
      tips: ["Use List for a simple view, Calendar for date review, and Scripture for book/chapter browsing.", "Expand an entry to read or edit it.", "Schedule reviews to bring important studies back later."]
    },
    account: {
      title: "Account help",
      icon: "person-circle-outline",
      summary: "Account manages your name, sign-in, Bible translation, privacy notes, and future access choices.",
      tips: ["Add your name so the app can speak more personally.", "Sign in if you want account-connected saving across devices.", "Choose BSB, WEB, or KJV as your preferred Bible translation."]
    },
    admin: {
      title: "Admin help",
      icon: "analytics-outline",
      summary: "Admin insights shows the fuller view of feedback, activity, popular passages, and profile health signals.",
      tips: ["Use the Account quick card for a glance.", "Open Admin when you want feedback and activity details.", "Signed-in and active profiles are more useful than raw profile count while testing."]
    },
    help: {
      title: "Help screen",
      icon: "help-circle-outline",
      summary: "This screen is the full user guide. It is designed for quick orientation before launch and for users who need a refresher.",
      tips: ["Start with the three quick steps near the top.", "Use the visual walkthroughs for the main app areas.", "Check Common questions for the most frequent actions."]
    }
  };

  return help[tab];
}

function HelpScreenshot({ title, caption, variant }: { title: string; caption: string; variant: "bible" | "study" | "memory" | "journal" }) {
  return (
    <Card style={styles.helpScreenshotCard}>
      <View style={styles.helpScreenshotHeader}>
        <Text style={styles.helpCardTitle}>{title}</Text>
        <View style={styles.helpWindowDots}>
          <View style={styles.helpWindowDot} />
          <View style={styles.helpWindowDot} />
          <View style={styles.helpWindowDot} />
        </View>
      </View>
      <View style={styles.helpScreenshotFrame}>
        {variant === "bible" && (
          <>
            <View style={styles.helpScreenshotTopBar}>
              <Text style={styles.helpScreenshotLabel}>Psalms 23</Text>
              <Text style={styles.helpScreenshotPill}>BSB</Text>
            </View>
            <View style={styles.helpVerseLine}><Text style={styles.helpVerseNumber}>1</Text><View style={styles.helpLongLine} /></View>
            <View style={[styles.helpVerseLine, styles.helpSelectedLine]}><Text style={styles.helpVerseNumber}>2</Text><View style={styles.helpShortLine} /></View>
            <View style={styles.helpDockPreview}>
              <Text style={styles.helpDockButton}>Study</Text>
              <Text style={styles.helpDockButton}>Note</Text>
              <Text style={styles.helpDockButton}>Print</Text>
              <Text style={styles.helpDockButton}>Memory</Text>
            </View>
          </>
        )}
        {variant === "study" && (
          <>
            <View style={styles.helpScreenshotTopBar}>
              <Text style={styles.helpScreenshotLabel}>Step 2 of 4</Text>
              <Text style={styles.helpScreenshotPill}>SOAP</Text>
            </View>
            <View style={styles.helpTextAreaPreview}>
              <View style={styles.helpLongLine} />
              <View style={styles.helpMediumLine} />
              <View style={styles.helpShortLine} />
            </View>
            <View style={styles.helpToolbarPreview}>
              {["B", "I", "U", "H"].map((item) => <Text key={item} style={styles.helpToolButton}>{item}</Text>)}
            </View>
          </>
        )}
        {variant === "memory" && (
          <>
            <View style={styles.helpScreenshotTopBar}>
              <Text style={styles.helpScreenshotLabel}>John 3:16</Text>
              <Text style={styles.helpScreenshotPill}>Step 2</Text>
            </View>
            <View style={styles.helpMemoryLine}>
              <View style={styles.helpBlankWord} />
              <Text style={styles.helpMemoryWord}>so</Text>
              <View style={styles.helpBlankWord} />
              <Text style={styles.helpMemoryWord}>the</Text>
            </View>
            <Text style={styles.helpDockButton}>Check answers</Text>
          </>
        )}
        {variant === "journal" && (
          <>
            <View style={styles.helpScreenshotTopBar}>
              <Text style={styles.helpScreenshotLabel}>Journal</Text>
              <Text style={styles.helpScreenshotPill}>List</Text>
            </View>
            {["Psalm 23", "James 1:5", "Check-in"].map((item) => (
              <View key={item} style={styles.helpJournalRow}>
                <Text style={styles.helpJournalTitle}>{item}</Text>
                <Ionicons name="chevron-down-outline" size={14} color={colors.muted} />
              </View>
            ))}
          </>
        )}
      </View>
      <Text style={styles.helpCardText}>{caption}</Text>
    </Card>
  );
}

function AdminCountList({ title, items }: { title: string; items: { label: string; count: number }[] }) {
  return (
    <View style={styles.adminCountList}>
      <Text style={styles.lastCheckinLabel}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.helpIntro}>No data yet.</Text>
      ) : (
        items.map((item) => (
          <View key={item.label} style={styles.adminCountRow}>
            <Text numberOfLines={1} style={styles.adminCountLabel}>{item.label}</Text>
            <Text style={styles.readerBookmarkCount}>{item.count}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function AdminReachMap({
  activeUsers,
  regions,
  selectedRegion,
  onSelectRegion,
  phoneLayout
}: {
  activeUsers: number;
  regions: AdminRegionInsight[];
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
  phoneLayout: boolean;
}) {
  const selected = regions.find((region) => region.name === selectedRegion) || regions[0];
  const isRegionTrackingReady = regions.some((region) => region.count > 0);

  return (
    <Card style={[styles.adminMapCard, phoneLayout && styles.phoneAdminDashboardCard]}>
      <View style={[styles.adminMapHeader, phoneLayout && styles.phoneAdminMapHeader]}>
        <View style={styles.adminMapTitleBlock}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="earth-outline" size={18} color={colors.coral} />
            <Text style={styles.feedbackTitle}>User reach map</Text>
          </View>
          <Text style={styles.helpIntro}>Privacy-friendly regional insights. Exact user locations are not tracked.</Text>
        </View>
        <View style={[styles.adminMapMetricPill, phoneLayout && styles.phoneAdminMapMetricPill]}>
          <Text style={styles.adminMapMetricValue}>{activeUsers}</Text>
          <Text style={styles.adminMapMetricLabel}>active 7d</Text>
        </View>
      </View>

      <View style={[styles.adminMapLayout, phoneLayout && styles.phoneAdminMapLayout]}>
        <View style={[styles.adminMapCanvas, phoneLayout && styles.phoneAdminMapCanvas]}>
          <Image source={{ uri: ADMIN_WORLD_MAP_URI }} resizeMode="contain" style={styles.adminMapImage} />
          {regions.map((region) => (
            <Pressable
              key={region.name}
              accessibilityRole="button"
              accessibilityLabel={`${region.name} region`}
              onPress={() => onSelectRegion(region.name)}
              style={[
                styles.adminMapHotspot,
                region.size === "large" ? styles.adminMapHotspotLarge : region.size === "medium" ? styles.adminMapHotspotMedium : styles.adminMapHotspotSmall,
                phoneLayout && styles.phoneAdminMapHotspot,
                { left: `${region.x}%`, top: `${region.y}%` },
                selected.name === region.name && styles.activeAdminMapHotspot
              ]}
            >
              <Text style={styles.adminMapHotspotText}>{region.count > 0 ? region.count : "•"}</Text>
            </Pressable>
          ))}
          <View style={[styles.adminMapNote, phoneLayout && styles.phoneAdminMapNote]}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.oliveDark} />
            <Text style={styles.adminMapNoteText}>Broad regions only</Text>
          </View>
        </View>

        <View style={[styles.adminMapDetailPanel, phoneLayout && styles.phoneAdminMapDetailPanel]}>
          <Text style={styles.lastCheckinLabel}>{selected.name}</Text>
          <Text style={styles.helpIntro}>
            {isRegionTrackingReady
              ? `${selected.count} active user${selected.count === 1 ? "" : "s"} in this broad region.`
              : "Regional counts are not enabled yet. This panel shows where broad, privacy-safe reach data will appear."}
          </Text>
          <View style={styles.adminMapDetailList}>
            <View style={styles.adminMapDetailRow}>
              <Text style={styles.adminMapDetailLabel}>Location detail</Text>
              <Text style={styles.adminMapDetailValue}>Country/region only</Text>
            </View>
            <View style={styles.adminMapDetailRow}>
              <Text style={styles.adminMapDetailLabel}>Exact addresses</Text>
              <Text style={styles.adminMapDetailValue}>Not collected</Text>
            </View>
            <View style={styles.adminMapDetailRow}>
              <Text style={styles.adminMapDetailLabel}>Next step</Text>
              <Text style={styles.adminMapDetailValue}>Optional region field</Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}

function AdminFeedbackList({ feedback, onMarkStatus }: { feedback: any[]; onMarkStatus: (args: { feedbackId: any; status: string }) => Promise<unknown> }) {
  if (feedback.length === 0) return <Text style={styles.helpIntro}>No feedback yet.</Text>;

  return (
    <View style={styles.adminFeedbackList}>
      {feedback.map((item: any) => (
        <View key={item._id} style={styles.adminFeedbackItem}>
          <View style={styles.journalHeader}>
            <Text style={styles.helpFaqQuestion}>{item.category}</Text>
            <Text style={styles.draftPill}>{item.status}</Text>
          </View>
          <Text style={styles.helpFaqAnswer}>{item.message}</Text>
          <Text style={styles.adminEventMeta}>{formatAdminDate(item.createdAt)}{item.tab ? ` · ${item.tab}` : ""}</Text>
          <View style={styles.feedbackCategoryRow}>
            {["reviewed", "actioned", "ignored"].map((status) => (
              <Pressable key={status} onPress={() => onMarkStatus({ feedbackId: item._id, status }).catch(() => undefined)} style={styles.feedbackCategoryChip}>
                <Text style={styles.feedbackCategoryText}>{status}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function AdminUserDirectory({ users, selectedProfileId, onSelect }: { users: any[]; selectedProfileId: any; onSelect: (profileId: any) => void }) {
  if (users.length === 0) return <Text style={styles.helpIntro}>No users found yet.</Text>;

  return (
    <View style={styles.adminFeedbackList}>
      {users.slice(0, 12).map((user) => (
        <Pressable
          key={user.profileId}
          onPress={() => onSelect(user.profileId)}
          style={[styles.adminUserRow, selectedProfileId === user.profileId && styles.activeAdminUserRow]}
        >
          <View style={styles.journalTitleBlock}>
            <Text style={styles.helpFaqQuestion}>{user.displayName || "Bible student"}</Text>
            <Text style={styles.adminEventMeta}>
              {user.email || (user.signedIn ? "Signed in" : "Local profile")} · Last active {formatAdminDate(user.lastActiveAt)}
            </Text>
          </View>
          <View style={styles.adminUserMetaPills}>
            {!!user.deletionStatus && <Text style={[styles.draftPill, styles.warningPill]}>Deletion</Text>}
            <Text style={styles.draftPill}>{user.signedIn ? "Account" : "Local"}</Text>
            <Text style={styles.readerBookmarkCount}>{user.studies}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function AdminUserDetail({ detail }: { detail: any }) {
  if (detail === undefined) return <Text style={styles.helpIntro}>Choose a user to see their summary.</Text>;
  if (!detail) return <Text style={styles.helpIntro}>Choose a user to see their summary.</Text>;

  return (
    <View style={styles.adminUserDetailBox}>
      <Text style={styles.communityTitle}>{detail.displayName || "Bible student"}</Text>
      <Text style={styles.helpIntro}>{detail.email || (detail.signedIn ? "Signed-in account" : "Local profile")}</Text>
      <View style={styles.adminMetricGrid}>
        <Metric value={detail.counts.studies} label="studies" compact />
        <Metric value={detail.counts.memoryVerses} label="memory" compact />
        <Metric value={detail.counts.checkins} label="check-ins" compact />
        <Metric value={detail.counts.feedback} label="feedback" compact />
      </View>
      <View style={styles.adminMapDetailList}>
        <View style={styles.adminMapDetailRow}>
          <Text style={styles.adminMapDetailLabel}>Created</Text>
          <Text style={styles.adminMapDetailValue}>{formatAdminDate(detail.createdAt)}</Text>
        </View>
        <View style={styles.adminMapDetailRow}>
          <Text style={styles.adminMapDetailLabel}>Last active</Text>
          <Text style={styles.adminMapDetailValue}>{formatAdminDate(detail.lastActiveAt)}</Text>
        </View>
        <View style={styles.adminMapDetailRow}>
          <Text style={styles.adminMapDetailLabel}>Active sessions</Text>
          <Text style={styles.adminMapDetailValue}>{detail.activeSessions}</Text>
        </View>
        <View style={styles.adminMapDetailRow}>
          <Text style={styles.adminMapDetailLabel}>Deletion</Text>
          <Text style={styles.adminMapDetailValue}>{detail.deletionStatus || "None"}</Text>
        </View>
      </View>
      <AdminMiniActivity title="Recent activity" items={detail.recentActivity || []} />
      <AdminMiniActivity title="Feedback history" items={detail.latestFeedback || []} />
    </View>
  );
}

function AdminMiniActivity({ title, items }: { title: string; items: any[] }) {
  return (
    <View style={styles.adminMiniActivityBox}>
      <Text style={styles.lastCheckinLabel}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.helpIntro}>No recent items.</Text>
      ) : (
        items.map((item) => (
          <View key={item._id} style={styles.adminEventItem}>
            <Text style={styles.helpFaqQuestion}>{prettyAdminEvent(item.eventType || item.category || "Activity")}</Text>
            <Text style={styles.adminEventMeta}>{formatAdminDate(item.createdAt)}{item.status ? ` · ${item.status}` : ""}{item.tab ? ` · ${item.tab}` : ""}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function AdminAuditLog({ entries }: { entries: any[] }) {
  if (entries.length === 0) return <Text style={styles.helpIntro}>No admin actions logged yet.</Text>;

  return (
    <View style={styles.adminFeedbackList}>
      {entries.map((entry) => (
        <View key={entry._id} style={styles.adminEventItem}>
          <View style={styles.journalHeader}>
            <Text style={styles.helpFaqQuestion}>{prettyAdminEvent(entry.action)}</Text>
            <Text style={styles.adminEventMeta}>{formatAdminDate(entry.createdAt)}</Text>
          </View>
          <Text style={styles.helpFaqAnswer}>{entry.details || "Admin action"}</Text>
          {!!entry.targetEmail && <Text style={styles.adminEventMeta}>{entry.targetEmail}</Text>}
        </View>
      ))}
    </View>
  );
}

function AdminDeletionRequestList({
  requests,
  pendingConfirmId,
  onApprove,
  onCancel
}: {
  requests: any[];
  pendingConfirmId: string;
  onApprove: (requestId: any) => void;
  onCancel: (requestId: any) => void;
}) {
  if (requests.length === 0) return <Text style={styles.helpIntro}>No pending deletion requests.</Text>;

  return (
    <View style={styles.adminFeedbackList}>
      {requests.map((item: any) => (
        <View key={item._id} style={styles.adminFeedbackItem}>
          <View style={styles.journalHeader}>
            <View style={styles.journalTitleBlock}>
              <Text style={styles.helpFaqQuestion}>{item.displayName || "Bible student"}</Text>
              <Text style={styles.adminEventMeta}>{item.email || "No account email"} · {formatAdminDate(item.requestedAt)}</Text>
            </View>
            <Text style={styles.draftPill}>Pending</Text>
          </View>
          {!!item.note && <Text style={styles.helpFaqAnswer}>{item.note}</Text>}
          <View style={styles.feedbackCategoryRow}>
            <Pressable onPress={() => onApprove(item._id)} style={[styles.feedbackCategoryChip, pendingConfirmId === item._id && styles.dangerActionChip]}>
              <Text style={[styles.feedbackCategoryText, pendingConfirmId === item._id && styles.dangerActionText]}>
                {pendingConfirmId === item._id ? "Confirm delete" : "Approve deletion"}
              </Text>
            </Pressable>
            <Pressable onPress={() => onCancel(item._id)} style={styles.feedbackCategoryChip}>
              <Text style={styles.feedbackCategoryText}>Cancel request</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

function AdminEventList({ events }: { events: { _id: string; eventType: string; reference?: string; methodName?: string; tab?: string; createdAt: number }[] }) {
  if (events.length === 0) return <Text style={styles.helpIntro}>No recent activity yet.</Text>;

  return (
    <View style={styles.adminFeedbackList}>
      {events.map((event) => (
        <View key={event._id} style={styles.adminEventItem}>
          <View style={styles.journalHeader}>
            <Text style={styles.helpFaqQuestion}>{prettyAdminEvent(event.eventType)}</Text>
            <Text style={styles.adminEventMeta}>{formatAdminDate(event.createdAt)}</Text>
          </View>
          <Text style={styles.helpFaqAnswer}>{event.reference || event.methodName || event.tab || "App activity"}</Text>
        </View>
      ))}
    </View>
  );
}

function prettyAdminEvent(eventType: string) {
  return eventType
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAdminDate(value?: number) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function Metric({ value, label, compact = false }: { value: number; label: string; compact?: boolean }) {
  return (
    <View style={[styles.metric, compact && styles.phoneMemoryMetric]}>
      <Text style={[styles.metricValue, compact && styles.phoneMemoryMetricValue]}>{value}</Text>
      <Text numberOfLines={1} style={[styles.muted, compact && styles.phoneMemoryMetricLabel]}>{label}</Text>
    </View>
  );
}

function ResumeButton({
  label,
  onPress,
  icon = "return-up-forward-outline",
  variant = "default",
  style,
  labelStyle
}: {
  label: string;
  onPress: () => void;
  icon?: string;
  variant?: "default" | "primary";
  style?: any;
  labelStyle?: any;
}) {
  const primary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.resumeButton, primary && styles.primaryResumeButton, pressed && styles.resumeButtonPressed, style]}
    >
      <Ionicons name={icon as any} size={17} color={primary ? "white" : colors.coral} />
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
  compact = false
}: {
  token: { index: number; answer: string };
  value: string;
  checked: boolean;
  hintsVisible: boolean;
  hintLevel: number;
  inputRef?: (input: TextInput | null) => void;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onMoreHint: () => void;
  returnKeyType?: "next" | "done";
  compact?: boolean;
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
          correct && styles.correctMemoryBlankInput,
          incorrect && styles.incorrectMemoryBlankInput
        ]}
      />
      {hintsVisible && !correct && (
        <View style={styles.memoryHintRow}>
          <Text style={styles.memoryHintText}>{memoryHintText(token.answer, hintLevel)}</Text>
          {canShowMoreHint && (
            <Pressable onPress={onMoreHint} style={styles.moreMemoryHintButton}>
              <Text style={styles.moreMemoryHintText}>Hint</Text>
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
  compact = false
}: {
  reference: string;
  status?: string;
  onInsert?: () => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.scriptureInsertBox, compact && styles.compactScriptureInsertBox]}>
      <Ionicons name="book-outline" size={17} color={colors.coral} />
      <Text style={styles.scriptureInsertText}>{status || `Add text for ${reference}`}</Text>
      <Pressable onPress={() => onInsert?.()} style={styles.scriptureInsertButton}>
        <Text style={styles.scriptureInsertButtonText}>Insert</Text>
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
  scriptureInsertStatus,
  scriptureInsertFocusKey,
  onInsertScripture,
  phoneLayout = false
}: {
  value: string;
  onChange: (value: string) => void;
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
  scriptureInsertStatus?: string;
  scriptureInsertFocusKey?: number;
  onInsertScripture?: () => void;
  phoneLayout?: boolean;
}) {
  const editorRef = useRef<any>(null);
  const editorWrapRef = useRef<any>(null);
  const nativeInputRef = useRef<any>(null);
  const editorHtmlRef = useRef<string | null>(null);
  const editorSelectionRef = useRef<any>(null);
  const nativeSelectionRef = useRef({ start: value.length, end: value.length });
  const lastNativeTextSelectionRef = useRef<{ start: number; end: number } | null>(null);
  const [scripturePopoverPosition, setScripturePopoverPosition] = useState({ left: 14, top: 70 });
  const [activeNoteFormats, setActiveNoteFormats] = useState<NoteFormatKind[]>([]);
  const [nativeSelection, setNativeSelection] = useState({ start: value.length, end: value.length });

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const editor = editorRef.current;
    if (!editor || editorHtmlRef.current === value) return;
    editor.innerHTML = value;
    editorHtmlRef.current = value;
  }, [value]);

  useEffect(() => {
    if (Platform.OS !== "web" || !scriptureInsertFocusKey) return;
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    moveCaretToEnd(editor);
  }, [scriptureInsertFocusKey]);

  const insertWritingPromptNative = (prompt: string) => {
    const nextValue = value.trim() ? `${value.trimEnd()}\n${prompt} ` : `${prompt} `;
    onChange(nextValue);
    const nextSelection = { start: nextValue.length, end: nextValue.length };
    setNativeSelection(nextSelection);
    onSelectionChange(nextSelection);
  };

  const updateNativeSelection = (selection: { start: number; end: number }) => {
    nativeSelectionRef.current = selection;
    if (selection.start !== selection.end) lastNativeTextSelectionRef.current = selection;
    setNativeSelection(selection);
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
    lastNativeTextSelectionRef.current = null;
    nativeSelectionRef.current = nextSelection;
    setNativeSelection(nextSelection);
    onSelectionChange(nextSelection);
    setTimeout(() => nativeInputRef.current?.focus?.(), 50);
  };

  if (Platform.OS !== "web") {
    return (
      <>
        <WritingPromptChips
          prompts={writingPrompts}
          customPrompts={customWritingPrompts}
          status={writingPromptStatus}
          onInsert={insertWritingPromptNative}
          onAddCustomPrompt={onAddCustomWritingPrompt}
          onRemoveCustomPrompt={onRemoveCustomWritingPrompt}
        />
        <TextInput
          ref={nativeInputRef}
          multiline
          value={value}
          onChangeText={onChange}
          selection={nativeSelection}
          onSelectionChange={(event) => updateNativeSelection(event.nativeEvent.selection)}
          placeholder={placeholder}
          style={[styles.input, styles.textarea, studyFocusMode && styles.focusTextarea]}
        />
        {!!scriptureReference && (
          <ScriptureInsertPrompt reference={scriptureReference} status={scriptureInsertStatus} onInsert={onInsertScripture} />
        )}
        <NoteFormatToolbar onFormat={formatNativeNote} activeFormats={[]} compact={phoneLayout} helpText="Select text, then apply a style. Formatting is saved with the note." />
      </>
    );
  }

  const runCommand = (command: string, commandValue?: string) => {
    const editor = editorRef.current;
    const documentRef = (globalThis as any).document;
    if (!editor) return;
    editor.focus();
    const hasSelectedText = restoreEditorSelection();
    if (command === "highlightSelection") {
      if (hasSelectedText) toggleNoteHighlight(editor);
      const nextHtml = sanitizeEditorHtml(editor.innerHTML || "");
      editorHtmlRef.current = nextHtml;
      onChange(nextHtml);
      setActiveNoteFormats(readActiveNoteFormats(editor));
      return;
    }

    if (!hasSelectedText && ["bold", "italic", "underline"].includes(command)) {
      setActiveNoteFormats(readActiveNoteFormats(editor));
      return;
    }

    documentRef?.execCommand?.(command, false, commandValue);

    const nextHtml = sanitizeEditorHtml(editor.innerHTML || "");
    editorHtmlRef.current = nextHtml;
    onChange(nextHtml);
    setActiveNoteFormats(readActiveNoteFormats(editor));
  };

  const saveEditorSelection = () => {
    const editor = editorRef.current;
    const selection = (globalThis as any).getSelection?.();
    if (!editor || !selection?.rangeCount || !selection.anchorNode || !editor.contains(selection.anchorNode)) return;
    editorSelectionRef.current = selection.getRangeAt(0).cloneRange();
  };

  const restoreEditorSelection = () => {
    const editor = editorRef.current;
    const selection = (globalThis as any).getSelection?.();
    const range = editorSelectionRef.current;
    if (!editor || !selection || !range || !editor.contains(range.commonAncestorContainer)) return false;

    selection.removeAllRanges();
    selection.addRange(range);
    return !range.collapsed;
  };

  const updateScripturePopoverPosition = () => {
    const selection = (globalThis as any).getSelection?.();
    const wrapper = editorWrapRef.current;
    const editor = editorRef.current;
    if (!selection || !selection.rangeCount || !wrapper || !editor) return;
    if (!editor.contains(selection.anchorNode)) return;

    const range = selection.getRangeAt(0).cloneRange();
    const rect = range.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    const editorRect = editor.getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.left - wrapperRect.left + 24, wrapperRect.width - 260));
    const top = Math.max(editorRect.top - wrapperRect.top + 8, rect.top - wrapperRect.top - 46);
    setScripturePopoverPosition({ left, top });
  };

  const updateActiveNoteFormats = () => {
    saveEditorSelection();
    setActiveNoteFormats(readActiveNoteFormats(editorRef.current));
  };

  const insertWritingPromptWeb = (prompt: string) => {
    const editor = editorRef.current;
    const documentRef = (globalThis as any).document;
    const selection = (globalThis as any).getSelection?.();
    if (!editor || !documentRef || !selection) return;

    editor.focus();
    restoreEditorSelection();
    const currentText = editor.textContent || "";
    const prefix = currentText.trim() ? "\n" : "";
    const textNode = documentRef.createTextNode(`${prefix}${prompt} `);
    const range = selection.rangeCount ? selection.getRangeAt(0) : documentRef.createRange();
    if (!selection.rangeCount || !editor.contains(range.commonAncestorContainer)) {
      range.selectNodeContents(editor);
      range.collapse(false);
    }
    range.deleteContents();
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    editor.normalize?.();

    const nextHtml = sanitizeEditorHtml(editor.innerHTML || "");
    editorHtmlRef.current = nextHtml;
    editorSelectionRef.current = range.cloneRange();
    onChange(nextHtml);
    setActiveNoteFormats(readActiveNoteFormats(editor));
  };

  return (
    <View ref={editorWrapRef} style={styles.studyNoteEditorWrap}>
      <WritingPromptChips
        prompts={writingPrompts}
        customPrompts={customWritingPrompts}
        status={writingPromptStatus}
        onInsert={insertWritingPromptWeb}
        onAddCustomPrompt={onAddCustomWritingPrompt}
        onRemoveCustomPrompt={onRemoveCustomWritingPrompt}
      />
      {createElement("div", {
        ref: editorRef,
        contentEditable: true,
        suppressContentEditableWarning: true,
        "aria-label": placeholder,
        "data-placeholder": placeholder,
        onInput: (event: any) => {
          const nextHtml = sanitizeEditorHtml(event.currentTarget.innerHTML || "");
          editorHtmlRef.current = nextHtml;
          onChange(nextHtml);
          updateScripturePopoverPosition();
          updateActiveNoteFormats();
        },
        onBlur: (event: any) => {
          const nextHtml = sanitizeEditorHtml(event.currentTarget.innerHTML || "");
          editorHtmlRef.current = nextHtml;
          onChange(nextHtml);
        },
          onKeyUp: updateActiveNoteFormats,
          onMouseUp: updateActiveNoteFormats,
          onPointerUp: updateActiveNoteFormats,
          onTouchEnd: updateActiveNoteFormats,
          onSelect: updateActiveNoteFormats,
          onFocus: updateActiveNoteFormats,
          style: {
          backgroundColor: "#fffaf2",
          border: `1px solid ${colors.line}`,
          borderRadius: 11,
          color: colors.ink,
          lineHeight: "22px",
          marginBottom: 14,
          minHeight: studyFocusMode ? (phoneLayout ? 220 : 260) : (phoneLayout ? 170 : 150),
          outline: "none",
          padding: phoneLayout ? "15px" : "14px",
          whiteSpace: "pre-wrap"
        }
      })}
      {!!scriptureReference &&
        createElement("div", {
          style: {
            position: "absolute",
            left: scripturePopoverPosition.left,
            top: scripturePopoverPosition.top,
            zIndex: 20
          },
          children: createElement(ScriptureInsertPrompt, {
            reference: scriptureReference,
            status: scriptureInsertStatus,
            onInsert: onInsertScripture,
            compact: true
          })
        })}
      <NoteFormatToolbar
        onFormat={(kind) => {
          if (kind === "bold") runCommand("bold");
          if (kind === "italic") runCommand("italic");
          if (kind === "underline") runCommand("underline");
          if (kind === "highlight") runCommand("highlightSelection");
          if (kind === "bullet") runCommand("insertUnorderedList");
        }}
        activeFormats={activeNoteFormats}
        compact={phoneLayout}
        helpText="Select text in the note box, then apply a style. Formatting stays inside the notes box."
      />
    </View>
  );
}

function NoteFormatToolbar({
  onFormat,
  activeFormats = [],
  helpText,
  compact = false
}: {
  onFormat: (kind: NoteFormatKind) => void;
  activeFormats?: NoteFormatKind[];
  helpText: string;
  compact?: boolean;
}) {
  const [hoveredFormat, setHoveredFormat] = useState<NoteFormatKind | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeFormatSet = new Set(activeFormats);
  const formatLabels: Record<NoteFormatKind, string> = {
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    highlight: "Highlight",
    bullet: "Bullet list"
  };

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
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

  return (
    <View style={[styles.noteFormatToolbar, compact && styles.compactNoteFormatToolbar]}>
      <View style={styles.noteFormatButtonRow}>
      <Pressable {...pressProps("bold")} style={[styles.noteFormatButton, compact && styles.compactNoteFormatButton, activeFormatSet.has("bold") && styles.activeNoteFormatButton]}>
        <Text style={[styles.noteFormatText, styles.noteFormatBold, activeFormatSet.has("bold") && styles.activeNoteFormatText]}>B</Text>
      </Pressable>
      <Pressable {...pressProps("italic")} style={[styles.noteFormatButton, compact && styles.compactNoteFormatButton, activeFormatSet.has("italic") && styles.activeNoteFormatButton]}>
        <Text style={[styles.noteFormatText, styles.noteFormatItalic, activeFormatSet.has("italic") && styles.activeNoteFormatText]}>I</Text>
      </Pressable>
      <Pressable {...pressProps("underline")} style={[styles.noteFormatButton, compact && styles.compactNoteFormatButton, activeFormatSet.has("underline") && styles.activeNoteFormatButton]}>
        <Text style={[styles.noteFormatText, styles.noteFormatUnderline, activeFormatSet.has("underline") && styles.activeNoteFormatText]}>U</Text>
      </Pressable>
      <Pressable {...pressProps("highlight")} style={[styles.noteFormatButton, compact && styles.compactNoteFormatButton, activeFormatSet.has("highlight") && styles.activeNoteFormatButton]}>
        <Text style={[styles.noteFormatText, styles.noteFormatHighlight, activeFormatSet.has("highlight") && styles.activeNoteFormatText]}>H</Text>
      </Pressable>
      <Pressable {...pressProps("bullet")} style={[styles.noteFormatButton, compact && styles.compactNoteFormatButton, activeFormatSet.has("bullet") && styles.activeNoteFormatButton]}>
        <Ionicons name="list-outline" size={17} color={activeFormatSet.has("bullet") ? "white" : colors.oliveDark} />
      </Pressable>
      </View>
      {Platform.OS === "web" && hoveredFormat && <Text style={styles.noteFormatTooltip}>{formatLabels[hoveredFormat]}</Text>}
      <Text style={[styles.noteFormatHelp, compact && styles.compactNoteFormatHelp]}>{helpText}</Text>
    </View>
  );
}

function WritingPromptChips({
  prompts,
  customPrompts = [],
  status,
  onInsert,
  onAddCustomPrompt,
  onRemoveCustomPrompt
}: {
  prompts: string[];
  customPrompts?: string[];
  status?: string;
  onInsert: (prompt: string) => void;
  onAddCustomPrompt?: (prompt: string) => boolean;
  onRemoveCustomPrompt?: (prompt: string) => void;
}) {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState("");
  const customPromptSet = new Set(customPrompts);

  if (!prompts.length && !onAddCustomPrompt) return null;

  const addPrompt = () => {
    const saved = onAddCustomPrompt?.(draftPrompt);
    if (saved) {
      setDraftPrompt("");
      setIsCustomizing(false);
    }
  };

  return (
    <View style={styles.writingPromptBox}>
      <View style={styles.writingPromptHeader}>
        <Text style={styles.writingPromptLabel}>Note starters</Text>
        {!!onAddCustomPrompt && (
          <Pressable onPress={() => setIsCustomizing((current) => !current)} style={styles.customizePromptButton}>
            <Ionicons name={isCustomizing ? "close-outline" : "create-outline"} size={14} color={colors.coral} />
            <Text style={styles.customizePromptText}>{isCustomizing ? "Close" : "Customize"}</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.writingPromptRow}>
        {prompts.map((prompt) => (
          <View key={prompt} style={styles.writingPromptChip}>
            <Pressable onPress={() => onInsert(prompt)} style={styles.writingPromptInsert}>
              <Ionicons name="add-circle-outline" size={15} color={colors.oliveDark} />
              <Text style={styles.writingPromptText}>{prompt}</Text>
            </Pressable>
            {customPromptSet.has(prompt) && !!onRemoveCustomPrompt && (
              <Pressable onPress={() => onRemoveCustomPrompt(prompt)} style={styles.removePromptButton}>
                <Ionicons name="close-outline" size={14} color={colors.oliveDark} />
              </Pressable>
            )}
          </View>
        ))}
      </View>
      {isCustomizing && (
        <View style={styles.customPromptEditor}>
          <TextInput
            value={draftPrompt}
            onChangeText={setDraftPrompt}
            placeholder="Add your own starter phrase"
            style={styles.customPromptInput}
          />
          <Pressable onPress={addPrompt} style={styles.addPromptButton}>
            <Text style={styles.addPromptText}>Add</Text>
          </Pressable>
        </View>
      )}
      {!!status && <Text style={styles.writingPromptStatus}>{status}</Text>}
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
  onToggle
}: {
  title: string;
  icon: string;
  open: boolean;
  sections: { title: string; body: string }[];
  onToggle: () => void;
}) {
  return (
    <View style={styles.legalDocBox}>
      <Pressable onPress={onToggle} style={styles.legalDocHeader}>
        <View style={styles.feedbackHeader}>
          <Ionicons name={icon as any} size={18} color={colors.coral} />
          <Text style={styles.feedbackTitle}>{title}</Text>
        </View>
        <Ionicons name={open ? "chevron-up-outline" : "chevron-down-outline"} size={17} color={colors.muted} />
      </Pressable>
      {open && (
        <View style={styles.legalDocBody}>
          <Text style={styles.legalUpdatedText}>Last updated {LEGAL_LAST_UPDATED}</Text>
          {sections.map((section) => (
            <View key={section.title} style={styles.legalDocSection}>
              <Text style={styles.legalDocSectionTitle}>{section.title}</Text>
              <Text style={styles.legalDocText}>{section.body}</Text>
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
  children
}: {
  title: string;
  icon: string;
  collapsed: boolean;
  onToggle: () => void;
  style: any;
  children: any;
}) {
  return (
    <View style={style}>
      <Pressable onPress={onToggle} style={styles.collapsiblePanelHeader}>
        <View style={[styles.feedbackHeader, styles.collapsiblePanelTitle]}>
          <Ionicons name={icon as any} size={18} color={colors.coral} />
          <Text style={styles.feedbackTitle}>{title}</Text>
        </View>
        <Ionicons name={collapsed ? "chevron-down-outline" : "chevron-up-outline"} size={17} color={colors.muted} />
      </Pressable>
      {!collapsed && children}
    </View>
  );
}

function FormattedNoteText({ text }: { text: string }) {
  if (!text.trim()) return null;
  const displayText = Platform.OS === "web" ? text : richHtmlToMarkupText(text);

  if (Platform.OS === "web" && /<\/?[a-z][\s\S]*>/i.test(displayText)) {
    return createElement("div", {
      style: {
        color: colors.ink,
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
            <Text style={[styles.body, isBullet && styles.formattedBulletText]}>{renderFormattedNoteSegments(content)}</Text>
          </View>
        );
      })}
    </View>
  );
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

function PassageMarkupSummary({ markups }: { markups: PassageMarkupRecord[] }) {
  if (!markups.length) return null;

  return (
    <View style={styles.journalShareBox}>
      <Text style={styles.lastCheckinLabel}>Highlights</Text>
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
              {!!markup.note && <Text style={styles.markupSummaryNote}>{markup.note}</Text>}
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
  onNextMonth
}: {
  monthStart: number;
  items: JournalCalendarItem[];
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}) {
  const cells = buildJournalCalendarCells(monthStart, items);

  return (
    <View style={styles.journalCalendarBox}>
      <View style={styles.journalCalendarHeader}>
        <Pressable onPress={onPreviousMonth} style={styles.calendarMonthButton}>
          <Ionicons name="chevron-back-outline" size={18} color={colors.oliveDark} />
        </Pressable>
        <Text style={styles.journalCalendarTitle}>
          {new Date(monthStart).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </Text>
        <Pressable onPress={onNextMonth} style={styles.calendarMonthButton}>
          <Ionicons name="chevron-forward-outline" size={18} color={colors.oliveDark} />
        </Pressable>
      </View>
      <View style={styles.calendarWeekdayRow}>
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <Text key={`${day}-${index}`} style={styles.calendarWeekday}>{day}</Text>
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
                !cell.inMonth && styles.inactiveCalendarDayCell,
                selected && styles.selectedCalendarDayCell,
                cell.count > 0 && !selected && styles.activeCalendarDayCell
              ]}
            >
              <Text style={[styles.calendarDayNumber, selected && styles.selectedCalendarDayNumber, !cell.inMonth && styles.inactiveCalendarDayNumber]}>
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
  onSelectChapter
}: {
  sections: { title: string; books: { book: string; chapters: { chapter: number; entryCount: number; verseCount: number }[] }[] }[];
  expandedBook: string;
  selectedBook: string;
  selectedChapter: number;
  onToggleBook: (book: string) => void;
  onSelectChapter: (book: string, chapter: number) => void;
}) {
  const activeBookSet = new Set(sections.flatMap((section) => section.books.map((item) => item.book)));

  return (
    <View style={styles.journalScriptureBox}>
      {sections.length === 0 ? (
        <View style={styles.emptyJournalScriptureBox}>
          <Ionicons name="book-outline" size={22} color={colors.coral} />
          <Text style={styles.emptyJournalTitle}>No passage entries yet</Text>
          <Text style={styles.emptyJournalText}>Saved studies, drafts, and highlights with scripture references will appear here.</Text>
        </View>
      ) : (
        sections.map((section) => (
          <View key={section.title} style={styles.journalScriptureSection}>
            <Text style={styles.readerBookSectionTitle}>{section.title}</Text>
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
                        activeBookSet.has(book) && styles.journalScriptureActiveBookChip,
                        selected && styles.activeReaderBookChip
                      ]}
                    >
                      <Text style={[styles.readerBookText, selected && styles.activeReaderBookText]}>{book}</Text>
                    </Pressable>
                    {expanded && (
                      <View style={styles.desktopReaderChapterPanel}>
                        <View style={styles.desktopReaderChapterHeader}>
                          <Text style={styles.readerBookSectionTitle}>{book}</Text>
                          <Text style={styles.readerChapterCountText}>{`${chapters.length} chapter${chapters.length === 1 ? "" : "s"}`}</Text>
                        </View>
                        <View style={styles.desktopReaderChapterGrid}>
                          {chapters.map(({ chapter, entryCount, verseCount }) => {
                            const chapterSelected = selectedBook === book && selectedChapter === chapter;
                            return (
                              <Pressable
                                key={`${book}-${chapter}`}
                                onPress={() => onSelectChapter(book, chapter)}
                                style={[styles.journalScriptureChapterSquare, chapterSelected && styles.activeMobileReaderChapterSquare]}
                              >
                                <Text style={[styles.mobileReaderChapterText, chapterSelected && styles.activeMobileReaderChapterText]}>{chapter}</Text>
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

function HighlightReflectionSummary({ note }: { note: string }) {
  const reflection = parseHighlightReflectionNote(note);
  const sections = [
    ["Key insight", reflection.keyInsight],
    ["Prayer", reflection.prayer],
    ["Next step", reflection.nextStep]
  ].filter(([, value]) => value);

  if (!reflection.passage && !reflection.highlights && sections.length === 0) {
    return <Text style={styles.body}>{note || "No note added."}</Text>;
  }

  return (
    <View style={styles.reflectionSummaryBox}>
      <View style={styles.reflectionSummaryHeader}>
        <Ionicons name="sparkles-outline" size={18} color={colors.coral} />
        <Text style={styles.lastCheckinLabel}>Reflection</Text>
      </View>
      {!!reflection.passage && (
        <View style={styles.reflectionSummarySection}>
          <Text style={styles.reflectionSummaryLabel}>Passage</Text>
          <Text style={styles.body}>{reflection.passage}</Text>
        </View>
      )}
      {!!reflection.highlights && (
        <View style={styles.reflectionSummarySection}>
          <Text style={styles.reflectionSummaryLabel}>Highlights</Text>
          <Text style={styles.body}>{reflection.highlights}</Text>
        </View>
      )}
      {sections.map(([label, value]) => (
        <View key={label} style={styles.reflectionSummarySection}>
          <Text style={styles.reflectionSummaryLabel}>{label}</Text>
          <Text style={styles.body}>{value}</Text>
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

function buildMemoryReference(verses: BibleVerse[]) {
  if (verses.length === 0) return "Selected verse";

  const first = verses[0];
  const last = verses[verses.length - 1];
  const book = normalizeBibleBookName(first.book_name);
  if (verses.length === 1 || first.verse === last.verse) return `${book} ${first.chapter}:${first.verse}`;
  return `${book} ${first.chapter}:${first.verse}-${last.verse}`;
}

function buildMemoryVerseKeySet(verses: BibleVerse[], memoryVerses: { reference?: string; verseText?: string }[]) {
  const keys = new Set<string>();

  verses.forEach((verse) => {
    const key = verseMarkupKey(verse);
    if (memoryVerses.some((memoryVerse) => memoryVerseMatchesVerse(memoryVerse, verse))) keys.add(key);
  });

  return keys;
}

function memoryVerseMatchesVerse(memoryVerse: { reference?: string; verseText?: string }, verse: BibleVerse) {
  if (memoryReferenceIncludesVerse(memoryVerse.reference || "", verse)) return true;

  const savedText = normalizeMemoryText(memoryVerse.verseText || "");
  const verseText = normalizeMemoryText(verse.text);
  return !!verseText && savedText.includes(verseText);
}

function memoryReferenceIncludesVerse(reference: string, verse: BibleVerse) {
  const match = reference.trim().match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return false;

  const [, bookName, chapterText, startVerseText, endVerseText] = match;
  const bookMatches = normalizeBibleBookName(bookName).toLowerCase() === normalizeBibleBookName(verse.book_name).toLowerCase();
  const chapterMatches = Number(chapterText) === verse.chapter;
  const startVerse = Number(startVerseText);
  const endVerse = Number(endVerseText || startVerseText);

  return bookMatches && chapterMatches && verse.verse >= startVerse && verse.verse <= endVerse;
}

function normalizeMemoryText(text: string) {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function memoryStatusLabel(verse: { status: string; practiceLevel?: number; reviewCount?: number }) {
  if (isMemoryVerseMemorized(verse)) return "Memorized";
  if (verse.status === "review" || verse.status === "memorized") return "Review soon";
  if (verse.status === "learning") return "Learning";
  return "New";
}

function memoryPracticeLabel(level: number) {
  if (level >= 3) return "fill every word";
  if (level === 2) return "fill every second word";
  return "read the full verse";
}

function memoryProgressLabel(verse: { status: string; practiceLevel?: number; reviewCount?: number }) {
  if (isMemoryVerseMemorized(verse)) return "Memorized";
  return `Step ${clampMemoryPracticeLevel(verse.practiceLevel || 1)}`;
}

function isMemoryVerseMemorized(verse: { status: string; reviewCount?: number }) {
  return verse.status === "memorized" && (verse.reviewCount || 0) >= 2;
}

function isMemoryVerseDue(verse: { nextReviewAt?: number }) {
  return !verse.nextReviewAt || verse.nextReviewAt <= Date.now();
}

function reviewPresetLabel(preset: MemoryReviewPreset) {
  return MEMORY_REVIEW_OPTIONS.find((option) => option.id === preset)?.label || "Review";
}

function memoryReviewDateLabel(nextReviewAt?: number) {
  if (!nextReviewAt || nextReviewAt <= Date.now()) return "Review: due now";
  return `Review: ${new Date(nextReviewAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function reviewPresetForDate(nextReviewAt?: number): MemoryReviewPreset {
  if (!nextReviewAt || nextReviewAt <= Date.now()) return "later-today";

  const hoursUntilReview = (nextReviewAt - Date.now()) / (1000 * 60 * 60);
  if (hoursUntilReview <= 8) return "later-today";
  if (hoursUntilReview <= 36) return "tomorrow";
  if (hoursUntilReview <= 24 * 5) return "three-days";
  if (hoursUntilReview <= 24 * 14) return "next-week";
  return "next-month";
}

function buildMemoryQueueSections(verses: any[]) {
  const byReviewTime = (a: any, b: any) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0) || (b.updatedAt || 0) - (a.updatedAt || 0);
  const byRecent = (a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0);
  const due = verses.filter((verse) => !isMemoryVerseMemorized(verse) && isMemoryVerseDue(verse)).sort(byReviewTime);
  const learning = verses.filter((verse) => !isMemoryVerseMemorized(verse) && !isMemoryVerseDue(verse)).sort(byReviewTime);
  const memorized = verses.filter(isMemoryVerseMemorized).sort(byRecent);

  return [
    { title: "Due today", description: "Start here. These are ready for review.", verses: due },
    { title: "Learning", description: "Saved for an upcoming review.", verses: learning },
    { title: "Memorized", description: "Completed verses for fresh review when you want it.", verses: memorized }
  ].filter((section) => section.verses.length > 0);
}

function buildMemoryBrowseSections(verses: any[], searchTerm: string, bookFilter: string, chapterFilter: string, statusFilter: MemoryBrowseStatusFilter) {
  const filtered = verses
    .filter((verse) => matchesMemorySearch(verse, searchTerm))
    .filter((verse) => bookFilter === "all" || parseMemoryReference(verse.reference).book === bookFilter)
    .filter((verse) => chapterFilter === "all" || memoryChapterKey(parseMemoryReference(verse.reference)) === chapterFilter)
    .filter((verse) => matchesMemoryStatusFilter(verse, statusFilter))
    .sort((a, b) => {
      const aReference = parseMemoryReference(a.reference);
      const bReference = parseMemoryReference(b.reference);
      return (
        aReference.book.localeCompare(bReference.book) ||
        aReference.chapter - bReference.chapter ||
        aReference.verse - bReference.verse ||
        (b.updatedAt || 0) - (a.updatedAt || 0)
      );
    });
  const groups = new Map<string, any[]>();

  filtered.forEach((verse) => {
    const parsed = parseMemoryReference(verse.reference);
    const key = parsed.chapter ? `${parsed.book} ${parsed.chapter}` : parsed.book;
    groups.set(key, [...(groups.get(key) || []), verse]);
  });

  return Array.from(groups.entries()).map(([title, groupedVerses]) => ({
    title,
    description: `${groupedVerses.length} saved ${groupedVerses.length === 1 ? "verse" : "verses"}`,
    verses: groupedVerses
  }));
}

function buildMemoryBookOptions(verses: any[]) {
  const counts = new Map<string, number>();
  verses.forEach((verse) => {
    const book = parseMemoryReference(verse.reference).book;
    counts.set(book, (counts.get(book) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([book, count]) => ({ book, count }))
    .sort((a, b) => a.book.localeCompare(b.book));
}

function buildMemoryChapterOptions(verses: any[], bookFilter: string) {
  const counts = new Map<string, { label: string; count: number; chapter: number; book: string }>();
  verses.forEach((verse) => {
    const parsed = parseMemoryReference(verse.reference);
    if (bookFilter !== "all" && parsed.book !== bookFilter) return;

    const key = memoryChapterKey(parsed);
    const current = counts.get(key);
    counts.set(key, {
      label: parsed.chapter ? `${parsed.book} ${parsed.chapter}` : parsed.book,
      count: (current?.count || 0) + 1,
      chapter: parsed.chapter,
      book: parsed.book
    });
  });

  return Array.from(counts.entries())
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => a.book.localeCompare(b.book) || a.chapter - b.chapter);
}

function matchesMemorySearch(verse: any, searchTerm: string) {
  if (!searchTerm) return true;

  return [verse.reference, verse.verseText, verse.translationName, memoryStatusLabel(verse)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(searchTerm);
}

function matchesMemoryStatusFilter(verse: any, statusFilter: MemoryBrowseStatusFilter) {
  if (statusFilter === "all") return true;
  if (statusFilter === "memorized") return isMemoryVerseMemorized(verse);
  if (statusFilter === "due") return !isMemoryVerseMemorized(verse) && isMemoryVerseDue(verse);
  return !isMemoryVerseMemorized(verse) && !isMemoryVerseDue(verse);
}

function parseMemoryReference(reference: string) {
  const match = reference.trim().match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?/);
  return {
    book: match ? match[1] : "Other",
    chapter: match ? Number(match[2]) : 0,
    verse: match ? Number(match[3]) : 0,
    endVerse: match?.[4] ? Number(match[4]) : 0
  };
}

function memoryChapterKey(reference: { book: string; chapter: number }) {
  return `${reference.book}:${reference.chapter || 0}`;
}

function clampMemoryPracticeLevel(level: number) {
  return Math.max(1, Math.min(3, Math.round(level || 1)));
}

function buildMemoryPracticeText(verse: { reference?: string; verseText?: string }) {
  const verseText = (verse.verseText || "").trim();
  const reference = memoryReferenceSuffix(verse.reference || "");
  return reference ? `${verseText} ${reference}`.trim() : verseText;
}

function memoryReferenceSuffix(reference: string) {
  const parsed = parseMemoryReference(reference);
  if (!parsed.chapter || !parsed.verse) return "";
  if (parsed.endVerse && parsed.endVerse !== parsed.verse) return `${parsed.book} ${parsed.chapter}:${parsed.verse}-${parsed.endVerse}`;
  return `${parsed.book} ${parsed.chapter}:${parsed.verse}`;
}

function buildMemoryPracticeTokens(text: string, level: number, stepTwoOffset: number) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => ({
      index,
      text: word,
      answer: word,
      blank: level >= 3 || (level === 2 && index % 2 === stepTwoOffset)
    }));
}

function memoryAnswerIsReference(answer: string) {
  return /^\d+:\d+(?:-\d+)?$/.test(answer.trim());
}

function formatMemoryBlankValue(answer: string, value: string) {
  const referenceMatch = answer.trim().match(/^(\d+):(\d+)(?:-(\d+))?$/);
  if (!referenceMatch) return value;

  const digits = value.replace(/\D/g, "");
  const chapter = referenceMatch[1];
  const verse = referenceMatch[2];
  const endVerse = referenceMatch[3] || "";
  const chapterLength = chapter.length;
  const verseLength = verse.length;

  if (digits.length <= chapterLength) return digits;
  const typedChapter = digits.slice(0, chapterLength);
  const typedVerse = digits.slice(chapterLength, chapterLength + verseLength);
  const typedEndVerse = endVerse ? digits.slice(chapterLength + verseLength, chapterLength + verseLength + endVerse.length) : "";

  return `${typedChapter}:${typedVerse}${typedEndVerse ? `-${typedEndVerse}` : ""}`;
}

function normalizeMemoryAnswer(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function memoryBlankWidth(answer: string, compact = false) {
  const letters = answer.replace(/[^a-z0-9]/gi, "").length;
  return Math.max(compact ? 38 : 42, Math.min(compact ? 96 : 116, letters * (compact ? 10 : 11) + 18));
}

function memoryHintText(answer: string, hintLevel = 1) {
  const cleaned = answer.replace(/[^a-z0-9]/gi, "");
  if (!cleaned) return "";
  const revealCount = memoryHintRevealCount(answer, hintLevel);
  if (revealCount >= cleaned.length) return cleaned;
  return `${cleaned.slice(0, revealCount)}${"_".repeat(Math.max(1, Math.min(8, cleaned.length - revealCount)))}`;
}

function memoryHintRevealCount(answer: string, hintLevel: number) {
  const length = answer.replace(/[^a-z0-9]/gi, "").length;
  return Math.max(1, Math.min(length, Math.round(hintLevel || 1)));
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

function bibleSearchTranslationId(translation: "KJV" | "WEB") {
  return translation === "KJV" ? "KJV" : "WEB";
}

async function fetchBibleSearchResults(searchTerm: string, translation: "KJV" | "WEB", scope: BibleSearchScope, bookFilter: string, exact: boolean): Promise<BibleSearchResult[]> {
  const params = new URLSearchParams({
    search: searchTerm,
    match_case: "false",
    match_whole: exact ? "true" : "false",
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

function buildBibleSearchQueries(query: string) {
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
  const lower = compact.toLowerCase();
  const names = Array.from(new Set([...bibleBooks, "Psalm"])).sort((a, b) => b.length - a.length);
  const matchedBook = names.find((book) => lower.startsWith(book.toLowerCase()));
  if (!matchedBook) return null;

  const bookName = normalizeBibleBookName(matchedBook);
  const bookId = BSB_BOOK_IDS[bookName];
  const rest = compact.slice(matchedBook.length).trim();
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
  const lower = normalized.toLowerCase();
  const bookNames = Array.from(new Set([...bibleBooks, "Psalm"]));
  const matchedBook =
    bookNames
      .slice()
      .sort((a, b) => b.length - a.length)
      .find((book) => lower.startsWith(book.toLowerCase())) ||
    bookNames.find((book) => book.toLowerCase().startsWith(lower.split(" ")[0]));

  if (!matchedBook) return { reference: normalized };

  const rest = normalized.slice(matchedBook.length).trim();
  const parts = rest.match(/^(\d+)?(?:\s+|:)?(\d+)?(?:-(\d+))?/);
  const chapter = parts?.[1] || "";
  const startVerse = parts?.[2] || "";
  const endVerse = parts?.[3] || "";
  const verse = startVerse ? `:${startVerse}${endVerse ? `-${endVerse}` : ""}` : "";

  return {
    reference: `${normalizeBibleBookName(matchedBook)}${chapter ? ` ${chapter}` : ""}${verse}`.trim()
  };
}

function findTypedScriptureReference(text: string) {
  const cleaned = stripNoteFormatting(text).replace(/\s+/g, " ");
  const bookPattern = Array.from(new Set([...bibleBooks, "Psalm"])).map(escapeRegExp).join("|");
  const referencePattern = new RegExp(`\\b(${bookPattern})\\s+\\d{1,3}:\\d{1,3}(?:-\\d{1,3})?\\s*$`, "i");
  const match = cleaned.match(referencePattern);
  return match?.[0] ? parsePassageQuery(match[0]).reference : "";
}

function expandScriptureReference(currentAnswer: string, reference: string, verseText: string, useRichHtml = false) {
  const verseOnly = verseText.trim().replace(/\s+/g, " ");
  const plainExpansion = `*${reference} — "${verseOnly}"* `;
  const htmlExpansion = `<em>${escapeHtml(reference)} — "${escapeHtml(verseOnly)}"</em>&nbsp;`;
  const referencePattern = new RegExp(`(${escapeRegExp(reference)})(?!\\s*[—-])`, "gi");
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

  return formats;
}

function toggleNoteHighlight(editor: any) {
  const documentRef = (globalThis as any).document;
  const selection = (globalThis as any).getSelection?.();
  if (!documentRef || !selection?.rangeCount) return;

  const range = selection.getRangeAt(0);
  if (range.collapsed || !editor?.contains?.(range.commonAncestorContainer)) return;

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
    return;
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
  } catch {
    documentRef.execCommand?.("backColor", false, "#f4dfb6");
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

function unwrapElement(element: any) {
  const parent = element?.parentNode;
  if (!parent) return;
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }
  parent.removeChild(element);
}

function buildPassageSuggestions(query: string) {
  const parsed = parsePassageQuery(query).reference;
  const trimmed = query.trim();
  const defaults = ["Psalm 23", "John 3:16-18", "Romans 8:1-4"];
  if (!trimmed) return defaults;

  const parsedParts = parsed.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
  if (parsedParts) {
    const [, book, chapter, startVerse] = parsedParts;
    const chapterNumber = Number(chapter);
    const verseNumber = Number(startVerse || 1);
    const suggestions = startVerse
      ? [
          `${book} ${chapter}:${verseNumber}`,
          `${book} ${chapter}:${verseNumber}-${verseNumber + 2}`,
          `${book} ${chapter}:${verseNumber}-${verseNumber + 4}`
        ]
      : [`${book} ${chapter}`, `${book} ${chapter}:1-4`, `${book} ${chapter}:5-8`, `${book} ${chapterNumber + 1}`];

    return Array.from(new Set(suggestions)).slice(0, 4);
  }

  const bookMatches = bibleBooks
    .filter((book) => book.toLowerCase().includes(trimmed.toLowerCase()))
    .slice(0, 4)
    .map((book) => `${book} 1`);

  return Array.from(new Set([...bookMatches, parsed])).filter(Boolean).slice(0, 4);
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
  if (filter === "checkins") return "Check-ins include community updates and saved highlight reflections.";
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
      const pinned = pinnedEntryIds.has(String(entry._id));
      return {
        id: `entry:${entry._id}`,
        title: entry.passage || (isHighlightReflection(entry) ? "Highlight reflection" : `Check-in: ${entry.mood}`),
        status: entry.answers ? (pinned ? "Pinned" : "Study") : isHighlightReflection(entry) ? "Reflection" : "Check-in",
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
      const pinned = pinnedEntryIds.has(String(entry._id));
      return {
        id: `entry:${entry._id}`,
        title: entry.passage || (isHighlightReflection(entry) ? "Highlight reflection" : `Check-in: ${entry.mood}`),
        status: entry.answers ? (pinned ? "Pinned" : "Study") : isHighlightReflection(entry) ? "Reflection" : "Check-in",
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
  const feedback: string[] = [];

  if (wordCount < 8) feedback.push("This is a start. Add one more concrete detail from the passage.");
  if (wordCount > 90) feedback.push("Strong engagement. Consider tightening this to the clearest one or two insights before moving on.");

  if (lowerStep.includes("observe") || lowerStep.includes("observation") || lowerStep.includes("mark")) {
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

function buildStudyHelpLinks(reference: string, translation: BibleTranslationId) {
  const encoded = encodeURIComponent(reference || "Psalm 23");
  const bibleHubUrl = buildBibleHubCommentaryUrl(reference);
  const helpVersion = translation.toUpperCase();
  const bibleGatewayUrl = `https://www.biblegateway.com/passage/?search=${encoded}&version=${helpVersion}`;

  return [
    {
      title: "Bible Gateway passage",
      description: "Open the passage in a familiar Bible reader.",
      icon: "reader-outline",
      url: bibleGatewayUrl
    },
    {
      title: "Matthew Henry Concise",
      description: "Public-domain devotional commentary source.",
      icon: "book-outline",
      url: "https://crosswire.org/sword/modules/ModInfo.jsp?modName=MHCC"
    },
    {
      title: "Treasury cross references",
      description: "Find related passages before application.",
      icon: "git-branch-outline",
      url: `https://www.openbible.info/labs/cross-references/?q=${encoded}`
    },
    {
      title: "Bible Hub commentaries",
      description: "Compare multiple free online commentaries.",
      icon: "albums-outline",
      url: bibleHubUrl
    },
    {
      title: "CCEL Matthew Henry",
      description: "Public-domain full commentary library.",
      icon: "library-outline",
      url: "https://www.ccel.org/ccel/henry/mhc"
    },
    {
      title: "STEP Bible",
      description: "Explore words, themes, and nearby context.",
      icon: "search-outline",
      url: `https://www.stepbible.org/?q=version=${helpVersion}|reference=${encoded}`
    }
  ];
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

function buildBibleHubCommentaryUrl(reference: string) {
  const parsed = parsePassageQuery(reference).reference.match(/^(.+?)\s+(\d+)(?::(\d+))?/);
  if (!parsed) return "https://biblehub.com/commentaries/";

  const book = parsed[1].toLowerCase().replace(/\s+/g, "_");
  const chapter = parsed[2];
  const verse = parsed[3] || "1";
  return `https://biblehub.com/commentaries/${book}/${chapter}-${verse}.htm`;
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

function buildPrintableStudyWorksheetHtml({
  reference,
  translation,
  method,
  verses,
  writingSpace = "standard",
  includeMemory = true,
  includeInsight = true
}: {
  reference: string;
  translation: string;
  method: (typeof methods)[number];
  verses: BibleVerse[];
  writingSpace?: WorksheetWritingSpace;
  includeMemory?: boolean;
  includeInsight?: boolean;
}) {
  const safeReference = escapeHtml(reference);
  const safeTranslation = escapeHtml(translation || "");
  const printableSteps = method.steps.filter((step) => step.responseType === "text");
  const methodLabel = `${method.short} Study Method`;
  const verseCount = verses.length;
  const passageClass = verseCount === 1 ? "single-passage" : verseCount > 10 ? "long-passage" : "";
  const stepLineCount = getPrintableStepLineCount(verseCount, printableSteps.length, writingSpace);
  const smallBoxHtml = [
    includeMemory ? '<div class="small-box"><h3>Memory Verse</h3><div class="line"></div><div class="line"></div></div>' : "",
    includeInsight ? '<div class="small-box"><h3>Shareable Insight</h3><div class="line"></div><div class="line"></div></div>' : ""
  ].filter(Boolean).join("");
  const passageHtml = verses
    .map((verse) => `<span class="verse"><span class="verse-number">${verse.verse}</span>${escapeHtml(verse.text)}</span>`)
    .join(" ");
  const promptHtml = printableSteps
    .map((step, index) => {
      const badge = method.short.charAt(index) || String(index + 1);
      const lines = Array.from({ length: stepLineCount }, () => '<div class="line"></div>').join("");
      return `
        <div class="prompt">
          <div class="prompt-title">
            <span class="badge">${escapeHtml(badge)}</span>
            <div><strong>${escapeHtml(step.title)}</strong><span>${escapeHtml(step.prompt || step.action)}</span></div>
          </div>
          <div class="lines">${lines}</div>
        </div>
      `;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeReference} Worksheet</title>
    <style>
      :root { --ink: #241d19; --muted: #766d63; --paper: #f8f1e6; --line: #d8c8b6; --olive: #39452e; --coral: #c96750; --soft: #fffaf2; }
      * { box-sizing: border-box; }
      body { background: var(--paper); color: var(--ink); font-family: Georgia, "Times New Roman", serif; margin: 0; padding: 28px; }
      .toolbar { align-items: center; display: flex; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; gap: 12px; justify-content: space-between; margin: 0 auto 18px; max-width: 900px; }
      .toolbar p { color: var(--muted); margin: 0; }
      .toolbar-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
      .print-shortcut { background: #fff6eb; border: 1px solid var(--line); border-radius: 999px; color: var(--olive); font-weight: 900; padding: 8px 12px; white-space: nowrap; }
      .page { background: #fffdf8; border: 1px solid rgba(108, 91, 67, 0.18); box-shadow: 0 12px 30px rgba(90, 63, 45, 0.14); margin: 0 auto; max-width: 900px; min-height: 1160px; padding: 46px; }
      .header { border-bottom: 3px double var(--line); display: grid; gap: 12px; grid-template-columns: 1fr auto; min-height: 108px; padding-bottom: 14px; }
      .title-block { display: flex; flex-direction: column; justify-content: space-between; }
      .eyebrow { color: var(--coral); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 12px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; }
      h1 { color: var(--olive); font-size: 34px; line-height: 1; margin: 6px 0 0; }
      .title-row { align-items: baseline; display: flex; flex-wrap: wrap; gap: 10px; }
      .translation-code { color: var(--coral); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 12px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; }
      .meta { color: var(--muted); display: flex; flex-direction: column; font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 13px; font-weight: 700; justify-content: space-between; line-height: 1.6; text-align: right; }
      .meta-method { color: var(--olive); display: block; font-size: 17px; font-weight: 900; line-height: 1.2; }
      .scripture { border-bottom: 1px solid var(--line); padding: 12px 0 12px; }
      .scripture h2 { color: var(--olive); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 17px; margin: 0 0 8px; }
      .passage { columns: 2; column-gap: 34px; font-size: 15.5px; line-height: 1.62; }
      .passage p { margin: 0; }
      .single-passage { columns: 1; font-size: 18px; line-height: 1.65; max-width: 720px; }
      .long-passage { font-size: 14.5px; line-height: 1.54; }
      .verse { break-inside: avoid; display: inline; }
      .verse-number { color: var(--coral); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 11px; font-weight: 900; margin-right: 4px; vertical-align: super; }
      .section { margin-top: 14px; }
      .prompt { border: 1px solid var(--line); border-radius: 10px; break-inside: avoid; break-inside: avoid-page; margin-bottom: 10px; overflow: hidden; page-break-inside: avoid; -webkit-column-break-inside: avoid; }
      .prompt-title { align-items: center; background: #fff6eb; border-bottom: 1px solid var(--line); display: flex; font-family: Inter, ui-sans-serif, system-ui, sans-serif; gap: 10px; padding: 8px 10px; }
      .badge { align-items: center; background: var(--olive); border-radius: 999px; color: white; display: inline-flex; font-size: 12px; font-weight: 900; height: 26px; justify-content: center; min-width: 26px; }
      .prompt-title strong { color: var(--ink); }
      .prompt-title span:not(.badge) { color: var(--muted); display: block; font-size: 12px; margin-top: 2px; }
      .lines { padding: 10px; }
      .line { border-bottom: 1px solid #cfc0ad; height: ${verseCount === 1 ? 28 : verseCount > 10 ? 28 : 22}px; }
      .two-column { break-inside: avoid; break-inside: avoid-page; display: grid; gap: 14px; grid-template-columns: 1fr 1fr; page-break-inside: avoid; -webkit-column-break-inside: avoid; }
      .small-box { border: 1px solid var(--line); border-radius: 10px; break-inside: avoid; break-inside: avoid-page; page-break-inside: avoid; padding: 12px; -webkit-column-break-inside: avoid; }
      .small-box h3 { color: var(--olive); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 14px; margin: 0 0 8px; }
      .footer { border-top: 1px solid var(--line); color: var(--muted); display: flex; font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 11px; justify-content: space-between; margin-top: 16px; padding-top: 10px; }
      @media (max-width: 720px) { body { padding: 12px; } .toolbar { align-items: stretch; flex-direction: column; } .page { padding: 24px 18px; } .header { grid-template-columns: 1fr; min-height: 0; } .meta { text-align: left; } .passage { columns: 1; } .footer { align-items: flex-start; flex-direction: column; } .two-column { grid-template-columns: 1fr; } }
      @media print { @page { margin: 8mm 9mm; } body { background: white; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .toolbar { display: none; } .page { border: 0; box-shadow: none; max-width: none; min-height: auto; padding: 0; } .header { min-height: 96px; padding-bottom: 12px; } h1 { font-size: 31px; } .scripture { padding: 10px 0; } .passage { font-size: 14.5px; line-height: 1.46; } .single-passage { font-size: 17px; line-height: 1.55; } .long-passage { font-size: 13.5px; line-height: 1.42; } .section { margin-top: 10px; } .prompt, .small-box, .two-column { break-inside: avoid; break-inside: avoid-page; page-break-inside: avoid; -webkit-column-break-inside: avoid; } .prompt { display: block; margin-bottom: 8px; overflow: visible; } .prompt-title, .lines { break-inside: avoid; page-break-inside: avoid; } .prompt-title { padding: 6px 9px; } .badge { height: 22px; min-width: 22px; } .lines { padding: 8px 10px; } .line { height: ${verseCount === 1 ? 24 : verseCount > 10 ? 24 : 19}px; } .small-box { display: block; padding: 9px; } .footer { margin-top: 10px; padding-top: 8px; } }
    </style>
  </head>
  <body>
    <div class="toolbar">
      <p>Printable worksheet for ${safeReference}. On desktop, use your browser’s print command. On phone or tablet, use the browser Share menu, then choose Print or Save to Files.</p>
      <div class="toolbar-actions">
        <span class="print-shortcut">Desktop: Ctrl+P or Cmd+P</span>
        <span class="print-shortcut">Phone: Share &gt; Print</span>
      </div>
    </div>
    <main class="page">
      <header class="header">
        <div class="title-block">
          <div class="eyebrow">Bible Study Tutor worksheet</div>
          <div class="title-row"><h1>${safeReference}</h1>${safeTranslation ? `<span class="translation-code">${safeTranslation}</span>` : ""}</div>
        </div>
        <div class="meta"><span class="meta-method">${escapeHtml(methodLabel)}</span><span>Date: ____________________</span></div>
      </header>
      <section class="scripture">
        <h2>Selected Scripture</h2>
        <div class="passage ${passageClass}"><p>${passageHtml}</p></div>
      </section>
      <section class="section">${promptHtml}</section>
      ${smallBoxHtml ? `<section class="section two-column">${smallBoxHtml}</section>` : ""}
      <footer class="footer"><span>Free Bible study worksheet from Bible Study Tutor</span><span>biblestudytutor.org</span></footer>
    </main>
  </body>
</html>`;
}

function getPrintableStepLineCount(verseCount: number, stepCount: number, writingSpace: WorksheetWritingSpace = "standard") {
  if (writingSpace === "more") {
    if (verseCount <= 1) return 8;
    if (verseCount <= 6) return 8;
    if (verseCount <= 12) return Math.max(8, Math.round(24 / Math.max(stepCount, 1)));
    return Math.max(9, Math.round(30 / Math.max(stepCount, 1)));
  }
  if (verseCount <= 1) return 5;
  if (verseCount <= 6) return 6;
  if (verseCount <= 12) return Math.max(6, Math.round(18 / Math.max(stepCount, 1)));
  return Math.max(7, Math.round(24 / Math.max(stepCount, 1)));
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
  checkinNote,
  shareNote,
  passageReference
}: {
  partner: string;
  senderName?: string;
  checkinNote: string;
  shareNote: string;
  passageReference: string;
}) {
  const greeting = partner.trim() ? `${partner.trim()}, here is my Bible study check-in:` : "Here is my Bible study check-in:";
  const note = checkinNote.trim() || "I studied today and want to keep the rhythm going.";
  const insight = shareNote.trim() || `${passageReference}: I spent time with this passage today.`;
  const signedBy = senderName?.trim() ? `From: ${senderName.trim()}` : "";

  return [greeting, `Note: ${note}`, `Insight: ${insight}`, signedBy].filter(Boolean).join("\n");
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
    position: "relative"
  },
  compactScreen: {
    flexDirection: "column"
  },
  mobileMenuBar: {
    alignItems: "center",
    backgroundColor: "#fff6eb",
    borderBottomColor: "rgba(108, 91, 67, 0.18)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10
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
  activeTab: {
    backgroundColor: colors.blush
  },
  tabLabel: {
    color: colors.muted,
    fontWeight: "700"
  },
  activeTabLabel: {
    color: colors.coral
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
  progressFill: {
    backgroundColor: colors.coral,
    height: "100%"
  },
  content: {
    flexGrow: 1,
    minWidth: 0,
    padding: 24
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
    gap: 18
  },
  homeLayout: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 18
  },
  homeMainCard: {
    flex: 1,
    gap: 20,
    minWidth: 0
  },
  homeHero: {
    borderBottomColor: "rgba(102, 114, 78, 0.18)",
    borderBottomWidth: 1,
    gap: 14,
    paddingBottom: 18
  },
  homeHeroTitle: {
    color: colors.ink,
    fontFamily: Platform.select({ ios: "Georgia", web: "Georgia", default: undefined }),
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 48
  },
  homeHeroTitleAccent: {
    color: colors.oliveDark,
    fontFamily: Platform.select({ ios: "Georgia", web: "Georgia", default: undefined }),
    fontStyle: "italic",
    fontWeight: "700"
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
  homePurposePanel: {
    backgroundColor: "#fffaf2",
    borderColor: "rgba(102, 114, 78, 0.22)",
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 14
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
  homePurposePillText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  homeActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4
  },
  homePhoneActionButton: {
    flex: 1,
    minWidth: 140
  },
  homeScriptureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  homeScriptureBlock: {
    backgroundColor: "#fffdf8",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 10,
    minWidth: 240,
    padding: 16
  },
  homeScriptureIcon: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  homeScriptureRef: {
    color: colors.coral,
    fontSize: 13,
    fontWeight: "900"
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
    width: 360
  },
  homeSideCard: {
    gap: 12
  },
  homeSideTitle: {
    color: colors.oliveDark,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 2
  },
  homePathList: {
    gap: 8
  },
  homePathItem: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 11
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
    gap: 18
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
    minWidth: 0
  },
  bibleSearchPanel: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  bibleSearchHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  bibleSearchHeaderMeta: {
    alignItems: "center",
    flexDirection: "row",
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
    gap: 8
  },
  bibleSearchInput: {
    flex: 1,
    marginBottom: 0,
    minWidth: 220
  },
  phoneBibleSearchInputRow: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 8
  },
  phoneBibleSearchInput: {
    minWidth: 0,
    width: "100%"
  },
  phoneBibleSearchButton: {
    flex: 1,
    minWidth: 0,
    width: "100%"
  },
  bibleSearchControls: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  phoneBibleSearchControls: {
    alignItems: "stretch",
    gap: 6
  },
  bibleSearchRefineRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  phoneBibleSearchRefineRow: {
    width: "100%"
  },
  bibleSearchBookFilter: {
    minWidth: 150,
    width: 170
  },
  phoneBibleSearchBookFilter: {
    flex: 1,
    minWidth: 0,
    width: "auto"
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
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  phoneBibleSearchChip: {
    height: 36,
    paddingVertical: 0
  },
  activeBibleSearchChip: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  bibleSearchChipText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
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
    gap: 8
  },
  readerHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between"
  },
  readerTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
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
    minWidth: 0
  },
  phoneReaderNavigationRow: {
    gap: 4,
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
    marginLeft: 28
  },
  phoneInlineStudyMarkupBar: {
    marginLeft: 20,
    padding: 9
  },
  inlineReaderActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
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
    lineHeight: 27
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
  suggestionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2
  },
  suggestionChip: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  suggestionText: {
    color: colors.oliveDark,
    fontWeight: "700"
  },
  presetSection: {
    borderColor: "rgba(102, 114, 78, 0.16)",
    borderTopWidth: 1,
    marginTop: 10,
    paddingTop: 10
  },
  presetLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase"
  },
  presetChip: {
    backgroundColor: "#fff6eb",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  presetText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700"
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
  noteFormatButtonRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    width: "100%"
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
  writingPromptHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8
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
  writingPromptChip: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 999,
    flexDirection: "row",
    overflow: "hidden"
  },
  writingPromptInsert: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 7
  },
  writingPromptText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  removePromptButton: {
    borderColor: "rgba(102, 114, 78, 0.18)",
    borderLeftWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8
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
  deeperFeedbackButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fffaf2",
    borderColor: "rgba(102, 114, 78, 0.24)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
    minHeight: 38,
    paddingHorizontal: 12
  },
  deeperFeedbackText: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "800"
  },
  aiOptionsBox: {
    backgroundColor: "#fffaf2",
    borderColor: "rgba(102, 114, 78, 0.18)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 12
  },
  aiOptionsTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800"
  },
  aiOptionsText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
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
  smartFeedbackBox: {
    backgroundColor: "#fffaf2",
    borderColor: "rgba(102, 114, 78, 0.18)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 12
  },
  smartFeedbackHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  acceptedPill: {
    backgroundColor: colors.oliveDark,
    borderRadius: 999,
    color: "white",
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4
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
  phoneCommunityFocusBox: {
    borderRadius: 12,
    marginBottom: 10,
    padding: 11
  },
  communityRecipientText: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26
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
  checkinTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  checkinMood: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
    textTransform: "capitalize"
  },
  sentPill: {
    backgroundColor: colors.blush,
    borderRadius: 999,
    color: colors.coral,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3
  },
  sentPillActive: {
    backgroundColor: colors.oliveDark,
    color: "white"
  },
  copySmallButton: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    minHeight: 30,
    paddingHorizontal: 9
  },
  phoneCopySmallButton: {
    minHeight: 32,
    paddingHorizontal: 8
  },
  copySmallText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
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
  phoneCommunityButtonRow: {
    flexWrap: "nowrap",
    gap: 6
  },
  phoneCommunityPrimaryButton: {
    flex: 1.3,
    minHeight: 42,
    paddingHorizontal: 8
  },
  phoneCommunitySecondaryButton: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 8
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
  shareInsightActions: {
    alignItems: "flex-start",
    marginTop: 10
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
  markupOption: {
    borderColor: "transparent",
    borderRadius: 999,
    borderWidth: 2,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 11
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
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 23,
    marginBottom: 8
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
  instructionHeaderCopy: {
    flex: 1
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
  memoryList: {
    gap: 12
  },
  memoryViewToggle: {
    backgroundColor: colors.soft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    padding: 4
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
    gap: 8
  },
  memoryHeaderBadges: {
    alignItems: "flex-end",
    gap: 6
  },
  phoneMemoryHeaderBadges: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap"
  },
  reviewDatePill: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "800",
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
  memoryStepRow: {
    backgroundColor: colors.soft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    padding: 4
  },
  phoneMemoryStepRow: {
    borderRadius: 12
  },
  memoryStepButton: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 8
  },
  activeMemoryStepButton: {
    backgroundColor: colors.oliveDark
  },
  memoryStepText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
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
    flexDirection: "column"
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
  phoneAddMemoryActions: {
    alignItems: "stretch"
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
    gap: 9,
    padding: 8
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
  helpGuideStepText: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    lineHeight: 19
  },
  phoneHelpGuideStepText: {
    lineHeight: 18
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
  phoneAdminMapCanvas: {
    minHeight: 220
  },
  adminMapImage: {
    height: "100%",
    opacity: 0.82,
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
    minWidth: 0,
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
  phoneAdminDashboardGrid: {
    gap: 6,
    justifyContent: "space-between"
  },
  adminDashboardCard: {
    flex: 1,
    gap: 10,
    marginBottom: 14,
    minWidth: 260
  },
  phoneAdminDashboardCard: {
    flexBasis: "100%",
    marginBottom: 10,
    minWidth: 0,
    width: "100%"
  },
  adminSectionGrid: {
    alignItems: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14
  },
  phoneAdminSectionGrid: {
    gap: 0,
    width: "100%"
  },
  adminMetricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
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
  adminFeedbackList: {
    gap: 10
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
  activeAdminUserRow: {
    backgroundColor: "#eef3e5",
    borderColor: colors.olive
  },
  adminUserMetaPills: {
    alignItems: "flex-end",
    flexShrink: 0,
    gap: 5
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
    padding: 10
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
  printOptionToggleText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  printOptionsActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-end"
  },
  printOptionsCancelButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 12
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
  draftPill: {
    backgroundColor: colors.blush,
    borderRadius: 999,
    color: colors.coral,
    fontSize: 12,
    fontWeight: "800",
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
