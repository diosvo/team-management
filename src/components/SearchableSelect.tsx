'use client';

import { useMemo, useState } from 'react';
import useSWR, { SWRConfiguration } from 'swr';

import {
  Combobox,
  HStack,
  Portal,
  Span,
  Spinner,
  createListCollection,
  useFilter,
} from '@chakra-ui/react';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';

import { Field, FieldProps } from './ui/field';
import { toaster } from './ui/toaster';

// Shared by all modes
type BaseProps<T> = Required<{
  label: string;
  multiple: boolean;
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

// Uncontrolled mode: value/onChange are required; RHF props are excluded
type Uncontrolled<V, M> = {
  controlledMode: false;
  multiple: M;
  value: V;
  onChange: (items: V) => void;
  control?: never;
  name?: never;
};
type UncontrolledProps<T> =
  | Uncontrolled<Array<T>, true>
  | Uncontrolled<Nullable<T>, false>;

// Controlled (RHF) mode: control/name are required; value/onChange are excluded
type ControlledProps<_, TFieldValues extends FieldValues = any> = {
  controlledMode: true;
  multiple: boolean;
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  value?: never;
  onChange?: never;
};

export type SearchableSelectProps<
  T,
  TFieldValues extends FieldValues = any,
> = BaseProps<T> & (UncontrolledProps<T> | ControlledProps<T, TFieldValues>);

type ComboboxBaseProps<T> = Omit<
  BaseProps<T>,
  'action' | 'swrOptions' | 'multiple'
> &
  Required<{
    allItems: Array<T>;
    isLoading: boolean;
    isValidating: boolean;
    error: unknown;
  }> &
  (
    | { multiple: true; value: Array<T>; onChange: (items: Array<T>) => void }
    | {
        multiple: false;
        value: Nullable<T>;
        onChange: (item: Nullable<T>) => void;
      }
  );

export default function SearchableSelect<
  T,
  TFieldValues extends FieldValues = any,
>(props: SearchableSelectProps<T, TFieldValues>) {
  // https://swr.vercel.app/docs/revalidation#disable-automatic-revalidations
  const { data, isLoading, isValidating, error } = useSWR(
    props.label,
    props.action,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      ...props.swrOptions,
    },
  );
  const allItems = data ?? [];

  const sharedProps = {
    label: props.label,
    allItems,
    isLoading,
    isValidating,
    error,
    itemToString: props.itemToString,
    itemToValue: props.itemToValue,
    maxItems: props.maxItems,
    renderItem: props.renderItem,
    rootProps: props.rootProps,
  };

  if (props.controlledMode) {
    return (
      <Controller
        control={props.control}
        name={props.name}
        render={({ field, fieldState }) => {
          const fieldProps = {
            ...props.fieldProps,
            invalid: !!fieldState.error,
            errorText: fieldState.error?.message,
          };

          if (props.multiple) {
            const fieldValues = (field.value as Array<string>) ?? [];
            const value = allItems.filter((item) =>
              fieldValues.includes(props.itemToValue(item)),
            );

            return (
              <ComboboxBase
                {...sharedProps}
                multiple={true}
                value={value}
                onChange={(items) =>
                  field.onChange(items.map(props.itemToValue))
                }
                fieldProps={fieldProps}
              />
            );
          }

          const value =
            allItems.find((item) => props.itemToValue(item) === field.value) ??
            null;

          return (
            <ComboboxBase
              {...sharedProps}
              multiple={false}
              value={value}
              onChange={(item) =>
                field.onChange(item ? props.itemToValue(item) : null)
              }
              fieldProps={fieldProps}
            />
          );
        }}
      />
    );
  }

  if (props.multiple) {
    return (
      <ComboboxBase
        {...sharedProps}
        multiple={true}
        value={props.value}
        onChange={props.onChange}
        fieldProps={props.fieldProps}
      />
    );
  }

  return (
    <ComboboxBase
      {...sharedProps}
      multiple={false}
      value={props.value}
      onChange={props.onChange}
      fieldProps={props.fieldProps}
    />
  );
}

//#region INTERNAL
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
  value,
  onChange,
  rootProps,
  fieldProps,
  renderItem,
}: ComboboxBaseProps<T>) {
  const { contains } = useFilter({ sensitivity: 'base' });
  const [filterInput, setFilterInput] = useState('');

  // Ensure selected item(s) are always present even while allItems is loading.
  // This guarantees the Combobox can display the selected item's label on first render.
  const itemsWithSelected = useMemo(() => {
    const selected = multiple
      ? ((value as Array<T>) ?? [])
      : value
        ? [value as T]
        : [];
    if (!allItems.length) return selected;

    const loadedIds = new Set(allItems.map(itemToValue));
    const extras = selected.filter((item) => !loadedIds.has(itemToValue(item)));

    return extras.length ? [...allItems, ...extras] : allItems;
  }, [allItems, value, multiple, itemToValue]);

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

    if (multiple) {
      (onChange as (items: Array<T>) => void)(items);
    } else {
      (onChange as (item: Nullable<T>) => void)(items[0] ?? null);
    }
  };

  const normalizedValue = multiple
    ? ((value as Array<T>)?.map(itemToValue) ?? [])
    : value
      ? [itemToValue(value as T)]
      : [];

  return (
    <Field label={'Select ' + label} {...fieldProps}>
      <Combobox.Root
        openOnClick
        multiple={multiple}
        collection={collection}
        value={normalizedValue}
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
