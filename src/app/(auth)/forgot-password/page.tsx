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
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { Alert } from '@/components/ui/alert';
import { Field } from '@/components/ui/field';

import authClient from '@/lib/auth-client';
import { getDefaults } from '@/lib/zod';

import { authErrorMessage } from '@/utils/rate-limit';
import type { Response } from '@/utils/response';

import { LOGIN_PATH } from '@/routes';
import {
  ForgotPasswordSchema,
  type ForgotPasswordValues,
} from '@/schemas/auth';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const tError = useTranslations('auth.errors');
  const [response, setResponse] = useState<Response>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    reset,
    register,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: getDefaults(ForgotPasswordSchema),
  });

  useEffect(() => {
    // Ensure previous state is clear when component is mounted
    reset();
    setResponse(undefined);
  }, []);

  async function onSubmit(values: ForgotPasswordValues) {
    await authClient.requestPasswordReset(
      {
        email: values.email,
        redirectTo: '/new-password',
      },
      {
        onRequest: () => setIsLoading(true),
        onError(context) {
          setResponse({
            success: false,
            message: authErrorMessage(context, tError),
          });
        },
        onSuccess: () => {
          reset();
          setResponse({
            success: true,
            message: t('forgotPassword.sent'),
          });
        },
        onResponse: () => setIsLoading(false),
      },
    );
  }

  return (
    <VStack
      as="form"
      gap={4}
      alignItems="center"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Heading size={{ base: 'xl', md: '2xl' }}>
        {t('forgotPassword.heading')}
      </Heading>

      <Field
        required
        label={t('email')}
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
        loadingText={t('forgotPassword.submitting')}
        loading={isLoading}
        disabled={!isValid || isLoading}
      >
        {t('forgotPassword.submit')}
      </Button>

      <ChakraLink
        fontSize="sm"
        textAlign="center"
        fontWeight={500}
        textDecoration="underline"
        asChild
      >
        <NextLink href={LOGIN_PATH}>{t('backToSignIn')}</NextLink>
      </ChakraLink>
    </VStack>
  );
}
