# SafePoint

## Overview

**SafePoint** is a worker-side construction safety translator that helps frontline workers instantly understand site hazards, warning signs, labels, and safety instructions in their own language.

SafePoint is designed for multilingual, high-risk worksites where safety information is often written in technical English and may not be understood at the exact moment it matters.

## One-Liner

**SafePoint turns site signs, labels, and safety notices into native-language risk guidance in seconds.**

## Tagline

> **From sign to safety in seconds.**

## Product Positioning

SafePoint is not a back-office compliance tool.

It is a **point-of-risk safety comprehension layer** for workers.

Most construction safety tools serve:

- safety officers
- supervisors
- compliance teams
- reporting dashboards
- management audits

SafePoint flips the flow by serving the worker directly at the moment of risk.

## Problem

Construction sites contain many safety-critical instructions:

- warning signs
- restricted area notices
- PPE requirements
- chemical labels
- equipment warning stickers
- toolbox briefing posters
- method statement summaries
- emergency instructions

For workers who are not confident in English, these signs may be misunderstood or ignored, not because workers do not care about safety, but because the information is not accessible enough at the point of need.

The real problem is:

> **Critical safety information does not always become understandable at the moment the worker needs it.**

## Context

Singapore’s 2024 Workplace Safety and Health report recorded **43 workplace fatal injuries**, up from 36 in 2023. The construction sector recorded **20 workplace fatal injuries** in 2024.

Sources:

- MOM WSH Report 2024 press release: https://www.mom.gov.sg/newsroom/press-releases/2025/0326wshreport
- MOM Workplace Safety and Health Report 2024 PDF: https://www.mom.gov.sg/-/media/mom/documents/safety-health/reports-stats/wsh-national-statistics/wsh-national-stats-2024.pdf

Note: Use the latest MOM/WSH statistics before final pitch submission.

## Main Demo Flow

```text
Worker sees safety sign / label / hazard
→ Opens SafePoint
→ Points phone camera
→ Agnes vision reads and interprets the content
→ Agnes reasoning classifies risk
→ SafePoint returns native-language explanation
→ SafePoint generates a pictogram safety card
→ Audio guidance is played aloud
→ Worker can save or report the issue
```

## Agnes AI Usage

SafePoint should show Agnes as a multimodal safety intelligence layer.

- **Vision:** OCR on signs, labels, equipment stickers, chemical containers
- **Text reasoning / Claw:** translation, simplification, risk grading, action steps
- **Image generation:** pictogram safety cards for low-literacy workers
- **Video generation:** short daily site-specific safety briefings
- **Text generation:** incident and near-miss report drafts

## MVP Scope

For the hackathon, build only the strongest flow:

1. Scan a sign or label.
2. Translate and simplify it.
3. Classify risk as green/yellow/red.
4. Generate a pictogram card.
5. Play audio guidance.
6. Let the worker save or report the issue.

## Out of Scope for MVP

- Replacing safety officers
- Replacing formal safety training
- Final legal/safety determinations
- Automatic report submission to regulators
- Live video-call support
- Full site analytics dashboard
- Employer risk scoring
- Worker surveillance

## Project Docs

- `PRODUCT_BRIEF.md`
- `AGENTS.md`
- `ARCHITECTURE.md`
- `FRONTEND.md`
- `BACKEND.md`
- `API_CONTRACTS.md`
- `DATA_FLOW.md`
- `DESIGN_SYSTEM.md`
- `DEMO_FLOW.md`
- `TESTING.md`
- `ENVIRONMENT.md`
- `ROADMAP.md`
- `DECISIONS.md`
- `roles/`
