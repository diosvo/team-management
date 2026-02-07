'use client';

import { useRef, useState, useTransition } from 'react';

import {
  Button,
  CloseButton,
  Dialog,
  DialogOpenChangeDetails,
  HStack,
  Input,
  Portal,
  Span,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardCheck, SaveAll } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';
import { PlayerSelection } from '@/components/user/PlayerSelection';
import Visibility from '@/components/Visibility';

import { ALL, CURRENT_DATE, ESTABLISHED_DATE } from '@/utils/constant';
import { AttendanceStatus } from '@/utils/enum';
import { useAttendanceFilters } from '@/utils/filters';

import { User } from '@/drizzle/schema';
import useQuery from '@/hooks/use-query';

import { submitLeave } from '@/actions/attendance';
import { getActivePlayers } from '@/actions/user';
import {
  BulkAttendanceSchema,
  BulkAttendanceSchemaValues,
} from '@/schemas/attendance';

export default function BulkAttendanceManager() {
  const [, setSearchParams] = useAttendanceFilters();
  const { data: activePlayers } = useQuery(getActivePlayers);
  const [selection, setSelection] = useState<Array<User>>([]);

  const [open, setOpen] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  const {
    control,
    reset,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<BulkAttendanceSchemaValues>({
    resolver: zodResolver(BulkAttendanceSchema),
    defaultValues: {
      date: CURRENT_DATE,
      attendances: [],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'attendances',
  });

  const handleOpenChange = (details: DialogOpenChangeDetails) => {
    const { open } = details;
    setOpen(open);

    if (!open) {
      reset();
      setSelection([]);
    }
  };

  const handlePlayersChange = (players: Array<User>) => {
    setSelection(players);
    const currentPlayerIds = fields.map(({ player_id }) => player_id);
    const selectedPlayerIds = players.map(({ id }) => id);

    // Remove fields for unselected players
    fields.forEach(({ player_id }, index) => {
      if (!selectedPlayerIds.includes(player_id)) {
        remove(index);
      }
    });

    // Add fields for newly selected players
    players.forEach(({ id }) => {
      if (!currentPlayerIds.includes(id)) {
        append({
          player_id: id,
          status: AttendanceStatus.ABSENT,
          reason: '',
        });
      }
    });
  };

  const onSubmit = (values: BulkAttendanceSchemaValues) => {
    const parsed = BulkAttendanceSchema.parse(values);

    if (parsed.attendances.length === 0 && activePlayers) {
      parsed.attendances = activePlayers.map((player) => ({
        player_id: player.id,
        status: AttendanceStatus.ON_TIME,
      }));
    }

    const id = toaster.create({
      type: 'loading',
      title: 'Submitting leave requests...',
    });

    startTransition(async () => {
      const results = await Promise.all(
        parsed.attendances.map((attendance) =>
          submitLeave({
            player_id: attendance.player_id,
            date: parsed.date,
            status: attendance.status,
            reason: attendance.reason,
          }),
        ),
      );

      const successCount = results.filter(({ success }) => success).length;
      const hasErrors = successCount < results.length;

      toaster.update(id, {
        type: hasErrors ? 'warning' : 'success',
        title: hasErrors
          ? `Failed to submit leave requests for ${results.length - successCount} player(s).`
          : `Submitted leave requests for ${successCount} player(s).`,
        description:
          hasErrors &&
          results.map(({ message }, index) => (
            <Text key={index}>&bull; {message}</Text>
          )),
      });

      if (!hasErrors) {
        setOpen(false);
        setSearchParams({ date: parsed.date, status: ALL.value, page: 1 });
      }
    });
  };

  const attendances = watch('attendances') || [];
  const absentCount = attendances.filter(
    ({ status }) => status === AttendanceStatus.ABSENT,
  ).length;
  const lateCount = attendances.filter(
    ({ status }) => status === AttendanceStatus.LATE,
  ).length;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <Button
          size={{ base: 'sm', md: 'md' }}
          colorPalette="green"
          variant="outline"
        >
          <ClipboardCheck />
          Mark Attendance
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner as="form" onSubmit={handleSubmit(onSubmit)}>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Mark Bulk Attendance</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack alignItems="stretch" gap={4}>
                <HStack>
                  <Field required label="Date">
                    <Input
                      type="date"
                      min={ESTABLISHED_DATE}
                      {...register('date')}
                    />
                  </Field>
                  <PlayerSelection
                    contentRef={contentRef}
                    selection={selection}
                    onSelectionChange={handlePlayersChange}
                  />
                </HStack>
                <Visibility isVisible={selection.length > 0}>
                  <Table.Root>
                    <Table.Caption marginTop={3} color="GrayText">
                      <Span color="red">Absent</Span>: {absentCount}
                      &nbsp; &bull; &nbsp;
                      <Span color="orange">Late</Span>: {lateCount}
                    </Table.Caption>
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>Name</Table.ColumnHeader>
                        <Tooltip
                          showArrow
                          content="Check for absent, uncheck for late."
                        >
                          <Table.ColumnHeader textAlign="center">
                            Absent
                          </Table.ColumnHeader>
                        </Tooltip>
                        <Table.ColumnHeader>Reason</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {fields.map(({ id, player_id }, index) => {
                        const player = selection.find(
                          ({ id }) => id === player_id,
                        );
                        const isAbsent =
                          watch(`attendances.${index}.status`) ===
                          AttendanceStatus.ABSENT;

                        return (
                          <Table.Row key={id}>
                            <Table.Cell
                              _hover={{
                                cursor: 'pointer',
                                color: 'tomato',
                                textDecoration: 'line-through',
                                transition: 'all 0.2s',
                              }}
                              onClick={() =>
                                handlePlayersChange(
                                  selection.filter(
                                    ({ id }) => id !== player_id,
                                  ),
                                )
                              }
                            >
                              {player?.name}
                            </Table.Cell>
                            <Table.Cell textAlign="center">
                              <Checkbox
                                checked={isAbsent}
                                variant="outline"
                                colorPalette="red"
                                onCheckedChange={(details) => {
                                  setValue(
                                    `attendances.${index}.status`,
                                    details.checked
                                      ? AttendanceStatus.ABSENT
                                      : AttendanceStatus.LATE,
                                  );
                                }}
                              />
                            </Table.Cell>
                            <Table.Cell>
                              <Input
                                maxLength={128}
                                placeholder="..."
                                {...register(`attendances.${index}.reason`)}
                              />
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table.Root>
                </Visibility>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer justifyContent="space-between">
              <Text color="GrayText" fontStyle="italic">
                <Span textDecoration="underline">
                  {absentCount > 0 || lateCount > 0 ? 'The remaining' : 'All'}
                </Span>
                &nbsp;players will be marked as&nbsp;
                <Span color="green" fontWeight="bold">
                  on time
                </Span>
                .
              </Text>
              <Button
                type="submit"
                loadingText="Submitting..."
                loading={isPending}
                disabled={!isValid || isPending}
              >
                <SaveAll /> Submit
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
