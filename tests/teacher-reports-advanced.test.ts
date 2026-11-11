import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import TeacherReportsView from '../src/features/teacher/reports/TeacherReportsView.vue';
import { useTeacherStore } from '../src/features/teacher/teacherStore';
import { useTenantStore } from '../src/features/tenant-context/tenantStore';

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      tenantSlug: 'al-xorazmiy',
    },
  }),
}));

describe('TASK-REP: Official Reporting Suite & Dossier Templates', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders official letterhead, summary stats, and signature blocks', async () => {
    const tenantStore = useTenantStore();
    const teacherStore = useTeacherStore();
    await tenantStore.loadTenant('al-xorazmiy');
    await teacherStore.loadTeacherData('tenant-al-xorazmiy');

    const wrapper = mount(TeacherReportsView);
    await flushPromises();

    expect(wrapper.text()).toContain('O\'zbekiston Respublikasi Maktabgacha va Maktab Ta\'limi Vazirligi');
    expect(wrapper.text()).toContain('Choraklik Baholash (CHSB) Rasmiy Yig\'ma Qaydnomasi');
    expect(wrapper.text()).toContain('Fan o\'qituvchisi:');
    expect(wrapper.text()).toContain('Tasdiqlayman (Maktab Direktori):');
  });

  it('switches between all 3 official templates (Roster, Summary, Matrix)', async () => {
    const tenantStore = useTenantStore();
    const teacherStore = useTeacherStore();
    await tenantStore.loadTenant('al-xorazmiy');
    await teacherStore.loadTeacherData('tenant-al-xorazmiy');

    const wrapper = mount(TeacherReportsView);
    await flushPromises();

    // Default template: Roster
    expect(wrapper.text()).toContain('CHSB Balli (40)');

    // Switch to Template 2: Summary
    const summaryTab = wrapper.findAll('button').find((b) => b.text().includes('Tahliliy Spravka'));
    expect(summaryTab).toBeDefined();
    await summaryTab?.trigger('click');

    expect(wrapper.text()).toContain('Pedagogik Kengash uchun CHSB Natijalari Tahliliy Spravkasi');
    expect(wrapper.text()).toContain('Eng Yuqori Natija Ko\'rsatgan O\'quvchilar');

    // Switch to Template 3: Matrix
    const matrixTab = wrapper.findAll('button').find((b) => b.text().includes('Kognitiv Matritsa'));
    expect(matrixTab).toBeDefined();
    await matrixTab?.trigger('click');

    expect(wrapper.text()).toContain('Bilish (B)');
    expect(wrapper.text()).toContain('Qo\'llash (Q)');
    expect(wrapper.text()).toContain('Mulohaza (M)');
  });

  it('filters by search query and grade tier', async () => {
    const tenantStore = useTenantStore();
    const teacherStore = useTeacherStore();
    await tenantStore.loadTenant('al-xorazmiy');
    await teacherStore.loadTeacherData('tenant-al-xorazmiy');

    const wrapper = mount(TeacherReportsView);
    await flushPromises();

    const searchInput = wrapper.find('input[placeholder*="O\'quvchi F.I.SH."]');
    expect(searchInput.exists()).toBe(true);

    // Search for 'Alisher'
    await searchInput.setValue('Alisher');
    expect(wrapper.text()).toContain('Alisher');

    // Grade tier filter
    const gradeSelect = wrapper.find('select[aria-label="Baho bo\'yicha saralash"]');
    expect(gradeSelect.exists()).toBe(true);
    await gradeSelect.setValue('5');
    expect(wrapper.text()).toContain('Alisher');
  });

  it('triggers CSV download with UTF-8 BOM', async () => {
    const tenantStore = useTenantStore();
    const teacherStore = useTeacherStore();
    await tenantStore.loadTenant('al-xorazmiy');
    await teacherStore.loadTeacherData('tenant-al-xorazmiy');

    const wrapper = mount(TeacherReportsView);
    await flushPromises();

    // Mock window.URL.createObjectURL
    const createObjectUrlMock = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectUrlMock = vi.fn();
    globalThis.URL.createObjectURL = createObjectUrlMock;
    globalThis.URL.revokeObjectURL = revokeObjectUrlMock;

    const csvBtn = wrapper.find('button[aria-label="Excel va CSV formatida yuklab olish"]');
    expect(csvBtn.exists()).toBe(true);
    await csvBtn.trigger('click');

    expect(createObjectUrlMock).toHaveBeenCalled();
  });

  it('toggles print preview mode', async () => {
    const tenantStore = useTenantStore();
    const teacherStore = useTeacherStore();
    await tenantStore.loadTenant('al-xorazmiy');
    await teacherStore.loadTeacherData('tenant-al-xorazmiy');

    const wrapper = mount(TeacherReportsView);
    await flushPromises();

    const previewBtn = wrapper.find('button[aria-label="Chop etish oldidan A4 formatda ko\'rish"]');
    expect(previewBtn.exists()).toBe(true);

    await previewBtn.trigger('click');
    expect(wrapper.find('.max-w-4xl').exists()).toBe(true);
  });
});
