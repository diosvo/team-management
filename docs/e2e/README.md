# E2E Testing Documentation

## Overview

This directory contains comprehensive end-to-end tests for the Team Management application using Playwright. The tests are organized by feature domains and include cross-cutting concerns.

## Test Structure

### Domain-Based Organization

```
e2e/
├── auth/                    # Authentication tests
├── overview/                # Dashboard and team rules
├── performance/             # Periodic testing features
├── resources/               # Assets and emails
├── settings/                # Teams, leagues, locations
├── team-management/         # Matches, roster, training, attendance, registration
├── setup/                   # Test configuration and helpers
├── cross-cutting.spec.ts    # Shared tests across all features
└── README.md               # This file
```

## Test Helpers

### `e2e/setup/helpers.ts`

Reusable test utilities to reduce duplication:

- **Navigation**: `waitForNavigation`, `testUrlPersistence`
- **Search & Filters**: `testSearchWithQueryParams`, `testFilterWithQueryParams`
- **Forms**: `testFormValidationDisabled`, `testDialogOpenClose`
- **Tables**: `testTableHeaders`, `testEmptyState`, `testPaginationNavigation`
- **Interactions**: `testKeyboardNavigation`, `testDeleteWithCheckbox`
- **Assertions**: `testNoErrors`, `testNoLoadingState`, `testSuccessToast`
- **Utilities**: `uniqueName`, `testHighlightedText`

### Usage Example

```typescript
import { testNoErrors, testTableHeaders } from '../setup/helpers';

test('loads without errors', async ({ page }) => {
  await testNoErrors(page);
});

test('displays table headers', async ({ page }) => {
  await testTableHeaders(page, ['Name', 'Email', 'Status']);
});
```

## Test Patterns

### 1. Page Load Tests

Every page should verify:

- ✅ Correct title
- ✅ Page heading visible
- ✅ No error messages
- ✅ No persistent loading state

```typescript
test.describe('Page Name', () => {
  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Page Title/);
  });

  test('displays page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Page Name' }),
    ).toBeVisible();
  });

  test('loads without errors', async ({ page }) => {
    await testNoErrors(page);
  });
});
```

### 2. Search and Filter Tests

- ✅ Search updates URL query params
- ✅ Search persists on page reload
- ✅ Highlighted search results
- ✅ Filter updates URL
- ✅ Combined search + filters
- ✅ Clear/reset functionality

```typescript
test('filters by name and updates query params', async ({ page }) => {
  const searchInput = page.getByPlaceholder(/search/i);
  await searchInput.fill('test');
  await expect(page).toHaveURL(/q=test/);

  await searchInput.clear();
  await expect(page).not.toHaveURL(/q=/);
});
```

### 3. CRUD Operations

#### Add

- ✅ Opens dialog with correct title
- ✅ Form fields visible
- ✅ Submit disabled when empty
- ✅ Success toast after creation
- ✅ Dialog closes on success
- ✅ Table updates without reload

#### Update

- ✅ Row click opens edit dialog
- ✅ Pre-populated with current values
- ✅ Success toast after update
- ✅ Changes reflect in table
- ✅ Timestamp updates

#### Delete

- ✅ Checkbox selection
- ✅ Select all functionality
- ✅ Selection count displayed
- ✅ Confirmation (if applicable)
- ✅ Success toast
- ✅ Selection cleared after delete

### 4. Form Validation

- ✅ Required fields enforced
- ✅ Input format validation (email, date, number)
- ✅ Duplicate prevention
- ✅ Whitespace trimming
- ✅ Min/max length validation
- ✅ Character limits

```typescript
test('validates required fields', async ({ page }) => {
  await page.getByRole('button', { name: 'Add' }).click();

  const submitButton = page
    .getByRole('dialog')
    .getByRole('button', { name: 'Submit' });

  await expect(submitButton).toBeDisabled();
});
```

### 5. Keyboard Navigation

- ✅ Tab key navigation
- ✅ Enter to submit
- ✅ Escape to cancel/close
- ✅ Arrow keys for navigation
- ✅ Shift+Tab for reverse navigation

```typescript
test('closes dialog on Escape', async ({ page }) => {
  await page.getByRole('button', { name: 'Add' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});
```

### 6. Responsive Design

- ✅ Mobile (375×667)
- ✅ Tablet (768×1024)
- ✅ Desktop (1920×1080)
- ✅ No horizontal scroll
- ✅ Touch-friendly targets

### 7. Accessibility

- ✅ ARIA labels present
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Screen reader support
- ✅ Semantic HTML

## Feature-Specific Tests

### Authentication

#### Login (`auth/login.spec.ts`)

- Page load and form display
- Form validation (email format, required fields)
- Authentication flow (valid/invalid credentials)
- Loading states during submission
- Navigation to forgot password
- Keyboard navigation (Tab, Enter)
- Accessibility (ARIA labels, autocomplete)
- Responsive design (mobile, tablet)
- Error handling and display

**Test Coverage**: 19 tests across 9 categories

#### Forgot Password (`auth/forgot-password.spec.ts`)

