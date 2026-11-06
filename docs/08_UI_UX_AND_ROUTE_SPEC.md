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
| `/t/:tenantSlug/teacher` | StaffLayout | Teacher overview |
| `/t/:tenantSlug/teacher/classes` | StaffLayout | Class list |
| `/t/:tenantSlug/teacher/assessments` | StaffLayout | Assessment list |
| `/t/:tenantSlug/teacher/results` | StaffLayout | Results prototype |
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
