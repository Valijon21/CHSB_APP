# CHSB Platformasi — Xavfsizlik, BSB/CHSB Standarti va Arxitektura Rejasi

## Overview
`CHSB_APP` platformasini MVP darajasidan O'zbekiston umumta'lim va ixtisoslashtirilgan maktablari uchun tezkor, xavfsiz, haqiqiy ma'lumotlarga tayangan va MMTV/eMaktab 100 ballik mezonli baholash tizimiga to'liq mos ishlab chiqarish (production) tizimiga aylantirish.

- **Asosiy maqsadlar:**
  1. Barcha kritik xavfsizlik zaifliklari va mantiqiy buglarni yopish (API kalitni yashirish, RBAC/JWT himoyasi, `correctOptionId` ni yashirish, `saveDraft` merge bugini tuzatish).
  2. O'zbekistondagi **Formativ (10) + BSB/Loyiha (50) + CHSB (40) = 100 ball** hamda ikkita rasmiy 5 ballik shkalani (`86/66/30` MMTV va `86/71/56` Ixtisoslashtirilgan) joriy etish.
  3. Barcha stub/mock modullarni (O'qituvchilar, Maktablar, Rubrika baholash, Live Proctoring, Analitika, Hududiy monitoring) real PostgreSQL/FastAPI API ga ulash, keraksiz eski fayllarni tozalash va paginatsiya/loglash orqali tezlikni oshirish.

## Project Type
**FULLSTACK WEB** (Vue 3 + TypeScript + Pinia + Tailwind CSS v4 Frontend | Python FastAPI + Prisma ORM + PostgreSQL/SQLite Backend)

## Success Criteria
- [ ] Frontend bundle va kodida birorta ham maxfiy API kalit yoki demo parol qolmagan (`security_scan.py` 0 critical).
- [ ] Barcha himoyalangan backend endpointlar JWT + Role (`TEACHER`, `SCHOOL_ADMIN`, `REGIONAL_INSPECTOR`, `STUDENT`) + `tenantId` izolyatsiyasini tekshiradi.
- [ ] Imtihon vaqtida `GET /assessments/{id}` javob kalitini (`correctOptionId`) qaytarmaydi; `saveDraft` javoblarni birlashtiradi (`merge`); `submit_attempt` server vaqti va qayta topshirishni nazorat qiladi.
- [ ] Tizim `Formativ (10) + BSB (50) + CHSB (40) = 100` choraklik va yillik jurnalni, BSB ochiq topshiriqlarini rubrika bo'yicha bazaga saqlashni hamda maktab turiga ko'ra `86/66/30` va `86/71/56` shkalalarini qo'llab-quvvatlaydi.
- [ ] Barcha stub/mock modullar real backendga ulangan; `backend/tests` (Pytest) va `frontend/tests` (Vitest) 100% PASS, `typecheck`, `lint` va `build` xatosiz o'tadi.

## Tech Stack
- **Frontend:** Vue 3.5, TypeScript 5.7+, Pinia 2.3, Vue Router 4.5, Tailwind CSS v4, Zod 3.24, Vitest 3.0
- **Backend:** Python 3.11+, FastAPI 0.115+, Prisma Client Python, Pydantic v2, PyJWT, Bcrypt, RotatingFileHandler
- **Database:** PostgreSQL (prod) / SQLite (dev/test) — `prisma/schema.prisma`

## File Structure (Ta'sirlanadigan asosiy qismlar)
```text
CHSB_APP/
├── prisma/schema.prisma              # BSB/CHSB/Formativ, RubricGrade, ProctorEvent, GradingPreset modellari
├── backend/app/
│   ├── main.py                       # CORS, DEBUG guard, RotatingFileHandler loglash
│   ├── core/dependencies.py          # Tenant-isolated RBAC va Student session dependency
│   ├── services/grading.py           # 100-ballik chorak/yillik va 5-ballik shkala hisoblagichi
│   └── api/v1/endpoints/             # auth, assessments, analytics, regional, schools, teachers, proctor, gradebook
├── frontend/src/
│   ├── shared/api/repositories/      # Monolit realApi.ts ni modullarga bo'lish
│   ├── features/auth/                # Rollar (REGIONAL_INSPECTOR), demo fallbackni o'chirish
│   ├── features/assessment/          # BSB ochiq javoblar + merge draft + real proctor telemetry
│   └── features/teacher/             # Rubrika saqlash, Choraklik 100-ballik jurnal, Live Proctor, Analytics
└── tests/ (backend & frontend)       # Har bir task uchun unit/integratsiya testlari
```

---

## Task Breakdown

### 1-To'lqin: Xavfsizlik va Kritik Buglarni Tuzatish (P0 — Blockerlar)

- [x] **TASK-1.1: API Kalitni Frontenddan Olib Tashlash va Backend AI Proxy**
  - **Agent:** `security-auditor` + `backend-specialist` | **Skills:** `vulnerability-scanner`, `api-patterns`
  - **INPUT:** `frontend/src/shared/utils/groundedAiExtractor.ts` (`ENCODED_BUILTIN_KEY`), `backend/app/api/v1/endpoints/ai.py`
  - **OUTPUT:** Frontenddan kalit to'liq o'chiriladi; `POST /api/v1/ai/extract-questions` endpointi `settings.GEMINI_API_KEY` orqali ishlaydi (foydalanuvchi UI dan yubormasdan).
  - **VERIFY:** `rg`/`Select-String` bilan `QVEu` yoki API kalit qidirilganda 0 natija; Pytest testi 200/503 xatti-harakatini tasdiqlaydi. *(Eslatma: eski kalitni Google AI Studio'da bekor qilish kerak).*

- [x] **TASK-1.2: Barcha Endpointlarga JWT, RBAC va Tenant Izolyatsiyasini Ulash**
  - **Agent:** `security-auditor` + `backend-specialist` | **Skills:** `vulnerability-scanner`, `api-patterns`
  - **INPUT:** `backend/app/core/dependencies.py`, `classes.py`, `students.py`, `assessments.py`, `subjects.py`, `analytics.py`, `regional.py`, `curriculum.py`, `ai.py`, `frontend/src/features/auth/`
  - **OUTPUT:** Staff endpointlarida `Depends(require_role(...))` va `current_user.tenantId` tekshiruvi; student imtihon endpointlarida `STUDENT` JWT tekshiruvi; `REGIONAL_INSPECTOR` va `SUPER_ADMIN` rollarini frontend/router da birxillashtirish; `authStore.ts` dan production fallback parollarni olib tashlash.
  - **VERIFY:** Tokensiz yoki noto'g'ri rol/tenant bilan yuborilgan so'rovlar `401`/`403` qaytarishi Pytest da tekshiriladi.

- [x] **TASK-1.3: Answer Key Yashirish, Draft Merge va Timer/Idempotency Himoyasi**
  - **Agent:** `backend-specialist` + `frontend-specialist` | **Skills:** `api-patterns`, `clean-code`
  - **INPUT:** `backend/app/api/v1/endpoints/assessments.py`, `frontend/src/features/assessment/assessmentStore.ts`, `frontend/src/shared/api/realApi.ts`
  - **OUTPUT:** `GET /assessments/{id}` student uchun `correctOptionId` ni qaytarmaydi (alohida teacher endpointi bo'ladi); `save_draft` mavjud `answersJson` bilan merge qiladi; `submit_attempt` `submitted` urinishni qayta hisoblamaydi, `startedAt + durationMinutes` deadline va offline-queue dan kelgan `answers` ni tekshiradi; frontend `deadlineAt` ni real `startedAt` + `durationMinutes` dan hisoblaydi va `assessmentId` hardcoded `'chsb-inf-11-q1'` ni olib tashlaydi.
  - **VERIFY:** Pytest da ketma-ket 2 ta draft yuborilganda ikkalasi ham saqlanishi, `correctOptionId` student javobida yo'qligi va qayta submit idempotent ekani tasdiqlanadi.

- [ ] **TASK-1.4: Runtime Crash (`regional.py`), Debug Guard va Rotating Loglar**
  - **Agent:** `backend-specialist` + `debugger` | **Skills:** `systematic-debugging`, `clean-code`
  - **INPUT:** `backend/app/api/v1/endpoints/regional.py`, `backend/app/main.py`, `backend/app/core/config.py`
  - **OUTPUT:** `regional.py:63` dagi `s.district` → `s.districtId` ga tuzatiladi; `DEBUG` flagi qo'shilib `debug-db` va `traceback` faqat `DEBUG=True` da ishlaydi; CORS `allow_origins` env dan olinadi; `logging.handlers.RotatingFileHandler` (`logs/backend.log`) yoqiladi.
  - **VERIFY:** Pytest da `/api/v1/regional/rankings` 200 OK qaytaradi; production rejimda 500 xato `traceback` chiqarmaydi; log fayl yoziladi.

---

### 2-To'lqin: O'zbekiston BSB / CHSB / Formativ (100 Ballik Tizim)

- [ ] **TASK-2.1: Prisma Sxemasini 100-Ballik Tizim Uchun Kengaytirish**
  - **Agent:** `database-architect` | **Skills:** `database-design`
  - **INPUT:** `prisma/schema.prisma`, `backend/app/db/schema_sync.py`
  - **OUTPUT:**
    - `School.gradingPreset` (`"MMTV_STANDARD"` [86/66/30] | `"SPECIALIZED"` [86/71/56]);
    - `Assessment`: `assessmentType` (`"BSB"` | `"CHSB"` | `"PROJECT"`), `quarter` (`1..4`), `academicYear`, `subjectId`;
    - `Question`: `taskType` (`"multiple_choice"` | `"subquestions"` | `"table_completion"` | `"case_study"` | `"open_text"`), `subQuestionsJson`, `rubricJson`;
    - `AttemptGrade` / `RubricScore` (ochiq BSB javoblari, o'qituvchi qo'ygan ballar va `feedback`, `verifiedByTeacher`);
    - `FormativeScore` (darsdagi ish max 6 + uy vazifasi max 4 = 10 ballgacha, chorak va fan bo'yicha);
    - `AssessmentAttempt`: `absenceReason` (`"none"` | `"sababli"` | `"sababsiz"`), `reopenedBy` va indekslar.
  - **VERIFY:** `prisma generate` va `prisma db push` (SQLite va PostgreSQL sxema sinovi) muvaffaqiyatli o'tadi.

- [ ] **TASK-2.2: Baholash Dvigateli (10 + 50 + 40 = 100) va Ikki Shkala Konvertatsiyasi**
  - **Agent:** `backend-specialist` + `test-engineer` | **Skills:** `clean-code`, `tdd-workflow`
  - **INPUT:** `backend/app/services/grading.py` (yangi), `frontend/src/entities/emaktab/model.ts`, `frontend/src/features/teacher/results/BsbRubricGradingModal.vue`
  - **OUTPUT:** Formativ o'rtacha (max 10) + BSB/Loyihalar yig'indisi (max 50) + CHSB (max 40) = 100 ball; yillik 4 chorak o'rtachasi; maktab `gradingPreset` ga mos 5 ballik konvertatsiya (`86/66/30` va `86/71/56`).
  - **VERIFY:** Pytest va Vitest da chegaraviy qiymatlar (`29, 30, 55, 56, 65, 66, 70, 71, 85, 86, 100`) uchun 100% unit test o'tadi.

- [ ] **TASK-2.3: BSB Ochiq Topshiriqlar, Rubrika Saqlash va Choraklik Jurnal API + UI**
  - **Agent:** `backend-specialist` + `frontend-specialist` | **Skills:** `api-patterns`, `frontend-architecture`
  - **INPUT:** `assessments.py`, `BsbTaskRenderer.vue`, `BsbRubricGradingModal.vue`, `TeacherResultsView.vue`, `EmaktabSyncView.vue`
  - **OUTPUT:** O'quvchi BSB ochiq javoblarini DB ga saqlaydi (`pending_review` holati bilan); o'qituvchi `PATCH /api/v1/assessments/results/{attemptId}/grade` orqali rubrika ballari va izohni bazaga yozadi; yangi **Choraklik Jurnal (10+50+40)** ko'rinishi va eMaktab eksporti qo'shiladi.
  - **VERIFY:** Pytest + Vitest: BSB saqlangandan keyin sahifa qayta yuklansa ham baho va izoh saqlanib qoladi.

---

### 3-To'lqin: Real Ma'lumotlar, Live Proctoring, Tezlik va Kod Tozalash

- [ ] **TASK-3.1: Organization, Teachers va Profile Modullarini Real API ga Ulash**
  - **Agent:** `backend-specialist` + `frontend-specialist` | **Skills:** `api-patterns`, `clean-code`
  - **INPUT:** `backend/app/api/v1/endpoints/` (`schools.py`, `teachers.py` yangi; `students.py` `PUT/PATCH`), `frontend/src/shared/api/realApi.ts`
  - **OUTPUT:** Maktablar, o'qituvchilar, profil (`GET /auth/me` dan) va o'quvchi tahrirlash (`PATCH /students/{id}`) to'liq PostgreSQL/SQLite da ishlaydi; hardcoded stublar o'chiriladi.
  - **VERIFY:** Pytest CRUD testlari + Frontend store testlari 100% PASS.

- [ ] **TASK-3.2: Real Analytics, Regional Monitoring va Dinamik Test Biriktirish**
  - **Agent:** `backend-specialist` | **Skills:** `database-design`, `performance-profiling`
  - **INPUT:** `analytics.py`, `regional.py`, `classes.py`, `students.py`
  - **OUTPUT:** `passingRate`, `cognitiveBreakdown` (Bilish/Qo'llash/Mulohaza savollar natijasidan), `questionStats` (har bir savol bo'yicha real % to'g'ri javob) va hududiy reytinglar SQL/Prisma agregatsiyasidan real hisoblanadi; o'quvchiga testlar sinf va guruhi bo'yicha bazadan dinamik biriktiriladi; `GET /students` ga paginatsiya (`page`, `limit`, `search`) qo'shiladi.
  - **VERIFY:** Pytest da real natijalar asosida foizlar to'g'ri chiqishi va paginatsiya ishlashi tekshiriladi.

- [ ] **TASK-3.3: Live Proctoring Telemetriyasini Serverga Ulash**
  - **Agent:** `backend-specialist` + `frontend-specialist` | **Skills:** `api-patterns`, `frontend-architecture`
  - **INPUT:** `useExamProctor.ts`, `liveProctorStore.ts`, `TeacherLiveRoomView.vue`, `backend/app/api/v1/endpoints/proctor.py` (yangi)
  - **OUTPUT:** `POST /attempts/{id}/proctor-event` (heartbeat + tab_hidden/window_blur/fullscreen_exit), `GET /assessments/{id}/live-sessions`, o'qituvchi amallari (`grant_time`, `send_warning`, `force_submit`) serverda saqlanadi va o'quvchi ekraniga yetib boradi.
  - **VERIFY:** Pytest + Vitest: qoidabuzarlik va `force_submit` backend holatini o'zgartirishi tekshiriladi.

- [ ] **TASK-3.4: Arxitektura Tozalash, Monolitni Bo'lish va Windows/Cross-platform Tuzatish**
  - **Agent:** `frontend-specialist` + `devops-engineer` | **Skills:** `simplify-code`, `clean-code`
  - **INPUT:** `realApi.ts`, `backend/app/db/session.py`, `CHSB_11_SINF.html`, `package.json`, `frontend/package.json`, `prisma/`
  - **OUTPUT:** `realApi.ts` har bir domain repository fayllariga bo'linadi; o'lik `session.py` va eski `CHSB_11_SINF.html` o'chiriladi; Prisma versiyalari birxillashtiriladi; `clientExcelParser` o'rniga yagona backend/lazy parser qoldiriladi (`dist/` hajmi kamayadi).
  - **VERIFY:** `npm run build`, `npm run typecheck`, `npm run lint` to'liq xatosiz o'tadi.

---

## Phase X: Yakuniy Tekshiruv (Verification Checklist)
- [ ] Security Scan: `python .agents/skills/vulnerability-scanner/scripts/security_scan.py .`
- [ ] Backend Testlar: `python -m pytest backend/tests -v` (100% PASS)
- [ ] Frontend Testlar, Typecheck, Lint, Build: `npm test && npm run typecheck && npm run lint && npm run build`
- [ ] Lokal Git: Har bir wave/task yakunida Conventional Commits bilan lokal commit (GitHub ga push qilinmaydi).

