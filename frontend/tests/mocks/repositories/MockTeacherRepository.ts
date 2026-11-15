import type { TeacherRepository } from '@/shared/api/repositories/TeacherRepository';
import type { ClassGroup } from '@/entities/class-group/model';
import type { StudentRosterRecord } from '@/entities/roster/model';
import type { AssessmentSummary } from '@/entities/assessment/model';
import type { AssessmentResult } from '@/entities/result/model';
import type {
  TeacherProfile,
  ClassDetail,
  StudentDetail,
  AssessmentDetail,
  AnalyticsData,
  ReportItem,
} from '@/entities/teacher/model';
import {
  mockClassGroups,
  mockRosterRecords,
  mockAssessments,
  mockSchools,
} from '../fixtures/tenants';

export class MockTeacherRepository implements TeacherRepository {
  private latencyMs: number;

  constructor(latencyMs = 0) {
    this.latencyMs = latencyMs;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }

  async getClasses(tenantId: string): Promise<ClassGroup[]> {
    await this.delay();
    return mockClassGroups.filter((c) => c.tenantId === tenantId);
  }

  async getRoster(tenantId: string, classGroupId?: string): Promise<StudentRosterRecord[]> {
    await this.delay();
    return mockRosterRecords.filter(
      (r) => r.tenantId === tenantId && (!classGroupId || r.classGroupId === classGroupId)
    );
  }

  async getAssessments(tenantId: string): Promise<AssessmentSummary[]> {
    await this.delay();
    return mockAssessments
      .filter((a) => a.tenantId === tenantId)
      .map((a) => ({
        id: a.id,
        tenantId: a.tenantId,
        title: a.title,
        subject: a.subject,
        grade: a.grade,
        quarter: a.quarter,
        assessmentNumber: a.assessmentNumber,
        durationMinutes: a.durationMinutes,
        durationSeconds: a.durationSeconds,
        questionCount: a.questionCount,
        maxScore: a.maxScore,
        status: a.status,
      }));
  }

  async createAssessment(input: import('@/entities/assessment/model').CreateAssessmentInput): Promise<AssessmentSummary> {
    await this.delay();
    return {
      id: `asm-${Date.now()}`,
      tenantId: 'tenant-al-xorazmiy',
      title: input.title,
      subject: input.subject,
      grade: input.gradeLevel,
      quarter: input.quarter,
      assessmentNumber: 1,
      durationMinutes: input.durationMinutes,
      durationSeconds: input.durationMinutes * 60,
      questionCount: input.totalQuestions,
      maxScore: input.maxScore,
      status: 'available',
    };
  }

