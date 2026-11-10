# 🎓 CHSB Platform — Multi-School SaaS & Assessment Engine V2

[![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?style=flat&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-5.9_Strict-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-228%20passed%20(100%25)-green?style=flat&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Accessibility](https://img.shields.io/badge/WCAG-2.1_AA_Compliant-success?style=flat)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![UX Audit](https://img.shields.io/badge/UX_Audit-PASS_(0_issues)-success?style=flat)]()
[![Status](https://img.shields.io/badge/Status-Production_Ready_Frontend-success?style=flat)]()

O'zbekiston Respublikasi umumta'lim va ixtisoslashtirilgan maktablarida choraklik baholash (CHSB) jarayonlarini to'liq raqamlashtirish uchun mo'ljallangan korporativ darajadagi **Multi-Tenant Roster-Based Assessment & School Management SaaS** platformasi.

---

## 🌟 Asosiy Imkoniyatlar va Arxitektura Modullari

### 1. 🏢 Ko'p Maktablar Katalogi (Multi-School & Tenant SaaS)
* **Dinamik maktablar tarmog'i (`/schools`):**
  - Viloyat va 13 ta tuman (Urganch sh., Xiva, Shovot, Gurlan, Yangibozor va h.k.) bo'yicha maktablarni saralash va qidirish.
  - Yangi maktab ochish (`CreateSchoolModal`): Nom, kod, tuman, tur (umumta'lim, ixtisoslashtirilgan, akademik litsey, xususiy), direktor va aloqa rekvizitlari.
  - Har bir maktab kartochkasidan to'g'ridan-to'g'ri o'sha maktabning alohida tenant muhitiga o'tish (`Maktabga kirish ➔`).
  - Chap menyudagi barcha sahifalardan maktablar katalogiga o'tish imkonini beruvchi maktab almashtirgich (School Switcher).

### 2. 👥 Foydalanuvchilar Markazi: O'qituvchi va O'quvchilar Boshqaruvi
* **O'qituvchilar boshqaruvi (`/t/:tenantSlug/admin`):**
  - O'qituvchilar tarkibi, ularning fani, malaka toifasi (oliy, birinchi, ikkinchi, mutaxassis) va dars beradigan sinflari.
  - Yangi o'qituvchi qo'shish modali (`CreateTeacherModal`) va o'qituvchilar jadvali (`TeacherRosterTable`).
* **Sinflar boshqaruvi (`/t/:tenantSlug/teacher/classes`):**
  - Barcha sinflar katalogi, parallel bo'yicha filtrlar (1-sinfdan 11-sinfgacha), smena bo'yicha filtr (1-smena / 2-smena) va qidiruv.
  - Yangi sinf ochish modali (`CreateClassModal`): Sinf nomi (masalan `8-B`), parallel, smena, o'quv yili, yo'nalish va sinf rahbarini biriktirish (Jonli nishon namunasi bilan).
* **O'quvchilar boshqaruvi & Roster (`/t/:tenantSlug/teacher/students`):**
  - **Yakka tartibda qo'shish:** Ism, familiya, sinf, tug'ilgan sana va avtomatik beriladigan Roster kodi (`STU-XXXX`).
  - **Ommaviy Excel/CSV Import:** Excel jadvalidan butun bir sinf ro'yxatini to'g'ridan-to'g'ri nusxalab tashlash (`Ctrl+V`). Xatolarni oldindan ko'rsatish (preview table) va 1 soniyada butun sinfni ro'yxatga olish.

### 3. 📝 15-Savolli CHSB Imtihon Dvigateli & O'quvchi Portali
* **Roster-Based xavfsiz qabul:**
  - Ochiq ro'yxatdan o'tish yo'q; o'quvchilar rasmiy Roster kodi (`STU-1101`) orqali kiradi.
  - Imtihonga kirishdan oldin shaxsni tasdiqlash darvozasi (Verification Gate).
* **Imtihon jarayoni:**
  - 15 ta savol (1-10 savollar 2.5 ball, 11-15 savollar 3.0 ball — jami 40 ball).
  - 40 daqiqalik teskari hisoblagich (Timer) va 5 daqiqalik ogohlantirish.
  - Javoblar qoralamasini avtomatik lokal saqlash (`localStorage` draft recovery).
  - Topshirilgach o'quvchiga unikal demo hash (`0x...`) va rasmiy tasdiq kvitansiyasi (`SubmissionReceipt`).
  - **Zero Answer Key Invariant:** Frontend kodida hech qanday javob kaliti saqlanmaydi.

### 4. 🔴 Jonli Nazorat (Live Proctoring Room) & Anti-Cheat Tizimi
* **Jonli nazorat zali (`/teacher/assessments/:id/live`):**
  - Real vaqtda o'quvchilar holatini monitoring qilish (Faol, Diqqat, Xavf ostida, Topshirgan).
  - Qoidabuzarliklarni avtomatik ushlab qolish (To'liq ekrandan chiqish, tab almashtirish, fokus yo'qolishi, IP manzil o'zgarishi).
  - Audit xronologiyasi (Audit Timeline) va o'quvchiga ogohlantirish berish / imtihonni to'xtatish.

### 5. 🏛️ Viloyat Boshqarmasi Monitoring Portali (Regional Oversight)
* **Hududiy monitoring (`/teacher/regional-oversight`):**
  - Viloyatning barcha 13 ta tumani kesimida CHSB topshirish dinamikasi va monitoringi.
  - KPI metrikalari: O'rtacha o'zlashtirish, qatnashish foizi, qoidabuzarliklar indeksi va maktablar reytingi.

### 6. 📊 eMaktab 2 Tomonlama Sinxronizatsiyasi & Eksport
* **eMaktab integratsiyasi (`/teacher/assessments/:id/emaktab-sync`):**
  - Excel/Jurnal nusxasini tashlash (Clipboard Parsing).
  - Ism va familiyalarni noaniq moslashtirish (Fuzzy Name Reconciliation).
  - 100% vazirlik mezonlari bo'yicha 5 ballik bahoga o'tkazish (Grade Thresholds).
  - Tayyor jurnaldan nusxa olib, eMaktab tizimiga 1 ta bosishda joylash.

### 7. 🛡️ Tizim Xatoliklari Telemetriyasi & Log Konsoli (10 000 Log Sig'imi)
* **Xatolar Konsoli (`/t/:tenantSlug/admin?tab=logs`):**
  - Asinxron **IndexedDB** asosidagi 10 000 log sig'imli xotira drayveri (`LogStorageEngine`).
  - Global tutqichlar: `app.config.errorHandler` (Vue render va event xatolari), `unhandledrejection` va 404 router interceptor.
  - Tenant Admin panelida loglarni daraja (ERROR, WARN, INFO, FATAL) va kategoriya bo'yicha filtrlash, qidirish, JSON nusxalash va yuklab olish.

### 8. 🎨 WCAG 2.1 AA va Anti-Slop Dizayn
* **Dizayn mukammalligi:**
  - Taqiqlangan AI binafsha ranglari 100% bartaraf etilgan (yagona Teal/Emerald/Indigo brendi).
  - Avtomatlashtirilgan UX auditi: `python .agents/skills/frontend-design/scripts/ux_audit.py src` -> **STATUS: PASS (0 issues)**.
  - Barcha formalar va selektlar ekranni o'qish dasturlari uchun `aria-label` bilan to'liq jihozlangan.
  - To'liq Dark Mode (qorong'u rejim) va mobil touch targetlar (>= 40-44px).

---

## 🛠️ Texnologiyalar Steki

| Qatlam | Texnologiya | Tavsif |
| :--- | :--- | :--- |
| **Framework** | Vue 3.5+ (Composition API, `<script setup>`) | Reaktiv yadro |
| **Language** | TypeScript 5.9+ (Strict Mode) | To'liq typesafe arxitektura |
| **State** | Pinia 2.3+ | Modulli do'konlar (organization, teacher, tenant, regional) |
| **Routing** | Vue Router 4.5+ | URL tenant izolyatsiyasi va 404 nazorati |
| **Validation** | Zod 3.24+ | Barcha formalar va API ma'lumotlari uchun sxemalar |
| **Styling** | Tailwind CSS v4 | Zamonaviy CSS-first utility dizayn |
| **Storage** | Native IndexedDB API | 10 000 log sig'imli asinxron telemetriya drayveri |
| **Testing** | Vitest 3.2+ & Vue Test Utils 2.4+ | 40 ta test fayl, 228 ta unit/integ test |
| **Quality** | ESLint 9+ & vue-tsc (Strict) | Statik tahlil va kod sifati |

---

## 🚀 Loyihani Ishga Tushirish

### Talablar
- Node.js: `v20.x` yoki `v22.x+`
- npm: `v10.x+`

### O'rnatish va Run qilish
```bash
# 1. Repozitoriyani klonlash
git clone https://github.com/Valijon21/CHSB_APP.git
cd CHSB_APP

# 2. Bog'liqliklarni o'rnatish
npm install

# 3. Rivojlanish rejimida ishga tushirish (Dev Server)
npm run dev
```

Server ishga tushgach, brauzerda quyidagi manzillarga o'tishingiz mumkin:

| Sahifa Nomi | URL Manzili | Tavsif |
| :--- | :--- | :--- |
| **🏢 Maktablar Katalogi** | [http://localhost:5173/schools](http://localhost:5173/schools) | 13 ta tuman maktablari va yangi maktab ochish |
| **🏫 Sinflar Boshqaruvi** | [http://localhost:5173/t/al-xorazmiy/teacher/classes](http://localhost:5173/t/al-xorazmiy/teacher/classes) | Sinflar parallel filtri va yangi sinf ochish |
| **👥 O'quvchilar & Import** | [http://localhost:5173/t/al-xorazmiy/teacher/students](http://localhost:5173/t/al-xorazmiy/teacher/students) | O'quvchi kiritish va ommaviy Excel import |
| **⚙️ Tenant Admin & Loglar** | [http://localhost:5173/t/al-xorazmiy/admin](http://localhost:5173/t/al-xorazmiy/admin) | O'qituvchilar boshqaruvi va 10k xatolar konsoli |
| **🔴 Jonli Imtihon Nazorati** | [http://localhost:5173/t/al-xorazmiy/teacher/assessments/asm-demo-01/live](http://localhost:5173/t/al-xorazmiy/teacher/assessments/asm-demo-01/live) | Anti-cheat va real vaqtli proctoring |
| **🏛️ Viloyat Boshqarmasi** | [http://localhost:5173/t/al-xorazmiy/teacher/regional-oversight](http://localhost:5173/t/al-xorazmiy/teacher/regional-oversight) | 13 ta tuman hududiy monitoringi |
| **📊 eMaktab Sinxronizatsiya** | [http://localhost:5173/t/al-xorazmiy/teacher/assessments/asm-demo-01/emaktab-sync](http://localhost:5173/t/al-xorazmiy/teacher/assessments/asm-demo-01/emaktab-sync) | 5 ballik baholash va jurnal nusxasi |
| **📝 O'quvchi Portali** | [http://localhost:5173/t/al-xorazmiy/student](http://localhost:5173/t/al-xorazmiy/student) | Roster kod orqali kirish (Masalan: `STU-1101`) |

---

## 🧪 Sifat Nazorati va Testlar

Loyiha barcha qat'iy ishlab chiqarish sifat filtrlaridan muvaffaqiyatli o'tgan:

```bash
# 1. TypeScript Strict Typecheck (0 xato)
npm run typecheck

# 2. ESLint tahlili (0 ogohlantirish)
npm run lint

# 3. Vitest to'liq test to'plami (40 ta fayl, 228 ta test 100% PASS)
npm run test

# 4. Production build kompilyatsiyasi
npm run build
```

---

## 📁 Loyiha Hujjatlari Katalogi

* [docs/MULTI_SCHOOL_AND_USER_MANAGEMENT_PLAN.md](docs/MULTI_SCHOOL_AND_USER_MANAGEMENT_PLAN.md) — Ko'p maktabli SaaS tizimi va foydalanuvchilar markazi hujjati.
* [docs/CLASS_MANAGEMENT_AND_CREATION_PLAN.md](docs/CLASS_MANAGEMENT_AND_CREATION_PLAN.md) — Sinflarni boshqarish va yangi sinf ochish rejasi.
* [docs/ERROR_LOGGING_AND_MONITORING_PLAN.md](docs/ERROR_LOGGING_AND_MONITORING_PLAN.md) — 10 000 log sig'imli telemetriya va xatolar konsoli rejasi.
* [docs/BACKEND_LOG_SPEC.md](docs/BACKEND_LOG_SPEC.md) — Kelajakdagi backend uchun aylanma log fayllar spetsifikatsiyasi.
* [docs/LIVE_MONITORING_AND_REGIONAL_OVERSIGHT_PLAN.md](docs/LIVE_MONITORING_AND_REGIONAL_OVERSIGHT_PLAN.md) — Jonli proctoring va viloyat monitoringi rejasi.
