// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, test, vi } from "vitest";
vi.mock("react-native", () => vi.importActual("react-native-web"));

test("advancing across words and rows reuses one focused input without focus hand-offs", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const { StableMemoryInput } = await import("@/components/StableMemoryInput");
  const { MemoryBlank } = await import("@/components/MemoryBlank");
  const host = document.createElement("div"); document.body.append(host);
  const root = createRoot(host);
  const refs: any[] = [];
  const focus = vi.spyOn(HTMLElement.prototype, "focus");
  const geometry = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const match = /^Word (\d+):/.exec(this.getAttribute("aria-label") || "");
    const index = match ? Number(match[1]) - 1 : 0;
    return new DOMRect((index % 3) * 80, Math.floor(index / 3) * 60, 70, 32);
  });
  const render = async (answers: string[]) => act(() => root.render(createElement(StableMemoryInput, { style: {position: "relative"}, children: ["The", "Lord", "is", "my", "shepherd"].map((answer, index) => createElement(MemoryBlank, {
    key: index, token: { index, answer }, value: answers[index] || "", checked: false, hintsVisible: true, hintLevel: 1, compact: true,
    inputRef: ref => { refs[index] = ref; }, onChange: vi.fn(), onMoreHint: vi.fn()
  })) })));
  try {
    await render([]);
    await act(() => refs[0].focus());
    const input = host.querySelector("input")!;
    expect(input).not.toBeNull();
    expect(document.activeElement).toBe(input);
    const initialFocusCount = focus.mock.calls.length;
    for (let index = 1; index < 5; index++) {
      await render(["The", "Lord", "is", "my"].slice(0, index));
      await act(() => refs[index].focus());
      expect(host.querySelectorAll("input")).toHaveLength(1);
      expect(host.querySelector("input")).toBe(input);
      expect(document.activeElement).toBe(input);
      expect(refs[index].isFocused()).toBe(true);
      expect(refs[index - 1].isFocused()).toBe(false);
      expect(focus.mock.calls.length).toBe(initialFocusCount);
      expect(input.style.top).toBe(`${Math.floor(index / 3) * 60}px`);
    }
    await act(() => input.blur());
    expect(document.activeElement).not.toBe(input);
    await act(() => refs[4].focus());
    expect(document.activeElement).toBe(input);
  } finally { await act(() => root.unmount()); host.remove(); focus.mockRestore(); geometry.mockRestore(); vi.unstubAllGlobals(); }
});
