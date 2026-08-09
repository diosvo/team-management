'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

import { Flex, SimpleGrid, Skeleton, VStack } from '@chakra-ui/react';
import {
  CalendarRange,
  ClipboardCheck,
  DoorOpen,
  FileCheck,
  TvMinimalPlay,
  Zap,
} from 'lucide-react';

import { Card } from '@/components/ui/card';

// Each dialog is gated to a single role (player vs admin), so no visitor can
// ever use both — load them lazily instead of shipping both to everyone.
const tileFallback = () => <Skeleton borderRadius="md" />;

const SubmitLeaveRequest = dynamic(
  () =>
    import(
      '@/app/(protected)/(team-management)/attendance/_components/SubmitLeaveRequest'
    ),
  { ssr: false, loading: tileFallback },
);

const BulkAttendanceManager = dynamic(
  () =>
    import(
      '@/app/(protected)/(team-management)/attendance/_components/BulkAttendanceManager'
    ),
  { ssr: false, loading: tileFallback },
);

import usePermissions from '@/hooks/use-permissions';
import { useSessionContext } from '@/providers/session';

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
  const router = useRouter();
  const { user } = useSessionContext();
  const { isAdmin, isPlayer } = usePermissions();

  const title = (
    <Flex gap={2}>
      <Zap fill="yellow" />
      Quick Actions
    </Flex>
  );

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
      onClick: () => router.push('/performance/' + user!.id),
    },
  ];

  return (
    <Card title={title} description="Shortcuts to common tasks">
      <SimpleGrid columns={Actions.length} gap={4}>
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
