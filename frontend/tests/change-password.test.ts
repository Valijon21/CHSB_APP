import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import ChangePasswordForm from '../src/features/auth/components/ChangePasswordForm.vue';
import { useAuthStore, AUTH_STORAGE_KEY } from '../src/features/auth/store/authStore';
import { ApiError } from '../src/shared/api/httpClient';
import { mockLoginApi, TEST_PASSWORD } from './mocks/mockAuthApi';

const NEW_PASSWORD = 'another-private-password-2';

async function signIn(rememberMe: boolean) {
  const spy = mockLoginApi();
  const store = useAuthStore();
  await store.login({ username: 'teacher_ax', password: TEST_PASSWORD, rememberMe });
  spy.mockReset();
  return { store, post: spy };
}

async function fill(wrapper: ReturnType<typeof mount>, next: string, repeated = next) {
  await wrapper.find('input[name="current-password"]').setValue(TEST_PASSWORD);
  await wrapper.find('input[name="new-password"]').setValue(next);
  await wrapper.find('input[name="repeat-password"]').setValue(repeated);
  await wrapper.find('form').trigger('submit.prevent');
  await flushPromises();
}

describe('Changing the password', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setActivePinia(createPinia());
    sessionStorage.clear();
    localStorage.clear();
  });

  it.each([true, false])('keeps the session with the new token (remember me: %s)', async (remember) => {
    const { store, post } = await signIn(remember);
    post.mockResolvedValue({ access_token: 'fresh-token' });

    const wrapper = mount(ChangePasswordForm);
    await fill(wrapper, NEW_PASSWORD);

    expect(post).toHaveBeenCalledWith('/auth/change-password', {
      currentPassword: TEST_PASSWORD,
      newPassword: NEW_PASSWORD,
    });
    expect(store.token).toBe('fresh-token');
    const kept = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    expect(kept.getItem(AUTH_STORAGE_KEY)).toContain('fresh-token');
    expect(other.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(wrapper.text()).toContain('Parol yangilandi');
  });

  it('checks the new password before sending anything', async () => {
    const { post } = await signIn(false);
    const wrapper = mount(ChangePasswordForm);

    await fill(wrapper, 'short');
    expect(wrapper.text()).toContain('kamida 10 belgidan');

    await fill(wrapper, NEW_PASSWORD, `${NEW_PASSWORD}-typo`);
    expect(wrapper.text()).toContain('mos kelmadi');

    expect(post).not.toHaveBeenCalled();
  });

  it('shows why the server refused', async () => {
    const { store, post } = await signIn(false);
    post.mockRejectedValue(new ApiError("Joriy parol noto'g'ri.", 400));

    const wrapper = mount(ChangePasswordForm);
    await fill(wrapper, NEW_PASSWORD);

    expect(wrapper.find('[role="alert"]').text()).toContain("Joriy parol noto'g'ri");
    expect(store.token).toBe('test-token-teacher_ax');
    expect(post).toHaveBeenCalledTimes(1);
  });
});
