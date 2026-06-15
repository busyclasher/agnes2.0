import type {SupportedLanguage} from "@/lib/types";

const LANGUAGE_TAGS: Record<SupportedLanguage, string> = {
  Bengali: "bn-BD",
  Tamil: "ta-IN",
  Hindi: "hi-IN",
};

export type SpeechResult = {
  started: boolean;
  message: string;
};

export function speakGuidance(
  text: string,
  language: SupportedLanguage,
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
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);

  return {
    started: true,
    message: voice
      ? `Playing ${language} guidance.`
      : `Playing with the browser's default voice. A ${language} voice was not found; use the transcript to confirm the wording.`,
  };
}
