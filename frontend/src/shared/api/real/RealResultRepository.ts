import { httpClient } from '../httpClient';
import type { ResultRepository } from '../repositories/ResultRepository';
import type { AssessmentResult } from '../../../entities/result/model';

export class RealResultRepository implements ResultRepository {
  async getResultByAttemptId(_tenantId: string, attemptId: string): Promise<AssessmentResult | null> {
    try {
      return await httpClient.get<AssessmentResult>(`/results/attempt/${attemptId}`);
    } catch {
      return null;
    }
  }

  async getResultsByTenant(tenantId: string): Promise<AssessmentResult[]> {
    try {
      return await httpClient.get<AssessmentResult[]>(`/results/tenant/${tenantId}`);
    } catch {
      return [];
    }
  }
}

