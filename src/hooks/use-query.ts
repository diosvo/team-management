'use client';

import { DependencyList, useEffect, useState } from 'react';

type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

type UseQueryReturn<T> = {
  loading: boolean;
  error: Nullable<Error>;
  data: Nullable<T>;
};

export default function useQuery<T>(
  fn: () => Promise<T>,
  deps: DependencyList = []
): UseQueryReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });

  useEffect(() => {
    let ignore = false;
    setState({ status: 'loading' });

    fn()
      .then((data) => {
        if (ignore) {
          return;
        }
        setState({ status: 'success', data });
      })
      .catch((error) => {
        if (ignore) {
          return;
        }
        setState({ status: 'error', error });
      });

    // Cancel calling actions when unmounted or deps change
    return () => {
      ignore = true;
    };
  }, deps);

  return {
    loading: state.status === 'loading',
    error: state.status === 'error' ? state.error : null,
    data: state.status === 'success' ? state.data : null,
  };
}
