'use client';

import { usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  Button,
  Dialog,
  HStack,
  Input,
  Portal,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';

import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { Radio, RadioGroup } from '@/components/ui/radio';
import { Switch } from '@/components/ui/switch';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';

import { submitFeedback } from '@/actions/feedback';
import {
  FeedbackFormSchema,
  FeedbackFormSchemaValues,
} from '@/schemas/feedback';
import {
  FEEDBACK_DESCRIPTION_LIMIT,
  FEEDBACK_TITLE_LIMIT,
  FEEDBACK_TYPE_KEYS,
} from '@/utils/constants';

/**
 * Collects the gist of a report and files it as a GitHub issue with the app's
 * token, so reporters do not need a GitHub account.
 */
type FeedbackDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function FeedbackDialog({
  open,
  onOpenChange,
}: FeedbackDialogProps) {
  const pathname = usePathname();
  const t = useTranslations('shell.feedback');
  const tEnums = useTranslations('enums');

  const [sharePage, setSharePage] = useState(true);
  const [isPending, startTransition] = useTransition();

  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm<FeedbackFormSchemaValues>({
    resolver: zodResolver(FeedbackFormSchema),
    defaultValues: { type: 'bug', title: '', description: '' },
  });

  const page = sharePage ? pathname : undefined;

  const close = () => {
    onOpenChange(false);
    reset();
  };

  const onSend = (values: FeedbackFormSchemaValues) => {
    const id = toaster.create({ type: 'loading', title: t('sending') });

    startTransition(async () => {
      const { success, message: title } = await submitFeedback({
        ...values,
        page,
      });

      toaster.update(id, { type: success ? 'success' : 'error', title });

      if (success) close();
    });
  };

  return (
    <Dialog.Root
      lazyMount
      unmountOnExit
      open={open}
      size="lg"
      onOpenChange={({ open }) => onOpenChange(open)}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner as="form" onSubmit={handleSubmit(onSend)}>
          <Dialog.Content>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Header>
              <Dialog.Title>{t('title')}</Dialog.Title>
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
                      <RadioGroup
                        size="sm"
                        name={field.name}
                        value={field.value}
                        onValueChange={({ value }) => field.onChange(value)}
                      >
                        <HStack gap={4}>
                          {FEEDBACK_TYPE_KEYS.map((type) => (
                            <Tooltip
                              key={type}
                              content={tEnums(`feedbackTypeHint.${type}`)}
                            >
                              <Radio value={type} onBlur={field.onBlur}>
                                {tEnums(`feedbackType.${type}`)}
                              </Radio>
                            </Tooltip>
                          ))}
                        </HStack>
                      </RadioGroup>
                    </Field>
                  )}
                />

                <Field
                  required
                  label={t('titleLabel')}
                  invalid={!!errors.title}
                  errorText={errors.title?.message}
                >
                  <Input
                    autoFocus
                    maxLength={FEEDBACK_TITLE_LIMIT}
                    placeholder={t('titlePlaceholder')}
                    {...register('title')}
                  />
                </Field>

                <Field
                  required
                  label={t('description')}
                  helperText={t('descriptionHelper')}
                  invalid={!!errors.description}
                  errorText={errors.description?.message}
                >
                  <Textarea
                    autoresize
                    rows={5}
                    maxLength={FEEDBACK_DESCRIPTION_LIMIT}
                    placeholder={t('descriptionPlaceholder')}
                    {...register('description')}
                  />
                </Field>

                <Switch
                  size="sm"
                  checked={sharePage}
                  onCheckedChange={({ checked }) => setSharePage(checked)}
                >
                  {t('includePage', { pathname })}
                </Switch>

                <Text fontSize="sm" color="GrayText">
                  {t('filedForYou')}
                </Text>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button type="submit" loading={isPending} disabled={!isValid}>
                {t('send')} <Send />
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
