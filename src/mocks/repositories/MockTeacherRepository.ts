import type { TeacherRepository } from '../../shared/api/repositories/TeacherRepository';
import type { ClassGroup } from '../../entities/class-group/model';
import type { StudentRosterRecord } from '../../entities/roster/model';
import type { AssessmentSummary } from '../../entities/assessment/model';
import type { AssessmentResult } from '../../entities/result/model';
import type {
  TeacherProfile,
  ClassDetail,
  StudentDetail,
  AssessmentDetail,
  AnalyticsData,
  ReportItem,
} from '../../entities/teacher/model';
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

  async getResults(tenantId: string): Promise<AssessmentResult[]> {
    await this.delay();

    if (tenantId === 'tenant-al-xorazmiy') {
      return [
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
          percentage: 93.7,
          status: 'verified',
          verifiedByTeacher: true,
          submittedAt: '2026-11-06T11:10:00Z',
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
      const classResults = results.filter((r) => r.className === c.name || idx === 0);
      const avg =
        classResults.length > 0
          ? Number((classResults.reduce((sum, r) => sum + r.score, 0) / classResults.length).toFixed(1))
          : 34.5;
      return {
        className: c.name,
        averageScore: avg,
        maxPossibleScore: 40,
        studentCount: c.studentCount,
        participationRate: idx === 0 ? 95 : 88,
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

    return results.map((r) => {
      const student = roster.find((s) => s.id === r.rosterRecordId);
      return {
        studentName: r.studentName,
        className: r.className,
        rosterCode: student?.rosterCode ?? 'STU-DEMO',
        assessmentTitle: '1-CHSB Informatika va AT (11-sinf)',
        score: r.score,
        maxScore: r.maxScore,
        percentage: r.percentage,
        submittedAt: r.submittedAt,
        status: r.status === 'verified' ? 'Tasdiqlangan' : 'Tekshirilmoqda',
      };
    });
  }
}
