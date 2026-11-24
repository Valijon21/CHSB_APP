# Reja: Ma'lumotlar Bazasidagi Barcha O'quvchilar Ma'lumotlarini Tozalash (Database Students Wipe)

## 📌 Maqsad va Vazifa
Foydalanuvchi so'roviga binoan ma'lumotlar bazasidagi (`prisma/dev.db`) barcha o'quvchilar (`Student`) va ularga tegishli natijalar/urinishlar ma'lumotlarini to'liq tozalash, sinflar va maktablar hisoblagichlarini 0 ga qaytarish.

---

## 🏗️ Bosqichma-Bosqich Ish Tartibi (Atomic Tasks)

### Wave 1: Xavfsizlik va Zaxira Nusxasi (Backup)
- `prisma/dev.db` faylining to'liq zaxira nusxasini (`prisma/dev.db.bak`) yaratish.
- Mavjud yozuvlar sonini ro'yxatga olish:
  - `students`: 56 ta
  - `assessment_attempts`: 30 ta
  - `assessment_results`: 30 ta
  - `class_groups` (student_count): mos ravishda yangilash

### Wave 2: Ma'lumotlarni To'liq va Toza Tozalash (Cascade Purge)
- Bog'langan jadvallarni ketma-ket tozalash:
  1. `assessment_results` jadvalidan o'quvchi natijalarini o'chirish;
  2. `assessment_attempts` jadvalidan o'quvchi urinishlarini o'chirish;
  3. `students` jadvalidan barcha 56 ta yozuvni to'liq o'chirish (`DELETE FROM students;`);
  4. `class_groups` jadvalidagi `student_count` qiymatlarini 0 ga tenglashtirish;
  5. `schools` jadvalidagi `student_count` qiymatlarini 0 ga tenglashtirish.
- Baza yaxlitligini tekshirish (`PRAGMA integrity_check`).

### Wave 3: Backend API va Testlash
- `backend/app/api/v1/endpoints/students.py` ga xavfsiz ommaviy o'chirish endpointini qo'shish: `DELETE /api/v1/students?tenantSlug=...`;
- `backend/tests/test_api.py` ga ushbu o'chirish funksionalligi uchun test yozish;
- Barcha backend (36+) va frontend (399+) testlarini ishga tushirib, 100% yashil ekanligini tasdiqlash.

### Wave 4: Lokal Git Commit va Hisobot
- O'zgarishlarni faqat lokal gitga commit qilish (`feat(db): wipe all student records and reset class counters`);
- Foydalanuvchiga tozalangan yozuvlar hisobotini taqdim etish.