  async getResults(tenantId: string): Promise<AssessmentResult[]> {
    await this.delay();

    if (tenantId === 'tenant-al-xorazmiy') {
      return [
        // 11-A sinf
        {
          attemptId: 'att-ax-01',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-101',
          studentName: 'Alisher Zokirov',
          className: '11-A',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 35.0,
          maxScore: 40.0,
          percentage: 87.5,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-06T10:45:00Z',
        },
        {
          attemptId: 'att-ax-02',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-102',
          studentName: 'Madina Rustamova',
          className: '11-A',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 37.5,
          maxScore: 40.0,
          percentage: 93.8,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-06T11:10:00Z',
        },
        {
          attemptId: 'att-ax-03',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-103',
          studentName: 'Jasur Bekmurodov',
          className: '11-A',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 32.0,
          maxScore: 40.0,
          percentage: 80.0,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-06T11:25:00Z',
        },
        {
          attemptId: 'att-ax-04',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-104',
          studentName: 'Dilnoza Karimova',
          className: '11-A',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 39.0,
          maxScore: 40.0,
          percentage: 97.5,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-06T11:30:00Z',
        },
        {
          attemptId: 'att-ax-05',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-105',
          studentName: 'Shaxzod Rahimov',
          className: '11-A',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 31.5,
          maxScore: 40.0,
          percentage: 78.8,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-06T11:45:00Z',
        },
        {
          attemptId: 'att-ax-06',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-106',
          studentName: 'Nilufar Qodirova',
          className: '11-A',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 36.0,
          maxScore: 40.0,
          percentage: 90.0,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-07T09:15:00Z',
        },
        {
          attemptId: 'att-ax-07',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-107',
          studentName: 'Bobur Mirzayev',
          className: '11-A',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 28.5,
          maxScore: 40.0,
          percentage: 71.3,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-07T09:40:00Z',
        },
        {
          attemptId: 'att-ax-08',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-108',
          studentName: 'Sevara Mahmudova',
          className: '11-A',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 38.0,
          maxScore: 40.0,
          percentage: 95.0,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-07T10:00:00Z',
        },
        {
          attemptId: 'att-ax-09',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-109',
          studentName: 'Azizbek Umarov',
          className: '11-A',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 25.0,
          maxScore: 40.0,
          percentage: 62.5,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-07T10:20:00Z',
        },
        {
          attemptId: 'att-ax-10',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-110',
          studentName: 'Kamola Yusupova',
          className: '11-A',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 34.0,
          maxScore: 40.0,
          percentage: 85.0,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-07T10:45:00Z',
        },

        // 11-B sinf
        {
          attemptId: 'att-ax-11',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-111',
          studentName: 'Sardorbek Aliyev',
          className: '11-B',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 36.5,
          maxScore: 40.0,
          percentage: 91.3,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-08T09:00:00Z',
        },
        {
          attemptId: 'att-ax-12',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-112',
          studentName: 'Gulnoza Xoliqova',
          className: '11-B',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 33.0,
          maxScore: 40.0,
          percentage: 82.5,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-08T09:25:00Z',
        },
        {
          attemptId: 'att-ax-13',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-113',
          studentName: 'Sanjarbek Normatov',
          className: '11-B',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 29.5,
          maxScore: 40.0,
          percentage: 73.8,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-08T09:50:00Z',
        },
        {
          attemptId: 'att-ax-14',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-114',
          studentName: 'Zarina Sobirova',
          className: '11-B',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 38.5,
          maxScore: 40.0,
          percentage: 96.3,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-08T10:15:00Z',
        },
        {
          attemptId: 'att-ax-15',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-115',
          studentName: 'Otabek G‘aniyev',
          className: '11-B',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 22.5,
          maxScore: 40.0,
          percentage: 56.3,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-08T10:40:00Z',
        },
        {
          attemptId: 'att-ax-16',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-116',
          studentName: 'Mohira Jo‘rayeva',
          className: '11-B',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 35.5,
          maxScore: 40.0,
          percentage: 88.8,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-08T11:00:00Z',
        },
        {
          attemptId: 'att-ax-17',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-117',
          studentName: 'Javohir Ergashboyev',
          className: '11-B',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 30.0,
          maxScore: 40.0,
          percentage: 75.0,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-08T11:20:00Z',
        },
        {
          attemptId: 'att-ax-18',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-118',
          studentName: 'Rayhona Toshpo‘latova',
          className: '11-B',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 26.5,
          maxScore: 40.0,
          percentage: 66.3,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-08T11:45:00Z',
        },

        // 11-V sinf
        {
          attemptId: 'att-ax-19',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-119',
          studentName: 'Shohrux Abdullayev',
          className: '11-V',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 37.0,
          maxScore: 40.0,
          percentage: 92.5,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-09T09:10:00Z',
        },
        {
          attemptId: 'att-ax-20',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-120',
          studentName: 'Shahlo Ergasheva',
          className: '11-V',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 34.5,
          maxScore: 40.0,
          percentage: 86.3,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-09T09:35:00Z',
        },
        {
          attemptId: 'att-ax-21',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-121',
          studentName: 'Ulug‘bek Po‘latov',
          className: '11-V',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 18.5,
          maxScore: 40.0,
          percentage: 46.3,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-09T10:00:00Z',
        },
        {
          attemptId: 'att-ax-22',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-122',
          studentName: 'Dildora Ismoilova',
          className: '11-V',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 36.0,
          maxScore: 40.0,
          percentage: 90.0,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-09T10:25:00Z',
        },
        {
          attemptId: 'att-ax-23',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-123',
          studentName: 'Farrux Qosimov',
          className: '11-V',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 24.0,
          maxScore: 40.0,
          percentage: 60.0,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-09T10:50:00Z',
        },
        {
          attemptId: 'att-ax-24',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-124',
          studentName: 'Nilufar Ahmedova',
          className: '11-V',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 35.0,
          maxScore: 40.0,
          percentage: 87.5,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-09T11:15:00Z',
        },

        // 10-A sinf
        {
          attemptId: 'att-ax-25',
          tenantId: 'tenant-al-xorazmiy',
          assessmentId: 'chsb-inf-11-q1',
          rosterRecordId: 'rec-ax-125',
          studentName: 'Jamshid Yoqubov',
          className: '10-A',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 33.5,
          maxScore: 40.0,
          percentage: 83.8,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-10T09:00:00Z',
        },
      ];
    }

    if (tenantId === 'tenant-temurbeklar') {
      return [
        {
          attemptId: 'att-tm-01',
          tenantId: 'tenant-temurbeklar',
          assessmentId: 'chsb-inf-11-q1-tm',
          rosterRecordId: 'rec-tm-201',
          studentName: 'Sardor Rahimov',
          className: '11-Guruh-1',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 38.0,
          maxScore: 40.0,
          percentage: 95.0,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-06T09:30:00Z',
        },
        {
          attemptId: 'att-tm-02',
          tenantId: 'tenant-temurbeklar',
          assessmentId: 'chsb-inf-11-q1-tm',
          rosterRecordId: 'rec-tm-202',
          studentName: 'Otabek Boboyev',
          className: '11-Guruh-1',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 35.5,
          maxScore: 40.0,
          percentage: 88.8,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-06T09:55:00Z',
        },
        {
          attemptId: 'att-tm-03',
          tenantId: 'tenant-temurbeklar',
          assessmentId: 'chsb-inf-11-q1-tm',
          rosterRecordId: 'rec-tm-203',
          studentName: 'Dilshod Karimov',
          className: '11-Guruh-1',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 32.5,
          maxScore: 40.0,
          percentage: 81.3,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-06T10:15:00Z',
        },
        {
          attemptId: 'att-tm-04',
          tenantId: 'tenant-temurbeklar',
          assessmentId: 'chsb-inf-11-q1-tm',
          rosterRecordId: 'rec-tm-204',
          studentName: 'Sherzodbek Mansurov',
          className: '11-Guruh-1',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 37.0,
          maxScore: 40.0,
          percentage: 92.5,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-06T10:40:00Z',
        },
        {
          attemptId: 'att-tm-05',
          tenantId: 'tenant-temurbeklar',
          assessmentId: 'chsb-inf-11-q1-tm',
          rosterRecordId: 'rec-tm-205',
          studentName: 'Xurshid Normurodov',
          className: '11-Guruh-2',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 34.0,
          maxScore: 40.0,
          percentage: 85.0,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-07T09:00:00Z',
        },
        {
          attemptId: 'att-tm-06',
          tenantId: 'tenant-temurbeklar',
          assessmentId: 'chsb-inf-11-q1-tm',
          rosterRecordId: 'rec-tm-206',
          studentName: 'Doniyorbek Hakimov',
          className: '11-Guruh-2',
          totalQuestions: 15,
          answeredQuestions: 15,
          score: 30.5,
          maxScore: 40.0,
          percentage: 76.3,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-07T09:30:00Z',
        },
      ];
    }

    return [];
  }

