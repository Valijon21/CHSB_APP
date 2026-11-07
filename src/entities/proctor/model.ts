import { z } from 'zod';

export const LiveStudentStatusSchema = z.enum([
  'active',
  'idle',
  'warning',
  'offline',
  'submitted',
]);

export type LiveStudentStatus = z.infer<typeof LiveStudentStatusSchema>;

export const LiveStudentSessionSchema = z.object({
  rosterRecordId: z.string().min(1),
  studentName: z.string().min(1),
  className: z.string().min(1),
  currentQuestion: z.number().int().min(1),
  totalQuestions: z.number().int().min(1).default(15),
  answeredCount: z.number().int().min(0),
  remainingSeconds: z.number().int().min(0),
  status: LiveStudentStatusSchema,
  violationsCount: z.number().int().min(0).default(0),
  lastActiveAt: z.string(),
  ipAddress: z.string().optional(),
});

export type LiveStudentSession = z.infer<typeof LiveStudentSessionSchema>;

export const ProctorActionTypeSchema = z.enum([
  'grant_time',
  'send_warning',
  'force_submit',
]);

export type ProctorActionType = z.infer<typeof ProctorActionTypeSchema>;

export const ProctorActionPayloadSchema = z.object({
  studentId: z.string().min(1),
  action: ProctorActionTypeSchema,
  extraSeconds: z.number().int().positive().optional(),
  warningMessage: z.string().optional(),
  reason: z.string().min(1),
  timestamp: z.string(),
});

export type ProctorActionPayload = z.infer<typeof ProctorActionPayloadSchema>;

export const LiveEventStreamItemSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string(),
  studentName: z.string().min(1),
  type: z.enum(['answer', 'warning', 'offline', 'action', 'submission']),
  message: z.string().min(1),
  severity: z.enum(['info', 'warning', 'danger']),
});

export type LiveEventStreamItem = z.infer<typeof LiveEventStreamItemSchema>;
