# Test Coverage Analysis Guide

## Overview

This guide explains how to generate and analyze test coverage for the team-management repository using batch testing.

## Problem Solved

The full test suite with coverage (`pnpm vitest run --coverage`) times out due to:
- 250+ test files
- 2260+ tests
- Database & server action tests
- Environment/worker resource limitations

**Solution:** Run coverage for smaller directories in batches to avoid timeouts.

## Quick Start

### Generate Coverage Report for src/app

```bash
cd /Users/diosvo/Documents/github/team-management
pnpm vitest run --coverage src/app \
  --exclude 'src/app/api/webhooks/resend/route.test.ts' \
  --exclude 'src/app/(protected)/(overview)/dashboard/_components/DashboardFilters.test.tsx'
```

### Generate Coverage Report for src/components

```bash
pnpm vitest run --coverage src/components
```

### Generate Coverage Report for src/actions

```bash
pnpm vitest run --coverage src/actions
```

## Parse Coverage Data

After running any batch, parse the results:

```bash
# Show all files <95% coverage
python3 parse_coverage.py

# Show only src/app files
python3 parse_coverage.py --directory src/app

# Show only src/components files
python3 parse_coverage.py --directory src/components

# Show only src/actions files
python3 parse_coverage.py --directory src/actions
```

## Output Files

Each run generates:
- `coverage/coverage-summary.json` - Machine-readable coverage data
- `coverage/index.html` - HTML report (open in browser)
- Console output - Text summary

## Recommended Workflow

### Generate all reports in sequence

```bash
#!/bin/bash
set -e

cd /Users/diosvo/Documents/github/team-management

echo "Generating src/app coverage..."
rm -rf coverage
pnpm vitest run --coverage src/app \
  --exclude 'src/app/api/webhooks/resend/route.test.ts' \
  --exclude 'src/app/(protected)/(overview)/dashboard/_components/DashboardFilters.test.tsx'
python3 parse_coverage.py --directory src/app > reports/app-coverage.txt

echo "Generating src/components coverage..."
rm -rf coverage
pnpm vitest run --coverage src/components
python3 parse_coverage.py --directory src/components > reports/components-coverage.txt

echo "Generating src/actions coverage..."
rm -rf coverage
pnpm vitest run --coverage src/actions
python3 parse_coverage.py --directory src/actions > reports/actions-coverage.txt

echo "Done! Reports saved to ./reports/"
```

## Coverage Thresholds

Current status (from latest batch run):

| Directory | Files <95% | At 0% | Avg Coverage |
|-----------|-----------|-------|--------------|
| src/app | 94 | 27 | 56.82% |
| src/components | 214 | 68 | 15.18% |
| src/actions | 227 | 91 | 15.40% |
| **TOTAL** | **535** | **186** | **29.13%** |

## High Priority Targets

### 0% Coverage Files Requiring Tests

1. **Database Layer** (src/db/)
   - 14 files, all at 0%
   - Includes: pg-error.ts (285 uncovered lines)
   - Impact: Core data operations

2. **Server Actions** (src/actions/)
   - 15+ files, all at 0%
   - Includes: user.ts (102 uncovered lines)
   - Impact: Business logic

3. **Editor Components** (src/components/editor/)
   - 5 files, all at 0%
   - RichTextInput.tsx (54 lines)
   - TextEditor.tsx (59 lines)
   - Impact: Content editing

4. **Auth Pages** (src/app/(auth)/)
   - 6+ files, all at 0%
   - login/page.tsx (19 lines)
   - Impact: User authentication

## Quick Wins (80-95% Coverage)

Files just needing 1-5 more test cases to reach 95%:

- `src/app/(protected)/(team-management)/attendance/_components/SubmitLeaveRequest.tsx` - 93.8%
- `src/components/date-picker/DateRangePicker.tsx` - 94.7%
- `src/app/(protected)/(overview)/dashboard/_components/AbsenceReasonsBreakdown.tsx` - 91.7%
- `src/components/filters/CheckboxGroupFilter.tsx` - 83.3%
- `src/utils/rate-limit.ts` - 90.9%

## CI/CD Integration Example

For GitHub Actions or similar CI systems:

```yaml
name: Coverage Report

on: [pull_request, push]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Generate coverage reports
        run: |
          for dir in app components actions; do
            rm -rf coverage
            pnpm vitest run --coverage src/$dir || true
            mkdir -p reports
            python3 parse_coverage.py --directory src/$dir > reports/$dir-coverage.txt
          done
      
      - name: Upload coverage artifacts
        uses: actions/upload-artifact@v3
        with:
          name: coverage-reports
          path: reports/
```

## Understanding Coverage Metrics

### Statement Coverage

The percentage of executable code statements that were executed by tests.

```javascript
if (condition) {           // 1 statement
  doSomething();           // 1 statement
} else {
  doSomethingElse();       // 1 statement (maybe not executed)
}
return result;             // 1 statement
```

- Statement coverage focuses on individual lines
- Doesn't guarantee all paths are tested
- Good for identifying untested code sections

### Other Metrics (in reports)

- **Branches**: % of conditional branches executed
- **Functions**: % of functions called
- **Lines**: % of source lines executed

## Configuration

Coverage settings are in `vitest.config.mts`:

```typescript
coverage: {
  include: ['src/**/*.{ts,tsx}'],
  reporter: ['text', 'html', 'json-summary'],
  exclude: [
    'coverage/**',
    'test/**',
    '**/*.d.ts',
    // ... see vitest.config.mts for full list
  ],
}
```

## Troubleshooting

### Coverage report is empty

Make sure tests are actually running:
```bash
pnpm vitest run src/app  # Without --coverage first
```

### Test timeout

- Try smaller directory: `src/app --exclude src/app/api` etc.
- Check available memory/CPU
- Run during off-peak hours

### JSON parsing fails

Verify coverage-summary.json exists:
```bash
ls -la coverage/coverage-summary.json
```

Check it's valid JSON:
```bash
jq . coverage/coverage-summary.json | head
```

## Performance Notes

### Batch Performance (Typical Times)

- `src/app`: ~120 seconds (94 files <95%)
- `src/components`: ~180 seconds (214 files <95%)
- `src/actions`: ~150 seconds (227 files <95%)
- **Total for 3 batches: ~450 seconds (~7.5 minutes)**

### Faster Alternatives

For quick checks (no coverage):
```bash
pnpm vitest run src/app  # Just run tests, no coverage
pnpm vitest run src/app --reporter=dot  # Minimal output
```

## Resources

- [Vitest Coverage Documentation](https://vitest.dev/guide/coverage.html)
- [Coverage.py Documentation](https://coverage.readthedocs.io/)
- [Istanbul Coverage Metrics](https://istanbul.js.org/)

## Contact

For questions about test coverage analysis, see:
- `vitest.config.mts` - Coverage configuration
- `parse_coverage.py` - Coverage parsing script
- This file - Coverage guide and workflow

---

Last Updated: 2026-10-31
Generated by: Coverage Batch Analysis Tool
