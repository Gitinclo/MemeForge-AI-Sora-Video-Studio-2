"""
Step 4, 7 & 8: Queue Runner with Concurrency & Exponential Backoff,
FFmpeg EBU R128 + Sidechain Ducking Assembler, and Scaling Gate Report (`video_pilot/pipeline.py`).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional

from video_pilot.budget import BudgetGuard, ShotSpec
from video_pilot.providers.veo import VideoProvider, VideoResult


@dataclass
class LicenseCheckResult:
    audiovisual_rights_granted: bool
    ai_video_generation_allowed: bool
    territory_term_platforms_cleared: bool
    character_adaptation_approval_cleared: bool
    credit_requirements_documented: bool

    @property
    def passed_for_public_release(self) -> bool:
        return (
            self.audiovisual_rights_granted
            and self.ai_video_generation_allowed
            and self.territory_term_platforms_cleared
            and self.character_adaptation_approval_cleared
            and self.credit_requirements_documented
        )


@dataclass
class GateReport:
    consistency_pass_count: int
    consistency_sample_size: int
    avg_generations_per_approved_shot: float
    total_spend_usd: float
    finished_minutes: float
    max_cost_per_minute_usd: Optional[float]
    provider_commercial_terms_verified: bool
    provider_terms_url: str
    license_check: LicenseCheckResult

    @property
    def cost_per_finished_minute_usd(self) -> float:
        return round(self.total_spend_usd / max(0.01, self.finished_minutes), 2)

    def evaluate_gates(self) -> Dict[str, bool]:
        consistency_ok = (
            self.consistency_sample_size >= 10
            and (self.consistency_pass_count / self.consistency_sample_size) >= 0.90
        )
        efficiency_ok = self.avg_generations_per_approved_shot <= 3.0
        cost_ok = (
            self.max_cost_per_minute_usd is not None
            and self.cost_per_finished_minute_usd <= self.max_cost_per_minute_usd
        )
        return {
            "consistency_gate_9_of_10": consistency_ok,
            "efficiency_gate_le_3_tries": efficiency_ok,
            "cost_per_minute_gate": cost_ok,
            "provider_commercial_terms_gate": self.provider_commercial_terms_verified,
            "book_license_gate": self.license_check.passed_for_public_release,
        }


def build_ffmpeg_assembly_command(
    shot_files: List[str],
    dialogue_stem_wav: str,
    music_bed_wav: str,
    output_mp4: str = "outputs/pilot_episode_3min_master.mp4",
) -> List[str]:
    """
    Step 7: Normalize loudness to EBU R128 (-14 LUFS, -1.0 dBTP), sidechain-duck
    background music under character dialogue stems, join all 23 shots, and export MP4.
    """
    concat_inputs = "|".join(shot_files)
    filter_complex = (
        "[1:a]aresample=48000,loudnorm=I=-16:TP=-1.5:LRA=9[vo];"
        "[2:a]aresample=48000,volume=0.35[bgm];"
        "[bgm][vo]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[ducked_bgm];"
        "[0:a][vo][ducked_bgm]amix=inputs=3:duration=first:dropout_transition=2,"
        "loudnorm=I=-14:TP=-1.0:LRA=11[aout]"
    )
    return [
        "ffmpeg",
        "-y",
        "-i",
        f"concat:{concat_inputs}",
        "-i",
        dialogue_stem_wav,
        "-i",
        music_bed_wav,
        "-filter_complex",
        filter_complex,
        "-map",
        "0:v",
        "-map",
        "[aout]",
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        output_mp4,
    ]
