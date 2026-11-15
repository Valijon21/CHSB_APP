import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { router } from '../src/app/router';
import { useAuthStore } from '../src/features/auth/store/authStore';

describe('TASK-ARC.1..3: Dynamic Route-Level Code Splitting & Chunk Architecture', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    sessionStorage.clear();
    localStorage.clear();
  });

  it('configures dynamic lazy-loaded components for all major application routes', () => {
    const routes = router.getRoutes();

    // Verify all primary views use lazy dynamic import functions
    const lazyRouteNames = [
      'Login',
      'StudentEntry',
      'StudentVerify',
      'AssessmentInstructions',
      'AssessmentAttempt',
      'SubmissionReceipt',
      'AssessmentResult',
      'TeacherDashboard',
      'TeacherClasses',
      'TeacherClassDetail',
      'TeacherStudents',
      'TeacherStudentDetail',
      'TeacherAssessments',
      'TeacherAssessmentDetail',
      'TeacherLiveRoom',
      'TeacherEmaktabSync',
      'TeacherResults',
      'TeacherAnalytics',
      'TeacherReports',
      'TeacherProfile',
      'RegionalOversight',
      'TenantAdmin',
      'SchoolDirectory',
      'NotFound',
    ];

    for (const name of lazyRouteNames) {
      const route = routes.find((r) => r.name === name);
      expect(route, `Route ${name} should exist`).toBeDefined();
      // Component should be an async loader function
      const component = route?.components?.default;
      expect(typeof component, `Component for ${name} should be a lazy-load function`).toBe('function');
    }
  });

  it('dynamically resolves student entry view on navigation', async () => {
    await router.push('/t/al-xorazmiy/student');
    expect(router.currentRoute.value.path).toBe('/t/al-xorazmiy/student');
    expect(router.currentRoute.value.name).toBe('StudentEntry');

    const matched = router.currentRoute.value.matched;
    expect(matched.length).toBeGreaterThanOrEqual(2);
  });

  it('dynamically resolves authenticated teacher views with role guards intact', async () => {
    const authStore = useAuthStore();
    await authStore.login({
      username: 'teacher@xorazm.uz',
      password: 'teacher123',
    });

    await router.push('/t/al-xorazmiy/teacher/analytics');
    expect(router.currentRoute.value.path).toBe('/t/al-xorazmiy/teacher/analytics');
    expect(router.currentRoute.value.name).toBe('TeacherAnalytics');
  });

  it('dynamically resolves student exam workspace', async () => {
    await router.push('/t/al-xorazmiy/assessments/chsb-inf-11-q1/attempt');
    expect(router.currentRoute.value.path).toBe('/t/al-xorazmiy/assessments/chsb-inf-11-q1/attempt');
    expect(router.currentRoute.value.name).toBe('AssessmentAttempt');
  });
});

