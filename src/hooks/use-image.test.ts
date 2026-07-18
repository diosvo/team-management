import { createElement, type PropsWithChildren } from 'react';

import { renderHook, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { Mock } from 'vitest';

import { getAvatar } from '@/actions/user';

import { useUserAvatar } from './use-image';

vi.mock('@/actions/user', () => ({
  getAvatar: vi.fn(),
}));

/**
 * Each render gets an isolated SWR cache so cached avatars never leak between
 * tests. `useSWRImmutable` is keyed on `['user-avatar', image]`, so a fresh
 * provider guarantees every test starts from a cold fetch.
 */
const wrapper = ({ children }: PropsWithChildren) =>
  createElement(SWRConfig, { value: { provider: () => new Map() }, children });

const renderAvatar = (image: Nullable<string>) =>
  renderHook(() => useUserAvatar(image), { wrapper });

describe('useUserAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('does not fetch when image is null', () => {
    const { result } = renderAvatar(null);

    expect(getAvatar).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBeFalsy();
  });

  test('fetches and returns the avatar for a given image path', async () => {
    (getAvatar as Mock).mockResolvedValue('https://blob/avatar.png');

    const { result } = renderAvatar('users/123/avatar.png');

    await waitFor(() =>
      expect(result.current.data).toBe('https://blob/avatar.png'),
    );
    expect(getAvatar).toHaveBeenCalledExactlyOnceWith('users/123/avatar.png');
  });

  test('surfaces errors from the action', async () => {
    const error = new Error('failed to load');
    (getAvatar as Mock).mockRejectedValue(error);

    const { result } = renderAvatar('users/123/avatar.png');

    await waitFor(() => expect(result.current.error).toBe(error));
    expect(result.current.data).toBeUndefined();
  });

  test('refetches when the image path changes', async () => {
    (getAvatar as Mock)
      .mockResolvedValueOnce('first.png')
      .mockResolvedValueOnce('second.png');

    const { result, rerender } = renderHook(
      ({ image }: { image: Nullable<string> }) => useUserAvatar(image),
      { wrapper, initialProps: { image: 'first-path.png' } },
    );

    await waitFor(() => expect(result.current.data).toBe('first.png'));

    rerender({ image: 'second-path.png' });

    await waitFor(() => expect(result.current.data).toBe('second.png'));
    expect(getAvatar).toHaveBeenCalledTimes(2);
  });
});
