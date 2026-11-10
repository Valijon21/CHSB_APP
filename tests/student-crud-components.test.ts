import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import CreateStudentModal from '../src/features/organization/components/CreateStudentModal.vue';
import BulkStudentImportModal from '../src/features/organization/components/BulkStudentImportModal.vue';
import type { StudentRecord, StudentInput, ClassGroupRecord } from '../src/entities/organization/model';

describe('TASK-MS.6: Student CRUD & Bulk Excel/CSV Import Components', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const mockClasses: ClassGroupRecord[] = [
    {
      id: 'cls-11a',
      schoolId: 'sch-01',
      tenantSlug: 'al-xorazmiy',
      name: '11-A',
      gradeLevel: 11,
      shift: 1,
      academicYear: '2026-2027',
      studentCount: 25,
      createdAt: '2026-09-01T08:00:00Z',
    },
  ];

  it('renders CreateStudentModal and emits create with validated student data', async () => {
    const wrapper = mount(CreateStudentModal, {
      props: {
        isOpen: true,
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
        availableClasses: mockClasses,
      },
    });

    expect(wrapper.text()).toContain('Yakka Tartibda O\'quvchi Qo\'shish');
    expect(wrapper.text()).toContain('11-A');

    const inputs = wrapper.findAll('input');
    // Familiya
    await inputs[0]?.setValue('Karimov');
    // Ism
    await inputs[1]?.setValue('Bekzod');
    // Sharif
    await inputs[2]?.setValue('Anvarovich');

    // Tug'ilgan sana
    const birthDateInput = wrapper.findAll('input').find((i) => i.attributes('placeholder') === '2009-05-18');
    await birthDateInput?.setValue('2008-05-18');

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');

    expect(wrapper.emitted('create')).toBeTruthy();
    const emittedData = wrapper.emitted('create')?.[0]?.[0] as StudentRecord;
    expect(emittedData.firstName).toBe('Bekzod');
    expect(emittedData.lastName).toBe('Karimov');
    expect(emittedData.className).toBe('11-A');
  });

  it('renders BulkStudentImportModal, parses raw lines into preview table and emits bulk-import', async () => {
    const wrapper = mount(BulkStudentImportModal, {
      props: {
        isOpen: true,
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
        availableClasses: mockClasses,
      },
    });

    expect(wrapper.text()).toContain('O\'quvchilarni Ommaviy Yuklash');

    // Enter raw lines
    const textarea = wrapper.find('textarea');
    await textarea.setValue(`
1. Olimov Jasurbek, M, 2008-04-12
2. Aliyeva Madina, F, 2008-09-20
    `);

    // Click Parse
    const parseBtn = wrapper.findAll('button').find((b) => b.text().includes('Ro\'yxatni Tahlil Qilish'));
    await parseBtn?.trigger('click');

    // Preview table should appear
    expect(wrapper.text()).toContain('2 nafar o\'quvchi aniqlandi');
    expect(wrapper.text()).toContain('Olimov Jasurbek');
    expect(wrapper.text()).toContain('Aliyeva Madina');

    // Confirm
    const confirmBtn = wrapper.findAll('button').find((b) => b.text().includes('Tasdiqlash va Bazaga Saqlash'));
    await confirmBtn?.trigger('click');

    expect(wrapper.emitted('bulk-import')).toBeTruthy();
    const emittedList = wrapper.emitted('bulk-import')?.[0]?.[0] as StudentInput[];
    expect(emittedList.length).toBe(2);
    expect(emittedList[0]?.lastName).toBe('Olimov');
    expect(emittedList[1]?.gender).toBe('F');
  });
});

