# SafePoint Testing Guide

## Manual Test Flow

1. Start backend.
2. Start frontend.
3. Select language.
4. Upload fall hazard sample image.
5. Confirm detected text appears.
6. Confirm translated explanation appears.
7. Confirm risk level is red.
8. Confirm PPE/action steps appear.
9. Confirm audio guidance works.
10. Confirm pictogram card appears.
11. Submit sample incident report.
12. Confirm report draft appears.
13. Simulate API failure.
14. Confirm fallback sample result appears.

## Test Scenarios

### Clear Sign

Expected:

- text extracted correctly
- correct translation
- risk classification appears
- action steps are clear

### Blurry Sign

Expected:

- low confidence warning
- retake prompt
- no false certainty

### No Text Image

Expected:

- app says it cannot read sign
- suggest retake or ask supervisor

### Chemical Label

Expected:

- hazard detected
- PPE guidance appears
- risk likely yellow/red depending on label

### Unsupported Language

Expected:

- clear fallback message
- suggest available languages

### API Failure

Expected:

- fallback result appears
- source state marked as sample/fallback
- no crash

## Accessibility Testing

- [ ] Buttons are large enough
- [ ] Text labels exist for icons
- [ ] Critical guidance is spoken
- [ ] High contrast risk badges
- [ ] Screen-reader labels for main controls
- [ ] No hover-only UI
- [ ] Retake action is obvious

## Privacy Testing

- [ ] No raw image data logged
- [ ] API key not exposed
- [ ] Images not stored by default
- [ ] Reports require confirmation before sharing
- [ ] Fallback state visible

## Demo Readiness Checklist

- [ ] Happy path works
- [ ] Fallback path works
- [ ] Sample images available
- [ ] Pitch script matches product flow
- [ ] No secrets committed
- [ ] All claims are pitch-safe
