vi.mock('nuqs', async () => {
  const actual = await import('nuqs');
  return {
    ...actual,
    useQueryStates: vi.fn(),
  };
});

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args) => args),
  desc: vi.fn((field) => ({ field, direction: 'desc' })),
  eq: vi.fn((field, value) => ({ field, value, type: 'eq' })),
  ne: vi.fn((field, value) => ({ field, value, type: 'ne' })),
}));
