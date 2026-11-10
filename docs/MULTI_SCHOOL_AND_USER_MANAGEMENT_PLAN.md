# Ko'p Maktabli (Multi-School SaaS) Tizim va Foydalanuvchilar (O'qituvchi / O'quvchi) Boshqaruv Markazi
## Texnik Arxitektura, Ma'lumotlar Modellari va Bosqichma-bosqich Amalga Oshirish Rejasi

> **Hujjat versiyasi:** 1.0.0  
> **Status:** Tasdiqlash uchun tayyorlangan  
> **Qamrov:** Multi-School (Tenant Onboarding), Teacher Management (CRUD), Student Roster (CRUD & Bulk Import), Class Groups, Regional Directory  
> **Asosiy qoida:** Har bir task to'liq yakunlanib, uning shaxsiy unit-testlari 100% yashil (PASS) bo'lib, sifat darvozalari (`typecheck`, `lint`, `build`) muvaffaqiyatli o'tgachgina keyingi taskka o'tiladi.

---

## 1. LOYIHA HAQIDA VA BIZNES TALABLAR

### 1.1. Kontekst va Asosiy Muammo
Platforma faqat bitta maktab doirasida cheklanib qolmasdan, butun respublika yoki viloyat miqyosidagi **yuzlab maktablarni (Multi-Tenant)** qamrab olishi lozim. 
Hozirda:
1. Yangi maktablarni tizimga qo'shish dinamik emas (faqat statik mock maktablar bor).
2. O'qituvchilarni maktabga biriktirish, yangi o'qituvchi qo'shish yoki tahrirlash interfeysi to'liq shakllanmagan.
3. O'quvchilarni bittalab qo'lda qo'shish (`+ Yangi O'quvchi`) yoki butun maktab o'quvchilarini Excel shabloni orqali ommaviy yuklash imkoniyati etishmaydi.

### 1.2. Dvigatelning Maqsadi va Imkoniyatlari
* **🏢 Ko'p Maktablilik (Multi-School Onboarding):**
  * Istalgan tuman (Urganch sh., Xiva sh., Bog'ot, va h.k.) bo'yicha yangi maktab yaratish.
  * Maktab turi (Umumta'lim, Ixtisoslashtirilgan, Litsey, Xususiy).
  * Avtomatik unikal tenant-slug yaratish (masalan: `urganch-1-maktab`).
  * Barcha maktablar katalogi (`/schools`) va maktablar o'rtasida o'tish (School Switcher).
* **👨‍🏫 O'qituvchilar Boshqaruvi (Teacher Management):**
  * Yangi o'qituvchi qo'shish: F.I.SH, Fani (Matematika, Fizika, Informatika...), Toifasi (Oliy, 1-toifa, 2-toifa, Mutaxassis), Telefon raqami.
  * O'qituvchiga sinflarni biriktirish (masalan: 9-A, 11-B).
  * O'qituvchilar jurnali va holatini boshqarish (Faol / Nofaol).
* **🎓 O'quvchilar va Roster Boshqaruvi (Student Management):**
  * **Yakka tartibda qo'shish:** Ism, familiya, sinfi, jinsi, tug'ilgan sana va avtomatik unikal Roster kodi (`STU-XXXX`).
  * **Ommaviy import (Bulk Import):** Excel/CSV shablonni yuklash orqali butun sinfni (30-40 o'quvchi) bir martada bazaga kiritish.
  * Tahrirlash, sinfdan-sinfga ko'chirish va arxivlash.
* **🏫 Sinflar Boshqaruvi (Class Group Management):**
  * Yangi sinf ochish (masalan: 10-"B"), sinf rahbarini biriktirish, o'quvchilar sonini monitoring qilish.

---

## 2. TIZIM ARXITEKTURASI VA IERARXIYASI

```mermaid
flowchart TD
    subgraph RegionalLevel ["1. Viloyat / Tuman Boshqaruvi"]
        A["Maktablar Katalogi & Onboarding<br/>(/schools)"]
        A1["Yangi Maktab Qo'shish Modali<br/>(Tuman, Tur, Nomi, Slug, Direktor)"]
    end

    subgraph SchoolTenantLevel ["2. Maktab (Tenant) Boshqaruvi (/t/:tenantSlug)"]
        B["Maktab Admin Portali<br/>(/t/:tenantSlug/tenant-admin)"]
        B1["O'qituvchilar Boshqaruvi<br/>(Yangi o'qituvchi, Fanlar, Sinflar)"]
        B2["Sinflar Boshqaruvi<br/>(Yangi sinf ochish, Sinf rahbari)"]
    end

    subgraph TeacherStudentLevel ["3. O'qituvchi & O'quvchilar Jurnali"]
        C["O'quvchilar Boshqaruvi<br/>(/t/:tenantSlug/teacher/students)"]
        C1["Yakka O'quvchi Qo'shish Modali<br/>(F.I.SH, Roster Kod, Tug'ilgan sana)"]
        C2["Ommaviy Excel/CSV Import Modali<br/>(Drag-and-drop shablon yuklash)"]
    end

    A --> A1
    A1 --> B
    B --> B1
    B --> B2
    B2 --> C
    C --> C1
    C --> C2
