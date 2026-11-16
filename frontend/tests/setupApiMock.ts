import { vi } from 'vitest';
import { MockTenantRepository } from './mocks/repositories/MockTenantRepository';
import { MockRosterRepository } from './mocks/repositories/MockRosterRepository';
import { MockAssessmentRepository } from './mocks/repositories/MockAssessmentRepository';
import { MockAttemptRepository } from './mocks/repositories/MockAttemptRepository';
import { MockResultRepository } from './mocks/repositories/MockResultRepository';
import { MockTeacherRepository } from './mocks/repositories/MockTeacherRepository';
import { MockRegionalRepository } from './mocks/repositories/MockRegionalRepository';
import { MockOrganizationRepository } from './mocks/repositories/MockOrganizationRepository';

// Ensure localStorage and sessionStorage exist and function in Node 26+ / jsdom environment
const createStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((idx: number) => Object.keys(store)[idx] ?? null),
  };
};

try {
  const testStorage = createStorageMock();
  Object.defineProperty(globalThis, 'localStorage', {
    value: testStorage,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: createStorageMock(),
    writable: true,
    configurable: true,
  });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: testStorage,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'sessionStorage', {
      value: createStorageMock(),
      writable: true,
      configurable: true,
    });
  }
} catch {
  // Ignore fallback errors
}

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

