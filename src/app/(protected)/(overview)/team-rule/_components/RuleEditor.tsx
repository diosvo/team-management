'use client';

import dynamic from 'next/dynamic';
import { useState, useTransition } from 'react';

import { Button, HStack, Skeleton } from '@chakra-ui/react';
import { Eye, Pencil } from 'lucide-react';

import Authorized from '@/components/Authorized';
import PageTitle from '@/components/PageTitle';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';

// TipTap/ProseMirror is heavy and the editor never renders on the server
// (`immediatelyRender: false`), so keep it out of the route's first-load JS.
const TextEditor = dynamic(() => import('@/components/TextEditor'), {
  ssr: false,
  loading: () => <Skeleton height="240px" borderRadius="md" />,
});

import type { NullishRule } from '@/drizzle/schema/rule';

import { upsertRule } from '@/actions/rule';

export default function RuleEditor({ rule }: { rule: NullishRule }) {
  const initialContent =
    rule?.content || 'Please wait for admin to set up the rule.';
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onSave = (content: string) => {
    startTransition(async () => {
      const id = toaster.create({
        type: 'loading',
        title: 'Updating rules...',
      });

      const { success, message: title } = await upsertRule(content);

      toaster.update(id, {
        type: success ? 'success' : 'error',
        title,
      });

      if (success) setIsEditing(false);
    });
  };

  return (
    <>
      <HStack>
        <PageTitle title="Team Rule" />
        <Authorized resource="team-rule" action="edit">
          <>
            <Tooltip
              positioning={{ placement: 'top' }}
              content={`${isEditing ? 'Preview' : 'Write'}`}
            >
              <Button
                size="2xs"
                variant="ghost"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <Eye /> : <Pencil />}
              </Button>
            </Tooltip>
          </>
        </Authorized>
      </HStack>
      <TextEditor
        editable={isEditing && !isPending}
        content={initialContent}
        onSave={onSave}
        onCancel={() => setIsEditing(false)}
        lastUpdated={rule?.updated_at}
      />
    </>
  );
}
