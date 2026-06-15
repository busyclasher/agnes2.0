# CLAUDE.md — SafePoint

> Context file for Claude Code and other coding assistants. Read this before suggesting code or running commands.

## Project

**SafePoint** is a worker-side multimodal AI tool for migrant construction workers in Singapore. A worker points their phone at a hazard or sign, receives an instant native-language risk explanation, sees an AI-generated pictogram, voices their incident in Bengali or Tamil, and gets a formal English incident report ready for MOM or BCA submission. Each morning the app also surfaces a pre-baked 30-second native-language briefing of that day's top site hazards.

**Why it matters.** Singapore recorded 43 workplace fatalities in 2024, with 20 in construction alone. By Heinrich's safety triangle, that implies roughly 6,000 near-misses on Singapore construction sites annually, almost none captured because English-language reporting tools exclude the workforce they are meant to protect.

**Hackathon context.** Built for the Agnes AI hackathon. Judged on Innovation (30%), Business Value (30%), and Best Use of Agnes AI (40%). The full demo uses four Agnes AI modalities end to end: vision, text reasoning, image generation, and video generation.

## Team and time budget

- 4+ people
- 5-hour build window, hard stop
- Three parallel tracks: backend, frontend, content and pitch

## Coding conventions

- **British English** in every UI string, code comment, doc, and commit message. "Recognise", "behaviour", "centre", "colour", "organise". Never American spellings.
- **No em dashes** anywhere. Use commas, full stops, or parentheses.
- **No run-on sentences.** One idea per sentence.
- **Direct and punchy.** No hedging, no filler.
- **TypeScript strict mode** on the frontend. **Python type hints** on the backend.
- **Async by default** in FastAPI route handlers.
- **No client-side Agnes API calls.** The API key lives server-side only.
- **No secrets in commits.** All keys go through `.env`.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript | Mobile-first, fast to ship, looks professional |
| Styling | Tailwind CSS + shadcn/ui | Component library for speed |
| Backend | FastAPI (Python 3.11+) | Async, simple, fast |
| AI provider | Agnes AI (OpenAI-compatible) | Hackathon sponsor, full multimodal suite |
| Storage | In-memory only for v1 | No persistence needed for the demo |
| Auth | None for v1 | Stateless anonymous reporting fits the ethics model |
| Hosting (frontend) | Vercel | Free, fast, Next.js native |
| Hosting (backend) | Railway or Render | Free tier, FastAPI friendly |

## Architecture

```
┌──────────────────┐         ┌──────────────────┐
│  Next.js (web)   │  HTTPS  │ FastAPI (server) │
│  Mobile-first UI │ ──────▶ │ Agnes AI client  │
│                  │         │                  │
│  Capture photo   │         │ /hazards/analyse │──┐
│  Voice memo      │         │ /reports/draft   │  │
│  Show pictogram  │         │ /pictograms/gen  │  │
│  Play briefing   │         │ /briefings/today │  │
└──────────────────┘         └──────────────────┘  │
                                                    │
                                                    ▼
                                       ┌──────────────────────┐
                                       │   Agnes AI API       │
                                       │  apihub.agnes-ai.com │
                                       │                      │
                                       │ agnes-1.5-pro        │ vision + text
                                       │ agnes-1.5-flash      │ text fast
                                       │ agnes-image-2.1-flash│ image gen
                                       │ agnes-video-*        │ video gen
                                       └──────────────────────┘
```

## Repo structure

