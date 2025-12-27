import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';
import { afterEach } from 'vitest';

// ⭕️ Global mocks or setup here
expect.extend(toHaveNoViolations);

// ♻️ Run cleanup after each test
afterEach(() => {
  cleanup();
});
