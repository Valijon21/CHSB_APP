import { httpClient } from './httpClient';
import { logger } from '../services/logger/LoggerService';
import type { TenantRepository } from './repositories/TenantRepository';
import type { RosterRepository } from './repositories/RosterRepository';
import type { AssessmentRepository } from './repositories/AssessmentRepository';
import type { AttemptRepository } from './repositories/AttemptRepository';
import type { ResultRepository } from './repositories/ResultRepository';
import type { TeacherRepository } from './repositories/TeacherRepository';
import type { RegionalRepository } from './repositories/RegionalRepository';
import type { OrganizationRepository } from './repositories/OrganizationRepository';

import type { Tenant, TenantPublicContext } from '../../entities/tenant/model';
import type {
  RosterLookupRequest,
  RosterLookupResult,
  StudentRosterRecord,
} from '../../entities/roster/model';
import type { Assessment, AssessmentSummary, CreateAssessmentInput } from '../../entities/assessment/model';
import type { AnswerDraft, AssessmentAttempt, SubmissionReceipt } from '../../entities/attempt/model';
import type { AssessmentResult } from '../../entities/result/model';
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
} from '../../entities/teacher/model';
import type { ClassGroup } from '../../entities/class-group/model';
import type {
  DistrictSummary,
  SchoolRankingItem,
  IntegrityAnomaly,
  RegionalOverviewStats,
} from '../../entities/regional/model';
import type {
  SchoolInput,
  SchoolRecord,
  TeacherInput,
  TeacherRecord,
  StudentInput,
  StudentRecord,
  ClassGroupInput,
  ClassGroupRecord,
  SubjectInput,
  SubjectRecord,
} from '../../entities/organization/model';

interface BackendTenantContext {
  tenantId: string;
  tenantSlug: string;
  schoolName: string;
  schoolCode: string;
  region: string;
  district: string;
  activeAcademicYear: string;
}

interface BackendTenantItem {
  id: string;
  slug: string;
  name: string;
  code: string;
  region: string;
  activeYear: string;
  createdAt: string;
}

interface BackendVerifyResponse {
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

interface BackendStudentItem {
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

interface BackendClassItem {
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

interface BackendAssessmentItem {
  id: string;
  code: string;
  title: string;
  subject: string;
  gradeLevel: number;
  durationMinutes: number;
  totalQuestions: number;
  maxScore: number;
  targetGroup?: string;
  questions?: Array<{
    id: string;
    order: number;
    text: string;
    points: number;
    cognitiveLevel: string;
    options: Array<{ id: string; text: string }>;
  }>;
}

interface BackendAnalyticsResponse {
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

const DEFAULT_TENANT_CONTEXTS: Record<string, TenantPublicContext> = {
  'al-xorazmiy': {
    tenantId: 'tenant-al-xorazmiy',
    tenantSlug: 'al-xorazmiy',
    displayName: 'Muhammad al-Xorazmiy nomidagi ixtisoslashtirilgan IT-maktab',
    status: 'active',
  },
  'temurbeklar-maktabi': {
    tenantId: 'tenant-temurbeklar',
    tenantSlug: 'temurbeklar-maktabi',
    displayName: 'Temurbeklar Maktabi Harbiy-Akademik Litseyi',
    status: 'active',
  },
};

export class RealTenantRepository implements TenantRepository {
  async getPublicContextBySlug(slug: string): Promise<TenantPublicContext | null> {
    try {
      const data = await httpClient.get<BackendTenantContext>(`/tenants/${slug}/context`);
      return {
        tenantId: data.tenantId,
        tenantSlug: data.tenantSlug,
        displayName: data.schoolName,
        status: 'active',
      };
    } catch {
      return DEFAULT_TENANT_CONTEXTS[slug] || null;
    }
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    try {
      const data = await httpClient.get<BackendTenantItem>(`/tenants/${id}`);
      return {
        id: data.id,
        slug: data.slug,
        name: data.name,
        status: 'active',
        features: ['assessments', 'proctoring', 'analytics'],
        branding: {
          primaryColor: '#059669',
        },
      };
    } catch {
      return null;
    }
  }

