'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import {
  Badge,
  Button,
  Dialog,
  HStack,
  Input,
  List,
  Portal,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, UserRoundPlus } from 'lucide-react';

import { visibleEmail } from '@/utils/email';
import { normalizeName } from '@/utils/formatter';
import { getColor } from '@/utils/helper';

import { getDefaults } from '@/lib/zod';

import { createAccount } from '@/actions/account';
import { DatePickerField } from '@/components/date-picker/DatePicker';
import { Alert } from '@/components/ui/alert';
import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';
import { RolePositionSelection } from '@/components/user/RolePositionSelection';
import { ControlledStateSelection } from '@/components/user/StateSelection';
import type { Account } from '@/db/account';
import { AddUserSchema, type AddUserValues } from '@/schemas/user';

import { UpdateAccount } from './UpdateAccount';

/**
 * Adds a member. Warns when the name matches someone already listed: inviting
 * them means adding an email to that row, or their history ends up split
 * across two members.
 */
export default function AddUser({ members }: { members: Array<Account> }) {
  const t = useTranslations('accounts.addUser');
  const tAccounts = useTranslations('accounts');
  const tCommon = useTranslations('common');
  const contentRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
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

  const name = useWatch({ control, name: 'name' });
  const duplicates = useMemo(() => {
    const wanted = normalizeName(name);
    if (!wanted) return [];
    return members.filter((member) => normalizeName(member.name) === wanted);
  }, [members, name]);

  const openExisting = (account: Account) => {
    setOpen(false);
    UpdateAccount.open('update-account', { account });
  };

  const onSubmit = (data: AddUserValues) => {
    const id = toaster.create({
      type: 'loading',
      title: t('adding'),
    });

    startTransition(async () => {
      const { success, message: title } = await createAccount(data);

      toaster.update(id, {
        type: success ? 'success' : 'error',
        title,
      });

      if (success) reset();
    });
  };

  return (
    <Dialog.Root
      size="lg"
      lazyMount
      unmountOnExit
      open={open}
      onOpenChange={(details) => setOpen(details.open)}
    >
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
                  label={t('email')}
                  helperText={t('emailHelper')}
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
              {duplicates.length > 0 && (
                <Alert
                  status="warning"
                  marginTop={4}
                  title={t('duplicateTitle', { count: duplicates.length })}
                >
                  <Text>{t('duplicateHint')}</Text>
                  <List.Root variant="plain" gap={2} marginTop={2}>
                    {duplicates.map((account) => (
                      <List.Item key={account.id}>
                        <HStack width="full" flexWrap="wrap">
                          <Text fontWeight="medium">{account.name}</Text>
                          <Text color="fg.muted">
                            {visibleEmail(account.email) ?? tCommon('noEmail')}
                          </Text>
                          <Badge
                            variant="surface"
                            borderRadius="full"
                            colorPalette={getColor(account.status)}
                          >
                            {tAccounts(`status.${account.status}`)}
                          </Badge>
                          <Button
                            size="xs"
                            variant="outline"
                            marginInlineStart="auto"
                            onClick={() => openExisting(account)}
                          >
                            {t('openExisting')}
                          </Button>
                        </HStack>
                      </List.Item>
                    ))}
                  </List.Root>
                </Alert>
              )}
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
