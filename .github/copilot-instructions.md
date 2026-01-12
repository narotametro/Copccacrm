


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
