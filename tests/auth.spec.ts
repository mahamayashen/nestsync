import { test, expect } from '@playwright/test';

test('Landing page loads and has Get Started button', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Households without the headache/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Get Started/i })).toBeVisible();
});

test('Can navigate to signup page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Get Started/i }).click();
  await expect(page).toHaveURL(/.*\/auth/);
  await expect(page.getByRole('heading', { name: /Create an account/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Sign Up/i })).toBeVisible();
});

test('Can toggle between sign in and sign up', async ({ page }) => {
  await page.goto('/auth');
  await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
  
  await page.getByRole('button', { name: /Sign up/i }).click();
  await expect(page.getByRole('heading', { name: /Create an account/i })).toBeVisible();
  
  await page.getByRole('button', { name: /Sign in/i }).click();
  await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
});
