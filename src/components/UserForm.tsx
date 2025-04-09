'use client';

import { Field } from '@/components/ui/field';
import {
  NumberInputField,
  NumberInputRoot,
} from '@/components/ui/number-input';
import { toaster } from '@/components/ui/toaster';
import { UserRole, userRoles } from '@/drizzle/schema/user';
import { Box, Button, HStack, Input, Stack } from '@chakra-ui/react';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Select } from './ui/select';

interface UserFormData {
  name: string;
  email: string;
  jerseyNumber: string;
  roles: UserRole[];
}

const emptyUser: UserFormData = {
  name: '',
  email: '',
  jerseyNumber: '',
  roles: ['PLAYER'],
};

// Filter out SUPER_ADMIN from available roles
const availableRoles = userRoles
  .filter((role) => role !== 'SUPER_ADMIN')
  .map((role) => ({
    label: role.replace('_', ' '),
    value: role,
  }));

export default function UserForm() {
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
      <Stack gap={6}>
        <HStack justifyContent="flex-end">
          <Button onClick={addUser}>
            <Plus /> More
          </Button>
          <Button type="submit">Add</Button>
        </HStack>

        {users.map((user, index) => (
          <Box
            key={index}
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            position="relative"
          >
            <Button
              variant="plain"
              size="sm"
              position="absolute"
              top={0}
              right={0}
              onClick={() => removeUser(index)}
              disabled={users.length === 1}
            >
              <X />
            </Button>

            <HStack gap={4} alignItems="flex-start" w="full">
              <Field
                required
                label="Name"
                invalid={!!errors[index]?.name}
                errorText={errors[index]?.name}
              >
                <Input
                  value={user.name}
                  onChange={(e) => updateUser(index, 'name', e.target.value)}
                />
              </Field>

              <Field
                required
                label="Email"
                invalid={!!errors[index]?.email}
                errorText={errors[index]?.email}
              >
                <Input
                  type="email"
                  value={user.email}
                  onChange={(e) => updateUser(index, 'email', e.target.value)}
                />
              </Field>

              <Select
                label="Roles"
                invalid={!!errors[index]?.roles}
                // errorText={errors[index]?.roles}
                multiple
                collection={availableRoles}
                value={user.roles}
                onValueChange={({ value }) => {
                  updateUser(index, 'roles', value);
                }}
              />

              <Field label="Jersey Number">
                <NumberInputRoot>
                  <NumberInputField />
                </NumberInputRoot>
              </Field>
            </HStack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
