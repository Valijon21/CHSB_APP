# 07 — Future Django REST Framework API Contract

**Status:** Proposed contract for future backend; not implemented in this phase.

## API conventions

- Base path: `/api/v1/`
- JSON request/response bodies.
- ISO-8601 UTC timestamps.
- Pagination for collection endpoints.
- Stable machine-readable error codes.
- Explicit API versioning.
- Tenant scope enforced server-side.

## Proposed endpoint groups

### Tenant discovery/context
- `GET /api/v1/tenants/{tenant_slug}/public-context/`

Returns only public branding and availability context. It does not grant access.

### Student admission
- `POST /api/v1/tenants/{tenant_slug}/roster/lookup/`
- `POST /api/v1/tenants/{tenant_slug}/student-sessions/`

The lookup endpoint must rate-limit and avoid student enumeration. Exact credential payload remains pending decision.

### Assessments
- `GET /api/v1/tenants/{tenant_slug}/assessments/available/`
- `GET /api/v1/tenants/{tenant_slug}/assessments/{assessment_id}/`
- `POST /api/v1/tenants/{tenant_slug}/assessments/{assessment_id}/attempts/`

Student question payload must exclude correct answers and scoring secrets.

### Attempts
- `GET /api/v1/tenants/{tenant_slug}/attempts/{attempt_id}/`
- `PUT /api/v1/tenants/{tenant_slug}/attempts/{attempt_id}/answers/`
- `POST /api/v1/tenants/{tenant_slug}/attempts/{attempt_id}/submit/`

Submission should accept an `Idempotency-Key` header. Server validates ownership, tenant scope, deadline and attempt status.

### Results
- `GET /api/v1/tenants/{tenant_slug}/attempts/{attempt_id}/result/`

Only return results according to the configured release policy.

### Staff
- `GET /api/v1/tenants/{tenant_slug}/teacher/classes/`
- `GET /api/v1/tenants/{tenant_slug}/teacher/assessments/`
- `GET /api/v1/tenants/{tenant_slug}/teacher/results/`

Staff authorization and tenant membership are server-enforced.

## Standard error envelope

```json
{
  "error": {
    "code": "ROSTER_MATCH_FAILED",
    "message": "Ma’lumotlar mos kelmadi.",
    "details": {},
    "request_id": "..."
  }
}
```

Do not leak whether a student identifier exists.

## Backend invariants

- authenticated or securely admitted student can access only their own attempt;
- every attempt belongs to exactly one tenant, assessment and roster record;
- attempt deadline and submission timestamp are server-generated/validated;
- score is calculated server-side;
- tenant mismatch returns a safe denial;
- duplicate submission with same idempotency key returns the original receipt;
- correct answers are never sent to the student before policy permits release.

## Authentication note

Roster lookup is not automatically equivalent to a durable authenticated account. Django design must decide whether it creates a short-lived exam session, a signed session cookie, or another secure mechanism. Prefer secure, HttpOnly cookies where deployment topology allows; finalize CSRF/CORS/session strategy before implementation.
