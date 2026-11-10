import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SystemLogViewer from '../src/features/tenant-admin/components/SystemLogViewer.vue';
import { logger } from '../src/shared/services/logger/LoggerService';

describe('TASK-LOG.4: SystemLogViewer UI Component', () => {
  beforeEach(async () => {
    await logger.clearLogs();
  });

  it('renders log stats and entries properly', async () => {
    logger.info('User visited page', { uid: '123' }, 'UI');
    logger.error('Failed to submit exam', new Error('Network timeout'), { attemptId: 'att-1' }, 'NETWORK');
    await logger.flush();

    const wrapper = mount(SystemLogViewer);
    // Allow onMounted to run
    await new Promise((r) => setTimeout(r, 50));

    expect(wrapper.text()).toContain('Tizim Loglari & Xatolar Konsoli');
    expect(wrapper.text()).toContain('User visited page');
    expect(wrapper.text()).toContain('Failed to submit exam');
    expect(wrapper.text()).toContain('UI');
    expect(wrapper.text()).toContain('NETWORK');
  });

  it('filters logs by search query', async () => {
    logger.info('UniqueKeywordAlfa: First entry', undefined, 'SYSTEM');
    logger.info('Beta: Second entry', undefined, 'SYSTEM');
    await logger.flush();

    const wrapper = mount(SystemLogViewer);
    await new Promise((r) => setTimeout(r, 50));

    const input = wrapper.find('input[type="text"]');
    await input.setValue('UniqueKeywordAlfa');

    expect(wrapper.text()).toContain('UniqueKeywordAlfa');
    expect(wrapper.text()).not.toContain('Beta: Second entry');
  });
});
