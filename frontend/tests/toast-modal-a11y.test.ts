import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, nextTick } from 'vue';
import { useToast } from '../src/shared/composables/useToast';
import { useModalA11y } from '../src/shared/composables/useModalA11y';
import ToastContainer from '../src/shared/components/ToastContainer.vue';
import CreateClassModal from '../src/features/organization/components/CreateClassModal.vue';
import CreateTeacherModal from '../src/features/organization/components/CreateTeacherModal.vue';
import CreateStudentModal from '../src/features/organization/components/CreateStudentModal.vue';

describe('TASK-ARC.4..6: Global Toast Notifications & Modal Dialog Accessibility', () => {
  beforeEach(() => {
    const { clearToasts } = useToast();
    clearToasts();
    document.body.style.overflow = '';
  });

  describe('1. useToast Composable', () => {
    it('manages toast items with types, auto-dismiss, and manual removal', () => {
      const toast = useToast();

      const id1 = toast.success('Muvaffaqiyatli saqlandi', 'Tasdiq');
      toast.error('Xatolik yuz berdi', 'Xatolik');
      toast.warning('Diqqat qiling', 'Ogohlantirish');
      toast.info('Yangi ma\'lumot', 'Xabar');

      expect(toast.toasts.value.length).toBe(4);
      expect(toast.toasts.value[0]?.type).toBe('success');
      expect(toast.toasts.value[1]?.type).toBe('error');
      expect(toast.toasts.value[2]?.type).toBe('warning');
      expect(toast.toasts.value[3]?.type).toBe('info');

      toast.removeToast(id1);
      expect(toast.toasts.value.length).toBe(3);
      expect(toast.toasts.value.find((t) => t.id === id1)).toBeUndefined();

      toast.clearToasts();
      expect(toast.toasts.value.length).toBe(0);
    });

    it('auto-dismisses toast after specified duration', async () => {
      vi.useFakeTimers();
      const toast = useToast();

      toast.success('Tezda o\'chuvchi xabar', undefined, 1000);
      expect(toast.toasts.value.length).toBe(1);

      vi.advanceTimersByTime(1001);
      expect(toast.toasts.value.length).toBe(0);

      vi.useRealTimers();
    });
  });

  describe('2. ToastContainer Component', () => {
    it('renders with accessibility region, live status and dismissal controls', async () => {
      const toast = useToast();
      toast.success('Sinf muvaffaqiyatli ochildi', 'Yangi Sinf');

      const wrapper = mount(ToastContainer);
      expect(wrapper.attributes('role')).toBe('region');
      expect(wrapper.attributes('aria-label')).toBe('Tizim xabarnomalari');

      const toastElement = wrapper.find('[role="status"]');
      expect(toastElement.exists()).toBe(true);
      expect(toastElement.text()).toContain('Sinf muvaffaqiyatli ochildi');
      expect(toastElement.text()).toContain('Yangi Sinf');

      // Dismiss button
      const closeBtn = wrapper.find('button[aria-label="Xabarni yopish"]');
      expect(closeBtn.exists()).toBe(true);

      await closeBtn.trigger('click');
      expect(toast.toasts.value.length).toBe(0);
    });
  });

  describe('3. useModalA11y Composable & Keyboard Escape Handler', () => {
    it('traps body scroll when open and closes on Escape key', async () => {
      const isOpen = ref(false);
      const closeFn = vi.fn();

      // Test component using useModalA11y
      const TestModalComp = {
        setup() {
          useModalA11y(isOpen, closeFn);
          return { isOpen };
        },
        template: '<div v-if="isOpen">Modal Content</div>',
      };

      const wrapper = mount(TestModalComp);
      expect(document.body.style.overflow).toBe('');

      isOpen.value = true;
      await nextTick();
      expect(document.body.style.overflow).toBe('hidden');

      // Trigger Escape key
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(closeFn).toHaveBeenCalledTimes(1);

      wrapper.unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('4. Modal Components WAI-ARIA Standard Compliance', () => {
    it('verifies CreateClassModal has role=dialog, aria-modal=true and aria-labelledby', () => {
      const wrapper = mount(CreateClassModal, {
        props: {
          isOpen: true,
          schoolId: 'sch-01',
          tenantSlug: 'al-xorazmiy',
        },
      });

      const dialog = wrapper.find('[role="dialog"]');
      expect(dialog.exists()).toBe(true);
      expect(dialog.attributes('aria-modal')).toBe('true');
      expect(dialog.attributes('aria-labelledby')).toBe('create-class-modal-title');
    });

    it('verifies CreateTeacherModal has role=dialog and aria-modal=true', () => {
      const wrapper = mount(CreateTeacherModal, {
        props: {
          isOpen: true,
          schoolId: 'sch-01',
          tenantSlug: 'al-xorazmiy',
          availableClasses: [],
        },
      });

      const dialog = wrapper.find('[role="dialog"]');
      expect(dialog.exists()).toBe(true);
      expect(dialog.attributes('aria-modal')).toBe('true');
      expect(dialog.attributes('aria-labelledby')).toBe('create-teacher-modal-title');
    });

    it('verifies CreateStudentModal has role=dialog and aria-modal=true', () => {
      const wrapper = mount(CreateStudentModal, {
        props: {
          isOpen: true,
          schoolId: 'sch-01',
          tenantSlug: 'al-xorazmiy',
          availableClasses: [],
        },
      });

      const dialog = wrapper.find('[role="dialog"]');
      expect(dialog.exists()).toBe(true);
      expect(dialog.attributes('aria-modal')).toBe('true');
      expect(dialog.attributes('aria-labelledby')).toBe('create-student-modal-title');
    });
  });
});
