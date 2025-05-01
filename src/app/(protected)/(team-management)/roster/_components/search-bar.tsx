'use client';

import { useRef } from 'react';

import { Input, InputGroup, Kbd, Spinner } from '@chakra-ui/react';
import { Search } from 'lucide-react';

import { useFilters } from '@/app/(protected)/(team-management)/roster/_helpers/use-filters';
import { CloseButton } from '@/components/ui/close-button';

export default function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { filters, isPending, updateFilters } = useFilters();

  const handleClear = () => {
    updateFilters({ query: '' });
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      updateFilters({ query: e.currentTarget.value });
    }
  };

  return (
    <InputGroup
      flex="1"
      startElement={
        isPending ? (
          <Spinner size="xs" colorPalette="gray" borderWidth="1px" />
        ) : (
          <Search size={14} />
        )
      }
      endElement={
        filters.query ? (
          <CloseButton size="2xs" borderRadius="full" onClick={handleClear} />
        ) : (
          <Kbd size="sm">Enter</Kbd>
        )
      }
    >
      <Input
        ref={inputRef}
        maxLength={50}
        borderWidth="1px"
        name="search-bar"
        placeholder="Search..."
        css={{ '--focus-color': 'colors.red.200' }}
        defaultValue={filters.query}
        onKeyDown={handleKeyDown}
      />
    </InputGroup>
  );
}
