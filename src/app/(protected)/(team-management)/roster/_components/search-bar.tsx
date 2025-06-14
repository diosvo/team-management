'use client';

import { useEffect, useState } from 'react';

import SearchInput from '@/components/ui/search-input';

import { useFilters } from '@/app/(protected)/(team-management)/roster/_helpers/use-filters';

export default function SearchBar() {
  const { filters, isPending, updateFilters } = useFilters();
  const [inputValue, setInputValue] = useState(filters.query);

  useEffect(() => {
    setInputValue(filters.query || '');
  }, [filters.query]);

  return (
    <SearchInput
      value={inputValue}
      isPending={isPending}
      onValueChange={setInputValue}
      onSearch={(value: string) => {
        updateFilters({ query: value });
      }}
      onClear={() => {
        updateFilters({ query: '' });
      }}
    />
  );
}
