import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';

import { toaster } from '@/components/ui/toaster';

import { paginateData } from '@/utils/filters';
import { pluralize } from '@/utils/formatter';
import type { Response } from '@/utils/response';

import usePermissions from './use-permissions';

type Options = {
  pageSize: number;
  headerCount: number;
};

/** Server action that deletes a single row by id. */
type Remover = (id: string) => Promise<Response>;

/**
 * State updater that adds or removes `id` from a selection without
 * duplicating it.
 */
export const toggleSelection =
  (id: string, checked: boolean) =>
  (prev: Array<string>): Array<string> => {
    if (!checked) return prev.filter((x) => x !== id);
    return prev.includes(id) ? prev : [...prev, id];
  };

export default function useTableState<T>(
  data: Array<T>,
  predicate: (item: T) => boolean,
  page: number,
  { pageSize, headerCount }: Partial<Options> = {},
) {
  const { isAdmin } = usePermissions();
  const [selection, setSelection] = useState<Array<string>>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSelection([]);
  }, [predicate]);

  const pagination = useMemo(() => {
    const items = data.filter(predicate);
    return {
      items,
      currentData: paginateData(items, page, pageSize),
      totalCount: items.length,
    };
  }, [data, predicate, page, pageSize]);

  const toggle = useCallback(
    (id: string, checked: boolean) =>
      setSelection(toggleSelection(id, checked)),
    [],
  );

  /**
   * Deletes every selected row through `remove`, reporting progress and the
   * outcome in one toast. The selection is cleared once anything was deleted;
   * on total failure it is kept so the user can retry.
   *
   * @param noun singular label for the toast, e.g. `'asset'`.
   * @param onDeleted runs after at least one row was deleted.
   */
  const removeSelected = (
    remove: Remover,
    noun: string,
    onDeleted?: (count: number) => void,
  ) => {
    const ids = selection;
    const toastId = toaster.create({
      type: 'loading',
      title: `Deleting ${pluralize(ids.length, noun)}...`,
    });

    startTransition(async () => {
      const results = await Promise.all(ids.map((id) => remove(id)));
      const failures = results.filter(({ success }) => !success);
      const deleted = ids.length - failures.length;
      const reasons = [...new Set(failures.map(({ message }) => message))]
        .filter(Boolean)
        .join('\n');

      toaster.update(toastId, {
        type: failures.length > 0 ? 'warning' : 'success',
        title:
          failures.length > 0
            ? `Deleted ${deleted} of ${pluralize(ids.length, noun)}; ${failures.length} failed.`
            : `Successfully deleted ${pluralize(deleted, noun)}.`,
        description: reasons || undefined,
      });

      if (deleted > 0) {
        setSelection([]);
        onDeleted?.(deleted);
      }
    });
  };

  const selectionCount = selection.length;
  const hasSelection = selectionCount > 0;
  const indeterminate = hasSelection && selectionCount < pagination.totalCount;
  const columnCount =
    headerCount !== undefined ? headerCount + (isAdmin ? 1 : 0) : undefined;

  return {
    ...pagination,
    selection,
    setSelection,
    toggle,
    selectionCount,
    hasSelection,
    indeterminate,
    columnCount,
    isPending,
    removeSelected,
  };
}
