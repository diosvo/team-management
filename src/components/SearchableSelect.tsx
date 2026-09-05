'use client';

import { useMemo, useState } from 'react';
import useSWR, { type SWRConfiguration } from 'swr';

import {
  Combobox,
  HStack,
  Portal,
  Span,
  Spinner,
  createListCollection,
  useFilter,
} from '@chakra-ui/react';
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import { Field, type FieldProps } from './ui/field';
import { toaster } from './ui/toaster';

/** Everything both variants need, regardless of how the value is held. */
type BaseProps<T> = Required<{
  label: string;
  action: () => Promise<Array<T>>;
  // 🚨 https://chakra-ui.com/docs/components/combobox#custom-objects
  itemToString: (item: T) => string; // What users see
  itemToValue: (item: T) => string; // What gets submitted
}> &
  Partial<{
    maxItems: number;
    fieldProps: Partial<FieldProps>;
    rootProps: Partial<Omit<Combobox.RootProps, 'multiple'>>;
    swrOptions: SWRConfiguration;
    renderItem: (item: T) => React.ReactNode;
  }>;

export type SearchableSelectProps<T> = BaseProps<T> &
  (
    | { multiple: true; value: Array<T>; onChange: (items: Array<T>) => void }
    | {
        multiple: false;
        value: Nullable<T>;
        onChange: (item: Nullable<T>) => void;
      }
  );

export type SearchableSelectFieldProps<
  T,
  TFieldValues extends FieldValues = FieldValues,
> = BaseProps<T> & {
  multiple: boolean;
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
};

/**
 * Select that owns its value directly.
 *
 * For a react-hook-form field, use {@link SearchableSelectField} instead.
 */
export default function SearchableSelect<T>(props: SearchableSelectProps<T>) {
  const items = _useItems(props);
  const shared = { ...items, ..._toBaseProps(props) };

  if (props.multiple) {
    return (
      <ComboboxBase
        {...shared}
        multiple
        selected={props.value ?? []}
        onSelect={props.onChange}
      />
    );
  }

  return (
    <ComboboxBase
      {...shared}
      multiple={false}
      selected={props.value ? [props.value] : []}
      onSelect={(items) => props.onChange(items[0] ?? null)}
    />
  );
}

/**
 * Select bound to a react-hook-form field.
 *
 * Submits:
 * - `multiple`: `itemToValue(item)` - an array of ids
 * - `single`: `id` or `null`.
 */
export function SearchableSelectField<
  T,
  TFieldValues extends FieldValues = FieldValues,
>({
  multiple,
  control,
  name,
  ...props
}: SearchableSelectFieldProps<T, TFieldValues>) {
  const { itemToValue } = props;
  const items = _useItems(props);
  const shared = { ...items, ..._toBaseProps(props) };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const fieldProps = {
          ...props.fieldProps,
          invalid: !!fieldState.error,
          errorText: fieldState.error?.message,
        };

        if (multiple) {
          const ids = (field.value as Array<string>) ?? [];

          return (
            <ComboboxBase
              {...shared}
              multiple
              fieldProps={fieldProps}
              selected={shared.allItems.filter((item) =>
                ids.includes(itemToValue(item)),
              )}
              onSelect={(items) => field.onChange(items.map(itemToValue))}
            />
          );
        }

        const selected = shared.allItems.find(
          (item) => itemToValue(item) === field.value,
        );

        return (
          <ComboboxBase
            {...shared}
            multiple={false}
            fieldProps={fieldProps}
            selected={selected ? [selected] : []}
            onSelect={(items) =>
              field.onChange(items[0] ? itemToValue(items[0]) : null)
            }
          />
        );
      }}
    />
  );
}

//#region INTERNAL
/** Loads the option list once per `label` and shares it across both variants. */
function _useItems<T>({
  label,
  action,
  swrOptions,
}: Pick<BaseProps<T>, 'label' | 'action' | 'swrOptions'>) {
  // https://swr.vercel.app/docs/revalidation#disable-automatic-revalidations
  const { data, isLoading, isValidating, error } = useSWR(label, action, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    ...swrOptions,
  });

  return { allItems: data ?? [], isLoading, isValidating, error };
}

