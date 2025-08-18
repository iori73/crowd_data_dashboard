# 1. プロジェクト共通 ‎`CLAUDE.md`（最小構成） 

## Project Overview
This repository contains a TypeScript monolith (web + API).  
Primary entry points:  
- `src/web/`  (Next.js 15)  
- `src/api/`  (Fastify 5)  

## Bash Commands
- npm run dev            # Launch both web & API with turborepo
- npm run test:unit      # Run vitest (single-file pattern is faster)
- npm run lint           # ESLint + Prettier
- npm run db:migrate     # Prisma migration runner

## Code Style
- Use ES modules, NEVER `require`
- Prefer named exports; default exports only for pages
- 2-space indent; single quotes; trailing comma = all
- IMPORTANT: run `npm run typecheck` before every commit

## Workflow
1. Ask Claude to PLAN first, then confirm TODO list.
2. After each logical unit:
   - Run tests
   - Run lint + typecheck
   - `git commit -m "$(claude-code commit-msg)"`
3. Use `/compact` when context meter >80 %.

## Testing
- Unit tests live adjacent to source: `*.test.ts`
- CI executes `npm run test:ci` (headless vitest)

## Sensitive files to avoid
- .env
- .env.*
- ./secrets/**


# 2. モノレポ / サブディレクトリ用 ‎`CLAUDE.md` 

## Package: apps/mobile  (Expo + Expo-Router)
IMPORTANT: **Do NOT run `expo prebuild`** – it breaks our custom native modules.

### Local Dev Cheatsheet
- pnpm dev:mobile     # Starts Metro bundler
- pnpm ios / pnpm android

### Style Guide
- Keep screens under `app/` folder.
- Use Tamagui for ALL UI primitives.

### Testing
- `vitest --related` on staged files only.
