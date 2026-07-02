import { isEqual } from 'es-toolkit/predicate';
import { useRef, useState, type Dispatch, type SetStateAction } from 'react';

/**
 * Local state that mirrors an external source of truth (typically a URL param).
 *
 * Resyncs whenever `external` changes from *outside* the component - _a stat
 * card click, the back button, a reset, or a deep link_ - without clobbering it
 * on the way back.
 *
 * Uses React's "adjust state during render" pattern instead of
 * an effect, so the resync is applied before the browser paints.
 *
 * @see https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
 */
export default function useSyncedState<T>(
  external: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [local, setLocal] = useState<T>(external);
  const prev = useRef<T>(external);

  // Value comparison (not referential) so arrays/objects rebuilt on each URL
  // read don't trigger a false resync.
  if (!isEqual(prev.current, external)) {
    prev.current = external;
    setLocal(external);
  }

  return [local, setLocal];
}
