from __future__ import annotations

import asyncio
import logging
from io import BytesIO
from pathlib import Path

from fastapi.testclient import TestClient
from PIL import Image

from app.config import REPO_ROOT
from app.config import Settings
from app.main import app, get_audio_gateway, get_gateway, get_settings
from app.models import SourceState, SupportedLanguage
from app.services.agnes import build_gateway
from app.services.image_processing import process_image

test_settings = Settings(
    agnes_mode="fixture",
    agnes_api_key=None,
    agnes_base_url=None,
    elevenlabs_api_key=None,
    elevenlabs_voice_id=None,
    use_sample_fallback=True,
)
test_gateway = build_gateway(test_settings)
app.dependency_overrides[get_settings] = lambda: test_settings
app.dependency_overrides[get_gateway] = lambda: test_gateway
client = TestClient(app)
SAMPLES = REPO_ROOT / "data" / "sample-signs"


def test_health_does_not_expose_credentials() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert "api_key" not in str(payload).lower()
    assert "agnes_configured" in payload
    assert payload["agnes_model"]
    assert payload["elevenlabs_configured"] is False
    assert payload["audio_model"] == "eleven_v3"
    assert "voice_id" not in str(payload).lower()
    assert payload["image_storage_enabled"] is False


def test_known_sample_returns_contract() -> None:
    image = (SAMPLES / "fall-hazard.png").read_bytes()
    response = client.post(
        "/api/scan-safety-image",
        files={"image": ("fall-hazard.png", image, "image/png")},
        data={"language": "Bengali", "site_context": "construction", "mode": "scan"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["risk_level"] == "red"
    assert payload["language"] == "Bengali"
    assert payload["source_state"] == "sample"
    assert payload["action_steps"]
    assert 0 <= payload["confidence"] <= 1


def test_unknown_image_never_gets_fixture_guidance() -> None:
    output = BytesIO()
    Image.new("RGB", (80, 80), "purple").save(output, "PNG")
    response = client.post(
        "/api/scan-safety-image",
        files={"image": ("unknown.png", output.getvalue(), "image/png")},
        data={"language": "Hindi", "site_context": "construction", "mode": "scan"},
    )
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "AGNES_API_UNAVAILABLE"
    assert response.json()["error"]["recoverable"] is True


def test_rejects_invalid_content_type() -> None:
    response = client.post(
        "/api/scan-safety-image",
        files={"image": ("note.txt", b"not an image", "text/plain")},
        data={"language": "Tamil", "site_context": "construction", "mode": "scan"},
    )
    assert response.status_code == 415
    assert response.json()["error"]["code"] == "INVALID_IMAGE"


def test_raw_image_bytes_are_not_logged(caplog) -> None:
    marker = b"private-worker-image-marker"
    caplog.set_level(logging.DEBUG)
    response = client.post(
        "/api/scan-safety-image",
        files={"image": ("bad.png", marker, "image/png")},
        data={"language": "Tamil", "site_context": "construction", "mode": "scan"},
    )
    assert response.status_code == 400
    assert marker.decode() not in caplog.text


def test_incident_report_requires_confirmation() -> None:
    response = client.post(
        "/api/generate-incident-report",
        json={
            "language": "Tamil",
            "worker_statement": "I slipped near the wet staircase.",
            "location": "Level 3 staircase",
        },
    )
    assert response.status_code == 200
    assert response.json()["requires_confirmation"] is True
    assert response.json()["source_state"] == "sample"


def test_pictogram_is_independent() -> None:
    response = client.post(
        "/api/generate-pictogram-card",
        json={
            "scan_id": "scan_demo",
            "risk_level": "yellow",
            "hazard_type": "ppe_required",
            "language": "Hindi",
            "action_steps": ["Wear required PPE."],
        },
    )
    assert response.status_code == 200
    assert response.json()["image_url"].endswith("language=Hindi")


def test_audio_endpoint_streams_without_caching() -> None:
    class FakeAudioGateway:
        async def generate(self, text, language):
            assert text == "সাবধানে কাজ করুন।"
            assert language == SupportedLanguage.BENGALI
            return b"fake-mp3"

    app.dependency_overrides[get_audio_gateway] = lambda: FakeAudioGateway()
    try:
        response = client.post(
            "/api/generate-audio-guidance",
            json={
                "text": "সাবধানে কাজ করুন।",
                "language": "Bengali",
            },
        )
    finally:
        app.dependency_overrides.pop(get_audio_gateway, None)

    assert response.status_code == 200
    assert response.content == b"fake-mp3"
    assert response.headers["content-type"].startswith("audio/mpeg")
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["x-audio-source"] == "elevenlabs"


def test_audio_endpoint_rejects_empty_or_oversized_text() -> None:
    for text in ("   ", "a" * 2001):
        response = client.post(
            "/api/generate-audio-guidance",
            json={"text": text, "language": "Hindi"},
        )
        assert response.status_code == 422


def test_live_mode_falls_back_only_for_known_samples() -> None:
    config = Settings(
        agnes_mode="live",
        agnes_api_key=None,
        agnes_base_url=None,
        use_sample_fallback=True,
        sample_sign_dir=SAMPLES,
    )
    image = process_image(
        (SAMPLES / "fall-hazard.png").read_bytes(),
        "image/png",
        config,
    )
    result = asyncio.run(
        build_gateway(config).scan(image, SupportedLanguage.HINDI, "construction")
    )
    assert result.source_state == SourceState.FALLBACK


def test_daily_briefing_matches_contract() -> None:
    response = client.post(
        "/api/generate-briefing",
        json={
            "language": "Hindi",
            "site_zone": "Level 3",
            "today_tasks": ["open-edge work", "scaffold inspection"],
            "hazards": ["fall hazard", "moving materials"],
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["source_state"] == "sample"
    assert "Level 3" in payload["briefing_text"]
    assert payload["audio_text"] == payload["briefing_text"]
    assert "30-second" in payload["video_prompt"]
