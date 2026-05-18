import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type StoredAiAccessOption = "free" | "own-key" | "premium";
export type StoredBibleTranslation = "bsb" | "web" | "kjv";
export type StoredAppTheme = "warm-study" | "cathedral-light" | "midnight-lectio" | "olive-grove" | "modern-chapel";
export type StoredBibleReaderPosition = { book: string; chapter: number };
export type StoredBibleReaderHistoryItem = { book: string; chapter: number; reference: string; translation: StoredBibleTranslation; updatedAt: string };
export type StoredBibleReadChapters = Record<string, number[]>;
export type StoredBibleBookmark = {
  id: string;
  book: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
  reference: string;
  bookmarked?: boolean;
  note?: string;
  createdAt: string;
};
export type StoredCheckinPartner = { id: string; name: string; contactNote?: string };
export type StoredStudyPanelKey = "community" | "plan" | "feedback" | "helps";
export type StoredCollapsedStudyPanels = Record<StoredStudyPanelKey, boolean>;

const aiAccessChoiceKey = "bible-study-tutor-ai-access-choice";
const appThemeKey = "bible-study-tutor-app-theme";
const pinnedJournalEntriesKey = "bible-study-tutor-pinned-journal-entries";
const completedPlanDaysKey = "bible-study-tutor-completed-plan-days";
const checkinPartnersKey = "bible-study-tutor-checkin-partners";
const activeCheckinPartnerKey = "bible-study-tutor-active-checkin-partner";
const bibleTranslationKey = "bible-study-tutor-bible-translation";
const bibleReaderPositionKey = "bible-study-tutor-bible-reader-position";
const bibleReaderHistoryKey = "bible-study-tutor-bible-reader-history";
const bibleReadChaptersKey = "bible-study-tutor-bible-read-chapters";
const bibleBookmarksKey = "bible-study-tutor-bible-bookmarks";
const studyFocusModeKey = "bible-study-tutor-study-focus-mode";
const tutorCoachingEnabledKey = "bible-study-tutor-coaching-enabled";
const collapsedStudyPanelsKey = "bible-study-tutor-collapsed-study-panels";
const customWritingPromptsKey = "bible-study-tutor-custom-writing-prompts";
const defaultCollapsedStudyPanels: StoredCollapsedStudyPanels = {
  community: false,
  plan: false,
  feedback: false,
  helps: false
};

export async function getStoredBibleTranslation(): Promise<StoredBibleTranslation> {
  const stored = await getStoredValue(bibleTranslationKey);
  return stored === "web" || stored === "bsb" || stored === "kjv" ? stored : "bsb";
}

export async function saveStoredBibleTranslation(translation: StoredBibleTranslation) {
  await setStoredValue(bibleTranslationKey, translation);
}

export async function getStoredBibleReaderPosition(): Promise<StoredBibleReaderPosition | null> {
  const stored = await getStoredValue(bibleReaderPositionKey);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    return typeof parsed?.book === "string" && Number.isFinite(parsed?.chapter)
      ? { book: parsed.book, chapter: Math.max(1, Math.round(parsed.chapter)) }
      : null;
  } catch {
    return null;
  }
}

export async function saveStoredBibleReaderPosition(position: StoredBibleReaderPosition) {
  await setStoredValue(bibleReaderPositionKey, JSON.stringify(position));
}

export async function getStoredBibleReaderHistory(): Promise<StoredBibleReaderHistoryItem[]> {
  const stored = await getStoredValue(bibleReaderHistoryKey);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is StoredBibleReaderHistoryItem =>
            typeof item?.book === "string" &&
            typeof item?.chapter === "number" &&
            typeof item?.reference === "string" &&
            (item?.translation === "bsb" || item?.translation === "web" || item?.translation === "kjv") &&
            typeof item?.updatedAt === "string"
        )
      : [];
  } catch {
    return [];
  }
}

export async function saveStoredBibleReaderHistory(history: StoredBibleReaderHistoryItem[]) {
  await setStoredValue(bibleReaderHistoryKey, JSON.stringify(history.slice(0, 12)));
}

export async function getStoredBibleReadChapters(): Promise<StoredBibleReadChapters> {
  const stored = await getStoredValue(bibleReadChaptersKey);
  if (!stored) return {};

  try {
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.entries(parsed).reduce<StoredBibleReadChapters>((map, [book, chapters]) => {
      if (typeof book !== "string" || !Array.isArray(chapters)) return map;
      const normalized = Array.from(
        new Set(chapters.map((chapter) => (typeof chapter === "number" ? Math.round(chapter) : 0)).filter((chapter) => chapter > 0))
      ).sort((a, b) => a - b);
      if (normalized.length) map[book] = normalized;
      return map;
    }, {});
  } catch {
    return {};
  }
}

export async function saveStoredBibleReadChapters(readChapters: StoredBibleReadChapters) {
  await setStoredValue(bibleReadChaptersKey, JSON.stringify(readChapters));
}

