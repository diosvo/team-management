'use client';

import { Button, Input, SimpleGrid } from '@chakra-ui/react';
import { ClipboardCheck, DoorOpen } from 'lucide-react';

import { Field } from '@/components/ui/field';
import Visibility from '@/components/Visibility';

import usePermissions from '@/hooks/use-permissions';
import { ALL, ESTABLISHED_DATE } from '@/utils/constant';
import { useAttendanceFilters } from '@/utils/filters';

import BulkAttendanceManager from './BulkAttendanceManager';
import SubmitLeaveRequest from './SubmitLeaveRequest';

export default function AttendanceFilters() {
  const { isAdmin, isPlayer } = usePermissions();
  const [{ date }, setSearchParams] = useAttendanceFilters();

  return (
    <SimpleGrid columns={2} gap={4}>
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
      <Field>
        <Input
          type="date"
          value={date}
          min={ESTABLISHED_DATE}
          onChange={(value) =>
            setSearchParams({
              date: value.target.value,
              status: ALL.value,
              page: 1,
            })
          }
        />
      </Field>
    </SimpleGrid>
  );
}
