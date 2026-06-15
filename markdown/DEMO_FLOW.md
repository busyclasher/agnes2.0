# SafePoint Demo Flow

## Demo Goal

Show that SafePoint uses Agnes AI to turn safety signs and labels into native-language, action-oriented guidance at the exact point of risk.

## Demo Setup

Prepare 3 sample images:

1. Fall hazard sign
2. Chemical warning label
3. PPE required notice

## Demo Scene 1: Problem

Narration:

> On a construction site, safety information is everywhere, but it is often written in English and technical language. If a worker cannot understand it at the exact moment of risk, the warning has failed.

Show image of a sign:

> “Danger: Open Edge. Wear Safety Harness. No Unauthorized Entry.”

## Demo Scene 2: Scan

User opens SafePoint.

Tap:

> Scan Sign / Label

Camera scans the sign.

Show progress:

- Reading sign
- Translating
- Checking risk
- Creating safety card

## Demo Scene 3: Result

SafePoint shows:

- Risk: Red — Danger
- Plain explanation:
  - “There is danger of falling from height.”
  - “Do not enter unless authorised.”
  - “Wear your safety harness.”
- PPE icons:
  - helmet
  - harness
- Audio button
- Pictogram card

## Demo Scene 4: Audio

Tap audio.

SafePoint reads:

> “Danger. This area has a fall hazard. Do not enter unless authorised. Wear your safety harness.”

## Demo Scene 5: Pictogram Card

Show generated visual safety card.

Explain:

> For workers who are less confident reading long text, SafePoint turns the instruction into a simple visual card.

## Demo Scene 6: Incident Report

Worker speaks:

> “I slipped near the wet staircase on Level 3. No injury, but dangerous.”

SafePoint generates:

- English report
- worker-language summary
- incident category
- suggested next step

## Demo Scene 7: Closing

Final pitch line:

> SafePoint does not replace safety officers or formal training. It closes the comprehension gap at the exact moment a worker faces risk.

## Backup Plan

If live API fails:

- use sample response
- show `source_state: sample`
- continue demo honestly

## Demo Checklist

- [ ] Sample images prepared
- [ ] Camera/upload works
- [ ] Scan result appears
- [ ] Risk badge appears
- [ ] Audio works or is simulated
- [ ] Pictogram card appears
- [ ] Incident report draft works
- [ ] Fallback demo works
