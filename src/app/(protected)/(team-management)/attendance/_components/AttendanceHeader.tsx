'use client';

import { Button } from '@chakra-ui/react';
import { ClipboardCheck, DoorOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';

import PageHeader from '@/components/PageHeader';
import Visibility from '@/components/Visibility';

import usePermissions from '@/hooks/use-permissions';

import BulkAttendanceManager from './BulkAttendanceManager';
import SubmitLeaveRequest from './SubmitLeaveRequest';

export default function AttendanceHeader() {
  const t = useTranslations('attendance');
  const { can, isPlayer } = usePermissions();
  // Mirrors the server: `submitLeave` for other members needs `attendance:edit`,
  // which COACH and SUPER_ADMIN hold.
  const canMark = can('attendance', 'edit');

  return (
    <PageHeader title={t('title')}>
      <Visibility isVisible={canMark}>
        <BulkAttendanceManager
          trigger={
            <Button colorPalette="green" variant="outline">
              <ClipboardCheck />
              {t('markAttendance')}
            </Button>
          }
        />
      </Visibility>
      <Visibility isVisible={isPlayer}>
        <SubmitLeaveRequest
          trigger={
            <Button>
              <DoorOpen />
              {t('submitLeaveRequest')}
            </Button>
          }
        />
      </Visibility>
    </PageHeader>
  );
}
