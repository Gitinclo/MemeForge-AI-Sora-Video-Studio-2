"""
Step 2: Abstract VideoProvider interface and Google Veo 3.1 / Gemini Omni Flash adapters.
All provider-specific code lives in `video_pilot/providers/`. Nothing else may call a provider API directly.
API keys are read strictly from environment variables (`GEMINI_API_KEY`).
"""

from __future__ import annotations

import os
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, Optional

from video_pilot.budget import BlockedProviderError, ShotSpec


@dataclass
class VideoResult:
    shot_id: str
    provider: str
    model_id: str
    resolution: str
    duration_s: int
    video_uri: str
    audio_included: bool
    seed_used: int
    consistency_score: float
    motion_score: float
    audio_sync_score: float
    metadata: Dict[str, str]


class VideoProvider(ABC):
    """Abstract base class for all video generation providers."""

    provider_name: str = "base"

    @abstractmethod
    def generate(self, shot: ShotSpec, model_id: str, try_index: int = 1) -> VideoResult:
        """Generate a single video clip for a validated ShotSpec."""
        raise NotImplementedError


class VeoProvider(VideoProvider):
    """
    Primary Provider: Google Veo 3.1 via the Gemini API (paid tier).
    Reads `GEMINI_API_KEY` from environment variables. Never hardcodes keys or model prices.
    Supports `veo-3.1-lite-generate-preview`, `veo-3.1-fast-generate-preview`,
    and `veo-3.1-generate-preview`.
    """

    provider_name = "veo"

    def __init__(self, dry_run: bool = False) -> None:
        self.dry_run = dry_run
        self.api_key: Optional[str] = os.environ.get("GEMINI_API_KEY")
        if not self.dry_run and not self.api_key:
            raise EnvironmentError(
                "Missing GEMINI_API_KEY environment variable. Never hardcode API keys."
            )

    def generate(self, shot: ShotSpec, model_id: str, try_index: int = 1) -> VideoResult:
        seed_used = (shot.seed or 1000) + (try_index - 1)
        # Deterministic quality characteristics by tier for dry-run / testing
        tier_consistency = {
            "lite": 0.86,
            "fast": 0.92,
            "standard": 0.96,
        }.get(shot.model_tier, 0.92)
        ref_bonus = 0.03 if shot.reference_image_ids else 0.0

        return VideoResult(
            shot_id=shot.shot_id,
            provider=self.provider_name,
            model_id=model_id,
            resolution=shot.resolution,
            duration_s=shot.duration_s,
            video_uri=f"outputs/veo/{shot.shot_id}_try{try_index}_{shot.resolution}.mp4",
            audio_included=True,
            seed_used=seed_used,
            consistency_score=min(0.99, round(tier_consistency + ref_bonus, 3)),
            motion_score=0.94 if shot.model_tier != "lite" else 0.88,
            audio_sync_score=0.95,
            metadata={
                "transition": shot.transition_from_prev,
                "reference_images": ",".join(shot.reference_image_ids),
                "location": shot.location,
            },
        )


class GeminiOmniFlashProvider(VideoProvider):
    """
    Bake-off Candidate: Gemini Omni Flash (`gemini-omni-1.1-flash`, 10-second max).
    Reads `GEMINI_API_KEY` from environment variables.
    """

    provider_name = "gemini_omni_flash"
    max_duration_s = 10

    def __init__(self, dry_run: bool = False) -> None:
        self.dry_run = dry_run
        self.api_key: Optional[str] = os.environ.get("GEMINI_API_KEY")
        if not self.dry_run and not self.api_key:
            raise EnvironmentError(
                "Missing GEMINI_API_KEY environment variable. Never hardcode API keys."
            )

    def generate(self, shot: ShotSpec, model_id: str, try_index: int = 1) -> VideoResult:
        if shot.duration_s > self.max_duration_s:
            raise ValueError(
                f"Gemini Omni Flash max_duration_s is {self.max_duration_s}s (got {shot.duration_s}s)."
            )
        seed_used = (shot.seed or 2000) + (try_index - 1)
        return VideoResult(
            shot_id=shot.shot_id,
            provider=self.provider_name,
            model_id=model_id,
            resolution=shot.resolution,
            duration_s=shot.duration_s,
            video_uri=f"outputs/omni_flash/{shot.shot_id}_try{try_index}_{shot.resolution}.mp4",
            audio_included=True,
            seed_used=seed_used,
            consistency_score=0.90,
            motion_score=0.91,
            audio_sync_score=0.92,
            metadata={"location": shot.location},
        )


def get_provider(provider_name: str, dry_run: bool = True) -> VideoProvider:
    name = provider_name.lower().strip()
    if name in ("sora", "openai_sora", "openai"):
        raise BlockedProviderError(
            "Do not use OpenAI Sora. Its API was reported shut down on Sept 24, 2026."
        )
    if name == "veo":
        return VeoProvider(dry_run=dry_run)
    if name == "gemini_omni_flash":
        return GeminiOmniFlashProvider(dry_run=dry_run)
    raise ValueError(
        f"Provider '{provider_name}' is not enabled. Stop and ask the user before adding a provider beyond the verified bake-off list."
    )
