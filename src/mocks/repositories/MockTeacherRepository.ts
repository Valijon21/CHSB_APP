import type { TeacherRepository } from '../../shared/api/repositories/TeacherRepository';
import type { ClassGroup } from '../../entities/class-group/model';
import type { StudentRosterRecord } from '../../entities/roster/model';
import type { AssessmentSummary } from '../../entities/assessment/model';
import type { AssessmentResult } from '../../entities/result/model';
import {
  mockClassGroups,
  mockRosterRecords,
  mockAssessments,
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
}
