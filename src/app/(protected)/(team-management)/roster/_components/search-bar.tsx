'use client';

import { useEffect, useRef, useState } from 'react';

import { Input, InputGroup, Kbd, Spinner } from '@chakra-ui/react';
import { Search } from 'lucide-react';

import { useFilters } from '@/app/(protected)/(team-management)/roster/_helpers/use-filters';
import { CloseButton } from '@/components/ui/close-button';

export default function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { filters, isPending, updateFilters } = useFilters();
  const [inputValue, setInputValue] = useState(filters.query);

  useEffect(() => {
    setInputValue(filters.query || '');
  }, [filters.query]);

  const handleClear = () => {
    setInputValue('');
    updateFilters({ query: '' });
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      updateFilters({ query: inputValue });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <InputGroup
      flex="1"
      startElement={
        isPending ? (
          <Spinner size="xs" colorPalette="gray" borderWidth={1} />
        ) : (
          <Search size={14} />
        )
      }
      endElement={
        filters.query ? (
          <CloseButton size="2xs" rounded="full" onClick={handleClear} />
        ) : (
          <Kbd size="sm">Enter</Kbd>
        )
      }
    >
      <Input
        ref={inputRef}
        maxLength={50}
        borderWidth={1}
        name="search-bar"
        placeholder="Search..."
        css={{ '--focus-color': 'colors.red.200' }}
        value={inputValue}
        size={{ base: 'sm', md: 'md' }}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </InputGroup>
  );
}
