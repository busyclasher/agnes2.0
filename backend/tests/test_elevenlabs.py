from __future__ import annotations

import asyncio
import json

import httpx
import pytest

from app.config import Settings
from app.errors import APIError
from app.models import SupportedLanguage
from app.services.elevenlabs import ElevenLabsGateway


@pytest.mark.parametrize(
    ("language", "code"),
    [
        (SupportedLanguage.BENGALI, "bn"),
        (SupportedLanguage.TAMIL, "ta"),
        (SupportedLanguage.HINDI, "hi"),
    ],
)
def test_generates_audio_with_language_code(
    language: SupportedLanguage,
    code: str,
) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v1/text-to-speech/voice-123"
        assert request.url.params["output_format"] == "mp3_44100_128"
        assert request.headers["xi-api-key"] == "test-key"
        body = json.loads(request.content)
        assert body == {
            "text": "Worker guidance",
            "model_id": "eleven_v3",
            "language_code": code,
        }
        return httpx.Response(
            200,
            content=b"fake-mp3",
            headers={"content-type": "audio/mpeg"},
        )

    gateway = ElevenLabsGateway(
        Settings(
            elevenlabs_api_key="test-key",
            elevenlabs_voice_id="voice-123",
            elevenlabs_base_url="https://eleven.test/v1",
            elevenlabs_model_id="eleven_v3",
        ),
        httpx.MockTransport(handler),
    )

    assert asyncio.run(gateway.generate("Worker guidance", language)) == b"fake-mp3"


@pytest.mark.parametrize(
    ("provider_status", "expected_code"),
    [
        (401, "ELEVENLABS_AUTH_ERROR"),
        (403, "ELEVENLABS_AUTH_ERROR"),
        (429, "ELEVENLABS_QUOTA_EXCEEDED"),
        (500, "ELEVENLABS_API_ERROR"),
    ],
)
def test_maps_provider_errors(provider_status: int, expected_code: str) -> None:
    gateway = ElevenLabsGateway(
        Settings(
            elevenlabs_api_key="test-key",
            elevenlabs_voice_id="voice-123",
            elevenlabs_base_url="https://eleven.test/v1",
        ),
        httpx.MockTransport(
            lambda request: httpx.Response(provider_status, json={"detail": "private"})
        ),
    )

    with pytest.raises(APIError) as caught:
        asyncio.run(gateway.generate("Worker guidance", SupportedLanguage.HINDI))

    assert caught.value.code == expected_code
    assert caught.value.recoverable is True
    assert "private" not in caught.value.message


def test_rejects_missing_configuration() -> None:
    gateway = ElevenLabsGateway(
        Settings(elevenlabs_api_key=None, elevenlabs_voice_id=None)
    )

    with pytest.raises(APIError) as caught:
        asyncio.run(gateway.generate("Worker guidance", SupportedLanguage.TAMIL))

    assert caught.value.code == "ELEVENLABS_NOT_CONFIGURED"


def test_rejects_non_audio_response() -> None:
    gateway = ElevenLabsGateway(
        Settings(
            elevenlabs_api_key="test-key",
            elevenlabs_voice_id="voice-123",
            elevenlabs_base_url="https://eleven.test/v1",
        ),
        httpx.MockTransport(
            lambda request: httpx.Response(
                200,
                json={"unexpected": "response"},
            )
        ),
    )

    with pytest.raises(APIError) as caught:
        asyncio.run(gateway.generate("Worker guidance", SupportedLanguage.BENGALI))

    assert caught.value.code == "ELEVENLABS_INVALID_RESPONSE"


@pytest.mark.parametrize(
    ("failure", "expected_code"),
    [
        (
            httpx.ReadTimeout(
                "slow provider",
                request=httpx.Request("POST", "https://eleven.test"),
            ),
            "ELEVENLABS_TIMEOUT",
        ),
        (
            httpx.ConnectError(
                "offline",
                request=httpx.Request("POST", "https://eleven.test"),
            ),
            "ELEVENLABS_UNAVAILABLE",
        ),
    ],
)
def test_maps_network_failures(
    failure: httpx.RequestError,
    expected_code: str,
) -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        raise failure

    gateway = ElevenLabsGateway(
        Settings(
            elevenlabs_api_key="test-key",
            elevenlabs_voice_id="voice-123",
            elevenlabs_base_url="https://eleven.test/v1",
        ),
        httpx.MockTransport(handler),
    )

    with pytest.raises(APIError) as caught:
        asyncio.run(gateway.generate("Worker guidance", SupportedLanguage.HINDI))

    assert caught.value.code == expected_code
    assert caught.value.recoverable is True
