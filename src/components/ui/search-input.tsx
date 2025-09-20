'use client';

import { useRef } from 'react';

import { Input, InputGroup, Spinner } from '@chakra-ui/react';
import { Search } from 'lucide-react';

import { CloseButton } from '@/components/ui/close-button';

interface SearchInputProps {
  value: string;
  disabled?: boolean;
  maxLength?: number;
  isPending?: boolean;
  onValueChange: (value: string) => void;
  onClear: () => void;
  onSearch?: (value: string) => void;
}

export default function SearchInput({
  value,
  disabled = false,
  maxLength = 64,
  isPending = false,
  onValueChange,
  onSearch,
  onClear,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onValueChange('');
    onClear();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch?.(value);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(e.target.value);
  };

  return (
    <InputGroup
      startElement={
        isPending ? (
          <Spinner size="xs" colorPalette="gray" borderWidth={1} />
        ) : (
          <Search size={14} />
        )
      }
      endElement={
        value && (
          <CloseButton size="2xs" borderRadius="full" onClick={handleClear} />
        )
      }
    >
      <Input
        ref={inputRef}
        value={value}
        disabled={disabled}
        maxLength={maxLength}
        name="search-input"
        placeholder="Search..."
        borderWidth={1}
        size={{ base: 'sm', md: 'md' }}
        css={{ '--focus-color': 'colors.red.300' }}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </InputGroup>
  );
}
