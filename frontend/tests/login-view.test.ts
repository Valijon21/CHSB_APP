import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import LoginView from '../src/features/auth/views/LoginView.vue';
import { useAuthStore } from '../src/features/auth/store/authStore';
import { mockLoginApi, TEST_PASSWORD } from './mocks/mockAuthApi';

const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useRoute: () => ({
    query: {},
    params: {},
  }),
}));

describe('TASK-AUTH.3: LoginView.vue UI & Interactions', () => {
  beforeEach(() => {
    mockLoginApi();
    setActivePinia(createPinia());
    mockPush.mockClear();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('renders login form with accessible inputs and no demo accounts', () => {
    const wrapper = mount(LoginView, {
      global: {
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('CHSB Platform');
    expect(wrapper.text()).toContain("O'qituvchilar va Maktab Ma'muriyati");
    expect(wrapper.find('#auth-username').exists()).toBe(true);
    expect(wrapper.find('#auth-password').exists()).toBe(true);
    expect(wrapper.html()).not.toContain('Demo');
    expect(wrapper.html()).not.toContain('xorazm.uz');
  });

  it('toggles password visibility when eye icon clicked', async () => {
    const wrapper = mount(LoginView, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    });

    const passwordInput = wrapper.find<HTMLInputElement>('#auth-password');
    expect(passwordInput.attributes('type')).toBe('password');

    const toggleBtn = wrapper.find('button[aria-label="Parolni ko\'rsatish"]');
    expect(toggleBtn.exists()).toBe(true);

    await toggleBtn.trigger('click');
    expect(passwordInput.attributes('type')).toBe('text');

    await toggleBtn.trigger('click');
    expect(passwordInput.attributes('type')).toBe('password');
  });

  it('shows error message if username is too short', async () => {
    const wrapper = mount(LoginView, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    });

    const usernameInput = wrapper.find('#auth-username');
    const passwordInput = wrapper.find('#auth-password');

    await usernameInput.setValue('ab');
    await passwordInput.setValue('12345');
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.text()).toContain("kamida 3 ta belgidan iborat bo'lishi kerak");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('logs in successfully and routes to teacher dashboard', async () => {
    const wrapper = mount(LoginView, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    });

    const usernameInput = wrapper.find('#auth-username');
    const passwordInput = wrapper.find('#auth-password');

    await usernameInput.setValue('teacher_ax');
    await passwordInput.setValue(TEST_PASSWORD);
    await wrapper.find('form').trigger('submit.prevent');

    // Wait microtask
    await vi.waitFor(() => {
      const store = useAuthStore();
      expect(store.isAuthenticated).toBe(true);
      expect(mockPush).toHaveBeenCalledWith('/t/al-xorazmiy/teacher/dashboard');
    });
  });
});

