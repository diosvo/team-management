'use client';

import { DependencyList, useEffect, useState } from 'react';

type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

export type UseQueryOptions = {
  enabled: boolean;
};

export type UseQueryReturn<T> = {
  loading: boolean;
  error: Nullable<Error>;
  data: Nullable<T>;
};

export default function useQuery<T>(
  fn: () => Promise<T>,
  deps: DependencyList = [],
  options: Partial<UseQueryOptions> = {}
): UseQueryReturn<T> {
  const { enabled = true } = options;
  const [state, setState] = useState<AsyncState<T>>({ status: 'idle' });

  useEffect(() => {
    // Don't run if disabled
    if (!enabled) {
      setState({ status: 'idle' });
      return;
    }

    let ignore = false;
    setState({ status: 'loading' });

    fn()
      .then((data) => {
        if (ignore) return;
        setState({ status: 'success', data });
      })
      .catch((error) => {
        if (ignore) return;
        setState({ status: 'error', error });
      });

    // Cancel calling actions when unmounted or deps change
    return () => {
      ignore = true;
    };
  }, [...deps, enabled]);

  return {
    loading: state.status === 'loading',
    error: state.status === 'error' ? state.error : null,
    data: state.status === 'success' ? state.data : null,
  };
}
