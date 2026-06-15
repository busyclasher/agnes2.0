"use client";

import {useEffect, useState} from "react";

import {
  generatePictogram,
  SafePointApiError,
  scanSafetyImage,
} from "@/lib/api";
import type {
  PictogramResponse,
  ScanResult,
  SupportedLanguage,
} from "@/lib/types";
import {CameraCapture} from "@/components/CameraCapture";
import {IncidentReportForm} from "@/components/IncidentReportForm";
import {CoreFeatures} from "@/components/CoreFeatures";
import {DailyBriefingForm} from "@/components/DailyBriefingForm";
import {ResultCard} from "@/components/ResultCard";
import {ScanProgress} from "@/components/ScanProgress";

type ScanState =
  | "idle"
  | "captured"
  | "scanning"
  | "result"
  | "recoverable-error"
  | "fatal-error";

const DEMO_LANGUAGE: SupportedLanguage = "Tamil";
const SAMPLES = [
  {file: "fall-hazard.png", label: "Open edge", detail: "Red danger"},
  {file: "chemical-warning.png", label: "Corrosive chemical", detail: "Red danger"},
  {file: "ppe-required.png", label: "PPE required", detail: "Yellow caution"},
];

export function SafetyApp() {
  const language = DEMO_LANGUAGE;
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [pictogram, setPictogram] = useState<PictogramResponse | null>(null);
  const [pictogramLoading, setPictogramLoading] = useState(false);
  const [pictogramError, setPictogramError] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [briefingOpen, setBriefingOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function selectFile(nextFile: File) {
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setResult(null);
    setPictogram(null);
    setError("");
    setScanState("captured");
  }

  async function chooseSample(name: string) {
    setError("");
    try {
      const response = await fetch(`/samples/${name}`);
      if (!response.ok) throw new Error("sample missing");
      const blob = await response.blob();
      selectFile(new File([blob], name, {type: "image/png"}));
    } catch {
      setError("The demo sample could not be loaded.");
      setScanState("fatal-error");
    }
  }

  async function analyze() {
    if (!file) return;
    setScanState("scanning");
    setError("");
    setPictogram(null);
    try {
      const scan = await scanSafetyImage(file, language);
      setResult(scan);
      setScanState("result");
      void loadPictogram(scan);
    } catch (caught) {
      const apiError = caught instanceof SafePointApiError ? caught : null;
      setError(apiError?.message ?? "SafePoint could not analyse this image.");
      setScanState(apiError?.recoverable ? "recoverable-error" : "fatal-error");
    }
  }

  async function loadPictogram(scan: ScanResult) {
    setPictogramLoading(true);
    setPictogramError(null);
    try {
      setPictogram(
        await generatePictogram({
          scanId: scan.scan_id,
          riskLevel: scan.risk_level,
          hazardType: scan.hazard_type,
          language: scan.language,
          actionSteps: scan.action_steps.map((step) => step.label),
        }),
      );
    } catch (caught) {
      setPictogramError(
        caught instanceof SafePointApiError
          ? caught.message
          : "The pictogram could not be created.",
      );
    } finally {
      setPictogramLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setPreviewUrl("");
    setResult(null);
    setPictogram(null);
    setPictogramError(null);
    setError("");
    setScanState("idle");
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#" aria-label="SafePoint home">
          <span className="brand-mark" aria-hidden="true">+</span>
          <span>SafePoint</span>
        </a>
        <span className="worker-mode">Worker mode</span>
      </header>

      <div className="app-shell">
        {scanState !== "result" && (
          <section className="intro">
            <p className="eyebrow">Point-of-risk guidance</p>
            <h1>Understand the warning. Know what to do.</h1>
            <p>
              Scan a construction sign or label for simple guidance in your
              language.
            </p>
          </section>
        )}

        {(scanState === "idle" ||
          scanState === "captured" ||
          scanState === "recoverable-error" ||
          scanState === "fatal-error") && (
          <section className="capture-card">
            <div className="language-field" aria-label="Worker language">
              <span>Your language</span>
              <strong>Tamil</strong>
            </div>

            {previewUrl ? (
              <div className="capture-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Selected safety sign preview" />
                <button type="button" onClick={reset}>Remove</button>
              </div>
            ) : (
              <CameraCapture onFileSelected={selectFile} />
            )}

            {file && (
              <button className="button primary full" type="button" onClick={analyze}>
                Analyse safety sign
              </button>
            )}

            {error && (
              <div className="error-panel" role="alert">
                <strong>We could not complete that scan.</strong>
                <p>{error}</p>
                {scanState === "recoverable-error" && (
                  <button type="button" onClick={reset}>Retake photo</button>
                )}
              </div>
            )}
          </section>
        )}

        {scanState === "idle" && (
          <>
            <section className="quick-tools" aria-label="Worker safety tools">
              <button type="button" onClick={() => setBriefingOpen(true)}>
                <span aria-hidden="true">▶</span>
                <span>
                  <strong>Today’s safety briefing</strong>
                  <small>Generate site-specific audio guidance</small>
                </span>
              </button>
              <button type="button" onClick={() => setReportOpen(true)}>
                <span aria-hidden="true">!</span>
                <span>
                  <strong>Report an incident</strong>
                  <small>Create a draft before sharing</small>
                </span>
              </button>
            </section>
            <section className="samples-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Reliable demo</p>
                  <h2>Try a sample sign</h2>
                </div>
                <span>3 examples</span>
              </div>
              <div className="sample-grid">
                {SAMPLES.map((sample) => (
                  <button
                    className="sample-card"
                    type="button"
                    key={sample.file}
                    onClick={() => chooseSample(sample.file)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/samples/${sample.file}`} alt="" />
                    <span>
                      <strong>{sample.label}</strong>
                      <small>{sample.detail}</small>
                    </span>
                  </button>
                ))}
              </div>
            </section>
            <CoreFeatures />
          </>
        )}

        {scanState === "scanning" && <ScanProgress />}

        {scanState === "result" && result && (
          <ResultCard
            result={result}
            language={language}
            previewUrl={previewUrl}
            pictogram={pictogram}
            pictogramLoading={pictogramLoading}
            pictogramError={pictogramError}
            onRetake={reset}
            onReport={() => setReportOpen(true)}
          />
        )}
      </div>

      <footer>
        SafePoint complements official training and site procedures. Ask your
        supervisor whenever guidance is unclear.
      </footer>

      {reportOpen && (
        <IncidentReportForm
          language={language}
          onClose={() => setReportOpen(false)}
        />
      )}
      {briefingOpen && (
        <DailyBriefingForm
          language={language}
          onClose={() => setBriefingOpen(false)}
        />
      )}
    </main>
  );
}
