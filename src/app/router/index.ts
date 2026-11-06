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
import TeacherResultsView from '../../features/teacher/results/TeacherResultsView.vue';
import TeacherAnalyticsView from '../../features/teacher/analytics/TeacherAnalyticsView.vue';
import TeacherReportsView from '../../features/teacher/reports/TeacherReportsView.vue';
import TeacherProfileView from '../../features/teacher/profile/TeacherProfileView.vue';

// Views - Tenant Admin & Shared
import TenantAdminView from '../../features/tenant-admin/TenantAdminView.vue';
import NotFoundView from '../../shared/components/NotFoundView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/t/al-xorazmiy/student',
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
        ],
      },
      // Tenant Admin Portal
      {
        path: 'admin',
        component: StaffLayout,
        children: [
          {
            path: '',
            name: 'TenantAdmin',
            component: TenantAdminView,
          },
        ],
      },
    ],
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
