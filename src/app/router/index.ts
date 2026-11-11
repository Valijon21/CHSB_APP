import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

// Layouts
import StudentEntryLayout from '../layouts/StudentEntryLayout.vue';
import StudentLayout from '../layouts/StudentLayout.vue';
import ExamLayout from '../layouts/ExamLayout.vue';
import StaffLayout from '../layouts/StaffLayout.vue';

// Views - Student & Assessment
import StudentEntryView from '../../features/student-admission/StudentEntryView.vue';
import StudentVerifyView from '../../features/student-admission/StudentVerifyView.vue';
import AssessmentInstructionsView from '../../features/assessment/AssessmentInstructionsView.vue';
import AssessmentWorkspaceView from '../../features/assessment/AssessmentWorkspaceView.vue';
import SubmissionReceiptView from '../../features/results/SubmissionReceiptView.vue';
import AssessmentResultView from '../../features/results/AssessmentResultView.vue';

// Views - Teacher Workspace
import TeacherDashboardView from '../../features/teacher/dashboard/TeacherDashboardView.vue';
import TeacherClassesView from '../../features/teacher/classes/TeacherClassesView.vue';
import TeacherClassDetailView from '../../features/teacher/classes/TeacherClassDetailView.vue';
import TeacherStudentsView from '../../features/teacher/students/TeacherStudentsView.vue';
import TeacherStudentDetailView from '../../features/teacher/students/TeacherStudentDetailView.vue';
import TeacherAssessmentsView from '../../features/teacher/assessments/TeacherAssessmentsView.vue';
import TeacherAssessmentDetailView from '../../features/teacher/assessments/TeacherAssessmentDetailView.vue';
import TeacherLiveRoomView from '../../features/teacher/proctor/TeacherLiveRoomView.vue';
import EmaktabSyncView from '../../features/emaktab/views/EmaktabSyncView.vue';
import TeacherResultsView from '../../features/teacher/results/TeacherResultsView.vue';
import TeacherAnalyticsView from '../../features/teacher/analytics/TeacherAnalyticsView.vue';
import TeacherReportsView from '../../features/teacher/reports/TeacherReportsView.vue';
import TeacherProfileView from '../../features/teacher/profile/TeacherProfileView.vue';
import RegionalOversightView from '../../features/regional-oversight/RegionalOversightView.vue';
import SchoolDirectoryView from '../../features/organization/views/SchoolDirectoryView.vue';
import LoginView from '../../features/auth/views/LoginView.vue';
import { useAuthStore } from '../../features/auth/store/authStore';
import type { UserRole } from '../../features/auth/types';
import { getActivePinia } from 'pinia';

// Views - Tenant Admin & Shared
import TenantAdminView from '../../features/tenant-admin/TenantAdminView.vue';
import NotFoundView from '../../shared/components/NotFoundView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/t/al-xorazmiy/student',
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
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
            component: StudentEntryView,
          },
          {
            path: 'verify',
            name: 'StudentVerify',
            component: StudentVerifyView,
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
                component: AssessmentInstructionsView,
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
                component: AssessmentWorkspaceView,
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
            component: SubmissionReceiptView,
          },
          {
            path: 'result',
            name: 'AssessmentResult',
            component: AssessmentResultView,
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
            component: TeacherDashboardView,
          },
          {
            path: 'classes',
            name: 'TeacherClasses',
            component: TeacherClassesView,
          },
          {
            path: 'classes/:classId',
            name: 'TeacherClassDetail',
            component: TeacherClassDetailView,
          },
          {
            path: 'students',
            name: 'TeacherStudents',
            component: TeacherStudentsView,
          },
          {
            path: 'students/:studentId',
            name: 'TeacherStudentDetail',
            component: TeacherStudentDetailView,
          },
          {
            path: 'assessments',
            name: 'TeacherAssessments',
            component: TeacherAssessmentsView,
          },
          {
            path: 'assessments/:assessmentId',
            name: 'TeacherAssessmentDetail',
            component: TeacherAssessmentDetailView,
          },
          {
            path: 'assessments/:assessmentId/live',
            name: 'TeacherLiveRoom',
            component: TeacherLiveRoomView,
          },
          {
            path: 'assessments/:assessmentId/emaktab-sync',
            name: 'TeacherEmaktabSync',
            component: EmaktabSyncView,
          },
          {
            path: 'results',
            name: 'TeacherResults',
            component: TeacherResultsView,
          },
          {
            path: 'analytics',
            name: 'TeacherAnalytics',
            component: TeacherAnalyticsView,
          },
          {
            path: 'reports',
            name: 'TeacherReports',
            component: TeacherReportsView,
          },
          {
            path: 'profile',
            name: 'TeacherProfile',
            component: TeacherProfileView,
          },
          {
            path: 'regional-oversight',
            name: 'RegionalOversight',
            component: RegionalOversightView,
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
            component: TenantAdminView,
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
    component: SchoolDirectoryView,
    meta: {
      requiresAuth: true,
      roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN'] as UserRole[],
    },
  },
  // Catch-all 404 Not Found
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView,
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
