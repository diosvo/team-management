'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@chakra-ui/react';
import { ClipboardList } from 'lucide-react';

import Authorized from '@/components/Authorized';
import PageHeader, { AddButton } from '@/components/PageHeader';

import { UpsertMatch } from './UpsertMatch';

export default function MatchHeader() {
  const t = useTranslations('matches.header');
  const tc = useTranslations('common');

  return (
    <PageHeader title={t('title')}>
      <Authorized resource="matches" action="edit">
        <Button variant="outline" colorPalette="blue" asChild>
          <Link href="/matches/stats">
            <ClipboardList size={14} />
            {t('boxScore')}
          </Link>
        </Button>
      </Authorized>
      <AddButton
        resource="matches"
        onClick={() =>
          UpsertMatch.open('add-match', {
            action: 'Add',
            item: { match_id: '' },
          })
        }
      >
        {tc('add')}
      </AddButton>
    </PageHeader>
  );
}
