# 08 — UI/UX and Route Specification

## Visual direction

A modern, trustworthy educational assessment interface. Prioritize readability, calm focus, clear hierarchy and strong responsive behavior over decorative effects.

## Route map

| Route | Layout | Purpose |
|---|---|---|
| `/t/:tenantSlug/student` | StudentEntryLayout | Start roster admission |
| `/t/:tenantSlug/student/verify` | StudentEntryLayout | Verify roster match |
| `/t/:tenantSlug/assessments/:assessmentId/instructions` | StudentLayout | Instructions and readiness |
| `/t/:tenantSlug/assessments/:assessmentId/attempt` | ExamLayout | Assessment workspace |
| `/t/:tenantSlug/attempts/:attemptId/receipt` | StudentLayout | Submission receipt |
| `/t/:tenantSlug/attempts/:attemptId/result` | StudentLayout | Result view |
| `/t/:tenantSlug/teacher` | StaffLayout | Teacher workspace redirect |
| `/t/:tenantSlug/teacher/dashboard` | StaffLayout | Teacher overview KPI dashboard |
| `/t/:tenantSlug/teacher/classes` | StaffLayout | Classes management list |
| `/t/:tenantSlug/teacher/classes/:classId` | StaffLayout | Class drilldown & student roster |
| `/t/:tenantSlug/teacher/students` | StaffLayout | Student directory, search & filters |
| `/t/:tenantSlug/teacher/students/:studentId` | StaffLayout | Student profile & exam history |
| `/t/:tenantSlug/teacher/assessments` | StaffLayout | Assessment catalog & filters |
| `/t/:tenantSlug/teacher/assessments/:assessmentId` | StaffLayout | Assessment details & questions breakdown |
| `/t/:tenantSlug/teacher/results` | StaffLayout | Results & provisional scoring table |
| `/t/:tenantSlug/teacher/analytics` | StaffLayout | Comparative analytics, KPIs & charts |
| `/t/:tenantSlug/teacher/reports` | StaffLayout | Report generator & CSV/Excel export |
| `/t/:tenantSlug/teacher/profile` | StaffLayout | Teacher profile & workspace settings |
| `/t/:tenantSlug/admin` | StaffLayout | Tenant admin prototype |

## Exam workspace

Must include:
- assessment title and subject;
- visible remaining-time indicator;
- answered / total count;
- question navigator;
- one question focus area;
- accessible answer controls;
- previous/next navigation;
- clear selected-answer state;
- submit action with confirmation;
- responsive layout for narrow screens.

Avoid:
- accidental answer reset on navigation;
- hidden submit action on mobile;
- relying on color alone for selected/answered states;
- rendering untrusted HTML from question content.

## Accessibility

- semantic headings and landmarks;
- keyboard-operable controls;
- visible focus ring;
- labels for all inputs;
- sufficient contrast;
- announce timer warnings and validation errors without excessive screen-reader noise;
- support zoom and small viewport widths.

## Required UI states

Every data-driven page needs loading, empty, error and retry states. Admission and assessment pages also need invalid, expired, unavailable and completed states.
