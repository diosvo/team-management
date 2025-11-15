'use client';

import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import {
  Button,
  Link as ChakraLink,
  Heading,
  List,
  VStack,
} from '@chakra-ui/react';
import { CircleCheck, CircleDashed } from 'lucide-react';

import { Alert } from '@/components/ui/alert';
import { Field } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { toaster } from '@/components/ui/toaster';

import authClient from '@/lib/auth-client';
import { LOGIN_PATH } from '@/routes';

const PASSWORD_RULES = [
  {
    text: 'Be between 8 and 128 characters long',
    regex: /^.{8,128}$/,
  },
  {
    text: 'Contain at least one letter',
    regex: /[a-zA-Z]/,
  },
  {
    text: 'Contain at least one number',
    regex: /[0-9]/,
  },
  {
    text: 'Contain at least one special character',
    regex: /[^a-zA-Z0-9]/,
  },
] as const;

export default function NewPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const isValid = PASSWORD_RULES.every((rule) => rule.regex.test(password));

  async function onSubmit(newPassword: string) {
    await authClient.resetPassword(
      {
        newPassword,
        token,
      },
      {
        onRequest: () => setIsLoading(true),
        onError: ({ error }) => setError(error.message),
        onSuccess: () => {
          toaster.success({
            title: 'Create new password successful.',
          });
          router.push(LOGIN_PATH);
        },
        onResponse: () => setIsLoading(false),
      }
    );
  }

  return (
    <VStack
      as="form"
      width="full"
      gap={4}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(password);
      }}
    >
      <Heading textAlign="center" size={{ base: 'xl', md: '2xl' }}>
        Create a new password
      </Heading>

      <Field required label="Password" disabled={isLoading}>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      <List.Root variant="plain" alignSelf="self-start">
        {PASSWORD_RULES.map((rule, index) => {
          const matched = rule.regex.test(password);
          return (
            <List.Item
              key={index}
              fontSize="sm"
              color={matched ? 'inherit' : 'GrayText'}
            >
              <List.Indicator
                asChild
                color={matched ? 'green.500' : 'GrayText'}
              >
                {matched ? (
                  <CircleCheck size={14} />
                ) : (
                  <CircleDashed size={14} />
                )}
              </List.Indicator>
              {rule.text}
            </List.Item>
          );
        })}
      </List.Root>
      {error && <Alert status="error" title={error} />}
      <Button
        type="submit"
        width="full"
        borderRadius="full"
        loadingText="Submitting..."
        loading={isLoading}
        disabled={!isValid || isLoading}
      >
        Submit
      </Button>

      <ChakraLink
        fontSize="sm"
        fontWeight={500}
        textDecoration="underline"
        asChild
      >
        <NextLink href={LOGIN_PATH}>Go back to sign in</NextLink>
      </ChakraLink>
    </VStack>
  );
}
