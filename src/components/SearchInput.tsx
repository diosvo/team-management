'use client';

import { useEffect, useRef } from 'react';

import { Input, InputGroup, InputProps } from '@chakra-ui/react';
import { Search } from 'lucide-react';

import { CloseButton } from '@/components/ui/close-button';
import useSyncedState from '@/hooks/use-synced-state';
import { useCommonParams } from '@/lib/nuqs';

export default function SearchInput(props: InputProps) {
  const [{ q }, setSearchParams] = useCommonParams();
  // Local input state mirrors `q`, resyncing when the URL changes externally
  // (e.g. a stat card click that resets `q`) so stale text can't clobber it.
  const [search, setSearch] = useSyncedState(q);
  const inputRef = useRef<Nullable<HTMLInputElement>>(null);

  useEffect(() => {
    // Debounce the search input to avoid excessive updates
    const timer = setTimeout(() => {
      if (search !== q) {
        // Reset to page 1 on new search
        setSearchParams({ q: search, page: 1 });
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
