import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  DistrictSummary,
  SchoolRankingItem,
  IntegrityAnomaly,
  RegionalOverviewStats,
} from '../../entities/regional/model';
import { api } from '../../shared/api';

export const useRegionalStore = defineStore('regional', () => {
  const districts = ref<DistrictSummary[]>([]);
  const schoolRankings = ref<SchoolRankingItem[]>([]);
  const anomalies = ref<IntegrityAnomaly[]>([]);
  const overview = ref<RegionalOverviewStats | null>(null);

  const selectedDistrictId = ref<string>('all');
  const sortBy = ref<'score' | 'participation' | 'quality'>('score');
  const sortOrder = ref<'asc' | 'desc'>('desc');
  const isLoading = ref<boolean>(false);

  async function loadRegionalData() {
    isLoading.value = true;
    try {
      const [distList, rankings, anomList, stats] = await Promise.all([
        api.regional.getDistricts(),
        api.regional.getSchoolRankings(),
        api.regional.getAnomalies(),
        api.regional.getRegionalOverview(),
      ]);

      districts.value = distList;
      schoolRankings.value = rankings;
      anomalies.value = anomList;
      overview.value = stats;
    } finally {
      isLoading.value = false;
    }
  }

  function selectDistrict(districtId: string) {
    selectedDistrictId.value = districtId;
  }

  function setSort(by: 'score' | 'participation' | 'quality') {
    if (sortBy.value === by) {
      sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc';
    } else {
      sortBy.value = by;
      sortOrder.value = 'desc';
    }
  }

  function resolveAnomaly(anomalyId: string) {
    anomalies.value = anomalies.value.filter((a) => a.id !== anomalyId);
  }

  const sortedDistricts = computed(() => {
    const list = [...districts.value];
    list.sort((a, b) => {
      let valA = a.averageScore;
      let valB = b.averageScore;

      if (sortBy.value === 'participation') {
        valA = a.participationRate;
        valB = b.participationRate;
      } else if (sortBy.value === 'quality') {
        valA = a.qualityPercentage;
        valB = b.qualityPercentage;
      }

      return sortOrder.value === 'desc' ? valB - valA : valA - valB;
    });
    return list;
  });

  const filteredRankings = computed(() => {
    if (selectedDistrictId.value === 'all') {
      return schoolRankings.value;
    }
    return schoolRankings.value.filter((s) => s.districtId === selectedDistrictId.value);
  });

  const topSchools = computed(() => {
    return filteredRankings.value.filter((s) => s.status === 'top');
  });

  const needsImprovementSchools = computed(() => {
    return filteredRankings.value.filter((s) => s.status === 'needs_improvement');
  });

  const filteredAnomalies = computed(() => {
    if (selectedDistrictId.value === 'all') {
      return anomalies.value;
    }
    const dist = districts.value.find((d) => d.id === selectedDistrictId.value);
    if (!dist) return anomalies.value;
    return anomalies.value.filter((a) =>
      a.districtName.toLowerCase().includes(dist.name.toLowerCase())
    );
  });

  function exportRegionalCsv(): string {
    const headers = [
      'Tuman / Shahar',
      'Maktablar soni',
      'Jami o\'quvchilar',
      'Ishtirok etganlar',
      'Qamrov foizi',
      'O\'rtacha ball (40 dan)',
      'Sifat ko\'rsatkichi (%)',
      'Shubhali anomaliyalar',
    ];

    const rows = sortedDistricts.value.map((d) => [
      `"${d.name}"`,
      d.totalSchools,
      d.totalStudents,
      d.participatedStudents,
      `${d.participationRate}%`,
      d.averageScore,
      `${d.qualityPercentage}%`,
      d.flaggedAnomaliesCount,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  return {
    districts,
    schoolRankings,
    anomalies,
    overview,
    selectedDistrictId,
    sortBy,
    sortOrder,
    isLoading,
    sortedDistricts,
    filteredRankings,
    topSchools,
    needsImprovementSchools,
    filteredAnomalies,
    loadRegionalData,
    selectDistrict,
    setSort,
    resolveAnomaly,
    exportRegionalCsv,
  };
});
