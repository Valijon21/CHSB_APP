---
type: project
created: 2026-07-18
updated: 2026-07-18
---

# Technical Decisions

- Component metadata uses SemVer while the toolkit release keeps CalVer.
- `manifest.json` and `manifest.lock.json` must remain synchronized with component frontmatter.
- Logging architecture: Frontend retains up to 10,000 log entries (IndexedDB/Ring buffer) with filter & export in Tenant Admin. Backend must write persistent rotating log files (`logs/app.log`).
