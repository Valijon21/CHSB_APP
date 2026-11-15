# Folder Restructure Plan

## Overview
Separate root frontend files into dedicated `frontend/` directory, keeping `backend/` clean, isolated, and preserving full Git history.

## Project Type
FULLSTACK (Vue 3 Frontend + FastAPI Backend)

## Success Criteria
- [x] All frontend code located cleanly inside `frontend/`
- [x] Backend isolated inside `backend/`
- [x] Shared database schema inside `prisma/`
- [x] Root convenience scripts in root `package.json`
- [x] Preserved git history via `git mv`
- [x] All relative imports and configs functional
- [x] Clean Git working tree and conventional commit

## File Structure Plan
- `frontend/`
  - `src/`
  - `public/`
  - `tests/`
  - `index.html`
  - `package.json`
  - `package-lock.json`
  - `vite.config.ts`
  - `tsconfig.json`
  - `tsconfig.app.json`
  - `tsconfig.node.json`
  - `eslint.config.js`
- `backend/`
  - `app/`
  - `tests/`
  - `requirements.txt`
- `prisma/`
  - `schema.prisma`
  - `seed.ts`
- `docs/`
- `package.json` (root orchestrator)
- `README.md`
- `.gitignore`
