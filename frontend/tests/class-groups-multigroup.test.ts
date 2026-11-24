import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import {
  detectGroupFromText,
  parseEmaktabRoster,
} from '../src/features/emaktab/services/rosterParserService';
import { useTeacherStore } from '../src/features/teacher/teacherStore';
import { useStudentAdmissionStore } from '../src/features/student-admission/admissionStore';
import StudentVerifyView from '../src/features/student-admission/StudentVerifyView.vue';

// Mock vue-router for StudentVerifyView
vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      tenantSlug: 'al-xorazmiy',
    },
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('Class Groups & eMaktab Multi-Group Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('1. detectGroupFromText', () => {
    it('detects 1-gurux from official eMaktab journal header format', () => {
      const header = "Sinf: 11-A (1-gurux) 2026/2027 o‘quv yili";
      expect(detectGroupFromText(header)).toBe('1-guruh');
    });

    it('detects 2-gurux from official eMaktab journal header format', () => {
      const header = "Sinf: 11-A (2-gurux) 2026/2027 o‘quv yili";
      expect(detectGroupFromText(header)).toBe('2-guruh');
    });

    it('detects standard latin 1-guruh and 2-guruh variants', () => {
      expect(detectGroupFromText('Informatika 1-guruh amaliy')).toBe('1-guruh');
      expect(detectGroupFromText('Ingliz tili (2-guruh)')).toBe('2-guruh');
      expect(detectGroupFromText('11-A_Informatika_1_guruh.xlsx')).toBe('1-guruh');
      expect(detectGroupFromText('11-A_2-guruh_jurnal.xls')).toBe('2-guruh');
    });

    it('returns undefined when no group is specified in text', () => {
      expect(detectGroupFromText('Sinf: 9-A Matematika 2026/2027')).toBeUndefined();
      expect(detectGroupFromText('10-B sinf o\'quvchilari ro\'yxati')).toBeUndefined();
    });
  });

  describe('2. parseEmaktabRoster with Group and eMaktab ID support', () => {
    it('parses real 11-A (1-gurux) snippet and attaches 1-guruh and 13-digit eMaktab IDs', () => {
      const eMaktabSnippet = `
Sinf: 11-A (1-gurux) 2026/2027 o‘quv yili
Fan: Informatika va axborot texnologiyalari
O‘qituvchi: Yunusov Dilmurod Rahmataliyevich

T/r	eMaktab ID	O'quvchi F.I.SH	Jinsi
1	1000001990090	Abduraximova Zuxra Farxod qizi	F
2	1000001990100	Bozorova Dilfuza Sherzod qizi	F
3	1000002155432	Ergashev Jasur Akram o'g'li	M
      `;

      const students = parseEmaktabRoster(eMaktabSnippet, '11-A');
      expect(students.length).toBe(3);

      expect(students[0]?.fullName).toBe('Abduraximova Zuxra Farxod qizi');
      expect(students[0]?.emaktabId).toBe('1000001990090');
      expect(students[0]?.group).toBe('1-guruh');
      expect(students[0]?.gender).toBe('F');

      expect(students[2]?.fullName).toBe("Ergashev Jasur Akram o'g'li");
      expect(students[2]?.emaktabId).toBe('1000002155432');
      expect(students[2]?.group).toBe('1-guruh');
      expect(students[2]?.gender).toBe('M');
    });

    it('uses explicit defaultGroup parameter when text header does not contain group', () => {
      const plainSnippet = `
1. Karimova Lola
2. Rahimova Gulnoza
      `;

      const students = parseEmaktabRoster(plainSnippet, '9-B', '2-guruh');
      expect(students.length).toBe(2);
      expect(students[0]?.fullName).toBe('Karimova Lola');
      expect(students[0]?.group).toBe('2-guruh');
      expect(students[1]?.group).toBe('2-guruh');
    });
  });

  describe('3. Teacher Store Multi-Group Filtering', () => {
    it('filters roster by selectedGroupFilter (1-guruh, 2-guruh, ALL)', () => {
      const teacherStore = useTeacherStore();

      // Populate roster with mixed groups
      teacherStore.roster = [
        {
          id: 'stu-01',
          code: 'STU-1101',
          name: 'Zuxra Abduraximova',
          className: '11-A',
          group: '1-guruh',
          status: 'eligible',
        },
        {
          id: 'stu-02',
          code: 'STU-1102',
          name: 'Dilfuza Bozorova',
          className: '11-A',
          group: '1-guruh',
          status: 'eligible',
        },
        {
          id: 'stu-16',
          code: 'STU-1116',
          name: 'Bobur Mirzayev',
          className: '11-A',
          group: '2-guruh',
          status: 'eligible',
        },
        {
          id: 'stu-17',
          code: 'STU-1117',
          name: 'Sarvar Xalilov',
          className: '11-A',
          group: '2-guruh',
          status: 'eligible',
        },
      ] as any;

      // 1. Filter by 1-guruh
      teacherStore.filterByGroup('1-guruh');
      expect(teacherStore.selectedGroupFilter).toBe('1-guruh');
      expect(teacherStore.filteredRoster.length).toBe(2);
      expect(teacherStore.filteredRoster.every((s) => s.group === '1-guruh')).toBe(true);

      // 2. Filter by 2-guruh
      teacherStore.filterByGroup('2-guruh');
      expect(teacherStore.selectedGroupFilter).toBe('2-guruh');
      expect(teacherStore.filteredRoster.length).toBe(2);
      expect(teacherStore.filteredRoster.every((s) => s.group === '2-guruh')).toBe(true);

      // 3. Reset to ALL
      teacherStore.filterByGroup('ALL');
      expect(teacherStore.selectedGroupFilter).toBe('ALL');
      expect(teacherStore.filteredRoster.length).toBe(4);
    });
  });

  describe('4. Student Admission Group Display', () => {
    it('renders group badge and eMaktab ID in StudentVerifyView', async () => {
      const admissionStore = useStudentAdmissionStore();

      admissionStore.currentMatch = {
        rosterRecordId: 'stu-1101',
        studentId: 'stu-1101',
        rosterCode: 'STU-1101',
        displayName: 'Zuxra Abduraximova',
        className: '11-A sinf',
        group: '1-guruh',
        emaktabId: '1000001990090',
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
        status: 'eligible',
        availableAssessmentIds: ['asm-11-inf-01'],
      } as any;

      const wrapper = mount(StudentVerifyView, {
        global: {
          stubs: {
            'router-link': {
              template: '<a><slot /></a>',
            },
          },
        },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Zuxra Abduraximova');
      expect(wrapper.text()).toContain('11-A sinf');
      expect(wrapper.text()).toContain('1-guruh');
      expect(wrapper.text()).toContain('1000001990090');
    });
  });
});
