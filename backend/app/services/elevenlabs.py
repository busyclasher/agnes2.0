from __future__ import annotations

import httpx

from app.config import Settings
from app.errors import APIError
from app.models import SupportedLanguage

LANGUAGE_CODES = {
    SupportedLanguage.BENGALI: "bn",
    SupportedLanguage.TAMIL: "ta",
    SupportedLanguage.HINDI: "hi",
}


class ElevenLabsGateway:
    def __init__(
        self,
        config: Settings,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.config = config
        self.transport = transport

    async def generate(
        self,
        text: str,
        language: SupportedLanguage,
    ) -> bytes:
        if not self.config.elevenlabs_api_key or not self.config.elevenlabs_voice_id:
            raise APIError(
                "ELEVENLABS_NOT_CONFIGURED",
                "Cloud audio is not configured. SafePoint will use browser audio when available.",
                status_code=503,
                recoverable=True,
            )

        url = (
            self.config.elevenlabs_base_url.rstrip("/")
            + f"/text-to-speech/{self.config.elevenlabs_voice_id}"
        )
        try:
            async with httpx.AsyncClient(
                timeout=self.config.elevenlabs_timeout_seconds,
                transport=self.transport,
            ) as client:
                response = await client.post(
                    url,
                    params={"output_format": "mp3_44100_128"},
                    headers={
                        "xi-api-key": self.config.elevenlabs_api_key,
                        "Content-Type": "application/json",
                        "Accept": "audio/mpeg",
                    },
                    json={
                        "text": text,
                        "model_id": self.config.elevenlabs_model_id,
                        "language_code": LANGUAGE_CODES[language],
                    },
                )
        except httpx.TimeoutException:
            raise APIError(
                "ELEVENLABS_TIMEOUT",
                "Cloud audio took too long. SafePoint will use browser audio when available.",
                status_code=504,
                recoverable=True,
            ) from None
        except httpx.RequestError:
            raise APIError(
                "ELEVENLABS_UNAVAILABLE",
                "Cloud audio could not be reached. SafePoint will use browser audio when available.",
                status_code=503,
                recoverable=True,
            ) from None

        if response.status_code in {401, 403}:
            raise APIError(
                "ELEVENLABS_AUTH_ERROR",
                "Cloud audio authentication failed. SafePoint will use browser audio when available.",
                status_code=502,
                recoverable=True,
            )
        if response.status_code == 429:
            raise APIError(
                "ELEVENLABS_QUOTA_EXCEEDED",
                "Cloud audio is temporarily unavailable. SafePoint will use browser audio when available.",
                status_code=503,
                recoverable=True,
            )
        if response.status_code >= 400:
            raise APIError(
                "ELEVENLABS_API_ERROR",
                "Cloud audio could not be generated. SafePoint will use browser audio when available.",
                status_code=502,
                recoverable=True,
            )

        if not response.content or not response.headers.get(
            "content-type", ""
        ).lower().startswith("audio/"):
            raise APIError(
                "ELEVENLABS_INVALID_RESPONSE",
                "Cloud audio returned an invalid response. SafePoint will use browser audio when available.",
                status_code=502,
                recoverable=True,
            )

        return response.content
