import { z } from 'zod';
import type { ClassGroup } from '../class-group/model';
import type { StudentRosterRecord } from '../roster/model';
import type { AssessmentSummary } from '../assessment/model';
import type { AssessmentResult } from '../result/model';

export const TeacherProfileSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  fullName: z.string(),
  title: z.string(), // e.g. "Oliy toifali informatika fani o'qituvchisi"
  email: z.string().email(),
  phone: z.string(),
  assignedSchoolName: z.string(),
  subjects: z.array(z.string()),
  assignedClassIds: z.array(z.string()),
  avatarUrl: z.string().optional(),
});

export type TeacherProfile = z.infer<typeof TeacherProfileSchema>;

export interface StudentDetail {
  roster: StudentRosterRecord;
  className: string;
  schoolName: string;
  results: AssessmentResult[];
  attendanceRate: number; // e.g. 96 (%)
  averageScore: number;
}

export interface ClassDetail {
  classGroup: ClassGroup;
  students: StudentRosterRecord[];
  results: AssessmentResult[];
  averageScore: number;
  participationRate: number; // e.g. 92 (%)
}

export interface AssessmentDetail {
  summary: AssessmentSummary;
  totalAssigned: number;
  totalCompleted: number;
  completionRate: number;
  averageScore: number;
  questionStats: Array<{
    order: number;
    cognitiveLevel: string;
    points: number;
    correctRate: number; // estimated average correct %
  }>;
  questions?: Array<{
    id: string;
    order: number;
    text: string;
    options: Array<{ id: string; label?: string; text: string }>;
    correctOptionId?: string;
    points: number;
    cognitiveLevel: string;
  }>;
}

export interface AnalyticsData {
  classComparisons: Array<{
    className: string;
    averageScore: number;
    maxPossibleScore: number;
    studentCount: number;
    participationRate: number;
  }>;
  scoreDistribution: {
    excellent: number; // 35 - 40
    good: number;      // 28 - 34.5
    satisfactory: number; // 20 - 27.5
    needsImprovement: number; // < 20
  };
  cognitiveBreakdown: {
    knowledge: { label: 'Bilish (B)', points: number; averageAccuracy: number };
    application: { label: "Qo'llash (Q)", points: number; averageAccuracy: number };
    reasoning: { label: 'Mulohaza (M)', points: number; averageAccuracy: number };
  };
}

export interface ReportItem {
  studentName: string;
  className: string;
  rosterCode: string;
  assessmentTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  submittedAt: string;
  status: string;
}

export interface GradeResultInput {
  score: number;
  rubricScores?: Record<string, number>;
  feedback?: string;
  verifiedByTeacher?: boolean;
}

export interface FormativeScoreInput {
  studentId: string;
  subjectCode: string;
  quarter: number;
  academicYear?: string;
  classwork: number;
  homework: number;
  note?: string;
}

export interface QuarterGradebookRow {
  studentId: string;
  rosterCode: string;
  studentName: string;
  classGroupId: string;
  className: string;
  classwork: number;
  homework: number;
  formativeScore: number;
  bsbScore: number;
  chsbScore: number;
  totalScore100: number;
  grade5: string;
  preset: 'MMTV_STANDARD' | 'SPECIALIZED';
  annualScore100?: number;
  annualGrade5?: string;
}

export interface QuarterGradebookResponse {
  tenantId: string;
  quarter: number;
  academicYear: string;
  subjectCode: string;
  preset: 'MMTV_STANDARD' | 'SPECIALIZED';
  rows: QuarterGradebookRow[];
}

