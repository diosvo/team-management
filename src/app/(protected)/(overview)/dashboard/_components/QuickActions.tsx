'use client';

import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import Link from 'next/link';

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
    import('@/app/(protected)/(team-management)/attendance/_components/SubmitLeaveRequest'),
  { ssr: false, loading: tileFallback },
);

const BulkAttendanceManager = dynamic(
  () =>
    import('@/app/(protected)/(team-management)/attendance/_components/BulkAttendanceManager'),
  { ssr: false, loading: tileFallback },
);

import usePermissions from '@/hooks/use-permissions';
import { useSessionContext } from '@/providers/session';

const actionItemStyles = {
  padding: 4,
  borderWidth: 1,
  borderRadius: 'md',
  textAlign: 'center',
  focusVisibleRing: 'outside',
  _hover: {
    cursor: 'pointer',
    backgroundColor: 'gray.100',
    borderColor: 'gray.300',
    transition: 'background-color 0.2s, border-color 0.2s',
  },
} as const;

export default function QuickActions() {
  const t = useTranslations('dashboard.quickActions');
  const { user } = useSessionContext();
  const { isAdmin, isPlayer } = usePermissions();

  const title = (
    <Flex gap={2}>
      <Zap fill="yellow" />
      {t('title')}
    </Flex>
  );

  const Actions = [
    {
      enabled: true,
      title: t('viewSchedule'),
      icon: CalendarRange,
      href: '/training',
    },
    {
      enabled: true,
      title: t('matchResults'),
      icon: TvMinimalPlay,
      href: '/matches',
    },
    {
      enabled: isPlayer,
      title: t('myStats'),
      icon: FileCheck,
      href: `/performance/${user?.id}`,
    },
  ];

  return (
    <Card title={title} description={t('description')}>
      <SimpleGrid minChildWidth="8rem" gap={4}>
        {Actions.filter(({ enabled }) => enabled).map(
          ({ title, icon: Icon, href }) => (
            <VStack key={title} {...actionItemStyles} asChild>
              <Link href={href}>
                <Icon size={18} strokeWidth={1.5} />
                {title}
              </Link>
            </VStack>
          ),
        )}
        {isPlayer && (
          <SubmitLeaveRequest
            trigger={
              <VStack as="button" {...actionItemStyles}>
                <DoorOpen size={18} strokeWidth={1.5} />
                {t('submitLeave')}
              </VStack>
            }
          />
        )}
        {isAdmin && (
          <BulkAttendanceManager
            trigger={
              <VStack as="button" {...actionItemStyles}>
                <ClipboardCheck size={18} strokeWidth={1.5} />
                {t('markAttendance')}
              </VStack>
            }
          />
        )}
      </SimpleGrid>
    </Card>
  );
}
