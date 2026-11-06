# 06 — Domain Types and Mock Contracts

## Domain objects

Use branded or clearly named IDs to avoid mixing resource identifiers.

- `Tenant`
- `School`
- `ClassGroup`
- `StudentRosterRecord`
- `Assessment`
- `Question`
- `QuestionOption`
- `AssessmentAttempt`
- `AnswerDraft`
- `SubmissionReceipt`
- `AssessmentResult`

## Question content

Questions may contain text, image and table content. Prefer typed content blocks rather than arbitrary HTML:

```ts
type QuestionBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'image'; assetId: string; alt: string }
  | { type: 'table'; columns: string[]; rows: string[][] };
```

Question model should include:
- `id`
- `order`
- `blocks`
- `options`
- `points`
- `interactionType`

Do not include `correctOptionId`, answer explanations that reveal answers, scoring secrets or hidden teacher-only metadata in student-facing fixtures/bundles.

## Example contracts

```ts
type TenantContext = {
  tenantId: string;
  tenantSlug: string;
  displayName: string;
  status: 'active' | 'inactive';
};

type RosterLookupRequest = {
  tenantSlug: string;
  rosterCode: string;
};

type RosterMatch = {
  rosterRecordId: string;
  displayName: string;
  schoolName: string;
  className: string;
  eligibilityStatus: 'eligible' | 'inactive' | 'not_available';
};

type AssessmentSummary = {
  id: string;
  title: string;
  subject: string;
  grade: number;
  durationSeconds: number;
  questionCount: number;
  maxScore: number;
  status: 'draft' | 'scheduled' | 'available' | 'closed';
};

type SubmissionReceipt = {
  attemptId: string;
  status: 'received_demo' | 'received';
  submittedAt: string;
  message: string;
};
```

These are frontend examples and must be refined against final backend API schemas.

## Mock repository requirements

- deterministic fixtures;
- at least two tenants with deliberately different classes and students;
- tenant A IDs must never resolve under tenant B;
- scenarios for valid, invalid, inactive and ambiguous roster lookups;
- assessment states: scheduled, available, closed;
- mock network latency configurable for loading-state tests;
- injectable failures for error-state tests;
- fixture data clearly marked as synthetic.

## Runtime validation

Validate mock/API data at repository boundaries with Zod. TypeScript types alone do not validate runtime JSON.

## Fixture privacy

Never use real student personal data in fixtures. Use synthetic names and identifiers.
