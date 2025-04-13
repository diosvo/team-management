'use client';

import { useState } from 'react';

import { Box, Button, HStack, Input, Text } from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';

import { DataTable, TableColumn } from '@/components/data-table';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { toaster } from '@/components/ui/toaster';
import { User, UserRole, userRoles } from '@/drizzle/schema/user';

interface AddUser {
  name: string;
  email: string;
  roles: Array<UserRole>;
}

const emptyUser: AddUser = {
  name: '',
  email: '',
  roles: ['PLAYER'],
};

// Filter out SUPER_ADMIN from available roles
const availableRoles = userRoles
  .filter((role) => role !== 'SUPER_ADMIN')
  .map((role) => ({
    label: role.replace('_', ' '),
    value: role,
  }));

export default function AddUsers({ roster }: { roster: Array<User> }) {
  const [users, setUsers] = useState<AddUser[]>([{ ...emptyUser }]);
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
    field: keyof AddUser,
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
    const newErrors = users.map((user) => {
      const userErrors: Record<string, string> = {};
      if (!user.name) userErrors.name = 'Name is required';
      if (!user.email) userErrors.email = 'Email is required';
      if (!/^\S+@\S+\.\S+$/.test(user.email))
        userErrors.email = 'Invalid email format';
      if (!user.roles.length)
        userErrors.roles = 'At least one role is required';
      return userErrors;
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

    try {
      // Here you would send the data to your API
      console.info('Submitting users %s', users);
      toaster.success({
        title: 'Success',
        description: `${users.length} user(s) added successfully!`,
      });

      // Reset form after successful submission
      setUsers([{ ...emptyUser }]);
      setErrors([{}]);
    } catch {
      toaster.error({
        title: 'Error',
        description: 'Failed to add users',
      });
    }
  };

  const columns: Array<TableColumn<AddUser>> = [
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
          invalid={!!errors[index]?.roles}
          multiple
          collection={availableRoles}
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
          <Button size="sm" variant="subtle" mr={2} onClick={addUser}>
            <Plus size={16} /> Add Row
          </Button>
          <Button type="submit" size="sm">
            Submit
          </Button>
        </>
      </HStack>

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
