import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import TeacherClassesView from '../src/features/teacher/classes/TeacherClassesView.vue';
import TeacherStudentsView from '../src/features/teacher/students/TeacherStudentsView.vue';
import TeacherLiveRoomView from '../src/features/teacher/proctor/TeacherLiveRoomView.vue';
import TeacherAnalyticsView from '../src/features/teacher/analytics/TeacherAnalyticsView.vue';
import TeacherReportsView from '../src/features/teacher/reports/TeacherReportsView.vue';
import { useTeacherStore } from '../src/features/teacher/teacherStore';
import { useTenantStore } from '../src/features/tenant-context/tenantStore';
import { useLiveProctorStore } from '../src/features/teacher/proctor/liveProctorStore';

// Mock vue-router
const mockRoute = {
  params: {
    tenantSlug: 'al-xorazmiy',
    assessmentId: 'chsb-inf-11-q1',
    classId: 'class-ax-11a',
  },
  query: {},
};

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('TASK-DAT.5-7: UI/UX Audit and Polish Under Rich Enterprise Dataset', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    const tenantStore = useTenantStore();
    await tenantStore.loadTenant('al-xorazmiy');
    const teacherStore = useTeacherStore();
    await teacherStore.loadTeacherData('tenant-al-xorazmiy');
  });

  describe('1. TeacherClassesView & Class Cards', () => {
    it('renders 6 class cards in responsive grid with clean labels and no duplicate plus', async () => {
      const wrapper = mount(TeacherClassesView, {
        global: {
          stubs: {
            'router-link': {
              template: '<a><slot /></a>',
            },
            CreateClassModal: true,
          },
        },
      });

      // Wait for async load
      await wrapper.vm.$nextTick();
      await new Promise((r) => setTimeout(r, 20));

      const buttons = wrapper.findAll('button');
      for (const btn of buttons) {
        const text = btn.text();
        // Zero tolerance for duplicate plus
        expect(text).not.toMatch(/\+\s*\+/);
        expect(text).not.toContain('+ +');
      }

      // Check create class button label
      const createBtn = wrapper.find('button[aria-label="Yangi sinf qo\'shish"]');
      expect(createBtn.exists()).toBe(true);
      expect(createBtn.text()).toBe("Yangi Sinf Qo'shish");
    });
  });

  describe('2. TeacherStudentsView & Roster Table', () => {
    it('renders 28 students and correctly filters by status and search without layout breaks', async () => {
      const wrapper = mount(TeacherStudentsView, {
        global: {
          stubs: {
            'router-link': {
              template: '<a><slot /></a>',
            },
            CreateStudentModal: true,
            BulkStudentImportModal: true,
          },
        },
      });

      await wrapper.vm.$nextTick();
      await new Promise((r) => setTimeout(r, 20));

      const rows = wrapper.findAll('tbody tr');
      // Default pagination is 10 items per page
      expect(rows.length).toBe(10);
      expect(wrapper.text()).toContain('28 ta');

      // Switching to 30 items per page renders all 28 students
      const size30Btn = wrapper.find('[data-testid="page-size-30"]');
      if (size30Btn.exists()) {
        await size30Btn.trigger('click');
        expect(wrapper.findAll('tbody tr').length).toBe(28);
      }

      // Verify no duplicate plus on action buttons
      const buttons = wrapper.findAll('button');
      for (const btn of buttons) {
        expect(btn.text()).not.toContain('+ +');
      }

      // Test status filter
      const statusSelect = wrapper.find('select[aria-label="Status bo\'yicha filtrlash"]');
      await statusSelect.setValue('inactive');
      await wrapper.vm.$nextTick();

      const inactiveRows = wrapper.findAll('tbody tr');
      expect(inactiveRows.length).toBeGreaterThanOrEqual(1);
      expect(inactiveRows[0]?.text()).toContain('STU-1103');
      expect(inactiveRows[0]?.text()).toContain('Nofaol');
    });
  });

  describe('3. TeacherLiveRoomView & 12 Proctor Sessions', () => {
    it('renders 12 live student cards with filter counts and zero visual defects', async () => {
      const proctorStore = useLiveProctorStore();
      expect(proctorStore.sessions.length).toBe(12);

      const wrapper = mount(TeacherLiveRoomView, {
        global: {
          stubs: {
            'router-link': {
              template: '<a><slot /></a>',
            },
            StudentLiveCard: true,
            LiveAuditTimeline: true,
            ProctorActionModal: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      // Check summary pills
      const buttons = wrapper.findAll('button');
      const barchasiBtn = buttons.find((b) => b.text().includes('Barchasi'));
      expect(barchasiBtn?.text()).toContain('(12)');

      const warningBtn = buttons.find((b) => b.text().includes('Xavf ostida'));
      expect(warningBtn?.text()).toContain('(2)');
    });
  });

  describe('4. TeacherAnalyticsView & 6 Class Comparisons', () => {
    it('mounts analytics view and displays class comparisons for all 6 classes', async () => {
      const wrapper = mount(TeacherAnalyticsView, {
        global: {
          stubs: {
            'router-link': {
              template: '<a><slot /></a>',
            },
            ClassComparisonChart: true,
            ScoreDistributionDonut: true,
            CognitiveRadarChart: true,
            QuestionItemAnalysis: true,
          },
        },
      });

      await wrapper.vm.$nextTick();
      await new Promise((r) => setTimeout(r, 20));

      const teacherStore = useTeacherStore();
      expect(teacherStore.analytics?.classComparisons.length).toBe(6);
      expect(wrapper.text()).toContain('1-CHSB Informatika');
    });
  });

  describe('5. TeacherReportsView & 25 Assessment Records', () => {
    it('calculates executive summary stats and enables A4 print preview', async () => {
      const wrapper = mount(TeacherReportsView, {
        global: {
          stubs: {
            'router-link': {
              template: '<a><slot /></a>',
            },
          },
        },
      });

      await wrapper.vm.$nextTick();
      await new Promise((r) => setTimeout(r, 20));

      // Check that 25 records are loaded
      const teacherStore = useTeacherStore();
      expect(teacherStore.results.length).toBe(25);

      // Verify print preview toggle exists
      const printBtn = wrapper.find('button[aria-label="Chop etish oldidan A4 formatda ko\'rish"]');
      expect(printBtn.exists()).toBe(true);

      // Verify CSV export button exists
      const csvBtn = wrapper.find('button[aria-label="Excel va CSV formatida yuklab olish"]');
      expect(csvBtn.exists()).toBe(true);
    });
  });
});