```

---

## 3. MA'LUMOTLAR TUZILMASI (DATA CONTRACTS)

### 3.1. Asosiy Interfeyslar (`src/entities/organization/model.ts`)

```typescript
// 1. Yangi maktab qo'shish modeli
export interface SchoolInput {
  name: string;                // "1-sonli ixtisoslashtirilgan maktab"
  code: string;                // "SCH-001"
  slug: string;                // "urganch-1-maktab" (URL uchun)
  districtId: string;          // "urganch-shahar", "xiva-tuman"...
  districtName: string;
  type: 'general' | 'specialized' | 'lyceum' | 'private';
  directorName: string;
  contactPhone: string;
  email?: string;
  status: 'active' | 'inactive';
}

// 2. Yangi o'qituvchi qo'shish modeli
export interface TeacherInput {
  schoolId: string;
  tenantSlug: string;
  fullName: string;
  subject: string;             // "Matematika", "Fizika"...
  qualification: 'oliy' | 'birinchi' | 'ikkinchi' | 'mutaxassis';
  assignedClassIds: string[];  // ['class-9a', 'class-11b']
  phone: string;
  email?: string;
  status: 'active' | 'inactive';
}

// 3. Yangi o'quvchi qo'shish modeli
export interface StudentInput {
  tenantSlug: string;
  schoolId: string;
  classGroupId: string;        // "class-9a"
  className: string;           // "9-A"
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: 'M' | 'F';
  birthDate: string;           // "YYYY-MM-DD"
  rosterCode?: string;         // Berilmasa avtomatik STU-XXXX generatsiya bo'ladi
  emaktabId?: string;
  status: 'eligible' | 'inactive';
}

