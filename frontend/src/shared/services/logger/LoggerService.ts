import { LogStorageEngine, MAX_LOG_CAPACITY } from './LogStorageEngine';
import type {
  LogCategory,
  LogEntry,
  LogLevel,
  LogQueryFilters,
  LogStats,
} from './types';

export class LoggerService {
  private engine: LogStorageEngine;
  private memoryLogs: LogEntry[] = [];
  private pendingBatch: LogEntry[] = [];
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentTenantSlug = 'global';
  private currentRoutePath = '/';
  private isInitialized = false;

  constructor(engine?: LogStorageEngine) {
    this.engine = engine || new LogStorageEngine();
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    await this.engine.init();
    // Warm up memory cache with most recent logs
    const recent = await this.engine.loadLogs(500);
    this.memoryLogs = recent;
    this.isInitialized = true;
  }

  public setTenantSlug(slug: string): void {
    this.currentTenantSlug = slug;
  }

  public setCurrentRoute(route: string): void {
    this.currentRoutePath = route;
  }

  public debug(
    message: string,
    context?: Record<string, unknown>,
    category: LogCategory = 'SYSTEM'
  ): LogEntry {
    return this.log('DEBUG', category, message, undefined, context);
  }

  public info(
    message: string,
    context?: Record<string, unknown>,
    category: LogCategory = 'SYSTEM'
  ): LogEntry {
    return this.log('INFO', category, message, undefined, context);
  }

  public warn(
    message: string,
    context?: Record<string, unknown>,
    category: LogCategory = 'SYSTEM'
  ): LogEntry {
    return this.log('WARN', category, message, undefined, context);
  }

  public error(
    message: string,
    error?: unknown,
    context?: Record<string, unknown>,
    category: LogCategory = 'SYSTEM'
  ): LogEntry {
    return this.log('ERROR', category, message, error, context);
  }

  public fatal(
    message: string,
    error?: unknown,
    context?: Record<string, unknown>,
    category: LogCategory = 'SYSTEM'
  ): LogEntry {
    return this.log('FATAL', category, message, error, context);
  }

  public async getLogs(filters?: LogQueryFilters): Promise<LogEntry[]> {
    await this.flush();

    // Load full set from engine (up to limit or capacity)
    const all = await this.engine.loadLogs(filters?.limit || MAX_LOG_CAPACITY);

    return all.filter((entry) => {
      if (filters?.level && filters.level !== 'ALL' && entry.level !== filters.level) {
        return false;
      }
      if (
        filters?.category &&
        filters.category !== 'ALL' &&
        entry.category !== filters.category
      ) {
        return false;
      }
      if (filters?.searchQuery && filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase();
        const msgMatch = entry.message.toLowerCase().includes(q);
        const stackMatch = entry.stackTrace?.toLowerCase().includes(q);
        const routeMatch = entry.route?.toLowerCase().includes(q);
        if (!msgMatch && !stackMatch && !routeMatch) {
          return false;
        }
      }
      if (filters?.since && entry.timestamp < filters.since) {
        return false;
      }
      return true;
    });
  }

  public async getStats(): Promise<LogStats> {
    const all = await this.engine.loadLogs(MAX_LOG_CAPACITY);
    let errorCount = 0;
    let warnCount = 0;
    let infoCount = 0;
    let lastErrorTime: string | undefined;

    for (const entry of all) {
      if (entry.level === 'ERROR' || entry.level === 'FATAL') {
        errorCount++;
        if (!lastErrorTime || entry.timestamp > lastErrorTime) {
          lastErrorTime = entry.timestamp;
        }
      } else if (entry.level === 'WARN') {
        warnCount++;
      } else if (entry.level === 'INFO') {
        infoCount++;
      }
    }

    return {
      total: all.length,
      errorCount,
      warnCount,
      infoCount,
      lastErrorTime,
    };
  }

  public async clearLogs(): Promise<void> {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    this.pendingBatch = [];
    this.memoryLogs = [];
    await this.engine.clear();
  }

  public async exportLogsAsJson(): Promise<string> {
    const logs = await this.getLogs();
    return JSON.stringify(logs, null, 2);
  }

  public async flush(): Promise<void> {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.pendingBatch.length === 0) return;

    const toSave = [...this.pendingBatch];
    this.pendingBatch = [];
    await this.engine.saveBatch(toSave);
  }

  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    error?: unknown,
    context?: Record<string, unknown>
  ): LogEntry {
    let stackTrace: string | undefined;

    if (error instanceof Error) {
      stackTrace = error.stack;
      if (!message) {
        message = error.message;
      }
    } else if (error && typeof error === 'object') {
      stackTrace = JSON.stringify(error, null, 2);
    } else if (typeof error === 'string') {
      stackTrace = error;
    }

    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      stackTrace,
      tenantSlug: this.currentTenantSlug,
      route: this.currentRoutePath,
      context,
    };

    // Keep in memory cache
    this.memoryLogs.unshift(entry);
    if (this.memoryLogs.length > 500) {
      this.memoryLogs.pop();
    }

    // Schedule debounced batch write
    this.pendingBatch.push(entry);
    this.scheduleBatchFlush();

    return entry;
  }

  private scheduleBatchFlush(): void {
    if (this.flushTimeout) return;

    this.flushTimeout = setTimeout(() => {
      this.flush().catch(() => {
        // Silently catch in async timeout
      });
    }, 200);
  }
}

// Global Singleton Export
export const logger = new LoggerService();

