'use client';

import { useRef, useTransition } from 'react';

import { Button, Dialog, Input, Portal, SimpleGrid } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Plus, UserRoundPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { DatePickerField } from '@/components/date-picker/DatePicker';
import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';
import { RolePositionSelection } from '@/components/user/RolePositionSelection';
import { ControlledStateSelection } from '@/components/user/StateSelection';

import { addUser } from '@/actions/user';
import { getDefaults } from '@/lib/zod';
import { AddUserSchema, type AddUserValues } from '@/schemas/user';

export default function AddUser() {
  const t = useTranslations('roster.addUser');
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  const {
    control,
    reset,
    register,
    setValue,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm({
    mode: 'onChange',
    resolver: zodResolver(AddUserSchema),
    defaultValues: getDefaults(AddUserSchema),
  });

  const onSubmit = (data: AddUserValues) => {
    const id = toaster.create({
      type: 'loading',
      title: t('adding'),
    });

    startTransition(async () => {
      const { success, message: title } = await addUser(data);

      toaster.update(id, {
        type: success ? 'success' : 'error',
        title,
      });

      if (success) reset();
    });
  };

  return (
    <Dialog.Root size="lg" lazyMount unmountOnExit>
      <Dialog.Trigger asChild>
        <Button>
          <UserRoundPlus />
          {t('trigger')}
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
              <Dialog.Title>{t('title')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Field
                  required
                  label={t('fullname')}
                  invalid={!!errors.name}
                  errorText={errors.name?.message}
                >
                  <Input
                    autoComplete="name"
                    disabled={isPending}
                    {...register('name')}
                  />
                </Field>
                <Field
                  required
                  label={t('email')}
                  invalid={!!errors.email}
                  errorText={errors.email?.message}
                >
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="abc@gmail.com"
                    disabled={isPending}
                    {...register('email')}
                  />
                </Field>
                <Field label={t('dob')}>
                  <DatePickerField
                    control={control}
                    name="dob"
                    min="1997-01-01"
                    presets={false}
                    disabled={isPending}
                  />
                </Field>
              </SimpleGrid>
              <SimpleGrid
                columns={{ base: 1, md: 2 }}
                templateColumns={{ md: '3fr 6.25fr' }}
                gap={4}
                marginTop={4}
              >
                <ControlledStateSelection
                  name="state"
                  control={control}
                  disabled={isPending}
                  contentRef={contentRef}
                />
                <RolePositionSelection
                  roleName="role"
                  positionName="position"
                  control={control}
                  disabled={isPending}
                  contentRef={contentRef}
                  setValue={setValue}
                />
              </SimpleGrid>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                type="submit"
                loadingText={t('submitting')}
                loading={isPending}
                disabled={!isValid || isPending}
              >
                <Plus /> {t('submit')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
