import { test, expect } from "@playwright/test";

test.describe("Public Navigation", () => {
  test("should load the home page and have key sections", async ({ page }) => {
    await page.goto("/");

    // Check title
    await expect(page).toHaveTitle(/Center for Health Psychology/);

    // The page should have the hero section, so we look for an H1
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();

    // Check navigation links
    await expect(page.getByRole("link", { name: "Asesmen" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Tentang CHP" }).first()).toBeVisible();
  });

  test("should navigate to Assessments page", async ({ page }) => {
    await page.goto("/");

    // Click on Assessments link
    await page.getByRole("link", { name: "Asesmen" }).first().click();

    // Expect URL to change
    await expect(page).toHaveURL(/\/tests/);

    // Expect some heading related to assessments
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
  });

  test("should navigate to About page", async ({ page }) => {
    await page.goto("/");

    // Click on About link
    await page.getByRole("link", { name: "Tentang CHP" }).first().click();

    // Expect URL to change
    await expect(page).toHaveURL(/\/about/);
  });
});
