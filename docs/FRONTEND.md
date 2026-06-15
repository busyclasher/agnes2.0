# SafePoint Frontend Guide

## Frontend Goal

Build a camera-first, worker-friendly interface that helps users quickly understand safety information.

The frontend should feel:

- immediate
- simple
- high-contrast
- low-literacy friendly
- audio-supported
- calm under pressure

## Main Screens

### 1. Home Screen

Primary actions:

- Scan Sign / Label
- Today’s Safety Briefing
- Report Incident
- Saved Cards

Important UI details:

- Large buttons
- Language selector visible
- Minimal text
- Clear icons

### 2. Camera / Upload Screen

Functions:

- Open camera
- Upload sample image for demo
- Show scan instructions
- Retake photo
- Continue to analysis

Suggested copy:

> “Point your camera at a safety sign or label.”

### 3. Scan Loading Screen

Show simple progress:

- Reading sign
- Translating
- Checking risk
- Creating safety card

Avoid technical language such as “OCR inference running.”

### 4. Scan Result Screen

Display:

- captured image preview
- detected text
- translated explanation
- risk level badge
- action steps
- PPE icons
- audio playback
- pictogram card
- save/report buttons
- confidence note

### 5. Incident Report Screen

Inputs:

- voice/text statement
- language
- location
- optional photo

Outputs:

- worker-language summary
- English report
- incident type
- suggested next step
- MOM workflow review priority
- official information still required
- save/share confirmation

### 6. Daily Briefing Screen

Optional stretch:

- today’s site risks
- 30-second selected-language audio briefing
- pictogram summary

## Component Suggestions

```text
components/
  CameraCapture.tsx
  LanguageSelector.tsx
  ScanProgress.tsx
  RiskBadge.tsx
  SafetyResultCard.tsx
  PpeIconList.tsx
  AudioGuidanceButton.tsx
  PictogramCard.tsx
  IncidentReportForm.tsx
  ConfidenceNote.tsx
  SourceStatePill.tsx
```

## Frontend Data Flow

```text
CameraCapture
  → api.scanSafetyImage()
  → ScanProgress
  → SafetyResultCard
  → AudioGuidanceButton
  → PictogramCard
```

## UI Rules

- Use large touch targets.
- Avoid dense paragraphs.
- Use icon + text together.
- Make risk colour obvious, but do not rely only on colour.
- Always include text label: Green, Yellow, Red.
- Always provide retake option.
- Show uncertainty clearly.
- Show fallback/sample state when used.

## Accessibility Rules

- Buttons must have labels.
- Audio guidance must have visible transcript.
- High contrast required.
- No hover-only controls.
- Keyboard navigation should work for demo.
- Critical instructions should be readable and spoken.
- Do not hide safety guidance behind complex menus.

## Suggested Risk Colours

Use the labels regardless of final colours:

- Green: informational
- Yellow: caution
- Red: danger

Do not rely only on colour because some users may have colour-vision differences.

## API Endpoints

Frontend should consume:

- `POST /api/scan-safety-image`
- `POST /api/generate-pictogram-card`
- `POST /api/generate-incident-report`
- `POST /api/generate-briefing`
- `GET /health`

## Environment Variables

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Never expose Agnes API keys in frontend code.

Label report output as a supervisor handoff, not an MOM submission. Keep the
briefing transcript and spoken audio identical.

## Demo Requirements

- Include at least 3 sample images:
  - fall hazard sign
  - chemical warning label
  - PPE notice
- Include fallback demo mode.
- Show source state if sample data is used.
