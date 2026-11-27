import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import CurriculumHubView from '../src/features/teacher/curriculum/CurriculumHubView.vue';

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { tenantSlug: 'al-xorazmiy' },
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('CurriculumHubView Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/v1/curriculum/solutions')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () =>
            Promise.resolve([
              {
                id: 'sol-1',
                assessmentId: 'chsb-inf-11-q1',
                questionId: 'q-1',
                variantNumber: 1,
                stepByStepSolution: '1-qadam: Savolni tahlil qilamiz. Javob: A.',
                solutionFormulas: 'N = 2^i',
                rubricCriteriaJson: '[]',
                authorNote: 'Test yechim izohi',
              },
            ]),
        });
      }
      return Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () =>
          Promise.resolve([
            {
              id: 'res-pres-11',
              gradeLevel: 11,
              quarter: 1,
              title: '11-sinf Dars Taqdimoti',
              topic: 'Sun’iy intellekt va SQL',
              resourceType: 'PRESENTATION',
              description: 'Taqdimot tavsifi',
              contentJson: JSON.stringify({
                slides: [
                  {
                    slideNumber: 1,
                    title: '11-sinf Informatika',
                    subtitle: 'Kirish slaydi',
                    bullets: ['Maqsad', 'Reja'],
                  },
                ],
              }),
              downloadCount: 150,
            },
          ]),
      });
    });
  });

  it('mounts and renders the header and curriculum title', () => {
    const wrapper = mount(CurriculumHubView);
    expect(wrapper.text()).toContain('Metodik Resurslar Markazi');
    expect(wrapper.text()).toContain('O‘quv Materiallari, Taqdimotlar & BSB/CHSB Yechimlari');
  });

  it('renders all 7 grade selection buttons from 5-sinf to 11-sinf', () => {
    const wrapper = mount(CurriculumHubView);
    for (const grade of [5, 6, 7, 8, 9, 10, 11]) {
      expect(wrapper.text()).toContain(`${grade}-sinf`);
    }
  });

  it('renders all 4 main curriculum tabs', () => {
    const wrapper = mount(CurriculumHubView);
    expect(wrapper.text()).toContain('Dars Taqdimotlari');
    expect(wrapper.text()).toContain('BSB & CHSB Yechimlari');
    expect(wrapper.text()).toContain('Nazorat Ishi Daftarlari');
    expect(wrapper.text()).toContain('Tayyor Dars Topshiriqlari');
  });

  it('switches tabs to BSB & CHSB solutions when clicked', async () => {
    const wrapper = mount(CurriculumHubView);
    const tabs = wrapper.findAll('button');
    const solutionsTab = tabs.find((b) => b.text().includes('BSB & CHSB Yechimlari'));
    expect(solutionsTab).toBeDefined();

    if (solutionsTab) {
      await solutionsTab.trigger('click');
      expect(wrapper.text()).toContain('BSB va CHSB Savollari hamda Bosqichma-bosqich Yechimlari');
    }
  });

  it('switches tabs to Nazorat Ishi Daftarlari and shows printable workbook', async () => {
    const wrapper = mount(CurriculumHubView);
    const tabs = wrapper.findAll('button');
    const workbookTab = tabs.find((b) => b.text().includes('Nazorat Ishi Daftarlari'));
    expect(workbookTab).toBeDefined();

    if (workbookTab) {
      await workbookTab.trigger('click');
      expect(wrapper.text()).toContain('Nazorat Ishi Daftari');
      expect(wrapper.text()).toContain('Javoblar Qayd Varaqasi (Test Matrisasi)');
    }
  });
});
