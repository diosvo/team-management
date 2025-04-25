'use client';

import { Button, Text } from '@chakra-ui/react';

import {
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { User } from '@/drizzle/schema/user';
import { getDefaults } from '@/lib/zod';
import { SELECTABLE_ROLES } from '@/utils/constant';

import { AddUserSchema, AddUserValues } from '@/features/user/schemas/user';

const emptyUser = getDefaults(AddUserSchema) as AddUserValues;

const Roles = SELECTABLE_ROLES.map((role) => ({
  label: role.replace('_', ' '),
  value: role,
}));

export default function AddUser({ users }: { users: Array<User> }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle display="flex" alignItems="baseline" gap={1}>
          <Text>Add </Text>
          <DialogDescription>
            Add a new player to the team roster.
          </DialogDescription>
        </DialogTitle>
      </DialogHeader>
      <DialogBody>AAA</DialogBody>
      <DialogFooter>
        <Button>Add</Button>
      </DialogFooter>
    </>
  );
}
