import { describe, expect, it, vi } from "vitest";
import { normalizeCustomPlanReference } from "./customPlanReference";

vi.mock("react-native", () => ({ Platform: { OS: "web" } }));

describe("custom plan references", () => {
  it("normalizes a chapter or verse range", () => {
    expect(normalizeCustomPlanReference("jn 2")).toBe("John 2");
    expect(normalizeCustomPlanReference("John 2:1-12")).toBe("John 2:1-12");
  });

  it("rejects missing or out-of-range chapters and backwards verse ranges", () => {
    expect(normalizeCustomPlanReference("John")).toBeNull();
    expect(normalizeCustomPlanReference("John 22")).toBeNull();
    expect(normalizeCustomPlanReference("John 2:12-1")).toBeNull();
  });
});
