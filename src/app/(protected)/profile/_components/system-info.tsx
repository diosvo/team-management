'use client';

import { Card, Grid, HStack, Text } from '@chakra-ui/react';
import { Clock, UserPlus } from 'lucide-react';

import { User } from '@/drizzle/schema';
import { usePermissions } from '@/hooks/use-permissions';
import { formatDatetime } from '@/utils/formatter';

interface InfoItemProps {
  label: string;
  children: React.ReactNode;
  icon?: React.ElementType;
}
function InfoItem({ icon: IconComponent, label, children }: InfoItemProps) {
  return (
    <HStack gap={1}>
      {IconComponent && <IconComponent size={14} color="GrayText" />}
      <Text color="GrayText">{label}:</Text>
      {children}
    </HStack>
  );
}

export default function SystemInfo({ user }: { user: User }) {
  const { isAdmin } = usePermissions();

  if (!isAdmin) return null;

  return (
    <Card.Root _hover={{ shadow: 'sm' }} transition="all 0.2s">
      <Card.Header backgroundColor="ghostwhite" paddingBlock={4}>
        <Card.Title>System Information</Card.Title>
      </Card.Header>
      <Card.Body>
        <Grid
          templateColumns={{
            base: '1fr',
            md: 'repeat(2, 1fr)',
            xl: 'repeat(3, 1fr)',
          }}
          gap={4}
        >
          <InfoItem label="Account Created" icon={UserPlus}>
            {formatDatetime(user.created_at)}
          </InfoItem>
          <InfoItem label="Last Updated" icon={Clock}>
            {formatDatetime(user.updated_at)}
          </InfoItem>
        </Grid>
      </Card.Body>
    </Card.Root>
  );
}
