import { test, expect } from "@playwright/test";

test("home redirects to login when signed out", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
});

test("login page renders sign-in button", async ({ page }) => {
  await page.goto("/login");
  await expect(
    page.getByRole("button", { name: /sign in with github/i }),
  ).toBeVisible();
});
