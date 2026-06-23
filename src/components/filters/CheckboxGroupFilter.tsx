'use client';

import { Button, CheckboxGroup, Fieldset, Span } from '@chakra-ui/react';

import { Checkbox } from '@/components/ui/checkbox';

import { getColor } from '@/utils/helper';
import { Selection } from '@/utils/type';

type CheckboxGroupFilterProps = {
  label: string;
  value: Array<string>;
  options: Selection<string>;
  onChange: (value: string[]) => void;
};

export default function CheckboxGroupFilter({
  label,
  value,
  options,
  onChange,
}: CheckboxGroupFilterProps) {
  const horizontal = options.length <= 3;

  return (
    <Fieldset.Root>
      <CheckboxGroup value={value} onValueChange={onChange}>
        <Fieldset.Legend
          display="flex"
          justifyContent="space-between"
          fontSize="sm"
          whiteSpace="nowrap"
        >
          <Span fontWeight="medium">{label}</Span>
          <Button
            size="2xs"
            variant="ghost"
            colorPalette="red"
            visibility={value.length === 0 ? 'hidden' : 'visible'}
            onClick={() => onChange([])}
          >
            clear
          </Button>
        </Fieldset.Legend>
        <Fieldset.Content
          display="flex"
          gap={horizontal ? 6 : 2}
          flexDirection={horizontal ? 'row' : 'column'}
        >
          {options.map(({ label, value }) => (
            <Checkbox
              key={value}
              value={value}
              _checked={{
                fontWeight: 'medium',
                color: getColor(value),
              }}
            >
              {label}
            </Checkbox>
          ))}
        </Fieldset.Content>
      </CheckboxGroup>
    </Fieldset.Root>
  );
}
