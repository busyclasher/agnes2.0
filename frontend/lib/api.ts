import type {
  ApiErrorPayload,
  DailyBriefing,
  IncidentReport,
  PictogramResponse,
  RiskLevel,
  ScanResult,
  SupportedLanguage,
  TranscriptResponse,
} from "@/lib/types";

export const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
).replace(/\/+$/, "");

export class SafePointApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable: boolean,
  ) {
    super(message);
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T | ApiErrorPayload;
  if (!response.ok) {
    const error = payload as ApiErrorPayload;
    throw new SafePointApiError(
      error.error?.message ?? "SafePoint could not complete the request.",
      error.error?.code ?? "UNKNOWN_ERROR",
      error.error?.recoverable ?? false,
    );
  }
  return payload as T;
}

async function parseBlobResponse(response: Response): Promise<Blob> {
  if (response.ok) return response.blob();
  let error: ApiErrorPayload | null = null;
  try {
    error = (await response.json()) as ApiErrorPayload;
  } catch {
    error = null;
  }
  throw new SafePointApiError(
    error?.error?.message ?? "SafePoint could not complete the request.",
    error?.error?.code ?? "UNKNOWN_ERROR",
    error?.error?.recoverable ?? false,
  );
}

export async function scanSafetyImage(
  image: File,
  language: SupportedLanguage,
): Promise<ScanResult> {
  const form = new FormData();
  form.append("image", image);
  form.append("language", language);
  form.append("site_context", "construction");
  form.append("mode", "scan");
  return parseResponse<ScanResult>(
    await fetch(`${BACKEND_URL}/api/scan-safety-image`, {
      method: "POST",
      body: form,
    }),
  );
}

export async function generatePictogram(input: {
  scanId: string;
  riskLevel: RiskLevel;
  hazardType: string;
  language: SupportedLanguage;
  actionSteps: string[];
  detectedText: string;
  plainExplanation: string;
  riskReason: string;
  pictogramPrompt: string;
}): Promise<PictogramResponse> {
  return parseResponse<PictogramResponse>(
    await fetch(`${BACKEND_URL}/api/generate-pictogram-card`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        scan_id: input.scanId,
        risk_level: input.riskLevel,
        hazard_type: input.hazardType,
        language: input.language,
        action_steps: input.actionSteps,
        detected_text: input.detectedText,
        plain_explanation: input.plainExplanation,
        risk_reason: input.riskReason,
        pictogram_prompt: input.pictogramPrompt,
      }),
    }),
  );
}

export async function generateIncidentReport(input: {
  language: SupportedLanguage;
  workerStatement: string;
  location: string;
  occurredAt: string;
  eventType:
    | "near_miss"
    | "unsafe_condition"
    | "injury_or_illness"
    | "major_equipment_or_structure_event"
    | "unsure";
  medicalOutcome:
    | "none_known"
    | "first_aid"
    | "outpatient_or_hospitalisation_leave"
    | "light_duty"
    | "hospital_treatment"
    | "death"
    | "unsure";
  peopleAffected: number;
  immediateActions: string;
}): Promise<IncidentReport> {
  return parseResponse<IncidentReport>(
    await fetch(`${BACKEND_URL}/api/generate-incident-report`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        language: input.language,
        worker_statement: input.workerStatement,
        location: input.location,
        occurred_at: input.occurredAt,
        event_type: input.eventType,
        medical_outcome: input.medicalOutcome,
        people_affected: input.peopleAffected,
        immediate_actions: input.immediateActions,
      }),
    }),
  );
}

export async function generateGuidanceSpeech(input: {
  text: string;
  language: SupportedLanguage;
}): Promise<Blob> {
  return parseBlobResponse(
    await fetch(`${BACKEND_URL}/api/speech/guidance`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        text: input.text,
        language: input.language,
      }),
    }),
  );
}

export async function transcribeIncidentAudio(input: {
  audio: Blob;
  language: SupportedLanguage;
}): Promise<TranscriptResponse> {
  const form = new FormData();
  const extension = input.audio.type.includes("mp4") ? "m4a" : "webm";
  form.append("audio", input.audio, `incident-memo.${extension}`);
  form.append("language", input.language);
  return parseResponse<TranscriptResponse>(
    await fetch(`${BACKEND_URL}/api/speech/transcribe`, {
      method: "POST",
      body: form,
    }),
  );
}

export async function generateDailyBriefing(input: {
  language: SupportedLanguage;
  siteZone: string;
  todayTasks: string[];
  hazards: string[];
  requiredPpe: string[];
}): Promise<DailyBriefing> {
  return parseResponse<DailyBriefing>(
    await fetch(`${BACKEND_URL}/api/generate-briefing`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        language: input.language,
        site_zone: input.siteZone,
        today_tasks: input.todayTasks,
        hazards: input.hazards,
        required_ppe: input.requiredPpe,
      }),
    }),
  );
}

export async function generateAudioGuidance(input: {
  text: string;
  language: SupportedLanguage;
}): Promise<Blob> {
  const response = await fetch(`${BACKEND_URL}/api/generate-audio-guidance`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      // Keep the generic error when a proxy returns a non-JSON failure page.
    }
    throw new SafePointApiError(
      payload?.error?.message ?? "Cloud audio could not be generated.",
      payload?.error?.code ?? "AUDIO_ERROR",
      payload?.error?.recoverable ?? true,
    );
  }
  return response.blob();
}

export function assetUrl(path: string): string {
  return path.startsWith("http") || path.startsWith("data:")
    ? path
    : `${BACKEND_URL}${path}`;
}
