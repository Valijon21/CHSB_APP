import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import StaffLayout from '../src/app/layouts/StaffLayout.vue';
import { useAuthStore } from '../src/features/auth/store/authStore';

const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useRoute: () => ({
    path: '/t/al-xorazmiy/teacher/dashboard',
    params: { tenantSlug: 'al-xorazmiy' },
  }),
}));

describe('TASK-AUTH.5: StaffLayout Auth & Logout Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockPush.mockClear();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('renders authenticated teacher name and role badge', async () => {
    const authStore = useAuthStore();
    await authStore.login({
      username: 'teacher@xorazm.uz',
      password: 'teacher123',
    });

    const wrapper = mount(StaffLayout, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          RouterView: { template: '<div><slot /></div>' },
          LanguageSwitcher: { template: '<div>Lang</div>' },
          ThemeToggle: { template: '<div>Theme</div>' },
        },
      },
    });

    expect(wrapper.text()).toContain('Anvar Rahimov');
    expect(wrapper.text()).toContain("O'qituvchi");
    // Teacher should not have Viloyat Boshqaruvi in navigation
    expect(wrapper.text()).not.toContain('Viloyat Boshqaruvi');
  });

  it('renders super admin with Viloyat Boshqarmasi badge and link', async () => {
    const authStore = useAuthStore();
    await authStore.login({
      username: 'regional@xorazm.uz',
      password: 'regional123',
    });

    const wrapper = mount(StaffLayout, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          RouterView: { template: '<div><slot /></div>' },
          LanguageSwitcher: { template: '<div>Lang</div>' },
          ThemeToggle: { template: '<div>Theme</div>' },
        },
      },
    });

    expect(wrapper.text()).toContain('Viloyat Boshqarmasi');
    expect(wrapper.text()).toContain('Viloyat Boshqaruvi');
  });

  it('triggers logout and redirects to /login when Chiqish button clicked', async () => {
    const authStore = useAuthStore();
    await authStore.login({
      username: 'teacher@xorazm.uz',
      password: 'teacher123',
    });

    expect(authStore.isAuthenticated).toBe(true);

    const wrapper = mount(StaffLayout, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          RouterView: { template: '<div><slot /></div>' },
          LanguageSwitcher: { template: '<div>Lang</div>' },
          ThemeToggle: { template: '<div>Theme</div>' },
        },
      },
    });

    const logoutButtons = wrapper.findAll('button[aria-label="Tizimdan chiqish"]');
    expect(logoutButtons.length).toBeGreaterThan(0);

    await logoutButtons[0]!.trigger('click');

    expect(authStore.isAuthenticated).toBe(false);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});