```
safepoint/
├── CLAUDE.md
├── README.md
├── .env.example
│
├── backend/
│   ├── pyproject.toml
│   ├── main.py                    # FastAPI app entry
│   ├── settings.py                # pydantic-settings
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── hazards.py             # POST /hazards/analyse
│   │   ├── reports.py             # POST /reports/draft
│   │   ├── pictograms.py          # POST /pictograms/generate
│   │   └── briefings.py           # GET  /briefings/today
│   ├── services/
│   │   ├── agnes_client.py        # OpenAI-compatible client wrapper
│   │   ├── hazard_analyser.py
│   │   ├── report_drafter.py
│   │   └── pictogram_generator.py
│   ├── prompts/
│   │   ├── hazard_analyser.md
│   │   ├── report_drafter.md
│   │   └── pictogram_styles.md
│   ├── schemas.py                 # Pydantic models
│   └── assets/briefings/          # pre-baked .mp4 files
│
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── app/
│   │   ├── layout.tsx             # Noto Sans Bengali + Tamil fonts
│   │   ├── page.tsx               # /        worker landing
│   │   ├── briefing/page.tsx      # /briefing morning video
│   │   ├── capture/page.tsx       # /capture  photo flow
│   │   └── report/page.tsx        # /report   incident report view
│   ├── components/
│   │   ├── PhotoCapture.tsx
│   │   ├── HazardCard.tsx
│   │   ├── PictogramDisplay.tsx
│   │   ├── VoiceRecorder.tsx
│   │   ├── IncidentReport.tsx
│   │   └── LanguageSwitcher.tsx
│   ├── lib/
│   │   ├── api.ts                 # Backend API client
│   │   └── i18n.ts                # bn / ta / en strings
│   └── public/
│       └── icons/
│
└── prebaked/
    ├── briefings/                 # video gen outputs
    │   ├── briefing_bn.mp4
    │   ├── briefing_ta.mp4
    │   └── briefing_en.mp4
    ├── photos/                    # demo hazard photos
    └── reports/                   # fallback JSON if API fails
```

## Agnes AI integration

OpenAI-compatible. Base URL: `https://apihub.agnes-ai.com/v1`. Auth via `Authorization: Bearer ${AGNES_API_KEY}`.

### Models used

| Task | Model | Notes |
|---|---|---|
| Hazard analysis from photo | `agnes-1.5-pro` | Multimodal vision, accepts image_url content blocks |
| Incident report drafting | `agnes-1.5-flash` | Fast text generation, low latency |
| Pictogram generation | `agnes-image-2.1-flash` | Text-to-image, include native script in prompt |
| Morning briefing video | Agnes video model (async) | Pre-baked, never called live |

### Backend client

`backend/services/agnes_client.py`:

```python
from openai import AsyncOpenAI
from settings import settings

client = AsyncOpenAI(
    api_key=settings.AGNES_API_KEY,
    base_url=settings.AGNES_BASE_URL,  # https://apihub.agnes-ai.com/v1
)
```

### Vision call (hazard analysis)

```python
async def analyse_hazard(image_b64: str, worker_language: str) -> HazardAnalysis:
    response = await client.chat.completions.create(
        model="agnes-1.5-pro",
        messages=[
            {"role": "system", "content": HAZARD_ANALYSER_PROMPT.format(lang=worker_language)},
            {"role": "user", "content": [
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
                {"type": "text", "text": "Identify the hazard and cite the SG WSH rule violated."},
            ]},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )
    return HazardAnalysis.model_validate_json(response.choices[0].message.content)
```

### Image gen (pictogram)

```python
async def generate_pictogram(hazard_description: str, language: str) -> str:
    response = await client.images.generate(
        model="agnes-image-2.1-flash",
        prompt=PICTOGRAM_PROMPT.format(hazard=hazard_description, language=language),
        size="1024x1024",
        n=1,
    )
    return response.data[0].url
```

### Text reasoning (incident report)

```python
async def draft_report(transcript: str, language: str, hazard_context: dict) -> str:
    response = await client.chat.completions.create(
        model="agnes-1.5-flash",
        messages=[
            {"role": "system", "content": REPORT_DRAFTER_PROMPT},
            {"role": "user", "content": f"Worker said (in {language}): {transcript}\n\nHazard context: {hazard_context}"},
        ],
        temperature=0.3,
    )
    return response.choices[0].message.content
```

## API surface

| Method | Route | Body | Returns |
|---|---|---|---|
| POST | `/api/hazards/analyse` | `{image_b64, language}` | `{hazard_type, severity, rule_citation, native_warning, english_warning}` |
| POST | `/api/pictograms/generate` | `{hazard_description, language}` | `{image_url}` |
| POST | `/api/reports/draft` | `{voice_transcript, language, hazard_context}` | `{incident_report_en, drafted_at}` |
| GET | `/api/briefings/today?lang=bn\|ta\|en` | none | Static mp4 stream |

The frontend talks to FastAPI directly via `lib/api.ts`. Use Next.js API routes only as a thin proxy if exposing the backend publicly raises CORS pain.

## Prompt design notes

