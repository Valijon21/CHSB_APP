export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export type LogCategory = 'UI' | 'ROUTER' | 'NETWORK' | 'STATE' | 'AUTH' | 'SYSTEM';

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

export interface LogQueryFilters {
  level?: LogLevel | 'ALL';
  category?: LogCategory | 'ALL';
  searchQuery?: string;
  limit?: number;
  offset?: number;
  since?: string;
}

export interface LogStats {
  total: number;
  errorCount: number;
  warnCount: number;
  infoCount: number;
  lastErrorTime?: string;
}

