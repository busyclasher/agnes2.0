from __future__ import annotations

import hashlib
from abc import ABC, abstractmethod
from pathlib import Path

from app.config import Settings
from app.errors import APIError
from app.models import (
    IncidentReportRequest,
    IncidentReportResponse,
    ScanResult,
    SourceState,
    SupportedLanguage,
)
from app.services.fixtures import scan_fixture
from app.services.image_processing import ProcessedImage

SAMPLE_NAMES = {
    "fall-hazard.png": "fall_hazard",
    "chemical-warning.png": "chemical_hazard",
    "ppe-required.png": "ppe_required",
}


class AgnesGateway(ABC):
    @abstractmethod
    async def scan(
        self, image: ProcessedImage, language: SupportedLanguage, site_context: str
    ) -> ScanResult:
        raise NotImplementedError

    @abstractmethod
    async def incident(
        self, request: IncidentReportRequest
    ) -> IncidentReportResponse:
        raise NotImplementedError


class FixtureAgnesGateway(AgnesGateway):
    def __init__(self, config: Settings) -> None:
        self.config = config
        self.sample_hashes = _load_sample_hashes(config.sample_sign_dir)

    async def scan(
        self, image: ProcessedImage, language: SupportedLanguage, site_context: str
    ) -> ScanResult:
        del site_context
        sample_kind = self.sample_hashes.get(image.digest)
        if not self.config.use_sample_fallback or sample_kind is None:
            raise APIError(
                "AGNES_API_UNAVAILABLE",
                "Live image analysis is not configured for this photo. Use a demo sample or connect the Agnes API.",
                status_code=503,
                recoverable=True,
            )

        payload = scan_fixture(sample_kind, language)
        return ScanResult(
            scan_id=f"scan_{image.digest[:12]}",
            language=language,
            source_state=SourceState.SAMPLE,
            **payload,
        )

    async def incident(
        self, request: IncidentReportRequest
    ) -> IncidentReportResponse:
        translations = {
            SupportedLanguage.BENGALI: "কর্মীর বক্তব্য: " + request.worker_statement,
            SupportedLanguage.TAMIL: "தொழிலாளர் விளக்கம்: " + request.worker_statement,
            SupportedLanguage.HINDI: "कर्मचारी का विवरण: " + request.worker_statement,
        }
        lowered = request.worker_statement.lower()
        incident_type = (
            "slip_trip_fall"
            if any(word in lowered for word in ("slip", "fell", "fall", "wet"))
            else "safety_observation"
        )
        return IncidentReportResponse(
            report_id="report_"
            + hashlib.sha256(
                f"{request.location}:{request.worker_statement}".encode()
            ).hexdigest()[:12],
            english_report=(
                f"A worker reported the following near miss at {request.location}: "
                f"{request.worker_statement}"
            ),
            worker_language_summary=translations[request.language],
            incident_type=incident_type,
            severity="near_miss",
            suggested_next_step=(
                "Notify the supervisor, secure the area if safe to do so, and confirm the report before sharing."
            ),
            requires_confirmation=True,
            source_state=SourceState.SAMPLE,
        )


class LiveAgnesGateway(AgnesGateway):
    def __init__(self, config: Settings) -> None:
        self.config = config

    async def scan(
        self, image: ProcessedImage, language: SupportedLanguage, site_context: str
    ) -> ScanResult:
        del image, language, site_context
        raise APIError(
            "AGNES_PROTOCOL_NOT_CONFIGURED",
            "The Agnes integration boundary is ready, but private API protocol details have not been configured.",
            status_code=503,
            recoverable=True,
        )

    async def incident(
        self, request: IncidentReportRequest
    ) -> IncidentReportResponse:
        del request
        raise APIError(
            "AGNES_PROTOCOL_NOT_CONFIGURED",
            "The Agnes integration boundary is ready, but private API protocol details have not been configured.",
            status_code=503,
            recoverable=True,
        )


def build_gateway(config: Settings) -> AgnesGateway:
    if config.agnes_mode == "live":
        return LiveAgnesGateway(config)
    return FixtureAgnesGateway(config)


def _load_sample_hashes(directory: Path) -> dict[str, str]:
    hashes: dict[str, str] = {}
    for filename, kind in SAMPLE_NAMES.items():
        path = directory / filename
        if path.is_file():
            hashes[hashlib.sha256(path.read_bytes()).hexdigest()] = kind
    return hashes
