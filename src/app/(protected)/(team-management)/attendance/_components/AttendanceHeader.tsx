'use client';

import { Button, HStack } from '@chakra-ui/react';
import { ClipboardCheck, DoorOpen } from 'lucide-react';

import PageTitle from '@/components/PageTitle';
import Visibility from '@/components/Visibility';

import usePermissions from '@/hooks/use-permissions';

import BulkAttendanceManager from './BulkAttendanceManager';
import SubmitLeaveRequest from './SubmitLeaveRequest';

export default function AttendanceHeader() {
  const { isAdmin, isPlayer } = usePermissions();

  return (
    <HStack justifyContent="space-between">
      <PageTitle title="Training Attendance" />
      <HStack gap={{ base: 3, lg: 4 }}>
        <Visibility isVisible={isAdmin}>
          <BulkAttendanceManager
            trigger={
              <Button
                size={{ base: 'sm', md: 'md' }}
                colorPalette="green"
                variant="outline"
              >
                <ClipboardCheck />
                Mark Attendance
              </Button>
            }
          />
        </Visibility>
        <Visibility isVisible={isPlayer}>
          <SubmitLeaveRequest
            trigger={
              <Button size={{ base: 'sm', md: 'md' }}>
                <DoorOpen />
                Submit Leave Request
              </Button>
            }
          />
        </Visibility>
      </HStack>
    </HStack>
  );
}
