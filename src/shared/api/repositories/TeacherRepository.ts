import type { ClassGroup } from '../../../entities/class-group/model';
import type { StudentRosterRecord } from '../../../entities/roster/model';
import type { AssessmentSummary } from '../../../entities/assessment/model';
import type { AssessmentResult } from '../../../entities/result/model';

export interface TeacherRepository {
  getClasses(tenantId: string): Promise<ClassGroup[]>;
  getRoster(tenantId: string, classGroupId?: string): Promise<StudentRosterRecord[]>;
  getAssessments(tenantId: string): Promise<AssessmentSummary[]>;
  getResults(tenantId: string): Promise<AssessmentResult[]>;
}
