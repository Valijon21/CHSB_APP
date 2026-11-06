import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue';

export function useNetworkStatus() {
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const offlineSince = ref<string | null>(null);
  const reconnectedAt = ref<string | null>(null);
  const pendingQueueCount = ref(0);

  function handleOnline() {
    isOnline.value = true;
    reconnectedAt.value = new Date().toISOString();
  }

  function handleOffline() {
    isOnline.value = false;
    offlineSince.value = new Date().toISOString();
  }

  function setPendingQueueCount(count: number) {
    pendingQueueCount.value = Math.max(0, count);
  }

  function startListening() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }
  }

  function stopListening() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      startListening();
    });

    onUnmounted(() => {
      stopListening();
    });
  }

  return {
    isOnline,
    offlineSince,
    reconnectedAt,
    pendingQueueCount,
    setPendingQueueCount,
    handleOnline,
    handleOffline,
    startListening,
    stopListening,
  };
}
