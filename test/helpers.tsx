import { act, waitFor } from '@testing-library/react';
import * as nuqs from 'nuqs';
import { SWRConfig, type SWRResponse } from 'swr';
import type { Mock } from 'vitest';

import type { PermissionsResult } from '@/hooks/use-permissions';
import type { SessionContextValue, SessionUser } from '@/providers/session';

/**
 * @description Common mock for the toaster component used across tests
 * @example
 * ```ts
 * beforeEach(() => {
 *   mockToaster.create.mockClear();
 * });
 * ```
 */
export const mockToaster = {
  create: vi.fn(() => 'toast-id'),
  update: vi.fn(),
  remove: vi.fn(),
  dismiss: vi.fn(),
  promise: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  loading: vi.fn(),
};

/**
 * @description Factory to create toaster mock for vi.mock
 * @example
 * ```ts
 * vi.mock('@/components/ui/toaster', createToasterMock);
 * ```
 */
export const createToasterMock = () => ({
  toaster: mockToaster,
});

/**
 * @description Wrapper component that provides a fresh SWR cache for isolated tests
 * @example
 * ```tsx
 * const { user } = renderWithUI(
 *   withFreshSWR(<MyComponent />)
 * );
 * ```
 */
export const withFreshSWR = (ui: React.ReactElement) => (
  <SWRConfig value={{ provider: () => new Map() }}>{ui}</SWRConfig>
);

/**
 * @description Mock nuqs useQueryStates hook with given values and setter
 * @example
 * ```ts
 * const setParams = mockUseQueryStates({ page: 1, q: 'test' });
 * // In your test, you can verify setParams was called
 * ```
 */
export const mockUseQueryStates = (
  values: Record<string, unknown> = {},
  setter: Mock = vi.fn(),
) => {
  vi.mocked(nuqs.useQueryStates).mockReturnValue([values, setter]);
  return setter;
};

/**
 * @description Standard test lifecycle setup that clears all mocks before each test
 * and cleans up act warnings after each test
 * @example
 * ```ts
 * describe('MyComponent', () => {
 *   setupTestLifecycle();
 *   // your tests...
 * });
 * ```
 */
export const setupTestLifecycle = () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // An async act() scope drains the microtask queue and any effects those
    // promises schedule. A sync act(() => {}) only flushes work React has
    // already queued, so pending async state updates would still land after
    // the test finished — exactly the act warnings this is meant to avoid.
    await act(async () => {});
  });
};

/**
 * @description Create a mock for usePermissions hook. Everything defaults to
 * "no access" so a test only has to spell out the permissions it cares about.
 * @example
 * ```ts
 * mockUsePermissions.mockReturnValue(createPermissionsMock({ isAdmin: true }));
 * ```
 */
export const createPermissionsMock = (
  permissions: Partial<PermissionsResult> = {},
): PermissionsResult => ({
  isLoading: false,
  isAdmin: false,
  isPlayer: false,
  isCoach: false,
  isGuest: false,
  isCaptain: false,
  can: () => false,
  canAll: () => false,
  canAny: () => false,
  ...permissions,
});

/**
 * @description Create a mock session context. `isAuthenticated` follows the
 * user unless a test overrides it, matching what the real provider computes.
 * @example
 * ```ts
 * vi.mocked(useSessionContext).mockReturnValue(
 *   createSessionMock({ user: MOCK_SESSION_USER }),
 * );
 * ```
 */
export const createSessionMock = (
  session: Partial<SessionContextValue> = {},
): SessionContextValue => {
  const user: Nullable<SessionUser> = session.user ?? null;

  return {
    isLoading: false,
    isAuthenticated: !!user,
    ...session,
    // Last, so an explicit `user: undefined` still normalises to `null`.
    user,
  };
};

/**
 * @description Narrow the `fetchOptions` argument a better-auth client method
 * was called with down to the lifecycle callbacks a spec needs to fire.
 *
 * better-auth types that argument as `ClientFetchOption | undefined` and hands
 * its callbacks rich context objects (`SuccessContext`, `ErrorContext`, ...)
 * that our pages never read. Reconstructing those in every spec would assert
 * nothing, so the cast lives here once instead of at each call site.
 * @example
 * ```ts
 * mockSignIn.mockImplementation((_data, options) => {
 *   const { onError, onResponse } = authCallbacks(options);
 *   onError?.({ error: { message: 'Invalid credentials' } });
 *   onResponse?.();
 * });
 * ```
 */
export type AuthCallbacks = {
  onRequest?: () => void;
  onResponse?: () => void;
  onSuccess?: () => void;
  onError?: (context: {
    error: { message?: string; statusText?: string };
  }) => void;
};

export const authCallbacks = (options: unknown): AuthCallbacks =>
  (options ?? {}) as AuthCallbacks;

/**
 * @description Create a mock SWR response. Only `data` and the loading flags
 * matter to our components; the rest of `SWRResponse` is filled with inert
 * values so the mock satisfies the hook's return type.
 * @example
 * ```ts
 * vi.mocked(useUserAvatar).mockReturnValue(createSWRMock({ data: null }));
 * ```
 */
export const createSWRMock = <T,>(
  response: Partial<SWRResponse<T, any, any>> = {},
): SWRResponse<T, any, any> =>
  ({
    data: undefined,
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: vi.fn(),
    ...response,
  }) as SWRResponse<T, any, any>;

/**
 * @description Flush pending promises and the effects they schedule inside an
 * act() scope. Useful for components that perform async initialization.
 * Prefer `waitFor` with a real assertion when there is a condition to wait on.
 * @example
 * ```ts
 * test('should render', async () => {
 *   const { container } = setup();
 *   await waitForStable();
 *   expect(container).toBeInTheDocument();
 * });
 * ```
 */
export const waitForStable = () => act(async () => {});

export { act, waitFor };
