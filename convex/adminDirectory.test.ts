/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

const modules = import.meta.glob("./**/*.ts");

afterEach(() => { delete process.env.ADMIN_USER_IDS; });

test("admin directory shows email verification only for the confirmed current address", async () => {
  const t = convexTest(schema, modules);
  const adminId = await t.run((ctx) => ctx.db.insert("users", {}));
  process.env.ADMIN_USER_IDS = adminId;
  await t.run(async (ctx) => {
    for (const [index, email, verified] of [
      [1, "verified@example.org", "verified@example.org"],
      [2, "pending@example.org", undefined],
      [3, "changed@example.org", "old@example.org"],
      [4, "reader@username.biblestudytutor.local", "reader@username.biblestudytutor.local"]
    ] as const) {
      const userId = await ctx.db.insert("users", { email });
      await ctx.db.insert("authAccounts", { userId, provider: "password", providerAccountId: email, ...(verified ? { emailVerified: verified } : {}) });
      await ctx.db.insert("profiles", { authUserId: userId, clientKey: `auth:${userId}`, displayName: `User ${index}`, createdAt: index, updatedAt: index });
    }
  });

  const args = { paginationOpts: { numItems: 10, cursor: null } };
  const admin = t.withIdentity({ subject: `${adminId}|session` });
  const page = await admin.query(api.insights.adminUsersPage, args);
  expect(Object.fromEntries(page.page.map((user) => [user.displayName, user.emailVerified]))).toEqual({
    "User 1": true,
    "User 2": false,
    "User 3": false,
    "User 4": false
  });
  expect((await t.query(api.insights.adminUsersPage, args)).page).toEqual([]);
});
