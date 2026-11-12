import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

const toasts = ref<ToastItem[]>([]);

export function useToast() {
  function show(options: {
    type: ToastType;
    message: string;
    title?: string;
    duration?: number;
  }) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = options.duration ?? (options.type === 'error' ? 5000 : 4000);

    const item: ToastItem = {
      id,
      type: options.type,
      message: options.message,
      title: options.title,
      duration,
    };

    toasts.value.push(item);

    if (duration > 0 && typeof window !== 'undefined') {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }

  function success(message: string, title?: string, duration?: number) {
    return show({ type: 'success', message, title, duration });
  }

  function error(message: string, title?: string, duration?: number) {
    return show({ type: 'error', message, title, duration });
  }

  function warning(message: string, title?: string, duration?: number) {
    return show({ type: 'warning', message, title, duration });
  }

  function info(message: string, title?: string, duration?: number) {
    return show({ type: 'info', message, title, duration });
  }

  function removeToast(id: string) {
    const idx = toasts.value.findIndex((t) => t.id === id);
    if (idx !== -1) {
      toasts.value.splice(idx, 1);
    }
  }

  function clearToasts() {
    toasts.value = [];
  }

  return {
    toasts,
    show,
    success,
    error,
    warning,
    info,
    removeToast,
    clearToasts,
  };
}
