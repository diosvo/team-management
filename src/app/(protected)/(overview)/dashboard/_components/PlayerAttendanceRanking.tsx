import { HStack, Span, Text, VStack } from '@chakra-ui/react';
import { BetweenVerticalEnd, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

import type { PlayerSessionSummary, PlayerStats } from '@/types/analytics';
import { colorRank } from '@/utils/helper';

const PlayerRank = (
  player: PlayerStats,
  index: number,
  sessions: (count: number) => string,
) => {
  return (
    <HStack key={index}>
      <Text textStyle="secondary" color="GrayText">
        {index + 1}.
      </Text>
      <Text textStyle="secondary" minWidth={0} truncate>
        {player.player_name}
      </Text>
      <Text
        textStyle="caption"
        color="GrayText"
        marginLeft="auto"
        marginRight={4}
        flexShrink={0}
      >
        {sessions(player.attended)}
      </Text>
      <Text
        textStyle="secondary"
        fontVariantNumeric="tabular-nums"
        color={colorRank(player.attendance_rate)}
      >
        {player.attendance_rate}%
      </Text>
    </HStack>
  );
};

export default function PlayerAttendanceRanking({
  records,
}: {
  records: PlayerSessionSummary;
}) {
  const t = useTranslations('dashboard.attendanceRanking');
  const sessions = (count: number) => t('sessions', { count });

  const section = [
    {
      title: t('stars'),
      color: 'green.600',
      icon: TrendingUp,
      data: records.top_performers,
    },
    {
      title: t('needBoost'),
      color: 'red.600',
      icon: TrendingDown,
      data: records.need_attention,
    },
  ];

  return (
    <Card height="full" title={t('title')} description={t('description')}>
      {!records.top_performers.length && !records.need_attention.length ? (
        <EmptyState icon={<BetweenVerticalEnd />} title={t('empty')} />
      ) : (
        section.map(
          ({ title, color, icon: Icon, data }, index) =>
            data.length > 0 && (
              <VStack key={index} alignItems="stretch" gap={2} marginBottom={4}>
                <HStack gap={2} color={color}>
                  <Icon size={16} />
                  <Span fontSize="sm" fontWeight="medium">
                    {title}
                  </Span>
                </HStack>

                {data.map((player, index) =>
                  PlayerRank(player, index, sessions),
                )}
              </VStack>
            ),
        )
      )}
    </Card>
  );
}
