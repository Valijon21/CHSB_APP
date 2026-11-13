import type { AssessmentRepository } from '@/shared/api/repositories/AssessmentRepository';
import type { Assessment, AssessmentSummary } from '@/entities/assessment/model';
import { mockAssessments } from '../fixtures/tenants';

export class MockAssessmentRepository implements AssessmentRepository {
  private assessments: Assessment[];
  private latencyMs: number;

  constructor(assessments = mockAssessments, latencyMs = 0) {
    this.assessments = assessments;
    this.latencyMs = latencyMs;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }

  async getAvailableAssessments(tenantId: string): Promise<AssessmentSummary[]> {
    await this.delay();
    return this.assessments
      .filter((a) => a.tenantId === tenantId && a.status === 'available')
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

  async getAssessmentById(tenantId: string, assessmentId: string): Promise<Assessment | null> {
    await this.delay();
    const assessment = this.assessments.find((a) => a.tenantId === tenantId && a.id === assessmentId);
    return assessment || null;
  }
}
