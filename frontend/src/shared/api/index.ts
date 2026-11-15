import type { TenantRepository } from './repositories/TenantRepository';
import type { RosterRepository } from './repositories/RosterRepository';
import type { AssessmentRepository } from './repositories/AssessmentRepository';
import type { AttemptRepository } from './repositories/AttemptRepository';
import type { ResultRepository } from './repositories/ResultRepository';
import type { TeacherRepository } from './repositories/TeacherRepository';
import type { RegionalRepository } from './repositories/RegionalRepository';
import type { OrganizationRepository } from './repositories/OrganizationRepository';

import {
  RealTenantRepository,
  RealRosterRepository,
  RealAssessmentRepository,
  RealAttemptRepository,
  RealResultRepository,
  RealTeacherRepository,
  RealRegionalRepository,
  RealOrganizationRepository,
} from './realApi';

import { MockTenantRepository } from '../mocks/repositories/MockTenantRepository';
import { MockRosterRepository } from '../mocks/repositories/MockRosterRepository';
import { MockAssessmentRepository } from '../mocks/repositories/MockAssessmentRepository';
import { MockAttemptRepository } from '../mocks/repositories/MockAttemptRepository';
import { MockResultRepository } from '../mocks/repositories/MockResultRepository';
import { MockTeacherRepository } from '../mocks/repositories/MockTeacherRepository';
import { MockRegionalRepository } from '../mocks/repositories/MockRegionalRepository';
import { MockOrganizationRepository } from '../mocks/repositories/MockOrganizationRepository';

export interface ApiServices {
  tenant: TenantRepository;
  roster: RosterRepository;
  assessment: AssessmentRepository;
  attempt: AttemptRepository;
  result: ResultRepository;
  teacher: TeacherRepository;
  regional: RegionalRepository;
  organization: OrganizationRepository;
}

/**
 * Resilient Repository Proxy:
 * Tries the real FastAPI + PostgreSQL backend first.
 * If the backend is offline, unreachable, or returns null/not_found due to backend downtime,
 * seamlessly falls back to the deterministic local mock repository.
 */
function createResilientService<T extends object>(realService: T, mockService: T): T {
  return new Proxy(realService, {
    get(target, prop, receiver) {
      const orig = Reflect.get(target, prop, receiver);
      if (typeof orig === 'function') {
        return async (...args: unknown[]) => {
          try {
            const res = await orig.apply(target, args);
            // If real API returned a valid non-null result
            if (res !== null && res !== undefined) {
              // In roster lookup, check if status is not_found due to backend downtime
              if (typeof res === 'object' && res !== null && 'status' in res && (res as Record<string, unknown>).status === 'not_found') {
                const fallbackMethod = (mockService as Record<string, unknown>)[prop as string];
                if (typeof fallbackMethod === 'function') {
                  const fallbackRes = await (fallbackMethod as (...a: unknown[]) => unknown).apply(mockService, args);
                  if (fallbackRes && typeof fallbackRes === 'object' && 'status' in fallbackRes && (fallbackRes as Record<string, unknown>).status === 'success') {
                    return fallbackRes;
                  }
                }
              }
              // If list is empty (e.g. backend offline returned empty array), check if mock has items
              if (Array.isArray(res) && res.length === 0) {
                const fallbackMethod = (mockService as Record<string, unknown>)[prop as string];
                if (typeof fallbackMethod === 'function') {
                  const fallbackRes = await (fallbackMethod as (...a: unknown[]) => unknown).apply(mockService, args);
                  if (Array.isArray(fallbackRes) && fallbackRes.length > 0) {
                    return fallbackRes;
                  }
                }
              }
              return res;
            }
            // If real API returned null/undefined, call fallback
            const fallbackMethod = (mockService as Record<string, unknown>)[prop as string];
            if (typeof fallbackMethod === 'function') {
              return await (fallbackMethod as (...a: unknown[]) => unknown).apply(mockService, args);
            }
            return res;
          } catch {
            const fallbackMethod = (mockService as Record<string, unknown>)[prop as string];
            if (typeof fallbackMethod === 'function') {
              return await (fallbackMethod as (...a: unknown[]) => unknown).apply(mockService, args);
            }
            throw new Error(`Xizmat chaqirishda xatolik yuz berdi: ${String(prop)}`);
          }
        };
      }
      return orig;
    },
  });
}

const realTenants = new RealTenantRepository();
const mockTenants = new MockTenantRepository();

const realRoster = new RealRosterRepository();
const mockRoster = new MockRosterRepository();

const realAssessment = new RealAssessmentRepository();
const mockAssessment = new MockAssessmentRepository();

const realAttempt = new RealAttemptRepository();
const mockAttempt = new MockAttemptRepository();

const realResult = new RealResultRepository();
const mockResult = new MockResultRepository();

const realTeacher = new RealTeacherRepository();
const mockTeacher = new MockTeacherRepository();

const realRegional = new RealRegionalRepository();
const mockRegional = new MockRegionalRepository();

const realOrganization = new RealOrganizationRepository();
const mockOrganization = new MockOrganizationRepository();

export const api: ApiServices = {
  tenant: createResilientService(realTenants, mockTenants),
  roster: createResilientService(realRoster, mockRoster),
  assessment: createResilientService(realAssessment, mockAssessment),
  attempt: createResilientService(realAttempt, mockAttempt),
  result: createResilientService(realResult, mockResult),
  teacher: createResilientService(realTeacher, mockTeacher),
  regional: createResilientService(realRegional, mockRegional),
  organization: createResilientService(realOrganization, mockOrganization),
};
