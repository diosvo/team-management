'use client';

import {
  Button,
  CloseButton,
  Dialog,
  HStack,
  Portal,
  Span,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { capitalize } from 'es-toolkit/string';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import SearchableSelect from '@/components/SearchableSelect';
import { toaster } from '@/components/ui/toaster';

import { formatValueUnit } from '@/utils/formatter';

import { getReportRecipients, sendReportEmail } from '@/actions/report';
import { EmailReportSchema, EmailReportSchemaValues } from '@/schemas/report';

import AnalyticsReport from '../../reports/_components/AnalyticsReport';

interface EmailReportProps {
  open: boolean;
  interval: string;
  formattedPeriod: string;
  filename: string;
  onOpenChange: (open: boolean) => void;
}

export default function EmailReport({
  interval,
  open,
  formattedPeriod,
  filename,
  onOpenChange,
}: EmailReportProps) {
  const [sending, setSending] = useState(false);

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
        body: JSON.stringify({ period: formattedPeriod, filename }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        toaster.error({
          title: 'Download failed',
          description: error,
        });
        return;
      }

      const pdfBuffer = Buffer.from(await response.arrayBuffer());

      await sendReportEmail({
        to: recipients,
        subject: 'Analytics Overview Report',
        html: AnalyticsReport({
          period: formattedPeriod,
        }),
        attachments: [
          {
            content: pdfBuffer.toString('base64'),
            filename,
          },
        ],
      });

      toaster.success({
        title: 'Email sent',
        description: `Report emailed to ${recipients.length} ${formatValueUnit(
          recipients.length,
          'recipient',
        )}.`,
      });

      reset();
      onOpenChange(false);
    } catch (error) {
      toaster.error({
        title: 'Email failed',
        description: 'Failed to send the report via email.',
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
              <Dialog.Title>Email Analytics Report</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <SearchableSelect
                controlledMode
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
                    ? 'No recipients selected. Please select at least one.'
                    : `${capitalize(interval.split('_').join(' '))}'s report will be emailed to ${recipients.length} ${formatValueUnit(recipients.length, 'recipient')}.`,
                }}
              />
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                type="submit"
                disabled={sending || recipients.length === 0}
                loading={sending}
                loadingText="Sending..."
              >
                Generate &amp; Email
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
