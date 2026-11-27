---
title: CHSB Assessment Platform
emoji: 🎓
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 8000
pinned: false
---

# 🎓 CHSB Platform

Maktablarda choraklik baholash (**CHSB**) uchun ko'p maktabli veb-tizim: sinf va o'quvchilar ro'yxati, Excel/eMaktab import, testlar, natijalar va hisobotlar.

> **Holat: qayta qurilmoqda — hali haqiqiy imtihon uchun tayyor emas.**
> O'quvchi imtihoni vaqtincha o'chirilgan, ayrim tahlil va hududiy ko'rsatkichlar namunaviy raqamlar.
> To'liq reja: [docs/PROFESSIONAL_REBUILD_PLAN.md](docs/PROFESSIONAL_REBUILD_PLAN.md).
> `docs/` ichidagi eskiroq reja va hisobotlar tarixiy hujjatlardir va hozirgi kodni tasvirlamaydi.

## Nima ishlaydi

| Qism | Holat |
|---|---|
| Kirish, rollar, maktablar izolyatsiyasi, parol almashtirish | ✅ |
| Sinflar, o'quvchilar, fanlar, Excel import | ✅ |
| Testlar va javoblarni serverda baholash | ✅ API darajasida |
| O'quvchi imtihon oqimi | ⛔ o'chirilgan (2-bosqich) |
| Tahlil, hududiy monitoring, o'qituvchi profili, yozma ish bahosi | ⚠️ namunaviy yoki saqlanmaydi (3-bosqich) |
| Jonli nazorat zali | ⛔ backendi yo'q |

## Texnologiyalar

| Qatlam | Texnologiya |
|---|---|
| Frontend | Vue 3, TypeScript, Pinia, Vite, Tailwind CSS 4 |
| Backend | Python 3.14, FastAPI, SQLAlchemy 2 (async), Alembic |
| Baza | PostgreSQL 16+ |
| Kirish | JWT, bcrypt |

```text
backend/app/
  api/v1/       HTTP: validatsiya, ruxsat, javob
  services/     biznes mantiq
  models/       SQLAlchemy modellari
  schemas/      Pydantic sxemalari
  core/         sozlama, xavfsizlik, ruxsatlar, xatolar, log
  db/           ulanish, boshlang'ich ma'lumot, migratsiyalar
frontend/src/   Vue ilovasi
```

## Tez ishga tushirish (Docker)

`.env.example` dan `.env` yarating va `POSTGRES_PASSWORD`, `JWT_SECRET`, `SEED_PASSWORD` ni to'ldiring:

```bash
docker compose up --build
```

Ilova: <http://localhost:8000>. Jadvallar ishga tushishda avtomatik yaratiladi.

## Dasturlash uchun

Kerak: Python 3.14, Node.js 26, PostgreSQL 16+.

```bash
python3 -m venv .venv
```

```bash
.venv/bin/pip install -r backend/requirements-dev.txt
```

```bash
npm --prefix frontend ci
```

`.env` da `DATABASE_URL`, `JWT_SECRET`, `SEED_PASSWORD` ni to'ldiring, so'ng bazani tayyorlang:

```bash
npm run db:migrate
```

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

Frontend: <http://localhost:5173>, API hujjati: <http://127.0.0.1:8000/docs>.

## Hisoblar

Foydalanuvchisi yo'q bazada server `teacher_ax` (o'qituvchi), `admin_ax` (maktab admini) va `inspector_tashkent` (hududiy nazoratchi) hisoblarini yaratadi. Parol `SEED_PASSWORD` dan olinadi; u berilmasa hisob yaratilmaydi.

Boshqa buyruqlar:

```bash
.venv/bin/python -m backend.app.manage set-password admin_ax
```

```bash
.venv/bin/python -m backend.app.manage seed-curriculum
```

## Mavjud o'rnatishni yangilash

Eski (Prisma asosidagi) versiyadan o'tishda:

1. **Bazadan zaxira nusxa oling** (`pg_dump`). Ortga qaytaruvchi migratsiya yo'q.
2. Avval zaxira nusxaning o'zida `migrate` ni sinab ko'ring.
3. `JWT_SECRET` ni yangi tasodifiy qiymatga almashtiring.
4. Ilovani ishga tushiring (yoki `npm run db:migrate`). Mavjud yozuvlar saqlanadi.
5. Standart parol bloklangan: har bir hisobga `set-password` bilan yangi parol qo'ying.

Egasi aniq bo'lmagan testlar o'quvchisi eng ko'p maktabga biriktiriladi va logda ro'yxati chiqadi. SQLite endi qo'llab-quvvatlanmaydi.

## Tekshiruvlar

Backend testlari alohida PostgreSQL bazasida ishlaydi va **uni har safar tozalaydi** (nomi `_test` bilan tugashi shart):

```bash
TEST_DATABASE_URL=postgresql://postgres:PAROL@127.0.0.1:5432/chsb_test .venv/bin/python -m pytest
```

```bash
.venv/bin/ruff check backend
```

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npm test
```

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) shu tekshiruvlarni va Docker build'ni bajaradi.
