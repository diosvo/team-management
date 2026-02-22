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
  count: vi.fn(() => ({ fn: 'count' })),
  desc: vi.fn((field) => ({ field, direction: 'desc' })),
  eq: vi.fn((field, value) => ({ field, value, type: 'eq' })),
  inArray: vi.fn((field, values) => ({ field, values, type: 'in' })),
  gte: vi.fn((field, value) => ({ field, value, type: 'gte' })),
  lte: vi.fn((field, value) => ({ field, value, type: 'lte' })),
  ne: vi.fn((field, value) => ({ field, value, type: 'ne' })),
  relations: vi.fn((...args) => args),
  sql: vi.fn((strings, ...values) => {
    let result = '';
    strings.forEach((str: string, i: number) => {
      result += str + (values[i] !== undefined ? values[i] : '');
    });
    return {
      queryChunks: [result],
      mapWith: vi.fn(function (this: any, mapper: any) {
        return { ...this, mapper };
      }),
    };
  }),
}));
