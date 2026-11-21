---
type: user
created: 2026-07-18
updated: 2026-11-11
---

# User Preferences

## 🔴 Qat'iy Ish Tartibi Qoidasi (Mandatory Execution Protocol)
Foydalanuvchi qat'iy talab qilgan va har bir so'rov/prompt uchun majburiy bo'lgan qoida:
1. **Oldin Mukammal Arxitektura Rejasi (Plan):** Har qanday vazifa yoki takomillashtirish boshlanishidan oldin `docs/` papkasida senior darajadagi batafsil reja (`.md` fayli) tuziladi.
2. **Vazifalarga Ajratish (Atomic Tasks):** Reja aniq ketma-ketlikdagi atomik tasklarga (Wave / Task) bo'linadi.
3. **Har bir Taskdan Keyin Testlash (TDD / Comprehensive Testing):** Har bir task bajarilgach, unga alohida professional unit/integration testlar yoziladi va barcha testlar (100% PASS) yashil bo'lishi shart.
4. **Lokal Git (GitHub-ga push qilinmaydi):** Har bir bosqich Conventional Commits asosida faqat lokal Git'da commit qilinadi. GitHub-ga hech qachon avtomatik push qilinmaydi (faqat foydalanuvchi alohida so'ragandagina).
5. **Real Hayotiy & Professional UI/UX Standarti:** Hech qanday "mock-up" yoki oddiy chala ko'rinishlar qabul qilinmaydi; barcha grafiklar, diagrammalar va hisobotlar real hayotiy EdTech platformalar (MNO, Attestatsiya, OECD PISA standartlari) kabi yuqori darajada, zamonaviy SVG va to'liq Dark Mode / WCAG 2.1 AA bilan bajariladi.
