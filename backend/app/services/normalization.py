from __future__ import annotations

from pydantic import ValidationError

from app.config import Settings
from app.errors import APIError
from app.models import RiskLevel, ScanResult


def normalize_scan(result: ScanResult, config: Settings) -> ScanResult:
    try:
        normalized = result.model_copy(deep=True)
        if normalized.confidence < config.confidence_threshold:
            normalized.risk_level = RiskLevel.UNKNOWN
            normalized.risk_label = "Unclear"
            normalized.risk_reason = (
                "The image could not be read with enough confidence to grade the risk."
            )
            normalized.action_steps = [
                type(normalized.action_steps[0])(
                    label="Retake the photo closer and straight-on.", priority="high"
                ),
                type(normalized.action_steps[0])(
                    label="Ask your supervisor if the warning is still unclear.",
                    priority="high",
                ),
            ]
            normalized.uncertainty_note = (
                "I am not fully certain because the image is unclear."
            )
        return ScanResult.model_validate(normalized.model_dump())
    except (ValidationError, IndexError, TypeError, ValueError):
        raise APIError(
            "INVALID_AI_RESPONSE",
            "The analysis response was incomplete. Please retake the photo or try a demo sample.",
            status_code=502,
            recoverable=True,
        ) from None
