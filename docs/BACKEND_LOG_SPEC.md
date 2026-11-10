# 📄 Backend Log Fayllari Arxitekturasi va Spetsifikatsiyasi (Backend Logging Spec)

> **Hujjat versiyasi:** 1.0.0  
> **Maqsad:** Kelajakdagi CHSB backend serveri (Node.js/Express/NestJS yoki FastAPI) uchun doimiy log fayllariga yozish standartini belgilash.

---

## 1. ASOSIY TALABLAR (USER REQUIREMENTS)

* **Log Fayllar:** Barcha backend hodisalari va xatoliklari doimiy fayl tizimiga (`logs/`) yozilishi shart.
* **Saqlash hajmi va muddat:**
  - Kundalik aylanma (Daily file rotation): `app-YYYY-MM-DD.log`.
  - Alohida xatolar fayli: `error-YYYY-MM-DD.log` (faqat `ERROR` va `FATAL` darajasidagi xatoliklar).
  - Fayl maksimal hajmi: 20MB (hajmdan oshsa `app-YYYY-MM-DD.1.log` sifatida bo'linadi).
  - Saqlash muddati: Kamida 30 kun (30 kundan oshgan eski loglar avtomatik arxivlanadi/o'chiriladi).

---

## 2. LOG STRUKTURASI (NDJSON / JSON LINES FORMAT)

Har bir log alohida bir qatorda valid JSON (NDJSON) formatida saqlanadi:

```json
{
  "timestamp": "2026-11-10T12:00:00.123Z",
  "level": "ERROR",
  "traceId": "req-98afc210-4bc3",
  "tenantSlug": "al-xorazmiy",
  "userId": "tch-01",
  "method": "POST",
  "url": "/api/v1/students",
  "statusCode": 400,
  "durationMs": 42,
  "message": "Student validation failed: birthDate format is invalid",
  "error": {
    "name": "ZodValidationError",
    "details": ["Tug'ilgan sana YYYY-MM-DD formatida bo'lishi kerak"]
  },
  "stackTrace": "Error: Student validation failed\n    at validate (d:\\src\\validate.ts:12:9)...",
  "clientIp": "192.168.1.50",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
}
```

---

## 3. TAVSIYA ETILADIGAN KUTUBXONA VA KONFIGURATSIYA (NODE.JS / NESTJS)

### Pino yoki Winston + winston-daily-rotate-file

```typescript
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const fileRotateTransport = new DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  zippedArchive: true,
});

const errorFileRotateTransport = new DailyRotateFile({
  level: 'error',
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  zippedArchive: true,
});

export const backendLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    fileRotateTransport,
    errorFileRotateTransport,
  ],
});
```

---

## 4. XULOSA
Ushbu standart frontenddagi `LoggerService` bilan to'liq uyg'un bo'lib, kelgusida distributed tracing (masalan, `traceId` orqali frontend va backend xatolarini bir-biriga bog'lash) imkoniyatini beradi.

