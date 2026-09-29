'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useTransition } from 'react';

import {
  Badge,
  Button,
  createListCollection,
  Highlight,
  HStack,
  Portal,
  Select,
  SimpleGrid,
  Span,
  VStack,
} from '@chakra-ui/react';
import { Save } from 'lucide-react';

import StepIndicator from '@/components/StepIndicator';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';
import { PlayerSelectionWithActions } from '@/components/user/PlayerSelection';

import { getMatchPlayerStats, saveMatchPlayerStats } from '@/actions/match';
import type { MatchPlayerStatsWithName, PlayedMatch } from '@/db/match';
import type { User } from '@/drizzle/schema';
import type { SaveMatchPlayerStatsValues } from '@/schemas/match';
import { MATCH_STAT_FIELDS, type MatchStatField } from '@/utils/constants';
import { formatDate } from '@/utils/datetime';

import MatchStatsTable, {
  type GridPlayer,
  type StatDraft,
} from './MatchStatsTable';

const emptyDraft = (): StatDraft =>
  Object.fromEntries(
    MATCH_STAT_FIELDS.map(({ key }) => [key, '0']),
  ) as StatDraft;

const draftFrom = (row: MatchPlayerStatsWithName): StatDraft =>
  Object.fromEntries(
    MATCH_STAT_FIELDS.map(({ key }) => [key, String(row[key] ?? 0)]),
  ) as StatDraft;

const toGridPlayer = (row: MatchPlayerStatsWithName): GridPlayer => ({
  id: row.player_id,
  name: row.player_name,
  jersey_number: null,
});

type MatchStatsPageClientProps = {
  matches: Array<PlayedMatch>;
  activePlayers: Array<User>;
  initialMatch: Nullable<PlayedMatch>;
  initialStats: Array<MatchPlayerStatsWithName>;
};

