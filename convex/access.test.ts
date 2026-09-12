/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test, afterEach } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
const modules = import.meta.glob("./**/*.ts");
afterEach(() => { delete process.env.ADMIN_USER_IDS; delete process.env.ADMIN_EMAILS; });

describe("profile boundaries", () => {
  test("guest reads and writes require the device credential", async () => {
    const t = convexTest(schema, modules);
    const profileId = await t.mutation(api.study.ensureProfile, { clientKey: "secret-device-one" });
    await expect(t.query(api.study.recentSessions, { profileId })).rejects.toThrow("Unauthorized");
    await expect(t.query(api.study.recentSessions, { profileId, clientKey: "other" })).rejects.toThrow("Unauthorized");
    await expect(t.query(api.study.recentSessions, { profileId, clientKey: "secret-device-one" })).resolves.toEqual([]);
    await expect(t.mutation(api.accountability.savePlan, { profileId, weeklyGoal: "Read", accountabilityPartner: "", preferredMethodId: "soap" })).rejects.toThrow("Unauthorized");
  });
  test("registration adopts guest content, and signed-out device cannot read it", async () => {
    const t = convexTest(schema, modules);
    const clientKey = "guest-conversion-secret";
    const profileId = await t.mutation(api.study.ensureProfile, { clientKey });
    await t.mutation(api.study.saveSession, { profileId, clientKey, passage: "John 1", methodId: "soap", methodName: "SOAP", minutes: 5, answers: [{ stepTitle: "Observe", answer: "The Word was with God." }] });
    const userId = await t.run(ctx => ctx.db.insert("users", { name: "Reader" }));
    const signed = t.withIdentity({ subject: `${userId}|session` });
    expect(await signed.mutation(api.study.ensureProfile, { clientKey })).toEqual(profileId);
    expect(await signed.query(api.study.recentSessions, { profileId })).toHaveLength(1);
    await expect(t.query(api.study.recentSessions, { profileId, clientKey })).rejects.toThrow("Unauthorized");
    const otherId = await t.run(ctx => ctx.db.insert("users", {}));
    await expect(t.withIdentity({ subject: `${otherId}|session` }).query(api.study.recentSessions, { profileId, clientKey })).rejects.toThrow("Unauthorized");
  });
  test("unverified allowlisted email never grants administrator access", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(ctx => ctx.db.insert("users", { email: "admin@example.org" }));
    process.env.ADMIN_EMAILS = "admin@example.org";
    const caller = t.withIdentity({ subject: `${userId}|session` });
    expect(await caller.query(api.insights.adminOverview, {})).toBeNull();
    process.env.ADMIN_USER_IDS = userId;
    expect(await caller.query(api.insights.adminOverview, {})).not.toBeNull();
  });
});
