# 📋 Arxitektura va Amalga Oshirish Rejasi: Jadvallarda Sahifalash (Pagination 10/20/30/50) va Excel (.xlsx/.xls) Fayllarini Aqlli Tahlil Qilish (AI RAG + Deterministik Dvigatel)

---

## 🎯 1. Maqsad va Muammoning Asl Sababi

### 1.1 Muammoning Tahlili (Screenshots tahlili)
1. **Excel fayli yuklanganda `Ismsiz ` chiqishi (Screenshot 2 va Screenshot 1)**:
   - `BulkStudentImportModal.vue` da foydalanuvchi `.xls` yoki `.xlsx` faylni tashlaganda, kod uni `FileReader.readAsText(file)` orqali matn sifatida o'qishga uringan.
   - `.xls` (BIFF8 ikkilik formati) va `.xlsx` (ZIP/XML arxiv) matnli format emas, balki ikkilik (binary) formatdir. Uni UTF-8 matn sifatida o'qiganda baytlar buzulib, `\uFFFD` (replasement belgi: ``) va 375 ta bo'sh/axlat qatorlar paydo bo'lgan. Natijada `Ismsiz ` kabi 375 ta yaroqsiz o'quvchi shakllangan va bazaga yozilib ketgan.
2. **Jadvallarda sahifalash (Pagination) yo'qligi**:
   - O'quvchilar ro'yxatida (`TeacherStudentsView.vue`), sinf ko'rinishida (`TeacherClassDetailView.vue`), import oynasida (`BulkStudentImportModal.vue`) va hisobotlarda barcha o'quvchilar bitta uzun ro'yxatda chiqmoqda.
   - Foydalanuvchi talabi: Jadvallarda sahifalash bo'lishi hamda yonida `10, 20, 30, 50` tasini ko'rsatish tanlagichi (selector) bo'lishi kerak.
3. **Ustunlarni aniq ajratish (AI RAG va AI-siz)**:
   - Dastur har qanday eMaktab jurnali yoki shaxsiy Excel jadvalidan ustunlarni (T/r, eMaktab ID, F.I.SH., Jinsi, Guruh) aniq ajratib olishi kerak.
   - Foydalanuvchi ixtiyoriga ko'ra loyihadagi AI RAG (Google Gemini Flash) dan foydalanish, ammo dastur **AI-siz ham** (deterministik aqlli tahlil bilan) to'liq va aniq ajrata olishi shart.

---

## 🏛️ 2. Arxitektura va Yechim Loyihasi

### 2.1 Reusable Pagination Komponenti (`TablePagination.vue`)
- Joylashuvi: `frontend/src/shared/components/TablePagination.vue`
- Tokenlar: `DESIGN.md` standartlari (Teal `#0F766E`, Slate matn, qorong'i rejim, WCAG 2.1 AA 36px+ touch target).
- Parametrlari (Props):
  - `currentPage: number` (hozirgi sahifa)
  - `pageSize: number` (sahifadagi qatorlar: 10, 20, 30, 50)
  - `totalItems: number` (jami elementlar soni)
  - `pageSizeOptions?: number[]` (standart: `[10, 20, 30, 50]`)
- Hodisalari (Emits):
  - `update:currentPage(page)`
  - `update:pageSize(size)`
- UI ko'rinishi:
  - Chapda: `Ko'rsatilmoqda: 1-10 / jami 30 ta`
  - O'rtada / o'ngda: `10`, `20`, `30`, `50` qator tanlagich pill tugmalari
  - O'ngda: `Oldingi (←)` va `Keyingi (→)` sahifa tugmalari hamda sahifa raqamlari.

### 2.2 Haqiqiy Binary Excel (.xls va .xlsx) O'qish Dvigateli
- **Backend API (`backend/app/api/v1/endpoints/students.py` & `backend/app/services/excel_parser.py`)**:
  - `POST /api/v1/students/parse-file`: multipart fayl (`.xlsx`, `.xls`, `.csv`).
  - `.xls` fayllarni mavjud `xlrd 2.0.2` orqali to'g'ridan-to'g'ri o'qiydi (BIFF8 katakchalari).
  - `.xlsx` fayllarni Python `zipfile` + `xml.etree.ElementTree` orqali nol qo'shimcha paket bilan (katakcha va shared strings) o'qiydi.
  - `.csv` / `.tsv` fayllarni `csv.reader` (UTF-8, Windows-1251, CP1254) orqali o'qiydi.
  - **Heuristic Column Mapper (AI-siz)**:
    - Sarlavha qatorini aniqlaydi: `t/r`, `№`, `id`, `emaktab`, `f.i.sh`, `fish`, `familiya`, `ism`, `jinsi`, `guruh`.
    - 7+ xonali raqamni `emaktabId` deb taniydi.
    - O'zbekcha ism-sharif formatini (2-4 so'z, faqat harflar) `fullName` deb taniydi.
    - Bo'sh, axlat baytlar yoki replasement (``) qatorlarini qat'iyan rad etadi — hech qachon `Ismsiz ` chiqmaydi!
