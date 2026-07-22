import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { BibleReadingPlan } from "@/data/bibleReadingPlans";
import { bibleReadingPlans } from "@/data/bibleReadingPlans";

export type StoredBibleTranslation = "bsb" | "web" | "kjv";
export type StoredAppearanceMode = "light" | "dark";
export type StoredBibleReaderPosition = { book: string; chapter: number };
export type StoredBibleReaderHistoryItem = { book: string; chapter: number; reference: string; translation: StoredBibleTranslation; updatedAt: string };
export type StoredBibleReadChapters = Record<string, number[]>;
export type StoredBibleReadingPlanProgress = {
  activePlanId: string;
  completedDays: string[];
  customPlans: BibleReadingPlan[];
  startDates?: Record<string, string>;
  updatedAt?: number;
};
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
export type StoredMemoryReviewSort = "oldest" | "newest";
export type StoredMemoryReviewSorts = {
  due: StoredMemoryReviewSort;
  reviewed: StoredMemoryReviewSort;
};

const pinnedJournalEntriesKey = "bible-study-tutor-pinned-journal-entries";
const completedPlanDaysKey = "bible-study-tutor-completed-plan-days";
const checkinPartnersKey = "bible-study-tutor-checkin-partners";
const activeCheckinPartnerKey = "bible-study-tutor-active-checkin-partner";
const bibleTranslationKey = "bible-study-tutor-bible-translation";
const bibleReaderPositionKey = "bible-study-tutor-bible-reader-position";
const bibleReaderHistoryKey = "bible-study-tutor-bible-reader-history";
const bibleReadChaptersKey = "bible-study-tutor-bible-read-chapters";
const bibleReadingPlanProgressKey = "bible-study-tutor-bible-reading-plan-progress";
const bibleBookmarksKey = "bible-study-tutor-bible-bookmarks";
const studyFocusModeKey = "bible-study-tutor-study-focus-mode";
const tutorCoachingEnabledKey = "bible-study-tutor-coaching-enabled";
const collapsedStudyPanelsKey = "bible-study-tutor-collapsed-study-panels";
const customWritingPromptsKey = "bible-study-tutor-custom-writing-prompts";
const appearanceModeKey = "bible-study-tutor-appearance-mode";
const memoryReviewSortsKey = "bible-study-tutor-memory-review-sorts";
const defaultCollapsedStudyPanels: StoredCollapsedStudyPanels = {
  community: false,
  plan: false,
  feedback: false,
  helps: false
};
const defaultMemoryReviewSorts: StoredMemoryReviewSorts = {
  due: "oldest",
  reviewed: "oldest"
};

export async function getStoredBibleTranslation(): Promise<StoredBibleTranslation> {
  const stored = await getStoredValue(bibleTranslationKey);
  return stored === "web" || stored === "bsb" || stored === "kjv" ? stored : "bsb";
}

export async function saveStoredBibleTranslation(translation: StoredBibleTranslation) {
  await setStoredValue(bibleTranslationKey, translation);
}

export async function getStoredAppearanceMode(): Promise<StoredAppearanceMode> {
  const stored = await getStoredValue(appearanceModeKey);
  return stored === "dark" ? "dark" : "light";
}

