# CHSB Platform — Technical Decisions Log

## Qabul qilingan texnik qarorlar

### TEC-001: Vue 3 + TypeScript Strict Mode + Vite Tanlovi
- **Sana:** 2026-11-06
- **Status:** Tasdiqlangan (Baseline)
- **Kontekst:** Loyihaning Frontend V2 arxitekturasi tezkor, turlari qat'iy va uzoq muddatli qo'llab-quvvatlashga mos bo'lishi kerak.
- **Qaror:** Vue 3 Composition API (`<script setup>`), TypeScript strict mode va Vite ekotizimi tanlandi.
- **Sabab:** TypeScript strict runtime xatoliklarni oldini oladi, Vite tezkor HMR va yengil bundle beradi.
- **Muqobillar:** React/Next.js (hujjatlarda Vue 3 tasdiqlangani uchun rad etildi).

### TEC-002: Multi-Tenant Marshrutlash Shabloni
- **Sana:** 2026-11-06
- **Status:** Tasdiqlangan
- **Kontekst:** Platforma ko'p muassasali (multi-tenant) bo'lib, o'quvchilar va xodimlar o'z maktablari doirasida ishlashi kerak.
- **Qaror:** Barcha asosiy yo'nalishlar `/t/:tenantSlug/...` prefiksi orqali tashkil etiladi.
- **Sabab:** Brauzer URL orqali tenant konteksti aniq bo'ladi va state refresh qilinganda ham tenant yo'qolmaydi.

### TEC-003: Typed Repository Pattern (Dependency Injection)
- **Sana:** 2026-11-06
- **Status:** Tasdiqlangan
- **Kontekst:** Hozir faqat Frontend ishlab chiqiladi, kelajakda Django REST Framework API ulanadi.
- **Qaror:** Barcha ma'lumotlar manbalari repository interfeyslari orqali boshqariladi (`AssessmentRepository`, `RosterRepository`). Komponentlar bevosita mock yoki `fetch` chaqirmaydi.
- **Sabab:** Keyinchalik Django API ga o'tishda Vue komponentlarini birorta qatorini o'zgartirmasdan, faqat HTTP Repository implementatsiyasini ulash kifoya qiladi.

### TEC-004: Javob Kalitlarini Frontendga Joylamaslik
- **Sana:** 2026-11-06
- **Status:** Tasdiqlangan (Xavfsizlik qoidasi)
- **Kontekst:** Test o'tkazish platformasida o'quvchi bundle yoki tarmoq so'rovlarini ko'rib, to'g'ri javoblarni bilib olmasligi shart.
- **Qaror:** To'g'ri javoblar kaliti (answer keys) va baholash sirlari student-facing bundle ichiga kiritilmaydi. Mock baholash ham demo rejimida o'tadi.

