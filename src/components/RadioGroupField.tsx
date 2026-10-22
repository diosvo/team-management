'use client';

import {
  type ColorPalette,
  Fieldset,
  type FieldsetRootProps,
  HStack,
  SimpleGrid,
  type SimpleGridProps,
} from '@chakra-ui/react';
import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
} from 'react-hook-form';

import { Radio, RadioGroup } from '@/components/ui/radio';
import { Tooltip } from '@/components/ui/tooltip';

import type { Option } from '@/utils/type';

type RadioGroupFieldProps<T extends FieldValues> = Required<{
  control: Control<T>;
  name: Path<T>;
  legend: React.ReactNode;
  options: ReadonlyArray<Option<string>>;
}> &
  Partial<{
    colorPalette: ColorPalette;
    /** Lay the options out on a grid instead of a single wrapping row. */
    columns: SimpleGridProps['columns'];
    /** Hide an option without removing it from the schema (e.g. add vs. edit). */
    isHidden: (option: Option<string>) => boolean;
  }> &
  Omit<FieldsetRootProps, 'children'>;

/** Form-controlled radio group; option descriptions show as tooltips. */
export default function RadioGroupField<T extends FieldValues>({
  control,
  name,
  legend,
  options,
  colorPalette,
  columns,
  isHidden,
  ...rest
}: RadioGroupFieldProps<T>) {
  const Layout = columns ? SimpleGrid : HStack;
  const layoutProps = columns
    ? { columns, gap: 2 }
    : { gap: 4, rowGap: 2, wrap: 'wrap' };

  return (
    <Fieldset.Root {...rest}>
      <Fieldset.Legend color="GrayText">{legend}</Fieldset.Legend>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <RadioGroup
            size="sm"
            marginTop={2}
            colorPalette={colorPalette}
            name={field.name}
            value={field.value}
            disabled={field.disabled}
            onValueChange={({ value }) => field.onChange(value)}
          >
            <Layout {...layoutProps}>
              {options.map((option) => (
                <Tooltip
                  key={option.value}
                  content={option.description}
                  disabled={!option.description}
                >
                  <Radio
                    value={option.value}
                    onBlur={field.onBlur}
                    hidden={isHidden?.(option)}
                  >
                    {option.label}
                  </Radio>
                </Tooltip>
              ))}
            </Layout>
          </RadioGroup>
        )}
      />
    </Fieldset.Root>
  );
}
