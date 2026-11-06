# 04 — Roster-Based Student Admission

## Purpose

Students are admitted only when a matching pre-provisioned roster record exists. The current frontend phase demonstrates this flow with mock records; it does not verify real identity.

## Proposed student journey

1. Student opens a tenant-specific entry link or selects a tenant.
2. Frontend loads tenant display context from mock repository.
3. Student enters the agreed roster lookup credential.
4. Frontend sends lookup data to the mock roster repository.
5. If a unique eligible match exists, show limited identity details for confirmation.
6. Student confirms they are the displayed learner.
7. Frontend creates a demo assessment session and navigates to instructions.
8. Student starts assessment after reviewing instructions.

## Credential design — pending decision

Do not assume that first name, surname, school and class are sufficient verification. A production system should use a roster code or another controlled credential, potentially combined with a PIN or date-of-birth check where legally and operationally appropriate. The exact method requires a security/product decision.

Do not expose full roster lists or allow student enumeration. Mock UX should return generic errors such as “Ma’lumotlar mos kelmadi” rather than revealing whether a particular student exists.

## Suggested frontend DTOs

`RosterLookupRequest`:
- `tenantSlug`
- `rosterCode`
- optional `verificationCode` (only after product decision)

`RosterMatch`:
- `rosterRecordId`
- `displayName`
- `schoolName`
- `className`
- `eligibilityStatus`
- `availableAssessmentIds`

Only the minimum identity fields needed for confirmation should be shown.

## Error states

- invalid or incomplete input;
- no matching eligible roster entry;
- duplicate/ambiguous match (must not auto-select);
- roster entry inactive;
- assessment not available;
- tenant not available;
- too many attempts (prototype simulation only);
- network/mock repository failure.

## Future Django behavior

The server must perform lookup, rate limiting, eligibility validation and session creation. The browser must never decide that a learner is eligible. Avoid returning unnecessary personal data. Log security-relevant lookup outcomes without logging raw secrets.
