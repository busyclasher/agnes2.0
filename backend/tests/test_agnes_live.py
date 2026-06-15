from __future__ import annotations

import asyncio
import json

import httpx

from app.config import Settings
from app.models import SupportedLanguage
from app.services.agnes import LiveAgnesGateway
from app.services.image_processing import ProcessedImage


def test_live_agnes_scan_uses_openai_compatible_vision_payload() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v1/chat/completions"
        assert request.headers["authorization"] == "Bearer agnes_key"
        payload = json.loads(request.content.decode())
        assert payload["model"] == "agnes-1.5-pro"
        assert payload["response_format"] == {"type": "json_object"}
        user_content = payload["messages"][1]["content"]
        assert user_content[0]["type"] == "image_url"
        assert user_content[0]["image_url"]["url"].startswith("data:image/jpeg;base64,")
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "content": json.dumps(
                                {
                                    "detected_text": "WARNING: WET FLOOR",
                                    "translated_text": "எச்சரிக்கை: ஈரமான தரை.",
                                    "plain_explanation": "தரை வழுக்கலாக இருக்கலாம்.",
                                    "risk_level": "medium",
                                    "risk_reason": "The sign warns about a slip hazard.",
                                    "hazard_type": "slip_hazard",
                                    "ppe_required": [],
                                    "action_steps": [
                                        {
                                            "label": "Walk slowly and keep clear of the wet area.",
                                            "priority": "high",
                                        }
                                    ],
                                    "audio_text": "எச்சரிக்கை. தரை வழுக்கலாக இருக்கலாம்.",
                                    "confidence": 0.88,
                                    "uncertainty_note": "The sign appears readable.",
                                    "pictogram_prompt": "Wet floor caution card.",
                                }
                            )
                        }
                    }
                ]
            },
        )

    gateway = LiveAgnesGateway(
        Settings(
            agnes_api_key="agnes_key",
            agnes_base_url="https://apihub.agnes-ai.com/v1",
        ),
        transport=httpx.MockTransport(handler),
    )
    image = ProcessedImage(
        digest="a" * 64,
        content=b"jpeg-bytes",
        width=120,
        height=80,
        source_format="JPEG",
    )

    result = asyncio.run(gateway.scan(image, SupportedLanguage.TAMIL, "construction"))

    assert result.language == SupportedLanguage.TAMIL
    assert result.detected_text == "WARNING: WET FLOOR"
    assert result.risk_level == "yellow"
    assert result.source_state == "live"
    assert result.translated_text == "எச்சரிக்கை: ஈரமான தரை."
