'use client';

import { SimpleGrid } from '@chakra-ui/react';

import TimePicker from '@/components/filters/TimePicker';
import { MatchSearchParamsKeys, useDashboardFilters } from '@/utils/filters';

export default function DashboardFilters() {
  const [{ interval }, setSearchParams] = useDashboardFilters();

  const handleSearchParams = (key: MatchSearchParamsKeys, value: string) => {
    setSearchParams({ [key]: value, page: 1 }, { shallow: false });
  };

  return (
    <SimpleGrid columns={1} gap={3}>
      <TimePicker
        value={interval}
        onChange={(value) => handleSearchParams('interval', value)}
      />
    </SimpleGrid>
  );
}
