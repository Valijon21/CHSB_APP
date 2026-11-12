import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

// Layouts
import StudentEntryLayout from '../layouts/StudentEntryLayout.vue';
import StudentLayout from '../layouts/StudentLayout.vue';
import ExamLayout from '../layouts/ExamLayout.vue';
import StaffLayout from '../layouts/StaffLayout.vue';

// Auth Store & Types
import { useAuthStore } from '../../features/auth/store/authStore';
import type { UserRole } from '../../features/auth/types';
import { getActivePinia } from 'pinia';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/t/al-xorazmiy/student',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../../features/auth/views/LoginView.vue'),
    meta: { guestOnly: true },
  },
  // Tenant Route Hierarchy
  {
    path: '/t/:tenantSlug',
    children: [
      // Student Entry Flow
      {
        path: 'student',
        component: StudentEntryLayout,
        children: [
          {
            path: '',
            name: 'StudentEntry',
            component: () => import('../../features/student-admission/StudentEntryView.vue'),
          },
          {
            path: 'verify',
            name: 'StudentVerify',
            component: () => import('../../features/student-admission/StudentVerifyView.vue'),
          },
        ],
      },
      // Assessment Journey
      {
        path: 'assessments/:assessmentId',
        children: [
          {
            path: 'instructions',
            component: StudentLayout,
            children: [
              {
                path: '',
                name: 'AssessmentInstructions',
                component: () => import('../../features/assessment/AssessmentInstructionsView.vue'),
              },
            ],
          },
          {
            path: 'attempt',
            component: ExamLayout,
            children: [
              {
                path: '',
                name: 'AssessmentAttempt',
                component: () => import('../../features/assessment/AssessmentWorkspaceView.vue'),
              },
            ],
          },
        ],
      },
      // Submission Receipts & Results
      {
        path: 'attempts/:attemptId',
        component: StudentLayout,
        children: [
          {
            path: 'receipt',
            name: 'SubmissionReceipt',
            component: () => import('../../features/results/SubmissionReceiptView.vue'),
          },
          {
            path: 'result',
            name: 'AssessmentResult',
            component: () => import('../../features/results/AssessmentResultView.vue'),
          },
        ],
      },
      // Teacher Workspace Modules
      {
        path: 'teacher',
        component: StaffLayout,
        meta: {
          requiresAuth: true,
          roles: ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] as UserRole[],
        },
        children: [
          {
            path: '',
            redirect: (to) => `/t/${to.params.tenantSlug}/teacher/dashboard`,
          },
          {
            path: 'dashboard',
            name: 'TeacherDashboard',
            component: () => import('../../features/teacher/dashboard/TeacherDashboardView.vue'),
          },
          {
            path: 'classes',
            name: 'TeacherClasses',
            component: () => import('../../features/teacher/classes/TeacherClassesView.vue'),
          },
          {
            path: 'classes/:classId',
            name: 'TeacherClassDetail',
            component: () => import('../../features/teacher/classes/TeacherClassDetailView.vue'),
          },
          {
            path: 'students',
            name: 'TeacherStudents',
            component: () => import('../../features/teacher/students/TeacherStudentsView.vue'),
          },
          {
            path: 'students/:studentId',
            name: 'TeacherStudentDetail',
            component: () => import('../../features/teacher/students/TeacherStudentDetailView.vue'),
          },
          {
            path: 'assessments',
            name: 'TeacherAssessments',
            component: () => import('../../features/teacher/assessments/TeacherAssessmentsView.vue'),
          },
          {
            path: 'assessments/:assessmentId',
            name: 'TeacherAssessmentDetail',
            component: () => import('../../features/teacher/assessments/TeacherAssessmentDetailView.vue'),
          },
          {
            path: 'assessments/:assessmentId/live',
            name: 'TeacherLiveRoom',
            component: () => import('../../features/teacher/proctor/TeacherLiveRoomView.vue'),
          },
          {
            path: 'assessments/:assessmentId/emaktab-sync',
            name: 'TeacherEmaktabSync',
            component: () => import('../../features/emaktab/views/EmaktabSyncView.vue'),
          },
          {
            path: 'results',
            name: 'TeacherResults',
            component: () => import('../../features/teacher/results/TeacherResultsView.vue'),
          },
          {
            path: 'analytics',
            name: 'TeacherAnalytics',
            component: () => import('../../features/teacher/analytics/TeacherAnalyticsView.vue'),
          },
          {
            path: 'reports',
            name: 'TeacherReports',
            component: () => import('../../features/teacher/reports/TeacherReportsView.vue'),
          },
          {
            path: 'profile',
            name: 'TeacherProfile',
            component: () => import('../../features/teacher/profile/TeacherProfileView.vue'),
          },
          {
            path: 'regional-oversight',
            name: 'RegionalOversight',
            component: () => import('../../features/regional-oversight/RegionalOversightView.vue'),
            meta: {
              requiresAuth: true,
              roles: ['SUPER_ADMIN'] as UserRole[],
            },
          },
        ],
      },
      // Tenant Admin Portal
      {
        path: 'admin',
        component: StaffLayout,
        meta: {
          requiresAuth: true,
          roles: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] as UserRole[],
        },
        children: [
          {
            path: '',
            name: 'TenantAdmin',
            component: () => import('../../features/tenant-admin/TenantAdminView.vue'),
          },
        ],
      },
      // Tenant Admin Alias/Redirect to prevent 404
      {
        path: 'tenant-admin',
        redirect: (to) => `/t/${to.params.tenantSlug}/admin`,
      },
    ],
  },
  {
    path: '/regional/oversight',
    redirect: '/t/al-xorazmiy/teacher/regional-oversight',
  },
  {
    path: '/schools',
    name: 'SchoolDirectory',
    component: () => import('../../features/organization/views/SchoolDirectoryView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN'] as UserRole[],
    },
  },
  // Catch-all 404 Not Found
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../../shared/components/NotFoundView.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ==========================================
// NAVIGATION GUARD (RBAC & AUTHENTICATION)
// ==========================================
router.beforeEach((to, _from, next) => {
  // Unit testlarda Pinia faol bo'lmasa xavfsiz o'tkazib yuborish
  if (!getActivePinia()) {
    return next();
  }

  const authStore = useAuthStore();

  // Sessiyani xotiradan tiklashga urinish
  if (!authStore.isAuthenticated) {
    authStore.restoreSession();
  }

  const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth);
  const guestOnly = to.matched.some((record) => record.meta?.guestOnly);
  const requiredRoles = to.meta?.roles as UserRole[] | undefined;

  // 1. Agar sahifa faqat mehmonlar uchun bo'lsa (masalan: /login) va foydalanuvchi allaqachon kirgan bo'lsa
  if (guestOnly && authStore.isAuthenticated) {
    if (authStore.currentRole === 'SUPER_ADMIN') {
      return next('/regional/oversight');
    } else if (authStore.currentRole === 'SCHOOL_ADMIN') {
      return next(`/t/${authStore.currentTenantSlug || 'al-xorazmiy'}/admin`);
    } else {
      return next(`/t/${authStore.currentTenantSlug || 'al-xorazmiy'}/teacher/dashboard`);
    }
  }

  // 2. Agar sahifa autentifikatsiya talab qilsa va foydalanuvchi tizimga kirmagan bo'lsa
  if (requiresAuth && !authStore.isAuthenticated) {
    return next({
      path: '/login',
      query: { redirect: to.fullPath },
    });
  }

  // 3. Agar maxsus ruxsatlar (roles) talab qilinsa va foydalanuvchi roli yetarli bo'lmasa
  if (requiresAuth && requiredRoles && requiredRoles.length > 0) {
    if (!authStore.hasRole(requiredRoles)) {
      if (authStore.currentRole === 'TEACHER') {
        return next(`/t/${authStore.currentTenantSlug || 'al-xorazmiy'}/teacher/dashboard`);
      } else if (authStore.currentRole === 'SCHOOL_ADMIN') {
        return next(`/t/${authStore.currentTenantSlug || 'al-xorazmiy'}/admin`);
      } else {
        return next('/login');
      }
    }
  }

  next();
});
