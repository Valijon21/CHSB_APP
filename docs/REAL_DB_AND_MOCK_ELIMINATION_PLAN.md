# Architecture Plan: Complete Mock Elimination & Real Database Integration

**Hujjat turi:** Arxitektura va Ma'lumotlar Bazasi Integratsiyasi  
**Status:** Tasdiqlash uchun taqdim etildi  
**Sana:** 2026-11-15  

---

## 1. Maqsad
Frontenddan barcha mock fayllarni (`src/shared/mocks`) butunlay olib tashlash, fallback va proxy larni yo'q qilish hamda tizimni 100% real ma'lumotlar bazasi (Prisma ORM + PostgreSQL / SQLite) va FastAPI backend API bilan integratsiya qilish.

---

## 2. Baza Variantlari (Database Selection)

1. **Variant 1 (Lokal PostgreSQL 16/18):**
   - `brew install postgresql@16 && brew services start postgresql@16`
   - Baza: `chsb_db`
   - `DATABASE_URL="postgresql://postgres@localhost:5432/chsb_db?schema=public"`

2. **Variant 2 (Tashqi / Cloud PostgreSQL):**
   - Supabase / Neon / Railway masofaviy PostgreSQL bazasi.
   - Foydalanuvchi taqdim etgan `DATABASE_URL`.

3. **Variant 3 (Nol-sozlama Prisma SQLite):**
   - Lokal `dev.db` fayli orqali real relyatsion SQL bazasi. Qo'shimcha server o'rnatishni talab qilmaydi.

---

## 3. Atomik Vazifalar (Atomic Tasks)

### Wave 1: Frontenddan Mocklarni Butunlay Tozalash
- [ ] `frontend/src/shared/mocks/` papkasini butunlay o'chirish.
- [ ] `frontend/src/shared/api/index.ts` faylini toza `Real*Repository` ga o'tkazish.
- [ ] `frontend/src/features/auth/store/authStore.ts` dagi fallbacklarni tozalash (faqat FastAPI `/auth/login` bilan ishlash).

### Wave 2: Ma'lumotlar Bazasi va Muhitni Tayyorlash
- [ ] `.env` faylini shakllantirish (`DATABASE_URL`, `JWT_SECRET`).
- [ ] `npx prisma db push` orqali 10 ta model jadvallarini generatsiya qilish.
- [ ] `npx tsx prisma/seed.ts` orqali real boshlang'ich ma'lumotlarni bazaga yuklash.

### Wave 3: Backend API Serverini Ishga Tushirish
- [ ] Python muhiti va kutubxonalarni o'rnatish (`fastapi`, `uvicorn`, `prisma`).
- [ ] `prisma py generate` orqali Python Prisma Clientni tayyorlash.
- [ ] FastAPI backendni `http://localhost:8000` portida ishga tushirish (Daemon).

### Wave 4: Sinov va Git Sync
- [ ] Backend health check: `GET /health` -> `status: healthy`.
- [ ] Frontend imtihon portali va o'qituvchi boshqaruv panelini real DB bilan tekshirish.
- [ ] Vitest testlarini yurgazish.
- [ ] Conventional Commit va GitHub `main` ga push.
