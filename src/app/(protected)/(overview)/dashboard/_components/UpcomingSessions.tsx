'use client';

import {
  Badge,
  Card,
  Flex,
  HStack,
  Span,
  Text,
  VStack,
} from '@chakra-ui/react';
import { format, isToday, parseISO } from 'date-fns';
import { MapPin } from 'lucide-react';

import { MOCK_UPCOMING_SESSIONS } from '@/test/mocks/analytics';
import { DEFAULT_TIME_FORMAT } from '@/utils/constant';
import { formatDate, formatDay } from '@/utils/formatter';

// TODO: Fetch with actual data when TrainingSession feature is ready
export default function UpcomingSessions() {
  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Upcoming Sessions</Card.Title>
        <Card.Description>Next 3 training sessions</Card.Description>
      </Card.Header>
      <Card.Body>
        <VStack align="stretch" gap={4}>
          {MOCK_UPCOMING_SESSIONS.map(({ id, datetime, location }) => {
            const date = parseISO(datetime);
            const isTodaySession = isToday(date);

            return (
              <Flex
                key={id}
                gap={4}
                padding={4}
                borderRadius="sm"
                borderLeft="4px solid"
                backgroundColor={isTodaySession ? 'blue.50' : 'gray.50'}
                borderColor={isTodaySession ? 'blue.500' : 'gray.300'}
                _hover={{
                  cursor: 'pointer',
                  backgroundColor: isTodaySession ? 'blue.100' : 'gray.100',
                }}
              >
                <VStack align="start" flex={1} gap={1}>
                  <HStack gap={2} width="full">
                    <Span fontSize="sm">{formatDay(date)}</Span>
                    <Span color="gray.400">&bull;</Span>
                    <Span fontSize="sm">{formatDate(date)}</Span>
                    <Span color="gray.400">&bull;</Span>
                    <Span fontSize="sm">
                      {format(date, DEFAULT_TIME_FORMAT)}
                    </Span>
                    {isTodaySession && (
                      <Badge
                        marginLeft="auto"
                        size="sm"
                        borderRadius="full"
                        variant="surface"
                        colorPalette="blue"
                      >
                        Today
                      </Badge>
                    )}
                  </HStack>

                  <HStack fontSize="sm" color="gray.600">
                    <MapPin size={14} />
                    <Text>{location}</Text>
                  </HStack>
                </VStack>
              </Flex>
            );
          })}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
