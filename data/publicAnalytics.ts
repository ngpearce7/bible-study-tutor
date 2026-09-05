import { Platform } from "react-native";

type PublicAnalyticsEventType =
  | "public_page_view"
  | "seo_cta_clicked"
  | "start_study_clicked"
  | "bible_reader_opened"
  | "plans_opened"
  | "memory_opened"
  | "method_selected"
  | "method_page_cta_clicked"
  | "worksheet_cta_clicked"
  | "account_creation_started"
  | "study_completed"
  | "app_shared";

type PublicAnalyticsEvent = {
  eventType: PublicAnalyticsEventType;
  pagePath?: string;
  source?: string;
  ctaTarget?: string;
  methodId?: string;
};

const ANALYTICS_ENABLED = process.env.EXPO_PUBLIC_ANALYTICS_ENABLED === "true";
const configuredSiteUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL || "";
const configuredConvexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || "";
const analyticsBaseUrl =
  configuredSiteUrl ||
  (configuredConvexUrl.endsWith(".convex.cloud") ? configuredConvexUrl.replace(".convex.cloud", ".convex.site") : "");
const FUNNEL_STORAGE_KEY = "bst-public-funnel-v1";

export function trackPublicAnalytics(event: PublicAnalyticsEvent) {
  if (!ANALYTICS_ENABLED || Platform.OS !== "web" || !analyticsBaseUrl || typeof fetch === "undefined") return;

  const pagePath = event.pagePath || currentPublicPath();
  if (isPrivatePath(pagePath)) return;
  const safePagePath = safePublicPath(pagePath);
  if (!safePagePath) return;

  fetch(`${analyticsBaseUrl.replace(/\/$/, "")}/analytics`, {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: JSON.stringify({
      eventType: event.eventType,
      pagePath: safePagePath,
      source: event.source,
      ctaTarget: event.ctaTarget,
      methodId: event.methodId,
      funnelId: publicFunnelId()
    }),
    keepalive: true
  }).catch(() => undefined);
}

function publicFunnelId() {
  if (typeof window === "undefined") return undefined;
  try {
    const existing = window.sessionStorage.getItem(FUNNEL_STORAGE_KEY);
    if (existing && /^[A-Za-z0-9-]{16,64}$/.test(existing)) return existing;
    const value = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(FUNNEL_STORAGE_KEY, value);
    return value;
  } catch {
    return undefined;
  }
}

function currentPublicPath() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname || "/"}${window.location.search || ""}`.slice(0, 160);
}

function isPrivatePath(path?: string) {
  if (!path) return false;
  return /^\/(?:account|admin|journal|accountability|community)(?:[/?#]|$)/i.test(path) ||
    /^\/\?tab=(?:account|admin|journal|accountability|community)(?:&|$)/i.test(path);
}

function safePublicPath(path?: string) {
  if (!path?.startsWith("/")) return undefined;
  try {
    const url = new URL(path, "https://biblestudytutor.org");
    if (/^\/(?:account|admin|journal|accountability|community)(?:\/|$)/i.test(url.pathname)) return undefined;
    const safeParams = new URLSearchParams();
    const tab = url.searchParams.get("tab");
    if (tab && ["home", "study", "bible", "plans", "methods", "memory", "help"].includes(tab)) safeParams.set("tab", tab);
    const method = url.searchParams.get("method");
    if (method && /^[a-z0-9-]{1,40}$/i.test(method)) safeParams.set("method", method);
    const query = safeParams.toString();
    return `${url.pathname || "/"}${query ? `?${query}` : ""}`.slice(0, 160);
  } catch {
    return undefined;
  }
}
