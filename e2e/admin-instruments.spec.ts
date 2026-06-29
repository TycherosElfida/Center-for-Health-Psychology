import { test, expect } from "@playwright/test";

test.describe("Admin Instrument Management", () => {
  // Use dotenv in the test script to load the secrets since it runs in the Node context
  test.beforeEach(async ({ page }) => {
    // 1. Authenticate as Super Admin
    await page.goto("/admin/login");

    const adminEmail = process.env.ADMIN_EMAIL || "superadmin@chp.ac.id";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin123456!";

    await page.locator("#admin-email").fill(adminEmail);
    await page.locator("#admin-password").fill(adminPassword);
    await page.getByRole("button", { name: /sign in/i }).click();

    // 2. Wait for redirect
    await expect(page).toHaveURL(/\/admin\/(dashboard|change-password)/, { timeout: 10000 });
  });

  test("should load the assessments dashboard and list seeded instruments", async ({ page }) => {
    // Navigate to the assessments page
    await page.goto("/admin/assessments");

    // Wait for the table headers
    await expect(page.getByRole("heading", { name: /Assessment Instruments/i })).toBeVisible();

    // Wait for the tRPC query to load the tests
    // Check if the generic table data is populated by looking for the row with PSS-10
    const pss10Row = page.locator("tr").filter({ hasText: "PSS-10" });
    await expect(pss10Row).toBeVisible({ timeout: 15000 });

    const srq29Row = page.locator("tr").filter({ hasText: "SRQ-29" });
    await expect(srq29Row).toBeVisible();
  });

  test("should allow clicking into an instrument to view its metadata", async ({ page }) => {
    await page.goto("/admin/assessments");

    // Wait for data
    const pss10Row = page.locator("tr").filter({ hasText: "PSS-10" });
    await expect(pss10Row).toBeVisible({ timeout: 15000 });

    // Click the row to enter the edit/metadata page
    await pss10Row.click();

    // Verify redirect to /admin/assessments/[id]
    await expect(page).toHaveURL(/\/admin\/assessments\/.+/, { timeout: 10000 });

    // Wait for the internal edit page to load (should have a "General Info" or similar title)
    // We'll just assert that the slug 'pss10' or title is visible on the inner page
    await expect(page.locator("text=/Perceived Stress Scale/i").first()).toBeVisible({
      timeout: 15000,
    });
  });
});
