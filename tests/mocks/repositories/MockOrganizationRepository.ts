import type { OrganizationRepository } from '@/shared/api/repositories/OrganizationRepository';
import type {
  SchoolInput,
  SchoolRecord,
  TeacherInput,
  TeacherRecord,
  StudentInput,
  StudentRecord,
  ClassGroupInput,
  ClassGroupRecord,
} from '@/entities/organization/model';

export class MockOrganizationRepository implements OrganizationRepository {
  private schools: SchoolRecord[] = [];
  private teachers: TeacherRecord[] = [];
  private students: StudentRecord[] = [];
  private classGroups: ClassGroupRecord[] = [];
  private nextRosterSeq = 1100;

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Dastlabki Maktablar
    this.schools = [
      {
        id: 'sch-01',
        name: 'Al-Xorazmiy nomidagi IT-maktab',
        code: 'AX-01',
        slug: 'al-xorazmiy',
        districtId: 'dist-urganch-shahar',
        districtName: 'Urganch shahri',
        type: 'specialized',
        directorName: 'Boboyev Shavkat Karimovich',
        contactPhone: '+998622241020',
        email: 'info@al-xorazmiy.uz',
        status: 'active',
        studentCount: 240,
        teacherCount: 18,
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'sch-02',
        name: 'Temurbeklar Maktabi Harbiy-Akademik Litseyi',
        code: 'TM-01',
        slug: 'temurbeklar-maktabi',
        districtId: 'dist-urganch-shahar',
        districtName: 'Urganch shahri',
        type: 'lyceum',
        directorName: 'Polkovnik Rahimov A.',
        contactPhone: '+998622251122',
        email: 'litsey@temurbeklar.uz',
        status: 'active',
        studentCount: 180,
        teacherCount: 15,
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'sch-03',
        name: 'Xorazm Viloyati Namunaviy CHSB Maktabi',
        code: 'XOR-DEMO',
        slug: 'xorazm-demo',
        districtId: 'dist-xiva-shahar',
        districtName: 'Xiva shahri',
        type: 'specialized',
        directorName: 'Omonov Qodirjon',
        contactPhone: '+998623758899',
        email: 'demo@xorazm.uz',
        status: 'active',
        studentCount: 310,
        teacherCount: 22,
        createdAt: '2026-09-01T08:00:00Z',
      },
    ];

    // 2. Dastlabki Sinflar
    this.classGroups = [
      {
        id: 'cls-ax-11a',
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
        name: '11-A',
        gradeLevel: 11,
        shift: 1,
        academicYear: '2026-2027',
        studentCount: 25,
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'cls-ax-10a',
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
        name: '10-A',
        gradeLevel: 10,
        shift: 1,
        academicYear: '2026-2027',
        studentCount: 28,
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'cls-demo-9a',
        schoolId: 'sch-03',
        tenantSlug: 'xorazm-demo',
        name: '9-A',
        gradeLevel: 9,
        shift: 1,
        academicYear: '2026-2027',
        studentCount: 30,
        createdAt: '2026-09-01T08:00:00Z',
      },
    ];

