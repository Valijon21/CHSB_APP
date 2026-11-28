# Original PDF Split-Screen Assessment Architecture Plan

**Date:** 2026-11-28  
**Goal:** Allow teachers to upload an original CHSB / BSB / PROJECT PDF stored directly in PostgreSQL (`Bytes`) without parsing/tearing PDF text into cards, and present a split-screen workspace to students: **left pane = full original PDF rendered faithfully as-is (pages, images, tables, formulas)** and **right pane = interactive CHSB OMR answer sheet (`A/B/C/D`) or BSB open/subquestion answer boxes**.

---

## Wave 1: Prisma Schema & Backend PDF Storage / Streaming API
> **Commit target:** `feat(backend): store and stream original assessment PDFs from PostgreSQL`

1. **`prisma/schema.prisma`:**
   - Add `sourcePdfData Bytes? @map("source_pdf_data")`, `sourcePdfName String? @map("source_pdf_name")`, `sourcePdfSize Int? @map("source_pdf_size")` to `model Assessment`.
   - Run `npx prisma generate` and `npx prisma db push`.
2. **`backend/app/api/v1/endpoints/assessments.py`:**
   - Expose `hasPdf`, `sourcePdfName`, `sourcePdfSize`, and `sourcePdfUrl` (`/api/v1/assessments/{id}/pdf` when `hasPdf` is true) in `_format_assessment_summary` and `get_assessment`.
   - Support optional `answerKey` (`dict` or `"1-A, 2-B"` string) when creating a PDF-backed CHSB assessment in `POST /assessments`.
   - Add `POST /assessments/{assessment_id}/pdf` (`STAFF_ACCESS`, multipart `UploadFile`, verifies `%PDF-` magic header and `<= 15 MB`, saves bytes to `sourcePdfData`).
   - Add `GET /assessments/{assessment_id}/pdf` (`CURRENT_ACTOR` — accessible to admitted students & staff, streams `application/pdf` with `Content-Disposition: inline`).
3. **Tests:** `backend/tests/test_assessment_pdf_upload.py` -> 100% pass -> local git commit.

---

## Wave 2: Teacher Assessment Creation (Asl PDF Mode, removing legacy PDF text-splitter)
> **Commit target:** `feat(assessments): add original PDF + answer sheet creation mode and remove PDF text extractor UI`

1. **Entities & Repositories (`entities/assessment/model.ts`, `RealAssessmentRepository.ts`, `RealTeacherRepository.ts`, `TeacherRepository.ts`, `types.ts`):**
   - Add `hasPdf?: boolean`, `sourcePdfName?: string`, `sourcePdfUrl?: string`, `answerKey?: string` fields and `uploadAssessmentPdf(assessmentId: string, file: File)` method.
2. **`CreateAssessmentModal.vue`:**
   - Set **Asl PDF (Chapda PDF + O'ngda Javoblar varaqasi)** (`'pdf_split'`) as the default/primary mode alongside `'auto'` and `'custom'`.
   - Remove the legacy "PDF matnidan savollarni ajratib olish (AI / regex text splitter)" flow and preview cards from `CreateAssessmentModal.vue`.
   - Show selected PDF metadata (filename, size, inline preview info) cleanly.
   - For **CHSB**: let teacher set question count (1–60) + optional/full answer key grid or quick key string (`1-A, 2-B, ...`) so auto-grading works seamlessly with the original PDF.
   - For **BSB / PROJECT**: let teacher configure tasks (`1-topshiriq`, `2-topshiriq`, optional `a, b, c, d` sub-parts and points) for the right-hand answer sheet, while students still see the **entire untouched PDF** on the left.
3. **`TeacherAssessmentsView.vue` & `TeacherAssessmentDetailView.vue`:**
   - Upload attached PDF file after creating assessment (`api.teacher.uploadAssessmentPdf`), show `📄 Asl PDF` badge on cards, and embed PDF preview on the detail page.
4. **Tests:** Add `frontend/tests/create-assessment-pdf-mode.test.ts` and update `student-mastery-analytics.test.ts` -> 100% pass -> local git commit.

---

## Wave 3: Student Split-Screen Workspace (Left: Original PDF, Right: Answer Sheet)
> **Commit target:** `feat(workspace): render split-screen original PDF and answer sheet for CHSB/BSB`

1. **`frontend/src/features/assessment/components/PdfDocumentPane.vue`:**
   - Authenticated fetch of `/api/v1/assessments/{id}/pdf` with `Bearer` token (`httpClient` / `sessionStorage`).
   - Renders every page faithfully on high-DPI `<canvas>` elements via `pdfjs-dist` (zero browser PDF download toolbar leaks for anti-cheat, plus zoom `- / 100% / +` and page count indicator). Falls back cleanly if canvas unavailable in headless tests.
2. **`frontend/src/features/assessment/components/PdfAnswerSheetPane.vue`:**
   - For **CHSB** (`MCQ` questions): compact OMR answer sheet (`1. A B C D`, `2. A B C D`, ...) with answered progress counter.
   - For **BSB / PROJECT**: structured answer boxes per task / subquestion (`1-topshiriq`, `a)`, `b)`, ...) bound to `assessmentStore.answers` and auto-saved drafts.
3. **`frontend/src/features/assessment/AssessmentWorkspaceView.vue`:**
   - When `assessmentStore.assessment?.hasPdf` is true, render responsive 2-column split screen (`lg:grid-cols-12`: left 7 cols sticky scrollable `PdfDocumentPane`, right 5 cols scrollable `PdfAnswerSheetPane` + submit button).
   - Keep standard single-question flow for non-PDF assessments.
4. **Tests:** `frontend/tests/pdf-split-workspace.test.ts` -> 100% pass -> local git commit.

---

## Wave 4: End-to-End Verification & Live Server Check
1. Regenerate Prisma client, sync schema (`db push`), restart FastAPI backend daemon so new `/pdf` endpoints are live.
2. Run `pytest backend/tests -q`, `npm run build`, `npm run typecheck`, `npm run lint`, and `npm test -- --run` -> 100% pass.
