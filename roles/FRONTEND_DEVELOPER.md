# Role: Frontend Developer

## Mission

Build the camera-first SafePoint interface and connect it to the backend API.

## Responsibilities

- Implement camera/upload flow
- Build language selector
- Build scan progress UI
- Build risk result card
- Build audio playback controls
- Show pictogram card
- Build incident report form
- Handle loading, error, fallback states

## Main Components

- `CameraCapture`
- `LanguageSelector`
- `ScanProgress`
- `RiskBadge`
- `SafetyResultCard`
- `PpeIconList`
- `AudioGuidanceButton`
- `PictogramCard`
- `IncidentReportForm`
- `ConfidenceNote`

## API Endpoints

- `POST /api/scan-safety-image`
- `POST /api/generate-pictogram-card`
- `POST /api/generate-incident-report`
- `POST /api/generate-briefing`

## Frontend Rules

- Use `NEXT_PUBLIC_BACKEND_URL`.
- Do not expose Agnes API key.
- Show `source_state` if fallback/sample data is used.
- Always show retake option.
- Always show uncertainty note if confidence is low.
- Do not rely only on colour for risk.

## Definition of Done

- [ ] Camera/upload works.
- [ ] API call works.
- [ ] Risk card renders.
- [ ] Audio text can be played or simulated.
- [ ] Pictogram card renders.
- [ ] Incident report draft renders.
- [ ] Error and fallback states exist.