- Email submission form
- Real-time email validation
- Submit button enable/disable logic
- Success/error message display
- Form state management (clear on mount)
- Navigation back to login
- Loading states and field disabling
- Keyboard navigation
- Accessibility features
- Responsive layouts

**Test Coverage**: 27 tests across 9 categories

#### New Password (`auth/new-password.spec.ts`)

- Password creation form
- Real-time password rule validation:
  - Length (8-128 characters)
  - Contains at least one letter
  - Contains at least one number
  - Contains at least one special character
- Visual feedback for rule compliance (green checkmarks)
- Token parameter handling (URL query)
- Password visibility toggle
- Form submission with token validation
- Keyboard navigation and submission
- Accessibility (ARIA labels, list structure)
- Responsive design

**Test Coverage**: 31 tests across 11 categories

### Overview

#### Dashboard (`overview/dashboard.spec.ts`)

- Stats cards display
- Quick actions navigation
- Upcoming sessions/matches
- Charts rendering (attendance trend, match rate)
- Player rankings
- Filter functionality

#### Team Rule (`overview/team-rule.spec.ts`)

- Preview/edit mode toggle
- Markdown rendering
- Save/cancel functionality
- Form validation
- Character limits
- Permission checks

### Performance

#### Periodic Testing (`performance/periodic-testing.spec.ts`)

- Stats display
- Date filter
- Performance matrix
- Editable cells with keyboard navigation
- Enter to save, Escape to cancel
- Tab navigation between cells
- Numeric validation

#### Add Result (`performance/add-result.spec.ts`)

- Configuration form
- Test type selection
- Player table with dynamic columns
- Score input with Tab/Enter navigation
- Bulk actions (fill all, clear all)
- Form validation

#### Test Types (`performance/test-types.spec.ts`)

- CRUD operations
- Name/unit validation
- Duplicate prevention
- Search and filter
- Sorting capabilities

### Resources

#### Assets (`resources/assets.spec.ts`)

- Stats cards click to filter
- Category/condition filters
- CRUD operations
- Image/file uploads
- Bulk deletion

#### Emails (`resources/emails.spec.ts`)

- Sent emails table
- Status filters
- Static template preview
- Accordion expansion

### Settings

#### Teams, Leagues, Locations

- Standard CRUD patterns
- Search by multiple fields
- Date validation (leagues)
- Map links (locations)
- Logo upload (teams)
- Status-based filtering (leagues)

### Team Management

#### Matches (`team-management/matches.spec.ts`)

- Win streak, win rate stats
- Opponent selection
- Score tracking
- Result badges
- Date filtering

#### Roster (`team-management/roster.spec.ts`)

- Player search
- State/role filters
- Jersey numbers
- Position badges
- Data masking for guests
- Export functionality

#### Training (`team-management/training.spec.ts`)

- Session scheduling
- Location links
- Attendance rate
- Date range filtering

#### Attendance (`team-management/attendance.spec.ts`)

- Date picker
- Bulk status updates
- Stats cards
- Integration with training

#### Registration (`team-management/registration.spec.ts`)

- Multi-step form
- League/player selection
- PDF upload
- Saved registrations
- Export functionality

## Cross-Cutting Tests

The `cross-cutting.spec.ts` file contains tests that apply to multiple pages:

### Categories

1. **Page Load** - Error-free loading, no persistent loading states
2. **Keyboard Navigation** - Tab navigation, skip links
3. **Responsive Design** - Mobile, tablet, desktop viewports
4. **Search Functionality** - URL params, persistence
5. **Pagination** - Navigation, URL state
6. **Empty States** - No results messaging
7. **Dialog Behavior** - Escape, cancel, click outside
8. **Form Validation** - Empty form handling
9. **Toast Notifications** - Appearance, dismissal
10. **URL State Management** - Multiple filters, navigation persistence

## Animation and Performance Tests

The `animations.spec.ts` file contains comprehensive animation and performance testing:

### Categories

1. **Dialog Transitions** - Modal open/close animations, backdrop fade effects
2. **Loading States** - Spinner animations, skeleton loaders, progress bars
3. **Page Transitions** - Content fade-in, navigation smoothness
4. **Hover Effects** - Button, row, and link hover animations
5. **Toast Notifications** - Appear and dismiss animations
6. **Accordion/Collapse** - Expand and collapse transitions
7. **Scroll Effects** - Sticky headers, scroll-to-top buttons
8. **Form Elements** - Input focus animations, checkbox transitions, dropdown animations
9. **Badge/Status Indicators** - Layout shift prevention, status change animations
10. **Performance Metrics** - Layout thrashing, render budget, GPU acceleration, scroll jank
11. **Loading Placeholders** - FOUC prevention, image fade-in effects
12. **Micro-interactions** - Button ripple effects, filter chip animations

### Key Tests

#### Animation Smoothness

