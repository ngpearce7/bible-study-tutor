// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, test, vi } from "vitest";
import { useRefreshingValue } from "@/components/useRefreshingValue";

test("statistics survive refresh loading, accept real zero, and never leak across profiles", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const host = document.createElement("div");
  const root = createRoot(host);
  const renders: string[] = [];
  function Counter({ scope, value }: { scope: string | null; value?: { currentStreak: number } | null }) {
    const stats = useRefreshingValue(scope, value);
    const text = stats === undefined ? "loading" : stats === null ? "unavailable" : String(stats.currentStreak);
    renders.push(text);
    return createElement("span", null, text);
  }
  async function render(scope: string | null, value?: { currentStreak: number } | null) {
    renders.length = 0;
    await act(() => root.render(createElement(Counter, { scope, value })));
  }
  try {
    await render("profile-a");
    expect(host.textContent).toBe("loading");
    await render("profile-a", { currentStreak: 12 });
    await render("profile-a");
    expect(renders.every(text => text === "12")).toBe(true);
    await render("profile-a", { currentStreak: 0 });
    expect(host.textContent).toBe("0");
    await render("profile-b");
    expect(renders.every(text => text === "loading")).toBe(true);
    await render("profile-b", { currentStreak: 7 });
    await render(null);
    expect(renders.every(text => text === "loading")).toBe(true);
    await render("profile-b");
    expect(host.textContent).toBe("loading");
    await render("profile-b", null);
    await render("profile-b");
    expect(host.textContent).toBe("unavailable");
  } finally {
    await act(() => root.unmount());
    vi.unstubAllGlobals();
  }
});
