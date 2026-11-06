# 09 — Security, Privacy and Testing

## Frontend security boundaries

The frontend is an untrusted client. UI guards improve experience but do not authorize access.

- Do not treat route guards as security.
- Do not trust tenant slug, tenant ID, role or roster ID from browser state.
- Do not embed correct answers or scoring secrets.
- Do not expose complete roster lists to students.
- Avoid raw `v-html`; render typed question blocks.
- Sanitize and validate external content at boundaries.
- Never log roster credentials, tokens or sensitive student data.
- Use synthetic fixtures only.
- Clear tenant/student context on logout, session end or tenant change.
- Do not put credentials or tokens in localStorage.

## Privacy-by-design

Collect and display only data needed for the assessment. Student identity fields and retention periods must be finalized with the institution and applicable local requirements before production. The frontend prototype must not use real student data.

## Testing layers

### Unit
- domain validators;
- timer display calculations;
- assessment navigation and answer selection;
- tenant cache-key generation;
- roster lookup result mapping.

### Component
- roster form validation and generic error;
- identity confirmation;
- question renderer for text/image/table;
- question navigator;
- submission confirmation;
- responsive navigation.

### Integration
- tenant context -> roster lookup -> identity confirmation -> assessment;
- answer draft survives route navigation;
- mock failure and retry states;
- switching tenant clears tenant-scoped state.

### End-to-end
- valid roster admission;
- invalid roster admission without enumeration leak;
- complete 15-question assessment demo;
- submit confirmation and receipt;
- closed assessment cannot be started;
- mobile viewport exam journey;
- teacher views only current tenant's mock data and assigned classes;
- teacher cannot access cross-tenant student profiles or class details;
- teacher analytics and reports strictly isolate tenant datasets;
- mock report exports (CSV/Excel) generate sanitized, tenant-scoped records.

## Quality gates

- TypeScript strict checks pass.
- ESLint and formatting pass.
- Unit/component/E2E critical tests pass.
- No secrets or answer keys in built student assets.
- No direct mock fixture imports from Vue views/components.
- No cross-tenant fixture leakage in repository tests.
- Keyboard-only student journey is usable.
