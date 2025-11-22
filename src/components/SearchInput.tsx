'use client';

import { Input, InputGroup } from '@chakra-ui/react';
import { Search } from 'lucide-react';

import { CloseButton } from '@/components/ui/close-button';
import { useCommonParams } from '@/utils/filters';

type SearchInputProps = Partial<{
  disabled: boolean;
  maxLength: number;
}>;

export default function SearchInput({
  disabled = false,
  maxLength = 64,
}: SearchInputProps) {
  const [{ q }, setSearchParams] = useCommonParams();

  return (
    <InputGroup
      startElement={<Search size={14} />}
      endElement={
        q && (
          <CloseButton
            size="2xs"
            borderRadius="full"
            onClick={() => setSearchParams({ q: '' })}
          />
        )
      }
    >
      <Input
        type="search"
        value={q}
        disabled={disabled}
        maxLength={maxLength}
        name="search-input"
        placeholder="Search..."
        borderWidth={1}
        size={{ base: 'sm', md: 'md' }}
        css={{ '--focus-color': 'colors.red.300' }}
        onChange={(e) => setSearchParams({ q: e.target.value })}
      />
    </InputGroup>
  );
}