  async getAllTenants(): Promise<Tenant[]> {
    try {
      const list = await httpClient.get<BackendTenantItem[]>('/tenants');
      return list.map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        status: 'active',
        features: ['assessments', 'proctoring', 'analytics'],
        branding: {
          primaryColor: '#059669',
        },
      }));
    } catch {
      return [];
    }
  }
}

export class RealRosterRepository implements RosterRepository {
  async lookup(request: RosterLookupRequest): Promise<RosterLookupResult> {
    try {
      const res = await httpClient.post<BackendVerifyResponse>('/auth/admission/verify', {
        tenantSlug: request.tenantSlug,
        rosterCode: request.rosterCode.trim().toUpperCase(),
      });

      if (!res.success || !res.student) {
        return {
          status: 'not_found',
          message: res.message || "Ma'lumotlar mos kelmadi.",
        };
      }

      if (res.sessionToken && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('chsb_student_session_token', res.sessionToken);
      }

      const s = res.student;
      return {
        status: 'success',
        match: {
          rosterRecordId: s.id,
          displayName: `${s.firstName} ${s.lastName}`,
          schoolName: res.schoolName || 'Al-Xorazmiy nomidagi IT-maktab',
          className: s.className || '11-sinf',
          group: s.group || null,
          emaktabId: s.emaktabId || null,
          eligibilityStatus: (s.status === 'inactive' ? 'inactive' : 'eligible') as 'eligible' | 'inactive',
          availableAssessmentIds: res.availableAssessmentIds || ['chsb-inf-11-q1'],
        },
      };
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "O'quvchi topilmadi.";
      return {
        status: 'not_found',
        message: msg,
      };
    }
  }

  async getRosterRecordById(tenantId: string, recordId: string): Promise<StudentRosterRecord | null> {
    try {
      const students = await httpClient.get<BackendStudentItem[]>('/students', { params: { tenantSlug: tenantId } });
      const found = students.find((s) => s.id === recordId || s.rosterCode === recordId);
      if (!found) return null;
      return {
        id: found.id,
        tenantId: found.tenantId,
        schoolId: found.schoolId,
        classGroupId: found.classGroupId,
        rosterCode: found.rosterCode,
        firstName: found.firstName,
        lastName: found.lastName,
        middleName: found.middleName,
        group: found.group || null,
        emaktabId: found.emaktabId || null,
        status: (found.status === 'inactive' ? 'inactive' : 'eligible') as 'eligible' | 'inactive',
        availableAssessmentIds: found.availableAssessmentIds || ['chsb-inf-11-q1'],
      };
    } catch {
      return null;
    }
  }

  async getRosterByClass(tenantId: string, classGroupId: string): Promise<StudentRosterRecord[]> {
    try {
      const list = await httpClient.get<BackendStudentItem[]>('/students', {
        params: { tenantSlug: tenantId, classGroupId },
      });
      return list.map((s) => ({
        id: s.id,
        tenantId: s.tenantId,
        schoolId: s.schoolId,
        classGroupId: s.classGroupId,
        rosterCode: s.rosterCode,
        firstName: s.firstName,
        lastName: s.lastName,
        middleName: s.middleName,
        status: (s.status === 'inactive' ? 'inactive' : 'eligible') as 'eligible' | 'inactive',
        availableAssessmentIds: s.availableAssessmentIds || ['chsb-inf-11-q1'],
      }));
    } catch {
      return [];
    }
  }
}

export class RealAssessmentRepository implements AssessmentRepository {
  async getAvailableAssessments(tenantId: string): Promise<AssessmentSummary[]> {
    try {
      const list = await httpClient.get<BackendAssessmentItem[]>('/assessments', { params: { tenantId } });
      return list.map((a) => ({
        id: a.id,
        tenantId: tenantId || 'tenant-al-xorazmiy',
        title: a.title,
        subject: a.subject,
        grade: a.gradeLevel || 11,
        quarter: 1,
        assessmentNumber: 1,
        durationMinutes: a.durationMinutes || 45,
        durationSeconds: (a.durationMinutes || 45) * 60,
        questionCount: a.totalQuestions || 15,
        maxScore: a.maxScore || 40,
        status: 'available' as const,
      }));
    } catch {
      return [];
    }
  }

