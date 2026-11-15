import type { Tenant, TenantPublicContext } from '../../../entities/tenant/model';

export interface TenantRepository {
  getPublicContextBySlug(slug: string): Promise<TenantPublicContext | null>;
  getTenantById(id: string): Promise<Tenant | null>;
  getAllTenants(): Promise<Tenant[]>;
}
