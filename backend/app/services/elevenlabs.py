from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx

from app.config import Settings
from app.errors import APIError
from app.models import SourceState, SupportedLanguage, TranscriptResponse

LANGUAGE_CODES: dict[SupportedLanguage, str] = {
    SupportedLanguage.BENGALI: "bn",
    SupportedLanguage.TAMIL: "ta",
    SupportedLanguage.HINDI: "hi",
}

SUPPORTED_AUDIO_PREFIXES = ("audio/", "video/webm")


@dataclass(frozen=True)
class SpeechAudio:
    content: bytes
    media_type: str


class ElevenLabsGateway:
    def __init__(
        self, config: Settings, transport: httpx.AsyncBaseTransport | None = None
    ) -> None:
        self.config = config
        self.transport = transport

    async def generate(self, text: str, language: SupportedLanguage) -> bytes:
        audio = await self.create_speech(text, language)
        return audio.content

    async def create_speech(
        self, text: str, language: SupportedLanguage
    ) -> SpeechAudio:
        self._ensure_configured()
        voice_id = self._voice_id(language)
        try:
            async with httpx.AsyncClient(
                timeout=self.config.elevenlabs_timeout_seconds,
                transport=self.transport,
            ) as client:
                response = await client.post(
                    f"{self.config.elevenlabs_base_url}/text-to-speech/{voice_id}",
                    params={"output_format": "mp3_44100_128"},
                    headers={
                        "xi-api-key": self.config.elevenlabs_api_key or "",
                        "Content-Type": "application/json",
                        "Accept": "audio/mpeg",
                    },
                    json={
                        "text": text,
                        "model_id": self.config.elevenlabs_tts_model_id,
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

        self._raise_for_status(response, "Cloud audio")
        content_type = response.headers.get("content-type", "").lower()
        if not response.content or not content_type.startswith("audio/"):
            raise APIError(
                "ELEVENLABS_INVALID_RESPONSE",
                "Cloud audio returned an invalid response. SafePoint will use browser audio when available.",
                status_code=502,
                recoverable=True,
            )
        return SpeechAudio(content=response.content, media_type="audio/mpeg")

    async def transcribe(
        self,
        audio: bytes,
        content_type: str | None,
        filename: str,
        language: SupportedLanguage,
    ) -> TranscriptResponse:
        self._ensure_configured()
        if not self._is_supported_audio_type(content_type):
            raise APIError(
                "INVALID_AUDIO",
                "Please record an audio memo before creating the report.",
                status_code=415,
                recoverable=True,
            )
        if len(audio) > self.config.max_audio_bytes:
            raise APIError(
                "AUDIO_TOO_LARGE",
                "The voice memo is too large. Please record a shorter memo.",
                status_code=413,
                recoverable=True,
            )

        form = {
            "model_id": self.config.elevenlabs_stt_model_id,
            "language_code": LANGUAGE_CODES[language],
            "tag_audio_events": "false",
            "diarize": "false",
            "num_speakers": "1",
            "timestamps_granularity": "none",
        }
        files = {
            "file": (
                filename or "incident-memo.webm",
                audio,
                content_type or "audio/webm",
            )
        }
        try:
            async with httpx.AsyncClient(
                timeout=max(self.config.elevenlabs_timeout_seconds, 45.0),
                transport=self.transport,
            ) as client:
                response = await client.post(
                    f"{self.config.elevenlabs_base_url}/speech-to-text",
                    data=form,
                    files=files,
                    headers={"xi-api-key": self.config.elevenlabs_api_key or ""},
                )
        except httpx.TimeoutException:
            raise APIError(
                "ELEVENLABS_TIMEOUT",
                "Voice transcription took too long. Type the report instead.",
                status_code=504,
                recoverable=True,
            ) from None
        except httpx.RequestError:
            raise APIError(
                "ELEVENLABS_UNAVAILABLE",
                "Voice transcription is temporarily unavailable. Type the report instead.",
                status_code=503,
                recoverable=True,
            ) from None

        self._raise_for_status(response, "Voice transcription")
        data: dict[str, Any] = response.json()
        transcript = str(data.get("text", "")).strip()
        if not transcript:
            raise APIError(
                "EMPTY_TRANSCRIPT",
                "I could not hear enough detail. Please record again or type the report.",
                status_code=422,
                recoverable=True,
            )
        confidence = data.get("language_probability")
        return TranscriptResponse(
            transcript=transcript,
            language=language,
            detected_language_code=data.get("language_code"),
            confidence=float(confidence) if confidence is not None else None,
            source_state=SourceState.LIVE,
        )

    def _ensure_configured(self) -> None:
        if not self.config.elevenlabs_api_key or not self.config.elevenlabs_voice_id:
            raise APIError(
                "ELEVENLABS_NOT_CONFIGURED",
                "Cloud audio is not configured. SafePoint will use browser audio when available.",
                status_code=503,
                recoverable=True,
            )

    def _voice_id(self, language: SupportedLanguage) -> str:
        language_voice_ids = {
            SupportedLanguage.BENGALI: self.config.elevenlabs_bengali_voice_id,
            SupportedLanguage.TAMIL: self.config.elevenlabs_tamil_voice_id,
            SupportedLanguage.HINDI: self.config.elevenlabs_hindi_voice_id,
        }
        return language_voice_ids[language] or self.config.elevenlabs_voice_id

    def _is_supported_audio_type(self, content_type: str | None) -> bool:
        if not content_type:
            return False
        return content_type.startswith(SUPPORTED_AUDIO_PREFIXES)

    def _raise_for_status(self, response: httpx.Response, label: str) -> None:
        if response.status_code < 400:
            return
        if response.status_code in {401, 403}:
            code = "ELEVENLABS_AUTH_ERROR"
            message = f"{label} authentication failed. SafePoint will use a fallback when available."
        elif response.status_code == 429:
            code = "ELEVENLABS_QUOTA_EXCEEDED"
            message = f"{label} is temporarily unavailable. SafePoint will use a fallback when available."
        else:
            code = "ELEVENLABS_API_ERROR"
            message = f"{label} could not be completed. SafePoint will use a fallback when available."
        raise APIError(code, message, status_code=502, recoverable=True)
