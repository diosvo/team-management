import { vi } from 'vitest';

import { User } from '@/drizzle/schema';
import { MOCK_USER } from './user';

export const createMockWithAuth = () => {
  return vi.fn(
    <T extends Array<unknown>, R>(
      serverAction: (user: User, ...args: T) => Promise<R>,
    ) => {
      return async (...args: T): Promise<R> => {
        return serverAction(MOCK_USER, ...args);
      };
    },
  );
};

export const mockWithAuth = createMockWithAuth();
