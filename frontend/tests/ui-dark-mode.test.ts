import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CreateClassModal from '../src/features/organization/components/CreateClassModal.vue';
import SystemLogViewer from '../src/features/tenant-admin/components/SystemLogViewer.vue';

describe('TASK-UI.3: Dark Theme Harmonization across Modals & Views', () => {
  it('CreateClassModal has dark mode background and border classes', () => {
    const wrapper = mount(CreateClassModal, {
      props: {
        isOpen: true,
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
      },
    });

    const modalBox = wrapper.find('.rounded-2xl');
    expect(modalBox.classes()).toContain('dark:bg-slate-800');
    expect(modalBox.classes()).toContain('dark:border-slate-700');
  });

  it('SystemLogViewer has dark mode background and border classes', () => {
    const wrapper = mount(SystemLogViewer);
    const container = wrapper.find('.rounded-xl');
    expect(container.classes()).toContain('dark:bg-slate-800');
    expect(container.classes()).toContain('dark:border-slate-700');
  });
});

