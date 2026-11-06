# 05 — Frontend Technical Architecture

## Stack baseline

- Vue 3
- TypeScript (strict mode)
- Vite
- Vue Router
- Pinia
- Tailwind CSS (or the existing approved styling system if repository inspection finds one)
- Zod for runtime validation at external-data boundaries
- Vitest + Vue Test Utils
- Playwright for critical user journeys
- ESLint + Prettier

Do not add libraries without a clear need. First inspect the existing repository and preserve working conventions.

## Architectural style

Feature-oriented modular monolith on the frontend. Avoid micro-frontends for this scope.

```text
src/
  app/
    router/
    providers/
    layouts/
    guards/
  features/
    tenant-context/
    student-admission/
    assessment/
    results/
    teacher/
    tenant-admin/
  entities/
    tenant/
    student/
    roster/
    assessment/
    attempt/
    result/
  shared/
    api/
    config/
    components/
    composables/
    validation/
    utils/
    styles/
  mocks/
    fixtures/
    repositories/
  tests/
```

## Dependency direction

- Views depend on feature components and feature services.
- Feature services depend on domain types and repository interfaces.
- Repository implementations depend on mock fixtures or future HTTP client.
- Domain entities must not import Vue components or mock fixture files.
- Shared modules must not import feature modules.
- Components must not call `fetch` directly.

## Repository abstraction

Define interfaces such as:
- `TenantRepository`
- `RosterRepository`
- `AssessmentRepository`
- `AttemptRepository`
- `ResultRepository`
- `TeacherRepository`

Provide mock implementations now. Later add HTTP implementations that satisfy the same interfaces. Use dependency injection/composition at app setup; avoid scattered `if (isMock)` branches.

## API client boundary

Create one future-ready HTTP client module with:
- base URL configuration;
- typed request/response boundaries;
- centralized error normalization;
- request correlation ID support;
- auth token strategy placeholder;
- tenant context header only if agreed in the API contract.

In frontend-only phase, this client may be an interface/stub and must not make network requests by default.

## State ownership

- Pinia: active tenant context, current demo student/session, assessment attempt UI state, role/layout state for prototype.
- Component state: temporary input values and local UI toggles.
- Repository cache: tenant-keyed resource data.
- localStorage: only non-sensitive draft recovery in demo mode; versioned keys and expiry.
- Never store secrets, authoritative permissions, answer keys or authoritative score in localStorage.

## Assessment timer

Frontend timer is a display/prototype aid only. It may count down from the mock session duration and warn the learner. It is not authoritative. Future backend will issue `started_at` and `deadline_at`; server validates submission time.

## Submission

Use explicit states:
`idle -> validating -> submitting_demo -> submitted_demo | failed`.

Prevent duplicate clicks in UI, but treat idempotency as a future backend responsibility. Do not label a mock submission as a verified official result.

## Error handling

Normalize errors into:
- validation;
- unauthorized;
- forbidden;
- not found;
- conflict;
- rate limited;
- unavailable;
- unknown.

Provide retry only where safe. Never retry an assessment submission blindly without an idempotency contract.
