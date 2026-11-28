import { httpClient } from '../httpClient';
import type { AssessmentRepository } from '../repositories/AssessmentRepository';
import type { Assessment, AssessmentSummary } from '../../../entities/assessment/model';
import type { BackendAssessmentItem } from './types';

export class RealAssessmentRepository implements AssessmentRepository {
  async getAvailableAssessments(tenantId: string): Promise<AssessmentSummary[]> {
    try {
      const list = await httpClient.get<BackendAssessmentItem[]>('/assessments', { params: { tenantId } });
      return list.map((a) => ({
        id: a.id,
        tenantId: a.tenantId || tenantId || 'tenant-al-xorazmiy',
        title: a.title,
        subject: a.subject,
        subjectCode: a.subjectCode || undefined,
        assessmentType: (a.assessmentType as AssessmentSummary['assessmentType']) || 'CHSB',
        grade: a.gradeLevel || 11,
        quarter: a.quarter || 1,
        academicYear: a.academicYear || '2026-2027',
        assessmentNumber: 1,
        durationMinutes: a.durationMinutes || 45,
        durationSeconds: (a.durationMinutes || 45) * 60,
        questionCount: a.totalQuestions || 15,
        maxScore: a.maxScore || 40,
        targetGroup: a.targetGroup || undefined,
        status: (a.status === 'closed' || a.status === 'scheduled' ? a.status : 'available') as 'available' | 'scheduled' | 'closed',
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
        tenantId: a.tenantId || _tenantId || 'tenant-al-xorazmiy',
        title: a.title,
        subject: a.subject,
        subjectCode: a.subjectCode || undefined,
        assessmentType: (a.assessmentType as Assessment['assessmentType']) || 'CHSB',
        grade: a.gradeLevel || 11,
        quarter: a.quarter || 1,
        academicYear: a.academicYear || '2026-2027',
        assessmentNumber: 1,
        durationMinutes: a.durationMinutes || 45,
        durationSeconds: (a.durationMinutes || 45) * 60,
        questionCount: a.totalQuestions || (a.questions ? a.questions.length : 15),
        maxScore: a.maxScore || 40,
        targetGroup: a.targetGroup || undefined,
        status: (a.status === 'closed' || a.status === 'scheduled' ? a.status : 'available') as 'available' | 'scheduled' | 'closed',
        questions: (a.questions || []).map((q) => ({
          id: q.id,
          order: q.order || 1,
          cognitiveLevel: q.cognitiveLevel || '(B)',
          points: q.points || 2.5,
          blocks: [{ type: 'paragraph' as const, text: q.text || '' }],
          options: q.options || [],
          taskType: (q.taskType as Assessment['questions'][number]['taskType']) || undefined,
          subQuestions: q.subQuestions || undefined,
          rubricCriteria: Array.isArray(q.rubric) ? q.rubric : undefined,
        })),
      };
    } catch {
      return null;
    }
  }
}

