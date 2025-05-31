'use client';

import { useState } from 'react';

import {
  Badge,
  Card,
  Grid,
  HStack,
  IconButton,
  Input,
  Text,
} from '@chakra-ui/react';
import { formatDistanceToNow } from 'date-fns';
import { Edit, LucideClock9, Save } from 'lucide-react';

import { CloseButton } from '@/components/ui/close-button';
import { Field } from '@/components/ui/field';
import { Tooltip } from '@/components/ui/tooltip';

import { User } from '@/drizzle/schema';
import { formatDate } from '@/utils/formatter';
import { colorRole, hasPermissions } from '@/utils/helper';

export default function TeamInfo({ user }: { user: User }) {
  const { isAdmin } = hasPermissions(user.role);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  return (
    <Card.Root _hover={{ shadow: 'sm' }} transition="all 0.2s">
      <HStack
        borderBottom={1}
        borderBottomStyle="solid"
        borderBottomColor="gray.200"
        asChild
      >
        <Card.Header paddingBlock={2}>
          <Card.Title marginRight="auto">Team Information</Card.Title>
          {isEditing ? (
            <>
              <CloseButton
                variant="outline"
                onClick={() => setIsEditing(false)}
              />
              <Tooltip content="Save">
                <IconButton disabled>
                  <Save />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Tooltip content="Edit">
              <IconButton variant="subtle" onClick={() => setIsEditing(true)}>
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
          <Field label="Jersey Number">
            {isEditing ? (
              <Input
                placeholder="Anynomous"
                defaultValue={user.details.jersey_number || ''}
              />
            ) : user.details.jersey_number ? (
              <Badge variant="outline" rounded="full">
                {user.details.jersey_number}
              </Badge>
            ) : (
              '-'
            )}
          </Field>

          <Field label="Role">
            {isEditing && isAdmin ? (
              <Input placeholder="Anynomous" defaultValue={user.role} />
            ) : (
              <Badge
                variant="subtle"
                colorPalette={colorRole(user.role)}
                rounded="full"
                size="md"
              >
                {user.role}
              </Badge>
            )}
          </Field>

          <Field label="Position">
            {isEditing && isAdmin ? (
              <Input
                placeholder="Unknown"
                defaultValue={user.details.position || ''}
              />
            ) : user.details.position ? (
              <Badge variant="outline" rounded="full">
                {user.details.position}
              </Badge>
            ) : (
              '-'
            )}
          </Field>
        </Grid>
      </Card.Body>
      <Card.Footer>
        {user.join_date && (
          <HStack gap={1} marginTop={4}>
            <LucideClock9 size={14} color="GrayText" />
            <Text color="GrayText">Joined Date:</Text>
            {formatDate(user.join_date)}
            <Text fontSize="sm" color="GrayText">
              (
              {formatDistanceToNow(user.join_date, {
                addSuffix: true,
              })}
              )
            </Text>
          </HStack>
        )}
      </Card.Footer>
    </Card.Root>
  );
}
