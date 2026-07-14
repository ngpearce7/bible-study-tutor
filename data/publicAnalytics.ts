import { Platform } from "react-native";

type PublicAnalyticsEventType =
  | "public_page_view"
  | "seo_cta_clicked"
  | "start_study_clicked"
  | "bible_reader_opened"
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

export function trackPublicAnalytics(event: PublicAnalyticsEvent) {
  if (!ANALYTICS_ENABLED || Platform.OS !== "web" || !analyticsBaseUrl || typeof fetch === "undefined") return;

  const pagePath = event.pagePath || currentPublicPath();
  if (isPrivatePath(pagePath)) return;

  fetch(`${analyticsBaseUrl.replace(/\/$/, "")}/analytics`, {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: JSON.stringify({
      eventType: event.eventType,
      pagePath,
      source: event.source,
      ctaTarget: event.ctaTarget,
      methodId: event.methodId
    }),
    keepalive: true
  }).catch(() => undefined);
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
