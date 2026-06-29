import { test, expect } from "@playwright/test";

test.describe("Privacy & UU PDP Compliance", () => {
  test("should not require or ask for PII (Email/Phone) during anonymous assessment", async ({
    page,
  }) => {
    // 1. Go to public catalog
    await page.goto("/tests");

    // 2. Select any test (e.g., PSS-10)
    const testCard = page
      .locator("text=/Perceived Stress Scale|Self-Reporting Questionnaire/i")
      .first();
    await testCard.click();

    // Wait for briefing
    await expect(page).toHaveURL(/\/test\/[a-z0-9-]+\/briefing/);

    // 3. Accept Consent (Explicit consent requirement in UU PDP)
    const consentCheckbox = page.getByRole("checkbox").first();
    if (await consentCheckbox.isVisible()) {
      await consentCheckbox.check();
    }
    await page
      .getByRole("button", { name: /Mulai Asesmen|Lanjutkan/i })
      .first()
      .click();

    // Wait for the URL to change to personal-info
    await expect(page).toHaveURL(/\/test\/[^\/]+\/personal-info/);

    // 4. Verify Personal Info Form (Data Minimization)
    await expect(page.getByRole("heading", { name: /Ceritakan Tentang Dirimu/i })).toBeVisible();

    // Verify it asks for Name (initials allowed), Age, Sex, Province, City
    await expect(page.getByText(/Nama atau Inisial/i)).toBeVisible();
    await expect(page.getByText(/Usia/i).first()).toBeVisible();

    // VERIFY IT DOES NOT ASK FOR EMAIL OR PHONE (Data Minimization)
    const emailInput = page.getByLabel(/Email/i);
    const phoneInput = page.getByLabel(/Nomor Telepon/i);
    const hpInput = page.getByLabel(/No HP/i);

    await expect(emailInput).toHaveCount(0);
    await expect(phoneInput).toHaveCount(0);
    await expect(hpInput).toHaveCount(0);

    // Verify the privacy shield text is present
    await expect(
      page.locator("text=/tidak akan pernah dibagikan kepada pihak ketiga/i")
    ).toBeVisible();
  });
});
