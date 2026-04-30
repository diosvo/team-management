'use client';

import { useRouter } from 'next/navigation';

import BulkAttendanceManager from '@/app/(protected)/(team-management)/attendance/_components/BulkAttendanceManager';
import SubmitLeaveRequest from '@/app/(protected)/(team-management)/attendance/_components/SubmitLeaveRequest';
import usePermissions from '@/hooks/use-permissions';
import authClient from '@/lib/auth-client';
import { Card, Flex, SimpleGrid, VStack } from '@chakra-ui/react';
import {
  CalendarRange,
  ClipboardCheck,
  DoorOpen,
  FileCheck,
  TvMinimalPlay,
  Zap,
} from 'lucide-react';

const actionItemStyles = {
  padding: 4,
  borderWidth: 1,
  borderRadius: 'md',
  _hover: {
    cursor: 'pointer',
    backgroundColor: 'gray.100',
    borderColor: 'gray.300',
    transition: 'background-color 0.2s, border-color 0.2s',
  },
} as const;

export default function QuickActions() {
  const { data } = authClient.useSession();

  const router = useRouter();
  const { isAdmin, isPlayer } = usePermissions();

  if (!data?.user) return null;

  const Actions = [
    {
      enabled: true,
      title: 'View Schedule',
      icon: CalendarRange,
      onClick: () => router.push('/training'),
    },
    {
      enabled: true,
      title: 'Match Results',
      icon: TvMinimalPlay,
      onClick: () => router.push('/matches'),
    },
    {
      enabled: isPlayer,
      title: 'My Stats',
      icon: FileCheck,
      onClick: () => router.push('/performance/' + data.user.id),
    },
  ];

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>
          <Flex gap={2}>
            <Zap fill="yellow" />
            Quick Actions
          </Flex>
        </Card.Title>
        <Card.Description>Shortcuts to common tasks</Card.Description>
      </Card.Header>
      <Card.Body>
        <SimpleGrid columns={Actions.length} gap={6}>
          {Actions.map(({ title, icon: Icon, enabled, onClick }) => (
            <VStack
              key={title}
              as="button"
              display={enabled ? 'flex' : 'none'}
              {...actionItemStyles}
              onClick={onClick}
            >
              <Icon size={18} strokeWidth={1.5} />
              {title}
            </VStack>
          ))}
          {isPlayer && (
            <SubmitLeaveRequest
              trigger={
                <VStack as="button" {...actionItemStyles}>
                  <DoorOpen size={18} strokeWidth={1.5} />
                  Submit Leave
                </VStack>
              }
            />
          )}
          {isAdmin && (
            <BulkAttendanceManager
              trigger={
                <VStack as="button" {...actionItemStyles}>
                  <ClipboardCheck size={18} strokeWidth={1.5} />
                  Mark Attendance
                </VStack>
              }
            />
          )}
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
}
