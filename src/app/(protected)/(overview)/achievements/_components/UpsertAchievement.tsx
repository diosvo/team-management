'use client';

import { useEffect, useTransition } from 'react';
import useSWRImmutable from 'swr/immutable';

import {
  Button,
  Dialog,
  Input,
  Portal,
  Select,
  Span,
  Textarea,
  VStack,
  Wrap,
  createListCollection,
  createOverlay,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { getYear, isPast } from 'date-fns';
import { Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';

import { SearchableSelectField } from '@/components/SearchableSelect';
import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';
import Visibility from '@/components/Visibility';

import { useSelection } from '@/i18n/enums';
import { getDefaults } from '@/lib/zod';
import {
  ACHIEVEMENT_TYPE_SELECTION,
  CACHE_KEY,
  INDIVIDUAL_ACHIEVEMENT_TYPES,
  YEARS_SELECTION,
} from '@/utils/constants';
import { AchievementType } from '@/utils/enum';

import {
  UpsertAchievementSchema,
  type UpsertAchievementSchemaValues,
} from '@/schemas/achievement';

import {
  getPlayerLeagueStatSuggestions,
  upsertAchievement,
} from '@/actions/achievement';
import { getLeagues } from '@/actions/league';
import { getActivePlayers } from '@/actions/user';

const ENDED_LEAGUES_KEY = 'ended_leagues';

// Only ended leagues can carry an achievement
const getEndedLeagues = async () =>
  (await getLeagues()).filter(({ end_date }) => isPast(end_date));

const years = createListCollection({
  items: YEARS_SELECTION,
});

const isIndividualType = (type: AchievementType) =>
  INDIVIDUAL_ACHIEVEMENT_TYPES.includes(
    type as (typeof INDIVIDUAL_ACHIEVEMENT_TYPES)[number],
  );

export const UpsertAchievement = createOverlay(({ action, item, ...rest }) => {
  const t = useTranslations('achievements.upsert');
  const tCommon = useTranslations('common');
  const typeSelection = useSelection(
    ACHIEVEMENT_TYPE_SELECTION,
    'achievementType',
  );
  const types = createListCollection({ items: typeSelection });
  const [isPending, startTransition] = useTransition();

  const {
    control,
    watch,
    reset,
    register,
    setValue,
    handleSubmit,
    formState: { isValid, errors, dirtyFields },
  } = useForm({
    resolver: zodResolver(UpsertAchievementSchema),
    // Title starts from the default type's label until the user edits it.
    defaultValues: getDefaults(UpsertAchievementSchema, {
      title: typeSelection[0].label,
      ...item,
    }),
  });

  const type = watch('type');
  const league_id = watch('league_id');
  const isIndividual = isIndividualType(type as AchievementType);

  const { data: endedLeagues } = useSWRImmutable(
    ENDED_LEAGUES_KEY,
    getEndedLeagues,
  );

  // The year is defined by the league it belongs to.
  useEffect(() => {
    const league = endedLeagues?.find((l) => l.league_id === league_id);
    if (league) setValue('year', getYear(league.end_date));
  }, [league_id, endedLeagues, setValue]);

  const { data: suggestions = [] } = useSWRImmutable(
    isIndividual && league_id ? `achievement-suggestions-${league_id}` : null,
    () => getPlayerLeagueStatSuggestions(league_id!),
  );

  const onSubmit = (data: UpsertAchievementSchemaValues) => {
    const id = toaster.create({
      type: 'loading',
      title: t('saving'),
    });

    startTransition(async () => {
      const { success, message: title } = await upsertAchievement(
        item.achievement_id,
        {
          ...data,
          player_id: isIndividualType(data.type as AchievementType)
            ? data.player_id
            : null,
        },
      );

      toaster.update(id, {
        type: success ? 'success' : 'error',
        title,
      });

      if (success) reset();
      if (action === 'Update') UpsertAchievement.close('update-achievement');
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
              <Dialog.Title>
                {action === 'Update' ? t('updateTitle') : t('addTitle')}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack alignItems="stretch" gap={4}>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Field
                      required
                      label={t('type')}
                      invalid={!!errors.type}
                      errorText={errors.type?.message}
                    >
                      <Select.Root
                        collection={types}
                        disabled={isPending}
                        value={field.value ? [field.value] : []}
                        onInteractOutside={field.onBlur}
                        onValueChange={({ value }) => {
                          field.onChange(value[0]);
                          // The type drives the default title until edited.
                          // value[0] always comes from the same typeSelection collection,
                          // so find() always returns a result — the non-null assertion is safe.
                          if (!dirtyFields.title) {
                            setValue(
                              'title',
                              typeSelection.find(
                                (option) => option.value === value[0],
                              )!.label,
                            );
                          }
                        }}
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder={t('type')} />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                          <Select.Positioner>
                            <Select.Content>
                              {types.items.map((option) => (
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
                  )}
                />
                <Field
                  required
                  label={t('title')}
                  invalid={!!errors.title}
                  errorText={errors.title?.message}
                >
                  <Input
                    placeholder={t('titlePlaceholder')}
                    disabled={isPending}
                    {...register('title')}
                  />
                </Field>
                <SearchableSelectField
                  multiple={false}
                  control={control}
                  name="league_id"
                  label={ENDED_LEAGUES_KEY}
                  action={getEndedLeagues}
                  fieldProps={{
                    disabled: isPending,
                    helperText: t('leagueHelper'),
                  }}
                  itemToString={({ name }) => name}
                  itemToValue={({ league_id }) => league_id}
                />
                <Controller
                  name="year"
                  control={control}
                  render={({ field }) => (
                    <Field
                      required
                      label={t('year')}
                      invalid={!!errors.year}
                      errorText={errors.year?.message}
                      helperText={league_id ? t('yearHelper') : ''}
                    >
                      <Select.Root
                        collection={years}
                        disabled={isPending || !!league_id}
                        value={field.value ? [String(field.value)] : []}
                        onInteractOutside={field.onBlur}
                        onValueChange={({ value }) =>
                          field.onChange(Number(value[0]))
                        }
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder={t('year')} />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                          <Select.Positioner>
                            <Select.Content>
                              {years.items.map((option) => (
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
                  )}
                />
                <Visibility isVisible={isIndividual}>
                  <SearchableSelectField
                    multiple={false}
                    control={control}
                    name="player_id"
                    label={CACHE_KEY.PLAYERS}
                    action={getActivePlayers}
                    fieldProps={{
                      required: isIndividual,
                      disabled: isPending,
                    }}
                    itemToString={({ name }) => name}
                    itemToValue={({ id }) => id}
                  />
                  {suggestions.length > 0 && (
                    <Wrap gap={2} marginTop={2}>
                      <Span fontSize="xs" color="gray.500" alignSelf="center">
                        {t('suggested')}
                      </Span>
                      {suggestions.map((suggestion) => (
                        <Button
                          key={suggestion.player_id}
                          size="2xs"
                          variant="outline"
                          borderRadius="full"
                          disabled={isPending}
                          onClick={() =>
                            setValue('player_id', suggestion.player_id, {
                              shouldValidate: true,
                            })
                          }
                        >
                          {suggestion.player_name} &mdash;{' '}
                          {t('ppg', { points: suggestion.avg_points })}
                        </Button>
                      ))}
                    </Wrap>
                  )}
                </Visibility>
                <Field label={t('description')}>
                  <Textarea
                    autoresize
                    maxLength={256}
                    placeholder={t('descriptionPlaceholder')}
                    disabled={isPending}
                    {...register('description')}
                  />
                </Field>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                type="submit"
                loadingText={t('savingButton')}
                loading={isPending}
                disabled={!isValid}
              >
                <Save />{' '}
                {action === 'Update' ? tCommon('update') : tCommon('add')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
});
