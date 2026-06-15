from __future__ import annotations

import asyncio
import json
from io import BytesIO

import httpx
import pytest
from PIL import Image

from app.config import Settings
from app.errors import APIError
from app.models import (
    BriefingRequest,
    IncidentReportRequest,
    PictogramRequest,
    SourceState,
    SupportedLanguage,
)
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
        image_url = body["messages"][1]["content"][0]["image_url"]["url"]
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


def test_live_pictogram_uses_agnes_image_generation_contract() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v1/images/generations"
        assert request.headers["authorization"] == "Bearer test-key"
        body = json.loads(request.content)
        assert body["model"] == "agnes-image-2.1-flash"
        assert body["size"] == "1024x1024"
        assert body["n"] == 1
        assert "DANGER KEEP OUT" in body["prompt"]
        assert "Risk level: RED" in body["prompt"]
        assert "no text in image" in body["prompt"]
        return httpx.Response(
            200,
            json={"data": [{"url": "https://agnes.test/generated-danger.png"}]},
        )

    gateway = LiveAgnesGateway(
        Settings(
            agnes_mode="live",
            agnes_api_key="test-key",
            agnes_base_url="https://agnes.test/v1",
            agnes_image_model="agnes-image-2.1-flash",
            agnes_image_size="1024x1024",
        ),
        httpx.MockTransport(handler),
    )
    result = asyncio.run(
        gateway.pictogram(
            PictogramRequest(
                scan_id="scan_demo",
                risk_level="red",
                hazard_type="restricted_area",
                language=SupportedLanguage.TAMIL,
                action_steps=["Do not enter this area."],
                detected_text="DANGER KEEP OUT",
                plain_explanation="This appears to be a high-risk keep-out warning.",
                risk_reason="A red danger sign says keep out.",
                pictogram_prompt="Show a restricted area danger warning.",
            )
        )
    )

    assert result.image_url == "https://agnes.test/generated-danger.png"
    assert result.source_state == SourceState.LIVE
    assert "restricted area" in result.alt_text


def test_live_incident_adds_deterministic_mom_workflow() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        prompt = body["messages"][1]["content"]
        assert "Medical outcome known to worker: light_duty" in prompt
        content = {
            "english_report": "Incident Summary\nA worker was injured.",
            "worker_language_summary": "தொழிலாளர் காயமடைந்தார்.",
            "incident_type": "injury",
            "severity": "injury_follow_up",
            "suggested_next_step": "Tell the supervisor immediately.",
        }
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": json.dumps(content)}}]},
        )

    gateway = LiveAgnesGateway(
        Settings(
            agnes_mode="live",
            agnes_api_key="test-key",
            agnes_base_url="https://agnes.test/v1",
        ),
        httpx.MockTransport(handler),
    )
    request = IncidentReportRequest(
        language=SupportedLanguage.TAMIL,
        worker_statement="தொழிலாளர் வழுக்கி காயமடைந்தார்.",
        location="Level 3",
        occurred_at="2026-06-15T09:30:00+08:00",
        event_type="injury_or_illness",
        medical_outcome="light_duty",
        people_affected=1,
        immediate_actions="Work stopped.",
    )

    result = asyncio.run(gateway.incident(request))

    assert result.mom_workflow.review_priority == "prompt"
    assert result.mom_workflow.submitted_to_mom is False
    assert "10 days" in result.mom_workflow.deadline_note


def test_live_briefing_enforces_language_and_matching_audio() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        content = {
            "briefing_text": "নিরাপত্তা নির্দেশনা।",
            "audio_text": "This value must be replaced.",
            "video_prompt": "Create a 30-second briefing.",
            "pictogram_prompt": "Create a safety card.",
        }
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": json.dumps(content)}}]},
        )

    gateway = LiveAgnesGateway(
        Settings(
            agnes_mode="live",
            agnes_api_key="test-key",
            agnes_base_url="https://agnes.test/v1",
        ),
        httpx.MockTransport(handler),
    )
    request = BriefingRequest(
        language=SupportedLanguage.BENGALI,
        site_zone="Level 3",
        today_tasks=["open-edge work"],
        hazards=["fall hazard"],
        required_ppe=["safety helmet"],
    )

    result = asyncio.run(gateway.briefing(request))

    assert result.language == SupportedLanguage.BENGALI
    assert result.target_duration_seconds == 30
    assert result.audio_text == result.briefing_text
