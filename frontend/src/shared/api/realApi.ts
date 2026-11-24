import { httpClient } from './httpClient';
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
  gender?: string;
  birthDate?: string;
  group?: string;
  emaktabId?: string;
  status?: string;
  availableAssessmentIds?: string[];
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

      const s = res.student;
      return {
        status: 'success',
        match: {
          rosterRecordId: s.id,
          displayName: `${s.firstName} ${s.lastName}`,
          schoolName: res.schoolName || 'Al-Xorazmiy nomidagi IT-maktab',
          className: s.className || '11-sinf',
          group: s.group || '1-guruh',
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
        group: found.group || '1-guruh',
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
      status: string;
      answers?: Record<string, string>;
    }
    const res = await httpClient.post<AttemptRes>('/attempts', {
      tenantId,
      assessmentId,
      rosterRecordId,
    });
    const now = new Date();
    const deadline = new Date(now.getTime() + 45 * 60 * 1000);
    return {
      id: res.id || `att-${Date.now()}`,
      tenantId,
      assessmentId,
      rosterRecordId,
      startedAt: res.startedAt || now.toISOString(),
      deadlineAt: deadline.toISOString(),
      status: 'in_progress',
      answers: res.answers || {},
      remainingSeconds: 45 * 60,
    };
  }

  async getAttemptById(tenantId: string, attemptId: string): Promise<AssessmentAttempt | null> {
    try {
      interface AttemptRes {
        id: string;
        assessmentId: string;
        rosterRecordId: string;
        startedAt: string;
        status: string;
        answers?: Record<string, string>;
      }
      const res = await httpClient.get<AttemptRes>(`/attempts/${attemptId}`);
      if (!res) return null;
      const now = new Date();
      const deadline = new Date(now.getTime() + 45 * 60 * 1000);
      return {
        id: res.id,
        tenantId,
        assessmentId: res.assessmentId,
        rosterRecordId: res.rosterRecordId,
        startedAt: res.startedAt,
        deadlineAt: deadline.toISOString(),
        status: (res.status === 'submitted' ? 'submitted_demo' : 'in_progress') as 'in_progress' | 'submitted_demo',
        answers: res.answers || {},
        remainingSeconds: 45 * 60,
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
    idempotencyKey?: string
  ): Promise<SubmissionReceipt> {
    interface SubmitRes {
      attemptId: string;
      receiptNumber?: string;
      submittedAt: string;
      score: number;
      maxScore: number;
      percentage: number;
      grade: string;
    }
    const res = await httpClient.post<SubmitRes>(`/attempts/${attemptId}/submit`, {
      idempotencyKey,
    });
    return {
      attemptId,
      tenantId,
      assessmentId: 'chsb-inf-11-q1',
      rosterRecordId: 'stu-current',
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
      return await httpClient.get<AssessmentResult>(`/assessments/results/attempt/${attemptId}`);
    } catch {
      return null;
    }
  }

  async getResultsByTenant(tenantId: string): Promise<AssessmentResult[]> {
    try {
      return await httpClient.get<AssessmentResult[]>(`/assessments/results/tenant/${tenantId}`);
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
        group: s.group || '1-guruh',
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
      return await httpClient.get<AssessmentResult[]>(`/assessments/results/tenant/${tenantId}`);
    } catch {
      return [];
    }
  }

  async getProfile(tenantId: string): Promise<TeacherProfile> {
    return {
      id: 'usr-tch-01',
      tenantId,
      fullName: 'Anvar Rahimov',
      title: "Oliy toifali informatika fani o'qituvchisi",
      email: 'teacher@xorazm.uz',
      phone: '+998901234567',
      assignedSchoolName: 'Muhammad al-Xorazmiy IT-maktabi',
      subjects: ['Informatika va AT', 'Sun\'iy Intellekt'],
      assignedClassIds: ['class-ax-11a', 'class-ax-11b'],
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

      const results = await httpClient.get<AssessmentResult[]>(`/assessments/results/tenant/${tenantId}`);
      const studentResults = results.filter((r) => r.rosterRecordId === found.id);
      const avg =
        studentResults.length > 0
          ? Math.round(
              studentResults.reduce((acc, curr) => acc + (curr.score || 0), 0) /
                studentResults.length
            )
          : 34;

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
          availableAssessmentIds: found.availableAssessmentIds || ['chsb-inf-11-q1'],
        },
        className: found.className || '11-sinf',
        schoolName: 'Muhammad al-Xorazmiy nomidagi IT-maktab',
        results: studentResults,
        attendanceRate: 98,
        averageScore: avg,
      };
    } catch {
      return null;
    }
  }

  async getAssessmentDetail(
    _tenantId: string,
    assessmentId: string
  ): Promise<AssessmentDetail | null> {
    try {
      const assessment = await httpClient.get<Assessment>(`/assessments/${assessmentId}`);
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
        totalAssigned: 50,
        totalCompleted: 44,
        completionRate: 88,
        averageScore: 33.5,
        questionStats: [
          { order: 1, cognitiveLevel: '(B)', points: 2.5, correctRate: 95 },
          { order: 2, cognitiveLevel: '(B)', points: 2.5, correctRate: 92 },
          { order: 3, cognitiveLevel: '(Q)', points: 2.5, correctRate: 78 },
          { order: 4, cognitiveLevel: '(B)', points: 2.5, correctRate: 88 },
          { order: 5, cognitiveLevel: '(Q)', points: 2.5, correctRate: 72 },
          { order: 6, cognitiveLevel: '(M)', points: 2.5, correctRate: 64 },
        ],
        questions: (assessment as any).questions || [],
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
            averageAccuracy: data.cognitiveBreakdown?.knowledge || 88,
          },
          application: {
            label: "Qo'llash (Q)",
            points: 20,
            averageAccuracy: data.cognitiveBreakdown?.comprehension || 80,
          },
          reasoning: {
            label: 'Mulohaza (M)',
            points: 10,
            averageAccuracy: data.cognitiveBreakdown?.analysis || 72,
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
    return {
      id: `sch-${Date.now()}`,
      slug: input.slug,
      name: input.name,
      code: input.code,
      type: input.type,
      status: input.status,
      districtId: input.districtId,
      districtName: input.districtName,
      directorName: input.directorName,
      contactPhone: input.contactPhone,
      studentCount: 0,
      teacherCount: 0,
      createdAt: new Date().toISOString(),
    };
  }

  async getAllSchools(): Promise<SchoolRecord[]> {
    const tenants = await httpClient.get<BackendTenantItem[]>('/tenants');
    return tenants.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      code: t.code,
      type: 'specialized' as const,
      status: 'active' as const,
      districtId: 'dist-01',
      districtName: 'Yunusobod tumani',
      directorName: 'Direktor',
      contactPhone: '+998711234567',
      studentCount: 250,
      teacherCount: 20,
      createdAt: t.createdAt,
    }));
  }

  async getSchoolBySlug(slug: string): Promise<SchoolRecord | null> {
    const schools = await this.getAllSchools();
    return schools.find((s) => s.slug === slug) || null;
  }

  async createTeacher(input: TeacherInput): Promise<TeacherRecord> {
    return {
      id: `tch-${Date.now()}`,
      schoolId: input.schoolId,
      tenantSlug: input.tenantSlug,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      subject: input.subject,
      qualification: input.qualification,
      assignedClassIds: input.assignedClassIds,
      assignedClassNames: ['11-A'],
      status: input.status,
      createdAt: new Date().toISOString(),
    };
  }

  async getTeachersBySchool(_tenantSlug: string): Promise<TeacherRecord[]> {
    return [
      {
        id: 'usr-tch-01',
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
        fullName: 'Anvar Rahimov',
        email: 'teacher@xorazm.uz',
        phone: '+998901234567',
        subject: 'Informatika va AT',
        qualification: 'oliy' as const,
        status: 'active' as const,
        assignedClassIds: ['class-ax-11a', 'class-ax-11b'],
        assignedClassNames: ['11-A', '11-B'],
        createdAt: '2026-11-01T08:00:00Z',
      },
    ];
  }

  async updateTeacher(id: string, updates: Partial<TeacherInput>): Promise<TeacherRecord | null> {
    return {
      id,
      schoolId: updates.schoolId || 'sch-01',
      tenantSlug: updates.tenantSlug || 'al-xorazmiy',
      fullName: updates.fullName || 'Anvar Rahimov',
      email: updates.email || 'teacher@xorazm.uz',
      phone: updates.phone || '+998901234567',
      subject: updates.subject || 'Informatika va AT',
      qualification: updates.qualification || ('oliy' as const),
      status: updates.status || ('active' as const),
      assignedClassIds: updates.assignedClassIds || [],
      assignedClassNames: ['11-A'],
      createdAt: '2026-11-01T08:00:00Z',
    };
  }

  async deleteTeacher(_id: string): Promise<boolean> {
    return true;
  }

  async createStudent(input: StudentInput): Promise<StudentRecord> {
    try {
      const payload = {
        tenantSlug: input.tenantSlug,
        schoolId: input.schoolId,
        classGroupId: input.classGroupId,
        firstName: input.firstName,
        lastName: input.lastName,
        middleName: input.middleName || undefined,
        gender: input.gender,
        birthDate: input.birthDate || '2008-05-15',
        rosterCode: input.rosterCode || undefined,
        status: input.status,
        group: input.group || '1-guruh',
        emaktabId: input.emaktabId || undefined,
      };
      const res = await httpClient.post<StudentRecord>('/students', payload);
      return res;
    } catch {
      return {
        id: input.rosterCode || `stu-${Date.now()}`,
        tenantSlug: input.tenantSlug,
        schoolId: input.schoolId,
        classGroupId: input.classGroupId,
        className: input.className,
        rosterCode: input.rosterCode || `STU-${Date.now()}`,
        fullName: `${input.lastName} ${input.firstName}`,
        firstName: input.firstName,
        lastName: input.lastName,
        middleName: input.middleName,
        gender: input.gender,
        birthDate: input.birthDate,
        status: input.status,
        createdAt: new Date().toISOString(),
      };
    }
  }

  async bulkCreateStudents(inputs: StudentInput[]): Promise<StudentRecord[]> {
    try {
      const payload = inputs.map((input) => ({
        tenantSlug: input.tenantSlug,
        schoolId: input.schoolId,
        classGroupId: input.classGroupId,
        firstName: input.firstName,
        lastName: input.lastName,
        middleName: input.middleName || undefined,
        gender: input.gender,
        birthDate: input.birthDate || '2008-05-15',
        rosterCode: input.rosterCode || undefined,
        status: input.status,
        group: input.group || '1-guruh',
        emaktabId: input.emaktabId || undefined,
      }));
      const res = await httpClient.post<StudentRecord[]>('/students/bulk', payload);
      return res;
    } catch {
      return inputs.map((input) => ({
        id: input.rosterCode || `stu-${Date.now()}`,
        tenantSlug: input.tenantSlug,
        schoolId: input.schoolId,
        classGroupId: input.classGroupId,
        className: input.className,
        rosterCode: input.rosterCode || `STU-${Date.now()}`,
        fullName: `${input.lastName} ${input.firstName}`,
        firstName: input.firstName,
        lastName: input.lastName,
        middleName: input.middleName,
        gender: input.gender,
        birthDate: input.birthDate,
        status: input.status,
        createdAt: new Date().toISOString(),
      }));
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
        birthDate: s.birthDate,
        status: (s.status === 'inactive' ? 'inactive' : 'eligible') as any,
        group: s.group || '1-guruh',
        emaktabId: s.emaktabId || null,
        createdAt: s.createdAt,
      }));
    } catch {
      return [];
    }
  }

  async updateStudent(_id: string, _updates: Partial<StudentInput>): Promise<StudentRecord | null> {
    return null;
  }

  async deleteStudent(id: string): Promise<boolean> {
    interface DeleteResponse {
      success: boolean;
      message?: string;
    }
    const res = await httpClient.delete<DeleteResponse>(`/students/${id}`);
    return res.success;
  }

  async createClassGroup(input: ClassGroupInput): Promise<ClassGroupRecord> {
    return {
      id: `class-${Date.now()}`,
      schoolId: input.schoolId,
      tenantSlug: input.tenantSlug,
      name: input.name,
      gradeLevel: input.gradeLevel,
      shift: input.shift,
      academicYear: input.academicYear,
      studentCount: 0,
      createdAt: new Date().toISOString(),
    };
  }

  async getClassGroupsBySchool(_tenantSlug: string): Promise<ClassGroupRecord[]> {
    return [];
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

