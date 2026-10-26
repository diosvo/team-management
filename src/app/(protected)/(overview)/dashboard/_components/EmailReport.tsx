'use client';

import { useState } from 'react';

import {
  Button,
  CloseButton,
  Dialog,
  HStack,
  Portal,
  Span,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Base64 } from 'js-base64';
import { useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';

import { SearchableSelectField } from '@/components/SearchableSelect';
import { toaster } from '@/components/ui/toaster';

import type { DateRange } from '@/types/common';
import { formatDateRange } from '@/utils/datetime';

import { getReportRecipients, sendReportEmail } from '@/actions/report';
import {
  EmailReportSchema,
  type EmailReportSchemaValues,
} from '@/schemas/report';

import AnalyticsReport from '../../reports/_components/AnalyticsReport';

type EmailReportProps = {
  open: boolean;
  range: DateRange;
  filename: string;
  onOpenChange: (open: boolean) => void;
};

export default function EmailReport({
  open,
  range,
  filename,
  onOpenChange,
}: EmailReportProps) {
  const t = useTranslations('dashboard.emailReport');
  const [sending, setSending] = useState(false);
  const formattedPeriod = formatDateRange(range);

  const { control, reset, handleSubmit } = useForm<EmailReportSchemaValues>({
    resolver: zodResolver(EmailReportSchema),
    defaultValues: { recipients: [] },
  });

  const recipients = useWatch({ control, name: 'recipients' });
  const noRecipients = recipients.length === 0;

  const onSubmit = async ({ recipients }: EmailReportSchemaValues) => {
    setSending(true);

    try {
      const response = await fetch('/api/reports/dashboard', {
        method: 'POST',
        body: JSON.stringify({ ...range, filename }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        toaster.error({
          title: t('downloadFailed'),
          description: error,
        });
        return;
      }

      const content = Base64.fromUint8Array(
        new Uint8Array(await response.arrayBuffer()),
      );

      await sendReportEmail({
        to: recipients,
        subject: 'Analytics Overview Report',
        html: AnalyticsReport({
          period: formattedPeriod,
        }),
        attachments: [
          {
            content,
            filename,
          },
        ],
      });

      toaster.success({
        title: t('sent'),
        description: t('sentDescription', { count: recipients.length }),
      });

      reset();
      onOpenChange(false);
    } catch (error) {
      toaster.error({
        title: t('failed'),
        duration: 10000,
        description: error instanceof Error ? error.message : t('unknownError'),
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={({ open }) => onOpenChange(open)}
      onExitComplete={() => reset()}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner as="form" onSubmit={handleSubmit(onSubmit)}>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('title')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <SearchableSelectField
                multiple
                name="recipients"
                label="recipients"
                control={control}
                action={getReportRecipients}
                itemToValue={({ email }) => email}
                itemToString={({ name }) => name}
                renderItem={({ name, email }) => (
                  <HStack>
                    {name}{' '}
                    <Span fontSize="sm" color="GrayText">
                      &lt;{email}&gt;
                    </Span>
                  </HStack>
                )}
                fieldProps={{
                  helperText: noRecipients
                    ? t('noRecipients')
                    : t('helper', {
                        period: formattedPeriod,
                        count: recipients.length,
                      }),
                }}
              />
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                type="submit"
                disabled={sending || recipients.length === 0}
                loading={sending}
                loadingText={t('sending')}
              >
                {t('submit')}
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
