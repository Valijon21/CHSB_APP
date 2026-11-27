from backend.app.services.grading import (
    calculate_annual_grade,
    calculate_grade5,
    calculate_quarter_total,
    normalize_bsb_total,
    normalize_chsb_score,
)


def test_mmtv_standard_grade5_boundaries():
    assert calculate_grade5(100, "MMTV_STANDARD") == "5"
    assert calculate_grade5(86, "MMTV_STANDARD") == "5"
    assert calculate_grade5(85, "MMTV_STANDARD") == "4"
    assert calculate_grade5(66, "MMTV_STANDARD") == "4"
    assert calculate_grade5(65, "MMTV_STANDARD") == "3"
    assert calculate_grade5(30, "MMTV_STANDARD") == "3"
    assert calculate_grade5(29, "MMTV_STANDARD") == "2"
    assert calculate_grade5(0, "MMTV_STANDARD") == "2"


def test_specialized_grade5_boundaries():
    assert calculate_grade5(86, "SPECIALIZED") == "5"
    assert calculate_grade5(85, "SPECIALIZED") == "4"
    assert calculate_grade5(71, "SPECIALIZED") == "4"
    assert calculate_grade5(70, "SPECIALIZED") == "3"
    assert calculate_grade5(56, "SPECIALIZED") == "3"
    assert calculate_grade5(55, "SPECIALIZED") == "2"


def test_normalize_bsb_and_chsb_scales():
    # Two 25-point BSBs -> 50-point scale
    assert normalize_bsb_total([(20.0, 25.0), (22.5, 25.0)]) == 42.5
    # Two 20-point BSBs + 10-point project -> 50-point scale
    assert normalize_bsb_total([(18.0, 20.0), (16.0, 20.0), (9.0, 10.0)]) == 43.0
    # Single 20-point BSB scaled to 50
    assert normalize_bsb_total([(16.0, 20.0)]) == 40.0
    # CHSB 32 / 40 -> 32.0
    assert normalize_chsb_score(32.0, 40.0) == 32.0


def test_quarter_total_and_annual_calculation():
    q1 = calculate_quarter_total(formative_score=8.5, bsb_score=42.5, chsb_score=35.0, preset="MMTV_STANDARD")
    assert q1["totalScore100"] == 86.0
    assert q1["grade5"] == "5"

    q2 = calculate_quarter_total(formative_score=6.0, bsb_score=30.0, chsb_score=20.0, preset="MMTV_STANDARD")
    assert q2["totalScore100"] == 56.0
    assert q2["grade5"] == "3"

    annual = calculate_annual_grade([q1["totalScore100"], q2["totalScore100"]], preset="MMTV_STANDARD")
    assert annual["annualScore100"] == 71.0
    assert annual["annualGrade5"] == "4"
    assert annual["quartersCount"] == 2

