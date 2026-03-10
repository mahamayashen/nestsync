# NestSync Testing & CI/CD Guide

## Overview

This document explains the testing infrastructure and CI/CD pipeline for NestSync. It covers what tools we use, how the tests are organized, and how the automated pipeline protects the `main` branch from broken code.

---

## Testing Infrastructure

### Three Layers of Testing

We use a layered testing strategy. Each layer catches different types of bugs at different levels of the application.

#### Layer 1: Unit Tests (Pure Logic)

**What they test:** Individual functions in isolation — no network, no database, no browser.

**Think of it as:** Checking if a single math formula gives the right answer.

**Examples:**
- `computeRecurrenceDates("weekly", Jan 1, Jan 31)` — does it return approximately 5 dates?
- `createChoreTemplateSchema` — does it reject an empty chore title? Does it reject points less than 1?
- `formatDateForDB(new Date(2026, 2, 10))` — does it output `"2026-03-10"`?
- `loginSchema` — does it require a valid email and non-empty password?

**Where they live:**
- `src/lib/chores/instance-generator.test.ts` — recurrence date logic
- `src/lib/chores/validation.test.ts` — chore form validation rules
- `src/lib/auth/validation.test.ts` — auth form validation rules

**Tools:** Vitest (test runner)

---

#### Layer 2: Integration Tests (Server Actions + Mocked Database)

**What they test:** Next.js server actions — the functions that execute on the server when a user submits a form. We create a "fake" Supabase client that returns pre-set responses instead of hitting a real database.

**Think of it as:** Testing the entire kitchen workflow (take order → cook → plate → serve) but with plastic food — you verify every step happens in the right order without needing real ingredients.

**What we mock (fake):**
- `@/lib/supabase/server` → fake Supabase client with chainable `.from().insert().select().single()` methods
- `@/lib/household/queries` → fake `getCurrentMembership()` that returns a test user
- `next/navigation` → fake `redirect()` that throws `NEXT_REDIRECT` (matching Next.js behavior)

**Examples:**
- `createChoreTemplate`: valid input → inserts template → generates instances → redirects to `/dashboard/chores`
- `createChoreTemplate`: empty title → returns `{ error: "..." }`, never touches the database
- `deleteChoreTemplate`: member with `members_can_edit_own_chores=false` → returns permission error
- `deleteChoreTemplate`: member who owns the template with setting enabled → succeeds
- `login`: valid credentials → redirects to dashboard
- `signup`: with invite code → joins household → redirects to dashboard

**Where they live:**
- `src/lib/chores/actions.test.ts` — chore CRUD operations (20 tests)
- `src/lib/auth/actions.test.ts` — authentication flows (29 tests)

**Tools:** Vitest + custom Supabase mock factory (`src/test/helpers.ts`)

---

#### Layer 3: End-to-End (E2E) Tests (Real Browser, Real App)

**What they test:** The full application running in a real browser. Playwright opens Chrome, navigates to pages, clicks buttons, fills forms, and checks what appears on screen.

**Think of it as:** Hiring a person to manually test your app — except the "person" is a script that runs in seconds and never gets tired.

**Requirements:** A running Next.js dev server + Supabase instance with migrations applied.

**Examples:**
- Navigate to `/dashboard` → should redirect to `/login` (unauthenticated user protection)
- Navigate to `/login` → should see "Welcome back" heading, email/password fields, sign-in button
- Type wrong credentials on login → should display an error alert
- Navigate to `/signup` → should see "Create an account" heading

**Where they live:**
- `e2e/auth.spec.ts` — authentication page tests (4 tests)
- `e2e/chores.spec.ts` — chore page navigation tests (4 tests)

**Tools:** Playwright (browser automation)

---

### Test Count Summary

| Category | Files | Tests |
|---|---|---|
| Unit (pure logic) | 7 | ~83 |
| Integration (server actions) | 2 | 49 |
| Component (React rendering) | 14 | 129 |
| E2E (browser) | 2 | 8 |
| **Total** | **25** | **269** |

---

### Test Utilities (`src/test/helpers.ts`)

Shared test helpers that reduce boilerplate across all test files:

- **`buildFormData(fields)`** — creates a `FormData` object from a plain object (simulates form submissions)
- **`mockMembership(overrides?)`** — creates a fake `CurrentMembership` with sensible defaults (memberId, householdId, role, etc.)
- **`createMockSupabase(result?)`** — creates a fake Supabase client with chainable methods (`.from().select().eq().single()`)
- **`renderWithProviders(ui)`** — renders a React component wrapped in `QueryClientProvider` (for components that use React Query)
- **`TEST_UUID` / `TEST_UUID_2` / `TEST_UUID_3`** — valid UUID constants that pass Zod v4 validation

---

### Running Tests Locally

```bash
# Run all unit + integration + component tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run E2E tests (requires Supabase running)
npm run test:e2e

# Run E2E tests with interactive UI
npm run test:e2e:ui
```

---

## CI/CD Pipeline (GitHub Actions)

### What is CI/CD?

**CI (Continuous Integration):** Every time you push code or open a pull request, automated checks run to verify your code works correctly.

**CD (Continuous Delivery):** Once all checks pass, the code is safe to merge and deploy.

