import type { AttemptRepository } from '../../shared/api/repositories/AttemptRepository';
import type { AnswerDraft, AssessmentAttempt, SubmissionReceipt } from '../../entities/attempt/model';

export class MockAttemptRepository implements AttemptRepository {
  private attempts: Map<string, AssessmentAttempt> = new Map();
  private receipts: Map<string, SubmissionReceipt> = new Map();
  private idempotencyCache: Map<string, SubmissionReceipt> = new Map();
  private latencyMs: number;

  constructor(latencyMs = 0) {
    this.latencyMs = latencyMs;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }

  async createAttempt(
    tenantId: string,
    assessmentId: string,
    rosterRecordId: string
  ): Promise<AssessmentAttempt> {
    await this.delay();

    const id = `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date();
    const deadline = new Date(now.getTime() + 40 * 60 * 1000); // 40 minutes

    const attempt: AssessmentAttempt = {
      id,
      tenantId,
      assessmentId,
      rosterRecordId,
      status: 'in_progress',
      startedAt: now.toISOString(),
      deadlineAt: deadline.toISOString(),
      answers: {},
      remainingSeconds: 40 * 60,
    };

    this.attempts.set(id, attempt);
    return attempt;
  }

  async getAttemptById(tenantId: string, attemptId: string): Promise<AssessmentAttempt | null> {
    await this.delay();
    const attempt = this.attempts.get(attemptId);
    if (!attempt || attempt.tenantId !== tenantId) {
      return null;
    }
    return attempt;
  }

  async saveDraft(tenantId: string, attemptId: string, answers: AnswerDraft): Promise<void> {
    await this.delay();
    const attempt = this.attempts.get(attemptId);
    if (attempt && attempt.tenantId === tenantId) {
      attempt.answers = { ...attempt.answers, ...answers };
      this.attempts.set(attemptId, attempt);
    }
  }

  async submitAttempt(
    tenantId: string,
    attemptId: string,
    idempotencyKey?: string
  ): Promise<SubmissionReceipt> {
    await this.delay();

    // Idempotency check
    if (idempotencyKey && this.idempotencyCache.has(idempotencyKey)) {
      return this.idempotencyCache.get(idempotencyKey)!;
    }

    const attempt = this.attempts.get(attemptId);
    if (!attempt || attempt.tenantId !== tenantId) {
      throw new Error("Urinish topilmadi yoki muassasa mos kelmadi.");
    }

    attempt.status = 'submitted_demo';

    const receipt: SubmissionReceipt = {
      attemptId,
      tenantId,
      assessmentId: attempt.assessmentId,
      rosterRecordId: attempt.rosterRecordId,
      status: 'received_demo',
      submittedAt: new Date().toISOString(),
      message: "Demo imtihon javoblari muvaffaqiyatli qabul qilindi.",
    };

    this.receipts.set(attemptId, receipt);
    if (idempotencyKey) {
      this.idempotencyCache.set(idempotencyKey, receipt);
    }

    return receipt;
  }
}

