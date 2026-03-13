# NestSync — Product Requirements Document

> **Version:** 1.0 | **Status:** Draft | **Last Updated:** February 27, 2026
> **Authors:** [@mahamayashen](https://github.com/mahamayashen) · [@EvanjyChen](https://github.com/EvanjyChen)
> **Repository:** [github.com/mahamayashen/nestsync](https://github.com/mahamayashen/nestsync)

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Personas](#2-user-personas)
3. [User Stories & Acceptance Criteria](#3-user-stories--acceptance-criteria)
4. [Feature Requirements](#4-feature-requirements)
5. [User Flows](#5-user-flows)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Tech Stack](#7-tech-stack)
8. [Sprint Plan](#8-sprint-plan)
9. [Out of Scope](#9-out-of-scope-v10)
10. [Open Questions](#10-open-questions)

---

## 1. Product Overview

NestSync is a shared household management application designed for roommates and families who are tired of coordinating through group chats and scattered spreadsheets. Unlike workplace tools like Jira or Asana, NestSync is built around a household of peers — no permanent hierarchy, no ticket-filing, and shared finances included.

Its standout feature is a democratic governance layer where household members vote to elect a seasonal admin, keeping authority legitimate and accountable. NestSync reflects how shared living actually works: informal, financial, and built on negotiation between equals.

### 1.1 Problem Statement

Shared living is fundamentally a coordination problem. Roommates and families struggle with:

- **Chore accountability** — tasks fall through the cracks when there is no shared visibility
- **Expense disputes** — bill splitting via Venmo requests and spreadsheets is error-prone and awkward
- **Communication gaps** — important updates get lost in group chats alongside unrelated messages
- **Authority conflicts** — one person taking charge without consensus breeds resentment

### 1.2 Proposed Solution

A single unified platform that combines chore tracking, expense splitting, household announcements, and democratic decision-making into a lightweight, mobile-friendly web app built for non-hierarchical households.

### 1.3 Success Metrics

| Metric | Target | Timeframe |
|---|---|---|
| Active households using chore tracking | 80% of signups | Within 2 weeks of signup |
| Expense logs per household per month | >= 5 entries | Month 1 |
| Voter participation in proposals | >= 75% of members | Per proposal |
| Chore completion rate | >= 70% | Weekly |
| User retention (return in 7 days) | >= 60% | Post-signup |

---

## 2. User Personas

NestSync is designed for three primary personas identified through research into shared living pain points.

### 2.1 Maya — The Overwhelmed College Student

| Attribute | Detail |
|---|---|
| Age | 20 |
| Living situation | 4-person off-campus rental |
| Tech comfort | High — uses apps daily |
| Core frustration | Chores fall through the cracks, nobody agrees on who is in charge |
| Goal | Clear accountability without confrontation or passive-aggression |
| Key features needed | Chore assignment, recurrence, completion visibility, voting for admin |

### 2.2 David — The Working Professional

| Attribute | Detail |
|---|---|
| Age | 28 |
| Living situation | 3-person apartment share |
| Tech comfort | High — uses Splitwise, Venmo |
| Core frustration | Awkward money conversations, unclear who owes what |
| Goal | Fair, visible bill splitting without needing to chase roommates |
| Key features needed | Expense logging, running balance, settle-up tracking |

### 2.3 Linda — The Busy Parent

| Attribute | Detail |
|---|---|
| Age | 42 |
| Living situation | Family home with spouse and two kids |
| Tech comfort | Moderate — prefers simple, intuitive UX |
| Core frustration | Task assignment feels like a performance review, kids don't check in |
| Goal | Simple way to assign tasks to kids without friction or formality |
| Key features needed | Chore assignment, announcements feed, simple dashboard view |

---

## 3. User Stories & Acceptance Criteria

### 3.1 Household Setup & Authentication

#### US-01: Create household and invite members

> **As a** user, **I want to** create a household, invite others via a link, and log in securely from any device, **so that** we can all get into the same space quickly without being tied to one device.

**Acceptance Criteria:**
- [ ] User can register with email and password
- [ ] User can create a named household after registration
- [ ] A unique shareable invite link is generated on household creation
- [ ] Invited users see a household preview screen before joining
- [ ] Joining via link adds user to the household member list
- [ ] Users can log in from any device and access their household

---

### 3.2 Chore Management

#### US-02: Add chore with due date, assignee, and recurrence

> **As a** household member, **I want to** add chores with due dates, assignees, and recurrence and mark them complete, **so that** nothing gets forgotten and everyone can see progress without asking.

**Acceptance Criteria:**
- [ ] Member can create a chore with title, due date, and assignee
- [ ] Recurrence options: one-time, daily, weekly, monthly
- [ ] Chore appears on the shared household chore board immediately
- [ ] Any member can mark a chore complete; status updates for all members
- [ ] Overdue chores are visually highlighted
- [ ] Recurring chores auto-reset after being marked complete

#### US-03: Seasonal admin can edit or delete any chore

> **As a** seasonal admin, **I want to** edit or remove any chore, **so that** I can keep the chore board organized and outdated tasks cleaned up.

**Acceptance Criteria:**
- [ ] Admin can edit the title, due date, recurrence, or assignee of any chore
- [ ] Admin can delete any chore regardless of who created it
- [ ] Regular members cannot edit or delete chores assigned to others
- [ ] Deleted chores are removed from all member views

---

### 3.3 Shared Expenses

#### US-04: Log shared expense and track balance

> **As a** household member, **I want to** log shared expenses, split them among selected members, and see a running balance, **so that** I can track who owes what without a separate spreadsheet.

**Acceptance Criteria:**
- [ ] Member can log an expense with title, amount, date, and payer
- [ ] Member selects which household members to split the cost with
- [ ] Each member's share is calculated and displayed automatically
- [ ] A running balance per member is visible to all
- [ ] Debts can be marked as settled; balance updates accordingly

---

### 3.4 Announcements

#### US-05: Post to shared household feed

> **As a** household member, **I want to** post announcements to a shared feed, **so that** I can share household updates without texting everyone individually.

**Acceptance Criteria:**
- [ ] Any member can post a text announcement to the household feed
- [ ] Announcements appear in reverse-chronological order
- [ ] Each post shows author name, avatar, and timestamp
- [ ] All members see the same feed; no private or hidden posts

---

### 3.5 Democratic Governance

#### US-06: Nominate, vote on, and see outcome of proposals

> **As a** household member, **I want to** nominate, vote on, and see the outcome of proposals — including electing a seasonal admin or removing a member — **so that** household decisions are made collectively and transparently.

**Acceptance Criteria:**
- [ ] Any member can create a proposal (elect admin, remove member, custom motion)
- [ ] All members receive a notification when a proposal is created
- [ ] Each member can cast one vote: yes or no
- [ ] Voting closes after a set duration or when all members have voted
- [ ] Outcome is determined by majority; result is applied automatically
- [ ] A full proposal history with vote counts is visible to all members

---

## 4. Feature Requirements

| Feature | Priority | Sprint | Issue |
|---|---|---|---|
| Household creation & invite link | High | Sprint 1 | [#1](https://github.com/mahamayashen/nestsync/issues/1) |
| Secure authentication (any device) | High | Sprint 1 | [#2](https://github.com/mahamayashen/nestsync/issues/2) |
| Chore creation with recurrence | High | Sprint 1 | [#3](https://github.com/mahamayashen/nestsync/issues/3) |
| Mark chore complete / shared view | High | Sprint 1 | [#4](https://github.com/mahamayashen/nestsync/issues/4) |
| Log expense + split members | High | Sprint 1 | [#5](https://github.com/mahamayashen/nestsync/issues/5) |
| Running balance per member | Medium | Sprint 2 | [#6](https://github.com/mahamayashen/nestsync/issues/6) |
| Announcements feed | Medium | Sprint 2 | [#7](https://github.com/mahamayashen/nestsync/issues/7) |
| Admin edit/delete any chore | Medium | Sprint 2 | [#8](https://github.com/mahamayashen/nestsync/issues/8) |
| Proposal creation + voting | High | Sprint 2 | [#9](https://github.com/mahamayashen/nestsync/issues/9) |
| Voting history + proposal outcomes | Medium | Sprint 2 | [#10](https://github.com/mahamayashen/nestsync/issues/10) |
| README and documentation | Low | Sprint 1 | [#11](https://github.com/mahamayashen/nestsync/issues/11) |

---

## 5. User Flows

> Implement flows in the order listed below.

### Flow 1 — Onboarding
1. User visits NestSync and clicks Register
2. Enters name, email, and password
3. Creates a named household
4. Receives a unique invite link to share with roommates
5. Lands on the household Dashboard

### Flow 2 — Join Household
1. User clicks invite link
2. Sees household preview (name, member count)
3. Registers or logs in
4. Is added to household member list
5. Lands on Dashboard with existing chores and feed visible

### Flow 3 — Chore Management
1. Member navigates to Chores tab
2. Clicks Add Chore; enters title, due date, assignee, recurrence
3. Chore appears on shared board for all members
4. Assigned member marks chore complete
5. Status updates in real time for all household members

### Flow 4 — Expense Tracking
1. Member navigates to Expenses tab
2. Clicks Log Expense; enters title, amount, date, and selects members to split with
3. Each member's share is calculated and displayed
4. Running balance tab shows who owes whom
5. Member marks debt as settled; balance updates

### Flow 5 — Democratic Governance
1. Member navigates to Votes tab
2. Clicks New Proposal; selects type (elect admin, remove member, custom)
3. All members are notified and can vote yes or no
4. Vote closes after deadline; majority determines outcome
5. Outcome applied automatically (e.g. admin badge reassigned)
6. Proposal archived in visible history

---

## 6. Non-Functional Requirements

### 6.1 Performance
- Pages load in under 2 seconds on a standard broadband connection
- Real-time updates (chore completion, vote counts) reflect within 3 seconds
- API responses under 500ms for all core endpoints

### 6.2 Security
- All routes except `/api/auth/*` require valid JWT authentication
- Admin-only actions enforced server-side via middleware (not client trust)
- Passwords hashed with bcrypt; never stored or returned in plaintext
- Auth endpoints rate-limited to prevent brute force attacks
- All user inputs validated server-side using Zod schemas

### 6.3 Accessibility
- WCAG 2.1 AA compliance required for all UI components
- All interactive elements keyboard accessible
- Color never the sole indicator of state (e.g. overdue chores use color + label)
- Minimum contrast ratio of 4.5:1 for normal text
- Modals trap focus and can be dismissed with Escape key

### 6.4 Compatibility
- Supported browsers: Chrome, Firefox, Safari, Edge (latest 2 versions each)
- Mobile-responsive layout down to 375px viewport width

### 6.5 Quality & Testing
- All code must pass linting and formatting checks (ESLint + Prettier).
- No feature is considered complete until covered by automated tests.
- Minimum **70% test code coverage** is required across the project.
- Vitest/Jest for unit tests; **Playwright** for End-to-End (E2E) testing of user interfaces.

### 6.6 CI/CD & Deployment
- Automated CI/CD pipelines must run linting, formatting, and tests on all Pull Requests.
- Good collaboration practices on GitHub (branching, PR reviews, etc.) are required.
- The project will be continuously deployed to **Vercel** (or an equivalent free-tier host).

---

## 7. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React | 18.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| Routing | React Router | 6.x |
| State Management | Zustand | 4.x |
| Backend | Node.js + Express (or Next.js API routes) | latest |
| Database | PostgreSQL (via **Supabase**) | latest |
| ORM | Prisma | 5.x |
| Auth | JWT + bcrypt (or Supabase Auth) | — |
| Code Quality | ESLint + Prettier | latest |
| Testing (Unit) | Vitest + React Testing Library | latest |
| Testing (E2E) | Playwright | latest |

---

## 8. Sprint Plan

### Sprint 1 — Core Foundation (Due: March 4, 2026)

| Issue | Title | Labels |
|---|---|---|
| [#1](https://github.com/mahamayashen/nestsync/issues/1) | Create household and generate invite link | `feature` `priority: high` |
| [#2](https://github.com/mahamayashen/nestsync/issues/2) | Secure login and authentication from any device | `feature` `priority: high` |
| [#3](https://github.com/mahamayashen/nestsync/issues/3) | Add chore with due date, assignee, and recurrence | `feature` `priority: high` |
| [#4](https://github.com/mahamayashen/nestsync/issues/4) | Mark chore as complete and reflect in shared view | `feature` `priority: high` |
| [#5](https://github.com/mahamayashen/nestsync/issues/5) | Log shared expense and split among selected members | `feature` `priority: high` |
| [#11](https://github.com/mahamayashen/nestsync/issues/11) | Set up project README and documentation | `docs` `chore` |

### Sprint 2 — Governance & Collaboration (Due: March 12, 2026)

| Issue | Title | Labels |
|---|---|---|
| [#6](https://github.com/mahamayashen/nestsync/issues/6) | Display running balance per household member | `feature` `priority: medium` |
| [#7](https://github.com/mahamayashen/nestsync/issues/7) | Post announcement to shared household feed | `feature` `priority: medium` |
| [#8](https://github.com/mahamayashen/nestsync/issues/8) | Seasonal admin can edit or delete any chore | `feature` `priority: medium` |
| [#9](https://github.com/mahamayashen/nestsync/issues/9) | Nominate and vote on household proposals | `feature` `priority: high` |
| [#10](https://github.com/mahamayashen/nestsync/issues/10) | View voting history and proposal outcomes | `feature` `priority: medium` |

---

## 9. Out of Scope (v1.0)

- Native mobile apps (iOS / Android) — web-only for v1.0
- Push notifications — in-app notifications only
- Direct messaging between members
- File / photo attachments on chores or announcements
- Integration with external payment services (Venmo, PayPal)
- Multi-household membership for a single user account

---

## 10. Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | Should vote duration be configurable per household or fixed app-wide? | Both | Open |
| 2 | What happens to admin permissions if the admin leaves the household? | Both | Open |
| 3 | Should expenses support unequal splits (e.g. percentages) in v1.0? | Both | Open |
| 4 | Do we need email notifications for proposals and chores in v1.0? | Both | Open |
