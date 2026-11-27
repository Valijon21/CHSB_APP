# CHSB — Professional tizimga o'tish rejasi

**Sana:** 2026-11-27 · **Asos:** `d974ca1` commit auditi · **Holat:** 0 va 1-bosqich kodi `security/phase-0` branch'ida

## Bajarilish holati (2026-11-27)

| Bosqich | Holat | Qolgan ish |
|---|---|---|
| 0 | Kod tayyor | S0-1: serverni to'xtatish, zaxira, kalitlarni almashtirish (egasi) |
| 1 | Kod tayyor | CI'da backend va frontend o'tdi, Docker build natijasi tekshirilsin; F1-10 o'chirishlari tasdiq kutmoqda; haqiqiy baza nusxasida migratsiya sinalmagan |
| 2 | Boshlanmagan | E2-1 va E2-5 1-bosqichda tuzatildi |
| 3–5 | Boshlanmagan | — |

1-bosqichdagi chetlanishlar: Python 3.12 o'rniga **3.14** (lokal sinalgan versiya); `teacher_classes` jadvali yaratildi, lekin cheklov o'qituvchiga sinf biriktirish ekrani paydo bo'lgach (3-bosqich) yoqiladi; lint 0 xato, 27 ogohlantirish chegarasi bilan.

Bu hujjat `docs/` ichidagi eski reja va hisobotlar bilan zid kelsa, shu hujjat ustun (tasdiqlangandan keyin). Eski hisobotlardagi "bajarildi" belgilariga tayanmang: ularning bir qismi kodda tasdiqlanmadi.

Belgilar: **[T]** ishga tushirib tasdiqlangan · **[K]** koddan aniqlangan.
Muddatlar taxminiy: bitta dasturchi AI yordamchi bilan, to'liq bandlik.

---

## 1. Maqsad va o'lchovlar

| O'lchov | Maqsad |
|---|---|
| Himoyasiz API | Ochiq ro'yxatdan tashqari 0 ta |
| Javob kaliti o'quvchiga ketishi | 0 |
| Bir vaqtda imtihon topshiruvchi | 300 (taklif, tasdiqlang) |
| API javob vaqti (p95, shu yuklamada) | < 300 ms |
| Javob yo'qolishi (tarmoq uzilishi bilan) | 0 |
| Ekrandagi qo'lda yozilgan "natija" raqamlari | 0 |
| Boshlang'ich JS (gzip) | < 120 KB (hozir ~83 KB, saqlab qolish) |
| CI | Test, lint, typecheck o'tmasa deploy yo'q |

## 2. Texnik qarorlar

| Qatlam | Qaror | Sabab |
|---|---|---|
| Frontend | Vue 3 + Pinia + Vite qoladi | Tuzilma yaxshi, typecheck toza |
| Backend | FastAPI qoladi, `routers → services → models` | Hozir biznes mantiq router ichida |
| ORM | Prisma Python → **SQLAlchemy 2 (async) + Alembic** | `prisma-client-py` repozitoriyasi arxivlangan |
| Baza | Faqat **PostgreSQL** (lokal, test, production) | Hozir SQLite va PostgreSQL aralash |
| Python | Bitta versiya: 3.12 | Lokal 3.14, Docker 3.11 |
| AI | Faqat server orqali | Hozir kalit brauzerda ishlatiladi |
| `v2/` (Next.js) | O'chirish (tasdiqlang) | Alohida ilova, asosiy deploy'ga kirmaydi |

**Tartib o'zgardi.** Avvalgi tavsiyada ORM almashtirish 4-bosqichda edi. Shunda har bir router ikki marta yozilardi. Yangi tartib: avval 1 kunda teshiklarni yopish, keyin har bir routerni **bir marta** (yangi ORM + ruxsatlar + sahifalash bilan) qayta yozish.

## 3. Yo'l xaritasi