  async getProfile(tenantId: string): Promise<TeacherProfile> {
    await this.delay();
    if (tenantId === 'tenant-temurbeklar') {
      return {
        id: 'tch-tm-01',
        tenantId: 'tenant-temurbeklar',
        fullName: 'Farrux Komilov',
        title: 'Harbiy informatika va axborot texnologiyalari katta o‘qituvchisi',
        email: 'f.komilov@temurbeklar.uz',
        phone: '+998 71 200-22-02',
        assignedSchoolName: 'Temurbeklar Maktabi Markaziy Kampus',
        subjects: ['Informatika va axborot texnologiyalari', 'Kiberxavfsizlik asoslari'],
        assignedClassIds: ['class-tm-11g1', 'class-tm-11g2'],
      };
    }

    return {
      id: 'tch-ax-01',
      tenantId: 'tenant-al-xorazmiy',
      fullName: 'Dilmurod Ustoz',
      title: 'Oliy toifali informatika va axborot texnologiyalari fani o‘qituvchisi',
      email: 'dilmurod.ustoz@al-xorazmiy.uz',
      phone: '+998 71 200-11-01',
      assignedSchoolName: 'Al-Xorazmiy IT Bosh Kampusi',
      subjects: ['Informatika va axborot texnologiyalari', 'Algoritmlar va dasturlash'],
      assignedClassIds: ['class-ax-11a', 'class-ax-11b'],
    };
  }

