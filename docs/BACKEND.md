# SafePoint Backend Guide

## Backend Goal

The backend coordinates image processing, Agnes AI calls, safety reasoning, response normalization, privacy controls, and demo fallback.

## Core Responsibilities

- Receive scanned image
- Validate file type and size
- Send image to Agnes AI vision
- Extract sign/label text
- Translate and simplify
- Classify risk
- Generate PPE/action steps
- Generate pictogram prompt or image
- Generate worker-requested multilingual audio guidance
- Draft incident reports
- Add deterministic MOM workflow review guidance
- Keep incident output as an unsubmitted supervisor handoff
- Target 30-second briefings in the selected language
- Return structured responses
- Avoid storing images by default

## Suggested Backend Structure

```text
backend/
  api/
    routes/
      health.py
      scan.py
      reports.py
      briefing.py
  services/
    agnes/
      client.py
      vision.py
      text.py
      image_gen.py
      video_gen.py
    safety/
      classifier.py
      ppe_rules.py
      prompts.py
    privacy/
      storage.py
      logging.py
    fallback/
      sample_responses.py
  models/
    scan.py
    report.py
    briefing.py
```

## Core Endpoints

| Endpoint | Method | Purpose |
|---|---:|---|
| `/health` | GET | Health check |
| `/api/scan-safety-image` | POST | Analyse sign/label image |
| `/api/generate-pictogram-card` | POST | Generate visual safety card |
| `/api/generate-audio-guidance` | POST | Stream selected-language MP3 guidance |
| `/api/generate-incident-report` | POST | Draft incident/near-miss report |
| `/api/generate-briefing` | POST | Generate daily site briefing |

## Safety Scan Pipeline

```text
Validate image
  → Agnes vision OCR/context
  → Safety prompt
  → Translation
  → Plain-language simplification
  → Risk classification
  → PPE/action step generation
  → Pictogram prompt generation
  → Structured JSON response
```

## Risk Classification

Return one of:

- `green`
- `yellow`
- `red`
- `unknown`

Use `unknown` when the image is too unclear.

## Backend Safety Rules

- Do not make official legal/safety determinations.
- Use conservative wording.
- Return uncertainty notes.
- Ask user to retake if image is blurry.
- Recommend checking with supervisor if unclear.
- Never tell worker to ignore official site procedures.

## Privacy Rules

- Do not store scanned images by default.
- Delete temporary files after processing when possible.
- Do not log raw images or base64 strings.
- Do not log sensitive worker information unnecessarily.
- Do not log audio transcripts, provider credentials, or generated audio bytes.
- Do not persist or cache generated audio; return it with `Cache-Control: no-store`.
- Tell workers that cloud audio sends the visible transcript to ElevenLabs.
- Reports must require confirmation before sharing.
- The model must not decide MOM reportability.
- MOM review priority is derived from worker-selected facts.
- Briefing audio must exactly match the visible transcript.
- Agnes API key must remain backend-only.

## Fallback Strategy

If Agnes API fails:

1. Check if sample image matches demo image.
2. Return sample response.
3. Mark `source_state: "fallback"`.
4. Show user-facing warning:
   - “Using demo fallback result.”

Do not pretend fallback output is live.

## Error Response Format

```json
{
  "error": {
    "code": "IMAGE_TOO_BLURRY",
    "message": "I could not clearly read this sign. Please retake the photo closer and straight-on.",
    "recoverable": true
  }
}
```

## Suggested Error Codes

- `INVALID_IMAGE`
- `IMAGE_TOO_LARGE`
- `IMAGE_TOO_BLURRY`
- `AGNES_API_ERROR`
- `LOW_CONFIDENCE`
- `UNSUPPORTED_LANGUAGE`
- `FALLBACK_USED`

## Definition of Done

- [ ] Health endpoint works.
- [ ] Scan endpoint accepts image.
- [x] Agnes client wrapper exists.
- [ ] Scan response follows API contract.
- [ ] Fallback sample response works.
- [ ] No API keys exposed.
- [ ] No raw image data logged.
