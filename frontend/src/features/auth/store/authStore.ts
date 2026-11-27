import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { AuthUser, LoginCredentialsInput, UserRole } from '../types';
import { LoginCredentialsSchema, AuthUserSchema } from '../types';
import { logger } from '../../../shared/services/logger/LoggerService';
import { httpClient } from '../../../shared/api/httpClient';

export const AUTH_STORAGE_KEY = 'chsb_auth_session';

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    role: UserRole;
    email?: string | null;
    phone?: string | null;
    tenantSlug?: string | null;
    schoolName?: string | null;
  };
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const currentUser = ref<AuthUser | null>(null);
  const token = ref<string | null>(null);
  const isLoading = ref<boolean>(false);
  const errorMessage = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed<boolean>(() => {
    return !!currentUser.value && !!token.value;
  });

  const currentRole = computed<UserRole | null>(() => {
    return currentUser.value?.role || null;
  });

  const currentTenantSlug = computed<string | null>(() => {
    return currentUser.value?.tenantSlug || null;
  });

  // Actions
  async function login(credentials: LoginCredentialsInput): Promise<AuthUser> {
    isLoading.value = true;
    errorMessage.value = null;

    try {
      const valid = LoginCredentialsSchema.parse(credentials);
      // Only the backend decides who may sign in: there is no local fallback
      const res = await httpClient.post<LoginResponse>('/auth/login', {
        username: valid.username,
        password: valid.password,
      });

      const authUser: AuthUser = {
        id: res.user.id,
        username: res.user.username,
        fullName: res.user.fullName,
        role: res.user.role,
        email: res.user.email || undefined,
        phone: res.user.phone || undefined,
        tenantSlug: res.user.tenantSlug || undefined,
        schoolName: res.user.schoolName || undefined,
        token: res.access_token,
      };

      // Sessiyani o'rnatish
      currentUser.value = authUser;
      token.value = authUser.token;

      // Xotiraga saqlash
      saveSessionToStorage(currentUser.value, valid.rememberMe);

      logger.info(
        `Foydalanuvchi tizimga kirdi: ${authUser.fullName} (${authUser.role})`,
        {
          userId: authUser.id,
          role: authUser.role,
          tenantSlug: authUser.tenantSlug,
        },
        'AUTH'
      );

      return currentUser.value;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Tizimga kirishda xatolik yuz berdi.";
      errorMessage.value = msg;
      logger.warn(
        `Kirishda xatolik: ${msg}`,
        { username: credentials.username },
        'AUTH'
      );
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const res = await httpClient.post<{ access_token: string }>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    if (!currentUser.value) return;

    // The old token stopped working: keep the session in the same storage with the new one
    const remembered =
      typeof window !== 'undefined' && localStorage.getItem(AUTH_STORAGE_KEY) !== null;
    currentUser.value = { ...currentUser.value, token: res.access_token };
    token.value = res.access_token;
    saveSessionToStorage(currentUser.value, remembered);
  }

  function logout(): void {
    const user = currentUser.value;
    currentUser.value = null;
    token.value = null;
    errorMessage.value = null;

    clearSessionFromStorage();

    if (user) {
      logger.info(
        `Foydalanuvchi tizimdan chiqdi: ${user.fullName}`,
        { userId: user.id },
        'AUTH'
      );
    }
  }

  function restoreSession(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const raw =
        sessionStorage.getItem(AUTH_STORAGE_KEY) ||
        localStorage.getItem(AUTH_STORAGE_KEY);

      if (!raw) return false;

      const parsedJson = JSON.parse(raw);
      const validated = AuthUserSchema.safeParse(parsedJson);

      if (validated.success) {
        currentUser.value = validated.data;
        token.value = validated.data.token;
        return true;
      } else {
        clearSessionFromStorage();
        return false;
      }
    } catch {
      clearSessionFromStorage();
      return false;
    }
  }

  function hasRole(allowedRoles: UserRole | UserRole[]): boolean {
    if (!currentUser.value) return false;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return roles.includes(currentUser.value.role);
  }

  function saveSessionToStorage(user: AuthUser, rememberMe: boolean): void {
    if (typeof window === 'undefined') return;
    const serialized = JSON.stringify(user);
    // A session left over from an earlier sign-in must not shadow the new one
    clearSessionFromStorage();
    if (rememberMe) {
      localStorage.setItem(AUTH_STORAGE_KEY, serialized);
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, serialized);
    }
  }

  function clearSessionFromStorage(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return {
    currentUser,
    token,
    isLoading,
    errorMessage,

    isAuthenticated,
    currentRole,
    currentTenantSlug,

    login,
    changePassword,
    logout,
    restoreSession,
    hasRole,
  };
});
