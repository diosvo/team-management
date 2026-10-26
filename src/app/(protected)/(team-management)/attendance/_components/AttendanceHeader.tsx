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
  const { isAdmin, isPlayer } = usePermissions();

  return (
    <PageHeader title={t('title')}>
      <Visibility isVisible={isAdmin}>
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
