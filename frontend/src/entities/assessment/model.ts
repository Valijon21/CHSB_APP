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
  id: z.string(), // 'A' | 'B' | 'C' | 'D' or 'opt-a', 'opt-b', etc.
  label: z.string().optional(),
  text: z.string(),
});

export type QuestionOption = z.infer<typeof QuestionOptionSchema>;

export const SubQuestionItemSchema = z.object({
  id: z.string(),
  label: z.string(), // e.g. 'a)', 'b)', 'c)', 'd)'
  prompt: z.string(),
  points: z.number().positive(),
  rubric: z.string().optional(),
});

export type SubQuestionItem = z.infer<typeof SubQuestionItemSchema>;

export const RubricCriterionSchema = z.object({
  id: z.string(),
  criterion: z.string(),
  fullScore: z.number(),
  partialScore: z.number(),
  zeroScore: z.literal(0),
  guideline: z.string(),
});

export type RubricCriterion = z.infer<typeof RubricCriterionSchema>;

export const TableTemplateSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(
    z.object({
      label: z.string(),
      cells: z.array(
        z.object({
          key: z.string(),
          placeholder: z.string().optional(),
        })
      ),
    })
  ),
});

export type TableTemplate = z.infer<typeof TableTemplateSchema>;

export const QuestionSchema = z.object({
  id: z.string(),
  order: z.number().int().positive(),
  cognitiveLevel: z.string(), // e.g. "(B)", "(Q)", "(M)"
  points: z.number().positive(),
  blocks: z.array(QuestionBlockSchema),
  options: z.array(QuestionOptionSchema),
  taskType: z.enum(['multiple_choice', 'subquestions', 'table_completion', 'case_study', 'open_text']).optional(),
  subQuestions: z.array(SubQuestionItemSchema).optional(),
  tableData: TableTemplateSchema.optional(),
  rubricCriteria: z.array(RubricCriterionSchema).optional(),
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
  targetGroup: z.string().optional(),
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
  targetGroup?: string;
  code?: string;
  questions?: Array<{
    prompt: string;
    options: Array<{ id: string; label: string; text: string }>;
    correctOptionId: string;
    points?: number;
    bloomLevel?: string;
    taskType?: 'multiple_choice' | 'subquestions' | 'table_completion' | 'case_study' | 'open_text';
    subQuestions?: Array<{ id: string; label: string; prompt: string; points: number; rubric?: string }>;
    rubric?: string;
    sourceExcerpt?: string;
  }>;
}


