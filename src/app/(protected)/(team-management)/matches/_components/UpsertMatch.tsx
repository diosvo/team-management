'use client';

import { useRef, useState, useTransition } from 'react';

import {
  Badge,
  Button,
  Dialog,
  HStack,
  Input,
  NumberInputRoot,
  Portal,
  Text,
  VStack,
  createOverlay,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import SearchableSelect from '@/components/SearchableSelect';
import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { NumberInputField } from '@/components/ui/number-input';
import { Switch } from '@/components/ui/switch';
import { toaster } from '@/components/ui/toaster';
import Visibility from '@/components/Visibility';

import { CURRENT_DATE, ESTABLISHED_DATE } from '@/utils/constant';
import { formatDatetime } from '@/utils/formatter';
import { colorLeagueStatus } from '@/utils/helper';

import useQuery from '@/hooks/use-query';
import { getDefaults } from '@/lib/zod';
import { UpsertMatchSchema, UpsertMatchSchemaValues } from '@/schemas/match';

import { getLeagues } from '@/actions/league';
import { getLocations } from '@/actions/location';
import { upsertMatch } from '@/actions/match';
import { getOpponents } from '@/actions/team';

export const UpsertMatch = createOverlay(({ action, item, ...rest }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isLeague, setIsLeague] = useState<boolean>(
    action === 'Update' && !!item.league_id,
  );

  // Filter out ended leagues after data migration finished
  const leagues = useQuery(getLeagues);
  const opponents = useQuery(getOpponents);
  const locations = useQuery(getLocations);

  const {
    control,
    reset,
    register,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm({
    resolver: zodResolver(UpsertMatchSchema),
    defaultValues: getDefaults(UpsertMatchSchema, item),
  });

  const onSubmit = (data: UpsertMatchSchemaValues) => {
    const id = toaster.create({
      type: 'loading',
      title: 'Saving match information...',
    });

    startTransition(async () => {
      const { success, message: title } = await upsertMatch(item.match_id, {
        ...data,
        league_id: isLeague ? data.league_id : null,
      });
      toaster.update(id, {
        type: success ? 'success' : 'error',
        title,
      });

      if (success) reset();
      if (action === 'Update') UpsertMatch.close('update-match');
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
              <Dialog.Title>{action} result</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body ref={contentRef}>
              <VStack alignItems="stretch" gap={4}>
                <Controller
                  name="is_5x5"
                  control={control}
                  render={({ field }) => (
                    <Field
                      invalid={!!errors.is_5x5}
                      errorText={errors.is_5x5?.message}
                    >
                      <Switch
                        name={field.name}
                        checked={field.value}
                        onCheckedChange={({ checked }) =>
                          field.onChange(checked)
                        }
                      >
                        5x5
                      </Switch>
                    </Field>
                  )}
                />
                <Switch
                  name="is_league_match"
                  checked={isLeague}
                  colorPalette="red"
                  onCheckedChange={({ checked }) => setIsLeague(checked)}
                >
                  League Match
                </Switch>
                <Visibility isVisible={isLeague}>
                  <Controller
                    control={control}
                    name="league_id"
                    render={({ field }) => {
                      const selected = leagues.data?.find(
                        (league) => league.league_id === field.value,
                      );

                      return (
                        <SearchableSelect
                          multiple={false}
                          showHelperText={false}
                          label="league"
                          request={leagues}
                          contentRef={contentRef}
                          disabled={isPending}
                          invalid={!!errors.league_id}
                          selection={selected ? [selected] : []}
                          itemToString={({ name }) => name}
                          itemToValue={({ league_id }) => league_id}
                          renderItem={(item) => (
                            <HStack>
                              {item.name}
                              <Badge
                                size="xs"
                                variant="outline"
                                marginLeft="auto"
                                borderRadius="full"
                                colorPalette={colorLeagueStatus(item.status)}
                              >
                                {item.status}
                              </Badge>
                            </HStack>
                          )}
                          onSelectionChange={(items) => {
                            field.onChange(items[0]?.league_id || '');
                          }}
                        />
                      );
                    }}
                  />
                </Visibility>
                <Controller
                  control={control}
                  name="away_team"
                  render={({ field }) => {
                    const selected = opponents.data?.find(
                      (opponent) => opponent.team_id === field.value,
                    );

                    return (
                      <SearchableSelect
                        required
                        multiple={false}
                        showHelperText={false}
                        label="opponent"
                        request={opponents}
                        contentRef={contentRef}
                        disabled={isPending}
                        invalid={!!errors.away_team}
                        selection={selected ? [selected] : []}
                        itemToString={({ name }) => name}
                        itemToValue={({ team_id }) => team_id}
                        onSelectionChange={(items) => {
                          field.onChange(items[0]?.team_id || '');
                        }}
                      />
                    );
                  }}
                />
                <HStack>
                  <Field required label="Date" disabled={isPending}>
                    <Input
                      type="date"
                      min={ESTABLISHED_DATE}
                      defaultValue={CURRENT_DATE}
                      disabled={isPending}
                      {...register('date')}
                    />
                  </Field>
                  <Field required label="Time" disabled={isPending}>
                    <Input
                      type="time"
                      defaultValue="19:30"
                      disabled={isPending}
                      {...register('time')}
                    />
                  </Field>
                </HStack>
                <Controller
                  control={control}
                  name="location_id"
                  render={({ field }) => {
                    const selected = locations.data?.find(
                      (opponent) => opponent.location_id === field.value,
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
                        onSelectionChange={(items) => {
                          field.onChange(items[0]?.location_id || '');
                        }}
                      />
                    );
                  }}
                />
                <HStack alignItems="start">
                  <Field
                    label="Our Score"
                    invalid={!!errors.home_team_score}
                    errorText={errors.home_team_score?.message}
                  >
                    <Controller
                      name="home_team_score"
                      control={control}
                      render={({ field }) => (
                        <NumberInputRoot
                          width="full"
                          disabled={field.disabled}
                          name={field.name}
                          value={String(field.value)}
                          onValueChange={({ value }) => field.onChange(value)}
                        >
                          <NumberInputField onBlur={field.onBlur} />
                        </NumberInputRoot>
                      )}
                    />
                  </Field>
                  <Field
                    label="Thier Score"
                    invalid={!!errors.away_team_score}
                    errorText={errors.away_team_score?.message}
                  >
                    <Controller
                      name="away_team_score"
                      control={control}
                      render={({ field }) => (
                        <NumberInputRoot
                          width="full"
                          disabled={field.disabled}
                          name={field.name}
                          value={String(field.value)}
                          onValueChange={({ value }) => field.onChange(value)}
                        >
                          <NumberInputField onBlur={field.onBlur} />
                        </NumberInputRoot>
                      )}
                    />
                  </Field>
                </HStack>
              </VStack>
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
