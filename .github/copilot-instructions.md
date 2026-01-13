# COPCCA-CRM: AI Coding Agent Instructions

This file contains the minimal, actionable knowledge an AI coding agent needs to be productive in this repository. Keep edits small and repo-consistent.

Architecture
- Frontend: React + TypeScript + Vite. Routing and app entry are in [src/App.tsx](src/App.tsx) and [src/main.tsx](src/main.tsx).
- State: Zustand only. See `useAuthStore` in [src/store/authStore.ts](src/store/authStore.ts) — follow `useXStore` naming.
- Backend: Supabase (Postgres + Auth + Realtime). Client is [src/lib/supabase.ts](src/lib/supabase.ts). DB schema, RLS, and migrations live in root SQL files (e.g. [database-setup.sql](database-setup.sql)).
- UI: Atomic components under [src/components/ui/], layouts under [src/components/layout/], pages under [src/pages/]. Use Tailwind utility classes.

Developer Workflows (explicit)
- Install: `npm install` (Node 18+ required).
- Env: copy `.env.example` → `.env`. Required vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Dev server: `npm run dev` (Vite). Default dev port shown in console (usually 5173).
- Build: `npm run build` (runs `tsc` then `vite build`).
- Preview: `npm run preview`.
- Lint: `npm run lint` (ESLint configured strictly; fix issues pre-merge).

Key Patterns & Conventions
- Pages: add a file in `src/pages/` and register route in [src/App.tsx](src/App.tsx). Update navigation in [src/components/layout/AppLayout.tsx](src/components/layout/AppLayout.tsx) when adding new pages.
- Auth: `useAuthStore.initialize()` is invoked at app start (see [src/App.tsx](src/App.tsx)); preserve the auth-loading UX. Use `supabase` for auth-related ops (`src/lib/supabase.ts`).
- UI components: keep them in `src/components/ui/` and reuse `Button`, `Card`, `Input` patterns.
- Types: extend DB types in [src/lib/types/database.ts](src/lib/types/database.ts) when creating typed queries.

Integration Points & Examples
- Supabase client: import from [src/lib/supabase.ts](src/lib/supabase.ts). Example: profile fetch in [src/store/authStore.ts](src/store/authStore.ts).
- AI Assistant: [src/components/layout/AIAssistant.tsx](src/components/layout/AIAssistant.tsx)
  - Behavior: reads OpenAI API key from `system_settings` table row where `key = 'openai_api_key'` and falls back to demo text when missing.
  - To enable full AI locally: create a `system_settings` row with the OpenAI key in your local Supabase, or adapt the component to read from an env var for testing only.
- PWA: configured via [vite.config.ts](vite.config.ts) and [public/manifest.json](public/manifest.json).

Practical Rules for the Agent
- Make minimal, well-scoped changes. Follow file placement and naming conventions.
- Do not introduce Redux or React Context for global state.
- When adding routes, update both [src/App.tsx](src/App.tsx) and app navigation ([src/components/layout/AppLayout.tsx](src/components/layout/AppLayout.tsx)).
- Database schema changes must be provided as SQL migration files at repository root (e.g. database-migration-upgrade.sql). Do not modify the live DB directly.
- Secrets: do not commit secrets. AIAssistant expects OpenAI key in DB; prefer creating a `system_settings` row in local Supabase for testing.
- Run `npm run lint` and `npm run build` locally (or in CI) before creating a PR — `tsc` is part of build and can fail the build.

When to ask for human help
- Any change that requires modifying RLS policies, altering authentication flows, or writing migrations that could impact existing data.
- If a task needs access to a Supabase project (to seed `system_settings`, verify RLS, or run migrations), request credentials or a DB dump.

Files to reference when working
- App entry & routes: [src/App.tsx](src/App.tsx)
- Auth store: [src/store/authStore.ts](src/store/authStore.ts)
- Supabase client: [src/lib/supabase.ts](src/lib/supabase.ts)
- AI assistant UI: [src/components/layout/AIAssistant.tsx](src/components/layout/AIAssistant.tsx)
- UI components: [src/components/ui/Button.tsx](src/components/ui/Button.tsx), [src/components/ui/Card.tsx](src/components/ui/Card.tsx)
- DB schema & policies: [database-setup.sql](database-setup.sql)

