import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "prune expired privacy-safe telemetry",
  { hours: 6 },
  internal.insights.pruneExpiredTelemetry,
  {}
);

crons.interval(
  "clean inactive empty local profiles",
  { hours: 168 },
  internal.insights.cleanupInactiveEmptyLocalProfiles,
  {}
);

export default crons;
