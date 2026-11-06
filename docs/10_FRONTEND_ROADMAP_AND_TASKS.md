# 10 — Frontend Roadmap and Task Backlog

## Phase 0 — Repository discovery and baseline

- [x] Inspect existing repository, package manager, scripts and current implementation.
- [x] Identify reusable components and existing routes before changing files.
- [x] Record current build/test status.
- [x] Create `docs/` and commit this approved architecture baseline.
- [x] Define branch and commit conventions.
- [x] Confirm no backend code is introduced in this phase.

## Phase 1 — Frontend foundation

- [ ] Configure Vue 3 + TypeScript + Vite (only if not already present).
- [ ] Enable TypeScript strict mode.
- [ ] Configure Vue Router and Pinia.
- [ ] Configure ESLint, Prettier and Vitest.
- [ ] Establish app shell, layouts and route-level error handling.
- [ ] Establish design tokens, typography, spacing and responsive breakpoints.
- [ ] Build accessible shared form, button, card, alert, modal and loading components.

## Phase 2 — Domain and data boundaries

- [ ] Define tenant, school, class, roster, assessment, attempt and result types.
- [ ] Define repository interfaces.
- [ ] Implement deterministic mock repositories.
- [ ] Add two isolated tenant fixtures.
- [ ] Add roster lookup scenarios (valid, invalid, inactive, ambiguous).
- [ ] Add assessment availability scenarios.
- [ ] Add Zod runtime schemas.
- [ ] Add repository tests, including cross-tenant isolation.

## Phase 3 — Student admission

- [ ] Build tenant public-context screen.
- [ ] Build roster credential form.
- [ ] Add client-side validation without revealing roster existence.
- [ ] Build generic failure and retry states.
- [ ] Build student identity confirmation screen.
- [ ] Prevent tenant context changes during an active student flow.
- [ ] Add E2E admission tests.

## Phase 4 — Assessment experience

- [ ] Build instructions/readiness screen.
- [ ] Build typed question block renderer (paragraph, image, table).
- [ ] Build A/B/C/D answer component.
- [ ] Build question navigator and progress summary.
- [ ] Build frontend-only countdown display with warning states.
- [ ] Add answer draft state and versioned demo persistence.
- [ ] Build submit confirmation.
- [ ] Build demo submission receipt.
- [ ] Build result presentation without inventing answer key/grade rules.
- [ ] Add full 15-question synthetic demo journey tests.

## Phase 5 — Teacher/admin prototype

- [ ] Build staff layout and tenant context indicator.
- [ ] Build teacher overview.
- [ ] Build class list.
- [ ] Build roster list prototype with synthetic data.
- [ ] Build assessment list and status filters.
- [ ] Build results summary prototype.
- [ ] Add visible demo-data labels.
- [ ] Test tenant-scoped navigation and empty states.

## Phase 6 — Hardening and handoff

- [ ] Test mobile, tablet and desktop viewports.
- [ ] Run accessibility checks and keyboard-only review.
- [ ] Verify no direct mock imports from views/components.
- [ ] Verify no answer key or secrets in student bundle.
- [ ] Run typecheck, lint, unit, component and E2E suites.
- [ ] Document environment variables and local run steps.
- [ ] Create backend integration checklist for Django phase.
- [ ] Produce final frontend demo and known-limitations report.

## Definition of phase completion

Frontend phase is complete when a synthetic learner can enter a tenant, pass roster mock verification, complete a 15-question demo assessment, submit and view a demo receipt/result; a teacher can inspect tenant-scoped mock summaries; and all quality gates pass.

## Critical dependency

Before production backend implementation, product owner must approve roster credential method, tenant hierarchy, staff roles, grading policy, answer key governance and result-release policy.
