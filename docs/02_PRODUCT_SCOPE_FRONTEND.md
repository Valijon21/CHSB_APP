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
- operates within an enterprise SaaS workspace (`StaffLayout`) with dedicated sidebar navigation;
- manages assigned classes, views class performance and drill-down class details;
- manages students roster directory, search, filter and student performance profile;
- tracks assessments, completion rates and assessment-level question analytics;
- reviews submission results, grades, provisional scores and verification statuses;
- monitors cross-class comparative analytics, participation metrics and score distribution;
- generates and exports reports (CSV/Excel format and printable views);
- inspects teacher profile, assigned subjects and notification preferences.

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
8. Teacher dashboard overview.
9. Class management & class detail view (`/classes/:classId`).
10. Student directory & student profile view (`/students/:studentId`).
11. Assessment management & assessment detail view (`/assessments/:assessmentId`).
12. Results summary & evaluation table.
13. Analytics & comparative performance view.
14. Reports generator & CSV/Excel export view.
15. Teacher profile & workspace settings.
16. Tenant-aware not-found, forbidden, unavailable and error states.

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
