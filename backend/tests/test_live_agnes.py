from __future__ import annotations

import asyncio
import json
from io import BytesIO

import httpx
import pytest
from PIL import Image

from app.config import Settings
from app.errors import APIError
from app.models import SourceState, SupportedLanguage
from app.services.agnes import LiveAgnesGateway
from app.services.image_processing import process_image


def _processed_image():
    output = BytesIO()
    Image.new("RGB", (120, 80), "yellow").save(output, "PNG")
    config = Settings()
    return process_image(output.getvalue(), "image/png", config)


def test_live_scan_uses_multimodal_contract() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["authorization"] == "Bearer test-key"
        body = json.loads(request.content)
        assert body["model"] == "agnes-2.0-flash"
        assert body["response_format"] == {"type": "json_object"}
        image_url = body["messages"][1]["content"][1]["image_url"]["url"]
        assert image_url.startswith("data:image/jpeg;base64,")
        content = {
            "detected_text": "DANGER OPEN EDGE",
            "translated_text": "खतरा। खुला किनारा।",
            "plain_explanation": "There is a fall hazard.",
            "risk_level": "red",
            "risk_label": "Danger",
            "risk_reason": "An open edge warning is visible.",
            "hazard_type": "fall_hazard",
            "ppe_required": [
                {"name": "Safety harness", "icon": "harness", "required": True}
            ],
            "action_steps": [
                {"label": "Do not approach the edge.", "priority": "high"}
            ],
            "audio_text": "खतरा। किनारे से दूर रहें।",
            "confidence": 0.92,
            "uncertainty_note": "The sign is clear.",
            "pictogram_prompt": "Show an open-edge fall hazard and harness.",
        }
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": json.dumps(content)}}]},
        )

    config = Settings(
        agnes_mode="live",
        agnes_api_key="test-key",
        agnes_base_url="https://agnes.test/v1",
        agnes_model="agnes-2.0-flash",
    )
    gateway = LiveAgnesGateway(config, httpx.MockTransport(handler))
    result = asyncio.run(
        gateway.scan(_processed_image(), SupportedLanguage.HINDI, "construction")
    )

    assert result.risk_level.value == "red"
    assert result.language == SupportedLanguage.HINDI
    assert result.source_state == SourceState.LIVE
    assert result.audio_text.startswith("खतरा")


def test_live_scan_rejects_malformed_model_output() -> None:
    transport = httpx.MockTransport(
        lambda request: httpx.Response(
            200,
            json={"choices": [{"message": {"content": '{"risk_level":"red"}'}}]},
        )
    )
    gateway = LiveAgnesGateway(
        Settings(
            agnes_mode="live",
            agnes_api_key="test-key",
            agnes_base_url="https://agnes.test/v1",
        ),
        transport,
    )

    with pytest.raises(APIError) as caught:
        asyncio.run(
            gateway.scan(
                _processed_image(),
                SupportedLanguage.BENGALI,
                "construction",
            )
        )

    assert caught.value.code == "INVALID_AI_RESPONSE"


def test_live_scan_requires_backend_credentials() -> None:
    gateway = LiveAgnesGateway(
        Settings(agnes_mode="live", agnes_api_key=None, agnes_base_url=None)
    )

    with pytest.raises(APIError) as caught:
        asyncio.run(
            gateway.scan(
                _processed_image(),
                SupportedLanguage.TAMIL,
                "construction",
            )
        )

    assert caught.value.code == "AGNES_NOT_CONFIGURED"
