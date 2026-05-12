import { useMemo, useState } from 'react';

import { paginateData } from '@/utils/filters';

export function useFilteredPagination<T>(
  data: Array<T>,
  predicate: (item: T) => boolean,
  page: number,
  pageSize?: number,
) {
  const [selection, setSelection] = useState<Array<string>>([]);
  const [prevPredicate, setPrevPredicate] = useState(() => predicate);

  if (prevPredicate !== predicate) {
    setPrevPredicate(() => predicate);
    setSelection([]);
  }

  const pagination = useMemo(() => {
    const items = data.filter(predicate);
    return {
      items,
      currentData: paginateData(items, page, pageSize),
      totalCount: items.length,
    };
  }, [data, predicate, page, pageSize]);

  return { ...pagination, selection, setSelection };
}
