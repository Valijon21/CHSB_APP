import { onMounted, onUnmounted, watch, type Ref } from 'vue';

/**
 * Ensures accessible modal behavior:
 * 1. Closes modal on keyboard 'Escape'
 * 2. Prevents background body scrolling while modal is open
 * 3. Cleans up event listeners and body styles on unmount
 */
export function useModalA11y(isOpen: Ref<boolean>, onClose: () => void) {
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen.value) {
      event.preventDefault();
      onClose();
    }
  }

  watch(
    isOpen,
    (val) => {
      if (typeof document !== 'undefined') {
        if (val) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      }
    },
    { immediate: true }
  );

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
    }
  });

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeyDown);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    }
  });
}