  async getAssessmentById(_tenantId: string, assessmentId: string): Promise<Assessment | null> {
    try {
      const a = await httpClient.get<BackendAssessmentItem>(`/assessments/${assessmentId}`);
      if (!a) return null;
      return {
        id: a.id,
        tenantId: 'tenant-al-xorazmiy',
        title: a.title,
        subject: a.subject,
        grade: a.gradeLevel || 11,
        quarter: 1,
        assessmentNumber: 1,
        durationMinutes: a.durationMinutes || 45,
        durationSeconds: (a.durationMinutes || 45) * 60,
        questionCount: a.totalQuestions || 15,
        maxScore: a.maxScore || 40,
        status: 'available' as const,
        questions: (a.questions || []).map((q) => ({
          id: q.id,
          order: q.order || 1,
          cognitiveLevel: q.cognitiveLevel || '(B)',
          points: q.points || 2.5,
          blocks: [{ type: 'paragraph' as const, text: q.text || '' }],
          options: q.options || [],
        })),
      };
    } catch {
      return null;
    }
  }
}

export class RealAttemptRepository implements AttemptRepository {
  async createAttempt(
    tenantId: string,
    assessmentId: string,
    rosterRecordId: string
  ): Promise<AssessmentAttempt> {
    interface AttemptRes {
      id: string;
      assessmentId: string;
      rosterRecordId: string;
      startedAt: string;
      deadlineAt?: string;
      remainingSeconds?: number;
      durationMinutes?: number;
      status: string;
      answers?: Record<string, string>;
    }
    const res = await httpClient.post<AttemptRes>('/attempts', {
      tenantId,
      assessmentId,
      rosterRecordId,
    });
    const now = new Date();
    const durationMins = res.durationMinutes || 40;
    const deadline = res.deadlineAt || new Date(now.getTime() + durationMins * 60 * 1000).toISOString();
    return {
      id: res.id || `att-${Date.now()}`,
      tenantId,
      assessmentId: res.assessmentId || assessmentId,
      rosterRecordId: res.rosterRecordId || rosterRecordId,
      startedAt: res.startedAt || now.toISOString(),
      deadlineAt: deadline,
      status: res.status === 'submitted' ? 'submitted_demo' : 'in_progress',
      answers: res.answers || {},
      remainingSeconds: res.remainingSeconds ?? durationMins * 60,
    };
  }

  async getAttemptById(tenantId: string, attemptId: string): Promise<AssessmentAttempt | null> {
    try {
      interface AttemptRes {
        id: string;
        assessmentId: string;
        rosterRecordId: string;
        startedAt: string;
        deadlineAt?: string;
        remainingSeconds?: number;
        durationMinutes?: number;
        status: string;
        answers?: Record<string, string>;
      }
      const res = await httpClient.get<AttemptRes>(`/attempts/${attemptId}`);
      if (!res) return null;
      const now = new Date();
      const durationMins = res.durationMinutes || 40;
      const deadline = res.deadlineAt || new Date(now.getTime() + durationMins * 60 * 1000).toISOString();
      return {
        id: res.id,
        tenantId,
        assessmentId: res.assessmentId,
        rosterRecordId: res.rosterRecordId,
        startedAt: res.startedAt,
        deadlineAt: deadline,
        status: (res.status === 'submitted' ? 'submitted_demo' : 'in_progress') as 'in_progress' | 'submitted_demo',
        answers: res.answers || {},
        remainingSeconds: res.remainingSeconds ?? durationMins * 60,
      };
    } catch {
      return null;
    }
  }

