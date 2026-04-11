import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// ========================
// 1. LANDING PAGE & ROUTING
// ========================

test.describe('Landing Page & Routing', () => {
  test('root "/" should redirect to /landing via catch-all route', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(BASE_URL + '/');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    console.log(`[Test] Root URL -> ${url}`);
    expect(url).toContain('/landing');

    const heading = page.locator('h1');
    await expect(heading.first()).toBeVisible();
    const headingText = await heading.first().textContent();
    console.log(`[Test] Landing heading: "${headingText}"`);

    if (consoleErrors.length) {
      console.log(`[WARN] Console errors on landing: ${JSON.stringify(consoleErrors)}`);
    }
  });

  test('direct /landing route loads correctly', async ({ page }) => {
    await page.goto(BASE_URL + '/landing');
    await page.waitForLoadState('networkidle');

    const heading = page.locator('h1');
    await expect(heading.first()).toBeVisible();
    console.log(`[Test] /landing heading: "${await heading.first().textContent()}"`);

    // Check login and signup buttons exist
    const loginBtn = page.getByRole('button', { name: /login/i });
    const signupBtn = page.getByRole('button', { name: /sign\s?up/i });
    await expect(loginBtn.first()).toBeVisible({ timeout: 5000 });
    await expect(signupBtn.first()).toBeVisible({ timeout: 5000 });
    console.log('[Test] Landing page has Login and Sign Up buttons');
  });

  test('/login page renders', async ({ page }) => {
    await page.goto(BASE_URL + '/login');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    console.log(`[Test] /login URL -> ${url}`);

    // Check form elements exist
    const loginHeading = page.getByRole('heading', { name: /sign in|log in|login|welcome/i });
    const isVisible = await loginHeading.first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`[Test] /login heading visible: ${isVisible}`);

    // Check for email and password fields
    const emailInput = page.locator('input[name="email"], input[type="email"], input#email');
    const passwordInput = page.locator('input[name="password"], input[type="password"], input#password');
    const hasEmail = await emailInput.count() > 0;
    const hasPassword = await passwordInput.count() > 0;
    console.log(`[Test] /login form fields - email: ${hasEmail}, password: ${hasPassword}`);
  });

  test('/signup page renders', async ({ page }) => {
    await page.goto(BASE_URL + '/signup');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    console.log(`[Test] /signup URL -> ${url}`);

    // Check for heading
    const signupHeading = page.getByRole('heading', { name: /sign up|create account|register/i });
    const isVisible = await signupHeading.first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`[Test] /signup heading visible: ${isVisible}`);

    // Check form fields
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    const hasEmail = await emailInput.count() > 0;
    console.log(`[Test] /signup email field: ${hasEmail}`);
  });
});

// ========================
// 2. AUTH FLOW - FORM VALIDATION
// ========================

test.describe('Auth Flow UI Validation', () => {
  test('login form - empty submission shows validation', async ({ page }) => {
    await page.goto(BASE_URL + '/login');
    await page.waitForLoadState('networkidle');

    // Konsta Button with onClick - not a native form submit button
    const submitBtn = page.locator('button').first();
    const btnText = await submitBtn.textContent();
    console.log(`[Test] Login submit button text: "${btnText}"`);

    // Click submit with empty fields
    await submitBtn.click();
    await page.waitForTimeout(1000);

    // Check for the inline validation message
    const errorMsg = page.locator('text=Please enter both email and password.').first();
    const isVisible = await errorMsg.isVisible().catch(() => false);
    console.log(`[Test] Validation error visible after empty login: ${isVisible}`);
    expect(isVisible).toBe(true);
  });

  test('signup form - empty submission shows validation', async ({ page }) => {
    await page.goto(BASE_URL + '/signup');
    await page.waitForLoadState('networkidle');

    const submitBtn = page.locator('button').first();
    const btnText = await submitBtn.textContent();
    console.log(`[Test] Signup submit button text: "${btnText}"`);

    await submitBtn.click();
    await page.waitForTimeout(1000);

    const errorMsg = page.locator('text=Please fill in all celestial details.').first();
    const isVisible = await errorMsg.isVisible().catch(() => false);
    console.log(`[Test] Validation error visible after empty signup: ${isVisible}`);
    expect(isVisible).toBe(true);
  });

  test('login page has signup link and vice versa', async ({ page }) => {
    // Check login -> signup link
    await page.goto(BASE_URL + '/login');
    await page.waitForLoadState('networkidle');
    const signupLink = page.locator('a[href*="signup"]').first();
    const hasSignupLink = await signupLink.isVisible().catch(() => false);
    console.log(`[Test] Login page has signup link: ${hasSignupLink}`);

    // Check signup -> login link
    await page.goto(BASE_URL + '/signup');
    await page.waitForLoadState('networkidle');
    const loginLink = page.locator('a[href*="login"]').first();
    const hasLoginLink = await loginLink.isVisible().catch(() => false);
    console.log(`[Test] Signup page has login link: ${hasLoginLink}`);
  });
});

