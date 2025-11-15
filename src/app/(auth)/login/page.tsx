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
import { useForm } from 'react-hook-form';

import { Alert } from '@/components/ui/alert';
import { Field } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';

import authClient from '@/lib/auth-client';

import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { LoginSchema, LoginValues } from '@/schemas/auth';

export default function LoginPage() {
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(LoginSchema),
  });

  async function onSubmit(values: LoginValues) {
    setError(undefined);
    await authClient.signIn.email(
      {
        ...values,
        callbackURL: DEFAULT_LOGIN_REDIRECT,
      },
      {
        onRequest: () => setIsLoading(true),
        onError: ({ error }) => setError(error.message || error.statusText),
        onResponse: () => setIsLoading(false),
      }
    );
  }

  return (
    <VStack
      as="form"
      gap={4}
      alignItems="stretch"
      onSubmit={handleSubmit(onSubmit)}
    >
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
        <Input autoFocus autoComplete="email" {...register('email')} />
      </Field>
      <Field
        required
        label="Password"
        disabled={isLoading}
        invalid={!!errors.password}
        errorText={errors.password?.message}
      >
        <PasswordInput {...register('password')} />
      </Field>

      <ChakraLink
        fontSize="sm"
        fontWeight={500}
        textDecoration="underline"
        asChild
      >
        <NextLink href="/forgot-password">Forgot your password?</NextLink>
      </ChakraLink>

      {error && <Alert status="error" title={error} />}

      <Button
        type="submit"
        borderRadius="full"
        loadingText="Directing..."
        loading={isLoading}
        disabled={isLoading}
      >
        Sign In
      </Button>
    </VStack>
  );
}
