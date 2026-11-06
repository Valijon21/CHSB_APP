import type { Assessment, AssessmentSummary } from '../../../entities/assessment/model';

export interface AssessmentRepository {
  getAvailableAssessments(tenantId: string): Promise<AssessmentSummary[]>;
  getAssessmentById(tenantId: string, assessmentId: string): Promise<Assessment | null>;
}
