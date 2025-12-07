'use client';

import { useRef } from 'react';

import { Input, InputGroup, InputProps } from '@chakra-ui/react';
import { Search } from 'lucide-react';

import { CloseButton } from '@/components/ui/close-button';
import { useCommonParams } from '@/utils/filters';

export default function SearchInput(props: InputProps) {
  const [{ q }, setSearchParams] = useCommonParams();
  const inputRef = useRef<Nullable<HTMLInputElement>>(null);

  const endElement = q ? (
    <CloseButton
      size="2xs"
      borderRadius="full"
      onClick={() => {
        setSearchParams({ q: '' });
        inputRef.current?.focus();
      }}
    />
  ) : undefined;

  return (
    <InputGroup startElement={<Search size={14} />} endElement={endElement}>
      <Input
        type="search"
        value={q}
        ref={inputRef}
        name="search-input"
        placeholder="Search..."
        borderWidth={1}
        size={{ base: 'sm', md: 'md' }}
        css={{ '--focus-color': 'colors.red.300' }}
        onChange={(e) => setSearchParams({ q: e.target.value })}
        {...props}
      />
    </InputGroup>
  );
}
