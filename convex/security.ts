import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

type Timestamped = {
  createdAt?: number;
  updatedAt?: number;
  completedAt?: number;
  requestedAt?: number;
};

export function assertProfileCanWrite(profile: Doc<"profiles">) {
  if (profile.suspendedAt) {
    throw new Error("This account is paused. Please contact support if you think this is a mistake.");
  }
}

export function assertRecentLimit(
  items: Timestamped[],
  timestampKey: keyof Timestamped,
  options: { max: number; windowMs: number; label: string; now?: number }
) {
  const now = options.now ?? Date.now();
  const cutoff = now - options.windowMs;
  const recentCount = items.filter((item) => {
    const timestamp = item[timestampKey];
    return typeof timestamp === "number" && timestamp >= cutoff;
  }).length;

  if (recentCount >= options.max) {
    throw new Error(`${options.label} limit reached. Please wait a little while before trying again.`);
  }
}

export async function enforceRecentLimit(
  ctx: MutationCtx,
  profileId: Id<"profiles">,
  items: Timestamped[],
  timestampKey: keyof Timestamped,
  options: { max: number; windowMs: number; label: string; now?: number; eventType?: string }
) {
  try {
    assertRecentLimit(items, timestampKey, options);
  } catch (error) {
    await logSecurityEvent(ctx, {
      profileId,
      eventType: options.eventType || "write_rate_limited",
      details: `${options.label} blocked after ${options.max} attempts in ${Math.round(options.windowMs / 60000)} minutes.`
    });
    throw error;
  }
}

export function assertCollectionLimit(currentCount: number, max: number, label: string) {
  if (currentCount >= max) {
    throw new Error(`${label} limit reached.`);
  }
}

export async function logSecurityEvent(
  ctx: MutationCtx,
  args: {
    profileId: Id<"profiles">;
    eventType: string;
    details?: string;
  }
) {
  await ctx.db.insert("securityEvents", {
    profileId: args.profileId,
    eventType: args.eventType.slice(0, 80),
    details: args.details?.trim().slice(0, 500) || undefined,
    createdAt: Date.now()
  });
}
