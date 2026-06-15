"use client";

import {useState} from "react";

import {assetUrl} from "@/lib/api";
import {downloadText, shareText} from "@/lib/download";
import {speakGuidance} from "@/lib/speech";
import type {
  PictogramResponse,
  ScanResult,
  SupportedLanguage,
} from "@/lib/types";
import {RiskBadge} from "@/components/RiskBadge";
import {SourceStatePill} from "@/components/SourceStatePill";

export function ResultCard({
  result,
  language,
  previewUrl,
  pictogram,
  pictogramLoading,
  pictogramError,
  onRetake,
  onReport,
}: {
  result: ScanResult;
  language: SupportedLanguage;
  previewUrl: string;
  pictogram: PictogramResponse | null;
  pictogramLoading: boolean;
  pictogramError: string | null;
  onRetake: () => void;
  onReport: () => void;
}) {
  const [speechStatus, setSpeechStatus] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const summary = [
    `${result.risk_label}: ${result.plain_explanation}`,
    ...result.action_steps.map((step) => step.label),
    `Confidence: ${Math.round(result.confidence * 100)}%. ${result.uncertainty_note}`,
  ].join("\n");

  async function handleShare() {
    try {
      const shared = await shareText("SafePoint safety card", summary);
      if (!shared) {
        downloadText(`safepoint-${result.scan_id}.txt`, summary);
        setShareStatus("Sharing is unavailable, so the safety card was downloaded.");
      }
    } catch {
      setShareStatus("The share was cancelled. The safety card remains on screen.");
    }
  }

  return (
    <section className="result-stack" aria-labelledby="result-heading">
      <div className="result-hero">
        {/* A local object URL is intentional so captured images never leave the UI except for analysis. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt="The captured safety sign" />
        <div className="result-overlay">
          <SourceStatePill state={result.source_state} />
          <p>Analysis complete</p>
        </div>
      </div>

      <article className="safety-card">
        <RiskBadge level={result.risk_level} label={result.risk_label} />
        <div>
          <p className="eyebrow" id="result-heading">
            What this means
          </p>
          <h1>{result.plain_explanation}</h1>
          <p className="risk-reason">{result.risk_reason}</p>
        </div>

        <div className="action-panel">
          <h2>What to do now</h2>
          <ol>
            {result.action_steps.map((step, index) => (
              <li key={`${step.label}-${index}`}>
                <span>{index + 1}</span>
                <strong>{step.label}</strong>
              </li>
            ))}
          </ol>
        </div>

        <div className="section-block">
          <h2>PPE needed</h2>
          <div className="ppe-grid">
            {result.ppe_required.length ? (
              result.ppe_required.map((item) => (
                <div className="ppe-item" key={item.name}>
                  <span aria-hidden="true">{ppeSymbol(item.icon)}</span>
                  <strong>{item.name}</strong>
                </div>
              ))
            ) : (
              <p>No specific PPE could be confirmed from this image.</p>
            )}
          </div>
        </div>

        <div className="translation-block">
          <p className="eyebrow">{language} translation</p>
          <p lang={languageTag(language)}>{result.translated_text}</p>
          <details>
            <summary>Show detected English text</summary>
            <p>{result.detected_text}</p>
          </details>
        </div>

        <div className="audio-block">
          <div>
            <p className="eyebrow">Listen to guidance</p>
            <p className="transcript" lang={languageTag(language)}>
              {result.audio_text}
            </p>
          </div>
          <button
            className="round-action"
            type="button"
            onClick={() => {
              const status = speakGuidance(result.audio_text, language);
              setSpeechStatus(status.message);
            }}
            aria-label={`Play guidance in ${language}`}
          >
            <span aria-hidden="true">▶</span>
            Play
          </button>
          {speechStatus && (
            <p className="assistive-status" role="status">
              {speechStatus}
            </p>
          )}
        </div>

        <div className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Visual guidance</p>
              <h2>Pictogram card</h2>
            </div>
            {pictogram && <SourceStatePill state={pictogram.source_state} />}
          </div>
          {pictogramLoading && (
            <div className="pictogram-skeleton">Creating card…</div>
          )}
          {pictogram && (
            // The backend owns this generated or fixture asset URL.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="pictogram"
              src={assetUrl(pictogram.image_url)}
              alt={pictogram.alt_text}
            />
          )}
          {pictogramError && (
            <p className="inline-warning">
              {pictogramError} The text guidance above is still available.
            </p>
          )}
        </div>

        <div className="confidence-note">
          <span aria-hidden="true">i</span>
          <div>
            <strong>{Math.round(result.confidence * 100)}% confidence</strong>
            <p>{result.uncertainty_note}</p>
            <p>This is guidance, not an official safety determination.</p>
          </div>
        </div>

        <div className="button-row">
          <button className="button secondary" type="button" onClick={onRetake}>
            Retake photo
          </button>
          <button className="button secondary" type="button" onClick={handleShare}>
            Save / share card
          </button>
          <button className="button danger" type="button" onClick={onReport}>
            Report incident
          </button>
        </div>
        {shareStatus && <p role="status">{shareStatus}</p>}
      </article>
    </section>
  );
}

function ppeSymbol(icon: string): string {
  const symbols: Record<string, string> = {
    helmet: "⌒",
    harness: "Y",
    gloves: "✋",
    goggles: "◉",
    boots: "L",
    vest: "V",
  };
  return symbols[icon] ?? "+";
}

function languageTag(language: SupportedLanguage): string {
  return {Bengali: "bn", Tamil: "ta", Hindi: "hi"}[language];
}
