'use client';

import { usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  Button,
  Dialog,
  HStack,
  IconButton,
  Input,
  Portal,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Flag, Send } from 'lucide-react';
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
  FEEDBACK_TYPES,
  FEEDBACK_TYPE_KEYS,
} from '@/utils/constants';

const LABEL = 'Suggestions + feedback + ideas';

/**
 * Collects the gist of a report and files it as a GitHub issue with the app's
 * token, so reporters do not need a GitHub account.
 */
export default function FeedbackDialog() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
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
    setOpen(false);
    reset();
  };

  const onSend = (values: FeedbackFormSchemaValues) => {
    const id = toaster.create({ type: 'loading', title: 'Sending...' });

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
      onOpenChange={({ open }) => setOpen(open)}
    >
      <Tooltip content={LABEL}>
        <Dialog.Trigger asChild>
          <IconButton
            size="2xs"
            variant="ghost"
            colorPalette="green"
            aria-label={LABEL}
          >
            <Flag />
          </IconButton>
        </Dialog.Trigger>
      </Tooltip>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner as="form" onSubmit={handleSubmit(onSend)}>
          <Dialog.Content>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Header>
              <Dialog.Title>Share Feedback</Dialog.Title>
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
                              content={FEEDBACK_TYPES[type].description}
                            >
                              <Radio value={type} onBlur={field.onBlur}>
                                {FEEDBACK_TYPES[type].label}
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
                  label="Title"
                  invalid={!!errors.title}
                  errorText={errors.title?.message}
                >
                  <Input
                    autoFocus
                    maxLength={FEEDBACK_TITLE_LIMIT}
                    placeholder="Attendance export is missing last week"
                    {...register('title')}
                  />
                </Field>

                <Field
                  required
                  label="Description"
                  helperText="Markdown is supported."
                  invalid={!!errors.description}
                  errorText={errors.description?.message}
                >
                  <Textarea
                    autoresize
                    rows={5}
                    maxLength={FEEDBACK_DESCRIPTION_LIMIT}
                    placeholder="What happened, and what did you expect?"
                    {...register('description')}
                  />
                </Field>

                <Switch
                  size="sm"
                  checked={sharePage}
                  onCheckedChange={({ checked }) => setSharePage(checked)}
                >
                  Include the page I am on ({pathname})
                </Switch>

                <Text fontSize="sm" color="GrayText">
                  Your report is filed for you, with your name attached.
                </Text>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button type="submit" loading={isPending} disabled={!isValid}>
                Send <Send />
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
