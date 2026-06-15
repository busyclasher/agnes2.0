# Agent Instructions

This project is **SafePoint**.

## Product Direction

SafePoint is a worker-side construction safety translator.

It helps frontline workers instantly understand site signs, labels, hazards, and safety instructions in their own language using camera-based AI, risk grading, pictogram generation, and audio guidance.

The product is not a generic translation app.

The product is not a safety-officer dashboard first.

The product is a **point-of-risk safety comprehension tool for workers**.

## Source of Truth

Use these files as source of truth:

1. `AGENTS.md`
2. `PRODUCT_BRIEF.md`
3. `README.md`
4. `ARCHITECTURE.md`
5. Existing frontend/backend code

If documents conflict, prefer this order:

1. This `AGENTS.md`
2. `PRODUCT_BRIEF.md`
3. `README.md`
4. Existing code

## Core Demo Flow

Preserve this flow:

```text
Worker points camera at sign / label
→ App captures image
→ Agnes vision extracts text and context
→ Agnes reasoning translates and classifies risk
→ App shows green/yellow/red risk card
→ Agnes image generation creates pictogram alert
→ App plays native-language audio guidance
→ Worker can save or draft an incident report
```

Do not replace this with a generic chatbot or document-upload-only flow unless explicitly requested.

## Hackathon Positioning

The differentiator is not:

> "We translate construction signs."

The differentiator is:

> "We bring native-language safety comprehension to the worker at the exact point of risk."

SafePoint should show strong use of Agnes AI:

- Vision for signs, labels, and hazard context
- Text reasoning for translation, simplification, and risk grading
- Image generation for low-literacy pictogram cards
- Video generation for daily site-specific micro-briefings
- Report generation for incident and near-miss communication

## Non-Negotiables

- Keep the product worker-side first.
- Keep the main interaction camera-first.
- Keep outputs action-oriented, not just translated.
- Always include risk level and next step.
- Always include uncertainty/confidence when AI may be wrong.
- Do not claim official safety/legal determination.
- Do not replace official training, SOPs, safety officers, or supervisors.
- Do not build worker surveillance features.
- Do not store worker images by default.
- Do not commit secrets or API keys.
- Keep demo reliability ahead of visual polish.

## Safety Wording Rules

Use careful language.

Good:

- "This appears to be a high-risk warning."
- "This sign seems to say..."
- "Please check with your supervisor if unsure."
- "This may require PPE."
- "I am not fully certain because the image is blurry."

Avoid:

- "This is definitely safe."
- "This is illegal."
- "You can ignore your supervisor."
- "This app replaces safety training."
- "This hazard classification is official."

## Implementation Priorities

1. Scan or upload image.
2. Extract sign/label text.
3. Translate and simplify.
4. Classify risk.
5. Show risk card.
6. Generate pictogram prompt/card.
7. Add audio guidance.
8. Add incident report draft.
9. Add daily briefing generation as stretch.

## Ask Before Large Changes

Ask before:

- Changing the target user away from frontline workers.
- Removing the camera-first scan flow.
- Replacing risk cards with plain text only.
- Adding employer surveillance or worker tracking.
- Changing the AI response schema.
- Adding heavy AR or 3D libraries.
- Making the product a generic translation app.
- Making broad architecture rewrites.
