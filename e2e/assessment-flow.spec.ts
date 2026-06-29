import { test, expect } from "@playwright/test";

test.describe("Assessment Flow", () => {
  test("should complete an assessment end-to-end", async ({ page }) => {
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

    // 1. Start from the catalog
    await page.goto("/tests");

    // Look for the first test card and click its start button
    // The button might say "Mulai Tes" or "Mulai Asesmen"
    const firstTestLink = page.locator('a[href^="/test/"]').first();
    const href = await firstTestLink.getAttribute("href");
    await firstTestLink.click();

    // 2. Expected to redirect to briefing
    await expect(page).toHaveURL(/\/test\/[^\/]+\/briefing/);
    await expect(page.locator("text=/Sebelum Memulai|briefing/i").first()).toBeVisible();

    // Click "I agree" or next button
    // Often there's a checkbox for consent
    const consentCheckbox = page.getByRole("checkbox").first();
    if (await consentCheckbox.isVisible()) {
      await consentCheckbox.check();
    }

    const nextBtn = page.getByRole("button", { name: /Mulai Asesmen|Lanjutkan/i }).first();
    await nextBtn.click();

    // 3. Expected to go to personal info form
    await expect(page).toHaveURL(/\/test\/[^\/]+\/personal-info/);

    // Fill demographic fields (name, age, gender, etc.)
    const nameInput = page.getByPlaceholder(/Alex/i).first();
    await expect(nameInput).toBeVisible();
    await nameInput.fill("Test User");

    const ageInput = page.getByPlaceholder(/24/i).first();
    await ageInput.fill("25");

    // Select Sex
    await page.locator("label").filter({ hasText: "Laki-laki" }).click();

    // Select Province & City
    await page.locator('select[name="province"]').selectOption({ index: 1 });
    await page.locator('select[name="city"]').selectOption({ index: 1 });

    // Submit demographics
    await page
      .getByRole("button", { name: /Lanjut|Mulai/i })
      .first()
      .click();

    // 4. Expected to go to the actual test questions
    await expect(page).toHaveURL(/\/test\/[^\/]+(\?.*)?$/);

    // Now we are on the question page. It might be paginated or all at once.
    // We try to fill out all radio groups or choices.
    // PSS-10 has 10 questions.

    // Wait for the first question to appear
    await expect(page.locator("main").first()).toBeVisible();

    // Answer all questions
    const questionCards = await page.locator("main .survey-fade-in").all();
    for (const card of questionCards) {
      const firstRadio = card.locator('button[role="radio"]').first();
      if ((await firstRadio.count()) > 0) {
        await firstRadio.click({ force: true });
        await page.waitForTimeout(50); // slight delay to allow React state updates
      }
    }

    // Now the submit button should be enabled
    const submitButton = page.getByRole("button", { name: /Kirim Asesmen/i });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // 5. Expected to redirect to Results page (increase timeout for DB mutation)
    await expect(page).toHaveURL(/\/results\/.+/, { timeout: 15000 });
    await expect(page.locator("text=/Hasil|Skor/i").first()).toBeVisible();
  });
});
