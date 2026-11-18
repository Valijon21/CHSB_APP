# 🚀 CHSB Platform — 100% Bepul Serverlarga Joylashtirish (Free Production Deployment) Rejasi

> **Hujjat versiyasi:** 1.0.0  
> **Status:** Tasdiqlangan va Amalga oshirishga tayyor  
> **Qamrov:** Frontend (Vercel), Backend (Render / Koyeb), Database (Neon.tech PostgreSQL), Docker & CI/CD  

---

## 1. 🏛️ Bepul Arxitektura Modeli (Tavsiya etilgan Stack)

CHSB platformasi uchta alohida qatlamdan iborat bo'lgani sababli, har bir qatlam uchun jahondagi eng ishonchli va 100% bepul bulutli xizmatlardan foydalanamiz:

```mermaid
flowchart TD
    subgraph ClientLayer ["1. Frontend Qatlami (100% Bepul)"]
        Vercel["▲ Vercel Cloud (yoki Cloudflare Pages)<br/>- Global CDN Edge Caching<br/>- Avtomatik SSL (HTTPS)<br/>- Git push bilan avtomat build"]
    end

    subgraph ApiLayer ["2. Backend Qatlami (100% Bepul)"]
        Render["Render.com (yoki Koyeb)<br/>- Python 3.11 + FastAPI + Uvicorn<br/>- Avtomatik Prisma ORM generatsiyasi<br/>- Bepul Web Service"]
    end

    subgraph DataLayer ["3. Ma'lumotlar Qatlami (100% Bepul)"]
        Neon["Neon.tech (PostgreSQL Serverless)<br/>- 0.5 GB doimiy bepul PostgreSQL 16/18<br/>- Pooling qo'llab-quvvatlovi<br/>- 1-klikda DATABASE_URL olish"]
    end

    subgraph AI ["4. Sun'iy Intellekt (Bepul Tier)"]
        Gemini["Google AI Studio (Gemini 1.5 Flash)<br/>- Bepul API Key (15 RPM)"]
    end

    Vercel -->|REST API over HTTPS| Render
    Render -->|PostgreSQL Protocol SSL| Neon
    Render -->|REST API| Gemini
```

---

## 2. 📋 Bosqichma-bosqich Joylashtirish Yo'riqnomasi

