'use client';

import { useEffect, useState, useTransition } from 'react';
import { useSWRConfig } from 'swr';
import useSWRImmutable from 'swr/immutable';

import {
  Badge,
  Button,
  Dialog,
  Flex,
  Input,
  Portal,
  Stack,
  Textarea,
  VStack,
  createOverlay,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { DatePickerField } from '@/components/date-picker/DatePicker';
import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';
import {
  PlayerSelection,
  SelectedPlayers,
} from '@/components/user/PlayerSelection';
import Visibility from '@/components/Visibility';

import { getDefaults } from '@/lib/zod';
import { CACHE_KEY, ESTABLISHED_DATE } from '@/utils/constants';
import { LeagueStatus } from '@/utils/enum';

import type { User } from '@/drizzle/schema';
import {
  UpsertLeagueSchema,
  type UpsertLeagueSchemaValues,
} from '@/schemas/league';

import { getPlayersInLeague, upsertLeague } from '@/actions/league';

export const UpsertLeague = createOverlay(({ action, item, ...rest }) => {
  const t = useTranslations('leagues.upsert');
  const tCommon = useTranslations('common');
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
    control,
    register,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm({
    resolver: zodResolver(UpsertLeagueSchema),
    defaultValues: getDefaults(UpsertLeagueSchema, item),
  });

  const isReadonly =
    action === 'Update' && item.status !== LeagueStatus.UPCOMING;

  const disabledField = isPending || isReadonly;

  const onSubmit = (data: UpsertLeagueSchemaValues) => {
    const id = toaster.create({
      type: 'loading',
      title: t('savingToast'),
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
          t('saved')
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
                  {action === 'Add' ? t('addTitle') : t('updateTitle')}
                  {isReadonly && (
                    <Badge
                      variant="surface"
                      borderRadius="full"
                      colorPalette="red"
                    >
                      {t('readonly')}
                    </Badge>
                  )}
                </Flex>
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack alignItems="stretch" gap={4}>
                <Field
                  required
                  label={t('name')}
                  disabled={isReadonly}
                  invalid={!!errors.name}
                  errorText={errors.name?.message}
                >
                  <Input
                    placeholder={t('namePlaceholder')}
                    disabled={isPending || isReadonly}
                    {...register('name')}
                  />
                </Field>
                <Stack
                  direction={{ base: 'column', sm: 'row' }}
                  alignItems={{ base: 'stretch', sm: 'start' }}
                  gap={4}
                >
                  <Field
                    required
                    label={t('startDate')}
                    disabled={isReadonly}
                    invalid={!!errors.start_date}
                    errorText={errors.start_date?.message}
                  >
                    <DatePickerField
                      control={control}
                      name="start_date"
                      min={ESTABLISHED_DATE}
                      disabled={disabledField}
                    />
                  </Field>
                  <Field
                    required
                    label={t('endDate')}
                    disabled={isReadonly}
                    invalid={!!errors.end_date}
                    errorText={errors.end_date?.message}
                  >
                    <DatePickerField
                      control={control}
                      name="end_date"
                      min={ESTABLISHED_DATE}
                      disabled={disabledField}
                    />
                  </Field>
                </Stack>
                <Field label={t('description')} disabled={isReadonly}>
                  <Textarea
                    autoresize
                    maxLength={128}
                    placeholder={t('descriptionPlaceholder')}
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
                  disabled={isReadonly}
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
                  loadingText={t('saving')}
                  loading={isPending}
                  disabled={!isValid}
                >
                  <Save />{' '}
                  {action === 'Add' ? tCommon('add') : tCommon('update')}
                </Button>
              </Dialog.Footer>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
});
