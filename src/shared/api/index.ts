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

// Enterprise Real PostgreSQL 18 & FastAPI API Services (Mocks eliminated)
export const api: ApiServices = {
  tenant: new RealTenantRepository(),
  roster: new RealRosterRepository(),
  assessment: new RealAssessmentRepository(),
  attempt: new RealAttemptRepository(),
  result: new RealResultRepository(),
  teacher: new RealTeacherRepository(),
  regional: new RealRegionalRepository(),
  organization: new RealOrganizationRepository(),
};
