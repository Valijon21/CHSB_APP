import { z } from 'zod';

export const AssessmentResultSchema = z.object({
  attemptId: z.string(),
  tenantId: z.string(),
  assessmentId: z.string(),
  rosterRecordId: z.string(),
  studentName: z.string(),
  className: z.string(),
  totalQuestions: z.number().int(),
  answeredQuestions: z.number().int(),
  score: z.number().nonnegative(),
  maxScore: z.number().positive(),
  percentage: z.number().min(0).max(100),
  status: z.enum(['provisional_demo', 'verified']),
  verifiedByTeacher: z.boolean().default(false),
  submittedAt: z.string(),
  teacherNote: z.string().optional(),
});

export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;

