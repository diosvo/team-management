'use client';

import { useState } from 'react';

import { Card, Grid, HStack, IconButton, Input, Text } from '@chakra-ui/react';
import { Edit } from 'lucide-react';

import { Field } from '@/components/ui/field';

import { User } from '@/drizzle/schema';
import { formatDate } from '@/utils/formatter';

export default function PersonalInfo({ user }: { user: User }) {
  const [isEditing, setIsEditing] = useState<boolean>(false);

  return (
    <Card.Root _hover={{ shadow: 'sm' }} transition="all 0.2s">
      <HStack
        justifyContent="space-between"
        borderBottom={1}
        borderBottomStyle="solid"
        borderBottomColor="gray.200"
        asChild
      >
        <Card.Header paddingBlock={2}>
          <Card.Title>Personal Information</Card.Title>
          <IconButton variant="subtle" onClick={() => setIsEditing(!isEditing)}>
            <Edit />
          </IconButton>
        </Card.Header>
      </HStack>
      <Card.Body>
        <Grid
          templateColumns={{
            base: '1fr',
            md: 'repeat(2, 1fr)',
            xl: 'repeat(3, 1fr)',
          }}
          gap={4}
        >
          <Field required label="Fullname">
            {isEditing ? (
              <Input placeholder="Anynomous" defaultValue={user.name} />
            ) : (
              <Text>{user.name}</Text>
            )}
          </Field>

          <Field required label="Email">
            {isEditing ? (
              <Input
                type="email"
                placeholder="abc@gmail.com"
                defaultValue={user.email}
              />
            ) : (
              <Text>{user.email}</Text>
            )}
          </Field>

          <Field label="DOB">
            {isEditing ? (
              <Input
                type="date"
                min="1997-01-01"
                defaultValue={user.dob as string}
              />
            ) : (
              <Text>{formatDate(user.dob)}</Text>
            )}
          </Field>

          <Field label="Phone Number">
            {isEditing ? (
              <Input max={10} defaultValue={user.phone_number || ''} />
            ) : (
              <Text>{user.phone_number || '-'}</Text>
            )}
          </Field>

          <Field label="Citizen ID">
            {isEditing ? (
              <Input
                max={10}
                defaultValue={user.citizen_identification || ''}
              />
            ) : (
              <Text>{user.citizen_identification || '-'}</Text>
            )}
          </Field>
        </Grid>
      </Card.Body>
    </Card.Root>
  );
}
