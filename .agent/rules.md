# Antigravity Rules & Guidelines (NestSync)

This file defines the strict rules, standards, and guidelines that I (Antigravity) must follow when building and modifying the NestSync project.

## 1. Code Quality & Formatting
*   **Standards:** Maintain high-quality development standards at all times.
*   **Linting & Formatting:** Use **ESLint** and **Prettier** for all code. Before finalizing any PR or feature, ensure all linting errors and formatting warnings are resolved.
*   **Best Practices:** Follow modern React/TypeScript best practices (e.g., semantic HTML, accessibility (WCAG AA), functional components, early returns, clean naming conventions).

## 2. Testing & Coverage
*   **Coverage Requirement:** The overall project must maintain a minimum of **70% test code coverage**.
*   **Rule of Completion:** A feature or task is **not considered complete** until it is fully covered by automated tests.
*   **Test Stack:**
    *   **Unit Tests:** Use **Vitest** (or Jest) + React Testing Library for component and logic testing.
    *   **End-to-End (E2E):** Use **Playwright** for complete user interface and workflow testing.

## 3. Collaboration & CI/CD
*   **GitHub Flow:** Follow good collaboration practices. Do not push directly to `main` without consideration. Work in branches and assume code will be reviewed via Pull Requests.
*   **CI/CD:** The project relies on automated pipelines (e.g., GitHub Actions) to verify tests and linting before merging.
*   **Deployment:** The target production environment is **Vercel**. Ensure build scripts, environment variables, and routing configurations are Vercel-compatible.

## 4. Tech Stack & Architecture
*   **Database:** Use **PostgreSQL via Supabase**. Leverage Supabase for database schemas, queries, and potentially auth/storage if it simplifies the stack.
*   **Frontend/Backend:** React 18+ and TypeScript. If leveraging Vercel, strongly favor Next.js API routes or similar lightweight backend structures to pair with Supabase.

## 5. Project Memory
*   Always consult the `project_memory` directory (e.g., `PRD.md`, `mom_test_notes.md`) to understand user constraints, personas, stories, and design parameters before making architectural decisions.
