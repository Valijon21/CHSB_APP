"""Seed the 5 official original BSB PDF assessments directly into PostgreSQL/SQLite."""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from prisma import Base64, Prisma

USER_UPLOAD_DIR = Path(
    r"C:\Users\dRuswer\.gemini\antigravity\brain\2785cbbf-6495-407a-b287-602e1a544e07\.user_uploaded"
)

PDF_ASSESSMENTS = [
    {
        "id": "asm-bsb-inf-5-q1",
        "code": "BSB-INF-5-Q1",
        "title": "Informatika va AT, 5-sinf. 1-BSB (Asl PDF)",
        "subject": "Informatika va axborot texnologiyalari",
        "subjectCode": "INF",
        "gradeLevel": 5,
        "quarter": 1,
        "assessmentType": "BSB",
        "durationMinutes": 40,
        "maxScore": 25.0,
        "targetGroup": "all",
        "pdf_path": USER_UPLOAD_DIR / "media_1795874775785_fa966320.pdf",
        "pdf_name": "5-sinf(U)_ORIGINAL_1-BSB_1-chorak_uz.pdf",
        "questions": [
            {
                "num": 1,
                "prompt": "1-topshiriq (Chapdagi PDF hujjatga qarang)",
                "taskType": "subquestions",
                "points": 4.0,
                "subs": [
                    {"id": "q1-a", "label": "a)", "prompt": "«Informatika» so'zi uchun tugma", "points": 2.0},
                    {"id": "q1-b", "label": "b)", "prompt": "«INFORMATIKA» so'zi uchun tugma", "points": 2.0},
                ],
            },
            {"num": 2, "prompt": "2-topshiriq (Chapdagi PDF hujjatga qarang)", "taskType": "open_text", "points": 5.0, "subs": []},
            {"num": 3, "prompt": "3-topshiriq (Chapdagi PDF hujjatga qarang)", "taskType": "open_text", "points": 5.0, "subs": []},
            {"num": 4, "prompt": "4-topshiriq (Chapdagi PDF hujjatga qarang)", "taskType": "open_text", "points": 6.0, "subs": []},
            {"num": 5, "prompt": "5-topshiriq (Chapdagi PDF hujjatga qarang)", "taskType": "open_text", "points": 5.0, "subs": []},
        ],
    },
    {
        "id": "asm-bsb-inf-6-q1",
        "code": "BSB-INF-6-Q1",
        "title": "Informatika va AT, 6-sinf. 1-BSB (Asl PDF)",
        "subject": "Informatika va axborot texnologiyalari",
        "subjectCode": "INF",
        "gradeLevel": 6,
        "quarter": 1,
        "assessmentType": "BSB",
        "durationMinutes": 40,
        "maxScore": 25.0,
        "targetGroup": "all",
        "pdf_path": USER_UPLOAD_DIR / "media_1795874775884_df56fbac.pdf",
        "pdf_name": "6-sinf(U)_ORIGINAL_1-BSB_1-chorak_uz.pdf",
        "questions": [
            {
                "num": 1,
                "prompt": "1-topshiriq (Chapdagi PDF hujjatga qarang)",
                "taskType": "subquestions",
                "points": 4.0,
                "subs": [
                    {"id": "q1-a", "label": "a)", "prompt": "Ko'chiriladigan gap", "points": 1.0},
                    {"id": "q1-b", "label": "b)", "prompt": "Ko'chirish amallari", "points": 3.0},
                ],
            },
            {
                "num": 2,
                "prompt": "2-topshiriq (Chapdagi PDF hujjatga qarang)",
                "taskType": "subquestions",
                "points": 6.0,
                "subs": [
                    {"id": "q2-1", "label": "1)", "prompt": "Shrift turi, o'lchami va rangi", "points": 2.0},
                    {"id": "q2-2", "label": "2)", "prompt": "Sarlavhani tekislash", "points": 2.0},
                    {"id": "q2-3", "label": "3)", "prompt": "Asosiy matnni qulay qilish", "points": 2.0},
                ],
            },
            {"num": 3, "prompt": "3-topshiriq (Chapdagi PDF hujjatga qarang)", "taskType": "open_text", "points": 5.0, "subs": []},
            {
                "num": 4,
                "prompt": "4-topshiriq (Chapdagi PDF hujjatga qarang)",
                "taskType": "subquestions",
                "points": 5.0,
                "subs": [
                    {"id": "q4-a", "label": "a)", "prompt": "Import qilishning ikki xil usuli", "points": 2.5},
                    {"id": "q4-b", "label": "b)", "prompt": "Ularning farqi", "points": 2.5},
                ],
            },
            {"num": 5, "prompt": "5-topshiriq (Chapdagi PDF hujjatga qarang)", "taskType": "open_text", "points": 5.0, "subs": []},
        ],
    },
    {
        "id": "asm-bsb-inf-7-q1",
        "code": "BSB-INF-7-Q1",
        "title": "Informatika va AT, 7-sinf. 1-BSB (Asl PDF)",
        "subject": "Informatika va axborot texnologiyalari",
        "subjectCode": "INF",
        "gradeLevel": 7,
        "quarter": 1,
        "assessmentType": "BSB",
        "durationMinutes": 40,
        "maxScore": 25.0,
        "targetGroup": "all",
        "pdf_path": USER_UPLOAD_DIR / "media_1795874775801_0e17737b.pdf",
        "pdf_name": "7-sinf(U)_ORIGINAL_1-BSB_1-chorak_uz.pdf",
        "questions": [
            {"num": 1, "prompt": "1-topshiriq (Chapdagi PDF hujjatga qarang)", "taskType": "open_text", "points": 5.0, "subs": []},
            {"num": 2, "prompt": "2-topshiriq (Chapdagi PDF hujjatga qarang)", "taskType": "open_text", "points": 4.0, "subs": []},
            {
                "num": 3,
                "prompt": "3-topshiriq (Chapdagi PDF hujjatga qarang)",
                "taskType": "subquestions",
                "points": 5.0,
                "subs": [
                    {"id": "q3-a", "label": "a)", "prompt": "Vaqti ustuni va Insert Right", "points": 2.5},
                    {"id": "q3-b", "label": "b)", "prompt": "Yangi ustun sarlavhasi", "points": 2.5},
                ],
            },
            {"num": 4, "prompt": "4-topshiriq (Chapdagi PDF hujjatga qarang)", "taskType": "open_text", "points": 5.0, "subs": []},
            {
                "num": 5,
                "prompt": "5-topshiriq (Chapdagi PDF hujjatga qarang)",
                "taskType": "subquestions",
                "points": 6.0,
                "subs": [
                    {"id": "q5-a", "label": "a)", "prompt": "Header maydoni", "points": 2.0},
                    {"id": "q5-b", "label": "b)", "prompt": "Footer (sana va sahifa)", "points": 4.0},
                ],
            },
        ],
    },
    {
        "id": "asm-bsb-inf-9-q1",
        "code": "BSB-INF-9-Q1",
        "title": "Informatika va AT, 9-sinf. 1-BSB (Asl PDF)",
        "subject": "Informatika va axborot texnologiyalari",
        "subjectCode": "INF",
        "gradeLevel": 9,
        "quarter": 1,
        "assessmentType": "BSB",
        "durationMinutes": 45,
        "maxScore": 50.0,
        "targetGroup": "all",
        "pdf_path": USER_UPLOAD_DIR / "media_1795874775914_b55449a7.pdf",
        "pdf_name": "9-sinf(U)_ORIGINAL_1-BSB_1-chorak_uz.pdf",
        "questions": [
            {
                "num": 1,
                "prompt": "1-topshiriq (Chapdagi PDF hujjatga qarang)",
                "taskType": "subquestions",
                "points": 10.0,
                "subs": [
                    {"id": "q1-a", "label": "a)", "prompt": "Kiritish qurilmasi", "points": 2.5},
                    {"id": "q1-b", "label": "b)", "prompt": "Protsessor", "points": 2.5},
                    {"id": "q1-c", "label": "c)", "prompt": "Chiqarish qurilmasi", "points": 2.5},
                    {"id": "q1-d", "label": "d)", "prompt": "Xotira qurilmasi", "points": 2.5},
                ],
            },
            {
                "num": 2,
                "prompt": "2-topshiriq (Chapdagi PDF hujjatga qarang)",
                "taskType": "subquestions",
                "points": 10.0,
                "subs": [
                    {"id": "q2-a", "label": "a)", "prompt": "Shtrix kod rider (Afzalligi va Kamchiligi)", "points": 5.0},
                    {"id": "q2-b", "label": "b)", "prompt": "Chip va PIN rider (Afzalligi va Kamchiligi)", "points": 5.0},
                ],
            },
            {"num": 3, "prompt": "3-topshiriq (Xotira qurilmalari jadvali)", "taskType": "open_text", "points": 12.0, "subs": []},
            {
                "num": 4,
                "prompt": "4-topshiriq (Chapdagi PDF hujjatga qarang)",
                "taskType": "subquestions",
                "points": 8.0,
                "subs": [
                    {"id": "q4-a", "label": "a)", "prompt": "Bluetooth noqulayligi", "points": 4.0},
                    {"id": "q4-b", "label": "b)", "prompt": "Router qulayligi", "points": 4.0},
                ],
            },
            {
                "num": 5,
                "prompt": "5-topshiriq (Chapdagi PDF hujjatga qarang)",
                "taskType": "subquestions",
                "points": 10.0,
                "subs": [
                    {"id": "q5-a", "label": "a)", "prompt": "Sayt nomi qismi", "points": 2.5},
                    {"id": "q5-b", "label": "b)", "prompt": "Bo'lim (papka) qismi", "points": 2.5},
                    {"id": "q5-c", "label": "c)", "prompt": "https:// o'rniga http:// farqi", "points": 2.5},
                    {"id": "q5-d", "label": "d)", "prompt": "/ belgisining vazifasi", "points": 2.5},
                ],
            },
        ],
    },
    {
        "id": "asm-chsb-mat-10-q1-9545",
        "code": "CHSB-MAT-10-Q1-9545",
        "title": "Informatika va AT, 10-sinf. 1-BSB (Asl PDF)",
        "subject": "Informatika va axborot texnologiyalari",
        "subjectCode": "INF",
        "gradeLevel": 10,
        "quarter": 1,
        "assessmentType": "BSB",
        "durationMinutes": 45,
        "maxScore": 50.0,
        "targetGroup": "all",
        "pdf_path": USER_UPLOAD_DIR / "media_1795874775935_339add31.pdf",
        "pdf_name": "10-sinf(U)_ORIGINAL_1-BSB_1-chorak_uz.pdf",
        "questions": [
            {
                "num": 1,
                "prompt": "1-topshiriq (Chapdagi PDF hujjatga qarang)",
                "taskType": "subquestions",
                "points": 10.0,
                "subs": [
                    {"id": "q1-a", "label": "a)", "prompt": "statik ma'lumot", "points": 2.5},
                    {"id": "q1-b", "label": "b)", "prompt": "dinamik ma'lumot", "points": 2.5},
                    {"id": "q1-c", "label": "c)", "prompt": "bevosita ma'lumotlar manbasi", "points": 2.5},
                    {"id": "q1-d", "label": "d)", "prompt": "bilvosita ma'lumot manbasi", "points": 2.5},
                ],
            },
            {"num": 2, "prompt": "2-topshiriq (Sezar shifri yechimi)", "taskType": "open_text", "points": 8.0, "subs": []},
            {
                "num": 3,
                "prompt": "3-topshiriq (Chapdagi PDF hujjatga qarang)",
                "taskType": "subquestions",
                "points": 12.0,
                "subs": [
                    {"id": "q3-a", "label": "a)", "prompt": "Grafik karta", "points": 3.0},
                    {"id": "q3-b", "label": "b)", "prompt": "Qattiq disk (HDD)", "points": 3.0},
                    {"id": "q3-c", "label": "c)", "prompt": "Klaviatura", "points": 3.0},
                    {"id": "q3-d", "label": "d)", "prompt": "Plotter", "points": 3.0},
                ],
            },
            {
                "num": 4,
                "prompt": "4-topshiriq (Chapdagi PDF hujjatga qarang)",
                "taskType": "subquestions",
                "points": 12.0,
                "subs": [
                    {"id": "q4-a", "label": "a)", "prompt": "Appletlar", "points": 3.0},
                    {"id": "q4-b", "label": "b)", "prompt": "Ma'lumotlar bazasini boshqarish tizimi", "points": 3.0},
                    {"id": "q4-c", "label": "c)", "prompt": "Antivirus", "points": 3.0},
                    {"id": "q4-d", "label": "d)", "prompt": "Ma'lumotlarni arxivlash", "points": 3.0},
                ],
            },
            {
                "num": 5,
                "prompt": "5-topshiriq (Chapdagi PDF hujjatga qarang)",
                "taskType": "subquestions",
                "points": 8.0,
                "subs": [
                    {"id": "q5-a", "label": "a)", "prompt": "Elektron tahdid turi va xavflar", "points": 4.0},
                    {"id": "q5-b", "label": "b)", "prompt": "Qarshi choralar", "points": 4.0},
                ],
            },
        ],
    },
]


