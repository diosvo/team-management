'use client';

import { useState } from 'react';

import { Card, Grid, HStack, IconButton, Input } from '@chakra-ui/react';
import { Edit, Save } from 'lucide-react';

import TextField from '@/components/text-field';
import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { Tooltip } from '@/components/ui/tooltip';

import { User } from '@/drizzle/schema';
import { formatDate } from '@/utils/formatter';

export default function PersonalInfo({ user }: { user: User }) {
  const [isEditing, setIsEditing] = useState<boolean>(false);

  return (
    <Card.Root size="sm" _hover={{ shadow: 'sm' }} transition="all 0.2s">
      <HStack
        borderBottom={1}
        borderBottomStyle="solid"
        borderBottomColor="gray.200"
        asChild
      >
        <Card.Header paddingBlock={2}>
          <Card.Title marginRight="auto">Personal Information</Card.Title>
          {isEditing ? (
            <>
              <CloseButton
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(false)}
              />
              <Tooltip content="Save" disabled>
                <IconButton size="sm" disabled>
                  <Save />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Tooltip content="Edit">
              <IconButton
                size="sm"
                variant="subtle"
                onClick={() => setIsEditing(true)}
              >
                <Edit />
              </IconButton>
            </Tooltip>
          )}
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
          {isEditing ? (
            <Field required label="Fullname">
              <Input placeholder="Anynomous" defaultValue={user.name} />
            </Field>
          ) : (
            <TextField label="Fullname">{user.name || '-'}</TextField>
          )}

          {isEditing ? (
            <Field required label="Email">
              <Input
                type="email"
                placeholder="abc@gmail.com"
                defaultValue={user.email}
              />
            </Field>
          ) : (
            <TextField label="Email">{user.email || '-'}</TextField>
          )}

          {isEditing ? (
            <Field label="DOB">
              <Input
                type="date"
                min="1997-01-01"
                defaultValue={user.dob as string}
              />
            </Field>
          ) : (
            <TextField label="DOB">{formatDate(user.dob) || '-'}</TextField>
          )}

          {isEditing ? (
            <Field label="Phone Number">
              <Input max={10} defaultValue={user.phone_number || ''} />
            </Field>
          ) : (
            <TextField label="Phone Number">
              {user.phone_number || '-'}
            </TextField>
          )}

          {isEditing ? (
            <Field label="Citizen ID">
              <Input
                max={10}
                defaultValue={user.citizen_identification || ''}
              />
            </Field>
          ) : (
            <TextField label="Citizen ID">
              {user.citizen_identification || '-'}
            </TextField>
          )}
        </Grid>
      </Card.Body>
    </Card.Root>
  );
}
