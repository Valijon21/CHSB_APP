import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { useTeacherStore } from '@/features/teacher/teacherStore';
import CreateAssessmentModal from '@/features/teacher/assessments/CreateAssessmentModal.vue';

describe('AI-Free Local Mode & Student Mastery Analytics', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('loads deterministic student mastery list and individual dossier via teacherStore', async () => {
    const store = useTeacherStore();
    await store.loadStudentsMastery('tenant-al-xorazmiy');

    expect(store.studentsMastery).not.toBeNull();
    expect(store.studentsMastery!.summary.engine).toBe('deterministic-pedagogical-engine');
    expect(store.studentsMastery!.students.length).toBeGreaterThan(0);

    const firstId = store.studentsMastery!.students[0]!.studentId;
    await store.loadStudentMastery('tenant-al-xorazmiy', firstId);
    expect(store.studentMasteryDetail).not.toBeNull();
    expect(store.studentMasteryDetail!.remediationPlan.engine).toBe('deterministic-pedagogical-engine');
    expect(store.studentMasteryDetail!.remediationPlan.trajectory.length).toBeGreaterThan(0);
  });

  it('CreateAssessmentModal defaults to original split-PDF mode without legacy AI/regex extractors', async () => {
    const wrapper = mount(CreateAssessmentModal, {
      props: { isOpen: true },
    });

    const pdfRadio = wrapper.find('input[value="pdf"]').element as HTMLInputElement;
    expect(pdfRadio.checked).toBe(true);
    expect(wrapper.text()).toContain('Asl PDF');
    expect(wrapper.text()).toContain("Chapda PDF + O'ngda Javoblar varaqasi");
    expect(wrapper.text()).not.toContain('Lokal algoritm (AI siz, tezkor)');
  });
});

