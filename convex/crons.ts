import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "prune expired privacy-safe telemetry",
  { hours: 6 },
  internal.insights.pruneExpiredTelemetry,
  {}
);

export default crons;
