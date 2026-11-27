from __future__ import annotations
import asyncio
import json
import os
import re
from typing import Any
import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from backend.app.core.config import settings
from backend.app.core.dependencies import Actor, require_role
from backend.app.services.mastery import (
    build_deterministic_remediation_plan,
    compute_class_diagnosis_deterministic,
)

router = APIRouter(
    prefix="/ai",
    tags=["AI Pedagogical Intelligence"],
    dependencies=[Depends(require_role(["TEACHER", "SCHOOL_ADMIN", "REGIONAL_INSPECTOR", "SUPER_ADMIN"]))],
)

DEFAULT_GEMINI_MODEL = "gemini-2.0-flash"


class ClassDiagnosisRequest(BaseModel):
    className: str
    averageScore: float
    maxScore: float = 40.0
    qualityRate: int
    participationRate: int
    totalStudents: int
    useAi: bool = False


class StudentRemediationRequest(BaseModel):
    studentName: str
    rosterCode: str
    score: float
    maxScore: float = 40.0
    percentage: float
    weakTopics: list[str] = ["Asosiy tushunchalar"]
    weakestBloom: str = "KNOWLEDGE"


class ExtractQuestionsRequest(BaseModel):
    rawText: str = Field(..., min_length=1)
    model: str = DEFAULT_GEMINI_MODEL
    maxScore: float = Field(default=50.0, ge=1.0, le=200.0)
    customApiKey: str | None = None


class ExtractRosterRequest(BaseModel):
    rawText: str = Field(..., min_length=1)
    defaultGroup: str | None = None
    model: str = DEFAULT_GEMINI_MODEL
    customApiKey: str | None = None


def _resolve_gemini_key(custom_key: str | None = None) -> str:
    if custom_key and custom_key.strip():
        return custom_key.strip()
    return (settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY") or "").strip()


def _translate_ai_error(raw_error: str) -> str:
    if not raw_error:
        return "Sun'iy intellekt bilan bog'lanishda noma'lum xatolik yuz berdi."
    lower = raw_error.lower()
    if any(k in lower for k in ("high demand", "spikes in demand", "503")):
        return "Google serverlarida ayni daqiqalarda yuqori yuklama yuz berdi. Birozdan so'ng qayta urinib ko'ring."
    if any(k in lower for k in ("quota", "rate limit", "resource_exhausted", "429")):
        return "So'rovlar limiti vaqtinchalik to'ldi. Iltimos, 1 daqiqadan so'ng qayta urinib ko'ring."
    if any(k in lower for k in ("api_key_invalid", "invalid api key", "api key not found", "400", "403")):
        return "Serverda Gemini API kaliti noto'g'ri yoki faollashtirilmagan."
    if any(k in lower for k in ("network", "connect", "timeout")):
        return "AI serveriga ulanishda uzilish yuz berdi."
    if "404" in lower or "not found" in lower:
        return "Tanlangan AI modeli mavjud emas."
    return raw_error


def _clean_bsb_fill_lines(text: str) -> str:
    if not text:
        return ""
    cleaned = re.sub(r"[\s–—\-]*_{2,}[\s_–—\-]*", " ", text)
    cleaned = re.sub(r"(?:\.\s*){4,}", " ", cleaned)
    cleaned = re.sub(
        r"(?:[:\s]*[\[\(]\s*\d+(?:\.\d+)?\s*ball\s*[\]\)]|:\s*\d+(?:\.\d+)?\s*ball\b)",
        " ",
        cleaned,
        flags=re.IGNORECASE,
    )
    cleaned = re.sub(r"[\s–—\-:\.]+$", "", cleaned)
    cleaned = re.sub(r"^[\s–—\-:]+", "", cleaned)
    return re.sub(r"[ \t]+", " ", cleaned).strip()


async def _call_gemini_json(prompt: str, api_key: str, model: str) -> Any:
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    body = {
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.1,
        },
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
    }

    last_err: Exception | None = None
    response: httpx.Response | None = None
    async with httpx.AsyncClient(timeout=25.0) as client:
        for attempt in range(2):
            try:
                response = await client.post(endpoint, json=body)
                if response.status_code == 503 and attempt == 0:
                    await asyncio.sleep(1.5)
                    continue
                break
            except Exception as exc:
                last_err = exc
                if attempt == 0:
                    await asyncio.sleep(1.5)

    if response is None:
        raise RuntimeError(str(last_err) if last_err else "AI serveriga ulanib bo'lmadi.")

    if response.status_code >= 400:
        err_msg = f"Status: {response.status_code}"
        try:
            err_json = response.json()
            err_msg = err_json.get("error", {}).get("message") or err_msg
        except Exception:
            pass
        raise RuntimeError(_translate_ai_error(err_msg))

    data = response.json()
    candidate_text = (
        data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text")
    )
    if not candidate_text:
        raise RuntimeError("Sun'iy intellektdan javob kelmadi.")
    return json.loads(candidate_text)