| Bosqich | Natija | Muddat |
|---|---|---|
| 0. Favqulodda yopish | Begona odam ma'lumotni ko'ra va o'chira olmaydi | 1–2 kun |
| 1. Poydevor | Yangi ma'lumot qatlami, ruxsatlar, CI | 1–1.5 hafta |
| 2. Imtihon yadrosi | Haqiqiy imtihon o'tkazsa bo'ladi | 1–1.5 hafta |
| 3. Haqiqiy ma'lumot | Har bir ekran bazadagi ma'lumotni ko'rsatadi | 1–1.5 hafta |
| 4. Tezlik va ishga tushirish | Yuklama sinovi, monitoring, pilot | 1 hafta |
| 5. Yangi imkoniyatlar | Savollar banki, jonli nazorat | keyin |

Jami 0–4: taxminan **5–7 hafta**. Pilot maktabda sinov faqat 4-bosqichdan keyin.

---

## 4. Bosqich 0 — Favqulodda yopish

**Ogohlantirish:** bu bosqichdan 2-bosqich oxirigacha **o'quvchi imtihoni o'chirilgan bo'ladi**. U hozir baribir noto'g'ri ball hisoblaydi.

| ID | Vazifa | Joyi |
|---|---|---|
| S0-1 | Ishlab turgan serverni to'xtatish, bazadan zaxira nusxa (egasi bajaradi) | Render / Hugging Face |
| S0-2 | Barcha API'ga token majburiy. Ochiq: `/health`, `/auth/login`, `/tenants/{slug}/context` | `api/v1/router.py` |
| S0-3 | Yozish/o'chirishga rol tekshiruvi; tenant tokendan olinadi | `endpoints/*` |
| S0-4 | "Hammasini o'chirish" (tenant'siz `DELETE /students`, `DELETE /classes`) olib tashlanadi | `students.py`, `classes.py` |
| S0-5 | `debug-db` va javobdagi traceback o'chiriladi; CORS aniq domenlarga | `main.py` |
| S0-6 | `JWT_SECRET` majburiy, zaxira qiymatsiz | `core/config.py` |
| S0-7 | Demo hisoblar, tez kirish tugmalari va `isTest` tarmog'i olib tashlanadi | `authStore.ts`, `LoginView.vue` |
| S0-8 | `getToken` `sessionStorage`ni ham o'qiydi **[K]** | `httpClient.ts` |
| S0-9 | To'g'ridan-to'g'ri `fetch` chaqiruvlari `httpClient`ga | `BulkStudentImportModal.vue`, `CurriculumHubView.vue` |
| S0-10 | Login javobiga `tenantSlug`; `REGIONAL_INSPECTOR` roli frontendga mos **[T]** | `auth.py`, `types.ts` |
| S0-11 | Boshlang'ich parollar muhit o'zgaruvchisidan; README'dan parollar olinadi | `seed.py`, `prisma/seed.ts` |
| S0-12 | Bazani tozalab yuboradigan seed buyruqlariga production himoyasi **[K]** | `seed.py`, `prisma/seed.ts` |
| S0-13 | Hugging Face'ga avtomatik majburiy push o'chiriladi | `.github/workflows/` |

S0-8 va S0-9 qilinmasa, himoya yoqilgach "meni eslab qol"siz kirish, Excel import va o'quv materiallari ishlamay qoladi.

**Qabul mezoni**
- Tokensiz har bir yopiq endpoint 401 qaytaradi (avtomatik test barcha route'larni aylanib chiqadi).
- O'qituvchi boshqa maktab ma'lumotini so'rasa 404 oladi.
- `admin123` production build ichida yo'q.
- Mavjud testlar yangilangan va o'tadi (5 ta frontend test fayli demo hisoblarga, backend API testlari anonim so'rovga bog'liq).

---

## 5. Bosqich 1 — Poydevor

### 5.1 Tuzilma

```text
backend/app/
  api/v1/        # faqat HTTP: validatsiya, ruxsat, javob
  services/      # biznes mantiq (grading, admission, import)
  models/        # SQLAlchemy
  schemas/       # Pydantic (barcha so'rov va javoblar)
  core/          # config, security, permissions, errors
  db/            # session, alembic/
```

### 5.2 Ruxsatlar matritsasi (taklif)

| Amal | O'quvchi | O'qituvchi | Maktab admini | Inspektor |
|---|---|---|---|---|
| O'z imtihoni va natijasi | ✅ | — | — | — |
| Sinf va o'quvchilarni ko'rish | — | o'z sinflari | o'z maktabi | — |
| O'quvchi qo'shish/o'chirish | — | — | ✅ | — |
| Test yaratish, natija baholash | — | o'z testlari | ✅ | — |
| Foydalanuvchi boshqaruvi | — | — | ✅ | — |
| Hududiy umumlashtirilgan ko'rsatkich | — | — | — | ✅ (shaxsiy ma'lumotsiz) |

Maktab yaratish uchun alohida `SUPER_ADMIN` roli. `REGIONAL_INSPECTOR` undan ajratiladi.

### 5.3 Ma'lumot modeli o'zgarishlari

| Jadval | O'zgarish |
|---|---|
| `assessments` | `tenant_id`, `created_by`, `status` (draft/published/closed) |
| `exam_sessions` **(yangi)** | test, sinf, guruh, `starts_at`, `ends_at`, kirish kodi |
| `assessment_attempts` | `session_id`, `deadline_at`, unique(`session_id`, `student_id`) |
| `attempt_answers` **(yangi)** | unique(`attempt_id`, `question_id`) — javoblar ustidan yozilmaydi |
| `manual_scores` **(yangi)** | yozma ish mezonlari, kim va qachon baholadi |
| `teacher_classes` **(yangi)** | o'qituvchi ↔ sinf ↔ fan |
| `users` | `school_id`, `token_version`, `must_change_password` |
| Hammasi | tashqi kalit va filtr ustunlariga indeks, enum yoki CHECK, `TIMESTAMPTZ` |
| `student_count` ustunlari | olib tashlanadi, `COUNT` bilan hisoblanadi |

### 5.4 Vazifalar

| ID | Vazifa |
|---|---|
| F1-1 | `docker-compose` bilan lokal va test PostgreSQL |
| F1-2 | SQLAlchemy modellari hozirgi jadval nomlariga mos; Alembic boshlang'ich migratsiya; mavjud bazaga `stamp` |
| F1-3 | Yangi jadvallar alohida migratsiyalar bilan; eski `answers_json` ko'chiriladi |
| F1-4 | Yagona `CurrentUser` / `TenantScope` dependency |
| F1-5 | Routerlarni birma-bir ko'chirish: auth → tenants → subjects → classes → students → assessments |
| F1-6 | Yagona xato formati, strukturali log, `request_id` |
| F1-7 | Parol almashtirish, login urinishlarini cheklash, audit jurnali |
| F1-8 | `schema_sync.py`, `session.py`, `prisma/` olib tashlanadi; Dockerfile start'da `alembic upgrade head` |
| F1-9 | CI: ruff, pytest (Postgres xizmati bilan), typecheck, lint (hozir 63 xato), vitest, build, Docker build |
| F1-10 | Tozalash: `.agents/`, eski hisobotlar, `v2/`, `CHSB_11_SINF.html` (avval tasdiq), README haqiqatga moslanadi |

**Qabul mezoni:** bo'sh PostgreSQL'da bitta buyruq bilan tizim ko'tariladi; mavjud ma'lumot nusxasida migratsiya yozuvlar sonini saqlaydi; CI yashil.

---

## 6. Bosqich 2 — Imtihon yadrosi

### 6.1 Oqim

1. O'qituvchi testni e'lon qiladi va sinf uchun sessiya ochadi → 6 xonali kod.
2. O'quvchi **roster kodi + sessiya kodi** kiritadi, o'z ismini tasdiqlaydi.
3. Server faqat shu urinishga yaraydigan token beradi va `deadline_at` belgilaydi.
4. Savollar **javob kalitisiz** keladi; aralashtirish tartibi serverda saqlanadi.
5. Har bir javob alohida saqlanadi; tarmoq yo'q bo'lsa navbatga yoziladi.
6. Topshirish yoki muddat tugashi urinishni qulflaydi; ball serverda hisoblanadi.
7. O'qituvchi yozma ishlarni baholaydi va natijani tasdiqlaydi.

Ikkinchi qurilmadan kirishda eski token bekor qilinadi va o'qituvchiga ko'rinadi.

### 6.2 API shartnomasi

| Endpoint | Kim |
|---|---|
| `POST /exam-sessions` · `POST /exam-sessions/{id}/close` | o'qituvchi |
| `POST /exam/join` | ochiq, cheklangan urinish |
| `GET /exam/attempt` | o'quvchi tokeni |
| `PUT /exam/attempt/answers/{questionId}` | o'quvchi tokeni |
| `POST /exam/attempt/submit` (takrorlansa bir xil natija) | o'quvchi tokeni |
| `GET /exam/attempt/result` | o'quvchi tokeni |
| `GET /assessments/{id}` (kalit bilan) | o'qituvchi |

Frontend tiplari OpenAPI'dan generatsiya qilinadi, shunda manzil va maydon nomlari ajralib ketmaydi.

### 6.3 Tuzatiladigan xatolar

| ID | Xato |
|---|---|
| E2-1 | Har saqlash oldingi javoblarni o'chiradi **[T]** |
| E2-2 | Javob kaliti o'quvchiga ketadi **[T]** |
| E2-3 | Natija manzili 404 **[T]**; shu holda sahifa **soxta `35/40, 87.5%`** ko'rsatadi **[K]** (`AssessmentResultView.vue`) |
| E2-4 | Natija maydonlari mos emas (`studentId` ↔ `rosterRecordId`, `answeredQuestions` yo'q) **[K]** |
| E2-5 | Topshirilgandan keyin saqlash mumkin **[T]** |
| E2-6 | Taymer yangilashda qayta boshlanadi, server vaqtni tekshirmaydi **[K]** |
| E2-7 | Oflayn navbat sinxronlanmaydi **[K]** |
| E2-8 | Barcha o'quvchiga `chsb-inf-11-q1` biriktirilgan joylar **[K]** |

**Qabul mezoni** — Playwright testi haqiqiy backend bilan:
- hammasi to'g'ri → 40/40, baho 5;
- o'rtada sahifa yangilansa javoblar va qolgan vaqt saqlanadi;
- 2 daqiqa tarmoq uzilsa javob yo'qolmaydi;
- muddatdan keyingi javob rad etiladi;
- ikki marta bosilgan "topshirish" bitta natija yaratadi;
- natija o'qituvchi sahifasida ko'rinadi.

---

## 7. Bosqich 3 — Haqiqiy ma'lumot

Qoida: **ma'lumot yo'q bo'lsa "ma'lumot yo'q" deyiladi.** Zaxira raqam ko'rsatilmaydi; API xatosi bo'sh ro'yxat sifatida yashirilmaydi.

| ID | Hozirgi holat **[K]** | Ish |
|---|---|---|
| D3-1 | Maktab/o'qituvchi yaratish, tahrirlash, o'chirish hech narsa saqlamaydi | Foydalanuvchi va maktab CRUD |
| D3-2 | `updateStudent` hech narsa qilmaydi | Tahrirlash endpointi |
| D3-3 | O'qituvchi profili qo'lda yozilgan | `/auth/me` asosida |
| D3-4 | Test tafsiloti: 50 / 44 / 88% va savol statistikasi qo'lda | SQL bilan hisoblash |
| D3-5 | Tahlil: kognitiv foizlar, savol statistikasi, o'tish 100% | SQL bilan hisoblash |
| D3-6 | O'quvchi sahifasi: davomat 98%, ball 34 zaxira | Davomatni olib tashlash, haqiqiy ball |
| D3-7 | Hududiy monitoring uydirma | Agregat so'rovlar yoki ekranni yashirish |
| D3-8 | Yozma baho faqat brauzer xotirasida o'zgaradi | `manual_scores` ga saqlash |
| D3-9 | AI zaxira matni foiz uydiradi, remediatsiya doim bir xil | Faqat haqiqiy ko'rsatkich; manba ko'rsatiladi |
| D3-10 | Gemini kaliti brauzerda | Server proksi, model nomi sozlamada |
| D3-11 | Jonli nazorat backendi yo'q | 5-bosqichgacha menyudan yashirish |
| D3-12 | Baholash chegaralari bir necha joyda | Bitta joyda (server), tenant sozlamasi |

## 8. Bosqich 4 — Tezlik va ishga tushirish

| ID | Ish |
|---|---|
| P4-1 | Barcha ro'yxatlarda server sahifalash, qidiruv, filtr |
| P4-2 | Ommaviy import: bitta tranzaksiya, batch insert, xato qatorlar hisoboti (hozir jimgina tashlab ketiladi) |
| P4-3 | Tahlil va reyting SQL agregatsiya bilan |
| P4-4 | Excel/PDF kutubxonalarini alohida chunk qilish; `xlsx@0.18.5` ni xavfsiz versiyaga almashtirish |
| P4-5 | Fayl yuklashga hajm va tur cheklovi |
| P4-6 | Yuklama sinovi (k6): 300 o'quvchi |
| P4-7 | Uyqu rejimisiz hosting, bir nechta worker, ulanishlar puli |
| P4-8 | Kunlik zaxira va **tiklash sinovi**; xato monitoringi |
| P4-9 | Bitta sinfda pilot, keyin kengaytirish |

**Qabul mezoni:** 1-bo'limdagi barcha o'lchovlar bajarilgan.

## 9. Bosqich 5 — Keyingi imkoniyatlar

Ustuvorlik pilotdan keyin belgilanadi: savollar banki va variantlar · jonli nazorat (SSE) · rasm/formulali savollar · PDF hisobotlar · eMaktab eksportini real faylda sinash · to'liq 4 tilli interfeys (hozir tarjima tizimi ekranlarda deyarli ishlatilmaydi).

---

## 10. Ish tartibi

- Har vazifa: alohida branch → test → kod → CI → merge.
- Xato tuzatishdan oldin uni ko'rsatadigan test yoziladi.
- Frontend testlari soxta repozitoriyga tayanadi; imtihon va auth uchun haqiqiy backend bilan integratsiya testi majburiy.
- Hujjat faqat tekshirilgan holatni yozadi.

## 11. Xavflar

| Xavf | Chora |
|---|---|
| ORM ko'chirishda ma'lumot yo'qolishi | Zaxira, nusxada sinov, jadval nomlarini saqlash |
| 0-bosqich ishlayotgan funksiyalarni buzishi | Route bo'yicha ruxsat testlari |
| Qamrov kengayib ketishi | 4-bosqichgacha yangi funksiya yo'q |
| Audit qamramagan joylar (`v2`, parserlar, UI chuqur) | Tegishli bosqich boshida tekshiriladi |

## 12. Sizdan kerak bo'lgan qarorlar

| # | Savol | Javob bo'lmasa |
|---|---|---|
| 1 | Serverda haqiqiy o'quvchi ma'lumoti bormi? | Bor deb hisoblanadi |
| 2 | O'quvchi kirishi: roster kodi + sessiya kodi ma'qulmi? | Shu usul |
| 3 | `v2/`, `.agents/`, eski hujjatlarni o'chirish mumkinmi? | O'chirilmaydi |
| 4 | Hosting: pullik Render yoki o'z VPS? Byudjet? | 4-bosqichda hal qilinadi |
| 5 | 86 / 71 / 56 baho chegaralari va yozma topshiriqlar tartibi rasmiymi? | Hozirgi qiymat, sozlanadigan |
| 6 | Pilotda nechta o'quvchi bir vaqtda topshiradi? | 300 |
