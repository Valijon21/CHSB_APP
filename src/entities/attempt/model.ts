import { z } from 'zod';

export const AnswerDraftSchema = z.record(z.string(), z.string()); // questionId -> optionId ('A', 'B', ...)
export type AnswerDraft = z.infer<typeof AnswerDraftSchema>;

export const AssessmentAttemptSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  assessmentId: z.string().min(1),
  rosterRecordId: z.string().min(1),
  status: z.enum(['in_progress', 'submitted_demo', 'graded_demo', 'expired']),
  startedAt: z.string(),
  deadlineAt: z.string(),
  answers: AnswerDraftSchema,
  remainingSeconds: z.number().int().nonnegative(),
});

export type AssessmentAttempt = z.infer<typeof AssessmentAttemptSchema>;

export const SubmissionReceiptSchema = z.object({
  attemptId: z.string(),
  tenantId: z.string(),
  assessmentId: z.string(),
  rosterRecordId: z.string(),
  status: z.enum(['received_demo', 'received']),
  submittedAt: z.string(),
  message: z.string(),
});

export type SubmissionReceipt = z.infer<typeof SubmissionReceiptSchema>;

