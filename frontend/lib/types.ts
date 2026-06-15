export type RiskLevel = "green" | "yellow" | "red" | "unknown";
export type SourceState = "live" | "cache" | "sample" | "fallback";
export type SupportedLanguage = "Bengali" | "Tamil" | "Hindi";

export type SafetyActionStep = {
  label: string;
  priority: "low" | "medium" | "high";
};

export type PpeItem = {
  name: string;
  icon: string;
  required: boolean;
};

export type ScanResult = {
  scan_id: string;
  language: SupportedLanguage;
  detected_text: string;
  translated_text: string;
  plain_explanation: string;
  risk_level: RiskLevel;
  risk_label: string;
  risk_reason: string;
  hazard_type: string;
  ppe_required: PpeItem[];
  action_steps: SafetyActionStep[];
  audio_text: string;
  confidence: number;
  uncertainty_note: string;
  pictogram_prompt: string;
  source_state: SourceState;
};

export type PictogramResponse = {
  image_url: string;
  alt_text: string;
  source_state: SourceState;
};

export type IncidentReport = {
  report_id: string;
  english_report: string;
  worker_language_summary: string;
  incident_type: string;
  severity: string;
  suggested_next_step: string;
  requires_confirmation: true;
  source_state: SourceState;
};

export type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
    recoverable: boolean;
  };
};
