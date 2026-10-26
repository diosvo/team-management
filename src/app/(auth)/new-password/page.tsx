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
import { useTranslations } from 'next-intl';

import { Alert } from '@/components/ui/alert';
import { Field } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { toaster } from '@/components/ui/toaster';

import authClient from '@/lib/auth-client';
import { authErrorMessage } from '@/utils/rate-limit';

import { LOGIN_PATH } from '@/routes';

const PASSWORD_RULES = [
  {
    key: 'length',
    regex: /^.{8,128}$/,
  },
  {
    key: 'letter',
    regex: /[a-zA-Z]/,
  },
  {
    key: 'number',
    regex: /[0-9]/,
  },
  {
    key: 'special',
    regex: /[^a-zA-Z0-9]/,
  },
] as const;

export default function NewPasswordPage() {
  const t = useTranslations('auth');
  const tError = useTranslations('auth.errors');
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
        onError: (context) => setError(authErrorMessage(context, tError)),
        onSuccess: () => {
          toaster.success({
            title: t('newPassword.success'),
          });
          router.push(LOGIN_PATH);
        },
        onResponse: () => setIsLoading(false),
      },
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
        {t('newPassword.heading')}
      </Heading>

      <Field required label={t('password')} disabled={isLoading}>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      <List.Root variant="plain" alignSelf="self-start">
        {PASSWORD_RULES.map((rule) => {
          const matched = rule.regex.test(password);
          return (
            <List.Item
              key={rule.key}
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
              {t(`newPassword.rules.${rule.key}`)}
            </List.Item>
          );
        })}
      </List.Root>
      {error && <Alert status="error" title={error} />}
      <Button
        type="submit"
        width="full"
        borderRadius="full"
        loadingText={t('newPassword.submitting')}
        loading={isLoading}
        disabled={!isValid || isLoading}
      >
        {t('newPassword.submit')}
      </Button>

      <ChakraLink
        fontSize="sm"
        fontWeight={500}
        textDecoration="underline"
        asChild
      >
        <NextLink href={LOGIN_PATH}>{t('backToSignIn')}</NextLink>
      </ChakraLink>
    </VStack>
  );
}
