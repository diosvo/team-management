'use client';

import { useState } from 'react';

import { Box, Button, HStack, Input, Text } from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';
import { ZodError } from 'zod';

import { DataTable, TableColumn } from '@/components/data-table';
import { Alert } from '@/components/ui/alert';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { toaster } from '@/components/ui/toaster';
import { SELECTABLE_ROLES, User } from '@/drizzle/schema/user';
import { addUsers } from '@/features/user/actions/user';
import { AddUserSchema, AddUserValues } from '@/features/user/schemas/user';
import { getDefaults } from '@/lib/zod';

const emptyUser = getDefaults(AddUserSchema) as AddUserValues;

const Roles = SELECTABLE_ROLES.map((role) => ({
  label: role.replace('_', ' '),
  value: role,
}));

export default function AddUsers({ roster }: { roster: Array<User> }) {
  const [users, setUsers] = useState<AddUserValues[]>([{ ...emptyUser }]);
  const [errors, setErrors] = useState<Record<string, string>[]>([{}]);

  const addUser = () => {
    setUsers([...users, { ...emptyUser }]);
    setErrors([...errors, {}]);
  };

  const removeUser = (index: number) => {
    if (users.length > 1) {
      const newUsers = [...users];
      newUsers.splice(index, 1);
      setUsers(newUsers);

      const newErrors = [...errors];
      newErrors.splice(index, 1);
      setErrors(newErrors);
    }
  };

  const updateUser = (
    index: number,
    field: keyof AddUserValues,
    value: string | string[]
  ) => {
    const newUsers = [...users];
    newUsers[index] = { ...newUsers[index], [field]: value };
    setUsers(newUsers);

    // Clear error when field is updated
    if (errors[index]?.[field]) {
      const newErrors = [...errors];
      const userErrors = { ...newErrors[index] };
      delete userErrors[field];
      newErrors[index] = userErrors;
      setErrors(newErrors);
    }
  };

  const validateForm = (): boolean => {
    const newErrors = users.map((user, currentIndex) => {
      try {
        // Validate each user against the schema
        AddUserSchema.parse(user);

        const userErrors: Record<string, string> = {};

        // Check if email already exists in the roster
        const emailExistsInRoster = roster.some(
          (rosterUser) =>
            rosterUser.email.toLowerCase() === user.email.toLowerCase()
        );

        if (emailExistsInRoster) {
          userErrors.email = 'Email already exists in the roster';
        }

        // Check for duplicate emails in current users being added
        const isDuplicateEmail = users.some(
          (otherUser, otherIndex) =>
            currentIndex !== otherIndex &&
            otherUser.email.toLowerCase() === user.email.toLowerCase()
        );

        if (isDuplicateEmail) {
          userErrors.email = 'Duplicate email in the form';
        }

        return userErrors;
      } catch (error) {
        // Handle Zod validation errors
        if (error instanceof ZodError) {
          const userErrors: Record<string, string> = {};
          error.errors.forEach((err) => {
            const field = err.path[0] as keyof AddUserValues;
            userErrors[field] = err.message;
          });
          return userErrors;
        }
        return {};
      }
    });

    setErrors(newErrors);
    return newErrors.every((userError) => Object.keys(userError).length === 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toaster.error({
        title: 'Validation Error',
        description: 'Please check the form for errors',
      });
      return;
    }

    const { error, message } = await addUsers(users);

    toaster.create({
      type: error ? 'error' : 'info',
      description: message,
    });

    if (!error) {
      // Reset form after successful submission
      setUsers([{ ...emptyUser }]);
      setErrors([{}]);
    }
  };

  const columns: Array<TableColumn<AddUserValues>> = [
    {
      header: 'Name',
      accessor: 'name',
      render: (_, row, index) => (
        <Field required invalid={!!errors[index]?.name}>
          <Input
            variant="flushed"
            value={row.name}
            placeholder="Fullname"
            onChange={(e) => updateUser(index, 'name', e.target.value)}
          />
        </Field>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (_, row, index) => (
        <Field required invalid={!!errors[index]?.email}>
          <Input
            variant="flushed"
            type="email"
            placeholder="abc@gmail.com"
            value={row.email}
            onChange={(e) => updateUser(index, 'email', e.target.value)}
          />
        </Field>
      ),
    },
    {
      header: 'Roles',
      accessor: 'roles',
      width: '250px',
      render: (_, row, index) => (
        <Select
          multiple
          invalid={!!errors[index]?.roles}
          collection={Roles}
          value={row.roles}
          onValueChange={({ value }) => {
            updateUser(index, 'roles', value);
          }}
        />
      ),
    },
  ];

  return (
    <Box as="form" onSubmit={handleSubmit} w="full">
      <HStack alignItems="flex-start" mb={4}>
        <Text textStyle="md" fontWeight="semibold" mr="auto">
          Add Users
        </Text>
        <>
          <Button size="sm" variant="subtle" onClick={addUser}>
            <Plus size={16} /> Add Row
          </Button>
          <Button type="submit" size="sm">
            Submit
          </Button>
        </>
      </HStack>

      {errors && (
        <Alert status="error">
          <pre>{JSON.stringify(errors)}</pre>
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={users}
        actions={(_, index) => (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => removeUser(index)}
            disabled={users.length === 1}
          >
            <Trash2 size={12} />
          </Button>
        )}
      />
    </Box>
  );
}
