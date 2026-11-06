import type { Assessment } from '../../entities/assessment/model';

export interface QueuedSubmission {
  id: string;
  tenantId: string;
  attemptId: string;
  assessmentId: string;
  studentId: string;
  answers: Record<string, string>;
  offlineHash: string;
  enqueuedAt: string;
  synced: boolean;
}

const DB_NAME = 'CHSB_OFFLINE_DB';
const DB_VERSION = 1;
const STORE_ASSESSMENTS = 'assessments';
const STORE_SUBMISSIONS = 'submissions';
const STORE_DRAFTS = 'drafts';

class OfflineStorageAdapter {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryFallback = {
    assessments: new Map<string, Assessment>(),
    submissions: new Map<string, QueuedSubmission>(),
    drafts: new Map<string, Record<string, string>>(),
  };

  private isIndexedDBAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.isIndexedDBAvailable()) {
      throw new Error('IndexedDB not supported');
    }

    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_ASSESSMENTS)) {
          db.createObjectStore(STORE_ASSESSMENTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_SUBMISSIONS)) {
          db.createObjectStore(STORE_SUBMISSIONS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
          db.createObjectStore(STORE_DRAFTS, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async cacheAssessment(assessment: Assessment): Promise<void> {
    if (!this.isIndexedDBAvailable()) {
      this.memoryFallback.assessments.set(assessment.id, assessment);
      return;
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_ASSESSMENTS, 'readwrite');
        const store = tx.objectStore(STORE_ASSESSMENTS);
        const req = store.put(assessment);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      this.memoryFallback.assessments.set(assessment.id, assessment);
    }
  }

  async getCachedAssessment(assessmentId: string): Promise<Assessment | null> {
    if (!this.isIndexedDBAvailable()) {
      return this.memoryFallback.assessments.get(assessmentId) || null;
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_ASSESSMENTS, 'readonly');
        const store = tx.objectStore(STORE_ASSESSMENTS);
        const req = store.get(assessmentId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.memoryFallback.assessments.get(assessmentId) || null;
    }
  }

  async saveDraft(key: string, answers: Record<string, string>): Promise<void> {
    if (!this.isIndexedDBAvailable()) {
      this.memoryFallback.drafts.set(key, answers);
      return;
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_DRAFTS, 'readwrite');
        const store = tx.objectStore(STORE_DRAFTS);
        const req = store.put({ key, answers });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      this.memoryFallback.drafts.set(key, answers);
    }
  }

  async getDraft(key: string): Promise<Record<string, string> | null> {
    if (!this.isIndexedDBAvailable()) {
      return this.memoryFallback.drafts.get(key) || null;
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_DRAFTS, 'readonly');
        const store = tx.objectStore(STORE_DRAFTS);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? req.result.answers : null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.memoryFallback.drafts.get(key) || null;
    }
  }

  async enqueueSubmission(submission: QueuedSubmission): Promise<void> {
    if (!this.isIndexedDBAvailable()) {
      this.memoryFallback.submissions.set(submission.id, submission);
      return;
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SUBMISSIONS, 'readwrite');
        const store = tx.objectStore(STORE_SUBMISSIONS);
        const req = store.put(submission);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      this.memoryFallback.submissions.set(submission.id, submission);
    }
  }

  async getQueuedSubmissions(): Promise<QueuedSubmission[]> {
    if (!this.isIndexedDBAvailable()) {
      return Array.from(this.memoryFallback.submissions.values());
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SUBMISSIONS, 'readonly');
        const store = tx.objectStore(STORE_SUBMISSIONS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return Array.from(this.memoryFallback.submissions.values());
    }
  }

  async dequeueSubmission(id: string): Promise<void> {
    if (!this.isIndexedDBAvailable()) {
      this.memoryFallback.submissions.delete(id);
      return;
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SUBMISSIONS, 'readwrite');
        const store = tx.objectStore(STORE_SUBMISSIONS);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      this.memoryFallback.submissions.delete(id);
    }
  }

  async clearAll(): Promise<void> {
    this.memoryFallback.assessments.clear();
    this.memoryFallback.submissions.clear();
    this.memoryFallback.drafts.clear();

    if (this.isIndexedDBAvailable()) {
      try {
        const db = await this.getDB();
        const tx = db.transaction(
          [STORE_ASSESSMENTS, STORE_SUBMISSIONS, STORE_DRAFTS],
          'readwrite'
        );
        tx.objectStore(STORE_ASSESSMENTS).clear();
        tx.objectStore(STORE_SUBMISSIONS).clear();
        tx.objectStore(STORE_DRAFTS).clear();
      } catch {
        // ignore
      }
    }
  }
}

export const offlineStorage = new OfflineStorageAdapter();
