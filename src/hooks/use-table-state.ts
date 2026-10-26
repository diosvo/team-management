import { useEffect, useMemo, useState, useTransition } from 'react';

import { useTranslations } from 'next-intl';

import { toaster } from '@/components/ui/toaster';

import { paginateData } from '@/utils/filters';
import { pluralize } from '@/utils/formatter';
import type { Response } from '@/utils/response';

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
  { pageSize }: { pageSize?: number } = {},
) {
  const [selection, setSelection] = useState<Array<string>>([]);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('components.tableState');

  /**
   * Localized "N nouns": known nouns (_e.g.,_ `'test type'`) map to
   * `components.tableState.entities.testType`; others fall back to English.
   */
  const countLabel = (count: number, noun: string): string => {
    const key =
      `entities.${noun.replace(/ (\w)/g, (_, char: string) => char.toUpperCase())}` as never;
    return t.has(key) ? t(key, { count } as never) : pluralize(count, noun);
  };

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

  /**
   * Deletes the selected rows with one progress toast. Keeps the selection
   * if every delete fails, so the user can retry.
   */
  const removeSelected = (
    remove: Remover,
    noun: string,
    onDeleted?: () => void,
  ) => {
    const ids = selection;
    const toastId = toaster.create({
      type: 'loading',
      title: t('deleting', { items: countLabel(ids.length, noun) }),
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
            ? t('partial', {
                deleted,
                items: countLabel(ids.length, noun),
                failed: failures.length,
              })
            : t('success', { items: countLabel(deleted, noun) }),
        description: reasons || undefined,
      });

      if (deleted > 0) {
        setSelection([]);
        onDeleted?.();
      }
    });
  };

  return {
    ...pagination,
    selection,
    setSelection,
    isPending,
    removeSelected,
  };
}
