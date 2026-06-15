"use client";

import {FormEvent, useState} from "react";

import {generateIncidentReport, SafePointApiError} from "@/lib/api";
import {downloadText, shareText} from "@/lib/download";
import type {IncidentReport, SupportedLanguage} from "@/lib/types";
import {SourceStatePill} from "@/components/SourceStatePill";

export function IncidentReportForm({
  language,
  onClose,
}: {
  language: SupportedLanguage;
  onClose: () => void;
}) {
  const [statement, setStatement] = useState("");
  const [location, setLocation] = useState("");
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      setReport(
        await generateIncidentReport({
          language,
          workerStatement: statement,
          location,
        }),
      );
    } catch (caught) {
      setError(
        caught instanceof SafePointApiError
          ? caught.message
          : "The report draft could not be created.",
      );
    } finally {
      setLoading(false);
    }
  }

  const reportText = report
    ? [
        "SafePoint incident draft",
        `Location: ${location}`,
        `Type: ${report.incident_type}`,
        `Severity: ${report.severity}`,
        "",
        report.english_report,
        "",
        report.worker_language_summary,
        "",
        `Suggested next step: ${report.suggested_next_step}`,
        "",
        "This draft was reviewed by the worker before export.",
      ].join("\n")
    : "";

  async function exportReport() {
    try {
      const shared = await shareText("SafePoint incident draft", reportText);
      if (!shared) {
        downloadText(`safepoint-${report?.report_id}.txt`, reportText);
        setStatus("Sharing is unavailable, so the reviewed draft was downloaded.");
      }
    } catch {
      setStatus("The share was cancelled. Nothing was submitted.");
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="report-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
      >
        <button className="close-button" onClick={onClose} aria-label="Close report form">
          ×
        </button>
        <p className="eyebrow">Near miss or incident</p>
        <h1 id="report-title">Draft a report in your language</h1>
        {!report ? (
          <form onSubmit={submit}>
            <label>
              What happened?
              <textarea
                value={statement}
                onChange={(event) => setStatement(event.target.value)}
                required
                minLength={3}
                placeholder="Describe what you saw or what happened."
              />
            </label>
            <label>
              Location
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                required
                placeholder="For example: Level 3 staircase"
              />
            </label>
            <p className="privacy-copy">
              This creates a draft only. SafePoint does not automatically save or
              send it.
            </p>
            {error && <p className="error-message">{error}</p>}
            <button className="button primary full" disabled={loading}>
              {loading ? "Creating draft…" : "Create report draft"}
            </button>
          </form>
        ) : (
          <div className="report-draft">
            <div className="section-heading">
              <h2>Review before sharing</h2>
              <SourceStatePill state={report.source_state} />
            </div>
            <dl>
              <dt>English report</dt>
              <dd>{report.english_report}</dd>
              <dt>{language} copy</dt>
              <dd>{report.worker_language_summary}</dd>
              <dt>Suggested next step</dt>
              <dd>{report.suggested_next_step}</dd>
            </dl>
            <label className="confirm-row">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              I reviewed this draft and confirm it reflects what I reported.
            </label>
            <button
              className="button primary full"
              type="button"
              disabled={!confirmed}
              onClick={exportReport}
            >
              Save / share reviewed draft
            </button>
            <p className="privacy-copy">Nothing is submitted automatically.</p>
            {status && <p role="status">{status}</p>}
          </div>
        )}
      </section>
    </div>
  );
}
