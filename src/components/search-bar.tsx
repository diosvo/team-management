'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useRef } from 'react';

import { Input, InputGroup, Kbd, Spinner } from '@chakra-ui/react';
import { Search } from 'lucide-react';
import { useController, useForm } from 'react-hook-form';

import { CloseButton } from '@/components/ui/close-button';

interface SearchBarProps {
  isPending: boolean;
  onSearch: (term: string) => void;
}

export default function SearchBar({ isPending, onSearch }: SearchBarProps) {
  const { control } = useForm();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const searchQuery = useMemo(
    () => searchParams.get('query')?.toString() || '',
    [searchParams]
  );

  const query = useController({
    control,
    name: 'query',
    defaultValue: searchQuery,
  });

  const handleClear = () => {
    query.field.onChange('');
    onSearch('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch(e.currentTarget.value);
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
        searchQuery ? (
          <CloseButton size="xs" onClick={handleClear} />
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
        css={{ '--focus-color': 'colors.red.300' }}
        value={query.field.value}
        onChange={query.field.onChange}
        onKeyDown={handleKeyDown}
      />
    </InputGroup>
  );
}
