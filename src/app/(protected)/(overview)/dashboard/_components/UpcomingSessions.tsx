import { Badge, Flex, HStack, Span, VStack } from '@chakra-ui/react';
import { isToday as isTodayParser } from 'date-fns';
import { CircleOff, MapPin } from 'lucide-react';

import { LocationLink } from '@/components/common/LocationSelection';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

import { getUpcomingSessions } from '@/actions/analytics';
import { formatDate, formatDay } from '@/utils/datetime';

export const UPCOMING_SESSIONS = {
  title: 'Upcoming Sessions',
  description: 'Next 3 training sessions',
};

export default async function UpcomingSessions() {
  const sessions = await getUpcomingSessions();

  return (
    <Card {...UPCOMING_SESSIONS}>
      <VStack alignItems="stretch" gap={4}>
        {sessions.length > 0 ? (
          sessions.map(
            ({ session_id, date, start_time, end_time, location }) => {
              const isToday = isTodayParser(date);

              return (
                <Flex
                  key={session_id}
                  gap={4}
                  padding={4}
                  borderRadius="sm"
                  borderLeft="4px solid"
                  backgroundColor={isToday ? 'blue.50' : 'gray.50'}
                  borderColor={isToday ? 'blue.500' : 'gray.300'}
                >
                  <VStack alignItems="start" flex={1} minWidth={0} gap={1}>
                    <HStack gap={2} width="full" flexWrap="wrap">
                      <Span fontSize="sm">{formatDay(date)}</Span>
                      <Span color="gray.400">&bull;</Span>
                      <Span fontSize="sm">{formatDate(date)}</Span>
                      <Span color="gray.400">&bull;</Span>
                      <Span fontSize="sm">
                        <HStack gap={1}>
                          <Span>{start_time}</Span>
                          <Span color="gray.400">&rarr;</Span>
                          <Span>{end_time}</Span>
                        </HStack>
                      </Span>
                      <HStack marginLeft="auto">
                        {isToday && (
                          <Badge
                            size="sm"
                            borderRadius="full"
                            variant="surface"
                            colorPalette="blue"
                          >
                            Today
                          </Badge>
                        )}
                      </HStack>
                    </HStack>

                    <HStack
                      textStyle="secondary"
                      color="gray.600"
                      width="full"
                      minWidth={0}
                    >
                      <MapPin size={14} />
                      <LocationLink
                        name={location?.name}
                        minWidth={0}
                        truncate
                      />
                    </HStack>
                  </VStack>
                </Flex>
              );
            },
          )
        ) : (
          <EmptyState
            icon={<CircleOff />}
            title="Nothing here"
            description="Upcoming training sessions will be coming soon."
          />
        )}
      </VStack>
    </Card>
  );
}