async def seed_pdfs() -> None:
    db = Prisma()
    await db.connect()
    try:
        for item in PDF_ASSESSMENTS:
            pdf_path: Path = item["pdf_path"]
            if not pdf_path.exists():
                print(f"MISSING PDF: {pdf_path}")
                continue
            raw_bytes = pdf_path.read_bytes()
            encoded = Base64.encode(raw_bytes)
            existing = await db.assessment.find_first(
                where={"OR": [{"id": item["id"]}, {"code": item["code"]}]}
            )
            data_fields = {
                "code": item["code"],
                "title": item["title"],
                "subject": item["subject"],
                "subjectCode": item["subjectCode"],
                "gradeLevel": item["gradeLevel"],
                "quarter": item["quarter"],
                "assessmentType": item["assessmentType"],
                "durationMinutes": item["durationMinutes"],
                "totalQuestions": len(item["questions"]),
                "maxScore": item["maxScore"],
                "targetGroup": item["targetGroup"],
                "sourcePdfData": encoded,
                "sourcePdfName": item["pdf_name"],
                "sourcePdfSize": len(raw_bytes),
            }
            if existing:
                asm = await db.assessment.update(where={"id": existing.id}, data=data_fields)
                await db.question.delete_many(where={"assessmentId": asm.id})
            else:
                asm = await db.assessment.create(data={"id": item["id"], **data_fields})

            for q in item["questions"]:
                await db.question.create(
                    data={
                        "id": f"q-{asm.id}-{q['num']}",
                        "assessmentId": asm.id,
                        "questionNumber": q["num"],
                        "prompt": q["prompt"],
                        "taskType": q["taskType"],
                        "optionsJson": "[]",
                        "subQuestionsJson": json.dumps(q["subs"], ensure_ascii=False),
                        "rubricJson": "[]",
                        "correctOptionId": "",
                        "bloomLevel": "APPLICATION",
                        "difficulty": "medium",
                        "points": q["points"],
                    }
                )
            print(f"Seeded {asm.code} -> {item['pdf_name']} ({len(raw_bytes)} bytes, {len(item['questions'])} tasks)")
    finally:
        await db.disconnect()


if __name__ == "__main__":
    asyncio.run(seed_pdfs())
