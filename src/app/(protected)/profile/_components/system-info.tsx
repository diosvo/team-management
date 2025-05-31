'use client';

import { Card, HStack, Icon, Text, VStack } from '@chakra-ui/react';
import { Clock, Database, Shield, UserPlus } from 'lucide-react';

import Visibility from '@/components/visibility';
import { User } from '@/drizzle/schema';
import { usePermissions } from '@/hooks/use-permissions';
import { formatDatetime } from '@/utils/formatter';

interface SystemInfoProps {
  user: User;
}

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <HStack gap={3} align="flex-start">
      <Icon as={icon} size="md" color="gray.500" mt={0.5} />
      <VStack gap={0} align="flex-start" flex={1}>
        <Text fontSize="sm" color="gray.600" fontWeight="medium">
          {label}
        </Text>
        <Text fontSize="md">{value}</Text>
      </VStack>
    </HStack>
  );
}

export default function SystemInfo({ user }: SystemInfoProps) {
  const { isAdmin } = usePermissions();

  return (
    <Visibility isVisible={isAdmin}>
      <Card.Root>
        <Card.Header>
          <Card.Title>System Information</Card.Title>
        </Card.Header>
        <Card.Body>
          <VStack gap={4} align="stretch">
            <InfoItem icon={Database} label="User ID" value={user.user_id} />

            <InfoItem
              icon={Shield}
              label="Password Status"
              value={user.password ? 'Configured' : 'Not set'}
            />

            <InfoItem
              icon={UserPlus}
              label="Account Created"
              value={formatDatetime(user.created_at)}
            />

            <InfoItem
              icon={Clock}
              label="Last Updated"
              value={formatDatetime(user.updated_at)}
            />
          </VStack>
        </Card.Body>
      </Card.Root>
    </Visibility>
  );
}
