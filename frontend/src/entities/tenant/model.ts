import { z } from 'zod';

export const TenantSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  status: z.enum(['active', 'inactive', 'suspended']),
  branding: z
    .object({
      logoUrl: z.string().optional(),
      primaryColor: z.string().optional(),
    })
    .optional(),
  features: z.array(z.string()).default([]),
});

export type Tenant = z.infer<typeof TenantSchema>;

export const TenantPublicContextSchema = z.object({
  tenantId: z.string(),
  tenantSlug: z.string(),
  displayName: z.string(),
  status: z.enum(['active', 'inactive']),
});

export type TenantPublicContext = z.infer<typeof TenantPublicContextSchema>;

