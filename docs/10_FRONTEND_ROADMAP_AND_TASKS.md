# 10 — Frontend Roadmap and Task Backlog

## Phase 0 — Repository discovery and baseline

- [x] Inspect existing repository, package manager, scripts and current implementation.
- [x] Identify reusable components and existing routes before changing files.
- [x] Record current build/test status.
- [x] Create `docs/` and commit this approved architecture baseline.
- [x] Define branch and commit conventions.
- [x] Confirm no backend code is introduced in this phase.

## Phase 1 — Frontend foundation

- [x] Configure Vue 3 + TypeScript + Vite (only if not already present).
- [x] Enable TypeScript strict mode.
- [x] Configure Vue Router and Pinia.
- [x] Configure ESLint, Prettier and Vitest.
- [x] Establish app shell, layouts and route-level error handling.
- [x] Establish design tokens, typography, spacing and responsive breakpoints.
- [x] Build accessible shared form, button, card, alert, modal and loading components.

## Phase 2 — Domain and data boundaries

- [x] Define tenant, school, class, roster, assessment, attempt and result types.
- [x] Define repository interfaces.
- [x] Implement deterministic mock repositories.
- [x] Add two isolated tenant fixtures.
- [x] Add roster lookup scenarios (valid, invalid, inactive, ambiguous).
- [x] Add assessment availability scenarios.
- [x] Add Zod runtime schemas.
- [x] Add repository tests, including cross-tenant isolation.

## Phase 3 — Student admission

- [x] Build tenant public-context screen.
- [x] Build roster credential form.
- [x] Add client-side validation without revealing roster existence.
- [x] Build generic failure and retry states.
- [x] Build student identity confirmation screen.
- [x] Prevent tenant context changes during an active student flow.
- [x] Add E2E admission tests.

## Phase 4 — Assessment experience

- [x] Build instructions/readiness screen.
- [x] Build typed question block renderer (paragraph, image, table).
- [x] Build A/B/C/D answer component.
- [x] Build question navigator and progress summary.
- [x] Build frontend-only countdown display with warning states.
- [x] Add answer draft state and versioned demo persistence.
- [x] Build submit confirmation.
- [x] Build demo submission receipt.
- [x] Build result presentation without inventing answer key/grade rules.
- [x] Add full 15-question synthetic demo journey tests.

## Phase 5 — Teacher/admin workspace expansion

- [x] Build staff layout with responsive SaaS sidebar and tenant indicator.
- [x] Build teacher dashboard overview (KPI cards, recent activity, alerts).
- [x] Build classes management and class detail view (`/classes/:classId`).
- [x] Build students management directory, instant search, filters and student profile (`/students/:studentId`).
- [x] Build assessments management catalog and assessment detail view (`/assessments/:assessmentId`).
- [x] Build results management and evaluation summary table.
- [x] Build analytics module (cross-class comparison, score distribution, question cognitive breakdown).
- [x] Build reports module with multi-format generation (CSV/Excel download and PDF preview).
- [x] Build teacher profile and workspace notification settings.
- [x] Test tenant-scoped navigation, empty states, and cross-tenant isolation.

## Phase 6 — Hardening and handoff

- [x] Test mobile, tablet and desktop viewports.
- [x] Run accessibility checks and keyboard-only review.
- [x] Verify no direct mock imports from views/components.
- [x] Verify no answer key or secrets in student bundle.
- [x] Run typecheck, lint, unit, component and E2E suites.
- [x] Document environment variables and local run steps.
- [x] Create backend integration checklist for Django phase.
- [x] Produce final frontend demo and known-limitations report.

## Definition of phase completion

Frontend phase is complete when a synthetic learner can enter a tenant, pass roster mock verification, complete a 15-question demo assessment, submit and view a demo receipt/result; a teacher can inspect tenant-scoped mock summaries; and all quality gates pass.

## Critical dependency

Before production backend implementation, product owner must approve roster credential method, tenant hierarchy, staff roles, grading policy, answer key governance and result-release policy.
