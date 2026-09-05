import { Platform } from "react-native";

export type ReliabilityProvider = "app" | "bible-api" | "helloao-bsb" | "bolls" | "cross-reference-assets" | "convex";
export type ReliabilityOperation = "unhandled" | "passage" | "search" | "asset" | "mutation";
export type ReliabilityOutcome = "success" | "error" | "timeout";
export type ReliabilityErrorCode = "network" | "http_4xx" | "http_5xx" | "timeout" | "unknown";

type ReliabilityMetric = {
  kind: "client_error" | "provider_request";
  provider: ReliabilityProvider;
  operation: ReliabilityOperation;
  outcome: ReliabilityOutcome;
  durationMs?: number;
  errorCode?: ReliabilityErrorCode;
  surface?: string;
};

const TELEMETRY_ENABLED = process.env.EXPO_PUBLIC_ANALYTICS_ENABLED === "true";
const configuredSiteUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL || "";
const configuredConvexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || "";
const telemetryBaseUrl = configuredSiteUrl || (configuredConvexUrl.endsWith(".convex.cloud") ? configuredConvexUrl.replace(".convex.cloud", ".convex.site") : "");

export function trackReliabilityMetric(metric: ReliabilityMetric) {
  if (!TELEMETRY_ENABLED || Platform.OS !== "web" || !telemetryBaseUrl || typeof fetch === "undefined") return;
  fetch(`${telemetryBaseUrl.replace(/\/$/, "")}/reliability`, {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: JSON.stringify({ ...metric, surface: metric.surface || currentSurface() }),
    keepalive: true
  }).catch(() => undefined);
}

export function installPrivacySafeErrorReporting() {
  if (Platform.OS !== "web" || typeof window === "undefined") return () => undefined;
  const onError = () => trackReliabilityMetric({ kind: "client_error", provider: "app", operation: "unhandled", outcome: "error", errorCode: "unknown" });
  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (event.reason && typeof event.reason === "object" && "name" in event.reason && event.reason.name === "AbortError") return;
    onError();
  };
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}

function currentSurface() {
  if (typeof window === "undefined") return "app";
  const tab = new URLSearchParams(window.location.search).get("tab");
  if (tab && ["home", "study", "bible", "plans", "methods", "memory", "help"].includes(tab)) return tab;
  const firstPathSegment = window.location.pathname.split("/").filter(Boolean)[0];
  return firstPathSegment && /^[a-z0-9-]{1,40}$/i.test(firstPathSegment) ? firstPathSegment : "app";
}
