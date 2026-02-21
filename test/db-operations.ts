import { vi } from 'vitest';

import db from '@/drizzle';

// Helper to create a thenable object that can be both awaited and have methods
function createThenableWithMethods(
  returnValue: unknown,
  methods: Record<string, unknown>,
) {
  return {
    ...methods,
    then: (
      onFulfilled?: ((value: unknown) => unknown) | null,
      onRejected?: ((error: unknown) => unknown) | null,
    ) => Promise.resolve(returnValue).then(onFulfilled, onRejected),
    catch: (onRejected: (error: unknown) => unknown) =>
      Promise.resolve(returnValue).catch(onRejected),
  };
}

// Helper to create a thenable object that rejects
function createThenableWithMethodsRejected(
  errorValue: unknown,
  methods: Record<string, unknown>,
) {
  return {
    ...methods,
    then: (
      onFulfilled?: ((value: unknown) => unknown) | null,
      onRejected?: ((error: unknown) => unknown) | null,
    ) => Promise.reject(errorValue).then(onFulfilled, onRejected),
    catch: (onRejected: (error: unknown) => unknown) =>
      Promise.reject(errorValue).catch(onRejected),
  };
}

export function mockSelectSuccess(returnValue: unknown) {
  const mockLimit = vi.fn().mockResolvedValue(returnValue);

  const mockOrderBy = vi
    .fn()
    .mockImplementation(() =>
      createThenableWithMethods(returnValue, { limit: mockLimit }),
    );

  const mockGroupBy = vi
    .fn()
    .mockImplementation(() =>
      createThenableWithMethods(returnValue, { orderBy: mockOrderBy }),
    );

  const mockWhereWithGroupBy = vi
    .fn()
    .mockImplementation(() =>
      createThenableWithMethods(returnValue, { groupBy: mockGroupBy }),
    );

  const mockLeftJoin = vi
    .fn()
    .mockImplementation(() =>
      createThenableWithMethods(returnValue, { where: mockWhereWithGroupBy }),
    );

  const mockWhere = vi.fn().mockImplementation(() =>
    createThenableWithMethods(returnValue, {
      groupBy: mockGroupBy,
      leftJoin: mockLeftJoin,
    }),
  );

  const mockFrom = vi.fn().mockImplementation(() =>
    createThenableWithMethods(returnValue, {
      where: mockWhere,
      leftJoin: mockLeftJoin,
    }),
  );

  vi.mocked(db.select).mockReturnValue({
    from: mockFrom,
  } as unknown as ReturnType<typeof db.select>);

  return {
    mockFrom,
    mockWhere,
    mockWhereWithGroupBy,
    mockGroupBy,
    mockOrderBy,
    mockLimit,
    mockLeftJoin,
  };
}

export function mockSelectFailure(errorMessage: string | Error) {
  const mockLimit = vi.fn().mockRejectedValue(errorMessage);

  const mockOrderBy = vi
    .fn()
    .mockImplementation(() =>
      createThenableWithMethodsRejected(errorMessage, { limit: mockLimit }),
    );

  const mockGroupBy = vi
    .fn()
    .mockImplementation(() =>
      createThenableWithMethodsRejected(errorMessage, { orderBy: mockOrderBy }),
    );

  const mockWhereWithGroupBy = vi
    .fn()
    .mockImplementation(() =>
      createThenableWithMethodsRejected(errorMessage, { groupBy: mockGroupBy }),
    );

  const mockLeftJoin = vi.fn().mockImplementation(() =>
    createThenableWithMethodsRejected(errorMessage, {
      where: mockWhereWithGroupBy,
    }),
  );

  const mockWhere = vi.fn().mockImplementation(() =>
    createThenableWithMethodsRejected(errorMessage, {
      groupBy: mockGroupBy,
      leftJoin: mockLeftJoin,
    }),
  );

  const mockFrom = vi.fn().mockImplementation(() =>
    createThenableWithMethodsRejected(errorMessage, {
      where: mockWhere,
      leftJoin: mockLeftJoin,
    }),
  );

  vi.mocked(db.select).mockReturnValue({
    from: mockFrom,
  } as unknown as ReturnType<typeof db.select>);

  return {
    mockFrom,
    mockWhere,
    mockGroupBy,
    mockOrderBy,
    mockLimit,
    mockLeftJoin,
  };
}

export function mockInsertSuccess(returnValue: unknown) {
  const mockValues = vi.fn().mockResolvedValue(returnValue);
  vi.mocked(db.insert).mockReturnValue({
    values: mockValues,
  } as unknown as ReturnType<typeof db.insert>);

  return mockValues;
}

export function mockInsertFailure(errorMessage: string) {
  const error = new Error(errorMessage);
  const mockValues = vi.fn().mockRejectedValue(error);
  vi.mocked(db.insert).mockReturnValue({
    values: mockValues,
  } as unknown as ReturnType<typeof db.insert>);

  return mockValues;
}

export function mockUpdateSuccess(returnValue: unknown) {
  const mockWhere = vi.fn().mockResolvedValue(returnValue);
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });

  vi.mocked(db.update).mockReturnValue({
    set: mockSet,
  } as unknown as ReturnType<typeof db.update>);

  return { mockWhere, mockSet };
}

export function mockUpdateFailure(errorMessage: string) {
  const error = new Error(errorMessage);
  const mockWhere = vi.fn().mockRejectedValue(error);
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });

  vi.mocked(db.update).mockReturnValue({
    set: mockSet,
  } as unknown as ReturnType<typeof db.update>);

  return { mockWhere, mockSet };
}

export function mockDeleteSuccess(returnValue: unknown) {
  const mockWhere = vi.fn().mockResolvedValue(returnValue);
  vi.mocked(db.delete).mockReturnValue({
    where: mockWhere,
  } as unknown as ReturnType<typeof db.delete>);

  return mockWhere;
}

export function mockDeleteFailure(errorMessage: string) {
  const error = new Error(errorMessage);
  const mockWhere = vi.fn().mockRejectedValue(error);
  vi.mocked(db.delete).mockReturnValue({
    where: mockWhere,
  } as unknown as ReturnType<typeof db.delete>);

  return mockWhere;
}
