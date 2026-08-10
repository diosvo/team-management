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
import { Controller, useForm } from 'react-hook-form';

import { SearchableSelectField } from '@/components/SearchableSelect';
import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';
import Visibility from '@/components/Visibility';

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

const types = createListCollection({ items: ACHIEVEMENT_TYPE_SELECTION });
const years = createListCollection({
  items: YEARS_SELECTION,
});

const isIndividualType = (type: AchievementType) =>
  INDIVIDUAL_ACHIEVEMENT_TYPES.includes(
    type as (typeof INDIVIDUAL_ACHIEVEMENT_TYPES)[number],
  );

export const UpsertAchievement = createOverlay(({ action, item, ...rest }) => {
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
      title: ACHIEVEMENT_TYPE_SELECTION[0].label,
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
      title: 'Saving achievement...',
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
              <Dialog.Title>{action} Achievement</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack alignItems="stretch" gap={4}>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Field
                      required
                      label="Type"
                      invalid={!!errors.type}
                      errorText={errors.type?.message}
                    >
                      <Select.Root
                        collection={types}
                        disabled={isPending}
                        value={field.value ? [field.value] : []}
                        onInteractOutside={() => field.onBlur()}
                        onValueChange={({ value }) => {
                          field.onChange(value[0]);
                          // The type drives the default title until edited.
                          if (!dirtyFields.title) {
                            const selected = ACHIEVEMENT_TYPE_SELECTION.find(
                              (option) => option.value === value[0],
                            );
                            if (selected) setValue('title', selected.label);
                          }
                        }}
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder="Type" />
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
                  label="Title"
                  invalid={!!errors.title}
                  errorText={errors.title?.message}
                >
                  <Input
                    placeholder="Champion"
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
                    helperText: 'Leave empty for a standalone honor.',
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
                      label="Year"
                      invalid={!!errors.year}
                      errorText={errors.year?.message}
                      helperText={
                        league_id ? 'Derived from the selected league.' : ''
                      }
                    >
                      <Select.Root
                        collection={years}
                        disabled={isPending || !!league_id}
                        value={field.value ? [String(field.value)] : []}
                        onInteractOutside={() => field.onBlur()}
                        onValueChange={({ value }) =>
                          field.onChange(Number(value[0]))
                        }
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder="Year" />
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
                        Suggested:
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
                          {suggestion.avg_points} ppg
                        </Button>
                      ))}
                    </Wrap>
                  )}
                </Visibility>
                <Field label="Description">
                  <Textarea
                    autoresize
                    maxLength={256}
                    placeholder="Comment..."
                    disabled={isPending}
                    {...register('description')}
                  />
                </Field>
              </VStack>
            </Dialog.Body>
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
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
});
