import { vi } from 'vitest';

vi.mock('nuqs', async () => {
  const actual = await import('nuqs');
  return {
    ...actual,
    useQueryStates: vi.fn(),
  };
});