  async getClassDetail(tenantId: string, classId: string): Promise<ClassDetail | null> {
    await this.delay();
    const classGroup = mockClassGroups.find((c) => c.id === classId && c.tenantId === tenantId);
    if (!classGroup) return null;

    const students = mockRosterRecords.filter(
      (r) => r.tenantId === tenantId && r.classGroupId === classId
    );
    const results = (await this.getResults(tenantId)).filter(
      (res) => students.some((s) => s.id === res.rosterRecordId)
    );

    const averageScore =
      results.length > 0
        ? Number((results.reduce((acc, r) => acc + r.score, 0) / results.length).toFixed(1))
        : 0;

    const participationRate =
      students.length > 0 ? Math.round((results.length / students.length) * 100) : 0;

    return {
      classGroup,
      students,
      results,
      averageScore,
      participationRate,
    };
  }

  async getStudentDetail(tenantId: string, studentId: string): Promise<StudentDetail | null> {
    await this.delay();
    const roster = mockRosterRecords.find((r) => r.id === studentId && r.tenantId === tenantId);
    if (!roster) return null;

    const classGroup = mockClassGroups.find((c) => c.id === roster.classGroupId);
    const school = mockSchools.find((s) => s.id === roster.schoolId);
    const allResults = await this.getResults(tenantId);
    const results = allResults.filter((r) => r.rosterRecordId === studentId);

    const averageScore =
      results.length > 0
        ? Number((results.reduce((acc, r) => acc + r.score, 0) / results.length).toFixed(1))
        : 0;

    return {
      roster,
      className: classGroup?.name ?? '11-A',
      schoolName: school?.name ?? 'Asosiy Bosh Kampus',
      results,
      attendanceRate: roster.status === 'eligible' ? 98 : 45,
      averageScore,
    };
  }

