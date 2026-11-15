import { describe, it, expect, beforeEach } from 'vitest';
import { logger } from '../src/shared/services/logger/LoggerService';

describe('TASK-LOG.5: Logger Integration & End-to-End Resilience', () => {
  beforeEach(async () => {
    await logger.clearLogs();
  });

  it('runs complete E2E lifecycle: context setup -> error capture -> retrieval -> export', async () => {
    // 1. Context setup
    logger.setTenantSlug('al-xorazmiy');
    logger.setCurrentRoute('/t/al-xorazmiy/admin');

    // 2. Multi-level events
    logger.info('Admin opened settings', { section: 'general' }, 'SYSTEM');
    logger.warn('Slow network request to roster API', { latencyMs: 820 }, 'NETWORK');

    const sampleError = new Error('Test validation exception in student form');
    logger.error('Form submission failed', sampleError, { studentId: 'stu-99' }, 'STATE');

    logger.fatal('Unrecoverable critical runtime panic', undefined, { fatal: true }, 'SYSTEM');

    await logger.flush();

    // 3. Retrieval & Stats
    const stats = await logger.getStats();
    expect(stats.total).toBe(4);
    expect(stats.errorCount).toBe(2); // ERROR + FATAL
    expect(stats.warnCount).toBe(1);
    expect(stats.infoCount).toBe(1);

    // 4. Detailed filtering
    const onlyErrors = await logger.getLogs({ level: 'ERROR' });
    expect(onlyErrors.length).toBe(1);
    expect(onlyErrors[0]!.message).toBe('Form submission failed');
    expect(onlyErrors[0]!.stackTrace).toContain('Test validation exception in student form');
    expect(onlyErrors[0]!.tenantSlug).toBe('al-xorazmiy');

    // 5. Export JSON
    const exportedJson = await logger.exportLogsAsJson();
    const parsed = JSON.parse(exportedJson);
    expect(parsed.length).toBe(4);
  });
});
