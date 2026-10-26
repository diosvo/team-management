'use client';

import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

import { Skeleton } from '@chakra-ui/react';

import PageTitle from '@/components/PageTitle';
import { toaster } from '@/components/ui/toaster';

import usePermissions from '@/hooks/use-permissions';

import type { NullishTeamRule } from '@/drizzle/schema/team';

import { upsertRule } from '@/actions/rule';

const TextEditor = dynamic(() => import('@/components/editor/TextEditor'), {
  ssr: false,
  loading: () => <Skeleton height={240} borderRadius="md" />,
});

export default function RuleEditor({ rule }: { rule: NullishTeamRule }) {
  const t = useTranslations('teamRule');
  const { can } = usePermissions();

  const onSave = async (content: string) => {
    const id = toaster.create({
      type: 'loading',
      title: t('updating'),
    });

    const { success, message: title } = await upsertRule(content);

    toaster.update(id, {
      type: success ? 'success' : 'error',
      title,
    });

    return success;
  };

  return (
    <TextEditor
      header={<PageTitle title={t('title')} />}
      content={rule?.rule_content || t('placeholder')}
      canEdit={can('team-rule', 'edit')}
      lastUpdated={rule?.rule_updated_at ?? undefined}
      onSave={onSave}
    />
  );
}