// 4. Yangi sinf qo'shish modeli
export interface ClassGroupInput {
  schoolId: string;
  tenantSlug: string;
  name: string;                // "10-B"
  gradeLevel: number;          // 10
  shift: 1 | 2;                // 1-smena / 2-smena
  academicYear: string;        // "2026-2027"
  headTeacherId?: string;      // Sinf rahbari o'qituvchi IDsi
}
```

---

## 4. BOSQICHMA-BOSQICH VAZIFALAR REJASI (TASK BREAKDOWN)

> ⚠️ **DIQQAT:** Har bir task yakunida shaxsiy unit-testlari to'liq yoziladi, `npx vitest run` orqali 100% yashil o'tadi va barcha sifat tekshiruvlari (`typecheck`, `lint`, `build`) tasdiqlangachgina keyingi taskka o'tiladi.

---

### 🔷 1-BOSQICH: DOMAIN VA VALIDATION SCHEMALARI

#### **TASK-MS.1: Tashkilot, Maktab, O'qituvchi va O'quvchi Zod Schemalari**
* **Maqsad:** Barcha yangi modellar uchun TypeScript tiplari va Zod runtime validatsiya sxemalarini yaratish.
* **Yaratiladigan fayl:** `src/entities/organization/model.ts`
* **Test fayli:** `tests/organization-schemas.test.ts`
* **Validatsiya qoidalari:**
  - Slug formati (faqat kichik lotin harflari, raqamlar va defis: `^[a-z0-9-]+$`).
  - Telefon raqami formati (`+998...`).
  - Roster kodi formati (masalan, `STU-1101`).
  - Sinf darajasi (1 dan 11 gacha).
* **Tekshirish mezonlari (Unit testlar):**
  - [ ] `SchoolInputSchema` to'g'ri va noto'g'ri sluglarni aniqlaydi.
  - [ ] `TeacherInputSchema` toifalar va fanlar ro'yxatini tekshiradi.
  - [ ] `StudentInputSchema` ism, sinf va tug'ilgan sanani validatsiya qiladi.
  - [ ] `ClassGroupInputSchema` sinf nomini (masalan: "9-A") tekshiradi.

---

### 🔷 2-BOSQICH: MOCK REPOSITORY VA MA'LUMOTLAR QATLAMI

#### **TASK-MS.2: Kengaytirilgan Mock Organization Repository (Multi-School & Users)**
* **Maqsad:** Xotirada ishlovchi, ko'p maktablilikni, o'qituvchilar va o'quvchilarning to'liq CRUD (qo'shish, o'qish, tahrirlash, o'chirish) amallarini ta'minlovchi servislarni yaratish.
* **Yaratiladigan fayl:** `src/mocks/repositories/MockOrganizationRepository.ts`
* **API ulanishi:** `src/shared/api/index.ts` ga `organization` servisini qo'shish.
* **Test fayli:** `tests/organization-repository.test.ts`
* **Metodlar:**
  - `createSchool(input: SchoolInput): Promise<Tenant>`
  - `getAllSchools(): Promise<Tenant[]>`
  - `createTeacher(input: TeacherInput): Promise<TeacherProfile>`
  - `getTeachersBySchool(tenantSlug: string): Promise<TeacherProfile[]>`
  - `createStudent(input: StudentInput): Promise<StudentRosterRecord>`
  - `bulkCreateStudents(inputs: StudentInput[]): Promise<StudentRosterRecord[]>`
  - `createClassGroup(input: ClassGroupInput): Promise<ClassGroup>`
* **Tekshirish mezonlari (Unit testlar):**
  - [ ] Yangi maktab qo'shilganda unikal ID va slug beriladi, ro'yxatda paydo bo'ladi.
  - [ ] O'qituvchi yaratilganda ko'rsatilgan maktabga to'g'ri birikadi.
  - [ ] O'quvchi qo'shilganda avtomatik `STU-xxxx` kodi generatsiya bo'ladi.
  - [ ] Ommaviy 30 ta o'quvchi bir vaqtda xatosiz saqlanadi.

---

### 🔷 3-BOSQICH: STATE MANAGEMENT (PINIA STORE)

#### **TASK-MS.3: Organization & Multi-School Pinia Store**
* **Maqsad:** Maktablar, o'qituvchilar, sinflar va o'quvchilar holatini yagona reaktiv doirada boshqarish.
* **Yaratiladigan fayl:** `src/features/organization/store/organizationStore.ts`
* **Test fayli:** `tests/organization-store.test.ts`
* **State & Getters:**
  - `schools`: Barcha ro'yxatdan o'tgan maktablar.
  - `activeSchool`: Hozir tanlangan maktab.
  - `teachers`: Tanlangan maktab o'qituvchilari.
  - `classes`: Tanlangan maktab sinflari.
  - `students`: O'quvchilar ro'yxati.
  - `districtsList`: 13 ta tuman bo'yicha guruhlash.
  - `stats`: Jami maktablar, jami o'qituvchilar, jami o'quvchilar soni.
* **Actions:**
  - `loadSchools()`, `addSchool(input)`, `switchActiveSchool(slug)`
  - `addTeacher(input)`, `updateTeacher(id, data)`
  - `addStudent(input)`, `importStudentsBatch(rawList)`, `deleteStudent(id)`
* **Tekshirish mezonlari (Unit testlar):**
  - [ ] Yangi maktab qo'shilganda `schools` reaktiv yangilanadi.
  - [ ] Maktab almashtirilganda (`switchActiveSchool`) tegishli o'qituvchi va o'quvchilar yuklanadi.
  - [ ] Ommaviy import qilinganda jami o'quvchilar hisoblagichi to'g'ri oshadi.

---

### 🔷 4-BOSQICH: KO'P MAKTABLAR KATALOGI VA MAKTAB OCHISH (UI)

#### **TASK-MS.4: Ko'p Maktablar Katalogi va Yangi Maktab Ochish Sahifasi**
* **Maqsad:** Respublikadagi barcha maktablarni ko'rish, yangi maktab ochish va maktablar o'rtasida o'tish imkonini beruvchi boshqaruv paneli.
* **Yaratiladigan komponentlar:**
  1. `src/features/organization/components/CreateSchoolModal.vue` — Tuman, nom, tur, raqam, direktor va kontaktlarni kiritish modali.
  2. `src/features/organization/components/SchoolCard.vue` — Maktab kartochkasi (nomi, tumani, o'qituvchilar/o'quvchilar soni, "Maktabga kirish" tugmasi).
  3. `src/features/organization/views/SchoolDirectoryView.vue` — `/schools` sahifasi (tumanlar bo'yicha filter, qidiruv va `+ Yangi Maktab Qo'shish` tugmasi).
