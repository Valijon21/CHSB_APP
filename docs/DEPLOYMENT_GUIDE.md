# CHSB Assessment Platform - Bepul Serverga Joylashtirish Qo'llanmasi (Deployment Guide)
## All-in-One Docker + Neon Cloud PostgreSQL + Render.com / Koyeb

> **Loyiha:** CHSB Enterprise Assessment & School Intelligence Platform  
> **Arxitektura:** Vue 3 SPA + Python FastAPI + Prisma ORM + Neon.tech Serverless PostgreSQL  
> **Xarajat:** $0 / oy (100% Bepul doimiy reja)  
> **Ulanish vaqti:** ~10-15 daqiqa  

---

## 📋 Mundarija

1. [Arxitektura Umumiy Ko'rinishi](#1-arxitektura-umumiy-ko-rinishi)
2. [1-Qadam: Neon.tech dan Bepul PostgreSQL Baza Olish](#2-1-qadam-neontech-dan-bepul-postgresql-baza-olish)
3. [2-Qadam: Render.com orqali Avtomatik Joylash (Tavsiya etiladi)](#3-2-qadam-rendercom-orqali-avtomatik-joylash-tavsiya-etiladi)
4. [3-Qadam: Koyeb orqali Alternativ Bepul Joylash](#4-3-qadam-koyeb-orqali-alternativ-bepul-joylash)
5. [Tizimga Kirish va Boshlang'ich Ma'lumotlar](#5-tizimga-kirish-va-boshlang-ich-ma-lumotlar)
6. [Tez-tez So'raladigan Savollar va Muammolarni Hal Qilish (Troubleshooting)](#6-tez-tez-so-raladigan-savollar-va-muammolarni-hal-qilish)

---

## 1. Arxitektura Umumiy Ko'rinishi

All-in-One Docker arxitekturasining asosiy afzalliklari:
- **Yagona Manzil (Single Origin):** Frontend va Backend bitta domen ostida (`https://sizning-servisingiz.onrender.com`) ishlaydi. CORS xatolari butunlay bartaraf etilgan.
- **Doimiy Ma'lumotlar:** Baza Neon.tech Cloud serverlarida alohida saqlanadi. Render bepul serveri uxlab qayta uyg'onganda ham barcha o'quvchilar, baholar va natijalar xavfsiz saqlanadi.
- **Avtomatik Sinxronizatsiya:** Server birinchi marta ishga tushganda Prisma sxemani avtomatik PostgreSQL ga o'tkazadi va bazaga sinov maktablari, o'qituvchilar va savollarni yuklaydi.

---

## 2. 1-Qadam: Neon.tech dan Bepul PostgreSQL Baza Olish (3 daqiqa)

Neon.tech — ishlab chiquvchilar uchun eng yaxshi bepul serverless PostgreSQL xizmati (0.5 GB doimiy bepul, cheksiz so'rovlar).

1. [https://neon.tech](https://neon.tech) saytiga o'ting va **"Sign Up"** tugmasini bosing (GitHub hisobingiz orqali kirish tavsiya etiladi).
2. Yangi loyiha yarating (**"Create Project"**):
   - **Project name:** `chsb-database`
   - **Postgres version:** `16` yoki `17` (standart)
   - **Region:** `Frankfurt (eu-central-1)` (O'zbekistonga eng yaqin va tez ishlaydigan server)
3. Loyiha yaratilgach, ekranda **"Connection Details"** paydo bo'ladi:
   - Ro'yxatdan **"Prisma"** yoki **"Direct Connection"** ni tanlang.
   - Ulanish havolasi (Connection String) quyidagicha bo'ladi:
     ```text
     postgresql://neondb_owner:npg_AbCdEf123456@ep-cool-butterfly-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
     ```
   - Ushbu havolani nusxalab oling (Copy). Bu sizning `DATABASE_URL` qiymatingiz bo'ladi.

---

## 3. 2-Qadam: Render.com orqali Avtomatik Joylash (Tavsiya etiladi)

Render.com har oy bepul 750 soatlik Web Service (Docker) va avtomatik SSL sertifikat beradi.

### Usul A: Blueprint (render.yaml orqali 1-Click - Eng osoni)
1. [https://render.com](https://render.com) ga kiring va GitHub orqali tizimga kiring.
2. Dashboard-da **"New +"** tugmasini bosing va **"Blueprint"** ni tanlang.
3. GitHub repozitoriyangizni (`Valijon21/CHSB_APP`) ulang.
4. Render loyihadagi `render.yaml` faylini avtomatik tanib oladi:
   - **Service Name:** `chsb-platform`
   - **Environment Variables** bo'limida:
     - `DATABASE_URL` maydoniga Neon.tech dan nusxalangan havolani qo'ying.
     - `JWT_SECRET` maydoni Render tomonidan avtomatik xavfsiz generatsiya qilinadi.
     - `GEMINI_API_KEY` (ixtiyoriy, AI tahlillar kerak bo'lsa kiriting).
5. **"Apply"** tugmasini bosing!

### Usul B: Qo'lda Web Service yaratish (Manual)
Agar Blueprint ishlatmasangiz:
1. Render-da **"New +"** -> **"Web Service"** ni tanlang.
2. `Valijon21/CHSB_APP` repozitoriyasini tanlang.
3. Sozlamalarni to'ldiring:
   - **Name:** `chsb-platform`
   - **Region:** `Frankfurt (EU Central)`
   - **Branch:** `main`
   - **Runtime:** `Docker` (Multi-stage Dockerfile orqali avtomatik yig'iladi)
   - **Instance Type:** `Free`
4. **Environment Variables** bo'limiga quyidagilarni qo'shing:
   - Kalit: `DATABASE_URL` | Qiymat: `postgresql://...` (Neon.tech havolangiz)
   - Kalit: `JWT_SECRET` | Qiymat: `<kamida 32 belgili tasodifiy kalit>`
   - Kalit: `PORT` | Qiymat: `8000` (Render buni avtomatik boshqaradi)
5. **"Create Web Service"** tugmasini bosing!

Render 3-5 daqiqada konteynerni yig'adi va sizga bepul doimiy havola beradi:  
👉 `https://chsb-platform.onrender.com`

---

## 4. 3-Qadam: Koyeb orqali Alternativ Bepul Joylash

Koyeb.com ham global bepul Nano konteyner instansiyalarini taklif etadi.

1. [https://www.koyeb.com](https://www.koyeb.com) saytiga kiring.
2. **"Create Service"** -> **"GitHub"** bo'limini tanlang.
3. `Valijon21/CHSB_APP` repozitoriyasini tanlang.
4. **Builder:** `Dockerfile` ni tanlang.
5. **Environment Variables** ga `DATABASE_URL` va `JWT_SECRET` ni kiriting.
6. **"Deploy"** tugmasini bosing. Sizga `https://<loyiha>.koyeb.app` manzili beriladi.

---

## 5. Tizimga Kirish va Boshlang'ich Ma'lumotlar

Server ilk bor ishga tushganda, tizim bo'sh PostgreSQL bazasiga barcha jadvallarni va boshlang'ich sinov ma'lumotlarini (Al-Xorazmiy nomidagi IT-maktab, 11-sinflar, CHSB test savollari) avtomatik yuklaydi.

### 🔑 Sinov Akkauntlari:

| Rol | Login | Parol | Huquqlar |
|---|---|---|---|
| **O'qituvchi (Ustoz)** | `teacher_ax` | `<SEED_PASSWORD>` | Baholar, sinf monitoringi, test yaratish |
| **Maktab Admini** | `admin_ax` | `<SEED_PASSWORD>` | Maktab o'quvchilari, o'qituvchilar va audit jurnali |
| **Hududiy Inspektor** | `inspector_reg` | `<SEED_PASSWORD>` | Barcha maktablar reytingi, taqqoslash va PISA hisobotlari |
| **O'quvchi (Roster kod)** | `STU-1101` | *(Parolsiz)* | Imtihon topshirish, test savollari va shaxsiy natijalar |

---

## 6. Tez-tez So'raladigan Savollar va Muammolarni Hal Qilish

### 1. Render Free Tier-da dastur kech ochilyapti (Cold Start)
- **Sabab:** Render bepul tarifi 15 daqiqa davomida hech kim kirmasa, serverni uyqu holatiga o'tkazadi.
- **Yechim:** Birinchi so'rov yuborilganda server 30-40 soniyada uyg'onadi va keyin juda tez ishlaydi. Server uxlamasligi uchun bepul [UptimeRobot.com](https://uptimerobot.com) dan foydalanib, har 10 daqiqada `https://sizning-servisingiz.onrender.com/health` manziliga avtomatik ping qo'yib qo'yishingiz mumkin.

### 2. Baza bilan bog'lanishda SSL xatosi
- Neon.tech doimo SSL talab qiladi. Shuning uchun `DATABASE_URL` oxirida doimo `?sslmode=require` mavjudligiga ishonch hosil qiling.

### 3. API Swagger hujjatlarini ko'rish
- To'liq FastAPI Swagger interfeysi: `https://sizning-servisingiz.onrender.com/docs`
- Sog'lomlik holati: `https://sizning-servisingiz.onrender.com/health`
