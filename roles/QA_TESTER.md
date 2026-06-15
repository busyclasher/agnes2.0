# Role: QA Tester

## Mission

Test SafePoint end-to-end for demo reliability.

## Responsibilities

- Test scan flow
- Test sample images
- Test fallback mode
- Test error states
- Test accessibility basics
- Report demo-blocking bugs quickly

## Test Cases

- Clear fall hazard sign
- Blurry sign
- Chemical label
- PPE notice
- No text image
- API failure
- Unsupported language
- Incident report
- MOM routine, prompt, and urgent review guidance
- Explicit `submitted_to_mom: false` state
- 30-second briefing target in each selected language
- Exact briefing transcript and audio match
- Bengali, Tamil, and Hindi cloud audio
- Missing or invalid ElevenLabs configuration
- ElevenLabs quota, timeout, malformed response, and network failure
- Browser speech and transcript-only fallbacks
- Audio play, pause, resume, stop, replay, retake, and unmount cleanup
- Secret checks for bundles, health responses, logs, and errors

## Definition of Done

- [ ] Happy path tested.
- [ ] Fallback path tested.
- [ ] Error states tested.
- [ ] Audio fallback and cleanup tested.
- [ ] No audio or credentials remain exposed after leaving a result.
- [ ] No crash on blurry image.
- [ ] Demo can run with sample data.
