'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
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

import { MATCH_STAT_FIELDS, type MatchStatField } from '@/utils/constants';
import { formatDate } from '@/utils/datetime';

import { getMatchPlayerStats, saveMatchPlayerStats } from '@/actions/match';
import StepIndicator from '@/components/StepIndicator';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';
import { PlayerSelectionWithActions } from '@/components/user/PlayerSelection';
import type { MatchPlayerStatsWithName, PlayedMatch } from '@/db/match';
import type { PlayerOption } from '@/db/user';
import type { SaveMatchPlayerStatsValues } from '@/schemas/match';

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

const toGridPlayer = (user: PlayerOption): GridPlayer => ({
  id: user.id,
  name: user.name,
  jersey_number: user.player?.jersey_number ?? null,
});

type GridState = {
  players: Array<GridPlayer>;
  drafts: Record<string, StatDraft>;
  /** Players who had a row when the grid loaded: removing one deletes it. */
  loadedIds: Array<string>;
};

/** Grid state for a saved box score; jersey numbers come from the roster. */
const fromRows = (
  rows: Array<MatchPlayerStatsWithName>,
  activeById: Map<string, PlayerOption>,
): GridState => ({
  players: rows.map(({ player_id, player_name }) => ({
    id: player_id,
    name: player_name,
    jersey_number: activeById.get(player_id)?.player?.jersey_number ?? null,
  })),
  drafts: Object.fromEntries(
    rows.map((row) => [row.player_id, draftFrom(row)]),
  ),
  loadedIds: rows.map(({ player_id }) => player_id),
});

type MatchStatsPageClientProps = {
  matches: Array<PlayedMatch>;
  activePlayers: Array<PlayerOption>;
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
  const [isPending, startTransition] = useTransition();

  const activeById = useMemo(
    () => new Map(activePlayers.map((user) => [user.id, user])),
    [activePlayers],
  );

  const [match, setMatch] = useState(initialMatch);
  const [{ players, drafts, loadedIds }, setGrid] = useState(() =>
    fromRows(initialStats, activeById),
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

  // The picker only knows active players; former players stay in the grid.
  const selectedUsers = useMemo(
    () =>
      players.flatMap(({ id }) => {
        const user = activeById.get(id);
        return user ? [user] : [];
      }),
    [players, activeById],
  );

  const onMatchChange = (match_id: string | undefined) => {
    const next = matches.find((item) => item.match_id === match_id) ?? null;
    setMatch(next);
    if (!next) return;

    startTransition(async () => {
      const rows = await getMatchPlayerStats(next.match_id);
      setGrid(fromRows(rows, activeById));
      // Keep the URL shareable without re-rendering the server page, which
      // would fetch these same stats again.
      window.history.replaceState(null, '', `?match=${next.match_id}`);
    });
  };

  const onSelectionChange = (selected: Array<PlayerOption>) => {
    const selectedIds = new Set(selected.map(({ id }) => id));

    setGrid((prev) => {
      const kept = prev.players.filter(
        ({ id }) => !activeById.has(id) || selectedIds.has(id),
      );
      const keptIds = new Set(kept.map(({ id }) => id));
      const drafts = { ...prev.drafts };
      selected.forEach(({ id }) => {
        drafts[id] ??= emptyDraft();
      });
      return {
        ...prev,
        players: [
          ...kept,
          ...selected.filter(({ id }) => !keptIds.has(id)).map(toGridPlayer),
        ],
        drafts,
      };
    });
  };

  const onRemove = useCallback(
    (player_id: string) =>
      setGrid((prev) => ({
        ...prev,
        players: prev.players.filter(({ id }) => id !== player_id),
      })),
    [],
  );

  const onDraftChange = useCallback(
    (player_id: string, field: MatchStatField, value: string) =>
      setGrid((prev) => ({
        ...prev,
        drafts: {
          ...prev.drafts,
          [player_id]: {
            ...(prev.drafts[player_id] ?? emptyDraft()),
            [field]: value,
          },
        },
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

      if (success) {
        setGrid((prev) => ({
          ...prev,
          loadedIds: prev.players.map(({ id }) => id),
        }));
      }
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
