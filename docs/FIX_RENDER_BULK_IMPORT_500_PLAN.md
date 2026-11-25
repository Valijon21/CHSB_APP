# Render Production Bulk Student Import 500 Xatolikni Tuzatish Rejasi

## 1. Muammo Tahlili (Root Cause Analysis)
`chsb-app.onrender.com` (Render PostgreSQL) muhitida o'quvchilarni Excel/CSV orqali yuklashda `HTTP 500` chiqishining asosiy va qo'shimcha sabablari:

1. **Asosiy sabab — Render PostgreSQL DB sxemasi bilan kod o'rtasidagi nomuvofiqlik (Schema Drift):**
   - `289719e0` kommitida Render 512MB RAM cheklovi sababli `docker-entrypoint.sh` dan `prisma db push` olib tashlangan.
   - Keyinchalik `prisma/schema.prisma` ga qo'shilgan ustun va jadvallar (`class_groups.has_groups`, `students.group`, `students.emaktab_id`, `assessments.target_group`, `curriculum_resources`, `assessment_solutions`) Render PostgreSQL bazasida yaratilmagan.
   - Natijada `GET /api/v1/classes`, `POST /api/v1/classes`, `GET /api/v1/students`, `POST /api/v1/students/bulk` va `GET /api/v1/assessments` hammasi PostgreSQL'da `HTTP 500` qaytaradi (holbuki `GET /api/v1/tenants` `200 OK` ishlaydi).
   - Lokal muhitda SQLite (`prisma/dev.db`) `prisma db push` qilingani uchun lokalda ishlagan.
2. **Ikkinchi sabab — `bulk_create_students` va `create_student` ichidagi `rosterCode` `@unique` to'qnashuvi:**
   - `rosterCode` bazada global `@unique` bo'lsa-da, `bulk_create_students` faqat `tenant` bo'yicha `count()` ga tayangan. O'quvchilar o'chirilganda yoki boshqa tenantda `STU-11xx` mavjud bo'lsa, takroriy kod generatsiya qilinib `UniqueViolationError` (HTTP 500) berishi mumkin.
3. **Uchinchi sabab — `backend/requirements.txt` da `xlrd` yo'qligi:**
   - `backend/app/services/excel_parser.py` modulida top-level `import xlrd` mavjud, lekin `backend/requirements.txt` da `xlrd` ko'rsatilmagan (`/students/parse-file` Docker buildda `ModuleNotFoundError` berishi mumkin).
4. **To'rtinchi sabab — `classes.py` (`s_group` NameError) va `realApi.ts` (`className` uzatilmasligi & fake ID fallback):**
   - `backend/app/api/v1/endpoints/classes.py` 178-qatorda `s_group` nomli aniqlanmagan o'zgaruvchi ishlatilgan (`s.group` bo'lishi kerak).
   - `realApi.ts` da `bulkCreateStudents` `className` ni yubormaydi va `createClassGroup` xatolikda soxta `class-<timestamp>` ID qaytarib xatoni yashiradi.

---

## 2. Atomik Vazifalar (Tasks)

### Task 1: Python darajasida yengil va xavfsiz Schema Sync (`backend/app/db/schema_sync.py`)
- `main.py` `lifespan` ichida `prisma.connect()` dan keyin, `auto_seed_db()` dan oldin ishga tushadigan `ensure_schema_synced(prisma)` funksiyasini yaratish.
- Node.js Prisma CLI ishlatmasdan (0 MB qo'shimcha RAM), PostgreSQL va SQLite uchun idempotent DDL (`ADD COLUMN IF NOT EXISTS` / `PRAGMA table_info` + `CREATE TABLE IF NOT EXISTS`) bajarish.

### Task 2: `students.py`, `classes.py` va `requirements.txt` ni mustahkamlash
- `students.py`:
  - Umumiy yordamchi `generate_unique_roster_code(...)` funksiyasi orqali `bulk_create_students` va `create_student` da `rosterCode` unikal bo'lishini kafolatlash.
  - `bulk_create_students` da agar `classGroupId` topilmasa va `className` berilgan bo'lsa, sinf nomini moslashtirish yoki avtomatik yaratish.
- `classes.py`:
  - `s_group` xatosini `s.group` ga tuzatish.
- `backend/requirements.txt`:
  - `xlrd>=2.0.1` qo'shish (va `excel_parser.py` da `.xls` o'qishda xavfsiz xabar).

### Task 3: Frontend `realApi.ts` tuzatish
- `bulkCreateStudents` payload'iga `className` qo'shish.
- `createClassGroup` da backend xatosini yashirib soxta ID qaytarmaslik (xatoni yuqoriga uzatish).

### Task 4: Avtomatlashtirilgan Testlar va Tekshiruv
- Backend: schema sync idempotentligi, `rosterCode` to'qnashuvisiz `bulk_create_students` (o'chirishdan keyin ham), `className` bo'yicha avtomatik sinf yaratish, va `get_class_detail` natijalar bilan ishlashi uchun pytest testlari yozish.
- Frontend: `realApi.ts` uchun Vitest unit testlari.
- Barcha testlar va typecheck'larni ishga tushirish.
