# CHSB / BSB Production Parity, Bug Fixes & Real Format Support Plan

**Date:** 2026-11-28  
**Goal:** Eliminate all technical bugs, hardcoded demo leaks, and CHSB/BSB MMTV standard gaps across the full stack, and guarantee deterministic support for real-world Pedagogik Mahorat Markazi BSB PDFs (grades 5–11, italic sublabels, table completion, trailing `Baholash mezoni` tables) and real-world eMaktab / BahoLab / semicolon Gradebook CSV & XLS exports.

---

## Wave 1: Backend API Fixes, Real Repository Parity & Key Security
> **Commit target:** `fix(backend): support PROJECT gradebook, answer payloads, backend-only AI key and repo parity`

1. **`backend/app/api/v1/endpoints/gradebook.py`:**
   - Support `"PROJECT"` alongside `{"BSB", "PRACTICAL"}` when collecting BSB/project scores.
   - Strict `subjectCode` matching for formative scores (do not fall back to `fb_candidates[0]` from another subject when `subjectCode` is specified and non-`"ALL"`).
   - Include `0`-score active quarters properly in annual score averages without silently dropping zero-scoring quarters that have assessments.
2. **`backend/app/api/v1/endpoints/assessments.py`:**
   - Allow `assessmentType` `"PROJECT"` in addition to `"CHSB"`, `"BSB"`, `"PRACTICAL"`.
   - Include `answers` (parsed `attempt.answersJson`) and `absenceReason` (`attempt.absenceReason`) in `_format_result_row(r)` so `TeacherResultsView` and `BsbRubricGradingModal` display real student responses and absence reasons.
3. **`backend/app/api/v1/endpoints/students.py`:**
   - Replace hardcoded `availableAssessmentIds: ["chsb-inf-11-q1"]` in `create_student` with `_match_assessment_ids(...)` using the class group's grade level and optional group.
4. **`backend/app/api/v1/endpoints/ai.py` & `frontend/src/shared/utils/groundedAiExtractor.ts`:**
   - Remove browser-supplied `customApiKey` / `localStorage` key override so Gemini requests strictly use the server-side `.env` `GEMINI_API_KEY`.
5. **Frontend Real Repositories (`frontend/src/shared/api/real/`):**
   - `RealAssessmentRepository.ts`: Preserve `assessmentType`, `quarter`, `academicYear`, `subjectCode`, `targetGroup`, `taskType`, `subQuestions`, `rubric`, and `correctOptionId` in mapped assessment & question models.
   - `RealTeacherRepository.ts`: Preserve real `rosterCode` in report rows instead of `studentId.slice(0, 8)`, preserve `assessmentType` / `quarter` / `answers` / `absenceReason`, and populate dynamic profile subjects/phone instead of hardcoded strings.
6. **Tests:** Add/update `backend/tests/test_bsb_and_gradebook.py`, `backend/tests/test_ai_proxy.py`, and frontend repository tests, verify 100% pass, commit locally.

---

## Wave 2: Real BSB PDF Parser, eMaktab / BahoLab / CSV Parsers & Assessment Builder
> **Commit target:** `feat(parsers): support PMM BSB PDF rubrics, BahoLab PIN, eMaktab Fan jurnali and semicolon CSV`

1. **`frontend/src/shared/utils/pdfQuestionParser.ts`:**
   - Strip eMaktab watermarks (`(?:\d{8,}\s+)?eMaktab(?:\s+\d+)?` & partial fragments like `10000113 eMaktab`), underscores `____`, and normalize Unicode mathematical italic labels (`𝑎-𝑧` -> `a-z`) and spaced `1 - topshiriq` / `[ 1 0 ball ]`.
   - Parse trailing **Baholash mezoni** rubric table (`Bob | Mavzu | Baholanadigan ko‘nikma | Namunaviy topshiriq | Ajratilgan ball | Baholash mezoni`) and merge extracted `points`, `rubric`, `topic`, and `skill` into the corresponding `1-topshiriq`..`N-topshiriq` questions (essential for grades 5–6 where points only appear in the trailing table).
   - Handle `1)`, `2)`, `3)` numbered subitems, duplicate `a)` labels with unique subquestion IDs (`qNum-idx`), `Afzalligi –` / `Kamchiligi –` prompts, and `table_completion` tasks (`Jadvaldagi bo'sh o'rinlarni...` + `Bo'sh joylarga quyidagilardan biri yozilishi shart`).
   - Return clear 0-question rejection on non-exam PDFs (e.g., articles).
2. **`frontend/src/features/emaktab/services/` & `backend/app/services/excel_parser.py`:**
   - Ensure deterministic handling of all real roster/gradebook formats:
     - `BahoLab PIN .xls` (`BahoLab · 10-A (1-gurux) · ...`, `№ | O'quvchi | PIN` with float `1.0`).
     - `eMaktab Fan jurnali .xls` (`^next_part^`, `Sinf: 10-A (1-gurux)` / `10-V` / `11-A (2-gurux)`, float rows `1.0`, 13-digit `eMaktab ID`, mixed Latin + Cyrillic names, `k` absent markers).
     - `Semicolon (;) UTF-8 BOM Gradebook CSV` (`№;F.I.Sh.;eMaktab ID;FB (10);BSB (50);ChSB (40);Jami (100);Baho;Izoh`) in both importer and `emaktabExportService.ts` exporter.
