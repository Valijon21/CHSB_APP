import type { LogEntry } from './types';

export const MAX_LOG_CAPACITY = 10000;
const DB_NAME = 'CHSB_LOGS_DB';
const DB_VERSION = 1;
const STORE_NAME = 'logs';
const FALLBACK_LOCAL_STORAGE_KEY = 'chsb_fallback_logs';
const FALLBACK_MAX = 500;

export class LogStorageEngine {
  private db: IDBDatabase | null = null;
  private isIndexedDBAvailable = false;
  private memoryCache: LogEntry[] = [];

  constructor() {
    this.isIndexedDBAvailable =
      typeof window !== 'undefined' &&
      typeof window.indexedDB !== 'undefined' &&
      window.indexedDB !== null;
  }

  public async init(): Promise<void> {
    if (!this.isIndexedDBAvailable) {
      this.loadFallbackLogs();
      return;
    }

    try {
      this.db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('level', 'level', { unique: false });
            store.createIndex('category', 'category', { unique: false });
          }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Graceful fallback to memory & localStorage
      this.isIndexedDBAvailable = false;
      this.loadFallbackLogs();
    }
  }

  public async saveBatch(entries: LogEntry[]): Promise<void> {
    if (!entries || entries.length === 0) return;

    if (!this.isIndexedDBAvailable || !this.db) {
      this.saveToFallback(entries);
      return;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        if (!this.db) return resolve();
        const tx = this.db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        for (const entry of entries) {
          store.put(entry);
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });

      // Maintain max capacity limit (FIFO)
      await this.enforceCapacityLimit();
    } catch {
      this.saveToFallback(entries);
    }
  }

  public async loadLogs(limit = MAX_LOG_CAPACITY): Promise<LogEntry[]> {
    if (!this.isIndexedDBAvailable || !this.db) {
      return [...this.memoryCache].slice(-limit);
    }

    try {
      return await new Promise<LogEntry[]>((resolve, reject) => {
        if (!this.db) return resolve([]);
        const tx = this.db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.openCursor(null, 'prev'); // Most recent first
        const results: LogEntry[] = [];

        req.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor && results.length < limit) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };

        req.onerror = () => reject(req.error);
      });
    } catch {
      return [...this.memoryCache].slice(-limit);
    }
  }

  public async count(): Promise<number> {
    if (!this.isIndexedDBAvailable || !this.db) {
      return this.memoryCache.length;
    }

    try {
      return await new Promise<number>((resolve, reject) => {
        if (!this.db) return resolve(0);
        const tx = this.db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.count();

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.memoryCache.length;
    }
  }

  public async clear(): Promise<void> {
    this.memoryCache = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(FALLBACK_LOCAL_STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
    }

    if (!this.isIndexedDBAvailable || !this.db) return;

    try {
      await new Promise<void>((resolve, reject) => {
        if (!this.db) return resolve();
        const tx = this.db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Silently catch
    }
  }

  private async enforceCapacityLimit(): Promise<void> {
    if (!this.db) return;

    const currentCount = await this.count();
    if (currentCount <= MAX_LOG_CAPACITY) return;

    const excess = currentCount - MAX_LOG_CAPACITY;
    if (excess <= 0) return;

    await new Promise<void>((resolve) => {
      if (!this.db) return resolve();
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.openCursor(null, 'next'); // Oldest first
      let deletedCount = 0;

      req.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor && deletedCount < excess) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve();
        }
      };

      req.onerror = () => resolve();
    });
  }

  private loadFallbackLogs(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(FALLBACK_LOCAL_STORAGE_KEY);
        if (raw) {
          this.memoryCache = JSON.parse(raw);
        }
      } catch {
        this.memoryCache = [];
      }
    }
  }

  private saveToFallback(entries: LogEntry[]): void {
    this.memoryCache.push(...entries);
    if (this.memoryCache.length > FALLBACK_MAX) {
      this.memoryCache = this.memoryCache.slice(-FALLBACK_MAX);
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(
          FALLBACK_LOCAL_STORAGE_KEY,
          JSON.stringify(this.memoryCache)
        );
      } catch {
        // Quota exceeded or private mode, rely on memory cache only
      }
    }
  }
}
