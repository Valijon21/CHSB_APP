import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

// Layouts
import StudentEntryLayout from '../layouts/StudentEntryLayout.vue';
import StudentLayout from '../layouts/StudentLayout.vue';
import ExamLayout from '../layouts/ExamLayout.vue';
import StaffLayout from '../layouts/StaffLayout.vue';

// Views
import StudentEntryView from '../../features/student-admission/StudentEntryView.vue';
import StudentVerifyView from '../../features/student-admission/StudentVerifyView.vue';
import AssessmentInstructionsView from '../../features/assessment/AssessmentInstructionsView.vue';
import AssessmentWorkspaceView from '../../features/assessment/AssessmentWorkspaceView.vue';
import SubmissionReceiptView from '../../features/results/SubmissionReceiptView.vue';
import AssessmentResultView from '../../features/results/AssessmentResultView.vue';
import TeacherDashboardView from '../../features/teacher/TeacherDashboardView.vue';
import TeacherClassesView from '../../features/teacher/TeacherClassesView.vue';
import TeacherAssessmentsView from '../../features/teacher/TeacherAssessmentsView.vue';
import TeacherResultsView from '../../features/teacher/TeacherResultsView.vue';
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
      // Teacher / Staff Portal
      {
        path: 'teacher',
        component: StaffLayout,
        children: [
          {
            path: '',
            name: 'TeacherDashboard',
            component: TeacherDashboardView,
          },
          {
            path: 'classes',
            name: 'TeacherClasses',
            component: TeacherClassesView,
          },
          {
            path: 'assessments',
            name: 'TeacherAssessments',
            component: TeacherAssessmentsView,
          },
          {
            path: 'results',
            name: 'TeacherResults',
            component: TeacherResultsView,
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
