import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx, MutationCtx } from "./_generated/server";

/** Guest IDs are identifiers, never credentials. Signed-in ownership wins. */
export async function authorizeProfileAccess(ctx: QueryCtx | MutationCtx, profileId: Id<"profiles">, clientKey?: string) {
  const profile = await ctx.db.get(profileId);
  const userId = await getAuthUserId(ctx);
  if (!profile) throw new Error("Unauthorized");
  if (userId) {
    if (profile.authUserId !== userId) throw new Error("Unauthorized");
  } else if (profile.authUserId || !clientKey || ![clientKey, `local:${clientKey}`].includes(profile.clientKey)) {
    throw new Error("Unauthorized");
  }
  return profile;
}

export function isAdminUserId(userId: string) {
  return (process.env.ADMIN_USER_IDS || "").split(",").map((id) => id.trim()).filter(Boolean).includes(userId);
}