function _toBaseProps<T>(props: BaseProps<T>) {
  return {
    label: props.label,
    itemToString: props.itemToString,
    itemToValue: props.itemToValue,
    maxItems: props.maxItems,
    renderItem: props.renderItem,
    rootProps: props.rootProps,
    fieldProps: props.fieldProps,
  };
}

/**
 * Renders the combobox. Selection is always an array here; single-select
 * variants map to and from a one-item array at the boundary above.
 */
type ComboboxBaseProps<T> = Omit<
  BaseProps<T>,
  'action' | 'swrOptions' | 'itemToString' | 'itemToValue'
> &
  Required<{
    multiple: boolean;
    allItems: Array<T>;
    isLoading: boolean;
    isValidating: boolean;
    error: unknown;
    selected: Array<T>;
    onSelect: (items: Array<T>) => void;
    itemToString: (item: T) => string;
    itemToValue: (item: T) => string;
  }>;

function ComboboxBase<T>({
  label,
  multiple,
  allItems,
  isLoading,
  isValidating,
  error,
  itemToString,
  itemToValue,
  maxItems,
  selected,
  onSelect,
  rootProps,
  fieldProps,
  renderItem,
}: ComboboxBaseProps<T>) {
  const { contains } = useFilter({ sensitivity: 'base' });
  const [filterInput, setFilterInput] = useState('');

  // Ensure selected item(s) are always present even while allItems is loading.
  // This guarantees the Combobox can display the selected item's label on first render.
  const itemsWithSelected = useMemo(() => {
    if (!allItems.length) return selected;

    const loadedIds = new Set(allItems.map(itemToValue));
    const extras = selected.filter((item) => !loadedIds.has(itemToValue(item)));

    return extras.length ? [...allItems, ...extras] : allItems;
  }, [allItems, selected, itemToValue]);

  const filteredItems = useMemo(
    () =>
      filterInput
        ? itemsWithSelected.filter((item) =>
            contains(itemToString(item), filterInput),
          )
        : itemsWithSelected,
    [itemsWithSelected, filterInput, itemToString, contains],
  );

  const collection = useMemo(
    () =>
      createListCollection({ items: filteredItems, itemToString, itemToValue }),
    [filteredItems, itemToString, itemToValue],
  );

  const handleValueChange = ({ items }: Combobox.ValueChangeDetails<T>) => {
    if (maxItems && items.length > maxItems) {
      toaster.warning({
        title: `You can only select up to ${maxItems} items.`,
      });
      return;
    }

    onSelect(items);
  };

  return (
    <Field label={'Select ' + label} {...fieldProps}>
      <Combobox.Root
        openOnClick
        multiple={multiple}
        collection={collection}
        value={selected.map(itemToValue)}
        onValueChange={handleValueChange}
        onInputValueChange={(e) => setFilterInput(e.inputValue)}
        onOpenChange={({ open }) => {
          if (!open) setFilterInput('');
        }}
        {...rootProps}
      >
        <Combobox.Control>
          <Combobox.Input placeholder="Type to search" />
          <Combobox.IndicatorGroup>
            <Combobox.ClearTrigger />
            <Combobox.Trigger />
          </Combobox.IndicatorGroup>
        </Combobox.Control>

        <Portal>
          <Combobox.Positioner>
            <Combobox.Content>
              {isLoading || isValidating ? (
                <HStack padding={2}>
                  <Spinner size="xs" borderWidth={1} />
                  <Span>Loading...</Span>
                </HStack>
              ) : error ? (
                <Span padding={2} color="fg.error">
                  {String(error)}
                </Span>
              ) : (
                <>
                  <Combobox.Empty>No {label} found.</Combobox.Empty>
                  {collection.items.map((item) => (
                    <Combobox.Item item={item} key={itemToValue(item)}>
                      <Combobox.ItemText truncate>
                        {renderItem ? renderItem(item) : itemToString(item)}
                      </Combobox.ItemText>
                      <Combobox.ItemIndicator />
                    </Combobox.Item>
                  ))}
                </>
              )}
            </Combobox.Content>
          </Combobox.Positioner>
        </Portal>
      </Combobox.Root>
    </Field>
  );
}
// #endregion
