import type { AssessmentResult } from '../../../entities/result/model';

export interface ResultRepository {
  getResultByAttemptId(tenantId: string, attemptId: string): Promise<AssessmentResult | null>;
  getResultsByTenant(tenantId: string): Promise<AssessmentResult[]>;
}