  async saveDraft(_tenantId: string, attemptId: string, answers: AnswerDraft): Promise<void> {
    await httpClient.post(`/attempts/${attemptId}/draft`, { answers });
  }

  async submitAttempt(
    tenantId: string,
    attemptId: string,
    idempotencyKey?: string,
    answers?: AnswerDraft
  ): Promise<SubmissionReceipt> {
    interface SubmitRes {
      attemptId: string;
      assessmentId?: string;
      studentId?: string;
      receiptNumber?: string;
      submittedAt: string;
      score: number;
      maxScore: number;
      percentage: number;
      grade: string;
    }
    const res = await httpClient.post<SubmitRes>(`/attempts/${attemptId}/submit`, {
      idempotencyKey,
      answers,
    });
    return {
      attemptId,
      tenantId,
      assessmentId: res.assessmentId || '',
      rosterRecordId: res.studentId || '',
      status: 'received',
      submittedAt: res.submittedAt || new Date().toISOString(),
      message: "Imtihon topshirig'i muvaffaqiyatli qabul qilindi.",
      receiptCode: res.receiptNumber || `RCP-${attemptId.slice(0, 8).toUpperCase()}`,
    };
  }
}

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

export class RealTeacherRepository implements TeacherRepository {
  async getClasses(tenantId: string): Promise<ClassGroup[]> {
    try {
      const list = await httpClient.get<BackendClassItem[]>('/classes', { params: { tenantSlug: tenantId } });
      return list.map((c) => ({
        id: c.id,
        schoolId: c.schoolId,
        tenantId: c.tenantId,
        name: c.name,
        grade: c.grade || c.gradeLevel || 11,
        academicYear: c.academicYear,
        studentCount: c.studentCount,
        hasGroups: c.hasGroups ?? true,
        groupCounts: c.groupCounts,
      }));
    } catch {
      return [];
    }
  }

  async getRoster(tenantId: string, classGroupId?: string): Promise<StudentRosterRecord[]> {
    try {
      const list = await httpClient.get<BackendStudentItem[]>('/students', {
        params: { tenantSlug: tenantId, classGroupId },
      });
      return list.map((s) => ({
        id: s.id,
        tenantId: s.tenantId,
        schoolId: s.schoolId,
        classGroupId: s.classGroupId,
        rosterCode: s.rosterCode,
        firstName: s.firstName,
        lastName: s.lastName,
        middleName: s.middleName,
        group: s.group || null,
        emaktabId: s.emaktabId || null,
        status: (s.status === 'inactive' ? 'inactive' : 'eligible') as 'eligible' | 'inactive',
        availableAssessmentIds: s.availableAssessmentIds || ['chsb-inf-11-q1'],
      }));
    } catch {
      return [];
    }
  }

  async getAssessments(tenantId: string): Promise<AssessmentSummary[]> {
    try {
      const list = await httpClient.get<BackendAssessmentItem[]>('/assessments', { params: { tenantId } });
      return list.map((a) => ({
        id: a.id,
        tenantId: tenantId || 'tenant-al-xorazmiy',
        title: a.title,
        subject: a.subject,
        grade: a.gradeLevel || 11,
        quarter: 1,
        assessmentNumber: 1,
        durationMinutes: a.durationMinutes || 45,
        durationSeconds: (a.durationMinutes || 45) * 60,
        questionCount: a.totalQuestions || 15,
        maxScore: a.maxScore || 40,
        targetGroup: a.targetGroup || 'all',
        status: 'available' as const,
      }));
    } catch {
      return [];
    }
  }

  async createAssessment(input: CreateAssessmentInput): Promise<AssessmentSummary> {
    const res = await httpClient.post<BackendAssessmentItem>('/assessments', input);
    return {
      id: res.id,
      tenantId: 'tenant-al-xorazmiy',
      title: res.title,
      subject: res.subject,
      grade: res.gradeLevel || input.gradeLevel,
      quarter: input.quarter || 1,
      assessmentNumber: 1,
      durationMinutes: res.durationMinutes || input.durationMinutes,
      durationSeconds: (res.durationMinutes || input.durationMinutes) * 60,
      questionCount: res.totalQuestions || input.totalQuestions,
      maxScore: res.maxScore || input.maxScore,
      targetGroup: res.targetGroup || input.targetGroup || 'all',
      status: 'available' as const,
    };
  }