@router.post("/extract-questions")
async def extract_questions_proxy(payload: ExtractQuestionsRequest):
    raw_text = payload.rawText.strip()
    if not raw_text:
        return {
            "success": False,
            "questions": [],
            "modelUsed": payload.model,
            "sourceTextLength": 0,
            "warnings": [],
            "error": "Hujjat matni bo'sh yoki o'qib bo'lmadi.",
        }

    api_key = _resolve_gemini_key(payload.customApiKey)
    if not api_key:
        return {
            "success": False,
            "questions": [],
            "modelUsed": payload.model,
            "sourceTextLength": len(raw_text),
            "warnings": ["GEMINI_API_KEY sozlanmagan."],
            "error": "Serverda Gemini API kaliti sozlanmagan. Standart algoritm orqali tahlil qilinadi.",
        }

    prompt = f"""SEN O'ZBEKISTON RESPUBLIKASI MAKTAB TA'LIMI STANDARTLARI (BSB/ChSB) BO'YICHA METODIST-EKSPERTSAN.
Quyidagi PDF hujjat matnidan barcha imtihon topshiriqlarini JSON massivida ajratib ber.
QOIDALAR:
1. Faqat matnda bor topshiriqlarni chiqar, yangi savol to'qima.
2. Har bir topshiriq uchun hujjatdagi aniq matnni "sourceExcerpt" ga ko'chir.
3. Maksimal umumiy ball me'yori: {payload.maxScore} ball.
4. Qog'oz blankalaridagi ____ va .... chiziqlarni tozalab yoz.

HUJJAT MATNI:
\"\"\"
{raw_text[:25000]}
\"\"\"

FAQAT JSON MASSIV QAYTAR:
[
  {{
    "number": 1,
    "title": "1-topshiriq",
    "prompt": "Savol matni",
    "taskType": "subquestions" | "multiple_choice" | "case_study" | "table_completion" | "open_text",
    "points": 10,
    "options": [{{"id": "opt-a", "label": "A", "text": "Variant"}}],
    "correctOptionId": "opt-a",
    "subQuestions": [{{"id": "1-a", "label": "a)", "prompt": "Band matni", "points": 2.5, "rubric": "Mezon"}}],
    "rubric": "Umumiy mezon",
    "sourceExcerpt": "Asl matn parchasi"
  }}
]"""

    try:
        parsed_json = await _call_gemini_json(prompt, api_key, payload.model or DEFAULT_GEMINI_MODEL)
        if not isinstance(parsed_json, list) or len(parsed_json) == 0:
            raise RuntimeError("Hujjatdan topshiriqlar ajratib olinmadi.")

        questions = []
        valid_types = {"multiple_choice", "case_study", "table_completion", "open_text", "subquestions"}
        for idx, item in enumerate(parsed_json):
            num = int(item.get("number") or (idx + 1))
            title = _clean_bsb_fill_lines(str(item.get("title") or f"{num}-topshiriq"))
            prompt_text = _clean_bsb_fill_lines(str(item.get("prompt") or title))
            pts = float(item.get("points") or round(payload.maxScore / len(parsed_json), 1))
            raw_opts = item.get("options") or []
            raw_subs = item.get("subQuestions") or []

            task_type = item.get("taskType") if item.get("taskType") in valid_types else "subquestions"
            if task_type == "multiple_choice" and len(raw_opts) < 2:
                task_type = "subquestions"

            options_list = []
            for opt_idx, opt in enumerate(raw_opts):
                letter = str(opt.get("label") or chr(65 + opt_idx)).upper()
                options_list.append({
                    "id": opt.get("id") or f"opt-{letter.lower()}",
                    "label": letter,
                    "text": _clean_bsb_fill_lines(str(opt.get("text") or f"Variant {letter}")),
                })

            sub_list = []
            for s_idx, sub in enumerate(raw_subs):
                default_label = f"{chr(97 + s_idx)})"
                sub_pts = sub.get("points")
                if sub_pts is None:
                    sub_pts = round(pts / max(1, len(raw_subs)), 1)
                sub_list.append({
                    "id": sub.get("id") or f"{num}-{s_idx + 1}",
                    "label": sub.get("label") or default_label,
                    "prompt": _clean_bsb_fill_lines(str(sub.get("prompt") or f"Band {s_idx + 1}")),
                    "points": float(sub_pts),
                    "rubric": _clean_bsb_fill_lines(str(sub["rubric"])) if sub.get("rubric") else None,
                })

            questions.append({
                "id": f"ai-q-{num}",
                "number": num,
                "title": title,
                "prompt": prompt_text,
                "taskType": task_type,
                "points": pts,
                "options": options_list or None,
                "correctOptionId": item.get("correctOptionId"),
                "subQuestions": sub_list or None,
                "rubric": _clean_bsb_fill_lines(str(item["rubric"])) if item.get("rubric") else None,
                "sourceExcerpt": item.get("sourceExcerpt") or prompt_text,
                "isApprovedByHuman": False,
            })

        return {
            "success": True,
            "questions": questions,
            "modelUsed": payload.model,
            "sourceTextLength": len(raw_text),
            "warnings": [],
        }
    except Exception as exc:
        return {
            "success": False,
            "questions": [],
            "modelUsed": payload.model,
            "sourceTextLength": len(raw_text),
            "warnings": [],
            "error": _translate_ai_error(str(exc)),
        }


