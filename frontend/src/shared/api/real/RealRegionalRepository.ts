import { httpClient } from '../httpClient';
import type { RegionalRepository } from '../repositories/RegionalRepository';
import type {
  DistrictSummary,
  SchoolRankingItem,
  IntegrityAnomaly,
  RegionalOverviewStats,
} from '../../../entities/regional/model';

export class RealRegionalRepository implements RegionalRepository {
  async getDistricts(): Promise<DistrictSummary[]> {
    return httpClient.get<DistrictSummary[]>('/regional/districts');
  }

  async getDistrictById(id: string): Promise<DistrictSummary | null> {
    try {
      return await httpClient.get<DistrictSummary>(`/regional/districts/${id}`);
    } catch {
      return null;
    }
  }

  async getSchoolRankings(districtId?: string): Promise<SchoolRankingItem[]> {
    return httpClient.get<SchoolRankingItem[]>('/regional/rankings', {
      params: { districtId },
    });
  }

  async getAnomalies(districtId?: string): Promise<IntegrityAnomaly[]> {
    return httpClient.get<IntegrityAnomaly[]>('/regional/anomalies', {
      params: { districtId },
    });
  }

  async getRegionalOverview(): Promise<RegionalOverviewStats> {
    return httpClient.get<RegionalOverviewStats>('/regional/overview');
  }
}