**Hazard analyser** must return strict JSON. Required keys: `hazard_type`, `severity` (low / medium / high), `rule_citation` (SG WSH Act section or Code of Practice clause), `native_warning` (one sentence in worker's language), `english_warning` (one sentence in English).

**Report drafter** must produce a Singapore-MOM-style incident report with these sections: Incident Summary, Location, Time, Hazard Description, Witness Account (translated from voice memo), Recommended Action. Tone formal, neutral, third-person.

**Pictogram generator** must include in the prompt: "Black and yellow safety pictogram style, clean vector, ISO 7010 inspired, no text in image". Render native-language text via the UI as a caption, not baked into the pictogram. Image gen models cannot reliably render Bengali or Tamil script.

## UI guidance (mobile-first)

The user is a construction worker on site. Optimise for:

- Single-thumb operation
- Large touch targets, minimum 48 by 48 pixels
- High contrast for sunlight readability and dirty screens
- Minimal text on screen
- Native script primary, English secondary
- One action per screen

Screens in order:

1. **Landing** — language toggle (BN / TA / EN), big "Report a hazard" CTA, smaller "Today's briefing" link
2. **Capture** — open native camera or upload, loading state during analysis
3. **Hazard card** — photo thumbnail, native-language warning sentence, AI pictogram, "Voice my report" button
4. **Voice memo** — tap and hold to record, transcribe via browser MediaRecorder, send to backend
5. **Incident report** — native voice transcript on top, English formal report below, mock "Send to supervisor" button
6. **Briefing** — full-screen pre-baked mp4 with native-script captions

## Demo flow (the 90-second money shot)

1. Worker opens the app on a phone, taps Bengali
2. Plays today's morning briefing (pre-baked video, 20 seconds)
3. Walks past a scaffold with a missing toe-board, takes a photo
4. Sees the hazard card with a native-language warning and an AI pictogram
5. Voices a 5-second memo describing what they saw
6. Sees the AI-drafted English incident report appear, ready to send
7. Cut to the "near-miss multiplier" thesis slide

## Parallelisation plan (4 people, 5 hours)

### Track A — Backend (1 person)
- Hour 1: FastAPI scaffold, Agnes client, env setup, `/health` endpoint live
- Hour 2: `/hazards/analyse` (vision + reasoning) working with a static test image
- Hour 3: `/reports/draft` and `/pictograms/generate`
- Hour 4: `/briefings/today` static serve, CORS, smoke test against frontend
- Hour 5: deploy to Railway or Render, hand off

### Track B — Frontend (2 people)
- Hour 1: Next.js scaffold, Tailwind, shadcn install, layout, i18n setup, Noto fonts
- Hour 2: Person 1 builds PhotoCapture, LanguageSwitcher, landing page. Person 2 builds HazardCard, PictogramDisplay
- Hour 3: Person 1 builds VoiceRecorder, IncidentReport. Person 2 builds Briefing page and polishes responsive layout
- Hour 4: wire everything to backend, add loading and error states
- Hour 5: deploy to Vercel, test on a real phone, demo dry run

### Track C — Content and pitch (1 person)
- Hour 1: Kick off video gen for `briefing_bn.mp4`, `briefing_ta.mp4`, `briefing_en.mp4`. This runs async and takes time
- Hour 2: Collect or shoot 5 demo hazard photos (scaffold, chemical bottle, electrical hazard, wet floor, missing PPE)
- Hour 3: Draft the poster. Lead with Heinrich's triangle, 43 fatalities, Bangladeshi worker story
- Hour 4: Write the 3-minute pitch script and Q&A prep
- Hour 5: Demo dry run with the team, print the final poster

## Pre-baked assets checklist

Generated before the demo, committed to `prebaked/`:

- [ ] `briefings/briefing_bn.mp4` (Bengali, 20 to 30 seconds)
- [ ] `briefings/briefing_ta.mp4` (Tamil)
- [ ] `briefings/briefing_en.mp4` (English)
- [ ] Five demo hazard photos in `photos/`
- [ ] One fallback hazard analysis JSON in `reports/` for offline demo if the API fails

**Critical.** Kick off video generation in Track C hour 1. Agnes video gen is asynchronous and can take 5 to 10 minutes per clip. Do not leave this to the last hour.

## Environment variables

`.env.example`:

```
# Backend
AGNES_API_KEY=sk-...
AGNES_BASE_URL=https://apihub.agnes-ai.com/v1
CORS_ORIGINS=http://localhost:3000,https://safepoint.vercel.app

# Frontend
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

## Setup commands

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn 'openai>=1.0' python-multipart pydantic-settings
cp ../.env.example .env  # then fill in AGNES_API_KEY
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
pnpm install  # or npm install
pnpm dev      # http://localhost:3000
```

## Known pitfalls

- **Agnes video gen is slow and async.** Pre-bake. Never call it live on stage.
- **Agnes image gen returns a URL that may expire.** For the demo, accept the risk. For production, download and re-host.
- **Browser camera API needs HTTPS.** Localhost is fine for dev, but real-phone testing needs the Vercel deploy.
- **Vision input via URL needs the URL to be publicly reachable.** Use base64 data URLs for the demo. Simpler and avoids hosting headaches.
- **CORS will bite you.** Set FastAPI `allow_origins` explicitly. Never use `*` with credentials.
- **Bengali and Tamil fonts** need Noto Sans Bengali and Noto Sans Tamil loaded in `app/layout.tsx`. Otherwise the scripts render as boxes.
- **iOS Safari MediaRecorder** has quirks. Test the voice memo on an actual iPhone if anyone on the team owns one.
- **Agnes free tier rate limits.** Do not stress-test on hackathon day. Cache or stub responses during development.
- **Image gen does not render Bengali or Tamil reliably.** Keep text out of the pictogram. Render captions in the UI.

## Out of scope (do not build)

- User accounts and authentication
- Persistent storage of incidents
- Real submission to MOM or BCA (mock the "Send" button)
- Multi-tenancy or site selection
- Native mobile apps (iOS or Android)
- Real-time push notifications
- Safety officer or admin dashboard
- Payment or subscription flow
- Offline mode
- Internationalisation beyond BN, TA, EN

## Demo day checklist

- [ ] Backend deployed and warm (call the health endpoint 10 minutes before the pitch)
- [ ] Frontend deployed on Vercel with HTTPS
- [ ] Pre-baked videos served correctly from `/api/briefings/today`
- [ ] Five demo photos saved to the demo phone's camera roll
- [ ] Backup laptop demo running locally in case venue wifi fails
- [ ] Static screenshots in a fallback slide deck if everything breaks
- [ ] Pitch script printed
- [ ] Charger and adapter for the demo phone
- [ ] One person responsible for clicking through the demo, one for narrating

## Hackathon rubric alignment

| Criterion | Weight | How SafePoint scores |
|---|---|---|
| Innovation | 30% | New ICP (frontline migrant worker, not safety officer). New workflow (point-of-risk capture). New product category (worker-side WSH). Unexpected application of multimodal AI to near-miss capture, not just compliance dashboards. |
| Business Value | 30% | Singapore: 43 fatalities a year, 6,000 implied near-misses by the Heinrich triangle. Addressable buyers: BCA, MOM WSH Council, Tier-1 main contractors. Roughly SGD 500k saved per avoided fatality. |
| Best Use of Agnes AI | 40% | All four modalities in one coherent end-to-end flow. Vision for hazard ID. Text reasoning for rule citation and incident report drafting. Image gen for pictogram. Video gen for morning briefing. No modality bolted on. |

## Talking points for the judges

- Lead with the 29 September 2024 Resorts World Sentosa incident: a 44-year-old Bangladeshi worker killed by a collapsing steel structure. Then the 43 fatalities. Then SafePoint.
- Existing comparables to name and dismiss: FWMOMCare (no AI, 2.6-star rating), Project MigrantPal (rule-based chatbot, text-only), Reclamo AI (US, text-only). None do multimodal hazard capture.
- The Heinrich triangle is the killer slide. 1 fatality is 30 majors and 300 near-misses. We capture the 300.
- Ethical guardrail to volunteer before they ask: anonymous reporting, worker controls the share, augments existing MOM and BCA pipelines rather than replacing them.

## When in doubt

- Choose simpler over correct. The demo runs once, on stage, for 3 minutes.
- Choose pre-baked over live. Anything that touches video, fall back to a saved file.
- Choose mock over real integration. The "Send to supervisor" button does not need to send anywhere.
- Choose mobile-first over desktop. Even the demo on a laptop should look like a phone screen.
