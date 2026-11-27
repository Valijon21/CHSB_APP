import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './app/router';
import { initGlobalErrorHandlers } from './shared/services/logger/globalErrorHandler';
import { httpClient } from './shared/api/httpClient';
import { useAuthStore } from './features/auth/store/authStore';
import './shared/styles/main.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);

// Initialize centralized error logging & router interceptors
initGlobalErrorHandlers(app, router);

// Expired or revoked token: sign out and return to the login page
httpClient.setUnauthorizedHandler(() => {
  const requiresAuth = router.currentRoute.value.matched.some((r) => r.meta?.requiresAuth);
  useAuthStore().logout();
  if (requiresAuth) {
    router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } });
  }
});

app.mount('#app');


