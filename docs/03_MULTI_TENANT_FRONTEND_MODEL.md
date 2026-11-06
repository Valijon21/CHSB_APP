# 03 — Multi-Tenant Frontend Model

## Conceptual hierarchy

Recommended initial conceptual model:

```text
Platform
└── Tenant (institution / customer)
    ├── School or Campus (optional sub-unit)
    │   └── Class / Group
    │       └── Student roster records
    ├── Assessments
    └── Results / participation views
```

This is a frontend planning model, not a finalized database schema. Whether every tenant has multiple schools must be confirmed before backend schema freeze.

## Tenant context

Represent the active tenant as a typed context:

- `tenantId`
- `tenantSlug`
- `displayName`
- `branding` (optional)
- `status`
- `capabilities` (optional feature flags returned by the future API)

Tenant context must be loaded through an application-level context provider/store, not inferred from arbitrary component props.

## Route strategy

Preferred route structure:

- `/t/:tenantSlug/student`
- `/t/:tenantSlug/student/verify`
- `/t/:tenantSlug/assessments/:assessmentId`
- `/t/:tenantSlug/results/:attemptId`
- `/t/:tenantSlug/teacher`
- `/t/:tenantSlug/teacher/classes`
- `/t/:tenantSlug/teacher/assessments`
- `/t/:tenantSlug/admin`

Tenant slug in a URL is a locator, not proof of authorization. The future API must validate membership and scope every request.

## Frontend isolation rules

- All tenant-scoped repository methods receive an explicit tenant context or use a repository instance bound to that context.
- Never keep tenant-specific records in a global unkeyed cache.
- Cache keys include tenant ID and resource ID.
- Clear tenant-scoped in-memory state when tenant context changes or the session ends.
- Do not allow a student to change tenant context after roster verification without restarting the entry flow.
- Cross-tenant staff views require explicit future permissions and server support.

## Future backend enforcement requirements

The Django backend must:
- resolve tenant membership from authenticated identity;
- apply tenant scoping to every list, retrieve, create, update and delete operation;
- reject mismatched tenant/resource IDs;
- avoid relying on a client-provided `tenant_id` as authorization;
- include tenant-isolation tests, including IDOR-style attempts;
- scope background jobs, exports, files and audit records to tenant.

## UI states

Every tenant-dependent screen must support:
- tenant loading;
- tenant not found/inactive;
- tenant unavailable;
- user not permitted;
- tenant context expired;
- empty tenant data.
