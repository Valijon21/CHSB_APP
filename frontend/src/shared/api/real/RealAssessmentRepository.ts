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

