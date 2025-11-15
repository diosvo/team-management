'use client';

import NextLink from 'next/link';
import { useEffect, useState } from 'react';

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

import { getDefaults } from '@/lib/zod';
import { Response } from '@/utils/response';

import authClient from '@/lib/auth-client';
import { LOGIN_PATH } from '@/routes';
import { LoginSchema, LoginValues } from '@/schemas/auth';

export default function ForgotPasswordPage() {
  const [response, setResponse] = useState<Response>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    reset,
    register,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: getDefaults(LoginSchema),
  });

  useEffect(() => {
    // Ensure previous state is clear when component is mounted
    reset();
    setResponse(undefined);
  }, []);

  async function onSubmit(values: LoginValues) {
    await authClient.requestPasswordReset(
      {
        email: values.email,
        redirectTo: LOGIN_PATH,
      },
      {
        onRequest: () => setIsLoading(true),
        onError({ error }) {
          setResponse({
            success: false,
            message: error.message || error.statusText,
          });
        },
        onResponse: () => setIsLoading(false),
      }
    );
  }

  return (
    <VStack
      as="form"
      gap={4}
      alignItems="center"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Heading size={{ base: 'xl', md: '2xl' }}>Forgot your password?</Heading>

      <Field
        required
        label="Email"
        disabled={isLoading}
        invalid={!!errors.email}
        errorText={errors.email?.message}
      >
        <Input
          type="email"
          autoFocus
          autoComplete="email"
          {...register('email')}
        />
      </Field>

      {response && (
        <Alert
          status={response.success ? 'success' : 'error'}
          title={response.message}
        />
      )}

      <Button
        type="submit"
        width="full"
        borderRadius="full"
        loadingText="Sending..."
        loading={isLoading}
        disabled={!isValid || isLoading}
      >
        Send request password instruction
      </Button>

      <ChakraLink
        fontSize="sm"
        textAlign="center"
        fontWeight={500}
        textDecoration="underline"
        asChild
      >
        <NextLink href={LOGIN_PATH}>Go back to sign in</NextLink>
      </ChakraLink>
    </VStack>
  );
}
