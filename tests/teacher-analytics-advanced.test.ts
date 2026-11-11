import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import ClassComparisonChart from '../src/features/teacher/analytics/components/ClassComparisonChart.vue';
import ScoreDistributionDonut from '../src/features/teacher/analytics/components/ScoreDistributionDonut.vue';
import CognitiveRadarChart from '../src/features/teacher/analytics/components/CognitiveRadarChart.vue';
import QuestionItemAnalysis from '../src/features/teacher/analytics/components/QuestionItemAnalysis.vue';
import TeacherAnalyticsView from '../src/features/teacher/analytics/TeacherAnalyticsView.vue';
import { useTeacherStore } from '../src/features/teacher/teacherStore';
import { useTenantStore } from '../src/features/tenant-context/tenantStore';

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      tenantSlug: 'al-xorazmiy',
    },
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('TASK-ANL: Pedagogical Analytics & Modern SVG Charts Suite', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('ClassComparisonChart.vue', () => {
    const mockComparisons = [
      {
        className: '11-A',
        averageScore: 36.8,
        maxPossibleScore: 40,
        studentCount: 22,
        participationRate: 95,
      },
      {
        className: '11-B',
        averageScore: 34.2,
        maxPossibleScore: 40,
        studentCount: 20,
        participationRate: 90,
      },
    ];

    it('renders comparison bars, labels, and participation pills', () => {
      const wrapper = mount(ClassComparisonChart, {
        props: { comparisons: mockComparisons },
      });

      expect(wrapper.text()).toContain('11-A');
      expect(wrapper.text()).toContain('11-B');
      expect(wrapper.text()).toContain('36.8');
      expect(wrapper.text()).toContain('34.2');
      expect(wrapper.text()).toContain('95%');
      expect(wrapper.text()).toContain('90%');
      expect(wrapper.findAll('rect').length).toBeGreaterThan(2);
    });

    it('activates tooltip on bar mouseenter and clears on mouseleave', async () => {
      const wrapper = mount(ClassComparisonChart, {
        props: { comparisons: mockComparisons },
      });

      const firstGroup = wrapper.findAll('g.cursor-pointer')[0];
      expect(firstGroup).toBeDefined();

      await firstGroup?.trigger('mouseenter');
      expect(wrapper.text()).toContain("O'quvchilar:");
      expect(wrapper.text()).toContain('22 nafar');

      await firstGroup?.trigger('mouseleave');
      expect(wrapper.find('.pointer-events-none').exists()).toBe(false);
    });
  });

  describe('ScoreDistributionDonut.vue', () => {
    const mockDistribution = {
      excellent: 4,
      good: 8,
      satisfactory: 3,
      needsImprovement: 0,
    };

    it('calculates total students and quality rate correctly', () => {
      const wrapper = mount(ScoreDistributionDonut, {
        props: { distribution: mockDistribution },
      });

      // Total = 4 + 8 + 3 = 15 students
      expect(wrapper.text()).toContain('15');
      // Quality rate: (4 + 8) / 15 * 100 = 80%
      expect(wrapper.text()).toContain('Sifat ko\'rsatkichi: 80%');
      expect(wrapper.text()).toContain("A'lo (5)");
      expect(wrapper.text()).toContain('Yaxshi (4)');
      expect(wrapper.text()).toContain('Qoniqarli (3)');
      expect(wrapper.text()).toContain('Qoniqarsiz (2)');
    });
  });

  describe('CognitiveRadarChart.vue', () => {
    const mockBreakdown = {
      knowledge: { label: 'Bilish (B)', points: 17.5, averageAccuracy: 88 },
      application: { label: "Qo'llash (Q)", points: 13.5, averageAccuracy: 75 },
      reasoning: { label: 'Mulohaza (M)', points: 9.0, averageAccuracy: 62 },
    };

    it('renders radar polygon, 3 axes, and pedagogical advice', () => {
      const wrapper = mount(CognitiveRadarChart, {
        props: { breakdown: mockBreakdown },
      });

      expect(wrapper.text()).toContain('Bilish (B)');
      expect(wrapper.text()).toContain("Qo'llash (Q)");
      expect(wrapper.text()).toContain('Mulohaza (M)');
      expect(wrapper.text()).toContain('88%');
      expect(wrapper.text()).toContain('75%');
      expect(wrapper.text()).toContain('62%');
      expect(wrapper.find('polygon.stroke-teal-600').exists()).toBe(true);
      expect(wrapper.text()).toContain("Mulohaza (M) darajasiga e'tibor qaratish tavsiya etiladi");
    });
  });

  describe('QuestionItemAnalysis.vue', () => {
    const mockStats = [
      { order: 1, cognitiveLevel: '(B)', points: 2.5, correctRate: 95 },
      { order: 2, cognitiveLevel: '(Q)', points: 2.5, correctRate: 72 },
      { order: 3, cognitiveLevel: '(M)', points: 3.0, correctRate: 52 },
    ];

    it('highlights easiest and hardest questions and allows cognitive filtering', async () => {
      const wrapper = mount(QuestionItemAnalysis, {
        props: { questionStats: mockStats },
      });

      expect(wrapper.text()).toContain('1-savol (B)');
      expect(wrapper.text()).toContain('95% aniqlik');
      expect(wrapper.text()).toContain('3-savol (M)');
      expect(wrapper.text()).toContain('52% aniqlik');

      // Filter by 'M'
      const mBtn = wrapper.findAll('button').find((b) => b.text().includes('Mulohaza (M)'));
      await mBtn?.trigger('click');

      expect(wrapper.text()).toContain('3-savol');
      expect(wrapper.text()).not.toContain('1-savol •');
    });
  });

  describe('TeacherAnalyticsView.vue integration', () => {
    it('mounts analytics dashboard with KPI ribbon and interactive class filter', async () => {
      const tenantStore = useTenantStore();
      const teacherStore = useTeacherStore();
      await tenantStore.loadTenant('al-xorazmiy');
      await teacherStore.loadTeacherData('tenant-al-xorazmiy');

      const wrapper = mount(TeacherAnalyticsView, {
        global: {
          stubs: {
            'router-link': {
              template: '<a><slot /></a>',
            },
          },
        },
      });
      await flushPromises();

      expect(wrapper.text()).toContain('Pedagogik Tahlillar va Diagnostika Markazi');
      expect(wrapper.text()).toContain('O\'rtacha Ball');
      expect(wrapper.text()).toContain('Sifat Ko\'rsatkichi');
      expect(wrapper.text()).toContain('O\'zlashtirish Darajasi');

      // Class filter select exists
      const select = wrapper.find('select[aria-label="Sinf bo\'yicha tahlilni filtrlash"]');
      expect(select.exists()).toBe(true);
    });
  });
});
