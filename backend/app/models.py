from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class RiskLevel(StrEnum):
    GREEN = "green"
    YELLOW = "yellow"
    RED = "red"
    UNKNOWN = "unknown"


class SourceState(StrEnum):
    LIVE = "live"
    CACHE = "cache"
    SAMPLE = "sample"
    FALLBACK = "fallback"


class SupportedLanguage(StrEnum):
    BENGALI = "Bengali"
    TAMIL = "Tamil"
    HINDI = "Hindi"


class SafetyActionStep(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str = Field(min_length=1, max_length=240)
    priority: Literal["low", "medium", "high"]


class PpeItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=80)
    icon: str = Field(min_length=1, max_length=80)
    required: bool


class ScanResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scan_id: str
    language: SupportedLanguage
    detected_text: str
    translated_text: str
    plain_explanation: str
    risk_level: RiskLevel
    risk_label: str
    risk_reason: str
    hazard_type: str
    ppe_required: list[PpeItem]
    action_steps: list[SafetyActionStep]
    audio_text: str
    confidence: float = Field(ge=0, le=1)
    uncertainty_note: str
    pictogram_prompt: str
    source_state: SourceState


class PictogramRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scan_id: str
    risk_level: RiskLevel
    hazard_type: str = Field(min_length=1, max_length=80, pattern=r"^[a-z0-9_]+$")
    language: SupportedLanguage
    action_steps: list[str] = Field(min_length=1, max_length=5)


class PictogramResponse(BaseModel):
    image_url: str
    alt_text: str
    source_state: SourceState


class IncidentReportRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    language: SupportedLanguage
    worker_statement: str = Field(min_length=3, max_length=2000)
    location: str = Field(min_length=1, max_length=240)
    occurred_at: datetime
    event_type: Literal[
        "near_miss",
        "unsafe_condition",
        "injury_or_illness",
        "major_equipment_or_structure_event",
        "unsure",
    ]
    medical_outcome: Literal[
        "none_known",
        "first_aid",
        "outpatient_or_hospitalisation_leave",
        "light_duty",
        "hospital_treatment",
        "death",
        "unsure",
    ]
    people_affected: int = Field(ge=0, le=50)
    immediate_actions: str = Field(default="", max_length=1000)
    image_id: str | None = Field(default=None, max_length=120)


class MomWorkflowGuidance(BaseModel):
    model_config = ConfigDict(extra="forbid")

    draft_status: Literal["worker_draft_for_supervisor"]
    review_priority: Literal["routine", "prompt", "urgent"]
    reportability_note: str
    responsible_party_note: str
    deadline_note: str
    missing_official_fields: list[str]
    submitted_to_mom: Literal[False] = False


class IncidentReportResponse(BaseModel):
    report_id: str
    english_report: str
    worker_language_summary: str
    incident_type: str
    severity: str
    suggested_next_step: str
    mom_workflow: MomWorkflowGuidance
    requires_confirmation: Literal[True] = True
    source_state: SourceState


class GuidanceSpeechRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str = Field(min_length=1, max_length=5000)
    language: SupportedLanguage


class TranscriptResponse(BaseModel):
    transcript: str
    language: SupportedLanguage
    detected_language_code: str | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)
    source_state: SourceState


class BriefingRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    language: SupportedLanguage
    site_zone: str = Field(min_length=1, max_length=160)
    today_tasks: list[str] = Field(min_length=1, max_length=8)
    hazards: list[str] = Field(min_length=1, max_length=8)
    required_ppe: list[str] = Field(min_length=1, max_length=8)


class BriefingResponse(BaseModel):
    language: SupportedLanguage
    briefing_text: str
    audio_text: str
    target_duration_seconds: Literal[30] = 30
    video_prompt: str
    pictogram_prompt: str
    source_state: SourceState


class AudioGuidanceRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    text: str = Field(min_length=1, max_length=2000)
    language: SupportedLanguage


class HealthResponse(BaseModel):
    status: Literal["ok"]
    environment: str
    agnes_mode: str
    agnes_configured: bool
    agnes_model: str
    elevenlabs_configured: bool
    audio_model: str
    fallback_available: bool
    image_storage_enabled: bool


class ErrorDetail(BaseModel):
    code: str
    message: str
    recoverable: bool


class ErrorResponse(BaseModel):
    error: ErrorDetail