@router.post("/extract-roster")
async def extract_roster_proxy(payload: ExtractRosterRequest):
    raw_text = payload.rawText.strip()
    default_group = payload.defaultGroup or ("2-guruh" if "2-gur" in raw_text.lower() else "1-guruh")
    if not raw_text:
        return {
            "success": False,
            "students": [],
            "modelUsed": payload.model,
            "detectedGroup": default_group,
            "error": "Tahlil qilish uchun matn yoki jadval ma'lumoti bo'sh.",
        }

    api_key = _resolve_gemini_key(payload.customApiKey)
    if not api_key:
        return {
            "success": False,
            "students": [],
            "modelUsed": payload.model,
            "detectedGroup": default_group,
            "error": "Serverda Gemini API kaliti sozlanmagan. Oddiy tahlil tugmasidan foydalaning.",
        }

    prompt = f"""Siz O'zbekiston maktablari eMaktab tizimi bo'yicha yordamchisiz.
Quyidagi jadval matnidan o'quvchilar ro'yxatini JSON massivida ajrating:
- "orderIndex", "fullName", "lastName", "firstName", "middleName", "emaktabId", "gender" ("M"|"F"), "group" ("{default_group}").
Sarlavha va bo'sh qatorlarni olmang. Faqat JSON massiv qaytaring.

Jadval ma'lumotlari:
{raw_text[:15000]}"""

    try:
        parsed = await _call_gemini_json(prompt, api_key, payload.model or DEFAULT_GEMINI_MODEL)
        students = []
        if isinstance(parsed, list):
            for idx, item in enumerate(parsed):
                first_name = item.get("firstName") or "O'quvchi"
                last_name = item.get("lastName") or "Familiya"
                students.append({
                    "orderIndex": item.get("orderIndex") or (idx + 1),
                    "fullName": item.get("fullName") or f"{last_name} {first_name}".strip(),
                    "firstName": first_name,
                    "lastName": last_name,
                    "middleName": item.get("middleName") or None,
                    "emaktabId": item.get("emaktabId") or None,
                    "gender": "F" if item.get("gender") == "F" else "M",
                    "group": item.get("group") or default_group,
                    "birthDate": item.get("birthDate") or "2009-01-01",
                })
        return {
            "success": True,
            "students": students,
            "modelUsed": payload.model,
            "detectedGroup": default_group,
        }
    except Exception as exc:
        return {
            "success": False,
            "students": [],
            "modelUsed": payload.model,
            "detectedGroup": default_group,
            "error": _translate_ai_error(str(exc)),
        }


@router.post("/class-diagnosis")
async def generate_class_diagnosis(payload: ClassDiagnosisRequest):
    if payload.useAi:
        api_key = _resolve_gemini_key()
        if api_key:
            prompt = (
                f"Quyidagi natijalar bo'yicha {payload.className} sinfiga qisqa xulosa va 3 tavsiya bering: "
                f"o'rtacha {payload.averageScore}/{payload.maxScore}, sifat {payload.qualityRate}%, "
                f"qamrov {payload.participationRate}% ({payload.totalStudents} o'quvchi)."
            )
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{DEFAULT_GEMINI_MODEL}:generateContent?key={api_key}"
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
                    if res.status_code == 200:
                        data = res.json()
                        ai_text = data["candidates"][0]["content"]["parts"][0]["text"]
                        return {
                            "source": DEFAULT_GEMINI_MODEL,
                            "insights": ai_text,
                            "className": payload.className,
                        }
            except Exception:
                pass

    return compute_class_diagnosis_deterministic(
        class_name=payload.className,
        average_score=payload.averageScore,
        max_score=payload.maxScore,
        quality_rate=payload.qualityRate,
        participation_rate=payload.participationRate,
        total_students=payload.totalStudents,
    )


@router.post("/student-remediation")
async def generate_student_remediation(payload: StudentRemediationRequest):
    plan = build_deterministic_remediation_plan(
        student_name=payload.studentName,
        pct=payload.percentage,
        weakest_bloom=payload.weakestBloom,
        weak_topics=payload.weakTopics,
    )
    return {
        "studentName": payload.studentName,
        "rosterCode": payload.rosterCode,
        "currentLevel": f"{payload.score} ball ({payload.percentage}%)",
        "weakestArea": plan["weakestArea"],
        "trajectory": plan["trajectory"],
        "pedagogicalAdvice": plan["pedagogicalAdvice"],
        "engine": plan["engine"],
    }
