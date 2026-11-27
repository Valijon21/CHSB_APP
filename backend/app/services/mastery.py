"""
Deterministic (AI-Free) Pedagogical Mastery & Student Performance Analytics Engine.

Computes per-student and class-level mastery metrics, Bloom taxonomy breakdown,
longitudinal score trends, missed-question diagnostics, and tailored Uzbek remediation
trajectories directly from verified assessment, BSB, and formative records — without
requiring any external LLM / Gemini calls.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

from backend.app.services.grading import (
    calculate_grade5,
    calculate_quarter_total,
    normalize_bsb_total,
    normalize_chsb_score,
)


BLOOM_LABELS_UZ: dict[str, str] = {
    "KNOWLEDGE": "Bilish (nazariy tushuncha)",
    "COMPREHENSION": "Tushunish (qiyoslash va izohlash)",
    "APPLICATION": "Qo'llash (amaliy masala)",
    "ANALYSIS": "Mulohaza (tahlil va sintez)",
}


def _as_utc(dt: datetime) -> datetime:
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)


def _parse_answers(raw: object) -> dict:
    if isinstance(raw, dict):
        return raw
    try:
        parsed = json.loads(str(raw or "{}"))
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def _normalize_bloom_key(raw_bloom: str | None) -> str:
    upper = (raw_bloom or "KNOWLEDGE").upper()
    if upper in BLOOM_LABELS_UZ:
        return upper
    if "ANA" in upper or upper in {"M", "(M)"}:
        return "ANALYSIS"
    if "APP" in upper or upper in {"Q", "(Q)"}:
        return "APPLICATION"
    if "COMP" in upper:
        return "COMPREHENSION"
    return "KNOWLEDGE"


def classify_mastery_tier(pct: float, preset: str = "MMTV_STANDARD") -> tuple[str, str]:
    grade = calculate_grade5(pct, preset=preset)
    if grade == "5":
        return "excellent", "A'lochi (5)"
    if grade == "4":
        return "proficient", "Barqaror (4)"
    if grade == "3":
        return "developing", "Nazoratda (3)"
    return "at_risk", "Xavf guruhida (2)"


def compute_trend(sorted_percentages: list[float]) -> str:
    if len(sorted_percentages) < 2:
        return "stable"
    delta = sorted_percentages[-1] - sorted_percentages[0]
    if delta >= 5.0:
        return "improving"
    if delta <= -5.0:
        return "declining"
    return "stable"


def build_deterministic_remediation_plan(
    student_name: str,
    pct: float,
    weakest_bloom: str,
    weak_topics: list[str] | None = None,
    missed_questions: list[dict] | None = None,
) -> dict:
    """Generate a tailored 5-step Uzbek study plan purely deterministically."""
    bloom_key = _normalize_bloom_key(weakest_bloom)
    weak_label = BLOOM_LABELS_UZ.get(bloom_key, "Asosiy tushunchalar")
    topics = [t for t in (weak_topics or []) if t]
    if not topics and missed_questions:
        topics = [
            f"{m.get('assessmentTitle', 'Test')}: {m.get('questionNumber', '?')}-savol"
            for m in missed_questions[:3]
        ]
    focus_topic = topics[0] if topics else weak_label

    if bloom_key == "ANALYSIS":
        steps = [
            {"day": 1, "topic": f"Xatolar tahlili: {focus_topic}", "duration": "30 daqiqa", "task": "Noto'g'ri yechilgan savollar shartini qismlarga ajratib tahlil qilish"},
            {"day": 2, "topic": "Mantiqiy bog'liqlik mashqlari", "duration": "40 daqiqa", "task": "Sabab-oqibat zanjiri bo'yicha 5 ta tahliliy topshiriq yechish"},
            {"day": 3, "topic": "Taqqoslash va algoritmik tahlil", "duration": "45 daqiqa", "task": "2 ta muqobil yechimni taqqoslab xulosa yozish"},
            {"day": 4, "topic": "Amaliy keys topshirig'i", "duration": "45 daqiqa", "task": "BSB uslubidagi murakkab vaziyatli masalani bajarish"},
            {"day": 5, "topic": "Nazorat mini-testi", "duration": "25 daqiqa", "task": "Mulohaza (M) darajasidagi 8 ta savoldan qayta sinov"},
        ]
        advice = f"{student_name} nazariy bilimga ega, ammo mantiqiy tahlil va xulosa chiqarish (M) bosqichini mustahkamlashi zarur."
    elif bloom_key == "APPLICATION":
        steps = [
            {"day": 1, "topic": f"Namuna yechimlarni ko'rish: {focus_topic}", "duration": "30 daqiqa", "task": "Bosqichma-bosqich ko'rsatilgan 3 ta namunaviy masalani yozib olish"},
            {"day": 2, "topic": "Amaliy mashq (bosqichli)", "duration": "40 daqiqa", "task": "Formula va algoritmlarni qo'llashga oid 6 ta amaliy topshiriq"},
            {"day": 3, "topic": "Mustaqil masala yechish", "duration": "45 daqiqa", "task": "O'xshash shartli 5 ta masalani yordamsiz yechish"},
            {"day": 4, "topic": "Xatolar ustida ishlash", "duration": "35 daqiqa", "task": "Avvalgi testdagi noto'g'ri amaliy bandlarni qayta tekshirish"},
            {"day": 5, "topic": "Amaliy nazorat", "duration": "30 daqiqa", "task": "Qo'llash (Q) darajasidagi 10 ta tezkor savolni ishlash"},
        ]
        advice = f"{student_name} qoidalarni biladi, biroq ularni amaliy masalalarda qo'llash (Q) bo'yicha qo'shimcha mashqlar foydali bo'ladi."
    else:
        steps = [
            {"day": 1, "topic": f"Tayanch tushunchalar takrori: {focus_topic}", "duration": "30 daqiqa", "task": "Asosiy atama va ta'riflardan qisqa konspekt tuzish"},
            {"day": 2, "topic": "Asosiy qoidalar mashqi", "duration": "35 daqiqa", "task": "Bilish (B) darajasidagi 10 ta bazaviy testni ishlash"},
            {"day": 3, "topic": "Tushunish va moslashtirish", "duration": "40 daqiqa", "task": "Jadval va ta'riflarni moslashtirish topshiriqlarini bajarish"},
            {"day": 4, "topic": "Xatolar tahlili", "duration": "35 daqiqa", "task": "Avvalgi CHSB/BSB dagi xato javoblarni darslikdan tekshirish"},
            {"day": 5, "topic": "Qayta diagnostika", "duration": "25 daqiqa", "task": "10 savollik nazorat mini-testida >= 75% natijaga chiqish"},
        ]
        if pct >= 86:
            advice = f"{student_name} yuqori natija ko'rsatmoqda ({pct}%). Olimpiada va loyiha darajasidagi topshiriqlarga yo'naltirish tavsiya etiladi."
        else:
            advice = f"{student_name} uchun bazaviy mavzularni mustahkamlash va kunlik 30 daqiqalik maqsadli mashg'ulotlar tavsiya etiladi."

    return {
        "weakestArea": weak_label,
        "weakestBloom": bloom_key,
        "trajectory": steps,
        "pedagogicalAdvice": advice,
        "engine": "deterministic-pedagogical-engine",
    }


def compute_class_diagnosis_deterministic(
    class_name: str,
    average_score: float,
    max_score: float,
    quality_rate: float | int,
    participation_rate: float | int,
    total_students: int,
) -> dict:
    """Compute a real data-driven class pedagogical summary without LLM calls."""
    avg_pct = round((average_score / max_score) * 100, 1) if max_score > 0 else 0.0
    if avg_pct >= 86:
        level_text = "yuqori (a'lo daraja)"
    elif avg_pct >= 66:
        level_text = "barqaror (yaxshi daraja)"
    elif avg_pct >= 45:
        level_text = "o'rtacha (nazorat talab)"
    else:
        level_text = "past (tezkor metodik yordam zarur)"

    strengths = []
    if float(participation_rate) >= 90:
        strengths.append(f"Ishtirok ko'rsatkichi yuqori: {participation_rate}% ({total_students} nafar o'quvchi qamrab olingan).")
    if float(quality_rate) >= 70:
        strengths.append(f"Sifat ko'rsatkichi (4 va 5 baholar) {quality_rate}% ni tashkil etdi.")
    if not strengths:
        strengths.append(f"{class_name} sinfida {total_students} nafar o'quvchi bo'yicha baholash bazasi shakllantirilgan.")

    recommendations = []
    if float(quality_rate) < 70:
        recommendations.append(
            f"Sifat foizini ({quality_rate}%) oshirish uchun 3 baho olgan o'quvchilar bilan BSB amaliy topshiriqlarida individual ishlash."
        )
    else:
        recommendations.append(
            f"Yuqori ko'rsatkichli o'quvchilarni loyiha va olimpiada bosqichidagi murakkab (M) topshiriqlarga yo'naltirish."
        )
    if float(participation_rate) < 90:
        recommendations.append(
            "Qatnashmagan o'quvchilar uchun sababli/sababsiz maqomini belgilab, qayta topshirish (reopen) grafigini tasdiqlash."
        )
    recommendations.append(
        "Bloom taksonomiyasi bo'yicha eng past ball to'plangan mavzular yuzasidan 15 daqiqalik takrorlash darsini rejalashtirish."
    )

    return {
        "source": "deterministic-pedagogical-engine",
        "className": class_name,
        "summary": (
            f"{class_name} sinfida o'zlashtirish {level_text}: o'rtacha ball {average_score} / {max_score} ({avg_pct}%), "
            f"sifat ko'rsatkichi {quality_rate}%, qamrov {participation_rate}%."
        ),
        "keyStrengths": strengths,
        "recommendations": recommendations,
    }


def analyze_student_mastery(
    stu,
    quarter: int = 1,
    academic_year: str = "2026-2027",
) -> tuple[dict, dict]:
    """
    Analyze one Student ORM record (with school, classGroup, results, formativeScores,
    and attempts -> assessment -> questions) and return:
      1) compact list row for StudentsMasteryTable
      2) deep mastery detail dossier for TeacherStudentDetailView
    """
    preset = (getattr(stu.school, "gradingPreset", None) if stu.school else None) or "MMTV_STANDARD"

    results = sorted(stu.results or [], key=lambda r: _as_utc(r.submittedAt))
    attempts = stu.attempts or []
    formative_rows = [
        f
        for f in (stu.formativeScores or [])
        if f.quarter == quarter and f.academicYear == academic_year
    ]

    fb_score = round(min(10.0, formative_rows[0].totalScore), 1) if formative_rows else 0.0
    bsb_entries: list[tuple[float, float]] = []
    chsb_scores: list[float] = []
    history = []

    for r in results:
        asm = r.attempt.assessment if r.attempt else None
        asm_type = (getattr(asm, "assessmentType", "CHSB") or "CHSB").upper() if asm else "CHSB"
        asm_q = getattr(asm, "quarter", 1) if asm else 1
        if asm and asm_q == quarter:
            if asm_type in {"BSB", "PRACTICAL"}:
                bsb_entries.append((r.score, r.maxScore))
            else:
                chsb_scores.append(normalize_chsb_score(r.score, r.maxScore))

        history.append({
            "attemptId": r.attemptId,
            "assessmentId": asm.id if asm else "",
            "assessmentTitle": asm.title if asm else "CHSB Baholash",
            "assessmentType": asm_type,
            "subject": asm.subject if asm else "Informatika",
            "quarter": asm_q,
            "score": r.score,
            "maxScore": r.maxScore,
            "percentage": r.percentage,
            "grade": r.grade,
            "status": r.status,
            "verifiedByTeacher": bool(getattr(r, "verifiedByTeacher", False)),
            "teacherFeedback": getattr(r, "teacherFeedback", None) or "",
            "submittedAt": _as_utc(r.submittedAt).isoformat(),
        })

    bsb_total = normalize_bsb_total(bsb_entries)
    chsb_total = max(chsb_scores) if chsb_scores else 0.0
    q_summary = calculate_quarter_total(fb_score, bsb_total, chsb_total, preset=preset)

    # Overall percentage across taken tests (or quarter 100-score if only quarter components present)
    if results:
        overall_pct = round(sum(r.percentage for r in results) / len(results), 1)
    else:
        overall_pct = q_summary["totalScore100"]

    tier, tier_label = classify_mastery_tier(overall_pct, preset=preset)
    trend = compute_trend([r.percentage for r in results])

    # Per-Bloom & missed-questions analysis from submitted attempts
    bloom_agg: dict[str, list[int]] = {
        "KNOWLEDGE": [0, 0],
        "COMPREHENSION": [0, 0],
        "APPLICATION": [0, 0],
        "ANALYSIS": [0, 0],
    }
    missed_questions = []
    mcq_types = {"MCQ_SINGLE", "MULTIPLE_CHOICE", "MCQ"}

    for att in attempts:
        if att.status != "submitted" or not att.assessment or not att.assessment.questions:
            continue
        ans_map = _parse_answers(att.answersJson)
        for q in att.assessment.questions:
            t_type = (getattr(q, "taskType", None) or "MCQ_SINGLE").upper()
            if t_type not in mcq_types:
                continue
            b_key = _normalize_bloom_key(q.bloomLevel)
            sel = ans_map.get(q.id) or ans_map.get(str(q.questionNumber))
            is_ok = sel == q.correctOptionId
            bloom_agg[b_key][1] += 1
            if is_ok:
                bloom_agg[b_key][0] += 1
            else:
                missed_questions.append({
                    "assessmentTitle": att.assessment.title,
                    "questionNumber": q.questionNumber,
                    "prompt": q.prompt,
                    "bloomLevel": b_key,
                    "points": q.points,
                })

    bloom_pct: dict[str, float | None] = {}
    evaluated_blooms: list[tuple[str, float]] = []
    for k, (ok, tot) in bloom_agg.items():
        if tot > 0:
            val = round((ok / tot) * 100, 1)
            bloom_pct[k.lower()] = val
            evaluated_blooms.append((k, val))
        else:
            bloom_pct[k.lower()] = None

    if evaluated_blooms:
        weakest_bloom = min(evaluated_blooms, key=lambda x: x[1])[0]
    elif bsb_total < 25 and results:
        weakest_bloom = "APPLICATION"
    else:
        weakest_bloom = "KNOWLEDGE"

    remediation = build_deterministic_remediation_plan(
        student_name=f"{stu.firstName} {stu.lastName}",
        pct=overall_pct,
        weakest_bloom=weakest_bloom,
        missed_questions=missed_questions,
    )

    row = {
        "studentId": stu.id,
        "rosterCode": stu.rosterCode,
        "studentName": f"{stu.firstName} {stu.lastName}",
        "classGroupId": stu.classGroupId,
        "className": stu.classGroup.name if stu.classGroup else "",
        "testsTaken": len(results),
        "averageScore": round(sum(r.score for r in results) / len(results), 1) if results else 0.0,
        "averagePercentage": overall_pct,
        "quarterTotal100": q_summary["totalScore100"],
        "grade5": calculate_grade5(overall_pct, preset=preset) if results else q_summary["grade5"],
        "tier": tier,
        "tierLabel": tier_label,
        "trend": trend,
        "bloomMastery": bloom_pct,
        "weakestArea": remediation["weakestArea"],
        "weakestBloom": weakest_bloom,
    }

    detail = {
        **row,
        "preset": preset,
        "quarterBreakdown": q_summary,
        "history": history,
        "missedQuestions": missed_questions[:15],
        "remediationPlan": remediation,
    }
    return row, detail

