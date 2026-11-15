import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CreateClassModal from '../src/features/organization/components/CreateClassModal.vue';
import type { TeacherRecord } from '../src/entities/organization/model';

describe('TASK-CLS.2: CreateClassModal Component', () => {
  const dummyTeachers: TeacherRecord[] = [
    {
      id: 'tch-01',
      schoolId: 'sch-01',
      tenantSlug: 'al-xorazmiy',
      fullName: 'Dilmurod Quryazov',
      subject: 'Informatika',
      qualification: 'oliy',
      assignedClassIds: [],
      assignedClassNames: [],
      phone: '+998901234567',
      status: 'active',
      createdAt: '2026-09-01T08:00:00Z',
    },
  ];

  it('renders modal when isOpen is true', () => {
    const wrapper = mount(CreateClassModal, {
      props: {
        isOpen: true,
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
        availableTeachers: dummyTeachers,
      },
    });

    expect(wrapper.text()).toContain('Yangi Sinf Guruhini Ochish');
    expect(wrapper.find('input[placeholder*="9-A"]').exists()).toBe(true);
  });

  it('validates short class name and shows error message', async () => {
    const wrapper = mount(CreateClassModal, {
      props: {
        isOpen: true,
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
        availableTeachers: dummyTeachers,
      },
    });

    const input = wrapper.find('input[placeholder*="9-A"]');
    await input.setValue('9'); // only 1 char
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.text()).toContain('Sinf nomi kamida 2 ta belgi bo\'lishi kerak');
    expect(wrapper.emitted('create')).toBeFalsy();
  });

  it('submits valid class input and emits create event', async () => {
    const wrapper = mount(CreateClassModal, {
      props: {
        isOpen: true,
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
        availableTeachers: dummyTeachers,
      },
    });

    const select = wrapper.find('select');
    await select.setValue(9);

    const input = wrapper.find('input[placeholder*="9-A"]');
    await input.setValue('9-B');

    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.emitted('create')).toBeTruthy();
    const emittedData = wrapper.emitted('create')?.[0]?.[0];
    expect(emittedData).toMatchObject({
      schoolId: 'sch-01',
      tenantSlug: 'al-xorazmiy',
      name: '9-B',
      gradeLevel: 9,
      shift: 1,
    });
  });
});
