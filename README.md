# SafePoint

SafePoint turns construction signs and labels into native-language,
action-oriented safety guidance at the point of risk.

The hackathon build is a mobile-first Next.js app backed by FastAPI. It
supports Bengali, Tamil, and Hindi, with deterministic demo samples when the
private Agnes API is unavailable.

## Quick Start

### Docker

```bash
cp .env.example .env
docker compose up --build
```

Open `http://localhost:3000`. The API health endpoint is
`http://localhost:8000/health`.

If port `3000` is already used by `npm run dev`, set this in `.env`:

```bash
FRONTEND_PORT=3001
FRONTEND_ORIGINS=http://localhost:3001
```

Then open `http://localhost:3001`.

Use `AGNES_MODE=fixture` for deterministic repository-owned samples. For live
camera and uploaded-photo analysis, set:

```bash
AGNES_MODE=live
AGNES_API_KEY=your_key
AGNES_BASE_URL=https://apihub.agnes-ai.com/v1
AGNES_MODEL=agnes-2.0-flash
```

The API key remains in the backend environment and is never sent to Next.js.
With `USE_SAMPLE_FALLBACK=true`, only recognized demo samples fall back when
Agnes is unavailable; arbitrary photos receive an honest recoverable error.

Cloud audio is optional. Add these values to the ignored root `.env`:

```bash
ELEVENLABS_API_KEY=your_key
ELEVENLABS_VOICE_ID=your_multilingual_voice_id
ELEVENLABS_MODEL_ID=eleven_v3
```

ElevenLabs is called only after the worker presses Play. SafePoint sends the
visible transcript through the backend, returns non-cached MP3 bytes, and does
not persist the audio. If cloud audio fails, the UI falls back to browser
speech synthesis and always keeps the transcript visible.

### Local Development

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements-dev.txt
uvicorn app.main:app --app-dir backend --reload
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

### Vercel

Deploy this monorepo as a FastAPI backend project rooted at `backend/` and a
Next.js frontend project rooted at `frontend/`. The frontend proxies `/api/*`
to the backend and becomes the single shareable worker URL.

See [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md) for the exact
project settings and environment variables.

## Demo Flow

1. Select Bengali, Tamil, or Hindi.
2. Capture a sign, upload an image, or choose a supplied sample.
3. Review the risk, immediate actions, PPE, translation, and uncertainty.
4. Listen to the visible guidance transcript.
5. Generate a low-literacy pictogram card.
6. Draft and confirm a near-miss report without automatic submission.

Demo fallback results are visibly marked and are only available for the three
repository-owned sample images. Unknown images never receive invented fixture
guidance.

## Repository

- `frontend/`: Next.js worker interface
- `backend/`: FastAPI API and live Agnes integration
- `data/`: synthetic sample signs
- `docs/`: product, architecture, contracts, and testing guidance
- `roles/`: hackathon role briefs

SafePoint complements official training and site procedures. It does not make
official safety or legal determinations.
