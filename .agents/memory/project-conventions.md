---
type: project
created: 2026-05-25
updated: 2026-11-11
---

# Project Conventions

## Strict Execution Standard (Plan -> Tasks -> Tests -> Git)
- For every prompt, formulate a plan in `docs/`, divide into atomic tasks, write tests after every task, verify 100% test pass rate, and commit/push to Git/GitHub.
- UI/UX must meet real-world enterprise/EdTech standards (interactive charts, cognitive breakdowns, official printable reports, dark mode, WCAG 2.1 AA).

## Git Workflow
- Commit with Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`).
- Keep GitHub repository (`origin main`) always in sync with working tree after each task verification.

## Supported AI platforms (AG Kit)
- AG Kit **only supports Gemini CLI and Google Antigravity**.
- Do not claim compatibility with Claude Code, Cursor, Copilot, Windsurf, or other assistants unless the user explicitly expands scope.
- Copy on the website, docs, FAQ, README, and marketing should describe AG Kit as a toolkit for Gemini CLI / Antigravity-style agent setups.
