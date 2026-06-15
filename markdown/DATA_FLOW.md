# SafePoint Data Flow

## Overview

SafePoint turns camera input into safety comprehension.

```text
Image input
  → OCR / vision understanding
  → translation
  → simplification
  → risk classification
  → action guidance
  → pictogram generation
  → audio guidance
  → save/report
```

## Input Types

SafePoint can accept:

- camera photo
- uploaded image
- demo sample image
- worker voice/text statement
- supervisor briefing text

## Main Scan Flow

```text
1. Worker selects language.
2. Worker scans sign or label.
3. Frontend uploads image to backend.
4. Backend validates image.
5. Agnes vision extracts text and visual context.
6. Agnes reasoning simplifies and translates.
7. Safety classifier assigns risk level.
8. Backend returns structured scan result.
9. Frontend displays risk card.
10. Frontend plays audio guidance.
11. User can save, retake, or report.
```

## Incident Report Flow

```text
Worker speaks/types incident
  → backend receives statement
  → Agnes translates and structures it
  → report draft is created
  → user reviews
  → user confirms save/share
```

## Daily Briefing Flow

```text
Supervisor enters today’s risks
  → Agnes generates simple briefing
  → image/video prompt generated
  → workers receive multilingual summary
```

## Source State

Every result should include:

- `live`
- `cache`
- `sample`
- `fallback`

Example:

```json
{
  "source_state": "sample",
  "source_label": "Demo fallback response"
}
```

## Privacy Flow

Default:

```text
Image uploaded
  → temporary processing
  → result returned
  → image deleted
```

Only store scan/report data if user explicitly saves it.

## Data Minimisation

Do not collect:

- worker identity unless needed
- live location unless user chooses to add it
- continuous camera feed
- employer analytics without governance
- hidden device tracking

## Confidence Flow

If image is clear:

```text
show risk result + confidence note
```

If image is unclear:

```text
show unknown risk + retake prompt
```

Do not force a red/yellow/green answer when the image cannot be read.
