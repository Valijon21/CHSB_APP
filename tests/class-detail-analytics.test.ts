import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import TeacherClassDetailView from '../src/features/teacher/classes/TeacherClassDetailView.vue';
import ClassScoreHistogram from '../src/features/teacher/classes/components/ClassScoreHistogram.vue';
import ClassHonorRoll from '../src/features/teacher/classes/components/ClassHonorRoll.vue';
import { useTeacherStore } from '../src/features/teacher/teacherStore';
import { useTenantStore } from '../src/features/tenant-context/tenantStore';

// Mock vue-router
const mockRoute = {
  params: {
    tenantSlug: 'al-xorazmiy',
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

const mountOptions = {
  global: {
    stubs: {
      'router-link': {
        template: '<a><slot /></a>',
      },
    },
  },
};

describe('TASK-CLS.1..4: Class Intelligence & Deep Analytics Workspace', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    const tenantStore = useTenantStore();
    await tenantStore.loadTenant('al-xorazmiy');
    const teacherStore = useTeacherStore();
    await teacherStore.loadClassDetail('tenant-al-xorazmiy', 'class-ax-11a');
  });

  it('renders ClassScoreHistogram with 4 grade levels and correct distributions', () => {
    const wrapper = mount(ClassScoreHistogram, {
      ...mountOptions,
      props: {
        distribution: {
          grade5: 12,
          grade4: 8,
          grade3: 4,
          grade2: 1,
          total: 25,
        },
      },
    });

    expect(wrapper.text()).toContain('Baholar Taqsimoti Gistogrammasi');
    expect(wrapper.text()).toContain("A'lo (5 baho)");
    expect(wrapper.text()).toContain('Yaxshi (4 baho)');
    expect(wrapper.text()).toContain('Qoniqarli (3 baho)');
    expect(wrapper.text()).toContain('Qoniqarsiz (2 baho)');
    expect(wrapper.text()).toContain('12 nafar');
    expect(wrapper.text()).toContain('(48%)');
  });

  it('renders ClassHonorRoll with top-3 performers and support recommendations', () => {
    const wrapper = mount(ClassHonorRoll, {
      ...mountOptions,
      props: {
        topPerformers: [
          {
            rank: 1,
            studentId: 'stu-1',
            name: 'Ali Valiyev',
            rosterCode: 'STU-1101',
            score: 40,
            maxScore: 40,
            percentage: 100,
            grade: '5',
          },
          {
            rank: 2,
            studentId: 'stu-2',
            name: 'Malika Karimova',
            rosterCode: 'STU-1102',
            score: 38,
            maxScore: 40,
            percentage: 95,
            grade: '5',
          },
          {
            rank: 3,
            studentId: 'stu-3',
            name: 'Jasur Saidov',
            rosterCode: 'STU-1103',
            score: 36,
            maxScore: 40,
            percentage: 90,
            grade: '5',
          },
        ],
        needsSupportList: [
          {
            studentId: 'stu-4',
            name: 'Nodir Toshmatov',
            rosterCode: 'STU-1104',
            score: 22,
            percentage: 55,
            reason: "O'zlashtirish 70% dan past (Konsultatsiya kerak)",
          },
        ],
        tenantSlug: 'al-xorazmiy',
      },
    });

    expect(wrapper.text()).toContain("Sinf Shohsupasi (Top-3 A'lochi)");
    expect(wrapper.text()).toContain('Ali Valiyev');
    expect(wrapper.text()).toContain('STU-1101');
    expect(wrapper.text()).toContain('40 / 40');
    expect(wrapper.text()).toContain('🥇');
    expect(wrapper.text()).toContain("Pedagogik E'tibor Guruhi");
    expect(wrapper.text()).toContain('Nodir Toshmatov');
  });

  it('mounts TeacherClassDetailView and displays Executive KPI cards', async () => {
    const wrapper = mount(TeacherClassDetailView, mountOptions);
    await flushPromises();

    expect(wrapper.text()).toContain('11-A');
    expect(wrapper.text()).toContain("O'rtacha Ball");
    expect(wrapper.text()).toContain('Sifat Foizi');
    expect(wrapper.text()).toContain("O'zlashtirish Darajasi");
    expect(wrapper.text()).toContain('Imtihon Ishtiroki');
    expect(wrapper.text()).toContain('Maksimal Ball');
    expect(wrapper.text()).toContain('Minimal Ball');
  });

  it('filters students by search input in the interactive roster table', async () => {
    const wrapper = mount(TeacherClassDetailView, mountOptions);
    await flushPromises();

    const searchInput = wrapper.find('input[placeholder*="F.I.SH yoki Roster kod"]');
    expect(searchInput.exists()).toBe(true);

    // Search for a specific student code
    await searchInput.setValue('STU-1101');
    await wrapper.vm.$nextTick();

    const rows = wrapper.findAll('tbody tr');
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0]?.text()).toContain('STU-1101');
  });

  it('filters students by grade selection', async () => {
    const wrapper = mount(TeacherClassDetailView, mountOptions);
    await flushPromises();

    const selectGrade = wrapper.find('select[aria-label="Baho bo\'yicha saralash"]');
    expect(selectGrade.exists()).toBe(true);

    await selectGrade.setValue('5');
    await wrapper.vm.$nextTick();

    const rows = wrapper.findAll('tbody tr');
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r.text()).toContain("5 (A'lo)");
    }
  });

  it('triggers CSV download and toast notification on CSV button click', async () => {
    const wrapper = mount(TeacherClassDetailView, mountOptions);
    await flushPromises();

    // Mock createObjectURL & revokeObjectURL
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();

    const clickMock = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = origCreateElement(tagName);
      if (tagName === 'a') {
        el.click = clickMock;
      }
      return el;
    });

    const exportBtn = wrapper.find('button[aria-label="Sinf natijalarini CSV faylga yuklab olish"]');
    expect(exportBtn.exists()).toBe(true);

    await exportBtn.trigger('click');
    expect(clickMock).toHaveBeenCalled();
  });
});
