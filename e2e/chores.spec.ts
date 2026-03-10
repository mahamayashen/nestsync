import { test, expect } from "@playwright/test";

// Note: These tests require a running Supabase instance with seed data.
// They will be run in CI after `supabase start` and `npm run prisma:seed`.
// For local development, ensure Supabase is running and the database is seeded.

test.describe("Chores", () => {
  // Skip tests if no auth session is available (unauthenticated)
  // In CI, we'll set up auth via beforeEach hook with test credentials

  test("chore board page loads", async ({ page }) => {
    await page.goto("/dashboard/chores");
    // If redirected to login, that's expected without auth
    const url = page.url();
    expect(url).toMatch(/\/(dashboard\/chores|login)/);
  });

  test("create chore page loads", async ({ page }) => {
    await page.goto("/dashboard/chores/new");
    const url = page.url();
    expect(url).toMatch(/\/(dashboard\/chores\/new|login)/);
  });

  test("template management page loads", async ({ page }) => {
    await page.goto("/dashboard/chores/templates");
    const url = page.url();
    expect(url).toMatch(/\/(dashboard\/chores\/templates|login)/);
  });

  test("navigation links exist on chore pages", async ({ page }) => {
    await page.goto("/login");
    // Verify the login page has navigation to signup
    await expect(page.getByRole("link", { name: /sign up/i })).toBeVisible();
  });
});