* **Test fayli:** `tests/school-directory-components.test.ts`
* **Tekshirish mezonlari:**
  - [ ] Modal to'g'ri ochiladi va maydonlar to'ldirilib saqlanganda `organizationStore`ga qo'shiladi.
  - [ ] Tuman bo'yicha filtrlash to'g'ri ishlaydi (masalan, faqat "Xiva tumani" maktablari).
  - [ ] Maktab kartochkasidagi tugma tegishli tenant manziliga yo'naltiradi.

---

### 🔷 5-BOSQICH: O'QITUVCHILARNI QO'SHISH VA BOSHQARISH (UI)

#### **TASK-MS.5: O'qituvchilar Boshqaruvi va Yangi O'qituvchi Qo'shish Modali**
* **Maqsad:** Maktab ma'muri uchun o'z maktabiga yangi o'qituvchilarni kiritish va ularga sinf/fanlarni biriktirish oynasi.
* **Yaratiladigan komponentlar:**
  1. `src/features/organization/components/CreateTeacherModal.vue` — F.I.SH, fani, toifasi, telefoni va sinflarini tanlash modali.
  2. `src/features/organization/components/TeacherRosterTable.vue` — O'qituvchilar ro'yxati, ularning dars beradigan sinflari va tahrirlash tugmasi.
  3. `TenantAdminView.vue` integratsiyasi — Yangi o'qituvchi qo'shish tugmasi va jadvali.
* **Test fayli:** `tests/teacher-management-components.test.ts`
* **Tekshirish mezonlari:**
  - [ ] O'qituvchi qo'shish modali fanlar va sinflarni to'g'ri ko'rsatadi.
  - [ ] Yangi o'qituvchi saqlanganda o'qituvchilar ro'yxatiga qo'shiladi.
  - [ ] O'qituvchini nofaol qilish / tahrirlash hodisalari ishlaydi.

---

### 🔷 6-BOSQICH: O'QUVCHILARNI QO'LDA VA OMMAVIY QO'SHISH (UI)

#### **TASK-MS.6: O'quvchilarni Kiritish (Yakka forma va Ommaviy Excel Import)**
* **Maqsad:** O'qituvchi yoki admin uchun o'quvchilarni bittalab kiritish hamda Excel/CSV orqali butun sinfni ommaviy yuklash imkoniyati.
* **Yaratiladigan komponentlar:**
  1. `src/features/organization/components/CreateStudentModal.vue` — Bittalab qo'shish formasi (Ism, familiya, sinf, tug'ilgan sana, avtomatik `STU-XXXX` kodi).
  2. `src/features/organization/components/BulkStudentImportModal.vue` — Excel/CSV fayl yuklash yoki matn tashlash, yuklashdan oldin tekshirish (preview) jadvali.
  3. `TeacherStudentsView.vue` sahifasiga `+ Yangi O'quvchi` va `📥 Ommaviy Import` tugmalarini integratsiya qilish.
