'use client';

import type { ReactNode } from 'react';

import {
  Badge,
  Box,
  Button,
  Drawer,
  HStack,
  Input,
  Portal,
} from '@chakra-ui/react';
import { SlidersHorizontal } from 'lucide-react';

import SearchInput from '@/components/SearchInput';
import { CloseButton } from '@/components/ui/close-button';

import useSyncedState from '@/hooks/use-synced-state';

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
  keys: Array<string>,
): CategoricalValues =>
  Object.fromEntries(
    keys.map((key) => [key, (source[key] as Array<string>) ?? []]),
  );

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

  // Draft mirrors the committed (URL) values, resyncing when they change
  // externally - e.g. a stat card click that writes directly to the URL,
  // bypassing the drawer's Apply flow.
  const [draft, setDraft] = useSyncedState<CategoricalValues>(committed);

  const setField = <K extends keyof CategoricalValues>(
    field: K,
    value: CategoricalValues[K],
  ) => setDraft((prev) => ({ ...prev, [field]: value }));
  const handleReset = () => setDraft(defaultsSubset);
  const handleApply = () => onApply(draft as Partial<T>);
  const handleInteractOutside = () => setDraft(committed);

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
      case 'date':
        return (
          <Input
            key={def.key}
            type="date"
            aria-label={def.label}
            width="max-content"
            flexShrink={0}
            min={def.control.min}
            max={def.control.max}
            size={{ base: 'sm', md: 'md' }}
            value={values[def.key] as string}
            onChange={(event) =>
              onApply({ [def.key]: event.target.value } as Partial<T>)
            }
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
