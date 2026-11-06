# CHSB Platform — Frontend Phase Pack (V2)

**Status:** Approved architecture baseline  
**Current delivery:** Frontend only  
**Frontend:** Vue 3 + TypeScript + Vite  
**Future backend:** Python Django + Django REST Framework  
**Platform model:** Multi-tenant  
**Student admission:** Roster-based

## Purpose

This pack supersedes the initial planning assumptions where they conflict with the decisions above. It prepares the project for a professional frontend implementation now and a Django backend later, without coupling the UI to mock data or weakening tenant isolation.

## Documents

1. `01_APPROVED_DECISIONS.md` — confirmed decisions and implications.
2. `02_PRODUCT_SCOPE_FRONTEND.md` — frontend scope, actors, flows and exclusions.
3. `03_MULTI_TENANT_FRONTEND_MODEL.md` — tenant-aware UX and isolation requirements.
4. `04_ROSTER_ADMISSION_FLOW.md` — student identity and roster-based entry.
5. `05_FRONTEND_TECHNICAL_ARCHITECTURE.md` — Vue architecture, modules and boundaries.
6. `06_DOMAIN_TYPES_AND_MOCK_CONTRACTS.md` — frontend domain types and mock contract.
7. `07_FUTURE_DJANGO_API_CONTRACT.md` — backend-ready API contract proposal.
8. `08_UI_UX_AND_ROUTE_SPEC.md` — route map, layouts and screen behavior.
9. `09_SECURITY_PRIVACY_AND_TESTING.md` — frontend security and quality gates.
10. `10_FRONTEND_ROADMAP_AND_TASKS.md` — phased implementation backlog.
11. `11_ANTIGRAVITY_FRONTEND_EXECUTION_PROMPT.md` — execution instructions for an agent.
12. `12_ACCEPTANCE_CRITERIA.md` — definition of done and release gates.

## Non-negotiable implementation rules

- Build and run the frontend without requiring a backend.
- Use typed mock repositories behind interfaces; components must not import mock JSON directly.
- Keep tenant context explicit in application state and API request contracts.
- Never trust a tenant ID, school ID, role, roster ID, score or deadline supplied only by the browser.
- Do not ship correct answers or scoring secrets in the student-facing bundle.
- Do not treat localStorage as an authoritative identity, authorization, timer or submission store.
- Preserve the original CHSB assessment facts from the source audit: 11th grade Informatics and IT, I quarter 1-CHSB, 15 questions, 40 points, 40 minutes. Any changes require a product decision.
- Do not invent the missing answer key or the meanings of source labels `(B)`, `(Q)`, `(M)`.

## Suggested implementation sequence

Start with Phase 0 repository inspection and setup, then the design system and app shell, then student roster entry, assessment taking, result view, and finally the teacher/admin prototype. The backend integration must remain a separate future phase.