// ========================
// 3. CONSOLE ERRORS
// ========================

test.describe('Console Error Analysis', () => {
  test('capture all console errors across routes', async ({ page }) => {
    const errors = [];
    const warnings = [];

    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
      if (msg.type() === 'warning') warnings.push(msg.text());
    });

    const routes = ['/', '/landing', '/login', '/signup'];

    for (const route of routes) {
      errors.length = 0;
      warnings.length = 0;
      await page.goto(BASE_URL + route, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000); // wait for any lazy errors

      if (errors.length > 0) {
        console.log(`[ERROR] Console errors on ${route}:`);
        errors.forEach(e => console.log(`  - ${e}`));
      }
      if (warnings.length > 0) {
        console.log(`[WARN] Console warnings on ${route}:`);
        warnings.forEach(w => console.log(`  - ${w}`));
      }
      if (errors.length === 0 && warnings.length === 0) {
        console.log(`[OK] No console issues on ${route}`);
      }
    }
  });
});

// ========================
// 4. NETWORK ANALYSIS
// ========================

test.describe('Network Request Analysis', () => {
  test('check for failed network requests on public routes', async ({ page }) => {
    const failedReqs = [];
    const pendingReqs = [];

    page.on('requestfailed', req => {
      failedReqs.push({ url: req.url(), failure: req.failure()?.errorText });
    });

    const routes = ['/', '/login', '/signup'];

    for (const route of routes) {
      failedReqs.length = 0;
      await page.goto(BASE_URL + route, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);

      if (failedReqs.length > 0) {
        console.log(`[NETWORK FAIL] Failed requests on ${route}:`);
        failedReqs.forEach(r => console.log(`  - ${r.url} (${r.failure})`));
      } else {
        console.log(`[NETWORK OK] No failed requests on ${route}`);
      }
    }
  });

  test('check API calls to localhost:3001', async ({ page }) => {
    const apiCalls = [];

    page.on('request', req => {
      if (req.url().includes('localhost:3001') || req.url().includes('127.0.0.1:3001')) {
        apiCalls.push({ url: req.url(), method: req.method() });
      }
    });

    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    if (apiCalls.length > 0) {
      console.log('[API CALLS] Found requests to localhost:3001:');
      apiCalls.forEach(c => console.log(`  - ${c.method} ${c.url}`));
    } else {
      console.log('[API] No automatic requests to localhost:3001 on /login');
    }
  });
});

// ========================
// 5. ACCESSIBILITY BASICS
// ========================

test.describe('Accessibility Checks', () => {
  test('heading hierarchy and semantics', async ({ page }) => {
    await page.goto(BASE_URL + '/', { waitUntil: 'networkidle', timeout: 15000 });

    // Check headings exist and are in order
    const h1s = await page.locator('h1').allTextContents();
    const h2s = await page.locator('h2').allTextContents();
    console.log(`[A11Y] H1 headings: ${JSON.stringify(h1s)}`);
    console.log(`[A11Y] H2 headings: ${JSON.stringify(h2s)}`);
  });

  test('buttons have accessible names', async ({ page }) => {
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 15000 });

    const buttons = await page.locator('button').all();
    console.log(`[A11Y] Found ${buttons.length} buttons on /login`);

    for (const btn of buttons) {
      const name = await btn.textContent().catch(() => '(no text)');
      const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');
      console.log(`  Button: text="${name?.trim()}", aria-label="${ariaLabel}"`);
    }
  });

  test('forms have associated labels', async ({ page }) => {
    await page.goto(BASE_URL + '/signup', { waitUntil: 'networkidle', timeout: 15000 });

    const inputs = await page.locator('input').all();
    console.log(`[A11Y] Found ${inputs.length} inputs on /signup`);

    for (const input of inputs) {
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name') || '';
      const label = await input.locator('xpath=preceding::label[1] | xpath=ancestor::label').first().textContent().catch(() => '');
      const placeholder = await input.getAttribute('placeholder') || '';
      console.log(`  Input: type="${type}", name="${name}", placeholder="${placeholder}", label="${label}"`);
    }
  });
});

