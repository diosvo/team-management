'use client';

import {
  Avatar,
  Badge,
  Card,
  Circle,
  Float,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';

import { User } from '@/drizzle/schema';
import { colorState } from '@/utils/helper';

interface GeneralInfoProps {
  user: User;
}

export default function GeneralInfo({ user }: GeneralInfoProps) {
  return (
    <Card.Root>
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
            <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold">
              {user.name}
            </Text>

            <HStack gap={3} wrap="wrap" justify="center">
              {user.details.jersey_number && (
                <Badge size="lg" variant="surface" colorPalette="blue">
                  #{user.details.jersey_number}
                </Badge>
              )}

              <Badge size="lg" variant="outline">
                {user.role}
              </Badge>

              {user.details.position && (
                <Badge size="lg" variant="outline" colorPalette="purple">
                  {user.details.position}
                </Badge>
              )}
            </HStack>

            <Badge
              size="lg"
              variant="surface"
              colorPalette={colorState(user.state)}
            >
              {user.state}
            </Badge>
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
