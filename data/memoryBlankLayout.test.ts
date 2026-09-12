// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, test, vi } from "vitest";
vi.mock("react-native", () => vi.importActual("react-native-web"));

test("correct answers preserve the hint row rather than collapsing the verse layout", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const { MemoryBlank } = await import("@/components/MemoryBlank");
  const host = document.createElement("div");
  const root = createRoot(host);
  const props = { token: { index: 0, answer: "shepherd" }, value: "", checked: false, hintsVisible: true, hintLevel: 1, compact: true, onChange: vi.fn(), onMoreHint: vi.fn() };
  try {
    await act(() => root.render(createElement(MemoryBlank, props)));
    const wrapper = host.firstElementChild!;
    const hintRow = wrapper.lastElementChild!;
    expect(wrapper.children.length).toBe(2);
    await act(() => root.render(createElement(MemoryBlank, { ...props, value: "shepherd" })));
    expect(wrapper.lastElementChild).toBe(hintRow);
    expect((hintRow as HTMLElement).style.opacity).toBe("0");
    expect(wrapper.children.length).toBe(2);
    await act(() => root.render(createElement(MemoryBlank, props)));
    expect(wrapper.lastElementChild).toBe(hintRow);
    expect((hintRow as HTMLElement).style.opacity).not.toBe("0");
  } finally { await act(() => root.unmount()); vi.unstubAllGlobals(); }
});
