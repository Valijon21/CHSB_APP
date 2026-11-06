# CHSB — Teacher Dashboard Architecture Specification

**Hujjat kodi:** TDS-2026-V2  
**Holat:** APPROVED & INTEGRATED  
**Loyiha:** CHSB Platform (Frontend V2)  
**Qamrov:** O'qituvchi boshqaruv kabineti (Teacher Workspace)  

---

## 1. Asosiy Maqsad va Konseptsiya

Teacher Dashboard — bu oddiy statik monitoring paneli emas, balki pedagogning kundalik ish muhiti (Daily Workspace) hisoblanadi. O'qituvchi yagona kabinet orqali:
1. O'ziga biriktirilgan sinflar va o'quvchilar tarkibini ko'rish;
2. CHSB imtihonlari holatini nazorat qilish;
3. O'quvchilar topshirgan natijalarni tahlil qilish;
4. Sinflararo o'zlashtirish dinamikasini solishtirish;
5. Hisobotlarni (Excel/CSV va PDF) shakllantirish va eksport qilish;
6. O'z pedagogik profilini boshqarish imkoniyatiga ega bo'ladi.

---

## 2. Modullar Arxitekturasi

### 2.1 Dashboard Overview (`/t/:tenantSlug/teacher/dashboard`)
- **Statistik KPI kartochkalari:**
  - Jami biriktirilgan sinflar soni;
  - Jami o'quvchilar soni;
  - Faol va rejalashtirilgan imtihonlar;
  - Topshirilgan ishlar va ishtirok darajasi (%);
  - O'rtacha o'zlashtirish bali.
- **Tezkor Harakatlar (Quick Actions):** Imtihon e'lon qilish, hisobot yuklash, o'quvchi kirish portaliga havola.
- **So'nggi Faoliyat (Recent Activity):** Oxirgi topshirilgan testlar va bildirishnomalar.
- **Sinflar bo'yicha qisqa ko'rinish:** Har bir sinf bo'yicha qisqa metrikalar.

### 2.2 Classes Management (`/t/:tenantSlug/teacher/classes`, `/t/:tenantSlug/teacher/classes/:classId`)
- O'qituvchiga biriktirilgan sinflar kartochkalari (11-A, 11-B va boshqalar).
- O'quvchilar soni va parallel bo'yicha ko'rsatkichlar.
- **Sinf Tafsilotlari Sahifasi (`:classId`):**
  - Sinfdagi o'quvchilar to'liq ro'yxati;
  - Sinfning o'rtacha balli va ishtirok foizi;
  - Sinf uchun rejalashtirilgan va yakunlangan testlar tarixi.

### 2.3 Students Management (`/t/:tenantSlug/teacher/students`, `/t/:tenantSlug/teacher/students/:studentId`)
- O'quvchilar to'liq Roster jadvali.
- Ism, familiya va Roster kodi bo'yicha tezkor qidiruv (Instant Search).
- Sinflar va imtihon ruxsati (`eligible`, `inactive`, `ambiguous`) bo'yicha filtrlash.
- **O'quvchi Profili Sahifasi (`:studentId`):**
  - O'quvchi shaxsiy kartochkasi (F.I.SH., sinfi, muassasasi, Roster kodi);
  - O'quvchining barcha topshirgan testlari tarixi;
  - Har bir test bo'yicha to'plangan ball va foizlar;
  - Ishtirok etish holati.

### 2.4 Assessments Management (`/t/:tenantSlug/teacher/assessments`, `/t/:tenantSlug/teacher/assessments/:assessmentId`)
- Mavjud testlar katalogi (11-sinf Informatika, I chorak 1-CHSB).
- Test davomiyligi (40 min), savollar soni (15 ta), maksimal ball (40 ball).
- Test statusi filtrlari (`available`, `scheduled`, `closed`).
- **Test Tafsilotlari Sahifasi (`:assessmentId`):**
  - Test metama'lumotlari va qoidalari;
  - Ishtirokchilar statistikasi (topshirganlar, topshirmaganlar, o'rtacha ball);
  - Savollar tuzilmasi xulosasi.

### 2.5 Results Management (`/t/:tenantSlug/teacher/results`)
- Topshirilgan ishlar bo'yicha yakuniy hisob-kitob jadvali.
- O'quvchi ismi, sinfi, test nomi, to'plangan ball va maksimal ball nisbati.
- Topshirilgan sana va vaqt.
- Tekshiruv maqomi (`provisional_demo`, `verified`).
- Qidiruv, sinf va natija darajasi (a'lo, yaxshi, qoniqarli) bo'yicha filtrlash.

### 2.6 Analytics (`/t/:tenantSlug/teacher/analytics`)
- Sinflar o'rtasidagi o'zlashtirish darajasini taqqoslash (Bar Chart vizualizatsiyasi).
- Ishtirok darajasi va qatnashmaganlar soni tahlili.
- Ballar taqsimoti histogrammasi (35-40 ball, 28-34 ball, 20-27 ball, <20 ball).
- Savollar qiyinlik darajasi bo'yicha taqsimot:
  - Bilish `(B)`
  - Qo'llash `(Q)`
  - Mulohaza `(M)`

### 2.7 Reports (`/t/:tenantSlug/teacher/reports`)
- Hisobot turlari generatori:
  1. **Sinf bo'yicha yig'ma hisobot (Class Summary Report)**
  2. **Imtihon bo'yicha hisobot (Assessment Report)**
  3. **O'quvchilar natijalari hisoboti (Student Grade Sheet)**
  4. **Davriy choraklik hisobot (Quarterly Report)**
- **Eksport imkoniyati:**
  - **Excel / CSV formati:** Haqiqiy `.csv` formatida brauzerda bir bosishda yuklab olish (UTF-8 formatida Excel va Google Sheets da xatosiz ochiladi).
  - **Chop etish / PDF formati:** Bosmaga chiqarish uchun moslashtirilgan ko'rinish.

### 2.8 Teacher Profile & Settings (`/t/:tenantSlug/teacher/profile`)
- O'qituvchining shaxsiy ma'lumotlari va pedagogik toifasi.
- Biriktirilgan maktab (Tenant) va fanlar ro'yxati.
- Tizim interfeysi sozlamalari (til, jadval qatorlari soni).
- Bildirishnoma sozlamalari (Imtihon yakunlanganda xabar berish, kam qatnashuv ogohlantirishi).

---

## 3. Qat'iy Tenant va Xavfsizlik Chegaralari

1. **Izolyatsiya:** O'qituvchi boshqa maktab (tenant) o'quvchilari yoki sinflarini aslo ko'ra olmaydi.
2. **Repository Scope:** Barcha so'rovlar `tenantId` parametri orqali filtrlanadi.
3. **Data Protection:** Maxfiy javob kalitlari yoki parollar frontendga uzatilmaydi.
4. **SaaS Layout:** Barcha sahifalar zamonaviy Sidebar navigatsiya paneli va Header bilan birlashtirilgan.
