import { describe, expect, it, vi } from "vitest";
import { buildReaderLoadRequest, type ReaderPlanReading } from "@/data/biblePlanReader";

vi.mock("@/data/reliabilityMetrics", () => ({ trackReliabilityMetric: () => undefined }));

describe("Go deeper Bible reader requests", () => {
  it("opens only the linked verses and can expand to the chapter", () => {
    expect(buildReaderLoadRequest(false, null, "Jeremiah 17", "Jeremiah 17:7-8"))
      .toEqual({ mode: "related", reference: "Jeremiah 17:7-8" });
    expect(buildReaderLoadRequest(false, null, "Jeremiah 17", "Jeremiah 17:7-8", true))
      .toEqual({ mode: "chapter", reference: "Jeremiah 17" });
  });

  it("uses the chapter when the link is a chapter or the reader has moved elsewhere", () => {
    expect(buildReaderLoadRequest(false, null, "Jeremiah 17", "Jeremiah 17"))
      .toEqual({ mode: "chapter", reference: "Jeremiah 17" });
    expect(buildReaderLoadRequest(false, null, "Jeremiah 18", "Jeremiah 17:7-8"))
      .toEqual({ mode: "chapter", reference: "Jeremiah 18" });
  });

  it("keeps a focused plan reading ahead of an older related link", () => {
    const planReading: ReaderPlanReading = {
      planId: "wisdom",
      day: 3,
      reference: "James 1:5-8",
      book: "James",
      chapter: 1,
      chunks: [{ reference: "James 1:5-8", book: "James", chapter: 1, startVerse: 5, endVerse: 8 }],
      currentChunkIndex: 0
    };
    expect(buildReaderLoadRequest(true, planReading, "James 1", "Jeremiah 17:7-8"))
      .toEqual({ mode: "plan", reference: "James 1:5-8" });
  });
});