3. **`frontend/src/features/teacher/assessments/CreateAssessmentModal.vue`:**
   - Add `assessmentType` selector (`'CHSB' | 'BSB' | 'PROJECT'`) and emit `assessmentType` cleanly.
   - Support structured open-ended / BSB parsed questions directly without routing them through the MCQ-only `customQuestionsText` parser.
4. **Tests:** Add Vitest & Pytest specs covering grades 5, 6, 7, 9, 10 BSB PDFs, BahoLab PIN `.xls`, eMaktab Fan jurnali `.xls`, and `;` Gradebook CSV, verify 100% pass, commit locally.

---

## Wave 3: Student Admission Multi-Exam Picker, Workspace Proctor Sync & BSB Grading UI
> **Commit target:** `feat(assessment): add multi-assessment picker, live proctor controls and dynamic BSB rubric grading`

1. **`frontend/src/features/student-admission/` (`StudentEntryView.vue`, `StudentVerifyView.vue`, router/store):**
   - Remove hardcoded `"Demo kodlar: STU-1101..."` hints from `StudentEntryView.vue`.
   - When `match.availableAssessmentIds.length > 1`, fetch assessment summaries and show an **Exam Selection Screen** (title, subject, BSB/CHSB/PROJECT badge, duration, question count) before navigating to instructions.
2. **`frontend/src/features/assessment/` (`AssessmentInstructionsView.vue`, `AssessmentWorkspaceView.vue`, `assessmentStore.ts`):**
   - Adapt instructions dynamically to `BSB` / `CHSB` / `PROJECT` (`assessmentType`, `maxScore`, open-ended vs test instructions).
   - Remove `"Demo Timer"` badge in `AssessmentWorkspaceView.vue`; add real proctoring sync/notification support for teacher warnings, extra time (`addTime`), and force-submit status.
3. **`frontend/src/features/results/` (`SubmissionReceiptView.vue`, `AssessmentResultView.vue`):**
   - Replace hardcoded `"Demo Kvitansiya"` / `"Dastlabki Demo Natija"` / placeholder `35 / 40 / 87.5%` with real attempt result data, `pending_review` state for ungraded BSB/PROJECT works, 5-point grade badge, and teacher feedback.
4. **`frontend/src/features/teacher/results/BsbRubricGradingModal.vue`:**
   - Load real `Assessment` questions (`taskType`, `subQuestions`, `rubric`, `points`) and the student's actual `answers` instead of static `officialBsbData.ts`, and render dynamic `"<assessmentTitle> — Baholash varaqasi"`.
5. **Tests:** Add/update Vitest specs for multi-exam selection, BSB grading modal with real questions, and result views, verify 100% pass, commit locally.

---

## Wave 4: Teacher, Admin, Curriculum, eMaktab & Regional Views Completion
> **Commit target:** `feat(dashboards): remove demo placeholders and complete BSB/CHSB admin and gradebook flows`

1. **`frontend/src/features/teacher/curriculum/CurriculumHubView.vue`:** Use authenticated `httpClient.get` instead of unauthenticated `fetch` and dynamically resolve solutions by selected class/quarter/assessment instead of hardcoded `chsb-inf-11-q1`.
2. **`frontend/src/features/teacher/assessments/` (`TeacherAssessmentsView.vue`, `TeacherAssessmentDetailView.vue`):** Display `BSB`/`CHSB`/`PROJECT` filter & badges, per-assessment real submitted counts, structured `subQuestions`/`rubric` preview, and inline question editing/addition.
3. **`frontend/src/features/teacher/results/TeacherResultsView.vue`:** Use tenant's real `Subject` list (no hardcoded fallback), display `annualScore100` & `annualGrade5`, add UI actions for marking `absence` (`EXCUSED`/`UNEXCUSED`/`ILLNESS`) and `reopen` attempt, and add UTF-8 BOM semicolon `;` Gradebook CSV export.
4. **`frontend/src/features/teacher/reports/TeacherReportsView.vue`:** Respect school `gradingPreset` (`MMTV_STANDARD` vs `SPECIALIZED`) and compute real cognitive breakdown from result analytics.
5. **`frontend/src/features/teacher/dashboard/TeacherDashboardView.vue`, `TeacherLiveRoomView.vue`, `TeacherProfileView.vue`:** Remove hardcoded `"11-A"`, `"1-ChSB"`, `"/ 40"`, `"DU"`, fake reminders, and remove localStorage Gemini API key settings.
6. **`frontend/src/features/tenant-admin/TenantAdminView.vue`, `RegionalOversightView.vue`, `EmaktabSyncView.vue`:** Add `gradingPreset` (`MMTV_STANDARD` / `SPECIALIZED`) selector via `PATCH /schools/{id}`, remove fake static regional totals (`184,500`) & `'9-A'` / `'xorazm-demo'` fallbacks in `EmaktabSyncView.vue`, and support semicolon `;` 10+50+40 quarter CSV export.
7. **Tests:** Update affected Vitest suites across views, verify 100% pass, commit locally.

---

## Wave 5: Final End-to-End Verification
1. Run `.venv\Scripts\python.exe -m pytest backend/tests -q` -> 100% pass.
2. Run `npm run typecheck`, `npm run lint`, `npm test -- --run`, and `npm run build` -> 0 errors, 0 warnings, 100% pass.
3. Run `.agents/scripts/security_scan.py` -> 0 real issues.
