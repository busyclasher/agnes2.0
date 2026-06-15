"use client";

import {useCallback, useEffect, useRef, useState} from "react";

import {generateAudioGuidance} from "@/lib/api";
import {
  pauseGuidance,
  resumeGuidance,
  speakGuidance,
  stopGuidance,
} from "@/lib/speech";
import type {SupportedLanguage} from "@/lib/types";

type PlaybackState =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "completed"
  | "error";

type PlaybackSource = "elevenlabs" | "browser" | null;

export function AudioGuidance({
  text,
  language,
}: {
  text: string;
  language: SupportedLanguage;
}) {
  const [playback, setPlayback] = useState<PlaybackState>("idle");
  const [source, setSource] = useState<PlaybackSource>(null);
  const [status, setStatus] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef("");
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const fallbackStartedRef = useRef(false);

  const releaseCloudAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.onended = null;
      audio.onerror = null;
    }
    audioRef.current = null;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      releaseCloudAudio();
      stopGuidance();
    };
  }, [releaseCloudAudio]);

  useEffect(() => {
    requestIdRef.current += 1;
    fallbackStartedRef.current = false;
    releaseCloudAudio();
    stopGuidance();
    setSource(null);
    setPlayback("idle");
    setStatus("");
  }, [language, releaseCloudAudio, text]);

  function startBrowserFallback(reason: string) {
    if (fallbackStartedRef.current) return;
    fallbackStartedRef.current = true;
    releaseCloudAudio();
    const result = speakGuidance(text, language, {
      onEnd: () => {
        if (mountedRef.current) {
          setPlayback("completed");
          setStatus("Browser audio completed. The transcript remains visible.");
        }
      },
      onError: () => {
        if (mountedRef.current) {
          setPlayback("error");
          setStatus("Audio is unavailable. Please read the transcript.");
        }
      },
    });
    setSource(result.started ? "browser" : null);
    setPlayback(result.started ? "playing" : "error");
    setStatus(
      result.started
        ? `${reason} ${result.message}`
        : "Audio is unavailable. Please read the transcript.",
    );
  }

  async function startCloudAudio() {
    const requestId = ++requestIdRef.current;
    fallbackStartedRef.current = false;
    setPlayback("loading");
    setStatus("Preparing audio...");
    stopGuidance();
    try {
      const blob = await generateAudioGuidance({text, language});
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;
      const audio = new Audio(objectUrl);
      audioRef.current = audio;
      audio.onended = () => {
        if (mountedRef.current) {
          setPlayback("completed");
          setStatus("Audio completed. The transcript remains visible.");
        }
      };
      audio.onerror = () => {
        if (mountedRef.current) {
          startBrowserFallback("Cloud audio could not be played.");
        }
      };
      await audio.play();
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setSource("elevenlabs");
      setPlayback("playing");
      setStatus(`Playing ${language} guidance with cloud audio.`);
    } catch {
      if (mountedRef.current && requestId === requestIdRef.current) {
        startBrowserFallback("Cloud audio is unavailable.");
      }
    }
  }

  async function handlePrimaryAction() {
    if (playback === "loading") return;
    if (playback === "playing") {
      if (source === "elevenlabs") audioRef.current?.pause();
      if (source === "browser") pauseGuidance();
      setPlayback("paused");
      setStatus("Audio paused.");
      return;
    }
    if (playback === "paused") {
      try {
        if (source === "elevenlabs") await audioRef.current?.play();
        if (source === "browser") resumeGuidance();
        setPlayback("playing");
        setStatus("Audio resumed.");
      } catch {
        startBrowserFallback("Cloud audio could not resume.");
      }
      return;
    }
    if (playback === "completed" && source === "elevenlabs" && audioRef.current) {
      audioRef.current.currentTime = 0;
      try {
        await audioRef.current.play();
        setPlayback("playing");
        setStatus(`Replaying ${language} guidance.`);
      } catch {
        startBrowserFallback("Cloud audio could not replay.");
      }
      return;
    }
    await startCloudAudio();
  }

  function stopPlayback() {
    requestIdRef.current += 1;
    fallbackStartedRef.current = false;
    releaseCloudAudio();
    stopGuidance();
    setSource(null);
    setPlayback("idle");
    setStatus("Audio stopped. The transcript remains visible.");
  }

  const primaryLabel = {
    idle: "Play",
    loading: "Preparing...",
    playing: "Pause",
    paused: "Resume",
    completed: "Replay",
    error: "Try again",
  }[playback];

  return (
    <div className="audio-block">
      <div>
        <p className="eyebrow">Listen to guidance</p>
        <p className="transcript" lang={languageTag(language)}>
          {text}
        </p>
        <p className="audio-privacy">
          Cloud audio is generated only when you press Play. The transcript
          always remains available.
        </p>
      </div>
      <div className="audio-controls">
        <button
          className="round-action"
          type="button"
          onClick={handlePrimaryAction}
          disabled={playback === "loading"}
          aria-label={`${primaryLabel} guidance in ${language}`}
        >
          {primaryLabel}
        </button>
        {(playback === "playing" || playback === "paused") && (
          <button
            className="audio-stop"
            type="button"
            onClick={stopPlayback}
          >
            Stop
          </button>
        )}
      </div>
      {status && (
        <p className="assistive-status" role="status">
          {status}
        </p>
      )}
    </div>
  );
}

function languageTag(language: SupportedLanguage): string {
  return {Bengali: "bn-BD", Tamil: "ta-IN", Hindi: "hi-IN"}[language];
}
