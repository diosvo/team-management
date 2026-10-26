import { Badge, HStack, Span, VStack } from '@chakra-ui/react';
import { isToday as isTodayParser } from 'date-fns';
import { CircleOff, MapPin } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';

import { LocationLink } from '@/components/common/LocationSelection';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

import { getUpcomingMatches } from '@/actions/analytics';
import { enumLabel } from '@/i18n/enums';
import { formatDate, formatDay } from '@/utils/datetime';

export default async function UpcomingMatches() {
  const [matches, t, tEnums, locale] = await Promise.all([
    getUpcomingMatches(),
    getTranslations('dashboard.upcomingMatches'),
    getTranslations('enums'),
    getLocale(),
  ]);

  return (
    <Card title={t('title')} description={t('description')}>
      <VStack alignItems="stretch" gap={4}>
        {matches.length > 0 ? (
          matches.map(({ match_id, date, time, location, league }) => {
            const isToday = isTodayParser(date);
            const isLeague = !!league?.league_id;

            return (
              <HStack
                key={match_id}
                gap={4}
                padding={4}
                borderRadius="sm"
                borderLeft="4px solid"
                backgroundColor={isToday ? 'blue.50' : 'gray.50'}
                borderColor={isToday ? 'blue.500' : 'gray.300'}
              >
                <VStack align="start" flex={1} minWidth={0} gap={1}>
                  <HStack gap={2} width="full" flexWrap="wrap">
                    <Span fontSize="sm">
                      {formatDay(date, undefined, locale)}
                    </Span>
                    <Span color="gray.400">&bull;</Span>
                    <Span fontSize="sm">{formatDate(date)}</Span>
                    <Span color="gray.400">&bull;</Span>
                    <Span fontSize="sm">{time}</Span>
                    {isToday && (
                      <Badge
                        marginLeft="auto"
                        size="sm"
                        borderRadius="full"
                        variant="surface"
                        colorPalette="blue"
                      >
                        {t('today')}
                      </Badge>
                    )}
                  </HStack>

                  <HStack
                    textStyle="secondary"
                    color="gray.600"
                    width="full"
                    minWidth={0}
                  >
                    <MapPin size={12} />
                    <LocationLink name={location?.name} minWidth={0} truncate />
                    <Span marginLeft="auto" flexShrink={0}>
                      {isLeague
                        ? league.name
                        : enumLabel(tEnums, 'matchType', 'friendly')}
                    </Span>
                  </HStack>
                </VStack>
              </HStack>
            );
          })
        ) : (
          <EmptyState
            icon={<CircleOff />}
            title={t('emptyTitle')}
            description={t('emptyDescription')}
          />
        )}
      </VStack>
    </Card>
  );
}
