import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { useOrganizationStore } from '../src/features/organization/store/organizationStore';
import { useTeacherStore } from '../src/features/teacher/teacherStore';
import NetworkStatusBanner from '../src/shared/components/NetworkStatusBanner.vue';
import { useNetworkStatus } from '../src/shared/composables/useNetworkStatus';

describe('TASK-ARC.7: Store State Synchronization Adapter', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('automatically synchronizes new class from organizationStore to teacherStore', async () => {
    const orgStore = useOrganizationStore();
    const teacherStore = useTeacherStore();

    expect(teacherStore.classes.find((c) => c.name === '9-Sync')).toBeUndefined();

    const created = await orgStore.createClassGroup({
      schoolId: 'sch-01',
      tenantSlug: 'al-xorazmiy',
      name: '9-Sync',
      gradeLevel: 9,
      shift: 1,
      academicYear: '2026-2027',
    });

    expect(created.id).toBeDefined();
    // Verify it exists in orgStore
    expect(orgStore.classGroups.find((c) => c.name === '9-Sync')).toBeDefined();
    // Verify it automatically synchronized to teacherStore!
    const syncedInTeacher = teacherStore.classes.find((c) => c.id === created.id);
    expect(syncedInTeacher).toBeDefined();
    expect(syncedInTeacher?.name).toBe('9-Sync');
    expect(syncedInTeacher?.grade).toBe(9);
  });

  it('automatically synchronizes created student from organizationStore to teacherStore roster', async () => {
    const orgStore = useOrganizationStore();
    const teacherStore = useTeacherStore();

    const initialRosterCount = teacherStore.roster.length;

    const student = await orgStore.createStudent({
      tenantSlug: 'al-xorazmiy',
      schoolId: 'sch-01',
      classGroupId: 'class-01',
      className: '11-A',
      firstName: 'Sanjar',
      lastName: 'Karimov',
      gender: 'M',
      birthDate: '2008-03-12',
      status: 'eligible',
    });

    expect(student.id).toBeDefined();
    // Verify it is in teacherStore roster
    expect(teacherStore.roster.length).toBe(initialRosterCount + 1);
    const syncedStudent = teacherStore.roster.find((r) => r.id === student.id);
    expect(syncedStudent).toBeDefined();
    expect(syncedStudent?.firstName).toBe('Sanjar');
    expect(syncedStudent?.lastName).toBe('Karimov');
    expect(syncedStudent?.status).toBe('eligible');
  });

  it('automatically synchronizes bulk imported students to teacherStore roster', async () => {
    const orgStore = useOrganizationStore();
    const teacherStore = useTeacherStore();

    const initialRosterCount = teacherStore.roster.length;

    const bulkList = await orgStore.bulkImportStudents([
      {
        tenantSlug: 'al-xorazmiy',
        schoolId: 'sch-01',
        classGroupId: 'class-01',
        className: '11-A',
        firstName: 'Dilshod',
        lastName: 'Aliev',
        gender: 'M',
        birthDate: '2008-04-10',
        status: 'eligible',
      },
      {
        tenantSlug: 'al-xorazmiy',
        schoolId: 'sch-01',
        classGroupId: 'class-01',
        className: '11-A',
        firstName: 'Malika',
        lastName: 'Ergasheva',
        gender: 'F',
        birthDate: '2008-05-15',
        status: 'eligible',
      },
    ]);

    expect(bulkList.length).toBe(2);
    expect(teacherStore.roster.length).toBe(initialRosterCount + 2);
    expect(teacherStore.roster.some((r) => r.firstName === 'Dilshod')).toBe(true);
    expect(teacherStore.roster.some((r) => r.firstName === 'Malika')).toBe(true);
  });

  it('automatically removes student from teacherStore roster when deleted in organizationStore', async () => {
    const orgStore = useOrganizationStore();
    const teacherStore = useTeacherStore();

    const student = await orgStore.createStudent({
      tenantSlug: 'al-xorazmiy',
      schoolId: 'sch-01',
      classGroupId: 'class-01',
      className: '11-A',
      firstName: 'Bekzod',
      lastName: 'Omonov',
      gender: 'M',
      birthDate: '2008-06-20',
      status: 'eligible',
    });

    expect(teacherStore.roster.some((r) => r.id === student.id)).toBe(true);

    await orgStore.deleteStudent(student.id);

    expect(teacherStore.roster.some((r) => r.id === student.id)).toBe(false);
  });
});

describe('TASK-ARC.8: Global NetworkStatusBanner Component', () => {
  beforeEach(() => {
    vi.useRealTimers();
    useNetworkStatus().resetNetworkStatus();
  });

  it('renders offline alert banner when network is offline', async () => {
    const network = useNetworkStatus();
    network.handleOffline();

    const wrapper = mount(NetworkStatusBanner);

    const alert = wrapper.find('[role="alert"]');
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toContain('Internet aloqasi uzildi');
    expect(alert.text()).toContain("barcha javoblar va ma'lumotlar qurilma xotirasida xavfsiz saqlanmoqda");
  });

  it('shows pending queue count when offline with items in queue', async () => {
    const network = useNetworkStatus();
    network.handleOffline();
    network.setPendingQueueCount(5);

    const wrapper = mount(NetworkStatusBanner);

    expect(wrapper.text()).toContain("5 ta so'rov navbatda");
  });

  it('switches to reconnected status banner when coming back online', async () => {
    vi.useFakeTimers();
    const network = useNetworkStatus();
    network.handleOffline();

    const wrapper = mount(NetworkStatusBanner);
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);

    // Switch back online
    network.handleOnline();
    await wrapper.vm.$nextTick();

    const statusBanner = wrapper.find('[role="status"]');
    expect(statusBanner.exists()).toBe(true);
    expect(statusBanner.text()).toContain('Internet aloqasi qayta tiklandi!');

    // Fast-forward 4 seconds -> should auto-hide
    vi.advanceTimersByTime(4000);
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[role="status"]').exists()).toBe(false);
    vi.useRealTimers();
  });
});
