# SafePoint Architecture

## System Overview

SafePoint is a camera-first, AI-assisted safety comprehension tool.

The system consists of:

- Frontend worker app
- Backend API layer
- Agnes AI integration layer
- Pictogram generation service
- Text-to-speech/audio service
- Optional incident report storage
- Demo fallback/sample response layer

## High-Level Flow

```text
Worker camera/image input
  → Frontend capture/upload
  → Backend image validation
  → Agnes vision OCR + context extraction
  → Agnes reasoning risk classification
  → Translation + simplification
  → Pictogram prompt/card generation
  → Audio guidance text
  → Frontend risk card display
  → Save/report action
```

## Suggested Repo Structure

```text
safepoint/
  frontend/
    app/
    components/
      camera/
      risk-card/
      audio/
      pictogram/
      incident/
      briefing/
    lib/
      api.ts
      types.ts
      speech.ts
  backend/
    api/
      routes/
    services/
      agnes/
      safety/
      translation/
      pictogram/
      reports/
      privacy/
    models/
    tests/
  data/
    sample-signs/
    sample-responses/
  docs/
    README.md
    PRODUCT_BRIEF.md
    AGENTS.md
```

## Frontend Responsibilities

- Camera capture or image upload
- Language selector
- Loading/progress states
- Risk card display
- Native-language explanation display
- Audio playback
- Pictogram card display
- Retake option
- Incident report input
- Source/fallback state visibility

## Backend Responsibilities

- Validate image type and size
- Send image to Agnes AI
- Normalize OCR and visual understanding output
- Translate and simplify into selected language
- Classify risk
- Generate action steps and PPE guidance
- Generate pictogram prompt or image
- Generate incident report drafts
- Avoid default storage
- Provide fallback responses for demo reliability

## AI Responsibilities

- Extract text and visual context
- Translate safely
- Simplify technical safety language
- Classify severity
- Suggest PPE/action steps
- Generate low-literacy visual prompts/cards
- Draft incident reports from worker-language input
- Communicate uncertainty clearly

## Data Entities

### SafetyScanResult

```json
{
  "scan_id": "scan_001",
  "detected_text": "Danger: Open Edge. Wear Safety Harness.",
  "language": "Bengali",
  "translated_text": "...",
  "plain_explanation": "There is danger of falling from height.",
  "risk_level": "red",
  "risk_reason": "Fall hazard detected.",
  "ppe_required": ["helmet", "safety harness"],
  "action_steps": [],
  "confidence": 0.86,
  "uncertainty_note": "The sign is readable.",
  "source_state": "live"
}
```

### IncidentReportDraft

```json
{
  "report_id": "report_001",
  "incident_type": "slip_trip_fall",
  "severity": "near_miss",
  "worker_language_summary": "...",
  "english_report": "...",
  "location": "Level 3 staircase",
  "requires_confirmation": true
}
```

## Reliability Strategy

- Provide sample sign images.
- Provide sample fallback responses.
- Mark fallback/sample data clearly.
- Keep camera flow working without live API during demo.
- Avoid blocking the whole app if pictogram generation fails.
- Show text guidance even if image generation fails.

## Privacy Strategy

- Do not store scanned images by default.
- Avoid worker tracking.
- Avoid automatic employer sharing.
- Confirm before saving or reporting.
- Keep Agnes API key backend-only.
