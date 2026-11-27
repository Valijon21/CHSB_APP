import { httpClient } from '../httpClient';
import type { AttemptRepository } from '../repositories/AttemptRepository';
import type { AnswerDraft, AssessmentAttempt, SubmissionReceipt } from '../../../entities/attempt/model';

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

