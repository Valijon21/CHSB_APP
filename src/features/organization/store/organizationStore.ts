import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  SchoolInput,
  SchoolRecord,
  TeacherInput,
  TeacherRecord,
  StudentInput,
  StudentRecord,
  ClassGroupInput,
  ClassGroupRecord,
} from '../../../entities/organization/model';
import { api } from '../../../shared/api';
import { useTeacherStore } from '../../teacher/teacherStore';

export const useOrganizationStore = defineStore('organization', () => {
  // State
  const schools = ref<SchoolRecord[]>([]);
  const activeSchoolSlug = ref<string>('al-xorazmiy');
  const teachers = ref<TeacherRecord[]>([]);
  const students = ref<StudentRecord[]>([]);
  const classGroups = ref<ClassGroupRecord[]>([]);

  const selectedDistrictId = ref<string>('all');
  const searchQuery = ref<string>('');
  const isLoading = ref<boolean>(false);
  const errorMessage = ref<string | null>(null);

  // Getters
  const activeSchool = computed<SchoolRecord | null>(() => {
    return schools.value.find((s) => s.slug === activeSchoolSlug.value) || null;
  });

  const filteredSchools = computed(() => {
    let list = schools.value;

    if (selectedDistrictId.value !== 'all') {
      list = list.filter((s) => s.districtId === selectedDistrictId.value);
    }

    const q = searchQuery.value.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.districtName.toLowerCase().includes(q) ||
          s.directorName.toLowerCase().includes(q)
      );
    }

    return list;
  });

  const overallStats = computed(() => {
    const totalSchools = schools.value.length;
    let totalStudents = 0;
    let totalTeachers = 0;
    let specializedCount = 0;

    for (const school of schools.value) {
      totalStudents += school.studentCount;
      totalTeachers += school.teacherCount;
      if (school.type === 'specialized') specializedCount++;
    }

    return {
      totalSchools,
      totalStudents,
      totalTeachers,
      specializedCount,
    };
  });

  // Actions
  async function loadSchools(): Promise<void> {
    isLoading.value = true;
    errorMessage.value = null;
    try {
      schools.value = await api.organization.getAllSchools();
    } catch {
      errorMessage.value = "Maktablar ro'yxatini yuklashda xatolik yuz berdi.";
    } finally {
      isLoading.value = false;
    }
  }

  async function loadSchoolContext(slug: string): Promise<void> {
    isLoading.value = true;
    errorMessage.value = null;
    activeSchoolSlug.value = slug;

    try {
      const [tList, sList, cList] = await Promise.all([
        api.organization.getTeachersBySchool(slug),
        api.organization.getStudentsBySchool(slug),
        api.organization.getClassGroupsBySchool(slug),
      ]);

      teachers.value = tList;
      students.value = sList;
      classGroups.value = cList;
    } catch {
      errorMessage.value = "Maktab ma'lumotlarini yuklashda xatolik yuz berdi.";
    } finally {
      isLoading.value = false;
    }
  }

  async function createSchool(input: SchoolInput): Promise<SchoolRecord> {
    isLoading.value = true;
    errorMessage.value = null;
    try {
      const created = await api.organization.createSchool(input);
      schools.value.push(created);
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Maktab yaratishda xatolik yuz berdi.";
      errorMessage.value = msg;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function createTeacher(input: TeacherInput): Promise<TeacherRecord> {
    isLoading.value = true;
    errorMessage.value = null;
    try {
      const created = await api.organization.createTeacher(input);
      if (input.tenantSlug === activeSchoolSlug.value) {
        teachers.value.push(created);
      }
      // Maktab teacher count yangilash
      const sch = schools.value.find((s) => s.slug === input.tenantSlug);
      if (sch) sch.teacherCount++;
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "O'qituvchi qo'shishda xatolik yuz berdi.";
      errorMessage.value = msg;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateTeacher(id: string, updates: Partial<TeacherInput>): Promise<void> {
    isLoading.value = true;
    try {
      const updated = await api.organization.updateTeacher(id, updates);
      if (updated) {
        const idx = teachers.value.findIndex((t) => t.id === id);
        if (idx !== -1) teachers.value[idx] = updated;
      }
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteTeacher(id: string): Promise<void> {
    isLoading.value = true;
    try {
      const ok = await api.organization.deleteTeacher(id);
      if (ok) {
        teachers.value = teachers.value.filter((t) => t.id !== id);
        const sch = activeSchool.value;
        if (sch && sch.teacherCount > 0) sch.teacherCount--;
      }
    } finally {
      isLoading.value = false;
    }
  }

  async function createStudent(input: StudentInput): Promise<StudentRecord> {
    isLoading.value = true;
    errorMessage.value = null;
    try {
      const created = await api.organization.createStudent(input);
      if (input.tenantSlug === activeSchoolSlug.value) {
        students.value.push(created);
      }
      const sch = schools.value.find((s) => s.slug === input.tenantSlug);
      if (sch) sch.studentCount++;

      try {
        const teacherStore = useTeacherStore();
        teacherStore.addRosterRecord({
          id: created.id,
          tenantId: created.tenantSlug,
          schoolId: created.schoolId,
          classGroupId: created.classGroupId,
          rosterCode: created.rosterCode,
          firstName: created.firstName,
          lastName: created.lastName,
          middleName: created.middleName,
          status: created.status === 'eligible' ? 'eligible' : 'inactive',
          availableAssessmentIds: [],
        });
      } catch {
        // TeacherStore sync non-blocking fallback
      }

      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "O'quvchi qo'shishda xatolik yuz berdi.";
      errorMessage.value = msg;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function bulkImportStudents(inputs: StudentInput[]): Promise<StudentRecord[]> {
    isLoading.value = true;
    errorMessage.value = null;
    try {
      const createdList = await api.organization.bulkCreateStudents(inputs);
      for (const st of createdList) {
        if (st.tenantSlug === activeSchoolSlug.value) {
          students.value.push(st);
        }
      }
      const sch = activeSchool.value;
      if (sch) sch.studentCount += createdList.length;

      try {
        const teacherStore = useTeacherStore();
        const records = createdList.map((st) => ({
          id: st.id,
          tenantId: st.tenantSlug,
          schoolId: st.schoolId,
          classGroupId: st.classGroupId,
          rosterCode: st.rosterCode,
          firstName: st.firstName,
          lastName: st.lastName,
          middleName: st.middleName,
          status: st.status === 'eligible' ? ('eligible' as const) : ('inactive' as const),
          availableAssessmentIds: [],
        }));
        teacherStore.addRosterRecords(records);
      } catch {
        // TeacherStore sync non-blocking fallback
      }

      return createdList;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ommaviy yuklashda xatolik yuz berdi.";
      errorMessage.value = msg;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteStudent(id: string): Promise<void> {
    isLoading.value = true;
    try {
      const ok = await api.organization.deleteStudent(id);
      if (ok) {
        students.value = students.value.filter((s) => s.id !== id);
        const sch = activeSchool.value;
        if (sch && sch.studentCount > 0) sch.studentCount--;

        try {
          const teacherStore = useTeacherStore();
          teacherStore.removeRosterRecord(id);
        } catch {
          // TeacherStore sync non-blocking fallback
        }
      }
    } finally {
      isLoading.value = false;
    }
  }

  async function createClassGroup(input: ClassGroupInput): Promise<ClassGroupRecord> {
    isLoading.value = true;
    try {
      const created = await api.organization.createClassGroup(input);
      if (input.tenantSlug === activeSchoolSlug.value) {
        classGroups.value.push(created);
      }

      try {
        const teacherStore = useTeacherStore();
        teacherStore.addClass({
          id: created.id,
          tenantId: created.tenantSlug,
          schoolId: created.schoolId,
          name: created.name,
          grade: created.gradeLevel,
          academicYear: created.academicYear,
          studentCount: created.studentCount,
        });
      } catch {
        // TeacherStore sync non-blocking fallback
      }

      return created;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteClassGroup(id: string): Promise<boolean> {
    isLoading.value = true;
    try {
      const ok = await api.organization.deleteClassGroup(id);
      if (ok) {
        classGroups.value = classGroups.value.filter((c) => c.id !== id);
        students.value = students.value.filter((s) => s.classGroupId !== id);

        try {
          const teacherStore = useTeacherStore();
          teacherStore.removeClass(id);
        } catch {
          // TeacherStore sync non-blocking
        }
      }
      return ok;
    } finally {
      isLoading.value = false;
    }
  }

  async function purgeClassStudents(classId: string): Promise<{ success: boolean; purgedCount: number }> {
    isLoading.value = true;
    try {
      const res = await api.organization.purgeClassStudents(classId);
      if (res.success) {
        students.value = students.value.filter((s) => s.classGroupId !== classId);
        const targetCls = classGroups.value.find((c) => c.id === classId);
        if (targetCls) {
          targetCls.studentCount = 0;
        }

        try {
          const teacherStore = useTeacherStore();
          teacherStore.purgeClassRoster(classId);
        } catch {
          // TeacherStore sync non-blocking
        }
      }
      return res;
    } finally {
      isLoading.value = false;
    }
  }

  function setDistrictFilter(districtId: string): void {
    selectedDistrictId.value = districtId;
  }

  function setSearchQuery(q: string): void {
    searchQuery.value = q;
  }

  return {
    // State
    schools,
    activeSchoolSlug,
    teachers,
    students,
    classGroups,
    selectedDistrictId,
    searchQuery,
    isLoading,
    errorMessage,

    // Getters
    activeSchool,
    filteredSchools,
    overallStats,

    // Actions
    loadSchools,
    loadSchoolContext,
    createSchool,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    createStudent,
    bulkImportStudents,
    deleteStudent,
    createClassGroup,
    deleteClassGroup,
    purgeClassStudents,
    setDistrictFilter,
    setSearchQuery,
  };
});

