import type { App } from 'vue';
import type { Router } from 'vue-router';
import { logger } from './LoggerService';

export function initGlobalErrorHandlers(app: App, router?: Router): void {
  // Initialize storage & cache
  logger.init().catch(() => {
    // Non-blocking initialization
  });

  // 1. Vue Component Errors
  app.config.errorHandler = (err, instance, info) => {
    const componentName = instance?.$options?.name || instance?.$options?.__name || 'UnknownComponent';
    logger.error(
      `Vue render/lifecycle error in <${componentName}>: ${err instanceof Error ? err.message : String(err)}`,
      err,
      {
        component: componentName,
        lifecycleHook: info,
      },
      'UI'
    );
  };

  // 2. Unhandled Promise Rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      logger.error(
        `Unhandled Promise Rejection: ${reason instanceof Error ? reason.message : String(reason)}`,
        reason,
        {
          type: 'unhandledrejection',
        },
        'NETWORK'
      );
    });

    // 3. Global Window Errors
    window.addEventListener('error', (event) => {
      logger.error(
        `Global runtime error: ${event.message}`,
        event.error || event.message,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        'SYSTEM'
      );
    });
  }

  // 4. Router Navigation Guard & 404 Interceptor
  if (router) {
    router.beforeEach((to) => {
      if (to.params.tenantSlug) {
        logger.setTenantSlug(to.params.tenantSlug as string);
      }
      logger.setCurrentRoute(to.fullPath);
    });

    router.afterEach((to) => {
      if (to.name === 'NotFound') {
        logger.warn(
          `404 Sahifa topilmadi: ${to.fullPath}`,
          {
            fullPath: to.fullPath,
            params: to.params,
            query: to.query,
          },
          'ROUTER'
        );
      }
    });

    router.onError((error, to) => {
      logger.error(
        `Router navigation error navigating to ${to.fullPath}: ${error.message}`,
        error,
        {
          targetRoute: to.fullPath,
        },
        'ROUTER'
      );
    });
  }
}
