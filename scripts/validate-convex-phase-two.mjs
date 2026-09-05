import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const schema = read("convex/schema.ts");
const study = read("convex/study.ts");
const accountability = read("convex/accountability.ts");
const community = read("convex/community.ts");
const insights = read("convex/insights.ts");
const app = read("app/index.tsx");

for (const table of [
  "studyStats",
  "studyDailyStats",
  "bibleReaderStates",
  "bibleBookmarks",
  "customBibleReadingPlans",
  "bibleReadingPlanCompletions",
  "cleanupJobs"
]) {
  assert(schema.includes(`${table}: defineTable(`), `missing Phase 2 table: ${table}`);
}

for (const index of [
  'index("by_checkin_id"',
  'index("by_auth_user_and_updated_at"',
  'index("by_profile_and_recipient_profile_and_created"',
  'index("by_recipient_profile_and_profile_and_created"',
  'index("by_profile_and_status"',
  'index("by_circle_and_status"',
  'index("by_post_and_status"'
]) {
  assert(schema.includes(index), `missing Phase 2 index: ${index}`);
}

assert(study.includes('query("studyStats")') && study.includes('query("studyDailyStats")'), "study stats must read incremental aggregates");
assert(accountability.includes('query("bibleReaderStates")') && accountability.includes('query("bibleBookmarks")'), "reader sync must use normalized tables");
assert(community.includes("by_profile_and_recipient_profile_and_created"), "friend feed must use its direct outgoing index");
assert(community.includes("by_recipient_profile_and_profile_and_created"), "friend feed must use its direct incoming index");
assert(community.includes("circleFeedPage = query") && community.includes(".paginate(args.paginationOpts)"), "circle feeds must expose bounded pagination");
assert(insights.includes("runCleanupJob = internalMutation"), "cleanup must run as a resumable internal job");
assert(insights.includes("CLEANUP_BATCH_SIZE") && !insights.includes("deleteProfileData("), "destructive cleanup must be bounded and must not use the legacy bulk helper");
assert(insights.includes("paginationOptsValidator") && insights.includes(".paginate(args.paginationOpts)"), "admin users must use Convex pagination");
assert(app.includes("usePaginatedQuery(api.insights.adminUsersPage"), "admin directory must consume paginated results");
assert(!/\(api\s+as\s+any\)/.test(app), "client Convex API casts must stay removed");

for (const [path, source] of [
  ["convex/accountability.ts", accountability],
  ["convex/community.ts", community],
  ["convex/insights.ts", insights],
  ["convex/study.ts", study],
  ["convex/memory.ts", read("convex/memory.ts")],
  ["convex/adminNotifications.ts", read("convex/adminNotifications.ts")],
  ["convex/statistics.ts", read("convex/statistics.ts")]
]) {
  assertFunctionReturnValidators(path, source);
}

console.log("Validated Phase 2 Convex aggregates, normalized reader state, indexes, pagination, cleanup jobs, and return validators.");

function assertFunctionReturnValidators(path, source) {
  const matcher = /export const ([A-Za-z0-9_]+) = (?:query|mutation|action|internalQuery|internalMutation|internalAction)\(\{/g;
  for (const match of source.matchAll(matcher)) {
    const headerStart = match.index + match[0].length;
    const handlerStart = source.indexOf("handler:", headerStart);
    assert(handlerStart !== -1, `${path}:${match[1]} is missing a handler`);
    const header = source.slice(headerStart, handlerStart);
    assert(/\breturns\s*:/.test(header), `${path}:${match[1]} is missing a return validator`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
