# Sprint 2 Retrospective

**Sprint Duration:** ~3 days (March 11–13, 2026)
**Team:** Solo developer + AI pair programming (Claude Code)
**Outcome:** Feature-complete app deployed to production with 625+ tests and 85%+ coverage

---

## Planned vs Delivered

| Planned | Status | Notes |
|---------|--------|-------|
| Design system overhaul | Delivered | Pastel palette, Phosphor Icons, glassmorphism sidebar (#36, #47) |
| Announcements feed | Delivered | Create, pin, delete, emoji reactions (#33, #37) |
| Voting & proposals | Delivered | 3 proposal types, quorum enforcement, auto-resolution (#32, #44) |
| Calendar enhancements | Delivered | Weekly calendar, quick-add, day-of-week picker (#45) |
| Chore scheduling | Delivered | Custom day-of-week recurrence, schedule_days column (#38, #45) |
| Profile page | Delivered | User stats (points, streak, on-time rate) (#45) |
| Admin chore manager | Delivered | Reassign, delete with confirmation, filter by member (#38) |
| API documentation | Delivered | Comprehensive server actions reference (#46) |
| Production deployment | Delivered | Vercel + Supabase Cloud, Google OAuth (#35) |
| Bug fixes | Delivered | OAuth redirect loop (#51), chore scheduling (#49, #52), timezone issues |
| README | Delivered | Full project documentation |
| Realtime subscriptions | Not started | Deferred — TanStack Query invalidation sufficient for now (#34) |
| Dark mode | Not started | Deferred to future sprint (#31) |

---

## Sprint 2 Features

### Design System Overhaul (PR #36, #47)
Replaced the default UI with a custom pastel design system: warm cream backgrounds, sage green accents, glassmorphism sidebar/top bar, and Phosphor Icons throughout. Professional, cohesive look.

### Announcements Feed (PR #37)
Full CRUD for household announcements with admin-only pinning, soft delete, and 6 emoji reactions. Feed component with TanStack Query for data fetching and optimistic updates on reactions.

### Voting & Governance (PR #44)
Democratic proposal system with three types: elect admin, remove member, and custom motions. Configurable quorum thresholds, voting deadlines, and automatic resolution (early completion when all vote, expiry handling). 75+ tests covering all edge cases.

### Calendar & Scheduling Enhancements (PR #38, #45)
Weekly calendar view with navigation, inline quick-add form, and day-of-week picker for custom recurrence (e.g., Mon/Wed/Fri). Schedule_days column added to chore_templates for flexible scheduling beyond daily/weekly/monthly.

### Production Deployment (PR #51, commit ad8e050)
Deployed to Vercel with Supabase Cloud. 4 SQL migrations run on cloud DB. 8 environment variables configured. Google OAuth working with production redirect URIs. Prisma postinstall added for Vercel builds.

---

## Bug Fixes

| Bug | Root Cause | Fix | PR |
|-----|-----------|-----|-----|
| Google OAuth redirects to login | Session hydration race — new Supabase client can't see freshly-set cookies | Pass existing authenticated client to redirect logic | #51 |
| Chore creation fails | PostgREST schema cache stale after adding schedule_days column | Reload schema cache migration | #49 |
| Chores appear on wrong day | schedule_days never saved to DB; fallback to weekly recurrence creates Monday instance | Include schedule_days in insert; fetch it in ensureWeekInstances | #52 |
| Deleted chores still on calendar | Soft-delete only marks template; pending instances survive | Cancel pending instances when template is deleted | #52 |
| On-time rate always 0% | completed_at (UTC) compared to due_date (local) by naive string slice | Convert using household timezone before comparing | fix/timezone-and-misc |
| Proposal on wrong calendar day | voting_deadline::date cast uses UTC, not household timezone | AT TIME ZONE with household timezone in SQL view | aa0e214 |

---

## Metrics

### Code
- **Test files:** 50
- **Tests:** 625+
- **Coverage:** Statements 85%, Branches 81%, Functions 82%, Lines 86%
- **All thresholds (80%) exceeded**

### PRs & Issues
- **PRs merged:** 16 (Sprint 2)
- **Issues closed:** #30, #32, #33, #35, #48, #50, #11
- **Lines added:** ~14,000+
- **Lines deleted:** ~2,000+

### CI/CD
- 6-stage pipeline: lint → typecheck → test (coverage) → build → security audit → E2E
- PR preview workflow with coverage comments
- All checks green on main

---

## What Went Well

1. **Rapid feature delivery** — 5 major features (announcements, voting, calendar, scheduling, design system) shipped in 3 days with full test coverage
2. **Bug-fixing velocity** — 6 production bugs identified and fixed same-day, each with targeted tests
3. **AI pair programming** — Claude Code handled complex multi-file refactors (OAuth redirect fix, timezone-aware queries) accurately
4. **Production deployment** — Vercel + Supabase Cloud deployed smoothly; all migrations ran without issues
5. **Test coverage maintained** — Despite rapid feature development, coverage stayed above 80% thresholds throughout

## Challenges

1. **PostgREST schema cache** — Adding the schedule_days column required a schema cache reload migration; the initial workaround (omitting the column from inserts) caused a cascading bug where chores appeared on wrong days
2. **Timezone consistency** — Multiple bugs (on-time rate, proposal calendar date) traced to comparing UTC timestamps against local dates. Need a systematic approach to timezone handling
3. **Supabase dashboard automation** — Chrome extension security prevented automated SQL execution; had to use clipboard workarounds for migration deployment
4. **Vercel GitHub integration** — Automatic repo connection failed; deployed via CLI instead

## Lessons Learned

1. **Never defer column writes** — The schedule_days "omit from insert" workaround seemed safe but caused a hard-to-trace bug downstream. Always persist data properly, even if it requires extra migration steps.
2. **Timezone is a cross-cutting concern** — Should establish a project-wide convention: store UTC, convert at display/comparison time using household timezone. Three separate timezone bugs suggests this needs a utility layer.
3. **Test the full lifecycle** — The chore scheduling bug wasn't caught because tests mocked the DB layer. Integration tests that exercise the full create → navigate-week → regenerate flow would have caught it.

---

## Sprint 3 Candidates

- [ ] Eval dashboard (live metrics page)
- [ ] Supabase Realtime subscriptions (#34)
- [ ] Dark mode (#31)
- [ ] Public REST API endpoints
- [ ] More E2E test coverage
- [ ] Timezone utility layer to prevent future bugs
