"""Stable interface for a future temporal full-body inference adapter.

A concrete adapter must implement this contract before the API can report the
live engine as available. Implementations must keep per-session temporal state
in memory, never persist camera frames, and return a processed JPEG frame.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class EngineInfo:
    name: str
    version: str
    device: str
    supports_temporal_video: bool
    supports_full_body: bool


class FullBodyEngine(Protocol):
    """Adapter contract for a consent-gated, pose-preserving video model."""

    @property
    def info(self) -> EngineInfo:
        ...

    async def initialize(self) -> None:
        """Load model weights and allocate the selected inference device."""
        ...

    async def process_frame(
        self,
        *,
        session_id: str,
        frame_jpeg: bytes,
        timestamp_ms: int,
    ) -> bytes:
        """Return one processed JPEG frame while preserving temporal state."""
        ...

    async def close_session(self, session_id: str) -> None:
        """Release all per-session identity and temporal state."""
        ...

    async def shutdown(self) -> None:
        """Release model and GPU resources."""
        ...


def validate_engine(engine: object) -> EngineInfo:
    """Reject partial or non-full-body adapters; never infer readiness from config."""
    required_methods = ("initialize", "process_frame", "close_session", "shutdown")
    if any(not callable(getattr(engine, name, None)) for name in required_methods):
        raise TypeError("Engine does not implement the full-body adapter contract.")

    info = getattr(engine, "info", None)
    if not isinstance(info, EngineInfo):
        raise TypeError("Engine must expose valid EngineInfo metadata.")
    if not info.supports_full_body:
        raise ValueError("Adapter does not support full-body identity replacement.")
    if not info.supports_temporal_video:
        raise ValueError("Adapter does not preserve temporal video continuity.")
    if not info.name.strip() or not info.version.strip() or not info.device.strip():
        raise ValueError("Engine metadata must identify model, version, and device.")
    return info
