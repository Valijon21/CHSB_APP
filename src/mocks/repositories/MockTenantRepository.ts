import type { TenantRepository } from '../../shared/api/repositories/TenantRepository';
import type { Tenant, TenantPublicContext } from '../../entities/tenant/model';
import { mockTenants, toTenantPublicContext } from '../fixtures/tenants';

export class MockTenantRepository implements TenantRepository {
  private tenants: Tenant[];
  private latencyMs: number;

  constructor(tenants = mockTenants, latencyMs = 0) {
    this.tenants = tenants;
    this.latencyMs = latencyMs;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }

  async getPublicContextBySlug(slug: string): Promise<TenantPublicContext | null> {
    await this.delay();
    const tenant = this.tenants.find((t) => t.slug === slug);
    if (!tenant) return null;
    return toTenantPublicContext(tenant);
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    await this.delay();
    const tenant = this.tenants.find((t) => t.id === id);
    return tenant || null;
  }

  async getAllTenants(): Promise<Tenant[]> {
    await this.delay();
    return [...this.tenants];
  }
}
