# Ishni davom ettirish (2026-11-27 holati)

Uydagi kompyuterda Claude'ga shunday yozing:

> DAVOM_ETTIRISH.md va docs/PROFESSIONAL_REBUILD_PLAN.md ni o'qi. Menga o'zbek tilida javob ber. CI natijasini tekshir, keyin 2-bosqichni (imtihon yadrosi) boshla.

## Maqsad

Oddiy boshlangan loyihani **mukammal, tez va professional** ishlaydigan tizimga aylantirish. Tanqidiy va halol baho kerak: eski hujjat va hisobotlardagi "bajarildi" degan da'volarga ishonilmaydi, kodda tekshiriladi.

## Hozirgi holat

Branch: `security/phase-0`. `main` o'zgarmagan (`d974ca1`). PR ochilmagan.

| Commit | Mazmuni |
|---|---|
| `3c9a8ee` | 0-bosqich: API himoyasi, rollar, maktab izolyatsiyasi, demo hisoblarni olib tashlash, path traversal tuzatilishi |
| `44fa21c` | 1-bosqich: Prisma o'rniga SQLAlchemy + Alembic (faqat PostgreSQL), parol almashtirish, login cheklovi, audit, yagona xato formati, Docker, CI |

Tekshirilgani:

- Lokal: 93 backend testi (PostgreSQL 18), 415 frontend testi, TypeScript, build; Python lint toza, frontend lint 0 xato va 27 ogohlantirish.
- Brauzerda toza baza bilan: kirish, o'quvchi va sinf ro'yxati, parol almashtirish.
- GitHub CI ([jarayon](https://github.com/Valijon21/CHSB_APP/actions/runs/45987371275)): `44fa21c` uchun backend va frontend **o'tdi**; Docker build bu fayl yozilayotganda hali tugamagan edi, natijasini tekshiring.

**Tekshirilmagani:** haqiqiy ma'lumot nusxasida migratsiya, yuklama, production deploy.

## Kompyuterni tayyorlash

Kerak: Git va Git LFS, Python 3.14, Node.js 26, PostgreSQL 16+ (yoki Docker). Buyruqlar Linux/macOS uchun.

```bash
git clone https://github.com/Valijon21/CHSB_APP.git
```

```bash
cd CHSB_APP
```

```bash
git switch security/phase-0
```

```bash
git lfs pull
```

```bash
python3 -m venv .venv
```

```bash
.venv/bin/pip install -r backend/requirements-dev.txt
```

```bash
npm --prefix frontend ci
```

```bash
cp .env.example .env
```

`.env` da to'ldiriladi:

| O'zgaruvchi | Qiymat |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:PAROL@127.0.0.1:5432/chsb_db` (SQLite endi ishlamaydi) |
| `JWT_SECRET` | kamida 32 belgili tasodifiy kalit |
| `SEED_PASSWORD` | boshlang'ich hisoblar paroli, kamida 10 belgi |
| `POSTGRES_PASSWORD` | faqat Docker uchun; `PAROL` bilan bir xil bo'lsin |

Kalit yaratish:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

Bazani Docker'da ko'tarish (`chsb_test` bazasi ham yaratiladi):

```bash
docker compose up -d postgres
```

```bash
npm run db:migrate
```

```bash
npm run dev:backend
```

Ikkinchi terminalda:

```bash
npm run dev:frontend
```

Ilova: <http://localhost:5173>. Hisoblar: `admin_ax`, `teacher_ax`, `inspector_tashkent`.

Windows'da `.venv/bin/...` o'rniga `.venv\Scripts\...`; `npm run db:migrate` o'rniga `.venv\Scripts\python -m backend.app.manage migrate`, `dev:backend` o'rniga `.venv\Scripts\python -m uvicorn backend.app.main:app --reload`.

Backend testlari (ko'rsatilgan baza **har safar tozalanadi**, nomi `_test` bilan tugashi shart):

```bash
TEST_DATABASE_URL=postgresql://postgres:PAROL@127.0.0.1:5432/chsb_test .venv/bin/python -m pytest
```

## Keyingi ish: 2-bosqich (imtihon yadrosi)

To'liq tavsif: [reja, 6-bo'lim](docs/PROFESSIONAL_REBUILD_PLAN.md). Hozir **o'quvchi imtihoni ataylab o'chirilgan**.

Qilinadigan oqim: o'qituvchi sessiya ochadi → o'quvchi roster kodi + sessiya kodi bilan kiradi → server vaqt muddatini belgilaydi → savollar javob kalitisiz keladi → har javob alohida saqlanadi → topshirish urinishni qulflaydi → natija o'qituvchida ko'rinadi.

| ID | Xato | Holat |
|---|---|---|
| E2-1 | Saqlash oldingi javoblarni o'chiradi | ✅ tuzatildi |
| E2-2 | Javob kaliti o'quvchiga ketadi (hozir faqat xodim o'qiy oladi) | ochiq |
| E2-3 | Natija manzili noto'g'ri (`frontend/src/shared/api/realApi.ts`), sahifa soxta `35/40` ko'rsatadi | ochiq |
| E2-4 | Natija maydonlari frontend va backendda mos emas | ochiq |
| E2-5 | Topshirilgandan keyin o'zgartirish mumkin | ✅ tuzatildi |
| E2-6 | Taymer sahifa yangilansa qayta boshlanadi, server vaqtni tekshirmaydi | ochiq |
| E2-7 | Oflayn navbat sinxronlanmaydi | ochiq |
| E2-8 | `chsb-inf-11-q1` kodga qo'lda yozilgan | ochiq |

Kod bo'yicha eslatmalar:

- `exam_sessions` jadvali, `assessment_attempts.session_id` va `deadline_at` tayyor, hali ishlatilmaydi.
- O'quvchi tokeni turi (`STUDENT_TOKEN`) bor; xodim route'lari uni rad etadi. O'quvchi uchun alohida dependency kerak.
- Yangi ochiq route qo'shilsa, `backend/tests/test_access_control.py` dagi `PUBLIC_ROUTES` ga yoziladi.
- Qabul mezoni: haqiqiy backend bilan Playwright testi (reja, 6-bo'lim).

3-bosqich (keyin): soxta tahlil va hududiy raqamlar, saqlanmaydigan maktab/o'qituvchi tahriri va yozma baho, o'qituvchini o'z sinflari bilan cheklash (`teacher_classes`).

## Egasi qiladigan ishlar

1. **Shoshilinch:** eski versiya ishlayotgan serverlarni to'xtatish, bazadan zaxira olish, barcha kalit, token va parollarni almashtirish. Repozitoriya ommaviy, eski versiyadagi zaifliklar ochiq.
2. `main` ga qo'shishdan oldin zaxira nusxada migratsiyani sinash. `main` avtomatik deploy bo'lsa, ishlab turgan baza o'zi o'zgaradi; ortga qaytaruvchi migratsiya yo'q.

## Javob kutayotgan savollar

| # | Savol | Javob bo'lmasa |
|---|---|---|
| 1 | Serverda haqiqiy o'quvchi ma'lumoti bormi? | Bor deb hisoblanadi |
| 2 | O'quvchi kirishi: roster kodi + sessiya kodi ma'qulmi? | Shu usul |
| 3 | `v2/`, `.agents/`, eski hujjatlarni o'chirsa bo'ladimi? | O'chirilmaydi |
| 4 | Hosting: pullik Render yoki o'z VPS? | 4-bosqichda hal qilinadi |
| 5 | 86 / 71 / 56 baho chegaralari rasmiymi? | Sozlanadigan qiymat |
| 6 | Bir vaqtda nechta o'quvchi imtihon topshiradi? | 300 |
