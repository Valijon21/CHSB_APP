# Hugging Face Spaces (Docker) orqali 24/7 Doimiy Yonib Turadigan Bepul Serverga Joylash
## 16 GB RAM, 2 vCPU, 0$ Xarajat, Hech Qachon Uxlamaydigan va O'chmaydigan Platforma

> **Nima uchun Render emas, Hugging Face?**  
> Render-ning bepul tarifi 15 daqiqa harakatsizlikdan so'ng **butunlay uxlab qoladi (spin-down)** va bor-yo'g'i 512 MB RAM bergani uchun Docker build yoki og'irroq so'rovda **xotira yetmay o'chib ketadi (OOM crash)**.  
> **Hugging Face Spaces** esa:
> - **16 GB RAM** va **2 vCPU** beradi (Render-dan 32 barobar ko'proq xotira!).
> - **24/7 Doimiy yonib turadi** (Hech qachon uxlamaydi, 15 daqiqalik o'chish yo'q).
> - **100% Bepul**, kredit karta talab qilmaydi.
> - Bepul doimiy SSL domen: `https://<sizning-username>-chsb-platform.hf.space`.

---

## 📋 Qadam-baqadam Yo'riqnoma (10 daqiqa)

### 1-Qadam: Neon.tech dan Bepul PostgreSQL Baza Olish (2 daqiqa)
*(Agar oldinroq olgan bo'lsangiz, ushbu qadamni o'tkazib yuboring)*

1. [https://neon.tech](https://neon.tech) ga kiring va ro'yxatdan o'ting.
2. **"Create Project"** bosing (Project: `chsb-db`, Region: `Frankfurt (eu-central-1)`).
3. **Connection Details** bo'limidan `DATABASE_URL` havolasini nusxalab oling:
   ```text
   postgresql://user:password@ep-xyz.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

---

### 2-Qadam: Hugging Face-da Yangi "Space" Yaratish (2 daqiqa)

1. [https://huggingface.co](https://huggingface.co) saytiga kiring va bepul ro'yxatdan o'ting (yoki kiring).
2. O'ng yuqori burchakdagi profilingizni bosing va **"New Space"** ni tanlang (yoki to'g'ridan-to'g'ri [https://huggingface.co/new-space](https://huggingface.co/new-space) ga o'ting).
3. Maydonlarni to'ldiring:
   - **Space name:** `chsb-platform`
   - **License:** `mit` (yoki `apache-2.0`)
   - **Select the Space SDK:** 👉 **Docker** -> **Blank** ni tanlang!
   - **Space hardware:** **CPU basic • 2 vCPU • 16 GB RAM • Free** (Standart bepul reja)
   - **Space visibility:** **Public**
4. **"Create Space"** tugmasini bosing!

---

### 3-Qadam: Loyihani Hugging Face Space-ga Yuklash (Git orqali - 2 daqiqa)

Hugging Face yangi Space yaratgach, sizga o'zining Git havolasini beradi:  
`https://huggingface.co/spaces/<sizning-username>/chsb-platform`

O'z kompyuteringiz terminalida (CHSB_APP papkasida) quyidagi 2 ta buyruqni bering:

```bash
# 1. Hugging Face Space ni yangi remote sifatida qo'shish
git remote add space https://huggingface.co/spaces/<sizning-username>/chsb-platform

# 2. Kodni Hugging Face-ga yuborish
git push space main --force
```

*(Terminalda Hugging Face paroli so'ralsa, Hugging Face parolingizni yoki Profil -> Settings -> Access Tokens bo'limidan olingan "Write" tokenni kiriting).*

---

### 4-Qadam: Space Settings-ga Baza Manzilini Kiritish (1 daqiqa)

1. Hugging Face Space sahifangizda yuqoridagi **"Settings"** tabiga o'ting.
2. Pastroqqa tushib **"Variables and secrets"** bo'limini toping.
3. **"New secret"** tugmasini bosing:
   - Name: `DATABASE_URL`
   - Value: `postgresql://user:password@ep-xyz.eu-central-1.aws.neon.tech/neondb?sslmode=require` (Neon.tech havolangiz)
4. Yana bitta **"New secret"** qo'shing:
   - Name: `JWT_SECRET`
   - Value: `<kamida 32 belgili tasodifiy kalit>`
5. *(Ixtiyoriy)* AI tahlillar uchun:
   - Name: `GEMINI_API_KEY`
   - Value: *(Google Gemini API kalitingiz)*

---

### 5-Qadam: Tayyor! 24/7 Doimiy Ishchi Tizim

Hugging Face avtomatik ravishda Docker konteynerni yig'adi va 24/7 onlayn ishga tushiradi:
- **Asosiy Web Dastur (SPA Frontend + REST API):**  
  👉 `https://<sizning-username>-chsb-platform.hf.space`
- **FastAPI Swagger Hujjatlari:**  
  👉 `https://<sizning-username>-chsb-platform.hf.space/docs`
- **Sog'lomlik Holati (Healthcheck):**  
  👉 `https://<sizning-username>-chsb-platform.hf.space/health`

Tizim **hech qachon uxlamaydi**, 15 daqiqada o'chib qolmaydi va 16 GB RAM evaziga xotira yetishmovchiligi xatosi (OOM) yuz bermaydi!

---

### 🔑 Standart Sinov Ma'lumotlari:
- **Ustoz (Teacher):** login: `teacher_ax` | parol: `<SEED_PASSWORD>`
- **Maktab Admini:** login: `admin_ax` | parol: `<SEED_PASSWORD>`
- **O'quvchi:** Roster kod: `STU-1101`
