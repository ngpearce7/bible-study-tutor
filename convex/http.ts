import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

auth.addHttpRoutes(http);

const publicAnalyticsEventTypes = new Set([
  "public_page_view",
  "seo_cta_clicked",
  "start_study_clicked",
  "bible_reader_opened",
  "method_page_cta_clicked",
  "worksheet_cta_clicked",
  "account_creation_started",
  "study_completed",
  "app_shared"
]);

const allowedAnalyticsOrigins = new Set([
  "https://biblestudytutor.org",
  "https://www.biblestudytutor.org",
  "http://localhost:8090",
  "http://127.0.0.1:8090"
]);

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

function cleanAnalyticsText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : undefined;
}

function cleanPublicPath(value: unknown) {
  const path = cleanAnalyticsText(value, 160);
  if (!path?.startsWith("/")) return undefined;
  if (/^\/(?:account|admin|journal|accountability|community)(?:[/?#]|$)/i.test(path)) return undefined;
  if (/^\/\?tab=(?:account|admin|journal|accountability|community)(?:&|$)/i.test(path)) return undefined;
  return path;
}

http.route({
  path: "/analytics",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, req) => {
    return new Response(null, { status: 204, headers: analyticsCorsHeaders(req) });
  })
});

http.route({
  path: "/analytics",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const headers = analyticsCorsHeaders(req);
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

    await ctx.runMutation((internal as any).insights.recordPublicAnalytics, {
      eventType,
      pagePath: cleanPublicPath(payload.pagePath),
      source: cleanAnalyticsText(payload.source, 80),
      ctaTarget: cleanAnalyticsText(payload.ctaTarget, 120),
      methodId: cleanAnalyticsText(payload.methodId, 80)
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  })
});

export default http;
