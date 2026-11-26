"""API foundation for the future full-body live replacement engine.

This service deliberately does not perform identity replacement yet. It exposes
capabilities and a consent-gated session contract so the browser can distinguish
a real engine from a placeholder.
"""
from __future__ import annotations

import os
import secrets
from typing import Literal

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

APP_VERSION = "0.1.0"
ENGINE_READY = os.getenv("FULL_BODY_ENGINE_READY", "false").lower() == "true"
# Set true only when a concrete, tested GPU inference adapter is installed.
INFERENCE_ADAPTER_AVAILABLE = False
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:8000").split(",")
    if origin.strip()
]

app = FastAPI(
    title="Face Tracking Studio – Full-body Processing API",
    version=APP_VERSION,
    description="Backend foundation; live full-body inference is not installed yet.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Session-Token"],
)


class SessionRequest(BaseModel):
    # Both parties must have consented to use of the selected likeness.
    source_person_consent: bool = Field(..., description="Consent to process the live source camera")
    likeness_owner_consent: bool = Field(..., description="Consent to use the selected person's likeness")
    disclosure_enabled: bool = Field(..., description="Visible AI-altered-video disclosure is enabled")
    mode: Literal["full_body_live"] = "full_body_live"


class SessionResponse(BaseModel):
    session_token: str
    status: Literal["ready", "engine_unavailable"]
    message: str
    processed_video_available: bool


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "version": APP_VERSION}


@app.get("/api/capabilities")
async def capabilities() -> dict:
    live_ready = ENGINE_READY and INFERENCE_ADAPTER_AVAILABLE
    return {
        "full_body_live": live_ready,
        "engine_status": ("ready" if live_ready else "configured_without_adapter" if ENGINE_READY else "not_installed"),
        "recorded_video": False,
        "transport": "WebRTC-compatible processed-video track (planned)",
        "stores_camera_frames": False,
        "note": (
            "A tested inference adapter is installed and configured."
            if live_ready
            else "This is setup scaffolding only. No face/body replacement is performed."
        ),
    }


@app.post("/api/sessions", response_model=SessionResponse)
async def create_session(
    request: SessionRequest,
    x_session_token: str | None = Header(default=None),
) -> SessionResponse:
    # A client-provided token is not accepted as proof of consent; explicit
    # per-session consent flags and disclosure are required for this prototype.
    if not request.source_person_consent or not request.likeness_owner_consent:
        raise HTTPException(status_code=403, detail="Consent from both people is required.")
    if not request.disclosure_enabled:
        raise HTTPException(status_code=403, detail="Visible AI-altered-video disclosure is required.")
    if not (ENGINE_READY and INFERENCE_ADAPTER_AVAILABLE):
        return SessionResponse(
            session_token=secrets.token_urlsafe(24),
            status="engine_unavailable",
            message="Consent checks passed, but the full-body inference engine is not installed.",
            processed_video_available=False,
        )
    # Do not claim readiness until a concrete inference adapter is connected.
    return SessionResponse(
        session_token=secrets.token_urlsafe(24),
        status="engine_unavailable",
        message="Engine flag is set, but no inference adapter is connected yet.",
        processed_video_available=False,
    )
