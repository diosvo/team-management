import { Badge, Card, Flex, HStack, Span, VStack } from '@chakra-ui/react';
import { isToday as isTodayParser } from 'date-fns';
import { CircleOff, MapPin } from 'lucide-react';

import { LocationLink } from '@/components/common/LocationSelection';
import { EmptyState } from '@/components/ui/empty-state';

import { getUpcomingMatches } from '@/actions/analytics';
import { formatDate, formatDay } from '@/utils/formatter';

export default async function UpcomingMatches() {
  const matches = await getUpcomingMatches();

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Upcoming Matches</Card.Title>
        <Card.Description>Next 3 schedule games</Card.Description>
      </Card.Header>
      <Card.Body>
        <VStack alignItems="stretch" gap={4}>
          {matches.length > 0 ? (
            matches.map(({ match_id, date, time, location, league }) => {
              const isToday = isTodayParser(date);
              const isLeague = !!league?.league_id;

              return (
                <Flex
                  key={match_id}
                  gap={4}
                  padding={4}
                  borderRadius="sm"
                  borderLeft="4px solid"
                  backgroundColor={isToday ? 'blue.50' : 'gray.50'}
                  borderColor={isToday ? 'blue.500' : 'gray.300'}
                  _hover={{
                    backgroundColor: isToday ? 'blue.100' : 'gray.100',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <VStack align="start" flex={1} gap={1}>
                    <HStack gap={2} width="full">
                      <Span fontSize="sm">{formatDay(date)}</Span>
                      <Span color="gray.400">&bull;</Span>
                      <Span fontSize="sm">{formatDate(date)}</Span>
                      <Span color="gray.400">&bull;</Span>
                      <Span fontSize="sm">{time}</Span>
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
                        <Badge
                          size="sm"
                          borderRadius="full"
                          variant="surface"
                          colorPalette={isLeague ? 'green' : 'gray'}
                        >
                          {isLeague ? league.name : 'Friendly'}
                        </Badge>
                      </HStack>
                    </HStack>

                    <HStack fontSize="sm" color="gray.600">
                      <MapPin size={14} />
                      <LocationLink name={location?.name} />
                    </HStack>
                  </VStack>
                </Flex>
              );
            })
          ) : (
            <EmptyState
              icon={<CircleOff />}
              title="Nothing here"
              description="Focus on training and get ready for the next game!"
            />
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
