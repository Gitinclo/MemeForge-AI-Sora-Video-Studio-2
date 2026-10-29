"""
Step 1 & 3: Shot Schema Validator and Hard-Cap Budget Guard (`video_pilot/budget.py`).
Reads rates exclusively from `config/pricing.yaml` (never hardcoded).
Enforces atomic pre-flight reservation (`spent + reserved + estimate <= cap`)
and logs every settled generation to `costs.csv`.
"""

from __future__ import annotations

import csv
import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

try:
    import yaml  # type: ignore
except ImportError:
    yaml = None


class PricingConfigurationError(ValueError):
    """Raised when a (provider, model_tier, resolution, duration_s) combination is invalid."""


class BudgetCapExceededError(RuntimeError):
    """Raised when launching a job would exceed the configured USD budget cap."""


class BlockedProviderError(PermissionError):
    """Raised when attempting to use a deprecated/shut-down provider such as OpenAI Sora."""


ALLOWED_CHARACTERS = {
    "char_shopkeeper",
    "char_hunter",
    "char_cane_relic",
    "char_aria",
    "char_kael",
    "char_vex",
}
ALLOWED_LOCATIONS = {
    "loc_rainy_bookstore",
    "loc_storm_alley",
    "loc_sky_citadel",
    "loc_clockwork_bazaar",
}
ALLOWED_PILOT_RESOLUTIONS = {"720p", "1080p", "4k"}
ALLOWED_TIERS = {"lite", "fast", "standard"}


@dataclass
class ShotSpec:
    shot_id: str
    duration_s: int
    resolution: str
    model_tier: str
    characters: List[str]
    location: str
    action: str
    camera: str
    prompt: str
    dialogue: Optional[Dict[str, str]] = None
    # Improved continuity fields for passing the >= 9/10 Consistency Gate:
    seed: Optional[int] = None
    reference_image_ids: List[str] = field(default_factory=list)
    transition_from_prev: str = "cut"


def validate_shot_list(
    shots_data: List[Dict],
    allowed_durations: Tuple[int, ...] = (4, 6, 8),
    pilot_mode: bool = True,
) -> List[ShotSpec]:
    """Validate shots/shot_list.json against the minimal + continuity schema before generation."""
    if not shots_data:
        raise ValueError("Shot list cannot be empty.")

    validated: List[ShotSpec] = []
    seen_ids: Set[str] = set()

    for idx, raw in enumerate(shots_data):
        shot_id = str(raw.get("shot_id", "")).strip()
        if not shot_id:
            raise ValueError(f"Shot at index {idx} is missing 'shot_id'.")
        if shot_id in seen_ids:
            raise ValueError(f"Duplicate shot_id '{shot_id}' detected.")
        seen_ids.add(shot_id)

        duration_s = raw.get("duration_s")
        if duration_s not in allowed_durations:
            raise ValueError(
                f"Shot '{shot_id}' has invalid duration_s={duration_s}. "
                f"Allowed durations: {list(allowed_durations)}."
            )

        resolution = str(raw.get("resolution", "")).lower()
        valid_res = {"720p", "1080p"} if pilot_mode else ALLOWED_PILOT_RESOLUTIONS
        if resolution not in valid_res:
            raise ValueError(
                f"Shot '{shot_id}' has invalid resolution='{resolution}'. "
                f"Allowed for current mode: {sorted(valid_res)}."
            )

        model_tier = str(raw.get("model_tier", "")).lower()
        if model_tier not in ALLOWED_TIERS:
            raise ValueError(
                f"Shot '{shot_id}' has invalid model_tier='{model_tier}'. "
                f"Allowed tiers: {sorted(ALLOWED_TIERS)}."
            )

        characters = raw.get("characters", [])
        if not isinstance(characters, list) or not characters:
            raise ValueError(f"Shot '{shot_id}' must reference at least one character ID.")
        unknown_chars = set(characters) - ALLOWED_CHARACTERS
        if unknown_chars:
            raise ValueError(
                f"Shot '{shot_id}' references unknown characters {sorted(unknown_chars)} "
                f"not in style/style_guide.md."
            )

        location = str(raw.get("location", "")).strip()
        if location not in ALLOWED_LOCATIONS:
            raise ValueError(
                f"Shot '{shot_id}' has unknown location='{location}'. "
                f"Allowed locations: {sorted(ALLOWED_LOCATIONS)}."
            )

        for field_name in ("action", "camera", "prompt"):
            val = str(raw.get(field_name, "")).strip()
            if not val:
                raise ValueError(f"Shot '{shot_id}' is missing required field '{field_name}'.")

        validated.append(
            ShotSpec(
                shot_id=shot_id,
                duration_s=int(duration_s),
                resolution=resolution,
                model_tier=model_tier,
                characters=list(characters),
                location=location,
                action=str(raw["action"]).strip(),
                camera=str(raw["camera"]).strip(),
                prompt=str(raw["prompt"]).strip(),
                dialogue=raw.get("dialogue"),
                seed=raw.get("seed"),
                reference_image_ids=list(raw.get("reference_image_ids", [])),
                transition_from_prev=str(raw.get("transition_from_prev", "cut")),
            )
        )

    return validated


