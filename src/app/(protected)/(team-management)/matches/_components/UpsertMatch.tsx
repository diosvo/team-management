'use client';

import { useState, useTransition } from 'react';

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

import LocationSelection from '@/components/common/LocationSelection';
import SearchableSelect from '@/components/SearchableSelect';
import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { NumberInputField } from '@/components/ui/number-input';
import { Switch } from '@/components/ui/switch';
import { toaster } from '@/components/ui/toaster';

import { CACHE_KEY, CURRENT_DATE, ESTABLISHED_DATE } from '@/utils/constant';
import { formatDatetime } from '@/utils/formatter';
import { colorLeagueStatus } from '@/utils/helper';

import { getDefaults } from '@/lib/zod';
import { UpsertMatchSchema, UpsertMatchSchemaValues } from '@/schemas/match';

import { getLeagues } from '@/actions/league';
import { upsertMatch } from '@/actions/match';
import { getOpponents } from '@/actions/team';
import Authorized from '@/components/Authorized';
import Visibility from '@/components/Visibility';

export const UpsertMatch = createOverlay(({ action, item, ...rest }) => {
  const [isPending, startTransition] = useTransition();
  const [isLeague, setIsLeague] = useState<boolean>(!!item.league_id);

  const {
    control,
    watch,
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
            <Dialog.Body>
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
                <Authorized action="edit">
                  <Visibility isVisible={isLeague}>
                    <SearchableSelect
                      controlledMode
                      multiple={false}
                      control={control}
                      name="league_id"
                      label={CACHE_KEY.LEAGUES}
                      action={getLeagues}
                      fieldProps={{
                        required: isLeague,
                        disabled: isPending,
                      }}
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
                    />
                  </Visibility>
                </Authorized>
                <SearchableSelect
                  controlledMode
                  multiple={false}
                  control={control}
                  name="away_team"
                  label={CACHE_KEY.OPPONENTS}
                  action={getOpponents}
                  fieldProps={{
                    required: true,
                    disabled: isPending,
                  }}
                  itemToString={({ name }) => name}
                  itemToValue={({ team_id }) => team_id}
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
                <LocationSelection control={control} isDisabled={isPending} />
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
