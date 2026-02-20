'use client';

import { Card, HStack, Table, Text } from '@chakra-ui/react';
import { Grid2X2X, TrendingDown, TrendingUp } from 'lucide-react';

import Pagination from '@/components/Pagination';
import { EmptyState } from '@/components/ui/empty-state';

import { AttendanceHistoryRecord } from '@/types/analytics';
import { paginateData, useTrainingFilters } from '@/utils/filters';

export default function AttendanceHistory({
  records,
}: {
  records: Array<AttendanceHistoryRecord>;
}) {
  const [{ page }, setSearchParams] = useTrainingFilters();
  const currentData = paginateData(records, page);

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Training Session History</Card.Title>
        <Card.Description>{records.length} total sessions</Card.Description>
      </Card.Header>

      <Card.Body>
        {records.length === 0 ? (
          <EmptyState icon={<Grid2X2X />} title="No attendance records" />
        ) : (
          <>
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Date</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center" color="green.600">
                    On Time
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center" color="orange.600">
                    Late
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center" color="red.600">
                    Absent
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">
                    Present Rate
                  </Table.ColumnHeader>
                  <Table.ColumnHeader>Trend</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {currentData.map((session, index) => {
                  const prevSession = currentData[index + 1];
                  const trend = prevSession
                    ? session.present_rate - prevSession.present_rate
                    : 0;

                  return (
                    <Table.Row key={index}>
                      <Table.Cell>
                        <Text>{session.date}</Text>
                        <Text fontSize="xs" color="gray.600">
                          {session.day}
                        </Text>
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        {session.on_time}
                      </Table.Cell>
                      <Table.Cell textAlign="center">{session.late}</Table.Cell>
                      <Table.Cell textAlign="center">
                        {session.absent}
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        {session.present_rate}%
                      </Table.Cell>
                      <Table.Cell>
                        {trend > 0 && (
                          <HStack gap={1} color="green.600">
                            <TrendingUp size={14} />
                            <Text fontSize="sm">+{trend}%</Text>
                          </HStack>
                        )}
                        {trend < 0 && (
                          <HStack gap={1} color="red.600">
                            <TrendingDown size={14} />
                            <Text fontSize="sm">{trend}%</Text>
                          </HStack>
                        )}
                        {trend === 0 && (
                          <Text fontSize="sm" color="gray.500">
                            —
                          </Text>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>

            <Pagination
              count={records.length}
              page={page}
              onPageChange={setSearchParams}
            />
          </>
        )}
      </Card.Body>
    </Card.Root>
  );
}
