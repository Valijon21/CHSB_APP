import { z } from 'zod';

export const ParagraphBlockSchema = z.object({
  type: z.literal('paragraph'),
  text: z.string(),
});

export const ImageBlockSchema = z.object({
  type: z.literal('image'),
  assetId: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
});

export const TableBlockSchema = z.object({
  type: z.literal('table'),
  columns: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});

export const CodeBlockSchema = z.object({
  type: z.literal('code'),
  code: z.string(),
  language: z.string().optional(),
});

export const QuestionBlockSchema = z.discriminatedUnion('type', [
  ParagraphBlockSchema,
  ImageBlockSchema,
  TableBlockSchema,
  CodeBlockSchema,
]);

export type QuestionBlock = z.infer<typeof QuestionBlockSchema>;

export const QuestionOptionSchema = z.object({
  id: z.string(), // 'A' | 'B' | 'C' | 'D'
  text: z.string(),
});

export type QuestionOption = z.infer<typeof QuestionOptionSchema>;

export const QuestionSchema = z.object({
  id: z.string(),
  order: z.number().int().positive(),
  cognitiveLevel: z.string(), // e.g. "(B)", "(Q)", "(M)"
  points: z.number().positive(),
  blocks: z.array(QuestionBlockSchema),
  options: z.array(QuestionOptionSchema),
});

export type Question = z.infer<typeof QuestionSchema>;

export const AssessmentSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  title: z.string().min(1),
  subject: z.string().min(1),
  grade: z.number().int().min(1).max(11),
  quarter: z.number().int().min(1).max(4),
  assessmentNumber: z.number().int().min(1),
  durationMinutes: z.number().int().positive(),
  durationSeconds: z.number().int().positive(),
  questionCount: z.number().int().positive(),
  maxScore: z.number().positive(),
  status: z.enum(['scheduled', 'available', 'closed']),
  questions: z.array(QuestionSchema),
});

export type Assessment = z.infer<typeof AssessmentSchema>;

export const AssessmentSummarySchema = AssessmentSchema.omit({ questions: true });
export type AssessmentSummary = z.infer<typeof AssessmentSummarySchema>;

export interface CreateAssessmentInput {
  title: string;
  subject: string;
  gradeLevel: number;
  quarter: number;
  durationMinutes: number;
  totalQuestions: number;
  maxScore: number;
  code?: string;
}


