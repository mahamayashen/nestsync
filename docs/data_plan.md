# NestSync — Data Plan

> **Version:** 2.0 | **Status:** Draft | **Last Updated:** March 9, 2026
> **Derived from:** PRD v1.0 + data modeling Q&A sessions + critique review

---

## Table of Contents

1. [Design Decisions Summary](#1-design-decisions-summary)
2. [Entity Overview](#2-entity-overview)
3. [Table Definitions](#3-table-definitions)
4. [Relationships Diagram](#4-relationships-diagram)
5. [Key Constraints & Business Rules](#5-key-constraints--business-rules)
6. [Index Strategy](#6-index-strategy)
7. [Computed Values (No Materialized Columns)](#7-computed-values-no-materialized-columns)
8. [Calendar Events VIEW](#8-calendar-events-view)
9. [Chore Instance Batch Generation](#9-chore-instance-batch-generation)
10. [Supabase Realtime Considerations](#10-supabase-realtime-considerations)
11. [Open Design Notes](#11-open-design-notes)

---

## 1. Design Decisions Summary

These decisions were made during the data modeling Q&A and govern the schema design.

| # | Decision | Rationale |
|---|---|---|
| D1 | **Chores use a template → instance model** | History matters — need to track completion counts, points earned per week, stats over time |
| D2 | **Each chore has a `points` value** | Gamification layer — households can weight chores by effort |
| D3 | **Chore edit permissions are a household-level setting** | `members_can_edit_own_chores` (boolean). When `false`, only admin can edit/delete chores |
| D4 | **Orphaned chore instances survive template deletion** | If a template is soft-deleted, pending instances remain active and must still be completed |
| D5 | **Expenses use on-the-fly balance computation** | No materialized balance column. Balances derived from `expense_splits` and `settlements` at query time |
| D6 | **Rounding errors are randomized** | When splitting equally, the extra cent(s) are assigned to random member(s) per expense |
| D7 | **Settlements are freeform payments (model C)** | `settlements` table with `from_member`, `to_member`, `amount`. Not tied to specific expenses |
| D8 | **Proposals require minimum voter participation** | Configurable `min_vote_participation` threshold on household (e.g., 0.5 = 50% must vote) |
| D9 | **Majority = majority of those who voted** | Not majority of all members — only those who cast a vote count toward the result |
| D10 | **Members can vote on their own proposals** | Including proposals where they are the target (admin election, removal) |
| D11 | **Only one admin-election proposal active at a time** | Prevents conflicting concurrent elections |
| D12 | **Always exactly one admin per household** | Default admin = household creator. If admin is removed by vote, longest-tenured member is auto-promoted. **Tiebreaker: smallest UUID** |
| D13 | **Admin history is preserved** | `admin_history` table logs every admin transition with reason |
| D14 | **Household creator can't leave until a new admin is elected** | Exception: if they are the sole member, they can delete the household |
| D15 | **Invite link is a simple token on the household** | Single `invite_code` column — no separate invitations table. Multi-use, no expiry for v1.0 |
| D16 | **Soft deletes everywhere** | `deleted_at` timestamp pattern on all entities. Members use `left_at` instead |
| D17 | **Max household size: 10 members** | Enforced at application level on join |
| D18 | **Member records persist after leaving** | Financial and chore history remains intact. `left_at` marks departure, record is never hard-deleted |
| D19 | **Supabase Realtime subscriptions** | Used for live updates on chore completions, vote counts, announcements, expense changes |
| D20 | **Payer is NEVER in expense_splits** | `expense_splits` only contains debts owed TO the payer. Payer's own share is implicitly absorbed. This eliminates self-debt in balance queries |
| D21 | **Flexible expense split modes** | `split_type` ENUM on expenses: `equal` (auto-compute), `exact` (manual amounts). UI supports selecting members with/without payer for equal splits, or typing exact amounts per person |
| D22 | **Expense category tracking** | Nullable `category` column on expenses for filtering/reporting (groceries, utilities, rent, etc.) |
| D23 | **Points credited to the person who actually completes the chore** | `completed_by` gets the points, not `assigned_to`. Both tracked for assigned-vs-actual stats |
| D24 | **Single-household membership enforced** | `UNIQUE(user_id) WHERE left_at IS NULL` — a user can only be active in ONE household at a time (multi-household is out of scope) |
| D25 | **Default vote duration: 48 hours** | `default_vote_duration_hours` on households, proposal creators can override |
| D26 | **Household timezone required** | `timezone` column on households for consistent overdue calculations and calendar rendering |
| D27 | **Batch-generate chore instances 30 days ahead** | Cron job generates instances; calendar view reads directly from `chore_instances` table. `UNIQUE(template_id, due_date) WHERE status = 'pending'` prevents duplicates |
| D28 | **Calendar events via database VIEW** | Normalized `calendar_events` view unions chore instances, expenses, and proposal deadlines for efficient calendar queries |
| D29 | **Members who leave have pending chores unassigned** | `assigned_to` set to NULL on pending instances; shown on an "unassigned chores" board for admin to reassign |
| D30 | **New members who join mid-vote cannot vote** | They are not counted in `eligible_voter_count` and are rejected from voting on pre-existing active proposals |
| D31 | **Cross-household settlement validation** | Application-level + DB check: `from_member` and `to_member` must belong to the same `household_id` as the settlement record |
| D32 | **Announcements support pinning and reactions** | `is_pinned` boolean on announcements (admin-only), separate `announcement_reactions` table for emoji reactions |

---

## 2. Entity Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         NestSync Entities                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  users ──────────┐                                               │
│                  │                                               │
│           household_members ──┬── households                     │
│                  │            │                                   │
│          ┌───────┼────────────┼──────────┐                       │
│          │       │            │          │                        │
│   chore_templates│    announcements  proposals                   │
│          │       │         │            │                         │
│   chore_instances│  announcement_   votes                        │
│                  │   reactions                                    │
│          expenses│              admin_history                     │
│          │       │                                               │
│   expense_splits │                                               │
│                  │                                               │
│       settlements│                                               │
│                                                                  │
│                   + calendar_events (VIEW)                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

Total: 13 tables + 1 database VIEW
```

---

## 3. Table Definitions

### 3.1 `users`

Linked to Supabase Auth. Stores profile data only — authentication is handled by Supabase.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, matches Supabase Auth `auth.users.id` | |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | From Supabase Auth |
| `display_name` | VARCHAR(100) | NOT NULL | |
| `avatar_url` | TEXT | NULLABLE | Optional profile image |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

---

### 3.2 `households`

The core "nest" — a shared living space.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `name` | VARCHAR(100) | NOT NULL | e.g., "Apartment 4B" |
| `invite_code` | VARCHAR(20) | UNIQUE, NOT NULL | Simple shareable token (D15) |
| `max_members` | INTEGER | NOT NULL, DEFAULT 10 | Cap at 10 (D17) |
| `members_can_edit_own_chores` | BOOLEAN | NOT NULL, DEFAULT TRUE | Household-level setting (D3) |
| `min_vote_participation` | FLOAT | NOT NULL, DEFAULT 0.5 | 0.0–1.0, e.g., 0.5 = 50% must vote (D8) |
| `default_vote_duration_hours` | INTEGER | NOT NULL, DEFAULT 48 | Default voting window for new proposals (D25) |
| `timezone` | VARCHAR(50) | NOT NULL, DEFAULT 'America/New_York' | IANA timezone for overdue checks and calendar rendering (D26) |
| `created_by` | UUID | FK → users(id), NOT NULL | Household creator |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `deleted_at` | TIMESTAMPTZ | NULLABLE | Soft delete (D16) |

---

### 3.3 `household_members`

Join table between users and households. **Never hard-deleted** — `left_at` marks departure (D18).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Stable FK target for all member references |
| `household_id` | UUID | FK → households(id), NOT NULL | |
| `user_id` | UUID | FK → users(id), NOT NULL | |
| `role` | ENUM('member', 'admin') | NOT NULL, DEFAULT 'member' | Current role (D12) |
| `joined_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Used for tenure ranking (D12 auto-promote) |
| `left_at` | TIMESTAMPTZ | NULLABLE | NULL = active member |

**Unique constraint (D24):** `UNIQUE(user_id) WHERE left_at IS NULL` — a user can only be an active member of ONE household at a time. Multi-household is out of scope for v1.0.

**Secondary unique constraint:** `UNIQUE(household_id, user_id) WHERE left_at IS NULL` — prevents duplicate active memberships in the same household.

> **Why `id` as PK instead of composite key?** Every other table references the *membership*, not the user directly. A stable `household_members.id` simplifies FKs on chores, expenses, votes, etc. and ensures historical references remain valid even after a member leaves.

---

### 3.4 `admin_history`

Audit log of every admin transition (D13).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `household_id` | UUID | FK → households(id), NOT NULL | |
| `member_id` | UUID | FK → household_members(id), NOT NULL | The admin |
| `started_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `ended_at` | TIMESTAMPTZ | NULLABLE | NULL = current admin |
| `reason` | ENUM('household_created', 'elected', 'auto_promoted', 'predecessor_left') | NOT NULL | How they became admin |
| `proposal_id` | UUID | FK → proposals(id), NULLABLE | Non-null if `reason = 'elected'` |

---

### 3.5 `chore_templates`

The reusable definition of a chore. Recurring chores generate instances from this template (D1).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `household_id` | UUID | FK → households(id), NOT NULL | |
| `title` | VARCHAR(200) | NOT NULL | e.g., "Clean kitchen" |
| `description` | TEXT | NULLABLE | Optional details |
| `points` | INTEGER | NOT NULL, DEFAULT 1 | Effort weight for stats (D2) |
| `recurrence` | ENUM('one_time', 'daily', 'weekly', 'monthly') | NOT NULL | |
| `assigned_to` | UUID | FK → household_members(id), NOT NULL | Default assignee for new instances |
| `created_by` | UUID | FK → household_members(id), NOT NULL | Who created this template |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `deleted_at` | TIMESTAMPTZ | NULLABLE | Soft delete. Pending instances survive (D4) |

---

### 3.6 `chore_instances`

Individual occurrences of a chore. Created from templates. Tracks actual completion (D1).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `template_id` | UUID | FK → chore_templates(id), NULLABLE | NULL if template was hard-deleted (defensive) |
| `household_id` | UUID | FK → households(id), NOT NULL | Denormalized for query performance |
| `title` | VARCHAR(200) | NOT NULL | Snapshot from template at creation time |
| `points` | INTEGER | NOT NULL | Snapshot from template at creation time |
| `assigned_to` | UUID | FK → household_members(id), **NULLABLE** | NULL = unassigned (D29: set to NULL when assignee leaves) |
| `due_date` | DATE | NOT NULL | |
| `status` | ENUM('pending', 'completed', 'cancelled') | NOT NULL, DEFAULT 'pending' | |
| `completed_at` | TIMESTAMPTZ | NULLABLE | When it was marked done |
| `completed_by` | UUID | FK → household_members(id), NULLABLE | Who actually did it — gets the points (D23) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Tracks status reversals and reassignments |

**Idempotency constraint (D27):** `UNIQUE(template_id, due_date) WHERE status = 'pending'` — prevents duplicate pending instances for the same template and date. Guards against race conditions in both batch generation and completion-triggered generation.

> **Why snapshot `title` and `points`?** If the template is later edited or deleted, historical instances retain the values they were created with. This ensures stats are accurate retrospectively.

> **Why `assigned_to` is NULLABLE (D29)?** When a member leaves the household, their pending chore instances have `assigned_to` set to NULL. These appear on the "Unassigned Chores" board for the admin to reassign. Completed historical instances retain the original `assigned_to` value.

---

### 3.7 `expenses`

A shared expense logged by a household member.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `household_id` | UUID | FK → households(id), NOT NULL | |
| `title` | VARCHAR(200) | NOT NULL | e.g., "March internet bill" |
| `amount` | DECIMAL(10,2) | NOT NULL, CHECK(amount > 0) | Total amount the payer paid |
| `paid_by` | UUID | FK → household_members(id), NOT NULL | Who fronted the money |
| `split_type` | ENUM('equal', 'exact') | NOT NULL, DEFAULT 'equal' | How the expense was split (D21) |
| `category` | VARCHAR(50) | NULLABLE | e.g., 'groceries', 'utilities', 'rent', 'entertainment' (D22) |
| `expense_date` | DATE | NOT NULL | When the expense occurred |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `deleted_at` | TIMESTAMPTZ | NULLABLE | Soft delete (D16) |

> **Split modes (D21):**
> - `equal` — App auto-computes: `floor(amount / n)` per selected member, remaining cents distributed randomly (D6). The payer selects which members to split with (can include or exclude themselves). If payer includes themselves, their share reduces what others owe (e.g., $100 / 3 people = $33.33 each; only the 2 non-payer splits are stored, each at $33.33).
> - `exact` — Payer manually enters what each selected member owes. Sum may be less than `amount` (payer absorbs the remainder).

---

### 3.8 `expense_splits`

Per-member debt owed to the payer. **The payer is NEVER included in this table (D20).**

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `expense_id` | UUID | FK → expenses(id), NOT NULL | |
| `member_id` | UUID | FK → household_members(id), NOT NULL | Who owes this amount to the payer |
| `amount` | DECIMAL(10,2) | NOT NULL, CHECK(amount > 0) | What they owe the payer |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Unique constraint:** `(expense_id, member_id)` — one split per member per expense.

**Validation rules (application-level):**
- `member_id != expense.paid_by` — payer never in their own splits (D20)
- `SUM(expense_splits.amount) <= expense.amount` — total debts cannot exceed what was paid
- For `equal` splits: rounding via `floor(total_share / n)` + random cent distribution (D6)

> **Why the payer is excluded (D20):** The payer's "share" is implicit — it's `expense.amount - SUM(splits)`. This eliminates self-debt in balance queries and simplifies the running balance calculation. When the payer includes themselves in an equal split, the math divides by N people but only stores N-1 split rows (excluding the payer's portion).

---

### 3.9 `settlements`

Freeform payments between members to reduce balances (D7).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `household_id` | UUID | FK → households(id), NOT NULL | |
| `from_member` | UUID | FK → household_members(id), NOT NULL | Who is paying |
| `to_member` | UUID | FK → household_members(id), NOT NULL | Who is receiving |
| `amount` | DECIMAL(10,2) | NOT NULL, CHECK(amount > 0) | |
| `note` | VARCHAR(200) | NULLABLE | Optional memo, e.g., "Venmo'd you for groceries" |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `deleted_at` | TIMESTAMPTZ | NULLABLE | Soft delete (D16) |

**Check constraints:**
- `from_member != to_member` — can't settle with yourself

**Application-level validation (D31):**
- Both `from_member` and `to_member` must belong to the same household as `household_id`
- Enforced via a pre-insert check: `SELECT 1 FROM household_members WHERE id IN (:from, :to) AND household_id = :household_id` must return 2 rows

---

### 3.10 `announcements`

Shared household feed posts.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `household_id` | UUID | FK → households(id), NOT NULL | |
| `author_id` | UUID | FK → household_members(id), NOT NULL | |
| `content` | TEXT | NOT NULL, CHECK(length(content) > 0) | Plain text for v1.0 |
| `is_pinned` | BOOLEAN | NOT NULL, DEFAULT FALSE | Only admin can pin/unpin (D32) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `deleted_at` | TIMESTAMPTZ | NULLABLE | Soft delete (D16) |

> **Feed ordering:** Pinned announcements float to the top (sorted by `created_at DESC` within pinned group), followed by unpinned announcements in reverse-chronological order.

---

### 3.11 `announcement_reactions`

Emoji reactions on announcements (D32). Lightweight engagement layer.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `announcement_id` | UUID | FK → announcements(id), NOT NULL | |
| `member_id` | UUID | FK → household_members(id), NOT NULL | Who reacted |
| `emoji` | VARCHAR(10) | NOT NULL | Single emoji character/sequence (e.g., '👍', '❤️', '😂') |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Unique constraint:** `(announcement_id, member_id, emoji)` — one reaction of each type per member per announcement.

---

### 3.12 `proposals`

Governance proposals: admin elections, member removal, or custom motions (D8, D9, D11).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `household_id` | UUID | FK → households(id), NOT NULL | |
| `type` | ENUM('elect_admin', 'remove_member', 'custom') | NOT NULL | |
| `title` | VARCHAR(200) | NOT NULL | |
| `description` | TEXT | NULLABLE | |
| `target_member_id` | UUID | FK → household_members(id), NULLABLE | Required for `elect_admin` and `remove_member` |
| `created_by` | UUID | FK → household_members(id), NOT NULL | |
| `status` | ENUM('active', 'passed', 'failed', 'expired') | NOT NULL, DEFAULT 'active' | |
| `eligible_voter_count` | INTEGER | NOT NULL | Snapshot of active member count at creation |
| `min_participation_threshold` | FLOAT | NOT NULL | Snapshot from household setting at creation |
| `voting_deadline` | TIMESTAMPTZ | NOT NULL | When voting closes. Default: NOW() + household.default_vote_duration_hours |
| `resolved_at` | TIMESTAMPTZ | NULLABLE | When outcome was determined |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Partial unique index (D11):** `UNIQUE (household_id) WHERE type = 'elect_admin' AND status = 'active'` — only one active admin election per household.

> **Early resolution:** If all eligible voters have voted before the deadline, the proposal is resolved immediately (application checks `COUNT(votes) = eligible_voter_count` after each vote insert).

---

### 3.13 `votes`

Individual votes on proposals.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `proposal_id` | UUID | FK → proposals(id), NOT NULL | |
| `member_id` | UUID | FK → household_members(id), NOT NULL | |
| `vote` | ENUM('yes', 'no') | NOT NULL | |
| `voted_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Unique constraint:** `(proposal_id, member_id)` — one vote per member per proposal.

**Application-level validation (D30):** Before inserting a vote, verify that `member.joined_at < proposal.created_at` — members who joined after the proposal was created cannot vote.

---

## 4. Relationships Diagram

```
users
  │
  │ 1:N
  ▼
household_members ◄──────────────────────────────────────────────┐
  │         │                                                    │
  │ N:1     │ referenced by (as stable FK):                      │
  ▼         │                                                    │
households  ├── chore_templates.assigned_to / .created_by        │
  │         ├── chore_instances.assigned_to / .completed_by      │
  │         ├── expenses.paid_by                                 │
  │         ├── expense_splits.member_id                         │
  │         ├── settlements.from_member / .to_member             │
  │         ├── announcements.author_id                          │
  │         ├── announcement_reactions.member_id                 │
  │         ├── proposals.created_by / .target_member_id         │
  │         ├── votes.member_id                                  │
  │         └── admin_history.member_id                          │
  │                                                              │
  ├── 1:N ── chore_templates ── 1:N ── chore_instances           │
  ├── 1:N ── expenses ── 1:N ── expense_splits                   │
  ├── 1:N ── settlements                                         │
  ├── 1:N ── announcements ── 1:N ── announcement_reactions      │
  ├── 1:N ── proposals ── 1:N ── votes                           │
  └── 1:N ── admin_history                                       │
                                                                 │
  All member FKs point to ─────────────────────────────────────── ┘
  household_members.id (stable, never deleted)

  + calendar_events (VIEW) — unions chore_instances, expenses, proposals
```

---

## 5. Key Constraints & Business Rules

### 5.1 Household Invariants

| Rule | Enforcement | Reference |
|---|---|---|
| Max 10 active members per household | Application-level check on join | D17 |
| Exactly one admin at all times | Application-level; `role = 'admin'` on exactly one active member | D12 |
| Creator is default admin | Application: set `role = 'admin'` on creator's membership at household creation | D12 |
| Creator can't leave until new admin exists | Application-level check on leave endpoint | D14 |
| Sole member can delete (not leave) household | Application: if active member count = 1, allow household soft-delete | D14 |
| Invite code is simple, multi-use, no expiry | Just a `VARCHAR` token on the household | D15 |
| Single-household membership per user | `UNIQUE(user_id) WHERE left_at IS NULL` on household_members | D24 |

### 5.2 Chore Rules

| Rule | Enforcement | Reference |
|---|---|---|
| Recurring chores batch-generate instances 30 days ahead | Cron job + on-create generation. See [Section 9](#9-chore-instance-batch-generation) | D27 |
| No duplicate pending instances for same template + date | `UNIQUE(template_id, due_date) WHERE status = 'pending'` | D27 |
| Points snapshot on instance creation | Application: copy `points` from template when creating instance | D2 |
| Points credited to `completed_by`, not `assigned_to` | Stats queries group by `completed_by` | D23 |
| Pending instances survive template soft-delete | No cascade; instances have their own lifecycle | D4 |
| Edit permissions gated by household setting | Application: check `members_can_edit_own_chores` + membership role | D3 |
| Pending chores unassigned when assignee leaves | Application: `SET assigned_to = NULL` on pending instances when member's `left_at` is set | D29 |

### 5.3 Expense Rules

| Rule | Enforcement | Reference |
|---|---|---|
| Payer is NEVER in expense_splits | Application-level: reject split where `member_id = expense.paid_by` | D20 |
| SUM(splits) <= expense.amount | Application-level validation on create/update | D20 |
| Rounding cents distributed randomly (equal split mode) | Application: `floor(total_share / n)` + random distribution of remainder | D6 |
| Balances computed on-the-fly, never stored | Query-time aggregation across `expense_splits` and `settlements` | D5 |

### 5.4 Governance Rules

| Rule | Enforcement | Reference |
|---|---|---|
| Only one active admin-election proposal at a time | Partial unique index on `proposals` | D11 |
| Proposal outcome requires minimum voter participation | Application: `votes_cast / eligible_voter_count >= min_participation_threshold` | D8 |
| Majority = majority of those who voted | Application: `yes_votes > no_votes` (strict majority of casted votes) | D9 |
| Members can vote on their own proposals | No restriction in `votes` table | D10 |
| New members who join mid-vote cannot vote | Application: reject vote if `member.joined_at >= proposal.created_at` | D30 |
| If admin is removed by vote, auto-promote longest-tenured | Application: query active `household_members` ordered by `joined_at ASC`, tiebreaker `id ASC` (smallest UUID). Promote first eligible member | D12 |
| Snapshot `eligible_voter_count` at proposal creation | Prevents join/leave during voting from skewing thresholds | D8 |
| Default voting deadline from household setting | `voting_deadline = NOW() + household.default_vote_duration_hours`, overridable per proposal | D25 |
| Early resolution when all eligible voters have voted | Application: after each vote insert, check if `COUNT(votes) = eligible_voter_count` | D9 |

### 5.5 Settlement Rules

| Rule | Enforcement | Reference |
|---|---|---|
| Can't settle with yourself | DB check constraint: `from_member != to_member` | D7 |
| Both members must be in the same household | Application: verify both `from_member` and `to_member` have `household_id` matching the settlement's `household_id` | D31 |

### 5.6 Announcement Rules

| Rule | Enforcement | Reference |
|---|---|---|
| Only admin can pin/unpin announcements | Application: check `role = 'admin'` before setting `is_pinned` | D32 |
| One reaction of each emoji type per member | DB unique constraint: `(announcement_id, member_id, emoji)` | D32 |

### 5.7 Soft Delete Rules

| Table | Soft delete column | Cascade behavior |
|---|---|---|
| `households` | `deleted_at` | Soft-deletes the household. All child data remains for audit |
| `household_members` | `left_at` | Member deactivated. Pending chores unassigned (D29). Historical data intact |
| `chore_templates` | `deleted_at` | Template hidden. Pending instances survive (D4). Batch generator skips deleted templates |
| `expenses` | `deleted_at` | Expense hidden. Splits remain for audit. Excluded from balance queries |
| `settlements` | `deleted_at` | Settlement hidden. Excluded from balance queries |
| `announcements` | `deleted_at` | Post hidden from feed. Reactions remain for audit |
| `chore_instances` | — | Uses `status = 'cancelled'` instead of soft delete |
| `proposals` | — | Uses `status` enum (`expired`/`passed`/`failed`) |
| `votes` | — | Immutable once cast |
| `admin_history` | — | Immutable audit log |
| `expense_splits` | — | Tied to parent expense lifecycle |
| `announcement_reactions` | — | Tied to parent announcement lifecycle |

---

## 6. Index Strategy

### 6.1 Primary Query Indexes

These indexes support the core queries that power the UI views.

| Table | Index | Columns | Condition | Supports |
|---|---|---|---|---|
| `chore_instances` | `idx_chore_instances_calendar` | `(household_id, due_date)` | — | Calendar view: monthly date-range queries |
| `chore_instances` | `idx_chore_instances_board` | `(household_id, status)` | — | Chore board: filter by status |
| `chore_instances` | `idx_chore_instances_my_chores` | `(assigned_to, status)` | — | "My Chores" personal view |
| `chore_instances` | `idx_chore_instances_unassigned` | `(household_id)` | `WHERE assigned_to IS NULL AND status = 'pending'` | Unassigned chores board (D29) |
| `chore_instances` | `idx_chore_instances_no_dupes` | `(template_id, due_date)` | `WHERE status = 'pending'` | Idempotency guard for batch generation (D27) |
| `expenses` | `idx_expenses_calendar` | `(household_id, expense_date)` | `WHERE deleted_at IS NULL` | Calendar view + expense list |
| `expenses` | `idx_expenses_category` | `(household_id, category)` | `WHERE deleted_at IS NULL` | Category-filtered expense views |
| `announcements` | `idx_announcements_feed` | `(household_id, is_pinned DESC, created_at DESC)` | `WHERE deleted_at IS NULL` | Feed pagination: pinned first, then chronological |
| `proposals` | `idx_proposals_active` | `(household_id, status)` | — | Active proposals listing |

### 6.2 Join Performance Indexes

These indexes accelerate the on-the-fly balance computation (D5) and other cross-table queries.

| Table | Index | Columns | Supports |
|---|---|---|---|
| `expense_splits` | `idx_splits_by_expense` | `(expense_id)` | Joining splits to their parent expense |
| `expense_splits` | `idx_splits_by_member` | `(member_id)` | Balance calculation: "what do I owe?" |
| `settlements` | `idx_settlements_from` | `(household_id, from_member)` | Balance calculation: settlements I've sent |
| `settlements` | `idx_settlements_to` | `(household_id, to_member)` | Balance calculation: settlements I've received |
| `votes` | `idx_votes_by_proposal` | `(proposal_id)` | Vote counting per proposal |
| `announcement_reactions` | `idx_reactions_by_announcement` | `(announcement_id)` | Reaction counts per post |
| `household_members` | `idx_members_active` | `(household_id)` | `WHERE left_at IS NULL` — active member lookups |
| `chore_templates` | `idx_templates_active` | `(household_id)` | `WHERE deleted_at IS NULL` — for batch generation |

### 6.3 Index Notes

- All FK columns automatically get indexes via Prisma's `@relation` directive
- Partial indexes (with `WHERE` conditions) require raw SQL migrations in Prisma (`prisma migrate` with custom SQL)
- Monitor query plans post-launch; add covering indexes if needed for the balance computation

---

## 7. Computed Values (No Materialized Columns)

These values are derived at query time, not stored (D5).

### 7.1 Running Balance Between Two Members

```sql
-- What member_a owes member_b (positive = A owes B, negative = B owes A)
-- NOTE: Payer is NEVER in expense_splits (D20), so no self-debt filtering needed
SELECT
  COALESCE(owed.amount, 0) - COALESCE(paid.amount, 0) - COALESCE(settled.amount, 0) AS balance
FROM
  -- What A owes B from expense splits (B paid, A was split into)
  (SELECT SUM(es.amount) AS amount
   FROM expense_splits es
   JOIN expenses e ON e.id = es.expense_id
   WHERE es.member_id = :member_a
     AND e.paid_by = :member_b
     AND e.deleted_at IS NULL) owed,
  -- What B owes A from expense splits (A paid, B was split into)
  (SELECT SUM(es.amount) AS amount
   FROM expense_splits es
   JOIN expenses e ON e.id = es.expense_id
   WHERE es.member_id = :member_b
     AND e.paid_by = :member_a
     AND e.deleted_at IS NULL) paid,
  -- Net settlements from A to B
  (SELECT
     COALESCE(SUM(CASE WHEN from_member = :member_a THEN amount ELSE 0 END), 0) -
     COALESCE(SUM(CASE WHEN from_member = :member_b THEN amount ELSE 0 END), 0) AS amount
   FROM settlements
   WHERE household_id = :household_id
     AND deleted_at IS NULL
     AND ((from_member = :member_a AND to_member = :member_b)
       OR (from_member = :member_b AND to_member = :member_a))
  ) settled;
```

### 7.2 Chore Stats Per Member Per Week (Actual — Who Completed)

Points are credited to **`completed_by`**, not `assigned_to` (D23).

```sql
-- Actual performance: who completed what
SELECT
  ci.completed_by AS member_id,
  DATE_TRUNC('week', ci.completed_at) AS week,
  SUM(ci.points) AS actual_points_earned,
  COUNT(*) AS chores_actually_completed
FROM chore_instances ci
WHERE ci.household_id = :household_id
  AND ci.status = 'completed'
  AND ci.completed_by IS NOT NULL
GROUP BY ci.completed_by, DATE_TRUNC('week', ci.completed_at);
```

### 7.3 Chore Stats Per Member Per Week (Assigned — Responsibility Tracking)

```sql
-- Assigned workload: what was each person responsible for
SELECT
  ci.assigned_to AS member_id,
  DATE_TRUNC('week', ci.due_date) AS week,
  SUM(ci.points) AS assigned_points,
  COUNT(*) AS chores_assigned,
  SUM(CASE WHEN ci.status = 'completed' THEN ci.points ELSE 0 END) AS assigned_points_completed,
  SUM(CASE WHEN ci.status = 'completed' AND ci.completed_by = ci.assigned_to THEN 1 ELSE 0 END) AS self_completed,
  SUM(CASE WHEN ci.status = 'completed' AND ci.completed_by != ci.assigned_to THEN 1 ELSE 0 END) AS completed_by_others
FROM chore_instances ci
WHERE ci.household_id = :household_id
  AND ci.assigned_to IS NOT NULL
GROUP BY ci.assigned_to, DATE_TRUNC('week', ci.due_date);
```

> **Insight:** Comparing 7.2 and 7.3 reveals the "who actually pulls their weight" metric — if Maya is assigned 10 chores but David completes 4 of them, both stats are visible. This is the assigned-vs-actual comparison.

### 7.4 Proposal Outcome Evaluation

```sql
-- Check if proposal meets quorum and determine result
SELECT
  p.id,
  p.eligible_voter_count,
  p.min_participation_threshold,
  COUNT(v.id) AS votes_cast,
  SUM(CASE WHEN v.vote = 'yes' THEN 1 ELSE 0 END) AS yes_votes,
  SUM(CASE WHEN v.vote = 'no' THEN 1 ELSE 0 END) AS no_votes,
  -- Quorum met?
  (COUNT(v.id)::FLOAT / p.eligible_voter_count) >= p.min_participation_threshold AS quorum_met,
  -- Passed? (only valid if quorum met)
  SUM(CASE WHEN v.vote = 'yes' THEN 1 ELSE 0 END) > SUM(CASE WHEN v.vote = 'no' THEN 1 ELSE 0 END) AS majority_yes
FROM proposals p
LEFT JOIN votes v ON v.proposal_id = p.id
WHERE p.id = :proposal_id
GROUP BY p.id;
```

---

## 8. Calendar Events VIEW

A normalized database VIEW that unions events from multiple tables for efficient calendar rendering (D28).

### 8.1 VIEW Definition

```sql
CREATE VIEW calendar_events AS

-- Chore instances (excluding cancelled)
SELECT
  ci.id AS event_id,
  ci.household_id,
  'chore' AS event_type,
  ci.title AS event_title,
  ci.due_date AS event_date,
  ci.status AS event_status,
  ci.assigned_to AS related_member_id,
  ci.points AS metadata_int,          -- points value
  NULL AS metadata_decimal             -- unused
FROM chore_instances ci
WHERE ci.status != 'cancelled'

UNION ALL

-- Expenses (excluding soft-deleted)
SELECT
  e.id AS event_id,
  e.household_id,
  'expense' AS event_type,
  e.title AS event_title,
  e.expense_date AS event_date,
  'active' AS event_status,
  e.paid_by AS related_member_id,
  NULL AS metadata_int,                -- unused
  e.amount AS metadata_decimal         -- expense amount
FROM expenses e
WHERE e.deleted_at IS NULL

UNION ALL

-- Proposal deadlines
SELECT
  p.id AS event_id,
  p.household_id,
  'proposal' AS event_type,
  p.title AS event_title,
  p.voting_deadline::DATE AS event_date,
  p.status AS event_status,
  p.created_by AS related_member_id,
  NULL AS metadata_int,                -- unused
  NULL AS metadata_decimal             -- unused
FROM proposals p
WHERE p.status = 'active';
```

### 8.2 Calendar Query Example

```sql
-- Get all events for a household in a given month
SELECT *
FROM calendar_events
WHERE household_id = :household_id
  AND event_date BETWEEN :month_start AND :month_end
ORDER BY event_date ASC, event_type ASC;
```

### 8.3 Notes

- The VIEW is read-only; all writes go through the source tables
- The VIEW benefits from the indexes defined in Section 6 (`idx_chore_instances_calendar`, `idx_expenses_calendar`, `idx_proposals_active`)
- Additional event types (e.g., birthdays, custom events) can be added as new UNION ALL blocks
- Supabase supports views natively and they work with RLS when defined with `security_invoker = true`

---

## 9. Chore Instance Batch Generation

Strategy for keeping the calendar populated with future chore instances (D27).

### 9.1 Generation Rules

| Trigger | Action | Scope |
|---|---|---|
| **Template created** | Generate instances for the next 30 days based on recurrence | Single template |
| **Template updated** (recurrence or assigned_to changed) | Cancel pending future instances, regenerate for next 30 days | Single template |
| **Template soft-deleted** | Stop generating new instances. Existing pending instances survive (D4) | Single template |
| **Daily cron job** | Extend generation horizon: for each active template, generate instances to maintain 30-day lookahead | All active templates in all households |
| **Instance completed** | No action needed — batch generation already covers future dates | — |

### 9.2 Generation Logic (Pseudocode)

```
function generateInstances(template, fromDate, toDate):
  dates = computeRecurrenceDates(template.recurrence, fromDate, toDate)

  for each date in dates:
    -- Idempotency: UNIQUE(template_id, due_date) WHERE status = 'pending'
    -- INSERT ... ON CONFLICT DO NOTHING
    INSERT INTO chore_instances (
      template_id, household_id, title, points,
      assigned_to, due_date, status
    ) VALUES (
      template.id, template.household_id, template.title, template.points,
      template.assigned_to, date, 'pending'
    ) ON CONFLICT (template_id, due_date) WHERE status = 'pending'
    DO NOTHING;
```

### 9.3 Recurrence Date Computation

| Recurrence | Rule | Example (from March 9) |
|---|---|---|
| `one_time` | Single date only (the template's first instance) | March 9 only |
| `daily` | Every day | March 9, 10, 11, ... April 7 |
| `weekly` | Same day of week | March 9, 16, 23, 30, April 6 |
| `monthly` | Same day of month | March 9, April 9 |

### 9.4 Cron Job Specification

- **Frequency:** Daily at 2:00 AM household timezone
- **Implementation:** Supabase Edge Function triggered by `pg_cron` or external scheduler
- **Idempotency:** The `UNIQUE(template_id, due_date) WHERE status = 'pending'` constraint with `ON CONFLICT DO NOTHING` makes the job safe to run multiple times

---

## 10. Supabase Realtime Considerations

Tables that should have Supabase Realtime enabled for live updates (D19):

| Table | Events | Use Case |
|---|---|---|
| `chore_instances` | INSERT, UPDATE | Live status updates, new instances appearing, reassignment |
| `votes` | INSERT | Live vote count updates on active proposals |
| `proposals` | UPDATE | Live proposal status changes (active → passed/failed) |
| `announcements` | INSERT, UPDATE | New posts, pin/unpin changes |
| `announcement_reactions` | INSERT, DELETE | Live reaction updates |
| `expenses` | INSERT | New expenses appear for all members |
| `settlements` | INSERT | Settlement notifications |
| `household_members` | INSERT, UPDATE | Member joins, leaves, or role changes |

**Row-Level Security (RLS):** All realtime subscriptions must be scoped to the user's household via RLS policies. Members should only receive events for their own household.

**RLS Policy Pattern:**

```sql
-- Example: chore_instances RLS
CREATE POLICY "Members can view their household's chore instances"
ON chore_instances FOR SELECT
USING (
  household_id IN (
    SELECT household_id FROM household_members
    WHERE user_id = auth.uid() AND left_at IS NULL
  )
);
```

---

## 11. Open Design Notes

Decisions deferred to implementation or future versions:

| # | Topic | Status | Notes |
|---|---|---|---|
| 1 | Notification system for proposals and chores | Deferred to v1.1 | PRD says in-app only for v1.0. May need a `notifications` table later |
| 2 | Unequal percentage-based splits | Out of scope v1.0 | Schema supports exact amounts (D21). Percentage split UI deferred. Could add `percentage` to `split_type` ENUM later |
| 3 | Invite code format | Implementation detail | Suggest 8-char alphanumeric (e.g., `A3K9M2X1`). URL: `nestsync.app/join/A3K9M2X1` |
| 4 | Expense category values | Implementation detail | Start with free-text `VARCHAR(50)`. Could migrate to ENUM or separate `categories` table if custom categories are needed |
| 5 | Announcement comments / threads | Future v1.1+ | Current design is flat feed with reactions. Threaded replies would need an `announcement_comments` table |
| 6 | Cron job infrastructure | Implementation detail | Options: Supabase `pg_cron`, Edge Function on schedule, or external service (e.g., Vercel cron). Choose based on Supabase plan limitations |
