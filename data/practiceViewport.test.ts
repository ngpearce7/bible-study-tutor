// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, test, vi } from "vitest";
vi.mock("react-native", () => ({ Platform: { OS: "web" } }));

test("practice follows keyboard resize and pan, releases on exit, and respects zoom", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("requestAnimationFrame", (cb: () => void) => setTimeout(cb, 0));
  vi.stubGlobal("cancelAnimationFrame", clearTimeout);
  const viewport = Object.assign(new EventTarget(), { height: 800, offsetTop: 0, scale: 1 });
  vi.stubGlobal("visualViewport", viewport);
  const { usePracticeViewport } = await import("@/components/usePracticeViewport");
  let style: any;
  function Probe({ enabled }: { enabled: boolean }) { style = usePracticeViewport(enabled); return null; }
  const root = createRoot(document.createElement("div"));
  async function resize(height: number, top: number, scale = 1) {
    await act(() => { Object.assign(viewport, { height, offsetTop: top, scale }); viewport.dispatchEvent(new Event("resize")); vi.runAllTimers(); });
  }
  try {
    await act(() => root.render(createElement(Probe, { enabled: true })));
    await act(() => vi.runAllTimers());
    expect(style.height).toBe(800);
    await resize(340, 110); expect(style).toMatchObject({ height: 340, top: 110, position: "fixed" });
    await resize(800, 0); expect(style).toMatchObject({ height: 800, top: 0 });
    await resize(400, 20, 2); expect(style).toBeUndefined();
    await resize(800, 0);
    await act(() => root.render(createElement(Probe, { enabled: false })));
    expect(style).toBeUndefined();
  } finally { await act(() => root.unmount()); vi.useRealTimers(); vi.unstubAllGlobals(); }
});
