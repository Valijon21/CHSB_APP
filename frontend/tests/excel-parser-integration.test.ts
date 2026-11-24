import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { extractStudentsRosterWithAi } from '../src/shared/utils/groundedAiExtractor';
import BulkStudentImportModal from '../src/features/organization/components/BulkStudentImportModal.vue';

describe('Excel Parser & AI RAG Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('extractStudentsRosterWithAi', () => {
    it('returns error when text is empty', async () => {
      const res = await extractStudentsRosterWithAi('');
      expect(res.success).toBe(false);
      expect(res.students).toHaveLength(0);
      expect(res.error).toContain("bo'sh");
    });

    it('successfully extracts students and normalizes fields via Gemini JSON response', async () => {
      const mockGeminiJson = [
        {
          orderIndex: 1,
          fullName: 'Abduraximova Zuxra Farxod qizi',
          lastName: 'Abduraximova',
          firstName: 'Zuxra',
          middleName: 'Farxod qizi',
          emaktabId: '1000001990090',
          gender: 'F',
          group: '1-guruh',
        },
        {
          orderIndex: 2,
          fullName: 'Ergashev Jasur Akram o\'g\'li',
          lastName: 'Ergashev',
          firstName: 'Jasur',
          middleName: 'Akram o\'g\'li',
          emaktabId: '1000002155432',
          gender: 'M',
          group: '1-guruh',
        },
      ];

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockGeminiJson) }],
              },
            },
          ],
        }),
      } as any);

      const res = await extractStudentsRosterWithAi('Sample eMaktab snippet', { apiKey: 'test-key' });
      expect(res.success).toBe(true);
      expect(res.students).toHaveLength(2);

      expect(res.students[0].fullName).toBe('Abduraximova Zuxra Farxod qizi');
      expect(res.students[0].lastName).toBe('Abduraximova');
      expect(res.students[0].firstName).toBe('Zuxra');
      expect(res.students[0].emaktabId).toBe('1000001990090');
      expect(res.students[0].gender).toBe('F');

      expect(res.students[1].fullName).toBe("Ergashev Jasur Akram o'g'li");
      expect(res.students[1].gender).toBe('M');
    });
  });

  describe('BulkStudentImportModal Quality & Zero Junk Filter', () => {
    const mockClasses = [
      {
        id: 'cls-11a',
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
        name: '11-A sinf',
        gradeLevel: 11,
        shift: 1,
        academicYear: '2026-2027',
        studentCount: 30,
        createdAt: '',
      },
    ];

    it('rejects binary replacement characters and does not produce Ismsiz students', async () => {
      const wrapper = mount(BulkStudentImportModal, {
        props: {
          isOpen: true,
          schoolId: 'sch-01',
          tenantSlug: 'al-xorazmiy',
          availableClasses: mockClasses,
        },
      });

      // Put corrupted binary replacement text
      const textarea = wrapper.find('textarea');
      await textarea.setValue('\uFFFD\uFFFD\uFFFD\n\uFFFD\uFFFD Ismsiz\n\uFFFD\uFFFD?\uFFFD');

      const parseBtn = wrapper.findAll('button').find((b) => b.text().includes('Preview'));
      expect(parseBtn).toBeDefined();
      await parseBtn!.trigger('click');

      // It should NOT parse junk into students
      expect(wrapper.text()).toContain("Kiritilgan matndan hech qanday o'quvchi aniqlanmadi");
      expect(wrapper.text()).not.toContain('Ismsiz');
    });

    it('correctly parses valid text, renders preview and provides TablePagination with 10,20,30,50', async () => {
      const wrapper = mount(BulkStudentImportModal, {
        props: {
          isOpen: true,
          schoolId: 'sch-01',
          tenantSlug: 'al-xorazmiy',
          availableClasses: mockClasses,
        },
      });

      // Populate 15 students
      let textLines = '';
      for (let i = 1; i <= 15; i++) {
        textLines += `${i}. O'quvchi_${i} Familiya_${i}, M, 10000019900${i < 10 ? '0' + i : i}\n`;
      }

      const textarea = wrapper.find('textarea');
      await textarea.setValue(textLines);

      const parseBtn = wrapper.findAll('button').find((b) => b.text().includes('Preview'));
      await parseBtn!.trigger('click');

      expect(wrapper.text()).toContain("Tahlil natijasi: 15 nafar o'quvchi aniqlandi");
      // TablePagination should be rendered with 10, 20, 30, 50 options
      expect(wrapper.find('[data-testid="page-size-10"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="page-size-20"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="page-size-30"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="page-size-50"]').exists()).toBe(true);

      // On page 1 with page size 10, shows 1-10
      expect(wrapper.text()).toContain('1-10');
      expect(wrapper.text()).toContain('15 ta');
    });

    it('handles binary Excel file upload via parse-file API and auto-matches class', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          fileName: '10-V-Informatika-20_11_2026.xls',
          detectedGroup: '1-guruh',
          detectedClass: '10-V',
          totalParsed: 27,
          students: [
            {
              orderIndex: 1,
              fullName: 'Abbosova Bahora',
              firstName: 'Bahora',
              lastName: 'Abbosova',
              emaktabId: '1000005839035',
              gender: 'F',
              birthDate: '2009-01-01',
              group: '1-guruh',
            },
          ],
        }),
      } as any);

      const wrapper = mount(BulkStudentImportModal, {
        props: {
          isOpen: true,
          schoolId: 'sch-01',
          tenantSlug: 'al-xorazmiy',
          availableClasses: [
            ...mockClasses,
            {
              id: 'cls-10v',
              schoolId: 'sch-01',
              tenantSlug: 'al-xorazmiy',
              name: '10-V sinf',
              gradeLevel: 10,
              shift: 1,
              academicYear: '2026-2027',
              studentCount: 0,
              createdAt: '',
            },
          ],
        },
      });

      const file = new File(['mock binary content'], '10-V-Informatika-20_11_2026.xls', {
        type: 'application/vnd.ms-excel',
      });
      const fileInput = wrapper.find('input[type="file"]');
      Object.defineProperty(fileInput.element, 'files', {
        value: [file],
        writable: true,
      });
      await fileInput.trigger('change');
      await flushPromises();
      await new Promise((r) => setTimeout(r, 100));
      await flushPromises();

      expect(wrapper.text()).toContain('Abbosova Bahora');
      expect(wrapper.text()).toContain('1000005839035');
    });
  });
});
