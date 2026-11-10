import { describe, it, expect, beforeEach } from 'vitest';
import { LogStorageEngine, MAX_LOG_CAPACITY } from '../src/shared/services/logger/LogStorageEngine';
import type { LogEntry } from '../src/shared/services/logger/types';

describe('TASK-LOG.1: LogStorageEngine Unit Tests', () => {
  let engine: LogStorageEngine;

  beforeEach(async () => {
    engine = new LogStorageEngine();
    await engine.init();
    await engine.clear();
  });

  const createDummyLog = (id: string, level: LogEntry['level'] = 'INFO'): LogEntry => ({
    id,
    timestamp: new Date().toISOString(),
    level,
    category: 'SYSTEM',
    message: `Test log message ${id}`,
    route: '/test',
    tenantSlug: 'al-xorazmiy',
    context: { meta: 'val' },
  });

  it('initializes and starts with zero logs after clear', async () => {
    const count = await engine.count();
    expect(count).toBe(0);
    const logs = await engine.loadLogs();
    expect(logs).toEqual([]);
  });

  it('saves and retrieves a batch of log entries', async () => {
    const entries: LogEntry[] = [
      createDummyLog('log-1', 'INFO'),
      createDummyLog('log-2', 'WARN'),
      createDummyLog('log-3', 'ERROR'),
    ];

    await engine.saveBatch(entries);

    const count = await engine.count();
    expect(count).toBe(3);

    const loaded = await engine.loadLogs();
    expect(loaded.length).toBe(3);
    const ids = loaded.map((l) => l.id);
    expect(ids).toContain('log-1');
    expect(ids).toContain('log-2');
    expect(ids).toContain('log-3');
  });

  it('clears all logs correctly', async () => {
    await engine.saveBatch([createDummyLog('log-x')]);
    expect(await engine.count()).toBe(1);

    await engine.clear();
    expect(await engine.count()).toBe(0);
  });

  it('respects MAX_LOG_CAPACITY constant configuration', () => {
    expect(MAX_LOG_CAPACITY).toBe(10000);
  });
});
