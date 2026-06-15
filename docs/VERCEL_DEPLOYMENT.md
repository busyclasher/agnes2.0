# Deploy SafePoint to Vercel

SafePoint deploys as two Vercel projects from the same GitHub repository:

- `safepoint-api`: FastAPI project rooted at `backend/`
- `safepoint`: Next.js project rooted at `frontend/`

The frontend is the only URL workers need. It proxies `/api/*` to the backend,
so credentials remain server-side and browser requests stay on one origin.

## 1. Push the repository

Commit and push the deployment files to:

```text
https://github.com/busyclasher/agnes2.0
```

## 2. Deploy the backend project

In the Vercel dashboard, select **Add New > Project**, import the repository,
and configure:

| Setting | Value |
|---|---|
| Project name | `safepoint-api` or another unique name |
| Root Directory | `backend` |
| Framework Preset | FastAPI, or the automatically detected preset |
| Build Command | Leave empty |
| Output Directory | Leave empty |

Add these Production environment variables:

```env
ENVIRONMENT=production
AGNES_MODE=live
AGNES_API_KEY=your_real_key
AGNES_BASE_URL=https://apihub.agnes-ai.com/v1
AGNES_MODEL=agnes-2.0-flash
AGNES_TIMEOUT_SECONDS=30
USE_SAMPLE_FALLBACK=true
STORE_SCANNED_IMAGES_BY_DEFAULT=false
ELEVENLABS_API_KEY=your_real_key
ELEVENLABS_VOICE_ID=your_voice_id
ELEVENLABS_BASE_URL=https://api.elevenlabs.io/v1
ELEVENLABS_MODEL_ID=eleven_v3
ELEVENLABS_TIMEOUT_SECONDS=20
```

Deploy and copy the generated backend URL, for example:

```text
https://safepoint-api-example.vercel.app
```

Verify:

```text
https://safepoint-api-example.vercel.app/health
```

## 3. Deploy the frontend project

Import the same repository again and configure:

| Setting | Value |
|---|---|
| Project name | `safepoint` or another unique name |
| Root Directory | `frontend` |
| Framework Preset | Next.js |

Add this Production environment variable using the backend URL from step 2:

```env
BACKEND_ORIGIN=https://safepoint-api-example.vercel.app
```

Do not set `NEXT_PUBLIC_BACKEND_URL` on Vercel. It is only for local
development. Deploy the frontend and share its generated URL:

```text
https://safepoint-example.vercel.app
```

Every Vercel deployment also receives a unique preview URL. A custom project
name or custom domain can be assigned later without changing the code.

## 4. Final checks

1. Open the frontend URL on a phone over HTTPS.
2. Allow camera permission and capture a sign.
3. Run all three repository sample signs.
4. Press Play for Bengali, Tamil, and Hindi.
5. Confirm `/health` does not expose API keys or the ElevenLabs voice ID.
6. Confirm an unknown upload never receives fixture guidance.

If environment variables are changed, redeploy the affected project so the
new values are included in the Production deployment.
