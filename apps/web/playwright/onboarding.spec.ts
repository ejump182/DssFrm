import { teams, users } from "./utils/mock";
import { signUpAndLogin } from "./utils/helper";
import { test, expect } from "@playwright/test";

const { role, productName, useCase } = teams.onboarding[0];

test.describe("Onboarding Flow Test", async () => {
  test("Step by Step", async ({ page }) => {
    const { name, email, password } = users.onboarding[0];
    await signUpAndLogin(page, name, email, password);
    await page.waitForURL("/onboarding");
    await expect(page).toHaveURL("/onboarding");

    await page.getByRole("button", { name: "Begin (1 min)" }).click();
    await page.getByLabel(role).check();
    await page.getByRole("button", { name: "Next" }).click();

    await expect(page.getByLabel(useCase)).toBeVisible();
    await page.getByLabel(useCase).check();
    await page.getByRole("button", { name: "Next" }).click();

    await expect(page.getByPlaceholder("e.g. Formbricks")).toBeVisible();
    await page.getByPlaceholder("e.g. Formbricks").fill(productName);

    await page.locator(".h-6").click();
    await page.getByLabel("Hue").click();

    await page.locator("div").filter({ hasText: "Create your team's product." }).nth(1).click();
    await page.getByRole("button", { name: "Done" }).click();

    await page.waitForURL(/\/environments\/[^/]+\/surveys/);
    await expect(page).toHaveURL(/\/environments\/[^/]+\/surveys/);
    await expect(page.getByText(productName)).toBeVisible();
  });

  test("Skip", async ({ page }) => {
    const { name, email, password } = users.onboarding[1];
    await signUpAndLogin(page, name, email, password);
    await page.waitForURL("/onboarding");
    await expect(page).toHaveURL("/onboarding");

    await page.getByRole("button", { name: "I'll do it later" }).click();
    await page.getByRole("button", { name: "I'll do it later" }).click();

    await page.waitForURL(/\/environments\/[^/]+\/surveys/);
    await expect(page).toHaveURL(/\/environments\/[^/]+\/surveys/);
    await expect(page.getByText("My Product")).toBeVisible();
  });
});