### 1-BOSQICH: Bepul PostgreSQL Ma'lumotlar Bazasini Olish (Neon.tech)
*Vaqt: ~2 daqiqa*
1. **[neon.tech](https://neon.tech)** saytiga kiring va GitHub orqali ro'yxatdan o'ting.
2. **"Create Project"** tugmasini bosing:
   - Project name: `chsb-db`
   - Postgres version: `16` yoki `17`
   - Region: `Frankfurt (eu-central-1)` (O'zbekistonga eng yaqin va tezkor ping).
3. Ekranda sizga **Connection String** taqdim etiladi. Masalan:
   ```env
   DATABASE_URL="postgresql://neondb_owner:npg_xxxx@ep-xxxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
   ```
4. Ushbu manzilni nusxalab oling.

---

### 2-BOSQICH: Backendni Bepul Serverga Joylash (Render.com)
*Vaqt: ~4 daqiqa*
1. **[render.com](https://render.com)** saytiga kiring va GitHub profilingiz orqali kiring.
2. **"New +" -> "Web Service"** tugmasini bosing.
3. GitHub-dagi `CHSB_APP` repozitoriyangizni tanlang (`Connect`).
4. Quyidagi parametrlarni kiriting:
   - **Name:** `chsb-backend`
   - **Region:** `Frankfurt (EU Central)`
   - **Branch:** `main`
   - **Root Directory:** *(Bo'sh qoldiring)*
   - **Runtime:** `Python 3`
   - **Build Command:**
     ```bash
     pip install -r backend/requirements.txt && prisma generate && prisma db push
     ```
   - **Start Command:**
     ```bash
     uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type:** `Free` (0.1 CPU, 512 MB RAM).
5. **Environment Variables (Muhit o'zgaruvchilari)** bo'limiga qo'shing:
   - `DATABASE_URL`: *(Neon.tech-dan olingan PostgreSQL URL manzili)*
   - `JWT_SECRET`: `chsb-super-production-jwt-secret-key-2026`
   - `GEMINI_API_KEY`: *(Google AI Studio-dan olingan kalit - ixtiyoriy)*
   - `PYTHON_VERSION`: `3.11.9`
6. **"Deploy Web Service"** tugmasini bosing.
7. Deploy yakunlangach, sizga backend manzili beriladi:
   👉 Masalan: `https://chsb-backend.onrender.com`
   *(Ushbu manzil oxiriga `/health` qo'shib brauzerda ochib ko'ring: `{"status":"healthy"}` chiqishi kerak).*

---

### 3-BOSQICH: Frontendni Bepul Serverga Joylash (Vercel)
*Vaqt: ~2 daqiqa*
1. **[vercel.com](https://vercel.com)** ga kiring va GitHub orqali kiring.
2. **"Add New..." -> "Project"** ni bosing.
3. `CHSB_APP` repozitoriyasini tanlang (`Import`).
4. **Project Settings** da:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend` *(Edit tugmasini bosib `frontend` papkasini tanlang)*
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **Environment Variables** ga qo'shing:
   - `VITE_API_BASE_URL`: `https://chsb-backend.onrender.com/api/v1` *(2-bosqichdagi Render backend manzili)*
6. **"Deploy"** tugmasini bosing!
7. Vercel 1 daqiqada butun saytni dunyo bo'ylab CDN ga joylaydi va sizga tayyor domen beradi:
   👉 Masalan: `https://chsb-app.vercel.app`

---

## 3. 🛡️ Bepul Tariflarning Xususiyatlari va Muhim Tavsiyalar

| Platforma | Bepul Cheklov | Qanday bartaraf etish mumkin? |
| :--- | :--- | :--- |
| **Render.com (Backend)** | 15 daqiqa murojaat bo'lmasa, server "uyquga" ketadi. Keyingi so'rovda 30-40 soniyada uyg'onadi. | Bepul [cron-job.org](https://cron-job.org) yoki [UptimeRobot](https://uptimerobot.com) orqali har 10 daqiqada `/health` manziliga ping yuborib turilsa, backend umuman uxlamaydi! |
| **Neon.tech (Database)** | 0.5 GB bepul xotira beradi. | Maktab testlari va o'quvchilar natijalari uchun 0.5 GB kamida 100 000 ta urinishga bemalol yetadi. |
| **Vercel (Frontend)** | 100 GB oylik bepul trafik beradi. | Maktablar uchun bu mutlaqo bepul va ortig'i bilan yetarli. |

---

## 4. 🐳 Muqobil Variant: Docker orqali Bepul VPS ga joylash (Oracle Cloud Always Free)

Agar siz loyihani bitta joyda (uyqusiz, 100% o'zingizning to'liq serveringizda) ushlamoqchi bo'lsangiz:
1. **Oracle Cloud Free Tier** hisob ochasiz (Unda 4 ta ARM OCPU va 24 GB RAM lik server butun umrga bepul beriladi).
2. Serverga kirib repozitoriyani klon qilasiz:
   ```bash
   git clone https://github.com/Valijon21/CHSB_APP.git
   cd CHSB_APP
   docker compose up -d --build
   ```
3. PostgreSQL va FastAPI bitta komanda bilan ishga tushadi.

---

## 5. ✅ Tekshirish va Sifat Nazorati (Verification)
- [x] Frontend `npm run build` (Typecheck va Vite bundling 100% yashil).
- [x] `frontend/vercel.json` SPA routing rewrite fayli tayyorlandi (404 xatoliklarining oldi olindi).
- [x] Backend `Dockerfile` va `docker-compose.yml` tayyorlandi.
- [x] Namuna `.env.example` sozlamalari yaratildi.