    // 3. Dastlabki O'qituvchilar
    this.teachers = [
      {
        id: 'tch-01',
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
        fullName: 'Dilmurod Quryazov',
        subject: 'Informatika va axborot texnologiyalari',
        qualification: 'oliy',
        assignedClassIds: ['cls-ax-11a', 'cls-ax-10a'],
        assignedClassNames: ['11-A', '10-A'],
        phone: '+998901234567',
        email: 'dilmurod@al-xorazmiy.uz',
        status: 'active',
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'tch-02',
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
        fullName: 'Nilufar Rahimova',
        subject: 'Dasturlash asoslari va Python',
        qualification: 'birinchi',
        assignedClassIds: ['cls-ax-11a'],
        assignedClassNames: ['11-A'],
        phone: '+998907654321',
        email: 'n.rahimova@al-xorazmiy.uz',
        status: 'active',
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'tch-03',
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
        fullName: 'Farrux Komilov',
        subject: 'Kiberxavfsizlik va tarmoqlar',
        qualification: 'oliy',
        assignedClassIds: ['cls-ax-10a'],
        assignedClassNames: ['10-A'],
        phone: '+998933334455',
        email: 'f.komilov@al-xorazmiy.uz',
        status: 'active',
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'tch-04',
        schoolId: 'sch-02',
        tenantSlug: 'temurbeklar-maktabi',
        fullName: 'Mayor Bobur Karimov',
        subject: 'Harbiy axborot tizimlari',
        qualification: 'oliy',
        assignedClassIds: [],
        assignedClassNames: ['11-Guruh-1'],
        phone: '+998912223344',
        email: 'b.karimov@temurbeklar.uz',
        status: 'active',
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'tch-05',
        schoolId: 'sch-03',
        tenantSlug: 'xorazm-demo',
        fullName: 'Matyoqubova Sabohat',
        subject: 'Matematika',
        qualification: 'birinchi',
        assignedClassIds: ['cls-demo-9a'],
        assignedClassNames: ['9-A'],
        phone: '+998912345678',
        email: 'sabohat@xorazm.uz',
        status: 'active',
        createdAt: '2026-09-01T08:00:00Z',
      },
    ];

