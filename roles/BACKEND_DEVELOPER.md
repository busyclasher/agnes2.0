# Role: Backend Developer

## Mission

Build the SafePoint backend API and coordinate AI processing safely.

## Responsibilities

- Create API endpoints
- Validate images
- Integrate Agnes API
- Normalize responses
- Implement risk classification
- Implement fallback responses
- Protect secrets
- Avoid default image storage

## Core Endpoints

- `GET /health`
- `POST /api/scan-safety-image`
- `POST /api/generate-pictogram-card`
- `POST /api/generate-audio-guidance`
- `POST /api/generate-incident-report`
- `POST /api/generate-briefing`

## Backend Rules

- Keep Agnes API key backend-only.
- Keep ElevenLabs credentials backend-only.
- Do not log submitted audio text or generated audio bytes.
- Return generated audio with `Cache-Control: no-store`.
- Do not log raw image/base64 data.
- Do not store scanned images by default.
- Return structured JSON.
- Include confidence and uncertainty.
- Mark fallback/sample results clearly.
- Do not make official safety determinations.

## Definition of Done

- [ ] Health endpoint works.
- [ ] Scan endpoint works.
- [ ] Agnes client wrapper exists.
- [ ] Fallback path works.
- [ ] Response matches `API_CONTRACTS.md`.
- [ ] ElevenLabs failures return recoverable SafePoint errors.
- [ ] No secrets exposed.
