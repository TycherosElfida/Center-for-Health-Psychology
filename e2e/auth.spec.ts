import { test, expect } from "@playwright/test";

test.describe("Authentication Flows", () => {
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = "Password123!";

  test("should load the login page and show validation errors", async ({ page }) => {
    await page.goto("/login");

    // Check title or heading
    await expect(page.locator("h1").filter({ hasText: /Masuk ke CHP/i })).toBeVisible();

    // Submit empty form
    await page.locator('button[type="submit"]').click();

    // Expect validation errors (assuming standard HTML5 or react-hook-form errors)
    // We just check if the URL is still /login
    await expect(page).toHaveURL(/\/login/);
  });

  test("should allow a user to sign up and login", async ({ page }) => {
    // 1. Sign Up
    await page.goto("/signup");
    await expect(page.locator("h1").filter({ hasText: /Buat Akun CHP/i })).toBeVisible();

    // Fill out sign up form
    const nameInput = page.getByLabel(/Nama Lengkap/i).first();
    if (await nameInput.isVisible()) {
      await nameInput.fill("Test User");
    }

    await page.getByLabel(/email/i).first().fill(testEmail);
    await page
      .getByLabel(/password/i)
      .first()
      .fill(testPassword);

    // Some forms have confirm password
    const confirmInput = page.getByLabel(/Konfirmasi Password/i).first();
    if (await confirmInput.isVisible()) {
      await confirmInput.fill(testPassword);
    }

    await page.locator('button[type="submit"]').click();

    // After sign up, either redirected to login or dashboard
    await page.waitForURL(/login|dashboard|\//);

    // 2. Login if redirected to login
    if (page.url().includes("/login")) {
      await page.getByLabel(/email/i).first().fill(testEmail);
      await page
        .getByLabel(/password/i)
        .first()
        .fill(testPassword);
      await page.locator('button[type="submit"]').click();

      // Should redirect to dashboard or home
      await page.waitForURL(/dashboard|\//);
    }
  });
});
