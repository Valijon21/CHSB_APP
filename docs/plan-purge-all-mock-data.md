# 🧹 Arxitektura Rejasi: Loyihadagi Barcha Mock Ma'lumotlarni To'liq Olib Tashlash (Zero-Mock Clean Baseline)

> **Hujjat turi:** Architecture & Refactoring Plan  
> **Status:** Tasdiqlangan va Amalga oshirishga tayyor  
> **Maqsad:** Prisma auto-seed, backend va frontend qatlamlaridagi barcha soxta (mock) sinflar, o'quvchilar, testlar, savollar va sessiyalarni olib tashlash, tizimni 100% real ma'lumotlar bilan ishlashga moslash.

---

## 1. 🔍 Muammo Tahlili va Aniqlangan Mock Qatlamlar

Foydalanuvchi Render'da dasturni ishga tushirganida server avtomatik tarzda eski mock ma'lumotlarni bazaga yuklab qo'ymoqda. Tekshiruv natijasida quyidagi joylarda mock ma'lumotlar aniqlandi:

1. **`backend/app/db/seed.py`:**
   - 11 ta soxta sinf (`11-A sinf`, `10-A sinf`, `9-A sinf`, `11-Guruh-1`...)
   - 3 ta soxta imtihon (`chsb-inf-11-q1`, `chsb-inf-9-q1`, `chsb-mat-9-q1`)
   - 45 ta qalbaki test savoli (`To'g'ri javob varianti`, `Noto'g'ri chalg'ituvchi variant 1`)
   - Soxta talabalar va baholash natijalari
2. **`prisma/seed.ts`:**
   - Xuddi shu soxta sinflar, imtihonlar va savollar
3. **`backend/app/main.py`:**
   - Server har start olganda bo'sh bazaga `auto_seed_db` orqali yuqoridagi barcha mocklarni yozib yuborish mexanizmi mavjud
4. **`frontend/src/features/teacher/proctor/liveProctorStore.ts`:**
   - `initialMockSessions`: 6 ta soxta o'quvchi sessiyalari (`Alisher Zokirov`, `Barno Karimova`, `Jasur Bekmurodov`...)
5. **`frontend/src/features/emaktab/store/emaktabSyncStore.ts`:**
   - `createMockCandidates()`: 4 ta soxta o'quvchi nomzodlari (`Jasurbek O'ktamov`, `Madina Aliyeva`...)
6. **Production Database (Render Neon DB):**
   - Eski sinflar va qoldiq mock yozuvlar

---

## 2. 🎯 Tizimning Qolishi Shart Bo'lgan Yagona Minimal Asosi (Clean Production Scaffolding)

Tizim ishlashi va o'qituvchi/admin tizimga kira olishi uchun nimalar qoladi:
- **Tenants:** `al-xorazmiy` va `temurbeklar-maktabi` (Tashkilot slug va identifikatori)
- **Schools:** Asosiy maktab kampusi yozuvi
- **Users:** Kirish uchun faqat admin va o'qituvchi hisoblari (`admin_ax`, `teacher_ax`)
- **Standard Subjects:** O'zbekiston ta'lim vazirligi tasdiqlagan 9 ta standart fanlar (Matematika, Informatika, Fizika, Kimyo, Biologiya, Ona tili, Ingliz tili, Tarix, Geografiya)
- **ZERO Mock Students:** 0 ta o'quvchi (faqat Excel/CSV orqali o'qituvchi o'zi yuklaydi)
- **ZERO Mock Classes:** 0 ta soxta sinf (sinflar o'quvchi yuklanganda yoki "Yangi sinf" orqali real yaratiladi)
- **ZERO Mock Assessments & Questions:** 0 ta soxta test
- **ZERO Mock Proctor Sessions & Results:** 0 ta soxta natija

---

## 3. 🌊 Atomik Vazifalar Ketma-ketligi (Task Breakdown)

### Wave 1: Backend Seed & Main Refactoring
- [x] **Task 1.1:** `backend/app/db/seed.py` faylini tozalash — sinflar, imtihonlar, savollar va natijalarni olib tashlash. Faqat tenant, school, auth users va standard subjects qoldirish.
- [x] **Task 1.2:** `prisma/seed.ts` faylini tozalash — mock sinflar, imtihonlar va savollarni butunlay chiqarib tashlash.
- [x] **Task 1.3:** `backend/app/main.py` dagi eski nom almashtirish (`Dilmurod -> Anvar`) va ortiqcha mock chaqiruvlarni tozalash.

### Wave 2: Frontend Mock State Elimination
- [x] **Task 2.1:** `frontend/src/features/teacher/proctor/liveProctorStore.ts` dan `initialMockSessions` ni olib tashlash, bo'sh `sessions = ref([])` qilish.
- [x] **Task 2.2:** `frontend/src/features/emaktab/store/emaktabSyncStore.ts` dan `createMockCandidates()` ni olib tashlash, bo'sh nomzodlar bilan ishlashga o'tkazish.

### Wave 3: Testing & Verification
- [x] **Task 3.1:** Backend testlarini ishga tushirish (`pytest`) va 100% yashil ekanini tekshirish.
- [x] **Task 3.2:** Frontend testlarini ishga tushirish (`vitest`) va 100% yashil ekanini tekshirish.

### Wave 4: Database Clean & Production Push
- [x] **Task 4.1:** Render / Neon PostgreSQL bazasidagi mavjud soxta sinflarni ham tozalash uchun xavfsiz tozalash logikasini ishga tushirish.
- [x] **Task 4.2:** Git commit qilib, GitHub `main` branch'ga push qilish.