**The key benefit:** Broken code never reaches the `main` branch. If a test fails, a type error exists, or a lint rule is violated, the pipeline blocks the merge.

---

### Pipeline Architecture

We have two workflows:

#### 1. CI Pipeline (`.github/workflows/ci.yml`)

Runs on: pushes to `main` + pull requests to `main` + manual trigger

```
┌─────────────────────────────────────────┐
│           Stage 1 (parallel)            │
│                                         │
│   ┌──────────┐     ┌──────────────┐     │
│   │   Lint   │     │  Typecheck   │     │
│   │ (ESLint) │     │ (tsc --noEmit│     │
│   └────┬─────┘     └──────┬───────┘     │
│        │                  │             │
└────────┼──────────────────┼─────────────┘
         │                  │
         ▼                  ▼
┌─────────────────────────────────────────┐
│        Stage 2: Tests + Coverage        │
│                                         │
│   261 tests must pass                   │
│   Coverage must be > 80%                │
│   Coverage report uploaded as artifact  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│           Stage 3: Build                │
│                                         │
│   next build (production compilation)   │
│   Catches build-time errors             │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Stage 4: E2E Tests              │
│                                         │
│   Starts Supabase in CI                 │
│   Launches app + Playwright             │
│   8 browser tests                       │
│   Report uploaded as artifact           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│     Side Stage: Security Audit          │
│     (runs parallel with Stage 2)        │
│                                         │
│   Scans npm packages for               │
│   known vulnerabilities                 │
└─────────────────────────────────────────┘
```

**Stage details:**

| Stage | Job Name | What It Does | Fails If... |
|---|---|---|---|
| 1a | Lint | Runs `eslint .` to check code style and catch common bugs | Any lint error exists |
| 1b | Typecheck | Runs `tsc --noEmit` to verify all TypeScript types are correct | Any type error exists |
| 2 | Tests + Coverage | Runs all 261 Vitest tests and measures code coverage | Any test fails OR coverage < 80% |
| 3 | Build | Compiles the production app with `next build` | Build errors (missing imports, bad config, etc.) |
| 4 | E2E Tests | Starts Supabase + app, runs 8 Playwright browser tests | Any E2E test fails |
| Side | Security Audit | Runs `audit-ci --high` to scan for vulnerable dependencies | High-severity vulnerability found |

#### 2. PR Preview (`.github/workflows/preview.yml`)

Runs on: pull requests to `main` + manual trigger

A lighter workflow that runs lint + typecheck + tests with coverage, then **posts a coverage summary as a comment on your PR**. This gives you quick feedback on code quality without waiting for the full pipeline.

---

### What Happens When You Open a PR

1. You push code to a feature branch and open a PR targeting `main`
2. GitHub Actions automatically starts both workflows
3. Lint and Typecheck run in parallel (~30 seconds each)
4. If both pass, Tests + Coverage runs (~40 seconds)
5. If tests pass, Build runs (~35 seconds)
6. If build passes, E2E tests run (~3 minutes, includes Supabase startup)
7. PR Preview posts a coverage summary comment on your PR
8. If all checks are green, the "Merge pull request" button becomes available
9. If any check fails, merging is blocked until the issue is fixed

---

### Coverage Thresholds

The pipeline enforces minimum coverage thresholds:

| Metric | Minimum | Current |
|---|---|---|
| Statements | 80% | 92%+ |
| Branches | 75% | 90%+ |
| Functions | 80% | 92%+ |
| Lines | 80% | 92%+ |

**What is covered:**
- `src/lib/**` — all business logic (auth actions, chore actions, validation, queries)
- `src/components/**` — all React components
- `src/hooks/**` — all custom hooks

**What is excluded from coverage:**
- `src/test/**` — test utilities themselves
- `src/types/**` — TypeScript type definitions
- `src/app/**/page.tsx` — Next.js page components (tested via E2E instead)

---

### Environment Variables in CI

The CI pipeline uses Supabase's default local development keys (safe to commit — they only work with `supabase start`):

- `NEXT_PUBLIC_SUPABASE_URL` — points to local Supabase instance (`http://127.0.0.1:54321`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — default anon key for local Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — default service role key for local Supabase

These are NOT production credentials. They are the standard keys generated by `supabase init` and only work with a local Supabase instance.

---

### Configuration Files

| File | Purpose |
|---|---|
| `vitest.config.ts` | Vitest configuration: jsdom environment, path aliases, coverage thresholds |
| `playwright.config.ts` | Playwright configuration: Chrome-only, auto-start dev server, screenshots on failure |
| `src/test/setup.ts` | Global test setup: imports `@testing-library/jest-dom` matchers |
| `src/test/helpers.ts` | Shared mock factories and test utilities |
| `.github/workflows/ci.yml` | Main 6-stage CI pipeline |
| `.github/workflows/preview.yml` | PR preview with coverage comment |

---

## Quick Reference

```bash
# Development
npm run dev              # Start dev server
npm run lint             # Check code style
npx tsc --noEmit         # Check types

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Tests + coverage report
npm run test:e2e         # E2E tests (needs Supabase)

# CI (runs automatically on PR)
# Lint → Typecheck → Tests → Build → E2E → Security
```
