import type { RegionalRepository } from '@/shared/api/repositories/RegionalRepository';
import type {
  DistrictSummary,
  SchoolRankingItem,
  IntegrityAnomaly,
  RegionalOverviewStats,
} from '@/entities/regional/model';
import {
  mockDistricts,
  mockSchoolRankings,
  mockIntegrityAnomalies,
  mockRegionalOverview,
} from '../fixtures/regionalFixtures';

export class MockRegionalRepository implements RegionalRepository {
  private latencyMs: number;

  constructor(latencyMs = 0) {
    this.latencyMs = latencyMs;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }

  async getDistricts(): Promise<DistrictSummary[]> {
    await this.delay();
    return [...mockDistricts];
  }

  async getDistrictById(id: string): Promise<DistrictSummary | null> {
    await this.delay();
    const found = mockDistricts.find((d) => d.id === id);
    return found ? { ...found } : null;
  }

  async getSchoolRankings(districtId?: string): Promise<SchoolRankingItem[]> {
    await this.delay();
    if (!districtId || districtId === 'all') {
      return [...mockSchoolRankings];
    }
    return mockSchoolRankings.filter((s) => s.districtId === districtId);
  }

  async getAnomalies(districtId?: string): Promise<IntegrityAnomaly[]> {
    await this.delay();
    if (!districtId || districtId === 'all') {
      return [...mockIntegrityAnomalies];
    }
    return mockIntegrityAnomalies.filter((a) =>
      a.districtName.toLowerCase().includes(districtId.toLowerCase())
    );
  }

  async getRegionalOverview(): Promise<RegionalOverviewStats> {
    await this.delay();
    return { ...mockRegionalOverview };
  }
}

