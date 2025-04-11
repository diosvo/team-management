'use client';

import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { toaster } from '@/components/ui/toaster';
import { UserRole, userRoles } from '@/drizzle/schema/user';
import { Box, Button, Flex, Input, NumberInput, Table } from '@chakra-ui/react';
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
  .filter((role) => role !== 'SUPER_ADMIN')
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

      <Table.Root variant="outline">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Name</Table.ColumnHeader>
            <Table.ColumnHeader>Email</Table.ColumnHeader>
            <Table.ColumnHeader width="200px">Jersey No.</Table.ColumnHeader>
            <Table.ColumnHeader>DOB</Table.ColumnHeader>
            <Table.ColumnHeader>Join Date</Table.ColumnHeader>
            <Table.ColumnHeader width="200px">Roles</Table.ColumnHeader>
            <Table.ColumnHeader></Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {users.map((user, index) => (
            <Table.Row key={index}>
              <Table.Cell>
                <Field required invalid={!!errors[index]?.name}>
                  <Input
                    variant="flushed"
                    value={user.name}
                    placeholder="Fullname"
                    onChange={(e) => updateUser(index, 'name', e.target.value)}
                  />
                </Field>
              </Table.Cell>
              <Table.Cell>
                <Field required invalid={!!errors[index]?.email}>
                  <Input
                    variant="flushed"
                    type="email"
                    placeholder="abc@gmail.com"
                    value={user.email}
                    onChange={(e) => updateUser(index, 'email', e.target.value)}
                  />
                </Field>
              </Table.Cell>

              <Table.Cell>
                <Field width="100%">
                  <NumberInput.Root variant="flushed" min={0} max={99}>
                    <NumberInput.Control />
                    <NumberInput.Input />
                  </NumberInput.Root>
                </Field>
              </Table.Cell>
              <Table.Cell>
                <Field>
                  <Input
                    variant="flushed"
                    type="date"
                    value={user.joinDate}
                    onChange={(e) =>
                      updateUser(index, 'joinDate', e.target.value)
                    }
                  />
                </Field>
              </Table.Cell>
              <Table.Cell>
                <Field>
                  <Input
                    variant="flushed"
                    type="date"
                    value={user.dob}
                    onChange={(e) => updateUser(index, 'dob', e.target.value)}
                  />
                </Field>
              </Table.Cell>

              <Table.Cell>
                <Select
                  invalid={!!errors[index]?.roles}
                  multiple
                  collection={availableRoles}
                  value={user.roles}
                  onValueChange={({ value }) => {
                    updateUser(index, 'roles', value);
                  }}
                />
              </Table.Cell>
              <Table.Cell>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeUser(index)}
                  disabled={users.length === 1}
                >
                  <Trash2 size={12} />
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
