// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, test, vi } from "vitest";

vi.mock("react-native", async () => ({
  Platform: { OS: "web" },
  useColorScheme: (await vi.importActual<{ default: () => "light" | "dark" }>("react-native-web/dist/exports/useColorScheme")).default
}));

test("device theme reacts to changes while explicit choices remain fixed", async () => {
  const listeners = new Set<(event: { matches: boolean }) => void>();
  const media = { matches: false, addListener: (listener: (event: { matches: boolean }) => void) => listeners.add(listener), removeListener: (listener: (event: { matches: boolean }) => void) => listeners.delete(listener) };
  vi.stubGlobal("matchMedia", () => media);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const { useAppDarkMode } = await import("@/components/useAppDarkMode");
  function Probe({ mode }: { mode: "system" | "light" | "dark" }) {
    return createElement("span", null, useAppDarkMode(mode) ? "dark" : "light");
  }
  const host = document.createElement("div");
  const themeMeta = document.createElement("meta");
  themeMeta.name = "theme-color";
  themeMeta.content = "#F6F1E8";
  document.head.append(themeMeta);
  const root = createRoot(host);
  const render = async (mode: "system" | "light" | "dark") => act(() => root.render(createElement(Probe, { mode })));
  const change = async (matches: boolean) => act(() => { media.matches = matches; for (const listener of [...listeners]) listener({ matches }); });
  try {
    await render("system"); expect(host.textContent).toBe("light");
    await change(true); expect(host.textContent).toBe("dark");
    await render("light"); expect(host.textContent).toBe("light");
    await change(false); await change(true); expect(host.textContent).toBe("light");
    await render("dark"); await change(false); expect(host.textContent).toBe("dark");
    expect(themeMeta.content).toBe("#181818");
    expect(document.body.style.colorScheme).toBe("dark");
    await render("system"); expect(host.textContent).toBe("light");
    expect(themeMeta.content).toBe("#f8f1e6");
  } finally {
    await act(() => root.unmount());
    expect(themeMeta.content).toBe("#F6F1E8");
    themeMeta.remove();
    expect(listeners.size).toBe(0);
    vi.unstubAllGlobals();
  }
});
