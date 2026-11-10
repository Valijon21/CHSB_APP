import type { TenantRepository } from './repositories/TenantRepository';
import type { RosterRepository } from './repositories/RosterRepository';
import type { AssessmentRepository } from './repositories/AssessmentRepository';
import type { AttemptRepository } from './repositories/AttemptRepository';
import type { ResultRepository } from './repositories/ResultRepository';
import type { TeacherRepository } from './repositories/TeacherRepository';
import type { RegionalRepository } from './repositories/RegionalRepository';
import type { OrganizationRepository } from './repositories/OrganizationRepository';

import { MockTenantRepository } from '../../mocks/repositories/MockTenantRepository';
import { MockRosterRepository } from '../../mocks/repositories/MockRosterRepository';
import { MockAssessmentRepository } from '../../mocks/repositories/MockAssessmentRepository';
import { MockAttemptRepository } from '../../mocks/repositories/MockAttemptRepository';
import { MockResultRepository } from '../../mocks/repositories/MockResultRepository';
import { MockTeacherRepository } from '../../mocks/repositories/MockTeacherRepository';
import { MockRegionalRepository } from '../../mocks/repositories/MockRegionalRepository';
import { MockOrganizationRepository } from '../../mocks/repositories/MockOrganizationRepository';

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

// In this frontend-only phase, instantiate mock repositories
export const api: ApiServices = {
  tenant: new MockTenantRepository(),
  roster: new MockRosterRepository(),
  assessment: new MockAssessmentRepository(),
  attempt: new MockAttemptRepository(),
  result: new MockResultRepository(),
  teacher: new MockTeacherRepository(),
  regional: new MockRegionalRepository(),
  organization: new MockOrganizationRepository(),
};