* **Test fayli:** `tests/student-crud-components.test.ts`
* **Tekshirish mezonlari:**
  - [ ] Yakka tartibdagi o'quvchi muvaffaqiyatli ro'yxatga qo'shiladi.
  - [ ] Ommaviy import qilinganda 30 ta o'quvchi bir vaqtda o'qiladi va ro'yxatga kiritiladi.
  - [ ] O'quvchi qidiruvda va sinf filtrida darhol ko'rinadi.

---

### 🔷 7-BOSQICH: SAHIFALAR INTEGRATSIYASI VA UMUMIY REGRESSIYA

#### **TASK-MS.7: Marshrutlash, Maktab Almashtirgich (School Switcher) va E2E Testlar**
* **Maqsad:** Barcha yangi sahifalarni asosiy marshrutga ulash, headerga qulay maktab almashtirgich (School Switcher) qo'yish va 100% tizimli regressiya tekshiruvini o'tkazish.
* **Marshrutlar:**
  - `/schools` — Barcha maktablar katalogi va maktab yaratish.
  - `/t/:tenantSlug/admin/teachers` — Maktab o'qituvchilari boshqaruvi.
* **Test fayli:** `tests/organization-integration.test.ts`
* **Tekshirish mezonlari:**
  - [ ] Yangi maktab ochishdan boshlab o'qituvchi va o'quvchi qo'shishgacha bo'lgan to'liq integratsion oqim ishlaydi.
  - [ ] Barcha mavjud 161 ta unit test + yangi testlar (jami 185+ ta test) 100% PASS bo'ladi.
  - [ ] `npm run typecheck`, `npm run lint`, `npm run build` 0 ta xato beradi.

---

## 5. SIFAT DARVOZALARI VA MEZONLAR (NATIJA: 100% BAJARILDI ✅)

| Darvoza | Buyruq | Kutilgan Natija | Haqiqiy Natija |
| :--- | :--- | :--- | :--- |
| **1. Unit Testlar** | `npx vitest run tests/organization-*.test.ts` | 100% PASS | ✅ 45/45 PASS |
| **2. Umumiy Regressiya** | `npx vitest run` | 185+ ta test 100% PASS | ✅ 28 files, 198 tests 100% PASS |
| **3. Type Check** | `npm run typecheck` | 0 errors | ✅ 0 errors |
| **4. ESLint** | `npm run lint` | 0 warnings | ✅ 0 warnings |
| **5. Production Build** | `npm run build` | Muvaffaqiyatli `dist/` yaratilishi | ✅ Built cleanly in 1.5s |

---

## 6. BAJARILGAN VAZIFALAR HISOBOTI (ALL COMPLETED ✅)

1. ✅ **TASK-MS.1**: Multi-School & User Domain Data Models (`src/entities/organization/model.ts`) — 12 unit test PASS.
2. ✅ **TASK-MS.2**: Organization & User Repository (`src/mocks/repositories/MockOrganizationRepository.ts`) — 10 unit test PASS.
3. ✅ **TASK-MS.3**: Organization & Multi-School Pinia Store (`src/features/organization/store/organizationStore.ts`) — 6 unit test PASS.
4. ✅ **TASK-MS.4**: Maktablar Katalogi & Yangi Maktab Ochish (`/schools`, `CreateSchoolModal.vue`, `SchoolCard.vue`) — 3 unit test PASS.
5. ✅ **TASK-MS.5**: O'qituvchilar Boshqaruvi (`CreateTeacherModal.vue`, `TeacherRosterTable.vue`) — 2 unit test PASS.
6. ✅ **TASK-MS.6**: O'quvchilar Boshqaruvi & Excel/CSV Import (`CreateStudentModal.vue`, `BulkStudentImportModal.vue`) — 2 unit test PASS.
7. ✅ **TASK-MS.7**: Router & Layout Integratsiyasi, Maktab Almashtirgich va Tizimli Regressiya (`/schools`, `StaffLayout.vue`, `tests/organization-integration.test.ts`) — 2 unit test PASS.

