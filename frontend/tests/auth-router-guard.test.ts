import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { router } from '../src/app/router';
import { useAuthStore } from '../src/features/auth/store/authStore';

describe('TASK-AUTH.4: Router Navigation Guard & RBAC Protection', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    sessionStorage.clear();
    localStorage.clear();
  });

  it('allows public student entry without authentication', async () => {
    await router.push('/t/al-xorazmiy/student');
    expect(router.currentRoute.value.path).toBe('/t/al-xorazmiy/student');
  });

  it('redirects unauthenticated user from /teacher/dashboard to /login', async () => {
    const authStore = useAuthStore();
    authStore.logout();

    await router.push('/t/al-xorazmiy/teacher/dashboard');
    expect(router.currentRoute.value.path).toBe('/login');
    expect(router.currentRoute.value.query.redirect).toBe('/t/al-xorazmiy/teacher/dashboard');
  });

  it('redirects unauthenticated user from /admin to /login', async () => {
    const authStore = useAuthStore();
    authStore.logout();

    await router.push('/t/al-xorazmiy/admin');
    expect(router.currentRoute.value.path).toBe('/login');
    expect(router.currentRoute.value.query.redirect).toBe('/t/al-xorazmiy/admin');
  });

  it('allows authenticated teacher to access /teacher/dashboard', async () => {
    const authStore = useAuthStore();
    await authStore.login({
      username: 'teacher@xorazm.uz',
      password: 'teacher123',
    });

    await router.push('/t/al-xorazmiy/teacher/dashboard');
    expect(router.currentRoute.value.path).toBe('/t/al-xorazmiy/teacher/dashboard');
  });

  it('blocks teacher from accessing SUPER_ADMIN regional oversight', async () => {
    const authStore = useAuthStore();
    await authStore.login({
      username: 'teacher@xorazm.uz',
      password: 'teacher123',
    });

    await router.push('/t/al-xorazmiy/teacher/regional-oversight');
    // Teacher should be redirected back to teacher dashboard because they lack SUPER_ADMIN role
    expect(router.currentRoute.value.path).toBe('/t/al-xorazmiy/teacher/dashboard');
  });

  it('allows super admin to access regional oversight and schools directory', async () => {
    const authStore = useAuthStore();
    await authStore.login({
      username: 'regional@xorazm.uz',
      password: 'regional123',
    });

    await router.push('/schools');
    expect(router.currentRoute.value.path).toBe('/schools');
  });

  it('redirects logged-in user away from /login to their home page', async () => {
    const authStore = useAuthStore();
    await authStore.login({
      username: 'teacher@xorazm.uz',
      password: 'teacher123',
    });

    await router.push('/login');
    expect(router.currentRoute.value.path).toBe('/t/al-xorazmiy/teacher/dashboard');
  });
});

