import { describe, it, expect, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import CreateSchoolModal from '../src/features/organization/components/CreateSchoolModal.vue';
import SchoolCard from '../src/features/organization/components/SchoolCard.vue';
import SchoolDirectoryView from '../src/features/organization/views/SchoolDirectoryView.vue';
import type { SchoolRecord } from '../src/entities/organization/model';

describe('TASK-MS.4: School Directory & Multi-School Onboarding Components', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders CreateSchoolModal and validates inputs before emitting create', async () => {
    const wrapper = mount(CreateSchoolModal, {
      props: { isOpen: true },
    });

    expect(wrapper.text()).toContain('Yangi Maktab (Tenant) Qo\'shish');

    // Fill form inputs
    const inputs = wrapper.findAll('input');
    // Name
    await inputs[0]?.setValue('Xiva 1-sonli ixtisoslashtirilgan maktab');
    // Code
    await inputs[1]?.setValue('XIV-01');
    // Slug
    await inputs[2]?.setValue('xiva-1-maktab');
    // Director
    await inputs[3]?.setValue('Matkarimov Sh.');
    // Phone
    await inputs[4]?.setValue('+998901234567');

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');

    expect(wrapper.emitted('create')).toBeTruthy();
    const emittedData = wrapper.emitted('create')?.[0]?.[0] as SchoolRecord;
    expect(emittedData.slug).toBe('xiva-1-maktab');
    expect(emittedData.code).toBe('XIV-01');
  });

  it('renders SchoolCard with student/teacher counts and links', () => {
    const sampleSchool: SchoolRecord = {
      id: 'sch-01',
      name: 'Al-Xorazmiy nomidagi IT-maktab',
      code: 'AX-01',
      slug: 'al-xorazmiy',
      districtId: 'dist-urganch-shahar',
      districtName: 'Urganch shahri',
      type: 'specialized',
      directorName: 'Boboyev Shavkat',
      contactPhone: '+998622241020',
      status: 'active',
      studentCount: 240,
      teacherCount: 18,
      createdAt: '2026-09-01T08:00:00Z',
    };

    const wrapper = mount(SchoolCard, {
      props: { school: sampleSchool },
      global: {
        stubs: {
          'router-link': {
            template: '<a><slot /></a>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Al-Xorazmiy nomidagi IT-maktab');
    expect(wrapper.text()).toContain('AX-01');
    expect(wrapper.text()).toContain('240');
    expect(wrapper.text()).toContain('18');
    expect(wrapper.text()).toContain('Ixtisoslashtirilgan');
  });

  it('mounts SchoolDirectoryView and lists seeded schools', async () => {
    const wrapper = mount(SchoolDirectoryView, {
      global: {
        stubs: {
          'router-link': {
            template: '<a><slot /></a>',
          },
        },
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('Maktablar Boshqaruv Markazi');
    expect(wrapper.text()).toContain('Jami Muassasalar');
    expect(wrapper.text()).toContain('Al-Xorazmiy');
  });
});