export async function getStoredBibleBookmarks(): Promise<StoredBibleBookmark[]> {
  const stored = await getStoredValue(bibleBookmarksKey);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is StoredBibleBookmark =>
            typeof item?.id === "string" &&
            typeof item?.book === "string" &&
            typeof item?.chapter === "number" &&
            typeof item?.reference === "string" &&
            typeof item?.createdAt === "string"
        )
      : [];
  } catch {
    return [];
  }
}

export async function saveStoredBibleBookmarks(bookmarks: StoredBibleBookmark[]) {
  await setStoredValue(bibleBookmarksKey, JSON.stringify(bookmarks.slice(0, 30)));
}

export async function getStoredStudyFocusMode(): Promise<boolean> {
  return (await getStoredValue(studyFocusModeKey)) === "true";
}

export async function saveStoredStudyFocusMode(enabled: boolean) {
  await setStoredValue(studyFocusModeKey, enabled ? "true" : "false");
}

export async function getStoredTutorCoachingEnabled(): Promise<boolean> {
  const stored = await getStoredValue(tutorCoachingEnabledKey);
  return stored === "false" ? false : true;
}

export async function saveStoredTutorCoachingEnabled(enabled: boolean) {
  await setStoredValue(tutorCoachingEnabledKey, enabled ? "true" : "false");
}

export async function getStoredCollapsedStudyPanels(): Promise<StoredCollapsedStudyPanels> {
  const stored = await getStoredValue(collapsedStudyPanelsKey);
  if (!stored) return defaultCollapsedStudyPanels;

  try {
    const parsed = JSON.parse(stored);
    return {
      community: typeof parsed?.community === "boolean" ? parsed.community : false,
      plan: typeof parsed?.plan === "boolean" ? parsed.plan : false,
      feedback: typeof parsed?.feedback === "boolean" ? parsed.feedback : false,
      helps: typeof parsed?.helps === "boolean" ? parsed.helps : false
    };
  } catch {
    return defaultCollapsedStudyPanels;
  }
}

export async function saveStoredCollapsedStudyPanels(panels: StoredCollapsedStudyPanels) {
  await setStoredValue(collapsedStudyPanelsKey, JSON.stringify(panels));
}

export async function getStoredCustomWritingPrompts(): Promise<string[]> {
  const stored = await getStoredValue(customWritingPromptsKey);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

export async function saveStoredCustomWritingPrompts(prompts: string[]) {
  const normalized = Array.from(new Set(prompts.map((prompt) => prompt.trim()).filter(Boolean))).slice(0, 12);
  await setStoredValue(customWritingPromptsKey, JSON.stringify(normalized));
}

export async function getStoredAiAccessChoice(): Promise<StoredAiAccessOption> {
  const stored = await getStoredValue(aiAccessChoiceKey);
  return isAiAccessOption(stored) ? stored : "free";
}

export async function saveStoredAiAccessChoice(choice: StoredAiAccessOption) {
  await setStoredValue(aiAccessChoiceKey, choice);
}

export async function getStoredAppTheme(): Promise<StoredAppTheme> {
  const stored = await getStoredValue(appThemeKey);
  return isAppTheme(stored) ? stored : "warm-study";
}

export async function saveStoredAppTheme(theme: StoredAppTheme) {
  await setStoredValue(appThemeKey, theme);
}

export async function getPinnedJournalEntries(): Promise<string[]> {
  const stored = await getStoredValue(pinnedJournalEntriesKey);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export async function savePinnedJournalEntries(ids: string[]) {
  await setStoredValue(pinnedJournalEntriesKey, JSON.stringify(Array.from(new Set(ids))));
}

export async function getCompletedPlanDays(): Promise<string[]> {
  const stored = await getStoredValue(completedPlanDaysKey);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export async function saveCompletedPlanDays(ids: string[]) {
  await setStoredValue(completedPlanDaysKey, JSON.stringify(Array.from(new Set(ids))));
}

export async function getStoredCheckinPartners(): Promise<StoredCheckinPartner[]> {
  const stored = await getStoredValue(checkinPartnersKey);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is StoredCheckinPartner => typeof item?.id === "string" && typeof item?.name === "string")
      : [];
  } catch {
    return [];
  }
}

export async function saveStoredCheckinPartners(partners: StoredCheckinPartner[]) {
  await setStoredValue(checkinPartnersKey, JSON.stringify(partners));
}

export async function getActiveCheckinPartnerId() {
  return (await getStoredValue(activeCheckinPartnerKey)) || "";
}

export async function saveActiveCheckinPartnerId(id: string) {
  await setStoredValue(activeCheckinPartnerKey, id);
}

async function getStoredValue(key: string) {
  return Platform.OS === "web" && typeof localStorage !== "undefined" ? localStorage.getItem(key) : await SecureStore.getItemAsync(key);
}

async function setStoredValue(key: string, value: string) {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

function isAiAccessOption(value: string | null): value is StoredAiAccessOption {
  return value === "free" || value === "own-key" || value === "premium";
}

function isAppTheme(value: string | null): value is StoredAppTheme {
  return value === "warm-study" || value === "cathedral-light" || value === "midnight-lectio" || value === "olive-grove" || value === "modern-chapel";
}
