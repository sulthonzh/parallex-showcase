import { test, expect } from "@playwright/test";

test("home renders landing page for signed-out visitors", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Get Started" })).toBeVisible();
});

test("login page renders sign-in button", async ({ page }) => {
  await page.goto("/login");
  await expect(
    page.getByRole("button", { name: /sign in with github/i }),
  ).toBeVisible();
});
