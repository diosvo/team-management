'use client';

import { useMemo, useRef, useTransition } from 'react';

import {
  Button,
  createListCollection,
  Dialog,
  Grid,
  Input,
  Portal,
  Select,
  Span,
  Stack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, UserRoundPlus } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';

import {
  CoachPositionsSelection,
  DEFAULT_DOB,
  PlayerPositionsSelection,
  RoleSelection,
  StateSelection,
} from '@/utils/constant';
import { UserRole, UserState } from '@/utils/enum';
import { colorState } from '@/utils/helper';

import { Status } from '@/components/ui/status';
import { addUser } from '@/features/user/actions/user';
import { AddUserSchema, AddUserValues } from '@/features/user/schemas/user';

export default function AddUser() {
  const [isPending, startTransition] = useTransition();
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    reset,
    watch,
    control,
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(AddUserSchema),
    values: {
      name: '',
      email: '',
      dob: DEFAULT_DOB,
      state: UserState.UNKNOWN,
      role: UserRole.GUEST,
      position: null,
    },
  });

  const selectedRole = watch('role');

  const positions = useMemo(() => {
    const mapped = {
      [UserRole.COACH]: CoachPositionsSelection,
      [UserRole.PLAYER]: PlayerPositionsSelection,
      [UserRole.GUEST]: [],
    };
    return createListCollection({
      items: selectedRole ? mapped[selectedRole] : [],
    });
  }, [selectedRole]);

  const onSubmit = (data: AddUserValues) => {
    const id = toaster.create({
      type: 'loading',
      description: 'Adding user to database...',
    });

    startTransition(async () => {
      const { error, message: description } = await addUser(data);

      toaster.update(id, {
        type: error ? 'error' : 'success',
        description,
      });

      if (!error) reset();
    });
  };

  return (
    <Dialog.Root size="lg" lazyMount unmountOnExit>
      <Dialog.Trigger asChild>
        <Button size={{ base: 'sm', md: 'md' }}>
          <UserRoundPlus />
          Add
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner as="form" onSubmit={handleSubmit(onSubmit)}>
          <Dialog.Content ref={contentRef}>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Header>
              <Dialog.Title>Add to Roster</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Grid
                templateColumns={{
                  base: '1fr',
                  md: 'repeat(3, 1fr)',
                }}
                gap={4}
              >
                <Field
                  required
                  label="Fullname"
                  invalid={!!errors.name}
                  errorText={errors.name?.message}
                >
                  <Input {...register('name')} disabled={isPending} />
                </Field>
                <Field
                  required
                  label="Email"
                  invalid={!!errors.email}
                  errorText={errors.email?.message}
                >
                  <Input
                    type="email"
                    placeholder="abc@gmail.com"
                    disabled={isPending}
                    {...register('email')}
                  />
                </Field>
                <Field label="DOB">
                  <Input
                    type="date"
                    min="1997-01-01"
                    disabled={isPending}
                    {...register('dob')}
                  />
                </Field>

                <Field required label="State">
                  <Controller
                    control={control}
                    name="state"
                    render={({ field }) => (
                      <Select.Root
                        name={field.name}
                        value={
                          field.value ? [field.value] : [UserState.UNKNOWN]
                        }
                        onValueChange={({ value }) => field.onChange(value[0])}
                        onInteractOutside={() => field.onBlur()}
                        collection={createListCollection({
                          items: StateSelection,
                        })}
                        disabled={isPending}
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder="State" />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal container={contentRef}>
                          <Select.Positioner>
                            <Select.Content>
                              {StateSelection.map((state) => (
                                <Select.Item item={state} key={state.value}>
                                  <Status
                                    colorPalette={colorState(state.value)}
                                  >
                                    {state.label}
                                  </Status>
                                  <Select.ItemIndicator />
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    )}
                  />
                </Field>
                <Field required label="Role">
                  <Controller
                    control={control}
                    name="role"
                    render={({ field }) => (
                      <Select.Root
                        name={field.name}
                        value={field.value ? [field.value] : [UserRole.GUEST]}
                        onValueChange={({ value }) => {
                          setValue('position', null);
                          field.onChange(value[0]);
                        }}
                        onInteractOutside={() => field.onBlur()}
                        collection={createListCollection({
                          items: RoleSelection,
                        })}
                        disabled={isPending}
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder="Role" />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal container={contentRef}>
                          <Select.Positioner>
                            <Select.Content>
                              {RoleSelection.map((role) => (
                                <Select.Item item={role} key={role.value}>
                                  {role.label}
                                  <Select.ItemIndicator />
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    )}
                  />
                </Field>

                <Field
                  label="Position"
                  disabled={isPending || selectedRole === UserRole.GUEST}
                >
                  <Controller
                    control={control}
                    name="position"
                    render={({ field }) => (
                      <Select.Root
                        name={field.name}
                        value={field.value ? [field.value] : ['UNKNOWN']}
                        onValueChange={({ value }) => field.onChange(value[0])}
                        onInteractOutside={() => field.onBlur()}
                        collection={positions}
                        disabled={isPending || selectedRole === UserRole.GUEST}
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder="Position" />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal container={contentRef}>
                          <Select.Positioner>
                            <Select.Content>
                              {positions.items.map((position) => (
                                <Select.Item
                                  item={position}
                                  key={position.value}
                                >
                                  <Stack gap={0}>
                                    <Select.ItemText>
                                      {position.label}
                                    </Select.ItemText>
                                    <Span color="fg.muted" textStyle="xs">
                                      {position.description}
                                    </Span>
                                  </Stack>
                                  <Select.ItemIndicator />
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    )}
                  />
                </Field>
              </Grid>
            </Dialog.Body>
            <Dialog.Footer>
              <Button type="submit" loading={isPending} loadingText="Adding...">
                <Plus /> Add
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
