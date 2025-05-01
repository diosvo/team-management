'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';

import { Input, InputGroup, Kbd, Spinner } from '@chakra-ui/react';
import { Search } from 'lucide-react';

import { CloseButton } from '@/components/ui/close-button';

const Q_KEY = 'query';

export default function SearchBar({ isLoading }: { isLoading: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState<string>(searchParams.get(Q_KEY) ?? '');

  const onSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    term ? params.set(Q_KEY, term) : params.delete(Q_KEY);

    startTransition(() => {
      setValue(term);
      router.push(`?${params.toString()}`);
    });
  };

  const handleClear = () => {
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
        searchParams.get(Q_KEY) ? (
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
        value={value}
        onKeyDown={handleKeyDown}
        onChange={(e) => setValue(e.currentTarget.value)}
      />
    </InputGroup>
  );
}
