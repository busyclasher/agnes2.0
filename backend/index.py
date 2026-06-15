"""Vercel ASGI entrypoint for the SafePoint FastAPI service."""

from app.main import app

__all__ = ["app"]
