import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

auth.addHttpRoutes(http);

const publicAnalyticsEventTypeValues = [
  "public_page_view",
  "seo_cta_clicked",
  "start_study_clicked",
  "bible_reader_opened",
  "plans_opened",
  "memory_opened",
  "method_selected",
  "method_page_cta_clicked",
  "worksheet_cta_clicked",
  "account_creation_started",
  "study_completed",
  "app_shared"
] as const;
type PublicAnalyticsEventType = typeof publicAnalyticsEventTypeValues[number];
const publicAnalyticsEventTypes = new Set<string>(publicAnalyticsEventTypeValues);

const allowedAnalyticsOrigins = new Set([
  "https://biblestudytutor.org",
  "https://www.biblestudytutor.org",
  "http://localhost:8090",
  "http://127.0.0.1:8090"
]);
const reliabilityKinds = new Set(["client_error", "provider_request"]);
const reliabilityProviders = new Set(["app", "bible-api", "helloao-bsb", "bolls", "cross-reference-assets", "convex"]);
const reliabilityOperations = new Set(["unhandled", "passage", "search", "asset", "mutation"]);
const reliabilityOutcomes = new Set(["success", "error", "timeout"]);
const reliabilityErrorCodes = new Set(["network", "http_4xx", "http_5xx", "timeout", "unknown"]);

function analyticsCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = allowedAnalyticsOrigins.has(origin) ? origin : "https://biblestudytutor.org";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function isAllowedAnalyticsOrigin(req: Request) {
  const origin = req.headers.get("origin");
  return !origin || allowedAnalyticsOrigins.has(origin);
}

function cleanAnalyticsText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : undefined;
}

function cleanPublicPath(value: unknown) {
  const path = cleanAnalyticsText(value, 160);
  if (!path?.startsWith("/")) return undefined;
  try {
    const url = new URL(path, "https://biblestudytutor.org");
    if (/^\/(?:account|admin|journal|accountability|community)(?:\/|$)/i.test(url.pathname)) return undefined;

    const safeParams = new URLSearchParams();
    const tab = url.searchParams.get("tab");
    if (tab && ["home", "study", "bible", "plans", "methods", "memory", "help"].includes(tab)) {
      safeParams.set("tab", tab);
    }
    const method = url.searchParams.get("method");
    if (method && /^[a-z0-9-]{1,40}$/i.test(method)) {
      safeParams.set("method", method);
    }
    const query = safeParams.toString();
    return `${url.pathname || "/"}${query ? `?${query}` : ""}`.slice(0, 160);
  } catch {
    return undefined;
  }
}

http.route({
  path: "/analytics",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, req) => {
    if (!isAllowedAnalyticsOrigin(req)) {
      return new Response(null, { status: 403, headers: analyticsCorsHeaders(req) });
    }
    return new Response(null, { status: 204, headers: analyticsCorsHeaders(req) });
  })
});

http.route({
  path: "/analytics",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const headers = analyticsCorsHeaders(req);
    if (!isAllowedAnalyticsOrigin(req)) {
      return new Response(JSON.stringify({ ok: false }), { status: 403, headers });
    }

    let payload: Record<string, unknown> = {};
    try {
      const raw = await req.text();
      if (raw.length > 1200) throw new Error("Payload too large");
      payload = raw ? JSON.parse(raw) : {};
    } catch {
      return new Response(JSON.stringify({ ok: false }), { status: 400, headers });
    }

    const eventType = cleanAnalyticsText(payload.eventType, 80);
    if (!eventType || !publicAnalyticsEventTypes.has(eventType)) {
      return new Response(JSON.stringify({ ok: false }), { status: 400, headers });
    }

    const funnelId = cleanAnalyticsText(payload.funnelId, 64);
    await ctx.runMutation(internal.insights.recordPublicAnalytics, {
      eventType: eventType as PublicAnalyticsEventType,
      pagePath: cleanPublicPath(payload.pagePath),
      source: cleanAnalyticsText(payload.source, 80),
      ctaTarget: cleanAnalyticsText(payload.ctaTarget, 120),
      methodId: cleanAnalyticsText(payload.methodId, 80),
      funnelId: funnelId && /^[A-Za-z0-9-]{16,64}$/.test(funnelId) ? funnelId : undefined
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  })
});

http.route({
  path: "/reliability",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, req) => {
    if (!isAllowedAnalyticsOrigin(req)) return new Response(null, { status: 403, headers: analyticsCorsHeaders(req) });
    return new Response(null, { status: 204, headers: analyticsCorsHeaders(req) });
  })
});

http.route({
  path: "/reliability",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const headers = analyticsCorsHeaders(req);
    if (!isAllowedAnalyticsOrigin(req)) return new Response(JSON.stringify({ ok: false }), { status: 403, headers });

    let payload: Record<string, unknown> = {};
    try {
      const raw = await req.text();
      if (raw.length > 600) throw new Error("Payload too large");
      payload = raw ? JSON.parse(raw) : {};
    } catch {
      return new Response(JSON.stringify({ ok: false }), { status: 400, headers });
    }

    const kind = cleanAnalyticsText(payload.kind, 30);
    const provider = cleanAnalyticsText(payload.provider, 40);
    const operation = cleanAnalyticsText(payload.operation, 40);
    const outcome = cleanAnalyticsText(payload.outcome, 20);
    const errorCode = cleanAnalyticsText(payload.errorCode, 20);
    if (!kind || !reliabilityKinds.has(kind) || !provider || !reliabilityProviders.has(provider) || !operation || !reliabilityOperations.has(operation) || !outcome || !reliabilityOutcomes.has(outcome) || (errorCode && !reliabilityErrorCodes.has(errorCode))) {
      return new Response(JSON.stringify({ ok: false }), { status: 400, headers });
    }

    const rawDuration = typeof payload.durationMs === "number" && Number.isFinite(payload.durationMs) ? payload.durationMs : undefined;
    await ctx.runMutation(internal.insights.recordReliabilityMetric, {
      kind: kind as "client_error" | "provider_request",
      surface: cleanAnalyticsText(payload.surface, 40),
      provider,
      operation,
      outcome: outcome as "success" | "error" | "timeout",
      durationMs: rawDuration === undefined ? undefined : Math.min(30_000, Math.max(0, Math.round(rawDuration / 50) * 50)),
      errorCode: errorCode as "network" | "http_4xx" | "http_5xx" | "timeout" | "unknown" | undefined
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  })
});

export default http;
