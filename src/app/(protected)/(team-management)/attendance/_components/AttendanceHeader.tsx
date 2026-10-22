'use client';

import { Button } from '@chakra-ui/react';
import { ClipboardCheck, DoorOpen } from 'lucide-react';

import PageHeader from '@/components/PageHeader';
import Visibility from '@/components/Visibility';

import usePermissions from '@/hooks/use-permissions';

import BulkAttendanceManager from './BulkAttendanceManager';
import SubmitLeaveRequest from './SubmitLeaveRequest';

export default function AttendanceHeader() {
  const { isAdmin, isPlayer } = usePermissions();

  return (
    <PageHeader title="Training Attendance">
      <Visibility isVisible={isAdmin}>
        <BulkAttendanceManager
          trigger={
            <Button colorPalette="green" variant="outline">
              <ClipboardCheck />
              Mark Attendance
            </Button>
          }
        />
      </Visibility>
      <Visibility isVisible={isPlayer}>
        <SubmitLeaveRequest
          trigger={
            <Button>
              <DoorOpen />
              Submit Leave Request
            </Button>
          }
        />
      </Visibility>
    </PageHeader>
  );
}
