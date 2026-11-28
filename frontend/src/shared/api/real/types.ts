export interface BackendTenantContext {
  tenantId: string;
  tenantSlug: string;
  schoolName: string;
  schoolCode: string;
  region: string;
  district: string;
  activeAcademicYear: string;
}

export interface BackendTenantItem {
  id: string;
  slug: string;
  name: string;
  code: string;
  region: string;
  activeYear: string;
  createdAt: string;
}

export interface BackendVerifyResponse {
  success: boolean;
  message?: string;
  sessionToken?: string;
  schoolName?: string;
  student?: {
    id: string;
    rosterCode: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    className?: string;
    classGroupId?: string;
    group?: string;
    emaktabId?: string;
    status?: string;
  };
  availableAssessmentIds?: string[];
}

export interface BackendStudentItem {
  id: string;
  tenantId: string;
  tenantSlug?: string;
  schoolId: string;
  classGroupId: string;
  className?: string;
  rosterCode: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName?: string;
  gender?: string;
  birthDate?: string;
  group?: string;
  emaktabId?: string;
  status?: string;
  availableAssessmentIds?: string[];
  createdAt?: string;
}

export interface BackendClassItem {
  id: string;
  schoolId: string;
  tenantId: string;
  name: string;
  grade?: number;
  gradeLevel?: number;
  shift?: number;
  academicYear: string;
  studentCount: number;
  hasGroups?: boolean;
  groupCounts?: Record<string, number>;
}

export interface BackendAssessmentItem {
  id: string;
  tenantId?: string;
  code: string;
  title: string;
  subject: string;
  subjectCode?: string;
  gradeLevel: number;
  quarter?: number;
  academicYear?: string;
  assessmentType?: string;
  durationMinutes: number;
  totalQuestions: number;
  maxScore: number;
  targetGroup?: string;
  hasPdf?: boolean;
  sourcePdfName?: string;
  sourcePdfSize?: number;
  sourcePdfUrl?: string;
  status?: string;
  questions?: Array<{
    id: string;
    order: number;
    text: string;
    points: number;
    cognitiveLevel: string;
    taskType?: string;
    correctOptionId?: string;
    subQuestions?: Array<{ id: string; label: string; prompt: string; points: number; rubric?: string }>;
    rubric?: Array<{
      id: string;
      criterion: string;
      fullScore: number;
      partialScore: number;
      zeroScore: 0;
      guideline: string;
    }>;
    options: Array<{ id: string; label?: string; text: string }>;
  }>;
}

export interface BackendAnalyticsResponse {
  tenantSlug: string;
  schoolName: string;
  totalStudents: number;
  totalAssessed: number;
  averageScore: number;
  maxScore: number;
  classComparisons: Array<{
    className: string;
    averageScore: number;
    maxPossibleScore: number;
    studentCount: number;
    participationRate: number;
  }>;
  scoreDistribution: {
    excellent: number;
    good: number;
    satisfactory: number;
    unsatisfactory: number;
    total: number;
  };
  cognitiveBreakdown: {
    knowledge: number;
    comprehension: number;
    application: number;
    analysis: number;
  };
}

