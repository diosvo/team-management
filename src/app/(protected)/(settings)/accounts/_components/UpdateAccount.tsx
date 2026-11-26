'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import {
  Button,
  createOverlay,
  Dialog,
  Input,
  Portal,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';

import { visibleEmail } from '@/utils/email';
import { AccountStatus } from '@/utils/enum';

import { getDefaults } from '@/lib/zod';

import { updateAccount } from '@/actions/account';
import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';
import type { Account } from '@/db/account';
import {
  UpdateAccountSchema,
  type UpdateAccountValues,
} from '@/schemas/account';

/** Corrects a member's name or sign-in email. */
export const UpdateAccount = createOverlay<{ account: Account }>(
  ({ account, ...rest }) => {
    const t = useTranslations('accounts.update');
    const tCommon = useTranslations('common');
    const [isPending, startTransition] = useTransition();

    const {
      register,
      handleSubmit,
      formState: { isValid, isDirty, errors },
    } = useForm({
      mode: 'onChange',
      resolver: zodResolver(UpdateAccountSchema),
      defaultValues: getDefaults(UpdateAccountSchema, {
        ...account,
        email: visibleEmail(account.email) ?? '',
      }),
    });

    // Until a password is set, saving a new email sends the invite link
    const invites = account.status !== AccountStatus.ACTIVATED;

    const onSubmit = (data: UpdateAccountValues) => {
      const id = toaster.create({ type: 'loading', title: t('savingToast') });

      startTransition(async () => {
        const { success, message: title } = await updateAccount(
          account.id,
          data,
        );

        toaster.update(id, { type: success ? 'success' : 'error', title });

        if (success) UpdateAccount.close('update-account');
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
                <Dialog.Title>{t('title')}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <VStack alignItems="stretch" gap={4}>
                  <Field
                    required
                    label={t('name')}
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
                    required={account.status !== AccountStatus.NO_EMAIL}
                    label={t('email')}
                    helperText={invites ? t('emailInviteHint') : t('emailHint')}
                    invalid={!!errors.email}
                    errorText={errors.email?.message}
                  >
                    <Input
                      type="email"
                      autoComplete="email"
                      disabled={isPending}
                      {...register('email')}
                    />
                  </Field>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  type="submit"
                  loadingText={t('saving')}
                  loading={isPending}
                  disabled={!isValid || !isDirty || isPending}
                >
                  <Save /> {tCommon('update')}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    );
  },
);
