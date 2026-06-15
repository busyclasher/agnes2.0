import type {SupportedLanguage} from "@/lib/types";
import {generateGuidanceSpeech} from "@/lib/api";

const LANGUAGE_TAGS: Record<SupportedLanguage, string> = {
  Bengali: "bn-BD",
  Tamil: "ta-IN",
  Hindi: "hi-IN",
};

export type SpeechResult = {
  started: boolean;
  message: string;
};

export type SpeechCallbacks = {
  onEnd?: () => void;
  onError?: () => void;
};

export async function playGuidanceAudio(
  text: string,
  language: SupportedLanguage,
): Promise<SpeechResult> {
  if (typeof window === "undefined" || typeof Audio === "undefined") {
    return speakGuidance(text, language);
  }

  try {
    const audio = await generateGuidanceSpeech({text, language});
    const url = URL.createObjectURL(audio);
    const player = new Audio(url);
    player.onended = () => URL.revokeObjectURL(url);
    player.onerror = () => URL.revokeObjectURL(url);
    await player.play();
    return {
      started: true,
      message: `Playing ${language} guidance with ElevenLabs.`,
    };
  } catch {
    return speakGuidance(text, language);
  }
}

export function speakGuidance(
  text: string,
  language: SupportedLanguage,
  callbacks: SpeechCallbacks = {},
): SpeechResult {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    typeof SpeechSynthesisUtterance === "undefined"
  ) {
    return {
      started: false,
      message: "Audio is not available in this browser. Read the transcript below.",
    };
  }

  const target = LANGUAGE_TAGS[language];
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((item) =>
    item.lang.toLowerCase().startsWith(target.slice(0, 2).toLowerCase()),
  );
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = target;
  if (voice) utterance.voice = voice;
  utterance.onend = () => callbacks.onEnd?.();
  utterance.onerror = () => callbacks.onError?.();
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);

  return {
    started: true,
    message: voice
      ? `Playing ${language} guidance.`
      : `Playing with the browser's default voice. A ${language} voice was not found; use the transcript to confirm the wording.`,
  };
}

export function pauseGuidance(): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.pause();
  return true;
}

export function resumeGuidance(): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.resume();
  return true;
}

export function stopGuidance() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
