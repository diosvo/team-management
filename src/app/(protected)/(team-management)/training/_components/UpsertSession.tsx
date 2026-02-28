'use client';

import { useRef, useTransition } from 'react';

import {
  Button,
  CloseButton,
  createOverlay,
  Dialog,
  Input,
  Portal,
  SimpleGrid,
  Span,
  Stack,
  Text,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import SearchableSelect from '@/components/SearchableSelect';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';

import useQuery from '@/hooks/use-query';
import { getDefaults } from '@/lib/zod';
import { ESTABLISHED_DATE } from '@/utils/constant';
import { formatDatetime } from '@/utils/formatter';

import { getLocations } from '@/actions/location';
import { createTrainingSession } from '@/actions/training-session';
import {
  UpsertSessionSchema,
  UpsertSessionSchemaValues,
} from '@/schemas/training';

export const UpsertSession = createOverlay(({ action, item, ...rest }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  const locations = useQuery(getLocations);

  const {
    control,
    reset,
    register,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm({
    resolver: zodResolver(UpsertSessionSchema),
    defaultValues: getDefaults(UpsertSessionSchema, item),
  });

  const onSubmit = (data: UpsertSessionSchemaValues) => {
    const id = toaster.create({
      type: 'loading',
      title: 'Creating training session...',
    });

    startTransition(async () => {
      const { success, message } = await createTrainingSession(data);

      toaster.update(id, {
        type: success ? 'success' : 'error',
        title: message,
      });

      if (success) reset();
      if (action === 'Update') UpsertSession.close('update-session');
    });
  };

  return (
    <Dialog.Root {...rest}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner as="form" onSubmit={handleSubmit(onSubmit)}>
          <Dialog.Content>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Header>
              <Dialog.Title>{action} Session</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body ref={contentRef}>
              <SimpleGrid columns={2} gap={3} mb={4}>
                <Field
                  required
                  label="Date"
                  invalid={!!errors.date}
                  errorText={errors.date?.message}
                >
                  <Input
                    type="date"
                    min={ESTABLISHED_DATE}
                    {...register('date')}
                  />
                </Field>
                <Field disabled readOnly label="Day">
                  <Input variant="flushed" value="Thursday" />
                </Field>
                <Field
                  required
                  label="Start Time"
                  invalid={!!errors.start_time}
                  errorText={errors.start_time?.message}
                >
                  <Input type="time" {...register('start_time')} />
                </Field>
                <Field
                  required
                  label="End Time"
                  invalid={!!errors.end_time}
                  errorText={errors.end_time?.message}
                >
                  <Input type="time" {...register('end_time')} />
                </Field>
              </SimpleGrid>
              <Controller
                control={control}
                name="location_id"
                render={({ field }) => {
                  const selected = locations.data?.find(
                    (location) => location.location_id === field.value,
                  );

                  return (
                    <SearchableSelect
                      multiple={false}
                      showHelperText={false}
                      label="location"
                      request={locations}
                      contentRef={contentRef}
                      disabled={isPending}
                      invalid={!!errors.location_id}
                      selection={selected ? [selected] : []}
                      itemToString={({ name }) => name}
                      itemToValue={({ location_id }) => location_id}
                      renderItem={(item) => (
                        <Stack>
                          {item.name}
                          <Span color="fg.muted" fontSize="xs">
                            {item.address}
                          </Span>
                        </Stack>
                      )}
                      onSelectionChange={(items) =>
                        field.onChange(items[0]?.location_id)
                      }
                    />
                  );
                }}
              />
            </Dialog.Body>
            <Dialog.Footer justifyContent="space-between">
              <Text fontSize="xs" color="GrayText">
                {item.updated_at &&
                  `Last updated on ${formatDatetime(item.updated_at)}`}
              </Text>
              <Button
                type="submit"
                loadingText="Saving..."
                loading={isPending}
                disabled={!isValid}
              >
                <Save /> {action}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
});
