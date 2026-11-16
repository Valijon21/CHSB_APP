import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore, AUTH_STORAGE_KEY } from '../src/features/auth/store/authStore';

describe('TASK-AUTH.2: Pinia authStore & Session Management', () => {
  beforeEach(() => {
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
      username: 'teacher@xorazm.uz',
      password: 'teacher123',
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
      username: 'admin@xorazm.uz',
      password: 'admin123',
      rememberMe: true,
    });

    expect(store.isAuthenticated).toBe(true);
    expect(store.currentRole).toBe('SCHOOL_ADMIN');
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toContain('Shavkat Boboyev');
  });

  it('rejects unknown username with descriptive error', async () => {
    const store = useAuthStore();
    await expect(
      store.login({
        username: 'unknown@user.uz',
        password: 'password123',
        rememberMe: false,
      })
    ).rejects.toThrow('Foydalanuvchi topilmadi');

    expect(store.isAuthenticated).toBe(false);
    expect(store.errorMessage).toContain('Foydalanuvchi topilmadi');
  });

  it('rejects incorrect password', async () => {
    const store = useAuthStore();
    await expect(
      store.login({
        username: 'teacher@xorazm.uz',
        password: 'wrong_password',
        rememberMe: false,
      })
    ).rejects.toThrow("Parol noto'g'ri");

    expect(store.isAuthenticated).toBe(false);
    expect(store.errorMessage).toContain("Parol noto'g'ri");
  });

  it('correctly checks roles with hasRole', async () => {
    const store = useAuthStore();
    await store.login({
      username: 'regional@xorazm.uz',
      password: 'regional123',
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
      username: 'teacher@xorazm.uz',
      password: 'teacher123',
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

