/* eslint-disable vue/one-component-per-file */
import { describe, it, expect, beforeEach } from 'vitest';
import { createApp, defineComponent, type ComponentPublicInstance } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { initGlobalErrorHandlers } from '../src/shared/services/logger/globalErrorHandler';
import { logger } from '../src/shared/services/logger/LoggerService';

describe('TASK-LOG.3: Global Error Handlers & Router Integration', () => {
  beforeEach(async () => {
    await logger.clearLogs();
  });

  it('captures Vue component errors in errorHandler', async () => {
    const dummyApp = createApp(
      defineComponent({
        name: 'FaultyComponent',
        template: '<div>Faulty</div>',
      })
    );

    initGlobalErrorHandlers(dummyApp);

    // Trigger Vue error handler manually
    const testErr = new Error('Simulated render error');
    dummyApp.config.errorHandler?.(
      testErr,
      { $options: { name: 'FaultyComponent' } } as unknown as ComponentPublicInstance,
      'render'
    );

    await logger.flush();
    const logs = await logger.getLogs({ level: 'ERROR' });
    expect(logs.length).toBeGreaterThanOrEqual(1);

    const targetLog = logs.find((l) => l.message.includes('FaultyComponent'));
    expect(targetLog).toBeDefined();
    expect(targetLog?.category).toBe('UI');
    expect(targetLog?.context?.lifecycleHook).toBe('render');
  });

  it('captures 404 routes as WARN logs in router afterEach', async () => {
    const testRouter = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/:pathMatch(.*)*', name: 'NotFound', component: { template: '<div>404</div>' } },
      ],
    });

    const dummyApp = createApp({ template: '<router-view />' });
    dummyApp.use(testRouter);
    initGlobalErrorHandlers(dummyApp, testRouter);

    await testRouter.push('/non-existent-random-page');
    await testRouter.isReady();

    await logger.flush();
    const warns = await logger.getLogs({ level: 'WARN' });
    const notFoundLog = warns.find((l) => l.category === 'ROUTER' && l.message.includes('404 Sahifa topilmadi'));

    expect(notFoundLog).toBeDefined();
    expect(notFoundLog?.route).toBe('/non-existent-random-page');
  });

  it('redirects /t/:tenantSlug/tenant-admin to /t/:tenantSlug/admin in actual router config', async () => {
    const { router } = await import('../src/app/router');
    await router.push('/t/al-xorazmiy/tenant-admin');
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/t/al-xorazmiy/admin');
  }, 15000);
});