  async getResults(tenantId: string): Promise<AssessmentResult[]> {
    try {
      return await httpClient.get<AssessmentResult[]>(`/results/tenant/${tenantId}`);
    } catch {
      return [];
    }
  }

  async gradeResult(attemptId: string, input: GradeResultInput): Promise<AssessmentResult> {
    return await httpClient.patch<AssessmentResult>(`/assessments/results/${attemptId}/grade`, {
      score: input.score,
      rubricScores: input.rubricScores,
      feedback: input.feedback,
      verifiedByTeacher: input.verifiedByTeacher ?? true,
    });
  }

  async getQuarterGradebook(
    tenantId: string,
    options?: { classGroupId?: string; subjectCode?: string; quarter?: number; academicYear?: string }
  ): Promise<QuarterGradebookResponse> {
    return await httpClient.get<QuarterGradebookResponse>('/gradebook/quarter', {
      params: {
        tenantId,
        classGroupId: options?.classGroupId,
        subjectCode: options?.subjectCode,
        quarter: options?.quarter ?? 1,
        academicYear: options?.academicYear ?? '2026-2027',
      },
    });
  }

  async saveFormativeScore(input: FormativeScoreInput): Promise<{ totalScore: number }> {
    return await httpClient.post<{ totalScore: number }>('/gradebook/formative', input);
  }

  async getProfile(tenantId: string): Promise<TeacherProfile> {
    interface AuthMePayload {
      id: string;
      tenantId: string;
      schoolName?: string;
      username: string;
      fullName: string;
      role: string;
      email?: string;
    }
    const [me, classes] = await Promise.all([
      httpClient.get<AuthMePayload>('/auth/me'),
      this.getClasses(tenantId).catch(() => [] as ClassGroup[]),
    ]);
    return {
      id: me.id,
      tenantId: me.tenantId || tenantId,
      fullName: me.fullName,
      title: me.role === 'SCHOOL_ADMIN' ? 'Maktab ma’muri' : "Fan o'qituvchisi",
      email: me.email || `${me.username}@chsb.uz`,
      phone: '+998901234567',
      assignedSchoolName: me.schoolName || 'Ta’lim muassasasi',
      subjects: ['Informatika va AT'],
      assignedClassIds: classes.map((c) => c.id),
    };
  }

  async getClassDetail(_tenantId: string, classId: string): Promise<ClassDetail | null> {
    try {
      return await httpClient.get<ClassDetail>(`/classes/${classId}`);
    } catch {
      return null;
    }
  }

  async getStudentDetail(tenantId: string, studentId: string): Promise<StudentDetail | null> {
    try {
      const students = await httpClient.get<BackendStudentItem[]>('/students', { params: { tenantSlug: tenantId } });
      const found = students.find((s) => s.id === studentId || s.rosterCode === studentId);
      if (!found) return null;

      const results = await httpClient.get<AssessmentResult[]>(`/results/tenant/${tenantId}`);
      const studentResults = results.filter((r) => r.rosterRecordId === found.id);
      const avg =
        studentResults.length > 0
          ? Math.round(
              studentResults.reduce((acc, curr) => acc + (curr.score || 0), 0) /
                studentResults.length
            )
          : 0;

      return {
        roster: {
          id: found.id,
          tenantId: found.tenantId,
          schoolId: found.schoolId,
          classGroupId: found.classGroupId,
          rosterCode: found.rosterCode,
          firstName: found.firstName,
          lastName: found.lastName,
          middleName: found.middleName,
          status: (found.status === 'inactive' ? 'inactive' : 'eligible') as 'eligible' | 'inactive',
          availableAssessmentIds: found.availableAssessmentIds || [],
        },
        className: found.className || '11-sinf',
        schoolName: "Ta'lim muassasasi",
        results: studentResults,
        attendanceRate: 100,
        averageScore: avg,
      };
    } catch {
      return null;
    }
  }

