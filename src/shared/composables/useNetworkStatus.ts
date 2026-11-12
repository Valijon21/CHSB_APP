import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue';

const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);
const offlineSince = ref<string | null>(null);
const reconnectedAt = ref<string | null>(null);
const pendingQueueCount = ref(0);
let isListening = false;

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
  if (typeof window !== 'undefined' && !isListening) {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    isListening = true;
  }
}

function stopListening() {
  if (typeof window !== 'undefined' && isListening) {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    isListening = false;
  }
}

function resetNetworkStatus() {
  isOnline.value = typeof navigator !== 'undefined' ? navigator.onLine : true;
  offlineSince.value = null;
  reconnectedAt.value = null;
  pendingQueueCount.value = 0;
}

export function useNetworkStatus() {
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
    resetNetworkStatus,
  };
}
