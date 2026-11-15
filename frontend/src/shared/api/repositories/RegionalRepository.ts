import type {
  DistrictSummary,
  SchoolRankingItem,
  IntegrityAnomaly,
  RegionalOverviewStats,
} from '../../../entities/regional/model';

export interface RegionalRepository {
  getDistricts(): Promise<DistrictSummary[]>;
  getDistrictById(id: string): Promise<DistrictSummary | null>;
  getSchoolRankings(districtId?: string): Promise<SchoolRankingItem[]>;
  getAnomalies(districtId?: string): Promise<IntegrityAnomaly[]>;
  getRegionalOverview(): Promise<RegionalOverviewStats>;
}

