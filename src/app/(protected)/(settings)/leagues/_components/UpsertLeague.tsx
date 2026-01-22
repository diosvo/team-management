'use client';

import { useRef, useState, useTransition } from 'react';

import {
  Badge,
  Button,
  Dialog,
  Flex,
  HStack,
  Input,
  Portal,
  Textarea,
  VStack,
  createOverlay,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { isBefore } from 'date-fns';
import { Save } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';
import {
  PlayerSelection,
  SelectedPlayers,
} from '@/components/user/PlayerSelection';
import Visibility from '@/components/Visibility';

import { getDefaults } from '@/lib/zod';
import { ESTABLISHED_DATE } from '@/utils/constant';
import { LeagueStatus } from '@/utils/enum';

import { User } from '@/drizzle/schema';
import useQuery from '@/hooks/use-query';
import { UpsertLeagueSchema, UpsertLeagueSchemaValues } from '@/schemas/league';

import {
  getPlayersInLeague,
  upsertLeague,
  upsertPlayerToLeague,
} from '@/actions/league';

export const UpsertLeague = createOverlay(({ action, item, ...rest }) => {
  const [isPending, startTransition] = useTransition();

  const contentRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<Array<User>>([]);

  useQuery(async () => {
    if (action === 'Update' && item.league_id) {
      const users = await getPlayersInLeague(item.league_id);
      setSelection(users);
    }
  }, [action, item.league_id]);

  const {
    reset,
    register,
    handleSubmit,
    formState: { isValid, errors, defaultValues },
  } = useForm({
    resolver: zodResolver(UpsertLeagueSchema),
    defaultValues: getDefaults(UpsertLeagueSchema, item),
  });

  const isReadonly = defaultValues?.status !== LeagueStatus.UPCOMING;
  const disabledField = isPending || isReadonly;

  const onSubmit = (data: UpsertLeagueSchemaValues) => {
    if (isBefore(data.end_date, data.start_date)) {
      toaster.error({
        type: 'error',
        title: 'End date must be after start date.',
      });
      return;
    }

    const id = toaster.create({
      type: 'loading',
      title: 'Saving league information...',
    });

    startTransition(async () => {
      const { success } = await upsertLeague(item.league_id, data);

      const results = await Promise.all(
        selection.map(({ id }) => upsertPlayerToLeague(item.league_id, id)),
      );
      const errors = results.filter(({ success }) => !success);
      const hasErrors = errors.length > 0;

      if (success && !hasErrors) {
        toaster.update(id, {
          type: 'success',
          title: 'League information saved successfully.',
        });
        reset();
        setSelection([]);
      } else if (hasErrors) {
        toaster.update(id, {
          type: 'error',
          title: (
            <>
              {errors.map(({ message }, index) => (
                <p key={index}>{message}</p>
              ))}
            </>
          ),
        });
      }

      if (action === 'Update') UpsertLeague.close('update-league');
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
              <Dialog.Title asChild>
                <Flex alignItems="center" gap={2}>
                  {action} League
                  {isReadonly && (
                    <Badge
                      variant="surface"
                      borderRadius="full"
                      colorPalette="red"
                    >
                      Readonly
                    </Badge>
                  )}
                </Flex>
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body ref={contentRef}>
              <VStack alignItems="stretch" gap={3}>
                <Field
                  required
                  label="Name"
                  disabled={isReadonly}
                  invalid={!!errors.name}
                  errorText={errors.name?.message}
                >
                  <Input
                    placeholder="Basketball League"
                    disabled={isPending || isReadonly}
                    {...register('name')}
                  />
                </Field>
                <HStack>
                  <Field required label="Start Date" disabled={isReadonly}>
                    <Input
                      type="date"
                      min={ESTABLISHED_DATE}
                      disabled={disabledField}
                      {...register('start_date')}
                    />
                  </Field>
                  <Field required label="End Date" disabled={isReadonly}>
                    <Input
                      type="date"
                      min={ESTABLISHED_DATE}
                      disabled={disabledField}
                      {...register('end_date')}
                    />
                  </Field>
                </HStack>
                <Field label="Description" disabled={isReadonly}>
                  <Textarea
                    autoresize
                    maxLength={128}
                    placeholder="Comment..."
                    disabled={disabledField}
                    {...register('description')}
                  />
                </Field>
                <Visibility isVisible={!isReadonly}>
                  <PlayerSelection
                    contentRef={contentRef}
                    selection={selection}
                    onSelectionChange={setSelection}
                  />
                </Visibility>
                <SelectedPlayers
                  selection={selection}
                  onSelectionChange={setSelection}
                  borderWidth={1}
                  borderRadius="sm"
                  borderStyle="dashed"
                />
              </VStack>
            </Dialog.Body>
            {!isReadonly && (
              <Dialog.Footer>
                <Button
                  type="submit"
                  loadingText="Saving..."
                  loading={isPending}
                  disabled={!isValid}
                >
                  <Save /> {action}
                </Button>
              </Dialog.Footer>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
});
