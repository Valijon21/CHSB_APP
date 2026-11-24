# 📋 Arxitektura va Amalga Oshirish Rejasi: eMaktab Excel Jurnallari, 11-A Sinf Ma'lumotlarini Moslashtirish va Fanlarda 2 Guruhga Bo'linish Tizimi

---

## 🎯 1. Maqsad va Kirish

Ushbu loyihaning maqsadi:
1. Loyiha ma'lumotlar bazasi va demo ma'lumotlarini foydalanuvchining haqiqiy **`11-A-Informatika-20_11_2026.xls`** elektron eMaktab jurnali faylidagi aniq ma'lumotlarga (o'qituvchi, 11-A sinf, 15 nafar haqiqiy o'quvchilar va ularning eMaktab ID raqamlari) to'liq moslashtirish;
2. Maktablarda ayrim fanlar (Informatika, Chet tili, Rus tili, Texnologiya) bo'yicha sinflar **2 guruhga bo'linishi** (`1-guruh` va `2-guruh`) mantiqini ma'lumotlar bazasidan tortib frontend foydalanuvchi interfeysigacha to'liq joriy etish;
3. Excel fayli yuklanganda yoki matndan o'quvchilar import qilinganda:
   - Agar fayl/matn ichida `1-gurux` yoki `1-guruh` yozilgan bo'lsa -> bazaga `1-guruh` qilib saqlash;
   - Agar `2-gurux` yoki `2-guruh` yozilgan bo'lsa -> bazaga `2-guruh` qilib saqlash;
4. Barcha sahifalarda (Sinflar boshqaruvi, O'quvchilar ro'yxati, Imtihon yaratish, Imtihon topshirish, eMaktab sinxronizatsiyasi, Hisobotlar va Tahlillar) sinf tanlanganda, agar sinfda guruhlar mavjud bo'lsa, **guruhni ham tanlay olish** (`1-guruh`, `2-guruh` yoki `Butun sinf`) va imtihonga faqat o'sha guruh o'quvchilarini kiritish imkoniyatini yaratish.

---

## 🏛️ 2. Arxitektura va Relyatsion Sxema O'zgarishlari

### 2.1 Prisma Schema (`prisma/schema.prisma`)
```prisma
model Student {
  id           String   @id @default(uuid())
  schoolId     String   @map("school_id")
  classGroupId String   @map("class_group_id")
  tenantId     String   @map("tenant_id")
  rosterCode   String   @unique @map("roster_code")
  firstName    String   @map("first_name")
  lastName     String   @map("last_name")
  middleName   String?  @map("middle_name")
  gender       String   @default("M")
  birthDate    DateTime @map("birth_date")
  status       String   @default("ELIGIBLE")
  group        String?  @default("1-guruh") @map("group") // "1-guruh" | "2-guruh" | null
  emaktabId    String?  @map("emaktab_id")                 // masalan: "1000001990090"
  createdAt    DateTime @default(now()) @map("created_at")

  school     School              @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  classGroup ClassGroup          @relation(fields: [classGroupId], references: [id], onDelete: Cascade)
  tenant     Tenant              @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  attempts   AssessmentAttempt[]
  results    AssessmentResult[]

  @@map("students")
}

model ClassGroup {
  id           String   @id @default(uuid())
  schoolId     String   @map("school_id")
  tenantId     String   @map("tenant_id")
  name         String
  gradeLevel   Int      @map("grade_level")
  shift        Int      @default(1)
  academicYear String   @default("2026-2027") @map("academic_year")
  studentCount Int      @default(0) @map("student_count")
  hasGroups    Boolean  @default(true) @map("has_groups")  // Sinf guruhlarga bo'linadimi?
  createdAt    DateTime @default(now()) @map("created_at")

  school   School    @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  tenant   Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  students Student[]

  @@map("class_groups")
}

model Assessment {
  id              String   @id @default(uuid())
  code            String   @unique
  title           String
  subject         String
  gradeLevel      Int      @map("grade_level")
  targetGroup     String?  @default("all") @map("target_group") // "all" | "1-guruh" | "2-guruh"
  durationMinutes Int      @default(45) @map("duration_minutes")
  totalQuestions  Int      @default(15) @map("total_questions")
  maxScore        Float    @default(40.0) @map("max_score")
  createdAt       DateTime @default(now()) @map("created_at")

  questions Question[]
  attempts  AssessmentAttempt[]

  @@map("assessments")
}
```

