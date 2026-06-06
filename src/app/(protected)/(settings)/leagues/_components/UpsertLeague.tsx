'use client';

import { useEffect, useState, useTransition } from 'react';
import { useSWRConfig } from 'swr';
import useSWRImmutable from 'swr/immutable';

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
import { CACHE_KEY, ESTABLISHED_DATE } from '@/utils/constant';
import { LeagueStatus } from '@/utils/enum';

import { User } from '@/drizzle/schema';
import { UpsertLeagueSchema, UpsertLeagueSchemaValues } from '@/schemas/league';

import { getPlayersInLeague, upsertLeague } from '@/actions/league';

export const UpsertLeague = createOverlay(({ action, item, ...rest }) => {
  const { mutate } = useSWRConfig();
  const [isPending, startTransition] = useTransition();

  const [selection, setSelection] = useState<Array<User>>([]);

  const { data: playersInLeague } = useSWRImmutable(
    action === 'Update' && item.league_id
      ? CACHE_KEY.PLAYERS_IN_LEAGUE(item.league_id)
      : null,
    () => getPlayersInLeague(item.league_id),
  );

  useEffect(() => {
    if (playersInLeague) setSelection(playersInLeague);
  }, [playersInLeague]);

  const {
    reset,
    register,
    handleSubmit,
    formState: { isValid, errors, defaultValues },
  } = useForm({
    resolver: zodResolver(UpsertLeagueSchema),
    defaultValues: getDefaults(UpsertLeagueSchema, item),
  });

  const isReadonly =
    action === 'Update' && defaultValues?.status !== LeagueStatus.UPCOMING;

  const disabledField = isPending || isReadonly;

  const onSubmit = (data: UpsertLeagueSchemaValues) => {
    const id = toaster.create({
      type: 'loading',
      title: 'Saving league information...',
    });

    startTransition(async () => {
      const { success, message } = await upsertLeague(
        item.league_id,
        data,
        selection.map(({ id }) => id),
      );

      toaster.update(id, {
        type: success ? 'success' : 'error',
        title: success ? (
          'League information saved successfully.'
        ) : (
          <>
            {message.split('\n').map((msg, index) => (
              <p key={index}>{msg}</p>
            ))}
          </>
        ),
      });

      if (success) {
        reset();
        setSelection([]);
        mutate(CACHE_KEY.LEAGUES);

        if (item.league_id) {
          mutate(CACHE_KEY.PLAYERS_IN_LEAGUE(item.league_id));
        }
        if (action === 'Update') UpsertLeague.close('update-league');
      }
    });
  };

  return (
    <Dialog.Root size={{ base: 'xs', md: 'md' }} {...rest}>
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
            <Dialog.Body>
              <VStack alignItems="stretch" gap={4}>
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
                <HStack alignItems="start" gap={4}>
                  <Field
                    required
                    label="Start Date"
                    disabled={isReadonly}
                    invalid={!!errors.start_date}
                    errorText={errors.start_date?.message}
                  >
                    <Input
                      type="date"
                      min={ESTABLISHED_DATE}
                      disabled={disabledField}
                      {...register('start_date')}
                    />
                  </Field>
                  <Field
                    required
                    label="End Date"
                    disabled={isReadonly}
                    invalid={!!errors.end_date}
                    errorText={errors.end_date?.message}
                  >
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
