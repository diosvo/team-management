'use client';

import Image from 'next/image';

import { Box, Button, Flex, Separator, Text, VStack } from '@chakra-ui/react';

import Icon from '@/app/icon.png';

interface EmailTemplateProps {
  token: string;
  name: string;
}

export default function EmailTemplate({ token, name }: EmailTemplateProps) {
  const confirmLink = `${process.env.APP_URL}/email-confirmation?token=${token}`;

  return (
    <Box
      maxWidth="560px"
      mx="auto"
      p="6"
      borderWidth="1px"
      borderRadius="md"
      borderColor="border.disabled"
    >
      <Box mb="4">
        <Image
          src={Icon}
          width={48}
          height={48}
          alt="Saigon Rovers Basketball Club"
        />
      </Box>

      <Separator />

      <VStack gap="4" pt="4" pb="6" align="stretch">
        <Text textStyle="sm">
          Hi <strong>{name}</strong>,
        </Text>
        <Text textStyle="sm">
          Thank you for registering with Saigon Rovers Basketball Club. Please
          confirm your email address to complete your registration. If you did
          not create an account, you can ignore this email.
        </Text>

        <Flex
          align="center"
          direction="column"
          p="6"
          borderRadius="md"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="gray.200"
        >
          <Button backgroundColor="primary" color="white" asChild>
            <a href={confirmLink}>Confirm your email</a>
          </Button>
          <Text textStyle="xs" mt="2" color="gray.500">
            This link will only be valid for the next hour.
          </Text>
        </Flex>
      </VStack>

      <Box color="gray.600" textStyle="xs" textAlign="center" mt="6">
        <Text>© 2024 Saigon Rovers Basketball Club</Text>
      </Box>
    </Box>
  );
}
