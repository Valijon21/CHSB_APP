import { httpClient } from '../httpClient';
import type { TenantRepository } from '../repositories/TenantRepository';
import type { Tenant, TenantPublicContext } from '../../../entities/tenant/model';
import type { BackendTenantContext, BackendTenantItem } from './types';

const DEFAULT_TENANT_CONTEXTS: Record<string, TenantPublicContext> = {
  'al-xorazmiy': {
    tenantId: 'tenant-al-xorazmiy',
    tenantSlug: 'al-xorazmiy',
    displayName: 'Muhammad al-Xorazmiy nomidagi ixtisoslashtirilgan IT-maktab',
    status: 'active',
  },
  'temurbeklar-maktabi': {
    tenantId: 'tenant-temurbeklar',
    tenantSlug: 'temurbeklar-maktabi',
    displayName: 'Temurbeklar Maktabi Harbiy-Akademik Litseyi',
    status: 'active',
  },
};

export class RealTenantRepository implements TenantRepository {
  async getPublicContextBySlug(slug: string): Promise<TenantPublicContext | null> {
    try {
      const data = await httpClient.get<BackendTenantContext>(`/tenants/${slug}/context`);
      return {
        tenantId: data.tenantId,
        tenantSlug: data.tenantSlug,
        displayName: data.schoolName,
        status: 'active',
      };
    } catch {
      return DEFAULT_TENANT_CONTEXTS[slug] || null;
    }
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    try {
      const data = await httpClient.get<BackendTenantItem>(`/tenants/${id}`);
      return {
        id: data.id,
        slug: data.slug,
        name: data.name,
        status: 'active',
        features: ['assessments', 'proctoring', 'analytics'],
        branding: { primaryColor: '#059669' },
      };
    } catch {
      return null;
    }
  }

  async getAllTenants(): Promise<Tenant[]> {
    try {
      const list = await httpClient.get<BackendTenantItem[]>('/tenants');
      return list.map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        status: 'active',
        features: ['assessments', 'proctoring', 'analytics'],
        branding: { primaryColor: '#059669' },
      }));
    } catch {
      return [];
    }
  }
}

