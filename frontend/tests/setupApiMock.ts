import { vi } from 'vitest';
import { MockTenantRepository } from './mocks/repositories/MockTenantRepository';
import { MockRosterRepository } from './mocks/repositories/MockRosterRepository';
import { MockAssessmentRepository } from './mocks/repositories/MockAssessmentRepository';
import { MockAttemptRepository } from './mocks/repositories/MockAttemptRepository';
import { MockResultRepository } from './mocks/repositories/MockResultRepository';
import { MockTeacherRepository } from './mocks/repositories/MockTeacherRepository';
import { MockRegionalRepository } from './mocks/repositories/MockRegionalRepository';
import { MockOrganizationRepository } from './mocks/repositories/MockOrganizationRepository';

// Provide isolated mock API services for Vitest unit test suite
vi.mock('@/shared/api', () => {
  return {
    api: {
      tenant: new MockTenantRepository(),
      roster: new MockRosterRepository(),
      assessment: new MockAssessmentRepository(),
      attempt: new MockAttemptRepository(),
      result: new MockResultRepository(),
      teacher: new MockTeacherRepository(),
      regional: new MockRegionalRepository(),
      organization: new MockOrganizationRepository(),
    },
  };
});

