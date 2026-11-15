import { z } from 'zod';

export const ClassGroupSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  schoolId: z.string().min(1),
  name: z.string().min(1), // e.g. "11-A"
  grade: z.number().int().min(1).max(11), // 11
  academicYear: z.string().default('2026-2027'),
  studentCount: z.number().int().nonnegative().default(0),
});

export type ClassGroup = z.infer<typeof ClassGroupSchema>;

