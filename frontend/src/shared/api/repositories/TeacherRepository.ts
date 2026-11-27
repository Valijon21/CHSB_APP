import type { ClassGroup } from '../../../entities/class-group/model';
import type { StudentRosterRecord } from '../../../entities/roster/model';
import type { AssessmentSummary, CreateAssessmentInput } from '../../../entities/assessment/model';
import type { AssessmentResult } from '../../../entities/result/model';
import type {
  TeacherProfile,
  ClassDetail,
  StudentDetail,
  AssessmentDetail,
  AnalyticsData,
  ReportItem,
  GradeResultInput,
  FormativeScoreInput,
  QuarterGradebookResponse,
  StudentsMasteryResponse,
  StudentMasteryDetail,
} from '../../../entities/teacher/model';

export interface TeacherRepository {
  getClasses(tenantId: string): Promise<ClassGroup[]>;
  getRoster(tenantId: string, classGroupId?: string): Promise<StudentRosterRecord[]>;
  getAssessments(tenantId: string): Promise<AssessmentSummary[]>;
  createAssessment(input: CreateAssessmentInput): Promise<AssessmentSummary>;
  getResults(tenantId: string): Promise<AssessmentResult[]>;
  gradeResult?(attemptId: string, input: GradeResultInput): Promise<AssessmentResult>;
  getQuarterGradebook?(
    tenantId: string,
    options?: { classGroupId?: string; subjectCode?: string; quarter?: number; academicYear?: string }
  ): Promise<QuarterGradebookResponse>;
  saveFormativeScore?(input: FormativeScoreInput): Promise<{ totalScore: number }>;
  getStudentsMastery?(
    tenantId: string,
    options?: { classGroupId?: string; quarter?: number }
  ): Promise<StudentsMasteryResponse>;
  getStudentMastery?(tenantId: string, studentId: string, quarter?: number): Promise<StudentMasteryDetail | null>;
  getProfile(tenantId: string): Promise<TeacherProfile>;
  getClassDetail(tenantId: string, classId: string): Promise<ClassDetail | null>;
  getStudentDetail(tenantId: string, studentId: string): Promise<StudentDetail | null>;
  getAssessmentDetail(tenantId: string, assessmentId: string): Promise<AssessmentDetail | null>;
  getAnalytics(tenantId: string): Promise<AnalyticsData>;
  generateReportData(tenantId: string, options?: { classGroupId?: string; assessmentId?: string }): Promise<ReportItem[]>;
}