---

## 🌊 3. Bosqichma-bosqich Atomik Vazifalar (Wave & Task Breakdown)

### 🌊 Wave 1: Ma'lumotlar Bazasi va Haqiqiy eMaktab Roster Seeder
- [x] **Task 1.1: Prisma sxemasini yangilash**
  - `Student` ga `group` va `emaktabId` maydonlarini qo'shish;
  - `ClassGroup` ga `hasGroups` maydonini qo'shish;
  - `Assessment` ga `targetGroup` maydonini qo'shish;
  - `npx prisma db push` va `python -m prisma generate` ni ishga tushirish.
- [x] **Task 1.2: Haqiqiy 11-A Informatika jurnali asosida Seeder skriptini yangilash**
  - O'qituvchi: `Dilmurod Rahmataliyevich Yunusov` (`teacher_ax` profiliga biriktirish);
  - 11-A sinf 1-guruh o'quvchilari (15 nafar):
    1. Abduraximova Zuxra (ID: 1000001990090, STU-1101, 1-guruh)
    2. Abdusattorova Xayrixon (ID: 1000003598248, STU-1102, 1-guruh)
    3. Abdug‘afforova Madinabonu (ID: 1000001990091, STU-1103, 1-guruh)
    4. Axmadjonova Zaxro (ID: 1000003569688, STU-1104, 1-guruh)
    5. Davlataliyev O‘ktamjon (ID: 1000001990096, STU-1105, 1-guruh)
    6. Ergashaliyeva Zilola (ID: 1000004307678, STU-1106, 1-guruh)
    7. Ergashev Nurhayit (ID: 1000001990098, STU-1107, 1-guruh)
    8. Ergasheva Nazira (ID: 1000003569692, STU-1108, 1-guruh)
    9. Jurabayeva Madina (ID: 1000001990100, STU-1109, 1-guruh)
    10. Odilov O‘tkirbek (ID: 1000003673332, STU-1110, 1-guruh)
    11. Ozatboyeva Gullola (ID: 1000001990109, STU-1111, 1-guruh)
    12. Sobirjonova Durdona (ID: 1000003594807, STU-1112, 1-guruh)
    13. Umaraliyeva Feruza (ID: 1000001990115, STU-1113, 1-guruh)
    14. Valijonova Sevdora (ID: 1000020620646, STU-1114, 1-guruh)
    15. Miradjonova Shabnam (ID: 1000003569665, STU-1115, 1-guruh)
  - 11-A sinf 2-guruh o'quvchilari (15 nafar, STU-1116 ... STU-1130, 2-guruh);
  - `prisma/seed.ts` va `backend/app/db/seed.py` ni qayta seed qilish.

---

### 🌊 Wave 2: Backend API Qatlami va Guruh Filtrlash Dvigateli
- [x] **Task 2.1: `students.py` endpointlarini kengaytirish**
  - `GET /api/v1/students?tenantSlug=...&classGroupId=...&group=1-guruh`: guruh parametri bo'yicha filtrlash;
  - `StudentCreate` Pydantic modeliga `group: str | None = "1-guruh"` va `emaktabId: str | None = None` qo'shish.
- [x] **Task 2.2: `classes.py` endpointlarini kengaytirish**
  - `GET /api/v1/classes`: har bir sinf uchun `hasGroups`, `groupCounts: { "1-guruh": 15, "2-guruh": 15 }` qaytarish;
  - `GET /api/v1/classes/{class_id}`: `group` query parametrini qabul qilish va guruh kesimidagi o'quvchilar hamda o'rtacha ballarni hisoblash.
- [x] **Task 2.3: `auth.py` va `assessments.py` ni moslashtirish**
  - O'quvchi Roster lookup javobida o'quvchining `group` ini ko'rsatish;
  - Imtihonlar ro'yxatida `targetGroup` bo'yicha tekshirish: agar imtihon faqat `1-guruh` uchun bo'lsa, `2-guruh` o'quvchisiga ushbu imtihon ko'rsatilmasligi yoki taqiqlanishi.
