"use client";

import {ChangeEvent, useEffect, useRef, useState} from "react";

type CameraCaptureProps = {
  onFileSelected: (file: File) => void;
};

type CameraStatus = "idle" | "starting" | "live" | "capturing" | "error";

const ACCEPTED_IMAGES = "image/jpeg,image/png,image/webp";

function cameraErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "Camera permission was denied. Allow camera access in your browser settings, or upload a photo instead.";
    }
    if (error.name === "NotFoundError") {
      return "No camera was found on this device. Upload a photo instead.";
    }
    if (error.name === "NotReadableError") {
      return "The camera is being used by another app. Close it there and try again.";
    }
  }

  return "The browser could not start the camera. You can still use your device camera or upload a photo.";
}

export function CameraCapture({onFileSelected}: CameraCaptureProps) {
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [message, setMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const captureAttemptRef = useRef(0);

  function stopCamera(nextStatus: CameraStatus = "idle") {
    captureAttemptRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (mountedRef.current) setStatus(nextStatus);
  }

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, []);

  async function startCamera() {
    setMessage("");

    if (
      window.isSecureContext === false ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setStatus("error");
      setMessage(
        "Live camera access requires HTTPS or localhost. If you opened SafePoint from a phone using a local network address, use the device camera button below or serve the app over HTTPS.",
      );
      return;
    }

    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: {ideal: "environment"},
          width: {ideal: 1920},
          height: {ideal: 1080},
        },
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play().catch(() => {
          // The autoplay attributes remain in place for browsers that delay play.
        });
      }
      setStatus("live");
    } catch (error) {
      stopCamera("error");
      setMessage(cameraErrorMessage(error));
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setMessage("The camera is still starting. Hold the sign steady and try again.");
      return;
    }

    const scale = Math.min(1, 1920 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) {
      setMessage("This browser could not capture the frame. Use the device camera instead.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const attempt = ++captureAttemptRef.current;
    setStatus("capturing");
    canvas.toBlob(
      (blob) => {
        if (!mountedRef.current || attempt !== captureAttemptRef.current) return;
        if (!blob) {
          setStatus("live");
          setMessage("The photo could not be created. Please try again.");
          return;
        }

        const now = Date.now();
        stopCamera();
        onFileSelected(
          new File([blob], `safepoint-camera-${now}.jpg`, {
            type: "image/jpeg",
            lastModified: now,
          }),
        );
      },
      "image/jpeg",
      0.9,
    );
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    if (nextFile) {
      stopCamera();
      setMessage("");
      onFileSelected(nextFile);
    }
    event.target.value = "";
  }

  const cameraIsOpen = status === "live" || status === "capturing";

  return (
    <div className="camera-capture">
      <div className={`capture-target${cameraIsOpen ? " camera-live" : ""}`}>
        <video
          ref={videoRef}
          className={cameraIsOpen ? "camera-video" : "camera-video hidden"}
          autoPlay
          muted
          playsInline
          aria-label="Live camera preview"
        />
        {cameraIsOpen ? (
          <>
            <span className="camera-live-badge" role="status">Camera live</span>
            <span className="focus-corner top-left" />
            <span className="focus-corner top-right" />
            <span className="focus-corner bottom-left" />
            <span className="focus-corner bottom-right" />
          </>
        ) : (
          <>
            <span className="focus-corner top-left" />
            <span className="focus-corner top-right" />
            <span className="focus-corner bottom-left" />
            <span className="focus-corner bottom-right" />
            <div className="camera-symbol" aria-hidden="true">◎</div>
            <strong>
              {status === "starting"
                ? "Starting the camera..."
                : "Keep the full sign inside the frame"}
            </strong>
            <small>
              {status === "starting"
                ? "Your browser may ask for permission"
                : "Use a clear, straight-on photo"}
            </small>
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="sr-only" aria-hidden="true" />
      <input
        ref={cameraInputRef}
        className="sr-only"
        type="file"
        accept={ACCEPTED_IMAGES}
        capture="environment"
        onChange={handleFile}
        aria-label="Use device camera to photograph a safety sign"
      />
      <input
        ref={uploadInputRef}
        className="sr-only"
        type="file"
        accept={ACCEPTED_IMAGES}
        onChange={handleFile}
        aria-label="Upload a safety sign image"
      />

      {cameraIsOpen ? (
        <div className="capture-actions">
          <button
            className="button primary"
            type="button"
            onClick={capturePhoto}
            disabled={status === "capturing"}
          >
            {status === "capturing" ? "Capturing..." : "Capture photo"}
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setMessage("");
              stopCamera();
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="capture-actions">
          <button
            className="button primary"
            type="button"
            onClick={startCamera}
            disabled={status === "starting"}
          >
            <span aria-hidden="true">◎</span>
            {status === "starting" ? "Starting..." : "Scan sign"}
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() => uploadInputRef.current?.click()}
          >
            Upload photo
          </button>
        </div>
      )}

      {message && (
        <div className="camera-message" role="alert">
          <strong>Camera unavailable</strong>
          <p>{message}</p>
          <button
            className="button secondary"
            type="button"
            onClick={() => cameraInputRef.current?.click()}
          >
            Use device camera
          </button>
        </div>
      )}
    </div>
  );
}