    // 4. Dastlabki O'quvchilar
    this.students = [
      {
        id: 'stu-01',
        tenantSlug: 'al-xorazmiy',
        schoolId: 'sch-01',
        classGroupId: 'cls-ax-11a',
        className: '11-A',
        firstName: 'Alisher',
        lastName: 'Zokirov',
        middleName: 'Bahrom o‘g‘li',
        fullName: 'Zokirov Alisher Bahrom o‘g‘li',
        gender: 'M',
        birthDate: '2008-04-12',
        rosterCode: 'STU-1101',
        status: 'eligible',
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'stu-02',
        tenantSlug: 'al-xorazmiy',
        schoolId: 'sch-01',
        classGroupId: 'cls-ax-11a',
        className: '11-A',
        firstName: 'Madina',
        lastName: 'Rustamova',
        middleName: 'Ilhom qizi',
        fullName: 'Rustamova Madina Ilhom qizi',
        gender: 'F',
        birthDate: '2008-09-20',
        rosterCode: 'STU-1102',
        status: 'eligible',
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'stu-03',
        tenantSlug: 'al-xorazmiy',
        schoolId: 'sch-01',
        classGroupId: 'cls-ax-11a',
        className: '11-A',
        firstName: 'Jasur',
        lastName: 'Bekmurodov',
        middleName: 'Olim o‘g‘li',
        fullName: 'Bekmurodov Jasur Olim o‘g‘li',
        gender: 'M',
        birthDate: '2008-03-15',
        rosterCode: 'STU-1103',
        status: 'eligible',
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'stu-04',
        tenantSlug: 'al-xorazmiy',
        schoolId: 'sch-01',
        classGroupId: 'cls-ax-11a',
        className: '11-A',
        firstName: 'Dilnoza',
        lastName: 'Karimova',
        middleName: 'Sobir qizi',
        fullName: 'Karimova Dilnoza Sobir qizi',
        gender: 'F',
        birthDate: '2008-07-22',
        rosterCode: 'STU-1104',
        status: 'eligible',
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'stu-05',
        tenantSlug: 'al-xorazmiy',
        schoolId: 'sch-01',
        classGroupId: 'cls-ax-11a',
        className: '11-A',
        firstName: 'Shaxzod',
        lastName: 'Rahimov',
        middleName: 'Murod o‘g‘li',
        fullName: 'Rahimov Shaxzod Murod o‘g‘li',
        gender: 'M',
        birthDate: '2008-11-05',
        rosterCode: 'STU-1105',
        status: 'eligible',
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'stu-06',
        tenantSlug: 'al-xorazmiy',
        schoolId: 'sch-01',
        classGroupId: 'cls-ax-10a',
        className: '10-A',
        firstName: 'Nilufar',
        lastName: 'Qodirova',
        middleName: 'Farhod qizi',
        fullName: 'Qodirova Nilufar Farhod qizi',
        gender: 'F',
        birthDate: '2009-01-18',
        rosterCode: 'STU-1001',
        status: 'eligible',
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'stu-07',
        tenantSlug: 'al-xorazmiy',
        schoolId: 'sch-01',
        classGroupId: 'cls-ax-10a',
        className: '10-A',
        firstName: 'Jamshid',
        lastName: 'Yoqubov',
        middleName: 'Olim o‘g‘li',
        fullName: 'Yoqubov Jamshid Olim o‘g‘li',
        gender: 'M',
        birthDate: '2009-05-30',
        rosterCode: 'STU-1002',
        status: 'eligible',
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'stu-08',
        tenantSlug: 'xorazm-demo',
        schoolId: 'sch-03',
        classGroupId: 'cls-demo-9a',
        className: '9-A',
        firstName: 'Sardor',
        lastName: 'Boboyev',
        middleName: 'Ilhomovich',
        fullName: 'Boboyev Sardor Ilhomovich',
        gender: 'M',
        birthDate: '2010-02-14',
        rosterCode: 'STU-901',
        status: 'eligible',
        createdAt: '2026-09-01T08:00:00Z',
      },
    ];
  }

  // --- MAKTABLAR (SCHOOLS) ---
  async createSchool(input: SchoolInput): Promise<SchoolRecord> {
    const existing = this.schools.find((s) => s.slug === input.slug);
    if (existing) {
      throw new Error(`Ushbu slug (${input.slug}) bo'yicha maktab allaqachon mavjud!`);
    }

    const newSchool: SchoolRecord = {
      ...input,
      id: `sch-${Date.now()}`,
      studentCount: 0,
      teacherCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.schools.push(newSchool);
    return newSchool;
  }

  async getAllSchools(): Promise<SchoolRecord[]> {
    // Har bir maktab uchun dinamik hisoblagichlarni yangilash
    return this.schools.map((school) => {
      const studentCount = this.students.filter((s) => s.schoolId === school.id).length;
      const teacherCount = this.teachers.filter((t) => t.schoolId === school.id).length;
      return {
        ...school,
        studentCount: Math.max(school.studentCount, studentCount),
        teacherCount: Math.max(school.teacherCount, teacherCount),
      };
    });
  }

  async getSchoolBySlug(slug: string): Promise<SchoolRecord | null> {
    const school = this.schools.find((s) => s.slug === slug);
    return school ? { ...school } : null;
  }

  // --- O'QITUVCHILAR (TEACHERS) ---
  async createTeacher(input: TeacherInput): Promise<TeacherRecord> {
    const classNames = this.classGroups
      .filter((c) => input.assignedClassIds.includes(c.id))
      .map((c) => c.name);

    const newTeacher: TeacherRecord = {
      ...input,
      id: `tch-${Date.now()}`,
      assignedClassNames: classNames,
      createdAt: new Date().toISOString(),
    };

    this.teachers.push(newTeacher);

    // Maktab hisoblagichini oshirish
    const school = this.schools.find((s) => s.slug === input.tenantSlug || s.id === input.schoolId);
    if (school) {
      school.teacherCount++;
    }

    return newTeacher;
  }

  async getTeachersBySchool(tenantSlug: string): Promise<TeacherRecord[]> {
    return this.teachers.filter((t) => t.tenantSlug === tenantSlug || t.schoolId === tenantSlug);
  }

  async updateTeacher(id: string, updates: Partial<TeacherInput>): Promise<TeacherRecord | null> {
    const idx = this.teachers.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    const current = this.teachers[idx];
    if (!current) return null;

    let classNames = current.assignedClassNames;
    if (updates.assignedClassIds) {
      classNames = this.classGroups
        .filter((c) => updates.assignedClassIds!.includes(c.id))
        .map((c) => c.name);
    }

    const updated: TeacherRecord = {
      ...current,
      ...updates,
      assignedClassNames: classNames,
    };

    this.teachers[idx] = updated;
    return updated;
  }

  async deleteTeacher(id: string): Promise<boolean> {
    const initialLen = this.teachers.length;
    this.teachers = this.teachers.filter((t) => t.id !== id);
    return this.teachers.length < initialLen;
  }

  // --- O'QUVCHILAR (STUDENTS) ---
  async createStudent(input: StudentInput): Promise<StudentRecord> {
    const rosterCode = input.rosterCode || `STU-${++this.nextRosterSeq}`;
    const fullName = [input.lastName, input.firstName, input.middleName].filter(Boolean).join(' ');

    const newStudent: StudentRecord = {
      ...input,
      status: input.status ?? 'eligible',
      id: `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      rosterCode,
      fullName,
      createdAt: new Date().toISOString(),
    };

    this.students.push(newStudent);

    // Maktab va sinf hisoblagichlarini oshirish
    const school = this.schools.find((s) => s.slug === input.tenantSlug || s.id === input.schoolId);
    if (school) school.studentCount++;

    const cls = this.classGroups.find((c) => c.id === input.classGroupId);
    if (cls) cls.studentCount++;

    return newStudent;
  }

  async bulkCreateStudents(inputs: StudentInput[]): Promise<StudentRecord[]> {
    const createdList: StudentRecord[] = [];
    for (const input of inputs) {
      const student = await this.createStudent(input);
      createdList.push(student);
    }
    return createdList;
  }

  async getStudentsBySchool(tenantSlug: string, classGroupId?: string): Promise<StudentRecord[]> {
    return this.students.filter((s) => {
      const matchSchool = s.tenantSlug === tenantSlug;
      if (!matchSchool) return false;
      if (classGroupId) return s.classGroupId === classGroupId;
      return true;
    });
  }

  async updateStudent(id: string, updates: Partial<StudentInput>): Promise<StudentRecord | null> {
    const idx = this.students.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    const current = this.students[idx];
    if (!current) return null;

    const lastName = updates.lastName ?? current.lastName;
    const firstName = updates.firstName ?? current.firstName;
    const middleName = updates.middleName ?? current.middleName;
    const fullName = [lastName, firstName, middleName].filter(Boolean).join(' ');

    const updated: StudentRecord = {
      ...current,
      ...updates,
      fullName,
    };

    this.students[idx] = updated;
    return updated;
  }

  async deleteStudent(id: string): Promise<boolean> {
    const initialLen = this.students.length;
    this.students = this.students.filter((s) => s.id !== id);
    return this.students.length < initialLen;
  }

  // --- SINFLAR (CLASS GROUPS) ---
  async createClassGroup(input: ClassGroupInput): Promise<ClassGroupRecord> {
    const classId = `cls-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    let headTeacherName = input.headTeacherName;

    if (input.headTeacherId) {
      const teacher = this.teachers.find((t) => t.id === input.headTeacherId);
      if (teacher) {
        headTeacherName = teacher.fullName;
        if (!teacher.assignedClassIds.includes(classId)) {
          teacher.assignedClassIds.push(classId);
          teacher.assignedClassNames.push(input.name);
        }
      }
    }

    const newClass: ClassGroupRecord = {
      ...input,
      id: classId,
      headTeacherName,
      studentCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.classGroups.push(newClass);
    return newClass;
  }

  async getClassGroupsBySchool(tenantSlug: string): Promise<ClassGroupRecord[]> {
    return this.classGroups.filter((c) => c.tenantSlug === tenantSlug);
  }

  async deleteClassGroup(id: string): Promise<boolean> {
    const idx = this.classGroups.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.classGroups.splice(idx, 1);
    this.students = this.students.filter((s) => s.classGroupId !== id);
    return true;
  }

  async purgeClassStudents(classId: string): Promise<{ success: boolean; purgedCount: number }> {
    const initialCount = this.students.length;
    this.students = this.students.filter((s) => s.classGroupId !== classId);
    const purgedCount = initialCount - this.students.length;
    const cls = this.classGroups.find((c) => c.id === classId);
    if (cls) {
      cls.studentCount = 0;
    }
    return { success: true, purgedCount };
  }
}

