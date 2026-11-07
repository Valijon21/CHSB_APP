import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import {
  DistrictSummarySchema,
  SchoolRankingItemSchema,
  IntegrityAnomalySchema,
  RegionalOverviewStatsSchema,
  type DistrictSummary,
  type IntegrityAnomaly,
} from '../src/entities/regional/model';
import { api } from '../src/shared/api';
import { useRegionalStore } from '../src/features/regional-oversight/regionalStore';
import RegionalStatsCards from '../src/features/regional-oversight/components/RegionalStatsCards.vue';
import DistrictHeatmapTable from '../src/features/regional-oversight/components/DistrictHeatmapTable.vue';
import AnomalyDetectorCard from '../src/features/regional-oversight/components/AnomalyDetectorCard.vue';
import RegionalOversightView from '../src/features/regional-oversight/RegionalOversightView.vue';

describe('Direction 6: Regional & District Multi-Tier Oversight', () => {
  describe('TASK-RO.1: Regional Hierarchy Data Models & Zod Schemas', () => {
    it('validates district summary metrics with valid percentage ranges', () => {
      const validDistrict: DistrictSummary = {
        id: 'dist-urganch-sh',
        name: 'Urganch shahri',
        totalSchools: 32,
        totalStudents: 14200,
        participatedStudents: 14050,
        participationRate: 98.9,
        averageScore: 34.6,
        qualityPercentage: 78.4,
        flaggedAnomaliesCount: 2,
      };

      const parsed = DistrictSummarySchema.safeParse(validDistrict);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.name).toBe('Urganch shahri');
        expect(parsed.data.participationRate).toBe(98.9);
      }
    });

    it('rejects invalid percentages (>100 or <0)', () => {
      const invalid = {
        id: 'dist-test',
        name: 'Test',
        totalSchools: 10,
        totalStudents: 1000,
        participatedStudents: 1200,
        participationRate: 120.0, // Invalid > 100
        averageScore: 45.0, // Invalid > 40
        qualityPercentage: -5.0,
      };

      const parsed = DistrictSummarySchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it('validates school ranking items', () => {
      const rankingItem = {
        id: 'sch-1',
        districtId: 'dist-urganch-sh',
        districtName: 'Urganch shahri',
        schoolName: 'Al-Xorazmiy nomidagi IDUM',
        rank: 1,
        studentCount: 450,
        averageScore: 37.8,
        qualityPercentage: 92.5,
        status: 'top',
      };

      const parsed = SchoolRankingItemSchema.safeParse(rankingItem);
      expect(parsed.success).toBe(true);
    });

    it('validates academic integrity anomalies', () => {
      const anomaly: IntegrityAnomaly = {
        id: 'anom-1',
        schoolName: '42-sonli maktab',
        districtName: 'Xiva tumani',
        className: '11-B sinf',
        subject: 'Informatika',
        type: 'speed_anomaly',
        severity: 'high',
        description: "15 ta savol 2 daqiqa 40 soniyada 100% to'g'ri yechildi (shubhali tezlik).",
        detectedAt: new Date().toISOString(),
      };

      const parsed = IntegrityAnomalySchema.safeParse(anomaly);
      expect(parsed.success).toBe(true);
    });

    it('validates regional overview aggregates', () => {
      const overview = {
        totalDistricts: 13,
        totalSchools: 538,
        totalStudents: 198500,
        overallParticipationRate: 97.8,
        overallAverageScore: 32.7,
        overallQualityRate: 71.4,
        totalActiveAnomalies: 8,
      };

      const parsed = RegionalOverviewStatsSchema.safeParse(overview);
      expect(parsed.success).toBe(true);
    });
  });

  describe('TASK-RO.2: Regional Mock Repository & Fixtures', () => {
    it('retrieves all 13 districts of Xorazm Region', async () => {
      const districts = await api.regional.getDistricts();

      expect(districts).toHaveLength(13);
      expect(districts.map((d) => d.name)).toContain('Urganch shahri');
      expect(districts.map((d) => d.name)).toContain('Xiva shahri');
      expect(districts.map((d) => d.name)).toContain('Bog\'ot tumani');
    });

    it('retrieves a single district by its ID', async () => {
      const district = await api.regional.getDistrictById('dist-urganch-sh');

      expect(district).not.toBeNull();
      expect(district?.name).toBe('Urganch shahri');
      expect(district?.totalSchools).toBe(32);
    });

    it('retrieves school rankings optionally filtered by district', async () => {
      const allRankings = await api.regional.getSchoolRankings();
      expect(allRankings.length).toBeGreaterThan(0);

      const urganchRankings = await api.regional.getSchoolRankings('dist-urganch-sh');
      expect(urganchRankings.length).toBeGreaterThan(0);
      expect(urganchRankings.every((s) => s.districtId === 'dist-urganch-sh')).toBe(true);
    });

    it('retrieves integrity anomalies and regional overview stats', async () => {
      const anomalies = await api.regional.getAnomalies();
      expect(anomalies.length).toBeGreaterThanOrEqual(3);

      const overview = await api.regional.getRegionalOverview();
      expect(overview.totalDistricts).toBe(13);
      expect(overview.totalSchools).toBeGreaterThan(500);
      expect(overview.overallParticipationRate).toBeGreaterThan(90);
    });
  });

  describe('TASK-RO.3: Regional Oversight Store & State Actions', () => {
    beforeEach(() => {
      setActivePinia(createPinia());
    });

    it('loads regional data and populates districts and school rankings', async () => {
      const store = useRegionalStore();
      await store.loadRegionalData();

      expect(store.districts).toHaveLength(13);
      expect(store.schoolRankings.length).toBeGreaterThan(0);
      expect(store.anomalies.length).toBeGreaterThan(0);
      expect(store.overview?.totalDistricts).toBe(13);
    });

    it('sorts districts by averageScore, participation, or quality', async () => {
      const store = useRegionalStore();
      await store.loadRegionalData();

      // Initial state is sorted by score desc
      expect(store.sortedDistricts[0]!.averageScore).toBeGreaterThanOrEqual(
        store.sortedDistricts[1]!.averageScore
      );

      // Clicking 'score' again toggles to ascending
      store.setSort('score');
      expect(store.sortOrder).toBe('asc');
      expect(store.sortedDistricts[0]!.averageScore).toBeLessThanOrEqual(
        store.sortedDistricts[1]!.averageScore
      );

      // Switching to participation sets it to desc
      store.setSort('participation');
      expect(store.sortOrder).toBe('desc');
      expect(store.sortedDistricts[0]!.participationRate).toBeGreaterThanOrEqual(
        store.sortedDistricts[store.sortedDistricts.length - 1]!.participationRate
      );
    });

    it('filters rankings and anomalies by selected district', async () => {
      const store = useRegionalStore();
      await store.loadRegionalData();

      store.selectDistrict('dist-urganch-sh');
      expect(store.filteredRankings.every((s) => s.districtId === 'dist-urganch-sh')).toBe(true);

      store.selectDistrict('all');
      expect(store.filteredRankings.length).toBe(store.schoolRankings.length);
    });

    it('resolves an integrity anomaly removing it from list', async () => {
      const store = useRegionalStore();
      await store.loadRegionalData();

      const initialCount = store.anomalies.length;
      store.resolveAnomaly('anom-1');
      expect(store.anomalies.length).toBe(initialCount - 1);
      expect(store.anomalies.find((a) => a.id === 'anom-1')).toBeUndefined();
    });

    it('exports regional metrics formatted as valid CSV', async () => {
      const store = useRegionalStore();
      await store.loadRegionalData();

      const csv = store.exportRegionalCsv();
      expect(csv).toContain('Tuman / Shahar');
      expect(csv).toContain('Urganch shahri');
      expect(csv).toContain('Qamrov foizi');
    });
  });

  describe('TASK-RO.4: Visual Components (StatsCards, HeatmapTable, AnomalyCard)', () => {
    it('renders RegionalStatsCards with accurate metrics', () => {
      const overview = {
        totalDistricts: 13,
        totalSchools: 538,
        totalStudents: 184500,
        overallParticipationRate: 97.7,
        overallAverageScore: 33.1,
        overallQualityRate: 72.8,
        totalActiveAnomalies: 8,
      };

      const wrapper = mount(RegionalStatsCards, {
        props: { overview },
      });

      expect(wrapper.text()).toContain('538');
      expect(wrapper.text()).toContain('97.7%');
      expect(wrapper.text()).toContain('33.1');
      expect(wrapper.text()).toContain('72.8%');
      expect(wrapper.text()).toContain('8 ta');
    });

    it('renders DistrictHeatmapTable and emits sort and filter events', async () => {
      const districts = [
        {
          id: 'dist-1',
          name: 'Urganch shahri',
          totalSchools: 32,
          totalStudents: 14000,
          participatedStudents: 13900,
          participationRate: 99.2,
          averageScore: 35.4,
          qualityPercentage: 82.0,
          flaggedAnomaliesCount: 0,
        },
      ];

      const wrapper = mount(DistrictHeatmapTable, {
        props: {
          districts,
          selectedDistrictId: 'all',
          sortBy: 'score',
          sortOrder: 'desc',
        },
      });

      expect(wrapper.text()).toContain('Urganch shahri');
      expect(wrapper.text()).toContain('35.4');

      // Click select action
      const actionBtn = wrapper.find('button');
      await actionBtn.trigger('click');
      expect(wrapper.emitted('selectDistrict')).toBeTruthy();
      expect(wrapper.emitted('selectDistrict')![0]).toEqual(['dist-1']);
    });

    it('renders AnomalyDetectorCard and emits resolve event', async () => {
      const anomalies = [
        {
          id: 'anom-99',
          schoolName: '24-sonli maktab',
          districtName: 'Bog\'ot tumani',
          className: '11-A',
          subject: 'Informatika',
          type: 'speed_anomaly' as const,
          severity: 'high' as const,
          description: 'Shubhali tezlik',
          detectedAt: new Date().toISOString(),
        },
      ];

      const wrapper = mount(AnomalyDetectorCard, {
        props: { anomalies },
      });

      expect(wrapper.text()).toContain('Akademik Halollik');
      expect(wrapper.text()).toContain('24-sonli maktab');
      expect(wrapper.text()).toContain('Shubhali tezlik');

      const resolveBtn = wrapper.find('button');
      await resolveBtn.trigger('click');
      expect(wrapper.emitted('resolve')).toBeTruthy();
      expect(wrapper.emitted('resolve')![0]).toEqual(['anom-99']);
    });
  });

  describe('TASK-RO.5: Regional Oversight Main View & Export Integration', () => {
    beforeEach(() => {
      setActivePinia(createPinia());
    });

    it('mounts RegionalOversightView and renders all sub-components and school rankings', async () => {
      const wrapper = mount(RegionalOversightView, {
        global: {
          stubs: {
            'router-link': true,
          },
        },
      });

      // Wait for onMounted loadRegionalData
      await new Promise((resolve) => setTimeout(resolve, 50));
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Viloyat va Tuman ChSB Super-Boshqaruv Paneli');
      expect(wrapper.text()).toContain('Xorazm viloyati');
      expect(wrapper.findComponent(RegionalStatsCards).exists()).toBe(true);
      expect(wrapper.findComponent(DistrictHeatmapTable).exists()).toBe(true);
      expect(wrapper.findComponent(AnomalyDetectorCard).exists()).toBe(true);
      expect(wrapper.text()).toContain('Yetakchi Maktablar (Top-3)');
      expect(wrapper.text()).toContain('E\'tibor Talab Maktablar');
    });

    it('has working CSV and Print actions', async () => {
      const wrapper = mount(RegionalOversightView, {
        global: {
          stubs: {
            'router-link': true,
          },
        },
      });

      const buttons = wrapper.findAll('button');
      const csvBtn = buttons.find((b) => b.text().includes('Excel (CSV) Eksport'));
      const printBtn = buttons.find((b) => b.text().includes('Hisobotni Chop Etish'));

      expect(csvBtn?.exists()).toBe(true);
      expect(printBtn?.exists()).toBe(true);
    });
  });
});
