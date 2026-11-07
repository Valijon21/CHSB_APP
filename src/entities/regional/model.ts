import { z } from 'zod';

export const DistrictSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  totalSchools: z.number().int().positive(),
  totalStudents: z.number().int().positive(),
  participatedStudents: z.number().int().nonnegative(),
  participationRate: z.number().min(0).max(100),
  averageScore: z.number().min(0).max(40),
  qualityPercentage: z.number().min(0).max(100),
  flaggedAnomaliesCount: z.number().int().nonnegative().default(0),
});

export type DistrictSummary = z.infer<typeof DistrictSummarySchema>;

export const SchoolRankingItemSchema = z.object({
  id: z.string().min(1),
  districtId: z.string().min(1),
  districtName: z.string().min(1),
  schoolName: z.string().min(1),
  rank: z.number().int().positive(),
  studentCount: z.number().int().positive(),
  averageScore: z.number().min(0).max(40),
  qualityPercentage: z.number().min(0).max(100),
  status: z.enum(['top', 'average', 'needs_improvement']),
});

export type SchoolRankingItem = z.infer<typeof SchoolRankingItemSchema>;

export const AnomalySeveritySchema = z.enum(['low', 'medium', 'high']);
export type AnomalySeverity = z.infer<typeof AnomalySeveritySchema>;

export const AnomalyTypeSchema = z.enum([
  'speed_anomaly',
  'cluster_error',
  'high_violations',
]);
export type AnomalyType = z.infer<typeof AnomalyTypeSchema>;

export const IntegrityAnomalySchema = z.object({
  id: z.string().min(1),
  schoolName: z.string().min(1),
  districtName: z.string().min(1),
  className: z.string().min(1),
  subject: z.string().min(1),
  type: AnomalyTypeSchema,
  severity: AnomalySeveritySchema,
  description: z.string().min(1),
  detectedAt: z.string(),
});

export type IntegrityAnomaly = z.infer<typeof IntegrityAnomalySchema>;

export const RegionalOverviewStatsSchema = z.object({
  totalDistricts: z.number().int().positive(),
  totalSchools: z.number().int().positive(),
  totalStudents: z.number().int().positive(),
  overallParticipationRate: z.number().min(0).max(100),
  overallAverageScore: z.number().min(0).max(40),
  overallQualityRate: z.number().min(0).max(100),
  totalActiveAnomalies: z.number().int().nonnegative(),
});

export type RegionalOverviewStats = z.infer<typeof RegionalOverviewStatsSchema>;
