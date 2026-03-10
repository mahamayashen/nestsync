# Sprint 1 Retrospective

**Sprint Duration:** ~2 weeks
**Team:** Solo developer + AI pair programming
**Outcome:** ✅ MVP delivered — functional household chore management app with auth, onboarding, chores, and full CI/CD

---

## Planned vs Delivered

| Planned | Status | Notes |
|---------|--------|-------|
| Data schema design (v2.0) | ✅ Delivered | 13 tables, 32 design decisions, migration SQL |
| Foundation layer | ✅ Delivered | Next.js 16, Supabase, type generation, proxy middleware |
| Auth & onboarding | ✅ Delivered | Login, signup, Google OAuth, forgot/reset password, household create/join, invite system |
| Dashboard shell | ✅ Delivered | Responsive sidebar, top bar, sign out, copy invite code |
| Chores vertical slice | ✅ Delivered | Board, create template, instance generation, complete chore, template management, role-based permissions |
| Testing infrastructure | ✅ Delivered | Vitest + Playwright, **269 tests**, 92%+ coverage, 6-stage CI/CD pipeline |
| RLS policy hardening | ✅ Delivered | Fixed cross-household data leaks, added row-level security for all tables |
| CI/CD pipeline | ✅ Delivered | GitHub Actions with lint, typecheck, tests, build, E2E, security audit |
| Documentation | ✅ Delivered | Testing & CI/CD guide, sprint retrospective, data schema docs |
| Expenses feature | ⏳ Deferred | Removed from Sprint 1 scope to focus on core features |

**Sprint 1 delivers a working MVP:** A user can sign up, create or join a household, invite roommates, create chore templates (one-time or recurring), see assigned chores on a board, complete chores, and manage templates — all with role-based permissions (admin vs member) and a responsive dashboard UI.

---

## Technical Decisions

1. **Supabase for runtime, Prisma for schema** — Using Supabase client for all queries (leveraging RLS, Auth, Realtime) while using Prisma only for schema management and migrations. This avoids the overhead of two query engines.

2. **Template-Instance pattern for chores** — Chore templates define recurring tasks, instances represent individual due dates. Batch generation (30 days ahead) with partial unique index prevents duplicates.

3. **TanStack React Query for client-side data** — `initialData` from SSR provides immediate rendering, while `useQuery` handles refetching and cache invalidation after mutations.

4. **Server Actions with Zod validation** — All mutations use Next.js Server Actions with Zod schemas for type-safe validation. Actions return `{ error?: string; success?: boolean }` for consistent error handling.

5. **`vi.hoisted()` for test mocks** — Vitest hoists `vi.mock()` calls above variable declarations. Using `vi.hoisted()` ensures mock variables are available in factory functions.

6. **ESLint 9 with native flat config** — Next.js 16 removed the `next lint` CLI command. We switched to running `eslint .` directly with ESLint 9's native flat config format (eslint-config-next v16 exports flat config arrays natively).

7. **`useSyncExternalStore` for client-only APIs** — React 19's `react-hooks/set-state-in-effect` rule flags `useState` + `useEffect` for client-only values like timezone. Using `useSyncExternalStore` is the idiomatic pattern.

---

## Testing Metrics

| Category | Files | Tests |
|----------|-------|-------|
| Unit tests (pure logic) | 7 | ~83 |
| Integration tests (server actions) | 2 | 49 |
| Component tests (React rendering) | 14 | 129 |
| E2E tests (Playwright) | 2 | 8 |
| **Total** | **25** | **269** |

### Coverage Results

| Metric | Threshold | Actual |
|--------|-----------|--------|
| Statements | 80% | 92%+ |
| Branches | 75% | 90%+ |
| Functions | 80% | 92%+ |
| Lines | 80% | 92%+ |

All thresholds exceeded by a wide margin. Coverage is enforced by the CI pipeline — PRs that drop below thresholds cannot merge.

---

## CI/CD Pipeline

6-stage GitHub Actions pipeline that runs on every push/PR to `main`:

1. **Lint** (ESLint) — catches code style and common bugs
2. **Typecheck** (tsc --noEmit) — verifies all TypeScript types
3. **Tests + Coverage** (Vitest) — runs 261 tests, enforces 80%+ thresholds
4. **Build** (next build) — catches build-time errors
5. **E2E Tests** (Playwright + Supabase) — 8 browser tests against a real app
6. **Security Audit** (audit-ci) — scans npm packages for known vulnerabilities

Additionally, a **PR Preview** workflow posts a coverage summary as a comment on every pull request.

---

## What Went Well

- **Vertical slice approach** worked excellently — building one feature end-to-end (data → actions → UI → tests) ensured all layers were proven before expanding
- **Supabase RLS** handled authorization without custom middleware; fixing RLS early prevented cross-household data leaks
- **Type generation** from Supabase kept TypeScript types in sync with the database
- **Testing infrastructure** was comprehensive — 269 tests across 4 layers with 92%+ coverage
- **Mock factory pattern** (`createMockSupabase` with chainable methods) made Supabase client testing manageable
- **CI/CD pipeline** caught real issues (E2E heading mismatch, ESLint config errors) before they reached `main`
- **AI pair programming** dramatically accelerated testing — writing 269 tests would have taken much longer solo

---

## Challenges & Lessons Learned

1. **Next.js 16 removed `next lint`** — The `lint` subcommand was removed from the CLI. `next lint` silently treated "lint" as a directory argument, failing in CI with a cryptic error. **Lesson:** Always check migration guides when upgrading major framework versions.

2. **ESLint 10 incompatibility** — `eslint-config-next` v16 is not compatible with ESLint 10's internal `scopeManager.addGlobals` API. Had to downgrade to ESLint 9. **Lesson:** Don't upgrade all dependencies at once; test each major version bump.

3. **RLS policy gaps** — Initial RLS policies allowed cross-household data access. Discovered during integration testing when mock data exposed the flaw. **Lesson:** Test authorization boundaries explicitly, not just happy paths.

4. **CI trigger issues after force-push** — GitHub Actions `pull_request` events stopped firing after force-pushes. Workaround: added `workflow_dispatch` trigger for manual runs. **Lesson:** Always include manual triggers in CI workflows.

5. **Server Action testing with `redirect()`** — Next.js `redirect()` throws a `NEXT_REDIRECT` error internally. Tests must catch this specific error to verify redirect behavior. **Lesson:** Framework internals matter when writing integration tests.

---

## What to Improve in Sprint 2

- **E2E tests with authenticated sessions** — Current E2E tests only verify page loading for unauthenticated users; need Playwright test fixtures with pre-authenticated users to test full chore workflows
- **Real-time testing strategy** — Supabase Realtime subscriptions will need testing; consider using Supabase's local instance for integration-style realtime tests
- **Seed data management** — Create dedicated test fixtures instead of relying on a shared seed script
- **Coverage for complex components** — Components like `chore-board.tsx` and `dashboard-home.tsx` have heavy data dependencies; explore better patterns for mocking server-fetched data

---

## Sprint 2 Planning

### Feature #2: Votes/Proposals
- Create proposal (with deadline)
- Vote on proposals (for/against/abstain)
- Auto-close proposals when deadline passes
- Results display with vote tallies

### Feature #3: Announcements
- Create announcement (text + optional reaction)
- Announcement feed with reactions
- Pin/unpin announcements (admin only)

### Infrastructure
- Supabase Realtime subscriptions for live updates
- Public API endpoints with documentation
- Deploy to production (Vercel + Supabase hosted)
- Sprint 2 retrospective

---

## Key Risks for Sprint 2

1. **Realtime complexity** — Supabase Realtime channels require careful subscription management and cleanup to avoid memory leaks
2. **Proposal deadline handling** — Need server-side cron or client-side polling for auto-closing expired proposals
3. **Public API design** — Need to decide on REST vs tRPC and authentication strategy for external consumers
4. **Deployment** — First production deploy may surface RLS policy issues not caught in local development; plan a staging environment first