  async getAssessmentDetail(
    tenantId: string,
    assessmentId: string
  ): Promise<AssessmentDetail | null> {
    try {
      interface StatsPayload {
        totalAssigned: number;
        totalCompleted: number;
        completionRate: number;
        averageScore: number;
        questionStats: Array<{ order: number; cognitiveLevel: string; points: number; correctRate: number }>;
      }
      const [assessment, stats] = await Promise.all([
        httpClient.get<Assessment>(`/assessments/${assessmentId}`),
        httpClient
          .get<StatsPayload>(`/assessments/${assessmentId}/stats`, { params: { tenantId } })
          .catch(() => ({
            totalAssigned: 0,
            totalCompleted: 0,
            completionRate: 0,
            averageScore: 0,
            questionStats: [],
          })),
      ]);
      if (!assessment) return null;

      return {
        summary: {
          id: assessment.id,
          tenantId: assessment.tenantId,
          title: assessment.title,
          subject: assessment.subject,
          grade: assessment.grade,
          quarter: assessment.quarter,
          assessmentNumber: assessment.assessmentNumber,
          durationMinutes: assessment.durationMinutes,
          durationSeconds: assessment.durationSeconds,
          questionCount: assessment.questionCount,
          maxScore: assessment.maxScore,
          status: assessment.status,
        },
        totalAssigned: stats.totalAssigned,
        totalCompleted: stats.totalCompleted,
        completionRate: stats.completionRate,
        averageScore: stats.averageScore,
        questionStats: stats.questionStats,
        questions: (assessment as unknown as { questions?: AssessmentDetail['questions'] }).questions || [],
      };
    } catch {
      return null;
    }
  }

  async getAnalytics(tenantId: string): Promise<AnalyticsData> {
    try {
      const data = await httpClient.get<BackendAnalyticsResponse>(`/analytics/${tenantId}`);
      return {
        classComparisons: data.classComparisons || [],
        scoreDistribution: {
          excellent: data.scoreDistribution?.excellent || 0,
          good: data.scoreDistribution?.good || 0,
          satisfactory: data.scoreDistribution?.satisfactory || 0,
          needsImprovement: data.scoreDistribution?.unsatisfactory || 0,
        },
        cognitiveBreakdown: {
          knowledge: {
            label: 'Bilish (B)',
            points: 10,
            averageAccuracy: data.cognitiveBreakdown?.knowledge ?? 0,
          },
          application: {
            label: "Qo'llash (Q)",
            points: 20,
            averageAccuracy: data.cognitiveBreakdown?.application ?? data.cognitiveBreakdown?.comprehension ?? 0,
          },
          reasoning: {
            label: 'Mulohaza (M)',
            points: 10,
            averageAccuracy: data.cognitiveBreakdown?.analysis ?? 0,
          },
        },
      };
    } catch {
      return {
        classComparisons: [],
        scoreDistribution: { excellent: 0, good: 0, satisfactory: 0, needsImprovement: 0 },
        cognitiveBreakdown: {
          knowledge: { label: 'Bilish (B)', points: 10, averageAccuracy: 0 },
          application: { label: "Qo'llash (Q)", points: 20, averageAccuracy: 0 },
          reasoning: { label: 'Mulohaza (M)', points: 10, averageAccuracy: 0 },
        },
      };
    }
  }

