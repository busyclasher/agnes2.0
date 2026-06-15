# SafePoint Product Brief

## Project Name

**SafePoint**

## One-Liner

SafePoint is a worker-side construction safety translator that turns signs, labels, and site notices into native-language risk guidance, pictograms, and audio instructions.

## Product Thesis

Construction safety information often exists, but it may not be understandable to every worker at the exact moment of risk.

SafePoint closes that gap by making safety information:

- immediate
- multilingual
- visual
- spoken
- action-oriented
- worker-facing

## Core Insight

Most safety technology is designed for reporting, compliance, and management oversight.

SafePoint is designed for the worker standing in front of the hazard.

## Problem Statement

Workers may encounter safety-critical information in English or technical language, including:

- fall hazard warnings
- PPE instructions
- chemical labels
- no-entry signs
- equipment warnings
- emergency notices
- site-specific SOPs

If workers cannot understand these instructions quickly, safety communication breaks down at the most important moment.

The problem is not only translation.

The problem is:

> **Can the worker understand the risk and take the right next step immediately?**

## Target Users

### Primary ICP

Migrant construction workers who may be less confident in English and need quick, native-language safety guidance.

### Expansion Users

- workers in manufacturing
- workers in marine sectors
- cleaning and facilities workers
- logistics workers
- elderly workers or lower-literacy workers

### Buyers / Adopters

- main contractors
- subcontractors
- safety officers
- site managers
- training providers
- regulators or industry safety bodies
- WSH programme partners

## Product Promise

When a worker points a phone camera at a safety sign, label, or hazard notice, SafePoint answers:

1. What does this say?
2. How risky is it?
3. What should I do now?
4. What PPE do I need?
5. Can I hear it in my language?
6. Can I save or report this?

## Core Flow

```text
Point camera
→ Capture sign / label
→ Extract text and visual context
→ Translate into worker language
→ Simplify into plain safety instruction
→ Classify risk level
→ Generate pictogram card
→ Read guidance aloud
→ Save or report
```

## MVP Features

### 1. Camera Scan

User scans:

- safety sign
- warning sticker
- equipment label
- chemical label
- site notice

### 2. Native-Language Explanation

SafePoint returns worker-language explanation in:

- Bengali
- Tamil
- Hindi
- Bahasa Indonesia
- Tagalog
- Mandarin
- other languages as needed

### 3. Risk Grading

| Level | Meaning | Example |
|---|---|---|
| Green | Information | General reminder |
| Yellow | Caution | PPE required, slippery area |
| Red | Danger | fall hazard, high voltage, corrosive chemical |

### 4. Pictogram Alert Card

The app generates a simple visual card:

- risk colour
- hazard icon
- PPE icons
- do / do not instructions
- language label

### 5. Audio Guidance

The app reads the instruction aloud.

### 6. Incident / Near-Miss Draft

Worker can say what happened in their language.

SafePoint creates:

- short English report
- translated worker copy
- timestamp field
- location field
- severity field
- suggested follow-up

## Product Differentiator

The differentiator is not translation.

The differentiator is:

> **Point-of-risk safety comprehension.**

SafePoint combines:

- computer vision
- multilingual explanation
- risk reasoning
- pictogram generation
- audio guidance
- incident-report generation

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| AI misreads sign | Show confidence, allow retake, avoid final authority wording |
| Worker over-relies on app | Say it complements official training and supervisor guidance |
| Wrong risk classification | Use conservative language and escalate unclear hazards |
| Privacy concerns | Avoid storing photos by default |
| Employer surveillance fear | Worker-side mode should not track workers without consent |
| Legal liability | Avoid saying the app gives official safety/legal determinations |

## Pitch Line

> **SafePoint brings safety comprehension to the worker’s hand at the exact moment of risk.**
