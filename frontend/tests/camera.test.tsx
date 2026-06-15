import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, beforeEach, describe, expect, test, vi} from "vitest";

import {CameraCapture} from "@/components/CameraCapture";

describe("CameraCapture", () => {
  beforeEach(() => {
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: undefined,
    });
  });

  test("explains the HTTPS requirement and keeps a device-camera fallback", async () => {
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: false,
    });

    render(<CameraCapture onFileSelected={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", {name: "Scan sign"}));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Live camera access requires HTTPS or localhost",
    );
    expect(
      screen.getByRole("button", {name: "Use device camera"}),
    ).toBeVisible();
  });

  test("opens the live preview and releases the camera when cancelled", async () => {
    const stop = vi.fn();
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{stop}],
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {getUserMedia},
    });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();

    render(<CameraCapture onFileSelected={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", {name: "Scan sign"}));

    expect(await screen.findByText("Camera live")).toBeVisible();
    expect(getUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        audio: false,
        video: expect.objectContaining({
          facingMode: {ideal: "environment"},
        }),
      }),
    );

    await userEvent.click(screen.getByRole("button", {name: "Cancel"}));
    expect(stop).toHaveBeenCalled();
    expect(screen.getByRole("button", {name: "Scan sign"})).toBeEnabled();
  });
});