If you want me to expand any section (DB migrations, add-a-page checklist, or wiring CI), tell me which area to expand.



# COPCCA-CRM: AI Coding Agent Instructions

## Architecture & Data Flow

- **Frontend:** React (TypeScript) with Vite. State managed exclusively via Zustand ([src/store/authStore.ts]), never Redux or Context API.
- **Backend/Data:** Supabase (PostgreSQL, Auth, Realtime). All data and auth flows through [src/lib/supabase.ts].
- **Routing:** React Router ([src/App.tsx]), with all `/app` routes protected by `ProtectedRoute` and rendered in `DashboardLayout`.
- **UI:** Custom atomic components ([src/components/ui/]), layouts ([src/components/layout/]), and pages ([src/pages/]).
- **PWA:** Vite PWA plugin ([vite.config.ts]), manifest ([public/manifest.json]).
- **AI Assistant:** Floating UI ([src/components/layout/AIAssistant.tsx]); demo only, not connected to backend.
- **RBAC:** Roles (`admin`, `manager`, `user`) enforced in both DB ([database-setup.sql]) and UI.

## Developer Workflows

- **Setup:**
  1. `npm install`
  2. Copy `.env.example` → `.env` and set Supabase keys
  3. Run [database-setup.sql] in Supabase
- **Start Dev Server:** `npm run dev` (default port 5174)
- **Build:** `npm run build` (output: `dist/`)
- **Preview:** `npm run preview`
- **Lint:** `npm run lint` (strict ESLint)
- **Database:** All schema/migrations in root SQL files
- **CI/CD:** See [DEPLOYMENT.md] for Vercel/Netlify setup, GitHub Actions example

## Project Conventions & Patterns

- **File Structure:**
  - [src/pages/]: route views (one per module, e.g. `Dashboard.tsx`, `Customers.tsx`)
  - [src/components/ui/]: atomic UI components (e.g. `Button.tsx`, `Card.tsx`)
  - [src/components/layout/]: app shell, navigation, AI assistant
  - [src/store/]: Zustand stores (auth only)
  - [src/lib/]: Supabase client, types
- **Naming:**
  - Pages: PascalCase, match route/module name
  - Zustand stores: `useXStore` naming (e.g. `useAuthStore`)
  - Types/interfaces: PascalCase
- **Design System:** Tailwind utility classes, gradients, glassmorphism ([tailwind.config.js])
- **No Redux/Context API:** Only Zustand for global state
- **Env Vars:** Use `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Integration Points

- **Supabase:** All data, auth, and real-time events ([src/lib/supabase.ts])
- **AI Assistant:** UI only ([src/components/layout/AIAssistant.tsx]); backend integration needed for production
- **PWA:** Vite PWA plugin ([vite.config.ts]), manifest ([public/manifest.json])

## Extension & Module Patterns

- **Add a new module:**
  1. Create page in [src/pages/]
  2. Add route in [src/App.tsx]
  3. Add navigation in [src/components/layout/AppLayout.tsx]
  4. Add types in [src/lib/types/database.ts] if needed
- **Add UI component:** Place in [src/components/ui/], use Tailwind for styling
- **Auth logic:** [src/store/authStore.ts], [src/lib/supabase.ts]
- **Database types:** [src/lib/types/database.ts]

## Examples

- **Protected Route:** All `/app` routes are protected in [src/App.tsx] and use `DashboardLayout`.
- **Zustand Store:** See [src/store/authStore.ts] for authentication state and logic.
- **Supabase Client:** See [src/lib/supabase.ts] for client setup and usage.
- **RBAC:** Role logic is enforced in both UI and DB (see [database-setup.sql]).

## Quick Reference

- [README.md]: Full documentation
- [CONTRIBUTING.md]: Code standards, naming, workflow
- [database-setup.sql]: Database schema, RLS policies
- [DEPLOYMENT.md]: Deployment, CI/CD, environment setup

---
If any section is unclear or missing, ask the user for feedback to iterate further.
