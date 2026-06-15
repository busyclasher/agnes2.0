import {act, render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {AudioGuidance} from "@/components/AudioGuidance";
import {generateAudioGuidance} from "@/lib/api";
import {
  pauseGuidance,
  resumeGuidance,
  speakGuidance,
  stopGuidance,
} from "@/lib/speech";

vi.mock("@/lib/api", () => ({
  generateAudioGuidance: vi.fn(),
}));

vi.mock("@/lib/speech", () => ({
  speakGuidance: vi.fn(),
  pauseGuidance: vi.fn(),
  resumeGuidance: vi.fn(),
  stopGuidance: vi.fn(),
}));

class MockAudio {
  static instances: MockAudio[] = [];

  currentTime = 0;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  pause = vi.fn();
  play = vi.fn().mockResolvedValue(undefined);

  constructor(public readonly src: string) {
    MockAudio.instances.push(this);
  }
}

describe("AudioGuidance", () => {
  beforeEach(() => {
    MockAudio.instances = [];
    vi.stubGlobal("Audio", MockAudio);
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:audio"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.mocked(generateAudioGuidance).mockResolvedValue(
      new Blob(["audio"], {type: "audio/mpeg"}),
    );
    vi.mocked(speakGuidance).mockReturnValue({
      started: true,
      message: "Playing browser guidance.",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps the transcript visible and controls cloud audio", async () => {
    const user = userEvent.setup();
    const {unmount} = render(
      <AudioGuidance text="সাবধানে কাজ করুন।" language="Bengali" />,
    );

    expect(screen.getByText("সাবধানে কাজ করুন।")).toHaveAttribute(
      "lang",
      "bn-BD",
    );
    await user.click(
      screen.getByRole("button", {name: "Play guidance in Bengali"}),
    );

    expect(generateAudioGuidance).toHaveBeenCalledWith({
      text: "সাবধানে কাজ করুন।",
      language: "Bengali",
    });
    expect(MockAudio.instances[0].play).toHaveBeenCalled();
    expect(
      screen.getByRole("button", {name: "Pause guidance in Bengali"}),
    ).toBeVisible();

    await user.click(
      screen.getByRole("button", {name: "Pause guidance in Bengali"}),
    );
    expect(MockAudio.instances[0].pause).toHaveBeenCalled();
    expect(
      screen.getByRole("button", {name: "Resume guidance in Bengali"}),
    ).toBeVisible();

    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:audio");
    expect(stopGuidance).toHaveBeenCalled();
  });

  it("uses browser speech when cloud audio fails", async () => {
    const user = userEvent.setup();
    vi.mocked(generateAudioGuidance).mockRejectedValue(new Error("offline"));
    render(<AudioGuidance text="सावधान रहें।" language="Hindi" />);

    await user.click(
      screen.getByRole("button", {name: "Play guidance in Hindi"}),
    );

    expect(speakGuidance).toHaveBeenCalledWith(
      "सावधान रहें।",
      "Hindi",
      expect.objectContaining({
        onEnd: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Cloud audio is unavailable",
    );

    await user.click(
      screen.getByRole("button", {name: "Pause guidance in Hindi"}),
    );
    expect(pauseGuidance).toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", {name: "Resume guidance in Hindi"}),
    );
    expect(resumeGuidance).toHaveBeenCalled();
  });

  it("supports completion, replay, and stop", async () => {
    const user = userEvent.setup();
    render(<AudioGuidance text="கவனமாக இருங்கள்." language="Tamil" />);

    await user.click(
      screen.getByRole("button", {name: "Play guidance in Tamil"}),
    );
    act(() => MockAudio.instances[0].onended?.());
    expect(
      screen.getByRole("button", {name: "Replay guidance in Tamil"}),
    ).toBeVisible();

    await user.click(
      screen.getByRole("button", {name: "Replay guidance in Tamil"}),
    );
    expect(MockAudio.instances[0].currentTime).toBe(0);
    expect(MockAudio.instances[0].play).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole("button", {name: "Stop"}));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:audio");
    expect(
      screen.getByRole("button", {name: "Play guidance in Tamil"}),
    ).toBeVisible();
  });

  it("keeps a transcript-only fallback when both audio systems fail", async () => {
    const user = userEvent.setup();
    vi.mocked(generateAudioGuidance).mockRejectedValue(new Error("offline"));
    vi.mocked(speakGuidance).mockReturnValue({
      started: false,
      message: "Audio is unavailable.",
    });
    render(<AudioGuidance text="সুপারভাইজারকে জিজ্ঞাসা করুন।" language="Bengali" />);

    await user.click(
      screen.getByRole("button", {name: "Play guidance in Bengali"}),
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Audio is unavailable. Please read the transcript.",
    );
    expect(screen.getByText("সুপারভাইজারকে জিজ্ঞাসা করুন।")).toBeVisible();
  });

  it("does not issue repeated requests while audio is loading", async () => {
    const user = userEvent.setup();
    let resolveAudio: ((blob: Blob) => void) | undefined;
    vi.mocked(generateAudioGuidance).mockReturnValue(
      new Promise((resolve) => {
        resolveAudio = resolve;
      }),
    );
    render(<AudioGuidance text="सावधान रहें।" language="Hindi" />);
    const playButton = screen.getByRole("button", {
      name: "Play guidance in Hindi",
    });

    await user.click(playButton);
    await user.click(
      screen.getByRole("button", {name: "Preparing... guidance in Hindi"}),
    );
    expect(generateAudioGuidance).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveAudio?.(new Blob(["audio"], {type: "audio/mpeg"}));
    });
  });

  it("discards an in-flight response when the guidance changes", async () => {
    const user = userEvent.setup();
    let resolveAudio: ((blob: Blob) => void) | undefined;
    vi.mocked(generateAudioGuidance).mockReturnValue(
      new Promise((resolve) => {
        resolveAudio = resolve;
      }),
    );
    const {rerender} = render(
      <AudioGuidance text="Old guidance" language="Hindi" />,
    );

    await user.click(
      screen.getByRole("button", {name: "Play guidance in Hindi"}),
    );
    rerender(<AudioGuidance text="New guidance" language="Hindi" />);
    await act(async () => {
      resolveAudio?.(new Blob(["audio"], {type: "audio/mpeg"}));
    });

    expect(MockAudio.instances).toHaveLength(0);
    expect(screen.getByText("New guidance")).toBeVisible();
    expect(
      screen.getByRole("button", {name: "Play guidance in Hindi"}),
    ).toBeVisible();
  });
});