  async getAssessmentDetail(
    tenantId: string,
    assessmentId: string
  ): Promise<AssessmentDetail | null> {
    await this.delay();
    const summaries = await this.getAssessments(tenantId);
    const summary = summaries.find((s) => s.id === assessmentId);
    if (!summary) return null;

    const results = await this.getResults(tenantId);
    const relevantResults = results.filter((r) => r.assessmentId === assessmentId);

    const classes = await this.getClasses(tenantId);
    const totalAssigned = classes.reduce((sum, c) => sum + c.studentCount, 0);
    const totalCompleted = relevantResults.length;
    const averageScore =
      totalCompleted > 0
        ? Number((relevantResults.reduce((acc, r) => acc + r.score, 0) / totalCompleted).toFixed(1))
        : 36.2;

    const questionStats = [
      { order: 1, cognitiveLevel: '(B)', points: 2.5, correctRate: 94 },
      { order: 2, cognitiveLevel: '(B)', points: 2.5, correctRate: 88 },
      { order: 3, cognitiveLevel: '(Q)', points: 2.5, correctRate: 78 },
      { order: 4, cognitiveLevel: '(B)', points: 2.5, correctRate: 91 },
      { order: 5, cognitiveLevel: '(B)', points: 2.5, correctRate: 85 },
      { order: 6, cognitiveLevel: '(B)', points: 2.5, correctRate: 80 },
      { order: 7, cognitiveLevel: '(Q)', points: 2.5, correctRate: 72 },
      { order: 8, cognitiveLevel: '(Q)', points: 2.5, correctRate: 69 },
      { order: 9, cognitiveLevel: '(B)', points: 2.5, correctRate: 89 },
      { order: 10, cognitiveLevel: '(B)', points: 2.5, correctRate: 82 },
      { order: 11, cognitiveLevel: '(M)', points: 3.0, correctRate: 64 },
      { order: 12, cognitiveLevel: '(M)', points: 3.0, correctRate: 58 },
      { order: 13, cognitiveLevel: '(Q)', points: 3.0, correctRate: 75 },
      { order: 14, cognitiveLevel: '(Q)', points: 3.0, correctRate: 70 },
      { order: 15, cognitiveLevel: '(M)', points: 3.0, correctRate: 61 },
    ];

    return {
      summary,
      totalAssigned: totalAssigned || 42,
      totalCompleted,
      completionRate: Math.round(((totalCompleted || 2) / (totalAssigned || 42)) * 100),
      averageScore,
      questionStats,
    };
  }

  async getAnalytics(tenantId: string): Promise<AnalyticsData> {
    await this.delay();
    const classes = await this.getClasses(tenantId);
    const results = await this.getResults(tenantId);

    const classComparisons = classes.map((c, idx) => {
      const classResults = results.filter(
        (r) => r.className === c.name || c.name.startsWith(r.className) || r.className.startsWith(c.name)
      );
      const avg =
        classResults.length > 0
          ? Number((classResults.reduce((sum, r) => sum + r.score, 0) / classResults.length).toFixed(1))
          : Number((34.0 + (idx % 3) * 1.2).toFixed(1));
      return {
        className: c.name,
        averageScore: avg,
        maxPossibleScore: 40,
        studentCount: c.studentCount,
        participationRate: Math.min(100, 91 + (idx * 2) % 8),
      };
    });

    return {
      classComparisons,
      scoreDistribution: {
        excellent: results.filter((r) => r.score >= 35).length || 2,
        good: results.filter((r) => r.score >= 28 && r.score < 35).length || 5,
        satisfactory: results.filter((r) => r.score >= 20 && r.score < 28).length || 1,
        needsImprovement: results.filter((r) => r.score < 20).length || 0,
      },
      cognitiveBreakdown: {
        knowledge: {
          label: 'Bilish (B)',
          points: 17.5,
          averageAccuracy: 86.5,
        },
        application: {
          label: "Qo'llash (Q)",
          points: 13.5,
          averageAccuracy: 73.0,
        },
        reasoning: {
          label: 'Mulohaza (M)',
          points: 9.0,
          averageAccuracy: 61.2,
        },
      },
    };
  }

  async generateReportData(
    tenantId: string,
    options?: { classGroupId?: string; assessmentId?: string }
  ): Promise<ReportItem[]> {
    await this.delay();
    const results = await this.getResults(tenantId);
    const roster = await this.getRoster(tenantId, options?.classGroupId);
    const assessments = await this.getAssessments(tenantId);

    return results.map((r) => {
      const student = roster.find((s) => s.id === r.rosterRecordId);
      const asm = assessments.find((a) => a.id === r.assessmentId);
      return {
        studentName: r.studentName,
        className: r.className,
        rosterCode: student?.rosterCode ?? 'STU-DEMO',
        assessmentTitle: asm?.title ?? 'Informatika va axborot texnologiyalari, 11-sinf. I chorak 1-ChSB',
        score: r.score,
        maxScore: r.maxScore,
        percentage: r.percentage,
        submittedAt: r.submittedAt,
        status: r.status === 'verified' ? 'Tasdiqlangan' : 'Tekshirilmoqda',
      };
    });
  }
}
