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
  const [occurredAt, setOccurredAt] = useState(currentLocalDateTime());
  const [eventType, setEventType] = useState<
    | "near_miss"
    | "unsafe_condition"
    | "injury_or_illness"
    | "major_equipment_or_structure_event"
    | "unsure"
  >("near_miss");
  const [medicalOutcome, setMedicalOutcome] = useState<
    | "none_known"
    | "first_aid"
    | "outpatient_or_hospitalisation_leave"
    | "light_duty"
    | "hospital_treatment"
    | "death"
    | "unsure"
  >("none_known");
  const [peopleAffected, setPeopleAffected] = useState(0);
  const [immediateActions, setImmediateActions] = useState("");
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
          occurredAt,
          eventType,
          medicalOutcome,
          peopleAffected,
          immediateActions,
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
        "Status: Worker-confirmed draft for supervisor review. Not submitted to MOM.",
        `Date and time: ${occurredAt}`,
        `Location: ${location}`,
        `Type: ${report.incident_type}`,
        `Severity: ${report.severity}`,
        `People affected: ${peopleAffected}`,
        `Medical outcome: ${medicalOutcome.replaceAll("_", " ")}`,
        "",
        report.english_report,
        "",
        report.worker_language_summary,
        "",
        `Suggested next step: ${report.suggested_next_step}`,
        `MOM workflow priority: ${report.mom_workflow.review_priority}`,
        report.mom_workflow.reportability_note,
        report.mom_workflow.responsible_party_note,
        report.mom_workflow.deadline_note,
        "",
        "Information still required for an official report:",
        ...report.mom_workflow.missing_official_fields.map(
          (item) => `- ${item}`,
        ),
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
        <h1 id="report-title">Prepare a supervisor handoff</h1>
        {!report ? (
          <form onSubmit={submit}>
            <div className="form-grid">
              <label>
                Date and time
                <input
                  type="datetime-local"
                  value={occurredAt}
                  onChange={(event) => setOccurredAt(event.target.value)}
                  required
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
            </div>
            <label>
              What kind of event was it?
              <select
                value={eventType}
                onChange={(event) =>
                  setEventType(event.target.value as typeof eventType)
                }
              >
                <option value="near_miss">Near miss</option>
                <option value="unsafe_condition">Unsafe condition</option>
                <option value="injury_or_illness">Injury or illness</option>
                <option value="major_equipment_or_structure_event">
                  Major equipment or structure event
                </option>
                <option value="unsure">Not sure</option>
              </select>
            </label>
            <div className="form-grid">
              <label>
                Known medical outcome
                <select
                  value={medicalOutcome}
                  onChange={(event) =>
                    setMedicalOutcome(
                      event.target.value as typeof medicalOutcome,
                    )
                  }
                >
                  <option value="none_known">None known</option>
                  <option value="first_aid">First aid</option>
                  <option value="outpatient_or_hospitalisation_leave">
                    Outpatient or hospitalisation leave
                  </option>
                  <option value="light_duty">Light duty</option>
                  <option value="hospital_treatment">Hospital treatment</option>
                  <option value="death">Death</option>
                  <option value="unsure">Not sure</option>
                </select>
              </label>
              <label>
                People affected
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={peopleAffected}
                  onChange={(event) =>
                    setPeopleAffected(Number(event.target.value))
                  }
                  required
                />
              </label>
            </div>
            <label>
              What happened? Use {language} if preferred.
              <textarea
                value={statement}
                onChange={(event) => setStatement(event.target.value)}
                required
                minLength={3}
                placeholder="Describe what you saw or what happened."
              />
            </label>
            <label>
              What was done immediately?
              <textarea
                value={immediateActions}
                onChange={(event) => setImmediateActions(event.target.value)}
                placeholder="For example: stopped work and warned the supervisor"
              />
            </label>
            <p className="privacy-copy">
              Do not enter NRIC, FIN, phone numbers or medical documents here.
              This creates a draft for supervisor review. It is not an MOM
              submission and SafePoint does not automatically save or send it.
            </p>
            {error && <p className="error-message">{error}</p>}
            <button className="button primary full" disabled={loading}>
              {loading ? "Creating draft…" : "Create report draft"}
            </button>
          </form>
        ) : (
          <div className="report-draft">
            <div className="section-heading">
              <div>
                <p className="eyebrow">MOM workflow support</p>
                <h2>Review before sharing</h2>
              </div>
              <SourceStatePill state={report.source_state} />
            </div>
            <div
              className={`workflow-priority priority-${report.mom_workflow.review_priority}`}
            >
              <strong>
                {report.mom_workflow.review_priority.toUpperCase()} supervisor
                review
              </strong>
              <p>{report.mom_workflow.reportability_note}</p>
              <p>{report.mom_workflow.deadline_note}</p>
            </div>
            <dl>
              <dt>English report</dt>
              <dd className="pre-line">{report.english_report}</dd>
              <dt>{language} copy</dt>
              <dd>{report.worker_language_summary}</dd>
              <dt>Suggested next step</dt>
              <dd>{report.suggested_next_step}</dd>
            </dl>
            <div className="official-fields">
              <strong>Still needed for an official MOM report</strong>
              <ul>
                {report.mom_workflow.missing_official_fields.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p>{report.mom_workflow.responsible_party_note}</p>
              <a
                href="https://www.mom.gov.sg/workplace-safety-and-health/work-accident-reporting"
                target="_blank"
                rel="noreferrer"
              >
                Check the official MOM reporting workflow
              </a>
            </div>
            <label className="confirm-row">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              I reviewed this worker draft and confirm it reflects what I
              reported. I understand it has not been submitted to MOM.
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

function currentLocalDateTime(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
