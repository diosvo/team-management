'use client';

import { Input, SimpleGrid } from '@chakra-ui/react';

import Authorized from '@/components/Authorized';
import { Field } from '@/components/ui/field';

import usePermissions from '@/hooks/use-permissions';
import { ALL, ESTABLISHED_DATE } from '@/utils/constant';
import { useAttendanceFilters } from '@/utils/filters';

import Visibility from '@/components/Visibility';
import BulkAttendanceManager from './BulkAttendanceManager';
import SubmitLeaveRequest from './SubmitLeaveRequest';

export default function AttendanceFilters() {
  const { isAdmin, isPlayer } = usePermissions();
  const [{ date }, setSearchParams] = useAttendanceFilters();

  return (
    <SimpleGrid columns={2} gap={4}>
      <Authorized action="create">
        <Visibility isVisible={isAdmin}>
          <BulkAttendanceManager />
        </Visibility>
      </Authorized>
      <Authorized action="create">
        <Visibility isVisible={isPlayer}>
          <SubmitLeaveRequest />
        </Visibility>
      </Authorized>
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
