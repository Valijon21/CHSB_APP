import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { AuthUser, LoginCredentials, UserRole } from '../types';
import { LoginCredentialsSchema, AuthUserSchema } from '../types';
import { logger } from '../../../shared/services/logger/LoggerService';

export const AUTH_STORAGE_KEY = 'chsb_auth_session';

export const DEMO_USERS: Record<string, { password: string; user: AuthUser }> = {
  'teacher@xorazm.uz': {
    password: 'teacher123',
    user: {
      id: 'usr-tch-01',
      username: 'teacher@xorazm.uz',
      fullName: 'Dilmurod Matyoqubov',
      role: 'TEACHER',
      email: 'dilmurod@al-xorazmiy.uz',
      phone: '+998901234567',
      tenantSlug: 'al-xorazmiy',
      schoolName: 'Al-Xorazmiy IT-maktab',
      token: 'mock-jwt-teacher-al-xorazmiy',
    },
  },
  'admin@xorazm.uz': {
    password: 'admin123',
    user: {
      id: 'usr-adm-01',
      username: 'admin@xorazm.uz',
      fullName: 'Shavkat Boboyev (Direktor)',
      role: 'SCHOOL_ADMIN',
      email: 'info@al-xorazmiy.uz',
      phone: '+998622241020',
      tenantSlug: 'al-xorazmiy',
      schoolName: 'Al-Xorazmiy IT-maktab',
      token: 'mock-jwt-admin-al-xorazmiy',
    },
  },
  'regional@xorazm.uz': {
    password: 'regional123',
    user: {
      id: 'usr-reg-01',
      username: 'regional@xorazm.uz',
      fullName: 'Xorazm Viloyati MMTO Boshqarmasi',
      role: 'SUPER_ADMIN',
      email: 'boshqarma@xorazm.uz',
      phone: '+998622230011',
      schoolName: 'Viloyat Ta\'lim Boshqarmasi',
      token: 'mock-jwt-super-admin-xorazm',
    },
  },
};

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
  async function login(credentials: LoginCredentials): Promise<AuthUser> {
    isLoading.value = true;
    errorMessage.value = null;

    try {
      const valid = LoginCredentialsSchema.parse(credentials);
      const normalizedUsername = valid.username.toLowerCase();

      // Demo hisoblar tekshiruvi
      const account = DEMO_USERS[normalizedUsername];
      if (!account) {
        throw new Error("Foydalanuvchi topilmadi! Iltimos, demo hisoblaridan birini tanlang.");
      }

      if (account.password !== valid.password) {
        throw new Error("Parol noto'g'ri! Iltimos, qaytadan tekshirib kiring.");
      }

      // Sessiyani o'rnatish
      currentUser.value = { ...account.user };
      token.value = account.user.token;

      // Xotiraga saqlash
      saveSessionToStorage(currentUser.value, valid.rememberMe);

      logger.info(`Foydalanuvchi tizimga kirdi: ${account.user.fullName} (${account.user.role})`, 'AUTH', {
        userId: account.user.id,
        role: account.user.role,
        tenantSlug: account.user.tenantSlug,
      });

      return currentUser.value;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Tizimga kirishda xatolik yuz berdi.";
      errorMessage.value = msg;
      logger.warn(`Kirishda xatolik: ${msg}`, 'AUTH', { username: credentials.username });
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function logout(): void {
    const user = currentUser.value;
    currentUser.value = null;
    token.value = null;
    errorMessage.value = null;

    clearSessionFromStorage();

    if (user) {
      logger.info(`Foydalanuvchi tizimdan chiqdi: ${user.fullName}`, 'AUTH', {
        userId: user.id,
      });
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
    // State
    currentUser,
    token,
    isLoading,
    errorMessage,

    // Getters
    isAuthenticated,
    currentRole,
    currentTenantSlug,

    // Actions
    login,
    logout,
    restoreSession,
    hasRole,
  };
});