- [x] **Task 2.4: Backend unit & integratsiya testlari (100% PASS)**
  - `backend/tests/test_api.py` va yangi testlarni yashil o'tkazish.

---

### 🌊 Wave 3: Excel & eMaktab Parserini Guruhlarni Avtomat Aniqlashga Moslashtirish
- [x] **Task 3.1: `rosterParserService.ts` ni takomillashtirish**
  - Fayl sarlavhasidagi `1-gurux`, `1-guruh`, `2-gurux`, `2-guruh` so'zlarini regex bilan aniqlash:
    ```typescript
    const groupMatch = rawInput.match(/(?:1|2)[-\s]*(?:guruh|gurux)/i);
    const detectedGroup = groupMatch ? (groupMatch[0].startsWith('1') ? '1-guruh' : '2-guruh') : '1-guruh';
    ```
  - eMaktab ID raqamini (ustun 2: `100000...`) o'quvchi ma'lumotiga kiritish;
  - Har bir o'quvchiga `group: detectedGroup` biriktirish.
- [x] **Task 3.2: `BulkStudentImportModal.vue` ni yangilash**
  - O'qituvchiga guruhni tanlash imkonini beruvchi selector qo'shish: `1-guruh`, `2-guruh`, `Butun sinf`;
  - Excel yuklanganda sarlavhadan avtomatik guruhni tanlash;
  - Import qilinayotgan jadvalda guruh ustunini ko'rsatish.

---

### 🌊 Wave 4: Frontend UI Sahifalarida Guruhlarni Tanlash va Filtrlash
- [x] **Task 4.1: `TeacherClassDetailView.vue` (Sinf ko'rinishi)**
  - Sinf ichida guruh tanlagich (Segmented Tabs):
    - `Barcha o'quvchilar (30)`
    - `1-guruh (15 o'quvchi)`
    - `2-guruh (15 o'quvchi)`
  - Tanlangan guruhga qarab ro'yxat, o'rtacha ball va tahlillarni filtrlab ko'rsatish.
- [x] **Task 4.2: `TeacherStudentsView.vue` (O'quvchilar ro'yxati)**
  - Sinf filtrining yoniga `Guruh` filtrini qo'shish (`Barchasi`, `1-guruh`, `2-guruh`);
  - Jadvalda har bir o'quvchining guruh nishoni (Badge)ni ko'rsatish.
- [x] **Task 4.3: `CreateAssessmentModal.vue` va `TeacherAssessmentsView.vue`**
  - Imtihon yaratishda `Mo'ljallangan guruh`: `Butun sinf (Barchasi)`, `1-guruh`, `2-guruh` variantlarini kiritish;
  - Imtihon kartasida qaysi guruhga tegishli ekanligini ko'rsatish.
- [x] **Task 4.4: O'quvchi Imtihon Qabuli va Ish Maydoni (`student-admission`)**
  - Roster kodi (masalan, `STU-1101`) kiritilganda tasdiqlash kartasida `11-A sinf (1-guruh)` deb chiqarish;
  - Faqat o'quvchining guruhi uchun mo'ljallangan imtihonlarni taqdim etish.
- [x] **Task 4.5: `TeacherReportsView.vue` va `TeacherResultsView.vue`**
  - Hisobotlarni sinf bo'yicha hamda alohida `1-guruh` yoki `2-guruh` kesimida filtrlash va chop etish (Print A4).

---

### 🌊 Wave 5: To'liq TDD Sinovlari, Verifikatsiya va Faqat Lokal Git
- [x] **Task 5.1: Backend va Frontend avtomatlashtirilgan testlari (100% PASS)**
  - Backend pytest barcha 27 testlari yashil (100% GREEN);
  - Frontend Vitest 379 testlari yashil (100% GREEN);
  - TypeScript strict typecheck (0 xato).
- [x] **Task 5.2: Faqat Lokal Git Conventional Commit**
  - Barcha o'zgarishlarni `feat(groups): complete 2-group class division and emaktab excel integration across frontend and backend` sifatida faqat lokal gitga commit qilish (GitHub-ga push qilinmaydi).
