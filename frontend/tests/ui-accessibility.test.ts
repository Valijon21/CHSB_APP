import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import GradeThresholdsModal from '../src/features/emaktab/components/GradeThresholdsModal.vue';
import CreateClassModal from '../src/features/organization/components/CreateClassModal.vue';

describe('TASK-UI.2: Accessibility (WCAG 2.1 AA) Form Labels & Contrast', () => {
  it('GradeThresholdsModal inputs have explicit aria-label attributes', () => {
    const wrapper = mount(GradeThresholdsModal, {
      props: {
        isOpen: true,
        thresholds: {
          grade5Min: 86,
          grade4Min: 71,
          grade3Min: 56,
          grade2Max: 55,
        },
      },
    });

    const inputs = wrapper.findAll('input[type="number"]');
    expect(inputs.length).toBe(4);

    for (const input of inputs) {
      expect(input.attributes('aria-label')).toBeDefined();
      expect(input.attributes('aria-label')?.length).toBeGreaterThan(5);
    }
  });

  it('CreateClassModal inputs and selects have matching id and label for attributes', () => {
    const wrapper = mount(CreateClassModal, {
      props: {
        isOpen: true,
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
      },
    });

    const gradeSelect = wrapper.find('#create-class-grade');
    expect(gradeSelect.exists()).toBe(true);

    const gradeLabel = wrapper.find('label[for="create-class-grade"]');
    expect(gradeLabel.exists()).toBe(true);

    const nameInput = wrapper.find('#create-class-name');
    expect(nameInput.exists()).toBe(true);

    const nameLabel = wrapper.find('label[for="create-class-name"]');
    expect(nameLabel.exists()).toBe(true);
  });
});
