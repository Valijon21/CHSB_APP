import type { AnswerDraft, AssessmentAttempt, SubmissionReceipt } from '../../../entities/attempt/model';

export interface AttemptRepository {
  createAttempt(tenantId: string, assessmentId: string, rosterRecordId: string): Promise<AssessmentAttempt>;
  getAttemptById(tenantId: string, attemptId: string): Promise<AssessmentAttempt | null>;
  saveDraft(tenantId: string, attemptId: string, answers: AnswerDraft): Promise<void>;
  submitAttempt(
    tenantId: string,
    attemptId: string,
    idempotencyKey?: string,
    answers?: AnswerDraft
  ): Promise<SubmissionReceipt>;
}
