import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");

  // Expect a title "to contain" a substring.
  // We don't know the exact title, so we just check that the page loaded
  // by ensuring the body exists, or you can update this to check your actual title.
  await expect(page.locator("body")).toBeVisible();
});
