'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge, HStack, IconButton, Stack, Text } from '@chakra-ui/react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { NotebookPen, Pencil, Trash2 } from 'lucide-react';

import { formatResult, type GoalOutcome } from '@/utils/progression';

import { removeTestNote } from '@/actions/progression';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { toaster } from '@/components/ui/toaster';
import type { TestType } from '@/drizzle/schema';
import usePermissions from '@/hooks/use-permissions';
import type { TestNoteItem } from '@/types/periodic-testing';

import { AddTestNote } from './AddTestNote';

const OUTCOME_COLOR: Record<GoalOutcome, string> = {
  met: 'green',
  missed: 'red',
  pending: 'gray',
};

export default function TestNotes({
  playerId,
  notes,
  types,
}: {
  playerId: string;
  notes: Array<TestNoteItem>;
  types: Array<TestType>;
}) {
  const t = useTranslations('periodicTesting.playerProgression.notes');
  const locale = useLocale();
  const { can } = usePermissions();
  const [isPending, startTransition] = useTransition();

  const onDelete = (note_id: string) => {
    const id = toaster.create({ type: 'loading', title: t('removing') });

    startTransition(async () => {
      const { success, message: title } = await removeTestNote(note_id);
      toaster.update(id, { type: success ? 'success' : 'error', title });
    });
  };

  return (
    <Card title={t('title')} description={t('description')}>
      {notes.length === 0 ? (
        <EmptyState
          icon={<NotebookPen />}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
        />
      ) : (
        <Stack gap={4}>
          {notes.map((note) => (
            <Stack key={note.note_id} gap={1}>
              <HStack justifyContent="space-between">
                <HStack flexWrap="wrap">
                  <Badge variant="surface" borderRadius="full">
                    {note.type_name ?? t('general')}
                  </Badge>
                  {note.goal != null && (
                    <Badge
                      variant="outline"
                      colorPalette="green"
                      borderRadius="full"
                    >
                      {t('goal', { value: formatResult(note.goal, note.unit) })}
                    </Badge>
                  )}
                  {note.outcome && (
                    <Badge
                      variant="subtle"
                      colorPalette={OUTCOME_COLOR[note.outcome]}
                      borderRadius="full"
                    >
                      {t(`outcome.${note.outcome}`)}
                    </Badge>
                  )}
                </HStack>
                <HStack gap={0}>
                  {can('periodic-testing', 'edit') && (
                    <IconButton
                      size="xs"
                      variant="ghost"
                      aria-label={t('edit')}
                      disabled={isPending}
                      onClick={() =>
                        AddTestNote.open('add-test-note', {
                          playerId,
                          types,
                          note,
                        })
                      }
                    >
                      <Pencil />
                    </IconButton>
                  )}
                  {can('periodic-testing', 'delete') && (
                    <IconButton
                      size="xs"
                      variant="ghost"
                      aria-label={t('remove')}
                      disabled={isPending}
                      onClick={() => onDelete(note.note_id)}
                    >
                      <Trash2 />
                    </IconButton>
                  )}
                </HStack>
              </HStack>
              <Text whiteSpace="pre-wrap">{note.content}</Text>
              <Text fontSize="xs" color="GrayText">
                {note.author_name ?? t('unknownAuthor')} ·{' '}
                {formatDistanceToNow(note.created_at, {
                  addSuffix: true,
                  locale: locale === 'vi' ? vi : undefined,
                })}
              </Text>
            </Stack>
          ))}
        </Stack>
      )}
    </Card>
  );
}
