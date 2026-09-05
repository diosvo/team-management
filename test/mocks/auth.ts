import type { User } from '@/drizzle/schema';
import { MOCK_USER } from './user';

let currentUser: User = MOCK_USER;

/**
 * Overrides the user injected into the mocked auth wrappers, so tests can
 * exercise role/ownership checks (e.g. admin vs self-edit). Call
 * `resetMockAuthUser` in `afterEach` when used.
 */
export const setMockAuthUser = (user: User) => {
  currentUser = user;
};

export const resetMockAuthUser = () => {
  currentUser = MOCK_USER;
};

export const createMockWithAuth = () => {
  return vi.fn(
    <T extends Array<unknown>, R>(
      serverAction: (user: User, ...args: T) => Promise<R>,
    ) => {
      return async (...args: T): Promise<R> => {
        return serverAction(currentUser, ...args);
      };
    },
  );
};

export const mockWithAuth = createMockWithAuth();

export const mockWithResourceAction = vi.fn(
  <T extends Array<unknown>, R>(
    _actions: Array<string>,
    serverAction: (user: User, ...args: T) => Promise<R>,
  ) =>
    async (...args: T): Promise<R> =>
      serverAction(currentUser, ...args),
);

export const mockWithResource = vi.fn(() => mockWithResourceAction);
