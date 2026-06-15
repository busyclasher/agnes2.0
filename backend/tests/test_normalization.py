from __future__ import annotations

from app.config import Settings
from app.models import ScanResult
from app.services.normalization import normalize_scan


def test_low_confidence_becomes_unknown() -> None:
    result = ScanResult.model_validate(
        {
            "scan_id": "scan_low",
            "language": "Hindi",
            "detected_text": "unclear",
            "translated_text": "अस्पष्ट",
            "plain_explanation": "The sign is unclear.",
            "risk_level": "red",
            "risk_label": "Danger",
            "risk_reason": "Uncertain.",
            "hazard_type": "unknown",
            "ppe_required": [],
            "action_steps": [{"label": "Stop.", "priority": "high"}],
            "audio_text": "The sign is unclear.",
            "confidence": 0.2,
            "uncertainty_note": "Low quality.",
            "pictogram_prompt": "Unknown card.",
            "source_state": "live",
        }
    )
    normalized = normalize_scan(result, Settings(confidence_threshold=0.55))
    assert normalized.risk_level.value == "unknown"
    assert normalized.risk_label == "Unclear"
    assert "Retake" in normalized.action_steps[0].label
