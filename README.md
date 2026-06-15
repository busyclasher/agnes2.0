# SafePoint

SafePoint turns construction signs and labels into native-language,
action-oriented safety guidance at the point of risk.

The hackathon build is a mobile-first Next.js app backed by FastAPI. It
supports Bengali, Tamil, and Hindi, with deterministic demo samples when the
private Agnes API is unavailable.

## Quick Start

### Docker

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
docker compose up --build
```

Open `http://localhost:3000`. The API health endpoint is
`http://localhost:8000/health`.

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
- `backend/`: FastAPI API and Agnes integration boundary
- `data/`: synthetic sample signs
- `docs/`: product, architecture, contracts, and testing guidance
- `roles/`: hackathon role briefs

SafePoint complements official training and site procedures. It does not make
official safety or legal determinations.
