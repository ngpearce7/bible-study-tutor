/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

const modules = import.meta.glob("./**/*.ts");

describe("private friend connections", () => {
  test("signed-in users can invite and accept, while another account cannot read or accept", async () => {
    const t = convexTest(schema, modules);
    const accounts = await t.run(async (ctx) => {
      const result = [];
      for (const [name, email] of [["Ari", "ari@example.org"], ["Beth", "beth@example.org"], ["Chris", "chris@example.org"]]) {
        const userId = await ctx.db.insert("users", { email });
        const profileId = await ctx.db.insert("profiles", {
          authUserId: userId,
          clientKey: `auth:${name}`,
          displayName: name,
          createdAt: 1,
          updatedAt: 1
        });
        result.push({ userId, profileId });
      }
      return result;
    });
    const [ari, beth, chris] = accounts;
    const ariSession = t.withIdentity({ subject: `${ari.userId}|session` });
    const bethSession = t.withIdentity({ subject: `${beth.userId}|session` });
    const chrisSession = t.withIdentity({ subject: `${chris.userId}|session` });

    const code = await bethSession.mutation(api.community.ensureFriendCode, { profileId: beth.profileId });
    const friendId = await ariSession.mutation(api.community.inviteFriendByCode, { profileId: ari.profileId, friendCode: code });
    expect((await ariSession.query(api.community.myFriends, { profileId: ari.profileId }))[0]).toMatchObject({
      _id: friendId,
      status: "pending",
      direction: "sent",
      email: ""
    });
    await expect(chrisSession.query(api.community.myFriends, { profileId: beth.profileId })).rejects.toThrow();
    await expect(chrisSession.mutation(api.community.acceptFriend, { profileId: chris.profileId, friendId })).rejects.toThrow("Friend invite not found");
    await expect(t.mutation(api.community.acceptFriend, { profileId: beth.profileId, friendId })).rejects.toThrow();

    await bethSession.mutation(api.community.acceptFriend, { profileId: beth.profileId, friendId });
    expect((await ariSession.query(api.community.myFriends, { profileId: ari.profileId }))[0]).toMatchObject({
      status: "accepted",
      email: "beth@example.org"
    });
    expect((await bethSession.query(api.community.myFriends, { profileId: beth.profileId }))[0]).toMatchObject({
      status: "accepted",
      direction: "received"
    });
  });

  test("circle posts are visible only to members", async () => {
    const t = convexTest(schema, modules);
    const accounts = await t.run(async (ctx) => {
      const result = [];
      for (const name of ["Ari", "Beth", "Chris"]) {
        const userId = await ctx.db.insert("users", {});
        const profileId = await ctx.db.insert("profiles", {
          authUserId: userId,
          clientKey: `auth:${name}`,
          displayName: name,
          createdAt: 1,
          updatedAt: 1
        });
        result.push({ userId, profileId });
      }
      return result;
    });
    const [ari, beth, chris] = accounts;
    const ariSession = t.withIdentity({ subject: `${ari.userId}|session` });
    const bethSession = t.withIdentity({ subject: `${beth.userId}|session` });
    const chrisSession = t.withIdentity({ subject: `${chris.userId}|session` });
    const { circleId, inviteCode } = await ariSession.mutation(api.community.createCircle, {
      profileId: ari.profileId,
      name: "Study group"
    });
    await expect(chrisSession.query(api.community.feed, { profileId: chris.profileId, circleId })).rejects.toThrow("not a member");
    await bethSession.mutation(api.community.joinCircle, { profileId: beth.profileId, inviteCode });
    await ariSession.mutation(api.community.shareInsight, { profileId: ari.profileId, circleId, note: "A thought" });
    expect(await bethSession.query(api.community.feed, { profileId: beth.profileId, circleId })).toHaveLength(1);
    await expect(chrisSession.query(api.community.feed, { profileId: chris.profileId, circleId })).rejects.toThrow("not a member");
  });
});