export default function MatchStatsPageClient({
  matches,
  activePlayers,
  initialMatch,
  initialStats,
}: MatchStatsPageClientProps) {
  const t = useTranslations('matches.boxScore');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [match, setMatch] = useState(initialMatch);
  const [players, setPlayers] = useState<Array<GridPlayer>>(() =>
    initialStats.map(toGridPlayer),
  );
  const [drafts, setDrafts] = useState<Record<string, StatDraft>>(() =>
    Object.fromEntries(
      initialStats.map((row) => [row.player_id, draftFrom(row)]),
    ),
  );
  // Players who had a row when the grid loaded: removing one deletes it.
  const [loadedIds, setLoadedIds] = useState<Array<string>>(() =>
    initialStats.map(({ player_id }) => player_id),
  );

  const matchLabel = useCallback(
    (item: PlayedMatch) =>
      t('matchLabel', {
        date: formatDate(item.date),
        opponent: item.opponent,
      }),
    [t],
  );

  const collection = useMemo(
    () =>
      createListCollection({
        items: matches,
        itemToString: matchLabel,
        itemToValue: ({ match_id }) => match_id,
      }),
    [matches, matchLabel],
  );

  const activeById = useMemo(
    () => new Map(activePlayers.map((user) => [user.id, user])),
    [activePlayers],
  );
  // The picker only knows active players; former players stay in the grid.
  const selectedUsers = useMemo(
    () =>
      players.flatMap(({ id }) => {
        const user = activeById.get(id);
        return user ? [user] : [];
      }),
    [players, activeById],
  );

  const applyRows = (rows: Array<MatchPlayerStatsWithName>) => {
    setPlayers(rows.map(toGridPlayer));
    setDrafts(
      Object.fromEntries(rows.map((row) => [row.player_id, draftFrom(row)])),
    );
    setLoadedIds(rows.map(({ player_id }) => player_id));
  };

  const onMatchChange = (match_id: string | undefined) => {
    const next = matches.find((item) => item.match_id === match_id) ?? null;
    setMatch(next);
    if (!next) return;

    startTransition(async () => {
      applyRows(await getMatchPlayerStats(next.match_id));
      router.replace(`/matches/stats?match=${next.match_id}`);
    });
  };

  const onSelectionChange = (selected: Array<User>) => {
    const selectedIds = new Set(selected.map(({ id }) => id));

    setPlayers((prev) => {
      const kept = prev.filter(
        ({ id }) => !activeById.has(id) || selectedIds.has(id),
      );
      const keptIds = new Set(kept.map(({ id }) => id));
      const added = selected
        .filter(({ id }) => !keptIds.has(id))
        .map<GridPlayer>((user) => ({
          id: user.id,
          name: user.name,
          jersey_number: user.player?.jersey_number ?? null,
        }));
      return [...kept, ...added];
    });
    setDrafts((prev) => {
      const next = { ...prev };
      selected.forEach(({ id }) => {
        next[id] ??= emptyDraft();
      });
      return next;
    });
  };

  const onRemove = useCallback(
    (player_id: string) =>
      setPlayers((prev) => prev.filter(({ id }) => id !== player_id)),
    [],
  );

  const onDraftChange = useCallback(
    (player_id: string, field: MatchStatField, value: string) =>
      setDrafts((prev) => ({
        ...prev,
        [player_id]: { ...(prev[player_id] ?? emptyDraft()), [field]: value },
      })),
    [],
  );

  const onSave = () => {
    const rows = players.map(
      ({ id }) =>
        ({
          player_id: id,
          ...Object.fromEntries(
            MATCH_STAT_FIELDS.map(({ key }) => [
              key,
              Number(drafts[id]?.[key]) || 0,
            ]),
          ),
        }) as SaveMatchPlayerStatsValues['rows'][number],
    );
    const current = new Set(players.map(({ id }) => id));
    const removed_player_ids = loadedIds.filter((id) => !current.has(id));

    const toastId = toaster.create({
      type: 'loading',
      title: t('saving'),
    });

    startTransition(async () => {
      const { success, message: title } = await saveMatchPlayerStats({
        // Save stays disabled until a match is picked (canSave)
        match_id: match!.match_id,
        rows,
        removed_player_ids,
      });

      toaster.update(toastId, { type: success ? 'success' : 'error', title });

      if (success) setLoadedIds(players.map(({ id }) => id));
    });
  };

  const canSave =
    !!match && !isPending && (players.length > 0 || loadedIds.length > 0);

  return (
    <SimpleGrid
      columns={{ base: 1, lg: 2 }}
      gap={6}
      templateColumns={{ lg: '1fr 2fr' }}
    >
      <Card
        title={
          <HStack>
            <StepIndicator step={1} />
            {t('matchAndPlayers')}
          </HStack>
        }
        description={
          <Highlight
            query={t('activeQuery')}
            styles={{ px: '0.5', backgroundColor: 'green.100' }}
          >
            {t('activeOnly')}
          </Highlight>
        }
      >
        <VStack gap={4}>
          <Field label={t('match')} required>
            <Select.Root
              collection={collection}
              value={match ? [match.match_id] : []}
              disabled={isPending}
              onValueChange={({ value }) => onMatchChange(value[0])}
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder={t('matchPlaceholder')} />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {collection.items.map((item) => (
                      <Select.Item
                        item={item}
                        key={item.match_id}
                        _checked={{ bg: 'bg.emphasized', fontWeight: 'medium' }}
                      >
                        <HStack justifyContent="space-between" width="full">
                          <Span>{matchLabel(item)}</Span>
                          <Badge
                            size="xs"
                            variant="surface"
                            borderRadius="full"
                            colorPalette={item.recorded > 0 ? 'green' : 'gray'}
                          >
                            {item.recorded > 0
                              ? t('recorded', { count: item.recorded })
                              : t('noBoxScore')}
                          </Badge>
                        </HStack>
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </Field>

          <PlayerSelectionWithActions
            disabled={!match || isPending}
            selection={selectedUsers}
            onSelectionChange={onSelectionChange}
          />
        </VStack>
      </Card>

      <Card
        title={
          <HStack>
            <StepIndicator step={2} />
            {t('title')}
          </HStack>
        }
        description={t('removeHint')}
        action={
          <Button
            size="sm"
            disabled={!canSave}
            loading={isPending}
            loadingText={t('savingButton')}
            onClick={onSave}
          >
            <Save />
            {tCommon('save')}
          </Button>
        }
      >
        <MatchStatsTable
          players={players}
          drafts={drafts}
          disabled={!match || isPending}
          onChange={onDraftChange}
          onRemove={onRemove}
        />
      </Card>
    </SimpleGrid>
  );
}
