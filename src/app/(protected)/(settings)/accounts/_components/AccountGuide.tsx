'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, IconButton, List, Portal } from '@chakra-ui/react';
import { Info } from 'lucide-react';

import { PASSWORD_LINK_TTL } from '@/utils/constants';

import { CloseButton } from '@/components/ui/close-button';
import { Tooltip } from '@/components/ui/tooltip';

const bold = (chunks: React.ReactNode) => <b>{chunks}</b>;

/** Info button with what an admin needs to know about invites and links. */
export default function AccountGuide() {
  const t = useTranslations('accounts');
  // The tooltip and the dialog share one trigger element
  const triggerId = useId();
  const title = t('guide.title');

  return (
    <Dialog.Root ids={{ trigger: triggerId }}>
      <Tooltip ids={{ trigger: triggerId }} content={title}>
        <Dialog.Trigger asChild>
          <IconButton variant="ghost" colorPalette="blue" aria-label={title}>
            <Info />
          </IconButton>
        </Dialog.Trigger>
      </Tooltip>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <List.Root gap={2} paddingInlineStart={4}>
                <List.Item>
                  {t.rich('guide.invite', {
                    add: t('addUser.trigger'),
                    b: bold,
                  })}
                </List.Item>
                <List.Item>{t('guide.noEmail')}</List.Item>
                <List.Item>
                  {t.rich('guide.links', {
                    hours: PASSWORD_LINK_TTL / 3600,
                    sendLink: t('table.sendLink'),
                    b: bold,
                  })}
                </List.Item>
                <List.Item>
                  {t.rich('guide.signOut', {
                    signOut: t('table.signOut'),
                    b: bold,
                  })}
                </List.Item>
                <List.Item>{t('guide.profile')}</List.Item>
              </List.Root>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
