import { z } from 'zod';

export const SchoolSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  name: z.string().min(1),
  code: z.string().min(1),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type School = z.infer<typeof SchoolSchema>;
