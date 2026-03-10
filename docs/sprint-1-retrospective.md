# Sprint 1 Retrospective

**Sprint Duration:** ~2 weeks
**Team:** Solo developer + AI pair programming

---

## Planned vs Delivered

| Planned | Status | Notes |
|---------|--------|-------|
| Data schema design (v2.0) | Delivered | 13 tables, 32 design decisions, migration SQL |
| Foundation layer | Delivered | Next.js 16, Supabase, type generation, proxy middleware |
| Auth & onboarding | Delivered | Login, signup, Google OAuth, forgot/reset password, household create/join, invite system |
| Dashboard shell | Delivered | Responsive sidebar, top bar, sign out, copy invite code |
| Chores vertical slice | Delivered | Board, create template, instance generation, complete chore, template management |
| Testing infrastructure | Delivered | Vitest, Playwright, 160+ tests, CI/CD pipeline |
| Expenses feature | Deferred | Removed from scope to focus on core features |

---

## Technical Decisions

1. **Supabase for runtime, Prisma for schema** - Using Supabase client for all queries (leveraging RLS, Auth, Realtime) while using Prisma only for schema management and migrations. This avoids the overhead of two query engines.

2. **Template-Instance pattern for chores** - Chore templates define recurring tasks, instances represent individual due dates. Batch generation (30 days ahead) with partial unique index prevents duplicates.

3. **TanStack React Query for client-side data** - `initialData` from SSR provides immediate rendering, while `useQuery` handles refetching and cache invalidation after mutations.

4. **Server Actions with Zod validation** - All mutations use Next.js Server Actions with Zod schemas for type-safe validation. Actions return `{ error?: string; success?: boolean }` for consistent error handling.

5. **`vi.hoisted()` for test mocks** - Vitest hoists `vi.mock()` calls above variable declarations. Using `vi.hoisted()` ensures mock variables are available in factory functions.

---

## Testing Metrics

| Category | Test Count | Coverage Area |
|----------|-----------|---------------|
| Unit tests (pure logic) | ~62 | Validation schemas, date generation |
| Integration tests (server actions) | ~50 | Auth actions, chore actions, DB mocks |
| Component tests (UI) | ~40 | Form fields, cards, nav, buttons |
| E2E tests (Playwright) | ~7 | Auth flow, chore pages |
| **Total** | **~160+** | |

**Coverage target:** 80% statements, 75% branches, 80% functions/lines

---

## What Went Well

- **Vertical slice approach** worked excellently - building one feature end-to-end ensured all layers (data, actions, UI) were proven before expanding
- **Supabase RLS** handled authorization without custom middleware
- **Type generation** from Supabase kept TypeScript types in sync with the database
- **Testing infrastructure** was straightforward to set up with Vitest + Testing Library
- **Mock factory pattern** (`createChain`) made Supabase client testing manageable

---

## What to Improve

- **Coverage gaps in complex components** - Components like `chore-board.tsx` and `dashboard-home.tsx` have heavy data dependencies that make isolated testing harder
- **E2E tests need auth setup** - Currently E2E tests can only verify page loading without authenticated sessions; need to implement test fixtures with pre-authenticated users
- **No real-time testing** - Supabase Realtime subscriptions are deferred but will need testing strategy
- **Seed data management** - Tests rely on specific seed data; should create dedicated test fixtures

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
- Deploy to production
- Sprint 2 retrospective

---

## Key Risks for Sprint 2

1. **Realtime complexity** - Supabase Realtime channels require careful subscription management and cleanup
2. **Proposal deadline handling** - Need server-side cron or client-side polling for auto-closing expired proposals
3. **Public API design** - Need to decide on REST vs tRPC and authentication strategy for external consumers
4. **Deployment** - First production deploy may surface RLS policy issues not caught in local development
