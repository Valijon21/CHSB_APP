# Project Architecture Plan: Frontend & Backend Separation

**Hujjat turi:** Arxitektura va Tuzilma Reformatsiyasi  
**Status:** Tasdiqlangan / Amalga oshirilmoqda  
**Sana:** 2026-11-15  

---

## 1. Kontekst va Muammo (Problem Statement)
Loyihada avval Frontend fayllari (`src/`, `public/`, `tests/`, `vite.config.ts`, `package.json`, `tsconfig*.json`, `eslint.config.js`) bevosita loyiha ildizida joylashgan bo'lib, `backend/` papkasi ularning ichida bir qism kabi aralashib turgan edi.
Bu quyidagi muammolarni keltirib chiqarayotgan edi:
1. Ishlab chiquvchilar uchun qaysi fayl frontend, qaysi biri backend ekanligi noaniq;
2. CI/CD quvurlarida frontend va backend mustaqil tarzda build/test qilina olmasligi;
3. Dependency va build artefaktlarining chalkashishi.

---

## 2. Yangi Korporativ Monorepo Arxitekturasi

```text
CHSB_APP/
├── .agents/                 # AG Kit agentlari va xotira
├── backend/                 # 🐍 Python 3.11+ / FastAPI Backend
│   ├── app/
│   │   ├── api/v1/          # REST API endpointlar
│   │   ├── core/            # Konfiguratsiya va xavfsizlik (JWT, Bcrypt)
│   │   ├── db/              # Prisma Client Python ulanishi
│   │   ├── schemas/         # Pydantic schemalari
│   │   └── main.py          # FastAPI application
│   ├── tests/               # Pytest testlari
│   └── requirements.txt     # Python paketlari
├── frontend/                # ⚡ Vue 3.5 / Vite 6 / TypeScript Frontend
│   ├── src/                 # Feature-Sliced Design (app, entities, features, shared)
│   ├── public/              # Statik resurslar (favicon, assets)
│   ├── tests/               # 62 ta Vitest test fayllari
│   ├── index.html           # SPA kirish HTML
│   ├── package.json         # Frontend kutubxonalari va skriptlari
│   ├── package-lock.json    # Qulflangan versiyalar
│   ├── vite.config.ts       # Vite & Vitest sozlamalari
│   ├── tsconfig.json        # TypeScript sozlamalari
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   └── eslint.config.js     # Linter sozlamalari
├── prisma/                  # 🗄️ Yagona Ma'lumotlar Bazasi Modeli
│   ├── schema.prisma        # PostgreSQL 18 sxemasi (JS & Python clientlar uchun)
│   └── seed.ts              # Dastlabki realistik ma'lumotlar
├── docs/                    # 📚 Loyiha arxitektura va spetsifikatsiyalari
├── package.json             # 🚀 Root darajasidagi universal boshqaruv skriptlari
├── README.md                # Tizim qo'llanmasi
└── .gitignore               # Yangilangan git istisnolar fayli
```

---

## 3. Atomik Vazifalar (Atomic Tasks)

### Wave 1: Kataloglarni Ajratish va Git Tarixini Saqlash
- [x] Yangi `frontend/` katalogini yaratish.
- [x] Barcha frontend fayllarini `git mv` orqali ko'chirish (`src/`, `public/`, `tests/`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `package.json`, `package-lock.json`).

### Wave 2: Root Boshqaruv Qatlamini Yaratish
- [x] Ildiz (root) darajasida `package.json` yaratish:
  - `dev`, `dev:frontend`, `dev:backend`
  - `build`, `build:frontend`
  - `test`, `test:frontend`, `test:backend`
  - `lint`, `lint:frontend`
- [x] `.gitignore` faylini har ikki qatlam uchun yangilash.

### Wave 3: Konfiguratsiya va Yo'llar Mosligi
- [x] `frontend/vite.config.ts` va `frontend/tsconfig.app.json` nisbiy yo'llarini tekshirish.
- [x] `frontend/eslint.config.js` tekshiruvi.

### Wave 4: Hujjatlashtirish va Sinov
- [x] `README.md` faylini yangi arxitektura bilan yangilash.
- [x] Git holatini va fayllar strukturasi butunligini tekshirish.
- [x] Conventional Commit va push.
