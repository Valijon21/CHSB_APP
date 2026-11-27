import { vi } from 'vitest';
import { httpClient, ApiError } from '../../src/shared/api/httpClient';
import type { UserRole } from '../../src/features/auth/types';

export const TEST_PASSWORD = 'test-only-password-1';

interface TestAccount {
  id: string;
  fullName: string;
  role: UserRole;
  tenantSlug: string;
}

export const TEST_ACCOUNTS: Record<string, TestAccount> = {
  teacher_ax: { id: 'usr-tch-01', fullName: 'Anvar Rahimov', role: 'TEACHER', tenantSlug: 'al-xorazmiy' },
  admin_ax: { id: 'usr-adm-01', fullName: 'Shavkat Boboyev', role: 'SCHOOL_ADMIN', tenantSlug: 'al-xorazmiy' },
  inspector_tashkent: { id: 'usr-ins-01', fullName: 'Hududiy Inspektor', role: 'REGIONAL_INSPECTOR', tenantSlug: 'al-xorazmiy' },
  super_admin: { id: 'usr-sup-01', fullName: 'Viloyat Boshqarmasi', role: 'SUPER_ADMIN', tenantSlug: 'al-xorazmiy' },
};

/** Stands in for the backend's POST /auth/login */
export function mockLoginApi() {
  return vi.spyOn(httpClient, 'post').mockImplementation(async (path: string, body?: unknown) => {
    if (path !== '/auth/login') {
      throw new ApiError(`Unexpected request: ${path}`, 500);
    }
    const { username, password } = body as { username: string; password: string };
    const account = TEST_ACCOUNTS[username];
    if (!account || password !== TEST_PASSWORD) {
      throw new ApiError("Foydalanuvchi nomi yoki parol noto'g'ri.", 401);
    }
    return {
      access_token: `test-token-${username}`,
      token_type: 'bearer',
      user: { username, ...account },
    };
  });
}
