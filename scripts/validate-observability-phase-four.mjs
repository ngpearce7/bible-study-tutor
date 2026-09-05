import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const schema = read("convex/schema.ts");
const insights = read("convex/insights.ts");
const http = read("convex/http.ts");
const app = read("app/index.tsx");
const publicAnalytics = read("data/publicAnalytics.ts");
const reliability = read("data/reliabilityMetrics.ts");
const crons = read("convex/crons.ts");
const seo = read("scripts/prepare-seo.mjs");

function assertIncludes(source, value, message) {
  if (!source.includes(value)) throw new Error(message);
}

for (const table of ["usageAnalyticsDaily", "publicAnalyticsDaily", "reliabilityEvents", "reliabilityDaily"]) {
  assertIncludes(schema, `${table}: defineTable`, `Missing ${table} schema.`);
}
assertIncludes(schema, '.index("by_expires_at", ["expiresAt"])', "Raw telemetry needs expiry indexes.");
assertIncludes(crons, "pruneExpiredTelemetry", "Telemetry cleanup cron is not wired.");
assertIncludes(insights, "RAW_USAGE_RETENTION_MS", "Signed-in usage retention is missing.");
assertIncludes(insights, "RAW_PUBLIC_RETENTION_MS", "Public analytics retention is missing.");
assertIncludes(insights, "RAW_RELIABILITY_RETENTION_MS", "Reliability retention is missing.");
assertIncludes(insights, "incrementUsageDaily", "Usage events are not aggregated.");
assertIncludes(insights, "incrementPublicDaily", "Public events are not aggregated.");
assertIncludes(insights, "incrementReliabilityDaily", "Reliability events are not aggregated.");
assertIncludes(insights, "buildPublicFunnel", "Anonymous funnel reporting is missing.");
assertIncludes(insights, "histogramPercentile", "Provider percentile reporting is missing.");
assertIncludes(http, 'path: "/reliability"', "Reliability HTTP endpoint is missing.");
assertIncludes(publicAnalytics, "bst-public-funnel-v1", "App public analytics lacks a session funnel ID.");
assertIncludes(seo, "bst-public-funnel-v1", "SEO analytics lacks a session funnel ID.");
assertIncludes(app, "const { methodId, translation, tab, book } = details", "Usage tracking must select privacy-safe dimensions explicitly.");

const usageInsert = insights.slice(insights.indexOf('ctx.db.insert("usageEvents"'), insights.indexOf("if (countsTowardStudyRhythm"));
for (const sensitiveField of ["reference:", "methodName:", "chapter:"]) {
  if (usageInsert.includes(sensitiveField)) throw new Error(`New usage events still persist sensitive field ${sensitiveField}`);
}
for (const forbidden of ["stack", "message", "requestUrl", "userId", "profileId"]) {
  if (reliability.includes(`${forbidden}:`)) throw new Error(`Reliability telemetry must not send ${forbidden}.`);
}

console.log("Phase 4 observability validation passed.");
