import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import BulkStudentImportModal from '../src/features/organization/components/BulkStudentImportModal.vue';
import type { StudentInput, ClassGroupRecord } from '../src/entities/organization/model';

describe('BulkStudentImportModal Advanced Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const mockClasses: ClassGroupRecord[] = [
    {
      id: 'class-ax-10a',
      schoolId: 'school-ax-1',
      tenantSlug: 'al-xorazmiy',
      name: '10-A sinf',
      gradeLevel: 10,
      shift: 1,
      academicYear: '2026-2027',
      studentCount: 20,
      createdAt: '2026-09-01T08:00:00Z',
    },
  ];

  it('correctly parses tab-separated eMaktab table and prevents number-as-name bugs', async () => {
    const wrapper = mount(BulkStudentImportModal, {
      props: {
        isOpen: true,
        schoolId: 'school-ax-1',
        tenantSlug: 'al-xorazmiy',
        availableClasses: mockClasses,
      },
    });

    // Switch to text tab
    const textTabBtn = wrapper.findAll('button').find((b) => b.text().includes('Nusxalangan Matn'));
    await textTabBtn?.trigger('click');

    const textarea = wrapper.find('textarea');
    // Simulate copied table from eMaktab / Excel
    await textarea.setValue(`
X/X №\tFamiliya va Ism\tJinsi\tTug'ilgan sana\tO'chirish
1\tYunusov Dilmurod Rahmataliyevich\tO'g'il\t2009-01-01\t✕
2\tSharafxonova Dilrabo Turdialiyevna\tQiz\t2009-03-15\t✕
3\t2555715665172681667\tAbdullayev Jasur\tO'g'il\t2009-06-20\t✕
    `);

    const parseBtn = wrapper.findAll('button').find((b) => b.text().includes('Ro\'yxatni Tahlil Qilish'));
    await parseBtn?.trigger('click');

    expect(wrapper.text()).toContain('3 nafar o\'quvchi aniqlandi');
    expect(wrapper.text()).toContain('Yunusov Dilmurod');
    expect(wrapper.text()).toContain('Sharafxonova Dilrabo');
    expect(wrapper.text()).toContain('Abdullayev Jasur');

    // Remove third student via ✕ button
    const deleteBtns = wrapper.findAll('button').filter((b) => b.attributes('aria-label') === 'O\'chirish');
    expect(deleteBtns.length).toBe(3);
    await deleteBtns[2]?.trigger('click');

    expect(wrapper.text()).toContain('2 nafar o\'quvchi aniqlandi');

    // Confirm and emit
    const confirmBtn = wrapper.findAll('button').find((b) => b.text().includes('Tasdiqlash va Bazaga Saqlash'));
    await confirmBtn?.trigger('click');

    expect(wrapper.emitted('bulk-import')).toBeTruthy();
    const emitted = wrapper.emitted('bulk-import')?.[0]?.[0] as StudentInput[];
    expect(emitted).toHaveLength(2);
    expect(emitted[0]?.lastName).toBe('Yunusov');
    expect(emitted[0]?.gender).toBe('M');
    expect(emitted[1]?.lastName).toBe('Sharafxonova');
    expect(emitted[1]?.gender).toBe('F');
  });

  it('rejects binary file text and shows user-friendly warning message', async () => {
    const wrapper = mount(BulkStudentImportModal, {
      props: {
        isOpen: true,
        schoolId: 'school-ax-1',
        tenantSlug: 'al-xorazmiy',
        availableClasses: mockClasses,
      },
    });

    const textTabBtn = wrapper.findAll('button').find((b) => b.text().includes('Nusxalangan Matn'));
    await textTabBtn?.trigger('click');

    const textarea = wrapper.find('textarea');
    await textarea.setValue('ࡱ\x00\x02\x04\x00Ismsiz');

    const parseBtn = wrapper.findAll('button').find((b) => b.text().includes('Ro\'yxatni Tahlil Qilish'));
    await parseBtn?.trigger('click');

    expect(wrapper.text()).toContain('ikkilik (binary) Excel faylini matn sifatida nusxalagansiz');
  });

  it('correctly handles file upload for eMaktab journal file and extracts real students', async () => {
    const csvData = [
      'Sinf: 10-A (1-gurux) 2026/2027 o‘quv yili,,,,,,,,,,,,,,,,,,,,',
      'Fan: Informatika va axbarotlar texnologiyasi,,,,,,,,,,,,,,,,,,,,',
      '1691610383141616760,,,,,,,,,,,,,,,,,,,,',
      'o‘qituvchining FIO: Dilmurod Rahmataliyevich Yunusov,,,,,,,,,,,,,,,,,,,,',
      ',,,,,,,,,,,,,,,,,,,,',
      'X/X №,Oy,,Noyabr,,,,,,Dekabr,,,,,,,FB,Ballar,Tavsiya. Baho,2 Chorak ,1 yarim yillik',
      ',Son,,10,11,17,18,24,25,1,2,9,15,16,22,23,,,,,',
      ',O‘quvchining ism va familiyasi,,,,,,,,,,,,,,,,,,,',
      ',,,2555715665172681667,2555715665172681666',
      '1,Abdullayeva Dilafro‘z,1000003546584,7,,8,,,,,,,,,,,0,0,0,,',
      '2,Akbaraliyeva Shahlo,1000011564262,,7,,8,,,,,,,,,,0,0,0,,',
    ].join('\n');

    const file = new File([csvData], '10-A-Informatika-20_11_2026.csv', { type: 'text/csv' });

    const wrapper = mount(BulkStudentImportModal, {
      props: {
        isOpen: true,
        schoolId: 'school-ax-1',
        tenantSlug: 'al-xorazmiy',
        availableClasses: mockClasses,
      },
    });

    const fileInput = wrapper.find('input[type="file"]');
    Object.defineProperty(fileInput.element, 'files', {
      value: [file],
    });
    await fileInput.trigger('change');

    await new Promise((resolve) => setTimeout(resolve, 50));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('2 nafar o\'quvchi aniqlandi');
    expect(wrapper.text()).toContain('Abdullayeva');
    expect(wrapper.text()).toContain('Akbaraliyeva');
  });
});

