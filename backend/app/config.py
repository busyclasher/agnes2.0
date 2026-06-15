from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = BACKEND_ROOT.parent
REPO_ROOT = (
    REPOSITORY_ROOT if (REPOSITORY_ROOT / "data").exists() else BACKEND_ROOT
)


def _as_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    environment: str = os.getenv("ENVIRONMENT", "development")
    agnes_mode: str = os.getenv("AGNES_MODE", "fixture")
    agnes_api_key: str | None = os.getenv("AGNES_API_KEY")
    agnes_base_url: str | None = os.getenv("AGNES_BASE_URL")
    agnes_model: str = os.getenv("AGNES_MODEL", "agnes-2.0-flash")
    agnes_timeout_seconds: float = float(os.getenv("AGNES_TIMEOUT_SECONDS", "30"))
    elevenlabs_api_key: str | None = os.getenv("ELEVENLABS_API_KEY")
    elevenlabs_voice_id: str | None = os.getenv("ELEVENLABS_VOICE_ID")
    elevenlabs_base_url: str = os.getenv(
        "ELEVENLABS_BASE_URL", "https://api.elevenlabs.io/v1"
    )
    elevenlabs_model_id: str = os.getenv("ELEVENLABS_MODEL_ID", "eleven_v3")
    elevenlabs_timeout_seconds: float = float(
        os.getenv("ELEVENLABS_TIMEOUT_SECONDS", "20")
    )
    use_sample_fallback: bool = _as_bool(os.getenv("USE_SAMPLE_FALLBACK"), True)
    store_scanned_images: bool = _as_bool(
        os.getenv("STORE_SCANNED_IMAGES_BY_DEFAULT"), False
    )
    max_image_bytes: int = int(os.getenv("MAX_IMAGE_BYTES", str(10 * 1024 * 1024)))
    max_image_dimension: int = int(os.getenv("MAX_IMAGE_DIMENSION", "2400"))
    confidence_threshold: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.55"))
    frontend_origins: tuple[str, ...] = tuple(
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
        ).split(",")
        if origin.strip()
    )
    sample_sign_dir: Path = REPO_ROOT / "data" / "sample-signs"


settings = Settings()
