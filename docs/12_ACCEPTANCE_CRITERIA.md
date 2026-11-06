# 12 — Acceptance Criteria

## Student entry

- [x] Student can open a tenant-specific URL.
- [x] Tenant context is displayed and unavailable tenant state is clear.
- [x] Student can submit the agreed mock roster credential.
- [x] Invalid lookup returns a generic message that does not disclose whether a roster record exists.
- [x] Valid match displays only minimum identity details.
- [x] Student must confirm the displayed identity before continuing.

## Assessment

- [x] Assessment instructions display subject, grade, duration, question count and maximum score.
- [x] Assessment renders text, image and table question blocks safely.
- [x] Student can select one A/B/C/D option per question.
- [x] Student can navigate between questions without losing answers.
- [x] Progress and answered count remain accurate.
- [x] Timer is visibly marked as demo/frontend-only.
- [x] Submission requires confirmation.
- [x] Duplicate submit interaction is prevented in the UI.
- [x] Result/receipt is clearly marked demo when generated from mocks.

## Multi-tenant

- [x] At least two synthetic tenants exist in fixtures.
- [x] Tenant A roster and assessment records are not returned in tenant B context.
- [x] Tenant change clears scoped state.
- [x] Cache keys include tenant identity.
- [x] Staff prototype always shows active tenant context.

## Teacher prototype

- [x] Teacher can view mock class and assessment summaries.
- [x] Empty and error states are implemented.
- [x] Demo data is clearly labeled.
- [x] No cross-tenant data is visible through normal navigation.

## Engineering

- [x] Typecheck passes.
- [x] Lint passes.
- [x] Unit/component tests pass.
- [x] Critical E2E flows pass.
- [x] Build passes.
- [x] No real student data, credentials or answer keys in client assets.
- [x] UI components do not import mock fixtures directly.
- [x] No backend dependency is required to run the demo.
