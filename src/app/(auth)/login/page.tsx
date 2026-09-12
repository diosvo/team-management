'use client';

import NextLink from 'next/link';
import { useState } from 'react';

import {
  Button,
  Link as ChakraLink,
  Heading,
  Input,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { addSeconds } from 'date-fns';
import { useForm } from 'react-hook-form';

import { Alert } from '@/components/ui/alert';
import { Field } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';

import authClient from '@/lib/auth-client';
import { formatTime } from '@/utils/formatter';

import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { LoginSchema, type LoginValues } from '@/schemas/auth';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { isDirty, isValid, errors },
  } = useForm({
    resolver: zodResolver(LoginSchema),
  });

  const { root } = errors;
  // Credentials were rejected: the user has to adjust email or password first.
  const isUnauthorized = root?.type === 'unauthorized';

  // Let a new attempt through as soon as either credential is edited.
  const resetUnauthorized = () => {
    if (isUnauthorized) clearErrors('root');
  };

  async function onSubmit(values: LoginValues) {
    clearErrors('root');
    await authClient.signIn.email({
      ...values,
      callbackURL: DEFAULT_LOGIN_REDIRECT,
      fetchOptions: {
        onRequest: () => setIsLoading(true),
        onError: async (context) => {
          const { error, response } = context;
          if (response.status === 429) {
            const retryAfter = response.headers.get('X-Retry-After');
            const retryAt = addSeconds(new Date(), Number(retryAfter));

            setError('root', {
              type: 'rate_limit',
              message: `Rate limit exceeded. Retry at ${formatTime(retryAt)}`,
            });
            return;
          }

          setError('root', {
            type: response.status === 401 ? 'unauthorized' : 'server',
            message: error.message || error.statusText,
          });
        },
        onResponse: () => setIsLoading(false),
      },
    });
  }

  return (
    <form method="POST" onSubmit={handleSubmit(onSubmit)}>
      <VStack gap={4} alignItems="stretch">
        <Heading size={{ base: 'xl', md: '2xl' }} textAlign="center">
          Sign in to your account
        </Heading>

        <Field
          required
          label="Email"
          disabled={isLoading}
          invalid={!!errors.email}
          errorText={errors.email?.message}
        >
          <Input
            autoFocus
            autoComplete="email"
            {...register('email', { onChange: resetUnauthorized })}
          />
        </Field>
        <Field
          required
          label="Password"
          disabled={isLoading}
          invalid={!!errors.password}
          errorText={errors.password?.message}
        >
          <PasswordInput
            autoComplete="current-password"
            {...register('password', { onChange: resetUnauthorized })}
          />
        </Field>

        <ChakraLink
          fontSize="sm"
          fontWeight={500}
          textDecoration="underline"
          asChild
        >
          <NextLink href="/forgot-password">Forgot your password?</NextLink>
        </ChakraLink>

        {root?.message && <Alert status="error" title={root.message} />}

        <Button
          type="submit"
          borderRadius="full"
          loadingText="Directing..."
          loading={isLoading}
          disabled={!isDirty || !isValid || isLoading || isUnauthorized}
        >
          Sign In
        </Button>
      </VStack>
    </form>
  );
}
