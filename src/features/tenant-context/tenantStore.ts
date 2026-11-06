import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { TenantPublicContext } from '../../entities/tenant/model';
import { api } from '../../shared/api';

export const useTenantStore = defineStore('tenant', () => {
  const currentTenant = ref<TenantPublicContext | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function loadTenant(slug: string): Promise<boolean> {
    if (currentTenant.value?.tenantSlug === slug) {
      return true;
    }
    isLoading.value = true;
    error.value = null;
    try {
      const context = await api.tenant.getPublicContextBySlug(slug);
      if (!context) {
        error.value = "Muassasa topilmadi yoki faol emas.";
        currentTenant.value = null;
        return false;
      }
      currentTenant.value = context;
      return true;
    } catch {
      error.value = "Muassasa ma'lumotlarini yuklashda xatolik yuz berdi.";
      currentTenant.value = null;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  function clearTenant() {
    currentTenant.value = null;
    error.value = null;
  }

  return {
    currentTenant,
    isLoading,
    error,
    loadTenant,
    clearTenant,
  };
});