  async generateReportData(
    tenantId: string,
    _options?: { classGroupId?: string; assessmentId?: string }
  ): Promise<ReportItem[]> {
    try {
      interface ResultPayload {
        studentName?: string;
        className?: string;
        studentId?: string;
        assessmentId?: string;
        assessmentTitle?: string;
        score: number;
        maxScore?: number;
        percentage: number;
        grade: string;
        submittedAt: string;
        status: string;
      }
      const results = await httpClient.get<ResultPayload[]>(`/results/tenant/${tenantId}`);
      return results.map((r) => ({
        studentName: r.studentName || "O'quvchi",
        className: r.className || '11-sinf',
        rosterCode: r.studentId?.slice(0, 8) || 'STU-0001',
        assessmentTitle: r.assessmentTitle || 'CHSB Choraklik Baholash',
        score: r.score,
        maxScore: r.maxScore || 40,
        percentage: r.percentage,
        grade: r.grade,
        submittedAt: r.submittedAt,
        status: (r.status === 'flagged' ? 'flagged' : 'verified') as 'verified' | 'flagged',
      }));
    } catch {
      return [];
    }
  }
}

export class RealRegionalRepository implements RegionalRepository {
  async getDistricts(): Promise<DistrictSummary[]> {
    return httpClient.get<DistrictSummary[]>('/regional/districts');
  }

  async getDistrictById(id: string): Promise<DistrictSummary | null> {
    try {
      return await httpClient.get<DistrictSummary>(`/regional/districts/${id}`);
    } catch {
      return null;
    }
  }

  async getSchoolRankings(districtId?: string): Promise<SchoolRankingItem[]> {
    return httpClient.get<SchoolRankingItem[]>('/regional/rankings', {
      params: { districtId },
    });
  }

  async getAnomalies(districtId?: string): Promise<IntegrityAnomaly[]> {
    return httpClient.get<IntegrityAnomaly[]>('/regional/anomalies', {
      params: { districtId },
    });
  }

  async getRegionalOverview(): Promise<RegionalOverviewStats> {
    return httpClient.get<RegionalOverviewStats>('/regional/overview');
  }
}

export class RealOrganizationRepository implements OrganizationRepository {
  async createSchool(input: SchoolInput): Promise<SchoolRecord> {
    return await httpClient.post<SchoolRecord>('/schools', input);
  }

  async getAllSchools(): Promise<SchoolRecord[]> {
    return await httpClient.get<SchoolRecord[]>('/schools');
  }

  async getSchoolBySlug(slug: string): Promise<SchoolRecord | null> {
    const schools = await this.getAllSchools();
    return schools.find((s) => s.slug === slug) || null;
  }

  async createTeacher(input: TeacherInput): Promise<TeacherRecord> {
    return await httpClient.post<TeacherRecord>('/teachers', input);
  }

  async getTeachersBySchool(tenantSlug: string): Promise<TeacherRecord[]> {
    return await httpClient.get<TeacherRecord[]>('/teachers', {
      params: { tenantSlug },
    });
  }

  async updateTeacher(id: string, updates: Partial<TeacherInput>): Promise<TeacherRecord | null> {
    return await httpClient.patch<TeacherRecord>(`/teachers/${id}`, updates);
  }

  async deleteTeacher(id: string): Promise<boolean> {
    const res = await httpClient.delete<{ success: boolean }>(`/teachers/${id}`);
    return Boolean(res.success);
  }

  async createStudent(input: StudentInput): Promise<StudentRecord> {
    try {
      const payload = {
        tenantSlug: input.tenantSlug,
        schoolId: input.schoolId,
        classGroupId: input.classGroupId,
        className: input.className || undefined,
        firstName: input.firstName,
        lastName: input.lastName,
        middleName: input.middleName || undefined,
        gender: input.gender,
        birthDate: input.birthDate || '2008-05-15',
        rosterCode: input.rosterCode || undefined,
        status: input.status,
        group: input.group || null,
        emaktabId: input.emaktabId || undefined,
      };
      const res = await httpClient.post<StudentRecord>('/students', payload);
      return res;
    } catch (err) {
      logger.error('Failed to create student', { err, input });
      throw err;
    }
  }

