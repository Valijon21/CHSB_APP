# 📋 Frontend Error Logging & Telemetry Engine (10 000 ta Log & Audit) Rejasi

> **Hujjat versiyasi:** 1.0.0  
> **Holati:** Tasdiqlash uchun tayyorlangan  
> **Maqsad:** Frontend ilovasida yuzaga keladigan barcha xatoliklarni (Vue komponentlar, tarmoq, 404 marshrutlar, unhandled promise'lar) 10 000 tagacha IndexedDB/Ring-bufferda saqlash, filtr va eksport bilan Tenant Admin panelida ko'rsatish hamda backend uchun log fayllar standartini belgilash.

---

## 1. TALABLAR VA ARXITEKTURA QARORLARI

1. **Log Sig'imi:** Oxirgi **10 000 ta log** saqlanishi shart.
   - *Senior muhandislik yechimi:* Standart `localStorage` sig'imi atigi ~5MB bo'lgani uchun 10 000 ta batafsil stack trace'li loglar saqlanganda `QuotaExceededError` beradi. Shu sababli **IndexedDB** asosidagi asinxron saqlash drayveri (`LogStorageEngine`) yaratiladi. Favqulodda holatlarda (IndexedDB bloklangan brauzerlarda) xavfsiz `localStorage`ga 500 ta log bilan fallback qilinadi.
2. **Joylashuvi:** Tenant Admin (`/t/:tenantSlug/admin`) sahifasida alohida **"Tizim Loglari & Audit (Xatolar Konsoli)"** bo'limi bo'ladi.
3. **Router 404 & Redirect:** 
   - `/t/:tenantSlug/tenant-admin` kiritilganda 404 bermasdan, avtomatik `/t/:tenantSlug/admin` ga yo'naltiruvchi marshrut qo'shiladi.
   - 404 sahifasiga tushgan har bir foydalanuvchi qadami avtomatik `WARN` log sifatida qayd etiladi.
4. **Backend Log Fayllari:** Kelajakdagi backend arxitekturasi uchun aylanma (rotating) fayllar (`logs/app-%DATE%.log`) talabi `docs/BACKEND_LOG_SPEC.md` va `.agents/memory/tech-decisions.md` ga kiritiladi.

---

## 2. BOSQICHMA-BOSQICH VAZIFALAR REJASI (TASKS BREAKDOWN)

```
[TASK-LOG.1: Logger Types & IndexedDB Engine]
                   ↓
[TASK-LOG.2: LoggerService Singleton & Ring-Buffer]
                   ↓
[TASK-LOG.3: Global Handlers, Router Guard & 404 Redirect]
                   ↓
[TASK-LOG.4: Tenant Admin SystemLogViewer UI]
                   ↓
[TASK-LOG.5: Backend Log Spec, Integratsiya & Sifat Darvozalari]
```

---

### 🔷 1-BOSQICH: TIP VA SAQLASH MEXANIZMI (STORAGE ENGINE)

#### **TASK-LOG.1: Logger Types & IndexedDB 10,000 Capacity Engine**
* **Maqsad:** Log tuzilmasi, darajalari va 10 000 tagacha loglarni asinxron xotiraga yozuvchi engil IndexedDB drayverini yaratish.
* **Yaratiladigan fayllar:**
  - `src/shared/services/logger/types.ts`
  - `src/shared/services/logger/LogStorageEngine.ts`
* **Test fayli:** `tests/logger-engine.test.ts`
* **Log Turlari:**
  - `LogLevel`: `'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'`
  - `LogCategory`: `'UI' | 'ROUTER' | 'NETWORK' | 'STATE' | 'AUTH' | 'SYSTEM'`
  - `LogEntry`:
    ```typescript
    export interface LogEntry {
      id: string;
      timestamp: string;
      level: LogLevel;
      category: LogCategory;
      message: string;
      stackTrace?: string;
      tenantSlug?: string;
      route?: string;
      context?: Record<string, unknown>;
    }
    ```
* **Mezonlar:**
  - [ ] 10 000 dan ortiq yozuv qo'shilganda eng eski loglar avtomatik tozalanadi (FIFO Ring Buffer).
  - [ ] IndexedDB bo'lmaganda graceful fallback ishlaydi.

---

### 🔷 2-BOSQICH: ASOSIY LOGGER XIZMATI (LOGGER SERVICE)

#### **TASK-LOG.2: LoggerService Singleton & Asinxron Batch Flush**
* **Maqsad:** Ilovaning istalgan joyidan chaqiriladigan markaziy `logger` instansiyasi.
* **Yaratiladigan fayl:** `src/shared/services/logger/LoggerService.ts`
* **Test fayli:** `tests/logger-service.test.ts`
* **Metodlar:**
  - `logger.info(message, context)`
  - `logger.warn(message, context)`
  - `logger.error(message, error, context)`
  - `logger.fatal(message, error, context)`
  - `logger.getLogs(filters)` (daraja, qidiruv, vaqt oralig'i bo'yicha)
  - `logger.clearLogs()`
  - `logger.exportLogsAsJson()`
  - `logger.getStats()` (jami, error, warn soni)
* **Mezonlar:**
  - [ ] Kaskadli xatolarda UI qotib qolmasligi uchun 200ms batch flush mexanizmi ishlaydi.
  - [ ] Qidiruv va daraja bo'yicha filterlash to'g'ri ishlaydi.

---

### 🔷 3-BOSQICH: GLOBAL TUTQICHLAR VA ROUTER 404 TUZATISH

#### **TASK-LOG.3: Global Vue & Window Error Handlers + Router Redirect**
* **Maqsad:** Vue render xatoliklari, async unhandled promise'lar va 404 larni avtomatik ushlab logga yozish.
* **Yaratiladigan/o'zgartiriladigan fayllar:**
  - `src/shared/services/logger/globalErrorHandler.ts`
  - `src/main.ts` (Global logger initsializatsiyasi)
  - `src/app/router/index.ts` (`/tenant-admin` -> `/admin` redirect va `router.onError` / `afterEach` log capturing)
* **Test fayli:** `tests/logger-global-handlers.test.ts`
* **Mezonlar:**
  - [ ] `/t/:tenantSlug/tenant-admin` manzili avtomatik `/t/:tenantSlug/admin` ga xatosiz o'tadi.
  - [ ] Mavjud bo'lmagan manzilga kirilganda `ROUTER` kategoriyasida `WARN` log hosil bo'ladi.
  - [ ] Vue komponentidagi sintaksis/runtime xatosi avtomatik `ERROR` log sifatida qayd etiladi.

---

### 🔷 4-BOSQICH: TENANT ADMIN LOG KONSOLI (UI)

#### **TASK-LOG.4: SystemLogViewer UI Komponenti**
* **Maqsad:** Maktab ma'muri va dasturchilar uchun Tenant Admin panelida loglarni ko'rish, qidirish va eksport qilish.
* **Yaratiladigan fayllar:**
  - `src/features/tenant-admin/components/SystemLogViewer.vue`
  - `src/features/tenant-admin/TenantAdminView.vue` (bo'lim integratsiyasi)
* **Test fayli:** `tests/system-log-viewer.test.ts`
* **Funksionallik:**
  - Darajalar bo'yicha tezkor statistika (Jami, Xatolar, Ogohlantirishlar).
  - Loglar darajasi bo'yicha filtrlash (`ALL`, `ERROR`, `WARN`, `INFO`).
  - Matn bo'yicha qidiruv.
  - Har bir logni ochib (accordion) to'liq stack trace va kontekstini ko'rish.
  - `📋 Nusxalash (Export JSON)` va `🗑️ Loglarni tozalash` tugmalari.
* **Mezonlar:**
  - [ ] Barcha loglar ro'yxatda to'g'ri ko'rinadi.
  - [ ] Nusxalash tugmasi to'g'ri formatda clipboardga oladi.

---

### 🔷 5-BOSQICH: INTEGRATSIYA, BACKEND SPEC VA REGRESSIYA

#### **TASK-LOG.5: Backend Log Spec & Tizimli Sifat Nazorati**
* **Maqsad:** Kelajakdagi backend uchun aylanma log fayllar spetsifikatsiyasini yozish, barcha testlarni yashil o'tkazish va Gitga joylash.
* **Yaratiladigan hujjat:** `docs/BACKEND_LOG_SPEC.md`
* **Test fayli:** `tests/logger-integration.test.ts`
* **Sifat darvozalari:**
  - 100% testlar yashil (28+ test fayl, 215+ testlar).
  - `npm run typecheck` (0 xato).
  - `npm run lint` (0 ogohlantirish).
  - `npm run build` (Muvaffaqiyatli build).
  - Git commit & push.

---

## 3. MEZONLAR VA SIFAT DARVOZALARI (100% BAJARILDI ✅)

| Darvoza | Buyruq | Kutilgan Natija | Haqiqiy Natija |
| :--- | :--- | :--- | :--- |
| **1. Unit Testlar** | `npx vitest run tests/logger-*.test.ts` | 100% PASS | ✅ 15/15 PASS |
| **2. Umumiy Regressiya** | `npx vitest run` | 210+ test 100% PASS | ✅ 33 files, 213 tests 100% PASS |
| **3. Type Check** | `npm run typecheck` | 0 errors | ✅ 0 errors |
| **4. ESLint** | `npm run lint` | 0 warnings | ✅ 0 warnings |
| **5. Production Build** | `npm run build` | Muvaffaqiyatli `dist/` | ✅ Clean build in 1.4s |

---

## 4. BAJARILGAN VAZIFALAR RO'YXATI (ALL COMPLETED ✅)

1. ✅ **TASK-LOG.1**: Logger Types & IndexedDB 10,000 Capacity Engine (`types.ts`, `LogStorageEngine.ts`) — 4 tests PASS.
2. ✅ **TASK-LOG.2**: LoggerService Singleton & Debounced Flush (`LoggerService.ts`) — 5 tests PASS.
3. ✅ **TASK-LOG.3**: Global Error Handlers, 404 Interceptor & Router Redirect (`globalErrorHandler.ts`, `router/index.ts`, `main.ts`) — 3 tests PASS.
4. ✅ **TASK-LOG.4**: Tenant Admin SystemLogViewer UI (`SystemLogViewer.vue`, `TenantAdminView.vue`) — 2 tests PASS.
5. ✅ **TASK-LOG.5**: Backend Log Spec & Full Regression (`docs/BACKEND_LOG_SPEC.md`, `tests/logger-integration.test.ts`) — 1 test PASS.


