# 02 — Product Scope: Frontend Phase

## Product objective

Deliver a polished, accessible, responsive CHSB assessment frontend that can demonstrate the complete student assessment journey using controlled mock data, while keeping the future Django integration straightforward.

## User groups

### Student
- enters through the institution/tenant context;
- is matched to a preloaded roster record;
- confirms displayed identity/class details;
- sees available assessment information;
- completes an assessment with progress and visible time;
- submits and sees a result/receipt state.

### Teacher
- views classes and eligible learners in a tenant;
- sees assessment participation and result summaries in prototype mode;
- can inspect a learner's submission/result presentation where permitted.

### Tenant administrator
- sees tenant-scoped overview and configuration placeholders;
- manages the conceptual structure of schools/classes/rosters in the prototype;
- does not perform real server-side mutations in this phase.

### Platform administrator
- cross-tenant administration is a future backend capability;
- do not expose a global tenant browser in the student application.

## MVP screens

1. Student entry / tenant context.
2. Roster verification.
3. Student identity confirmation.
4. Assessment instructions and readiness.
5. Assessment workspace: question navigation, answer selection, timer display, progress.
6. Submission confirmation.
7. Result / submission receipt.
8. Teacher dashboard prototype.
9. Class roster prototype.
10. Assessment and result list prototypes.
11. Tenant-aware not-found, forbidden, unavailable and error states.

## Assessment facts preserved from source

- Subject: Informatics and IT.
- Grade: 11.
- Period: I quarter.
- Assessment label: 1-CHSB.
- Question count: 15.
- Maximum score: 40.
- Duration: 40 minutes.
- Question style shown: single-choice A/B/C/D.
- Content may include text, images and tables.

The source HTML does not provide a verified answer key in the visible question data. Do not create one or embed one in the student app.

## Out of scope in frontend phase

- real multi-tenant enforcement;
- real roster provisioning/import;
- real student authentication/identity verification;
- authoritative server timer and deadline;
- scoring and grading engine;
- production report exports;
- payment/subscription;
- notifications;
- actual Django/DRF implementation;
- production deployment and operational monitoring.

## UX principles

- Student journey should be focused and distraction-free.
- Student must always understand the current assessment, remaining time, answered count and submission state.
- Never silently discard an answer draft.
- Distinguish `demo/mock` state from a real submitted assessment.
- Teacher/admin prototype must visibly indicate that data is sample data.
