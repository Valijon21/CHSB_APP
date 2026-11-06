# 12 — Acceptance Criteria

## Student entry

- [ ] Student can open a tenant-specific URL.
- [ ] Tenant context is displayed and unavailable tenant state is clear.
- [ ] Student can submit the agreed mock roster credential.
- [ ] Invalid lookup returns a generic message that does not disclose whether a roster record exists.
- [ ] Valid match displays only minimum identity details.
- [ ] Student must confirm the displayed identity before continuing.

## Assessment

- [ ] Assessment instructions display subject, grade, duration, question count and maximum score.
- [ ] Assessment renders text, image and table question blocks safely.
- [ ] Student can select one A/B/C/D option per question.
- [ ] Student can navigate between questions without losing answers.
- [ ] Progress and answered count remain accurate.
- [ ] Timer is visibly marked as demo/frontend-only.
- [ ] Submission requires confirmation.
- [ ] Duplicate submit interaction is prevented in the UI.
- [ ] Result/receipt is clearly marked demo when generated from mocks.

## Multi-tenant

- [ ] At least two synthetic tenants exist in fixtures.
- [ ] Tenant A roster and assessment records are not returned in tenant B context.
- [ ] Tenant change clears scoped state.
- [ ] Cache keys include tenant identity.
- [ ] Staff prototype always shows active tenant context.

## Teacher prototype

- [ ] Teacher can view mock class and assessment summaries.
- [ ] Empty and error states are implemented.
- [ ] Demo data is clearly labeled.
- [ ] No cross-tenant data is visible through normal navigation.

## Engineering

- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Unit/component tests pass.
- [ ] Critical E2E flows pass.
- [ ] Build passes.
- [ ] No real student data, credentials or answer keys in client assets.
- [ ] UI components do not import mock fixtures directly.
- [ ] No backend dependency is required to run the demo.
