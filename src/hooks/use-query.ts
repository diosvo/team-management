'use client';

import { DependencyList, useCallback, useEffect, useState } from 'react';

enum Status {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

type AsyncState<T> =
  | { status: Status.IDLE }
  | { status: Status.LOADING }
  | { status: Status.SUCCESS; data: T }
  | { status: Status.ERROR; error: Error };

type UseQueryOptions = {
  enabled: boolean;
};

export type UseQueryReturn<T> = {
  loading: boolean;
  error: Nullable<Error>;
  data: Nullable<T>;
};

/**
 * @description For fetching data only, NOT for mutations.
 */
export default function useQuery<T>(
  fn: () => Promise<T>,
  deps: DependencyList = [],
  options: Partial<UseQueryOptions> = {},
): UseQueryReturn<T> {
  const { enabled = true } = options;
  const [state, setState] = useState<AsyncState<T>>({ status: Status.IDLE });

  const memoizedFn = useCallback(fn, deps);

  useEffect(() => {
    // Don't run if disabled
    if (!enabled) {
      setState({ status: Status.IDLE });
      return;
    }

    let ignore = false;
    setState({ status: Status.LOADING });

    fn()
      .then((data) => {
        if (ignore) return;
        setState({ status: Status.SUCCESS, data });
      })
      .catch((error) => {
        if (ignore) return;
        setState({ status: Status.ERROR, error });
      });

    // Cancel calling actions when unmounted or deps change
    return () => {
      ignore = true;
    };
  }, [enabled, memoizedFn]);

  return {
    loading: state.status === Status.LOADING,
    error: state.status === Status.ERROR ? state.error : null,
    data: state.status === Status.SUCCESS ? state.data : null,
  };
}