class BudgetGuard:
    """
    Hard budget cap guard reading rates from config/pricing.yaml.
    Prevents concurrent queue race conditions by tracking both `spent_usd` and
    in-flight `reserved_usd` before authorizing any provider call.
    """

    def __init__(
        self,
        pricing_yaml_path: Path = Path("config/pricing.yaml"),
        costs_csv_path: Path = Path("costs.csv"),
        cap_override_usd: Optional[float] = None,
    ) -> None:
        self.pricing_yaml_path = pricing_yaml_path
        self.costs_csv_path = costs_csv_path
        self.config = self._load_pricing_config(pricing_yaml_path)
        self.cap_usd: float = (
            float(cap_override_usd)
            if cap_override_usd is not None
            else float(self.config.get("pilot_working_cap_usd", 500.0))
        )
        self.allowed_durations: Set[int] = set(self.config.get("allowed_durations_s", [4, 6, 8]))
        self.spent_usd: float = 0.0
        self.reserved_usd: float = 0.0
        self._reservations: Dict[str, float] = {}

    @staticmethod
    def _load_pricing_config(path: Path) -> Dict:
        text = path.read_text(encoding="utf-8")
        if yaml is not None:
            return yaml.safe_load(text)
        if text.lstrip().startswith("{"):
            return json.loads(text)

        # Zero-dependency indentation-aware YAML subset parser for config/pricing.yaml
        def _parse_scalar(val: str):
            val = val.split("#", 1)[0].strip()
            if not val:
                return None
            if val.startswith("[") and val.endswith("]"):
                inner = val[1:-1].strip()
                return [_parse_scalar(x) for x in inner.split(",") if x.strip()]
            if val.startswith("{") and val.endswith("}"):
                out = {}
                for pair in val[1:-1].split(","):
                    if ":" in pair:
                        k, v = pair.split(":", 1)
                        out[k.strip().strip('"').strip("'")] = _parse_scalar(v)
                return out
            if val.lower() == "true":
                return True
            if val.lower() == "false":
                return False
            if (val.startswith('"') and val.endswith('"')) or (
                val.startswith("'") and val.endswith("'")
            ):
                return val[1:-1]
            try:
                return int(val) if "." not in val else float(val)
            except ValueError:
                return val

        root: Dict = {}
        stack: List[Tuple[int, Dict]] = [(-1, root)]
        for raw_line in text.splitlines():
            line_no_comment = raw_line.split("#", 1)[0].rstrip()
            if not line_no_comment.strip():
                continue
            indent = len(line_no_comment) - len(line_no_comment.lstrip(" "))
            key, _, rest = line_no_comment.strip().partition(":")
            key = key.strip()
            rest = rest.strip()
            while len(stack) > 1 and stack[-1][0] >= indent:
                stack.pop()
            parent = stack[-1][1]
            if not rest:
                child: Dict = {}
                parent[key] = child
                stack.append((indent, child))
            else:
                parent[key] = _parse_scalar(rest)
        return root

    def estimate_cost_usd(
        self,
        provider: str,
        model_tier: str,
        resolution: str,
        duration_s: int,
    ) -> Tuple[float, str]:
        """
        Compute `estimated_cost_usd = duration_s * rates[resolution]`.
        Rejects any combination not in config/pricing.yaml (e.g., Lite at 4K) or OpenAI Sora.
        Returns `(estimated_cost_usd, model_id)`.
        """
        provider_key = provider.lower().strip()
        if provider_key in ("sora", "openai_sora", "openai"):
            raise BlockedProviderError(
                "OpenAI Sora API was reported shut down on Sept 24, 2026 and is strictly blocked."
            )

        if duration_s not in self.allowed_durations:
            raise PricingConfigurationError(
                f"Duration {duration_s}s is not in allowed_durations_s {sorted(self.allowed_durations)}."
            )

        providers_cfg = self.config.get("providers", {})
        if provider_key not in providers_cfg:
            raise PricingConfigurationError(f"Unknown provider '{provider_key}' in pricing.yaml.")

        prov_entry = providers_cfg[provider_key]
        res_key = resolution.lower().strip()
        tier_key = model_tier.lower().strip()

        if provider_key == "veo":
            if tier_key not in prov_entry:
                raise PricingConfigurationError(f"Unknown Veo tier '{tier_key}'.")
            tier_cfg = prov_entry[tier_key]
            rates = tier_cfg.get("rates", {})
            if res_key not in rates:
                raise PricingConfigurationError(
                    f"Unsupported combination: Veo tier '{tier_key}' at resolution '{res_key}' "
                    f"(available resolutions for {tier_key}: {list(rates.keys())})."
                )
            rate = float(rates[res_key])
            model_id = str(tier_cfg["model_id"])
        else:
            rates = prov_entry.get("rates", {})
            if res_key not in rates:
                raise PricingConfigurationError(
                    f"Unsupported combination: provider '{provider_key}' at resolution '{res_key}' "
                    f"(available: {list(rates.keys())})."
                )
            rate = float(rates[res_key])
            model_id = str(prov_entry["model_id"])

        return round(duration_s * rate, 4), model_id

    def reserve_job_budget(
        self,
        job_id: str,
        provider: str,
        model_tier: str,
        resolution: str,
        duration_s: int,
    ) -> float:
        """
        Pre-flight reservation check: `spent_usd + reserved_usd + estimate <= cap_usd`.
        Raises BudgetCapExceededError if the job would breach the hard cap.
        """
        estimate_usd, _ = self.estimate_cost_usd(provider, model_tier, resolution, duration_s)
        projected = round(self.spent_usd + self.reserved_usd + estimate_usd, 4)
        if projected > self.cap_usd:
            raise BudgetCapExceededError(
                f"Budget Guard stopped job '{job_id}': spent (${self.spent_usd:.2f}) + "
                f"reserved (${self.reserved_usd:.2f}) + estimate (${estimate_usd:.2f}) = "
                f"${projected:.2f} exceeds cap (${self.cap_usd:.2f})."
            )
        self._reservations[job_id] = estimate_usd
        self.reserved_usd = round(self.reserved_usd + estimate_usd, 4)
        return estimate_usd

    def settle_job(
        self,
        job_id: str,
        shot_id: str,
        try_index: int,
        provider: str,
        model_id: str,
        resolution: str,
        duration_s: int,
        succeeded: bool,
    ) -> float:
        """
        Settle an in-flight job reservation and append a row to `costs.csv`.
        Because `billing: successful_generations_only`, failed jobs release their
        reservation and log $0.00 actual cost.
        """
        reserved = self._reservations.pop(job_id, 0.0)
        self.reserved_usd = max(0.0, round(self.reserved_usd - reserved, 4))
        actual_cost_usd = reserved if succeeded else 0.0
        self.spent_usd = round(self.spent_usd + actual_cost_usd, 4)

        write_header = not self.costs_csv_path.exists()
        with self.costs_csv_path.open("a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            if write_header:
                writer.writerow(
                    [
                        "timestamp_utc",
                        "job_id",
                        "shot_id",
                        "try_index",
                        "provider",
                        "model_id",
                        "resolution",
                        "duration_s",
                        "succeeded",
                        "estimated_cost_usd",
                        "actual_cost_usd",
                        "cumulative_spent_usd",
                    ]
                )
            writer.writerow(
                [
                    datetime.now(timezone.utc).isoformat(),
                    job_id,
                    shot_id,
                    try_index,
                    provider,
                    model_id,
                    resolution,
                    duration_s,
                    succeeded,
                    f"{reserved:.4f}",
                    f"{actual_cost_usd:.4f}",
                    f"{self.spent_usd:.4f}",
                ]
            )
        return actual_cost_usd
