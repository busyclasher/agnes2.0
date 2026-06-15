# SafePoint API Contracts

## Base URL

Local backend:

```text
http://localhost:8000
```

Frontend should read:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Common Types

```ts
type RiskLevel = "green" | "yellow" | "red" | "unknown";
type SourceState = "live" | "cache" | "sample" | "fallback";

type SafetyActionStep = {
  label: string;
  priority: "low" | "medium" | "high";
};

type PpeItem = {
  name: string;
  icon: string;
  required: boolean;
};

type Uncertainty = {
  confidence: number;
  note: string;
};
```

## POST /api/scan-safety-image

Purpose: Analyse a scanned safety sign, label, notice, or equipment warning.

### Request

Send `multipart/form-data`:

| Field | Type | Value |
|---|---|---|
| `image` | file | JPEG, PNG, or WebP up to 10 MB |
| `language` | string | `Bengali`, `Tamil`, or `Hindi` |
| `site_context` | string | `construction` |
| `mode` | string | `scan` |

### Response

```json
{
  "scan_id": "scan_001",
  "language": "Bengali",
  "detected_text": "Danger: Open Edge. Wear Safety Harness. No Unauthorized Entry.",
  "translated_text": "native-language translation",
  "plain_explanation": "There is danger of falling from height.",
  "risk_level": "red",
  "risk_label": "Danger",
  "risk_reason": "Fall hazard and restricted area warning detected.",
  "ppe_required": [
    {
      "name": "helmet",
      "icon": "helmet",
      "required": true
    },
    {
      "name": "safety harness",
      "icon": "harness",
      "required": true
    }
  ],
  "action_steps": [
    {
      "label": "Do not enter unless authorised.",
      "priority": "high"
    },
    {
      "label": "Wear a safety harness.",
      "priority": "high"
    },
    {
      "label": "Ask your supervisor if unsure.",
      "priority": "medium"
    }
  ],
  "audio_text": "Danger. This area has a fall hazard. Do not enter unless authorised. Wear your safety harness.",
  "confidence": 0.86,
  "uncertainty_note": "The sign is partly angled but readable.",
  "pictogram_prompt": "Create a simple safety card showing a fall hazard, no entry sign, helmet, and safety harness.",
  "source_state": "live"
}
```

## POST /api/generate-pictogram-card

Purpose: Generate or retrieve a visual safety card.

### Request

```json
{
  "scan_id": "scan_001",
  "risk_level": "red",
  "hazard_type": "fall_hazard",
  "language": "Bengali",
  "action_steps": [
    "Do not enter unless authorised.",
    "Wear a safety harness."
  ]
}
```

### Response

```json
{
  "image_url": "string",
  "alt_text": "Red danger card showing fall hazard, no entry, helmet, and harness icons.",
  "source_state": "live"
}
```

## POST /api/generate-audio-guidance

Purpose: Generate worker-requested MP3 guidance from the exact visible
selected-language transcript.

### Request

```json
{
  "text": "selected-language safety guidance",
  "language": "Bengali"
}
```

`text` is trimmed and must contain between 1 and 2,000 characters.

### Success

```text
200 audio/mpeg
Cache-Control: no-store
X-Audio-Source: elevenlabs
```

Audio bytes are returned directly and are not persisted by SafePoint.
Provider failures use the common recoverable JSON error response.

## POST /api/generate-incident-report

Purpose: Convert a worker-language statement into a structured incident or near-miss report.

### Request

```json
{
  "language": "Tamil",
  "worker_statement": "I slipped near the wet staircase on Level 3.",
  "location": "Level 3 staircase",
  "image_id": "optional"
}
```

### Response

```json
{
  "report_id": "report_001",
  "english_report": "A near-miss slip incident occurred near the wet staircase on Level 3.",
  "worker_language_summary": "translated copy",
  "incident_type": "slip_trip_fall",
  "severity": "near_miss",
  "suggested_next_step": "Notify the supervisor and mark the wet area.",
  "requires_confirmation": true,
  "source_state": "live"
}
```

## POST /api/generate-briefing

Purpose: Generate a short site-specific multilingual safety briefing.

### Request

```json
{
  "language": "Bengali",
  "site_zone": "Level 3",
  "today_tasks": ["work near open edge", "scaffolding inspection"],
  "hazards": ["fall hazard", "moving materials"]
}
```

### Response

```json
{
  "briefing_text": "Today you are working near an open edge...",
  "audio_text": "Today you are working near an open edge...",
  "video_prompt": "Create a 30-second safety briefing...",
  "pictogram_prompt": "Create a simple briefing card...",
  "source_state": "live"
}
```

## Error Response

```json
{
  "error": {
    "code": "LOW_CONFIDENCE",
    "message": "I am not fully sure what this sign says. Please retake the photo closer and clearer.",
    "recoverable": true
  }
}
```

## Contract Rules

- Always include `source_state`.
- Always include confidence or uncertainty for safety scan results.
- Use `unknown` if risk cannot be classified.
- Do not return hidden chain-of-thought.
- Add optional fields instead of breaking existing fields.
- Incident reports must include `requires_confirmation: true`.
- Audio generation must require explicit worker action and use the visible
  transcript verbatim.
