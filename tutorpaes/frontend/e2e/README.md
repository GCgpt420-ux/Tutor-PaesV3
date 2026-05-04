# E2E Tests with Playwright

End-to-end tests for TutorPAES using Playwright. Tests cover critical user journeys including authentication and quiz flows.

## Setup

### Prerequisites
- Node.js 18+ (or 20+)
- npm or yarn
- Backend running on http://localhost:8000 (optional, Playwright can auto-start)
- Frontend running on http://localhost:3000 (optional, Playwright can auto-start)

### Installation

```bash
# Install Playwright and dependencies
npm install --save-dev @playwright/test

# Download Playwright browsers
npx playwright install
```

### Configuration

Playwright config is in `playwright.config.ts`:
- Base URL: `http://localhost:3000`
- Test directory: `./e2e`
- Browsers: Chromium, Firefox, WebKit
- Screenshots/videos on failure
- HTML report generation

## Running Tests

### Run all tests
```bash
# Run all tests in all browsers
npm run test:e2e

# Or with npx
npx playwright test
```

### Run specific test file
```bash
# Run only auth tests
npx playwright test e2e/auth.spec.ts

# Run only quiz tests
npx playwright test e2e/quiz.spec.ts
```

### Run tests in specific browser
```bash
# Chromium only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# WebKit only
npx playwright test --project=webkit
```

### Run tests in UI mode (recommended for development)
```bash
# Opens interactive UI - great for debugging
npx playwright test --ui

# Or with watch mode
npx playwright test --ui --watch
```

### Run tests in debug mode
```bash
# Pausable step-by-step execution
npx playwright test --debug
```

### Run tests with headed mode (see browser)
```bash
# Run without headless flag - browser window visible
npx playwright test --headed
```

## Test Structure

### Auth Tests (`e2e/auth.spec.ts`)
- Login page loads and elements exist
- Email format validation
- Empty credentials rejection
- Navigation to signup and forgot password
- Authentication redirect
- Login state persistence
- Password field security (cleared on refresh)
- Password show/hide toggle
- Signup flow
- Password strength indicator
- Password reset flow

### Quiz Tests (`e2e/quiz.spec.ts`)
- Main page loads
- Quiz navigation
- Exam listing page
- Quiz question structure
- Answer selection
- Progress indicator
- Navigation buttons (Next/Previous/Submit)
- AI explanation feature
- Results page display
- Score display
- Answer review
- Quiz state persistence on reload
- Unsaved changes warning
- Network error handling
- Accessibility (labels, keyboard navigation)

## Viewing Results

### HTML Report
After running tests, view the interactive HTML report:
```bash
npx playwright show-report
```

### Console Output
Tests output results to console with:
- Test names
- Status (✓ passed, ✗ failed)
- Duration
- Failure reasons

### Artifacts on Failure
Failed tests generate:
- Screenshots (`.png` files)
- Videos (`.webm` files)
- Traces (for debugging)

Located in: `playwright-report/` and `test-results/`

## CI/CD Integration

Tests run automatically in GitHub Actions on:
- Pushes to `main` or `develop`
- Pull requests to `main` or `develop`
- Changes in `tutorpaes/frontend/**` or workflow file

### Workflow file
`.github/workflows/e2e.yml`

Features:
- Runs on Ubuntu Linux
- Tests in all 3 browsers
- Uploads HTML report as artifact
- Keeps report for 30 days
- Videos kept 7 days

View results:
1. Go to GitHub Actions tab
2. Click on E2E Tests workflow run
3. Download artifacts

## Writing New Tests

### Test Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/some-page');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    const button = page.locator('button:has-text("Click Me")');
    
    // Act
    await button.click();
    
    // Assert
    await expect(page).toHaveURL(/\/expected-url/);
  });
});
```

### Common Assertions
```typescript
// Navigation
await expect(page).toHaveURL(/\/dashboard/);

// Visibility
await expect(button).toBeVisible();
await expect(field).toBeHidden();

// Values
await expect(input).toHaveValue('expected value');

// Text
await expect(heading).toContainText('Welcome');

// Disabled state
await expect(button).toBeDisabled();
```

### Wait Strategies
```typescript
// Wait for navigation
await page.click('link');
await page.waitForURL('/new-page');

// Wait for element
await page.waitForSelector('text=Loading complete');

// Wait for network idle
await page.waitForLoadState('networkidle');

// Wait with timeout
await expect(element).toBeVisible({ timeout: 5000 });
```

## Best Practices

1. **Use data-testid for selectors**
   ```html
   <button data-testid="submit-btn">Submit</button>
   ```
   ```typescript
   const btn = page.locator('[data-testid="submit-btn"]');
   ```

2. **Test user journeys, not implementation**
   - Test what users see and do
   - Avoid testing internal state or CSS

3. **Use page objects for complex pages**
   ```typescript
   class LoginPage {
     constructor(page: Page) { this.page = page; }
     
     async goto() { await this.page.goto('/auth/login'); }
     async login(email, pwd) {
       await this.page.fill('input[type="email"]', email);
       await this.page.fill('input[type="password"]', pwd);
       await this.page.click('button:has-text("Sign In")');
     }
   }
   ```

4. **Be resilient to UI changes**
   - Use semantic selectors (role, aria-label)
   - Avoid brittle CSS selectors
   - Accept multiple valid implementations

5. **Test from user perspective**
   - What errors do users see?
   - Can users complete key tasks?
   - Is feedback clear and timely?

## Troubleshooting

### Tests pass locally but fail in CI
- CI might have different environment
- Check browser versions in CI
- Check backend is running
- Check environment variables

### Flaky tests (sometimes pass/fail)
- Add explicit waits instead of fixed timeouts
- Use `waitForLoadState('networkidle')`
- Make tests independent (don't share state)

### Timeout errors
- Increase timeout for slow operations
- Check if selector is correct
- Verify element is visible before interacting

### "Port already in use"
- Kill existing process on port 3000
- Or run on different port: `PORT=3001 npm run dev`

## Performance Tips

1. Run in parallel (default)
2. Use `--workers=4` to limit parallelization on weak hardware
3. Use UI mode during development (faster feedback)
4. Disable videos in dev: modify `playwright.config.ts`

## Resources

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Test Generator](https://playwright.dev/docs/codegen)
- [Debugging](https://playwright.dev/docs/debug)

## Next Steps

- [ ] Add login/authentication tests with actual credentials
- [ ] Add test data seeding (users, courses)
- [ ] Add payment flow tests
- [ ] Add mobile/tablet viewport tests
- [ ] Add visual regression tests
- [ ] Add performance benchmarks
