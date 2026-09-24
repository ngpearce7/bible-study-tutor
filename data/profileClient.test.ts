// @vitest-environment jsdom
import { createElement, act } from "react";
import { createRoot } from "react-dom/client";
import { makeFunctionReference } from "convex/server";
import { expect, test, vi } from "vitest";
const { mutate, query } = vi.hoisted(() => ({ mutate: vi.fn(async (_args: unknown) => "saved"), query: vi.fn() }));
vi.mock("convex/react", () => ({ useMutation: () => mutate, useQuery: query }));
vi.mock("./deviceKey", () => ({ getCachedDeviceKey: () => "device-secret" }));
import { useMutation, useQuery } from "./profileClient";

test("credential wrapper remains stable across new references to the same function", async () => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.createElement("div"));
  const callbacks: Array<(args: Record<string, unknown>) => Promise<unknown>> = [];
  function Probe() {
    callbacks.push(useMutation(makeFunctionReference<"mutation">("study:saveSession")));
    return null;
  }
  try {
    await act(async () => root.render(createElement(Probe)));
    await act(async () => root.render(createElement(Probe)));
    expect(callbacks[0]).toBe(callbacks[1]);
    await callbacks[0]({ profileId: "guest" });
    expect(mutate).toHaveBeenLastCalledWith({ profileId: "guest", clientKey: "device-secret" });
  } finally { await act(async () => root.unmount()); }
});


test("home memory summary sends the guest device credential", async () => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.createElement("div"));
  function Probe() {
    useQuery(makeFunctionReference<"query">("memory:homeSummary"), { profileId: "guest", dueThrough: 100 });
    return null;
  }
  try {
    await act(async () => root.render(createElement(Probe)));
    expect(query).toHaveBeenCalledWith(expect.anything(), { profileId: "guest", dueThrough: 100, clientKey: "device-secret" });
  } finally { await act(async () => root.unmount()); }
});
