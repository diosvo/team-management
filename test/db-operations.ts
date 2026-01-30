import { vi } from 'vitest';

import db from '@/drizzle';

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
