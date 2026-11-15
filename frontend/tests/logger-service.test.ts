import { describe, it, expect, beforeEach } from 'vitest';
import { LoggerService } from '../src/shared/services/logger/LoggerService';
import { LogStorageEngine } from '../src/shared/services/logger/LogStorageEngine';

describe('TASK-LOG.2: LoggerService Unit Tests', () => {
  let service: LoggerService;

  beforeEach(async () => {
    const engine = new LogStorageEngine();
    service = new LoggerService(engine);
    await service.init();
    await service.clearLogs();
  });

  it('logs info, warn, error and fatal entries', async () => {
    service.setTenantSlug('al-xorazmiy');
    service.setCurrentRoute('/t/al-xorazmiy/teacher/dashboard');

    const info = service.info('Dashboard loaded', { loadTimeMs: 120 }, 'UI');
    expect(info.level).toBe('INFO');
    expect(info.category).toBe('UI');
    expect(info.tenantSlug).toBe('al-xorazmiy');
    expect(info.route).toBe('/t/al-xorazmiy/teacher/dashboard');

    const warn = service.warn('Network slow', { ping: 450 }, 'NETWORK');
    expect(warn.level).toBe('WARN');

    const err = new Error('Database connection failed');
    const errorEntry = service.error('DB Error occurred', err, { retry: 2 }, 'STATE');
    expect(errorEntry.level).toBe('ERROR');
    expect(errorEntry.stackTrace).toContain('Database connection failed');

    const fatalEntry = service.fatal('Critical system crash', undefined, {}, 'SYSTEM');
    expect(fatalEntry.level).toBe('FATAL');

    await service.flush();
    const stats = await service.getStats();
    expect(stats.total).toBe(4);
    expect(stats.errorCount).toBe(2); // ERROR + FATAL
    expect(stats.warnCount).toBe(1);
    expect(stats.infoCount).toBe(1);
  });

  it('filters logs by level correctly', async () => {
    service.info('Info 1');
    service.warn('Warning 1');
    service.error('Error 1');
    await service.flush();

    const onlyErrors = await service.getLogs({ level: 'ERROR' });
    expect(onlyErrors.length).toBe(1);
    expect(onlyErrors[0]!.message).toBe('Error 1');

    const onlyWarns = await service.getLogs({ level: 'WARN' });
    expect(onlyWarns.length).toBe(1);
    expect(onlyWarns[0]!.message).toBe('Warning 1');

    const all = await service.getLogs({ level: 'ALL' });
    expect(all.length).toBe(3);
  });

  it('searches logs by keyword in message, route, or stack', async () => {
    service.setCurrentRoute('/t/temurbeklar/admin');
    service.info('Admin opened settings');
    service.error('Failed to save student', new Error('Validation failed for birthDate'));
    await service.flush();

    const searchBirth = await service.getLogs({ searchQuery: 'birthDate' });
    expect(searchBirth.length).toBe(1);
    expect(searchBirth[0]!.message).toBe('Failed to save student');

    const searchRoute = await service.getLogs({ searchQuery: 'temurbeklar' });
    expect(searchRoute.length).toBe(2);
  });

  it('clears logs and resets stats', async () => {
    service.info('To be deleted');
    await service.flush();

    expect((await service.getStats()).total).toBe(1);

    await service.clearLogs();
    expect((await service.getStats()).total).toBe(0);
  });

  it('exports logs as valid JSON string', async () => {
    service.info('Export test log', { key: 'value' });
    await service.flush();

    const jsonStr = await service.exportLogsAsJson();
    const parsed = JSON.parse(jsonStr);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].message).toBe('Export test log');
  });
});
