'use client';

import { Badge, Card, HStack, Icon, Text, VStack } from '@chakra-ui/react';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, Hash, Ruler, Scale, Shield } from 'lucide-react';

import { User } from '@/drizzle/schema';
import { UserRole } from '@/utils/enum';
import { formatDate } from '@/utils/formatter';

interface TeamInfoProps {
  user: User;
}

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number | null | undefined;
  suffix?: string;
}

function InfoItem({ icon, label, value, suffix }: InfoItemProps) {
  const displayValue = value ? `${value}${suffix || ''}` : 'Not provided';

  return (
    <HStack gap={3} align="flex-start">
      <Icon as={icon} size="md" color="gray.500" mt={0.5} />
      <VStack gap={0} align="flex-start" flex={1}>
        <Text fontSize="sm" color="gray.600" fontWeight="medium">
          {label}
        </Text>
        <Text fontSize="md" color={value ? 'inherit' : 'gray.400'}>
          {displayValue}
        </Text>
      </VStack>
    </HStack>
  );
}

export default function TeamInfo({ user }: TeamInfoProps) {
  const isPlayer = user.role === UserRole.PLAYER;

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Team Information</Card.Title>
      </Card.Header>
      <Card.Body>
        <VStack gap={4} align="stretch">
          <HStack gap={3} align="flex-start">
            <Icon as={Shield} size="md" color="gray.500" mt={0.5} />
            <VStack gap={0} align="flex-start" flex={1}>
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                Role & Position
              </Text>
              <HStack gap={2} wrap="wrap">
                <Badge variant="outline">{user.role}</Badge>
                {user.details.position && (
                  <Badge variant="outline" colorPalette="purple">
                    {user.details.position}
                  </Badge>
                )}
              </HStack>
            </VStack>
          </HStack>

          {isPlayer && user.details.jersey_number && (
            <InfoItem
              icon={Hash}
              label="Jersey Number"
              value={user.details.jersey_number}
            />
          )}

          {isPlayer && 'height' in user.details && (
            <InfoItem
              icon={Ruler}
              label="Height"
              value={user.details.height}
              suffix=" cm"
            />
          )}

          {isPlayer && 'weight' in user.details && (
            <InfoItem
              icon={Scale}
              label="Weight"
              value={user.details.weight}
              suffix=" kg"
            />
          )}

          {user.join_date && (
            <HStack gap={3} align="flex-start">
              <Icon as={Calendar} size="md" color="gray.500" mt={0.5} />
              <VStack gap={0} align="flex-start" flex={1}>
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Joined Team
                </Text>
                <VStack gap={1} align="flex-start">
                  <Text fontSize="md">{formatDate(user.join_date)}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {formatDistanceToNow(user.join_date, { addSuffix: true })}
                  </Text>
                </VStack>
              </VStack>
            </HStack>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
