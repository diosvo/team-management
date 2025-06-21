'use client';

import { RefObject, useMemo } from 'react';

import {
  Box,
  Center,
  Flex,
  Heading,
  Separator,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { getYear } from 'date-fns';

import { User } from '@/drizzle/schema/user';
import { formatDate } from '@/utils/formatter';

export interface RegistrationFormProps {
  info: {
    name: string;
    type: string;
    maxPlayers: number;
  };
  players: Array<User>;
  contentRef: RefObject<Nullable<HTMLDivElement>>;
}

const PhotoPlaceholder = () => (
  <Center>
    <Flex
      width="94px"
      height="132px"
      alignItems="center"
      justifyContent="center"
      border="1px solid lightgray"
    >
      3x4
    </Flex>
  </Center>
);

export default function PreviewForm({
  info,
  players = [],
  contentRef,
}: RegistrationFormProps) {
  // Split players into chunks based on 5 players per table
  const playerChunks = useMemo(() => {
    if (players.length === 0) {
      return [[]]; // Return one empty chunk to show the table structure
    }

    const chunks = [];
    for (let i = 0; i < players.length; i += 5) {
      chunks.push(players.slice(i, i + 5));
    }

    return chunks;
  }, [players]);

  const createTableData = (playerChunk: Array<User>) => {
    const fields = [
      {
        key: 'name',
        label: 'Họ và tên',
        getValue: (player: User) => player.name,
      },
      {
        key: 'dob',
        label: 'Ngày tháng năm sinh',
        getValue: (player: User) => formatDate(player.dob),
      },
      {
        key: 'citizen_identification',
        label: 'CCCD',
        getValue: (player: User) => player.citizen_identification,
      },
      {
        key: 'jersey_number',
        label: 'Số áo',
        getValue: (player: User) => player.details?.jersey_number?.toString(),
      },
      {
        key: 'phone_number',
        label: 'SĐT',
        getValue: (player: User) => player.phone_number,
      },
    ];

    return fields.map((field) => ({
      label: field.label,
      values: playerChunk.map((player) => field.getValue(player)),
    }));
  };

  const renderTable = (playerChunk: Array<User>, tableIndex: number) => {
    return (
      <Table.Root key={tableIndex} size="md" variant="outline" showColumnBorder>
        <Table.Body>
          {/* Photo row */}
          <Table.Row>
            <Table.Cell width="15%"></Table.Cell>
            {Array.from({ length: 5 }).map((_, index) => (
              <Table.Cell key={index} width="17%">
                {playerChunk[index] ? (
                  <PhotoPlaceholder />
                ) : (
                  <Box height="132px"></Box>
                )}
              </Table.Cell>
            ))}
          </Table.Row>

          {/* Data rows */}
          {createTableData(playerChunk).map((row) => (
            <Table.Row key={row.label}>
              <Table.Cell>{row.label}</Table.Cell>
              {Array.from({ length: 5 }).map((_, colIndex) => (
                <Table.Cell key={colIndex}>
                  {row.values[colIndex] || ''}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    );
  };

  return (
    <VStack gap={4} ref={contentRef} minHeight="297mm">
      <VStack gap={3} alignItems="center">
        <Heading as="h2" fontSize="lg">
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
        </Heading>
        <Text fontSize="md">Độc lập - Tự do - Hạnh phúc</Text>

        <Separator width="xl" />

        <Heading as="h1" fontSize="xl">
          DANH SÁCH ĐĂNG KÝ THI ĐẤU GIẢI{' '}
          {info.name ? info.name.toUpperCase() : '...'} {info.type} NĂM{' '}
          {getYear(new Date())}
        </Heading>
        <Text fontSize="lg">Tên Đội: Saigon Rovers</Text>
      </VStack>

      {playerChunks.map((chunk, index) => (
        <VStack key={index} gap={4} width="full">
          {renderTable(chunk, index)}
        </VStack>
      ))}
    </VStack>
  );
}
