import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './app/router';
import { initGlobalErrorHandlers } from './shared/services/logger/globalErrorHandler';
import './shared/styles/main.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);

// Initialize centralized error logging & router interceptors
initGlobalErrorHandlers(app, router);

app.mount('#app');