export async function saveStoredAppearanceMode(mode: StoredAppearanceMode) {
  await setStoredValue(appearanceModeKey, mode);
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

export async function getStoredBibleReadingPlanProgress(): Promise<StoredBibleReadingPlanProgress> {
  const stored = await getStoredValue(bibleReadingPlanProgressKey);
  if (!stored) return { activePlanId: "", completedDays: [], customPlans: [], startDates: {} };

  try {
    const parsed = JSON.parse(stored);
    const customPlans = Array.isArray(parsed?.customPlans)
      ? parsed.customPlans
          .map(normalizeStoredBibleReadingPlan)
          .filter((plan: BibleReadingPlan | null): plan is BibleReadingPlan => !!plan)
          .slice(0, 30)
      : [];
    const validPlans = [...bibleReadingPlans, ...customPlans];
    const validPlanIds = new Set(validPlans.map((plan) => plan.id));
    return {
      activePlanId: typeof parsed?.activePlanId === "string" && validPlanIds.has(parsed.activePlanId) ? parsed.activePlanId : "",
      completedDays: Array.isArray(parsed?.completedDays)
        ? Array.from(new Set<string>(parsed.completedDays.filter((item: unknown): item is string => typeof item === "string"))).filter((key: string) => {
            const [planId, dayValue] = key.split(":");
            if (!validPlanIds.has(planId)) return false;
            const plan = validPlans.find((item) => item.id === planId);
            const day = Math.round(Number(dayValue) || 0);
            return !!plan && plan.days.some((planDay: { day: number }) => planDay.day === day);
          })
        : [],
      startDates: parsed?.startDates && typeof parsed.startDates === "object"
        ? Object.entries(parsed.startDates).reduce<Record<string, string>>((map, [planId, date]) => {
            if (typeof planId === "string" && validPlanIds.has(planId) && typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
              map[planId] = date;
            }
            return map;
          }, {})
        : {},
      customPlans,
      updatedAt: Number.isFinite(Number(parsed?.updatedAt)) ? Number(parsed.updatedAt) : undefined
    };
  } catch {
    return { activePlanId: "", completedDays: [], customPlans: [], startDates: {} };
  }
}

export async function saveStoredBibleReadingPlanProgress(progress: StoredBibleReadingPlanProgress) {
  await setStoredValue(bibleReadingPlanProgressKey, JSON.stringify({
    activePlanId: progress.activePlanId,
    completedDays: Array.from(new Set(progress.completedDays)),
    customPlans: progress.customPlans.slice(0, 30),
    startDates: progress.startDates || {},
    updatedAt: progress.updatedAt || Date.now()
  }));
}

function normalizeStoredBibleReadingPlan(plan: any): BibleReadingPlan | null {
  if (!plan || typeof plan.id !== "string" || typeof plan.title !== "string" || !Array.isArray(plan.days)) return null;
  const days = plan.days
    .map((day: any) => ({
      day: Number.isFinite(Number(day?.day)) ? Math.max(1, Math.round(Number(day.day))) : 0,
      title: typeof day?.title === "string" ? day.title.slice(0, 80) : "",
      reference: typeof day?.reference === "string" ? day.reference.slice(0, 120) : "",
      readerBook: typeof day?.readerBook === "string" ? day.readerBook.slice(0, 40) : "",
      readerChapter: Number.isFinite(Number(day?.readerChapter)) ? Math.max(1, Math.round(Number(day.readerChapter))) : 1,
      studyReference: typeof day?.studyReference === "string" ? day.studyReference.slice(0, 120) : ""
    }))
    .filter((day: any) => day.day > 0 && day.reference && day.readerBook);
  if (!days.length) return null;

  return {
    id: plan.id.slice(0, 80),
    title: plan.title.slice(0, 80),
    description: typeof plan.description === "string" ? plan.description.slice(0, 240) : "",
    source: "custom",
    category: typeof plan.category === "string" ? plan.category.slice(0, 40) : "Custom",
    days
  };
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

export async function getStoredMemoryReviewSorts(): Promise<StoredMemoryReviewSorts> {
  const stored = await getStoredValue(memoryReviewSortsKey);
  if (!stored) return defaultMemoryReviewSorts;

  try {
    const parsed = JSON.parse(stored);
    return {
      due: parsed?.due === "newest" ? "newest" : "oldest",
      reviewed: parsed?.reviewed === "newest" ? "newest" : "oldest"
    };
  } catch {
    return defaultMemoryReviewSorts;
  }
}

export async function saveStoredMemoryReviewSorts(sorts: StoredMemoryReviewSorts) {
  await setStoredValue(memoryReviewSortsKey, JSON.stringify({
    due: sorts.due === "newest" ? "newest" : "oldest",
    reviewed: sorts.reviewed === "newest" ? "newest" : "oldest"
  }));
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
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  return await SecureStore.getItemAsync(key);
}

async function setStoredValue(key: string, value: string) {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage limits or private-mode restrictions; in-memory state still updates.
    }
    return;
  }

  await SecureStore.setItemAsync(key, value);
}
