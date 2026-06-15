from __future__ import annotations

import hashlib
from abc import ABC, abstractmethod
from pathlib import Path

from app.config import Settings
from app.errors import APIError
from app.models import (
    BriefingRequest,
    BriefingResponse,
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

    @abstractmethod
    async def briefing(self, request: BriefingRequest) -> BriefingResponse:
        raise NotImplementedError


class FixtureAgnesGateway(AgnesGateway):
    def __init__(
        self,
        config: Settings,
        source_state: SourceState = SourceState.SAMPLE,
    ) -> None:
        self.config = config
        self.source_state = source_state
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
            source_state=self.source_state,
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
            source_state=self.source_state,
        )

    async def briefing(self, request: BriefingRequest) -> BriefingResponse:
        tasks = ", ".join(request.today_tasks)
        hazards = ", ".join(request.hazards)
        templates = {
            SupportedLanguage.BENGALI: (
                f"আজ {request.site_zone} এলাকায় কাজ হবে: {tasks}। "
                f"প্রধান ঝুঁকি: {hazards}। কাজ শুরুর আগে PPE পরীক্ষা করুন, "
                "নিরাপদ কাজের পদ্ধতি অনুসরণ করুন এবং কোনো কিছু অস্পষ্ট হলে সুপারভাইজারকে জিজ্ঞাসা করুন।"
            ),
            SupportedLanguage.TAMIL: (
                f"இன்று {request.site_zone} பகுதியில் செய்யும் பணிகள்: {tasks}. "
                f"முக்கிய அபாயங்கள்: {hazards}. வேலை தொடங்கும் முன் PPE-ஐ சரிபார்க்கவும், "
                "பாதுகாப்பான வேலை முறையைப் பின்பற்றவும், தெளிவில்லையெனில் மேற்பார்வையாளரிடம் கேட்கவும்."
            ),
            SupportedLanguage.HINDI: (
                f"आज {request.site_zone} क्षेत्र में कार्य हैं: {tasks}। "
                f"मुख्य खतरे: {hazards}। काम शुरू करने से पहले PPE जांचें, "
                "सुरक्षित कार्य प्रक्रिया का पालन करें और संदेह होने पर सुपरवाइजर से पूछें।"
            ),
        }
        briefing_text = templates[request.language]
        return BriefingResponse(
            briefing_text=briefing_text,
            audio_text=briefing_text,
            video_prompt=(
                f"Create a calm 30-second construction safety briefing for "
                f"{request.site_zone}. Show these tasks: {tasks}. Show these hazards: "
                f"{hazards}. Use culturally neutral workers, clear PPE, and no unsafe acts."
            ),
            pictogram_prompt=(
                f"Create a simple high-contrast briefing card for {request.site_zone} "
                f"showing {hazards}, required PPE, and a supervisor-check symbol."
            ),
            source_state=self.source_state,
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

    async def briefing(self, request: BriefingRequest) -> BriefingResponse:
        del request
        raise APIError(
            "AGNES_PROTOCOL_NOT_CONFIGURED",
            "The Agnes integration boundary is ready, but private API protocol details have not been configured.",
            status_code=503,
            recoverable=True,
        )


class FallbackAgnesGateway(AgnesGateway):
    def __init__(self, primary: AgnesGateway, fallback: AgnesGateway) -> None:
        self.primary = primary
        self.fallback = fallback

    async def scan(
        self, image: ProcessedImage, language: SupportedLanguage, site_context: str
    ) -> ScanResult:
        try:
            return await self.primary.scan(image, language, site_context)
        except APIError:
            return await self.fallback.scan(image, language, site_context)

    async def incident(
        self, request: IncidentReportRequest
    ) -> IncidentReportResponse:
        try:
            return await self.primary.incident(request)
        except APIError:
            return await self.fallback.incident(request)

    async def briefing(self, request: BriefingRequest) -> BriefingResponse:
        try:
            return await self.primary.briefing(request)
        except APIError:
            return await self.fallback.briefing(request)


def build_gateway(config: Settings) -> AgnesGateway:
    if config.agnes_mode == "live":
        if config.use_sample_fallback:
            return FallbackAgnesGateway(
                LiveAgnesGateway(config),
                FixtureAgnesGateway(config, SourceState.FALLBACK),
            )
        return LiveAgnesGateway(config)
    return FixtureAgnesGateway(config)


def _load_sample_hashes(directory: Path) -> dict[str, str]:
    hashes: dict[str, str] = {}
    for filename, kind in SAMPLE_NAMES.items():
        path = directory / filename
        if path.is_file():
            hashes[hashlib.sha256(path.read_bytes()).hexdigest()] = kind
    return hashes
