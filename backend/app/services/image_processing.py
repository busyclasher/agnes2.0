from __future__ import annotations

import hashlib
from dataclasses import dataclass
from io import BytesIO

from PIL import Image, UnidentifiedImageError

from app.config import Settings
from app.errors import APIError

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}


@dataclass(frozen=True)
class ProcessedImage:
    digest: str
    content: bytes
    width: int
    height: int
    source_format: str


def process_image(
    raw: bytes, content_type: str | None, config: Settings
) -> ProcessedImage:
    if not raw:
        raise APIError(
            "INVALID_IMAGE",
            "No image was received. Please capture or choose a photo.",
            status_code=400,
            recoverable=True,
        )
    if len(raw) > config.max_image_bytes:
        raise APIError(
            "IMAGE_TOO_LARGE",
            "The image is too large. Please use a photo smaller than 10 MB.",
            status_code=413,
            recoverable=True,
        )
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise APIError(
            "INVALID_IMAGE",
            "Please use a JPEG, PNG, or WebP image.",
            status_code=415,
            recoverable=True,
        )

    digest = hashlib.sha256(raw).hexdigest()
    try:
        with Image.open(BytesIO(raw)) as image:
            image.load()
            if image.format not in ALLOWED_FORMATS:
                raise ValueError("unsupported decoded format")
            source_format = image.format
            image = image.convert("RGB")
            image.thumbnail(
                (config.max_image_dimension, config.max_image_dimension),
                Image.Resampling.LANCZOS,
            )
            output = BytesIO()
            image.save(output, format="JPEG", quality=88, optimize=True)
            return ProcessedImage(
                digest=digest,
                content=output.getvalue(),
                width=image.width,
                height=image.height,
                source_format=source_format,
            )
    except (UnidentifiedImageError, OSError, ValueError):
        raise APIError(
            "INVALID_IMAGE",
            "I could not open this image. Please retake it as a clear photo.",
            status_code=400,
            recoverable=True,
        ) from None
