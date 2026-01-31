vi.mock('nuqs', async () => {
  const actual = await import('nuqs');
  return {
    ...actual,
    useQueryStates: vi.fn(),
  };
});

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args) => args),
  asc: vi.fn((field) => ({ field, direction: 'asc' })),
  desc: vi.fn((field) => ({ field, direction: 'desc' })),
  eq: vi.fn((field, value) => ({ field, value, type: 'eq' })),
  gte: vi.fn((field, value) => ({ field, value, type: 'gte' })),
  lte: vi.fn((field, value) => ({ field, value, type: 'lte' })),
  ne: vi.fn((field, value) => ({ field, value, type: 'ne' })),
}));
