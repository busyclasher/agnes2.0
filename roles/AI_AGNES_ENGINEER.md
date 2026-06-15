# Role: AI / Agnes Engineer

## Mission

Design the Agnes AI workflow for vision, translation, risk reasoning, pictogram generation, and briefing generation.

## Responsibilities

- Create prompts for sign/label understanding
- Create structured output schema
- Create risk classification prompt
- Create translation and simplification prompt
- Create pictogram generation prompt
- Create incident report prompt
- Handle confidence and uncertainty

## AI Pipeline

```text
Image
  → OCR/context extraction
  → translate
  → simplify
  → classify risk
  → generate action steps
  → generate pictogram prompt
  → generate audio guidance text
```

## Prompting Rules

The AI should:

- Use simple language
- Avoid legal/safety finality
- Include uncertainty
- Recommend supervisor check when unclear
- Generate actionable steps
- Avoid hidden chain-of-thought

## Definition of Done

- [ ] Vision prompt returns usable text.
- [ ] Risk classification is structured.
- [ ] Pictogram prompt is usable.
- [ ] Incident report prompt works.
- [ ] Low-confidence cases are handled.
