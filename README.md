# NestSync

A shared household management app for roommates and families — chores, announcements, and democratic governance.

**Live:** [nestsync-delta.vercel.app](https://nestsync-delta.vercel.app)

## Overview

NestSync helps households stay organized and fair. Assign and track chores with a points system, make group decisions through democratic voting and share announcements — all in one place. Built with a modern stack and designed for real-time collaboration.

## Features

- **Chores** — Create, assign, and track chores with a points-based fairness system. Supports one-time, daily, weekly, and custom day-of-week recurrence. Calendar view shows the full weekly schedule.
- **Voting & Proposals** — Democratic decision-making for electing admins, removing members, or any custom household motion. Configurable quorum and voting deadlines.
- **Announcements Feed** — Post updates, pin important announcements (admin), and react with emoji.
- **Household Management** — Create or join households via invite codes. Admin and member roles with configurable permissions.
- **Authentication** — Email/password and Google OAuth sign-in via Supabase Auth.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js](https://nextjs.org) 16 (App Router) |
| Language | [TypeScript](https://typescriptlang.org) 5.9 |
| UI | [React](https://react.dev) 19, [Tailwind CSS](https://tailwindcss.com) 4 |
| Icons | [Phosphor Icons](https://phosphoricons.com) |
| Database | [Supabase](https://supabase.com) (PostgreSQL + Auth + RLS) |
| ORM | [Prisma](https://prisma.io) 5 |
| Data Fetching | [TanStack React Query](https://tanstack.com/query) 5 |
| Client State | [Zustand](https://zustand.docs.pmnd.rs) 5 |
| Validation | [Zod](https://zod.dev) 4 |
| Testing | [Vitest](https://vitest.dev) + [Playwright](https://playwright.dev) |
| Hosting | [Vercel](https://vercel.com) |

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npx supabase`)
- Docker (for local Supabase)

### Setup

```bash
# Clone the repository
git clone https://github.com/mahamayashen/nestsync.git
cd nestsync

# Install dependencies
npm install

# Start Supabase local stack (requires Docker)
npx supabase start

# Copy environment template and fill in values from supabase start output
cp .env.example .env.local

# Generate Supabase TypeScript types
npm run gen:types

# Run Prisma migrations against local database
npm run prisma:migrate

# Start the dev server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL (`http://127.0.0.1:54321` for local) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `DATABASE_URL` | PostgreSQL connection string (for Prisma) |
| `DIRECT_URL` | Direct PostgreSQL connection (non-pooled, for Prisma) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (optional) |
| `NEXT_PUBLIC_SITE_URL` | Public URL of the app (for email redirects) |

## Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── (auth)/                 # Auth pages (login, signup, onboarding)
│   ├── (dashboard)/dashboard/  # Dashboard pages (calendar, chores, feed, votes, etc.)
│   ├── auth/callback/          # OAuth callback handler
│   └── invite/[code]/          # Invite code landing page
├── components/                 # React components
│   ├── auth/                   # Login/signup forms, OAuth button
│   ├── calendar/               # Weekly calendar, event chips
│   ├── chores/                 # Chore cards, forms, templates, day picker
│   ├── dashboard/              # Sidebar, top bar, layout
│   ├── feed/                   # Announcement cards, create form, reactions
│   ├── household/              # Admin panel, member list, settings
│   ├── proposals/              # Proposal cards, create form, vote buttons
│   └── ui/                     # Shared form fields, buttons
├── lib/                        # Business logic
│   ├── auth/                   # Auth actions, validation, redirect logic
│   ├── calendar/               # Calendar event queries
│   ├── chores/                 # Chore CRUD, instance generation, scheduling
│   ├── household/              # Household & member queries
│   ├── proposals/              # Proposal CRUD, vote resolution
│   └── supabase/               # Supabase client setup (browser, server, admin)
├── hooks/                      # Custom React hooks
├── types/                      # TypeScript types (database.types.ts, index.ts)
└── test/                       # Test setup and utilities
```

## Database

13 models across household management, chores, expenses, and governance:

| Table | Purpose |
|-------|---------|
| `users` | User profiles (linked to Supabase Auth) |
| `households` | Household settings (timezone, max members, voting rules) |
| `household_members` | Membership join table with roles (admin/member) |
| `chore_templates` | Reusable chore definitions with recurrence and schedule |
| `chore_instances` | Individual chore occurrences with due dates and status |
| `expenses` | Shared expenses with category and split type |
| `expense_splits` | Per-member amounts owed for each expense |
| `settlements` | Payments between members |
| `announcements` | Household feed posts with pinning support |
| `announcement_reactions` | Emoji reactions on announcements |
| `proposals` | Governance proposals (elect admin, remove member, custom) |
| `votes` | Individual votes on proposals |
| `admin_history` | Audit log of admin transitions |

Supabase Row Level Security (RLS) ensures members can only access their own household's data.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit/integration tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run gen:types` | Regenerate Supabase TypeScript types |
| `npm run prisma:migrate` | Create and run Prisma migrations |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run db:reset` | Reset the database |

## Testing

**Unit & Integration** — 620+ tests using Vitest with JSDOM environment and Testing Library:

```bash
npm test                 # Run all tests
npm run test:coverage    # With coverage report (80% threshold)
```

**End-to-End** — Playwright tests against a local Supabase stack:

```bash
npm run test:e2e         # Headless
npm run test:e2e:ui      # Interactive UI
```

## Deployment

NestSync is deployed on **Vercel** with a **Supabase Cloud** database.

1. Create a [Supabase Cloud](https://supabase.com) project and run the migrations from `supabase/migrations/`
2. Link the repo to [Vercel](https://vercel.com) and set the environment variables listed above
3. Deploy with `npx vercel --prod` or push to `main`
4. Configure Supabase Auth URL settings (Site URL + redirect URLs) and Google OAuth credentials for the production domain

## License

MIT
