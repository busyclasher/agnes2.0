from __future__ import annotations

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
    image_id: str | None = Field(default=None, max_length=120)


class IncidentReportResponse(BaseModel):
    report_id: str
    english_report: str
    worker_language_summary: str
    incident_type: str
    severity: str
    suggested_next_step: str
    requires_confirmation: Literal[True] = True
    source_state: SourceState


class HealthResponse(BaseModel):
    status: Literal["ok"]
    environment: str
    agnes_mode: str
    fallback_available: bool
    image_storage_enabled: bool


class ErrorDetail(BaseModel):
    code: str
    message: str
    recoverable: bool


class ErrorResponse(BaseModel):
    error: ErrorDetail
