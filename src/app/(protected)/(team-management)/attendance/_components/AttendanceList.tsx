'use client';

import { createListCollection, HStack, Portal, Select } from '@chakra-ui/react';

import SearchInput from '@/components/SearchInput';
import { Status } from '@/components/ui/status';

import { ALL, ATTENDANCE_STATUS_SELECTION } from '@/utils/constant';
import { useAttendanceFilters } from '@/utils/filters';
import { colorAttendanceStatus } from '@/utils/helper';

import { AttendanceWithPlayer } from '@/types/attendance';
import AttendanceTable from './AttendanceTable';

const statuses = createListCollection({
  items: [ALL, ...ATTENDANCE_STATUS_SELECTION],
});

export default function AttendanceList({
  attendances,
}: {
  attendances: Array<AttendanceWithPlayer>;
}) {
  const [{ q, status }, setSearchParams] = useAttendanceFilters();
  const filteredAttendances = attendances.filter((item) => {
    const matchesSearch = item.player.user.name
      .toLowerCase()
      .includes(q.toLowerCase());
    const matchesStatus = status === ALL.value || item.status === status;

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <HStack gap={4}>
        <SearchInput />
        <Select.Root
          width="xs"
          size={{ base: 'sm', md: 'md' }}
          collection={statuses}
          value={[status]}
          onValueChange={({ value }) =>
            setSearchParams({ status: value[0], page: 1 })
          }
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger>
              <HStack>
                <Status colorPalette={colorAttendanceStatus(status)} />
                <Select.ValueText placeholder="Status" />
              </HStack>
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {statuses.items.map((status) => (
                  <Select.Item item={status} key={status.value}>
                    <HStack>
                      <Status
                        colorPalette={colorAttendanceStatus(status.value)}
                      />
                      {status.label}
                      <Select.ItemIndicator />
                    </HStack>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      </HStack>
      <AttendanceTable attendances={filteredAttendances} />
    </>
  );
}
