<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Conventions & Code Quality Rules

To keep the codebase clean, robust, and maintainable across all contributing AI agents:

1. **Clean Code & Zero Bloat**:
   - Do not leave unused imports, dead variables, commented-out test code, or arbitrary `console.log` statements.
   - Do not install external libraries without explicit necessity; prefer standard Next.js, React, and native TypeScript solutions.
   - Keep files modular and avoid monolithic files (>200-300 lines should be refactored into focused sub-components).

2. **Strict TypeScript Integrity**:
   - Enforce strict typing. Avoid `any` unless strictly unavoidable with documented rationale.
   - Centralize shared interfaces and domain entities in `src/lib/types/`.

3. **Separation of Concerns**:
   - Keep UI components (`src/components/`) purely presentational where possible.
   - Encapsulate business logic, rules engine execution, and API clients in `src/lib/`.

4. **Verification Gate**:
   - Always ensure changes compile cleanly with `npx tsc --noEmit` and pass ESLint checks before considering a task complete.
