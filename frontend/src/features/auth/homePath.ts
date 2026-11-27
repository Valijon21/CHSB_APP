import type { UserRole } from './types';

/** Landing page of each role after sign-in */
export function homePathFor(role: UserRole | null, tenantSlug?: string | null): string {
  const slug = tenantSlug || 'al-xorazmiy';
  if (role === 'SUPER_ADMIN') return '/regional/oversight';
  if (role === 'REGIONAL_INSPECTOR') return `/t/${slug}/teacher/regional-oversight`;
  if (role === 'SCHOOL_ADMIN') return `/t/${slug}/admin`;
  return `/t/${slug}/teacher/dashboard`;
}
