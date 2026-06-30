import { Stat as ChakraStat, ColorPalette, Span } from '@chakra-ui/react';

import { formatValueUnit } from '@/utils/formatter';

export type StatProps = Omit<ChakraStat.RootProps, 'title' | 'onClick'> & {
  label: React.ReactNode;
  value: React.ReactNode;
} & Partial<{
    /** Base unit label (e.g. "player", "%"); pluralized against the value. */
    unit: string;
    /** Color applied to the value text. */
    color: ColorPalette;
    onClick: () => void;
  }>;

export function Stat({
  label,
  value,
  unit,
  color,
  onClick,
  ...rest
}: StatProps) {
  const interactive = Boolean(onClick) && value !== 0;
  const formattedUnit =
    unit == null
      ? null
      : typeof value === 'number'
        ? formatValueUnit(value, unit)
        : unit;
  const interactiveStyle = {
    role: 'button',
    cursor: 'pointer',
    tabIndex: 0,
    _hover: {
      cursor: 'pointer',
      shadow: 'sm',
      transform: 'translateY(-2px)',
      transition: 'all 0.2s ease-in-out',
    },
    onClick,
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick?.();
      }
    },
  };

  return (
    <ChakraStat.Root
      borderWidth={1}
      padding={4}
      rounded="md"
      {...(interactive && interactiveStyle)}
      {...rest}
    >
      <ChakraStat.Label>{label}</ChakraStat.Label>
      <ChakraStat.ValueText alignItems="baseline">
        <Span color={color}>{value}</Span>
        {formattedUnit != null && (
          <ChakraStat.ValueUnit>{formattedUnit}</ChakraStat.ValueUnit>
        )}
      </ChakraStat.ValueText>
    </ChakraStat.Root>
  );
}
