# NestSync — API Reference

> **Last Updated:** March 13, 2026
> **Auth:** Supabase Auth (cookie-based sessions)
> **Validation:** Zod schemas on all inputs

NestSync provides both a **public REST API** (JSON over HTTP) and internal **Server Actions** (used by the React frontend).

---

## Table of Contents

### REST API (Public)

- [Authentication](#rest-authentication)
- [GET /api/household](#get-apihousehold)
- [GET /api/members](#get-apimembers)
- [GET /api/chores](#get-apichores)
- [GET /api/chores/instances](#get-apichoresinstances)
- [GET /api/announcements](#get-apiannouncements)
- [GET /api/proposals](#get-apiproposals)
- [GET /api/calendar](#get-apicalendar)
- [GET /api/stats](#get-apistats)

### Server Actions (Internal)

1. [Authentication](#1-authentication)
2. [Chore Management](#2-chore-management)
3. [Announcements](#3-announcements)
4. [Proposals & Voting](#4-proposals--voting)
5. [Queries (Read Operations)](#5-queries-read-operations)
6. [Validation Schemas](#6-validation-schemas)
7. [Business Logic Utilities](#7-business-logic-utilities)
8. [Type Definitions](#8-type-definitions)
9. [Error Handling](#9-error-handling)
10. [Authorization Model](#10-authorization-model)

---

# REST API

All REST endpoints require authentication via Supabase session cookies. Unauthenticated requests receive a `401` JSON response.

**Base URL:** `https://nestsync-delta.vercel.app/`

**Response format:** All responses use `{ data: ... }` for success and `{ error: "message" }` for errors.

---

## REST Authentication

The REST API uses the same cookie-based authentication as the web app. To authenticate:

1. Log in through the web UI — this sets Supabase session cookies
2. Include cookies in API requests (same-origin requests work automatically)

For programmatic access, obtain a Supabase access token and pass it as a cookie or use the Supabase client SDK directly.

**Unauthorized response (all endpoints):**
```json
{ "error": "Unauthorized" }
```
Status: `401`

---

## GET /api/household

Returns the current user's household details.

**Response `200`:**
```json
{
  "data": {
    "id": "uuid",
    "name": "The Nest",
    "invite_code": "ABC12345",
    "timezone": "America/New_York",
    "max_members": 10,
    "min_vote_participation": 0.5,
    "default_vote_duration_hours": 48,
    "members_can_edit_own_chores": false,
    "created_at": "2026-03-01T00:00:00Z"
  },
  "membership": { "role": "admin" }
}
```

---

## GET /api/members

Returns all active members of the household.

**Response `200`:**
```json
{
  "data": [
    {
      "id": "member-uuid",
      "user_id": "user-uuid",
      "role": "admin",
      "joined_at": "2026-03-01T00:00:00Z",
      "display_name": "Alice",
      "avatar_url": "https://..."
    }
  ]
}
```

---

## GET /api/chores

Returns all active chore templates.

**Response `200`:**
```json
{
  "data": [
    {
      "id": "template-uuid",
      "title": "Take out trash",
      "description": "Weekly trash duty",
      "points": 5,
      "recurrence": "weekly",
      "schedule_days": [1, 4],
      "assigned_to": { "id": "member-uuid", "display_name": "Bob" },
      "created_by": { "id": "member-uuid", "display_name": "Alice" }
    }
  ]
}
```

---

## GET /api/chores/instances

Returns chore instances with optional filtering.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | `pending` \| `completed` \| `cancelled` | Filter by status |
| `dateFrom` | `YYYY-MM-DD` | Start date (inclusive) |
| `dateTo` | `YYYY-MM-DD` | End date (inclusive) |
| `assignedTo` | `uuid` | Filter by assigned member |

**Example:** `GET /api/chores/instances?status=pending&dateFrom=2026-03-10&dateTo=2026-03-16`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "instance-uuid",
      "title": "Take out trash",
      "points": 5,
      "due_date": "2026-03-10",
      "status": "pending",
      "assigned_to": { "id": "member-uuid", "display_name": "Bob" },
      "completed_by": null
    }
  ]
}
```

---

## GET /api/announcements

Returns all announcements (pinned first, then newest).

**Response `200`:**
```json
{
  "data": [
    {
      "id": "ann-uuid",
      "content": "House meeting this Friday!",
      "is_pinned": true,
      "created_at": "2026-03-10T12:00:00Z",
      "updated_at": "2026-03-10T12:00:00Z",
      "author": {
        "id": "member-uuid",
        "role": "admin",
        "display_name": "Alice",
        "avatar_url": null
      },
      "reactions": [
        { "id": "reaction-uuid", "emoji": "thumbsup", "member_id": "member-uuid" }
      ]
    }
  ]
}
```

---

## GET /api/proposals

Returns all proposals with votes.

**Response `200`:**
```json
{
  "data": [
    {
      "id": "proposal-uuid",
      "type": "custom",
      "title": "Buy a new vacuum",
      "description": "The old one is broken",
      "status": "active",
      "eligible_voter_count": 4,
      "min_participation_threshold": 0.5,
      "voting_deadline": "2026-03-15T00:00:00Z",
      "resolved_at": null,
      "created_at": "2026-03-13T00:00:00Z",
      "target_member": null,
      "creator": { "id": "member-uuid", "display_name": "Alice" },
      "votes": [
        { "id": "vote-uuid", "member_id": "member-uuid", "vote": "yes", "voted_at": "2026-03-13T01:00:00Z" }
      ]
    }
  ]
}
```

---

## GET /api/calendar

Returns calendar events (chores, expenses, proposals) for a date range.

**Query parameters (required):**

| Param | Type | Description |
|-------|------|-------------|
| `dateFrom` | `YYYY-MM-DD` | Start date (inclusive) |
| `dateTo` | `YYYY-MM-DD` | End date (inclusive) |

**Example:** `GET /api/calendar?dateFrom=2026-03-10&dateTo=2026-03-16`

**Response `200`:**
```json
{
  "data": [
    {
      "event_id": "uuid",
      "household_id": "uuid",
      "event_type": "chore",
      "event_title": "Take out trash",
      "event_date": "2026-03-10",
      "event_status": "pending",
      "related_member_id": "member-uuid",
      "metadata_int": 5,
      "metadata_decimal": null,
      "member_display_name": "Bob"
    }
  ]
}
```

**Error `400`:**
```json
{ "error": "dateFrom and dateTo query parameters are required" }
```

---

## GET /api/stats

Returns household statistics: weekly leaderboard, streak, on-time rate, week comparison, and today's progress.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `memberId` | `uuid` | Optional — filters streak, on-time rate, and week comparison to a specific member |

**Response `200`:**
```json
{
  "data": {
    "weeklyLeaderboard": [
      { "memberId": "uuid", "displayName": "Alice", "points": 25, "count": 5 }
    ],
    "streak": 3,
    "onTimeRate": { "onTime": 8, "total": 10, "rate": 80 },
    "weekComparison": { "thisWeek": 25, "lastWeek": 20, "diff": 5 },
    "todayProgress": { "completed": 3, "total": 5 }
  }
}
```

---

# Server Actions (Internal)

> The following documents the internal Server Actions used by the React frontend.
> These are TypeScript functions invoked via `useFormState` / form actions, not HTTP endpoints.

---

## 1. Authentication

**File:** `src/lib/auth/actions.ts`

All auth actions use Supabase Auth under the hood. Session management is handled by Supabase middleware (`src/lib/supabase/middleware.ts`).

### `login(formData: FormData): Promise<ActionResult>`

Signs in a user with email and password.

**Input fields:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `email` | string | ✅ | Must be valid email |
| `password` | string | ✅ | Min 6 characters |

**Behavior:**
1. Validates input with `loginSchema`
2. Calls `supabase.auth.signInWithPassword()`
3. On success → calls `getPostAuthRedirect()` to determine destination (household members → `/dashboard/household`, no membership → `/onboarding`)
4. On failure → returns `{ error: "Invalid login credentials" }`

---

### `signup(formData: FormData): Promise<ActionResult>`

Registers a new user account.

**Input fields:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `email` | string | ✅ | Must be valid email |
| `password` | string | ✅ | Min 6 characters |
| `displayName` | string | ✅ | 1–100 characters |
| `inviteCode` | string | ❌ | Max 20 characters |

**Behavior:**
1. Validates input with `signupSchema`
2. Calls `supabase.auth.signUp()` with `display_name` in metadata
3. Auth trigger (`handle_new_user`) creates public `users` row automatically
4. If `inviteCode` provided → calls `joinHouseholdByCode()` → redirects to `/dashboard/household`
5. If no invite code → redirects to `/onboarding`
6. On failure → returns `{ error: "..." }`

---

### `forgotPassword(formData: FormData): Promise<ActionResult>`

Sends a password reset email.

**Input fields:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `email` | string | ✅ | Must be valid email |

**Behavior:**
1. Calls `supabase.auth.resetPasswordForEmail()` with redirect to `/reset-password`
2. Always returns `{ success: true }` (does not reveal whether email exists)

---

### `resetPassword(formData: FormData): Promise<ActionResult>`

Sets a new password (user must have clicked email reset link).

**Input fields:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `password` | string | ✅ | Min 6 characters |
| `confirmPassword` | string | ✅ | Must match `password` |

**Behavior:**
1. Validates `password === confirmPassword`
2. Calls `supabase.auth.updateUser()`
3. On success → redirects to `/login`

---

### `createHousehold(formData: FormData): Promise<ActionResult>`

Creates a new household and makes the current user its admin.

**Input fields:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | ✅ | 1–100 characters |
| `timezone` | string | ✅ | Non-empty string (IANA timezone) |

**Behavior:**
1. Generates a random 8-character invite code
2. Inserts into `households` table
3. Inserts into `household_members` with `role = 'admin'`
4. Inserts into `admin_history` with `reason = 'household_created'`
5. Redirects to `/dashboard/household`

---

### `joinHousehold(formData: FormData): Promise<ActionResult>`

Joins an existing household by invite code.

**Input fields:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `inviteCode` | string | ✅ | 1–20 characters |

**Behavior:**
1. Looks up household by `invite_code`
2. Checks: household exists, not deleted, not at max members
3. Checks: user is not already an active member of any household
4. Inserts into `household_members` with `role = 'member'`
5. Redirects to `/dashboard/household`

**Error cases:**
- `"Household not found"` — invalid invite code
- `"This household is full"` — at max_members capacity
- `"You are already a member of a household"` — user has active membership

---

### `signOut(): Promise<void>`

Signs out the current user.

**Behavior:** Calls `supabase.auth.signOut()` → redirects to `/login`

---

### Post-Auth Redirect Helper

**File:** `src/lib/auth/redirect.ts`

#### `getPostAuthRedirect(overrideRedirect?: string | null): Promise<string>`

Determines where to redirect a user after authentication.

**Logic:**
1. Not authenticated → `"/login"`
2. Has active household membership → `overrideRedirect || "/dashboard/household"`
3. No membership → `"/onboarding"`

Used by `login()` and the OAuth callback handler (`/auth/callback/route.ts`).

---

## 2. Chore Management

**File:** `src/lib/chores/actions.ts`

All chore actions require an authenticated user with active household membership.

### `createChoreTemplate(formData: FormData): Promise<ActionResult>`

Creates a new chore template and generates initial instances. Internally calls `insertChoreTemplate()`.

**Input fields:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `title` | string | ✅ | 1–200 characters |
| `description` | string | ❌ | Optional text |
| `points` | number | ✅ | Integer ≥ 1 |
| `recurrence` | string | ✅ | `one_time`, `daily`, `weekly`, or `monthly` |
| `assignedTo` | string | ❌ | Valid UUID (member ID); defaults to current member if omitted |
| `scheduleDays` | string[] | ❌ | Array of integers 0–6 (Sun=0, Mon=1, ..., Sat=6) |
| `dueDate` | string | ❌ | Date string (`YYYY-MM-DD`) for one-time chores |

**Behavior:**
1. Falls back `assignedTo` to the current member ID if not provided (self-assign)
2. Coerces `null` description to `undefined` (Zod `.optional()` requires `undefined`, not `null`)
3. Validates with `createChoreTemplateSchema`
4. Inserts template into `chore_templates` (note: `schedule_days` is omitted from the PostgREST insert to avoid schema cache issues — the parsed form data is used for instance generation instead)
5. Generates instances for the current week: `scheduleDays` → `computeScheduledDates()`, or recurrence → `computeRecurrenceDates()`
6. Redirects to `/dashboard/my`

---

### `createChoreQuick(formData: FormData): Promise<ActionResult>`

Creates a chore for the calendar (used by calendar quick-add). Internally calls the same `insertChoreTemplate()` as `createChoreTemplate` but does not redirect.

**Input fields:** Same as `createChoreTemplate` above.

**Behavior:**
1. Calls `insertChoreTemplate(formData)` to create the template + instances
2. Returns `{ success: true }` (no redirect — the calendar refreshes inline)

---

### `completeChore(formData: FormData): Promise<ActionResult>`

Marks a chore instance as completed.

**Input fields:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `instanceId` | string | ✅ | Valid UUID |

**Behavior:**
1. Validates with `completeChoreSchema`
2. Updates `chore_instances` row: `status = 'completed'`, `completed_at = NOW()`, `completed_by = currentMemberId`
3. Returns `{ success: true }`

**Note:** Points are credited to `completed_by`, not `assigned_to` (Design Decision D23).

---

### `deleteChoreTemplate(formData: FormData): Promise<ActionResult>`

Soft-deletes a chore template. Pending instances survive (Design Decision D4).

**Input fields:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `templateId` | string | ✅ | Valid UUID |

**Behavior:**
1. Authorization check:
   - Admin → skips permission check entirely (no household query needed)
   - Member → queries household `members_can_edit_own_chores` setting, then checks template ownership
2. Soft-deletes template (`deleted_at = NOW()`)
3. Returns `{ success: true }`

**Error cases:**
- `"Only the admin can delete chore templates"` — member lacks edit rights
- `"You can only delete templates you created"` — member trying to delete another's template
- `"Delete failed: <message>"` — database error with actual Supabase error surfaced

---

### `reassignChore(formData: FormData): Promise<ActionResult>`

Reassigns a chore template and its future pending instances to a different member.

**Input fields:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `templateId` | string | ✅ | Valid UUID |
| `newAssignee` | string | ✅ | Valid UUID (member ID) |

**Behavior:**
1. Admin-only action
2. Updates `chore_templates.assigned_to`
3. Updates all pending instances with `due_date >= today` to new assignee
4. Returns `{ success: true }`

---

### `ensureWeekInstancesAction(weekStart: string): Promise<void>`

Ensures chore instances exist for a given week. Called when navigating the calendar. Not a form action — takes a plain string argument.

**Input:**
| Parameter | Type | Description |
|---|---|---|
| `weekStart` | string | Date string (`YYYY-MM-DD`) — the Monday of the target week |

**Behavior:**
1. Fetches all active (non-deleted) templates for the household
2. For each template with `schedule_days`:
   - Computes dates for the week using `computeScheduledDates()`
   - Inserts instances with `ON CONFLICT DO NOTHING`
3. For templates without `schedule_days`:
   - Uses `computeRecurrenceDates()` for the week
   - Inserts instances with `ON CONFLICT DO NOTHING`

---

## 3. Announcements

**File:** `src/lib/announcements/actions.ts`

### `createAnnouncement(formData: FormData): Promise<ActionResult>`

Posts a new announcement to the household feed.

**Input fields:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `content` | string | ✅ | 1–2000 characters |

**Behavior:** Inserts into `announcements` table → returns `{ success: true }`

---

### `togglePinAnnouncement(formData: FormData): Promise<ActionResult>`

Pins or unpins an announcement (admin only).

**Input fields:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `announcementId` | string | ✅ | Valid UUID |

**Behavior:**
1. Admin-only check
2. Reads current `is_pinned` value
3. Toggles it
4. Returns `{ success: true }`

---

### `deleteAnnouncement(formData: FormData): Promise<ActionResult>`

Soft-deletes an announcement (admin or author).

**Input fields:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `announcementId` | string | ✅ | Valid UUID |

**Behavior:**
1. Checks: current user is admin OR is the announcement's author
2. Sets `deleted_at = NOW()`
3. Returns `{ success: true }`

---

### `toggleReaction(formData: FormData): Promise<ActionResult>`

Adds or removes an emoji reaction on an announcement.

**Input fields:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `announcementId` | string | ✅ | Valid UUID |
| `emoji` | string | ✅ | One of: `thumbs_up`, `heart`, `laugh`, `sad`, `angry`, `celebrate` |

**Behavior:**
1. Checks if user already has this reaction
2. If exists → deletes it (un-react)
3. If not → inserts it (react)
4. Returns `{ success: true }`

**Allowed emojis:** `👍`, `❤️`, `😂`, `😢`, `😡`, `🎉`

---

## 4. Proposals & Voting

**File:** `src/lib/proposals/actions.ts`

### `createProposal(formData: FormData): Promise<ActionResult>`

Creates a new governance proposal.

**Input fields:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `type` | string | ✅ | `elect_admin`, `remove_member`, or `custom` |
| `title` | string | ✅ | 1–200 characters |
| `description` | string | ❌ | Max 2000 characters |
| `targetMemberId` | string | Conditional | Required for `elect_admin` and `remove_member` |
| `durationHours` | number | ❌ | 1–168 (defaults to household's `default_vote_duration_hours`) |

**Behavior:**
1. Validates with `createProposalSchema` (includes refinement: target required for election/removal types)
2. For `elect_admin`: checks no other active election exists (D11)
3. Counts active members → snapshot as `eligible_voter_count`
4. Calculates `voting_deadline = NOW() + durationHours`
5. Snapshots household's `min_vote_participation` threshold
6. Inserts proposal
7. Returns `{ success: true }`

**Error cases:**
- `"An active admin election already exists"` — only one at a time (D11)

---

### `castVote(formData: FormData): Promise<ActionResult>`

Casts a vote on an active proposal.

**Input fields:**
| Field | Type | Required | Validation |
|---|---|---|---|
| `proposalId` | string | ✅ | Valid UUID |
| `vote` | string | ✅ | `yes` or `no` |

**Behavior:**
1. Validates with `castVoteSchema`
2. Checks: proposal is active
3. Checks: voting deadline has not passed
4. Checks: member joined before proposal was created (D30)
5. Inserts vote (unique constraint prevents double-voting)
6. Counts total votes → if all eligible voters have voted → triggers early resolution
7. If resolved: calls `resolveProposal()` to apply outcome
8. Returns `{ success: true }`

**Error cases:**
- `"Proposal is not active"` — proposal already resolved
- `"Voting period has ended"` — past deadline
- `"You joined after this proposal was created"` — ineligible (D30)
- `"You have already voted"` — duplicate vote attempt

---

### `resolveProposal(proposalId: string): Promise<void>` (internal)

Determines and applies proposal outcome.

**Behavior:**
1. Calls `evaluateProposalOutcome()` → `passed`, `failed`, or `expired`
2. Updates proposal `status` and `resolved_at`
3. If `passed` and `type = 'elect_admin'` → calls `handleElectAdmin()`
4. If `passed` and `type = 'remove_member'` → calls `handleRemoveMember()`

---

### `expireProposals(): Promise<void>` (internal)

Resolves all proposals past their voting deadline.

**Behavior:** Queries all active proposals with `voting_deadline < NOW()` → resolves each

---

### Proposal Resolution (`src/lib/proposals/resolution.ts`)

#### `evaluateProposalOutcome(votes, eligibleVoterCount, threshold): ProposalOutcome`

Pure function that determines proposal result.

**Logic:**
1. If `votesCast / eligibleVoterCount < threshold` → `"failed"` (quorum not met)
2. If `yesVotes > noVotes` → `"passed"`
3. Otherwise → `"failed"`

#### `handleElectAdmin(proposalId, targetMemberId, householdId)`

1. Finds current admin → sets `role = 'member'`
2. Closes current admin's `admin_history` record (`ended_at = NOW()`)
3. Promotes target member → `role = 'admin'`
4. Creates new `admin_history` record with `reason = 'elected'`

#### `handleRemoveMember(targetMemberId, householdId)`

1. Sets `left_at = NOW()` on target member
2. Nullifies `assigned_to` on all their pending chore instances (D29)

---

## 5. Queries (Read Operations)

All query functions use the Supabase server client and are called from Server Components (SSR).

### Chore Queries (`src/lib/chores/queries.ts`)

#### `getChoreInstances(householdId: string): Promise<ChoreInstanceRow[]>`

Returns all chore instances for the household, joined with assignee and template data.

**SQL equivalent:** `SELECT ci.*, users.display_name, ct.recurrence FROM chore_instances ci JOIN ... WHERE ci.household_id = ? AND ci.status != 'cancelled' ORDER BY ci.due_date ASC`

#### `getChoreTemplates(householdId: string): Promise<ChoreTemplateRow[]>`

Returns all active (non-deleted) templates with assigned member and creator info.

#### `getWeeklyChoreStats(householdId: string)`

Returns points earned per member in the current rolling 7-day window. Used for the dashboard leaderboard.

#### `getCompletionStreak(memberId, householdId)`

Counts consecutive days (backward from today) where the member completed at least one chore.

#### `getOnTimeRate(memberId, householdId)`

Calculates the percentage of chores completed on or before their due date (last 30 days).

#### `getWeekComparison(memberId, householdId)`

Compares points earned this week vs last week. Returns `{ thisWeek, lastWeek, trend }`.

#### `getTodayProgress(memberId, householdId)`

Returns `{ completed, total }` for chores due today.

### Calendar Queries (`src/lib/calendar/queries.ts`)

#### `getCalendarEvents(householdId, startDate, endDate): Promise<CalendarEventWithMember[]>`

Queries the `calendar_events` VIEW for a date range. Joins with member display names.

### Household Queries

#### `getCurrentMembership(): Promise<CurrentMembership | null>`

Returns the authenticated user's active membership (memberId, householdId, userId, role). Returns `null` if not authenticated or not a member of any household.

#### `getHouseholdMembers(householdId): Promise<HouseholdMemberWithUser[]>`

Returns all active members with their user profile data (display_name, avatar_url).

### Other Queries

#### `getAnnouncements(householdId): Promise<AnnouncementWithDetails[]>`

Returns announcements with author info and reactions, ordered by `is_pinned DESC, created_at DESC`.

#### `getProposals(householdId): Promise<ProposalWithDetails[]>`

Returns all proposals with votes, creator info, and target member info. Ordered by `created_at DESC`.

---

## 6. Validation Schemas

All Zod schemas are defined in `src/lib/*/validation.ts` files. See the [Project Map](./PROJECT_MAP.md#8-validation-schemas-zod) for the complete schema reference.

---

## 7. Business Logic Utilities

### Instance Generator (`src/lib/chores/instance-generator.ts`)

#### `computeRecurrenceDates(recurrence, fromDate, toDate): Date[]`

Generates an array of dates based on recurrence type:
- `one_time` → returns `[fromDate]`
- `daily` → every day between from and to
- `weekly` → same weekday, every 7 days
- `monthly` → same day of month

#### `computeScheduledDates(scheduleDays, fromDate, toDate): Date[]`

Generates dates for specific weekdays. `scheduleDays` is an array of JS weekday numbers (0=Sun through 6=Sat).

**Example:** `computeScheduledDates([1, 3, 5], march9, march15)` → returns dates for Mon, Wed, Fri within that range.

#### `getWeekBounds(date?): { monday: Date, sunday: Date }`

Returns the Monday and Sunday bounding the given date's week. Defaults to current date.

#### `formatDateForDB(date: Date): string`

Formats as `YYYY-MM-DD` for database DATE columns.

---

## 8. Type Definitions

### `ActionResult`

```typescript
type ActionResult = {
  error?: string;
  success?: boolean;
};
```

Standard return type for all server actions.

### `CurrentMembership`

```typescript
type CurrentMembership = {
  memberId: string;
  householdId: string;
  userId: string;
  role: "member" | "admin";
};
```

### `ChoreInstanceRow`

```typescript
type ChoreInstanceRow = {
  id: string;
  template_id: string | null;
  title: string;
  points: number;
  due_date: string;
  status: "pending" | "completed" | "cancelled";
  completed_at: string | null;
  assigned_to: string | null;
  assigned_member: { users: { display_name: string } } | null;
  completed_by_member: { users: { display_name: string } } | null;
  chore_templates: { recurrence: string } | null;
};
```

### `ChoreTemplateRow`

```typescript
type ChoreTemplateRow = {
  id: string;
  title: string;
  description: string | null;
  points: number;
  recurrence: "one_time" | "daily" | "weekly" | "monthly";
  schedule_days: number[] | null;
  assigned_member: { id: string; users: { display_name: string } } | null;
  creator: { id: string; users: { display_name: string } } | null;
};
```

### `CalendarEventWithMember`

```typescript
type CalendarEventWithMember = {
  event_id: string;
  household_id: string;
  event_type: string;
  event_title: string;
  event_date: string;
  event_status: string;
  related_member_id: string | null;
  metadata_int: number | null;
  metadata_decimal: number | null;
  member_display_name: string | null;
};
```

### `HouseholdMemberWithUser`

```typescript
type HouseholdMemberWithUser = {
  id: string;
  user_id: string;
  household_id: string;
  role: "admin" | "member";
  joined_at: string;
  left_at: string | null;
  users: {
    display_name: string;
    avatar_url: string | null;
  };
};
```

### `AnnouncementWithDetails`

```typescript
type AnnouncementWithDetails = {
  id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  author: {
    id: string;
    users: { display_name: string; avatar_url: string | null };
  };
  announcement_reactions: {
    id: string;
    emoji: string;
    member_id: string;
  }[];
};
```

### `ProposalWithDetails`

```typescript
type ProposalWithDetails = {
  id: string;
  type: "elect_admin" | "remove_member" | "custom";
  title: string;
  description: string | null;
  status: "active" | "passed" | "failed" | "expired";
  eligible_voter_count: number;
  min_participation_threshold: number;
  voting_deadline: string;
  resolved_at: string | null;
  created_at: string;
  creator: {
    id: string;
    users: { display_name: string };
  };
  target_member: {
    id: string;
    users: { display_name: string };
  } | null;
  votes: {
    id: string;
    member_id: string;
    vote: "yes" | "no";
  }[];
};
```

---

## 9. Error Handling

### Action Error Pattern

All server actions follow a consistent error pattern:

```typescript
// Validation error (with server-side logging)
if (!parsed.success) {
  const messages = parsed.error.issues.map((i) => i.message).join("; ");
  console.error("Validation failed:", messages, { ...debugContext });
  return { error: messages };
}

// Auth/membership error
const membership = await getCurrentMembership();
if (!membership) {
  return { error: "Not authenticated" };
}

// Business logic error
if (someConditionFails) {
  return { error: "Human-readable error message" };
}

// Database error (actual Supabase message surfaced)
const { error } = await supabase.from("table").insert(data);
if (error) {
  console.error("DB operation failed:", error);
  return { error: `Operation failed: ${error.message}` };
}

// Success
return { success: true };
```

### Client-Side Error Display

Components display errors from the `error` field in `ActionResult`:

```tsx
{state?.error && (
  <div role="alert" className="text-error-text bg-error-light ...">
    {state.error}
  </div>
)}
```

### Redirect Pattern

Auth actions use Next.js `redirect()` on success, which throws a `NEXT_REDIRECT` error internally (not a real error).

---

## 10. Authorization Model

### Role-Based Access

| Operation | Admin | Member |
|---|---|---|
| Create chore template | ✅ | ✅ |
| Complete any chore | ✅ | ✅ |
| Delete any template | ✅ | Own only (if `members_can_edit_own_chores`) |
| Reassign template | ✅ | ❌ |
| Create announcement | ✅ | ✅ |
| Pin/unpin announcement | ✅ | ❌ |
| Delete announcement | ✅ | Own only |
| Create proposal | ✅ | ✅ |
| Cast vote | ✅ | ✅ |
| View all household data | ✅ | ✅ |

### Row-Level Security

All data access is scoped to the user's active household via Supabase RLS policies. The `get_my_household_ids()` SQL function prevents RLS recursion.

### Household Settings

| Setting | Default | Effect |
|---|---|---|
| `members_can_edit_own_chores` | `true` | When `false`, only admin can delete chore templates |
| `min_vote_participation` | `0.5` | Minimum voter turnout (50%) for proposal quorum |
| `default_vote_duration_hours` | `48` | Default voting window for new proposals |
| `max_members` | `10` | Maximum household size |
| `timezone` | `America/New_York` | Used for overdue checks and calendar rendering |
