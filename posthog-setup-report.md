# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the TutrTalk AI tutoring application. The integration covers client-side event tracking with `posthog-js`, server-side tracking with `posthog-node`, user identification via Clerk user IDs, error tracking with `captureException`, and a reverse proxy for reliable event delivery. Ten events across eight files were instrumented, covering the full user journey from session start to report export.

## Events instrumented

| Event name | Description | File |
|---|---|---|
| `session_started` | User clicks the start button to begin a live tutoring session. | `components/app/welcome-view.tsx` |
| `session_ended` | User disconnects from a live tutoring session. | `components/app/app.tsx` |
| `chapter_selected` | User selects a chapter to study from the chapter selector popup. | `components/app/chapter-selector.tsx` |
| `book_changed` | User changes the selected book from the book selector dropdown. | `components/app/book-selector.tsx` |
| `profile_saved` | User successfully saves their student profile information. | `app/profile/page.tsx` |
| `report_exported` | User downloads their performance report as a PDF. | `app/report/page.tsx` |
| `report_customized` | User toggles chart visibility to customize their performance dashboard. | `app/report/page.tsx` |
| `transcript_searched` | User searches their past session transcripts for a keyword. | `app/progress/page.tsx` |
| `session_token_requested` | Server generates a LiveKit token, marking the start of a new tutoring session. | `app/api/token/route.ts` |
| `profile_updated` | Server records a student profile being created or updated via the API. | `app/api/profile/route.ts` |

## New files created

| File | Purpose |
|---|---|
| `instrumentation-client.ts` | Client-side PostHog initialization (Next.js 15.3+ pattern) |
| `lib/posthog-server.ts` | Singleton server-side PostHog client for API routes |

## Modified files

| File | Changes |
|---|---|
| `next.config.ts` | Added `/ingest` reverse proxy rewrites + `skipTrailingSlashRedirect` |
| `.env.local` | Added `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` |
| `components/app/app.tsx` | Added `posthog.identify()` on Clerk user load; `session_ended` capture |
| `components/app/welcome-view.tsx` | `session_started` capture on start button click |
| `components/app/chapter-selector.tsx` | `chapter_selected` capture with chapter name property |
| `components/app/book-selector.tsx` | `book_changed` capture on successful book preference save |
| `app/profile/page.tsx` | `profile_saved` capture + `captureException` on save error |
| `app/report/page.tsx` | `report_exported` with stats + `report_customized` per chart toggle + `captureException` |
| `app/progress/page.tsx` | `transcript_searched` with result count + `captureException` |
| `app/api/token/route.ts` | Server-side `session_token_requested` with Clerk user as `distinctId` |
| `app/api/profile/route.ts` | Server-side `profile_updated` with class/board/study_type properties |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) dashboard](https://us.posthog.com/project/479981/dashboard/1741840)
- [Daily tutoring sessions started](https://us.posthog.com/project/479981/insights/Vl66jOnR) — unique users per day who start a session
- [Session starts vs session ends](https://us.posthog.com/project/479981/insights/gbf0iiO9) — side-by-side to spot session drop-off
- [Chapter selections per day](https://us.posthog.com/project/479981/insights/krTBUno3) — content engagement volume
- [Profile completions over time](https://us.posthog.com/project/479981/insights/jltdiF0z) — profile saves vs session starts (onboarding conversion)
- [Report exports (last 30 days)](https://us.posthog.com/project/479981/insights/GtR0bPMH) — high-engagement signal: users who download their PDF report

## Verify before merging

- [ ] Run a full production build (`pnpm build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` and any deployment/bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — currently `posthog.identify()` is called once when the Clerk user object loads in `App`. Verify that returning users (already authenticated) also trigger this on page load, not just on fresh logins.

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
