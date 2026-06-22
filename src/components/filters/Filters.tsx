'use client';

import type { ReactNode } from 'react';

import { Badge, Box, Button, Drawer, HStack, Portal } from '@chakra-ui/react';
import { SlidersHorizontal } from 'lucide-react';

import SearchInput from '@/components/SearchInput';
import { CloseButton } from '@/components/ui/close-button';

import { useLocalFilters } from '@/hooks/use-local-filters';

import { type FilterControl, type FilterDef } from '@/types/filters';
import { countActiveFilters } from '@/utils/filters';

import CheckboxGroupFilter from './CheckboxGroupFilter';
import TimePicker from './TimePicker';

type FiltersProps<T extends Record<string, unknown>> = {
  filters: Array<FilterDef>;
  values: T; // Commited values from URL
  defaults: T;
  onApply: (values: Partial<T>) => void;
  searchable?: boolean;
  actions?: ReactNode; // Right-aligned (button), not counted
};

// Categorical (checkbox-group) filters are always string arrays.
type CategoricalValues = Record<string, Array<string>>;

const pickArrays = (
  source: Record<string, unknown>,
  keys: string[],
): CategoricalValues =>
  Object.fromEntries(keys.map((key) => [key, (source[key] as string[]) ?? []]));

export const isInlineControl = (control: FilterControl): boolean =>
  control.type === 'interval' || control.type === 'date';

export default function Filters<T extends Record<string, unknown>>({
  filters,
  values,
  defaults,
  onApply,
  searchable = true,
  actions,
}: FiltersProps<T>) {
  const inlineDefs = filters.filter((f) => isInlineControl(f.control));
  const categoricalDefs = filters.filter(
    (f) => f.control.type === 'checkbox-group',
  );
  const keys = categoricalDefs.map((f) => f.key);

  const committed = pickArrays(values, keys);
  const defaultsSubset = pickArrays(defaults, keys);
  const { draft, setField, handleReset, handleApply, handleInteractOutside } =
    useLocalFilters<CategoricalValues>(committed, defaultsSubset, (next) =>
      onApply(next as Partial<T>),
    );

  const activeCount = countActiveFilters(committed, defaultsSubset);

  const renderInline = (def: FilterDef) => {
    switch (def.control.type) {
      case 'interval':
        return (
          <TimePicker
            key={def.key}
            value={values[def.key] as string}
            onChange={(value) => onApply({ [def.key]: value } as Partial<T>)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <HStack gap={{ base: 3, lg: 4 }}>
      {searchable && <SearchInput />}
      {inlineDefs.map(renderInline)}

      {categoricalDefs.length > 0 && (
        <Drawer.Root
          closeOnEscape={false}
          placement={{ base: 'bottom', lg: 'end' }}
          onInteractOutside={handleInteractOutside}
        >
          <Drawer.Trigger asChild>
            <Button size={{ base: 'sm', md: 'md' }} variant="outline">
              <SlidersHorizontal size={14} />
              Filters
              {activeCount > 0 && (
                <Badge borderRadius="full" colorPalette="cyan">
                  {activeCount}
                </Badge>
              )}
            </Button>
          </Drawer.Trigger>
          <Portal>
            <Drawer.Backdrop />
            <Drawer.Positioner>
              <Drawer.Content maxWidth={{ base: 'full', lg: 'sm' }}>
                <Drawer.Header>
                  <Drawer.Title>Advanced Filters</Drawer.Title>
                </Drawer.Header>
                <Drawer.Body
                  display="flex"
                  flexDirection="column"
                  alignItems="start"
                  gap={6}
                >
                  {categoricalDefs.map((def) => {
                    const { options } = def.control as Extract<
                      FilterControl,
                      { type: 'checkbox-group' }
                    >;
                    return (
                      <CheckboxGroupFilter
                        key={def.key}
                        label={def.label}
                        options={options}
                        value={draft[def.key] ?? []}
                        onChange={(value) => setField(def.key, value)}
                      />
                    );
                  })}
                </Drawer.Body>
                <Drawer.Footer display="flex" justifyContent="space-between">
                  <Button
                    variant="ghost"
                    colorPalette="red"
                    onClick={handleReset}
                  >
                    Reset all
                  </Button>
                  <Drawer.ActionTrigger asChild>
                    <Button onClick={handleApply}>Apply</Button>
                  </Drawer.ActionTrigger>
                </Drawer.Footer>
                <Drawer.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Drawer.CloseTrigger>
              </Drawer.Content>
            </Drawer.Positioner>
          </Portal>
        </Drawer.Root>
      )}

      {actions && <Box marginInlineStart="auto">{actions}</Box>}
    </HStack>
  );
}
