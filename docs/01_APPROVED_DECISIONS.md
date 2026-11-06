# 01 — Approved Decisions

## Decision register

| ID | Decision | Status | Consequence |
|---|---|---|---|
| ADR-001 | Platform is multi-tenant | Approved | Organization/school context is a first-class concept. |
| ADR-002 | Student access is roster-based | Approved | Students are admitted against pre-created roster records, not open public signup. |
| ADR-003 | Future backend is Django + DRF | Approved | API contract and domain boundaries should be compatible with Django REST Framework. |
| ADR-004 | Current delivery is frontend only | Approved | No Django project, database, server endpoints or backend business logic in this phase. |
| ADR-005 | Frontend uses Vue 3 + TypeScript + Vite | Baseline | Feature-oriented Vue application with typed boundaries. |

## Multi-tenant meaning

A tenant represents an institution/customer boundary. A tenant may contain one or more schools/campuses depending on the eventual operating model. The frontend must support:
- tenant branding/configuration where supplied;
- tenant-scoped login or entry context;
- tenant-scoped class, roster, assessment and result screens;
- switching tenant context only for authorized staff users;
- clear empty, loading, unavailable and access-denied states.

The frontend is not the security boundary. The future backend must derive and enforce tenant scope from authenticated identity and server-side membership.

## Roster meaning

A roster is a pre-provisioned list of eligible learners associated with a tenant, school, class/group and assessment window or cohort. A roster record may be matched using a student code plus an additional verification factor. The exact verification method remains a product/security decision and must not be invented in code.

## Backend decision

Django + DRF is the selected future backend. FastAPI is not part of the current plan. Do not introduce a second backend framework without a new architecture decision.

## Frontend-only boundary

Allowed now:
- Vue screens, navigation, form validation and responsive UX;
- typed domain models and API DTO interfaces;
- mock repositories and deterministic fixtures;
- simulated loading/error/empty states;
- local draft persistence for non-sensitive answer drafts, with clear limitations;
- unit, component, accessibility and end-to-end tests.

Not allowed now:
- a real authentication server;
- real student identity verification;
- real tenant authorization;
- authoritative timing/scoring/grading;
- persistent production submissions;
- claims that mock data is real or secure.

## Open decisions intentionally not guessed

- tenant = school, school network, district, or another institution grouping;
- whether tenant has multiple schools/campuses;
- roster lookup credential format and second factor;
- roster import source and duplicate resolution policy;
- staff roles and permissions matrix;
- grade thresholds and score-to-grade formula;
- answer key and scoring rubric;
- meanings of `(B)`, `(Q)`, `(M)` in the source HTML;
- whether offline exam taking is permitted.
