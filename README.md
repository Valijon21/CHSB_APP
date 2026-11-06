# CHSB Platform — Frontend V2 Modernizatsiyasi

[![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?style=flat&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-5.9_Strict-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/Vitest-55%20passed%20(100%25)-green?style=flat&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Status](https://img.shields.io/badge/Status-Completed-success?style=flat)]()

Ushbu loyiha O'zbekiston maktablarida choraklik baholash (CHSB) jarayonlarini raqamlashtirish uchun mo'ljallangan korporativ darajadagi **Multi-Tenant Roster-Based Assessment Platform** frontend tizimidir.

Eski bitta statik fayldan iborat `CHSB_11_SINF.html` dasturi to'liq qayta arxitektura qilinib, **Vue 3 (Composition API) + TypeScript Strict + Vite + Tailwind CSS 4 + Pinia + Zod** asosidagi zamonaviy Single Page Application (SPA) darajasiga ko'chirildi.

---

## 🌟 Asosiy Imkoniyatlar va Arxitektura

1. **Multi-Tenant Izolyatsiyasi:**
   - URL orqali boshqariluvchi routing: `/t/:tenantSlug/...`.
   - Ikkita to'liq izolyatsiyalangan sintetik tenant: `al-xorazmiy` va `temurbeklar-maktabi`.
   - Cross-tenant o'qish va ma'lumot aralashib ketishiga qarshi qat'iy kafolat.

2. **Roster-Based O'quvchi Qabuli:**
   - Ochiq ro'yxatdan o'tish (Open registration) taqiqlangan; o'quvchilar rasmiy Roster kodi (`STU-1101`) orqali kiradi.
   - Noto'g'ri kodlar uchun maxfiylikni himoyalovchi umumiy xatolik xabarlari.
   - Imtihonga kirishdan oldin shaxsni tasdiqlash darvozasi (Verification Gate).

3. **15-Savolli CHSB Imtihon Dvigateli (11-Sinf Informatika):**
   - 15 ta savol (1-10 savollar 2.5 ball, 11-15 savollar 3.0 ball — jami 40 ball).
   - 40 daqiqalik hisoblagich (Demo Countdown Timer) va 5 daqiqalik ogohlantirish.
   - Matn, rasm, jadval va kod bloklarini xavfsiz render qiluvchi `QuestionBlockRenderer`.
   - Javoblar qoralamasini avtomatik lokal saqlash (`localStorage` draft recovery).

4. **Kvitansiya va Natijalar Taqdimoti:**
   - Topshirilgach o'quvchiga unikal demo hash (`0x...`) va rasmiy tasdiq kvitansiyasi (`SubmissionReceipt`) beriladi.
   - Natijalar ko'rinishi va o'qituvchi tekshiruviga yuborilganlik holati.

5. **O'qituvchi va Ma'mur Portali (Teacher & Admin):**
   - Sinflar (11-A, 11-B va h.k.) bo'yicha dinamik filtrlash.
   - O'quvchilar ro'yxati, topshirish holatlari va o'rtacha ball tahlili.

6. **Xavfsizlik Kafolati (Zero Answer Key Invariant):**
   - Frontend paketida va mijoz modellarida hech qanday maxfiy javob kaliti saqlanmaydi.

7. **Kelajakdagi Django Integratsiyasiga 100% Tayyor:**
   - To'liq **Typed Repository Pattern** asosida qurilgan. Kelgusida backend ulanganda Store yoki View kodlarini o'zgartirmasdan faqat `api` qatlamida 1 qatorlik almashtirish kifoya.

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

Brauzerda quyidagi manzillarni oching:
- **O'quvchi kirish portali (Al-Xorazmiy):** [http://localhost:5173/t/al-xorazmiy/student](http://localhost:5173/t/al-xorazmiy/student)  
  *(Demo kod: `STU-1101`)*
- **O'quvchi kirish portali (Temurbeklar):** [http://localhost:5173/t/temurbeklar-maktabi/student](http://localhost:5173/t/temurbeklar-maktabi/student)  
  *(Demo kod: `TM-201`)*
- **O'qituvchi Boshqaruv Kabineti (Dashboard):** [http://localhost:5173/t/al-xorazmiy/teacher/dashboard](http://localhost:5173/t/al-xorazmiy/teacher/dashboard)
- **Sinflar Boshqaruvi:** [http://localhost:5173/t/al-xorazmiy/teacher/classes](http://localhost:5173/t/al-xorazmiy/teacher/classes)
- **O'quvchilar Boshqaruvi (Roster):** [http://localhost:5173/t/al-xorazmiy/teacher/students](http://localhost:5173/t/al-xorazmiy/teacher/students)
- **Baholashlar Katalogi:** [http://localhost:5173/t/al-xorazmiy/teacher/assessments](http://localhost:5173/t/al-xorazmiy/teacher/assessments)
- **Natijalar Jadvali & CSV Export:** [http://localhost:5173/t/al-xorazmiy/teacher/results](http://localhost:5173/t/al-xorazmiy/teacher/results)
- **Pedagogik Tahlillar (Analytics):** [http://localhost:5173/t/al-xorazmiy/teacher/analytics](http://localhost:5173/t/al-xorazmiy/teacher/analytics)
- **Hisobotlar Generatori:** [http://localhost:5173/t/al-xorazmiy/teacher/reports](http://localhost:5173/t/al-xorazmiy/teacher/reports)
- **O'qituvchi Profili:** [http://localhost:5173/t/al-xorazmiy/teacher/profile](http://localhost:5173/t/al-xorazmiy/teacher/profile)
- **Tenant Administrator:** [http://localhost:5173/t/al-xorazmiy/admin](http://localhost:5173/t/al-xorazmiy/admin)

---

## 🧪 Sifat Darvozalari va Testlar

Loyiha barcha qat'iy sifat standartlaridan muvaffaqiyatli o'tgan:

```bash
npm run typecheck    # TypeScript Strict Mode (0 xato)
npm run lint         # ESLint statik tahlili (0 ogohlantirish)
npm run test         # Vitest unit & E2E (8 test fayl, 49/49 PASS)
npm run build        # Production yig'ish (Vite build)
```

---

## 📂 Loyiha Hujjatlari

Barcha batafsil texnik hujjatlar va hisobotlar `docs/` katalogida joylashgan:
- [`docs/FINAL_FRONTEND_DELIVERY_REPORT.md`](docs/FINAL_FRONTEND_DELIVERY_REPORT.md) — To'liq yakuniy topshirish hisoboti.
- [`docs/PROJECT_AUDIT_PHASE_0.md`](docs/PROJECT_AUDIT_PHASE_0.md) — Boshlang'ich audit va arxitektura taqqoslash.
- [`docs/EXECUTION_STATUS.md`](docs/EXECUTION_STATUS.md) — Har bir fazaning holati.
- [`docs/EXECUTION_LOG.md`](docs/EXECUTION_LOG.md) — Bajarilgan barcha ishlar jurnali.
- [`docs/reports/`](docs/reports/) — Phase 1 dan Phase 6 gacha bo'lgan bosqichma-bosqich hisobotlar.

---

## 📄 Litsenziya
Ushbu loyiha ta'lim va attestatsiya maqsadlari uchun ishlab chiqilgan.

