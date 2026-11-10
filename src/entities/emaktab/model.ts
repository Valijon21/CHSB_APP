import { z } from 'zod';

export const EmaktabStudentSchema = z.object({
  emaktabId: z.string().min(1),
  fullName: z.string().min(1),
  normalizedName: z.string().min(1),
  gender: z.enum(['M', 'F']).optional(),
  orderIndex: z.number().int().nonnegative(),
  className: z.string().optional(),
});

export type EmaktabStudent = z.infer<typeof EmaktabStudentSchema>;

export const CandidateStatusSchema = z.enum(['submitted', 'absent', 'disqualified']);
export type CandidateStatus = z.infer<typeof CandidateStatusSchema>;

export const AssessmentCandidateSchema = z.object({
  candidateId: z.string().min(1),
  fullName: z.string().min(1),
  normalizedName: z.string().min(1),
  score: z.number().nonnegative(),
  maxScore: z.number().positive(),
  percentage: z.number().min(0).max(100),
  submittedAt: z.string().optional(),
  status: CandidateStatusSchema,
});

export type AssessmentCandidate = z.infer<typeof AssessmentCandidateSchema>;

export const MatchStatusSchema = z.enum([
  'exact',
  'fuzzy',
  'unmatched_emaktab',
  'unmatched_chsb',
]);

export type MatchStatus = z.infer<typeof MatchStatusSchema>;

export const GradeScaleThresholdsSchema = z
  .object({
    grade5Min: z.number().min(0).max(100),
    grade4Min: z.number().min(0).max(100),
    grade3Min: z.number().min(0).max(100),
    grade2Max: z.number().min(0).max(100),
  })
  .refine(
    (t) => t.grade5Min > t.grade4Min && t.grade4Min > t.grade3Min && t.grade3Min > t.grade2Max,
    {
      message: 'Mezonlar to\'g\'ri ketma-ketlikda bo\'lishi shart: 5-baho > 4-baho > 3-baho > 2-baho',
    }
  );

export type GradeScaleThresholds = z.infer<typeof GradeScaleThresholdsSchema>;

export const DEFAULT_GRADE_THRESHOLDS: GradeScaleThresholds = {
  grade5Min: 86,
  grade4Min: 71,
  grade3Min: 56,
  grade2Max: 55,
};

export const AbsenceReasonSchema = z.enum(['sababli', 'sababsiz', 'none']);
export type AbsenceReason = z.infer<typeof AbsenceReasonSchema>;

export const StudentMatchPairSchema = z.object({
  matchId: z.string().min(1),
  emaktabStudent: EmaktabStudentSchema.optional(),
  chsbCandidate: AssessmentCandidateSchema.optional(),
  confidenceScore: z.number().min(0).max(1),
  status: MatchStatusSchema,
  manualOverride: z.boolean().default(false),
  finalGrade5: z.number().int().min(2).max(5).nullable(),
  absenceReason: AbsenceReasonSchema.optional().default('none'),
});

export type StudentMatchPair = z.infer<typeof StudentMatchPairSchema>;

export const EmaktabSyncSessionSchema = z.object({
  sessionId: z.string().min(1),
  assessmentId: z.string().min(1),
  className: z.string().min(1),
  totalEmaktabStudents: z.number().int().nonnegative(),
  matchedCount: z.number().int().nonnegative(),
  unmatchedCount: z.number().int().nonnegative(),
  pairs: z.array(StudentMatchPairSchema),
  thresholds: GradeScaleThresholdsSchema.default(DEFAULT_GRADE_THRESHOLDS),
  updatedAt: z.string(),
});

export type EmaktabSyncSession = z.infer<typeof EmaktabSyncSessionSchema>;

export const ExportFormatSchema = z.enum([
  'csv_standard',
  'clipboard_grid',
  'json_payload',
]);

export type ExportFormat = z.infer<typeof ExportFormatSchema>;

