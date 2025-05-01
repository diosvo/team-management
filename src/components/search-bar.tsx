'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useRef, useTransition } from 'react';

import { Input, InputGroup, Kbd, Spinner } from '@chakra-ui/react';
import { Search } from 'lucide-react';
import { useController, useForm } from 'react-hook-form';

import { CloseButton } from '@/components/ui/close-button';

const Q_KEY = 'query';

export default function SearchBar({ isLoading }: { isLoading: boolean }) {
  const router = useRouter();
  const { control } = useForm();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const searchQuery = useMemo(
    () => searchParams.get(Q_KEY)?.toString() || '',
    [searchParams]
  );

  const query = useController({
    control,
    name: Q_KEY,
    defaultValue: searchQuery,
  });

  const onSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set(Q_KEY, term);
    } else {
      params.delete(Q_KEY);
    }
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

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
        isPending || isLoading ? (
          <Spinner size="xs" colorPalette="gray" borderWidth="1px" />
        ) : (
          <Search size={14} />
        )
      }
      endElement={
        searchQuery ? (
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
        css={{ '--focus-color': 'colors.red.300' }}
        value={query.field.value}
        onChange={query.field.onChange}
        onKeyDown={handleKeyDown}
      />
    </InputGroup>
  );
}
