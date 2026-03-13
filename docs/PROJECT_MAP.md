# NestSync — Project Map (Living Document)

> **Version:** 2.0 | **Status:** Active | **Last Updated:** March 12, 2026
> **Authors:** [@mahamayashen](https://github.com/mahamayashen) · [@EvanjyChen](https://github.com/EvanjyChen)
> **Repository:** [github.com/mahamayashen/nestsync](https://github.com/mahamayashen/nestsync)

This document maps the **original PRD** to **what was actually built**, tracks deviations, and serves as the single source of truth for the current state of NestSync.

---

## 1. Product Summary

NestSync is a shared household management app for roommates and families. It combines chore tracking, announcements, and democratic governance into a mobile-friendly web app.

### What Changed from the PRD

| PRD Vision | Current Reality |
|---|---|
| Chores + Expenses + Announcements + Governance | Chores + Announcements + Governance (**Expenses removed**) |
| React Router + Express/Next.js API routes | **Next.js 16 App Router** (Server Actions, no REST API) |
| Zustand for state management | **TanStack React Query** (server-state caching) |
| Prisma ORM for queries | **Supabase client** for queries, Prisma for schema only |
| JWT + bcrypt auth | **Supabase Auth** (email/password + Google OAuth) |
| React 18.x | **React 19** (with `useActionState`, `useTransition`) |
| Tailwind CSS 3.x | **Tailwind CSS 4.x** |

### Why Expenses Were Removed

Expense tracking (US-04, Issues #5 and #6) was descoped during Sprint 1 due to workload constraints. The database schema still includes `expenses`, `expense_splits`, and `settlements` tables with full RLS policies — the feature is schema-ready but has **zero application code** (no UI, no server actions, no queries).

---

## 2. Tech Stack (Actual)

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | 5.x |
| UI Library | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Icons | Phosphor Icons (`@phosphor-icons/react`) | latest |
| Fonts | Nunito (headings), Inter (body), Satisfy (logo), Patrick Hand (handwritten) | via `next/font/google` |
| Server State | TanStack React Query | 5.x |
| Backend | Next.js Server Actions (no REST API) | — |
| Database | PostgreSQL via Supabase | latest |
| Schema Management | Prisma (migrations only, no query engine) | 6.x |
| Auth | Supabase Auth (email/password + Google OAuth) | — |
| Validation | Zod | 4.x |
| Testing (Unit/Integration) | Vitest + React Testing Library | latest |
| Testing (E2E) | Playwright | latest |
| CI/CD | GitHub Actions (6-stage pipeline) | — |
| Hosting | Vercel (planned) | — |

---

## 3. Feature Status Matrix

### 3.1 PRD Features → Implementation Status

| PRD Feature | Issue | Status | Notes |
|---|---|---|---|
| **Household creation & invite link** | #1 | ✅ Shipped | Create household, invite code, join via link |
| **Secure authentication** | #2 | ✅ Shipped | Email/password, Google OAuth, forgot/reset password |
| **Chore creation with recurrence** | #3 | ✅ Shipped | Template-instance model, day-of-week scheduling, one-time & recurring |
| **Mark chore complete / shared view** | #4 | ✅ Shipped | Chore board, complete button, weekly stats |
| **Log expense + split members** | #5 | ❌ Removed | Schema exists, no app code |
| **Running balance per member** | #6 | ❌ Removed | Schema exists, no app code |
| **Announcements feed** | #7 | ✅ Shipped | Create, pin/unpin, soft delete, emoji reactions |
| **Admin edit/delete any chore** | #8 | ✅ Shipped | Admin chore manager panel, reassign, delete |
| **Proposal creation + voting** | #9 | ✅ Shipped | 3 types (elect admin, remove member, custom), live countdown |
| **Voting history + outcomes** | #10 | ✅ Shipped | Vote progress bar, auto-resolution, quorum enforcement |
| **README and documentation** | #11 | ✅ Shipped | Design doc, testing guide, sprint retro, API reference, project map |

### 3.2 Features Built Beyond the PRD

| Feature | Description |
|---|---|
| **Weekly calendar view** | 7-day grid showing chore instances as events, with week navigation |
| **Calendar quick-add** | Inline form to add a one-time chore directly from a calendar day |
| **Day-of-week picker** | Custom schedule (e.g., Mon/Wed/Fri) with Daily and Weekdays presets |
| **`schedule_days` column** | Array of JS weekday numbers for flexible scheduling (beyond PRD's daily/weekly/monthly) |
| **Profile page** | Glassmorphism card with avatar/initials, role badge, sign-out |
| **My Chores page** | Personal view filtered to the current member's assigned chores |
| **Dashboard stats** | Rolling 7-day points, completion streaks, today's progress, week-over-week comparison |
| **Pastel design system** | Custom color palette (teal, cream, sage, terracotta, gold), Nunito/Inter/Satisfy/Patrick Hand fonts |
| **Glassmorphism UI** | Sidebar and top bar use frosted glass effect (`backdrop-blur-md`, translucent backgrounds, rounded cards) |
| **Google OAuth** | OAuth sign-in via Supabase Auth (not in original PRD tech stack) |
| **Chore points gamification** | Points per chore template, weekly stats leaderboard |

---

## 4. Application Architecture

### 4.1 Route Map

```
/                                    Landing page (public)
├── (auth)/
│   ├── login/                       Email/password + Google OAuth login
│   ├── signup/                      Registration with display name
│   ├── forgot-password/             Password reset request
│   ├── reset-password/              Password reset form (via email link)
│   └── onboarding/
│       ├── /                        Choice: create or join household
│       ├── create/                  Create new household (name, timezone)
│       └── join/                    Join via invite code
├── invite/[code]/                   Deep link → redirect to join flow
├── auth/callback/                   Supabase OAuth callback handler
└── (dashboard)/dashboard/
    ├── /                            Redirects to /dashboard/household (home page disabled)
    ├── chores/                      Chore board (pending, completed, overdue)
    │   ├── new/                     Create chore template form
    │   └── templates/               Template management (edit, delete)
    ├── calendar/                    Weekly calendar with events
    ├── feed/                        Announcements feed with reactions
    ├── votes/                       Proposals feed with voting
    ├── household/                   Members list + admin chore manager (default landing page)
    ├── my/                          My assigned chores (personal view)
    └── profile/                     User profile card with sign-out
```

### 4.2 Component Tree

```
Dashboard Shell (glassmorphism sidebar + top bar)
├── Sidebar
│   ├── NestSync logo
│   ├── Household name (Patrick Hand font, links to /dashboard/household)
│   └── Navigation (4 items: My Page, Calendar, Feed, Votes)
├── Top Bar (glassmorphism, mobile hamburger menu + invite code copy)
└── Page Content
    ├── ChoreBoard (grouped by status: pending/completed)
    │   ├── ChoreCard (title, assignee, points, due date)
    │   └── CompleteChoreButton (server action mutation)
    ├── CreateChoreForm (useActionState + DayOfWeekPicker)
    │   └── DayOfWeekPicker (7 day buttons + Daily/Weekdays presets)
    ├── TemplateList → TemplateCard (edit/delete templates)
    ├── WeeklyCalendar (7-day grid + WeekNavigator)
    │   ├── WeekNavigator (prev/next/today buttons)
    │   ├── CalendarEventChip (color-coded by type)
    │   └── QuickAddChore (inline form for calendar day)
    ├── AnnouncementFeed → AnnouncementCard
    │   ├── CreateAnnouncementForm
    │   └── EmojiReactions (6 emoji options)
    ├── ProposalFeed → ProposalCard
    │   ├── CreateProposalForm (3 proposal types)
    │   └── VoteProgressBar (yes/no/remaining + quorum line)
    ├── HouseholdDashboard → MemberCard
    │   └── AdminChoreManager (reassign/delete with error feedback)
    ├── MyPageDashboard (personal chore list)
    └── ProfileCard (avatar, role badge, sign-out)
```

---

## 5. Database Schema (Current State)

### 5.1 Tables

13 tables + 1 database VIEW, created across 4 migrations.

| Table | Columns | Purpose | Has App Code? |
|---|---|---|---|
| `users` | 6 | Profile data synced from Supabase Auth | ✅ |
| `households` | 12 | Household settings and invite code | ✅ |
| `household_members` | 6 | User ↔ household membership with role | ✅ |
| `admin_history` | 7 | Audit log of admin transitions | ✅ (via proposals) |
| `chore_templates` | 12 | Reusable chore definitions (+ `schedule_days`) | ✅ |
| `chore_instances` | 12 | Individual chore occurrences with completion | ✅ |
| `expenses` | 10 | Shared expense records | ❌ Schema only |
| `expense_splits` | 5 | Per-member debt splits | ❌ Schema only |
| `settlements` | 7 | Freeform payments between members | ❌ Schema only |
| `announcements` | 8 | Household feed posts | ✅ |
| `announcement_reactions` | 5 | Emoji reactions on announcements | ✅ |
| `proposals` | 12 | Governance proposals with deadlines | ✅ |
| `votes` | 5 | Individual votes on proposals | ✅ |
| `calendar_events` | VIEW | Union of chores + expenses + proposals | ✅ |

### 5.2 Migrations

| Migration | What It Does |
|---|---|
| `20260309000000_init.sql` | Creates all 13 tables, ENUMs, indexes, FK constraints, check constraints, calendar_events VIEW, auth triggers, all RLS policies, Realtime publication |
| `20260310000000_fix_rls_recursion.sql` | Fixes infinite recursion in `household_members` RLS by introducing `get_my_household_ids()` and `get_my_admin_household_ids()` helper functions |
| `20260311000000_add_schedule_days.sql` | Adds `schedule_days SMALLINT[]` column to `chore_templates` for day-of-week scheduling |
| `20260312000000_reload_schema_cache.sql` | Sends `NOTIFY pgrst, 'reload schema'` to refresh PostgREST's column cache after the `schedule_days` migration |

### 5.3 RLS Summary

All 13 tables have RLS enabled. Policies follow a consistent pattern:
- **SELECT**: Members can read data belonging to their active household
- **INSERT**: Members can insert data within their active household
- **UPDATE**: Members can update data within their active household; some tables restrict to admin role
- **DELETE**: Only `announcement_reactions` has a DELETE policy (own reactions only)

Helper functions (`get_my_household_ids()`, `get_my_admin_household_ids()`) prevent RLS recursion on `household_members`.

---

## 6. Server Actions (API Surface)

NestSync uses **Next.js Server Actions** instead of REST endpoints. All mutations go through server actions with Zod validation. All actions require authenticated user + active household membership.

### 6.1 Auth Actions (`src/lib/auth/actions.ts`)

| Action | Input | Returns | Side Effects |
|---|---|---|---|
| `login` | `FormData(email, password)` | `ActionResult` | Supabase sign-in → `getPostAuthRedirect()` → `/dashboard/household` or `/onboarding` |
| `signup` | `FormData(email, password, displayName, ?inviteCode)` | `ActionResult` | Supabase sign-up → auto-join if invite code → redirect |
| `forgotPassword` | `FormData(email)` | `ActionResult` | Sends password reset email |
| `resetPassword` | `FormData(password, confirmPassword)` | `ActionResult` | Updates password → redirect to `/login` |
| `createHousehold` | `FormData(name, timezone)` | `ActionResult` | Creates household + membership + admin_history → redirect |
| `joinHousehold` | `FormData(inviteCode)` | `ActionResult` | Validates code, checks max members → creates membership → redirect |
| `signOut` | (none) | `void` | Signs out → redirect to `/login` |

### 6.2 Chore Actions (`src/lib/chores/actions.ts`)

| Action | Input | Returns | Side Effects |
|---|---|---|---|
| `createChoreTemplate` | `FormData(title, ?description, points, recurrence, ?assignedTo, ?scheduleDays[], ?dueDate)` | `ActionResult` | Creates template + generates instances → redirect to `/dashboard/my` |
| `createChoreQuick` | Same as `createChoreTemplate` | `ActionResult` | Same as `createChoreTemplate` but returns inline (no redirect) |
| `completeChore` | `FormData(instanceId)` | `ActionResult` | Sets status=completed, completed_at, completed_by |
| `deleteChoreTemplate` | `FormData(templateId)` | `ActionResult` | Soft-deletes template (pending instances survive per D4) |
| `reassignChore` | `FormData(templateId, newAssignee)` | `ActionResult` | Updates template's `assigned_to` + reassigns future pending instances |
| `ensureWeekInstancesAction` | `weekStart: string` | `void` | Generates missing chore instances for a given week |

### 6.3 Announcement Actions (`src/lib/announcements/actions.ts`)

| Action | Input | Returns | Side Effects |
|---|---|---|---|
| `createAnnouncement` | `FormData(content)` | `ActionResult` | Inserts announcement row |
| `togglePinAnnouncement` | `FormData(announcementId)` | `ActionResult` | Toggles `is_pinned` (admin only) |
| `deleteAnnouncement` | `FormData(announcementId)` | `ActionResult` | Soft-deletes (admin or author only) |
| `toggleReaction` | `FormData(announcementId, emoji)` | `ActionResult` | Inserts or deletes reaction (toggle) |

### 6.4 Proposal Actions (`src/lib/proposals/actions.ts`)

| Action | Input | Returns | Side Effects |
|---|---|---|---|
| `createProposal` | `FormData(type, title, ?description, ?targetMemberId, ?durationHours)` | `ActionResult` | Creates proposal with voter snapshot + deadline |
| `castVote` | `FormData(proposalId, vote)` | `ActionResult` | Inserts vote, checks for early resolution, applies outcome |
| `expireProposals` | (none, internal) | `void` | Resolves proposals past deadline |

### 6.5 Proposal Resolution (`src/lib/proposals/resolution.ts`)

| Function | Purpose |
|---|---|
| `evaluateProposalOutcome` | Checks quorum + majority → returns `passed`, `failed`, or `expired` |
| `handleElectAdmin` | Transfers admin role: demotes current admin, promotes elected member, logs admin_history |
| `handleRemoveMember` | Sets `left_at` on target member, nullifies their pending chore assignments |

---

## 7. Query Functions

### 7.1 Chore Queries (`src/lib/chores/queries.ts`)

| Function | Returns | Used By |
|---|---|---|
| `getChoreInstances(householdId)` | `ChoreInstanceRow[]` | Chore board, My Chores |
| `getChoreTemplates(householdId)` | `ChoreTemplateRow[]` | Template list, Admin chore manager |
| `getWeeklyChoreStats(householdId)` | Points per member this week | Dashboard stats |
| `getCompletionStreak(memberId, householdId)` | Consecutive completion days | Dashboard stats |
| `getOnTimeRate(memberId, householdId)` | Percentage of on-time completions | Dashboard stats |
| `getWeekComparison(memberId, householdId)` | This week vs last week points | Dashboard stats |
| `getTodayProgress(memberId, householdId)` | Completed/total for today | Dashboard stats |
| `ensureWeekInstances(householdId, weekStart)` | (side effect) | Calendar page |

### 7.2 Other Queries

| Function | File | Returns |
|---|---|---|
| `getCurrentMembership()` | `src/lib/household/queries.ts` | Current user's membership (id, household, role) |
| `getHouseholdMembers(householdId)` | `src/lib/household/members.ts` | All active members with user data |
| `getCalendarEvents(householdId, start, end)` | `src/lib/calendar/queries.ts` | Events from the `calendar_events` VIEW |
| `getAnnouncements(householdId)` | `src/lib/announcements/queries.ts` | Announcements with reactions, sorted by pin+date |
| `getProposals(householdId)` | `src/lib/proposals/queries.ts` | Proposals with votes and member details |

---

## 8. Validation Schemas (Zod)

| Schema | File | Fields |
|---|---|---|
| `loginSchema` | `auth/validation.ts` | email (email), password (min 6) |
| `signupSchema` | `auth/validation.ts` | email, password (min 6), displayName (min 1, max 100), inviteCode? |
| `forgotPasswordSchema` | `auth/validation.ts` | email |
| `resetPasswordSchema` | `auth/validation.ts` | password (min 6), confirmPassword (must match) |
| `createHouseholdSchema` | `auth/validation.ts` | name (min 1, max 100), timezone (min 1) |
| `joinHouseholdSchema` | `auth/validation.ts` | inviteCode (min 1, max 20) OR householdId (UUID) |
| `createChoreTemplateSchema` | `chores/validation.ts` | title (min 1, max 200), description?, points (int ≥ 1), recurrence, assignedTo (UUID), scheduleDays? (int[] 0-6) |
| `completeChoreSchema` | `chores/validation.ts` | instanceId (UUID) |
| `deleteChoreTemplateSchema` | `chores/validation.ts` | templateId (UUID) |
| `reassignChoreSchema` | `chores/validation.ts` | templateId (UUID), newAssignee (UUID) |
| `createAnnouncementSchema` | `announcements/validation.ts` | content (min 1, max 2000) |
| `togglePinSchema` | `announcements/validation.ts` | announcementId (UUID) |
| `deleteAnnouncementSchema` | `announcements/validation.ts` | announcementId (UUID) |
| `toggleReactionSchema` | `announcements/validation.ts` | announcementId (UUID), emoji (from allowed list) |
| `createProposalSchema` | `proposals/validation.ts` | type (elect_admin/remove_member/custom), title (min 1, max 200), description? (max 2000), targetMemberId? (UUID), durationHours? (1-168) |
| `castVoteSchema` | `proposals/validation.ts` | proposalId (UUID), vote (yes/no) |

---

## 9. Business Logic (Instance Generator)

### `src/lib/chores/instance-generator.ts`

| Function | Purpose |
|---|---|
| `computeRecurrenceDates(recurrence, from, to)` | Generates dates for daily/weekly/monthly recurrence between two dates |
| `computeScheduledDates(scheduleDays, from, to)` | Generates dates for specific weekdays (e.g., Mon/Wed/Fri) between two dates |
| `getWeekBounds(date?)` | Returns Monday and Sunday of the week containing the given date |
| `formatDateForDB(date)` | Formats a Date as `YYYY-MM-DD` string for database storage |

---

## 10. Testing Summary

| Category | Files | Tests | Tools |
|---|---|---|---|
| Unit tests (pure logic) | ~9 | ~110 | Vitest |
| Integration tests (server actions) | 3 | ~70 | Vitest + mock Supabase |
| Component tests (React rendering) | ~20 | ~200 | Vitest + React Testing Library |
| E2E tests (browser) | 2 | 8 | Playwright |
| **Total** | **~50** | **~622** | — |

### Coverage Thresholds (Enforced by CI)

| Metric | Threshold | Current |
|---|---|---|
| Statements | 80% | 85%+ |
| Branches | 75% | 81%+ |
| Functions | 80% | 81%+ |
| Lines | 80% | 85%+ |

---

## 11. PRD User Stories — Acceptance Criteria Audit

### US-01: Household Setup & Authentication ✅

| Criterion | Status | How |
|---|---|---|
| Register with email and password | ✅ | `/signup` page + Supabase Auth |
| Create a named household | ✅ | `/onboarding/create` + `createHousehold` action |
| Unique shareable invite link | ✅ | `invite_code` on household, copy button in top bar |
| Household preview before joining | ⚠️ Partial | `/invite/[code]` redirects to join flow, but no preview screen showing name/member count |
| Joining via link adds to member list | ✅ | `joinHousehold` action |
| Login from any device | ✅ | Supabase session management |

### US-02: Chore Management ✅

| Criterion | Status | How |
|---|---|---|
| Create chore with title, due date, assignee | ✅ | `CreateChoreForm` + `createChoreTemplate` |
| Recurrence: one-time, daily, weekly, monthly | ✅ | Plus custom day-of-week via `schedule_days` |
| Chore appears on shared board | ✅ | `ChoreBoard` component |
| Any member can mark complete | ✅ | `CompleteChoreButton` + `completeChore` action |
| Overdue chores visually highlighted | ✅ | Red styling on past-due instances |
| Recurring chores auto-reset | ✅ | Template-instance model + `ensureWeekInstances` |

### US-03: Admin Chore Management ✅

| Criterion | Status | How |
|---|---|---|
| Admin can edit assignee of any chore | ✅ | `AdminChoreManager` + `reassignChore` action |
| Admin can delete any chore | ✅ | `AdminChoreManager` + `deleteChoreTemplate` action |
| Regular members cannot edit/delete others' chores | ✅ | `members_can_edit_own_chores` household setting |
| Deleted chores removed from views | ✅ | Soft delete with `deleted_at` filtering |

### US-04: Shared Expenses ❌ REMOVED

Not implemented. Database schema exists but no application code.

### US-05: Announcements ✅

| Criterion | Status | How |
|---|---|---|
| Any member can post announcement | ✅ | `CreateAnnouncementForm` + `createAnnouncement` |
| Reverse-chronological order | ✅ | Sorted by `is_pinned DESC, created_at DESC` |
| Shows author name, avatar, timestamp | ✅ | `AnnouncementCard` with member details |
| All members see same feed | ✅ | RLS scoped to household |

### US-06: Democratic Governance ✅

| Criterion | Status | How |
|---|---|---|
| Create proposal (elect admin, remove member, custom) | ✅ | `CreateProposalForm` + `createProposal` |
| Members can vote yes or no | ✅ | `ProposalCard` vote buttons + `castVote` |
| Voting closes after deadline or all voted | ✅ | Countdown timer + early resolution check |
| Outcome by majority | ✅ | `evaluateProposalOutcome` with quorum check |
| Proposal history visible | ✅ | `ProposalFeed` shows all proposals (active + resolved) |
| **Notifications** | ❌ | No notification system (PRD said in-app only, deferred) |

---

## 12. Open Questions Status (from PRD)

| # | Question | Resolution |
|---|---|---|
| 1 | Vote duration configurable per household or fixed? | **Configurable**: `default_vote_duration_hours` on household (default 48h), overridable per proposal |
| 2 | What happens if admin leaves? | **Auto-promote**: Longest-tenured member gets admin, tiebreaker by smallest UUID |
| 3 | Unequal splits in v1.0? | **N/A**: Expenses feature removed entirely |
| 4 | Email notifications in v1.0? | **No**: No notification system built |

---

## 13. Known Gaps & Future Work

### Pre-Deploy (Current Sprint)

- [x] Merge PR #45 (chore scheduling enhancements) — merged
- [x] Merge PR #47 (sidebar & top bar redesign) — merged
- [x] Merge PR #49 (chore creation bug fixes + home page redirect) — merged
- [ ] Debug pass (fix remaining broken flows)
- [ ] Improvement pass (UX polish)
- [ ] Complete documentation
- [ ] Deploy to Vercel + Supabase hosted

### Bugs Fixed (PR #49)

| Bug | Root Cause | Fix |
|---|---|---|
| **Chore creation fails on My Page** | `schedule_days` column missing from PostgREST schema cache after migration | Omit `schedule_days` from insert/select; use parsed form data for instance generation |
| **Calendar quick-add shows "Invalid input"** | `formData.get("description")` returns `null` for missing fields; Zod `.optional()` only accepts `undefined` | Coerce: `formData.get("description") ?? undefined` |
| **Calendar assignee sometimes missing** | Conditional hidden input for non-admin could be absent | Always render `<select>` (sr-only for non-admin) + server-side fallback to `membership.memberId` |
| **Admin delete chore confirmation hard to click** | Tiny checkmark icon as confirm button | Replaced with "Yes" text button in red |
| **Delete errors silently swallowed** | Client `handleDelete` didn't display error feedback | Added `actionError` state + error banner in `AdminChoreManager` |

### Known Discrepancies

| Issue | Severity | Detail |
|---|---|---|
| **Prisma schema out of sync** | Medium | `schedule_days SMALLINT[]` column exists in DB (migration #3) but is missing from `prisma/schema.prisma`. No corresponding Prisma migration folder. Prisma client cannot access this column. |
| **`users` RLS pattern inconsistency** | Low | `users_select_household_members` still uses the old recursive subquery pattern (not updated to use `get_my_household_ids()`). Works because it queries the fixed `household_members` table, but is stylistically inconsistent. |
| **No `admin_history` write RLS policies** | Low | Only SELECT policy exists. Writes happen via service role (server actions), so this is correct behavior but undocumented. |
| **No DELETE RLS policies on most tables** | Info | By design — app uses soft deletes (`deleted_at`/`left_at`). Only `announcement_reactions` has a DELETE policy. |
| **Proposal resolution is on-demand only** | Low | Proposals resolve when a user loads `/dashboard/votes` or when all votes are cast (early resolution). No background cron or auto-announcement to feed. |

### Post-Deploy (v1.1+)

- [ ] Invite preview screen (show household name + member count before joining)
- [ ] In-app notification system
- [ ] Auto-announce proposal outcomes in the feed
- [ ] Expense tracking (schema ready, needs UI + actions)
- [ ] Cron job for daily chore instance generation (currently triggered on page load)
- [ ] Supabase Realtime subscriptions for live updates
- [ ] Admin history display (audit log UI)
- [ ] Member removal/leave flow (leave household button)
- [ ] Chore template editing (currently create-only, can delete/reassign but not edit title/points)
