import { z } from 'zod';

export const StudentRosterRecordSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  schoolId: z.string().min(1),
  classGroupId: z.string().min(1),
  rosterCode: z.string().min(1), // e.g. "STU-1101"
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional(),
  status: z.enum(['eligible', 'inactive', 'ambiguous']).default('eligible'),
  availableAssessmentIds: z.array(z.string()).default([]),
});

export type StudentRosterRecord = z.infer<typeof StudentRosterRecordSchema>;

export const RosterLookupRequestSchema = z.object({
  tenantSlug: z.string().min(1),
  rosterCode: z.string().min(1),
});

export type RosterLookupRequest = z.infer<typeof RosterLookupRequestSchema>;

export const RosterMatchSchema = z.object({
  rosterRecordId: z.string(),
  displayName: z.string(),
  schoolName: z.string(),
  className: z.string(),
  eligibilityStatus: z.enum(['eligible', 'inactive', 'ambiguous']),
  availableAssessmentIds: z.array(z.string()),
});

export type RosterMatch = z.infer<typeof RosterMatchSchema>;

export type RosterLookupResult =
  | { status: 'success'; match: RosterMatch }
  | { status: 'inactive'; message: string }
  | { status: 'ambiguous'; message: string }
  | { status: 'not_found'; message: string };