- **AI RAG Smart Extractor (AI bilan)**:
  - `frontend/src/shared/utils/groundedAiExtractor.ts` dagi Gemini 3.5 Flash bilan integratsiya qilingan `extractStudentsRosterWithAi(sampleRowsText)` funksiyasi.
  - Foydalanuvchi "AI bilan aniqlash" tugmasini bosganda, noan'anaviy formatdagi har qanday murakkab jadvalni Gemini orqali aniq JSON ro'yxatga aylantiradi.
  - Agar internet yoki API kalit bo'lmasa yoki foydalanuvchi AI-siz ishlashni xohlasa, deterministik dvigatel 100% oflayn rejimda ishlaydi.

### 2.3 Bazadagi Yaroqsiz (375 ta `Ismsiz`) O'quvchilarni Tozalash
- Oldingi noto'g'ri importdan qolgan `Ismsiz` yoki `` bo'lgan yozuvlarni SQLite `prisma/dev.db` dan tozalash va toza holatga keltirish.

---

## 🌊 3. Bosqichma-bosqich Atomik Vazifalar (Waves & Tasks)

### 🌊 Wave 1: Reusable Pagination Komponenti va Sahifalarga Integratsiya
- [ ] **Task 1.1: `TablePagination.vue` komponentini yaratish**
  - `DESIGN.md` tokenlari (Teal active, Slate dark mode, 36px+ tap target);
  - `10, 20, 30, 50` tezkor tanlagich tugmalari;
  - Sahifalar o'rtasida navigatsiya (`Oldingi`, `Keyingi`, `1, 2, 3...`);
  - `frontend/tests/table-pagination.test.ts` unit testlarini yozish va yashil o'tkazish.
- [ ] **Task 1.2: `TeacherStudentsView.vue` ga Pagination qo'shish**
  - O'quvchilar ro'yxatida `currentPage` va `pageSize` (standart 10);
  - Jadval ostiga `TablePagination` ulash;
  - Qidiruv yoki filtr o'zgarganda 1-sahifaga qaytarish.
- [ ] **Task 1.3: `TeacherClassDetailView.vue` ga Pagination qo'shish**
  - Sinfdagi o'quvchilar ro'yxatiga `TablePagination` qo'shish (10, 20, 30, 50).
- [ ] **Task 1.4: `BulkStudentImportModal.vue` ga Pagination qo'shish**
  - Import qilingan o'quvchilar preview jadvaliga sahifalash qo'shish.

---

### 🌊 Wave 2: Binary Excel (.xls/.xlsx) va Ustunlarni Avtomatik Ajratish Dvigateli (AI-siz)
- [ ] **Task 2.1: Backend `excel_parser.py` xizmatini yaratish**
  - `.xls` fayllarni `xlrd` orqali to'g'ridan-to'g'ri o'qish;
  - `.xlsx` fayllarni `zipfile` + `xml.etree.ElementTree` orqali o'qish;
  - `.csv` fayllarni kodlashlarni tekshirgan holda o'qish;
  - Ustunlarni (T/r, eMaktab ID, F.I.SH, Jinsi, Guruh) avtomatik aniqlash;
  - Axlat baytlar, sarlavha metama'lumotlari va `` belgilarni tozalash (hech qachon `Ismsiz` chiqarmaslik).
- [ ] **Task 2.2: `POST /api/v1/students/parse-file` endpointini yaratish**
  - Yuklangan faylni qabul qilish, tahlil qilish va strukturalangan JSON qaytarish;
  - `backend/tests/test_excel_parser.py` testlarini yozish va 100% yashil o'tkazish.
- [ ] **Task 2.3: Bazadagi axlat (Ismsiz) o'quvchilarni tozalash**
  - `backend/app/db/cleanup_junk_students.py` skriptini ishga tushirish.

---

### 🌊 Wave 3: AI RAG Smart Extractor va Frontend Import Modali Integratsiyasi
- [ ] **Task 3.1: Grounded AI Extractor ga `extractStudentsRosterWithAi` qo'shish**
  - `src/shared/utils/groundedAiExtractor.ts` da Gemini 3.5 Flash orqali o'quvchilar ro'yxatini tahlil qiluvchi funksiya;
  - Har bir o'quvchi uchun `fullName`, `emaktabId`, `gender`, `group` ni ajratish.
- [ ] **Task 3.2: `BulkStudentImportModal.vue` ni yangilash**
  - Fayl tanlanganda `.xls` va `.xlsx` fayllarni backend parseriga yuborish (ikkilik xatosi yo'qoladi);
  - "AI bilan tahlil qilish" tugmasini qo'shish (ixtiyoriy foydalanish uchun);
  - Aniq ustunlar ajratilishini tekshirish;
  - Preview jadvalida har bir o'quvchini tahrirlash/tekshirish imkoniyati.

---

### 🌊 Wave 4: TDD Sinovlari, To'liq Regressiya va Faqat Lokal Git
- [ ] **Task 4.1: Yangi testlar yozish**
  - `frontend/tests/table-pagination.test.ts`
  - `frontend/tests/excel-parser-integration.test.ts`
  - `backend/tests/test_excel_parser.py`
- [ ] **Task 4.2: To'liq regressiya tekshiruvi**
  - `npm run test:backend` (barcha testlar 100% GREEN)
  - `npm run test:frontend` (barcha testlar 100% GREEN)
  - `npm run typecheck` (0 xato)
- [ ] **Task 4.3: Faqat Lokal Git Commit**
  - Conventional commit: `feat(pagination): add 10-20-30-50 table pagination and intelligent excel ai parser`
