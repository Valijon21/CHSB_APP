import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import CreateTeacherModal from '../src/features/organization/components/CreateTeacherModal.vue';
import TeacherRosterTable from '../src/features/organization/components/TeacherRosterTable.vue';
import type { TeacherRecord, ClassGroupRecord } from '../src/entities/organization/model';

describe('TASK-MS.5: Teacher Management Components', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders CreateTeacherModal, toggles class assignments and emits create', async () => {
    const mockClasses: ClassGroupRecord[] = [
      {
        id: 'cls-10a',
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
        name: '10-A',
        gradeLevel: 10,
        shift: 1,
        academicYear: '2026-2027',
        studentCount: 26,
        createdAt: '2026-09-01T08:00:00Z',
      },
    ];

    const wrapper = mount(CreateTeacherModal, {
      props: {
        isOpen: true,
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
        availableClasses: mockClasses,
      },
    });

    expect(wrapper.text()).toContain('Yangi O\'qituvchi Qo\'shish');
    expect(wrapper.text()).toContain('10-A');

    // Fill form
    const inputs = wrapper.findAll('input');
    await inputs[0]?.setValue('Quryazova Rayhon');
    await inputs[1]?.setValue('+998901112233');

    // Toggle class
    const classBtn = wrapper.findAll('button').find((b) => b.text().includes('10-A'));
    await classBtn?.trigger('click');

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');

    expect(wrapper.emitted('create')).toBeTruthy();
    const emittedData = wrapper.emitted('create')?.[0]?.[0] as TeacherRecord;
    expect(emittedData.fullName).toBe('Quryazova Rayhon');
    expect(emittedData.assignedClassIds).toContain('cls-10a');
  });

  it('renders TeacherRosterTable and emits delete event', async () => {
    const teachers: TeacherRecord[] = [
      {
        id: 'tch-10',
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
        fullName: 'Anvar Rahimov',
        subject: 'Informatika',
        qualification: 'oliy',
        assignedClassIds: ['cls-10a'],
        assignedClassNames: ['10-A'],
        phone: '+998901234567',
        status: 'active',
        createdAt: '2026-09-01T08:00:00Z',
      },
    ];

    const wrapper = mount(TeacherRosterTable, {
      props: { teachers },
    });

    expect(wrapper.text()).toContain('Anvar Rahimov');
    expect(wrapper.text()).toContain('Informatika');
    expect(wrapper.text()).toContain('10-A');

    // Click delete
    const deleteBtn = wrapper.findAll('button').find((b) => b.text() === 'O\'chirish');
    await deleteBtn?.trigger('click');

    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')?.[0]?.[0]).toBe('tch-10');
  });
});
