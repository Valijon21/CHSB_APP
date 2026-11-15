import type { RosterRepository } from '@/shared/api/repositories/RosterRepository';
import type {
  RosterLookupRequest,
  RosterLookupResult,
  StudentRosterRecord,
} from '@/entities/roster/model';
import {
  mockTenants,
  mockSchools,
  mockClassGroups,
  mockRosterRecords,
} from '../fixtures/tenants';

export class MockRosterRepository implements RosterRepository {
  private records: StudentRosterRecord[];
  private latencyMs: number;

  constructor(records = mockRosterRecords, latencyMs = 0) {
    this.records = records;
    this.latencyMs = latencyMs;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }

  async lookup(request: RosterLookupRequest): Promise<RosterLookupResult> {
    await this.delay();

    const tenant = mockTenants.find((t) => t.slug === request.tenantSlug);
    if (!tenant) {
      return {
        status: 'not_found',
        message: "Ma'lumotlar mos kelmadi.",
      };
    }

    // Strict Tenant Scoping: only records matching tenant.id!
    const matches = this.records.filter(
      (r) =>
        r.tenantId === tenant.id &&
        r.rosterCode.trim().toUpperCase() === request.rosterCode.trim().toUpperCase()
    );

    if (matches.length === 0) {
      return {
        status: 'not_found',
        message: "Ma'lumotlar mos kelmadi.",
      };
    }

    if (matches.length > 1 || matches[0]?.status === 'ambiguous') {
      return {
        status: 'ambiguous',
        message: "Bir nechta moslik aniqlandi. Iltimos, o'qituvchiga murojaat qiling.",
      };
    }

    const record = matches[0]!;

    if (record.status === 'inactive') {
      return {
        status: 'inactive',
        message: "Ushbu o'quvchi hisobi faol emas.",
      };
    }

    const school = mockSchools.find((s) => s.id === record.schoolId);
    const classGroup = mockClassGroups.find((c) => c.id === record.classGroupId);

    return {
      status: 'success',
      match: {
        rosterRecordId: record.id,
        displayName: `${record.firstName} ${record.lastName}`,
        schoolName: school ? school.name : 'Umumiy maktab',
        className: classGroup ? classGroup.name : '11-sinf',
        eligibilityStatus: record.status,
        availableAssessmentIds: record.availableAssessmentIds,
      },
    };
  }

  async getRosterRecordById(tenantId: string, recordId: string): Promise<StudentRosterRecord | null> {
    await this.delay();
    const record = this.records.find((r) => r.tenantId === tenantId && r.id === recordId);
    return record || null;
  }

  async getRosterByClass(tenantId: string, classGroupId: string): Promise<StudentRosterRecord[]> {
    await this.delay();
    return this.records.filter((r) => r.tenantId === tenantId && r.classGroupId === classGroupId);
  }
}

