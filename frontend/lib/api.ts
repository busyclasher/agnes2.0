import type {
  ApiErrorPayload,
  IncidentReport,
  PictogramResponse,
  RiskLevel,
  ScanResult,
  SupportedLanguage,
} from "@/lib/types";

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

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
      }),
    }),
  );
}

export async function generateIncidentReport(input: {
  language: SupportedLanguage;
  workerStatement: string;
  location: string;
}): Promise<IncidentReport> {
  return parseResponse<IncidentReport>(
    await fetch(`${BACKEND_URL}/api/generate-incident-report`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        language: input.language,
        worker_statement: input.workerStatement,
        location: input.location,
      }),
    }),
  );
}

export function assetUrl(path: string): string {
  return path.startsWith("http") ? path : `${BACKEND_URL}${path}`;
}
