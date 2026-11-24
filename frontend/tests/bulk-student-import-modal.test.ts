import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import * as XLSX from 'xlsx';
import BulkStudentImportModal from '../src/features/organization/components/BulkStudentImportModal.vue';
import type { ClassGroupRecord } from '../src/entities/organization/model';

describe('BulkStudentImportModal.vue', () => {
  const dummyClasses: ClassGroupRecord[] = [
    {
      id: 'cls-10-v',
      name: '10-V sinf',
      schoolId: 'sch-01',
      tenantSlug: 'al-xorazmiy',
      gradeLevel: 10,
      shift: 1,
      academicYear: '2026-2027',
      studentCount: 25,
      createdAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'cls-11-a',
      name: '11-A sinf',
      schoolId: 'sch-01',
      tenantSlug: 'al-xorazmiy',
      gradeLevel: 11,
      shift: 1,
      academicYear: '2026-2027',
      studentCount: 28,
      createdAt: '2026-09-01T08:00:00Z',
    },
  ];

  it('renders modal when isOpen is true', () => {
    const wrapper = mount(BulkStudentImportModal, {
      props: {
        isOpen: true,
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
        availableClasses: dummyClasses,
      },
    });

    expect(wrapper.text()).toContain("O'quvchilarni Ommaviy Yuklash");
    expect(wrapper.text()).toContain('1-guruh');
    expect(wrapper.text()).toContain('2-guruh');
  });

  it('parses Excel file client-side and shows preview table', async () => {
    const wrapper = mount(BulkStudentImportModal, {
      props: {
        isOpen: true,
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
        availableClasses: dummyClasses,
      },
    });

    // Create an in-memory eMaktab Excel workbook
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['Sinf: 10-V 2026/2027 o‘quv yili'],
      ['Fan: Informatika'],
      ['o‘qituvchining FIO: Dilmurod Rahmataliyevich Yunusov'],
      [],
      ['X/X №', 'Oy', '', 'Noyabr', '', 'FB', 'Ballar', 'Tavsiya. Baho', '2 Chorak'],
      ['', 'Son', '', 10, 16],
      ['', 'O‘quvchining ism va familiyasi'],
      ['', '', '', '2555715759661962397'],
      [1, 'Abbosova Bahora', '1000005839035', 8],
      [2, 'Abduraximov Azamatjon', '1000018350347', 8],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Fan jurnali');
    const u8 = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const file = new File([u8], '10-V-Informatika-20_11_2026.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Find file input and trigger change
    const fileInput = wrapper.find('input[type="file"]');
    Object.defineProperty(fileInput.element, 'files', {
      value: [file],
      writable: true,
    });

    await fileInput.trigger('change');
    // Allow promises to resolve
    await new Promise((r) => setTimeout(r, 100));

    expect(wrapper.text()).toContain("2 nafar o'quvchi aniqlandi");
    expect(wrapper.text()).toContain('Abbosova Bahora');
    expect(wrapper.text()).toContain('Abduraximov Azamatjon');
    expect(wrapper.text()).toContain('1000005839035');

    // Confirm import
    const confirmBtn = wrapper.find('button.bg-emerald-700');
    expect(confirmBtn.exists()).toBe(true);
    await confirmBtn.trigger('click');

    const emitted = wrapper.emitted('bulk-import');
    expect(emitted).toBeTruthy();
    expect(emitted![0]![0]).toHaveLength(2);
    expect((emitted![0]![0] as any[])[0].classGroupId).toBe('cls-10-v');
    expect((emitted![0]![0] as any[])[0].group).toBe('1-guruh');
  });
});
