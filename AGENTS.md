# Agent Instructions

This project is **SafePoint**, a camera-first construction safety
comprehension tool for frontline workers.

## Product Rules

- Keep the primary flow worker-side and camera-first.
- Return action-oriented guidance with a risk level and a next step.
- Show confidence and uncertainty; use `unknown` when the image is unclear.
- Never present AI output as an official safety or legal determination.
- Do not replace training, procedures, supervisors, or safety officers.
- Do not add worker surveillance or store scanned images by default.
- Keep private API keys in the backend.
- Prefer demo reliability and an honest fallback state over visual polish.

## Source Of Truth

1. `AGENTS.md`
2. `docs/PRODUCT_BRIEF.md`
3. `README.md`
4. `docs/ARCHITECTURE.md`
5. Existing frontend and backend code

## Core Demo

```text
Capture a sign
-> extract text and context
-> translate and classify risk
-> show an action card
-> create a pictogram
-> play native-language guidance
-> optionally draft an incident report
```

## Safety Wording

Prefer language such as:

- "This appears to be a high-risk warning."
- "Please check with your supervisor if unsure."
- "I am not fully certain because the image is unclear."

Avoid certainty such as "officially safe", legal conclusions, or instructions
that conflict with site procedures.