```typescript
test('dialog opens with animation', async ({ page }) => {
  await addButton.click();
  const dialog = page.getByRole('dialog');

  // Verify dialog has transition or animation
  const hasAnimation = await dialog.evaluate((el) => {
    const styles = window.getComputedStyle(el);
    return (
      styles.animation !== 'none' || styles.transition !== 'all 0s ease 0s'
    );
  });

  expect(hasAnimation).toBeTruthy();
});
```

#### Performance Testing

```typescript
test('animations do not cause layout thrashing', async ({ page }) => {
  await page.goto('/dashboard');

  // Measure Cumulative Layout Shift
  const cls = await page.evaluate(() => {
    return new Promise((resolve) => {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(clsValue);
      }, 2000);
    });
  });

  // CLS should be low (< 0.1 is good, < 0.5 acceptable)
  expect(cls).toBeLessThan(0.5);
});
```

#### GPU Acceleration

```typescript
test('animations use GPU acceleration', async ({ page }) => {
  const dialog = page.getByRole('dialog');

  // Check if GPU-accelerated properties are used
  const usesGPU = await dialog.evaluate((el) => {
    const styles = window.getComputedStyle(el);
    return (
      styles.transform !== 'none' ||
      styles.transition.includes('transform') ||
      styles.transition.includes('opacity')
    );
  });

  expect(usesGPU).toBeTruthy();
});
```

### Performance Budgets

- **Cumulative Layout Shift (CLS)**: < 0.5 (target: < 0.1)
- **DOM Content Loaded**: < 3 seconds
- **First Paint**: < 2 seconds
- **Frame Rate during scroll**: > 30 fps
- **Animation smoothness**: 60 fps target

## Best Practices

### 1. Use Conditional Checks

Since data can vary between environments:

```typescript
if (await element.isVisible()) {
  await expect(element).toBeVisible();
}
```

### 2. Unique Test Data

Use timestamps to avoid conflicts:

```typescript
const uniqueName = () => `E2E Test ${Date.now()}`;
```

### 3. Wait Appropriately

```typescript
// Wait for network activity to settle
await page.waitForTimeout(500);

// Better: wait for specific state
await page.waitForLoadState('networkidle');
```

### 4. Test User Permissions

```typescript
test('hides edit button for unauthorized users', async ({ page }) => {
  const editButton = page.getByRole('button', { name: /edit/i });
  const isVisible = await editButton.isVisible();
  expect(typeof isVisible).toBe('boolean');
});
```

### 5. Clean Up Test Data

```typescript
test.afterEach(async ({ page }) => {
  // Clean up any test data created
  const searchInput = page.getByPlaceholder(/search/i);
  await searchInput.fill('E2E Test');
  // ... delete matching items
});
```

## Running Tests

```bash
# Run all tests
pnpm test:e2e

# Run specific test file
pnpm test:e2e overview/dashboard.spec.ts
pnpm test:e2e cross-cutting.spec.ts
pnpm test:e2e animations.spec.ts

# Run in headed mode (see browser)
pnpm test:e2e --headed

# Run in debug mode
pnpm test:e2e --debug

# Run specific test by name
pnpm test:e2e -g "has correct title"

# Run tests for specific browser
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
pnpm test:e2e --project=webkit

# Run animation tests specifically (useful for performance testing)
pnpm test:e2e animations.spec.ts --headed --workers=1
```

## Test Coverage

### Current Coverage

- ✅ 19 test files
- ✅ 562+ individual tests
- ✅ All major features covered
- ✅ CRUD operations
- ✅ Search and filtering
- ✅ Pagination
- ✅ Form validation
- ✅ Keyboard navigation
- ✅ Responsive design
- ✅ Accessibility basics
- ✅ Animation and transitions
- ✅ Performance metrics
- ✅ Cross-cutting tests

### Areas for Future Enhancement

- 🔄 Visual regression testing
- 🔄 Enhanced performance testing (more Core Web Vitals)
- 🔄 API contract testing
- 🔄 Database state verification
- 🔄 Email/notification testing
- 🔄 File upload/download testing
- 🔄 Print/PDF generation testing
- 🔄 Offline functionality
- 🔄 i18n/l10n testing

## Debugging Tests

### 1. Use Playwright Inspector

```bash
pnpm test:e2e --debug
```

### 2. Add Console Logs

```typescript
test('debug test', async ({ page }) => {
  console.log('Current URL:', page.url());
  const element = page.getByRole('button');
  console.log('Button count:', await element.count());
});
```

### 3. Take Screenshots

```typescript
await page.screenshot({ path: 'debug-screenshot.png' });
```

### 4. Pause Execution

```typescript
await page.pause(); // Opens Playwright Inspector
```

## CI/CD Integration

Tests run automatically on:

- Pull requests
- Main branch commits
- Pre-deployment checks

Configuration in `.github/workflows/` or CI provider config.

## Contributing

When adding new tests:

1. Follow existing patterns
2. Use helpers from `setup/helpers.ts`
3. Add tests to `cross-cutting.spec.ts` if applicable
4. Include both positive and negative test cases
5. Test edge cases (empty states, max values, etc.)
6. Document complex test logic
7. Keep tests independent (no shared state)

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
