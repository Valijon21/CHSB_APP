"""
Uzbekistan MMTV & Specialized School Criteria-Based Grading Engine.

Supports:
- 100-point quarter model: Formative (max 10) + BSB/Projects (max 50) + CHSB (max 40)
- Two official 5-point conversion scales:
  1. MMTV_STANDARD (Umumta'lim maktablari / eMaktab): 86-100->5, 66-85->4, 30-65->3, 0-29->2
  2. SPECIALIZED (Ixtisoslashtirilgan / PIIMA): 86-100->5, 71-85->4, 56-70->3, 0-55->2
"""
from __future__ import annotations

GRADING_PRESETS: dict[str, dict[str, float]] = {
    "MMTV_STANDARD": {
        "grade5Min": 86.0,
        "grade4Min": 66.0,
        "grade3Min": 30.0,
        "grade2Max": 29.0,
    },
    "SPECIALIZED": {
        "grade5Min": 86.0,
        "grade4Min": 71.0,
        "grade3Min": 56.0,
        "grade2Max": 55.0,
    },
}


def calculate_grade5(
    percentage_or_score: float,
    preset: str = "MMTV_STANDARD",
    custom_thresholds: dict[str, float] | None = None,
) -> str:
    """Convert a 0..100 score/percentage to an official 5-point grade ('5', '4', '3', '2')."""
    thresholds = custom_thresholds or GRADING_PRESETS.get(preset, GRADING_PRESETS["MMTV_STANDARD"])
    val = max(0.0, min(100.0, float(percentage_or_score)))
    if val >= thresholds["grade5Min"]:
        return "5"
    if val >= thresholds["grade4Min"]:
        return "4"
    if val >= thresholds["grade3Min"]:
        return "3"
    return "2"


def normalize_bsb_total(bsb_entries: list[tuple[float, float]]) -> float:
    """
    Aggregate one or more BSB / Project scores (score, max_score) onto a 50-point scale.
    If total max_score equals 50, returns the direct sum; otherwise scales proportionally.
    """
    if not bsb_entries:
        return 0.0
    total_score = sum(max(0.0, float(s)) for s, _ in bsb_entries)
    total_max = sum(max(0.0, float(m)) for _, m in bsb_entries)
    if total_max <= 0:
        return 0.0
    scaled = (total_score / total_max) * 50.0
    return round(min(50.0, max(0.0, scaled)), 1)


def normalize_chsb_score(score: float, max_score: float = 40.0) -> float:
    """Normalize a CHSB score onto the 40-point scale."""
    if max_score <= 0:
        return 0.0
    scaled = (max(0.0, float(score)) / float(max_score)) * 40.0
    return round(min(40.0, max(0.0, scaled)), 1)


def calculate_quarter_total(
    formative_score: float,
    bsb_score: float,
    chsb_score: float,
    preset: str = "MMTV_STANDARD",
) -> dict:
    """Compute 100-point quarter score (10 FB + 50 BSB + 40 CHSB) and 5-point grade."""
    fb = round(min(10.0, max(0.0, float(formative_score))), 1)
    bsb = round(min(50.0, max(0.0, float(bsb_score))), 1)
    chsb = round(min(40.0, max(0.0, float(chsb_score))), 1)
    total_100 = round(min(100.0, fb + bsb + chsb), 1)
    return {
        "formativeScore": fb,
        "bsbScore": bsb,
        "chsbScore": chsb,
        "totalScore100": total_100,
        "grade5": calculate_grade5(total_100, preset=preset),
        "preset": preset,
    }


def calculate_annual_grade(
    quarter_totals: list[float],
    preset: str = "MMTV_STANDARD",
) -> dict:
    """Compute annual 100-point average and 5-point final grade from available quarters."""
    valid = [min(100.0, max(0.0, float(q))) for q in quarter_totals if q is not None]
    if not valid:
        return {"annualScore100": 0.0, "annualGrade5": "2", "quartersCount": 0, "preset": preset}
    avg = round(sum(valid) / len(valid), 1)
    return {
        "annualScore100": avg,
        "annualGrade5": calculate_grade5(avg, preset=preset),
        "quartersCount": len(valid),
        "preset": preset,
    }
