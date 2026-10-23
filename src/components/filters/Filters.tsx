import type { ReactNode } from 'react';

import { Badge, Box, Button, Drawer, HStack, Portal } from '@chakra-ui/react';
import { SlidersHorizontal } from 'lucide-react';

import { DateRangePicker } from '@/components/date-picker/DateRangePicker';
import SearchInput from '@/components/SearchInput';
import { CloseButton } from '@/components/ui/close-button';

import useSyncedState from '@/hooks/use-synced-state';

import type { FilterControl, FilterDef } from '@/types/filters';
import { countActiveFilters } from '@/utils/filters';

import CheckboxGroupFilter from './CheckboxGroupFilter';
import { CONTROLS_ROW_PROPS, SEARCH_SLOT_PROPS, TOOLBAR_PROPS } from './layout';

type FiltersProps<T extends Record<string, unknown>> = {
  filters: Array<FilterDef>;
  values: T; // Commited values from URL
  defaults: T;
  onApply: (values: Partial<T>) => void;
  disabled?: boolean; // Disable search + all inline controls
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

export default function Filters<T extends Record<string, unknown>>({
  filters,
  values,
  defaults,
  onApply,
  disabled = false,
  actions,
}: FiltersProps<T>) {
  const dateDefs = filters.filter((f) => f.control.type === 'date-range');
  const categoricalDefs = filters.filter(
    (f) => f.control.type === 'checkbox-group',
  );
  // An empty row would still take a flex slot and double the gap after search.
  const hasControls =
    dateDefs.length > 0 || categoricalDefs.length > 0 || Boolean(actions);
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

  return (
    <HStack {...TOOLBAR_PROPS}>
      <Box {...SEARCH_SLOT_PROPS}>
        <SearchInput disabled={disabled} />
      </Box>
      {hasControls && (
        <HStack {...CONTROLS_ROW_PROPS}>
          {dateDefs.map(
            ({ key, label, control }) =>
              control.type === 'date-range' && (
                <DateRangePicker
                  key={key}
                  label={label}
                  selection={control.selection}
                  icon={control.icon}
                  disabled={disabled}
                  min={control.min}
                  max={control.max}
                  value={{
                    from: values.from as string,
                    to: values.to as string,
                  }}
                  onChange={(range) => onApply(range as unknown as Partial<T>)}
                  // No default window means the range is optional (all time).
                  onClear={
                    defaults.from
                      ? undefined
                      : () =>
                          onApply({ from: '', to: '' } as unknown as Partial<T>)
                  }
                />
              ),
          )}

          {categoricalDefs.length > 0 && (
            <Drawer.Root
              placement={{ base: 'bottom', lg: 'end' }}
              onInteractOutside={handleInteractOutside}
            >
              <Drawer.Trigger asChild>
                <Button variant="outline" disabled={disabled}>
                  <SlidersHorizontal size={14} />
                  Filters
                  {activeCount > 0 && (
                    <Badge
                      variant="surface"
                      borderRadius="full"
                      colorPalette="cyan"
                    >
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
                    <Drawer.Footer
                      display="flex"
                      justifyContent="space-between"
                    >
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
      )}
    </HStack>
  );
}
