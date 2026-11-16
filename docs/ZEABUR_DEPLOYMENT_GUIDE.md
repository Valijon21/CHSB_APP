# Zeabur Cloud orqali Loyihani Bepul Joylashtirish Qo'llanmasi
## No-Sleep, Avtomatik Docker va Bepul Domen (.zeabur.app)

> **Loyiha:** CHSB Enterprise Assessment & School Intelligence Platform  
> **Platforma:** [Zeabur](https://zeabur.com)  
> **Afzalliklari:**  
> - 🟢 Render kabi 15 daqiqada uxlab qolmaydi.  
> - 🟢 GitHub hisoblaridagi chalkashliklar va ruxsat xatolarini to'g'ridan-to'g'ri terminaldan (`npx zeabur deploy`) yuklash orqali chetlab o'tadi.  
> - 🟢 Bepul doimiy SSL domen: `https://<loyiha-nomi>.zeabur.app`.

---

## 🚀 1-Usul: Terminal orqali 1 ta buyruq bilan joylash (Eng osoni va tezkor)

Ushbu usulda GitHub-dagi ruxsatlar yoki repo yopiqligi umuman xalaqit bermaydi — kod to'g'ridan-to'g'ri kompyuteringizdan Zeabur-ga yuklanadi!

### 1-Qadam: Terminalda buyruqni bering
O'z kompyuteringiz terminalida (CHSB_APP papkasida) quyidagicha yozing:

```bash
npx zeabur deploy
```

1. Terminal sizga brauzerda avtorizatsiyadan o'tish uchun havola beradi — brauzerda kiring.
2. Qaysi loyihaga joylansin deb so'rasa: **"Create a new project"** ni tanlang (nomiga `chsb-platform` deb yozing).
3. Zeabur avtomatik ravishda Dockerfile orqali loyihani yig'adi va ishga tushiradi!

---

## 🌐 2-Usul: Zeabur Veb-Sayti (Dashboard) orqali joylash

Agar veb-interfeysdan foydalanmoqchi bo'lsangiz:

1. [https://zeabur.com](https://zeabur.com) ga kiring va GitHub yoki Google orqali ro'yxatdan o'ting.
2. **"Create Project"** tugmasini bosing.
3. **"Deploy Service"** ni bosing:
   - Agar GitHub repo ulanishi mumkin bo'lsa: **"Git"** ni tanlang.
4. Xizmat ishga tushgach:
   - **"Networking"** bo'limiga o'ting va **"Generate Domain"** tugmasini bosing.
   - Sizga bepul doimiy havola beriladi: `https://chsb-platform.zeabur.app`.

---

## 🔑 Sozlanishi Kerak Bo'lgan Muhit O'zgaruvchilari (Environment Variables)

Zeabur loyiha boshqaruv panelida (Variables bo'limida) quyidagilarni kiriting:

| Kalit (Name) | Qiymat (Value) | Izoh |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:password@ep-xyz.eu-central-1.aws.neon.tech/neondb?sslmode=require` | Neon.tech Cloud PostgreSQL havolangiz |
| `JWT_SECRET` | `chsb-super-secret-production-2026` | Xavfsizlik kaliti |
| `PORT` | `8000` | Server porti |

---

### 🔑 Test Hisoblari:
- **Ustoz:** `teacher_ax` | `Secret123!`
- **Maktab Admini:** `admin_ax` | `Secret123!`
- **O'quvchi:** Roster kod: `STU-1101`
