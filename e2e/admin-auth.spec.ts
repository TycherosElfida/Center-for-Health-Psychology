import { test, expect } from "@playwright/test";

test.describe("Admin Authentication", () => {
  // Use dotenv in the test script to load the secrets since it runs in the Node context
  // Playwright tests can read process.env normally if loaded
  test.beforeEach(async ({ page }) => {
    // Navigate to the admin login portal
    await page.goto("/admin/login");
  });

  test("should reject invalid credentials", async ({ page }) => {
    // Fill out the login form
    await page.locator("#admin-email").fill("wrongadmin@chp.ac.id");
    await page.locator("#admin-password").fill("wrongpassword");

    // Click submit
    await page.getByRole("button", { name: /sign in/i }).click();

    // Verify error message from tRPC
    await expect(page.locator('p[role="alert"]')).toContainText("Invalid email or password");
  });

  test("should successfully login and redirect to dashboard", async ({ page }) => {
    // Fallbacks just in case the env variables are missing in CI
    const adminEmail = process.env.ADMIN_EMAIL || "superadmin@chp.ac.id";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin123456!";

    await page.locator("#admin-email").fill(adminEmail);
    await page.locator("#admin-password").fill(adminPassword);

    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for the custom window.location.href redirect
    await expect(page).toHaveURL(/\/admin\/(dashboard|change-password)/, { timeout: 10000 });
  });
});
