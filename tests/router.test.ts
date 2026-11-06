import { describe, it, expect } from 'vitest';
import { router } from '../src/app/router';

describe('Router Configuration', () => {
  it('should have tenant-aware routes defined', () => {
    const routes = router.getRoutes();
    const routeNames = routes.map((r) => r.name).filter(Boolean);

    expect(routeNames).toContain('StudentEntry');
    expect(routeNames).toContain('StudentVerify');
    expect(routeNames).toContain('AssessmentInstructions');
    expect(routeNames).toContain('AssessmentAttempt');
    expect(routeNames).toContain('SubmissionReceipt');
    expect(routeNames).toContain('AssessmentResult');
    expect(routeNames).toContain('TeacherDashboard');
    expect(routeNames).toContain('TeacherClasses');
    expect(routeNames).toContain('TeacherAssessments');
    expect(routeNames).toContain('TeacherResults');
    expect(routeNames).toContain('TenantAdmin');
    expect(routeNames).toContain('NotFound');
  });

  it('should redirect root / to default tenant student entry', async () => {
    await router.push('/');
    expect(router.currentRoute.value.path).toBe('/t/al-xorazmiy/student');
  });
});