// ========================
// 6. RESPONSIVE / LAYOUT
// ========================

test.describe('Responsive Layout Tests', () => {
  test('mobile viewport (375x812) - all pages', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    const routes = ['/', '/login', '/signup'];

    for (const route of routes) {
      await page.goto(BASE_URL + route, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);

      // Check for horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      const hasOverflow = scrollWidth > clientWidth;
      console.log(`[RESPONSIVE mobile] ${route} - overflow: ${hasOverflow} (${scrollWidth}x${clientWidth})`);

      // Screenshot for visual verification
      await page.screenshot({ path: `test-screenshots/${route.replace(/\//g, '-')}-mobile.png`, fullPage: true });
      console.log(`[RESPONSIVE] Screenshot saved for ${route} mobile`);
    }

    await context.close();
  });

  test('desktop viewport (1440x900) - all pages', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const routes = ['/', '/login', '/signup'];

    for (const route of routes) {
      await page.goto(BASE_URL + route, { waitUntil: 'networkidle', timeout: 15000 });

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      const hasOverflow = scrollWidth > clientWidth;
      console.log(`[RESPONSIVE desktop] ${route} - overflow: ${hasOverflow} (${scrollWidth}x${clientWidth})`);

      await page.screenshot({ path: `test-screenshots/${route.replace(/\//g, '-')}-desktop.png`, fullPage: true });
      console.log(`[RESPONSIVE] Screenshot saved for ${route} desktop`);
    }

    await context.close();
  });
});

// ========================
// 7. PAGE STRUCTURE ANALYSIS
// ========================

test.describe('Page Structure Deep Dive', () => {
  test('login page DOM structure', async ({ page }) => {
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 15000 });

    const structure = await page.evaluate(() => {
      return {
        title: document.title,
        metaViews: document.querySelectorAll('meta[name="viewport"]').length,
        forms: document.querySelectorAll('form').length,
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length,
        links: document.querySelectorAll('a').length,
        images: document.querySelectorAll('img').length,
        scripts: document.querySelectorAll('script').length,
        hasAppRoot: !!document.getElementById('root'),
        reactData: document.querySelector('[data-reactroot]') ? 'yes' : 'no',
        bodyClasses: document.body.className,
      };
    });
    console.log(`[STRUCTURE /login] ${JSON.stringify(structure, null, 2)}`);
  });

  test('signup page DOM structure', async ({ page }) => {
    await page.goto(BASE_URL + '/signup', { waitUntil: 'networkidle', timeout: 15000 });

    const structure = await page.evaluate(() => {
      return {
        title: document.title,
        forms: document.querySelectorAll('form').length,
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length,
        links: document.querySelectorAll('a').length,
      };
    });
    console.log(`[STRUCTURE /signup] ${JSON.stringify(structure, null, 2)}`);
  });

  test('protected routes should redirect to /landing when not authenticated', async ({ page }) => {
    const protectedRoutes = ['/dashboard', '/ai', '/birth-chart', '/transit', '/profile', '/onboarding'];

    for (const route of protectedRoutes) {
      await page.goto(BASE_URL + route, { waitUntil: 'networkidle', timeout: 15000 });
      const url = page.url();
      const redirected = url.includes('/landing') || url.includes('/login');
      console.log(`[PROTECTED] ${route} -> redirected to ${url} (protected: ${redirected})`);

      if (!redirected) {
        console.log(`[WARN] Protected route ${route} is accessible without auth!`);
      }
    }
  });
});
