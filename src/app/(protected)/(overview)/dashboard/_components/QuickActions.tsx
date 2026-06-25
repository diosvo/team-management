'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Flex, SimpleGrid, Skeleton, VStack } from '@chakra-ui/react';
import {
  CalendarRange,
  ClipboardCheck,
  DoorOpen,
  FileCheck,
  TvMinimalPlay,
  Zap,
} from 'lucide-react';

import BulkAttendanceManager from '@/app/(protected)/(team-management)/attendance/_components/BulkAttendanceManager';
import SubmitLeaveRequest from '@/app/(protected)/(team-management)/attendance/_components/SubmitLeaveRequest';

import { Card } from '@/components/ui/card';

import usePermissions from '@/hooks/use-permissions';
import authClient from '@/lib/auth-client';

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
  const [mounted, setMounted] = useState(false);

  // Ensure server and first client render match to avoid hydration mismatch
  // Should be skeleton or placeholder until mounted is true.
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data } = authClient.useSession();

  const router = useRouter();
  const { isAdmin, isPlayer } = usePermissions();

  const title = (
    <Flex gap={2}>
      <Zap fill="yellow" />
      Quick Actions
    </Flex>
  );

  if (!mounted || !data?.user) {
    return (
      <Card title={title} description="Shortcuts to common tasks">
        <SimpleGrid columns={3} gap={6}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} height="84px" borderRadius="md" />
          ))}
        </SimpleGrid>
      </Card>
    );
  }

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
    <Card title={title} description="Shortcuts to common tasks">
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
    </Card>
  );
}
