---
trigger: always_on
---

# NestSync .antigravityrules

## 0. Preface
- Any message you want to communicate with me, start it with a star emoji(⭐️). This is unless you are generating some special formats

## 1. Project Context
**Project Name:** NestSync (Shared Household Management)
**Tech Stack:**
- **Frontend:** Next.js (App Router), Tailwind CSS, Lucide React (Icons)
- **Backend/Auth/DB:** Supabase (PostgreSQL + Realtime)
- **State Management:** TanStack Query (React Query)
- **Deployment:** Vercel

**Architecture Overview:**
- `/app`: Next.js App Router (pages and layouts)
- `/components/ui`: Atomic UI components (Shadcn-inspired)
- `/components/household`: Domain-specific components (ChoreCard, ExpenseTracker)
- `/hooks`: Custom React hooks for Supabase logic
- `/lib`: Supabase client, utility functions, and shared types
- `/types`: TypeScript interfaces for Database and App state

**Naming Conventions:**
- **Components:** PascalCase (e.g., `AdminElection.tsx`)
- **Functions/Variables:** camelCase (e.g., `handleVoteSubmit`)
- **Files:** kebab-case for non-component files (e.g., `supabase-client.ts`)

**Testing Strategy:**
- **Framework:** Jest + React Testing Library
- **Focus:** Unit tests for "Democratic Governance" logic (voting tallies) and Expense splitting.
- **Coverage Goal:** 80% for business logic in `/lib` and `/hooks`.

---

## 2. PRD & Design References
**Core Philosophy:** NestSync is built for peers, not employees. Avoid "Corporate Jira" terminology. Use "Housemate," "Household," and "Seasonal Admin."

**Key UI Components & Behavior:**
- **Governance Layer:** A voting interface for electing the Seasonal Admin or removing members.
- **Chore Board:** Simple card-based layout with "Mark Complete" functionality.
- **Shared Expense Log:** A ledger style view showing "Who owes Who" based on selected splits.
- **Shared Feed:** A chronological announcement stream for non-task communication.

**User Flows:**
1. **Onboarding:** Invite Link -> Auth -> Join Household.
2. **Governance:** Nomination -> Voting Period -> Automated Role Update.
3. **Finances:** Log Expense -> Select Split Participants -> Update Balances.

---

## 3. Scrum & Workflow Instructions
- **Branch Naming:** `feature/[issue-number]-[short-description]` (e.g., `feature/12-chore-recurrence`)
- **Commit Format:** `feat: description`, `fix: description`, or `docs: description`. Always include the issue number at the end: `(close #12)`.
- **GitHub Integration:** Always check `@issues` before starting a new feature implementation. 

---

## 4. Do's and Don'ts
**Do's:**
- **Prefer Realtime:** Use Supabase Realtime for the shared feed and chore updates.
- **Mobile First:** Ensure all UI components are highly responsive (Tailwind `sm`/`md` breakpoints).
- **Democratic Logic:** Ensure the "Seasonal Admin" role has restricted power (can delete chores/announcements, but cannot unilaterally change house rules without a vote).
- **Accessibility:** Use semantic HTML tags and ARIA labels for all interactive elements.

**Don'ts:**
- **NO Local File System:** The app is purely cloud-based via Supabase; do not use `fs` or local storage for persistent data.
- **No Hierarchy:** Do not implement "Owner" vs "User" roles. All users are equals unless elected as the "Seasonal Admin."
- **Avoid Heavy Libraries:** Keep the bundle light; prefer native browser APIs and Tailwind over heavy CSS-in-JS libraries.
- **No Group Chat Sprawl:** Do not implement a 1:1 DM system; keep communication centered on the Shared Feed or specific tasks.

**Security Requirements:**
- **Row Level Security (RLS):** Every Supabase query must respect `household_id` to prevent cross-household data leakage.
- **Auth:** All routes except Landing and Login must be protected by middleware.