  async bulkCreateStudents(inputs: StudentInput[]): Promise<StudentRecord[]> {
    try {
      const payload = inputs.map((input) => ({
        tenantSlug: input.tenantSlug,
        schoolId: input.schoolId,
        classGroupId: input.classGroupId,
        className: input.className || undefined,
        firstName: input.firstName,
        lastName: input.lastName,
        middleName: input.middleName || undefined,
        gender: input.gender,
        birthDate: input.birthDate || '2008-05-15',
        rosterCode: input.rosterCode || undefined,
        status: input.status,
        group: input.group || null,
        emaktabId: input.emaktabId || undefined,
      }));
      const res = await httpClient.post<StudentRecord[]>('/students/bulk', payload);
      return res;
    } catch (err) {
      logger.error('Failed to bulk create students', { err, count: inputs.length });
      throw err;
    }
  }

  async getStudentsBySchool(tenantSlug: string, classGroupId?: string): Promise<StudentRecord[]> {
    try {
      const list = await httpClient.get<BackendStudentItem[]>('/students', {
        params: { tenantSlug, classGroupId },
      });
      return list.map((s) => ({
        id: s.id,
        tenantSlug: s.tenantSlug || tenantSlug,
        schoolId: s.schoolId,
        classGroupId: s.classGroupId,
        className: s.className || '',
        rosterCode: s.rosterCode,
        fullName: s.fullName || `${s.lastName} ${s.firstName}`,
        firstName: s.firstName,
        lastName: s.lastName,
        middleName: s.middleName,
        gender: (s.gender === 'F' ? 'F' : 'M') as any,
        birthDate: s.birthDate || '2008-05-15',
        status: (s.status === 'inactive' ? 'inactive' : 'eligible') as any,
        group: s.group || null,
        emaktabId: s.emaktabId || undefined,
        createdAt: s.createdAt || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }

  async updateStudent(id: string, updates: Partial<StudentInput>): Promise<StudentRecord | null> {
    return await httpClient.patch<StudentRecord>(`/students/${id}`, updates);
  }

  async deleteStudent(id: string): Promise<boolean> {
    interface DeleteResponse {
      success: boolean;
      message?: string;
    }
    const res = await httpClient.delete<DeleteResponse>(`/students/${id}`);
    return res.success;
  }

  async deleteClassStudents(tenantSlug: string, classGroupId: string): Promise<number> {
    interface DeleteResponse {
      success: boolean;
      deletedCount: number;
      message?: string;
    }
    const res = await httpClient.delete<DeleteResponse>(
      `/students?tenantSlug=${encodeURIComponent(tenantSlug)}&classGroupId=${encodeURIComponent(classGroupId)}`
    );
    return res.deletedCount || 0;
  }

  async bulkDeleteStudents(studentIds: string[]): Promise<number> {
    interface DeleteResponse {
      success: boolean;
      deletedCount: number;
      message?: string;
    }
    const res = await httpClient.post<DeleteResponse>('/students/bulk-delete', { studentIds });
    return res.deletedCount || 0;
  }

  async createClassGroup(input: ClassGroupInput): Promise<ClassGroupRecord> {
    try {
      const res = await httpClient.post<ClassGroupRecord>('/classes', input);
      return res;
    } catch (err) {
      logger.error('Failed to create class group', { err, input });
      throw err;
    }
  }

  async getClassGroupsBySchool(tenantSlug: string): Promise<ClassGroupRecord[]> {
    try {
      return await httpClient.get<ClassGroupRecord[]>(`/classes?tenantSlug=${encodeURIComponent(tenantSlug)}`);
    } catch {
      return [];
    }
  }

  async getSubjects(tenantSlug: string): Promise<SubjectRecord[]> {
    return httpClient.get<SubjectRecord[]>(`/subjects?tenantSlug=${encodeURIComponent(tenantSlug)}`);
  }

  async createSubject(input: SubjectInput): Promise<SubjectRecord> {
    return httpClient.post<SubjectRecord>('/subjects', input);
  }

  async deleteSubject(id: string): Promise<boolean> {
    interface DeleteResponse {
      success: boolean;
      message?: string;
    }
    const res = await httpClient.delete<DeleteResponse>(`/subjects/${id}`);
    return res.success;
  }
}

