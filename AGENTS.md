# AGENTS.md — TutrTalk Web App (Next.js)

## Project Overview

Next.js 15.5 (App Router) + React 19 + TypeScript frontend for the TutrTalk voice
tutor, deployed on Vercel (tutrtalk.vercel.app).

- **Voice sessions:** LiveKit (`livekit-client`, `@livekit/components-react`,
  `@livekit/krisp-noise-filter`); server tokens via `app/api/token/route.ts`
  (`livekit-server-sdk`), Clerk-protected.
- **Auth:** Clerk (`@clerk/nextjs`, `middleware.ts`).
- **Data:** Supabase (`@supabase/supabase-js`, server service-role client in
  `lib/supabase/server.ts`) behind Next.js Route Handlers in `app/api/`.
- **Analytics:** PostHog (`posthog-js`, `posthog-node`).
- **UI:** Tailwind 4, shadcn/ui + Radix, motion, Lucide/Phosphor icons; D3 + jsPDF
  for reports.
- **Package manager:** pnpm 9.x. Node 22 in CI.

## Compute & CI Policy (STRICT — PERMANENT)

All compute-intensive processes for this repository MUST run in GitHub Actions
(`.github/workflows/build-and-test.yaml` and `sync-to-production.yaml`) — **never on
a local machine**:

- `pnpm install`, `pnpm lint`, `pnpm format:check`, and `pnpm build` run in CI on
  push/PR to `main`.
- Local sessions may edit source files and run lightweight read-only checks only
  (git inspection, small greps, quick syntax parses). They must NOT run
  `pnpm install` / `pnpm build` / `next build` / `tsc` / lint locally.
- A change is verified only when its CI run passes; quote the CI run URL as evidence.
- Production runs on Vercel, not locally.

Canonical policy: `COMPUTE-POLICY.md` at the workspace root.

## Note: build-time environment

`next build` constructs the Supabase client at module load inside `app/api/*` route
handlers, so CI passes placeholder `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
values (real values live only in Vercel). See `build-and-test.yaml`.
