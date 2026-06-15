# SafePoint Environment Variables

## Frontend

Create:

```bash
frontend/.env.local
```

Template:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
BACKEND_ORIGIN=
```

Rules:

- `NEXT_PUBLIC_BACKEND_URL` is for local browser-to-backend requests.
- On Vercel, leave `NEXT_PUBLIC_BACKEND_URL` unset and set the server-only
  `BACKEND_ORIGIN` to the deployed FastAPI URL.
- Only public values may use `NEXT_PUBLIC_`.
- Do not place Agnes API keys in frontend code.
- Do not commit `.env.local`.

## Backend

Create:

```bash
backend/.env
```

Template:

```bash
PORT=8000
ENVIRONMENT=development

AGNES_MODE=live
AGNES_API_KEY=your_agnes_api_key_here
AGNES_BASE_URL=https://apihub.agnes-ai.com/v1
AGNES_MODEL=agnes-2.0-flash
AGNES_TIMEOUT_SECONDS=30

ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=your_multilingual_voice_id_here
ELEVENLABS_BASE_URL=https://api.elevenlabs.io/v1
ELEVENLABS_MODEL_ID=eleven_v3
ELEVENLABS_TIMEOUT_SECONDS=20

USE_SAMPLE_FALLBACK=true
STORE_SCANNED_IMAGES_BY_DEFAULT=false
ENABLE_INCIDENT_REPORT_SAVE=false
```

Rules:

- Do not commit real secrets.
- Keep `.env.example` dummy-only.
- Backend owns all private API keys.
- Never expose the ElevenLabs key or voice ID in frontend variables or health
  responses.
- Demo fallback should be clearly marked.
- Image storage should default to false.

## Required Variables

| Variable | Where | Required | Description |
|---|---|---:|---|
| `NEXT_PUBLIC_BACKEND_URL` | Frontend | Local only | Browser-visible backend URL |
| `BACKEND_ORIGIN` | Frontend | Vercel only | Server-side API rewrite target |
| `AGNES_MODE` | Backend | Yes | `fixture` for samples or `live` for Agnes |
| `AGNES_API_KEY` | Backend | Yes | Agnes AI API key |
| `AGNES_BASE_URL` | Backend | Live only | Agnes API base URL |
| `AGNES_MODEL` | Backend | Live only | Multimodal Agnes model |
| `AGNES_TIMEOUT_SECONDS` | Backend | No | Live request timeout |
| `ELEVENLABS_API_KEY` | Backend | Cloud audio only | ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | Backend | Cloud audio only | Multilingual voice ID |
| `ELEVENLABS_BASE_URL` | Backend | No | ElevenLabs API base URL |
| `ELEVENLABS_MODEL_ID` | Backend | No | Defaults to `eleven_v3` |
| `ELEVENLABS_TIMEOUT_SECONDS` | Backend | No | Cloud audio request timeout |
| `USE_SAMPLE_FALLBACK` | Backend | Yes | Allows demo fallback |
| `STORE_SCANNED_IMAGES_BY_DEFAULT` | Backend | Yes | Must default to false |

## Local Setup

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

For Docker Compose, place the real backend credentials only in the ignored
root `.env`. Cloud audio is requested only after the worker presses Play.
SafePoint does not persist or cache generated audio, but the transcript is
sent to ElevenLabs for processing when cloud audio is used.
