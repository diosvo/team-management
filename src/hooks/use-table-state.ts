import { useEffect, useMemo, useState } from 'react';

import { paginateData } from '@/utils/filters';
import usePermissions from './use-permissions';

type Options = {
  pageSize: number;
  headerCount: number;
};

export default function useTableState<T>(
  data: Array<T>,
  predicate: (item: T) => boolean,
  page: number,
  { pageSize, headerCount }: Partial<Options> = {},
) {
  const { isAdmin } = usePermissions();
  const [selection, setSelection] = useState<Array<string>>([]);

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

  const selectionCount = selection.length;
  const hasSelection = selectionCount > 0;
  const indeterminate = hasSelection && selectionCount < pagination.totalCount;
  const columnCount =
    headerCount !== undefined ? headerCount + (isAdmin ? 1 : 0) : undefined;

  return {
    ...pagination,
    selection,
    setSelection,
    selectionCount,
    hasSelection,
    indeterminate,
    columnCount,
  };
}
