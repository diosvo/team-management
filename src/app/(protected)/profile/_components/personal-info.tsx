'use client';

import { useState } from 'react';

import {
  Card,
  Grid,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Edit, Save } from 'lucide-react';

import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { Tooltip } from '@/components/ui/tooltip';

import { User } from '@/drizzle/schema';
import { formatDate } from '@/utils/formatter';

const Info = ({ label, value }: { label: string; value: Nullable<string> }) => {
  return (
    <VStack align="start">
      <Text color="GrayText" fontSize={14}>
        {label}
      </Text>
      <Text>{value || '-'}</Text>
    </VStack>
  );
};

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
            <Info label="Fullname" value={user.name} />
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
            <Info label="Email" value={user.email} />
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
            <Info label="DOB" value={formatDate(user.dob)} />
          )}

          {isEditing ? (
            <Field label="Phone Number">
              <Input max={10} defaultValue={user.phone_number || ''} />
            </Field>
          ) : (
            <Info label="Phone Number" value={user.phone_number} />
          )}

          {isEditing ? (
            <Field label="Citizen ID">
              <Input
                max={10}
                defaultValue={user.citizen_identification || ''}
              />
            </Field>
          ) : (
            <Info label="Citizen ID" value={user.citizen_identification} />
          )}
        </Grid>
      </Card.Body>
    </Card.Root>
  );
}
