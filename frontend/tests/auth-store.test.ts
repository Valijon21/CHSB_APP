import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore, AUTH_STORAGE_KEY } from '../src/features/auth/store/authStore';
import { httpClient, ApiError } from '../src/shared/api/httpClient';
import { mockLoginApi, TEST_PASSWORD } from './mocks/mockAuthApi';

describe('TASK-AUTH.2: Pinia authStore & Session Management', () => {
  beforeEach(() => {
    mockLoginApi();
    setActivePinia(createPinia());
    sessionStorage.clear();
    localStorage.clear();
  });

  it('initializes with unauthenticated state', () => {
    const store = useAuthStore();
    expect(store.isAuthenticated).toBe(false);
    expect(store.currentUser).toBeNull();
    expect(store.token).toBeNull();
    expect(store.currentRole).toBeNull();
    expect(store.currentTenantSlug).toBeNull();
  });

  it('logs in successfully as teacher', async () => {
    const store = useAuthStore();
    const user = await store.login({
      username: 'teacher_ax',
      password: TEST_PASSWORD,
      rememberMe: false,
    });

    expect(store.isAuthenticated).toBe(true);
    expect(user.fullName).toBe('Anvar Rahimov');
    expect(store.currentRole).toBe('TEACHER');
    expect(store.currentTenantSlug).toBe('al-xorazmiy');
    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).toContain('Anvar Rahimov');
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('logs in with rememberMe=true saving to localStorage', async () => {
    const store = useAuthStore();
    await store.login({
      username: 'admin_ax',
      password: TEST_PASSWORD,
      rememberMe: true,
    });

    expect(store.isAuthenticated).toBe(true);
    expect(store.currentRole).toBe('SCHOOL_ADMIN');
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toContain('Shavkat Boboyev');
  });

  it('rejects what the backend rejects', async () => {
    const store = useAuthStore();
    await expect(
      store.login({ username: 'teacher_ax', password: 'wrong_password', rememberMe: false })
    ).rejects.toThrow("parol noto'g'ri");

    expect(store.isAuthenticated).toBe(false);
    expect(store.errorMessage).toContain("parol noto'g'ri");
  });

  it('never signs in locally when the backend refuses or is unreachable', async () => {
    vi.spyOn(httpClient, 'post').mockRejectedValue(new ApiError('Tarmoqda xatolik', 500));
    const store = useAuthStore();

    for (const [username, password] of [
      ['teacher@xorazm.uz', 'teacher123'],
      ['admin@xorazm.uz', 'admin123'],
      ['regional@xorazm.uz', 'regional123'],
    ] as const) {
      await expect(store.login({ username, password })).rejects.toThrow('Tarmoqda xatolik');
    }
    expect(store.isAuthenticated).toBe(false);
    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('replaces a remembered session on the next sign-in', async () => {
    const store = useAuthStore();
    await store.login({ username: 'admin_ax', password: TEST_PASSWORD, rememberMe: true });
    await store.login({ username: 'teacher_ax', password: TEST_PASSWORD, rememberMe: false });

    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).toContain('test-token-teacher_ax');
  });

  it('correctly checks roles with hasRole', async () => {
    const store = useAuthStore();
    await store.login({
      username: 'super_admin',
      password: TEST_PASSWORD,
      rememberMe: false,
    });

    expect(store.hasRole('SUPER_ADMIN')).toBe(true);
    expect(store.hasRole('TEACHER')).toBe(false);
    expect(store.hasRole(['SCHOOL_ADMIN', 'SUPER_ADMIN'])).toBe(true);
  });

  it('restores session from storage on page reload', () => {
    const mockUser = {
      id: 'usr-tch-01',
      username: 'teacher@xorazm.uz',
      fullName: 'Anvar Rahimov',
      role: 'TEACHER',
      token: 'restored-token-123',
      tenantSlug: 'al-xorazmiy',
    };
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));

    const store = useAuthStore();
    const restored = store.restoreSession();

    expect(restored).toBe(true);
    expect(store.isAuthenticated).toBe(true);
    expect(store.currentUser?.fullName).toBe('Anvar Rahimov');
  });

  it('logs out and wipes storage cleanly', async () => {
    const store = useAuthStore();
    await store.login({
      username: 'teacher_ax',
      password: TEST_PASSWORD,
      rememberMe: true,
    });

    expect(store.isAuthenticated).toBe(true);
    store.logout();

    expect(store.isAuthenticated).toBe(false);
    expect(store.currentUser).toBeNull();
    expect(store.token).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });
});

