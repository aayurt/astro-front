import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Deep Dive Analysis', () => {
  test('full audit report - all pages and edge cases', async ({ browser }) => {
    const report = {
      routes: {},
      issues: [],
      apiCalls: {},
      a11y: {},
    };

    // ---- Public route analysis ----
    const publicRoutes = ['/', '/landing', '/login', '/signup'];

    for (const route of publicRoutes) {
      const context = await browser.newContext();
      const page = await context.newPage();

      const errors = [];
      const warnings = [];
      const failedReqs = [];
      const apiCalls = [];

      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
        if (msg.type() === 'warning') warnings.push(msg.text());
      });
      page.on('requestfailed', req => {
        failedReqs.push({ url: req.url(), error: req.failure()?.errorText });
      });
      page.on('request', req => {
        if (req.url().includes('localhost:3001')) {
          apiCalls.push({ url: req.url(), method: req.method() });
        }
      });

      await page.goto(BASE_URL + route, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);

      const finalUrl = page.url();
      const title = await page.title().catch(() => '');

      const domInfo = await page.evaluate(() => {
        return {
          title: document.title,
          headings: {
            h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim()),
            h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent?.trim()),
          },
          forms: document.querySelectorAll('form').length,
          buttons: [],
          inputs: Array.from(document.querySelectorAll('input')).map(i => ({
            type: i.type,
            name: i.name,
            placeholder: i.placeholder,
            required: i.required,
            ariaLabel: i.getAttribute('aria-label'),
            id: i.id,
          })),
          links: Array.from(document.querySelectorAll('a')).map(a => ({
            href: a.href,
            text: a.textContent?.trim(),
            title: a.title || '',
          })),
          hasReactRoot: !!document.getElementById('root'),
          metaViewport: document.querySelector('meta[name="viewport"]') ? 'yes' : 'no',
        };
      });

      // Get button details
      const btns = await page.locator('button').all();
      for (const btn of btns) {
        const btnName = await btn.textContent().catch(() => '').then(t => t?.trim());
        const btnType = await btn.getAttribute('type').catch(() => '');
        const btnAria = await btn.getAttribute('aria-label').catch(() => '');
        domInfo.buttons.push({ name: btnName, type: btnType, ariaLabel: btnAria });
      }

      report.routes[route] = {
        finalUrl,
        title,
        consoleErrors: errors,
        consoleWarnings: warnings,
        failedRequests: failedReqs,
        apiCalls,
        domInfo,
        screenshot: `test-screenshots/deep-${route.replace(/\//g, '-')}.png`,
      };

      await page.screenshot({
        path: `test-screenshots/deep-${route.replace(/\//g, '-')}.png`,
        fullPage: true,
      });

      if (errors.length > 0) {
        report.issues.push({ route, type: 'console-error', details: errors });
      }
      if (warnings.length > 0) {
        report.issues.push({ route, type: 'console-warning', details: warnings });
      }
      if (failedReqs.length > 0) {
        report.issues.push({ route, type: 'network-failure', details: failedReqs });
      }
      if (domInfo.forms === 0 && (route === '/login' || route === '/signup')) {
        report.issues.push({
          route,
          type: 'a11y',
          details: ['No <form> element found on auth page - reduced form semantics'],
        });
      }
      if (!domInfo.metaViewport) {
        report.issues.push({ route, type: 'a11y', details: ['No viewport meta tag'] });
      }

      await context.close();
    }

    // ---- Protected route analysis ----
    const protectedRoutes = ['/dashboard', '/ai', '/birth-chart', '/transit', '/profile', '/onboarding'];

    for (const route of protectedRoutes) {
      const context = await browser.newContext();
      const page = await context.newPage();

      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      await page.goto(BASE_URL + route, { waitUntil: 'networkidle', timeout: 15000 });
      const finalUrl = page.url();

      report.routes[route] = {
        finalUrl,
        redirect: finalUrl !== BASE_URL + route,
        consoleErrors: errors,
      };

      if (!finalUrl.includes('/login') && !finalUrl.includes('/landing')) {
        report.issues.push({
          route,
          type: 'security',
          details: [`Protected route accessible without auth! URL: ${finalUrl}`],
        });
      }

      await context.close();
    }

    // ---- Write full report as JSON ----
    console.log('\n========== FULL AUDIT REPORT ==========');
    console.log(JSON.stringify(report, null, 2));
    console.log('========== END REPORT ==========');

    // Check for specific known issues
    const knownIssues = [];

    // Login/Signup pages don't use <form> elements
    if (report.routes['/login']?.domInfo?.forms === 0) {
      knownIssues.push('ISSUE: /login has no <form> element - should submit via Enter key and has poor accessibility');
    }
    if (report.routes['/signup']?.domInfo?.forms === 0) {
      knownIssues.push('ISSUE: /signup has no <form> element - should submit via Enter key and has poor accessibility');
    }

    // Check if inputs have labels
    for (const route of ['/login', '/signup']) {
      const inputs = report.routes[route]?.domInfo?.inputs || [];
      const unlabeled = inputs.filter(i => !i.name && !i['aria-label'] && !i.id);
      if (unlabeled.length > 0) {
        knownIssues.push(`ISSUE: /${route} has inputs without name/id attributes:`, unlabeled.map(i => i.type + '/' + i.placeholder));
      }
    }

    protectedRoutes.forEach(route => {
      const r = report.routes[route];
      if (r && !r.redirect) {
        knownIssues.push(`CRITICAL: ${route} is accessible without authentication`);
      }
    });

    if (knownIssues.length > 0) {
      console.log('\n========== KNOWN ISSUES ==========');
      knownIssues.forEach(i => console.log(i));
      console.log('========== END ISSUES ==========');
    }
  });
});
