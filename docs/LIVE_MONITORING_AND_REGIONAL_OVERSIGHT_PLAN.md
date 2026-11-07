# 🏛️ CHSB PLATFORM — JONLI NAZORAT VA VILOYAT SUPER-BOSHQARUV REJASI
## (Live Proctoring & Regional Oversight Master Architecture Plan)

> **Hujjat turi:** Senior System Architect & Technical Lead Master Plan  
> **Loyiha:** CHSB Enterprise Educational Assessment Platform V2  
> **Modullar:** 1-Modul (Live Proctoring Room) & 6-Modul (Regional & District Oversight)  
> **Metodologiya:** Test-Driven Development (TDD), Feature-Oriented Architecture, Zero-Secrets Invariant.

---

## 1. STRATEGIK MAQSAD VA ARXITEKTURA KONSEPSIYASI

Ushbu reja CHSB platformasini oddiy maktab ichki tizimidan **butun viloyat miqyosida (500+ maktab, 13 ta tuman/shahar, 200,000+ o'quvchi)** markazlashgan, real vaqt rejimida boshqariladigan ta'lim nazorati ekotizimiga aylantirishni ko'zlaydi.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    VILOYAT TA'LIM BOSHQARMASI (LEVEL 1)                      │
│         • Viloyat bo'yicha jami maktablar va o'quvchilar xaritasi            │
│         • Tumanlararo qiyosiy tahlil va reyting matritsasi                   │
│         • Anomaliyalar va shubhali o'sishlarni avtomatik aniqlash            │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
           ┌───────────────────────────┴───────────────────────────┐
           ▼                                                       ▼
┌─────────────────────────────────────┐ ┌─────────────────────────────────────┐
│    TUMAN/SHAHAR XTB (LEVEL 2)       │ │    TUMAN/SHAHAR XTB (LEVEL 2)       │
│  (Urganch sh., Xiva t., Bog'ot...)  │ │  (Gurlan, Shovot, Yangibozor...)    │
│  • Tumandagi maktablar monitoringi  │ │  • Tumandagi maktablar monitoringi  │
└──────────────────┬──────────────────┘ └──────────────────┬──────────────────┘
                   ▼                                       ▼
┌─────────────────────────────────────┐ ┌─────────────────────────────────────┐
│      MAKTAB / TENANT (LEVEL 3)      │ │      MAKTAB / TENANT (LEVEL 3)      │
│   O'qituvchining Jonli Nazorat Zali │ │   O'qituvchining Jonli Nazorat Zali │
│   (Real-Time Live Proctoring Room)  │ │   (Real-Time Live Proctoring Room)  │
│   • 30 o'quvchining jonli holati    │ │   • 30 o'quvchining jonli holati    │
│   • Harakatlar va vkladka nazorati  │ │   • Harakatlar va vkladka nazorati  │
└─────────────────────────────────────┘ └─────────────────────────────────────┘
```

---

## 2. MODUL 1: JONLI NAZORAT ZALI (LIVE PROCTORING ROOM)

O'qituvchi imtihon davomida har bir o'quvchining holatini xuddi videokamera kabi jonli telemetriya bilan ko'rib turadi.

### 2.1. Funksional Talablar
1. **Jonli Sinf Matritsasi (Classroom Live Grid):**
   - 30 ta o'quvchi kartochkasi real vaqtda yangilanadi.
   - Holat indikatorlari:
     - 🟢 **Faol (Active):** O'quvchi test yechmoqda (oxirgi faollik < 10 soniya).
     - 🟡 **Kutish / Sekin (Idle):** O'quvchi 60 soniyadan ortiq harakatsiz.
     - 🔴 **Qoidabuzarlik (Violation Alert):** Boshqa vkladkaga o'tdi, to'liq ekrandan chiqdi yoki nusxa olishga urindi.
     - ⚪ **Oflayn (Offline):** Internet aloqasi uzildi, qurilma xotirasida ishlamoqda.
     - 🔵 **Topshirildi (Submitted):** Imtihonni muvaffaqiyatli topshirdi.
2. **Jonli Telemetriya (Live Metrics per Student):**
   - Qaysi savolda turgani (masalan: `8/15`).
   - Javob berilgan savollar soni va foizi.
   - Qolgan vaqti (dinamik taymer).
   - Qoidabuzarliklar hisoblagichi (masalan: `2/3`).
3. **O'qituvchining Tezkor Boshqaruv Harakatlari (Proctor Actions):**
   - **Qo'shimcha vaqt qo'shish (+5 / +10 daqiqa):** Aloqa uzilishi yoki texnik nosozlik bo'lgan o'quvchiga individual vaqt uzaytirish.
   - **Shaxsiy ogohlantirish yuborish:** O'quvchi ekraniga to'g'ridan-to'g'ri xabar chiqarish (*"Diqqat, kameraga qarang va oynani almashtirmang!"*).
   - **Imtihondan chetlatish / Majburiy yakunlash:** Qoidabuzarlik chegarasi oshganda majburiy `force-submit` qilish.
4. **Harakatlar Jurnali (Audit Event Stream):**
   - Real vaqtda barcha hodisalar lentasi (Audit Log):
     - `10:14:02 — Alisher Zokirov: 5-savolga javob berdi (C)`
     - `10:15:33 — Sardor Olimov: [OGOHLANTIRISH] Boshqa oynaga o'tdi (1/3)`
     - `10:16:10 — Madina Karimova: Oflayn rejimga o'tdi`

### 2.2. Modul 1 Tasklari Ro'yxati

* [x] **TASK-LM.1 (Telemetry Data Models & Schema):**
  - Fayl: `src/entities/proctor/model.ts`
  - Zod sxemalari: `LiveStudentSessionSchema`, `ProctorActionPayloadSchema`, `LiveEventStreamItemSchema`.
  - 🧪 Test: `tests/live-proctoring.test.ts` (4 ta test PASS).
* [x] **TASK-LM.2 (Live Proctoring Store & Mock Stream Service):**
  - Fayl: `src/features/teacher/proctor/liveProctorStore.ts`
  - WebSocket / SSE rejimini simulyatsiya qiluvchi, real vaqtda o'quvchilar javoblari va ogohlantirishlarini qabul qiluvchi reaktiv do'kon.
  - Harakatlar: `grantExtraTime()`, `sendWarning()`, `forceSubmit()`.
  - 🧪 Test: `tests/live-proctoring.test.ts` (6 ta test PASS).
* [x] **TASK-LM.3 (Live Student Grid & Status Card Component):**
  - Fayl: `src/features/teacher/proctor/components/StudentLiveCard.vue`
  - Holat ranglari, pulsatsiyalanuvchi xavf nishonlari, miniatyura navigatsiya progressi.
  - 🧪 Test: `tests/live-proctoring.test.ts` (2 ta test PASS).
* [x] **TASK-LM.4 (Interactive Action Modals & Audit Log Stream):**
  - Fayl: `src/features/teacher/proctor/components/LiveAuditTimeline.vue`
  - Fayl: `src/features/teacher/proctor/components/ProctorActionModal.vue`
  - 🧪 Test: `tests/live-proctoring.test.ts` (3 ta test PASS).
* [x] **TASK-LM.5 (Teacher Live Room View):**
  - Fayl: `src/features/teacher/proctor/TeacherLiveRoomView.vue`
  - Marshrut: `/t/:tenantSlug/teacher/assessments/:assessmentId/live`
  - Filtrlar: "Barchasi", "Xavf ostida", "Oflayn", "Topshirganlar".
  - 🧪 Test: `tests/live-proctoring.test.ts` (3 ta test PASS).
* [x] **TASK-LM.6 (Unit & Integration Testing):**
  - Fayl: `tests/live-proctoring.test.ts`
  - Jami 18 ta unit test to'liq yashil (PASS).

---

## 3. MODUL 6: VILOYAT VA TUMAN XTB SUPER-BOSHQARUV PANELI (REGIONAL OVERSIGHT)

Viloyat va tuman ta'lim boshqarmasi rahbarlari uchun mo'ljallangan yagona dashboard. Barcha maktablardagi ChSB natijalari, qamrov foizi va akademik halollik ko'rsatkichlari bu yerda mujassamlashadi.

### 3.1. Funksional Talablar
1. **Ko'p Bosqichli Hududiy Filtrlash (Hierarchical Region Filter):**
   - Viloyat darajasi -> Tuman/Shahar darajasi -> Maktab darajasi -> Fan va sinf kesimi.
2. **Hududiy Issiq Xarita va Reyting (Regional Performance Heatmap):**
   - 13 ta tuman/shahar reytingi:
     - Ishtirok darajasi (Attendance Rate: 98.4%)
     - O'rtacha ball va sifat ko'rsatkichi (Quality index: 5 va 4 baholar ulushi)
     - Eng yaxshi va eng past natija ko'rsatgan 5 ta maktab
3. **Anomaliyalarni Aniqlash va Shubhali Ko'rsatkichlar Auditi (Integrity Anomaly Detector):**
   - **O'ta tez topshirish anomaliyasi:** 15 ta savolni 3 daqiqadan kam vaqtda 100% yechgan guruhlar (shubhali ko'chirish holatlari).
   - **Bir xil xatolar klasteri:** Sinfdagi o'quvchilarning bir xil noodatiy noto'g'ri javob berishi.
   - **Qoidabuzarliklar statistikasi:** Qaysi maktab yoki sinfda vkladkadan chiqish va nusxa olish urinishlari eng ko'p qayd etilgani.
4. **Vazirlik va Viloyat uchun Tayyor Analitik Hisobotlar (Regional PDF/Excel Reports):**
   - Tumanlar kesimidagi qiyosiy jadval.
   - Davlat ta'lim standartlari (DTS) bo'yicha o'zlashtirish tahlili.
   - Eksport formati: Rasmiy Excel (CSV) va A4 PDF tahlil xulosasi.

### 3.2. Modul 6 Tasklari Ro'yxati

* [x] **TASK-RO.1 (Regional Hierarchy Models & Schemas):**
  - Fayl: `src/entities/regional/model.ts`
  - Zod sxemalari: `DistrictSummarySchema`, `SchoolRankingItemSchema`, `IntegrityAnomalySchema`, `RegionalOverviewStatsSchema`.
  - 🧪 Test: `tests/regional-oversight.test.ts` (5 ta test PASS).
* [x] **TASK-RO.2 (Regional Analytics Repository & Mock Fixtures):**
  - Fayl: `src/mocks/fixtures/regionalFixtures.ts`
  - Fayl: `src/mocks/repositories/MockRegionalRepository.ts`
  - Tumanlar (Urganch, Xiva, Bog'ot, Shovot, Xonqa...) va namuna maktablarining agregat ma'lumotlari.
  - 🧪 Test: `tests/regional-oversight.test.ts` (4 ta test PASS).
* [x] **TASK-RO.3 (Regional Oversight Store):**
  - Fayl: `src/features/regional-oversight/regionalStore.ts`
  - Tumanlar bo'yicha filtrlash, reyting hisoblash, anomaliyalarni saralash logikasi va CSV eksport.
  - 🧪 Test: `tests/regional-oversight.test.ts` (5 ta test PASS).
* [x] **TASK-RO.4 (Interactive Visual Components):**
  - Fayl: `src/features/regional-oversight/components/DistrictHeatmapTable.vue`
  - Fayl: `src/features/regional-oversight/components/AnomalyDetectorCard.vue`
  - Fayl: `src/features/regional-oversight/components/RegionalStatsCards.vue`
  - 🧪 Test: `tests/regional-oversight.test.ts` (3 ta test PASS).
* [x] **TASK-RO.5 (Regional Oversight Main View & Route):**
  - Fayl: `src/features/regional-oversight/RegionalOversightView.vue`
  - Marshrut: `/regional/oversight` va `/t/:tenantSlug/teacher/regional-oversight`
  - PDF/Excel hisobot yuklab olish moduli.
  - 🧪 Test: `tests/regional-oversight.test.ts` (2 ta test PASS).
* [x] **TASK-RO.6 (Unit & Integration Testing):**
  - Fayl: `tests/regional-oversight.test.ts`
  - Jami 19 ta unit test to'liq yashil (PASS).

---

## 4. MA'LUMOTLAR TUZILMASI (DATA CONTRACTS)

```typescript
// 1. Jonli Nazorat Zali (Live Proctoring)
export interface LiveStudentSession {
  rosterRecordId: string;
  studentName: string;
  className: string;
  currentQuestion: number;
  totalQuestions: number;
  answeredCount: number;
  remainingSeconds: number;
  status: 'active' | 'idle' | 'warning' | 'offline' | 'submitted';
  violationsCount: number;
  lastActiveAt: string;
}

export interface ProctorActionPayload {
  studentId: string;
  action: 'grant_time' | 'send_warning' | 'force_submit';
  extraSeconds?: number;
  warningMessage?: string;
  reason: string;
}

// 2. Viloyat Super-Boshqaruv (Regional Oversight)
export interface DistrictOverview {
  id: string;
  name: string; // e.g. "Urganch shahri"
  totalSchools: number;
  totalStudents: number;
  participationRate: number; // e.g. 98.7%
  averageScore: number; // e.g. 33.4 / 40
  qualityPercentage: number; // 4 va 5 baholar (e.g. 74.2%)
  flaggedViolationsCount: number;
}

export interface AnomalyReport {
  id: string;
  schoolName: string;
  className: string;
  subject: string;
  type: 'speed_anomaly' | 'cluster_error' | 'high_violations';
  severity: 'low' | 'medium' | 'high';
  description: string;
  detectedAt: string;
}
```

---

## 5. BOSQICHMA-BOSQICH TDD AMALGA OSHIRISH TARTIBI (STRICT EXECUTION ROADMAP)

> 🔴 **QAT'IY QOIDA:** Hech qachon bir nechta task bir vaqtda qilinmaydi!  
> Har bir task uchun quyidagi **3 qadamlik mikro-tsikl** bajariladi:
> 1. **Implement:** Taskning kodi yoziladi.
> 2. **Unit Test & Verify:** Ushbu task uchun maxsus unit test yoziladi va `npx vitest run` orqali to'liq yashil (PASS) bo'lishi tekshiriladi.
> 3. **Gate Check:** `vue-tsc` va `eslint` orqali 0 xato tekshirilib, faqat shundan keyingina navbatdagi taskka o'tiladi!

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ FAZA A: 1-MODUL (JONLI NAZORAT ZALI — LIVE PROCTORING)                                  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • TASK-LM.1: Telemetry Data Models & Zod Schemas                                       │
│   ↳ 🧪 Test: tests/live-proctoring.test.ts (Schema validation, default values)         │
│                                                                                        │
│ • TASK-LM.2: Live Proctoring Store & State Machine                                     │
│   ↳ 🧪 Test: tests/live-proctoring.test.ts (Telemetry stream, warnings, time extension)│
│                                                                                        │
│ • TASK-LM.3: Student Live Card Component                                               │
│   ↳ 🧪 Test: tests/live-proctoring.test.ts (Component mounting, status badges, timers) │
│                                                                                        │
│ • TASK-LM.4: Action Modals (Time, Warning, Disqualify) & Timeline                      │
│   ↳ 🧪 Test: tests/live-proctoring.test.ts (Modal triggers, event payload dispatch)    │
│                                                                                        │
│ • TASK-LM.5: Teacher Live Room View & Route Integration                                │
│   ↳ 🧪 Test: tests/live-proctoring.test.ts (Filtering, search, live view integration)  │
│                                                                                        │
│ • 🏁 Faza A Yakuniy Sifat Nazorati (Quality Gate):                                      │
│   ↳ npx vitest run -> npm run typecheck -> npm run lint -> Git Commit & Push           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ FAZA B: 6-MODUL (VILOYAT VA TUMAN SUPER-BOSHQARUV PANELI)                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • TASK-RO.1: Regional Hierarchy Data Models & Zod Schemas                              │
│   ↳ 🧪 Test: tests/regional-oversight.test.ts (District & school metrics validation)   │
│                                                                                        │
│ • TASK-RO.2: Regional Mock Repository & 13 Districts Fixtures                          │
│   ↳ 🧪 Test: tests/regional-oversight.test.ts (Data retrieval, aggregation math)       │
│                                                                                        │
│ • TASK-RO.3: Regional Oversight Store & Anomaly Detection Engine                       │
│   ↳ 🧪 Test: tests/regional-oversight.test.ts (Sorting, ranking, anomaly flagging)     │
│                                                                                        │
│ • TASK-RO.4: DistrictHeatmapTable & AnomalyDetectorCard Components                     │
│   ↳ 🧪 Test: tests/regional-oversight.test.ts (Component render, heat indicators)     │
│                                                                                        │
│ • TASK-RO.5: Regional Oversight Main View & Export Engine (PDF/CSV)                   │
│   ↳ 🧪 Test: tests/regional-oversight.test.ts (View mounting, export handlers)         │
│                                                                                        │
│ • 🏁 Faza B Yakuniy Sifat Nazorati (Quality Gate):                                      │
│   ↳ npx vitest run -> npm run typecheck -> npm run lint -> npm run build -> Push      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. SIFAT VA XAVFSIZLIK CHEGARALARI (ACCEPTANCE CRITERIA)
- **Zero Regression:** Mavjud 92 ta testning birontasi buzilmasligi shart (yangi testlar bilan birga testlar soni 110+ taga yetadi).
- **Zero Secrets Invariant:** Talabalar yoki o'qituvchilar interfeysida kalitlar (javoblar kaliti) oshkor etilmaydi.
- **Responsiveness:** Jonli zaldagi kartochkalar mobil, planshet va katta ekranli monitorlarda qulay ko'rinadi.
- **Strict Quality Gates:** `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` 100% yashil bo'lishi shart.

---

## 7. YAKUNIY AMALGA OSHIRISH AUDITI (COMPLETION AUDIT REPORT)

> **Holati:** ✅ 100% TO'LIQ BAJARILDI VA TESTLANDI  
> **Jami testlar:** 14 ta test fayli, 129 ta test — 100% PASS  
> **Sifat ko'rsatkichlari:** `vue-tsc` (0 xato), `eslint` (0 ogohlantirish), `vite build` (muvaffaqiyatli)  
> **Git Commitlar:**  
> - `3f48412` — `feat(proctor): complete Phase A Live Proctoring Room with telemetry grid, audit timeline, action modals, and 18 tests`  
> - `bee0282` — `feat(regional): complete Phase B Regional Oversight with 13 districts heatmap, anomaly detector, CSV/PDF export, and 19 tests`  
> - `f03bad1` — `chore: normalize line endings`  
> **GitHub Repozitoriyasi:** [https://github.com/Valijon21/CHSB_APP.git](https://github.com/Valijon21/CHSB_APP.git) (`main` tarmog'ida)

