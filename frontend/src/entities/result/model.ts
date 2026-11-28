import { z } from 'zod';

export const AssessmentResultSchema = z.object({
  attemptId: z.string(),
  tenantId: z.string(),
  assessmentId: z.string(),
  assessmentTitle: z.string().optional(),
  assessmentType: z.string().optional(),
  quarter: z.number().int().optional(),
  rosterRecordId: z.string(),
  studentName: z.string(),
  className: z.string(),
  totalQuestions: z.number().int(),
  answeredQuestions: z.number().int(),
  score: z.number().nonnegative(),
  maxScore: z.number().positive(),
  percentage: z.number().min(0).max(100),
  grade: z.string().optional(),
  status: z.enum(['provisional_demo', 'verified', 'pending_review', 'absent']),
  verifiedByTeacher: z.boolean().default(false),
  submittedAt: z.string(),
  teacherNote: z.string().optional(),
  teacherFeedback: z.string().optional(),
  rubricScores: z.record(z.string(), z.number()).optional(),
  answers: z.record(z.string(), z.unknown()).optional(),
  absenceReason: z.string().nullable().optional(),
});

export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;

