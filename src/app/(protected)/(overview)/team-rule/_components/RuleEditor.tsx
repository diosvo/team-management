'use client';

import dynamic from 'next/dynamic';

import { Skeleton } from '@chakra-ui/react';

import PageTitle from '@/components/PageTitle';
import { toaster } from '@/components/ui/toaster';

import usePermissions from '@/hooks/use-permissions';

import type { NullishRule } from '@/drizzle/schema/rule';

import { upsertRule } from '@/actions/rule';

const TextEditor = dynamic(() => import('@/components/editor/TextEditor'), {
  ssr: false,
  loading: () => <Skeleton height={240} borderRadius="md" />,
});

export default function RuleEditor({ rule }: { rule: NullishRule }) {
  const { can } = usePermissions();

  const onSave = async (content: string) => {
    const id = toaster.create({
      type: 'loading',
      title: 'Updating rules...',
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
      header={<PageTitle title="Team Rule" />}
      content={rule?.content || 'Please wait for admin to set up the rule.'}
      canEdit={can('team-rule', 'edit')}
      lastUpdated={rule?.updated_at}
      onSave={onSave}
    />
  );
}
