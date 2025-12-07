'use client';

import { useEffect, useRef, useState } from 'react';

import { Input, InputGroup, InputProps } from '@chakra-ui/react';
import { Search } from 'lucide-react';

import { CloseButton } from '@/components/ui/close-button';
import { useCommonParams } from '@/utils/filters';

export default function SearchInput(props: InputProps) {
  const [{ q }, setSearchParams] = useCommonParams();
  // Manage local state for the search input
  const [search, setSearch] = useState(q);
  const inputRef = useRef<Nullable<HTMLInputElement>>(null);

  useEffect(() => {
    // Debounce the search input to avoid excessive updates
    const timer = setTimeout(() => {
      if (search !== q) {
        setSearchParams({ q: search });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, q]);

  const endElement = search ? (
    <CloseButton
      size="2xs"
      borderRadius="full"
      onClick={() => {
        setSearch('');
        inputRef.current?.focus();
      }}
    />
  ) : undefined;

  return (
    <InputGroup startElement={<Search size={14} />} endElement={endElement}>
      <Input
        type="search"
        value={search}
        ref={inputRef}
        name="search-input"
        placeholder="Search..."
        borderWidth={1}
        size={{ base: 'sm', md: 'md' }}
        css={{ '--focus-color': 'colors.red.300' }}
        onChange={(e) => setSearch(e.target.value)}
        {...props}
      />
    </InputGroup>
  );
}
