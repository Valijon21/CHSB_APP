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

  it('CreateAssessmentModal prioritizes local deterministic algorithm over Gemini by default', async () => {
    const wrapper = mount(CreateAssessmentModal, {
      props: { isOpen: true },
    });

    await wrapper.find('input[value="pdf"]').setValue();
    const localBtn = wrapper.findAll('button').find((b) => b.text().includes('Lokal algoritm (AI siz, tezkor)'));
    expect(localBtn).toBeDefined();
    expect(localBtn!.classes()).toContain('bg-teal-700');
  });
});

