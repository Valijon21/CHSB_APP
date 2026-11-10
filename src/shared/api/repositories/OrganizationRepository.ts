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

export interface OrganizationRepository {
  // Maktablar (Schools)
  createSchool(input: SchoolInput): Promise<SchoolRecord>;
  getAllSchools(): Promise<SchoolRecord[]>;
  getSchoolBySlug(slug: string): Promise<SchoolRecord | null>;

  // O'qituvchilar (Teachers)
  createTeacher(input: TeacherInput): Promise<TeacherRecord>;
  getTeachersBySchool(tenantSlug: string): Promise<TeacherRecord[]>;
  updateTeacher(id: string, updates: Partial<TeacherInput>): Promise<TeacherRecord | null>;
  deleteTeacher(id: string): Promise<boolean>;

  // O'quvchilar (Students)
  createStudent(input: StudentInput): Promise<StudentRecord>;
  bulkCreateStudents(inputs: StudentInput[]): Promise<StudentRecord[]>;
  getStudentsBySchool(tenantSlug: string, classGroupId?: string): Promise<StudentRecord[]>;
  updateStudent(id: string, updates: Partial<StudentInput>): Promise<StudentRecord | null>;
  deleteStudent(id: string): Promise<boolean>;

  // Sinflar (Class Groups)
  createClassGroup(input: ClassGroupInput): Promise<ClassGroupRecord>;
  getClassGroupsBySchool(tenantSlug: string): Promise<ClassGroupRecord[]>;
}

