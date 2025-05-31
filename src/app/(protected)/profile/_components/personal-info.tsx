'use client';

import { Card, HStack, Icon, Text, VStack } from '@chakra-ui/react';
import { CalendarDays, CreditCard, Mail, Phone } from 'lucide-react';

import { User } from '@/drizzle/schema';
import { formatDate } from '@/utils/formatter';

interface PersonalInfoProps {
  user: User;
}

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: Nullish<string>;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <HStack gap={3} align="flex-start">
      <Icon as={icon} size="md" color="gray.500" mt={0.5} />
      <VStack gap={0} align="flex-start" flex={1}>
        <Text fontSize="sm" color="gray.600" fontWeight="medium">
          {label}
        </Text>
        <Text fontSize="md" color={value ? 'inherit' : 'gray.400'}>
          {value || 'Not provided'}
        </Text>
      </VStack>
    </HStack>
  );
}

export default function PersonalInfo({ user }: PersonalInfoProps) {
  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Personal Information</Card.Title>
      </Card.Header>
      <Card.Body>
        <VStack gap={4} align="stretch">
          <InfoItem icon={Mail} label="Email" value={user.email} />

          <InfoItem
            icon={CalendarDays}
            label="Date of Birth"
            value={user.dob ? formatDate(user.dob) : null}
          />

          <InfoItem
            icon={Phone}
            label="Phone Number"
            value={user.phone_number}
          />

          <InfoItem
            icon={CreditCard}
            label="Citizen ID"
            value={user.citizen_identification}
          />
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
