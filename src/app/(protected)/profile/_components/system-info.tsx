'use client';

import { Card, Grid } from '@chakra-ui/react';
import { Clock, UserPlus } from 'lucide-react';

import TextField from '@/components/text-field';

import { User } from '@/drizzle/schema/user';
import { formatDatetime } from '@/utils/formatter';

export default function SystemInfo({ user }: { user: User }) {
  return (
    <Card.Root size="sm" _hover={{ shadow: 'sm' }} transition="all 0.2s">
      <Card.Header backgroundColor="ghostwhite" paddingBlock={4}>
        <Card.Title>System Information</Card.Title>
      </Card.Header>
      <Card.Body>
        <Grid
          templateColumns={{
            base: '1fr',
            md: 'repeat(2, 1fr)',
            xl: 'repeat(3, 1fr)',
          }}
          gap={4}
        >
          <TextField
            label="Account Created"
            icon={UserPlus}
            direction="horizontal"
          >
            {formatDatetime(user.created_at)}
          </TextField>
          <TextField label="Last Updated" icon={Clock} direction="horizontal">
            {formatDatetime(user.updated_at)}
          </TextField>
        </Grid>
      </Card.Body>
    </Card.Root>
  );
}
