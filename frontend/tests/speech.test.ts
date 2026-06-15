import {afterEach, describe, expect, it, vi} from "vitest";

import {speakGuidance} from "@/lib/speech";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("speakGuidance", () => {
  it("returns a transcript fallback when speech is unavailable", () => {
    vi.stubGlobal("SpeechSynthesisUtterance", undefined);
    expect(speakGuidance("Warning", "Bengali")).toEqual({
      started: false,
      message: "Audio is not available in this browser. Read the transcript below.",
    });
  });
});
