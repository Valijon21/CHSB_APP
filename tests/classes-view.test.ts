import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import ClassCard from '../src/features/teacher/classes/components/ClassCard.vue';
import TeacherClassesView from '../src/features/teacher/classes/TeacherClassesView.vue';
import { useOrganizationStore } from '../src/features/organization/store/organizationStore';

describe('TASK-CLS.3: TeacherClassesView & ClassCard Unit Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders ClassCard properly with metadata', () => {
    const dummyClass = {
      id: 'cls-10a',
      schoolId: 'sch-01',
      tenantSlug: 'al-xorazmiy',
      name: '10-A',
      gradeLevel: 10,
      shift: 1 as const,
      academicYear: '2026-2027',
      headTeacherName: 'Dilmurod Quryazov',
      studentCount: 28,
      createdAt: '2026-09-01T08:00:00Z',
    };

    const wrapper = mount(ClassCard, {
      props: {
        classItem: dummyClass,
        tenantSlug: 'al-xorazmiy',
      },
      global: {
        stubs: ['router-link'],
      },
    });

    expect(wrapper.text()).toContain('10-A');
    expect(wrapper.text()).toContain('10-sinf');
    expect(wrapper.text()).toContain('1-smena');
    expect(wrapper.text()).toContain('Dilmurod Quryazov');
    expect(wrapper.text()).toContain('28 nafar');
  });

  it('mounts TeacherClassesView, displays toolbar and create class button', async () => {
    const orgStore = useOrganizationStore();
    await orgStore.loadSchoolContext('al-xorazmiy');

    const wrapper = mount(TeacherClassesView, {
      global: {
        stubs: ['router-link'],
      },
    });

    // Wait for async setup
    await new Promise((r) => setTimeout(r, 60));

    expect(wrapper.text()).toContain('Maktab Sinflari Boshqaruvi');
    expect(wrapper.text()).toContain('+ Yangi Sinf Qo\'shish');
    expect(wrapper.find('input[placeholder*="Sinf nomi"]').exists()).toBe(true);
  });
});

