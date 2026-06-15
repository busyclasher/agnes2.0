"use client";

import {FormEvent, useState} from "react";

import {generateDailyBriefing, SafePointApiError} from "@/lib/api";
import {downloadText} from "@/lib/download";
import {speakGuidance} from "@/lib/speech";
import type {DailyBriefing, SupportedLanguage} from "@/lib/types";
import {SourceStatePill} from "@/components/SourceStatePill";

export function DailyBriefingForm({
  language,
  onClose,
}: {
  language: SupportedLanguage;
  onClose: () => void;
}) {
  const [siteZone, setSiteZone] = useState("Level 3");
  const [tasks, setTasks] = useState("open-edge work, scaffold inspection");
  const [hazards, setHazards] = useState("fall hazard, moving materials");
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [speechStatus, setSpeechStatus] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      setBriefing(
        await generateDailyBriefing({
          language,
          siteZone,
          todayTasks: splitList(tasks),
          hazards: splitList(hazards),
        }),
      );
    } catch (caught) {
      setError(
        caught instanceof SafePointApiError
          ? caught.message
          : "The briefing could not be generated.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="report-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="briefing-title"
      >
        <button className="close-button" onClick={onClose} aria-label="Close briefing">
          ×
        </button>
        <p className="eyebrow">Daily safety briefing</p>
        <h1 id="briefing-title">Prepare today’s site guidance</h1>

        {!briefing ? (
          <form onSubmit={submit}>
            <label>
              Site zone
              <input
                value={siteZone}
                onChange={(event) => setSiteZone(event.target.value)}
                required
              />
            </label>
            <label>
              Today’s tasks
              <textarea
                value={tasks}
                onChange={(event) => setTasks(event.target.value)}
                required
                placeholder="Separate tasks with commas"
              />
            </label>
            <label>
              Main hazards
              <textarea
                value={hazards}
                onChange={(event) => setHazards(event.target.value)}
                required
                placeholder="Separate hazards with commas"
              />
            </label>
            <p className="privacy-copy">
              The briefing supports the site’s official toolbox talk. It does not
              replace it.
            </p>
            {error && <p className="error-message">{error}</p>}
            <button className="button primary full" disabled={loading}>
              {loading ? "Preparing briefing…" : `Generate in ${language}`}
            </button>
          </form>
        ) : (
          <div className="report-draft">
            <div className="section-heading">
              <h2>Today’s briefing</h2>
              <SourceStatePill state={briefing.source_state} />
            </div>
            <div className="briefing-copy" lang={languageTag(language)}>
              {briefing.briefing_text}
            </div>
            <button
              className="button primary full"
              type="button"
              onClick={() => {
                const status = speakGuidance(briefing.audio_text, language);
                setSpeechStatus(status.message);
              }}
            >
              Play audio guidance
            </button>
            {speechStatus && <p role="status">{speechStatus}</p>}
            <details>
              <summary>Agnes visual generation prompts</summary>
              <p><strong>Pictogram:</strong> {briefing.pictogram_prompt}</p>
              <p><strong>30-second video:</strong> {briefing.video_prompt}</p>
            </details>
            <div className="capture-actions">
              <button
                className="button secondary"
                type="button"
                onClick={() => setBriefing(null)}
              >
                Edit inputs
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={() =>
                  downloadText(
                    `safepoint-briefing-${siteZone.replace(/\s+/g, "-").toLowerCase()}.txt`,
                    briefing.briefing_text,
                  )
                }
              >
                Download briefing
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function splitList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function languageTag(language: SupportedLanguage): string {
  return {Bengali: "bn", Tamil: "ta", Hindi: "hi"}[language];
}
