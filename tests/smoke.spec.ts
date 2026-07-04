import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/SubAuditor/);
  });

  test("pricing page loads and shows INR price", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("text=Pro")).toBeVisible();
    // Should show INR price, not USD
    await expect(page.locator("text=₹599")).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=Welcome back")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("register page loads", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("text=Create your audit")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});

test.describe("Auth flow", () => {
  test("register creates account and redirects to dashboard", async ({ page }) => {
    const email = `test-${Date.now()}@example.com`;
    const password = "TestPassword123!";

    await page.goto("/register");
    await page.fill('input[id="name"]', "Test User");
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard after successful registration
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "nonexistent@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator("text=Invalid email or password")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Dashboard (unauthenticated)", () => {
  test("redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to login
    await page.waitForURL("**/login", { timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("API health", () => {
  test("auth providers endpoint returns config", async ({ request }) => {
    const response = await request.get("/api/auth/providers");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("credentials", true);
  });
});
