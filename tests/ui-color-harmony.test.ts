import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SchoolCard from '../src/features/organization/components/SchoolCard.vue';
import type { SchoolRecord } from '../src/entities/organization/model';

describe('TASK-UI.1: Brand Color Harmony & Purple Ban Remediation', () => {
  const dummySchool: SchoolRecord = {
    id: 'sch-lyceum',
    code: 'LYC-01',
    name: 'Xiva Akademik Litseyi',
    type: 'lyceum',
    districtId: 'dst-khiva-dist',
    districtName: 'Xiva tumani',
    address: 'Xiva shahar',
    studentCount: 450,
    teacherCount: 35,
    status: 'active',
    slug: 'xiva-litsey',
    createdAt: '2026-09-01T08:00:00Z',
  };

  it('renders sky-50/sky-700 badge for lyceum instead of purple', () => {
    const wrapper = mount(SchoolCard, {
      props: { school: dummySchool },
      global: { stubs: ['router-link'] },
    });

    expect(wrapper.text()).toContain('Akademik Litsey');
    const badge = wrapper.find('.rounded-full');
    expect(badge.classes()).toContain('text-sky-700');
    expect(badge.classes()).not.toContain('text-purple-700');
  });

  it('renders indigo badge for specialized school', () => {
    const specializedSchool: SchoolRecord = {
      ...dummySchool,
      type: 'specialized',
      name: 'Prezident Maktabi',
    };

    const wrapper = mount(SchoolCard, {
      props: { school: specializedSchool },
      global: { stubs: ['router-link'] },
    });

    expect(wrapper.text()).toContain('Ixtisoslashtirilgan');
    const badge = wrapper.find('.rounded-full');
    expect(badge.classes()).toContain('text-indigo-700');
  });
});
