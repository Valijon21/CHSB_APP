import { httpClient } from '../httpClient';
import { logger } from '../../services/logger/LoggerService';
import type { OrganizationRepository } from '../repositories/OrganizationRepository';
import type {
  SchoolInput,
  SchoolRecord,
  TeacherInput,
  TeacherRecord,
  StudentInput,
  StudentRecord,
  ClassGroupInput,
  ClassGroupRecord,
  SubjectInput,
  SubjectRecord,
} from '../../../entities/organization/model';
import type { BackendStudentItem } from './types';

export class RealOrganizationRepository implements OrganizationRepository {
  async createSchool(input: SchoolInput): Promise<SchoolRecord> {
    return await httpClient.post<SchoolRecord>('/schools', input);
  }

  async getAllSchools(): Promise<SchoolRecord[]> {
    return await httpClient.get<SchoolRecord[]>('/schools');
  }

  async getSchoolBySlug(slug: string): Promise<SchoolRecord | null> {
    const schools = await this.getAllSchools();
    return schools.find((s) => s.slug === slug) || null;
  }

  async createTeacher(input: TeacherInput): Promise<TeacherRecord> {
    return await httpClient.post<TeacherRecord>('/teachers', input);
  }

  async getTeachersBySchool(tenantSlug: string): Promise<TeacherRecord[]> {
    return await httpClient.get<TeacherRecord[]>('/teachers', {
      params: { tenantSlug },
    });
  }

  async updateTeacher(id: string, updates: Partial<TeacherInput>): Promise<TeacherRecord | null> {
    return await httpClient.patch<TeacherRecord>(`/teachers/${id}`, updates);
  }

  async deleteTeacher(id: string): Promise<boolean> {
    const res = await httpClient.delete<{ success: boolean }>(`/teachers/${id}`);
    return Boolean(res.success);
  }

  async createStudent(input: StudentInput): Promise<StudentRecord> {
    try {
      const payload = {
        tenantSlug: input.tenantSlug,
        schoolId: input.schoolId,
        classGroupId: input.classGroupId,
        className: input.className || undefined,
        firstName: input.firstName,
        lastName: input.lastName,
        middleName: input.middleName || undefined,
        gender: input.gender,
        birthDate: input.birthDate || '2008-05-15',
        rosterCode: input.rosterCode || undefined,
        status: input.status,
        group: input.group || null,
        emaktabId: input.emaktabId || undefined,
      };
      return await httpClient.post<StudentRecord>('/students', payload);
    } catch (err) {
      logger.error('Failed to create student', { err, input });
      throw err;
    }
  }

  async bulkCreateStudents(inputs: StudentInput[]): Promise<StudentRecord[]> {
    try {
      const payload = inputs.map((input) => ({
        tenantSlug: input.tenantSlug,
        schoolId: input.schoolId,
        classGroupId: input.classGroupId,
        className: input.className || undefined,
        firstName: input.firstName,
        lastName: input.lastName,
        middleName: input.middleName || undefined,
        gender: input.gender,
        birthDate: input.birthDate || '2008-05-15',
        rosterCode: input.rosterCode || undefined,
        status: input.status,
        group: input.group || null,
        emaktabId: input.emaktabId || undefined,
      }));
      return await httpClient.post<StudentRecord[]>('/students/bulk', payload);
    } catch (err) {
      logger.error('Failed to bulk create students', { err, count: inputs.length });
      throw err;
    }
  }

  async getStudentsBySchool(tenantSlug: string, classGroupId?: string): Promise<StudentRecord[]> {
    try {
      const list = await httpClient.get<BackendStudentItem[]>('/students', {
        params: { tenantSlug, classGroupId },
      });
      return list.map((s) => ({
        id: s.id,
        tenantSlug: s.tenantSlug || tenantSlug,
        schoolId: s.schoolId,
        classGroupId: s.classGroupId,
        className: s.className || '',
        rosterCode: s.rosterCode,
        fullName: s.fullName || `${s.lastName} ${s.firstName}`,
        firstName: s.firstName,
        lastName: s.lastName,
        middleName: s.middleName,
        gender: (s.gender === 'F' ? 'F' : 'M') as 'M' | 'F',
        birthDate: s.birthDate || '2008-05-15',
        status: (s.status === 'inactive' ? 'inactive' : 'eligible') as 'eligible' | 'inactive',
        group: s.group || null,
        emaktabId: s.emaktabId || undefined,
        createdAt: s.createdAt || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }

  async updateStudent(id: string, updates: Partial<StudentInput>): Promise<StudentRecord | null> {
    return await httpClient.patch<StudentRecord>(`/students/${id}`, updates);
  }

  async deleteStudent(id: string): Promise<boolean> {
    const res = await httpClient.delete<{ success: boolean }>(`/students/${id}`);
    return res.success;
  }

  async deleteClassStudents(tenantSlug: string, classGroupId: string): Promise<number> {
    const res = await httpClient.delete<{ deletedCount?: number }>(
      `/students?tenantSlug=${encodeURIComponent(tenantSlug)}&classGroupId=${encodeURIComponent(classGroupId)}`
    );
    return res.deletedCount || 0;
  }

  async bulkDeleteStudents(studentIds: string[]): Promise<number> {
    const res = await httpClient.post<{ deletedCount?: number }>('/students/bulk-delete', { studentIds });
    return res.deletedCount || 0;
  }

  async createClassGroup(input: ClassGroupInput): Promise<ClassGroupRecord> {
    try {
      return await httpClient.post<ClassGroupRecord>('/classes', input);
    } catch (err) {
      logger.error('Failed to create class group', { err, input });
      throw err;
    }
  }

  async getClassGroupsBySchool(tenantSlug: string): Promise<ClassGroupRecord[]> {
    try {
      return await httpClient.get<ClassGroupRecord[]>(`/classes?tenantSlug=${encodeURIComponent(tenantSlug)}`);
    } catch {
      return [];
    }
  }

  async getSubjects(tenantSlug: string): Promise<SubjectRecord[]> {
    return httpClient.get<SubjectRecord[]>(`/subjects?tenantSlug=${encodeURIComponent(tenantSlug)}`);
  }

  async createSubject(input: SubjectInput): Promise<SubjectRecord> {
    return httpClient.post<SubjectRecord>('/subjects', input);
  }

  async deleteSubject(id: string): Promise<boolean> {
    const res = await httpClient.delete<{ success: boolean }>(`/subjects/${id}`);
    return res.success;
  }
}

