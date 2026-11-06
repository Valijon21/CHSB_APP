import type { ClassGroup } from '../../../entities/class-group/model';
import type { StudentRosterRecord } from '../../../entities/roster/model';
import type { AssessmentSummary } from '../../../entities/assessment/model';
import type { AssessmentResult } from '../../../entities/result/model';
import type {
  TeacherProfile,
  ClassDetail,
  StudentDetail,
  AssessmentDetail,
  AnalyticsData,
  ReportItem,
} from '../../../entities/teacher/model';

export interface TeacherRepository {
  getClasses(tenantId: string): Promise<ClassGroup[]>;
  getRoster(tenantId: string, classGroupId?: string): Promise<StudentRosterRecord[]>;
  getAssessments(tenantId: string): Promise<AssessmentSummary[]>;
  getResults(tenantId: string): Promise<AssessmentResult[]>;
  getProfile(tenantId: string): Promise<TeacherProfile>;
  getClassDetail(tenantId: string, classId: string): Promise<ClassDetail | null>;
  getStudentDetail(tenantId: string, studentId: string): Promise<StudentDetail | null>;
  getAssessmentDetail(tenantId: string, assessmentId: string): Promise<AssessmentDetail | null>;
  getAnalytics(tenantId: string): Promise<AnalyticsData>;
  generateReportData(tenantId: string, options?: { classGroupId?: string; assessmentId?: string }): Promise<ReportItem[]>;
}
