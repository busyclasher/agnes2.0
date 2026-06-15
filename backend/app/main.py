from __future__ import annotations

import html

from fastapi import Depends, FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from app.config import Settings, settings
from app.errors import APIError, api_error_handler
from app.models import (
    AudioGuidanceRequest,
    BriefingRequest,
    BriefingResponse,
    GuidanceSpeechRequest,
    HealthResponse,
    IncidentReportRequest,
    IncidentReportResponse,
    PictogramRequest,
    PictogramResponse,
    RiskLevel,
    ScanResult,
    SupportedLanguage,
    TranscriptResponse,
)
from app.services.agnes import AgnesGateway, build_gateway
from app.services.elevenlabs import ElevenLabsGateway
from app.services.image_processing import process_image
from app.services.normalization import normalize_scan

app = FastAPI(
    title="SafePoint API",
    version="0.1.0",
    description="Worker-side, point-of-risk safety comprehension API.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.frontend_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
app.add_exception_handler(APIError, api_error_handler)

_gateway = build_gateway(settings)
_speech_gateway = ElevenLabsGateway(settings)


def get_settings() -> Settings:
    return settings


def get_gateway() -> AgnesGateway:
    return _gateway


def get_speech_gateway() -> ElevenLabsGateway:
    return _speech_gateway


def get_audio_gateway() -> ElevenLabsGateway:
    return _speech_gateway


@app.get("/health", response_model=HealthResponse)
async def health(config: Settings = Depends(get_settings)) -> HealthResponse:
    return HealthResponse(
        status="ok",
        environment=config.environment,
        agnes_mode=config.agnes_mode,
        agnes_configured=bool(config.agnes_api_key and config.agnes_base_url),
        agnes_model=config.agnes_model,
        elevenlabs_configured=bool(
            config.elevenlabs_api_key and config.elevenlabs_voice_id
        ),
        audio_model=config.elevenlabs_model_id,
        fallback_available=config.use_sample_fallback,
        image_storage_enabled=config.store_scanned_images,
    )


@app.post("/api/scan-safety-image", response_model=ScanResult)
async def scan_safety_image(
    image: UploadFile = File(...),
    language: SupportedLanguage = Form(...),
    site_context: str = Form(default="construction", max_length=120),
    mode: str = Form(default="scan", pattern=r"^scan$"),
    config: Settings = Depends(get_settings),
    gateway: AgnesGateway = Depends(get_gateway),
) -> ScanResult:
    del mode
    content_type = image.content_type
    raw = await image.read(config.max_image_bytes + 1)
    await image.close()
    processed = process_image(raw, content_type, config)
    raw = b""
    result = await gateway.scan(processed, language, site_context)
    return normalize_scan(result, config)


@app.post("/api/generate-audio-guidance")
async def generate_audio_guidance(
    request: AudioGuidanceRequest,
    audio_gateway: ElevenLabsGateway = Depends(get_audio_gateway),
) -> Response:
    audio = await audio_gateway.generate(request.text, request.language)
    return Response(
        content=audio,
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "no-store",
            "X-Audio-Source": "elevenlabs",
        },
    )


@app.post("/api/generate-pictogram-card", response_model=PictogramResponse)
async def generate_pictogram(
    request: PictogramRequest,
    gateway: AgnesGateway = Depends(get_gateway),
) -> PictogramResponse:
    return await gateway.pictogram(request)


@app.get("/api/pictogram-assets/{risk_level}/{hazard_type}.svg")
async def pictogram_asset(
    risk_level: RiskLevel, hazard_type: str, language: str = "Bengali"
) -> Response:
    if not hazard_type.replace("_", "").isalnum():
        raise APIError(
            "INVALID_PICTOGRAM",
            "The requested pictogram is invalid.",
            status_code=400,
            recoverable=False,
        )
    colors = {
        RiskLevel.RED: ("#b42318", "#fff5f3"),
        RiskLevel.YELLOW: ("#9a6700", "#fff8c5"),
        RiskLevel.GREEN: ("#067647", "#ecfdf3"),
        RiskLevel.UNKNOWN: ("#475467", "#f2f4f7"),
    }
    accent, background = colors[risk_level]
    title = html.escape(risk_level.value.upper())
    hazard = html.escape(hazard_type.replace("_", " ").title())
    lang = html.escape(language)
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560">
<rect width="900" height="560" rx="44" fill="{background}"/>
<rect x="32" y="32" width="836" height="496" rx="32" fill="none" stroke="{accent}" stroke-width="18"/>
<path d="M450 100 650 430H250Z" fill="{accent}"/>
<text x="450" y="330" text-anchor="middle" font-family="Arial" font-size="180" font-weight="700" fill="white">!</text>
<text x="450" y="78" text-anchor="middle" font-family="Arial" font-size="44" font-weight="700" fill="{accent}">{title}</text>
<text x="450" y="480" text-anchor="middle" font-family="Arial" font-size="42" font-weight="700" fill="{accent}">{hazard}</text>
<text x="820" y="510" text-anchor="end" font-family="Arial" font-size="24" fill="{accent}">{lang}</text>
</svg>"""
    return Response(svg, media_type="image/svg+xml")


@app.post("/api/generate-incident-report", response_model=IncidentReportResponse)
async def generate_incident_report(
    request: IncidentReportRequest,
    gateway: AgnesGateway = Depends(get_gateway),
) -> IncidentReportResponse:
    return await gateway.incident(request)


@app.post("/api/speech/guidance")
async def generate_guidance_speech(
    request: GuidanceSpeechRequest,
    speech_gateway: ElevenLabsGateway = Depends(get_speech_gateway),
) -> Response:
    audio = await speech_gateway.create_speech(request.text, request.language)
    return Response(content=audio.content, media_type=audio.media_type)


@app.post("/api/speech/transcribe", response_model=TranscriptResponse)
async def transcribe_speech(
    audio: UploadFile = File(...),
    language: SupportedLanguage = Form(...),
    config: Settings = Depends(get_settings),
    speech_gateway: ElevenLabsGateway = Depends(get_speech_gateway),
) -> TranscriptResponse:
    raw = await audio.read(config.max_audio_bytes + 1)
    await audio.close()
    if len(raw) > config.max_audio_bytes:
        raise APIError(
            "AUDIO_TOO_LARGE",
            "The voice memo is too large. Please record a shorter memo.",
            status_code=413,
            recoverable=True,
        )
    return await speech_gateway.transcribe(
        raw,
        audio.content_type,
        audio.filename or "incident-memo.webm",
        language,
    )


@app.post("/api/generate-briefing", response_model=BriefingResponse)
async def generate_briefing(
    request: BriefingRequest,
    gateway: AgnesGateway = Depends(get_gateway),
) -> BriefingResponse:
    return await gateway.briefing(request)
