# 🎓 CHSB Platform — Enterprise Multi-Tenant Assessment & Pedagogical AI SaaS

[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL 18](https://img.shields.io/badge/PostgreSQL-18-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.4+-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?style=flat&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-5.9_Strict-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-334%20passed%20(100%25)-green?style=flat&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Pytest](https://img.shields.io/badge/Pytest-13%20passed%20(100%25)-green?style=flat&logo=pytest&logoColor=white)](https://docs.pytest.org/)
[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG-2.1_AA_Compliant-success?style=flat)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Zero Mocks](https://img.shields.io/badge/Frontend_Mocks-Eliminated-success?style=flat)]()

O'zbekiston Respublikasi umumta'lim va ixtisoslashtirilgan maktablarida choraklik baholash (**CHSB**) jarayonlarini to'liq raqamlashtirish, pedagogik tahlillarni sun'iy intellekt (**Google Gemini AI**) bilan avtomatlashtirish hamda maktab jurnallarini **eMaktab** tizimi bilan sinxronizatsiya qilishga mo'ljallangan korporativ darajadagi **Multi-Tenant Roster-Based Assessment & School Intelligence Platform**.

---

## 🏛️ Tizim Arxitekturasi (Full-Stack Architecture)

Loyiha zamonaviy mikroxizmatlarga mos, bo'lingan va xavfsiz arxitekturada qurilgan:

```mermaid
flowchart TD
    subgraph Client ["Frontend Qatlami (Vue 3 + Vite + Tailwind 4)"]
        UI["Vue 3 SPA (Composition API)"]
        Pinia["Pinia 2.3+ Store (Auth, Classes, Students, Live)"]
        HTTP["HTTP Client (JWT Bearer Interceptor & Error Telemetry)"]
        UI --> Pinia
        Pinia --> HTTP
    end

    subgraph Server ["Backend Qatlami (Python 3.11 + FastAPI)"]
        API["FastAPI REST API (/api/v1)"]
        Auth["JWT Auth (HS256) & Bcrypt Password Verifier"]
        AI["Pedagogical Engine (Google Gemini AI)"]
        PrismaPy["Prisma Client Python (Async/Await)"]
        
        API --> Auth
        API --> AI
        API --> PrismaPy
    end

    subgraph Data ["Ma'lumotlar Qatlami"]
        PG[("PostgreSQL 18 (chsb_db)")]
        PrismaSchema["Prisma Schema Engine (10 Relational Models)"]
        PrismaPy --> PG
        PrismaSchema --> PG
    end

    HTTP -->|REST JSON over HTTPS| API
```

---

## 🌟 Asosiy Imkoniyatlar va Modullar

### 1. 🏢 Multi-Tenant Maktablar Katalogi & Izolyatsiya
* **Ko'p maktabli SaaS arxitekturasi:** Har bir maktab alohida tenant (`/t/:tenantSlug`) sifatida to'liq izolyatsiyalangan ma'lumotlar bazasiga ega.
* **Maktablar boshqaruvi (`/schools`):** Viloyat va 13 ta tuman maktablarini saralash, qidirish, yangi maktab ochish va maktablar o'rtasida 1-klikda almashish (School Switcher).

### 2. 🔐 Haqiqiy Autentifikatsiya va RBAC Rollar Tizimi
* **Bcrypt xesh shifrlash:** Parollar backendda qaytarib bo'lmas `bcrypt` algoritmi bilan xavfsiz saqlanadi.
* **JWT Access Tokenlar:** Standart `HS256` tokenlari, 24 soatlik amal qilish muddati, avtomatik `Authorization: Bearer <token>` interceptori.
* **Rollar darajasi:**
  * `TEACHER` — O'qituvchi boshqaruv paneli, sinflar, baholar, hisobotlar.
  * `SCHOOL_ADMIN` — Maktab direktori/o'rinbosari, o'qituvchilar va maktab sozlamalari.
  * `REGIONAL_INSPECTOR` — Viloyat MMTO boshqarmasi nazorati.
  * `STUDENT` — Imtihon topshiruvchi o'quvchi.

### 3. 👥 Foydalanuvchilar Markazi & Excel Ommaviy Import
* **O'qituvchilar tarkibi (`/admin`):** Oliy, birinchi, ikkinchi toifali va mutaxassis o'qituvchilar hisobi.
* **Sinflar boshqaruvi (`/teacher/classes`):** 1-11 parallel, smenalar (1-smena / 2-smena), sinf rahbarini biriktirish.
* **O'quvchilar boshqaruvi (`/teacher/students`):** 
  * Yakka tartibda ro'yxatga olish;
  * **Ommaviy Excel/CSV Clipboard Import:** Excel jadvalidan butun bir sinf ro'yxatini to'g'ridan-to'g'ri nusxalab tashlash (`Ctrl+V`), jadval preview va 1 soniyada butun sinfni ro'yxatga olish.

### 4. 📝 15-Savolli CHSB Imtihon Dvigateli & O'quvchi Portali
* **Roster-Based xavfsiz qabul:** Ochiq ro'yxatdan o'tish yo'q; o'quvchi o'zining shaxsiy Roster kodi (`STU-1101`) orqali tasdiqlash darvozasi (Verification Gate)dan o'tadi.
* **Imtihon qoidalari:** 15 ta test savoli (1-10 savollar 2.5 ball, 11-15 savollar 3.0 ball — jami 40 ball), 40 daqiqalik taymer, javoblar qoralamasini avtomatik saqlash.
* **Zero Answer Key Invariant:** Frontend kodida hech qanday javob kaliti saqlanmaydi; baholash faqat FastAPI backend tomonidan PostgreSQL da amalga oshiriladi.
* **Rasmiy Kvitansiya (`SubmissionReceipt`):** Imtihon topshirilgach, unikal chek raqami (`RCP-XXXXXXXX`) generatsiya qilinadi.

### 5. 🧠 Google Gemini AI Pedagogik Diagnostikasi
* **Sinf Diagnostikasi (`/api/v1/ai/class-diagnosis`):** Sinfning o'rtacha balli, sifat ko'rsatkichi va kognitiv darajalari (Bilish, Qo'llash, Mulohaza) bo'yicha sun'iy intellekt xulosasi va o'qituvchi uchun metodik maslahatlar.
* **O'quvchi Remediatatsiyasi (`/api/v1/ai/student-remediation`):** Past baho olgan o'quvchilar uchun bo'shliqlarni to'ldirishga qaratilgan 5 kunlik individual o'quv rejasi.

### 6. 📊 Chuqur Sinf Tahlili (Class Intelligence Workspace)
* **Ballar taqsimoti gistogrammasi:** 4 ta baho toifasi (5-A'lo, 4-Yaxshi, 3-Qoniqarli, 2-Qoniqarsiz) bo'yicha vizual ko'rsatkich.
* **Honor Roll (Shon-sharaf shohsupasi):** Sinfdagi eng yuqori natija ko'rsatgan 3 nafar o'quvchi uchun oltin, kumush va bronza medalli shohsupa hamda e'tibor talab o'quvchilar bloki.
* **Eksport:** UTF-8 BOM bilan jihozlangan CSV eksport (Excelda o'zbekcha harflar buzilmaydi).

### 7. 🔴 Jonli Nazorat Zali (Live Proctoring Room) & Anti-Cheat
* Real vaqtli o'quvchilar monitoringi (Faol, Diqqat, Xavf ostida, Topshirgan).
* Qoidabuzarliklarni avtomatik ushlab qolish: to'liq ekrandan chiqish, yangi tab ochish, fokus yo'qolishi, IP o'zgarishi.
* Audit xronologiyasi (Audit Timeline) va o'quvchiga ogohlantirish berish / imtihonni to'xtatish.

### 8. 🏛️ Viloyat Boshqarmasi Monitoring Portali (Regional Oversight)
* Viloyatning barcha 13 ta tumani bo'yicha CHSB topshirish dinamikasi va monitoringi.
* Hududiy KPI ko'rsatkichlari, maktablar reytingi va anomaliyalar tahlili.

### 9. 📋 eMaktab 2-Tomonlama Sinxronizatsiyasi
* eMaktab elektron jurnali bilan 100% integratsiya: ism-familiyalarni noaniq moslashtirish (Fuzzy Name Reconciliation).
* Vazirlik mezonlari bo'yicha 5 ballik bahoga avtomat o'tkazish va jurnalga 1-klikda joylash.

### 10. 🛡️ 10 000 Log Sig'imli Asinxron Telemetriya Konsoli
* **IndexedDB asosidagi xotira drayveri:** Global `app.config.errorHandler`, `unhandledrejection` va 404 router xatolarini ushlab qoluvchi 10 000 log sig'imli ichki konsol.

---

## 🛠️ Texnologiyalar Steki

| Qatlam | Texnologiya | Tavsif |
| :--- | :--- | :--- |
| **Database** | PostgreSQL 18 | Eng so'nggi relatsion ma'lumotlar bazasi |
| **ORM** | Prisma 6.4+ / Prisma Client Python | Deklarativ sxema, tiplangan migratsiyalar |
| **Backend** | Python 3.11+, FastAPI, Uvicorn | Yuqori tezlikdagi asinxron REST API |
| **Security** | Bcrypt, Python-Jose (JWT HS256) | Korporativ autentifikatsiya va xavfsizlik |
| **AI Engine** | Google Gemini API (Interactions/Generate) | Pedagogik diagnostika va tavsiyalar |
| **Frontend** | Vue 3.5+ (Composition API, `<script setup>`) | Reaktiv komponentlar |
| **Language** | TypeScript 5.9+ (Strict Mode) | To'liq tiplangan frontend arxitekturasi |
| **State** | Pinia 2.3+ | Modulli do'konlar (auth, teacher, admission, live...) |
| **Validation** | Zod 3.24+ & Pydantic v2 | Frontend va backendda ikki tomonlama tekshiruv |
| **Styling** | Tailwind CSS v4 | CSS-first zamonaviy utility dizayn |
| **Testing** | Vitest 3.2+ (Frontend) & Pytest 9+ (Backend) | 347 ta to'liq yashil avtomatlashtirilgan testlar |

---

## 🚀 Loyihani Ishga Tushirish (Quick Start in < 5 min)

### Tizim Talablari
* **Node.js:** `v20.x` yoki `v22.x+` (npm `v10.x+`)
* **Python:** `3.11.x`
* **PostgreSQL:** `v16+` yoki `v18+` (lokal yoki bulutli Neon/Supabase)

---

### 1-Qadam: Repozitoriyani Klonlash
```bash
git clone https://github.com/Valijon21/CHSB_APP.git
cd CHSB_APP
```

---

### 2-Qadam: Ma'lumotlar Bazasi va Prisma ORM Sozlash
Loyiha ildizida `.env` faylini yarating yoki mavjudini sozlang:
```ini
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chsb_db?schema=public"
JWT_SECRET="chsb-super-secure-jwt-key-2026-production"
GEMINI_API_KEY="" # Ixtiyoriy, AI diagnostika uchun
```

Prisma jadvallarini PostgreSQL ga o'tkazish va bazani to'ldirish (Seed):
```bash
# 1. npm paketlarini o'rnatish
npm install

# 2. Prisma orqali PostgreSQL 18 da 10 ta jadvalni yaratish
npx prisma db push

# 3. Bazaga real maktablar, sinflar, o'quvchilar va foydalanuvchilarni to'ldirish
npx tsx prisma/seed.ts
```

> **Maslahat:** Bazadagi ma'lumotlarni brauzerda vizual ko'rish va boshqarish uchun `npx prisma studio` buyrug'ini ishlatishingiz mumkin (ochiladi: `http://localhost:5555`).

---

### 3-Qadam: FastAPI Backendni Ishga Tushirish
```bash
# Python bog'liqliklarini o'rnatish
pip install -r backend/requirements.txt

# Python Prisma mijozini generatsiya qilish
python -m prisma generate

# Backend serverni ishga tushirish (port 8000)
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
* Backend API: [http://127.0.0.1:8000](http://127.0.0.1:8000)
* Swagger / OpenAPI Hujjatlari: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* Health Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

### 4-Qadam: Vue 3 Frontendni Ishga Tushirish
Ildizdan (root) yoki `frontend/` ichidan:
```bash
# Ildiz katalogidan:
npm run dev
# yoki
npm run dev:frontend

# Yoki to'g'ridan-to'g'ri frontend papkasidan:
cd frontend && npm run dev
```
* Frontend Ilova: [http://localhost:5173](http://localhost:5173)

---

## 🔑 Sinov Uchun Hisoblar (Demo Accounts in PostgreSQL)

Barcha hisoblar bazada `bcrypt` orqali shifrlangan va darhol kirishga tayyor:

| Rol | Foydalanuvchi nomi | Parol | To'liq Ism |
| :--- | :--- | :--- | :--- |
| **Fan O'qituvchisi** | `teacher_ax` | `Secret123!` | Dilmurod Ustoz (Informatika) |
| **Maktab Direktori** | `admin_ax` | `Secret123!` | Shavkat Boboyev (Al-Xorazmiy IT-maktab) |
| **Viloyat Nazoratchisi**| `inspector_tashkent` | `Secret123!` | Toshkent shahar MMTO Boshqarmasi |
| **O'quvchi Imtihon Kirdi**| *(Roster Kod)* | `STU-1101` | Alisher Zokirov (11-A sinf) |

---

## 🧪 Sifat Nazorati va Testlar (100% Yashil)

Loyihaning har bir komponenti mustahkam avtomatlashtirilgan testlar bilan qoplangan:

```bash
# 1. Backend Pytest API Sinovlari (13/13 test PASS)
python -m pytest backend/tests/test_api.py -v

# 2. Frontend Vitest To'liq Testlar (61 ta fayl, 334/334 test PASS)
npm test

# 3. TypeScript Qat'iy Tip Tekshiruvi (0 xato)
npm run typecheck

# 4. ESLint Kod Standartlari (0 xato, 0 ogohlantirish)
npm run lint

# 5. Production Build Kompilyatsiyasi (dist/ yaratilishi)
npm run build
```

---

## 🐳 Docker & Ishlab Chiqarish (Deployment)

Loyiha yagona Docker konteynerida yoki alohida mikroxizmatlarda ishlashga to'liq tayyor:

### Docker Compose orqali 1-klikda ishga tushirish:
```bash
docker compose up -d
```
Tizim avtomatik ravishda:
1. PostgreSQL 18 ma'lumotlar bazasini;
2. FastAPI Backend xizmatini;
3. Vue 3 Frontendni Nginx orqali bitta xavfsiz tarmoqda ko'taradi.

---

## 📂 Loyiha Tuzilishi (Project Structure)

```
CHSB_APP/
├── backend/                       # Python FastAPI Backend
│   ├── app/
│   │   ├── api/v1/endpoints/     # REST Endpoints (auth, classes, students, ai...)
│   │   ├── core/                 # Xavfsizlik, JWT, sozlamalar (config, security)
│   │   ├── db/                   # Prisma Client ulanishi va sessiyalar
│   │   ├── schemas/              # Pydantic v2 ma'lumotlar modellari
│   │   └── main.py               # FastAPI ilovasi va CORS sozlamalari
│   ├── tests/                    # Pytest backend test to'plami
│   └── requirements.txt          # Python bog'liqliklari
├── frontend/                      # Vue 3 Frontend Ilovasi (Alohida va Mustaqil)
│   ├── src/                      # Feature-Sliced Design (app, entities, features, shared)
│   │   ├── app/                  # Router, provayderlar va global sozlamalar
│   │   ├── entities/             # Domen modellari va Zod sxemalari
│   │   ├── features/             # Biznes mantiq (auth, admission, teacher, live...)
│   │   └── shared/               # HTTP Client, umumiy UI komponentlar, xizmatlar
│   ├── public/                   # Statik fayllar (favicon, rasmlar)
│   ├── tests/                    # Vitest frontend unit va integratsiya testlari (62 ta fayl)
│   ├── index.html                # Single Page Application HTML kirish nuqtasi
│   ├── vite.config.ts            # Vite va Vitest konfiguratsiyasi
│   ├── tsconfig.json             # TypeScript konfiguratsiyalari
│   ├── eslint.config.js          # ESLint kod sifati qoidalari
│   └── package.json              # Frontend kutubxonalari va skriptlari
├── prisma/                        # Yagona Relyatsion Sxema (Shared DB Layer)
│   ├── schema.prisma             # PostgreSQL deklarativ 10-model sxemasi
│   └── seed.ts                   # Real ma'lumotlar seeder skripti
├── docs/                          # Loyiha arxitekturasi va spetsifikatsiyalari (38+ hujjat)
├── package.json                   # Universal Root Monorepo Orchestrator skriptlari
├── README.md                      # Loyihaning to'liq bosh qo'llanmasi
└── .gitignore                     # Git istisnolar ro'yxati
```

---

## 📄 Litsenziya

Ushbu loyiha O'zbekiston Respublikasi ta'lim sohasini raqamlashtirish tashabbuslari doirasida ochiq korporativ standartlar asosida ishlab chiqilgan.
