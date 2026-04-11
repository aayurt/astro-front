import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const API_BASE_URL = 'http://localhost:3001';

// Generate unique test data to avoid conflicts
const timestamp = Date.now();
const testUser = {
  email: `test${timestamp}@astro.com`,
  password: `TestPass123!`,
  name: `Test User ${timestamp}`,
};

test.describe('Authenticated User Flow - Senior Analyst Tests', () => {
  let page;
  let context;

  test.beforeAll(async ({ browser }) => {
    // Create a persistent context for cookies/storage
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should sign up a new user successfully', async () => {
    await page.goto(`${BASE_URL}/signup`);
    await page.waitForLoadState('networkidle');

    // Fill in signup form
    await page.fill('input[placeholder="Full Name"]', testUser.name);
    await page.fill('input[placeholder="Email address"]', testUser.email);
    await page.fill('input[placeholder="Password"]', testUser.password);

    // Submit form
    await page.click('button:has-text("Start Your Journey")');

    // Wait for redirect or success indication
    await page.waitForLoadState('networkidle');

    // Check if we're redirected to login or see success message
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');

    // Alternative: check for success toast/notification
    const successMsg = page
      .locator('text=Account created successfully')
      .first();
    const isSuccessVisible = await successMsg.isVisible().catch(() => false);
    if (isSuccessVisible) {
      console.log('[SUCCESS] User signup successful');
    } else {
      console.log('[INFO] Signup submitted, checking for redirect...');
    }
  });

  test('should log in with the newly created user', async () => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Fill in login form
    await page.fill('input[placeholder="Email address"]', testUser.email);
    await page.fill('input[placeholder="Password"]', testUser.password);

    // Submit form
    await page.click('button:has-text("Login to Dashboard")');

    // Wait for redirect to dashboard or home
    await page
      .waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 })
      .catch(() => page.waitForURL(`${BASE_URL}/`, { timeout: 5000 }));

    const currentUrl = page.url();
    expect(currentUrl).toContain('/dashboard');

    // Verify we're logged in by checking for user-specific elements
    const userNameElement = page.locator(`text=${testUser.name}`).first();
    const isUserVisible = await userNameElement.isVisible().catch(() => false);
    expect(isUserVisible).toBe(true);

    console.log('[SUCCESS] User login successful');
  });

  test.describe('Protected Route Access Tests', () => {
    test.beforeEach(async () => {
      // Ensure we're on dashboard before testing protected routes
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
    });

    test('should access dashboard successfully', async () => {
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`);

      // Check for dashboard-specific elements
      const dashboardHeading = page
        .locator('h1, h2')
        .filter({ hasText: /dashboard|overview|welcome/i })
        .first();
      const isHeadingVisible = await dashboardHeading
        .isVisible()
        .catch(() => false);

      // Alternative checks for dashboard content
      const hasContent =
        (await page
          .locator('text=Dashboard, text=Overview, text=Welcome')
          .count()) > 0;

      expect(isHeadingVisible || hasContent).toBe(true);
      console.log('[PASS] Dashboard accessible');
    });

    test('should access birth chart page', async () => {
      await page.goto(`${BASE_URL}/birth-chart`);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      expect(currentUrl).toContain('/birth-chart');

      // Check for birth chart specific elements
      const hasBirthChartElements =
        (await page
          .locator(
            'text=Birth Chart, text=Natal Chart, text=Zodiac, canvas, svg',
          )
          .count()) > 0;

      expect(hasBirthChartElements).toBe(true);
      console.log('[PASS] Birth chart page accessible');
    });

    test('should access transit page', async () => {
      await page.goto(`${BASE_URL}/transit`);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      expect(currentUrl).toContain('/transit');

      // Check for transit specific elements
      const hasTransitElements =
        (await page
          .locator('text=Transit, text=Planetary, text=Current, text=Upcoming')
          .count()) > 0;

      expect(hasTransitElements).toBe(true);
      console.log('[PASS] Transit page accessible');
    });

    test('should access AI consultation page', async () => {
      await page.goto(`${BASE_URL}/ai`);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      expect(currentUrl).toContain('/ai');

      // Check for AI specific elements
      const hasAIElements =
        (await page
          .locator(
            'text=AI, text=Consultation, text=Chat, text=Ask, input, textarea',
          )
          .count()) > 0;

      expect(hasAIElements).toBe(true);
      console.log('[PASS] AI consultation page accessible');
    });

    test('should access profile page', async () => {
      await page.goto(`${BASE_URL}/profile`);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      expect(currentUrl).toContain('/profile');

      // Check for profile specific elements
      const hasProfileElements =
        (await page
          .locator(
            `text=${testUser.name}, text=Profile, text=Account, text=Settings`,
          )
          .count()) > 0;

      expect(hasProfileElements).toBe(true);
      console.log('[PASS] Profile page accessible');
    });

    test('should access onboarding page', async () => {
      await page.goto(`${BASE_URL}/onboarding`);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      expect(currentUrl).toContain('/onboarding');

      // Check for onboarding specific elements
      const hasOnboardingElements =
        (await page
          .locator('text=Onboarding, text=Get Started, text=Welcome, text=Step')
          .count()) > 0;

      expect(hasOnboardingElements).toBe(true);
      console.log('[PASS] Onboarding page accessible');
    });
  });

  test.describe('Data Integrity & UI Consistency Tests', () => {
    test('should maintain user data consistency across pages', async () => {
      // Visit profile page and check user data
      await page.goto(`${BASE_URL}/profile`);
      await page.waitForLoadState('networkidle');

      // Check that user email is displayed correctly (if shown)
      const emailElement = page.locator(`text=${testUser.email}`).first();
      const emailVisible = await emailElement.isVisible().catch(() => false);

      // Check that user name is displayed correctly
      const nameElement = page.locator(`text=${testUser.name}`).first();
      const nameVisible = await nameElement.isVisible().catch(() => false);

      console.log(`[DATA] User email visible: ${emailVisible}`);
      console.log(`[DATA] User name visible: ${nameVisible}`);

      // At least name should be visible in profile
      expect(nameVisible).toBe(true);
    });

    test('should have consistent navigation', async () => {
      // Test that navigation elements are present on all major pages
      const pagesToTest = [
        { url: '/dashboard', name: 'Dashboard' },
        { url: '/birth-chart', name: 'Birth Chart' },
        { url: '/transit', name: 'Transit' },
        { url: '/ai', name: 'AI Consultation' },
        { url: '/profile', name: 'Profile' },
      ];

      for (const { url, name } of pagesToTest) {
        await page.goto(`${BASE_URL}${url}`);
        await page.waitForLoadState('networkidle');

        // Check for common navigation elements
        const hasNav =
          (await page
            .locator('nav, [role="navigation"], .nav, .navbar, .menu, header')
            .count()) > 0;

        // Check for user avatar/profile picture in nav
        const hasUserAvatar =
          (await page
            .locator(
              'img[alt*="avatar" i], img[alt*="user" i], [class*="avatar" i], [class*="user" i]',
            )
            .count()) > 0;

        console.log(
          `[NAV] ${name}: nav=${hasNav}, user avatar=${hasUserAvatar}`,
        );

        // At least one navigation indicator should be present
        expect(hasNav || hasUserAvatar).toBe(true);
      }
    });

    test('should handle session persistence', async () => {
      // Reload the page and check if we're still logged in
      await page.reload();
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      // Should still be on a protected route, not redirected to login
      const isStillLoggedIn =
        !currentUrl.includes('/login') && !currentUrl.includes('/signup');

      expect(isStillLoggedIn).toBe(true);
      console.log(`[SESSION] Still logged in after reload: ${isStillLoggedIn}`);
    });
  });

  test.describe('Security & Validation Tests', () => {
    test('should prevent access to protected routes when logged out', async () => {
      // Create a new context without cookies to simulate logged out state
      const loggedOutContext = await page.context().browser().newContext();
      const loggedOutPage = await loggedOutContext.newPage();

      try {
        await loggedOutPage.goto(`${BASE_URL}/dashboard`);
        await loggedOutPage.waitForLoadState('networkidle');

        // Should redirect to login page
        const currentUrl = loggedOutPage.url();
        const isRedirected =
          currentUrl.includes('/login') || currentUrl.includes('/signup');

        expect(isRedirected).toBe(true);
        console.log(
          '[SECURITY] Correctly redirects to login when not authenticated',
        );
      } finally {
        await loggedOutContext.close();
      }
    });

    test('should show appropriate error for invalid login', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');

      // Fill with invalid credentials
      await page.fill('input[placeholder="Email address"]', 'invalid@test.com');
      await page.fill('input[placeholder="Password"]', 'wrongpassword');

      await page.click('button:has-text("Login to Dashboard")');
      await page.waitForTimeout(3000);

      // Check for error message
      const errorMsg = page
        .locator('text=Invalid, text=incorrect, text=failed, text=error')
        .first();
      const hasError = await errorMsg.isVisible().catch(() => false);

      // Alternative: check if we're still on login page (not redirected)
      const stillOnLogin = page.url().includes('/login');

      console.log(
        `[SECURITY] Invalid login shows error: ${hasError} or stays on login: ${stillOnLogin}`,
      );
      expect(hasError || stillOnLogin).toBe(true);
    });
  });
});
