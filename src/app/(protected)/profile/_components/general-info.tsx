'use client';

import { Avatar, Card, Circle, Float, Text, VStack } from '@chakra-ui/react';

import PageTitle from '@/components/page-title';
import { User } from '@/drizzle/schema';
import { colorState } from '@/utils/helper';

interface GeneralInfoProps {
  user: User;
}

export default function GeneralInfo({ user }: GeneralInfoProps) {
  return (
    <Card.Root _hover={{ shadow: 'sm' }} transition="all 0.2s">
      <Card.Body>
        <VStack gap={6}>
          <Avatar.Root size="2xl" variant="subtle">
            <Avatar.Fallback name={user.name} />
            <Avatar.Image src={user.image as string} />
            <Float placement="bottom-end" offsetX={2} offsetY={2}>
              <Circle
                size={4}
                outline="0.3em solid"
                outlineColor="bg"
                bg={colorState(user.state)}
              />
            </Float>
          </Avatar.Root>

          <VStack gap={2} textAlign="center">
            <PageTitle>{user.name}</PageTitle>

            {user.details.jersey_number && <Text color="GrayText">#5</Text>}
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
