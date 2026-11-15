import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import TeacherClassesView from '../src/features/teacher/classes/TeacherClassesView.vue';
import ClassCard from '../src/features/teacher/classes/components/ClassCard.vue';
import TeacherClassDetailView from '../src/features/teacher/classes/TeacherClassDetailView.vue';
import { useTeacherStore } from '../src/features/teacher/teacherStore';
import { useTenantStore } from '../src/features/tenant-context/tenantStore';

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      tenantSlug: 'al-xorazmiy',
      classId: 'class-ax-11a',
    },
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('TASK-UIX.2: Teacher Classes, ClassCard & ClassDetail Dark Mode & A11y', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders TeacherClassesView with dark mode toolbar and accessible inputs', async () => {
    const tenantStore = useTenantStore();
    const teacherStore = useTeacherStore();
    await tenantStore.loadTenant('al-xorazmiy');
    await teacherStore.loadTeacherData('tenant-al-xorazmiy');

    const wrapper = mount(TeacherClassesView, {
      global: {
        stubs: {
          'router-link': {
            template: '<a><slot /></a>',
          },
          CreateClassModal: true,
          ClassCard: true,
        },
      },
    });
    await flushPromises();

    const searchInput = wrapper.find('input[aria-label="Sinf nomi yoki rahbari bo\'yicha qidirish"]');
    expect(searchInput.exists()).toBe(true);

    const gradeSelect = wrapper.find('select[aria-label="Parallel sinf bo\'yicha saralash"]');
    expect(gradeSelect.exists()).toBe(true);

    const shiftSelect = wrapper.find('select[aria-label="Smena bo\'yicha saralash"]');
    expect(shiftSelect.exists()).toBe(true);

    const addBtn = wrapper.find('button[aria-label="Yangi sinf qo\'shish"]');
    expect(addBtn.exists()).toBe(true);

    const toolbar = wrapper.find('.bg-white.dark\\:bg-slate-800');
    expect(toolbar.exists()).toBe(true);
  });

  it('renders ClassCard with dark theme styles and accessible link', () => {
    const dummyClass = {
      id: 'class-ax-11a',
      schoolId: 'sch-01',
      tenantId: 'tenant-al-xorazmiy',
      name: '11-A',
      grade: 11,
      academicYear: '2026-2027',
      studentCount: 28,
      shift: 1 as const,
      headTeacherName: 'Dilmurod Ustoz',
    };

    const wrapper = mount(ClassCard, {
      props: {
        classItem: dummyClass,
        tenantSlug: 'al-xorazmiy',
      },
      global: {
        stubs: {
          'router-link': {
            template: '<a :href="to" :aria-label="ariaLabel"><slot /></a>',
            props: ['to', 'ariaLabel'],
          },
        },
      },
    });

    const card = wrapper.find('.bg-white.dark\\:bg-slate-800');
    expect(card.exists()).toBe(true);
    expect(wrapper.text()).toContain('11-A');
    expect(wrapper.text()).toContain('28 nafar');
    expect(wrapper.text()).toContain('1-smena');
  });

  it('renders TeacherClassDetailView with dark theme cards and responsive table', async () => {
    const tenantStore = useTenantStore();
    const teacherStore = useTeacherStore();
    await tenantStore.loadTenant('al-xorazmiy');
    await teacherStore.loadClassDetail('tenant-al-xorazmiy', 'class-ax-11a');

    const wrapper = mount(TeacherClassDetailView, {
      global: {
        stubs: {
          'router-link': {
            template: '<a><slot /></a>',
          },
        },
      },
    });
    await flushPromises();

    const card = wrapper.find('.bg-white.dark\\:bg-slate-800');
    expect(card.exists()).toBe(true);

    const tableWrapper = wrapper.find('.overflow-x-auto');
    expect(tableWrapper.exists()).toBe(true);
  });
});
