from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse


class APIError(Exception):
    def __init__(
        self, code: str, message: str, *, status_code: int, recoverable: bool
    ) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        self.recoverable = recoverable


async def api_error_handler(_: Request, error: APIError) -> JSONResponse:
    return JSONResponse(
        status_code=error.status_code,
        content={
            "error": {
                "code": error.code,
                "message": error.message,
                "recoverable": error.recoverable,
            }
        },
    )
