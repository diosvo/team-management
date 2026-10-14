'use client';

import { useMemo, useState, useTransition } from 'react';
import useSWRImmutable from 'swr/immutable';

import {
  Button,
  createListCollection,
  createOverlay,
  Dialog,
  HStack,
  IconButton,
  List,
  ListCollection,
  Portal,
  Select,
  Span,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Save, X } from 'lucide-react';

import SearchableSelect from '@/components/SearchableSelect';
import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';

import { UpsertReportScheduleSchema } from '@/schemas/report';
import {
  SCHEDULED_INTERVAL_SELECTION,
  type ScheduledInterval,
} from '@/utils/constants';
import { Option } from '@/utils/type';

import { getReportRecipients, upsertReportSchedule } from '@/actions/report';

import { ReportSchedule } from '@/drizzle/schema';

export const UPSERT_SCHEDULE_ID = 'upsert-schedule';

type ScheduleItem = { schedule_id: string } & Partial<
  Pick<ReportSchedule, 'interval' | 'recipients'>
>;

interface UpsertProps {
  action: 'Add' | 'Update';
  item: ScheduleItem;
  usedIntervals: Array<ReportSchedule['interval']>;
}

interface SelectFieldProps<T extends string> {
  label: string;
  collection: ListCollection<Option<T>>;
  value?: T;
  placeholder: string;
  disabled: boolean;
  onChange: (value: T) => void;
}

/** One `Field` + Chakra `Select`. */
function SelectField<T extends string>({
  label,
  collection,
  value,
  placeholder,
  disabled,
  onChange,
}: SelectFieldProps<T>) {
  return (
    <Field required label={label}>
      <Select.Root
        collection={collection}
        value={value ? [value] : []}
        disabled={disabled}
        onValueChange={({ value }) => onChange(value[0] as T)}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder={placeholder} />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {collection.items.map((option) => (
                <Select.Item item={option} key={option.value}>
                  {option.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
    </Field>
  );
}

export const UpsertReportSchedule = createOverlay<UpsertProps>(
  ({ action, item, usedIntervals, ...rest }) => {
    const [isPending, startTransition] = useTransition();

    // Same key as the SearchableSelect below, so the list is fetched once.
    const { data: members = [] } = useSWRImmutable('recipients', () =>
      getReportRecipients(),
    );

    // Editing keeps its own interval available; adding omits used intervals.
    const intervalCollection = useMemo(
      () =>
        createListCollection({
          items: SCHEDULED_INTERVAL_SELECTION.filter(
            ({ value }) =>
              value === item.interval || !usedIntervals.includes(value),
          ),
        }),
      [item.interval, usedIntervals],
    );

    const [interval, setInterval] = useState<ScheduledInterval | undefined>(
      (item.interval as ScheduledInterval | undefined) ??
        intervalCollection.items[0]?.value,
    );
    const [recipients, setRecipients] = useState<Array<string>>(
      item.recipients ?? [],
    );

    // Map the selected emails back to their member objects for display.
    const selectedMembers = useMemo(
      () => members.filter((member) => recipients.includes(member.email)),
      [members, recipients],
    );

    const removeRecipient = (email: string) =>
      setRecipients((prev) => prev.filter((value) => value !== email));

    const parsed = useMemo(
      () => UpsertReportScheduleSchema.safeParse({ interval, recipients }),
      [interval, recipients],
    );

    const onSubmit = () => {
      if (!parsed.success) return;

      const id = toaster.create({
        type: 'loading',
        title: 'Saving report schedule...',
      });

      startTransition(async () => {
        const { success, message } = await upsertReportSchedule(
          item.schedule_id,
          parsed.data,
        );

        toaster.update(id, {
          type: success ? 'success' : 'error',
          title: message,
        });

        if (success) {
          UpsertReportSchedule.close(UPSERT_SCHEDULE_ID);
        }
      });
    };

    return (
      <Dialog.Root size={{ base: 'xs', md: 'md' }} {...rest}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.CloseTrigger asChild>
                <CloseButton />
              </Dialog.CloseTrigger>
              <Dialog.Header>
                <Dialog.Title>{action} Report Schedule</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <VStack alignItems="stretch" gap={4}>
                  <SelectField
                    label="Report"
                    collection={intervalCollection}
                    value={interval}
                    placeholder="Select a report"
                    disabled={isPending}
                    onChange={setInterval}
                  />

                  <Text fontSize={13} color="gray.500">
                    Reports are emailed once the period has closed, in the
                    morning (around 8:00 AM).
                  </Text>

                  <Field
                    required
                    label={members.length === 0 ? 'Recipients' : ''}
                    invalid={!parsed.success && recipients.length === 0}
                    errorText="Add at least one recipient."
                  >
                    {members.length === 0 ? (
                      <Text fontSize={13} color="gray.500">
                        No team members available to select.
                      </Text>
                    ) : (
                      <VStack alignItems="stretch" gap={3} width="full">
                        <SearchableSelect
                          multiple
                          label="recipients"
                          value={selectedMembers}
                          action={getReportRecipients}
                          itemToValue={({ email }) => email}
                          itemToString={({ name }) => name}
                          onChange={(items) =>
                            setRecipients(items.map(({ email }) => email))
                          }
                          renderItem={({ name, email }) => (
                            <HStack>
                              {name}{' '}
                              <Span fontSize="sm" color="GrayText">
                                &lt;{email}&gt;
                              </Span>
                            </HStack>
                          )}
                        />

                        {selectedMembers.length > 0 && (
                          <List.Root overflowY="auto" as="ol">
                            {selectedMembers.map((member) => (
                              <List.Item
                                key={member.id}
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                              >
                                <Span fontSize="sm">
                                  {member.name}{' '}
                                  <Span color="GrayText">
                                    &lt;{member.email}&gt;
                                  </Span>
                                </Span>
                                <IconButton
                                  size="2xs"
                                  variant="ghost"
                                  colorPalette="red"
                                  aria-label={`Remove ${member.name}`}
                                  disabled={isPending}
                                  onClick={() => removeRecipient(member.email)}
                                >
                                  <X />
                                </IconButton>
                              </List.Item>
                            ))}
                          </List.Root>
                        )}
                      </VStack>
                    )}
                  </Field>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  loadingText="Saving..."
                  loading={isPending}
                  disabled={!parsed.success}
                  onClick={onSubmit}
                >
                  <Save /> {action}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    );
  },
);
