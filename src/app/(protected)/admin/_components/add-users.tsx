'use client';

import { DataTable, TableColumn } from '@/components/data-table';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { toaster } from '@/components/ui/toaster';
import { UserRole, userRoles } from '@/drizzle/schema/user';
import { Box, Button, Flex, Input, NumberInput } from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface UserFormData {
  name: string;
  email: string;
  jerseyNumber: string;
  roles: UserRole[];
  dob: string;
  joinDate: string;
}

const emptyUser: UserFormData = {
  name: '',
  email: '',
  jerseyNumber: '',
  roles: ['PLAYER'],
  dob: '',
  joinDate: '',
};

// Filter out SUPER_ADMIN from available roles
const availableRoles = userRoles
  .filter((role) => role !== userRoles[0])
  .map((role) => ({
    label: role.replace('_', ' '),
    value: role,
  }));

export default function AddUsers() {
  const [users, setUsers] = useState<UserFormData[]>([{ ...emptyUser }]);
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

  const updateUser = (index: number, field: keyof UserFormData, value: any) => {
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
    } catch (error) {
      toaster.error({
        title: 'Error',
        description: 'Failed to add users',
      });
    }
  };

  const columns: TableColumn<UserFormData>[] = [
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
      header: 'Jersey No.',
      accessor: 'jerseyNumber',
      width: '200px',
      render: (_, row, index) => (
        <Field width="100%">
          <NumberInput.Root variant="flushed" min={0} max={99}>
            <NumberInput.Control />
            <NumberInput.Input
              value={row.jerseyNumber}
              onChange={(e) => {
                const val = e.target.value;
                updateUser(index, 'jerseyNumber', val);
              }}
            />
          </NumberInput.Root>
        </Field>
      ),
    },
    {
      header: 'DOB',
      accessor: 'dob',
      render: (_, row, index) => (
        <Field>
          <Input
            variant="flushed"
            type="date"
            value={row.dob}
            onChange={(e) => updateUser(index, 'dob', e.target.value)}
          />
        </Field>
      ),
    },
    {
      header: 'Join Date',
      accessor: 'joinDate',
      render: (_, row, index) => (
        <Field>
          <Input
            variant="flushed"
            type="date"
            value={row.joinDate}
            onChange={(e) => updateUser(index, 'joinDate', e.target.value)}
          />
        </Field>
      ),
    },
    {
      header: 'Roles',
      accessor: 'roles',
      width: '200px',
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
      <Flex justifyContent="flex-end" mb={4}>
        <Button onClick={addUser} mr={2}>
          <Plus size={16} /> Add Row
        </Button>
        <Button type="submit" colorScheme="blue">
          Submit
        </Button>
      </Flex>

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
