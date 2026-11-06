import type { ResultRepository } from '../../shared/api/repositories/ResultRepository';
import type { AssessmentResult } from '../../entities/result/model';

export class MockResultRepository implements ResultRepository {
  private results: Map<string, AssessmentResult> = new Map();
  private latencyMs: number;

  constructor(latencyMs = 0) {
    this.latencyMs = latencyMs;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }

  async getResultByAttemptId(tenantId: string, attemptId: string): Promise<AssessmentResult | null> {
    await this.delay();

    if (this.results.has(attemptId)) {
      const res = this.results.get(attemptId)!;
      return res.tenantId === tenantId ? res : null;
    }

    // Default synthetic result for demo attempt
    const syntheticResult: AssessmentResult = {
      attemptId,
      tenantId,
      assessmentId: 'chsb-inf-11-q1',
      rosterRecordId: 'rec-ax-101',
      studentName: 'Alisher Zokirov',
      className: '11-A sinf',
      totalQuestions: 15,
      answeredQuestions: 14,
      score: 35.0,
      maxScore: 40.0,
      percentage: 87.5,
      status: 'provisional_demo',
      verifiedByTeacher: false,
      submittedAt: new Date().toISOString(),
      teacherNote: "Bu natija o'qituvchi tomonidan tekshiriladi, ball o'zgarishi mumkin.",
    };

    return syntheticResult;
  }

  async getResultsByTenant(tenantId: string): Promise<AssessmentResult[]> {
    await this.delay();
    return Array.from(this.results.values()).filter((r) => r.tenantId === tenantId);
  }
}

