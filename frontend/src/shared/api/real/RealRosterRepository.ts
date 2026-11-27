import { httpClient } from '../httpClient';
import type { RosterRepository } from '../repositories/RosterRepository';
import type {
  RosterLookupRequest,
  RosterLookupResult,
  StudentRosterRecord,
} from '../../../entities/roster/model';
import type { BackendStudentItem, BackendVerifyResponse } from './types';

export class RealRosterRepository implements RosterRepository {
  async lookup(request: RosterLookupRequest): Promise<RosterLookupResult> {
    try {
      const res = await httpClient.post<BackendVerifyResponse>('/auth/admission/verify', {
        tenantSlug: request.tenantSlug,
        rosterCode: request.rosterCode.trim().toUpperCase(),
      });

      if (!res.success || !res.student) {
        return {
          status: 'not_found',
          message: res.message || "Ma'lumotlar mos kelmadi.",
        };
      }

      if (res.sessionToken && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('chsb_student_session_token', res.sessionToken);
      }

      const s = res.student;
      return {
        status: 'success',
        match: {
          rosterRecordId: s.id,
          displayName: `${s.firstName} ${s.lastName}`,
          schoolName: res.schoolName || 'Al-Xorazmiy nomidagi IT-maktab',
          className: s.className || '11-sinf',
          group: s.group || null,
          emaktabId: s.emaktabId || null,
          eligibilityStatus: (s.status === 'inactive' ? 'inactive' : 'eligible') as 'eligible' | 'inactive',
          availableAssessmentIds: res.availableAssessmentIds || [],
        },
      };
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "O'quvchi topilmadi.";
      return { status: 'not_found', message: msg };
    }
  }

  async getRosterRecordById(tenantId: string, recordId: string): Promise<StudentRosterRecord | null> {
    try {
      const students = await httpClient.get<BackendStudentItem[]>('/students', { params: { tenantSlug: tenantId } });
      const found = students.find((s) => s.id === recordId || s.rosterCode === recordId);
      if (!found) return null;
      return {
        id: found.id,
        tenantId: found.tenantId,
        schoolId: found.schoolId,
        classGroupId: found.classGroupId,
        rosterCode: found.rosterCode,
        firstName: found.firstName,
        lastName: found.lastName,
        middleName: found.middleName,
        group: found.group || null,
        emaktabId: found.emaktabId || null,
        status: (found.status === 'inactive' ? 'inactive' : 'eligible') as 'eligible' | 'inactive',
        availableAssessmentIds: found.availableAssessmentIds || [],
      };
    } catch {
      return null;
    }
  }

  async getRosterByClass(tenantId: string, classGroupId: string): Promise<StudentRosterRecord[]> {
    try {
      const list = await httpClient.get<BackendStudentItem[]>('/students', {
        params: { tenantSlug: tenantId, classGroupId },
      });
      return list.map((s) => ({
        id: s.id,
        tenantId: s.tenantId,
        schoolId: s.schoolId,
        classGroupId: s.classGroupId,
        rosterCode: s.rosterCode,
        firstName: s.firstName,
        lastName: s.lastName,
        middleName: s.middleName,
        status: (s.status === 'inactive' ? 'inactive' : 'eligible') as 'eligible' | 'inactive',
        availableAssessmentIds: s.availableAssessmentIds || [],
      }));
    } catch {
      return [];
    }
  }
}

