# 24/7 Non-Sleeping Free Server Architecture Plan: Hugging Face Spaces (Docker)
## Enterprise Full-Stack Deployment: 16 GB RAM, 2 vCPU, 24/7 Uptime (No Spin-Down / No Sleeping)

> **Hujjat:** `docs/HUGGINGFACE_SPACES_DOCKER_DEPLOYMENT_PLAN.md`  
> **Muallif:** Senior DevOps Engineer & Solutions Architect  
> **Sana:** 2026-11-16  
> **Holati:** Tasdiqlangan va Amalga Oshirish Jarayonida  
> **Muammo:** Render bepul tarifi 15 daqiqada uxlab qoladi (spin-down), server sovub qoladi va 512 MB RAM chegarasida Docker build yoki runtime paytida o'chib qoladi (OOM crash).  
> **Yechim:** Hugging Face Spaces (Docker SDK) — 16 GB RAM, 2 vCPU, 50 GB disk, 24/7 doimiy onlayn (hech qachon uxlamaydi va o'chmaydi), 100% bepul, karta talab qilmaydi.  
> **Qoidaga Muvofiqlik:** "Reja (Plan .md) -> Tasklarga bo'lish -> Bosqichma-bosqich ishlab chiqish -> Testlash -> Git/GitHub push" qat'iy tartibi.

---

## 1. Nima uchun Hugging Face Spaces Render-dan ustun?

| Xususiyat | Render.com (Free) | Hugging Face Spaces (Docker) |
|---|---|---|
| **Faoliyat vaqti (Uptime)** | ❌ 15 daqiqada uxlab qoladi | ✅ **24/7 Doimiy yonib turadi (Uxlamaydi)** |
| **Operativ xotira (RAM)** | ❌ 512 MB (OOM xavfi yuqori) | ✅ **16 GB RAM (Keng va barqaror)** |
| **Protsessor (CPU)** | 0.1 vCPU (juda sekin) | ✅ **2 vCPU (Yuqori tezlik)** |
| **Kredit karta talabi** | Yo'q | Yo'q |
| **Oylik soat cheklovi** | ❌ 750 soat/oy | ✅ **Cheksiz 24/7/365** |
| **Domen / SSL** | `.onrender.com` (SSL bor) | `.hf.space` (Doimiy SSL bor) |

---

## 2. Rejalashtirilgan Bosqichlar (Waves & Tasks)

### Wave 1: Hugging Face Spaces Docker Moslashuvi
- **Task 1.1:** `Dockerfile` ni Hugging Face talablariga moslash:
  - Standart `PORT=7860` va `EXPOSE 7860` o'rnatish.
  - Hugging Face xavfsizlik standarti bo'yicha `UID 1000` (non-root `appuser`) foydalanuvchisini yaratish va ruxsatlarni sozlash.
- **Task 1.2:** `README.md` boshiga Hugging Face Spaces metadata (YAML frontmatter) qo'shish:
  - `sdk: docker`, `app_port: 7860`, `title: CHSB Assessment Platform`.
- **Task 1.3:** `docker-entrypoint.sh` port boshqaruvini `7860` standartiga moslash.

### Wave 2: Avtomatlashtirilgan GitHub -> Hugging Face Sinxronizatsiyasi (CI/CD)
- **Task 2.1:** `.github/workflows/sync-to-huggingface.yml` yaratish — har safar GitHub `main` ga push qilinganda kod avtomatik Hugging Face Space-ga uzatiladi va 24/7 yangilanib turadi.
- **Task 2.2:** `docs/HUGGINGFACE_DEPLOYMENT_GUIDE.md` yo'riqnomasini yozish — Hugging Face Space ochish va GitHub bilan ulash bo'yicha to'liq qo'llanma.

### Wave 3: Testlash va Tekshiruv (Comprehensive TDD / Verification)
- **Task 3.1:** `backend/tests/test_deployment_readiness.py` ga Hugging Face Space porti va ruxsatlar bo'yicha yangi testlarni kiritish.
- **Task 3.2:** Barcha testlarni ishga tushirish (Frontend 341 tests, Backend 18+ tests 100% PASS).

### Wave 4: Git Versiyalash va GitHub Push
- **Task 4.1:** O'zgarishlarni tekshirish, atomik Conventional Commit qilish va GitHub `main` tarmog'iga push qilish.
